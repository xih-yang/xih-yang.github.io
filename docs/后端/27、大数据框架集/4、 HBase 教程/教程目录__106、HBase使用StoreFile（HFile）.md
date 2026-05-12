# 106、HBase使用StoreFile（HFile）
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/106.html
- 分类：大数据框架
- 分组：教程目录
## StoreFile（HFile）

StoreFiles是您的数据所在的地方。

### HFile格式

所述HFILE文件格式是基于BigTable[2006]论文中所描述的SSTable文件和Hadoop的TFile（所述单元测试套件和压缩线束直接从TFile获取）。Schubert Zhang的博客文章，[HFile：分块索引文件格式存储分类键值对](https://cloudepr.blogspot.com/2009/09/hfile-block-indexed-file-format-to.html)，全面介绍了HBase的HFile。Matteo Bertozzi还提出了一个有用的描述，HBase I / O：HFile。

### HFile工具

要查看HFile内容的文本版本，可以使用该hbase hfile工具。输入以下内容查看用法：

```java
$ ${HBASE_HOME}/bin/hbase hfile
```

例如，要查看文件，hdfs：//10.81.47.41：8020/hbase/default/TEST/1418428042/DSMP/4759508618286845475的内容，请键入以下内容：

```java
 $ ${HBASE_HOME}/bin/hbase hfile -v -f hdfs://10.81.47.41:8020/hbase/default/TEST/1418428042/DSMP/4759508618286845475
```

如果您放弃选项-v仅查看HFile的摘要。查看其他与该hfile工具相关的用法。

##### HDFS上的StoreFile目录结构

有关StoreFiles在HDFS上的外观与目录结构有关的详细信息，请参阅“浏览HDFS以获取HBase对象”，这将在之后的章节中进行介绍。
