# 03、RocketMQ源码解析 - CommitLog消息存储机制
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/1/3.html
- 分类：消息队列
- 分组：教程目录
本文重点分析 Broker 接收到生产者发送消息请求后如何存储在 Broker 上，本文暂不关注事务消息机制。

RocketMQ 的存储核心类为 DefaultMessageStore,存储消息的入口方法为：putMessage。

在深入学习消息存储之前，我们先大概了解一下DefaultMessageStore的属性与构造方法。

## 1、消息存储分析

## 1.1 DefaultMessageStore 概要

其核心属性如下：

- messageStoreConfig

存储相关的配置，例如存储路径、commitLog文件大小，刷盘频次等等。
- CommitLog commitLog

comitLog 的核心处理类，消息存储在 commitlog 文件中。
- ConcurrentMap`>` consumeQueueTable

topic 的队列信息。
- FlushConsumeQueueService flushConsumeQueueService

ConsumeQueue 刷盘服务线程。
- CleanCommitLogService cleanCommitLogService

commitLog 过期文件删除线程。
- CleanConsumeQueueService cleanConsumeQueueService

consumeQueue 过期文件删除线程。
- IndexService indexService

索引服务。
- AllocateMappedFileService allocateMappedFileService

MappedFile 分配线程，RocketMQ 使用内存映射处理 commitlog、consumeQueue文件。
- ReputMessageService reputMessageService

reput 转发线程（负责 Commitlog 转发到 Consumequeue、Index文件）。
- HAService haService

主从同步实现服务。
- ScheduleMessageService scheduleMessageService

定时任务调度器，执行定时任务。
- StoreStatsService storeStatsService

存储统计服务。
- TransientStorePool transientStorePool

ByteBuffer 池，后文会详细使用。
- RunningFlags runningFlags

存储服务状态。
- BrokerStatsManager brokerStatsManager

Broker 统计服务。
- MessageArrivingListener messageArrivingListener

消息达到监听器。
- StoreCheckpoint storeCheckpoint

刷盘检测点。
- LinkedList`` dispatcherList

转发 comitlog 日志，主要是从 commitlog 转发到 consumeQueue、index 文件。

上面这些属性，是整个消息存储的核心，也是我们需要重点关注与理解的（将会在本系列一一介绍到）。

接下来，先从 putMessage 为入口，一起探究整个消息存储全过程。

## 1.2 消息存储流程

### 1.2.1 DefaultMessageStore.putMessage

```java
public PutMessageResult putMessage(MessageExtBrokerInner msg) {
    if (this.shutdown) {
        log.warn("message store has shutdown, so putMessage is forbidden");
        return new PutMessageResult(PutMessageStatus.SERVICE_NOT_AVAILABLE, null);
    }
    if (BrokerRole.SLAVE == this.messageStoreConfig.getBrokerRole()) {
        long value = this.printTimes.getAndIncrement();
        if ((value % 50000) == 0) {
            log.warn("message store is slave mode, so putMessage is forbidden ");
        }
        return new PutMessageResult(PutMessageStatus.SERVICE_NOT_AVAILABLE, null);
    }
    if (!this.runningFlags.isWriteable()) {
        long value = this.printTimes.getAndIncrement();
        if ((value % 50000) == 0) {
            log.warn("message store is not writeable, so putMessage is forbidden " + this.runningFlags.getFlagBits());
        }
        return new PutMessageResult(PutMessageStatus.SERVICE_NOT_AVAILABLE, null);
    } else {
        this.printTimes.set(0);
    }
    if (msg.getTopic().length() > Byte.MAX_VALUE) {
        log.warn("putMessage message topic length too long " + msg.getTopic().length());
        return new PutMessageResult(PutMessageStatus.MESSAGE_ILLEGAL, null);
    }
    if (msg.getPropertiesString() != null && msg.getPropertiesString().length() > Short.MAX_VALUE) {
        log.warn("putMessage message properties length too long " + msg.getPropertiesString().length());
        return new PutMessageResult(PutMessageStatus.PROPERTIES_SIZE_EXCEEDED, null);
    }
    if (this.isOSPageCacheBusy()) {    //@1
        return new PutMessageResult(PutMessageStatus.OS_PAGECACHE_BUSY, null);
    }
    long beginTime = this.getSystemClock().now();
    PutMessageResult result = this.commitLog.putMessage(msg);    // @2
    long eclipseTime = this.getSystemClock().now() - beginTime;
    if (eclipseTime > 500) {
        log.warn("putMessage not in lock eclipse time(ms)={}, bodyLength={}", eclipseTime, msg.getBody().length);
    }
    this.storeStatsService.setPutMessageEntireTimeMax(eclipseTime);   //@3
    if (null == result || !result.isOk()) {                                                      //@4 
        this.storeStatsService.getPutMessageFailedTimes().incrementAndGet();
    }
    return result;
}
```

