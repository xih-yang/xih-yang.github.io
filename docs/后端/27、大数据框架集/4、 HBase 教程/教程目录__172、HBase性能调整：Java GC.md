# 172、HBase性能调整：Java GC
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/172.html
- 分类：大数据框架
- 分组：教程目录
## Java

### GC和Apache HBase

#### 垃圾回收(GC)机制长时间暂停

在Todd Lipcon的演示中，使用MemStore-Local Allocation Buffers避免使用完整的GC（http://www.slideshare.net/cloudera/hbase-hug-presentation），描述了HBase中常见的两种停止垃圾收集的情况，特别是在加载过程中；CMS故障模式和和老一代堆碎片带来的。

要解决第一个问题，请通过添加-XX:CMSInitiatingOccupancyFraction默认值并将其设置为默认值来启动早于默认值的CMS 。从60％或70％开始（降低阈值，完成的GCing越多，使用的CPU越多）。

为了解决第二个碎片问题，Todd补充实验设施（MSLAB，全称是 MemStore-Local Allocation Buffer），必须在Apache HBase 0.90.x明确启用（它默认是在Apache HBase 0.92.x的）。在你的Configuration中设置hbase.hregion.memstore.mslab.enabled为true。最新的JVM更好地考虑碎片，因此请确保您运行的是最新版本。在消息中读出，识别由碎片引起的并发模式故障。请注意，启用后，每个MemStore实例将至少占用一个MSLAB内存实例。如果您有数千个区域或许多区域，每个区域都有许多列族，那么MSLAB的这种分配可能会负责堆分配的很大一部分，并且在极端情况下会导致OOME。在这种情况下禁用MSLAB，或者降低它使用的内存量，或者减少每个服务器的区域。

如果您的工作负载很大，请查看HBASE-8163 MemStoreChunkPool：使用MSLAB时对JAVA GC的改进（https://issues.apache.org/jira/browse/HBASE-8163）。它描述了在写入负载期间降低Young代GC数量的配置。

如果你没有安装HBASE-8163，和你想提高你的Young代GC时间，那么需要考虑的一个技巧是在hbase-env.sh中设置GC配置-XX:PretenureSizeThreshold，让它的大小比hbase.hregion.memstore.mslab.chunksize的大小要小一些，所以MSLAB分配直接发生在tenured空间而不是Young代。你这样做是因为这些MSLAB分配无论如何都可能使它成为Old代，而不是在eden空间中承受来自s0和s1之间的复制的代价，然后在MSLAB取得了足够的tenure后，从Young代复制到Old代，这节省了一点YGC流失并直接分配到Old代。

还要考虑启用堆外块缓存。这已被证明可以缓解GC暂停时间。
