# 08、Kafka 消费者组示例
- 来源：https://ddkk.com/zhuanlan/mq/kafka/1/8.html
- 分类：消息队列
- 分组：教程目录
消费群是多线程或多机器的Apache Kafka主题。

## 消费者群体

- 消费者可以使用相同的 group.id 加入群组
- 一个组的最大并行度是组中的消费者数量←不是分区。
- Kafka将主题的分区分配给组中的使用者，以便每个分区仅由组中的一个使用者使用。
- Kafka保证消息只能被组中的一个消费者读取。
- 消费者可以按照消息存储在日志中的顺序查看消息。

### 重新平衡消费者

添加更多进程/线程将导致Kafka重新平衡。 如果任何消费者或代理无法向ZooKeeper发送心跳，则可以通过Kafka集群重新配置。 在此重新平衡期间，Kafka将分配可用分区到可用线程，可能将分区移动到另一个进程。

```java
import java.util.Properties;
import java.util.Arrays;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.ConsumerRecord;
public class ConsumerGroup {
   public static void main(String[] args) throws Exception {
      if(args.length < 2){
         System.out.println("Usage: consumer <topic> <groupname>");
         return;
      }
      String topic = args[0].toString();
      String group = args[1].toString();
      Properties props = new Properties();
      props.put("bootstrap.servers", "localhost:9092");
      props.put("group.id", group);
      props.put("enable.auto.commit", "true");
      props.put("auto.commit.interval.ms", "1000");
      props.put("session.timeout.ms", "30000");
      props.put("key.deserializer",          
         "org.apache.kafka.common.serializa-tion.StringDeserializer");
      props.put("value.deserializer", 
         "org.apache.kafka.common.serializa-tion.StringDeserializer");
      KafkaConsumer<String, String> consumer = new KafkaConsumer<String, String>(props);
      consumer.subscribe(Arrays.asList(topic));
      System.out.println("Subscribed to topic " &plus; topic);
      int i = 0;
      while (true) {
         ConsumerRecords<String, String> records = con-sumer.poll(100);
            for (ConsumerRecord<String, String> record : records)
               System.out.printf("offset = %d, key = %s, value = %s\n", 
               record.offset(), record.key(), record.value());
      }     
   }  
}
```

### 汇编

```java
javac -cp “/path/to/kafka/kafka_2.11-0.9.0.0/libs/*" ConsumerGroup.java
```

### 执行

```java
>>java -cp “/path/to/kafka/kafka_2.11-0.9.0.0/libs/*":. 
ConsumerGroup <topic-name> my-group
>>java -cp "/home/bala/Workspace/kafka/kafka_2.11-0.9.0.0/libs/*":. 
ConsumerGroup <topic-name> my-group
```

在这里，我们为两个消费者创建了一个示例组名称为 my-group 。 同样，您可以在组中创建您的组和消费者数量。

### 输入

打开生产者CLI并发送一些消息 –

```java
Test consumer group 01
Test consumer group 02
```

### 第一个过程的输出

```java
Subscribed to topic Hello-kafka
offset = 3, key = null, value = Test consumer group 01
```

### 第二个过程的输出

```java
Subscribed to topic Hello-kafka
offset = 3, key = null, value = Test consumer group 02
```

现在希望你能通过使用Java客户端演示了解SimpleConsumer和ConsumeGroup。 现在，您了解如何使用Java客户端发送和接收消息。 让我们在下一章继续Kafka与大数据技术的集成。
