# 05、RocketMQ 源码解析 - Producer消息发送
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/5.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## Producer启动流程

DefaultMQProducer是默认的Producer实现类，它是发送消息的应用程序的入口类，包含一些基本的配置和方法DefaultMQProducer主要委托DefaultMQProducerImpl；

```java
public class DefaultMQProducer extends ClientConfig implements MQProducer {
		// 委托类
    protected final transient DefaultMQProducerImpl defaultMQProducerImpl;
    // 生产者所属组，消息服务器在回查事务状态时会随机选择该组中任何一个生产者发起事务回查请求
    private String producerGroup;
		// 默认的topic名称:TBW102
    private String createTopicKey = MixAll.AUTO_CREATE_TOPIC_KEY_TOPIC;
		// 默认topic的队列数量
    private volatile int defaultTopicQueueNums = 4;
		// 消息发送默认超时时间
    private int sendMsgTimeout = 3000;
		// 默认消息body超过4k就压缩
    private int compressMsgBodyOverHowmuch = 1024 * 4;
		// 同步方式发送消息重试次数，默认2次，共执行1+2次
    private int retryTimesWhenSendFailed = 2;
		// 异步方式发送消息重试次数，默认2次，共执行1+2次
    private int retryTimesWhenSendAsyncFailed = 2;
		// 消息重试时选择另一个Broker，是否等待存储结果返回，默认为false
    private boolean retryAnotherBrokerWhenNotStoreOK = false;
		// 允许最大的消息大小，默认4MB
    private int maxMessageSize = 1024 * 1024 * 4; // 4M
		//启动方法
    @Override
    public void start() throws MQClientException {
        this.defaultMQProducerImpl.start();
    }
		...省略发送的相关方法...
}
```

1. DefaultMQProducerImpl#start(boolean)启动流程

- 校验ProductGroup名称，不能为空，必须符合正则`^[%|a-zA-Z0-9_-]+$`,长度不能大于255，不能是`CLIENT_INNER_PRODUCER`
- 改变生产者instanceName为Pid
- 创建MQClientInstance实例，MQClientManager是一个单例类，它维护一个MQClientInstance实例的缓存。同一个ClientId只会创建一个MQClientInstance实例。ClientId的构建规则为`clientIP@instanceName@unitName`，其中unitName是可选的。因为上面把instanceName改为了PID，所以避免同一台机器不同进程相互影响。MQClientInstance实例封装了网络处理相关API

```java
ClientConfig#buildMQClientId 构建ClientId
public String buildMQClientId() {
StringBuilder sb = new StringBuilder();
sb.append(this.getClientIP());
sb.append("@");
sb.append(this.getInstanceName());
if (!UtilAll.isBlank(this.unitName)) {
   sb.append("@");
   sb.append(this.unitName);
}
return sb.toString();
}
public class MQClientManager {
private final static InternalLogger log = ClientLogger.getLog();
 //单例
private static MQClientManager instance = new MQClientManager();
private AtomicInteger factoryIndexGenerator = new AtomicInteger();
private ConcurrentMap<String/* clientId */, MQClientInstance> factoryTable =
   new ConcurrentHashMap<String, MQClientInstance>();
private MQClientManager() {
}
 ...省略...
}  
```

- 缓存当前Producer(DefaultMQProducerImpl)到MQClientInstance，方便后续调用网络请求
- 启动MQClientInstance实例

**3、** Producer启动流程图；

## 消息发送

**1、** 从Remoting模块知道，消息发送支持3种方式：**同步(sync)、异步(async)、单程(oneway)**；

**2、** 消息发送需要考虑几个问题；

- 消息队列如何进行负载均衡
- 消息发送如何实现高可用
- 批量发送如何实现一致性

**3、** 相关类介绍；

- **Message**:请求的消息
- **DefaultMQProducerImpl**:DefaultMQProducer委托DefaultMQProducerImpl实现所有逻辑
- **MQClientInstance**:封装了网络处理API，是Producer、Consumer与NameServer、Broker通信的网络
- **MQClientManager**:缓存MQClientInstance
- **MQClientAPIImpl**:封装与broker交互的命令请求

**4、** Message类和MessageFlag；

```java
public class Message implements Serializable {
    private static final long serialVersionUID = 8445773977080406428L;
    private String topic;
    // 消息标记
    private int flag;
    /**
     * 扩展属性
     *  tag:消息TAG，用于消息过滤
     *  keys:消息索引键，多个用空格隔开
     *  waitStoreMsgOk:消息发送时是否等消息存储完后再返回
     *  delayTimeLevel:消息延迟级别，用于定时消息或者消息重试
     *  内置属性定义在org.apache.rocketmq.common.message.MessageConst
     */
    private Map<String, String> properties;
    private byte[] body;
    //事务Id
    private String transactionId;
	  ...省略...
}  
public class MessageSysFlag {
    public final static int COMPRESSED_FLAG = 0x1; //0001
    public final static int MULTI_TAGS_FLAG = 0x1 << 1; //0010
    public final static int TRANSACTION_NOT_TYPE = 0;//0000
    public final static int TRANSACTION_PREPARED_TYPE = 0x1 << 2;//0100
    public final static int TRANSACTION_COMMIT_TYPE = 0x2 << 2;//1000
    public final static int TRANSACTION_ROLLBACK_TYPE = 0x3 << 2;//1100
    public static int getTransactionValue(final int flag) {
        return flag & TRANSACTION_ROLLBACK_TYPE;
    }
    public static int resetTransactionValue(final int flag, final int type) {
        return (flag & (~TRANSACTION_ROLLBACK_TYPE)) | type;
    }
    public static int clearCompressedFlag(final int flag) {
        return flag & (~COMPRESSED_FLAG);
    }
}
```

