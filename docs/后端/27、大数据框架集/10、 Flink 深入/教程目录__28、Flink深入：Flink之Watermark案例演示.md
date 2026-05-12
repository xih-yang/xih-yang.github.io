# 28、Flink深入：Flink之Watermark案例演示
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/28.html
- 分类：大数据框架
- 分组：教程目录
## 1. 需求描述

```java
有订单数据,格式为: (订单ID，用户ID，时间戳/事件时间，订单金额)
要求每隔5s,计算5秒内，每个用户的订单总金额
并添加Watermaker来解决一定程度上的数据延迟和数据乱序问题。
```

## 2. API说明

注意:一般我们都是直接使用Flink提供好的BoundedOutOfOrdernessTimestampExtractor

## 3. Java代码实现一（开发中使用）

[Apache Flink 1.12 Documentation: Generating Watermarks](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/event_timestamps_watermarks.html)

```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.SourceFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import java.time.Duration;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * 模拟实时订单数据,格式为: (订单ID，用户ID，订单金额，时间戳/事件时间)
 * 要求每隔5s,计算5秒内(基于时间的滚动窗口)，每个用户的订单总金额
 * 并添加Watermaker来解决一定程度上的数据延迟和数据乱序问题。
 */
public class WatermakerDemo01_Develop {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.Source
        //模拟实时订单数据(数据有延迟和乱序)
        DataStream<Order> orderDS = env.addSource(new SourceFunction<Order>() {
            private boolean flag = true;
            @Override
            public void run(SourceContext<Order> ctx) throws Exception {
                Random random = new Random();
                while (flag) {
                    String orderId = UUID.randomUUID().toString();
                    int userId = random.nextInt(3);
                    int money = random.nextInt(100);
                    //模拟数据延迟和乱序!
                    long eventTime = System.currentTimeMillis() - random.nextInt(5) * 1000;
                    ctx.collect(new Order(orderId, userId, money, eventTime));
                    TimeUnit.SECONDS.sleep(1);
                }
            }
            @Override
            public void cancel() {
                flag = false;
            }
        });
        //3.Transformation
        //-告诉Flink要基于事件时间来计算!
        //env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);//新版本默认就是EventTime
        //-告诉Flnk数据中的哪一列是事件时间,因为Watermaker = 当前最大的事件时间 - 最大允许的延迟时间或乱序时间
        /*DataStream<Order> watermakerDS = orderDS.assignTimestampsAndWatermarks(
                new BoundedOutOfOrdernessTimestampExtractor<Order>(Time.seconds(3)) {//最大允许的延迟时间或乱序时间
                    @Override
                    public long extractTimestamp(Order element) {
                        return element.eventTime;
                        //指定事件时间是哪一列,Flink底层会自动计算:
                        //Watermaker = 当前最大的事件时间 - 最大允许的延迟时间或乱序时间
                    }
        });*/
        DataStream<Order> watermakerDS = orderDS
                .assignTimestampsAndWatermarks(
                        WatermarkStrategy.<Order>forBoundedOutOfOrderness(Duration.ofSeconds(3))
                                .withTimestampAssigner((event, timestamp) -> event.getEventTime())
                );
        //代码走到这里,就已经被添加上Watermaker了!接下来就可以进行窗口计算了
        //要求每隔5s,计算5秒内(基于时间的滚动窗口)，每个用户的订单总金额
        DataStream<Order> result = watermakerDS
                .keyBy(Order::getUserId)
                //.timeWindow(Time.seconds(5), Time.seconds(5))
                .window(TumblingEventTimeWindows.of(Time.seconds(5)))
                .sum("money");
        //4.Sink
        result.print();
        //5.execute
        env.execute();
    }
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Order {
        private String orderId;
        private Integer userId;
        private Integer money;
        private Long eventTime;
    }
}
```

## 4. Java代码实现二（验证版-了解）

