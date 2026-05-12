# 13、HBase升级路径
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/13.html
- 分类：大数据框架
- 分组：教程目录
## HBase升级路径

### HBase：从 0.98.x 升级到 1.x

在本节中，首先，你需要注意 1.0.0 版本以上的 HBase 做出了重大的更改，所以在继续升级过程前，你应该仔细阅读这些重要的更改部分，以免发生意外。

#### HBase 1.0.0+ 重要更改部分：

在这里，我们列出了自 0.98.x 版本之后的 1.0.0 以上版本的重要更改，您应该知道这些更改会在升级后生效。

- HBase 1.0.0+ 中 ZooKeeper 3.4 是必需的。
- HBase 默认端口已更改：

HBase使用的端口已更改。他们曾经是在600XX范围内。在HBase 1.0.0中，它们已经从临时端口范围中移出，并且是160XX（主 Web UI 为 60010，现在为16010; RegionServer Web UI 为 60030，现在为16030等）。如果要保留旧的端口位置，请将hbase-default.xml中的端口设置配置复制到hbase-site.xml中，将它们更改回 HBase 0.98.x 版本的旧值，并确保在重新启动之前已分发了配置。

- HBase 主端口绑定更改：

在 HBase 1.0.x 中，HBase Master绑定RegionServer端口以及主端口。此行为从1.0之前的 HBase 版本更改。在 HBase 1.1 和 2.0 分支中，此行为将恢复为 HBase 主服务器未绑定RegionServer端口的 1.0 行为。

- hbase.bucketcache.percentage.in.combinedcache 配置已被删除：

如果您正在使用BucketCache，则可能已使用此配置。如果不使用 BucketCache，则此更改不会影响您。它的移除意味着您的 L1 LruBlockCache 现在使用 hfile.block.cache.size 来调整大小，即，如果您不在执行 BucketCache，您可以调整堆上 L1 LruBlockCache 的大小 – 并且 BucketCache 大小不适用于该 hbase.bucketcache.size 设置。您可能需要调整 configs 以将 LruBlockCache 和 BucketCache 大小设置为 0.98.x 和之前的大小。如果你没有设置这个配置，它的默认值是 0.9。如果你什么都不做，你的 BucketCache 将会增加10％。您的 L1 LruBlockCache 将成为 java 堆大小的 hfile.block.cache.size 倍（hfile.block.cache.size 是 0.0 到 1.0 之间的浮点数）。

### HBase：从 0.96.x 升级到 0.98.x

HBase 从 0.96.x 到 0.98.x 的滚动升级工作。这两个版本不是二进制兼容的。

需要执行其他步骤才能利用 0.98.x 的一些新功能，包括单元可见性标签，单元 ACL 和透明服务器端加密。有关更多信息，请参阅保护 Apache HBase。显着的性能改进包括对提前写日志线程模型的更改，它在高负载、反向扫描仪、MapReduce 快照文件和带区压缩的情况下提供更高的事务吞吐量。

客户端和服务器可以运行 0.98.x 和 0.96.x 版本。但是，由于 Java API 中的更改，应用程序可能需要重新编译。

### HBase：从 0.94.x 升级到 0.98.x

HBase 从 0.94.x 直接到 0.98.x 的滚动升级不起作用。升级路径遵循与从 0.94.x 升级到 0.96.x 相同的过程。需要额外的步骤才能使用 0.98.x 的一些新功能。

### HBase：从 0.94.x 升级到 0.96.x

#### Singularity

您必须完全停止旧版本的 0.94.x 群集才能进行升级。如果您正在群集之间进行复制，则两个群集都必须进行升级。请确保它完全处于关机状态。WAL 文件越少，升级运行的速度就越快（升级将在文件系统中找到的所有日志文件都分解为升级过程的一部分）。所有客户端也必须升级到 0.96。

API已经改变。您需要重新编译 0.96 的代码，您可能需要调整应用程序以适应新的 API（TODO：更改列表）。

#### 执行 0.96 升级

在升级过程中，HDFS 和 ZooKeeper 必须启动并运行！

HBase 0.96.0 附带升级脚本，请运行：

```java
$ bin/hbase upgrade
```

以查看其用法。该升级脚本有两种主要模式：check 和 execute。

**check**

检查（check）步骤针对正在运行的 0.94 群集运行。从下载的 0.96.x 二进制文件运行它。检查步骤正在寻找 HFile v1 文件的存在。这些在 HBase 0.96.0 中不受支持。要让它们重写为 HFile v2，您必须运行压缩。

