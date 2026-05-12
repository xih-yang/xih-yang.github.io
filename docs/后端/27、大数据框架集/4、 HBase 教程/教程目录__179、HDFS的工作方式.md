# 179、HDFS的工作方式
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/179.html
- 分类：大数据框架
- 分组：教程目录
## HDFS

因为HBase在HDFS上运行，所以了解它如何工作以及它如何影响HBase非常重要。

### 低延迟读取的当前问题

HDFS的原始用例是批处理。因此，低延迟读取在历史上不是优先事项。随着Apache HBase的日益普及，这种情况正在发生变化，并且已经在开发中进行了一些改进。有关HBase的HDFS改进，请参阅[Umbrella Jira Ticket](https://issues.apache.org/jira/browse/HDFS-1599)。

### 利用本地数据

由于Hadoop 1.0.0（也是0.22.1,0.23.1，CDH3u3和HDP 1.0）通过HDFS-2246，当数据是本地的，DFSClient可以进行“短路”并直接从磁盘读取而不是通过DataNode。对于HBase来说，这意味着RegionServers可以直接读取其计算机的磁盘，而不必打开socket与DataNode通信，前者通常要快得多。请参阅JD的[Performance Talk](http://files.meetup.com/1350427/hug_ebay_jdcryans.pdf)。另请参阅[HBase，mail＃dev – read short circuit](https://sematext.com/opensee/m/HBase/YGbbSAIV4X867Q1?subj=read+short+circuit)以获得有关short circuit读取的更多讨论。

要启用“short circuit”读取，它将取决于您的Hadoop版本。在[HDFS-347](https://issues.apache.org/jira/browse/HDFS-347)中，Hadoop 2中的原始shortcircuit补丁得到了很大改进。请参阅http://blog.cloudera.com/blog/2013/08/how-improved-short-circuit-local-reads-bring-better-performance-and-security-to-hadoop/，以有关新旧实现的区别。请参阅[Hadoop shortcircuit读取配置](http://archive.cloudera.com/cdh4/cdh/4/hadoop/hadoop-project-dist/hadoop-hdfs/ShortCircuitLocalReads.html)页面，了解如何启用后者，更好的shortcircuit版本。例如，这是一个最小配置。启用添加到hbase-site.xml的short-circuit：

```java
<property>
  <name>dfs.client.read.shortcircuit</name>
  <value>true</value>
  <description>
    This configuration parameter turns on short-circuit local reads.
  </description>
</property>
<property>
  <name>dfs.domain.socket.path</name>
  <value>/home/stack/sockets/short_circuit_read_socket_PORT</value>
  <description>
    Optional.  This is a path to a UNIX domain socket that will be used for
    communication between the DataNode and local HDFS clients.
    If the string "_PORT" is present in this path, it will be replaced by the
    TCP port of the DataNode.
  </description>
</property>
```

请注意托管共享域socket的目录的权限；如果对hbase用户以外的其他人开放，dfsclient会做出提示。

如果您运行的是旧的Hadoop，即没有HDFS-347但具有HDFS-2246的Hadoop，则必须设置两个配置。首先，需要修改hdfs-site.xml。将该dfs.block.local-path-access.user属性设置为可以使用该快捷方式的唯一用户。这必须是启动HBase的用户。然后在hbase-site.xml中设置dfs.client.read.shortcircuit为true

服务：至少是HBase RegionServers，需要重新启动才能获取新配置。

**dfs.client.read.shortcircuit.buffer.size**

在高流量的HBase上运行时，此值的默认设置过高。在HBase中，如果尚未设置此值，则从默认1M到128k (自HBase 0.98.0和0.96.1起) 开始设置。HBase中的Hadoop DFSClient将为其打开的每个块分配此大小的直接字节缓冲区。由于HBase总是打开它的HDFS文件，所以这可以快速增加。

### HBase与HDFS的性能比较

关于dist-list的一个相当常见的问题是为什么HBase在批处理上下文中不如HDFS文件那样高效（例如，作为MapReduce源或接收器）。简短的回答是HBase比HDFS做得更多（例如，读取KeyValues，返回最新的行或指定的时间戳等），因此HBase在此处理环境中比HDFS慢4-5倍。还有改进的余地，随着时间的推移，这个差距会缩小，但在这个用例中HDFS总是会更快。
