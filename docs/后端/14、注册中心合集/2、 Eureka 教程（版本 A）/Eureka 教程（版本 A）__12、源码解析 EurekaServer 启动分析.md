# 12、源码解析 EurekaServer 启动分析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/12.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
EurekaServer在SpringCloud中的启动分析

## 1、@EnableEurekaServer

1、我们肯定是需要引用一些 jar 包，这个就不多说了，前面的文章中也有

2、在EurekaServer 项目中我们会在 Application 启动类上加上一个注解，@EnableEurekaServer 注解，那我们就从这个注解说起吧。

```java
@SpringBootApplication
@EnableEurekaServer// 这里我们会添加这个注解开启 EurekaServer 服务
public class EurekaServer {
     public static void main(String[] args) {
          SpringApplication.run(EurekaServer.class, args);
     }
}
```

下面就是 @EnableEurekaServer 在 jar 包中的位置

### 1.1 EurekaServerAutoConfiguration(自动装配的类)

```java
@Configuration
// 这个类要注意了，其实重点就是这里。
@Import(EurekaServerInitializerConfiguration.class)
// 这个是就是一个条件判断，这个EurekaServerMarkerConfiguration.Marker.class其实在 @EnableEurekaServer注解里会 import 这个类
@ConditionalOnBean(EurekaServerMarkerConfiguration.Marker.class)
// 这时就是启用配置文件 
@EnableConfigurationProperties({
      EurekaDashboardProperties.class,
  InstanceRegistryProperties.class })
// 这个刚刚在上面的截图中也可以看到，这个配置文件就在 jar 包对应的目录下
@PropertySource("classpath:/eureka/server.properties")
public class EurekaServerAutoConfiguration extends WebMvcConfigurerAdapter {
    /**
	 * List of packages containing Jersey resources required by the Eureka server
	 */
	private static String[] EUREKA_PACKAGES = new String[] {
      "com.netflix.discovery",
			"com.netflix.eureka" };
    // 这个应用管理器，我们在 EurekaServer启动的时候分析过，初始化的时候会去实例化这个类
	@Autowired
	private ApplicationInfoManager applicationInfoManager;
    // 这个就是 EurekaServer 的配置类
	@Autowired
	private EurekaServerConfig eurekaServerConfig;
    // EurekaServer 作为 client 的配置类
	@Autowired
	private EurekaClientConfig eurekaClientConfig;
    // EurekaClient 类
	@Autowired
	private EurekaClient eurekaClient;
    // 实例注册的属性类
	@Autowired
	private InstanceRegistryProperties instanceRegistryProperties;
    // json 相关的类
	public static final CloudJacksonJson JACKSON_JSON = new CloudJacksonJson();
    //可以看出来大部分类就是  Eureka 中类
    @Bean
	public HasFeatures eurekaServerFeature() {
		System.out.println(EurekaServerAutoConfiguration.class.getName() + ",enter eurekaServerFeature()....");
		return HasFeatures.namedFeature("Eureka Server",
				EurekaServerAutoConfiguration.class);
	}
	@Configuration
	protected static class EurekaServerConfigBeanConfiguration {
		@Bean
		@ConditionalOnMissingBean
		public EurekaServerConfig eurekaServerConfig(EurekaClientConfig clientConfig) {
			System.out.println(EurekaServerAutoConfiguration.class.getName() + ",enter EurekaServerConfigBeanConfiguration.eurekaServerConfig()...."
			+ ",shouldRegisterWithEureka:" + clientConfig.shouldRegisterWithEureka());
			EurekaServerConfigBean server = new EurekaServerConfigBean();
			if (clientConfig.shouldRegisterWithEureka()) {
				// Set a sensible default if we are supposed to replicate
				server.setRegistrySyncRetries(5);
			}
			return server;
		}
	}
	@Bean
	@ConditionalOnProperty(prefix = "eureka.dashboard", name = "enabled", matchIfMissing = true)
	public EurekaController eurekaController() {
		System.out.println(EurekaServerAutoConfiguration.class.getName() + ",enter eurekaController()....");
		return new EurekaController(this.applicationInfoManager);
	}
	static {
		CodecWrappers.registerWrapper(JACKSON_JSON);
		EurekaJacksonCodec.setInstance(JACKSON_JSON.getCodec());
	}
	@Bean
	public ServerCodecs serverCodecs() {
		return new CloudServerCodecs(this.eurekaServerConfig);
	}
	private static CodecWrapper getFullJson(EurekaServerConfig serverConfig) {
		CodecWrapper codec = CodecWrappers.getCodec(serverConfig.getJsonCodecName());
		return codec == null ? CodecWrappers.getCodec(JACKSON_JSON.codecName()) : codec;
	}
	private static CodecWrapper getFullXml(EurekaServerConfig serverConfig) {
		CodecWrapper codec = CodecWrappers.getCodec(serverConfig.getXmlCodecName());
		return codec == null ? CodecWrappers.getCodec(CodecWrappers.XStreamXml.class)
				: codec;
	}
	class CloudServerCodecs extends DefaultServerCodecs {
		public CloudServerCodecs(EurekaServerConfig serverConfig) {
			super(getFullJson(serverConfig),
					CodecWrappers.getCodec(CodecWrappers.JacksonJsonMini.class),
					getFullXml(serverConfig),
					CodecWrappers.getCodec(CodecWrappers.JacksonXmlMini.class));
		}
	}
	@Bean
	public PeerAwareInstanceRegistry peerAwareInstanceRegistry(
			ServerCodecs serverCodecs) {
        // 这个也知道吧，就是可以感知eureka server集群的服务实例注册表
		System.out.println(EurekaServerAutoConfiguration.class.getName() + ",enter peerAwareInstanceRegistry()...."
		+ ",EurekaClient:" + JSONUtil.toJsonStr(eurekaClient));
		// eurekaClient 此时是一个代理对象：org.springframework.cloud.netflix.eureka.CloudEurekaClient@527d48db
		System.out.println(LocalDateTime.now() + "," + EurekaServerAutoConfiguration.class.getName() + ",enter peerAwareInstanceRegistry()...."
		+	",before getApplications()...");
		// 去实例化 ApplicationInfoManager
		this.eurekaClient.getApplications(); // force initialization
		System.out.println(LocalDateTime.now() + "," + EurekaServerAutoConfiguration.class.getName() + ",enter peerAwareInstanceRegistry()...."
						+	",after getApplications()...");
		return new InstanceRegistry(this.eurekaServerConfig, this.eurekaClientConfig,
				serverCodecs, this.eurekaClient,
				this.instanceRegistryProperties.getExpectedNumberOfRenewsPerMin(),
				this.instanceRegistryProperties.getDefaultOpenForTrafficCount());
	}
	@Bean
	@ConditionalOnMissingBean
	public PeerEurekaNodes peerEurekaNodes(PeerAwareInstanceRegistry registry,
			ServerCodecs serverCodecs) {
        // 这个就是 PeerEurekaNods 嘛，代表某一个 EurekaServer 节点 
		System.out.println(EurekaServerAutoConfiguration.class.getName() + ",enter peerEurekaNodes()....");
		return new PeerEurekaNodes(registry, this.eurekaServerConfig,
				this.eurekaClientConfig, serverCodecs, this.applicationInfoManager);
	}
	@Bean
	public EurekaServerContext eurekaServerContext(ServerCodecs serverCodecs,
			PeerAwareInstanceRegistry registry, PeerEurekaNodes peerEurekaNodes) {
        // 这个不就是EurekaServer上下文对象嘛
		System.out.println(EurekaServerAutoConfiguration.class.getName() + ",enter eurekaServerContext()....");
		return new DefaultEurekaServerContext(this.eurekaServerConfig, serverCodecs,
				registry, peerEurekaNodes, this.applicationInfoManager);
	}
	@Bean
	public EurekaServerBootstrap eurekaServerBootstrap(PeerAwareInstanceRegistry registry,
			EurekaServerContext serverContext) {
        // 这个类看着有点熟悉吧，是不是很像我们分析的 EurekaServer 启动类的入口类。
		System.out.println(EurekaServerAutoConfiguration.class.getName() + ",enter eurekaServerBootstrap()....");
		return new EurekaServerBootstrap(this.applicationInfoManager,
				this.eurekaClientConfig, this.eurekaServerConfig, registry,
				serverContext);
	}
	/**
	 * Register the Jersey filter
	 */
	@Bean
	public FilterRegistrationBean jerseyFilterRegistration(
			javax.ws.rs.core.Application eurekaJerseyApp) {
        // 这里其实我们在 EurekaServer 源码里看到过就是在 web.xml 中配置的过滤器
		FilterRegistrationBean bean = new FilterRegistrationBean();
		bean.setFilter(new ServletContainer(eurekaJerseyApp));
		bean.setOrder(Ordered.LOWEST_PRECEDENCE);
		bean.setUrlPatterns(
				Collections.singletonList(EurekaConstants.DEFAULT_PREFIX + "/*"));
		return bean;
	}
	/**
	 * Construct a Jersey {@Linkjavax.ws.rs.core.Application} with all the resources
	 * required by the Eureka server.
	 */
	@Bean
	public javax.ws.rs.core.Application jerseyApplication(Environment environment,
			ResourceLoader resourceLoader) {
		ClassPathScanningCandidateComponentProvider provider = new ClassPathScanningCandidateComponentProvider(
				false, environment);
		// Filter to include only classes that have a particular annotation.
		//
		provider.addIncludeFilter(new AnnotationTypeFilter(Path.class));
		provider.addIncludeFilter(new AnnotationTypeFilter(Provider.class));
		// Find classes in Eureka packages (or subpackages)
		//
		Set<Class<?>> classes = new HashSet<Class<?>>();
		for (String basePackage : EUREKA_PACKAGES) {
			Set<BeanDefinition> beans = provider.findCandidateComponents(basePackage);
			for (BeanDefinition bd : beans) {
				Class<?> cls = ClassUtils.resolveClassName(bd.getBeanClassName(),
						resourceLoader.getClassLoader());
				classes.add(cls);
			}
		}
		// Construct the Jersey ResourceConfig
		//
		Map<String, Object> propsAndFeatures = new HashMap<String, Object>();
		propsAndFeatures.put(
				// Skip static content used by the webapp
				ServletContainer.PROPERTY_WEB_PAGE_CONTENT_REGEX,
				EurekaConstants.DEFAULT_PREFIX + "/(fonts|images|css|js)/.*");
		DefaultResourceConfig rc = new DefaultResourceConfig(classes);
		rc.setPropertiesAndFeatures(propsAndFeatures);
		return rc;
	}
	@Bean
	public FilterRegistrationBean traceFilterRegistration(
			@Qualifier("webRequestLoggingFilter") Filter filter) {
		FilterRegistrationBean bean = new FilterRegistrationBean();
		bean.setFilter(filter);
		bean.setOrder(Ordered.LOWEST_PRECEDENCE - 10);
		return bean;
	}
}
```

