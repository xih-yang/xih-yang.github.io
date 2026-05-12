# 12、Flink 笔记 - 时间语义和watermark
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/12.html
- 分类：大数据框架
- 分组：教程目录
## 一、时间语义

在Flink 中涉及到三个重要时间概念：EventTime、IngestionTime、ProcessingTime。

## 1.1、EventTime

EventTime 表示日志事件产生的时间戳，每一条数据都会记录自己生产的时间。

## 1.2、IngestionTime

IngestionTime 表示 数据进入 Flink程序的时间

## 1.3、ProcessingTime

ProcessingTime 表示数据被计算处理时间，默认Flink时间属性就是ProcessingTime。

## 1.4、总结

一般来说，EventTime比较重要，并且实际应用也多。比如说，在游戏里，有一个关卡要求在一分钟内完成才能过关，一个用户一进入关卡就会产生一条记录并打上该记录的产生时间戳，发往服务器。但是该用户正好处于搭地跌（假设网络信号不好），假设用户已经在搭地铁过程中完成任务，并产生相对应的数据（带时间戳）。假设用户搭完地铁出站，但是此过程中维持了两三分钟，如果采用服务器的系统时间，那么程序就会判定该用户并没有通过该关卡。如果采用日志产生时间，程序会比较两条数据的时间戳之差是否在一分钟内，如果是，在通过。

## 二、引入 EventTime

