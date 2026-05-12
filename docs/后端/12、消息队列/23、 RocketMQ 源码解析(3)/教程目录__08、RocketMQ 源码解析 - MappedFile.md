# 08、RocketMQ 源码解析 - MappedFile
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/8.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## 简介

**1、** RocketMQ使用**MappedFile**、**MappedFileQueue**来封装存储文件**MappedFileQueue**是**MappedFile**的管理容器，它是对存储目录进行封装；

**2、****MappedFile**是RocketMQ内存映射文件的具体实现将消息字节写入PageCache缓冲区中(commit方法)，或者将消息刷入磁盘(flush)`CommitLogconsumerQueue、index`三类文件磁盘的读写都是通过**MappedFile**；

**3、****MappedFile**的核心属性；

**wrotePosition**:保存当前文件所映射到的消息写入page cache的位置

**flushedPosition**:保存刷盘的最新位置

**wrotePosition**和**flushedPosition**的初始化值为0，一条1k大小的消息送达，当消息commit也就是写入page cache以后，`wrotePosition`的值为1024 * 1024；如果消息刷盘以后，则`flushedPosition`也是1024 * 1024；另外一条1k大小的消息送达,当消息commit时，wrotePosition的值为1024 * 1024 + 1024 * 1024，同样，消息刷盘后，flushedPosition的值为1024 * 1024 + 1024 * 1024。

**4、****MappedFile**源码；

```java
public class MappedFile extends ReferenceResource {
    //内存页大小，linux下通过getconf PAGE_SIZE获取，一般默认是4k
    public static final int OS_PAGE_SIZE = 1024 * 4;
    protected static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);
    //所有MappedFile实例已使用字节总数
    private static final AtomicLong TOTAL_MAPPED_VIRTUAL_MEMORY = new AtomicLong(0);
    //MappedFile个数
    private static final AtomicInteger TOTAL_MAPPED_FILES = new AtomicInteger(0);
    //MappedFile 当前文件所映射到的消息写入pagecache的位置
    protected final AtomicInteger wrotePosition = new AtomicInteger(0);
    //ADD BY ChenYang 已经提交(持久化)的位置
    protected final AtomicInteger committedPosition = new AtomicInteger(0);
    //flushedPosition来维持刷盘的最新位置
    private final AtomicInteger flushedPosition = new AtomicInteger(0);
    protected int fileSize;
    protected FileChannel fileChannel;
    /**
     * Message will put to here first, and then reput to FileChannel if writeBuffer is not null.
     堆外内存ByteBuffer，如果不为空（transientStorePoolEnable=true），数据受限将存储在buffer中，然后提交到FileChannel
     */
    protected ByteBuffer writeBuffer = null;
    //堆外内存池，内存池中的内存会提供内存锁机制
    protected TransientStorePool transientStorePool = null;
    private String fileName;
    //映射的起始偏移量，也是文件名
    private long fileFromOffset;
   //磁盘的物理文件
    private File file;
    private MappedByteBuffer mappedByteBuffer;
		//文件最后一次写入的时间戳
		private volatile long storeTimestamp = 0;
		//是否是MappedFileQueue中的第一个文件
		private boolean firstCreateInQueue = false;
    ...省略...
}
```

## 构造方法

**1、** 根据`transientStorePoolEnable`是否为true调用不同的构造方法；

- **transientStorePoolEnable=true**(只在异步刷盘情况下生效)表示将内容先保存在堆外内存中。TransientStorePool会通过`ByteBuffer.allocateDirect`调用直接申请堆外内存，消息数据在写入内存的时候是写入预申请的内存中
- 通过Commit线程将数据提交到FileChannel中
- 在异步刷盘的时候，再由刷盘线程（Flush线程）将数据持久化到磁盘文件。

**2、** 构造方法源码；

