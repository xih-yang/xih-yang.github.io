# 16、RocketMQ 源码解析 - 文件清理
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/16.html
- 分类：消息队列
- 分组：教程目录
## 简介

**1、** Broker文件清理主要清理CommitLog、ConsumeQueue、IndexFile；

**2、** CommitLog清理规则；

- 文件过期（默认72小时），且达到清理时间点（默认是凌晨4点），删除过期文件
- 文件过期（默认72小时），且磁盘空间达到了75%（默认），删除过期文件
- 磁盘已经达到上限（默认85%）的时候，则开始批量清理文件（无论是否过期），直到空间充足
- 只删除到倒数第二个文件，不删除最后一个文件

**3、** 若磁盘空间达到危险水位线（默认90%），出于保护自身的目的，broker会拒绝写入服务；

**4、** 清理CommitLog并不是一条一条的删除，而是对比MappedFile最后一条消息是否还在实效范围内，如果是则不会被清理，否则会被清理除非当磁盘占用85%时，此时无论是否过期，会理解删除清理完CommitLog后，获取到CommitLog最小的偏移量offset，然后将ConsumeQueue和IndexFile中最小的offset删除掉（同样也是删除文件）；

## 源码分析

1. DefaultMessageStore#start启动时，会添加一些定时任务（调用DefaultMessageStore#addScheduleTask方法），其中有一个定时任务就是清理文件的。默认初始延迟60s，每10s执行一次

```java
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
    @Override
    public void run() {
        DefaultMessageStore.this.cleanFilesPeriodically();
    }
}, 1000 * 60, this.messageStoreConfig.getCleanResourceInterval(), TimeUnit.MILLISECONDS);
private void cleanFilesPeriodically() {
  	// 清理CommitLog
    this.cleanCommitLogService.run();
  	// 清理ConsumeQueue和IndexFile
    this.cleanConsumeQueueService.run();
}
```

## CommitLog清理

**1、**`CleanCommitLogService`用于清理CommitLog文件此类的run方式被删除文件定时任务调用；

```java
public void run() {
    try {
        //删除过期文件
        this.deleteExpiredFiles();
        // 重删挂起的文件，线程引用过期文件、内存映射清理失败，都可能导致删除失败
        // 判断第一个MappedFile是否可用
        // 可能上面的MappedFile销毁失败，只是设置了不可用，但是并没有销毁，此处重删。但是这里只是删除第一个？
        this.redeleteHangedFile();
    } catch (Throwable e) {
        DefaultMessageStore.log.warn(this.getServiceName() + " service has exception. ", e);
    }
}
```

1. CleanCommitLogService#deleteExpiredFiles

- 文件保留时间，默认72小时，多个文件默认删除间隔100ms（为了避免影响磁盘性能）
- 删除的触发条件有三个：到了删除时间、磁盘满了、手动删除（目前没看到哪里使用）

```java
private void deleteExpiredFiles() {
    int deleteCount = 0;
    //文件保留时间，默认72小时
    long fileReservedTime = DefaultMessageStore.this.getMessageStoreConfig().getFileReservedTime();
    //删除的时间间隔，默认100ms
    int deletePhysicFilesInterval = DefaultMessageStore.this.getMessageStoreConfig().getDeleteCommitLogFilesInterval();
    //
    int destroyMapedFileIntervalForcibly = DefaultMessageStore.this.getMessageStoreConfig().getDestroyMapedFileIntervalForcibly();
    //是否到删除时间，默认是04，凌晨4点
    boolean timeup = this.isTimeToDelete();
    //磁盘空间是否满了
    boolean spacefull = this.isSpaceToDelete();
    //TODO 手动删除文件次数是否大于0，目前没看到哪里使用到
    boolean manualDelete = this.manualDeleteFileSeveralTimes > 0;
    if (timeup || spacefull || manualDelete) {
        if (manualDelete)
            this.manualDeleteFileSeveralTimes--;
        // 开启强制清理（默认true）&& 立即清理
        boolean cleanAtOnce = DefaultMessageStore.this.getMessageStoreConfig().isCleanFileForciblyEnable() && this.cleanImmediately;
        log.info("begin to delete before {} hours file. timeup: {} spacefull: {} manualDeleteFileSeveralTimes: {} cleanAtOnce: {}",
            fileReservedTime,
            timeup,
            spacefull,
            manualDeleteFileSeveralTimes,
            cleanAtOnce);
        //过期时间默认是72小时，如果一个文件commitLog的数据文件在72小时内没有被修改过 那么就认为该文件已经过期了
        fileReservedTime *= 60 * 60 * 1000;
        //删除文件，通过mappedFileQueue来删除
        deleteCount = DefaultMessageStore.this.commitLog.deleteExpiredFile(fileReservedTime, deletePhysicFilesInterval,
            destroyMapedFileIntervalForcibly, cleanAtOnce);
        if (deleteCount > 0) {
        } else if (spacefull) {
            log.warn("disk space will be full soon, but delete file failed.");
        }
    }
}
```

