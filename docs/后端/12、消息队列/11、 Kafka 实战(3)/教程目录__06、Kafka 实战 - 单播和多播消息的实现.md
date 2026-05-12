# 06、Kafka 实战 - 单播和多播消息的实现
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/6.html
- 分类：消息队列
- 分组：教程目录
## 单播和多播消息的实现

### 单播消息

在⼀个kafka的topic中，启动两个消费者，⼀个⽣产者，问：⽣产者发送消息，这条消息是否同时会被两个消费者消费？

如果多个消费者在同⼀个消费组，那么只有⼀个消费者可以收到订阅的topic中的消息。换⾔之，同⼀个消费组中只能有⼀个消费者收到⼀个topic中的消息。

```java
./kafka-console-consumer.sh \
--bootstrap-server 172.16.253.38:9092 \
--consumer-property group.id=testGroup \
--topic test
```

### 多播消息

不同的消费组订阅同⼀个topic，那么不同的消费组中只有⼀个消费者能收到消息。实际上也是多个消费组中的多个消费者收到了同⼀个消息。

```java
./kafka-console-consumer.sh \
--bootstrap-server 172.16.253.38:9092 \
--consumer-property group.id=testGroup1 \
--topic test
./kafka-console-consumer.sh \
--bootstrap-server 172.16.253.38:9092 \
--consumer-property group.id=testGroup2 \
--topic test
```

多播和单播消息的区别

### 查看消费组及信息

```java
# 查看当前主题下有哪些消费组
./kafka-consumer-groups.sh \
--bootstrap-server 10.31.167.10:9092 \
--list
# 查看消费组中的具体信息：⽐如当前偏移量、最后⼀条消息的偏移量、堆积的消息数量
./kafka-consumer-groups.sh \
--bootstrap-server 172.16.253.38:9092 \
--describe \
--group testGroup
```

- Currennt-offset: 当前消费组的已消费偏移量
- Log-end-offset: 主题对应分区消息的结束偏移量(HW)
- Lag: 当前消费组未消费的消息数
