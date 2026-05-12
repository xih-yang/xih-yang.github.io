# 191、故障排除和调试HBase：Master
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/191.html
- 分类：大数据框架
- 分组：教程目录
## Master

有关Master的更多信息，请参阅[master](https://www.w3cschool.cn/hbase_doc/hbase_doc-v93k2pzu.html)。

### 启动错误

#### Master提示您需要运行HBase迁移脚本

运行时，HBase迁移脚本提示根目录中没有文件。

HBase希望根目录不存在，或者已经由HBase先前运行初始化。如果使用Hadoop DFS为HBase创建新目录，则会发生此错误。确保HBase根目录当前不存在或已由先前的HBase运行初始化。确定的解决方案是使用Hadoop dfs删除HBase根目录，让HBase创建并初始化目录本身。

#### 包len6080218超出范围！

如果群集中有许多区域，并且您在日志中看到了如上部分标题中所述的错误，请参阅[HBASE-4246集群太多的区域无法承受某些主故障转移方案](https://issues.apache.org/jira/browse/HBASE-4246)。

#### 由于缺少文件系统的hsync，Master无法激活

HBase的集群操作内部框架需要能够在写入日志中持久保存状态。当使用支持检查所需呼叫可用性的Apache Hadoop Common文件系统API版本时，如果发现无法安全运行，HBase将主动中止集群。

对于Master，失败将显示在这样的日志中：

```java
2018-04-05 11:18:44,653 ERROR [Thread-21] master.HMaster: Failed to become active master
java.lang.IllegalStateException: The procedure WAL relies on the ability to hsync for proper operation during component failures, but the underlying filesystem does not support doing so. Please check the config value of 'hbase.procedure.store.wal.use.hsync' to set the desired level of robustness and ensure the config value of 'hbase.wal.dir' points to a FileSystem mount that can provide it.
        at org.apache.hadoop.hbase.procedure2.store.wal.WALProcedureStore.rollWriter(WALProcedureStore.java:1034)
        at org.apache.hadoop.hbase.procedure2.store.wal.WALProcedureStore.recoverLease(WALProcedureStore.java:374)
        at org.apache.hadoop.hbase.procedure2.ProcedureExecutor.start(ProcedureExecutor.java:530)
        at org.apache.hadoop.hbase.master.HMaster.startProcedureExecutor(HMaster.java:1267)
        at org.apache.hadoop.hbase.master.HMaster.startServiceThreads(HMaster.java:1173)
        at org.apache.hadoop.hbase.master.HMaster.finishActiveMasterInitialization(HMaster.java:881)
        at org.apache.hadoop.hbase.master.HMaster.startActiveMasterManager(HMaster.java:2048)
        at org.apache.hadoop.hbase.master.HMaster.lambda$run$0(HMaster.java:568)
        at java.lang.Thread.run(Thread.java:745)
```

如果您尝试在独立模式下运行并看到此错误，请返回[快速入门 – 独立HBase部分][_ _HBase]，并确保已包含所有给定的配置设置。
