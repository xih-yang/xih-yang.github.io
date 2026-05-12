# 05、Eureka 源码解析之 Eureka Server源码解析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-2/5.html
- 分类：注册中心
- 分组：Eureka 教程（版本 B）
EurekaServerAutoConfiguration 是通过配置文件注册（@Bean)。EurekaServer 是服务的注册中心，负责Eureka Client的相关信息注册，主要职责

- 服务注册
- 接受心跳服务
- 服务剔除: 由eurekaServer主动剔除 心跳超时的服务
- 服务下线: 由 eurekaClient主动发送下线通知后，由eurekaServer接收后，删除服务
- 集群同步

首先找到 spring-cloud-netflix-eureka-server.xxx.jar下META-INF中的spring.factories文件:

EurekaServerAutoConfiguration 是通过配置文件注册,并由spring boot完成加载. 在这个配置类中，它创建了 PeerAwareInstanceRegistry的对象. 这个对象主要是基于 节点感知的实例信息注册.

```java
@Bean
public PeerAwareInstanceRegistry peerAwareInstanceRegistry(
		ServerCodecs serverCodecs) {
	this.eurekaClient.getApplications(); // force initialization
	return new InstanceRegistry(this.eurekaServerConfig, this.eurekaClientConfig,
			serverCodecs, this.eurekaClient,
			this.instanceRegistryProperties.getExpectedNumberOfClientsSendingRenews(),
			this.instanceRegistryProperties.getDefaultOpenForTrafficCount());
}
```

**PeerWareInstanceRegistry的类层次结构如下:**

让我们来重点分析一下这些类与接口，它们都有关于实例的注册信息.

先看最上层的接口 LeaseManager: 它定义了一般的操作.

```java
//租约管理接口   租约指的就是客户端在服务端的服务注册信息
public interface LeaseManager<T> {
    //注册
    void register(T var1, int var2, boolean var3);
    //下线
    boolean cancel(String var1, String var2, boolean var3);
    //更新
    boolean renew(String var1, String var2, boolean var3);
    //服务剔除
    void evict();
}
```

`com.netflix.eureka.registry.InstanceRegistry`，**应用实例**注册表**接口**。它继承了 LookupService 、LeaseManager 接口，提供应用实例的**注册**与**发现**服务。另外，它结合实际业务场景，定义了**更加丰富**的接口方法

```java
public interface InstanceRegistry extends LeaseManager<InstanceInfo>, LookupService<String> {
    // ====== 开启与关闭相关 ======
    void openForTraffic(ApplicationInfoManager applicationInfoManager, int count);
    void shutdown();
    void clearRegistry();
    // ====== 应用实例状态变更相关 ======
    void storeOverriddenStatusIfRequired(String appName, String id, InstanceStatus overriddenStatus);
    boolean statusUpdate(String appName, String id, InstanceStatus newStatus,
                         String lastDirtyTimestamp, boolean isReplication);
    boolean deleteStatusOverride(String appName, String id, InstanceStatus newStatus,
                                 String lastDirtyTimestamp, boolean isReplication);
    Map<String, InstanceStatus> overriddenInstanceStatusesSnapshot();
    // ====== 响应缓存相关 ======
    void initializedResponseCache();
    ResponseCache getResponseCache();
    // ====== 自我保护模式相关 ======
    long getNumOfRenewsInLastMin();
    int getNumOfRenewsPerMinThreshold();
    int isBelowRenewThresold();
    boolean isSelfPreservationModeEnabled();
    public boolean isLeaseExpirationEnabled();
    // ====== 调试/监控相关 ======
    List<Pair<Long, String>> getLastNRegisteredInstances();
    List<Pair<Long, String>> getLastNCanceledInstances();
}
```

而PeerAwareInstanceRegistryImpl是一个子类的实现，在上面的基础上扩展对集群的同步操作，使Eureaka Server集群信息保持一致.

```java
public interface PeerAwareInstanceRegistry extends InstanceRegistry {
    void init(PeerEurekaNodes peerEurekaNodes) throws Exception;
    int syncUp();   //同步
     boolean shouldAllowAccess(boolean remoteRegionRequired);
     void register(InstanceInfo info, boolean isReplication);  //注册
     void statusUpdate(final String asgName, final ASGResource.ASGStatus newStatus, final boolean isReplication);   //状态更新
}
```

1. 服务注册. com.netflix.eureka.registry.AbstractInstanceRegistry#register 这方法是负责服务的注册的

