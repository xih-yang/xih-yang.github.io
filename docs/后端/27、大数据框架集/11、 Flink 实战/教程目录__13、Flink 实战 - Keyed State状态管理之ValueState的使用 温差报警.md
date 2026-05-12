# 13、Flink 实战 - Keyed State状态管理之ValueState的使用 温差报警
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/13.html
- 分类：大数据框架
- 分组：教程目录
## 一、ValueState的方法

ValueState的使用比较简单，方法如下图

- 用ValueStateDescriptor定义ValueState的描述器
- value()方法获取值
- update(T value)方法更新值

## 二、实验案例

### 1. 温度Bean

```java
public class SensorRecord {
    private String id;
    private Double lastRecord;
    private Double record;
    private LocalDateTime time;
    //省略其他get set
	//将Long类型的时间值
    public Long getTimeEpochMilli() {
        return time.toInstant(ZoneOffset.of("+8")).toEpochMilli();
    }
}
```

### 2. 将字符串映射成SensorRecord对象

```java
/**
 * 将字符串映射成SensorRecord对象
 */
public static class BeanMap implements MapFunction<String, SensorRecord> {
    @Override
    public SensorRecord map(String s) throws Exception {
        if (StringUtils.isNotBlank(s)) {
            String[] split = s.split(",");
            if (split != null && split.length == 3) {
                return new SensorRecord(
                        split[0],
                        Double.valueOf(split[1]),
                        LocalDateTime.parse(split[2], FormatterConstant.commonDtf));
            }
        }
        return null;
    }
}
```

### 3. ValueStateDescriptor描述器

描述器：指定id=last-temp，和类型是Double类型

```java
//描述器：指定id=last-temp，和类型是Double
ValueStateDescriptor<Double> lastTempDescriptor = new ValueStateDescriptor<Double>(
        "last-temp",
        Double.class);
lastTemp = getRuntimeContext().getState(lastTempDescriptor);
```

### 4. 程序主体

指定温差超过10就返回

```java
public class Test01_ValueState {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //方便测试，设置为1
        env.setParallelism(1);
        DataStreamSource<String> source = env.socketTextStream(BaseConstant.URL, BaseConstant.PORT);
        /*
        设置watermark和指定时间属性
         */
        SingleOutputStreamOperator<SensorRecord> dataStream = source
                .map(new SensorRecordUtils.BeanMap())
                .assignTimestampsAndWatermarks(
                        WatermarkStrategy.<SensorRecord>forBoundedOutOfOrderness(Duration.ofSeconds(1))
                                .withTimestampAssigner(new SerializableTimestampAssigner<SensorRecord>() {
                                    @Override
                                    public long extractTimestamp(SensorRecord element, long recordTimestamp) {
                                        return element.getTimeEpochMilli();
                                    }
                                })
                );
        dataStream
                .keyBy(SensorRecord::getId)
                .process(new MyKeyedProcessFunction(10))
                .print();
        env.execute();
    }
}
```

### 5. KeyedProcessFunction处理数据流

```java
public static class MyKeyedProcessFunction extends KeyedProcessFunction<String, SensorRecord, SensorRecord> {
    private int tempDiff;
    public MyKeyedProcessFunction(int tempDiff) {
        this.tempDiff = tempDiff;
    }
    private transient ValueState<Double> lastTemp;
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        ValueStateDescriptor<Double> lastTempDescriptor = new ValueStateDescriptor<Double>(
                "last-temp",
                Double.class);
        lastTemp = getRuntimeContext().getState(lastTempDescriptor);
    }
    @Override
    public void processElement(SensorRecord value, Context ctx, Collector<SensorRecord> out) throws Exception {
        //第一条数据，需要处理
        if (lastTemp.value() == null){
            lastTemp.update(Double.MIN_VALUE);
        }
        //从第二条数据开始比较两者的差值
        else if (Math.abs(value.getRecord() - lastTemp.value()) > tempDiff){
            value.setLastRecord(lastTemp.value());
            out.collect(value);
        }
        //value state 记录最新的值
        if (value.getRecord() != null){
            lastTemp.update(value.getRecord());
        }
    }
}
```
