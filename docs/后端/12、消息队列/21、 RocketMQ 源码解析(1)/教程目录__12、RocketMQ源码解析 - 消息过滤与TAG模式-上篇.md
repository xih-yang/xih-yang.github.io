# 12、RocketMQ源码解析 - 消息过滤与TAG模式-上篇
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/12.html
- 分类：消息队列
- 分组：教程目录
## 1、消息消费过滤机制

## 1.1 根据 tagcode 过滤

## 1.2 高级过滤

上述资源来源于 RocketMQ 官方文档。

通过官方文档，我们基本可以知道，消息的过滤机制与服务端息息相关，更细一点的讲，与拉取消息实现过程脱离不了关系，事实上也的确如此，MessageFilter 的使用者也就是 DefaultMessageStore#getMessage 方法，为了弄清楚消息过滤机制，我们先看一下 MessageFilter 接口，然后详细再浏览一下消息拉取实现细节。

MessageFilter 接口类：

```java
boolean isMatchedByConsumeQueue(final Long tagsCode, final ConsumeQueueExt.CqExtUnit cqExtUnit);
boolean isMatchedByCommitLog(final ByteBuffer msgBuffer,final Map<String, String> properties); 
```

isMatchedByConsumeQueue 、isMatchedByCommitLog 的区别是什么？从字面上理解，一个过滤基于 ConsumeQueue，一个基于CommitLog 过滤，为什么需要这样呢？请带着上面的问题开始后面的探索。

## 2、 DefaultMessageStore#getMessage

