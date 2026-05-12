# 34、Flink深入：Flink之Savepoint
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/34.html
- 分类：大数据框架
- 分组：教程目录
## 1. Savepoint介绍

> Savepoint:保存点,类似于以前玩游戏的时候,遇到难关了/遇到boss了,赶紧手动存个档,然后接着玩,如果失败了,赶紧从上次的存档中恢复,然后接着玩
>
> 在实际开发中,可能会遇到这样的情况:如要对集群进行停机维护/扩容等操作，那么这时候需要执行一次Savepoint也就是执行一次手动的Checkpoint/也就是手动的发一个barrier栅栏,那么这样的话,程序的所有状态都会被执行快照并保存,当维护/扩容完毕之后,可以从上一次Savepoint的目录中进行恢复!

## 2. Savepoint VS Checkpoint

**对比一** ：

**对比二** ：

## 3. Savepoint实例演示

```java
# 启动yarn session
/export/server/flink/bin/yarn-session.sh -n 2 -tm 800 -s 1 -d
# 运行job-会自动执行Checkpoint
/export/server/flink/bin/flink run --class com.ddkk.checkpoint.CheckpointDemo01 /root/ckp.jar
# 手动创建savepoint--相当于手动做了一次Checkpoint
/export/server/flink/bin/flink savepoint 702b872ef80f08854c946a544f2ee1a5 hdfs://node1:8020/flink-checkpoint/savepoint/
# 停止job
/export/server/flink/bin/flink cancel 702b872ef80f08854c946a544f2ee1a5
# 重新启动job,手动加载savepoint数据
/export/server/flink/bin/flink run -s hdfs://node1:8020/flink-checkpoint/savepoint/savepoint-702b87-0a11b997fa70 --class com.ddkk.checkpoint.CheckpointDemo01 /root/ckp.jar 
# 停止yarn session
yarn application -kill application_1607782486484_0014
```
