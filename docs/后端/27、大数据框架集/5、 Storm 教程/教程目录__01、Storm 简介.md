# 01、Storm 简介
- 来源：https://ddkk.com/zhuanlan/bigdata/storm/1.html
- 分类：大数据框架
- 分组：教程目录
## 什么是Apache Storm？

Apache Storm是一个分布式实时大数据处理系统。Storm设计用于在容错和水平可扩展方法中处理大量数据。它是一个流数据框架，具有最高的摄取率。虽然Storm是无状态的，它通过Apache ZooKeeper管理分布式环境和集群状态。它很简单，您可以并行地对实时数据执行各种操作。

Apache Storm继续成为实时数据分析的领导者。Storm易于设置和操作，并且它保证每个消息将通过拓扑至少处理一次。

## Apache Storm vs Hadoop

基本上Hadoop和Storm框架用于分析大数据。两者互补，在某些方面有所不同。Apache Storm执行除持久性之外的所有操作，而Hadoop在所有方面都很好，但滞后于实时计算。下表比较了Storm和Hadoop的属性。

Storm
Hadoop

实时流处理
批量处理

无状态
有状态

主/从架构与基于ZooKeeper的协调。主节点称为nimbus，从属节点是主管。
具有/不具有基于ZooKeeper的协调的主 – 从结构。主节点是作业跟踪器，从节点是任务跟踪器。

Storm流过程在集群上每秒可以访问数万条消息。
Hadoop分布式文件系统（HDFS）使用MapReduce框架来处理大量的数据，需要几分钟或几小时。

Storm拓扑运行直到用户关闭或意外的不可恢复故障。
MapReduce作业按顺序执行并最终完成。

两者都是分布式和容错的

如果nimbus / supervisor死机，重新启动使它从它停止的地方继续，因此没有什么受到影响。
如果JobTracker死机，所有正在运行的作业都会丢失。

## 使用Apache Storm的例子

Apache Storm对于实时大数据流处理非常有名。因此，大多数公司都将Storm用作其系统的一个组成部分。一些值得注意的例子如下 –

**Twitter** - Twitter正在使用Apache Storm作为其“发布商分析产品”。 “发布商分析产品”处理Twitter平台中的每个tweets和点击。 Apache Storm与Twitter基础架构深度集成。

**NaviSite** - NaviSite正在使用Storm进行事件日志监控/审计系统。系统中生成的每个日志都将通过Storm。Storm将根据配置的正则表达式集检查消息，如果存在匹配，那么该特定消息将保存到数据库。

**Wego** - Wego是位于新加坡的旅行元搜索引擎。旅行相关数据来自世界各地的许多来源，时间不同。Storm帮助Wego搜索实时数据，解决并发问题，并为最终用户找到最佳匹配。

## Apache Storm优势

下面是Apache Storm提供的好处列表：

- Storm是开源的，强大的，用户友好的。它可以用于小公司和大公司。
- Storm是容错的，灵活的，可靠的，并且支持任何编程语言。
- 允许实时流处理。
- Storm是令人难以置信的快，因为它具有巨大的处理数据的力量。
- Storm可以通过线性增加资源来保持性能，即使在负载增加的情况下。它是高度可扩展的。
- Storm在几秒钟或几分钟内执行数据刷新和端到端传送响应取决于问题。它具有非常低的延迟。
- Storm有操作智能。
- Storm提供保证的数据处理，即使群集中的任何连接的节点死或消息丢失。
