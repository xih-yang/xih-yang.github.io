# 29、SpringCloud Alibaba - spring cloud gateway 的调用流程
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/29.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 一、流程

**1、** DispatcherHandler请求分发器，获取RoutePredicateHandlerMapping等；

**2、** RoutePredicateHandlerMapping路由处理器映射器，通过谓词匹配出合适的路由和WebHandler，如FilteringWebHandler等；

**3、** FilteringWebHandler使用Filter链处理请求；

## 二、DispatcherHandler

**1、** handle()；

处理请求

```java
	@Override
	public Mono<Void> handle(ServerWebExchange exchange) {
		if (this.handlerMappings == null) {
			return createNotFoundError();
		}
		if (CorsUtils.isPreFlightRequest(exchange.getRequest())) {
			return handlePreFlight(exchange);
		}
		return Flux.fromIterable(this.handlerMappings)
				//找到 handler
				.concatMap(mapping -> mapping.getHandler(exchange))
				.next()
				.switchIfEmpty(createNotFoundError())
				//调用 handler
				.flatMap(handler -> invokeHandler(exchange, handler))
				//处理结果
				.flatMap(result -> handleResult(exchange, result));
	}
```

**2、** getHandler()；

通过RoutePredicateHandlerMapping 获取 FilteringWebHandler

1、getHandler( )

```java
	AbstractHandlerMapping.java
	@Override
	public Mono<Object> getHandler(ServerWebExchange exchange) {
		//调用子类 getHandlerInternal()
		return getHandlerInternal(exchange).map(handler -> {
			if (logger.isDebugEnabled()) {
				logger.debug(exchange.getLogPrefix() + "Mapped to " + handler);
			}
			ServerHttpRequest request = exchange.getRequest();
			//处理跨域
			if (hasCorsConfigurationSource(handler) || CorsUtils.isPreFlightRequest(request)) {
				CorsConfiguration config = (this.corsConfigurationSource != null ?
						this.corsConfigurationSource.getCorsConfiguration(exchange) : null);
				CorsConfiguration handlerConfig = getCorsConfiguration(handler, exchange);
				config = (config != null ? config.combine(handlerConfig) : handlerConfig);
				if (config != null) {
					config.validateAllowCredentials();
				}
				if (!this.corsProcessor.process(config, exchange) || CorsUtils.isPreFlightRequest(request)) {
					return NO_OP_HANDLER;
				}
			}
			return handler;
		});
	}
```

2、getHandlerInternal( )

```java
	@Override
	protected Mono<?> getHandlerInternal(ServerWebExchange exchange) {
		// don't handle requests on management port if set and different than server port
		if (this.managementPortType == DIFFERENT && this.managementPort != null
				&& exchange.getRequest().getURI().getPort() == this.managementPort) {
			return Mono.empty();
		}
		exchange.getAttributes().put(GATEWAY_HANDLER_MAPPER_ATTR, getSimpleName());
		//查找路由
		return lookupRoute(exchange)
				// .log("route-predicate-handler-mapping", Level.FINER) //name this
				.flatMap((Function<Route, Mono<?>>) r -> {
					exchange.getAttributes().remove(GATEWAY_PREDICATE_ROUTE_ATTR);
					if (logger.isDebugEnabled()) {
						logger.debug("Mapping [" + getExchangeDesc(exchange) + "] to " + r);
					}
					//将路由放入上下文环境
					exchange.getAttributes().put(GATEWAY_ROUTE_ATTR, r);
					//返回 webHandler
					return Mono.just(webHandler);
				}).switchIfEmpty(Mono.empty().then(Mono.fromRunnable(() -> {
					exchange.getAttributes().remove(GATEWAY_PREDICATE_ROUTE_ATTR);
					if (logger.isTraceEnabled()) {
						logger.trace("No RouteDefinition found for [" + getExchangeDesc(exchange) + "]");
					}
				})));
	}
```

3、lookupRoute( )

