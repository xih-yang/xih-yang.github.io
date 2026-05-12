# 18、Flink 状态编程之广播状态(BroadcastState)
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/1/18.html
- 分类：大数据框架
- 分组：教程目录
## 简介

算子状态中有一类很特殊，就是广播状态（BroadcastState）。从概念和原理上讲，广播状态非常容易理解：状态广播出去，所有并行子任务的状态都是相同的；并行度调整时只要直接复制就可以了。然而在应用上，广播状态却与其他算子状态大不相同。本节就专门来讨论一下广播状态的使用。

## 一、基本用法

让所有并行子任务都持有同一份状态，也就意味着一旦状态有变化，所以子任务上的实例都要更新。什么时候会用到这样的广播状态呢？

一个最为普遍的应用，就是“动态配置”或者“动态规则”。我们在处理流数据时，有时会基于一些配置（configuration）或者规则（rule）。简单的配置当然可以直接读取配置文件，一次加载，永久有效；但数据流是连续不断的，如果这配置随着时间推移还会动态变化，那又该怎么办呢？

一个简单的想法是，定期扫描配置文件，发现改变就立即更新。但这样就需要另外启动一个扫描进程，如果扫描周期太长，配置更新不及时就会导致结果错误；如果扫描周期太短，又会耗费大量资源做无用功。解决的办法，还是流处理的“事件驱动”思路——可以将这动态的配置数据看作一条流，将这条流和本身要处理的数据流进行连接（connect），就可以实时地更新配置进行计算了。

由于配置或者规则数据是全局有效的，我们需要把它广播给所有的并行子任务。而子任务需要把它作为一个算子状态保存起来，以保证故障恢复后处理结果是一致的。这时的状态，就是一个典型的广播状态。我们知道**，广播状态与其他算子状态的列表（list）结构不同，底层是以键值对（key-value）形式描述的，所以其实就是一个映射状态（MapState）。**

在代码上，可以直接调用DataStream的.broadcast()方法，传入一个“映射状态描述器”（MapStateDescriptor）说明状态的名称和类型，就可以得到一个“广播流”（BroadcastStream）；进而将要处理的数据流与这条广播流进行连接（connect），就会得到“广播连接流”（BroadcastConnectedStream）。注意广播状态只能用在广播连接流中。

关于广播连接流，已经在之前做过介绍，这里可以复习一下：

```java
MapStateDescriptor<String, Rule> ruleStateDescriptor = new
        MapStateDescriptor<>(...);
        BroadcastStream<Rule> ruleBroadcastStream = ruleStream
        .broadcast(ruleStateDescriptor);
        DataStream<String> output = stream
        .connect(ruleBroadcastStream)
        .process( new BroadcastProcessFunction<>() {...} );
```

这里定义了一个“规则流”ruleStream，里面的数据表示了数据流stream处理的规则，规则的数据类型定义为Rule。于是需要先定义一个MapStateDescriptor来描述广播状态，然后传入ruleStream.broadcast()得到广播流，接着用stream和广播流进行连接。这里状态描述器中的key类型为String，就是为了区分不同的状态值而给定的key的名称。

对于广播连接流调用.process()方法，可以传入“广播处理函数”KeyedBroadcastProcessFunction或者BroadcastProcessFunction来进行处理计算。广播处理函数里面有两个方法.processElement()和.processBroadcastElement()，源码中定义如下：

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

这里的.processElement()方法，处理的是正常数据流，第一个参数value就是当前到来的流数据；而.processBroadcastElement()方法就相当于是用来处理广播流的，它的第一个参数value就是广播流中的规则或者配置数据。两个方法第二个参数都是一个上下文ctx，都可以通过调用.getBroadcastState()方法获取到当前的广播状态；**区别在于，.processElement()方法里的上下文是“只读”的（ReadOnly），因此获取到的广播状态也只能读取不能更改；**而.processBroadcastElement()方法里的Context则没有限制，可以根据当前广播流中的数据更新状态。

```java
Rule rule = ctx.getBroadcastState( new MapStateDescriptor<>("rules", Types.String,
Types.POJO(Rule.class))).get("my rule");
```

通过调用ctx.getBroadcastState()方法，传入一个MapStateDescriptor，就可以得到当前的叫作“rules”的广播状态；调用它的.get()方法，就可以取出其中“myrule”对应的值进行计算处理。

## 二、代码实例

接下来我们举一个广播状态的应用案例。考虑在电商应用中，往往需要判断用户先后发生的行为的“组合模式”，比如“登录-下单”或者“登录-支付”，检测出这些连续的行为进行统计，就可以了解平台的运用状况以及用户的行为习惯。

