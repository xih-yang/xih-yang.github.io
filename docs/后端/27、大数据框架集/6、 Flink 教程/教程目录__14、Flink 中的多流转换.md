# 14、Flink 中的多流转换
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/14.html
- 分类：大数据框架
- 分组：教程目录
## 多流转换

无论是基本的简单转换和聚合，还是基于窗口的计算，都是针对一条流上的数据进行处理的。**而在实际应用中，可能需要将不同来源的数据连接合并在一起处理，也有可能需要将 一条流拆分开，所以经常会有对多条流进行处理的场景**。本章就来讨论Flink中对多条流进行转换的操作。 简单划分的话，多流转换可以分为“分流”和“合流”两大类。目前**分流的操作一般是通过侧输出流（side output）** 来实现，而合流的算子比较丰富，根据不同的需求可以调用 union、 connect、join 以及 coGroup 等接口进行连接合并操作。下面我们就进行具体的学习。

## 一、 分流

**所谓“分流”，就是将一条数据流拆分成完全独立的两条、甚至多条流**。也就是基于一个DataStream，得到完全平等的多个子DataStream，如图所示。一般来说，会定义一些筛选条件，将符合条件的数据拣选出来放到对应的流里。

## 1.简单实现

其实根据条件筛选数据的需求，本身非常容易实现：只要针对同一条流多次独立调用.filter()方法进行筛选，就可以得到拆分之后的流了。 例如，可以将电商网站收集到的用户行为数据进行一个拆分，根据类型（type）的不 同，分为“Marry”的浏览数据、“Bob”的浏览数据等等。

【实现代码】

```java
package com.kunan.StreamAPI.ETLStream;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.functions.FilterFunction;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
public class SplitStreamByFilter {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        SingleOutputStreamOperator<Event> stream = env.addSource(new ClickSource());
        // 筛选 Mary 的浏览行为放入 MaryStream 流中
        DataStream<Event> MaryStream = stream.filter(new FilterFunction<Event>()
        {
            @Override
            public boolean filter(Event value) throws Exception {
                return value.user.equals("Marry");
            }
        });
        // 筛选Bob的购买行为放入 BobStream 流中
        DataStream<Event> BobStream = stream.filter(new FilterFunction<Event>() {
            @Override
            public boolean filter(Event value) throws Exception {
                return value.user.equals("Bob");
            }
        });
        // 筛选其他人的浏览行为放入 elseStream 流中
        DataStream<Event> elseStream = stream.filter(new FilterFunction<Event>()
        {
            @Override
            public boolean filter(Event value) throws Exception {
                return !value.user.equals("Marry") && !value.user.equals("Bob") ;
            }
        });
        MaryStream.print("Marry记录：");
        BobStream.print("Bob记录： ");
        elseStream.print("其他： ");
        env.execute();
    }
}
```

输出结果：

```java
其他： > Event{user='Alice', url='./cart', timestamp=2022-09-18 12:04:08.028}
其他： > Event{user='Alice', url='./home', timestamp=2022-09-18 12:04:09.039}
其他： > Event{user='Alice', url='./fav', timestamp=2022-09-18 12:04:10.045}
其他： > Event{user='Jek', url='./prod?id=199', timestamp=2022-09-18 12:04:11.049}
Marry记录：> Event{user='Marry', url='./fav', timestamp=2022-09-18 12:04:12.056}
Bob记录： > Event{user='Bob', url='./cart', timestamp=2022-09-18 12:04:13.059}
Bob记录： > Event{user='Bob', url='./home', timestamp=2022-09-18 12:04:14.064}
Marry记录：> Event{user='Marry', url='./prod?id=199', timestamp=2022-09-18 12:04:15.066}
Marry记录：> Event{user='Marry', url='./cart', timestamp=2022-09-18 12:04:16.069}
Marry记录：> Event{user='Marry', url='./home', timestamp=2022-09-18 12:04:17.077}
```

## 2.使用侧输出流

在Flink 1.13 版本中，已经弃用了.split()方法，取而代之的是直接用处理函数（process function）的侧输出流（side output）。

**处理函数本身可以认为是一个转换算子，它的输出类型是单一的，处理之后得到的仍然是一个DataStream；而侧输出流则不受限制，可以任意自定义输出数据，**它们就像从“主流”上分叉出的“支流”。尽管看起来主流和支流有所区别，不过实际上它们都是某种类型的DataStream，所以本质上还是平等的。利用侧输出流就可以很方便地实现分流操作，而且得到的多条DataStream类型可以不同，这就给我们的应用带来了极大的便利。

关于处理函数中侧输出流的用法，之前有详细介绍。只需要调用上下文ctx的.output()方法，就可以输出任意类型的数据了。而侧输出流的标记和提取，都离不开一个“输出标签”（OutputTag），它就相当于split()分流时的“戳”，指定了侧输出流的id和类型。

可以使用侧输出流将基于filter分流代码改写如下：

```java
package com.kunan.StreamAPI.ETLStream;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.ProcessFunction;
import org.apache.flink.util.Collector;
import org.apache.flink.util.OutputTag;
import java.time.Duration;
public class SplitStreamTest {
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
        //定义输出标签
        OutputTag<Tuple3<String, String, Long>> MarryTag = new OutputTag<Tuple3<String,String,Long>>("Mary"){};
        OutputTag<Tuple3<String, String, Long>> BobTag = new OutputTag<Tuple3<String,String,Long>>("Bob"){};
        SingleOutputStreamOperator<Event> processStream = stream.process(new ProcessFunction<Event, Event>() {
            @Override
            public void processElement(Event value, ProcessFunction<Event, Event>.Context ctx, Collector<Event> out) throws Exception {
                if (value.user.equals("Marry")) {
                    ctx.output(MarryTag, Tuple3.of(value.user, value.url, value.timestamp));
                } else if (value.user.equals("Bob")) {
                    ctx.output(BobTag, Tuple3.of(value.user, value.url, value.timestamp));
                } else
                    out.collect(value);
            }
        });
        processStream.print("主流：");
        processStream.getSideOutput(MarryTag).print("Marry相关数据： ");
        processStream.getSideOutput(BobTag).print("Bob相关数据： ");
        env.execute();
    }
}
```

