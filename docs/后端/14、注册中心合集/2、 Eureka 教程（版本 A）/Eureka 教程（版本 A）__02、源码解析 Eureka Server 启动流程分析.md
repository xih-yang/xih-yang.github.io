# 02、源码解析 Eureka Server 启动流程分析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/2.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
Eureka Server 启动流程分析

eureka server 启动的话，其实就相当于根据 web.xml 启动容器，然后对外提供服务，所以我们就从启动类作为入口分析

## 1、整体流程图

## 2、相应的类概念说明

### 2.1 ConfigurationManager

配置管理器，通过他去获取构造 Configuration

### 2.2 AbstractConfiguration

抽象配置类，他有很多个实现类，ConfigurationManager 构造的时候返回他，其实实例化的时候由子类来做。

- 下图是类图，可以看一下他们的关系

### 2.3 EurekaServerConfig

Eureka Server 的配置类，默认用 DefaultEurekaServerConfig 来实例化，主要是涵盖了 server 的相关配置，用接口的形式对外提供其配置信息

### 2.4 ApplicationInfoManager

应用管理器，持有 InstanceInfo、EurekaInstanceConfig 的引用，主要是对应用实例做相关的操作

### 2.5 EurekaClientConfig

客户端的配置，因为 eureka server 其实本身就是一个服务，他自己作为一个客户端向自己注册，如果集群的话，会向其他节点注册

### 2.6 DiscoveryClient

客户端组件，初始化配置，持有 ApplicationInfoManager 的引用、EurekaClientConfig的引用，还初始化了很多定时任务

### 2.7 PeerAwareInstanceRegistry

PeerAware，可以识别eureka server集群的：peer，多个同样的东西组成的一个集群，peers集群，peer就是集群中的一个实例

InstanceRegistry：实例注册，服务实例注册，注册表，这个里面放了所有的注册到这个eureka server上来的服务实例，就是一个服务实例的注册表

PeerAwareInstanceRegistry：可以感知eureka server集群的服务实例注册表，eureka client（作为服务实例）过来注册的注册表，而且这个注册表是可以感知到eureka server集群的。假如有一个eureka server集群的话，这里包含了其他的eureka server中的服务实例注册表的信息的。

### 2.8 PeerEurekaNodes

PeerEurekaNodes，代表了eureka server集群，peers大概来说多个相同的实例组成的一个集群，peer就是peers集群中的一个实例，PeerEurekaNodes，应该是代表的是eureka server集群

### 2.9 EurekaServerContext

Eureka Server 的上下文对象。持有了 EurekaServcerConfig、ServerCodecs、PeerAwareInstanceRegistry、PeerEurekaNodes、ApplicationInfoManager 的引用。

## 1、com.netflix.eureka.EurekaBootStrap

```java
// 从类定义可以看出来，实现了 ServletContextListener,所以启动的时候就会调用 contextInitialized 方法
public class EurekaBootStrap implements ServletContextListener
public interface ServletContextListener extends EventListener {
	/**
	 ** Notification that the web application initialization
	 ** process is starting.
	 ** All ServletContextListeners are notified of context
	 ** initialization before any filter or servlet in the web
	 ** application is initialized.
	 */
    public void contextInitialized ( ServletContextEvent sce );
	/**
	 ** Notification that the servlet context is about to be shut down.
	 ** All servlets and filters have been destroy()ed before any
	 ** ServletContextListeners are notified of context
	 ** destruction.
	 */
    public void contextDestroyed ( ServletContextEvent sce );
}
```

## 2、contextInitialized 方法分析

```java
@Override
public void contextInitialized(ServletContextEvent event) {
    try {
        //1、初始化 eureka 环境
        initEurekaEnvironment();
        // 2、初始化 eureka 上下文
        initEurekaServerContext();
        ServletContext sc = event.getServletContext();
        sc.setAttribute(EurekaServerContext.class.getName(), serverContext);
    } catch (Throwable e) {
        logger.error("Cannot bootstrap eureka server :", e);
        throw new RuntimeException("Cannot bootstrap eureka server :", e);
    }
}
```

## 3、initEurekaEnvironment 分析

```java
protected void initEurekaEnvironment() throws Exception {
    logger.info("Setting the eureka configuration..");
    // 这个方法就是初始化配置类。
    String dataCenter = ConfigurationManager.getConfigInstance().getString(EUREKA_DATACENTER);
    if (dataCenter == null) {
        logger.info("Eureka data center value eureka.datacenter is not set, defaulting to default");
        ConfigurationManager.getConfigInstance().setProperty(ARCHAIUS_DEPLOYMENT_DATACENTER, DEFAULT);
    } else {
        ConfigurationManager.getConfigInstance().setProperty(ARCHAIUS_DEPLOYMENT_DATACENTER, dataCenter);
    }
    String environment = ConfigurationManager.getConfigInstance().getString(EUREKA_ENVIRONMENT);
    if (environment == null) {
        ConfigurationManager.getConfigInstance().setProperty(ARCHAIUS_DEPLOYMENT_ENVIRONMENT, TEST);
        logger.info("Eureka environment value eureka.environment is not set, defaulting to test");
    }
}
```