**3、** 判断是否到时间，默认是凌晨四点，判断小时是否是当前小时；

```java
private boolean isTimeToDelete() {
    // 默认是04，凌晨4点。多个时间使用;分号分隔
    String when = DefaultMessageStore.this.getMessageStoreConfig().getDeleteWhen();
    if (UtilAll.isItTimeToDo(when)) {
        DefaultMessageStore.log.info("it's time to reclaim disk space, " + when);
        return true;
    }
    return false;
}
```

**4、** 判断磁盘空间是否满了：磁盘占比配置，默认是75%，如果配置小于10，则按照10如果配置大于95则按照95大于75%，则返回磁盘空间满的状态如果磁盘使用率大于85%，设置立即清理状态为true，表示无论是否72小时过期，都会删除；

```java
private final double diskSpaceWarningLevelRatio =
            Double.parseDouble(System.getProperty("rocketmq.broker.diskSpaceWarningLevelRatio", "0.90"));
private final double diskSpaceCleanForciblyRatio =
            Double.parseDouble(System.getProperty("rocketmq.broker.diskSpaceCleanForciblyRatio", "0.85"));
private boolean isSpaceToDelete() {
    // 磁盘空间占比默认是0.75，如果配置<10，按照10，如果配置>95,按照95
    double ratio = DefaultMessageStore.this.getMessageStoreConfig().getDiskMaxUsedSpaceRatio() / 100.0;
    cleanImmediately = false;
    {
        // CommitLog路径
        String storePathPhysic = DefaultMessageStore.this.getMessageStoreConfig().getStorePathCommitLog();
        // 返回此磁盘分区使用的占比
        double physicRatio = UtilAll.getDiskPartitionSpaceUsedPercent(storePathPhysic);
        // 如果磁盘使用率大于90%，就设置runningFlags标志位为磁盘满了的状态
        if (physicRatio > diskSpaceWarningLevelRatio) {
            boolean diskok = DefaultMessageStore.this.runningFlags.getAndMakeDiskFull();
            if (diskok) {
                DefaultMessageStore.log.error("physic disk maybe full soon " + physicRatio + ", so mark disk full");
            }
            // 设置立即清理
            cleanImmediately = true;
        } else if (physicRatio > diskSpaceCleanForciblyRatio) {
            // 如果磁盘占比超过85%，也是设置立即清理
            cleanImmediately = true;
        } else {
            // 设置磁盘空间是OK
            boolean diskok = DefaultMessageStore.this.runningFlags.getAndMakeDiskOK();
            if (!diskok) {
                DefaultMessageStore.log.info("physic disk space OK " + physicRatio + ", so mark disk ok");
            }
        }
        // 实际占比<0或者大于配置的（默认75%） ，则返回true
        if (physicRatio < 0 || physicRatio > ratio) {
            DefaultMessageStore.log.info("physic disk maybe full soon, so reclaim space, " + physicRatio);
            return true;
        }
    }
    {
        // ConsumeQueue的判断与上面一样
        String storePathLogics = StorePathConfigHelper
            .getStorePathConsumeQueue(DefaultMessageStore.this.getMessageStoreConfig().getStorePathRootDir());
        double logicsRatio = UtilAll.getDiskPartitionSpaceUsedPercent(storePathLogics);
        if (logicsRatio > diskSpaceWarningLevelRatio) {
            boolean diskok = DefaultMessageStore.this.runningFlags.getAndMakeDiskFull();
            if (diskok) {
                DefaultMessageStore.log.error("logics disk maybe full soon " + logicsRatio + ", so mark disk full");
            }
            cleanImmediately = true;
        } else if (logicsRatio > diskSpaceCleanForciblyRatio) {
            cleanImmediately = true;
        } else {
            boolean diskok = DefaultMessageStore.this.runningFlags.getAndMakeDiskOK();
            if (!diskok) {
                DefaultMessageStore.log.info("logics disk space OK " + logicsRatio + ", so mark disk ok");
            }
        }
        if (logicsRatio < 0 || logicsRatio > ratio) {
            DefaultMessageStore.log.info("logics disk maybe full soon, so reclaim space, " + logicsRatio);
            return true;
        }
    }
    return false;
}
```

