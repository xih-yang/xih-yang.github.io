# 04、Eureka 源码解析之EurekaClient源码解析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-2/4.html
- 分类：注册中心
- 分组：Eureka 教程（版本 B）
## EurekaClien

EurekaClient 为了简化开发人员的工作量，将很多与EurekaServer交互的工作隐藏起来，自主完成。具体完成的工作分为三个阶段， 应用启动阶段,执行阶段, 销毁阶段. 各阶段的工作如下:

## 应用启动阶段

**1、** 读取与EurekaServer交互的配置信息,封装成EurekaClientConfig；

**2、** 读取自身服务实例配置信息,封装成EurekalnstanceConfig；

**3、** 从Eurekaserver拉取注册表信息并缓存到本地；

**4、** 服务注册；

**5、** 初始化发送心跳、缓存刷新(拉取注册表信息更新本地缓存)和按需注册(监控服务实例信息变化,决定是否重新发起注册,更新注册表中的服务实例元数据)定时任务；

## 应用执行阶段

**1、** 定时发送心跳到EurekaServer中维持在注册表的租约；

**2、** 定时从EurekaServer中拉取注册表信息,更新本地注册表缓存；

**3、** 监控应用自身信息变化,若发生变化,需要重新发起服务注册；

## 应用销毁阶段

**从 Eureka Server注销自身服务实例**

下面让我们按阶段来分析一下源码

**应用启动阶段与运行阶段分析**

Eureka Client通过Starter的方式引人依赖, Spring Boot将会为项目使用以下的自动配置类

- EurekaClientAutoConfiguration：EurekeClient 自动配置类,负责Eureka关键Beans的配置和初始化,如AppplicationInfoManager和 EurekaClientConfig等。
- RibbonEurekaAutoConfiguration: Ribbon负载均衡相关配置。
- EurekaDiscoveryClientConfiguration: 配置自动注册和应用的健康检查器。

查看源码: 在classpath下查找 Spring-cloud-netflix-eureka-client.xx.jar 下 META-INF 下的Spring.factories配置信息.

## 读取应用自身配置

通过 **EurekaClientAutoConfiguration**配置类, Spring boot帮助 Eureka Client完成很多必要Bean的属性读取和配置

- EurekaClientConfig: 封装 Eureka Client与 Eureka Server交互所需要的配置信息。 Spring Cloud为其提供了一个默认配置类的EurekaClientConfigBean,可以在配置文件中通过前缀 eureka.client属性名进行属性覆盖
- ApplicationInfoManager : 作为应用信息管理器,管理服务实例的信息类 InstanceInfo和服务实例的配置信息类 EurekaInstanceConfig
- InstanceInfo: 封装将被发送到 Eureka Server进行服务注册的服务实例元数据。它在Eurek Server的注册表中代表一个服务实例,其他服务实例可以通过 Instancelnfo了解该服务的相关信息从而发起服务请求
- EurekaInstanceConfig: 封装EurekaClient自身服务实例的配置信息,主要用于构建InstanceInfo通常这些信息在配置文件中的eureka.instance前缀下进行设置, SpringCloud通过EurekalnstanceConfigBean配置类提供了默认配置
- DiscoveryClient: Spring Cloud中定义用来服务发现的客户端接口, 对于DiscoveryClient可以具体查看 EurekaDiscoveryClient，EurekaDiscoveryClient又借助EurekaClient来实现

```java
@Bean  //由spring 托管
public DiscoveryClient discoveryClient(EurekaClient client,
			EurekaClientConfig clientConfig) {
	return new EurekaDiscoveryClient(client, clientConfig);
}
```

