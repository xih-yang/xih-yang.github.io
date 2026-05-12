# 13、RocketMQ 源码解析 - ConsumeQueue
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/13.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## ConsumeQueue

**1、** 每个`ConsumeQueue`都有一个queueId，queueId的值为0到TopicConfig配置的队列数量比如某个Topic的消费队列数量为4，那么四个`ConsumeQueue`的queueId就分别为0、1、2、3；

**2、**`ConsumerQueue`相当于`CommitLog`的索引文件，消费者消费时会先从`ConsumerQueue`中查找消息在`CommitLog`中的offset，再去CommitLog中找原始消息数据如果某个消息只在`CommitLog`中有数据，没在`ConsumerQueue`中，则消费者无法消费；

**3、**`Consumequeue`类对应的是每个topic和queuId下面的所有文件.默认存储路径是**$HOME/store/consumequeue/{topic}/{queueId}/{fileName}**，每个文件由30w条数据组成，单个文件的大小是**30wx20Byte**；

**4、** 每一个ConsumeQueue存储的格式为`commitLogOffset(8B)+size(4B)+tagHashCode(8B)`,总共20B存tag是为了在Consumer取到消息offset后先根据tag做一次过滤，剩下的才需要到`CommitLog`中取消息详情；

**5、****ConsumeQueue**核心属性；

```java
public class ConsumeQueue {
   private final DefaultMessageStore defaultMessageStore;
   //映射文件队列，管理ConsumeQueue
   private final MappedFileQueue mappedFileQueue;
   // 消息topic
   private final String topic;
   // 消息队列Id
   private final int queueId;
   //指定大小的缓冲，记录的大小是20byte的固定大小
   private final ByteBuffer byteBufferIndex;
   //保存的路径
   private final String storePath;
   //映射文件的大小
   private final int mappedFileSize;
   //最后一个消息对应的物理偏移量  也就是在CommitLog中的偏移量
   private long maxPhysicOffset = -1;
   //最小的逻辑偏移量 在ConsumeQueue中的最小偏移量
   private volatile long minLogicOffset = 0;
   //ConsumeQueue的扩展文件
   private ConsumeQueueExt consumeQueueExt = null;
}   
```

**6、** 构造方法；

```java
public ConsumeQueue(
    final String topic,
    final int queueId,
    final String storePath,
    final int mappedFileSize,
    final DefaultMessageStore defaultMessageStore) {
    this.storePath = storePath;
    this.mappedFileSize = mappedFileSize;
    this.defaultMessageStore = defaultMessageStore;
    this.topic = topic;
    this.queueId = queueId;
    //存储路径${this.storePath}/{topic}/{queueId}/{fileName}
    String queueDir = this.storePath
        + File.separator + topic
        + File.separator + queueId;
    this.mappedFileQueue = new MappedFileQueue(queueDir, mappedFileSize, null);
    //分配一个存储单元大小（20B）的缓冲区
    this.byteBufferIndex = ByteBuffer.allocate(CQ_STORE_UNIT_SIZE);
    //是否启用消息队列的扩展存储
    if (defaultMessageStore.getMessageStoreConfig().isEnableConsumeQueueExt()) {
        this.consumeQueueExt = new ConsumeQueueExt(
            topic,
            queueId,
            StorePathConfigHelper.getStorePathConsumeQueueExt(defaultMessageStore.getMessageStoreConfig().getStorePathRootDir()),
            defaultMessageStore.getMessageStoreConfig().getMappedFileSizeConsumeQueueExt(),
            defaultMessageStore.getMessageStoreConfig().getBitMapLengthConsumeQueueExt()
        );
    }
}
```

### 加载(load)

**1、** Broker启动时，调用load加载**ConsumeQueue**加载直接委托mappedFileQueue进行加载；

```java
public boolean load() {
    boolean result = this.mappedFileQueue.load();
    log.info("load consume queue " + this.topic + "-" + this.queueId + " " + (result ? "OK" : "Failed"));
    //扩展存储存在则加载
    if (isExtReadEnable()) {
        result &= this.consumeQueueExt.load();
    }
    return result;
}
```

### 恢复(recover)

