# 09、Kafka 实战 - 副本的概念
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/9.html
- 分类：消息队列
- 分组：教程目录
## 副本的概念

在创建主题时，除了指明了主题的分区数以外，还指明了副本数，那么副本是⼀个什么概念呢？

副本是对分区的备份。在集群中，不同的副本会被部署在不同的broker上。下⾯例⼦：创建1个主题，2个分区、3个副本。

```java
./kafka-topics.sh \
--create \
--zookeeper 172.16.253.35:2181 \
--replication-factor 3 \
--partitions 2 \
--topic my-replicated-topic
```

副本是为了为主题中的分区创建多个备份，多个副本在kafka集群的多个broker中，会有⼀个副本作为leader，其他是follower。

查看topic情况:

```java
# 查看topic情况
./kafka-topics.sh \
--describe \
--zookeeper 172.16.253.35:2181 \
--topic my-replicated-topic
```

- leader：

kafka的写和读的操作，都发⽣在leader上。leader负责把数据同步给follower。当leader挂了，经过主从选举，从多个follower中选举产⽣⼀个新的leader
- follower

接收leader的同步的数据
- isr：

可以同步和已同步的节点会被存⼊到isr集合中。这⾥有⼀个细节：如果isr中的节点性能较差，会被提出isr集合。

### （重点～！）

此时，broker、主题、分区、副本 这些概念就全部展现了，⼤家需要把这些概念梳理清楚：

集群中有多个broker，创建主题时可以指明主题有多个分区（把消息拆分到不同的分区中存储），可以为分区创建多个副本，不同的副本存放在不同的broker⾥。
