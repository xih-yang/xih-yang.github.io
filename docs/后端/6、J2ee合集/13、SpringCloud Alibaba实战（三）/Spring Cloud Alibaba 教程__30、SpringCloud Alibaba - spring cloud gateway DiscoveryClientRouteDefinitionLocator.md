# 30、SpringCloud Alibaba - spring cloud gateway DiscoveryClientRouteDefinitionLocator
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/30.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

DiscoveryClientRouteDefinitionLocator 用于从配置中心加载服务信息，并创建相应的路由。我这里使用的配置中心是nacos。

## 一、DiscoveryLocatorProperties

```java
@ConfigurationProperties("spring.cloud.gateway.discovery.locator")
public class DiscoveryLocatorProperties {
	//服务发现开关
	private boolean enabled = false;
	//路由id的前缀
	private String routeIdPrefix;
	//过滤服务
	private String includeExpression = "true";
	//gateway为每一个服务创建了一个router，这个router将以服务名开头的请求路径转发到对应的服务
	private String urlExpression = "'lb://'+serviceId";
	//将请求路径的服务名改为小写
	private boolean lowerCaseServiceId = false;
	//路由断言
	private List<PredicateDefinition> predicates = new ArrayList<>();
	//路由过滤器
	private List<FilterDefinition> filters = new ArrayList<>();
}
```

在配置文件中打开服务发现的开关

```java
spring.cloud.gateway.discovery.locator.enabled=true
spring.cloud.gateway.discovery.locator.lower-case-service-id=true
```

## 二、DiscoveryClientRouteDefinitionLocator

通过服务发现获取服务的路由信息

**1、** bean的创建；

```java
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnProperty(value = "spring.cloud.discovery.reactive.enabled", matchIfMissing = true)
	public static class ReactiveDiscoveryClientRouteDefinitionLocatorConfiguration {
		@Bean
		//打开了开关
		@ConditionalOnProperty(name = "spring.cloud.gateway.discovery.locator.enabled")
		public DiscoveryClientRouteDefinitionLocator discoveryClientRouteDefinitionLocator(
				ReactiveDiscoveryClient discoveryClient, DiscoveryLocatorProperties properties) {
			return new DiscoveryClientRouteDefinitionLocator(discoveryClient, properties);
		}
	}
```

**2、** 获取服务信息；

```java
	public DiscoveryClientRouteDefinitionLocator(ReactiveDiscoveryClient discoveryClient,
			DiscoveryLocatorProperties properties) {
		this(discoveryClient.getClass().getSimpleName(), properties);
		//通过服务发现客户端从nacos服务端获取服务信息
		serviceInstances = discoveryClient.getServices()
				.flatMap(service -> discoveryClient.getInstances(service).collectList());
	}
```

**3、** 获取nacos所有服务名；

1、discoveryClient.getServices( )

```java
NacosReactiveDiscoveryClient.java
	@Override
	public Flux<String> getServices() {
		return Flux.defer(() -> {
			try {
				return Flux.fromIterable(serviceDiscovery.getServices());
			}
			catch (Exception e) {
				log.error("get services from nacos server fail,", e);
				return Flux.empty();
			}
		}).subscribeOn(Schedulers.boundedElastic());
	}
```

2、serviceDiscovery.getServices( )

```java
NacosServiceDiscovery.java
	public List<String> getServices() throws NacosException {
		//组
		String group = discoveryProperties.getGroup();
		//从nacos获取所有注册的服务信息
		ListView<String> services = namingService().getServicesOfServer(1,
				Integer.MAX_VALUE, group);
		return services.getData();
	}
```

**4、** 从nacos服务端获取服务信息；

1、discoveryClient.getInstances(service)

```java
	@Override
	public Flux<ServiceInstance> getInstances(String serviceId) {
		return Mono.justOrEmpty(serviceId).flatMapMany(loadInstancesFromNacos())
				.subscribeOn(Schedulers.boundedElastic());
	}
```

2、loadInstancesFromNacos( )

```java
	private Function<String, Publisher<ServiceInstance>> loadInstancesFromNacos() {
		return serviceId -> {
			try {
				return Flux.fromIterable(serviceDiscovery.getInstances(serviceId));
			}
			catch (NacosException e) {
				log.error("get service instance[{}] from nacos error!", serviceId, e);
				return Flux.empty();
			}
		};
	}
```

3、

```java
	public List<ServiceInstance> getInstances(String serviceId) throws NacosException {
		String group = discoveryProperties.getGroup();
		//进入nacos服务发现流程
		List<Instance> instances = namingService().selectInstances(serviceId, group,
				true);
		return hostToServiceInstanceList(instances, serviceId);
	}
```

## 三、RefreshRoutesEvent

首先从NacosWatch开始分析

**1、** NacosWatch实现了SmartLifecycle接口，在它的start()方法中会定时调度nacosServicesWatch()，默认间隔时30s；