### 发送核心流程

**1、** 消息发送的主要流程；

- 验证消息和topic
- 查找路由
- 通过负载均衡策略选择一个消息队列
- 消息发送

**2、** 核心流程；

**3、** 默认消息发送是同步发送(`CommunicationMode.SYNC`),默认超时时间3sDefaultMQProducer默认委托DefaultMQProducerImpl进行消息发送；

```java
DefaultMQProducer#send(Message)  								 @1
  	->DefaultMQProducerImpl#send(Message, long)  @2
  		->DefaultMQProducerImpl#sendDefaultImpl		 @3
@1
public SendResult send(
    Message msg) throws MQClientException, RemotingException, MQBrokerException, InterruptedException {
    return this.defaultMQProducerImpl.send(msg);
}
@2
public SendResult send(
    Message msg) throws MQClientException, RemotingException, MQBrokerException, InterruptedException {
    return send(msg, this.defaultMQProducer.getSendMsgTimeout());
}
@3
public SendResult send(Message msg,
    long timeout) throws MQClientException, RemotingException, MQBrokerException, InterruptedException {
    return this.sendDefaultImpl(msg, CommunicationMode.SYNC, null, timeout);
}
```

### 发送核心代码

1. DefaultMQProducerImpl#sendDefaultImpl是消息发送的核心方法

