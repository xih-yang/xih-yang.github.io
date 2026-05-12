# 11、Kafka 实战 - Java中Kafka生产者的基本实现
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/11.html
- 分类：消息队列
- 分组：教程目录
## Java中Kafka生产者的基本实现

### 生产者的基本实现

#### 引入依赖

```java
<dependency>
 <groupId>org.apache.kafka</groupId>
 <artifactId>kafka-clients</artifactId>
 <version>2.4.1</version>
</dependency>
```

#### 具体实现

设置参数-》创建生产者客户端-》创建消息-》发送消息

```java
package com.example.kafka;
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import java.util.Properties;
import java.util.concurrent.ExecutionException;
public class MySimpleProducer {
    private final static String TOPIC_NAME = "test";
    public static void main(String[] args) throws ExecutionException,
            InterruptedException {
        //1.设置参数
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,
         "81.68.232.188:9092,81.68.232.188:9093,81.68.232.188:9094");
        //把发送的key从字符串序列化为字节数组
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,
                StringSerializer.class.getName());
        //把发送消息value从字符串序列化为字节数组
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,
                StringSerializer.class.getName());
        //2.创建⽣产消息的客户端，传⼊参数
        Producer<String, String> producer = new KafkaProducer<>(props);
        //3.创建消息
        //key：作⽤是决定了往哪个分区上发，value：具体要发送的消息内容
        ProducerRecord<String, String> producerRecord = new ProducerRecord<>
                (TOPIC_NAME, "key1", "hello, kafka");
        //4.发送消息,得到消息发送的元数据并输出
        RecordMetadata metadata = producer.send(producerRecord).get();
        System.out.println("同步⽅式发送消息结果：" + "topic-" +
                metadata.topic() + "|partition-" + metadata.partition()
                + "|offset-" + metadata.offset());
    }
}
```

#### 指定发送主题分区

```java
ProducerRecord < String, String > producerRecord = new
ProducerRecord < String, String > (TOPIC_NAME, 0, 
order.getOrderId().toString(), JSON.toJSONString(order));
```
