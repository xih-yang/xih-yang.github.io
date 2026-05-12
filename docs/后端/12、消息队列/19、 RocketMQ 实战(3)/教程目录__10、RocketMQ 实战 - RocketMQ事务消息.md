# 10、RocketMQ 实战 - RocketMQ事务消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/7/10.html
- 分类：消息队列
- 分组：教程目录
## 一、RocketMQ事务消息概要

RocketMQ事务消息（Transactional Message）是指应用本地事务和发送消息操作可以被定义到全局事务中，要么同时成功，要么同时失败。RocketMQ的事务消息提供类似 X/Open XA 的分布式事务功能，**通过事务消息能达到分布式事务的最终一致**。

Apache RocketMQ在4.3.0版中已经支持分布式事务消息，采用了**2PC（两阶段提交）+ 补偿机制（事务状态回查）** 的思想来实现了提交事务消息，同时增加一个补偿逻辑来处理二阶段超时或者失败的消息，如下图所示。

我们可以看到，事务消息主要分为两个流程：

- 1、正常事务消息的发送及提交

a、生产者发送half消息到Broker服务端（半消息）；

> 半消息是一种特殊的消息类型，该状态的消息暂时不能被Consumer消费。当一条事务消息被成功投递到Broker上，但是Broker并没有接收到Producer发出的二次确认时，该事务消息就处于"暂时不可被消费"状态，该状态的事务消息被称为半消息。

b、Broker服务端将消息持久化之后，给生产者响应消息写入结果（ACK响应）；

c、生产者根据发送结果执行本地事务逻辑（如果写入失败，此时half消息对业务不可见，本地逻辑不执行）；

d、生产者根据本地事务执行结果向Broker服务端提交二次确认（Commit 或是 Rollback），Broker服务端收到 Commit 状态则将半事务消息标记为可投递，订阅方最终将收到该消息；Broker服务端收到 Rollback 状态则删除半事务消息，订阅方将不会接收该消息；

- 2、事务消息的补偿流程

a、在网络闪断或者是应用重启的情况下，可能导致生产者发送的二次确认消息未能到达Broker服务端，经过固定时间后，Broker服务端将会对没有Commit/Rollback的事务消息（pending状态的消息）进行“回查”；

b、生产者收到回查消息后，检查回查消息对应的本地事务执行的最终结果；

c、生产者根据本地事务状态，再次提交二次确认给Broker，然后Broker重新对半事务消息Commit或者Rollback；

> 其中，补偿阶段用于解决消息Commit或者Rollback发生超时或者失败的情况。

事务消息共有三种状态，提交状态、回滚状态、中间状态：

- TransactionStatus.CommitTransaction：提交事务，它允许消费者消费此消息。
- TransactionStatus.RollbackTransaction：回滚事务，它代表该消息将被删除，不允许被消费。
- TransactionStatus.Unknown：中间状态，它代表需要回查本地事务状态来决定是提交还是回滚事务。

下面我们通过示例演示如何使用RocketMQ的事务消息。

## 二、RocketMQ事务消息使用案例

- 1、定义消息监听器

消息监听器主要是实现TransactionListener接口，然后需要重写下面两个方法：

- **executeLocalTransaction：执行本地事务；**
- **checkLocalTransaction：回查本地事务状态，根据这次回查的结果来决定此次事务是提交还是回滚；**

```java
/**
 * 事务监听器，重写执行本地事务方法以及事务回查方法
 */
public class TransactionListenerImpl implements TransactionListener {
    @Override
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        String msgKey = msg.getKeys();
        switch (msgKey) {
            case "Num0":
            case "Num1":
                // 明确回复回滚操作，消息将会被删除，不允许被消费。
                return LocalTransactionState.ROLLBACK_MESSAGE;
            case "Num8":
            case "Num9":
                // 消息无响应,代表需要回查本地事务状态来决定是提交还是回滚事务
                return LocalTransactionState.UNKNOW;
            default:
                // 消息通过，允许消费者消费消息
                return LocalTransactionState.COMMIT_MESSAGE;
        }
    }
    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        System.out.println("回查本地事务状态,消息Key: " + msg.getKeys() + ",消息内容: " + new String(msg.getBody()));
        // 需要根据业务，查询本地事务是否执行成功，这里直接返回COMMIT
        return LocalTransactionState.COMMIT_MESSAGE;
    }
}
```

- 2、定义消息生产者

事务消息的生产者跟我们之前的普通生产者的不同：

- **a、需创建事务类型的生产者TransactionMQProducer；**
- **b、需调用setTransactionListener()方法设置事务监听器；**
- **c、使用sendMessageInTransaction()以事务方式发送消息；**

