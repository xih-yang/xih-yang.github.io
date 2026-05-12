# 07、Flink 实战 - 时间特性、窗口、Watermark代码实践，支持Flink1.12
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/7.html
- 分类：大数据框架
- 分组：教程目录
## 一、前言

**时间、窗口和Watermark**是Flink的很重要的概念，学习它们是掌握运用Flink的重中之重。

## 二、时间特性

在DataStream API中，你可以用时间特性告知Flink在创建窗口时如何定义时间。

时间特性是StreamExecutionEnvironment的一个属性，它可以接受如下值。

### 1 ProcessingTime 处理时间

简单来说，处理时间就是Flink算子处理该条数据时，当前的系统时间。

通常，在窗口算子中使用处理时间会**导致不确定的结果**，因为这取决于数据到达Flink窗口时速率。

但是用处理时间也是有优点的，因为它处理任务无需考虑迟到的数据，所以提供了极低的延迟，比用事件时间快。

当你对自己的网络和数据的顺序非常自信时，并且要求极低的延迟，可以考虑用ProcessingTime。

### 2 EventTime 事件时间

事件时间是指某个事件发生时，他天然自带的时间。

比如温度监控器，某一时刻，它把当前时间+温度发送远程服务器，不管这条消息在网络中传输了多久，当它到达服务器时，

服务器可以从中提取事件真正的发生的时间。

我们在工作中，一般用的是事件时间，它极大的保证了结果正确性。因为Flink可以根据事件时间，结合watermark和allowedLateness提供处理迟到数据的能力。

### 3 IngestionTime 摄入时间

在**数据源算子**处理到该数据的时间，可以简单理解为该数据进入Flink处理引擎的时间，并自动生成watermark。

摄入时间是事件时间和处理时间的混合体。和事件时间相比，摄入时间的价值不大，摄入时间没有提供极低延迟，也无法保证结果正确性。

### 4 设置时间特性的代码

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
//默认的时间特性是ProcessingTime，这里设置成EventTime
env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
```

## 三、Window

在[Flink 实战(三) 大白话 时间 窗口 watermark](/zhuanlan/bigdata/flink/6/3.html)，已经对窗口的分类有了概念上的介绍，这里不再赘述。Flink提供的窗口种类也很多，需要结合代码实践才能逐渐理解，下面先了解下代码结构。

### 1 代码结构

Keyed Windows

```java
stream
       .keyBy(...)               <-  keyed versus non-keyed windows
       .window(...)              <-  required: "assigner"
      [.trigger(...)]            <-  optional: "trigger" (else default trigger)
      [.evictor(...)]            <-  optional: "evictor" (else no evictor)
      [.allowedLateness(...)]    <-  optional: "lateness" (else zero)
      [.sideOutputLateData(...)] <-  optional: "output tag" (else no side output for late data)
       .reduce/aggregate/fold/apply()      <-  required: "function"
      [.getSideOutput(...)]      <-  optional: "output tag"
```

Non-Keyed Windows

```java
stream
       .windowAll(...)           <-  required: "assigner"
      [.trigger(...)]            <-  optional: "trigger" (else default trigger)
      [.evictor(...)]            <-  optional: "evictor" (else no evictor)
      [.allowedLateness(...)]    <-  optional: "lateness" (else zero)
      [.sideOutputLateData(...)] <-  optional: "output tag" (else no side output for late data)
       .reduce/aggregate/fold/apply()      <-  required: "function"
      [.getSideOutput(...)]      <-  optional: "output tag"
```

### 2 时间窗口

每个事件的产生，它就天然的带上了时间属性，不管是事件的产生时间还是事件进入Flink的时间，这些时间都可以作为业务维度来划分窗口。

如下图：滚动时间窗口中，每隔1分钟，划分一个窗口。

#### 2.1 滚动时间窗口

滚动窗口将事件分配到长度**固定且不重叠**的桶中，如上图就是滚动时间窗口。

用滚动时间窗口，我们需要设置每个窗口的长度。

```java
//这里不设置时间特性，默认用ProcessingTime
SingleOutputStreamOperator<Object> result = dataStream
        .keyBy(a -> a.getId())
        .timeWindow(Time.seconds(5))//设置每5s划分一个窗口
        .apply(new SensorRecordUtils.MyAvg());
