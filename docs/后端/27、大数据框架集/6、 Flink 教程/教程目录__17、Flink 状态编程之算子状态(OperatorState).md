# 17、Flink 状态编程之算子状态(OperatorState)
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/17.html
- 分类：大数据框架
- 分组：教程目录
## 简介

除按键分区状态（KeyedState）之外，另一大类受控状态就是算子状态（OperatorState）。从某种意义上说，算子状态是更底层的状态类型，因为它只针对当前算子并行任务有效，不需要考虑不同key的隔离。算子状态功能不如按键分区状态丰富，应用场景较少，它的调用方法也会有一些区别。

## 一、基本概念和特点

**算子状态（OperatorState）就是一个算子并行实例上定义的状态，作用范围被限定为当前算子任务**。算子状态跟数据的key无关，所以不同key的数据只要被分发到同一个并行子任务，就会访问到同一个OperatorState。

算子状态的实际应用场景不如KeyedState多，一般用在Source或Sink等与外部系统连接的算子上，或者完全没有key定义的场景。比如Flink的Kafka连接器中，就用到了算子状态。在我们给Source算子设置并行度后，Kafka消费者的每一个并行实例，都会为对应的主题（topic）分区维护一个偏移量，作为算子状态保存起来。这在保证Flink应用“精确一次”（exactly-once）状态一致性时非常有用。关于状态一致性的内容，会在后续详细展开。

算子的并行度发生变化时，算子状态也支持在并行的算子任务实例之间做重组分配。根据状态的类型不同，重组分配的方案也会不同。

## 二、 状态类型

算子状态也支持不同的结构类型，主要有三种：ListState、UnionListState和BroadcastState。

### 1.列表状态（ListState）

与KeyedState中的ListState一样，将状态表示为一组数据的列表。

与KeyedState中的列表状态的区别是：在算子状态的上下文中，不会按键（key）分别处理状态，所以每一个并行子任务上只会保留一个“列表”（list），也就是*当前并行子任务上所有状态项的集合*。列表中的状态项就是可以重新分配的最细粒度，彼此之间完全独立。

当算子并行度进行缩放调整时，算子的列表状态中的所有元素项会被统一收集起来，相当于把多个分区的列表合并成了一个“大列表”，然后再均匀地分配给所有并行任务。这种“均匀分配”的具体方法就是“轮询”（round-robin），与之前介绍的rebanlance数据传输方式类似，是通过逐一“发牌”的方式将状态项平均分配的。这种方式也叫作“平均分割重组”（even-splitredistribution）。

算子状态中不会存在“键组”（keygroup）这样的结构，所以为了方便重组分配，就把它直接定义成了“列表”（list）。这也就解释了，为什么算子状态中没有最简单的值状态（ValueState）。

### 2.联合列表状态（UnionListState）

与ListState类似，联合列表状态也会将状态表示为一个列表。它与常规列表状态的区别在于，算子并行度进行缩放调整时对于状态的分配方式不同。

UnionListState的重点就在于“联合”（union）。在并行度调整时，常规列表状态是轮询分配状态项，而联合列表状态的算子则会直接广播状态的完整列表。这样，并行度缩放之后的并行子任务就获取到了联合后完整的“大列表”，可以自行选择要使用的状态项和要丢弃的状态项。这种分配也叫作“联合重组”（unionredistribution）。如果列表中状态项数量太多，为资源和效率考虑一般不建议使用联合重组的方式。

### 3.广播状态（BroadcastState）

**有时我们希望算子并行子任务都保持同一份“全局”状态，用来做统一的配置和规则设定。这时所有分区的所有数据都会访问到同一个状态，状态就像被“广播”到所有分区一样，这种特殊的算子状态，就叫作广播状态（BroadcastState）。**

因为广播状态在每个并行子任务上的实例都一样，所以在并行度调整的时候就比较简单，只要复制一份到新的并行任务就可以实现扩展；而对于并行度缩小的情况，可以将多余的并行子任务连同状态直接砍掉——因为状态都是复制出来的，并不会丢失。

在底层，广播状态是以类似映射结构（map）的键值对（key-value）来保存的，必须基于一个“广播流”（BroadcastStream）来创建。关于广播流，在“广播连接流”的讲解中已经做过介绍，稍后还会做一个总结。

## 三、代码实现

