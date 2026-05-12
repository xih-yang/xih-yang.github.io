# 06、RocketMQ 源码 - Consumer消费者启动主要流程源码
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/4/6.html
- 分类：消息队列
- 分组：教程目录
客户端常用的消费者类是DefaultMQPushConsumer,

DefaultMQPushConsumer的构造器以及start方法的源码。

### 1.创建DefaultMQPushConsumer实例

最终都是调用下面四个参数的构造函数:

```java
/**
 * 创建DefaultMQPushConsumer实例
 *
 * @param namespace                    namespace地址
 * @param consumerGroup                消费者组
 * @param rpcHook                      在每个远程处理命令之前执行的RPC钩子
 * @param allocateMessageQueueStrategy 消费者之间消息分配的策略算法
 */
public DefaultMQPushConsumer(final String namespace, final String consumerGroup, RPCHook rpcHook,
                             AllocateMessageQueueStrategy allocateMessageQueueStrategy) {
    this.consumerGroup = consumerGroup;
    this.namespace = namespace;
    this.allocateMessageQueueStrategy = allocateMessageQueueStrategy;
    //创建DefaultMQPushConsumerImpl实例
    defaultMQPushConsumerImpl = new DefaultMQPushConsumerImpl(this, rpcHook);
}
```

指定了命名空间、生产者组、RPC钩子和消费者之间消息分配的策略算法的构造器, 创建了一个DefaultMQPushConsumerImpl实例, DefaultMQPushConsumer可以看作是DefaultMQPushConsumerImpl的包装类, 给开发人员用的。DefaultMQPushConsumer可以看作为DefaultMQPushConsumerImpl的门面。

```java
public DefaultMQPushConsumerImpl(DefaultMQPushConsumer defaultMQPushConsumer, RPCHook
 rpcHook) {
    this.defaultMQPushConsumer = defaultMQPushConsumer;
    this.rpcHook = rpcHook;
    // consumer 状态错误时采用定时任务定时执行拉取请求的时间间隔
    this.pullTimeDelayMillsWhenException = defaultMQPushConsumer.getPullTimeDelayMillsWhenException();
}
```

创建了DefaultMQPushConsumer实例之后, 设置一些属性, 比如namesrvAddr、consumeFromWhere、注册messageListener消息监听器等等。这些都是简单的属性赋值操作, 除了subscribe方法。

#### 1.1 subscribe订阅

subscribe方法表示Consumer订阅的自己感兴趣的Topic, 并且支持对消息进行过滤, 过滤表达式支持TAG和SQL92两种类型, 他们都会被解析为SubscriptionData对象, 最终将topic与SubscriptionData的关系维护到RebalanceImpl内部的subscriptionInner这个map集合中。

```java
/**
 * DefaultMQPushConsumer的方法
 * <p>
 * 订阅topic，支持消息过滤表达式
 *
 * @param topic         订阅的topic
 * @param subExpression 订阅表达式。它仅支持或操作，如“tag1 | | tag2 | | tag3”，如果为 null 或 *，则表示订阅全部
 */
@Override
public void subscribe(String topic, String subExpression) throws MQClientException {
    //调用defaultMQPushConsumerImpl的subscribe方法
    this.defaultMQPushConsumerImpl.subscribe(withNamespace(topic), subExpression);
}
```

```java
/**
 * DefaultMQPushConsumerImpl的方法
 * <p>
 * 订阅topic
 */
public void subscribe(String topic, String subExpression) throws MQClientException {
    try {
        //解析订阅表达式，构建SubscriptionData
        SubscriptionData subscriptionData = FilterAPI.buildSubscriptionData(topic, subExpression);
        //将topic与SubscriptionData的关系维护到RebalanceImpl内部的subscriptionInner这个map集合中
        this.rebalanceImpl.getSubscriptionInner().put(topic, subscriptionData);
        if (this.mQClientFactory != null) {
            //如果mQClientFactory不为null，则发送心跳信息给所有broker。
            this.mQClientFactory.sendHeartbeatToAllBrokerWithLock();
        }
    } catch (Exception e) {
        throw new MQClientException("subscription exception", e);
    }
}
```

### 2.start启动消费者

start方法内部会执行很多初始化操作。

```java
/**
 * DefaultMQPushConsumer的方法
 * <p>
 * 启动消费者
 */
@Override
public void start() throws MQClientException {
    //根据namespace和consumerGroup设置消费者组
    setConsumerGroup(NamespaceUtil.wrapNamespace(this.getNamespace(), this.consumerGroup));
    //默认消费者实现启动
    this.defaultMQPushConsumerImpl.start();
    //消息轨迹跟踪服务，默认null
    if (null != traceDispatcher) {
        try {
            traceDispatcher.start(this.getNamesrvAddr(), this.getAccessChannel());
        } catch (MQClientException e) {
            log.warn("trace dispatcher start failed ", e);
        }
    }
}
```

