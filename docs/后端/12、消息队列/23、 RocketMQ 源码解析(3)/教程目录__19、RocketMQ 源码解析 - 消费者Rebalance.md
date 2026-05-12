# 19、RocketMQ 源码解析 - 消费者Rebalance
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/19.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## 简介

**1、** 集群消息同一个消费组只能有一个消费者消费，如果一个Topic有4个MessageQueue，对于ConsumerGroupA这个消费组，如果此消费组只有一个ConsumerA，那么所有消息队列都由此消费者消费此时ConsumerGroupA消费组增加一个ConsumerB消费者，为了提升消息的处理能力，此时多个消费者需要重新分配消费队列这个重新分配的过程就叫做重平衡；

**2、** 重平衡(Rebalance)机制主要目的；

- 提升消息的并行处理能力
- 避免消费单点故障

**3、** 触发重平衡的条件；

- 新的消费者加入消费组或者消费组成员中其中一个下线或者异常
- 消费者拉取请求超时
- Topic下的Queue数量变化

**4、** 重平衡带来的问题；

**消费暂停**:当重平衡时，现有的Consumer会被暂停消费，等到分配完成后，才能继续消费

**重复消费**:如果一个消费者正在消费但是并未提交偏移量，此时发生重平衡，导致另一个消费者从持久化的消费偏移量中获取的值是消费过的（但是未提交持久化），此时导致消费重复消费

**消费毛刺**:如果重复消费的消息量比较大或者重平衡暂停的时间过长，导致积压了大量消息。可能导致重平衡之后瞬间需要消费太多积压的消息

**5、** RocketMQ按照Topic维度进行Rebalance，这样会导致如果一个消费者订阅多个Topic，可能会出现分配不均的问题，处于排列前的分配更多的队列，后面的消费者处于空闲状态**由于订阅多个Topic可能导致分配不均，所以不建议在同一个消费组订阅多个Topic**；

**6、** 触发重平衡的流程

；

**7、** 从上图可以看出Rebalance有多种触发机制；

- DefaultMQPushConsumerImpl启动时立即触发一次
- 发送心跳信息，如果发生变更，Broker通知所有Consumer触发Rebalance
- 客户端Consumer周期性触发，避免Broker通知失效
- 客户端停止时，向Broker发送取消注册命令

## Broker端

**1、** Broker维护Rebalance需要的一些信息，在Rebalance过程中Broker充当协调者的角色；

**2、** 在Broker内部，通过一些管理器维护与Rebalance相关的信息；

**队列信息**：`TopicConfigManager`维护队列信息。Broker通过定时上报自己的信息给NameServer，消费者定时从NameServer拉取最新的路由信息。当队列信息发生变化，就会触发Rebalance

```java
// key是topic
private final ConcurrentMap<String, TopicConfig> topicConfigTable =
    new ConcurrentHashMap<String, TopicConfig>(1024);
```

**消费组信息**：ConsumerManager、ConsumerOffsetManager、SubscriptionGroupManager三者共同维护

**ConsumerManager**：维护了消费者组订阅信息，以及消费者组下当前的消费者实例信息，当消费者组的订阅信息或者实例发生变化，Broker都会主动给所有消费者实例发送通知，触发Rebalance

**ConsumerOffsetManager**：在Rebalance时，消费者需要从**ConsumerOffsetManager**查询应该从那个位置继续开始消费

**SubscriptionGroupManager**：主要是维护消费者组的一些附加信息，方便运维。

### ConsumerManager

**1、****ConsumerManager**维护了某个消费者组的订阅信息，以及所有消费者实例的详细信息，并在发生变化时提供通知机制；

**registerConsumer**：注册消费组数据。客户端通过发送`RequestCode.HEART_BEAT`请求给Broker，将客户端消费组相关信息注册到Broker中维护

**unregisterConsumer**:删除消费组数据。

**查询**：发送`QUERY_TOPIC_CONSUME_BY_WHO`、`GET_CONSUME_STATS`等查询消费状态

**2、** 从【触发重平衡的流程】图中可以看到无论是注册还是删除消费组数据，**Broker都会主动发送NOTIFY_CONSUMER_IDS_CHANGED**请求来通知所有注册的Consumer实例进行Rebalance；

**3、****ConsumerManager#registerConsumer**源码

