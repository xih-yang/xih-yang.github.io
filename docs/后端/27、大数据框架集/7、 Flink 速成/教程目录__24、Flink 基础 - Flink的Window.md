# 24、Flink 基础 - Flink的Window
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/24.html
- 分类：大数据框架
- 分组：教程目录
## 一、Flink Window

## 1.1 概述

streaming流式计算是一种被设计用于处理无限数据集的数据处理引擎，而无限数据集是指一种不断增长的本质上无限的数据集，而window是一种切割无限数据为有限块进行处理的手段。

Window是无限数据流处理的核心，Window将一个无限的stream拆分成有限大小的”buckets”桶，我们可以在这些桶上做计算操作。

举例子：假设按照时间段划分桶，接收到的数据马上能判断放到哪个桶，且多个桶的数据能并行被处理。（迟到的数据也可判断是原本属于哪个桶的）

## 1.2 Window类型

**1、** 时间窗口（TimeWindow）；

1)滚动时间窗口

2)滑动时间窗口

3)会话窗口
**2、** 计数窗口（CountWindow）；

1)滚动计数窗口

2)滑动计数窗口

TimeWindow：按照时间生成Window

CountWindow：按照指定的数据条数生成一个Window，与时间无关

**滚动窗口(Tumbling Windows)**

**1、** 依据固定的窗口长度对数据进行切分；

**2、** 时间对齐，窗口长度固定，没有重叠；

**滑动窗口(Sliding Windows)**

**1、** 可以按照固定的长度向后滑动固定的距离；

**2、** 滑动窗口由固定的窗口长度和滑动间隔组成；

**3、** 可以有重叠(是否重叠和滑动距离有关系)；

**4、** 滑动窗口是固定窗口的更广义的一种形式，滚动窗口可以看做是滑动窗口的一种特殊情况（即窗口大小和滑动间隔相等）；

**会话窗口(Session Windows)**

**1、** 由一系列事件组合一个指定时间长度的timeout间隙组成，也就是一段时间没有接收到新数据就会生成新的窗口；

**2、** 特点：时间无对齐；

## 二、Flink Window API

## 2.1 概述

**1、** 窗口分配器——window()方法；

**2、** 我们可以用.window()来定义一个窗口，然后基于这个window去做一些聚合或者其他处理操作；

**注意window()方法必须在keyBy之后才能使用。**
**3、** Flink提供了更加简单的.timeWindow()和.countWindow()方法，用于定义时间窗口和计数窗口；

```java
DataStream<Tuple2<String,Double>> minTempPerWindowStream = 
  datastream
  .map(new MyMapper())
  .keyBy(data -> data.f0)
  .timeWindow(Time.seconds(15))
  .minBy(1);
```

**窗口分配器(window assigner)**

**1、** window()方法接收的输入参数是一个WindowAssigner；

**2、** WindowAssigner负责将每条输入的数据分发到正确的window中；

**3、** Flink提供了通用的WindowAssigner；

1)滚动窗口（tumbling window）

2)滑动窗口（sliding window）

3)会话窗口（session window）

4)全局窗口（global window）

**创建不同类型的窗口**

**1、** 滚动时间窗口（tumblingtimewindow）；

.timeWindow(Time.seconds(15))
**2、** 滑动时间窗口（slidingtimewindow）；

timeWindow(Time.seconds(15),Time.seconds(5))
**3、** 会话窗口（sessionwindow）；

.window(EventTimeSessionWindows.withGap(Time.minutes(10)))
**4、** 滚动计数窗口（tumblingcountwindow）；

.countWindow(5)
**5、** 滑动计数窗口（slidingcountwindow）；

.countWindow(10,2)

DataStream的windowAll()类似分区的global操作，这个操作是non-parallel的(并行度强行为1)，所有的数据都会被传递到同一个算子operator上，官方建议如果非必要就不要用这个API

## 2.2 TimeWindow

TimeWindow将指定时间范围内的所有数据组成一个window，一次对一个window里面的所有数据进行计算。

**滚动窗口**

Flink默认的时间窗口根据ProcessingTime进行窗口的划分，将Flink获取到的数据根据进入Flink的时间划分到不同的窗口中。

