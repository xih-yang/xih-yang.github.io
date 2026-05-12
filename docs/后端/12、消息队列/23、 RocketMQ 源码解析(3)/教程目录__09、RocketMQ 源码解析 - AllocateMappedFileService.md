# 09、RocketMQ 源码解析 - AllocateMappedFileService
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/9.html
- 分类：消息队列
- 分组：教程目录
## 简介

**1、****AllocateMappedFileService**继承了`ServiceThread`，说明它是服务线程类**AllocateMappedFileService**用于提前创建一个**MappedFile**和下一个**MappedFile**；

**2、** 核心属性；

```java
public class AllocateMappedFileService extends ServiceThread {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);
    //等待创建MappedFile的超时时间，默认5秒
    private static int waitTimeOut = 1000 * 5;
    //用来保存当前所有待处理的分配请求，其中key是filePath,value是分配请求AllocateRequest。
    //如果分配请求被成功处理，即获取到映射文件则从请求会从requestTable中移除
    private ConcurrentMap<String, AllocateRequest> requestTable =
        new ConcurrentHashMap<String, AllocateRequest>();
    private PriorityBlockingQueue<AllocateRequest> requestQueue =
        new PriorityBlockingQueue<AllocateRequest>();
    //创建MappedFile是否有异常
    private volatile boolean hasException = false;
    private DefaultMessageStore messageStore;
    ...省略...
}    
```

**3、** 服务线程运行逻辑；

```java
/**
 * 此线程在DefaultMessageStore创建时启动
 */
public void run() {
    log.info(this.getServiceName() + " service started");
    while (!this.isStopped() && this.mmapOperation()) {
    }
    log.info(this.getServiceName() + " service end");
}
```

**4、****AllocateMappedFileService**有两个核心方法`putRequestAndReturnMappedFile`和`mmapOperation`两个方法配合实现**MappedFile**文件的的创建和预热MappedFile；

**5、** 流程图；

## AllocateRequest

**1、****AllocateRequest**是**AllocateMappedFileService**的静态内部类，实现了Comparable接口，用于优先级队列；

```java
static class AllocateRequest implements Comparable<AllocateRequest> {
    // Full file path
    private String filePath;
    private int fileSize;
    //为0表示MappedFile创建完成
    private CountDownLatch countDownLatch = new CountDownLatch(1);
    private volatile MappedFile mappedFile = null;
    /**
     * fileSize大的优先级高，文件大小相同，文件的offset越小优先级越高
     */
    public int compareTo(AllocateRequest other) {
        if (this.fileSize < other.fileSize)
            return 1;
        else if (this.fileSize > other.fileSize) {
            return -1;
        } else {
            int mIndex = this.filePath.lastIndexOf(File.separator);
            long mName = Long.parseLong(this.filePath.substring(mIndex + 1));
            int oIndex = other.filePath.lastIndexOf(File.separator);
            long oName = Long.parseLong(other.filePath.substring(oIndex + 1));
            if (mName < oName) {
                return -1;
            } else if (mName > oName) {
                return 1;
            } else {
                return 0;
            }
        }
        // return this.fileSize < other.fileSize ? 1 : this.fileSize >
        // other.fileSize ? -1 : 0;
    }
}  
```

## putRequestAndReturnMappedFile

**1、** putRequestAndReturnMappedFile是外部创建MappedFile的入口（**MappedFileQueue#getLastMappedFile**里调用，前提是allocateMappedFileService不为空），创建当前的MappedFile和下一个MappedFile

**2、**`putRequestAndReturnMappedFile`只是将；

创建一个`AllocateRequest`，并放在待处理的缓存中（处理成功后会从缓存中移除）

如果在CountDownLatch#await前已经有异常（hasException使用volatile修饰，具备可见性），表示**mmapOperation**已经执行完成，此时直接返回null

执行CountDownLatch#await，默认等待5s。如果没有执行成功，直接返回null，但不移除requestTable（下次可以直接到wait这里）。如果执行成功，移除requestTable，直接返回创建好的**MappedFile**

