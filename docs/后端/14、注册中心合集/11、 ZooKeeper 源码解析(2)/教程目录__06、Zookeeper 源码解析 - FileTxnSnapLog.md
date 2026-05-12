# 06、Zookeeper 源码解析 - FileTxnSnapLog
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/6.html
- 分类：注册中心
- 分组：教程目录
### 一、FileTxnSnapLog

前边分析可知，ZooKeeper中数据的持久化以及日志文件的写入都是通过FileTxnSnapLog对象来实现的，本文大致分析一下这个对象的整体结构。

FileTxnSnapLog的初始化在runFromConfig方法中：

```java
FileTxnSnapLog txnLog = new FileTxnSnapLog(config.dataLogDir, config.dataDir)
```

其中dataDir和dataLogDir是在配置文件中进行路径配置，并且dataDir必须的且有效的地址，dataLogDir没有配置的情况下等于dataDir。

FileTxnSnapLog 的构造方法：

```java
public FileTxnSnapLog(File dataDir, File snapDir) throws IOException {
   //此时会在data目录和log目录下创建一个子目录，子目录version-*也就是当前的版本号
    this.dataDir = new File(dataDir, version + VERSION);
    this.snapDir = new File(snapDir, version + VERSION);
    //data目录是否是自动创建，默认是true，可以通过zookeeper.datadir.autocreate继续配置
    boolean enableAutocreate = Boolean.parseBoolean(
        System.getProperty(ZOOKEEPER_DATADIR_AUTOCREATE, ZOOKEEPER_DATADIR_AUTOCREATE_DEFAULT));
     //默认是false
    trustEmptySnapshot = Boolean.getBoolean(ZOOKEEPER_SNAPSHOT_TRUST_EMPTY);
    //如果当前data目录不存在
    if (!this.dataDir.exists()) {
    //如果不允许自动创建，抛出异常
        if (!enableAutocreate) {
            throw new DatadirException(String.format( "Missing data directory %s, automatic data directory creation is disabled (%s is false).Please create this directory manually.",this.dataDir,ZOOKEEPER_DATADIR_AUTOCREATE));
        }//如果自动创建失败，抛出异常
        if (!this.dataDir.mkdirs() && !this.dataDir.exists()) {
            throw new DatadirException("Unable to create data directory " + this.dataDir);
        }
    }
    //如果当前目录只读状态，抛出异常
    if (!this.dataDir.canWrite()) {
        throw new DatadirException("Cannot write to data directory " + this.dataDir);
    }
    //snapDir文件也是一样的处理流程（代码已经省略）
    //如果日志文件和数据文件不是相同目录
    if (!this.dataDir.getPath().equals(this.snapDir.getPath())) {
      //这个目录主要是检查data目录下是否包含日志文件，和相反检查
        checkLogDir();
        checkSnapDir();
    }
    //创建日志事务对象和快照事务对象
    txnLog = new FileTxnLog(this.dataDir);
    snapLog = new FileSnap(this.snapDir);
   //默认是true
    autoCreateDB = Boolean.parseBoolean(
        System.getProperty(ZOOKEEPER_DB_AUTOCREATE, ZOOKEEPER_DB_AUTOCREATE_DEFAULT));
}
```

既然FileTxnSnapLog是管理data和log两类数据的，我们就来看看整个的管理过程。

FileTxnSnapLog 第一次调用是在服务启动时，需要加载数据到内存中，也就是ZKDatabase中的loadDataBase()调用是，此时就会调用FileTxnSnapLog 的restore方法，此方法会先调用SnapShot实例去反序列化文件数据到DataTree中。如果是首次启动，那么就会在当前目录下创建一个snapshot.0的文件，并写入文件头以及默认节点信息到这个文件中，如果是重启，此时会在该目录下找到所有的snapshot.*文件，然后根据文件后缀名降序排序，得到文件集合，然后把第一个（表示上一次关闭是的最新事务文件）文件内容反序列到内存中，如果执行成功返回。

如果当前启动是重启，就会执行fastForwardFromEdits方法，这个方法就是从日志文件中恢复上一次关闭时，没有持久化的操作。