1. 删除时CommitLog调用MappedFileQueue#deleteExpiredFileByTime来进行清理

- 如果是已经过期或者立即删除状态，则对文件进行摧毁并删除。只删除到倒数第二个文件，不删除最后一个文件
- 一次最多删除10个文件，每间隔100ms删除一个文件

```java
public int deleteExpiredFileByTime(final long expiredTime,
    final int deleteFilesInterval,
    final long intervalForcibly,
    final boolean cleanImmediately) {
    // 为了不影响正常的写入，克隆一份
    Object[] mfs = this.copyMappedFiles(0);
    if (null == mfs)
        return 0;
		// length-1是不删除最后一个文件，最后一个一般都在使用
    int mfsLength = mfs.length - 1;
    int deleteCount = 0;
    List<MappedFile> files = new ArrayList<MappedFile>();
    //FIXME by jannal 上面已经判断过不为空了，此处不需要再次判断了吧？
    if (null != mfs) {
        for (int i = 0; i < mfsLength; i++) {
            MappedFile mappedFile = (MappedFile) mfs[i];
            // 最后修改时间+过期时间
            long liveMaxTimestamp = mappedFile.getLastModifiedTimestamp() + expiredTime;
            // 已经过期，或者立即清除
            if (System.currentTimeMillis() >= liveMaxTimestamp || cleanImmediately) {
                // 进行销毁（有可能destroy返回false）
                if (mappedFile.destroy(intervalForcibly)) {
                    files.add(mappedFile);
                    deleteCount++;
                    // 一次最多删除10个
                    if (files.size() >= DELETE_FILES_BATCH_MAX) {
                        break;
                    }
                    // 每个文件的删除间隔
                    if (deleteFilesInterval > 0 && (i + 1) < mfsLength) {
                        try {
                            Thread.sleep(deleteFilesInterval);
                        } catch (InterruptedException e) {
                        }
                    }
                } else {
                    break;
                }
            } else {
                //avoid deleting files in the middle
                break;
            }
        }
    }
    // 删除MappedFileQueue队列中的MappedFile
    deleteExpiredFile(files);
    return deleteCount;
}
void deleteExpiredFile(List<MappedFile> files) {
    if (!files.isEmpty()) {
				//遍历不包含就跳过
        Iterator<MappedFile> iterator = files.iterator();
        while (iterator.hasNext()) {
            MappedFile cur = iterator.next();
            if (!this.mappedFiles.contains(cur)) {
                iterator.remove();
                log.info("This mappedFile {} is not contained by mappedFiles, so skip it.", cur.getFileName());
            }
        }
        try {
            if (!this.mappedFiles.removeAll(files)) {
                log.error("deleteExpiredFile remove failed.");
            }
        } catch (Exception e) {
            log.error("deleteExpiredFile has exception.", e);
        }
    }
}
public boolean destroy(final long intervalForcibly) {
    this.shutdown(intervalForcibly);
    // 清理结束（判断引用是否清除）
    if (this.isCleanupOver()) {
        try {
            // 关闭channel
            this.fileChannel.close();
            log.info("close file channel " + this.fileName + " OK");
            long beginTime = System.currentTimeMillis();
            // 删除文件
            boolean result = this.file.delete();
            log.info("delete file[REF:" + this.getRefCount() + "] " + this.fileName
                + (result ? " OK, " : " Failed, ") + "W:" + this.getWrotePosition() + " M:"
                + this.getFlushedPosition() + ", "
                + UtilAll.computeEclipseTimeMilliseconds(beginTime));
        } catch (Exception e) {
            log.warn("close file channel " + this.fileName + " Failed. ", e);
        }
        return true;
    } else {
        log.warn("destroy mapped file[REF:" + this.getRefCount() + "] " + this.fileName
            + " Failed. cleanupOver: " + this.cleanupOver);
    }
    return false;
}
public void shutdown(final long intervalForcibly) {
    if (this.available) {
        // 标记不可用
        this.available = false;
        this.firstShutdownTimestamp = System.currentTimeMillis();
        // 如果引用大于0，则不不会释放
        this.release();
    } else if (this.getRefCount() > 0) {
        if ((System.currentTimeMillis() - this.firstShutdownTimestamp) >= intervalForcibly) {
            this.refCount.set(-1000 - this.getRefCount());
            this.release();
        }
    }
}
public void release() {
    long value = this.refCount.decrementAndGet();
    if (value > 0)
        return;
    synchronized (this) {
        //如果引用计数小于或者等于0，则执行清理堆外内存
        this.cleanupOver = this.cleanup(value);
    }
}
```

