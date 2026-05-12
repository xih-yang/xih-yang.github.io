# 04、Eureka源码解析 获取注册信息(服务列表)
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-4/4.html
- 分类：注册中心
- 分组：Eureka 教程（版本 D）
## Eureka获取注册信息(服务列表)

- EurekaClient端从EurekaServer端获取注册信息列表并缓存到本地是Eureka所提供的核心功能之一，EurekaClient端启动时发起全量获取，启动后默认30秒发起一次差别获取(这个叫法有点别扭，主要因为EurekaServer端处理请求的方法叫getContainerDifferential)。本文基于https://github.com/Netflix/eureka上的master分支。最近在github上fork了一下eureka项目，更详细的注释可以去我的git上看：https://github.com/qiuyangli/eureka

## EurekaClient发起全量获取请求+EurekaServer处理全量获取请求

- EurekaClient启动初始化时，会发起一次全量获取注册信息，代码如下：

```java
// 拉取配置信息
if (clientConfig.shouldFetchRegistry() && !fetchRegistry(false)) {
    fetchRegistryFromBackup();
}
```

- 调用到fetchRegistry(boolean forceFullRegistryFetch)方法：

```java
// 拉取注册信息
private boolean fetchRegistry(boolean forceFullRegistryFetch) {
    Stopwatch tracer = FETCH_REGISTRY_TIMER.start();
    try {
        // If the delta is disabled or if it is the first time, get all
        // applications
        // 获取本地缓存的注册信息
        Applications applications = getApplications();
        // 全量获取
        if (clientConfig.shouldDisableDelta()// 默认为false
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
            getAndStoreFullRegistry();// 全量获取注册信息并存到本地缓存
        } else {
            // 差别获取
            getAndUpdateDelta(applications);
        }
        applications.setAppsHashCode(applications.getReconcileHashCode());
        // 打印EurekaClient端保存的注册信息的数量
        logTotalInstances();
    } catch (Throwable e) {
        logger.error(PREFIX + "{} - was unable to refresh its cache! status = {}", appPathIdentifier, e.getMessage(), e);
        return false;
    } finally {
        if (tracer != null) {
            tracer.stop();
        }
    }
    // Notify about cache refresh before updating the instance remote status
    onCacheRefreshed();
    // Update remote status based on refreshed data held in the cache
    updateInstanceRemoteStatus();
    // registry was fetched successfully, so return true
    return true;
}
```

- 其中通过getAndStoreFullRegistry()方法进行全量获取，代码如下：

```java
// 全量获取注册信息并存到本地缓存
private void getAndStoreFullRegistry() throws Throwable {
    long currentUpdateGeneration = fetchRegistryGeneration.get();
    logger.info("Getting all instance registry info from the eureka server");
    Applications apps = null;
    // 调用到EurekaServer的ApplicationsResource-getContainers()方法全量获取注册信息
    EurekaHttpResponse<Applications> httpResponse = clientConfig.getRegistryRefreshSingleVipAddress() == null
            ? eurekaTransport.queryClient.getApplications(remoteRegionsRef.get())
            : eurekaTransport.queryClient.getVip(clientConfig.getRegistryRefreshSingleVipAddress(), remoteRegionsRef.get());
    if (httpResponse.getStatusCode() == Status.OK.getStatusCode()) {
        apps = httpResponse.getEntity();
    }
    logger.info("The response status is {}", httpResponse.getStatusCode());
    // 设置缓存
    if (apps == null) {
        logger.error("The application is null for some reason. Not storing this information");
    } else if (fetchRegistryGeneration.compareAndSet(currentUpdateGeneration, currentUpdateGeneration + 1)) {
        // 对注册信息进行过滤，过滤后只缓存服务状态为UP的实例
        // 本地缓存数据结构为AtomicReference<Applications>
        localRegionApps.set(this.filterAndShuffle(apps));
        // 打印过滤后实例的哈希值
        logger.debug("Got full registry with apps hashcode {}", apps.getAppsHashCode());
    } else {
        logger.warn("Not updating applications as another thread is updating it already");
    }
}
```

- EurekaServer端接收全量获取请求的代码在eureka-core包下的ApplicationsResource-getContainers()方法，具体代码如下：

