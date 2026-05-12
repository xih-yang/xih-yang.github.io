# 17、RocketMQ 源码解析 - 消费者启动
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/17.html
- 分类：消息队列
- 分组：教程目录
## 版本声明

基于`rocketmq-all-4.3.1`版本；

## 消费模式

**1、** 消费组；

- 一个消费组可以包含多个Consumer，一个消费组可以订阅多个Topic
- 消费组之间有集群和广播两种消费模式，集群模式下，Topic中的同一条消息只允许被其中一个Consumer消费。广播模式下，Topic中的同一条消息可以被集群中的所有Consumer消费。

**2、** 消费模式；

- 拉模式：消息到达Broker后，Consumer主动发起拉取请求
- 推模式：消息达到Broker后，由Broker推送给Consumer。RocketMQ中推模式的实现是基于拉模式，即一个拉取任务完成后开始下一个拉取任务

**3、** 集群模式下，多个Consumer需要对消息队列进行负载均衡一个消息队列同时只允许被一个Consumer消费，一个Consumer可以消费多个消息队列；

## 推模式消费

**1、** DefaultMQPushConsumer是推模式核心入口类，主要委托DefaultMQPushConsumerImpl实现相关功能RocketMQ并没有真正实现推模式，而是Consumer主动向消息服务器拉取消息，RocketMQ推模式是循环向Broker端发送消息拉取请求；

**2、** DefaultMQPushConsumer核心属性如下；

```java
public class DefaultMQPushConsumer extends ClientConfig implements MQPushConsumer {
  	//委托类，大部分操作都是委托DefaultMQPushConsumerImpl
    protected final transient DefaultMQPushConsumerImpl defaultMQPushConsumerImpl;
		//消费组
    private String consumerGroup;
		// 消息消费模式，分为集群模式、广播模式，默认为集群模式。
    private MessageModel messageModel = MessageModel.CLUSTERING;
  	/**
  	第一次消费时指定消费策略
  	CONSUME_FROM_LAST_OFFSET：此处分为两种情况，如果磁盘消息未过期且未被删除，则从最小偏移量开始消费。如果磁盘已过期并被删除，则从最大偏移量开始消费。
    CONSUME_FROM_FIRST_OFFSET：从队列当前最小偏移量开始消费。
    CONSUME_FROM_TIMESTAMP：从消费者指定时间戳开始消费。
    如果从消息进度服务OffsetStore读取到MessageQueue中的偏移量不小于0，则使用读取到的偏移量拉取消息，只有在读到的偏移量小于0时，上述策略才会生效。
  	**/
    private ConsumeFromWhere consumeFromWhere = ConsumeFromWhere.CONSUME_FROM_LAST_OFFSET;
    private String consumeTimestamp = UtilAll.timeMillisToHumanString3(System.currentTimeMillis() - (1000 * 60 * 30));
  	// 集群模式下消息队列的负载策略
    private AllocateMessageQueueStrategy allocateMessageQueueStrategy;
		// 订阅信息
    private Map<String /* topic */, String /* sub expression */> subscription = new HashMap<String, String>();
		// 消息业务监听器。
    private MessageListener messageListener;
		// 消息消费进度存储器。
    private OffsetStore offsetStore;
		// 费者最小线程数
    private int consumeThreadMin = 20;
		// 消费者最大线程数
    private int consumeThreadMax = 64;
    private long adjustThreadPoolNumsThreshold = 100000;
    //并发消息消费时处理队列最大跨度
    private int consumeConcurrentlyMaxSpan = 2000;
		//每1000次流控后打印流控日志
    private int pullThresholdForQueue = 1000;
    private int pullThresholdSizeForQueue = 100;
    private int pullThresholdForTopic = -1;
    private int pullThresholdSizeForTopic = -1;
		// 推模式下拉取任务的间隔时间
    private long pullInterval = 0;
		//消息并发消费时一次消费消息的条数
    private int consumeMessageBatchMaxSize = 1;
   	//每次消息拉取的条数
    private int pullBatchSize = 32;
   	// 是否每次拉取消息都更新订阅信息，默认为false。
    private boolean postSubscriptionWhenPull = false;
    /**
     * Whether the unit of subscription group
     */
    private boolean unitMode = false;
		// 最大消费重试次数
    private int maxReconsumeTimes = -1;
  	// 延迟将该队列的消息提交到消费者线程的等待时间，默认延迟1s
    private long suspendCurrentQueueTimeMillis = 1000;
		// 息消费超时时间
    private long consumeTimeout = 15;
```

