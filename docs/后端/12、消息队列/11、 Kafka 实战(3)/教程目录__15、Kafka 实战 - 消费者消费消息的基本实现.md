# 15、Kafka 实战 - 消费者消费消息的基本实现
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/15.html
- 分类：消息队列
- 分组：教程目录
## 消费者消费消息的基本实现

### 测试代码

```java
package com.example.kafka;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import java.time.Duration;
import java.util.Arrays;
import java.util.Properties;
public class MySimpleConsumer {
    private final static String TOPIC_NAME = "test";
    private final static String CONSUMER_GROUP_NAME = "testGroup";
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,
                "81.68.232.188:9092,81.68.232.188:9093,81.68.232.188:9094");
        // 消费分组名
        props.put(ConsumerConfig.GROUP_ID_CONFIG, CONSUMER_GROUP_NAME);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
                StringDeserializer.class.getName());
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
                StringDeserializer.class.getName());
        //1.创建⼀个消费者的客户端
        KafkaConsumer< String, String > consumer = new KafkaConsumer < String,
                String > (props);
        //2. 消费者订阅主题列表
        consumer.subscribe(Arrays.asList(TOPIC_NAME));
        while (true) {
            /*
             * 3.poll() API 是拉取消息的⻓轮询
             */
            ConsumerRecords< String, String > records =
                    consumer.poll(Duration.ofMillis(10000));
            for (ConsumerRecord< String, String > record: records) {
                //4.打印消息
                System.out.printf("收到消息：partition = %d,offset = %d, key = %s, value = %s%n ", record.partition(),
                        record.offset(), record.key(), record.value());
            }
        }
    }
}
```

### 配置日志打印

```java
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <logger name="org.apache.kafka.clients" level="info" />
</configuration>
```

### 生产者发送消息

### 消费者默认消费最新消息
