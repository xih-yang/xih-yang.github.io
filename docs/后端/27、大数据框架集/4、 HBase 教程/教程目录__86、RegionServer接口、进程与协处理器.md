# 86、RegionServer接口、进程与协处理器
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/86.html
- 分类：大数据框架
- 分组：教程目录
## RegionServer接口

HRegionRegionInterface公开的方法包含面向数据的和区域维护：

- 数据（get，put，delete，next等）
- 区域（splitRegion，compactRegion等）例如，当在表上调用该Admin方法majorCompact时，客户端实际上遍历指定表的所有区域，并直接向每个区域请求重大压缩。

## RegionServer进程

RegionServer运行各种后台进程：

- CompactSplitThread

检查分割并处理较小的压缩。
- MajorCompactionChecker

检查重大压实。
- MemStoreFlusher

定期将MemStore中的内存中写入刷新到StoreFiles。
- LogRoller

定期检查RegionServer的WAL。

## RegionServer协处理器

在HBase 0.92版本中，增加了协处理器。