1. CleanCommitLogService#redeleteHangedFile删除挂起的文件（120s删除一次）。主要逻辑就是判断第一个MappedFile是否可用，如果不可用，就删除掉。在第二次删除时调用**destroy->`shutdown**方法会执行else if部分逻辑，强制设置引用次数为负，这样就能释放内存了。

```java
 private void redeleteHangedFile() {
     // 默认120s
     int interval = DefaultMessageStore.this.getMessageStoreConfig().getRedeleteHangedFileInterval();
     long currentTimestamp = System.currentTimeMillis();
     if ((currentTimestamp - this.lastRedeleteTimestamp) > interval) {
         this.lastRedeleteTimestamp = currentTimestamp;
         int destroyMapedFileIntervalForcibly =
             DefaultMessageStore.this.getMessageStoreConfig().getDestroyMapedFileIntervalForcibly();
         if (DefaultMessageStore.this.commitLog.retryDeleteFirstFile(destroyMapedFileIntervalForcibly)) {
         }
     }
 }
public boolean retryDeleteFirstFile(final long intervalForcibly) {
    MappedFile mappedFile = this.getFirstMappedFile();
    if (mappedFile != null) {
        if (!mappedFile.isAvailable()) {
            log.warn("the mappedFile was destroyed once, but still alive, " + mappedFile.getFileName());
            boolean result = mappedFile.destroy(intervalForcibly);
            if (result) {
                log.info("the mappedFile re delete OK, " + mappedFile.getFileName());
                List<MappedFile> tmpFiles = new ArrayList<MappedFile>();
                tmpFiles.add(mappedFile);
                this.deleteExpiredFile(tmpFiles);
            } else {
                log.warn("the mappedFile re delete failed, " + mappedFile.getFileName());
            }
            return result;
        }
    }
    return false;
}
```

## ConsumeQueue和Index清理

**1、**`CleanConsumeQueueService`用于清理ConsumeQueue和Index文件当CommitLog文件被删除了，那么对应的ConsumeQueue和Index文件也就没有存在的必要了；

```java
public void run() {
    try {
        this.deleteExpiredFiles();
    } catch (Throwable e) {
        DefaultMessageStore.log.warn(this.getServiceName() + " service has exception. ", e);
    }
}
```

1. CleanConsumeQueueService#deleteExpiredFiles删除过期文件

