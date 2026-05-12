# 45、RowCounter示例
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/45.html
- 分类：大数据框架
- 分组：教程目录
## RowCounter示例

包含的RowCounter MapReduce 作业使用 TableInputFormat，并对指定表中的所有行进行计数。要运行它，请使用以下命令：

```java
$ ./bin/hadoop jar hbase-X.X.X.jar
```

这将调用 HBase MapReduce 驱动程序类。从提供的工作选择中进行选择 rowcounter。这将打印 rowcounter 使用建议到标准输出。指定表名，要计数的列和输出目录。
