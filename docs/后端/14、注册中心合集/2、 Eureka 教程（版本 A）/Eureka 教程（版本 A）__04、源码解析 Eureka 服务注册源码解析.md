# 04、源码解析 Eureka 服务注册源码解析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/4.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
Eureka服务注册源码解析

## 客户端注册逻辑源码解析

## 1.1 看一下 debug 后服务端的堆栈调用

register:183, AbstractInstanceRegistry (com.netflix.eureka.registry)

register:419, PeerAwareInstanceRegistryImpl (com.netflix.eureka.registry)

register:92, InstanceRegistry (org.springframework.cloud.netflix.eureka.server)

addInstance:185, ApplicationResource (com.netflix.eureka.resources)

因为之前已经分析过，jersey 请求最终都会到 Resource 下去做具体的操作

1、看堆栈调用可以知道是调用到 ApplicationResource 的 addInstance 方法

2、最终就是PeerAwareInstanceRegistryImpl(内部会调用父类的 register)

3、集群节点同步(如果有多个 eureka 节点就会把这个节点的数据同步过去)

## 1.2 服务调用流程图

## 1.3 register(服务注册方法)

> 看一个最终调用的 register 方法，就是 com.netflix.eureka.registry.AbstractInstanceRegistry#register

```java
public void register(InstanceInfo registrant, int leaseDuration, boolean isReplication) {
    try {
        read.lock();
        // 从注册表中获取 Lease 信息
        Map<String, Lease<InstanceInfo>> gMap = registry.get(registrant.getAppName());
        REGISTER.increment(isReplication);
        if (gMap == null) {
            final ConcurrentHashMap<String, Lease<InstanceInfo>> gNewMap = new ConcurrentHashMap<String, Lease<InstanceInfo>>();
            gMap = registry.putIfAbsent(registrant.getAppName(), gNewMap);
            if (gMap == null) {
                gMap = gNewMap;
            }
        }
        Lease<InstanceInfo> existingLease = gMap.get(registrant.getId());
        // 这里就是判断一下 lease 是否存在，存在的话进入 if 中
        if (existingLease != null && (existingLease.getHolder() != null)) {
            // 这里就是对比一下时间戳，如果新的时间戳小于已存在的时间戳，说明并不是最新的，应该还是使用已存在的实例信息
            Long existingLastDirtyTimestamp = existingLease.getHolder().getLastDirtyTimestamp();
            Long registrationLastDirtyTimestamp = registrant.getLastDirtyTimestamp();        
            // this is a > instead of a >= because if the timestamps are equal, we still take the remote transmitted
            // InstanceInfo instead of the server local copy.
            if (existingLastDirtyTimestamp > registrationLastDirtyTimestamp) {
       			// 省略了 log 打印的信息
                registrant = existingLease.getHolder();
            }
        } else {
            // 这里说明  lease 不存在，说明是新的注册
            // The lease does not exist and hence it is a new registration
            // 这里使用 synchronized 控制多线程并发操作
            synchronized (lock) {
                if (this.expectedNumberOfRenewsPerMin > 0) {
                	// 新的节点注册，期望心跳数= 原来的期望心跳数 + 2
                    this.expectedNumberOfRenewsPerMin = this.expectedNumberOfRenewsPerMin + 2;
                    // 心跳数阈值 = 期望心跳数 * 0.85 
                    this.numberOfRenewsPerMinThreshold =
                            (int) (this.expectedNumberOfRenewsPerMin * serverConfig.getRenewalPercentThreshold());
                }
            }
            logger.debug("No previous lease information found; it is new registration");
        }
        Lease<InstanceInfo> lease = new Lease<InstanceInfo>(registrant, leaseDuration);
        if (existingLease != null) {
            // 实例启动的时间，是不变的，如果 existingLease 不为空，就把 serviceUpTimestamp 赋值为原来的
            lease.setServiceUpTimestamp(existingLease.getServiceUpTimestamp());
        }
        gMap.put(registrant.getId(), lease);
        // 最近注册的 queue 添加一下实例信息
        synchronized (recentRegisteredQueue) {
            recentRegisteredQueue.add(new Pair<Long, String>(
                    System.currentTimeMillis(),
                    registrant.getAppName() + "(" + registrant.getId() + ")"));
        }
        // 状态覆盖的一些操作
        // This is where the initial state transfer of overridden status happens
        if (!InstanceStatus.UNKNOWN.equals(registrant.getOverriddenStatus())) {
            logger.debug("Found overridden status {} for instance {}. Checking to see if needs to be add to the "
                            + "overrides", registrant.getOverriddenStatus(), registrant.getId());
            if (!overriddenInstanceStatusMap.containsKey(registrant.getId())) {
                logger.info("Not found overridden id {} and hence adding it", registrant.getId());
                overriddenInstanceStatusMap.put(registrant.getId(), registrant.getOverriddenStatus());
            }
        }
        InstanceStatus overriddenStatusFromMap = overriddenInstanceStatusMap.get(registrant.getId());
        if (overriddenStatusFromMap != null) {
            logger.info("Storing overridden status {} from map", overriddenStatusFromMap);
            registrant.setOverriddenStatus(overriddenStatusFromMap);
        }
        InstanceStatus overriddenInstanceStatus = getOverriddenInstanceStatus(registrant, existingLease, isReplication);
        registrant.setStatusWithoutDirty(overriddenInstanceStatus);
        // If the lease is registered with UP status, set lease service up timestamp
        if (InstanceStatus.UP.equals(registrant.getStatus())) {
            // 设置启动时间(第 1 次调用有效，后续的调用不会生效)
            lease.serviceUp();
        }
        /**
         * 1、设置事件类型(register 就是 ADDED，如果 cancel[下线] 就是 DELETED)
         * 2、添加到最近更改的队列中去
         * 3、更新最后一次更新的时间
         */
        registrant.setActionType(ActionType.ADDED);
        recentlyChangedQueue.add(new RecentlyChangedItem(lease));
        registrant.setLastUpdatedTimestamp();
        // 失效缓存(可能实例信息变更了，所以把原来的缓存失效掉)
        invalidateCache(registrant.getAppName(), registrant.getVIPAddress(), registrant.getSecureVipAddress());
        logger.info("Registered instance {}/{} with status {} (replication={})",
                registrant.getAppName(), registrant.getId(), registrant.getStatus(), isReplication);
    } finally {
        read.unlock();
    }
}
```

