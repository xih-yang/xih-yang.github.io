# 05、Eureka 服务故障源码剖析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-3/5.html
- 分类：注册中心
- 分组：Eureka 教程（版本 C）
### Eureka-Server

eureka自动感知故障的任务，是在initEurekaServerContext()方法中调用的

```java
 protected void initEurekaServerContext() throws Exception {
    // 省略......
    // 启用自动感知故障调度任务
    registry.openForTraffic(applicationInfoManager, registryCount);
    // Register all monitoring statistics.
    EurekaMonitors.registerAllStats();
}
```

进入openForTraffic(applicationInfoManager, registryCount)方法

```java
public void openForTraffic(ApplicationInfoManager applicationInfoManager, int count) {
    //count 一般是不是为0的
    this.expectedNumberOfRenewsPerMin = count * 2;
    this.numberOfRenewsPerMinThreshold =
            (int) (this.expectedNumberOfRenewsPerMin * serverConfig.getRenewalPercentThreshold());
    // 省略......
    applicationInfoManager.setInstanceStatus(InstanceStatus.UP);
    // 服务实例摘除任务
    super.postInit();
}
```

count不为0的解释如下

```java
@Override
public int syncUp() {
    // Copy entire entry from neighboring DS node
    int count = 0;
    for (int i = 0; ((i < serverConfig.getRegistrySyncRetries()) && (count == 0)); i++) {
        if (i > 0) {
            try {
                Thread.sleep(serverConfig.getRegistrySyncRetryWaitMs());
            } catch (InterruptedException e) {
                logger.warn("Interrupted during registry transfer..");
                break;
            }
        }
        Applications apps = eurekaClient.getApplications();
        for (Application app : apps.getRegisteredApplications()) {
            for (InstanceInfo instance : app.getInstances()) {
                try {
                    if (isRegisterable(instance)) {
                        register(instance, instance.getLeaseInfo().getDurationInSecs(), true);
                        count++;
                    }
                } catch (Throwable t) {
                    logger.error("During DS init copy", t);
                }
            }
        }
    }
    return count;
}
```

如果count==0，线程会被阻塞30s，最多会重试5次，eurekaClient.getApplications()获取的是本地服务，eureka服务会每隔30s主动抓取注册表，然后放到本地服务容器中。

进入postInit()方法

```java
protected void postInit() {
    renewsLastMin.start();
    if (evictionTaskRef.get() != null) {
        evictionTaskRef.get().cancel();
    }
    evictionTaskRef.set(new EvictionTask());
    evictionTimer.schedule(evictionTaskRef.get(),
            serverConfig.getEvictionIntervalTimerInMs(),
            serverConfig.getEvictionIntervalTimerInMs());
}
```

每隔60s触发一次服务实例下线的任务

进入类EvictionTask

```java
class EvictionTask extends TimerTask {
private final AtomicLong lastExecutionNanosRef = new AtomicLong(0l);
@Override
public void run() {
    try {
        long compensationTimeMs = getCompensationTimeMs();
        logger.info("Running the evict task with compensationTime {}ms", compensationTimeMs);
        evict(compensationTimeMs);
    } catch (Throwable e) {
        logger.error("Could not run the evict task", e);
    }
}
```

getCompensationTimeMs()是计算一个补偿时间，进入long getCompensationTimeMs()方法

```java
long getCompensationTimeMs() {
    long currNanos = getCurrentTimeNano();
    long lastNanos = lastExecutionNanosRef.getAndSet(currNanos);
    if (lastNanos == 0l) {
        return 0l;
    }
    long elapsedMs = TimeUnit.NANOSECONDS.toMillis(currNanos - lastNanos);
    long compensationTime = elapsedMs - serverConfig.getEvictionIntervalTimerInMs();
    return compensationTime <= 0l ? 0l : compensationTime;
}
```

进入evict(long additionalLeaseMs)方法

```java
public void evict(long additionalLeaseMs) {
    // 省略......
    // 筛选出过期的续约服务
    List<Lease<InstanceInfo>> expiredLeases = new ArrayList<>();
    for (Entry<String, Map<String, Lease<InstanceInfo>>> groupEntry : registry.entrySet()) {
        Map<String, Lease<InstanceInfo>> leaseMap = groupEntry.getValue();
        if (leaseMap != null) {
            for (Entry<String, Lease<InstanceInfo>> leaseEntry : leaseMap.entrySet()) {
                Lease<InstanceInfo> lease = leaseEntry.getValue();
                if (lease.isExpired(additionalLeaseMs) && lease.getHolder() != null) {
                    expiredLeases.add(lease);
                }
            }
        }
    }
    int registrySize = (int) getLocalRegistrySize();
    int registrySizeThreshold = (int) (registrySize * serverConfig.getRenewalPercentThreshold());
    int evictionLimit = registrySize - registrySizeThreshold;
    // 计算最多摘除的服务实例
    int toEvict = Math.min(expiredLeases.size(), evictionLimit);
    if (toEvict > 0) {
        logger.info("Evicting {} items (expired={}, evictionLimit={})", toEvict, expiredLeases.size(), evictionLimit);
        Random random = new Random(System.currentTimeMillis());
        for (int i = 0; i < toEvict; i++) {
            // 公平洗牌算法
            int next = i + random.nextInt(expiredLeases.size() - i);
            Collections.swap(expiredLeases, i, next);
            Lease<InstanceInfo> lease = expiredLeases.get(i);
            String appName = lease.getHolder().getAppName();
            String id = lease.getHolder().getId();
            EXPIRED.increment();
            logger.warn("DS: Registry: expired lease for {}/{}", appName, id);
            internalCancel(appName, id, false);
        }
    }
}
```

进入isExpired(long additionalLeaseMs)方法

```java
public boolean isExpired(long additionalLeaseMs) {
        return (evictionTimestamp > 0 || System.currentTimeMillis() > (lastUpdateTimestamp + duration + additionalLeaseMs));
}
```

可以看到lastUpdateTimestamp + duration,duration=90s,而lastUpdateTimestamp是在续约时候设置的

```java
public void renew() {
    lastUpdateTimestamp = System.currentTimeMillis() + duration;
}
```

所以真正超时的时间是180s。

通过定时任务自动感知故障摘除服务实例不会在集群间同步，它应该通过抓取注册表来达到集群间的一致。

备注：eureka-client下线也可以通过调用DiscoveryClient的shutdown()方法，手动触发。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/manongxx/category_10951792.html