```java
public static AbstractConfiguration getConfigInstance() {
    // 这里是 double check,单例模式的其中一种方法创建的时候就是这样子的，可以学习一下。
    if (instance == null) {
        synchronized (ConfigurationManager.class) {
            if (instance == null) {
                instance = getConfigInstance(Boolean.getBoolean(DynamicPropertyFactory.DISABLE_DEFAULT_CONFIG));
            }
        }
    }
    return instance;
}
private static AbstractConfiguration getConfigInstance(boolean defaultConfigDisabled) {
    if (instance == null && !defaultConfigDisabled) {
        // 创建默认的配置实例
        instance = createDefaultConfigInstance();
        // 注册配置实例
        registerConfigBean();
    }
    return instance;        
}
private static AbstractConfiguration createDefaultConfigInstance() {
    // 这里就是根据配置添加各种 configuration 
    ConcurrentCompositeConfiguration config = new ConcurrentCompositeConfiguration();  
    try {
        DynamicURLConfiguration defaultURLConfig = new DynamicURLConfiguration();
        config.addConfiguration(defaultURLConfig, URL_CONFIG_NAME);
    } catch (Throwable e) {
        logger.warn("Failed to create default dynamic configuration", e);
    }
    if (!Boolean.getBoolean(DISABLE_DEFAULT_SYS_CONFIG)) {
        SystemConfiguration sysConfig = new SystemConfiguration();
        config.addConfiguration(sysConfig, SYS_CONFIG_NAME);
    }
    if (!Boolean.getBoolean(DISABLE_DEFAULT_ENV_CONFIG)) {
        EnvironmentConfiguration envConfig = new EnvironmentConfiguration();
        config.addConfiguration(envConfig, ENV_CONFIG_NAME);
    }
    ConcurrentCompositeConfiguration appOverrideConfig = new ConcurrentCompositeConfiguration();
    config.addConfiguration(appOverrideConfig, APPLICATION_PROPERTIES);
    config.setContainerConfigurationIndex(config.getIndexOfConfiguration(appOverrideConfig));
    return config;
}
```

至此，初始化环境的方法就执行完成了，其实这个方法就是做一些准备工作，没有太多的核心逻辑。

## 4、initEurekaServerContext(核心逻辑，重点看一下)