我们已经知道，状态从本质上来说就是算子并行子任务实例上的一个特殊本地变量。它的特殊之处就在于Flink会提供完整的管理机制，来保证它的持久化保存，以便发生故障时进行状态恢复；另外还可以针对不同的key保存独立的状态实例。按键分区状态（KeyedState）对这两个功能都要考虑；而算子状态（OperatorState）并不考虑key的影响，所以主要任务就是要让Flink了解状态的信息、将状态数据持久化后保存到外部存储空间。

看起来算子状态的使用应该更加简单才对。不过仔细思考又会发现一个问题：我们对状态进行持久化保存的目的是为了故障恢复；在发生故障、重启应用后，数据还会被发往之前分配的分区吗？显然不是，因为并行度可能发生了调整，不论是按键（key）的哈希值分区，还是直接轮询（round-robin）分区，数据分配到的分区都会发生变化。这很好理解，当打牌的人数从3个增加到4个时，即使牌的次序不变，轮流发到每个人手里的牌也会不同。数据分区发生变化，带来的问题就是，**怎么保证原先的状态跟故障恢复后数据的对应关系呢**？

对于KeyedState这个问题很好解决：状态都是跟key相关的，而相同key的数据不管发往哪个分区，总是会全部进入一个分区的；于是只要将状态也按照key的哈希值计算出对应的分区，进行重组分配就可以了。恢复状态后继续处理数据，就总能按照key找到对应之前的状态，就保证了结果的一致性。所以Flink对KeyedState进行了非常完善的包装，我们不需实现任何接口就可以直接使用。

而对于OperatorState来说就会有所不同。因为不存在key，所有数据发往哪个分区是不可预测的；也就是说，当发生故障重启之后，我们不能保证某个数据跟之前一样，进入到同一个并行子任务、访问同一个状态。所以Flink无法直接判断该怎样保存和恢复状态，而是提供了接口，让我们根据业务需求自行设计状态的快照保存（snapshot）和恢复（restore）逻辑。

### 1. CheckpointedFunction 接口

在Flink中，对状态进行持久化保存的快照机制叫作“检查点”（Checkpoint）。于是使用算子状态时，就需要对检查点的相关操作进行定义，实现一个CheckpointedFunction接口。

CheckpointedFunction 接口在源码中定义如下：

```java
public interface CheckpointedFunction {
// 保存状态快照到检查点时，调用这个方法
void snapshotState(FunctionSnapshotContext context) throws Exception
// 初始化状态时调用这个方法，也会在恢复状态时调用
 void initializeState(FunctionInitializationContext context) throws
Exception;
}
```

每次应用保存检查点做快照时，都会调用.snapshotState()方法，将状态进行外部持久化。而在算子任务进行初始化时，会调用.initializeState()方法。这又有两种情况：一种是整个应用第一次运行，这时状态会被初始化为一个默认值（defaultvalue）；另一种是应用重启时，从检查点（checkpoint）或者保存点（savepoint）中读取之前状态的快照，并赋给本地状态。所以，接口中的.snapshotState()方法定义了检查点的快照保存逻辑，而.initializeState()方法不仅定义了初始化逻辑，也定义了恢复逻辑。

这里需要注意，CheckpointedFunction接口中的两个方法，分别传入了一个上下文（context）作为参数。不同的是，.snapshotState()方法拿到的是快照的上下文FunctionSnapshotContext，它可以提供检查点的相关信息，不过无法获取状态句柄；而.initializeState()方法拿到的是FunctionInitializationContext，这是函数类进行初始化时的上下文，是真正的“运行时上下文”。FunctionInitializationContext中提供了“算子状态存储”（OperatorStateStore）和“按键分区状态存储（”KeyedStateStore），在这两个存储对象中可以非常方便地获取当前任务实例中的OperatorState和KeyedState。例如：

```java
ListStateDescriptor<String> descriptor =
        new ListStateDescriptor<>(
        "buffered-elements",
        Types.of(String));
        ListState<String> checkpointedState =
        context.getOperatorStateStore().getListState(descriptor);
```

