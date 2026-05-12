# 42、RocketMQ源码解析 - 升级到主从切换(实战篇)
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/42.html
- 分类：消息队列
- 分组：教程目录
本文主要介绍如何将 RocketMQ 集群从原先的主从同步升级到主从切换。

首先先介绍与 DLedger 多副本即 RocketMQ 主从切换相关的核心配置属性，然后尝试搭建一个主从同步集群，再从原先的 RocketMQ 集群平滑升级到 DLedger 集群的示例，并简单测试一下主从切换功能。

## 1、RocketMQ DLedger 多副本即主从切换核心配置参数详解

其主要的配置参数如下所示：

- enableDLegerCommitLog

是否启用 DLedger，即是否启用 RocketMQ 主从切换，默认值为 false。如果需要开启主从切换，则该值需要设置为 true 。
- dLegerGroup

节点所属的 raft 组，建议与 brokerName 保持一致，例如 broker-a。
- dLegerPeers

集群节点信息，示例配置如下：n0-127.0.0.1:40911;n1-127.0.0.1:40912;n2-127.0.0.1:40913，多个节点用英文冒号隔开，单个条目遵循 legerSlefId-ip:端口，这里的端口用作 dledger 内部通信。
- dLegerSelfId

当前节点id。取自 legerPeers 中条目的开头，即上述示例中的 n0，并且特别需要强调，只能第一个字符为英文，其他字符需要配置成数字。
- storePathRootDir

DLedger 日志文件的存储根目录，为了能够支持平滑升级，该值与 storePathCommitLog 设置为不同的目录。

## 2、搭建主从同步环境

首先先搭建一个传统意义上的主从同步架构，往集群中灌一定量的数据，然后升级到 DLedger 集群。

在Linux 服务器上搭建一个 rocketmq 主从同步集群我想不是一件很难的事情，故本文就不会详细介绍按照过程，只贴出相关配置。

实验环境的部署结构采取 一主一次，其部署图如下：

下面我就重点贴一下 broker 的配置文件。

220上的 broker 配置文件如下：

```java
brokerClusterName = DefaultCluster
brokerName = broker-a
brokerId = 0
deleteWhen = 04
fileReservedTime = 48
brokerRole = ASYNC_MASTER
flushDiskType = ASYNC_FLUSH
brokerIP1=192.168.0.220
brokerIP2=192.168.0.220
namesrvAddr=192.168.0.221:9876;192.168.0.220:9876
storePathRootDir=/opt/application/rocketmq-all-4.5.2-bin-release/store
storePathCommitLog=/opt/application/rocketmq-all-4.5.2-bin-release/store/commitlog
autoCreateTopicEnable=false
autoCreateSubscriptionGroup=false
```

221上 broker 的配置文件如下：

```java
brokerClusterName = DefaultCluster
brokerName = broker-a
brokerId = 1
deleteWhen = 04
fileReservedTime = 48
brokerRole = SLAVE
flushDiskType = ASYNC_FLUSH
brokerIP1=192.168.0.221
brokerIP2=192.168.0.221
namesrvAddr=192.168.0.221:9876;192.168.0.220:9876
storePathRootDir=/opt/application/rocketmq-all-4.5.2-bin-release/store
storePathCommitLog=/opt/application/rocketmq-all-4.5.2-bin-release/store/commitlog
autoCreateTopicEnable=false
autoCreateSubscriptionGroup=false
```

相关的启动命令如下：

```java
nohup bin/mqnamesrv  /dev/null  2>&1 &
nohup bin/mqbroker -c conf/broker.conf  /dev/null  2>&1 &
```

安装后的集群信息如图所示：

## 3、主从同步集群升级到DLedger

### 3.1 部署架构

DLedger 集群至少需要3台机器，故搭建 DLedger 还需要再引入一台机器，其部署结构图如下：

从主从同步集群升级到 DLedger 集群，用户最关心的还是升级后的集群是否能够兼容原先的数据，即原先存储在消息能否能被消息消费者消费端，甚至于能否查询到。

为了方便后续验证，首先我使用下述程序向 mq 集群中添加了一篇方便查询的消息（设置消息的key）。

```java
public class Producer {
    public static void main(String[] args) throws MQClientException, InterruptedException {
        DefaultMQProducer producer = new DefaultMQProducer("producer_dw_test");
        producer.setNamesrvAddr("192.168.0.220:9876;192.168.0.221:9876");
        producer.start();
        for(int i =600000; i < 600100; i ++) {
            try {
                Message msg = new Message("topic_dw_test_by_order_01",null , "m" + i,("Hello RocketMQ" + i ).getBytes(RemotingHelper.DEFAULT_CHARSET));
                SendResult sendResult = producer.send(msg);
               //System.out.printf("%s%n", sendResult);
            } catch (Exception e) {
                e.printStackTrace();
                Thread.sleep(1000);
            }
        }
        producer.shutdown();
        System.out.println("end");
    }
}
```

消息的查询结果示例如下：

### 3.2 升级步骤

Step1：将 192.168.0.220 的 rocketmq 拷贝到 192.168.0.222，可以使用如下命令进行操作。在 192.168.0.220 上敲如下命令：

```java
 scp -r rocketmq-all-4.5.2-bin-release/ root@192.168.0.222:/opt/application/rocketmq-all-4.5.2-bin-release
```

> 温馨提示：示例中由于版本是一样，实际过程中，版本需要升级，故需先下载最新的版本，然后将老集群中的 store 目录完整的拷贝到新集群的 store 目录。

Step2：依次在三台服务器的 broker.conf 配置文件中添加与 dledger 相关的配置属性。

