# 12、RocketMQ 源码解析 - CommitLog同步与异步刷盘
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/12.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## 简介

**1、** RocketMQ消息存储是首先将消息追加到内存中，然后根据刷盘策略在不同时间刷盘；

- 同步刷盘，消息追加到内存，调用**MappedByteBuffer.force()**方法实现刷盘
- 异步刷盘，消息追加到内存后，立即返回给Producer。使用单独的异步线程按照一定的频率执行刷盘操作

**2、** Index文件的刷盘并不是采取定时刷盘机制，而是每更新一次Index文件就会将上一次的改动写入磁盘；

**3、** 刷盘代码**CommitLog#handleDiskFlush**，可以看到同步刷盘由GroupCommitService完成

```java
public void handleDiskFlush(AppendMessageResult result, PutMessageResult putMessageResult, MessageExt messageExt) {
    //刷盘策略，同步刷盘阻塞等待，异步刷盘唤醒commitLogService
    // Synchronization flush
    if (FlushDiskType.SYNC_FLUSH == this.defaultMessageStore.getMessageStoreConfig().getFlushDiskType()) {
        final GroupCommitService service = (GroupCommitService) this.flushCommitLogService;
        if (messageExt.isWaitStoreMsgOK()) {
            //构建刷盘请求放入GroupCommitService队列中(List中)
            GroupCommitRequest request = new GroupCommitRequest(result.getWroteOffset() + result.getWroteBytes());
            service.putRequest(request);
            //GroupCommitService线程在broker启动时会启动，阻塞，等待线程刷盘完成，默认超时时间5s，如果超时返回false
            //即如果超时，响应给生产者的是FLUSH_DISK_TIMEOUT
            boolean flushOK = request.waitForFlush(this.defaultMessageStore.getMessageStoreConfig().getSyncFlushTimeout());
            if (!flushOK) {
                log.error("do groupcommit, wait for flush failed, topic: " + messageExt.getTopic() + " tags: " + messageExt.getTags()
                    + " client address: " + messageExt.getBornHostString());
                putMessageResult.setPutMessageStatus(PutMessageStatus.FLUSH_DISK_TIMEOUT);
            }
        } else {
            service.wakeup();
        }
    }
    // Asynchronous flush
    else {
        if (!this.defaultMessageStore.getMessageStoreConfig().isTransientStorePoolEnable()) {
            //使用MappedByteBuffer,默认策略
            flushCommitLogService.wakeup();
        } else {
            //异步刷盘,如果开启TransientStorePool，使用写入缓冲区+FileChannel
            commitLogService.wakeup();
        }
    }
}
```

## FlushCommitLogService

**1、** UML图；

**2、** 实现类；

- `CommitRealTimeService`:异步刷盘并且`transientStorePoolEnable`设置为true
- `FlushRealTimeService`:异步刷盘并且`transientStorePoolEnable`设置为false
- `GroupCommitService`:同步刷盘

**3、****FlushCommitLogService**没有任何实现，只是定义了一个常量；

```java
abstract class FlushCommitLogService extends ServiceThread {
    protected static final int RETRY_TIMES_OVER = 10;
}
```

## 同步刷盘

**1、** 同步刷盘指的是在消息追加到内存映射文件（**MappedByteBuffer**）的内存中后，立即将数据从内存写入磁盘文件（**MappedByteBuffer.force()**）；

### GroupCommitService

**1、** 同步刷盘由**GroupCommitService**完成；

- 第一步：构建刷盘请求对象`GroupCommitRequest`，并将对象添加到`requestsWrite`队列中
- 第二步：默认等待5s，如果返回false，响应给生产者的是`FLUSH_DISK_TIMEOUT`

**2、****GroupCommitService**有一个写队列和一个读队列，即将请求和刷盘进行读写分离请求提交到写列表，刷盘时处理读列表，刷盘结束交换列表，循环往复；

**3、****GroupCommitRequest**；

```java
public static class GroupCommitRequest {
    private final long nextOffset;
    private final CountDownLatch countDownLatch = new CountDownLatch(1);
    //刷盘结果
    private volatile boolean flushOK = false;
    public GroupCommitRequest(long nextOffset) {
        this.nextOffset = nextOffset;
    }
    public long getNextOffset() {
        return nextOffset;
    }
    //唤醒阻塞等待的线程
    //FIXME by jannal 此处有并发问题，this.flushOK = flushOK不是原子操作。正常需要加同步
    //由于只有一个线程操作，所以即使不是原子性也问题不大
    public void wakeupCustomer(final boolean flushOK) {
        this.flushOK = flushOK;
        this.countDownLatch.countDown();
    }
    //等待刷盘
    public boolean waitForFlush(long timeout) {
        try {
            this.countDownLatch.await(timeout, TimeUnit.MILLISECONDS);
            return this.flushOK;
        } catch (InterruptedException e) {
            log.error("Interrupted", e);
            return false;
        }
    }
}
```

**4、****GroupCommitService**源码分析；

