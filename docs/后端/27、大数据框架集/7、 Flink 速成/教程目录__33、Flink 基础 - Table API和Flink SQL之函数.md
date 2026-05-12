# 33、Flink 基础 - Table API和Flink SQL之函数
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/33.html
- 分类：大数据框架
- 分组：教程目录
## 一、 函数

Flink Table 和 SQL 内置了很多 SQL 中支持的函数；如果有无法满足的需要，则可以实 现用户自定义的函数（UDF）来解决。

## 1.1 系统内置函数

Flink Table API 和 SQL 为用户提供了一组用于数据转换的内置函数。SQL 中支持的很多 函数，Table API 和 SQL 都已经做了实现，其它还在快速开发扩展中。

以下是一些典型函数的举例，全部的内置函数，可以参考官网介绍。

⚫比较函数

SQL：

value1 = value2

value1 > value2

Table API：

ANY1 === ANY2

ANY1 > ANY2

⚫逻辑函数

SQL：

boolean1 OR boolean2

boolean IS FALSE

NOTboolean

Table API：

BOOLEAN1 || BOOLEAN2

BOOLEAN.isFalse

!BOOLEAN

⚫算术函数

SQL：

numeric1 + numeric2

POWER(numeric1, numeric2)

Table API：

NUMERIC1 + NUMERIC2

NUMERIC1.power(NUMERIC2)

⚫字符串函数

SQL：

string1 || string2

UPPER(string)

CHAR_LENGTH(string)

Table API：

STRING1 + STRING2

STRING.upperCase()

STRING.charLength()

⚫时间函数

SQL：

DATE string

TIMESTAMP string

CURRENT_TIME

INTERVAL string range

Table API：

STRING.toDate

STRING.toTimestamp

currentTime()

NUMERIC.days

NUMERIC.minutes

⚫聚合函数

SQL：

COUNT(*)

SUM([ ALL | DISTINCT ] expression)

RANK()

ROW_NUMBER()

Table API：

FIELD.count

FIELD.sum0

## 1.2 UDF

用户定义函数（User-defined Functions，UDF）是一个重要的特性，因为它们显著地扩 展了查询（Query）的表达能力。一些系统内置函数无法解决的需求，我们可以用 UDF 来自 定义实现。

### 1.2.1 注册用户自定义函数 UDF

在大多数情况下，用户定义的函数必须先注册，然后才能在查询中使用。不需要专门为Scala 的 Table API 注册函数。

函数通过调用 registerFunction（）方法在 TableEnvironment 中注册。当用户定义的函数被注册时，它被插入到 TableEnvironment 的函数目录中，这样 Table API 或 SQL 解析器就可 以识别并正确地解释它。

### 1.2.2 标量函数（Scalar Functions）

用户定义的标量函数，可以将 0、1 或多个标量值，映射到新的标量值。 为了定义标量函数，必须在 org.apache.flink.table.functions 中扩展基类 Scalar Function，并实现（一个或多个）求值（evaluation，eval）方法。标量函数的行为由求值方法决定， 求值方法必须公开声明并命名为 eval（直接 def 声明，没有 override）。求值方法的参数类型 和返回类型，确定了标量函数的参数和返回类型。

在下面的代码中，我们定义自己的 HashCode 函数，在 TableEnvironment 中注册它，并 在查询中调用它。

```java
// 自定义一个标量函数
public static class HashCode extends ScalarFunction {
private int factor = 13;
public HashCode(int factor) {
this.factor = factor;
}
public int eval(String s) {
return s.hashCode() * factor;
}
}
```

主函数中调用，计算 sensor id 的哈希值（前面部分照抄，流环境、表环境、读取 source、 建表）：

```java
public static void main(String[] args) throws Exception {
// 1. 创建环境
    StreamExecutionEnvironment env =StreamExecutionEnvironment.getExecutionEnvironment();
    env.setParallelism(1);
    StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
    // 2. 读取文件，得到 DataStream
    String filePath = "..\\sensor.txt";
    DataStream<String> inputStream = env.readTextFile(filePath);
    // 3. 转换成 Java Bean，并指定 timestamp 和 watermark
    DataStream<SensorReading> dataStream = inputStream.map( line -> {
String[] fields = line.split(",");
    return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
} );
    // 4. 将 DataStream 转换为 Table
    Table sensorTable = tableEnv.fromDataStream(dataStream, "id, timestamp as ts, temperature");
    // 5. 调用自定义 hash 函数，对 id 进行 hash 运算
    HashCode hashCode = new HashCode(23);
    tableEnv.registerFunction("hashCode", hashCode);
    Table resultTable = sensorTable.select("id, ts, hashCode(id)");
    //	sql
    tableEnv.createTemporaryView("sensor", sensorTable);
Table resultSqlTable = tableEnv.sqlQuery("select id, ts, hashCode(id) from sensor");
    tableEnv.toAppendStream(resultTable, Row.class).print("result");
    tableEnv.toRetractStream(resultSqlTable, Row.class).print("sql");
    env.execute("scalar function test");
```

