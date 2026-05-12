# 13、Flink 处理函数
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/13.html
- 分类：大数据框架
- 分组：教程目录
## 一、基本处理函数

**处理函数主要是定义数据流的转换操作**，所以也可以把它归到转换算子中。我们知道在Flink中几乎所有转换算子都提供了对应的函数类接口，处理函数也不例外；它所对应的函数类，就叫作ProcessFunction。

## 1.处理函数的功能和使用

之前学习的转换算子，一般只是针对某种具体操作来定义的，能够拿到的信息比较有限。比如map算子，我们实现的MapFunction中，只能获取到当前的数据，定义它转换之后的形式；而像窗口聚合这样的复杂操作，AggregateFunction中除数据外，还可以获取到当前的状态（以累加器Accumulator形式出现）。另外我们还介绍过富函数类，比如RichMapFunction，它提供了获取运行时上下文的方法getRuntimeContext()，可以拿到状态，还有并行度、任务名称之类的运行时信息。

但是无论那种算子，如果我们想要访问事件的时间戳，或者当前的水位线信息，都是完全做不到的。在定义生成规则之后，水位线会源源不断地产生，像数据一样在任务间流动，可我们却不能像数据一样去处理它；跟时间相关的操作，目前我们只会用窗口来处理。而在很多应用需求中，要求我们对时间有更精细的控制，需要能够获取水位线，甚至要“把控时间”、定义什么时候做什么事，这就不是基本的时间窗口能够实现的了。

于是必须祭出大招——处理函数（ProcessFunction）了。**处理函数提供了一个“定时服务”（TimerService），我们可以通过它访问流中的事件（event）、时间戳（timestamp）、水位线（watermark），甚至可以注册“定时事件”**。而且处理函数继承了AbstractRichFunction抽象类，所以拥有富函数类的所有特性，同样可以访问状态（state）和其他运行时信息。此外，处理函数还可以直接将数据输出到侧输出流（sideoutput）中。所以，处理函数是最为灵活的处理方法，可以实现各种自定义的业务逻辑；同时也是整个DataStreamAPI的底层基础。

处理函数的使用与基本的转换操作类似，只需要直接基于DataStream调用.process()方法就可以了。方法需要传入一个ProcessFunction作为参数，用来定义处理逻辑。

```java
stream.process(new MyProcessFunction())
```

这里ProcessFunction不是接口，而是一个抽象类，继承了AbstractRichFunction；MyProcessFunction是它的一个具体实现。所以所有的处理函数，都是富函数（RichFunction），富函数可以调用的东西这里同样都可以调用。

下面是一个示例代码：

```java
package com.kunan.StreamAPI.ProcessFunction;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.ProcessFunction;
import org.apache.flink.util.Collector;
import java.time.Duration;
public class ProcessFunctionTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        SingleOutputStreamOperator<Event> stream = env.addSource(new ClickSource())
                .assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ZERO)
                        .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                            @Override
                            public long extractTimestamp(Event element, long recordTimestamp) {
                                return element.timestamp;
                            }
                        }));
        stream.process(new ProcessFunction<Event, String>() {
            @Override
            public void processElement(Event value, ProcessFunction<Event, String>.Context ctx, Collector<String> out) throws Exception {
                if(value.user.equals("Marry")){
                    out.collect(value.user + " clicks " + value.url);
                } else if(value.user.equals("Bob")){
                    out.collect(value.user);
                    out.collect(value.user);
                }
                out.collect(value.toString());
                //当前时间
                System.out.println("TimeStamp: " + ctx.timestamp());
                //当前水位线
                System.out.println("WaterMark: " + ctx.timerService().currentWatermark());
                System.out.println(getRuntimeContext().getIndexOfThisSubtask());
            }
            @Override
            public void onTimer(long timestamp, ProcessFunction<Event, String>.OnTimerContext ctx, Collector<String> out) throws Exception {
                super.onTimer(timestamp, ctx, out);
            }
        }).print();
        env.execute();
    }
}
```

这里我们在ProcessFunction中重写了.processElement()方法，自定义了一种处理逻辑：当数据的user为“Mary”时，将其输出一次；而如果为“Bob”时，将user输出两次。这里的输出，是通过调用out.collect()来实现的。另外还可以调用ctx.timerService().currentWatermark()来获取当前的水位线打印输出。所以可以看到，ProcessFunction函数有点像FlatMapFunction的升级版。可以实现Map、Filter、FlatMap的所有功能。很明显，处理函数非常强大，能够做很多之前做不到的事情。

接下来就深入ProcessFunction源码来进行详细了解。

## 2.ProcessFunction 解析

在源码中我们可以看到，抽象类ProcessFunction继承了AbstractRichFunction，有两个泛型类型参数：I表示Input，也就是输入的数据类型；O表示Output，也就是处理完成之后输出的数据类型。

内部单独定义了两个方法：一个是必须要实现的抽象方法**.processElement()**；另一个是非抽象方法**.onTimer()**。

```java
public abstract class ProcessFunction<I, O> extends AbstractRichFunction {
 ...
public abstract void processElement(I value, Context ctx, Collector<O> out) throws Exception;
public void onTimer(long timestamp, OnTimerContext ctx, Collector<O> out)
throws Exception {}
...
}
```

### 抽象方法.processElement()

用于“处理元素”，定义了处理的核心逻辑。这个方法对于流中的每个元素都会调用一次，参数包括三个：**输入数据值value，上下文ctx，以及“收集器”（Collector）out**。方法没有返回值，处理之后的输出数据是通过收集器out来定义的。