```java
private void deleteExpiredFiles() {
    // 删除索引文件的时间间隔，默认100ms
    int deleteLogicsFilesInterval = DefaultMessageStore.this.getMessageStoreConfig().getDeleteConsumeQueueFilesInterval();
    // 获取CommitLog最小偏移量
    long minOffset = DefaultMessageStore.this.commitLog.getMinOffset();
    if (minOffset > this.lastPhysicalMinOffset) {
        this.lastPhysicalMinOffset = minOffset;
        // 遍历ConsumeQueue集合
        ConcurrentMap<String, ConcurrentMap<Integer, ConsumeQueue>> tables = DefaultMessageStore.this.consumeQueueTable;
        for (ConcurrentMap<Integer, ConsumeQueue> maps : tables.values()) {
            for (ConsumeQueue logic : maps.values()) {
                // 删除过期的ConsumeQueue索引文件
                int deleteCount = logic.deleteExpiredFile(minOffset);
                if (deleteCount > 0 && deleteLogicsFilesInterval > 0) {
                    try {
                        //休眠，避免影响磁盘I/O
                        Thread.sleep(deleteLogicsFilesInterval);
                    } catch (InterruptedException ignored) {
                    }
                }
            }
        }
        // 删除Index File过期文件
        DefaultMessageStore.this.indexService.deleteExpiredFile(minOffset);
    }
}
// 使用  mappedFileQueue来删除
public int deleteExpiredFile(long offset) {
    // 根据CommitLog最小的有效的offset查找小于该offset的ConsumeQueue MappedFile文件删除
    int cnt = this.mappedFileQueue.deleteExpiredFileByOffset(offset, CQ_STORE_UNIT_SIZE);
    // 根据CommitLog最小的有效的offset修正最小的ConsumeQueue索引offset minLogicOffset
    this.correctMinOffset(offset);
    return cnt;
}
```

1. MappedFileQueue#deleteExpiredFileByOffset遍历至倒数第二个文件，逐个判断ConsumeQueue文件的最后一个单元的存储的CommitLog偏移量是否小于当前最小的CommitLog的偏移量，如果是，则可以删除。第一次和第二次摧毁的间隔时间是60s，这块逻辑与CommitLog摧毁逻辑一样。

```java
public int deleteExpiredFileByOffset(long offset, int unitSize) {
    // 为了不影响正常的写入，克隆一份
    Object[] mfs = this.copyMappedFiles(0);
    List<MappedFile> files = new ArrayList<MappedFile>();
    int deleteCount = 0;
    if (null != mfs) {
        // 不删除最后一个。所以遍历到倒数第二个即可
        int mfsLength = mfs.length - 1;
        for (int i = 0; i < mfsLength; i++) {
            boolean destroy;
            MappedFile mappedFile = (MappedFile) mfs[i];
            // 获取mappedFile中最后ConsumeQueue的信息 mappedFileSize - unitSize(20)
            // ConsumeQueue存储格式为commitLogOffset(8B)+size(4B)+tagHashCode(8B)
            SelectMappedBufferResult result = mappedFile.selectMappedBuffer(this.mappedFileSize - unitSize);
            if (result != null) {
                // 表示最后一个ConsumeQueue信息记录的消息在CommitLog的物理位置
                long maxOffsetInLogicQueue = result.getByteBuffer().getLong();
                // 使mappedFile引用数减一
                result.release();
                // 最大偏移量小于CommitLog的最小偏移量，则销毁
                destroy = maxOffsetInLogicQueue < offset;
                if (destroy) {
                    log.info("physic min offset " + offset + ", logics in current mappedFile max offset "
                        + maxOffsetInLogicQueue + ", delete it");
                }
            } else if (!mappedFile.isAvailable()) {
        // Handle hanged file.
                log.warn("Found a hanged consume queue file, attempting to delete it.");
                destroy = true;
            } else {
                log.warn("this being not executed forever.");
                break;
            }
            if (destroy && mappedFile.destroy(1000 * 60)) {
                files.add(mappedFile);
                deleteCount++;
            } else {
                break;
            }
        }
    }
    deleteExpiredFile(files);
    return deleteCount;
}
```

1. 删除文件后，需要校正现有ConsumeQueue最小偏移量。通过ConsumeQueue#correctMinOffset

