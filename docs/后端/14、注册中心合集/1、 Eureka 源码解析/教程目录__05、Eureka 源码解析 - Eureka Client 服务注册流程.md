# 05、Eureka 源码解析 - Eureka Client 服务注册流程
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/5.html
- 分类：注册中心
- 分组：教程目录
下面是官方提供的 Eureka 架构图：

对于Eureka 而言，微服务的提供者和消费者都是它的客户端，其中服务提供者关注**服务注册**、**服务续约** 和 **服务下线**等功能，而服务消费者关注于 **服务信息的获取**。下面我们来看一下 Eureka Client 的服务注册流程。

### 1、Eureka Client 注册流程

在DiscoveryClient 类中，服务注册操作由 register 方法完成。下面我们来看一下这个方法的定义：

> DiscoveryClient#register

```java
boolean register() throws Throwable {
        EurekaHttpResponse<Void> httpResponse;
        try {
            httpResponse = eurekaTransport.registrationClient.register(instanceInfo);
        } catch (Exception e) {
            throw e;
        }
        return httpResponse.getStatusCode() == 204;
}
```

上述register 方法会在 `InstanceInfoReplicator` 类的 run 方法中进行执行。从操作流程上讲，上述代码的逻辑非常简单，即服务提供者先将自己注册到 Eureka 服务器中，然后根据返回的结果确定操作是否成功。显然，这里的重点代码是 `eurekaTransport.registrationClient.register()` ，DiscoveryClient 通过这行代码发起了远程请求。

### 2、Eureka Client Http 抽象

下面是EurekaClient 实例初始化远程调用 Eureka Server 所需要的 Http 调用的时序图。

Eureka Client 在进行服务实例注册的时候是调用它的内部类 `EurekaTransport` 的属性 `registrationClient` 就是 `EurekaHttpClient` 这个对象。我们首先来看一下这个接口的定义：

> EurekaHttpClient.java

```java
public interface EurekaHttpClient {
    EurekaHttpResponse<Void> register(InstanceInfo info);
    EurekaHttpResponse<Void> cancel(String appName, String id);
    EurekaHttpResponse<InstanceInfo> sendHeartBeat(String appName, String id, InstanceInfo info, InstanceStatus overriddenStatus);
    EurekaHttpResponse<Void> statusUpdate(String appName, String id, InstanceStatus newStatus, InstanceInfo info);
    EurekaHttpResponse<Void> deleteStatusOverride(String appName, String id, InstanceInfo info);
    EurekaHttpResponse<Applications> getApplications(String... regions);
    EurekaHttpResponse<Applications> getDelta(String... regions);
    EurekaHttpResponse<Applications> getVip(String vipAddress, String... regions);
    EurekaHttpResponse<Applications> getSecureVip(String secureVipAddress, String... regions);
    EurekaHttpResponse<Application> getApplication(String appName);
    EurekaHttpResponse<InstanceInfo> getInstance(String appName, String id);
    EurekaHttpResponse<InstanceInfo> getInstance(String id);
    void shutdown();
}
```

可以看到这个对象实例抽象了 Eureka Client 调用 Eureka Server 的核心 http 功能。包含 register、cancel、sendHeartBeat、statusUpdate、getApplications 等。在 Eureka 中，关于如何实现客户端与服务器端的远程通信，从工作原理上讲只是一个 RESTful 风格的 HTTP 请求。但是它的实现还是蛮复杂的，我们先来看 EurekaHttpClient 接口的一个实现类 EurekaHttpClientDecorator。

```java
public abstract class EurekaHttpClientDecorator implements EurekaHttpClient {
    public enum RequestType {
        Register,
        Cancel,
        SendHeartBeat,
        StatusUpdate,
        DeleteStatusOverride,
        GetApplications,
        …
    }
    public interface RequestExecutor<R> {
        EurekaHttpResponse<R> execute(EurekaHttpClient delegate);
        RequestType getRequestType();
    }
    protected abstract <R> EurekaHttpResponse<R> execute(RequestExecutor<R> requestExecutor);
    @Override
    public EurekaHttpResponse<Void> register(final InstanceInfo info) {
        return execute(new RequestExecutor<Void>() {
            @Override
            public EurekaHttpResponse<Void> execute(EurekaHttpClient delegate) {
                return delegate.register(info);
            }
            @Override
            public RequestType getRequestType() {
                return RequestType.Register;
            }
        });
	    }
	//省略其他方法实现
}
```