**3、** 源码；

```java
/**
 * 提交MappedFile的创建请求。包含下一个和下下个MappedFile.
 * @param nextFilePath  下一个文件的路径
 * @param nextNextFilePath 下下个文件的路径
 * @param fileSize
 * @return
 */
public MappedFile putRequestAndReturnMappedFile(String nextFilePath, String nextNextFilePath, int fileSize) {
    int canSubmitRequests = 2;
    if (this.messageStore.getMessageStoreConfig().isTransientStorePoolEnable()) {
        //快速失败策略时
        if (this.messageStore.getMessageStoreConfig().isFastFailIfNoBufferInStorePool()
            && BrokerRole.SLAVE != this.messageStore.getMessageStoreConfig().getBrokerRole()) {
        //if broker is slave, don't fast fail even no buffer in pool
            //计算TransientStorePool中剩余的buffer数量减去requestQueue中待分配的数量后，剩余的buffer数量
            canSubmitRequests = this.messageStore.getTransientStorePool().remainBufferNumbs() - this.requestQueue.size();
        }
    }
    AllocateRequest nextReq = new AllocateRequest(nextFilePath, fileSize);
    //查看是否已经存在
    boolean nextPutOK = this.requestTable.putIfAbsent(nextFilePath, nextReq) == null;
    if (nextPutOK) {
        //TransientStorePool 不足，不能创建，直接返回null
        if (canSubmitRequests <= 0) {
            log.warn("[NOTIFYME]TransientStorePool is not enough, so create mapped file error, " +
                "RequestQueueSize : {}, StorePoolSize: {}", this.requestQueue.size(), this.messageStore.getTransientStorePool().remainBufferNumbs());
            this.requestTable.remove(nextFilePath);
            return null;
        }
        /**
         * FIXME jannal 无界队列offer永远返回true，此处的判断毫无意义吧
         */
        boolean offerOK = this.requestQueue.offer(nextReq);
        if (!offerOK) {
            log.warn("never expected here, add a request to preallocate queue failed");
        }
        canSubmitRequests--;
    }
    AllocateRequest nextNextReq = new AllocateRequest(nextNextFilePath, fileSize);
    boolean nextNextPutOK = this.requestTable.putIfAbsent(nextNextFilePath, nextNextReq) == null;
    if (nextNextPutOK) {
        if (canSubmitRequests <= 0) {
            log.warn("[NOTIFYME]TransientStorePool is not enough, so skip preallocate mapped file, " +
                "RequestQueueSize : {}, StorePoolSize: {}", this.requestQueue.size(), this.messageStore.getTransientStorePool().remainBufferNumbs());
            this.requestTable.remove(nextNextFilePath);
        } else {
            boolean offerOK = this.requestQueue.offer(nextNextReq);
            if (!offerOK) {
                log.warn("never expected here, add a request to preallocate queue failed");
            }
        }
    }
    // mmapOperation已经执行完成，并且创建MappedFile有异常
    if (hasException) {
        log.warn(this.getServiceName() + " service has exception. so return null");
        return null;
    }
    AllocateRequest result = this.requestTable.get(nextFilePath);
    try {
        if (result != null) {
            //默认5s，等待run方法中的mmapOperation执行释放countDown
            boolean waitOK = result.getCountDownLatch().await(waitTimeOut, TimeUnit.MILLISECONDS);
            // 超时直接返回null（此时不移除requestTable，下次可直接直接到wait这里，上面的缓存put无需再次执行）
            if (!waitOK) {
                log.warn("create mmap timeout " + result.getFilePath() + " " + result.getFileSize());
                return null;
            } else {
                this.requestTable.remove(nextFilePath);
                return result.getMappedFile();
            }
        } else {
            //FIXME 这里完全没有必要打log，先put，然后get，其他线程也没有remove，所以是必然可以拿到的
            log.error("find preallocate mmap failed, this never happen");
        }
    } catch (InterruptedException e) {
        log.warn(this.getServiceName() + " service has exception. ", e);
    }
    return null;
}
```