```java
DataStream<Tuple2<String, Double>> minTempPerWindowStream = dataStream 
  .map(new MapFunction<SensorReading, Tuple2<String, Double>>() {
    @Override 
    public Tuple2<String, Double> map(SensorReading value) throws Exception {
      return new Tuple2<>(value.getId(), value.getTemperature()); 
    } 
  }) 
  .keyBy(data -> data.f0) 
  .timeWindow( Time.seconds(15) ) 
  .minBy(1);
```

时间间隔可以通过Time.milliseconds(x)，Time.seconds(x)，Time.minutes(x)等其中的一个来指定。

**滑动窗口**

滑动窗口和滚动窗口的函数名是完全一致的，只是在传参数时需要传入两个参数，一个是window_size，一个是sliding_size。

下面代码中的sliding_size设置为了5s，也就是说，每5s就计算输出结果一次，每一次计算的window范围是15s内的所有元素。

```java
DataStream<SensorReading> minTempPerWindowStream = dataStream 
  .keyBy(SensorReading::getId) 
  .timeWindow( Time.seconds(15), Time.seconds(5) ) 
  .minBy("temperature");
```

时间间隔可以通过Time.milliseconds(x)，Time.seconds(x)，Time.minutes(x)等其中的一个来指定。

## 2.3 CountWindow

CountWindow根据窗口中相同key元素的数量来触发执行，执行时只计算元素数量达到窗口大小的key对应的结果。

** 注意：CountWindow的window_size指的是相同Key的元素的个数，不是输入的所有元素的总数。**

**滚动窗口**

默认的CountWindow是一个滚动窗口，只需要指定窗口大小即可，当元素数量达到窗口大小时，就会触发窗口的执行。

```java
DataStream<SensorReading> minTempPerWindowStream = dataStream 
  .keyBy(SensorReading::getId) 
  .countWindow( 5 ) 
  .minBy("temperature");
```

**滑动窗口**

滑动窗口和滚动窗口的函数名是完全一致的，只是在传参数时需要传入两个参数，一个是window_size，一个是sliding_size。

下面代码中的sliding_size设置为了2，也就是说，每收到两个相同key的数据就计算一次，每一次计算的window范围是10个元素。

```java
DataStream<SensorReading> minTempPerWindowStream = dataStream 
  .keyBy(SensorReading::getId) 
  .countWindow( 10, 2 ) 
  .minBy("temperature");
```

## 2.4 window function

window function 定义了要对窗口中收集的数据做的计算操作，主要可以分为两类：

**1、** 增量聚合函数（incrementalaggregationfunctions）；

**2、** 全窗口函数（fullwindowfunctions）；

**增量聚合函数**

**1、** 每条数据到来就进行计算，保持一个简单的状态（来一条处理一条，但是不输出，到窗口临界位置才输出）；

**2、** 典型的增量聚合函数有ReduceFunction,AggregateFunction；

**全窗口函数**

**1、** 先把窗口所有数据收集起来，等到计算的时候会遍历所有数据（来一个放一个，窗口临界位置才遍历且计算、输出）；

**2、** ProcessWindowFunction，WindowFunction；

## 2.5 其他可选API

**1、** .trigger()——触发器；

定义window 什么时候关闭，触发计算并输出结果
**2、** .evitor()——移除器；

定义移除某些数据的逻辑
**3、** .allowedLateness()——允许处理迟到的数据；

**4、** .sideOutputLateData()——将迟到的数据放入侧输出流；

**5、** .getSideOutput()——获取侧输出流；

## 三、代码测试

## 3.1 测试滚动时间窗口的增量聚合函数

增量聚合函数，特点即每次数据过来都处理，但是到了窗口临界才输出结果。

Java代码:

```java
package org.flink.window;
import org.flink.beans.SensorReading;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
/**
 * @remark : 测试滚动时间窗口的增量聚合函数
 */
public class WindowTest1_TimeWindow {
    public static void main(String[] args) throws Exception {
        // 创建执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // 并行度设置1，方便看结果
        env.setParallelism(1);
        //        // 从文件读取数据
        //        DataStream<String> dataStream = env.readTextFile("/tmp/Flink_Tutorial/src/main/resources/sensor.txt");
        // 从socket文本流获取数据
        DataStream<String> inputStream = env.socketTextStream("10.31.1.122", 7777);
        // 转换成SensorReading类型
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        // 开窗测试
        // 1. 增量聚合函数 (这里简单统计每个key组里传感器信息的总数)
        DataStream<Integer> resultStream = dataStream.keyBy("id")
                //                .countWindow(10, 2);
                //                .window(EventTimeSessionWindows.withGap(Time.minutes(1)));
                //                .window(TumblingProcessingTimeWindows.of(Time.seconds(15)))
                //                .timeWindow(Time.seconds(15)) // 已经不建议使用@Deprecated
                .window(TumblingProcessingTimeWindows.of(Time.seconds(15)))
                .aggregate(new AggregateFunction<SensorReading, Integer, Integer>() {
                    // 新建的累加器
                    @Override
                    public Integer createAccumulator() {
                        return 0;
                    }
                    // 每个数据在上次的基础上累加
                    @Override
                    public Integer add(SensorReading value, Integer accumulator) {
                        return accumulator + 1;
                    }
                    // 返回结果值
                    @Override
                    public Integer getResult(Integer accumulator) {
                        return accumulator;
                    }
                    // 分区合并结果(TimeWindow一般用不到，SessionWindow可能需要考虑合并)
                    @Override
                    public Integer merge(Integer a, Integer b) {
                        return a + b;
                    }
                });
        resultStream.print("result");
        env.execute();
    }
}
```

**运行Java程序，查看结果**

启动Flink程序，在socket窗口输入数据

**输入(下面用“换行”区分每个15s内的输入，实际输入时无换行)**

```java
sensor_1,1547718199,35.8
sensor_6,1547718201,15.4
sensor_7,1547718202,6.7
sensor_10,1547718205,38.1
sensor_1,1547718207,36.3
sensor_1,1547718209,32.8
sensor_1,1547718212,37.1
```

**输出（下面用“换行”区分每个15s内的输出，实际输出无换行）**

因为代码实现每15s一个window，所以"sensor_1"中间一组才累计2，最初一次不累计，最后一次也是另外的window，重新从1计数。

```java
result> 1
result> 1
result> 1
result> 1
result> 2
result> 1
```

## 3.2 测试滚动时间窗口的全窗口函数

全窗口函数，特点即数据过来先不处理，等到窗口临界再遍历、计算、输出结果。

代码:

```java
package org.flink.window;
import org.flink.beans.SensorReading;
import org.apache.commons.collections.IteratorUtils;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.windowing.WindowFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
/**
 * @remark : 测试滚动时间窗口的全窗口函数
 */
public class WindowTest2_TimeWindow {
    public static void main(String[] args) throws Exception {
        // 创建执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // 并行度设置1，方便看结果
        env.setParallelism(1);
//        // 从文件读取数据
//        DataStream<String> dataStream = env.readTextFile("/tmp/Flink_Tutorial/src/main/resources/sensor.txt");
        // 从socket文本流获取数据
        DataStream<String> inputStream = env.socketTextStream("10.31.1.122", 7777);
        // 转换成SensorReading类型
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        // 2. 全窗口函数 （WindowFunction和ProcessWindowFunction，后者更全面）
        SingleOutputStreamOperator<Tuple3<String, Long, Integer>> resultStream2 = dataStream.keyBy(SensorReading::getId)
                .window(TumblingProcessingTimeWindows.of(Time.seconds(15)))
//                .process(new ProcessWindowFunction<SensorReading, Object, Tuple, TimeWindow>() {
//                })
                .apply(new WindowFunction<SensorReading, Tuple3<String, Long, Integer>, String, TimeWindow>() {
                    @Override
                    public void apply(String s, TimeWindow window, Iterable<SensorReading> input, Collector<Tuple3<String, Long, Integer>> out) throws Exception {
                        String id = s;
                        long windowEnd = window.getEnd();
                        int count = IteratorUtils.toList(input.iterator()).size();
                        out.collect(new Tuple3<>(id, windowEnd, count));
                    }
                });
        resultStream2.print("result2");
        env.execute();
    }
}
```

**启动远程 nc**

```java
nc -lk 7777
```

**在本地socket输入，查看Flink输出结果**

输入（以“空行”表示每个15s时间窗口内的输入，实际没有“空行”）

