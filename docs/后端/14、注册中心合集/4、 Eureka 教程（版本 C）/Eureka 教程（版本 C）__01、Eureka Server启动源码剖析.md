# 01、Eureka Server启动源码剖析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-3/1.html
- 分类：注册中心
- 分组：Eureka 教程（版本 C）
## eureka-server的启动原理

eureka-server是一个web工程，通过web.xml中配置的``标签启动，也就是ServletContextListener的实现类EurekaBootStrap。

```java
@Override
public void contextInitialized(ServletContextEvent event) {
    try {
        initEurekaEnvironment();
        initEurekaServerContext();
        ServletContext sc = event.getServletContext();
        sc.setAttribute(EurekaServerContext.class.getName(), serverContext);
    } catch (Throwable e) {
        logger.error("Cannot bootstrap eureka server :", e);
        throw new RuntimeException("Cannot bootstrap eureka server :", e);
    }
}
```

## 阅读initEurekaServerContext()方法

```java
protected void initEurekaServerContext() throws Exception {
    // 省略 ......
    if (eurekaClient == null) {
        // 省略......
        // 发送心跳，抓取服务列表,并注册
        eurekaClient = new DiscoveryClient(applicationInfoManager, eurekaClientConfig);
    } else {
        applicationInfoManager = eurekaClient.getApplicationInfoManager();
    }
    PeerAwareInstanceRegistry registry;
    if (isAws(applicationInfoManager.getInfo())) {
        // 省略......
    } else {
        // 初始化心跳间隔
        registry = new PeerAwareInstanceRegistryImpl(
                eurekaServerConfig,
                eurekaClient.getEurekaClientConfig(),
                serverCodecs,
                eurekaClient
        );
    }
    PeerEurekaNodes peerEurekaNodes = getPeerEurekaNodes(
            registry,
            eurekaServerConfig,
            eurekaClient.getEurekaClientConfig(),
            serverCodecs,
            applicationInfoManager
    );
    serverContext = new DefaultEurekaServerContext(
            eurekaServerConfig,
            serverCodecs,
            registry,
            peerEurekaNodes,
            applicationInfoManager
    );
    EurekaServerContextHolder.initialize(serverContext);
    // 初始化ResponseCache
    serverContext.initialize();
    logger.info("Initialized server context");
    // Copy registry from neighboring eureka node
    int registryCount = registry.syncUp();
    // 启用自动感知故障调度任务
    registry.openForTraffic(applicationInfoManager, registryCount);
    // Register all monitoring statistics.
    EurekaMonitors.registerAllStats();
}
```

## 1、DiscoveryClient构造方法

```java
@Inject
    DiscoveryClient(ApplicationInfoManager applicationInfoManager, EurekaClientConfig config, AbstractDiscoveryClientOptionalArgs args,
                    Provider<BackupRegistry> backupRegistryProvider) {
    //省略 ......
     try {
            // default size of 2 - 1 each for heartbeat and cacheRefresh
            scheduler = Executors.newScheduledThreadPool(2,
                    new ThreadFactoryBuilder()
                            .setNameFormat("DiscoveryClient-%d")
                            .setDaemon(true)
                            .build());
            // 发送心跳的调度线程池
            heartbeatExecutor = new ThreadPoolExecutor(
                    1, clientConfig.getHeartbeatExecutorThreadPoolSize(), 0, TimeUnit.SECONDS,
                    new SynchronousQueue<Runnable>(),
                    new ThreadFactoryBuilder()
                            .setNameFormat("DiscoveryClient-HeartbeatExecutor-%d")
                            .setDaemon(true)
                            .build()
            );  // use direct handoff
            // 注册表抓取缓存调度线程池
            cacheRefreshExecutor = new ThreadPoolExecutor(
                    1, clientConfig.getCacheRefreshExecutorThreadPoolSize(), 0, TimeUnit.SECONDS,
                    new SynchronousQueue<Runnable>(),
                    new ThreadFactoryBuilder()
                            .setNameFormat("DiscoveryClient-CacheRefreshExecutor-%d")
                            .setDaemon(true)
                            .build()
            );  // use direct handoff
           // 省略 ......
        } catch (Throwable e) {
            throw new RuntimeException("Failed to initialize DiscoveryClient!", e);
        }
    // 抓取注册表
    if (clientConfig.shouldFetchRegistry() && !fetchRegistry(false)) {
        fetchRegistryFromBackup();
    }
    // call and execute the pre registration handler before all background tasks (inc registration) is started
   if (this.preRegistrationHandler != null) {
       this.preRegistrationHandler.beforeRegistration();
    }
    // 初始化调度任务
    initScheduledTasks();
}
```

