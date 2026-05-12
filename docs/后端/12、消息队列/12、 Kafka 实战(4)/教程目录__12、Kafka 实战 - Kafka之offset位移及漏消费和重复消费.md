# 12、Kafka 实战 - Kafka之offset位移及漏消费和重复消费
- 来源：https://ddkk.com/zhuanlan/mq/kafka/4/12.html
- 分类：消息队列
- 分组：教程目录
### 1 offset的默认维护位置

Kafka0.9版本之前， consumer默认将offset保存在Zookeeper中。从0.9版本开始，consumer默认将offset保存在Kafka一个内置的topic中，该topic为 consumer_offsets。

consumer_offsets 主题里面采用 key 和 value 的方式存储数据。key 是 group.id+topic+分区号，value 就是当前 offset 的值。每隔一段时间， kafka 内部会对这个 topic 进行 compact，也就是每个group.id+topic+分区号就保留最新数据。

消费offset案例：

**1、** consumer_offsets 作为Kafka 中的 topic，那就可以通过消费者进行消费。

在配置文件 config/consumer.properties 中添加配置 exclude.internal.topics=false， 默认是 true，表示不能消费系统主题。为了查看该系统主题数据，所以该参数修改为 false，并分发。

**2、** hadoop102用命令行方式，创建一个新的topic。

```java
bin/kafka-topics.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --create --topic newtopic --partitions 2 --replication-factor 2
```

**3、** hadoop102启动生产者往 newtopic 生产数据。

```java
bin/kafka-console-producer.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --topic newtopic
```

**4、** hadoop104启动消费者消费 newtopic 数据。注意：指定消费者组名称，更好观察数据存储位置（key 是 group.id+topic+分区号）。

```java
bin/kafka-console-consumer.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --topic newtopic --group test
```

**5、** hadoop103查看消费者消费主题 consumer_offsets。

```java
bin/kafka-console-consumer.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --topic consumer_offsets --consumer.config config/consumer.properties --formatter "kafka.coordinator.group.GroupMetadataManager\$OffsetsMessageFormatter" --from-beginning
```

2自动提交offset

Kafka提供了自动提交offset的功能。

低层原理：

生产者向对应的分区发送数据，之后消费者不断地主动拉取分区中的数据，每5soffset自动提交到_consumer_offsets。

消费者自动提交offset

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
public class CustomConsumerAutoOffset {
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
        //是否自动提交offset
        properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG,true);
        //提交offset的时间周期1000ms，默认5s
        properties.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG,1000);
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

依次启动CustomConsumerAutoOffset和CustomProducerCallback，观察CustomConsumerAutoOffset能不能接受到数据，能接受则说明自动提交offset功能是ok的。

### 3 手动提交offset

虽然自动提交offset十分简单便利，但由于其是基于时间提交的，开发人员难以把握offset提交的时机。因此Kafka还提供了手动提交offset的API，供用户自己掌握提交时间。

底层原理：

生产者向相应分区发送数据，消费者不断地从分区中拉取数据，拉取之后的offset得根据判断进行提交。

手动提交offset的方法有两种：分别是commitSync（同步提交）和commitAsync（异步提交）。

相同点：将**本次提交的一批数据最高的偏移量提交。**

不同点：**同步提交阻塞当前线程**，一直到提交成功才会拉取数据，并且会自动失败重试（由不可控因素导致，也会出现提交失败）；而**异步提交则没有失败重试机制，故有可能提交失败。**

**1、** commitSync（同步提交）：必须等待offset提交完毕，再去消费下一批数据。

**2、** commitAsync（异步提交） ：发送完提交offset请求后，就开始消费下一批数据了。

**1、** 手动同步提交offset

由于同步提交 offset 有失败重试机制，故更加可靠，但是由于一直等待提交结果，提交的效率比较低。

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
public class CustomConsumerByHandSync {
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
        //是否自动提交offset
        properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG,false);
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
            // 同步提交offset 
            kafkaConsumer.commitSync();
        }
    }
}
```

依次启动CustomConsumerByHandSync和CustomProducerCallback，观察CustomConsumerByHandSync能不能接受到数据，能接受则说明手动提交offset功能是ok的。

**2、** 手动异步提交offset

虽然同步提交 offset 更可靠一些，但是由于其会阻塞当前线程，直到提交成功。因此吞吐量会受到很大的影响。因此更多的情况下，会选用异步提交 offset 的方式。

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
public class CustomConsumerByHandAsync {
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
        //是否自动提交offset
        properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG,false);
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
            // 异步提交 offset
            kafkaConsumer.commitAsync();
        }
    }
}
```

