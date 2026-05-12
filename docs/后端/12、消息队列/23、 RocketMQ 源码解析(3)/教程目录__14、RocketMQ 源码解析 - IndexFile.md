# 14、RocketMQ 源码解析 - IndexFile
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/14.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## IndexFile

**1、** IndexFile（索引文件）由`IndexHeader`(索引文件头),`Slot`(槽位)和`Index`(消息的索引内容)三部分构成对于每个`IndexFile`来说`IndexHeader`是固定大小的，Slot是索引的目录，用于定位Index在IndexFile中存储的物理位置；

**2、** 存储图；

**3、** slot总数系统默认500W个,slot中放的是最新index的位置,因为一般查询的时候肯定是优先查最近的消息,每个slot中放的位置值是索引在indexFile中的偏移量；

**4、****IndexFile**属性；

```java
//hash槽大小
private static int hashSlotSize = 4;
//index大小
private static int indexSize = 20;
private static int invalidIndex = 0;
/**
 * 槽位，默认500w个
 * 配置参见org.apache.rocketmq.store.config.MessageStoreConfig#maxHashSlotNum
 */
private final int hashSlotNum;
/**
 * 默认2000w
 * 配置参见org.apache.rocketmq.store.config.MessageStoreConfig#maxIndexNum
 */
private final int indexNum;
private final MappedFile mappedFile;
private final FileChannel fileChannel;
private final MappedByteBuffer mappedByteBuffer;
private final IndexHeader indexHeader;
```

**5、**`IndexHeader`属性；

```java
public static final int INDEX_HEADER_SIZE = 40;
private static int beginTimestampIndex = 0;
private static int endTimestampIndex = 8;
private static int beginPhyoffsetIndex = 16;
private static int endPhyoffsetIndex = 24;
private static int hashSlotcountIndex = 32;
private static int indexCountIndex = 36;
private final ByteBuffer byteBuffer;
//第一个索引消息落在Broker的时间戳
private AtomicLong beginTimestamp = new AtomicLong(0);
//最后一个索引消息落在Broker的时间戳
private AtomicLong endTimestamp = new AtomicLong(0);
//第一个索引消息在commitlog的物理偏移量
private AtomicLong beginPhyOffset = new AtomicLong(0);
//最后一个索引消息在commitlog的物理偏移量
private AtomicLong endPhyOffset = new AtomicLong(0);
//构建索引占用的槽位数
private AtomicInteger hashSlotCount = new AtomicInteger(0);
//构建的索引个数
private AtomicInteger indexCount = new AtomicInteger(1);
```

### 构造函数

**1、** 构造函数：IndexFile也是通过MappedFile创建；

```java
public IndexFile(final String fileName, final int hashSlotNum, final int indexNum,
    final long endPhyOffset, final long endTimestamp) throws IOException {
    //文件大小=indexHeader(40Byte)+HashSlotNum(500w*4Byte)+indexNum(2000w*20Byte)
    int fileTotalSize =
        IndexHeader.INDEX_HEADER_SIZE + (hashSlotNum * hashSlotSize) + (indexNum * indexSize);
    this.mappedFile = new MappedFile(fileName, fileTotalSize);
    this.fileChannel = this.mappedFile.getFileChannel();
    this.mappedByteBuffer = this.mappedFile.getMappedByteBuffer();
    this.hashSlotNum = hashSlotNum;
    this.indexNum = indexNum;
    // 共享同一个byteBuffer，但是索引位置独立
    ByteBuffer byteBuffer = this.mappedByteBuffer.slice();
    this.indexHeader = new IndexHeader(byteBuffer);
 		//初始化头文件的beginPhyOffset 和 endPhyOffset
    if (endPhyOffset > 0) {
        this.indexHeader.setBeginPhyOffset(endPhyOffset);
        this.indexHeader.setEndPhyOffset(endPhyOffset);
    }
		//初始化头文件的beginTimestamp 和 endTimestamp
    if (endTimestamp > 0) {
        this.indexHeader.setBeginTimestamp(endTimestamp);
        this.indexHeader.setEndTimestamp(endTimestamp);
    }
}
```

### putKey

**1、** 步骤；

- 计算消息key的hash
- 根据hash计算hashsolt位置，并计算solt的实际的物理位置,**hashsolt中存储的是当前构建索引的总个数，也是存储的index下标**（通过this.indexHeader.getIndexCount()维护）
- 获取solt上次存入的值，默认是0
- 计算当前存储index的物理位置，并存入hash、phyOffset、storeTimestamp、slotValue