```java
	this.watchFuture = this.taskScheduler.scheduleWithFixedDelay(
					this::nacosServicesWatch, this.properties.getWatchDelay());
```

**2、** nacosServicesWatch()；

```java
	public void nacosServicesWatch() {
		//发布心跳事件 HeartbeatEvent
		this.publisher.publishEvent(
				new HeartbeatEvent(this, nacosWatchIndex.getAndIncrement()));
	}
```

**3、** RouteRefreshListener；

接收HeartbeatEvent，并发布刷新路由事件RefreshRoutesEvent

```java
	@Override
	public void onApplicationEvent(ApplicationEvent event) {
		if (event instanceof ContextRefreshedEvent) {
			ContextRefreshedEvent refreshedEvent = (ContextRefreshedEvent) event;
			if (!WebServerApplicationContext.hasServerNamespace(refreshedEvent.getApplicationContext(), "management")) {
				reset();
			}
		}
		else if (event instanceof RefreshScopeRefreshedEvent || event instanceof InstanceRegisteredEvent) {
			reset();
		}
		else if (event instanceof ParentHeartbeatEvent) {
			ParentHeartbeatEvent e = (ParentHeartbeatEvent) event;
			resetIfNeeded(e.getValue());
		}
		else if (event instanceof HeartbeatEvent) {
			//处理心跳事件
			HeartbeatEvent e = (HeartbeatEvent) event;
			resetIfNeeded(e.getValue());
		}
	}
```

```java
private void resetIfNeeded(Object value) {
		if (this.monitor.update(value)) {
			reset();
		}
	}
```

```java
private void reset() {
		//发布事件 RefreshRoutesEvent
		this.publisher.publishEvent(new RefreshRoutesEvent(this));
	}
```

**4、** CachingRouteLocator；

接收RefreshRoutesEvent 事件，并发布路由刷新结果事件 RefreshRoutesResultEvent

通过fetch() 方法获取路由信息，分别从 PropertiesRouteDefinitionLocator 、InMemoryRouteDefinitionRepository 、DiscoveryClientRouteDefinitionLocator 获取路由信息。

```java
	@Override
	public void onApplicationEvent(RefreshRoutesEvent event) {
		try {
			fetch().collect(Collectors.toList()).subscribe(
					list -> Flux.fromIterable(list).materialize().collect(Collectors.toList()).subscribe(signals -> {
						applicationEventPublisher.publishEvent(new RefreshRoutesResultEvent(this));
						cache.put(CACHE_KEY, signals);
					}, this::handleRefreshError), this::handleRefreshError);
		}
		catch (Throwable e) {
			handleRefreshError(e);
		}
	}
```

**5、** 从DiscoveryClientRouteDefinitionLocator获取服务发现相关路由；

1、getRouteDefinitions( )

```java
	@Override
	public Flux<RouteDefinition> getRouteDefinitions() {
		SpelExpressionParser parser = new SpelExpressionParser();
		Expression includeExpr = parser.parseExpression(properties.getIncludeExpression());
		Expression urlExpr = parser.parseExpression(properties.getUrlExpression());
		Predicate<ServiceInstance> includePredicate;
		if (properties.getIncludeExpression() == null || "true".equalsIgnoreCase(properties.getIncludeExpression())) {
			includePredicate = instance -> true;
		}
		else {
			includePredicate = instance -> {
				Boolean include = includeExpr.getValue(evalCtxt, instance, Boolean.class);
				if (include == null) {
					return false;
				}
				return include;
			};
		}
		//从nacos服务端获取服务信息
		return serviceInstances.filter(instances -> !instances.isEmpty()).map(instances -> instances.get(0))
				.filter(includePredicate).map(instance -> {
					//为每个服务构建RouteDefinition、PredicateDefinition、FilterDefinition
					RouteDefinition routeDefinition = buildRouteDefinition(urlExpr, instance);
					final ServiceInstance instanceForEval = new DelegatingServiceInstance(instance, properties);
					for (PredicateDefinition original : this.properties.getPredicates()) {
						PredicateDefinition predicate = new PredicateDefinition();
						predicate.setName(original.getName());
						for (Map.Entry<String, String> entry : original.getArgs().entrySet()) {
							String value = getValueFromExpr(evalCtxt, parser, instanceForEval, entry);
							predicate.addArg(entry.getKey(), value);
						}
						routeDefinition.getPredicates().add(predicate);
					}
					for (FilterDefinition original : this.properties.getFilters()) {
						FilterDefinition filter = new FilterDefinition();
						filter.setName(original.getName());
						for (Map.Entry<String, String> entry : original.getArgs().entrySet()) {
							String value = getValueFromExpr(evalCtxt, parser, instanceForEval, entry);
							filter.addArg(entry.getKey(), value);
						}
						routeDefinition.getFilters().add(filter);
					}
					return routeDefinition;
				});
	}
```

## 总结

定时从nacos获取服务信息，为每个服务创建路由信息。

在用户请求时就将对应服务的请求转发到对应的服务上。
