# 11、Kafka 实战 - Kafka消费者及消费者组案例
- 来源：https://ddkk.com/zhuanlan/mq/kafka/4/11.html
- 分类：消息队列
- 分组：教程目录
### 1 独立消费者案例（订阅主题）

**1、** 需求：创建一个独立消费者，消费 first 主题中数据。

**2、** 分析：

**注意：在消费者 API 代码中必须配置消费者组 id。命令行启动消费者不填写消费者组 id 会被自动填写随机的消费者组 id。**

步骤：
**1、** 创建包名：com.study.kafka.consumer

**2、** 创建类：CustomConsumer

```java
package com.study.kafka.consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Properties;
public class CustomConsumer {
    public static void main(String[] args) {
        //0.配置
        Properties properties = new Properties();
        //连接
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,"hadoop102:9092,hadoop103:9092");
        //配置反序列化
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,StringDeserializer.class.getName());
        //配置消费者组（组名任意取）
        properties.put(ConsumerConfig.GROUP_ID_CONFIG,"test1");
        //修改分区分配策略
        properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,"org.apache.kafka.clients.consumer.StickyAssignor");
        //1.创建消费者对象
        KafkaConsumer<String, String> kafkaConsumer = new KafkaConsumer<>(properties);
        //2.订阅主题，注册要消费的主题，可以有多个
        ArrayList<String> topics = new ArrayList<>();
        topics.add("first1");
        kafkaConsumer.subscribe(topics);
        //3.消费，拉取数据，打印
        while (true){
            //设置1s消费一批数据
            ConsumerRecords<String, String> consumerRecords = kafkaConsumer.poll(Duration.ofSeconds(1));
            for (ConsumerRecord<String, String> consumerRecord : consumerRecords) {
                System.out.println(consumerRecord);
            }
        }
    }
}
```

**3、** 在 IDEA 中执行消费者程序。

**4、** 在 Kafka 集群控制台，创建 Kafka 生产者，并输入数据。

```java
bin/kafka-console-producer.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --topic first
> hello
```

**5、** 在 IDEA 控制台观察接收到的数据。

### 2 独立消费者案例（订阅分区）

**1、** 需求：创建一个独立消费者，消费 first 主题 0 号分区的数据。

**2、** 分析：

步骤：
**1、** 创建类CustomConsumerPartition

```java
package com.study.kafka.consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Properties;
public class CustomConsumerPartition {
    public static void main(String[] args) {
        //0.配置
        Properties properties = new Properties();
        //连接
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,"hadoop102:9092,hadoop103:9092");
        //配置反序列化
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,StringDeserializer.class.getName());
        //配置消费者组（组名任意取）
        properties.put(ConsumerConfig.GROUP_ID_CONFIG,"test");
        //1.创建消费者对象
        KafkaConsumer<String, String> kafkaConsumer = new KafkaConsumer<>(properties);
        //2.订阅主题，注册要消费的主题，可以有多个
        //消费某个主题的某个分区数据，订阅对应的分区
        ArrayList<TopicPartition> topicPartitions = new ArrayList<>();
        topicPartitions.add(new TopicPartition("first",0));
        kafkaConsumer.assign(topicPartitions);
        //3.消费，拉取数据，打印
        while (true){
            //设置1s消费一批数据
            ConsumerRecords<String, String> consumerRecords = kafkaConsumer.poll(Duration.ofSeconds(1));
            for (ConsumerRecord<String, String> consumerRecord : consumerRecords) {
                System.out.println(consumerRecord);
            }
        }
    }
}
```

**2、** 在 IDEA 中执行消费者程序。

**3、** 在 IDEA 中执行生产者程序 CustomProducerCallback()在控制台观察生成几个 0 号分区的数据。

### 3 消费者组案例

**1、** 需求：测试同一个主题的分区数据，只能由一个消费者组中的一个消费。

**2、** 分析：

步骤：
**1、** 复制两份CustomConsumer的代码，并在 IDEA 同时启动，即一个消费者组中有三个消费者。

**2、** 在 IDEA 中执行生产者程序 CustomProducerCallback()在控制台观察。
