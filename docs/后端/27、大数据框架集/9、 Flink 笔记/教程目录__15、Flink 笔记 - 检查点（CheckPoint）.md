# 15、Flink 笔记 - 检查点（CheckPoint）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/15.html
- 分类：大数据框架
- 分组：教程目录
## 一、概述

checkpoint机制是Flink可靠性的基石，可以保证Flink集群在某个算子因为某些原因(如 异常退出)出现故障时，能够将整个应用流图的状态恢复到故障之前的某一状态，保 证应用流图状态的一致性。

## 二、案例

以wordcount为例，如下图：

有两个算子，keyby map。

第一步：输出数据 经过 keyby 之后重新分区，发往指定分区。

比如上图的 key 为 a 被上层的 map 算子处理，b 被中间的 map算子处理，c 被 底层的 map 算子处理

第二步：假设来了数据 【b，2】、【c，1】、【b，3】（可以理解为一条数据），黑色的 ckpt 表示检查点屏障（checkpoint barriers）它表示的是每当来一条数据时，后面紧跟一个屏障，来区别后面的数据，并且该屏障会流动的，也可以理解就是数据流动。

第三步：【b，2】、【c，1】、【b，3】经过 keyby 之后，被 map算子计算了，如下图

【b，2】、【c，1】、【b，3】 数据被 map 状态算子处理完成，此时的 检查点屏障经过 keyby 算子，就会把检查点屏障持久化到存储。如果之后发生错误，该位置可以让Flink在此处重启。

第四步：检查点屏障会流动的，当 map 算子接收到 检查点屏障，这些屏障以异步的方式写入到持久化存储。

如下图：

第五步：当 map 算子完成检查点的持久化存储时，就会把当期 map 的统计状态也持久化到存储，并且继续接受其他数据。该操作相当于拍了照，也就是快照。如下图：

第六步：根据前面的步骤以此执行执行

但是，如果某个算子 比如 map 算子由于某种原因操作失败，导致后面的一系列操作受阻。如下图：

在这种情况下，Flink 会重新拓扑(可能会获取新的执行资源)，将输入流倒回到

上一个检查点，然后恢复状态值并从该处开始继续计算。在本例中，[a，2]、[a，2]和[c，2]这几条记录将被重播。因此需要从上一次检查点开始重播，可保证之前的计算不受影响。如下图：

Flink 将输入流倒回到上一个检查点屏障的位置，同时恢复 map 算子的状态值。然后，Flink 从此处开始重新处理。这样做保证了在记录被处理之后，map 算子的状态值与没有发生故障时的一致。

Flink 检查点算法的正式名称是异步分界线快照(asynchronous barrier

snapshotting)。该算法大致基于 Chandy-Lamport 分布式快照算法。

检查点是 Flink 最有价值的创新之一，因为它使 Flink 可以保证 exactly-once，并且不需要牺牲性能。

## 三、配置

默认checkpoint功能是disabled的，想要使用的时候需要先启用，checkpoint开启之后，checkPointMode有两种，Exactly-once和At-least-once，默认的checkPointMode是Exactly-once，Exactly-once对于大多数应用来说是最合适的。At-least-once可能用在某些延迟超低的应用程序（始终延迟为几毫秒）

```java
public class CheckPoint_Configuration {
    public static void main(String[] args) {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // 启动检查点 每隔 1000 毫秒做一次检查点
        env.enableCheckpointing(1000L);
        // 设置模式为exactly-once （这是默认值）
        env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
        // 确保检查点之间有至少500 ms的间隔【checkpoint最小间隔】
        env.getCheckpointConfig().setMinPauseBetweenCheckpoints(500);
        // 检查点必须在一分钟内完成，或者被丢弃【checkpoint的超时时间】
        env.getCheckpointConfig().setCheckpointTimeout(60000);
        // 同一时间只允许进行一个检查点
        env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);
        // 表示一旦Flink处理程序被cancel后，会保留Checkpoint数据，以便根据实际需要恢复到指定的 Checkpoint (重启策略)
        // env.getCheckpointConfig().enableExternalizedCheckpoints(ExternalizedCheckpointCl eanup.RETAIN_ON_CANCELLATION);
    }
}
```

## 四、重启策略

## 4.1、概述

Flink支持不同的重启策略，以在故障发生时控制作业如何重启，集群在启动时会伴随一个默认的重启策略，在没有定义具体重启策略时会使用该默认策略。 如果在工作提交时指定了一个重启策略，该策略会覆盖集群的默认策略，默认的重启策略可以通过 Flink 的配置文件 flink-conf.yaml 指定。配置参数restart-strategy 定义了哪个策略被使用。常用的重新策略：

固定间隔 (Fixed delay)

失败率(Failure rate)

无重启(No restart)

如果没有启用 checkpoint，则使用无重启 (no restart) 策略。

