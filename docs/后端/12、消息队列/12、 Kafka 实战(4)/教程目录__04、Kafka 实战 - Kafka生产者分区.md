# 04、Kafka 实战 - Kafka生产者分区
- 来源：https://ddkk.com/zhuanlan/mq/kafka/4/4.html
- 分类：消息队列
- 分组：教程目录
### 1 分区的好处

**1、** 便于**合理使用存储资源**，每个Partition在一个Broker上存储，可以把海量的数据按照分区切割成一

块一块数据存储在多台Broker上。合理控制分区的任务，可以实现**负载均衡**的效果。

**2、****提高并行度**，生产者可以以分区为单位**发送数据**；消费者可以以分区为单位进行**消费数据。**

### 2 生产者发送消息的分区策略

**1、****默认的分区器DefaultPartitioner**

（i）指明partition情况下直接使用指明的partition的值。

（ii）没有指明partition值，但是又key的情况下，将key的hash值与topic的partition数进行取余得到partition的值。

（iii）在没有partition值和没有key的情况下，Kafka采用Sticky Partition（黏性分区器），随机选择一个分区，并尽可能一直使用该分区，等该分区的batch已满或者已完成，Kafka再随机选择一个分区进行使用。

**2、** 案例一：将数据发往指定分区下：

```java
package com.study.kafka.producer;
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import java.util.Properties;
public class CustomProducerCallbackPartitions {
    public static void main(String[] args) throws InterruptedException {
        //0.创建 kafka 生产者的配置对象
        Properties properties = new Properties();
        //给 kafka 配置对象添加配置信息：bootstrap.servers
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,"hadoop102:9092,hadoop103:9092");
        // key,value 序列化（必须）：key.serializer，value.serializer
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,StringSerializer.class.getName());
        //1.创建 kafka 生产者对象
        KafkaProducer<String, String> kafkaProducer = new KafkaProducer<>(properties);
        //2.调用 send 方法,发送消息
        for (int i = 0; i < 3; i++) {
            // 指定数据发送到 1 号分区，key 为空（IDEA 中 ctrl + p 查看参数）
            kafkaProducer.send(new ProducerRecord<>("first",1,"","test" + i), new Callback() {
                // 该方法在 Producer 收到 ack 时调用，为异步调用
                @Override
                public void onCompletion(RecordMetadata recordMetadata, Exception e) {
                    if (e == null) {
                        // 没有异常,输出信息到控制台
                        System.out.println("topic:" + recordMetadata.topic() + "  partition:" + recordMetadata.partition());
                    }else {
                        // 出现异常打印
                        e.printStackTrace();
                    }
                }
            });
            // 延迟一会会看到数据发往不同分区
            Thread.sleep(2);
        }
        //3.关闭资源
        kafkaProducer.close();
    }
}
```

3）案例二：没有指明 partition 值但有 key 的情况下，将 key 的 hash 值与 topic 的 partition 数进行取余得到 partition 值。

适用于将MySQL中的某个表中的数据发送到Kafka中的某个分区，此时key值为表名。

```java
package com.study.kafka.producer;
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import java.util.Properties;
public class CustomProducerCallbackPartitions {
    public static void main(String[] args) throws InterruptedException {
        //0.创建 kafka 生产者的配置对象
        Properties properties = new Properties();
        //给 kafka 配置对象添加配置信息：bootstrap.servers
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,"hadoop102:9092,hadoop103:9092");
        // key,value 序列化（必须）：key.serializer，value.serializer
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,StringSerializer.class.getName());
        //1.创建 kafka 生产者对象
        KafkaProducer<String, String> kafkaProducer = new KafkaProducer<>(properties);
        //2.调用 send 方法,发送消息
        for (int i = 0; i < 3; i++) {
            // 依次指定 key 值为 a,b,f ，数据 key 的 hash 值与 3 个分区求余，分别发往 1、2、0
            kafkaProducer.send(new ProducerRecord<>("first","a","test" + i), new Callback() {
                // 该方法在 Producer 收到 ack 时调用，为异步调用
                @Override
                public void onCompletion(RecordMetadata recordMetadata, Exception e) {
                    if (e == null) {
                        // 没有异常,输出信息到控制台
                        System.out.println("topic:" + recordMetadata.topic() + "  partition:" + recordMetadata.partition());
                    }else {
                        // 出现异常打印
                        e.printStackTrace();
                    }
                }
            });
            // 延迟一会会看到数据发往不同分区
            Thread.sleep(2);
        }
        //3.关闭资源
        kafkaProducer.close();
    }
}
```

