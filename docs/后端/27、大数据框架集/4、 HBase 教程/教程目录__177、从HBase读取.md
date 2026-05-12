# 177、从HBase读取
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/177.html
- 分类：大数据框架
- 分组：教程目录
## 从HBase读取

如果您遇到性能问题，邮件列表可以提供帮助。例如，这里有一个关于解决读取时间问题的一个很好的通用线程：[Scan scan = new Scan(); scan.addColumn(...); scan.setAttribute(Scan.HINT_LOOKAHEAD, Bytes.toBytes(2)); table.getScanner(scan);](https://sematext.com/opensee/m/HBase/YGbbKVaNv17x17b2?subj=HBase+Random+Read+latency+>`+100ms”>`HBase随机读取延迟>`%20100ms``
`)

### 关闭ResultScanners

这不仅仅是提高性能，而是避免性能问题。如果忘记关闭ResultScanners，可能会导致RegionServers出现问题。始终将ResultScanner处理包含在try/catch块中。

块缓存

可以通过该setCacheBlocks方法将扫描实例设置为使用RegionServer中的块缓存。对于输入扫描到MapReduce作业，这应该是false。对于频繁访问的行，建议使用块缓存。][Scan scan _ new Scan_ scan.addColumn_..._ scan.setAttribute_Scan.HINT_LOOKAHEAD_ Bytes.toBytes_2_ table.getScanner_scan_](https://sematext.com/opensee/m/HBase/YGbbKVaNv17x17b2?subj=HBase+Random+Read+latency+>`+100ms”>`HBase随机读取延迟>`%20100ms``
`)

[通过在堆外移动块缓存来缓存更多数据。请参阅](https://sematext.com/opensee/m/HBase/YGbbKVaNv17x17b2?subj=HBase+Random+Read+latency+>`+100ms”>`HBase随机读取延迟>`%20100ms``
`)[堆外块缓存](https://www.w3cschool.cn/hbase_doc/hbase_doc-oucw2q4b.html)。

### 行键的最佳加载

执行只需要行键的表扫描（没有族，限定符，值或时间戳）时，请使用setFilter向扫描仪添加带有MUST_PASS_ALL运算符的FilterList。筛选器列表应包括FirstKeyOnlyFilter和KeyOnlyFilter。使用此筛选器组合将导致最坏的情况，即RegionServer从磁盘读取单个值，并为单个行将最小的网络流量发送到客户端。

### 并发：监控数据传播

执行大量并发读取时，监视目标表的数据传播。如果目标表具有的区域太少，则可能从太少的节点提供读取。

请参阅[表创建：预创建区域](https://www.w3cschool.cn/hbase_doc/hbase_doc-bszx2z27.html)以及[HBase配置](https://www.w3cschool.cn/hbase_doc/hbase_doc-arej2yxs.html)

### Bloom过滤器

启用Bloom过滤器可以节省您的磁盘空间，并有助于改善读取延迟。

Bloom过滤器是在HBase-1200 Add bloomfilters中开发的。这里描述的Bloom过滤器实际上是HBase中的第二版。在0.19.x版本中，HBase根据[欧盟委员会一个实验室项目034819](http://www.onelab.org/)所做的工作提供了动态bloom选项。HBase bloom工作的核心后来被引入Hadoop以实现org.apache.hadoop.io.BloomMapFile。

#### Bloom StoreFile足迹

Bloom过滤器向StoreFile常规FileInfo数据结构添加项，然后向StoreFile元数据部分添加两个额外项。

BloomFilter在StoreFile\FileInfo数据结构中：

FileInfo有一个BLOOM_FILTER_TYPE条目，它设置为NONE，ROW或ROWCOL.

StoreFile元数据中的BloomFilter条目：

BLOOM_FILTER_META保持Bloom Size，使用Hash函数等。它的大小很小，并且在StoreFile.Reader加载时缓存。

BLOOM_FILTER_DATA是实际的bloomfilter数据，按需获得。如果已启用（默认情况下已启用），存储在LRU缓存中。

#### Bloom过滤器配置

io.storefile.bloom.enabled 全局关闭开关：

io.storefile.bloom.enabled在Configuration用作关闭l开关，防止出现问题；Default= true。

io.storefile.bloom.error.rate：

io.storefile.bloom.error.rate=平均误报率。Default= 1％。

io.storefile.bloom.max.fold：

io.storefile.bloom.max.fold=保证最低折叠率，大多数人都不应该管它。Default= 7，或者至少可以折叠到原始大小的1/128。=

### Hedged读取

Hedged读取是HDFS的一项功能，在Hadoop 2.4.0中引入了[HDFS-5776](https://issues.apache.org/jira/browse/HDFS-5776)。通常，为每个读取请求生成一个线程。但是，如果启用了Hedged读取，则客户端会等待一段可配置的时间，如果读取未返回，则客户端会针对相同数据的不同块副本生成第二个读取请求。使用先返回的一个，并丢弃另一个读取请求。

在启用Hedged读取的情况下运行时要记住的其他问题包括：

- 它们可能导致网络拥塞。见[HBASE-17083](https://issues.apache.org/jira/browse/HBASE-17083)
- 确保将线程池设置得足够大，以便池上的阻塞不会成为瓶颈（再次参见[HBASE-17083](https://issues.apache.org/jira/browse/HBASE-17083)）

由于HBase RegionServer是HDFS客户端，因此您可以在HBase中启用Hedged读取，方法是将以下属性添加到RegionServer的hbase-site.xml并调整值以适合您的环境。

Hedged读取的配置

- dfs.client.hedged.read.threadpool.size – 专用于服务Hedged读取的线程数。如果将其设置为0（默认值），则禁用Hedged读取。
- dfs.client.hedged.read.threshold.millis – 产生第二个读取线程之前等待的毫秒数。

**Hedged读取配置示例：**

```java
<property>
  <name>dfs.client.hedged.read.threadpool.size</name>
  <value>20</value>  <!-- 20 threads -->
</property>
<property>
  <name>dfs.client.hedged.read.threshold.millis</name>
  <value>10</value>  <!-- 10 milliseconds -->
</property>
```

使用以下指标调整群集上Hedged读取的设置。

Hedged读取的指标：

- hedgedReadOps – 已触发Hedged读取线程的次数。这可能表明读取请求通常很慢，或者Hedged读取的触发太快。
- hedgeReadOpsWin – Hedged读取线程比原始线程快的次数。这可能表示给定的RegionServer在处理请求时遇到问题。
