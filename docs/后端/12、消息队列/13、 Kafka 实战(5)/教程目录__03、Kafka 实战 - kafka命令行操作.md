# 03、Kafka 实战 - kafka命令行操作
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/3.html
- 分类：消息队列
- 分组：教程目录
> kafka命令行操作

kafka的相关操作命令脚本文件在`bin`目录下

#### 查看所有的topic

```java
kafka-topics.sh --zookeeper hll1:2181 --list
或
kafka-topics.sh --zookeeper 192.168.171.132:2181 --list
```

`kafka-topics.sh`：topic执行脚本

`--zookeeper hll1:2181`：需要的zookeeper，hll1为安装zookeeper集群服务器的主机名，2181为端口，也可以直接使用ip:port的方式

`--list`：列出所有topic

#### 创建topic

```java
kafka-topics.sh --zookeeper hll2:2181 --create --partitions 2 --replication-factor 2 --topic demo1
```

`--create`：创建topic

`--partitions`：创建分区，后面数字代表创建几个分区

`--replication-factor`：创建副本，后面数字代表创建几个副本

`--topic demo1`：定义topic名为demo1

比如，当前命令创建2个分区，2个副本，按照之前的安装配置（kafka集群有三个服务），可以在`/opt/kafka/logs`目录下查看：

第一个kafka：生成了两个目录`demo1-0`，`demo1-1`

**解释下：demo1就是我们创建的topic名称，后面的-数字就是代表分区，-0、-1是 --partitions 2 表示创建了2个分区**

第二个kafka：

第三个kafka：

**结合kafka集群来看，总共可以看到两个demo1-0，两个demo1-1，是因为我们刚刚的命令创建的是 --replication factor 2 表示创建2个副本**

**同样可以创建2个分区，3个副本**

```java
kafka-topics.sh --zookeeper hll2:2181 --create --partitions 2 --replication-factor 3 --topic demo2
```

查看记录：生成demo2两个分区，在三个kafka另外两个kafka集群都有副本

**注意：创建的副本数不能超过kafka集群可用的broker数量，不能会报错**

#### 删除topic

```java
kafka-topics.sh --zookeeper hll2:2181 --delete --topic demo3
```

`--delete`：删除topic

注意：需要 server.properties 中设置 `delete.topic.enable=true` 否则只是标记删除。

执行完删除命令后，再去目录下查看，`demo3`的topic已经不存在了

#### 生产消息

```java
kafka-console-producer.sh --broker-list hll1:9092 --topic first
```

窗口进入到阻塞状态，等待输入消息

`kafka-console-producer.sh`：生产消息脚本

`--broker-list`：指定生产者，这里的指定的kafka生产者为，hll1:9092

`--topic first`：往first主题生产消息

#### 消费消息

```java
kafka-console-consumer.sh --zookeeper hll2:2181 --topic first --from-beginning
```

这里提示需要使用`bootstrap-server`代替`zookeeper`，因为这里使用的kafka的版本比较旧，0.8之后版本`zookeeper`将会被移除了，

可以使用`bootstrap-server`方式消费：

```java
kafka-console-consumer.sh --bootstrap-server hll1:9092 --topic first --from-beginning
```

`kafka-console-consumer.sh`：消费者脚本

`--zookeeper hll2:2181`：zk集群服务

`--topic first`：消费的主题

`--from-beginning`：会把主题中以往所有的数据都读取出来

`--bootstrap-server`：0.8版本以后的kafka，不再 通过zk去管理数据消费，使用broker统一管理

`hll1:9092`：kafka服务，可以为kafka集群中的任意一台

#### 查看topic#

```java
kafka-topics.sh --zookeeper hll2:2181 --describe --topic first
```

`--describe`：查看详情

**查询结果解释下：**

第一行为结果总览：

Topic:first 为主题名称，PartitionCount:2说明有2个分区，ReplicationFactor:2说明有2个副本

后面的两行，每一行都是一个分区的信息，因为有2个分区，所以有2行，从结果中的第二、三行的Partition数据就可以看出来。

Leader 是在给出的所有partitons中负责读写的节点，每个节点都有可能成为leader。

Replicas 显示副本所存储节点的节点列表，不管该节点是否是leader或者是否存活。

Isr副本都已同步的的节点集合，这个集合中的所有节点都是存活状态，并且跟leader同步。

#### 修改分区数

```java
kafka-topics.sh --zookeeper hll2:2181 --alter --topic first --partitions 3
```

执行成功后，再去查看主题first的分区，会看到有新的分区出现。

**注意：kafka只能新增分区，不能减少分区**