### 启动流程

**1、** DefaultMQPushConsumer启动就是委托DefaultMQPushConsumerImpl来实现的；

```java
@Override
public void start() throws MQClientException {
    this.defaultMQPushConsumerImpl.start();
}
```

**2、** DefaultMQPushConsumerImpl启动流程图；

**1、** 启动源码；

```java
public synchronized void start() throws MQClientException {
switch (this.serviceState) {
    case CREATE_JUST:
        log.info("the consumer [{}] start beginning. messageModel={}, isUnitMode={}", this.defaultMQPushConsumer.getConsumerGroup(),
            this.defaultMQPushConsumer.getMessageModel(), this.defaultMQPushConsumer.isUnitMode());
        this.serviceState = ServiceState.START_FAILED;
        //1. 检查配置
        this.checkConfig();
        //2. 构建订阅SubscriptionData信息，并加入到RebalanceImpl的订阅消息中
        this.copySubscription();
        if (this.defaultMQPushConsumer.getMessageModel() == MessageModel.CLUSTERING) {
            this.defaultMQPushConsumer.changeInstanceNameToPID();
        }
        //3. 实例化MQClientInstance
        this.mQClientFactory = MQClientManager.getInstance().getAndCreateMQClientInstance(this.defaultMQPushConsumer, this.rpcHook);
        //4. 设置reblance属性
        this.rebalanceImpl.setConsumerGroup(this.defaultMQPushConsumer.getConsumerGroup());
        this.rebalanceImpl.setMessageModel(this.defaultMQPushConsumer.getMessageModel());
        this.rebalanceImpl.setAllocateMessageQueueStrategy(this.defaultMQPushConsumer.getAllocateMessageQueueStrategy());
        this.rebalanceImpl.setmQClientFactory(this.mQClientFactory);
        //5. 设置pullAPIWrapper的消息过滤Hook
        this.pullAPIWrapper = new PullAPIWrapper(
            mQClientFactory,
            this.defaultMQPushConsumer.getConsumerGroup(), isUnitMode());
        this.pullAPIWrapper.registerFilterMessageHook(filterMessageHookList);
        //6.
        if (this.defaultMQPushConsumer.getOffsetStore() != null) {
            this.offsetStore = this.defaultMQPushConsumer.getOffsetStore();
        } else {
            switch (this.defaultMQPushConsumer.getMessageModel()) {
                case BROADCASTING:
                    //如果是广播模式则消费进度保存在本地
                    this.offsetStore = new LocalFileOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
                    break;
                case CLUSTERING:
                    //集群模式消费进度保存在服务端
                    this.offsetStore = new RemoteBrokerOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
                    break;
                default:
                    break;
            }
            this.defaultMQPushConsumer.setOffsetStore(this.offsetStore);
        }
        this.offsetStore.load();
        // 顺序消费和并发消费，创建对应的消费线程服务
        if (this.getMessageListenerInner() instanceof MessageListenerOrderly) {
            this.consumeOrderly = true;
            this.consumeMessageService =
                new ConsumeMessageOrderlyService(this, (MessageListenerOrderly) this.getMessageListenerInner());
        } else if (this.getMessageListenerInner() instanceof MessageListenerConcurrently) {
            this.consumeOrderly = false;
            this.consumeMessageService =
                new ConsumeMessageConcurrentlyService(this, (MessageListenerConcurrently) this.getMessageListenerInner());
        }
        this.consumeMessageService.start();
        // 向MQClientInstance注册消费者实例
        boolean registerOK = mQClientFactory.registerConsumer(this.defaultMQPushConsumer.getConsumerGroup(), this);
        if (!registerOK) {
            this.serviceState = ServiceState.CREATE_JUST;
            this.consumeMessageService.shutdown();
            throw new MQClientException("The consumer group[" + this.defaultMQPushConsumer.getConsumerGroup()
                + "] has been created before, specify another name please." + FAQUrl.suggestTodo(FAQUrl.GROUP_NAME_DUPLICATE_URL),
                null);
        }
        // 启动MQClientInstance实例
        mQClientFactory.start();
        log.info("the consumer [{}] start OK.", this.defaultMQPushConsumer.getConsumerGroup());
        this.serviceState = ServiceState.RUNNING;
        break;
    case RUNNING:
    case START_FAILED:
    case SHUTDOWN_ALREADY:
        throw new MQClientException("The PushConsumer service state not OK, maybe started once, "
            + this.serviceState
            + FAQUrl.suggestTodo(FAQUrl.CLIENT_SERVICE_NOT_OK),
            null);
    default:
        break;
}
```

