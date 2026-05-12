# 04、RocketMQ源码解析 - 消息消费
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/4.html
- 分类：消息队列
- 分组：教程目录
## 1、消息消费概述

- 消息消费方式

拉取、推送。
- 消费者组与消费模式

多个消费者组成一个消费组，两种模式：集群（消息被其中任何一个消息者消费）、广播模式（全部消费者消费）。
- ConsumeFromWhere consumeFromWhere

从何处开始消费，可选值：

1）CONSUME_FROM_LAST_OFFSET：上一次消费偏移量

2）CONSUME_FROM_FIRST_OFFSET：从头开始

3）CONSUME_FROM_TIMESTAMP：从某个时间点开始
- 消费进度存储

其实现类为：OffsetStore offsetStore。消费者需要记录消息消费的进度：

1）广播模式：广播模式由于每个消费者都需要消费消息，故消息的进度（最后消费的偏移量可以保存在本地）。

2）集群模式：由于集群中的消费者只要一个消费消息即可，故消息的消费进度，需要保存在集中点，故 RocketMQ存储在Broker所在的服务器。

## 2、消息消费实现

首先看一下消费 Demo。

使用推送模式，设置消费者所属组，订阅主题、定义消息消费回调接口，推送消息后消费方具体业务处理，并返回CONSUME_SUCCESS表示消费成功。

消息消费者具体实现类：org.apache.rocketmq.client.impl.consumer.DefaultMQPushConsumerImpl。

## 2.1 DefaultMQPushConsumerImpl

### 2.1.1 消费端初始化（构造方法）

然后开始重点从 star t方法深入研究 DefaultMQPushConsumerImpl 的内部机制。

```java
public synchronized void start() throws MQClientException {
switch (this.serviceState) {  
    case CREATE_JUST:
        log.info("the consumer [{}] start beginning. messageModel={}, isUnitMode={}", this.defaultMQPushConsumer.getConsumerGroup(),
            this.defaultMQPushConsumer.getMessageModel(), this.defaultMQPushConsumer.isUnitMode());
        this.serviceState = ServiceState.START_FAILED;     // @1
        this.checkConfig();                                                 //@2
        this.copySubscription();                                         //@3
        if (this.defaultMQPushConsumer.getMessageModel() == MessageModel.CLUSTERING) {    // @4
            this.defaultMQPushConsumer.changeInstanceNameToPID();
        }
        this.mQClientFactory = MQClientManager.getInstance().getAndCreateMQClientInstance(this.defaultMQPushConsumer, this.rpcHook);
        this.rebalanceImpl.setConsumerGroup(this.defaultMQPushConsumer.getConsumerGroup());    // @5
        this.rebalanceImpl.setMessageModel(this.defaultMQPushConsumer.getMessageModel());
        this.rebalanceImpl.setAllocateMessageQueueStrategy(this.defaultMQPushConsumer.getAllocateMessageQueueStrategy());
        this.rebalanceImpl.setmQClientFactory(this.mQClientFactory);
        this.pullAPIWrapper = new PullAPIWrapper(
            mQClientFactory,
            this.defaultMQPushConsumer.getConsumerGroup(), isUnitMode());
        this.pullAPIWrapper.registerFilterMessageHook(filterMessageHookList);   //@6
        if (this.defaultMQPushConsumer.getOffsetStore() != null) {    // @7
            this.offsetStore = this.defaultMQPushConsumer.getOffsetStore();
        } else {
            switch (this.defaultMQPushConsumer.getMessageModel()) {
                case BROADCASTING:
                    this.offsetStore = new LocalFileOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
                    break;
                case CLUSTERING:
                    this.offsetStore = new RemoteBrokerOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
                    break;
                default:
                    break;
            }
        }
        this.offsetStore.load();         //@8
        if (this.getMessageListenerInner() instanceof MessageListenerOrderly) {
            this.consumeOrderly = true;
            this.consumeMessageService =
                new ConsumeMessageOrderlyService(this, (MessageListenerOrderly) this.getMessageListenerInner());
        } else if (this.getMessageListenerInner() instanceof MessageListenerConcurrently) {
            this.consumeOrderly = false;
            this.consumeMessageService =
                new ConsumeMessageConcurrentlyService(this, (MessageListenerConcurrently) this.getMessageListenerInner());
        }
        this.consumeMessageService.start();   //@9
        boolean registerOK = mQClientFactory.registerConsumer(this.defaultMQPushConsumer.getConsumerGroup(), this);   //@10
        if (!registerOK) {
            this.serviceState = ServiceState.CREATE_JUST;
            this.consumeMessageService.shutdown();
            throw new MQClientException("The consumer group[" + this.defaultMQPushConsumer.getConsumerGroup()
                + "] has been created before, specify another name please." + FAQUrl.suggestTodo(FAQUrl.GROUP_NAME_DUPLICATE_URL),
                null);
        }
        mQClientFactory.start();
        log.info("the consumer [{}] start OK.", this.defaultMQPushConsumer.getConsumerGroup());
        this.serviceState = ServiceState.RUNNING;
        break;
    case RUNNING:
    case START_FAILED:
    case SHUTDOWN_ALREADY:
        throw new MQClientException("The PushConsumer service state not OK, maybe started once, "//
            + this.serviceState//
            + FAQUrl.suggestTodo(FAQUrl.CLIENT_SERVICE_NOT_OK),
            null);
    default:
        break;
}
this.updateTopicSubscribeInfoWhenSubscriptionChanged();    //@11
this.mQClientFactory.checkClientInBroker();                               //@12
this.mQClientFactory.sendHeartbeatToAllBrokerWithLock();   //@13
this.mQClientFactory.rebalanceImmediately();                          //@14
}
```