```java
public void correctMinOffset(long phyMinOffset) {
    // 获取ConsumeQueue中第一个MappedFile
    MappedFile mappedFile = this.mappedFileQueue.getFirstMappedFile();
    long minExtAddr = 1;
    if (mappedFile != null) {
        // 获取第一个MappedFile的所有字节内容信息（共享内存，但是指针不一样）
        SelectMappedBufferResult result = mappedFile.selectMappedBuffer(0);
        if (result != null) {
            try {
                // 遍历每个单元信息
                for (int i = 0; i < result.getSize(); i += ConsumeQueue.CQ_STORE_UNIT_SIZE) {
                    // 分别读取commitLogOffset(8B)+size(4B)+tagHashCode(8B) = 20B
                    long offsetPy = result.getByteBuffer().getLong();
                    result.getByteBuffer().getInt();
                    long tagsCode = result.getByteBuffer().getLong();
                    // phyMinOffset是CommitLog最小的有效的offset，offsetPy >= phyMinOffset表示当前的ConsumeQueue单元信息存储的是有效的索引信息
                    if (offsetPy >= phyMinOffset) {
                        // 设置最小的ConsumeQueue索引offset。 文件名称的偏移量值+现有的所有数据的值
                        this.minLogicOffset = result.getMappedFile().getFileFromOffset() + i;
                        log.info("Compute logical min offset: {}, topic: {}, queueId: {}",
                            this.getMinOffsetInQueue(), this.topic, this.queueId);
                        // This maybe not take effect, when not every consume queue has extend file.
                        if (isExtAddr(tagsCode)) {
                            minExtAddr = tagsCode;
                        }
                        break;
                    }
                }
            } catch (Exception e) {
                log.error("Exception thrown when correctMinOffset", e);
            } finally {
                // 释放当前result中的mappedFile的引用
                result.release();
            }
        }
    }
    if (isExtReadEnable()) {
        this.consumeQueueExt.truncateByMinAddress(minExtAddr);
    }
}
```

**5、**`DefaultMessageStore.this.indexService.deleteExpiredFile(minOffset);`用于删除IndexFile，逻辑基本也是根据存储的最后一个索引的CommitLog文件与现有CommitLog的最小偏移量对比，如果小于，表示可以删除；

```java
public void deleteExpiredFile(long offset) {
    Object[] files = null;
    try {
        this.readWriteLock.readLock().lock();
        if (this.indexFileList.isEmpty()) {
            return;
        }
        //查找第一个IndexFile的最后一个索引存储的CommitLog偏移量
        long endPhyOffset = this.indexFileList.get(0).getEndPhyOffset();
        // 如果偏移量小于现有CommitLog文件的最小偏移量，说明有可以被删除的IndexFile
        if (endPhyOffset < offset) {
            files = this.indexFileList.toArray();
        }
    } catch (Exception e) {
        log.error("destroy exception", e);
    } finally {
        this.readWriteLock.readLock().unlock();
    }
    if (files != null) {
        List<IndexFile> fileList = new ArrayList<IndexFile>();
        // 只遍历到倒数第二个文件
        for (int i = 0; i < (files.length - 1); i++) {
            IndexFile f = (IndexFile) files[i];
            // 判断最后一个索引存储的CommitLog偏移量是否小于现有CommitLog文件的最小偏移量
            if (f.getEndPhyOffset() < offset) {
                fileList.add(f);
            } else {
                break;
            }
        }
        // 摧毁、删除、移除队列
        this.deleteExpiredFile(fileList);
    }
}
private void deleteExpiredFile(List<IndexFile> files) {
    if (!files.isEmpty()) {
        try {
            this.readWriteLock.writeLock().lock();
            for (IndexFile file : files) {
                boolean destroyed = file.destroy(3000);
                destroyed = destroyed && this.indexFileList.remove(file);
                if (!destroyed) {
                    log.error("deleteExpiredFile remove failed.");
                    break;
                }
            }
        } catch (Exception e) {
            log.error("deleteExpiredFile has exception.", e);
        } finally {
            this.readWriteLock.writeLock().unlock();
        }
    }
}
public void destroy() {
    try {
        this.readWriteLock.writeLock().lock();
        for (IndexFile f : this.indexFileList) {
            f.destroy(1000 * 3);
        }
        this.indexFileList.clear();
    } catch (Exception e) {
        log.error("destroy exception", e);
    } finally {
        this.readWriteLock.writeLock().unlock();
    }
}
```
