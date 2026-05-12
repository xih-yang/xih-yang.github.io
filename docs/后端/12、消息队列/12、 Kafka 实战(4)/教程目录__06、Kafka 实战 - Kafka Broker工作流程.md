# 06、Kafka 实战 - Kafka Broker工作流程
- 来源：https://ddkk.com/zhuanlan/mq/kafka/4/6.html
- 分类：消息队列
- 分组：教程目录
### 1 Zookeeper存储的Kafka消息

**1、** 启动zookeeper可客户端

```java
[lyx@hadoop102 zookeeper-3.5.7]$ bin/zkCli.sh
```

**2、** 通过ls命令查看Kafka相关信息

```java
[zk: localhost:2181(CONNECTED) 0] ls /kafka
```

### 2 Kafka Broker总体工作流程

Zookeeper集群与Kafka集群间的通信：

**1、** Kafka集群的每个broker启动之后都会向zookeeper进行注册。

**2、** 注册完毕之后开始选择controller节点（争先抢占方式）。

**3、** 选举出来的controller监听/brokers/ids/节点的变化。

**4、** 监控完毕之后根据选举规则开始真正的选举Leader。

**5、** Controller将节点的Leader信息和isr信息写到zookeeper上。

**6、** 其它的controller节点会冲zookeeper上拉取数据进行同步（防止controllerLeader挂了，随时上位）。

**7、** 生产者往集群发送数据，发送数据之后Leader主动与Follower进行同步（底层通过LOG进行存储，实际为segment，分为.log文件和.index文件）再进行应答。

**8、** 当Leader节点挂了之后controller监控到节点变化。

**9、** Controller从zookeeper上拉取Leader信息和isr信息。

**10、** Controller根据拉取的信息和选举规则再重新选举Leader。

**11、** 选举出来新的Leader之后更新zookeeper中的信息。

模拟Kafka上下线，观察zookeeper中数据的变化：

**1、** 查看/kafka/brokers/ids路径上的节点：

```java
[zk: localhost:2181(CONNECTED) 0] ls /kafka/brokers/ids
[0, 1, 2]
```

**2、** 查看/kafka/controller 路径上的数据：

```java
[zk: localhost:2181(CONNECTED) 1] get /kafka/controller
{
     "version":1,"brokerid":2,"timestamp":"1690261148573"}
```

**3、** 查看/kafka/brokers/topics/first/partitions/0/state 路径上的数据：

```java
[zk: localhost:2181(CONNECTED) 2] get /kafka/brokers/topics/first/partitions/0/state
{
     "controller_epoch":14,"leader":2,"version":1,"leader_epoch":20,"isr":[2,1,0]}
```

**4、** 停止hadoop104 上的 kafka：

**5、** 再次查看/kafka/brokers/ids 路径上的节点：

```java
[zk: localhost:2181(CONNECTED) 3] ls /kafka/brokers/ids
[0, 1]
```

**6、** 再次查看/kafka/controller 路径上的数据：

```java
[zk: localhost:2181(CONNECTED) 4] get /kafka/controller
{
     "version":1,"brokerid":0,"timestamp":"1690271464899"}
```

**7、** 再次查看/kafka/brokers/topics/first/partitions/0/state 路径上的数据：

```java
[zk: localhost:2181(CONNECTED) 5] get /kafka/brokers/topics/first/partitions/0/state
{
     "controller_epoch":14,"leader":1,"version":1,"leader_epoch":21,"isr":[1,0]}
```

**8、** 启动hadoop104 上的 kafka：

### 3 Broker重要参数
