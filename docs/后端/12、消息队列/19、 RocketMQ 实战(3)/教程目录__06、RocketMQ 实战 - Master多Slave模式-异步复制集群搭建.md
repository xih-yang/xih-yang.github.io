# 06、RocketMQ 实战 - Master多Slave模式-异步复制集群搭建
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/7/6.html
- 分类：消息队列
- 分组：教程目录
## 一、概述

前面一篇文章我们介绍了RocketMQ集群的四种模式，分别为：

**单Master模式、多Master模式、多Master多Slave模式-异步复制、多Master多Slave模式-同步双写。**

在生产环境中，RocketMQ通常都是集群部署的，避免单点故障问题，保证RocketMQ的高可用。

本篇文章我们将演示如何搭建多Master多Slave模式-异步复制的RocketMQ集群，超详细，一步一步跟着操作，我不信还搭建不出来。

## 二、环境准备

我们需要准备几台Linux服务器，笔者这里提前准备了四台虚拟机，具体角色如下表：

RocketMQ-Master01

RocketMQ-Master02

RocketMQ-Slave01

RocketMQ-Slave02

IP地址

10.0.90.59

10.0.90.144

10.0.91.8

10.0.91.49

为了方便，我们这里直接通过命令**【systemctl stop firewalld.service】**关闭服务器的防火墙，如果不关闭的话，那么我们需要对外暴露需要RocketMQ被外部访问的端口。

## 三、总体架构图

多Master多Slave模式-异步复制模式的RocketMQ集群，总体架构图如下：

有关架构图中集群间交互方式的说明：

- (1) Broker Master 和 Broker Slave 是主从结构，会执行数据同步 Data Sync；
- (2) 每个 Broker 与 NameServer 集群中所有节点建立长连接，定时注册 Topic 信息到所有 NameServer；
- (3) Producer 与 NameServer 集群中的其中一个节点（随机）建立长连接，定期从 NameServer 获取 Topic 路由信息，并与提供 Topic 服务的 Broker Master 建立长连接，定时向 Broker 发送心跳；
- (4) Producer 只能将消息发送到 Broker Master，但是 Consumer 同时和提供 Topic 服务的 Master 和 Slave 建立长连接，既可以从 Master 订阅消息，也可以从 Slave 订阅消息；

集群各个角色参考配置如下：

下面我们对照这张表，挨个修改各个RocketMQ节点的broker配置文件，笔者这里直接修改**/rocketmq/rocketmq-4.9.2/conf/broker.conf**配置文件。当然也可以直接参考rocketMQ安装目录下的/conf/2m-2s-async里面的配置进行配置，启动的时候指定特定的配置文件即可，如下图：

## 四、配置RocketMQ-Master01(主1 - 10.0.90.59)

我们首先创建消息存储路径，RocketMQ获取到消息后，broker会默认将消息进行持久化，持久化目录默认为 /home，我们可以修改消息存储路径：

```java
[admin@admin rocketmq-4.9.2]$ mkdir ./store/commitlog
[admin@admin rocketmq-4.9.2]$ mkdir ./store/consumequeue
[admin@admin rocketmq-4.9.2]$ mkdir ./store/index
[admin@admin rocketmq-4.9.2]$ cd store/
[admin@admin store]$ ll
total 0
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 commitlog
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 consumequeue
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 index
```

接下来编辑broker.conf：

```java
[admin@admin conf]$ pwd
/rocketmq/rocketmq-4.9.2/conf
[admin@admin conf]$ vim broker.conf
```

broker.conf具体内容如下：

```java
#所属集群名称
brokerClusterName=DefaultCluster
#broker名字，同一组的master-slave中，broker名字相同
brokerName=broker-a
#brokerId的ID，0 表示Master，>0 表示Slave
brokerId=0
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认 48 小时
fileReservedTime=48
#Broker 的角色
#- ASYNC_MASTER 异步复制Master
#- SYNC_MASTER 同步双写Master
#- SLAVE
brokerRole=ASYNC_MASTER
#刷盘方式
#- ASYNC_FLUSH 异步刷盘
#- SYNC_FLUSH 同步刷盘
flushDiskType=ASYNC_FLUSH
#nameServer集群地址，如果是多个，使用分号;分割
namesrvAddr=10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
brokerIP1=10.0.90.59
#存储路径
storePathRootDir=/rocketmq/rocketmq-4.9.2/store
#commitLog 存储路径
storePathCommitLog=/rocketmq/rocketmq-4.9.2/store/commitlog
#消费队列存储路径存储路径
storePathConsumeQueue=/rocketmq/rocketmq-4.9.2/store/consumequeue
#消息索引存储路径
storePathIndex=/rocketmq/rocketmq-4.9.2/store/index
#checkpoint 文件存储路径
storeCheckpoint=/rocketmq/rocketmq-4.9.2/store/checkpoint
#abort 文件存储路径
abortFile=/rocketmq/rocketmq-4.9.2/store/abort
```

## 五、配置RocketMQ-Master02(主2 - 10.0.90.144)

我们首先创建消息存储路径，RocketMQ获取到消息后，broker会默认将消息进行持久化，持久化目录默认为 /home，我们可以修改消息存储路径：

```java
[admin@admin rocketmq-4.9.2]$ mkdir ./store/commitlog
[admin@admin rocketmq-4.9.2]$ mkdir ./store/consumequeue
[admin@admin rocketmq-4.9.2]$ mkdir ./store/index
[admin@admin rocketmq-4.9.2]$ cd store/
[admin@admin store]$ ll
total 0
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 commitlog
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 consumequeue
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 index
```

接下来编辑broker.conf ：

```java
[root@admin conf]# pwd
/rocketmq/rocketmq-4.9.2/conf
[root@admin conf]# vim broker.conf 
```

broker.conf的具体内容如下：

