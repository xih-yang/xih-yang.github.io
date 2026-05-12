# 15、RocketMQ 源码解析 - 文件恢复
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/15.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## 异常分析

**1、** 由于ConsumeQueue和Index文件都是根据CommitLog文件异步构建的，所以ConsumeQueue、Index与CommitLog文件的数据就是最终一致，而不是强一致的这样在Broker重启时就可能出现不一致性的情况；

- CommitLog文件同步刷盘，当准备转发给ConsumeQueue文件时突然断电或者出现故障，导致ConsumeQueue存储失败
- 在刷盘时，由于突然断电，只写入一部分数据到磁盘CommitLog文件中
- 当数据写入CommitLog文件后才会将刷盘点记录到检查点中，有可能刷盘完成，但是写入检查点文件并没有完成

**2、** RocketMQ有两种文件恢复机制判断异常的方式是在broker启动的时候创建一个abort空文件，在正常结束的时候删掉这个文件在下一次启动broker时，如果发现了abort文件，则认为是异常宕机，否则就是正常关机；

- **正常关机恢复**：先从倒数第三个文件开始进行恢复，然后按照消息的存储格式进行查找，如果改文件中所有的消息都符合消息存储格式，则继续查找下一个文件，直到找到最后一条消息所在的位置
- **异常宕机恢复**：异常停止刷盘时，从最后一个文件开始查找，在查找时读取改文件第一条消息的存储时间，如果这个存储时间小于检查点文件中的刷盘时间，就可以从这个文件开始恢复，如果这个文件中第一条消息的存储时间大于检查点，说明不能从这个文件开始恢复，需要寻找上一个文件。因为检查点文件中的刷盘点代表的是100%可靠的消息。

**3、** 关机恢复机制设计的目的就是保证数据0丢失，RocketMQ通过abort和checkpoint来保证数据0丢失；

- **abort文件**：abort文件时一个空文件，在Broker启动时会被创建，当正常关闭的时候会被删除。如果Broker是异常关闭，则不会删除此文件
- **checkpoint文件**:是一个检查点文件，此文件保存了Broker最后一次**正常存储数据的时间**，当重启Broker时，恢复程序可以从此文件获取应该从哪个时刻开始恢复数据

**4、** 当索引文件刷盘成功，消息队列消费文件未刷盘成功且宕机时，会造成消息消费队列文件丢失的问题但只要Commitlog文件没有丢失，就可以利用RocketMQ的文件恢复机制，恢复丢失的消息消费队列文件在RocketMQ的文件恢复机制中，有针对异常宕机进行文件恢复的机制当broker异常启动，在文件恢复过程中，RocketMQ会将最后一个有效文件的所有消息转发到消息消费队列和索引文件，确保不丢失消息，但同时也会带来重复消费的问题，RocketMQ保证消息不丢失但不保证消息不会重复消费，故消息消费业务方需要实现消息消费的幂等设计；

## StoreCheckpoint

**1、** StoreCheckpoint（检查点）主要用于记录`CommitLog`、`ConsumeQueue`、`Index`文件的刷盘时间点，当上一次broker是异常结束时，会根据StoreCheckpoint的数据进行恢复checkpoint（检查点）文件固定长度为4KB；

**2、** 当索引文件刷盘成功，消息队列消费文件未刷盘成功且宕机时，会造成消息消费队列文件丢失的问题但只要Commitlog文件没有丢失，就可以利用RocketMQ的文件恢复机制，恢复丢失的消息消费队列文件在RocketMQ的文件恢复机制中，有针对异常宕机进行文件恢复的机制当broker异常启动，在文件恢复过程中，RocketMQ会将最后一个有效文件的所有消息转发到消息消费队列和索引文件，确保不丢失消息，但同时也会带来重复消费的问题，RocketMQ保证消息不丢失但不保证消息不会重复消费，故消息消费业务方需要实现消息消费的幂等设计；

**3、** StoreCheckpoint文件源码；

