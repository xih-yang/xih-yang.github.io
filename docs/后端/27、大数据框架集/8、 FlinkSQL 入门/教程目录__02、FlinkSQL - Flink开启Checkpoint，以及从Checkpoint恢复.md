# 02、FlinkSQL - Flink开启Checkpoint，以及从Checkpoint恢复
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/2.html
- 分类：大数据框架
- 分组：教程目录
Flink提供了Checkpoint/Savepoint来保存状态，以便在出错时进行恢复，在上一个状态的基础上恢复计算流程。

## 问题

## 1. 如何开启Checkpoint？

[Flink-Checkpointing](https://ci.apache.org/projects/flink/flink-docs-release-1.9/dev/stream/state/checkpointing.html)

```java
// get the execution environment
final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
//...
env.enableCheckpointing(300 * 1000);
env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
env.getCheckpointConfig().setMinPauseBetweenCheckpoints(300 * 1000);
env.getCheckpointConfig().setCheckpointTimeout(60000);
// allow only one checkpoint to be in progress at the same time
env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);
// enable externalized checkpoints which are retained after job cancellation
env.getCheckpointConfig().enableExternalizedCheckpoints(CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION);
// allow job recovery fallback to checkpoint when there is a more recent savepoint
env.getCheckpointConfig().setPreferCheckpointForRecovery(true);
```

## 2. 如何从Checkpoint恢复？

[Checkpoint恢复](https://ci.apache.org/projects/flink/flink-docs-release-1.9/ops/state/checkpoints.html#externalized-checkpoints)

### Difference to Savepoints

Checkpoints have a few differences from savepoints. They

usea state backend specific (low-level) data format, may be incremental.

donot support Flink specific features like rescaling.

### Resuming from a retained checkpoint

Ajob may be resumed from a checkpoint just as from a savepoint by using the checkpoint’s meta data file instead (see the savepoint restore guide). Note that if the meta data file is not self-contained, the jobmanager needs to have access to the data files it refers to (see Directory Structure above).

$bin/flink run -s :checkpointMetaDataPath [:runArgs]

### Restore a savepoint

./bin/flink run -s ...

Therun command has a savepoint flag to submit a job, which restores its state from a savepoint. The savepoint path is returned by the savepoint trigger command.

Bydefault, we try to match all savepoint state to the job being submitted. If you want to allow to skip savepoint state that cannot be restored with the new job you can set the allowNonRestoredState flag. You need to allow this if you removed an operator from your program that was part of the program when the savepoint was triggered and you still want to use the savepoint.

./bin/flink run -s -n ...

This is useful if your program dropped an operator that was part of the savepoint.

-n,--allowNonRestoredState Allow to skip savepoint state that

cannot be restored. You need to allow

this if you removed an operator from

your program that was part of the

program when the savepoint was

triggered.

-s,--fromSavepoint Path to a savepoint to restore the job

from (for example

hdfs:///flink/savepoint-1537).

执行命令中加入以下参数

```java
bin/flink -s hdfs://your-node/application/flink/slankka/checkpoint/37736d4edffd6150c97ff24d6a48bbf4/chk-225 -n ...其他参数
```

## 3. 如何收集Flink Checkpoint？

除了从Flink的UI中可以看到，还可以通过YARN等，FLink的REST API 访问获取

```java
// 例如访问YARN的 http://yarn-node.slankka.com:8088/proxy/application_1595593091318_0082/jobs/37736d4edffd6150c97ff24d6a48bbf4/metrics?get=lastCheckpointExternalPath
// 得到
[
  {
    "id": "lastCheckpointExternalPath",
    "value": "hdfs://your-node/application/flink/slankka/checkpoint/37736d4edffd6150c97ff24d6a48bbf4/chk-248"
  }
]
```

但是实际使用的时候，最好将这个指标收集起来

## 收集Flink Metrics（尤其是lastCheckpointExternalPath这种非Number类型指标）

Prometheus行不行？查看源码后发现，是不行的，Prometheus不支持这个指标。

参见以下文档，可以查看Flink支持的收集器（时序数据库）

[Flink Metrics](https://ci.apache.org/projects/flink/flink-docs-release-1.9/monitoring/metrics.html)

可参见下一篇文章：Flink系列二，用Influxdb收集Flink指标
