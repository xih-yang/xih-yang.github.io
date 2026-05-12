# 18、RocketMQ 源码解析 - 消费者PullMessageService
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/18.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## 消息拉取

**1、** 消息拉取的步骤；

- 拉取客户端消息拉取请求并封装
- 消息服务器查找消息并返回
- 消息拉取客户端处理返回的消息
**2、** 消息拉取与Broker处理流程；

1. **DefaultMQPushConsumerImpl#pullMessage**是消息拉取的入口

- **步骤1**：判断状态

从PullRequest中获取ProcessQueue，如果ProcessQueue当前状态非丢弃状态，则更新ProcessQueue的`lastPullTimestamp`（最后一次拉取时间）
- 如果Consumer状态不是**RUNNING**，则延迟3秒再次放入到`PullMessageService`的任务队列中，放弃本次拉取任务
- 如果Consumer状态是挂起状态(pause),则延迟1秒再次放入到`PullMessageService`的任务队列中，放弃本次拉取任务

**步骤2**：流控阈值判断

- 如果消息总量超过`pullThresholdForQueue=1000（默认）`，触发流控，放弃本次拉取，延迟50ms，放入PullMessageService队列
- 如果消息大小超过`pullThresholdSizeForQueue=100MB（默认）`，延迟50ms，放入PullMessageService队列
- 并发消费模式下，最大offset与最小offset差值如果超过`consumeConcurrentlyMaxSpan=2000（默认）`，延迟50ms，放入PullMessageService队列。（主要为了避免一条消息阻塞，消息进度无法推进，造成大量消息阻塞）
- 顺序消费模式下，如果ProcessQueue被锁，则延迟3s

**步骤3**：获取topic的订阅信息

- 获取topic的订阅信息，如果为空则结束消息拉取。下一次拉取延迟3s

**步骤4**：创建拉取消息后的回调对象PullCallback

**步骤5**：构建消息拉取系统标记

**步骤6**：用`this.pullAPIWrapper.pullKernelImpl`方法后与服务端交互

**4、****步骤一源码**；

```java
// 获取ProcessQueue，如果处理队列状态未被丢弃，则更新拉取时间戳
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
    // 延迟3000ms再拉取
    this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_EXCEPTION);
    return;
}
// 拉取任务暂停，则延迟1s再放入PullMessageService队列
if (this.isPause()) {
    log.warn("consumer was paused, execute pull request later. instanceName={}, group={}", this.defaultMQPushConsumer.getInstanceName(), this.defaultMQPushConsumer.getConsumerGroup());
    this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_SUSPEND);
    return;
}
```

**5、****步骤二流控源码**；