抓取注册表会在以后文章单独剖析，先看initScheduledTasks()方法。

## 2、initScheduledTasks()方法

```java
private void initScheduledTasks() {
    if (clientConfig.shouldFetchRegistry()) {
        // 省略......
        // 拉取注册表（全量/增量）
        scheduler.schedule(
                new TimedSupervisorTask(
                        "cacheRefresh",
                        scheduler,
                        cacheRefreshExecutor,
                        registryFetchIntervalSeconds,
                        TimeUnit.SECONDS,
                        expBackOffBound,
                        new CacheRefreshThread()
                ),
                registryFetchIntervalSeconds, TimeUnit.SECONDS);
    }
    if (clientConfig.shouldRegisterWithEureka()) {
        int renewalIntervalInSecs = instanceInfo.getLeaseInfo().getRenewalIntervalInSecs();
        int expBackOffBound = clientConfig.getHeartbeatExecutorExponentialBackOffBound();
        logger.info("Starting heartbeat executor: " + "renew interval is: " + renewalIntervalInSecs);
        // 发送心跳
        scheduler.schedule(
                new TimedSupervisorTask(
                        "heartbeat",
                        scheduler,
                        heartbeatExecutor,
                        renewalIntervalInSecs,
                        TimeUnit.SECONDS,
                        expBackOffBound,
                        new HeartbeatThread()
                ),
                renewalIntervalInSecs, TimeUnit.SECONDS);
        // InstanceInfo replicator
        instanceInfoReplicator = new InstanceInfoReplicator(
                this,
                instanceInfo,
                clientConfig.getInstanceInfoReplicationIntervalSeconds(),
                2); // burstSize
        // 省略......
        // 进行注册
        instanceInfoReplicator.start(clientConfig.getInitialInstanceInfoReplicationIntervalSeconds());
    } else {
        logger.info("Not registering with Eureka server per configuration");
    }
}
```

抓取注册表，发送心跳，服务注册先不做分析，以后单独文章进行剖析。

返回到initEurekaServerContext()方法，跳到

```java
// 省略......
registry = new PeerAwareInstanceRegistryImpl(
            eurekaServerConfig,
            eurekaClient.getEurekaClientConfig(),
            serverCodecs,
            eurekaClient
    );
// 省略......
```

## 3、初始化心跳间隔

```java
@Inject
public PeerAwareInstanceRegistryImpl(
        EurekaServerConfig serverConfig,
        EurekaClientConfig clientConfig,
        ServerCodecs serverCodecs,
        EurekaClient eurekaClient
) {
    super(serverConfig, clientConfig, serverCodecs);
    this.eurekaClient = eurekaClient;
    // 初始化心跳间隔
    this.numberOfReplicationsLastMin = new MeasuredRate(1000 * 60 * 1);
    // We first check if the instance is STARTING or DOWN, then we check explicit overrides,
    // then we check the status of a potentially existing lease.
    this.instanceStatusOverrideRule = new FirstMatchWinsCompositeRule(new DownOrStartingRule(),
            new OverrideExistsRule(overriddenInstanceStatusMap), new LeaseExistsRule());
}
```

返回到initEurekaServerContext()方法，跳到

```java
// 省略......
// 初始化ResponseCache
serverContext.initialize();
logger.info("Initialized server context");
// 省略......
```

## 4、初始化eureka集群节点

```java
@PostConstruct
@Override
public void initialize() throws Exception {
    logger.info("Initializing ...");
    // 初始化peerEurekaNodes
    peerEurekaNodes.start();
    // 开启心跳定时任务，两级缓存刷新任务，计算集群节点启用自动保护机制的节点数量任务
    registry.init(peerEurekaNodes);
    logger.info("Initialized");
}
```

start() 方法

