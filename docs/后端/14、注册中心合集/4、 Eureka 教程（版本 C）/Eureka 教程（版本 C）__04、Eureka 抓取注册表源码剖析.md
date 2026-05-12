# 04、Eureka 抓取注册表源码剖析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-3/4.html
- 分类：注册中心
- 分组：Eureka 教程（版本 C）
### Eureka-Client

注册表抓取都是在初始化DiscoveryClient的时候触发，initScheduledTasks()方法会开始定时任务不间断的抓取。

```java
DiscoveryClient(ApplicationInfoManager applicationInfoManager, EurekaClientConfig config, AbstractDiscoveryClientOptionalArgs args,
                Provider<BackupRegistry> backupRegistryProvider) {
    // 省略......
    // 抓取注册表
    if (clientConfig.shouldFetchRegistry() && !fetchRegistry(false)) {
        fetchRegistryFromBackup();
    }
    // call and execute the pre registration handler before all background tasks (inc registration) is started
    if (this.preRegistrationHandler != null) {
        this.preRegistrationHandler.beforeRegistration();
    }
    // 初始化调度任务
    initScheduledTasks();
    // 省略......
}
```

进入initScheduledTasks()方法

```java
private void initScheduledTasks() {
    if (clientConfig.shouldFetchRegistry()) {
        // registry cache refresh timer
        int registryFetchIntervalSeconds = clientConfig.getRegistryFetchIntervalSeconds();
        int expBackOffBound = clientConfig.getCacheRefreshExecutorExponentialBackOffBound();
        // 拉取注册表（全量/增量）
        scheduler.schedule(
                new TimedSupervisorTask(
                        "cacheRefresh",
                        scheduler,
                        cacheRefreshExecutor,
                        registryFetchIntervalSeconds,
                        TimeUnit.SECONDS,
                        expBackOffBound,
                        new CacheRefreshThread()
                ),
                registryFetchIntervalSeconds, TimeUnit.SECONDS);
    }
    // 省略......
}
```

执行抓取注册表的逻辑是在CacheRefreshThread的run方法，然后调用refreshRegistry()方法，默认30s

```java
class CacheRefreshThread implements Runnable {
    public void run() {
        refreshRegistry();
    }
}
@VisibleForTesting
void refreshRegistry() {
    try {
        // 省略......
        boolean success = fetchRegistry(remoteRegionsModified);
        if (success) {
            registrySize = localRegionApps.get().size();
            lastSuccessfulRegistryFetchTimestamp = System.currentTimeMillis();
        }
        // 省略......
    } catch (Throwable e) {
        logger.error("Cannot fetch registry from server", e);
    }        
}
```

进入refreshRegistry()方法

```java
private boolean fetchRegistry(boolean forceFullRegistryFetch) {
    Stopwatch tracer = FETCH_REGISTRY_TIMER.start();
    try {
        // If the delta is disabled or if it is the first time, get all
        // applications
        Applications applications = getApplications();
        if (clientConfig.shouldDisableDelta()
                || (!Strings.isNullOrEmpty(clientConfig.getRegistryRefreshSingleVipAddress()))
                || forceFullRegistryFetch
                || (applications == null)
                || (applications.getRegisteredApplications().size() == 0)
                || (applications.getVersion() == -1)) //Client application does not have latest library supporting delta
        {
            logger.info("Disable delta property : {}", clientConfig.shouldDisableDelta());
            logger.info("Single vip registry refresh property : {}", clientConfig.getRegistryRefreshSingleVipAddress());
            logger.info("Force full registry fetch : {}", forceFullRegistryFetch);
            logger.info("Application is null : {}", (applications == null));
            logger.info("Registered Applications size is zero : {}",
                    (applications.getRegisteredApplications().size() == 0));
            logger.info("Application version is -1: {}", (applications.getVersion() == -1));
            // 全量抓取
            getAndStoreFullRegistry();
        } else {
            // 增量抓取
            getAndUpdateDelta(applications);
        }
        applications.setAppsHashCode(applications.getReconcileHashCode());
        logTotalInstances();
    } catch (Throwable e) {
        logger.error(PREFIX + appPathIdentifier + " - was unable to refresh its cache! status = " + e.getMessage(), e);
        return false;
    } finally {
        if (tracer != null) {
            tracer.stop();
        }
    }
    return true;
}
```