**2、** 源码；

```java
public boolean putKey(final String key, final long phyOffset, final long storeTimestamp) {
    //如果已经构建的索引index数量 < 最大的index数量，则进行插入，否则直接返回 false
    if (this.indexHeader.getIndexCount() < this.indexNum) {
        //计算消息key的hash
        int keyHash = indexKeyHashMethod(key);
        //根据hash计算solt位置
        int slotPos = keyHash % this.hashSlotNum;
        //计算solt的实际存储位置
        int absSlotPos = IndexHeader.INDEX_HEADER_SIZE + slotPos * hashSlotSize;
        FileLock fileLock = null;
        try {
            // fileLock = this.fileChannel.lock(absSlotPos, hashSlotSize,
            // false);
            /**
             *  slotValue=0, 当前message的key是该hash值第一个消息索引
             *  slotValue>0, 该key hash值上一个消息索引的位置
             */
            int slotValue = this.mappedByteBuffer.getInt(absSlotPos);
            if (slotValue <= invalidIndex || slotValue > this.indexHeader.getIndexCount()) {
                slotValue = invalidIndex;
            }
            long timeDiff = storeTimestamp - this.indexHeader.getBeginTimestamp();
            timeDiff = timeDiff / 1000;
            if (this.indexHeader.getBeginTimestamp() <= 0) {
                timeDiff = 0;
            } else if (timeDiff > Integer.MAX_VALUE) {
                timeDiff = Integer.MAX_VALUE;
            } else if (timeDiff < 0) {
                timeDiff = 0;
            }
            int absIndexPos =
                IndexHeader.INDEX_HEADER_SIZE + this.hashSlotNum * hashSlotSize
                    + this.indexHeader.getIndexCount() * indexSize;
            //topic-key(key是消息的key)的Hash值
            this.mappedByteBuffer.putInt(absIndexPos, keyHash);
            //commitLog真实的物理位移
            this.mappedByteBuffer.putLong(absIndexPos + 4, phyOffset);
            //时间位移，消息的存储时间与Index Header中beginTimestamp的时间差
            this.mappedByteBuffer.putInt(absIndexPos + 4 + 8, (int) timeDiff);
            //存储上一slot存的值
            this.mappedByteBuffer.putInt(absIndexPos + 4 + 8 + 4, slotValue);
            //当前构建的索引总个数
            this.mappedByteBuffer.putInt(absSlotPos, this.indexHeader.getIndexCount());
            if (this.indexHeader.getIndexCount() <= 1) {
                this.indexHeader.setBeginPhyOffset(phyOffset);
                this.indexHeader.setBeginTimestamp(storeTimestamp);
            }
            this.indexHeader.incHashSlotCount();
            this.indexHeader.incIndexCount();
            this.indexHeader.setEndPhyOffset(phyOffset);
            this.indexHeader.setEndTimestamp(storeTimestamp);
            return true;
        } catch (Exception e) {
            log.error("putKey exception, Key: " + key + " KeyHashCode: " + key.hashCode(), e);
        } finally {
            //上面注释了，下面可以删除了
            if (fileLock != null) {
                try {
                    fileLock.release();
                } catch (IOException e) {
                    log.error("Failed to release the lock", e);
                }
            }
        }
    } else {
        log.warn("Over index file capacity: index count = " + this.indexHeader.getIndexCount()
            + "; index max num = " + this.indexNum);
    }
    return false;
}
```

**3、** 实际案例；

- 第一次插入一个hash为48的key，IndexFile的结构如下。因为是第一次插入，所以hash槽中存储的是1（总共一条）
- 第二次插入一个hash为48的key，此时hash冲突，IndexFile的结构如下。即把冲突的**上一个key的index值**保存在slotvalue中。上一个插入的index只是1（因为只插入了一条）
- 第三次插入一个hash为50的key，IndexFile的结构如下
- 第四次插入一个hash为48的key，此时hash冲突，IndexFile的结构如下

### 查找

**1、** 当需要根据Key来查询消息的时候，会从solt获取最新的index，然后通过soltValue依次向前找；

```java
public void selectPhyOffset(final List<Long> phyOffsets, final String key, final int maxNum,
    final long begin, final long end, boolean lock) {
    if (this.mappedFile.hold()) {
        int keyHash = indexKeyHashMethod(key);
        //计算slot位置
        int slotPos = keyHash % this.hashSlotNum;
        //计算slot物理位置
        int absSlotPos = IndexHeader.INDEX_HEADER_SIZE + slotPos * hashSlotSize;
        FileLock fileLock = null;
        try {
            if (lock) {
                // fileLock = this.fileChannel.lock(absSlotPos,
                // hashSlotSize, true);
            }
            //获取slot存放的值，此值是最后一个存放此hash的index下标
            int slotValue = this.mappedByteBuffer.getInt(absSlotPos);
            // if (fileLock != null) {
            // fileLock.release();
            // fileLock = null;
            // }
            if (slotValue <= invalidIndex || slotValue > this.indexHeader.getIndexCount()
                || this.indexHeader.getIndexCount() <= 1) {
            } else {
                for (int nextIndexToRead = slotValue; ; ) {
                    if (phyOffsets.size() >= maxNum) {
                        break;
                    }
                    //通过slotValue定位物理绝对位置，slotValue存储的是当时总共的索引数量
                    int absIndexPos =
                        IndexHeader.INDEX_HEADER_SIZE + this.hashSlotNum * hashSlotSize
                            + nextIndexToRead * indexSize;
                    //获取keyhash
                    int keyHashRead = this.mappedByteBuffer.getInt(absIndexPos);
                    //物理偏移量
                    long phyOffsetRead = this.mappedByteBuffer.getLong(absIndexPos + 4);
										// 存储时间 - 头文件记录的开始时间得到 时间差
                    long timeDiff = (long) this.mappedByteBuffer.getInt(absIndexPos + 4 + 8);
                    //获取上一个soltValue的值
                    int prevIndexRead = this.mappedByteBuffer.getInt(absIndexPos + 4 + 8 + 4);
                    if (timeDiff < 0) {
                        break;
                    }
                    timeDiff *= 1000L;
                    long timeRead = this.indexHeader.getBeginTimestamp() + timeDiff;
                    boolean timeMatched = (timeRead >= begin) && (timeRead <= end);
                    //hash一致并且时间在begin和end之间
                    if (keyHash == keyHashRead && timeMatched) {
                        phyOffsets.add(phyOffsetRead);
                    }
                    //如果上一个soltValue=0则跳出循环，结束查找
                    if (prevIndexRead <= invalidIndex
                        || prevIndexRead > this.indexHeader.getIndexCount()
                        || prevIndexRead == nextIndexToRead || timeRead < begin) {
                        break;
                    }
                    //如果solt不为0则继续读取前一条
                    nextIndexToRead = prevIndexRead;
                }
            }
        } catch (Exception e) {
            log.error("selectPhyOffset exception ", e);
        } finally {
            //上面注释了，可以删除了
            if (fileLock != null) {
                try {
                    fileLock.release();
                } catch (IOException e) {
                    log.error("Failed to release the lock", e);
                }
            }
            this.mappedFile.release();
        }
    }
}
```

## IndexService

**1、**`IndexService`主要两个作用；

- 定时创建消息的索引
- 提供访问Index索引文件的接口，增删改查操作

**2、** 构造方法；

```java
public class IndexService {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);
    /**
     * maximum times to attempt index file creation.
     * 尝试创建Index File的最大次数
     */
    private static final int MAX_TRY_IDX_CREATE = 3;
    private final DefaultMessageStore defaultMessageStore;
    //hash槽的数量
    private final int hashSlotNum;
    //index的数量
    private final int indexNum;
    //存储路径
    private final String storePath;
    //IndexFile的集合
    private final ArrayList<IndexFile> indexFileList = new ArrayList<IndexFile>();
    //读写锁
    private final ReadWriteLock readWriteLock = new ReentrantReadWriteLock();
    public IndexService(final DefaultMessageStore store) {
        // 从配置中获取相关的配置
        this.defaultMessageStore = store;
        // 获取默认构建的索引个数  默认是的 500w个
        this.hashSlotNum = store.getMessageStoreConfig().getMaxHashSlotNum();
        // 设置索引的个数 默认是 5000000 * 4 也就是2000w个
        this.indexNum = store.getMessageStoreConfig().getMaxIndexNum();
        // 存储的路径
        this.storePath =
            StorePathConfigHelper.getStorePathIndex(store.getMessageStoreConfig().getStorePathRootDir());
    }
		...省略...
}
```

