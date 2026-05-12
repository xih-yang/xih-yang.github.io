# 03、Zookeeper 源码解析 - 单机启动
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/3.html
- 分类：注册中心
- 分组：教程目录
### 一、解析配置文件

单机启动时，配置文件解析对象是ServerConfig，查看其parse方法：

```java
public void parse(String path) throws ConfigException {
    //这里是通过集群启动下的解析对象来解析配置文件
    QuorumPeerConfig config = new QuorumPeerConfig();
    //解析配置文件，先从文件中读取配置信息到Properties对象中，然后赋值到对应的属性上，配置文件的解析相对简单，值得注意一点的是，如果没有配置dataDir路径，将会抛出异常
    config.parse(path);
    //从QuorumPeerConfig解析得到的数据，配置到ServerConfig中
    readFrom(config);
}
```

如下就是解析配置文件得到的信息。

```java
public void readFrom(QuorumPeerConfig config) {
    clientPortAddress = config.getClientPortAddress();
    secureClientPortAddress = config.getSecureClientPortAddress();
    dataDir = config.getDataDir();
    dataLogDir = config.getDataLogDir();
    tickTime = config.getTickTime();
    maxClientCnxns = config.getMaxClientCnxns();
    minSessionTimeout = config.getMinSessionTimeout();
    maxSessionTimeout = config.getMaxSessionTimeout();
    jvmPauseMonitorToRun = config.isJvmPauseMonitorToRun();
    jvmPauseInfoThresholdMs = config.getJvmPauseInfoThresholdMs();
    jvmPauseWarnThresholdMs = config.getJvmPauseWarnThresholdMs();
    jvmPauseSleepTimeMs = config.getJvmPauseSleepTimeMs();
    metricsProviderClassName = config.getMetricsProviderClassName();
    metricsProviderConfiguration = config.getMetricsProviderConfiguration();
    listenBacklog = config.getClientPortListenBacklog();
    initialConfig = config.getInitialConfig();
}
```

我们重新回到runFromConfig(config)方法（去掉了部分代码）。

```java
public void runFromConfig(ServerConfig config) throws IOException, AdminServerException {
    FileTxnSnapLog txnLog = null;
    try {
        try {
        //创建服务指标监控对象，具体的使用将在后续分析中说明
            metricsProvider = MetricsProviderBootstrap.startMetricsProvider(
                config.getMetricsProviderClassName(),
                config.getMetricsProviderConfiguration());
        } catch (MetricsProviderLifeCycleException error) {
            throw new IOException("Cannot boot MetricsProvider " + config.getMetricsProviderClassName(), error);
        }
        //初始化metricsProvider对象
        ServerMetrics.metricsProviderInitialized(metricsProvider);
        //初始化一些权限认证信息，比如ip、digest
        ProviderRegistry.initialize();
        //实例化事务日志文件，这个对象后续再单独分析
        txnLog = new FileTxnSnapLog(config.dataLogDir, config.dataDir);
        //Jvm的监视器
        JvmPauseMonitor jvmPauseMonitor = null;
        if (config.jvmPauseMonitorToRun) {
            jvmPauseMonitor = new JvmPauseMonitor(config);
        }
        //创建一个ZooKeeperServer 实例
        final ZooKeeperServer zkServer = new ZooKeeperServer(jvmPauseMonitor, txnLog, config.tickTime, config.minSessionTimeout, config.maxSessionTimeout, config.listenBacklog, null, config.initialConfig);
        //设置服务状态对象
        txnLog.setServerStats(zkServer.serverStats());
                //实例化CountDownLatch对象，服务器启动会进行阻塞使用
        final CountDownLatch shutdownLatch = new CountDownLatch(1);
        zkServer.registerServerShutdownHandler(new ZooKeeperServerShutdownHandler(shutdownLatch));
        //实例化管理后台对象，默认是8080端口，默认请求路径是/commands
        adminServer = AdminServerFactory.createAdminServer();
        //监控server对象信息
        adminServer.setZooKeeperServer(zkServer);
        //启动管理管理后台
        adminServer.start();
        boolean needStartZKServer = true;
        if (config.getClientPortAddress() != null) {
           //ZooKeeper中是通过ServerCnxnFactory来管理IO连接
            cnxnFactory = ServerCnxnFactory.createFactory();
            cnxnFactory.configure(config.getClientPortAddress(), config.getMaxClientCnxns(), config.getClientPortListenBacklog(), false);
            //通过ServerCnxnFactory来启动，这里真正启动了ZooKeeper
            cnxnFactory.startup(zkServer);
            needStartZKServer = false;
        }
        //ZooKeeper中提供了两种通信方式，安全的和非安全的，可以通过secureClientPortAddress配置
        if (config.getSecureClientPortAddress() != null) {
            secureCnxnFactory = ServerCnxnFactory.createFactory();
            secureCnxnFactory.configure(config.getSecureClientPortAddress(), config.getMaxClientCnxns(), config.getClientPortListenBacklog(), true);
            secureCnxnFactory.startup(zkServer, needStartZKServer);
        }
        //实例化一个容器管理对象
        containerManager = new ContainerManager(
            zkServer.getZKDatabase(),
            zkServer.firstProcessor,
            Integer.getInteger("znode.container.checkIntervalMs", (int) TimeUnit.MINUTES.toMillis(1)),
            Integer.getInteger("znode.container.maxPerMinute", 10000),
            Long.getLong("znode.container.maxNeverUsedIntervalMs", 0)
        );
        //启动
        containerManager.start();
        ZKAuditProvider.addZKStartStopAuditLog();
        //启动后会阻塞在这里，直到服务暂停
        shutdownLatch.await();
        shutdown();
    } catch (InterruptedException e) {
    } 
}
```

