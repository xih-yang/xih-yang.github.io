# 02、Eureka 服务注册剖析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-3/2.html
- 分类：注册中心
- 分组：Eureka 教程（版本 C）
## Eureka-Client

先看DisconveryClient构造方法。

```java
    @Inject
    DiscoveryClient(ApplicationInfoManager applicationInfoManager, EurekaClientConfig config, AbstractDiscoveryClientOptionalArgs args,
                    Provider<BackupRegistry> backupRegistryProvider) {
        // 省略......
        // 初始化调度任务
        initScheduledTasks();
        // 省略.....
    }
```

initScheduledTasks()方法

```java
        private void initScheduledTasks() {
            // 省略 ......
            // InstanceInfo replicator
            instanceInfoReplicator = new InstanceInfoReplicator(
                    this,
                    instanceInfo,
                    clientConfig.getInstanceInfoReplicationIntervalSeconds(),
                    2); // burstSize
            statusChangeListener = new ApplicationInfoManager.StatusChangeListener() {
                @Override
                public String getId() {
                    return "statusChangeListener";
                }
                @Override
                public void notify(StatusChangeEvent statusChangeEvent) {
                    if (InstanceStatus.DOWN == statusChangeEvent.getStatus() ||
                            InstanceStatus.DOWN == statusChangeEvent.getPreviousStatus()) {
                        // log at warn level if DOWN was involved
                        logger.warn("Saw local status change event {}", statusChangeEvent);
                    } else {
                        logger.info("Saw local status change event {}", statusChangeEvent);
                    }
                    instanceInfoReplicator.onDemandUpdate();
                }
            };
            if (clientConfig.shouldOnDemandUpdateStatusChange()) {
                applicationInfoManager.registerStatusChangeListener(statusChangeListener);
            }
            // 进行注册
            instanceInfoReplicator.start(clientConfig.getInitialInstanceInfoReplicationIntervalSeconds());
        } else {
            logger.info("Not registering with Eureka server per configuration");
        }
```

start(int initialDelayMs)

```java
public void start(int initialDelayMs) {
    if (started.compareAndSet(false, true)) {
        instanceInfo.setIsDirty();  // for initial register
        Future next = scheduler.schedule(this, initialDelayMs, TimeUnit.SECONDS);
        scheduledPeriodicRef.set(next);
    }
}
```

又是一个定时任务，会延迟40s执行，但是在springCloud中会直接触发，不会延时。

进入InstanceInfoReplicator的run()方法

```java
     public void run() {
        try {
            discoveryClient.refreshInstanceInfo();
            Long dirtyTimestamp = instanceInfo.isDirtyWithTime();
            if (dirtyTimestamp != null) {
                // 注册
                discoveryClient.register();
                instanceInfo.unsetIsDirty(dirtyTimestamp);
            }
        } catch (Throwable t) {
            logger.warn("There was a problem with the instance info replicator", t);
        } finally {
            Future next = scheduler.schedule(this, replicationIntervalSeconds, TimeUnit.SECONDS);
            scheduledPeriodicRef.set(next);
        }
    }
```

进入register()方法

```java
 boolean register() throws Throwable {
    logger.info(PREFIX + appPathIdentifier + ": registering service...");
    EurekaHttpResponse<Void> httpResponse;
    try {
        httpResponse = eurekaTransport.registrationClient.register(instanceInfo);
    } catch (Exception e) {
        logger.warn("{} - registration failed {}", PREFIX + appPathIdentifier, e.getMessage(), e);
        throw e;
    }
    if (logger.isInfoEnabled()) {
        logger.info("{} - registration status: {}", PREFIX + appPathIdentifier, httpResponse.getStatusCode());
    }
    return httpResponse.getStatusCode() == 204;
}
```

这个方法实际就是发送http请求，它是通过jersey2框架进行调用的。

## Eureka-Server

eureka-server的实现是在eureka-core工程下的ApplicationResource的addInstance(InstanceInfo info,@HeaderParam(PeerEurekaNode.HEADER_REPLICATION) String isReplication)方法。

进入addInstance(InstanceInfo info,@HeaderParam(PeerEurekaNode.HEADER_REPLICATION) String isReplication)方法

```java
@POST
@Consumes({"application/json", "application/xml"})
public Response addInstance(InstanceInfo info,
                            @HeaderParam(PeerEurekaNode.HEADER_REPLICATION) String isReplication) {
    // 省略......
    registry.register(info, "true".equals(isReplication));
    return Response.status(204).build();  // 204 to be backwards compatible
}
```

进入register(final InstanceInfo info, final boolean isReplication)方法

```java
@Override
public void register(final InstanceInfo info, final boolean isReplication) {
    int leaseDuration = Lease.DEFAULT_DURATION_IN_SECS;
    if (info.getLeaseInfo() != null && info.getLeaseInfo().getDurationInSecs() > 0) {
        leaseDuration = info.getLeaseInfo().getDurationInSecs();
    }
    // 服务实例注册
    super.register(info, leaseDuration, isReplication);
    // 集群间实例同步
    replicateToPeers(Action.Register, info.getAppName(), info.getId(), info, null, isReplication);
}
```