```java
private SendResult sendDefaultImpl(
    Message msg,
    final CommunicationMode communicationMode,
    final SendCallback sendCallback,
    final long timeout
) throws MQClientException, RemotingException, MQBrokerException, InterruptedException {
    this.makeSureStateOK();
    Validators.checkMessage(msg, this.defaultMQProducer);
    final long invokeID = random.nextLong();
    long beginTimestampFirst = System.currentTimeMillis();
    long beginTimestampPrev = beginTimestampFirst;
    long endTimestamp = beginTimestampFirst;
    //查找topic路由信息
    TopicPublishInfo topicPublishInfo = this.tryToFindTopicPublishInfo(msg.getTopic());
    if (topicPublishInfo != null && topicPublishInfo.ok()) {
        boolean callTimeout = false;
        MessageQueue mq = null;
        Exception exception = null;
        SendResult sendResult = null;
        //同步发送，默认是1+2次重试
        int timesTotal = communicationMode == CommunicationMode.SYNC ? 1 + this.defaultMQProducer.getRetryTimesWhenSendFailed() : 1;
        //第几次发送
        int times = 0;
        String[] brokersSent = new String[timesTotal];
        //循环调用发送消息直到成功
        for (; times < timesTotal; times++) {
            String lastBrokerName = null == mq ? null : mq.getBrokerName();
            //选择队列
            MessageQueue mqSelected = this.selectOneMessageQueue(topicPublishInfo, lastBrokerName);
            if (mqSelected != null) {
                mq = mqSelected;
                brokersSent[times] = mq.getBrokerName();
                try {
                    beginTimestampPrev = System.currentTimeMillis();
                    //判断是否超时
                    long costTime = beginTimestampPrev - beginTimestampFirst;
                    if (timeout < costTime) {
                        callTimeout = true;
                        break;
                    }
                    //发送消息核心方法
                    sendResult = this.sendKernelImpl(msg, mq, communicationMode, sendCallback, topicPublishInfo, timeout - costTime);
                    endTimestamp = System.currentTimeMillis();
                    this.updateFaultItem(mq.getBrokerName(), endTimestamp - beginTimestampPrev, false);
                    switch (communicationMode) {
                        case ASYNC:
                            return null;
                        case ONEWAY:
                            return null;
                        case SYNC:
                            if (sendResult.getSendStatus() != SendStatus.SEND_OK) {
                                //默认false
                                if (this.defaultMQProducer.isRetryAnotherBrokerWhenNotStoreOK()) {
                                    continue;
                                }
                            }
                            return sendResult;
                        default:
                            break;
                    }
                } catch (RemotingException e) {
                    endTimestamp = System.currentTimeMillis();
                    this.updateFaultItem(mq.getBrokerName(), endTimestamp - beginTimestampPrev, true);
                    log.warn(String.format("sendKernelImpl exception, resend at once, InvokeID: %s, RT: %sms, Broker: %s", invokeID, endTimestamp - beginTimestampPrev, mq), e);
                    log.warn(msg.toString());
                    exception = e;
                    continue;
                } catch (MQClientException e) {
                    endTimestamp = System.currentTimeMillis();
                    this.updateFaultItem(mq.getBrokerName(), endTimestamp - beginTimestampPrev, true);
                    log.warn(String.format("sendKernelImpl exception, resend at once, InvokeID: %s, RT: %sms, Broker: %s", invokeID, endTimestamp - beginTimestampPrev, mq), e);
                    log.warn(msg.toString());
                    exception = e;
                    continue;
                } catch (MQBrokerException e) {
                    endTimestamp = System.currentTimeMillis();
                    this.updateFaultItem(mq.getBrokerName(), endTimestamp - beginTimestampPrev, true);
                    log.warn(String.format("sendKernelImpl exception, resend at once, InvokeID: %s, RT: %sms, Broker: %s", invokeID, endTimestamp - beginTimestampPrev, mq), e);
                    log.warn(msg.toString());
                    exception = e;
                    switch (e.getResponseCode()) {
                        // 以下响应码，进行发送消息重试
                        case ResponseCode.TOPIC_NOT_EXIST:
                        case ResponseCode.SERVICE_NOT_AVAILABLE:
                        case ResponseCode.SYSTEM_ERROR:
                        case ResponseCode.NO_PERMISSION:
                        case ResponseCode.NO_BUYER_ID:
                        case ResponseCode.NOT_IN_CURRENT_UNIT:
                            continue;
                        default:
                            if (sendResult != null) {
                                return sendResult;
                            }
                            throw e;
                    }
                } catch (InterruptedException e) {
                    endTimestamp = System.currentTimeMillis();
                    this.updateFaultItem(mq.getBrokerName(), endTimestamp - beginTimestampPrev, false);
                    //这一堆日志打的真是搞笑
                    log.warn(String.format("sendKernelImpl exception, throw exception, InvokeID: %s, RT: %sms, Broker: %s", invokeID, endTimestamp - beginTimestampPrev, mq), e);
                    log.warn(msg.toString());
                    log.warn("sendKernelImpl exception", e);
                    log.warn(msg.toString());
                    throw e;
                }
            } else {
                break;
            }
        }
        if (sendResult != null) {
            return sendResult;
        }
        String info = String.format("Send [%d] times, still failed, cost [%d]ms, Topic: %s, BrokersSent: %s",
            times,
            System.currentTimeMillis() - beginTimestampFirst,
            msg.getTopic(),
            Arrays.toString(brokersSent));
        info += FAQUrl.suggestTodo(FAQUrl.SEND_MSG_FAILED);
        MQClientException mqClientException = new MQClientException(info, exception);
        if (callTimeout) {
            throw new RemotingTooMuchRequestException("sendDefaultImpl call timeout");
        }
        if (exception instanceof MQBrokerException) {
            mqClientException.setResponseCode(((MQBrokerException) exception).getResponseCode());
        } else if (exception instanceof RemotingConnectException) {
            mqClientException.setResponseCode(ClientErrorCode.CONNECT_BROKER_EXCEPTION);
        } else if (exception instanceof RemotingTimeoutException) {
            mqClientException.setResponseCode(ClientErrorCode.ACCESS_BROKER_TIMEOUT);
        } else if (exception instanceof MQClientException) {
            mqClientException.setResponseCode(ClientErrorCode.BROKER_NOT_EXIST_EXCEPTION);
        }
        throw mqClientException;
    }
    List<String> nsList = this.getmQClientFactory().getMQClientAPIImpl().getNameServerAddressList();
    if (null == nsList || nsList.isEmpty()) {
        throw new MQClientException(
            "No name server address, please set it." + FAQUrl.suggestTodo(FAQUrl.NAME_SERVER_ADDR_NOT_EXIST_URL), null).setResponseCode(ClientErrorCode.NO_NAME_SERVER_EXCEPTION);
    }
    throw new MQClientException("No route info of this topic, " + msg.getTopic() + FAQUrl.suggestTodo(FAQUrl.NO_TOPIC_ROUTE_INFO),
        null).setResponseCode(ClientErrorCode.NOT_FOUND_TOPIC_EXCEPTION);
}
```

1. DefaultMQProducerImpl#sendKernelImpl:大致的过程

- 获取Broker网络地址
- 为消息设置全局唯一ID，判断消息是否需要压缩，如果需要则采用zip压缩并设置标志位
- 如果注册了钩子函数，则发送前先执行钩子函数（SendMessageContext）
- 构建发送消息的请求数据包，调用MQClientInstance进行网络交互（根据消息发送方式进行网络传输）
- 如果注册了钩子函数，则发送后，执行after逻辑（无论成功还是抛出异常，after钩子函数都会执行，实际上应该写一个异常钩子方法与成功的区分出来）

