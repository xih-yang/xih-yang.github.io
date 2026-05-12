# 10、Flink 笔记 - window窗口（一）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/10.html
- 分类：大数据框架
- 分组：教程目录
## 一、window 概述

Flink 通常处理流式、无限数据集的计算引擎，窗口是一种把无限流式数据集切割成有限的数据集进行计算。window窗口在Flink中极其重要。

## 二、window 类型

window 注意分为两大类型：CountWindow 和 TimeWindow

## 2.1、CountWindow

CountWindow 是与时间没有关系的，比如 数据收集的一定大小（1w）的时候就会触发窗口函数进行计算。

## 2.2、TimeWindow

TimeWindow 就是时间窗口，它与时间非常紧密。主要分为三大类：

滚动窗口（Tumbling window）、滑动窗口（Sliding window）、回话窗口（Session window）。

### 2.2.1、滚动窗口（Tumbling Window）

特征：时间对齐，没有重叠，并且时间窗口大小固定

比如：计算五分钟内的数据。窗口起始时间假设为 10:00 那么时间到了 10:05 时刻就会触发 10:00 - 10:05 段时间窗口，注意区间是左闭右开。

### 2.3.2、滑动窗口（Sliding Window）

与滚动窗口不同的是，滑动窗口多了滑动间隔时间，那么就会出现数据的重叠或者数据丢失。如果滑动时间间隔小于滑动窗口大小，那么就是出现数据的重叠，也就是重叠的数据可能被多个窗口计算；如果滑动时间间隔等于滑动窗口大小，那么就相等于滚动窗口；如果滑动时间间隔大于滑动时间窗口，那么就会出现数据的丢失。

比如：每隔1分钟计算五分钟内的数据，假设窗口起始时间为 10:00，那么就会触发 9:55 - 10:00 段的时间窗口，时间到了 10:01，那么就会触发 9:56 - 10:01 段的时间窗口，以此类推，注意窗口都是左闭右开的。

### 2.3.3、回话窗口（Session 窗口）

类似于Web应用的 Session 回话，简单一句话，在一定时间内没有接收到任务数据，那么上一次窗口就触发计算。

比如：5分钟内没有收到任何数据，就触发上一次窗口计算，并重新开一个窗口。假设接收到第一条数据的时间是 9:54（时间任意），目前窗口时间为 10:00 ，那么到了 10:05 并且在 10:00 - 10:05 段时间内没有接收任何数据，就会触发 9:54 - 10:00 段的窗口计算，并重新以 10:05 开一个新的窗口，往后有数据以此类推，如果还是在 10:05 - 10:10 没有数据，其实计不计算都显得不重要了。主要的特征是触发窗口时间不固定，窗口时间也不固定。

## 三、window API

windwo API 核心是窗口适配器（windowAssigner）。windwo(入参) 的入参接受的就是窗口适配器，它负责把数据分发到正确的 window中。但是 Flink 已经提供好了通用的窗口适配器。

## 3.1、TimeWindow

Flink 默认的时间窗口是根据 processing time（处理时间）进行划分和计算。但是应用大多数都是 Event time（事件时间），后面具体介绍，目前window API 默认使用 processing time。窗口还可以分为不同流窗口（也就是 keyby之后的数据）和全窗口（也就是全部数据）。

### 3.1.1、滚动窗口 - 案例

计算传感器五秒之内的最大温度

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.time.Time;
public class TimeWindow_Tumbling {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<SensorReading> resultDataStream = inputDataStream.keyBy("id")
                .timeWindow(Time.seconds(5L)) // 滚动时间窗口大小
                .maxBy("temperature");
        resultDataStream.print();
        env.execute();
    }
}
```

### 3.1.2、滑动窗口 - 案例

每隔2秒计算传感器5秒内的最小温度值

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.time.Time;
public class TimeWindow_Sliding {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<SensorReading> resultDataStream = inputDataStream.keyBy("id")
                .timeWindow(Time.seconds(5L), Time.seconds(2)) // 窗口大小5秒 滑动大小2秒
                .minBy("temperature");
        resultDataStream.print();
        env.execute();
    }
}import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.time.Time;
public class TimeWindow_Sliding {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<SensorReading> resultDataStream = inputDataStream.keyBy("id")
                .timeWindow(Time.seconds(5L), Time.seconds(2)) // 窗口大小5秒 滑动大小2秒
                .minBy("temperature");
        resultDataStream.print();
        env.execute();
    }
}import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.time.Time;
public class TimeWindow_Sliding {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<SensorReading> resultDataStream = inputDataStream.keyBy("id")
                .timeWindow(Time.seconds(5L), Time.seconds(2)) // 窗口大小5秒 滑动大小2秒
                .minBy("temperature");
        resultDataStream.print();
        env.execute();
    }
}
```

