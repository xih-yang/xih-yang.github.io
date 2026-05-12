# 28、SpringCloud Alibaba - spring cloud gateway 的启动流程
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/28.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
启动过程中会加载和注册一些配置类和主要类。

**1、** GatewayClassPathWarningAutoConfiguration；

1、存在DispatcherServlet 时提示移除spring-boot-starter-web依赖

2、不存在DispatcherHandler时提示添加spring-boot-starter-webflux依赖

```java
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(name = "org.springframework.web.servlet.DispatcherServlet")
	protected static class SpringMvcFoundOnClasspathConfiguration {
		public SpringMvcFoundOnClasspathConfiguration() {
			log.warn(BORDER
					+ "Spring MVC found on classpath, which is incompatible with Spring Cloud Gateway at this time. "
					+ "Please remove spring-boot-starter-web dependency." + BORDER);
		}
	}
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnMissingClass("org.springframework.web.reactive.DispatcherHandler")
	protected static class WebfluxMissingFromClasspathConfiguration {
		public WebfluxMissingFromClasspathConfiguration() {
			log.warn(BORDER + "Spring Webflux is missing from the classpath, "
					+ "which is required for Spring Cloud Gateway at this time. "
					+ "Please add spring-boot-starter-webflux dependency." + BORDER);
		}
	}
```

**2、** GatewayReactiveLoadBalancerClientAutoConfiguration；

ReactiveLoadBalancerClientFilter 负载均衡客户端过滤器

```java
	@Bean
	@ConditionalOnBean(LoadBalancerClientFactory.class)
	@ConditionalOnMissingBean(ReactiveLoadBalancerClientFilter.class)
	@ConditionalOnEnabledGlobalFilter
	public ReactiveLoadBalancerClientFilter gatewayLoadBalancerClientFilter(LoadBalancerClientFactory clientFactory,
			GatewayLoadBalancerProperties properties, LoadBalancerProperties loadBalancerProperties) {
		//封装了LoadBalancerClientFactory和一些负载均衡配置信息
		return new ReactiveLoadBalancerClientFilter(clientFactory, properties, loadBalancerProperties);
	}
```

**3、** LoadBalancerAutoConfiguration；

LoadBalancerClientFactory 负载均衡客户端工厂

```java
	@ConditionalOnMissingBean
	@Bean
	public LoadBalancerClientFactory loadBalancerClientFactory() {
		LoadBalancerClientFactory clientFactory = new LoadBalancerClientFactory();
		clientFactory.setConfigurations(this.configurations.getIfAvailable(Collections::emptyList));
		return clientFactory;
	}
```

**4、** GatewayProperties；

网关的配置信息，从配置文件中加载 spring.cloud.gateway 相关路由、过滤器等信息

**5、** RouteLocator；

1、DiscoveryClientRouteDefinitionLocator

服务发现客户端路由，例如从nacos服务端获取的服务信息

2、PropertiesRouteDefinitionLocator

获取GatewayProperties 配置文件中的路由信息

```java
	@Override
	public Flux<RouteDefinition> getRouteDefinitions() {
		return Flux.fromIterable(this.properties.getRoutes());
	}
```

3、InMemoryRouteDefinitionRepository

获取内存中的路由信息

```java
	@Override
	public Flux<RouteDefinition> getRouteDefinitions() {
		return Flux.fromIterable(routes.values());
	}
```

注册路由是通过 AbstractGatewayControllerEndpoint 接口

```java
	@PostMapping("/routes/{id}")
	@SuppressWarnings("unchecked")
	public Mono<ResponseEntity<Object>> save(@PathVariable String id, @RequestBody RouteDefinition route) {
		return Mono.just(route).filter(this::validateRouteDefinition)
				//保存
				.flatMap(routeDefinition -> this.routeDefinitionWriter.save(Mono.just(routeDefinition).map(r -> {
					r.setId(id);
					log.debug("Saving route: " + route);
					return r;
				})).then(Mono.defer(() -> Mono.just(ResponseEntity.created(URI.create("/routes/" + id)).build()))))
				.switchIfEmpty(Mono.defer(() -> Mono.just(ResponseEntity.badRequest().build())));
	}
```

```java
	@Override
	public Mono<Void> save(Mono<RouteDefinition> route) {
		return route.flatMap(r -> {
			if (ObjectUtils.isEmpty(r.getId())) {
				return Mono.error(new IllegalArgumentException("id may not be empty"));
			}
			//放入内存
			routes.put(r.getId(), r);
			return Mono.empty();
		});
	}
```

4、CompositeRouteDefinitionLocator

组合路由信息，传入DiscoveryClientRouteDefinitionLocator、PropertiesRouteDefinitionLocator、InMemoryRouteDefinitionRepository

```java
	@Override
	public Flux<RouteDefinition> getRouteDefinitions() {
		//合并路由信息
		return this.delegates.flatMapSequential(RouteDefinitionLocator::getRouteDefinitions)
				.flatMap(routeDefinition -> {
					if (routeDefinition.getId() == null) {
						return randomId().map(id -> {
							routeDefinition.setId(id);
							if (log.isDebugEnabled()) {
								log.debug("Id set on route definition: " + routeDefinition);
							}
							return routeDefinition;
						});
					}
					return Mono.just(routeDefinition);
				});
	}
```

5、RouteDefinitionRouteLocator

