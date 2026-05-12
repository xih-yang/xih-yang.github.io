# 05、RocketMQ 实战 - RocketMQ集群架构
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/7/5.html
- 分类：消息队列
- 分组：教程目录
## 一、RocketMQ集群架构

RocketMQ网络部署图如下：

RocketMQ中主要涉及到四种角色：NameServer注册服务器、Broker服务器、Producer生产者、Consumer消费者。每种角色都可以单独搭建集群，下面我们分别介绍一下NameServer 集群、Broker 集群、Producer 集群、Customer 集群。

- **1、NameServer 集群**

NameServer 是一个**无状态**的节点，可集群部署，节点都是**各自独立的，无任何信息同步**。

- **2、 Broker 集群**

①Broker 分为 Master 与 Slave，一个 Master 可以对应多个 Slave，但一个 Slave 只能对应一个Master；

②Master 与 Slave 的对应关系通过指定**相同的 BrokerName，不同的 BrokerID 来定义**，id 为 0 表示 Master， 非 0 表示 Slave；

③可以部署多个 Master 实现 Broker 集群，即多组 Master - Slave 的 Broker 节点；

④Master 通常用于写入数据，Slave 用于读取数据；

⑤ **每个 Broker 与 NameServer 集群中的所有节点建立长连接，定时注册 Topic 信息到所有 NameServer**；

- **3、Producer 集群**

①Producer 为消息的生产者，都是**各自独立的无状态的节点**，可以认为只要向 mq 中推送消息的节点都算作 Producer 节点。

②Producer 节点**与 NameServer 集群中的随机一个节点建立长连接**，定期从 NameServer 取出 Topic 路由信息，并向提供 Topic 服务的 Master 建立长连接，且**定时向 Master 发送心跳**。

- **4、Customer 集群**

①Customer 为消息的消费者，都是**各自独立的无状态的节点**，可以认为只要向 mq 中获取消息的节点都算作 Customer 节点；

②Customer 节点**与 NameServer 集群中的随机一个节点建立长连接**，定期从 NameServer 取出 Topic 路由信息，并向提供 Topic 服务的 Master、Slave 建立长连接，且**定时向 Master、Slave 发送心跳**；

③Customer 节点既可以从 Master 订阅消息，也可以从 Slave 订阅消息，订阅规则由 Broker 配置决定；

## 二、RocketMQ的四种集群模式

**1、单Master模式**

这种方式风险较大，一旦Broker重启或者宕机时，会导致整个服务不可用。不建议线上环境使用，可以用于本地测试。

前面我们搭建的单机版RocketMQ其实就是单Master这种模式，具体的搭建过程读者朋友可参考前面的文章。

**2、多 Master 模式**

一个集群无Slave，全是Master，例如2个Master或者3个Master，这种模式的优缺点如下：

- 优点：**配置简单**，单个Master宕机或重启维护对应用无影响，在磁盘配置为RAID10时，即使机器宕机不可恢复情况下，由于RAID10磁盘非常可靠，**消息也不会丢（异步刷盘丢失少量消息，同步刷盘一条不丢），性能最高**；
- 缺点：单台机器宕机期间，这台机器上未被消费的消息在机器恢复之前不可订阅，消息消费的实时性会受到影响。

**3、多Master多Slave模式-异步复制**

每个Master配置一个Slave，有多对Master-Slave，HA采用异步复制方式，主备有短暂消息延迟（毫秒级），这种模式的优缺点如下：

- 优点：**即使磁盘损坏，消息丢失的非常少，且消息实时性不会受影响，同时Master宕机后，消费者仍然可以从Slave消费**，而且此过程对应用透明，不需要人工干预，性能同多Master模式几乎一样。
- 缺点：Master宕机，磁盘损坏情况下**会丢失少量消息**。

**4、多Master多Slave模式-同步双写**

每个Master配置一个Slave，有多对Master-Slave，HA采用同步双写方式，即只有主备都写成功，才向应用返回成功，这种模式的优缺点如下：

- 优点：数据与服务都**无单点故障**，Master宕机情况下，消息无延迟，服务可用性与数据可用性都非常高；
- 缺点：性能比异步复制模式略低（大约低10%左右），**发送单个消息的RT会略高**。