## 3.2、CountWindow

CountWindow 根据窗口中相同 key 元素的数量来触发执行，执行时只计算元素数量达到窗口大小的 key 对应的结果。

注意：CountWindow 的 window_size 指的是相同 Key 的元素的个数，不是输入的所有元素的总数。

### 3.2.1、滚动窗口 - 案例

根据传感器id每传来3条数据就计算这些数据的最大温度

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class CountWindow_Tumbling {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<SensorReading> resultDataStream = inputDataStream.keyBy("id")
                .countWindow(3)
                .maxBy("temperature");
        resultDataStream.print();
        env.execute();
    }
}
```

### 3.2.2、滑动窗口 - 案例

根据传感器id每隔2条数据计算最近5条数据的最小温度值

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class CountWindow_Sliding {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<SensorReading> resultDataStream = inputDataStream.keyBy("id")
                .countWindow(5, 2)
                .minBy("temperature");
        resultDataStream.print();
        env.execute();
    }
}
```

## 四、window function

## 4.1、概述

windwo function 主要针对触发窗口计算的操作，主要分为：

增量聚合函数、全窗口函数、其他可选 API。

### 4.1.1、增量聚合函数

简单地说就是，每来一条数据就计算，相当于预聚合，保持一个简单的状态。典型的增量聚合函数有 ReduceFunction、AggregateFunction。

### 4.1.2、全窗口函数

先把全窗口的数据收集起来，等到计算的时候遍历计算。典型的全窗口函数 ProcessWindowFunction、windowFunction。它与增量聚合不同的是，增量聚合来一条数据就会先预聚合，等到窗口触发计算函数；全窗口函数是等窗口函数触发收集该窗口的全部数据一起计算。如果一个窗口数据突然特别多，那么就会造成压力；可以选择增量聚合函数。

### 4.1.3、其他可选 API

#### 4.1.3.1、触发器（trigger()）

触发器它定义 窗口什么时候关闭，触发计算并输出结果

#### 4.1.3.2、移除器（evictor()）

定义移除某些数据的逻辑

#### 4.1.3.3、允许迟到的数据（allowedLateness）

可能某种原因（网络延迟）导致这些数据所在窗口已经触发了计算，所有这些数据可以允许迟到，但是这些数据不会加入其他窗口进行计算，而是输出到侧输出流进行计算。

#### 4.1.3.4、侧输出流（sideOutputLateData()）

将迟到的数据放入侧输出流

#### 4.1.3.5 、获取侧输出流 （getSideOutput()）

### 4.1.4、window function 总揽

#### 4.1.4.1、keyed window

#### 4.1.4.2、Non-keyed window

## 4.2、增量聚合函数 - 案例

### 4.2.1、ReduceFunction - 案例