运行结果：

```java
Marry相关数据： > (Marry,./home,1663473987881)
Marry相关数据： > (Marry,./cart,1663473988891)
主流：> Event{user='Jek', url='./prod?id=100', timestamp=2022-09-18 12:06:29.897}
Bob相关数据： > (Bob,./cart,1663473990902)
Marry相关数据： > (Marry,./fav,1663473991910)
主流：> Event{user='Alice', url='./cart', timestamp=2022-09-18 12:06:32.913}
主流：> Event{user='Jek', url='./prod?id=199', timestamp=2022-09-18 12:06:33.917}
```

这里定义了两个侧输出流，分别拣选Marry的浏览事件和Bob的浏览事件；由于类型已经确定，可以只保留(用户id,url,时间戳)这样一个三元组。而剩余的事件则直接输出到主流，类型依然保留Event，就相当于之前的其他。这样的实现方式显然更简洁，也更加灵活。

## 二、基本合流操作

既然一条流可以分开，自然多条流就可以合并。在实际应用中，经常会遇到来源不同的多条流，需要将它们的数据进行联合处理。所以Flink中合流的操作会更加普遍，对应的API也更加丰富。

## 1.联合（Union）

**最简单的合流操作，就是直接将多条流合在一起，叫作流的“联合”（union）** ，如图所示。联合操作要求必须流中的数据类型必须相同，合并之后的新流会包括所有流中的元素， 数据类型不变。这种合流方式非常简单粗暴，就像公路上多个车道汇在一起一样。

在代码中，只要基于DataStream直接调用.union()方法，传入其他DataStream作为参数，就可以实现流的联合了；得到的依然是一个DataStream：

```java
stream1.union(stream2, stream3, ...)
```

注意：union()的参数可以是多个DataStream，所以联合操作可以实现多条流的合并

这里需要考虑一个问题。在事件时间语义下，水位线是时间的进度标志；不同的流中可能水位线的进展快慢完全不同，如果它们合并在一起，水位线又该以哪个为准呢？

还以要考虑水位线的本质含义，是“之前的所有数据已经到齐了”；所以对于合流之后的水位线，也是要以最小的那个为准，这样才可以保证所有流都不会再传来之前的数据。换句话说，多流合并时处理的时效性是以最慢的那个流为准的。自然可以想到，这与之前介绍的并行任务水位线传递的规则是完全一致的；多条流的合并，某种意义上也可以看作是多个并行任务向同一个下游任务汇合的过程。

【示例代码】

```java
package com.kunan.StreamAPI.ETLStream;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.ProcessFunction;
import org.apache.flink.util.Collector;
import java.time.Duration;
public class UnionStreamTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        SingleOutputStreamOperator<Event> stream1 =
                env.socketTextStream("hadoop102", 7777)
                .map(data -> {
                    String[] filed = data.split(",");
                    return new Event(filed[0].trim(), filed[1].trim(), Long.valueOf(filed[2].trim()));
                })
               .assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ofSeconds(2))
                       .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                           @Override
                           public long extractTimestamp(Event element, long recordTimestamp) {
                                return element.timestamp;
                           }
                       }));
     stream1.print("stream1的数据：");
       SingleOutputStreamOperator<Event> stream2 = env.socketTextStream("hadoop103", 7777)
               .map(data -> {
                   String[] filed = data.split(",");
                   return new Event(filed[0].trim(), filed[1].trim(), Long.valueOf(filed[2].trim()));
               })
               .assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
                       .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                           @Override
                           public long extractTimestamp(Event element, long recordTimestamp) {
                               return element.timestamp;
                           }
                       }));
       stream2.print("stream2的数据：");
       //合并两条流
       stream1.union(stream2)
                       .process(new ProcessFunction<Event, String>() {
                           @Override
                           public void processElement(Event value, ProcessFunction<Event, String>.Context ctx, Collector<String> out) throws Exception {
                               out.collect("水位线" + ctx.timerService().currentWatermark());
                           }
                       }).print();
        env.execute();
    }
}
```

这里为了更清晰地看到水位线的进展，创建了两条流来读取socket文本数据，并从数据中提取时间戳作为生成水位线的依据。用union将两条流合并后，用一个ProcessFunction来进行处理，获取当前的水位线进行输出。我们会发现两条流中每输入一个数据，合并之后的流中都会有数据出现；而水位线只有在两条流中水位线最小值增大的时候，才会真正向前推进。

可以来分析一下程序的运行：在合流之后的ProcessFunction对应的算子任务中，逻辑时钟的初始状态如图所示。

由于Flink会在流的开始处，插入一个负无穷大（Long.MIN_VALUE）的水位线，所以合流后的ProcessFunction对应的处理任务，会为合并的每条流保存一个“分区水位线”，初始值都是Long.MIN_VALUE；而此时算子任务的水位线是所有分区水位线的最小值，因此也是Long.MIN_VALUE。

我们在第一条socket文本流输入数据[Alice,./home,1000]时，水位线不会立即改变，只有到水位线生成周期的时间点（200ms一次）才会推进到1000-1=999毫秒；这与之前小节中对事件时间定时器的测试是一致的。不过即使第一条水位线推进到了999，由于另一条流没有变化，所以合流之后的Process任务水位线仍然是初始值。如图所示。

如果这时在第二条socket文本流输入数据[Alice,./home,2000]，那么第二条流的水位线会随之推进到2000–1=1999毫秒，Process任务所保存的第二条流分区水位线更新为1999；这样两个分区水位线取最小值，Process任务的水位线也就可以推进到999了。如图所示。

进而如果我们继续在第一条流中输入数据[Alice,./home,3000]，Process任务的第一条流分区水位线就会更新为2999，同时将算子任务的时钟推进到1999。状态如图所示；

