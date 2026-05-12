# 06、源码解析 EurekaClient 心跳、续约源码解析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/6.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
EurekaClient心跳、续约源码解析

## 1、整体流程图

## 2、客户端心跳入口

```java
// new DiscoveryClient 的时候初始化心跳定时任务周期性的调度
// Heartbeat timer
scheduler.schedule(
    new TimedSupervisorTask(
        "heartbeat",
        scheduler,
        heartbeatExecutor,
        // 续约周期是 30s.也就是每 30s 执行一次
        renewalIntervalInSecs,
        TimeUnit.SECONDS,
        expBackOffBound,
        new HeartbeatThread()
    ),
    renewalIntervalInSecs, TimeUnit.SECONDS);
private class HeartbeatThread implements Runnable {
    public void run() {
        if (renew()) {
            lastSuccessfulHeartbeatTimestamp = System.currentTimeMillis();
        }
    }
}
```

### 2.1 renew() 续约的方法

```java
boolean renew() {
    EurekaHttpResponse<InstanceInfo> httpResponse;
    try {
        // 1、通过jerseyclient 去发送心中请求
        httpResponse = eurekaTransport.registrationClient.sendHeartBeat(instanceInfo.getAppName(), instanceInfo.getId(), instanceInfo, null);
        logger.debug("{} - Heartbeat status: {}", PREFIX + appPathIdentifier, httpResponse.getStatusCode());
        // 2、如果 404 的话去发起 register 请求
        if (httpResponse.getStatusCode() == 404) {
            REREGISTER_COUNTER.increment();// 这里是一个计数器，如果失败 + 1
            logger.info("{} - Re-registering apps/{}", PREFIX + appPathIdentifier, instanceInfo.getAppName());
            long timestamp = instanceInfo.setIsDirtyWithTime();
            boolean success = register();
            if (success) {
                instanceInfo.unsetIsDirty(timestamp);
            }
            return success;
        }
        // 3、成功返回 200,续约成功 
        return httpResponse.getStatusCode() == 200;
    } catch (Throwable e) {
        logger.error("{} - was unable to send heartbeat!", PREFIX + appPathIdentifier, e);
        return false;
    }
}
```

## 3、服务端流程

> 可以通过断点调试知道，最终服务端调用的是 InstanceResource 的 renewLease 方法

### 3.1 renewLease(InstanceResource.renewLease())

```java
@PUT
public Response renewLease(
        @HeaderParam(PeerEurekaNode.HEADER_REPLICATION) String isReplication,
        @QueryParam("overriddenstatus") String overriddenStatus,
        @QueryParam("status") String status,
        @QueryParam("lastDirtyTimestamp") String lastDirtyTimestamp) {
    boolean isFromReplicaNode = "true".equals(isReplication);
    boolean isSuccess = registry.renew(app.getName(), id, isFromReplicaNode);
    // 如果注册表中没发现直接返回 404,那 client 发现 404 后就会执行 registry 逻辑去 addInstance(新增实例) 添加到 registry(注册表) 中去
    // Not found in the registry, immediately ask for a register
    if (!isSuccess) {
        logger.warn("Not Found (Renew): {} - {}", app.getName(), id);
        return Response.status(Status.NOT_FOUND).build();
    }
    // Check if we need to sync based on dirty time stamp, the client instance might have changed some value
    Response response = null;
    if (lastDirtyTimestamp != null && serverConfig.shouldSyncWhenTimestampDiffers()) {
        response = this.validateDirtyTimestamp(Long.valueOf(lastDirtyTimestamp), isFromReplicaNode);
        // Store the overridden status since the validation found out the node that replicates wins
        if (response.getStatus() == Response.Status.NOT_FOUND.getStatusCode()
                && (overriddenStatus != null)
                && !(InstanceStatus.UNKNOWN.name().equals(overriddenStatus))
                && isFromReplicaNode) {
            registry.storeOverriddenStatusIfRequired(app.getAppName(), id, InstanceStatus.valueOf(overriddenStatus));
        }
    } else {
        response = Response.ok().build();
    }
    logger.debug("Found (Renew): {} - {}; reply status={}" + app.getName(), id, response.getStatus());
    return response;
}
```