> 好了，大概我们看一下这个自动装配的类，大部分对象就是我们之前分析的类。我覆盖了这个类，然后自己在代码里打了很多日志，然后可以在启动的时候观察一下日志输出，进而可以更好的理解代码的运行流程。建议使用 logger 打印，他可以打印出线程呀什么的信息，很方便。这里我只是为了方便，所以用了 System.out.println

### 1.2 EurekaServerInitializerConfigurationEurekaServerInitializerConfiguration(刚刚说了这个是重点要看的，从命名看应该是服务初始化配置类)

```java
@Configuration
public class EurekaServerInitializerConfiguration
    implements ServletContextAware, SmartLifecycle, Ordered {
 private static final Log log = LogFactory.getLog(EurekaServerInitializerConfiguration.class);
 @Autowired
 private EurekaServerConfig eurekaServerConfig;
 private ServletContext servletContext;
 @Autowired
 private ApplicationContext applicationContext;
 @Autowired
 private EurekaServerBootstrap eurekaServerBootstrap;
 private boolean running;
 private int order = 1;
 @Override
 public void setServletContext(ServletContext servletContext) {
  System.out.println(EurekaServerInitializerConfiguration.class.getName() + ",enter setServletContext()....");
  this.servletContext = servletContext;
 }
 @Override
 public void start() {
  new Thread(new Runnable() {
   @Override
   public void run() {
    try {
     System.out.println(EurekaServerInitializerConfiguration.class.getName() + ",enter start()....");
     //TODO: is this class even needed now?
     // 这里有一个初始化方法的调用，我们来看一下他吧
     eurekaServerBootstrap.contextInitialized(EurekaServerInitializerConfiguration.this.servletContext);
     log.info("Started Eureka Server");
     // 1、发布 Eureka 注册表可用的事件
     publish(new EurekaRegistryAvailableEvent(getEurekaServerConfig()));
     // 2、EurekaServer 初始化配置状态更新
     EurekaServerInitializerConfiguration.this.running = true;
     // 3、发布 EurekaServer 启动的事件
     publish(new EurekaServerStartedEvent(getEurekaServerConfig()));
    } catch (Exception ex) {
     // Help!
     log.error("Could not initialize Eureka servlet context", ex);
    }
   }
  }).start();
 }
 private EurekaServerConfig getEurekaServerConfig() {
  return this.eurekaServerConfig;
 }
 private void publish(ApplicationEvent event) {
  this.applicationContext.publishEvent(event);
 }
 @Override
 public void stop() {
  this.running = false;
  eurekaServerBootstrap.contextDestroyed(this.servletContext);
 }
 @Override
 public boolean isRunning() {
  return this.running;
 }
 @Override
 public int getPhase() {
  return 0;
 }
 @Override
 public boolean isAutoStartup() {
  return true;
 }
 @Override
 public void stop(Runnable callback) {
  callback.run();
 }
 @Override
 public int getOrder() {
  return this.order;
 }
}
```