## 2.连接（Connect）

流的联合虽然简单，不过受限于数据类型不能改变，灵活性大打折扣，所以实际应用较少出现。除了联合（union），Flink还提供了另外一种方便的合流操作——**连接（connect）。顾名思义，这种操作就是直接把两条流像接线一样对接起来。**

###  连接流（ConnectedStreams）

为了处理更加灵活，连接操作允许流的数据类型不同。但一个DataStream中的数据只能有唯一的类型，所以连接得到的并不是DataStream，而是一个“连接流”（ConnectedStreams）。**连接流可以看成是两条流形式上的“统一”，被放在了一个同一个流中**；事实上内部仍保持各自的数据形式不变，彼此之间是相互独立的。**要想得到新的DataStream，还需要进一步定义一个“同处理”（co-process）转换操作**，用来说明对于不同来源、不同类型的数据，怎样分别进行处理转换、得到统一的输出类型。所以整体上来，两条流的连接就像是“一国两制”，两条流可以保持各自的数据类型、处理方式也可以不同，不过最终还是会统一到同一个DataStream中，如图所示。

在代码实现上，需要分为两步：首先基于一条DataStream调用.connect()方法，传入另外一条DataStream作为参数，将两条流连接起来，得到一个ConnectedStreams；然后再调用同处理方法得到DataStream。这里可以的调用的同处理方法有.map()|.flatMap()，以及.process()方法。

【示例代码】

```java
package com.kunan.StreamAPI.ETLStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.co.CoMapFunction;
public class ConnectStreamTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<Integer> stream1 = env.fromElements(1, 2, 3);
        DataStreamSource<Long> stream2 = env.fromElements(4L, 5L, 6L,7L);
        stream2.connect(stream1)
                        .map(new CoMapFunction<Long, Integer, String>() {
                            @Override
                            public String map1(Long value) throws Exception {
                                return "Long: " + value.toString();
                            }
                            @Override
                            public String map2(Integer value) throws Exception {
                                return "Integer: " + value.toString();
                            }
                        }).print();
        env.execute();
    }
}
```

输出结果：

```java
Long: 4
Integer: 1
Long: 5
Integer: 2
Long: 6
Integer: 3
Long: 7
```

上面的代码中，ConnectedStreams有两个类型参数，分别表示内部包含的两条流各自的数据类型；由于需要“一国两制”，因此调用.map()方法时传入的不再是一个简单的MapFunction，而是一个CoMapFunction，表示分别对两条流中的数据执行map操作。**这个接口有三个类型参数，依次表示第一条流、第二条流，以及合并后的流中的数据类型**。需要实现的方法也非常直白：**.map1()就是对第一条流中数据的map操作，.map2()则是针对第二条流**。这里将一条Long 流和一条Integer流合并，转换成String输出。所以当遇到第一条流输入的长整型值时，调用.map1()；而遇到第二条流输入整型的数据时，调用.map2():最终都转换为字符串输出，合并成了一条字符串流。

值得一提的是，ConnectedStreams也可以直接调用.keyBy()进行按键分区的操作，得到的还是一个ConnectedStreams：

```java
connectedStreams.keyBy(keySelector1, keySelector2);
```

这里传入两个参数keySelector1和keySelector2，是两条流中各自的键选择器；当然也可以直接传入键的位置值（keyPosition），或者键的字段名（field），这与普通的keyBy用法完全一致。ConnectedStreams进行keyBy操作，其实就是把两条流中key相同的数据放到了一起，然后针对来源的流再做各自处理，这在一些场景下非常有用。另外，也可以在合并之前就将两条流分别进行keyBy,得到的KeyedStream再进行连接（connect）操作，效果是一样的。要注意两条流定义的键的类型必须相同，否则会抛出异常。

两条流的连接（connect），与联合（union）操作相比，最大的优势就是可以处理不同类型的流的合并，使用更灵活、应用更广泛。当然它也有限制，就是合并流的数量只能是2，而union可以同时进行多条流的合并。这也非常容易理解：union限制了类型不变，所以直接合并没有问题；而connect是“一国两制”，后续处理的接口只定义了两个转换方法，如果扩展需要重新定义接口，所以不能“一国多制”。

###  CoProcessFunction

对于连接流ConnectedStreams的处理操作，需要分别定义对两条流的处理转换，因此接口中就会有两个相同的方法需要实现，用数字“1”“2”区分，在两条流中的数据到来时分别调用。把这种接口叫作“协同处理函数”（co-processfunction）。与CoMapFunction类似，如果是调用.flatMap()就需要传入一个CoFlatMapFunction，需要实现flatMap1()、flatMap2()两个方法；而调用.process()时，传入的则是一个CoProcessFunction。

抽象类CoProcessFunction 在源码中定义如下：

```java
public abstract class CoProcessFunction<IN1, IN2, OUT> extends
AbstractRichFunction {
...
public abstract void processElement1(IN1 value, Context ctx, Collector<OUT>
out) throws Exception;
public abstract void processElement2(IN2 value, Context ctx, Collector<OUT>
out) throws Exception;
public void onTimer(long timestamp, OnTimerContext ctx, Collector<OUT> out)
throws Exception {}
public abstract class Context {...}
...
}
```

可以看到，很明显CoProcessFunction也是“处理函数”家族中的一员，用法非常相似。它需要实现的就是processElement1()、processElement2()两个方法，在每个数据到来时，会根据来源的流调用其中的一个方法进行处理。CoProcessFunction同样可以通过上下文ctx来访问timestamp、水位线，并通过TimerService注册定时器；另外也提供了.onTimer()方法，用于定义定时触发的处理操作。

下面是CoProcessFunction的一个具体示例：【可以实现一个实时对账的需求，也就是app的支付操作和第三方的支付操作的一个双流Join。App的支付事件和第三方的支付事件将会互相等待5秒钟，如果等不来对应的支付事件，那么就输出报警信息】。

