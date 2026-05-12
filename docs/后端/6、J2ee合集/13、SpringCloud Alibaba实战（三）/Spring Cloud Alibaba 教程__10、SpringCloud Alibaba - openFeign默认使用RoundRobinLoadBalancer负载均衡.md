# 10、SpringCloud Alibaba - openFeign默认使用RoundRobinLoadBalancer负载均衡
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/10.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

openFeign默认是通过 RoundRobinLoadBalancer 实现负载均衡。

## 一、默认配置

**1、** LoadBalancerClientFactory；

负载均衡客户端工厂LoadBalancerClientFactory的创建是在LoadBalancerAutoConfiguration中

```java
@ConditionalOnMissingBean
	@Bean
	public LoadBalancerClientFactory loadBalancerClientFactory() {
		//创建 LoadBalancerClientFactory 
		LoadBalancerClientFactory clientFactory = new LoadBalancerClientFactory();
		//使用LoadBalancerClientSpecification来扩展负载均衡
		clientFactory.setConfigurations(this.configurations.getIfAvailable(Collections::emptyList));
		return clientFactory;
	}
```

**2、** LoadBalancerClient；

负载均衡客户端LoadBalancerClient 默认实现是BlockingLoadBalancerClient，创建是在 BlockingLoadBalancerClientAutoConfiguration中

```java
	@Bean
	@ConditionalOnBean(LoadBalancerClientFactory.class)
	@ConditionalOnMissingBean
	public LoadBalancerClient blockingLoadBalancerClient(LoadBalancerClientFactory loadBalancerClientFactory,
			LoadBalancerProperties properties) {
		return new BlockingLoadBalancerClient(loadBalancerClientFactory, properties);
	}
```

**3、** ServiceInstanceListSupplier；

服务列表提供者，默认创建是在ReactiveSupportConfiguration中

```java
@Bean
		@ConditionalOnBean(ReactiveDiscoveryClient.class)
		@ConditionalOnMissingBean
		@ConditionalOnProperty(value = "spring.cloud.loadbalancer.configurations", havingValue = "default",
				matchIfMissing = true)
		public ServiceInstanceListSupplier discoveryClientServiceInstanceListSupplier(
				ConfigurableApplicationContext context) {
			return ServiceInstanceListSupplier.builder().withDiscoveryClient().withCaching().build(context);
		}
```

**4、** ReactorLoadBalancer；

负载均衡接口，默认实现类创建是在LoadBalancerClientConfiguration中，使用的是 RoundRobinLoadBalancer

```java
@Bean
	@ConditionalOnMissingBean
	public ReactorLoadBalancer<ServiceInstance> reactorServiceInstanceLoadBalancer(Environment environment,
			LoadBalancerClientFactory loadBalancerClientFactory) {
		String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
		//传入ClientFactoryObjectProvider，包含远程服务名称等
		return new RoundRobinLoadBalancer(
				loadBalancerClientFactory.getLazyProvider(name, ServiceInstanceListSupplier.class), name);
	}
```

**5、** FeignBlockingLoadBalancerClient；

它是feign 客户端的默认实现，创建是在DefaultFeignLoadBalancerConfiguration中，传入了LoadBalancerClientFactory、LoadBalancerClient等参数

```java
@Bean
	@ConditionalOnMissingBean
	@Conditional(OnRetryNotEnabledCondition.class)
	public Client feignClient(LoadBalancerClient loadBalancerClient, LoadBalancerProperties properties,
			LoadBalancerClientFactory loadBalancerClientFactory) {
		return new FeignBlockingLoadBalancerClient(new Client.Default(null, null), loadBalancerClient, properties,
				loadBalancerClientFactory);
	}
```

## 二、负载均衡流程

在FeignBlockingLoadBalancerClient中，执行远程服务之前，会先从服务列表中根据负载均衡算法选择合适的服务，下面针对服务的选择过程进行分析。

在FeignBlockingLoadBalancerClient 类的 execute( ) 方法中

```java
ServiceInstance instance = loadBalancerClient.choose(serviceId, lbRequest);
```

这里的是loadBalancerClient 是 BlockingLoadBalancerClient

**1、** choose()；

```java
public <T> ServiceInstance choose(String serviceId, Request<T> request) {
		//获取默认的 RoundRobinLoadBalancer
		ReactiveLoadBalancer<ServiceInstance> loadBalancer = loadBalancerClientFactory.getInstance(serviceId);
		if (loadBalancer == null) {
			return null;
		}
		//负载均衡
		Response<ServiceInstance> loadBalancerResponse = Mono.from(loadBalancer.choose(request)).block();
		if (loadBalancerResponse == null) {
			return null;
		}
		//返回负载均衡选择的服务
		return loadBalancerResponse.getServer();
	}
```

**2、** 负载均衡；

loadBalancer.choose(request)

