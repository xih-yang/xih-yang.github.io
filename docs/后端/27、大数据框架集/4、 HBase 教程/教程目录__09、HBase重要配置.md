# 09、HBase重要配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/9.html
- 分类：大数据框架
- 分组：教程目录
下面我们列出一些重要的配置。我们已经将这部分分为必需的配置和值得推荐的配置。

## HBase所需的配置

请你参考本教程中[HBase基础条件](https://www.w3cschool.cn/hbase_doc/hbase_doc-rf462k9s.html)中的**操作系统**和**Hadoop**部分的内容！

### 大型群集配置

如果您拥有一个包含大量区域的群集，那么在主服务器启动后，Regionserver可能会暂时地进行检查，而所有剩余的RegionServers落后。要签入的第一台服务器将被分配到所有不是最优的区域。为防止出现上述情况，请将其hbase.master.wait.on.regionservers.mintostart属性从其默认值1中调高。

## HBase推荐的配置

### ZooKeeper 配置：zookeeper.session.timeout

默认的超时时间是三分钟（以毫秒为单位）。这意味着，如果服务器崩溃，则在主服务器在三分钟前发现崩溃并开始恢复。您可能需要将超时调整到一分钟甚至更短的时间，以便主服务器尽快通知故障。在更改此值之前，请确保您的JVM垃圾收集配置处于受控状态，否则，长时间的垃圾回收会超出ZooKeeper会话超时时间，将取出您的RegionServer。（如果一个RegionServer长时间处于GC状态，你可能需要在服务器上启动恢复）。

要更改此配置，请编辑hbase-site.xml，将更改的文件复制到群集中并重新启动。

我们将这个值设置得很高，以避免不必要的麻烦。如果出现类似“为什么我在执行一个大规模数据导入的时候Region Server死掉啦”这样的问题，可以解释的原因是：他们的JVM未被解析，并且正在运行长时间的GC操作。

### ZooKeeper 实例的数量

见ZooKeeper。

### HDFS 配置

#### dfs.datanode.failed.volumes.tolerated

这是“DataNode 停止提供服务之前允许失败的卷数。默认情况下，任何卷失败都会导致 datanode 关闭”从HDFS-default.xml中的描述。您可能希望将其设置为可用磁盘数量的一半左右。

#### hbase.regionserver.handler.count

此设置定义了为应答传入的用户表请求而保持打开的线程数。经验法则是，当每个请求的有效载荷接近MB（大容量、扫描使用大缓存）时保持低数字，并且当有效负载小（获取，小投入，ICV，删除）时保持此数字为高。正在进行的查询的总大小受设置hbase.ipc.server.max.callqueue.size的限制。

如果这个数字的有效载荷很小，那么将这个数字设置为最大传入客户端数量是安全的，典型的例子是一个服务于网站的集群，因为put通常不被缓冲，大部分操作都是获取的。

保持此设置的高风险的原因是，当前在区域服务器中发生的所有投入的总大小可能对其内存造成太大的压力，甚至会触发OutOfMemoryError。在低内存上运行的RegionServer将触发其JVM的垃圾收集器，以更频繁的方式运行，直到GC暂停变得明显（原因是用于保留所有请求的有效载荷的所有内存不能被丢弃，即便垃圾收集器正在进行尝试）。一段时间之后，整个群集吞吐量都会受到影响，因为每个碰到该RegionServer的请求都将花费更长的时间，这更加剧了问题的严重性。

您可以通过rpc.logging查看某个RegionServer上是否有太多或太多的处理程序，然后跟踪其日志（排队请求消耗内存）。

### 大型内存机器的配置

HBase提供了一个合理的，保守的配置，可以在几乎所有人们可能想要测试的机器类型上运行。如果你有更大的机器 – HBase有8G或更大的堆 – 你可能会发现下面的配置选项很有帮助。

### 压缩（Compression）

您应该考虑启用ColumnFamily压缩。有几个选项可以在大多数情况下都是通过减小StoreFiles的大小来提高性能，从而减少I / O。

请参阅“HBase压缩”了解更多信息。

### 配置WAL文件的大小和数量

在发生RS故障的情况下，HBase使用wal恢复尚未刷新到磁盘的memstore数据。这些WAL文件应该配置为略小于HDFS块（默认情况下，HDFS块为64Mb，WAL文件为〜60Mb）。

HBase也对WAL文件的数量有限制，旨在确保在恢复过程中不会有太多的数据需要重放。这个限制需要根据memstore配置进行设置，以便所有必要的数据都可以适用。建议分配足够多的WAL文件来存储至少那么多的数据（当所有的存储都接近完整时）。例如，对于16Gb RS堆，默认的memstore设置（0.4）和默认的WAL文件大小（〜60Mb），16Gb * 0.4 / 60，WAL文件数的起点为〜109。但是，由于所有的memstores不会一直占满，所以可以分配更少的WAL文件。

### 管理分割（Splitting）

HBase通常会根据您的hbase-default.xml和hbase-site.xml 配置文件中的设置来处理您所在区域的分割。重要的设置包括：hbase.regionserver.region.split.policy，hbase.hregion.max.filesize，hbase.regionserver.regionSplitLimit。分割的一个简单的观点是，当一个区域发展到hbase.hregion.max.filesize时，它被分割。对于大多数使用模式，您应该使用自动分割。有关手动区域分割的更多信息，请参阅手动区域分割决策。

不要让HBase自动分割你的区域，你可以选择自己管理分割。HBase 0.90.0增加了这个功能。如果你知道你的密钥空间，手动管理分割就行，否则让HBase为你分割。手动分割可以减轻在负载下的区域创建和移动。这也使得区域边界是已知的和不变的（如果你禁用区域分割）。如果使用手动分割，则可以更轻松地进行交错式的基于时间的主要压缩来分散网络IO负载。

禁用自动分割：要禁用自动拆分，可以在集群配置或表配置中设置区域拆分策略：org.apache.hadoop.hbase.regionserver.DisabledRegionSplitPolicy

自动分割建议：如果禁用自动分割来诊断问题或在数据快速增长期间，建议在您的情况变得更加稳定时重新启用它们。

确定预分割区域的最佳数目：

预分割区域的最佳数量取决于您的应用程序和环境。一个好的经验法则是从每个服务器的10个预分割区域开始，随着时间的推移数据不断增长。尽量在区域太少的地方犯错，稍后进行滚动分割更好。区域的最佳数量取决于您所在区域中最大的StoreFile。如果数据量增加，最大的StoreFile的大小将随着时间增加。目标是使最大的区域足够大，压实选择算法仅在定时的主要压实期间将其压缩。否则，该集群可能会同时出现大量压实区域的压实风暴。数据增长导致压缩风暴，而不是人工分割决策，这一点很重要。

如果区域被分割成太多的区域，可以通过配置HConstants.MAJOR_COMPACTION_PERIOD来增加主要的压缩间隔。HBase 0.90引入了org.apache.hadoop.hbase.util.RegionSplitter，它提供所有区域的网络IO安全滚动分割。

### 管理压缩（Compactions）

默认情况下，主要的压缩计划在7天内运行一次。在HBase 0.96.x之前，默认情况下主要的压缩计划是每天发生一次。

如果您需要精确控制主要压缩的运行时间和频率，可以禁用托管的主要压缩。请参阅“compaction.parameters表中的hbase.hregion.majorcompaction条目”的详细信息。

不禁用主要压缩：对于StoreFile清理来说，重要的压缩是绝对必要的。不要完全禁用它们。您可以通过HBase shell或Admin API手动运行主要压缩。

### 预测执行（Speculative Execution）

预测执行MapReduce任务是默认开启的，对于HBase集群，通常建议关闭系统级的推测执行，除非您需要在特定情况下可以配置每个作业。将属性 mapreduce.map.speculative 和 mapreduce.reduce.speculative 设置为 false。

## 其他配置

### 平衡器（Balancer）

平衡器（Balancer）是在主服务器上运行的一个周期性操作，用于重新分配集群上的区域。它通过hbase.balancer.period配置，默认为300000（5分钟）。

有关LoadBalancer的更多信息，请参阅master.processes.loadbalancer。

### 禁用Blockcache

不要关闭块缓存（你可以通过设置hfile.block.cache.size为零来实现）。这样做没有好处，因为RegionServer将花费所有的时间一次又一次地加载HFile索引。如果你的工作集是这样配置块缓存，那么没有益处，最少应保证hfile指数保存在块缓存内的大小（你可以通过调查RegionServer UI粗略地了解你需要的大小；请参阅占网页顶部附近的索引块大小）。

### Nagle’s或小包装的问题

如果在对HBase的操作中出现大约40ms左右的延迟，请尝试Nagles的设置。例如，请参阅用户邮件列表线程，将缓存设置为1的不一致扫描性能以及其中所引用的设置tcpNoDelay来提高扫描速度的问题。您也可以查看该文档的尾部图表：HBASE-7008 Set扫描缓存到一个更好的默认位置，我们的Lars Hofhansl会尝试使用Nagle打开和关闭测量效果的各种数据大小。

### 更好的平均恢复时间（MTTR）

这部分是关于在服务器出现故障后会使服务器恢复更快的配置。请参阅Deveraj Das和Nicolas Liochon博客文章：[简介HBase平均恢复时间（MTTR）](https://hortonworks.com/blog/introduction-to-hbase-mean-time-to-recover-mttr/)。

HBASE-8354强制Namenode使用lease恢复请求循环的问题是混乱的，但在低超时以及如何引起更快的恢复，包括引用添加到HDFS的修复程序方面，有很多好的讨论。下面建议的配置是Varun的建议的提炼和测试，确保你在HDFS版本上运行，所以你有他所提到的修补程序，并且他自己添加到HDFS，帮助HBase MTTR（例如HDFS-3703，HDFS-3712和HDFS-4791 -Hadoop 2确保有他们并且后期Hadoop 1有一些）。在RegionServer中设置以下内容：

```java
<property>
  <name>hbase.lease.recovery.dfs.timeout</name>
  <value>23000</value>
  <description>How much time we allow elapse between calls to recover lease.
  Should be larger than the dfs timeout.</description>
</property>
<property>
  <name>dfs.client.socket-timeout</name>
  <value>10000</value>
  <description>Down the DFS timeout from 60 to 10 seconds.</description>
</property>
```

在NameNode/DataNode端，设置以下内容来启用HDFS-3703，HDFS-3912中引入的“staleness”：

```java
<property>
  <name>dfs.client.socket-timeout</name>
  <value>10000</value>
  <description>Down the DFS timeout from 60 to 10 seconds.</description>
</property>
<property>
  <name>dfs.datanode.socket.write.timeout</name>
  <value>10000</value>
  <description>Down the DFS timeout from 8 * 60 to 10 seconds.</description>
</property>
<property>
  <name>ipc.client.connect.timeout</name>
  <value>3000</value>
  <description>Down from 60 seconds to 3.</description>
</property>
<property>
  <name>ipc.client.connect.max.retries.on.timeouts</name>
  <value>2</value>
  <description>Down from 45 seconds to 3 (2 == 3 retries).</description>
</property>
<property>
  <name>dfs.namenode.avoid.read.stale.datanode</name>
  <value>true</value>
  <description>Enable stale state in hdfs</description>
</property>
<property>
  <name>dfs.namenode.stale.datanode.interval</name>
  <value>20000</value>
  <description>Down from default 30 seconds</description>
</property>
<property>
  <name>dfs.namenode.avoid.write.stale.datanode</name>
  <value>true</value>
  <description>Enable stale state in hdfs</description>
</property>
```

### JMX

JMX（Java Management Extensions，Java管理扩展）提供了内置的工具，使您能够监视和管理Java VM。要启用远程系统的监视和管理，在启动 Java VM 时，您需要设置系统属性com.sun.management.jmxremote.port（要启用JMX RMI连接的端口号）。从历史上看，除了上面提到的端口之外，JMX还会打开两个附加的随机TCP侦听端口，这可能会导致端口冲突问题。

作为一种替代方法，您可以使用HBase提供的基于协处理器的JMX实现。要在0.99或更高版本中启用它，请在hbase-site.xml中添加以下属性：

```java
<property>
  <name>hbase.coprocessor.regionserver.classes</name>
  <value>org.apache.hadoop.hbase.JMXListener</value>
</property>
```

不要同时为Java VM 设置com.sun.management.jmxremote.port

目前它支持Master和RegionServer Java VM。默认情况下，JMX侦听TCP端口10102，您可以使用以下属性进一步配置端口：

```java
<property>
  <name>regionserver.rmi.registry.port</name>
  <value>61130</value>
</property>
<property>
  <name>regionserver.rmi.connector.port</name>
  <value>61140</value>
</property>
```

在大多数情况下，注册表端口可以与连接器端口共享，所以只需要配置regionserver.rmi.registry.port。但是，如果要使用SSL通信，则必须将2个端口配置为不同的值。

默认情况下，密码认证和SSL通信被禁用。要启用密码验证，您需要像下面那样更新hbase-env.sh：

```java
export HBASE_JMX_BASE="-Dcom.sun.management.jmxremote.authenticate=true                  \
                       -Dcom.sun.management.jmxremote.password.file=your_password_file   \
                       -Dcom.sun.management.jmxremote.access.file=your_access_file"
export HBASE_MASTER_OPTS="$HBASE_MASTER_OPTS $HBASE_JMX_BASE "
export HBASE_REGIONSERVER_OPTS="$HBASE_REGIONSERVER_OPTS $HBASE_JMX_BASE "
```

请参阅 `$` JRE_HOME/lib/management下面的示例password/access文件。

要使用密码验证启用SSL通信，请按照以下步骤操作：

```java
#1. generate a key pair, stored in myKeyStore
keytool -genkey -alias jconsole -keystore myKeyStore
#2. export it to file jconsole.cert
keytool -export -alias jconsole -keystore myKeyStore -file jconsole.cert
#3. copy jconsole.cert to jconsole client machine, import it to jconsoleKeyStore
keytool -import -alias jconsole -keystore jconsoleKeyStore -file jconsole.cert
```

然后像下面这样更新hbase-env.sh：

```java
export HBASE_JMX_BASE="-Dcom.sun.management.jmxremote.ssl=true                         \
                       -Djavax.net.ssl.keyStore=/home/tianq/myKeyStore                 \
                       -Djavax.net.ssl.keyStorePassword=your_password_in_step_1       \
                       -Dcom.sun.management.jmxremote.authenticate=true                \
                       -Dcom.sun.management.jmxremote.password.file=your_password file \
                       -Dcom.sun.management.jmxremote.access.file=your_access_file"
export HBASE_MASTER_OPTS="$HBASE_MASTER_OPTS $HBASE_JMX_BASE "
export HBASE_REGIONSERVER_OPTS="$HBASE_REGIONSERVER_OPTS $HBASE_JMX_BASE "
```

最后，使用密钥存储在客户端上启动 jconsole：

```java
jconsole -J-Djavax.net.ssl.trustStore=/home/tianq/jconsoleKeyStore
```

要在主服务器上启用HBase JMX实现，还需要在hbase-site.xml中添加以下属性：

```java
<property>
  <name>hbase.coprocessor.master.classes</name>
  <value>org.apache.hadoop.hbase.JMXListener</value>
</property>
```

端口配置的相应属性为：master.rmi.registry.port（默认为10101）和master.rmi.connector.port（默认情况下与registry.port相同）。
