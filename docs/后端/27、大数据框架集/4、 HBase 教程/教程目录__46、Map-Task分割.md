# 46、Map-Task分割
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/46.html
- 分类：大数据框架
- 分组：教程目录
## Map-Task分割

### 默认的 HBase MapReduce Splitter

当TableInputFormat 用于在 MapReduce 作业中发送 HBase 表时，其分割器将为表的每个区域创建一个映射任务。因此，如果表格中有 100 个区域，则无论在“扫描（Scan）”中选择多少个列族，该作业都会有 100 个 map-task。

### 自定义分配器

对于那些有兴趣在实现自定义的分割器的人，请参见 [TableInputFormatBase](https://hbase.apache.org/apidocs/org/apache/hadoop/hbase/mapreduce/TableInputFormatBase.html) 中 getSplits 的方法。这是 map-task 分配的逻辑所在。
