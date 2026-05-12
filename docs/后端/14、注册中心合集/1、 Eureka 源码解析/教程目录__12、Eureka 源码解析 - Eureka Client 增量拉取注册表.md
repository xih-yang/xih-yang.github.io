# 12、Eureka 源码解析 - Eureka Client 增量拉取注册表
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/12.html
- 分类：注册中心
- 分组：教程目录
下面是官方提供的 Eureka 架构图：

### 1、Eureka Client 增量拉取

在之前的博客当中 [6、Eureka 源码解析 之 Eureka Server 多级缓存](/zhuanlan/registered/eureka/1/6.html) 已经详细说明了在 Eureka Client 启动的时候会去 Eureka Server 里面全量的拉取一下注册到里面的服务信息列表。并且 Eureka Server 里面是使用了多级缓存来保存全量的注册信息列表。

Eureka Client 在启动时获取 Eureka Server 中的注册信息，但是作为分布式环境服务随时时可进行上线、下线操作。所以作为注册中心它需要有服务自动上下线发现的功能。

Eureka Client 在初始化获取了全量的注册信息之后，它会启动定时任务去增量的拉取注册中心当的新的服务列表信息。

Eureka Client 增量拉取注册表的时序图如下：

EurekaClient 在初始化的时候会初始化一序列定时任务，其中一个就是定时的从 Eureka Server 增量的获取服务注册信息。它调用的 http 请求的路径类似于：`http://localhost:8080/v2/apps/delta` 并且发送的是 `get` 请求。

- http://localhost:8080：Eureka Server 的接收请求的地址
- /v2/apps：Restful 处理类 ApplicationsResource 上面的路径：@Path("/{version}/apps")
- delta ：ApplicationsResource 这个处理类中的 getContainerDifferential 方法用于处理 Eureka Client 的堷拉取注册列表信息。

我们先来分析一下 Eureka Server 中是如果来处理 Eureka Client 发送来的增量拉取注册列表的请求。先来分析一下 Eureka Server 的返回值。然后再来分析一下 Eureka Client 是如何处理从 Eureka Client 的增量服务注册列表的。

### 2、Eureka Server 增量拉取

Eureka Server 处理增量注册列表的拉取是通过 ApplicationsResource#getContainerDifferential 它的调用时序图如下：

我们可以看到增量读取注册列表的读取步骤与全量读取注册列表的操作步骤非常类似，只不过是它们使用的缓存值是不一样的。全量读取使用的缓存 Key 中的 `entityName` 是 `ALL_APPS`，而增量读取使用的缓存 Key 中的 `entityName` 是 `ALL_APPS_DELTA`。

上面的Key 值不一致只是表面现象，那么什么是增量数据呢以及它是如何构建的？

> 什么是增量数据呢？

增量其实可以理解成与之前拉取的服务注册列表不一致的服务信息，这些都可以认为是增量的数据。在 Eureka Server 的注册中心 `AbstractInstanceRegistry` 中，当服务发生了服务注册、下线、状态变更不仅会清除注册中心的缓存，并且会往`ConcurrentLinkedQueue recentlyChangedQueue` 这个队列里面添加服务实例的信息。

- 服务注册：实例的操作类型会设置为添加，InstanceInfo.setActionType(ActionType.ADDED)
- 服务下线：实例的操作类型会设置为删除，InstanceInfo.setActionType(ActionType.DELETED)
- 服务状态变更：实例的操作类型会设置为修改，InstanceInfo.setActionType(ActionType.MODIFIED)

上面的操作类型比较重要，因为 Eureka Client 会根据不同的操作类似作出不同的处理

> 如何构建的增量数据？

下面是增量数据的构建时序图：

Eureka Server 在初始化的时候会构建读写缓存，当进行增量数据缓存读取的时候就会构建增量服务注册列表的构建。构建方法为调用注册中心的 AbstractInstanceRegistry#getApplicationDeltas 来处理上面的所说的增量服务注册信息 ConcurrentLinkedQueue`` recentlyChangedQueue。

### 3、注册中心处理增量拉取

注册中心处理增量数据其实就是对 ConcurrentLinkedQueue`` recentlyChangedQueue 这个服务信息变更队列的操作。它的操作方法为 AbstractInstanceRegistry#getApplicationDeltas.

> AbstractInstanceRegistry#getApplicationDeltas

```java
    public Applications getApplicationDeltas() {
        GET_ALL_CACHE_MISS_DELTA.increment();
        Applications apps = new Applications();
        apps.setVersion(responseCache.getVersionDelta().get());
        Map<String, Application> applicationInstancesMap = new HashMap<String, Application>();
        write.lock();
        try {
            Iterator<RecentlyChangedItem> iter = this.recentlyChangedQueue.iterator();
            logger.debug("The number of elements in the delta queue is : {}",
                    this.recentlyChangedQueue.size());
            while (iter.hasNext()) {
                Lease<InstanceInfo> lease = iter.next().getLeaseInfo();
                InstanceInfo instanceInfo = lease.getHolder();
                logger.debug(
                        "The instance id {} is found with status {} and actiontype {}",
                        instanceInfo.getId(), instanceInfo.getStatus().name(), instanceInfo.getActionType().name());
                Application app = applicationInstancesMap.get(instanceInfo
                        .getAppName());
                if (app == null) {
                    app = new Application(instanceInfo.getAppName());
                    applicationInstancesMap.put(instanceInfo.getAppName(), app);
                    apps.addApplication(app);
                }
                app.addInstance(new InstanceInfo(decorateInstanceInfo(lease)));
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
            apps.setAppsHashCode(allApps.getReconcileHashCode());
            return apps;
        } finally {
            write.unlock();
        }
    }
```

上面的逻辑还是比较简单的，遍历 `ConcurrentLinkedQueue recentlyChangedQueue` 这个服务信息变更队列增量的数据把它添加到 `Applications` 这个数据结构当中。并且把当前注册中心中的所有的服务信息列表`Applications` ，根据注册信息列表 `Applications` 计算一个 hash 值设置到之前的增量的`Applications` 对象当中返回给 Eureka Client。

并且Eureka Server 注册中心会通过定时任务把 `ConcurrentLinkedQueue recentlyChangedQueue` 这个服务信息变更队列增量的数据进行清除。

操作的时序图如下：

### 4、Eureka Client 处理增量数据

我们再次看一下 Eureka Client 是如何从 Eureka Server 进行增量数据的拉取的。

在Eureka Client 调用 Eureka Server 返回获取到注册中心的服务增量数据时，操作逻辑如下：

- 如果增量数据为空。Eureka Client 会做一个容错处理就是从 Eureka Server 全量拉取一下服务信息的注册列表。
- 如果增量数据不为空，就会调用 DiscoveryClient#updateDelta，对 Eureka Client 中缓存的注册列表信息进行修改。也就是对 Eureka Server 中的增加、修改、删除中的注册信息同步到 Eureka Client 当中的缓存注册信息列表当中
- 判断 Eureka Server 返回的注册列表生成的 Hashcode 是否在于同步了增量数据后的 Eureka Client 当中的注册信息列表生成的 HashCode 是否一致。如果不一致就会发起一次全量获取 Eureka Server 中的注册列表并且保存到 Eureka Client 的缓存当中。
