# 16、Flink 状态编程之按键分区状态
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/16.html
- 分类：大数据框架
- 分组：教程目录
## 简介

在实际应用中，一般都需要将数据按照某个key进行分区，然后再进行计算处理；所以最为常见的状态类型就是KeyedState。之前介绍到keyBy之后的聚合、窗口计算，算子所持有的状态，都是KeyedState

另外，还可以通过富函数类（RichFunction）对转换算子进行扩展、实现自定义功能，如RichMapFunction、RichFilterFunction。在富函数中，可以调用.getRuntimeContext()获取当前的运行时上下文（RuntimeContext），进而获取到访问状态的句柄；这种富函数中自定义的状态也是KeyedState。

## 一、基本概念和特点

按键分区状态（KeyedState）顾名思义，**是任务按照键（key）来访问和维护的状态。它的特点非常鲜明，就是以key为作用范围进行隔离。**

在进行按键分区（keyBy）之后，具有相同键的所有数据，都会分配到同一个并行子任务中；所以如果当前任务定义了状态，Flink就会在当前并行子任务实例中，为每个键值维护一个状态的实例。于是当前任务就会为分配来的所有数据，按照key维护和处理对应的状态。

因为一个并行子任务可能会处理多个key的数据，所以Flink需要对KeyedState进行一些特殊优化。在底层，KeyedState类似于一个分布式的映射（map）数据结构，**所有的状态会根据key保存成键值对（key-value）的形式**。这样当一条数据到来时，任务就会自动将状态的访问范围限定为当前数据的key，从map存储中读取出对应的状态值。所以具有相同key的所有数据都会到访问相同的状态，而不同key的状态之间是彼此隔离的。

这种将状态绑定到key上的方式，相当于使得状态和流的逻辑分区一一对应了：不会有别的key的数据来访问当前状态；而当前状态对应key的数据也只会访问这一个状态，不会分发到其他分区去。这就保证了对状态的操作都是本地进行的，对数据流和状态的处理做到了分区一致性。

另外，在应用的并行度改变时，状态也需要随之进行重组。不同key对应的KeyedState可以进一步组成所谓的键组（keygroups），每一组都对应着一个并行子任务。键组是Flink重新分配KeyedState的单元，键组的数量就等于定义的最大并行度。当算子并行度发生改变时，KeyedState就会按照当前的并行度重新平均分配，保证运行时各个子任务的负载相同。

需要注意，使用KeyedState必须基于KeyedStream。没有进行keyBy分区的DataStream，即使转换算子实现了对应的富函数类，也不能通过运行时上下文访问KeyedState。

## 二、支持的结构类型

实际应用中，需要保存为状态的数据会有各种各样的类型，有时还需要复杂的集合类型，比如列表（List）和映射（Map）。对于这些常见的用法，Flink的按键分区状态（KeyedState）提供了足够的支持。接下来了解一下KeyedState所支持的结构类型.

### 1.值状态（ValueState）

顾名思义，状态中只保存一个“值”（value）。ValueState本身是一个接口，源码中定义如下：

```java
public interface ValueState<T> extends State {
T value() throws IOException;
void update(T value) throws IOException;
}
```

这里的T是泛型，表示状态的数据内容可以是任何具体的数据类型。如果想要保存一个长整型值作为状态，那么类型就是ValueState。

可以在代码中读写值状态，实现对于状态的访问和更新。

T value()：获取当前状态的值；

update(T value)：对状态进行更新，传入的参数 value 就是要覆写的状态值。

在具体使用时，为了让运行时上下文清楚到底是哪个状态，还需要创建一个“状态描述器”（StateDescriptor）来提供状态的基本信息。例如源码中，ValueState的状态描述器构造方法如下：

```java
public ValueStateDescriptor(String name, Class<T> typeClass) {
 super(name, typeClass, null);
}
```

这里需要传入状态的名称和类型——这跟声明一个变量时做的事情完全一样。有了这个描述器，运行时环境就可以获取到状态的控制句柄（handler）了。关于代码中状态的使用，后续介绍