```java
// 维护消费组所有的consumer实例
private final ConcurrentMap<String/* Group */, ConsumerGroupInfo> consumerTable =
    new ConcurrentHashMap<String, ConsumerGroupInfo>(1024);
public boolean registerConsumer(final String group, final ClientChannelInfo clientChannelInfo,
    ConsumeType consumeType, MessageModel messageModel, ConsumeFromWhere consumeFromWhere,
    final Set<SubscriptionData> subList, boolean isNotifyConsumerIdsChangedEnable) {
    // 查找consumer组信息，没有则创建一个
    ConsumerGroupInfo consumerGroupInfo = this.consumerTable.get(group);
    if (null == consumerGroupInfo) {
        ConsumerGroupInfo tmp = new ConsumerGroupInfo(group, consumeType, messageModel, consumeFromWhere);
        ConsumerGroupInfo prev = this.consumerTable.putIfAbsent(group, tmp);
        consumerGroupInfo = prev != null ? prev : tmp;
    }
    // 更新Consumer信息，返回消费组下实例信息是否变化
    boolean r1 =
        consumerGroupInfo.updateChannel(clientChannelInfo, consumeType, messageModel,
            consumeFromWhere);
    // 更新订阅Topic信息，返回消费者订阅信息是否变化
    boolean r2 = consumerGroupInfo.updateSubscription(subList);
    // 如果变化，则rebalance，通知所有消费者
    if (r1 || r2) {
        if (isNotifyConsumerIdsChangedEnable) {
            this.consumerIdsChangeListener.handle(ConsumerGroupEvent.CHANGE, group, consumerGroupInfo.getAllChannel());
        }
    }
    this.consumerIdsChangeListener.handle(ConsumerGroupEvent.REGISTER, group, subList);
    return r1 || r2;
}
```

1. **DefaultConsumerIdsChangeListener#handle**主要是根据事件进行判断

```java
@Override
public void handle(ConsumerGroupEvent event, String group, Object... args) {
    if (event == null) {
        return;
    }
    switch (event) {
        case CHANGE:
            if (args == null || args.length < 1) {
                return;
            }
            List<Channel> channels = (List<Channel>) args[0];
            if (channels != null && brokerController.getBrokerConfig().isNotifyConsumerIdsChangedEnable()) {
              	//遍历所有Consumer实例的Channel，并发送Rebalance消息
                for (Channel chl : channels) {
                    this.brokerController.getBroker2Client().notifyConsumerIdsChanged(chl, group);
                }
            }
            break;
        case UNREGISTER:
            this.brokerController.getConsumerFilterManager().unRegister(group);
            break;
        case REGISTER:
            if (args == null || args.length < 1) {
                return;
            }
            Collection<SubscriptionData> subscriptionDataList = (Collection<SubscriptionData>) args[0];
            this.brokerController.getConsumerFilterManager().register(group, subscriptionDataList);
            break;
        default:
            throw new RuntimeException("Unknown event " + event);
    }
}
```

1. Broker2Client#notifyConsumerIdsChanged封装通知Rebalance的消息，发送请求为NOTIFY_CONSUMER_IDS_CHANGED。调用RemotingServer#invokeOneway发送请求，默认10ms超时。**这里就算没有发送成功，也没有影响，因为客户端Consumer定时会自动请求Rebalance**。 这里可以看出，Broker是通知每个Consumer进行各自的Rebalance，即每个消费者自己给自己分配队列，而不是Broker将分配好的队列告知Consumer，这样的好处客户端可以自定义分配的策略

```java
public void notifyConsumerIdsChanged(
        final Channel channel,
        final String consumerGroup) {
        if (null == consumerGroup) {
            log.error("notifyConsumerIdsChanged consumerGroup is null");
            return;
        }
        NotifyConsumerIdsChangedRequestHeader requestHeader = new NotifyConsumerIdsChangedRequestHeader();
        requestHeader.setConsumerGroup(consumerGroup);
        RemotingCommand request =
            RemotingCommand.createRequestCommand(RequestCode.NOTIFY_CONSUMER_IDS_CHANGED, requestHeader);
        try {
            this.brokerController.getRemotingServer().invokeOneway(channel, request, 10);
        } catch (Exception e) {
            log.error("notifyConsumerIdsChanged exception, " + consumerGroup, e.getMessage());
        }
    }
```

### ConsumerOffsetManager

**1、** 由于重平衡会导致队列可能被分配到其他消费者，所以必须有一个地方存储上一个消费者消费的偏移量**ConsumerOffsetManager**主要就是为了存储消费者的偏移量，以便下一个消费者可以继续消费；

**2、** 消费者通过发送`UPDATE_CONSUMER_OFFSET`请求，来更新消费者组对于某个Topic的消费进度发送`QUERY_CONSUMER_OFFSET`查询消费进度；

