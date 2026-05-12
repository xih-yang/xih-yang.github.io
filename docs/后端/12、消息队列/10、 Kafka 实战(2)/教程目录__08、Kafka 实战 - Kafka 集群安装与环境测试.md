# 08、Kafka 实战 - Kafka 集群安装与环境测试
- 来源：https://ddkk.com/zhuanlan/mq/kafka/2/8.html
- 分类：消息队列
- 分组：教程目录
### 一、下载

http://kafka.apache.org/downloads.html

http://mirrors.hust.edu.cn/apache/

### 二、安装前提（zookeeper安装）

[【Zookeeper】（二）Zookeeper 集群搭建](https://blog.csdn.net/BeiisBei/article/details/103674599)

### 三、安装

解压kafka(这里使用的是kafka2.11_2.0.0.tgz)

### 四、配置config/server.properties

**1、** 如果是分布式环境则需要修改broker.id的编号不能相同；

**2、** log.dir是存储数据的位置需要指定(不是日志)；

**3、** Zookeeper.connect=你的zookeeper的IP：2182（多个用逗号隔开）；

```java
//当前机器在集群中的唯一标识，和zookeeper的myid性质一样
broker.id=0
//当前kafka对外提供服务的端口默认是9092
port=9092
//这个参数默认是关闭的，在0.8.1有个bug，DNS解析问题，失败率的问题。
host.name=hadoop1
//这个是borker进行网络处理的线程数
num.network.threads=3
//这个是borker进行I/O处理的线程数
num.io.threads=8
//发送缓冲区buffer大小，数据不是一下子就发送的，先回存储到缓冲区了到达一定的大小后在发送，能提高性能
socket.send.buffer.bytes=102400
//kafka接收缓冲区大小，当数据到达一定大小后在序列化到磁盘
socket.receive.buffer.bytes=102400
//这个参数是向kafka请求消息或者向kafka发送消息的请请求的最大数，这个值不能超过java的堆栈大小
socket.request.max.bytes=104857600
//消息存放的目录，这个目录可以配置为“，”逗号分割的表达式，上面的num.io.threads要大于这个目录的个数这个目录，
//如果配置多个目录，新创建的topic他把消息持久化的地方是，当前以逗号分割的目录中，那个分区数最少就放那一个
log.dirs=/home/hadoop/log/kafka-logs
//默认的分区数，一个topic默认1个分区数
num.partitions=1
//每个数据目录用来日志恢复的线程数目
num.recovery.threads.per.data.dir=1
//默认消息的最大持久化时间，168小时，7天
log.retention.hours=168
//这个参数是：因为kafka的消息是以追加的形式落地到文件，当超过这个值的时候，kafka会新起一个文件
log.segment.bytes=1073741824
//每隔300000毫秒去检查上面配置的log失效时间
log.retention.check.interval.ms=300000
//是否启用log压缩，一般不用启用，启用的话可以提高性能
log.cleaner.enable=false
//设置zookeeper的连接端口
zookeeper.connect=192.168.123.102:2181,192.168.123.103:2181,192.168.123.104:2181
//设置zookeeper的连接超时时间
zookeeper.connection.timeout.ms=6000
```

### 五、修改环境变量

**记得要保存，使其生效！**

```java
source /etc/profile
```

### 五、启动

#### 1、首先启动zookeeper集群

所有zookeeper节点都需要执行

```java
[hadoop@hadoop1 ~]$ zkServer.sh start
```

#### 2、启动Kafka集群服务

```java
kafka-server-start.sh /opt/soft/kafka211/config/server.properties
```

### 六、环境测试

#### 1、建立topic(消息队列)

```java
kafka-topics.sh --create \
--zookeeper 你的zookeeper的IP:2181 \ 			
--replication-factor 副本数 \
--partitions 分区数 \
--topic 消息队列名
```

#### 2、检查队列是否创建成功

```java
kafka-topics.sh --zookeeper 你的zookeeper的IP:2181  --list
```

#### 3、向你的消息队列中生产消息

```java
kafka-console-producer.sh --topic 队列名 \
--broker-list 你的kafka队列的机器IP:9092 \
```

#### 4、消费消息

```java
kafka-console-consumer.sh --bootstrap-server 你的kafka的IP:9092 \
--topic 队列名
```
