# 30、Flink 基础 - Table API和Flink SQL之API调用
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/30.html
- 分类：大数据框架
- 分组：教程目录
## 一、基本程序结构

Table API和SQL的程序结构，与流式处理的程序结构十分类似；

也可以近似的认为有这么几步:

首先创建执行环境，然后定义source、transform、sink。

具体操作流程如下:

```java
StreamTableEnvironment tableEnv = ... // 创建表的执行环境
// 创建一张表，用于读取数据
tableEnv.connect(...).createTemporaryTable("inputTable");
// 注册一张表，用于把计算结果输出
tableEnv.connect(...).createTemporaryTable("outputTable");
// 通过 Table API 查询算子，得到一张结果表
Table result = tableEnv.from("inputTable").select(...);
// 通过SQL查询语句，得到一张结果表
Table sqlResult = tableEnv.sqlQuery("SELECT ... FROM inputTable ...");
// 将结果表写入输出表中
result.insertInto("outputTable");
```

## 二、创建表环境

创建表环境最简单的方式，就是基于流处理执行环境调 create方法直接创建：

```java
StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
```

表环境（TableEnvironment）是 flink 中集成 Table API & SQL 的核心概念。它负责:

**1、** 注册catalog；

**2、** 在内部catalog中注册表；

**3、** 执行SQL查询；

**4、** 注册用户自定义函数；

**5、** 将DataStream或DataSet转换为表；

**6、** 保存对ExecutionEnvironment或StreamExecutionEnvironment的引用；

在创建TableEnv 的时候，可以多传入一个 EnvironmentSettings 或者 TableConfig 参数， 可以用来配置 TableEnvironment 的一些特性。

比如，配置老版本的流式查询（Flink-Streaming-Query）：

```java
EnvironmentSettings settings = EnvironmentSettings.newInstance()
.useOldPlanner() // 使用老版本planner 
.inStreamingMode() // 流处理模式 
.build(); 
StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env, settings);
```

基于老版本的批处理环境（Flink-Batch-Query）：

```java
ExecutionEnvironment batchEnv = ExecutionEnvironment.getExecutionEnvironment;
BatchTableEnvironment batchTableEnv = BatchTableEnvironment.create(batchEnv);
```

基于blink 版本的流处理环境（Blink-Streaming-Query）：

```java
EnvironmentSettings bsSettings = EnvironmentSettings.newInstance()
.useBlinkPlanner()
.inStreamingMode().build();
StreamTableEnvironment bsTableEnv = StreamTableEnvironment.create(env, bsSettings);
```

基于blink 版本的批处理环境（Blink-Batch-Query）：

```java
EnvironmentSettings bbSettings = EnvironmentSettings.newInstance()
.useBlinkPlanner()
.inBatchMode().build();
TableEnvironment bbTableEnv = TableEnvironment.create(bbSettings);
```

## 三、在 Catalog 中注册表

## 3.1 表（Table）的概念

TableEnvironment 可以注册目录 Catalog，并可以基于 Catalog 注册表。它会维护一个Catalog-Table 表之间的 map。

表（Table）是由一个“标识符”来指定的，由 3 部分组成：Catalog 名、数据库（database） 名和对象名（表名）。如果没有指定目录或数据库，就使用当前的默认值。

表可以是常规的（Table，表），或者虚拟的（View，视图）。常规表（Table）一般可以 用来描述外部数据，比如文件、数据库表或消息队列的数据，也可以直接从 DataStream 转 换而来。视图可以从现有的表中创建，通常是 table API 或者 SQL 查询的一个结果。

## 3.2 连接到文件系统（Csv 格式）

连接外部系统在 Catalog 中注册表，直接调用 tableEnv.connect()就可以，里面参数要传 入一个 ConnectorDescriptor，也就是 connector 描述器。对于文件系统的 connector 而言，flink 内部已经提供了，就叫做 FileSystem()。

代码如下:

```java
tableEnv 
.connect( new FileSystem().path("sensor.txt")) // 定义表数据来源，外部连接 
.withFormat(new OldCsv()) // 定义从外部系统读取数据之后的格式化方法
.withSchema( new Schema() 
.field("id", DataTypes.STRING()) 
.field("timestamp", DataTypes.BIGINT()) 
.field("temperature", DataTypes.DOUBLE()) ) // 定义表结构 
.createTemporaryTable("inputTable"); // 创建临时表
```

这是旧版本的 csv 格式描述器。由于它是非标的，跟外部系统对接并不通用，所以将被 弃用，以后会被一个符合 RFC-4180 标准的新 format 描述器取代。新的描述器就叫 Csv()，但 flink 没有直接提供，需要引入依赖 flink-csv：

```xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-csv</artifactId>
    <version>1.9.0</version>
</dependency>
```

代码非常类似，只需要把 withFormat 里的 OldCsv 改成 Csv 就可以了。

## 3.3 连接到 Kafka

kafka 的连接器 flink-kafka-connector 中，1.9 版本的已经提供了 Table API 的支持。我们 可以在 connect 方法中直接传入一个叫做 Kafka 的类，这就是 kafka 连接器的描述器 ConnectorDescriptor。

```java
tableEnv.connect(
new Kafka()
.version("0.11") // 定义 kafka 的版本
.topic("sensor") // 定义主题
.property("zookeeper.connect", "localhost:2181")
.property("bootstrap.servers", "localhost:9092")
)
.withFormat(new Csv())
.withSchema(new Schema()
.field("id", DataTypes.STRING())
.field("timestamp", DataTypes.BIGINT())
.field("temperature", DataTypes.DOUBLE())
)
.createTemporaryTable("kafkaInputTable");
```

当然也可以连接到 ElasticSearch、MySql、HBase、Hive 等外部系统，实现方式基本上是 类似的。

## 四、 表的查询

利用外部系统的连接器 connector，我们可以读写数据，并在环境的 Catalog 中注册表。 接下来就可以对表做查询转换了。

Flink 给我们提供了两种查询方式：Table API 和 SQL。

## 4.1 Table API 的调用

Table API 是集成在 Scala 和 Java 语言内的查询 API。与 SQL 不同，Table API 的查询不会 用字符串表示，而是在宿主语言中一步一步调用完成的。

Table API 基于代表一张“表”的 Table 类，并提供一整套操作处理的方法 API。这些方 法会返回一个新的 Table 对象，这个对象就表示对输入表应用转换操作的结果。有些关系型 转换操作，可以由多个方法调用组成，构成链式调用结构。例如 table.select(…).filter(…)，其 中 select（…）表示选择表中指定的字段，filter(…)表示筛选条件。

代码中的实现如下：

```java
Table sensorTable = tableEnv.from("inputTable");
Table resultTable = senorTable
.select("id, temperature")
.filter("id ='sensor_1'");
```

## 4.2 SQL 查询

Flink 的 SQL 集成，基于的是 ApacheCalcite，它实现了 SQL 标准。在 Flink 中，用常规字 符串来定义 SQL 查询语句。SQL 查询的结果，是一个新的 Table。

代码实现如下：

```java
Table resultSqlTable = tableEnv.sqlQuery("select id, temperature from
inputTable where id ='sensor_1'");
```

当然，也可以加上聚合操作，比如我们统计每个 sensor 温度数据出现的个数，做个 count统计：

```java
Table aggResultTable = sensorTable
.groupBy("id")
.select("id, id.count as count");
```

SQL的实现：

```java
Table aggResultSqlTable = tableEnv.sqlQuery("select id, count(id) as cnt from
inputTable group by id");
```

这里Table API 里指定的字段，前面加了一个单引号’，这是 Table API 中定义的 Expression类型的写法，可以很方便地表示一个表中的字段。 字段可以直接全部用双引号引起来，也可以用半边单引号+字段名的方式。以后的代码

中，一般都用后一种形式。

## 五、 将DataStream 转换成表