- value：当前流中的输入元素，也就是正在处理的数据，类型与流中数据类型一致。
- ctx：类型是ProcessFunction中定义的内部抽象类Context，表示当前运行的上下文，可以获取到当前的时间戳，并提供了用于查询时间和注册定时器的“定时服务”(TimerService)，以及可以将数据发送到“侧输出流”（sideoutput）的方法.output()。

Context 抽象类定义如下：

```java
public abstract class Context {
 public abstract Long timestamp();
 public abstract TimerService timerService();
 public abstract <X> void output(OutputTag<X> outputTag, X value);
}
```

- out：“收集器”（类型为Collector），用于返回输出数据。使用方式与flatMap算子中的收集器完全一样，直接调用out.collect()方法就可以向下游发出一个数据。

这个方法可以多次调用，也可以不调用。

通过几个参数的分析不难发现，ProcessFunction可以轻松实现flatMap这样的基本转换功能（当然map、filter更不在话下）；而通过富函数提供的获取上下文方法.getRuntimeContext()，也可以自定义状态（state）进行处理，这也就能实现聚合操作的功能了。关于自定义状态的具体实现，后续在“状态管理”中详细介绍。

### 非抽象方法.onTimer()

用于定义定时触发的操作，这是一个非常强大、也非常有趣的功能。这个方法只有在注册好的定时器触发的时候才会调用，而定时器是通过“定时服务”TimerService来注册的。打个比方，注册定时器（timer）就是设了一个闹钟，到了设定时间就会响；而.onTimer()中定义的，就是闹钟响的时候要做的事。所以它本质上是一个基于时间的“回调”（callback）方法，通过时间的进展来触发；在事件时间语义下就是由水位线（watermark）来触发了。

与.processElement()类似，定时方法.onTimer()也有三个参数：时间戳（timestamp），上下文（ctx），以及收集器（out）。这里的timestamp是指设定好的触发时间，事件时间语义下当187然就是水位线了。另外这里同样有上下文和收集器，所以也可以调用定时服务（TimerService），以及任意输出处理之后的数据。

既然有.onTimer()方法做定时触发，用ProcessFunction也可以自定义数据按照时间分组、定时触发计算输出结果；这其实就实现了窗口（window）的功能。所以说ProcessFunction是真正意义上的终极奥义，用它可以实现一切功能。

也可以看到，处理函数都是基于事件触发的。水位线就如同插入流中的一条数据一样；只不过处理真正的数据事件调用的是.processElement()方法，而处理水位线事件调用的是.onTimer()。

这里需要注意的是，上面的.onTimer()方法只是定时器触发时的操作，而定时器（timer）真正的设置需要用到上下文ctx中的定时服务。在Flink中，只有“按键分区流”KeyedStream才支持设置定时器的操作，所以之前的代码中我们并没有使用定时器。所以基于不同类型的流，可以使用不同的处理函数，它们之间还是有一些微小的区别的。接下来我们就介绍一下处理函数的分类。

## 3.处理函数的分类

Flink中的处理函数其实是一个大家族，ProcessFunction只是其中一员。

我们知道，DataStream在调用一些转换方法之后，有可能生成新的流类型；例如调用.keyBy()之后得到KeyedStream，进而再调用.window()之后得到WindowedStream。对于不同类型的流，其实都可以直接调用.process()方法进行自定义处理，这时传入的参数就都叫作处理函数。当然，它们尽管本质相同，都是可以访问状态和时间信息的底层API，可彼此之间也会有所差异。

Flink 提供了 8 个不同的处理函数

**1、ProcessFunction**

最基本的处理函数，基于DataStream直接调用.process()时作为参数传入。

**2、KeyedProcessFunction**

对流按键分区后的处理函数，基于KeyedStream调用.process()时作为参数传入。要想使用定时器，比如基于KeyedStream。

**3、ProcessWindowFunction**

开窗之后的处理函数，也是全窗口函数的代表。基于WindowedStream调用.process()时作为参数传入。

**4、ProcessAllWindowFunction**

同样是开窗之后的处理函数，基于AllWindowedStream调用.process()时作为参数传入。

**5、CoProcessFunction**

合并（connect）两条流之后的处理函数，基于ConnectedStreams调用.process()时作为参数传入。关于流的连接合并操作，我们会在后续章节详细介绍。

**6、ProcessJoinFunction**

间隔连接（intervaljoin）两条流之后的处理函数，基于IntervalJoined调用.process()时作为参数传入。

**7、BroadcastProcessFunction**

广播连接流处理函数，基于BroadcastConnectedStream调用.process()时作为参数传入。这里的“广播连接流”BroadcastConnectedStream，是一个未keyBy的普通DataStream与一个广播流（BroadcastStream）做连接（conncet）之后的产物。关于广播流的相关操作，我们会在后续章节详细介绍。

**8、KeyedBroadcastProcessFunction**

按键分区的广播连接流处理函数，同样是基于BroadcastConnectedStream调用.process()时作为参数传入。与BroadcastProcessFunction不同的是，这时的广播连接流，是一个KeyedStream与广播流（BroadcastStream）做连接之后的产物。

接下来，就对KeyedProcessFunction和ProcessWindowFunction的具体用法展开详细说明。

## 二、按键分区处理函数（KeyedProcessFunction）

在Flink程序中，为了实现数据的聚合统计，或者开窗计算之类的功能，我们一般都要先用keyBy算子对数据流进行“按键分区”，得到一个KeyedStream。也就是指定一个键（key），按照它的哈希值（hashcode）将数据分成不同的“组”，然后分配到不同的并行子任务上执行计算；这相当于做了一个逻辑分流的操作，从而可以充分利用并行计算的优势实时处理海量数据。

