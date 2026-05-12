# 13、Flink 基础 - Source之从Kafka读取
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/2/13.html
- 分类：大数据框架
- 分组：教程目录
## 一、环境介绍

**环境介绍**

本地测试环境搭建了CDH 6.3集群，集成了Kafka和Flink

**Maven配置**

从官网找到的maven配置如下:

```xml
<dependency>
  <groupId>org.apache.flink</groupId>
  <artifactId>flink-connector-kafka_2.11</artifactId>
  <version>1.9.0</version>
</dependency>
```

## 二、代码

kafka_producer

```java
package org.example;
/**
 * @remark  kafka生产者
 */
import java.util.Properties;
import java.util.Random;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
public class kafka_producer {
    public static String topic = "sensor3";//定义主题
    public static void main(String[] args) throws Exception {
        Properties p = new Properties();
        p.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "10.31.1.124:9092,10.31.1.125:9092,10.31.1.126:9092");//kafka地址，多个地址用逗号分割
        p.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        p.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        KafkaProducer<String, String> kafkaProducer = new KafkaProducer<>(p);
        try {
            while (true) {
                String msg = "Hello," + new Random().nextInt(100);
                ProducerRecord<String, String> record = new ProducerRecord<String, String>(topic, msg);
                kafkaProducer.send(record);
                System.out.println("消息发送成功:" + msg);
                Thread.sleep(10000);
            }
        } finally {
            kafkaProducer.close();
        }
    }
}
```

SourceTest3_Kafka

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

## 三、打包代码并执行

**运行命令:**

```java
flink run -m yarn-cluster -c org.example.SourceTest3_Kafka FlinkStudy-1.0-SNAPSHOT.jar
```

**本地运行截图:**

**远程执行:**

因为远程执行没有输出，这个地方不太好显示，略过
