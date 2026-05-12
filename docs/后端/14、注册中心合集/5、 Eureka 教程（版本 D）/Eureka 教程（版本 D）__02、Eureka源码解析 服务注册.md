# 02、Eureka源码解析 服务注册
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-4/2.html
- 分类：注册中心
- 分组：Eureka 教程（版本 D）
## Eureka服务注册

- EurekaClient在启动时会进行一系列初始化操作，本篇文章主要解析EurekaClient端向EurekaServer端发起注册请求的具体过程，具体分为EurekaClient端发送请求和EurekaServer端接收请求。本文基于https://github.com/Netflix/eureka上的master分支。最近在github上fork了一下eureka项目，更详细的注释可以去我的git上看：https://github.com/qiuyangli/eureka

## EurekaClient端发送请求

- 第一次向注册EurekaServer端发起注册发生在EurekaClient端初始化的时候，在DiscoveryClient的构造方法的这段代码调用了register()方法进行注册，代码如下：

```java
if (clientConfig.shouldRegisterWithEureka() && clientConfig.shouldEnforceRegistrationAtInit()) {
    try {
        // 发起一次注册操作
        if (!register() ) {
            // 启动时向EurekaServer注册失败
            throw new IllegalStateException("Registration error at startup. Invalid server response.");
        }
    } catch (Throwable th) {
        logger.error("Registration error at startup: {}", th.getMessage());
        throw new IllegalStateException(th);
    }
}
```

- 之后向EurekaServer端发起注册操作就是实例信息发生改变的时候，从DiscoveryClient中initScheduledTasks方法的instanceInfoReplicator = new InstanceInfoReplicator()这行代码创建实例信息复制器开始：

```java
// InstanceInfo replicator
// 创建实例信息复制器，其实InstanceInfoReplicator继承了Runnable
// 详细操作看一下其中的run()方法，定时进行注册/刷新操作
instanceInfoReplicator = new InstanceInfoReplicator(
    this,
    instanceInfo,
    // 默认30秒
    clientConfig.getInstanceInfoReplicationIntervalSeconds(),
    2); // burstSize
```

- 既然InstanceInfoReplicator实现了Runnable，那么看一下run()方法，在run()方法中的discoveryClient.register()这一行向EurekaServer发起了注册请求，具体代码如下：

```java
public void run() {
    try {
        // 定时刷新实例信息
        discoveryClient.refreshInstanceInfo();
        // 判断实例信息是否发生改变
        // isInstanceInfoDirty默认为false，实例信息发生改变时会被设为true
        // 被设为ture，则dirtyTimestamp不为null，则发起注册请求
        Long dirtyTimestamp = instanceInfo.isDirtyWithTime();
        if (dirtyTimestamp != null) {
            // 向EurekaServer注册
            discoveryClient.register();
            instanceInfo.unsetIsDirty(dirtyTimestamp);
        }
    } catch (Throwable t) {
        logger.warn("There was a problem with the instance info replicator", t);
    } finally {
        // 定时执行本段逻辑
        Future next = scheduler.schedule(this, replicationIntervalSeconds, TimeUnit.SECONDS);
        scheduledPeriodicRef.set(next);
    }
}
```

- register方法如下：

```java
// 注册
boolean register() throws Throwable {
    logger.info(PREFIX + "{}: registering service...", appPathIdentifier);
    EurekaHttpResponse<Void> httpResponse;
    try {
        // EurekaClient调用EurekaServer
        // 通过AbstractJerseyEurekaHttpClient-register(instanceInfo)进行封装
        // 调用到eureka-core包下的ApplicationResource-addInstance方法进行注册
        httpResponse = eurekaTransport.registrationClient.register(instanceInfo);
    } catch (Exception e) {
        logger.warn(PREFIX + "{} - registration failed {}", appPathIdentifier, e.getMessage(), e);
        throw e;
    }
    if (logger.isInfoEnabled()) {
        logger.info(PREFIX + "{} - registration status: {}", appPathIdentifier, httpResponse.getStatusCode());
    }
    return httpResponse.getStatusCode() == 204;
}
```

