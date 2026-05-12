# 06、Flink 实战 - Flink 重启策略
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/6/6.html
- 分类：大数据框架
- 分组：教程目录
## 一、前言

在说Flink的重启策略有哪些之前，我们有必要先了解下Flink重启的目的和其它相关的术语，例如state、state backend和checkpoint等。

如果学习新知识，上来就学它是什么？而忽略思考为什么出现它？那么学习起来会很生硬。

## 二、Flink为何要重启？

Flink在运行中处理源源不断的数据，难免有的数据会导致计算程序出异常，可能是因为进来的数据不规范或者我们的代码不严谨。

在不考虑重启和状态管理时，Flink程序出现异常，那么该程序就会停止运行，那么后续的数据那就不会进行计算。

一般我们并不希望偶尔出现的错误导致整个流式处理停止，我们希望Flink在遇到异常后能再次恢复，并保留之前计算好的中间结果，这样可以接着计算后面进来的数据，这样的能力就是容错。

综上，Flink需要重启的能力，Flink也的确提供了多种重启的策略供开发者选择。

## 三、什么是state？

学习Flink接触最多的就是state这个单词，Flink官网首页介绍自己Stateful Computations over Data Streams。state翻译是状态，stateful就是有状态的。

状态这个词理解起来比较费劲，就把state想成Flink计算的中间结果，Flink把这个中间结果保存到某个地方，以供后面计算（包括Flink重启后）接着使用。

Flink重启后，它要接着重启前的计算结果继续计算时，也是要去读取state，因为state里保存了之前的计算结果。

举例：一个有状态计算，求一串数字的最大值，当新进入一个值时，那这个值和之前计算好的最大值进行比较，然后算得新的最大值。那这个临时存储当前最大的值，就可以称为state。

state默认存储在内存中，也可以设置存储到本地、外部存储系统中。如果状态数据量巨大，可能超过内存的大小，state可以存在本地或者远程的外部存储中。而存储state的地方，我们称为state backend。