```java
// Message 待发送的消息
// MessageQueue 发送的消息队列
// CommunicationMode消息发送模式，包括SYNC、ASYNC、ONEWAY
// SendCallback 发送回调方法
// TopicPublishInfo topic路由信息
// timeout 发送超时时间
private SendResult sendKernelImpl(final Message msg,
                                  final MessageQueue mq,
                               final CommunicationMode communicationMode,
                                  final SendCallback sendCallback,
                               final TopicPublishInfo topicPublishInfo,
                                  final long timeout) throws MQClientException, RemotingException, MQBrokerException, InterruptedException {
 long beginStartTime = System.currentTimeMillis();
  	// 获取Broker地址，如果未缓存该Broker信息，则从NameServer主动更新一下Topic信息 
    String brokerAddr = this.mQClientFactory.findBrokerAddressInPublish(mq.getBrokerName());
    if (null == brokerAddr) {
        tryToFindTopicPublishInfo(mq.getTopic());
        brokerAddr = this.mQClientFactory.findBrokerAddressInPublish(mq.getBrokerName());
    }
    SendMessageContext context = null;
    if (brokerAddr != null) {
        // 是否使用 broker vip 通道 broker 会开启两个端口对外服务
        brokerAddr = MixAll.brokerVIPChannel(this.defaultMQProducer.isSendMessageWithVIPChannel(), brokerAddr);
        byte[] prevBody = msg.getBody();
        try {
            //for MessageBatch,ID has been set in the generating process
            if (!(msg instanceof MessageBatch)) {
               // 为消息设置全局唯一ID
                MessageClientIDSetter.setUniqID(msg);
            }
            int sysFlag = 0;
            boolean msgBodyCompressed = false;
            // 消息体默认超过4KB,则对消息体采用zip压缩,并设置压缩标志位
            if (this.tryToCompressMessage(msg)) {
                sysFlag |= MessageSysFlag.COMPRESSED_FLAG;
                msgBodyCompressed = true;
            }
            //事务消息
            final String tranMsg = msg.getProperty(MessageConst.PROPERTY_TRANSACTION_PREPARED);
            if (tranMsg != null && Boolean.parseBoolean(tranMsg)) {
                sysFlag |= MessageSysFlag.TRANSACTION_PREPARED_TYPE;
            }
            // 如果注册了发送钩子函数，则执行
            if (hasCheckForbiddenHook()) {
                CheckForbiddenContext checkForbiddenContext = new CheckForbiddenContext();
                checkForbiddenContext.setNameSrvAddr(this.defaultMQProducer.getNamesrvAddr());
                checkForbiddenContext.setGroup(this.defaultMQProducer.getProducerGroup());
                checkForbiddenContext.setCommunicationMode(communicationMode);
                checkForbiddenContext.setBrokerAddr(brokerAddr);
                checkForbiddenContext.setMessage(msg);
                checkForbiddenContext.setMq(mq);
                checkForbiddenContext.setUnitMode(this.isUnitMode());
                this.executeCheckForbiddenHook(checkForbiddenContext);
            }
            //发送消息前的hook
            if (this.hasSendMessageHook()) {
                context = new SendMessageContext();
                context.setProducer(this);
                context.setProducerGroup(this.defaultMQProducer.getProducerGroup());
                context.setCommunicationMode(communicationMode);
                context.setBornHost(this.defaultMQProducer.getClientIP());
                context.setBrokerAddr(brokerAddr);
                context.setMessage(msg);
                context.setMq(mq);
                String isTrans = msg.getProperty(MessageConst.PROPERTY_TRANSACTION_PREPARED);
                if (isTrans != null && isTrans.equals("true")) {
                    context.setMsgType(MessageType.Trans_Msg_Half);
                }
                if (msg.getProperty("__STARTDELIVERTIME") != null || msg.getProperty(MessageConst.PROPERTY_DELAY_TIME_LEVEL) != null) {
                    context.setMsgType(MessageType.Delay_Msg);
                }
                this.executeSendMessageHookBefore(context);
            }
            //构建发送的消息
            SendMessageRequestHeader requestHeader = new SendMessageRequestHeader();
            requestHeader.setProducerGroup(this.defaultMQProducer.getProducerGroup());
            requestHeader.setTopic(msg.getTopic());
            requestHeader.setDefaultTopic(this.defaultMQProducer.getCreateTopicKey());
            requestHeader.setDefaultTopicQueueNums(this.defaultMQProducer.getDefaultTopicQueueNums());
            requestHeader.setQueueId(mq.getQueueId());
            requestHeader.setSysFlag(sysFlag);
            requestHeader.setBornTimestamp(System.currentTimeMillis());
            requestHeader.setFlag(msg.getFlag());
            requestHeader.setProperties(MessageDecoder.messageProperties2String(msg.getProperties()));
            requestHeader.setReconsumeTimes(0);
            requestHeader.setUnitMode(this.isUnitMode());
            requestHeader.setBatch(msg instanceof MessageBatch);
            if (requestHeader.getTopic().startsWith(MixAll.RETRY_GROUP_TOPIC_PREFIX)) {
                String reconsumeTimes = MessageAccessor.getReconsumeTime(msg);
                if (reconsumeTimes != null) {
                    requestHeader.setReconsumeTimes(Integer.valueOf(reconsumeTimes));
                    MessageAccessor.clearProperty(msg, MessageConst.PROPERTY_RECONSUME_TIME);
                }
                String maxReconsumeTimes = MessageAccessor.getMaxReconsumeTimes(msg);
                if (maxReconsumeTimes != null) {
                    requestHeader.setMaxReconsumeTimes(Integer.valueOf(maxReconsumeTimes));
                    MessageAccessor.clearProperty(msg, MessageConst.PROPERTY_MAX_RECONSUME_TIMES);
                }
            }
            SendResult sendResult = null;
            switch (communicationMode) {
                case ASYNC:
                    Message tmpMessage = msg;
                    if (msgBodyCompressed) {
                        //If msg body was compressed, msgbody should be reset using prevBody.
                        //Clone new message using commpressed message body and recover origin massage.
                        //Fix bug:https://github.com/apache/rocketmq-externals/issues/66
                        tmpMessage = MessageAccessor.cloneMessage(msg);
                        msg.setBody(prevBody);
                    }
                    long costTimeAsync = System.currentTimeMillis() - beginStartTime;
                    if (timeout < costTimeAsync) {
                        throw new RemotingTooMuchRequestException("sendKernelImpl call timeout");
                    }
                    sendResult = this.mQClientFactory.getMQClientAPIImpl().sendMessage(
                        brokerAddr,
                        mq.getBrokerName(),
                        tmpMessage,
                        requestHeader,
                        timeout - costTimeAsync,
                        communicationMode,
                        sendCallback,
                        topicPublishInfo,
                        this.mQClientFactory,
                        this.defaultMQProducer.getRetryTimesWhenSendAsyncFailed(),
                        context,
                        this);
                    break;
                case ONEWAY:
                case SYNC:
                    long costTimeSync = System.currentTimeMillis() - beginStartTime;
                    if (timeout < costTimeSync) {
                        throw new RemotingTooMuchRequestException("sendKernelImpl call timeout");
                    }
                    sendResult = this.mQClientFactory.getMQClientAPIImpl().sendMessage(
                        brokerAddr,
                        mq.getBrokerName(),
                        msg,
                        requestHeader,
                        timeout - costTimeSync,
                        communicationMode,
                        context,
                        this);
                    break;
                default:
                    assert false;
                    break;
            }
            if (this.hasSendMessageHook()) {
                context.setSendResult(sendResult);
                this.executeSendMessageHookAfter(context);
            }
            return sendResult;
        } catch (RemotingException e) {
            if (this.hasSendMessageHook()) {
                context.setException(e);
                this.executeSendMessageHookAfter(context);
            }
            throw e;
        } catch (MQBrokerException e) {
            if (this.hasSendMessageHook()) {
                context.setException(e);
                this.executeSendMessageHookAfter(context);
            }
            throw e;
        } catch (InterruptedException e) {
            if (this.hasSendMessageHook()) {
                context.setException(e);
                this.executeSendMessageHookAfter(context);
            }
            throw e;
        } finally {
            msg.setBody(prevBody);
        }
    }
    throw new MQClientException("The broker[" + mq.getBrokerName() + "] not exist", null);
}
```