如果启用了 checkpointing，但没有配置重启策略，则使用固定间隔 (fixed-delay) 策略， 尝试重启次数。默认值是：Integer.MAX_VALUE，重启策略可以在flink-conf.yaml中配置，表示全局的配置。也可以在应用代码中动态指定，会覆盖全局配置。

## 4.2、固定间隔 (Fixed delay)

第一种配置：全局配置 flink-conf.yaml

```java
# 策略
restart-strategy: fixed-delay
# 尝试 3 次
restart-strategy.fixed-delay.attempts: 3 
# 尝试间隔
restart-strategy.fixed-delay.delay: 10 s
```

第二种配置：代码中

```java
env.setRestartStrategy(RestartStrategies.fixedDelayRestart(
 3, // 尝试重启的次数 
 Time.of(10, TimeUnit.SECONDS) // 间隔 
 ));
```

## 4.3、失败率 (Failure rate)

第一种：全局配置 flink-conf.yaml

```java
restart-strategy: failure-rate 
restart-strategy.failure-rate.max-failures-per-interval: 3 
restart-strategy.failure-rate.failure-rate-interval: 5 min 
restart-strategy.failure-rate.delay: 10 s 
```

第二种：应用代码设置

```java
env.setRestartStrategy(RestartStrategies.failureRateRestart( 
3, // 一个时间段内的最大失败次数 
Time.of(5, TimeUnit.MINUTES), // 衡量失败次数的是时间段 
Time.of(10, TimeUnit.SECONDS) // 间隔 
));
```

## 4.4、无重启 (No restart)

第一种：全局配置 flink-conf.yaml

```java
restart-strategy: none
```

第二种：应用代码设置

```java
env.setRestartStrategy(RestartStrategies.noRestart());
```

## 五、 多checkpoint

## 5.1、概述

默认情况下，如果设置了Checkpoint选项，则Flink只保留最近成功生成的1个Checkpoint，而当Flink程序失败时，可以从最近的这个Checkpoint来进行恢复。但是，如果我们希望保留多个Checkpoint，并能够根据实际需要选择其中一个进行恢复，这样会更加灵活，比如，我们发现最近4个小时数据记录

处理有问题，希望将整个状态还原到4小时之前Flink可以支持保留多个Checkpoint，需要在Flink的配置文件conf/flink-conf.yaml中，添加如下配置，指定最多需要保存Checkpoint的个数：

```java
state.checkpoints.num-retained: 20
```

这样设置以后就查看对应的Checkpoint在HDFS上存储的文件目录

hdfs dfs -ls hdfs://namenode:9000/flink/checkpoints如果希望回退到某个Checkpoint点，只需要指定对应的某个Checkpoint路径即可实现。

## 5.2、从checkpoint恢复数据

如果Flink程序异常失败，或者最近一段时间内数据处理错误，我们可以将程序从某一个Checkpoint点进行恢复。

```java
bin/flink 
run 
-s hdfs://namenode:9000/flink/checkpoints/467e17d2cc343e6c56255d222bae3421/chk-56/_metadata 
flink-job.jar
```

程序正常运行后，还会按照Checkpoint配置进行运行，继续生成Checkpoint数据。

当然恢复数据的方式还可以在自己的代码里面指定checkpoint目录，这样下一次启动的时候即使代码发生了改变也会自动恢复数据了。

## 5.3、保存检查点 （savePoint）

Flink通过Savepoint功能可以做到程序升级后，继续从升级前的那个点开始执行计算，保证数据不中断全局，一致性快照。可以保存数据源offset，operator操作状态等信息，可以从应用在过去任意做了savepoint的时刻开始继续消费。

### 5.3.1、checkPoint

应用定时触发，用于保存状态，会过期，内部应用失败重启的时候使用。

### 5.3.2、savepoint

用户手动执行，是指向Checkpoint的指针，不会过期，在升级的情况下使用。

注意：为了能够在作业的不同版本之间以及 Flink 的不同版本之间顺利升级，强烈推荐程序员通过uid(String) 方法手动的给算子赋予 ID，这些 ID 将用于确定每一个算子的状态范围。如果不手动给各算子指定 ID，则会由 Flink 自动给每个算子生成一个 ID。只要这些 ID 没有改变就能从保存点

（savepoint）将程序恢复回来。而这些自动生成的 ID 依赖于程序的结构，并且对代码的更改是很敏感的。因此，强烈建议用户手动的设置 ID。

### 5.3.3、savepoint的使用

**1、** 在flink-conf.yaml中配置Savepoint存储位置；

不是必须设置，但是设置后，后面创建指定Job的Savepoint时，可以不用在手动执行命令时指定 Savepoint的位置：

```java
state.savepoints.dir: hdfs://namenode:9000/flink/savepoints
```

**2、** 触发一个savepoint【直接触发或者在cancel的时候触发】；

```java
停止程序：bin/flink cancel -s [targetDirectory] jobId [-yid yarnAppId]【针对on yarn 模式需要指定-yid参数】
```

**3、** 从指定的savepoint启动job；

```java
bin/flink run -s savepointPath [runArgs] jar包
```