依次启动CustomConsumerByHandAsync和CustomProducerCallback，观察CustomConsumerByHandAsync能不能接受到数据，能接受则说明手动提交offset功能是ok的。

### 4 指定offset消费

**auto.offset.reset = earliest | latest | none**，默认是 latest。

当Kafka 中没有初始偏移量（消费者组第一次消费）或服务器上不再存在当前偏移量时（例如该数据已被删除），使用**auto.offset.reset**。

**1、** earliest：自动将偏移量重置为最早的偏移量，即从最开始的地方进行消费–from-beginning。

**2、** latest（默认值）：自动将偏移量重置为最新偏移量，即从最后的地方进行消费。

**3、** none：如果未找到消费者组的先前偏移量，则向消费者抛出异常。

注意：每次执行完，需要修改消费者组名。

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
import java.util.HashSet;
import java.util.Properties;
import java.util.Set;
public class CustomConsumerSeek {
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
        //1.创建消费者对象
        KafkaConsumer<String, String> kafkaConsumer = new KafkaConsumer<>(properties);
        //2.订阅主题，注册要消费的主题，可以有多个
        ArrayList<String> topics = new ArrayList<>();
        topics.add("first");
        kafkaConsumer.subscribe(topics);
        //制定位置进行消费
        Set<TopicPartition> assignment = new HashSet<>();
        //保证分区分配方案已经制定完毕
        while (assignment.size() == 0){
            kafkaConsumer.poll(Duration.ofSeconds(1));
            //获取消费者分区分配信息（有了分区分配信息才能开始消费）
            assignment = kafkaConsumer.assignment();
        }
        //遍历所有分区，并制定offset从300的位置开始消费
        for (TopicPartition topicPartition : assignment) {
            kafkaConsumer.seek(topicPartition,300);
        }
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

依次启动CustomConsumerSeek和CustomProducerCallback，观察CustomConsumerSeek能不能接受到数据，能接受则说明指定位置offset消费功能是ok的。

### 4.5 指定时间消费

需求：在生产环境中，会遇到最近消费的几个小时数据异常，想重新按照时间消费。例如要求按照时间消费前一天的数据。

```java
package com.study.kafka.consumer;
import org.apache.kafka.clients.consumer.*;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import java.time.Duration;
import java.util.*;
public class CustomConsumerForTime {
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
        //1.创建消费者对象
        KafkaConsumer<String, String> kafkaConsumer = new KafkaConsumer<>(properties);
        //2.订阅主题，注册要消费的主题，可以有多个
        ArrayList<String> topics = new ArrayList<>();
        topics.add("first");
        kafkaConsumer.subscribe(topics);
        //制定位置进行消费
        Set<TopicPartition> assignment = new HashSet<>();
        //保证分区分配方案已经制定完毕
        while (assignment.size() == 0){
            kafkaConsumer.poll(Duration.ofSeconds(1));
            //获取消费者分区分配信息（有了分区分配信息才能开始消费）
            assignment = kafkaConsumer.assignment();
        }
        //把时间转换为对应的offset
        HashMap<TopicPartition, Long> timestampToSearch = new HashMap<>();
        //封装集合存储，每个分区对应一天前的数据
        for (TopicPartition topicPartition : assignment) {
            timestampToSearch.put(topicPartition,System.currentTimeMillis() - 1 * 24 * 3600 * 1000);
        }
        //获取从1天前开始消费的每个分区的offset
        Map<TopicPartition, OffsetAndTimestamp> offsets = kafkaConsumer.offsetsForTimes(timestampToSearch);
        //遍历每个分区，对每个分区设置消费时间
        for (TopicPartition topicPartition : assignment) {
            OffsetAndTimestamp offsetAndTimestamp = offsets.get(topicPartition);
            //根据时间制定开始消费的位置
            if (offsetAndTimestamp != null){
                kafkaConsumer.seek(topicPartition,offsetAndTimestamp.offset());
            }
        }
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

依次启动CustomConsumerForTime和CustomProducerCallback，观察CustomConsumerForTime能不能接受到数据，能接受则说明指定时间offset消费功能是ok的。

### 6 漏消费和重复消费

#### 6.1 重复消费

自动提交offset引起，已经消费了数据，但是offset没有提交。

例如：提交offset后的2s，消费者挂了。再次启动消费者，则从上一次提交的offset出继续消费，导致重复消费。

解决：消费者事务

### 6.2 漏消费

先提交offset后消费、设置offset为手动提交，当offset被提交时，数据还在内存中国没有落盘，此时刚好消费者线程被kill掉。因为offset已经提交，但是数据没有处理，导致这部分内存中的数据消失。

解决：消费者事务