代码@1：检测操作系统页写入是否繁忙。

```java
@Override
public boolean isOSPageCacheBusy() {
    long begin = this.getCommitLog().getBeginTimeInLock();
    long diff = this.systemClock.now() - begin;
    if (diff < 10000000 //
        && diff > this.messageStoreConfig.getOsPageCacheBusyTimeOutMills()) {
        return true;
    }
    return false;
}
```

代码@2：将日志写入CommitLog 文件，具体实现类 CommitLog。

代码@3：记录相关统计信息。

代码@4：记录写commitlog 失败次数。

### 1.2.2 CommitLog.putMessage

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
    final int tranType = MessageSysFlag.getTransactionValue(msg.getSysFlag());    // @1
    if (tranType == MessageSysFlag.TRANSACTION_NOT_TYPE//
        || tranType == MessageSysFlag.TRANSACTION_COMMIT_TYPE) {    // @2
        // Delay Delivery
        if (msg.getDelayTimeLevel() > 0) {
            if (msg.getDelayTimeLevel() > this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel()) {
                msg.setDelayTimeLevel(this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel());
            }
            topic = ScheduleMessageService.SCHEDULE_TOPIC;
            queueId = ScheduleMessageService.delayLevel2QueueId(msg.getDelayTimeLevel());
            // Backup real topic, queueId
            MessageAccessor.putProperty(msg, MessageConst.PROPERTY_REAL_TOPIC, msg.getTopic());
            MessageAccessor.putProperty(msg, MessageConst.PROPERTY_REAL_QUEUE_ID, String.valueOf(msg.getQueueId()));
            msg.setPropertiesString(MessageDecoder.messageProperties2String(msg.getProperties()));
            msg.setTopic(topic);
            msg.setQueueId(queueId);
        }
    }
    long eclipseTimeInLock = 0;
    MappedFile unlockMappedFile = null;
    MappedFile mappedFile = this.mappedFileQueue.getLastMappedFile();    // @3
    putMessageLock.lock(); //spin or ReentrantLock ,depending on store config    //@4
    try {
        long beginLockTimestamp = this.defaultMessageStore.getSystemClock().now();
        this.beginTimeInLock = beginLockTimestamp;
        // Here settings are stored timestamp, in order to ensure an orderly
        // global
        msg.setStoreTimestamp(beginLockTimestamp);
        if (null == mappedFile || mappedFile.isFull()) {
            mappedFile = this.mappedFileQueue.getLastMappedFile(0); // Mark: NewFile may be cause noise
        }
        if (null == mappedFile) {
            log.error("create maped file1 error, topic: " + msg.getTopic() + " clientAddr: " + msg.getBornHostString());
            beginTimeInLock = 0;
            return new PutMessageResult(PutMessageStatus.CREATE_MAPEDFILE_FAILED, null);
        }         // @5
        result = mappedFile.appendMessage(msg, this.appendMessageCallback);   // @6
        switch (result.getStatus()) {
            case PUT_OK:
                break;
            case END_OF_FILE:
                unlockMappedFile = mappedFile;
                // Create a new file, re-write the message
                mappedFile = this.mappedFileQueue.getLastMappedFile(0);
                if (null == mappedFile) {
                    // XXX: warn and notify me
                    log.error("create maped file2 error, topic: " + msg.getTopic() + " clientAddr: " + msg.getBornHostString());
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
    handleDiskFlush(result, putMessageResult, msg);   // @7
    handleHA(result, putMessageResult, msg);            //@8
    return putMessageResult;
}
```

先对ComitLog 写入消息做一个简单描述，然后需要详细探究每个步骤的实现。

代码@1：获取消息类型（事务消息，非事务消息，Commit消息。

代码@3：获取一个 MappedFile 对象，内存映射的具体实现。

代码@4，追加消息需要加锁，串行化处理。

代码@5：验证代码@3的 MappedFile 对象，获取一个可用的 MappedFile (如果没有，则创建一个)。

代码@6：通过MappedFile对象写入文件。

代码@7：根据刷盘策略刷盘。

代码@8：主从同步。

## 1.3 存储核心类分析

### 1.3.1 源码解析MappedFile

**1.3.1.1 MappedFile 基础属性**

```java
public static final int OS_PAGE_SIZE = 1024 * 4;   // 4K               
private static final AtomicLong TOTAL_MAPPED_VIRTUAL_MEMORY = new AtomicLong(0);
private static final AtomicInteger TOTAL_MAPPED_FILES = new AtomicInteger(0);
protected final AtomicInteger wrotePosition = new AtomicInteger(0);
protected final AtomicInteger committedPosition = new AtomicInteger(0);
private final AtomicInteger flushedPosition = new AtomicInteger(0);
protected int fileSize;
protected FileChannel fileChannel;
/**
* Message will put to here first, and then reput to FileChannel if writeBuffer is not null.
*/
protected ByteBuffer writeBuffer = null;
protected TransientStorePool transientStorePool = null;
private String fileName;
private long fileFromOffset;
private File file;
private MappedByteBuffer mappedByteBuffer;
private volatile long storeTimestamp = 0;
private boolean firstCreateInQueue = false;
```

- OS_PAGE_SIZE

OSpage大小，4K。

- TOTAL_MAPPED_VIRTUAL_MEMORY

类变量，所有 MappedFile 实例已使用字节总数。
- TOTAL_MAPPED_FILES

MappedFile 个数。
- wrotePosition

当前MappedFile对象当前写指针。
- committedPosition

当前提交的指针。
- flushedPosition

当前刷写到磁盘的指针。
- fileSize

文件总大小。
- fileChannel

文件通道。
- writeBuffer

如果开启了transientStorePoolEnable，消息会写入堆外内存，然后提交到 PageCache 并最终刷写到磁盘。
- TransientStorePool transientStorePool

ByteBuffer的缓冲池，堆外内存，transientStorePoolEnable 为 true 时生效。
- fileName

文件名称。
- fileFromOffset

文件序号,代表该文件代表的文件偏移量。
- File file

文件对象。
- MappedByteBuffer mappedByteBuffer

对应操作系统的 PageCache。
- storeTimestamp

最后一次存储时间戳。

**1.3.1.2 初始化**

```java
private void init(final String fileName, final int fileSize) throws IOException {
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.file = new File(fileName);
    this.fileFromOffset = Long.parseLong(this.file.getName());
    boolean ok = false;
    ensureDirOK(this.file.getParent());
    try {
        this.fileChannel = new RandomAccessFile(this.file, "rw").getChannel();
        this.mappedByteBuffer = this.fileChannel.map(MapMode.READ_WRITE, 0, fileSize);
        TOTAL_MAPPED_VIRTUAL_MEMORY.addAndGet(fileSize);
        TOTAL_MAPPED_FILES.incrementAndGet();
        ok = true;
    } catch (FileNotFoundException e) {
        log.error("create file channel " + this.fileName + " Failed. ", e);
        throw e;
    } catch (IOException e) {
        log.error("map file " + this.fileName + " Failed. ", e);
        throw e;
    } finally {
        if (!ok && this.fileChannel != null) {
            this.fileChannel.close();
        }
    }
}
```

初始化FileChannel、mappedByteBuffer 等。

**1.3.1.3 appendMessagesInner 消息写入**

```java
public AppendMessageResult appendMessagesInner(final MessageExt messageExt, final AppendMessageCallback cb) {
    assert messageExt != null;
    assert cb != null;
    int currentPos = this.wrotePosition.get();    // @1
    if (currentPos < this.fileSize) {
        ByteBuffer byteBuffer = writeBuffer != null ? writeBuffer.slice() : this.mappedByteBuffer.slice();   
        byteBuffer.position(currentPos);
        AppendMessageResult result = null;
        if (messageExt instanceof MessageExtBrokerInner) {   // @2
            result = cb.doAppend(this.getFileFromOffset(), byteBuffer, this.fileSize - currentPos, (MessageExtBrokerInner) messageExt);
        } else if (messageExt instanceof MessageExtBatch) {
            result = cb.doAppend(this.getFileFromOffset(), byteBuffer, this.fileSize - currentPos, (MessageExtBatch)messageExt);
        } else {
            return new AppendMessageResult(AppendMessageStatus.UNKNOWN_ERROR);
        }
        this.wrotePosition.addAndGet(result.getWroteBytes());     // @4
        this.storeTimestamp = result.getStoreTimestamp();
        return result;
    }
    log.error("MappedFile.appendMessage return null, wrotePosition: {} fileSize: {}", currentPos,  this.fileSize);
    return new AppendMessageResult(AppendMessageStatus.UNKNOWN_ERROR);
}
```

代码@1：获取当前写入位置。

代码@2：根据消息类型，是批量消息还是单个消息，进入相应的处理。

代码@3：消息写入实现。

接下看具体的消息写入逻辑，代码来源于 CommitLog `$` DefaultAppendMessageCallback。

```java
public AppendMessageResult doAppend(final long fileFromOffset, final ByteBuffer byteBuffer, final int maxBlank,
    final MessageExtBrokerInner msgInner) {   //@1
    // STORETIMESTAMP + STOREHOSTADDRESS + OFFSET <br>
    // PHY OFFSET
    long wroteOffset = fileFromOffset + byteBuffer.position();
    this.resetByteBuffer(hostHolder, 8);
    String msgId = MessageDecoder.createMessageId(this.msgIdMemory, msgInner.getStoreHostBytes(hostHolder), wroteOffset);  //@2
    // Record ConsumeQueue information      //@3start
    keyBuilder.setLength(0);
    keyBuilder.append(msgInner.getTopic());
    keyBuilder.append('-');
    keyBuilder.append(msgInner.getQueueId());
    String key = keyBuilder.toString();
    Long queueOffset = CommitLog.this.topicQueueTable.get(key);
    if (null == queueOffset) {
        queueOffset = 0L;
        CommitLog.this.topicQueueTable.put(key, queueOffset);
    }   //@3 end
    // Transaction messages that require special handling       //@4 start
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
    }   // @4 end
    /**
     * Serialize message
     */
    final byte[] propertiesData =
        msgInner.getPropertiesString() == null ? null : msgInner.getPropertiesString().getBytes(MessageDecoder.CHARSET_UTF8);
    final int propertiesLength = propertiesData == null ? 0 : propertiesData.length;
    if (propertiesLength > Short.MAX_VALUE) {
        log.warn("putMessage message properties length too long. length={}", propertiesData.length);
        return new AppendMessageResult(AppendMessageStatus.PROPERTIES_SIZE_EXCEEDED);
    }  //@5
    final byte[] topicData = msgInner.getTopic().getBytes(MessageDecoder.CHARSET_UTF8);
    final int topicLength = topicData.length;
    final int bodyLength = msgInner.getBody() == null ? 0 : msgInner.getBody().length;
    final int msgLen = calMsgLength(bodyLength, topicLength, propertiesLength);    //@6
    // Exceeds the maximum message
    if (msgLen > this.maxMessageSize) {   // @7
        CommitLog.log.warn("message size exceeded, msg total size: " + msgLen + ", msg body size: " + bodyLength
            + ", maxMessageSize: " + this.maxMessageSize);
        return new AppendMessageResult(AppendMessageStatus.MESSAGE_SIZE_EXCEEDED);
    }
    // Determines whether there is sufficient free space
    if ((msgLen + END_FILE_MIN_BLANK_LENGTH) > maxBlank) {  // @8
        this.resetByteBuffer(this.msgStoreItemMemory, maxBlank);
        // 1 TOTALSIZE
        this.msgStoreItemMemory.putInt(maxBlank);
        // 2 MAGICCODE
        this.msgStoreItemMemory.putInt(CommitLog.BLANK_MAGIC_CODE);
        // 3 The remaining space may be any value
        //
        // Here the length of the specially set maxBlank
        final long beginTimeMills = CommitLog.this.defaultMessageStore.now();
        byteBuffer.put(this.msgStoreItemMemory.array(), 0, maxBlank);
        return new AppendMessageResult(AppendMessageStatus.END_OF_FILE, wroteOffset, maxBlank, msgId, msgInner.getStoreTimestamp(),
            queueOffset, CommitLog.this.defaultMessageStore.now() - beginTimeMills);
    }
    // Initialization of storage space   @9
    this.resetByteBuffer(msgStoreItemMemory, msgLen);
    // 1 TOTALSIZE
    this.msgStoreItemMemory.putInt(msgLen);
    // 2 MAGICCODE
    this.msgStoreItemMemory.putInt(CommitLog.MESSAGE_MAGIC_CODE);
    // 3 BODYCRC
    this.msgStoreItemMemory.putInt(msgInner.getBodyCRC());
    // 4 QUEUEID
    this.msgStoreItemMemory.putInt(msgInner.getQueueId());
    // 5 FLAG
    this.msgStoreItemMemory.putInt(msgInner.getFlag());
    // 6 QUEUEOFFSET
    this.msgStoreItemMemory.putLong(queueOffset);
    // 7 PHYSICALOFFSET
    this.msgStoreItemMemory.putLong(fileFromOffset + byteBuffer.position());
    // 8 SYSFLAG
    this.msgStoreItemMemory.putInt(msgInner.getSysFlag());
    // 9 BORNTIMESTAMP
    this.msgStoreItemMemory.putLong(msgInner.getBornTimestamp());
    // 10 BORNHOST
    this.resetByteBuffer(hostHolder, 8);
    this.msgStoreItemMemory.put(msgInner.getBornHostBytes(hostHolder));
    // 11 STORETIMESTAMP
    this.msgStoreItemMemory.putLong(msgInner.getStoreTimestamp());
    // 12 STOREHOSTADDRESS
    this.resetByteBuffer(hostHolder, 8);
    this.msgStoreItemMemory.put(msgInner.getStoreHostBytes(hostHolder));
    //this.msgBatchMemory.put(msgInner.getStoreHostBytes());
    // 13 RECONSUMETIMES
    this.msgStoreItemMemory.putInt(msgInner.getReconsumeTimes());
    // 14 Prepared Transaction Offset
    this.msgStoreItemMemory.putLong(msgInner.getPreparedTransactionOffset());
    // 15 BODY
    this.msgStoreItemMemory.putInt(bodyLength);
    if (bodyLength > 0)
        this.msgStoreItemMemory.put(msgInner.getBody());
    // 16 TOPIC
    this.msgStoreItemMemory.put((byte) topicLength);
    this.msgStoreItemMemory.put(topicData);
    // 17 PROPERTIES
    this.msgStoreItemMemory.putShort((short) propertiesLength);
    if (propertiesLength > 0)
        this.msgStoreItemMemory.put(propertiesData);
    final long beginTimeMills = CommitLog.this.defaultMessageStore.now();
    // Write messages to the queue buffer
    byteBuffer.put(this.msgStoreItemMemory.array(), 0, msgLen);
    AppendMessageResult result = new AppendMessageResult(AppendMessageStatus.PUT_OK, wroteOffset, msgLen, msgId,
        msgInner.getStoreTimestamp(), queueOffset, CommitLog.this.defaultMessageStore.now() - beginTimeMills);     //@10
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

代码@1：参数详解

- fileFromOffset

该文件在整个文件序列中的偏移量。
- ByteBuffer byteBuffer

byteBuffer，NIO 字节容器。
- int maxBlank

最大可写字节数。
- MessageExtBrokerInner msgInner

消息内部封装实体。

代码@2：创建msgId，底层存储由16个字节表示，如下图：

代码@3：根据 topic-queryId 获取该队列的偏移地址（待写入的地址），如果没有，新增一个键值对，当前偏移量为 0。

代码@4：对事务消息需要单独特殊的处理(PREPARE,ROLLBACK类型的消息，不进入Consume队列)。

代码@5：消息的附加属性长度不能超过65536个字节。

代码@6：计算消息存储长度，消息存储格式：

代码@7：如果消息长度超过配置的消息总长度，则返回 MESSAGE_SIZE_EXCEEDED。

代码@8：如果该 MapperFile 中可剩余空间小于当前消息存储空间，返回END_OF_FILE。

代码@9：将消息写入MapperFile中（内存中）。

代码@10：重点讲解一下AppendMessageResult方法。

```java
public AppendMessageResult(AppendMessageStatus status, long wroteOffset, int wroteBytes, String msgId,
    long storeTimestamp, long logicsOffset, long pagecacheRT) {
    this.status = status;
    this.wroteOffset = wroteOffset;
    this.wroteBytes = wroteBytes;
    this.msgId = msgId;
    this.storeTimestamp = storeTimestamp;
    this.logicsOffset = logicsOffset;
    this.pagecacheRT = pagecacheRT;
}
```

- AppendMessageStatus status

追加结果（成功，到达文件尾（文件剩余空间不足）、消息长度超过、消息属性长度超出、未知错误）。
- wroteOffset

消息的偏移量（相对于整个commitlog）。
- wroteBytes

消息待写入字节。
- msgId

消息ID。
- storeTimestamp

消息写入时间戳。
- logicsOffset

消息队列偏移量。
- pagecacheRT

消息写入时机戳（消息存储时间戳--- 消息存储开始时间戳）。

然后返回 AppendMessageStatus，流程回到 【1.2.2 CommitLog.putMessage】的代码@6，如果返回结果是 OK 的话进入到代码@7，@8。

```java
handleDiskFlush(result,  putMessageResult,  msg);      //  @7
handleHA(result,  putMessageResult,  msg);                        //@8
```

我们先关注正常流程，然后再次梳理流程，特别关注异常流程，锁竞争等情况。

## 2、 消息刷盘

```java
public void handleDiskFlush(AppendMessageResult result, PutMessageResult putMessageResult, MessageExt messageExt) {
    // Synchronization flush
    if (FlushDiskType.SYNC_FLUSH == this.defaultMessageStore.getMessageStoreConfig().getFlushDiskType()) {    // @1
        final GroupCommitService service = (GroupCommitService) this.flushCommitLogService;
        if (messageExt.isWaitStoreMsgOK()) {                                // @2
            GroupCommitRequest request = new GroupCommitRequest(result.getWroteOffset() + result.getWroteBytes());
            service.putRequest(request);
            boolean flushOK = request.waitForFlush(this.defaultMessageStore.getMessageStoreConfig().getSyncFlushTimeout());
            if (!flushOK) {
                log.error("do groupcommit, wait for flush failed, topic: " + messageExt.getTopic() + " tags: " + messageExt.getTags()
                    + " client address: " + messageExt.getBornHostString());
                putMessageResult.setPutMessageStatus(PutMessageStatus.FLUSH_DISK_TIMEOUT);
            }
        } else {   //@3
            service.wakeup();
        }
    }
    // Asynchronous flush   //@4
    else {
        if (!this.defaultMessageStore.getMessageStoreConfig().isTransientStorePoolEnable()) {
            flushCommitLogService.wakeup();
        } else {
            commitLogService.wakeup();
        }
    }
}
```

刷写磁盘支持同步、异步刷写，下文将分别重点阐述该这两种机制。

代码@1：同步刷写，这里有两种配置，是否一定要收到存储MSG信息，才返回，默认为true。

代码@2：如果要等待存储结果。

代码@3：唤醒同步刷盘线程。

代码@4：异步刷盘机制。

## 2.1 GroupCommitRequest (同步刷盘)

先来分析一下 GroupCommitRequest 。

- nextOffSet

下一个点的偏移量。
- countDownLatch

闭锁。
- flushOk

是否刷写成功。

GroupCommitService 同步刷盘服务类，一个线程一直的处理同步刷写任务，每处理一个循环后等待 10 毫秒，一旦新任务到达，立即唤醒执行任务。

看一下相关的核心方法：GroupCommitService.run方法。

GroupCommitService 的父类 ServiceThread 的 waitForRunning 方法。

从上面的代码看，我们可以把 doCommit 方法当成业务方法，在 run 方法的循环被调用，每执行完一次 doCommit 等待10毫秒，这也是 waitForRunning 的核心逻辑，doCommit 中的任务是通过调用如下方法：

```java
private void doCommit() {
synchronized (this.requestsRead) {
        if (!this.requestsRead.isEmpty()) {
            for (GroupCommitRequest req : this.requestsRead) {
                // There may be a message in the next file, so a maximum of
                // two times the flush
                boolean flushOK = false;
                for (int i = 0; i < 2 && !flushOK; i++) {
                    flushOK = CommitLog.this.mappedFileQueue.getFlushedWhere() >= req.getNextOffset();
                    if (!flushOK) {
                        CommitLog.this.mappedFileQueue.flush(0); // @1
                    }
                }
                req.wakeupCustomer(flushOK); //@2
            }
            long storeTimestamp = CommitLog.this.mappedFileQueue.getStoreTimestamp();
            if (storeTimestamp > 0) {
                CommitLog.this.defaultMessageStore.getStoreCheckpoint().setPhysicMsgTimestamp(storeTimestamp);
            }
            this.requestsRead.clear();
        } else {
            // Because of individual messages is set to not sync flush, it
            // will come to this process
            CommitLog.this.mappedFileQueue.flush(0);
        }
    }
}
```

代码@1：执行刷盘操作。

代码@2：唤醒用户线程。

刷盘具体实现：MappedFileQueue。

```java
public boolean flush(final int flushLeastPages) {
    boolean result = true;
    MappedFile mappedFile = this.findMappedFileByOffset(this.flushedWhere, false); // @1
    if (mappedFile != null) {
        long tmpTimeStamp = mappedFile.getStoreTimestamp();
        int offset = mappedFile.flush(flushLeastPages); //@2
        long where = mappedFile.getFileFromOffset() + offset;
        result = where == this.flushedWhere;
        this.flushedWhere = where; //@3
        if (0 == flushLeastPages) {
            this.storeTimestamp = tmpTimeStamp;
        }
    }
    return result;
}
```

代码@1：根据上次刷新的位置，得到当前的 MappedFile 对象。

代码@2：执行 MappedFile 的 flush 方法。

代码@3：更新上次刷新的位置。

MappedFile.flush方法详解：

```java
/**
 * @param flushLeastPages
 * @return The current flushed position
 */
public int flush(final int flushLeastPages) {
    if (this.isAbleToFlush(flushLeastPages)) { // @1
        if (this.hold()) {
            int value = getReadPosition();
            try {
                //We only append data to fileChannel or mappedByteBuffer, never both.
                if (writeBuffer != null || this.fileChannel.position() != 0) {
                    this.fileChannel.force(false);
                } else {
                    this.mappedByteBuffer.force();
                }
            } catch (Throwable e) {
                log.error("Error occurred when force data to disk.", e);
            }
            this.flushedPosition.set(value);
            this.release();
        } else {
            log.warn("in flush, hold failed, flush offset = " + this.flushedPosition.get());
            this.flushedPosition.set(getReadPosition());
        }
    }
    return this.getFlushedPosition();
}
```

刷写的实现逻辑就是调用 FileChannel 或 MappedByteBuffer 的force 方法。

在继续探讨异步刷盘前，在简单回顾一下消息存储的过程：

## 2.2 异步刷盘

异步刷盘机制，实现原理很简单，就是按照配置的周期定时提交信息到 MappedFile，定时刷写到磁盘，我们重点关注如下几个配置项。

相关服务类（线程）CommitLog `$` FlushRealTimeService 、CommitLog `$` CommitRealTimeService。

- commitIntervalCommitLog

CommitRealTimeService 线程的循环间隔，默认200ms。
- commitCommitLogLeastPages

每次提交到文件中，至少需要多少个页（默认4页）。
- flushCommitLogLeastPages

每次刷写到磁盘(commitlog)，至少需要多个页（默认4页）。
- flushIntervalCommitLog

异步刷新线程，每次处理完一批任务后的等待时间，默认为500ms。

刷盘的逻辑在同步时已经讲解，现在我们重点看一下提交操作,参考 MappedFileQueue.commit 方法。

MappedFileQueue#commit

```java
public boolean commit(final int commitLeastPages) {
    boolean result = true;
    MappedFile mappedFile = this.findMappedFileByOffset(this.committedWhere, false);
    if (mappedFile != null) {
        int offset = mappedFile.commit(commitLeastPages);
        long where = mappedFile.getFileFromOffset() + offset;
        result = where == this.committedWhere;
        this.committedWhere = where;
    }
    return result;
}
MappedFile.commit:
public int commit(final int commitLeastPages) {
    if (writeBuffer == null) {
        //no need to commit data to file channel, so just regard wrotePosition as committedPosition.
        return this.wrotePosition.get();
    }
    if (this.isAbleToCommit(commitLeastPages)) { //@1
        if (this.hold()) {
            commit0(commitLeastPages); //@2
            this.release();
        } else {
            log.warn("in commit, hold failed, commit offset = " + this.committedPosition.get());
        }
    }
    // All dirty data has been committed to FileChannel.
    if (writeBuffer != null && this.transientStorePool != null && this.fileSize == this.committedPosition.get()) {
        this.transientStorePool.returnBuffer(writeBuffer);
        this.writeBuffer = null;
    }
    return this.committedPosition.get();
}
```

代码@1，看是否可以提交（符合最小需要提交的页）

```java
protected boolean isAbleToCommit(final int commitLeastPages) {
    int flush = this.committedPosition.get(); // @1
    int write = this.wrotePosition.get(); // @2
    if (this.isFull()) { //@3
        return true;
    }
    if (commitLeastPages > 0) { //@4
        return ((write / OS_PAGE_SIZE) - (flush / OS_PAGE_SIZE)) >= commitLeastPages;
    }
    return write > flush;
}
```

代码@1：上次刷新偏移量。

代码@2：当前写入偏移量。

代码@3：如果文件已满，返回true。

代码@4：如果commitLeastPages大于0，则需要判断当前写入的偏移与上次刷新偏移量之间的间隔，如果超过commitLeastPages页数，则提交，否则本次不提交。

代码@5，如果没有新的数据写入，本次提交任务结束。

commit0 方法详解：

```java
protected void commit0(final int commitLeastPages) {
    int writePos = this.wrotePosition.get();
    int lastCommittedPosition = this.committedPosition.get();
    if (writePos - this.committedPosition.get() > 0) {
        try {
            ByteBuffer byteBuffer = writeBuffer.slice();
            byteBuffer.position(lastCommittedPosition);
            byteBuffer.limit(writePos);
            this.fileChannel.position(lastCommittedPosition);
            this.fileChannel.write(byteBuffer);
            this.committedPosition.set(writePos);
        } catch (Throwable e) {
            log.error("Error occurred when commit data to FileChannel.", e);
        }
    }
}
```

该方法的实现原理很简单，就不一一解释了。

## 3、主从同步机制

handleHA(result, putMessageResult, msg);

HA机制本文暂时跳过，后面专题分析。在这里我们只要知道消息同步发送机制时，会首先将消息发送给从，至于数据主从一致性等，下篇重点思考与分析。

再次回顾 ComitLog 消息存储：

ComitLog 存储，主要是先写入到 MappedFile(MappedByteBuffer或FileChannel中：内存中)，此过程多个线程串行处理，然后根据不同的磁盘刷写方法进行刷盘操作、主从同步操作，最终返回结果。

## 4、异常流程

写入MappedByteBuffer阶段相关错误：

**1、** END_OF_FILE；

首先我们知道，一个 MappedFile 对象映射一个 commitLog 文件，一个 commitlog 文件被映射为一个MappedFile(MappedByteBuffer), 由于消息不是定长的，故一个文件最后的剩余空间或许放不下一个消息，为了区分，在每一个commitlog 文件的最后会写入8个字节，表示文件的结束。如果一个文件最后的剩余空间无法存放一个消息时，会抛出END_OF_FILE 错误，此时会重新获取下一个MappedFile,再重新存入，故 END_OF_FILE 在业务层面不会抛出。

**2、** MESSAGE_SIZE_EXCEEDED、PROPERTIES_SIZE_EXCEEDED、UNKNOWN_ERROR；

其他错误直接返回，封装成PutMessageStatus,有错误，直接将错误码返回给消息发送方。

**总结**

本文着重理解了消息存储到 CommitLog 文件的过程，大体分为三个步骤：1）消息追加，也就是将消息追加到 CommitLog 文件对应的内存映射区（本过程是加锁的，非并发；2）刷盘阶段（并发）就是将内存区数据刷写到磁盘文件（支持同步、异步刷盘）；3）主从同步处理（并发）。

后续文章计划：

**1、** 消息消费机制，ConsumeQueue文件；

**2、** 消息主从同步及思考；

**3、** 事务消息实现原理；

**4、** 定时消息；
