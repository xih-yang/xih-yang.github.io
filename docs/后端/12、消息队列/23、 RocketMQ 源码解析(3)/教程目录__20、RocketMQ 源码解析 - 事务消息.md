# 20、RocketMQ 源码解析 - 事务消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/20.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## 简介

**1、** 事务消息流程；

- 应用程序事务发起者发送事务Prepare消息到MQ的broker端，发送成功后，Broker会回调事务监听器的本地事务执行方法执行本地事务
- RocketMQ的broker收到Prepare消息后，先对消息的topic与消费队列进行备份，然后存储到主题为 **RMQ_SYS_TRANS_HALF_TOPIC** 的队列中（只有一个队列）
- broker端启动时会启动一个定时任务，取出**RMQ_SYS_TRANS_HALF_TOPIC**中的消息向消息的发送者（生产组中的任意一个Producer）发起回查。发送端根据本地事务的具体执行状态返回**提交/回滚/事务未知**状态
- 如果返回**提交/回滚**则broker对事务消息进行提交或者回滚
- 如果返回了未知，则等待下次继续进行回查。达到回查最大次数依旧无法获取事务状态的消息，broker会对该事务消息做回滚操作。
- 如果是提交事务，将事务消息恢复，写入到原始的Topic中，然后向**RMQ_SYS_TRANS_OP_HALF_TOPIC**的队列中写入一条消息。消息体就是当前这条事务消息的队列偏移值
- 如果是回滚事务，只是向**RMQ_SYS_TRANS_OP_HALF_TOPIC**的队列中写入一条消息。消息体就是当前这条事务消息的队列偏移值

**2、** 整体的交互过程；

**3、** 为什么要采用额外的两个Topic来实现事务消息呢？；

- 为了让消费端不能消费Prepare消息，将Prepare消息先写入到**RMQ_SYS_TRANS_HALF_TOPIC**的队列中。这样的好处就是服务端处理发送事务Prepare消息的逻辑与普通消息的逻辑没什么区别，可以直接复用，只是额外做一下判断即可
- RocketMQ所有的消息都是追加的方式写入到文件中，无论是提交或者回滚我们都不能直接修改或者删除原来的Prepare消息。这样会导致很多的脏页，严重影响性能。所以删除和修改就是向另一个**RMQ_SYS_TRANS_HALF_TOPIC**的队列里写入一条消息。这样当事务回查时，先从此队列中查询，如果找不到，说明是未知状态，此时需要再次回查
- 以上这样做的缺点就是：所有消息都写入**RMQ_SYS_TRANS_HALF_TOPIC**队列，如果事务消息较多可能有瓶颈。并且消息会被存储多次

**4、** 如果回查次数达到最大值或者文件已经过期，当前版本只是打印日志如果Broker发现消息是未知状态，当再次处理时会重新追加这条消息；

## 发送事务消息

**1、** 发送事务消息使用`TransactionMQProducer`，此类继承`DefaultMQProducer`委托`DefaultMQProducerImpl`执行发送逻辑；

```java
@Override
public TransactionSendResult sendMessageInTransaction(final Message msg,
    final Object arg) throws MQClientException {
    if (null == this.transactionListener) {
        throw new MQClientException("TransactionListener is null", null);
    }
    return this.defaultMQProducerImpl.sendMessageInTransaction(msg, null, arg);
}
```

1. DefaultMQProducerImpl#sendMessageInTransaction是发送的核心方法。主要逻辑

- 校验事务监听器和消息相关配置（消息、topic、消息大小等）
- 设置消息的事务属性，表示这是一个事务prepare消息。设置生产者组。用于回查本地事务，从生产者组中选择随机选择一个生产者。避免由于生产者挂掉导致一直回查失败
- 发送prepare消息，返回成功结果后（`SEND_OK`）才执行本地回调事务监听器transactionListener。如果发送发生异常，则不会执行本地事务监听器
- 发送本地处理结果给Broker，Broker根据状态回滚或者提交