### 3.2 com.netflix.eureka.registry.PeerAwareInstanceRegistryImpl#renew

```java
// super.renew() 主要是调用 AbstractInstanceRegistry 的 renew 方法
public boolean renew(final String appName, final String id, final boolean isReplication) {
    if (super.renew(appName, id, isReplication)) {
        //这个就是复制到其他 eureka 服务节点 
        replicateToPeers(Action.Heartbeat, appName, id, null, null, isReplication);
        return true;
    }
    return false;
}
```

### 3.2.1 com.netflix.eureka.registry.AbstractInstanceRegistry#renew(renew 方法是抽象类来实现的)

```java
public boolean renew(String appName, String id, boolean isReplication) {
    // 1、统计信息新增 1 
    RENEW.increment(isReplication);
    // 2、从 registry(注册表)中获取信息 appName 为 key 的 Map 信息
    Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
    Lease<InstanceInfo> leaseToRenew = null;
    // 3、苑 Lease 信息
    if (gMap != null) {
        leaseToRenew = gMap.get(id);
    }
    // 4、如果为空则直接返回 404,客户端会发起 registry 请求(前面的文章看到过这样的逻辑处理)
    if (leaseToRenew == null) {
        RENEW_NOT_FOUND.increment(isReplication);
        logger.warn("DS: Registry: lease doesn't exist, registering resource: {} - {}", appName, id);
        return false;
    } else {
        InstanceInfo instanceInfo = leaseToRenew.getHolder();
        if (instanceInfo != null) {
         	// 4.1、InstanceStatus 判断，如果为 UNKNOWN，可能被删除覆盖了，所以可能客户端需要重新注册
            InstanceStatus overriddenInstanceStatus = this.getOverriddenInstanceStatus(
                    instanceInfo, leaseToRenew, isReplication);
            if (overriddenInstanceStatus == InstanceStatus.UNKNOWN) {
                logger.info("Instance status UNKNOWN possibly due to deleted override for instance {}"
                        + "; re-register required", instanceInfo.getId());
                RENEW_NOT_FOUND.increment(isReplication);
                return false;
            }
            // 4.2、如果两者不一样，则更新 status
            if (!instanceInfo.getStatus().equals(overriddenInstanceStatus)) {
                Object[] args = {
                        instanceInfo.getStatus().name(),
                        instanceInfo.getOverriddenStatus().name(),
                        instanceInfo.getId()
                };
                logger.info(
                        "The instance status {} is different from overridden instance status {} for instance {}. "
                                + "Hence setting the status to overridden status", args);
                instanceInfo.setStatusWithoutDirty(overriddenInstanceStatus);
            }
        }
        // 5、统计信息新增(上一分钟的续约次数)
        renewsLastMin.increment();
        // 6、更新 lastUpdateTimestamp
        leaseToRenew.renew();
        return true;
    }
}
```

### 3.2.2 replicateToPeers(复制到其他 Eureka 服务节点 )

