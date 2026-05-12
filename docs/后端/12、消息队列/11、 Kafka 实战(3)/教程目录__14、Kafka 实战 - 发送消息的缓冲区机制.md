# 14、Kafka 实战 - 发送消息的缓冲区机制
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/14.html
- 分类：消息队列
- 分组：教程目录
## 发送消息的缓冲区机制

kafka默认会创建⼀个消息缓冲区，⽤来存放要发送的消息，缓冲区是32m

```java
props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432); 
```

kafka本地线程会去缓冲区中⼀次拉16k的数据，发送到broker

```java
props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
```

如果线程拉不到16k的数据，间隔10ms也会将已拉到的数据发到broker

```java
props.put(ProducerConfig.LINGER_MS_CONFIG, 10);
```

### CountDownLatch

> 当CountDownLatch变为0时，才能结束进程，否则等待子线程将数字减为0

```java
package com.example.kafka;
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
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
        //kafka默认会创建⼀个消息缓冲区，⽤来存放要发送的消息，缓冲区是32m
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432);
        //kafka本地线程会去缓冲区中⼀次拉16k的数据，发送到broker
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
        //如果线程拉不到16k的数据，间隔10ms也会将已拉到的数据发到broker
        props.put(ProducerConfig.LINGER_MS_CONFIG, 10);
        /*
        ack = 0 kafka-cluster不需要任何的broker收到消息，就⽴即返回ack给⽣产者，最容易丢消息的，效率是最⾼的
        ack=1（默认）： 多副本之间的leader已经收到消息，并把消息写⼊到本地的log中，才会返回ack给⽣产者，性能和安全性是最均衡的
        ack=-1/all。⾥⾯有默认的配置min.insync.replicas=2(默认为1，推荐配置⼤于等于2)，此时就需要leader和⼀个follower同步完后，
        才会返回ack给⽣产者（此时集群中有2个broker已完成数据的接收），这种⽅式最安全，但性能最差。
         */
        props.put(ProducerConfig.ACKS_CONFIG, "1");
        /*
         发送失败会重试，默认重试间隔100ms，重试能保证消息发送的可靠性，但是也可能造成消息重复发送，
         ⽐如⽹络抖动，所以需要在接收者那边做好消息接收的幂等性处理
         */
        props.put(ProducerConfig.RETRIES_CONFIG, 3);
        //重试间隔设置
        props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, 300);
        //2.创建⽣产消息的客户端，传⼊参数
        Producer<String, String> producer = new KafkaProducer<>(props);
//        //3.创建消息
//        //key：作⽤是决定了往哪个分区上发，value：具体要发送的消息内容
//        ProducerRecord<String, String> producerRecord = new ProducerRecord<>
//                (TOPIC_NAME, 1, "key1", "hello, kafka");
//
//        //4.同步发送消息,得到消息发送的元数据并输出
//        RecordMetadata metadata = producer.send(producerRecord).get();
//        System.out.println("同步⽅式发送消息结果：" + "topic-" +
//                metadata.topic() + "|partition-" + metadata.partition()
//                + "|offset-" + metadata.offset());
//
//        Thread.sleep(10000);
        int msgNum = 5;
        final CountDownLatch countDownLatch = new CountDownLatch(msgNum);
        for (int i = 0; i < 5; i++) {
            //key：作⽤是决定了往哪个分区上发，value：具体要发送的消息内容
            ProducerRecord<String, String> producerRecord = new ProducerRecord<>
                    (TOPIC_NAME, "key-" + i, "hello, kafka");
            //5.异步发送消息
            producer.send(producerRecord, new Callback() {
                public void onCompletion(RecordMetadata metadata, Exception exception) {
                    if (exception != null) {
                        System.err.println("发送消息失败：" +
                                exception.getStackTrace());
                    }
                    if (metadata != null) {
                        System.out.println("异步⽅式发送消息结果：" + "topic-" +
                                metadata.topic() + "|partition-" + metadata.partition()
                                + "|offset-" + metadata.offset());
                    }
                    countDownLatch.countDown();
                }
            });
        }
        countDownLatch.await(5, TimeUnit.SECONDS);
        producer.close();
    }
}
```
