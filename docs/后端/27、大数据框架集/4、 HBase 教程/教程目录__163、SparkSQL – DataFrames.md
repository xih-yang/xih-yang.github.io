# 163、SparkSQL – DataFrames
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/163.html
- 分类：大数据框架
- 分组：教程目录
## SparkSQL / DataFrames

HBase-Spark连接器（在HBase-Spark模块中）利用Spark-1.2.0中引入的DataSource API （SPARK-3247），弥补了简单HBase KV存储和复杂关系SQL查询之间的差距，使用户能够使用Spark在HBase上执行复杂的数据分析工作。HBase Dataframe是标准的Spark Dataframe，能够与任何其他数据源（如Hive，Orc，Parquet，JSON等）进行交互。HBase-Spark Connector应用关键技术，如分区修剪，列修剪，谓词叠加和数据局部性。

要使用HBase-Spark连接器，用户需要为HBase和Spark表之间的模式映射定义Catalog，准备数据并填充HBase表，然后加载HBase DataFrame。之后，用户可以使用SQL查询在HBase表中进行集成查询和访问记录。以下说明了基本程序。

### 定义目录

```java
def catalog = s"""{
       |"table":{"namespace":"default", "name":"table1"},
       |"rowkey":"key",
       |"columns":{
         |"col0":{"cf":"rowkey", "col":"key", "type":"string"},
         |"col1":{"cf":"cf1", "col":"col1", "type":"boolean"},
         |"col2":{"cf":"cf2", "col":"col2", "type":"double"},
         |"col3":{"cf":"cf3", "col":"col3", "type":"float"},
         |"col4":{"cf":"cf4", "col":"col4", "type":"int"},
         |"col5":{"cf":"cf5", "col":"col5", "type":"bigint"},
         |"col6":{"cf":"cf6", "col":"col6", "type":"smallint"},
         |"col7":{"cf":"cf7", "col":"col7", "type":"string"},
         |"col8":{"cf":"cf8", "col":"col8", "type":"tinyint"}
       |}
     |}""".stripMargin
```

Catalog定义了HBase和Spark表之间的映射。该目录有两个关键部分。一个是rowkey定义，另一个是Spark中的表列与HBase中的列族和列限定符之间的映射。上面定义了一个HBase表的模式，其名称为table1，行键为key，列数为col1 -col8。请注意，还必须将rowkey详细定义为column (col0)，该列具有特定的cf（rowkey）。

### 保存DataFrame

```java
case class HBaseRecord(
   col0: String,
   col1: Boolean,
   col2: Double,
   col3: Float,
   col4: Int,       
   col5: Long,
   col6: Short,
   col7: String,
   col8: Byte)
object HBaseRecord
{                                                                                                             
   def apply(i: Int, t: String): HBaseRecord = {
      val s = s"""row${"%03d".format(i)}"""       
      HBaseRecord(s,
      i % 2 == 0,
      i.toDouble,
      i.toFloat,  
      i,
      i.toLong,
      i.toShort,  
      s"String$i: $t",      
      i.toByte)
  }
}
val data = (0 to 255).map { i =>  HBaseRecord(i, "extra")}
sc.parallelize(data).toDF.write.options(
 Map(HBaseTableCatalog.tableCatalog -> catalog, HBaseTableCatalog.newTable -> "5"))
 .format("org.apache.hadoop.hbase.spark ")
 .save()
```

用户准备的data是一个本地Scala集合，它有256个HBaseRecord对象。 sc.parallelize(data)函数分配data以形成RDD。toDF返回一个DataFrame。 writefunction返回一个DataFrameWriter，它用于将DataFrame写入外部存储系统（例如，HBase）。给定具有指定模式的DataFrame catalog，save函数将创建一个包含5个区域的HBase表，并将DataFrame保存在其中。

### 加载DataFrame

```java
def withCatalog(cat: String): DataFrame = {
  sqlContext
  .read
  .options(Map(HBaseTableCatalog.tableCatalog->cat))
  .format("org.apache.hadoop.hbase.spark")
  .load()
}
val df = withCatalog(catalog)
```

在’withCatalog’函数中，sqlContext是SQLContext的变量，它是在Spark中处理结构化数据（行和列）的入口点。 read返回一个DataFrameReader，可用于以DataFrame的形式读取数据。 option函数将基础数据源的输入选项添加到DataFrameReader，format函数指定DataFrameReader的输入数据源格式。该load()函数将输入作为DataFrame加载。withCatalog函数返回的日期框df可用于访问HBase表。

### 语言综合查询

```java
val s = df.filter(($"col0" <= "row050" && $"col0" > "row040") ||
  $"col0" === "row005" ||
  $"col0" <= "row005")
  .select("col0", "col1", "col4")
s.show
```

DataFrame可以执行各种操作，例如join，sort，select，filter，orderBy等。上面的df.filter使用给定的SQL表达式过滤行。select选择一组列： col0，col1和col4。

### SQL查询

```java
df.registerTempTable("table1")
sqlContext.sql("select count(col1) from table1").show
```

registerTempTabledf使用表名将DataFrame注册为临时表table1。此临时表的生命周期与用于创建df的SQLContext相关联。sqlContext.sql函数允许用户执行SQL查询。

### 其他

**示例-使用不同时间戳的查询**

在HBaseSparkConf中，可以设置与时间戳相关的四个参数。它们分别是TIMESTAMP，MIN_TIMESTAMP，MAX_TIMESTAMP和MAX_VERSIONS。用户可以使用MIN_TIMESTAMP和MAX_TIMESTAMP查询具有不同时间戳或时间范围的记录。与此同时，在下面的示例中使用具体值而不是tsSpecified和oldMs。

