# 75、HBase架构概述
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/75.html
- 分类：大数据框架
- 分组：教程目录
## HBase架构概述

### NoSQL

HBase是一种“NoSQL”数据库。“NoSQL”是一个通用术语，意思是数据库不是支持SQL作为其主要访问语言的RDBMS，但是有许多类型的NoSQL数据库：BerkeleyDB是本地NoSQL数据库的一个例子，而HBase是一个分布式数据库。从技术上讲，HBase实际上更像是一个“数据存储”而不是“数据库”，因为它缺少在RDBMS中找到的许多功能，例如键入列，二级索引，触发器和高级查询语言等。

但是，HBase具有很多支持线性和模块化缩放的功能。通过添加商品类服务器上托管的RegionServers来扩展HBase集群。例如，如果一个集群从10个扩展到20个RegionServers，则它在存储和处理能力方面都会翻倍。RDBMS可以很好地扩展，但只能达到某一点 – 具体而言就是单个数据库服务器的大小 – 并且为了获得最佳性能，需要专门的硬件和存储设备。HBase的特点是：

- 一致的读/写：HBase不是“最终一致的”DataStore。这使它非常适合诸如高速计数器聚合之类的任务。
- 自动分片：HBase表通过区域分布在集群上，随着数据增长，区域会自动分割和重新分配。
- 自动RegionServer故障切换
- Hadoop/HDFS集成：HBase支持HDFS作为其分布式文件系统。
- MapReduce：HBase支持通过MapReduce进行大规模并行处理，以便将HBase用作源和接收器。
- Java客户端API：HBase支持易于使用的Java API进行编程式访问。
- Thrift/REST API：HBase还支持非Java前端的Thrift和REST。
- 块缓存和Bloom过滤器：HBase支持块缓存和Bloom过滤器，以实现高容量查询优化。
- 操作管理：HBase提供内置的网页以提供运营洞察力以及JMX指标。

### 何时使用HBase

HBase不适合所有问题。

首先，确保你有足够的数据。如果你有数亿或数十亿行，那么HBase是一个很好的选择。如果只有几千行，那么使用传统的RDBMS可能是一个更好的选择，因为所有数据都可能在单个节点（或两个）上，而群集的其余部分可能处于闲置状态。

其次，确保您可以在没有RDBMS提供的所有额外功能的情况下生存（例如，键入列，二级索引，事务，高级查询语言等）。针对RDBMS构建的应用程序无法通过简单更改而“移植”到HBase，例如，一个JDBC驱动程序。考虑从RDBMS转移到HBase作为一个完整的重新设计，而不是一个端口。

第三，确保你有足够的硬件。即使是HDFs也不能很好地处理少于5个的数据流（由于HDFS块复制的默认值为3），加上NAMENODE。

HBase可以在笔记本电脑上独立运行 – 但这应该只被视为一种开发配置。

### HBase和Hadoop / HDFS有什么区别？

HDFS是一个非常适合存储大型文件的分布式文件系统。它的文档指出，它不是一个通用的文件系统，也没有在文件中提供快速的单个记录查找。另一方面，HBase建立在HDFS之上，为大型表提供快速记录查找（和更新）。这有时会成为概念混淆的一个观点。HBase内部将您的数据放入HDFS上的索引“StoreFiles”中进行高速查找。有关HBase如何实现其目标的更多信息，请参阅[数据模型](https://www.w3cschool.cn/hbase_doc/hbase_doc-4poq2lqf.html)和本章的其余部分。
