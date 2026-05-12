# 14、Kafka 快速指南
- 来源：https://ddkk.com/zhuanlan/mq/kafka/1/14.html
- 分类：消息队列
- 分组：教程目录
## Apache Kafka – 简介

在大数据中，使用了大量的数据。 关于数据，我们有两个主要挑战。第一个挑战是如何收集大量的数据，第二个挑战是分析收集的数据。 为了克服这些挑战，您必须需要一个消息系统。

Kafka专为分布式高吞吐量系统而设计。 Kafka往往工作得很好，作为一个更传统的消息代理的替代品。 与其他消息传递系统相比，Kafka具有更好的吞吐量，内置分区，复制和固有的容错能力，这使得它非常适合大规模消息处理应用程序。

## 什么是消息系统？

消息系统负责将数据从一个应用程序传输到另一个应用程序，因此应用程序可以专注于数据，但不担心如何共享它。 分布式消息传递基于可靠消息队列的概念。 消息在客户端应用程序和消息传递系统之间异步排队。 有两种类型的消息模式可用 – 一种是点对点，另一种是发布 – 订阅(pub-sub)消息系统。 大多数消息模式遵循 **pub-sub** 。

### 点对点消息系统

在点对点系统中，消息被保留在队列中。 一个或多个消费者可以消耗队列中的消息，但是特定消息只能由最多一个消费者消费。 一旦消费者读取队列中的消息，它就从该队列中消失。 该系统的典型示例是订单处理系统，其中每个订单将由一个订单处理器处理，但多个订单处理器也可以同时工作。 下图描述了结构。

### 发布 – 订阅消息系统

在发布– 订阅系统中，消息被保留在主题中。 与点对点系统不同，消费者可以订阅一个或多个主题并使用该主题中的所有消息。 在发布 – 订阅系统中，消息生产者称为发布者，消息使用者称为订阅者。 一个现实生活的例子是Dish电视，它发布不同的渠道，如运动，电影，音乐等，任何人都可以订阅自己的频道集，并获得他们订阅的频道时可用。

## 什么是Kafka？

Apache Kafka是一个分布式发布 – 订阅消息系统和一个强大的队列，可以处理大量的数据，并使您能够将消息从一个端点传递到另一个端点。 Kafka适合离线和在线消息消费。 Kafka消息保留在磁盘上，并在群集内复制以防止数据丢失。 Kafka构建在ZooKeeper同步服务之上。 它与Apache Storm和Spark非常好地集成，用于实时流式数据分析。

### 好处

以下是Kafka的几个好处 –

- **可靠性** - Kafka是分布式，分区，复制和容错的。
- **可扩展性** - Kafka消息传递系统轻松缩放，无需停机。
- **耐用性** - Kafka使用分布式提交日志，这意味着消息会尽可能快地保留在磁盘上，因此它是持久的。
- **性能** - Kafka对于发布和订阅消息都具有高吞吐量。 即使存储了许多TB的消息，它也保持稳定的性能。

Kafka非常快，并保证零停机和零数据丢失。

### 用例

Kafka可以在许多用例中使用。 其中一些列出如下 –

- **指标** - Kafka通常用于操作监控数据。 这涉及聚合来自分布式应用程序的统计信息，以产生操作数据的集中馈送。
- **日志聚合解决方案** - Kafka可用于跨组织从多个服务收集日志，并使它们以标准格式提供给多个服务器。
- **流处理** - 流行的框架(如Storm和Spark Streaming)从主题中读取数据，对其进行处理，并将处理后的数据写入新主题，供用户和应用程序使用。 Kafka的强耐久性在流处理的上下文中也非常有用。

### 需要Kafka

Kafka是一个统一的平台，用于处理所有实时数据Feed。 Kafka支持低延迟消息传递，并在出现机器故障时提供对容错的保证。 它具有处理大量不同消费者的能力。 Kafka非常快，执行2百万写/秒。 Kafka将所有数据保存到磁盘，这实质上意味着所有写入都会进入操作系统(RAM)的页面缓存。 这使得将数据从页面缓存传输到网络套接字非常有效。

## Apache Kafka – 基础

在深入学习Kafka之前，您必须了解主题，经纪人，生产者和消费者等主要术语。下图说明了主要术语，表格详细描述了图表组件。

在上图中，主题配置为三个分区。 分区1具有两个偏移因子0和1.分区2具有四个偏移因子0,1,2和3.分区3具有一个偏移因子0.副本的id与承载它的服务器的id相同。

假设，如果主题的复制因子设置为3，那么Kafka将创建每个分区的3个相同的副本，并将它们放在集群中以使其可用于其所有操作。 为了平衡集群中的负载，每个代理都存储一个或多个这些分区。 多个生产者和消费者可以同时发布和检索消息。

##

S.No
组件和说明

1
Topics（主题）

属于特定类别的消息流称为主题。 数据存储在主题中。

主题被拆分成分区。 对于每个主题，Kafka保存一个分区的迷你妈妈。 每个这样的分区包含不可变有序序列的消息。 分区被实现为具有相等大小的一组分段文件。

2
Partition（分区）

主题可能有许多分区，因此它可以处理任意数量的数据。

3

**Partition offset（分区偏移）**

每个分区消息具有称为 offset 的唯一序列标识。

4

**Replicas of partition（分区备份）**

副本只是一个分区的备份。 副本从不读取或写入数据。 它们用于防止数据丢失。

5

**Brokers（经纪人）**

- 代理是负责维护发布数据的简单系统。 每个代理可以每个主题具有零个或多个分区。 假设，如果在一个主题和N个代理中有N个分区，每个代理将有一个分区。
- 假设在一个主题中有N个分区并且多于N个代理(n + m)，则第一个N代理将具有一个分区，并且下一个M代理将不具有用于该特定主题的任何分区。
- 假设在一个主题中有N个分区并且小于N个代理(n-m)，每个代理将在它们之间具有一个或多个分区共享。 由于代理之间的负载分布不相等，不推荐使用此方案。

6

**Kafka Cluster（Kafka集群）**

Kafka有多个代理被称为Kafka集群。 可以扩展Kafka集群，无需停机。 这些集群用于管理消息数据的持久性和复制。

7