```java
long cachedMessageCount = processQueue.getMsgCount().get();
long cachedMessageSizeInMiB = processQueue.getMsgSize().get() / (1024 * 1024);
//如果消息总量超过1000（默认），延迟50ms，放入PullMessageService队列
if (cachedMessageCount > this.defaultMQPushConsumer.getPullThresholdForQueue()) {
    this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_FLOW_CONTROL);
    if ((queueFlowControlTimes++ % 1000) == 0) {
        log.warn(
            "the cached message count exceeds the threshold {}, so do flow control, minOffset={}, maxOffset={}, count={}, size={} MiB, pullRequest={}, flowControlTimes={}",
            this.defaultMQPushConsumer.getPullThresholdForQueue(), processQueue.getMsgTreeMap().firstKey(), processQueue.getMsgTreeMap().lastKey(), cachedMessageCount, cachedMessageSizeInMiB, pullRequest, queueFlowControlTimes);
    }
    return;
}
//如果消息大小超过100MB（默认），延迟50ms，放入PullMessageService队列
if (cachedMessageSizeInMiB > this.defaultMQPushConsumer.getPullThresholdSizeForQueue()) {
    this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_FLOW_CONTROL);
    if ((queueFlowControlTimes++ % 1000) == 0) {
        log.warn(
            "the cached message size exceeds the threshold {} MiB, so do flow control, minOffset={}, maxOffset={}, count={}, size={} MiB, pullRequest={}, flowControlTimes={}",
            this.defaultMQPushConsumer.getPullThresholdSizeForQueue(), processQueue.getMsgTreeMap().firstKey(), processQueue.getMsgTreeMap().lastKey(), cachedMessageCount, cachedMessageSizeInMiB, pullRequest, queueFlowControlTimes);
    }
    return;
}
//并发消费模式
if (!this.consumeOrderly) {
    //最大offset与最小offset差值如果超过2000（默认），延迟50ms，放入PullMessageService队列。
    //避免造成大量重复消费
    if (processQueue.getMaxSpan() > this.defaultMQPushConsumer.getConsumeConcurrentlyMaxSpan()) {
        this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_FLOW_CONTROL);
        if ((queueMaxSpanFlowControlTimes++ % 1000) == 0) {
            log.warn(
                "the queue's messages, span too long, so do flow control, minOffset={}, maxOffset={}, maxSpan={}, pullRequest={}, flowControlTimes={}",
                processQueue.getMsgTreeMap().firstKey(), processQueue.getMsgTreeMap().lastKey(), processQueue.getMaxSpan(),
                pullRequest, queueMaxSpanFlowControlTimes);
        }
        return;
    }
} else {
    // 顺序消费，需要先锁定消费队列
    if (processQueue.isLocked()) {
        // 如果锁定成功，判断是否是第一次，第一次需要请求Broker获取最新提交的偏移量
        if (!pullRequest.isLockedFirst()) {
            // 查询已经提交的偏移量
            final long offset = this.rebalanceImpl.computePullFromWhere(pullRequest.getMessageQueue());
            // 正常第一次应该是offset==nextOffset
            boolean brokerBusy = offset < pullRequest.getNextOffset();
            log.info("the first time to pull message, so fix offset from broker. pullRequest: {} NewOffset: {} brokerBusy: {}",
                pullRequest, offset, brokerBusy);
            // 第一次pull，拉取请求的偏移量大于Broker已经提交的消费偏移量，表示broker处于繁忙状态
            if (brokerBusy) {
                log.info("[NOTIFYME]the first time to pull message, but pull request offset larger than broker consume offset. pullRequest: {} NewOffset: {}",
                    pullRequest, offset);
            }
            pullRequest.setLockedFirst(true);
            pullRequest.setNextOffset(offset);
        }
    } else {
        // 延迟3000ms，添加拉取请求到队列，等待分配，避免多个Consumer同时消费顺序消息
        this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_EXCEPTION);
        log.info("pull message later because not locked in broker, {}", pullRequest);
        return;
    }
}
```

**6、****步骤三源码**；

```java
//获取该topic的订阅信息，如果为空，则中断本次消息拉取
final SubscriptionData subscriptionData = this.rebalanceImpl.getSubscriptionInner().get(pullRequest.getMessageQueue().getTopic());
if (null == subscriptionData) {
    this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_EXCEPTION);
    log.warn("find the consumer's subscription failed, {}", pullRequest);
    return;
}
```

**7、****步骤四创建PullCallback**；

```java
//从broker拉取消息后的回调
PullCallback pullCallback = new PullCallback() {
    @Override
    public void onSuccess(PullResult pullResult) {
        if (pullResult != null) {
            pullResult = DefaultMQPushConsumerImpl.this.pullAPIWrapper.processPullResult(pullRequest.getMessageQueue(), pullResult,
                subscriptionData);
            switch (pullResult.getPullStatus()) {
                case FOUND:
                    // 待拉取的偏移量
                    long prevRequestOffset = pullRequest.getNextOffset();
                    pullRequest.setNextOffset(pullResult.getNextBeginOffset());
                    long pullRT = System.currentTimeMillis() - beginTimestamp;
                    DefaultMQPushConsumerImpl.this.getConsumerStatsManager().incPullRT(pullRequest.getConsumerGroup(),
                        pullRequest.getMessageQueue().getTopic(), pullRT);
                    long firstMsgOffset = Long.MAX_VALUE;
                    // consumer消息过滤可能导致为空
                    if (pullResult.getMsgFoundList() == null || pullResult.getMsgFoundList().isEmpty()) {
                        DefaultMQPushConsumerImpl.this.executePullRequestImmediately(pullRequest);
                    } else {
                        firstMsgOffset = pullResult.getMsgFoundList().get(0).getQueueOffset();
                        DefaultMQPushConsumerImpl.this.getConsumerStatsManager().incPullTPS(pullRequest.getConsumerGroup(),
                            pullRequest.getMessageQueue().getTopic(), pullResult.getMsgFoundList().size());
                        boolean dispatchToConsume = processQueue.putMessage(pullResult.getMsgFoundList());
                        // 正常消费，提交到consumerMessageService供消费者消费（用户API处理），此处是一个异步提交
                        DefaultMQPushConsumerImpl.this.consumeMessageService.submitConsumeRequest(
                            pullResult.getMsgFoundList(),
                            processQueue,
                            pullRequest.getMessageQueue(),
                            dispatchToConsume);
                        // 提交pullRequest到队列中，实现持续消息拉取（毕竟consumer并没有定时任务，只能通过将pullRequest放入队列来触发线程执行）
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
                    // 没有新消息和没有匹配的消息直接使用服务端校正的偏移量进行下一次消息的拉取
                case NO_NEW_MSG:
                    pullRequest.setNextOffset(pullResult.getNextBeginOffset());
                    DefaultMQPushConsumerImpl.this.correctTagsOffset(pullRequest);
                    // 添加到PullMessageService队列里，再次拉取请求
                    DefaultMQPushConsumerImpl.this.executePullRequestImmediately(pullRequest);
                    break;
                case NO_MATCHED_MSG:
                    pullRequest.setNextOffset(pullResult.getNextBeginOffset());
                    DefaultMQPushConsumerImpl.this.correctTagsOffset(pullRequest);
                    DefaultMQPushConsumerImpl.this.executePullRequestImmediately(pullRequest);
                    break;
                    // 偏移量非法，则丢弃消息队列
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
                                // 暂停消息队列的拉取，等待下一次消息队列重新负载
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
```