### 验证消息和topic

**1、** 校验topic；

- topic最大字符小于等于255
- topic只能是字符`%|a-zA-Z0-9_-`
- topic名称不能是`TBW102`

**2、** 校验消息的body:body必须大于0，并且不能大于最大消息大小(默认4MB)；

**3、** 验证消息代码；

```java
public static void checkMessage(Message msg, DefaultMQProducer defaultMQProducer)
    throws MQClientException {
    if (null == msg) {
        throw new MQClientException(ResponseCode.MESSAGE_ILLEGAL, "the message is null");
    }
    // topic
    Validators.checkTopic(msg.getTopic());
    // body
    if (null == msg.getBody()) {
        throw new MQClientException(ResponseCode.MESSAGE_ILLEGAL, "the message body is null");
    }
    if (0 == msg.getBody().length) {
        throw new MQClientException(ResponseCode.MESSAGE_ILLEGAL, "the message body length is zero");
    }
            //默认4MB
    if (msg.getBody().length > defaultMQProducer.getMaxMessageSize()) {
        throw new MQClientException(ResponseCode.MESSAGE_ILLEGAL,
            "the message body size over max value, MAX: " + defaultMQProducer.getMaxMessageSize());
    }
}
```

### 查找路由

**1、** 如果本地缓存了topic的路由信息，则直接返回，否则请求NameServer查询，如果没找到，则抛出异常；

**2、** 查找路由的核心方法`tryToFindTopicPublishInfo`,如果路由信息包含了消息队列，则直接返回路由信息，如果没有缓存或者包含消息队列，则请求nameServer并更新本地缓存；

```java
private TopicPublishInfo tryToFindTopicPublishInfo(final String topic) {
    //1. 从缓存中获取topic信息
    TopicPublishInfo topicPublishInfo = this.topicPublishInfoTable.get(topic);
    if (null == topicPublishInfo || !topicPublishInfo.ok()) {
        this.topicPublishInfoTable.putIfAbsent(topic, new TopicPublishInfo());
        //2. 从当前topic中去查找
        this.mQClientFactory.updateTopicRouteInfoFromNameServer(topic);
        topicPublishInfo = this.topicPublishInfoTable.get(topic);
    }
    if (topicPublishInfo.isHaveTopicRouterInfo() || topicPublishInfo.ok()) {
        return topicPublishInfo;
    } else {
        //从默认主题查询
        this.mQClientFactory.updateTopicRouteInfoFromNameServer(topic, true, this.defaultMQProducer);
        topicPublishInfo = this.topicPublishInfoTable.get(topic);
        return topicPublishInfo;
    }
}
```

**3、**`TopicPublishInfo`和`TopicRouteData`；

