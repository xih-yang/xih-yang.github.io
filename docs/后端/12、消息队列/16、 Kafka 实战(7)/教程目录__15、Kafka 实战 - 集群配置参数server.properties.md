# 15、Kafka 实战 - 集群配置参数server.properties
- 来源：https://ddkk.com/zhuanlan/mq/kafka/7/15.html
- 分类：消息队列
- 分组：教程目录
## Kafka目前有哪些内部topic，它们都有什么特征？各自的作用又是什么？

__consumer_offsets：作用是保存 Kafka 消费者的位移信息

**offsets.topic.replication.factor=3**

解释：该值默认为1。表示kafka的内部topic consumer_offsets副本数。当该副本所在的broker宕机，consumer_offsets只有一份副本，该分区宕机。使用该分区存储消费分组offset位置的消费者均会收到影响，offset无法提交，从而导致生产者可以发送消息但消费者不可用。所以需要设置该字段的值大于1。

```java
offsets.topic.replication.factor=2
transaction.state.log.replication.factor=2
transaction.state.log.min.isr=2
#自动创建关闭
auto.create.topics.enable=false
#允许删除topic需要auto.create.topics.enable=false
delete.topic.enable=false
#副本因子
default.replication.factor=2
#最少同步副本
min.insync.replicas = 2
```

## 1、Kafka 配置参数

## 1.1 Broker Configure

**1、** listeners 地址

```java
listeners=PLAINTEXT://10.80.227.169:9092
```

**2、** 集群ID

每一个broker在集群中的唯一表示，要求是正数。当该服务器的IP地址发生改变时，broker.id没有变化，则不会影响consumers的消息情况。如果未设置，则会生成唯一的代理标识。为避免zookeeper生成的代理标识与用户配置的代理标识之间的冲突，生成的代理标识从

