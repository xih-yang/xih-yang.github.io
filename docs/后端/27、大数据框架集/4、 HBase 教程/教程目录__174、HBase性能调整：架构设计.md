# 174、HBase性能调整：架构设计
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/174.html
- 分类：大数据框架
- 分组：教程目录
## 列族数

请参见[HBase列族数量](https://www.w3cschool.cn/hbase_doc/hbase_doc-9lv62mdq.html)。

## 键和属性长度

请参阅：[尽量减少行和列的大小](https://www.w3cschool.cn/hbase_doc/hbase_doc-i1qu2mgd.html)。

## 表RegionSize

在某些表需要不同区域大小而不是配置的默认区域大小的情况下，可以通过在每个表的基础上，通过HTableDescriptor的setFileSize来设置区域大小。

## Bloom过滤器

Bloom过滤器是以其创建者Burton Howard Bloom的名字命名的，它是一种数据结构，用于预测给定元素是否属于一组数据。Bloom过滤器的肯定结果并不总是准确的，但否定结果是准确的。Bloom过滤器被设计成对于数据集来说“足够准确”，这些数据集非常大以至于传统的哈希机制是不切实际的。有关Bloom过滤器的更多信息，请参阅http://en.wikipedia.org/wiki/Bloom_filter。

就HBase而言，Bloom过滤器提供了一个轻量级的内存结构，可以将给定Get操作（Bloom过滤器不能与Scans一起使用）的磁盘读取次数减少到仅包含所需行的StoreFiles。潜在的性能增益随着并行读取的数量而增加。

Bloom过滤器本身存储在每个HFile的元数据中，并且永远不需要更新。当因为区域部署到RegionServer而打开HFile时，Bloom过滤器将加载到内存中。

HBase包括一些调整机制，用于折叠Bloom过滤器以减小大小并将误报率保持在一个理想的范围内。

Bloom过滤器在[HBASE-1200](https://issues.apache.org/jira/browse/HBASE-1200)中引入。从HBase 0.96开始，默认情况下启用基于行的Bloom过滤器。（[HBASE-8450](https://issues.apache.org/jira/browse/HBASE-8450)）

### 何时使用Bloom过滤器

从HBase 0.96开始，默认情况下启用基于行的Bloom过滤器。您可以选择禁用它们或更改某些表以使用行+列Bloom过滤器，具体取决于数据的特征以及如何将其加载到HBase中。

要确定Bloom过滤器是否会产生积极影响，请检查RegionServer度量标准中的blockCacheHitRatio值。如果启用了Bloom过滤器，则值blockCacheHitRatio应该增加，因为Bloom过滤器正在过滤掉绝对不需要的块。

您可以选择为行，或行+列组合来启用Bloom过滤器。如果您通常扫描整行，则行+列组合不会提供任何好处。基于行的Bloom过滤器可以对行+列进行Get操作，但不能使用其他方法。但是，如果您有大量的列级别的Puts，以便每个StoreFile中可能存在一行，则基于行的过滤器将始终返回正结果并且不会带来任何好处。除非每行有一列，否则行+列Bloom过滤器需要更多空间，以便存储更多密钥。当每个数据条目的大小至少为几千字节时，Bloom过滤器效果最佳。

当您的数据存储在几个较大的StoreFiles中时，开销将减少，以避免在低级扫描期间额外的磁盘IO找到特定的行。

Bloom过滤器需要在删除时重建，因此可能不适合具有大量删除的环境。

### 启用Bloom过滤器

在列族上启用Bloom过滤器。您可以使用HColumnDescriptor的setBloomFilterType方法或使用HBase API来完成此操作。有效值是NONE，ROW（默认值），或ROWCOL。

以下示例创建一个表，并在colfam1列族上启用ROWCOL Bloom过滤器。

```java
hbase> create 'mytable',{NAME => 'colfam1', BLOOMFILTER => 'ROWCOL'}
```

### 配置Bloom过滤器的服务器范围行为

您可以在hbase-site.xml中配置以下设置。

参数
默认值
描述

io.storefile.bloom.enabled

yes

如果出现问题，设置为no以杀死服务器范围内的Bloom过滤器

io.storefile.bloom.error.rate

.01

Bloom过滤器的平均误报率。折叠用于维持误报率。表示为百分比的十进制表示形式。

io.storefile.bloom.max.fold

7

保证最大折叠率。不需要更改此设置，不建议这样做。

io.storefile.bloom.max.keys

1.28

对于默认（单个块）Bloom过滤器，这指定了最大键数。

io.storefile.delete.family.bloom.enabled

true

主开关启用Delete Family Bloom过滤器并将其存储在StoreFile中。

io.storefile.bloom.block.size

131072

目标Bloom块大小。大约这个大小的Bloom过滤器块与数据块交织。

hfile.block.bloom.cacheonwrite

false

为复合Bloom过滤器的内联块启用写入高速缓存。

## ColumnFamily BlockSize

可以为表中的每个ColumnFamily配置块大小，默认为64k。较大的单元值需要较大的块大小。块大小和生成的StoreFile索引之间存在反比关系（即，如果blocksize加倍，则结果索引应该大致减半）。

## 内存ColumnFamilies

ColumnFamilies可以选择定义为内存中。数据仍然保留在磁盘上，就像任何其他ColumnFamily一样。内存块在块缓存中具有最高优先级，但不保证整个表将在内存中。

## 压缩

生产系统应使用其ColumnFamily定义进行压缩。

### 注意

压缩会缩小磁盘上的数据。当它在内存中（例如，在MemStore中）或在线上（例如，在RegionServer和Client之间传输）时，它会膨胀。因此，虽然使用ColumnFamily压缩是最佳做法，但它不会完全消除过大的Keys，过大的ColumnFamily名称或过大的列名称的影响。