### 3 自定义分区器

需求：实现一个分区器，实现发送过来的数据中如果包含test，就发往 0 号分区，不包含test，就发往 1 号分区。

步骤：
**1、** 定义类实现Partitioner 接口。

**2、** 重写partition()方法。

```java
package com.study.kafka.producer;
import org.apache.kafka.clients.producer.Partitioner;
import org.apache.kafka.common.Cluster;
import java.util.Map;
/**
 * 1. 实现接口 Partitioner
 * 2. 实现 3 个方法:partition,close,configure
 * 3. 编写 partition 方法,返回分区号
 */
public class MyPartitioner implements Partitioner {
    /**
     * 返回信息对应的分区
     * @param s       主题
     * @param o       消息的 key
     * @param bytes   消息的 key 序列化后的字节数组
     * @param o1      消息的 value
     * @param bytes1  消息的 value 序列化后的字节数组
     *  @param cluster 集群元数据可以查看分区信息
     *  @return
     * */
    @Override
    public int partition(String s, Object o, byte[] bytes, Object o1, byte[] bytes1, Cluster cluster) {
        //获取消息
        String msgValue = o1.toString();
        //创建partition
        int partition;
        //判断消息是否含test
        if( msgValue.contains("test"))
        {
            partition = 0;
        }else{
            partition = 1;
        }
        return partition;
    }
    // 关闭资源
    @Override
    public void close() {
    }
    // 配置方法
    @Override
    public void configure(Map<String, ?> map) {
    }
}
```

**3、** 使用自定义分区器，在生产者的配置中添加分区器参数。

```java
package com.study.kafka.producer;
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import java.util.Properties;
public class CustomProducerCallbackPartitions {
    public static void main(String[] args) throws InterruptedException {
        //0.创建 kafka 生产者的配置对象
        Properties properties = new Properties();
        //给 kafka 配置对象添加配置信息：bootstrap.servers
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,"hadoop102:9092,hadoop103:9092");
        // key,value 序列化（必须）：key.serializer，value.serializer
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,StringSerializer.class.getName());
        // 添加自定义分区器
        properties.put(ProducerConfig.PARTITIONER_CLASS_CONFIG,"com.study.kafka.producer.MyPartitioner");
        //1.创建 kafka 生产者对象
        KafkaProducer<String, String> kafkaProducer = new KafkaProducer<>(properties);
        //2.调用 send 方法,发送消息
        for (int i = 0; i < 3; i++) {
            kafkaProducer.send(new ProducerRecord<>("first","test" + i), new Callback() {
                // 该方法在 Producer 收到 ack 时调用，为异步调用
                @Override
                public void onCompletion(RecordMetadata recordMetadata, Exception e) {
                    if (e == null) {
                        // 没有异常,输出信息到控制台
                        System.out.println("topic:" + recordMetadata.topic() + "  partition:" + recordMetadata.partition());
                    }else {
                        // 出现异常打印
                        e.printStackTrace();
                    }
                }
            });
            // 延迟一会会看到数据发往不同分区
            Thread.sleep(2);
        }
        //3.关闭资源
        kafkaProducer.close();
    }
}
```

**4、** 在 hadoop102 上开启Kafka 消费者。

**5、** 在 IDEA 控制台观察回调信息。
