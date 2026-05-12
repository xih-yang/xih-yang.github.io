# 07、Eureka 源码解析 - Eureka Client 续约
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/7.html
- 分类：注册中心
- 分组：教程目录
下面是官方提供的 Eureka 架构图：

### 1、Eureka Client 续约机制

在Eureka Client 需要定时的向注册中心 Eureka Server 发送续约信息，告诉注册中心当前的微服务处于可用状态，这样注册中心在服务剔除的时候才不会把当前服务实例从注册表中删除。

在 DiscoveryClient 进行初始化的时候，会调用 DiscoveryClient#initScheduledTasks 方法。在这个方向当中不仅会启动定时任务调用 CacheRefreshThread 线程定时从注册中心拉取最新的注册信息；还会启动定时任务调用 HeartbeatThread 向注册中心发送续约信息。

> DiscoveryClient#renew

```java
    boolean renew() {
        EurekaHttpResponse<InstanceInfo> httpResponse;
        try {
            httpResponse = eurekaTransport.registrationClient.sendHeartBeat(instanceInfo.getAppName(), instanceInfo.getId(), instanceInfo, null);
            if (httpResponse.getStatusCode() == Status.NOT_FOUND.getStatusCode()) {
                REREGISTER_COUNTER.increment();
                long timestamp = instanceInfo.setIsDirtyWithTime();
                boolean success = register();
                if (success) {
                    instanceInfo.unsetIsDirty(timestamp);
                }
                return success;
            }
            return httpResponse.getStatusCode() == Status.OK.getStatusCode();
        } catch (Throwable e) {
            return false;
        }
    }
```

上面的请求最终会调用到 AbstractJersey2EurekaHttpClient#sendHeartBeat发送类似于：http://localhost:8080/v2/apps/APPLICATION0/i-00000000 这样的 PUT 请求路径到注册中心。

- http://localhost:8080 ：Eureka Server 的请求地址
- /v2/apps：Restful 处理类 ApplicationsResource 上面的路径：@Path("/{version}/apps")
- APPLICATION0 ：微服务应用的名称，也可以是：user-service，order-service 等
- i-00000000 ：微服务应用的名称下具体的服务实例 ID，比如 user-service 下面有 8 台机制实例。i-00000000就是其中一台唯一的 ID 值

### 2、Eureka Server 处理续约请求

Eureka Server 处理 Eureka Client 时序图：

首先 ApplicationsResource#getApplicationResource 会来接收 Eureka Client 发送过来的续约请求，这个接口里面会返回 ApplicationResource 对象。然后会调用ApplicationResource#getInstanceInfo。因为 Eureka Client 发送的是 PUT 请求，所以请求会转发到 InstanceResource 标注了 @PUT 的方法 renewLease 进行处理。

> InstanceResource#renewLease

```java
    @PUT
    public Response renewLease(
            @HeaderParam(PeerEurekaNode.HEADER_REPLICATION) String isReplication,
            @QueryParam("overriddenstatus") String overriddenStatus,
            @QueryParam("status") String status,
            @QueryParam("lastDirtyTimestamp") String lastDirtyTimestamp) {
        boolean isFromReplicaNode = "true".equals(isReplication);
        boolean isSuccess = registry.renew(app.getName(), id, isFromReplicaNode);
        // Not found in the registry, immediately ask for a register
        if (!isSuccess) {
            logger.warn("Not Found (Renew): {} - {}", app.getName(), id);
            return Response.status(Status.NOT_FOUND).build();
        }
        // Check if we need to sync based on dirty time stamp, the client
        // instance might have changed some value
        Response response;
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
        logger.debug("Found (Renew): {} - {}; reply status={}", app.getName(), id, response.getStatus());
        return response;
    }
```

- 判断是否来自集群节点(如果是集群节点需要同步到 Eureka Server 集群其它节点)
- 调用 Eureka Server 的注册中心 PeerAwareInstanceRegistry 进行续约
- 比较注册中心的服务信息中的注册时间是否与传入时间匹配
- Eureka Server 响应 Eureka Client 续约结果

### 3、注册中心续约服务

在 PeerAwareInstanceRegistryImpl#renew 进行续约的时候，先会调用 AbstractInstanceRegistry#renew 在当前 Eureka Server 进行续约，如果是 Eureka Server 集群环境下，会把续约请求发送到其它的 Eureka Server 节点上去。

> PeerAwareInstanceRegistryImpl#renew

```java
    public boolean renew(final String appName, final String id, final boolean isReplication) {
        if (super.renew(appName, id, isReplication)) {
            replicateToPeers(Action.Heartbeat, appName, id, null, null, isReplication);
            return true;
        }
        return false;
    }
```

下面我们来看一下调用 AbstractInstanceRegistry#renew 进行当前 Eureka Server 节点是如何进行续约的。

> AbstractInstanceRegistry#renew

```java
    public boolean renew(String appName, String id, boolean isReplication) {
        RENEW.increment(isReplication);
        Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
        Lease<InstanceInfo> leaseToRenew = null;
        if (gMap != null) {
            leaseToRenew = gMap.get(id);
        }
        if (leaseToRenew == null) {
            RENEW_NOT_FOUND.increment(isReplication);
            return false;
        } else {
            InstanceInfo instanceInfo = leaseToRenew.getHolder();
            if (instanceInfo != null) {
                // touchASGCache(instanceInfo.getASGName());
                InstanceStatus overriddenInstanceStatus = this.getOverriddenInstanceStatus(
                        instanceInfo, leaseToRenew, isReplication);
                if (overriddenInstanceStatus == InstanceStatus.UNKNOWN) {
                    RENEW_NOT_FOUND.increment(isReplication);
                    return false;
                }
                if (!instanceInfo.getStatus().equals(overriddenInstanceStatus)) {
                    instanceInfo.setStatusWithoutDirty(overriddenInstanceStatus);
                }
            }
            renewsLastMin.increment();
            leaseToRenew.renew();
            return true;
        }
    }
```

其实续约的逻辑非常简单。

- 首先从注册列表中找到当前服务的注册信息列表：Map`>` gMap.
- 然后从注册信息列表中根据服务信息的 ID 找到服务信息：Lease`` leaseToRenew.
- 如果找不到服务信息，续约失败，返回 false。
- 获取服务信息在 InstanceStatusOverrideRule 的中状态
- 如果状态是 InstanceStatus.UNKNOWN)，续约失败，返回 false。
- 如果状态与服务实例中的状态不一致，调用 instanceInfo.setStatusWithoutDirty(overriddenInstanceStatus) 方法
- 最后调用 com.netflix.eureka.lease.Lease#renew 进行服务的续约，其实就是更新 Lease 对象的 long lastUpdateTimestamp 属性为系统当前时间 + duration 时间(默认 90 秒)。

其实Eureka Client 进行服务续约就是把服务信息里面的 `lastUpdateTimestamp` 更新一下，防止 Eureka Server 在进行服务拆除的时候把当前服务摘除。