## mmapOperation

**1、****mmapOperation**方法主要做以下两件事情，而且除非线程被中断或者服务终止，否则这个过程一直进行；

- 初始化MappedFile
- 预热MappedFile

**2、****mmapOperation**源码；

- 从优先级队列中获取AllocateRequest
- 创建MappedFile
- 根据配置是否预热MappedFile（填充0字节），将MappedFile放入到AllocateRequest
- 如果出现IOException将AllocateRequest重新放入优先级队列
- 调用AllocateRequest的CountDownLatch#countDown方法通知putRequestAndReturnMappedFile线程

**3、** 源码逻辑；

```java
/**
 * Only interrupted by the external thread, will return false
 */
private boolean mmapOperation() {
    boolean isSuccess = false;
    AllocateRequest req = null;
    try {
        // 从优先级队列里获取AllocateRequest
        req = this.requestQueue.take();
        //从Map里获取AllocateRequest
        AllocateRequest expectedRequest = this.requestTable.get(req.getFilePath());
        if (null == expectedRequest) {
            log.warn("this mmap request expired, maybe cause timeout " + req.getFilePath() + " "
                + req.getFileSize());
            return true;
        }
        //putRequestAndReturnMappedFile里map与优先级队列并不是强一致，是最终一致的
        if (expectedRequest != req) {
            log.warn("never expected here,  maybe cause timeout " + req.getFilePath() + " "
                + req.getFileSize() + ", req:" + req + ", expectedRequest:" + expectedRequest);
            return true;
        }
        if (req.getMappedFile() == null) {
            long beginTime = System.currentTimeMillis();
            MappedFile mappedFile;
            //堆外内存
            if (messageStore.getMessageStoreConfig().isTransientStorePoolEnable()) {
                try {
                    mappedFile = ServiceLoader.load(MappedFile.class).iterator().next();
                    mappedFile.init(req.getFilePath(), req.getFileSize(), messageStore.getTransientStorePool());
                } catch (RuntimeException e) {
                    log.warn("Use default implementation.");
                    mappedFile = new MappedFile(req.getFilePath(), req.getFileSize(), messageStore.getTransientStorePool());
                }
            } else {
                mappedFile = new MappedFile(req.getFilePath(), req.getFileSize());
            }
            long eclipseTime = UtilAll.computeEclipseTimeMilliseconds(beginTime);
            //创建MappedFile 花费大于10ms打印日志
            if (eclipseTime > 10) {
                int queueSize = this.requestQueue.size();
                log.warn("create mappedFile spent time(ms) " + eclipseTime + " queue size " + queueSize
                    + " " + req.getFilePath() + " " + req.getFileSize());
            }
            // pre write mappedFile 默认warmMapedFileEnable=false，即默认不预热
            if (mappedFile.getFileSize() >= this.messageStore.getMessageStoreConfig()
                .getMapedFileSizeCommitLog()
                &&
                this.messageStore.getMessageStoreConfig().isWarmMapedFileEnable()) {
                mappedFile.warmMappedFile(this.messageStore.getMessageStoreConfig().getFlushDiskType(),
                    this.messageStore.getMessageStoreConfig().getFlushLeastPagesWhenWarmMapedFile());
            }
            req.setMappedFile(mappedFile);
            this.hasException = false;
            isSuccess = true;
        }
    } catch (InterruptedException e) {
        log.warn(this.getServiceName() + " interrupted, possibly by shutdown.");
        this.hasException = true;
        return false;
    } catch (IOException e) {
        log.warn(this.getServiceName() + " service has exception. ", e);
        this.hasException = true;
        if (null != req) {
            //重新插入请求到队列
            requestQueue.offer(req);
            try {
                Thread.sleep(1);
            } catch (InterruptedException ignored) {
            }
        }
    } finally {
        //AllocateRequest计数器减一，表示MappedFile已经创建完成
        if (req != null && isSuccess)
            req.getCountDownLatch().countDown();
    }
    return true;
}
```