从上方法可以提取出两个重要的对象ZooKeeperServer（服务实例）和ServerCnxnFactory（管理服务IO），这里我们重点关注的是服务的启动，所以其它信息暂时先忽略掉。此时我们跟着ServerCnxnFactory的startup方法继续分析启动过程。

我们先查看ServerCnxnFactory.createFactory()方法。

```java
public static ServerCnxnFactory createFactory() throws IOException {
//从系统属性中获取zookeeper.serverCnxnFactory
    String serverCnxnFactoryName = System.getProperty(ZOOKEEPER_SERVER_CNXN_FACTORY);
    if (serverCnxnFactoryName == null) {
    //默认是NIO实现
        serverCnxnFactoryName = NIOServerCnxnFactory.class.getName();
    }
    try {
        ServerCnxnFactory serverCnxnFactory = (ServerCnxnFactory) Class.forName(serverCnxnFactoryName)
                                                                       .getDeclaredConstructor()
                                                                       .newInstance();
        return serverCnxnFactory;
    } catch (Exception e) {
        IOException ioe = new IOException("Couldn't instantiate " + serverCnxnFactoryName, e);
        throw ioe;
    }
}
```

ServerCnxnFactory的实现类，ZooKeeper提供了两个实现NIOServerCnxnFactory和NettyServerCnxnFactory。所以此时的startup方法会调用到NIOServerCnxnFactory中的startup方法：

```java
public void startup(ZooKeeperServer zks, boolean startServer) throws IOException, InterruptedException {
    //启动
    start();
    //把当前的ServerCnxnFactory实例设置到ZooKeeperServer 实例中
    setZooKeeperServer(zks);
    if (startServer) {
    //初始化数据结构
        zks.startdata();
    //启动一些监控信息    
        zks.startup();
    }
}
```

我们先看看cnxnFactory.configure()方法，里边做了一些初始化内容。

```java
public void configure(InetSocketAddress addr, int maxcc, int backlog, boolean secure) throws IOException {
       //配置安全验证信息，默认是没有配置的，后续在进行分析
    configureSaslLogin();
   //最大连接数，默认是60
    maxClientCnxns = maxcc;
    //maxCnxns默认是0
    initMaxCnxns();
    //默认是10秒，可以通过参数zookeeper.nio.sessionlessCnxnTimeout配置
    sessionlessCnxnTimeout = Integer.getInteger(ZOOKEEPER_NIO_SESSIONLESS_CNXN_TIMEOUT, 10000);
    //过期队列
    cnxnExpiryQueue = new ExpiryQueue<NIOServerCnxn>(sessionlessCnxnTimeout);
    //connection过期线程
    expirerThread = new ConnectionExpirerThread();
     //获取系统核心数
    int numCores = Runtime.getRuntime().availableProcessors();
    // Selector的线程数，也就是接收请求的线程数，默认是核心数除以2再开方，可以通过zookeeper.nio.numSelectorThreads参数配置
    numSelectorThreads = Integer.getInteger(
        ZOOKEEPER_NIO_NUM_SELECTOR_THREADS,
        Math.max((int) Math.sqrt((float) numCores / 2), 1));
    if (numSelectorThreads < 1) {
        throw new IOException("numSelectorThreads must be at least 1");
    }
    //工作线程数，默认是核心数*2，可以参数zookeeper.nio.numWorkerThreads配置
    numWorkerThreads = Integer.getInteger(ZOOKEEPER_NIO_NUM_WORKER_THREADS, 2 * numCores);
    workerShutdownTimeoutMS = Long.getLong(ZOOKEEPER_NIO_SHUTDOWN_TIMEOUT, 5000);
    //实例化Selector处理线程
    for (int i = 0; i < numSelectorThreads; ++i) {
        selectorThreads.add(new SelectorThread(i));
    }
    listenBacklog = backlog;
    //这里就是涉及到NIO网络编程了，打开一个ServerSocketChannel实例
    this.ss = ServerSocketChannel.open();
    ss.socket().setReuseAddress(true);
    LOG.info("binding to port {}", addr);
    if (listenBacklog == -1) {
    //绑定地址
        ss.socket().bind(addr);
    } else {
        ss.socket().bind(addr, listenBacklog);
    }
    //非阻塞模式
    ss.configureBlocking(false);
    //配置接收请求线程
    acceptThread = new AcceptThread(ss, addr, selectorThreads);
}
```

接下来我们再看start方法。

```java
public void start() {
    stopped = false;
    //实例化工作池对象，我们先不用管这些具体是做什么的
    if (workerPool == null) {
        workerPool = new WorkerService("NIOWorker", numWorkerThreads, false);
    }
    //启动Selector线程
    for (SelectorThread thread : selectorThreads) {
        if (thread.getState() == Thread.State.NEW) {
            thread.start();
        }
    }
    // 启动接收请求线程
    if (acceptThread.getState() == Thread.State.NEW) {
        acceptThread.start();
    }
    //启动过期监测线程
    if (expirerThread.getState() == Thread.State.NEW) {
        expirerThread.start();
    }
}
```

start方法启动了三种线程，SelectorThread用来处理读写请求，AcceptThread线程用来处理连接请求、ExpirerThread处理过期请求的线程，业务逻辑都在run方法。start方法完成之后就是初始化数据结构的调用以及一些监控信息的启动。所以ZooKeeper的单机启动，实际上就是启动以上三种线程。

### 二、初始化数据库

这部分先介绍，数据库的初始化过程，至于启动后请求的接收和处理过程下一节继续分析，线程启动完成后就会执行数据库的加载过程zks.startdata()。

```java
public void startdata() throws IOException, InterruptedException {
    //初始化一个数据库，会传递FileTxnSnapLog对象
    if (zkDb == null) {
        zkDb = new ZKDatabase(this.txnLogFactory);
    }
    if (!zkDb.isInitialized()) {
    //加载数据
        loadData();
    }
}
```

我们先查看ZKDatabase的构造方法，如下所示（去掉了一些多余的代码）。

```java
public ZKDatabase(FileTxnSnapLog snapLog) {
        //首先创建一个DataTree实例
        dataTree = createDataTree();
        //session过期时间集合
        sessionsWithTimeouts = new ConcurrentHashMap<Long, Integer>();
        this.snapLog = snapLog;
        //快照大小因子
        snapshotSizeFactor = Double.parseDouble(
                    System.getProperty(SNAPSHOT_SIZE_FACTOR,
                            Double.toString(DEFAULT_SNAPSHOT_SIZE_FACTOR)));
            if (snapshotSizeFactor > 1) {
                snapshotSizeFactor = DEFAULT_SNAPSHOT_SIZE_FACTOR;
            }
            //提交日志总数
            commitLogCount = Integer.parseInt(
                    System.getProperty(COMMIT_LOG_COUNT,
                            Integer.toString(DEFAULT_COMMIT_LOG_COUNT)));
    }
```

接下来跟着loadData()方法：

```java
public void loadData() throws IOException, InterruptedException {
    //是否已经初始化了
    if (zkDb.isInitialized()) {
        //已经初始化完成，设置当前的事务id为当前数据中最新的事务id
        setZxid(zkDb.getDataTreeLastProcessedZxid());
    } else {
       //否则加载数据库，并且设置最新的事务id
        setZxid(zkDb.loadDataBase());
    }
    //清除过期session
    zkDb.getSessions().stream()
                    .filter(session -> zkDb.getSessionWithTimeOuts().get(session) == null)
                    .forEach(session -> killSession(session, zkDb.getDataTreeLastProcessedZxid()));
    //建立快照
    takeSnapshot();
}
```

接下来我们跟着zkDb.loadDataBase()方法继续分析：

```java
public long loadDataBase() throws IOException {
    //获取加载开始时间
    long startTime = Time.currentElapsedTime();
    //获取到最新的事务id
    long zxid = snapLog.restore(dataTree, sessionsWithTimeouts, commitProposalPlaybackListener);
    //当前初始化完成
    initialized = true;
    //得到加载时间
    long loadTime = Time.currentElapsedTime() - startTime;
    ServerMetrics.getMetrics().DB_INIT_TIME.add(loadTime);
    //返回事务id
    return zxid;
}
```

此时数据的加载过程又是交给了FileTxnSnapLog对象，所以我们继续跟踪FileTxnSnapLog对的restore方法走。

```java
public long restore(DataTree dt, Map<Long, Integer> sessions, PlayBackListener listener) throws IOException {
    //获取开始时间
    long snapLoadingStartTime = Time.currentElapsedTime();
    //反序列化当前存在的文件，如果是第一次启动，返回的是-1，此处暂时不分析，先接着往下看
    long deserializeResult = snapLog.deserialize(dt, sessions);
    ServerMetrics.getMetrics().STARTUP_SNAP_LOAD_TIME.add(Time.currentElapsedTime() - snapLoadingStartTime);
    //先实例化一个事务日志文件对象，如果查看FileTxnSnapLog的构造方法可知，当创建数据目录的时候，会在data目录下创建version-*的子目录
    FileTxnLog txnLog = new FileTxnLog(dataDir);
    boolean trustEmptyDB;
    File initFile = new File(dataDir.getParent(), "initialize");
    if (Files.deleteIfExists(initFile.toPath())) {
        LOG.info("Initialize file found, an empty database will not block voting participation");
        trustEmptyDB = true;
    } else {
    //表示当前数据库还没初始化
        trustEmptyDB = autoCreateDB;
    }
   //这里先不管
    RestoreFinalizer finalizer = () -> {
    //查看是否需要从日志中恢复数据
        long highestZxid = fastForwardFromEdits(dt, sessions, listener);
        DataTree.ZxidDigest snapshotZxidDigest = dt.getDigestFromLoadedSnapshot();
        return highestZxid;
    };
   //如果当前序列化结果为-1，初始值是等于-1
    if (-1L == deserializeResult) {
    //此时为-1
        if (txnLog.getLastLoggedZxid() != -1) {
            if (!trustEmptySnapshot) {
                throw new IOException(EMPTY_SNAPSHOT_WARNING + "Something is broken!");
            } else {
                LOG.warn("{}This should only be allowed during upgrading.", EMPTY_SNAPSHOT_WARNING);
                return finalizer.run();
            }
        }
        if (trustEmptyDB) {
            //调用save方法
            save(dt, (ConcurrentHashMap<Long, Integer>) sessions, false);
            //返回0
            return 0L;
        } else {
            return -1L;
        }
    }
    //如果已经初始化了，就调用这个方法返回最新的事务id
    return finalizer.run();
}
```

此时我们需要分析一下save方法：

```java
public void save(DataTree dataTree,ConcurrentHashMap<Long, Integer> sessionsWithTimeouts, boolean syncSnap) throws IOException {
 //初始化为0
    long lastZxid = dataTree.lastProcessedZxid;
    //实例化一个快照文件，文件命名方式是，文件名是snapshot，文件的后缀是最新事务id的十六进制+自定义的zookeeper.snapshot.compression.method参数名，默认为空字符
    //所以此时的目录结构应该是/data/version-2/snapshot.0(版本号为2时)
    File snapshotFile = new File(snapDir, Util.makeSnapshotName(lastZxid));
    LOG.info("Snapshotting: 0x{} to {}", Long.toHexString(lastZxid), snapshotFile);
    try {
      //序列化当前文件
        snapLog.serialize(dataTree, sessionsWithTimeouts, snapshotFile, syncSnap);
    } catch (IOException e) {
        throw e;
    }
}
```

继续serialize方法：

```java
public synchronized void serialize(DataTree dt,Map<Long, Integer> sessions,File snapShot,    boolean fsync) throws IOException {
    if (!close) {
    //得到一个输出流
        try (CheckedOutputStream snapOS = SnapStream.getOutputStream(snapShot, fsync)) {
            OutputArchive oa = BinaryOutputArchive.getArchive(snapOS);
            //文件头，快照魔数ZKSN，版本号、数据库id=-1
            FileHeader header = new FileHeader(SNAP_MAGIC, VERSION, dbId);
            //序列化，实际调用的是FileHeader的序列化方法
            serialize(dt, sessions, oa, header);
            //此时完成了序列化过程
            SnapStream.sealStream(snapOS, oa);
            if (dt.serializeZxidDigest(oa)) {
                SnapStream.sealStream(snapOS, oa);
            }
            //保存最新快照信息，此时数据目录下会生成一个version-2/snapshot.0文件
            lastSnapshotInfo = new SnapshotInfo(Util.getZxidFromName(snapShot.getName(), SNAPSHOT_FILE_PREFIX),snapShot.lastModified() / 1000);
        }
    } else {
        throw new IOException("FileSnap has already been closed");
    }
}
```

我们先查看FileHeader 的序列化方法：

```java
public void serialize(OutputArchive a_, String tag) throws java.io.IOException {
//这个是个空实现
a_.startRecord(this,tag);
//把当前的魔数序列化到文件中
a_.writeInt(magic,"magic");
//把当前版本号序列化到文件中
a_.writeInt(version,"version");
//把当前的数据库id序列化到文件中
a_.writeLong(dbid,"dbid");
//空实现
a_.endRecord(this,tag);
}
```

这里就得到了一个文件头，包含魔数、版本号、数据库id标识，文件头序列化后会继续调用快照的序列化方法。SerializeUtils.serializeSnapshot(dt, oa, sessions)

```java
public static void serializeSnapshot(DataTree dt, OutputArchive oa, Map<Long, Integer> sessions) throws IOException {
    HashMap<Long, Integer> sessSnap = new HashMap<Long, Integer>(sessions);
    //写入过期session到文件中
    oa.writeInt(sessSnap.size(), "count");
    for (Entry<Long, Integer> entry : sessSnap.entrySet()) {
        oa.writeLong(entry.getKey().longValue(), "id");
        oa.writeInt(entry.getValue().intValue(), "timeout");
    }
    //调用DataTree 的序列化方法
    dt.serialize(oa, "tree");
}
```

dt.serialize(oa, “tree”)：

```java
public void serialize(OutputArchive oa, String tag) throws IOException {
   //序列化权限控制
    serializeAcls(oa);
    //序列化节点
    serializeNodes(oa);
}
```

serializeAcls(oa)：

```java
public void serializeAcls(OutputArchive oa) throws IOException {
    aclCache.serialize(oa);
}
```

aclCache是ReferenceCountedACLCache实例，我们继续查看其序列化方法：

```java
public void serialize(OutputArchive oa) throws IOException {
    Map<Long, List<ACL>> clonedLongKeyMap;
    synchronized (this) {
    //默认的权限控制是world:anyone
        clonedLongKeyMap = new HashMap<>(longKeyMap);
    }
    //写入权限控制的总数
    oa.writeInt(clonedLongKeyMap.size(), "map");
    for (Map.Entry<Long, List<ACL>> val : clonedLongKeyMap.entrySet()) {
        oa.writeLong(val.getKey(), "long");
        List<ACL> aclList = val.getValue();
        //开始陷入权限控制器
        oa.startVector(aclList, "acls");
        for (ACL acl : aclList) {
        //写入权限控制器，也就是把world和anyone写入文件中
            acl.serialize(oa, "acl");
        }
        oa.endVector(aclList, "acls");
    }
}
```