传入CompositeRouteDefinitionLocator、gatewayFilters、predicates 等

```java
	public RouteDefinitionRouteLocator(RouteDefinitionLocator routeDefinitionLocator,
			List<RoutePredicateFactory> predicates, List<GatewayFilterFactory> gatewayFilterFactories,
			GatewayProperties gatewayProperties, ConfigurationService configurationService) {
		this.routeDefinitionLocator = routeDefinitionLocator;
		this.configurationService = configurationService;
		initFactories(predicates);
		gatewayFilterFactories.forEach(factory -> this.gatewayFilterFactories.put(factory.name(), factory));
		this.gatewayProperties = gatewayProperties;
	}
```

6、CompositeRouteLocator

包装RouteDefinitionRouteLocator

```java
@Override
	public Flux<RouteDefinition> getRouteDefinitions() {
		//从 RouteDefinitionRouteLocator 中获取路由
		return this.delegates.flatMapSequential(RouteDefinitionLocator::getRouteDefinitions)
				.flatMap(routeDefinition -> {
					if (routeDefinition.getId() == null) {
						return randomId().map(id -> {
							routeDefinition.setId(id);
							if (log.isDebugEnabled()) {
								log.debug("Id set on route definition: " + routeDefinition);
							}
							return routeDefinition;
						});
					}
					return Mono.just(routeDefinition);
				});
	}
```

7、CachingRouteLocator

包装CompositeRouteLocator

```java
	@Override
	public void onApplicationEvent(RefreshRoutesEvent event) {
		try {
			fetch().collect(Collectors.toList()).subscribe(
					list -> Flux.fromIterable(list).materialize().collect(Collectors.toList()).subscribe(signals -> {
						//发布 RefreshRoutesResultEvent 事件
						applicationEventPublisher.publishEvent(new RefreshRoutesResultEvent(this));
						//放入缓存
						cache.put(CACHE_KEY, signals);
					}, this::handleRefreshError), this::handleRefreshError);
		}
		catch (Throwable e) {
			handleRefreshError(e);
		}
	}
```

**6、** RouteRefreshListener；

路由刷新监听器，接收ContextRefreshedEvent、RefreshScopeRefreshedEvent、InstanceRegisteredEvent、ParentHeartbeatEvent、HeartbeatEvent，并发布 RefreshRoutesEvent 事件

```java
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
			HeartbeatEvent e = (HeartbeatEvent) event;
			resetIfNeeded(e.getValue());
		}
	}
```

```java
	private void reset() {
		this.publisher.publishEvent(new RefreshRoutesEvent(this));
	}
```

**7、** FilteringWebHandler；

请求处理器，将 GlobalFilter 转换成 GatewayFilter，处理请求的filter 链

```java
public FilteringWebHandler(List<GlobalFilter> globalFilters) {
		this.globalFilters = loadFilters(globalFilters);
	}
	private static List<GatewayFilter> loadFilters(List<GlobalFilter> filters) {
		return filters.stream().map(filter -> {
			GatewayFilterAdapter gatewayFilter = new GatewayFilterAdapter(filter);
			if (filter instanceof Ordered) {
				int order = ((Ordered) filter).getOrder();
				return new OrderedGatewayFilter(gatewayFilter, order);
			}
			return gatewayFilter;
		}).collect(Collectors.toList());
	}
```

**8、** RoutePredicateHandlerMapping；

路由的处理器映射器，包含了webHandler、routeLocator等，用于查找出对应路由

```java
public RoutePredicateHandlerMapping(FilteringWebHandler webHandler, RouteLocator routeLocator,
			GlobalCorsProperties globalCorsProperties, Environment environment) {
		this.webHandler = webHandler;
		this.routeLocator = routeLocator;
		this.managementPort = getPortProperty(environment, "management.server.");
		this.managementPortType = getManagementPortType(environment);
		setOrder(1);
		setCorsConfigurations(globalCorsProperties.getCorsConfigurations());
	}
```

**9、** DispatcherHandler；

初始化HandlerMapping、HandlerAdapter、HandlerResultHandler

```java
	@Override
	public void setApplicationContext(ApplicationContext applicationContext) {
		initStrategies(applicationContext);
	}
	protected void initStrategies(ApplicationContext context) {
		//找出 HandlerMapping.class
		Map<String, HandlerMapping> mappingBeans = BeanFactoryUtils.beansOfTypeIncludingAncestors(
				context, HandlerMapping.class, true, false);
		ArrayList<HandlerMapping> mappings = new ArrayList<>(mappingBeans.values());
		AnnotationAwareOrderComparator.sort(mappings);
		this.handlerMappings = Collections.unmodifiableList(mappings);
		//找出 HandlerAdapter.class
		Map<String, HandlerAdapter> adapterBeans = BeanFactoryUtils.beansOfTypeIncludingAncestors(
				context, HandlerAdapter.class, true, false);
		this.handlerAdapters = new ArrayList<>(adapterBeans.values());
		AnnotationAwareOrderComparator.sort(this.handlerAdapters);
		//找出 HandlerResultHandler.class
		Map<String, HandlerResultHandler> beans = BeanFactoryUtils.beansOfTypeIncludingAncestors(
				context, HandlerResultHandler.class, true, false);
		this.resultHandlers = new ArrayList<>(beans.values());
		AnnotationAwareOrderComparator.sort(this.resultHandlers);
	}
```