### 2.列表状态（ListState）

将需要保存的数据，以列表（List）的形式组织起来。在ListState接口中同样有一个类型参数T，表示列表中数据的类型。ListState也提供了一系列的方法来操作状态，使用方式与一般的List非常相似。

- Iterable get()：获取当前的列表状态，返回的是一个可迭代类型 Iterable；
- update(List values)：传入一个列表 values，直接对状态进行覆盖；
- add(T value)：在状态列表中添加一个元素 value；
- addAll(List values)：向列表中添加多个元素，以列表 values 形式传入。

类似地，ListState的状态描述器就叫作ListStateDescriptor，用法跟ValueStateDescriptor完全一致。

### 3.映射状态（MapState）

把一些键值对（key-value）作为状态整体保存起来，可以认为就是一组key-value映射的列表。对应的MapState接口中，就会有UK、UV两个泛型，分别表示保存的key和value的类型。同样，MapState提供了操作映射状态的方法，与Map的使用非常类似。

- UV get(UK key)：传入一个key作为参数，查询对应的value值；
- put(UK key, UV value)：传入一个键值对，更新key对应的value值；
- putAll(Map map)：将传入的映射map中所有的键值对，全部添加到映射状态中；
- remove(UK key)：将指定key对应的键值对删除；
- boolean contains(UK key)：判断是否存在指定的key，返回一个boolean值。另外，MapState也提供了获取整个映射相关信息的方法：
- Iterable> entries()：获取映射状态中所有的键值对；
- Iterable keys()：获取映射状态中所有的键（key），返回一个可迭代Iterable类型；
- Iterable values()：获取映射状态中所有的值（value），返回一个可迭代Iterable类型；
- boolean isEmpty()：判断映射是否为空，返回一个boolean值。

### 4.归约状态（ReducingState）

类似于值状态（Value），不过需要对添加进来的所有数据进行归约，将归约聚合之后的值作为状态保存下来。ReducintState这个接口调用的方法类似于ListState，只不过它保存的只是一个聚合值，所以调用.add()方法时，不是在状态列表里添加元素，而是直接把新数据和之前的状态进行归约，并用得到的结果更新状态。

归约逻辑的定义，是在归约状态描述器（ReducingStateDescriptor）中，通过传入一个归约函数（ReduceFunction）来实现的。这里的归约函数，就是之前介绍reduce聚合算子时讲到的ReduceFunction，所以状态类型跟输入的数据类型是一样的。

```java
public ReducingStateDescriptor(
 String name, ReduceFunction<T> reduceFunction, Class<T> typeClass) {...}
```

这里的描述器有三个参数，其中第二个参数就是定义了归约聚合逻辑的ReduceFunction，另外两个参数则是状态的名称和类型。

### 5.聚合状态（AggregatingState）

归约状态非常类似，聚合状态也是一个值，用来保存添加进来的所有数据的聚合结果。与ReducingState不同的是，它的聚合逻辑是由在描述器中传入一个更加一般化的聚合函数（AggregateFunction）来定义的；这也就是之前讲过的AggregateFunction，里面通过一个累加器（Accumulator）来表示状态，所以聚合的状态类型可以跟添加进来的数据类型完全不同，使用更加灵活。

同样地，AggregatingState接口调用方法也与ReducingState相同，调用.add()方法添加元素时，会直接使用指定的AggregateFunction进行聚合并更新状态。

## 三、代码实现

了解了按键分区状态（KeyedState）的基本概念和类型，接下来就可以尝试在代码中使用状态了。

### 整体介绍

在Flink中，状态始终是与特定算子相关联的；算子在使用状态前首先需要“注册”，其实就是告诉Flink当前上下文中定义状态的信息，这样运行时的Flink才能知道算子有哪些状态。

