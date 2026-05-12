# 18、FlinkSQL - Flink On Yarn 的Classpath传递分析
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/18.html
- 分类：大数据框架
- 分组：教程目录
## 问题

flink-1.13.5 用户提交FlinkSQL作业，连接Hive时发现缺少MRVersion类的定义。

```java
java.lang.NoClassDefFoundError: org/apache/hadoop/mapred/MRVersion
	at org.apache.hadoop.hive.shims.Hadoop23Shims.isMR2(Hadoop23Shims.java:932) ~[hive-exec-1.1.0-cdh5.12.1-slankka.jar:1.1.0-cdh5.12.1]
	at org.apache.hadoop.hive.shims.Hadoop23Shims.getHadoopConfNames(Hadoop23Shims.java:1003) ~[hive-exec-1.1.0-cdh5.12.1-slankka.jar:1.1.0-cdh5.12.1]
	at org.apache.hadoop.hive.conf.HiveConf$ConfVars.<clinit>(HiveConf.java:370) ~[hive-exec-1.1.0-cdh5.12.1-slankka.jar:1.1.0-cdh5.12.1]
	at org.apache.hadoop.hive.conf.HiveConf.<clinit>(HiveConf.java:108) ~[hive-exec-1.1.0-cdh5.12.1-slankka.jar:1.1.0-cdh5.12.1]
	at org.apache.flink.connectors.hive.util.HiveConfUtils.create(HiveConfUtils.java:38) ~[flink-connector-hive_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.connectors.hive.HiveTableMetaStoreFactory$HiveTableMetaStore.<init>(HiveTableMetaStoreFactory.java:72) ~[flink-connector-hive_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.connectors.hive.HiveTableMetaStoreFactory$HiveTableMetaStore.<init>(HiveTableMetaStoreFactory.java:64) ~[flink-connector-hive_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.connectors.hive.HiveTableMetaStoreFactory.createTableMetaStore(HiveTableMetaStoreFactory.java:61) ~[flink-connector-hive_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.connectors.hive.HiveTableMetaStoreFactory.createTableMetaStore(HiveTableMetaStoreFactory.java:43) ~[flink-connector-hive_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.table.filesystem.stream.PartitionCommitter.commitPartitions(PartitionCommitter.java:157) ~[flink-table-blink_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.table.filesystem.stream.PartitionCommitter.processElement(PartitionCommitter.java:143) ~[flink-table-blink_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.streaming.runtime.tasks.OneInputStreamTask$StreamTaskNetworkOutput.emitRecord(OneInputStreamTask.java:205) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.streaming.runtime.io.AbstractStreamTaskNetworkInput.processElement(AbstractStreamTaskNetworkInput.java:134) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.streaming.runtime.io.AbstractStreamTaskNetworkInput.emitNext(AbstractStreamTaskNetworkInput.java:105) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.streaming.runtime.io.StreamOneInputProcessor.processInput(StreamOneInputProcessor.java:66) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.streaming.runtime.tasks.StreamTask.processInput(StreamTask.java:423) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.streaming.runtime.tasks.mailbox.MailboxProcessor.runMailboxLoop(MailboxProcessor.java:204) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.streaming.runtime.tasks.StreamTask.runMailboxLoop(StreamTask.java:684) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.streaming.runtime.tasks.StreamTask.executeInvoke(StreamTask.java:639) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.streaming.runtime.tasks.StreamTask.runWithCleanUpOnFail(StreamTask.java:650) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.streaming.runtime.tasks.StreamTask.invoke(StreamTask.java:623) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.runtime.taskmanager.Task.doRun(Task.java:779) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at org.apache.flink.runtime.taskmanager.Task.run(Task.java:566) ~[flink-dist_2.11-1.13.5.jar:1.13.5]
	at java.lang.Thread.run(Thread.java:745) ~[?:1.8.0_121]
Caused by: java.lang.ClassNotFoundException: org.apache.hadoop.mapred.MRVersion
	at java.net.URLClassLoader.findClass(URLClassLoader.java:381) ~[?:1.8.0_121]
	at java.lang.ClassLoader.loadClass(ClassLoader.java:424) ~[?:1.8.0_121]
	at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:331) ~[?:1.8.0_121]
	at java.lang.ClassLoader.loadClass(ClassLoader.java:357) ~[?:1.8.0_121]
	... 24 more
```

## 现象

org.apache.flink.client.cli.CliFrontend 打印的客户端日志中，缺少 hadoop-mapreduce部分的目录。

## 差异：

客户端提供

```java
[@/opt/cloudera/parcels/GPLEXTRAS/lib]# hadoop classpath | tr ':' '\n'
/etc/hadoop/conf
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop/libexec/../../hadoop/lib/*
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop/libexec/../../hadoop/.//*
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop/libexec/../../hadoop-hdfs/./
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop/libexec/../../hadoop-hdfs/lib/*
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop/libexec/../../hadoop-hdfs/.//*
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop/libexec/../../hadoop-yarn/lib/*
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop/libexec/../../hadoop-yarn/.//*
/opt/cloudera/parcels/CDH/lib/hadoop-mapreduce/lib/*
/opt/cloudera/parcels/CDH/lib/hadoop-mapreduce/.//*
/opt/cloudera/parcels/GPLEXTRAS-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop/lib/*
```

