# 03、Eureka源码解析 服务续约(心跳)
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-4/3.html
- 分类：注册中心
- 分组：Eureka 教程（版本 D）
## Eureka服务续约(心跳)

- EurekaClient在注册到EurekaServer端之后，会通过启动时初始化的定时任务定时向EurekaServer端进行服务续约(心跳)。本篇文章主要解析EurekaClient端向EurekaServer端发起服务续约(心跳)请求以及EurekaServer端接收请求后的具体操作，分为EurekaClient端发送请求和EurekaServer端接收请求来解析。注：我理解的服务续约和心跳检测完全就是同一个操作，都是定时向EurekaServer端发送当前节点的信息（其实看了代码之后发现确实是同一个操作，服务续约即心跳检测）本文基于https://github.com/Netflix/eureka上的master分支。最近在github上fork了一下eureka项目，更详细的注释可以去我的git上看：https://github.com/qiuyangli/eureka

## EurekaClient端发送请求

- 首先回顾一下EurekaClient端启动时候初始化的这个定时任务：

```java
// 10秒
int expBackOffBound = clientConfig.getHeartbeatExecutorExponentialBackOffBound();
// 心跳(续约)频率，默认30秒 
int renewalIntervalInSecs = instanceInfo.getLeaseInfo().getRenewalIntervalInSecs();
logger.info("Starting heartbeat executor: " + "renew interval is: {}", renewalIntervalInSecs);
// Heartbeat timer
// 实际是一个心跳(续约)定时任务，后面会有详细解析
scheduler.schedule(
    new TimedSupervisorTask(
            "heartbeat",
            scheduler,
            heartbeatExecutor,
            renewalIntervalInSecs,
            TimeUnit.SECONDS,
            expBackOffBound,
            // new一个续约线程，最终调用到renew()方法
            new HeartbeatThread()
        ),
        renewalIntervalInSecs, TimeUnit.SECONDS);
```

- 发现new了一个名叫HeartbeatThread的线程，赶紧看一下run()方法

```java
public void run() {
    if (renew()) {
        // 最后成功心跳（续约）时间
        lastSuccessfulHeartbeatTimestamp = System.currentTimeMillis();
    }
}
```

- run发现在run()里调用了一个名字为renew()的方法，到了这里更加确信了服务续约和心跳检测是一个东西。。。这个renew()方法便是发起续约(心跳)请求的方法。看一下具体代码：

```java
// 心跳（续约）
boolean renew() {
    EurekaHttpResponse<InstanceInfo> httpResponse;
    try {
        // 使用Jersey构建Rest调用EurekaServer端
        // AbstractJerseyEurekaHttpClient-sendHeartBeat(appName, id, info, overriddenStatus)方法
        // 通过sendHeartBeat方法调用eureka-core中的方法
        // 具体为调用com.netflix.eureka.resources包下的InstanceResource类的renewLease方法进行续约
        httpResponse = eurekaTransport.registrationClient.sendHeartBeat(instanceInfo.getAppName(), instanceInfo.getId(), instanceInfo, null);
        logger.debug(PREFIX + "{} - Heartbeat status: {}", appPathIdentifier, httpResponse.getStatusCode());
        // 租约不存在的时候，进行注册操作
        if (httpResponse.getStatusCode() == 404) {
            REREGISTER_COUNTER.increment();
            logger.info(PREFIX + "{} - Re-registering apps/{}", appPathIdentifier, instanceInfo.getAppName());
            long timestamp = instanceInfo.setIsDirtyWithTime();
            // 发起注册操作
            boolean success = register();
            if (success) {
                instanceInfo.unsetIsDirty(timestamp);
            }
            return success;
        }
        return httpResponse.getStatusCode() == 200;
    } catch (Throwable e) {
        logger.error(PREFIX + "{} - was unable to send heartbeat!", appPathIdentifier, e);
        return false;
    }
}
```

## EurekaServer端接收请求

- EurekaServer端接收续约(心跳)请求的方法是eureka-core包里的InstanceResource-renewLease方法，这个方法同EurekaServer接收注册信息的方法一样，都用isReplication这个字段来表明当前请求是接收EurekaClient端发来的续约(心跳)请求还是其他EurekaServer端发来的同步信息的请求。debug发现续约时isReplication还是为null

具体代码如下：