```java
public class TransactionProducer {
    public static void main(String[] args) throws MQClientException, InterruptedException {
        // 创建事务类型的生产者
        TransactionMQProducer producer = new TransactionMQProducer("transaction-producer-group");
        // 设置NameServer的地址
        producer.setNamesrvAddr("10.0.90.211:9876");
        // 设置事务监听器
        producer.setTransactionListener(new TransactionListenerImpl());
        // 启动生产者
        producer.start();
        // 发送10条消息
        for (int i = 0; i < 10; i++) {
            try {
                Message msg = new Message("TransactionTopic", "", ("Hello RocketMQ Transaction Message" + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
                // 设置消息Key
                msg.setKeys("Num" + i);
                // 使用事务方式发送消息
                SendResult sendResult = producer.sendMessageInTransaction(msg, null);
                System.out.println("sendResult = " + sendResult);
                Thread.sleep(10);
            } catch (MQClientException | UnsupportedEncodingException e) {
                e.printStackTrace();
            }
        }
        // 阻塞，目的是为了在消息发送完成后才关闭生产者
        Thread.sleep(10000);
        producer.shutdown();
    }
}
```

- 3、定义消息消费者

```java
public class MQConsumer {
    public static void main(String[] args) throws MQClientException {
        // 创建DefaultMQPushConsumer类并设定消费者名称
        DefaultMQPushConsumer mqPushConsumer = new DefaultMQPushConsumer("consumer-group-test");
        // 设置NameServer地址，如果是集群的话，使用分号;分隔开
        mqPushConsumer.setNamesrvAddr("10.0.90.211:9876");
        // 设置Consumer第一次启动是从队列头部开始消费还是队列尾部开始消费
        // 如果不是第一次启动，那么按照上次消费的位置继续消费
        mqPushConsumer.setConsumeFromWhere(ConsumeFromWhere.CONSUME_FROM_LAST_OFFSET);
        // 订阅一个或者多个Topic，以及Tag来过滤需要消费的消息，如果订阅该主题下的所有tag，则使用*
        mqPushConsumer.subscribe("TransactionTopic", "*");
        // 注册回调实现类来处理从broker拉取回来的消息
        mqPushConsumer.registerMessageListener(new MessageListenerConcurrently() {
            // 监听类实现MessageListenerConcurrently接口即可，重写consumeMessage方法接收数据
            @Override
            public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgList, ConsumeConcurrentlyContext consumeConcurrentlyContext) {
                MessageExt messageExt = msgList.get(0);
                String body = new String(messageExt.getBody(), StandardCharsets.UTF_8);
                System.out.println("消费者接收到消息: " + messageExt.toString() + "---消息内容为：" + body);
                // 标记该消息已经被成功消费
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        });
        // 启动消费者实例
        mqPushConsumer.start();
    }
}
```

- 4、观察生产者控制台输出

通过控制台可以看到，生产者成功发送10条消息，并且我们在事务监听器中针对message key为Num8、Num9这两条消息返回UNKNOW状态，这样RocketMQ就会执行本地事务回查去确认本地事务执行状态【即执行checkLocalTransaction()方法】。

```java
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E00564F4018B4AAC231C40E0E0000, offsetMsgId=null, messageQueue=MessageQueue [topic=TransactionTopic, brokerName=broker-a, queueId=2], queueOffset=9]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E00564F4018B4AAC231C40E300001, offsetMsgId=null, messageQueue=MessageQueue [topic=TransactionTopic, brokerName=broker-a, queueId=3], queueOffset=10]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E00564F4018B4AAC231C40E400002, offsetMsgId=null, messageQueue=MessageQueue [topic=TransactionTopic, brokerName=broker-a, queueId=0], queueOffset=11]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E00564F4018B4AAC231C40E650003, offsetMsgId=null, messageQueue=MessageQueue [topic=TransactionTopic, brokerName=broker-a, queueId=1], queueOffset=12]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E00564F4018B4AAC231C40E780004, offsetMsgId=null, messageQueue=MessageQueue [topic=TransactionTopic, brokerName=broker-a, queueId=2], queueOffset=13]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E00564F4018B4AAC231C40E880005, offsetMsgId=null, messageQueue=MessageQueue [topic=TransactionTopic, brokerName=broker-a, queueId=3], queueOffset=14]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E00564F4018B4AAC231C40E990006, offsetMsgId=null, messageQueue=MessageQueue [topic=TransactionTopic, brokerName=broker-a, queueId=0], queueOffset=15]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E00564F4018B4AAC231C40EB20007, offsetMsgId=null, messageQueue=MessageQueue [topic=TransactionTopic, brokerName=broker-a, queueId=1], queueOffset=16]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E00564F4018B4AAC231C40EC30008, offsetMsgId=null, messageQueue=MessageQueue [topic=TransactionTopic, brokerName=broker-a, queueId=2], queueOffset=17]
sendResult = SendResult [sendStatus=SEND_OK, msgId=AC6E00564F4018B4AAC231C40EE30009, offsetMsgId=null, messageQueue=MessageQueue [topic=TransactionTopic, brokerName=broker-a, queueId=3], queueOffset=18]
回查本地事务状态,消息Key: Num8,消息内容: Hello RocketMQ Transaction Message8
回查本地事务状态,消息Key: Num9,消息内容: Hello RocketMQ Transaction Message9
```

