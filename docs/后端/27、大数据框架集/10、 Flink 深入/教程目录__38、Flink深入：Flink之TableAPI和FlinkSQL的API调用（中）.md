# 38、Flink深入：Flink之TableAPI和FlinkSQL的API调用（中）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/38.html
- 分类：大数据框架
- 分组：教程目录
## 1. 表的查询

利用外部系统的连接器connector，我们可以读写数据，并在环境的Catalog中注册表。接下来就可以对表做查询转换了。

Flink给我们提供了两种查询方式：Table API和 SQL。

## 1.1. Table API 的调用

官方网站：[Apache Flink 1.12 Documentation: Table API](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/table/tableApi.html)

Table API是集成在Scala和Java语言内的查询API。与SQL不同，Table API的查询不会用字符串表示，而是在宿主语言中一步一步调用完成的。

Table API基于代表一张“表”的Table类，并提供一整套操作处理的方法API。这些方法会返回一个新的Table对象，这个对象就表示对输入表应用转换操作的结果。有些关系型转换操作，可以由多个方法调用组成，构成链式调用结构。例如table.select(…).filter(…)，其中select（…）表示选择表中指定的字段，filter(…)表示筛选条件。

Scala 代码中的实现如下：

```java
val sensorTable: Table = tableEnv.from("inputTable")
val resultTable: Table = senorTable
    .select("id, temperature")
    .filter("id ='sensor_1'")
```

Java 代码中的实现如下：

```java
// get a TableEnvironment
TableEnvironment tableEnv = ...; // see "Create a TableEnvironment" section
// register Orders table
// scan registered Orders table
Table orders = tableEnv.from("Orders");// compute revenue for all customers from France
Table revenue = orders
  	.filter($("cCountry")
	.isEqual("FRANCE"))
  	.groupBy($("cID"), $("cName")
  	.select($("cID"), $("cName"), $("revenue")
	.sum()
	.as("revSum"));
// emit or convert Table
// execute query
```

## 1.2. SQL 查询

官方网址：[Apache Flink 1.12 Documentation: SQL](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/table/sql/)

Flink的SQL集成，基于的是ApacheCalcite，它实现了SQL标准。在Flink中，用常规字符串来定义SQL查询语句。SQL 查询的结果，是一个新的 Table。

代码实现如下：

```java
val resultSqlTable: Table = tableEnv.sqlQuery("select id, temperature from inputTable where id ='sensor_1'")
```

或者：

```java
val resultSqlTable: Table = tableEnv.sqlQuery(
  """
    |select id, temperature
    |from inputTable
    |where id = 'sensor_1'
  """.stripMargin)
```

再或者：

```java
// get a TableEnvironment
TableEnvironment tableEnv = ...; // see "Create a TableEnvironment" section
// register Orders table
// compute revenue for all customers from France
Table revenue = tableEnv.sqlQuery(
    "SELECT cID, cName, SUM(revenue) AS revSum " +
    "FROM Orders " +
    "WHERE cCountry = 'FRANCE' " +
    "GROUP BY cID, cName"
  );
// emit or convert Table
// execute query
// ============================================================================
// get a TableEnvironment
TableEnvironment tableEnv = ...; // see "Create a TableEnvironment" section
// register "Orders" table
// register "RevenueFrance" output table
// compute revenue for all customers from France and emit to "RevenueFrance"
tableEnv.executeSql(
    "INSERT INTO RevenueFrance " +
    "SELECT cID, cName, SUM(revenue) AS revSum " +
    "FROM Orders " +
    "WHERE cCountry = 'FRANCE' " +
    "GROUP BY cID, cName"
  );
```

当然，也可以加上聚合操作，比如我们统计每个sensor温度数据出现的个数，做个count统计：

```java
// TableAPI的实现
val aggResultTable = sensorTable
    .groupBy('id)
    .select('id, 'id.count as 'count)
// FlinkSQL的实现
val aggResultSqlTable = tableEnv.sqlQuery("select id, count(id) as cnt from inputTable group by id")
```

这里Table API里指定的字段，前面加了一个单引号’，这是Table API中定义的Expression类型的写法，可以很方便地表示一个表中的字段。

