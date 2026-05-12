# 90、HBase使用WAL的目的
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/90.html
- 分类：大数据框架
- 分组：教程目录
## Write Ahead Log

Write Ahead Log（WAL）将HBase中数据的所有更改记录到基于文件的存储中。在正常操作下，不需要WAL，因为数据更改从MemStore移动到StoreFiles。但是，如果在刷新MemStore之前RegionServer崩溃或变得不可用，则WAL确保可以重播对数据所做的更改。如果写入WAL失败，则修改数据的整个操作将失败。

HBase使用WAL接口的实现。通常，每个RegionServer只有一个WAL实例。一个例外是携带hbase：Meta的RegionServer；meta表有自己的专用WAL。在将它们的Mutations MemStore记录到受影响的Store之前，RegionServer将Puts和Deletes记录到它的WAL中。

HLog：在2.0之前，HBase中的WAL接口被命名HLog。在0.94中，HLog是WAL实施的名称。您可能会在为这些旧版本定制的文档中找到对HLog的引用。

WAL位于HDFS中的/hbase/WALs/目录下，每个区域有子目录。