```java
public TransactionSendResult sendMessageInTransaction(final Message msg,
                                                      final LocalTransactionExecuter localTransactionExecuter, final Object arg)
    throws MQClientException {
    // 校验是否配置事务监听器
    TransactionListener transactionListener = getCheckListener();
    if (null == localTransactionExecuter && null == transactionListener) {
        throw new MQClientException("tranExecutor is null", null);
    }
    Validators.checkMessage(msg, this.defaultMQProducer);
    SendResult sendResult = null;
    //设置属性，表示这是一个Prepare消息
    MessageAccessor.putProperty(msg, MessageConst.PROPERTY_TRANSACTION_PREPARED, "true");
  	//设置生产者组。用于回查本地事务，从生产者组中选择随机选择一个生产者。避免由于生产者挂掉导致一直回查失败
    MessageAccessor.putProperty(msg, MessageConst.PROPERTY_PRODUCER_GROUP, this.defaultMQProducer.getProducerGroup());
    try {
        sendResult = this.send(msg);
    } catch (Exception e) {
        throw new MQClientException("send message Exception", e);
    }
    LocalTransactionState localTransactionState = LocalTransactionState.UNKNOW;
    Throwable localException = null;
    switch (sendResult.getSendStatus()) {
        case SEND_OK: {
            try {
                // 事务ID
                if (sendResult.getTransactionId() != null) {
                    msg.putUserProperty("__transactionId__", sendResult.getTransactionId());
                }
                //UNIQ_KEY，客户端发送时生成的唯一ID
                String transactionId = msg.getProperty(MessageConst.PROPERTY_UNIQ_CLIENT_MESSAGE_ID_KEYIDX);
                if (null != transactionId && !"".equals(transactionId)) {
                    msg.setTransactionId(transactionId);
                }
                // 执行本地配合的transactionListener逻辑。localTransactionExecuter已经过时
                if (null != localTransactionExecuter) {
                    localTransactionState = localTransactionExecuter.executeLocalTransactionBranch(msg, arg);
                } else if (transactionListener != null) {
                    log.debug("Used new transaction API");
                    //如果这个执行出现异常可能导致localTransactionState默认就是UNKNOW，如果返回null，则需要赋值一个默认值UNKNOW
                    localTransactionState = transactionListener.executeLocalTransaction(msg, arg);
                }
                if (null == localTransactionState) {
                    localTransactionState = LocalTransactionState.UNKNOW;
                }
                if (localTransactionState != LocalTransactionState.COMMIT_MESSAGE) {
                    log.info("executeLocalTransactionBranch return {}", localTransactionState);
                    log.info(msg.toString());
                }
            } catch (Throwable e) {
                log.info("executeLocalTransactionBranch exception", e);
                log.info(msg.toString());
                localException = e;
            }
        }
        break;
        // 未发送成功，设置回滚状态
        case FLUSH_DISK_TIMEOUT:
        case FLUSH_SLAVE_TIMEOUT:
        case SLAVE_NOT_AVAILABLE:
            localTransactionState = LocalTransactionState.ROLLBACK_MESSAGE;
            break;
        default:
            break;
    }
    try {
        // 发送本地处理结果给Broker
        this.endTransaction(sendResult, localTransactionState, localException);
    } catch (Exception e) {
        log.warn("local transaction execute " + localTransactionState + ", but end broker transaction failed", e);
    }
    TransactionSendResult transactionSendResult = new TransactionSendResult();
    transactionSendResult.setSendStatus(sendResult.getSendStatus());
    transactionSendResult.setMessageQueue(sendResult.getMessageQueue());
    transactionSendResult.setMsgId(sendResult.getMsgId());
    transactionSendResult.setQueueOffset(sendResult.getQueueOffset());
    transactionSendResult.setTransactionId(sendResult.getTransactionId());
    transactionSendResult.setLocalTransactionState(localTransactionState);
    return transactionSendResult;
}
```

1. DefaultMQProducerImpl#endTransaction发送本地处理结果给Broker，本地处理结果会做转换

