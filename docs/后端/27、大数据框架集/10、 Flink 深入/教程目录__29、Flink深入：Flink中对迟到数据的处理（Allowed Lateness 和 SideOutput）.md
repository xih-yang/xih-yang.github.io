# 29、Flink深入：Flink中对迟到数据的处理（Allowed Lateness 和 SideOutput）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/29.html
- 分类：大数据框架
- 分组：教程目录
## 1. 需求描述

```java
有订单数据,格式为: (订单ID，用户ID，时间戳/事件时间，订单金额)
要求每隔5s,计算5秒内，每个用户的订单总金额
并添加Watermaker来解决一定程度上的数据延迟和数据乱序问题。
并使用OutputTag+allowedLateness解决数据丢失问题
```

## 2. API说明

## 3. 侧输出流（SideOutput）概述

大部分的DataStream API的算子的输出是单一输出，也就是某种数据类型的流。除了split算子，可以将一条流分成多条流，这些流的数据类型也都相同。

process function的side outputs功能可以产生多条流，并且这些流的数据类型可以不一样。一个side output可以定义为OutputTag[X]对象，X是输出流的数据类型。process function可以通过Context对象发射一个事件到一个或者多个side outputs。当然，窗口中的.sideOutputLateData()方法也能生成侧输出流。

下面是一个演示在process方法中输出侧输出流的示例程序：

```java
val monitoredReadings: DataStream[SensorReading] = readings
  .process(new FreezingMonitor)
monitoredReadings
  .getSideOutput(new OutputTag[String]("freezing-alarms"))
  .print()
readings.print()
```

接下来我们实现FreezingMonitor函数，用来监控传感器温度值，将温度值低于32F的温度输出到side output。

```java
class FreezingMonitor extends ProcessFunction[SensorReading, SensorReading] {
  // 定义一个侧输出标签
  lazy val freezingAlarmOutput: OutputTag[String] =
    new OutputTag[String]("freezing-alarms")
  override def processElement(r: SensorReading,
                              ctx: ProcessFunction[SensorReading, SensorReading]#Context,
                              out: Collector[SensorReading]): Unit = {
    // 温度在32F以下时，输出警告信息
    if (r.temperature < 32.0) {
      ctx.output(freezingAlarmOutput, s"Freezing Alarm for ${r.id}")
    }
    // 所有数据直接常规输出到主流
    out.collect(r)
  }
}
```

## 4. 代码演示

```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.SourceFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.OutputTag;
import java.time.Duration;
import java.util.Random;
import java.util.UUID;
public class WatermakerDemo03_AllowedLateness {
    public static void main(String[] args) throws Exception {
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
                    long eventTime = System.currentTimeMillis() - random.nextInt(10) * 1000;
                    ctx.collect(new Order(orderId, userId, money, eventTime));
                    //TimeUnit.SECONDS.sleep(1);
                }
            }
            @Override
            public void cancel() {
                flag = false;
            }
        });
        //3.Transformation
        DataStream<Order> watermakerDS = orderDS
                .assignTimestampsAndWatermarks(
                        WatermarkStrategy.<Order>forBoundedOutOfOrderness(Duration.ofSeconds(3))
                                .withTimestampAssigner((event, timestamp) -> event.getEventTime())
                );
        //代码走到这里,就已经被添加上Watermaker了!接下来就可以进行窗口计算了
        //要求每隔5s,计算5秒内(基于时间的滚动窗口)，每个用户的订单总金额
        OutputTag<Order> outputTag = new OutputTag<>("Seriouslylate", TypeInformation.of(Order.class));
        SingleOutputStreamOperator<Order> result = watermakerDS
                .keyBy(Order::getUserId)
                //.timeWindow(Time.seconds(5), Time.seconds(5))
                .window(TumblingEventTimeWindows.of(Time.seconds(5)))
                .allowedLateness(Time.seconds(5))
                .sideOutputLateData(outputTag)
                .sum("money");
        DataStream<Order> result2 = result.getSideOutput(outputTag);
        //4.Sink
        result.print("正常的数据和迟到不严重的数据");
        result2.print("迟到严重的数据");
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