## 1.4 replicateToPeers(信息复制到其他 peer 中)

> Replicates all eureka actions to peer eureka nodes except for replication traffic to this node.
>
> 将所有 eureka 操作复制到其他的 eureka 节点，复制到此节点的流量除外(排除自己)

```java
private void replicateToPeers(Action action, String appName, String id,
                              InstanceInfo info /* optional */,
                              InstanceStatus newStatus /* optional */, boolean isReplication) {
    Stopwatch tracer = action.getTimer().start();
    try {
        // 如果是 replication，则把上一分钟的 replication 操作+1(numberOfReplicationsLastMin是一个 MeasureRate，主要用于统计信息)
        if (isReplication) {
            numberOfReplicationsLastMin.increment();
        }
        // 如果已经复制过了，就不要再复制了
        // If it is a replication already, do not replicate again as this will create a poison replication
        if (peerEurekaNodes == Collections.EMPTY_LIST || isReplication) {
            return;
        }
        // 这里就是执行同步操作到 eureka 其他节点
        for (final PeerEurekaNode node : peerEurekaNodes.getPeerEurekaNodes()) {
            // If the url represents this host, do not replicate to yourself.
            if (peerEurekaNodes.isThisMyUrl(node.getServiceUrl())) {
                continue;
            }
            replicateInstanceActionsToPeers(action, appName, id, info, newStatus, node);
        }
    } finally {
        tracer.stop();
    }
}
```

## 1.4.1 replicateInstanceActionsToPeers(复制实例变化到其他的 eureka 节点)

```java
private void replicateInstanceActionsToPeers(Action action, String appName,
                                             String id, InstanceInfo info, InstanceStatus newStatus,
                                             PeerEurekaNode node) {
    try {
        InstanceInfo infoFromRegistry = null;
        CurrentRequestVersion.set(Version.V2);
        // 根据 action 去做不同的操作
        switch (action) {
            // 取消
            case Cancel:
                node.cancel(appName, id);
                break;
            // 心跳
            case Heartbeat:
                InstanceStatus overriddenStatus = overriddenInstanceStatusMap.get(id);
                infoFromRegistry = getInstanceByAppAndId(appName, id, false);
                node.heartbeat(appName, id, infoFromRegistry, overriddenStatus, false);
                break;
            // 注册
            case Register:
                node.register(info);
                break;
            // 状态变更
            case StatusUpdate:
                infoFromRegistry = getInstanceByAppAndId(appName, id, false);
                node.statusUpdate(appName, id, newStatus, infoFromRegistry);
                break;
            //删除状态覆盖
            case DeleteStatusOverride:
                infoFromRegistry = getInstanceByAppAndId(appName, id, false);
                node.deleteStatusOverride(appName, id, infoFromRegistry);
                break;
        }
    } catch (Throwable t) {
        logger.error("Cannot replicate information to {} for action {}", node.getServiceUrl(), action.name(), t);
    }
}
```

### 1.4.1.1 node.register

```java
public void register(final InstanceInfo info) throws Exception {
    long expiryTime = System.currentTimeMillis() + getLeaseRenewalOf(info);
    // 这里是一个很重要的点通过把任务给一个 batchingDispatcher 来处理任务。
    batchingDispatcher.process(
            taskId("register", info),
            new InstanceReplicationTask(targetHost, Action.Register, info, null, true) {
                public EurekaHttpResponse<Void> execute() {
                    return replicationClient.register(info);
                }
            },
            expiryTime
    );
}
```

我们先来简单了解一下 TaskDispatcher，后面集群同步的时候会重点去剖析一下内部的 3 层队列实现

```java
/**
* 1、TaskDispatcher 从客户端获取任务
* 2、然后委派这些任务给多个 Worker(这些 worker 可以配置)
* 3、任务可以单个执行也可以批量执行
* 4、只有不过期的任务才会执行，如果新的任务 id 与之前的重复，则旧的被丢弃
* 5、按需延迟分配给 Worker，保证数据始终是最新的，并且不会发生旧的任务处理。
*/
/**
 * Task dispatcher takes task from clients, and delegates their execution to a configurable number of workers.
 * The task can be processed one at a time or in batches. Only non-expired tasks are executed, and if a newer
 * task with the same id is scheduled for execution, the old one is deleted. Lazy dispatch of work (only on demand)
 * to workers, guarantees that data are always up to date, and no stale task processing takes place.
 * <h3>Task processor</h3>
 * A client of this component must provide an implementation of {@LinkTaskProcessor} interface, which will do
 * the actual work of task processing. This implementation must be thread safe, as it is called concurrently by
 * multiple threads.
 * <h3>Execution modes</h3>
 * To create non batched executor call {@LinkTaskDispatchers#createNonBatchingTaskDispatcher(String, int, int, long, long, TaskProcessor)}
 * method. Batched executor is created by {@LinkTaskDispatchers#createBatchingTaskDispatcher(String, int, int, int, long, long, TaskProcessor)}.
 *
 * @author Tomasz Bak
 */
public interface TaskDispatcher<ID, T> {
    void process(ID id, T task, long expiryTime);
    void shutdown();
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