另外我们在上节中也提到，只有在KeyedStream中才支持使用TimerService设置定时器的操作。所以一般情况下，我们都是先做了keyBy分区之后，再去定义处理操作；代码中更加常见的处理函数是KeyedProcessFunction，最基本的ProcessFunction反而出镜率没那么高。

接下来我们就先从定时服务（TimerService）入手，详细讲解KeyedProcessFunction的用法

## 1.定时器（Timer）和定时服务（TimerService）

KeyedProcessFunction的一个特色，就是可以灵活地使用定时器。

定时器（timers）是处理函数中进行时间相关操作的主要机制。在.onTimer()方法中可以实现定时处理的逻辑，而它能触发的前提，就是之前曾经注册过定时器、并且现在已经到了触发时间。注册定时器的功能，是通过上下文中提供的“定时服务”（TimerService）来实现的。

定时服务与当前运行的环境有关。前面已经介绍过，ProcessFunction的上下文（Context）中提供了.timerService()方法，可以直接返回一个TimerService对象：

```java
public abstract TimerService timerService();
```

TimerService是Flink关于时间和定时器的基础服务接口，包含以下六个方法：

```java
// 获取当前的处理时间
long currentProcessingTime();
// 获取当前的水位线（事件时间）
long currentWatermark();
// 注册处理时间定时器，当处理时间超过 time 时触发
void registerProcessingTimeTimer(long time);
// 注册事件时间定时器，当水位线超过 time 时触发
void registerEventTimeTimer(long time);
// 删除触发时间为 time 的处理时间定时器
void deleteProcessingTimeTimer(long time);
// 删除触发时间为 time 的处理时间定时器
void deleteEventTimeTimer(long time);
```

六个方法可以分成两大类：**基于处理时间和基于事件时间**。而对应的操作主要有三个：***获取当前时间，注册定时器，以及删除定时器***。需要注意，尽管处理函数中都可以直接访问TimerService，不过只有基于KeyedStream的处理函数，才能去调用注册和删除定时器的方法；未作按键分区的DataStream不支持定时器操作，只能获取当前时间。

对于处理时间和事件时间这两种类型的定时器，TimerService内部会用一个优先队列将它们的时间戳（timestamp）保存起来，排队等待执行。可以认为，定时器其实是KeyedStream上处理算子的一个状态，它以时间戳作为区分。所以TimerService会以键（key）和时间戳为标准，对定时器进行去重；也就是说对于每个key和时间戳，最多只有一个定时器，如果注册了多次，onTimer()方法也将只被调用一次。这样一来，在代码中就方便了很多，可以肆无忌惮地对一个key注册定时器，而不用担心重复定义——因为一个时间戳上的定时器只会触发一次。

基于KeyedStream注册定时器时，会传入一个定时器触发的时间戳，这个时间戳的定时器对于每个key都是有效的。这样，代码并不需要做额外的处理，底层就可以直接对不同key进行独立的处理操作了。

利用这个特性，有时我们可以故意降低时间戳的精度，来减少定时器的数量，从而提高处理性能。比如我们可以在设置定时器时只保留整秒数，那么定时器的触发频率就是最多1秒一次。

```java
long coalescedTime = time / 1000 * 1000;
ctx.timerService().registerProcessingTimeTimer(coalescedTime);
```

这里注意定时器的时间戳必须是毫秒数，所以我们得到整秒之后还要乘以1000。定时器默认的区分精度是毫秒。

另外Flink对.onTimer()和.processElement()方法是同步调用的（synchronous），所以也不会出现状态的并发修改。

Flink的定时器同样具有容错性，它和状态一起都会被保存到一致性检查点（checkpoint）中。当发生故障时，Flink会重启并读取检查点中的状态，恢复定时器。如果是处理时间的定时器，有可能会出现已经“过期”的情况，这时它们会在重启时被立刻触发。关于Flink的检查点和容错机制，会在后续详细说明。

## 2.KeyedProcessFunction 的使用

KeyedProcessFunction可以说是处理函数中的“嫡系部队”，可以认为是ProcessFunction的一个扩展。我们只要基于keyBy之后的KeyedStream，直接调用.process()方法，这时需要传入的参数就是KeyedProcessFunction的实现类。

```java
stream.keyBy( t -> t.f0 )
.process(new MyKeyedProcessFunction())
```

类似地，KeyedProcessFunction也是继承自AbstractRichFunction的一个抽象类，源码中定义如下：

```java
public abstract class KeyedProcessFunction<K, I, O> extends AbstractRichFunction
{
...
public abstract void processElement(I value, Context ctx, Collector<O> out)
throws Exception;
public void onTimer(long timestamp, OnTimerContext ctx, Collector<O> out)
throws Exception {}
public abstract class Context {...}
...
}
```

可以看到与ProcessFunction的定义几乎完全一样，区别只是在于类型参数多了一个K，这是当前按键分区的key的类型。同样地，我们必须实现一个.processElement()抽象方法，用来处理流中的每一个数据；另外还有一个非抽象方法.onTimer()，用来定义定时器触发时的回调操作。由于定时器只能在KeyedStream上使用，所以到了KeyedProcessFunction这里，才真正对时间有了精细的控制，定时方法.onTimer()才真正派上了用场。

下面是一个使用处理时间定时器的具体示例：

```java
package com.kunan.StreamAPI.ProcessFunction;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;
import java.sql.Timestamp;
public class ProcessTimeTimerTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<Event> stream = env.addSource(new ClickSource());
        stream.keyBy(data -> data.user)
                        .process(new KeyedProcessFunction<String, Event, String>() {
                            @Override
                            public void processElement(Event value, KeyedProcessFunction<String, Event, String>.Context ctx, Collector<String> out) throws Exception {
                                Long CurrTimeStamp = ctx.timerService().currentProcessingTime();
                                out.collect(ctx.getCurrentKey() +"数据到达，到达时间： " + new Timestamp(CurrTimeStamp));
                                //注册一个10s后定时器
                                ctx.timerService().registerProcessingTimeTimer(CurrTimeStamp + 10 * 1000L);
                            }
                            @Override
                            public void onTimer(long timestamp, KeyedProcessFunction<String, Event, String>.OnTimerContext ctx, Collector<String> out) throws Exception {
                                out.collect(ctx.getCurrentKey() + "定时器触发，触发时间：" + new Timestamp(timestamp));
                            }
                        }).print();
        env.execute();
    }
}
```

在上面的代码中，由于定时器只能在KeyedStream上使用，所以先要进行keyBy；这里的.keyBy(data->data.user)是将数据的key指定user，

之后我们自定义了一个KeyedProcessFunction，其中.processElement()方法是每来一个数据都会调用一次，主要是定义了一个10秒之后的定时器；而.onTimer()方法则会在定时器触发时调用。所以会看到程序运行后先在控制台输出“数据到达”的信息，等待10秒之后，又会输出“定时器触发”的信息，打印出的时间间隔正是10秒。

上面的例子是处理时间的定时器，所以是真的需要等待10秒才会看到结果。如果事件时间语义下，又会有什么不同？

【示例代码】

```java
package com.kunan.StreamAPI.ProcessFunction;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.streaming.api.functions.source.SourceFunction;
import org.apache.flink.util.Collector;
import java.sql.Timestamp;
import java.time.Duration;
public class EventTimeTimerTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        SingleOutputStreamOperator<Event> stream = env.addSource(new CustomSource())
                .assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ZERO)
                        .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                            @Override
                            public long extractTimestamp(Event element, long recordTimestamp) {
                                return element.timestamp;
                            }
                        }));
        // 时间定时器
        stream.keyBy(data -> data.user)
                        .process(new KeyedProcessFunction<String, Event, Object>() {
                            @Override
                            public void onTimer(long timestamp, KeyedProcessFunction<String, Event, Object>.OnTimerContext ctx, Collector<Object> out) throws Exception {
                                out.collect(ctx.getCurrentKey() +
                                        "定时器触发，触发时间：" + new Timestamp(timestamp) +
                                        " WaterMarks: " + ctx.timerService().currentWatermark());
                            }
                            @Override
                            public void processElement(Event value, KeyedProcessFunction<String, Event, Object>.Context ctx, Collector<Object> out) throws Exception {
                                   Long currTs =  ctx.timestamp();
                                   out.collect(ctx.getCurrentKey()
                                           + "数据到达，时间戳： " + new Timestamp(currTs) +
                                           " 当前 WaterMarks: " + ctx.timerService().currentWatermark());
                                   //注册一个10s的定时器
                                ctx.timerService().registerEventTimeTimer(currTs + 10 * 1000L);
                            }
                        }).print();
        env.execute();
    }
    //自定义测试数据源
    public static class CustomSource implements SourceFunction<Event>{
        @Override
        public void run(SourceContext<Event> ctx) throws Exception {
            //直接发出测试数据
            ctx.collect(new Event("Mary","www.baidu.com",1000L));
            // 为了测试明显，中间停顿5s
            Thread.sleep(5000L);
            // 发出 10 秒后的数据
            ctx.collect(new Event("Bob","www.bing.com",11000L));
            Thread.sleep(5000L);
            // 发出 10 秒+1ms 后的数据
            ctx.collect(new Event("Alice","www.apple.com",11001L));
            Thread.sleep(5000L);
        }
        @Override
        public void cancel() {
        }
    }
}
```

由于是事件时间语义，所以必须从数据中提取出数据产生的时间戳。这里为了更清楚地看到程序行为，自定义了一个数据源，发出三条测试数据，时间戳分别为1000、11000和11001，并且发出数据后都会停顿5秒。

在代码中，依然将所有数据分到同一分区，然后在自定义的KeyedProcessFunction中使用定时器。同样地，每来一条数据，我们就将当前的数据时间戳和水位线信息输出，并注册一个10秒后（以当前数据时间戳为基准）的事件时间定时器。执行程序结果如下：

```java
Mary数据到达，时间戳： 1970-01-01 08:00:01.0 当前 WaterMarks: -9223372036854775808
Bob数据到达，时间戳： 1970-01-01 08:00:11.0 当前 WaterMarks: 999
Alice数据到达，时间戳： 1970-01-01 08:00:11.001 当前 WaterMarks: 10999
Mary定时器触发，触发时间：1970-01-01 08:00:11.0 WaterMarks: 11000
Bob定时器触发，触发时间：1970-01-01 08:00:21.0 WaterMarks: 9223372036854775807
Alice定时器触发，触发时间：1970-01-01 08:00:21.001 WaterMarks: 9223372036854775807
```

当第三条数据到达后，随后立即输出一条定时器触发的信息；再过5秒之后，剩余两条定时器信息输出，程序运行结束。

可以发现，数据到来之后，当前的水位线与时间戳并不是一致的。当第一条数据到来，时间戳为1000，可水位线的生成是周期性的（默认200ms一次），不会立即发生改变，所以依然是最小值Long.MIN_VALUE；随后只要到了水位线生成的时间点（200ms到了），就会依据当前的最大时间戳1000来生成水位线了。这里没有设置水位线延迟，默认需要减去1毫秒，所以水位线推进到了999。而当时间戳为11000的第二条数据到来之后，水位线同样没有立即改变，仍然是999，就好像总是“滞后”数据一样。