```java
class GroupCommitService extends FlushCommitLogService {
    //读写容器
    private volatile List<GroupCommitRequest> requestsWrite = new ArrayList<GroupCommitRequest>();
    private volatile List<GroupCommitRequest> requestsRead = new ArrayList<GroupCommitRequest>();
    public synchronized void putRequest(final GroupCommitRequest request) {
        //FIXME by jannal 思考：既然方法已经加锁，为什么此处需要再次加锁？
        //swapRequests可能在其他线程并发执行，所以需要给requestsWrite单独加锁
        //swapRequests导致requestsWrite的引用变化，会不会出现问题？
        //可以将swapRequests加一个与操作requestsWrite的锁，来优化此处代码，避免不好理解
        synchronized (this.requestsWrite) {
            this.requestsWrite.add(request);
        }
        // 通知服务线程已经接收到GroupCommitRequest
        //FIXME 直接调用父类的this.wakeUp()多好?
        if (hasNotified.compareAndSet(false, true)) {
            waitPoint.countDown(); // notify
        }
    }
    private void swapRequests() {
        // volatile可以保证可见性，requestsWrite写入时加锁了，所以此处无需加锁，通过volatile可以实现低开销的读
        List<GroupCommitRequest> tmp = this.requestsWrite;
        this.requestsWrite = this.requestsRead;
        this.requestsRead = tmp;
    }
    private void doCommit() {
        synchronized (this.requestsRead) {
            if (!this.requestsRead.isEmpty()) {
                for (GroupCommitRequest req : this.requestsRead) {
                    // There may be a message in the next file, so a maximum of
                    // two times the flush
                    boolean flushOK = false;
                    /**
                     * 两个MappedFile(写第N个消息时，MappedFile 已满，创建了一个新的)，所以需要有循环2次。
                     */
                    for (int i = 0; i < 2 && !flushOK; i++) {
                        //请求的offset超过已经flushed的offset，则强制刷盘
                        flushOK = CommitLog.this.mappedFileQueue.getFlushedWhere() >= req.getNextOffset();
                        if (!flushOK) {
                            CommitLog.this.mappedFileQueue.flush(0);
                        }
                    }
                    req.wakeupCustomer(flushOK);
                }
                long storeTimestamp = CommitLog.this.mappedFileQueue.getStoreTimestamp();
                if (storeTimestamp > 0) {
                  	//更新刷盘检测点StoreCheckpoint中的physicMsg Timestamp
                    //刷盘检测点的刷盘操作将在刷写消息队列文件时触发
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
    public void run() {
        CommitLog.log.info(this.getServiceName() + " service started");
        while (!this.isStopped()) {
            try {
                //调用swapRequests=>doCommit
                this.waitForRunning(10);
                this.doCommit();
            } catch (Exception e) {
                CommitLog.log.warn(this.getServiceName() + " service has exception. ", e);
            }
        }
        // Under normal circumstances shutdown, wait for the arrival of the
        // request, and then flush
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            CommitLog.log.warn("GroupCommitService Exception, ", e);
        }
        //FIXME by jannal 上面没有加锁，这里为啥加锁？
        synchronized (this) {
            this.swapRequests();
        }
        this.doCommit();
        CommitLog.log.info(this.getServiceName() + " service end");
    }
    @Override
    protected void onWaitEnd() {
        this.swapRequests();
    }
    @Override
    public String getServiceName() {
        return GroupCommitService.class.getSimpleName();
    }
    @Override
    public long getJointime() {
        return 1000 * 60 * 5;
    }
}
```

## 异步刷盘

1. **CommitLog#handleDiskFlush**中异步刷盘代码如下。异步刷盘有两种方式

- 开启`transientStorePoolEnable=true`机制则启动`CommitRealTimeService`异步刷盘方式。
- 如果没有开启`transientStorePoolEnable=false`，则启动`FlushRealTimeService`
- **CommitRealTimeService**在commit成功后，会执行`flushCommitLogService.wakeup();`也就是让**FlushRealTimeService**将Page Cache中的数据同步至磁盘。

```java
if (!this.defaultMessageStore.getMessageStoreConfig().isTransientStorePoolEnable()) {
    //使用MappedByteBuffer,默认策略
    flushCommitLogService.wakeup();
} else {
    //异步刷盘,如果开启TransientStorePool，使用写入缓冲区+FileChannel
    commitLogService.wakeup();
}
```

**2、** 异步刷盘流程；

### CommitRealTimeService

**1、** 如果`transientStorePoolEnable=true`，Broker会申请一个与CommitLog同样大小的**堆外内存**，该堆外内存会使用**内存锁定（mlock）** ，将其变为常驻内存，避免被操作系统调到swap空间中；

- 消息追加到堆外内存
- 提交到内存映射文件中
- 使用flush刷盘

**2、****CommitRealTimeService**服务线程执行逻辑；

- 默认每200ms将ByteBuffer新追加的数据（`新追加的数据=wrotePosition-commitedPosition`）提交到FileChannel中

### FlushRealTimeService

**1、** 无论是否开启写入缓冲池，刷盘最终都由`FlushRealTimeService`来执行，`CommitRealTimeService`在commit成功后，会执行`flushCommitLogService.wakeup();`也就是让FlushRealTimeService将PageCache中的数据同步至磁盘；

**2、** 将内存(PageCache)中的数据同步至磁盘(flush)有一些前提条件；

- 若当前时间距离上次实际刷盘时间已经超过10S，则会忽略其他所有前提，确定刷盘，这样即使服务器宕机了最多也仅丢失10S的数据，提高了消息队列的可靠性。
- 正常情况下刷盘需要满足持久化数据大于配置的最小页数，默认4，也就是新写入内存中的数据大于或等于16KB(4*4KB)

当开启写入缓冲，也就是追加到fileChannel的数据大于或等于16KB
- 未开启写入缓冲则是追加到mappedByteBuffer的数据大于或等于16KB