```java
package com.kunan.StreamAPI.FlinkStat;
import org.apache.flink.api.common.state.*;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.BroadcastStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.co.KeyedBroadcastProcessFunction;
import org.apache.flink.util.Collector;
import redis.clients.jedis.Tuple;
public class BehaviorPatternDetect {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        //用户的行为数据流
        DataStreamSource<Action> actionStream = env.fromElements(
                new Action("Alice", "login"),
                new Action("Alice", "pay"),
                new Action("Bob", "login"),
                new Action("Bob", "order")
        );
        //行为模式流，基于它构建广播流
        DataStreamSource<Pattern> patternStream = env.fromElements(
                new Pattern("login", "pay"),
                new Pattern("login", "order")
        );
        //定义广播变量描述器
        MapStateDescriptor<Void, Pattern> descriptor = new MapStateDescriptor<Void,Pattern>("pattern", Types.VOID, Types.POJO(Pattern.class));
        BroadcastStream<Pattern> broadcastStream = patternStream.broadcast(descriptor);
        //连接两条流进行处理
        SingleOutputStreamOperator<Tuple2<String, Pattern>> matches = actionStream.keyBy(data -> data.userID)
                .connect(broadcastStream)
                .process(new PatternDetector());
        matches.print();
        env.execute();
    }
    //实现自定义的KeyedBroadcastProcessFunction
    public static class PatternDetector extends KeyedBroadcastProcessFunction<String,Action,Pattern,Tuple2<String,Pattern>>{
        //定义一个keyedState保存上一次用户行为
        ValueState<String> preActionState;
        @Override
        public void open(Configuration parameters) throws Exception {
            preActionState = getRuntimeContext().getState(new ValueStateDescriptor<String>("last-action", String.class));
        }
        @Override
        public void processElement(Action value, KeyedBroadcastProcessFunction<String, Action, Pattern, Tuple2<String, Pattern>>.ReadOnlyContext ctx, Collector<Tuple2<String, Pattern>> out) throws Exception {
            //从广播状态中获取匹配模式
            ReadOnlyBroadcastState<Void, Pattern> patternState = ctx.getBroadcastState(new MapStateDescriptor<>("pattern", Types.VOID, Types.POJO(Pattern.class)));
            Pattern pattern = patternState.get(null);
            //获取用户上一次的行为
            String prevAction = preActionState.value();
            //判断是否匹配
            if(pattern != null && prevAction != null){
                if(pattern.action1.equals(prevAction) && pattern.action2.equals(value.action)){
                    out.collect(new Tuple2<>(ctx.getCurrentKey(),pattern));
                }
            }
            //更新状态
            preActionState.update(value.action);
        }
        @Override
        public void processBroadcastElement(Pattern value, KeyedBroadcastProcessFunction<String, Action, Pattern, Tuple2<String, Pattern>>.Context ctx, Collector<Tuple2<String, Pattern>> out) throws Exception {
            //从上下文中获取广播状态，并用当前数据更新状态
            //获取广播状态
            BroadcastState<Void, Pattern> patternState = ctx.getBroadcastState(new MapStateDescriptor<>("pattern", Types.VOID, Types.POJO(Pattern.class)));
            patternState.put(null,value);
        }
    }
    //定义用户行为事件和模式的POJO类
    public static class Action{
        public String userID;
        public String action;
        public Action() {
        }
        public Action(String userID, String action) {
            this.userID = userID;
            this.action = action;
        }
        @Override
        public String toString() {
            return "Action{" +
                    "userID='" + userID + '\'' +
                    ", action='" + action + '\'' +
                    '}';
        }
    }
    public static class Pattern{
        public String action1;
        public String action2;
        public Pattern() {
        }
        public Pattern(String action1, String action2) {
            this.action1 = action1;
            this.action2 = action2;
        }
        @Override
        public String toString() {
            return "Pattern{" +
                    "action1='" + action1 + '\'' +
                    ", action2='" + action2 + '\'' +
                    '}';
        }
    }
}
```

这里我们将检测的行为模式定义为POJO类Pattern，里面包含了连续的两个行为。由于广播状态中只保存了一个Pattern，并不关心MapState中的key，所以也可以直接将key的类型指定为Void，具体值就是null。在具体的操作过程中，我们将广播流中的Pattern数据保存为广播变量；在行为数据Action到来之后读取当前广播变量，确定行为模式，并将之前的一次行为保存为一个ValueState——这是针对当前用户的状态保存，所以用到了KeyedState。检*测到如果前一次行为与Pattern中的action1相同，而当前行为与action2相同，则发现了匹配模式的一组行为，输出检测结果。*