```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.time.FastDateFormat;
import org.apache.flink.api.common.eventtime.*;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.SourceFunction;
import org.apache.flink.streaming.api.functions.windowing.WindowFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * 模拟实时订单数据,格式为: (订单ID，用户ID，订单金额，时间戳/事件时间)
 * 要求每隔5s,计算5秒内(基于时间的滚动窗口)，每个用户的订单总金额
 * 并添加Watermaker来解决一定程度上的数据延迟和数据乱序问题。
 */
public class WatermakerDemo02_Check {
    public static void main(String[] args) throws Exception {
        FastDateFormat df = FastDateFormat.getInstance("HH:mm:ss");
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //2.Source
        //模拟实时订单数据(数据有延迟和乱序)
        DataStreamSource<Order> orderDS = env.addSource(new SourceFunction<Order>() {
            private boolean flag = true;
            @Override
            public void run(SourceContext<Order> ctx) throws Exception {
                Random random = new Random();
                while (flag) {
                    String orderId = UUID.randomUUID().toString();
                    int userId = random.nextInt(3);
                    int money = random.nextInt(100);
                    //模拟数据延迟和乱序!
                    long eventTime = System.currentTimeMillis() - random.nextInt(5) * 1000;
                    System.out.println("发送的数据为: "+userId + " : " + df.format(eventTime));
                    ctx.collect(new Order(orderId, userId, money, eventTime));
                    TimeUnit.SECONDS.sleep(1);
                }
            }
            @Override
            public void cancel() {
                flag = false;
            }
        });
        //3.Transformation
        /*DataStream<Order> watermakerDS = orderDS
                .assignTimestampsAndWatermarks(
                        WatermarkStrategy.<Order>forBoundedOutOfOrderness(Duration.ofSeconds(3))
                                .withTimestampAssigner((event, timestamp) -> event.getEventTime())
                );*/
        //开发中直接使用上面的即可
        //学习测试时可以自己实现
        DataStream<Order> watermakerDS = orderDS
                .assignTimestampsAndWatermarks(
                        new WatermarkStrategy<Order>() {
                            @Override
                            public WatermarkGenerator<Order> createWatermarkGenerator(WatermarkGeneratorSupplier.Context context) {
                                return new WatermarkGenerator<Order>() {
                                    private int userId = 0;
                                    private long eventTime = 0L;
                                    private final long outOfOrdernessMillis = 3000;
                                    private long maxTimestamp = Long.MIN_VALUE + outOfOrdernessMillis + 1;
                                    @Override
                                    public void onEvent(Order event, long eventTimestamp, WatermarkOutput output) {
                                        userId = event.userId;
                                        eventTime = event.eventTime;
                                        maxTimestamp = Math.max(maxTimestamp, eventTimestamp);
                                    }
                                    @Override
                                    public void onPeriodicEmit(WatermarkOutput output) {
                                        //Watermaker = 当前最大事件时间 - 最大允许的延迟时间或乱序时间
                                        Watermark watermark = new Watermark(maxTimestamp - outOfOrdernessMillis - 1);
                                        System.out.println("key:" + userId + ",系统时间:" + df.format(System.currentTimeMillis()) + ",事件时间:" + df.format(eventTime) + ",水印时间:" + df.format(watermark.getTimestamp()));
                                        output.emitWatermark(watermark);
                                    }
                                };
                            }
                        }.withTimestampAssigner((event, timestamp) -> event.getEventTime())
                );
        //代码走到这里,就已经被添加上Watermaker了!接下来就可以进行窗口计算了
        //要求每隔5s,计算5秒内(基于时间的滚动窗口)，每个用户的订单总金额
       /* DataStream<Order> result = watermakerDS
                 .keyBy(Order::getUserId)
                //.timeWindow(Time.seconds(5), Time.seconds(5))
                .window(TumblingEventTimeWindows.of(Time.seconds(5)))
                .sum("money");*/
        //开发中使用上面的代码进行业务计算即可
        //学习测试时可以使用下面的代码对数据进行更详细的输出,如输出窗口触发时各个窗口中的数据的事件时间,Watermaker时间
        DataStream<String> result = watermakerDS
                .keyBy(Order::getUserId)
                .window(TumblingEventTimeWindows.of(Time.seconds(5)))
                //把apply中的函数应用在窗口中的数据上
                //WindowFunction<IN, OUT, KEY, W extends Window>
                .apply(new WindowFunction<Order, String, Integer, TimeWindow>() {
                    @Override
                    public void apply(Integer key, TimeWindow window, Iterable<Order> input, Collector<String> out) throws Exception {
                        //准备一个集合用来存放属于该窗口的数据的事件时间
                        List<String> eventTimeList = new ArrayList<>();
                        for (Order order : input) {
                            Long eventTime = order.eventTime;
                            eventTimeList.add(df.format(eventTime));
                        }
                        String outStr = String.format("key:%s,窗口开始结束:[%s~%s),属于该窗口的事件时间:%s",
                                key.toString(), df.format(window.getStart()), df.format(window.getEnd()), eventTimeList);
                        out.collect(outStr);
                    }
                });
        //4.Sink
        result.print();
        //5.execute
        env.execute();
    }
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Order {
        private String orderId;
        private Integer userId;
        private Integer money;
        private Long eventTime;
    }
}
```

