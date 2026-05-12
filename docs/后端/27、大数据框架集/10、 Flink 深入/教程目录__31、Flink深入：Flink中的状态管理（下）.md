# 31、Flink深入：Flink中的状态管理（下）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/31.html
- 分类：大数据框架
- 分组：教程目录
## 1. 托管状态和原始状态

从Flink是否接管角度:可以分为：ManagedState(托管状态) 和 RawState(原始状态)

两者的区别如下：

1、从状态管理方式的方式来说，Managed State 由 Flink Runtime 管理，自动存储，自动恢复，在内存管理上有优化；而 Raw State 需要用户自己管理，需要自己序列化，Flink 不知道 State 中存入的数据是什么结构，只有用户自己知道，需要最终序列化为可存储的数据结构。

2、从状态数据结构来说，Managed State 支持已知的数据结构，如 Value、List、Map 等。而 Raw State只支持字节数组 ，所有状态都要转换为二进制字节数组才可以。

3、从推荐使用场景来说，Managed State 大多数情况下均可使用，而 Raw State 是当 Managed State 不够用时，比如需要自定义 Operator 时，才会使用 Raw State。

在实际生产中，都只推荐使用ManagedState，后续将围绕该话题进行讨论。

## 2. 键控状态和算子状态

Managed State 分为两种，Keyed State 和 Operator State (Raw State都是Operator State)

## 2.1. 键控状态

> 在Flink Stream模型中，Datastream 经过 keyBy 的操作可以变为 KeyedStream。
>
> Keyed State是基于KeyedStream上的状态。这个状态是跟特定的key绑定的，对KeyedStream流上的每一个key，都对应一个state，如stream.keyBy(…)
>
> KeyBy之后的State,可以理解为分区过的State，每个并行keyed Operator的每个实例的每个key都有一个Keyed State，即

就是一个唯一的状态，由于每个key属于一个keyed Operator的并行实例，因此我们将其简单的理解为

## 2.2. 算子状态

> 这里的fromElements会调用FromElementsFunction的类，其中就使用了类型为 list state 的 operator state
>
> Operator State又称为 non-keyed state，与Key无关的State，每一个 operator state 都仅与一个 operator 的实例绑定。
>
> Operator State 可以用于所有算子，但一般常用于 Source

## 3. 存储State的数据结构/API介绍

前面说过有状态计算其实就是需要考虑历史数据

而历史数据需要搞个地方存储起来

Flink为了方便不同分类的State的存储和管理,提供了如下的API/数据结构来存储State!

> Keyed State 通过 RuntimeContext 访问，这需要 Operator 是一个RichFunction。保存Keyed state的数据结构:
>
> ValueState:即类型为T的单值状态。这个状态与对应的key绑定，是最简单的状态了。它可以通过update方法更新状态值，通过value()方法获取状态值，如求按用户id统计用户交易总额
>
> ListState:即key上的状态值为一个列表。可以通过add方法往列表中附加值；也可以通过get()方法返回一个Iterable来遍历状态值，如统计按用户id统计用户经常登录的Ip
>
> ReducingState:这种状态通过用户传入的reduceFunction，每次调用add方法添加值的时候，会调用reduceFunction，最后合并到一个单一的状态值
>
> MapState:即状态值为一个map。用户通过put或putAll方法添加元素

> 需要注意的是，以上所述的State对象，仅仅用于与状态进行交互(更新、删除、清空等)，而真正的状态值，有可能是存在内存、磁盘、或者其他分布式存储系统中。相当于我们只是持有了这个状态的句柄
>
> Operator State 需要自己实现 CheckpointedFunction 或 ListCheckpointed 接口。
>
> 保存Operator state的数据结构:
>
> ListState
>
> BroadcastState

举例来说，Flink中的FlinkKafkaConsumer，就使用了operator state。它会在每个connector实例中，保存该实例中消费topic的所有(partition, offset)映射

## 4. 键控状态代码示例

下图就word count 的 sum 所使用的StreamGroupedReduce类为例讲解了如何在代码中使用 keyed state：