## EurekaServer端接收请求

- EurekaServer接收注册请求涉及到的代码比较多，接收EurekaClient端请求的入口代码是eureka-core包下ApplicationResource-addInstance这个方法
- 法，
- 具体代码如下：

```java
@POST
@Consumes({"application/json", "application/xml"})
// 注册实例到EurekaServer
public Response addInstance(InstanceInfo info,
                            @HeaderParam(PeerEurekaNode.HEADER_REPLICATION) String isReplication) {
    logger.debug("Registering instance {} (replication={})", info.getId(), isReplication);
    // validate that the instanceinfo contains all the necessary required fields
    // 参数校验
    if (isBlank(info.getId())) {
        return Response.status(400).entity("Missing instanceId").build();
    } else if (isBlank(info.getHostName())) {
        return Response.status(400).entity("Missing hostname").build();
    } else if (isBlank(info.getIPAddr())) {
        return Response.status(400).entity("Missing ip address").build();
    } else if (isBlank(info.getAppName())) {
        return Response.status(400).entity("Missing appName").build();
    } else if (!appName.equals(info.getAppName())) {
        return Response.status(400).entity("Mismatched appName, expecting " + appName + " but was " + info.getAppName()).build();
    } else if (info.getDataCenterInfo() == null) {
        return Response.status(400).entity("Missing dataCenterInfo").build();
    } else if (info.getDataCenterInfo().getName() == null) {
        return Response.status(400).entity("Missing dataCenterInfo Name").build();
    }
    // handle cases where clients may be registering with bad DataCenterInfo with missing data
    DataCenterInfo dataCenterInfo = info.getDataCenterInfo();
    if (dataCenterInfo instanceof UniqueIdentifier) {
        String dataCenterInfoId = ((UniqueIdentifier) dataCenterInfo).getId();
        if (isBlank(dataCenterInfoId)) {
            boolean experimental = "true".equalsIgnoreCase(serverConfig.getExperimental("registration.validation.dataCenterInfoId"));
            if (experimental) {
                String entity = "DataCenterInfo of type " + dataCenterInfo.getClass() + " must contain a valid id";
                return Response.status(400).entity(entity).build();
            } else if (dataCenterInfo instanceof AmazonInfo) {
                AmazonInfo amazonInfo = (AmazonInfo) dataCenterInfo;
                String effectiveId = amazonInfo.get(AmazonInfo.MetaDataKey.instanceId);
                if (effectiveId == null) {
                    amazonInfo.getMetadata().put(AmazonInfo.MetaDataKey.instanceId.getName(), info.getId());
                }
            } else {
                logger.warn("Registering DataCenterInfo of type {} without an appropriate id", dataCenterInfo.getClass());
            }
        }
    }
    // 进行注册并判断是否向其他EurekaServer节点进行注册信息传播
    // EurekaServer既可以是同步信息操作的发起者也可以是同步信息请求的接收者
    // isReplication为false的时候，为第一次请求，不向其他EurekaServer节点同步信息
    // isReplication为true的时候，为其他EurekaServer节点向当前节发起同步信息请求
    // 不过debug进去目测isReplication为null。。。
    registry.register(info, "true".equals(isReplication));
    return Response.status(204).build();  // 204 to be backwards compatible
}
```

- 之后进入PeerAwareInstanceRegistryImpl-register(info, isReplication)这个方法，主要涉及信息注册和信息注册后同步到其他节点这两个操作

