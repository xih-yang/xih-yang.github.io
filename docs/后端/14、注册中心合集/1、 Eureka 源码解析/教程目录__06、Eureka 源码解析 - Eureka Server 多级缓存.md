# 06、Eureka 源码解析 - Eureka Server 多级缓存
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/6.html
- 分类：注册中心
- 分组：教程目录
下面是官方提供的 Eureka 架构图：

### 1、Eureka Client 全量拉取注册表

在微服务中是嵌入了 Eureka Client 的，当服务启动的时候就会从 Eureka Server 中拉取注册的服务信息列表。

在微服务中嵌入的 EurekaClient 的实现类 DiscoveryClient 在初始化的时候会通过调用 EurekaHttpClient 去 Eureka Server 拉取全量服务信息列表。

在 DiscoveryClient#initScheduledTasks 会启动定时任务 CacheRefreshThread 增量的拉取 Eureka Server 的注册信息(后续的博客会分析增量拉取注册表)。

在DiscoveryClient 初始化拉取全量配置中心，然后通过定时任务每 30 秒去 Eureka Server 拉取增量的注册表信息。保证服务调用的是最新服务的注册中心。

### 2、Eureka Server 获取注册表

当 Eureka Client 初始化时调用 Eureka Client 提供的 http 接口其实是 ApplicationsResource#getContainers 。

> ApplicationsResource#getContainers

```java
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
        if (!registry.shouldAllowAccess(isRemoteRegionRequested)) {
            return Response.status(Status.FORBIDDEN).build();
        }
        CurrentRequestVersion.set(Version.toEnum(version));
        KeyType keyType = Key.KeyType.JSON;
        String returnMediaType = MediaType.APPLICATION_JSON;
        if (acceptHeader == null || !acceptHeader.contains(HEADER_JSON_VALUE)) {
            keyType = Key.KeyType.XML;
            returnMediaType = MediaType.APPLICATION_XML;
        }
        Key cacheKey = new Key(Key.EntityType.Application,
                ResponseCacheImpl.ALL_APPS,
                keyType, CurrentRequestVersion.get(), EurekaAccept.fromString(eurekaAccept), regions
        );
        Response response;
        if (acceptEncoding != null && acceptEncoding.contains(HEADER_GZIP_VALUE)) {
            response = Response.ok(responseCache.getGZIP(cacheKey))
                    .header(HEADER_CONTENT_ENCODING, HEADER_GZIP_VALUE)
                    .header(HEADER_CONTENT_TYPE, returnMediaType)
                    .build();
        } else {
            response = Response.ok(responseCache.get(cacheKey))
                    .build();
        }
        CurrentRequestVersion.remove();
        return response;
    }
```

上面的代码看着挺多，其实逻辑还是挺简单的。

- 如果你没有指定 regions 信息的话，这个值默认会是空字符串，然后它的 EurekaMonitors.GET_ALL 监控指标会 +1
- PeerAwareInstanceRegistry 注册中心会判断当前访问是否可以进行，它主要是通过当前系统时间与启动时间的关系或者判断远程配置中心的数据是否可读。具体可参见:PeerAwareInstanceRegistryImpl#shouldAllowAccess(boolean)
- 配置中心中的服务注册信息支持 XML 与 JSON 格式并且可以使用 gzip 进行压缩
- 读取的服务注册信息是从 ResponseCache 进行读取

### 3、Eureka Server 多级缓存

既然在Eureka Server 中获取注册信息是从 ResponseCache 进行读取的，那么我们看一下这个缓存是从什么时候进行初始化的。

从上面的时序图当中我们可以看到，在 Eureka Server 进行初始化的时候会初始化注册中心 PeerAwareInstanceRegistryImpl 这个对象会调用它的 init 方法并最终调用 PeerAwareInstanceRegistryImpl#initializedResponseCache 初始化注册信息列表的缓存。

> PeerAwareInstanceRegistryImpl#initializedResponseCache

```java
    @Override
    public synchronized void initializedResponseCache() {
        if (responseCache == null) {
            responseCache = new ResponseCacheImpl(serverConfig, serverCodecs, this);
        }
    }
```

下面我们来分析一下 `ResponseCacheImpl` 的初始化过程：

> ResponseCacheImpl

```java
    ResponseCacheImpl(EurekaServerConfig serverConfig, ServerCodecs serverCodecs, AbstractInstanceRegistry registry) {
        this.serverConfig = serverConfig;
        this.serverCodecs = serverCodecs;
        this.shouldUseReadOnlyResponseCache = serverConfig.shouldUseReadOnlyResponseCache();
        this.registry = registry;
        long responseCacheUpdateIntervalMs = serverConfig.getResponseCacheUpdateIntervalMs();
        this.readWriteCacheMap =
                CacheBuilder.newBuilder().initialCapacity(serverConfig.getInitialCapacityOfResponseCache())
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
                                Value value = generatePayload(key);
                                return value;
                            }
                        });
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

- 在 ResponseCacheImpl 初始化的时候通过 ConcurrentHashMap 构建一级只读缓存 readOnlyCacheMap；通过 Guava 的 LoadingCache 构建二级读写缓存。构建 Eureka Server 注册表的多级缓存机制
- ConcurrentHashMap 构建一级只读缓存 readOnlyCacheMap 会通过定时任务 TimerTask 从 LoadingCache 构建二级读写缓存进行比对更新(每 30 秒执行一次)
- LoadingCache 构建二级读写缓存会在 180 秒钟后就会过期
- 在 ResponseCacheImpl 中还提供了 invalidate 方法进行手动过期，当 Eureka Server 发生了服务注册、下线、故障会自动过期该缓存

上面说了 Eureka Server 多级缓存提供了只读缓存、读写缓存以及这两个缓存的过期策略，下面我们来看一下缓存的获取。

> ResponseCacheImpl#getValue

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
            logger.error("Cannot get value for key : {}", key, t);
        }
        return payload;
    }
```

- 当 Eureka Client 获取注册表的时候，首先会从只读缓存中获取数据
- 如果只读缓存为空就会从读写缓存中获取数据，并把读取到的值添加到只读缓存当中