```java
public class StoreCheckpoint {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);
    private final RandomAccessFile randomAccessFile;
    private final FileChannel fileChannel;
    private final MappedByteBuffer mappedByteBuffer;
    //CommitLog最新一条记录的存储时间
    private volatile long physicMsgTimestamp = 0;
    //ConsumeQueue最新一条记录的存储时间
    private volatile long logicsMsgTimestamp = 0;
    //Index File最新一条记录的存储时间
    private volatile long indexMsgTimestamp = 0;
    public StoreCheckpoint(final String scpPath) throws IOException {
        File file = new File(scpPath);
        MappedFile.ensureDirOK(file.getParent());
        boolean fileExists = file.exists();
        this.randomAccessFile = new RandomAccessFile(file, "rw");
        //一旦建立映射（map），fileChannel其实就可以关闭了，关闭fileChannel对映射不会有影响
        //TODO 所以这个地方的fileChannel是不是直接关闭就好?
        this.fileChannel = this.randomAccessFile.getChannel();
        this.mappedByteBuffer = fileChannel.map(MapMode.READ_WRITE, 0, MappedFile.OS_PAGE_SIZE);
        if (fileExists) {
            log.info("store checkpoint file exists, " + scpPath);
            this.physicMsgTimestamp = this.mappedByteBuffer.getLong(0);
            this.logicsMsgTimestamp = this.mappedByteBuffer.getLong(8);
            this.indexMsgTimestamp = this.mappedByteBuffer.getLong(16);
            log.info("store checkpoint file physicMsgTimestamp " + this.physicMsgTimestamp + ", "
                + UtilAll.timeMillisToHumanString(this.physicMsgTimestamp));
            log.info("store checkpoint file logicsMsgTimestamp " + this.logicsMsgTimestamp + ", "
                + UtilAll.timeMillisToHumanString(this.logicsMsgTimestamp));
            log.info("store checkpoint file indexMsgTimestamp " + this.indexMsgTimestamp + ", "
                + UtilAll.timeMillisToHumanString(this.indexMsgTimestamp));
        } else {
            log.info("store checkpoint file not exists, " + scpPath);
        }
    }
    public void shutdown() {
        this.flush();
        // unmap mappedByteBuffer
        MappedFile.clean(this.mappedByteBuffer);
        try {
            this.fileChannel.close();
        } catch (IOException e) {
            log.error("Failed to properly close the channel", e);
        }
    }
    public void flush() {
        this.mappedByteBuffer.putLong(0, this.physicMsgTimestamp);
        this.mappedByteBuffer.putLong(8, this.logicsMsgTimestamp);
        this.mappedByteBuffer.putLong(16, this.indexMsgTimestamp);
        this.mappedByteBuffer.force();
    }
    public long getPhysicMsgTimestamp() {
        return physicMsgTimestamp;
    }
    public void setPhysicMsgTimestamp(long physicMsgTimestamp) {
        this.physicMsgTimestamp = physicMsgTimestamp;
    }
    public long getLogicsMsgTimestamp() {
        return logicsMsgTimestamp;
    }
    public void setLogicsMsgTimestamp(long logicsMsgTimestamp) {
        this.logicsMsgTimestamp = logicsMsgTimestamp;
    }
    public long getMinTimestampIndex() {
        return Math.min(this.getMinTimestamp(), this.indexMsgTimestamp);
    }
    public long getMinTimestamp() {
        long min = Math.min(this.physicMsgTimestamp, this.logicsMsgTimestamp);
        //TODO 这里为什么要减去3000？
        min -= 1000 * 3;
        if (min < 0)
            min = 0;
        return min;
    }
    public long getIndexMsgTimestamp() {
        return indexMsgTimestamp;
    }
    public void setIndexMsgTimestamp(long indexMsgTimestamp) {
        this.indexMsgTimestamp = indexMsgTimestamp;
    }
}
```

## ConsumeQueue与Index文件恢复

**1、** 存储文件的启动时恢复主要完成成`flushedWhere`、`committedWhere`指针的设置、将消息消费队列最大偏移量加载到内存，并删除`flushedWhere`之后所有的文件；

**2、** DefaultMessageStore#load是文件恢复的入口

- 判断abort文件是否存在，此文件在启动时创建，正常停止后时会被删除
- 加载延迟日志文件
- 加载CommitLog文件，按照文件名进行排序。如果文件与配置中的CommitLog文件大小不一致，则直接返回，会忽略后续的文件
- 加载ComsumeQueue文件
- 加载checkpoint文件
- 加载Index文件，如果上次异常退出，而且Index文件刷盘时间大于检查点文件最大的消息时间戳，则立即销毁此文件
- 根据是否正常停止，执行不同的恢复策略

**3、** load源码；