### 1.2.3 表函数（Table Functions）

与用户定义的标量函数类似，用户定义的表函数，可以将 0、1 或多个标量值作为输入 参数；与标量函数不同的是，它可以返回任意数量的行作为输出，而不是单个值。

为了定义一个表函数，必须扩展 org.apache.flink.table.functions 中的基类 TableFunction 并实现（一个或多个）求值方法。表函数的行为由其求值方法决定，求值方法必须是 public 的，并命名为 eval。求值方法的参数类型，决定表函数的所有有效参数。

返回表的类型由 TableFunction 的泛型类型确定。求值方法使用 protected collect（T）方 法发出输出行。

在Table API 中，Table 函数需要与.joinLateral 或.leftOuterJoinLateral 一起使用。joinLateral 算子，会将外部表中的每一行，与表函数（TableFunction，算子的参数是它 的表达式）计算得到的所有行连接起来。而 leftOuterJoinLateral 算子，则是左外连接，它同样会将外部表中的每一行与表函数计 算生成的所有行连接起来；并且，对于表函数返回的是空表的外部行，也要保留下来。

在SQL 中，则需要使用 Lateral Table（），或者带有 ON TRUE 条件的左连 接。

下面的代码中，我们将定义一个表函数，在表环境中注册它，并在查询中调用它。 自定义 TableFunction：

```java
// 自定义 TableFunction
public static class Split extends TableFunction<Tuple2<String, Integer>> {
private String separator = ",";
public Split(String separator) {
this.separator = separator;
}
// 类似 flatmap，没有返回值
public void eval(String str) {
for (String s : str.split(separator)) {
collect(new Tuple2<String, Integer>(s, s.length()));
}
}
}
```

接下来，就是在代码中调用。首先是 Table API 的方式：

```java
Split split = new Split("_"); tableEnv.registerFunction("split", split); Table resultTable = sensorTable
.joinLateral( "split(id) as (word, length)")
.select("id, ts, word, length");
```

然后是SQL 的方式：

```java
tableEnv.createTemporaryView("sensor", sensorTable);
Table resultSqlTable = tableEnv.sqlQuery("select id, ts, word, length " +
"from sensor, lateral table( split(id) ) as splitId(word, length)");
```

### 1.2.4 聚合函数（Aggregate Functions）

用户自定义聚合函数（User-Defined Aggregate Functions，UDAGGs）可以把一个表中的 数据，聚合成一个标量值。用户定义的聚合函数，是通过继承 AggregateFunction 抽象类实 现的。

上图中显示了一个聚合的例子。 假设现在有一张表，包含了各种饮料的数据。该表由三列（id、name 和 price）、五行组成数据。现在我们需要找到表中所有饮料的最高价格，即执行 max（）聚合，结果将是一个数值。

AggregateFunction 的工作原理如下。

⚫首先，它需要一个累加器，用来保存聚合中间结果的数据结构（状态）。可以通过 调用 AggregateFunction 的 createAccumulator（）方法创建空累加器。

⚫随后，对每个输入行调用函数的 accumulate（）方法来更新累加器。

⚫处理完所有行后，将调用函数的 getValue（）方法来计算并返回最终结果。 AggregationFunction 要求必须实现的方法：

•createAccumulator()

•accumulate()

•getValue()

除了上述方法之外，还有一些可选择实现的方法。其中一些方法，可以让系统执行查询 更有效率，而另一些方法，对于某些场景是必需的。例如，如果聚合函数应用在会话窗口

（session group window）的上下文中，则 merge（）方法是必需的。

•retract()

•merge()

•resetAccumulator()

接下来我们写一个自定义 AggregateFunction，计算一下每个 sensor 的平均温度值.

```java
// 定义 AggregateFunction 的 Accumulator
public static class AvgTempAcc {
double sum = 0.0;
int count = 0;
}
// 自定义一个聚合函数，求每个传感器的平均温度值，保存状态(tempSum,  tempCount)
public static class AvgTemp extends AggregateFunction<Double, AvgTempAcc>{
@Override
public Double getValue(AvgTempAcc accumulator) {
return accumulator.sum / accumulator.count;
}
@Override
public AvgTempAcc createAccumulator() {
return new AvgTempAcc();
}
// 实现一个具体的处理计算函数，accumulate
public void accumulate( AvgTempAcc accumulator, Double temp) {
accumulator.sum += temp;
accumulator.count += 1;
}
}
```

接下来就可以在代码中调用了。

