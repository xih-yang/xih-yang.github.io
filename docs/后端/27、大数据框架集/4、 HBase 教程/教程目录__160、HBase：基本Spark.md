# 160、HBase：基本Spark
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/160.html
- 分类：大数据框架
- 分组：教程目录
## 基本Spark

本节讨论最低和最简单级别的Spark HBase集成。所有其他交互点都建立在此处描述的概念之上。

所有Spark和HBase集成的根源都是HBaseContext。HBaseContext接受HBase配置并将它们推送到Spark执行程序。这允许我们在静态位置为每个Spark Executor建立一个HBase连接。

作为参考，Spark Executors可以与Region Servers位于相同的节点上，也可以位于不同的节点上，不依赖于co-location。将每个Spark Executor都视为多线程客户端应用程序。这允许在执行程序上运行的任何Spark任务访问共享的Connection对象。

**HBaseContext用法示例**

本示例演示如何使用HBaseContext在Scala的RDD上执行foreachPartition：

```java
val sc = new SparkContext("local", "test")
val config = new HBaseConfiguration()
...
val hbaseContext = new HBaseContext(sc, config)
rdd.hbaseForeachPartition(hbaseContext, (it, conn) => {
 val bufferedMutator = conn.getBufferedMutator(TableName.valueOf("t1"))
 it.foreach((putRecord) => {
. val put = new Put(putRecord._1)
. putRecord._2.foreach((putValue) => put.addColumn(putValue._1, putValue._2, putValue._3))
. bufferedMutator.mutate(put)
 })
 bufferedMutator.flush()
 bufferedMutator.close()
})
```

这是在Java中实现的相同示例：

```java
JavaSparkContext jsc = new JavaSparkContext(sparkConf);
try {
  List<byte[]> list = new ArrayList<>();
  list.add(Bytes.toBytes("1"));
  ...
  list.add(Bytes.toBytes("5"));
  JavaRDD<byte[]> rdd = jsc.parallelize(list);
  Configuration conf = HBaseConfiguration.create();
  JavaHBaseContext hbaseContext = new JavaHBaseContext(jsc, conf);
  hbaseContext.foreachPartition(rdd,
      new VoidFunction<Tuple2<Iterator<byte[]>, Connection>>() {
   public void call(Tuple2<Iterator<byte[]>, Connection> t)
        throws Exception {
    Table table = t._2().getTable(TableName.valueOf(tableName));
    BufferedMutator mutator = t._2().getBufferedMutator(TableName.valueOf(tableName));
    while (t._1().hasNext()) {
      byte[] b = t._1().next();
      Result r = table.get(new Get(b));
      if (r.getExists()) {
       mutator.mutate(new Put(b));
      }
    }
    mutator.flush();
    mutator.close();
    table.close();
   }
  });
} finally {
  jsc.stop();
}
```

Scala和Java都支持Spark和HBase之间的所有功能，但SparkSQL除外，它支持Spark支持的任何语言。对于本文档的其余部分，我们现在将重点介绍Scala示例。

上面的示例说明了如何使用连接执行foreachPartition。一些其他的Spark基础功能是支持开箱即用：

bulkPut

用于向HBase大规模并行发送put

bulkDelete

用于向HBase大规模并行发送delete

bulkGet

用于向HBase大规模并行发送get，以创建新的RDD

mapPartition

使用Connection对象执行Spark Map功能以允许完全访问HBase

hBaseRDD

简化分布式扫描以创建RDD

有关所有这些功能的示例，请参阅HBase-Spark模块。