从它的类命名就可以看出 EurekaHttpClientDecorator 是一个 EurekaHttpClient 的装饰器，并且提供一个模板抽象方法`execute(RequestExecutor requestExecutor)`。`EurekaHttpClient` 对象实例也可以通过 `EurekaHttpClientFactory` 进行创建。

其实从上面的时序图中我们可以看到， Eureka Client 在抽象 Eureka Server 的时候它的其实有以下的几层抽象。

对于高阶 API，主要是通过装饰器模式进行一系列包装，从而创建目标 EurekaHttpClient。而关于低阶 API 的话，主要是 HTTP 远程调用的实现，Netflix 提供的是基于 Jersey 的版本，而 对于 HTTP 协议的调用 Eureka 封装了 Apache 提供的 HttpClient 4。

### 3、Eureka Server 服务注册

Eureka Client 在进行微服务注册的时候，其实是通过 EurekaHttpClient 实现类 AbstractJerseyEurekaHttpClient#register 进行服务注册的。

```java
    public EurekaHttpResponse<Void> register(InstanceInfo info) {
        String urlPath = "apps/" + info.getAppName();
        ClientResponse response = null;
        try {
            Builder resourceBuilder = jerseyClient.resource(serviceUrl).path(urlPath).getRequestBuilder();
            addExtraHeaders(resourceBuilder);
            response = resourceBuilder
                    .header("Accept-Encoding", "gzip")
                    .type(MediaType.APPLICATION_JSON_TYPE)
                    .accept(MediaType.APPLICATION_JSON)
                    .post(ClientResponse.class, info);
            return anEurekaHttpResponse(response.getStatus()).headers(headersOf(response)).build();
        } finally {
            if (response != null) {
                response.close();
            }
        }
    }
```

在这里它会构建一个类似后面请求地址: `http://localhost:8080/v2/apps/APPLICATION0`，并且发送一个 `post` 请求。

- **http://localhost:8080** ：Eureka Server 服务的域名与端口
- **/v2/apps** ：Eureka Server 处理应用的 uri 地址
- **APPLICATION0**：微服务的应用名称，要求唯一值

我们在 Eureka Server 引用的 eureka-core 中可以找到 ApplicationsResource#getApplicationResource 来处理注册请求。

> ApplicationsResource#getApplicationResource

```java
    @Path("{appId}")
    public ApplicationResource getApplicationResource(
            @PathParam("version") String version,
            @PathParam("appId") String appId) {
        CurrentRequestVersion.set(Version.toEnum(version));
        try {
            return new ApplicationResource(appId, serverConfig, registry);
        } finally {
            CurrentRequestVersion.remove();
        }
    }
```

> 之前说过 Eureka Server 中使用 Jeysey Restful 来处理 http 请求，而 com.netflix.eureka.resources 包下面的 XXXResource 相当于 Spring MVC 中的 Controller。

上面的类中返回 ApplicationResource 说明真正的处理类是在 ApplicationResource中，并且在客户端发送的是 post 请求。那么我们就应该去ApplicationResource 中找 post 处理的方法。最终会找到 ApplicationResource#addInstance。

而服务的最终注册会调用到 AbstractInstanceRegistry#register，在 Eureka Server 当中它是把微服务的注册信息以数据结构 ConcurrentHashMap`>`>` 保存到内存当中。所以后续我们会分析集群环境之后 Eureka Server 注册信息的同步以及 Eureka Client 定时同步 Eureka Server 的注册信息到 Eureka Client 的本地。而这种数据结构保存的数据格式如下所示：

```java
{
	"APPLICATION0" : {
		"i-00000000" : InstanceInfo 对象,
		"i-00000001" : InstanceInfo 对象
	},
	"APPLICATION1" : {
		"i-00000000" : InstanceInfo 对象
	}
}
```

- APPLICATION0 ：表示我们微服务的名称，比如：user-service，order-service

-`i-00000000` ：一个微服务可以有多个实例，而`i-00000000` 就是服务实例的 ID，比如 `user-service` 用户服务发布了 8 台机器，`i-00000000` 就表示其中一台具体的机器 ID。
- InstanceInfo 对象：微服务实例信息对象，包含服务名称、服务域名、服务端口、服务分组以及服务的元数据信息等，Eureka 调用者获取到服务实例信息就可以进行远程调用。

