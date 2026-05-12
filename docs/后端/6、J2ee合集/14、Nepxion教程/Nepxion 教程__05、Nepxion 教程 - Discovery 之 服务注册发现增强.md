# 05、Nepxion 教程 - Discovery 之 服务注册发现增强
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/5.html
- 分类：J2EE框架
- 分组：Nepxion 教程
Nepxion Discovery 在进行灰度发布的时候其实就是通过请求接口时的传入参数(或者在配置中心配置的参数)以及注册在注册中心的服务进行匹配找到合适的服务进行调用。在前面的文章 [4、Nepxion Discovery 之 Spring Cloud 服务注册抽象](/zhuanlan/j2ee/nepxion/1/4.html) Spring Cloud 对于不同的注册中心都会有统一进行抽象。

Nepxion Discovery 其实就是使用了 Registration(注册) 的父接口 `ServiceInstance` 里面的元数据。

> ServiceInstance.java

```java
public interface ServiceInstance {
	default String getInstanceId() {
		return null;
	}
	String getServiceId();
	String getHost();
	int getPort();
	boolean isSecure();
	URI getUri();
	Map<String, String> getMetadata();
	default String getScheme() {
		return null;
	}
}
```

在服务进行自动注册的时候只需要把元数据添加到注册中心的元数据里面去就可以了。在这里就以 Nacos 举例，其它注册中心类似。

## 1、NacosApplicationContextInitializer

这个接口实现继承自 PluginApplicationContextInitializer，而 PluginApplicationContextInitializer 实现了ApplicationContextInitializer 接口，在 Spring Boot 项目启动的时候创建了容器，在对容器进行刷新之前。会对它进行一些初始化操作，其中一个扩展就是调用实现了 ApplicationContextInitializer 接口的对象列表。也就是会调用 PluginApplicationContextInitializer#initialize 方法，在这个方法里面添加了一个 BeanPostProcessor。BeanPostProcess 的功能是在 Spring 容器刷新实例化 Spring Bean 的实现对 bean 进行增强。 BeanPostProcess#postProcessAfterInitialization 是在 Spring Bean 创建完成之后，对 bean 进行增强，在这里它增强所做最核心的其实就是做了两件事：

- 对 DiscoveryClient 进行包装，添加 Nepxion Discovery 的功能，DiscoveryClient 的功能是获取服务实例列表。在服务调用的时候需要通过它获取到服务列表，服务列表有可能有1个或者多个，然后服务调用方使用负载均衡选择一个合适的服务进行调用
- PluginApplicationContextInitializer#afterInitialization 这个抽象方法对所有的服务注册中心抽象作了一个抽象。

下面我们来看一下是如何对 Nacos 注册中心进行增强的：

> NacosApplicationContextInitializer.java

```java
public class NacosApplicationContextInitializer extends PluginApplicationContextInitializer {
    @Override
    protected Object afterInitialization(ConfigurableApplicationContext applicationContext, Object bean, String beanName) throws BeansException {
        if (bean instanceof NacosServiceRegistry) {
            NacosServiceRegistry nacosServiceRegistry = (NacosServiceRegistry) bean;
            NacosDiscoveryProperties nacosDiscoveryProperties = applicationContext.getBean(NacosDiscoveryProperties.class);
            return new NacosServiceRegistryDecorator(nacosDiscoveryProperties, nacosServiceRegistry, applicationContext);
        } else if (bean instanceof NacosDiscoveryProperties) {
            ConfigurableEnvironment environment = applicationContext.getEnvironment();
            NacosDiscoveryProperties nacosDiscoveryProperties = (NacosDiscoveryProperties) bean;
            Map<String, String> metadata = nacosDiscoveryProperties.getMetadata();
            String groupKey = PluginContextAware.getGroupKey(environment);
            if (!metadata.containsKey(groupKey)) {
                metadata.put(groupKey, DiscoveryConstant.DEFAULT);
            }
            if (!metadata.containsKey(DiscoveryConstant.VERSION)) {
                metadata.put(DiscoveryConstant.VERSION, DiscoveryConstant.DEFAULT);
            }
            if (!metadata.containsKey(DiscoveryConstant.REGION)) {
                metadata.put(DiscoveryConstant.REGION, DiscoveryConstant.DEFAULT);
            }
            String prefixGroup = getPrefixGroup(applicationContext);
            if (StringUtils.isNotEmpty(prefixGroup)) {
                metadata.put(groupKey, prefixGroup);
            }
            String gitVersion = getGitVersion(applicationContext);
            if (StringUtils.isNotEmpty(gitVersion)) {
                metadata.put(DiscoveryConstant.VERSION, gitVersion);
            }
            metadata.put(DiscoveryConstant.SPRING_BOOT_VERSION, SpringBootVersion.getVersion());
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_NAME, PluginContextAware.getApplicationName(environment));
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_TYPE, PluginContextAware.getApplicationType(environment));
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_UUID, PluginContextAware.getApplicationUUId(environment));
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_DISCOVERY_PLUGIN, NacosConstant.NACOS_TYPE);
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_DISCOVERY_VERSION, DiscoveryConstant.DISCOVERY_VERSION);
            String agentVersion = System.getProperty(DiscoveryConstant.SPRING_APPLICATION_DISCOVERY_AGENT_VERSION);
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_DISCOVERY_AGENT_VERSION, StringUtils.isEmpty(agentVersion) ? DiscoveryConstant.UNKNOWN : agentVersion);
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_REGISTER_CONTROL_ENABLED, PluginContextAware.isRegisterControlEnabled(environment).toString());
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_DISCOVERY_CONTROL_ENABLED, PluginContextAware.isDiscoveryControlEnabled(environment).toString());
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_CONFIG_REST_CONTROL_ENABLED, PluginContextAware.isConfigRestControlEnabled(environment).toString());
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_GROUP_KEY, groupKey);
            metadata.put(DiscoveryConstant.SPRING_APPLICATION_CONTEXT_PATH, PluginContextAware.getContextPath(environment));
            try {
                ApplicationInfoAdapter applicationInfoAdapter = applicationContext.getBean(ApplicationInfoAdapter.class);
                if (applicationInfoAdapter != null) {
                    metadata.put(DiscoveryConstant.APP_ID, applicationInfoAdapter.getAppId());
                }
            } catch (Exception e) {
            }
            MetadataUtil.filter(metadata);
            return bean;
        } else {
            return bean;
        }
    }
}
```

- 如果 Spring 初始化的 bean 类型是 NacosServiceRegistry，就使用 NacosServiceRegistryDecorator 装饰器模式把 NacosDiscoveryProperties(Nacos 的 Spring Cloud 属性配置)、 NacosServiceRegistry(Nacos 服务注册原有对象)以及 ConfigurableApplicationContext(Spring 容器)对原有的 NacosServiceRegistry进行增强。在 Nepxion Discovery 框架中大量使用了这种装饰器模式对原有对象进行增强。
- 如果Spring 初始化的 bean 类型是 NacosDiscoveryProperties，这为这个对象添加一些服务的元数据信息。包含服务的version、group、region 等信息。并且上面的一步其实把 NacosServiceRegistry 进行了增强成为了它的继承类NacosServiceRegistryDecorator 。而NacosServiceRegistryDecorator又持有NacosDiscoveryProperties的对象引用，所以在服务注册的时候就会把元数据添加到注册中心里面。

## 2、NacosServiceRegistryDecorator

NacosServiceRegistryDecorator 是**Nepxion Discovery 对服务注册的增强**。在 NacosApplicationContextInitializer#afterInitialization 里面不仅是对注册中心元数据进行了添加。还对 NacosServiceRegistry 这个服务注册类进行了增强。也就是对 ServiceRegistry 这个接口里面的所有方法进行了增强。

> ServiceRegistry.java

```java
public interface ServiceRegistry<R extends Registration> {
	void register(R registration);
	void deregister(R registration);
	void close();
	void setStatus(R registration, String status);
	<T> T getStatus(R registration);
}
```

对于这个接口在之前的博客 [4、Nepxion Discovery 之 Spring Cloud 服务注册抽象](/zhuanlan/j2ee/nepxion/1/4.html) 有相应的描述，其实就是服务注册相关的接口。`Nepxion Discovery` 框架通过 `RegisterListener` 这个服务注册监听器来对服务去远程注册中心注册进行增强，这个接口的描述如下：

> RegisterListener.java

```java
public interface RegisterListener extends Listener {
    void onRegister(Registration registration);
    void onDeregister(Registration registration);
    void onSetStatus(Registration registration, String status);
    void onClose();
}
```

其实就是对应 `ServiceRegistry` 里面的接口。在 `Nepxion Discovery` 框架内部有以下几种实现：

类名
所属模块
实现功能

ConsumerIsolationRegisterStrategy
discovery-plugin-strategy-starter
当本服务的元数据中的Group在黑名单里或者不在白名单里，禁止被注册到注册中心

CountFilterRegisterListener
discovery-plugin-framework-starter
限制服务注册的最大个数(配置中心配置)

HostFilterRegisterListener
discovery-plugin-framework-starter
服务注册黑白名单限制(配置中心配置)

当然大家也可以自己对它进行实现。比如 `discovery-springcloud-example-gateway` 模块就有 `MyRegisterListener` 实现。

## 3、DiscoveryClientDecorator

`DiscoveryClientDecorator` 接口是 **Nepxion Discovery 对服务发现的增强**，这个对象持久 `ConfigurableApplicationContext` 这个 Spring 容器对象，还有 `ConfigurableEnvironment` 这个 Spring 对环境变量的抽象。

> DiscoveryClientDecorator.java

```java
public class DiscoveryClientDecorator implements DiscoveryClient {
    // private static final Logger LOG = LoggerFactory.getLogger(DiscoveryClientDecorator.class);
    private DiscoveryClient discoveryClient;
    private ConfigurableApplicationContext applicationContext;
    private ConfigurableEnvironment environment;
    public DiscoveryClientDecorator(DiscoveryClient discoveryClient, ConfigurableApplicationContext applicationContext) {
        this.discoveryClient = discoveryClient;
        this.applicationContext = applicationContext;
        this.environment = applicationContext.getEnvironment();
    }
    @Override
    public List<ServiceInstance> getInstances(String serviceId) {
        List<ServiceInstance> instances = getRealInstances(serviceId);
        Boolean discoveryControlEnabled = PluginContextAware.isDiscoveryControlEnabled(environment);
        if (discoveryControlEnabled) {
            try {
                DiscoveryListenerExecutor discoveryListenerExecutor = applicationContext.getBean(DiscoveryListenerExecutor.class);
                discoveryListenerExecutor.onGetInstances(serviceId, instances);
            } catch (BeansException e) {
                // LOG.warn("Get bean for DiscoveryListenerExecutor failed, ignore to executor listener");
            }
        }
        return instances;
    }
	...
}
```

在服务发现获取服务实例列表的时候，如果支持 `Nepxion Discovery` 框架进行服务发现控制(通过参数：`spring.application.discovery.control.enabled=true/false`) ，当允许控制(前面参数为true(默认值))。就会在Spring 容器里面获取 `DiscoveryListenerExecutor` 对象进行服务发现扩展，也就是通过它里面持有的 `DiscoveryListener` 对象实例列表来对服务列表进行拦截。这个是 `discovery-plugin-framework-starter` 框架核心模块里面的功能。我们先来看一下这个接口的定义：

> DiscoveryListener.java

```java
public interface DiscoveryListener extends Listener {
    void onGetInstances(String serviceId, List<ServiceInstance> instances);
    void onGetServices(List<String> services);
}
```

框架默认有以下几个实现：

类名
所属模块
实现功能

RegionFilterDiscoveryListener
discovery-plugin-framework-starter
消费方 Region 级别的灰度(如果未配置，可以调用提供端所有服务)

HostFilterDiscoveryListener
discovery-plugin-framework-starter
Host 黑白名单过滤(配置中心配置)

VersionFilterDiscoveryListener
discovery-plugin-framework-starter
服务版本过滤(配置中心配置)

ConsumerIsolationDiscoveryStrategy
discovery-plugin-strategy-starter
当目标服务的元数据中的Group和本服务不相等，禁止被本服务发现

ZoneFilterDiscoveryListener
discovery-plugin-framework-starter
消费方 Zone 级别的灰度

当然你也可以自己实现，比如 `discovery-springcloud-example-gateway` 模块就有 `MyLoadBalanceListener` 实现。

## 4、NacosAdapter

`Nepxion Discovery` 框架对获取灰度发布需要的值以及注册中心的元数据抽象成了 `PluginAdapter` 接口。不同的注册中心获取元数据的值都是不一样的，以 nacos 举例：

```java
public class NacosAdapter extends AbstractPluginAdapter {
    @Override
    public Map<String, String> getServerMetadata(Server server) {
        if (server instanceof NacosServer) {
            NacosServer nacosServer = (NacosServer) server;
            return nacosServer.getMetadata();
        }
        return emptyMetadata;
    }
}
```

我们还是以 [Nepxion Discovery 灰度发布初体验](/zhuanlan/j2ee/nepxion/1/2.html) 为例子。我们启动两个 `discovery-guide-service-a` 服务，也就是运行 `DiscoveryGuideServiceA1` 与 `DiscoveryGuideServiceA2` 的 main 方法。看注册中心里面服务的元数据是什么样的。

在nacos 控制台的服务列表里面可以看到：

`discovery-guide-service-a` 服务正常运行了两台实例。点开详情：

可以看到这个服务被分组在 `DEFAULT_GROUP` 里面，并且分别可以看到服务端口 3001 和 3002 两台实例的元数据信息：

> 端口 3002 机器实例数据信息
>
>
>
> 端口 3001 机器实例元数据信息

进行在进行灰度发布的时候服务发访问发起的时候会从 nacos 注册中心获取各个服务里面的元数据，通过传入值与各个服务里面的元数据进行比较就可以访问灰度发布想要访问的路径了。