```java
#所属集群名称
brokerClusterName=DefaultCluster
#broker名字，同一组的master-slave中，broker名字相同
brokerName=broker-b
#brokerId的ID，0 表示Master，>0 表示Slave
brokerId=0
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认 48 小时
fileReservedTime=48
#Broker 的角色
#- ASYNC_MASTER 异步复制Master
#- SYNC_MASTER 同步双写Master
#- SLAVE
brokerRole=ASYNC_MASTER
#刷盘方式
#- ASYNC_FLUSH 异步刷盘
#- SYNC_FLUSH 同步刷盘
flushDiskType=ASYNC_FLUSH
#nameServer集群地址，如果是多个，使用分号;分割
namesrvAddr=10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
brokerIP1=10.0.90.144
torePathRootDir=/rocketmq/rocketmq-4.9.2/store
#commitLog 存储路径
storePathCommitLog=/rocketmq/rocketmq-4.9.2/store/commitlog
#消费队列存储路径存储路径
storePathConsumeQueue=/rocketmq/rocketmq-4.9.2/store/consumequeue
#消息索引存储路径
storePathIndex=/rocketmq/rocketmq-4.9.2/store/index
#checkpoint 文件存储路径
storeCheckpoint=/rocketmq/rocketmq-4.9.2/store/checkpoint
#abort 文件存储路径
abortFile=/rocketmq/rocketmq-4.9.2/store/abort
```

## 六、配置RocketMQ-Slave01(从1 - 10.0.91.8)

我们首先创建消息存储路径，RocketMQ获取到消息后，broker会默认将消息进行持久化，持久化目录默认为 /home，我们可以修改消息存储路径：

```java
[admin@admin rocketmq-4.9.2]$ mkdir ./store/commitlog
[admin@admin rocketmq-4.9.2]$ mkdir ./store/consumequeue
[admin@admin rocketmq-4.9.2]$ mkdir ./store/index
[admin@admin rocketmq-4.9.2]$ cd store/
[admin@admin store]$ ll
total 0
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 commitlog
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 consumequeue
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 index
```

接下来配置broker.conf：

```java
[root@admin conf]# pwd
/rocketmq/rocketmq-4.9.2/conf
[root@admin conf]# vim broker.conf
```

broker.conf的具体内容如下：

```java
#所属集群名称
brokerClusterName=DefaultCluster
#broker名字，同一组的master-slave中，broker名字相同
brokerName=broker-a
#brokerId的ID，0 表示Master，>0 表示Slave
brokerId=1
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认 48 小时
fileReservedTime=48
#Broker 的角色
#- ASYNC_MASTER 异步复制Master
#- SYNC_MASTER 同步双写Master
#- SLAVE
brokerRole=SLAVE
#刷盘方式
#- ASYNC_FLUSH 异步刷盘
#- SYNC_FLUSH 同步刷盘
flushDiskType=ASYNC_FLUSH
#nameServer集群地址，如果是多个，使用分号;分割
namesrvAddr=10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
brokerIP1=10.0.91.8
#存储路径
storePathRootDir=/rocketmq/rocketmq-4.9.2/store
#commitLog 存储路径
storePathCommitLog=/rocketmq/rocketmq-4.9.2/store/commitlog
#消费队列存储路径存储路径
storePathConsumeQueue=/rocketmq/rocketmq-4.9.2/store/consumequeue
#消息索引存储路径
storePathIndex=/rocketmq/rocketmq-4.9.2/store/index
#checkpoint 文件存储路径
storeCheckpoint=/rocketmq/rocketmq-4.9.2/store/checkpoint
#abort 文件存储路径
abortFile=/rocketmq/rocketmq-4.9.2/store/abort
```

## 七、配置RocketMQ-Slave02(从2 - 10.0.91.49)

我们首先创建消息存储路径，RocketMQ获取到消息后，broker会默认将消息进行持久化，持久化目录默认为 /home，我们可以修改消息存储路径：

```java
[admin@admin rocketmq-4.9.2]$ mkdir ./store/commitlog
[admin@admin rocketmq-4.9.2]$ mkdir ./store/consumequeue
[admin@admin rocketmq-4.9.2]$ mkdir ./store/index
[admin@admin rocketmq-4.9.2]$ cd store/
[admin@admin store]$ ll
total 0
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 commitlog
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 consumequeue
drwxrwxr-x. 2 admin admin 6 Feb 18 09:50 index
```

接下来配置broker.conf：

```java
[root@admin conf]# pwd
/rocketmq/rocketmq-4.9.2/conf
[root@admin conf]# vim broker.conf 
```

broker.conf的具体内容如下：

```java
#所属集群名称
brokerClusterName=DefaultCluster
#broker名字，同一组的master-slave中，broker名字相同
brokerName=broker-b
#brokerId的ID，0 表示Master，>0 表示Slave
brokerId=1
#删除文件时间点，默认凌晨 4点    
deleteWhen=04
#文件保留时间，默认 48 小时
fileReservedTime=48
#Broker 的角色
#- ASYNC_MASTER 异步复制Master
#- SYNC_MASTER 同步双写Master
#- SLAVE
brokerRole=SLAVE
#刷盘方式
#- ASYNC_FLUSH 异步刷盘
#- SYNC_FLUSH 同步刷盘
flushDiskType=ASYNC_FLUSH
#nameServer集群地址，如果是多个，使用分号;分割
namesrvAddr=10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
brokerIP1=10.0.91.49
#存储路径
storePathRootDir=/rocketmq/rocketmq-4.9.2/store
#commitLog 存储路径
storePathCommitLog=/rocketmq/rocketmq-4.9.2/store/commitlog
#消费队列存储路径存储路径
storePathConsumeQueue=/rocketmq/rocketmq-4.9.2/store/consumequeue
#消息索引存储路径
storePathIndex=/rocketmq/rocketmq-4.9.2/store/index
#checkpoint 文件存储路径
storeCheckpoint=/rocketmq/rocketmq-4.9.2/store/checkpoint
#abort 文件存储路径
abortFile=/rocketmq/rocketmq-4.9.2/store/abort
```

## 八、启动NameServer集群

依次在四台虚拟机中执行启动NameServer的命令，具体如下

- 1、10.0.90.59

