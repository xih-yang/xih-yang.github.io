# 05、Kafka 实战 - Kafka生产者之生产经验
- 来源：https://ddkk.com/zhuanlan/mq/kafka/4/5.html
- 分类：消息队列
- 分组：教程目录
### 1 生产者如何提高吞吐量

由于linger.ms默认为0，即缓冲区队列中一有数据就sender线程就将其拉出到Kafka集群，效率比较低，提高生产者吞吐量有四种方式：

**1、** 扩大**批次的大小batch.size**，默认为16k，当数据积累到batch.size时sender线程才拉取数据。

**2、** 扩大**sender的等待时间linger.ms**，默认为0ms，可以修改为2-100ms。

**3、** 对缓冲区队列中的数据进行**压缩再积累**由sender拉取**compression.type**。

**4、****扩大缓冲区大小RecordAccumulator**，默认为32M，修改为64M。

```java
package com.study.kafka.producer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import java.util.Properties;
public class CustomProducerParameters {
    public static void main(String[] args) {
        //0.创建 kafka 生产者的配置对象
        Properties properties = new Properties();
        //给 kafka 配置对象添加配置信息：bootstrap.servers
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,"hadoop102:9092,hadoop103:9092");
        // key,value 序列化（必须）：key.serializer，value.serializer
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,StringSerializer.class.getName());
        // batch.size：批次大小，默认 16K
        properties.put(ProducerConfig.BATCH_SIZE_CONFIG,16384);
        // linger.ms：等待时间，默认 0
        properties.put(ProducerConfig.LINGER_MS_CONFIG,1);
        // RecordAccumulator：缓冲区大小，默认 32M：buffer.memory
        properties.put(ProducerConfig.BUFFER_MEMORY_CONFIG,33554432);
        // compression.type：压缩，默认 none，可配置值 gzip、snappy、 lz4 和 zstd
        properties.put(ProducerConfig.COMPRESSION_TYPE_CONFIG,"snappy");
        //1.创建 kafka 生产者对象
        KafkaProducer<String, String> kafkaProducer = new KafkaProducer<String, String>(properties);
        //2.调用 send 方法,发送消息
        for (int i = 0; i < 3; i++) {
            kafkaProducer.send(new ProducerRecord<>("first","test"+i));
        }
        //3.关闭资源
        kafkaProducer.close();
    }
}
```

### 2 数据可靠性

ACK应答级别：

**1、****acks=0**：生产者发送过来的数据，不需要等待数据落盘应答。（**会丢失数据**）

即生产者发送数据过来就不管了，可靠性差，效率高，很少使用。

**2、****acks=1**：生产者发送过来的数据，Leader收到数据后应答。（**会丢失数据**）

当Leader应答完成但还没有开始同步副本时Leader挂了，新的Leader不会收到刚发来的数据，因为生产者接收到应答acks即认为发送成功了。

即生产者发送数据过来等待Leader应答，可靠性中，效率中，一般用于传输普通数据，允许丢个别数据。

**3、** acks=-1或all：生产者发送过来的数据，Leader和ISR队列里的所有节点收齐数据后应答，可靠性高，效率低，一般用于传输与钱有关的数据，对可靠性要求比较高的场景。

但会出现一种情况：

Leader收到数据，所有Follower都开始同步数据，但有一个**Follower**，因为某种故障，**迟迟不能与Leader进行同步**。

解决：
**Leader维护了一个动态的in-sync replica set（ISR），意为和Leader保持同步的Follower+Leader集合**(leader：0，isr:0,1,2)。

如果Follower长时间未向Leader发送通信请求或同步数据，则该Follower将被踢出ISR。该**时间阈值**由**replica.lag.time.max.ms参数设定**，**默认30s**。例如2超时，(leader:0, isr:0,1)。这样就不用等长期联系不上或者已经故障的节点。

**数据可靠性分析**：

如果分区副本设置为1个，或者ISR里应答的最小副本数量（ min.insync.replicas 默认为1）设置为1，和ack=1的效果是一样的，仍然有丢数的风险（leader：0，isr:0）。

**数据完全可靠条件 = ACK级别设置为-1 + 分区副本大于等于2 + ISR里应答的最小副本数量>=2**

**数据重复分析**：

acks=-1或all时，生产者发送数据给Leader，Leader接受到数据后返回确认ack给生产者并同步数据到副本，此时Leader挂了，但是生产者并没有接收到返回的ack，所以生产者重新给新的Leader发送数据，导致数据重复。

```java
package com.study.kafka.producer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import java.util.Properties;
public class CustomProducerAck {
    public static void main(String[] args) {
        //0.创建 kafka 生产者的配置对象
        Properties properties = new Properties();
        //给 kafka 配置对象添加配置信息：bootstrap.servers
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,"hadoop102:9092,hadoop103:9092");
        // key,value 序列化（必须）：key.serializer，value.serializer
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,StringSerializer.class.getName());
        // 设置 acks 
        properties.put(ProducerConfig.ACKS_CONFIG, "all");
        // 重试次数retries，默认是 int 最大值，2147483647 
        properties.put(ProducerConfig.RETRIES_CONFIG, 3);
        //1.创建 kafka 生产者对象
        KafkaProducer<String, String> kafkaProducer = new KafkaProducer<>(properties);
        //2.调用 send 方法,发送消息
        for (int i = 0; i < 3; i++) {
            kafkaProducer.send(new ProducerRecord<>("first","test"+i));
        }
        //3.关闭资源
        kafkaProducer.close();
    }
}
```