```java
public GetMessageResult getMessage(final String group, final String topic, final int queueId, final long offset,
    final int maxMsgNums,
    final MessageFilter messageFilter) {   // @1
    if (this.shutdown) {
        log.warn("message store has shutdown, so getMessage is forbidden");
        return null;
    }
    if (!this.runningFlags.isReadable()) {
        log.warn("message store is not readable, so getMessage is forbidden " + this.runningFlags.getFlagBits());
        return null;
    }
    long beginTime = this.getSystemClock().now();
    GetMessageStatus status = GetMessageStatus.NO_MESSAGE_IN_QUEUE;
    long nextBeginOffset = offset;         // @2
    long minOffset = 0;
    long maxOffset = 0;
    GetMessageResult getResult = new GetMessageResult();
    final long maxOffsetPy = this.commitLog.getMaxOffset();      //  @3
    ConsumeQueue consumeQueue = findConsumeQueue(topic, queueId);   // @4
    if (consumeQueue != null) {
        minOffset = consumeQueue.getMinOffsetInQueue();
        maxOffset = consumeQueue.getMaxOffsetInQueue();   // @5
         // @6
        if (maxOffset == 0) {    
            status = GetMessageStatus.NO_MESSAGE_IN_QUEUE;
            nextBeginOffset = nextOffsetCorrection(offset, 0);
        } else if (offset < minOffset) {
            status = GetMessageStatus.OFFSET_TOO_SMALL;
            nextBeginOffset = nextOffsetCorrection(offset, minOffset);
        } else if (offset == maxOffset) {
            status = GetMessageStatus.OFFSET_OVERFLOW_ONE;
            nextBeginOffset = nextOffsetCorrection(offset, offset);
        } else if (offset > maxOffset) {
            status = GetMessageStatus.OFFSET_OVERFLOW_BADLY;
            if (0 == minOffset) {
                nextBeginOffset = nextOffsetCorrection(offset, minOffset);
            } else {
                nextBeginOffset = nextOffsetCorrection(offset, maxOffset);
            }
        } else {
            SelectMappedBufferResult bufferConsumeQueue = consumeQueue.getIndexBuffer(offset);  // @7
            if (bufferConsumeQueue != null) {       
                try {
                    status = GetMessageStatus.NO_MATCHED_MESSAGE;
                    long nextPhyFileStartOffset = Long.MIN_VALUE;      // @8
                    long maxPhyOffsetPulling = 0;
                    int i = 0;
                    final int maxFilterMessageCount = Math.max(16000, maxMsgNums * ConsumeQueue.CQ_STORE_UNIT_SIZE);
                    final boolean diskFallRecorded = this.messageStoreConfig.isDiskFallRecorded();
                    ConsumeQueueExt.CqExtUnit cqExtUnit = new ConsumeQueueExt.CqExtUnit();
                    for (; i < bufferConsumeQueue.getSize() && i < maxFilterMessageCount; i += ConsumeQueue.CQ_STORE_UNIT_SIZE) {   // @9
                        long offsetPy = bufferConsumeQueue.getByteBuffer().getLong();
                        int sizePy = bufferConsumeQueue.getByteBuffer().getInt();
                        long tagsCode = bufferConsumeQueue.getByteBuffer().getLong();  // @10
                        maxPhyOffsetPulling = offsetPy;  // @11
                        if (nextPhyFileStartOffset != Long.MIN_VALUE) {  // @12
                            if (offsetPy < nextPhyFileStartOffset)
                                continue;
                        }
                        boolean isInDisk = checkInDiskByCommitOffset(offsetPy, maxOffsetPy);    // @13
                        if (this.isTheBatchFull(sizePy, maxMsgNums, getResult.getBufferTotalSize(), getResult.getMessageCount(),
                            isInDisk)) {
                            break;
                        }   // @14
                        boolean extRet = false;
                        if (consumeQueue.isExtAddr(tagsCode)) {
                            extRet = consumeQueue.getExt(tagsCode, cqExtUnit);
                            if (extRet) {
                                tagsCode = cqExtUnit.getTagsCode();
                            } else {
                                // can't find ext content.Client will filter messages by tag also.
                                log.error("[BUG] can't find consume queue extend file content!addr={}, offsetPy={}, sizePy={}, topic={}, group={}",
                                    tagsCode, offsetPy, sizePy, topic, group);
                            }
                        }
                        if (messageFilter != null
                            && !messageFilter.isMatchedByConsumeQueue(tagsCode, extRet ? cqExtUnit : null)) {     // @15
                            if (getResult.getBufferTotalSize() == 0) {
                                status = GetMessageStatus.NO_MATCHED_MESSAGE;
                            }
                            continue;
                        }
                        SelectMappedBufferResult selectResult = this.commitLog.getMessage(offsetPy, sizePy);   // @16
                        if (null == selectResult) {
                            if (getResult.getBufferTotalSize() == 0) {
                                status = GetMessageStatus.MESSAGE_WAS_REMOVING;
                            }
                            nextPhyFileStartOffset = this.commitLog.rollNextFile(offsetPy);     // @17
                            continue;
                        }
                        if (messageFilter != null
                            && !messageFilter.isMatchedByCommitLog(selectResult.getByteBuffer().slice(), null)) {     // @18
                            if (getResult.getBufferTotalSize() == 0) {
                                status = GetMessageStatus.NO_MATCHED_MESSAGE;
                            }
                            // release...
                            selectResult.release();
                            continue;
                        }
                        this.storeStatsService.getGetMessageTransferedMsgCount().incrementAndGet();
                        getResult.addMessage(selectResult);            // @19
                        status = GetMessageStatus.FOUND;
                        nextPhyFileStartOffset = Long.MIN_VALUE;
                    }
                    if (diskFallRecorded) {    // @20
                        long fallBehind = maxOffsetPy - maxPhyOffsetPulling;
                        brokerStatsManager.recordDiskFallBehindSize(group, topic, queueId, fallBehind);
                    }
                    nextBeginOffset = offset + (i / ConsumeQueue.CQ_STORE_UNIT_SIZE);
                    long diff = maxOffsetPy - maxPhyOffsetPulling;       // @21
                    long memory = (long) (StoreUtil.TOTAL_PHYSICAL_MEMORY_SIZE
                        * (this.messageStoreConfig.getAccessMessageInMemoryMaxRatio() / 100.0));
                    getResult.setSuggestPullingFromSlave(diff > memory);         
                } finally {
                    bufferConsumeQueue.release();
                }
            } else {
                status = GetMessageStatus.OFFSET_FOUND_NULL;
                nextBeginOffset = nextOffsetCorrection(offset, consumeQueue.rollNextFile(offset));
                log.warn("consumer request topic: " + topic + "offset: " + offset + " minOffset: " + minOffset + " maxOffset: "
                    + maxOffset + ", but access logic queue failed.");
            }
        }
    } else {
        status = GetMessageStatus.NO_MATCHED_LOGIC_QUEUE;
        nextBeginOffset = nextOffsetCorrection(offset, 0);
    }
    if (GetMessageStatus.FOUND == status) {
        this.storeStatsService.getGetMessageTimesTotalFound().incrementAndGet();
    } else {
        this.storeStatsService.getGetMessageTimesTotalMiss().incrementAndGet();
    }
    long eclipseTime = this.getSystemClock().now() - beginTime;
    this.storeStatsService.setGetMessageEntireTimeMax(eclipseTime);
    getResult.setStatus(status);     // @22
    getResult.setNextBeginOffset(nextBeginOffset);
    getResult.setMaxOffset(maxOffset);
    getResult.setMinOffset(minOffset);
    return getResult;
}
```

