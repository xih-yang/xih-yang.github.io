# 178、从HBase删除
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/178.html
- 分类：大数据框架
- 分组：教程目录
## 从HBase删除

### 使用HBase表作为队列

HBase表有时用作队列。在这种情况下，必须特别注意定期对以这种方式使用的表格进行主要压缩。如[数据模型](https://www.w3cschool.cn/hbase_doc/hbase_doc-4poq2lqf.html)中所述，将行标记为已删除会创建其他StoreFiles，然后需要在读取时对其进行处理。

### 删除RPC行为

请注意，Table.delete(Delete)不使用writeBuffer。它将在每次调用时执行RegionServer RPC。对于大量删除，请考虑使用：Table.delete(List)。

请参阅[hbase.client.Delete](https://hbase.apache.org/apidocs/org/apache/hadoop/hbase/client/Table.html#delete-org.apache.hadoop.hbase.client.Delete-)
