# 02、Zookeeper 源码解析 - 启动类
- 来源：https://ddkk.com/zhuanlan/registered/zookeeper/2/2.html
- 分类：注册中心
- 分组：教程目录
### 一、启动类

如果你编辑zkServer.cmd文件就会发现ZooKeeper的启动类是QuorumPeerMain实例，既然是启动类，必然存在一个main方法。如下：

```java
public static void main(String[] args) {
    QuorumPeerMainmain = new QuorumPeerMain();
    main.initializeAndRun(args);
}
```

main方法通过调用QuorumPeerMainmain的initializeAndRun实现ZooKeeper启动，这也是我们分析ZooKeeper源码的入口。

```java
protected void initializeAndRun(String[] args) throws ConfigException, IOException, AdminServerException {
    //解析配置文件，参数传递的应是配置文件也就是zoo.cfg
    QuorumPeerConfig config = new QuorumPeerConfig();
    if (args.length == 1) {
        config.parse(args[0]);
    }
    //这里先不用管，后续在分析（大致是清理多余的数据日志）
    DatadirCleanupManager purgeMgr = new DatadirCleanupManager(
        config.getDataDir(),
        config.getDataLogDir(),
        config.getSnapRetainCount(),
        config.getPurgeInterval());
    purgeMgr.start();
    //此时就会判断，如果是集群启动
    if (args.length == 1 && config.isDistributed()) {
        runFromConfig(config);
    } else {
      //否则走单机启动
        ZooKeeperServerMain.main(args);
    }
}
```

这里就分为单机启动和集群启动。

### 二、单机启动

单机启动是通过ZooKeeperServerMain的main方法启动的，我们也可以直接配置其为启动类（单机需求下），他们都是调用initializeAndRun方法，单机模式下的配置文件解析对象是ServerConfig（后文单独分析配置文件的解析过程）。接下来就是调用runFromConfig(config)启动ZooKeeper。

```java
public void runFromConfig(ServerConfig config) throws IOException, AdminServerException {
    FileTxnSnapLog txnLog = null;
    try {
        try {
            metricsProvider = MetricsProviderBootstrap.startMetricsProvider(
                config.getMetricsProviderClassName(),
                config.getMetricsProviderConfiguration());
        } catch (MetricsProviderLifeCycleException error) {
            throw new IOException("Cannot boot MetricsProvider " + config.getMetricsProviderClassName(), error);
        }
        ServerMetrics.metricsProviderInitialized(metricsProvider);
        //注册一些权限认证信息
        ProviderRegistry.initialize();
        //定义一个日志快照对象
        txnLog = new FileTxnSnapLog(config.dataLogDir, config.dataDir);
        //默认是是空
        JvmPauseMonitor jvmPauseMonitor = null;
        if (config.jvmPauseMonitorToRun) {
            jvmPauseMonitor = new JvmPauseMonitor(config);
        }
        //实例化ZooKeeper舒服对象
        final ZooKeeperServer zkServer = new ZooKeeperServer(jvmPauseMonitor, txnLog, config.tickTime, config.minSessionTimeout, config.maxSessionTimeout, config.listenBacklog, null, config.initialConfig);
        //设置服务状态
        txnLog.setServerStats(zkServer.serverStats());
        //用来等待ZooKeeper暂停
        final CountDownLatch shutdownLatch = new CountDownLatch(1);
        //注册服务关闭处理器
        zkServer.registerServerShutdownHandler(new ZooKeeperServerShutdownHandler(shutdownLatch));
        //创建一个管理服务
        adminServer = AdminServerFactory.createAdminServer();
        //赋值ZooKeeper对象
        adminServer.setZooKeeperServer(zkServer);
        //启动管理服务（默认端口是8080），可以通过zookeeper.admin.serverPort进行端口配置，后续再做分析
        adminServer.start();
        boolean needStartZKServer = true;
        if (config.getClientPortAddress() != null) {
        //服务启动工厂默认是NIOServerCnxnFactory也可以通过参数zookeeper.serverCnxnFactory配置
            cnxnFactory = ServerCnxnFactory.createFactory();
            //设置配置信息
            cnxnFactory.configure(config.getClientPortAddress(), config.getMaxClientCnxns(), config.getClientPortListenBacklog(), false);
            //启动服务
            cnxnFactory.startup(zkServer);
            // zkServer has been started. So we don't need to start it again in secureCnxnFactory.
            needStartZKServer = false;
        }
        if (config.getSecureClientPortAddress() != null) {
            secureCnxnFactory = ServerCnxnFactory.createFactory();
            secureCnxnFactory.configure(config.getSecureClientPortAddress(), config.getMaxClientCnxns(), config.getClientPortListenBacklog(), true);
            secureCnxnFactory.startup(zkServer, needStartZKServer);
        }
       //容器管理对象
        containerManager = new ContainerManager(
            zkServer.getZKDatabase(),
            zkServer.firstProcessor,
            Integer.getInteger("znode.container.checkIntervalMs", (int) TimeUnit.MINUTES.toMillis(1)),
            Integer.getInteger("znode.container.maxPerMinute", 10000),
            Long.getLong("znode.container.maxNeverUsedIntervalMs", 0)
        );
        //启动容器管理
        containerManager.start();
        ZKAuditProvider.addZKStartStopAuditLog();
        //线程阻塞在这里，服务关闭
        shutdownLatch.await();
        shutdown();
        if (cnxnFactory != null) {
        //等待服务线程执行完毕
            cnxnFactory.join();
        }
        if (secureCnxnFactory != null) {
            secureCnxnFactory.join();
        }
        if (zkServer.canShutdown()) {
        //完全关闭
            zkServer.shutdown(true);
        }
    } catch (InterruptedException e) {
        // warn, but generally this is ok
        LOG.warn("Server interrupted", e);
    } finally {
        if (txnLog != null) {
            txnLog.close();
        }
        if (metricsProvider != null) {
            try {
                metricsProvider.stop();
            } catch (Throwable error) {
                LOG.warn("Error while stopping metrics", error);
            }
        }
    }
}
```