实际调用的是父类的register方法

进入register(InstanceInfo registrant, int leaseDuration, boolean isReplication)方法

```java
public void register(InstanceInfo registrant, int leaseDuration, boolean isReplication) {
try {
    read.lock();
    Map<String, Lease<InstanceInfo>> gMap = registry.get(registrant.getAppName());
    REGISTER.increment(isReplication);
    if (gMap == null) {
        final ConcurrentHashMap<String, Lease<InstanceInfo>> gNewMap = new ConcurrentHashMap<String, Lease<InstanceInfo>>();
        gMap = registry.putIfAbsent(registrant.getAppName(), gNewMap);
        if (gMap == null) {
            gMap = gNewMap;
        }
    }
    Lease<InstanceInfo> existingLease = gMap.get(registrant.getId());
    // 这种情况可能出现于，服务重启，先前的服务实例还没有下线
    if (existingLease != null && (existingLease.getHolder() != null)) {
        Long existingLastDirtyTimestamp = existingLease.getHolder().getLastDirtyTimestamp();
        Long registrationLastDirtyTimestamp = registrant.getLastDirtyTimestamp();
        logger.debug("Existing lease found (existing={}, provided={}", existingLastDirtyTimestamp, registrationLastDirtyTimestamp);
        // 这种情况发生于节点间的同步，该节点的服务实例被重新注册，旧的服务实例被同步过来
        if (existingLastDirtyTimestamp > registrationLastDirtyTimestamp) {
            logger.warn("There is an existing lease and the existing lease's dirty timestamp {} is greater" +
                    " than the one that is being registered {}", existingLastDirtyTimestamp, registrationLastDirtyTimestamp);
            logger.warn("Using the existing instanceInfo instead of the new instanceInfo as the registrant");
            registrant = existingLease.getHolder();
        }
    } else {
        // 一个新的服务实例注册
        synchronized (lock) {
            if (this.expectedNumberOfRenewsPerMin > 0) {
                // 自我保护机制触发条件
                this.expectedNumberOfRenewsPerMin = this.expectedNumberOfRenewsPerMin + 2;
                this.numberOfRenewsPerMinThreshold =
                        (int) (this.expectedNumberOfRenewsPerMin * serverConfig.getRenewalPercentThreshold());
            }
        }
        logger.debug("No previous lease information found; it is new registration");
    }
    Lease<InstanceInfo> lease = new Lease<InstanceInfo>(registrant, leaseDuration);
    if (existingLease != null) {
        lease.setServiceUpTimestamp(existingLease.getServiceUpTimestamp());
    }
    // 加入到服务实例容器中
    gMap.put(registrant.getId(), lease);
    synchronized (recentRegisteredQueue) {
        recentRegisteredQueue.add(new Pair<Long, String>(
                System.currentTimeMillis(),
                registrant.getAppName() + "(" + registrant.getId() + ")"));
    }
    if (!InstanceStatus.UNKNOWN.equals(registrant.getOverriddenStatus())) {
        logger.debug("Found overridden status {} for instance {}. Checking to see if needs to be add to the "
                        + "overrides", registrant.getOverriddenStatus(), registrant.getId());
        if (!overriddenInstanceStatusMap.containsKey(registrant.getId())) {
            logger.info("Not found overridden id {} and hence adding it", registrant.getId());
            overriddenInstanceStatusMap.put(registrant.getId(), registrant.getOverriddenStatus());
        }
    }
    InstanceStatus overriddenStatusFromMap = overriddenInstanceStatusMap.get(registrant.getId());
    if (overriddenStatusFromMap != null) {
        logger.info("Storing overridden status {} from map", overriddenStatusFromMap);
        registrant.setOverriddenStatus(overriddenStatusFromMap);
    }
    InstanceStatus overriddenInstanceStatus = getOverriddenInstanceStatus(registrant, existingLease, isReplication);
    registrant.setStatusWithoutDirty(overriddenInstanceStatus);
    if (InstanceStatus.UP.equals(registrant.getStatus())) {
        lease.serviceUp();
    }
    registrant.setActionType(ActionType.ADDED);
    // 添加到更新队列中，用于增量抓取注册表
    recentlyChangedQueue.add(new RecentlyChangedItem(lease));
    registrant.setLastUpdatedTimestamp();
    invalidateCache(registrant.getAppName(), registrant.getVIPAddress(), registrant.getSecureVipAddress());
    logger.info("Registered instance {}/{} with status {} (replication={})",
            registrant.getAppName(), registrant.getId(), registrant.getStatus(), isReplication);
    } finally {
        read.unlock();
    }
}
```

这里用到了读写锁的读锁，而增量拉取注册表的方法用到了写锁，这块用读锁的原因是方法内部是一个线程安全的操作并且数据结构的操作也是一个线程安全的。

增量拉取注册表的方法要用写锁是因为对recentlyChangedQueue队列进行了遍历，并修改了里边的元素。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/manongxx/category_10951792.html
