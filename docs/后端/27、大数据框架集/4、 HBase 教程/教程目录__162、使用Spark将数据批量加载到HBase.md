# 162、使用Spark将数据批量加载到HBase
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/162.html
- 分类：大数据框架
- 分组：教程目录
使用Spark将数据批量加载到HBase有两种选择。有一些基本的批量加载功能适用于行具有数百万列的情况和未整合列的情况，以及Spark批量加载过程的映射侧之前的分区。

Spark还有一个精简记录批量加载选项，第二个选项是为每行少于10k列的表设计的。第二个选项的优点是Spark shuffle操作的吞吐量更高，而且负载更少。

这两种实现的工作方式或多或少类似于MapReduce批量加载过程，因为分区器根据区域拆分对rowkeys进行分区，并且行键按顺序发送到reducer，以便HFiles可以直接从reduce阶段写出。

在Spark术语中，批量加载将围绕Spark repartitionAndSortWithinPartitions实现，然后是Spark foreachPartition。

首先让我们看一下使用基本批量加载功能的示例

批量加载实例

以下示例显示了Spark的批量加载：

```java
val sc = new SparkContext("local", "test")
val config = new HBaseConfiguration()
val hbaseContext = new HBaseContext(sc, config)
val stagingFolder = ...
val rdd = sc.parallelize(Array(
      (Bytes.toBytes("1"),
        (Bytes.toBytes(columnFamily1), Bytes.toBytes("a"), Bytes.toBytes("foo1"))),
      (Bytes.toBytes("3"),
        (Bytes.toBytes(columnFamily1), Bytes.toBytes("b"), Bytes.toBytes("foo2.b"))), ...
rdd.hbaseBulkLoad(TableName.valueOf(tableName),
  t => {
   val rowKey = t._1
   val family:Array[Byte] = t._2(0)._1
   val qualifier = t._2(0)._2
   val value = t._2(0)._3
   val keyFamilyQualifier= new KeyFamilyQualifier(rowKey, family, qualifier)
   Seq((keyFamilyQualifier, value)).iterator
  },
  stagingFolder.getPath)
val load = new LoadIncrementalHFiles(config)
load.doBulkLoad(new Path(stagingFolder.getPath),
  conn.getAdmin, table, conn.getRegionLocator(TableName.valueOf(tableName)))
```

该hbaseBulkLoad函数需要三个必需参数：

**1、** 我们打算批量加载的表的表名；

**2、** 将RDD中的记录转换为元组键值par的函数该元组键是KeyFamilyQualifer对象，值是单元格值KeyFamilyQualifer对象将保存RowKey，列族和列限定符shuffle将在RowKey上进行分区，但将按所有三个值排序；

**3、** HFile的临时路径也将被写出来；

在Spark bulk load命令之后，使用HBase的LoadIncrementalHFiles对象将新创建的HFile加载到HBase中。

**使用Spark进行批量加载的附加参数**

您可以在hbaseBulkLoad上使用其他参数选项设置以下属性。

- HFiles的最大文件大小
- 从压缩中排除HFile的标志
- compression，bloomType，blockSize和dataBlockEncoding的列族设置

使用附加参数：

```java
val sc = new SparkContext("local", "test")
val config = new HBaseConfiguration()
val hbaseContext = new HBaseContext(sc, config)
val stagingFolder = ...
val rdd = sc.parallelize(Array(
      (Bytes.toBytes("1"),
        (Bytes.toBytes(columnFamily1), Bytes.toBytes("a"), Bytes.toBytes("foo1"))),
      (Bytes.toBytes("3"),
        (Bytes.toBytes(columnFamily1), Bytes.toBytes("b"), Bytes.toBytes("foo2.b"))), ...
val familyHBaseWriterOptions = new java.util.HashMap[Array[Byte], FamilyHFileWriteOptions]
val f1Options = new FamilyHFileWriteOptions("GZ", "ROW", 128, "PREFIX")
familyHBaseWriterOptions.put(Bytes.toBytes("columnFamily1"), f1Options)
rdd.hbaseBulkLoad(TableName.valueOf(tableName),
  t => {
   val rowKey = t._1
   val family:Array[Byte] = t._2(0)._1
   val qualifier = t._2(0)._2
   val value = t._2(0)._3
   val keyFamilyQualifier= new KeyFamilyQualifier(rowKey, family, qualifier)
   Seq((keyFamilyQualifier, value)).iterator
  },
  stagingFolder.getPath,
  familyHBaseWriterOptions,
  compactionExclude = false,
  HConstants.DEFAULT_MAX_FILE_SIZE)
val load = new LoadIncrementalHFiles(config)
load.doBulkLoad(new Path(stagingFolder.getPath),
  conn.getAdmin, table, conn.getRegionLocator(TableName.valueOf(tableName)))
```

现在让我们看看如何调用精简记录大批量加载实现

使用精简记录批量加载示例：

```java
val sc = new SparkContext("local", "test")
val config = new HBaseConfiguration()
val hbaseContext = new HBaseContext(sc, config)
val stagingFolder = ...
val rdd = sc.parallelize(Array(
      ("1",
        (Bytes.toBytes(columnFamily1), Bytes.toBytes("a"), Bytes.toBytes("foo1"))),
      ("3",
        (Bytes.toBytes(columnFamily1), Bytes.toBytes("b"), Bytes.toBytes("foo2.b"))), ...
rdd.hbaseBulkLoadThinRows(hbaseContext,
      TableName.valueOf(tableName),
      t => {
        val rowKey = t._1
        val familyQualifiersValues = new FamiliesQualifiersValues
        t._2.foreach(f => {
          val family:Array[Byte] = f._1
          val qualifier = f._2
          val value:Array[Byte] = f._3
          familyQualifiersValues +=(family, qualifier, value)
        })
        (new ByteArrayWrapper(Bytes.toBytes(rowKey)), familyQualifiersValues)
      },
      stagingFolder.getPath,
      new java.util.HashMap[Array[Byte], FamilyHFileWriteOptions],
      compactionExclude = false,
      20)
val load = new LoadIncrementalHFiles(config)
load.doBulkLoad(new Path(stagingFolder.getPath),
  conn.getAdmin, table, conn.getRegionLocator(TableName.valueOf(tableName)))
```

请注意, 在使用精简记录批量加载时, 函数会返回一个元组，其中第一个值为行键，第二个值为FamiliesQualifiersValues对象，它将包含所有列族此行的所有值。
