# 10、Kafka 实战 - Kafka生产者事务和幂等性
- 来源：https://ddkk.com/zhuanlan/mq/kafka/7/10.html
- 分类：消息队列
- 分组：教程目录
主要讲述 Kafka 事务性的实现，这部分的实现要比幂等性的实现复杂一些，幂等性实现是事务性实现的基础，幂等性提供了单会话单 Partition Exactly-Once 语义的实现，正是因为 Idempotent Producer 不提供跨多个 Partition 和跨会话场景下的保证，因此，我们是需要一种更强的事务保证，能够原子处理多个 Partition 的写入操作，数据要么全部写入成功，要么全部失败，不期望出现中间状态。这就是 Kafka Transactions 希望解决的问题，简单来说就是能够实现 `atomic writes across partitions`，本文以 Apache Kafka 2.0.0 代码实现为例，深入分析一下 Kafka 是如何实现这一机制的。

Apache Kafka 在 Exactly-Once Semantics（EOS）上三种粒度的保证如下（来自 [Exactly-once Semantics in Apache Kafka](https://www.slideshare.net/ConfluentInc/exactlyonce-semantics-in-apache-kafka)）：

**1、** IdempotentProducer：Exactly-once，in-order，deliveryperpartition；

**2、** Transactions：Atomicwritesacrosspartitions；

**3、** Exactly-Oncestreamprocessingacrossread-process-writetasks；

第二种情况就是本文讲述的主要内容，在讲述整个事务处理流程时，也顺便分析第三种情况。

### Kafka事务 Transactions

Kafka 事务性最开始的出发点是为了在 Kafka Streams 中实现 Exactly-Once 语义的数据处理，这个问题提出之后，在真正的方案讨论阶段，社区又挖掘了更多的应用场景，也为了尽可能覆盖更多的应用场景，在真正的实现中，在很多地方做了相应的 tradeoffs，后面会写篇文章对比一下 RocketMQ 事务性的实现，就能明白 Kafka 事务性实现及应用场景的复杂性了。

Kafka 的事务处理，主要是允许应用可以把消费和生产的 batch 处理（涉及多个 Partition）在一个原子单元内完成，操作要么全部完成、要么全部失败。为了实现这种机制，我们需要应用能提供一个唯一 id，即使故障恢复后也不会改变，这个 id 就是 TransactionnalId（也叫 txn.id，后面会详细讲述），txn.id 可以跟内部的 PID 1:1 分配，它们不同的是 txn.id 是用户提供的，而 PID 是 Producer 内部自动生成的（并且故障恢复后这个 PID 会变化），有了 txn.id 这个机制，就可以实现多 partition、跨会话的 EOS 语义。

当用户使用 Kafka 的事务性时，Kafka 可以做到的保证：

**1、** 跨会话的幂等性写入：即使中间故障，恢复后依然可以保持幂等性；

**2、** 跨会话的事务恢复：如果一个应用实例挂了，启动的下一个实例依然可以保证上一个事务完成（commit或者abort）；

**3、** 跨多个Topic-Partition的幂等性写入，Kafka可以保证跨多个Topic-Partition的数据要么全部写入成功，要么全部失败，不会出现中间状态；

上面是从 Producer 的角度来看，那么如果从 Consumer 角度呢？Consumer 端很难保证一个已经 commit 的事务的所有 msg 都会被消费，有以下几个原因：

**1、** 对于compactedtopic，在一个事务中写入的数据可能会被新的值覆盖；

**2、** 一个事务内的数据，可能会跨多个logsegment，如果旧的segmeng数据由于过期而被清除，那么这个事务的一部分数据就无法被消费到了；

**3、** Consumer在消费时可以通过seek机制，随机从一个位置开始消费，这也会导致一个事务内的部分数据无法消费；

**4、** Consumer可能没有订阅这个事务涉及的全部Partition；

简单总结一下，关于 Kafka 事务性语义提供的保证主要以下三个：

**1、** Atomicwritesacrossmultiplepartitions.；

**2、** Allmessagesinatransactionaremadevisibletogether,ornoneare.；

**3、** Consumersmustbeconfiguredtoskipuncommittedmessages.；

### 事务性示例

Kafka 事务性的使用方法也非常简单，用户只需要在 Producer 的配置中配置 `transactional.id`，通过 `initTransactions()` 初始化事务状态信息，再通过 `beginTransaction()` 标识一个事务的开始，然后通过 `commitTransaction()` 或 `abortTransaction()` 对事务进行 commit 或 abort，示例如下所示：

```java
Properties props = new Properties();
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("client.id", "ProducerTranscationnalExample");
props.put("bootstrap.servers", "localhost:9092");
props.put("transactional.id", "test-transactional");
props.put("acks", "all");
KafkaProducer producer = new KafkaProducer(props);
producer.initTransactions();
try {
    String msg = "matt test";
    producer.beginTransaction();
    producer.send(new ProducerRecord(topic, "0", msg.toString()));
    producer.send(new ProducerRecord(topic, "1", msg.toString()));
    producer.send(new ProducerRecord(topic, "2", msg.toString()));
    producer.commitTransaction();
} catch (ProducerFencedException e1) {
    e1.printStackTrace();
    producer.close();
} catch (KafkaException e2) {
    e2.printStackTrace();
    producer.abortTransaction();
}
producer.close();
```

事务性的 API 也同样保持了 Kafka 一直以来的简洁性，使用起来是非常方便的。

### 事务性实现的关键

对于Kafka 的事务性实现，最关键的就是其事务操作原子性的实现。对于一个事务操作而言，其会涉及到多个 Topic-Partition 数据的写入，如果是一个 long transaction 操作，可能会涉及到非常多的数据，如何才能保证这个事务操作的原子性（要么全部完成，要么全部失败）呢？

**1、** 关于这点，最容易想到的应该是引用2PC协议（它主要是解决分布式系统数据一致性的问题）中协调者的角色，它的作用是统计所有参与者的投票结果，如果大家一致认为可以commit，那么就执行commit，否则执行abort：；

- 我们来想一下，Kafka 是不是也可以引入一个类似的角色来管理事务的状态，只有当 Producer 真正 commit 时，事务才会提交，否则事务会还在进行中（实际的实现中还需要考虑 timeout 的情况），不会处于完成状态；
- Producer 在开始一个事务时，告诉【协调者】事务开始，然后开始向多个 Topic-Partition 写数据，只有这批数据全部写完（中间没有出现异常），Producer 会调用 commit 接口进行 commit，然后事务真正提交，否则如果中间出现异常，那么事务将会被 abort（Producer 通过 abort 接口告诉【协调者】执行 abort 操作）；
- 这里的协调者与 2PC 中的协调者略有不同，主要为了管理事务相关的状态信息，这就是 Kafka Server 端的 **TransactionCoordinator** 角色；

**2、** 有了上面的机制，是不是就可以了？很容易想到的问题就是TransactionCoordinator挂的话怎么办？TransactionCoordinator如何实现高可用？；

- TransactionCoordinator 需要管理事务的状态信息，如果一个事务的 TransactionCoordinator 挂的话，需要转移到其他的机器上，这里关键是在 **事务状态信息如何恢复？** 也就是事务的状态信息需要**很强的容错性、一致性**；
- 关于数据的强容错性、一致性，存储的容错性方案基本就是多副本机制，而对于一致性，就有很多的机制实现，其实这个在 Kafka 内部已经实现（不考虑数据重复问题），那就是 `min.isr + ack` 机制；
- 分析到这里，对于 Kafka 熟悉的同学应该就知道，这个是不是跟 `__consumer_offset` 这个内部的 topic 很像，TransactionCoordinator 也跟 GroupCoordinator 类似，而对应事务数据（transaction log）就是 `__transaction_state` 这个内部 topic，所有事务状态信息都会持久化到这个 topic，TransactionCoordinator 在做故障恢复也是从这个 topic 中恢复数据；

**3、** 有了上面的机制，就够了么？我们再来考虑一种情况，我们期望一个Producer在Fail恢复后能主动abort上次未完成的事务（接上之前未完成的事务），然后重新开始一个事务，这种情况应该怎么办？之前幂等性引入的PID是无法解决这个问题的，因为每次Producer在重启时，PID都会更新为一个新值：；

- Kafka 在 Producer 端引入了一个 **TransactionalId** 来解决这个问题，这个 txn.id 是由应用来配置的；
- TransactionalId 的引入还有一个好处，就是跟 consumer group 类似，它可以用来标识一个事务操作，便于这个事务的所有操作都能在一个地方（同一个 TransactionCoordinator）进行处理；

**4、** 再来考虑一个问题，在具体的实现时，我们应该如何标识一个事务操作的开始、进行、完成的状态？正常来说，一个事务操作是由很多操作组成的一个操作单元，对于TransactionCoordinator而言，是需要准确知道当前的事务操作处于哪个阶段，这样在容错恢复时，新选举的TransactionCoordinator才能恢复之前的状态：；

这个就是**事务状态转移**，一个事务从开始，都会有一个相应的状态标识，直到事务完成，有了事务的状态转移关系之后，TransactionCoordinator 对于事务的管理就会简单很多，TransactionCoordinator 会将当前事务的状态信息都会缓存起来，每当事务需要进行转移，就更新缓存中事务的状态（前提是这个状态转移是有效的）。

如果多个 Producer 共用一个 txn.id，那么最后启动的 Producer 会成功运行，会它之前启动的 Producer 都 Fencing 掉（至于为什么会 Fencing 下一小节会做分析）。

### Consumer 消费数据时，其顺序如何保证

有了前面的分析，这个问题就很好回答了，顺序性还是严格按照 offset 的，只不过遇到 abort trsansaction 的数据时就丢弃掉，其他的与普通 Consumer 并没有区别。

### 如果 txn.id 长期不使用，server 端怎么处理？

Producer 在开始一个事务操作时，可以设置其事务超时时间（参数是 `transaction.timeout.ms`，默认60s），而且 Server 端还有一个最大可允许的事务操作超时时间（参数是 `transaction.timeout.ms`，默认是15min），Producer 设置超时时间不能超过 Server，否则的话会抛出异常。

上面是关于事务操作的超时设置，而对于 txn.id，我们知道 TransactionCoordinator 会缓存 txn.id 的相关信息，如果没有超时机制，这个 meta 大小是无法预估的，Server 端提供了一个 `transaction.id.expiration.ms` 参数来配置这个超时时间（默认是7天），如果超过这个时间没有任何事务相关的请求发送过来，那么 TransactionCoordinator 将会使这个 txn.id 过期。

### PID Snapshot 是做什么的？用来解决什么问题？

对于每个 Topic-Partition，Broker 都会在内存中维护其 PID 与 sequence number（最后成功写入的 msg 的 sequence number）的对应关系（这个在上面幂等性文章应讲述过，主要是为了不丢补充的实现）。

Broker 重启时，如果想恢复上面的状态信息，那么它读取所有的 log 文件。相比于之下，定期对这个 state 信息做 checkpoint（Snapshot），明显收益是非常大的，此时如果 Broker 重启，只需要读取最近一个 Snapshot 文件，之后的数据再从 log 文件中恢复即可。

### 中间流程故障如何恢复

对于上面所讲述的一个事务操作流程，实际生产环境中，任何一个地方都有可能出现的失败：

**1、** Producer在发送`beginTransaction()`时，如果出现timeout或者错误：Producer只需要重试即可；

**2、** Producer在发送数据时出现错误：Producer应该abort这个事务，如果Produce没有abort（比如设置了重试无限次，并且batch超时设置得非常大），TransactionCoordinator将会在这个事务超时之后abort这个事务操作；

**3、** Producer发送`commitTransaction()`时出现timeout或者错误：Producer应该重试这个请求；

**4、** CoordinatorFailure：如果TransactionCoordinator发生切换（事务topicleader切换），Coordinator可以从日志中恢复如果发送事务有处于PREPARE_COMMIT或PREPARE_ABORT状态，那么直接执行commit或者abort操作，如果是一个正在进行的事务，Coordinator的失败并不需要abort事务，producer只需要向新的Coordinator发送请求即可；

## 1 生产者幂等性

### 1.1 引入

**幂等性引入目的**：

生产者重复生产消息。生产者进行retry会产生重试时，会重复产生消息。有了幂等性之后，在进行retry重试时，只会生成一个消息。

### 1.2 幂等性实现

### 1.2.1 PID 和 Sequence Number

为了实现Producer的幂等性，Kafka引入了Producer ID（即PID）和Sequence Number。

- PID。每个新的Producer在初始化的时候会被分配一个唯一的PID，这个PID对用户是不可见的。
- Sequence Numbler。（对于每个PID，该Producer发送数据的每个``都对应一个从0开始单调递增的Sequence Number。

Broker端在缓存中保存了这seq number，对于接收的每条消息，如果其序号比Broker缓存中序号大于1则接受它，否则将其丢弃。这样就可以实现了消息重复提交了。但是，只能保证单个Producer对于同一个的Exactly Once语义。不能保证同一个Producer一个topic不同的partion幂等。

### 1.3 幂等性的应用实例

**1、** 配置属性；

需要设置：

- enable.idempotence，需要设置为ture,此时就会默认把acks设置为all，所以不需要再设置acks属性了。
