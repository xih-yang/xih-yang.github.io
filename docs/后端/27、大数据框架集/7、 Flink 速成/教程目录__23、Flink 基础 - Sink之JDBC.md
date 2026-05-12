# 23、Flink 基础 - Sink之JDBC
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/23.html
- 分类：大数据框架
- 分组：教程目录
## 一、Sink之JDBC概述

Flink的Sink支持的数据库:

Bahir中支持的数据库:

从上两图可以看到，Flink的Sink并支持类似MySQL的这种关系型数据库，那么如果我需要通过Flink连接MySQL，该如何操作呢?

这个时候我们可以使用Flink Sink的JDBC连接。

## 二、pom文件配置

此处，我本地MySQL版本是 8.0.19

```xml
<!-- https://mvnrepository.com/artifact/mysql/mysql-connector-java -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.19</version>
</dependency>
```

## 三、MySQL配置

新建数据库及表

```java
CREATE DATABASE flink_test DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
CREATE TABLE sensor_temp (
  id varchar(32) NOT NULL,
  temp double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

## 四、编写Java代码

```java
package org.flink.sink;
import org.flink.beans.SensorReading;
import org.example.SourceTest4_UDF;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.sink.RichSinkFunction;
import org.apache.flink.streaming.api.functions.sink.SinkFunction;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
/**
 * @remark Sink之JDBC
 */
public class SinkTest4_Jdbc {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        // 从文件读取数据
//        DataStream<String> inputStream = env.readTextFile("D:\\Projects\\BigData\\FlinkTutorial\\src\\main\\resources\\sensor.txt");
//
//        // 转换成SensorReading类型
//        DataStream<SensorReading> dataStream = inputStream.map(line -> {
//            String[] fields = line.split(",");
//            return new SensorReading(fields[0], new Long(fields[1]), new Double(fields[2]));
//        });
        DataStream<SensorReading> dataStream = env.addSource(new SourceTest4_UDF.MySensorSource());
        dataStream.addSink(new MyJdbcSink());
        env.execute();
    }
    // 实现自定义的SinkFunction
    public static class MyJdbcSink extends RichSinkFunction<SensorReading> {
        // 声明连接和预编译语句
        Connection connection = null;
        PreparedStatement insertStmt = null;
        PreparedStatement updateStmt = null;
        @Override
        public void open(Configuration parameters) throws Exception {
            connection = DriverManager.getConnection("jdbc:mysql://localhost:3306/flink_test?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai", "root", "123456");
            insertStmt = connection.prepareStatement("insert into sensor_temp (id, temp) values (?, ?)");
            updateStmt = connection.prepareStatement("update sensor_temp set temp = ? where id = ?");
        }
        // 每来一条数据，调用连接，执行sql
        @Override
        public void invoke(SensorReading value, Context context) throws Exception {
            // 直接执行更新语句，如果没有更新那么就插入
            updateStmt.setDouble(1, value.getTemperature());
            updateStmt.setString(2, value.getId());
            updateStmt.execute();
            if( updateStmt.getUpdateCount() == 0 ){
                insertStmt.setString(1, value.getId());
                insertStmt.setDouble(2, value.getTemperature());
                insertStmt.execute();
            }
        }
        @Override
        public void close() throws Exception {
            insertStmt.close();
            updateStmt.close();
            connection.close();
        }
    }
}
```

## 五、运行Flink程序查看数据

```java
mysql> select * from sensor_temp;
+-----------+-------------------+
| id        | temp              |
+-----------+-------------------+
| sensor_3  | 65.31089123002162 |
| sensor_10 | 20.23454807781744 |
| sensor_4  | 79.87349739590283 |
| sensor_1  | 68.79742249825429 |
| sensor_2  |  44.1766638371653 |
| sensor_7  | 99.47000620947128 |
| sensor_8  |  68.7360059804266 |
| sensor_5  |  69.9135258264366 |
| sensor_6  | 38.85722751176939 |
| sensor_9  | 69.97758295030204 |
+-----------+-------------------+
10 rows in set (0.00 sec)
mysql>
```