这样程序的行为就可以得到合理解释了。事件时间语义下，定时器触发的条件就是水位线推进到设定的时间。第一条数据到来后，设定的定时器时间为1000+10*1000=11000；而当时间戳为11000的第二条数据到来，水位线还处在999的位置，当然不会立即触发定时器；而之后水位线会推进到10999，同样是无法触发定时器的。必须等到第三条数据到来，将水位线真正推进到11000，就可以触发第一个定时器了。第三条数据发出后再过5秒，没有更多的数据生成了，整个程序运行结束将要退出，此时Flink会自动将水位线推进到长整型的最大值（Long.MAX_VALUE）。于是所有尚未触发的定时器这时就统一触发了，我们就在控制台看到了后两个定时器的触发信息。

## 三、窗口处理函数

除了KeyedProcessFunction，另外一大类常用的处理函数，就是基于窗口的ProcessWindowFunction和ProcessAllWindowFunction了。前面已经简单地使用过窗口处理函数了。

## 1.窗口处理函数的使用

进行窗口计算，可以直接调用现成的简单聚合方法（sum/max/min）,也可以通过调用.reduce()或.aggregate()来自定义一般的增量聚合函数（ReduceFunction/AggregateFucntion）；而对于更加复杂、需要窗口信息和额外状态的一些场景，我们还可以直接使用全窗口函数、把数据全部收集保存在窗口内，等到触发窗口计算时再统一处理。窗口处理函数就是一种典型的全窗口函数。

窗口函数。窗口处理函数ProcessWindowFunction的使用与其他窗口函数类似，也是基于WindowedStream直接调用方法就可以，只不过这时调用的是.process()。

```java
stream.keyBy( t -> t.f0 )
 .window( TumblingEventTimeWindows.of(Time.seconds(10)) )
 .process(new MyProcessWindowFunction())
```

## 2.ProcessWindowFunction 解析

ProcessWindowFunction既是处理函数又是全窗口函数。从名字上也可以推测出，它的本质似乎更倾向于“窗口函数”一些。事实上它的用法也确实跟其他处理函数有很大不同。可以从源码中的定义看到这一点：

```java
public abstract class ProcessWindowFunction<IN, OUT, KEY, W extends Window>
 extends AbstractRichFunction {
...
public abstract void process(
 KEY key, Context context, Iterable<IN> elements, Collector<OUT> out) throws
Exception;
public void clear(Context context) throws Exception {}
public abstract class Context implements java.io.Serializable {...}
}
```

ProcessWindowFunction依然是一个继承了AbstractRichFunction的抽象类，它有四个类型参数：

- IN：input，数据流中窗口任务的输入数据类型。
- OUT：output，窗口任务进行计算之后的输出数据类型。
- KEY：数据中键key的类型。
- W：窗口的类型，是Window的子类型。一般情况下我们定义时间窗口，W就是TimeWindow。

而内部定义的方法，跟之前熟悉的处理函数就有所区别了。因为全窗口函数不是逐个处理元素的，所以处理数据的方法在这里并不是.processElement()，而是改成了.process()。方法包含四个参数。

- key：窗口做统计计算基于的键，也就是之前keyBy用来分区的字段。
- context：当前窗口进行计算的上下文，它的类型就是ProcessWindowFunction内部定义的抽象类Context。
- elements：窗口收集到用来计算的所有数据，这是一个可迭代的集合类型。
- out：用来发送数据输出计算结果的收集器，类型为Collector。

可以明显看出，这里的参数不再是一个输入数据，而是窗口中所有数据的集合。而上下文context所包含的内容也跟其他处理函数有所差别：

```java
public abstract class Context implements java.io.Serializable {
 public abstract W window();
 public abstract long currentProcessingTime();
 public abstract long currentWatermark();
 public abstract KeyedStateStore windowState();
 public abstract KeyedStateStore globalState();
 public abstract <X> void output(OutputTag<X> outputTag, X value);
}
```

除了可以通过.output()方法定义侧输出流不变外，其他部分都有所变化。这里不再持有TimerService对象，只能通过currentProcessingTime()和currentWatermark()来获取当前时间，所以失去了设置定时器的功能；另外由于当前不是只处理一个数据，所以也不再提供.timestamp()方法。与此同时，也增加了一些获取其他信息的方法：比如可以通过.window()直接获取到当前的窗口对象，也可以通过.windowState()和.globalState()获取到当前自定义的窗口状态和全局状态。注意这里的“窗口状态”是自定义的，不包括窗口本身已经有的状态，针对当前key、当前窗口有效；而“全局状态”同样是自定义的状态，针对当前key的所有窗口有效。

所以我们会发现，ProcessWindowFunction中除了.process()方法外，并没有.onTimer()方法，而是多出了一个.clear()方法。从名字就可以看出，这主要是方便我们进行窗口的清理工作。如果我们自定义了窗口状态，那么必须在.clear()方法中进行显式地清除，避免内存溢出。

这里有一个问题：没有了定时器，那窗口处理函数就失去了一个最给力的武器，如果我们希望有一些定时操作又该怎么做呢？其实仔细思考会发现，对于窗口而言，它本身的定义就包含了一个触发计算的时间点，其实一般情况下是没有必要再去做定时操作的。如果非要这么干，Flink也提供了另外的途径——**使用窗口触发器（Trigger）** 。在触发器中也有一个TriggerContext，它可以起到类似TimerService的作用：获取当前时间、注册和删除定时器，另外还可以获取当前的状态。这样设计无疑会让处理流程更加清晰——定时操作也是一种“触发”，所以我们就让所有的触发操作归触发器管，而所有处理数据的操作则归窗口函数管。