```java
/**
 * 如果设置transientStorePoolEnable为false则调用此方法，参见
 * org.apache.rocketmq.store.AllocateMappedFileService#mmapOperation()
 */
public MappedFile(final String fileName, final int fileSize) throws IOException {
    init(fileName, fileSize);
}
/**
 * 如果设置transientStorePoolEnable为true则调用此方法，参见
 *org.apache.rocketmq.store.config.MessageStoreConfig#isTransientStorePoolEnable()
 * org.apache.rocketmq.store.AllocateMappedFileService#mmapOperation()
 */
public MappedFile(final String fileName, final int fileSize,
    final TransientStorePool transientStorePool) throws IOException {
    init(fileName, fileSize, transientStorePool);
}
public void init(final String fileName, final int fileSize,
    final TransientStorePool transientStorePool) throws IOException {
    init(fileName, fileSize);
    //如果transientStorePoolEnable为true，则初始化MappedFile的
    //writeBuffer，该buffer从transientStorePool中获取
    this.writeBuffer = transientStorePool.borrowBuffer();
    this.transientStorePool = transientStorePool;
}
```

**3、**`FileChannel`提供了map()方法把文件映射到虚拟内存，通常情况可以映射整个文件，如果文件比较大，可以进行分段映射，RocketMQ这里映射大小为(0,fileSize)当通过map()方法建立映射关系之后，就不依赖于用于创建映射的`FileChannel`特别是，关闭通道(Channel)对映射的有效性没有影响`MappedFile`的初始化(init)方法，初始化`MappedByteBuffer`，模式为MapMode.READ_WRITE(读/写)，此模式对缓冲区的更改最终将写入文件；但该更改对映射到同一文件的其他程序不一定是可见的；

```java
private void init(final String fileName, final int fileSize) throws IOException {
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.file = new File(fileName);
    //通过文件名获取起始偏移量
    this.fileFromOffset = Long.parseLong(this.file.getName());
    boolean ok = false;
    //确保父目录存在
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

**4、** 修改`MappedByteBuffer`实际会将数据写入文件对应的`PageCache`中，而`TransientStorePool`方案下写入的则为纯粹的内存因此在消息写入操作上会更快，因此能更少的占用`CommitLog.putMessageLock`锁，从而能够提升消息处理量使用`TransientStorePool`方案的缺陷主要在于在异常崩溃的情况下会丢失更多的消息；

## 追加内容

**1、** 追加就是将消息内容追加到映射文件中，并且记录更新时间和写的位置；

```java
public AppendMessageResult appendMessage(final MessageExtBrokerInner msg, final AppendMessageCallback cb) {
    return appendMessagesInner(msg, cb);
}
public AppendMessageResult appendMessages(final MessageExtBatch messageExtBatch, final AppendMessageCallback cb) {
    return appendMessagesInner(messageExtBatch, cb);
}
public AppendMessageResult appendMessagesInner(final MessageExt messageExt, final AppendMessageCallback cb) {
    assert messageExt != null;
    assert cb != null;
    //获取当前写位置
    int currentPos = this.wrotePosition.get();
    if (currentPos < this.fileSize) {
        /**
         * RocketMQ提供两种数据落盘的方式:
         * 1. 直接将数据写到mappedByteBuffer, 然后flush;
         * 2. 先写到writeBuffer, 再从writeBuffer提交到fileChannel, 最后flush.
         */
        ByteBuffer byteBuffer = writeBuffer != null ? writeBuffer.slice() : this.mappedByteBuffer.slice();
        byteBuffer.position(currentPos);
        AppendMessageResult result = null;
        //执行append消息的过程
        if (messageExt instanceof MessageExtBrokerInner) {
            result = cb.doAppend(this.getFileFromOffset(), byteBuffer, this.fileSize - currentPos, (MessageExtBrokerInner) messageExt);
        } else if (messageExt instanceof MessageExtBatch) {
            result = cb.doAppend(this.getFileFromOffset(), byteBuffer, this.fileSize - currentPos, (MessageExtBatch) messageExt);
        } else {
            return new AppendMessageResult(AppendMessageStatus.UNKNOWN_ERROR);
        }
        this.wrotePosition.addAndGet(result.getWroteBytes());
        this.storeTimestamp = result.getStoreTimestamp();
        return result;
    }
    log.error("MappedFile.appendMessage return null, wrotePosition: {} fileSize: {}", currentPos, this.fileSize);
    return new AppendMessageResult(AppendMessageStatus.UNKNOWN_ERROR);
}
```

## 提交(commit)

**1、** commit()方法:内存映射的提交，commit操作主要针对异步刷盘模式；

**2、**`commitLeastPages`为本次提交最小的页数，如果待提交数据不满`commitLeastPages`(默认4*4kb)，则不执行本次提交操作，待下次提交commit的作用就是将`writeBuffer`中的数据提交到`FileChannel`中；

```java
/**
 * commitLeastPages 为本次提交最小的页面，默认4页(4*4KB),可参见
 * org.apache.rocketmq.store.CommitLog.CommitRealTimeService#run()
 */