【代码实现】

```java
package com.kunan.StreamAPI.ETLStream;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.api.java.tuple.Tuple4;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.co.CoProcessFunction;
import org.apache.flink.util.Collector;
import java.time.Duration;
public class BillCheckExample {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //来自app的支付日志
        SingleOutputStreamOperator<Tuple3<String, String, Long>> appStream = env.fromElements(
                Tuple3.of("order-1", "app", 1000L),
                Tuple3.of("order-2", "app", 2000L),
                Tuple3.of("order-3", "app", 3500L)
        ).assignTimestampsAndWatermarks(WatermarkStrategy.<Tuple3<String, String, Long>>forBoundedOutOfOrderness(Duration.ZERO)
                .withTimestampAssigner(new SerializableTimestampAssigner<Tuple3<String, String, Long>>() {
                    @Override
                    public long extractTimestamp(Tuple3<String, String, Long> element, long recordTimestamp) {
                        return element.f2;
                    }
                }));
        //来自第三方支付平台的支付日志
        SingleOutputStreamOperator<Tuple4<String, String, String, Long>> PlatStream = env.fromElements(
                Tuple4.of("order-1", "third-plat", "success", 3000L),
                Tuple4.of("order-3", "third-plat", "success", 4000L)
        ).assignTimestampsAndWatermarks(WatermarkStrategy.<Tuple4<String, String, String, Long>>forBoundedOutOfOrderness(Duration.ZERO)
                .withTimestampAssigner(new SerializableTimestampAssigner<Tuple4<String, String, String, Long>>() {
                    @Override
                    public long extractTimestamp(Tuple4<String, String, String, Long> element, long recordTimestamp) {
                        return element.f3;
                    }
                }));
        //检测同一支付单在两条流中是否匹配，不匹配就报警
        //第一种方式
        appStream.keyBy(data -> data.f0)
                        .connect(PlatStream.keyBy(data -> data.f0));
        //第二种方式 join on
        appStream.connect(PlatStream)
                        .keyBy(data -> data.f0,data -> data.f0)
                .process(new OrderMatchResult())
                .print();
        env.execute();
    }
    //自定义实现一个CoProcessFunction
    public static class OrderMatchResult extends CoProcessFunction<Tuple3<String,String,Long>,Tuple4<String,String,String,Long>,String>{
       //定义状态变量 用来保存已经到达的事件
        private ValueState<Tuple3<String, String, Long>> appEventState;
        private ValueState<Tuple4<String, String, String, Long>> platEventState; //第三方平台
        @Override
        public void open(Configuration parameters) throws Exception {
            appEventState = getRuntimeContext().getState(
                    new ValueStateDescriptor<Tuple3<String, String, Long>>("app-event", Types.TUPLE(Types.STRING, Types.STRING, Types.LONG))
            );
            platEventState = getRuntimeContext().getState(
                    new ValueStateDescriptor<Tuple4<String, String,String,Long>>("Plat-event", Types.TUPLE(Types.STRING, Types.STRING,Types.STRING, Types.LONG))
            );
        }
        @Override
        public void processElement1(Tuple3<String, String, Long> value, CoProcessFunction<Tuple3<String, String, Long>, Tuple4<String, String, String, Long>, String>.Context ctx, Collector<String> out) throws Exception {
            //来的App Event 看另一条流中事件是否来过
            if(platEventState.value() != null){
                out.collect("Success！" + value + " " + platEventState.value());
                //清空状态
                platEventState.clear();
            }else {
                // 更新状态
                appEventState.update(value);
                //定义注册一个5s后的定时器，开始等待另一条流的事件
                ctx.timerService().registerEventTimeTimer(value.f2 + 5000L);
            }
        }
        @Override
        public void processElement2(Tuple4<String, String, String, Long> value, CoProcessFunction<Tuple3<String, String, Long>, Tuple4<String, String, String, Long>, String>.Context ctx, Collector<String> out) throws Exception {
            //来的App Event 看另一条流中事件是否来过
            if(appEventState.value() != null){
                out.collect("Success！" + appEventState.value() + " " + value);
                //清空状态
                appEventState.clear();
            }else {
                // 更新状态
                platEventState.update(value);
                //定义注册一个5s后的定时器，开始等待另一条流的事件
                ctx.timerService().registerEventTimeTimer(value.f3);
            }
        }
        @Override
        public void onTimer(long timestamp, CoProcessFunction<Tuple3<String, String, Long>, Tuple4<String, String, String, Long>, String>.OnTimerContext ctx, Collector<String> out) throws Exception {
            //定时器触发，判断状态，如果某个状态不为空，说明另一条流中事件每来
            if (appEventState.value() != null){
                out.collect("Fail! " + appEventState.value() + " " + " 第三方支付平台支付信息未到！ ");
            }
            if (platEventState.value() != null){
                out.collect("Fail! " + platEventState.value() + " " + " App支付平台信息未到！ ");
            }
            appEventState.clear();
            platEventState.clear();
        }
    }
}
```

运行结果：

```java
Success！(order-1,app,1000) (order-1,third-plat,success,3000)
Success！(order-3,app,3500) (order-3,third-plat,success,4000)
Fail! (order-2,app,2000)  第三方支付平台支付信息未到！
```

在程序中，声明了两个状态变量分别用来保存App的支付信息和第三方的支付信息。App的支付信息到达以后，会检查对应的第三方支付信息是否已经先到达（先到达会保存在对应的状态变量中），如果已经到达了，那么对账成功，直接输出对账成功的信息，并将保存第三方支付消息的状态变量清空。如果App对应的第三方支付信息没有到来，那么我们会注册一个5秒钟之后的定时器，也就是说等待第三方支付事件5秒钟。当定时器触发时，检查保存app支付信息的状态变量是否还在，如果还在，说明对应的第三方支付信息没有到来，所以输出报警信息。

###  广播连接流（BroadcastConnectedStream）