### 1.3 EurekaServerBootstrap

```java
public void contextInitialized(ServletContext context) {
 try {
  System.out.println(EurekaServerBootstrap.class.getName() + ",enter contextInitialized()....");
  // 看到没有，这些代码熟悉不，不就是EurekaServer 的那些嘛，这不就是复制过来的嘛
  initEurekaEnvironment();
  initEurekaServerContext();
  context.setAttribute(EurekaServerContext.class.getName(), this.serverContext);
 }
 catch (Throwable e) {
  log.error("Cannot bootstrap eureka server :", e);
  throw new RuntimeException("Cannot bootstrap eureka server :", e);
 }
}
```

## 2、我们通过启动日志来分析一下流程

```java
1、实例化 EurekaServerConfig(加载 eurekaServer 的配置)
org.springframework.cloud.netflix.eureka.server.EurekaServerAutoConfiguration,enter 	EurekaServerConfigBeanConfiguration.eurekaServerConfig()....
2、实例化 HasFeatures
org.springframework.cloud.netflix.eureka.server.EurekaServerAutoConfiguration,enter eurekaServerFeature()....
3、实例化 PeerAwareInstanceRegistry
org.springframework.cloud.netflix.eureka.server.EurekaServerAutoConfiguration,enter peerAwareInstanceRegistry()....
1)、开启 2 个定时任务
2)、renewsLastMin(上一分钟续约的数据)、DeltaRetentionTask(增量数据保留的定时任务,就是维护在一个 queue 中的数据，180s 后自动剔除)
4、创建 DiscoveryClient
2021-12-19 12:32:48.524  INFO 10272 --- [           main] o.s.c.n.eureka.InstanceInfoFactory       : Setting initial instance status as: STARTING
2021-12-19 12:32:48.554  INFO 10272 --- [           main] com.netflix.discovery.DiscoveryClient    : Initializing Eureka in region us-east-1
2021-12-19 12:32:48.554  INFO 10272 --- [           main] com.netflix.discovery.DiscoveryClient    : Client configured to neither register nor query for data.
2021-12-19 12:32:48.559  INFO 10272 --- [           main] com.netflix.discovery.DiscoveryClient    : Discovery Client initialized at timestamp 1639888368559 with initial instances count: 0
5、实例化 PeerEurekaNodes
	org.springframework.cloud.netflix.eureka.server.EurekaServerAutoConfiguration,enter peerEurekaNodes()....
6、实例化 EurekaServerContext
org.springframework.cloud.netflix.eureka.server.EurekaServerAutoConfiguration,enter eurekaServerContext()....
2021-12-19 12:32:48.602  INFO 10272 --- [           main] c.n.eureka.DefaultEurekaServerContext    : Initializing ...
1)、更新 eureka server 节点，并开启定时任务(10 分钟一次)
2)、初始化注册表信息：
    PeerAwareInstanceRegistryImpl:
    1>上一分钟 replication 数目定时任务开启
    2>、初始化注册表缓存
    3>、续约阈值更新定时任务
    4>、初始化 regionRegistry
	2021-12-19 12:32:48.604  INFO 10272 --- [           main] c.n.eureka.cluster.PeerEurekaNodes       : Adding new peer nodes [http://localhost:8761/eureka/]
	2021-12-19 12:32:49.510  INFO 10272 --- [           main] c.n.d.provider.DiscoveryJerseyProvider   : Using JSON encoding codec LegacyJacksonJson
	2021-12-19 12:32:49.510  INFO 10272 --- [           main] c.n.d.provider.DiscoveryJerseyProvider   : Using JSON decoding codec LegacyJacksonJson
	2021-12-19 12:32:49.510  INFO 10272 --- [           main] c.n.d.provider.DiscoveryJerseyProvider   : Using XML encoding codec XStreamXml
	2021-12-19 12:32:49.510  INFO 10272 --- [           main] c.n.d.provider.DiscoveryJerseyProvider   : Using XML decoding codec XStreamXml
	2021-12-19 12:32:49.595  INFO 10272 --- [           main] c.n.eureka.cluster.PeerEurekaNodes       : Replica node URL:  http://localhost:8761/eureka/
	2021-12-19 12:32:49.599  INFO 10272 --- [           main] c.n.e.registry.AbstractInstanceRegistry  : Finished initializing remote region registries. All known remote regions: []
	2021-12-19 12:32:49.599  INFO 10272 --- [           main] c.n.eureka.DefaultEurekaServerContext    : Initialized
7、实例化 EurekaServerBootstrap
org.springframework.cloud.netflix.eureka.server.EurekaServerAutoConfiguration,enter eurekaServerBootstrap()....
org.springframework.cloud.netflix.eureka.server.EurekaServerInitializerConfiguration,enter setServletContext()....
8、实例化 EurekaController
org.springframework.cloud.netflix.eureka.server.EurekaServerAutoConfiguration,enter eurekaController()....
9、开始服务注册
2021-12-19T12:32:49.705,org.springframework.cloud.netflix.eureka.serviceregistry.EurekaServiceRegistry, enter register()....
2021-12-19 12:32:49.705  INFO 10272 --- [           main] o.s.c.n.e.s.EurekaServiceRegistry        : Registering application unknown with eureka with status UP
10、ApplicationInfoManager 设置 instanceStatus()，并发布事件
2021-12-19T12:32:49.706,com.netflix.appinfo.ApplicationInfoManager,enter setInstanceStatus()...{}
11、EurekaServerInitializerConfiguration 初始化(进入 start()，利用的是 spring 的生命周期触发)
org.springframework.cloud.netflix.eureka.server.EurekaServerInitializerConfiguration,enter start()....
1)、EureakaServerBootstrap 初始化
org.springframework.cloud.netflix.eureka.server.EurekaServerBootstrap,enter contextInitialized()....
1>、initEurekaEnvironment 初始化 eureka 环境变量
2>、initEurekaServerContext 初始化 eurekaServer 上下文
    a、this.registry.syncUp() 相邻节点 registry(注册表) 拷贝
    b、this.registry.openForTraffic	
2021-12-19 12:32:49.755  INFO 10272 --- [      Thread-35] o.s.c.n.e.server.EurekaServerBootstrap   : Setting the eureka configuration..
org.springframework.cloud.netflix.eureka.server.EurekaServerBootstrap,enter initEurekaEnvironment()....
2021-12-19 12:32:49.755  INFO 10272 --- [      Thread-35] o.s.c.n.e.server.EurekaServerBootstrap   : Eureka data center value eureka.datacenter is not set, defaulting to default
org.springframework.cloud.netflix.eureka.server.EurekaServerBootstrap,enter initEurekaEnvironment()....{"listDelimiter":",","substitutor":{"escapeChar":"$","enableSubstitutionInVariables":false,"variableResolver":{"defaultLookup":{}}},"throwExceptionOnMissing":false,"errorListeners":[],"containerConfiguration":{"listDelimiter":",","substitutor":{"escapeChar":"$","enableSubstitutionInVariables":false,"variableResolver":{"defaultLookup":{}}},"throwExceptionOnMissing":false,"errorListeners":[],"delimiterParsingDisabled":false},"delimiterParsingDisabled":false}
2021-12-19 12:32:49.807  INFO 10272 --- [      Thread-35] o.s.c.n.e.server.EurekaServerBootstrap   : Eureka environment value eureka.environment is not set, defaulting to test
org.springframework.cloud.netflix.eureka.server.EurekaServerBootstrap, enter initEurekaServerContext()....
2021-12-19 12:32:49.808  INFO 10272 --- [           main] s.b.c.e.t.TomcatEmbeddedServletContainer : Tomcat started on port(s): 8761 (http)
2021-12-19 12:32:49.809  INFO 10272 --- [           main] .s.c.n.e.s.EurekaAutoServiceRegistration : Updating port to 8761
2021-12-19 12:32:49.813  INFO 10272 --- [           main] com.zhss.eureka.EurekaServer             : Started EurekaServer in 12.769 seconds (JVM running for 14.8)
2021-12-19 12:32:49.817  INFO 10272 --- [      Thread-35] o.s.c.n.e.server.EurekaServerBootstrap   : isAws returned false
2021-12-19 12:32:49.818  INFO 10272 --- [      Thread-35] o.s.c.n.e.server.EurekaServerBootstrap   : Initialized server context
com.netflix.eureka.registry.PeerAwareInstanceRegistryImpl enter syncUp ....
com.netflix.eureka.registry.PeerAwareInstanceRegistryImpl=>>0,eurekaClient:{},apps:{}
2021-12-19 12:32:49.819  INFO 10272 --- [      Thread-35] c.n.e.r.PeerAwareInstanceRegistryImpl    : Got 1 instances from neighboring DS node
2021-12-19 12:32:49.819  INFO 10272 --- [      Thread-35] c.n.e.r.PeerAwareInstanceRegistryImpl    : Renew threshold is: 1
2021-12-19 12:32:49.819  INFO 10272 --- [      Thread-35] c.n.e.r.PeerAwareInstanceRegistryImpl    : Changing status to UP
com.netflix.eureka.registry.AbstractInstanceRegistry,enter postInit()....
2021-12-19 12:32:49.824  INFO 10272 --- [      Thread-35] e.s.EurekaServerInitializerConfiguration : Started Eureka Server
2)、发布 Eureka 注册表可用的事件、EurekaServer 初始化配置状态更新、发布 EurekaServer 启动的事件
12、后续的定时任务：
2021-12-19 12:33:49.821  INFO 10272 --- [a-EvictionTimer] c.n.e.registry.AbstractInstanceRegistry  : Running the evict task with compensationTime 0ms
com.netflix.eureka.registry.AbstractInstanceRegistry,enter evict()....{}
2021-12-19T12:33:49.821,com.netflix.eureka.registry.PeerAwareInstanceRegistryImpl,enter isLeaseExpirationEnabled()....true,numberOfRenewsPerMinThreshold:1,getNumOfRenewsInLastMin():0
2021-12-19 12:34:49.822  INFO 10272 --- [a-EvictionTimer] c.n.e.registry.AbstractInstanceRegistry  : Running the evict task with compensationTime 0ms
```

## 3、启动流程图

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