检查步骤在其运行结束时打印统计数据（在日志中 grep 用于 “Result:”），打印其扫描的表的绝对路径、找到的任何 HFile v1 文件、包含所述文件的区域（这些区域将需要大的压缩）以及任何如果找到损坏的文件。一个损坏的文件是不可读的，所以未定义（HFile v1 和 HFile v2 都没有）。

要运行检查步骤，请运行：

```java
$ bin/hbase upgrade -check
```

这里是示例输出：

```java
Tables Processed:
hdfs://localhost:41020/myHBase/.META.
hdfs://localhost:41020/myHBase/usertable
hdfs://localhost:41020/myHBase/TestTable
hdfs://localhost:41020/myHBase/t
Count of HFileV1: 2
HFileV1:
hdfs://localhost:41020/myHBase/usertable    /fa02dac1f38d03577bd0f7e666f12812/family/249450144068442524
hdfs://localhost:41020/myHBase/usertable    /ecdd3eaee2d2fcf8184ac025555bb2af/family/249450144068442512
Count of corrupted files: 1
Corrupted Files:
hdfs://localhost:41020/myHBase/usertable/fa02dac1f38d03577bd0f7e666f12812/family/1
Count of Regions with HFileV1: 2
Regions to Major Compact:
hdfs://localhost:41020/myHBase/usertable/fa02dac1f38d03577bd0f7e666f12812
hdfs://localhost:41020/myHBase/usertable/ecdd3eaee2d2fcf8184ac025555bb2af
There are some HFileV1, or corrupt files (files with incorrect major version)
```

在上面的示例输出中，两个区域中有两个 HFile v1 文件和一个损坏的文件，应该删除损坏的文件。具有 HFile v1 的地区需要进行大规模压缩。为了紧凑，请启动hbase shell 并查看如何压缩单个区域。完成主要压缩后，重新运行检查步骤，并且 HFile v1 文件应该消失，替换为 HFile v2 实例。

默认情况下，检查步骤将扫描 HBase 根目录（在配置中定义为 hbase.rootdir）。要仅扫描特定目录，请传递 dir 选项。

```java
$ bin/hbase upgrade -check -dir /myHBase/testTable
```

上述命令将检测 /myHBase/testTable 目录中的 HFile v1 文件。

一旦检查步骤报告所有 HFile v1 文件已被重写，则继续进行升级是安全的。

**execute**

在检查步骤显示群集没有 HFile v1 后，继续升级是安全的。接下来是执行（execute）步骤。在执行 execute 步骤之前，您必须关闭您的 0.94.x CLUSTER。如果检测到正在运行的 HBase 主服务器或 RegionServer，则 execute 步骤将不会运行。

在升级过程中，HDFS 和 ZooKeeper 应该启动并运行。如果 zookeeper 由 HBase 管理，那么您可以启动 zookeeper，以便通过运行升级：

```java
$ ./hbase/bin/hbase-daemon.sh start zookeeper
```

执行升级步骤由三个子步骤组成。

- 命名空间：HBase 0.96.0 支持命名空间。升级需要重新排序文件系统中的目录以使命名空间正常工作。
- ZNodes：清除所有 znode，以便可以使用新的 protobuf’ed 格式将新的 znode 写入其位置，并且可以将一些 znode 迁移到适当位置：例如复制和表状态znodes
- WAL 日志分割：如果 0.94.x 集群没有完全关闭，我们将在0.96.0 启动之前将 WAL 日志分割为迁移的一部分。这个 WAL 分割比本地分布式 WAL 分割运行速度慢，因为它全部在单个升级过程中。

要运行执行步骤，请确保首先在服务器和客户端的各处复制了 HBase 0.96.0 二进制文件。确保 0.94.0 群集已关闭。然后执行如下操作：

```java
$ bin/hbase upgrade -execute
```

以下是一些示例输出：

```java
Starting Namespace upgrade
Created version file at hdfs://localhost:41020/myHBase with version=7
Migrating table testTable to hdfs://localhost:41020/myHBase/.data/default/testTable
.....
Created version file at hdfs://localhost:41020/myHBase with version=8
Successfully completed NameSpace upgrade.
Starting Znode upgrade
.....
Successfully completed Znode upgrade
Starting Log splitting
...
Successfully completed Log splitting
```

如果执行步骤的输出看起来不错，请停止开始执行升级的zookeeper实例：

```java
$ ./hbase/bin/hbase-daemon.sh stop zookeeper
```

然后就可以启动 hbase-0.96.0。

#### 故障排除

旧客户端连接到0.96群集

出现如下的异常，升级过程将会失败：