```java
sensor_1,1547718199,35.8
sensor_6,1547718201,15.4
sensor_7,1547718202,6.7
sensor_10,1547718205,38.1
sensor_1,1547718207,36.3
sensor_1,1547718209,32.8
```

输出（以“空行”表示每个15s时间窗口内的输入，实际没有“空行”）

这里每个window都是分开计算的，所以第一个window里的sensor_1和第二个window里的sensor_1并没有累计。

```java
result2> (sensor_1,1612190820000,1)
result2> (sensor_6,1612190820000,1)
result2> (sensor_7,1612190835000,1)
result2> (sensor_1,1612190835000,2)
result2> (sensor_10,1612190835000,1)
```

## 2.3 测试滑动计数窗口的增量聚合函数

滑动窗口，当窗口不足设置的大小时，会先按照步长输出。

eg：窗口大小10，步长2，那么前5次输出时，窗口内的元素个数分别是（2，4，6，8，10），再往后就是10个为一个窗口了。

代码:

```java
package org.flink.window;
import org.flink.beans.SensorReading;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
/**
 * @remark : 测试滑动计数窗口的增量聚合函数
 */
public class WindowTest3_CountWindow {
    public static void main(String[] args) throws Exception {
        // 创建执行环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // 并行度设置1，方便看结果
        env.setParallelism(1);
        // 从socket文本流获取数据
        DataStream<String> inputStream = env.socketTextStream("10.31.1.122", 7777);
        // 转换成SensorReading类型
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        DataStream<Double> resultStream = dataStream.keyBy(SensorReading::getId)
                .countWindow(10, 2)
                .aggregate(new MyAvgFunc());
        resultStream.print("result");
        env.execute();
    }
    public static class MyAvgFunc implements AggregateFunction<SensorReading, Tuple2<Double, Integer>, Double> {
        @Override
        public Tuple2<Double, Integer> createAccumulator() {
            return new Tuple2<>(0.0, 0);
        }
        @Override
        public Tuple2<Double, Integer> add(SensorReading value, Tuple2<Double, Integer> accumulator) {
            // 温度累加求和，当前统计的温度个数+1
            return new Tuple2<>(accumulator.f0 + value.getTemperature(), accumulator.f1 + 1);
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
}
```

**启动远程nc服务**

```java
nc -lk 7777
```

本地socket输入，Flink控制台查看输出结果

**输入**

这里为了方便，就只输入同一个keyBy组的数据sensor_1

```java
sensor_1,1547718199,1
sensor_1,1547718199,2
sensor_1,1547718199,3
sensor_1,1547718199,4
sensor_1,1547718199,5
sensor_1,1547718199,6
sensor_1,1547718199,7
sensor_1,1547718199,8
sensor_1,1547718199,9
sensor_1,1547718199,10
sensor_1,1547718199,11
sensor_1,1547718199,12
sensor_1,1547718199,13
sensor_1,1547718199,14
```

**输出**

输入时，会发现，每次到达一个窗口步长（这里为2），就会计算得出一次结果。

第一次计算前2个数的平均值

第二次计算前4个数的平均值

第三次计算前6个数的平均值

第四次计算前8个数的平均值

第五次计算前10个数的平均值

第六次计算前最近10个数的平均值

第七次计算前最近10个数的平均值

```java
result> 1.5
result> 2.5
result> 3.5
result> 4.5
result> 5.5
result> 7.5
result> 9.5
```

## 3.4 其他可选API代码片段

```java
// 3. 其他可选API
OutputTag<SensorReading> outputTag = new OutputTag<SensorReading>("late") {
};
SingleOutputStreamOperator<SensorReading> sumStream = dataStream.keyBy("id")
  .timeWindow(Time.seconds(15))
  //                .trigger() // 触发器，一般不使用 
  //                .evictor() // 移除器，一般不使用
  .allowedLateness(Time.minutes(1)) // 允许1分钟内的迟到数据<=比如数据产生时间在窗口范围内，但是要处理的时候已经超过窗口时间了
  .sideOutputLateData(outputTag) // 侧输出流，迟到超过1分钟的数据，收集于此
  .sum("temperature"); // 侧输出流 对 温度信息 求和。
// 之后可以再用别的程序，把侧输出流的信息和前面窗口的信息聚合。（可以把侧输出流理解为用来批处理来补救处理超时数据）
```