- 如果`localTransactionState==COMMIT_MESSAGE`，设置为`MessageSysFlag.TRANSACTION_COMMIT_TYPE( 0x2

新的实现方式：更改原有的Topic，只有Commit消息后才会将其发送到原始的Topic下，这样就保证没有Commit前，Consumer无法消费

1. 查看CommitLog.DefaultAppendMessageCallback#doAppend是事务消息相关的判断。由于前面将Topic换成事务的Topic，并且将事务的标记去掉了，所以这里标记永远是**TRANSACTION_NOT_TYPE**。之所以有这个逻辑，我猜测是之前的事务实现方式（没有更改Topic的方式）

```java
public AppendMessageResult doAppend(final long fileFromOffset, final ByteBuffer byteBuffer, final int maxBlank,final MessageExtBrokerInner msgInner) {
    ...省略...
    // Record ConsumeQueue information
    keyBuilder.setLength(0);
    keyBuilder.append(msgInner.getTopic());
    keyBuilder.append('-');
    keyBuilder.append(msgInner.getQueueId());
    String key = keyBuilder.toString();
    Long queueOffset = CommitLog.this.topicQueueTable.get(key);
    if (null == queueOffset) {
        queueOffset = 0L;
        CommitLog.this.topicQueueTable.put(key, queueOffset);
    }
    //事务消息Prepare和Rollback消息，队列偏移量都设置的是0
    final int tranType = MessageSysFlag.getTransactionValue(msgInner.getSysFlag());
    switch (tranType) {
        // Prepared and Rollback message is not consumed, will not enter the
        // consumer queuec
        case MessageSysFlag.TRANSACTION_PREPARED_TYPE:
        case MessageSysFlag.TRANSACTION_ROLLBACK_TYPE:
            queueOffset = 0L;
            break;
        case MessageSysFlag.TRANSACTION_NOT_TYPE:
        case MessageSysFlag.TRANSACTION_COMMIT_TYPE:
        default:
            break;
    }
    ...省略...
    // 只有事务TRANSACTION_COMMIT_TYPE消息和TRANSACTION_NOT_TYPE才会设置队列偏移量
    switch (tranType) {
        case MessageSysFlag.TRANSACTION_PREPARED_TYPE:
        case MessageSysFlag.TRANSACTION_ROLLBACK_TYPE:
            break;
        case MessageSysFlag.TRANSACTION_NOT_TYPE:
        case MessageSysFlag.TRANSACTION_COMMIT_TYPE:
            // The next update ConsumeQueue information
            CommitLog.this.topicQueueTable.put(key, ++queueOffset);
            break;
        default:
            break;
    }
    return result;
}
```

1. 查看DefaultMessageStore.CommitLogDispatcherBuildConsumeQueue#dispatch是异步构造ConsumeQueue的地方。这里可以看到，如果是Prepare和Rollback消息，并不会构造。这样Consumer也就无法消费了

```java
class CommitLogDispatcherBuildConsumeQueue implements CommitLogDispatcher {
    @Override
    public void dispatch(DispatchRequest request) {
        final int tranType = MessageSysFlag.getTransactionValue(request.getSysFlag());
        switch (tranType) {
            case MessageSysFlag.TRANSACTION_NOT_TYPE:
            case MessageSysFlag.TRANSACTION_COMMIT_TYPE:
                DefaultMessageStore.this.putMessagePositionInfo(request);
                break;
            // 对于prepare和rollback消息不会构造ConsumeQueue
            case MessageSysFlag.TRANSACTION_PREPARED_TYPE:
            case MessageSysFlag.TRANSACTION_ROLLBACK_TYPE:
                break;
        }
    }
}
```

## Broker处理提交/回滚消息

1. Producer发送本地结果给Broker，调用RequestCode.END_TRANSACTION命令，此命令在broker端是通过EndTransactionProcessor来进行处理的。EndTransactionProcessor#processRequest处理逻辑如下

- 只有Master节点可以处理，打印相关日志。只有提交或者回滚的消息才会向下执行
- 如果是回滚消息，根据偏移量从**RMQ_SYS_TRANS_HALF_TOPIC**查询出提交的消息，并检查Prepare消息的正确性。删除回滚消息（其实就是向RMQ_SYS_TRANS_OP_HALF_TOPIC主题写入消息，tag是d），标识此消息已经被删除
- 如果是提交消息，根据偏移量从**RMQ_SYS_TRANS_HALF_TOPIC**查询出提交的消息，并检查Prepare消息的正确性。恢复原始消息，包括恢复原始Topic、Queue等，并且清除事务属性，并且将原始消息存储到CommitLog中，存储成功时删除prepare消息（其实就是向RMQ_SYS_TRANS_OP_HALF_TOPIC主题写入消息，tag是d），标识此消息已经被删除

1. EndTransactionProcessor#processRequest源码

```java
@Override
public RemotingCommand processRequest(ChannelHandlerContext ctx, RemotingCommand request) throws
    RemotingCommandException {
    final RemotingCommand response = RemotingCommand.createResponseCommand(null);
    final EndTransactionRequestHeader requestHeader =
        (EndTransactionRequestHeader)request.decodeCommandCustomHeader(EndTransactionRequestHeader.class);
    LOGGER.info("Transaction request:{}", requestHeader);
    // 从节点不允许处理事务消息
    if (BrokerRole.SLAVE == brokerController.getMessageStoreConfig().getBrokerRole()) {
        response.setCode(ResponseCode.SLAVE_NOT_AVAILABLE);
        LOGGER.warn("Message store is slave mode, so end transaction is forbidden. ");
        return response;
    }
    // 事务回查标记，是否为事务回查（仅仅打印日志），只有提交或者回滚的消息才向后处理
    if (requestHeader.getFromTransactionCheck()) {
        switch (requestHeader.getCommitOrRollback()) {
            case MessageSysFlag.TRANSACTION_NOT_TYPE: {
                LOGGER.warn("Check producer[{}] transaction state, but it's pending status."
                        + "RequestHeader: {} Remark: {}",
                    RemotingHelper.parseChannelRemoteAddr(ctx.channel()),
                    requestHeader.toString(),
                    request.getRemark());
                return null;
            }
            case MessageSysFlag.TRANSACTION_COMMIT_TYPE: {
                LOGGER.warn("Check producer[{}] transaction state, the producer commit the message."
                        + "RequestHeader: {} Remark: {}",
                    RemotingHelper.parseChannelRemoteAddr(ctx.channel()),
                    requestHeader.toString(),
                    request.getRemark());
                break;
            }
            case MessageSysFlag.TRANSACTION_ROLLBACK_TYPE: {
                LOGGER.warn("Check producer[{}] transaction state, the producer rollback the message."
                        + "RequestHeader: {} Remark: {}",
                    RemotingHelper.parseChannelRemoteAddr(ctx.channel()),
                    requestHeader.toString(),
                    request.getRemark());
                break;
            }
            default:
                return null;
        }
    } else {
        switch (requestHeader.getCommitOrRollback()) {
            case MessageSysFlag.TRANSACTION_NOT_TYPE: {
                LOGGER.warn("The producer[{}] end transaction in sending message,  and it's pending status."
                        + "RequestHeader: {} Remark: {}",
                    RemotingHelper.parseChannelRemoteAddr(ctx.channel()),
                    requestHeader.toString(),
                    request.getRemark());
                return null;
            }
            case MessageSysFlag.TRANSACTION_COMMIT_TYPE: {
                break;
            }
            case MessageSysFlag.TRANSACTION_ROLLBACK_TYPE: {
                LOGGER.warn("The producer[{}] end transaction in sending message, rollback the message."
                        + "RequestHeader: {} Remark: {}",
                    RemotingHelper.parseChannelRemoteAddr(ctx.channel()),
                    requestHeader.toString(),
                    request.getRemark());
                break;
            }
            default:
                return null;
        }
    }
    OperationResult result = new OperationResult();
    if (MessageSysFlag.TRANSACTION_COMMIT_TYPE == requestHeader.getCommitOrRollback()) {
        // 根据之前提交的内部事务topic的偏移量查出来提交的这条消息
        result = this.brokerController.getTransactionalMessageService().commitMessage(requestHeader);
        if (result.getResponseCode() == ResponseCode.SUCCESS) {
            // 校验查询出来的这条消息是否正确
            RemotingCommand res = checkPrepareMessage(result.getPrepareMessage(), requestHeader);
            if (res.getCode() == ResponseCode.SUCCESS) {
                // 恢复原始消息
                MessageExtBrokerInner msgInner = endMessageTransaction(result.getPrepareMessage());
                msgInner.setSysFlag(MessageSysFlag.resetTransactionValue(msgInner.getSysFlag(), requestHeader.getCommitOrRollback()));
                msgInner.setQueueOffset(requestHeader.getTranStateTableOffset());
                msgInner.setPreparedTransactionOffset(requestHeader.getCommitLogOffset());
                msgInner.setStoreTimestamp(result.getPrepareMessage().getStoreTimestamp());
                //存储到CommitLog文件中，如果成功，则删除半消息
                RemotingCommand sendResult = sendFinalMessage(msgInner);
                if (sendResult.getCode() == ResponseCode.SUCCESS) {
                    // 删除prepare消息，其实就是向RMQ_SYS_TRANS_OP_HALF_TOPIC主题写入消息，tag是d
                    // 因为RocketMQ是追加消息，不支持更改和删除，所以删除就是在特有的主题下新增一条消息
                    // 这样无论是提交还是回滚，都可以找到，以此来判断是回滚还是提交了。如果没有则是未知状态
                    this.brokerController.getTransactionalMessageService().deletePrepareMessage(result.getPrepareMessage());
                }
                return sendResult;
            }
            return res;
        }
    } else if (MessageSysFlag.TRANSACTION_ROLLBACK_TYPE == requestHeader.getCommitOrRollback()) {
        result = this.brokerController.getTransactionalMessageService().rollbackMessage(requestHeader);
        if (result.getResponseCode() == ResponseCode.SUCCESS) {
            RemotingCommand res = checkPrepareMessage(result.getPrepareMessage(), requestHeader);
            if (res.getCode() == ResponseCode.SUCCESS) {
                this.brokerController.getTransactionalMessageService().deletePrepareMessage(result.getPrepareMessage());
            }
            return res;
        }
    }
    response.setCode(result.getResponseCode());
    response.setRemark(result.getResponseRemark());
    return response;
}
```

1. TransactionalMessageServiceImpl#deletePrepareMessage删除消息（并不是物理删除，而是追加），删除消息本质是向RMQ_SYS_TRANS_OP_HALF_TOPIC主题的队列追加一条有特定tag的消息

```java
TransactionalMessageServiceImpl#deletePrepareMessage
@Override
public boolean deletePrepareMessage(MessageExt msgExt) {
    if (this.transactionalMessageBridge.putOpMessage(msgExt, TransactionalMessageUtil.REMOVETAG)) {
        log.info("Transaction op message write successfully. messageId={}, queueId={} msgExt:{}", msgExt.getMsgId(), msgExt.getQueueId(), msgExt);
        return true;
    } else {
        log.error("Transaction op message write failed. messageId is {}, queueId is {}", msgExt.getMsgId(), msgExt.getQueueId());
        return false;
    }
}
// TransactionalMessageBridge#putOpMessage 向RMQ_SYS_TRANS_OP_HALF_TOPIC追加消息
public boolean putOpMessage(MessageExt messageExt, String opType) {
    // messageExt是Prepare消息
    // 构建一个消息队列
    MessageQueue messageQueue = new MessageQueue(messageExt.getTopic(),
        this.brokerController.getBrokerConfig().getBrokerName(), messageExt.getQueueId());
    if (TransactionalMessageUtil.REMOVETAG.equals(opType)) {
        return addRemoveTagInTransactionOp(messageExt, messageQueue);
    }
    return true;
}
//TransactionalMessageBridge#addRemoveTagInTransactionOp
private boolean addRemoveTagInTransactionOp(MessageExt messageExt, MessageQueue messageQueue) {
    Message message = new Message(TransactionalMessageUtil.buildOpTopic(), TransactionalMessageUtil.REMOVETAG,
        String.valueOf(messageExt.getQueueOffset()).getBytes(TransactionalMessageUtil.charset));
    writeOp(message, messageQueue);
    return true;
}
//TransactionalMessageBridge#writeOp 调用存储putMessage
private void writeOp(Message message, MessageQueue mq) {
  	//此处mq指的是Prepare消息队列（RMQ_SYS_TRANS_HALF_TOPIC主题的）
    //key=RMQ_SYS_TRANS_HALF_TOPIC队列与value=RMQ_SYS_TRANS_OP_HALF_TOPIC缓存
    MessageQueue opQueue;
    if (opQueueMap.containsKey(mq)) {
        opQueue = opQueueMap.get(mq);
    } else {
        // 创建一个RMQ_SYS_TRANS_OP_HALF_TOPIC主题的消息队列
        opQueue = getOpQueueByHalf(mq);
        // 如果已经存在不会覆盖已有的值，直接返回已有的值
        MessageQueue oldQueue = opQueueMap.putIfAbsent(mq, opQueue);
        if (oldQueue != null) {
            opQueue = oldQueue;
        }
    }
    //TODO by jannal 此处为什么会为null ??
    if (opQueue == null) {
        opQueue = new MessageQueue(TransactionalMessageUtil.buildOpTopic(), mq.getBrokerName(), mq.getQueueId());
    }
    putMessage(makeOpMessageInner(message, opQueue));
}
```

## Broker事务回查

**1、** 正常情况下如果客户端在处理回调后，会返回给Broker相关的状态假设Producer此时挂了，或者因为网络原因调用Broker失败了这个时候就需要Broker事务定期回查；

2. TransactionalMessageCheckService是一个服务线程，在Broker启动时，此服务线程会启动。默认60s执行一次回查，每次执行的超时时间是6s，最大回查次数15次。调用TransactionalMessageService#check方法做消息回查

```java
BrokerController#start
...省略....
if (BrokerRole.SLAVE != messageStoreConfig.getBrokerRole()) {
    if (this.transactionalMessageCheckService != null) {
        log.info("Start transaction service!");
        this.transactionalMessageCheckService.start();
    }
} 
TransactionalMessageCheckService#run
@Override
public void run() {
    log.info("Start transaction check service thread!");
  	// 默认60s
    long checkInterval = brokerController.getBrokerConfig().getTransactionCheckInterval();
    while (!this.isStopped()) {
        this.waitForRunning(checkInterval);
    }
    log.info("End transaction check service thread!");
}
@Override
protected void onWaitEnd() {
    //默认6000ms
    long timeout = brokerController.getBrokerConfig().getTransactionTimeOut();
    //默认最大检查15次
    int checkMax = brokerController.getBrokerConfig().getTransactionCheckMax();
    long begin = System.currentTimeMillis();
    log.info("Begin to check prepare message, begin time:{}", begin);
    this.brokerController.getTransactionalMessageService().check(timeout, checkMax, this.brokerController.getTransactionalMessageCheckListener());
    log.info("End to check prepare message, consumed time:{}", System.currentTimeMillis() - begin);
}
```

1. TransactionalMessageService#check主要流程

- 根据`RMQ_SYS_TRANS_HALF_TOPIC`查找队列，目前只有一个0队列
- 遍历`RMQ_SYS_TRANS_HALF_TOPIC的MessageQueue`，每个MessageQueue的处理时间是60s
- 通过`RMQ_SYS_TRANS_HALF_TOPIC的MessageQueue`作为Key从缓存中获取`RMQ_SYS_TRANS_OP_HALF_TOPIC的MessageQueue`，如果不存在，则创建一个
- 使用`CID_RMQ_SYS_TRANS`消费组拉取op队列里的消息，一次拉取32条
- 判断prepare中获取到的消息与OP中的对比，如果OP中包含此消息，则不回查。如果回查超过15次、消息过期，则直接跳过
- 如果处理时间已经超过了事务的回查时间，则进行回查，否则继续拉取消息。
- 将消息重新追加prepare消息队列并更新偏移量
- 发送回查消息给Producer
- 更新prepare队列和op队列的消费进度

1. TransactionalMessageService#check源码

```java
@Override
public void check(long transactionTimeout, int transactionCheckMax,
    AbstractTransactionalMessageCheckListener listener) {
    try {
        String topic = MixAll.RMQ_SYS_TRANS_HALF_TOPIC;
        // RMQ_SYS_TRANS_HALF_TOPIC 只有一个队列
        Set<MessageQueue> msgQueues = transactionalMessageBridge.fetchMessageQueues(topic);
        if (msgQueues == null || msgQueues.size() == 0) {
            log.warn("The queue of topic is empty :" + topic);
            return;
        }
        log.info("Check topic={}, queues={}", topic, msgQueues);
        for (MessageQueue messageQueue : msgQueues) {
            // 队列处理开始时间
            long startTime = System.currentTimeMillis();
            // 一条prepare消息队列对应一个op队列(提交或回滚后)，实际就一个队列
            MessageQueue opQueue = getOpQueue(messageQueue);
            // 获取prepare消息队列最新的的消费偏移量
            long halfOffset = transactionalMessageBridge.fetchConsumeOffset(messageQueue);
            // 获取op消息队列最新的消费偏移量
            long opOffset = transactionalMessageBridge.fetchConsumeOffset(opQueue);
            log.info("Before check, the queue={} msgOffset={} opOffset={}", messageQueue, halfOffset, opOffset);
            if (halfOffset < 0 || opOffset < 0) {
                log.error("MessageQueue: {} illegal offset read: {}, op offset: {},skip this queue", messageQueue,
                    halfOffset, opOffset);
                continue;
            }
            // 已经被处理的Op消息的偏移量
            List<Long> doneOpOffset = new ArrayList<>();
            // 已经被删除的prepare消息
            HashMap<Long, Long> removeMap = new HashMap<>();
            // 确认prepare消息是否已经被删除。主要目的是为了避免重复调用事务回查请求
            PullResult pullResult = fillOpRemoveMap(removeMap, opQueue, opOffset, halfOffset, doneOpOffset);
            if (null == pullResult) {
                log.error("The queue={} check msgOffset={} with opOffset={} failed, pullResult is null",
                    messageQueue, halfOffset, opOffset);
                continue;
            }
            // single thread
            // 获取空消息的次数
            int getMessageNullCount = 1;
            long newOffset = halfOffset;
            // 逻辑偏移量
            long i = halfOffset;
            while (true) {
                // 每一个MessageQueue处理时间限制在60s内
                if (System.currentTimeMillis() - startTime > MAX_PROCESS_TIME_LIMIT) {
                    log.info("Queue={} process time reach max={}", messageQueue, MAX_PROCESS_TIME_LIMIT);
                    break;
                }
                // 如果Prepare消息已经被处理过，则直接remove
                if (removeMap.containsKey(i)) {
                    log.info("Half offset {} has been committed/rolled back", i);
                    removeMap.remove(i);
                } else {
                    // 获取当前要处理的prepare消息
                    GetResult getResult = getHalfMsg(messageQueue, i);
                    MessageExt msgExt = getResult.getMsg();
                    // 消息不存在，直接退出循环
                    if (msgExt == null) {
                        if (getMessageNullCount++ > MAX_RETRY_COUNT_WHEN_HALF_NULL) {
                            break;
                        }
                        if (getResult.getPullResult().getPullStatus() == PullStatus.NO_NEW_MSG) {
                            log.info("No new msg, the miss offset={} in={}, continue check={}, pull result={}", i,
                                messageQueue, getMessageNullCount, getResult.getPullResult());
                            break;
                        } else {
                            log.info("Illegal offset, the miss offset={} in={}, continue check={}, pull result={}",
                                i, messageQueue, getMessageNullCount, getResult.getPullResult());
                            i = getResult.getPullResult().getNextBeginOffset();
                            newOffset = i;
                            continue;
                        }
                    }
                    // 超过15次丢弃，或者消息过期了（超过了设置的文件保存时间，默认72小时）
                    if (needDiscard(msgExt, transactionCheckMax) || needSkip(msgExt)) {
                        // 默认是打印一条日志
                        listener.resolveDiscardMsg(msgExt);
                        newOffset = i + 1;
                        i++;
                        continue;
                    }
                    // 消息存储时间大于回查程序开始时间的不处理，这是一个防御
                    if (msgExt.getStoreTimestamp() >= startTime) {
                        log.info("Fresh stored. the miss offset={}, check it later, store={}", i,
                            new Date(msgExt.getStoreTimestamp()));
                        break;
                    }
                    // 消息已存储的时间差
                    long valueOfCurrentMinusBorn = System.currentTimeMillis() - msgExt.getBornTimestamp();
                    //默认超时6s
                    long checkImmunityTime = transactionTimeout;
                    //目前此属性只是在测试用例使用
                    String checkImmunityTimeStr = msgExt.getUserProperty(MessageConst.PROPERTY_CHECK_IMMUNITY_TIME_IN_SECONDS);
                    if (null != checkImmunityTimeStr) {
                        //checkImmunityTimeStr如果是-1，则使用transactionTimeout
                        checkImmunityTime = getImmunityTime(checkImmunityTimeStr, transactionTimeout);
                        // 给事务预留时间用于提交事务，此时不应该做回查
                        if (valueOfCurrentMinusBorn < checkImmunityTime) {
                            // 超过检查时间，重新写回prepare消息队列
                            if (checkPrepareQueueOffset(removeMap, doneOpOffset, msgExt, checkImmunityTime)) {
                                newOffset = i + 1;
                                i++;
                                continue;
                            }
                        }
                    } else {
                        // 新提交的prepare消息，暂不处理，此时可能正在提交的路上
                        if ((0 <= valueOfCurrentMinusBorn) && (valueOfCurrentMinusBorn < checkImmunityTime)) {
                            log.info("New arrived, the miss offset={}, check it later checkImmunity={}, born={}", i,
                                checkImmunityTime, new Date(msgExt.getBornTimestamp()));
                            break;
                        }
                    }
                    List<MessageExt> opMsg = pullResult.getMsgFoundList();
                    // checkImmunityTime默认是6秒，第一次可以检查的时间
                    // 时间超过事务超时时间、最后一条消息的存储时间减去处理的起始时间超过超时时间
                    // TODO valueOfCurrentMinusBorn什么情况会<=-1????
                    boolean isNeedCheck = (opMsg == null && valueOfCurrentMinusBorn > checkImmunityTime)
                        || (opMsg != null && (opMsg.get(opMsg.size() - 1).getBornTimestamp() - startTime > transactionTimeout))
                        || (valueOfCurrentMinusBorn <= -1);
                    if (isNeedCheck) {
                        // 把这个消息重新写回prepare消息队列里并更新偏移量
                        if (!putBackHalfMsgQueue(msgExt, i)) {
                            continue;
                        }
                        // 事务回查（异步线程发送），发送消息给Producer
                        listener.resolveHalfMsg(msgExt);
                    } else {
                        // 如果没有超时继续拉
                        pullResult = fillOpRemoveMap(removeMap, opQueue, pullResult.getNextBeginOffset(), halfOffset, doneOpOffset);
                        log.info("The miss offset:{} in messageQueue:{} need to get more opMsg, result is:{}", i,
                            messageQueue, pullResult);
                        continue;
                    }
                }
                // 消费偏移量加+1
                newOffset = i + 1;
                i++;
            }
            // 说明消费了，此时需要更新偏移量
            if (newOffset != halfOffset) {
                transactionalMessageBridge.updateConsumeOffset(messageQueue, newOffset);
            }
            long newOpOffset = calculateOpOffset(doneOpOffset, opOffset);
            if (newOpOffset != opOffset) {
                transactionalMessageBridge.updateConsumeOffset(opQueue, newOpOffset);
            }
        }
    } catch (Exception e) {
        e.printStackTrace();
        log.error("Check error", e);
    }
}
```
