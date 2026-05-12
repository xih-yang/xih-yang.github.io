# 07、Kafka 简单生产者示例
- 来源：https://ddkk.com/zhuanlan/mq/kafka/1/7.html
- 分类：消息队列
- 分组：教程目录
让我们使用Java客户端创建一个用于发布和使用消息的应用程序。 Kafka生产者客户端包括以下API。

## KafkaProducer API

让我们了解本节中最重要的一组Kafka生产者API。 KafkaProducer API的中心部分是 KafkaProducer 类。 KafkaProducer类提供了一个选项，用于将其构造函数中的Kafka代理连接到以下方法。

- KafkaProducer类提供send方法以异步方式将消息发送到主题。 send()的签名如下

```java
producer.send(new ProducerRecord<byte[],byte[]>(topic, 
partition, key1, value1) , callback);
```

- **ProducerRecord** - 生产者管理等待发送的记录的缓冲区。
- **回调** - 当服务器确认记录时执行的用户提供的回调(null表示无回调)。
- KafkaProducer类提供了一个flush方法，以确保所有先前发送的消息都已实际完成。 flush方法的语法如下 –

```java
public void flush()
```

- KafkaProducer类提供了partitionFor方法，这有助于获取给定主题的分区元数据。 这可以用于自定义分区。 这种方法的签名如下 –

```java
public Map metrics()
```

它返回由生产者维护的内部度量的映射。

- public void close() – KafkaProducer类提供关闭方法块，直到所有先前发送的请求完成。

## 生产者API

生产者API的中心部分是生产者类。 生产者类提供了一个选项，通过以下方法在其构造函数中连接Kafka代理。

### 生产者类

生产者类提供send方法以使用以下签名向单个或多个主题**发送**消息。

```java
public void send(KeyedMessaget<k,v> message) 
- sends the data to a single topic,par-titioned by key using either sync or async producer.
public void send(List<KeyedMessage<k,v>>messages)
- sends data to multiple topics.
Properties prop = new Properties();
prop.put(producer.type,"async")
ProducerConfig config = new ProducerConfig(prop);
```

有两种类型的生产者 – **同步**和**异步**。

相同的API配置也适用于同步生产者。 它们之间的区别是同步生成器直接发送消息，但在后台发送消息。 当您想要更高的吞吐量时，异步生产者是首选。 在以前的版本，如0.8，一个异步生产者没有回调send()注册错误处理程序。 这仅在当前版本0.9中可用。

### public void close()

生产者类提供**关闭**方法以关闭与所有Kafka代理的生产者池连接。

## 配置设置

下表列出了Producer API的主要配置设置，以便更好地理解 –

S.No
配置设置和说明

1
 client.id

标识生产者应用程序

2
 producer.type

同步或异步

3

**acks**

acks配置控制生产者请求下的标准是完全的。

4

**重试**

如果生产者请求失败，则使用特定值自动重试。

5

bootstrapping代理列表。

6

**linger.ms**

如果你想减少请求的数量，你可以将linger.ms设置为大于某个值的东西。

7

**key.serializer**

序列化器接口的键。

8

**value.serializer**

值。

9

**batch.size**

缓冲区大小。

10

**buffer.memory**

控制生产者可用于缓冲的存储器的总量。

### ProducerRecord API

ProducerRecord是发送到Kafka cluster.ProducerRecord类构造函数的键/值对，用于使用以下签名创建具有分区，键和值对的记录。

```java
public ProducerRecord (string topic, int partition, k key, v value)
```

- **主题** - 将附加到记录的用户定义的主题名称。
- **分区** - 分区计数。
- **键** - 将包含在记录中的键。
-
- **值** - 记录内容。

```java
public ProducerRecord (string topic, k key, v value)
```

ProducerRecord类构造函数用于创建带有键，值对和无分区的记录。

- **主题** - 创建主题以分配记录。
- **键** - 记录的键。
- **值** - 记录内容。

```java
public ProducerRecord (string topic, v value)
```

ProducerRecord类创建一个没有分区和键的记录。

- **主题** - 创建主题。
- **值** - 记录内容。

ProducerRecord类方法列在下表中 –

S.No
类方法和描述

1
 public string topic()

主题将附加到记录。

2

**public K key()**

将包括在记录中的键。如果没有这样的键，null将在这里重新打开。

3

**public V value()**

记录内容。

4

**partition()**

记录的分区计数