状态的注册，主要是通过“状态描述器”（StateDescriptor）来实现的。状态描述器中最重要的内容，就是状态的名称（name）和类型（type）。我们知道Flink中的状态，可以认为是加了一些复杂操作的内存中的变量；而当我们在代码中声明一个局部变量时，都需要指定变量类型和名称，名称就代表了变量在内存中的地址，类型则指定了占据内存空间的大小。同样地，我们一旦指定了名称和类型，Flink就可以在运行时准确地在内存中找到对应的状态，进而返回状态对象供我们使用了。**所以在一个算子中，也可以定义多个状态，只要它们的名称不同就可以了。**

另外，状态描述器中还可能需要传入一个用户自定义函数（user-defined-function，UDF），用来说明处理逻辑，比如前面提到的ReduceFunction和AggregateFunction。

以ValueState为例，可以定义值状态描述器如下：

```java
ValueStateDescriptor<Long> descriptor = new ValueStateDescriptor<>(
"my state", // 状态名称
Types.LONG // 状态类型
);
```

这里定义了一个叫作“my state”的长整型 ValueState 的描述器。

代码中完整的操作是，首先定义出状态描述器；然后调用.getRuntimeContext()方法获取运行时上下文；继而调用RuntimeContext的获取状态的方法，将状态描述器传入，就可以得到对应的状态了。

因为状态的访问需要获取运行时上下文，这只能在富函数类（RichFunction）中获取到，所以自定义的KeyedState只能在富函数中使用。当然，底层的处理函数（ProcessFunction）本身继承了AbstractRichFunction抽象类，所以也可以使用。

在富函数中，调用.getRuntimeContext()方法获取到运行时上下文之后，RuntimeContext有以下几个获取状态的方法：

```java
ValueState<T> getState(ValueStateDescriptor<T>)
MapState<UK, UV> getMapState(MapStateDescriptor<UK, UV>)
ListState<T> getListState(ListStateDescriptor<T>)
ReducingState<T> getReducingState(ReducingStateDescriptor<T>)
AggregatingState<IN, OUT> getAggregatingState(AggregatingStateDescriptor<IN,
ACC, OUT>)
```

对于不同结构类型的状态，只要传入对应的描述器、调用对应的方法就可以了。

获取到状态对象之后，就可以调用它们各自的方法进行读写操作了。另外，所有类型的状态都有一个方法.clear()，用于清除当前状态。

代码中使用状态的整体结构如下：

```java
public static class MyFlatMapFunction extends RichFlatMapFunction<Long, String>{
    // 声明状态
    private transient ValueState<Long> state;
    @Override
    public void open(Configuration config) {
        // 在 open 生命周期方法中获取状态
        ValueStateDescriptor<Long> descriptor = new ValueStateDescriptor<>(
                "my state", // 状态名称
                Types.LONG // 状态类型
        );
        state = getRuntimeContext().getState(descriptor);
    }
    @Override
    public void flatMap(Long input, Collector<String> out) throws Exception {
        // 访问状态
        Long currentState = state.value();
        currentState += 1; // 状态数值加 1
        // 更新状态
        state.update(currentState);
        if (currentState >= 100) {
            out.collect(“state: ” + currentState);
            state.clear(); // 清空状态
        }
    }
}
```

因为RichFlatmapFunction中的.flatmap()是每来一条数据都会调用一次的，所以不应该在这里调用运行时上下文的.getState()方法，而是在生命周期方法.open()中获取状态对象。另外还有一个问题，获取到的状态对象也需要有一个变量名称state（注意这里跟状态的名称mystate不同），但这个变量不应该在open中声明——否则在.flatmap()里就访问不到了。所以还需要在外面直接把它定义为类的属性，这样就可以在不同的方法中通用了。而在外部又不能直接获取状态，因为编译时是无法拿到运行时上下文的。所以最终的解决方案就变成了：在外部声明状态对象，在open生命周期方法中通过运行时上下文获取状态。

这里需要注意，这种方式定义的都是KeyedState，它对于每个key都会保存一份状态实例。所以对状态进行读写操作时，获取到的状态跟当前输入数据的key有关；只有相同key的数据，才会操作同一个状态，不同key的数据访问到的状态值是不同的。而且上面提到的.clear()方法，也只会清除当前key对应的状态。