```java
// 接收EurekaClient端发送的获取全量注册信息请求
@GET
public Response getContainers(@PathParam("version") String version,
                              @HeaderParam(HEADER_ACCEPT) String acceptHeader,
                              @HeaderParam(HEADER_ACCEPT_ENCODING) String acceptEncoding,
                              @HeaderParam(EurekaAccept.HTTP_X_EUREKA_ACCEPT) String eurekaAccept,
                              @Context UriInfo uriInfo,
                              @Nullable @QueryParam("regions") String regionsStr) {
    boolean isRemoteRegionRequested = null != regionsStr && !regionsStr.isEmpty();
    String[] regions = null;
    if (!isRemoteRegionRequested) {
        EurekaMonitors.GET_ALL.increment();
    } else {
        regions = regionsStr.toLowerCase().split(",");
        Arrays.sort(regions); // So we don't have different caches for same regions queried in different order.
        EurekaMonitors.GET_ALL_WITH_REMOTE_REGIONS.increment();
    }
    // Check if the server allows the access to the registry. The server can
    // restrict access if it is not
    // ready to serve traffic depending on various reasons.
    // EurekaServer无法提供服务，返回403
    if (!registry.shouldAllowAccess(isRemoteRegionRequested)) {
        return Response.status(Status.FORBIDDEN).build();
    }
    // 默认V2
    CurrentRequestVersion.set(Version.toEnum(version));
    // 设置返回数据格式，默认JSON
    KeyType keyType = Key.KeyType.JSON;
    String returnMediaType = MediaType.APPLICATION_JSON;
    if (acceptHeader == null || !acceptHeader.contains(HEADER_JSON_VALUE)) {
        // 如果接收到的请求头部没有具体格式信息，则返回格式为XML
        keyType = Key.KeyType.XML;
        returnMediaType = MediaType.APPLICATION_XML;
    }
    // 构建缓存键
    Key cacheKey = new Key(Key.EntityType.Application,
            ResponseCacheImpl.ALL_APPS,
            keyType, CurrentRequestVersion.get(), EurekaAccept.fromString(eurekaAccept), regions
    );
    // 根据缓存键读取缓存
    Response response;
    // 返回不同的编码类型的数据，去缓存中取数据的方法基本一致
    if (acceptEncoding != null && acceptEncoding.contains(HEADER_GZIP_VALUE)) {
        response = Response.ok(responseCache.getGZIP(cacheKey))
                .header(HEADER_CONTENT_ENCODING, HEADER_GZIP_VALUE)
                .header(HEADER_CONTENT_TYPE, returnMediaType)
                .build();
    } else {
        response = Response.ok(responseCache.get(cacheKey))
                .build();
    }
    return response;
}
```

- 通过getGZIP(cacheKey)/get(cacheKey)方法，调用到getValue(key,useReadOnlyCache)方法读取到缓存里的实例注册信息返给EurekaClient端，代码如下：

```java
@VisibleForTesting
Value getValue(final Key key, boolean useReadOnlyCache) {
    Value payload = null;
    try {
        // 默认为true，允许使用只读缓存
        if (useReadOnlyCache) {
            // 先从readOnlyCacheMap读取
            // 若读不到，则从readWriteCacheMap读取，并将结果存入readOnlyCacheMap
            // 缓存设计成了两级，请求进来的时候先读readOnlyCacheMap，读不到再从readWriteCacheMap读取
            // readWriteCacheMap里再读不到，则从registry里读
            // readOnlyCacheMap是一个ConcurrentMap
            // readWriteCacheMap是一个LoadingCache
            // 不是很理解为什么要设置这两级缓存？
            final Value currentPayload = readOnlyCacheMap.get(key);
            if (currentPayload != null) {
                payload = currentPayload;
            } else {
                payload = readWriteCacheMap.get(key);
                readOnlyCacheMap.put(key, payload);
            }
        } else {
            // 不允许使用只读缓存，读取readWriteCacheMap
            payload = readWriteCacheMap.get(key);
        }
    } catch (Throwable t) {
        logger.error("Cannot get value for key : {}", key, t);
    }
    return payload;
}
```

- 差别获取失败时也会发起全量获取，代码在下面会有介绍

## EurekaClient发起差别获取请求+EurekaServer处理差别获取请求

- EurekaClient启动初始化的定时任务，默认30秒发起一次差别获取请求，初始化代码就不再贴出来了，前面文章有详细解析，初始化后真正发起差别获取请求的方法是getAndUpdateDelta(applications)代码如下：

```java
// 差别获取后合并到本地缓存
private void getAndUpdateDelta(Applications applications) throws Throwable {
    long currentUpdateGeneration = fetchRegistryGeneration.get();
    Applications delta = null;
    // 发送差别获取注册信息的请求
    // 具体通过AbstractJerseyEurekaHttpClient-getApplicationsInternal(urlPath, regions)方法调用
    // 最终调用到EurekaServer中ApplicationsResource-getContainerDifferential()方法，目测和获取全量注册信息差别不大
    EurekaHttpResponse<Applications> httpResponse = eurekaTransport.queryClient.getDelta(remoteRegionsRef.get());
    if (httpResponse.getStatusCode() == Status.OK.getStatusCode()) {
        delta = httpResponse.getEntity();
    }
    // 差别获取注册信息未获取到，转为全量获取
    if (delta == null) {
        logger.warn("The server does not allow the delta revision to be applied because it is not safe. "
                + "Hence got the full registry.");
        getAndStoreFullRegistry();
    } else if (fetchRegistryGeneration.compareAndSet(currentUpdateGeneration, currentUpdateGeneration + 1)) {
        logger.debug("Got delta update with apps hashcode {}", delta.getAppsHashCode());
        String reconcileHashCode = "";
        // 目测合并注册信息时要加锁
        // 拉取注册信息是从每个EurekaClient发起的如果定时30秒获取一次的话应该没有并发?
        if (fetchRegistryUpdateLock.tryLock()) {
            try {
                // 差别获取的注册信息与本地缓存的注册信息进行合并
                updateDelta(delta);
                // 本地注册信息一致哈希值
                reconcileHashCode = getReconcileHashCode(applications);
            } finally {
                // 释放锁
                fetchRegistryUpdateLock.unlock();
            }
        } else {
            logger.warn("Cannot acquire update lock, aborting getAndUpdateDelta");
        }
        // There is a diff in number of instances for some reason
        // 合并后本地注册信息和EurekaServer端的哈希值不一致
        // 调用reconcileAndLogDifference方法，内部实现基本和全量获取一样，并设置到本地缓存
        if (!reconcileHashCode.equals(delta.getAppsHashCode()) || clientConfig.shouldLogDeltaDiff()) {
            reconcileAndLogDifference(delta, reconcileHashCode);  // this makes a remoteCall
        }
    } else {
        logger.warn("Not updating application delta as another thread is updating it already");
        logger.debug("Ignoring delta update with apps hashcode {}, as another thread is updating it already", delta.getAppsHashCode());
    }
}
```