在Flink 的流式处理中，绝大部分的业务都会使用 eventTime，代码中引入，如下：

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        /**
         * 参数 TimeCharacteristic 有三种类型：
         * ProcessingTime,
         * IngestionTime,
         * EventTime;
         */
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
```

## 三、引入 watermark

## 3.1、基本概念

日志数据产生经过网络传输，流经source，到transform，这过程中是需要时间的，大部分的数据都是按照事件时间顺序来的，但是也不排除网络等其他因素，导致数据的乱序。所谓乱序，就是指 Flink 接收到的事件的先后顺序不是严格按照事件的 Event Time 顺序排列的。比如说

理想情况下：

7，6，5，4，3，2，1（数据是从1开始的）

实际情况下：

6，3，5，7，4，2，1

那么此时出现一个问题，一旦出现乱序，如果只根据 eventTime 决定 window 的运行，我们不能明确数据是否全部到位，但又不能无限期的等下去，此时必须要有个机制来保证一个特定的时间后，必须触发 window 去进行计算了，这个特别的机制，就是 Watermark。

## 3.2、watermark 作用

Watermark 是一种衡量 Event Time 进展的机制。

Watermark 是用于处理乱序事件的，而正确的处理乱序事件，通常用Watermark 机制结合 window 来实现。

## 3.3、watermark 案例

比如说：统计滚动窗口大小为5秒（时间戳的EventTime）

第1条数据的时间戳是：101

第2条数据的时间戳是：104

第3条数据的时间戳是：105（如果不做任何处理，已经触发窗口函数计算，那么数据结果就会不正确）

第4条数据的时间戳是：102

第5条数据的时间戳是：103

第6条数据的时间戳是：107

第7条数据的时间戳是：106

第8条数据的时间戳是：110 （如果也不做任何处理，已经触发函数计算，那么数据结果还是不正确）

上面就是乱序数据不做任何处理的情况，导致数据不准确。

如何解决？

可以让窗口函数延迟一会在计算，至于多久，具体情况具体分析，还是要看数据的。

如何延迟？（假设窗口触发计算范围为 [100-105)，[105-110) 这些窗口范围不是根据第一条数据的EventTime计算的，而是根据 1979-01-01 00:00:00 开始计算，比如你要统计1个小时的窗口 那么窗口大小只能是这种情况 [00:00,01:00）[01:00,02:00) )

此时可以采用watermark来延迟窗口触发计算。基于上面的数据情况可以延迟2秒触发窗口计算（后面有具体案例代码实现）。

假设第一条数据来了，数据时间戳为 101，那么此时的最大maxEvenTime就是 101，那么此时的watermark=maxEventTime - 延迟时间 2s = 99

第二条数据来了，数据时间戳为 104，那么此时的最大maxEventTime为 102，watermark = maxEventTime - 延迟时间 2s = 102 ，watermrk 表示 时间戳102之前的数据全部来了，也就是[100,102)间的数据全部到了

第三条数据来了，数据时间戳为105，那么此时的最大 maxEventTime 就是105，watermark = 103。正常情况下第三条数据来了就开始执行窗口计算，但是已经设置了watermark水位线

第四条数据来了，数据时间戳为102，那么此时的最大 maxTimeEvent还是105，它会比较的，然后总是保存maxEventTime。watermark 总是等于 maxEventTime - 延迟时间 2s

第五条数据来了，maxEventTime = 105 matermark = 103

第六条数据来了，数据时间戳为 107，那么此时的最大 maxEventTime = 107，watermark = 107 - 延迟 2s = 105，此时窗口[100,105)触发窗口函数，把窗口收集的数据开始计算

以此类推，下一个窗口[105,100)触发的时间条件为 maxEventTIme = 112 watermark = 112 -2

## 3.4、watermark 代码案例

根据传感器id计算最近5秒内的最大温度

```java
import com.tan.flink.bean.SensorReading;
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.shaded.guava18.com.google.common.collect.Lists;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.timestamps.BoundedOutOfOrdernessTimestampExtractor;
import org.apache.flink.streaming.api.functions.windowing.WindowFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
public class EventTime_Watermark {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        // 1、设置 EventTime 语义
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        // 2、读取数据
        DataStreamSource<String> inputDataStream = env.socketTextStream("localhost", 9999);
        // 3、切割数据
        SingleOutputStreamOperator<SensorReading> sensorDataStream = inputDataStream.flatMap(new CustomFlatMap());
        // 4、提取并设置 eventTime
        /**
         * 分配时间戳和watermark
         * SensorReading -> 输入类型
         * Time.seconds(2L）-> 延迟时间
         * 本质最终的结果是 watermark
         */
        SingleOutputStreamOperator<SensorReading> watermarkDataStream = sensorDataStream.assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor<SensorReading>(Time.seconds(2L)) {
            @Override
            public long extractTimestamp(SensorReading sensorReading) {
                // 提取 eventTime 需要注意的是 该 eventTime 是毫秒单位，如果 sensorReading 的时间戳是以秒单位需要 乘以 1000
                return sensorReading.getTimestamp();
            }
        });
        // 5、分组计算
        SingleOutputStreamOperator<String> resultDataStream = watermarkDataStream.keyBy("id")
                .timeWindow(Time.seconds(5L))
                .apply(new CustomWindowFunction());
        resultDataStream.print();
        env.execute();
    }
    public static class CustomFlatMap implements FlatMapFunction<String, SensorReading> {
        @Override
        public void flatMap(String input, Collector<SensorReading> collector) throws Exception {
            String[] fields = input.split(",");
            String id = fields[0];
            long timestamp = Long.parseLong(fields[1]);
            double temperature = Double.parseDouble(fields[2]);
            collector.collect(new SensorReading(id, timestamp, temperature));
        }
    }
    /**
     * SensorReading -> 输入数据的类型
     * String -> 输出数据类型
     * Tuple -> key 类型
     * TimeWindow -> 窗口类型
     */
    public static class CustomWindowFunction implements WindowFunction<SensorReading, String, Tuple, TimeWindow> {
        @Override
        public void apply(Tuple tuple, TimeWindow timeWindow, Iterable<SensorReading> iterable, Collector<String> collector) throws Exception {
            ArrayList<SensorReading> sensorReadings = Lists.newArrayList(iterable.iterator());
            //  排序取出最大温度
            Collections.sort(sensorReadings, new Comparator<SensorReading>() {
                @Override
                public int compare(SensorReading o1, SensorReading o2) {
                    return o1.getTemperature() >= o2.getTemperature() ? 1 : -1;
                }
            });
            SensorReading sensorReading = sensorReadings.get(0);
            Double maxTemperature = sensorReading.getTemperature();
            // 获取时间窗口范围
            long start = timeWindow.getStart();
            long end = timeWindow.getEnd();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            Date startDate = new Date(start);
            String startDateTime = sdf.format(startDate);
            Date endDate = new Date(end);
            String endDateTime = sdf.format(endDate);
            String resultStr = tuple.toString() + " 在" + startDateTime + " - " + endDateTime + " 最大温度为 " + maxTemperature;
            collector.collect(resultStr);
        }
    }
}
```

终端输入：

sensor_1,1547718201000,20

sensor_1,1547718205000,30

sensor_1,1547718207000,50

sensor_1,1547718212000,40

sensor_1,1547718217000,30

sensor_1,1547718223000,20

控制台输出：

(sensor_1) 在2019-01-17 17:43:20 - 2019-01-17 17:43:25 最大温度为 20.0

(sensor_1) 在2019-01-17 17:43:25 - 2019-01-17 17:43:30 最大温度为 30.0

(sensor_1) 在2019-01-17 17:43:30 - 2019-01-17 17:43:35 最大温度为 40.0

(sensor_1) 在2019-01-17 17:43:35 - 2019-01-17 17:43:40 最大温度为 30.0

注意的是：如果一直没有数据来，那么当前窗口就一直不会触发窗口函数计算。

## 四、watermark assigner

一个问题：watermark 什么时候更新？是不是一来数据就更新呢？那如果不来数据就一直不更新吗？Flink 会每隔一段时间就会更新watermark，至于什么时候更新？有两种类型：

AssignerWithPeriodicWatermarks

AssignerWithPunctuatedWatermarks

以上两个接口都继承自 TimestampAssigner。

## 4.1、Assigner with periodic watermarks（周期性更新）

### 4.1.1、概述

周期性的生成 watermark：系统会周期性的将 watermark 插入到流中(水位线也是一种特殊的事件!)。默认周期是 200 毫秒。可以使用

ExecutionConfig.setAutoWatermarkInterval()方法进行设置。

代码如下：

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // 设置 EventTime 特征
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        // 设置 Watermark 周期性更新
        env.getConfig().setAutoWatermarkInterval(500L);
```

