# 09、Eureka 源码解析 - Eureka Server 服务过期
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/9.html
- 分类：注册中心
- 分组：教程目录
下面是官方提供的 Eureka 架构图：

### 1、Eureka Server 为什么要服务过期

正常情况下，应用实例下线时候会主动向 Eureka-Server 发起下线请求，也就是我们之前分析的 – [8、Eureka 源码解析 之 Eureka Client 服务下线](/zhuanlan/registered/eureka/1/8.html)。但实际情况下，应用实例可能异常崩溃，又或者是网络异常等原因，导致下线请求无法被成功提交。

这种情况之后，需要 Eureka Client 定时向 Eureka Server 发送续约配合 Eureka Client 通过定时任务清理超时的租约解决上述异常。

### 2、EvictionTask

`EvictionTask` 是清理租约过期任务，下面是它的调用时序图：

当Eureka Server 启动的时候就会调用实现了 Java Servlet 规范 `ServletContextListener` 监听器的 `EurekaBootStrap` 到调用初始化注册服务 `AbstractInstanceRegistry`。然后会启用以下几个定时任务：

- MeasuredRate，统计定时任务，在 AbstractInstanceRegistry 的构建器创建 MeasuredRate 对象的时候传入 1000 * 60 * 1，然后在这里调用它的 start 方法里面有一个定时任务，每隔 60 秒也就是每隔 1 分钟执行一次。这个定时任务里面有 2 个 AtomicLong 类型的参数。一个是 AtomicLong currentBucket 每进行一次续约的时候就会调用它 + 1，另一个是AtomicLong lastBucket当MeasuredRate任务每分钟进行执行的时候就会把AtomicLong currentBucket 里面的值设置到AtomicLong lastBucket当中去，然后把AtomicLong currentBucket值清空。然后通过获取 AtomicLong lastBucket 的值就能够得到最近一分钟续约的次数(**最近一分钟续约的次数这个在后面要讲的 Eureka Server 自我保护机制当中会使用到)**
- 另外一个就是定时调用 EvictionTask 任务，过期注册表中超时续约的应用。默认 60 秒执行一次

### 3、服务过期

下面我们来分析一下服务过期的逻辑：

> EvictionTask

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
        /**
         * compute a compensation time defined as the actual time this task was executed since the prev iteration,
         * vs the configured amount of time for execution. This is useful for cases where changes in time (due to
         * clock skew or gc for example) causes the actual eviction task to execute later than the desired time
         * according to the configured cycle.
         */
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
    }
```

> compute a compensation time defined as the actual time this task was executed since the prev iteration,
>
> vs the configured amount of time for execution. This is useful for cases where changes in time (due to
>
> clock skew or gc for example) causes the actual eviction task to execute later than the desired time
>
> according to the configured cycle.

首先它会调用 `getCompensationTimeMs` 方法计算一个补偿时间，由于 JVM GC ，又或是时间偏移( clock skew ) 等原因，定时器执行实际比预期会略有延迟。

传入计算获取到的补偿时间，调用 `evict` 方法过期超时续约的应用。

> AbstractInstanceRegistry#evict

```java
    public void evict(long additionalLeaseMs) {
        logger.debug("Running the evict task");
        if (!isLeaseExpirationEnabled()) {
            logger.debug("DS: lease expiration is currently disabled.");
            return;
        }
        // We collect first all expired items, to evict them in random order. For large eviction sets,
        // if we do not that, we might wipe out whole apps before self preservation kicks in. By randomizing it,
        // the impact should be evenly distributed across all applications.
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
        // To compensate for GC pauses or drifting local time, we need to use current registry size as a base for
        // triggering self-preservation. Without that we would wipe out full registry.
        int registrySize = (int) getLocalRegistrySize();
        int registrySizeThreshold = (int) (registrySize * serverConfig.getRenewalPercentThreshold());
        int evictionLimit = registrySize - registrySizeThreshold;
        int toEvict = Math.min(expiredLeases.size(), evictionLimit);
        if (toEvict > 0) {
            logger.info("Evicting {} items (expired={}, evictionLimit={})", toEvict, expiredLeases.size(), evictionLimit);
            Random random = new Random(System.currentTimeMillis());
            for (int i = 0; i < toEvict; i++) {
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

- 首先会判断 Eureka Server 是否开启的自我保护机制，如果开启了自我保护机制(**下一篇博客会讲**)
- 首先遍历注册表注册的应用列表，找到所有续约过期的应用实例列表。过期判断条件是：当前时间 > 最后一次续约时间 + 90 秒 + 补偿时间。
- 然后调用 getLocalRegistrySize 获取当前注册列表中应用实例的个数
- 接着通过下面的公式获取一个期望过期的个数 evictionLimit。evictionLimit = 注册列表所有应用实例的个数 - 注册列表所有应用实例的个数 * 获得续订的最小百分比(默认 0.85)。也就是：期望过期的个数 = 应用实例 * 0.15。如果有20 个服务应用那么这个值就是 3.
- 然后取第一步获取到续约过期的应用实例个数与期望过期的应用实例个数的最小值
- 如果这个最小值大于 0，就随机过期续约过期的应用实例列表里面的应用实例并且**调用内部取消逻辑(之前服务下线分析过)**

如果Eureka Client 默认会每 30 秒发送心跳到 Eureka Server。如果 Eureka Server 在进行服务过期判断的时候也就是：**最后一次续约时间 + 90 秒 + 补偿时间小于系统当前时间**就会以服务进行过期。

有以下两点需要注意一下：

- Eureka Client 在进行续约的时候是把 lastUpdateTimestamp 设置成系统的当前时间 + 90 秒。然后 Eureka Server 在进行服务过期判断的时候是：**最后一次续约时间 + 90 秒 + 补偿时间小于系统当前时间**就会以服务进行过期。最后在 Eureka Client 拉取注册表是每 30 秒进行拉取。所以一个服务不可用时其它服务需要感知到这个服务不可用就需要：90 秒 + 90 秒 + 30 秒 = 210秒，也就是 3 分半 才能感知到
- Eureka Server 在服务过期的时候会根据：应用实例 * 0.15 与 心跳过期应用个数随机顺序将它们剔除出去。因为对于需要大量剔除服务应用时，如果我们不这样做，我们可能会在 Eureka 自我保护开始之前清除整个应用程序。通过随机化,影响应该均匀分布在所有应用程序中。