defaultMQPushConsumerImpl#start方法。

**1、** checkConfig方法检查消费者的配置信息:如果consumerGroup为空,或者长度大于255个字符,或者包含非法字符,或者消费者组名为默认组名DEFAULT_CONSUMER,或者messageModel为空,或者consumeFromWhere为空,或者consumeTimestamp为空,或者allocateMessageQueueStrategy为空,满足以上任意条件都校验不通过抛出异常；

**2、** 调用copySubscription方法,拷贝订阅关系,然后为集群消费模式的消费者配置重试主题用于实现消费重试；

**3、** 调用getOrCreateMQClientInstance方法,根据clientId获取或者创建CreateMQClientInstance实例,并赋给mQClientFactory变量；

**4、** 设置负载均衡服务rebalanceImpl的相关属性；

**5、** 创建消息拉取核心对象PullAPIWrapper,封装了消息拉取以及结果解析逻辑的api；

**6、** 根据消息模式设置不同的OffsetStore,用于实现消费者的消息消费偏移量offset的管理如果是广播消费模式,是LocalFileOffsetStore,offset存储在本地磁盘,如果是集群模式,是RemoteBrokerOffsetStore,offset存储在远程broker中；

**7、** 调用offsetStore.load加载消费偏移量,LocalFileOffsetStore会加载本地磁盘中的数据；

**8、** 根据消息监听器MessageListener的类型创建不同的消息消费服务ConsumeMessageService,MessageListenerOrderly类型表示顺序消费,创建ConsumeMessageOrderlyService,MessageListenerConcurrently类型表示并发消费,创建ConsumeMessageConcurrentlyService；

**9、** 调用consumeMessageService.start启动消息消费服务,消息拉取服务PullMessageService拉取到消息后,会构建ConsumeRequest对象交给consumeMessageService去消费；

**10、** 注册消费者组和消费者到MQClientInstance中的consumerTable中,如果没有注册成功,可能是因为同一个程序中存在同名消费者组的不同消费者,抛出异常；

11. mQClientFactory#start启动CreateMQClientInstance, 初始化netty服务、各种定时任务、拉取消息服务、rebalanceService服务等等。CreateMQClientInstance仅会被初始化一次
**12、** updateTopicSubscribeInfoWhenSubscriptionChanged方法:向NameServer拉取并更新当前消费者订阅的topic路由信息；

**13、** checkClientInBroker:随机选择一个Broker,发送检查客户端tag配置的请求,主要是检测Broker是否支持SQL92类型的tag过滤以及SQL92的tag语法是否正确；

**14、** sendHeartbeatToAllBrokerWithLock方法,发送心跳给所有broker,Broker接收到后,发送Code为NOTIFY_CONSUMER_IDS_CHANGED给Group下所有消费者,要求重新负载均衡；

**15、** rebalanceImmediately方法:唤醒负载均衡服务rebalanceService,主动进行一次MessageQueue的重平衡；