至于另一种窗口处理函数ProcessAllWindowFunction，它的用法非常类似。区别在于它基于的是AllWindowedStream，相当于对没有keyBy的数据流直接开窗并调用.process()方法:

```java
stream.windowAll( TumblingEventTimeWindows.of(Time.seconds(10)) )
.process(new MyProcessAllWindowFunction())
```

## 四、应用案例—TopN

窗口的计算处理，在实际应用中很常见。对于一些比较复杂的需求，如果增量聚合函数无法满足，就需要考虑使用窗口处理函数这样的“大招”了。

网站中一个非常经典的例子，就是实时统计一段时间内的热门url。例如，需要统计最近10秒钟内最热门的两个url链接，并且每5秒钟更新一次。我们知道，这可以用一个滑动窗口来实现，而“热门度”一般可以直接用访问量来表示。于是就需要开滑动窗口收集url的访问数据，按照不同的url进行统计，而后汇总排序并最终输出前两名。这其实就是著名的“TopN”问题。

很显然，简单的增量聚合可以得到url链接的访问量，但是后续的排序输出TopN就很难实现了。所以接下来用窗口处理函数进行实现。

## 1.使用 ProcessAllWindowFunction

一种最简单的想法是:不区分url链接，将所有访问数据都收集起来，统一进行统计计算。所以可以不做keyBy，直接基于DataStream开窗，然后使用全窗口函数ProcessAllWindowFunction来进行处理。

**在窗口中可以用一个HashMap来保存每个url的访问次数，只要遍历窗口中的所有数据，自然就能得到所有url的热门度。最后把HashMap转成一个列表ArrayList，然后进行排序、取出前两名输出就可以了**。

【代码实现】

```java
package com.kunan.StreamAPI.ProcessFunction;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.windowing.ProcessAllWindowFunction;
import org.apache.flink.streaming.api.windowing.assigners.SlidingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.sql.Timestamp;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
public class TopNProcessAllWindowFunctionExp {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);;
        SingleOutputStreamOperator<Event> stream = env.addSource(new ClickSource())
                .assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ZERO)
                        .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                            @Override
                            public long extractTimestamp(Event element, long recordTimestamp) {
                                return element.timestamp;
                            }
                        }));
        //直接开窗，收集所有数据排序
        stream.map(data -> data.url)
                        .windowAll(SlidingEventTimeWindows.of(Time.seconds(10),Time.seconds(5)))
                                .aggregate(new UrlHashMapCountAgg(),new UrlAllWindowResult())
                                        .print();
        env.execute();
    }
    //实现自定义的增量函数
    public static class UrlHashMapCountAgg implements AggregateFunction<String, HashMap<String,Long>, ArrayList<Tuple2<String,Long>>>{
        @Override
        public HashMap<String, Long> createAccumulator() {
            return new HashMap<>();
        }
        @Override
        public HashMap<String, Long> add(String value, HashMap<String, Long> accumulator) {
            if(accumulator.containsKey(value)){
                Long count = accumulator.get(value);
                accumulator.put(value, count + 1);
            } else {
                accumulator.put(value,1L);
            }
            return accumulator;
        }
        @Override
        public ArrayList<Tuple2<String, Long>> getResult(HashMap<String, Long> accumulator) {
            ArrayList<Tuple2<String,Long>> result = new ArrayList<>();
            for (String key:accumulator.keySet()){
                result.add(Tuple2.of(key,accumulator.get(key)));
            }
            result.sort(new Comparator<Tuple2<String, Long>>() {
                @Override
                public int compare(Tuple2<String, Long> o1, Tuple2<String, Long> o2) {
                    return o2.f1.intValue() - o1.f1.intValue();
                }
            });
            return result;
        }
        @Override
        public HashMap<String, Long> merge(HashMap<String, Long> a, HashMap<String, Long> b) {
            return null;
        }
    }
    //实现自定义全窗口函数，包装信息输出结果
    public static class UrlAllWindowResult extends ProcessAllWindowFunction<ArrayList<Tuple2<String,Long>>,String, TimeWindow>{
        @Override
        public void process(ProcessAllWindowFunction<ArrayList<Tuple2<String, Long>>, String, TimeWindow>.Context context, Iterable<ArrayList<Tuple2<String, Long>>> elements, Collector<String> out) throws Exception {
            ArrayList<Tuple2<String, Long>> list = elements.iterator().next();
            StringBuilder result = new StringBuilder();
            result.append("----------------------------------------\n");
            result.append("窗口结束时间：" + new Timestamp(context.window().getEnd()) + "\n");
            //取List前两个，包装信息输出
            for (int i = 0; i < 2; i++) {
                Tuple2<String, Long> currTuple = list.get(i);
                String info = "No. " + (i+1) + " "
                        + " url: " + currTuple.f0 + " "
                        + " 访问量：" + currTuple.f1 + "\n";
                result.append(info);
            }
            result.append("----------------------------------------\n");
            out.collect(result.toString());
        }
    }
}
```

运行结果如下所示：

```java
----------------------------------------
窗口结束时间：2022-09-11 10:36:40.0
No. 1  url: ./fav  访问量：2
No. 2  url: ./prod?id=100  访问量：2
----------------------------------------
```

## 2.使用 KeyedProcessFunction

在上面的实现过程中，没有进行按键分区，而是直接将所有数据放在一个分区上进行了开窗操作。相当于将并行度强行设置为1，在实际应用中是要尽量避免的，所以Flink官方也并不推荐使用AllWindowedStream进行处理。另外，在全窗口函数中定义了HashMap来统计url链接的浏览量，计算过程是要先收集齐所有数据、然后再逐一遍历更新HashMap，这显然不够高效。如果可以利用增量聚合函数的特性，每来一条数据就更新一次对应url的浏览量，那么到窗口触发计算时只需要做排序输出就可以了。

