# 12、Kafka 实战 - Kafka 自定义分区器
- 来源：https://ddkk.com/zhuanlan/mq/kafka/2/12.html
- 分类：消息队列
- 分组：教程目录
### 一、默认的分区策略

(1)如果键值为 null，并且使用了默认的分区器，那么记录将被随机地发送到主题内各个可用的分区上。分区器使用轮询（Round Robin）算法将消息均衡地分布到各个分区上。

(2)如果键不为空，并且使用了默认的分区器，那么 Kafka 会对键取 hash 值然后根据散列值把消息映射到特定的分区上。这里的关键之处在于，同一个键总是被映射到同一个分区上，所以在进行映射时，我们会使用主题所有的分区，而不仅仅是可用的分区。这也意味着，如果写入数据的分区是不可用的，那么就会发生错误。但这种情况很少发生。

### 二、自定义分区器

为了满足业务需求，你可能需要自定义分区器，例如，通话记录中，给客服打电话的记录要存到一个分区中，其余的记录均分的分布到剩余的分区中。我们就这个案例来进行演示。

#### (1) 自定义分区器

```java
package com.bonc.rdpe.kafka110.partitioner;
import java.util.List;
import java.util.Map;
import org.apache.kafka.clients.producer.Partitioner;
import org.apache.kafka.common.Cluster;
import org.apache.kafka.common.PartitionInfo;
/**
 * @Content: 自定义分区器
 */
public class PhonenumPartitioner implements Partitioner{
    @Override
    public void configure(Map<String, ?> configs) {
        // TODO nothing
    }
    /**
     * 自定义kafka分区主要解决用户分区数据倾斜问题 提高并发效率（假设 3 分区）
     * @param topic 消息队列名
     * @param key 用户传入key
     * @param keyBytes key字节数组
     * @param value 用户传入value
     * @param valueBytes value字节数据
     * @param cluster 当前kafka节点数
     * @return 如果3个节点数 返回 0 1 2 如果5个 返回 0 1 2 3 4 5
     */
    @Override
    public int partition(String topic, Object key, byte[] keyBytes, Object value, byte[] valueBytes, Cluster cluster) {
        // 得到 topic 的 partitions 信息
        List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
        int numPartitions = partitions.size();
        // 模拟某客服
        if(key.toString().equals("10000") || key.toString().equals("11111")) {
            // 放到最后一个分区中
            return numPartitions - 1;
        }
        String phoneNum = key.toString();
        return phoneNum.substring(0, 3).hashCode() % (numPartitions - 1);
    }
    @Override
    public void close() {
        // TODO nothing
    }
}
```

#### (2) 使用自定义分区器

```java
package com.bonc.rdpe.kafka110.producer;
import java.util.Properties;
import java.util.Random;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
/**
 * @Title PartitionerProducer.java 
 * @Description 测试自定义分区器
 */
public class PartitionerProducer {
    private static final String[] PHONE_NUMS = new String[]{
        "10000", "10000", "11111", "13700000003", "13700000004",
        "10000", "15500000006", "11111", "15500000008", 
        "17600000009", "10000", "17600000011" 
    };
    public static void main(String[] args) throws Exception {
        Properties props = new Properties();
        props.put("bootstrap.servers", "192.168.42.89:9092,192.168.42.89:9093,192.168.42.89:9094");
        // 设置分区器
        props.put("partitioner.class", "com.bonc.rdpe.kafka110.partitioner.PhonenumPartitioner");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        Producer<String, String> producer = new KafkaProducer<>(props);
        int count = 0;
        int length = PHONE_NUMS.length;
        while(count < 10) {
            Random rand = new Random();
            String phoneNum = PHONE_NUMS[rand.nextInt(length)];
            ProducerRecord<String, String> record = new ProducerRecord<>("dev3-yangyunhe-topic001", phoneNum, phoneNum);
            RecordMetadata metadata = producer.send(record).get();
            String result = "phonenum [" + record.value() + "] has been sent to partition " + metadata.partition();
            System.out.println(result);
            Thread.sleep(500);
            count++;
        }
        producer.close();
    }
}
```

#### (3) 测试结果

```java
phonenum [11111] has been sent to partition 2
phonenum [11111] has been sent to partition 2
phonenum [17600000009] has been sent to partition 0
phonenum [17600000011] has been sent to partition 0
phonenum [13700000003] has been sent to partition 1
phonenum [10000] has been sent to partition 2
phonenum [10000] has been sent to partition 2
phonenum [15500000008] has been sent to partition 1
phonenum [10000] has been sent to partition 2
phonenum [17600000009] has been sent to partition 0
```