关于两条流的连接，还有一种比较特殊的用法：DataStream调用.connect()方法时，传入的参数也可以不是一个DataStream，而是一个“广播流”（BroadcastStream），这时合并两条流得到的就变成了一个“广播连接流”（BroadcastConnectedStream）。

这种连接方式往往用在需要动态定义某些规则或配置的场景。因为规则是实时变动的，所以可以用一个单独的流来获取规则数据；而这些规则或配置是对整个应用全局有效的，所以不能只把这数据传递给一个下游并行子任务处理，而是要“广播”（broadcast）给所有的并行子任务。而下游子任务收到广播出来的规则，会把它保存成一个状态，这就是所谓的“广播状态”（broadcaststate）。

广播状态底层是用一个“映射”（map）结构来保存的。在代码实现上，可以直接调用DataStream的.broadcast()方法，传入一个“映射状态描述器”（MapStateDescriptor）说明状态的名称和类型，就可以得到规则数据的“广播流”（BroadcastStream）：

```java
MapStateDescriptor<String, Rule> ruleStateDescriptor = new
MapStateDescriptor<>(...);
BroadcastStream<Rule> ruleBroadcastStream = ruleStream
 .broadcast(ruleStateDescriptor);
```

接下来我们就可以将要处理的数据流，与这条广播流进行连接（connect），得到的就是所谓的“广播连接流”（BroadcastConnectedStream）。基于BroadcastConnectedStream调用.process()方法，就可以同时获取规则和数据，进行动态处理了。

这里既然调用了.process()方法，当然传入的参数也应该是处理函数大家族中一员——如果对数据流调用过keyBy进行了按键分区，那么要传入的就是KeyedBroadcastProcessFunction；如果没有按键分区，就传入BroadcastProcessFunction。

```java
DataStream<String> output = stream
 .connect(ruleBroadcastStream)
 .process( new BroadcastProcessFunction<>() {...} );
```

BroadcastProcessFunction与CoProcessFunction类似，同样是一个抽象类，需要实现两个方法，针对合并的两条流中元素分别定义处理操作。区别在于这里一条流是正常处理数据，而另一条流则是要用新规则来更新广播状态，所以对应的两个方法叫作.processElement()和.processBroadcastElement()。源码中定义如下：

```java
public abstract class BroadcastProcessFunction<IN1, IN2, OUT> extends
BaseBroadcastProcessFunction {
...
 public abstract void processElement(IN1 value, ReadOnlyContext ctx,
Collector<OUT> out) throws Exception;
 public abstract void processBroadcastElement(IN2 value, Context ctx,
Collector<OUT> out) throws Exception;
...
}
```

关于广播状态和广播连接流的用法和示例，会在后续学习

## 三、基于时间的合流——双流联结（Join）

对于两条流的合并，很多情况并不是简单地将所有数据放在一起，而是希望根据某个字段的值将它们联结起来，“配对”去做处理。例如用传感器监控火情时，我们需要将大量温度传感器和烟雾传感器采集到的信息，按照传感器ID分组、再将两条流中数据合并起来，如果同时超过设定阈值就要报警。

我们发现，这种需求与关系型数据库中表的join操作非常相近。事实上，Flink中两条流的connect操作，就可以通过keyBy指定键进行分组后合并，实现了类似于SQL中的join操作；另外connect支持处理函数，可以使用自定义状态和TimerService灵活实现各种需求，其实已经能够处理双流合并的大多数场景。

不过处理函数是底层接口，所以尽管connect能做的事情多，但在一些具体应用场景下还是显得太过抽象了。比如，如果希望统计固定时间内两条流数据的匹配情况，那就需要设置定时器、自定义触发逻辑来实现——其实这完全可以用窗口（window）来表示。为了更方便地实现基于时间的合流操作，Flink的DataStremaAPI提供了两种内置的join算子，以及coGroup算子。本节我们就来做一个详细的讲解。

注：SQL中join一般会翻译为“连接”；我们这里为了区分不同的算子，一般的合流操作connect翻译为“连接”，而把join翻译为“联结”。

### 1.窗口联结（Window Join）

基于时间的操作，最基本的当然就是时间窗口了。之前已经介绍过WindowAPI的用法，主要是针对单一数据流在某些时间段内的处理计算。那如果我们希望将两条流的数据进行合并、且同样针对某段时间进行处理和统计，又该怎么做呢？

Flink为这种场景专门提供了一个**窗口联结（windowjoin）算子，可以定义时间窗口，并将两条流中共享一个公共键（key）的数据放在窗口中进行配对处理。**

**窗口联结的调用**

窗口联结在代码中的实现，首先需要调用DataStream的.join()方法来合并两条流，得到一个JoinedStreams；接着通过.where()和.equalTo()方法指定两条流中联结的key；然后通过.window()开窗口，并调用.apply()传入联结窗口函数进行处理计算。通用调用形式如下：

```java
stream1.join(stream2)
 .where(<KeySelector>)
 .equalTo(<KeySelector>)
 .window(<WindowAssigner>)
 .apply(<JoinFunction>)
```

上面代码中.where()的参数是键选择器（KeySelector），用来指定第一条流中的key；而.equalTo()传入的KeySelector则指定了第二条流中的key。两者相同的元素，如果在同一窗口中，就可以匹配起来，并通过一个“联结函数”（JoinFunction）进行处理了。

这里.window()传入的就是窗口分配器，之前讲到的三种时间窗口都可以用在这里：滚动窗口（tumblingwindow）、滑动窗口（slidingwindow）和会话窗口（sessionwindow）。

而后面调用.apply()可以看作实现了一个特殊的窗口函数。注意这里只能调用.apply()，没有其他替代的方法。

传入的JoinFunction也是一个函数类接口，使用时需要实现内部的.join()方法。这个方法有两个参数，分别表示两条流中成对匹配的数据。JoinFunction在源码中的定义如下：

```java
public interface JoinFunction<IN1, IN2, OUT> extends Function, Serializable {
 OUT join(IN1 first, IN2 second) throws Exception;
}
```