**Producers（生产者）**

生产者是发送给一个或多个Kafka主题的消息的发布者。 生产者向Kafka经纪人发送数据。 每当生产者将消息发布给代理时，代理只需将消息附加到最后一个段文件。实际上，该消息将被附加到分区。 生产者还可以向他们选择的分区发送消息。

8

**Consumers（消费者）**

**Consumers**从经纪人处读取数据。 消费者订阅一个或多个主题，并通过从代理中提取数据来使用已发布的消息。

9

**Leader（领导者）**

Leader 是负责给定分区的所有读取和写入的节点。 每个分区都有一个服务器充当**Leader**
。

10

**Follower（追随者）**

跟随领导者指令的节点被称为**Follower**。 如果领导失败，一个追随者将自动成为新的领导者。 跟随者作为正常消费者，拉取消息并更新其自己的数据存储。

#

## Apache Kafka – 集群架构

看看下面的插图。它显示Kafka的集群图。

下表描述了上图中显示的每个组件。

S.No
组件和说明

1
Broker（代理）

Kafka集群通常由多个代理组成以保持负载平衡。Kafka代理是无状态的，所以他们使用ZooKeeper来维护它们的集群状态。一个Kafka代理实例可以每秒处理数十万次读取和写入，每个Broker可以处理TB的消息，而没有性能影响。Kafka经纪人领导选举可以由ZooKeeper完成。

2

**ZooKeeper**

ZooKeeper用于管理和协调Kafka代理。ZooKeeper服务主要用于通知生产者和消费者Kafka系统中存在任何新代理或Kafka系统中代理失败。根据Zookeeper接收到关于代理的存在或失败的通知，然后产品和消费者采取决定并开始与某些其他代理协调他们的任务。

3

**Producers（制片人**）

生产者将数据推送给经纪人。当新代理启动时，所有生产者搜索它并自动向该新代理发送消息。Kafka生产者不等待来自代理的确认，并且发送消息的速度与代理可以处理的一样快。

4

**Consumers（消费者**）

因为Kafka代理是无状态的，这意味着消费者必须通过使用分区偏移来维护已经消耗了多少消息。如果消费者确认特定的消息偏移，则意味着消费者已经消费了所有先前的消息。消费者向代理发出异步拉取请求，以具有准备好消耗的字节缓冲区。消费者可以简单地通过提供偏移值来快退或跳到分区中的任何点。消费者偏移值由ZooKeeper通知。

## Apache Kafka – WorkFlow

到目前为止，我们讨论了Kafka的核心概念。 让我们现在来看一下Kafka的工作流程。

Kafka只是分为一个或多个分区的主题的集合。 Kafka分区是消息的线性有序序列，其中每个消息由它们的索引(称为偏移)来标识。 Kafka集群中的所有数据都是不相连的分区联合。 传入消息写在分区的末尾，消息由消费者顺序读取。 通过将消息复制到不同的代理提供持久性。

Kafka以快速，可靠，持久，容错和零停机的方式提供基于pub-sub和队列的消息系统。 在这两种情况下，生产者只需将消息发送到主题，消费者可以根据自己的需要选择任何一种类型的消息传递系统。 让我们按照下一节中的步骤来了解消费者如何选择他们选择的消息系统。

## 发布 – 订阅消息的工作流程

以下是Pub-Sub消息的逐步工作流程 –

- 生产者定期向主题发送消息。
- Kafka代理存储为该特定主题配置的分区中的所有消息。 它确保消息在分区之间平等共享。 如果生产者发送两个消息并且有两个分区，Kafka将在第一分区中存储一个消息，在第二分区中存储第二消息。
- 消费者订阅特定主题。
- 一旦消费者订阅主题，Kafka将向消费者提供主题的当前偏移，并且还将偏移保存在Zookeeper系综中。
- 消费者将定期请求Kafka(如100 Ms)新消息。
- 一旦Kafka收到来自生产者的消息，它将这些消息转发给消费者。
- 消费者将收到消息并进行处理。
- 一旦消息被处理，消费者将向Kafka代理发送确认。
- 一旦Kafka收到确认，它将偏移更改为新值，并在Zookeeper中更新它。 由于偏移在Zookeeper中维护，消费者可以正确地读取下一封邮件，即使在服务器暴力期间。
- 以上流程将重复，直到消费者停止请求。
- 消费者可以随时回退/跳到所需的主题偏移量，并阅读所有后续消息。

## 队列消息/用户组的工作流

在队列消息传递系统而不是单个消费者中，具有相同组ID 的一组消费者将订阅主题。 简单来说，订阅具有相同 Group ID 的主题的消费者被认为是单个组，并且消息在它们之间共享。 让我们检查这个系统的实际工作流程。

- 生产者以固定间隔向某个主题发送消息。
- Kafka存储在为该特定主题配置的分区中的所有消息，类似于前面的方案。
- 单个消费者订阅特定主题，假设 Topic-01 为 Group ID 为 Group-1 。
- Kafka以与发布 – 订阅消息相同的方式与消费者交互，直到新消费者以相同的组ID 订阅相同主题 Topic-01 1 。
- 一旦新消费者到达，Kafka将其操作切换到共享模式，并在两个消费者之间共享数据。 此共享将继续，直到用户数达到为该特定主题配置的分区数。
- 一旦消费者的数量超过分区的数量，新消费者将不会接收任何进一步的消息，直到现有消费者取消订阅任何一个消费者。 出现这种情况是因为Kafka中的每个消费者将被分配至少一个分区，并且一旦所有分区被分配给现有消费者，新消费者将必须等待。
- 此功能也称为使用者组。 同样，Kafka将以非常简单和高效的方式提供两个系统中最好的。

## ZooKeeper的作用

Apache Kafka的一个关键依赖是Apache Zookeeper，它是一个分布式配置和同步服务。 Zookeeper是Kafka代理和消费者之间的协调接口。 Kafka服务器通过Zookeeper集群共享信息。 Kafka在Zookeeper中存储基本元数据，例如关于主题，代理，消费者偏移(队列读取器)等的信息。

