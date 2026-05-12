# 42、捆绑HBase MapReduce作业
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/42.html
- 分类：大数据框架
- 分组：教程目录
## 捆绑HBase MapReduce作业

HBase JAR 也可作为一些捆绑 MapReduce 作业的驱动程序。要了解捆绑的 MapReduce 作业，请运行以下命令：

```java
$ ${HADOOP_HOME}/bin/hadoop jar ${HBASE_HOME}/hbase-mapreduce-VERSION.jar
An example program must be given as the first argument.
Valid program names are:
  copytable: Export a table from local cluster to peer cluster
  completebulkload: Complete a bulk data load.
  export: Write table data to HDFS.
  import: Import data written by Export.
  importtsv: Import data in TSV format.
  rowcounter: Count rows in HBase table
```

每个有效的程序名都是捆绑的 MapReduce 作业。要运行其中一个作业，请在下面的示例之后为您的命令建模。

```java
$ ${HADOOP_HOME}/bin/hadoop jar ${HBASE_HOME}/hbase-mapreduce-VERSION.jar rowcounter myTable
```
