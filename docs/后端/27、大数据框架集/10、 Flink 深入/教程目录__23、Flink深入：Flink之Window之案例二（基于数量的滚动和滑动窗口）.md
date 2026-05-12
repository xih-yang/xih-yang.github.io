# 23、Flink深入：Flink之Window之案例二（基于数量的滚动和滑动窗口）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/23.html
- 分类：大数据框架
- 分组：教程目录
## 1. 需求描述

```java
需求1:统计在最近5条消息中,各自路口通过的汽车数量,相同的key每出现5次进行统计--基于数量的滚动窗口
需求2:统计在最近5条消息中,各自路口通过的汽车数量,相同的key每出现3次进行统计--基于数量的滑动窗口
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
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * nc -lk 9999
 * 有如下数据表示:
 * 信号灯编号和通过该信号灯的车的数量
9,3
9,2
9,7
4,9
2,6
1,5
2,3
5,7
5,4
 * 需求1:统计在最近5条消息中,各自路口通过的汽车数量,相同的key每出现5次进行统计--基于数量的滚动窗口
 * 需求2:统计在最近5条消息中,各自路口通过的汽车数量,相同的key每出现3次进行统计--基于数量的滑动窗口
 */
public class WindowDemo02_CountWindow {
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
        // * 需求1:统计在最近5条消息中,各自路口通过的汽车数量,相同的key每出现5次进行统计--基于数量的滚动窗口
        //countWindow(long size, long slide)
        SingleOutputStreamOperator<CartInfo> result1 = cartInfoDS
                .keyBy(CartInfo::getSensorId)
                //.countWindow(5L, 5L)
                .countWindow( 5L)
                .sum("count");
        // * 需求2:统计在最近5条消息中,各自路口通过的汽车数量,相同的key每出现3次进行统计--基于数量的滑动窗口
        //countWindow(long size, long slide)
        SingleOutputStreamOperator<CartInfo> result2 = cartInfoDS
                .keyBy(CartInfo::getSensorId)
                .countWindow(5L, 3L)
                .sum("count");
        //4.Sink
        //result1.print();
        /*
1,1
1,1
1,1
1,1
2,1
1,1
         */
        result2.print();
        /*
1,1
1,1
2,1
1,1
2,1
3,1
4,1
         */
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

## 3. Scala代码演示计数窗口的滚动和滑动

```java
val env: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
env.setParallelism(1)
val sensorStream: DataStream[SensorReading] = env
    .readTextFile("D:\\Project\\IDEA\\bigdata-study\\flink-demo\\src\\main\\resources\\source.txt")
    .map(new MyMapToSensorReading)
// 1、滚动窗口
val tumbleWindow: DataStream[SensorReading] = sensorStream
    .keyBy(_.id)
    .countWindow(5)
    .reduce((x, y) => SensorReading(x.id, y.timestamp, x.temperature + y.temperature))
// 2、滑动窗口
val slideWindows: DataStream[SensorReading] = sensorStream
    .keyBy(_.id)
    .countWindow(5, 2)
    .reduce((x, y) => SensorReading(x.id, y.timestamp, x.temperature + y.temperature))
slideWindows.print()
env.execute("CountWindowDemo")
```
