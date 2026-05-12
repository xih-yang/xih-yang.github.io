# 47、Flink深入：Flink之TableAPI和FlinkSQL的案例四
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/47.html
- 分类：大数据框架
- 分组：教程目录
## 1. 需求

从Kafka中消费数据并过滤出状态为success的数据再写入到Kafka

数据：

```java
{"user_id": "1", "page_id":"1", "status": "success"}
{"user_id": "1", "page_id":"1", "status": "success"}
{"user_id": "1", "page_id":"1", "status": "success"}
{"user_id": "1", "page_id":"1", "status": "success"}
{"user_id": "1", "page_id":"1", "status": "fail"}
```

kafka命令：

```java
/export/server/kafka/bin/kafka-topics.sh --create --zookeeper node1:2181 --replication-factor 2 --partitions 3 --topic input_kafka
/export/server/kafka/bin/kafka-topics.sh --create --zookeeper node1:2181 --replication-factor 2 --partitions 3 --topic output_kafka
/export/server/kafka/bin/kafka-console-producer.sh --broker-list node1:9092 --topic input_kafka
/export/server/kafka/bin/kafka-console-consumer.sh --bootstrap-server node1:9092 --topic output_kafka --from-beginning
```

## 2. 代码实现

官网地址：

[Apache Flink 1.12 Documentation: Table API & SQL](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/table/)

[Apache Flink 1.12 Documentation: Apache Kafka SQL Connector](https://ci.apache.org/projects/flink/flink-docs-release-1.12/dev/table/connectors/kafka.html)

```java
package com.ddkk.sql;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.TableResult;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;
import org.apache.flink.types.Row;
public class FlinkSQL_Table_Demo06 {
    public static void main(String[] args) throws Exception {
        //1.准备环境
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        StreamTableEnvironment tEnv = StreamTableEnvironment.create(env);
        //2.Source
        TableResult inputTable = tEnv.executeSql(
                "CREATE TABLE input_kafka (\n" +
                        "  user_id BIGINT,\n" +
                        "  page_id BIGINT,\n" +
                        "  status STRING\n" +
                        ") WITH (\n" +
                        "  'connector' = 'kafka',\n" +
                        "  'topic' = 'input_kafka',\n" +
                        "  'properties.bootstrap.servers' = 'node1:9092',\n" +
                        "  'properties.group.id' = 'testGroup',\n" +
                        "  'scan.startup.mode' = 'latest-offset',\n" +
                        "  'format' = 'json'\n" +
                        ")"
        );
        TableResult outputTable = tEnv.executeSql(
                "CREATE TABLE output_kafka (\n" +
                        "  user_id BIGINT,\n" +
                        "  page_id BIGINT,\n" +
                        "  status STRING\n" +
                        ") WITH (\n" +
                        "  'connector' = 'kafka',\n" +
                        "  'topic' = 'output_kafka',\n" +
                        "  'properties.bootstrap.servers' = 'node1:9092',\n" +
                        "  'format' = 'json',\n" +
                        "  'sink.partitioner' = 'round-robin'\n" +
                        ")"
        );
        String sql = "select " +
                "user_id," +
                "page_id," +
                "status " +
                "from input_kafka " +
                "where status = 'success'";
        Table ResultTable = tEnv.sqlQuery(sql);
        DataStream<Tuple2<Boolean, Row>> resultDS = tEnv.toRetractStream(ResultTable, Row.class);
        resultDS.print();
        tEnv.executeSql("insert into output_kafka select * from "+ResultTable);
        //7.excute
        env.execute();
    }
}
```