另外，状态不一定都存储在内存中，也可以放在磁盘或其他地方，具体的位置是由一个可配置的组件来管理的，这个组件叫作“状态后端”（StateBackend）。关于状态后端，会在后续介绍

下面是不同类型的状态的应用实例。

### 1.值状态（ValueState）

这里会使用用户id来进行分流，然后分别统计每个用户的pv数据，由于我们并不想每次pv加一，就将统计结果发送到下游去，所以这里我们注册了一个定时器，用来隔一段时间发送pv的统计结果，这样对下游算子的压力不至于太大。具体实现方式是定义一个用来保存定时器时间戳的值状态变量。当定时器触发并向下游发送数据以后，便清空储存定时器时间戳的状态变量，这样当新的数据到来时，发现并没有定时器存在，就可以注册新的定时器了，注册完定时器之后将定时器的时间戳继续保存在状态变量中。

```java
package com.kunan.StreamAPI.FlinkStat;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;
import java.time.Duration;
public class PeriodicPV {
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
        stream.print("数据输入： ");
        //统计每个用户的PV
        stream.keyBy(d -> d.user)
                        .process(new PeriodicPVResult())
                                .print();
        env.execute();
    }
    //实现自定义的KeyedProcessFunction
    public static class PeriodicPVResult extends KeyedProcessFunction<String,Event,String>{
        //定义状态，保存当前PV统计值,以及有没有定时器
        ValueState<Long> countState;
        ValueState<Long> timerState;
        @Override
        public void open(Configuration parameters) throws Exception {
            countState = getRuntimeContext().getState(new ValueStateDescriptor<Long>("Count",Long.class));
            timerState = getRuntimeContext().getState(new ValueStateDescriptor<Long>("Timer",Long.class));
        }
        @Override
        public void processElement(Event value, KeyedProcessFunction<String, Event, String>.Context ctx, Collector<String> out) throws Exception {
            //每来一条数据，更新对应的count值
            Long count = countState.value();
            countState.update(count == null ? 1 : count + 1);
            //如果没有注册过定时器，注册定时器
            if(timerState.value() == null ){
                ctx.timerService().registerEventTimeTimer(value.timestamp + 10 * 1000L);
                timerState.update(value.timestamp + 10 * 1000L);
            }
        }
        @Override
        public void onTimer(long timestamp, KeyedProcessFunction<String, Event, String>.OnTimerContext ctx, Collector<String> out) throws Exception {
            //定时器触发，输出统计结果
            out.collect(ctx.getCurrentKey() + "PV: " + countState.value());
            //清空状态
            timerState.clear();
            ctx.timerService().registerEventTimeTimer(timestamp + 10 * 1000L);
            timerState.update(timestamp + 10 * 1000L);
        }
    }
}
```

### 2.列表状态（ListState）

在Flink SQL 中，支持两条流的全量 Join，语法如下：

```java
SELECT * FROM A INNER JOIN B WHERE A.id = B.id；
```

这样一条SQL语句要慎用，因为Flink会将A流和B流的所有数据都保存下来，然后进行Join。不过在这里可以用列表状态变量来实现一下这个SQL语句的功能。