```java
public void register(InstanceInfo registrant, int leaseDuration, boolean isReplication) {
        try {
//获取读锁
            this.read.lock();
 //   gMap  其实可以发现，这里注册中心其实是个ConcurrentHashMap
 Map<String, Lease<InstanceInfo>> gMap = (Map)this.registry.get(registrant.getAppName());
            EurekaMonitors.REGISTER.increment(isReplication);
            if(gMap == null) {
                ConcurrentHashMap<String, Lease<InstanceInfo>> gNewMap = new ConcurrentHashMap();
                //key 为appName, 如果存在，返回存在的值，否则添加，返回null
                gMap = (Map)this.registry.putIfAbsent(registrant.getAppName(), gNewMap);
                if(gMap == null) {
                    gMap = gNewMap;
                }
            }
//根据instanceId获取实例的租约
            Lease<InstanceInfo> existingLease = (Lease)((Map)gMap).get(registrant.getId());
            if(existingLease != null && existingLease.getHolder() != null) {
                Long existingLastDirtyTimestamp = ((InstanceInfo)existingLease.getHolder()).getLastDirtyTimestamp();
                Long registrationLastDirtyTimestamp = registrant.getLastDirtyTimestamp();
//如果该实例的租约已经存在，比较最后的更新时间戳大小，取最大值的注册信息信息
                               if(existingLastDirtyTimestamp.longValue() > registrationLastDirtyTimestamp.longValue()) {
                    registrant = (InstanceInfo)existingLease.getHolder();
                }
            } else {
                Object var6 = this.lock;
//如果租约不存在，注册一个新的实例
                synchronized(this.lock) {
                    if(this.expectedNumberOfRenewsPerMin > 0) {
                        this.expectedNumberOfRenewsPerMin += 2;
                        this.numberOfRenewsPerMinThreshold = (int)((double)this.expectedNumberOfRenewsPerMin * this.serverConfig.getRenewalPercentThreshold());
                    }
                }
                logger.debug("No previous lease information found; it is new registration");
            }
//创建新的租约
            Lease<InstanceInfo> lease = new Lease(registrant, leaseDuration);
            if(existingLease != null) {
                lease.setServiceUpTimestamp(existingLease.getServiceUpTimestamp());
            }
//保存租约到map中
            ((Map)gMap).put(registrant.getId(), lease);
//获得最近注册队列
            AbstractInstanceRegistry.CircularQueue var20 = this.recentRegisteredQueue;
            synchronized(this.recentRegisteredQueue) {
                this.recentRegisteredQueue.add(new Pair(Long.valueOf(System.currentTimeMillis()), registrant.getAppName() + "(" + registrant.getId() + ")"));
            }
            if(!InstanceStatus.UNKNOWN.equals(registrant.getOverriddenStatus())) {
                logger.debug("Found overridden status {} for instance {}. Checking to see if needs to be add to the overrides", registrant.getOverriddenStatus(), registrant.getId());
                if(!this.overriddenInstanceStatusMap.containsKey(registrant.getId())) {
                    logger.info("Not found overridden id {} and hence adding it", registrant.getId());
                    this.overriddenInstanceStatusMap.put(registrant.getId(), registrant.getOverriddenStatus());
                }
            }
            InstanceStatus overriddenStatusFromMap = (InstanceStatus)this.overriddenInstanceStatusMap.get(registrant.getId());
            if(overriddenStatusFromMap != null) {
                logger.info("Storing overridden status {} from map", overriddenStatusFromMap);
                registrant.setOverriddenStatus(overriddenStatusFromMap);
            }
            InstanceStatus overriddenInstanceStatus = this.getOverriddenInstanceStatus(registrant, existingLease, isReplication);
            registrant.setStatusWithoutDirty(overriddenInstanceStatus);
            if(InstanceStatus.UP.equals(registrant.getStatus())) {
                lease.serviceUp();
            }
            registrant.setActionType(ActionType.ADDED);
            this.recentlyChangedQueue.add(new AbstractInstanceRegistry.RecentlyChangedItem(lease));
            registrant.setLastUpdatedTimestamp();
            this.invalidateCache(registrant.getAppName(), registrant.getVIPAddress(), registrant.getSecureVipAddress());
                   } finally {
//释放锁
            this.read.unlock();
        }
    }
```

