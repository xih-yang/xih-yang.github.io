# 06、Kafka 实战 - kafka数据可靠性保证
- 来源：https://ddkk.com/zhuanlan/mq/kafka/5/6.html
- 分类：消息队列
- 分组：教程目录
> 数据可靠性保证

**为保证producer发送的数据，能可靠的发送到指定的topic，topic的每个partition收到producer发送的数据后，都需要向producer发送ack（acknowledgement确认收到），如果producer收到ack，就会进行下一轮的发送，否则重新发送数据。**

### 副本数据同步策略

方案
优点
缺点

半数以上完成同步，就发送ack
延迟低
选举新的 leader 时，容忍 n 台节点的故障，需要 2n+1 个副 本

全部完成同步，才发送ack
选举新的 leader 时，容忍 n 台节点的故障，需要 n+1 个副 本
延迟高

kafka选取第二种同步策略：`全部完成同步发送ack`

原因：

**1、** 同样为了容忍n台节点发生故障，第一种方案需要2n+1个副本，而第二种方案只需要n+1个副本，由于kafka的每个分区都有大量的数据，选取第一种方案会造成大量数据的冗余；

**2、** 第二种方案虽然网络延迟比较高，但对于kafka来说的影响是相对较小的；

### ISR

这个是之前通过查看kafka主题详情的时候看到过，ISR是kafka为了防止消息丢失，使Leader会跟踪与其保持同步的follower列表

引入ISR的原因是：当leader收到数据后，所有的follower都开始同步数据，但有一个follower出现故障，不能与leader保持同步，那么leader就会一直等待下去，直到同步完成后才发送ack，如果故障的follower一直未恢复成功，leader则会一直等待下去，所有就需要解决这个问题

**因此kafka就实现了ISR这个概念来解决这个问题，leader维护一个动态的in-sync-replica set(ISR)，意思是和leader保持同步的follower集合。当ISR中的follower完成数据的同步之后，leader就会给follower发送ack。如果follower长时间未向leader同步数据，则该follower将被踢出ISR，该时间阈值由replica.lag.time.max.ms参数设定。leader故障后，会中ISR中选举新的leader**

### ACK应答机制

对于某些不太重要的数据，对数据的可靠性要求不是很高，且能够容忍少量数据的丢失，可不需要等待ISR中的follower全部接收成功。所以kafka提供了三种可靠性级别，可以根据对可靠性和延迟的要求进行权衡，选择以下配置：

**ACK参数配置**

`0`：producer不等待broker的ack，这种配置提供了一个最低的延迟，broker一接收到数据还未写入磁盘就已经返回，当broker故障时有可能**丢失数据**

`1`：producer等待broker的ack，partition的leader落盘成功后返回ack，如果在follower同步成功之前leader故障，那么将会**丢失数据**

`-1`：producer等待broker的ack，partition的leader和follower全部落盘成功后才返回ack。如果在follower同步完成后，broker发送ack之前，leader发送故障，那么会造成**重复数据**

### 故障处理

（1）follower故障

follower发生故障后会被临时踢出ISR，等到follower恢复后，follower会读取本地磁盘记录的上次的HW，并将log文件高于HW的部分截取掉，从HW开始向leader进行同步。等到该`follower的LEO大于等于该partition的HW`，即follower追上leader之后，就可以重新加入ISR了。

（2）leader故障

leader故障之后，会从ISR中选出一个新的leader，为保证多个副本之间的数据一致性，其余的`follower会将各自的log文件高于HW的部分截取`，然后从新的leader同步数据

**注意：这只能保证副本之间的数据一致性，并不能保证数据不丢失或者不重复**

### Exactly Once语义

将服务器的ack级别设置为-1，可以保证producer到server之间不会丢失数据，即`At Least Once`。

将服务器的ack级别设置为0，可以保证生产者生产的消息只会被发送一次，即`At Most Once`。

AtLeast Once可以保证数据不丢失，但不能保证数据不重复；相对的，At Most Once可以保证数据不重复，但不能保证数据不丢失。但是，对于一些非常重要的信息，比如说交易数据，下游数据消费者要求数据既不重复又不丢失，即`Exactly Once`语义。在kafka 0.11以前的版本，对此是无能为力的，只能保证数据不丢失，再在下游消费者对数据做全局去重。对于下游的每个应用来说，都需要单独的做全局去重，会对性能造成很大影响。

**0、** 11版本的kafka，引入了一项重大特性：幂等性，所谓的幂等性就是指Producer不论向server发送了多少次重复数据，server端只会持久化一条幂等性结合AtLeastOnce语义，就构成了kafka的ExactlyOnce语义：；

At L e a s t O n c e + 幂 等 性 = E x a c t l y O n c e At Least Once + 幂等性 = Exactly Once AtLeastOnce+幂等性=ExactlyOnce

要启用幂等性，只需要将Producer的参数中`enable.idompotence`设置为true即可。kafka的幂等性实现其实就是将下游的去重操作放在了数据上游。开启幂等性的producer在初始化的时候会分配一个PID，发往同一个partition的消息会附带Sequence Number。而broker端会对做缓存，当具有相同主键的消息提交时，Broker只会持久化一条。

但是PID重启就会变化，同时不同的Partition也具有不同主键，所以幂等性无法保证跨分区跨会话的Exactly Once