**2、** 检查配置；

```java
private void checkConfig() throws MQClientException {
    /**
     * 1. 消费组名称不能为空
     * 2. 消费组名称必须符合正则表达式**^[%|a-zA-Z0-9_-]+$
     * 3. 消费组名称不能大于255
     */
    Validators.checkGroup(this.defaultMQPushConsumer.getConsumerGroup());
    //为什么又检查一遍？
    if (null == this.defaultMQPushConsumer.getConsumerGroup()) {
        throw new MQClientException(
            "consumerGroup is null"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    //消费组名称不能等于DEFAULT_CONSUMER
    if (this.defaultMQPushConsumer.getConsumerGroup().equals(MixAll.DEFAULT_CONSUMER_GROUP)) {
        throw new MQClientException(
            "consumerGroup can not equal "
                + MixAll.DEFAULT_CONSUMER_GROUP
                + ", please specify another one."
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    //消费模式不能为空，集群或者广播，默认是集群模式
    if (null == this.defaultMQPushConsumer.getMessageModel()) {
        throw new MQClientException(
            "messageModel is null"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    //默认从上一个CONSUME_FROM_LAST_OFFSET
    if (null == this.defaultMQPushConsumer.getConsumeFromWhere()) {
        throw new MQClientException(
            "consumeFromWhere is null"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    //第一次启动，默认从半小时前消费
    Date dt = UtilAll.parseDate(this.defaultMQPushConsumer.getConsumeTimestamp(), UtilAll.YYYYMMDDHHMMSS);
    if (null == dt) {
        throw new MQClientException(
            "consumeTimestamp is invalid, the valid format is yyyyMMddHHmmss,but received "
                + this.defaultMQPushConsumer.getConsumeTimestamp()
                + " " + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL), null);
    }
    // allocateMessageQueueStrategy
    if (null == this.defaultMQPushConsumer.getAllocateMessageQueueStrategy()) {
        throw new MQClientException(
            "allocateMessageQueueStrategy is null"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    // subscription
    if (null == this.defaultMQPushConsumer.getSubscription()) {
        throw new MQClientException(
            "subscription is null"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    // messageListener
    if (null == this.defaultMQPushConsumer.getMessageListener()) {
        throw new MQClientException(
            "messageListener is null"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    //顺序消费监听
    boolean orderly = this.defaultMQPushConsumer.getMessageListener() instanceof MessageListenerOrderly;
    //并发消费监听
    boolean concurrently = this.defaultMQPushConsumer.getMessageListener() instanceof MessageListenerConcurrently;
    if (!orderly && !concurrently) {
        throw new MQClientException(
            "messageListener must be instanceof MessageListenerOrderly or MessageListenerConcurrently"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    // consumeThreadMin  最小消费线程数量只能在[1,1000]之间，默认20
    if (this.defaultMQPushConsumer.getConsumeThreadMin() < 1
        || this.defaultMQPushConsumer.getConsumeThreadMin() > 1000) {
        throw new MQClientException(
            "consumeThreadMin Out of range [1, 1000]"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    // consumeThreadMax  最大消费线程数量只能在[1,1000]之间，默认64
    if (this.defaultMQPushConsumer.getConsumeThreadMax() < 1 || this.defaultMQPushConsumer.getConsumeThreadMax() > 1000) {
        throw new MQClientException(
            "consumeThreadMax Out of range [1, 1000]"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    // consumeThreadMin can't be larger than consumeThreadMax
    if (this.defaultMQPushConsumer.getConsumeThreadMin() > this.defaultMQPushConsumer.getConsumeThreadMax()) {
        throw new MQClientException(
            "consumeThreadMin (" + this.defaultMQPushConsumer.getConsumeThreadMin() + ") "
                + "is larger than consumeThreadMax (" + this.defaultMQPushConsumer.getConsumeThreadMax() + ")",
            null);
    }
    //偏移量最大的消息与偏移量最小的消息跨度设置只能在[1,65535],默认2000
    // consumeConcurrentlyMaxSpan
    if (this.defaultMQPushConsumer.getConsumeConcurrentlyMaxSpan() < 1
        || this.defaultMQPushConsumer.getConsumeConcurrentlyMaxSpan() > 65535) {
        throw new MQClientException(
            "consumeConcurrentlyMaxSpan Out of range [1, 65535]"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    //队列级别的流控阈值，默认每个消息队列缓存1000条消息，设置范围[1,65535]
    // pullThresholdForQueue
    if (this.defaultMQPushConsumer.getPullThresholdForQueue() < 1 || this.defaultMQPushConsumer.getPullThresholdForQueue() > 65535) {
        throw new MQClientException(
            "pullThresholdForQueue Out of range [1, 65535]"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    //topic级别的流控，默认-1(无限制)，设置范围[1,6553500],如果设置为有限值，则根据pullThresholdForTopic来计算并覆盖pullThresholdForQueue的配置
    // pullThresholdForTopic
    if (this.defaultMQPushConsumer.getPullThresholdForTopic() != -1) {
        if (this.defaultMQPushConsumer.getPullThresholdForTopic() < 1 || this.defaultMQPushConsumer.getPullThresholdForTopic() > 6553500) {
            throw new MQClientException(
                "pullThresholdForTopic Out of range [1, 6553500]"
                    + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
                null);
        }
    }
    //在队列级别限制消息大小，每个队列最多缓存100MB(默认)的消息，设置范围[1,1024].
    // pullThresholdSizeForQueue
    if (this.defaultMQPushConsumer.getPullThresholdSizeForQueue() < 1 || this.defaultMQPushConsumer.getPullThresholdSizeForQueue() > 1024) {
        throw new MQClientException(
            "pullThresholdSizeForQueue Out of range [1, 1024]"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    //在topic级别限制消息大小,默认-1表示不限制，设置范围[1,102400].
    if (this.defaultMQPushConsumer.getPullThresholdSizeForTopic() != -1) {
        // pullThresholdSizeForTopic
        if (this.defaultMQPushConsumer.getPullThresholdSizeForTopic() < 1 || this.defaultMQPushConsumer.getPullThresholdSizeForTopic() > 102400) {
            throw new MQClientException(
                "pullThresholdSizeForTopic Out of range [1, 102400]"
                    + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
                null);
        }
    }
    //推模式下，消息拉取的时间间隔，默认0，配置范围[0,65535]
    // pullInterval
    if (this.defaultMQPushConsumer.getPullInterval() < 0 || this.defaultMQPushConsumer.getPullInterval() > 65535) {
        throw new MQClientException(
            "pullInterval Out of range [0, 65535]"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    //消息并发消费时，一次消费的消息条数，默认值为1，配置返回[1,1024]
    // consumeMessageBatchMaxSize
    if (this.defaultMQPushConsumer.getConsumeMessageBatchMaxSize() < 1
        || this.defaultMQPushConsumer.getConsumeMessageBatchMaxSize() > 1024) {
        throw new MQClientException(
            "consumeMessageBatchMaxSize Out of range [1, 1024]"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
    //每次消息拉取所拉取的条数，默认32，配置范围[1,1024]
    // pullBatchSize
    if (this.defaultMQPushConsumer.getPullBatchSize() < 1 || this.defaultMQPushConsumer.getPullBatchSize() > 1024) {
        throw new MQClientException(
            "pullBatchSize Out of range [1, 1024]"
                + FAQUrl.suggestTodo(FAQUrl.CLIENT_PARAMETER_CHECK_URL),
            null);
    }
}
```

