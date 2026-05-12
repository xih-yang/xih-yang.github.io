# 11、Kafka 源码解析 - Kafka无消息丢失配置
- 来源：https://ddkk.com/zhuanlan/mq/kafka/8/11.html
- 分类：消息队列
- 分组：教程目录
Kafka到底会不会丢数据(data loss)? 通常不会，但有些情况下的确有可能会发生。下面的参数配置及Best practice列表可以较好地保证数据的持久性(当然是trade-off，牺牲了吞吐量)。笔者会在该列表之后对列表中的每一项进行讨论，有兴趣的同学可以看下后面的分析。

**1、** block.on.buffer.full=true；

**2、** acks=all；

**3、** retries=MAX_VALUE；

**4、** max.in.flight.requests.per.connection=1；

**5、** 使用KafkaProducer.send(record,callback)；

**6、** callback逻辑中显式关闭producer：close(0)；

**7、** unclean.leader.election.enable=false；

**8、** replication.factor=3；

**9、** min.insync.replicas=2；

**10、** replication.factor>min.insync.replicas；

**11、** enable.auto.commit=false；

**12、** 消息处理完成之后再提交位移；

给出列表之后，我们从两个方面来探讨一下数据为什么会丢失：

## 一、Producer端

目前比较新版本的Kafka正式替换了Scala版本的old producer，使用了由Java重写的producer。新版本的producer采用异步发送机制。KafkaProducer.send(ProducerRecord)方法仅仅是把这条消息放入一个缓存中(即RecordAccumulator，本质上使用了队列来缓存记录)，同时后台的IO线程会不断扫描该缓存区，将满足条件的消息封装到某个batch中然后发送出去。显然，这个过程中就有一个数据丢失的窗口：若IO线程发送之前client端挂掉了，累积在accumulator中的数据的确有可能会丢失。

Producer的另一个问题是消息的乱序问题。假设客户端代码依次执行下面的语句将两条消息发到相同的分区：

```java
producer.send(record1);
producer.send(record2);
```

如果此时由于某些原因(比如瞬时的网络抖动)导致record1没有成功发送，同时Kafka又配置了重试机制和max.in.flight.requests.per.connection大于1(默认值是5，本来就是大于1的)，那么重试record1成功后，record1在分区中就在record2之后，从而造成消息的乱序。很多某些要求强顺序保证的场景是不允许出现这种情况的。

鉴于producer的这两个问题，我们应该如何规避呢？？对于消息丢失的问题，很容易想到的一个方案就是：既然异步发送有可能丢失数据， 我改成同步发送总可以吧？比如这样：

```java
producer.send(record).get();
```

这样当然是可以的，但是性能会很差，不建议这样使用。因此特意总结了一份配置列表。个人认为该配置清单应该能够比较好地规避producer端数据丢失情况的发生：(特此说明一下，软件配置的很多决策都是trade-off，下面的配置也不例外：应用了这些配置，你可能会发现你的producer/consumer 吞吐量会下降，这是正常的，因为你换取了更高的数据安全性)

- block.on.buffer.full = true 尽管该参数在0.9.0.0已经被标记为“deprecated”，但鉴于它的含义非常直观，所以这里还是显式设置它为true，使得producer将一直等待缓冲区直至其变为可用。否则如果producer生产速度过快耗尽了缓冲区，producer将抛出异常
- acks=all 很好理解，所有follower都响应了才认为消息提交成功，即"committed"
- retries = MAX 无限重试，直到你意识到出现了问题:)
- max.in.flight.requests.per.connection = 1 限制客户端在单个连接上能够发送的未响应请求的个数。设置此值是1表示kafka broker在响应请求之前client不能再向同一个broker发送请求。注意：设置此参数是为了避免消息乱序
- 使用KafkaProducer.send(record, callback)而不是send(record)方法 自定义回调逻辑处理消息发送失败
- callback逻辑中最好显式关闭producer：close(0) 注意：设置此参数是为了避免消息乱序
- unclean.leader.election.enable=false 关闭unclean leader选举，即不允许非ISR中的副本被选举为leader，以避免数据丢失
- replication.factor >= 3 这个完全是个人建议了，参考了Hadoop及业界通用的三备份原则
- min.insync.replicas > 1 消息至少要被写入到这么多副本才算成功，也是提升数据持久性的一个参数。与acks配合使用
- 保证replication.factor > min.insync.replicas 如果两者相等，当一个副本挂掉了分区也就没法正常工作了。通常设置replication.factor = min.insync.replicas + 1即可

## 二、Consumer端

consumer端丢失消息的情形比较简单：如果在消息处理完成前就提交了offset，那么就有可能造成数据的丢失。由于Kafka consumer默认是自动提交位移的，所以在后台提交位移前一定要保证消息被正常处理了，因此不建议采用很重的处理逻辑，如果处理耗时很长，则建议把逻辑放到另一个线程中去做。为了避免数据丢失，现给出两点建议：

- enable.auto.commit=false 关闭自动提交位移
- 在消息被完整处理之后再手动提交位移