```java
public class ConsumerOffsetManager extends ConfigManager {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.BROKER_LOGGER_NAME);
    private static final String TOPIC_GROUP_SEPARATOR = "@";
    private ConcurrentMap<String/* topic@group */, ConcurrentMap<Integer, Long>> offsetTable =
        new ConcurrentHashMap<String, ConcurrentMap<Integer, Long>>(512);
  	// 提交Offset
  	public void commitOffset(final String clientHost, final String group, final String topic, final int queueId,
        final long offset) {
        // topic@group
        String key = topic + TOPIC_GROUP_SEPARATOR + group;
        this.commitOffset(clientHost, key, queueId, offset);
    }
    private void commitOffset(final String clientHost, final String key, final int queueId, final long offset) {
        ConcurrentMap<Integer, Long> map = this.offsetTable.get(key);
        if (null == map) {
            map = new ConcurrentHashMap<Integer, Long>(32);
            map.put(queueId, offset);
            this.offsetTable.put(key, map);
        } else {
            Long storeOffset = map.put(queueId, offset);
            if (storeOffset != null && offset < storeOffset) {
                log.warn("[NOTIFYME]update consumer offset less than store. clientHost={}, key={}, queueId={}, requestOffset={}, storeOffset={}", clientHost, key, queueId, offset, storeOffset);
            }
        }
    }
}  
```

### SubscriptionGroupManager

**1、** 订阅组配置管理器，内部针对每个消费者组维护一个SubscriptionGroupConfig主要是为了针对消费者组进行一些运维操作；

```java
public class SubscriptionGroupManager extends ConfigManager {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.BROKER_LOGGER_NAME);
    private final ConcurrentMap<String, SubscriptionGroupConfig> subscriptionGroupTable =
        new ConcurrentHashMap<String, SubscriptionGroupConfig>(1024);
    private final DataVersion dataVersion = new DataVersion();
    private transient BrokerController brokerController;
	...省略CRUD方法
}  
```

## 消费端

### RebalanceService

**1、****PullMessageService**提供了添加PullRequest的方式，什么时候被调用的呢？查看**PullMessageService#executePullRequestImmediately**被调用的地方，并向上追溯，可以看到触发的地方是**RebalanceService**。**RebalanceService**继承ServiceThread，说明它也是一个服务线程，并且它在**MQClientInstance**启动时（start）是被调用
**2、** RocketMQ消息队列重平衡是由**RebalanceService**服务线程实现的，默认每隔20s进行一次重平衡，可以通过`-Drocketmq.client.rebalance.waitInterval=30`改变默认值从任意Broker节点获取消费组的消费ID和订阅信息，根据这些订阅信息进行分配，然后将分配的信息封装成PullRequest对象放到PullRequestQueue队列中；

```java
public class RebalanceService extends ServiceThread {
    private static long waitInterval =
        Long.parseLong(System.getProperty(
            "rocketmq.client.rebalance.waitInterval", "20000"));
    private final InternalLogger log = ClientLogger.getLog();
    private final MQClientInstance mqClientFactory;
    @Override
    public void run() {
        log.info(this.getServiceName() + " service started");
        while (!this.isStopped()) {
            // 默认20s
            this.waitForRunning(waitInterval);
            this.mqClientFactory.doRebalance();
        }
        log.info(this.getServiceName() + " service end");
    }
    ...省略...
}
```

**3、****RebalanceService**执行流程；

## 分配策略

**1、** RocketMQ默认提供了一些分配算法消息队列分配原则为一个消费者可以分配多个消息队列，但同一个消息队列只会分配给一个消费者，如果消费者个数大于消息队列数量，则有些消费者无法消费消息；

- AllocateMessageQueueAveragely：平均分配。推荐使用。

```java
有8个消息消费队列q1、q2、q3、q4、q5、q6、q7、q8，有3个消费者c1、c2、c3
c1：q1、q2、q3
c2：q4、q5、q6
c3：q7、q8
```

- AllocateMessageQueueAveragelyByCircle：平均轮询分配，推荐使用。

```java
有8个消息消费队列q1、q2、q3、q4、q5、q6、q7、q8，有3个消费者c1、c2、c3
c1：q1、q4、q7。
c2：q2、q5、q8。
c3：q3、q6。
```

- AllocateMessageQueueConsistentHash:一致性哈希。不推荐使用
- AllocateMessageQueueByConfig：根据配置，为每一个消费者配置固定的消息队列
- AllocateMessageQueueByMachineRoom：根据Broker部署机房名，对每个消费者负责不同的Broker上的队列。
- AllocateMachineRoomNearby:基于机房近侧优先级的分配策略代理