```java
package com.kunan.StreamAPI.FlinkStat;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.state.ListState;
import org.apache.flink.api.common.state.ListStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.co.CoProcessFunction;
import org.apache.flink.util.Collector;
/*此代码演示自定义列表状态进行全外连接*/
public class TwoStreamJoin {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        SingleOutputStreamOperator<Tuple3<String, String, Long>> stream1 = env.fromElements(
                Tuple3.of("a", "stream-1", 1000L),
                Tuple3.of("b", "stream-1", 2000L),
                Tuple3.of("a", "stream-1", 3000L)
        ).assignTimestampsAndWatermarks(WatermarkStrategy.<Tuple3<String, String, Long>>forMonotonousTimestamps()
                .withTimestampAssigner(new SerializableTimestampAssigner<Tuple3<String, String, Long>>() {
                    @Override
                    public long extractTimestamp(Tuple3<String, String, Long> element, long recordTimestamp) {
                        return element.f2;
                    }
                }));
        SingleOutputStreamOperator<Tuple3<String, String, Long>> stream2 = env.fromElements(
                Tuple3.of("a", "stream-2", 3000L),
                Tuple3.of("b", "stream-3", 4000L),
                Tuple3.of("a", "stream-3", 6000L)
        ).assignTimestampsAndWatermarks(WatermarkStrategy.<Tuple3<String, String, Long>>forMonotonousTimestamps()
                .withTimestampAssigner(new SerializableTimestampAssigner<Tuple3<String, String, Long>>() {
                    @Override
                    public long extractTimestamp(Tuple3<String, String, Long> element, long recordTimestamp) {
                        return element.f2;
                    }
                }));
        //自定义列表状态进行全外连接
        stream1.keyBy(data -> data.f0)
                        .connect(stream2.keyBy(data -> data.f0))
                                .process(new CoProcessFunction<Tuple3<String, String, Long>, Tuple3<String, String, Long>, Object>() {
                                    //定义列表状态用于保存两条流中已经到达的所有数据
                                    private ListState<Tuple2<String,Long>> stream1ListState;
                                    private ListState<Tuple2<String,Long>> stream2ListState;
                                    @Override
                                    public void open(Configuration parameters) throws Exception {
                                       stream1ListState = getRuntimeContext().getListState(new ListStateDescriptor<Tuple2<String, Long>>("stream1-list", Types.TUPLE(Types.STRING,  Types.LONG)));
                                       stream2ListState = getRuntimeContext().getListState(new ListStateDescriptor<Tuple2<String, Long>>("stream2-list", Types.TUPLE(Types.STRING,  Types.LONG)));
                                    }
                                    @Override
                                    public void processElement1(Tuple3<String, String, Long> left, CoProcessFunction<Tuple3<String, String, Long>, Tuple3<String, String, Long>, Object>.Context ctx, Collector<Object> out) throws Exception {
                                        //获取另一条流中所有数据，配对输出
                                        for (Tuple2<String,Long> right:stream2ListState.get()){
                                            out.collect(left.f0 + " " + left.f2 + " --> " + right);
                                        }
                                        stream1ListState.add(Tuple2.of(left.f0,left.f2));
                                    }
                                    @Override
                                    public void processElement2(Tuple3<String, String, Long> right, CoProcessFunction<Tuple3<String, String, Long>, Tuple3<String, String, Long>, Object>.Context ctx, Collector<Object> out) throws Exception {
                                        for (Tuple2<String,Long> left:stream1ListState.get()){
                                            out.collect(left + " --> " + right.f0 + " " + right.f2);
                                        }
                                        stream2ListState.add(Tuple2.of(right.f0,right.f2));
                                    }
                                }).print();
        env.execute();
    }
}
```

输出:

```java
(a,1000) --> a 3000
(b,2000) --> b 4000
a 3000 --> (a,3000)
(a,1000) --> a 6000
(a,3000) --> a 6000
```

### 3.映射状态（MapState）

映射状态的用法和Java中的HashMap很相似。在这里我们可以通过MapState的使用来探索一下窗口的底层实现，也就是我们要用映射状态来完整模拟窗口的功能。这里我们模拟一个滚动窗口。我们要计算的是每一个url在每一个窗口中的pv数据。我们之前使用增量聚合和全窗口聚合结合的方式实现过这个需求。这里用MapState再来实现一下。