进入getAndStoreFullRegistry()方法

```java
private void getAndStoreFullRegistry() throws Throwable {
    long currentUpdateGeneration = fetchRegistryGeneration.get();
    logger.info("Getting all instance registry info from the eureka server");
    Applications apps = null;
    EurekaHttpResponse<Applications> httpResponse = clientConfig.getRegistryRefreshSingleVipAddress() == null
            ? eurekaTransport.queryClient.getApplications(remoteRegionsRef.get())
            : eurekaTransport.queryClient.getVip(clientConfig.getRegistryRefreshSingleVipAddress(), remoteRegionsRef.get());
    if (httpResponse.getStatusCode() == Status.OK.getStatusCode()) {
        apps = httpResponse.getEntity();
    }
    logger.info("The response status is {}", httpResponse.getStatusCode());
    if (apps == null) {
        logger.error("The application is null for some reason. Not storing this information");
    } else if (fetchRegistryGeneration.compareAndSet(currentUpdateGeneration, currentUpdateGeneration + 1)) {
        localRegionApps.set(this.filterAndShuffle(apps));
        logger.debug("Got full registry with apps hashcode {}", apps.getAppsHashCode());
    } else {
        logger.warn("Not updating applications as another thread is updating it already");
    }
}
```

最后把拉取到的全量Applications放到localRegionApps中。

进入getAndUpdateDelta(Applications applications)方法

```java
private void getAndUpdateDelta(Applications applications) throws Throwable {
    long currentUpdateGeneration = fetchRegistryGeneration.get();
    Applications delta = null;
    EurekaHttpResponse<Applications> httpResponse = eurekaTransport.queryClient.getDelta(remoteRegionsRef.get());
    if (httpResponse.getStatusCode() == Status.OK.getStatusCode()) {
        delta = httpResponse.getEntity();
    }
    if (delta == null) {
        logger.warn("The server does not allow the delta revision to be applied because it is not safe. "
                + "Hence got the full registry.");
        getAndStoreFullRegistry();
    } else if (fetchRegistryGeneration.compareAndSet(currentUpdateGeneration, currentUpdateGeneration + 1)) {
        logger.debug("Got delta update with apps hashcode {}", delta.getAppsHashCode());
        String reconcileHashCode = "";
        if (fetchRegistryUpdateLock.tryLock()) {
            try {
                // 增量更新
                updateDelta(delta);
                // 计算所有本地服务的hashcode
                reconcileHashCode = getReconcileHashCode(applications);
            } finally {
                fetchRegistryUpdateLock.unlock();
            }
        } else {
            logger.warn("Cannot acquire update lock, aborting getAndUpdateDelta");
        }
        // There is a diff in number of instances for some reason
        if (!reconcileHashCode.equals(delta.getAppsHashCode()) || clientConfig.shouldLogDeltaDiff()) {
            // 如果本地服务的hashcode与增量服务的hashcode不同会全量拉取
            reconcileAndLogDifference(delta, reconcileHashCode);  // this makes a remoteCall
        }
    } else {
        logger.warn("Not updating application delta as another thread is updating it already");
        logger.debug("Ignoring delta update with apps hashcode {}, as another thread is updating it already", delta.getAppsHashCode());
    }
}
```

增量服务的hashcode不只是增量服务，而是所拉取的增量服务那台eureka-server所有的本地服务的hashcode，会在eureka-server源码剖析中看到。

进入getReconcileHashCode(Applications applications)方法

```java
private String getReconcileHashCode(Applications applications) {
    TreeMap<String, AtomicInteger> instanceCountMap = new TreeMap<String, AtomicInteger>();
    if (isFetchingRemoteRegionRegistries()) {
        for (Applications remoteApp : remoteRegionVsApps.values()) {
            remoteApp.populateInstanceCountMap(instanceCountMap);
        }
    }
    applications.populateInstanceCountMap(instanceCountMap);
    return Applications.getReconcileHashCode(instanceCountMap);
}
```

再进入populateInstanceCountMap(TreeMap instanceCountMap)方法中

