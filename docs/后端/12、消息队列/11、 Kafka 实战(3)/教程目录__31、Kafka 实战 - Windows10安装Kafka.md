# 31、Kafka 实战 - Windows10安装Kafka
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/31.html
- 分类：消息队列
- 分组：教程目录
### 下载zookeeper和kafka

[zookeeper](https://zookeeper.apache.org/releases.html)

[kafka](http://kafka.apache.org/downloads)

### 解压与配置

#### zookeeper配置与启动

conf 目录下,把zoo_sample.cfg重命名成zoo.cfg

配置zookeeper的Windows系统环境变量

启动zookeeper

成功提示

#### kafka配置与启动

config里修改 server.properties，配置日志目录

进入kafka安装目录启动kafka

```java
.\bin\windows\kafka-server-start.bat .\config\server.properties
```

启动成功

### 测试

创建主题

```java
kafka-topics.bat --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic demo
```

在Windows目录下起两个cmd窗口创建生产者和消费者，生产者发送消息，消费者能实时获取到

```java
kafka-console-producer.bat --broker-list localhost:9092 --topic demo
kafka-console-consumer.bat --bootstrap-server localhost:9092 --topic demo --from-beginning
```