## 5. Scala代码实现

```java
import com.ouyang.bean.SensorReading
import com.ouyang.customfunction.MyMapToSensorReading
import org.apache.flink.streaming.api.TimeCharacteristic
import org.apache.flink.streaming.api.functions.AssignerWithPeriodicWatermarks
import org.apache.flink.streaming.api.functions.timestamps.BoundedOutOfOrdernessTimestampExtractor
import org.apache.flink.streaming.api.scala._
import org.apache.flink.streaming.api.watermark.Watermark
import org.apache.flink.streaming.api.windowing.time.Time
/**
 * @ Date:2020/12/4
 * @ Author:yangshibiao
 * @ Desc:Flink中的Watermark
 */
object WatermarkDemo {
    def main(args: Array[String]): Unit = {
        val env: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
        env.setParallelism(1)
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime)
        // 设置生成watermark的时间间隔，系统默认为200毫秒，一般使用系统默认即可
        env.getConfig.setAutoWatermarkInterval(5000)
        val sensorStream: DataStream[SensorReading] = env
            .readTextFile("D:\\Project\\IDEA\\bigdata-study\\flink-demo\\src\\main\\resources\\source.txt")
            .map(new MyMapToSensorReading)
        // 1、引入Watermark（使用已有的类）
        // 1.1、给一个没有乱序，时间为升序的流设置一个EventTime
        val ascendingStream: DataStream[SensorReading] = sensorStream.assignAscendingTimestamps(_.timestamp)
        // 1.2、当流中存在时间乱序问题，引入watermark，并设置延迟时间
        /**
         * 知识点：
         * 1、BoundedOutOfOrdernessTimestampExtractor中的泛型为流中数据的类型
         * 2、传入的参数为 watermark 的最大延迟时间（即允许数据迟到的时间）
         * 3、重写的extractTimestamp方法返回的是设置数据中EventTime的字段，单位为毫秒，需要将时间转换成Long（最近时间为13位的长整形）才能返回
         * 4、当我们能大约估计到流中的最大乱序时，建议使用此中方式，比较方便
         */
        val watermarkStream: DataStream[SensorReading] = sensorStream.assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor[SensorReading](Time.seconds(1)) {
            override def extractTimestamp(element: SensorReading): Long = {
                element.timestamp * 1000
            }
        })
        // 2、使用 TimestampAssigner 引入 Watermark
        // 2.1、Assigner with periodic watermarks（周期性引入watermark）
        /**
         * 知识点：
         * 1、系统会周期性的将watermark插入到流中，默认周期是200毫秒，可以使用ExecutionConfig.setAutoWatermarkInterval()方法进行设置，单位为毫秒
         * 2、产生watermark的逻辑：每隔5秒钟，Flink会调用AssignerWithPeriodicWatermarks的getCurrentWatermark()方法，如果大于流中最大watermark就插入，小于就不插入
         * 3、如下，可以自定义一个周期性的时间戳抽取（需要实现 AssignerWithPeriodicWatermarks 接口）
         */
        env.getConfig.setAutoWatermarkInterval(5000)
        val periodicWatermarkStream: DataStream[SensorReading] = sensorStream.assignTimestampsAndWatermarks(new MyPeriodicAssigner(10))
        env.execute("WatermarkDemo")
    }
}
/**
 * 自定义一个周期生成watermark的类
 * @param bound watermark的延时时间（毫秒）
 */
class MyPeriodicAssigner(bound: Long) extends AssignerWithPeriodicWatermarks[SensorReading] {
    // 当前为止的最大时间戳（毫秒）
    var maxTs: Long = Long.MinValue
    /**
     * 获取当前的watermark（默认200毫秒获取一次，可以通过 env.getConfig.setAutoWatermarkInterval(5000) 来设置）
     * @return 当前watermark，当前最大时间戳 - 延时时间
     */
    override def getCurrentWatermark: Watermark = {
        new Watermark(maxTs - bound)
    }
    /**
     * 指定eventTime对应的字段（流中每条数据都会调用一次此方法）
     * @param element 流中的每条数据
     * @param previousElementTimestamp 无
     * @return 当前流的eventTime（单位：毫秒）
     */
    override def extractTimestamp(element: SensorReading, previousElementTimestamp: Long): Long = {
        // 每条数据都获取其中的时间戳，跟最大时间戳取大，并重新赋值给最大时间戳
        maxTs = maxTs.max(element.timestamp * 1000)
        element.timestamp * 1000
    }
}
```
