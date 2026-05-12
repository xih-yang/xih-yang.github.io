# 32、Flink 基础 - Table API和Flink SQL之窗口
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/32.html
- 分类：大数据框架
- 分组：教程目录
## 一、窗口

时间语义，要配合窗口操作才能发挥作用。最主要的用途，当然就是开窗口、根据时间 段做计算了。下面我们就来看看 Table API 和 SQL 中，怎么利用时间字段做窗口操作。

在Table API 和 SQL 中，主要有两种窗口：Group Windows 和 Over Windows

## 1.1 分组窗口（Group Windows）

分组窗口（Group Windows）会根据时间或行计数间隔，将行聚合到有限的组（Group） 中，并对每个组的数据执行一次聚合函数。

Table API 中的 Group Windows 都是使用.window（w:GroupWindow）子句定义的，并且 必须由 as 子句指定一个别名。为了按窗口对表进行分组，窗口的别名必须在 group by 子句 中，像常规的分组字段一样引用。

```java
Table table = input
.window([w: GroupWindow] as "w") // 定义窗口，别名 w
.groupBy("w, a")	// 以属性 a 和窗口 w 作为分组的 key
.select("a, b.sum") // 聚合字段 b 的值，求和
```

或者，还可以把窗口的相关信息，作为字段添加到结果表中：

```java
Table table = input
.window([w: GroupWindow] as "w")
.groupBy("w, a")
.select("a, w.start, w.end, w.rowtime, b.count")
```

Table API 提供了一组具有特定语义的预定义 Window 类，这些类会被转换为底层

DataStream 或 DataSet 的窗口操作。

Table API 支持的窗口定义，和我们熟悉的一样，主要也是三种：滚动（Tumbling）、滑 动（Sliding）和会话（Session）。

### 1.1.1 滚动窗口

滚动窗口（Tumbling windows）要用 Tumble 类来定义，另外还有三个方法：

⚫over：定义窗口长度

⚫on：用来分组（按时间间隔）或者排序（按行数）的时间字段

⚫as：别名，必须出现在后面的 groupBy 中

代码如下：

```java
// Tumbling Event-time Window
.window(Tumble.over("10.minutes").on("rowtime").as("w"))
// Tumbling Processing-time Window
.window(Tumble.over("10.minutes").on("proctime").as("w"))
// Tumbling Row-count Window
.window(Tumble.over("10.rows").on("proctime").as("w"))
```

### 1.1.2 滑动窗口

滑动窗口（Sliding windows）要用 Slide 类来定义，另外还有四个方法：

⚫over：定义窗口长度

⚫every：定义滑动步长

⚫on：用来分组（按时间间隔）或者排序（按行数）的时间字段

⚫as：别名，必须出现在后面的 groupBy 中

代码如下：

```java
// Sliding Event-time Window
.window(Slide.over("10.minutes").every("5.minutes").on("rowtime").as("w"))
// Sliding Processing-time window
.window(Slide.over("10.minutes").every("5.minutes").on("proctime").as("w"))
// Sliding Row-count window
.window(Slide.over("10.rows").every("5.rows").on("proctime").as("w"))
```

### 1.1.3 会话窗口

会话窗口（Session windows）要用 Session 类来定义，另外还有三个方法：

⚫withGap：会话时间间隔

⚫on：用来分组（按时间间隔）或者排序（按行数）的时间字段

⚫as：别名，必须出现在后面的 groupBy 中

代码如下：

```java
// Session Event-time Window
.window(Session.withGap.("10.minutes").on("rowtime").as("w"))
// Session Processing-time Window
.window(Session.withGap.("10.minutes").on(“proctime").as("w"))
```

## 1.2 Over Windows

Over window 聚合是标准 SQL 中已有的（Over 子句），可以在查询的 SELECT 子句中定义。Over window 聚合，会针对每个输入行，计算相邻行范围内的聚合。Over windows

使用.window（w:overwindows*）子句定义，并在 select（）方法中通过别名来引用。

比如这样：

```java
Table table = input
.window([w: OverWindow] as "w")
.select("a, b.sum over w, c.min over w")
```

Table API 提供了 Over 类，来配置 Over 窗口的属性。可以在事件时间或处理时间，以及 指定为时间间隔、或行计数的范围内，定义 Over windows。

无界的over window 是使用常量指定的。也就是说，时间间隔要指定 UNBOUNDED_RANGE， 或者行计数间隔要指定 UNBOUNDED_ROW。而有界的 over window 是用间隔的大小指定的。

实际代码应用如下：

**1、** 无界的overwindow；

```java
// 无界的事件时间 over window
.window(Over.partitionBy("a").orderBy("rowtime").preceding.(UNBOUNDED_RANGE).as("w"))
// 无界的处理时间 over window
.window(Over.partitionBy("a").orderBy("proctime").preceding.(UNBOUNDED_RANGE).as("w"))
// 无界的事件时间 Row-count over window
.window(Over.partitionBy("a").orderBy("rowtime").preceding.(UNBOUNDED_ROW). as("w"))
//无界的处理时间 Row-count over window
.window(Over.partitionBy("a").orderBy("proctime").preceding.(UNBOUNDED_ROW).as("w"))
```

**1、** 有界的overwindow；