官网示例：[//nightlies.apache.org/flink/flink-docs-release-1.14/docs/dev/datastream/fault-tolerance/state/](https://ci.apache.org/projects/flink/flink-docs-stable/dev/stream/state/state.html#using-managed-keyed-state)

需求：使用KeyState中的ValueState获取数据中的最大值(实际中直接使用maxBy即可)

编码步骤：

> //-1.定义一个状态用来存放最大值
>
> private transient ValueState maxValueState;
>
> //-2.创建一个状态描述符对象
>
> ValueStateDescriptor descriptor = new ValueStateDescriptor("maxValueState", Long.class);
>
> //-3.根据状态描述符获取State
>
> maxValueState = getRuntimeContext().getState(maxValueStateDescriptor);
>
> //-4.使用State
>
> Long historyValue = maxValueState.value();
>
> //判断当前值和历史值谁大
>
> if (historyValue == null || currentValue > historyValue)
>
> //-5.更新状态
>
> maxValueState.update(currentValue);

代码示例：

```java
package com.ddkk.state;
import org.apache.flink.api.common.functions.RichMapFunction;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * 使用KeyState中的ValueState获取流数据中的最大值(实际中直接使用maxBy即可)
 */
public class StateDemo01_KeyedState {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);//方便观察
        //2.Source
        DataStreamSource<Tuple2<String, Long>> tupleDS = env.fromElements(
                Tuple2.of("北京", 1L),
                Tuple2.of("上海", 2L),
                Tuple2.of("北京", 6L),
                Tuple2.of("上海", 8L),
                Tuple2.of("北京", 3L),
                Tuple2.of("上海", 4L)
        );
        //3.Transformation
        //使用KeyState中的ValueState获取流数据中的最大值(实际中直接使用maxBy即可)
        //实现方式1:直接使用maxBy--开发中使用该方式即可
        //min只会求出最小的那个字段,其他的字段不管
        //minBy会求出最小的那个字段和对应的其他的字段
        //max只会求出最大的那个字段,其他的字段不管
        //maxBy会求出最大的那个字段和对应的其他的字段
        SingleOutputStreamOperator<Tuple2<String, Long>> result = tupleDS.keyBy(t -> t.f0)
                .maxBy(1);
        //实现方式2:使用KeyState中的ValueState---学习测试时使用,或者后续项目中/实际开发中遇到复杂的Flink没有实现的逻辑,才用该方式!
        SingleOutputStreamOperator<Tuple3<String, Long, Long>> result2 = tupleDS.keyBy(t -> t.f0)
                .map(new RichMapFunction<Tuple2<String, Long>, Tuple3<String, Long, Long>>() {
                    //-1.定义状态用来存储最大值
                    private ValueState<Long> maxValueState = null;
                    @Override
                    public void open(Configuration parameters) throws Exception {
                        //-2.定义状态描述符:描述状态的名称和里面的数据类型
                        ValueStateDescriptor descriptor = new ValueStateDescriptor("maxValueState", Long.class);
                        //-3.根据状态描述符初始化状态
                        maxValueState = getRuntimeContext().getState(descriptor);
                    }
                    @Override
                    public Tuple3<String, Long, Long> map(Tuple2<String, Long> value) throws Exception {
                        //-4.使用State,取出State中的最大值/历史最大值
                        Long historyMaxValue = maxValueState.value();
                        Long currentValue = value.f1;
                        if (historyMaxValue == null || currentValue > historyMaxValue) {
                            //5-更新状态,把当前的作为新的最大值存到状态中
                            maxValueState.update(currentValue);
                            return Tuple3.of(value.f0, currentValue, currentValue);
                        } else {
                            return Tuple3.of(value.f0, currentValue, historyMaxValue);
                        }
                    }
                });
        //4.Sink
        //result.print();
        result2.print();
        //5.execute
        env.execute();
    }
}
```

## 5. 算子状态

下图对word count 示例中的FromElementsFunction类进行详解并分享如何在代码中使用 operator state：

官网代码示例：[//nightlies.apache.org/flink/flink-docs-release-1.14/docs/dev/datastream/fault-tolerance/state/](https://ci.apache.org/projects/flink/flink-docs-stable/dev/stream/state/state.html#using-managed-operator-state)

需求：使用ListState存储offset模拟Kafka的offset维护

编码步骤：

> //-1.声明一个OperatorState来记录offset
>
> private ListState offsetState = null;
>
> private Long offset = 0L;
>
> //-2.创建状态描述器
>
> ListStateDescriptor descriptor = new ListStateDescriptor("offsetState", Long.class);
>
> //-3.根据状态描述器获取State
>
> offsetState = context.getOperatorStateStore().getListState(descriptor);
>
> //-4.获取State中的值
>
> Iterator iterator = offsetState.get().iterator();
>
> if (iterator.hasNext()) {//迭代器中有值
>
> offset = iterator.next();//取出的值就是offset
>
> }
>
> offset += 1L;
>
> ctx.collect("subTaskId:" + getRuntimeContext().getIndexOfThisSubtask() + ",当前的offset为:" + offset);
>
> if (offset % 5 == 0) {//每隔5条消息,模拟一个异常
>
> //-5.保存State到Checkpoint中
>
> offsetState.clear();//清理内存中存储的offset到Checkpoint中
>
> //-6.将offset存入State中
>
> offsetState.add(offset);

代码示例：

```java
package com.ddkk.state;
import org.apache.flink.api.common.restartstrategy.RestartStrategies;
import org.apache.flink.api.common.state.ListState;
import org.apache.flink.api.common.state.ListStateDescriptor;
import org.apache.flink.runtime.state.FunctionInitializationContext;
import org.apache.flink.runtime.state.FunctionSnapshotContext;
import org.apache.flink.runtime.state.filesystem.FsStateBackend;
import org.apache.flink.streaming.api.CheckpointingMode;
import org.apache.flink.streaming.api.checkpoint.CheckpointedFunction;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.CheckpointConfig;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.RichParallelSourceFunction;
import java.util.Iterator;
import java.util.concurrent.TimeUnit;
/**
 * Author ddkk.com  弟弟快看，程序员编程资料站
 * Desc
 * 需求:
 * 使用OperatorState支持的数据结构ListState存储offset信息, 模拟Kafka的offset维护,
 * 其实就是FlinkKafkaConsumer底层对应offset的维护!
 */
public class StateDemo02_OperatorState {
    public static void main(String[] args) throws Exception {
        //1.env
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //先直接使用下面的代码设置Checkpoint时间间隔和磁盘路径以及代码遇到异常后的重启策略,下午会学
        env.enableCheckpointing(1000);//每隔1s执行一次Checkpoint
        env.setStateBackend(new FsStateBackend("file:///D:/ckp"));
        env.getCheckpointConfig().enableExternalizedCheckpoints(CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION);
        env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
        //固定延迟重启策略: 程序出现异常的时候，重启2次，每次延迟3秒钟重启，超过2次，程序退出
        env.setRestartStrategy(RestartStrategies.fixedDelayRestart(2, 3000));
        //2.Source
        DataStreamSource<String> sourceData = env.addSource(new MyKafkaSource());
        //3.Transformation
        //4.Sink
        sourceData.print();
        //5.execute
        env.execute();
    }
    /**
     * MyKafkaSource就是模拟的FlinkKafkaConsumer并维护offset
     */
    public static class MyKafkaSource extends RichParallelSourceFunction<String> implements CheckpointedFunction {
        //-1.声明一个OperatorState来记录offset
        private ListState<Long> offsetState = null;
        private Long offset = 0L;
        private boolean flag = true;
        @Override
        public void initializeState(FunctionInitializationContext context) throws Exception {
            //-2.创建状态描述器
            ListStateDescriptor descriptor = new ListStateDescriptor("offsetState", Long.class);
            //-3.根据状态描述器初始化状态
            offsetState = context.getOperatorStateStore().getListState(descriptor);
        }
        @Override
        public void run(SourceContext<String> ctx) throws Exception {
            //-4.获取并使用State中的值
            Iterator<Long> iterator = offsetState.get().iterator();
            if (iterator.hasNext()){
                offset = iterator.next();
            }
            while (flag){
                offset += 1;
                int id = getRuntimeContext().getIndexOfThisSubtask();
                ctx.collect("分区:"+id+"消费到的offset位置为:" + offset);//1 2 3 4 5 6
                //Thread.sleep(1000);
                TimeUnit.SECONDS.sleep(2);
                if(offset % 5 == 0){
                    System.out.println("程序遇到异常了.....");
                    throw new Exception("程序遇到异常了.....");
                }
            }
        }
        @Override
        public void cancel() {
            flag = false;
        }
        /**
         * 下面的snapshotState方法会按照固定的时间间隔将State信息存储到Checkpoint/磁盘中,也就是在磁盘做快照!
         */
        @Override
        public void snapshotState(FunctionSnapshotContext context) throws Exception {
            //-5.保存State到Checkpoint中
            offsetState.clear();//清理内存中存储的offset到Checkpoint中
            //-6.将offset存入State中
            offsetState.add(offset);
        }
    }
}
```
