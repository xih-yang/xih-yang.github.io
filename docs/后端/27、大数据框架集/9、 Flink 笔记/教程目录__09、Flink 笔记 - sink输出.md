# 09、Flink 笔记 - sink输出
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/5/9.html
- 分类：大数据框架
- 分组：教程目录
## 一、概述

Flink输出主要通过sink完成，比如 dataStream.addSink(new MySink(XXX))。Flink集成了一些框架sink，[官网Sink介绍](https://ci.apache.org/projects/flink/flink-docs-release-1.8/dev/connectors/)

## 二、kafka sink

## 2.1、依赖

```java
<dependency>
 <groupId>org.apache.flink</groupId>
 <artifactId>flink-connector-kafka-0.11_2.12</artifactId>
 <version>1.10.1</version>
</dependency>
```

## 2.2、案例

```java
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer011;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaProducer011;
import java.util.Properties;
public class Sink_Kafka {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        // kafka 配置
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", "192.168.200.102:9092,192.168.200.102:9092,192.168.200.104:9092");
        properties.setProperty("group.id", "flink-kafka-source");
        properties.setProperty("key.deserializer",
                "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("value.deserializer",
                "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("auto.offset.reset", "latest");
        DataStreamSource<String> inputDataStream = env.addSource(new FlinkKafkaConsumer011<String>(
                "sensor",
                new SimpleStringSchema(),
                properties
        ));
        String brokerlist = "192.168.200.102:9092,192.168.200.103:9092,192.168.200.104:9092";
        String topic = "flink-kafka-sink";
        inputDataStream.addSink(new FlinkKafkaProducer011<String>(brokerlist, topic, new SimpleStringSchema()));
        env.execute();
    }
}
```

## 三、redis sink

## 3.1、依赖

```java
 <dependency>
            <groupId>org.apache.bahir</groupId>
            <artifactId>flink-connector-redis_2.11</artifactId>
            <version>1.0</version>
 </dependency>
```

## 3.2、案例

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.redis.RedisSink;
import org.apache.flink.streaming.connectors.redis.common.config.FlinkJedisPoolConfig;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommand;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommandDescription;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisMapper;
public class Sink_Redis {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        // 构建配置
        FlinkJedisPoolConfig flinkJedisPoolConfig = new FlinkJedisPoolConfig.Builder()
                .setHost("192.168.200.104")
                .setPort(7003)
                .build();
        // 创建 RedisSink
        inputDataStream.addSink(new RedisSink<>(flinkJedisPoolConfig, new CustomRedisSink()));
        env.execute();
    }
    public static class CustomRedisSink implements RedisMapper<SensorReading> {
        // 保存到 redis 的操作 比如 set hset ...
        @Override
        public RedisCommandDescription getCommandDescription() {
            // 执行哈希 hset sensor sensor_id senor_temperature
            return new RedisCommandDescription(RedisCommand.HSET, "sensor");
        }
        // 获取哈希的 key
        @Override
        public String getKeyFromData(SensorReading sensorReading) {
            return sensorReading.getId();
        }
        // 获取哈希的 value
        @Override
        public String getValueFromData(SensorReading sensorReading) {
            return sensorReading.getTemperature().toString();
        }
    }
}
```

## 四、ElasticSearch sink

## 4.1、依赖

```java
<dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-connector-elasticsearch6_2.12</artifactId>
            <version>1.10.1</version>
</dependency>
```

## 4.2、案例

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.api.common.functions.RuntimeContext;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.elasticsearch.ElasticsearchSinkFunction;
import org.apache.flink.streaming.connectors.elasticsearch.RequestIndexer;
import org.apache.flink.streaming.connectors.elasticsearch6.ElasticsearchSink;
import org.apache.http.HttpHost;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.client.Requests;
import java.util.ArrayList;
import java.util.HashMap;
public class Sink_ElasticSearch {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        // 配置 es 主机
        ArrayList<HttpHost> httpHosts = new ArrayList<>();
        httpHosts.add(new HttpHost("192.168.200.102", 9200));
        httpHosts.add(new HttpHost("192.168.200.103", 9200));
        httpHosts.add(new HttpHost("192.168.200.104", 9200));
        // 定义 es sink
        inputDataStream.addSink(new ElasticsearchSink.Builder<SensorReading>(httpHosts, new CustomElasticSearchSink()).build());
        env.execute();
    }
    public static class CustomElasticSearchSink implements ElasticsearchSinkFunction<SensorReading> {
        @Override
        public void process(SensorReading sensorReading, RuntimeContext runtimeContext, RequestIndexer requestIndexer) {
            // 封装写入数据
            HashMap<String, String> dataSource = new HashMap<>();
            dataSource.put("id", sensorReading.getId());
            dataSource.put("ts", sensorReading.getTimestamp().toString());
            dataSource.put("temp", sensorReading.getTemperature().toString());
            // 创建 request
            IndexRequest indexRequest = Requests.indexRequest()
                    .index("sensor")
                    .type("doc")
                    .source(dataSource);
            // 添加 request
            requestIndexer.add(indexRequest);
        }
    }
}
```

## 五、自定义 sink （jdbc）

## 5.1、依赖

```java
<dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.44</version>
</dependency>
```

## 5.2、案例

```java
import com.tan.flink.bean.SensorReading;
import com.tan.flink.source.SourceFromCustom;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.sink.RichSinkFunction;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
public class Sink_Custom_MySQL {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<SensorReading> inputDataStream = env.addSource(new SourceFromCustom.CustomSource());
        inputDataStream.addSink(new CustomJdbcSink());
        env.execute();
    }
    public static class CustomJdbcSink extends RichSinkFunction<SensorReading> {
        Connection conn = null;
        PreparedStatement insertStmt = null;
        PreparedStatement updateStmt = null;
        // open 主要是创建连接
        @Override
        public void open(Configuration parameters) throws Exception {
            conn = DriverManager.getConnection("jdbc:mysql://192.168.200.103:3306/flink",
                    "root", "123456");
            // 创建预编译器，有占位符，可传入参数
            insertStmt = conn.prepareStatement("INSERT INTO sensor (id, temp) VALUES (?, ?)");
            updateStmt = conn.prepareStatement("UPDATE sensor SET temp = ? WHERE id = ?");
        }
        // 调用连接，执行 sql
        @Override
        public void invoke(SensorReading value, Context context) throws Exception {
            // 执行更新语句，注意不要留 super
            updateStmt.setDouble(1, value.getTemperature());
            updateStmt.setString(2, value.getId());
            updateStmt.execute();
            // 如果刚才 update 语句没有更新，那么插入
            if (updateStmt.getUpdateCount() == 0) {
                insertStmt.setString(1, value.getId());
                insertStmt.setDouble(2, value.getTemperature());
                insertStmt.execute();
            }
        }
        @Override
        public void close() throws Exception {
            insertStmt.close();
            updateStmt.close();
            conn.close();
        }
    }
}
```
