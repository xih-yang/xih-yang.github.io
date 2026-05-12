# 127、启用HBase内存压缩
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/127.html
- 分类：大数据框架
- 分组：教程目录
要启用HBase的内存压缩，请在您希望的行为的每个列族上设置IN_MEMORY_COMPACTION属性。该IN_MEMORY_COMPACTION属性可以是四个值之一：

- NONE：没有内存压缩。
- BASIC：基本策略允许刷新并保持一个刷新管道，直到我们跳过管道最大阈值，然后我们刷新到磁盘。没有内存压缩，但可以帮助提高吞吐量，因为数据从挥霍的原生ConcurrentSkipListMap数据类型转移到更紧凑（和高效）的数据类型。
- EAGER：这是基本的策略加上内存压缩的刷新（很像是对hfiles进行的磁盘上压缩）；在压缩时，我们应用磁盘规则来消除版本，重复，ttl’d单元格等。
- ADAPTIVE：自适应压缩适应工作负载。它根据数据中重复单元格的比例应用索引压缩或数据压缩。实验。

要在radish表中的info列系列上启用BASIC，请禁用该表并将该属性添加到info列族，然后重新启用：

```java
hbase(main):002:0> disable 'radish'
Took 0.5570 seconds
hbase(main):003:0> alter 'radish', {NAME => 'info', IN_MEMORY_COMPACTION => 'BASIC'}
Updating all regions with the new schema...
All regions updated.
Done.
Took 1.2413 seconds
hbase(main):004:0> describe 'radish'
Table radish is DISABLED
radish
COLUMN FAMILIES DESCRIPTION
{NAME => 'info', VERSIONS => '1', EVICT_BLOCKS_ON_CLOSE => 'false', NEW_VERSION_BEHAVIOR => 'false', KEEP_DELETED_CELLS => 'FALSE', CACHE_DATA_ON_WRITE => 'false', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'ROW', CACHE_INDEX_ON_WRITE => 'false', IN_MEMORY => 'false', CACHE_BLOOMS_ON_WRITE => 'false', PREFETCH_BLOCKS_ON_OPEN => 'false', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '65536', METADATA => {
'IN_MEMORY_COMPACTION' => 'BASIC'}}
1 row(s)
Took 0.0239 seconds
hbase(main):005:0> enable 'radish'
Took 0.7537 seconds
```

请注意IN_MEMORY_COMPACTION属性如何显示为METADATA映射的一部分。

还有一个全局配置hbase.hregion.compacting.memstore.type，您可以在hbase-site.xml文件中设置该配置。使用它来设置创建新表时的默认值（在创建列族存储时，我们首先查看列族配置，以查找IN_MEMORY_COMPACTION设置 ，如果没有，我们将查询hbase.hregion.compacting.memstore .type值使用其内容；默认为BASIC）。

默认情况下，新的hbase系统表将具有BASIC内存中压缩集。若要另行指定，在新表创建时，将hbase.hregion.compacting.memstore.type设置为NONE（注意，设置此值后创建系统表将不具有追溯效果；您将必须更改表以设置内存属性为NONE）。

当内存刷新发生时，通过将已配置的区域刷新大小（在表描述符中设置或从hbase.hregion.memstore.flush.size读取）除以列族数，然后乘以hbase.memstore.inmemoryflush.threshold.factor来计算。默认值为0.014。

监视管道承载的刷新次数，以便符合memstore大小调整的范围，但您也可以通过设置hbase.hregion.compacting.pipeline.segments.limit来设置总刷新次数的最大值。默认值为2。

创建列族Store时，它会说明哪些memstore类型有效。在撰写本文时，有一个老式的DefaultMemStore，它填充ConcurrentSkipListMap，然后刷新到磁盘或新的CompactingMemStore，它是提供这种新的内存中压缩工具的实现。以下是来自RegionServer的日志行，该日志行显示了一个名为family的列族Store，配置为使用CompactingMemStore：

```java
请注意IN_MEMORY_COMPACTION属性如何显示为_METADATA_映射的一部分。
2018-03-30 11：02：24,466 INFO [Time-limited test] regionserver.HStore（325）：Store = family，memstore type = CompactingMemStore，storagePolicy = HOT，verifyBulkLoads = false，parallelPutCountPrintThreshold = 10
```

在CompactingMemStore类（org.apache.hadoop.hbase.regionserver.CompactingMemStore）上启用TRACE级别日志记录，以查看其操作的详细信息。
