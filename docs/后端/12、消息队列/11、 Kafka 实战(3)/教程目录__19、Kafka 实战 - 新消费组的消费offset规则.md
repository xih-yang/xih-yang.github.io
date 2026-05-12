# 19、Kafka 实战 - 新消费组的消费offset规则
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/19.html
- 分类：消息队列
- 分组：教程目录
## 新消费组的消费offset规则

新消费组中的消费者在启动以后，默认会从当前分区的最后⼀条消息的offset+1开始消费（消费新消息）。可以通过以下的设置，让新的消费者第⼀次从头开始消费。之后开始消费新消息（最后消费的位置的偏移量+1）

- latest：默认的，消费新消息
- earliest：第⼀次从头开始消费。之后开始消费新消息（最后消费的位置的偏移量+1）

```java
props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
```

### 测试

#### 测试latest

将消费者消费组改成testGroup1

直接订阅主题test

启动后发现没有消费到消息，这是因为新消费组消费主题，是从最新的offset进行消费的

这时生产者发送消息，新消费组的消费者也可以接收到并消费

- 生产者

- 消费者

#### 测试earliest

新建一个testGroup2的消费组

然后将配置改为earliest

启动Consumer后会获取到test主题下所有分区的从0的offset位置以后的所有消息，下次会从已经消费的offset+1位置处开始消费
