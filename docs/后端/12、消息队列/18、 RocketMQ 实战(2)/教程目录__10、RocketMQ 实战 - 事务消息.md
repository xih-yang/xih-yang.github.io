# 10、RocketMQ 实战 - 事务消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/6/10.html
- 分类：消息队列
- 分组：教程目录
### 事务消息介绍及流程图

RocketMQ在4.3.0版中已经支持分布式事务消息，是通过**二阶段提交**加**事务回查**来保证**本地事务和发送消息的一致性**。事务消息交互流程如下图所示。

**1、** 生产者将消息发送至ApacheRocketMQ服务端；

**2、** ApacheRocketMQ服务端将消息持久化成功之后，向生产者返回Ack确认消息已经发送成功，此时消息被标记为"暂不能投递"，这种状态下的消息即为半事务消息；

**3、** 生产者开始执行本地事务逻辑；

**4、** 生产者根据本地事务执行结果向服务端提交二次确认结果（Commit或是Rollback），服务端收到确认结果后处理逻辑如下：；

- 二次确认结果为Commit：服务端将半事务消息标记为可投递，并投递给消费者。
- 二次确认结果为Rollback：服务端将回滚事务，不会将半事务消息投递给消费者。
**5、** 在断网或者是生产者应用重启的特殊情况下，若服务端未收到发送者提交的二次确认结果，或服务端收到的二次确认结果为Unknown未知状态，经过固定时间后，服务端将对消息生产者即生产者集群中任一生产者实例发起消息回查；

**6、** 生产者收到消息回查后，需要检查对应消息的本地事务执行的最终结果；

**7、** 生产者根据检查到的本地事务的最终状态再次提交二次确认，服务端仍按照步骤4对半事务消息进行处理；

事务消息发送分为两个阶段。第一阶段会发送一个半事务消息，半事务消息是指暂不能投递的消息，生产者已经成功地将消息发送到了 Broker，但是Broker 未收到生产者对该消息的二次确认，此时该消息被标记成“暂不能投递”状态，如果发送成功则执行本地事务，并根据本地事务执行成功与否，向 Broker 半事务消息状态（commit或者rollback），半事务消息只有 commit 状态才会真正向下游投递。如果由于网络闪断、生产者应用重启等原因，导致某条事务消息的二次确认丢失，Broker 端会通过扫描发现某条消息长期处于“半事务消息”时，需要主动向消息生产者询问该消息的最终状态（Commit或是Rollback）。这样最终保证了本地事务执行成功，下游就能收到消息，本地事务执行失败，下游就收不到消息。总而保证了上下游数据的一致性。

### RocketMQ4.x版本的事务消息

RocketMQ4.x版本是通过TransactionMQProducer类的sendMessageInTransaction方法发送事务消息，并设置TransactionListener。

```java
public interface TransactionListener {
    LocalTransactionState executeLocalTransaction(final Message msg, final Object arg);
    LocalTransactionState checkLocalTransaction(final MessageExt msg);
}
```

executeLocalTransaction 是半事务消息发送成功后，执行本地事务的方法，具体执行完本地事务后，可以在该方法中返回以下三种状态：

```java
LocalTransactionState.COMMIT_MESSAGE：提交事务，允许消费者消费该消息
LocalTransactionState.ROLLBACK_MESSAGE：回滚事务，消息将被丢弃不允许消费。
LocalTransactionState.UNKNOW：暂时无法判断状态，等待固定时间以后Broker端根据回查规则向生产者进行消息回查。checkLocalTransaction回查本地事务状态决定是提交还是回滚。
```

checkLocalTransaction是由于二次确认消息没有收到，Broker端回查事务状态的方法。回查规则：本地事务执行完成后，若Broker端收到的本地事务返回状态为LocalTransactionState.UNKNOW，或生产者应用退出导致本地事务未提交任何状态。则Broker端会向消息生产者发起事务回查，第一次回查后仍未获取到事务状态，则之后每隔一段时间会再次回查。

修改生产者MqProducer，增加OldVersionTrsactionMqProducer