基于这样的想法，我们可以从两个方面去做优化：

- 是对数据进行按键分区，分别统计浏览量；
- 进行增量聚合，得到结果最后再做排序输出。

所以，可以使用增量聚合函数AggregateFunction进行浏览量的统计，然后结合ProcessWindowFunction排序输出来实现TopN的需求。

具体实现思路就是，先按照url对数据进行keyBy分区，然后开窗进行增量聚合。这里就会发现一个问题：*进行按键分区之后，窗口的计算就会只针对当前key有效了；也就是说，每个窗口的统计结果中，只会有一个url的浏览量，这是无法直接用ProcessWindowFunction进行排序的*。所以只能分成两步：**先对每个url链接统计出浏览量，然后再将统计结果收集起来，排序输出最终结果**。因为最后的排序还是基于每个时间窗口的，所以为了让输出的统计结果中包含窗口信息，可以借用之前定义的POJO类UrlViewCount来表示，它包含了url、浏览量（count）以及窗口的起始结束时间。之后对UrlViewCount的处理，可以先按窗口分区，然后用KeyedProcessFunction来实现。

总结处理流程如下：

1、读取数据源；

2、筛选浏览行为（pv）；

3、提取时间戳并生成水位线；

4、按照 url 进行 keyBy 分区操作；

5、开长度为 1 小时、步长为 5 分钟的事件时间滑动窗口；

6、使用增量聚合函数 AggregateFunction，并结合全窗口函数 WindowFunction 进行窗口 聚合，得到每个 url、在每个统计窗口内的浏览量，包装成 UrlViewCount；

7、按照窗口进行 keyBy 分区操作；

8、对同一窗口的统计结果数据，使用 KeyedProcessFunction 进行收集并排序输出。

这里又会带来另一个问题。***最后用KeyedProcessFunction来收集数据做排序，这时面对的就是窗口聚合之后的数据流，而窗口已经不存在了；那到底什么时候会收集齐所有数据呢？***这问题听起来似乎有些没道理。统计浏览量的窗口已经关闭，就说明了当前已经到了要输出结果的时候，直接输出不就行了吗？

没有这么简单。因为数据流中的元素是逐个到来的，所以即使理论上应该“同时”收到很多url的浏览量统计结果，实际也是有先后的、只能一条一条处理。下游任务（就是我们定义的KeyedProcessFunction）看到一个url的统计结果，并不能保证这个时间段的统计数据不会再来了，所以也不能贸然进行排序输出。解决的办法，自然就是要等所有数据到齐了——这很容易让我们联想起水位线设置延迟时间的方法。这里也可以“多等一会儿”，等到水位线真正超过了窗口结束时间，要统计的数据就肯定到齐了。

具体实现上，**可以采用一个延迟触发的事件时间定时器**。基于窗口的结束时间来设定延迟，其实并不需要等太久——因为我们是靠水位线的推进来触发定时器，而水位线的含义就是“之前的数据都到齐了”。所以我们只需要设置1毫秒的延迟，就一定可以保证这一点。

而在等待过程中，之前已经到达的数据应该缓存起来，我们这里用一个自定义的“列表状态”（ListState）来进行存储，这个状态需要使用富函数类的getRuntimeContext()方法获取运行时上下文来定义，一般把它放在open()生命周期方法中。之后每来一个UrlViewCount，就把它添加到当前的列表状态中，并注册一个触发时间为窗口结束时间加1毫秒（windowEnd+1）的定时器。待到水位线到达这个时间，定时器触发，我们可以保证当前窗口所有url的统计结果UrlViewCount都到齐了；于是从状态中取出进行排序输出。

【代码实现】