```java
// 接收EurekaClient端发送的续租(心跳)请求
// 也有可能是接收其他EurekaServer端同步数据的请求
@PUT
public Response renewLease(// 是否是Replication模式
        @HeaderParam(PeerEurekaNode.HEADER_REPLICATION) String isReplication,
        @QueryParam("overriddenstatus") String overriddenStatus,// 实例的覆盖状态
        @QueryParam("status") String status,// 实例状态
        // 实例信息在EurekClient端上次被修改的时间
        @QueryParam("lastDirtyTimestamp") String lastDirtyTimestamp) {
    boolean isFromReplicaNode = "true".equals(isReplication);
    // 续租(心跳)
    boolean isSuccess = registry.renew(app.getName(), id, isFromReplicaNode);
    // Not found in the registry, immediately ask for a register
    // 续租失败，返回404，EurekaClient端收到404后会发起注册请求
    if (!isSuccess) {
        logger.warn("Not Found (Renew): {} - {}", app.getName(), id);
        return Response.status(Status.NOT_FOUND).build();
    }
    // Check if we need to sync based on dirty time stamp, the client
    // instance might have changed some value
    Response response = null;
    if (lastDirtyTimestamp != null && serverConfig.shouldSyncWhenTimestampDiffers()) {
        // 验证传入的lastDirtyTimestamp和EurekaServer端保存的lastDirtyTimestamp是否相同
        response = this.validateDirtyTimestamp(Long.valueOf(lastDirtyTimestamp), isFromReplicaNode);
        // Store the overridden status since the validation found out the node that replicates wins
        if (response.getStatus() == Response.Status.NOT_FOUND.getStatusCode()
                && (overriddenStatus != null)
                && !(InstanceStatus.UNKNOWN.name().equals(overriddenStatus))
                && isFromReplicaNode) {
            registry.storeOverriddenStatusIfRequired(app.getAppName(), id, InstanceStatus.valueOf(overriddenStatus));
        }
    } else {
        // 续约成功，返回200
        response = Response.ok().build();
    }
    logger.debug("Found (Renew): {} - {}; reply status={}", app.getName(), id, response.getStatus());
    return response;
}
```

- 在boolean isSuccess = registry.renew(app.getName(), id, isFromReplicaNode);这里调用了PeerAwareInstanceRegistryImpl的renew(appName, id, isReplication)方法，代码如下：

```java
public boolean renew(final String appName, final String id, final boolean isReplication) {
    // 调用父类里的renew(appName, id, isReplication)方法续约
    if (super.renew(appName, id, isReplication)) {
        // 如果是续约请求则向其他EurekaServer节点同步续约信息
        // 如果是同步信息请求则直接返回
        replicateToPeers(Action.Heartbeat, appName, id, null, null, isReplication);
        return true;
    }
    return false;
}
```

- AbstractInstanceRegistry的renew(appName, id, isReplication)方法代码如下：

```java
public boolean renew(String appName, String id, boolean isReplication) {
    RENEW.increment(isReplication);
    // 根据实例名称取出实例信息集合
    Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
    Lease<InstanceInfo> leaseToRenew = null;
    if (gMap != null) {
        // 根据实例id取出具体实例租约信息
        leaseToRenew = gMap.get(id);
    }
    // 租约不存在
    if (leaseToRenew == null) {
        RENEW_NOT_FOUND.increment(isReplication);
        logger.warn("DS: Registry: lease doesn't exist, registering resource: {} - {}", appName, id);
        return false;
    } else {
        InstanceInfo instanceInfo = leaseToRenew.getHolder();
        if (instanceInfo != null) {
        // touchASGCache(instanceInfo.getASGName());
            // 获得实例的覆盖状态
            InstanceStatus overriddenInstanceStatus = this.getOverriddenInstanceStatus(
                    instanceInfo, leaseToRenew, isReplication);
            // 实例覆盖状态为UNKNOWN，续租失败
            if (overriddenInstanceStatus == InstanceStatus.UNKNOWN) {
                logger.info("Instance status UNKNOWN possibly due to deleted override for instance {}"
                        + "; re-register required", instanceInfo.getId());
                RENEW_NOT_FOUND.increment(isReplication);
                return false;
            }
            // 实例状态与覆盖状态不一致
            if (!instanceInfo.getStatus().equals(overriddenInstanceStatus)) {
                logger.info(
                        "The instance status {} is different from overridden instance status {} for instance {}. "
                                + "Hence setting the status to overridden status", instanceInfo.getStatus().name(),
                                instanceInfo.getOverriddenStatus().name(),
                                instanceInfo.getId());
                // 强行把实例的覆盖状态设为实例状态
                // 即status = overriddenInstanceStatus
                instanceInfo.setStatusWithoutDirty(overriddenInstanceStatus);
            }
        }
        renewsLastMin.increment();
        // 续租(设置lastUpdateTimestamp(租约最后更新时间))
        leaseToRenew.renew();
        return true;
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
