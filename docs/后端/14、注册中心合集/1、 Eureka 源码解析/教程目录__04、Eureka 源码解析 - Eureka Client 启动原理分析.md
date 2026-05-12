# 04、Eureka 源码解析 - Eureka Client 启动原理分析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/4.html
- 分类：注册中心
- 分组：教程目录
在前面的一篇文章 [3、Eureka 源码解析 之 Eureka Server 启动原理分析](/zhuanlan/registered/eureka/1/3.html)当中我们分析了一下 Eureka Server 的启动。在集群环境下 Eureka Server 相互之前需要同步注册表信息。所以不管是微服务当中还是 Eureka Server 当中都需要依赖 `eureka-client` 这个 Jar 包。它封装 Eureka Server 提供的 Restful 服务，依赖方可以以接口方法的方式方便的进行调用。下面是 Eureka 官网提供的系统架构图。

在这个图中有以下几个角色：

- Eureka Server：Eureka 服务器，它是注册中心提供接口给应用把服务实例的信息注册上来
- Eureka Client：Eureka 客户端，Eureka 包装好了微服务访问 Eureka 服务器的一系列接口。比如：注册，心跳，服务下线等。
- Application Server：微服务应用服务器，一个单体服务可以按照不同的领域拆分为多个微服务。微服务可以依赖 Eureka 客户端这样就可以很方便的调用 Eureka 服务器上提供的接口进行服务注册与服务发现相关的功能

理解了Eureka 的整个架构以及每个角色提供的功能，那么下面我们就来分析一下 Eureka Client 的启动流程。

### 1、Eureka Client 启动整体流程

不管Eureka Server 还是微服务应用里面都会引用并创建 EurekaClient 来访问 Eureka Server，其中 Eureka Server 是配置的其它 Eureka Server 同步服务注册信息。而微服务应用服务器是从 Eureka Server 进行服务的注册与发现。并且微服务会定时向 Eureka Server 发送心跳请求，告诉 Eureka Server 当前应用实例还是存活状态，Eureka Server 在进行服务实例存活判断的时候就不会把当前服务实例剔除。

下面回到我们的主题，就是 Eureka Client 是如何启动的，其实就是如何创建 `com.netflix.discovery.EurekaClient`。因为 Eureka Client 和 Eureka Server 当中都需要创建 `EurekaClient` 这个对象实例。我们还是以 Eureka Server 服务中是如何创建 `EurekaClient` 的逻辑为例来讲解它的启动流程。

> EurekaBootStrap#initEurekaServerContext

```java
        if (eurekaClient == null) {
            EurekaInstanceConfig instanceConfig = isCloud(ConfigurationManager.getDeploymentContext())
                    ? new CloudInstanceConfig()
                    : new MyDataCenterInstanceConfig();
            applicationInfoManager = new ApplicationInfoManager(
                    instanceConfig, new EurekaConfigBasedInstanceInfoProvider(instanceConfig).get());
            EurekaClientConfig eurekaClientConfig = new DefaultEurekaClientConfig();
            eurekaClient = new DiscoveryClient(applicationInfoManager, eurekaClientConfig);
        } else {
            applicationInfoManager = eurekaClient.getApplicationInfoManager();
        }
```

因为Eureka Server 在启动的时候必然 `eurekaClient` 对象实例为空，所以就会进到上面的逻辑。其实在 Eureka Server 启动流程分析的时候我们已经大概的分析了这个创建过程。

- 创建 EurekaInstanceConfig 对象实例，它主要是一个配置读取接口。在创建 EurekaInstanceConfig 对象实例的时候，因为我们不是 AWS，所以创建的对象是 MyDataCenterInstanceConfig 对象实例。在调用 MyDataCenterInstanceConfig 无参构建器进行初始化的时候首先会调用它的 PropertiesInstanceConfig 进行初始化，这里它会使用 ConfigurationManager 加载 eureka-client.properties 并创建一个 DynamicPropertyFactory 实例对于读取 ConfigurationManager 里面管理的配置文件。
- 创建 ApplicationInfoManager 对象实例，它主要应用实例管理相关，提供服务注册相关的接口。 ApplicationInfoManager 对象实例创建本身很简单。主要是通过 new EurekaConfigBasedInstanceInfoProvider(instanceConfig).get()，传入服务实例配置信息然后创建当前服务实例对象 InstanceInfo 。里面的代码其实也是挺简单的，就是通过传入的配置类通过 Builder 模式构建一个 InstanceInfo 对象
- 创建 EurekaClientConfig 对象，它也是一个配置类，上面的 EurekaInstanceConfig 对象主要是服务实例相关的配置，比如 host、instanceId、port 相关的。而它主要是 EurekaClient 相关的配置，是否从其它 Eureka Server 拉取注册表，是否需要注册到其它 Eureka Server 等待。它也是在自己无参构建器中读取 eureka-client.properites 文件，创建 DynamicPropertyFactory 实例用于读取配置文件中的信息；创建 EurekaTransportConfig 用于 EurekaClient 进行服务的访问。
- 创建 DiscoveryClient 对象，它其实是 com.netflix.discovery.EurekaClient 接口的实例对象。它主要是封装了微服务(或者 Eureka Server 集群环境下) 调用 Eureka Server 的接口，并且内部封装了服务自动注册与发现的功能。