```java
private void replicateInstanceActionsToPeers(Action action, String appName,
                                             String id, InstanceInfo info, InstanceStatus newStatus,
                                             PeerEurekaNode node) {
    try {
        InstanceInfo infoFromRegistry = null;
        CurrentRequestVersion.set(Version.V2);
        switch (action) {
            case Cancel:
                node.cancel(appName, id);
                break;
            case Heartbeat:
                // 这里我们可以知道会调用到这里来
                // 从 overriddenInstanceStatusMap 中获取 InstanceStatus，默认是 1 个小时后过期。
                InstanceStatus overriddenStatus = overriddenInstanceStatusMap.get(id);
                // 这个方法说一下
                infoFromRegistry = getInstanceByAppAndId(appName, id, false);
                node.heartbeat(appName, id, infoFromRegistry, overriddenStatus, false);
                break;
            case Register:
                node.register(info);
                break;
            case StatusUpdate:
                infoFromRegistry = getInstanceByAppAndId(appName, id, false);
                node.statusUpdate(appName, id, newStatus, infoFromRegistry);
                break;
            case DeleteStatusOverride:
                infoFromRegistry = getInstanceByAppAndId(appName, id, false);
                node.deleteStatusOverride(appName, id, infoFromRegistry);
                break;
        }
    } catch (Throwable t) {
        logger.error("Cannot replicate information to {} for action {}", node.getServiceUrl(), action.name(), t);
    }
}
@Override
public InstanceInfo getInstanceByAppAndId(String appName, String id, boolean includeRemoteRegions) {
    // 1、从注册表中获取 appName 为 key 的 Map 
    Map<String, Lease<InstanceInfo>> leaseMap = registry.get(appName);
    Lease<InstanceInfo> lease = null;
    if (leaseMap != null) {
        lease = leaseMap.get(id);
    }
    // 2、判断 Lease 如果不为空，且(Lease 开启没有开启或者 lease 没有过期)则返回装饰的 InstanceInfo
    if (lease != null
        && (!isLeaseExpirationEnabled() || !lease.isExpired())) {
        return decorateInstanceInfo(lease);
    } else if (includeRemoteRegions) {
        for (RemoteRegionRegistry remoteRegistry : this.regionNameVSRemoteRegistry.values()) {
            Application application = remoteRegistry.getApplication(appName);
            if (application != null) {
                return application.getByInstanceId(id);
            }
        }
    }
    return null;
}
 @Override
public boolean isLeaseExpirationEnabled() {
    // 1、这个是判断自我保护模式是否开启(这个模式是默认开启的，后面EurekaServer 自我保护源码解析的时候会分析一下，怎么来判断等等)
    if (!isSelfPreservationModeEnabled()) {
        // The self preservation mode is disabled, hence allowing the instances to expire.
        //如果自我保护没有开启，说明此时是可以过期的，所以返回 true。
        // 因为如果自我保护开启，就不会进来，说明此时要判断一下心跳来判断是否 lease过期开启
        return true;
    }
    //2、阈值 > 0,且上一分钟的心跳数 > 阈值才说明 lease 过期开启否则返回 false
    return numberOfRenewsPerMinThreshold > 0 && getNumOfRenewsInLastMin() > numberOfRenewsPerMinThreshold;
}
```

#### 3.2.2.1 heartbeat

```java
public void heartbeat(final String appName, final String id,
                      final InstanceInfo info, final InstanceStatus overriddenStatus,
                      boolean primeConnection) throws Throwable {
    // 1、传递的是 false 不会进来
    if (primeConnection) {
        // We do not care about the result for priming request.
        replicationClient.sendHeartBeat(appName, id, info, overriddenStatus);
        return;
    }
    // 2、构造一个 ReplicationTask 
    ReplicationTask replicationTask = new InstanceReplicationTask(targetHost, Action.Heartbeat, info, overriddenStatus, false) {
        @Override
        public EurekaHttpResponse<InstanceInfo> execute() throws Throwable {
            return replicationClient.sendHeartBeat(appName, id, info, overriddenStatus);
        }
        @Override
        public void handleFailure(int statusCode, Object responseEntity) throws Throwable {
            super.handleFailure(statusCode, responseEntity);
            if (statusCode == 404) {
                logger.warn("{}: missing entry.", getTaskName());
                if (info != null) {
                    logger.warn("{}: cannot find instance id {} and hence replicating the instance with status {}",
                            getTaskName(), info.getId(), info.getStatus());
                    register(info);
                }
            } else if (config.shouldSyncWhenTimestampDiffers()) {
                InstanceInfo peerInstanceInfo = (InstanceInfo) responseEntity;
                if (peerInstanceInfo != null) {
                    syncInstancesIfTimestampDiffers(appName, id, info, peerInstanceInfo);
                }
            }
        }
    };
    // 3、获取 expiryTime
    long expiryTime = System.currentTimeMillis() + getLeaseRenewalOf(info);
    // 4、分发到 batchingDispatcher 
    batchingDispatcher.process(taskId("heartbeat", info), replicationTask, expiryTime);
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