```java
public void start() {
    // 省略......
    try {
        // 创建集群中的peer节点
        updatePeerEurekaNodes(resolvePeerUrls());
        Runnable peersUpdateTask = new Runnable() {
            @Override
            public void run() {
                try {
                    updatePeerEurekaNodes(resolvePeerUrls());
                } catch (Throwable e) {
                    logger.error("Cannot update the replica Nodes", e);
                }
            }
        };
        taskExecutor.scheduleWithFixedDelay(
                peersUpdateTask,
                serverConfig.getPeerEurekaNodesUpdateIntervalMs(),
                serverConfig.getPeerEurekaNodesUpdateIntervalMs(),
                TimeUnit.MILLISECONDS
        );
    } catch (Exception e) {
        throw new IllegalStateException(e);
    }
    for (PeerEurekaNode node : peerEurekaNodes) {
        logger.info("Replica node URL:  " + node.getServiceUrl());
    }
}
```

`updatePeerEurekaNodes(List newPeerUrls)`方法

```java
 protected void updatePeerEurekaNodes(List<String> newPeerUrls) {
    // 省略......
    if (!toAdd.isEmpty()) {
        logger.info("Adding new peer nodes {}", toAdd);
        for (String peerUrl : toAdd) {
            // 创建集群节点批量同步调度任务
            newNodeList.add(createPeerEurekaNode(peerUrl));
        }
    }
    this.peerEurekaNodes = newNodeList;
    this.peerEurekaNodeUrls = new HashSet<>(newPeerUrls);
}
```

createPeerEurekaNode(String peerEurekaNodeUrl)方法

```java
protected PeerEurekaNode createPeerEurekaNode(String peerEurekaNodeUrl) {
    HttpReplicationClient replicationClient = JerseyReplicationClient.createReplicationClient(serverConfig, serverCodecs, peerEurekaNodeUrl);
    String targetHost = hostFromUrl(peerEurekaNodeUrl);
    if (targetHost == null) {
        targetHost = "host";
    }
    return new PeerEurekaNode(registry, targetHost, peerEurekaNodeUrl, replicationClient, serverConfig);
}
```

PeerEurekaNode 构造方法

```java
public PeerEurekaNode(PeerAwareInstanceRegistry registry, String targetHost, String serviceUrl, HttpReplicationClient replicationClient, EurekaServerConfig config) {
    this(registry, targetHost, serviceUrl, replicationClient, config, BATCH_SIZE, MAX_BATCHING_DELAY_MS, RETRY_SLEEP_TIME_MS, SERVER_UNAVAILABLE_SLEEP_TIME_MS);
}
/* For testing */ PeerEurekaNode(PeerAwareInstanceRegistry registry, String targetHost, String serviceUrl,
                                 HttpReplicationClient replicationClient, EurekaServerConfig config,
                                 int batchSize, long maxBatchingDelayMs,
                                 long retrySleepTimeMs, long serverUnavailableSleepTimeMs) {
    this.registry = registry;
    this.targetHost = targetHost;
    this.replicationClient = replicationClient;
    this.serviceUrl = serviceUrl;
    this.config = config;
    this.maxProcessingDelayMs = config.getMaxTimeForReplication();
    String batcherName = getBatcherName();
    ReplicationTaskProcessor taskProcessor = new ReplicationTaskProcessor(targetHost, replicationClient);
    this.batchingDispatcher = TaskDispatchers.createBatchingTaskDispatcher(
            batcherName,
            config.getMaxElementsInPeerReplicationPool(),
            batchSize,
            config.getMaxThreadsForPeerReplication(),
            maxBatchingDelayMs,
            serverUnavailableSleepTimeMs,
            retrySleepTimeMs,
            taskProcessor
    );
    this.nonBatchingDispatcher = TaskDispatchers.createNonBatchingTaskDispatcher(
            targetHost,
            config.getMaxElementsInStatusReplicationPool(),
            config.getMaxThreadsForStatusReplication(),
            maxBatchingDelayMs,
            serverUnavailableSleepTimeMs,
            retrySleepTimeMs,
            taskProcessor
    );
}
```

PeerEurekaNode 构造方法将会创建eureka集群节点间同步的批量定时任务，此处不再继续往下阅读，会在以后的ereka基于3层队列批处理同步其它节点服务实例的时候剖析。