这里需要注意，JoinFunciton并不是真正的“窗口函数”，它只是定义了窗口函数在调用时对匹配数据的具体处理逻辑。

当然，既然是窗口计算，在.window()和.apply()之间也可以调用可选API去做一些自定义，比如用.trigger()定义触发器，用.allowedLateness()定义允许延迟时间，等等。

**窗口联结的处理流程**

JoinFunction中的两个参数，分别代表了两条流中的匹配的数据。这里就会有一个问题：什么时候就会匹配好数据，调用.join()方法呢？接下来就来介绍一下窗口join的具体处理流程。

**两条流的数据到来之后，首先会按照key分组、进入对应的窗口中存储；当到达窗口结束时间时，算子会先统计出窗口内两条流的数据的所有组合，也就是对两条流中的数据做一个笛卡尔积（相当于表的交叉连接，crossjoin），然后进行遍历，把每一对匹配的数据，作为参数(first，second)传入JoinFunction的.join()方法进行计算处理**，得到的结果直接输出如图所示。所以窗口中每有一对数据成功联结匹配，JoinFunction的.join()方法就会被调用一次，并输出一个结果。

除了JoinFunction，在.apply()方法中还可以传入FlatJoinFunction，用法非常类似，只是内部需要实现的.join()方法没有返回值。结果的输出是通过收集器（Collector）来实现的，所以对于一对匹配数据可以输出任意条结果。

其实仔细观察可以发现，窗口join的调用语法和我们熟悉的SQL中表的join非常相似：

```java
SELECT * FROM table1 t1, table2 t2 WHERE t1.id = t2.id;
```

这句SQL中where子句的表达，等价于innerjoin...on,所以本身表示的是两张表基于id的“内连接”（innerjoin）。而Flink中的windowjoin，同样类似于innerjoin。也就是说，最后处理输出的，只有两条流中数据按key配对成功的那些；如果某个窗口中一条流的数据没有任何另一条流的数据匹配，那么就不会调用JoinFunction的.join()方法，也就没有任何输出了。

*示例*

在电商网站中，往往需要统计用户不同行为之间的转化，这就需要对不同的行为数据流，按照用户ID进行分组后再合并，以分析它们之间的关联。如果这些是以固定时间周期（比如1小时）来统计的，那我们就可以使用窗口join来实现这样的需求。

【代码实现】

```java
package com.kunan.StreamAPI.ETLStream;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.JoinFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import java.time.Duration;
public class WindowJoinTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        SingleOutputStreamOperator<Tuple2<String, Long>> stream1 = env.fromElements(
                Tuple2.of("a", 1000L),
                Tuple2.of("b", 1000L),
                Tuple2.of("a", 2000L),
                Tuple2.of("b", 2000L)
               // Tuple2.of("b", 5100L)
        ).assignTimestampsAndWatermarks(WatermarkStrategy.<Tuple2<String, Long>>forBoundedOutOfOrderness(Duration.ZERO)
                .withTimestampAssigner(new SerializableTimestampAssigner<Tuple2<String, Long>>() {
                    @Override
                    public long extractTimestamp(Tuple2<String, Long> element, long recordTimestamp) {
                        return element.f1;
                    }
                }));
        SingleOutputStreamOperator<Tuple2<String, Integer>> stream2 = env.fromElements(
                Tuple2.of("a", 3000),
                Tuple2.of("b", 4000),
                Tuple2.of("a", 4500),
                Tuple2.of("b", 5500)
        ).assignTimestampsAndWatermarks(WatermarkStrategy.<Tuple2<String, Integer>>forBoundedOutOfOrderness(Duration.ZERO)
                .withTimestampAssigner(new SerializableTimestampAssigner<Tuple2<String, Integer>>() {
                    @Override
                    public long extractTimestamp(Tuple2<String, Integer> element, long recordTimestamp) {
                        return element.f1;
                    }
                }));
        stream1.join(stream2)
                        .where(data -> data.f0)
                                .equalTo(r -> r.f0)
                                        .window(TumblingEventTimeWindows.of(Time.seconds(5)))
                                                .apply(new JoinFunction<Tuple2<String, Long>, Tuple2<String, Integer>, String>() {
                                                    @Override
                                                    public String join(Tuple2<String, Long> first, Tuple2<String, Integer> second) throws Exception {
                                                        return first + " -> " + second;
                                                    }
                                                }).print();
        env.execute();
    }
}
```

输出:

```java
(a,1000) -> (a,3000)
(a,1000) -> (a,4500)
(a,2000) -> (a,3000)
(a,2000) -> (a,4500)
(b,1000) -> (b,4000)
(b,2000) -> (b,4000)
```

可以看到，窗口的联结是笛卡尔积。

### 2.间隔联结（Interval Join）

在有些场景下，处理的时间间隔可能并不是固定的。比如，在交易系统中，需要实时地对每一笔交易进行核验，保证两个账户转入转出数额相等，也就是所谓的“实时对账”。两次转账的数据可能写入了不同的日志流，它们的时间戳应该相差不大，所以可以考虑只统计一段时间内是否有出账入账的数据匹配。这时显然不应该用滚动窗口或滑动窗口来处理——因为匹配的两个数据有可能刚好“卡在”窗口边缘两侧，于是窗口内就都没有匹配了；会话窗口虽然时间不固定，但也明显不适合这个场景。基于时间的窗口联结已经无能为力了

为了应对这样的需求，Flink提供了一种叫作“间隔联结”（intervaljoin）的合流操作。顾名思义，间隔联结的思路就是针对一条流的每个数据，开辟出其时间戳前后的一段时间间隔，看这期间是否有来自另一条流的数据匹配。

**间隔联结的原理**

