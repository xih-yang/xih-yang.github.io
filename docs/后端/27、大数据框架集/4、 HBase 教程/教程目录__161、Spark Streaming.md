# 161、Spark Streaming
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/161.html
- 分类：大数据框架
- 分组：教程目录
## Spark Streaming

Spark Streaming是一个基于Spark构建的微批处理流处理框架。HBase和Spark Streaming是一个很好的搭档，因为HBase可以与Spark Streaming一起提供以下好处：

- 即时获取参考数据或配置文件数据的地方
- 以支持仅一次处理的Spark Streaming承诺的方式存储计数或聚合的位置。

HBase-Spark模块与Spark Streaming的集成点类似于其常规的Spark集成点，因为以下命令可以直接通过Spark Streaming DStream实现。

bulkPut

用于向HBase大规模并行发送put

bulkDelete

用于向HBase大规模并行发送delete

bulkGet

用于大规模并行发送get到HBase以创建一个新的RDD

mapPartition

使用Connection对象执行Spark Map函数，以允许完全访问HBase

hBaseRDD

简化分布式扫描以创建RDD

带有DStream的bulkPut示例

下面是使用DStreams的bulkPut示例。RDD批量放置的感觉非常接近。

```java
val sc = new SparkContext("local", "test")
val config = new HBaseConfiguration()
val hbaseContext = new HBaseContext(sc, config)
val ssc = new StreamingContext(sc, Milliseconds(200))
val rdd1 = ...
val rdd2 = ...
val queue = mutable.Queue[RDD[(Array[Byte], Array[(Array[Byte],
    Array[Byte], Array[Byte])])]]()
queue += rdd1
queue += rdd2
val dStream = ssc.queueStream(queue)
dStream.hbaseBulkPut(
  hbaseContext,
  TableName.valueOf(tableName),
  (putRecord) => {
   val put = new Put(putRecord._1)
   putRecord._2.foreach((putValue) => put.addColumn(putValue._1, putValue._2, putValue._3))
   put
  })
```

该hbaseBulkPut功能有三个输入：带有配置Boardcast信息的hbaseContext将我们链接到执行程序中的HBase Connections、我们将数据放入的表的表名、将DStream中的记录转换为HBase Put对象的函数。