```java
// 创建一个聚合函数实例
AvgTemp avgTemp = new AvgTemp();
// Table API 的调用
tableEnv.registerFunction("avgTemp", avgTemp); Table resultTable = sensorTable
.groupBy("id")
.aggregate("avgTemp(temperature) as avgTemp")
.select("id, avgTemp");
// sql
tableEnv.createTemporaryView("sensor", sensorTable);
Table resultSqlTable = tableEnv.sqlQuery("select id, avgTemp(temperature) " +
"from sensor group by id");
tableEnv.toRetractStream(resultTable, Row.class).print("result"); tableEnv.toRetractStream(resultSqlTable, Row.class).print("sql");
```

### 1.2.5 表聚合函数（Table Aggregate Functions）

用户定义的表聚合函数（User-Defined Table Aggregate Functions，UDTAGGs），可以把一 个表中数据，聚合为具有多行和多列的结果表。这跟 AggregateFunction 非常类似，只是之 前聚合结果是一个标量值，现在变成了一张表。

比如现在我们需要找到表中所有饮料的前 2 个最高价格，即执行 top2（）表聚合。我 们需要检查 5 行中的每一行，得到的结果将是一个具有排序后前 2 个值的表。

用户定义的表聚合函数，是通过继承 TableAggregateFunction 抽象类来实现的。

TableAggregateFunction 的工作原理如下。

⚫首先，它同样需要一个累加器（Accumulator），它是保存聚合中间结果的数据结构。

通过调用 TableAggregateFunction 的 createAccumulato（r）方法可以创建空累加器。

⚫随后，对每个输入行调用函数的 accumulate（）方法来更新累加器。

⚫处理完所有行后，将调用函数的 emitValue（）方法来计算并返回最终结果。

AggregationFunction 要求必须实现的方法：

•createAccumulator()

•accumulate()

除了上述方法之外，还有一些可选择实现的方法。

•retract()

•merge()

•resetAccumulator()

•emitValue()

•emitUpdateWithRetract()

接下来我们写一个自定义 TableAggregateFunction，用来提取每个 sensor 最高的两个温 度值。

```java
// 先定义一个 Accumulator
public static class Top2TempAcc {
double highestTemp = Double.MIN_VALUE;
double secondHighestTemp = Double.MIN_VALUE;
}
// 自定义表聚合函数
public static class Top2Temp extends TableAggregateFunction<Tuple2<Double, Integer>, Top2TempAcc> {
@Override
public Top2TempAcc createAccumulator() {
return new Top2TempAcc();
}
// 实现计算聚合结果的函数 accumulate
public void accumulate(Top2TempAcc acc, Double temp) {
if (temp > acc.highestTemp) {
      acc.secondHighestTemp = acc.highestTemp; acc.highestTemp = temp;
} else if (temp > acc.secondHighestTemp) {
      acc.secondHighestTemp = temp;
}
}
// 实现一个输出结果的方法，最终处理完表中所有数据时调用
public void emitValue(Top2TempAcc acc, Collector<Tuple2<Double, Integer>> out) {
out.collect(new Tuple2<>(acc.highestTemp, 1));
out.collect(new Tuple2<>(acc.secondHighestTemp, 2));
}
}
```

接下来就可以在代码中调用了。

```java
// 创建一个表聚合函数实例
Top2Temp top2Temp = new Top2Temp(); tableEnv.registerFunction("top2Temp", top2Temp); Table resultTable = sensorTable
.groupBy("id")
.flatAggregate("top2Temp(temperature) as (temp, rank)")
.select("id, temp, rank");
tableEnv.toRetractStream(resultTable, Row.class).print("result");
```

## 二、案例

## 2.1 Scalar Function

**代码:**

```java
package org.flink.tableapi.udf;
import org.flink.beans.SensorReading;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.java.StreamTableEnvironment;
import org.apache.flink.table.functions.ScalarFunction;
import org.apache.flink.types.Row;
/**
 */
public class UdfTest1_ScalarFunction {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
        // 1. 读取数据
        DataStreamSource<String> inputStream = env.readTextFile("C:\\Users\\Administrator\\IdeaProjects\\FlinkStudy\\src\\main\\resources\\sensor.txt");
        // 2. 转换成POJO
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        // 3. 将流转换成表
        Table sensorTable = tableEnv.fromDataStream(dataStream, "id, timestamp as ts, temperature as temp");
        // 4. 自定义标量函数，实现求id的hash值
        // 4.1 table API
        HashCode hashCode = new HashCode(23);
        // 需要在环境中注册UDF
        tableEnv.registerFunction("hashCode", hashCode);
        Table resultTable = sensorTable.select("id, ts, hashCode(id)");
        // 4.2 SQL
        tableEnv.registerTable("sensor", sensorTable);
        Table resultSqlTable = tableEnv.sqlQuery("select id, ts, hashCode(id) from sensor");
        // 打印输出
        tableEnv.toAppendStream(resultTable, Row.class).print("result");
        tableEnv.toAppendStream(resultSqlTable, Row.class).print("sql");
        env.execute();
    }
    // 实现自定义的ScalarFunction
    public static class HashCode extends ScalarFunction{
        private int factor = 13;
        public HashCode(int factor) {
            this.factor = factor;
        }
        public int eval(String str){
            return str.hashCode() * factor;
        }
    }
}
```

