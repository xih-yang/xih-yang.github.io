# 108、HBase批量加载架构
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/108.html
- 分类：大数据框架
- 分组：教程目录
## 批量加载架构

HBase批量加载过程包含两个主要步骤。

### 通过MapReduce作业准备数据

批量加载的第一步是使用HFileOutputFormat2从MapReduce作业生成HBase数据文件（StoreFiles）。这种输出格式以 HBase 的内部存储格式写出数据，以便以后可以非常高效地将其加载到群集中。

为了高效工作，必须对HFileOutputFormat2进行配置，使每个输出 HFile 适合单个区域。为了做到这一点，输出将被批量加载到HBase中的作业使用Hadoop的TotalOrderPartitioner类来将映射输出分区到密钥空间的不相交范围中，对应于表中区域的键范围。

HFileOutputFormat2包括一个方便函数，configureIncrementalLoad()，它根据根据表格的当前区域边界自动设置TotalOrderPartitioner。

### 完成数据加载

在准备好数据导入之后，无论是通过使用具有“importtsv.bulk.output”选项的importtsv工具，还是使用HFileOutputFormat的其他MapReduce作业，该completebulkload工具都可用于将数据导入到正在运行的集群中。这个命令行工具遍历准备好的数据文件，并且每个文件确定文件所属的区域。然后，它会联系采用HFile的相应RegionServer，将其移动到其存储目录并使数据可供客户端使用。

如果在批量加载准备过程中或者在准备和完成步骤之间区域边界发生了变化，completebulkload公用程序会自动将数据文件分成与新边界相对应的部分。这个过程并不是最佳效率，因此用户应该注意尽量减少在准备批量加载和将其导入群集之间的延迟，特别是如果其他客户端同时通过其他方式加载数据。

```java
$ hadoop jar hbase-server-VERSION.jar completebulkload [-c /path/to/hbase/config/hbase-site.xml] /user/todd/myoutput mytable
```

该-cconfig-file选项可用于指定包含适当的hbase参数的文件（例如，hbase-site.xml）（如果CLASSPATH中尚未提供此参数）（此外，如果zookeeper不是由HBase管理，则CLASSPATH必须包含具有zookeeper配置文件的目录）。

如果目标表在HBase中不存在，则此工具将自动创建表。
