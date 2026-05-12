# 11、RocketMQ 源码解析 - CommitLog
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/11.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## 简介

**1、****CommitLog**是保存消息元数据的地方，所有Topic的消息到达Broker后都会保存到CommitLog文件**CommitLog**里面记录了每条消息的消费情况，是否被消费，由谁消费，该消息是否持久化等信息；

**2、****CommitLog**文件的存储目录默认为**${ROCKET_HOME}/store/commitlog**，默认大小是1G；

**3、****CommitLog**核心属性；

```java
public class CommitLog {
    // Message's MAGIC CODE daa320a7
    public final static int MESSAGE_MAGIC_CODE = -626843481;
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);
    // End of file empty MAGIC CODE cbd43194
    private final static int BLANK_MAGIC_CODE = -875286124;
    /**
     * 内存映射文件队列，CommitLog和ConsumeQueue都有一个对应的MappedFileQueue
     */
    private final MappedFileQueue mappedFileQueue;
    private final DefaultMessageStore defaultMessageStore;
    /**
     * 同步刷盘
     * flushCommitLogService = new GroupCommitService();
     * 异步刷盘
     * flushCommitLogService = new FlushRealTimeService();
     */
    private final FlushCommitLogService flushCommitLogService;
    //If TransientStorePool enabled, we must flush message to FileChannel at fixed periods
    private final FlushCommitLogService commitLogService;
    private final AppendMessageCallback appendMessageCallback;
    private final ThreadLocal<MessageExtBatchEncoder> batchEncoderThreadLocal;
    private HashMap<String/* topic-queueid */, Long/* offset */> topicQueueTable = new HashMap<String, Long>(1024);
    private volatile long confirmOffset = -1L;
    private volatile long beginTimeInLock = 0;
    private final PutMessageLock putMessageLock;
		...省略...
}  
```

## 构造方法

**1、****CommitLog**构造方法：可以看出**CommitLog**与**DefaultMessageStore**绑定，**CommitLog**是对外的统一抽象，实际文件的操作委托给mappedFile；

```java
public CommitLog(final DefaultMessageStore defaultMessageStore) {
    //创建MappedFileQueue
    this.mappedFileQueue = new MappedFileQueue(defaultMessageStore.getMessageStoreConfig().getStorePathCommitLog(),
        defaultMessageStore.getMessageStoreConfig().getMapedFileSizeCommitLog(), defaultMessageStore.getAllocateMappedFileService());
    this.defaultMessageStore = defaultMessageStore;
    // 默认是异步刷盘FlushDiskType.ASYNC_FLUSH
    if (FlushDiskType.SYNC_FLUSH == defaultMessageStore.getMessageStoreConfig().getFlushDiskType()) {
        this.flushCommitLogService = new GroupCommitService();
    } else {
        this.flushCommitLogService = new FlushRealTimeService();
    }
    /**
     * TODO jannal
     * 此处应该判断defaultMessageStore.getMessageStoreConfig().isTransientStorePoolEnable()
     * 因为start()方法判断，没有开启TransientStorePoolEnable，CommitRealTimeService线程是不会启动的
     */
    this.commitLogService = new CommitRealTimeService();
    this.appendMessageCallback = new DefaultAppendMessageCallback(defaultMessageStore.getMessageStoreConfig().getMaxMessageSize());
    batchEncoderThreadLocal = new ThreadLocal<MessageExtBatchEncoder>() {
        @Override
        protected MessageExtBatchEncoder initialValue() {
            return new MessageExtBatchEncoder(defaultMessageStore.getMessageStoreConfig().getMaxMessageSize());
        }
    };
    //默认使用自旋锁
    this.putMessageLock = defaultMessageStore.getMessageStoreConfig().isUseReentrantLockWhenPutMessage() ? new PutMessageReentrantLock() : new PutMessageSpinLock();
}
```

## 追加消息

**1、** 所有消息都存在一个单一的**CommitLog**文件里面，然后有后台线程异步的同步到**ConsumeQueue**，再由Consumer进行消费；

**2、** 同一时间只能有一个线程进行数据的Put工作，默认使用自旋锁，因为在线程停顿时间很短的情况下，自旋锁消耗的CPU资源比阻塞要低得多(即使在自旋期间CPU会一直空转)；

**3、** 源码；