2)接受心跳服务: 在Eureka Client完成服务的注册后，需要定时向Eureka Server发送心跳请求（默认30s）,维持自己在EurekaServer的租约有效性

```java
public boolean renew(String appName, String id, boolean isReplication) {
        EurekaMonitors.RENEW.increment(isReplication);
//根据appName获取服务集群租约集合
        Map<String, Lease<InstanceInfo>> gMap = (Map)this.registry.get(appName);
        Lease<InstanceInfo> leaseToRenew = null;
        if(gMap != null) {
            leaseToRenew = (Lease)gMap.get(id);
        }
//如果租约不存在，直接返回false
        if(leaseToRenew == null) {
            EurekaMonitors.RENEW_NOT_FOUND.increment(isReplication);
            logger.warn("DS: Registry: lease doesn't exist, registering resource: {} - {}", appName, id);
            return false;
        } else {
            InstanceInfo instanceInfo = (InstanceInfo)leaseToRenew.getHolder();
            if(instanceInfo != null) {
//得到服务的最终状态
                InstanceStatus overriddenInstanceStatus = this.getOverriddenInstanceStatus(instanceInfo, leaseToRenew, isReplication);
                if(overriddenInstanceStatus == InstanceStatus.UNKNOWN) {
//如果状态为UNKNOWN，取消续约
                    logger.info("Instance status UNKNOWN possibly due to deleted override for instance {}; re-register required", instanceInfo.getId());
                    EurekaMonitors.RENEW_NOT_FOUND.increment(isReplication);
                    return false;
                }
                if(!instanceInfo.getStatus().equals(overriddenInstanceStatus)) {
                    logger.info("The instance status {} is different from overridden instance status {} for instance {}. Hence setting the status to overridden status", new Object[]{instanceInfo.getStatus().name(), instanceInfo.getOverriddenStatus().name(), instanceInfo.getId()});
                    instanceInfo.setStatusWithoutDirty(overriddenInstanceStatus);
                }
            }
            this.renewsLastMin.increment();
//跟新续约有效时间
            leaseToRenew.renew();
            return true;
        }
    }
```

1. **服务剔除:** 如果Eureka Client在注册后，由于服务的崩溃或网络异常导致既没有续约，也没有下线，那么服务就处于不可知的状态，需要剔除这些服务 , 通过com.netflix.eureka.registry.AbstractInstanceRegistry#evict(long)完成, 这是个定时任务调用的方法. 在com.netflix.eureka.registry.AbstractInstanceRegistry#postInit 中使用 AbstractInstanceRegistry.EvictionTask 负责调用(默认60s)

```java
public void evict(long additionalLeaseMs) {
        logger.debug("Running the evict task");
//如果自我保护状态，不允许剔除服务 配置项:   enable-self-preservation: true
        if(!this.isLeaseExpirationEnabled()) {  //             
logger.debug("DS: lease expiration is currently disabled.");
        } else {
            List<Lease<InstanceInfo>> expiredLeases = new ArrayList();
        //遍历注册表registry，获取所有过期的租约
            Iterator var4 = this.registry.entrySet().iterator();
            while(true) {
                Map leaseMap;
                do {
                    if(!var4.hasNext()) {
//获取注册表租约总数
                        int registrySize = (int)this.getLocalRegistrySize();
                        int registrySizeThreshold = (int)((double)registrySize * this.serverConfig.getRenewalPercentThreshold());
//计算最多允许剔除的阈值
                        int evictionLimit = registrySize - registrySizeThreshold;
//两者中取小的值，为本次剔除的数量
                        int toEvict = Math.min(expiredLeases.size(), evictionLimit);
                        if(toEvict > 0) {
                            logger.info("Evicting {} items (expired={}, evictionLimit={})", new Object[]{Integer.valueOf(toEvict), Integer.valueOf(expiredLeases.size()), Integer.valueOf(evictionLimit)});
                            Random random = new Random(System.currentTimeMillis());
             //逐个剔除
                            for(int i = 0; i < toEvict; ++i) {
                                int next = i + random.nextInt(expiredLeases.size() - i);
                                Collections.swap(expiredLeases, i, next);
                                Lease<InstanceInfo> lease = (Lease)expiredLeases.get(i);
                                String appName = ((InstanceInfo)lease.getHolder()).getAppName();
                                String id = ((InstanceInfo)lease.getHolder()).getId();
                                EurekaMonitors.EXPIRED.increment();
                                logger.warn("DS: Registry: expired lease for {}/{}", appName, id);
                          //剔除
                                this.internalCancel(appName, id, false);
                            }
                        }
                        return;
                    }
                    Entry<String, Map<String, Lease<InstanceInfo>>> groupEntry = (Entry)var4.next();
                    leaseMap = (Map)groupEntry.getValue();
                } while(leaseMap == null);
                Iterator var7 = leaseMap.entrySet().iterator();
                while(var7.hasNext()) {
                    Entry<String, Lease<InstanceInfo>> leaseEntry = (Entry)var7.next();
                    Lease<InstanceInfo> lease = (Lease)leaseEntry.getValue();
                    if(lease.isExpired(additionalLeaseMs) && lease.getHolder() != null) {
                        expiredLeases.add(lease);
                    }
                }
            }
        }
    }
```