```java
package com.kunan.StreamAPI.ProcessFunction;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import com.kunan.StreamAPI.Window.UrlCountViewExample;
import com.kunan.StreamAPI.Window.UrlViewCount;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.state.ListState;
import org.apache.flink.api.common.state.ListStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.streaming.api.windowing.assigners.SlidingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.Collector;
import java.sql.Timestamp;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
public class TopNExample {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //读取数据
        SingleOutputStreamOperator<Event> stream = env.addSource(new ClickSource())
                .assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ZERO)
                        .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                            @Override
                            public long extractTimestamp(Event element, long recordTimestamp) {
                                return element.timestamp;
                            }
                        }));
        //1.安装URl分组，统计窗口内每个Url的访问量
        SingleOutputStreamOperator<UrlViewCount> urlCountStream = stream.keyBy(data -> data.url)
                .window(SlidingEventTimeWindows.of(Time.seconds(10), Time.seconds(5)))
                .aggregate(new UrlCountViewExample.UrlViewCountAgg(), new UrlCountViewExample.UrlViewCountResult());
        urlCountStream.print("UrlCount: ");
        //2.对于同一窗口统计出的访问量，进行收集和排序
        urlCountStream.keyBy(data -> data.windowEnd)
                        .process(new TopNProcessResult(2))
                                .print();
        env.execute();
    }
    //实现自定义的keyedProcessFunction
    public static class TopNProcessResult extends KeyedProcessFunction<Long,UrlViewCount,String>{
       //定义一个属性，n
        private Integer n;
        //定义列表状态
        private ListState<UrlViewCount> urlViewCountListState;
        //触发定时器
        @Override
        public void onTimer(long timestamp, KeyedProcessFunction<Long, UrlViewCount, String>.OnTimerContext ctx, Collector<String> out) throws Exception {
            ArrayList<UrlViewCount> urlViewCountArrayList = new ArrayList<>();
            for(UrlViewCount urlViewCount: urlViewCountListState.get()){
                urlViewCountArrayList.add(urlViewCount);
            }
            urlViewCountArrayList.sort(new Comparator<UrlViewCount>() {
                @Override
                public int compare(UrlViewCount o1, UrlViewCount o2) {
                    return o2.count.intValue() - o1.count.intValue();
                }
            });
            StringBuilder result = new StringBuilder();
            result.append("----------------------------------------\n");
            result.append("窗口结束时间：" + new Timestamp(ctx.getCurrentKey()) + "\n");
            //取List前两个，包装信息输出
            for (int i = 0; i < 2; i++) {
                UrlViewCount currTuple = urlViewCountArrayList.get(i);
                String info = "No. " + (i+1) + " "
                        + " url: " + currTuple.url + " "
                        + " 访问量：" + currTuple.count + "\n";
                result.append(info);
            }
            result.append("----------------------------------------\n");
            out.collect(result.toString());
        }
        public TopNProcessResult(Integer n) {
            this.n = n;
        }
        // 在环境中获取状态
        @Override
        public void open(Configuration parameters) throws Exception {
            urlViewCountListState = getRuntimeContext().getListState(
                    new ListStateDescriptor<UrlViewCount>("url-count-list", Types.POJO(UrlViewCount.class))
            );
        }
        @Override
        public void processElement(UrlViewCount value, KeyedProcessFunction<Long, UrlViewCount, String>.Context ctx, Collector<String> out) throws Exception {
            //将数据保存到状态中
            urlViewCountListState.add(value);
            //注册windowEnd + 1ms定时器
            ctx.timerService().registerEventTimeTimer(ctx.getCurrentKey() + 1);
        }
    }
}
```

代码中，还利用了定时器的特性：针对同一key、同一时间戳会进行去重。所以对于同一个窗口而言，我们接到统计结果数据后设定的windowEnd+1的定时器都是一样的，最终只会触发一次计算。而对于不同的key（这里key是windowEnd），定时器和状态都是独立的，所以我们也不用担心不同窗口间数据的干扰。

所以我们也不用担心不同窗口间数据的干扰。我们在上面的代码中使用了后面要讲解的ListState。这里先简单说明一下。我们先声明一个列表状态变量:

```java
private ListState<UrlViewCount> urlViewCountListState;
```

然后在open方法中初始化了列表状态变量，我们初始化的时候使用了ListStateDescriptor描述符，这个描述符用来告诉Flink列表状态变量的名字和类型。列表状态变量是单例，也就是说只会被实例化一次。这个列表状态变量的作用域是当前key所对应的逻辑分区。我们使用add方法向列表状态变量中添加数据，使用get方法读取列表状态变量中的所有元素。

另外，根据水位线的定义，我们这里的延迟时间设为0事实上也是可以保证数据都到齐的。

## 五、侧输出流（Side Output）

处理函数还有另外一个特有功能，就是将自定义的数据放入“侧输出流”（sideoutput）输出。这个概念并不陌生，之前在在窗口处理迟到数据时，最后一招就是输出到侧输出流。而这种处理方式的本质，其实就是处理函数的侧输出流功能。

之前讲到的绝大多数转换算子，输出的都是单一流，流里的数据类型只能有一种。而侧输出流可以认为是“主流”上分叉出的“支流”，所以可以由一条流产生出多条流，而且这些流中的数据类型还可以不一样。利用这个功能可以很容易地实现“分流”操作。

**具体应用时，只要在处理函数的.processElement()或者.onTimer()方法中，调用上下文的.output()方法就可以了。**

```java
DataStream<Integer> stream = env.addSource(...);
SingleOutputStreamOperator<Long> longStream = stream.process(new
ProcessFunction<Integer, Long>() {
 @Override
 public void processElement( Integer value, Context ctx, Collector<Integer>
out) throws Exception {
 // 转换成 Long，输出到主流中
 out.collect(Long.valueOf(value));
 // 转换成 String，输出到侧输出流中
 ctx.output(outputTag, "side-output: " + String.valueOf(value));
 }
});
```

这里output()方法需要传入两个参数，第一个是一个“输出标签”OutputTag，用来标识侧输出流，一般会在外部统一声明；第二个就是要输出的数据。

可以在外部先将OutputTag声明出来：

```java
OutputTag<String> outputTag = new OutputTag<String>("side-output") {};
```

如果想要获取这个侧输出流，可以基于处理之后的DataStream直接调用.getSideOutput()方法，传入对应的OutputTag，这个方式与窗口API中获取侧输出流是完全一样的。

```java
DataStream<String> stringStream = longStream.getSideOutput(outputTag);
```

## 总结

Flink拥有非常丰富的多层API，而底层的处理函数可以说是最为强大、最为灵活的一种。广义上来讲，处理函数也可以认为是DataStreamAPI中的一部分，它的调用方式与其他转换算子完全一致。处理函数可以访问时间、状态，定义定时操作，它可以直接触及流处理最为本质的组成部分。所以处理函数不仅是处理复杂需求时兜底的“大招”，更是理解流处理本质的重要一环。

本节详细介绍了处理函数的功能和底层的结构，重点讲解了最为常用的KeyedProcessFunction和ProcessWindowFunction，并实现了电商应用中TopN的经典案例，另外还介绍了侧输出流的用法。而关于合并两条流之后的处理函数，以及广播连接流（BroadcastConnectedStream）的处理操作，调用方法和原理都非常类似，会在后续继续学习。
