# 09、Kafka 实战 - kafka消费者offset维护
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/9.html
- 分类：消息队列
- 分组：教程目录
> 消费者offset维护

### offset维护

由于consumer在消费过程中可能会出现断电宕机等故障，consumer恢复后，需要从故障前的位置继续消费，所以consumer需要实时记录自己消费到了哪个offset，以便恢复后继续消费。

**消费者是按照消费者组来保存offset的，不是按照消费者单独保存的，如果某个消费者挂掉了，按消费者保存就无法获取上之前消费到的offset**

之后，是按`消费者组+Topic+Partition`来确定唯一的一个offset

kafka0.9版本之前，consumer默认将offset保存在Zk中，从0.9版本开始，consumer默认将offset保存在kafka一个内置的topic中，该topic为_consumer_offsets

### offset存在zk

创建一个新topic

```java
bin/kafka-topics.sh --zookeeper hll4:2181 --create --topic bigdata --partitions 2 --replication-factor 2
```

启动一个生产者

```java
bin/kafka-console-producer.sh --broker-list hll1:9092 --topic bigdata
```

启动一个消费者

```java
bin/kafka-console-consumer.sh --zookeeper hll4:2181 --topic bigdata
```

连接Zk观察

```java
zkCli.sh
# ls /根目录可以看到kafka注册到zk的信息
[zk: localhost:2181(CONNECTED) 16] ls /
[cluster, controller_epoch, controller, brokers, zookeeper, admin, isr_change_notification, consumers, latest_producer_id_block, config]
#consumers就是启动的消费者组，注意这是消费者组
[zk: localhost:2181(CONNECTED) 17] ls /consumers
[console-consumer-7153]
[zk: localhost:2181(CONNECTED) 18] ls /consumers/console-consumer-7153
[ids, owners, offsets]
```

从zk查询到的offsets中就可以看到消费者组存储的offset信息

通过刚刚启动生产者生产一条消息，消费者也正常消费成功

进入到zk中，查看刚刚的offsets

```java
[zk: localhost:2181(CONNECTED) 29] ls /consumers/console-consumer-7153/offsets           
[bigdata]主题
[zk: localhost:2181(CONNECTED) 30] ls /consumers/console-consumer-7153/offsets/bigdata
[0, 1]这个0和1是分区
[zk: localhost:2181(CONNECTED) 31] get /consumers/console-consumer-7153/offsets/bigdata/0
1offset
cZxid = 0x200000042
ctime = Tue Jan 25 19:13:16 PST 2022
mZxid = 0x200000042
mtime = Tue Jan 25 19:13:16 PST 2022
pZxid = 0x200000042
cversion = 0
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 1
numChildren = 0
```

通过`get /consumers/console-consumer-7153/offsets/bigdata/0`，就可以看到当前消费的offset

查看`get /consumers/console-consumer-7153/offsets/bigdata/1`，offset是0，因为刚只生产了一条消息然后被消费

现在通过生产者，再生产一条消息被消费者消息后，再`get /consumers/console-consumer-7153/offsets/bigdata/1`，变成1了

注意：由于zk客户端的延迟，需要重新连接zkCli.sh才会观察到更新的数据

### offset存kafka本地

修改配置文件`consumer.properties`

```java
exclude.internal.topics=false
```

这时消费者服务需要用`bootstrap-server`来启动:

```java
bin/kafka-console-consumer.sh --bootstrap-server hll1:9092 --topic bigdata
```

查看offset

```java
bin/kafka-console-consumer.sh --topic __consumer_offsets --zookeeper hll4:2181 --formatter "kafka.coordinator.group.GroupMetadataManager\$OffsetsMessageFormatter" --consumer.config config/consumer.properties --from-beginning
```

重新执行查看offset命令异常的话，需要修改下`consumer.properties`修改下`group.id`配置

**Group + Topic + Partition确定唯一的offset**
