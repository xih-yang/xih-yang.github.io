# 14、kafka 实战 - kafka消费者API
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/14.html
- 分类：消息队列
- 分组：教程目录
> kafka消费者API

Consumer消费数据时的可靠性是很容易保证的，因为数据在kafka中是持久化的，故不用担心数据丢失的问题。

由于consumer在消费过程中可能会出现断电宕机的等故障，consumer恢复后，需要从故障前的位置继续消费，所以consumer需要实时记录自己消费到了哪个offset，以便故障恢复后可以继续消费。

所以，offset的维护是consumer消费数据必须考虑的问题。

**依赖**

```java
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-clients</artifactId>
    <version>0.11.0.0</version>
</dependency>
```

### 1.自动提交offset

**KafkaConsumer**：创建一个kafka消费者对象，用来消费数据

**ConsumerConfig**：获取所需的一系列配置参数

**ConsumerRecord**：每条数据都要封装成ConsumerRecord对象

```java
public class MyConsumer {
    public static void main(String[] args) {
        //创建配置信息
        Properties properties = new Properties();
        //配置信息赋值
        //连接kafka集群
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "hll1:9092");
        //开启自动提交offset
        properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);
        //自动提交offset的时间间隔
        properties.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "1000");
        //key, value的反序列化
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        //消费者组
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, "bigdata");
        //创建消费者
        KafkaConsumer<String, String> consumer = new KafkaConsumer<String, String>(properties);
        //订阅主题
        consumer.subscribe(Collections.singletonList("bigdata"));
        //循环不断拉取数据
        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(100);
            for (ConsumerRecord<String, String> record : records) {
                System.out.printf("offset=%d, key=%s, value=%s%n", record.offset(), record.key(), record.value());
            }
        }
    }
}
```

通过生产者生产消息，之后在控制台可以看到：

如果启动消费者之后，控制台一直在kafka的日志，可以在resources目录下新创建`logback.xml`文件，添加下面的代码，更改日志级别：

```java
<logger name="org.apache.kafka.clients.consumer" level="off" />
```

### 2.重置offset

```java
//消费者组
properties.put(ConsumerConfig.GROUP_ID_CONFIG, "hll-group1");
//重置消费者的offset,默认是latest
/**
  * 重新消费一个主题的数据需要满足条件：更换一个新的消费者组(或者offset过期)，且配置auto.offset.reset=earliest
  * 配置earliest不等于offset就是0,因为之前的数据可能会被删除,offset就不是从0开始的
  */
properties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
```

### 3.手动提交offset

自动提交虽然十分便利，但是由于是基于时间提交的，开发人员难以把握offset提交的时机，配置时间过长容易造成服务等待时间太久，配置时间过短又可能会出现服务异常但offset又成功提交了。因此kafka提供了手动提交offset的API。

如果关闭自动提交offset，在消费者服务启动期间，消费暂时是正常的，消费者每次消费之后offset会更新到服务内存中，但是并没有通知kafka同步更新最新的offset，当重启消费者之后，会从kafka中获取在kafka最新的offset进行消费，这样就会造成重复消费

```java
properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
```

手动提交offset的两种方法：`commitSync(同步提交)`和`commitAsync(异步提交)`。两者的相同点是，都会将**本次poll的一批数据最高的偏移量提交**；不同点是，commitSync阻塞当前线程，一直到提交成功，并且会自动失败重试（由于不可控因素，会出现提交失败），而commitAsync则没有失败重试机制，也有可能提交失败。

#### 3.1 同步提交offset#

同步提交有offset重试机制，会更加可靠

```java
public class CustomConsumer {
    public static void main(String[] args) {
        //创建配置信息
        Properties properties = new Properties();
        //连接kafka
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "hll1:9092");
        //关闭自动提交
        properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        //key, value的反序列化
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        //消费者组
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, "hll-group");
        //创建消费者
        KafkaConsumer<String, String> consumer = new KafkaConsumer<String, String>(properties);
        //订阅主题
        consumer.subscribe(Collections.singletonList("bigdata"));
        //拉取数据
        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(100);
            for (ConsumerRecord<String, String> record : records) {
                System.out.printf("offset=%d, key=%s, value=%s%n", record.offset(), record.key(), record.value());
            }
            //同步提交 当前线程会阻塞直到offset提交成功
            consumer.commitSync();
        }
    }
}
```

如果没有`consumer.commitSync()`，生产者生产消息后，消费者消费完成后不会通知kafka同步更新offset，当重启消费者服务，会从kafka端的offset重新消费数据，会重复消费

#### 3.2异步提交offset#

虽然同步提交会更可靠一些，但是由于其会阻塞当前线程，直到提交成功。因此吞吐量会收到很大的影响，所以在更多的情况下会选择异步提交offset

```java
public class CustomConsumer {
    public static void main(String[] args) {
        //创建配置信息
        Properties properties = new Properties();
        //连接kafka
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "hll1:9092");
        //关闭自动提交
        properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        //key, value的反序列化
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        //消费者组
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, "hll-group");
        //创建消费者
        KafkaConsumer<String, String> consumer = new KafkaConsumer<String, String>(properties);
        //订阅主题
        consumer.subscribe(Collections.singletonList("bigdata"));
        //拉取数据
        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(100);
            for (ConsumerRecord<String, String> record : records) {
                System.out.printf("offset=%d, key=%s, value=%s%n", record.offset(), record.key(), record.value());
            }
            //同步提交 当前线程会阻塞直到offset提交成功
            //consumer.commitSync();
            //异步提交
            consumer.commitAsync(new OffsetCommitCallback() {
                @Override
                public void onComplete(Map<TopicPartition, OffsetAndMetadata> offsets, Exception exception) {
                    if (exception != null) {
                        System.out.println("提交失败：" + offsets);
                    }
                }
            });
        }
    }
}
```

**无论同步提交还是异步提交offset，都有可能会造成数据的丢失或者重复消费。先提交offset后消费，可能造成数据的丢失；先消费后提交offset，可能造成数据重复消费**

### 4.自定义存储offset

待补充…