```java
public class TopicPublishInfo {
    //是否是顺序消息
    private boolean orderTopic = false;
    private boolean haveTopicRouterInfo = false;
    //topic对应的消息队列列表
    private List<MessageQueue> messageQueueList = new ArrayList<MessageQueue>();
    private volatile ThreadLocalIndex sendWhichQueue = new ThreadLocalIndex();
    private TopicRouteData topicRouteData;
  	...省略...
}  
public class TopicRouteData extends RemotingSerializable {
    private String orderTopicConf;
    //队列数据
    private List<QueueData> queueDatas;
    private List<BrokerData> brokerDatas;
    //过滤服务器地址列表
    private HashMap<String/* brokerAddr */, List<String>/* Filter Server */> filterServerTable;
	  ...省略...
}
```

**4、** MQClientInstance#updateTopicRouteInfoFromNameServer请求NameServer并更新本地路由缓存

- 如果是查询默认主题，替换路由信息的读写队列个数
- 如果是自定义主题，请求后对比本地缓存与Broker是否有差异，如果有则更新本地缓存
- 更新MQProducerInner中的路由信息
- 更新MQConsumerInner中的队列信息

**5、** 代码；

```java
public boolean updateTopicRouteInfoFromNameServer(final String topic, boolean isDefault,
    DefaultMQProducer defaultMQProducer) {
    try {
        if (this.lockNamesrv.tryLock(LOCK_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS)) {
            try {
                TopicRouteData topicRouteData;
                if (isDefault && defaultMQProducer != null) {
                    //从默认topic获取路由信息，默认超时时间3s
                    topicRouteData = this.mQClientAPIImpl.getDefaultTopicRouteInfoFromNameServer(defaultMQProducer.getCreateTopicKey(),
                        1000 * 3);
                    if (topicRouteData != null) {
                        for (QueueData data : topicRouteData.getQueueDatas()) {
                            //默认队列数量4
                            int queueNums = Math.min(defaultMQProducer.getDefaultTopicQueueNums(), data.getReadQueueNums());
                            data.setReadQueueNums(queueNums);
                            data.setWriteQueueNums(queueNums);
                        }
                    }
                } else {
                    //调用MQClientAPIImpl请求Broker
                    topicRouteData = this.mQClientAPIImpl.getTopicRouteInfoFromNameServer(topic, 1000 * 3);
                }
                if (topicRouteData != null) {
                    TopicRouteData old = this.topicRouteTable.get(topic);
                    //对比本地与服务器的路由信息
                    boolean changed = topicRouteDataIsChange(old, topicRouteData);
                    if (!changed) {
                        changed = this.isNeedUpdateTopicRouteInfo(topic);
                    } else {
                        log.info("the topic[{}] route info changed, old[{}] ,new[{}]", topic, old, topicRouteData);
                    }
                    if (changed) {
                        TopicRouteData cloneTopicRouteData = topicRouteData.cloneTopicRouteData();
                        for (BrokerData bd : topicRouteData.getBrokerDatas()) {
                            this.brokerAddrTable.put(bd.getBrokerName(), bd.getBrokerAddrs());
                        }
                        // Update Pub info
                        {
                            TopicPublishInfo publishInfo = topicRouteData2TopicPublishInfo(topic, topicRouteData);
                            publishInfo.setHaveTopicRouterInfo(true);
                            Iterator<Entry<String, MQProducerInner>> it = this.producerTable.entrySet().iterator();
                            while (it.hasNext()) {
                                Entry<String, MQProducerInner> entry = it.next();
                                MQProducerInner impl = entry.getValue();
                                if (impl != null) {
                                    impl.updateTopicPublishInfo(topic, publishInfo);
                                }
                            }
                        }
                        // Update sub info
                        {
                            Set<MessageQueue> subscribeInfo = topicRouteData2TopicSubscribeInfo(topic, topicRouteData);
                            Iterator<Entry<String, MQConsumerInner>> it = this.consumerTable.entrySet().iterator();
                            while (it.hasNext()) {
                                Entry<String, MQConsumerInner> entry = it.next();
                                MQConsumerInner impl = entry.getValue();
                                if (impl != null) {
                                    impl.updateTopicSubscribeInfo(topic, subscribeInfo);
                                }
                            }
                        }
                        log.info("topicRouteTable.put. Topic = {}, TopicRouteData[{}]", topic, cloneTopicRouteData);
                        this.topicRouteTable.put(topic, cloneTopicRouteData);
                        return true;
                    }
                } else {
                    log.warn("updateTopicRouteInfoFromNameServer, getTopicRouteInfoFromNameServer return null, Topic: {}", topic);
                }
            } catch (Exception e) {
                if (!topic.startsWith(MixAll.RETRY_GROUP_TOPIC_PREFIX) && !topic.equals(MixAll.AUTO_CREATE_TOPIC_KEY_TOPIC)) {
                    log.warn("updateTopicRouteInfoFromNameServer Exception", e);
                }
            } finally {
                this.lockNamesrv.unlock();
            }
        } else {
            log.warn("updateTopicRouteInfoFromNameServer tryLock timeout {}ms", LOCK_TIMEOUT_MILLIS);
        }
    } catch (InterruptedException e) {
        log.warn("updateTopicRouteInfoFromNameServer Exception", e);
    }
    return false;
}
```