**8、** 构建消息拉取系统标记并发送拉取命令；

```java
//构建消息拉取系统标记
int sysFlag = PullSysFlag.buildSysFlag(
    commitOffsetEnable, // commitOffset
    true, // suspend
    subExpression != null, // subscription
    classFilter // class filter
);
try {
    this.pullAPIWrapper.pullKernelImpl(
        pullRequest.getMessageQueue(),
        subExpression,
        subscriptionData.getExpressionType(),
        subscriptionData.getSubVersion(),
        pullRequest.getNextOffset(),
        this.defaultMQPushConsumer.getPullBatchSize(),
        sysFlag,
        commitOffsetValue,//当前MessageQueue的消费进度（内存中）
        BROKER_SUSPEND_MAX_TIME_MILLIS,//broker挂起的最大时间
        CONSUMER_TIMEOUT_MILLIS_WHEN_SUSPEND,//消息拉取超时时间
        CommunicationMode.ASYNC, //默认异步拉取
        pullCallback
    );
} catch (Exception e) {
    log.error("pullKernelImpl exception", e);
    this.executePullRequestLater(pullRequest, PULL_TIME_DELAY_MILLS_WHEN_EXCEPTION);
}
```

## PullMessageService

1. **PullMessageService**是消息拉取服务线程。MQClientInstance在启动时（调用start方法）会调用**PullMessageService#start**方法来启动消费者消息拉取线程
**2、****PullMessageService**继承**ServiceThread**，表示它是一个独立的服务线程，**ServiceThread**表示一个服务线程，相当于一个模板类，封装了一些通用的线程方法**PullMessageService**服务线程大致的运行流程如下；

**1、****PullMessageService**属性与构造方法；

```java
public class PullMessageService extends ServiceThread {
    private final InternalLogger log = ClientLogger.getLog();
    //存放PullRequest的队列
    private final LinkedBlockingQueue<PullRequest> pullRequestQueue = new LinkedBlockingQueue<PullRequest>();
    private final MQClientInstance mQClientFactory;
  	//主要用于延迟添加pullRequest
    private final ScheduledExecutorService scheduledExecutorService = Executors
        .newSingleThreadScheduledExecutor(new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "PullMessageServiceScheduledThread");
            }
        });
    public PullMessageService(MQClientInstance mQClientFactory) {
        this.mQClientFactory = mQClientFactory;
    }
  	...省略...
}
```

**2、****PullMessageService**服务线程的方法是run方法，是线程执行的主要逻辑如果pullRequestQueue队列为空，则阻塞一旦有拉取任务被放入队列，则执行任务可以看到**PullMessageService**只有在添加PullRequest后才会拉取消息；

```java
@Override
public void run() {
    log.info(this.getServiceName() + " service started");
    while (!this.isStopped()) {
        try {
            //从队列中获取一个PullRequest，如果队列为空，则阻塞，直到队列中被放入PullRequest
            PullRequest pullRequest = this.pullRequestQueue.take();
            //将PullRequest添加到DefaultMQPushConsumerImpl
            this.pullMessage(pullRequest);
        } catch (InterruptedException ignored) {
        } catch (Exception e) {
            log.error("Pull Message Service Run Method exception", e);
        }
    }
    log.info(this.getServiceName() + " service end");
}
private void pullMessage(final PullRequest pullRequest) {
    final MQConsumerInner consumer = this.mQClientFactory.selectConsumer(pullRequest.getConsumerGroup());
    if (consumer != null) {
        //调用消费者实例拉取消息
        DefaultMQPushConsumerImpl impl = (DefaultMQPushConsumerImpl) consumer;
        impl.pullMessage(pullRequest);
    } else {
        log.warn("No matched consumer for the PullRequest {}, drop it", pullRequest);
    }
}
```

