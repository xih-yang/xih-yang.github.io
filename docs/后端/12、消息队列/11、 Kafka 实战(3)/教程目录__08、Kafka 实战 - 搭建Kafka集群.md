# 08、Kafka 实战 - 搭建Kafka集群
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/8.html
- 分类：消息队列
- 分组：教程目录
## 搭建Kafka集群

### 准备配置文件

准备3个server.properties⽂件，每个⽂件中的这些内容要调整

- server.properties

```java
broker.id=0
listeners=PLAINTEXT://192.168.65.60:9092
log.dir=/usr/local/data/kafka-logs
```

- server1.properties

```java
broker.id=1
listeners=PLAINTEXT://192.168.65.60:9093
log.dir=/usr/local/data/kafka-logs-1
```

- server2.properties

```java
broker.id=2
listeners=PLAINTEXT://192.168.65.60:9094
log.dir=/usr/local/data/kafka-logs-2
```

### 启动集群

使⽤如下命令来启动3台服务器

```java
./kafka-server-start.sh \
-daemon ../config/server0.properties
./kafka-server-start.sh \
-daemon ../config/server1.properties
./kafka-server-start.sh \
-daemon ../config/server2.properties
```

### 测试是否启动成功

进⼊到zk中查看/brokers/ids中过是否有三个znode（0，1，2）
