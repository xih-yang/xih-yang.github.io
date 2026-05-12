# 16、Flink 实战 - Keyed State状态管理之ReducingState使用案例 求最大值
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/16.html
- 分类：大数据框架
- 分组：教程目录
## 一、ReducingState的方法

- ReducingState是和ReduceFunction配合使用
- get() 获取状态的值
- add(IN value)方法添加一个元素，触发reduceFunction计算一次

## 二、ReducingState的描述器

ReducingState的描述器和之前ValueState、ListState不同，它得和一个ReduceFunction配合使用。

所以得先实现一个ReduceFunction，例如下面这个计算最高温度的。

```java
public static class MyMaxTemp implements ReduceFunction<SensorRecord> {
    @Override
    public SensorRecord reduce(SensorRecord value1, SensorRecord value2) throws Exception {
        return value1.getRecord() >= value2.getRecord() ? value1 : value2;
    }
}
```

ReducingStateDescriptor第2个参数传new SensorRecordUtils.MyMaxTemp()。

以后每次来一个数据，都会执行这个MyMaxTemp的reduce()方法。

```java
//用ReducingStateDescriptor定义描述器
    ReducingStateDescriptor reducingStateDescriptor = new ReducingStateDescriptor(
            "max-temp-state",//id
            new SensorRecordUtils.MyMaxTemp(),//ReduceFunction
            SensorRecord.class);//状态里的值的类型
//获取ReducingState
reducingState = getRuntimeContext().getReducingState(reducingStateDescriptor);
```

## 三、程序主体

```java
public class Test05_ReduceState {
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

## 四、KeyedProcessFunction处理类

```java
public static class MyKeyedProcessFunction extends KeyedProcessFunction<String, SensorRecord, SensorRecord> {
    private transient ReducingState reducingState;
    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        //用ReducingStateDescriptor定义描述器
        ReducingStateDescriptor reducingStateDescriptor = new ReducingStateDescriptor(
                "max-temp-state",//id
                new SensorRecordUtils.MyMaxTemp(),//ReduceFunction
                SensorRecord.class);//状态里的值的类型
        //获取ReducingState
        reducingState = getRuntimeContext().getReducingState(reducingStateDescriptor);
    }
    @Override
    public void processElement(SensorRecord value, Context ctx, Collector<SensorRecord> out) throws Exception {
        reducingState.add(value);
        out.collect((SensorRecord) reducingState.get());
    }
}
```

运行结果：