字段可以直接全部用双引号引起来，也可以用半边单引号+字段名的方式。以后的代码中，一般都用后一种形式。

## 2. 将DataStream转换成表

Flink允许我们把Table和DataStream做转换：我们可以基于一个DataStream，先流式地读取数据源，然后map成样例类，再把它转成Table。Table的列字段（column fields），就是样例类里的字段，这样就不用再麻烦地定义schema了。

## 2.1. 代码表达

代码中实现非常简单，直接用tableEnv.fromDataStream()就可以了。默认转换后的 Table schema 和 DataStream 中的字段定义一一对应，也可以单独指定出来。

这就允许我们更换字段的顺序、重命名，或者只选取某些字段出来，相当于做了一次map操作（或者Table API的 select操作）。

代码具体如下：

```java
val inputStream: DataStream[String] = env.readTextFile("sensor.txt")
val dataStream: DataStream[SensorReading] = inputStream
  .map(data => {
    val dataArray = data.split(",")
    SensorReading(dataArray(0), dataArray(1).toLong, dataArray(2).toDouble)
  })
val sensorTable: Table = tableEnv.fromDataStream(dataStream)
val sensorTable2 = tableEnv.fromDataStream(dataStream, 'id, 'timestamp as 'ts)
```

## 2.2. 数据类型与 Table schema的对应

在上节的例子中，DataStream 中的数据类型，与表的 Schema 之间的对应关系，是按照样例类中的字段名来对应的（name-based mapping），所以还可以用as做重命名。

另外一种对应方式是，直接按照字段的位置来对应（position-based mapping），对应的过程中，就可以直接指定新的字段名了。

```java
// 基于名称的对应：
val sensorTable = tableEnv.fromDataStream(dataStream, 'timestamp as 'ts, 'id as 'myId, 'temperature)
// 基于位置的对应：
val sensorTable = tableEnv.fromDataStream(dataStream, 'myId, 'ts)
```

Flink的DataStream和 DataSet API支持多种类型。

组合类型，比如元组（内置Scala和Java元组）、POJO、Scala case类和Flink的Row类型等，允许具有多个字段的嵌套数据结构，这些字段可以在Table的表达式中访问。其他类型，则被视为原子类型。

元组类型和原子类型，一般用位置对应会好一些；如果非要用名称对应，也是可以的：元组类型，默认的名称是 “_1”, “_2”；而原子类型，默认名称是 ”f0”。

## 3. 将DataSet转换成表

```java
// 获取DataSet，并指定为Row类型
DataSet<Row> trainData = env
        .readTextFile(path)
        .map(new RichMapFunction<String, Row>() {
            @Override
            public Row map(String value) throws Exception {
                JSONObject json = JSONObject.parseObject(value);
                Row row = new Row(4);
                row.setField(0, json.getLongValue("user_id"));
                row.setField(1, json.getLongValue("stall_id"));
                row.setField(2, json.getDoubleValue("score"));
                row.setField(3, json.getLongValue("stall_classify"));
                return row;
            }
        })
        .returns(new RowTypeInfo(
                BasicTypeInfo.LONG_TYPE_INFO,
                BasicTypeInfo.LONG_TYPE_INFO,
                BasicTypeInfo.DOUBLE_TYPE_INFO,
                BasicTypeInfo.LONG_TYPE_INFO
        ));
// 将DataSet转换成表，方式一
Table trainTable_1 = tableEnv.fromDataSet(trainData, "user_id, stall_id, score, stall_classify");
// 将DataSet转换成表，方式二（在Alink中使用，DataSetConversionUtil为Alink中的工具类）
Table trainTable_2 = DataSetConversionUtil.toTable(
        envId,
        trainData,
        new String[]{"user_id, stall_id, score, stall_classify"}
);
```

## 4. 与DataSet/DataStream的集成总结