下面的示例显示了如何使用不同的时间戳加载df DataFrame。tsSpecified由用户指定。HBaseTableCatalog定义HBase和Relation关系模式。writeCatalog定义模式映射的目录。

```java
val df = sqlContext.read
      .options(Map(HBaseTableCatalog.tableCatalog -> writeCatalog, HBaseSparkConf.TIMESTAMP -> tsSpecified.toString))
      .format("org.apache.hadoop.hbase.spark")
      .load()
```

下面的示例显示了如何加载具有不同时间范围的df DataFrame。oldMs由用户指定。

```java
val df = sqlContext.read
      .options(Map(HBaseTableCatalog.tableCatalog -> writeCatalog, HBaseSparkConf.MIN_TIMESTAMP -> "0",
        HBaseSparkConf.MAX_TIMESTAMP -> oldMs.toString))
      .format("org.apache.hadoop.hbase.spark")
      .load()
```

加载df DataFrame后，用户可以查询数据。

```java
df.registerTempTable("table")
sqlContext.sql("select count(col1) from table").show
```

**示例-本地Avro支持**

HBase-Spark Connector支持不同的数据格式，如Avro，Jason等。下面的用例显示了spark是如何支持Avro的。用户可以直接将Avro记录保存到HBase中。在内部，Avro模式自动转换为本机Spark Catalyst数据类型。请注意，HBase表中的两个键值部分都可以用Avro格式定义。

1）定义模式映射的目录：

```java
def catalog = s"""{
                     |"table":{"namespace":"default", "name":"Avrotable"},
                      |"rowkey":"key",
                      |"columns":{
                      |"col0":{"cf":"rowkey", "col":"key", "type":"string"},
                      |"col1":{"cf":"cf1", "col":"col1", "type":"binary"}
                      |}
                      |}""".stripMargin
```

catalog是名为Avrotable的HBase表的模式。行键作为键和一列col1。还必须将rowkey详细定义为column (col0)，该列具有特定的cf（rowkey）。

2）准备数据：

```java
object AvroHBaseRecord {
   val schemaString =
     s"""{"namespace": "example.avro",
         |   "type": "record",      "name": "User",
         |    "fields": [
         |        {"name": "name", "type": "string"},
         |        {"name": "favorite_number",  "type": ["int", "null"]},
         |        {"name": "favorite_color", "type": ["string", "null"]},
         |        {"name": "favorite_array", "type": {"type": "array", "items": "string"}},
         |        {"name": "favorite_map", "type": {"type": "map", "values": "int"}}
         |      ]    }""".stripMargin
   val avroSchema: Schema = {
     val p = new Schema.Parser
     p.parse(schemaString)
   }
   def apply(i: Int): AvroHBaseRecord = {
     val user = new GenericData.Record(avroSchema);
     user.put("name", s"name${"%03d".format(i)}")
     user.put("favorite_number", i)
     user.put("favorite_color", s"color${"%03d".format(i)}")
     val favoriteArray = new GenericData.Array[String](2, avroSchema.getField("favorite_array").schema())
     favoriteArray.add(s"number${i}")
     favoriteArray.add(s"number${i+1}")
     user.put("favorite_array", favoriteArray)
     import collection.JavaConverters._
     val favoriteMap = Map[String, Int](("key1" -> i), ("key2" -> (i+1))).asJava
     user.put("favorite_map", favoriteMap)
     val avroByte = AvroSedes.serialize(user, avroSchema)
     AvroHBaseRecord(s"name${"%03d".format(i)}", avroByte)
   }
 }
 val data = (0 to 255).map { i =>
    AvroHBaseRecord(i)
 }
```

首先定义schemaString，然后解析得到avroSchema。avroSchema用于生成AvroHBaseRecord。用户准备的data是一个包含256个AvroHBaseRecord对象的本地Scala集合。

3）保存DataFrame：

```java
 sc.parallelize(data).toDF.write.options(
     Map(HBaseTableCatalog.tableCatalog -> catalog, HBaseTableCatalog.newTable -> "5"))
     .format("org.apache.spark.sql.execution.datasources.hbase")
     .save()
```

给定具有指定模式的数据框catalog，上面将创建一个包含5个区域的HBase表，并将数据框保存在其中。

4）加载DataFrame

```java
def avroCatalog = s"""{
            |"table":{"namespace":"default", "name":"avrotable"},
            |"rowkey":"key",
            |"columns":{
              |"col0":{"cf":"rowkey", "col":"key", "type":"string"},
              |"col1":{"cf":"cf1", "col":"col1", "avro":"avroSchema"}
            |}
          |}""".stripMargin
 def withCatalog(cat: String): DataFrame = {
     sqlContext
         .read
         .options(Map("avroSchema" -> AvroHBaseRecord.schemaString, HBaseTableCatalog.tableCatalog -> avroCatalog))
         .format("org.apache.spark.sql.execution.datasources.hbase")
         .load()
 }
 val df = withCatalog(catalog)
```

在withCatalog函数中，read返回一个DataFrameReader，可用于以DataFrame的形式读取数据。该option函数将基础数据源的输入选项添加到DataFrameReader。有两个选项：一个是设置avroSchema为AvroHBaseRecord.schemaString，一个是设置HBaseTableCatalog.tableCatalog为avroCatalog。该load()函数将输入作为DataFrame加载。withCatalog函数返回的日期框df可用于访问HBase表。

5）SQL查询：

```java
 df.registerTempTable("avrotable")
 val c = sqlContext.sql("select count(1) from avrotable").
```

加载df DataFrame后，用户可以查询数据。registerTempTable使用表名avrotable将df DataFrame注册为临时表。sqlContext.sql函数允许用户执行SQL查询。
