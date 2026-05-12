# 02、Kafka 实战 - Kafka入门
- 来源：https://ddkk.com/zhuanlan/mq/kafka/4/2.html
- 分类：消息队列
- 分组：教程目录
## 1 安装部署

### 1.1 集群规划

### 1.2 集群部署

官方下载地址：http://kafka.apache.org/downloads.html

**1、** 解压安装包：

```java
tar -zxvf kafka_2.12-3.0.0.tgz -C /opt/module/
```

**2、** 修改解压后的文件名称：

```java
mv kafka_2.12-3.0.0/ kafka
```

**3、** 进入到/opt/module/kafka/config 目录，修改配置文件server.properties：

修改：
参数值broker.id=0（broker 的全局唯一编号，不能重复，只能是数字）；

kafka 运行日志(数据)存放的路径log.dirs=/opt/module/kafka/datas；

配置连接Zookeeper 集群地址zookeeper.connect=hadoop102:2181,hadoop103:2181,hadoop104:2181/kafka。

```java
#broker 的全局唯一编号，不能重复，只能是数字。
broker.id=0
#处理网络请求的线程数量
num.network.threads=3
#用来处理磁盘 IO 的线程数量 
num.io.threads=8
#发送套接字的缓冲区大小
socket.send.buffer.bytes=102400
#接收套接字的缓冲区大小
socket.receive.buffer.bytes=102400
#请求套接字的缓冲区大小 
socket.request.max.bytes=104857600
#kafka 运行日志(数据)存放的路径，路径不需要提前创建，kafka 自动帮你创建，可以配置多个磁盘路径，路径与路径之间可以用"，"分隔 
log.dirs=/opt/module/kafka/datas
#topic 在当前 broker 上的分区个数
num.partitions=1
#用来恢复和清理 data 下数据的线程数量 
num.recovery.threads.per.data.dir=1
# 每个 topic 创建时的副本数，默认时1 个副本 
offsets.topic.replication.factor=1
#segment 文件保留的最长时间，超时将被删除 
log.retention.hours=168
#每个 segment 文件的大小，默认最大 1G 
log.segment.bytes=1073741824
# 检查过期数据的时间，默认 5 分钟检查一次是否数据过期
log.retention.check.interval.ms=300000
#配置连接Zookeeper 集群地址（在 zk 根目录下创建/kafka，方便管理） 
zookeeper.connect=hadoop102:2181,hadoop103:2181,hadoop104:2181/kafka
```

**4、** 分发安装包

```java
xsync kafka/
```

**5、** 分别在 hadoop103 和 hadoop104 上修改配置文件/opt/module/kafka/config/server.properties中的 broker.id=1、broker.id=2。（broker.id 不得重复，整个集群中唯一。）

**6、** 在/etc/profile.d/my_env.sh 文件中增加kafka 环境变量配置：

```java
sudo vim /etc/profile.d/my_env.sh
#添加：
#KAFKA_HOME
export KAFKA_HOME=/opt/module/kafka
export PATH=$PATH:$KAFKA_HOME/bin
```

**7、** 刷新一下环境变量，并将环境变量分发到其它节点，并source。

```java
source /etc/profile
sudo xsync /etc/profile.d/my_env.sh
```

**8、** 启动集群时需要先启动zookeeper集群再启动Kafka，关闭集群时要先保证Kafka都关闭了才能关闭zookeeper。

### 1.3 集群启停脚本

**1、** 在/home/用户名/bin 目录下创建文件 kf.sh 脚本文件：

```java
#!/bin/bash
case $1 in
"start"){
    for i in hadoop102 hadoop103 hadoop104
    do
        echo " --------启动 $i Kafka--------"
        ssh $i "/opt/module/kafka/bin/kafka-server-start.sh - daemon /opt/module/kafka/config/server.properties"
    done
};;
"stop"){
    for i in hadoop102 hadoop103 hadoop104
    do
        echo " --------停止 $i Kafka--------"
        ssh $i "/opt/module/kafka/bin/kafka-server-stop.sh "
    done
};;
esac
```

**2、** 添加执行权限：

```java
chmod 777 kf.sh
```

**3、** 启动集群：

```java
zk.sh start
kf.sh start
```

注意：停止 Kafka 集群时，一定要等 Kafka 所有节点进程全部停止后再停止 Zookeeper集群。因为 Zookeeper 集群当中记录着 Kafka 集群相关信息，Zookeeper 集群一旦先停止， Kafka 集群就没有办法再获取停止进程的信息，只能手动杀死Kafka 进程了。

## 2 Kafka命令行操作

### 2.1 主题命令行操作

```java
#查看操作主题命令参数
bin/kafka-topics.sh
```

```java
#查看当前服务器中所有topic
bin/kafka-topics.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --list
#创建first topic
bin/kafka-topics.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --create --partitions 1 --replication-factor 3 --topic first
#选项说明：
#--topic 定义 topic 名
#--replication-factor 定义副本数
#--partitions 定义分区数
#查看first主题详情
bin/kafka-topics.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --describe --topic first
#修改分区数，分区数只能增不能减
bin/kafka-topics.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --alter --topic first --partitions 3
#删除topic
bin/kafka-topics.sh --bootsrtap-server hadoop102:9092,hadoop103:9093 --delete --topic first
```

### 2.2 生产者命令行操作

```java
#查看操作生产者命令参数
bin/kafka-console-producer.sh
```

```java
#发送消息
bin/kafka-console-producer.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --topic first
>hello
```

### 2.3 消费者命令行操作

```java
#查看操作消费者命令参数
bin/kafka-console-consumer.sh
```

```java
#消费first主题中的数据
bin/kafka-console-consumer.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --topic first
#把主题中所有的数据读取出来（包括历史数据）
bin/kafka-console-consumer.sh --bootstrap-server hadoop102:9092,hadoop103:9092 --from-beginning --topic first
```