- EurekaServer端接收差别获取请求的方法是eureka-core包里的ApplicationsResource-getContainerDifferential()方法，具体处理方法与全量获取差别不大，这里不再做详细解析
- EurekaClient端接收到EurekaServer端返回的实例注册信息后的操作比较关键，对注册信息在本地进行了合并，并进行哈希值比较，具体调用到了updateDelta(delta)方法，代码如下：

```java
// 注册信息合并
private void updateDelta(Applications delta) {
    int deltaCount = 0;
    // 遍历从EurekaServer端拉取的实例信息集合
    for (Application app : delta.getRegisteredApplications()) {
        // 遍历出每个instance
        for (InstanceInfo instance : app.getInstances()) {
            Applications applications = getApplications();
            String instanceRegion = instanceRegionChecker.getInstanceRegion(instance);
            if (!instanceRegionChecker.isLocalRegion(instanceRegion)) {
                Applications remoteApps = remoteRegionVsApps.get(instanceRegion);
                if (null == remoteApps) {
                    remoteApps = new Applications();
                    remoteRegionVsApps.put(instanceRegion, remoteApps);
                }
                applications = remoteApps;
            }
            ++deltaCount;
            // 根据获取的delta数据的ActionType修改本地数据
            if (ActionType.ADDED.equals(instance.getActionType())) {
                Application existingApp = applications.getRegisteredApplications(instance.getAppName());
                if (existingApp == null) {
                    applications.addApplication(app);
                }
                logger.debug("Added instance {} to the existing apps in region {}", instance.getId(), instanceRegion);
                // 调用addInstance方法
                applications.getRegisteredApplications(instance.getAppName()).addInstance(instance);
            } else if (ActionType.MODIFIED.equals(instance.getActionType())) {
                Application existingApp = applications.getRegisteredApplications(instance.getAppName());
                if (existingApp == null) {
                    applications.addApplication(app);
                }
                logger.debug("Modified instance {} to the existing apps ", instance.getId());
                // 调用addInstance方法
                applications.getRegisteredApplications(instance.getAppName()).addInstance(instance);
            } else if (ActionType.DELETED.equals(instance.getActionType())) {
                Application existingApp = applications.getRegisteredApplications(instance.getAppName());
                if (existingApp == null) {
                    applications.addApplication(app);
                }
                logger.debug("Deleted instance {} to the existing apps ", instance.getId());
                // 调用removeInstance方法
                applications.getRegisteredApplications(instance.getAppName()).removeInstance(instance);
            }
        }
    }
    logger.debug("The total number of instances fetched by the delta processor : {}", deltaCount);
    getApplications().setVersion(delta.getVersion());
    // 过滤后只保留实例状态为UP的实例信息
    getApplications().shuffleInstances(clientConfig.shouldFilterOnlyUpInstances());
    for (Applications applications : remoteRegionVsApps.values()) {
        applications.setVersion(delta.getVersion());
        applications.shuffleInstances(clientConfig.shouldFilterOnlyUpInstances());
    }
}
```

- 其中用到了addInstance(instance)方法和removeInstance(instance)方法：

```java
 public void addInstance(InstanceInfo i) {
     // 实例信息添加到instancesMap
    instancesMap.put(i.getId(), i);
    synchronized (instances) {
        // 移除集合重原有的实例信息
        instances.remove(i);
        // 把实例信息重新添加到集合中
        instances.add(i);
        isDirty = true;
    }
}
```

```java
private void removeInstance(InstanceInfo i, boolean markAsDirty) {
    // 在instancesMap移除实例信息
    instancesMap.remove(i.getId());
    synchronized (instances) {
        // 在集合中移除实例信息
        instances.remove(i);
        if (markAsDirty) {
            isDirty = true;
        }
    }
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