- 5、观察消费者控制台输出

可以看到，消费者成功接收到8条消息，因为有2条消息，我们在执行本地事务的时候，明确告诉RocketMQ进行回滚了，所以这2条消息不能被消费者进行消费。

```java
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=313, queueOffset=1, sysFlag=8, bornTimestamp=1646898932288, bornHost=/10.0.90.139:57933, storeTimestamp=1646898931728, storeHost=/10.0.90.211:10911, msgId=0A005AD300002A9F0000000000004398, commitLogOffset=17304, bodyCRC=1033347556, reconsumeTimes=0, preparedTransactionOffset=16983, toString()=Message{topic='TransactionTopic', flag=0, properties={MIN_OFFSET=0, REAL_TOPIC=TransactionTopic, MAX_OFFSET=2, KEYS=Num2, TRAN_MSG=true, CONSUME_START_TIME=1646898932329, UNIQ_KEY=AC6E00564F4018B4AAC231C40E400002, CLUSTER=DefaultCluster, PGROUP=transaction-producer-group, WAIT=true, REAL_QID=0}, body=[72, 101, 108, 108, 111, 32, 82, 111, 99, 107, 101, 116, 77, 81, 32, 84, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 32, 77, 101, 115, 115, 97, 103, 101, 50], transactionId='AC6E00564F4018B4AAC231C40E400002'}]---消息内容为：Hello RocketMQ Transaction Message2
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=313, queueOffset=1, sysFlag=8, bornTimestamp=1646898932325, bornHost=/10.0.90.139:57933, storeTimestamp=1646898931741, storeHost=/10.0.90.211:10911, msgId=0A005AD300002A9F000000000000469A, commitLogOffset=18074, bodyCRC=1250988402, reconsumeTimes=0, preparedTransactionOffset=17753, toString()=Message{topic='TransactionTopic', flag=0, properties={MIN_OFFSET=0, REAL_TOPIC=TransactionTopic, MAX_OFFSET=2, KEYS=Num3, TRAN_MSG=true, CONSUME_START_TIME=1646898932341, UNIQ_KEY=AC6E00564F4018B4AAC231C40E650003, CLUSTER=DefaultCluster, PGROUP=transaction-producer-group, WAIT=true, REAL_QID=1}, body=[72, 101, 108, 108, 111, 32, 82, 111, 99, 107, 101, 116, 77, 81, 32, 84, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 32, 77, 101, 115, 115, 97, 103, 101, 51], transactionId='AC6E00564F4018B4AAC231C40E650003'}]---消息内容为：Hello RocketMQ Transaction Message3
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=2, storeSize=313, queueOffset=2, sysFlag=8, bornTimestamp=1646898932344, bornHost=/10.0.90.139:57933, storeTimestamp=1646898931758, storeHost=/10.0.90.211:10911, msgId=0A005AD300002A9F000000000000499C, commitLogOffset=18844, bodyCRC=1425278161, reconsumeTimes=0, preparedTransactionOffset=18523, toString()=Message{topic='TransactionTopic', flag=0, properties={MIN_OFFSET=0, REAL_TOPIC=TransactionTopic, MAX_OFFSET=3, KEYS=Num4, TRAN_MSG=true, CONSUME_START_TIME=1646898932359, UNIQ_KEY=AC6E00564F4018B4AAC231C40E780004, CLUSTER=DefaultCluster, PGROUP=transaction-producer-group, WAIT=true, REAL_QID=2}, body=[72, 101, 108, 108, 111, 32, 82, 111, 99, 107, 101, 116, 77, 81, 32, 84, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 32, 77, 101, 115, 115, 97, 103, 101, 52], transactionId='AC6E00564F4018B4AAC231C40E780004'}]---消息内容为：Hello RocketMQ Transaction Message4
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=3, storeSize=313, queueOffset=2, sysFlag=8, bornTimestamp=1646898932360, bornHost=/10.0.90.139:57933, storeTimestamp=1646898931774, storeHost=/10.0.90.211:10911, msgId=0A005AD300002A9F0000000000004C9E, commitLogOffset=19614, bodyCRC=603141191, reconsumeTimes=0, preparedTransactionOffset=19293, toString()=Message{topic='TransactionTopic', flag=0, properties={MIN_OFFSET=0, REAL_TOPIC=TransactionTopic, MAX_OFFSET=3, KEYS=Num5, TRAN_MSG=true, CONSUME_START_TIME=1646898932375, UNIQ_KEY=AC6E00564F4018B4AAC231C40E880005, CLUSTER=DefaultCluster, PGROUP=transaction-producer-group, WAIT=true, REAL_QID=3}, body=[72, 101, 108, 108, 111, 32, 82, 111, 99, 107, 101, 116, 77, 81, 32, 84, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 32, 77, 101, 115, 115, 97, 103, 101, 53], transactionId='AC6E00564F4018B4AAC231C40E880005'}]---消息内容为：Hello RocketMQ Transaction Message5
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=313, queueOffset=2, sysFlag=8, bornTimestamp=1646898932377, bornHost=/10.0.90.139:57933, storeTimestamp=1646898931801, storeHost=/10.0.90.211:10911, msgId=0A005AD300002A9F0000000000004FA0, commitLogOffset=20384, bodyCRC=989488637, reconsumeTimes=0, preparedTransactionOffset=20063, toString()=Message{topic='TransactionTopic', flag=0, properties={MIN_OFFSET=0, REAL_TOPIC=TransactionTopic, MAX_OFFSET=3, KEYS=Num6, TRAN_MSG=true, CONSUME_START_TIME=1646898932402, UNIQ_KEY=AC6E00564F4018B4AAC231C40E990006, CLUSTER=DefaultCluster, PGROUP=transaction-producer-group, WAIT=true, REAL_QID=0}, body=[72, 101, 108, 108, 111, 32, 82, 111, 99, 107, 101, 116, 77, 81, 32, 84, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 32, 77, 101, 115, 115, 97, 103, 101, 54], transactionId='AC6E00564F4018B4AAC231C40E990006'}]---消息内容为：Hello RocketMQ Transaction Message6
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=313, queueOffset=2, sysFlag=8, bornTimestamp=1646898932402, bornHost=/10.0.90.139:57933, storeTimestamp=1646898931816, storeHost=/10.0.90.211:10911, msgId=0A005AD300002A9F00000000000052A2, commitLogOffset=21154, bodyCRC=1308448107, reconsumeTimes=0, preparedTransactionOffset=20833, toString()=Message{topic='TransactionTopic', flag=0, properties={MIN_OFFSET=0, REAL_TOPIC=TransactionTopic, MAX_OFFSET=3, KEYS=Num7, TRAN_MSG=true, CONSUME_START_TIME=1646898932441, UNIQ_KEY=AC6E00564F4018B4AAC231C40EB20007, CLUSTER=DefaultCluster, PGROUP=transaction-producer-group, WAIT=true, REAL_QID=1}, body=[72, 101, 108, 108, 111, 32, 82, 111, 99, 107, 101, 116, 77, 81, 32, 84, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 32, 77, 101, 115, 115, 97, 103, 101, 55], transactionId='AC6E00564F4018B4AAC231C40EB20007'}]---消息内容为：Hello RocketMQ Transaction Message7
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=1, storeSize=339, queueOffset=3, sysFlag=8, bornTimestamp=1646898900749, bornHost=/10.0.90.139:57878, storeTimestamp=1646898935220, storeHost=/10.0.90.211:10911, msgId=0A005AD300002A9F000000000000599B, commitLogOffset=22939, bodyCRC=709195884, reconsumeTimes=0, preparedTransactionOffset=22592, toString()=Message{topic='TransactionTopic', flag=0, properties={MIN_OFFSET=0, REAL_TOPIC=TransactionTopic, TRANSACTION_CHECK_TIMES=1, MAX_OFFSET=4, KEYS=Num9, TRAN_MSG=true, CONSUME_START_TIME=1646898935835, UNIQ_KEY=AC6E00563BCC18B4AAC231C3930D0009, CLUSTER=DefaultCluster, PGROUP=transaction-producer-group, WAIT=true, REAL_QID=1}, body=[72, 101, 108, 108, 111, 32, 82, 111, 99, 107, 101, 116, 77, 81, 32, 84, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 32, 77, 101, 115, 115, 97, 103, 101, 57], transactionId='AC6E00563BCC18B4AAC231C3930D0009'}]---消息内容为：Hello RocketMQ Transaction Message9
消费者接收到消息: MessageExt [brokerName=broker-a, queueId=0, storeSize=339, queueOffset=3, sysFlag=8, bornTimestamp=1646898900727, bornHost=/10.0.90.139:57878, storeTimestamp=1646898935223, storeHost=/10.0.90.211:10911, msgId=0A005AD300002A9F0000000000005B76, commitLogOffset=23414, bodyCRC=1564625146, reconsumeTimes=0, preparedTransactionOffset=22245, toString()=Message{topic='TransactionTopic', flag=0, properties={MIN_OFFSET=0, REAL_TOPIC=TransactionTopic, TRANSACTION_CHECK_TIMES=1, MAX_OFFSET=4, KEYS=Num8, TRAN_MSG=true, CONSUME_START_TIME=1646898935839, UNIQ_KEY=AC6E00563BCC18B4AAC231C392F70008, CLUSTER=DefaultCluster, PGROUP=transaction-producer-group, WAIT=true, REAL_QID=0}, body=[72, 101, 108, 108, 111, 32, 82, 111, 99, 107, 101, 116, 77, 81, 32, 84, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 32, 77, 101, 115, 115, 97, 103, 101, 56], transactionId='AC6E00563BCC18B4AAC231C392F70008'}]---消息内容为：Hello RocketMQ Transaction Message8
```

