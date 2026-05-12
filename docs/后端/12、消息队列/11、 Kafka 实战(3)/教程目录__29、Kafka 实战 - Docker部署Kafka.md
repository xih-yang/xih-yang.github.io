# 29、Kafka 实战 - Docker部署Kafka
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/29.html
- 分类：消息队列
- 分组：教程目录
### 背景

kafka是一个实时消息系统，具有高并发，高吞吐量的特点，那么如何在服务器的Docker中部署kafka呢？

接着看下去吧

如何安装Docker以及Docker的常用命令可以参考我的这篇文章

[Docker常用命令](https://blog.csdn.net/weixin_41405524/article/details/125510973)

### Kafka

`注：`因为Kafka依赖于zookeeper做分布式管理，因此需要先安装zookeeper

安装zookeeper

```java
docker run -d --name zookeeper -p 2181:2181 -t wurstmeister/zookeeper
```

安装kafka

```java
docker run -d --name kafka -p 9092:9092 -e KAFKA_BROKER_ID=0 \
-e KAFKA_ZOOKEEPER_CONNECT=192.168.83.128:2181 \
-e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.83.128:9092 \
-e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092 \
-t wurstmeister/kafka
```

查看容器是否运行

```java
docker ps
```

进入kafka

```java
docker exec -it 03a4b28cbdae /bin/sh
```

### Kafka常用命令

进入容器的bin目录下，可以执行以下命令

查看所有主题

```java
kafka-topics.sh  --zookeeper 192.168.83.128:2181 --list
```

查看主题信息

```java
kafka-topics.sh  --zookeeper 192.168.83.128:2181 
--describe --topic demo
```

删除主题

```java
kafka-topics.sh  --zookeeper 192.168.83.128:2181 
--delete --topic demo
```

创建主题

```java
kafka-topics.sh  --zookeeper 192.168.83.128:2181 
--create --replication-factor 1 --partitions 3 --topic demo
```

`注：`IP改成自己的本机IP即可