```java
/**
 * DefaultMQPushConsumerImpl的方法
 * <p>
 * 启动默认消费者实现
 */
public synchronized void start() throws MQClientException {
    //根据服务状态选择走不同的代码分支
    switch (this.serviceState) {
        /*
         * 服务仅仅创建，而不是启动状态，那么启动服务
         */
        case CREATE_JUST:
            log.info("the consumer [{}] start beginning. messageModel={}, isUnitMode={}", this.defaultMQPushConsumer.getConsumerGroup(),
                    this.defaultMQPushConsumer.getMessageModel(), this.defaultMQPushConsumer.isUnitMode());
            //首先修改服务状态为服务启动失败，如果最终启动成功则再修改为RUNNING
            this.serviceState = ServiceState.START_FAILED;
            /*
             * 1 检查消费者的配置信息
             *
             * 如果consumerGroup为空，或者长度大于255个字符，或者包含非法字符（正常的匹配模式为 ^[%|a-zA-Z0-9_-]+$），或者消费者组名为默认组名DEFAULT_CONSUMER
             * 或者messageModel为空，或者consumeFromWhere为空，或者consumeTimestamp为空，或者allocateMessageQueueStrategy为空……等等属性的空校验
             * 满足以上任意条件都校验不通过抛出异常。
             */
            this.checkConfig();
            /*
             * 2 拷贝拷贝订阅关系
             *
             * 为集群消费模式的消费者，配置其对应的重试主题 retryTopic = %RETRY% + consumerGroup
             * 并且设置当前消费者自动订阅该消费者组对应的重试topic，用于实现消费重试。
             */
            this.copySubscription();
            //如果是集群消费模式，如果instanceName为默认值 "DEFAULT"，那么改成 UtilAll.getPid() + "#" + System.nanoTime()
            if (this.defaultMQPushConsumer.getMessageModel() == MessageModel.CLUSTERING) {
                this.defaultMQPushConsumer.changeInstanceNameToPID();
            }
            /*
             * 3 获取MQClientManager实例，然后根据clientId获取或者创建CreateMQClientInstance实例，并赋给mQClientFactory变量
             *
             * MQClientInstance封装了RocketMQ底层网络处理API，Producer、Consumer都会使用到这个类，是Producer、Consumer与NameServer、Broker 打交道的网络通道。
             * 因此，同一个clientId对应同一个MQClientInstance实例就可以了，即同一个应用中的多个producer和consumer使用同一个MQClientInstance实例即可。
             */
            this.mQClientFactory = MQClientManager.getInstance().getOrCreateMQClientInstance(this.defaultMQPushConsumer, this.rpcHook);
            /*
             * 4 设置负载均衡服务的相关属性
             */
            this.rebalanceImpl.setConsumerGroup(this.defaultMQPushConsumer.getConsumerGroup());
            this.rebalanceImpl.setMessageModel(this.defaultMQPushConsumer.getMessageModel());
            this.rebalanceImpl.setAllocateMessageQueueStrategy(this.defaultMQPushConsumer.getAllocateMessageQueueStrategy());
            this.rebalanceImpl.setmQClientFactory(this.mQClientFactory);
            /*
             * 5 创建消息拉取核心对象PullAPIWrapper，封装了消息拉取及结果解析逻辑的API
             */
            this.pullAPIWrapper = new PullAPIWrapper(
                    mQClientFactory,
                    this.defaultMQPushConsumer.getConsumerGroup(), isUnitMode());
            //为PullAPIWrapper注册过滤消息的钩子函数
            this.pullAPIWrapper.registerFilterMessageHook(filterMessageHookList);
            /*
             * 6 根据消息模式设置不同的OffsetStore，用于实现消费者的消息消费偏移量offset的管理
             */
            if (this.defaultMQPushConsumer.getOffsetStore() != null) {
                this.offsetStore = this.defaultMQPushConsumer.getOffsetStore();
            } else {
                //根据不用的消费模式选择不同的OffsetStore实现
                switch (this.defaultMQPushConsumer.getMessageModel()) {
                    case BROADCASTING:
                        //如果是广播消费模式，则是LocalFileOffsetStore，消息消费进度即offset存储在本地磁盘中。
                        this.offsetStore = new LocalFileOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
                        break;
                    case CLUSTERING:
                        //如果是集群消费模式，则是RemoteBrokerOffsetStore，消息消费进度即offset存储在远程broker中。
                        this.offsetStore = new RemoteBrokerOffsetStore(this.mQClientFactory, this.defaultMQPushConsumer.getConsumerGroup());
                        break;
                    default:
                        break;
                }
                this.defaultMQPushConsumer.setOffsetStore(this.offsetStore);
            }
            /*
             * 7 加载消费偏移量，LocalFileOffsetStore会加载本地磁盘中的数据，RemoteBrokerOffsetStore则是一个空实现。
             */
            this.offsetStore.load();
            /*
             * 8 根据消息监听器的类型创建不同的消息消费服务
             */
            if (this.getMessageListenerInner() instanceof MessageListenerOrderly) {
                //如果是MessageListenerOrderly类型，则表示顺序消费，创建ConsumeMessageOrderlyService
                this.consumeOrderly = true;
                this.consumeMessageService =
                        new ConsumeMessageOrderlyService(this, (MessageListenerOrderly) this.getMessageListenerInner());
            } else if (this.getMessageListenerInner() instanceof MessageListenerConcurrently) {
                //如果是MessageListenerConcurrently类型，则表示并发消费，创建ConsumeMessageOrderlyService
                this.consumeOrderly = false;
                this.consumeMessageService =
                        new ConsumeMessageConcurrentlyService(this, (MessageListenerConcurrently) this.getMessageListenerInner());
            }
            //启动消息消费服务
            this.consumeMessageService.start();
            /*
             * 9 注册消费者组和消费者到MQClientInstance中的consumerTable中
             */
            boolean registerOK = mQClientFactory.registerConsumer(this.defaultMQPushConsumer.getConsumerGroup(), this);
            if (!registerOK) {
                //如果没注册成功，那么可能是因为同一个程序中存在同名消费者组的不同消费者
                this.serviceState = ServiceState.CREATE_JUST;
                this.consumeMessageService.shutdown(defaultMQPushConsumer.getAwaitTerminationMillisWhenShutdown());
                throw new MQClientException("The consumer group[" + this.defaultMQPushConsumer.getConsumerGroup()
                        + "] has been created before, specify another name please." + FAQUrl.suggestTodo(FAQUrl.GROUP_NAME_DUPLICATE_URL),
                        null);
            }
            /*
             * 10 启动CreateMQClientInstance客户端通信实例
             * netty服务、各种定时任务、拉取消息服务、rebalanceService服务
             */
            mQClientFactory.start();
            log.info("the consumer [{}] start OK.", this.defaultMQPushConsumer.getConsumerGroup());
            this.serviceState = ServiceState.RUNNING;
            break;
        /**
         * 服务状态是其他的，那么抛出异常，即start方法仅能调用一次
         */
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
    /*
     * 11 后续处理
     */
    /*
     * 向NameServer拉取并更新当前消费者订阅的topic路由信息
     */
    this.updateTopicSubscribeInfoWhenSubscriptionChanged();
    /*
     * 随机选择一个Broker，发送检查客户端tag配置的请求，主要是检测Broker是否支持SQL92类型的tag过滤以及SQL92的tag语法是否正确
     */
    this.mQClientFactory.checkClientInBroker();
    /*
     * 发送心跳信息给所有broker
     */
    this.mQClientFactory.sendHeartbeatToAllBrokerWithLock();
    /*
     * 唤醒负载均衡服务rebalanceService，进行重平衡
     */
    this.mQClientFactory.rebalanceImmediately();
}
```

