# 87、HBase块缓存
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/87.html
- 分类：大数据框架
- 分组：教程目录
## 块缓存

HBase提供了两种不同的BlockCache实现，来缓存从HDFS中读取的数据：默认的on-heap LruBlockCache和BucketCache（通常是off-heap）。本节讨论每个实现的优点和缺点、如何选择适当的选项以及每种配置选项。

### 缓存选择

LruBlockCache是原始实现，完全在Java堆内。 BucketCache是可选的，主要用于保持块缓存数据脱离堆，尽管BucketCache也可以是文件支持的缓存。

当您启用BucketCache时，您将启用两层缓存系统。我们曾经将层描述为“L1”和“L2”，但是已经不赞成使用hbase-2.0.0的这个术语。“L1”缓存引用了LruBlockCache的一个实例，并且将“L2”引用到了堆外的BucketCache。相反，当启用BucketCache时，所有DATA块都保存在BucketCache层中，元块（INDEX和BLOOM块）在LruBlockCache堆中。这两个层次的管理以及控制它们之间的块移动的策略是由 CombinedBlockCache 完成的。

### 常规缓存配置

除了缓存实现本身之外，您可以设置一些常规配置选项来控制缓存的执行方式。请参阅[CacheConfig](https://hbase.apache.org/devapidocs/org/apache/hadoop/hbase/io/hfile/CacheConfig.html)。设置了其中任何选项后，重新启动或滚动重新启动群集以使配置生效。检查日志以查找错误或意外行为。

### LruBlockCache设计

LruBlockCache是一个LRU缓存，它包含三个块级别的优先级以允许扫描电阻和内存中的ColumnFamilies：

- 单一访问优先级：从HDFS首次加载块时，它通常具有此优先级，它将成为驱逐期间要考虑的第一个组的一部分。其优点是，扫描块比获得更多用量的块更有可能被驱逐。
- 多重访问优先级：如果先前优先级组中的块再次被访问，则会升级到此优先级。因此它是在驱逐期间考虑的第二组的一部分。
- 内存访问优先级：如果该块的系列配置为“内存中（in-memory）”，则无论访问次数如何，都将成为此优先级的一部分。目录表是这样配置的。这个小组是在驱逐过程中考虑的最后一个小组。要将列族标记为内存中，请调用：

```java
    HColumnDescriptor.setInMemory(true);
```

如果从java创建表，或者在shell中创建或更改表时设置IN_MEMORY ⇒ true，例如：

```java
hbase(main):003:0> create  't', {NAME => 'f', IN_MEMORY => 'true'}
```

### LruBlockCache用法

所有用户表默认启用块缓存，这意味着任何读取操作都会加载LRU缓存。这对于大量的用例可能是有益的，但通常需要进一步的调整才能获得更好的性能。一个重要的概念是工作集大小或WSS，即：“计算问题答案所需的内存量”。对于一个网站，这将是在短时间内回答查询所需的数据。

计算缓存中HBase有多少内存的方法是：

```java
number of region servers * heap size * hfile.block.cache.size * 0.99
```

块缓存的默认值为0.4，表示可用堆的40％。最后一个值（99％）是在驱逐开始之后LRU缓存中的默认可接受加载因子。它被包含在这个等式中的原因是，说可以使用100％的可用内存是不现实的，因为这会使得该过程从加载新块的位置阻塞。下面是一些示例：

- 一个区域服务器的堆大小设置为1 GB，默认块高速缓存大小将具有405 MB的块高速缓存可用。
- 20个区域服务器的堆大小设置为8 GB，并且默认块高速缓存大小将具有63.3个块高速缓存。
- 堆大小设置为24 GB并且块缓存大小为0.5的100个区域服务器将拥有大约1.16 TB的块缓存。

您的数据不是块缓存的唯一常驻者。以下是您可能必须考虑的其他问题：

目录表

该hbase:meta表被强制进入块缓存并具有内存优先级，这意味着它们更难以驱逐。（根据区域的数量，hbase：meta表格可以占用几个MB。）

HFiles索引

一个HFILE是HBase的使用将数据存储在HDFS文件格式。它包含一个多层索引，它允许HBase在不必读取整个文件的情况下查找数据。这些索引的大小是块大小（默认为64KB），密钥大小和存储的数据量的一个因素。对于大数据集，每个区域服务器的数字大约为1GB并不罕见，但并不是所有的数据都会被缓存，因为LRU会逐出未使用的索引。

按键

存储的值仅为图片的一半，因为每个值都与其键一起存储（行键，族限定符和时间戳）。

Bloom过滤器

就像HFile索引一样，这些数据结构（启用时）都存储在LRU中。

目前，衡量HFile索引和bloom过滤器大小的推荐方法是查看区域服务器Web UI并检查相关度量标准。对于密钥，可以使用HFile命令行工具完成采样并查找平均密钥大小度量。从HBase 0.98.3开始，您可以在用户界面的特殊Block Cache部分查看有关BlockCache统计信息和指标的详细信息。

当WSS不适合内存时，使用块缓存通常是不好的。例如，在所有区域服务器的块高速缓存中都有40GB可用的情况，但您需要处理1TB的数据。其中一个原因是由驱逐产生的流失会不必要地触发更多的垃圾收集。这里有两个用例：

- 完全随机读取模式：这种情况下，几乎不会在短时间内访问同一行两次，从而使得缓存块的命中率接近于0。在这样的表上设置块缓存会浪费内存和CPU周期，更多的是它会产生更多的垃圾来由JVM提取。
- 映射表：在典型的MapReduce作业中，每个行都只能读取一次，因此不需要将它们放入块缓存。Scan对象可以通过setCaching方法将其关闭（将其设置为false）。如果您需要快速随机读取访问，您仍然可以在此表上保持块缓存打开状态。一个例子就是统计表中提供实时流量的行数，缓存该表的每个块都会产生大量流失，并且肯定会驱逐当前正在使用的数据。

##### 仅高速缓存META块（fscache中的数据块）

一个有趣的设置是我们只缓存META块，并在每个访问中读取DATA块。如果DATA块适用于fscache，则当访问在非常大的数据集中完全随机时，此替代方法可能有意义。要启用此设置，请更改您的表格和每个列族集：BLOCKCACHE ⇒ ‘false’。您只对此列族 “禁用” BlockCache。您永远不能禁用META块的缓存。由于HBASE-4683总是缓存索引和bloom块，所以即使BlockCache被禁用，我们也会缓存META块。

### 堆外块缓存

#### 如何启用BucketCache

BucketCache的通常部署是通过一个管理类来设置两个缓存层：由LruBlockCache实现的堆缓存和使用BucketCache实现的第二个缓存。管理类默认为CombinedBlockCache。上一个链接描述了CombinedBlockCache实现的缓存“策略”。简而言之，它的工作方式是将元块（INDEX和BLOOM）保留在堆上的LruBlockCache层中，并将DATA块保存在BucketCache层中。

Pre-hbase-2.0.0版本

与原生堆内LruBlockCache相比，从hbase-2.0.0之前的BucketCache中获取数据时，抓取总是比较慢。但是，随着时间的推移，延迟趋于不那么不稳定，因为使用BucketCache时垃圾收集较少，因为它正在管理BlockCache分配，而不是GC。如果BucketCache部署在堆外模式下，则该内存根本不由GC管理。这就是为什么你会在2.0.0之前使用BucketCache，所以你的延迟不那么不稳定，为了减少GC和堆碎片，所以你可以安全地使用更多的内存。

在2、0.0之前版本中，可以配置BucketCache，以便接收LruBlockCache驱逐的victim。所有数据和索引块首先缓存在L1中。当驱逐发生在 L1，块（或victims）将移至L2。设置cacheDataInL1通过(HColumnDescriptor.setCacheDataInL1(true)或shell，设置CACHE_DATA_IN_L1为true：来创建或修改列族，如：

```java
hbase(main):003:0> create 't', {NAME => 't', CONFIGURATION => {CACHE_DATA_IN_L1 => 'true'}}                
```

hbase-2.0.0 +版本

HBASE-11425更改了HBase读取路径，以便它可以将读取数据从堆中保留，避免将缓存数据复制到java堆上。在hbase-2.0.0中，堆外延迟接近堆缓存延迟时间，并且不会引发GC。

从HBase 2.0.0开始，L1和L2的概念已被弃用。当BucketCache打开时，DATA块将总是进入BucketCache，而INDEX/BLOOM块将进入堆LRUBlockCache。cacheDataInL1支持已被删除。

BucketCache块缓存可以部署为堆外（off-heap）、文件（file）或mmaped文件模式。

您可以通过hbase.bucketcache.ioengine设置来进行设置。将它设置为offheap使BucketCache将其分配置于堆外，并且file:PATH_TO_FILE的ioengine设置将指示BucketCache使用文件缓存（特别是在您将某些快速I/O附加到SSD等盒子时有用）。从2.0.0开始，可以有多个文件支持BucketCache。当缓存大小要求很高时，这非常有用。对于多个备份文件，将ioengine配置为files:PATH_TO_FILE1,PATH_TO_FILE2,PATH_TO_FILE3。BucketCache也可以配置为使用mmapped文件。将 ioengine 配置为 mmap: PATH_TO_FILE。

可以在我们绕过CombinedBlockCache策略的情况下部署分层设置，并将BucketCache作为严格的L2缓存工作到L1 LruBlockCache。对于这样的设置，设置hbase.bucketcache.combinedcache.enabled为false。在这种模式下，从L1中逐出时，块将转到L2。当一个块被缓存时，它会先在L1中缓存。当我们去寻找缓存块时，我们先看看L1，如果找不到，那么搜索L2。我们称这种部署格式为Raw L1 + L2。注意：这个L1 + L2模式从2.0.0中删除。当使用BucketCache时，它将严格地是DATA缓存，并且LruBlockCache将缓存INDEX/META块。

其他BucketCache配置包括：指定要在重新启动时保持缓存的位置、使用多少线程来编写缓存等。

要检查它是否启用，请查找描述缓存设置的日志行，它将详细介绍BucketCache的部署方式。另请参阅UI。它将详细介绍缓存分层及其配置。

### BucketCache示例配置

此示例为具有1 GB堆缓存的4 GB脱离堆BucketCache提供配置。

在RegionServer上执行配置。

设置hbase.bucketcache.ioengine和hbase.bucketcache.size> 0启用CombinedBlockCache。让我们假设RegionServer已经设置为以5G堆运行：即HBASE_HEAPSIZE=5g。

**1、** 首先，编辑RegionServer的hbase-env.sh，并将HBASE_OFFHEAPSIZE设置为大于所需的堆外大小的值，在本例中为4GB（表示为4G）我们将其设置为5G对于我们的堆外缓存，这将是4G，对于任何其他堆外内存使用（除了BlockCache以外，还有其他堆外存储器的用户，例如RegionServer中的DFSClient可以使用堆外存储器）；

```java
    HBASE_OFFHEAPSIZE=5G
```

**2、** 接下来，将以下配置添加到RegionServer的hbase-site.xml；

```java
    <property>
      <name>hbase.bucketcache.ioengine</name>
      <value>offheap</value>
    </property>
    <property>
      <name>hfile.block.cache.size</name>
      <value>0.2</value>
    </property>
    <property>
      <name>hbase.bucketcache.size</name>
      <value>4196</value>
    </property>
```

**3、** 重新启动或滚动重新启动群集，并检查日志是否有任何问题；

在上面，我们将BucketCache设置为4G。我们将堆上的LruBlockCache配置为RegionServer堆大小的20％（0.2）（0.2 * 5G = 1G）。换句话说，像通常一样配置L1 LruBlockCache（就好像没有L2高速缓存一样）。

HBase-10641引入了为HBase 0.98和更高版本的BucketCache的bucket配置多种大小的功能。要配置多个存储区大小，请将新属性hfile.block.cache.sizes（而不是hfile.block.cache.size）配置为以逗号分隔的块大小列表（从最小到最大排列），并且不含空格。目标是根据您的数据访问模式优化存储bucket大小。以下示例配置大小为4096和8192的存储bucket。

```java
<property>
  <name>hfile.block.cache.sizes</name>
  <value>4096,8192</value>
</property>
```

**HBase中的直接内存使用情况**

默认的最大直接内存因JVM而异。传统上它是64M或某一关系到被分配的堆大小（-Xmx）或根本没有限制（JDK7）。HBase服务器使用直接内存，特别是短路读取，承载的DFSClient将分配直接内存缓冲区。DFSClient使用的数量不容易量化；它是打开的HFiles*hbase.dfs.client.read.shortcircuit.buffer.size的数目，其中hbase.dfs.client.read.shortcircuit.buffer.size设置为128k。如果你使用堆外缓存，你将会使用直接内存。RPCServer使用ByteBuffer池。从2.0.0开始，这些缓冲区是堆外ByteBuffers。启动您的JVM，在conf/hbase-env.sh中确保-XX:MaxDirectMemorySize设置，考虑堆外块缓存(hbase.bucketcache.size)、DFSClient使用，RPC端ByteBufferPool最大大小。这必须比堆外BlockCache大小和最大ByteBufferPool大小的总和要高一点。为最大直接内存大小分配额外的1-2 GB在测试中起作用。直接内存是Java进程堆的一部分，与-Xmx分配的对象堆是分开的。MaxDirectMemorySize分配的值不得超过物理RAM，并且由于其他内存要求和系统限制，可能会少于总可用RAM。

您可以通过查看UI 中的“服务器度量标准：内存（Server Metrics: Memory）”选项卡，查看RegionServer配置为使用多少内存和堆外/直接内存以及以及每次使用的时间。它也可以通过JMX获取。特别是可以在java.nio.type=BufferPool,name=directbean 上找到服务器当前使用的直接内存。Terracotta在Java中使用非堆内存有一个很好的记录。这是为了他们的产品BigMemory，但是很多问题都提到了对任何试图外堆的尝试，检查出来。

**hbase.bucketcache.percentage.in.combinedcache**

这是一个HBase 1.0之前的配置，因为它很混乱。这是一个浮点数，你会设置0.0到1.0之间的某个值，它的默认值是0.9。如果部署使用CombinedBlockCache，则LruBlockCache L1大小计算为：(1 - hbase.bucketcache.percentage.in.combinedcache) * size-of-bucketcache ，BucketCache大小为：hbase.bucketcache.percentage.in.combinedcache * size-of-bucket-cache。如果size-of-bucket-cache指定为Megabytes，则它EITHER配置hbase.bucketcache.size的值；如果hbase.bucketcache.size在0到1.0之间，则hbase.bucketcache.size * -XX:MaxDirectMemorySize。

在1、0中，它应该更直接。Onheap LruBlockCache大小设置为使用hfile.block.cache.size设置（并非最佳）的java堆的一小部分，并且BucketCache在绝对兆字节中设置为上述值。

### 压缩BlockCache

HBASE- 11331引入了懒惰的BlockCache解压缩，更简单地称为压缩BlockCache。当启用压缩BlockCache时，数据和编码数据块将以磁盘格式缓存在BlockCache中，而不是在缓存之前解压缩和解密。

对于承载更多数据而不适合缓存的RegionServer，通过SNAPPY压缩启用此功能可以使吞吐量增加50％，平均延迟增加30％，同时将垃圾收集增加80％，并增加整体CPU负载2％。有关如何衡量和实现性能的更多详细信息，请参阅HBASE-11331。对于容纳适合缓存的数据的RegionServer，或者如果您的工作负载对额外的CPU或垃圾收集负载敏感，则可能会收到较少的收益。

压缩的BlockCache默认是禁用的。要启用它，请在所有RegionServers的hbase-site.xml中设置hbase.block.data.cachecompressed为true。
