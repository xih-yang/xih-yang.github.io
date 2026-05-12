# 104、MEMSTORE
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/104.html
- 分类：大数据框架
- 分组：教程目录
## MEMSTORE

MemStore对Store进行内存中修改。修改是Cells / KeyValues。当请求刷新时，当前的MemStore被移动到快照并被清除。HBase将继续处理来自新MemStore和备份快照的编辑，直到刷新器报告刷新成功为止。此时，快照将被丢弃。请注意，当发生刷新时，属于同一区域的MemStore将全部被刷新。

## MemStore刷新

MemStore刷新可以在下列任何条件下触发。最小刷新单位是每个区域，而不是单独的MemStore级别。

**1、** 当MemStore达到hbase.hregion.memstore.flush.size指定的大小时，属于其区域的所有MemStore将被刷新到磁盘；

**2、** 当整体MemStore使用率达到hbase.regionserver.global.memstore.upperLimit指定的值时，来自各个区域的MemStore将被刷新到磁盘以减少RegionServer中的整体MemStore使用量刷新顺序基于区域MemStore使用的降序区域将刷新它们的MemStore，直到整个MemStore使用率降至或稍低于hbase.regionserver.global.memstore.lowerLimit；

**3、** 当给定区域服务器的WAL中的WAL日志条目数达到hbase.regionserver.max.logs中指定的值时，来自各个区域的MemStores将被刷新到磁盘以减少WAL中的日志数量刷新顺序基于时间首先刷新具有最早MemStore的区域，直到WAL计数下降到hbase.regionserver.max.logs以下；
