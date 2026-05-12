# 21、RocketMQ 源码解析 - 延迟消息
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/21.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## 延迟消息

**1、** RocketMQ支持发送延迟消息，但不支持任意时间的延迟消息的设置，仅支持内置预设值的延迟时间间隔的延迟消息Broker内部使用**SCHEDULE_TOPIC_XXXX**主题所有的延迟消息，根据延迟的level的个数，创建对应数量的ConsumeQueue，在创建ConsumeQueue时将其tagCode保存消息需要投递的时间通过定时任务扫描ConsumeQueue，将满足条件的消息重新投递到原始的Topic中，这样消费者就可以消费了；

**2、** 预设值的延迟时间间隔为：1s、5s、10s、30s、1m、2m、3m、4m、5m、6m、7m、8m、9m、10m、20m、30m、1h、2h；

**3、** 延迟消息的ConsumeQueue存储的tagsCode与普通消息不同；

- 延时消息的tagCode:存储的是消息到期的时间
- 非延时消息的tagCode: tags字符串的hashCode

**4、** 延迟消息整体交互图；

## 发送延迟消息

**1、** Producer发送延迟消息与普通发送没有太大区别，只需要设置延迟一个级别即可延迟级别并不是时间，只是一个数字，如果超过最大值，则会被重置为最大值；

```java
Message message = new Message(topic, tag, keys, msg.getBytes(RemotingHelper.DEFAULT_CHARSET));
//messageDelayLevel=1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h
//这里就表示10s
message.setDelayTimeLevel(3);
```

1. Message#setDelayTimeLevel的实现可以看到，是向消息扩展属性中添加一个DELAY属性

```java
public static final String PROPERTY_DELAY_TIME_LEVEL = "DELAY";
public void setDelayTimeLevel(int level) {
    this.putProperty(MessageConst.PROPERTY_DELAY_TIME_LEVEL, String.valueOf(level));
}
```

**3、** Consumer提供消息重试的，在并发模式消费消费失败的情况下，可以返回一个枚举值`ConsumeConcurrentlyStatus.RECONSUME_LATER`，那么消息之后将会进行重试默认会进行重试16次，消息重试Consumer发送的延迟时间间隔为：`10s、30s、1m、2m、3m、4m、5m、6m、7m、8m、9m、10m、20m、30m、1h、2h`即消息重试的16个级别，即重试16次；

```java
SendMessageProcessor#consumerSendMsgBack
if (0 == delayLevel) {
  	//从10ms开始
     delayLevel = 3 + msgExt.getReconsumeTimes();
 }
 msgExt.setDelayTimeLevel(delayLevel);
```

## Broker处理延迟消息

Broker端接收处理与普通消息没有区别，只是在存储的时候有一些不同。CommitLog#putMessage对于延迟消息做了相关处理

- 将消息的Topic更改为延迟消息特定的主题`SCHEDULE_TOPIC_XXXX`，根据延迟级别获取queueId（等于`delayLevel-1`）
- 将原始Topic、Queue备份在消息的扩展属性中(为了后续恢复原始，能被消费)
- 保存消息到CommitLog中，异步生成ConsumeQueue和indexFile，这个和普通消息没什么区别

```java
final int tranType = MessageSysFlag.getTransactionValue(msg.getSysFlag());
// 事务prepare消息不支持延迟消息
if (tranType == MessageSysFlag.TRANSACTION_NOT_TYPE
    || tranType == MessageSysFlag.TRANSACTION_COMMIT_TYPE) {
    // Delay Delivery 0表示不延迟，大于0表示特定的延迟级别
    if (msg.getDelayTimeLevel() > 0) {
        if (msg.getDelayTimeLevel() > this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel()) {
            msg.setDelayTimeLevel(this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel());
        }
        //延迟投递消息的topic
        topic = ScheduleMessageService.SCHEDULE_TOPIC;
        //根据延迟级别获取queueId（等于delayLevel - 1）
        queueId = ScheduleMessageService.delayLevel2QueueId(msg.getDelayTimeLevel());
        // Backup real topic, queueId
        //存入真实的topic和queueId存入消息属性中
        MessageAccessor.putProperty(msg, MessageConst.PROPERTY_REAL_TOPIC, msg.getTopic());
        MessageAccessor.putProperty(msg, MessageConst.PROPERTY_REAL_QUEUE_ID, String.valueOf(msg.getQueueId()));
        msg.setPropertiesString(MessageDecoder.messageProperties2String(msg.getProperties()));
				//更改Topic和queueId
        msg.setTopic(topic);
        msg.setQueueId(queueId);
    }
}
```

