# 39、Flink深入：Flink之TableAPI和FlinkSQL的API调用（下）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/39.html
- 分类：大数据框架
- 分组：教程目录
## 1. 输出表数据到文件

```java
// 注册输出表
tableEnv
	.connect(
  		new FileSystem().path("…\\resources\\out.txt")
	) 	// 定义到文件系统的连接
  	.withFormat(new Csv()) 	// 定义格式化方法，Csv格式
  	.withSchema(
  		new Schema()
  			.field("id", DataTypes.STRING())
  			.field("temp", DataTypes.DOUBLE())
	) 	// 定义表结构
  	.createTemporaryTable("outputTable") // 创建临时表
resultSqlTable.insertInto("outputTable")
```

## 2. 输出表数据到Kafka

除了输出到文件，也可以输出到Kafka。我们可以结合前面Kafka作为输入数据，构建数据管道，kafka进，kafka出。代码如下：

```java
// 输出到 kafka
tableEnv.connect(
  new Kafka()
    .version("0.11")
    .topic("sinkTest")
    .property("zookeeper.connect", "localhost:2181")
    .property("bootstrap.servers", "localhost:9092")
)
  .withFormat( new Csv() )
  .withSchema( new Schema()
    .field("id", DataTypes.STRING())
    .field("temp", DataTypes.DOUBLE())
  )
  .createTemporaryTable("kafkaOutputTable")
resultTable.insertInto("kafkaOutputTable")
```

## 3. 输出表数据到Elasticsearch

ElasticSearch的connector可以在upsert（update+insert，更新插入）模式下操作，这样就可以使用Query定义的键（key）与外部系统交换UPSERT/DELETE消息。

另外，对于“仅追加”（append-only）的查询，connector还可以在append 模式下操作，这样就可以与外部系统只交换insert消息。

es目前支持的数据格式，只有Json，而flink本身并没有对应的支持，所以还需要引入依赖：

```xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-json</artifactId>
    <version>1.10.0</version>
</dependency>
```

代码实现如下：

```java
// 输出到es
tableEnv.connect(
  new Elasticsearch()
    .version("6")
    .host("localhost", 9200, "http")
    .index("sensor")
    .documentType("temp")
)
  .inUpsertMode()           // 指定是 Upsert 模式
  .withFormat(new Json())
  .withSchema( new Schema()
    .field("id", DataTypes.STRING())
    .field("count", DataTypes.BIGINT())
  )
  .createTemporaryTable("esOutputTable")
aggResultTable.insertInto("esOutputTable")
```

## 4. 输出表数据到MySQL

Flink专门为Table API的jdbc连接提供了flink-jdbc连接器，我们需要先引入依赖：

```xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-jdbc_2.11</artifactId>
    <version>1.10.0</version>
</dependency>
```

jdbc连接的代码实现比较特殊，因为没有对应的java/scala类实现ConnectorDescriptor，所以不能直接tableEnv.connect()。不过Flink SQL留下了执行DDL的接口：tableEnv.sqlUpdate()。

对于jdbc的创建表操作，天生就适合直接写DDL来实现，所以我们的代码可以这样写：

```java
// 输出到 Mysql
val sinkDDL: String =
  """
    |create table jdbcOutputTable (
    |  id varchar(20) not null,
    |  cnt bigint not null
    |) with (
    |  'connector.type' = 'jdbc',
    |  'connector.url' = 'jdbc:mysql://localhost:3306/test',
    |  'connector.table' = 'sensor_count',
    |  'connector.driver' = 'com.mysql.jdbc.Driver',
    |  'connector.username' = 'root',
    |  'connector.password' = '123456'
    |)
  """.stripMargin
tableEnv.sqlUpdate(sinkDDL)
aggResultSqlTable.insertInto("jdbcOutputTable")
```

## 5. 输出表数据到各种更新模式

在流处理过程中，表的处理并不像传统定义的那样简单。

对于流式查询（Streaming Queries），需要声明如何在（动态）表和外部连接器之间执行转换。与外部系统交换的消息类型，由**更新模式**update mode）指定。

Flink Table API中的更新模式有以下三种：

## 5.1. 追加模式（Append Mode

在追加模式下，表（动态表）和外部连接器只交换插入（Insert）消息。

## 5.2. 撤回模式（Retract Mode

在撤回模式下，表和外部连接器交换的是：添加（Add）和撤回（Retract）消息。

**1、** 插入（Insert）会被编码为添加消息；

**2、** 删除（Delete）则编码为撤回消息；

**3、** 更新（Update）则会编码为，已更新行（上一行）的撤回消息，和更新行（新行）的添加消息；

在此模式下，不能定义key，这一点跟upsert模式完全不同。

## 5.3. Upsert（更新插入）模式

在Upsert模式下，动态表和外部连接器交换Upsert和Delete消息。

这个模式需要一个唯一的key，通过这个key可以传递更新消息。为了正确应用消息，外部连接器需要知道这个唯一key的属性。

**1、** 插入（Insert）和更新（Update）都被编码为Upsert消息；

**2、** 删除（Delete）编码为Delete信息；

这种模式和Retract模式的主要区别在于，Update操作是用单个消息编码的，所以效率会更高。

## 6. 将表转换成DataStream

表可以转换为DataStream或DataSet。这样，自定义流处理或批处理程序就可以继续在 Table API或SQL查询的结果上运行了。

将表转换为DataStream或DataSet时，需要指定生成的数据类型，即要将表的每一行转换成的数据类型。通常，最方便的转换类型就是Row。当然，因为结果的所有字段类型都是明确的，我们也经常会用元组类型来表示。

表作为流式查询的结果，是动态更新的。所以，将这种动态查询转换成的数据流，同样需要对表的更新操作进行编码，进而有不同的转换模式。

Table API中表到DataStream有两种模式：

**1、** 追加模式（AppendMode）：用于表只会被插入（Insert）操作更改的场景；

**2、** 撤回模式（RetractMode）：用于任何场景有些类似于更新模式中Retract模式，它只有Insert和Delete两类操作；

得到的数据会增加一个Boolean类型的标识位（返回的第一个字段），用它来表示到底是新增的数据（Insert），还是被删除的数据（老数据， Delete）。

代码实现如下：

```java
val resultStream: DataStream[Row] = tableEnv.toAppendStream[Row](resultTable)
val aggResultStream: DataStream[(Boolean, (String, Long))] = 
tableEnv.toRetractStream[(String, Long)](aggResultTable)
resultStream.print("result")
aggResultStream.print("aggResult")
```

所以，没有经过groupby之类聚合操作，可以直接用 toAppendStream 来转换；而如果经过了聚合，有更新操作，一般就必须用 toRetractDstream。

## 7. Query的解释和执行

Table API提供了一种机制来解释（Explain）计算表的逻辑和优化查询计划。这是通过TableEnvironment.explain（table）方法或TableEnvironment.explain（）方法完成的。

explain方法会返回一个字符串，描述三个计划：

**1、** 未优化的逻辑查询计划；

**2、** 优化后的逻辑查询计划；

**3、** 实际执行计划；

我们可以在代码中查看执行计划：

```java
val explaination: String = tableEnv.explain(resultTable)
println(explaination)
```

Query的解释和执行过程，老planner和blink planner大体是一致的，又有所不同。整体来讲，Query都会表示成一个逻辑查询计划，然后分两步解释：

**1、** 优化查询计划；

**2、** 解释成DataStream或者DataSet程序；

而Blink版本是批流统一的，所以所有的Query，只会被解释成DataStream程序；另外在批处理环境TableEnvironment下，Blink版本要到tableEnv.execute()执行调用才开始解释。