根据传感器id计算5秒内的的某时刻最大温度

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.api.common.functions.ReduceFunction;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.windowing.WindowFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
public class WindowFunction_ReduceFunction {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<String> resultDataStream = inputDataStream.keyBy("id")
                .timeWindow(Time.seconds(5L))
                .reduce(new CustomReduceFunction(), new CustomWindowFunctiom()); // 第一个参数就是每来一条数据就进行计算 第二个参数就是最终窗口触发计算
        resultDataStream.print();
        env.execute();
    }
    // 输入数据的泛性
    public static class CustomReduceFunction implements ReduceFunction<SensorReading> {
        @Override
        public SensorReading reduce(SensorReading sensorReading, SensorReading input) throws Exception {
            if (sensorReading.getTemperature() > input.getTemperature()) {
                return sensorReading;
            } else {
                return input;
            }
        }
    }
    /**
     * SensorReading -> 输入数据类型
     * String -> 输出类型
     * String -> key 类型
     * TimeWindow -> 窗口类型（TimeWindow 和 GlobalWindow）
     */
    public static class CustomWindowFunctiom implements WindowFunction<SensorReading, String, Tuple, TimeWindow> {
        @Override
        public void apply(Tuple tuple, TimeWindow timeWindow, Iterable<SensorReading> iterable, Collector<String> collector) throws Exception {
            iterable.iterator().forEachRemaining(sensor -> {
                // 拼接输出字符串
                String output = sensor.getId() + "在 " + sensor.getTimestamp() + "最大温度是：" + sensor.getTemperature();
                collector.collect(output);
            });
        }
    }
}
```

### 4.2.2、AggregateFunction - 案例

根据传感器id计算10秒内的平均温度

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.windowing.WindowFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
public class WindowFunction_AggregateFunction {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<String> resultDataStream = inputDataStream.keyBy("id")
                .timeWindow(Time.seconds(10L))
                .aggregate(new CustomAggregateFunction(), new CustomWindowFunction());
        resultDataStream.print();
        env.execute();
    }
    /**
     * SensorReading -> 输入类型
     * Tuple2<Long, Double> -> 保存中间结果状态 也就是 来一条数据 Long + 1   Double + temperature
     * Tuple2<Long, Double> -> 输出结果
     */
    public static class CustomAggregateFunction implements AggregateFunction<SensorReading, Tuple2<Long, Double>, Tuple2<Long, Double>> {
        // 初始化中间状态
        @Override
        public Tuple2<Long, Double> createAccumulator() {
            return new Tuple2<>(0L, 0.0);
        }
        // 累计输入的数据
        @Override
        public Tuple2<Long, Double> add(SensorReading input, Tuple2<Long, Double> tuple2) {
            tuple2.setFields(tuple2.f0 + 1, tuple2.f1 + input.getTemperature());
            return tuple2;
        }
        // 返回
        @Override
        public Tuple2<Long, Double> getResult(Tuple2<Long, Double> tuple2) {
            return tuple2;
        }
        // 区间累加
        @Override
        public Tuple2<Long, Double> merge(Tuple2<Long, Double> input1, Tuple2<Long, Double> input2) {
            Tuple2<Long, Double> result = new Tuple2<>(input1.f0 + input2.f0, input1.f1 + input2.f1);
            return result;
        }
    }
    /**
     * Tuple2<Long,Double> -> 输入结果 也就是 CustomAggregateFunction 中的输出结果
     * Tuple -> key 类型
     * TimeWindow -> 窗口类型
     */
    public static class CustomWindowFunction implements WindowFunction<Tuple2<Long,Double>,String, Tuple, TimeWindow>{
        @Override
        public void apply(Tuple tuple, TimeWindow timeWindow, Iterable<Tuple2<Long, Double>> iterable, Collector<String> collector) throws Exception {
            Tuple2<Long, Double> result = iterable.iterator().next();
            double avgTemp = result.f1 / result.f0;
            String resultStr = tuple + "在10秒内的平均温度为：" + avgTemp;
            collector.collect(resultStr);
        }
    }
}
```

## 4.3、全窗口函数 - 案例

根据传感器id计算10秒内的平均温度

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.util.Iterator;
public class WindowFunction_ProcessWindowFunction {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        SingleOutputStreamOperator<String> resultDataStream = inputDataStream.keyBy("id")
                .timeWindow(Time.seconds(10L))
                .process(new CustomProcessWindowFunction());
        resultDataStream.print();
        env.execute();
    }
    /**
     * SensorReading -> 输入类型
     * String -> 输出类型
     * Tuple -> key 类型
     * TimeWindow -> 时间窗口
     */
    public static class CustomProcessWindowFunction extends ProcessWindowFunction<SensorReading, String, Tuple, TimeWindow> {
        @Override
        public void process(Tuple tuple, Context context, Iterable<SensorReading> iterable, Collector<String> collector) throws Exception {
            long count = 0;
            double tempTotal = 0.0;
            Iterator<SensorReading> allDatas = iterable.iterator();
            while (allDatas.hasNext()) {
                SensorReading sensor = allDatas.next();
                count++;
                tempTotal += sensor.getTemperature();
            }
            double avgTemp = tempTotal / count;
            String resultStr = tuple + "在10秒内平均温度为：" + avgTemp;
            collector.collect(resultStr);
        }
    }
}
```