```java
package com.kunan.StreamAPI.FlinkStat;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.state.MapState;
import org.apache.flink.api.common.state.MapStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;
import java.sql.Timestamp;
import java.time.Duration;
public class FakeWindowExp {
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
        stream.print("数据输入: ");
        stream.keyBy(d -> d.url)
                        .process(new FakeWindowResult(10000L))
                                .print();
        env.execute();
    }
    //实现自定义KeyedProcessFunction
    public static class FakeWindowResult extends KeyedProcessFunction<String,Event,String>{
        private Long windowSize;//窗口大小
        public FakeWindowResult(Long windowSize){
            this.windowSize = windowSize;
        }
        //定义一个MapState，用来保存每个窗口中统计的Count值
        MapState<Long,Long> windowUrlCountMapState;
        @Override
        public void open(Configuration parameters) throws Exception {
            windowUrlCountMapState = getRuntimeContext().getMapState(new MapStateDescriptor<Long, Long>("window-count",Long.class, Long.class));
        }
        @Override
        public void processElement(Event value, KeyedProcessFunction<String, Event, String>.Context ctx, Collector<String> out) throws Exception {
            //每来一条数据，根据时间戳判断属于那个窗口（窗口分配器）
            Long windowStart = value.timestamp / windowSize * windowSize;
            Long windowEnd = windowStart + windowSize;
            //注册end - 1的定时器
            ctx.timerService().registerEventTimeTimer(windowEnd - 1);
            //更新状态，进行增量聚合
            if(windowUrlCountMapState.contains(windowStart)){
                Long count = windowUrlCountMapState.get(windowStart);
                windowUrlCountMapState.put(windowStart,count + 1);
            }else
                windowUrlCountMapState.put(windowStart,1L);
        }
        //定时器触发时，输出计算
        @Override
        public void onTimer(long timestamp, KeyedProcessFunction<String, Event, String>.OnTimerContext ctx, Collector<String> out) throws Exception {
            Long windowEnd = timestamp + 1;
            Long windowStart = windowEnd - windowSize;
            Long count = windowUrlCountMapState.get(windowStart);
            out.collect("窗口" + new Timestamp(windowStart) + " ~ " + new Timestamp(windowEnd)
                    + "url: " + ctx.getCurrentKey()
                    + " count: " + count);
            //模拟窗口关闭，清除Map中对应的key-value
            windowUrlCountMapState.remove(windowStart);
        }
    }
}
```

### 4.聚合状态（AggregatingState）

举一个简单的例子，对用户点击事件流每5个数据统计一次平均时间戳。这是一个类似计数窗口（CountWindow）求平均值的计算，这里我们可以使用一个有聚合状态的RichFlatMapFunction来实现。

```java
package com.kunan.StreamAPI.FlinkStat;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.common.functions.RichFlatMapFunction;
import org.apache.flink.api.common.state.AggregatingState;
import org.apache.flink.api.common.state.AggregatingStateDescriptor;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
import java.time.Duration;
public class AvgTimeStampExp {
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
        stream.print("数据输入：");
        stream.keyBy(d -> d.user)
                        .flatMap(new AvgTsResult(5L))
                                .print();
        env.execute();
    }
    //实现自定义的RichFlatMapFunction
    public static class AvgTsResult extends RichFlatMapFunction<Event,String>{
        private Long count;
        public AvgTsResult(Long count) {
            this.count = count;
        }
        //定义一个聚合的状态，用来保存平均时间戳
        AggregatingState<Event,Long> avgTsAggState;
        //定义一个值状态，保存用户访问的次数
        ValueState<Long> countState;
        @Override
        public void open(Configuration parameters) throws Exception {
            avgTsAggState = getRuntimeContext().getAggregatingState(new AggregatingStateDescriptor<Event, Tuple2<Long,Long>, Long>(
                    "avg-state",
                    new AggregateFunction<Event, Tuple2<Long, Long>, Long>() {
                        @Override
                        public Tuple2<Long, Long> createAccumulator() {
                            return Tuple2.of(0L,0L);
                        }
                        @Override
                        public Tuple2<Long, Long> add(Event value, Tuple2<Long, Long> accumulator) {
                            return Tuple2.of(accumulator.f0 + value.timestamp,accumulator.f1 + 1);
                        }
                        @Override
                        public Long getResult(Tuple2<Long, Long> accumulator) {
                            return accumulator.f0 / accumulator.f1;
                        }
                        @Override
                        public Tuple2<Long, Long> merge(Tuple2<Long, Long> a, Tuple2<Long, Long> b) {
                            return null;
                        }
                    },
                    Types.TUPLE(Types.LONG, Types.LONG)
            ));
            countState = getRuntimeContext().getState(new ValueStateDescriptor<Long>("count",Long.class));
        }
        @Override
        public void flatMap(Event value, Collector<String> out) throws Exception {
                //每来一条数据，Curr count + 1
            Long currCount = countState.value();
            if (currCount == null)
                currCount = 1L;
            else
                currCount ++;
            //更新状态
            countState.update(currCount);
            avgTsAggState.add(value);
            //如果达到count次数就输出结果
            if(currCount.equals(count)){
                out.collect(value.user + "过去" + count + "次访问平均时间戳为： " + avgTsAggState.get());
                //清理状态
                countState.clear();
                avgTsAggState.clear();
            }
        }
    }
}
```

