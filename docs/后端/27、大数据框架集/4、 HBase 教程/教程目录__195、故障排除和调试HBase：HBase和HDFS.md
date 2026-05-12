# 195、故障排除和调试HBase：HBase和HDFS
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/195.html
- 分类：大数据框架
- 分组：教程目录
## HBase和HDFS

Apache HDFS的常规配置指南不在本文中进行详细的介绍。有关配置HDFS的详细信息，请参阅[https://hadoop.apache.org/上](https://hadoop.apache.org/)提供的文档。本节以HBase的形式介绍HDFS。

在大多数情况下，HBase将其数据存储在Apache HDFS中。这包括包含数据的HFile，以及在将数据写入HFile之前存储数据并预防RegionServer崩溃的预写日志（WAL）。HDFS为HBase中的数据提供可靠性和保护，因为它是分布式的。为了以最高效率运行，HBase需要在本地提供数据。因此，在每个RegionServer上运行HDFS DataNode是一种很好的做法。

## HBase和HDFS的重要信息和指南

HBase是HDFS的客户端

HBase是使用HDFS DFSClient类的HDFS客户端，对此类的引用显示在HBase日志中，并带有其他HDFS客户端日志消息。

在多个地方需要配置

与HBase相关的一些HDFS配置需要在HDFS（服务器）端完成。其他必须在HBase内完成（在客户端）。需要在服务器端和客户端设置其他设置。

影响HBase的写入错误可能会记录在HDFS日志中而不是HBase日志中。

写入时，HDFS将通信从一个DataNode传输到另一个DataNode。HBase使用HDFS客户端类与HDFS NameNode和DataNode进行通信。DataNode之间的通信问题记录在HDFS日志中，而不是HBase日志中。

HBase使用两个不同的端口与HDFS通信

HBase使用ipc.Client接口和DataNode类与DataNode进行通信。对这些的引用将出现在HBase日志中。这些通信信道中的每一个使用不同的端口（默认为50010和50020）。通过dfs.datanode.address和dfs.datanode.ipc.address参数在HDFS配置中配置端口。

可能会在HBase、HDFS其中一个，或两者中记录错误

在对HBase中的HDFS问题进行故障排除时，请检查两个位置中的日志是否存在错误。

HDFS需要一段时间才能将节点标记为已死。您可以配置HDFS以避免使用陈旧的DataNode。

默认情况下，HDFS不会将节点标记为已死，直到630秒无法访问。在Hadoop 1.1和Hadoop 2.x中，可以通过启用对陈旧DataNode的检查来缓解此问题，但默认情况下禁用此检查。您可以通过dfs.namenode.avoid.read.stale.datanode和dfs.namenode.avoid.write.stale.datanode settings单独启用读取和写入检查。陈旧的DataNode是dfs.namenode.stale.datanode.interval（默认为30秒）无法访问的。避免过时的数据节点，并将其标记为读取或写入操作的最后可能目标。

HDFS重试和超时的设置对HBase很重要

您可以配置各种重试和超时的设置。请始终参考HDFS文档以获取当前建议和默认值。这里列出了一些对HBase很重要的设置。默认值是Hadoop 2.3的最新版本。查看Hadoop文档以获取最新的值和建议。

HBase Balancer和HDFS Balancer不兼容

HDFS平衡器尝试在DataNode中均匀分布HDFS块。HBase依赖于压缩来在区域分裂或失败后恢复局部性。这两种类型的平衡不能很好地协同工作。

过去，普遍接受的建议是关闭HDFS负载均衡器并依赖HBase均衡器，因为HDFS均衡器会降低局部性。如果您的HDFS版本低于2.7.1，此建议仍然有效。

[HDFS-6133](https://issues.apache.org/jira/browse/HDFS-6133)通过将dfs.datanode.block-pinning.enabled属性设置true为HDFS服务配置，可以从HDFS负载均衡器中排除优先节点（固定）块 。

可以通过将HBase均衡器类（CONF： hbase.master.loadbalancer.class）切换到org.apache.hadoop.hbase.favored.FavoredNodeLoadBalancer来启用HDFS的favorites -nodes特性。

提示：HDFS-6133在HDFS 2.7.0及更高版本中可用，但HBase不支持在HDFS 2.7.0上运行，因此您必须使用HDFS 2.7.1或更高版本才能在HBase中使用此功能

### 连接超时

客户端（HBASE）和HDFS DataNode之间发生连接超时。它们可能在建立连接，尝试读取或尝试写入时发生。下面的两个设置组合使用，并影响DFSClient和DataNode，ipc.cClient和DataNode之间的连接，以及两个DataNode之间的通信。

dfs.client.socket-timeout （默认值：60000）

建立连接或读取时客户端连接超时之前的时间。该值以毫秒表示，因此默认值为60秒。

dfs.datanode.socket.write.timeout （默认值：480000）

写入操作超时之前的时间量。默认值为8分钟，以毫秒表示。

### 典型的错误日志

日志中经常会出现以下类型的错误。

INFO HDFS.DFSClient: Failed to connect to /xxx50010, add to deadNodes and continue java.net.SocketTimeoutException: 60000 millis timeout while waiting for channel to be ready for connect. ch : java.nio.channels.SocketChannel[connection-pending remote=/region-server-1:50010]::块的所有DataNode都已死，无法恢复。以下是导致此错误的事件序列：

INFO org.apache.hadoop.HDFS.DFSClient: Exception in createBlockOutputStream java.net.SocketTimeoutException: 69000 millis timeout while waiting for channel to be ready for connect. ch : java.nio.channels.SocketChannel[connection-pending remote=/ xxx:50010]::此类错误表示写入问题。在这种情况下，主人想要分割日志。它没有本地DataNode，因此它尝试连接到远程DataNode，但DataNode已经死了。
