# 24、Flink深入：Flink之Window之案例三（会话窗口）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/24.html
- 分类：大数据框架
- 分组：教程目录
## 1. 需求描述

```java
设置会话超时时间为10s,10s内没有数据到来,则触发上个窗口的计算
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
import org.apache.flink.streaming.api.windowing.assigners.ProcessingTimeSessionWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
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
 * 需求:设置会话超时时间为10s,10s内没有数据到来,则触发上个窗口的计算(前提是上一个窗口得有数据!)
 */
public class WindowDemo03_SessionWindow {
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
        //需求:设置会话超时时间为10s,10s内没有数据到来,则触发上个窗口的计算(前提是上一个窗口得有数据!)
        SingleOutputStreamOperator<CartInfo> result = cartInfoDS.keyBy(CartInfo::getSensorId)
                .window(ProcessingTimeSessionWindows.withGap(Time.seconds(10)))
                .sum("count");
        //4.Sink
        result.print();
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
