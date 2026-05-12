# 06、Eureka 自我保护源码剖析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-3/6.html
- 分类：注册中心
- 分组：Eureka 教程（版本 C）
### Eureka-Server

进入EurekaBootStrap的initEurekaServerContext()方法

```java
protected void initEurekaServerContext() throws Exception {
    // 省略......
    // 初始化ResponseCache,心跳计数,自我保护阀值
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

进入initialize()方法

```java
@PostConstruct
@Override
public void initialize() throws Exception {
    logger.info("Initializing ...");
    // 初始化peerEurekaNodes
    peerEurekaNodes.start();
    registry.init(peerEurekaNodes);
    logger.info("Initialized");
}
```

进入init(PeerEurekaNodes peerEurekaNodes)方法

```java
@Override
public void init(PeerEurekaNodes peerEurekaNodes) throws Exception {
    // 心跳计数
    this.numberOfReplicationsLastMin.start();
    this.peerEurekaNodes = peerEurekaNodes;
    // 初始化多级缓存
    initializedResponseCache();
    // 每15分钟更新一次理论续约实例数量和启用自我保护机制阀值
    scheduleRenewalThresholdUpdateTask();
    initRemoteRegionRegistry();
    try {
        Monitors.registerObject(this);
    } catch (Throwable e) {
        logger.warn("Cannot register the JMX monitor for the InstanceRegistry :", e);
    }
}
```

进入scheduleRenewalThresholdUpdateTask()方法

```java
private void scheduleRenewalThresholdUpdateTask() {
    timer.schedule(new TimerTask() {
                       @Override
                       public void run() {
                           updateRenewalThreshold();
                       }
                   }, serverConfig.getRenewalThresholdUpdateIntervalMs(),
            serverConfig.getRenewalThresholdUpdateIntervalMs());
}
```

每隔15分钟触发一次

进入updateRenewalThreshold()方法

```java
private void updateRenewalThreshold() {
    try {
        Applications apps = eurekaClient.getApplications();
        int count = 0;
        for (Application app : apps.getRegisteredApplications()) {
            for (InstanceInfo instance : app.getInstances()) {
                if (this.isRegisterable(instance)) {
                    ++count;
                }
            }
        }
        synchronized (lock) {
            // Update threshold only if the threshold is greater than the
            // current expected threshold of if the self preservation is disabled.
            if ((count * 2) > (serverConfig.getRenewalPercentThreshold() * numberOfRenewsPerMinThreshold)
                    || (!this.isSelfPreservationModeEnabled())) {
                this.expectedNumberOfRenewsPerMin = count * 2;
                this.numberOfRenewsPerMinThreshold = (int) ((count * 2) * serverConfig.getRenewalPercentThreshold());
            }
        }
        logger.info("Current renewal threshold is : {}", numberOfRenewsPerMinThreshold);
    } catch (Throwable e) {
        logger.error("Cannot update renewal threshold", e);
    }
}
```

```java
RenewalPercentThreshold默认为0.85
```

进入AbstractInstanceRegistry.evict(long additionalLeaseMs) 方法

```java
public void evict(long additionalLeaseMs) {
    logger.debug("Running the evict task");
    if (!isLeaseExpirationEnabled()) {
        logger.debug("DS: lease expiration is currently disabled.");
        return;
    }
    // 省略......
}
```

进入isLeaseExpirationEnabled() 方法

```java
@Override
public boolean isLeaseExpirationEnabled() {
    if (!isSelfPreservationModeEnabled()) {
        // The self preservation mode is disabled, hence allowing the instances to expire.
        return true;
    }
    return numberOfRenewsPerMinThreshold > 0 && getNumOfRenewsInLastMin() > numberOfRenewsPerMinThreshold;
}
```

numberOfRenewsPerMinThreshold = 本地注册服务实例 * 2 * 0.85，如果上一次的心跳小于启用自我保护的阀值，那就启用自我保护，不摘除服务实例。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/manongxx/category_10951792.html