1. 执行异步转发创建ConsumeQueue时，会对延迟消息进行单独处理。CommitLog#checkMessageAndReturnSize对延迟消息的特殊处理如下。这里将具体的时间保存在ConsumeQueue的TagCode（不再是Tag的hash，而是投递时间ms）好处是不需要再去检查CommitLog文件，定时任务只需要检查ConsumeQueue即可，这样可以大大提高效率。如果满足条件，再去查询CommitLog将消息投递出去

```java
 // Timing message processing
 {
     String t = propertiesMap.get(MessageConst.PROPERTY_DELAY_TIME_LEVEL);
     if (ScheduleMessageService.SCHEDULE_TOPIC.equals(topic) && t != null) {
         int delayLevel = Integer.parseInt(t);
				 // 如果延迟级别边界溢出，则重置为最大
         if (delayLevel > this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel()) {
             delayLevel = this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel();
         }
         if (delayLevel > 0) {
             // 计算具体的投递时间，并将改时间保存在ConsumeQueue的tagCode中
           	// 投递时间=消息存储时间(storeTimestamp) + 延迟级别对应的时间
             tagsCode = this.defaultMessageStore.getScheduleMessageService().computeDeliverTimestamp(delayLevel,
                 storeTimestamp);
         }
     }
 }
```

## Broker延迟消息投递

**1、** RocketMQ通过`ScheduleMessageService`定时扫描ConsumeQueue来判断消息是否需要被投递；

```java
public class ScheduleMessageService extends ConfigManager {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);
    // 内置的Topic，用于保存所有的定时消息
    public static final String SCHEDULE_TOPIC = "SCHEDULE_TOPIC_XXXX";
    // 第一次执行定时任务的延迟时间
    private static final long FIRST_DELAY_TIME = 1000L;
    // 第一次以后定时任务的检查间隔时间，默认100ms
    private static final long DELAY_FOR_A_WHILE = 100L;
    // 延迟消息投递失败，默认10s后再次重新投递
    private static final long DELAY_FOR_A_PERIOD = 10000L;
    // 延迟级别和延迟时间的映射关系
    private final ConcurrentMap<Integer /* level */, Long/* delay timeMillis */> delayLevelTable =
        new ConcurrentHashMap<Integer, Long>(32);
    // 延迟级别与消费偏移量的关系
    private final ConcurrentMap<Integer /* level */, Long/* offset */> offsetTable =
        new ConcurrentHashMap<Integer, Long>(32);
    // 定时线程
    private final Timer timer = new Timer("ScheduleMessageTimerThread", true);
  	...省略...
}
```

1. DefaultMessageStore#start 启动时会调用ScheduleMessageService#start，启动延迟消息投递线程以及延迟消息偏移量持久化线程

```java
public void start() {
    // 每个延迟级别都有一个独立的定时任务
    for (Map.Entry<Integer, Long> entry : this.delayLevelTable.entrySet()) {
        // 延迟级别
        Integer level = entry.getKey();
        // 延迟时间
        Long timeDelay = entry.getValue();
        // 延迟级别对应的ConsumeQueue的偏移量，从此点开始扫描
        Long offset = this.offsetTable.get(level);
        if (null == offset) {
            offset = 0L;
        }
        // 延迟时间
        if (timeDelay != null) {
          	 // 从现在起过FIRST_DELAY_TIME毫秒(1000)仅执行一次
            this.timer.schedule(new DeliverDelayedMessageTimerTask(level, offset), FIRST_DELAY_TIME);
        }
    }
    this.timer.scheduleAtFixedRate(new TimerTask() {
        @Override
        public void run() {
            try {
                ScheduleMessageService.this.persist();
            } catch (Throwable e) {
                log.error("scheduleAtFixedRate flush exception", e);
            }
        }
    }, 10000, this.defaultMessageStore.getMessageStoreConfig().getFlushDelayOffsetInterval());
}
```

1. ScheduleMessageService.DeliverDelayedMessageTimerTask#DeliverDelayedMessageTimerTask检查队列中没有投递的第一条消息，如果这条消息没有到期，则之后所有的消息都不会进行检查。如果到期了，则投递，并继续检查下一条消息。如果投递失败，则10s后重新投递。**如果延迟消息量比较大，可能会造成消息到期后需要很久才能被消费。**

