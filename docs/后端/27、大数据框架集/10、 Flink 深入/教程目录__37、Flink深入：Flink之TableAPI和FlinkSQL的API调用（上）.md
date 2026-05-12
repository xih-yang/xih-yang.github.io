# 37、Flink深入：Flink之TableAPI和FlinkSQL的API调用（上）
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/37.html
- 分类：大数据框架
- 分组：教程目录
## 1. 依赖说明

官网地址：[Apache Flink 1.12 Documentation: Table API & SQL](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/table/)

```xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-table-api-scala-bridge_2.12</artifactId>
    <version>${flink.version}</version>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-table-api-java-bridge_2.12</artifactId>
    <version>${flink.version}</version>
    <scope>provided</scope>
</dependency>
<!-- flink执行计划,这是1.9版本之前的-->
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-table-planner_2.12</artifactId>
    <version>${flink.version}</version>
</dependency>
<!-- blink执行计划,1.11+默认的-->
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-table-planner-blink_2.12</artifactId>
    <version>${flink.version}</version>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-table-common</artifactId>
    <version>${flink.version}</version>
    <scope>provided</scope>
</dependency>
```

> flink-table-common：这个包中主要是包含 Flink Planner 和 Blink Planner一些共用的代码。
> flink-table-api-java：这部分是用户编程使用的 API，包含了大部分的 API。
> flink-table-api-scala：这里只是非常薄的一层，仅和 Table API 的 Expression 和 DSL 相关。
> 两个 Planner：flink-table-planner 和 flink-table-planner-blink。
> 两个 Bridge：flink-table-api-scala-bridge 和 flink-table-api-java-bridge，
>
> Flink Planner 和 Blink Planner 都会依赖于具体的 JavaAPI，也会依赖于具体的 Bridge，通过 Bridge 可以将 API 操作相应的转化为Scala 的 DataStream、DataSet，或者转化为 JAVA 的 DataStream 或者Data Set。
>
> flink-table-planner：planner计划器，是table API最主要的部分，提供了运行时环境和生成程序执行计划的planner。
>
> flink-table-api-scala-bridge：bridge桥接器，主要负责table API和 DataStream/DataSet API的连接支持，按照语言分java和scala。
>
> 这里的两个依赖，是IDE环境下运行需要添加的；如果是生产环境，lib目录下默认已经有了planner，就只需要有bridge就可以了。
>
> 当然，如果想使用用户自定义函数，或是跟kafka做连接，需要有一个SQL client，这个包含在flink-table-common里。

## 2. 程序结构