**1、** Broker启动时会尝试恢复ConsumeQueue文件；

- 如果文件个数大于3个就从倒数第三个文件开始恢复，否则从第一个开始
- 循环遍历文件中的的所有数据，按照20个字节读取。知道全部读取完成
- 删除有效offset之后的文件

**2、** 源码；

```java
public void recover() {
    final List<MappedFile> mappedFiles = this.mappedFileQueue.getMappedFiles();
    if (!mappedFiles.isEmpty()) {
        //如果文件列表大于3就从倒数第3个开始，否则从第一个开始
        int index = mappedFiles.size() - 3;
        if (index < 0)
            index = 0;
        //获取consumeQueue单个文件的大小
        int mappedFileSizeLogics = this.mappedFileSize;
        //获取index对应的映射文件
        MappedFile mappedFile = mappedFiles.get(index);
        ByteBuffer byteBuffer = mappedFile.sliceByteBuffer();
        //映射文件的起始偏移量（也是文件名）
        long processOffset = mappedFile.getFileFromOffset();
        long mappedFileOffset = 0;
        long maxExtAddr = 1;
        while (true) {
            //遍历文件中的所有数据（20个字节一次遍历）
            for (int i = 0; i < mappedFileSizeLogics; i += CQ_STORE_UNIT_SIZE) {
                long offset = byteBuffer.getLong();
                int size = byteBuffer.getInt();
                long tagsCode = byteBuffer.getLong();
                //顺序解析，每个数据单元隔20个字节,如果offset跟size大于0则表示有效
                if (offset >= 0 && size > 0) {
                    //正常数据的大小
                    mappedFileOffset = i + CQ_STORE_UNIT_SIZE;
                    //设置最大的物理偏移量
                    this.maxPhysicOffset = offset;
                    if (isExtAddr(tagsCode)) {
                        maxExtAddr = tagsCode;
                    }
                } else {
                    log.info("recover current consume queue file over,  " + mappedFile.getFileName() + " "
                        + offset + " " + size + " " + tagsCode);
                    break;
                }
            }
            //文件加载完毕
            if (mappedFileOffset == mappedFileSizeLogics) {
                index++;
                // 完成加载跳出循环
                if (index >= mappedFiles.size()) {
                    log.info("recover last consume queue file over, last mapped file "
                        + mappedFile.getFileName());
                    break;
                } else {
                    //下一个文件，继续循环读取
                    mappedFile = mappedFiles.get(index);
                    byteBuffer = mappedFile.sliceByteBuffer();
                    processOffset = mappedFile.getFileFromOffset();
                    mappedFileOffset = 0;
                    log.info("recover next consume queue file, " + mappedFile.getFileName());
                }
            } else {
                log.info("recover current consume queue queue over " + mappedFile.getFileName() + " "
                    + (processOffset + mappedFileOffset));
                break;
            }
        }
        // 最后一个文件的起始偏移量+正常数据的长度
        processOffset += mappedFileOffset;
        //设置flush和commit偏移量位置
        this.mappedFileQueue.setFlushedWhere(processOffset);
        this.mappedFileQueue.setCommittedWhere(processOffset);
        //删除有效的 offset 之后的文件（后面的是无效的，需要删除掉）
        this.mappedFileQueue.truncateDirtyFiles(processOffset);
        //如果有扩展文件，则恢复扩展文件
        if (isExtReadEnable()) {
            this.consumeQueueExt.recover();
            log.info("Truncate consume queue extend file by max {}", maxExtAddr);
            this.consumeQueueExt.truncateByMaxAddress(maxExtAddr);
        }
    }
}
```

### 追加分发的消息（putMessagePositionInfoWrapper）

**1、** 分发的消息通过putMessagePositionInfoWrapper方法追加；

- 判断消息队列是否可写，是否开启写ConsumeQueue扩展文件默认false
- 将消息写入缓存区MappedFile中
- 如果追加成功，则更新checkpoint的时间戳

**2、**`putMessagePositionInfoWrapper`源码；