间隔联结具体的定义方式是，我们给定两个时间点，分别叫作间隔的“上界”（upperBound）和“下界”（lowerBound）；于是对于一条流（不妨叫作A）中的任意一个数据元素a，就可以开辟一段时间间隔：[a.timestamp+lowerBound,a.timestamp+upperBound],即以a的时间戳为中心，下至下界点、上至上界点的一个闭区间：我们就把这段时间作为可以匹配另一条流数据的“窗口”范围。所以对于另一条流（不妨叫B）中的数据元素b，如果它的时间戳落在了这个区间范围内，a和b就可以成功配对，进而进行计算输出结果。所以匹配的条件为：

***a.timestamp + lowerBound <= b.timestamp <= a.timestamp + upperBound***

这里需要注意，做间隔联结的两条流A和B，也必须基于相同的key；下界lowerBound应该小于等于上界upperBound，两者都可正可负；间隔联结目前只支持事件时间语义。

如图所示，可以清楚地看到间隔联结的方式：

下方的流A去间隔联结上方的流B，所以基于A的每个数据元素，都可以开辟一个间隔区间。这里设置下界为-2毫秒，上界为1毫秒。于是对于时间戳为2的A中元素，它的可匹配区间就是[0,3],流B中有时间戳为0、1的两个元素落在这个范围内，所以就可以得到匹配数据对(2,0)和(2,1)。同样地，A中时间戳为3的元素，可匹配区间为[1,4]，B中只有时间戳为1的一个数据可以匹配，于是得到匹配数据对(3,1)。

可以看到，间隔联结同样是一种内连接（innerjoin）。与窗口联结不同的是，intervaljoin做匹配的时间段是基于流中数据的，所以并不确定；而且流B中的数据可以不只在一个区间内被匹配。

**间隔联结的调用**

间隔联结在代码中，是基于KeyedStream的联结（join）操作。DataStream在keyBy得到KeyedStream之后，可以调用.intervalJoin()来合并两条流，传入的参数同样是一个KeyedStream，两者的key类型应该一致；得到的是一个IntervalJoin类型。后续的操作同样是完全固定的：先通过.between()方法指定间隔的上下界，再调用.process()方法，定义对匹配数据对的处理操作。调用.process()需要传入一个处理函数，这是处理函数家族的最后一员：“处理联结函数”ProcessJoinFunction。

通用调用形式如下：

```java
stream1
 .keyBy(<KeySelector>)
 .intervalJoin(stream2.keyBy(<KeySelector>))
 .between(Time.milliseconds(-2), Time.milliseconds(1))
 .process (new ProcessJoinFunction<Integer, Integer, String(){
 @Override
 public void processElement(Integer left, Integer right, Context ctx,
Collector<String> out) {
 out.collect(left + "," + right);
 }
 });
```

可以看到，抽象类ProcessJoinFunction就像是ProcessFunction和JoinFunction的结合，内部同样有一个抽象方法.processElement()。与其他处理函数不同的是，它多了一个参数，这自然是因为有来自两条流的数据。参数中left指的就是第一条流中的数据，right则是第二条流中与它匹配的数据。每当检测到一组匹配，就会调用这里的.processElement()方法，经处理转换之后输出结果。

**间隔联结实例**

在电商网站中，某些用户行为往往会有短时间内的强关联。这里举个例子，有两条流，一条是下订单的流，一条是浏览数据的流。可以针对同一个用户，来做这样一个联结。也就是使用一个用户的下订单的事件和这个用户的最近十分钟的浏览数据进行一个联结查询。

【示例代码】

```java
package com.kunan.StreamAPI.ETLStream;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.co.ProcessJoinFunction;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.Collector;
import java.time.Duration;
public class IntervalJoinTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        SingleOutputStreamOperator<Tuple2<String, Long>> OrderStream = env.fromElements(
                Tuple2.of("Mary", 5000L),
                Tuple2.of("Alice", 5000L),
                Tuple2.of("Bob", 20000L),
                Tuple2.of("Alice", 20000L),
                Tuple2.of("Cary", 51000L)
        ).assignTimestampsAndWatermarks(WatermarkStrategy.<Tuple2<String, Long>>forBoundedOutOfOrderness(Duration.ZERO)
                .withTimestampAssigner(new SerializableTimestampAssigner<Tuple2<String, Long>>() {
                    @Override
                    public long extractTimestamp(Tuple2<String, Long> element, long recordTimestamp) {
                        return element.f1;
                    }
                }));
        SingleOutputStreamOperator<Event> EventStream = env.fromElements(
                new Event("Bob", "./cart", 2000L),
                new Event("Alice", "./prod?id=100", 3000L),
                new Event("Alice", "./prod?id=200", 3500L),
                new Event("Bob", "./prod?id=2", 2500L),
                new Event("Alice", "./prod?id=200", 36000L),
                new Event("Bob", "./home", 30000L),
                new Event("Bob", "./prod?id=120", 23000L),
                new Event("Bob", "./prod?id=130", 33000L)
        ).assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ZERO)
                .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                    @Override
                    public long extractTimestamp(Event element, long recordTimestamp) {
                        return element.timestamp;
                    }
                }));
        OrderStream.keyBy(d -> d.f0)
                        .intervalJoin(EventStream.keyBy(d -> d.user))
                                .between(Time.seconds(-5),Time.seconds(10))
                                        .process(new ProcessJoinFunction<Tuple2<String, Long>, Event, String>() {
                                            @Override
                                            public void processElement(Tuple2<String, Long> left, Event right, ProcessJoinFunction<Tuple2<String, Long>, Event, String>.Context ctx, Collector<String> out) throws Exception {
                                                out.collect(right + " -> " + left);
                                            }
                                        }).print();
        env.execute();
    }
}
```

运行结果：

```java
Event{user='Alice', url='./prod?id=100', timestamp=1970-01-01 08:00:03.0} -> (Alice,5000)
Event{user='Alice', url='./prod?id=200', timestamp=1970-01-01 08:00:03.5} -> (Alice,5000)
Event{user='Bob', url='./home', timestamp=1970-01-01 08:00:30.0} -> (Bob,20000)
Event{user='Bob', url='./prod?id=120', timestamp=1970-01-01 08:00:23.0} -> (Bob,20000)
```

