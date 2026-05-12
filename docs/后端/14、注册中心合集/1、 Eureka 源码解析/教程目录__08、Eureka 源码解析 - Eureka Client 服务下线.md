# 08、Eureka 源码解析 - Eureka Client 服务下线
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/8.html
- 分类：注册中心
- 分组：教程目录
下面是官方提供的 Eureka 架构图：

### 1、Eureka Client 服务下线

当 Eureka Client 服务关闭之前会调用 DiscoveryClient#shutdown 方法。因为这个方法上面标注了 @PreDestroy 在对象销毁之前这个方法就会被调用。

```java
    @PreDestroy
    @Override
    public synchronized void shutdown() {
        if (isShutdown.compareAndSet(false, true)) {
            if (statusChangeListener != null && applicationInfoManager != null) {
                applicationInfoManager.unregisterStatusChangeListener(statusChangeListener.getId());
            }
            cancelScheduledTasks();
            // If APPINFO was registered
            if (applicationInfoManager != null
                    && clientConfig.shouldRegisterWithEureka()
                    && clientConfig.shouldUnregisterOnShutdown()) {
                applicationInfoManager.setInstanceStatus(InstanceStatus.DOWN);
                unregister();
            }
            if (eurekaTransport != null) {
                eurekaTransport.shutdown();
            }
            heartbeatStalenessMonitor.shutdown();
            registryStalenessMonitor.shutdown();
            Monitors.unregisterObject(this);
        }
    }
```

- 首先把 AtomicBoolean 类型的 isShutdown 设置成 true。
- 接着会解除掉服务应用管理器(ApplicationInfoManager) 中注册的状态监听器(StatusChangeListener)
- 然后会调用 cancelScheduledTasks 释放线程池资源，包括：Eureka Server 间的数据同步线程与线程池、心跳处理的线程池与线程以及注册表定时刷新的线程池与线程。
- 设置当前服务应用的状态为下线，并且在DiscoveryClient#unregister 方法当中调用 EurekaHttpClient#cancel 进行服务下线
- 释放 EurekaTransport 远程调用里面的 HTTP 连接资源
- 最后释放一些监控资源

在调用服务下线的时候请求最终会调用到 AbstractJersey2EurekaHttpClient#cancel发送类似于：http://localhost:8080/v2/apps/APPLICATION0/i-00000000 这样的 PUT 请求路径到注册中心。

- http://localhost:8080：Eureka Server 的请求地址
- /v2/apps：Restful 处理类 ApplicationsResource 上面的路径：@Path("/{version}/apps")
- APPLICATION0 ：微服务应用的名称，也可以是：user-service，order-service 等
- i-00000000 ：微服务应用的名称下具体的服务实例 ID，比如 user-service 下面有 8 台机制实例。i-00000000 就是其中一台唯一的 ID 值

### 2、Eureka Server 服务下线

Eureka Server 处理 Eureka Client 服务下线时序图：

首先 ApplicationsResource#getApplicationResource 会来接收 Eureka Client 发送过来的服务下线请求，这个接口里面会返回 ApplicationResource 对象。然后会调用 ApplicationResource#getInstanceInfo。因为 Eureka Client 发送的是 DELETE 请求，所以请求会转发到 InstanceResource 标注了 @DELETE 的方法 cancelLease 进行处理。

> InstanceResource#cancelLease

```java
    @DELETE
    public Response cancelLease(
            @HeaderParam(PeerEurekaNode.HEADER_REPLICATION) String isReplication) {
        try {
            boolean isSuccess = registry.cancel(app.getName(), id,
                "true".equals(isReplication));
            if (isSuccess) {
                return Response.ok().build();
            } else {
                return Response.status(Status.NOT_FOUND).build();
            }
        } catch (Throwable e) {
            return Response.serverError().build();
        }
    }
```

这个方法里面的逻辑非常简单：

- 调用注册中心的服务下线功能
- 然后把服务下线的响应结果返回给 Eureka Client

### 3、注册中心下线服务

下面我们来看一下注册中心服务在服务下线做了哪些事情。下面是 Eureka Server 服务下线的时序图：

上面的时序图有两点比较核心：

- 调用当前 Eureka Server 的 AbstractInstanceRegistry#internalCancel 方法进行服务下线
- 如果是集群环境调用 PeerAwareInstanceRegistryImpl#replicateToPeers 把当前的服务实例的下线同步到其它 Eureka Servier 当中去(后续分析)。

那我们就来分析一下 AbstractInstanceRegistry#internalCancel 方法是如何进行服务下线的。

> AbstractInstanceRegistry#internalCancel

```java
    protected boolean internalCancel(String appName, String id, boolean isReplication) {
        read.lock();
        try {
            CANCEL.increment(isReplication);
            Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
            Lease<InstanceInfo> leaseToCancel = null;
            if (gMap != null) {
                leaseToCancel = gMap.remove(id);
            }
            recentCanceledQueue.add(new Pair<Long, String>(System.currentTimeMillis(), appName + "(" + id + ")"));
            InstanceStatus instanceStatus = overriddenInstanceStatusMap.remove(id);
            if (instanceStatus != null) {
                logger.debug("Removed instance id {} from the overridden map which has value {}", id, instanceStatus.name());
            }
            if (leaseToCancel == null) {
                CANCEL_NOT_FOUND.increment(isReplication);
                logger.warn("DS: Registry: cancel failed because Lease is not registered for: {}/{}", appName, id);
                return false;
            } else {
                leaseToCancel.cancel();
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
                invalidateCache(appName, vip, svip);
                logger.info("Cancelled instance {}/{} (replication={})", appName, id, isReplication);
            }
        } finally {
            read.unlock();
        }
        synchronized (lock) {
            if (this.expectedNumberOfClientsSendingRenews > 0) {
                // Since the client wants to cancel it, reduce the number of clients to send renews.
                this.expectedNumberOfClientsSendingRenews = this.expectedNumberOfClientsSendingRenews - 1;
                updateRenewsPerMinThreshold();
            }
        }
        return true;
    }
```

- EurekaMonitors#CANCEL 服务取消监控进行 +1
- 根据微服务的名称获取到当前服务的注册列表
- 如果当前服务的注册列表不为空，根据传入的服务实例 ID 把它从注册列表当中移除
- 向 CircularQueue`

>` recentCanceledQueue 列表当中添加当前服务实例信息(**注：这个队列信息暂时没有用到**)
- 如果移除的服务实例为空，EurekaMonitors#CANCEL_NOT_FOUND +1 并返回 false.
- 调用 Lease``#cancel 进行下线，其实就是修改 Lease 的 registrationTimestamp 属性为当前系统时间
- 设置当前信息为删除状态，并添加到 ConcurrentLinkedQueue`` recentlyChangedQueue 当中。(**注：这个队列会在 Eureka Client 增量拉取注册表时使用**)

其实Eureka Client 服务下线就是在注册服务中的 Map 当中把当前服务实例的信息删除就行了。