```java
public boolean load() {
    boolean result = true;
    try {
        //判断abort文件是否存在，此文件在启动时创建，正常停止时会被删除
        boolean lastExitOK = !this.isTempFileExist();
        log.info("last shutdown {}", lastExitOK ? "normally" : "abnormally");
        if (null != scheduleMessageService) {
            result = result && this.scheduleMessageService.load();
        }
        // load Commit Log
        result = result && this.commitLog.load();
        // load Consume Queue
        result = result && this.loadConsumeQueue();
        if (result) {
            this.storeCheckpoint =
                new StoreCheckpoint(StorePathConfigHelper.getStoreCheckpoint(this.messageStoreConfig.getStorePathRootDir()));
            this.indexService.load(lastExitOK);
            this.recover(lastExitOK);
            log.info("load over, and the max phy offset = {}", this.getMaxPhyOffset());
        }
    } catch (Exception e) {
        log.error("load exception", e);
        result = false;
    }
    if (!result) {
        this.allocateMappedFileService.shutdown();
    }
    return result;
}
```

### 正常恢复

1. 正常恢复通过CommitLog#recoverNormally实现

- 第一步：从倒数第三个文件开始恢复，如果不足3个文件，从第一个文件开始恢复
- 第二步：遍历CommitLog文件，每次取出一条消息，验证消息。

如果验证结果为true，并且消息长度大于0，表示消息正确并且没有达到末尾，mappedFileOffset指针向前移动本条消息的长度。继续循环，验证下一条消息。
- 如果验证结果为true，并且消息长度等于0，表示已经达到文件末尾，此时如果有下一个文件，则重置mappedFileOffset和processOffset，继续下一次循环
- 如果验证结果为false，表示文件读取错误，此时文件可能不完整。直接退出循环

第三步:更新mappedFileQueue的FlushedWhere和CommittedWhere指针位置

第四步:删除processOffset之后的所有文件（因为文件不完整，不能加载）

1. 正常恢复CommitLog#recoverNormally的源码

```java
public void recoverNormally() {
    // 默认开启CRC验证
    boolean checkCRCOnRecover = this.defaultMessageStore.getMessageStoreConfig().isCheckCRCOnRecover();
    final List<MappedFile> mappedFiles = this.mappedFileQueue.getMappedFiles();
    if (!mappedFiles.isEmpty()) {
        // Began to recover from the last third file
        // 从倒数第三个文件开始恢复
        int index = mappedFiles.size() - 3;
        if (index < 0)
            // 不足三个文件，则从第一个文件开始恢复
            index = 0;
        MappedFile mappedFile = mappedFiles.get(index);
        ByteBuffer byteBuffer = mappedFile.sliceByteBuffer();
        //processOffset为CommitLog文件已确认的物理偏移量
        long processOffset = mappedFile.getFileFromOffset();
        //当前文件已校验通过的物理偏移量
        long mappedFileOffset = 0;
        // 遍历CommitLog文件
        while (true) {
            // 查找消息，根据配置是否验证CRC
            DispatchRequest dispatchRequest = this.checkMessageAndReturnSize(byteBuffer, checkCRCOnRecover);
            int size = dispatchRequest.getMsgSize();
            // Normal data
            if (dispatchRequest.isSuccess() && size > 0) {
                // 没有到文件末尾，mappedFileOffset指针向前移动本条消息的长度
                mappedFileOffset += size;
            }
            // Come the end of the file, switch to the next file Since the
            // return 0 representatives met last hole,
            // this can not be included in truncate offset
            // 文件末尾
            else if (dispatchRequest.isSuccess() && size == 0) {
                index++;
                if (index >= mappedFiles.size()) {
                    // Current branch can not happen
                    log.info("recover last 3 physics file over, last mapped file " + mappedFile.getFileName());
                    break;
                } else {
                    // 下一个文件，重置mappedFileOffset和processOffset，继续下一次循环
                    mappedFile = mappedFiles.get(index);
                    byteBuffer = mappedFile.sliceByteBuffer();
                    //processOffset为CommitLog文件已确认的物理偏移量
                    processOffset = mappedFile.getFileFromOffset();
                    //当前已经校验通过的偏移量
                    mappedFileOffset = 0;
                    log.info("recover next physics file, " + mappedFile.getFileName());
                }
            }
            // Intermediate file read error
            else if (!dispatchRequest.isSuccess()) {
                log.info("recover physics file end, " + mappedFile.getFileName());
                break;
            }
        }
        // 更新MappedFileQueue的flushedWhere和committedWhere指针
        processOffset += mappedFileOffset;
        this.mappedFileQueue.setFlushedWhere(processOffset);
        this.mappedFileQueue.setCommittedWhere(processOffset);
        this.mappedFileQueue.truncateDirtyFiles(processOffset);
    }
}
```

### 异常恢复

1. 异常恢复通过CommitLog#recoverAbnormally实现基本与正常恢复逻辑差不多