### 选择队列

1. DefaultMQProducerImpl#selectOneMessageQueue

```java
public MessageQueue selectOneMessageQueue(final TopicPublishInfo tpInfo, final String lastBrokerName) {
    return this.mqFaultStrategy.selectOneMessageQueue(tpInfo, lastBrokerName);
}
```

1. MQFaultStrategy#selectOneMessageQueue：如果sendLatencyFaultEnable=true（默认不启用Broker故障延迟机制，即false）。伦旭获取一个想消息队列，判断消息队列是否可用，直接返回。

```java
public MessageQueue selectOneMessageQueue(final TopicPublishInfo tpInfo, final String lastBrokerName) {
    //是否启用故障延迟机制，默认false
    if (this.sendLatencyFaultEnable) {
        try {
            int index = tpInfo.getSendWhichQueue().getAndIncrement();
            for (int i = 0; i < tpInfo.getMessageQueueList().size(); i++) {
                int pos = Math.abs(index++) % tpInfo.getMessageQueueList().size();
                if (pos < 0)
                    pos = 0;
                //获取消息队列
                MessageQueue mq = tpInfo.getMessageQueueList().get(pos);
                //验证该消息队列是否可用，如果可用直接返回（上一次没有broker故障）
                //如果选择的消息队列的brokerName与上一次故障的一样（但是目前已经可用）则返回
                if (latencyFaultTolerance.isAvailable(mq.getBrokerName())) {
                    if (null == lastBrokerName || mq.getBrokerName().equals(lastBrokerName))
                        return mq;
                }
            }
            //从因为故障而规避的broker中选择一个可用的broker
            final String notBestBroker = latencyFaultTolerance.pickOneAtLeast();
            //如果没有则返回-1
            int writeQueueNums = tpInfo.getQueueIdByBroker(notBestBroker);
            if (writeQueueNums > 0) {
                final MessageQueue mq = tpInfo.selectOneMessageQueue();
                if (notBestBroker != null) {
                    mq.setBrokerName(notBestBroker);
                    mq.setQueueId(tpInfo.getSendWhichQueue().getAndIncrement() % writeQueueNums);
                }
                return mq;
            } else {
                latencyFaultTolerance.remove(notBestBroker);
            }
        } catch (Exception e) {
            log.error("Error occurred when selecting message queue", e);
        }
        return tpInfo.selectOneMessageQueue();
    }
    return tpInfo.selectOneMessageQueue(lastBrokerName);
}
```

1. TopicPublishInfo#selectOneMessageQueue(java.lang.String):如果sendLatencyFaultEnable=false（默认），直接规避上次发送失败的brokerName，避免再次失败

```java
public MessageQueue selectOneMessageQueue(final String lastBrokerName) {
    //lastBrokerName表示上一次发送消息失败的broker，第一次执行为空
    if (lastBrokerName == null) {
        return selectOneMessageQueue();
    } else {
        int index = this.sendWhichQueue.getAndIncrement();
        for (int i = 0; i < this.messageQueueList.size(); i++) {
            //与当前路由中消息队列个数取模
            int pos = Math.abs(index++) % this.messageQueueList.size();
            if (pos < 0)
                pos = 0;
            MessageQueue mq = this.messageQueueList.get(pos);
           //规避上次发送失败的brokerName，避免再次失败
            if (!mq.getBrokerName().equals(lastBrokerName)) {
                return mq;
            }
        }
        return selectOneMessageQueue();
    }
}
public MessageQueue selectOneMessageQueue() {
    int index = this.sendWhichQueue.getAndIncrement();
    int pos = Math.abs(index) % this.messageQueueList.size();
    if (pos < 0)
        pos = 0;
    return this.messageQueueList.get(pos);
}
```

## 故障延迟机制

**1、** 开启故障延迟机制，**sendLatencyFaultEnable=true**，当消息发送者遇到一次消息发送事变，此时就认为Broker不可用，在接下来的一段时间内不再向其发送消息；

**2、** 不开启故障延迟机制（默认不开启），就只会在本次消息发送的重试过程中规避该broker，下一次消息发送还会继续尝试发送；

**3、** 故障延迟机制UML类图；

**4、**`FaultItem`；

```java
class FaultItem implements Comparable<FaultItem> {
    //brokeName
    private final String name;
    //延迟级别，
    private volatile long currentLatency;
    //延迟时间，即不可利用的截止时间
    private volatile long startTimestamp;
		//延迟时间已过，表示可利用
    public boolean isAvailable() {
        return (System.currentTimeMillis() - startTimestamp) >= 0;
    }
     /**
     * 可用性 > 延迟 > 开始可用时间
     * 升序
     */
    @Override
    public int compareTo(final FaultItem other) {
        if (this.isAvailable() != other.isAvailable()) {
            if (this.isAvailable())
                return -1;
            if (other.isAvailable())
                return 1;
        }
        if (this.currentLatency < other.currentLatency)
            return -1;
        else if (this.currentLatency > other.currentLatency) {
            return 1;
        }
        if (this.startTimestamp < other.startTimestamp)
            return -1;
        else if (this.startTimestamp > other.startTimestamp) {
            return 1;
        }
        return 0;
    }
		...省略...
} 
```