回到serverContext.initialize()方法，进入registry.init(peerEurekaNodes)方法。

## 5、开启多级缓存

```java
@Override
public void init(PeerEurekaNodes peerEurekaNodes) throws Exception {
    // 心跳计数
    this.numberOfReplicationsLastMin.start();
    this.peerEurekaNodes = peerEurekaNodes;
    // 初始化多级缓存
    initializedResponseCache();
    // 每15分钟更新一次续约实例的实际数量和启用自我保护机制阀值
    scheduleRenewalThresholdUpdateTask();
    initRemoteRegionRegistry();
    try {
        Monitors.registerObject(this);
    } catch (Throwable e) {
        logger.warn("Cannot register the JMX monitor for the InstanceRegistry :", e);
    }
}
```

回到initEurekaServerContext()方法，进入registry.openForTraffic(applicationInfoManager, registryCount)方法。

## 6、自动感知故障，摘除故障实例

```java
@Override
public void openForTraffic(ApplicationInfoManager applicationInfoManager, int count) {
    //省略.....
    // 将自己设置为UP
    applicationInfoManager.setInstanceStatus(InstanceStatus.UP);
    // 服务实例摘除任务
    super.postInit();
}
```

```java
postInit() 方法
```

```java
 protected void postInit() {
    renewsLastMin.start();
    if (evictionTaskRef.get() != null) {
        evictionTaskRef.get().cancel();
    }
    evictionTaskRef.set(new EvictionTask());
    evictionTimer.schedule(evictionTaskRef.get(),
            serverConfig.getEvictionIntervalTimerInMs(),
            serverConfig.getEvictionIntervalTimerInMs());
}
```

此处不知道evictionTaskRef为什么要做线程安全，有明白的道友可以评论，感激不尽。

真正调用的是EvictionTask的run()方法

```java
@Override
public void run() {
    try {
        long compensationTimeMs = getCompensationTimeMs();
        logger.info("Running the evict task with compensationTime {}ms", compensationTimeMs);
        evict(compensationTimeMs);
    } catch (Throwable e) {
        logger.error("Could not run the evict task", e);
    }
}
```

evict(compensationTimeMs)方法

```java
public void evict(long additionalLeaseMs) {
    // 省略......
    // the impact should be evenly distributed across all applications.
    List<Lease<InstanceInfo>> expiredLeases = new ArrayList<>();
    for (Entry<String, Map<String, Lease<InstanceInfo>>> groupEntry : registry.entrySet()) {
        Map<String, Lease<InstanceInfo>> leaseMap = groupEntry.getValue();
        if (leaseMap != null) {
            for (Entry<String, Lease<InstanceInfo>> leaseEntry : leaseMap.entrySet()) {
                Lease<InstanceInfo> lease = leaseEntry.getValue();
                // 过期条件
                if (lease.isExpired(additionalLeaseMs) && lease.getHolder() != null) {
                    expiredLeases.add(lease);
                }
            }
        }
    }
    // To compensate for GC pauses or drifting local time, we need to use current registry size as a base for
    // triggering self-preservation. Without that we would wipe out full registry.
    int registrySize = (int) getLocalRegistrySize();
    int registrySizeThreshold = (int) (registrySize * serverConfig.getRenewalPercentThreshold());
    int evictionLimit = registrySize - registrySizeThreshold;
    int toEvict = Math.min(expiredLeases.size(), evictionLimit);
    if (toEvict > 0) {
        logger.info("Evicting {} items (expired={}, evictionLimit={})", toEvict, expiredLeases.size(), evictionLimit);
        Random random = new Random(System.currentTimeMillis());
        for (int i = 0; i < toEvict; i++) {
            // Pick a random item (Knuth shuffle algorithm)
            // 随机摘除服务实例
            int next = i + random.nextInt(expiredLeases.size() - i);
            Collections.swap(expiredLeases, i, next);
            Lease<InstanceInfo> lease = expiredLeases.get(i);
            String appName = lease.getHolder().getAppName();
            String id = lease.getHolder().getId();
            EXPIRED.increment();
            logger.warn("DS: Registry: expired lease for {}/{}", appName, id);
            internalCancel(appName, id, false);
        }
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/manongxx/category_10951792.html
