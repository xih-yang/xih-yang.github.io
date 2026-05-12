# 17、Flink 实战 - Keyed State状态管理之AggregatingState使用案例 求平均值
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/17.html
- 分类：大数据框架
- 分组：教程目录
## 一、AggregatingState的方法

- AggregatingState需要和AggregateFunction配合使用
- add()方法添加一个元素，触发AggregateFunction计算
- get()获取State的值

## 二、AggregatingState描述器

在定义描述器时，第二个参数需要AggregateFunction类

```java
//定义描述器
AggregatingStateDescriptor aggregatingStateDescriptor = new AggregatingStateDescriptor(
         "avg-temp",
         new SensorRecordUtils.MyAvgTemp(),
         TypeInformation.of(new TypeHint<Tuple2<Double, Integer>>(){
     })
 );
//获取ReducingState
aggregatingState = getRuntimeContext().getAggregatingState(aggregatingStateDescriptor);
```

## 三、自定义的AggregateFunction类

Flink求平均值，Tuple2的第一个参数时当前温度总和，第二个参数是数据的个数。

getResult里accumulator.f0 / accumulator.f1就求得了平均值。

```java
public static class MyAvgTemp implements AggregateFunction<SensorRecord, Tuple2<Double, Integer>, Double> {
    @Override
    public Tuple2<Double, Integer> createAccumulator() {
        return Tuple2.of(0.0, 0);
    }
    @Override
    public Tuple2<Double, Integer> add(SensorRecord value, Tuple2<Double, Integer> accumulator) {
        Integer currentCount = accumulator.f1;
        currentCount += 1;
        accumulator.f1 = currentCount;
        return new Tuple2<>(accumulator.f0 + value.getRecord(), accumulator.f1);
    }
    @Override
    public Double getResult(Tuple2<Double, Integer> accumulator) {
        return accumulator.f0 / accumulator.f1;
    }
    @Override
    public Tuple2<Double, Integer> merge(Tuple2<Double, Integer> a, Tuple2<Double, Integer> b) {
        return new Tuple2<>(a.f0 + b.f0, a.f1 + b.f1);
    }
}
```

## 四、程序主体

```java
public class Test06_AggregatingState {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //方便测试，设置为1
        env.setParallelism(1);
        DataStreamSource<String> source = env.socketTextStream(BaseConstant.URL, BaseConstant.PORT);
        /*
        设置watermark和指定时间属性
         */
        SingleOutputStreamOperator<SensorRecord> dataStream = source
                .map(new SensorRecordUtils.BeanMap());
        dataStream
                .keyBy(SensorRecord::getId)
                .process(new MyKeyedProcessFunction())
                .print();
        env.execute();
    }
}
```

## 五、KeyedProcessFunction处理类

```java
public static class MyKeyedProcessFunction extends KeyedProcessFunction<String, SensorRecord, Tuple2<String, Double>> {
    private transient AggregatingState aggregatingState;
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        //定义描述器
        AggregatingStateDescriptor aggregatingStateDescriptor = new AggregatingStateDescriptor(
                "avg-temp",
                new SensorRecordUtils.MyAvgTemp(),
                TypeInformation.of(new TypeHint<Tuple2<Double, Integer>>(){
     })
        );
        //获取ReducingState
        aggregatingState = getRuntimeContext().getAggregatingState(aggregatingStateDescriptor);
    }
    @Override
    public void processElement(SensorRecord value, Context ctx, Collector<Tuple2<String, Double>> out) throws Exception {
        aggregatingState.add(value);
        out.collect(Tuple2.of(value.getId(), (Double) aggregatingState.get()) );
    }
}
```