- 第一步：异常停止，从最后一个文件倒序，找到第一个消息存储正常的文件。
- 第二步：遍历CommitLog文件，每次取出一条消息，验证消息。

如果验证结果为true，并且消息长度大于0，表示消息正确并且没有达到末尾，mappedFileOffset指针向前移动本条消息的长度。继续循环，验证下一条消息。
- 如果验证结果为true，并且消息长度等于0，表示已经达到文件末尾，此时如果有下一个文件，则重置mappedFileOffset和processOffset，继续下一次循环
- 如果验证结果为false，表示文件读取错误，此时文件可能不完整。直接退出循环

第三步:更新mappedFileQueue的FlushedWhere和CommittedWhere指针位置

第四步:删除processOffset之后的所有文件（因为文件不完整，不能加载）

第五步:如果CommitLog目录没有消息文件，在ConsuneQueue目录下存在的文件则需要销毁

1. 异常恢复CommitLog#recoverAbnormally源码分析

```java
public void recoverAbnormally() {
    // recover by the minimum time stamp
    // 默认为ttue，即校验消息CRC
    boolean checkCRCOnRecover = this.defaultMessageStore.getMessageStoreConfig().isCheckCRCOnRecover();
    final List<MappedFile> mappedFiles = this.mappedFileQueue.getMappedFiles();
    if (!mappedFiles.isEmpty()) {
        // Looking beginning to recover from which file
        // 从最后一个文件开始向前遍历
        int index = mappedFiles.size() - 1;
        MappedFile mappedFile = null;
        for (; index >= 0; index--) {
            mappedFile = mappedFiles.get(index);
            // 找到第一个消息存储正常的文件
            if (this.isMappedFileMatchedRecover(mappedFile)) {
                log.info("recover from this mapped file " + mappedFile.getFileName());
                break;
            }
        }
        if (index < 0) {
            // 第一个文件
            index = 0;
            mappedFile = mappedFiles.get(index);
        }
        ByteBuffer byteBuffer = mappedFile.sliceByteBuffer();
        //processOffset为CommitLog文件已确认的物理偏移量
        long processOffset = mappedFile.getFileFromOffset();
        //当前文件已校验通过的物理偏移量
        long mappedFileOffset = 0;
        // 遍历CommitLog文件
        while (true) {
            // 查找消息，根据配置是否验证CRC
            DispatchRequest dispatchRequest = this.checkMessageAndReturnSize(byteBuffer, checkCRCOnRecover);
            int size = dispatchRequest.getMsgSize();
            // Normal data
            if (size > 0) {
                mappedFileOffset += size;
                if (this.defaultMessageStore.getMessageStoreConfig().isDuplicationEnable()) {
                    if (dispatchRequest.getCommitLogOffset() < this.defaultMessageStore.getConfirmOffset()) {
                        this.defaultMessageStore.doDispatch(dispatchRequest);
                    }
                } else {
                    this.defaultMessageStore.doDispatch(dispatchRequest);
                }
            }
            // Intermediate file read error
            else if (size == -1) {
                log.info("recover physics file end, " + mappedFile.getFileName());
                break;
            }
            // Come the end of the file, switch to the next file
            // Since the return 0 representatives met last hole, this can
            // not be included in truncate offset
            else if (size == 0) {
                index++;
                if (index >= mappedFiles.size()) {
                    // The current branch under normal circumstances should
                    // not happen
                    log.info("recover physics file over, last mapped file " + mappedFile.getFileName());
                    break;
                } else {
                    mappedFile = mappedFiles.get(index);
                    byteBuffer = mappedFile.sliceByteBuffer();
                    processOffset = mappedFile.getFileFromOffset();
                    //当前已经校验通过的偏移量
                    mappedFileOffset = 0;
                    log.info("recover next physics file, " + mappedFile.getFileName());
                }
            }
        }
        // 更新MappedFileQueue的flushedWhere和committedWhere指针
        processOffset += mappedFileOffset;
        this.mappedFileQueue.setFlushedWhere(processOffset);
        this.mappedFileQueue.setCommittedWhere(processOffset);
        this.mappedFileQueue.truncateDirtyFiles(processOffset);
        // Clear ConsumeQueue redundant data
        this.defaultMessageStore.truncateDirtyLogicFiles(processOffset);
    }
    // Commitlog case files are deleted
    else {
        // 未找到有效的MappedFile，更新flushwhere和CommittedWhere为0
        this.mappedFileQueue.setFlushedWhere(0);
        this.mappedFileQueue.setCommittedWhere(0);
        // 删除ConsumeQueue文件
        this.defaultMessageStore.destroyLogics();
    }
}
```