Flink 允许我们把 Table 和 DataStream 做转换：我们可以基于一个 DataStream，先流式 地读取数据源，然后 map 成 POJO，再把它转成 Table。Table 的列字段（column fields），就是 POJO 里的字段，这样就不用再麻烦地定义 schema 了。

## 5.1 代码表达

代码中实现非常简单，直接用 tableEnv.fromDataStream()就可以了。默认转换后的 Table schema 和 DataStream 中的字段定义一一对应，也可以单独指定出来。

这就允许我们更换字段的顺序、重命名，或者只选取某些字段出来，相当于做了一次

map操作（或者 Table API 的 select 操作）。

代码具体如下：

```java
DataStream<String> inputStream = env.readTextFile("sensor.txt");
DataStream<SensorReading> dataStream = inputStream
.map( line -> {
String[] fields = line.split(",");
return new SensorReading(fields[0], new Long(fields[1]), new
Double(fields[2]));
} );
Table sensorTable = tableEnv.fromDataStream(dataStream, "id, timestamp.rowtime as ts, temperature");
```

## 5.2 数据类型与 Table schema 的对应

在上节的例子中，DataStream 中的数据类型，与表的 Schema 之间的对应关系，是按 照类中的字段名来对应的（name-based mapping），所以还可以用 as 做重命名。

基于名称的对应：

```java
Table sensorTable = tableEnv.fromDataStream(dataStream, "timestamp as ts, id as myId, temperature");
```

Flink 的 DataStream 和 DataSet API 支持多种类型。

组合类型，比如元组（内置 Scala 和 Java 元组）、POJO、Scala case 类和 Flink 的 Row 类 型等，允许具有多个字段的嵌套数据结构，这些字段可以在 Table 的表达式中访问。其他类 型，则被视为原子类型。

## 六、 创建临时视图（Temporary View）

**1.10及之后的版本才支持**

创建临时视图的第一种方式，就是直接从 DataStream 转换而来。同样，可以直接对应 字段转换；也可以在转换的时候，指定相应的字段。

代码如下：

```java
tableEnv.createTemporaryView("sensorView", dataStream);
tableEnv.createTemporaryView("sensorView", dataStream, "id, temperature, timestamp as ts");
```

另外，当然还可以基于 Table 创建视图：

```java
tableEnv.createTemporaryView("sensorView", sensorTable);
```

View 和 Table 的 Schema 完全相同。事实上，在 Table API 中，可以认为 View 和 Table是等价的。

## 七、 输出表

表的输出，是通过将数据写入 TableSink 来实现的。TableSink 是一个通用接口，可以 支持不同的文件格式、存储数据库和消息队列。

具体实现，输出表最直接的方法，就是通过 Table.insertInto() 方法将一个 Table 写入 注册过的 TableSink 中。

## 7.1 输出到文件

代码如下：

```java
// 注册输出表
tableEnv.connect(
new FileSystem().path("…\\resources\\out.txt")
) // 定义到文件系统的连接
.withFormat(new Csv()) // 定义格式化方法，Csv 格式
.withSchema(new Schema()
.field("id", DataTypes.STRING())
.field("temp", DataTypes.DOUBLE())
) // 定义表结构
.createTemporaryTable("outputTable"); // 创建临时表
resultSqlTable.insertInto("outputTable");
```

## 7.2 更新模式（Update Mode）

在流处理过程中，表的处理并不像传统定义的那样简单。

对于流式查询（Streaming Queries），需要声明如何在（动态）表和外部连接器之间执行 转换。与外部系统交换的消息类型，由更新模式（update mode）指定。

Flink Table API 中的更新模式有以下三种：

**1、** 追加模式（AppendMode）；

在追加模式下，表（动态表）和外部连接器只交换插入（Insert）消息。
**2、** 撤回模式（RetractMode）；

在撤回模式下，表和外部连接器交换的是：添加（Add）和撤回（Retract）消息。

⚫ 插入（Insert）会被编码为添加消息；

⚫ 删除（Delete）则编码为撤回消息；

