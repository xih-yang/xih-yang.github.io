# 12、RocketMQ 实战 - 工作原理之消息的消费
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/5/12.html
- 分类：消息队列
- 分组：教程目录
消费者从Broker中获取消息的方式有两种：pull拉取方式和push推动方式。消费者组对于消息消费的模

式又分为两种：集群消费Clustering和广播消费Broadcasting。

## 1 获取消费类型

### 拉取式消费

Consumer主动从Broker中拉取消息，主动权由Consumer控制。一旦获取了批量消息，就会启动消费过

程。不过，该方式的实时性较弱，即Broker中有了新的消息时消费者并不能及时发现并消费。

> 由于拉取时间间隔是由用户指定的，所以在设置该间隔时需要注意平稳：间隔太短，空请求比
>
> 例会增加；间隔太长，消息的实时性太差

### 推送式消费

该模式下Broker收到数据后会主动推送给Consumer。该获取方式一般实时性较高。

该获取方式是典型的发布-订阅模式，即Consumer向其关联的Queue注册了监听器，一旦发现有新的

消息到来就会触发回调的执行，回调方法是Consumer去Queue中拉取消息。而这些都是基于Consumer

与Broker间的长连接的。长连接的维护是需要消耗系统资源的。

### 对比

- pull：需要应用去实现对关联Queue的遍历，实时性差；但便于应用控制消息的拉取
- push：封装了对关联Queue的遍历，实时性强，但会占用较多的系统资源

## 2 消费模式

### 广播消费

广播消费模式下，相同Consumer Group的每个Consumer实例都接收同一个Topic的全量消息。即每条

消息都会被发送到Consumer Group中的每个Consumer。

### 集群消费

集群消费模式下，相同Consumer Group的每个Consumer实例平均分摊同一个Topic的消息。即每条消

息只会被发送到Consumer Group中的某个Consumer。

### 消息进度保存

- 广播模式：消费进度保存在consumer端。因为广播模式下consumer group中每个consumer都会

消费所有消息，但它们的消费进度是不同。所以consumer各自保存各自的消费进度。
- 集群模式：消费进度保存在broker中。consumer group中的所有consumer共同消费同一个Topic

中的消息，同一条消息只会被消费一次。消费进度会参与到了消费的负载均衡中，故消费进度是

需要共享的。下图是broker中存放的各个Topic的各个Queue的消费进度。

## 3 Rebalance机制

Rebalance机制讨论的前提是：集群消费。

### 什么是Rebalance

Rebalance即再均衡，指的是，将⼀个Topic下的多个Queue在同⼀个Consumer Group中的多个

Consumer间进行重新分配的过程。

Rebalance机制的本意是为了提升消息的**并行消费能力**。例如，⼀个Topic下5个队列，在只有1个消费

者的情况下，这个消费者将负责消费这5个队列的消息。如果此时我们增加⼀个消费者，那么就可以给

其中⼀个消费者分配2个队列，给另⼀个分配3个队列，从而提升消息的并行消费能力。

### Rebalance限制

由于⼀个队列最多分配给⼀个消费者，因此当某个消费者组下的消费者实例数量大于队列的数量时，

多余的消费者实例将分配不到任何队列。

### Rebalance危害

Rebalance的在提升消费能力的同时，也带来一些问题：

- 消费暂停：在只有一个Consumer时，其负责消费所有队列；在新增了一个Consumer后会触发

Rebalance的发生。此时原Consumer就需要暂停部分队列的消费，等到这些队列分配给新的Consumer

后，这些暂停消费的队列才能继续被消费。
- 消费重复：Consumer 在消费新分配给自己的队列时，必须接着之前Consumer 提交的消费进度的offset

继续消费。然而默认情况下，offset是异步提交的，这个异步性导致提交到Broker的offset与Consumer

实际消费的消息并不一致。这个不一致的差值就是可能会重复消费的消息。

> 同步提交：consumer提交了其消费完毕的一批消息的offset给broker后，需要等待broker的成功
>
> ACK。当收到ACK后，consumer才会继续获取并消费下一批消息。在等待ACK期间，consumer
>
> 是阻塞的。
>
> 异步提交：consumer提交了其消费完毕的一批消息的offset给broker后，不需要等待broker的成
>
> 功ACK。consumer可以直接获取并消费下一批消息。
>
> 对于一次性读取消息的数量，需要根据具体业务场景选择一个相对均衡的是很有必要的。因为
>
> 数量过大，系统性能提升了，但产生重复消费的消息数量可能会增加；数量过小，系统性能会
>
> 下降，但被重复消费的消息数量可能会减少。

- 消费突刺：由于Rebalance可能导致重复消费，如果需要重复消费的消息过多，或者因为Rebalance暂停