```java
protected void initEurekaServerContext() throws Exception {
		//1、new 一个 EurekaServerConfig 的实例
		/**
		 * 1、EurekaServerConfig 看一下就知道，其实他就是一个配置的类，里面各种 getXXX、shouldxxx,xxx 就是我们在 eureka-server.properties 中的一些配置
		 * 2、new 的时候会去初始化加载配置：ConfigurationManager.loadCascadedPropertiesFromResources(eurekaPropsFile);
		 * 3、其实就是去 load properties 文件，然后把这些配置设置到 Configuration 中去
		 */
		EurekaServerConfig eurekaServerConfig = new DefaultEurekaServerConfig();
		// 2、下面就是一些 json、xml 相关的东西。这些呢主要是针对请求、响应体作一些转换、序列化操作，不用太多关注
		// For backward compatibility
		JsonXStream.getInstance().registerConverter(new V1AwareInstanceInfoConverter(), XStream.PRIORITY_VERY_HIGH);
		XmlXStream.getInstance().registerConverter(new V1AwareInstanceInfoConverter(), XStream.PRIORITY_VERY_HIGH);
		logger.info("Initializing the eureka client...");
		logger.info(eurekaServerConfig.getJsonCodecName());
		ServerCodecs serverCodecs = new DefaultServerCodecs(eurekaServerConfig);
		ApplicationInfoManager applicationInfoManager = null;
		// 3、实例化 DiscoveryClient
		if (eurekaClient == null) {
			// 3.1 实例化 EurekaInstanceConfig(实例配置)
			EurekaInstanceConfig instanceConfig = isCloud(ConfigurationManager.getDeploymentContext())
							? new CloudInstanceConfig()
							: new MyDataCenterInstanceConfig();
			//3.2 这里就是实例化一个 ApplicationInfoManager(持有 InstanceConfig、InstanceInfo 的引用，主要就是用于实例的一些管理操作)
			applicationInfoManager = new ApplicationInfoManager(
							instanceConfig, new EurekaConfigBasedInstanceInfoProvider(instanceConfig).get());
			// 3.3 实例化 EurekaClientConfig(client 的配置 - eureka.client.properties 的配置、网络组件的配置- DefaultEurekaTransportConfig)
			EurekaClientConfig eurekaClientConfig = new DefaultEurekaClientConfig();
			// 3.4 实例化 DiscoveryClient
			/**
			 * 1、初始化一些配置(赋值：applicationInfoManager、clientConfig、staticClientConfig、transportConfig....)
			 * 2、初始化线程池(注册表刷新线程池、心跳线程池、)
			 * 3、拉取注册表并存储(fetchRegistry)
			 * 4、开启定时任务(initScheduledTasks)
			 */
			eurekaClient = new DiscoveryClient(applicationInfoManager, eurekaClientConfig);
		} else {
			applicationInfoManager = eurekaClient.getApplicationInfoManager();
		}
		// 4、实例化 PeerAwareInstanceRegistry(初始化变量赋值、开启 DeltaRetentionTask - 主要用于过期队列中的实例信息)
		PeerAwareInstanceRegistry registry;
		if (isAws(applicationInfoManager.getInfo())) {
			registry = new AwsInstanceRegistry(
							eurekaServerConfig,
							eurekaClient.getEurekaClientConfig(),
							serverCodecs,
							eurekaClient
			);
			awsBinder = new AwsBinderDelegate(eurekaServerConfig, eurekaClient.getEurekaClientConfig(), registry, applicationInfoManager);
			awsBinder.start();
		} else {
			registry = new PeerAwareInstanceRegistryImpl(
							eurekaServerConfig,
							eurekaClient.getEurekaClientConfig(),
							serverCodecs,
							eurekaClient
			);
		}
		// 5、实例化 PeerEurekaNodes(Eureka 节点信息)
		PeerEurekaNodes peerEurekaNodes = getPeerEurekaNodes(
						registry,
						eurekaServerConfig,
						eurekaClient.getEurekaClientConfig(),
						serverCodecs,
						applicationInfoManager
		);
		// 6、实例化 DefaultEurekaServerContext(Eureka 服务上下文)
		serverContext = new DefaultEurekaServerContext(
						eurekaServerConfig,
						serverCodecs,
						registry,
						peerEurekaNodes,
						applicationInfoManager
		);
		EurekaServerContextHolder.initialize(serverContext);
		// 7、初始化 Eureka 服务上下文
		/**
		 * 7.1、eureka 节点信息管理开启
		 *  7.1.1、更新 eureka 节点信息(移除不可用的，创建新的)
		 *  7.1.2、开启定时任务(每隔 10 分钟执行 1 次。更新 eureka 节点信息)
		 * 7.2、初始化 eureka-server 节点信息
		 * 7.2.1、集群信息定时任务开启(统计)
		 * 7.2.2、初始化缓存信息(二级缓存构建：readOnlyCacheMap、readWriteCacheMap - 构建的时候就指定了 180s 失效，也就是读写缓存存活时间为 180s)
		 * 7.2.3、开启续约阈值更新的定时任务(时间为 15 分钟)
		 * 7.2.4、初始化远程注册注册(主要用于从远端拉取注册表、增量拉取注册表)
		 */
		serverContext.initialize();
		logger.info("Initialized server context");
		// 8、从其他的节点 copy 注册表信息
		// Copy registry from neighboring eureka node
		int registryCount = registry.syncUp();
		// 9、开启服务的运行
		/**
		 * 9.1、设置服务服务的期望每分的心跳数、心跳阈值
		 * 9.2、开启心跳续约统计的定时任务(MeasuredRate)、过期定时任务(EvictionTask)
		 */
		registry.openForTraffic(applicationInfoManager, registryCount);
		// 10、注册所有的监控、统计
		// Register all monitoring statistics.
		EurekaMonitors.registerAllStats();
	}
```

## 5、总结(需要注意的点)

contextInitialized 方法执行完后，服务启动相关的主流程代码就结束了。针对上面的流程主要关注以下几点：

### 5.1 实例化DiscoveryClient

**拉取注册表**，后面我们要着重分析一下拉取注册表是一个什么样的逻辑

### 5.2 实例化 PeerAwareInstanceRegistryImpl

**定时任务的开启**，我们要关注一下这些定时任务是干啥的?他操作的数据是做啥的?比如 recentCanceledQueue、recentRegisteredQueue

### 5.3 serverContext.initialize()

**eureka 上下文初始**化(主要有 eureka server 节点信息的更新、节点更新的定时任务、初始化缓存信息-缓存干啥的怎么用、续约/过期定时任务

### 5.4 registry.openForTraffic

开启心跳统计的定时任务、以及心跳相关的参数配置 (这些配置跟 eureka 自身的保护机制、以及服务实例的摘除都有密切的关系，后续我们会一一分析)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