```java
public void populateInstanceCountMap(TreeMap<String, AtomicInteger> instanceCountMap) {
    for (Application app : this.getRegisteredApplications()) {
        for (InstanceInfo info : app.getInstancesAsIsFromEureka()) {
            AtomicInteger instanceCount = instanceCountMap.get(info.getStatus().name());
            if (instanceCount == null) {
                instanceCount = new AtomicInteger(0);
                instanceCountMap.put(info.getStatus().name(), instanceCount);
            }
            instanceCount.incrementAndGet();
        }
    }
}
```

此处会把info.getStatus().name()作为instanceCountMap的key,在这里曾有个小疑问，为什么不加上服务名称service-name,如果此时一个服务的实例下线，另一个服务的实例上线，服务注册表已经变化，但是Hashcode已经变化，这样不一致，其实这个担心是多余的，所有变化的服务都会变成增量，所以没必要加service-name。

### Eureka-Server

全量抓取注册表的代码

增量抓取注册表的代码

增量/全量注册表是从responseCache缓存中获取的，进入responseCache.get(cacheKey)方法

```java
public String get(final Key key) {
    return get(key, shouldUseReadOnlyResponseCache);
}
@VisibleForTesting
String get(final Key key, boolean useReadOnlyCache) {
    Value payload = getValue(key, useReadOnlyCache);
    if (payload == null || payload.getPayload().equals(EMPTY_PAYLOAD)) {
        return null;
    } else {
        return payload.getPayload();
    }
}
```

再进入getValue(key, useReadOnlyCache)方法

```java
Value getValue(final Key key, boolean useReadOnlyCache) {
    Value payload = null;
    try {
        if (useReadOnlyCache) {
            final Value currentPayload = readOnlyCacheMap.get(key);
            if (currentPayload != null) {
                payload = currentPayload;
            } else {
                payload = readWriteCacheMap.get(key);
                readOnlyCacheMap.put(key, payload);
            }
        } else {
            payload = readWriteCacheMap.get(key);
        }
    } catch (Throwable t) {
        logger.error("Cannot get value for key :" + key, t);
    }
    return payload;
}
```

从该方法中我们可以看到有两个缓存map,readOnlyCacheMap和readWriteCacheMap，可以知道eureka用了两级缓存，这两个map是在ResponseCacheImpl构造方法中初始化的

进入ResponseCacheImpl构造方法

```java
ResponseCacheImpl(EurekaServerConfig serverConfig, ServerCodecs serverCodecs, AbstractInstanceRegistry registry) {
    this.serverConfig = serverConfig;
    this.serverCodecs = serverCodecs;
    this.shouldUseReadOnlyResponseCache = serverConfig.shouldUseReadOnlyResponseCache();
    this.registry = registry;
    long responseCacheUpdateIntervalMs = serverConfig.getResponseCacheUpdateIntervalMs();
    this.readWriteCacheMap =
            CacheBuilder.newBuilder().initialCapacity(1000)
                    .expireAfterWrite(serverConfig.getResponseCacheAutoExpirationInSeconds(), TimeUnit.SECONDS)
                    .removalListener(new RemovalListener<Key, Value>() {
                        @Override
                        public void onRemoval(RemovalNotification<Key, Value> notification) {
                            Key removedKey = notification.getKey();
                            if (removedKey.hasRegions()) {
                                Key cloneWithNoRegions = removedKey.cloneWithoutRegions();
                                regionSpecificKeys.remove(cloneWithNoRegions, removedKey);
                            }
                        }
                    })
                    .build(new CacheLoader<Key, Value>() {
                        @Override
                        public Value load(Key key) throws Exception {
                            if (key.hasRegions()) {
                                Key cloneWithNoRegions = key.cloneWithoutRegions();
                                regionSpecificKeys.put(cloneWithNoRegions, key);
                            }
                            // 抓取注册表（全量/增量）
                            Value value = generatePayload(key);
                            return value;
                        }
                    });
    // 定时更新readOnlyCacheMap
    if (shouldUseReadOnlyResponseCache) {
        timer.schedule(getCacheUpdateTask(),
                new Date(((System.currentTimeMillis() / responseCacheUpdateIntervalMs) * responseCacheUpdateIntervalMs)
                        + responseCacheUpdateIntervalMs),
                responseCacheUpdateIntervalMs);
    }
    try {
        Monitors.registerObject(this);
    } catch (Throwable e) {
        logger.warn("Cannot register the JMX monitor for the InstanceRegistry", e);
    }
}
```