## 拉模式消费

**1、**`DefaultMQPullConsumer`是拉模式核心入口类，主要委托`DefaultMQPullConsumerImpl`实现相关功能拉模式启动通过`MQPullConsumerScheduleService`来进行调度；

**2、** DefaultMQPushConsumer是推模式核心入口类，主要委托DefaultMQPushConsumerImpl实现相关功能RocketMQ并没有真正实现推模式，而是Consumer主动向消息服务器拉取消息，RocketMQ推模式是循环向Broker端发送消息拉取请求；

### 启动流程

**1、**`DefaultMQPullConsumer`委托`DefaultMQPullConsumerImpl`启动；

```java
@Override
public void start() throws MQClientException {
    this.defaultMQPullConsumerImpl.start();
}
```

**2、**`DefaultMQPullConsumerImpl`启动流程与`DefaultMQPushConsumerImpl`几乎一样,不再赘述；

## 配置参数总结

**1、** 消费组名称规则；

- 消费组(consumerGroup)名称不能为空
- 消费组(consumerGroup)名称必须符合正则表达式**1+$**
- 消费组(consumerGroup)名称不能大于255
- 消费组名称不能等于`DEFAULT_CONSUMER`

**2、** 消费模式；

- 集群模式（默认）
- 广播模式

**3、** consumeFromWhere:如果从消费进度OffsetStore读取到的MessageQueue中的偏移量小于0时，采取以下的配置策略；