```java
public Mono<Response<ServiceInstance>> choose(Request request) {
		//获取服务列表提供者 CachingServiceInstanceListSupplier
		ServiceInstanceListSupplier supplier = serviceInstanceListSupplierProvider
				.getIfAvailable(NoopServiceInstanceListSupplier::new);
		//封装获取服务逻辑
		return supplier.get(request).next()
				.map(serviceInstances -> processInstanceResponse(supplier, serviceInstances));
	}
```

## 三、负载均衡实现

**1、** CachingServiceInstanceListSupplier的创建；

带缓存的服务列表提供者，它实现了 ServiceInstanceListSupplier 接口，上面已经提到过，下面看一下它的创建过程：

```java
ServiceInstanceListSupplier.builder().withDiscoveryClient().withCaching().build(context);
```

1、builder( )

创建builder 对象

```java
	static ServiceInstanceListSupplierBuilder builder() {
		return new ServiceInstanceListSupplierBuilder();
	}
```

2、withDiscoveryClient( )

定义了baseCreator 对象，用于创建DiscoveryClientServiceInstanceListSupplier对象CompositeDiscoveryClient

```java
public ServiceInstanceListSupplierBuilder withDiscoveryClient() {
		if (baseCreator != null && LOG.isWarnEnabled()) {
			LOG.warn("Overriding a previously set baseCreator with a ReactiveDiscoveryClient baseCreator.");
		}
		this.baseCreator = context -> {
			//获取到容器中的ReactiveDiscoveryClient ，这里是 CompositeDiscoveryClient，它是服务发现的核心类，下面还会提到
			ReactiveDiscoveryClient discoveryClient = context.getBean(ReactiveDiscoveryClient.class);
			return new DiscoveryClientServiceInstanceListSupplier(discoveryClient, context.getEnvironment());
		};
		return this;
	}
```

3、withCaching( )

定义了cachingCreator ，用于创建带缓存功能的 CachingServiceInstanceListSupplier

```java
public ServiceInstanceListSupplierBuilder withCaching() {
		if (cachingCreator != null && LOG.isWarnEnabled()) {
			LOG.warn(
					"Overriding a previously set cachingCreator with a CachingServiceInstanceListSupplier-based cachingCreator.");
		}
		this.cachingCreator = (context, delegate) -> {
			ObjectProvider<LoadBalancerCacheManager> cacheManagerProvider = context
					.getBeanProvider(LoadBalancerCacheManager.class);
			if (cacheManagerProvider.getIfAvailable() != null) {
				return new CachingServiceInstanceListSupplier(delegate, cacheManagerProvider.getIfAvailable());
			}
			if (LOG.isWarnEnabled()) {
				LOG.warn("LoadBalancerCacheManager not available, returning delegate without caching.");
			}
			return delegate;
		};
		return this;
	}
```

4、build(context)

创建出CachingServiceInstanceListSupplier

```java
public ServiceInstanceListSupplier build(ConfigurableApplicationContext context) {
		Assert.notNull(baseCreator, "A baseCreator must not be null");
		//获取 DiscoveryClientServiceInstanceListSupplier
		ServiceInstanceListSupplier supplier = baseCreator.apply(context);
		//使用 creators 进行包装
		for (DelegateCreator creator : creators) {
			supplier = creator.apply(context, supplier);
		}
		//获取 CachingServiceInstanceListSupplier
		if (this.cachingCreator != null) {
			supplier = this.cachingCreator.apply(context, supplier);
		}
		return supplier;
	}
```

**2、** DiscoveryClientServiceInstanceListSupplier；

1、构造方法

```java
public DiscoveryClientServiceInstanceListSupplier(DiscoveryClient delegate, Environment environment) {
		this.serviceId = environment.getProperty(PROPERTY_NAME);
		resolveTimeout(environment);
		//获取服务列表，delegate.getInstances(serviceId)，其中delegate 是 CompositeDiscoveryClient
		this.serviceInstances = Flux.defer(() -> Flux.just(delegate.getInstances(serviceId)))
				.subscribeOn(Schedulers.boundedElastic()).timeout(timeout, Flux.defer(() -> {
					logTimeout();
					return Flux.just(new ArrayList<>());
				})).onErrorResume(error -> {
					logException(error);
					return Flux.just(new ArrayList<>());
				});
	}
```

2、CompositeDiscoveryClient

在CompositeDiscoveryClientAutoConfiguration 中 ，创建 compositeDiscoveryClient对象，传入的参数是根据容器中的discoveryClients，容器中的DiscoveryClient 有NacosDiscoveryClient、SimpleDiscoveryClient

```java
@Configuration(proxyBeanMethods = false)
@AutoConfigureBefore(SimpleDiscoveryClientAutoConfiguration.class)
public class CompositeDiscoveryClientAutoConfiguration {
	@Bean
	@Primary
	public CompositeDiscoveryClient compositeDiscoveryClient(List<DiscoveryClient> discoveryClients) {
		return new CompositeDiscoveryClient(discoveryClients);
	}
}
```

