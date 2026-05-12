# 22、Flink 实战 - 窗口 interval join的使用案例
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/22.html
- 分类：大数据框架
- 分组：教程目录
## 一、前言

在之前的博客[两条流关联 window窗口的 join leftJoin使用案例](/zhuanlan/bigdata/flink/6/12.html)中，介绍了window join的使用方法。

但是window join可能稍微复杂和麻烦，现在在真实的工作中，用interval join的情况比较多。

interval join相对逻辑简单，好理解些。

## 二、interval join介绍

- interval join只支持事件时间的场景
- 只能支持两条流的关联
- 在右流上划分一个范围区间，左流关联右流

例如：
左流是一个商品发布上线的数据流

右流是一个用户点击浏览商品的数据流

在右流上划分边界：右流下界不偏移，上界偏移20分钟

那就计算商品上线的20分钟内，用户点击它浏览的数据

## 三、语法案例

用之前的博客[两条流关联 window窗口的 join leftJoin使用案例](/zhuanlan/bigdata/flink/6/12.html)中的代码，稍作修改。

```java
public class Test13_IntervalJoin {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<String> leftSource = env.socketTextStream(BaseConstant.URL, 9901);
        DataStreamSource<String> rightSource = env.socketTextStream(BaseConstant.URL, 9902);
        WatermarkStrategy<SensorRecord> strategy = WatermarkStrategy.<SensorRecord>forBoundedOutOfOrderness(Duration.ofSeconds(1))
                .withTimestampAssigner(new SerializableTimestampAssigner<SensorRecord>() {
                    @Override
                    public long extractTimestamp(SensorRecord element, long recordTimestamp) {
                        return element.getTimeEpochMilli();
                    }
                });
        DataStream<SensorRecord> leftStream = leftSource
                .map(new SensorRecordUtils.BeanMap())
                .filter(a -> a != null)
                .assignTimestampsAndWatermarks(strategy);
        DataStream<SensorRecord> rightStream = rightSource
                .map(new SensorRecordUtils.BeanMap())
                .filter(a -> a != null)
                .assignTimestampsAndWatermarks(strategy);
        KeyedStream<SensorRecord, String> keyedStreamLeft = leftStream.keyBy(SensorRecord::getId);
        KeyedStream<SensorRecord, String> keyedStreamRight = rightStream.keyBy(SensorRecord::getId);
        keyedStreamLeft
                .intervalJoin(keyedStreamRight)
                .between(Time.minutes(-5), Time.minutes(5))
                .process(new ProcessJoinFunction<SensorRecord, SensorRecord, SensorRecord>() {
                    @Override
                    public void processElement(SensorRecord left, SensorRecord right, Context ctx, Collector<SensorRecord> out) throws Exception {
                        left.setLastRecord(right.getRecord());
                        out.collect(left);
                    }
                })
                .print();
        env.execute();
    }
}
```