```java
17:22:15  Exception in thread "main" java.lang.IllegalArgumentException: Not a host:port pair: PBUF
17:22:15  *
17:22:15   api-compat-8.ent.cloudera.com ��  ���(
17:22:15    at org.apache.hadoop.hbase.util.Addressing.parseHostname(Addressing.java:60)
17:22:15    at org.apache.hadoop.hbase.ServerName.&init>(ServerName.java:101)
17:22:15    at org.apache.hadoop.hbase.ServerName.parseVersionedServerName(ServerName.java:283)
17:22:15    at org.apache.hadoop.hbase.MasterAddressTracker.bytesToServerName(MasterAddressTracker.java:77)
17:22:15    at org.apache.hadoop.hbase.MasterAddressTracker.getMasterAddress(MasterAddressTracker.java:61)
17:22:15    at org.apache.hadoop.hbase.client.HConnectionManager$HConnectionImplementation.getMaster(HConnectionManager.java:703)
17:22:15    at org.apache.hadoop.hbase.client.HBaseAdmin.&init>(HBaseAdmin.java:126)
17:22:15    at Client_4_3_0.setup(Client_4_3_0.java:716)
17:22:15    at Client_4_3_0.main(Client_4_3_0.java:63)
```

#### 升级 META 以使用 Protocol Buffers（Protobuf）

HBase 从 0.96 之前的版本升级时，META 需要转换为使用协议缓冲区（Protobuf）。这是由配置选项 hbase.MetaMigrationConvertingToPB 控制，它在默认情况下被设置为 true。因此，默认情况下，您不需要采取任何措施。

迁移是一次性事件。但是，每次启动群集时，META 都会进行扫描以确保不需要转换。如果您的区域数量非常多，则此扫描可能需要很长时间。在 0.98.5 开始，您可以在 HBase的-site.xml 中设置 hbase.MetaMigrationConvertingToPB 为 false ，以禁用此启动扫描。

### HBase：从 0.92.x 升级到 0.94.x

我们曾经认为 HBase 的 0.92 版本和 0.94 版本是接口兼容的，您可以在这些版本之间进行滚动升级，但是后来我们发现 HColumnDescriptor 中的HBASE-5357 Use builder 模式更改了方法签名，不是返回 void，而是返回 HColumnDescriptor。这将抛出 java.lang.NoSuchMethodError: org.apache.hadoop.hbase.HColumnDescriptor.setMaxVersions(I)V，因此 0.92 和 0.94 不兼容，你不能在它们之间进行滚动升级。

### HBase：从 0.90.x 升级到 0.92.x

#### 升级指南

您会发现 0.92.0 与 0.90.x 版本稍有不同，这里有一些需要注意的事项。

这些是升级前需要了解的重要内容：

- 默认情况下 MSLAB 处于开启状态。如果您有很多区域，请观看该堆的使用情况。
- 默认情况下，分布式日志分割处于开启状态。它应该使 RegionServer 故障转移更快。
- 有一个单独的包安全。
- 如果 -XX: MaxDirectMemorySize 是设置在您的 hbase. sh，它将启用实验性的离堆缓存 (您可能不希望这样)。

**不可回退：**

要移动到 0.92.0，你只需关闭群集，将 HBase 0.90.x 替换为 HBase 0.92.0 二进制文件（确保清除所有 0.90.x 实例）并重新启动（不能从 0.90.x 到 0.92.x 重新启动，必须重新启动）。在启动时，.META. 表格内容被重写，从 info:regioninfo 列中移除表格模式。此外，首次启动后完成的任何刷新都将以新的0.92.0 文件格式（带有内嵌块（版本2）的 HBase 文件格式）写入数据。这意味着一旦您在 HBase 数据目录中启动了 HBase 0.92.0，您就无法回到 0.90.x。

**MSLAB 默认为开启：**

在0、92.0 中，该 hbase.hregion.memstore.mslab.enabled 标志被设置为 true。在 0.90.x 中是 false。启用它时，即使内存存储为零或仅包含一些小元素，memstores 也会逐步为 MSLAB 2MB 块分配内存。这通常很好，但是如果您在 0.90.x 群集中每个 RegionServer 有很多区域（并且 MSLAB 已关闭），则可能会发现自己升级时出现 OOME，因为 thousands of regions * number of column families * 2MB MSLAB（至少）将堆放在顶部。设置hbase.hregion.memstore.mslab.enabled 为 false 或将 hbase.hregion.memstore.mslab.chunksize 设置为小于2MB 的 MSLAB 大小。

**分布式日志分割处于默认状态：**

此前，WAL 日志崩溃是由 Master 单独分割的。在 0.92.0 中，日志分割由群集完成。这应该大大减少分割日志和使区域重新联机所需的时间。

**内存计算改变：**