```java
public void putMessagePositionInfoWrapper(DispatchRequest request) {
    final int maxRetries = 30;
    //判断ConsumeQueue是否可写
    boolean canWrite = this.defaultMessageStore.getRunningFlags().isCQWriteable();
    for (int i = 0; i < maxRetries && canWrite; i++) {
        long tagsCode = request.getTagsCode();
        //是否开启写ConsumeQueue扩展文件，默认false
        //bloom过滤器先记录消息的bitMap，这样consumer来读取消息时先通过bloom过滤器判断是否有符合过滤条件的消息
        if (isExtWriteEnable()) {
            ConsumeQueueExt.CqExtUnit cqExtUnit = new ConsumeQueueExt.CqExtUnit();
            cqExtUnit.setFilterBitMap(request.getBitMap());
            cqExtUnit.setMsgStoreTime(request.getStoreTimestamp());
            cqExtUnit.setTagsCode(request.getTagsCode());
            long extAddr = this.consumeQueueExt.put(cqExtUnit);
            if (isExtAddr(extAddr)) {
                tagsCode = extAddr;
            } else {
                log.warn("Save consume queue extend fail, So just save tagsCode! {}, topic:{}, queueId:{}, offset:{}", cqExtUnit,
                    topic, queueId, request.getCommitLogOffset());
            }
        }
        //写入缓冲区
        boolean result = this.putMessagePositionInfo(request.getCommitLogOffset(),
            request.getMsgSize(), tagsCode, request.getConsumeQueueOffset());
        //如果更新成功，则更新checkpoint文件
        if (result) {
            this.defaultMessageStore.getStoreCheckpoint().setLogicsMsgTimestamp(request.getStoreTimestamp());
            return;
        } else {
            // XXX: warn and notify me
            log.warn("[BUG]put commit log position info to " + topic + ":" + queueId + " " + request.getCommitLogOffset()
                + " failed, retry " + i + " times");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                log.warn("", e);
            }
        }
    }
    // XXX: warn and notify me
    log.error("[BUG]consume queue can not write, {} {}", this.topic, this.queueId);
    this.defaultMessageStore.getRunningFlags().makeLogicsQueueError();
}
private boolean putMessagePositionInfo(final long offset, final int size, final long tagsCode,
    final long cqOffset) {
    //maxPhysicOffset记录了上一次ConsumeQueue更新的消息在CommitLog中的偏移量
    // 如果消息已经被处理，则直接返回true
    if (offset <= this.maxPhysicOffset) {
        return true;
    }
    this.byteBufferIndex.flip();
    //20byte
    this.byteBufferIndex.limit(CQ_STORE_UNIT_SIZE);
    this.byteBufferIndex.putLong(offset);//写入消息偏移量
    this.byteBufferIndex.putInt(size);//写入消息长度
    this.byteBufferIndex.putLong(tagsCode);//写入tag hashcode
    //cqOffset为ConsumerQueue中记录了偏移量总数
    final long expectLogicOffset = cqOffset * CQ_STORE_UNIT_SIZE;
    //获取ConsumeQueue当前对应的MappedFile，ConsumeQueue本身也是通过MappedFileQueue来管理的
    MappedFile mappedFile = this.mappedFileQueue.getLastMappedFile(expectLogicOffset);
    if (mappedFile != null) {
        //对于新建的文件，填充0来预热PageCache
        if (mappedFile.isFirstCreateInQueue() && cqOffset != 0 && mappedFile.getWrotePosition() == 0) {
            this.minLogicOffset = expectLogicOffset;
            this.mappedFileQueue.setFlushedWhere(expectLogicOffset);
            this.mappedFileQueue.setCommittedWhere(expectLogicOffset);
            this.fillPreBlank(mappedFile, expectLogicOffset);
            log.info("fill pre blank space " + mappedFile.getFileName() + " " + expectLogicOffset + " "
                + mappedFile.getWrotePosition());
        }
        if (cqOffset != 0) {
            long currentLogicOffset = mappedFile.getWrotePosition() + mappedFile.getFileFromOffset();
            //说明已经处理过
            if (expectLogicOffset < currentLogicOffset) {
                log.warn("Build  consume queue repeatedly, expectLogicOffset: {} currentLogicOffset: {} Topic: {} QID: {} Diff: {}",
                    expectLogicOffset, currentLogicOffset, this.topic, this.queueId, expectLogicOffset - currentLogicOffset);
                return true;
            }
            if (expectLogicOffset != currentLogicOffset) {
                LOG_ERROR.warn(
                    "[BUG]logic queue order maybe wrong, expectLogicOffset: {} currentLogicOffset: {} Topic: {} QID: {} Diff: {}",
                    expectLogicOffset,
                    currentLogicOffset,
                    this.topic,
                    this.queueId,
                    expectLogicOffset - currentLogicOffset
                );
            }
        }
        //更新物理偏移量，追加到MappedFile。如果appendMessage追加失败了,等下次继续追加，所以这里可以直接给maxPhysicOffset赋值，不用关心是否追加成功
        this.maxPhysicOffset = offset;
        return mappedFile.appendMessage(this.byteBufferIndex.array());
    }
    return false;
}
private void fillPreBlank(final MappedFile mappedFile, final long untilWhere) {
    ByteBuffer byteBuffer = ByteBuffer.allocate(CQ_STORE_UNIT_SIZE);
    byteBuffer.putLong(0L);
    byteBuffer.putInt(Integer.MAX_VALUE);
    byteBuffer.putLong(0L);
    int until = (int) (untilWhere % this.mappedFileQueue.getMappedFileSize());
    for (int i = 0; i < until; i += CQ_STORE_UNIT_SIZE) {
        mappedFile.appendMessage(byteBuffer.array());
    }
}
```