- CONSUME_FROM_LAST_OFFSET:从队列当前最大偏移量开始消费(默认配置)
- CONSUME_FROM_FIRST_OFFSET:从队列当前最小偏移量开始消费
- CONSUME_FROM_TIMESTAMP:从Consumer启动时间戳开始消费

**4、** 消费线程；

- 最小消费线程数量只能在[1,1000]之间，默认20
- 最大消费线程数量只能在[1,1000]之间，默认64

**5、** 偏移量：偏移量最大的消息与偏移量最小的消息跨度设置只能在[1,65535],默认2000；

**6、** 队列级别的流控阈值，默认每个消息队列缓存1000条消息，设置范围[1,65535]；

**7、** topic级别的流控，默认-1(无限制)，设置范围[1,6553500],如果设置为有限值，则根据pullThresholdForTopic来计算并覆盖pullThresholdForQueue的配置；

**8、** 在队列级别限制消息大小，每个队列最多缓存100MB(默认)的消息，设置范围[1,1024].；

**9、** 在topic级别限制消息大小,默认-1表示不限制，设置范围[1,102400].；

**10、** 推模式下，消息拉取的时间间隔，默认0，配置范围[0,65535]；

**11、** 消息并发消费时，一次消费的消息条数，默认值为1，配置返回[1,1024]；

**12、** 每次消息拉取所拉取的条数，默认32，配置范围[1,1024]；

**1、** %|a-zA-Z0-9_-↩︎；
