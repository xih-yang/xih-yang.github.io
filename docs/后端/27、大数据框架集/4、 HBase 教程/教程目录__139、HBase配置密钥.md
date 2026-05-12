# 139、HBase配置密钥
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/139.html
- 分类：大数据框架
- 分组：教程目录
## 配置密钥

备份和还原功能包括必需的和可选的配置密钥。

### 必需的属性

hbase.backup.enable：控制是否启用该功能，默认值为false，将此值设置为true。

hbase.master.logcleaner.plugins：清除HBase Master中的日志时调用的逗号分隔的类列表。将此值设置为org.apache.hadoop.hbase.backup.master.BackupLogCleaner或将其附加到当前值。

hbase.procedure.master.classes：使用Master中的Procedure框架调用的逗号分隔的类列表。将此值设置为org.apache.hadoop.hbase.backup.master.LogRollMasterProcedureManager或将其附加到当前值。

hbase.procedure.regionserver.classes：使用RegionServer中的Procedure框架调用的逗号分隔的类列表。将此值设置为org.apache.hadoop.hbase.backup.regionserver.LogRollRegionServerProcedureManager或将其附加到当前值。

hbase.coprocessor.region.classes：在表上部署的以逗号分隔的RegionObservers列表。将此值设置为org.apache.hadoop.hbase.backup.BackupObserver或将其附加到当前值。

hbase.master.hfilecleaner.plugins：在Master上部署的以逗号分隔的HFileCleaners列表。将此值设置为org.apache.hadoop.hbase.backup.BackupHFileCleaner或将其附加到当前值。

### 可选属性

hbase.backup.system.ttl：hbase:backup表中数据的生存时间（默认值：forever）。此属性仅在创建hbase:backup表之前相关。当此表已存在时，使用HBase shell中的“alter”命令修改TTL。

hbase.backup.attempts.max：获取hbase表快照时执行的尝试次数（默认值：10）。

hbase.backup.attempts.pause.ms：失败的快照尝试之间等待的时间（以毫秒为单位）（默认值：10000）。

hbase.backup.logroll.timeout.millis：等待RegionServers在Master的过程框架中执行WAL滚动的时间（以毫秒为单位）（默认值：30000）。