```java
public void executeOnTimeup() {
    // 延迟级别与queueId是一对一关系，可以相互转换
    ConsumeQueue cq =
        ScheduleMessageService.this.defaultMessageStore.findConsumeQueue(SCHEDULE_TOPIC,
            delayLevel2QueueId(delayLevel));
    long failScheduleOffset = offset;
    if (cq != null) {
        SelectMappedBufferResult bufferCQ = cq.getIndexBuffer(this.offset);
        if (bufferCQ != null) {
            try {
                long nextOffset = offset;
                int i = 0;
                ConsumeQueueExt.CqExtUnit cqExtUnit = new ConsumeQueueExt.CqExtUnit();
                for (; i < bufferCQ.getSize(); i += ConsumeQueue.CQ_STORE_UNIT_SIZE) {
                    long offsetPy = bufferCQ.getByteBuffer().getLong();
                    int sizePy = bufferCQ.getByteBuffer().getInt();
                    // tagsCode存储的是投递时间
                    long tagsCode = bufferCQ.getByteBuffer().getLong();
                    if (cq.isExtAddr(tagsCode)) {
                        if (cq.getExt(tagsCode, cqExtUnit)) {
                            tagsCode = cqExtUnit.getTagsCode();
                        } else {
                            //can't find ext content.So re compute tags code.
                            log.error("[BUG] can't find consume queue extend file content!addr={}, offsetPy={}, sizePy={}",
                                tagsCode, offsetPy, sizePy);
                            long msgStoreTime = defaultMessageStore.getCommitLog().pickupStoreTimestamp(offsetPy, sizePy);
                            tagsCode = computeDeliverTimestamp(delayLevel, msgStoreTime);
                        }
                    }
                    long now = System.currentTimeMillis();
                    // tagsCode保存的是超时时间，纠正当前消息的真正投递时间
                    long deliverTimestamp = this.correctDeliverTimestamp(now, tagsCode);
                    nextOffset = offset + (i / ConsumeQueue.CQ_STORE_UNIT_SIZE);
                    // 判断延迟消息是否过期
                    long countdown = deliverTimestamp - now;
                    if (countdown <= 0) {
                        MessageExt msgExt =
                            ScheduleMessageService.this.defaultMessageStore.lookMessageByOffset(
                                offsetPy, sizePy);
                        if (msgExt != null) {
                            try {
                                // 恢复原始消息，清除延迟属性。重新投递消息到原始的Topic和queueId中
                                MessageExtBrokerInner msgInner = this.messageTimeup(msgExt);
                                PutMessageResult putMessageResult =
                                    ScheduleMessageService.this.defaultMessageStore
                                        .putMessage(msgInner);
                                if (putMessageResult != null
                                    && putMessageResult.getPutMessageStatus() == PutMessageStatus.PUT_OK) {
                                    continue;
                                } else {
                                    // XXX: warn and notify me
                                    log.error(
                                        "ScheduleMessageService, a message time up, but reput it failed, topic: {} msgId {}",
                                        msgExt.getTopic(), msgExt.getMsgId());
                                    // 如果投递失败，则重新投递，并且更新偏移量
                                    ScheduleMessageService.this.timer.schedule(
                                        new DeliverDelayedMessageTimerTask(this.delayLevel,
                                            nextOffset), DELAY_FOR_A_PERIOD);
                                    ScheduleMessageService.this.updateOffset(this.delayLevel,
                                        nextOffset);
                                    return;
                                }
                            } catch (Exception e) {
                                /*
                                 * XXX: warn and notify me
                                 */
                                log.error(
                                    "ScheduleMessageService, messageTimeup execute error, drop it. msgExt="
                                        + msgExt + ", nextOffset=" + nextOffset + ",offsetPy="
                                        + offsetPy + ",sizePy=" + sizePy, e);
                            }
                        }
                    } else {
                        // 重新投递
                        ScheduleMessageService.this.timer.schedule(
                            new DeliverDelayedMessageTimerTask(this.delayLevel, nextOffset),
                            countdown);
                        ScheduleMessageService.this.updateOffset(this.delayLevel, nextOffset);
                        return;
                    }
                } // end of for
                } // end of for
                // 继续调度下一个，更新消费偏移量
                nextOffset = offset + (i / ConsumeQueue.CQ_STORE_UNIT_SIZE);
                ScheduleMessageService.this.timer.schedule(new DeliverDelayedMessageTimerTask(
                    this.delayLevel, nextOffset), DELAY_FOR_A_WHILE);
                ScheduleMessageService.this.updateOffset(this.delayLevel, nextOffset);
                return;
            } finally {
                bufferCQ.release();
            }
        } // end of if (bufferCQ != null)
        else {
            // 如果偏移量不正确，打印错误日志
            long cqMinOffset = cq.getMinOffsetInQueue();
            if (offset < cqMinOffset) {
                failScheduleOffset = cqMinOffset;
                log.error("schedule CQ offset invalid. offset=" + offset + ", cqMinOffset="
                    + cqMinOffset + ", queueId=" + cq.getQueueId());
            }
        }
    } // end of if (cq != null)
    ScheduleMessageService.this.timer.schedule(new DeliverDelayedMessageTimerTask(this.delayLevel,
        failScheduleOffset), DELAY_FOR_A_WHILE);
}
```