在新版的springcloud中( 2021版）这个类被它的一个子类 CloudEurekaClient代替了。

```java
@Bean(
    destroyMethod = "shutdown"
)
@ConditionalOnMissingBean(
    value = {EurekaClient.class},
    search = SearchStrategy.CURRENT
)
@org.springframework.cloud.context.config.annotation.RefreshScope
@Lazy
public EurekaClient eurekaClient(ApplicationInfoManager manager, EurekaClientConfig config, EurekaInstanceConfig instance, @Autowired(required = false) HealthCheckHandler healthCheckHandler) {
    ApplicationInfoManager appManager;
    if (AopUtils.isAopProxy(manager)) {
        appManager = (ApplicationInfoManager)ProxyUtils.getTargetObject(manager);
    } else {
        appManager = manager;
    }
    //这个类是  DiscoveryClient的子类，请跟踪这个类
    CloudEurekaClient cloudEurekaClient = new CloudEurekaClient(appManager, config, this.optionalArgs, this.context);
    cloudEurekaClient.registerHealthCheck(healthCheckHandler);
    return cloudEurekaClient;
}
```

另外在netflix包里面还有一个DiscoveryClient，按名字翻译其实就是服务发现客户端，他是整个EurekaClient的核心，是与EurekaServer进行交互的核心所在.

客户端的类结构:

**下面来查看一下 eureka-client.xxx.jar下的 DiscoveryClient是开始时如何运行服务的.**

```java
 DiscoveryClient(ApplicationInfoManager applicationInfoManager, EurekaClientConfig config, AbstractDiscoveryClientOptionalArgs args,
                   Provider<BackupRegistry> backupRegistryProvider) {
        if (args != null) {
            this.healthCheckHandlerProvider = args.healthCheckHandlerProvider;
            this.healthCheckCallbackProvider = args.healthCheckCallbackProvider;
            this.eventListeners.addAll(args.getEventListeners());
            this.preRegistrationHandler = args.preRegistrationHandler;
        } else {
            this.healthCheckCallbackProvider = null;
            this.healthCheckHandlerProvider = null;
            this.preRegistrationHandler = null;
        }
       
        this.applicationInfoManager = applicationInfoManager;
        InstanceInfo myInfo = applicationInfoManager.getInfo();
        clientConfig = config;
        staticClientConfig = clientConfig;
        transportConfig = config.getTransportConfig();
        instanceInfo = myInfo;
        if (myInfo != null) {
            appPathIdentifier = instanceInfo.getAppName() + "/" + instanceInfo.getId();
        } else {
            logger.warn("Setting instanceInfo to a passed in null value");
        }
//传入BackupRegistry（NotImplementedRegistryImpl）备份注册中心
        this.backupRegistryProvider = backupRegistryProvider;
        this.urlRandomizer = new EndpointUtils.InstanceInfoBasedUrlRandomizer(instanceInfo);
       localRegionApps.set(new Applications());
        fetchRegistryGeneration = new AtomicLong(0);
        remoteRegionsToFetch = new AtomicReference<String>(clientConfig.fetchRegistryForRemoteRegions());
        remoteRegionsRef = new AtomicReference<>(remoteRegionsToFetch.get() == null ? null : remoteRegionsToFetch.get().split(","));
//从eureka server拉起注册表信息 对应配置项-> eureka.client.fetch-register
        if (config.shouldFetchRegistry()) {
            this.registryStalenessMonitor = new ThresholdLevelsMetric(this, METRIC_REGISTRY_PREFIX + "lastUpdateSec_", new long[]{15L, 30L, 60L, 120L, 240L, 480L});
        } else {
            this.registryStalenessMonitor = ThresholdLevelsMetric.NO_OP_METRIC;
        }
// 当前的客户端是否应该注册到erueka中 对应配置项-> eureka.client.register-with-eureka  
        if (config.shouldRegisterWithEureka()) {
            this.heartbeatStalenessMonitor = new ThresholdLevelsMetric(this, METRIC_REGISTRATION_PREFIX + "lastHeartbeatSec_", new long[]{15L, 30L, 60L, 120L, 240L, 480L});
        } else {
            this.heartbeatStalenessMonitor = ThresholdLevelsMetric.NO_OP_METRIC;
        }
        logger.info("Initializing Eureka in region {}", clientConfig.getRegion());
        //如果既不需要注册，也不需要拉去数据，直接返回,初始结束
        if (!config.shouldRegisterWithEureka() && !config.shouldFetchRegistry()) {
            logger.info("Client configured to neither register nor query for data.");
            scheduler = null;
            heartbeatExecutor = null;
            cacheRefreshExecutor = null;
            eurekaTransport = null;
            instanceRegionChecker = new InstanceRegionChecker(new PropertyBasedAzToRegionMapper(config), clientConfig.getRegion());
            // This is a bit of hack to allow for existing code using DiscoveryManager.getInstance()
            // to work with DI'd DiscoveryClient
            DiscoveryManager.getInstance().setDiscoveryClient(this);
            DiscoveryManager.getInstance().setEurekaClientConfig(config);
            initTimestampMs = System.currentTimeMillis();
            logger.info("Discovery Client initialized at timestamp {} with initial instances count: {}",
                    initTimestampMs, this.getApplications().size());
            return;  // no need to setup up an network tasks and we are done
        }
        try {
             //线程池大小为2，一个用户发送心跳，另外个缓存刷新
            // default size of 2 - 1 each for heartbeat and cacheRefresh
            scheduler = Executors.newScheduledThreadPool(2,
                    new ThreadFactoryBuilder()
                            .setNameFormat("DiscoveryClient-%d")
                            .setDaemon(true)
                            .build());
            heartbeatExecutor = new ThreadPoolExecutor(
                    1, clientConfig.getHeartbeatExecutorThreadPoolSize(), 0, TimeUnit.SECONDS,
                    new SynchronousQueue<Runnable>(),
                    new ThreadFactoryBuilder()
                            .setNameFormat("DiscoveryClient-HeartbeatExecutor-%d")
                            .setDaemon(true)
                            .build()
            );  // use direct handoff
            cacheRefreshExecutor = new ThreadPoolExecutor(
                    1, clientConfig.getCacheRefreshExecutorThreadPoolSize(), 0, TimeUnit.SECONDS,
                    new SynchronousQueue<Runnable>(),
                    new ThreadFactoryBuilder()
                            .setNameFormat("DiscoveryClient-CacheRefreshExecutor-%d")
                            .setDaemon(true)
                            .build()
            );  // use direct handoff
//初始化client与server交互的jersey客户端
            eurekaTransport = new EurekaTransport();
            scheduleServerEndpointTask(eurekaTransport, args);
            AzToRegionMapper azToRegionMapper;
            if (clientConfig.shouldUseDnsForFetchingServiceUrls()) {
                azToRegionMapper = new DNSBasedAzToRegionMapper(clientConfig);
            } else {
               azToRegionMapper = new PropertyBasedAzToRegionMapper(clientConfig);
            }
            if (null != remoteRegionsToFetch.get()) {
                azToRegionMapper.setRegionsToFetch(remoteRegionsToFetch.get().split(","));
            }
            instanceRegionChecker = new InstanceRegionChecker(azToRegionMapper, clientConfig.getRegion());
        } catch (Throwable e) {
            throw new RuntimeException("Failed to initialize DiscoveryClient!", e);
        }
//拉取注册表的信息
        if (clientConfig.shouldFetchRegistry() && !fetchRegistry(false)) {
            fetchRegistryFromBackup();
        }
//将服务实例进行注册
        // call and execute the pre registration handler before all background tasks (inc registration) is started
        if (this.preRegistrationHandler != null) {
            this.preRegistrationHandler.beforeRegistration();
        }
        if (clientConfig.shouldRegisterWithEureka() && clientConfig.shouldEnforceRegistrationAtInit()) {
            try {
                if (!register() ) {
                    throw new IllegalStateException("Registration error at startup. Invalid server response.");
                }
            } catch (Throwable th) {
                logger.error("Registration error at startup: {}", th.getMessage());
                throw new IllegalStateException(th);
            }
        }
        // finally, init the schedule tasks (e.g. cluster resolvers, heartbeat, instanceInfo replicator, fetch
          //初始心跳定时任务，缓存刷新
        initScheduledTasks();
        try {
            Monitors.registerObject(this);
        } catch (Throwable e) {
            logger.warn("Cannot register timers", e);
        }
        // This is a bit of hack to allow for existing code using DiscoveryManager.getInstance()
        // to work with DI'd DiscoveryClient
        DiscoveryManager.getInstance().setDiscoveryClient(this);
        DiscoveryManager.getInstance().setEurekaClientConfig(config);
        initTimestampMs = System.currentTimeMillis();
        logger.info("Discovery Client initialized at timestamp {} with initial instances count: {}",
                initTimestampMs, this.getApplications().size());
    }
```

## DiscoveryClient构造函数做的事情:

**1、** 相关配置赋值；

**2、** 备份注册中心的初始化，实际什么事都没做；

**3、****拉取Server注册表中的信息**；

**4、** 注册前的预处理；

**5、****向Server注册自身**；

**6、****初始心跳定时任务，缓存刷新等定时任务**；

下面抽取构造函数中的几个

**重要步骤重点分析一下:**

### 拉取Server注册表中的信息

```java
从这一句开始: 
if (clientConfig.shouldFetchRegistry() && !fetchRegistry(false)) 
 //拉取注册信息，拉取的方法分为全量拉取和增量拉取.
 private boolean fetchRegistry(boolean forceFullRegistryFetch) {
        Stopwatch tracer = FETCH_REGISTRY_TIMER.start();
        try {
            // If the delta is disabled or if it is the first time, get all
            // applications
            //如果增量拉取被禁止,则全量拉取
            Applications applications = getApplications();
            if (clientConfig.shouldDisableDelta()
                    || (!Strings.isNullOrEmpty(clientConfig.getRegistryRefreshSingleVipAddress()))
                    || forceFullRegistryFetch
                    || (applications == null)   //如果是第一次拉取，applications为null,则全量拉取
                    || (applications.getRegisteredApplications().size() == 0)
                    || (applications.getVersion() == -1)) //Client application does not have latest library supporting delta
            {
                //全量拉取
                getAndStoreFullRegistry();
            } else {
			     //增量拉取
                getAndUpdateDelta(applications);
            }
            applications.setAppsHashCode(applications.getReconcileHashCode());
            //打印注册表上所有服务实例信息
            logTotalInstances();
        } catch (Throwable e) {
            logger.error(PREFIX + "{} - was unable to refresh its cache! status = {}", appPathIdentifier, e.getMessage(), e);
            return false;
        } finally {
            if (tracer != null) {
                tracer.stop();
            }
        }
        onCacheRefreshed();
        // Update remote status based on refreshed data held in the cache
        updateInstanceRemoteStatus();
        // registry was fetched successfully, so return true
        return true;
    }
```

**全量拉取**

一般只有发生在第一次拉去注册表信息的时候，全量拉取调用 getAndStoreFullRegistry()方法

```java
private void getAndStoreFullRegistry() throws Throwable {
    //拉取注册表的版本信息
        long currentUpdateGeneration = fetchRegistryGeneration.get();
        logger.info("Getting all instance registry info from the eureka server");
        Applications apps = null;
        EurekaHttpResponse<Applications> httpResponse = clientConfig.getRegistryRefreshSingleVipAddress() == null
                ? eurekaTransport.queryClient.getApplications(remoteRegionsRef.get())
                : eurekaTransport.queryClient.getVip(clientConfig.getRegistryRefreshSingleVipAddress(), remoteRegionsRef.get());  //eurekaTransport是客户端与服务端的联接对象
         //拉取成功,则保存信息到 apps中
        if (httpResponse.getStatusCode() == Status.OK.getStatusCode()) {
            apps = httpResponse.getEntity();
        }
        logger.info("The response status is {}", httpResponse.getStatusCode());
if (apps == null) {
            logger.error("The application is null for some reason. Not storing this information");
        } else if (fetchRegistryGeneration.compareAndSet(currentUpdateGeneration, currentUpdateGeneration + 1)) {   //拉取成功，保存
            localRegionApps.set(this.filterAndShuffle(apps));
            logger.debug("Got full registry with apps hashcode {}", apps.getAppsHashCode());
        } else {
            logger.warn("Not updating applications as another thread is updating it already");
        }
    }
```

**增量拉取**

对应的方法为: getAndUpdateDelta(applications)

```java
private void getAndUpdateDelta(Applications applications) throws Throwable {
        long currentUpdateGeneration = fetchRegistryGeneration.get();  //注册表版本,用于CAS操作
   //拉取信息
        Applications delta = null;
        EurekaHttpResponse<Applications> httpResponse = eurekaTransport.queryClient.getDelta(remoteRegionsRef.get());
        if (httpResponse.getStatusCode() == Status.OK.getStatusCode()) {
            delta = httpResponse.getEntity();
        }
     //如果拉取失败进行全量拉取
        if (delta == null) {
            logger.warn("The server does not allow the delta revision to be applied because it is not safe. "
                    + "Hence got the full registry.");
            getAndStoreFullRegistry();
        } else if (fetchRegistryGeneration.compareAndSet(currentUpdateGeneration, currentUpdateGeneration + 1)) {
            logger.debug("Got delta update with apps hashcode {}", delta.getAppsHashCode());
            String reconcileHashCode = "";
            if (fetchRegistryUpdateLock.tryLock()) {
                try {
                    //更新本地缓存
                    updateDelta(delta);
                    reconcileHashCode = getReconcileHashCode(applications);
                } finally {
                    fetchRegistryUpdateLock.unlock();
                }
            } else {
                logger.warn("Cannot acquire update lock, aborting getAndUpdateDelta");
            }
            // There is a diff in number of instances for some reason
            if (!reconcileHashCode.equals(delta.getAppsHashCode()) || clientConfig.shouldLogDeltaDiff()) {
                reconcileAndLogDifference(delta, reconcileHashCode);  // this makes a remoteCall
            }
        } else {
            logger.warn("Not updating application delta as another thread is updating it already");
            logger.debug("Ignoring delta update with apps hashcode {}, as another thread is updating it already", delta.getAppsHashCode());
        }
    }
```

### 向服务器注册

```java
从这句代码开始 
 if (clientConfig.shouldRegisterWithEureka() && clientConfig.shouldEnforceRegistrationAtInit()) {
            try {
                if (!register() ) {    //开始完成注册
                    throw new IllegalStateException("Registration error at startup. Invalid server response.");
                }
            } catch (Throwable th) {
                logger.error("Registration error at startup: {}", th.getMessage());
                throw new IllegalStateException(th);
            }
        }
```

**register()方法负责服务的注册**

```java
boolean register() throws Throwable {
        logger.info(PREFIX + "{}: registering service...", appPathIdentifier);
        EurekaHttpResponse<Void> httpResponse;
        try {
            //把自身的实例发送给服务端
            httpResponse = eurekaTransport.registrationClient.register(instanceInfo);
        } catch (Exception e) {
            logger.warn(PREFIX + "{} - registration failed {}", appPathIdentifier, e.getMessage(), e);
            throw e;
        }     
        // 在http的响应状态码中, 204意思等同于请求执行成功，但是没有数据，浏览器不用刷新页面.也不用导向新的页面
        return httpResponse.getStatusCode() == 204;
    }
```

### 定时任务: initScheduledTasks()是负责定时任务的相关方法。

```java
从这一句开始 
// finally, init the schedule tasks (e.g. cluster resolvers, heartbeat, instanceInfo replicator, fetch
initScheduledTasks();
```

```java
private void initScheduledTasks() {
        if (clientConfig.shouldFetchRegistry()) {
            // 拉取服务默认30秒，eureka.client.register-fetch-interval-seconds
            int registryFetchIntervalSeconds = clientConfig.getRegistryFetchIntervalSeconds();
//更新缓存            
int expBackOffBound = clientConfig.getCacheRefreshExecutorExponentialBackOffBound();
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
        if (clientConfig.shouldRegisterWithEureka()) {
            int renewalIntervalInSecs = instanceInfo.getLeaseInfo().getRenewalIntervalInSecs();
            int expBackOffBound = clientConfig.getHeartbeatExecutorExponentialBackOffBound();
            logger.info("Starting heartbeat executor: " + "renew interval is: {}", renewalIntervalInSecs);
            // 心跳服务，默认30秒
            scheduler.schedule(
                    new TimedSupervisorTask(
                            "heartbeat",
                            scheduler,
                            heartbeatExecutor,
                            renewalIntervalInSecs,
                            TimeUnit.SECONDS,
                            expBackOffBound,
                            new HeartbeatThread()
                    ),
                    renewalIntervalInSecs, TimeUnit.SECONDS);
            // InstanceInfo replicator
            instanceInfoReplicator = new InstanceInfoReplicator(
                    this,
                    instanceInfo,
                    clientConfig.getInstanceInfoReplicationIntervalSeconds(),
                    2); // burstSize
            statusChangeListener = new ApplicationInfoManager.StatusChangeListener() {
                @Override
                public String getId() {
                    return "statusChangeListener";
                }
                @Override
                public void notify(StatusChangeEvent statusChangeEvent) {
                    if (InstanceStatus.DOWN == statusChangeEvent.getStatus() ||
                            InstanceStatus.DOWN == statusChangeEvent.getPreviousStatus()) {
                        // log at warn level if DOWN was involved
                        logger.warn("Saw local status change event {}", statusChangeEvent);
                    } else {
                        logger.info("Saw local status change event {}", statusChangeEvent);
                    }
                    instanceInfoReplicator.onDemandUpdate();
                }
            };
            if (clientConfig.shouldOnDemandUpdateStatusChange()) {
                applicationInfoManager.registerStatusChangeListener(statusChangeListener);
            }
            instanceInfoReplicator.start(clientConfig.getInitialInstanceInfoReplicationIntervalSeconds());
        } else {
            logger.info("Not registering with Eureka server per configuration");
        }
    }
```

以上完成了 DiscoveryClient的构造函数的分析，下面来看一下Client如何完成**服务下线**操作的. 请查看 com.netflix.discovery.DiscoveryClient#shutdown.

```java
    @PreDestroy   // bean销毁前调用的函数
    @Override
    public synchronized void shutdown() {
        if (isShutdown.compareAndSet(false, true)) {
            logger.info("Shutting down DiscoveryClient ...");
            if (statusChangeListener != null && applicationInfoManager != null) {
//注销状态监听器
                applicationInfoManager.unregisterStatusChangeListener(statusChangeListener.getId());
            }
//取消定时任务
            cancelScheduledTasks();
            // If APPINFO was registered
            if (applicationInfoManager != null
                    && clientConfig.shouldRegisterWithEureka()
                    && clientConfig.shouldUnregisterOnShutdown()) {
                applicationInfoManager.setInstanceStatus(InstanceStatus.DOWN);
                unregister();
            }
//关闭与server连接的客户端
            if (eurekaTransport != null) {
                eurekaTransport.shutdown();
            }
//关闭相关监控
            heartbeatStalenessMonitor.shutdown();
            registryStalenessMonitor.shutdown();
            logger.info("Completed shut down of DiscoveryClient");
        }
    }
```

EurekaClient其它功能的源码解析后续再加吧.

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/zhangyingchengqi/category_10464123.html