```java
	protected Mono<Route> lookupRoute(ServerWebExchange exchange) {
		//从 CachingRouteLocator 中获取所有路由
		return this.routeLocator.getRoutes()
				// individually filter routes so that filterWhen error delaying is not a
				// problem
				.concatMap(route -> Mono.just(route).filterWhen(r -> {
					// add the current route we are testing
					exchange.getAttributes().put(GATEWAY_PREDICATE_ROUTE_ATTR, r.getId());
					//通过谓词校验路由
					return r.getPredicate().apply(exchange);
				})
						// instead of immediately stopping main flux due to error, log and
						// swallow it
						.doOnError(e -> logger.error("Error applying predicate for route: " + route.getId(), e))
						.onErrorResume(e -> Mono.empty()))
				// .defaultIfEmpty() put a static Route not found
				// or .switchIfEmpty()
				// .switchIfEmpty(Mono.<Route>empty().log("noroute"))
				.next()
				// TODO: error handling
				.map(route -> {
					if (logger.isDebugEnabled()) {
						logger.debug("Route matched: " + route.getId());
					}
					validateRoute(route, exchange);
					//返回路由信息
					return route;
				});
		/*
		 * TODO: trace logging if (logger.isTraceEnabled()) {
		 * logger.trace("RouteDefinition did not match: " + routeDefinition.getId()); }
		 */
	}
```

## 三、FilteringWebHandler

调用filter链处理请求

**1、** 调用FilteringWebHandler的invokeHandler()；

```java
private Mono<HandlerResult> invokeHandler(ServerWebExchange exchange, Object handler) {
		if (ObjectUtils.nullSafeEquals(exchange.getResponse().getStatusCode(), HttpStatus.FORBIDDEN)) {
			return Mono.empty();  // CORS rejection
		}
		if (this.handlerAdapters != null) {
			//找到合适的handlerAdapter，即 SimpleHandlerAdapter
			for (HandlerAdapter handlerAdapter : this.handlerAdapters) {
				if (handlerAdapter.supports(handler)) {
					return handlerAdapter.handle(exchange, handler);
				}
			}
		}
		return Mono.error(new IllegalStateException("No HandlerAdapter: " + handler));
	}
```

**2、** SimpleHandlerAdapter；

```java
public class SimpleHandlerAdapter implements HandlerAdapter {
	@Override
	public boolean supports(Object handler) {
		// WebHandler 的子类
		return WebHandler.class.isAssignableFrom(handler.getClass());
	}
	@Override
	public Mono<HandlerResult> handle(ServerWebExchange exchange, Object handler) {
		WebHandler webHandler = (WebHandler) handler;
		//处理请求
		Mono<Void> mono = webHandler.handle(exchange);
		return mono.then(Mono.empty());
	}
}
```

**3、** FilteringWebHandler.handle()；

```java
@Override
	public Mono<Void> handle(ServerWebExchange exchange) {
		//获取路由
		Route route = exchange.getRequiredAttribute(GATEWAY_ROUTE_ATTR);
		//获取路由过滤器
		List<GatewayFilter> gatewayFilters = route.getFilters();
		//合并全局过滤器
		List<GatewayFilter> combined = new ArrayList<>(this.globalFilters);
		combined.addAll(gatewayFilters);
		// TODO: needed or cached?
		AnnotationAwareOrderComparator.sort(combined);
		if (logger.isDebugEnabled()) {
			logger.debug("Sorted gatewayFilterFactories: " + combined);
		}
		//包装成过滤器链，并依次调用
		return new DefaultGatewayFilterChain(combined).filter(exchange);
	}
```

**4、** DefaultGatewayFilterChain；

```java
	private static class DefaultGatewayFilterChain implements GatewayFilterChain {
		//filter索引
		private final int index;
		//filter集合
		private final List<GatewayFilter> filters;
		DefaultGatewayFilterChain(List<GatewayFilter> filters) {
			this.filters = filters;
			this.index = 0;
		}
		private DefaultGatewayFilterChain(DefaultGatewayFilterChain parent, int index) {
			this.filters = parent.getFilters();
			this.index = index;
		}
		public List<GatewayFilter> getFilters() {
			return filters;
		}
		@Override
		public Mono<Void> filter(ServerWebExchange exchange) {
			return Mono.defer(() -> {
				//调用filter
				if (this.index < filters.size()) {
					GatewayFilter filter = filters.get(this.index);
					DefaultGatewayFilterChain chain = new DefaultGatewayFilterChain(this, this.index + 1);
					return filter.filter(exchange, chain);
				}
				else {
					return Mono.empty(); // complete
				}
			});
		}
	}
```
