# 78、HBase客户端：WriteBuffer和批处理方法
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/78.html
- 分类：大数据框架
- 分组：教程目录
## WriteBuffer和批处理方法

在HBase 1.0和更高版本中，HTable不赞成使用Table，Table不使用autoflush。要执行缓冲写入操作，请使用BufferedMutator类。

在HBase 2.0和更高版本中，HTable不使用BufferedMutator来执行Put操作。有关更多信息，请参阅[HBASE-18500](https://issues.apache.org/jira/browse/HBASE-18500)。

有关写入持久性的更多信息，请查看[ACID语义页面](http://hbase.apache.org/acid-semantics.html)。
