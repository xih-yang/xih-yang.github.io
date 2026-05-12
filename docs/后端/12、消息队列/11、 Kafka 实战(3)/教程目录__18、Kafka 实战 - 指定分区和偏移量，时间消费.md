# 18、Kafka 实战 - 指定分区和偏移量，时间消费
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/18.html
- 分类：消息队列
- 分组：教程目录
## 指定分区和偏移量，时间消费

### 指定分区消费

从topic的0号分区最新offset消费

```java
consumer.assign(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
```

### 从头消费

从topic的0号分区的开始offset消费

```java
consumer.assign(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
consumer.seekToBeginning(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
```

### 指定offset消费

从topic的0号分区的10这个offset开始消费

```java
consumer.assign(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
consumer.seek(new TopicPartition(TOPIC_NAME, 0), 10);
```

### 指定时间消费

根据时间，去所有的partition中确定该时间对应的offset，然后去所有的partition中找到该offset之后的消息开始消费。

```java
List<PartitionInfo> topicPartitions = consumer.partitionsFor(TOPIC_NAME);
//从1小时前开始消费
long fetchDataTime = new Date().getTime() - 1000 * 60 * 60;
Map<TopicPartition, Long> map = new HashMap<>();
for (PartitionInfo par : topicPartitions) {
    map.put(new TopicPartition(TOPIC_NAME, par.partition()), fetchDataTime);
}
Map<TopicPartition, OffsetAndTimestamp> parMap = consumer.offsetsForTimes(map);
for (Map.Entry<TopicPartition, OffsetAndTimestamp> entry : parMap.entrySet()) {
    TopicPartition key = entry.getKey();
    OffsetAndTimestamp value = entry.getValue();
    if (key == null || value == null) continue;
    Long offset = value.offset();
    System.out.println("partition-" + key.partition() + "|offset-" + offset);
    System.out.println();
    //根据消费⾥的timestamp确定offset
    if (value != null) {
        consumer.assign(Arrays.asList(key));
        consumer.seek(key, offset);
    }
}
```