```java
[admin@admin rocketmq-4.9.2]$ nohup sh bin/mqnamesrv -n 10.0.90.59:9876 &
[1] 2174
[admin@admin rocketmq-4.9.2]$ nohup: ignoring input and appending output to ‘nohup.out’
[admin@admin rocketmq-4.9.2]$ tail -f ~/logs/rocketmqlogs/namesrv.log
2022-02-18 09:57:55 INFO main - tls.client.keyPassword = null
2022-02-18 09:57:55 INFO main - tls.client.certPath = null
2022-02-18 09:57:55 INFO main - tls.client.authServer = false
2022-02-18 09:57:55 INFO main - tls.client.trustCertPath = null
2022-02-18 09:57:55 INFO main - Using JDK SSL provider
2022-02-18 09:57:57 INFO main - SSLContext created for server
2022-02-18 09:57:57 INFO main - Try to start service thread:FileWatchService started:false lastThread:null
2022-02-18 09:57:57 INFO main - The Name Server boot success. serializeType=JSON
2022-02-18 09:57:57 INFO NettyEventExecutor - NettyEventExecutor service started
2022-02-18 09:57:57 INFO FileWatchService - FileWatchService service started
```

- 2、10.0.90.144

```java
[root@admin rocketmq-4.9.2]# nohup sh bin/mqnamesrv -n 10.0.90.144:9876 &
[1] 3255
[root@admin rocketmq-4.9.2]# nohup: ignoring input and appending output to ‘nohup.out’
[root@admin rocketmq-4.9.2]# tail -f ~/logs/rocketmqlogs/namesrv.log
2022-02-18 09:58:27 INFO main - tls.client.keyPassword = null
2022-02-18 09:58:27 INFO main - tls.client.certPath = null
2022-02-18 09:58:27 INFO main - tls.client.authServer = false
2022-02-18 09:58:27 INFO main - tls.client.trustCertPath = null
2022-02-18 09:58:27 INFO main - Using JDK SSL provider
2022-02-18 09:58:29 INFO main - SSLContext created for server
2022-02-18 09:58:30 INFO main - Try to start service thread:FileWatchService started:false lastThread:null
2022-02-18 09:58:30 INFO NettyEventExecutor - NettyEventExecutor service started
2022-02-18 09:58:30 INFO main - The Name Server boot success. serializeType=JSON
2022-02-18 09:58:30 INFO FileWatchService - FileWatchService service started
```

- 3、10.0.91.8

```java
[root@admin rocketmq-4.9.2]# nohup sh bin/mqnamesrv -n 10.0.91.8:9876 &
[1] 2172
[root@admin rocketmq-4.9.2]# nohup: ignoring input and appending output to ‘nohup.out’
[root@admin rocketmq-4.9.2]# tail -f ~/logs/rocketmqlogs/namesrv.log
2022-02-18 09:58:59 INFO main - tls.client.keyPassword = null
2022-02-18 09:58:59 INFO main - tls.client.certPath = null
2022-02-18 09:58:59 INFO main - tls.client.authServer = false
2022-02-18 09:58:59 INFO main - tls.client.trustCertPath = null
2022-02-18 09:58:59 INFO main - Using JDK SSL provider
2022-02-18 09:59:01 INFO main - SSLContext created for server
2022-02-18 09:59:01 INFO main - Try to start service thread:FileWatchService started:false lastThread:null
2022-02-18 09:59:01 INFO main - The Name Server boot success. serializeType=JSON
2022-02-18 09:59:02 INFO NettyEventExecutor - NettyEventExecutor service started
2022-02-18 09:59:02 INFO FileWatchService - FileWatchService service started
```

- 4、10.0.91.49

```java
[root@admin rocketmq-4.9.2]# nohup sh bin/mqnamesrv -n 10.0.91.49:9876 &
[1] 2174
[root@admin rocketmq-4.9.2]# nohup: ignoring input and appending output to ‘nohup.out’
[root@admin rocketmq-4.9.2]#  tail -f ~/logs/rocketmqlogs/namesrv.log
2022-02-18 09:59:34 INFO main - tls.client.keyPassword = null
2022-02-18 09:59:34 INFO main - tls.client.certPath = null
2022-02-18 09:59:34 INFO main - tls.client.authServer = false
2022-02-18 09:59:34 INFO main - tls.client.trustCertPath = null
2022-02-18 09:59:34 INFO main - Using JDK SSL provider
2022-02-18 09:59:36 INFO main - SSLContext created for server
2022-02-18 09:59:36 INFO main - Try to start service thread:FileWatchService started:false lastThread:null
2022-02-18 09:59:36 INFO main - The Name Server boot success. serializeType=JSON
2022-02-18 09:59:37 INFO NettyEventExecutor - NettyEventExecutor service started
2022-02-18 09:59:37 INFO FileWatchService - FileWatchService service started
```

可以看至此，四个节点的NameServer的集群启动成功了，接下来是启动Broker节点。

## 九、启动Broker集群

- 1、启动Master01