代码@1: 先相信介绍一下参数的含义。

- final String group

消费组名称。
- final String topic

消息主题。
- final int queueId

消息队列ID。
- final long offset

拉取的消息队列偏移量。
- final int maxMsgNums

一次拉取消息条数，默认为32，可通过消费者设置 pullBatchSize ，这个参数和 consumeMessageBatchMaxSize=1 是有区别的。
- final MessageFilter messageFilter

消息过滤器。

代码@2 ：设置拉取偏移量，从 PullRequest 中获取，初始从消费进度中获取。

代码@3：获取 commitlog 文件中的最大偏移量。

代码@4 ：根据 topic、queueId 获取消息队列（ConsumeQueue）。

代码@5：获取该消息队列中最小偏移量(minOffset)\最大偏移量(maxOffset)。

代码@6：根据需要拉取消息的偏移量 与 队列最小，最大偏移量进行对比)。

- maxOffset = 0 表示队列中没有消息。

计算下一次拉取拉取的开始偏移量： nextBeginOffset = nextOffsetCorrection(offset, 0);

1）如果是主节点，或者是从节点但开启了offsetCheckSlave的话，下次从头开始拉取。

2）如果是从节点，并不开启 offsetCheckSlave,则使用原先的 offset,因为考虑到主从同步延迟的因素，导致从节点consumequeue并没有同步到数据。offsetCheckInSlave设置为false保险点，当然默认该值为false。返回状态码： NO_MESSAGE_IN_QUEUE。
- offset  maxOffset

