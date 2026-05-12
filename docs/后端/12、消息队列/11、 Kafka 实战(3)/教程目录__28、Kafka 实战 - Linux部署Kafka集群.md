# 28、Kafka 实战 - Linux部署Kafka集群
- 来源：https://ddkk.com/zhuanlan/mq/kafka/3/28.html
- 分类：消息队列
- 分组：教程目录
## 准备

准备三台虚拟机，IP地址分别为：

```java
192.168.217.151
192.168.217.152
192.168.217.153
```

### 下载Jdk，Zookeeper和Kafka压缩包

下载地址：

```java
https://download.csdn.net/download/weixin_41405524/87515680
```

### 上传压缩包到服务器

将压缩包分别上传到三台Kafka服务器的/usr/local/kafka目录下，备用

### 初始化环境

#### 下载工具包

```java
yum -y install vim lrzsz bash-completion
```

#### 下载时钟同步

```java
yum -y install chrony
systemctl start chronyd
systemctl enable chronyd
systemctl status chronyd
chronyc sources
```

#### 关闭防火墙和安全认证

```java
systemctl stop firewalld
systemctl disable firewalld
setenforce 0
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
```

#### 配置HOSTS文件

```java
cat >> /etc/hosts << EOF
192.168.217.151 kafka1 工作节点1
192.168.217.152 kafka2 工作节点2
192.168.217.153 kafka3 工作节点3
EOF
```

#### 创建/usr/local/kafka目录

```java
mkdir /usr/local/kafka
cd /usr/local/kafka
```

### 安装JDK

#### 解压

```java
tar -xvf jdk-8u341-linux-x64.tar.gz && mv jdk1.8.0_341 jdk
```

#### 编辑环境变量

```java
cat >> /etc/profile  << EOF
export JAVA_HOME=/usr/local/kafka/jdk/
export JRE_HOME=$JAVA_HOME/jre
export PATH=$JAVA_HOME/bin:$JRE_HOME/bin:$PATH
export CLASSPATH=$JAVA_HOME/lib:$JRE_HOME/lib:./
EOF
source /etc/profile
```

#### 查看版本

```java
java -version
```

### 安装zookeeper

#### 解压

```java
tar -zxvf apache-zookeeper-3.6.4-bin.tar.gz 
mv apache-zookeeper-3.6.4-bin/ zookeeper
```

#### 创建data和log目录

```java
cd /usr/local/kafka/zookeeper
mkdir data && mkdir log
cd data
echo 1 > myid 1,2,3
```

#### 编辑配置文件

```java
cd /usr/local/kafka/zookeeper/conf
mv zoo_sample.cfg zoo.cfg
vim zoo.cfg
dataDir=/usr/local/kafka/zookeeper/data
dataLogDir=/usr/local/kafka/zookeeper/log
server.1=192.168.217.151:2888:3888
server.2=192.168.217.152:2888:3888
server.3=192.168.217.153:2888:3888
```

#### 配置环境变量

```java
echo 'export ZOOKEEPER_HOME=/usr/local/kafka/zookeeper' >> /etc/profile
echo 'export PATH=$PATH:$ZOOKEEPER_HOME/bin' >> /etc/profile
source /etc/profile
```

#### 启动Zookeeper

```java
cd /usr/local/kafka/zookeeper
./bin/zkServer.sh start
```

#### 查看状态

```java
./bin/zkServer.sh status
./bin/zkServer.sh status ./conf/zoo.cfg
```

### 安装Kafka

#### 解压文件，创建日志目录

```java
cd /usr/local/kafka
tar -zxvf kafka_2.13-3.4.0.tgz 
mv kafka_2.13-3.4.0 kafka
cd kafka/
mkdir log
ll
```

#### 编辑配置文件

```java
cd /usr/local/kafka/kafka
vim config/server.properties
```

**192、** 168.217.151；

```java
broker.id=1
listeners=PLAINTEXT://:9092
advertised.listeners=PLAINTEXT://192.168.217.151:9092
log.dirs=/usr/local/kafka/kafka/log
# topic 在当前broker上的分片个数，与broker保持一致
num.partitions=3
# 设置zookeeper集群地址与端口如下：
zookeeper.connect=192.168.217.151:2181,192.168.217.152:2181,192.168.217.153:2181
```

**192、** 1682.17.152；

```java
broker.id=2
listeners=PLAINTEXT://:9092
advertised.listeners=PLAINTEXT://192.168.217.152:9092
log.dirs=/usr/local/kafka/kafka/log
# topic 在当前broker上的分片个数，与broker保持一致
num.partitions=3
# 设置zookeeper集群地址与端口如下：
zookeeper.connect=192.168.217.151:2181,192.168.217.152:2181,192.168.217.153:2181
```

**192、** 168.217.153；

```java
broker.id=3
listeners=PLAINTEXT://:9092
advertised.listeners=PLAINTEXT://192.168.217.153:9092
log.dirs=/usr/local/kafka/kafka/log
# topic 在当前broker上的分片个数，与broker保持一致
num.partitions=3
# 设置zookeeper集群地址与端口如下：
zookeeper.connect=192.168.217.151:2181,192.168.217.152:2181,192.168.217.153:2181
```

#### 启动Kafka集群

```java
cd /usr/local/kafka/kafka
./bin/kafka-server-start.sh -daemon ./config/server.properties 
lsof -i:9092
```

#### 创建主题，查看主题

进入kafka目录下

```java
cd /usr/local/kafka/kafka
```

151节点下创建主题即可

```java
./bin/kafka-topics.sh --create --replication-factor 3 --partitions 2 --topic kafkatopic --bootstrap-server 192.168.217.151:9092
```

查看主题

```java
./bin/kafka-topics.sh --list --bootstrap-server 192.168.217.151:9092
```

#### 创建生产者

进入kafka目录下

```java
cd /usr/local/kafka/kafka
```

在151的broker上创建生产者

```java
./bin/kafka-console-producer.sh --broker-list 192.168.217.151:9092 --topic kafkatopic
```

#### 创建消费者

分别在152,153节点上创建消费者

```java
./bin/kafka-console-consumer.sh --bootstrap-server 192.168.217.152:9092 --topic kafkatopic
```

```java
./bin/kafka-console-consumer.sh --bootstrap-server 192.168.217.153:9092 --topic kafkatopic
```

生产者

消费者