## 三、RocketMQ集群工作流程

**1、** 启动NameServer，NameServer启动后监听端口，等待Broker、Producer、Consumer连上来，相当于一个路由控制中心；

**2、** Broker启动，跟所有的NameServer保持长连接，定时发送心跳包心跳包中包含当前Broker信息(IP+端口等)以及存储所有Topic信息注册成功后，NameServer集群中就有Topic跟Broker的映射关系；

**3、** 收发消息前，先创建Topic，创建Topic时需要指定该Topic要存储在哪些Broker上，也可以在发送消息时自动创建Topic；

**4、** Producer发送消息，启动时先跟NameServer集群中的其中一台建立长连接，并从NameServer中获取当前发送的Topic存在哪些Broker上，轮询从队列列表中选择一个队列，然后与队列所在的Broker建立长连接从而向Broker发消息；

**5、** Consumer跟Producer类似，跟其中一台NameServer建立长连接，获取当前订阅Topic存在哪些Broker上，然后直接跟Broker建立连接通道，开始消费消息；

> Master支持读和写，Slave仅支持读，也就是 Producer只能和Master连接写入消息；Consumer可以连接 Master，也可以连接Slave来读取消息。

## 四、RocketMQ刷盘机制

RocketMQ的消息是存储到磁盘上的，这样既能保证断电后恢复， 又可以让存储的消息量超出内存的限制。RocketMQ为了提高性能，会尽可能地保证磁盘的**顺序写**。消息在通过Producer写入RocketMQ的时候，有两种写磁盘方式：**同步刷盘和异步刷盘**。如下图：

**1、同步刷盘**

在返回写成功状态时，消息已经被写入磁盘。具体流程是，消息写入内存的PAGECACHE后，立刻通知刷盘线程刷盘， 然后等待刷盘完成，刷盘线程执行完成后唤醒等待的线程，返回消息写成功的状态。

**2、异步刷盘**

在返回写成功状态时，消息可能只是被写入了内存的PAGECACHE，**写操作的返回快，吞吐量大**；当内存里的消息量积累到一定程度时，统一触发写磁盘动作，快速写入。

**3、怎么配置刷盘方式？**

同步刷盘还是异步刷盘，都是通过Broker配置文件里的flushDiskType参数设置的，这个参数被配置成SYNC_FLUSH（同步刷盘）、ASYNC_FLUSH（异步刷盘）中的 一个。

## 五、RocketMQ主从复制机制

如果一个Broker组有Master和Slave，消息需要从Master复制到Slave 上，有同步和异步两种复制方式。

**1、同步复制**

同步复制方式是等Master和Slave均写成功后，才反馈给客户端写成功状态；

在同步复制方式下，如果Master出故障， Slave上有全部的备份数据，容易恢复，但是**同步复制会增大数据写入延迟，降低系统吞吐量**。

**2、异步复制**

异步复制方式是只要Master写成功，即可反馈给客户端写成功状态。

在异步复制方式下，系统拥有**较低的延迟和较高的吞吐量**，但是如果Master出了故障，有些数据因为没有被写入Slave，**有可能会丢失**；

**3、怎么配置复制方式？**

同步复制和异步复制是通过Broker配置文件里的brokerRole参数进行设置的，这个参数可以被设置成ASYNC_MASTER（同步Master）、 SYNC_MASTER（异步Master）、SLAVE（从节点）三个值中的一个。

**4、总结**

实际应用中要结合业务场景，合理设置刷盘方式和主从复制方式， 尤其是SYNC_FLUSH方式，由于频繁地触发磁盘写动作，会明显降低性能。**通常情况下，应该把Master和Save配置成ASYNC_FLUSH（异步刷盘）的刷盘方式，主从之间配置成SYNC_MASTER（同步复制）的复制方式**，这样即使有一台机器出故障，仍然能保证数据不丢，是个不错的选择。

## 六、总结

本篇文章主要介绍了RocketMQ的集群架构、四种集群模式、RocketMQ集群的工作流程，以及总结了RocketMQ提供的刷盘策略和主从同步复制的方式，下面一篇文章，我们就实践一下如何搭建多Master多Slave模式-异步复制的RocketMQ集群，实现RocketMQ的高可用。