public int commit(final int commitLeastPages) {
    /**
     * 1.writeBuffer 为空就不提交，而writeBuffer只有开启
     * transientStorePoolEnable为true并且是异步刷盘模式才会不为空
     * 所以commit是针对异步刷盘使用的
     */
    if (writeBuffer == null) {
        //no need to commit data to file channel, so just regard wrotePosition as committedPosition.
        return this.wrotePosition.get();
    }
    if (this.isAbleToCommit(commitLeastPages)) {
        if (this.hold()) {
            commit0(commitLeastPages);
            this.release();
        } else {
            log.warn("in commit, hold failed, commit offset = " + this.committedPosition.get());
        }
    }
    // All dirty data has been committed to FileChannel.
    if (writeBuffer != null && this.transientStorePool != null && this.fileSize == this.committedPosition.get()) {
        //清理工作，归还到堆外内存池中，并且释放当前writeBuffer
        this.transientStorePool.returnBuffer(writeBuffer);
        this.writeBuffer = null;
    }
    return this.committedPosition.get();
}
protected void commit0(final int commitLeastPages) {
    int writePos = this.wrotePosition.get();
    int lastCommittedPosition = this.committedPosition.get();
    if (writePos - this.committedPosition.get() > 0) {
        try {
            //创建writeBuffer的共享缓存区，slice共享内存，其实就是切片
            //但是position、mark、limit单独维护
            //新缓冲区的position=0，其capacity和limit将是缓冲区中剩余的字节数，其mark=undefined
            ByteBuffer byteBuffer = writeBuffer.slice();
            //上一次的提交指针作为position
            byteBuffer.position(lastCommittedPosition);
            //当前最大的写指针作为limit
            byteBuffer.limit(writePos);
            //把commitedPosition到wrotePosition的写入FileChannel中
            this.fileChannel.position(lastCommittedPosition);
            this.fileChannel.write(byteBuffer);
            //更新提交指针
            this.committedPosition.set(writePos);
        } catch (Throwable e) {
            log.error("Error occurred when commit data to FileChannel.", e);
        }
    }
}
/**
 * 是否能够flush
 *  1. 文件已经写满
 *  2. flushLeastPages > 0 && 未flush部分超过flushLeastPages
 *  3. flushLeastPages==0&&有新写入的部分
 * @param flushLeastPages flush最小分页
 *      mmap映射后的内存一般是内存页大小的倍数，而内存页大小一般为4K，所以写入到映射内存的数据大小可以以4K进行分页，
 *      而flushLeastPages这个参数只是指示写了多少页后才可以强制将映射内存区域的数据强行写入到磁盘文件
 * @return
 */