## 四、状态的生存时间（TTL）

背景: 在实际应用中，很多状态会随着时间的推移逐渐增长，如果不加以限制，最终就会导致存储空间的耗尽。一个优化的思路是直接在代码中调用.clear()方法去清除状态，但是有时候我们的逻辑要求不能直接清除。这时就需要配置一个状态的“生存时间”（time-to-live，TTL），当状态在内存中存在的时间超出这个值时，就将它清除。

具体实现上，如果用一个进程不停地扫描所有状态看是否过期，显然会占用大量资源做无用功。状态的失效其实不需要立即删除，所以可**以给状态附加一个属性，也就是状态的“失效时间”**。状态创建的时候，设置失效时间=当前时间+TTL；之后如果有对状态的访问和修改，可以再对失效时间进行更新；当设置的清除条件被触发时（比如，状态被访问的时候，或者每隔一段时间扫描一次失效状态），就可以判断状态是否失效、从而进行清除了。

配置状态的TTL时，需要创建一个StateTtlConfig配置对象，然后调用状态描述器的.enableTimeToLive()方法启动TTL功能。

```java
StateTtlConfig ttlConfig = StateTtlConfig
 .newBuilder(Time.seconds(10))
 .setUpdateType(StateTtlConfig.UpdateType.OnCreateAndWrite)
 .setStateVisibility(StateTtlConfig.StateVisibility.NeverReturnExpired)
 .build();
ValueStateDescriptor<String> stateDescriptor = new ValueStateDescriptor<>("my
state", String.class);
stateDescriptor.enableTimeToLive(ttlConfig);
```

这里用到了几个配置项：

- .newBuilder()

状态TTL配置的构造器方法，必须调用，返回一个Builder之后再调用.build()方法就可以得到StateTtlConfig了。方法需要传入一个Time作为参数，这就是设定的状态生存时间。
- .setUpdateType()

设置更新类型。更新类型指定了什么时候更新状态失效时间，这里的OnCreateAndWrite表示只有创建状态和更改状态（写操作）时更新失效时间。另一种类型OnReadAndWrite则表示无论读写操作都会更新失效时间，也就是只要对状态进行了访问，就表明它是活跃的，从而延长生存时间。这个配置默认为OnCreateAndWrite。
- .setStateVisibility()

设置状态的可见性。所谓的“状态可见性”，是指因为清除操作并不是实时的，所以当状态过期之后还有可能基于存在，这时如果对它进行访问，能否正常读取到就是一个问题了。这里设置的NeverReturnExpired是默认行为，表示从不返回过期值，也就是只要过期就认为它已经被清除了，应用不能继续读取；这在处理会话或者隐私数据时比较重要。对应的另一种配置是ReturnExpireDefNotCleanedUp，就是如果过期状态还存在，就返回它的值。

除此之外，TTL配置还可以设置在保存检查点（checkpoint）时触发清除操作，或者配置增量的清理（incrementalcleanup），还可以针对RocksDB状态后端使用压缩过滤器（compactionfilter）进行后台清理。关于检查点和状态后端的内容，会在后续继续讲解。

***这里需要注意，目前的TTL设置只支持处理时间***另外，**所有集合类型的状态（例如ListState、MapState）在设置TTL时，都是针对每一项（per-entry）元素的。也就是说，一个列表状态中的每一个元素，都会以自己的失效时间来进行清理，而不是整个列表一起清理**