我们首先来看一下 `DiscoveryClient` 接口的定义，提供了哪些功能：

> EurekaClient.java

```java
public interface EurekaClient extends LookupService {
	// 获取指定分区下的应用信息
    public Applications getApplicationsForARegion(@Nullable String region);
	// 获取指定 Eureka Service 中注册的应用信息
    public Applications getApplications(String serviceUrl);
	// 条件获取服务实例信息
    public List<InstanceInfo> getInstancesByVipAddress(String vipAddress, boolean secure);
	// 条件获取服务实例信息
    public List<InstanceInfo> getInstancesByVipAddress(String vipAddress, boolean secure, @Nullable String region);
	// 条件获取服务实例信息
    public List<InstanceInfo> getInstancesByVipAddressAndAppName(String vipAddress, String appName, boolean secure);
	// 获取所有的分区信息
    public Set<String> getAllKnownRegions();
	// 从 Eureka Server 获取当前自身实例状态
    public InstanceInfo.InstanceStatus getInstanceRemoteStatus();
	// 废弃方法，可以不关注
    public List<String> getDiscoveryServiceUrls(String zone);
	// 废弃方法，可以不关注
    public List<String> getServiceUrlsFromConfig(String instanceZone, boolean preferSameZone);
	// 废弃方法，可以不关注
    public List<String> getServiceUrlsFromDNS(String instanceZone, boolean preferSameZone);
	// 废弃方法，可以不关注
    public void registerHealthCheckCallback(HealthCheckCallback callback);
	// 注册心跳检测处理器
    public void registerHealthCheck(HealthCheckHandler healthCheckHandler);
	// 注册事件监听器
    public void registerEventListener(EurekaEventListener eventListener);
	// 解除事件监听器
    public boolean unregisterEventListener(EurekaEventListener eventListener);
	// 获取心跳检测处理类
    public HealthCheckHandler getHealthCheckHandler();
	// 服务下线
    public void shutdown();
	// 获取 Eureka Client 相关配置
    public EurekaClientConfig getEurekaClientConfig();
	// 获取服务应用管理器
    public ApplicationInfoManager getApplicationInfoManager();
}
public interface LookupService<T> {
	// 根据指定 appName 获取当前 Eureka Server 注册的应用信息
    Application getApplication(String appName);
    // 获取当前 Eureka Server 注册的应用信息
    Applications getApplications();
	// 根据 ID 获取服务实例信息列表
    List<InstanceInfo> getInstancesById(String id);
	// 从 Eureka Server 获取下一个可能的服务器来处理来自注册表的请求
    InstanceInfo getNextServerFromEureka(String virtualHostname, boolean secure);
}
```

可以看到 `EurekaClient` 提供的功能偏向于微服务中依赖的 eureka-client 提供的功能，而 `LookupService` 比较偏向于 `eureka-server` 里面的接口，当微服务需要服务发现的时候 Eureka 基本就会调用`LookupService` 提供的接口。

### 2、Eureka Client 初始化流程

下面就是通过 `ApplicationInfoManager` 与 `EurekaClientConfig` 对象创建 `DiscoveryClient` 的代码。

> EurekaBootStrap#initEurekaServerContext

```java
EurekaClient eurekaClient = new DiscoveryClient(applicationInfoManager, eurekaClientConfig);
```

上面的代码看着平平无奇，实际上内含乾坤。下面就是 DiscoveryClient 初始化的时序图：

下面就是调用的 DiscoveryClient 的 5 个参数的构建器：