```java
public PutMessageResult putMessage(final MessageExtBrokerInner msg) {
    // Set the storage time
    msg.setStoreTimestamp(System.currentTimeMillis());
    // Set the message body BODY CRC (consider the most appropriate setting
    // on the client)
    msg.setBodyCRC(UtilAll.crc32(msg.getBody()));
    // Back to Results
    AppendMessageResult result = null;
    StoreStatsService storeStatsService = this.defaultMessageStore.getStoreStatsService();
    String topic = msg.getTopic();
    int queueId = msg.getQueueId();
    final int tranType = MessageSysFlag.getTransactionValue(msg.getSysFlag());
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
            msg.setTopic(topic);
            msg.setQueueId(queueId);
        }
    }
    long eclipseTimeInLock = 0;
    MappedFile unlockMappedFile = null;
    //获取当前可写入的MappedFile
    MappedFile mappedFile = this.mappedFileQueue.getLastMappedFile();
    putMessageLock.lock(); //spin or ReentrantLock ,depending on store config
    try {
        long beginLockTimestamp = this.defaultMessageStore.getSystemClock().now();
        this.beginTimeInLock = beginLockTimestamp;
        // Here settings are stored timestamp, in order to ensure an orderly
        // global
        msg.setStoreTimestamp(beginLockTimestamp);
        //如果mappedFileQueue队列中没有映射文件或者映射文件的空间已满，创建新的
        if (null == mappedFile || mappedFile.isFull()) {
            mappedFile = this.mappedFileQueue.getLastMappedFile(0); // Mark: NewFile may be cause noise
        }
        if (null == mappedFile) {
            log.error("create mapped file1 error, topic: " + msg.getTopic() + " clientAddr: " + msg.getBornHostString());
            beginTimeInLock = 0;
            return new PutMessageResult(PutMessageStatus.CREATE_MAPEDFILE_FAILED, null);
        }
        //将消息追加到MappedFile的MappedByteBuffer/writeBuffer中,更新其写入位置wrotePosition,但还没Commit及Flush
        result = mappedFile.appendMessage(msg, this.appendMessageCallback);
        switch (result.getStatus()) {
            case PUT_OK:
                break;
            //文件末尾(空间满了)，获取新的映射文件
            case END_OF_FILE:
                unlockMappedFile = mappedFile;
                // Create a new file, re-write the message
                mappedFile = this.mappedFileQueue.getLastMappedFile(0);
                if (null == mappedFile) {
                    // XXX: warn and notify me
                    log.error("create mapped file2 error, topic: " + msg.getTopic() + " clientAddr: " + msg.getBornHostString());
                    beginTimeInLock = 0;
                    return new PutMessageResult(PutMessageStatus.CREATE_MAPEDFILE_FAILED, result);
                }
                result = mappedFile.appendMessage(msg, this.appendMessageCallback);
                break;
            case MESSAGE_SIZE_EXCEEDED:
            case PROPERTIES_SIZE_EXCEEDED:
                beginTimeInLock = 0;
                return new PutMessageResult(PutMessageStatus.MESSAGE_ILLEGAL, result);
            case UNKNOWN_ERROR:
                beginTimeInLock = 0;
                return new PutMessageResult(PutMessageStatus.UNKNOWN_ERROR, result);
            default:
                beginTimeInLock = 0;
                return new PutMessageResult(PutMessageStatus.UNKNOWN_ERROR, result);
        }
        eclipseTimeInLock = this.defaultMessageStore.getSystemClock().now() - beginLockTimestamp;
        beginTimeInLock = 0;
    } finally {
        putMessageLock.unlock();
    }
    //计算锁持有的时间，如果大于500，则记录警告日志
    if (eclipseTimeInLock > 500) {
        log.warn("[NOTIFYME]putMessage in lock cost time(ms)={}, bodyLength={} AppendMessageResult={}", eclipseTimeInLock, msg.getBody().length, result);
    }
    if (null != unlockMappedFile && this.defaultMessageStore.getMessageStoreConfig().isWarmMapedFileEnable()) {
        this.defaultMessageStore.unlockMappedFile(unlockMappedFile);
    }
    PutMessageResult putMessageResult = new PutMessageResult(PutMessageStatus.PUT_OK, result);
    // Statistics
    storeStatsService.getSinglePutMessageTopicTimesTotal(msg.getTopic()).incrementAndGet();
    storeStatsService.getSinglePutMessageTopicSizeTotal(topic).addAndGet(result.getWroteBytes());
    //刷盘
    handleDiskFlush(result, putMessageResult, msg);
    //主从同步
    handleHA(result, putMessageResult, msg);
    return putMessageResult;
}
```

## 获取偏移量

**1、** 获取**CommitLog**目录的最小偏移量；

```java
public long getMinOffset() {
    // 获取目录的第一个文件
    MappedFile mappedFile = this.mappedFileQueue.getFirstMappedFile();
    if (mappedFile != null) {
        // 如果可用，则返回该文件的起始偏移量，否则返回下一个文件的起始偏移量
        if (mappedFile.isAvailable()) {
            return mappedFile.getFileFromOffset();
        } else {
            return this.rollNextFile(mappedFile.getFileFromOffset());
        }
    }
    return -1;
}
public long rollNextFile(final long offset) {
    // 根据offset返回下一个文件的起始偏移量
    int mappedFileSize = this.defaultMessageStore.getMessageStoreConfig().getMapedFileSizeCommitLog();
    return offset + mappedFileSize - offset % mappedFileSize;
}
```