[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-c3YDr555-1606900143008)(https://ci.apache.org/projects/flink/flink-docs-release-1.11/fig/local-state.png)]

## 四、state的分类

根据作用域不同，state可以分为2类：算子状态（operator state）和键值分区状态（keyed state）。

### 1 operator state

算子状态的作用域是某个**算子任务**，这意味着所有在同一个并行任务之内的记录都能访问到相同的算子状态。

比如:Flink 中的 Kafka Connector 就使用了 Operator State，它会在每个 Connector 实例中，保存该实例消费 Topic 的所有(partition, offset)映射。

### 2 keyed state

keyed state是基于KeyedStream 上的状态，这个状态是跟特定的 Key 绑定的。KeyedStream 流上的每一个 Key，都对应一个 State。

keyed state是 operator state 的特例。区别是 keyed state事先按照 Key 对数据进行分区，每个 keyed state仅对应一个 Key（即：分组之后，每个组都会有一个 keyed state用于状态数据存储）

这里仅仅了解些概念即可，后面几篇博客会给出详细的案例说明。

## 五、什么是checkpoint？

Checkpoint是Flink实现容错机制最核心的功能，它能够根据配置周期性地基于Stream中各个Operator的状态来生成快照，从而将这些状态数据定期持久化存储下来，当Flink程序一旦意外崩溃时，重新运行程序时可以有选择地从这些快照进行恢复，从而修正因为故障带来的程序数据状态中断。

## 六、Flink重启策略有哪些？

Flink实时计算程序，为了满足容错，必须要开启 CheckPointing。一旦开启 CheckPointing，如果我们没有人为设置重启策略，默认的重启策略是无限重启(Integer.MAX_VALUE)，我们也可以设置为其他的重启策略。如：重启固定次数且可以延迟执行的策略。

### 1 固定延迟重启

配置文件

```java
//任务失败后重启次数
restart-strategy.fixed-delay.attempts: 3
//任务失败几秒后需要开始执行重启操作
restart-strategy.fixed-delay.delay: 10 s
```

代码

```java
//创建环境
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
//打开checkpoint开关，默认是无限次重启的
env.enableCheckpointing(3000);
//设置最多尝试重启10次
//任务失败5秒后开始执行重启操作
env.setRestartStrategy(
       RestartStrategies.fixedDelayRestart(10, Time.seconds(5))
);
```

### 2 失败率重启

配置文件

```java
//任务认定为失败之前，最大的重启次数，达到该次数时，程序停止运行
restart-strategy.failure-rate.max-failures-per-interval: 10
//计算失败率的时间间隔
restart-strategy.failure-rate.failure-rate-interval: 5min
//两次尝试重启之间时间间隔
restart-strategy.failure-rate.delay: 10s
```

代码

```java
//5分钟内，最大失败10次（第10次错误发生时，程序退出），而且每次失败10秒后再尝试重启
env.setRestartStrategy(
        RestartStrategies.failureRateRestart(
               10,//第10次异常后，不会重启
               Time.minutes(5),//计算失败次数的时间范围：5分钟
               Time.seconds(10))//失败10秒后再尝试重启
);
```

### 3 不重启

配置文件

```java
restart-strategy: none
```

代码

```java
 //不重启
env.setRestartStrategy(
       RestartStrategies.noRestart()
);
```

### 4 固定延迟重启 和 失败率重启的注意点

固定延迟重启 和 失败率重启都会设置一个次数，但是他们的含义有不同。

例如：
固定延迟重启设置5次，那么在第6次异常时，程序才会退出。

失败率重启设置5次，在时间范围内，第5次异常发生时，程序就会退出。

### 5 代码案例

简单的WordCount实现

```java
package com.pigg.state;
import com.pigg.common.BaseConstant;
import org.apache.flink.api.common.restartstrategy.RestartStrategies;
import org.apache.flink.api.common.time.Time;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.api.java.tuple.Tuple;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.KeyedStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;
import java.util.Arrays;
public class RestartStrategyDemo {
    public static void main(String[] args) throws Exception {
        //创建环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        //打开checkpoint开关，默认是无限次重启的
        env.enableCheckpointing(3000);
        //第一种：固定延迟重启
        //设置最多尝试重启10次，第11次异常发生时，程序退出
        //任务失败5秒后开始执行重启操作
        env.setRestartStrategy(
                RestartStrategies.fixedDelayRestart(10, Time.seconds(5))
        );
        //第二种：失败率重启
        //5分钟内，最多尝试重启10次，第10次异常发生时，程序退出
        env.setRestartStrategy(
                RestartStrategies.failureRateRestart(
                        10,//最多尝试重启10次，第10次异常发生时，程序退出
                        Time.minutes(5),//计算失败次数的时间范围：5分钟
                        Time.seconds(10))//失败10秒后再尝试重启
        );
        //第三种：不重启
        env.setRestartStrategy(
                RestartStrategies.noRestart()
        );
        //数据源
        DataStreamSource<String> lines = env.socketTextStream(BaseConstant.URL, BaseConstant.PORT);
        //将一行数据，按照空格分隔，将每个字符转成Tuple2.of(s, 1)
        SingleOutputStreamOperator<Tuple2<String, Integer>> wordAndOne = lines.flatMap(
                (String line, Collector<Tuple2<String, Integer>> out) -> {
                    Arrays.stream(line.split(" ")).forEach(thisWord -> {
                        if (thisWord.equals("aaa")) {
                            throw new RuntimeException("手动异常");
                        }
                        out.collect(Tuple2.of(thisWord, 1));
                    });
                }
        ).returns(Types.TUPLE(Types.STRING, Types.INT));
        KeyedStream<Tuple2<String, Integer>, Tuple> keyedStream = wordAndOne.keyBy(0);
        SingleOutputStreamOperator<Tuple2<String, Integer>> summedData = keyedStream.sum(1);
        summedData.print();
        env.execute("RestartStrategyDemo");
    }
}
```

## 七、结语

本篇博客注意讲解了Flink几种重启策略，Checkpoin和State只是提了下概念，将会在后面博客详细总结。