3、DiscoveryClient

创建NacosDiscoveryClient，里面包含了 NacosServiceDiscovery

```java
public class NacosDiscoveryClientConfiguration {
	@Bean
	public DiscoveryClient nacosDiscoveryClient(
			NacosServiceDiscovery nacosServiceDiscovery) {
		return new NacosDiscoveryClient(nacosServiceDiscovery);
	}
}
```

4、NacosServiceDiscovery

在NacosDiscoveryAutoConfiguration 中 创建了 NacosServiceDiscovery ，传入的参数有NacosDiscoveryProperties 和 NacosServiceManager

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnDiscoveryEnabled
@ConditionalOnNacosDiscoveryEnabled
public class NacosDiscoveryAutoConfiguration {
	@Bean
	@ConditionalOnMissingBean
	public NacosDiscoveryProperties nacosProperties() {
		return new NacosDiscoveryProperties();
	}
	@Bean
	@ConditionalOnMissingBean
	public NacosServiceDiscovery nacosServiceDiscovery(
			NacosDiscoveryProperties discoveryProperties,
			NacosServiceManager nacosServiceManager) {
		return new NacosServiceDiscovery(discoveryProperties, nacosServiceManager);
	}
}
```

流程好像封装的有些复杂，现在理一下类之间的关系，从前到后依次是包含关系：

a）服务发现关键类之间的关系：

CompositeDiscoveryClient-》NacosDiscoveryClient-》NacosServiceDiscovery-》NacosServiceManager -》NacosNamingService -》hostReactor-》serviceInfoMap

其中最里面的 serviceInfoMap 包含了远程服务信息，也就是将 CompositeDiscoveryClient 与服务列表联系了起来。

b）服务列表提供者关键类之间的关系：

CachingServiceInstanceListSupplier -》DiscoveryClientServiceInstanceListSupplier -》CompositeDiscoveryClient

c）这样 ServiceInstanceListSupplier 与 CompositeDiscoveryClient 就关联了起来，而 CompositeDiscoveryClient 与 serviceInfoMap 又关联了起来。

**3、** 获取服务列表；

从delegate.getInstances(serviceId) 开始分析，也就是 CompositeDiscoveryClient 类中的getInstances( ) 方法

```java
	CompositeDiscoveryClient.java
	@Override
	public List<ServiceInstance> getInstances(String serviceId) {
		if (this.discoveryClients != null) {
			for (DiscoveryClient discoveryClient : this.discoveryClients) {
				//调用 NacosDiscoveryClient 的 getInstances()
				List<ServiceInstance> instances = discoveryClient.getInstances(serviceId);
				if (instances != null && !instances.isEmpty()) {
					return instances;
				}
			}
		}
		return Collections.emptyList();
	}
```

```java
@Override
	public List<ServiceInstance> getInstances(String serviceId) {
		try {
			//调用 NacosServiceDiscovery 的 getInstances()
			return serviceDiscovery.getInstances(serviceId);
		}
		catch (Exception e) {
			throw new RuntimeException(
					"Can not get hosts from nacos server. serviceId: " + serviceId, e);
		}
	}
```

```java
public List<ServiceInstance> getInstances(String serviceId) throws NacosException {
		String group = discoveryProperties.getGroup();
		//获取服务列表
		List<Instance> instances = namingService().selectInstances(serviceId, group,
				true);
		return hostToServiceInstanceList(instances, serviceId);
	}
```

进入服务发现的流程，最终获取到对应 serviceId 的服务列表信息

**4、** 负载均衡实现；

获取到服务列表以后，回到 RoundRobinLoadBalancer 类中 processInstanceResponse 方法

```java
private Response<ServiceInstance> processInstanceResponse(ServiceInstanceListSupplier supplier,
			List<ServiceInstance> serviceInstances) {
		//从服务列表中选择一个服务
		Response<ServiceInstance> serviceInstanceResponse = getInstanceResponse(serviceInstances);
		if (supplier instanceof SelectedInstanceCallback && serviceInstanceResponse.hasServer()) {
			((SelectedInstanceCallback) supplier).selectedServiceInstance(serviceInstanceResponse.getServer());
		}
		return serviceInstanceResponse;
	}
```

具体的负载均衡算法，这里使用的是轮询

```java
private Response<ServiceInstance> getInstanceResponse(List<ServiceInstance> instances) {
		if (instances.isEmpty()) {
			if (log.isWarnEnabled()) {
				log.warn("No servers available for service: " + serviceId);
			}
			return new EmptyResponse();
		}
		// TODO: enforce order?
		//位置加1
		int pos = Math.abs(this.position.incrementAndGet());
		//获取对应位置的服务
		ServiceInstance instance = instances.get(pos % instances.size());
		return new DefaultResponse(instance);
	}
```