## SimpleProducer应用程序

在创建应用程序之前，首先启动ZooKeeper和Kafka代理，然后使用create topic命令在Kafka代理中创建自己的主题。 之后，创建一个名为 Sim-pleProducer.java 的java类，然后键入以下代码。

```java
//import util.properties packages
import java.util.Properties;
//import simple producer packages
import org.apache.kafka.clients.producer.Producer;
//import KafkaProducer packages
import org.apache.kafka.clients.producer.KafkaProducer;
//import ProducerRecord packages
import org.apache.kafka.clients.producer.ProducerRecord;
//Create java class named “SimpleProducer"
public class SimpleProducer {
   public static void main(String[] args) throws Exception{
      // Check arguments length value
      if(args.length == 0){
         System.out.println("Enter topic name");
         return;
      }
      //Assign topicName to string variable
      String topicName = args[0].toString();
      // create instance for properties to access producer configs   
      Properties props = new Properties();
      //Assign localhost id
      props.put("bootstrap.servers", “localhost:9092");
      //Set acknowledgements for producer requests.      
      props.put("acks", “all");
      //If the request fails, the producer can automatically retry,
      props.put("retries", 0);
      //Specify buffer size in config
      props.put("batch.size", 16384);
      //Reduce the no of requests less than 0   
      props.put("linger.ms", 1);
      //The buffer.memory controls the total amount of memory available to the producer for buffering.   
      props.put("buffer.memory", 33554432);
      props.put("key.serializer", 
         "org.apache.kafka.common.serializa-tion.StringSerializer");
      props.put("value.serializer", 
         "org.apache.kafka.common.serializa-tion.StringSerializer");
      Producer<String, String> producer = new KafkaProducer
         <String, String>(props);
      for(int i = 0; i < 10; i++)
         producer.send(new ProducerRecord<String, String>(topicName, 
            Integer.toString(i), Integer.toString(i)));
               System.out.println(“Message sent successfully");
               producer.close();
   }
}
```

**编译** - 可以使用以下命令编译应用程序。

```java
javac -cp “/path/to/kafka/kafka_2.11-0.9.0.0/lib/*" *.java
```

**执行** - 可以使用以下命令执行应用程序。

```java
java -cp “/path/to/kafka/kafka_2.11-0.9.0.0/lib/*":. SimpleProducer <topic-name>
```

**输出**

```java
Message sent successfully
To check the above output open new terminal and type Consumer CLI command to receive messages.
>> bin/kafka-console-consumer.sh --zookeeper localhost:2181 —topic <topic-name> —from-beginning
1
2
3
4
5
6
7
8
9
10
```

## 简单消费者示例

到目前为止，我们已经创建了一个发送消息到Kafka集群的生产者。 现在让我们创建一个消费者来消费Kafka集群的消息。 KafkaConsumer API用于消费来自Kafka集群的消息。 KafkaConsumer类的构造函数定义如下。

```java
public KafkaConsumer(java.util.Map<java.lang.String,java.lang.Object> configs)
```

**configs** - 返回消费者配置的地图。

KafkaConsumer类具有下表中列出的以下重要方法。

S.No
方法和说明

1
 public java.util.Setassignment()

获取由用户当前分配的分区集。

2

**public string subscription()**

订阅给定的主题列表以获取动态签名的分区。

3

**public void sub-scribe(java.util.List topics，ConsumerRe-balanceListener listener)**

订阅给定的主题列表以获取动态签名的分区。

4

**public void unsubscribe()**

从给定的分区列表中取消订阅主题。

5

**public void sub-scribe(java.util.List topics)**

订阅给定的主题列表以获取动态签名的分区。如果给定的主题列表为空，则将其视为与unsubscribe()相同。

6

**public void sub-scribe(java.util.regex.Pattern pattern，ConsumerRebalanceLis-tener listener)**

参数模式以正则表达式的格式引用预订模式，而侦听器参数从预订模式获取通知。

7

**public void as-sign(java.util.List partitions)**

向客户手动分配分区列表。

8

**poll()**

使用预订/分配API之一获取指定的主题或分区的数据。如果在轮询数据之前未预订主题，这将返回错误。

9

**public void commitSync()**

提交对主题和分区的所有子编制列表的最后一次poll()返回的提交偏移量。相同的操作应用于commitAsyn()。

10

**public void seek(TopicPartition partition，long offset)**

获取消费者将在下一个poll()方法中使用的当前偏移值。