**5、**`LatencyFaultTolerance`接口；

```java
public interface LatencyFaultTolerance<T> {
    //更新故障条目，brokerName，延迟时间，不可用持续时长
    void updateFaultItem(final T name, final long currentLatency, final long notAvailableDuration);
    //判断brokerName是否可用
    boolean isAvailable(final T name);
    //移除BrokerName
    void remove(final T name);
    //从规避的Broker中选择一个可用的
    T pickOneAtLeast();
}
```

1. LatencyFaultToleranceImpl#updateFaultItem：更新失败条目

```java
@Override
public void updateFaultItem(final String name, final long currentLatency, final long notAvailableDuration) {
    FaultItem old = this.faultItemTable.get(name);
    //找到则更新，否则创建
    if (null == old) {
        final FaultItem faultItem = new FaultItem(name);
        faultItem.setCurrentLatency(currentLatency);
        faultItem.setStartTimestamp(System.currentTimeMillis() + notAvailableDuration);
        old = this.faultItemTable.putIfAbsent(name, faultItem);
        if (old != null) {
            //更新旧的失败条目
            old.setCurrentLatency(currentLatency);
            old.setStartTimestamp(System.currentTimeMillis() + notAvailableDuration);
        }
    } else {
        old.setCurrentLatency(currentLatency);
        old.setStartTimestamp(System.currentTimeMillis() + notAvailableDuration);
    }
}
```

1. LatencyFaultToleranceImpl#pickOneAtLeast:尝试从规避的Broker中选择一个可用的Broker，如果没有找到，则返回null

```java
@Override
public String pickOneAtLeast() {
    final Enumeration<FaultItem> elements = this.faultItemTable.elements();
    List<FaultItem> tmpList = new LinkedList<FaultItem>();
    while (elements.hasMoreElements()) {
        final FaultItem faultItem = elements.nextElement();
        tmpList.add(faultItem);
    }
    if (!tmpList.isEmpty()) {
        //FIXME 这个有必要吗？ https://github.com/apache/rocketmq/issues/1248
        // java中Collection.sort()使用了稳定的排序算法，因此在sort()之前使用shuffle()会使选择算法更公平
        //https://stackoverflow.com/questions/37634260/how-to-shuffle-specific-set-of-elements-in-a-list
      	//在排序之后，随机地处理具有相同优先级的元素，并保持优先级的一般顺序
        Collections.shuffle(tmpList);
        //排序，可用的在前面
        Collections.sort(tmpList);
        //选择顺序在前一半的
        final int half = tmpList.size() / 2;
        if (half <= 0) {
            return tmpList.get(0).getName();
        } else {
            final int i = this.whichItemWorst.getAndIncrement() % half;
            return tmpList.get(i).getName();
        }
    }
    return null;
}
```

**8、**`MQFaultStrategy`属性；

```java
public class MQFaultStrategy {
    private final static InternalLogger log = ClientLogger.getLog();
    //泛型是brokerName
    private final LatencyFaultTolerance<String> latencyFaultTolerance = new LatencyFaultToleranceImpl();
    //延迟开关
    private boolean sendLatencyFaultEnable = false;
    //延迟数组
    private long[] latencyMax = {
       50L, 100L, 550L, 1000L, 2000L, 3000L, 15000L};
    //不可用时长数组
    private long[] notAvailableDuration = {
       0L, 0L, 30000L, 60000L, 120000L, 180000L, 600000L};
}
```

1. MQFaultStrategy#updateFaultItem

```java
/**
  *
  * @param brokerName
  * @param currentLatency 本次消息发送延迟时间
  * @param isolation 是否隔离，true表示默认30s来计算broker故障规避时长，false使用发送延迟时间来计算broker故障规避时长
  */
 public void updateFaultItem(final String brokerName, final long currentLatency, boolean isolation) {
     if (this.sendLatencyFaultEnable) {
         long duration = computeNotAvailableDuration(isolation ? 30000 : currentLatency);
         this.latencyFaultTolerance.updateFaultItem(brokerName, currentLatency, duration);
     }
 }
 private long computeNotAvailableDuration(final long currentLatency) {
     //从latencyMax最后一个元素开始查找，找到比currentLatency小的下标
     //然后从notAvailableDuration数组中获取需要规避的时长，找不到则返回0
     for (int i = latencyMax.length - 1; i >= 0; i--) {
         if (currentLatency >= latencyMax[i])
             return this.notAvailableDuration[i];
     }
     return 0;
 }
```

**10、** latencyMax与notAvailableDuration对应表；

latencyMax(消息消耗时长)
Broker 不可用时长

>= 15000 ms
600 * 1000 ms

>= 3000 ms
180 * 1000 ms

>= 2000 ms
120 * 1000 ms

>= 1000 ms
60 * 1000 ms

>= 550 ms
30 * 1000 ms

>= 100 ms
0 ms

>= 50 ms
0 ms

## 总结

**1、** 所有的broker延迟信息都会被记录；

**2、** 发送消息时会选择延迟最低的broker来发送，提高效率；

**3、** broker延迟过高会自动减少它的消息分配，充分发挥所有服务器的能力；