```java
@Override
public void register(final InstanceInfo info, final boolean isReplication) {
    // 默认租约有效时间为90秒
    int leaseDuration = Lease.DEFAULT_DURATION_IN_SECS;
    // 自己设置的租约有效时间
    if (info.getLeaseInfo() != null && info.getLeaseInfo().getDurationInSecs() > 0) {
        leaseDuration = info.getLeaseInfo().getDurationInSecs();
    }
    // 注册
    super.register(info, leaseDuration, isReplication);
    // 注册信息复制到其他EurekaServer节点
    replicateToPeers(Action.Register, info.getAppName(), info.getId(), info, null, isReplication);
}
```

- 注册和同步信息的操作相对复杂，涉及的东西较多，部分较为细节的内容后面会有文章单独解析，下面是进行注册的代码：

```java
// 注册
public void register(InstanceInfo registrant, int leaseDuration, boolean isReplication) {
    try {
        read.lock();// 获取读锁
        // 根据实例名称获取租约信息
        // registry是ConcurrentHashMap<String, Map<String, Lease<InstanceInfo>>>存储结构
        // 由于同一名称的实例有可能有多个，所以registry的Key设计为实例的名称，具体的实例信息用Value里的Id区分
        // Key为实例集合的名称，Value是一个Map，Value的Key是实例的Id，Value的Value是实例的租约信息
        Map<String, Lease<InstanceInfo>> gMap = registry.get(registrant.getAppName());
        REGISTER.increment(isReplication);
        // 该集合名称下没有实例信息
        if (gMap == null) {
            final ConcurrentHashMap<String, Lease<InstanceInfo>> gNewMap = new ConcurrentHashMap<String, Lease<InstanceInfo>>();
            // 向实例集合中加入空的实例
            gMap = registry.putIfAbsent(registrant.getAppName(), gNewMap);
            if (gMap == null) {
                gMap = gNewMap;
            }
        }
        Lease<InstanceInfo> existingLease = gMap.get(registrant.getId());
        // Retain the last dirty timestamp without overwriting it, if there is already a lease
        // 租约存在
        if (existingLease != null && (existingLease.getHolder() != null)) {
             // 已存在实例信息的LastDirtyTimestamp
            Long existingLastDirtyTimestamp = existingLease.getHolder().getLastDirtyTimestamp();
            // 新传入的实例信息的LastDirtyTimestamp
            Long registrationLastDirtyTimestamp = registrant.getLastDirtyTimestamp();
            logger.debug("Existing lease found (existing={}, provided={}", existingLastDirtyTimestamp, registrationLastDirtyTimestamp);
            // this is a > instead of a >= because if the timestamps are equal, we still take the remote transmitted
            // InstanceInfo instead of the server local copy.
            // 如果EurekaServer端已存在实例信息且时间戳大于新传入实例信息中的时间戳，则用EurekaServer端的数据替换新传入的实例信息
            // 防止过期的实例信息注册到EurekaServer端
            if (existingLastDirtyTimestamp > registrationLastDirtyTimestamp) {
                logger.warn("There is an existing lease and the existing lease's dirty timestamp {} is greater" +
                        " than the one that is being registered {}", existingLastDirtyTimestamp, registrationLastDirtyTimestamp);
                logger.warn("Using the existing instanceInfo instead of the new instanceInfo as the registrant");
                registrant = existingLease.getHolder();
            }
        } else {
            // The lease does not exist and hence it is a new registration
            // 租约不存在
            synchronized (lock) {
            	// 自我保护机制
                if (this.expectedNumberOfRenewsPerMin > 0) {
                    // Since the client wants to cancel it, reduce the threshold
                    // (1
                    // for 30 seconds, 2 for a minute)
                    this.expectedNumberOfRenewsPerMin = this.expectedNumberOfRenewsPerMin + 2;
                    this.numberOfRenewsPerMinThreshold =
                            (int) (this.expectedNumberOfRenewsPerMin * serverConfig.getRenewalPercentThreshold());
                }
            }
            logger.debug("No previous lease information found; it is new registration");
        }
        // 创建新的租约(实例信息，租约有效期)
        Lease<InstanceInfo> lease = new Lease<InstanceInfo>(registrant, leaseDuration);
        if (existingLease != null) {
            lease.setServiceUpTimestamp(existingLease.getServiceUpTimestamp());
        }
        // 设置实例集合的Value
        gMap.put(registrant.getId(), lease);
        // 添加到近期注册队列中，用于Eureka可视化界面显示（没研究过具体实现）
        synchronized (recentRegisteredQueue) {
            recentRegisteredQueue.add(new Pair<Long, String>(
                    System.currentTimeMillis(),
                    registrant.getAppName() + "(" + registrant.getId() + ")"));
        }
        // This is where the initial state transfer of overridden status happens
        // 添加到应用实例的覆盖状态的集合中
        // 只知道OverriddenStatus这个状态可以让实例在EurekaServer端以Up和OutOfService几种状态切换
        // 具体操作还有待研究
        if (!InstanceStatus.UNKNOWN.equals(registrant.getOverriddenStatus())) {
            logger.debug("Found overridden status {} for instance {}. Checking to see if needs to be add to the "
                            + "overrides", registrant.getOverriddenStatus(), registrant.getId());
            if (!overriddenInstanceStatusMap.containsKey(registrant.getId())) {
                logger.info("Not found overridden id {} and hence adding it", registrant.getId());
                overriddenInstanceStatusMap.put(registrant.getId(), registrant.getOverriddenStatus());
            }
        }
        // 获得实例的最终状态
        InstanceStatus overriddenStatusFromMap = overriddenInstanceStatusMap.get(registrant.getId());
        if (overriddenStatusFromMap != null) {
            logger.info("Storing overridden status {} from map", overriddenStatusFromMap);
            registrant.setOverriddenStatus(overriddenStatusFromMap);
        }
        // Set the status based on the overridden status rules
        InstanceStatus overriddenInstanceStatus = getOverriddenInstanceStatus(registrant, existingLease, isReplication);
        registrant.setStatusWithoutDirty(overriddenInstanceStatus);
        // If the lease is registered with UP status, set lease service up timestamp
        // 设置租约开始的时间戳(只有第一次设置有效，之后的设置会被忽略)
        if (InstanceStatus.UP.equals(registrant.getStatus())) {
            lease.serviceUp();
        }
        registrant.setActionType(ActionType.ADDED);
        recentlyChangedQueue.add(new RecentlyChangedItem(lease));
        registrant.setLastUpdatedTimestamp();
        // 
        invalidateCache(registrant.getAppName(), registrant.getVIPAddress(), registrant.getSecureVipAddress());
        logger.info("Registered instance {}/{} with status {} (replication={})",
                registrant.getAppName(), registrant.getId(), registrant.getStatus(), isReplication);
    } finally {
        // 释放锁
        read.unlock();
    }
}
```

- 再看一下向其他节点同步信息的操作：

```java
private void replicateToPeers(Action action, String appName, String id,
                                  InstanceInfo info /* optional */,
                                  InstanceStatus newStatus /* optional */, boolean isReplication) {
    Stopwatch tracer = action.getTimer().start();
    try {
        if (isReplication) {
            numberOfReplicationsLastMin.increment();
        }
        // If it is a replication already, do not replicate again as this will create a poison replication
        // 如果是Replication模式则跳过向其他节点复制的操作
        if (peerEurekaNodes == Collections.EMPTY_LIST || isReplication) {
            return;
        }
        // 循环EurekaServer的每个节点进行复制
        for (final PeerEurekaNode node : peerEurekaNodes.getPeerEurekaNodes()) {
            // If the url represents this host, do not replicate to yourself.
            if (peerEurekaNodes.isThisMyUrl(node.getServiceUrl())) {
                continue;
            }
            // Action为Register
            // 具体同步过程之后文章会有详细解析
            replicateInstanceActionsToPeers(action, appName, id, info, newStatus, node);
        }
    } finally {
        tracer.stop();
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