⚫ 更新（Update）则会编码为，已更新行（上一行）的撤回消息，和更新行（新行） 的添加消息。

在此模式下，不能定义 key，这一点跟 upsert 模式完全不同。
**3、** Upsert（更新插入）模式；

在 Upsert 模式下，动态表和外部连接器交换 Upsert 和 Delete 消息。 这个模式需要一个唯一的 key，通过这个 key 可以传递更新消息。为了正确应用消息，

外部连接器需要知道这个唯一 key 的属性。

• 插入（Insert）和更新（Update）都被编码为 Upsert 消息；

• 删除（Delete）编码为 Delete 信息。

这种模式和 Retract 模式的主要区别在于，Update 操作是用单个消息编码的，所以效率 会更高。

## 7.3 输出到 Kafka

除了输出到文件，也可以输出到 Kafka。我们可以结合前面 Kafka 作为输入数据，构建 数据管道，kafka 进，kafka 出。

代码如下：

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
.createTemporaryTable("kafkaOutputTable");
resultTable.insertInto("kafkaOutputTable");
```

## 7.4 输出到 ElasticSearch

ElasticSearch 的 connector 可以在 upsert（update+insert，更新插入）模式下操作，这样 就可以使用 Query 定义的键（key）与外部系统交换 UPSERT/DELETE 消息。

另外，对于“仅追加”（append-only）的查询，connector 还可以在 append 模式下操作， 这样就可以与外部系统只交换 insert 消息。

es目前支持的数据格式，只有 Json，而 flink 本身并没有对应的支持，所以还需要引入 依赖：

```xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-json</artifactId>
    <version>1.9.0</version>
