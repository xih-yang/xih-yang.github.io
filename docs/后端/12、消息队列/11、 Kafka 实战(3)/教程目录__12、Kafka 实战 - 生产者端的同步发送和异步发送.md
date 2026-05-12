# 12、Kafka 实战 - 生产者端的同步发送和异步发送
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/12.html
- 分类：消息队列
- 分组：教程目录
## 生产者端的同步发送和异步发送

### 生产者的同步发送

如果⽣产者发送消息没有收到ack，⽣产者会阻塞，阻塞到3s的时间，如果还没有收到消息，会进⾏重试。重试的次数3次。

```java
RecordMetadata metadata = producer.send(producerRecord).get();
System.out.println("同步⽅式发送消息结果：" + "topic-" +
    metadata.topic() + "|partition-" + metadata.partition() + "|offset-" + metadata.offset());
```

### 生产者的异步发送消息

异步发送，⽣产者发送完消息后就可以执⾏之后的业务，broker在收到消息后异步调⽤⽣产者提供的callback回调⽅法。

```java
//5.异步发送消息
producer.send(producerRecord, new Callback() {
    public void onCompletion(RecordMetadata metadata, Exception exception) {
        if (exception != null) {
            System.err.println("发送消息失败：" +
                exception.getStackTrace());
        }
        if (metadata != null) {
            System.out.println("异步⽅式发送消息结果：" + "topic-" +
                metadata.topic() + "|partition-" + metadata.partition() + "|offset-" + metadata.offset());
        }
    }
});
```

### 测试

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
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "81.68.232.188:9092,81.68.232.188:9093,81.68.232.188:9094");
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
                (TOPIC_NAME,1, "key1", "hello, kafka");
        //4.发送消息,得到消息发送的元数据并输出
        // RecordMetadata metadata = producer.send(producerRecord).get();
//        System.out.println("同步⽅式发送消息结果：" + "topic-" +
//                metadata.topic() + "|partition-" + metadata.partition()
//                + "|offset-" + metadata.offset());
        //5.异步发送消息
        producer.send(producerRecord, new Callback() {
            public void onCompletion(RecordMetadata metadata, Exception exception) {
                if (exception != null) {
                    System.err.println("发送消息失败：" +
                            exception.getStackTrace());
                }
                if (metadata != null) {
                    System.out.println("异步⽅式发送消息结果：" + "topic-" +
                            metadata.topic() + "|partition-" + metadata.partition() + "|offset-" + metadata.offset());
                }
            }
        });
        Thread.sleep(100000);
    }
}
```

#### 注意

### 总结

异步发送会存在数据丢失的问题，同步发送更为常用
