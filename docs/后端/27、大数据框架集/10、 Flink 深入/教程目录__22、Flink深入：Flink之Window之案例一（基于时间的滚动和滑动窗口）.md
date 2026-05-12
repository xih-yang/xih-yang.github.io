# 22、Flink深入：Flink之Window之案例一（基于时间的滚动和滑动窗口）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/22.html
- 分类：大数据框架
- 分组：教程目录
## 1. 需求描述

```java
nc -lk 9999
有如下数据表示:
信号灯编号和通过该信号灯的车的数量
9,3
9,2
9,7
4,9
2,6
1,5
2,3
5,7
5,4
需求1:每5秒钟统计一次，最近5秒钟内，各个路口通过红绿灯汽车的数量--基于时间的滚动窗口
需求2:每5秒钟统计一次，最近10秒钟内，各个路口通过红绿灯汽车的数量--基于时间的滑动窗口
```

## 2. 代码演示

```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.SlidingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
public class WindowDemo01_TimeWindow {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.Source
        DataStreamSource<String> socketDS = env.socketTextStream("node1", 9999);
        //3.Transformation
        //将9,3转为CartInfo(9,3)
        SingleOutputStreamOperator<CartInfo> cartInfoDS = socketDS.map(new MapFunction<String, CartInfo>() {
            @Override
            public CartInfo map(String value) throws Exception {
                String[] arr = value.split(",");
                return new CartInfo(arr[0], Integer.parseInt(arr[1]));
            }
        });
        //分组
        //KeyedStream<CartInfo, Tuple> keyedDS = cartInfoDS.keyBy("sensorId");
        // * 需求1:每5秒钟统计一次，最近5秒钟内，各个路口/信号灯通过红绿灯汽车的数量--基于时间的滚动窗口
        //timeWindow(Time size窗口大小, Time slide滑动间隔)
        SingleOutputStreamOperator<CartInfo> result1 = cartInfoDS
                .keyBy(CartInfo::getSensorId)
                //.timeWindow(Time.seconds(5))//当size==slide,可以只写一个
                //.timeWindow(Time.seconds(5), Time.seconds(5))
                .window(TumblingProcessingTimeWindows.of(Time.seconds(5)))
                .sum("count");
        // * 需求2:每5秒钟统计一次，最近10秒钟内，各个路口/信号灯通过红绿灯汽车的数量--基于时间的滑动窗口
        SingleOutputStreamOperator<CartInfo> result2 = cartInfoDS
                .keyBy(CartInfo::getSensorId)
                //.timeWindow(Time.seconds(10), Time.seconds(5))
                .window(SlidingProcessingTimeWindows.of(Time.seconds(10), Time.seconds(5)))
                .sum("count");
        //4.Sink
        /*
         1,5
         2,5
         3,5
         4,5
        */
        //result1.print();
        result2.print();
        //5.execute
        env.execute();
    }
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CartInfo {
        private String sensorId;//信号灯id
        private Integer count;//通过该信号灯的车的数量
    }
}
```

## 3. Scala代码演示时间窗口的滚动和滑动

```java
val env: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
env.setParallelism(1)
val sensorStream: DataStream[SensorReading] = env
    .socketTextStream("localhost", 9999)
    .map(new MyMapToSensorReading)
// 1、使用window方法进行开窗设置
// 1.1、滚动窗口
/**
 * 知识点：
 * 1、在该方法中，可以使用 TumblingProcessingTimeWindows 和 TumblingEventTimeWindows 类，分别是创建处理时间窗口 和 事件时间窗口（事件时间窗口需要设置时间特性）
 * 2、滚动窗口中，of方法可以设置2个参数，第一个是窗口的大小，第二个是时间偏移量（不设置时默认使用伦敦时间，当设置为-8时，为使用北京时间），偏移量设置时需要小于窗口大小
 */
val windowStream_1: DataStream[SensorReading] = sensorStream
    .keyBy(_.id)
    //            .window(TumblingProcessingTimeWindows.of(Time.days(5), Time.hours(-8)))   // 偏移量设置时需要小于窗口大小
    //            .window(TumblingEventTimeWindows.of(Time.seconds(5)))                     // 事件时间窗口
    .window(TumblingProcessingTimeWindows.of(Time.seconds(5)))
    .reduce((x, y) => SensorReading(x.id, y.timestamp, x.temperature + y.temperature))
// 1.2、滑动窗口
/**
 * 知识点：
 * 1、在该方法中，可以使用 TumblingProcessingTimeWindows 和 TumblingEventTimeWindows 类
 * 2、滑动窗口中，of方法可以设置3个参数，第一个是窗口大小，第二个是滑动步长，第三个是偏移量
 */
val windowStream_2: DataStream[SensorReading] = sensorStream
    .keyBy(_.id)
    //            .window(SlidingProcessingTimeWindows.of(Time.days(7), Time.days(1), Time.hours(-8)))  // 偏移量设置时需要小于窗口大小
    //            .window(SlidingEventTimeWindows.of(Time.seconds(20), Time.seconds(5)))                // 事件时间窗口
    .window(SlidingProcessingTimeWindows.of(Time.seconds(20), Time.seconds(5)))
    .reduce((x, y) => SensorReading(x.id, y.timestamp, x.temperature + y.temperature))
// 1.3、会话窗口
val windowStream_3: DataStream[SensorReading] = sensorStream
    .keyBy(_.id)
    //            .window(EventTimeSessionWindows.withGap(Time.minutes(10)))            // 事件时间会话窗口
    .window(ProcessingTimeSessionWindows.withGap(Time.minutes(10)))
    .reduce((x, y) => SensorReading(x.id, y.timestamp, x.temperature + y.temperature))
// 2、使用timeWindow方法进行开窗
// 2.1、滚动窗口
val timeWindowStream_1: DataStream[SensorReading] = sensorStream
    .keyBy(_.id)
    .timeWindow(Time.seconds(5))
    .reduce((x, y) => SensorReading(x.id, y.timestamp, x.temperature + y.temperature))
// 2.2、滑动窗口
val timeWindowStream_2: DataStream[SensorReading] = sensorStream
    .keyBy(_.id)
    .timeWindow(Time.seconds(15), Time.seconds(5))
    .reduce((x, y) => SensorReading(x.id, y.timestamp, x.temperature + y.temperature))
windowStream_1.print()
env.execute("TimeWindowDemo")
```