```java
@Slf4j
@Component
public class OldVersionTrsactionMqProducer implements InitializingBean, DisposableBean {
    private TransactionMQProducer transactionMQProducer;
    @Value("${rocketmq.namesrv}")
    private String namesrv;
    public SendResult sendTransactionMsg(Message msg, TransactionListener listener) throws InterruptedException, RemotingException, MQClientException, MQBrokerException {
        transactionMQProducer.setTransactionListener(listener);
        return   transactionMQProducer.sendMessageInTransaction(msg, null);
    }
    @Override
    public void destroy() throws Exception {
        if (transactionMQProducer != null) {
            transactionMQProducer.shutdown();
        }
    }
    @Override
    public void afterPropertiesSet() throws Exception {
        transactionMQProducer = new TransactionMQProducer("my-transaction-producer");
        transactionMQProducer.setNamesrvAddr(namesrv);
        transactionMQProducer.start();
    }
}
```

增加TransactionController：

```java
@Slf4j
@RestController
public class TransactionController {
    @Autowired
    private OldVersionTrsactionMqProducer producer;
    @RequestMapping("/sendTranMsg")
    public List<SendResult> sendTranMsg() throws InterruptedException, RemotingException, MQClientException, MQBrokerException {
        List<SendResult> list = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            Message msg =
                    new Message("MyTopic", "*", String.valueOf(i),
                            ("Hello RocketMQ,Transaction message  " + i).getBytes(StandardCharsets.UTF_8));
            SendResult sendResult = producer.sendTransactionMsg(msg, new TransactionListener() {
                @Override
                public LocalTransactionState executeLocalTransaction(Message message, Object o) {
                    log.info("executeLocalTransaction。。。执行本地事务");
                    String keys = message.getKeys();
                    int i1 = Integer.parseInt(keys);
                    if (i1 > 5) {
                        return LocalTransactionState.ROLLBACK_MESSAGE;
                    } else {
                        return LocalTransactionState.COMMIT_MESSAGE;
                    }
                }
                @Override
                public LocalTransactionState checkLocalTransaction(MessageExt messageExt) {
                    log.info("checkLocalTransaction。。。执行事务回查");
                    return LocalTransactionState.COMMIT_MESSAGE;
                }
            });
            list.add(sendResult);
            System.out.printf("%s%n", sendResult);
        }
        return list;
    }
}
```

executeLocalTransaction方法中判断消息的key是否大于5，若是则回滚，否则提交。

接下来修改消费者Mq-Consumer启用OldVersionConsumer类来消费。重启生产者，消费者后，调用http://localhost:8001/sendTranMsg发送事务消息。查看消费者控制台：

发现只有6条数据。

接下来看下事务消息是否支持延时消息或顺序消息。查看TransactionMQProducer类，没有发现有MessageQueueSelector类型的参数对应的方法，可知**事务消息不支持顺序消息**。修改OldVersionTrsactionMqProducer的sendTransactionMsg：

```java
 public SendResult sendTransactionMsg(Message msg, TransactionListener listener) throws InterruptedException, RemotingException, MQClientException, MQBrokerException {
    transactionMQProducer.setTransactionListener(listener);
    msg.setDelayTimeLevel(3);
    return   transactionMQProducer.sendMessageInTransaction(msg, null);
}
```

设置延时10秒，查看消费者的消费时间和发送时间，发现延时没有起效。所以**事务消息不支持延时消息**。

### RocketMQ5.0的事务消息

事务回查是在构造生产者时，用于检查确认异常半事务的中间状态。：

```java
 ClientServiceProvider clientServiceProvider = ClientServiceProvider.loadService();
    producer = clientServiceProvider.newProducerBuilder()
            .setClientConfiguration(new ClientConfigurationBuilder().setEndpoints(proxy).build())
            .setTransactionChecker(new TransactionChecker() {
                @Override
                public TransactionResolution check(MessageView messageView) {
                    log.info("check。。。。执行事务检查");
                    return TransactionResolution.COMMIT;
                }
            }).build();
```

TransactionChecker用于事务回查。TransactionChecker的check方法返回值TransactionResolution含义与LocalTransactionState相同。之后调用生产者开启事务：