1. 服务下线: EurekaClient在应用销毁时候，会向Eureka Server发送下线请求对于服务端的服务下线，其主要代码对应在com.netflix.eureka.registry.AbstractInstanceRegistry#cancel.

```java
public boolean cancel(String appName, String id, boolean isReplication) {
        return this.internalCancel(appName, id, isReplication);
    }
    protected boolean internalCancel(String appName, String id, boolean isReplication) {
        boolean var10;
        try {
//读锁，防止被其他线程进行修改
            this.read.lock();
            EurekaMonitors.CANCEL.increment(isReplication);
//根据appName获取服务实例集群
            Map<String, Lease<InstanceInfo>> gMap = (Map)this.registry.get(appName);
            Lease<InstanceInfo> leaseToCancel = null;
//移除服务实例租约
            if(gMap != null) {
                leaseToCancel = (Lease)gMap.remove(id);
            }
            AbstractInstanceRegistry.CircularQueue var6 = this.recentCanceledQueue;
            synchronized(this.recentCanceledQueue) {
                this.recentCanceledQueue.add(new Pair(Long.valueOf(System.currentTimeMillis()), appName + "(" + id + ")"));
            }
            InstanceStatus instanceStatus = (InstanceStatus)this.overriddenInstanceStatusMap.remove(id);
            if(instanceStatus != null) {
                logger.debug("Removed instance id {} from the overridden map which has value {}", id, instanceStatus.name());
            }
//租约不存在，返回false
            if(leaseToCancel == null) {
                EurekaMonitors.CANCEL_NOT_FOUND.increment(isReplication);
                logger.warn("DS: Registry: cancel failed because Lease is not registered for: {}/{}", appName, id);
                boolean var17 = false;
                return var17;
            }
       //设置租约的下线时间
            leaseToCancel.cancel();
            InstanceInfo instanceInfo = (InstanceInfo)leaseToCancel.getHolder();
            String vip = null;
            String svip = null;
            if(instanceInfo != null) {
                instanceInfo.setActionType(ActionType.DELETED);
                this.recentlyChangedQueue.add(new AbstractInstanceRegistry.RecentlyChangedItem(leaseToCancel));
                instanceInfo.setLastUpdatedTimestamp();
                vip = instanceInfo.getVIPAddress();
                svip = instanceInfo.getSecureVipAddress();
            }
//设置缓存过期
            this.invalidateCache(appName, vip, svip);
            logger.info("Cancelled instance {}/{} (replication={})", new Object[]{appName, id, Boolean.valueOf(isReplication)});
            var10 = true;
        } finally {
            //释放锁
            this.read.unlock();
        }
        return var10;
    }
```

1. **集群同步**

如果Eureka Server是通过集群方式进行部署，为了为维护整个集群中注册表数据一致性所以集群同步也是非常重要得事情。

集群同步分为两部分:

**1、** EurekaServer在启动过程中从他的peer节点中拉取注册表信息，并将这些服务实例注册到本地注册表中；

**2、** 另外eurekaserver每次对本地注册表进行操作时，同时会将操作同步到他的peer节点中，达到数据一致；

**5、** 1)EurekaServer初始化本地注册表信息:；

在eureka server启动过程中，会从它的peer节点中拉取注册表来初始化本地注册表，这部分主要通过com.netflix.eureka.registry.PeerAwareInstanceRegistryImpl#syncUp ,他从可能存在的peer节点中，拉取peer节点中的注册表信息，并将其中的服务实例的信息注册到本地注册表中。

