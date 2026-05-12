# 03、Eureka 服务续约源码剖析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-3/3.html
- 分类：注册中心
- 分组：Eureka 教程（版本 C）
### Eureka-Client发送心跳

```java
private void initScheduledTasks() {
    // 省略......
    if (clientConfig.shouldRegisterWithEureka()) {
        int renewalIntervalInSecs = instanceInfo.getLeaseInfo().getRenewalIntervalInSecs();
        int expBackOffBound = clientConfig.getHeartbeatExecutorExponentialBackOffBound();
        logger.info("Starting heartbeat executor: " + "renew interval is: " + renewalIntervalInSecs);
        // Heartbeat timer
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
        // 省略......
}
```

发送心跳是一个定时任务， 每隔30s发送一次

进入HeartbeatThread的run方法

```java
public void run() {
    if (renew()) {
        lastSuccessfulHeartbeatTimestamp = System.currentTimeMillis();
    }
}
```

进入renew()方法

```java
boolean renew() {
    EurekaHttpResponse<InstanceInfo> httpResponse;
    try {
        httpResponse = eurekaTransport.registrationClient.sendHeartBeat(instanceInfo.getAppName(), instanceInfo.getId(), instanceInfo, null);
        logger.debug("{} - Heartbeat status: {}", PREFIX + appPathIdentifier, httpResponse.getStatusCode());
        if (httpResponse.getStatusCode() == 404) {
            // 这种情况发生于心跳间断，服务实例被摘除
            REREGISTER_COUNTER.increment();
            logger.info("{} - Re-registering apps/{}", PREFIX + appPathIdentifier, instanceInfo.getAppName());
            long timestamp = instanceInfo.setIsDirtyWithTime();
            boolean success = register();
            if (success) {
                instanceInfo.unsetIsDirty(timestamp);
            }
            return success;
        }
        return httpResponse.getStatusCode() == 200;
    } catch (Throwable e) {
        logger.error("{} - was unable to send heartbeat!", PREFIX + appPathIdentifier, e);
        return false;
    }
}
```

renew()方法和register()方法一样，都是发送http请求。

### Eureka-Server接收心跳

eureka-server接收心跳的代码位置

```java
public boolean renew(String appName, String id, boolean isReplication) {
    RENEW.increment(isReplication);
    Map<String, Lease<InstanceInfo>> gMap = registry.get(appName);
    Lease<InstanceInfo> leaseToRenew = null;
    if (gMap ! = null) {
        leaseToRenew = gMap.get(id);
    }
    if (leaseToRenew == null) {
        RENEW_NOT_FOUND.increment(isReplication);
        logger.warn("DS: Registry: lease doesn't exist, registering resource: {} - {}", appName, id);
        return false;
    } else {
        InstanceInfo instanceInfo = leaseToRenew.getHolder();
        if (instanceInfo != null) {
            // touchASGCache(instanceInfo.getASGName());
            InstanceStatus overriddenInstanceStatus = this.getOverriddenInstanceStatus(
                    instanceInfo, leaseToRenew, isReplication);
            if (overriddenInstanceStatus == InstanceStatus.UNKNOWN) {
                logger.info("Instance status UNKNOWN possibly due to deleted override for instance {}"
                        + "; re-register required", instanceInfo.getId());
                RENEW_NOT_FOUND.increment(isReplication);
                return false;
            }
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
        // 每个服务实例每次心跳都要计数
        renewsLastMin.increment();
        leaseToRenew.renew();
        return true;
    }
}
```

进入renew()方法

```java
public void renew() {
    lastUpdateTimestamp = System.currentTimeMillis() + duration;
}
```

实际上更新的是续约时间，延长90s。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/manongxx/category_10951792.html