由于所有关键信息存储在Zookeeper中，并且它通常在其整体上复制此数据，因此Kafka代理/ Zookeeper的故障不会影响Kafka集群的状态。 Kafka将恢复状态，一旦Zookeeper重新启动。 这为Kafka带来了零停机时间。 Kafka代理之间的领导者选举也通过使用Zookeeper在领导者失败的情况下完成。

要了解有关Zookeeper的详细信息，请参阅 zookeeper

让我们继续进一步关于如何在您的机器上安装Java，ZooKeeper和Kafka在下一章。

## Apache Kafka – 安装步骤

以下是在机器上安装Java的步骤。

## 步骤1 – 验证Java安装

希望你已经在你的机器上安装了java，所以你只需使用下面的命令验证它。

```java
$ java -version
```

如果java在您的机器上成功安装，您可以看到已安装的Java的版本。

### 步骤1.1 – 下载JDK

如果没有下载Java，请通过访问以下链接并下载最新版本来下载最新版本的JDK。

[http://www.oracle.com/technetwork/java/javase/downloads/index.html](http://www.oracle.com/technetwork/java/javase/downloads/index.html)

现在最新的版本是JDK 8u 60，文件是“jdk-8u60-linux-x64.tar.gz”。 请在您的机器上下载该文件。

### 步骤1.2 – 提取文件

通常，正在下载的文件存储在下载文件夹中，验证它并使用以下命令提取tar设置。

```java
$ cd /go/to/download/path
$ tar -zxf jdk-8u60-linux-x64.gz
```

### 步骤1.3 – 移动到选择目录

要将java提供给所有用户，请将提取的java内容移动到 usr / local / java / folder。

```java
$ su
password: (type password of root user)
$ mkdir /opt/jdk
$ mv jdk-1.8.0_60 /opt/jdk/
```

### 步骤1.4 – 设置路径

要设置路径和JAVA_HOME变量，请将以下命令添加到〜/ .bashrc文件。

```java
export JAVA_HOME =/usr/jdk/jdk-1.8.0_60
export PATH=$PATH:$JAVA_HOME/bin
```

现在将所有更改应用到当前运行的系统。

```java
$ source ~/.bashrc
```

### 步骤1.5 – Java替代

使用以下命令更改Java Alternatives。

```java
update-alternatives --install /usr/bin/java java /opt/jdk/jdk1.8.0_60/bin/java 100
```

**步骤1.6** - 现在使用第1步中说明的验证命令(java -version)验证java。

## 步骤2 – ZooKeeper框架安装

### 步骤2.1 – 下载ZooKeeper

要在您的计算机上安装ZooKeeper框架，请访问以下链接并下载最新版本的ZooKeeper。

[http://zookeeper.apache.org/releases.html](http://zookeeper.apache.org/releases.html)

现在，最新版本的ZooKeeper是3.4.6(ZooKeeper-3.4.6.tar.gz)。

### 步骤2.2 – 提取tar文件

使用以下命令提取tar文件

```java
$ cd opt/
$ tar -zxf zookeeper-3.4.6.tar.gz
$ cd zookeeper-3.4.6
$ mkdir data
```

### 步骤2.3 – 创建配置文件

使用命令vi“conf / zoo.cfg”打开名为 conf / zoo.cfg 的配置文件，并将所有以下参数设置为起点。

```java
$ vi conf/zoo.cfg
tickTime=2000
dataDir=/path/to/zookeeper/data
clientPort=2181
initLimit=5
syncLimit=2
```

一旦配置文件成功保存并再次返回终端，您可以启动zookeeper服务器。

### 步骤2.4 – 启动ZooKeeper服务器

```java
$ bin/zkServer.sh start
```

执行此命令后，您将得到如下所示的响应 –

```java
$ JMX enabled by default
$ Using config: /Users/../zookeeper-3.4.6/bin/../conf/zoo.cfg
$ Starting zookeeper ... STARTED
```

### 步骤2.5 – 启动CLI

```java
$ bin/zkCli.sh
```

输入上面的命令后，您将被连接到zookeeper服务器，并将获得以下响应。

```java
Connecting to localhost:2181
................
................
................
Welcome to ZooKeeper!
................
................
WATCHER::
WatchedEvent state:SyncConnected type: None path:null
[zk: localhost:2181(CONNECTED) 0]
```

### 步骤2.6 – 停止Zookeeper服务器

连接服务器并执行所有操作后，可以使用以下命令停止zookeeper服务器 –

```java
$ bin/zkServer.sh stop
```

现在你已经在你的机器上成功安装了Java和ZooKeeper。 让我们看看安装Apache Kafka的步骤。

## 步骤3 – Apache Kafka安装

让我们继续以下步骤在您的机器上安装Kafka。

### 步骤3.1 – 下载Kafka

要在您的机器上安装Kafka，请点击以下链接 –

[https://www.apache.org/dyn/closer.cgi?path=/kafka/0.9.0.0/kafka_2.11-0.9.0.0.tgz](https://www.apache.org/dyn/closer.cgi?path=/kafka/0.9.0.0/kafka_2.11-0.9.0.0.tgz)

现在最新版本，即 – **kafka_2.11_0.9.0.0.tgz** 将下载到您的计算机上。

### 步骤3.2 – 解压tar文件

使用以下命令提取tar文件 –

```java
$ cd opt/
$ tar -zxf kafka_2.11.0.9.0.0 tar.gz
$ cd kafka_2.11.0.9.0.0
```

现在您已经在您的机器上下载了最新版本的Kafka。

### 步骤3.3 – 启动服务器

您可以通过给出以下命令来启动服务器 –

```java
$ bin/kafka-server-start.sh config/server.properties
```

服务器启动后，您会在屏幕上看到以下响应:

```java
$ bin/kafka-server-start.sh config/server.properties
[2016-01-02 15:37:30,410] INFO KafkaConfig values:
request.timeout.ms = 30000
log.roll.hours = 168
inter.broker.protocol.version = 0.9.0.X
log.preallocate = false
security.inter.broker.protocol = PLAINTEXT
…………………………………………….
…………………………………………….
```

## 步骤4 – 停止服务器

执行所有操作后，可以使用以下命令停止服务器 –

```java
$ bin/kafka-server-stop.sh config/server.properties
```

现在我们已经讨论了Kafka安装，我们可以在下一章中学习如何对Kafka执行基本操作。

## Apache Kafka – 基本操作

首先让我们开始实现单节点单代理配置，然后我们将我们的设置迁移到单节点多代理配置。

希望你现在可以在你的机器上安装Java，ZooKeeper和Kafka。 在迁移到Kafka Cluster Setup之前，首先需要启动ZooKeeper，因为Kafka Cluster使用ZooKeeper。

## 启动ZooKeeper

打开一个新终端并键入以下命令 –

```java
bin/zookeeper-server-start.sh config/zookeeper.properties
```

要启动Kafka Broker，请键入以下命令 –

```java
bin/kafka-server-start.sh config/server.properties
```

启动Kafka Broker后，在ZooKeeper终端上键入命令 jps ，您将看到以下响应 –

```java
821 QuorumPeerMain
928 Kafka
931 Jps
```

现在你可以看到两个守护进程运行在终端上，QuorumPeerMain是ZooKeeper守护进程，另一个是Kafka守护进程。

## 单节点 – 单代理配置

在此配置中，您有一个ZooKeeper和代理id实例。 以下是配置它的步骤 –

**创建Kafka主题** - Kafka提供了一个名为 kafka-topics.sh 的命令行实用程序，用于在服务器上创建主题。 打开新终端并键入以下示例。

**语法**

```java
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 
--partitions 1 --topic topic-name
```

**示例**

```java
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1   
--partitions 1 --topic Hello-Kafka
```

我们刚刚创建了一个名为 Hello-Kafka 的主题，其中包含一个分区和一个副本因子。 上面创建的输出将类似于以下输出 –

**输出** - 创建主题 Hello-Kafka

创建主题后，您可以在Kafka代理终端窗口中获取通知，并在config / server.properties文件中的“/ tmp / kafka-logs /”中指定的创建主题的日志。

## 主题列表

要获取Kafka服务器中的主题列表，可以使用以下命令 –

**语法**

```java
bin/kafka-topics.sh --list --zookeeper localhost:2181
```

**输出**

```java
Hello-Kafka
```

由于我们已经创建了一个主题，它将仅列出 Hello-Kafka 。 假设，如果创建多个主题，您将在输出中获取主题名称。

### 启动生产者以发送消息

**语法**

```java
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic topic-name
```

从上面的语法，生产者命令行客户端需要两个主要参数 –

**代理列表** - 我们要发送邮件的代理列表。 在这种情况下，我们只有一个代理。 Config / server.properties文件包含代理端口ID，因为我们知道我们的代理正在侦听端口9092，因此您可以直接指定它。

主题名称 – 以下是主题名称的示例。

**示例**

```java
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic Hello-Kafka
```

生产者将等待来自stdin的输入并发布到Kafka集群。 默认情况下，每个新行都作为新消息发布，然后在 config / producer.properties 文件中指定默认生产者属性。 现在，您可以在终端中键入几行消息，如下所示。

**输出**

```java
$ bin/kafka-console-producer.sh --broker-list localhost:9092 
--topic Hello-Kafka[2016-01-16 13:50:45,931] 
WARN property topic is not valid (kafka.utils.Verifia-bleProperties)
Hello
My first message
```

```java
My second message
```

### 启动消费者以接收消息

与生产者类似，在 config / consumer.proper-ties 文件中指定了缺省使用者属性。 打开一个新终端并键入以下消息消息语法。

**语法**

```java
bin/kafka-console-consumer.sh --zookeeper localhost:2181 —topic topic-name 
--from-beginning
```

**示例**

```java
bin/kafka-console-consumer.sh --zookeeper localhost:2181 —topic Hello-Kafka 
--from-beginning
```

**输出**

```java
Hello
My first message
My second message
```

最后，您可以从制作商的终端输入消息，并看到他们出现在消费者的终端。 到目前为止，您对具有单个代理的单节点群集有非常好的了解。 现在让我们继续讨论多个代理配置。

## 单节点多代理配置

在进入多个代理集群设置之前，首先启动ZooKeeper服务器。

**创建多个Kafka Brokers** - 我们在配置/ server.properties中已有一个Kafka代理实例。 现在我们需要多个代理实例，因此将现有的server.prop-erties文件复制到两个新的配置文件中，并将其重命名为server-one.properties和server-two.properties。 然后编辑这两个新文件并分配以下更改 –

### config / server-one.properties

```java
# The id of the broker. This must be set to a unique integer for each broker.
broker.id=1
# The port the socket server listens on
port=9093
# A comma seperated list of directories under which to store log files
log.dirs=/tmp/kafka-logs-1
```

### config / server-two.properties

```java
# The id of the broker. This must be set to a unique integer for each broker.
broker.id=2
# The port the socket server listens on
port=9094
# A comma seperated list of directories under which to store log files
log.dirs=/tmp/kafka-logs-2
```

**启动多个代理** - 在三台服务器上进行所有更改后，打开三个新终端，逐个启动每个代理。

```java
Broker1
bin/kafka-server-start.sh config/server.properties
Broker2
bin/kafka-server-start.sh config/server-one.properties
Broker3
bin/kafka-server-start.sh config/server-two.properties
```

现在我们有三个不同的经纪人在机器上运行。 自己尝试，通过在ZooKeeper终端上键入 **jps** 检查所有守护程序，然后您将看到响应。

## 创建主题

让我们为此主题将复制因子值指定为三个，因为我们有三个不同的代理运行。 如果您有两个代理，那么分配的副本值将是两个。

**语法**

```java
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 3 
-partitions 1 --topic topic-name
```

**示例**

```java
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 3 
-partitions 1 --topic Multibrokerapplication
```

**输出**

```java
created topic “Multibrokerapplication"
```

Describe 命令用于检查哪个代理正在侦听当前创建的主题，如下所示 –

```java
bin/kafka-topics.sh --describe --zookeeper localhost:2181 
--topic Multibrokerappli-cation
```

**输出**

```java
bin/kafka-topics.sh --describe --zookeeper localhost:2181 
--topic Multibrokerappli-cation
Topic:Multibrokerapplication    PartitionCount:1 
ReplicationFactor:3 Configs:
Topic:Multibrokerapplication Partition:0 Leader:0 
Replicas:0,2,1 Isr:0,2,1
```

从上面的输出，我们可以得出结论，第一行给出所有分区的摘要，显示主题名称，分区数量和我们已经选择的复制因子。 在第二行中，每个节点将是分区的随机选择部分的领导者。

在我们的例子中，我们看到我们的第一个broker(with broker.id 0)是领导者。 然后Replicas:0,2,1意味着所有代理复制主题最后 Isr 是 in-sync 副本的集合。 那么，这是副本的子集，当前活着并被领导者赶上。

### 启动生产者以发送消息

此过程保持与单代理设置中相同。

**示例**

```java
bin/kafka-console-producer.sh --broker-list localhost:9092 
--topic Multibrokerapplication
```

**输出**

```java
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic Multibrokerapplication
[2016-01-20 19:27:21,045] WARN Property topic is not valid (kafka.utils.Verifia-bleProperties)
This is single node-multi broker demo
This is the second message
```

### 启动消费者以接收消息

此过程保持与单代理设置中所示的相同。

**示例**

```java
bin/kafka-console-consumer.sh --zookeeper localhost:2181 
—topic Multibrokerapplica-tion --from-beginning
```

**输出**

```java
bin/kafka-console-consumer.sh --zookeeper localhost:2181 
—topic Multibrokerapplica-tion —from-beginning
This is single node-multi broker demo
This is the second message
```

## 基本主题操作

在本章中，我们将讨论各种基本主题操作。

### 修改主题

您已经了解如何在Kafka Cluster中创建主题。 现在让我们使用以下命令修改已创建的主题

**语法**

```java
bin/kafka-topics.sh —zookeeper localhost:2181 --alter --topic topic_name 
--parti-tions count
```

**示例**

```java
We have already created a topic “Hello-Kafka" with single partition count and one replica factor. 
Now using “alter" command we have changed the partition count.
bin/kafka-topics.sh --zookeeper localhost:2181 
--alter --topic Hello-kafka --parti-tions 2
```

**输出**

```java
WARNING: If partitions are increased for a topic that has a key, 
the partition logic or ordering of the messages will be affected
Adding partitions succeeded!
```

### 删除主题

要删除主题，可以使用以下语法。

**语法**

```java
bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic topic_name
```

**示例**

```java
bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic Hello-kafka
```

**输出**

```java
> Topic Hello-kafka marked for deletion
```

**注意 –** 如果 **delete.topic.enable** 未设置为true，则此操作不会产生任何影响

## Apache Kafka – 简单生产者示例

让我们使用Java客户端创建一个用于发布和使用消息的应用程序。 Kafka生产者客户端包括以下API。

## KafkaProducer API

让我们了解本节中最重要的一组Kafka生产者API。 KafkaProducer API的中心部分是 KafkaProducer 类。 KafkaProducer类提供了一个选项，用于将其构造函数中的Kafka代理连接到以下方法。

- KafkaProducer类提供send方法以异步方式将消息发送到主题。 send()的签名如下

```java
producer.send(new ProducerRecord<byte[],byte[]>(topic, 
partition, key1, value1) , callback);
```

- **ProducerRecord** - 生产者管理等待发送的记录的缓冲区。
- **回调** - 当服务器确认记录时执行的用户提供的回调(null表示无回调)。
- KafkaProducer类提供了一个flush方法，以确保所有先前发送的消息都已实际完成。 flush方法的语法如下 –

```java
public void flush()
```

- KafkaProducer类提供了partitionFor方法，这有助于获取给定主题的分区元数据。 这可以用于自定义分区。 这种方法的签名如下 –

```java
public Map metrics()
```

它返回由生产者维护的内部度量的映射。

- public void close() – KafkaProducer类提供关闭方法块，直到所有先前发送的请求完成。

## 生产者API

生产者API的中心部分是生产者类。 生产者类提供了一个选项，通过以下方法在其构造函数中连接Kafka代理。

### 生产者类

生产者类提供send方法以使用以下签名向单个或多个主题**发送**消息。

```java
public void send(KeyedMessaget<k,v> message) 
- sends the data to a single topic,par-titioned by key using either sync or async producer.
public void send(List<KeyedMessage<k,v>>messages)
- sends data to multiple topics.
Properties prop = new Properties();
prop.put(producer.type,"async")
ProducerConfig config = new ProducerConfig(prop);
```

有两种类型的生产者 – **同步**和**异步**。

相同的API配置也适用于同步生产者。 它们之间的区别是同步生成器直接发送消息，但在后台发送消息。 当您想要更高的吞吐量时，异步生产者是首选。 在以前的版本，如0.8，一个异步生产者没有回调send()注册错误处理程序。 这仅在当前版本0.9中可用。

### public void close()

生产者类提供**关闭**方法以关闭与所有Kafka代理的生产者池连接。

## 配置设置

下表列出了Producer API的主要配置设置，以便更好地理解 –

S.No
配置设置和说明

1
 client.id

标识生产者应用程序

2

**producer.type**

同步或异步

3

**acks**

acks配置控制生产者请求下的标准是完全的。

4

**重试**

如果生产者请求失败，则使用特定值自动重试。

5

bootstrapping代理列表。

6

**linger.ms**

如果你想减少请求的数量，你可以将linger.ms设置为大于某个值的东西。

7

**key.serializer**

序列化器接口的键。

8

**value.serializer**

值。

9

**batch.size**

缓冲区大小。

10

**buffer.memory**

控制生产者可用于缓冲的存储器的总量。

### ProducerRecord API

ProducerRecord是发送到Kafka cluster.ProducerRecord类构造函数的键/值对，用于使用以下签名创建具有分区，键和值对的记录。

```java
public ProducerRecord (string topic, int partition, k key, v value)
```

- **主题** - 将附加到记录的用户定义的主题名称。
- **分区** - 分区计数
- **键** - 将包含在记录中的键。
-
- **Value** − Record contents

```java
public ProducerRecord (string topic, k key, v value)
```

ProducerRecord类构造函数用于创建带有键，值对和无分区的记录。

- **主题** - 创建主题以分配记录。
- **键** - 记录的键。
- **值** - 记录内容。

```java
public ProducerRecord (string topic, v value)
```

ProducerRecord类创建一个没有分区和键的记录。

- **主题** - 创建主题。
- **值** - 记录内容。

ProducerRecord类方法列在下表中 –

S.No
类方法和描述

1
 public string topic()

主题将附加到记录。

2

**public K key()**

将包括在记录中的键。如果没有这样的键，null将在这里重新打开。

3

**public V value()**

记录内容。

4

**partition()**

记录的分区计数

## SimpleProducer应用程序

在创建应用程序之前，首先启动ZooKeeper和Kafka代理，然后使用create topic命令在Kafka代理中创建自己的主题。 之后，创建一个名为 Sim-pleProducer.java 的java类，然后键入以下代码。

```java
//import util.properties packages
import java.util.Properties;
//import simple producer packages
import org.apache.kafka.clients.producer.Producer;
//import KafkaProducer packages
import org.apache.kafka.clients.producer.KafkaProducer;
//import ProducerRecord packages
import org.apache.kafka.clients.producer.ProducerRecord;
//Create java class named “SimpleProducer"
public class SimpleProducer {
   public static void main(String[] args) throws Exception{
      // Check arguments length value
      if(args.length == 0){
         System.out.println("Enter topic name");
         return;
      }
      //Assign topicName to string variable
      String topicName = args[0].toString();
      // create instance for properties to access producer configs   
      Properties props = new Properties();
      //Assign localhost id
      props.put("bootstrap.servers", “localhost:9092");
      //Set acknowledgements for producer requests.      
      props.put("acks", “all");
      //If the request fails, the producer can automatically retry,
      props.put("retries", 0);
      //Specify buffer size in config
      props.put("batch.size", 16384);
      //Reduce the no of requests less than 0   
      props.put("linger.ms", 1);
      //The buffer.memory controls the total amount of memory available to the producer for buffering.   
      props.put("buffer.memory", 33554432);
      props.put("key.serializer", 
         "org.apache.kafka.common.serializa-tion.StringSerializer");
      props.put("value.serializer", 
         "org.apache.kafka.common.serializa-tion.StringSerializer");
      Producer<String, String> producer = new KafkaProducer
         <String, String>(props);
      for(int i = 0; i < 10; i++)
         producer.send(new ProducerRecord<String, String>(topicName, 
            Integer.toString(i), Integer.toString(i)));
               System.out.println(“Message sent successfully");
               producer.close();
   }
}
```

**编译** - 可以使用以下命令编译应用程序。

```java
javac -cp “/path/to/kafka/kafka_2.11-0.9.0.0/lib/*" *.java
```

**执行** - 可以使用以下命令执行应用程序。

```java
java -cp “/path/to/kafka/kafka_2.11-0.9.0.0/lib/*":. SimpleProducer <topic-name>
```

**输出**

```java
Message sent successfully
To check the above output open new terminal and type Consumer CLI command to receive messages.
>> bin/kafka-console-consumer.sh --zookeeper localhost:2181 —topic <topic-name> —from-beginning
1
2
3
4
5
6
7
8
9
10
```

## 简单消费者示例

到目前为止，我们已经创建了一个发送消息到Kafka集群的生产者。 现在让我们创建一个消费者来消费Kafka集群的消息。 KafkaConsumer API用于消费来自Kafka集群的消息。 KafkaConsumer类的构造函数定义如下。

```java
public KafkaConsumer(java.util.Map<java.lang.String,java.lang.Object> configs)
```

**configs** - 返回消费者配置的地图。

KafkaConsumer类具有下表中列出的以下重要方法。

S.No
方法和说明

1
 public java.util.Setassignment()

获取由用户当前分配的分区集。

2

**public string subscription()**

订阅给定的主题列表以获取动态签名的分区。

3

**public void sub-scribe(java.util.List topics，ConsumerRe-balanceListener listener)**

订阅给定的主题列表以获取动态签名的分区。

4

**public void unsubscribe()**

从给定的分区列表中取消订阅主题。

5

**public void sub-scribe(java.util.List topics)**

订阅给定的主题列表以获取动态签名的分区。如果给定的主题列表为空，则将其视为与unsubscribe()相同。

6

**public void sub-scribe(java.util.regex.Pattern pattern，ConsumerRebalanceLis-tener listener)**

参数模式以正则表达式的格式引用预订模式，而侦听器参数从预订模式获取通知。

7

**public void as-sign(java.util.List partitions)**

向客户手动分配分区列表。

8

**poll()**

使用预订/分配API之一获取指定的主题或分区的数据。如果在轮询数据之前未预订主题，这将返回错误。

9

**public void commitSync()**

提交对主题和分区的所有子编制列表的最后一次poll()返回的提交偏移量。相同的操作应用于commitAsyn()。

10

**public void seek(TopicPartition partition，long offset)**

获取消费者将在下一个poll()方法中使用的当前偏移值。

11

**public void resume()**

恢复暂停的分区。

12

**public void wakeup()**

唤醒消费者。

## ConsumerRecord API

ConsumerRecord API用于从Kafka集群接收记录。 此API由主题名称，分区号(从中接收记录)和指向Kafka分区中的记录的偏移量组成。 ConsumerRecord类用于创建具有特定主题名称，分区计数和``的消费者记录。 对。 它有以下签名。

```java
public ConsumerRecord(string topic,int partition, long offset,K key, V value)
```

- **主题** - 从Kafka集群接收的使用者记录的主题名称。
- **分区** - 主题的分区。
- **键** - 记录的键，如果没有键存在null将被返回。
- **值** - 记录内容。

## ConsumerRecords API

ConsumerRecords API充当ConsumerRecord的容器。 此API用于保存特定主题的每个分区的ConsumerRecord列表。 它的构造器定义如下。

```java
public ConsumerRecords(java.util.Map<TopicPartition,java.util.List
<Consumer-Record>K,V>>> records)
```

- **TopicPartition** - 返回特定主题的分区地图。
- **记录** - ConsumerRecord的返回列表。

ConsumerRecords类定义了以下方法。

S.No
方法和描述

1
 public int count()

所有主题的记录数。

2

**public Set partitions()**

在此记录集中具有数据的分区集(如果没有返回数据，则该集为空)。

3

**public Iterator iterator()**

迭代器使您可以循环访问集合，获取或重新移动元素。

4

**public List records()**

获取给定分区的记录列表。

## 配置设置

Consumer客户端API主配置设置的配置设置如下所示 –

S.No
设置和说明

1

引导代理列表。

2

**group.id**

将单个消费者分配给组。

3

**enable.auto.commit**

如果值为true，则为偏移启用自动落实，否则不提交。

4

**auto.commit.interval.ms**

返回更新的消耗偏移量写入ZooKeeper的频率。

5

**session.timeout.ms**

表示Kafka在放弃和继续消费消息之前等待ZooKeeper响应请求(读取或写入)多少毫秒。

## SimpleConsumer应用程序

生产者应用程序步骤在此保持不变。 首先，启动你的ZooKeeper和Kafka代理。 然后使用名为 SimpleCon-sumer.java 的Java类创建一个 SimpleConsumer 应用程序，并键入以下代码。

```java
import java.util.Properties;
import java.util.Arrays;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.ConsumerRecord;
public class SimpleConsumer {
   public static void main(String[] args) throws Exception {
      if(args.length == 0){
         System.out.println("Enter topic name");
         return;
      }
      //Kafka consumer configuration settings
      String topicName = args[0].toString();
      Properties props = new Properties();
      props.put("bootstrap.servers", "localhost:9092");
      props.put("group.id", "test");
      props.put("enable.auto.commit", "true");
      props.put("auto.commit.interval.ms", "1000");
      props.put("session.timeout.ms", "30000");
      props.put("key.deserializer", 
         "org.apache.kafka.common.serializa-tion.StringDeserializer");
      props.put("value.deserializer", 
         "org.apache.kafka.common.serializa-tion.StringDeserializer");
      KafkaConsumer<String, String> consumer = new KafkaConsumer
         <String, String>(props);
      //Kafka Consumer subscribes list of topics here.
      consumer.subscribe(Arrays.asList(topicName))
      //print the topic name
      System.out.println("Subscribed to topic " &plus; topicName);
      int i = 0;
      while (true) {
         ConsumerRecords<String, String> records = con-sumer.poll(100);
         for (ConsumerRecord<String, String> record : records)
         // print the offset,key and value for the consumer records.
         System.out.printf("offset = %d, key = %s, value = %s\n", 
            record.offset(), record.key(), record.value());
      }
   }
}
```

**编译** - 可以使用以下命令编译应用程序。

```java
javac -cp “/path/to/kafka/kafka_2.11-0.9.0.0/lib/*" *.java
```

**执行 –** 可以使用以下命令执行应用程序

```java
java -cp “/path/to/kafka/kafka_2.11-0.9.0.0/lib/*":. SimpleConsumer <topic-name>
```

**输入** - 打开生成器CLI并向主题发送一些消息。 你可以把smple输入为\’Hello Consumer\’。

**输出** - 以下是输出。

```java
Subscribed to topic Hello-Kafka
offset = 3, key = null, value = Hello Consumer
```

## Apache Kafka – 用户组示例

消费群是多线程或多机器的Kafka主题。

## 消费者群体

- 消费者可以使用相同的 group.id 加入群组
- 一个组的最大并行度是组中的消费者数量←不是分区。
- Kafka将主题的分区分配给组中的使用者，以便每个分区仅由组中的一个使用者使用。
- Kafka保证消息只能被组中的一个消费者读取。
- 消费者可以按照消息存储在日志中的顺序查看消息。

### 重新平衡消费者

添加更多进程/线程将导致Kafka重新平衡。 如果任何消费者或代理无法向ZooKeeper发送心跳，则可以通过Kafka集群重新配置。 在此重新平衡期间，Kafka将分配可用分区到可用线程，可能将分区移动到另一个进程。

```java
import java.util.Properties;
import java.util.Arrays;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.ConsumerRecord;
public class ConsumerGroup {
   public static void main(String[] args) throws Exception {
      if(args.length < 2){
         System.out.println("Usage: consumer <topic> <groupname>");
         return;
      }
      String topic = args[0].toString();
      String group = args[1].toString();
      Properties props = new Properties();
      props.put("bootstrap.servers", "localhost:9092");
      props.put("group.id", group);
      props.put("enable.auto.commit", "true");
      props.put("auto.commit.interval.ms", "1000");
      props.put("session.timeout.ms", "30000");
      props.put("key.deserializer",          
         "org.apache.kafka.common.serializa-tion.StringDeserializer");
      props.put("value.deserializer", 
         "org.apache.kafka.common.serializa-tion.StringDeserializer");
      KafkaConsumer<String, String> consumer = new KafkaConsumer<String, String>(props);
      consumer.subscribe(Arrays.asList(topic));
      System.out.println("Subscribed to topic " &plus; topic);
      int i = 0;
      while (true) {
         ConsumerRecords<String, String> records = con-sumer.poll(100);
            for (ConsumerRecord<String, String> record : records)
               System.out.printf("offset = %d, key = %s, value = %s\n", 
               record.offset(), record.key(), record.value());
      }     
   }  
}
```

### 汇编

```java
javac -cp “/path/to/kafka/kafka_2.11-0.9.0.0/libs/*" ConsumerGroup.java
```

### 执行

```java
>>java -cp “/path/to/kafka/kafka_2.11-0.9.0.0/libs/*":. 
ConsumerGroup <topic-name> my-group
>>java -cp "/home/bala/Workspace/kafka/kafka_2.11-0.9.0.0/libs/*":. 
ConsumerGroup <topic-name> my-group
```

在这里，我们为两个消费者创建了一个示例组名称为 my-group 。 同样，您可以在组中创建您的组和消费者数量。

### 输入

打开生产者CLI并发送一些消息 –

```java
Test consumer group 01
Test consumer group 02
```

### 第一个过程的输出

```java
Subscribed to topic Hello-kafka
offset = 3, key = null, value = Test consumer group 01
```

### 第二个过程的输出

```java
Subscribed to topic Hello-kafka
offset = 3, key = null, value = Test consumer group 02
```

现在希望你能通过使用Java客户端演示了解SimpleConsumer和ConsumeGroup。 现在，您了解如何使用Java客户端发送和接收消息。 让我们在下一章继续Kafka与大数据技术的集成。

## Apache Kafka – 与Storm集成

在本章中，我们将学习如何将Kafka与Apache Storm集成。

## 关于Storm

Storm最初由Nathan Marz和BackType的团队创建。 在短时间内，Apache Storm成为分布式实时处理系统的标准，允许您处理大量数据。 Storm是非常快的，并且一个基准时钟为每个节点每秒处理超过一百万个元组。 Apache Storm持续运行，从配置的源(Spouts)消耗数据，并将数据传递到处理管道(Bolts)。 联合，spout和Bolt

做一个拓扑。

## 与Storm集成

Kafka和Storm自然互补，它们强大的合作能够实现快速移动的大数据的实时流分析。 Kafka和Storm集成是为了使开发人员更容易地从Storm拓扑获取和发布数据流。

### 概念流

spout是流的源。 例如，一个spout可以从Kafka Topic读取元组并将它们作为流发送。 Bolt消耗输入流，处理并可能发射新的流。 Bolt可以从运行函数，过滤元组，执行流聚合，流连接，与数据库交谈等等做任何事情。 Storm拓扑中的每个节点并行执行。 拓扑无限运行，直到终止它。 Storm将自动重新分配任何失败的任务。 此外，Storm保证没有数据丢失，即使机器停机和消息被丢弃。

让我们详细了解Kafka-Storm集成API。 有三个主要类集成Kafka与Storm。 他们如下 –

### 经纪人 – ZkHosts＆amp; 静态主机

BrokerHosts是一个接口，ZkHosts和StaticHosts是它的两个主要实现。 ZkHosts用于通过在ZooKeeper中维护细节来动态跟踪Kafka代理，而StaticHosts用于手动/静态设置Kafka代理及其详细信息。 ZkHosts是访问Kafka代理的简单快捷的方式。

ZkHosts的签名如下 –

```java
public ZkHosts(String brokerZkStr, String brokerZkPath)
public ZkHosts(String brokerZkStr)
```

其中brokerZkStr是ZooKeeper主机，brokerZkPath是ZooKeeper路径以维护Kafka代理详细信息。

### KafkaConfig API

此API用于定义Kafka集群的配置设置。 Kafka Con-fig的签名定义如下

```java
public KafkaConfig(BrokerHosts hosts, string topic)
```

- **主机** - BrokerHosts可以是ZkHosts / StaticHosts。
- **主题** - 主题名称。

### SpoutConfig API

Spoutconfig是KafkaConfig的扩展，支持额外的ZooKeeper信息。

```java
public SpoutConfig(BrokerHosts hosts, string topic, string zkRoot, string id)
```

- **主机** - BrokerHosts可以是BrokerHosts接口的任何实现
- **主题** - 主题名称。
- **zkRoot** - ZooKeeper根路径。
- **id –** spouts存储在Zookeeper中消耗的偏移量的状态。 ID应该唯一标识您的spout。

### SchemeAsMultiScheme

SchemeAsMultiScheme是一个接口，用于指示如何将从Kafka中消耗的ByteBuffer转换为Storm元组。 它源自MultiScheme并接受Scheme类的实现。 有很多Scheme类的实现，一个这样的实现是StringScheme，它将字节解析为一个简单的字符串。 它还控制输出字段的命名。 签名定义如下。

```java
public SchemeAsMultiScheme(Scheme scheme)
```

- **方案** - 从kafka消耗的字节缓冲区。

### KafkaSpout API

KafkaSpout是我们的spout实现，它将与Storm集成。 它从kafka主题获取消息，并将其作为元组发送到Storm生态系统。 KafkaSpout从SpoutConfig获取其配置详细信息。

下面是一个创建一个简单的Kafka spout的示例代码。

```java
// ZooKeeper connection string
BrokerHosts hosts = new ZkHosts(zkConnString);
//Creating SpoutConfig Object
SpoutConfig spoutConfig = new SpoutConfig(hosts, 
   topicName, "/" + topicName UUID.randomUUID().toString());
//convert the ByteBuffer to String.
spoutConfig.scheme = new SchemeAsMultiScheme(new StringScheme());
//Assign SpoutConfig to KafkaSpout.
KafkaSpout kafkaSpout = new KafkaSpout(spoutConfig);
```

## 创建Bolt

Bolt是一个使用元组作为输入，处理元组，并产生新的元组作为输出的组件。 Bolt将实现IRichBolt接口。 在此程序中，使用两个Bolt类WordSplitter-Bolt和WordCounterBolt来执行操作。

IRichBolt接口有以下方法 –

- **准备** - 为Bolt提供要执行的环境。 执行器将运行此方法来初始化spout。
- **执行** - 处理单个元组的输入。
- **清理** - 当Bolt要关闭时调用。
- **declareOutputFields** - 声明元组的输出模式。

让我们创建SplitBolt.java，它实现逻辑分割一个句子到词和CountBolt.java，它实现逻辑分离独特的单词和计数其出现。

### SplitBolt.java

```java
import java.util.Map;
import backtype.storm.tuple.Tuple;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
import backtype.storm.task.OutputCollector;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.topology.IRichBolt;
import backtype.storm.task.TopologyContext;
public class SplitBolt implements IRichBolt {
   private OutputCollector collector;
   @Override
   public void prepare(Map stormConf, TopologyContext context,
      OutputCollector collector) {
      this.collector = collector;
   }
   @Override
   public void execute(Tuple input) {
      String sentence = input.getString(0);
      String[] words = sentence.split(" ");
      for(String word: words) {
         word = word.trim();
         if(!word.isEmpty()) {
            word = word.toLowerCase();
            collector.emit(new Values(word));
         }
      }
      collector.ack(input);
   }
   @Override
   public void declareOutputFields(OutputFieldsDeclarer declarer) {
      declarer.declare(new Fields("word"));
   }
   @Override
   public void cleanup() {}
   @Override
   public Map<String, Object> getComponentConfiguration() {
      return null;
   }
}
```

### CountBolt.java

```java
import java.util.Map;
import java.util.HashMap;
import backtype.storm.tuple.Tuple;
import backtype.storm.task.OutputCollector;
import backtype.storm.topology.
```