## 三、RocketMQ事务消息原理

- 设计思想

在RocketMQ事务消息的主要流程中，一阶段的消息如何对用户不可见。其中，事务消息相对普通消息最大的特点就是**一阶段发送的消息对用户是不可见的**。那么，如何做到写入消息但是对用户不可见呢？RocketMQ事务消息的做法是：**如果消息是half消息，将备份原消息的主题与消息消费队列，然后改变主题为RMQ_SYS_TRANS_HALF_TOPIC。由于消费组未订阅该主题，故消费端无法消费half类型的消息。**

- 如何实现事务回查？

Broker会**启动一个消息回查的定时任务，定时从事务消息queue中读取所有待反查的消息**。针对每个需要反查的半消息，Broker会给对应的Producer发一个要求执行事务状态反查的RPC请求。然后根据RPC返回响应中的反查结果，来决定这个半消息是需要提交还是回滚，或者后续继续来反查。最后，提交或者回滚事务，将半消息标记为已处理状态【将消息存储在主题为：RMQ_SYS_TRANS_OP_HALF_TOPIC的主题中，代表这些消息已经被处理（提交或回滚）】。 **如果是提交事务，就把半消息从半消息队列中复制到该消息真正的topic和queue中； 如果是回滚事务，则什么都不做。**