官方网址：[Apache Flink 1.12 Documentation: Concepts & Common API](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/table/common.html#integration-with-datastream-and-dataset-api)

从DataStream 或者 DataSet 中创建一个视图：

```java
// get StreamTableEnvironment
// registration of a DataSet in a BatchTableEnvironment is equivalent
StreamTableEnvironment tableEnv = ...; 
// see "Create a TableEnvironment" section
DataStream<Tuple2<Long, String>> stream = ...
// register the DataStream as View "myTable" with fields "f0", "f1"
tableEnv.createTemporaryView("myTable", stream);
// register the DataStream as View "myTable2" with fields "myLong", "myString"
tableEnv.createTemporaryView("myTable2", stream, $("myLong"), $("myString"));
```

从DataStream 或者 DataSet 中创建一个表：

```java
// get StreamTableEnvironment// registration of a DataSet in a BatchTableEnvironment is equivalent
StreamTableEnvironment tableEnv = ...; 
// see "Create a TableEnvironment" section
DataStream<Tuple2<Long, String>> stream = ...
// Convert the DataStream into a Table with default fields "f0", "f1"
Table table1 = tableEnv.fromDataStream(stream);
// Convert the DataStream into a Table with fields "myLong", "myString"
Table table2 = tableEnv.fromDataStream(stream, $("myLong"), $("myString"));
```

将表的数据，转换成 DataStream 或者 DataSet ：

> Append Mode: This mode can only be used if the dynamic Table is only modified by INSERT changes, i.e, it is append-only and previously emitted results are never updated.
> 追加模式：只有当动态表仅通过插入更改进行修改时，才能使用此模式，即，它是仅追加模式，并且以前发出的结果从不更新。
> Retract Mode: This mode can always be used. It encodes INSERT and DELETE changes with a boolean flag.
> 撤回模式：此模式始终可用。它使用布尔标志对插入和删除更改进行编码。

```java
// 转换为DataStream
// get StreamTableEnvironment. 
StreamTableEnvironment tableEnv = ...; // see "Create a TableEnvironment" section
// Table with two fields (String name, Integer age)
Table table = ...
// convert the Table into an append DataStream of Row by specifying the class
DataStream<Row> dsRow = tableEnv.toAppendStream(table, Row.class);
// convert the Table into an append DataStream of Tuple2<String, Integer>
 //   via a TypeInformation
TupleTypeInfo<Tuple2<String, Integer>> tupleType = new TupleTypeInfo<>(
  Types.STRING(),
  Types.INT());
DataStream<Tuple2<String, Integer>> dsTuple = 
  tableEnv.toAppendStream(table, tupleType);
// convert the Table into a retract DataStream of Row.
//   A retract stream of type X is a DataStream<Tuple2<Boolean, X>>. 
//   The boolean field indicates the type of the change. 
//   True is INSERT, false is DELETE.
DataStream<Tuple2<Boolean, Row>> retractStream = 
  tableEnv.toRetractStream(table, Row.class);
```

```java
// 转换为DataSet
// get BatchTableEnvironment
BatchTableEnvironment tableEnv = BatchTableEnvironment.create(env);
// Table with two fields (String name, Integer age)
Table table = ...
// convert the Table into a DataSet of Row by specifying a class
DataSet<Row> dsRow = tableEnv.toDataSet(table, Row.class);
// convert the Table into a DataSet of Tuple2<String, Integer> via a TypeInformationTupleTypeInfo<Tuple2<String, Integer>> tupleType = new TupleTypeInfo<>(
  Types.STRING(),
  Types.INT());
DataSet<Tuple2<String, Integer>> dsTuple = 
  tableEnv.toDataSet(table, tupleType);
```

## 5. 创建临时视图（Temporary View）

创建临时视图的第一种方式，就是直接从DataStream转换而来。同样，可以直接对应字段转换；也可以在转换的时候，指定相应的字段。

代码如下：

```java
tableEnv.createTemporaryView("sensorView", dataStream)
tableEnv.createTemporaryView("sensorView", dataStream, 'id, 'temperature, 'timestamp as 'ts)
```

另外，当然还可以基于Table创建视图：

```java
tableEnv.createTemporaryView("sensorView", sensorTable)
```

View和Table的Schema完全相同。事实上，在Table API中，可以认为View和Table是等价的。
