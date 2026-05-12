# 176、HBase相关内容
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/176.html
- 分类：大数据框架
- 分组：教程目录
## 批量加载

如果可以，请使用批量加载工具。请参阅[HBase批量加载](https://www.w3cschool.cn/hbase_doc/hbase_doc-jxq82rk8.html)。否则，请注意以下内容。

### 表创建：预创建区域

默认情况下，HBase中的表最初是使用一个区域创建的。对于批量导入，这意味着所有客户端都将写入同一区域，直到它足够大，可以拆分并在集群中分布。加速批量导入过程的一个有用模式是预先创建空白区域。在这方面要保守一点，因为太多的区域实际上会降低性能。

使用HBase API预创建拆分有两种不同的方法。第一种方法是依靠默认Admin策略（在Bytes.split中实现）……

```java
byte[] startKey = ...;      // your lowest key
byte[] endKey = ...;        // your highest key
int numberOfRegions = ...;  // # of regions to create
admin.createTable(table, startKey, endKey, numberOfRegions);
```

而使用HBase API的另一种方法是自己定义拆分…

```java
byte[][] splits = ...;   // create your own splits
admin.createTable(table, splits);
```

使用HBase Shell可以通过指定拆分选项来创建表，从而实现类似的效果。

```java
# create table with specific split points
hbase>create 't1','f1',SPLITS => ['\x10\x00', '\x20\x00', '\x30\x00', '\x40\x00']
# create table with four regions based on random bytes keys
hbase>create 't2','f1', { NUMREGIONS => 4 , SPLITALGO => 'UniformSplit' }
# create table with five regions based on hex keys
create 't3','f1', { NUMREGIONS => 5, SPLITALGO => 'HexStringSplit' }
```

有关理解键空间和预创建区域的相关问题，请参阅[RowKeys和区域分割之间的关系](https://www.w3cschool.cn/hbase_doc/hbase_doc-i1qu2mgd.html)。有关手动预分割区域的讨论，请参阅[手动拆分区域](https://www.w3cschool.cn/hbase_doc/hbase_doc-xhpl2r3i.html)决策。有关使用HBase shell预拆分表的详细信息，请参阅[使用HBase shell预分割表](https://www.w3cschool.cn/hbase_doc/hbase_doc-sdlp2lo6.html)。

### 表创建：延迟日志刷新

使用Write Ahead Log（WAL）的Puts的默认行为是将WAL立即写入编辑。如果使用延迟日志刷新，则WAL编辑将保留在内存中直到刷新周期。好处是聚合和异步WAL- 写入，但潜在的缺点是，如果RegionServer发生故障，那么尚未刷新的编辑将丢失。然而，这比完全不使用具有Puts的WAL更安全。

可以通过HTableDescriptor在表上配置延迟日志刷新。hbase.regionserver.optionallogflushinterval的默认值为1000毫秒。

### HBase客户端：关闭WAL

经常请求禁用WAL以提高Puts的性能。这仅适用于批量加载，因为它会在区域服务器崩溃时通过删除WAL的保护来使您的数据处于危险之中。在发生崩溃时可以重新运行批量加载，几乎没有数据丢失的风险。

**注意：如果为批量加载以外的任何操作禁用WAL，则数据存在风险。**

通常，最好使用WAL进行Puts，而使用批量加载技术时，加载吞吐量是一个问题。对于正常的Puts，您不太可能看到性能的改善会超过风险。要禁用WAL，请参阅[禁用WAL](https://www.w3cschool.cn/hbase_doc/hbase_doc-ozyv2qm4.html)。

### HBase客户端：通过RegionServer对Puts进行分组

除了使用writeBuffer之外，通过RegionServer分组的Put还可以减少每次writeBuffer刷新时客户端RPC调用的数量。目前在MASTER上有一个实用程序的HTableUtil，可以这样做，但是对于那些仍然在0.90.x或者更早的版本上的应用程序，您可以复制它，或者实现您自己的版本。

### MapReduce：跳过Reducer

从MR作业（例如，使用TableOutputFormat）向HBase表写入大量数据时，特别是从Mapper发出Puts的地方时，跳过Reducer步骤。当使用Reducer步骤时，来自Mapper的所有输出（Puts）将被假脱机（spooled）到磁盘，然后排序/混洗到其他很可能是非节点的Reducers。直接写入HBase效率更高。

对于将HBase用作源和接收器的摘要作业，则写入将来自Reducer步骤（例如，汇总值然后写出结果）。这是与上述情况不同的处理问题。

### 反模式：一个热点区域

如果您的所有数据一次写入一个区域，则重新阅读有关处理时间序列数据的部分。

此外，如果您正在预分割区域，并且即使您的密钥没有单调增加，您的所有数据仍然在单个区域中清盘，请确认您的密钥空间实际上与分离策略一起使用。区域可能出现“分裂”的原因有多种，但不适用于您的数据。由于HBase客户端直接与RegionServers通信，因此可以通过RegionLocator.getRegionLocation获取。

请参阅上文的“表创建：预创建区域”以及[HBase配置](https://www.w3cschool.cn/hbase_doc/hbase_doc-arej2yxs.html)。