**192、** 168.0.220broker配置文件如下：

```java
brokerClusterName = DefaultCluster
brokerId = 0
deleteWhen = 04
fileReservedTime = 48
brokerRole = ASYNC_MASTER
flushDiskType = ASYNC_FLUSH
brokerIP1=192.168.0.220
brokerIP2=192.168.0.220
namesrvAddr=192.168.0.221:9876;192.168.0.220:9876
storePathRootDir=/opt/application/rocketmq-all-4.5.2-bin-release/store
storePathCommitLog=/opt/application/rocketmq-all-4.5.2-bin-release/store/commitlog
autoCreateTopicEnable=false
autoCreateSubscriptionGroup=false
# 与 dledger 相关的属性
enableDLegerCommitLog=true
storePathRootDir=/opt/application/rocketmq-all-4.5.2-bin-release/store/dledger_store
dLegerGroup=broker-a
dLegerPeers=n0-192.168.0.220:40911;n1-192.168.0.221:40911;n2-192.168.0.222:40911
dLegerSelfId=n0
```

**192、** 168.0.221broker配置文件如下：

```java
brokerClusterName = DefaultCluster
brokerName = broker-a
brokerId = 1
deleteWhen = 04
fileReservedTime = 48
brokerRole = SLAVE
flushDiskType = ASYNC_FLUSH
brokerIP1=192.168.0.221
brokerIP2=192.168.0.221
namesrvAddr=192.168.0.221:9876;192.168.0.220:9876
storePathRootDir=/opt/application/rocketmq-all-4.5.2-bin-release/store
storePathCommitLog=/opt/application/rocketmq-all-4.5.2-bin-release/store/commitlog
autoCreateTopicEnable=false
autoCreateSubscriptionGroup=false
# 与dledger 相关的配置属性
enableDLegerCommitLog=true
storePathRootDir=/opt/application/rocketmq-all-4.5.2-bin-release/store/dledger_store
dLegerGroup=broker-a
dLegerPeers=n0-192.168.0.220:40911;n1-192.168.0.221:40911;n2-192.168.0.222:40911
dLegerSelfId=n1
```

**192、** 168.0.222broker配置文件如下：

```java
brokerClusterName = DefaultCluster
brokerName = broker-a
brokerId = 0
deleteWhen = 04
fileReservedTime = 48
brokerRole = ASYNC_MASTER
flushDiskType = ASYNC_FLUSH
brokerIP1=192.168.0.222
brokerIP2=192.168.0.222
namesrvAddr=192.168.0.221:9876;192.168.0.220:9876
storePathRootDir=/opt/application/rocketmq-all-4.5.2-bin-release/store
storePathCommitLog=/opt/application/rocketmq-all-4.5.2-bin-release/store/commitlog
autoCreateTopicEnable=false
autoCreateSubscriptionGroup=false
# 与 dledger 相关的配置
enableDLegerCommitLog=true
storePathRootDir=/opt/application/rocketmq-all-4.5.2-bin-release/store/dledger_store
dLegerGroup=broker-a
dLegerPeers=n0-192.168.0.220:40911;n1-192.168.0.221:40911;n2-192.168.0.222:40911
dLegerSelfId=n2
```

> 温馨提示：legerSelfId 分别为 n0、n1、n2。在真实的生产环境中，broker配置文件中的 storePathRootDir、storePathCommitLog 尽量使用单独的根目录，这样判断其磁盘使用率时才不会相互影响。

Step3：将 store/config 下的 所有文件拷贝到 dledger store 的 congfig 目录下。

```java
cd /opt/application/rocketmq-all-4.5.2-bin-release/store/
cp config/* dledger_store/config/
```

> 温馨提示：该步骤按照各自按照时配置的目录进行复制即可。

Step4：依次启动三台 broker。

```java
nohup bin/mqbroker -c conf/broker.conf  /dev/null  2>&1 &
```

如果启动成功，则在 rocketmq-console 中看到的集群信息如下：

### 3.3 验证消息发送与消息查找

首先我们先验证升级之前的消息是否能查询到，那我们还是查找key 为 m600000 的消息，查找结果如图所示：

然后我们来测试一下消息发送。测试代码如下：

```java
public class Producer {
    public static void main(String[] args) throws MQClientException, InterruptedException {
        DefaultMQProducer producer = new DefaultMQProducer("producer_dw_test");
        producer.setNamesrvAddr("192.168.0.220:9876;192.168.0.221:9876");
        producer.start();
        for(int i =600200; i < 600300; i ++) {
            try {
                Message msg = new Message("topic_dw_test_by_order_01",null , "m" + i,("Hello RocketMQ" + i ).getBytes(RemotingHelper.DEFAULT_CHARSET));
                SendResult sendResult = producer.send(msg);
                System.out.printf("%s%n", sendResult);
            } catch (Exception e) {
                e.printStackTrace();
                Thread.sleep(1000);
            }
        }
        producer.shutdown();
        System.out.println("end");
    }
}
```

执行结果如下：

再去控制台查询一下消息，其结果也表明新的消息也能查询到。

最后我们再来验证一下主节点宕机，消息发送是否会受影响。

在消息发送的过程中，去关闭主节点，其截图如下：

再来看一下集群的状态：

等待该复制组重新完成主服务器选举后，即可继续处理消息发送。

> 温馨提示：由于本示例是一主一从，故在选举期间，消息不可用，但在真实的生产环境上，其部署架构是多主主从，即一个复制组在 leader 选举期间，其他复制组可以接替该复制组完成消息的发送，实现消息服务的高可用。

与DLedger 相关的日志，默认存储在 broker_default.log 文件中。
