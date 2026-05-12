# 03、RocketMQ 实战 - 集群概念和工作流程
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/8/3.html
- 分类：消息队列
- 分组：教程目录
## 集群概念和工作流程

### 各个角色的介绍

- producer:消息的发送者
- consumer:消息的接受者
- Broker:暂存和传输消息
- NameServer:管理Broker
- Topic:区分消息的种类,一个发送者可以发送消息给一个或者多个Topic,一个消息的接受者可以订阅一个或者多个Topic消息
- tag:消息的标签,和topic基本是这样的关系

- Message Queue:相当于Topic的分区,用于并行发送和接受消息

### 集群的特点

- NameServer是一个几乎无状态节点,可集群部署,节点之间无任何信息同步
- Broker部署相对复杂,Broker分为Master和Slave,一个Master可以对应多个Slave,但是一个Slave只能对应一个Master,

Master和Slave的对应关系通过制定相同的BrokerName,不同的BrokerId来定义,BorkerId为0表示Master,非0便是Slave,

Mater也可以部署多个,每个Broker和NameServer集群中所有节点建立长连接,定时注册Topic信息到所有NameServer
- Producer和NameServer集群中的其中一份节点建立长连接(随机),定期从NameServer取Topic路由信息,并向Topic服务的Master

建立长连接,且定时想Master发送心跳,Product完全无状态,可集群部署
- Consumer和NameServer集群中的其中一个节点建立长连接(随机),定期从NameServer取Topic路由信息,并向提供Topic服务的Master,Slave建立长连接,且定时向Master

,Slave发送心跳,Consumer既可以从Master订阅消息,也可以从Slave订阅消息,订阅规则由Broker配置决定

### 集群模式

- 单Master模式:分险较大,一旦Broker重启或宕机,会导致整个服务不可用,不建议生产使用
- 多Master模式:一个集群无Slave,多个Master
- 优点:配置简单,单个Master宕机或重启维护对应用无影响,在磁盘配置为RAD10时,即使机器宕机不可恢复情况下,由于RAD10

磁盘非常可靠,消息也不会丢(异步刷盘会丢失少量数据,同步刷盘则不会丢失),性能最高
- 缺点:单台机器宕机期间,这台机器未被消费的消息在机器恢复之前不可订阅,消息实时性会受到影响
- 多Master多Slave模式(异步):每个Master配置一份Slave.有多对Master-Slave,HA采用异步复制方式,主备有短暂消息延迟
- 优点:及时磁盘损坏,消息丢失的非常少,消息实时性不会受影响,同步Master宕机后,消费者仍然可以从Slave消费,而且此过程对应用透明

,不需要人工干预,性能同多Master模式几乎一样
- 缺点:Master宕机,磁盘损坏情况会丢失少量消息
- 多Master多Slave模式(同步):每个Master配置一份Slave.有多对Master-Slave,HA采用同步双写方式,即只有主备都写成功,才向

应用返回成功
- 优点:数据和服务都无单点故障,Master宕机情况下,消息无延迟,服务可用性和数据可用性都非常高
- 缺点:性能比一部复制模式略低,发送单个消息的RT会略高,且目前版本在主节点宕机后,北极不能自动切换为主机

### 集群工作流程

- 启动NameServer,NameServer起来后监听端口,等待Broker,Producer,Consumer连上来,相当于一个路由控制中心
- Broker启动,跟所有的NameServer保持长连接,定时发送心跳包,心跳包中包含当前Broker信息以及存储所有Topic信息

,注册成功后,NameServer集群中就有Topic跟Broker的映射关系
- 收发消息前,先创建Topic,创建Topic需要指定该Topic要存储在哪些Broker上,也可以在发送消息时自动创建Topic
- Producer发送消息,启动时先跟NameServer集群中的其中一台建立长连接,并从NameServer中获取当前发送的Topic存在哪些

Broker上,轮询从队列列表中选择一个队列,然后跟队列所在的Broker建立长连接从而想Broker发消息
- Consumer跟Producer类似,跟其中一台NameServer建立长连接,获取当前订阅Topic存在哪些Broker上,然后直接跟Broker家里连接通道,开始消费消息
