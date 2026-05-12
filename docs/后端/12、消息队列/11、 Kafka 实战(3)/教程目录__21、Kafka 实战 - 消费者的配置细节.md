# 21、Kafka 实战 - 消费者的配置细节
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/21.html
- 分类：消息队列
- 分组：教程目录
## 消费者的配置细节

### 配置

我们可以指定多个主题，分区，偏移量和消费者的并发数

```java
@KafkaListener(groupId = "testGroup",  topicPartitions = {
        //@TopicPartition(topic = "test", partitions = { "0", "1" }),
        @TopicPartition(topic = "test", partitions = "0",
                partitionOffsets = @PartitionOffset(partition = "1", initialOffset = "100"))
}, concurrency = "3") //concurrency就是同组下的消费者个数，就是并发消费数，建议⼩于等于分区总数
public void listenGroup(ConsumerRecord < String, String > record,
                        Acknowledgment ack) {
    String value = record.value();
    System.out.println(value);
    System.out.println(record);
    //⼿动提交offset
    ack.acknowledge();
}
```

### 测试

我们启动项目后，消费者从test主题的1号分区的offset为100的地方开始消费