```java
 Transaction transaction = null;
  try {
      transaction = producer.beginTransaction();
  } catch (ClientException e) {
      e.printStackTrace();
      continue;
  }
```

调用Transaction 进行提交或回滚。

首先新建存储事务消息类型的topic：

```java
mqadmin.cmd updatetopic -n localhost:9876 -t TranTopic -c DefaultCluster -a +message.type=TRANSACTION
```

-nlocalhost:9876指定namesrv地址，-t TranTopic指定topic名字是TranTopic，-c DefaultCluster指定集群是DefaultCluster，-a +message.type=TRANSACTION指定topic存储事务消息。

修改生产者MqProducer增加TranController：

```java
@Slf4j
@RestController
public class TranController implements InitializingBean, DisposableBean {
    private Producer producer;
    @Value("${rocketmq.proxy}")
    private String proxy;
    @Override
    public void destroy() throws Exception {
        if (producer != null) {
            producer.close();
        }
    }
    @Override
    public void afterPropertiesSet() throws Exception {
        ClientServiceProvider clientServiceProvider = ClientServiceProvider.loadService();
        producer = clientServiceProvider.newProducerBuilder()
                .setClientConfiguration(new ClientConfigurationBuilder().setEndpoints(proxy).build())
                .setTransactionChecker(new TransactionChecker() {
                    @Override
                    public TransactionResolution check(MessageView messageView) {
                        log.info("check。。。。执行事务检查");
                        return TransactionResolution.COMMIT;
                    }
                }).build();
    }
    @RequestMapping("/sengV5TranMsg")
    public List<SendReceipt> sengV5TranMsg() throws ClientException {
        MessageBuilder messageBuilder = new MessageBuilderImpl();
        List<SendReceipt> list = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            Transaction transaction = null;
            try {
                transaction = producer.beginTransaction();
            } catch (ClientException e) {
                e.printStackTrace();
                continue;
            }
            messageBuilder.setTopic("TranTopic")
                    .setBody(("Transaction Message " + i).getBytes(StandardCharsets.UTF_8));
            SendReceipt send = producer.send(messageBuilder.build(), transaction);
            list.add(send);
            // 执行本地事务
            log.info("执行本地事务");
            if (i > 7) {
                // 回滚
                transaction.rollback();
            } else {
                // 提交
                transaction.commit();
            }
        }
        return list;
    }
}
```

修改消费者订阅TranTopic topic，之后重启生产者和消费者。访问http://localhost:8001/sengV5TranMsg发送事务消息。查看消费者控制台：

### RocketMQ事务消息原理

**1、** 事务消息在一阶段对用户不可见；

在RocketMQ事务消息的主要流程中，一阶段的消息如何对用户不可见。其中，事务消息相对普通消息最大的特点就是一阶段发送的消息对用户是不可见的。那么，如何做到写入消息但是对用户不可见呢？RocketMQ事务消息的做法是：如果消息是half消息，将备份原消息的主题与消息消费队列，然后改变主题为RMQ_SYS_TRANS_HALF_TOPIC。由于消费组未订阅该主题，故消费端无法消费half类型的消息，然后RocketMQ会开启一个定时任务，从Topic为RMQ_SYS_TRANS_HALF_TOPIC中拉取消息进行消费，根据生产者组获取一个服务提供者发送回查事务状态请求，根据事务状态来决定是提交或回滚消息。

在RocketMQ中，消息在服务端的存储结构如下，每条消息都会有对应的索引信息，Consumer通过ConsumeQueue这个二级索引来读取消息实体内容，其流程如下：

RocketMQ的具体实现策略是：写入的如果事务消息，对消息的Topic和Queue等属性进行替换，同时将原来的Topic和Queue信息存储到消息的属性中，正因为消息主题被替换，故消息并不会转发到该原主题的消息消费队列，消费者无法感知消息的存在，不会消费。其实改变消息主题是RocketMQ的常用“套路”，回想一下延时消息的实现机制。

**2、** Commit和Rollback操作以及Op消息的引入；