表示超出，返回状态：OFFSET_OVERFLOW_BADLY，此时，如果为从节点并未开启 offsetCheckSlave,则使用原偏移量，这个是正常的，等待消息到达从服务器。如果是主节点：表示offset是一个非法的偏移量，如果minOffset=0,则设置下一个拉取偏移量为0,否则设置为最大，我感觉设置为0，重新拉取，有可能消息重复，设置为最大可能消息会丢失？什么时候会offset > maxOffset(在主节点）拉取完消息，进行第二次拉取时，重点看一下这些状态下，应该还有第二次修正消息的处理。
- offset 大于minOffset 并小于maxOffset,正常情况。

代码@7：从 consuequeue 中从当前 offset 到当前 consueque 中最大可读消息内存。代码来源于 ConsumeQueue#getIndexBuffer。

MappedFile#selectMappedBuffer(int pos) 从pos开始，readPosition(当前写指针，表示当前最大的有效数据)。

SelectMappedBufferResult 里面封装了从pos 到 readPosition 的数据段(ByteBuffer)。

代码@8：初始化基本变量。

- nextPhyFileStartOffset = Long.MIN_VALUE 下一个开始offset
- maxPhyOffsetPulling = 0
- maxFilterMessageCount ：最大过滤消息字节数，max(16000, maxMsgNums * 20)

代码@9 ：for (; i  memory 的话，说明 offsetPy 这个偏移量的消息已经从内存中置换到磁盘中了。

代码@14：判断本次拉取任务是否完成。

```java
private boolean isTheBatchFull(int sizePy, int maxMsgNums, int bufferTotal, int messageTotal, boolean isInDisk) {  
    if (0 == bufferTotal || 0 == messageTotal) {
        return false;
    }
    if (maxMsgNums <= messageTotal) {
        return true;
    }
    if (isInDisk) {
        if ((bufferTotal + sizePy) > this.messageStoreConfig.getMaxTransferBytesOnMessageInDisk()) {
            return true;
        }
        if (messageTotal > this.messageStoreConfig.getMaxTransferCountOnMessageInDisk() - 1) {
            return true;
        }
    } else {
        if ((bufferTotal + sizePy) > this.messageStoreConfig.getMaxTransferBytesOnMessageInMemory()) {
            return true;
        }
        if (messageTotal > this.messageStoreConfig.getMaxTransferCountOnMessageInMemory() - 1) {
            return true;
        }
    }
    return false;
}
```

首先对参数进行一个说明：

- sizePy ：当前消息的字节长度
- maxMsgNums : 本次拉取消息条数
- bufferTotal : 已拉取消息字节总长度，不包含当前消息
- messageTotal ： 已拉取消息总条数
- isInDisk ：当前消息是否存在于磁盘中

具体处理逻辑：

- 如果 bufferTotal 和messageTotal 都等于0，显然本次拉取任务才刚开始，本批拉取任务未完成，返回 false。
- 如果maxMsgNums maxTransferBytesOnMessageInDisk；

(MessageStoreConfig)，默认64K，则不继续拉取该消息，返回拉取任务结束。如果已拉取消息条数 > maxTransferCountOnMessageInDisk (MessageStoreConfig)默认为8，也就是，如果消息存在于磁盘中，一次拉取任务最多拉取8条。

**2、** 如果该消息存在于内存中，对应的参数为maxTransferBytesOnMessageInMemory、maxTransferCountOnMessageInMemory，其逻辑与上述一样；

代码@14：isTheBatchFull 主要就是本次是否已拉取到足够的消息。

代码@15：执行消息过滤，如果符合过滤条件。则直接进行下一条的拉取，如果不符合过滤条件，则进入继续执行，并如果最终符合条件，则将该消息添加到拉取结果中。具体过滤逻辑暂时跳过，下文会专门研究其机制。

代码@16：从 commitlog 文件中读取消息，根据偏移量与消息大小。

代码@17：如果该偏移量没有找到正确的消息，则说明已经到文件末尾了，下一次切换到下一个 commitlog 文件读取。

```java
public long rollNextFile(final long offset) {
    int mappedFileSize = 
    this.defaultMessageStore.getMessageStoreConfig().getMapedFileSizeCommitLog();
    return offset + mappedFileSize - offset % mappedFileSize;
}
```

代码@18：从commitlog（全量消息）再次过滤，consumeque 中只能处理 TAG 模式的过滤，SQL92 这种模式无法过滤，因为SQL92 需要依赖消息中的属性，故在这里再做一次过滤。如果消息符合条件，则加入到拉取结果中。

代码@19 将消息加入到拉取结果中。

代码@20 diskFallRecorded，是否记录磁盘活动图，默认为false。

代码@21：如果当前commitlog中的偏移量 - 当前最大拉取消息偏移量 > 允许消息在内存中存在大小时，建议下一次拉取任务从从节点拉取。

代码@22:设置下一次拉取偏移量，然后返回拉取结果。

上述反映了在服务端根据偏移量拉取消息的全过程，包括消息过滤调用入口，现在我们再回去消费者根据消息拉取结果采取的措施。

## 3、消息拉取

代码入口：DefaultMQPushConsumerImpl#pullMessage

```java
switch (pullResult.getPullStatus()) {
case FOUND:      // @1
    long prevRequestOffset = pullRequest.getNextOffset();
    pullRequest.setNextOffset(pullResult.getNextBeginOffset());
    long pullRT = System.currentTimeMillis() - beginTimestamp;
    DefaultMQPushConsumerImpl.this.getConsumerStatsManager().incPullRT(pullRequest.getConsumerGroup(),
        pullRequest.getMessageQueue().getTopic(), pullRT);
    long firstMsgOffset = Long.MAX_VALUE;
    if (pullResult.getMsgFoundList() == null || pullResult.getMsgFoundList().isEmpty()) {
        DefaultMQPushConsumerImpl.this.executePullRequestImmediately(pullRequest);
    } else {
        firstMsgOffset = pullResult.getMsgFoundList().get(0).getQueueOffset();
        DefaultMQPushConsumerImpl.this.getConsumerStatsManager().incPullTPS(pullRequest.getConsumerGroup(),
            pullRequest.getMessageQueue().getTopic(), pullResult.getMsgFoundList().size());
        boolean dispathToConsume = processQueue.putMessage(pullResult.getMsgFoundList());
        DefaultMQPushConsumerImpl.this.consumeMessageService.submitConsumeRequest(
            pullResult.getMsgFoundList(),
            processQueue,
            pullRequest.getMessageQueue(),
            dispathToConsume);
        if (DefaultMQPushConsumerImpl.this.defaultMQPushConsumer.getPullInterval() > 0) {
            DefaultMQPushConsumerImpl.this.executePullRequestLater(pullRequest,
                DefaultMQPushConsumerImpl.this.defaultMQPushConsumer.getPullInterval());
        } else {
            DefaultMQPushConsumerImpl.this.executePullRequestImmediately(pullRequest);
        }
    }
    if (pullResult.getNextBeginOffset() < prevRequestOffset
        || firstMsgOffset < prevRequestOffset) {
        log.warn(
            "[BUG] pull message result maybe data wrong, nextBeginOffset: {} firstMsgOffset: {} prevRequestOffset: {}",
            pullResult.getNextBeginOffset(),
            firstMsgOffset,
            prevRequestOffset);
    }
    break;
case NO_NEW_MSG:   // @2 
    pullRequest.setNextOffset(pullResult.getNextBeginOffset());
    DefaultMQPushConsumerImpl.this.correctTagsOffset(pullRequest);
    DefaultMQPushConsumerImpl.this.executePullRequestImmediately(pullRequest);
    break;
case NO_MATCHED_MSG:
    pullRequest.setNextOffset(pullResult.getNextBeginOffset());
    DefaultMQPushConsumerImpl.this.correctTagsOffset(pullRequest);
    DefaultMQPushConsumerImpl.this.executePullRequestImmediately(pullRequest);
    break;
case OFFSET_ILLEGAL:
    log.warn("the pull request offset illegal, {} {}",
        pullRequest.toString(), pullResult.toString());
    pullRequest.setNextOffset(pullResult.getNextBeginOffset());
    pullRequest.getProcessQueue().setDropped(true);
    DefaultMQPushConsumerImpl.this.executeTaskLater(new Runnable() {
        @Override
        public void run() {
            try {
                DefaultMQPushConsumerImpl.this.offsetStore.updateOffset(pullRequest.getMessageQueue(),
                    pullRequest.getNextOffset(), false);
                DefaultMQPushConsumerImpl.this.offsetStore.persist(pullRequest.getMessageQueue());
                DefaultMQPushConsumerImpl.this.rebalanceImpl.removeProcessQueue(pullRequest.getMessageQueue());
                log.warn("fix the pull request offset, {}", pullRequest);
            } catch (Throwable e) {
                log.error("executeTaskLater Exception", e);
            }
        }
    }, 10000);
    break;
default:
    break;
}
```

代码@1：找到消息直接将这一批（默认32条）先丢到 ProceeQueue 中，然后直接将该批 submit 到 ConsumeMessageService的线程池，在 submitConsumeRequest 会根据 consumeMessageBatchMaxSize 分批提交给消费线程去消费消息，consumeMessageBatchMaxSize 默认为1。

代码@2：NO_NEW_MSG ,没有找到新的消息，然后立马加入到待拉取任务中，然后 PullMessageService 就会立马开始遍历拉取任务。

代码@3：NO_MATCHED_MSG 继续下一个待拉取偏移量进行拉取。

代码@4：OFFSET_ILLEGAL 偏移量非法，则暂时停止从该队列拉消息，持久化该messagequeue,然后丢弃 ProceeQueue,待下次队列负载时，根据消防进度重新再拉取。

上述我们再次回顾了消息拉取的细节，从本文第一张图得知，基于 Tag 模式的在服务端拉取消息时会首先过滤一次，只是针对tag 的 hashcode, 但其实并不准确，那在消费端还需要根据 tag 只进行再一次验证，相关代码请参照PullAPIWrapper#processPullResult。

上述代码调用入口：DefaultMQPullConsumerImpl#pullAsyncImpl ，同步，异步等方式类同，再调用真正消费之前都会执行这一过滤逻辑。

上文对消息拉取进一步细化，阐述消息拉取的全过程。

## 4、 MessageFilter 实例构建机制

Broker 消息拉取处理类：PullMessageProcessor#processRequest。

第一步：构建过滤器

```java
SubscriptionData subscriptionData = null;
ConsumerFilterData consumerFilterData = null;    
if (hasSubscriptionFlag) {                                       // @1 
    try {
        subscriptionData = FilterAPI.build(
            requestHeader.getTopic(), requestHeader.getSubscription(), requestHeader.getExpressionType()   
        );        // @11
        if (!ExpressionType.isTagType(subscriptionData.getExpressionType())) {   // @12
            consumerFilterData = ConsumerFilterManager.build(
                requestHeader.getTopic(), requestHeader.getConsumerGroup(), requestHeader.getSubscription(),
                requestHeader.getExpressionType(), requestHeader.getSubVersion()
            );
            assert consumerFilterData != null;
        }
    } catch (Exception e) {
        log.warn("Parse the consumer's subscription[{}] failed, group: {}", requestHeader.getSubscription(),
            requestHeader.getConsumerGroup());
        response.setCode(ResponseCode.SUBSCRIPTION_PARSE_FAILED);
        response.setRemark("parse the consumer's subscription failed");
        return response;
    }
} else {  // @2 无子订阅模式
    ConsumerGroupInfo consumerGroupInfo =
         this.brokerController.getConsumerManager().getConsumerGroupInfo(requestHeader.getConsumerGroup());  // @21
    if (null == consumerGroupInfo) {
        log.warn("the consumer's group info not exist, group: {}", requestHeader.getConsumerGroup());
        response.setCode(ResponseCode.SUBSCRIPTION_NOT_EXIST);
        response.setRemark("the consumer's group info not exist" + FAQUrl.suggestTodo(FAQUrl.SAME_GROUP_DIFFERENT_TOPIC));
        return response;
    }
    if (!subscriptionGroupConfig.isConsumeBroadcastEnable()   
        && consumerGroupInfo.getMessageModel() == MessageModel.BROADCASTING) {
        response.setCode(ResponseCode.NO_PERMISSION);
        response.setRemark("the consumer group[" + requestHeader.getConsumerGroup() + "] can not consume by broadcast way");
        return response;
    }
    subscriptionData = consumerGroupInfo.findSubscriptionData(requestHeader.getTopic());   // @22
    if (null == subscriptionData) {
        log.warn("the consumer's subscription not exist, group: {}, topic:{}", requestHeader.getConsumerGroup(), requestHeader.getTopic());
        response.setCode(ResponseCode.SUBSCRIPTION_NOT_EXIST);
        response.setRemark("the consumer's subscription not exist" + FAQUrl.suggestTodo(FAQUrl.SAME_GROUP_DIFFERENT_TOPIC));
        return response;
    }
    if (subscriptionData.getSubVersion() < requestHeader.getSubVersion()) {
        log.warn("The broker's subscription is not latest, group: {} {}", requestHeader.getConsumerGroup(),
            subscriptionData.getSubString());
        response.setCode(ResponseCode.SUBSCRIPTION_NOT_LATEST);
        response.setRemark("the consumer's subscription not latest");
        return response;
    }
    if (!ExpressionType.isTagType(subscriptionData.getExpressionType())) {
        consumerFilterData = this.brokerController.getConsumerFilterManager().get(requestHeader.getTopic(),
            requestHeader.getConsumerGroup());    // @23
        if (consumerFilterData == null) {
            response.setCode(ResponseCode.FILTER_DATA_NOT_EXIST);
            response.setRemark("The broker's consumer filter data is not exist!Your expression may be wrong!");
            return response;
        }
        if (consumerFilterData.getClientVersion() < requestHeader.getSubVersion()) {
            log.warn("The broker's consumer filter data is not latest, group: {}, topic: {}, serverV: {}, clientV: {}",
                requestHeader.getConsumerGroup(), requestHeader.getTopic(), consumerFilterData.getClientVersion(), requestHeader.getSubVersion());
            response.setCode(ResponseCode.FILTER_DATA_NOT_LATEST);
            response.setRemark("the consumer's consumer filter data not latest");
            return response;
        }
    }
}
if (!ExpressionType.isTagType(subscriptionData.getExpressionType())   // @3
    && !this.brokerController.getBrokerConfig().isEnablePropertyFilter()) {
    response.setCode(ResponseCode.SYSTEM_ERROR);
    response.setRemark("The broker does not support consumer to filter message by " + subscriptionData.getExpressionType());
    return response;
}
MessageFilter messageFilter;
if (this.brokerController.getBrokerConfig().isFilterSupportRetry()) {  // @4
    messageFilter = new ExpressionForRetryMessageFilter(subscriptionData, consumerFilterData,
        this.brokerController.getConsumerFilterManager());
} else {
    messageFilter = new ExpressionMessageFilter(subscriptionData, consumerFilterData,
        this.brokerController.getConsumerFilterManager());
}
```

代码@1：是否有子订阅模式，例如：consumer.subscribe("TopicTest", "TagB")。

代码@11：根据消费组，订阅模式，消息过滤模式构建订阅模式 SubscriptionData，在看具体构建逻辑之前，我们先大概浏览一下SubscriptionData的数据结构。

- classFilterMode 消息过滤模式，如果为 true, 表示使用上传过滤类来进行消息过滤，默认为使用tag来进行消息过滤。
- topic : 订阅的消息主题。
- subString: 消息订阅子模式字符串，如果classFilterMode=true,则表示过滤类的全路径名，如果classFilterMode=false,表示订阅子模式（tag或SQL92表达式）。
- tagsSet : 订阅的tag,,因为消费者订阅时，可以使用 "TAG1 || TAG2 || TAG3"。
- codeSet : 订阅的tag 的hashcode集合。
- subVersion : 版本。
- expressionType : tag过滤类型，分为 TAG 、SQL92。

下面是FilterAPI 构建 SubscriptionData 具体逻辑，总的说来，tagsSet,codeSet 只是针对TAG模式的，SQL92模式在这里并未做什么逻辑。

代码@12：主要是针对 SQL92 模式，后续重点对这里进行详解。

代码@2：无子订阅模式，走的是ClassFilter过滤模式，此时不是构建SubscriptionData,而是直接从brokerController.getConsumerFilterManager() 中根据 topic、consumerGroup或取，如果取不到直接提示错误，为什么会这样呢？原来在调用subscribe(String topic, String fullClassName, String filterClassSource) 方法时，会创建相关的订阅信息。

代码@3：可以看出，如果消息过滤模式为 SQL92 ，则必须在broker端开启 enablePropertyFilter=true。

代码@4：根据是否可以重试broker、filterSupportRetry，创建 ExpressionForRetryMessageFilter、ExpressionMessageFilter 消息过滤器。

根据消息拉取过程与过滤器构造过程，我们可以得出如下结论：

RocketMQ: 消息过滤有两种模式

- 类过滤classFilterMode,表达式模式(Expression),又分为 ExpressionType.TAG 和 ExpressionType.SQL92。
- TAG过滤，在服务端拉取时，会根据 ConsumeQueue 条目中存储的 tag hashcode 与订阅的 tag (hashcode 集合)进行匹配，匹配成功则放入待返回消息结果中，然后在消息消费端（消费者，还会对消息的订阅消息字符串进行再一次过滤。为什么需要进行两次过滤呢？为什么不在服务端直接对消息订阅 tag 进行匹配呢？主要就还是为了提高服务端消费消费队列（文件存储）的性能，如果直接进行字符串匹配，那么 consumequeue 条目就无法设置为定长结构，检索 consuequeue 就不方便。

接下来我们重点看一下 消息过滤器的实现机制 MessageFilter 实现类之：ExpressionMessageFilter。

## 5、ExpressionMessageFilter 实现

本节旨在基于TAG模式的实现原理，SQL92、ClassFIlterMode 模式在下篇详解。

## 5.1 ExpressionMessageFilter#isMatchedByConsumeQueue

```java
public boolean isMatchedByConsumeQueue(Long tagsCode, ConsumeQueueExt.CqExtUnit cqExtUnit) {
    if (null == subscriptionData) {      // @1
        return true;
    }
    if (subscriptionData.isClassFilterMode()) {    // @2
        return true;
    }
    // by tags code.
    if (ExpressionType.isTagType(subscriptionData.getExpressionType())) {     // @3
        if (tagsCode == null || tagsCode < 0L) {
            return true;
        }
        if (subscriptionData.getSubString().equals(SubscriptionData.SUB_ALL)) {
            return true;
        }
        return subscriptionData.getCodeSet().contains(tagsCode.intValue());
    } else {
        // no expression or no bloom
        if (consumerFilterData == null || consumerFilterData.getExpression() == null
            || consumerFilterData.getCompiledExpression() == null || consumerFilterData.getBloomFilterData() == null) {
            return true;
        }
        // message is before consumer
        if (cqExtUnit == null || !consumerFilterData.isMsgInLive(cqExtUnit.getMsgStoreTime())) {
            log.debug("Pull matched because not in live: {}, {}", consumerFilterData, cqExtUnit);
            return true;
        }
        byte[] filterBitMap = cqExtUnit.getFilterBitMap();
        BloomFilter bloomFilter = this.consumerFilterManager.getBloomFilter();
        if (filterBitMap == null || !this.bloomDataValid
            || filterBitMap.length * Byte.SIZE != consumerFilterData.getBloomFilterData().getBitNum()) {
            return true;
        }
        BitsArray bitsArray = null;
        try {
            bitsArray = BitsArray.create(filterBitMap);
            boolean ret = bloomFilter.isHit(consumerFilterData.getBloomFilterData(), bitsArray);
            log.debug("Pull {} by bit map:{}, {}, {}", ret, consumerFilterData, bitsArray, cqExtUnit);
            return ret;
        } catch (Throwable e) {
            log.error("bloom filter error, sub=" + subscriptionData
                + ", filter=" + consumerFilterData + ", bitMap=" + bitsArray, e);
        }
    }
    return true;
}
```

代码@1：如果 subscriptionData = null 说明此模式不是 Expression模式，直接返回true,表示匹配信息，这里的 Expression模式，也就是非ClassFilterMode,包含TAG,SQL92 表达式。

代码@2：如果 classFilterMode, 直接返回 true，这里也表明，isMatchedByConsumeQueue 不处理class filter mode。

代码@3：如果是 TAG 模式，只需要比对 tag 的 hashcode, 因为 consumequeue只包含了tag hashcode。

本方法代码本文不做分析，下篇会重点分析。

## 5.2 ExpressionMessageFilter#isMatchedByCommitLog

```java
public boolean isMatchedByCommitLog(ByteBuffer msgBuffer, Map<String, String> properties) {
    if (subscriptionData == null) {   // @1
        return true;
    }
    if (subscriptionData.isClassFilterMode()) {   // @2
        return true;
    }
    if (ExpressionType.isTagType(subscriptionData.getExpressionType())) {   // @3
        return true;
    }
    ConsumerFilterData realFilterData = this.consumerFilterData;
    Map<String, String> tempProperties = properties;
    // no expression
    if (realFilterData == null || realFilterData.getExpression() == null
        || realFilterData.getCompiledExpression() == null) {
        return true;
    }
    if (tempProperties == null && msgBuffer != null) {
        tempProperties = MessageDecoder.decodeProperties(msgBuffer);
    }
    Object ret = null;
    try {
        MessageEvaluationContext context = new MessageEvaluationContext(tempProperties);
        ret = realFilterData.getCompiledExpression().evaluate(context);
    } catch (Throwable e) {
        log.error("Message Filter error, " + realFilterData + ", " + tempProperties, e);
    }
    log.debug("Pull eval result: {}, {}, {}", ret, realFilterData, tempProperties);
    if (ret == null || !(ret instanceof Boolean)) {
        return false;
    }
    return (Boolean) ret;
}
```

代码@1：subscriptionData 如果为空，表示过滤模式为classfilter。

代码@2：isClassFilterMode 如果为true,表示过滤模式为 classFilter, 直接返回true。

代码@3：如果模式为TAG,直接返回true。

从这里可以说明 isMatchedByCommitLog 只为 ExpressionType.SQL92 服务。为什么 SQL92 是基于 SQL 表达式，但里面的属性来源于消息体，故需要从 commitlog中解析消息体，并得到tag,然后进行匹配。

本文关于消息过滤就介绍到这里了。
