# 10、Kafka 实战 - 集群消费问题
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/10.html
- 分类：消息队列
- 分组：教程目录
## 集群消费问题

### 向集群发送消息

```java
./kafka-console-producer.sh \
--broker-list 172.16.253.38:9092,172.16.253.38:9093,172.16.253.38:9094 \
--topic myreplicated-topic
```

### 从集群中消费消息

```java
./kafka-console-consumer.sh \
--bootstrap-server 172.16.253.38:9092,172.16.253.38:9093,172.16.253.38:9094 \
--from-beginning \
--topic my-replicated-topic
```

### 指定消费组来消费消息

```java
./kafka-console-consumer.sh \
--bootstrap-server 172.16.253.38:9092,172.16.253.38:9093,172.16.253.38:9094 \
--from-beginning \
--consumer-property group.id=testGroup1 \
--topic my-replicated-topic
```

### 分区分消费组的集群消费中的细节

- ⼀个partition只能被⼀个消费组中的⼀个消费者消费，⽬的是为了保证消费的顺序性，但是多个partion的多个消费者消费的总的顺序性是得不到保证的，那怎么做到消费的总顺序性呢？
- partition的数量决定了消费组中消费者的数量，建议同⼀个消费组中消费者的数量不要超过partition的数量，否则多的消费者消费不到消息
- 如果消费者挂了，那么会触发rebalance机制（后⾯介绍），会让其他消费者来消费该分区