## ReputMessageService

**1、****ReputMessageService**是一个服务线程，用于ConsumeQueue持久化，它是**DefaultMessageStore**的内部类此服务线程主要运行doReput方法每间隔1ms执行一次；

```java
public void run() {
    DefaultMessageStore.log.info(this.getServiceName() + " service started");
    while (!this.isStopped()) {
        try {
            Thread.sleep(1);
            this.doReput();
        } catch (Exception e) {
            DefaultMessageStore.log.warn(this.getServiceName() + " service has exception. ", e);
        }
    }
    DefaultMessageStore.log.info(this.getServiceName() + " service end");
}
```

**2、** doReput大致步骤；

- 获取CommitLog在reputFromOffset处存储的可以被处理的消息（可能在不同的MappedFile中）
- 循环遍历这些消息，并将每个消息相关数据转换为DispatchRequest
- 分发DispatchRequest到CommitLogDispatcher中执行

**3、** doReput流程图；

## CommitLogDispatcher

**1、****CommitLogDispatcher**是**CommitLog日志消息**分发器，主要用来生成**ConsumerQueue**和**IndexFile**此接口有三个实现；

- **CommitLogDispatcherBuildConsumeQueue** 处理ConsumeQueue的生成
- **CommitLogDispatcherBuildIndex**处理IndexFile的生成
- **CommitLogDispatcherCalcBitMap** 处理计算bit Map

**2、****CommitLogDispatcherBuildConsumeQueue**源码只处理**TRANSACTION_NOT_TYPE**和**TRANSACTION_COMMIT_TYPE**这两种消息这两种消息一种是非事务消息，即普通消息一种是事务已经确切提交的消息；

```java
class CommitLogDispatcherBuildConsumeQueue implements CommitLogDispatcher {
    @Override
    public void dispatch(DispatchRequest request) {
        final int tranType = MessageSysFlag.getTransactionValue(request.getSysFlag());
        switch (tranType) {
            case MessageSysFlag.TRANSACTION_NOT_TYPE:
            case MessageSysFlag.TRANSACTION_COMMIT_TYPE:
                DefaultMessageStore.this.putMessagePositionInfo(request);
                break;
            case MessageSysFlag.TRANSACTION_PREPARED_TYPE:
            case MessageSysFlag.TRANSACTION_ROLLBACK_TYPE:
                break;
        }
    }
}
public void putMessagePositionInfo(DispatchRequest dispatchRequest) {
    //根据主题与队列获取对应的ConsumeQueue
    ConsumeQueue cq = this.findConsumeQueue(dispatchRequest.getTopic(), dispatchRequest.getQueueId());
    cq.putMessagePositionInfoWrapper(dispatchRequest);
}
```