```java
public long fastForwardFromEdits(DataTree dt,Map<Long, Integer> sessions,PlayBackListener listener)throws IOException {
        //得到一个事务迭代器
        TxnIterator itr = txnLog.read(dt.lastProcessedZxid + 1);
        //得到上一个snapshot文件中最新的事务id
        long highestZxid = dt.lastProcessedZxid;
        TxnHeader hdr;
        int txnLoaded = 0;
        long startTime = Time.currentElapsedTime();
        try {
            while (true) {
                hdr = itr.getHeader();
                if (hdr == null) {
                    //表示当前的id是最新的
                    return dt.lastProcessedZxid;
                }
                if (hdr.getZxid() < highestZxid && highestZxid != 0) {
                LOG.error("{}(highestZxid) > {}(next log) for type {}", highestZxid, hdr.getZxid(), hdr.getType());
            } else {
                //设置最新id
                highestZxid = hdr.getZxid();
            }
            try {
                //处理上一个服务关闭前，还未完成的持久化操作，也就是说从日志中恢复数据
                processTransaction(hdr, dt, sessions, itr.getTxn());
                dt.compareDigest(hdr, itr.getTxn(), itr.getDigest());
                txnLoaded++;
            } catch (KeeperException.NoNodeException e) {
            }
            listener.onTxnLoaded(hdr, itr.getTxn(), itr.getDigest());
            //继续迭代
            if (!itr.next()) {
                break;
            }
        }
    } finally {
        if (itr != null) {
            itr.close();
        }
    }
    return highestZxid;
}
```

我们先看看txnLog.read(dt.lastProcessedZxid + 1)方法，这里为什么是+1，因为，日志中的数据总是比快照数据要新，或者相等。快照文件的后缀名表示的是当前最新的事务id，所以日志文件的后缀名命名方式是当前快照文件最新事务id+1，所以这里需要+1操作，read方法如下：

```java
public TxnIterator read(long zxid, boolean fastForward) throws IOException {
    return new FileTxnIterator(logDir, zxid, fastForward);
}
```

此时我们再看FileTxnIterator的构造方法：

```java
public FileTxnIterator(File logDir, long zxid, boolean fastForward) throws IOException {
    this.logDir = logDir;
    this.zxid = zxid;
    //初始
    init();
    //这里是找到当前最新的事务id
    if (fastForward && hdr != null) {
        while (hdr.getZxid() < zxid) {
            if (!next()) {
                break;
            }
        }
    }
}
```

init方法：

```java
void init() throws IOException {
    storedFiles = new ArrayList<>();
    //列出所有的日志文件
    List<File> files = Util.sortDataDir(
        FileTxnLog.getLogFiles(logDir.listFiles(), 0),
        LOG_FILE_PREFIX,
        false);
     //找到当前事务id大于等于zxid的值，以及小于它的第一个值
    for (File f : files) {
        if (Util.getZxidFromName(f.getName(), LOG_FILE_PREFIX) >= zxid) {
            storedFiles.add(f);
        } else if (Util.getZxidFromName(f.getName(), LOG_FILE_PREFIX) < zxid) {
            storedFiles.add(f);
            break;
        }
    }
    //从storedFiles集合中从后往前取日志文件，并封装成文件流对象InputArchive
    goToNextLog();
    //从日志文件中取出对应的操作记录
    next();
}
```

FileTxnIterator返回时，表示当前是最新的事务id，如果日志文件中存在还没有持久化的事务，调用processTransaction方法进行数据的恢复操作。

当数据加载到内存中完成，会进行数据文件的快照，也就是调用save方法，还有就是当当前的请求数达到了默认值的5W+或者当前的事务容量已经达到了默认值2GB+时，就会进行一次快照保存。

我们知道ZKDatabase会记录每一次的增删改操作，也就是调用FileTxnSnapLog的append方法，往日志文件中写入日志，每当进行数据快照备份的时候，相应的日志文件也会进行，也会重新生成对应的日志文件。

getLastLoggedZxid()这个方法总是返回日志文件中最新的事务id。

### 二、总结

ZooKeeper中通过FileTxnSnapLog对象来管理数据快照文件和日志文件，FileTxnSnapLog对象又是通过TxnLog和SnapShot来管理，前者是进行日志数据管理，后者是进行数据快照文件管理。ZooKeeper中通过日志文件记录所有的增删改操作，这个是实时持久化到硬盘的，所以当系统突然停止。下次重启之后也可以从日志文件中恢复没有处理的信息。

以上，有任何不对的地方，请留言指正，敬请谅解。