> 值得注意的是，rocketmq并不会无休止的的信息事务状态回查，默认回查15次，如果15次回查还是无法得知事务状态，rocketmq默认回滚该消息。

## 四、RocketMQ事务消息使用限制

使用事务消息，有一些限制条件：

**1、****事务消息不支持延时消息和批量消息；**；

**2、** 事务性消息可能不止一次被检查或消费，所以消费者端需要做好消费幂等；

**3、** 为了避免单个消息被检查太多次而导致半队列消息累积，我们默认将单个消息的检查次数限制为15次（即**默认只会回查15次**），我们可以通过Broker配置文件的`transactionCheckMax`参数来修改此限制如果已经检查某条消息超过N次的话（N=`transactionCheckMax`），则Broker将丢弃此消息，并在默认情况下同时打印错误日志用户可以通过重写`AbstractTransactionCheckListener`类来修改这个行为；

**4、** 事务消息将在Broker配置文件中的参数transactionMsgTimeout这样的特定时间长度之后被检查当发送事务消息时，用户还可以通过设置用户属性CHECK_IMMUNITY_TIME_IN_SECONDS来改变这个限制，该参数优先于`transactionMsgTimeout`参数；

**5、** 提交给用户的目标主题消息可能会失败，目前这依日志的记录而定它的高可用性通过RocketMQ本身的高可用性机制来保证，如果希望确保事务消息不丢失、并且事务完整性得到保证，建议使用同步的双重写入机制；

**6、** 事务消息的生产者ID不能与其他类型消息的生产者ID共享与其他类型的消息不同，事务消息允许反向查询、MQ服务器能通过它们的生产者ID查询到消费者；