```java
[admin@admin rocketmq-4.9.2]$ nohup sh bin/mqbroker -n '10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876' -c conf/broker.conf autoCreateTopicEnable=true & 
[2] 2318
[admin@admin rocketmq-4.9.2]$ nohup: ignoring input and appending output to ‘nohup.out’
[admin@admin rocketmq-4.9.2]$ tail -f ~/logs/rocketmqlogs/broker.log 
2022-02-18 10:02:26 INFO main - transientStorePoolSize=5
2022-02-18 10:02:26 INFO main - fastFailIfNoBufferInStorePool=false
2022-02-18 10:02:26 INFO main - enableDLegerCommitLog=false
2022-02-18 10:02:26 INFO main - dLegerGroup=
2022-02-18 10:02:26 INFO main - dLegerPeers=
2022-02-18 10:02:26 INFO main - dLegerSelfId=
2022-02-18 10:02:26 INFO main - preferredLeaderId=
2022-02-18 10:02:26 INFO main - isEnableBatchPush=false
2022-02-18 10:02:26 INFO main - enableScheduleMessageStats=true
2022-02-18 10:02:26 INFO main - Try to start service thread:AllocateMappedFileService started:false lastThread:null
2022-02-18 10:02:28 INFO main - Set user specified name server address: 10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
2022-02-18 10:02:28 WARN main - Load default transaction message hook service: TransactionalMessageServiceImpl
2022-02-18 10:02:28 WARN main - Load default discard message hook service: DefaultTransactionalMessageCheckListener
2022-02-18 10:02:28 INFO main - The broker dose not enable acl
2022-02-18 10:02:28 INFO main - Try to start service thread:ReputMessageService started:false lastThread:null
2022-02-18 10:02:28 INFO main - Try to start service thread:AcceptSocketService started:false lastThread:null
2022-02-18 10:02:28 INFO main - Try to start service thread:GroupTransferService started:false lastThread:null
2022-02-18 10:02:28 INFO main - Try to start service thread:HAClient started:false lastThread:null
2022-02-18 10:02:28 INFO main - Try to start service thread:FlushConsumeQueueService started:false lastThread:null
2022-02-18 10:02:28 INFO main - Try to start service thread:FlushRealTimeService started:false lastThread:null
2022-02-18 10:02:28 INFO main - Try to start service thread:StoreStatsService started:false lastThread:null
2022-02-18 10:02:29 INFO main - Try to start service thread:FileWatchService started:false lastThread:null
2022-02-18 10:02:29 INFO FileWatchService - FileWatchService service started
2022-02-18 10:02:29 INFO main - Try to start service thread:PullRequestHoldService started:false lastThread:null
2022-02-18 10:02:29 INFO PullRequestHoldService - PullRequestHoldService service started
2022-02-18 10:02:29 INFO main - Try to start service thread:TransactionalMessageCheckService started:false lastThread:null
2022-02-18 10:02:30 INFO brokerOutApi_thread_2 - register broker[0]to name server 10.0.91.49:9876 OK
2022-02-18 10:02:30 INFO brokerOutApi_thread_4 - register broker[0]to name server 10.0.90.144:9876 OK
2022-02-18 10:02:30 INFO brokerOutApi_thread_3 - register broker[0]to name server 10.0.91.8:9876 OK
2022-02-18 10:02:30 INFO brokerOutApi_thread_1 - register broker[0]to name server 10.0.90.59:9876 OK
2022-02-18 10:02:30 INFO main - The broker[broker-a, 10.0.90.59:10911] boot success. serializeType=JSON and name server is 10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
2022-02-18 10:02:38 INFO BrokerControllerScheduledThread1 - dispatch behind commit log 0 bytes
2022-02-18 10:02:38 INFO BrokerControllerScheduledThread1 - Slave fall behind master: 0 bytes
2022-02-18 10:02:40 INFO brokerOutApi_thread_4 - register broker[0]to name server 10.0.91.49:9876 OK
2022-02-18 10:02:40 INFO brokerOutApi_thread_1 - register broker[0]to name server 10.0.90.144:9876 OK
2022-02-18 10:02:40 INFO brokerOutApi_thread_2 - register broker[0]to name server 10.0.90.59:9876 OK
2022-02-18 10:02:40 INFO brokerOutApi_thread_3 - register broker[0]to name server 10.0.91.8:9876 OK
[admin@admin rocketmq-4.9.2]$ jps
2195 NamesrvStartup
2452 Jps
2326 BrokerStartup
```

- 2、启动Master02

```java
[root@admin rocketmq-4.9.2]# nohup sh bin/mqbroker -n '10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876' -c conf/broker.conf autoCreateTopicEnable=true & 
[2] 3410
[root@admin rocketmq-4.9.2]# nohup: ignoring input and appending output to ‘nohup.out’
[root@admin rocketmq-4.9.2]# tail -f ~/logs/rocketmqlogs/broker.log
2022-02-18 10:03:19 INFO main - Try to start service thread:FileWatchService started:false lastThread:null
2022-02-18 10:03:19 INFO FileWatchService - FileWatchService service started
2022-02-18 10:03:19 INFO main - Try to start service thread:PullRequestHoldService started:false lastThread:null
2022-02-18 10:03:19 INFO PullRequestHoldService - PullRequestHoldService service started
2022-02-18 10:03:19 INFO main - Try to start service thread:TransactionalMessageCheckService started:false lastThread:null
2022-02-18 10:03:19 INFO brokerOutApi_thread_1 - register broker[0]to name server 10.0.90.59:9876 OK
2022-02-18 10:03:19 INFO brokerOutApi_thread_2 - register broker[0]to name server 10.0.91.8:9876 OK
2022-02-18 10:03:19 INFO brokerOutApi_thread_3 - register broker[0]to name server 10.0.91.49:9876 OK
2022-02-18 10:03:19 INFO brokerOutApi_thread_4 - register broker[0]to name server 10.0.90.144:9876 OK
2022-02-18 10:03:19 INFO main - The broker[broker-b, 10.0.90.144:10911] boot success. serializeType=JSON and name server is 10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
2022-02-18 10:03:29 INFO BrokerControllerScheduledThread1 - dispatch behind commit log 0 bytes
2022-02-18 10:03:29 INFO BrokerControllerScheduledThread1 - Slave fall behind master: 0 bytes
2022-02-18 10:03:30 INFO brokerOutApi_thread_4 - register broker[0]to name server 10.0.90.144:9876 OK
2022-02-18 10:03:30 INFO brokerOutApi_thread_2 - register broker[0]to name server 10.0.91.8:9876 OK
2022-02-18 10:03:30 INFO brokerOutApi_thread_3 - register broker[0]to name server 10.0.91.49:9876 OK
2022-02-18 10:03:30 INFO brokerOutApi_thread_1 - register broker[0]to name server 10.0.90.59:9876 OK
[root@admin rocketmq-4.9.2]# jps
3418 BrokerStartup
3276 NamesrvStartup
3533 Jps
```

- 3、启动Slave01