```java
// 有界的事件时间 over window
.window(Over.partitionBy("a").orderBy("rowtime").preceding("1.minutes").as("w"))
// 有界的处理时间 over window
.window(Over.partitionBy("a").orderBy("proctime").preceding("1.minutes").as ("w"))
// 有界的事件时间 Row-count over window
.window(Over.partitionBy("a").orderBy("rowtime").preceding("10.rows").as("w "))
// 有界的处理时间 Row-count over window
.window(Over.partitionBy("a").orderBy("procime").preceding("10.rows").as("w "))
```

## 1.3 SQL 中窗口的定义

我们已经了解了在 Table API 里 window 的调用方式，同样，我们也可以在 SQL 中直接加入窗口的定义和使用。

### 1.3.1 Group Windows

Group Windows 在 SQL 查询的 Group BY 子句中定义。与使用常规 GROUP BY 子句的查询 一样，使用 GROUP BY 子句的查询会计算每个组的单个结果行。

SQL支持以下 Group 窗口函数:

•TUMBLE(time_attr, interval)

定义一个滚动窗口，第一个参数是时间字段，第二个参数是窗口长度。

•HOP(time_attr, interval, interval)

定义一个滑动窗口，第一个参数是时间字段，第二个参数是窗口滑动步长，第三个是窗 口长度。

•SESSION(time_attr, interval)

定义一个会话窗口，第一个参数是时间字段，第二个参数是窗口间隔（Gap）。

另外还有一些辅助函数，可以用来选择 Group Window 的开始和结束时间戳，以及时间 属性。

这里只写 TUMBLE_*，滑动和会话窗口是类似的（HOP_*，SESSION_*）。

•TUMBLE_START(time_attr, interval)

•TUMBLE_END(time_attr, interval)

•TUMBLE_ROWTIME(time_attr, interval)

•TUMBLE_PROCTIME(time_attr, interval)

### 1.3.2 Over Windows

由于 Over 本来就是 SQL 内置支持的语法，所以这在 SQL 中属于基本的聚合操作。所有 聚合必须在同一窗口上定义，也就是说，必须是相同的分区、排序和范围。目前仅支持在当 前行范围之前的窗口（无边界和有边界）。

注意，ORDER BY 必须在单一的时间属性上指定。

代码如下：

```java
SELECT COUNT(amount) OVER ( PARTITION BY user
ORDER BY proctime
ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
FROM Orders
// 也可以做多个聚合
SELECT COUNT(amount) OVER w, SUM(amount) OVER w FROM Orders
WINDOW w AS ( PARTITION BY user
ORDER BY proctime
```

## 二、案例

**代码:**

```java
package org.flink.tableapi;
import org.flink.beans.SensorReading;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.timestamps.BoundedOutOfOrdernessTimestampExtractor;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.table.api.Over;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.Tumble;
import org.apache.flink.table.api.java.StreamTableEnvironment;
import org.apache.flink.types.Row;
public class TableTest5_TimeAndWindow {
    public static void main(String[] args) throws Exception {
        // 1. 创建环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
        // 2. 读入文件数据，得到DataStream
        DataStream<String> inputStream = env.readTextFile("C:\\Users\\Administrator\\IdeaProjects\\FlinkStudy\\src\\main\\resources\\sensor.txt");
        // 3. 转换成POJO
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        })
                .assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor<SensorReading>(Time.seconds(2)) {
                    @Override
                    public long extractTimestamp(SensorReading element) {
                        return element.getTimestamp() * 1000L;
                    }
                });
        // 4. 将流转换成表，定义时间特性
//        Table dataTable = tableEnv.fromDataStream(dataStream, "id, timestamp as ts, temperature as temp, pt.proctime");
        Table dataTable = tableEnv.fromDataStream(dataStream, "id, timestamp as ts, temperature as temp, rt.rowtime");
        tableEnv.registerTable("sensor", dataTable);
        // 5. 窗口操作
        // 5.1 Group Window
        // table API
        Table resultTable = dataTable.window(Tumble.over("10.seconds").on("rt").as("tw"))
                .groupBy("id, tw")
                .select("id, id.count, temp.avg, tw.end");
        // SQL
        Table resultSqlTable = tableEnv.sqlQuery("select id, count(id) as cnt, avg(temp) as avgTemp, tumble_end(rt, interval '10' second) " +
                "from sensor group by id, tumble(rt, interval '10' second)");
        // 5.2 Over Window
        // table API
        Table overResult = dataTable.window(Over.partitionBy("id").orderBy("rt").preceding("2.rows").as("ow"))
                .select("id, rt, id.count over ow, temp.avg over ow");
        // SQL
        Table overSqlResult = tableEnv.sqlQuery("select id, rt, count(id) over ow, avg(temp) over ow " +
                " from sensor " +
                " window ow as (partition by id order by rt rows between 2 preceding and current row)");
//        dataTable.printSchema();
//        tableEnv.toAppendStream(resultTable, Row.class).print("result");
//        tableEnv.toRetractStream(resultSqlTable, Row.class).print("sql");
        tableEnv.toAppendStream(overResult, Row.class).print("result");
        tableEnv.toRetractStream(overSqlResult, Row.class).print("sql");
        env.execute();
    }
}
```

测试记录:
