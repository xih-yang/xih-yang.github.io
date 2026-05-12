# 10、RocketMQ 源码解析 - MappedFileQueue
- 来源：https://ddkk.com/zhuanlan/mq/rocketmq/3/10.html
- 分类：消息队列
- 分组：教程目录
## 版本

基于`rocketmq-all-4.3.1`版本；

## 简介

**1、** RocketMQ使用**MappedFile**、**MappedFileQueue**来封装存储文件**MappedFileQueue**是**MappedFile**的管理容器，使用CopyOnWriteArrayList来管理所有的**MappedFile****MappedFileQueue**提供查找目录下**MappedFile**的方法；

**2、****MappedFileQueue**核心属性；

```java
/**
 * 1.MappedFile组成的队列
 * 2.包括CommitLog(消息主题以及元数据) ConsumerQueue逻辑队列
 */
public class MappedFileQueue {
    private static final InternalLogger log = InternalLoggerFactory.getLogger(LoggerName.STORE_LOGGER_NAME);
    private static final InternalLogger LOG_ERROR = InternalLoggerFactory.getLogger(LoggerName.STORE_ERROR_LOGGER_NAME);
    //一次最多删除的文件数量
    private static final int DELETE_FILES_BATCH_MAX = 10;
    //文件队列的存储目录
    private final String storePath;
    //单个MappedFile文件的大小
    private final int mappedFileSize;
    //MappedFile文件的集合
    private final CopyOnWriteArrayList<MappedFile> mappedFiles = new CopyOnWriteArrayList<MappedFile>();
    //预分配MappedFile的服务线程
    private final AllocateMappedFileService allocateMappedFileService;
    //已经刷到磁盘的位置(某一个mappedFile中的位置)，位置之前的所有数据都持久化到磁盘
    private long flushedWhere = 0;
    //已经提交的位置(write >= commit >= flush位置)
    private long committedWhere = 0;
    //当前已刷盘的最后一条消息存储的时间戳
    private volatile long storeTimestamp = 0;
  	public MappedFileQueue(final String storePath, int mappedFileSize,
        AllocateMappedFileService allocateMappedFileService) {
        this.storePath = storePath;
        this.mappedFileSize = mappedFileSize;
        this.allocateMappedFileService = allocateMappedFileService;
    }
		...省略...
}  
```

## 获取第一和最后一个MappedFile

**1、** 获取第一个MappedFile；

```java
/**
 * 返回队列中第一个MappedFile，这里忽略索引越界异常，可能一个都没有，返回null
 * 先判断mappedFiles是否为空，然后get(0),因为存在并发，所以需要即使判断为空，还是可能索引越界
 * @return
 */
public MappedFile getFirstMappedFile() {
    MappedFile mappedFileFirst = null;
    if (!this.mappedFiles.isEmpty()) {
        try {
            mappedFileFirst = this.mappedFiles.get(0);
        } catch (IndexOutOfBoundsException e) {
            //ignore
        } catch (Exception e) {
            log.error("getFirstMappedFile has exception.", e);
        }
    }
    return mappedFileFirst;
}
```

**2、** 获取最后一个MappedFile；

```java
//获取最后一个MappedFile
public MappedFile getLastMappedFile() {
    MappedFile mappedFileLast = null;
    while (!this.mappedFiles.isEmpty()) {
        try {
          	//由于get和size没有加锁
            // size获取的值可能是旧的，所以可能出现错误的大小，导致索引越界
            // get获取的值可能是旧的数组，所以可能出现索引越界
            mappedFileLast = this.mappedFiles.get(this.mappedFiles.size() - 1);
            break;
        } catch (IndexOutOfBoundsException e) {
            //continue;
        } catch (Exception e) {
            log.error("getLastMappedFile has exception.", e);
            break;
        }
    }
    return mappedFileLast;
}
```

**3、** 通过起始偏移量，获取最后一个MappedFile，如果不存在，可自动创建；

```java
public MappedFile getLastMappedFile(final long startOffset, boolean needCreate) {
    long createOffset = -1;
    //最后一个映射文件
    MappedFile mappedFileLast = getLastMappedFile();
    //如果没有映射文件就 创建开始的offset
    if (mappedFileLast == null) {
        createOffset = startOffset - (startOffset % this.mappedFileSize);
    }
    if (mappedFileLast != null && mappedFileLast.isFull()) {
        createOffset = mappedFileLast.getFileFromOffset() + this.mappedFileSize;
    }
    //创建新的MappedFile
    if (createOffset != -1 && needCreate) {
        //文件名
        String nextFilePath = this.storePath + File.separator + UtilAll.offset2FileName(createOffset);
        String nextNextFilePath = this.storePath + File.separator
            + UtilAll.offset2FileName(createOffset + this.mappedFileSize);
        MappedFile mappedFile = null;
        if (this.allocateMappedFileService != null) {
            mappedFile = this.allocateMappedFileService.putRequestAndReturnMappedFile(nextFilePath,
                nextNextFilePath, this.mappedFileSize);
        } else {
            try {
                mappedFile = new MappedFile(nextFilePath, this.mappedFileSize);
            } catch (IOException e) {
                log.error("create mappedFile exception", e);
            }
        }
        //添加到队列
        if (mappedFile != null) {
            if (this.mappedFiles.isEmpty()) {
                //标识第一个文件
                mappedFile.setFirstCreateInQueue(true);
            }
            this.mappedFiles.add(mappedFile);
        }
        return mappedFile;
    }
    return mappedFileLast;
}
```

## 获取最小最大偏移量

**1、** 获取最小最大偏移量；

- 最小：获取第一个MappedFile，然后获取其起始偏移量
- 最大：获取最后一个MappedFile，然后【起始偏移量】+【可读位置】
**2、** 源码；

```java
public long getMinOffset() {
    if (!this.mappedFiles.isEmpty()) {
        try {
            return this.mappedFiles.get(0).getFileFromOffset();
        } catch (IndexOutOfBoundsException e) {
            //continue;
        } catch (Exception e) {
            log.error("getMinOffset has exception.", e);
        }
    }
    return -1;
}
/**
 * 获取最大偏移，最后一个MappedFile允许读到的位置
 * @return
 */
public long getMaxOffset() {
    MappedFile mappedFile = getLastMappedFile();
    if (mappedFile != null) {
        return mappedFile.getFileFromOffset() + mappedFile.getReadPosition();
    }
    return 0;
}
/**
 * 获取最大写位置，最后一个MappedFile写到的位置
 * @return
 */
public long getMaxWrotePosition() {
    MappedFile mappedFile = getLastMappedFile();
    if (mappedFile != null) {
        return mappedFile.getFileFromOffset() + mappedFile.getWrotePosition();
    }
    return 0;
}
/**
 *还有多少字节等待commit的(wrote与commit位置之差)
 */
public long remainHowManyDataToCommit() {
    return getMaxWrotePosition() - committedWhere;
}
```

## 根据时间戳查询MappedFile

**1、** 根据【消息存储的时间戳】查询如果this.mappedFiles为空，则直接返回null如果不为空，则从第一个文件开始查找，找到第一个最后一次更新时间大于查找时间戳的文件，如果不存在，则返回最后一个MappedFile文件；

```java
public MappedFile getMappedFileByTime(final long timestamp) {
    //保留的MappedFile个数设置为0
    Object[] mfs = this.copyMappedFiles(0);
    if (null == mfs)
        return null;
    /**
     * 从 MappedFile 列表中第一个文件开始查找， 找到第一个最后一次更新时间大于待查找时间戳的文件，
     * 如果不存在，则返回最后一个 MappedFile 文件 。
     */
    for (int i = 0; i < mfs.length; i++) {
        MappedFile mappedFile = (MappedFile) mfs[i];
        if (mappedFile.getLastModifiedTimestamp() >= timestamp) {
            return mappedFile;
        }
    }
    return (MappedFile) mfs[mfs.length - 1];
}
private Object[] copyMappedFiles(final int reservedMappedFiles) {
    Object[] mfs;
    if (this.mappedFiles.size() <= reservedMappedFiles) {
        return null;
    }
    mfs = this.mappedFiles.toArray();
    return mfs;
}
```

## 根据消息存储的偏移量查询MappedFile

**1、** 根据【消息存储的偏移量】查询；

```java
public MappedFile findMappedFileByOffset(final long offset, final boolean returnFirstOnNotFound) {
    try {
        //获取第一个MappedFile
        MappedFile firstMappedFile = this.getFirstMappedFile();
        //获取最后一个MappedFile
        MappedFile lastMappedFile = this.getLastMappedFile();
        if (firstMappedFile != null && lastMappedFile != null) {
            // 如果偏移量小于第一个文件的起始偏移量或者大于或等于最后一个文件的最后偏移量，则打印警告日志，即直接返回null
            if (offset < firstMappedFile.getFileFromOffset() || offset >= lastMappedFile.getFileFromOffset() + this.mappedFileSize) {
                LOG_ERROR.warn("Offset not matched. Request offset: {}, firstOffset: {}, lastOffset: {}, mappedFileSize: {}, mappedFiles count: {}",
                    offset,
                    firstMappedFile.getFileFromOffset(),
                    lastMappedFile.getFileFromOffset() + this.mappedFileSize,
                    this.mappedFileSize,
                    this.mappedFiles.size());
            } else {
                //要减去已经被删除的MappedFile的大小(即当前第一个文件的文件名并不一定是00000000000000000000)
                int index = (int) ((offset / this.mappedFileSize) - (firstMappedFile.getFileFromOffset() / this.mappedFileSize));
                MappedFile targetFile = null;
                try {
                    targetFile = this.mappedFiles.get(index);
                } catch (Exception ignored) {
                }
                //如果offset大于MappedFile的起始偏移量并且小于当前MappedFile的最大偏移量
                //表示就是要找的MappedFile。FIXME by jannal， 这段代码多余
                if (targetFile != null && offset >= targetFile.getFileFromOffset()
                    && offset < targetFile.getFileFromOffset() + this.mappedFileSize) {
                    return targetFile;
                }
                //FIXME by jannal， 这段代码多余
                for (MappedFile tmpMappedFile : this.mappedFiles) {
                    if (offset >= tmpMappedFile.getFileFromOffset()
                        && offset < tmpMappedFile.getFileFromOffset() + this.mappedFileSize) {
                        return tmpMappedFile;
                    }
                }
            }
            // 如果没找到，是否返回第一个MappedFile
            if (returnFirstOnNotFound) {
                return firstMappedFile;
            }
        }
    } catch (Exception e) {
        log.error("findMappedFileByOffset Exception", e);
    }
    return null;
}
```

## 重置offset

**1、** 将offset以后的MappedFile都清除掉，在当前4.3.1版本中存在bug，貌似也没有使用；

```java
/**
 * 将offset以后的MappedFile都清除掉
 * @param offset
 * @return
 */
public boolean resetOffset(long offset) {
    MappedFile mappedFileLast = getLastMappedFile();
    if (mappedFileLast != null) {
        // 最后一个MappedFile的【起始偏移量】+ 【写入PageCache的位置】
        long lastOffset = mappedFileLast.getFileFromOffset() +
            mappedFileLast.getWrotePosition();
        // 最后的写入位置与offset的差值，如果大于2个MappedFile大小，就不做重置
        long diff = lastOffset - offset;
        final int maxDiff = this.mappedFileSize * 2;
        if (diff > maxDiff)
            return false;
    }
    ListIterator<MappedFile> iterator = this.mappedFiles.listIterator();
    //FIXME jannal 永远返回false吧 ???  正确的逆序遍历 this.mappedFiles.listIterator(this.mappedFiles.size());
    while (iterator.hasPrevious()) {
        mappedFileLast = iterator.previous();
        if (offset >= mappedFileLast.getFileFromOffset()) {
            // 定位到offset在第几个MappedFile中
            int where = (int) (offset % mappedFileLast.getFileSize());
            // 重置最后一个MappedFile的位置
            mappedFileLast.setFlushedPosition(where);
            mappedFileLast.setWrotePosition(where);
            mappedFileLast.setCommittedPosition(where);
            break;
        } else {
            // 如果offset小于当前的MappedFile的起始偏移量，则直接删除MappedFile
            iterator.remove();
        }
    }
    return true;
}
```
