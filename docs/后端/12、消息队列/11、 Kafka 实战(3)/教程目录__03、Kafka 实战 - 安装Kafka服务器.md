# 03、Kafka 实战 - 安装Kafka服务器
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/3.html
- 分类：消息队列
- 分组：教程目录
## Kafka基本知识

### Kafka介绍

Kafka是最初由Linkedin公司开发，是⼀个分布式、⽀持分区的（partition）、多副本的（replica），基于zookeeper协调的分布式消息系统，它的最⼤的特性就是可以实时的处理⼤量数据以满⾜各种需求场景：⽐如基于hadoop的批处理系统、低延迟的实时系统、Storm/Spark流式处理引擎，web/nginx⽇志、访问⽇志，消息服务等等，⽤scala语⾔编写，Linkedin于2010年贡献给了Apache基⾦会并成为顶级开源 项⽬。

#### Kafka的使⽤场景

- ⽇志收集：⼀个公司可以⽤Kafka收集各种服务的log，通过kafka以统⼀接⼝服务的⽅式开放给各种consumer，例如hadoop、Hbase、Solr等。
- 消息系统：解耦和⽣产者和消费者、缓存消息等。
- ⽤户活动跟踪：Kafka经常被⽤来记录web⽤户或者app⽤户的各种活动，如浏览⽹⻚、搜索、点击等活动，这些活动信息被各个服务器发布到kafka的topic中，然后订阅者通过订阅这些topic来做实时的监控分析，或者装载到hadoop、数据仓库中做离线分析和挖掘。
- 运营指标：Kafka也经常⽤来记录运营监控数据。包括收集各种分布式应⽤的数据，⽣产各种操作的集中反馈，⽐如报警和报告。

#### Kafka基本概念

kafka是⼀个分布式的，分区的消息(官⽅称之为commit log)服务。它提供⼀个消息系统应该具备的功能，但是确有着独特的设计。可以这样来说，Kafka借鉴了JMS规范的思想，但是确并没有完全遵循JMS规范。

⾸先，让我们来看⼀下基础的消息(Message)相关术语：

名称
解释

Broker
消息中间件处理节点，⼀个Kafka节点就是⼀个broker，⼀个或者多个Broker可以组成⼀个Kafka集群

–
–

Topic
Kafka根据topic对消息进⾏归类，发布到Kafka集群的每条消息都需要指定⼀个topic

–
–

Producer
消息⽣产者，向Broker发送消息的客户端

–
–

Consumer
消息消费者，从Broker读取消息的客户端

–
–

ConsumerGroup
每个Consumer属于⼀个特定的Consumer Group，⼀条消息可以被多个不同的Consumer Group消费，但是⼀个Consumer Group中只能有⼀个Consumer能够消费该消息

–
–

Partition
物理上的概念，⼀个topic可以分为多个partition，每个partition内部消息是有序的

因此，从⼀个较⾼的层⾯上来看，producer通过⽹络发送消息到Kafka集群，然后consumer

来进⾏消费，如下图：

服务端(brokers)和客户端(producer、consumer)之间通信通过TCP协议来完成

### kafka基本使⽤

#### 安装前的环境准备

- 安装jdk
- 安装zk
- 官⽹下载kafka的压缩包:http://kafka.apache.org/downloads，解压缩⾄如下路径

```java
/usr/local/kafka/
```

- 修改配置⽂件：/usr/local/kafka/kafka2.11-2.4/config/server.properties

```java
#broker.id属性在kafka集群中必须要是唯⼀
broker.id=0
#kafka部署的机器ip和提供服务的端⼝号
listeners=PLAINTEXT://192.168.65.60:9092 
#kafka的消息存储⽂件
log.dir=/usr/local/data/kafka-logs
#kafka连接zookeeper的地址
zookeeper.connect=192.168.65.60:2181
```

#### 启动kafka服务器

进⼊到bin⽬录下。使⽤命令来启动

```java
./kafka-server-start.sh -daemon ../config/server.properties
```

验证是否启动成功：

进⼊到zk中的节点看id是0的broker有没有存在（上线）

```java
ls /brokers/ids/
```

#### server.properties核⼼配置详解：

Property
Default
Description

broke.id
0
每个broker都可以⽤⼀个唯⼀的⾮负整数id进⾏标识；这个id可以作为broker的“名字”，你可以选择任意你喜欢的数字作为id，只要id是唯⼀的可。

logs.dirs
/temp/kafka-logs
kafka存放数据的路径。这个路径并不是唯⼀的，可以是多个，路径之间只需要使⽤逗号分隔即可；每当创建新partition时，都会选择在包含最少partitions的路径下进⾏。

listeners
PLAINTEXT:192.168.65.60:9092
server接受客户端连接的端⼝，ip配置kafka本机ip即可

zookeeper.connect
localhost:2181
zooKeeper连接字符串的格式为：hostname:port，此处hostname和port分别是ZooKeeper集群中某个节点的host和port；zookeeper如果是集群，连接⽅式为hostname1:port1, hostname2:port2,hostname3:port3

log.retention.hours
168
每个⽇志⽂件删除之前保存的时间。默认数据保存时间对所有topic都⼀样。

num.partitions
1
创建topic的默认分区数

default.replication.factor
1
⾃动创建topic的默认副本数量，建议设置为⼤于等于2

min.insync.replicas
1
当producer设置acks为-1时，min.insync.replicas指定replicas的最⼩数⽬（必须确认每⼀个repica的写数据都是成功的），如果这个数⽬没有达到，producer发送消息会产⽣异常

delete.topic.enable
false
是否允许删除主题