### 3.窗口同组联结（Window CoGroup）

除窗口联结和间隔联结之外，Flink还提供了一个“窗口同组联结”（windowcoGroup）操作。它的用法跟windowjoin非常类似，也是将两条流合并之后开窗处理匹配的元素，调用时只需要将.join()换为.coGroup()就可以了。

```java
stream1.coGroup(stream2)
 .where(<KeySelector>)
 .equalTo(<KeySelector>)
 .window(TumblingEventTimeWindows.of(Time.hours(1)))
 .apply(<CoGroupFunction>)
```

与windowjoin的区别在于，调用.apply()方法定义具体操作时，传入的是一个CoGroupFunction。这也是一个函数类接口，源码中定义如下：

```java
public interface CoGroupFunction<IN1, IN2, O> extends Function, Serializable {
 void coGroup(Iterable<IN1> first, Iterable<IN2> second, Collector<O> out)
throws Exception;
}
```

内部的.coGroup()方法，有些类似于FlatJoinFunction中.join()的形式，同样有三个参数，分别代表两条流中的数据以及用于输出的收集器（Collector）。不同的是，这里的前两个参数不再是单独的每一组“配对”数据了，而是传入了可遍历的数据集合。也就是说，现在不会再去计算窗口中两条流数据集的笛卡尔积，而是直接把收集到的所有数据一次性传入，至于要怎样配对完全是自定义的。这样.coGroup()方法只会被调用一次，而且即使一条流的数据没有任何另一条流的数据匹配，也可以出现在集合中、当然也可以定义输出结果了。

所以能够看出，coGroup操作比窗口的join更加通用，不仅可以实现类似SQL中的“内连接”（innerjoin），也可以实现左外连接（leftouterjoin）、右外连接（rightouterjoin）和全外连接（fullouterjoin）。事实上，窗口join的底层，也是通过coGroup来实现的。

【示例代码】

```java
package com.kunan.StreamAPI.ETLStream;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.CoGroupFunction;
import org.apache.flink.api.common.functions.JoinFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.co.ProcessJoinFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.Collector;
import java.time.Duration;
public class CoGroupTest {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        SingleOutputStreamOperator<Tuple2<String, Long>> stream1 = env.fromElements(
                Tuple2.of("a", 1000L),
                Tuple2.of("b", 1000L),
                Tuple2.of("a", 2000L),
                Tuple2.of("b", 2000L),
                 Tuple2.of("b", 5100L)
        ).assignTimestampsAndWatermarks(WatermarkStrategy.<Tuple2<String, Long>>forBoundedOutOfOrderness(Duration.ZERO)
                .withTimestampAssigner(new SerializableTimestampAssigner<Tuple2<String, Long>>() {
                    @Override
                    public long extractTimestamp(Tuple2<String, Long> element, long recordTimestamp) {
                        return element.f1;
                    }
                }));
        SingleOutputStreamOperator<Tuple2<String, Integer>> stream2 = env.fromElements(
                Tuple2.of("a", 3000),
                Tuple2.of("b", 4000),
                Tuple2.of("a", 4500),
                Tuple2.of("b", 5500)
        ).assignTimestampsAndWatermarks(WatermarkStrategy.<Tuple2<String, Integer>>forBoundedOutOfOrderness(Duration.ZERO)
                .withTimestampAssigner(new SerializableTimestampAssigner<Tuple2<String, Integer>>() {
                    @Override
                    public long extractTimestamp(Tuple2<String, Integer> element, long recordTimestamp) {
                        return element.f1;
                    }
                }));
        stream1.coGroup(stream2)
                .where(data -> data.f0)
                .equalTo(r -> r.f0)
                .window(TumblingEventTimeWindows.of(Time.seconds(5)))
                .apply(new CoGroupFunction<Tuple2<String, Long>, Tuple2<String, Integer>, String>() {
                   //实现抽象方法
                    @Override
                    public void coGroup(Iterable<Tuple2<String, Long>> first, Iterable<Tuple2<String, Integer>> second, Collector<String> out) throws Exception {
                        out.collect(first + " -> " + second);
                    }
                }).print();
        env.execute();
    }
}
```

运行结果

```java
[(a,1000), (a,2000)] -> [(a,3000), (a,4500)]
[(b,1000), (b,2000)] -> [(b,4000)]
[(b,5100)] -> [(b,5500)]
```

## 四、总结

**多流转换是流处理在实际应用中常见的需求，主要包括分流和合流两大类，本节分别做了详细讲解。在Flink中，分流操作可以通过处理函数的侧输出流（sideoutput）很容易地实现；而合流则提供不同层级的各种API。**

**最基本的合流方式是联合（union）和连接（connect），两者的主要区别在于union可以对多条流进行合并，数据类型必须一致；而connect只能连接两条流，数据类型可以不同。事实上connect提供了最底层的处理函数（processfunction）接口，可以通过状态和定时器实现任意自定义的合流操作，所以是最为通用的合流方式。**

**除此之外，Flink还提供了内置的几个联结（join）操作，它们都是基于某个时间段的双流合并，是需求特化之后的高层级API。主要包括窗口联结（windowjoin）、间隔联结（intervaljoin）和窗口同组联结（windowcoGroup）。其中windowjoin和coGroup都是基于时间窗口的操作，窗口分配器的定义与之前介绍的相同，而窗口函数则被限定为一种，通过.apply()来调用；intervaljoin则与窗口无关，而是基于每个数据元素截取对应的一个时间段来做联结，最终的处理操作则需调用.process()，由处理函数ProcessJoinFunction实现。**

**可以看到，基于时间的联结操作的每一步操作都是固定的接口，并没有其他变化，使用起来“专项专用”，非常方便。**

**至此已经将DataStreamAPI的主要用法介绍完毕，处理函数家族中的成员也都已一一亮相。而处理函数中一些比较高级和复杂的用法，往往会涉及定时器和状态。**
