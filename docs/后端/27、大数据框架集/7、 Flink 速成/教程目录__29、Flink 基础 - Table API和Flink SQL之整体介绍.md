# 29、Flink 基础 - Table API和Flink SQL之整体介绍
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/29.html
- 分类：大数据框架
- 分组：教程目录
## 一、整体概述

## 1.1 什么是 Table API 和 Flink SQL

Flink本身是批流统一的处理框架，所以Table API和 SQL，就是批流统一的上层处理 API。目前 功能尚未完善 ，处于活跃的开发阶段。

Table API是一套内嵌在 一套内嵌在 一套内嵌在 Java和 Scala语言中的 语言中的 查询 API，它允许我们 以非常直观的方式 组合来自一些关系运算符的查询 （比如 （比如 select、filter和 join）。 而对于 Flink SQL，就是直接可以在代码中写中写 SQL，来实现一些查询（ Query）操作。 Flink的 SQL支持 ，基于实现 基于实现 了 SQL标 准的 Apache Calcite（Apache开源 SQL解析工具） 。

无论输入是批 输入还是流 式输入，在 这两套 这两套 API中，指定的查询都具有相同语义，得 到相同的结果。

## 1.2 需要引入的pom依赖

Table API和 SQL需要引入的依赖有两个：planner和 bridge。

```java
<!-- Table API 和 Flink SQL -->
<dependency>
  <groupId>org.apache.flink</groupId>
  <artifactId>flink-table-planner_2.11</artifactId>
  <version>1.9.0</version>
</dependency>
<dependency>
  <groupId>org.apache.flink</groupId>
  <artifactId>flink-table-api-java-bridge_2.11</artifactId>
  <version>1.9.0</version>
</dependency>
```

```xml
<!-- Table API 和 Flink SQL -->
<dependency>
  <groupId>org.apache.flink</groupId>
  <artifactId>flink-table-planner-blink_2.11</artifactId>
  <version>1.9.0</version>
</dependency>
```

flink-table-planner：planner计划器， 是 table API最主要的部分，提供了运行时环境和生成程序执行计划的 planner；

flink-table-api-java-bridge：bridge桥接器，主要负责 table API和 DataStream/DataSet API的连接支持，按照语言分 java和 scala。

这里的两个依赖，是IDE环境下运行需要 环境下需要 添加的；如果是生产环境， lib目录下默认已经有了 planner，就只需要有 ， bridge就可以了。

当然，如果想使用户自定义函数，或是跟 想使用户自定义函数，或是跟kafka做连接，需需要有一个 SQL client，这个 包含在 包含在 flink-table-common里。

## 1.3 两种 planner（old & blink）的区别

**1、** 批流统一：Blink将批处理作业，视为流式处理的特殊情况所以，blink不支持表和DataSet之间的转换，批处理作业将不转换为DataSet应用程序，而是跟流处理一样，转换为DataStream程序来处理；

**2、** 因为批流统一,Blinkplanner也不支持BatchTableSource，而使用有界的StreamTableSource代替；

**3、** Blinkplanner只支持全新的目录，不支持已弃用的ExternalCatalog；

**4、** 旧planner和Blinkplanner的FilterableTableSource实现不兼容旧的planner会把PlannerExpressions下推到filterableTableSource中，而blink；

planner则会把Expressions下推.
**5、** 基于字符串的键值配置选项仅适用于Blinkplanner.；

**6、** PlannerConfig在两个planner中的实现不同；

**1、** Blinkplanner会将多个sink优化在一个DAG中(仅在TableEnvironment上受支持，而在StreamTableEnvironment上不受支持)而旧planner的优化总是将每一个sink放在一个新的DAG中，其中所有的DAG彼此独立；

**2、** 旧的planner不支持目录统计，而Blinkplanner支持；

## 二、Table API和Flink SQL 测试样例

代码:

```java
package org.flink.tableapi;
import org.flink.beans.SensorReading;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.java.StreamTableEnvironment;
import org.apache.flink.types.Row;
public class TableTest1_Example {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        // 1. 读取数据
        DataStreamSource<String> inputStream = env.readTextFile("C:\\Users\\Administrator\\IdeaProjects\\FlinkStudy\\src\\main\\resources\\sensor.txt");
        // 2. 转换成POJO
        DataStream<SensorReading> dataStream = inputStream.map(line -> {
            String[] fields = line.split(",");
            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
        });
        // 3. 创建表环境
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
        // 4. 基于流创建一张表
        Table dataTable = tableEnv.fromDataStream(dataStream);
        // 5. 调用table API进行转换操作
        Table resultTable = dataTable.select("id, temperature")
                .where("id = 'sensor_1'");
        // 6. 执行SQL
        Table sqlTable = dataTable.select("id, temperature");
        tableEnv.registerTable("sensor", sqlTable);
        // Flink 1.10之后可以生产一个临时视图，无需上面那么麻烦
        // tableEnv.createTemporaryView("sensor", dataTable);
        String sql = "select id, temperature from sensor where id = 'sensor_1'";
        Table resultSqlTable = tableEnv.sqlQuery(sql);
        tableEnv.toAppendStream(resultTable, Row.class).print("result");
        tableEnv.toAppendStream(resultSqlTable, Row.class).print("sql");
        env.execute();
    }
}
```

测试记录:
