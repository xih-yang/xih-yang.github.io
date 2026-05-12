# 13、源码解析 EurekaClient 启动分析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/d-1/13.html
- 分类：注册中心
- 分组：Eureka 教程（版本 A）
EurekaClient在SpringCloud中的启动分析

## 1、@EnableDiscoveryClient

1、引入 jar 包就不说了

2、在 Application 启动类上加上@EnableEurekaClient注解

```java
@SpringBootApplication
@EnableEurekaClient//该注解就是让其成为一个 client,去向 EurekaServer发起注册
// @EnableDiscoveryClient 这个注解其实跟上面是一样的效果，
//1、只是呢服务发现有很多种实现方式，eureka 只是其中一种，@EnableEurekaClient只对 Eureka 生效，他是在org.springframework.cloud.netflix.eureka 包下，在spring-cloud-netflix-eureka-client-1.4.4.RELEASE.jar包中
//2、@EnableDiscoveryClient对所有的服务发现都可以用，他在 org.springframework.cloud.client.discovery 包下。在spring-cloud-commons-1.3.3.RELEASE.jar 中
public class ServiceAApplication {
public static void main(String[] args) {
    SpringApplication.run(ServiceAApplication.class, args);
    }
}
```

## 2、EurekaDiscoveryClientConfigServiceAutoConfiguration

```java
// 这里有一个条件判断，说明必须有这个类所以我们来看一下这个类
@ConditionalOnBean({
EurekaDiscoveryClientConfiguration.class })
@ConditionalOnProperty(value = "spring.cloud.config.discovery.enabled", matchIfMissing = false)
public class EurekaDiscoveryClientConfigServiceAutoConfiguration {
 @Autowired
 private ConfigurableApplicationContext context;
 @PostConstruct
 public void init() {
  if (this.context.getParent() != null) {
   if (this.context.getBeanNamesForType(EurekaClient.class).length > 0
     && this.context.getParent()
       .getBeanNamesForType(EurekaClient.class).length > 0) {
    // If the parent has a EurekaClient as well it should be shutdown, so the
    // local one can register accurate instance info
    this.context.getParent().getBean(EurekaClient.class).shutdown();
   }
  }
 }
}
```

### 2.1 EurekaDiscoveryClientConfiguration

```java
@Configuration
@EnableConfigurationProperties
@ConditionalOnClass(EurekaClientConfig.class)
@ConditionalOnProperty(value = "eureka.client.enabled", matchIfMissing = true)
public class EurekaDiscoveryClientConfiguration {
 class Marker {
     }
 @Bean
 public Marker eurekaDiscoverClientMarker() {
  return new Marker();
 }
 @Configuration
 @ConditionalOnClass(RefreshScopeRefreshedEvent.class)
 protected static class EurekaClientConfigurationRefresher {
  @Autowired(required = false)
  private EurekaClient eurekaClient;
  @Autowired(required = false)
  private EurekaAutoServiceRegistration autoRegistration;
  @EventListener(RefreshScopeRefreshedEvent.class)
  public void onApplicationEvent(RefreshScopeRefreshedEvent event) {
   //This will force the creation of the EurkaClient bean if not already created
   //to make sure the client will be reregistered after a refresh event
   if(eurekaClient != null) {
    eurekaClient.getApplications();
   }
   if (autoRegistration != null) {
    // register in case meta data changed
    this.autoRegistration.stop();
    // 这里有一个 start() 关注一下
    this.autoRegistration.start();
   }
  }
 }
 @Configuration
 @ConditionalOnProperty(value = "eureka.client.healthcheck.enabled", matchIfMissing = false)
 protected static class EurekaHealthCheckHandlerConfiguration {
  @Autowired(required = false)
  private HealthAggregator healthAggregator = new OrderedHealthAggregator();
  @Bean
  @ConditionalOnMissingBean(HealthCheckHandler.class)
  public EurekaHealthCheckHandler eurekaHealthCheckHandler() {
   return new EurekaHealthCheckHandler(this.healthAggregator);
  }
 }
}
```

### 2.2 EurekaAutoServiceRegistration

> 通过打印日志我们会发现，在这个方法中执行了很多逻辑，因为在这个类 start 方法中会触发很多类的构建，比如 DiscoveryClient，他会做很多事情，比如 fetchRegistry、initScheduledTasks()…

```java
public class EurekaAutoServiceRegistration implements AutoServiceRegistration, SmartLifecycle, Ordered {
 private static final Log log = LogFactory.getLog(EurekaAutoServiceRegistration.class);
 private AtomicBoolean running = new AtomicBoolean(false);
 private int order = 0;
 private AtomicInteger port = new AtomicInteger(0);
 private ApplicationContext context;
 private EurekaServiceRegistry serviceRegistry;
 private EurekaRegistration registration;
 public EurekaAutoServiceRegistration(ApplicationContext context, EurekaServiceRegistry serviceRegistry, EurekaRegistration registration) {
  this.context = context;
  this.serviceRegistry = serviceRegistry;
  this.registration = registration;
 }
 @Override
 public void start() {
  System.out.println(LocalDateTime.now() + " " + Thread.currentThread().getName() + " start...");
  // only set the port if the nonSecurePort or securePort is 0 and this.port != 0
  if (this.port.get() != 0) {
   if (this.registration.getNonSecurePort() == 0) {
    this.registration.setNonSecurePort(this.port.get());
   }
   if (this.registration.getSecurePort() == 0 && this.registration.isSecure()) {
    this.registration.setSecurePort(this.port.get());
   }
  }
  // only initialize if nonSecurePort is greater than 0 and it isn't already running
  // because of containerPortInitializer below
  if (!this.running.get() && this.registration.getNonSecurePort() > 0) {
   /**
    * 1、注册当前客户端(注册的时候可能需要初始化 ApplicationInfoManager、EurekaClient)
    */
   /**
    * 1>、这个就是下面的打印 before
    *   2021-12-19T19:17:34.709 main before register...
    * 2>、这个就是 this.serviceRegistry.register(this.registration) 调用这个方法进去的打印信息
    *   2021-12-19T19:17:34.709,org.springframework.cloud.netflix.eureka.serviceregistry.EurekaServiceRegistry, enter register()....,reg is:
    *
    * 3>、实例化 ApplicationInfoManager 准备开始 > 1、创建 InstanceInfo 2、实例化 ApplicationInfoManager
    *   1)、2 eurekaApplicationInfoManager
    *   2)、2021-12-19 19:17:34.717  INFO 18500 --- [           main] o.s.c.n.eureka.InstanceInfoFactory       : Setting initial instance status as: STARTING
    *   3)、2021-12-19 19:17:34.717  INFO 18500 --- [           main] c.n.appinfo.ApplicationInfoManager       : ApplicationInfoManager constructor ing....
    *
    * 4>、实例化 CloudEurekaClient(DiscoverClient 的子类)
    *   2021-12-19T19:17:34.723,org.springframework.cloud.netflix.eureka.EurekaClientAutoConfiguration,lazy enter eurekaClient()....
    *   2021-12-19 19:17:34.757  INFO 18500 --- [           main] com.netflix.discovery.DiscoveryClient    : Initializing Eureka in region us-east-1
    * 2021-12-19T19:33:27.243,com.netflix.discovery.DiscoveryClient,enter constructor.... after scheduleServerEndpointTask
    * 2021-12-19 19:33:27.250  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : Disable delta property : false
    * 2021-12-19 19:33:27.250  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : Single vip registry refresh property : null
    * 2021-12-19 19:33:27.250  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : Force full registry fetch : false
    * 2021-12-19 19:33:27.250  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : Application is null : false
    * 2021-12-19 19:33:27.250  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : Registered Applications size is zero : true
    * 2021-12-19 19:33:27.250  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : Application version is -1: true
    * 2021-12-19 19:33:27.250  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : Getting all instance registry info from the eureka server
    * 2021-12-19 19:33:27.384  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : The response status is 200
    * 2021-12-19 19:33:27.387  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : Starting heartbeat executor: renew interval is: 30
    * 2021-12-19 19:33:27.391  INFO 2520 --- [           main] c.n.discovery.InstanceInfoReplicator     : InstanceInfoReplicator onDemand update allowed rate per min is 4
    * 2021-12-19T19:33:27.391,com.netflix.discovery.DiscoveryClient,添加应用状态变更的监听器....
    * 2021-12-19 19:33:27.392  INFO 2520 --- [           main] c.n.discovery.InstanceInfoReplicator     : 开启定时任务:2021-12-19T19:33:27.392
    * 2021-12-19 19:33:27.394  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : Discovery Client initialized at timestamp 1639913607394 with initial instances count: 1
    */
   System.out.println(LocalDateTime.now() + " " + Thread.currentThread().getName() + " before register...");
   /**
    * 5>、进入 EurekaServiceRegistry.register() 方法
    *   1、进入打印语句
    *    	2021-12-19 19:33:27.403  INFO 2520 --- [           main] o.s.c.n.e.s.EurekaServiceRegistry        : Registering application ServiceA with eureka with status UP
    *   2、实例化上面的那些变量后的状态变更监听事件发布
    *    	2021-12-19 19:33:27.441  INFO 2520 --- [           main] c.n.appinfo.ApplicationInfoManager       : listener:{}, statusChangeEvent:StatusChangeEvent [timestamp=1639913607403, current=UP, previous=STARTING]
    *   3、DiscoveryClient 监听到事件的处理
    *    	2021-12-19 19:33:27.441  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : statusChangeEvent:StatusChangeEvent [timestamp=1639913607403, current=UP, previous=STARTING]
    *    	2021-12-19 19:33:27.441  INFO 2520 --- [           main] com.netflix.discovery.DiscoveryClient    : Saw local status change event StatusChangeEvent [timestamp=1639913607403, current=UP, previous=STARTING]
    * 		2021-12-19T19:33:27.442 main after register...
    * 		2021-12-19T19:33:27.442 main before publish InstanceRegisteredEvent...
    */
   this.serviceRegistry.register(this.registration);
   System.out.println(LocalDateTime.now() + " " + Thread.currentThread().getName() + " after register...");
   /**
    * 2、发布客户端已注册的事件
    */
   System.out.println(LocalDateTime.now() + " " + Thread.currentThread().getName() + " before publish InstanceRegisteredEvent...");
   this.context.publishEvent(
       new InstanceRegisteredEvent<>(this, this.registration.getInstanceConfig()));
   System.out.println(LocalDateTime.now() + " " + Thread.currentThread().getName() + " after publish InstanceRegisteredEvent...");
   this.running.set(true);
  }
 }
 @Override
 public void stop() {
  this.serviceRegistry.deregister(this.registration);
  this.running.set(false);
 }
 @Override
 public boolean isRunning() {
  return this.running.get();
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
  stop();
  callback.run();
 }
 @Override
 public int getOrder() {
  return this.order;
 }
 @EventListener(EmbeddedServletContainerInitializedEvent.class)
 public void onApplicationEvent(EmbeddedServletContainerInitializedEvent event) {
  // TODO: take SSL into account when Spring Boot 1.2 is available
  int localPort = event.getEmbeddedServletContainer().getPort();
  if (this.port.get() == 0) {
   log.info("Updating port to " + localPort);
   this.port.compareAndSet(0, localPort);
   start();
  }
 }
 @EventListener(ContextClosedEvent.class)
 public void onApplicationEvent(ContextClosedEvent event) {
  if (event.getApplicationContext() == context) {
   stop();
  }
 }
}
```

## 3、EurekaClient在SpringCloud中的启动流程 流程图

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