关于服务实例信息对象大家可以参看 `com.netflix.appinfo.InstanceInfo` 这个对象。这个类其实就是一个 POJO 对象，并不复杂。

下面我们来分析一下服务的注册过程，也就是 com.netflix.eureka.registry.AbstractInstanceRegistry#register。

> AbstractInstanceRegistry#register

```java
   public void register(InstanceInfo registrant, int leaseDuration, boolean isReplication) {
        read.lock();
        try {
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
            // Retain the last dirty timestamp without overwriting it, if there is already a lease
            if (existingLease != null && (existingLease.getHolder() != null)) {
                Long existingLastDirtyTimestamp = existingLease.getHolder().getLastDirtyTimestamp();
                Long registrationLastDirtyTimestamp = registrant.getLastDirtyTimestamp();
                logger.debug("Existing lease found (existing={}, provided={}", existingLastDirtyTimestamp, registrationLastDirtyTimestamp);
                // this is a > instead of a >= because if the timestamps are equal, we still take the remote transmitted
                // InstanceInfo instead of the server local copy.
                if (existingLastDirtyTimestamp > registrationLastDirtyTimestamp) {
                    logger.warn("There is an existing lease and the existing lease's dirty timestamp {} is greater" +
                            " than the one that is being registered {}", existingLastDirtyTimestamp, registrationLastDirtyTimestamp);
                    logger.warn("Using the existing instanceInfo instead of the new instanceInfo as the registrant");
                    registrant = existingLease.getHolder();
                }
            } else {
                // The lease does not exist and hence it is a new registration
                synchronized (lock) {
                    if (this.expectedNumberOfClientsSendingRenews > 0) {
                        // Since the client wants to register it, increase the number of clients sending renews
                        this.expectedNumberOfClientsSendingRenews = this.expectedNumberOfClientsSendingRenews + 1;
                        updateRenewsPerMinThreshold();
                    }
                }
                logger.debug("No previous lease information found; it is new registration");
            }
            Lease<InstanceInfo> lease = new Lease<InstanceInfo>(registrant, leaseDuration);
            if (existingLease != null) {
                lease.setServiceUpTimestamp(existingLease.getServiceUpTimestamp());
            }
            gMap.put(registrant.getId(), lease);
            recentRegisteredQueue.add(new Pair<Long, String>(
                    System.currentTimeMillis(),
                    registrant.getAppName() + "(" + registrant.getId() + ")"));
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
            // Set the status based on the overridden status rules
            InstanceStatus overriddenInstanceStatus = getOverriddenInstanceStatus(registrant, existingLease, isReplication);
            registrant.setStatusWithoutDirty(overriddenInstanceStatus);
            // If the lease is registered with UP status, set lease service up timestamp
            if (InstanceStatus.UP.equals(registrant.getStatus())) {
                lease.serviceUp();
            }
            registrant.setActionType(ActionType.ADDED);
            recentlyChangedQueue.add(new RecentlyChangedItem(lease));
            registrant.setLastUpdatedTimestamp();
            invalidateCache(registrant.getAppName(), registrant.getVIPAddress(), registrant.getSecureVipAddress());
            logger.info("Registered instance {}/{} with status {} (replication={})",
                    registrant.getAppName(), registrant.getId(), registrant.getStatus(), isReplication);
        } finally {
            read.unlock();
        }
    }
```

- read.lock()：首先调用读锁，防止注册的时候其它线程调用这个方法出现并发问题。
- 根据微服务名称从注册表 registry 中获取注册的 Map`>`.
- 如果该服务之前没有注册过创建一个 ConcurrentHashMap`>`() 添加到registry 注册表当中
- 根据服务实例的 ID 从该服务的注册列表中获取 Lease 对象
- 调用 Lease`` lease = new Lease``(registrant, leaseDuration); 构建一个新的 Lease`` 对象，并添加到该服务的注册 ConcurrentHashMap`>`() 当中
- 把服务注册的当时时间与服务名+服务应用 ID 添加到 recentRegisteredQueue 当中，把服务应用信息添加到 recentlyChangedQueue 当中(**现在可以不考虑这个动作，后续会分析这个队列**)
- 清除缓存， Eureka Client 在查询 Eureka Server 的注册表会有一个缓存(**现在可以不考虑这个动作，后续会分析这个缓存**)

上面就是整个 Eureka Client 的服务注册过程了。
