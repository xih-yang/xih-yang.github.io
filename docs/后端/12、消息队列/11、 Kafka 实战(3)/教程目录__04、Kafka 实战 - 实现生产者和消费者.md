# 04、Kafka 实战 - 实现生产者和消费者
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/4.html
- 分类：消息队列
- 分组：教程目录
## 生产者和消费者

### 创建主题topic

topic是什么概念？topic可以实现消息的分类，不同消费者订阅不同的topic

- 执⾏以下命令创建名为“test”的topic，这个topic只有⼀个partition，并且备份因⼦也设置为1：

```java
./kafka-topics.sh \
--create \
--zookeeper 172.16.253.35:2181 \
--replicationfactor 1 \
--partitions 1 \
--topic test
```

- 查看当前kafka内有哪些topic

```java
 ./kafka-topics.sh \
 --list \
 --zookeeper 172.16.253.35:2181
```

### 发送消息

kafka⾃带了⼀个producer命令客户端，可以从本地⽂件中读取内容，或者我们也可以以命令⾏中直接输⼊内容，并将这些内容以消息的形式发送到kafka集群中。在默认情况下，每⼀个⾏会被当做成⼀个独⽴的消息。使⽤kafka的发送消息的客户端，指定发送到的kafka服务器地址和topic

```java
./kafka-console-producer.sh \
--broker-list 172.16.253.38:9092 \
--topic test
```

### 消费消息

对于consumer，kafka同样也携带了⼀个命令⾏客户端，会将获取到内容在命令中进⾏输出，**默认是消费最新的消息**。使⽤kafka的消费者消息的客户端，从指定kafka服务器的指定topic中消费消息

- ⽅式⼀：从最后⼀条消息的偏移量+1开始消费

```java
./kafka-console-consumer.sh \
--bootstrap-server 172.16.253.38:9092 \
--topic test
```

- ⽅式⼆：从头开始消费

```java
./kafka-console-consumer.sh \
--bootstrap-server 172.16.253.38:9092 \
--from-beginning \
--topic test
```

⼏个注意点：

- 消息会被存储
- 消息是顺序存储
- 消息是有偏移量的
- 消费时可以指明偏移量进⾏消费