protected boolean isAbleToCommit(final int commitLeastPages) {
    int flush = this.committedPosition.get();
    int write = this.wrotePosition.get();
		// 如果文件满了（文件大小与写入位置一样），则返回true
    if (this.isFull()) {
        return true;
    }
    if (commitLeastPages > 0) {
        //总共写入的页大小-已经提交的页大小>=最少一次写入的页大小，OS_PAGE_SIZE默认4kb
        return ((write / OS_PAGE_SIZE) - (flush / OS_PAGE_SIZE)) >= commitLeastPages;
    }
    return write > flush;
}
public synchronized boolean hold() {
    if (this.isAvailable()) {
        if (this.refCount.getAndIncrement() > 0) {
            return true;
        } else {
            this.refCount.getAndDecrement();
        }
    }
    return false;
}
public void release() {
    long value = this.refCount.decrementAndGet();
    if (value > 0)
        return;
    synchronized (this) {
        //如果引用计数等于0，则执行清理堆外内存
        this.cleanupOver = this.cleanup(value);
    }
}
```

## 刷盘(flush)

**1、** flush操作是将内存中的数据永久的写入磁盘刷写磁盘是直接调用`MappedByteBuffer`或`FileChannel`的force()将内存中的数据持久化到磁盘；

```java
public int flush(final int flushLeastPages) {
    if (this.isAbleToFlush(flushLeastPages)) {
        if (this.hold()) {
            //有效数据的最大位置
            int value = getReadPosition();
            try {
                //We only append data to fileChannel or mappedByteBuffer, never both.
                if (writeBuffer != null || this.fileChannel.position() != 0) {
                    //false表示只需要将文件内容的更新写入存储;true表示必须写入文件内容和元数据更改
                    this.fileChannel.force(false);
                } else {
                    this.mappedByteBuffer.force();
                }
            } catch (Throwable e) {
                /**
                 * FIXME jannal
                 * fileChannel.force会抛出IOException，可能会丢失一部分数据
                 * 如果抛异常不去设置flushedPosition，等到下次flush，岂不是更好???
                 */
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
public void release() {
    long value = this.refCount.decrementAndGet();
    if (value > 0)
        return;
    synchronized (this) {
        //如果引用计数等于0，则执行清理堆外内存
        this.cleanupOver = this.cleanup(value);
    }
}
```

## 预热(warm)

**1、** 对当前映射文件进行预热；

第一步：对当前映射文件的每个内存页写入一个字节0。当刷盘策略为同步刷盘时，执行强制刷盘，并且是每修改pages(默认是16MB)个分页刷一次盘

第二步：将当前`MappedFile`全部的地址空间锁定在物理存储中，防止其被交换到swap空间。再调用[madvise](http://man7.org/linux/man-pages/man2/madvise.2.html)，传入 `MADV_WILLNEED` 策略，将刚刚锁住的内存预热，其实就是告诉内核，

我马上就要用（`MADV_WILLNEED`）这块内存，先做虚拟内存到物理内存的映射，防止正式使用时产生缺页中断。

**2、****使用mmap()内存分配时，只是建立了进程虚拟地址空间，并没有分配虚拟内存对应的物理内存当进程访问这些没有建立映射关系的虚拟内存时，处理器自动触发一个缺页异常，进而进入内核空间分配物理内存、更新进程缓存表，最后返回用户空间，恢复进程运行**写入假值0的意义在于实际分配物理内存，在消息写入时防止缺页异常；

**3、** 源码；

```java
/**
 * 1. 对当前映射文件进行预热
 *   1.1. 先对当前映射文件的每个内存页写入一个字节0.当刷盘策略为同步刷盘时，执行强制刷盘，并且是每修改pages个分页刷一次盘
 *  再将当前MappedFile全部的地址空间锁定，防止被swap
 *   1.2. 然后将当前MappedFile全部的地址空间锁定在物理存储中，防止其被交换到swap空间。再调用madvise，传入 WILL_NEED 策略，将刚刚锁住的内存预热，其实就是告诉内核，我马上就要用（WILL_NEED）这块内存，先做虚拟内存到物理内存的映射，防止正式使用时产生缺页中断。
 *  2. 只要启用缓存预热，都会通过mappedByteBuffer来写入假值(字节0)，并且都会对mappedByteBuffer执行mlock和madvise。
 * @param type 刷盘策略
 * @param pages 预热时一次刷盘的分页数
 */
public void warmMappedFile(FlushDiskType type, int pages) {
    long beginTime = System.currentTimeMillis();
    ByteBuffer byteBuffer = this.mappedByteBuffer.slice();
    //上一次刷盘的位置
    int flush = 0;
    long time = System.currentTimeMillis();
    for (int i = 0, j = 0; i < this.fileSize; i += MappedFile.OS_PAGE_SIZE, j++) {
        byteBuffer.put(i, (byte) 0);
        // force flush when flush disk type is sync
        if (type == FlushDiskType.SYNC_FLUSH) {
            /**
             *  同步刷盘，每修改pages个分页强制刷一次盘，默认16MB
             * 参见org.apache.rocketmq.store.config.MessageStoreConfig#flushLeastPagesWhenWarmMapedFile
             */
            if ((i / OS_PAGE_SIZE) - (flush / OS_PAGE_SIZE) >= pages) {
                flush = i;
                //FIXME 刷入修改的内容，不会有性能问题？？
                mappedByteBuffer.force();
            }
        }
        // prevent gc
        if (j % 1000 == 0) {
            log.info("j={}, costTime={}", j, System.currentTimeMillis() - time);
            time = System.currentTimeMillis();
            try {
                /***
                 * Thread.yield与Thread.sleep(0);相同，jvm底层使用的就是os::yield();
                 * https://www.jianshu.com/p/0964124ae822
                 * openJdk源码thread.c jvm.cpp
                 */
                Thread.sleep(0);
            } catch (InterruptedException e) {
                log.error("Interrupted", e);
            }
        }
    }
    // force flush when prepare load finished
    if (type == FlushDiskType.SYNC_FLUSH) {
        log.info("mapped file warm-up done, force to disk, mappedFile={}, costTime={}",
            this.getFileName(), System.currentTimeMillis() - beginTime);
        mappedByteBuffer.force();
    }
    log.info("mapped file warm-up done. mappedFile={}, costTime={}", this.getFileName(),
        System.currentTimeMillis() - beginTime);
    this.mlock();
}
```

## 预读(mlock与munlock)

**1、** 在读取CommitLog时，虽然可以通过PageCache提高目标消息直接在物理内存中读取的命中率但是由于CommitLog存放的是所有Topic的消息，在读取时是随机访问，所以仍会出现缺页中断问题，导致内存被频繁换入换出为此，RocketMQ使用了mlock系统调用，将mmap调用后所占用的堆外内存锁定，变为常驻内存，进一步让目标消息更多的在内存中读取；

**2、** mlock这个方法是一个Native级别的调用，调用了标准C库的方法mlock方法在标准C中的实现是将锁住指定的内存区域避免被操作系统调到swap空间中，；

**3、** 通过mmap建立的内存文件，在开始时只是建立一个映射关系，当读取相应区域的时候，第一次还是会去读磁盘，后续读写基本上与PageCache交互当读相对应页没有拿到数据的时候，系统将会产生一个缺页异常madvise的作用是一次性先将一段数据读入到映射内存区域，这样就减少了缺页异常的产生，不过mlock和madvise在windows下的C库没有；

**4、**[madvise](http://man7.org/linux/man-pages/man2/madvise.2.html)系统调用有两个参数：地址指针、区间长度`madvise`会向内核提供一个针对于进程虚拟地址区间的I/O建议，内核可能会采纳这个建议，进行预读；

**5、** RocketMQ使用`net.java.dev.jna:jna:4.2.2`，自己创建一个LibC类继承Library；

```java
import com.sun.jna.Library;
import com.sun.jna.Native;
import com.sun.jna.NativeLong;
import com.sun.jna.Platform;
import com.sun.jna.Pointer;
public interface LibC extends Library {
    LibC INSTANCE = (LibC) Native.loadLibrary(Platform.isWindows() ? "msvcrt" : "c", LibC.class);
    int MADV_WILLNEED = 3;
    int MADV_DONTNEED = 4;
    int MCL_CURRENT = 1;
    int MCL_FUTURE = 2;
    int MCL_ONFAULT = 4;
    /* sync memory asynchronously */
    int MS_ASYNC = 0x0001;
    /* invalidate mappings & caches */
    int MS_INVALIDATE = 0x0002;
    /* synchronous memory sync */
    int MS_SYNC = 0x0004;
    int mlock(Pointer var1, NativeLong var2);
    int munlock(Pointer var1, NativeLong var2);
    int madvise(Pointer var1, NativeLong var2, int var3);
    Pointer memset(Pointer p, int v, long len);
    int mlockall(int flags);
    int msync(Pointer p, NativeLong length, int flags);
}
```

**6、** 调用mmap()时内核只是建立了逻辑地址到物理地址的映射表，并没有映射任何数据到内存在你要访问数据时内核会检查数据所在分页是否在内存，如果不在，则发出一次缺页中断，linux默认分页为4K，1G的消息存储文件要发生很多次中断；

**7、** 解决办法：将madvise()和mmap()搭配起来使用，在使用数据前告诉内核这一段数据需要使用，将其一次读入内存madvise()这个函数可以对映射的内存提出使用建议，从而减少在程序运行时的硬盘缺页中断；

**8、** mlock和munlock源码；

```java
public void mlock() {
    final long beginTime = System.currentTimeMillis();
    final long address = ((DirectBuffer) (this.mappedByteBuffer)).address();
    Pointer pointer = new Pointer(address);
    {
        // 内存锁定
        // 通过mlock可以将进程使用的部分或者全部的地址空间锁定在物理内存中，防止其被交换到swap空间。
        // 对时间敏感的应用会希望全部使用物理内存，提高数据访问和操作的效率。
        int ret = LibC.INSTANCE.mlock(pointer, new NativeLong(this.fileSize));
        log.info("mlock {} {} {} ret = {} time consuming = {}", address, this.fileName, this.fileSize, ret, System.currentTimeMillis() - beginTime);
    }
    {
        //文件预读
        //madvise 一次性先将一段数据读入到映射内存区域，这样就减少了缺页异常的产生。
        int ret = LibC.INSTANCE.madvise(pointer, new NativeLong(this.fileSize), LibC.MADV_WILLNEED);
        log.info("madvise {} {} {} ret = {} time consuming = {}", address, this.fileName, this.fileSize, ret, System.currentTimeMillis() - beginTime);
    }
}
public void munlock() {
    final long beginTime = System.currentTimeMillis();
    final long address = ((DirectBuffer) (this.mappedByteBuffer)).address();
    Pointer pointer = new Pointer(address);
    int ret = LibC.INSTANCE.munlock(pointer, new NativeLong(this.fileSize));
    log.info("munlock {} {} {} ret = {} time consuming = {}", address, this.fileName, this.fileSize, ret, System.currentTimeMillis() - beginTime);
}
```

## 清理(cleanup)

**1、** JDK默认公开释放MappedByteBuffer的方法，只能通过反射的方式；

```java
@Override
public boolean cleanup(final long currentRef) {
    if (this.isAvailable()) {
        log.error("this file[REF:" + currentRef + "] " + this.fileName
            + " have not shutdown, stop unmapping.");
        return false;
    }
    if (this.isCleanupOver()) {
        log.error("this file[REF:" + currentRef + "] " + this.fileName
            + " have cleanup, do not do it again.");
        return true;
    }
    clean(this.mappedByteBuffer);
    //加一个fileSize大小的负数值
    TOTAL_MAPPED_VIRTUAL_MEMORY.addAndGet(this.fileSize * (-1));
    TOTAL_MAPPED_FILES.decrementAndGet();
    log.info("unmap file[REF:" + currentRef + "] " + this.fileName + " OK");
    return true;
}
/**
 * 通过反射清理MappedByteBuffer
 * @param buffer
 */
public static void clean(final ByteBuffer buffer) {
    if (buffer == null || !buffer.isDirect() || buffer.capacity() == 0)
        return;
    /**
     * 嵌套递归获取directByteBuffer的最内部的attachment或者viewedBuffer方法
     * 获取directByteBuffer的Cleaner对象，然后调用cleaner.clean方法，进行释放资源
     *
     */
    invoke(invoke(viewed(buffer), "cleaner"), "clean");
}
private static Object invoke(final Object target, final String methodName, final Class<?>... args) {
    return AccessController.doPrivileged(new PrivilegedAction<Object>() {
        public Object run() {
            try {
                Method method = method(target, methodName, args);
                method.setAccessible(true);
                return method.invoke(target);
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }
    });
}
private static ByteBuffer viewed(ByteBuffer buffer) {
    String methodName = "viewedBuffer";
    Method[] methods = buffer.getClass().getMethods();
    for (int i = 0; i < methods.length; i++) {
        if (methods[i].getName().equals("attachment")) {
            methodName = "attachment";
            break;
        }
    }
    ByteBuffer viewedBuffer = (ByteBuffer) invoke(buffer, methodName);
    if (viewedBuffer == null)
        return buffer;
    else
        return viewed(viewedBuffer);
}
```