[reserved.broker.max.id](http://reserved.broker.max.id/) + 1开始。

```java
broker.id = -1 （default）
```

3）broker 最大消息

broker能接收消息的最大字节数，这个值应该比消费端的fetch.message.max.bytes更小才对，否则broker就会因为消费端无法使用这个消息而挂起

```java
message.max.bytes = 1000012 （default）
```

## 1.2 Topic Configure

**1、** Topic 默认分区

新建Topic时默认的分区数

```java
num.partitions	= 1 （default）
```

**2、** 自动创建topic

是否允许自动创建topic。如果设为true，那么produce，consume或者fetch metadata一个不存在的topic时，就会自动创建一个默认replication factor和partition number的topic。

```java
auto.create.topics.enable = false （default => true）
```

**3、** 删除topic

启用删除topic。如果关闭此配置，则通过管理工具删除topic将不起作用

注意：kafka-manager 删除topic依赖这个配置

```java
delete.topic.enable = true （default）
```

**4、** Topic Partition 平衡 Leader

每当broker停止或崩溃领导时，该broker的topic partition转移到其他replicas。这意味着默认情况下，当broker重新启动时，它将只是所有partition的follower，这意味着它不会用于客户端读取和写入。

为了避免这种不平衡，kafka有一个首选复制品的概念。如果partition的replicas列表是1,5,9，则节点1首选作为节点5或9的leader，因为它在replicas列表中较早。你可以让Kafka群集通过运行命令尝试恢复已恢复replicas的leader：

参数一：如果设为true，复制控制器会周期性的自动尝试，为所有的broker的每个partition平衡leadership，为更优先(preferred)的replica分配leadership

参数二：partition rebalance 检查的频率，由控制器触发，默认为300秒

参数三：每个broker允许的不平衡的leader的百分比。如果每个broker超过了这个百分比，复制控制器会对分区进行重新的平衡。该值以百分比形式指定，默认为10%

```java
auto.leader.rebalance.enable = true （default）
leader.imbalance.check.interval.seconds = 300    （default）
leader.imbalance.per.broker.percentage    = 10 （default）
```

## 1.3 Thread Configure

**1、** 后台任务处理线程数

一些后台任务处理的线程数，例如过期消息文件的删除等，一般情况下不需要去做修改

```java
background.threads = 10 （default）
```

**2、** I/O 线程

server端处理请求时的I/O线程的数量，不要小于磁盘的数量。

```java
num.io.threads = 8 （default）
```

**3、** queue max request

I/O线程等待队列中的最大的请求数，超过这个数量，network线程就不会再接收一个新的请求。这个参数是指定用于缓存网络请求的队列的最大容量，这个队列达到上限之后将不再接收新请求。一般不会成为瓶颈点，除非I/O性能太差，这时需要配合num.io.threads等配置一同进行调整

```java
queued.max.requests = 500 （default）
```

**4、** 网络线程

服务器用于接收来自网络的请求并向网络发送响应的线程数

```java
num.io.threads = 3 （default）
```

**5、** 数据目录线程

每个数据目录的线程数，用于启动时的日志恢复和关闭时的刷新

```java
num.recovery.threads.per.data.dir    = 1 （default）
```

**6、** 日志目录移动副本线程

```java
num.replica.alter.log.dirs.threads = null （default）
```

**7、** leader replicas线程数

用来从leader复制消息的线程数量，增大这个值可以增加follower的I/O并行度。

```java
num.replica.fetchers = 1  （default）
```

## 1.4 Compress Configure

**1、** 压缩类型

producer用于压缩数据的压缩类型。默认是无压缩。正确的选项值是none、gzip、snappy。压缩最好用于批量处理，批量处理消息越多，压缩性能越好

为topic指定一个压缩类型，此配置接受标准压缩编码（‘gzip’，‘snappy’，‘lz4’），另外接受’uncompressed’相当于不压缩， ‘producer’ 意味着压缩类型由producer指定

```java
compression.type = producer （default）
```

## 1.5 Log Configure

**1、** 日志路径

```java
log.dirs = /tmp/kafka-logs （defaults）
```

**2、** 日志持久化

参数一：在将消息刷新到磁盘之前，在日志分区上累积的消息数量。强制fsync一个分区的log文件之前暂存的消息数量。因为磁盘IO操作是一个慢操作，但又是一个“数据可靠性”的必要手段，所以检查是否需要固化到硬盘的时间间隔。需要在“数据可靠性”与“性能”之间做必要的权衡，如果此值过大，将会导致每次“fsync”的时间过长（IO阻塞），如果此值过小，将会导致”fsync“的次数较多，这也就意味着整体的client请求有一定的延迟，物理server故障，将会导致没有fsync的消息丢失。通常建议使用replication来确保持久性，而不是依靠单机上的fsync

参数二：任何主题中的消息在刷新到磁盘之前都保留在内存中的最长时间（以毫秒为单位）。 如果未设置，则使用log.flush.scheduler.interval.ms中的值

参数三：记录上次把日志刷到磁盘的时间点的频率，用来日后的恢复。通常不需要改变。

参数四：更新记录起始偏移量的持续记录的频率

```java
log.flush.interval.messages = 9223372036854775807 （default）
log.flush.interval.ms = null （default）
log.flush.offset.checkpoint.interval.ms = 60000 （default）
log.flush.start.offset.checkpoint.interval.ms = 60000 （default）
```

**3、** 日志清理策略

默认情况下启用日志清理程序。这将启动更干净的线程池。要在特定主题上启用日志清理，您可以添加特定于日志的属性

可选择delete或compact，如果设置为delete，当log segment文件的大小达到上限，或者roll时间达到上限，文件将会被删除。如果设置成compact，则此文件会被清理，标记成已过时状态，详见 1.8 。此配置可以被覆盖。

```java
log.cleanup.policy = delete （default）
```

日志保留的最小时间，因为时定时检查的，所以不是精确时间（单位：小时）

```java
log.retention.hours = 168 （default）
```

日志达到删除大小的阈值。每个topic下每个分区保存数据的最大文件大小；注意，这是每个分区的上限，因此这个数值乘以分区的个数就是每个topic保存的数据总量。同时注意：如果log.retention.hours和log.retention.bytes都设置了，则超过了任何一个限制都会造成删除一个段文件。注意，这项设置可以由每个topic设置时进行覆盖。-1为不限制。

```java
log.retention.bytes = -1 （default）
```

**4、** 压缩日志清理策略

启用日志清理器进程在服务器上运行。使用了cleanup.policy = compact的主题，包括内部offsets主题，都应该启动该选项。如果被禁用的话，这些topic将不会被压缩，并且会不断增长。

```java
log.cleaner.enable = true （default）
```

对于压缩的日志保留的最长时间，也是客户端消费消息的最长时间，同log.retention.minutes的区别在于一个控制未压缩数据，一个控制压缩后的数据。

```java
log.cleaner.delete.retention.ms = 86400000 （default）
```

**5、** 分区segment设置

topic 分区的日志存放在某个目录下诸多文件中，这些文件将partition的日志切分成一段一段的，这就是段文件（segment file）；一个topic的一个分区对应的所有segment文件称为log。这个设置控制着一个segment文件的最大的大小，如果超过了此大小，就会生成一个新的segment文件。此配置可以被覆盖。

```java
log.segment.bytes = 1073741824    （default）
```

这个设置会强制Kafka去新建一个新的log segment文件，即使当前使用的segment文件的大小还没有超过log.segment.bytes。此配置可以被覆盖

```java
log.roll.hours = 168
```

每个log segment的最大尺寸。注意，如果log尺寸达到这个数值，即使尺寸没有超过log.segment.bytes限制，也需要产生新的log segment。

```java
log.index.size.max.bytes = 10485760 （default）
```

检查日志段文件的间隔时间，以确定是否文件属性是否到达删除要求（单位：毫秒）

```java
log.retention.check.interval.ms = 300000 （default）
```

## 1.6 Offset Configure

**1、** offset commit ack

可以接受consumer提交之前所需的ack。通常，不应覆盖默认值（-1）

```java
offsets.commit.required.acks = -1
```

**2、** offset commit timeout

consumer 提交的延迟时间，offsets提交将被延迟，直到偏移量topic的所有副本都收到提交或达到此超时。 这与producer请求超时类似。

```java
offsets.commit.timeout.ms    = 5000  （default）
```

**3、** offset load buffer size

每次从offset段文件往缓存加载offsets数据时的读取的数据大小。默认5M

```java
offsets.load.buffer.size = 5242880    （default）
```

**4、** offset retention check interval

用于定期检查offset过期数据的检查周期

```java
offsets.retention.check.interval.ms = 600000	（default）
```

**5、** offsets retention minutes

如果一个group在这个时间没没有提交offsets，则会清理这个group的offset数据

```java
offsets.retention.minutes	= 10080 （default）
```

**6、** offset topic compression codec

offsets.topic.compression.codec仅适用于内部偏移主题（即__consumer_offsets）。对这些用户级topic没用

```java
offsets.topic.compression.codec    = 0 （default）
```

**7、** offset topic num partition

offsets topic的分区数量（部署后不应更改）

```java
offsets.topic.num.partitions = 50 （default）
```

**8、** offset topic replcas factor

offset topic的replicas数量（设置更高以确保可用性）。在集群大小满足此复制因子要求之前（例如set为3，而broker不足3个），内部topic创建将失败

```java
offsets.topic.replication.factor = 3 （default）
```

**9、** offset topic segment bytes

为了便于更快的日志压缩和缓存加载，offset的topic segment字节应保持相对较小

```java
offsets.topic.segment.bytes = 104857600 （default）
```

## 1.7 Quota Configure

**1、** quota consumer default

只有在动态默认配额没有配置或者为Zookeeper时才使用。 如果一个消费者每秒消费的数据量大于此值，则暂时不会再允许消费。0.9版本新加（单位为bytes）

```java
quota.consumer.default = 9223372036854775807 （default）
```

**2、** quota producer default

只有在动态默认配额没有配置或者为Zookeeper时才使用。如果一个生产者每秒产生的数据大于此值，则暂时会推迟接受生产者数据

```java
quota.producer.default = 9223372036854775807    （default）
```

## 1.8 Replica Configure

**1、** replica fetch min bytes

复制数据过程中，replica收到的每个fetch响应，期望的最小的字节数，如果没有收到足够的字节数，就会等待期望更多的数据，直到达到replica.fetch.wait.max.ms

```java
replica.fetch.min.bytes = 1 （default）
```

**2、** replica fetch wait max ms

follower replicas 发布的每个fetcher请求的最长等待时间。此值应始终小与 replica.log.time.max.ms，以防止针对低吞吐量topic频繁收缩ISR

```java
replica.fetch.wait.max.ms = 500
```

**3、** replica lag time max ms

如果一个follower在这个时间内没有发送fetch请求，leader将从ISR重移除这个follower，并认为这个follower已经挂了

```java
replica.lag.time.max.ms = 10000
```

**4、** replica high watermark checkpoint interval ms

每一个replica follower存储自己的high watermark到磁盘的频率，用来日后的recovery。

```java
replica.high.watermark.checkpoint.interval.ms = 5000
```

**5、** replica socket receive buffer bytes

复制数据过程中，follower发送网络请求给leader的socket receiver buffer的大小。

```java
replica.socket.receive.buffer.bytes = 65536 （default）
```

**6、** replica socket timeout ms

leader 备份数据时的socket网络请求的超时时间，[它的值至少应该是replica.fetch.wait.max.ms](http://xn--replica-vk7k915fvibd7ntrz3q2c3p7ahg5a.fetch.wait.max.ms/)

```java
replica.socket.timeout.ms = 30000 （default）
```

**7、** 副本写入保证

```java
min.insync.replicas	= 1 （defaults）
```

当生产者将ack设置为"all"（或"-1"）时，min.insync.replicas指定必须确认写入被认为成功的最小副本数（必须确认每一个replicas的写数据都是成功的）。 如果这个最小值不能满足，那么生产者将会引发一个异常（NotEnoughReplicas或NotEnoughReplicasAfterAppend）。当一起使用时，min.insync.replicas和acks允许您强制更大的耐久性保证。 一个典型的情况是创建一个复制因子为3的主题，将min.insync.replicas设置为2，并且生产者使用“all”选项。 这将确保如果大多数副本没有写入生产者则抛出异常。

**8、** unclean leader election enable

指明了是否能够使不在ISR中replicas follower设置用来作为leader

```java
unclean.leader.election.enable = false （default）
```

## 1.9 Socket Configure

**1、** socket request max bytes

server能接受的请求的最大的大小，这是为了防止server跑光内存，不能大于Java堆的大小

```java
socket.request.max.bytes = 104857600    （default）
```

**2、** socket send buffer bytes

server端用来处理socket连接的SO_SNDBUFF缓冲大小。如果值为-1，则将使用操作系统默认值。

```java
socket.send.buffer.bytes = 102400
```

## 1.10 Transacton Configure

**1、** transaction max timeout ms

事务的最大允许超时时间。 如果客户请求的事务时间超过这个时间，那么broker将在InitProducerIdRequest中返回一个错误。 这样可以防止客户超时时间过长，从而阻碍消费者读取事务中包含的主题

```java
transaction.max.timeout.ms = 900000 （default）
```

**2、** transaction state log load buffer size

将生产者ID和事务加载到缓存中时，从事务日志段（the transaction log segments）读取的批量大小。

```java
transaction.state.log.load.buffer.size = 5242880 （default）
```

**3、** transaction state log min isr

覆盖事务主题的min.insync.replicas配置，在min.insync.replicas中，replicas数量为1，该参数将默认replicas定义为2

```java
transaction.state.log.min.isr = 2 （default）
```

**4、** transaction state log num partitions

事务主题的分区数量（部署后不应更改）。

```java
transaction.state.log.num.partitions = 50 （default）
```

**5、** transaction state log replication factor

事务主题的复制因子（设置更高以确保可用性）。 内部主题创建将失败，直到群集大小满足此复制因素要求

```java
transaction.state.log.replication.factor = 3 （default）
```

**6、** transaction.state.log.segment.bytes

事务主题段字节应保持相对较小，以便更快地进行日志压缩和缓存加载

```java
transaction.state.log.segment.bytes = 104857600 （default）
```

**7、** transactional id expiration ms

事务协调器在未收到任何事务状态更新之前，主动设置生产者的事务标识为过期之前将等待的最长时间（以毫秒为单位）

```java
transactional.id.expiration.ms    = 604800000 （default）
```

## 1.11 Zookeeper Configure

**1、** zookeeper 连接地址

```java
zookeeper.connect=10.80.227.169:2181,10.80.238.7:2181,10.81.55.98:2181
```

**2、** zookeeper connection timeout

连接到ZK server的超时时间,没有配置就使用 [zookeeper.session.timeout.ms](http://zookeeper.session.timeout.ms/)

```java
zookeeper.connection.timeout.ms = null （default）
```

**3、** zookeeper session timeout ms

Zookeeper会话超时时间

```java
zookeeper.session.timeout.ms = 6000 （default）
```

**4、** zookeeper max in flight requests

此KIP建议调用一个新的代理配置zookeeper.max.in.flight.requests ，它代表客户端在阻塞之前将发送给ZooKeeper的最大未确认请求数。

此配置必须至少设置为1。

默认值设置为10.我们运行实验，显示zookeeper.max.in.flight.requests 各种ZooKeeper密集型控制器协议对完成时间的影响。选择默认值是实验结果发现收益递减的最小数字。

```java
zookeeper.max.in.flight.requests = 10 （default）
```

**5、** zookeeper set acl

连接zookeeper是否使用ACLs安全验证

```java
zookeeper.set.acl = false （default）
```

## 1.12 Other Configure

**1、** 优雅的关机

Kafka群集将自动检测任何代理关闭或故障，并为该计算机上的partition选择新的leader。无论服务器是故障还是故意关闭以进行维护或配置更改，都会发生这种情况。对于后一种情况，Kafka支持更优雅的机制来停止服务器，而不仅仅是杀死服务器。当服务器正常停止时，它有两个优化，它将利用：

它会将所有日志同步到磁盘，以避免在重新启动时需要进行任何日志恢复（即验证日志尾部所有消息的校验和）。日志恢复需要时间，因此加速了故意重启。

在关闭之前，它会将服务器所leader的任何partition迁移到其他replicas。这将使leader转移更快，并将每个partition不可用的时间缩短到几毫秒。

每当服务器停止而不是硬杀死时，将自动同步日志，但受控leader迁移需要使用特殊设置：

```java
controlled.shutdown.enable = true （default）
```

请注意，只有在代理上托管的所有分区都具有replicas（即复制因子大于1 且至少其中一个副本处于活动状态）时，受控关闭才会成功。这通常是你想要的，因为关闭最后一个replicas会使该topic partition不可用。

**2、** consumer metadata size

consumer保留offset信息的最大空间大小

```java
offset.metadata.max.bytes = 4096
```

## 2、文章及案例

kafka官方文档：http://kafka.apache.org/documentation/#diskandfs

kafka中文社区：http://orchome.com/66

kafka manager：https://github.com/yahoo/kafka-manager

kafka了解一下：https://blog.csdn.net/zy_281870667/article/details/79946919

kafka副本机制：https://blog.csdn.net/wangdan199112/article/details/51793634

kafka官方配置翻译：https://blog.csdn.net/memoordit/article/details/78850086

kafka最佳实践：http://matt33.com/2017/09/04/kafka-best-pratice/#硬件要求

kafka关于删除topic原理：https://www.cnblogs.com/huxi2b/p/4842695.html

kafka集群：https://www.cnblogs.com/luotianshuai/p/5206662.html

kafka单节点：https://blog.csdn.net/wqh8522/article/details/79163467

消息队里使用的四种场景：https://blog.csdn.net/cws1214/article/details/52922267

关于一篇发送15MB邮件所引发的size设置问题：

https://stackoverflow.com/questions/21020347/how-can-i-send-large-messages-with-kafka-over-15mb
