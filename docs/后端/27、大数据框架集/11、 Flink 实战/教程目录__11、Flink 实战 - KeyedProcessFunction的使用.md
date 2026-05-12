# 11、Flink 实战 - KeyedProcessFunction的使用
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/11.html
- 分类：大数据框架
- 分组：教程目录
## 一、前言

KeyedProcessFunction是用来处理KeyedStream的。每有一个数据进入算子，则会触发一次processElement()的处理。它还提供了计时器的功能，在特定场景下，非常适合。

## 二、结构

KeyedProcessFunction继承AbstractRichFunction，它和ProcessFunction类似，都有processElement()、onTimer()，且都是富函数，自然有open()和close()方法。

### 1. processElement

先看下processElement的参数，依次是输入值、上下文、输出值。

```java
public abstract void processElement(I value, Context ctx, Collector<O> out)
```

- 每一个数据进入算子，都会执行processElement处理它
- 返回0、1、多个输出值

### 2. 上下文的使用

（1）获取当前流的key

```java
ctx.getCurrentKey()
```

（2）侧输出流

```java
OutputTag<SensorRecord> lowTempTag = new OutputTag<>("lowTemp");
if (value.getRecord()< 10){
    ctx.output(lowTempTag, value);
}
```

（3）时间服务

事件时间

注意Watermark是整个数据流的，和在KeyBy之前还是之后没有关系，Watermark和source的并行度有关，如果在自己测试调试功能时，可以先暂时设置并行度为1，方便测试。

```java
//获取当前数据流的水位线
long currentWatermark = ctx.timerService().currentWatermark();
//设置定时器的时间为当前水位线+10秒
long ts = currentWatermark + 10000L;
//注册事件时间定时器
ctx.timerService().registerEventTimeTimer(ts);
//删除事件时间定时器
ctx.timerService().deleteEventTimeTimer(ts);
```

处理时间

```java
//获取当前数据处理时间
long currentProcessTime = ctx.timerService().currentProcessingTime();
//设置定时器的时间为当前水位线+10秒
long ts = currentProcessTime + 10000L;
//注册处理时间定时器
ctx.timerService().registerProcessingTimeTimer(ts);
//删除处理时间定时器
ctx.timerService().deleteProcessingTimeTimer(ts);
```

### 3. onTimer

在定时器满足时间条件时，会触发onTimer，可以用out输出返回值。

```java
public void onTimer(long timestamp, OnTimerContext ctx, Collector<O> out)
```

## 三、温度报警案例

### 1. 温度记录实体

```java
public class TempRecord {
    private String province;
    private String city;
    private String deviceId;
    private Double temp;
    private LocalDateTime eventTime;
	省略其它。。。
}
```

### 2. 主程序

```java
public class Test06_KeyedProcessFunction {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //从Flink1.12开始，默认为EventTime了，所以下面一句可以省略
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        DataStreamSource<String> source = env.socketTextStream(BaseConstant.URL, BaseConstant.PORT);
        SingleOutputStreamOperator<TempRecord> dataStream = source
                .flatMap(new TempRecordUtils.BeanFlatMap())
                .assignTimestampsAndWatermarks(
                        WatermarkStrategy.<TempRecord>forBoundedOutOfOrderness(Duration.ofSeconds(1))
                                .withTimestampAssigner(new SerializableTimestampAssigner<TempRecord>() {
                                    @Override
                                    public long extractTimestamp(TempRecord element, long recordTimestamp) {
                                        return element.getTimeEpochMilli();
                                    }
                                })
                );
        dataStream
                .keyBy(TempRecord::getCity)
                .process(new MyKeyedProcessFunction(30)).print();
        env.execute();
    }
}
```

### 3. 自定义KeyedProcessFunction实现温度报警

```java
public static class MyKeyedProcessFunction extends KeyedProcessFunction<String, TempRecord, String> {
    private int timeInterval;
    public MyKeyedProcessFunction() {
    }
    public MyKeyedProcessFunction(int timeInterval) {
        this.timeInterval = timeInterval;
    }
    //上次温度state
    private transient ValueState<Double> lastTempState;
    //上次温度描述
    private transient ValueStateDescriptor<Double> lastTempDescriptor;
    //结束时间
    private transient ValueState<Long> timeToStopState;
    //结束时间描述
    private transient ValueStateDescriptor<Long> timeToStopDescriptor;
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        lastTempDescriptor = new ValueStateDescriptor<Double>("last-temp", Double.class);
        timeToStopDescriptor = new ValueStateDescriptor<Long>("time-to-stop", Long.class);
    }
    // 一个窗口结束的时候调用一次（一个分组执行一次），不适合大量数据，全量数据保存在内存中，会造成内存溢出
    @Override
    public void processElement(TempRecord value, Context ctx, Collector<String> out) throws Exception {
        lastTempState = getRuntimeContext().getState(lastTempDescriptor);
        if (lastTempState.value() == null) {
            lastTempState.update(Double.MIN_VALUE);
        }
        timeToStopState = getRuntimeContext().getState(timeToStopDescriptor);
        if (timeToStopState.value() == null) {
            timeToStopState.update(0L);
        }
        Double lastTemp = lastTempState.value();
        Long timeToStop = timeToStopState.value();
        if (lastTemp < value.getTemp()) {
            if (timeToStop.equals(0L)) {
                long currentWatermark = ctx.timerService().currentWatermark();
                System.out.println("currentWatermark = " + currentWatermark);
                Long ts = currentWatermark + timeInterval * 1000L;
                if (ts > 0) {
                    ctx.timerService().registerEventTimeTimer(ts);
                    timeToStopState.update(ts);
                }
            }
        } else {
            if (timeToStopState.value() != null && !timeToStopState.value().equals(0L)) {
                ctx.timerService().deleteEventTimeTimer(timeToStopState.value());
            }
            timeToStopState.clear();
        }
        lastTempState.update(value.getTemp());
    }
    @Override
    public void onTimer(long timestamp, OnTimerContext ctx, Collector<String> out) throws Exception {
        super.onTimer(timestamp, ctx, out);
        //定时器触发，输出报警信息
        String time = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(ctx.timerService().currentWatermark()), ZoneId.systemDefault()
        ).format(FormatterConstant.commonDtf);
        out.collect(ctx.getCurrentKey() + "在" + time + "前一段时间温度值连续上升");
        timeToStopState.clear();
    }
    @Override
    public void close() throws Exception {
        super.close();
        lastTempState.clear();
        timeToStopState.clear();
    }
}
```