AM端

```java
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop/
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop/lib/
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop-hdfs/
/opt/cloudera/parcels/CDH-5.12.1-1.cdh5.12.1.p0.3/lib/hadoop-yarn/
/opt/cloudera/parcels/GPLEXTRAS/lib/hadoop/lib/
```

唯独缺少

```java
/opt/cloudera/parcels/CDH/lib/hadoop-mapreduce/
```

## 分析

分析下方两个jar均含有这个类

```java
hadoop-core-2.6.0-mr1-cdh5.12.1.jar
hadoop-mapreduce-client-common-2.6.0-cdh5.12.1.jar
```

解决办法很简单，就是放进lib内，也符合Flink官方文档。然而笔者并不满足于这个简单的解决方案，脑中出现了些许疑问。

## 疑问

平台通过客户端设置HADOOP_CLASSPATH了

在bin/config.sh设置了`INTERNAL_HADOOP_CLASSPATH=(`hadoop classpath`)`

然而，Flink提交到Yarn后仍然出现问题。具体现象是：ApplicationMaster启动时，打印的Classpath却不包含平台的 /opt/cloudera/parcels/CDH/lib/hadoop-mapreduce。

## 分析1：是否是客户端环境所致？

在Flink客户端的提交日志中，配置日志级别，org.apache.flink.client.cli.CliFrontend 打印出了Classpath，且非常完整。

不成立。

## 分析2：是否是软链接目录所致？

在Flink客户端的提交日志中，打印出了Classpath，包含了含有和不含有软链接的路径。而同时AM启动日志内既没有hadoop-mapreduce的Jar，也有其他的含有软链接的jar。

不成立。

## 分析3：是否是因为YARN的节点上缺少CDH的 hadoop-mapreduce有关jar包？

每一个机器都安装有完整的cloudera的发行版，Classpath完整。

不成立。

## 分析4：是否是因为hadoop classpath 和 hadoop classpath --glob的差异？

客户端日志打印了具体的jar路径，且Classpath非常完整。

不成立。

## 分析5：是否因为Yarn NodeManager 启动的时候采用了自身进程的Classpath，而忽略了客户端的Classpath？

阅读源码发现，客户端的Classpth是由 org.apache.flink.yarn.YarnClusterDescriptor 进行组装，排序，和上传的。

并且lib内的jar 一定会被上传到NodeManager上。

不成立。

## 分析6：受否因为yarn-site.xml覆盖了AM的Classpath

以下基本符合am启动过程中Classpath的现象，同样缺少 hadoop-mapreduce的jar包

```java
<property>
    <name>yarn.application.classpath</name>
<value>$HADOOP_CLIENT_CONF_DIR,$HADOOP_CONF_DIR,$HADOOP_COMMON_HOME/*,$HADOOP_COMMON_HOME/lib/*,$HADOOP_HDFS_HOME/*,$HADOOP_HDFS_HOME/lib/*,$HADOOP_YARN_HOME/*,$HADOOP_YARN_HOME/lib/*,/opt/cloudera/parcels/GPLEXTRAS/lib/hadoop/lib/*</value>
</property>
```

结论成立

## 证据：

**org.apache.flink.yarn.YarnClusterDescriptor.java***based on Flink-1.13.5*

**org.apache.flink.yarn.Utils.java***based on Flink-1.13.5*

```java
    public static void setupYarnClassPath(Configuration conf, Map<String, String> appMasterEnv) {
        addToEnvironment(
                appMasterEnv, Environment.CLASSPATH.name(), appMasterEnv.get(ENV_FLINK_CLASSPATH));
        String[] applicationClassPathEntries =
                conf.getStrings(
                        YarnConfiguration.YARN_APPLICATION_CLASSPATH,
                        YarnConfiguration.DEFAULT_YARN_APPLICATION_CLASSPATH);
        for (String c : applicationClassPathEntries) {
            addToEnvironment(appMasterEnv, Environment.CLASSPATH.name(), c.trim());
        }
    }
```

Flink 将自身的lib、plugin、用户jar等依赖加入ENV_FLINK_CLASSPATH，作为Container的一部分，紧接着将`yarn.application.classpath`放入Yarn应用的Classpath。

## 结论

根据Flink官方文档描述，向Flink 提供Hadoop classpath 应当使用export HADOOP_CLASSPATH，并在每一个节点上配置，其次是在lib中提供。

进一步讲：

Flink 自身管理了lib和user的 jar，这无疑会影响Container的classpath，但与此同时，默认读取`yarn-site.xml`的 `yarn.application.classpath`，并不会读取环境变量HADOOP_CLASSPATH作为AM的 Classpath的一部分，因此出现不一致性。

lib可以影响Flink On Yarn的Classpath，但bin/config.sh内的shell变量无法影响。