官网地址：[Apache Flink 1.12 Documentation: Concepts & Common API](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/table/common.html#structure-of-table-api-and-sql-programs)

Table API 和 SQL 的程序结构，与流式处理的程序结构类似；也可以近似地认为有这么几步：首先创建执行环境，然后定义source、transform和sink。

```java
val tableEnv = ...     // 创建表的执行环境
// 创建一张表，用于读取数据
tableEnv.connect(...).createTemporaryTable("inputTable")
// 注册一张表，用于把计算结果输出
tableEnv.connect(...).createTemporaryTable("outputTable")
// 通过 Table API 查询算子，得到一张结果表
val result = tableEnv.from("inputTable").select(...)
// 通过 SQL查询语句，得到一张结果表
val sqlResult  = tableEnv.sqlQuery("SELECT ... FROM inputTable ...")
// 将结果表写入输出表中
result.insertInto("outputTable")
```

## 3. 创建表环境

创建表环境最简单的方式，就是基于流处理执行环境，调create方法直接创建：

```java
val tableEnv = StreamTableEnvironment.create(env)
```

表环境（TableEnvironment）是flink中集成Table API & SQL的核心概念。它负责:

> 注册catalog
> 在内部 catalog 中注册表
> 执行 SQL 查询
> 注册用户自定义函数
> 将 DataStream 或 DataSet 转换为表
> 保存对 ExecutionEnvironment 或 StreamExecutionEnvironment 的引用

在创建TableEnv的时候，可以多传入一个EnvironmentSettings或者TableConfig参数，可以用来配置 TableEnvironment的一些特性。

比如，配置老版本的流式查询（Flink-Streaming-Query）：

```java
val settings = EnvironmentSettings.newInstance()
      .useOldPlanner()      // 使用老版本planner
      .inStreamingMode()    // 流处理模式
      .build()
val tableEnv = StreamTableEnvironment.create(env, settings)
```

基于老版本的批处理环境（Flink-Batch-Query）：

```java
val batchEnv = ExecutionEnvironment.getExecutionEnvironment
val batchTableEnv = BatchTableEnvironment.create(batchEnv)
```

基于blink版本的流处理环境（Blink-Streaming-Query）：

```java
val bsSettings = EnvironmentSettings.newInstance()
    .useBlinkPlanner()
    .inStreamingMode().build()
val bsTableEnv = StreamTableEnvironment.create(env, bsSettings)
```

基于blink版本的批处理环境（Blink-Batch-Query）：

```java
val bbSettings = EnvironmentSettings.newInstance()
    .useBlinkPlanner()
    .inBatchMode().build()
val bbTableEnv = TableEnvironment.create(bbSettings)
```

## 4. 在Catalog中注册表

## 4.1. 表（Table）的概念

TableEnvironment可以注册目录Catalog，并可以基于Catalog注册表。它会维护一个Catalog-Table表之间的map。

表（Table）是由一个“标识符”来指定的，由3部分组成：Catalog名、数据库（database）名和对象名（表名）。如果没有指定目录或数据库，就使用当前的默认值。

表可以是常规的（Table，表），或者虚拟的（View，视图）。常规表（Table）一般可以用来描述外部数据，比如文件、数据库表或消息队列的数据，也可以直接从 DataStream转换而来。视图可以从现有的表中创建，通常是table API或者SQL查询的一个结果。

## 4.2. 连接到文件系统（Csv格式

连接外部系统在Catalog中注册表，直接调用tableEnv.connect()就可以，里面参数要传入一个ConnectorDescriptor，也就是connector描述器。对于文件系统的connector而言，flink内部已经提供了，就叫做FileSystem()。

代码如下：

```java
tableEnv
	.connect( new FileSystem().path("sensor.txt"))  	// 定义表数据来源，外部连接
	.withFormat(new OldCsv())    						// 定义从外部系统读取数据之后的格式化方法
  	.withSchema( new Schema()
    	.field("id", DataTypes.STRING())
    	.field("timestamp", DataTypes.BIGINT())
    	.field("temperature", DataTypes.DOUBLE())
  	)    												// 定义表结构
  	.createTemporaryTable("inputTable")    				// 创建临时表
```

这是旧版本的csv格式描述器。由于它是非标的，跟外部系统对接并不通用，所以将被弃用，以后会被一个符合RFC-4180标准的新format描述器取代。新的描述器就叫Csv()，但flink没有直接提供，需要引入依赖flink-csv：

```xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-csv</artifactId>
    <version>1.10.0</version>
</dependency>
```

代码非常类似，只需要把withFormat里的OldCsv改成Csv就可以了。

## 4.3. 连接到Kafka

kafka的连接器flink-kafka-connector中，1.10版本的已经提供了Table API的支持。我们可以在 connect方法中直接传入一个叫做Kafka的类，这就是kafka连接器的描述器ConnectorDescriptor。

```java
tableEnv
	.connect(
		new Kafka()
			.version("0.11") // 定义kafka的版本
			.topic("sensor") // 定义主题
			.property("zookeeper.connect", "localhost:2181") 
			.property("bootstrap.servers", "localhost:9092")
	)
  	.withFormat(new Csv())
  	.withSchema(
  		new Schema()
		  	.field("id", DataTypes.STRING())
		  	.field("timestamp", DataTypes.BIGINT())
		  	.field("temperature", DataTypes.DOUBLE())
	)
  	.createTemporaryTable("kafkaInputTable")
```

当然也可以连接到ElasticSearch、MySql、HBase、Hive等外部系统，实现方式基本上是类似的。