**3、****PullMessageService**提供了两种添加PullRequest的方式，延迟添加和立即添加；

```java
//立即添加
public void executePullRequestImmediately(final PullRequest pullRequest) {
    try {
        this.pullRequestQueue.put(pullRequest);
    } catch (InterruptedException e) {
        log.error("executePullRequestImmediately pullRequestQueue.put", e);
    }
}
//延迟添加
public void executeTaskLater(final Runnable r, final long timeDelay) {
    if (!isStopped()) {
        this.scheduledExecutorService.schedule(r, timeDelay, TimeUnit.MILLISECONDS);
    } else {
        log.warn("PullMessageServiceScheduledThread has shutdown");
    }
}
```

## PullRequest

**1、****PullMessageService**只有在添加**PullRequest**后才会拉取消息，**PullRequest**是一个对象，保存待拉取的消息队列和正在处理的队里ProcessQueue消息处理队列，从Broker中拉取到的消息会先存入ProccessQueue；

```java
org.apache.rocketmq.client.impl.consumer.PullRequest
public class PullRequest {
    //消费组
    private String consumerGroup;
    //待拉取的消息队列
    private MessageQueue messageQueue;
    //消息处理队列
    private ProcessQueue processQueue;
    //待拉取的MessageQueue偏移量
    private long nextOffset;
    //是否被锁定
    private boolean lockedFirst = false;
    ...省略...
}  
public class MessageQueue implements Comparable<MessageQueue>, Serializable {
    private static final long serialVersionUID = 6191200464116433425L;
    private String topic;
    private String brokerName;
    private int queueId;
  	...省略...
}
```

## ProcessQueue

**1、** Pull获取的消息，直接提交到线程池里执行，很难监控和控制，比如，如何得知当前消息堆积的数量?如何重复处理某些消息?如何延迟处理某些消息?RocketMQ定义了一个ProcessQueue来解决这些问题，在PushConsumer运行的时候，每个MessageQueue都会有个对应的ProcessQueue对象，保存了这个MessageQueue消息处理状态的快照；

**2、****PullMessageService**从broker服务器默认每次拉取32条消息，按偏移量顺序存放在**ProcessQueue**中**PullMessageService**将消息提交到Consumer的线程池，当消息被成功处理后从**ProcessQueue**中移除；

**3、** 核心属性；

```java
public class ProcessQueue {
    public final static long REBALANCE_LOCK_MAX_LIVE_TIME =
        Long.parseLong(System.getProperty("rocketmq.client.rebalance.lockMaxLiveTime", "30000"));
    public final static long REBALANCE_LOCK_INTERVAL = Long.parseLong(System.getProperty("rocketmq.client.rebalance.lockInterval", "20000"));
    private final static long PULL_MAX_IDLE_TIME = Long.parseLong(System.getProperty("rocketmq.client.pull.pullMaxIdleTime", "120000"));
    private final InternalLogger log = ClientLogger.getLog();
    private final ReadWriteLock lockTreeMap = new ReentrantReadWriteLock();
    //<偏移量，消息>
    private final TreeMap<Long, MessageExt> msgTreeMap = new TreeMap<Long, MessageExt>();
    //ProcessQueue中总消息数
    private final AtomicLong msgCount = new AtomicLong();
    //ProcessQueue中总消息大小
    private final AtomicLong msgSize = new AtomicLong();
    private final Lock lockConsume = new ReentrantLock();
    /**
     * A subset of msgTreeMap, will only be used when orderly consume
     */
    private final TreeMap<Long, MessageExt> consumingMsgOrderlyTreeMap = new TreeMap<Long, MessageExt>();
    private final AtomicLong tryUnlockTimes = new AtomicLong(0);
    //ProcessQueue中消息的最大偏移量
    private volatile long queueOffsetMax = 0L;
    //当前ProcessQueue是否被丢弃
    private volatile boolean dropped = false;
    //上一次拉取时间
    private volatile long lastPullTimestamp = System.currentTimeMillis();
    //上一次消费时间
    private volatile long lastConsumeTimestamp = System.currentTimeMillis();
    private volatile boolean locked = false;
    private volatile long lastLockTimestamp = System.currentTimeMillis();
  	//是否正在消费
    private volatile boolean consuming = false;
    //当前client的最大offset与broker最大消息offset的差值
    private volatile long msgAccCnt = 0;
  	...省略...
}  
```
