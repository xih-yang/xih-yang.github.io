# 42、Flink报错案例 1-本地运行Flink报错java.lang.NoClassDefFoundError
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/42.html
- 分类：大数据框架
- 分组：教程目录
## 一、问题描述

**环境介绍**

Flink版本 1.9.0

Kafka版本 2.12

**代码:**

```java
package org.example;
/*
 * @remark  Flink Souce之Kafka
 */
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import java.util.Properties;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumerBase;
public class SourceTest3_Kafka {
    public static void main(String[] args) throws Exception{
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", "10.31.1.124:9092,10.31.1.125:9092,10.31.1.126:9092");
        properties.setProperty("group.id", "consumer-group");
        properties.setProperty("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("auto.offset.reset", "latest");
        // 从Kafka读取数据
        DataStream<String> dataStream = env.addSource( new FlinkKafkaConsumer<String>("sensor3", new SimpleStringSchema(), properties));
        // 打印输出
        dataStream.print();
        env.execute();
    }
}
```

**运行报错**

java.lang.NoClassDefFoundError: org/apache/flink/streaming/api/functions/source/SourceFunction

## 二、解决方案

重新运行，问题解决