```java
    DiscoveryClient(ApplicationInfoManager applicationInfoManager, EurekaClientConfig config, AbstractDiscoveryClientOptionalArgs args,
                    Provider<BackupRegistry> backupRegistryProvider, EndpointRandomizer endpointRandomizer) {
	......
}
```

- 首先将服务实例、服务实例管理器、eureka client 配置都保存一下
- 如果要抓取注册表会创建一个 ThresholdLevelMetric 对象进行 JMX 监控
- 如果要服务注册的话会创建一个 ThresholdLevelMetric 对象进行 JMX 监控
- 如果不需要抓取注册表和不需要进行服务注册就直接返回
- 创建 scheduler、heartbeatExecutor 和 cacheRefreshExecutor 这三个线程池
- 调用 scheduleServerEndpointTask 方法，初始化 EurekaTransport 对象
- 如果需要抓取注册表 clientConfig.shouldFetchRegistry()，从远程中抓取注册表添加到 com.netflix.discovery.DiscoveryClient#localRegionApps 属性当中。
- 如果需要注册到 Eureka Server【clientConfig.shouldRegisterWithEureka()】以及在初始化的时候就进行注册【clientConfig.shouldEnforceRegistrationAtInit()】，就把当前服务注册到 Eureka Server 服务器
- 通过 initScheduledTasks 启动一些定时任务，后面具体分析
- 把自己注册到 Monitors 当中 使用 JMX 进行监控

可以看到 EurekaClient 在启动的时候，主要是会从 Eureka Server 拉取一下注册表信息，并且进行一些 JMX 监控以及进行一些定时任务调度。其实这些定时任务调度还是非常重要的，下面我们就来分析一下这些定时任务

### 3、Eureka Client 初始化中的定时任务

在 Eureka Client 初始化中创建 scheduler、heartbeatExecutor 和 cacheRefreshExecutor 这三个线程池，然后 DiscoveryClient#initScheduledTasks 就会通过这些线程池启动一些定时任务。

- 如果需要抓取定时任务【clientConfig.shouldFetchRegistry()】，通过 CacheRefreshThread 这个定时任务默认 30 秒去 Eureka Server 抓取最新的服务的注册表并且添加到 com.netflix.discovery.DiscoveryClient#localRegionApps 属性当中
- 如果需要把服务注册到注册中心【clientConfig.shouldRegisterWithEureka()】，通过 HeartbeatThread 把心跳发送到注册中心。
- 创建 InstanceInfoReplicator 任务类，它主要负责将自身的信息周期性的上报到 Eureka server，会调用它的 start 进行定时调用，同时如果配置了状态变更需要进行通知【clientConfig.shouldOnDemandUpdateStatusChange()】时，会把创建 StatusChangeListener 并把这个监听器注册到 ApplicationInfoManager 当中。

> InstanceInfoReplicator 的作用

先看InstanceInfoReplicator源码的注释：

```java
/**
 * A task for updating and replicating the local instanceinfo to the remote server. Properties of this task are:
 * - configured with a single update thread to guarantee sequential update to the remote server
 * - update tasks can be scheduled on-demand via onDemandUpdate()
 * - task processing is rate limited by burstSize
 * - a new update task is always scheduled automatically after an earlier update task. However if an on-demand task
 *   is started, the scheduled automatic update task is discarded (and a new one will be scheduled after the new
 *   on-demand update).
 *
 *   @author dliu
 */
```

下面是InstanceInfoReplicator 的类描述的大概理解：

- InstanceInfoReplicator是个任务类，负责将自身的信息周期性的上报到Eureka server；
- 有两个场景触发上报：周期性任务、服务状态变化(onDemandUpdate被调用)，因此，在同一时刻有可能有两个上报的任务同时出现；
- 单线程执行上报的操作，如果有多个上报任务，也能确保是串行的；
- 有频率限制，通过burstSize参数来控制；
- 先创建的任务总是先执行，但是onDemandUpdate方法中创建的任务会将周期性任务给丢弃掉；

> Eureka Client 在启动的时候会去 Eureka Server 拉取注册表信息，然后会定时的从注册中心把注册的服务应用信息同步到 Eureka Client 保证 Eureka Client 本地的服务列表是最新的可用的服务信息。同时 Eureka Client 会定时发送心跳到 Eureka Server(注册中心)，告诉注册中心当前实例信息还是存活状态不要把我进行踢出掉。

**参考文章：**

- [Eureka的InstanceInfoReplicator类（服务注册辅助工具）](https://blog.csdn.net/boling_cavalry/article/details/82909130)
