# 05、源码解析 Eureka 注册表源码解析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/5.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
Eureka注册表源码解析

## 1、Eureka注册表整体流程图

## 1、Eureka注册表二级缓存源码解析

## 1.1 获取注册表流程源码入口

```java
@GET
public Response getApplication(@PathParam("version") String version,
                               @HeaderParam("Accept") final String acceptHeader,
                               @HeaderParam(EurekaAccept.HTTP_X_EUREKA_ACCEPT) String eurekaAccept) {
    if (!registry.shouldAllowAccess(false)) {
        return Response.status(Status.FORBIDDEN).build();
    }
    EurekaMonitors.GET_APPLICATION.increment();
    CurrentRequestVersion.set(Version.toEnum(version));
    KeyType keyType = Key.KeyType.JSON;
    if (acceptHeader == null || !acceptHeader.contains("json")) {
        keyType = Key.KeyType.XML;
    }
    Key cacheKey = new Key(
            Key.EntityType.Application,
            appName,
            keyType,
            CurrentRequestVersion.get(),
            EurekaAccept.fromString(eurekaAccept)
    );
    // 这个就是获取的方法，主要看一下这里
    String payLoad = responseCache.get(cacheKey);
    if (payLoad != null) {
        logger.debug("Found: {}", appName);
        return Response.ok(payLoad).build();
    } else {
        logger.debug("Not Found: {}", appName);
        return Response.status(Status.NOT_FOUND).build();
    }
}
```

## 1.2 getValue(获取缓存信息的方法)

```java
@VisibleForTesting
Value getValue(final Key key, boolean useReadOnlyCache) {
    Value payload = null;
    try {
        //1、判断是否开启使用只读缓存
        if (useReadOnlyCache) {
            // 1.1 为真从 readOnlyCacehMap 中获取
            final Value currentPayload = readOnlyCacheMap.get(key);
            // 1.2 判断不为空，直接返回 
            if (currentPayload != null) {
                payload = currentPayload;
            } else {
                // 1.3 如果为空，则从 readWriteCacheMap 中获取，并写入到 readOnlyCacheMap 中
                payload = readWriteCacheMap.get(key);
                readOnlyCacheMap.put(key, payload);
            }
        } else {
            //2、没有开户则直接从 readWriteCacheMap 中获取
            payload = readWriteCacheMap.get(key);
        }
    } catch (Throwable t) {
        logger.error("Cannot get value for key :" + key, t);
    }
    return payload;
}
```

## 1.3 readOnlyCacheMap (只读缓存，Map，没什么特殊的逻辑，简单)

> 就是一个 ConcurrentHashMap，没有什么要说的。但是他有一个定时任务在实例化的时候就开启了

```java
// ResponseCache 实例化的时候开启
// 开启更新 readOnlyCacheMap 的定时任务
if (shouldUseReadOnlyResponseCache) {
    timer.schedule(getCacheUpdateTask(),
                   // 30s 之后触发
                   new Date(((System.currentTimeMillis() / responseCacheUpdateIntervalMs) * responseCacheUpdateIntervalMs)
                            + responseCacheUpdateIntervalMs),
                   // 每隔 30s 触发一次
                   responseCacheUpdateIntervalMs);
}
```

## 1.4 readWriteCacheMap (Guava 实现的 Cache 组件，需要看一下具体的逻辑)

```java
//ResponseCache 实例化的时候构造的
this.readWriteCacheMap =
    // 1、 初始大小是 1000
    CacheBuilder.newBuilder().initialCapacity(1000)
    // 2、180s 过期
    .expireAfterWrite(serverConfig.getResponseCacheAutoExpirationInSeconds(), TimeUnit.SECONDS)
    // 3、注册了监听器
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
```

## 1.5 AbstractInstanceRegistry(注册表，其实也是一个 Map，没什么特别的逻辑，比如简单)

## 2、Eureka注册表缓存过期机制源码解析

## 2.1 缓存主动过期

在com.netflix.eureka.registry.AbstractInstanceRegistry 中搜索 invalidateCache,可以发现有 4 个地方调用了失效缓存的方法

1、cancel

2、register

3、statusUpdate

4、deleteStatusOverride

所以这 4 种情况下都会去失效缓存，因为实例信息发生了变化，所以要把缓存失效掉

好，那我们来看一下失效缓存的方法

```java
@Override
public void invalidate(String appName, @Nullable String vipAddress, @Nullable String secureVipAddress) {
    for (Key.KeyType type : Key.KeyType.values()) {
        for (Version v : Version.values()) {
            // 可以看到去失效 appName 对应的缓存，还有 ALL_APPS、ALL_APPS_DELTA 对应的缓存
            invalidate(
                    new Key(Key.EntityType.Application, appName, type, v, EurekaAccept.full),
                    new Key(Key.EntityType.Application, appName, type, v, EurekaAccept.compact),
                    new Key(Key.EntityType.Application, ALL_APPS, type, v, EurekaAccept.full),
                    new Key(Key.EntityType.Application, ALL_APPS, type, v, EurekaAccept.compact),
                    new Key(Key.EntityType.Application, ALL_APPS_DELTA, type, v, EurekaAccept.full),
                    new Key(Key.EntityType.Application, ALL_APPS_DELTA, type, v, EurekaAccept.compact)
            );
            if (null != vipAddress) {
                invalidate(new Key(Key.EntityType.VIP, vipAddress, type, v, EurekaAccept.full));
            }
            if (null != secureVipAddress) {
                invalidate(new Key(Key.EntityType.SVIP, secureVipAddress, type, v, EurekaAccept.full));
            }
        }
    }
}
```

## 2.2 缓存被动过期(定时任务)

> readOnlyCacheMap 有一个定时任务，会去不断的去与 readWriteCacheMap 对比，不同的话则需要去覆盖自身的值

```java
private TimerTask getCacheUpdateTask() {
    return new TimerTask() {
        @Override
        public void run() {
            logger.debug("Updating the client cache from response cache");
            for (Key key : readOnlyCacheMap.keySet()) {
                if (logger.isDebugEnabled()) {
                    Object[] args = {
     key.getEntityType(), key.getName(), key.getVersion(), key.getType()};
                    logger.debug("Updating the client cache from response cache for key : {} {} {} {}", args);
                }
                try {
                    // 对比 readOnlyCacheMap 中的信息和 readWriteCacheMap 中的信息，如果不一致，则更新 readOnlyCacheMap 中的信息
                    CurrentRequestVersion.set(key.getVersion());
                    Value cacheValue = readWriteCacheMap.get(key);
                    Value currentCacheValue = readOnlyCacheMap.get(key);
                    if (cacheValue != currentCacheValue) {
                        readOnlyCacheMap.put(key, cacheValue);
                    }
                } catch (Throwable th) {
                    logger.error("Error while updating the client cache from response cache", th);
                }
            }
        }
    };
}
```

## 2.3 缓存定时过期(缓存声明时设置)

从readWriteCacheMap 的声明中我们知道有一个过期的控制选项

.expireAfterWrite(serverConfig.getResponseCacheAutoExpirationInSeconds(), TimeUnit.SECONDS)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