**测试记录:**

## 2.2 Table Function

**代码:**

```java
package org.flink.tableapi.udf;
import org.flink.beans.SensorReading;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.java.StreamTableEnvironment;
import org.apache.flink.table.functions.TableFunction;
import org.apache.flink.types.Row;
public class UdfTest2_TableFunction {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
        // 1. 读取数据
        DataStreamSource<String> inputStream = env.readTextFile("C:\\Users\\Administrator\\IdeaProjects\\FlinkStudy\\src\\main\\resources\\sensor.txt");
        // 2. 转换成POJO
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        // 3. 将流转换成表
        Table sensorTable = tableEnv.fromDataStream(dataStream, "id, timestamp as ts, temperature as temp");
        // 4. 自定义表函数，实现将id拆分，并输出（word, length）
        // 4.1 table API
        Split split = new Split("_");
        // 需要在环境中注册UDF
        tableEnv.registerFunction("split", split);
        Table resultTable = sensorTable
                .joinLateral("split(id) as (word, length)")
                .select("id, ts, word, length");
        // 4.2 SQL
        tableEnv.registerTable("sensor", sensorTable);
        Table resultSqlTable = tableEnv.sqlQuery("select id, ts, word, length " +
                " from sensor, lateral table(split(id)) as splitid(word, length)");
        // 打印输出
        tableEnv.toAppendStream(resultTable, Row.class).print("result");
        tableEnv.toAppendStream(resultSqlTable, Row.class).print("sql");
        env.execute();
    }
    // 实现自定义TableFunction
    public static class Split extends TableFunction<Tuple2<String, Integer>>{
        // 定义属性，分隔符
        private String separator = ",";
        public Split(String separator) {
            this.separator = separator;
        }
        // 必须实现一个eval方法，没有返回值
        public void eval( String str ){
            for( String s: str.split(separator) ){
                collect(new Tuple2<>(s, s.length()));
            }
        }
    }
}
```

**测试记录：**

## 2.3 Aggregate Function

**代码:**

```java
package org.flink.tableapi.udf;
import org.flink.beans.SensorReading;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.java.StreamTableEnvironment;
import org.apache.flink.table.functions.AggregateFunction;
import org.apache.flink.types.Row;
public class UdfTest3_AggregateFunction {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
        // 1. 读取数据
        DataStreamSource<String> inputStream = env.readTextFile("C:\\Users\\Administrator\\IdeaProjects\\FlinkStudy\\src\\main\\resources\\sensor.txt");
        // 2. 转换成POJO
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        // 3. 将流转换成表
        Table sensorTable = tableEnv.fromDataStream(dataStream, "id, timestamp as ts, temperature as temp");
        // 4. 自定义聚合函数，求当前传感器的平均温度值
        // 4.1 table API
        AvgTemp avgTemp = new AvgTemp();
        // 需要在环境中注册UDF
        tableEnv.registerFunction("avgTemp", avgTemp);
        Table resultTable = sensorTable
                .groupBy("id")
                .aggregate( "avgTemp(temp) as avgtemp" )
                .select("id, avgtemp");
        // 4.2 SQL
        tableEnv.registerTable("sensor", sensorTable);
        Table resultSqlTable = tableEnv.sqlQuery("select id, avgTemp(temp) " +
                " from sensor group by id");
        // 打印输出
        tableEnv.toRetractStream(resultTable, Row.class).print("result");
        tableEnv.toRetractStream(resultSqlTable, Row.class).print("sql");
        env.execute();
    }
    // 实现自定义的AggregateFunction
    public static class AvgTemp extends AggregateFunction<Double, Tuple2<Double, Integer>>{
        @Override
        public Double getValue(Tuple2<Double, Integer> accumulator) {
            return accumulator.f0 / accumulator.f1;
        }
        @Override
        public Tuple2<Double, Integer> createAccumulator() {
            return new Tuple2<>(0.0, 0);
        }
        // 必须实现一个accumulate方法，来数据之后更新状态
        public void accumulate( Tuple2<Double, Integer> accumulator, Double temp ){
            accumulator.f0 += temp;
            accumulator.f1 += 1;
        }
    }
}
```

**测试记录：**
