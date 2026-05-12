# 129、HBase备份与还原的首次配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/129.html
- 分类：大数据框架
- 分组：教程目录
## 首次配置步骤

本节包含为使用备份和还原功能而必须进行的必要配置更改。由于此功能大量使用YARN的MapReduce框架来并行化这些I/O重载操作，因此配置更改不仅仅局限于此hbase-site.xml。

### 允许YARN中的“hbase”系统用户

YARN container-executor.cfg配置文件必须具有以下属性设置：allowed.system.users = hbase。此配置文件的条目中不允许有空格。

执行第一个备份任务时，跳过此步骤将导致运行时错误。

用于备份和还原的有效container-executor.cfg文件的示例：

```java
yarn.nodemanager.log-dirs=/var/log/hadoop/mapred
yarn.nodemanager.linux-container-executor.group=yarn
banned.users=hdfs,yarn,mapred,bin
allowed.system.users=hbase
min.user.id=500
```

### HBase特定的变化

将以下属性添加到hbase-site.xml并重新启动HBase（如果它已在运行）。

“，…”是省略号，意味着这是一个以逗号分隔的值列表，而不是应该添加到hbase-site.xml的文字文本。

```java
<property>
  <name>hbase.backup.enable</name>
  <value>true</value>
</property>
<property>
  <name>hbase.master.logcleaner.plugins</name>
  <value>org.apache.hadoop.hbase.backup.master.BackupLogCleaner,...</value>
</property>
<property>
  <name>hbase.procedure.master.classes</name>
  <value>org.apache.hadoop.hbase.backup.master.LogRollMasterProcedureManager,...</value>
</property>
<property>
  <name>hbase.procedure.regionserver.classes</name>
  <value>org.apache.hadoop.hbase.backup.regionserver.LogRollRegionServerProcedureManager,...</value>
</property>
<property>
  <name>hbase.coprocessor.region.classes</name>
  <value>org.apache.hadoop.hbase.backup.BackupObserver,...</value>
</property>
<property>
  <name>hbase.master.hfilecleaner.plugins</name>
  <value>org.apache.hadoop.hbase.backup.BackupHFileCleaner,...</value>
</property>
```