#### 2.1 copySubscription拷贝订阅关系

该方法将defaultMQPushConsumer中的订阅关系Map集合subscription中的数据拷贝到RebalanceImpl的subscriptionInner中。

然后为集群消费模式的消费者配置重试主题用于实现消费重试。

```java
/**
 * DefaultMQPushConsumerImpl的方法
 * <p>
 * 拷贝订阅关系
 *
 * @throws MQClientException
 */
private void copySubscription() throws MQClientException {
    try {
        //将订阅关系拷贝到RebalanceImpl的subscriptionInner中
        Map<String, String> sub = this.defaultMQPushConsumer.getSubscription();
        if (sub != null) {
            for (final Map.Entry<String, String> entry : sub.entrySet()) {
                final String topic = entry.getKey();
                final String subString = entry.getValue();
                SubscriptionData subscriptionData = FilterAPI.buildSubscriptionData(topic, subString);
                this.rebalanceImpl.getSubscriptionInner().put(topic, subscriptionData);
            }
        }
        //如果messageListenerInner为null，那么将defaultMQPushConsumer的messageListener赋给DefaultMQPushConsumerImpl的messageListenerInner
        //在defaultMQPushConsumer的registerMessageListener方法中就已经赋值了
        if (null == this.messageListenerInner) {
            this.messageListenerInner = this.defaultMQPushConsumer.getMessageListener();
        }
        //消息消费模式
        switch (this.defaultMQPushConsumer.getMessageModel()) {
            //广播消费模式，消费失败消息会丢弃
            case BROADCASTING:
                break;
            //集群消费模式，支持消费失败重试
            //自动订阅该消费者组对应的重试topic，默认就是这个模式
            case CLUSTERING:
                //获取当前消费者对应的重试主题 retryTopic = %RETRY% + consumerGroup
                final String retryTopic = MixAll.getRetryTopic(this.defaultMQPushConsumer.getConsumerGroup());
                //当前消费者自动订阅该消费者组对应的重试topic，用于实现消费重试
                SubscriptionData subscriptionData = FilterAPI.buildSubscriptionData(retryTopic, SubscriptionData.SUB_ALL);
                this.rebalanceImpl.getSubscriptionInner().put(retryTopic, subscriptionData);
                break;
            default:
                break;
        }
    } catch (Exception e) {
        throw new MQClientException("subscription exception", e);
    }
}
```

### 3.总结

Consumer消费者启动的主要流程:

**1、** rebalanceService:消费者负载均衡服务,用于确定消费者的消息队列以及负载均衡,同时触发pullMessageService拉取消息的入口MQClientInstance启动,同一个服务器的所有Consumer使用同一个实例；

**2、** pullMessageService:拉取消息服务,由MQClientInstance启动,同一个服务器的所有Consumer使用同一个实例；

**3、** consumeMessageService:消费者消费消息服务,消息拉取到后,交给这个服务DefaultMQPushConsumerImpl启动,每个Consumer持有一个实例；

**4、** OffsetStore:管理消费点位的上报持久化,DefaultMQPushConsumerImpl启动,每个Consumer持有一个实例；