产生watermark 的逻辑：每隔 5 秒钟，Flink 会调用

AssignerWithPeriodicWatermarks 的 getCurrentWatermark()方法。

如果方法返回一个时间戳大于之前水位的时间戳，新的 watermark 会被插入到流中。这个检查保证了水位线是单调递增的。如果方法返回的时间戳小于等于之前水位的时间戳，则不会产生新的watermark。

### 4.1.2、自定义周期提取时间戳 - 案例

假设每隔500毫秒，更新watermark并设置延迟时间为2秒。自定义周期提取时间戳类，需要实现AssignerWithPeriodicWatermarks接口。

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.AssignerWithPeriodicWatermarks;
import org.apache.flink.streaming.api.watermark.Watermark;
import org.apache.flink.streaming.api.windowing.time.Time;
import javax.annotation.Nullable;
public class Watermark_CustomPeriodicWatermark {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        env.getConfig().setAutoWatermarkInterval(500L);
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<SensorReading> resultDataStream = inputDataStream.keyBy("id")
                .assignTimestampsAndWatermarks(new CustomPeriodicWatermark())
                .timeWindowAll(Time.seconds(5L))
                .maxBy("temperature");
        resultDataStream.print();
        env.execute();
    }
    /**
     * SensorReading -> 输入类型
     */
    public static class CustomPeriodicWatermark implements AssignerWithPeriodicWatermarks<SensorReading> {
        // 延迟时间
        private long bound = 2 * 1000;
        // 最大事件时间戳
        private long maxEventTime = Long.MIN_VALUE;
        // 返回 获取当前 watermark
        @Nullable
        @Override
        public Watermark getCurrentWatermark() {
            return new Watermark(maxEventTime - bound);
        }
        // 提取日志数据事件时间戳
        @Override
        public long extractTimestamp(SensorReading sensorReading, long lastEventTime) {
            // 判断当前数据的事件时间戳是否大于当前窗口（数据集）的最大事件时间戳
            // 如果是 则更新 maxEventTime 否则不做任何处理
            maxEventTime = Math.max(sensorReading.getTimestamp(), maxEventTime);
            // 返回当前数据的时间戳
            return sensorReading.getTimestamp();
        }
    }
}
```

当前的效果和watermark代码案例相似，注意数据源不同。

## 4.2、Assigner with punctuated watermarks（间断性更新）

### 4.2.1、概述

间断式地生成 watermark。和周期性生成的方式不同，这种方式不是固定时间的，而是可以根据需要对每条数据进行筛选和处理。

### 4.2.2、自定义间断性提取时间戳 - 案例

根据传感器id等于sensor_1的数据，才提取相对应的watermark，插入数据流中。需要实现AssignerWithPunctuatedWatermarks接口。

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.AssignerWithPunctuatedWatermarks;
import org.apache.flink.streaming.api.watermark.Watermark;
import javax.annotation.Nullable;
public class Watermark_CustomPunctuatedWatermark {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        // 不再设置周期行性获取watermark
        // env.getConfig().setAutoWatermarkInterval(500L);
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<SensorReading> resultDataStream = inputDataStream.assignTimestampsAndWatermarks(new CustomPunctuatedWatermark());
        resultDataStream.print();
        env.execute();
    }
    public static class CustomPunctuatedWatermark implements AssignerWithPunctuatedWatermarks<SensorReading> {
        // 延迟 2s
        private long bound = 2 * 1000L;
        /**
         * @param lastElement      -> 上一条数据
         * @param extractTimestamp -> 当前数据的时间戳 根据 extractTimestamp 方法获取
         * @return
         */
        @Nullable
        @Override
        public Watermark checkAndGetNextWatermark(SensorReading lastElement, long extractTimestamp) {
            // 如果上一条数据的id 等于 sensor_1 则更新时间戳 否则返回 null
            if ("sensor_1".equals(lastElement.getId())) {
                return new Watermark(extractTimestamp - bound);
            } else {
                return null;
            }
        }
        /**
         * @param sensorReading            -> 当前数据
         * @param previousElementTimestamp -> 上一条数据的事件事件戳
         * @return
         */
        @Override
        public long extractTimestamp(SensorReading sensorReading, long previousElementTimestamp) {
            return sensorReading.getTimestamp();
        }
    }
}
```

## 4.3、总结

### 4.3.1、有序情况下

一种简单的特殊情况是，如果我们事先得知数据流的时间戳是单调递增的，也就是说没有乱序，那我们可以使用AscendingTimestampExtractor，这个类会直接使用数据的时间戳生成 watermark。

```java
inputDataStream.assignTimestampsAndWatermarks(new AscendingTimestampExtractor<SensorReading>() {
            @Override
            public long extractAscendingTimestamp(SensorReading sensorReading) {
                return sensorReading.getTimestamp();
            }
        });
```

### 4.3.2、无序情况下

而对于乱序数据流，如果我们能大致估算出数据流中的事件的最大延迟时间。

```java
inputDataStream.assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor<SensorReading>(Time.seconds(2L)) {
            @Override
            public long extractTimestamp(SensorReading sensorReading) {
                return sensorReading.getTimestamp();
            }
        });
```