```

**timeWindow在Flink 1.12将标记过期**，最好用下面的window()

```java
SingleOutputStreamOperator<Object> result = dataStream
        .keyBy(a -> a.getId())
        //基于ProcessingTime的滚动时间窗口，每5s划分一个窗口
        .window(TumblingProcessingTimeWindows.of(Time.seconds(5)))
        .apply(new SensorRecordUtils.MyAvg());
```

举一反三，基于EventTime的滚动时间窗口如下，这里忽略设置EventTime时间戳的代码，后面会给。

```java
SingleOutputStreamOperator<Object> result = dataStream
        .keyBy(a -> a.getId())
        .window(TumblingEventTimeWindows.of(Time.seconds(5)))
        .apply(new SensorRecordUtils.MyAvg());
```

#### 2.2 滑动时间窗口

滑动窗口将事件分配到**大小固定且允许相互重叠**的桶中，这意味着每个事件有可能同时属于多个桶。要指定窗口的长度和滑动间隔来定义滑动窗口。

对于滑动时间窗口，我们要指定窗口的**时间长度**和**滑动步长**。

```java
SingleOutputStreamOperator<Object> result = dataStream
        .keyBy(a -> a.getId())
		//设置每5s划分一个窗口，滑动步长为1s
        .timeWindow(Time.seconds(5), Time.seconds(1))
        .apply(new SensorRecordUtils.MyAvg());
```

timeWindow在Flink 1.12将标记过期，最好用下面的window()

```java
SingleOutputStreamOperator<Object> result = dataStream
        .keyBy(a -> a.getId())
        .window(SlidingProcessingTimeWindows.of(Time.seconds(5), Time.seconds(1)))
        //timeWindow在Flink 1.12将标记过期，最好用上面的window()
        //.timeWindow(Time.seconds(5), Time.seconds(1))
        .apply(new SensorRecordUtils.MyAvg());
```

举一反三，基于EventTime的滑动时间窗口如下，这里忽略设置EventTime时间戳的代码，后面会给。

```java
SingleOutputStreamOperator<Object> result = dataStream
        .keyBy(a -> a.getId())
        .window(SlidingEventTimeWindows.of(Time.seconds(5), Time.seconds(1)))
        .apply(new SensorRecordUtils.MyAvg());
```

#### 2.3 会话窗口

会话窗口在一些常见的真实场景中非常有用，这些场景既不适合用滚动窗口，也不适用滑动窗口。

会话窗口（Session Windows）主要是将某段时间内活跃度较高的数据聚合成一个窗口进行计算，窗口的触发的条件是 Session Gap，是指在规定的时间内如果没有数据活跃接入，则认为窗口结束，然后触发窗口计算结果。

```java
SingleOutputStreamOperator<Object> result = dataStream
        .keyBy(a -> a.getId())
        .window(ProcessingTimeSessionWindows.withGap(Time.seconds(5)))
        .apply(new SensorRecordUtils.MyAvg());
```

### 3 计数窗口

事件是依次进入Flink的，以固定个数的事件为单位，划分窗口，就是计数窗口。

如下图：每4个事件，划分一个窗口。

#### 3.1 滚动计数窗口

```java
SingleOutputStreamOperator<Double> result = dataStream
        .keyBy(a -> a.getId())
        .countWindow(5)
        .aggregate(new SensorRecordUtils.MyAvgTemp());
```

#### 3.2 滑动计数窗口

```java
SingleOutputStreamOperator<Double> result = dataStream
        .keyBy(a -> a.getId())
        .countWindow(5, 2)
        .aggregate(new SensorRecordUtils.MyAvgTemp());
```

## 四、处理迟到数据

要处理迟到数据，得先理解下在没有迟到数据的情况下，窗口是如何被触发计算并关闭的。

### 1 理想情况

下面我用ppt画了一幅图，事件按照事件时间的正确顺序进入，并设置5秒划分一个窗口。

窗口一般是左闭右开的，当事件时间=5s的数据到来时，它会放到[5, 10)这个桶中，并表示5s之前的事件数据都已经到达，触发桶1进行计算结果并关闭窗口。

ppt画图实属不易，如果我画的不对，欢迎指正。

### 2 watermark

在用EventTime时，处理乱序数据，得用到Watermark，通常结合Window+Watermark使用

- 数据流中的Watermark用于表示timestamp小于Watermark的数据都已经到达，因此Window的执行是由Watermark触发的
- Watermark是一条特殊的数据记录
- Watermark必须单调**递增**，以确保任务的事件时间时钟向前推进

下面我用ppt画一幅图，简单讲下watermark的工作流程。

#### 2.1 设置事件时间和watermark

BoundedOutOfOrdernessTimestampExtractor默认实现周期性生成watermark，这样也比较符合大多数生成环境，这个周期可以在环境变量中设置。

```java
//自动生成水印的时间间隔，默认值是200毫秒
env.getConfig().setAutoWatermarkInterval(300);
```

```java
SingleOutputStreamOperator<SensorRecord> dataStream = source
        .filter(new SensorRecordUtils.MyFilter())
        .map(new SensorRecordUtils.MyMap())
        .filter(a -> a != null)
        //认为到达的数据可能乱序，设置延迟3s
        .assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor<SensorRecord>(Time.seconds(3)) {
            //提取SensorRecord中时间戳
            @Override
            public long extractTimestamp(SensorRecord element) {
                return element.getTime();
            }
        });
