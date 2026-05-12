# 08、源码解析 EurekaClient 实例故障感知及自动摘除
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/8.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
EurekaClient实例故障感知及实例自动摘除机制源码解析

1、服务正常下线会调用 shutdown 方法去请求 Eureka Server 下线实例，但是可能有的时候服务是非正常结束的，他可能就不会调用 shutdown 方法，所以就不会去请求下线服务实例方法。

2、但是 Eureka 有自己的自动故障感知以及自动摘除实例的机制，那他是怎么实现的呢？

1、靠的就是心跳来感知，可能某个服务已经挂掉了，就不会再发送心跳了，如果在一段时间内没有接收到某个服务的心跳

2、我们之前看 EurekaServer启动源码知道，在启动的时候 registry.openForTraffic() 这个方法会开启过期的定时任务

## 1、故障感知源码解析

### 1.1 过期定时任务入口

```java
class EvictionTask extends TimerTask {
    private final AtomicLong lastExecutionNanosRef = new AtomicLong(0l);
    @Override
    public void run() {
        try {
            // 1、获取一个时间 
            long compensationTimeMs = getCompensationTimeMs();
            logger.info("Running the evict task with compensationTime {}ms", compensationTimeMs);
            // 2、执行过期任务 
            evict(compensationTimeMs);
        } catch (Throwable e) {
            logger.error("Could not run the evict task", e);
        }
    }
    // 这个方法放到 1.1.1 去分析
    long getCompensationTimeMs() {
     }
}
```

### 1.1.1 getCompensationTimeMs

```java
// 计算补偿时间，定义为自上次迭代以来执行此任务的实际时间，与配置的执行时间对比。 
// 这对于时间变化（例如由于时钟偏差或 gc）导致实际过期任务执行晚于根据配置的周期所需的时间的情况很有用。
/**
     * compute a compensation time defined as the actual time this task was executed since the prev iteration,
     * vs the configured amount of time for execution. This is useful for cases where changes in time (due to
     * clock skew or gc for example) causes the actual eviction task to execute later than the desired time
     * according to the configured cycle.
     */
// 这个是 EvictionTask 的内部方法，这里只是放到这里来分析
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
long getCurrentTimeNano() {
       // for testing
    return System.nanoTime();
}
```

### 1.1.2 evict(过期定时任务的具体方法)

**这个方法重点看一下过期的策略**

**1、每次过期的个数计算策略、**

**2、过期的时候取随机的实例(当然取的是需要过期的实例)**

```java
public void evict(long additionalLeaseMs) {
    logger.debug("Running the evict task");
    // 1、这里判断Lease 过期是否开启，如果没开启，则直接返回
    if (!isLeaseExpirationEnabled()) {
        logger.debug("DS: lease expiration is currently disabled.");
        return;
    }
    // 2、循环注册表，然后判断是否过期，如果过期的话添加到 expiredLeases 中去
    // We collect first all expired items, to evict them in random order. For large eviction sets,
    // if we do not that, we might wipe out whole apps before self preservation kicks in. By randomizing it,
    // the impact should be evenly distributed across all applications.
    List<Lease<InstanceInfo>> expiredLeases = new ArrayList<>();
    for (Entry<String, Map<String, Lease<InstanceInfo>>> groupEntry : registry.entrySet()) {
        Map<String, Lease<InstanceInfo>> leaseMap = groupEntry.getValue();
        if (leaseMap != null) {
            for (Entry<String, Lease<InstanceInfo>> leaseEntry : leaseMap.entrySet()) {
                Lease<InstanceInfo> lease = leaseEntry.getValue();
                // 这里判断 isExpired 的方法有一个 bug，我们来看一下
                if (lease.isExpired(additionalLeaseMs) && lease.getHolder() != null) {
                    expiredLeases.add(lease);
                }
            }
        }
    }
    // 3、获取注册表的大小、注册表设置的阈值、以及计算一下过期的 Limit(就是 2 者相减)
    // 为了补偿 GC 暂停或本地时间漂移，我们需要使用当前注册表大小作为触发自我保护的基础。没有它，我们将清除完整的注册表。
    // To compensate for GC pauses or drifting local time, we need to use current registry size as a base for
    // triggering self-preservation. Without that we would wipe out full registry.
    int registrySize = (int) getLocalRegistrySize();
    int registrySizeThreshold = (int) (registrySize * serverConfig.getRenewalPercentThreshold());
    int evictionLimit = registrySize - registrySizeThreshold;
    // 4、取过期 Limit和上面获取到的需要过期实例集合大小中的最小值
    // 也就是说，比如要过期 10 个实例，但是 evictionLimit 为 6，那其实就只会过期 6 个实例，并不会过期全部的实例
    int toEvict = Math.min(expiredLeases.size(), evictionLimit);
    if (toEvict > 0) {
        logger.info("Evicting {} items (expired={}, evictionLimit={})", toEvict, expiredLeases.size(), evictionLimit);
        // 4.1 new Random
        Random random = new Random(System.currentTimeMillis());
        for (int i = 0; i < toEvict; i++) {
            // 4.2 用 Random 去随机获取一个实例，然后去下线他
            // Pick a random item (Knuth shuffle algorithm)
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

#### 1.1.2.1 lease.isExpired(可以看一下，因为这里有一个 eureka 的 bug)

```java
/**
 * Checks if the lease of a given {@Linkcom.netflix.appinfo.InstanceInfo} has expired or not.
 *
 * Note that due to renew() doing the 'wrong" thing and setting lastUpdateTimestamp to +duration more than
 * what it should be, the expiry will actually be 2 * duration. This is a minor bug and should only affect
 * instances that ungracefully shutdown. Due to possible wide ranging impact to existing usage, this will
 * not be fixed.
 *
 * @param additionalLeaseMs any additional lease time to add to the lease evaluation in ms.
 */
public boolean isExpired(long additionalLeaseMs) {
    // 1、evictionTimestamp 因为 cancel 的时候会把 evictionTimestamp 设置为大于 0 的值
    // 2、当前时间否大于 lastUpdateTimestamp + duration + additionalLeasems
    /**
    * 1>、心跳的时候会更新 lastUpdateTimestamp > 因为 lastUpdateTimestamp 更新的时候 + duration。所以这个比较多了 90s,所以就是 180s 后才会过期(从上一次心跳时算起)
    * 2>、duration为 90s
    * 3>、additionalLeaseMs 为由于定时 gc、时钟漂移导致的时间差
    */
    return (evictionTimestamp > 0 || System.currentTimeMillis() > (lastUpdateTimestamp + duration + additionalLeaseMs));
}
// 这里续约的时候就是把当前时间 + duration。其实不用加的，所以这里导致了 isExpired 时产生的 bug
public void renew() {
    lastUpdateTimestamp = System.currentTimeMillis() + duration;
}
```

## 2、自动摘除

### 2.1 internalCancel(服务服务摘除)

> 这个方法在服务下线分析的时候已经分析过了，如果不明白的话，可以再看一下。

[EurekaClient服务下线源码解析](https://blog.csdn.net/yeyinzhu3211/article/details/122339730)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
