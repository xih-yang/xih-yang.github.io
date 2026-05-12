# 05、Eureka源码解析 服务下线
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-4/5.html
- 分类：注册中心
- 分组：Eureka 教程（版本 D）
## Eureka服务下线

- 本篇讲的服务下线是优雅下线(正常下线)，因为网络问题或服务自身宕机等问题造成的下线后面的文章会有专门解析。本文基于https://github.com/Netflix/eureka上的master分支。最近在github上fork了一下eureka项目，更详细的注释可以去我的git上看：https://github.com/qiuyangli/eureka

## 具体解析

- 服务下线有多种方式，这里讲一下我认为的最优雅的下线方式，调用EurekaClient端提供的REST接口进行下线：http://localhost:8080/shutdown，具体实现还是在eureka-client包下DiscoveryClient类里实现的(感觉EurekaClient端的重要操作全在这里。。。)：

```java
// 可通过执行http://localhost:8080/shutdown对EurekaClient进行下线
// 下线后会识别@PreDestroy这个注解，调用到shutdown()这个方法
@PreDestroy
@Override
public synchronized void shutdown() {
    if (isShutdown.compareAndSet(false, true)) {
        logger.info("Shutting down DiscoveryClient ...");
        if (statusChangeListener != null && applicationInfoManager != null) {
            applicationInfoManager.unregisterStatusChangeListener(statusChangeListener.getId());
        }
        // 关闭各种定时任务
        // 关闭刷新实例信息/注册的定时任务
        // 关闭续约(心跳)的定时任务
        // 关闭获取注册信息的定时任务
        cancelScheduledTasks();
        // If APPINFO was registered
        if (applicationInfoManager != null
                && clientConfig.shouldRegisterWithEureka()
                && clientConfig.shouldUnregisterOnShutdown()) {
            // 更改实例状态，使实例不再接收流量
            applicationInfoManager.setInstanceStatus(InstanceStatus.DOWN);
            // 向EurekaServer端发送下线请求
            // 是个void方法
            unregister();
        }
        if (eurekaTransport != null) {
            eurekaTransport.shutdown();
        }
        heartbeatStalenessMonitor.shutdown();
        registryStalenessMonitor.shutdown();
        logger.info("Completed shut down of DiscoveryClient");
    }
}
```

- 调用到unregister()这个void方法

```java
void unregister() {
    // It can be null if shouldRegisterWithEureka == false
    if(eurekaTransport != null && eurekaTransport.registrationClient != null) {
        try {
            logger.info("Unregistering ...");
            // 向EurekaServer端发送下线请求，参数为实例集合名称+实例id
            // 具体调用到eureka-core包下InstanceResource-cancelLease()方法
            EurekaHttpResponse<Void> httpResponse = eurekaTransport.registrationClient.cancel(instanceInfo.getAppName(), instanceInfo.getId());
            logger.info(PREFIX + "{} - deregister  status: {}", appPathIdentifier, httpResponse.getStatusCode());
        } catch (Exception e) {
            logger.error(PREFIX + "{} - de-registration failed{}", appPathIdentifier, e.getMessage(), e);
        }
    }
}
```

- eureka-core包下的InstanceResource-cancelLease是EurekaServer端接收下线请求的方法，具体代码如下：

```java
// 接收EurekaClient端下线请求
@DELETE
public Response cancelLease(@HeaderParam(PeerEurekaNode.HEADER_REPLICATION) String isReplication) {
    try {
	// 调用下线方法，isReplication字段之前注释有说明
	boolean isSuccess = registry.cancel(app.getName(), id, "true".equals(isReplication));
	// 下线成功
	if (isSuccess) {
	    logger.debug("Found (Cancel): {} - {}", app.getName(), id);
	    return Response.ok().build();
	} else {
	    // 没找到实例，返回404
	    logger.info("Not Found (Cancel): {} - {}", app.getName(), id);
	    return Response.status(Status.NOT_FOUND).build();
	}
    } catch (Throwable e) {
	logger.error("Error (cancel): {} - {}", app.getName(), id, e);
	return Response.serverError().build();
    }
}
```

- 最终调用到internalCancel(appName, id, isReplication)进行实例信息移除，代码如下：

```java
protected boolean internalCancel(String appName, String id, boolean isReplication) {
    try {
        read.lock();// 获得读锁
        CANCEL.increment(isReplication);
        // 根据实例集合名称取出实例信息集合
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        Lease<InstanceInfo> leaseToCancel = null;
        if (gMap != null) {
            // remove后返回id对应的具体实例信息
            leaseToCancel = gMap.remove(id);
        }
        synchronized (recentCanceledQueue) {
            // 添加到最近取消租约队列
            recentCanceledQueue.add(new Pair<Long, String>(System.currentTimeMillis(), appName + "(" + id + ")"));
        }
        // 移除实例对应的覆盖状态
        InstanceStatus instanceStatus = overriddenInstanceStatusMap.remove(id);
        if (instanceStatus != null) {
            logger.debug("Removed instance id {} from the overridden map which has value {}", id, instanceStatus.name());
        }
        if (leaseToCancel == null) {
            // 未找到租约信息
            CANCEL_NOT_FOUND.increment(isReplication);
            logger.warn("DS: Registry: cancel failed because Lease is not registered for: {}/{}", appName, id);
            return false;
        } else {
            // 设置取消租约的时间戳
            leaseToCancel.cancel();
            InstanceInfo instanceInfo = leaseToCancel.getHolder();
            String vip = null;
            String svip = null;
            if (instanceInfo != null) {
                // 设置实例信息中的ActionType为Delete
                instanceInfo.setActionType(ActionType.DELETED);
                recentlyChangedQueue.add(new RecentlyChangedItem(leaseToCancel));
                instanceInfo.setLastUpdatedTimestamp();
                vip = instanceInfo.getVIPAddress();
                svip = instanceInfo.getSecureVipAddress();
            }
            // 设置响应缓存过期
            invalidateCache(appName, vip, svip);
            logger.info("Cancelled instance {}/{} (replication={})", appName, id, isReplication);
            return true;
        }
    } finally {
        // 释放锁
        read.unlock();
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