```java
[root@admin rocketmq-4.9.2]# nohup sh bin/mqbroker -n '10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876' -c conf/broker.conf autoCreateTopicEnable=true & 
[2] 2324
[root@admin rocketmq-4.9.2]# nohup: ignoring input and appending output to ‘nohup.out’
[root@admin rocketmq-4.9.2]# tail -f ~/logs/rocketmqlogs/broker.log
2022-02-18 10:04:00 INFO main - transientStorePoolSize=5
2022-02-18 10:04:00 INFO main - fastFailIfNoBufferInStorePool=false
2022-02-18 10:04:00 INFO main - enableDLegerCommitLog=false
2022-02-18 10:04:00 INFO main - dLegerGroup=
2022-02-18 10:04:00 INFO main - dLegerPeers=
2022-02-18 10:04:00 INFO main - dLegerSelfId=
2022-02-18 10:04:00 INFO main - preferredLeaderId=
2022-02-18 10:04:00 INFO main - isEnableBatchPush=false
2022-02-18 10:04:00 INFO main - enableScheduleMessageStats=true
2022-02-18 10:04:01 INFO main - Try to start service thread:AllocateMappedFileService started:false lastThread:null
2022-02-18 10:04:03 INFO main - Set user specified name server address: 10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
2022-02-18 10:04:03 WARN main - Load default transaction message hook service: TransactionalMessageServiceImpl
2022-02-18 10:04:03 WARN main - Load default discard message hook service: DefaultTransactionalMessageCheckListener
2022-02-18 10:04:03 INFO main - The broker dose not enable acl
2022-02-18 10:04:03 INFO main - Try to start service thread:ReputMessageService started:false lastThread:null
2022-02-18 10:04:03 INFO main - Try to start service thread:AcceptSocketService started:false lastThread:null
2022-02-18 10:04:03 INFO main - Try to start service thread:GroupTransferService started:false lastThread:null
2022-02-18 10:04:03 INFO main - Try to start service thread:HAClient started:false lastThread:null
2022-02-18 10:04:03 INFO main - Try to start service thread:FlushConsumeQueueService started:false lastThread:null
2022-02-18 10:04:03 INFO main - Try to start service thread:FlushRealTimeService started:false lastThread:null
2022-02-18 10:04:03 INFO main - Try to start service thread:StoreStatsService started:false lastThread:null
2022-02-18 10:04:03 INFO main - Try to start service thread:FileWatchService started:false lastThread:null
2022-02-18 10:04:03 INFO main - Try to start service thread:PullRequestHoldService started:false lastThread:null
2022-02-18 10:04:03 INFO PullRequestHoldService - PullRequestHoldService service started
2022-02-18 10:04:03 INFO FileWatchService - FileWatchService service started
2022-02-18 10:04:04 INFO brokerOutApi_thread_2 - register broker[1]to name server 10.0.90.59:9876 OK
2022-02-18 10:04:04 INFO brokerOutApi_thread_4 - register broker[1]to name server 10.0.90.144:9876 OK
2022-02-18 10:04:04 INFO brokerOutApi_thread_1 - register broker[1]to name server 10.0.91.49:9876 OK
2022-02-18 10:04:04 INFO brokerOutApi_thread_3 - register broker[1]to name server 10.0.91.8:9876 OK
2022-02-18 10:04:04 INFO main - The broker[broker-a, 10.0.91.8:10911] boot success. serializeType=JSON and name server is 10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
2022-02-18 10:04:06 INFO BrokerControllerScheduledThread1 - Update slave topic config from master, 10.0.90.59:10911
2022-02-18 10:04:06 INFO BrokerControllerScheduledThread1 - Update slave consumer offset from master, 10.0.90.59:10911
2022-02-18 10:04:06 INFO BrokerControllerScheduledThread1 - Update slave delay offset from master, 10.0.90.59:10911
2022-02-18 10:04:06 INFO BrokerControllerScheduledThread1 - Update slave Subscription Group from master, 10.0.90.59:10911
[root@admin rocketmq-4.9.2]# jps
3418 BrokerStartup
3276 NamesrvStartup
3533 Jps
```

- 4、启动Slave02