SingleOutputStreamOperator<Object> result = dataStream
        .keyBy(a -> a.getId())
        .window(TumblingEventTimeWindows.of(Time.seconds(5)))
        //timeWindow在Flink 1.12将标记过期，最好用上面的window()
        //.timeWindow(Time.seconds(5))
        .apply(new SensorRecordUtils.MyAvg());
```

#### 2.2 Flink1.12中设置

在Flink1.11中就已经发现assignTimestampsAndWatermarks的有些实现过期了，现在Flink1.12了，官网推荐用WatermarkStrategy。

```java
SingleOutputStreamOperator<SensorRecord> dataStream = source
        .filter(new SensorRecordUtils.MyFilter())
        .map(new SensorRecordUtils.MyMap())
        .filter(a -> a != null)
        //认为到达的数据可能乱序，设置延迟1s，用Flink 1.11的WatermarkStrategy
        .assignTimestampsAndWatermarks(
                WatermarkStrategy.<SensorRecord>forBoundedOutOfOrderness(Duration.ofSeconds(1))
                        .withTimestampAssigner(new SerializableTimestampAssigner<SensorRecord>() {
                            //提取SensorRecord中时间戳
                            @Override
                            public long extractTimestamp(SensorRecord element, long recordTimestamp) {
                                return element.getTime();
                            }
                        })
        );
SingleOutputStreamOperator<Object> result = dataStream
        .keyBy(a -> a.getId())
        .window(TumblingEventTimeWindows.of(Time.seconds(5)))
        //.window(SlidingEventTimeWindows.of(Time.seconds(5), Time.seconds(1)))
        //timeWindow在Flink 1.12将标记过期，最好用上面的window()
        //.timeWindow(Time.seconds(5))
                .apply(new SensorRecordUtils.MyAvg());
```

### 3 用事件时间，但不用watermark

```java
SingleOutputStreamOperator<SensorRecord> dataStream = source
        .filter(new SensorRecordUtils.MyFilter())
        .map(new SensorRecordUtils.MyMap())
        .filter(a -> a != null)
        //认为到来的数据的事件时间就是有序的，没有乱序，所以不用设置Watermark
        .assignTimestampsAndWatermarks(new AscendingTimestampExtractor<SensorRecord>() {
            //提取SensorRecord中时间戳
            @Override
            public long extractAscendingTimestamp(SensorRecord element) {
                return element.getTime();
            }
        });
```

在Flink1.11中，AscendingTimestampExtractor过时了，后期会删除，我们可按照下面这么写

```java
.assignTimestampsAndWatermarks(WatermarkStrategy.noWatermarks());
```

### 4 allowedLateness和侧输出流

watermark触发了窗口关闭时间时，先输出一个计算结果，但是还有迟到的数据怎么办呢？

可以使用allowedLateness和侧输出流。

allowedLateness设置一个事件长度，在窗口关闭后的这个时间长度内，对于**属于该窗口的迟到数据**来一次，计算一次。

如果任然有数据在allowedLateness到期后才到，得用侧输出流，可以将这些数据数据到某个Kafka，后期再合并计算。当然进入侧输出流的也是那种延迟太过分的数据，也是极少的。

```java
OutputTag<SensorRecord> lateTag = new OutputTag<>("late");
SingleOutputStreamOperator<Object> result = mapDataStream
         .keyBy(a -> a.getId())
         .window(SlidingEventTimeWindows.of(Time.seconds(5), Time.seconds(1)))
         .allowedLateness(Time.minutes(1))
         .sideOutputLateData(lateTag)
         .apply(new MyAvg())
```

## 五、结语

学无止境，后面好好学Flink的状态方面的内容，并复习前面所学，温故而知新。