### 3 数据去重

**数据重复分析**：

acks=-1或all时，生产者发送数据给Leader，Leader接受到数据后返回确认ack给生产者并同步数据到副本，此时Leader挂了，但是生产者并没有接收到返回的ack，所以生产者重新给新的Leader发送数据，导致数据重复。

#### 3.1 数据传递语义

**1、** 至少一次（At Least Once），可以保证数据不丢失，但是**不能保证数据不重复。**

至少一次（At Least Once）= ACK级别设置为-1 + 分区副本大于等于2 + ISR里应答的最小副本数量大于等于2

**2、** 最多一次（At Most Once），可以保证数据不重复，但是**不能保证数据不丢失**。

最多一次（At Most Once）= ACK级别设置为0

**3、** 精确一次（Exactly Once）：对于一些非常重要的信息，比如和钱相关的数据，要求数据**既不能重复也不丢失。**

Kafka 0.11版本以后，引入**幂等性和事务**。

#### 3.2 幂等性

**幂等性**就是指Producer不论向Broker发送多少次重复数据，**Broker端都只会持久化一条**，保证了不重复。

**精确一次（Exactly Once） = 幂等性+ 至少一次（ ack=-1 + 分区副本数>=2 + ISR最小副本数量>=2）**

重复数据的判断标准：

具有相同主键的消息提交时，Broker只会持久化一条。其

中PID是Kafka每次重启都会分配一个新的；Partition 表示分区号；Sequence Number是单调自增的。所以幂等性只能保证的是在**单分区单会话内不重复**。

使用幂等性：

开启参数 **enable.idempotence** 默认为 true，false 关闭。

#### 3.3 生产者事务

开启事务必须要先开启幂等性。

Producer 在使用事务功能前，必须先自定义一个唯一的 transactional.id。有了 transactional.id，即使客户端挂掉了，它重启后也能继续处理未完成的事务。

Kafka 的事务一共有如下 5 个API：

```java
// 1 初始化事务
void initTransactions();
// 2 开启事务
void beginTransaction()throws ProducerFencedException;
// 3 在事务内提交已经消费的偏移量（主要用于消费者）
void sendOffsetsToTransaction(Map<TopicPartition, OffsetAndMetadata> offsets,String consumerGroupId) throws ProducerFencedException;
// 4 提交事务
void commitTransaction()throws ProducerFencedException;
// 5 放弃事务（类似于回滚事务的操作）
void abortTransaction()throws ProducerFencedException;
```

单个Producer，使用事务保证消息的仅一次发送。

```java
package com.study.kafka.producer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.errors.ProducerFencedException;
import org.apache.kafka.common.serialization.StringSerializer;
import java.util.Properties;
public class CustomProducerTransactions {
    public static void main(String[] args) {
        //0.创建 kafka 生产者的配置对象
        Properties properties = new Properties();
        //给 kafka 配置对象添加配置信息：bootstrap.servers
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,"hadoop102:9092,hadoop103:9092");
        // key,value 序列化（必须）：key.serializer，value.serializer
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,StringSerializer.class.getName());
        // 设置事务 id（必须），事务 id 任意起名，全局唯一
        properties.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG,"transaction_id_01");
        //1.创建 kafka 生产者对象
        KafkaProducer<String, String> kafkaProducer = new KafkaProducer<>(properties);
        // 初始化事务
        kafkaProducer.initTransactions();
        // 开启事务
        kafkaProducer.beginTransaction();
        try {
            //2.调用 send 方法,发送消息
            for (int i = 0; i < 3; i++) {
                kafkaProducer.send(new ProducerRecord<>("first","test"+i));
            }
            // 提交事务
            kafkaProducer.commitTransaction();
        } catch (ProducerFencedException e) {
            // 终止事务
            kafkaProducer.abortTransaction();
        } finally {
            //3.关闭资源
            kafkaProducer.close();
        }
    }
}
```

### 4 数据有序

消费者接收到的：单分区内有序，多分区间无序。

### 5 数据乱序

生产者端中每个节点的每个队列最多缓存5个请求，在Kafka集群没有回应的情况下最多可以发送5个数据。若前有个数据发送失败，但其前面的数据发送成功，其后数据正常发送，且发送该数据会重试，导致数据到达Kafka集群时出现乱序。

解决：
**1、** kafka在1.x版本之前保证数据单分区有序，条件如下：

max.in.flight.requests.per.connection=1（不需要考虑是否开启幂等性）。

**2、** kafka在1.x及以后版本保证数据单分区有序，条件如下：

（i）未开启幂等性：max.in.flight.requests.per.connection需要设置为1。

（ii）开启幂等性：max.in.flight.requests.per.connection需要设置小于等于5。

原因说明：

因为在kafka1.x以后，启用幂等后，kafka服务端会缓存producer发来的最近5个request的元数据，缓存5个数据后再进行排序。故无论如何，都可以保证最近5个request的数据都是有序的。