**3、** 构建索引文件；

```java
public void buildIndex(DispatchRequest req) {
    //尝试获取和创建 IndexFile 最大尝试次数为3 次
    IndexFile indexFile = retryGetAndCreateIndexFile();
    if (indexFile != null) {
        long endPhyOffset = indexFile.getEndPhyOffset();
        DispatchRequest msg = req;
        String topic = msg.getTopic();
        String keys = msg.getKeys();
        //如果消息的CommitLog的物理偏移量 < IndexFile记录的最后一个消息物理结束偏移量，则表示消息已经记录了
        if (msg.getCommitLogOffset() < endPhyOffset) {
            return;
        }
        // 如果是事务消息的回滚类型的消息，则直接返回，不进行记录
        final int tranType = MessageSysFlag.getTransactionValue(msg.getSysFlag());
        switch (tranType) {
            case MessageSysFlag.TRANSACTION_NOT_TYPE:
            case MessageSysFlag.TRANSACTION_PREPARED_TYPE:
            case MessageSysFlag.TRANSACTION_COMMIT_TYPE:
                break;
            case MessageSysFlag.TRANSACTION_ROLLBACK_TYPE:
                return;
        }
        if (req.getUniqKey() != null) {
            //保存对应的key的，格式为 topic + "#" + key
            indexFile = putKey(indexFile, msg, buildKey(topic, req.getUniqKey()));
            if (indexFile == null) {
                log.error("putKey error commitlog {} uniqkey {}", req.getCommitLogOffset(), req.getUniqKey());
                return;
            }
        }
        if (keys != null && keys.length() > 0) {
            String[] keyset = keys.split(MessageConst.KEY_SEPARATOR);
            for (int i = 0; i < keyset.length; i++) {
                String key = keyset[i];
                if (key.length() > 0) {
                    indexFile = putKey(indexFile, msg, buildKey(topic, key));
                    if (indexFile == null) {
                        log.error("putKey error commitlog {} uniqkey {}", req.getCommitLogOffset(), req.getUniqKey());
                        return;
                    }
                }
            }
        }
    } else {
        log.error("build index error, stop building index");
    }
}
```

**4、** 根据消息以及时间范围查询消息集合；

```java
public QueryOffsetResult queryOffset(String topic, String key, int maxNum, long begin, long end) {
    List<Long> phyOffsets = new ArrayList<Long>(maxNum);
    long indexLastUpdateTimestamp = 0;
    long indexLastUpdatePhyoffset = 0;
    //比较获取的最大数量和配置的maxMsgsNumBatch参数。 取最大值
    maxNum = Math.min(maxNum, this.defaultMessageStore.getMessageStoreConfig().getMaxMsgsNumBatch());
    try {
        this.readWriteLock.readLock().lock();
        //indexFile 不为空 则迭代indexFile 集合
        if (!this.indexFileList.isEmpty()) {
            for (int i = this.indexFileList.size(); i > 0; i--) {
                // 获取IndexFile
                IndexFile f = this.indexFileList.get(i - 1);
                boolean lastFile = i == this.indexFileList.size();
                //如果是最后一个IndexFile，则记录对应的 最后记录时间 和 最大偏移量
                if (lastFile) {
                    indexLastUpdateTimestamp = f.getEndTimestamp();
                    indexLastUpdatePhyoffset = f.getEndPhyOffset();
                }
                /**
                 * 检查时间是不是符合 ，
                 * 1. 开始时间和结束 时间在 IndexFile 头文件记录的beginTimestamp 和endTimestamp 中
                 */
                if (f.isTimeMatched(begin, end)) {
                    //获取符合条件的key的物理偏移量
                    f.selectPhyOffset(phyOffsets, buildKey(topic, key), maxNum, begin, end, lastFile);
                }
                if (f.getBeginTimestamp() < begin) {
                    break;
                }
                if (phyOffsets.size() >= maxNum) {
                    break;
                }
            }
        }
    } catch (Exception e) {
        log.error("queryMsg exception", e);
    } finally {
        this.readWriteLock.readLock().unlock();
    }
    return new QueryOffsetResult(phyOffsets, indexLastUpdateTimestamp, indexLastUpdatePhyoffset);
}
```