单从启动类看，启动逻辑简单，读取配置文件、启动管理者后台、启动ZooKeeper服务，使用CountDownLatch，使线程阻塞直到服务停止。

### 三、集群启动

集群模式下配置文件的解析是通过QuorumPeerConfig对象实现，之后也是调用runFromConfig(config)方法启动。

```java
public void runFromConfig(QuorumPeerConfig config) throws IOException, AdminServerException {
    final MetricsProvider metricsProvider;
    try {
        metricsProvider = MetricsProviderBootstrap.startMetricsProvider(
            config.getMetricsProviderClassName(),
            config.getMetricsProviderConfiguration());
    } catch (MetricsProviderLifeCycleException error) {
        throw new IOException("Cannot boot MetricsProvider " + config.getMetricsProviderClassName(), error);
    }
    try {
        ServerMetrics.metricsProviderInitialized(metricsProvider);
        ProviderRegistry.initialize();
        ServerCnxnFactory cnxnFactory = null;
        ServerCnxnFactory secureCnxnFactory = null;
        //创建启动工厂
        if (config.getClientPortAddress() != null) {
            cnxnFactory = ServerCnxnFactory.createFactory();
            cnxnFactory.configure(config.getClientPortAddress(), config.getMaxClientCnxns(), config.getClientPortListenBacklog(), false);
        }
        if (config.getSecureClientPortAddress() != null) {
            secureCnxnFactory = ServerCnxnFactory.createFactory();
            secureCnxnFactory.configure(config.getSecureClientPortAddress(), config.getMaxClientCnxns(), config.getClientPortListenBacklog(), true);
        }
       //集群启动是通过QuorumPeer实例实现，如下都是设置配置信息
        quorumPeer = getQuorumPeer();
        quorumPeer.setTxnFactory(new FileTxnSnapLog(config.getDataLogDir(), config.getDataDir()));
        quorumPeer.enableLocalSessions(config.areLocalSessionsEnabled());
        quorumPeer.enableLocalSessionsUpgrading(config.isLocalSessionsUpgradingEnabled());
        //quorumPeer.setQuorumPeers(config.getAllMembers());
        quorumPeer.setElectionType(config.getElectionAlg());
        quorumPeer.setMyid(config.getServerId());
        quorumPeer.setTickTime(config.getTickTime());
        quorumPeer.setMinSessionTimeout(config.getMinSessionTimeout());
        quorumPeer.setMaxSessionTimeout(config.getMaxSessionTimeout());
        quorumPeer.setInitLimit(config.getInitLimit());
        quorumPeer.setSyncLimit(config.getSyncLimit());
        quorumPeer.setConnectToLearnerMasterLimit(config.getConnectToLearnerMasterLimit());
        quorumPeer.setObserverMasterPort(config.getObserverMasterPort());
        quorumPeer.setConfigFileName(config.getConfigFilename());
        quorumPeer.setClientPortListenBacklog(config.getClientPortListenBacklog());
        quorumPeer.setZKDatabase(new ZKDatabase(quorumPeer.getTxnFactory()));
        quorumPeer.setQuorumVerifier(config.getQuorumVerifier(), false);
        if (config.getLastSeenQuorumVerifier() != null) {
            quorumPeer.setLastSeenQuorumVerifier(config.getLastSeenQuorumVerifier(), false);
        }
        quorumPeer.initConfigInZKDatabase();
        quorumPeer.setCnxnFactory(cnxnFactory);
        quorumPeer.setSecureCnxnFactory(secureCnxnFactory);
        quorumPeer.setSslQuorum(config.isSslQuorum());
        quorumPeer.setUsePortUnification(config.shouldUsePortUnification());
        quorumPeer.setLearnerType(config.getPeerType());
        quorumPeer.setSyncEnabled(config.getSyncEnabled());
        quorumPeer.setQuorumListenOnAllIPs(config.getQuorumListenOnAllIPs());
        if (config.sslQuorumReloadCertFiles) {
            quorumPeer.getX509Util().enableCertFileReloading();
        }
        quorumPeer.setMultiAddressEnabled(config.isMultiAddressEnabled());
        quorumPeer.setMultiAddressReachabilityCheckEnabled(config.isMultiAddressReachabilityCheckEnabled());
        quorumPeer.setMultiAddressReachabilityCheckTimeoutMs(config.getMultiAddressReachabilityCheckTimeoutMs());
        // sets quorum sasl authentication configurations
        quorumPeer.setQuorumSaslEnabled(config.quorumEnableSasl);
        if (quorumPeer.isQuorumSaslAuthEnabled()) {
            quorumPeer.setQuorumServerSaslRequired(config.quorumServerRequireSasl);
            quorumPeer.setQuorumLearnerSaslRequired(config.quorumLearnerRequireSasl);
            quorumPeer.setQuorumServicePrincipal(config.quorumServicePrincipal);
            quorumPeer.setQuorumServerLoginContext(config.quorumServerLoginContext);
            quorumPeer.setQuorumLearnerLoginContext(config.quorumLearnerLoginContext);
        }
        quorumPeer.setQuorumCnxnThreadsSize(config.quorumCnxnThreadsSize);
        quorumPeer.initialize();
        if (config.jvmPauseMonitorToRun) {
            quorumPeer.setJvmPauseMonitor(new JvmPauseMonitor(config));
        }
        //启动服务
        quorumPeer.start();
        ZKAuditProvider.addZKStartStopAuditLog();
        //线程阻塞直到服务关闭
        quorumPeer.join();
    } catch (InterruptedException e) {
        // warn, but generally this is ok
        LOG.warn("Quorum Peer interrupted", e);
    } finally {
        try {
            metricsProvider.stop();
        } catch (Throwable error) {
            LOG.warn("Error while stopping metrics", error);
        }
    }
}
```

集群模式下是交给了QuorumPeer对象启动。

### 四、总结

不管是单机还是集群，以上都只是简单介绍了启动入口方法，实际的启动过程、以及底层的工作原理还需进一步分析，后续我们将从单机启动和集群启动来分别分析。

以上，有任何不对的地方，请留言指正，敬请谅解。