```java
public int syncUp() {
        // Copy entire entry from neighboring DS node
        int count = 0;
// serverConfig指的就是服务器配置信息,即要同步的eureka服务器列表
        for (int i = 0; ((i < serverConfig.getRegistrySyncRetries()) && (count == 0)); i++) {
            if (i > 0) {
                try {
                    //根据配置停 一下
                    Thread.sleep(serverConfig.getRegistrySyncRetryWaitMs());
                } catch (InterruptedException e) {
                    logger.warn("Interrupted during registry transfer..");
                    break;
                }
            }
//获取每个eureka服务器中所有应用的所有的服务实例
            Applications apps = eurekaClient.getApplications();
            for (Application app : apps.getRegisteredApplications()) {
                for (InstanceInfo instance : app.getInstances()) {
                    try {
     //判断是否可以注册
                        if (isRegisterable(instance)) {
                            //注册到自身的注册表中
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

通过这一步保证了eureka启动时的数据一致性(第一次数据拉取).

**5、** 2)EurekaServer之间注册表信息同步复制；

为了保证Eureka Server集群运行时候注册表的信息一致性，每个eureka server在对本地注册表进行管理操作时，会将相应的信息同步到peer节点中。

以下的各个方法中都会调用同步复制.

com.netflix.eureka.registry.PeerAwareInstanceRegistryImpl#cancel

com.netflix.eureka.registry.PeerAwareInstanceRegistryImpl#register

com.netflix.eureka.registry.PeerAwareInstanceRegistryImpl#renew等方法中，都回调用方法com.netflix.eureka.registry.PeerAwareInstanceRegistryImpl#replicateToPeers

```java
 private void replicateToPeers(Action action, String appName, String id,
                                  InstanceInfo info /* optional */,
                                  InstanceStatus newStatus /* optional */, boolean isReplication) {
        Stopwatch tracer = action.getTimer().start();
        try {
            if (isReplication) {
                numberOfReplicationsLastMin.increment();
            }
            // If it is a replication already, do not replicate again as this will create a poison replication
            if (peerEurekaNodes == Collections.EMPTY_LIST || isReplication) {
                return;
            }
//向peer集群中的每一个peer进行同步
            for (final PeerEurekaNode node : peerEurekaNodes.getPeerEurekaNodes()) {
                // If the url represents this host, do not replicate to yourself.
//是自已就不同步了
                if (peerEurekaNodes.isThisMyUrl(node.getServiceUrl())) {
                    continue;
                }
                //根据action调用不同的同步请求
                replicateInstanceActionsToPeers(action, appName, id, info, newStatus, node);
            }
        } finally {
            tracer.stop();
        }
    }
```

方法中会通过for循环遍历所有的PeerEurekaNode，调用replicateInstanceActionsToPeers方法，把信息复制给其他的Eureka Server节点.

```java
 /**
     * Replicates all instance changes to peer eureka nodes except for
     * replication traffic to this node.
     *
     */
    private void replicateInstanceActionsToPeers(Action action, String appName,
                                                 String id, InstanceInfo info, InstanceStatus newStatus,
                                                 PeerEurekaNode node) {
        try {
            InstanceInfo infoFromRegistry = null;
            CurrentRequestVersion.set(Version.V2);
            switch (action) {
                case Cancel:
                    node.cancel(appName, id);
                    break;
                case Heartbeat:
                    InstanceStatus overriddenStatus = overriddenInstanceStatusMap.get(id);
                    infoFromRegistry = getInstanceByAppAndId(appName, id, false);
                    node.heartbeat(appName, id, infoFromRegistry, overriddenStatus, false);
                    break;
                case Register:
                    node.register(info);
                    break;
                case StatusUpdate:
                    infoFromRegistry = getInstanceByAppAndId(appName, id, false);
                    node.statusUpdate(appName, id, newStatus, infoFromRegistry);
                    break;
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

方法中，会判断action具体的动作,调用节点不同的操作. 以注册为例，查看一下注册的操作.

```java
/**
 * Sends the registration information of {@LinkInstanceInfo} receiving by
 * this node to the peer node represented by this class.
 *
 * @param info
 *            the instance information {@LinkInstanceInfo} of any instance
 *            that is send to this instance.
 * @throws Exception
 */
public void register(final InstanceInfo info) throws Exception {
    long expiryTime = System.currentTimeMillis() + getLeaseRenewalOf(info);
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

它通过启动了一个任务，来向其它节点同步信息的，不是实时同步的.

其它的操作可以自行查看源码了.

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/zhangyingchengqi/category_10464123.html
