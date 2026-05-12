# 05、Kafka 实战 - Java 操作 Kafka
- 来源：https://ddkk.com/zhuanlan/mq/kafka/2/5.html
- 分类：消息队列
- 分组：教程目录
java操作kafka非常的简单，然后kafka也提供了很多缺省值，一般情况下我们不需要修改太多的参数就能使用。下面我贴出代码。

### 一、创建消息队列

```java
kafka-topics.sh --create --zookeeper 192.168.56.137:2181 --topic demo8 --replication-factor 1 --partitions 1
```

### 二、pom.xml

```java
<!-- https://mvnrepository.com/artifact/org.apache.kafka/kafka-clients -->
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-clients</artifactId>
    <version>2.1.1</version>
</dependency>
```

### 三、生产者

```java
package com.njbdqn.services;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import java.util.Properties;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @aim：生产者：往Demo8消息队列写入消息
 */
public class MyProducer {
    public static void main(String[] args) {
        // 定义配置信息
        Properties prop = new Properties();
        // kafka地址，多个地址用逗号分割  "192.168.23.76:9092,192.168.23.77:9092"
        prop.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,"192.168.56.137:9092");
        prop.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        prop.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,StringSerializer.class);
        KafkaProducer<String,String> prod = new KafkaProducer<String, String>(prop);
        // 发送消息
        try {
            for(int i=0;i<10;i++) {
                // 生产者记录消息
                ProducerRecord<String, String> pr = new ProducerRecord<String, String>("demo8", "hello world"+i);
                prod.send(pr);
                Thread.sleep(500);
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            prod.close();
        }
    }
}
```

注意：

**1、** kafka如果是集群，多个地址用逗号分割(,)；

**2、** Properties的put方法，第一个参数可以是字符串，如:p.put(“bootstrap.servers”,“192.168.23.76:9092”)；

**3、** kafkaProducer.send(record)可以通过返回的Future来判断是否已经发送到kafka，增强消息的可靠性同时也可以使用send的第二个参数来回调，通过回调判断是否发送成功；

**4、** p.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,StringSerializer.class);设置序列化类，可以写类的全路径；

### 四、消费者

```java
package com.njbdqn.services;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collections;
import java.util.Properties;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @aim：消费者：读取kafka数据
 */
public class MyConsumer {
    public static void main(String[] args) {
        Properties prop = new Properties();
        prop.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "192.168.56.137:9092");
        prop.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        prop.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        prop.put("session.timeout.ms", "30000");
        //消费者是否自动提交偏移量，默认是true 避免出现重复数据 设为false
        prop.put("enable.auto.commit", "false");
        prop.put("auto.commit.interval.ms", "1000");
        //auto.offset.reset 消费者在读取一个没有偏移量的分区或者偏移量无效的情况下的处理
        //earliest 在偏移量无效的情况下 消费者将从起始位置读取分区的记录
        //latest 在偏移量无效的情况下 消费者将从最新位置读取分区的记录
        prop.put("auto.offset.reset", "earliest");
        // 设置组名
        prop.put(ConsumerConfig.GROUP_ID_CONFIG, "group_4");
        KafkaConsumer<String, String> con = new KafkaConsumer<String, String>(prop);
        con.subscribe(Collections.singletonList("demo8"));
        while (true) {
            ConsumerRecords<String, String> records = con.poll(Duration.ofSeconds(100));
            for (ConsumerRecord<String, String> rec : records) {
                System.out.println(String.format("offset:%d,key:%s,value:%s", rec.offset(), rec.key(), rec.value()));
            }
        }
    }
}
```

注意：

**1、** 订阅消息可以订阅多个主题；

**2、** ConsumerConfig.GROUP_ID_CONFIG表示消费者的分组，kafka根据分组名称判断是不是同一组消费者，同一组消费者去消费一个主题的数据的时候，数据将在这一组消费者上面轮询；

**3、** 主题涉及到分区的概念，同一组消费者的个数不能大于分区数因为：一个分区只能被同一群组的一个消费者消费出现分区小于消费者个数的时候，可以动态增加分区；

**4、** 注意和生产者的对比，Properties中的key和value是反序列化，而生产者是序列化；
