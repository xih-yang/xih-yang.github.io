# 173、HBase性能调整：配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/173.html
- 分类：大数据框架
- 分组：教程目录
## HBase配置

请参阅[HBase重要配置](https://www.w3cschool.cn/hbase_doc/hbase_doc-fos62kl2.html)一节的内容。

### 管理压缩

对于较大的系统，管理link:[compactions and splits]可能是您需要考虑的事情。

### hbase.regionserver.handler.count

见[[hbase.regionserver.handler.count]](https://www.w3cschool.cn/hbase_doc/hbase_doc-p46d2ki1.html)。

### hfile.block.cache.size

请参见[[hfile.block.cache.size]](https://www.w3cschool.cn/hbase_doc/hbase_doc-p46d2ki1.html)。RegionServer进程的内存设置。

### Blockcache的预取选项

如果设置了列族或RegionServer属性，[HBASE-9857](https://issues.apache.org/jira/browse/HBASE-9857)会在打开BlockCache时添加一个新选项来预取HFile内容。此选项适用于HBase 0.98.3及更高版本。目的是在打开缓存后，使用内存中的表数据尽可能快地预热BlockCache，而不是将预取数计为缓存未命中。这对于快速读取非常有用，但如果要预加载的数据不适合BlockCache，则不是一个好主意。它可用于调整预取的IO影响与所有数据块在缓存中的时间之间的关系。

要在给定列族上启用预取，可以使用HBase Shell或使用API。

**使用HBase Shell启用预取：**

```java
hbase> create 'MyTable', { NAME => 'myCF', PREFETCH_BLOCKS_ON_OPEN => 'true' }
```

**使用API启用预取**

```java
// ...
HTableDescriptor tableDesc = new HTableDescriptor("myTable");
HColumnDescriptor cfDesc = new HColumnDescriptor("myCF");
cfDesc.setPrefetchBlocksOnOpen(true);
tableDesc.addFamily(cfDesc);
// ...
```

要查看运行中的预取，请在hbase-2.0 +中的org.apache.hadoop.hbase.io.hfile.HFileReaderImpl，或在HBase的早期版本，hbase-1.x中的org.apache.hadoop.hbase.io.hfile.HFileReaderV2中启用TRACE级别登录。

### hbase.regionserver.global.memstore.size

请参见[[hbase.regionserver.global.memstore.size]](https://www.w3cschool.cn/hbase_doc/hbase_doc-p46d2ki1.html)。通常根据需要为RegionServer进程调整此内存设置。

### hbase.regionserver.global.memstore.size.lower.limit

请参见[[hbase.regionserver.global.memstore.size.lower.limit]](https://www.w3cschool.cn/hbase_doc/hbase_doc-p46d2ki1.html)。通常根据需要为RegionServer进程调整此内存设置。

### hbase.hstore.blockingStoreFiles

请参见[[hbase.hstore.blockingStoreFiles]](https://www.w3cschool.cn/hbase_doc/hbase_doc-p46d2ki1.html)。如果RegionServer日志中存在阻塞，则增加此值可能有所帮助。

### hbase.hregion.memstore.block.multiplier

请参见[[hbase.hregion.memstore.block.multiplier]](https://www.w3cschool.cn/hbase_doc/hbase_doc-p46d2ki1.html)。如果有足够的RAM，增加这个可以帮助。

### hbase.regionserver.checksum.verify

让HBase将校验和写入数据块，并保存在读取时必须进行校验和查找。

请参见[[hbase.regionserver.checksum.verify]](https://www.w3cschool.cn/hbase_doc/hbase_doc-p46d2ki1.html)，[[hbase.hstore.bytes.per.checksum]](https://www.w3cschool.cn/hbase_doc/hbase_doc-p46d2ki1.html)和[hbase.hstore.checksum.algorithm]。

### 调整callQueue选项

[HBASE- 11355](https://issues.apache.org/jira/browse/HBASE-11355)引入了几种可以提高性能的callQueue调优机制。

要增加callqueue的数量，请设置hbase.ipc.server.num.callqueue为大于1的值。要将callqueue拆分为单独的读写队列，请将hbase.ipc.server.callqueue.read.ratio的值设置为0和1之间。此因素将队列的权重赋给写入（如果低于0.5）或读取（如果高于0.5）。另一种说法是，该因子决定了拆分队列中有多少百分比用于读取。以下示例说明了一些可能性。请注意，无论您使用何种设置，始终至少有一个写入队列。

- 默认值为0不拆分队列。
- 值0.3使用30％的队列进行读取，60％用于写入。如果hbase.ipc.server.num.callqueue的给定值为10，则3个队列将用于读取，7个用于写入。
- 值0.5使用相同数量的读取队列和写入队列。如果hbase.ipc.server.num.callqueue的给定值为10，则将5个队列用于读取，5个用于写入。
- 值0.6使用60％的队列进行读取，30％用于写入。如果hbase.ipc.server.num.callqueue的给定值为10，则7个队列将用于读取，3个用于写入。
- 值1.0使用一个队列来处理写请求，所有其他队列处理读请求。高于的值1.0具有与值相同的效果1.0。如果hbase.ipc.server.num.callqueue的给定值为10，则9个队列将用于读取，1个用于写入。

您还可以拆分读取队列，以便通过设置hbase.ipc.server.callqueue.scan.ratio选项将单独的队列用于短读取（来自Get操作）和长读取（来自Scan操作）。此选项是介于0和1之间的一个因子，它决定了用于获取和扫描的读取队列的比率。如果值低于0.5，则使用更多队列用于获取，如果值高于0.5，则使用更多队列进行扫描。无论您使用何种设置，至少有一个读取队列用于Get操作。

- 值为0不会拆分读取队列。
- 一个值0.3使用60％的读取队列来用于获取，30％用于扫描。如果hbase.ipc.server.num.callqueue给定的值为20，并且hbase.ipc.server.callqueue.read.ratio的值为0.5，那么10个队列将用于读取，在这10个队列中，7个队列用于获取，3个队列用于扫描。
- 一个值0.5使用一半的读取队列用于获取，另一半用于扫描。如果hbase.ipc.server.num.callqueue给定的值为20，并且hbase.ipc.server.callqueue.read.ratio的值为0.5，那么10个队列将用于读取，在这10个队列中，5个队列用于获取，5个队列用于扫描。
- 一个值0.6使用30％的读取队列用于获取，60％用于扫描。如果hbase.ipc.server.num.callqueue给定的值为20，并且hbase.ipc.server.callqueue.read.ratio的值为0.5，那么10个队列将用于读取，在这10个队列中，3个队列用于获取，7个队列用于扫描。
- 一个值1.0将使用除一个读取队列之外的所有队列进行扫描。如果hbase.ipc.server.num.callqueue给定的值为20，并且hbase.ipc.server.callqueue.read.ratio的值为0.5，那么10个队列将用于读取，在这10个队列中，10个队列用于获取，1个队列用于扫描。

您可以使用新选项hbase.ipc.server.callqueue.handler.factor以编程方式调整队列数：

- 值为0，使用所有处理程序之间的单个共享队列。
- 值为1，每个处理程序使用单独的队列。
- 0和1之间的值，根据处理程序的数量调整队列数。例如，值为0.5会在每两个处理程序之间共享一个队列。拥有更多队列（例如，在每个处理程序中有一个队列的情况下）可以在将任务添加到队列或从队列中选择任务时减少争用。权衡的是，如果你有一些具有长时间运行任务的队列，处理程序可能最终等待从该队列执行而不是处理具有等待任务的另一个队列。

要使这些值在给定的区域服务器上生效，必须重新启动区域服务器。这些参数仅用于测试目的，应谨慎使用。