我们看到，算子状态的注册和使用跟KeyedState非常类似，也是需要先定义一个状态描述器（StateDescriptor），告诉Flink当前状态的名称和类型，然后从上下文提供的算子状态存储（OperatorStateStore）中获取对应的状态对象。如果想要从KeyedStateStore中获取KeyedState也是一样的，前提是必须基于定义了key的KeyedStream，这和富函数类中的方式并不矛盾。通过这里的描述可以发现，CheckpointedFunction是Flink中非常底层的接口，它为有状态的流处理提供了灵活且丰富的应用。

**1、****示例代码**；

接下来举一个算子状态的应用案例。在下面的例子中，自定义的SinkFunction会在CheckpointedFunction中进行数据缓存，然后统一发送到下游。这个例子演示了列表状态的平均分割重组（event-splitredistribution）。

```java
package com.kunan.StreamAPI.FlinkStat;
import com.kunan.StreamAPI.Source.ClickSource;
import com.kunan.StreamAPI.Source.Event;
import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.state.ListState;
import org.apache.flink.api.common.state.ListStateDescriptor;
import org.apache.flink.contrib.streaming.state.EmbeddedRocksDBStateBackend;
import org.apache.flink.runtime.state.FunctionInitializationContext;
import org.apache.flink.runtime.state.FunctionSnapshotContext;
import org.apache.flink.streaming.api.checkpoint.CheckpointedFunction;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.sink.SinkFunction;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
public class BufferingSinkExp {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
       // env.enableCheckpointing(1000L);
       // env.setStateBackend(new EmbeddedRocksDBStateBackend());
        SingleOutputStreamOperator<Event> stream = env.addSource(new ClickSource())
                .assignTimestampsAndWatermarks(WatermarkStrategy.<Event>forBoundedOutOfOrderness(Duration.ZERO)
                        .withTimestampAssigner(new SerializableTimestampAssigner<Event>() {
                            @Override
                            public long extractTimestamp(Event element, long recordTimestamp) {
                                return element.timestamp;
                            }
                        }));
        stream.print("数据输入： ");
        //批量缓存输出
        stream.addSink(new BufferingSink(10));
        env.execute();
    }
    //自定义实现SinkFunction
    public static class BufferingSink implements SinkFunction<Event>, CheckpointedFunction{
        //定义当前类的属性。批量
        private final int threshold;
        public BufferingSink(int threshold) {
            this.threshold = threshold;
            this.bufferedElements = new ArrayList<>();
        }
        private List<Event> bufferedElements;
        //定义一个算子状态
        private ListState<Event> checkPointedState;
        @Override
        public void invoke(Event value, Context context) throws Exception {
            bufferedElements.add(value);//缓存到列表
            //判断如果达到阈值 就批量写入
            if (bufferedElements.size() == threshold){
                //用打印到控制台模拟写入到外部系统
                for (Event element: bufferedElements){
                    System.out.println(element);
                }
                System.out.println("=======输出完毕========");
                bufferedElements.clear();
            }
        }
        @Override
        public void snapshotState(FunctionSnapshotContext context) throws Exception {
            //清空状态
            checkPointedState.clear();
            //对状态进行持久化,复制缓存的列表到列表状态
            for (Event element:bufferedElements)
                checkPointedState.add(element);
        }
        @Override
        public void initializeState(FunctionInitializationContext context) throws Exception {
            //定义算子状态
            ListStateDescriptor<Event> eventListStateDescriptor = new ListStateDescriptor<>("buffered-elements", Event.class);
            checkPointedState = context.getOperatorStateStore().getListState(eventListStateDescriptor);
            //如果从故障恢复，需要将ListState中的所有元素复制到列表中
            if (context.isRestored()){
                for (Event element:checkPointedState.get())
                    bufferedElements.add(element);
            }
        }
    }
}
```

当初始化好状态对象后，可以通过调用.isRestored()方法判断是否是从故障中恢复。在代码中BufferingSink初始化时，恢复出的ListState的所有元素会添加到一个局部变量bufferedElements中，以后进行检查点快照时就可以直接使用了。在调用.snapshotState()时，直接清空ListState，然后把当前局部变量中的所有元素写入到检查点中。

对于不同类型的算子状态，需要调用不同的获取状态对象的接口，对应地也就会使用不同的状态分配重组算法。比如获取列表状态时，调用.getListState()会使用最简单的平均分割重组（even-splitredistribution）算法；而获取联合列表状态时，调用的是.getUnionListState()，对应就会使用联合重组（unionredistribution）算法。