在0、92.0 中，包含嵌入块（版本2）索引和 bloom 过滤器的 HBase 文件格式占用了来自文件系统的相同 LRU 使用的高速缓存块。在 0.90.x 版本中，HFile v1 指数位于 LRU 之外，因此即使索引位于没有被使用的文件中，也会占用空间。利用 LRU 中的索引，你可能会发现块缓存的空间较少。相应地调整块缓存。块大小的默认大小已经从0.22.0（堆的20％）改变为0.25。

**可用的 Hadoop 版本：**

在Hadoop 1.0.x（或 CDH3u3）上运行 0.92.0。性能优势值得推动。否则，我们的 Hadoop 处方就像以前一样；您需要一个支持工作同步的 Hadoop。

如果在Hadoop 1.0.x（或 CDH3u3）上运行，请启用本地读取。

**HBase 0.92.0 附带 ZooKeeper 3.4.2：**

如果可以的话，升级你的 ZooKeeper。如果你不能，3.4.2 客户端应该与 3.3.X 集成（HBase 使用 3.4.2 API）进行工作。

**联机更改默认为关闭状态：**

在0、92.0 中，我们添加了一个实验性在线模式更改设施。它在默认情况下是关闭的。您自担风险启用它。联机修改和分割表格不能很好地协同工作，所以请确保您的群集静态使用此功能（现在）。

**WebUI：**

网络用户界面（web UI）在 0.92.0 中添加了一些附加功能。它显示当前正在转换的区域的列表，最近的压缩/刷新和正在运行的进程的进程列表（如果一切正常并且请求正在及时处理，通常是空的）。其他添加内容包括按区域请求、调试 servlet 转储等。

**安全 tarball：**

我们现在运送两个 tarballs：安全和不安全的 HBase。

**HBase复制的变化：**

**0、** 92.0增加了两个新功能：multi-slave复制和multi-master复制启用它的方式与添加新的对等方式相同，因此为了拥有multi-master，您只需运行add_peer，就可以为每个群集充当其他从属群集的主节点冲突是在时间戳级别处理的，这可能是也可能不是您想要的，因此需要在每个用例基础上对其进行评估复制在0.92仍然是实验性的，默认情况下是禁用的，运行需要您自担风险；

**如果 OOME，RegionServer 现在会中止：**

如果一个 OOME，我们现在有 JVM kill RegionServer 进程，所以它快速下降。之前，RegionServer 可能会在受伤的状态下徘徊一段时间后停滞。要禁用此功能，并建议您将其保留原位，则需要编辑 bin/hbase 文件。

**HFile v2 和“更大，更少”的趋势：**

0、92.0 以新格式存储数据，HBase 文件格式包含内嵌块（版本2）。随着 HBase 的运行，它会将您的所有数据从 HFile v1 移至 HFile v2 格式。此自动迁移将在刷新和紧凑排列运行时在后台运行。HFile v2 允许 HBase 运行更大的区域/文件。事实上，我们鼓励所有前进的 HBase 都倾向于 Facebook axiom #1，运行时区域更大，区域更少。如果你现在有很多区域 – 每个主机超过100个 – 你应该考虑在你移动到 0.92.0（在 0.92.0，默认大小现在是 1G，从 256M 开始）之后设置你的区域大小，然后运行在线合并工具。

### HBase：从 0.20.x 或 0.89.x 升级到 HBase 0.90.x

此版本的 0.90.x HBase 可以在 HBase 0.20.x 或 HBase 0.89.x 写入的数据上启动。不需要迁移步骤。HBase 0.89.x 和 0.90.x 以不同的方式地写出了区域目录的名称，它们用区域名称的 md5 哈希来命名，而不是 jenkins 哈希，所以这意味着一旦启动，就不会返回到 HBase 0.20 。X。

确保在升级时从 conf 目录中删除 hbase-default.xml。此文件的 0.20.x 版本将具有用于 0.90.x HBase 的子优化配置。在 HBase 的 -default.xml 文件中现在被捆绑到 HBase jar 上进行读取。如果您想查看此文件的内容，请在：src/main/resources/hbase-default.xml 的 src 树中查看它，或者参阅 [HBase 默认配置](https://www.w3cschool.cn/hbase_doc/hbase_doc-p46d2ki1.html)。

最后，如果从 0.20.x 升级，请检查您的 shell 中的 .META 模式。在过去，我们会建议用户使用 16kb 的 MEMSTORE_FLUSHSIZE，在 shell 中运行：

```java
hbase> scan '-ROOT-'
```

这将输出当前 .META. 模式。检查 MEMSTORE_FLUSHSIZE 大小。它是 16kb（16384）吗？如果是的话，你需要修改它(默认的值是 64MB (67108864)) 运行脚本bin/set_meta_memstore_size.rb，这个脚本会修改.META.schema。如果不运行的话，集群会比较慢。
