# 109、HDFS
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/109.html
- 分类：大数据框架
- 分组：教程目录
## HDFS

由于HBase在HDFS上运行（并且每个StoreFile都是作为HDFS上的文件编写的），因此了解HDFS体系结构非常重要，特别是在它如何存储文件，处理故障转移和复制块方面。

有关更多信息，请参阅[HDFS体系结构](https://www.w3cschool.cn/hadoop/hadoop_hdfs_overview.html)上的Hadoop文档。

### NameNode

NameNode负责维护文件系统元数据。有关更多信息，请参阅上面的HDFS体系结构链接。

### DataNode

DataNode负责存储HDFS块。有关更多信息，请参阅上面的HDFS体系结构链接。
