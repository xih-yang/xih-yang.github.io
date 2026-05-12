# 31、SpringCloud Alibaba - spring cloud gateway InMemoryRouteDefinitionRepository
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/31.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

通过接口注册的路由信息保存在 InMemoryRouteDefinitionRepository 中。

## 一、引入依赖

```java
		<dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
```

添加配置：

```java
management.endpoints.web.exposure.include=*
```

## 二、ControllerEndpointHandlerMapping

ControllerEndpointHandlerMapping 用于解析 @RestControllerEndpoint类的方法。

类似于springmvc 中 RequestMappingInfoHandlerMapping 解析 @Controller 的方法

**1、** ControllerEndpointHandlerMapping的创建；

在WebFluxEndpointManagementContextConfiguration配置类中，定义了 bean ControllerEndpointHandlerMapping

```java
	@Bean
	@ConditionalOnMissingBean
	public ControllerEndpointHandlerMapping controllerEndpointHandlerMapping(
			ControllerEndpointsSupplier controllerEndpointsSupplier, CorsEndpointProperties corsProperties,
			WebEndpointProperties webEndpointProperties) {
		EndpointMapping endpointMapping = new EndpointMapping(webEndpointProperties.getBasePath());
		return new ControllerEndpointHandlerMapping(endpointMapping, controllerEndpointsSupplier.getEndpoints(),
				corsProperties.toCorsConfiguration());
	}
```

```java
	public ControllerEndpointHandlerMapping(EndpointMapping endpointMapping,
			Collection<ExposableControllerEndpoint> endpoints, CorsConfiguration corsConfiguration) {
		Assert.notNull(endpointMapping, "EndpointMapping must not be null");
		Assert.notNull(endpoints, "Endpoints must not be null");
		this.endpointMapping = endpointMapping;
		this.handlers = getHandlers(endpoints);
		this.corsConfiguration = corsConfiguration;
		setOrder(-100);
	}
```

**2、** 在父类AbstractHandlerMethodMapping的afterPropertiesSet()方法中，会调用initHandlerMethods()；

```java
	public void afterPropertiesSet() {
		initHandlerMethods();
		// Total includes detected mappings + explicit registrations via registerMapping
		int total = getHandlerMethods().size();
		if ((logger.isTraceEnabled() && total == 0) || (logger.isDebugEnabled() && total > 0) ) {
			logger.debug(total + " mappings in " + formatMappingName());
		}
	}
```

3、initHandlerMethods( )

获取到@RestControllerEndpoint 标识的类的方法，注册到 ControllerEndpointHandlerMapping 中

## 三、GatewayControllerEndpoint

类上加了注解 @RestControllerEndpoint(id = “gateway”) , 会被上面的 ControllerEndpointHandlerMapping 类解析。

类中主要的一些方法如下：

**1、** 获取所有路由；

访问路径： /actuator/gateway/routes

```java
	@GetMapping("/routes")
	public Flux<Map<String, Object>> routes() {
		return this.routeLocator.getRoutes().map(this::serialize);
	}
```

**2、** 获取单个路由；

访问路径： /actuator/gateway/routes/{id}

```java
	@GetMapping("/routes/{id}")
	public Mono<ResponseEntity<Map<String, Object>>> route(@PathVariable String id) {
		// @formatter:off
		return this.routeLocator.getRoutes()
				.filter(route -> route.getId().equals(id))
				.singleOrEmpty()
				.map(this::serialize)
				.map(ResponseEntity::ok)
				.switchIfEmpty(Mono.just(ResponseEntity.notFound().build()));
		// @formatter:on
	}
```

**3、** 刷新路由；

访问路径： /actuator/gateway/refresh

发布RefreshRoutesEvent事件，会出重新从nacos等地方获取路由

```java
	@PostMapping("/refresh")
	public Mono<Void> refresh() {
		this.publisher.publishEvent(new RefreshRoutesEvent(this));
		return Mono.empty();
	}
```

**4、** 获取globalfilters、routefilters、routepredicates；

```java
	@GetMapping("/globalfilters")
	public Mono<HashMap<String, Object>> globalfilters() {
		return getNamesToOrders(this.globalFilters);
	}
	@GetMapping("/routefilters")
	public Mono<HashMap<String, Object>> routefilers() {
		return getNamesToOrders(this.GatewayFilters);
	}
	@GetMapping("/routepredicates")
	public Mono<HashMap<String, Object>> routepredicates() {
		return getNamesToOrders(this.routePredicates);
	}
```

**5、** 新增路由；

访问路径： /actuator/gateway/routes/{id}

请求方式是 @PostMapping

会调用InMemoryRouteDefinitionRepository 的 save( ) 保存路由信息

```java
	@PostMapping("/routes/{id}")
	@SuppressWarnings("unchecked")
	public Mono<ResponseEntity<Object>> save(@PathVariable String id, @RequestBody RouteDefinition route) {
		return Mono.just(route).filter(this::validateRouteDefinition)
				.flatMap(routeDefinition -> this.routeDefinitionWriter.save(Mono.just(routeDefinition).map(r -> {
					r.setId(id);
					log.debug("Saving route: " + route);
					return r;
				})).then(Mono.defer(() -> Mono.just(ResponseEntity.created(URI.create("/routes/" + id)).build()))))
				.switchIfEmpty(Mono.defer(() -> Mono.just(ResponseEntity.badRequest().build())));
	}
```

**6、** 删除路由；

访问路径： /actuator/gateway/routes/{id}

请求方式是 @DeleteMapping

会调用InMemoryRouteDefinitionRepository 的 delete( ) 删除路由信息

```java
	@DeleteMapping("/routes/{id}")
	public Mono<ResponseEntity<Object>> delete(@PathVariable String id) {
		return this.routeDefinitionWriter.delete(Mono.just(id))
				.then(Mono.defer(() -> Mono.just(ResponseEntity.ok().build())))
				.onErrorResume(t -> t instanceof NotFoundException, t -> Mono.just(ResponseEntity.notFound().build()));
	}
```

## 四、InMemoryRouteDefinitionRepository

```java
public class InMemoryRouteDefinitionRepository implements RouteDefinitionRepository {
	//路由信息保存在map中
	private final Map<String, RouteDefinition> routes = synchronizedMap(new LinkedHashMap<String, RouteDefinition>());
	//保存路由
	@Override
	public Mono<Void> save(Mono<RouteDefinition> route) {
		return route.flatMap(r -> {
			if (ObjectUtils.isEmpty(r.getId())) {
				return Mono.error(new IllegalArgumentException("id may not be empty"));
			}
			routes.put(r.getId(), r);
			return Mono.empty();
		});
	}
	//删除路由
	@Override
	public Mono<Void> delete(Mono<String> routeId) {
		return routeId.flatMap(id -> {
			if (routes.containsKey(id)) {
				routes.remove(id);
				return Mono.empty();
			}
			return Mono.defer(() -> Mono.error(new NotFoundException("RouteDefinition not found: " + routeId)));
		});
	}
	//获取路由
	@Override
	public Flux<RouteDefinition> getRouteDefinitions() {
		return Flux.fromIterable(routes.values());
	}
}
```

## 总结

**1、** ControllerEndpointHandlerMapping解析@ControllerEndpoint和@RestControllerEndpoint，构建路径访问信息；

**2、** GatewayControllerEndpoint和父类AbstractGatewayControllerEndpoint提供了对路由的http请求接口；

**3、** InMemoryRouteDefinitionRepository用于保存http方式新增的路由；

这种方式新增的路由保存在内存中，在系统重启后就丢失了。
