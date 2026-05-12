# 25、Flink深入：Flink之Window之Function的使用
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/25.html
- 分类：大数据框架
- 分组：教程目录
## 1. 使用Java求日活的WindowFunction使用

```java
// 设置时间语议，并过滤其中的首页曝光数据
DataStream<AppLogBean> homeExposureStream = appExposureStream
        .assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor<AppLogBean>(Time.seconds(0)) {
            @Override
            public long extractTimestamp(AppLogBean element) {
                return element.getTime() * 1000;
            }
        })
        .filter(new FilterFunction<AppLogBean>() {
            @Override
            public boolean filter(AppLogBean value) throws Exception {
                return "home_exposure".equals(value.getTopic()) && StringUtils.isNotBlank(value.getScdata());
            }
        });
// 获取出其中的用户id
SingleOutputStreamOperator<Tuple2<String, String>> userIdStream = homeExposureStream
        .map(new MapFunction<AppLogBean, Tuple2<String, String>>() {
            @Override
            public Tuple2<String, String> map(AppLogBean appLogBean) throws Exception {
                String resultUserId = "1";
                JSONObject scdataJson = JSONObject.parseObject(appLogBean.getScdata());
                String user_id = scdataJson.getString("user_id");
                resultUserId = user_id;
                return Tuple2.of("dummy", resultUserId);
            }
        });
// 对用户id开窗，并统计每天的数据
SingleOutputStreamOperator<String> result = userIdStream
        .keyBy(t -> t.f0)
        .window(TumblingEventTimeWindows.of(Time.days(1), Time.hours(-8)))
        .trigger(ContinuousEventTimeTrigger.of(Time.seconds(1)))
        .aggregate(new UniqueVisitorAggregateFunction(), new UniqueVisitorProcessWindowFunction());
// 使用print打印数据
result.print("result>>>>>>>>>");
}
/**
* UV的窗口类
*/
public static class UniqueVisitorProcessWindowFunction extends ProcessWindowFunction<Long, String, String, TimeWindow> {
private final FastDateFormat df = FastDateFormat.getInstance("yyyy-MM-dd HH:mm:ss");
@Override
public void process(String s, Context context, Iterable<Long> elements, Collector<String> out) throws Exception {
    System.out.println("##### 当前的watermark为" + df.format(context.currentWatermark()));
    System.out.println("##### 窗口开始时间######" + df.format(context.window().getStart()));
    System.out.println("##### 窗口结束时间######" + df.format(context.window().getEnd()));
    System.out.println("##### 该窗口当前统计的UV" + elements.iterator().next());
    out.collect("UV " + elements.iterator().next());
}
}
/**
* UV的聚合类
*/
public static class UniqueVisitorAggregateFunction implements AggregateFunction<Tuple2<String, String>, Tuple2<Set<String>, Long>, Long> {
@Override
public Tuple2<Set<String>, Long> createAccumulator() {
    return Tuple2.of(new HashSet<>(), 0L);
}
@Override
public Tuple2<Set<String>, Long> add(Tuple2<String, String> value, Tuple2<Set<String>, Long> accumulator) {
    if (!accumulator.f0.contains(value.f1)) {
        accumulator.f0.add(value.f1);
        accumulator.f1 += 1;
    }
    return accumulator;
}
@Override
public Long getResult(Tuple2<Set<String>, Long> accumulator) {
    return accumulator.f1;
}
@Override
public Tuple2<Set<String>, Long> merge(Tuple2<Set<String>, Long> a, Tuple2<Set<String>, Long> b) {
    return null;
}
```

## 2. 使用Scala演示WindowFunction的使用

```java
val env: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
env.setParallelism(1)
val sensorStream: WindowedStream[SensorReading, String, TimeWindow] = env
    .socketTextStream("localhost", 9999)
    .map(new MyMapToSensorReading)
    .keyBy(_.id)
    .timeWindow(Time.seconds(5))
// 1、incremental aggregation functions（增量聚合函数）（来一条数据，计算一次）
// 1.1、ReduceFunction 增量集合函数（使用匿名内部类）
val reduceResult: DataStream[SensorReading] = sensorStream.reduce(new ReduceFunction[SensorReading] {
    override def reduce(value1: SensorReading, value2: SensorReading): SensorReading = {
        SensorReading(value2.id, value2.timestamp, value2.temperature + value2.temperature)
    }
})
// 1.2、AggregateFunction（相比reduce，优势是可以指定累加值类型，输入类型和输出类型也可以不一样）
val aggregateResult: DataStream[Long] = sensorStream.aggregate(new AggregateFunction[SensorReading, Long, Long] {
    // 初始化累加值
    override def createAccumulator(): Long = 0L
    // 累加方法
    override def add(value: SensorReading, accumulator: Long): Long = accumulator + 1
    // 获取结果
    override def getResult(accumulator: Long): Long = accumulator
    // 分区的归并操作
    override def merge(a: Long, b: Long): Long = a + b
})
// 2、full window functions（全窗口函数）
/**
 * 知识点：
 *  1、apply方法中，可以添加WindowFunction对象，会将该窗口中所有的数据先缓存，当时间到了一次性计算
 *  2、需要设置4个类型，分别是：输入类型，输出类型，keyBy时key的类型（如果用字符串来划分key类型为Tuple，窗口类型
 *  3、所有的计算都在apply中进行，可以通过window获取窗口的信息，比如开始时间，结束时间
 */
val applyResult: DataStream[(Long, Int)] = sensorStream.apply(new WindowFunction[SensorReading, (Long, Int), String, TimeWindow] {
    override def apply(key: String, window: TimeWindow, input: Iterable[SensorReading], out: Collector[(Long, Int)]): Unit = {
        out.collect((window.getStart, input.size))
    }
})
// 3、窗口函数中其他API
val otherResult: DataStream[SensorReading] = sensorStream
    .allowedLateness(Time.seconds(1))                       // 允许处理迟到的数据
    .sideOutputLateData(new OutputTag[SensorReading]("late"))    // 将迟到的数据放入侧输出流
    .reduce((x, y) => SensorReading(y.id, y.timestamp, x.temperature + y.temperature))
// 获取侧输出流（侧输出流为迟到很久的数据，当allowedLateness和watermark之后还是没到的数据会放入侧输出流，可以在最后统一处理）
val sideOutputStream: DataStream[SensorReading] = otherResult.getSideOutput(new OutputTag[SensorReading]("late"))
// 打印输出
applyResult.print()
env.execute("WindowFunctionDemo")
```