```java
[root@admin rocketmq-4.9.2]# nohup sh bin/mqbroker -n '10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876' -c conf/broker.conf autoCreateTopicEnable=true & 
[2] 2321
[root@admin rocketmq-4.9.2]# nohup: ignoring input and appending output to ‘nohup.out’
[root@admin rocketmq-4.9.2]# tail -f ~/logs/rocketmqlogs/broker.log
2022-02-17 14:47:34 INFO main - preferredLeaderId=
2022-02-17 14:47:34 INFO main - isEnableBatchPush=false
2022-02-17 14:47:34 INFO main - enableScheduleMessageStats=true
2022-02-17 14:47:34 INFO main - load /rocketmq/rocketmq-4.9.2/store/config/consumerOffset.json OK
2022-02-17 14:47:34 INFO main - load /rocketmq/rocketmq-4.9.2/store/config/consumerFilter.json OK
2022-02-17 14:47:34 INFO main - Try to start service thread:AllocateMappedFileService started:false lastThread:null
2022-02-17 14:47:34 INFO main - Try to shutdown service thread:AllocateMappedFileService started:true lastThread:Thread[AllocateMappedFileService,5,main]
2022-02-17 14:47:34 INFO main - shutdown thread AllocateMappedFileService interrupt true
2022-02-17 14:47:34 INFO main - join thread AllocateMappedFileService elapsed time(ms) 0 90000
2022-02-17 14:47:34 INFO main - Try to shutdown service thread:PullRequestHoldService started:false lastThread:null
2022-02-18 10:04:40 INFO main - rocketmqHome=/rocketmq/rocketmq-4.9.2
2022-02-18 10:04:40 INFO main - namesrvAddr=10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
2022-02-18 10:04:40 INFO main - brokerIP1=10.0.91.49
2022-02-18 10:04:40 INFO main - brokerIP2=10.0.91.49
2022-02-18 10:04:40 INFO main - brokerName=broker-b
2022-02-18 10:04:40 INFO main - brokerClusterName=DefaultCluster
2022-02-18 10:04:40 INFO main - brokerId=1
2022-02-18 10:04:40 INFO main - brokerPermission=6
2022-02-18 10:04:40 INFO main - defaultTopicQueueNums=8
2022-02-18 10:04:40 INFO main - autoCreateTopicEnable=true
2022-02-18 10:04:40 INFO main - clusterTopicEnable=true
2022-02-18 10:04:40 INFO main - brokerTopicEnable=true
2022-02-18 10:04:40 INFO main - autoCreateSubscriptionGroup=true
2022-02-18 10:04:40 INFO main - messageStorePlugIn=
2022-02-18 10:04:40 INFO main - msgTraceTopicName=RMQ_SYS_TRACE_TOPIC
2022-02-18 10:04:40 INFO main - traceTopicEnable=false
2022-02-18 10:04:40 INFO main - sendMessageThreadPoolNums=2
2022-02-18 10:04:40 INFO main - pullMessageThreadPoolNums=20
2022-02-18 10:04:40 INFO main - processReplyMessageThreadPoolNums=20
2022-02-18 10:04:40 INFO main - queryMessageThreadPoolNums=10
2022-02-18 10:04:40 INFO main - adminBrokerThreadPoolNums=16
2022-02-18 10:04:40 INFO main - clientManageThreadPoolNums=32
2022-02-18 10:04:40 INFO main - consumerManageThreadPoolNums=32
2022-02-18 10:04:40 INFO main - heartbeatThreadPoolNums=2
2022-02-18 10:04:40 INFO main - endTransactionThreadPoolNums=12
2022-02-18 10:04:40 INFO main - flushConsumerOffsetInterval=5000
2022-02-18 10:04:40 INFO main - flushConsumerOffsetHistoryInterval=60000
2022-02-18 10:04:40 INFO main - rejectTransactionMessage=false
2022-02-18 10:04:40 INFO main - fetchNamesrvAddrByAddressServer=false
2022-02-18 10:04:40 INFO main - sendThreadPoolQueueCapacity=10000
2022-02-18 10:04:40 INFO main - pullThreadPoolQueueCapacity=100000
2022-02-18 10:04:40 INFO main - replyThreadPoolQueueCapacity=10000
2022-02-18 10:04:40 INFO main - queryThreadPoolQueueCapacity=20000
2022-02-18 10:04:40 INFO main - clientManagerThreadPoolQueueCapacity=1000000
2022-02-18 10:04:40 INFO main - consumerManagerThreadPoolQueueCapacity=1000000
2022-02-18 10:04:40 INFO main - heartbeatThreadPoolQueueCapacity=50000
2022-02-18 10:04:40 INFO main - endTransactionPoolQueueCapacity=100000
2022-02-18 10:04:40 INFO main - filterServerNums=0
2022-02-18 10:04:40 INFO main - longPollingEnable=true
2022-02-18 10:04:40 INFO main - shortPollingTimeMills=1000
2022-02-18 10:04:40 INFO main - notifyConsumerIdsChangedEnable=true
2022-02-18 10:04:40 INFO main - highSpeedMode=false
2022-02-18 10:04:40 INFO main - commercialEnable=true
2022-02-18 10:04:40 INFO main - commercialTimerCount=1
2022-02-18 10:04:40 INFO main - commercialTransCount=1
2022-02-18 10:04:40 INFO main - commercialBigCount=1
2022-02-18 10:04:40 INFO main - commercialBaseCount=1
2022-02-18 10:04:40 INFO main - transferMsgByHeap=true
2022-02-18 10:04:40 INFO main - maxDelayTime=40
2022-02-18 10:04:40 INFO main - regionId=DefaultRegion
2022-02-18 10:04:40 INFO main - registerBrokerTimeoutMills=6000
2022-02-18 10:04:40 INFO main - slaveReadEnable=false
2022-02-18 10:04:40 INFO main - disableConsumeIfConsumerReadSlowly=false
2022-02-18 10:04:40 INFO main - consumerFallbehindThreshold=17179869184
2022-02-18 10:04:40 INFO main - brokerFastFailureEnable=true
2022-02-18 10:04:40 INFO main - waitTimeMillsInSendQueue=200
2022-02-18 10:04:40 INFO main - waitTimeMillsInPullQueue=5000
2022-02-18 10:04:40 INFO main - waitTimeMillsInHeartbeatQueue=31000
2022-02-18 10:04:40 INFO main - waitTimeMillsInTransactionQueue=3000
2022-02-18 10:04:40 INFO main - startAcceptSendRequestTimeStamp=0
2022-02-18 10:04:40 INFO main - traceOn=true
2022-02-18 10:04:40 INFO main - enableCalcFilterBitMap=false
2022-02-18 10:04:40 INFO main - expectConsumerNumUseFilter=32
2022-02-18 10:04:40 INFO main - maxErrorRateOfBloomFilter=20
2022-02-18 10:04:40 INFO main - filterDataCleanTimeSpan=86400000
2022-02-18 10:04:40 INFO main - filterSupportRetry=false
2022-02-18 10:04:40 INFO main - enablePropertyFilter=false
2022-02-18 10:04:40 INFO main - compressedRegister=false
2022-02-18 10:04:40 INFO main - forceRegister=true
2022-02-18 10:04:40 INFO main - registerNameServerPeriod=30000
2022-02-18 10:04:40 INFO main - transactionTimeOut=6000
2022-02-18 10:04:40 INFO main - transactionCheckMax=15
2022-02-18 10:04:40 INFO main - transactionCheckInterval=60000
2022-02-18 10:04:40 INFO main - aclEnable=false
2022-02-18 10:04:40 INFO main - storeReplyMessageEnable=true
2022-02-18 10:04:40 INFO main - autoDeleteUnusedStats=false
2022-02-18 10:04:40 INFO main - listenPort=10911
2022-02-18 10:04:40 INFO main - serverWorkerThreads=8
2022-02-18 10:04:40 INFO main - serverCallbackExecutorThreads=0
2022-02-18 10:04:40 INFO main - serverSelectorThreads=3
2022-02-18 10:04:40 INFO main - serverOnewaySemaphoreValue=256
2022-02-18 10:04:40 INFO main - serverAsyncSemaphoreValue=64
2022-02-18 10:04:40 INFO main - serverChannelMaxIdleTimeSeconds=120
2022-02-18 10:04:40 INFO main - serverSocketSndBufSize=131072
2022-02-18 10:04:40 INFO main - serverSocketRcvBufSize=131072
2022-02-18 10:04:40 INFO main - serverPooledByteBufAllocatorEnable=true
2022-02-18 10:04:40 INFO main - useEpollNativeSelector=false
2022-02-18 10:04:40 INFO main - clientWorkerThreads=4
2022-02-18 10:04:40 INFO main - clientCallbackExecutorThreads=2
2022-02-18 10:04:40 INFO main - clientOnewaySemaphoreValue=65535
2022-02-18 10:04:40 INFO main - clientAsyncSemaphoreValue=65535
2022-02-18 10:04:40 INFO main - connectTimeoutMillis=3000
2022-02-18 10:04:40 INFO main - channelNotActiveInterval=60000
2022-02-18 10:04:40 INFO main - clientChannelMaxIdleTimeSeconds=120
2022-02-18 10:04:40 INFO main - clientSocketSndBufSize=131072
2022-02-18 10:04:40 INFO main - clientSocketRcvBufSize=131072
2022-02-18 10:04:40 INFO main - clientPooledByteBufAllocatorEnable=false
2022-02-18 10:04:40 INFO main - clientCloseSocketIfTimeout=true
2022-02-18 10:04:40 INFO main - useTLS=false
2022-02-18 10:04:40 INFO main - storePathRootDir=/rocketmq/rocketmq-4.9.2/store
2022-02-18 10:04:40 INFO main - storePathCommitLog=/rocketmq/rocketmq-4.9.2/store/commitlog
2022-02-18 10:04:40 INFO main - readOnlyCommitLogStorePaths=
2022-02-18 10:04:40 INFO main - mappedFileSizeCommitLog=1073741824
2022-02-18 10:04:40 INFO main - mappedFileSizeConsumeQueue=6000000
2022-02-18 10:04:40 INFO main - enableConsumeQueueExt=false
2022-02-18 10:04:40 INFO main - mappedFileSizeConsumeQueueExt=50331648
2022-02-18 10:04:40 INFO main - bitMapLengthConsumeQueueExt=64
2022-02-18 10:04:40 INFO main - flushIntervalCommitLog=500
2022-02-18 10:04:40 INFO main - commitIntervalCommitLog=200
2022-02-18 10:04:40 INFO main - useReentrantLockWhenPutMessage=true
2022-02-18 10:04:40 INFO main - flushCommitLogTimed=true
2022-02-18 10:04:40 INFO main - flushIntervalConsumeQueue=1000
2022-02-18 10:04:40 INFO main - cleanResourceInterval=10000
2022-02-18 10:04:40 INFO main - deleteCommitLogFilesInterval=100
2022-02-18 10:04:40 INFO main - deleteConsumeQueueFilesInterval=100
2022-02-18 10:04:40 INFO main - destroyMapedFileIntervalForcibly=120000
2022-02-18 10:04:40 INFO main - redeleteHangedFileInterval=120000
2022-02-18 10:04:40 INFO main - deleteWhen=04
2022-02-18 10:04:40 INFO main - diskMaxUsedSpaceRatio=75
2022-02-18 10:04:40 INFO main - fileReservedTime=48
2022-02-18 10:04:40 INFO main - putMsgIndexHightWater=600000
2022-02-18 10:04:40 INFO main - maxMessageSize=4194304
2022-02-18 10:04:40 INFO main - checkCRCOnRecover=true
2022-02-18 10:04:40 INFO main - flushCommitLogLeastPages=4
2022-02-18 10:04:40 INFO main - commitCommitLogLeastPages=4
2022-02-18 10:04:40 INFO main - flushLeastPagesWhenWarmMapedFile=4096
2022-02-18 10:04:40 INFO main - flushConsumeQueueLeastPages=2
2022-02-18 10:04:40 INFO main - flushCommitLogThoroughInterval=10000
2022-02-18 10:04:40 INFO main - commitCommitLogThoroughInterval=200
2022-02-18 10:04:40 INFO main - flushConsumeQueueThoroughInterval=60000
2022-02-18 10:04:40 INFO main - maxTransferBytesOnMessageInMemory=262144
2022-02-18 10:04:40 INFO main - maxTransferCountOnMessageInMemory=32
2022-02-18 10:04:40 INFO main - maxTransferBytesOnMessageInDisk=65536
2022-02-18 10:04:40 INFO main - maxTransferCountOnMessageInDisk=8
2022-02-18 10:04:40 INFO main - accessMessageInMemoryMaxRatio=40
2022-02-18 10:04:40 INFO main - messageIndexEnable=true
2022-02-18 10:04:40 INFO main - maxHashSlotNum=5000000
2022-02-18 10:04:40 INFO main - maxIndexNum=20000000
2022-02-18 10:04:40 INFO main - maxMsgsNumBatch=64
2022-02-18 10:04:40 INFO main - messageIndexSafe=false
2022-02-18 10:04:40 INFO main - haListenPort=10912
2022-02-18 10:04:40 INFO main - haSendHeartbeatInterval=5000
2022-02-18 10:04:40 INFO main - haHousekeepingInterval=20000
2022-02-18 10:04:40 INFO main - haTransferBatchSize=32768
2022-02-18 10:04:40 INFO main - haMasterAddress=
2022-02-18 10:04:40 INFO main - haSlaveFallbehindMax=268435456
2022-02-18 10:04:40 INFO main - brokerRole=SLAVE
2022-02-18 10:04:40 INFO main - flushDiskType=ASYNC_FLUSH
2022-02-18 10:04:40 INFO main - syncFlushTimeout=5000
2022-02-18 10:04:40 INFO main - messageDelayLevel=1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h
2022-02-18 10:04:40 INFO main - flushDelayOffsetInterval=10000
2022-02-18 10:04:40 INFO main - cleanFileForciblyEnable=true
2022-02-18 10:04:40 INFO main - warmMapedFileEnable=false
2022-02-18 10:04:40 INFO main - offsetCheckInSlave=false
2022-02-18 10:04:40 INFO main - debugLockEnable=false
2022-02-18 10:04:40 INFO main - duplicationEnable=false
2022-02-18 10:04:40 INFO main - diskFallRecorded=true
2022-02-18 10:04:40 INFO main - osPageCacheBusyTimeOutMills=1000
2022-02-18 10:04:40 INFO main - defaultQueryMaxNum=32
2022-02-18 10:04:40 INFO main - transientStorePoolEnable=false
2022-02-18 10:04:40 INFO main - transientStorePoolSize=5
2022-02-18 10:04:40 INFO main - fastFailIfNoBufferInStorePool=false
2022-02-18 10:04:40 INFO main - enableDLegerCommitLog=false
2022-02-18 10:04:40 INFO main - dLegerGroup=
2022-02-18 10:04:40 INFO main - dLegerPeers=
2022-02-18 10:04:40 INFO main - dLegerSelfId=
2022-02-18 10:04:40 INFO main - preferredLeaderId=
2022-02-18 10:04:40 INFO main - isEnableBatchPush=false
2022-02-18 10:04:40 INFO main - enableScheduleMessageStats=true
2022-02-18 10:04:40 INFO main - Try to start service thread:AllocateMappedFileService started:false lastThread:null
2022-02-18 10:04:42 INFO main - Set user specified name server address: 10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
2022-02-18 10:04:42 WARN main - Load default transaction message hook service: TransactionalMessageServiceImpl
2022-02-18 10:04:42 WARN main - Load default discard message hook service: DefaultTransactionalMessageCheckListener
2022-02-18 10:04:42 INFO main - The broker dose not enable acl
2022-02-18 10:04:42 INFO main - Try to start service thread:ReputMessageService started:false lastThread:null
2022-02-18 10:04:42 INFO main - Try to start service thread:AcceptSocketService started:false lastThread:null
2022-02-18 10:04:42 INFO main - Try to start service thread:GroupTransferService started:false lastThread:null
2022-02-18 10:04:42 INFO main - Try to start service thread:HAClient started:false lastThread:null
2022-02-18 10:04:42 INFO main - Try to start service thread:FlushConsumeQueueService started:false lastThread:null
2022-02-18 10:04:42 INFO main - Try to start service thread:FlushRealTimeService started:false lastThread:null
2022-02-18 10:04:42 INFO main - Try to start service thread:StoreStatsService started:false lastThread:null
2022-02-18 10:04:43 INFO main - Try to start service thread:FileWatchService started:false lastThread:null
2022-02-18 10:04:43 INFO FileWatchService - FileWatchService service started
2022-02-18 10:04:43 INFO main - Try to start service thread:PullRequestHoldService started:false lastThread:null
2022-02-18 10:04:43 INFO PullRequestHoldService - PullRequestHoldService service started
2022-02-18 10:04:43 INFO brokerOutApi_thread_4 - register broker[1]to name server 10.0.91.49:9876 OK
2022-02-18 10:04:43 INFO brokerOutApi_thread_1 - register broker[1]to name server 10.0.90.144:9876 OK
2022-02-18 10:04:43 INFO brokerOutApi_thread_2 - register broker[1]to name server 10.0.91.8:9876 OK
2022-02-18 10:04:43 INFO brokerOutApi_thread_3 - register broker[1]to name server 10.0.90.59:9876 OK
2022-02-18 10:04:43 INFO main - The broker[broker-b, 10.0.91.49:10911] boot success. serializeType=JSON and name server is 10.0.90.59:9876;10.0.90.144:9876;10.0.91.8:9876;10.0.91.49:9876
2022-02-18 10:04:46 INFO BrokerControllerScheduledThread1 - Update slave topic config from master, 10.0.90.144:10911
2022-02-18 10:04:46 INFO BrokerControllerScheduledThread1 - Update slave consumer offset from master, 10.0.90.144:10911
2022-02-18 10:04:46 INFO BrokerControllerScheduledThread1 - Update slave delay offset from master, 10.0.90.144:10911
2022-02-18 10:04:46 INFO BrokerControllerScheduledThread1 - Update slave Subscription Group from master, 10.0.90.144:10911
```