代码@2：checkConfig,检查配置信息，主要检查消费者组（consumeGroup）、消息消费方式（messageModel）、消息消费开始偏移量（consumeFromWhere）、消息队列分配算法（AllocateMessageQueueStrategy）、订阅消息主题（Map>` brokerAddrTable

broker信息，这些信息存在于NameServer,但缓存在本地客户端，供生产者、消费者共同使用。
- ClientRemotingProcessor clientRemotingProcessor

客户端命令处理器。
- PullMessageService pullMessageService

消息拉取线程，一个MQClientInstance 只会启动一个消息拉取线程。
- RebalanceService rebalanceService

队列动态负载线程。
- DefaultMQProducer defaultMQProducer

默认的消息生产者。
- ConsumerStatsManager consumerStatsManager

消费端统计。
- AtomicLong sendHeartbeatTimesTotal = new AtomicLong(0)

心跳包发送次数。
- ServiceState serviceState = ServiceState.CREATE_JUST

状态。

MQClientInstance mq客户端实例，每台应用服务器将持有一个MQClientInstance对象，供该应用服务器的消费者，生产者使用。该类是消费者，生产者网络处理的核心类。

**2.1.1.2 RebalanceImpl**

同样在这里我们重点先理解该类的作用。

RebalanceImpl 是 consume 的重新负载，什么意思呢？就是消费者与消费队列的对应关系，我们来思考一个问题，比如现在有4个消息队列（q1,q2,q3,q4），3个消费者(m1,m2,m3)，那么消费者与消息队列的对应关系是什么呢?我们按照一个轮询算法来表示， m1(q1,q4) m2(q2) m3(q3)，如果此时q2消息队列失效（所在的broker挂了），那么消息队列的消费就需要重新分配，RebalanceImpl 就是干这事的，该类的调用轨迹如下：(MQClientInstance start --> (this.rebalanceService.start()) ---> RebalanceService.run（this.mqClientFactory.doRebalance()） ---> MQConsumerInner.doRebalance(DefaultMQPushConsumerImpl) --->RebalanceImpl.doRebalance。

在这里着重说明一点：消息队列数量与消费者关系：1个消费者可以消费多个队列，但1个消息队列只会被一个消费者消费；如果消费者数量大于消息队列数量，则有的消费者会消费不到消息（集群模式）。

### 2.1.2 消息消费过程

消息的消费过程，就是从服务器拉取，然后消费者进行消费，再根据业务反馈是否成功消费来推动消费进度，也就是消息的消费进度并不是保存在服务端（比如 commitlog 文件中），而是保存在消费端（可以是本地（广播模式）、broke端（集群模式））具体的代码实现：

```java
public void pullMessage(final PullRequest pullRequest) {
    final ProcessQueue processQueue = pullRequest.getProcessQueue();
    if (processQueue.isDropped()) {
        log.info("the pull request[{}] is dropped.", pullRequest.toString());
        return;
    }
    pullRequest.getProcessQueue().setLastPullTimestamp(System.currentTimeMillis());
    try {
        this.makeSureStateOK();
    } catch (MQClientException e) {
        log.warn("pullMessage exception, consumer state not ok", e);
        this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_EXCEPTION);
        return;
    }
    if (this.isPause()) {
        log.warn("consumer was paused, execute pull request later. instanceName={}, group={}", this.defaultMQPushConsumer.getInstanceName(), this.defaultMQPushConsumer.getConsumerGroup());
        this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_SUSPEND);
        return;
    }
    long size = processQueue.getMsgCount().get();
    if (size > this.defaultMQPushConsumer.getPullThresholdForQueue()) {
        this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_FLOW_CONTROL);
        if ((flowControlTimes1++ % 1000) == 0) {
            log.warn(
                "the consumer message buffer is full, so do flow control, minOffset={}, maxOffset={}, size={}, pullRequest={}, flowControlTimes={}",
                processQueue.getMsgTreeMap().firstKey(), processQueue.getMsgTreeMap().lastKey(), size, pullRequest, flowControlTimes1);
        }
        return;
    }
    if (!this.consumeOrderly) {
        if (processQueue.getMaxSpan() > this.defaultMQPushConsumer.getConsumeConcurrentlyMaxSpan()) {
            this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_FLOW_CONTROL);
            if ((flowControlTimes2++ % 1000) == 0) {
                log.warn(
                    "the queue's messages, span too long, so do flow control, minOffset={}, maxOffset={}, maxSpan={}, pullRequest={}, flowControlTimes={}",
                    processQueue.getMsgTreeMap().firstKey(), processQueue.getMsgTreeMap().lastKey(), processQueue.getMaxSpan(),
                    pullRequest, flowControlTimes2);
            }
            return;
        }
    } else {
        if (processQueue.isLocked()) {
            if (!pullRequest.isLockedFirst()) {
                final long offset = this.rebalanceImpl.computePullFromWhere(pullRequest.getMessageQueue());
                boolean brokerBusy = offset < pullRequest.getNextOffset();
                log.info("the first time to pull message, so fix offset from broker. pullRequest: {} NewOffset: {} brokerBusy: {}",
                    pullRequest, offset, brokerBusy);
                if (brokerBusy) {
                    log.info("[NOTIFYME]the first time to pull message, but pull request offset larger than broker consume offset. pullRequest: {} NewOffset: {}",
                        pullRequest, offset);
                }
                pullRequest.setLockedFirst(true);
                pullRequest.setNextOffset(offset);
            }
        } else {
            this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_EXCEPTION);
            log.info("pull message later because not locked in broker, {}", pullRequest);
            return;
        }
    }
    final SubscriptionData subscriptionData = this.rebalanceImpl.getSubscriptionInner().get(pullRequest.getMessageQueue().getTopic());
    if (null == subscriptionData) {
        this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_EXCEPTION);
        log.warn("find the consumer's subscription failed, {}", pullRequest);
        return;
    }
    final long beginTimestamp = System.currentTimeMillis();
    PullCallback pullCallback = new PullCallback() {
        @Override
        public void onSuccess(PullResult pullResult) {
            if (pullResult != null) {
                pullResult = DefaultMQPushConsumerImpl.this.pullAPIWrapper.processPullResult(pullRequest.getMessageQueue(), pullResult,
                    subscriptionData);
                switch (pullResult.getPullStatus()) {
                    case FOUND:
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
                            DefaultMQPushConsumerImpl.this.consumeMessageService.submitConsumeRequest(//
                                pullResult.getMsgFoundList(), //
                                processQueue, //
                                pullRequest.getMessageQueue(), //
                                dispathToConsume);
                            if (DefaultMQPushConsumerImpl.this.defaultMQPushConsumer.getPullInterval() > 0) {
                                DefaultMQPushConsumerImpl.this.executePullRequestLater(pullRequest,
                                    DefaultMQPushConsumerImpl.this.defaultMQPushConsumer.getPullInterval());
                            } else {
                                DefaultMQPushConsumerImpl.this.executePullRequestImmediately(pullRequest);
                            }
                        }
                        if (pullResult.getNextBeginOffset() < prevRequestOffset//
                            || firstMsgOffset < prevRequestOffset) {
                            log.warn(
                                "[BUG] pull message result maybe data wrong, nextBeginOffset: {} firstMsgOffset: {} prevRequestOffset: {}", //
                                pullResult.getNextBeginOffset(), //
                                firstMsgOffset, //
                                prevRequestOffset);
                        }
                        break;
                    case NO_NEW_MSG:
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
                        log.warn("the pull request offset illegal, {} {}", //
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
            }
        }
        @Override
        public void onException(Throwable e) {
            if (!pullRequest.getMessageQueue().getTopic().startsWith(MixAll.RETRY_GROUP_TOPIC_PREFIX)) {
                log.warn("execute the pull request exception", e);
            }
            DefaultMQPushConsumerImpl.this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_EXCEPTION);
        }
    };
    boolean commitOffsetEnable = false;
    long commitOffsetValue = 0L;
    if (MessageModel.CLUSTERING == this.defaultMQPushConsumer.getMessageModel()) {
        commitOffsetValue = this.offsetStore.readOffset(pullRequest.getMessageQueue(), ReadOffsetType.READ_FROM_MEMORY);
        if (commitOffsetValue > 0) {
            commitOffsetEnable = true;
        }
    }
    String subExpression = null;
    boolean classFilter = false;
    SubscriptionData sd = this.rebalanceImpl.getSubscriptionInner().get(pullRequest.getMessageQueue().getTopic());
    if (sd != null) {
        if (this.defaultMQPushConsumer.isPostSubscriptionWhenPull() && !sd.isClassFilterMode()) {
            subExpression = sd.getSubString();
        }
        classFilter = sd.isClassFilterMode();
    }
    int sysFlag = PullSysFlag.buildSysFlag(//
        commitOffsetEnable, // commitOffset
        true, // suspend
        subExpression != null, // subscription
        classFilter // class filter
    );
    try {
        this.pullAPIWrapper.pullKernelImpl(//
            pullRequest.getMessageQueue(), // 1
            subExpression, // 2
            subscriptionData.getExpressionType(), // 3
            subscriptionData.getSubVersion(), // 4
            pullRequest.getNextOffset(), // 5
            this.defaultMQPushConsumer.getPullBatchSize(), // 6
            sysFlag, // 7
            commitOffsetValue, // 8
            BROKER_SUSPEND_MAX_TIME_MILLIS, // 9
            CONSUMER_TIMEOUT_MILLIS_WHEN_SUSPEND, // 10
            CommunicationMode.ASYNC, // 11
            pullCallback // 12
        );
    } catch (Exception e) {
        log.error("pullKernelImpl exception", e);
        this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_EXCEPTION);
    }
}
```

消费过程暂不详细讲解了，后续文章会进一步对消息消费的各个方面做出详细的剖析。

本文旨在梳理出消息的消费过程，消息队列与消费者的负载、消费模式（广播、集群），消息进度等等。

后续文章重点关注：

**1、** 消费进度反馈源码解析；

**2、** 消费者消息负载实现原理；

**3、** 消息过滤与tag机制；

**4、** 常用问题分析；

个消费者多个线程（线程之间如何协调）