接下来就是写入节点值：

```java
    public void serializeNodes(OutputArchive oa) throws IOException {
        serializeNode(oa, new StringBuilder());
        if (root != null) {
        //写入根节点
            oa.writeString("/", "path");
        }
    }
```

ZooKeeper启动时候会有默认的五个节点，节点路径分别是""、/zookeeper/quota、/zookeeper/config、/zookeeper、/，这五类节点，序列化节点就是把这些节点全部保存到文件中，保存方式是节点路径、节点值、节点权限、节点状态（stat）。

以上都是基于第一次启动时，数据库的加载过程，此时会在data目录下生成一个snapshot.0文件，里边保存了魔数、版本号、数据库id、默认权限、以及初始化节点等信息。如果第二次再次启动时，我们再次回到deserialize方法：

```java
public long deserialize(DataTree dt, Map<Long, Integer> sessions) throws IOException {
//这个方法会找到，data目录下所有snapshot.*的文件，并且是通过后缀排序之后的文件（降序），并且会验证当前文件是否是合法文件，验证方式是，文件内容是否大于10个字节（包括header和结尾/字符），以及文件内容是否是以"/"结尾，且前一个int类型是否是1（"/"的长度）
    List<File> snapList = findNValidSnapshots(100);
    if (snapList.size() == 0) {
        return -1L;
    }
    File snap = null;
    long snapZxid = -1;
    boolean foundValid = false;
    for (int i = 0, snapListSize = snapList.size(); i < snapListSize; i++) {
        snap = snapList.get(i);
        LOG.info("Reading snapshot {}", snap);
        snapZxid = Util.getZxidFromName(snap.getName(), SNAPSHOT_FILE_PREFIX);
        try (CheckedInputStream snapIS = SnapStream.getInputStream(snap)) {
            InputArchive ia = BinaryInputArchive.getArchive(snapIS);
            //反序列化过程，也就是把当前文件中的数据转换成DataTree数据结构
            deserialize(dt, sessions, ia);
            //去除一些不必要的数据
            SnapStream.checkSealIntegrity(snapIS, ia);
            if (dt.deserializeZxidDigest(ia, snapZxid)) {
                SnapStream.checkSealIntegrity(snapIS, ia);
            }
            //成功读取最新的文件，退出读取
            foundValid = true;
            break;
        } catch (IOException e) {
            LOG.warn("problem reading snap file {}", snap, e);
        }
    }
    if (!foundValid) {
        throw new IOException("Not able to find valid snapshots in " + snapDir);
    }
    //设置最新的事务id
    dt.lastProcessedZxid = snapZxid;
    lastSnapshotInfo = new SnapshotInfo(dt.lastProcessedZxid, snap.lastModified() / 1000);
    if (dt.getDigestFromLoadedSnapshot() != null) {
        dt.compareSnapshotDigests(dt.lastProcessedZxid);
    }
    //返回最新的事务id
    return dt.lastProcessedZxid;
}
```

到此，数据库的加载过程完成，如果是首次启动就会在data目录下创建一个snapshot.0的文件，把默认节点等信息写入到这个文件中，如果是重启，会从data目录下找到最新的snapshot.*文件，根据文件后缀名降序排序，得到最新的文件。然后把文件中的内容转换成DataTree数据结构，并且会跟日志文件中的数据进行对比，是否需要从日志文件中恢复一部分数据，后续将会重点分析一下ZKDatabase的数据结构。

### 三、总结

以上简单分析了，ZooKeeper的单机启动过程，先读取配置文件（zoo.cfg）,实例化一个ServerCnxnFactory，通过这个对象来实现ZooKeeper的启动，会启动相应的线程来接收请求，启动之后就会进行数据库的加载，加载完成整个服务就算启动成功。下一节讲针对单机启动下，是怎样处理客户端请求。

以上，有任何不对的地方，请留言指正，敬请谅解。