从控制台日志可以看到，四台Broker也成功启动。

## 十、启动可视化控制台

这里**只需要选其中一台服务器搭建可视化控制台即可**，这里我们选择使用【主1 - 10.0.90.59】进行搭建，具体搭建过程如下。

1、下载可视化管理页面插件，并上传到服务器中，然后解压缩

下载地址：[https://github.com/rocketmq/rocketmq-externals](https://github.com/rocketmq/rocketmq-externals)

```java
[admin@admin rocketmq]$ unzip rocketmq-externals-master.zip 
```

解压缩完成后，会生成一个【rocketmq-externals-master】目录。

2、修改配置文件

```java
[admin@admin rocketmq-console]$ pwd
/rocketmq/rocketmq-externals-master/rocketmq-console
[admin@admin rocketmq-console]$ vim src/main/resources/application.properties
```

主要是修改端口号和配置RocketMQ NameServer的地址，如下图：

3、手动打包生成可运行的Jar文件

进入rocketmq-console，跳过测试并打包：

```java
[admin@admin rocketmq-console]$ pwd
/rocketmq/rocketmq-externals-master/rocketmq-console
[admin@admin rocketmq-console]$ mvn clean package -Dmaven.test.skip=true
```

打包完成后，在target目录下回生成一个可执行的Jar文件，如下图：

4、启动可视化页面

```java
[admin@admin target]$ java -jar rocketmq-console-ng-1.0.0.jar
```

查看启动日志：

5、访问可视化页面

启动成功后，浏览器访问：[http://10.0.90.59:1111/#/](http://10.0.90.59:1111/#/)

至此，多Master多Slave模式-异步复制模式的RocketMQ集群就搭建完成了，希望对大家有所帮助，读者朋友下去可以自行实操一遍。