在完成一阶段写入一条对用户不可见的消息后，二阶段如果是Commit操作，则需要让消息对用户可见；如果是Rollback则需要撤销一阶段的消息。先说Rollback的情况。对于Rollback，本身一阶段的消息对用户是不可见的，其实不需要真正撤销消息（实际上RocketMQ也无法去真正的删除一条消息，因为是顺序写文件的）。但是区别于这条消息没有确定状态（Pending状态，事务悬而未决），需要一个操作来标识这条消息的最终状态。RocketMQ事务消息方案中引入了Op消息的概念，用Op消息标识事务消息已经确定的状态（Commit或者Rollback）。如果一条事务消息没有对应的Op消息，说明这个事务的状态还无法确定（可能是二阶段失败了）。引入Op消息后，事务消息无论是Commit或者Rollback都会记录一个Op操作。Commit相对于Rollback只是在写入Op消息前创建Half消息的索引。

**3、** Op消息的存储和对应关系；

RocketMQ将Op消息写入到全局一个特定的Topic中通过源码中的方法—TransactionalMessageUtil.buildOpTopic()；这个Topic是一个内部的Topic（像Half消息的Topic一样），不会被用户消费。Op消息的内容为对应的Half消息的存储的Offset，这样通过Op消息能索引到Half消息进行后续的回查操作。

**4、** Half消息的索引构建；

在执行二阶段Commit操作时，需要构建出Half消息的索引。一阶段的Half消息由于是写到一个特殊的Topic，所以二阶段构建索引时需要读取出Half消息，并将Topic和Queue替换成真正的目标的Topic和Queue，之后通过一次普通消息的写入操作来生成一条对用户可见的消息。所以RocketMQ事务消息二阶段其实是利用了一阶段存储的消息的内容，在二阶段时恢复出一条完整的普通消息，然后走一遍消息写入流程。

**5、** 如何处理二阶段失败的消息？；

如果在RocketMQ事务消息的二阶段过程中失败了，例如在做Commit操作时，出现网络问题导致Commit失败，那么需要通过一定的策略使这条消息最终被Commit。RocketMQ采用了一种补偿机制，称为“回查”。Broker端对未确定状态的消息发起回查，将消息发送到对应的Producer端（同一个Group的Producer），由Producer根据消息来检查本地事务的状态，进而执行Commit或者Rollback。Broker端通过对比Half消息和Op消息进行事务消息的回查并且推进CheckPoint（记录那些事务消息的状态是确定的）。

值得注意的是，rocketmq并不会无休止的的信息事务状态回查，默认回查15次，如果15次回查还是无法得知事务状态，rocketmq默认回滚该消息。

接下看看是否支持延时消息和顺序消息。修改TranController的sengV5TranMsg方法：

```java
      messageBuilder.setTopic("TranTopic")
                .setBody(("Transaction Message " + i).getBytes(StandardCharsets.UTF_8))
        .setDeliveryTimestamp(System.currentTimeMillis() + 10 * 1000);
```

重启后发现：

```java
java.lang.IllegalArgumentException: Transactional message should not set messageGroup or deliveryTimestamp
```

RocketMQ5.0的事务消息不支持延时消息和顺序消息。

### 使用限制

- 不支持延时消息和顺序消息
- 消息类型一致性（RocketMQ5.0）

事务消息仅支持在 MessageType 为 Transaction 的主题内使用，即事务消息只能发送至类型为事务消息的主题中，发送的消息的类型必须和主题的类型一致。

- 消费事务性

Apache RocketMQ 事务消息保证本地主分支事务和下游消息发送事务的一致性，但不保证消息消费结果和上游事务的一致性。因此需要下游业务分支自行保证消息正确处理，建议消费端做好消费重试，如果有短暂失败可以利用重试机制保证最终处理成功。

- 中间状态可见性

Apache RocketMQ 事务消息为最终一致性，即在消息提交到下游消费端处理完成之前，下游分支和上游事务之间的状态会不一致。因此，事务消息仅适合接受异步执行的事务场景。

- 事务超时机制

Apache RocketMQ 事务消息的命周期存在超时机制，即半事务消息被生产者发送服务端后，如果在指定时间内服务端无法确认提交或者回滚状态，则消息默认会被回滚。