</dependency>
```

代码实现如下：

```java
// 输出到 es
tableEnv.connect(
new Elasticsearch()
.version("6")
.host("localhost", 9200, "http")
.index("sensor")
.documentType("temp")
.inUpsertMode()   // 指定是 Upsert 模式
.withFormat(new Json())
.withSchema( new Schema()
.field("id", DataTypes.STRING())
.field("count", DataTypes.BIGINT())
)
.createTemporaryTable("esOutputTable");
aggResultTable.insertInto("esOutputTable");
```

## 7.5 输出到 MySql

Flink 专门为 Table API 的 jdbc 连接提供了 flink-jdbc 连接器，我们需要先引入依赖：

```xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-jdbc_2.12</artifactId>
    <version>1.10.1</version>
</dependency>
```

jdbc 连接的代码实现比较特殊，因为没有对应的 java/scala 类实现 ConnectorDescriptor， 所以不能直接 tableEnv.connect()。不过 Flink SQL 留下了执行 DDL 的接口：tableEnv.sqlUpdate()。

对于jdbc 的创建表操作，天生就适合直接写 DDL 来实现，所以我们的代码可以这样写：

```java
// 输出到 Mysql
String sinkDDL= "create table jdbcOutputTable (" +
"	id varchar(20) not null, " +
"	cnt bigint not null " +
") with (" +
"	'connector.type' = 'jdbc', " +
"	'connector.url' = 'jdbc:mysql://localhost:3306/test', " +
"	'connector.table' = 'sensor_count', " +
"	'connector.driver' = 'com.mysql.jdbc.Driver', " +
"	'connector.username' = 'root', " +
"	'connector.password' = '123456' )";
tableEnv.sqlUpdate(sinkDDL);	// 执行 DDL 创建表
aggResultSqlTable.insertInto("jdbcOutputTable");
```

## 八、 将表转换成 DataStream

表可以转换为 DataStream 或 DataSet。这样，自定义流处理或批处理程序就可以继续在 Table API 或 SQL 查询的结果上运行了。

将表转换为 DataStream 或 DataSet 时，需要指定生成的数据类型，即要将表的每一行转 换成的数据类型。通常，最方便的转换类型就是 Row。当然，因为结果的所有字段类型都是 明确的，我们也经常会用元组类型来表示。

表作为流式查询的结果，是动态更新的。所以，将这种动态查询转换成的数据流，同样 需要对表的更新操作进行编码，进而有不同的转换模式。

Table API 中表到 DataStream 有两种模式：

•追加模式（Append Mode） 用于表只会被插入（Insert）操作更改的场景。

•撤回模式（Retract Mode）

用于任何场景。有些类似于更新模式中 Retract 模式，它只有 Insert 和 Delete 两类操作。 得到的数据会增加一个 Boolean 类型的标识位（返回的第一个字段），用它来表示到底

是新增的数据（Insert），还是被删除的数据（老数据， Delete）。

代码实现如下：

```java
DataStream<Row> resultStream = tableEnv.toAppendStream(resultTable, Row.class);
DataStream<Tuple2<Boolean, Row>> aggResultStream = tableEnv.toRetractStream(aggResultTable, Row.class);
resultStream.print("result"); aggResultStream.print("aggResult");
```

所以，没有经过 groupby 之类聚合操作，可以直接用 toAppendStream 来转换；而如果 经过了聚合，有更新操作，一般就必须用 toRetractDstream。

## 九、 Query 的解释和执行

Table API 提供了一种机制来解释（Explain）计算表的逻辑和优化查询计划。这是通过

TableEnvironment.explain（table）方法或 TableEnvironment.explain（）方法完成的。 explain 方法会返回一个字符串，描述三个计划：

⚫未优化的逻辑查询计划

⚫优化后的逻辑查询计划

⚫实际执行计划

我们可以在代码中查看执行计划：

```java
String explaination = tableEnv.explain(resultTable);
System.out.println(explaination);
```

Query 的解释和执行过程，老 planner 和 blink planner 大体是一致的，又有所不同。整 体来讲，Query 都会表示成一个逻辑查询计划，然后分两步解释：

**1、** 优化查询计划；

**2、** 解释成DataStream或者DataSet程序；

而Blink 版本是批流统一的，所以所有的 Query，只会被解释成 DataStream 程序；另外 在批处理环境 TableEnvironment 下，Blink 版本要到 tableEnv.execute()执行调用才开始解释。

## 十、 案例

**因为我本地Flink 1.9.0版本，与课程上的代码会存在一定的差异**

pom文件配置

```xml
<!-- csv -->
；<dependency>
  <groupId>org.apache.flink</groupId>
  <artifactId>flink-csv</artifactId>
  <version>1.9.0</version>
</dependency>
```

## 10.1 输入案例

代码:

```java
package org.flink.tableapi;
import org.apache.flink.api.java.ExecutionEnvironment;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.*;
import org.apache.flink.table.api.java.BatchTableEnvironment;
import org.apache.flink.table.api.java.StreamTableEnvironment;
import org.apache.flink.table.descriptors.Csv;
import org.apache.flink.table.descriptors.FileSystem;
import org.apache.flink.table.descriptors.OldCsv;
import org.apache.flink.table.descriptors.Schema;
import org.apache.flink.types.Row;
public class TableTest2_CommonApi {
    public static void main(String[] args) throws Exception{
        // 1. 创建环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
        // 1.1 基于老版本planner的流处理
        EnvironmentSettings oldStreamSettings = EnvironmentSettings.newInstance()
                .useOldPlanner()
                .inStreamingMode()
                .build();
        StreamTableEnvironment oldStreamTableEnv = StreamTableEnvironment.create(env, oldStreamSettings);
        // 1.2 基于老版本planner的批处理
        ExecutionEnvironment batchEnv = ExecutionEnvironment.getExecutionEnvironment();
        BatchTableEnvironment oldBatchTableEnv = BatchTableEnvironment.create(batchEnv);
        // 1.3 基于Blink的流处理
        EnvironmentSettings blinkStreamSettings = EnvironmentSettings.newInstance()
                .useBlinkPlanner()
                .inStreamingMode()
                .build();
        StreamTableEnvironment blinkStreamTableEnv = StreamTableEnvironment.create(env, blinkStreamSettings);
        // 1.4 基于Blink的批处理
        EnvironmentSettings blinkBatchSettings = EnvironmentSettings.newInstance()
                .useBlinkPlanner()
                .inBatchMode()
                .build();
        TableEnvironment blinkBatchTableEnv = TableEnvironment.create(blinkBatchSettings);
        // 2. 表的创建：连接外部系统，读取数据
        // 2.1 读取文件
        String filePath = "C:\\Users\\Administrator\\IdeaProjects\\FlinkStudy\\src\\main\\resources\\sensor.txt";
        tableEnv.connect( new FileSystem().path(filePath))
                .withFormat( new OldCsv()
                        .field("id", Types.STRING())
                        .field("timestamp", Types.INT())
                        .field("temp", Types.DOUBLE())
                ).withSchema(new Schema()
                        .field("id", Types.STRING())
                        .field("timestamp", Types.INT())
                        .field("temp", Types.DOUBLE())
                )
                //.inAppendMode()
                .registerTableSource("inputTable");
          Table inputTable = tableEnv.scan("inputTable");
//        inputTable.printSchema();
//        tableEnv.toAppendStream(inputTable, Row.class).print();
        // 3. 查询转换
        // 3.1 Table API
        // 简单转换
        Table resultTable = inputTable.select("id, temp")
                .filter("id === 'sensor_6'");
        // 聚合统计
        Table aggTable = inputTable.groupBy("id")
                .select("id, id.count as count, temp.avg as avgTemp");
        // 3.2 SQL
        tableEnv.sqlQuery("select id, temp from inputTable where id = 'senosr_6'");
        Table sqlAggTable = tableEnv.sqlQuery("select id, count(id) as cnt, avg(temp) as avgTemp from inputTable group by id");
        // 打印输出
        tableEnv.toAppendStream(resultTable, Row.class).print("result");
        tableEnv.toRetractStream(aggTable, Row.class).print("agg");
        tableEnv.toRetractStream(sqlAggTable, Row.class).print("sqlagg");
        env.execute();
    }
}
```

测试记录:

## 10.2 输出案例

从文件读取，处理后，输出到文件

代码:

```java
package org.flink.tableapi;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.DataTypes;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.Types;
import org.apache.flink.table.api.java.StreamTableEnvironment;
import org.apache.flink.table.descriptors.Csv;
import org.apache.flink.table.descriptors.FileSystem;
import org.apache.flink.table.descriptors.OldCsv;
import org.apache.flink.table.descriptors.Schema;
public class TableTest3_FileOutput {
    public static void main(String[] args) throws Exception {
        // 1. 创建环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
        // 2. 表的创建：连接外部系统，读取数据
        // 读取文件
        String filePath = "C:\\Users\\Administrator\\IdeaProjects\\FlinkStudy\\src\\main\\resources\\sensor.txt";
        tableEnv.connect( new FileSystem().path(filePath))
                .withFormat( new OldCsv()
                        .field("id", Types.STRING())
                        .field("timestamp", Types.INT())
                        .field("temp", Types.DOUBLE())
                ).withSchema(new Schema()
                .field("id", Types.STRING())
                .field("timestamp", Types.INT())
                .field("temp", Types.DOUBLE())
        )
                .registerTableSource("inputTable");
        Table inputTable = tableEnv.scan("inputTable");
//        inputTable.printSchema();
//        tableEnv.toAppendStream(inputTable, Row.class).print();
        // 3. 查询转换
        // 3.1 Table API
        // 简单转换
        Table resultTable = inputTable.select("id, temp")
                .filter("id === 'sensor_6'");
        // 聚合统计
        Table aggTable = inputTable.groupBy("id")
                .select("id, id.count as count, temp.avg as avgTemp");
        // 3.2 SQL
        tableEnv.sqlQuery("select id, temp from inputTable where id = 'senosr_6'");
        Table sqlAggTable = tableEnv.sqlQuery("select id, count(id) as cnt, avg(temp) as avgTemp from inputTable group by id");
        // 4. 输出到文件
        // 连接外部文件注册输出表
        String outputPath = "C:\\Users\\Administrator\\IdeaProjects\\FlinkStudy\\src\\main\\resources\\sensor_out.txt";
        tableEnv.connect( new FileSystem().path(outputPath))
                .withFormat( new OldCsv()
                        .field("id", Types.STRING())
                        .field("temp", Types.DOUBLE())
                ).withSchema(new Schema()
                        .field("id", Types.STRING())
                        .field("temp", Types.DOUBLE())
                )
                .registerTableSink("outputTable");
        resultTable.insertInto("outputTable");
//        aggTable.insertInto("outputTable");
        env.execute();
    }
}
```

## 10.3 Kafka输入和输出

本案例测试Kafka输入和输出

代码:

```java
package org.flink.tableapi;
import org.apache.flink.api.scala.typeutils.Types;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.DataTypes;
import org.apache.flink.table.api.EnvironmentSettings;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.java.StreamTableEnvironment;
import org.apache.flink.table.descriptors.Csv;
import org.apache.flink.table.descriptors.Kafka;
import org.apache.flink.table.descriptors.OldCsv;
import org.apache.flink.table.descriptors.Schema;
public class TableTest5_KafkaPipeLine {
    public static void main(String[] args) throws Exception {
        // 1. 创建环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
        // 2. 连接Kafka，读取数据
        tableEnv.connect(new Kafka()
                .version("universal")
                .topic("flink_source")
                .startFromLatest()
                .property("zookeeper.connect", "10.31.1.124:2181")
                .property("bootstrap.servers", "10.31.1.124:9092")
                .property("group.id", "testGroup")
        )
                .withFormat(new Csv()
                            .fieldDelimiter(',')
                            .deriveSchema()
                )
                .withSchema(new Schema()
                        .field("id", Types.STRING())
                        .field("timestamp", Types.LONG())
                        .field("temp", Types.DOUBLE())
                )
                .inAppendMode()
                .registerTableSource("inputTable");
        // 3. 查询转换
        // 简单转换
        Table sensorTable = tableEnv.scan("inputTable");
        Table resultTable = sensorTable.select("id, temp")
                .filter("id === 'sensor_6'");
        // 聚合统计
        //Table aggTable = sensorTable.groupBy("id")
        //        .select("id, id.count as count, temp.avg as avgTemp");
        // 4. 建立kafka连接，输出到不同的topic下
        tableEnv.connect(new Kafka()
                .version("universal")
                .topic("flink_sink")
                .property("zookeeper.connect", "10.31.1.124:2181")
                .property("bootstrap.servers", "10.31.1.124:9092")
                .property("group.id", "testGroup")
        )
                .withFormat(new Csv()
                        .fieldDelimiter(',')
                        .deriveSchema()
                )
                .withSchema(new Schema()
                        .field("id", Types.STRING())
                        //.field("timestamp", Types.LONG())
                        .field("temp", Types.DOUBLE())
                )
                .inAppendMode()
                .registerTableSink("outputTable");
        resultTable.insertInto("outputTable");
        env.execute();
    }
}
```

**开启Kafka生产者:**

```java
/opt/cloudera/parcels/CDH-6.3.1-1.cdh6.3.1.p0.1470567/lib/kafka/bin/kafka-console-producer.sh --broker-list 10.31.1.124:9092 --topic flink_source
```

输入信息:

```java
sensor_1,1547718199,35.8
sensor_6,1547718201,15.4
sensor_7,1547718202,6.7
sensor_10,1547718205,38.1
sensor_1,1547718207,36.3
sensor_1,1547718209,32.8
sensor_1,1547718212,37.1
```

**开启Kafka消费者:**

```java
/opt/cloudera/parcels/CDH-6.3.1-1.cdh6.3.1.p0.1470567/lib/kafka/bin/kafka-console-consumer.sh --from-beginning --bootstrap-server 10.31.1.124:9092 --topic flink_sink
```
