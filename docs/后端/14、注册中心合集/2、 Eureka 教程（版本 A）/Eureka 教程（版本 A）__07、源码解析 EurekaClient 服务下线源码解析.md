# 07、源码解析 EurekaClient 服务下线源码解析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/7.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
EurekaClient服务下线源码解析

**EurekaClient服务下线整体流程图**

## 1、客户端下线源码解析

### 1.1 shutdown()

```java
/**
 * 1、关闭 EurekaClient，也会发送一个注销的请求到 eureka server
 * Shuts down Eureka Client. Also sends a deregistration request to the
 * eureka server.
 */
@PreDestroy
@Override
public synchronized void shutdown() {
    if (isShutdown.compareAndSet(false, true)) {
        logger.info("Shutting down DiscoveryClient ...");
        // 1、移除 applicaion 状态改变的监听器(这个监听器在 new DiscoveryClient 的时候添加的)
        if (statusChangeListener != null && applicationInfoManager != null) {
            applicationInfoManager.unregisterStatusChangeListener(statusChangeListener.getId());
        }
        // 2、取消定时任务
        cancelScheduledTasks();
        // 3、这里就是向 eureka server 发送的注销的请求
        // If APPINFO was registered
        if (applicationInfoManager != null && clientConfig.shouldRegisterWithEureka()) {
            // 3.1 设置应用管理的状态为 DOWN
            applicationInfoManager.setInstanceStatus(InstanceStatus.DOWN);
            // 3.3 发送注销的网络请求
            unregister();
        }
        // 4、关闭网络组件
        if (eurekaTransport != null) {
            eurekaTransport.shutdown();
        }
        // 5、监控服务关闭
        heartbeatStalenessMonitor.shutdown();
        registryStalenessMonitor.shutdown();
        logger.info("Completed shut down of DiscoveryClient");
    }
}
```

### 1.2 unregister(向eureka server 发送的注销请求)

```java
/**
 * unregister w/ the eureka service.
 */
void unregister() {
    // It can be null if shouldRegisterWithEureka == false
    if(eurekaTransport != null && eurekaTransport.registrationClient != null) {
        try {
            logger.info("Unregistering ...");
            // 调用的是 cancel 方法
            EurekaHttpResponse<Void> httpResponse = eurekaTransport.registrationClient.cancel(instanceInfo.getAppName(), instanceInfo.getId());
            logger.info(PREFIX + appPathIdentifier + " - deregister  status: " + httpResponse.getStatusCode());
        } catch (Exception e) {
            logger.error(PREFIX + appPathIdentifier + " - de-registration failed" + e.getMessage(), e);
        }
    }
}
```

## 2、EurekaServer接收下线请求源码解析

### 2.1 cancelLease(InstanceResource 的 cancelLease 方法)

```java
@DELETE
public Response cancelLease(
        @HeaderParam(PeerEurekaNode.HEADER_REPLICATION) String isReplication) {
    boolean isSuccess = registry.cancel(app.getName(), id,
            "true".equals(isReplication));
    if (isSuccess) {
        logger.debug("Found (Cancel): " + app.getName() + " - " + id);
        return Response.ok().build();
    } else {
        logger.info("Not Found (Cancel): " + app.getName() + " - " + id);
        return Response.status(Status.NOT_FOUND).build();
    }
}
```

### 2.2 cancel(PeerAwareInstanceRegistryImpl 的 cancel 方法)

```java
@Override
public boolean cancel(final String appName, final String id,
                      final boolean isReplication) {
	// 1、调用 AbstractInstanceRegistry 的  cancel 方法                     
    if (super.cancel(appName, id, isReplication)) {
        // 1.1 复制操作到其他的 eureka server 节点 
        replicateToPeers(Action.Cancel, appName, id, null, null, isReplication);
        // 1.2 上锁
        synchronized (lock) {
            // 1.3 更新实例的期望心跳数 -2，然后阈值为期望心跳数 * 0.85
            if (this.expectedNumberOfRenewsPerMin > 0) {
                // Since the client wants to cancel it, reduce the threshold (1 for 30 seconds, 2 for a minute)
                this.expectedNumberOfRenewsPerMin = this.expectedNumberOfRenewsPerMin - 2;
                this.numberOfRenewsPerMinThreshold =
                        (int) (this.expectedNumberOfRenewsPerMin * serverConfig.getRenewalPercentThreshold());
            }
        }
        return true;
    }
    return false;
}
```

### 2.3 cancel(AbstractInstanceRegistry.cancel)

```java
protected boolean internalCancel(String appName, String id, boolean isReplication) {
    try {
        read.lock();
        // 1、取消的统计 +1 
        CANCEL.increment(isReplication);
        // 2、注册表中获取 appName 为  key 的 map
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        // 3、从 map 中移除 leaseInfo 
        Lease<InstanceInfo> leaseToCancel = null;
        if (gMap != null) {
            leaseToCancel = gMap.remove(id);
        }
        // 4、最近取消的 Queue 添加该实例
        synchronized (recentCanceledQueue) {
            recentCanceledQueue.add(new Pair<Long, String>(System.currentTimeMillis(), appName + "(" + id + ")"));
        }
        // 5、overriddenInstanceStatusMap中移除该 id 对应的InstanceStatus信息
        InstanceStatus instanceStatus = overriddenInstanceStatusMap.remove(id);
        if (instanceStatus != null) {
            logger.debug("Removed instance id {} from the overridden map which has value {}", id, instanceStatus.name());
        }
        // 6、lease 为空，直接返回  false. CANCEL_NOT_FOUND + 1 
        if (leaseToCancel == null) {
            CANCEL_NOT_FOUND.increment(isReplication);
            logger.warn("DS: Registry: cancel failed because Lease is not registered for: {}/{}", appName, id);
            return false;
        } else {
            // 7、 lease 取消           
            leaseToCancel.cancel();
            // 8、更新 InstanceInfo 信息
            /**
            * 1、ActionType 为 DELETED
            * 2、RecentlyChangedQueue 添加该实例 
            * 3、LastUpdatedTimestamp 更新
            */
            InstanceInfo instanceInfo = leaseToCancel.getHolder();
            String vip = null;
            String svip = null;
            if (instanceInfo != null) {
                instanceInfo.setActionType(ActionType.DELETED);
                recentlyChangedQueue.add(new RecentlyChangedItem(leaseToCancel));
                instanceInfo.setLastUpdatedTimestamp();
                vip = instanceInfo.getVIPAddress();
                svip = instanceInfo.getSecureVipAddress();
            }
            // 9、失效缓存信息
            invalidateCache(appName, vip, svip);
            logger.info("Cancelled instance {}/{} (replication={})", appName, id, isReplication);
            return true;
        }
    } finally {
        read.unlock();
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
