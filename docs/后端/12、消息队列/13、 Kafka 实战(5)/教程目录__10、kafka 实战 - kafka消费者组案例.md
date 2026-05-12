# 10、kafka 实战 - kafka消费者组案例
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/10.html
- 分类：消息队列
- 分组：教程目录
> 消费者组案例

需求：测试同一个消费者组中的消费者，同一时刻只能有一个消费者消费。

修改`consumer.properties`的`group.id`为任意的一个组名：

```java
vim consumer.properties
```

启动两个消费者，用同一个kafka服务开两个终端窗口执行即可：

```java
bin/kafka-console-consumer.sh --zookeeper hll4:2181 --topic bigdata --consumer.config config/consumer.properties
```

或者在另外一台kafka服务器开启一个消费者，前提是需要修改这台kafka的`consumer.properties`的`group.id`组名保持一样

启动一个生产者发送消息，会看到发完一个消息后只有一个消费者消费了消息

查看消费者：

**同组中同一时刻只有一个消费者消费数据，不同组中可以同时消费，前提是订阅的是同一个主题**