11

**public void resume()**

恢复暂停的分区。

12

**public void wakeup()**

唤醒消费者。

## ConsumerRecord API

ConsumerRecord API用于从Kafka集群接收记录。 此API由主题名称，分区号(从中接收记录)和指向Kafka分区中的记录的偏移量组成。 ConsumerRecord类用于创建具有特定主题名称，分区计数和``的消费者记录。 对。 它有以下签名。

```java
public ConsumerRecord(string topic,int partition, long offset,K key, V value)
```

- **主题** - 从Kafka集群接收的使用者记录的主题名称。
- **分区** - 主题的分区。
- **键** - 记录的键，如果没有键存在null将被返回。
- **值** - 记录内容。

## ConsumerRecords API

ConsumerRecords API充当ConsumerRecord的容器。 此API用于保存特定主题的每个分区的ConsumerRecord列表。 它的构造器定义如下。

```java
public ConsumerRecords(java.util.Map<TopicPartition,java.util.List
<Consumer-Record>K,V>>> records)
```

- **TopicPartition** - 返回特定主题的分区地图。
- **记录** - ConsumerRecord的返回列表。

ConsumerRecords类定义了以下方法。

S.No
方法和描述

1
 public int count()

所有主题的记录数。

2

**public Set partitions()**

在此记录集中具有数据的分区集(如果没有返回数据，则该集为空)。

3

**public Iterator iterator()**

迭代器使您可以循环访问集合，获取或重新移动元素。

4

**public List records()**

获取给定分区的记录列表。

## 配置设置

Consumer客户端API主配置设置的配置设置如下所示 –

S.No
设置和说明

1

引导代理列表。

2

**group.id**

将单个消费者分配给组。

3

**enable.auto.commit**

如果值为true，则为偏移启用自动落实，否则不提交。

4

**auto.commit.interval.ms**

返回更新的消耗偏移量写入ZooKeeper的频率。

5

**session.timeout.ms**

表示Kafka在放弃和继续消费消息之前等待ZooKeeper响应请求(读取或写入)多少毫秒。

## SimpleConsumer应用程序

生产者应用程序步骤在此保持不变。 首先，启动你的ZooKeeper和Kafka代理。 然后使用名为 SimpleCon-sumer.java 的Java类创建一个 SimpleConsumer 应用程序，并键入以下代码。

```java
import java.util.Properties;
import java.util.Arrays;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.ConsumerRecord;
public class SimpleConsumer {
   public static void main(String[] args) throws Exception {
      if(args.length == 0){
         System.out.println("Enter topic name");
         return;
      }
      //Kafka consumer configuration settings
      String topicName = args[0].toString();
      Properties props = new Properties();
      props.put("bootstrap.servers", "localhost:9092");
      props.put("group.id", "test");
      props.put("enable.auto.commit", "true");
      props.put("auto.commit.interval.ms", "1000");
      props.put("session.timeout.ms", "30000");
      props.put("key.deserializer", 
         "org.apache.kafka.common.serializa-tion.StringDeserializer");
      props.put("value.deserializer", 
         "org.apache.kafka.common.serializa-tion.StringDeserializer");
      KafkaConsumer<String, String> consumer = new KafkaConsumer
         <String, String>(props);
      //Kafka Consumer subscribes list of topics here.
      consumer.subscribe(Arrays.asList(topicName))
      //print the topic name
      System.out.println("Subscribed to topic " &plus; topicName);
      int i = 0;
      while (true) {
         ConsumerRecords<String, String> records = con-sumer.poll(100);
         for (ConsumerRecord<String, String> record : records)
         // print the offset,key and value for the consumer records.
         System.out.printf("offset = %d, key = %s, value = %s\n", 
            record.offset(), record.key(), record.value());
      }
   }
}
```

**编译** - 可以使用以下命令编译应用程序。

```java
javac -cp “/path/to/kafka/kafka_2.11-0.9.0.0/lib/*" *.java
```

**执行 –** 可以使用以下命令执行应用程序

```java
java -cp “/path/to/kafka/kafka_2.11-0.9.0.0/lib/*":. SimpleConsumer <topic-name>
```

**输入** - 打开生成器CLI并向主题发送一些消息。 你可以把smple输入为\’Hello Consumer\’。

**输出** - 以下是输出。

```java
Subscribed to topic Hello-Kafka
offset = 3, key = null, value = Hello Consumer
```