时间过长从而导致积压了部分消息。那么有可能会导致在Rebalance结束之后瞬间需要消费很多消息。

### Rebalance产生的原因

导致Rebalance产生的原因，无非就两个：消费者所订阅Topic的Queue数量发生变化，或消费者组中消

费者的数量发生变化。

> 1）Queue数量发生变化的场景：
>
> Broker扩容或缩容
>
> Broker升级运维
>
> Broker与NameServer间的网络异常
>
> Queue扩容或缩容
>
> 2）消费者数量发生变化的场景：
>
> Consumer Group扩容或缩容
>
> Consumer升级运维
>
> Consumer与NameServer间网络异常

### Rebalance过程

在Broker中维护着多个Map集合，这些集合中动态存放着当前Topic中Queue的信息、Consumer Group

中Consumer实例的信息。一旦发现消费者所订阅的Queue数量发生变化，或消费者组中消费者的数量

发生变化，立即向Consumer Group中的每个实例发出Rebalance通知。

> TopicCon􀃥gManager：key是topic名称，value是TopicCon􀃥g。TopicCon􀃥g中维护着该Topic中所
>
> 有Queue的数据。
>
> ConsumerManager：key是Consumser Group Id，value是ConsumerGroupInfo。
>
> ConsumerGroupInfo中维护着该Group中所有Consumer实例数据。
>
> ConsumerOffsetManager：key为Topic与订阅该Topic的Group的组合,即topic@group，
>
> value是一个内层Map。内层Map的key为QueueId，内层Map的value为该Queue的消费进度
>
> offset。

Consumer实例在接收到通知后会采用Queue分配算法自己获取到相应的Queue，即由Consumer实例

自主进行Rebalance。

### 与Kafka对比

在Kafka中，一旦发现出现了Rebalance条件，Broker会调用Group Coordinator来完成Rebalance。

Coordinator是Broker中的一个进程。Coordinator会在Consumer Group中选出一个Group Leader。由

这个Leader根据自己本身组情况完成Partition分区的再分配。这个再分配结果会上报给Coordinator，

并由Coordinator同步给Group中的所有Consumer实例。

Kafka中的Rebalance是由Consumer Leader完成的。而RocketMQ中的Rebalance是由每个Consumer自

身完成的，Group中不存在Leader。

## 4 Queue分配算法

一个Topic中的Queue只能由Consumer Group中的一个Consumer进行消费，而一个Consumer可以同时

消费多个Queue中的消息。那么Queue与Consumer间的配对关系是如何确定的，即Queue要分配给哪

个Consumer进行消费，也是有算法策略的。常见的有四种策略。这些策略是通过在创建Consumer时的

构造器传进去的。

### 平均分配策略

该算法是要根据avg = QueueCount / ConsumerCount 的计算结果进行分配的。如果能够整除，

则按顺序将avg个Queue逐个分配Consumer；如果不能整除，则将多余出的Queue按照Consumer顺序

逐个分配。

> 该算法即，先计算好每个Consumer应该分得几个Queue，然后再依次将这些数量的Queue逐个
>
> 分配个Consumer。

### 环形平均策略

环形平均算法是指，根据消费者的顺序，依次在由queue队列组成的环形图中逐个分配。

> 该算法不用事先计算每个Consumer需要分配几个Queue，直接一个一个分即可。

### 一致性hash策略

该算法会将consumer的hash值作为Node节点存放到hash环上，然后将queue的hash值也放到hash环

上，通过顺时针方向，距离queue最近的那个consumer就是该queue要分配的consumer。

> 该算法存在的问题：分配不均。

### 同机房策略

该算法会根据queue的部署机房位置和consumer的位置，过滤出当前consumer相同机房的queue。然

后按照平均分配策略或环形平均策略对同机房queue进行分配。如果没有同机房queue，则按照平均分

配策略或环形平均策略对所有queue进行分配。

### 对比

一致性hash算法存在的问题：

两种平均分配策略的分配效率较高，一致性hash策略的较低。因为一致性hash算法较复杂。另外，一

致性hash策略分配的结果也很大可能上存在不平均的情况。

一致性hash算法存在的意义：

其可以有效减少由于消费者组扩容或缩容所带来的大量的Rebalance。

一致性hash算法的应用场景：

Consumer数量变化较频繁的场景。

## 5 至少一次原则

RocketMQ有一个原则：每条消息必须要被成功消费一次。

那么什么是成功消费呢？Consumer在消费完消息后会向其消费进度记录器提交其消费消息的offset，

offset被成功记录到记录器中，那么这条消费就被成功消费了。

> 什么是消费进度记录器？
>
> 对于广播消费模式来说，Consumer本身就是消费进度记录器。
>
> 对于集群消费模式来说，Broker是消费进度记录器。