此处用了谷歌的LoadingCache，在这里不做分析，

进入generatePayload(key)方法

```java
private Value generatePayload(Key key) {
    Stopwatch tracer = null;
    try {
        String payload;
        switch (key.getEntityType()) {
            case Application:
                boolean isRemoteRegionRequested = key.hasRegions();
                // 全量
                if (ALL_APPS.equals(key.getName())) {
                    if (isRemoteRegionRequested) {
                        tracer = serializeAllAppsWithRemoteRegionTimer.start();
                        payload = getPayLoad(key, registry.getApplicationsFromMultipleRegions(key.getRegions()));
                    } else {
                        tracer = serializeAllAppsTimer.start();
                        // 全量
                        payload = getPayLoad(key, registry.getApplications());
                    }
                } else if (ALL_APPS_DELTA.equals(key.getName())) {
                    // 增量
                    if (isRemoteRegionRequested) {
                        tracer = serializeDeltaAppsWithRemoteRegionTimer.start();
                        versionDeltaWithRegions.incrementAndGet();
                        versionDeltaWithRegionsLegacy.incrementAndGet();
                        // 增量
                        payload = getPayLoad(key,
                                registry.getApplicationDeltasFromMultipleRegions(key.getRegions()));
                    } else {
                        tracer = serializeDeltaAppsTimer.start();
                        versionDelta.incrementAndGet();
                        versionDeltaLegacy.incrementAndGet();
                        payload = getPayLoad(key, registry.getApplicationDeltas());
                    }
                } else {
                    tracer = serializeOneApptimer.start();
                    payload = getPayLoad(key, registry.getApplication(key.getName()));
                }
                break;
            // 省略......
    }
}
```

在这个方法里可以看到registry.getApplications()和registry.getApplicationDeltasFromMultipleRegions(key.getRegions())两个方法，一个全量，一个增量，我们只分析增量方法。

进入registry.getApplicationDeltas()方法

```java
public Applications getApplicationDeltas() {
    GET_ALL_CACHE_MISS_DELTA.increment();
    Applications apps = new Applications();
    apps.setVersion(responseCache.getVersionDelta().get());
    Map<String, Application> applicationInstancesMap = new HashMap<String, Application>();
    try {
        write.lock();
        Iterator<RecentlyChangedItem> iter = this.recentlyChangedQueue.iterator();
        logger.debug("The number of elements in the delta queue is :"
                + this.recentlyChangedQueue.size());
        while (iter.hasNext()) {
            Lease<InstanceInfo> lease = iter.next().getLeaseInfo();
            InstanceInfo instanceInfo = lease.getHolder();
            Object[] args = {instanceInfo.getId(),
                    instanceInfo.getStatus().name(),
                    instanceInfo.getActionType().name()};
            logger.debug(
                    "The instance id %s is found with status %s and actiontype %s",
                    args);
            Application app = applicationInstancesMap.get(instanceInfo
                    .getAppName());
            if (app == null) {
                app = new Application(instanceInfo.getAppName());
                applicationInstancesMap.put(instanceInfo.getAppName(), app);
                apps.addApplication(app);
            }
            app.addInstance(decorateInstanceInfo(lease));
        }
        boolean disableTransparentFallback = serverConfig.disableTransparentFallbackToOtherRegion();
        if (!disableTransparentFallback) {
            Applications allAppsInLocalRegion = getApplications(false);
            for (RemoteRegionRegistry remoteRegistry : this.regionNameVSRemoteRegistry.values()) {
                Applications applications = remoteRegistry.getApplicationDeltas();
                for (Application application : applications.getRegisteredApplications()) {
                    Application appInLocalRegistry =
                            allAppsInLocalRegion.getRegisteredApplications(application.getName());
                    if (appInLocalRegistry == null) {
                        apps.addApplication(application);
                    }
                }
            }
        }
        Applications allApps = getApplications(!disableTransparentFallback);
        // 此处就是把所有服务的Hashcode赋给增量服务,用户client端的hashcode比对
        apps.setAppsHashCode(allApps.getReconcileHashCode());
        return apps;
    } finally {
        write.unlock();
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/manongxx/category_10951792.html
