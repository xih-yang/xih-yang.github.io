# 16、SpringCloud Gateway 网关的源码解析
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/16.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 1、概述

本周又回顾了一下Spring Cloud Gateway的内容，主要参考《重新定义Spring Cloud实战》以及一些网络博客，虽然内容都差不多，但我还想照猫画虎总结一下子，加深印象。

SpringCloud gateway是Spring Cloud生态体系的第二代网关，是基于Spring5.0、Spring Boot 2.0、Reactor等技术开发的网关。底层主要是两大核心:Spring web Filter chain和Spring WebFlux。

对两大核心不了解的可以先补补知识，第二部分分析一下gateway中如何使用的filter，以及chain的实现：

[Filter](https://www.cnblogs.com/yihuihui/p/11715416.html) ：Filter是一个Servlet规范组件；一个请求可以在Http请求到达Servlet前被一个或多个Filter处理，Servlet处理完后返回给Filter,最后返回给用户。

[WebFlux](https://www.cnblogs.com/quanxiaoha/p/10773773.html)：它是一个异步非阻塞式的web框架，它的作用不是提升接口请求时间，而是在一些阻塞的场景【例如请求DB，等待DB响应数据、打开大文件等】，可以把线程给其它请求使用，从而提升系统吞吐量。Gateway属于网络IO密集型【网关转发请求到下游服务】，通过WebFlux有效的提升网关转发的吞吐量。

Spring Cloud Gateway核心概念：

- 路由(Route.java)：由一个id，一个目标uri，一组断言工厂和一组Filter组成

```java
public class Route implements Ordered {
	private final String id;
	private final URI uri;
	private final int order;
	private final AsyncPredicate<ServerWebExchange> predicate;
	private final List<GatewayFilter> gatewayFilters;
	/**省略构造函数和get set方法/
}
```

- 断言(AsyncPredicate)：java8中的断言函数，上述代码中的predicate属性
- 过滤器：标准的Spring web Filter；SpringCloud Gateway中包含GlobalFilter和GatewayFilter。

## 2、ServerWebExchange

SpringCloud gateway的上下文是ServerWebExchange，请求的信息都存储在ServerWebExchange中，在网关上的后续操作都是基于上下文操作的，在http请求到达网关之后，网关入口是ReactorHttpHandlerAdapter#apply方法，去获取请求的request和response，构建当次请求的上下文供后续filter使用：

```java
public class ReactorHttpHandlerAdapter implements BiFunction<HttpServerRequest, HttpServerResponse, Mono<Void>> {
	@Override
	public Mono<Void> apply(HttpServerRequest reactorRequest, HttpServerResponse reactorResponse) {
		NettyDataBufferFactory bufferFactory = new NettyDataBufferFactory(reactorResponse.alloc());
		try {
		    //获取请求的Request，构建ReactorServerHttpRequest
			ReactorServerHttpRequest request = new ReactorServerHttpRequest(reactorRequest, bufferFactory);
			//构建ServerHttpResponse
			ServerHttpResponse response = new ReactorServerHttpResponse(reactorResponse, bufferFactory);
			if (request.getMethod() == HttpMethod.HEAD) {
				response = new HttpHeadResponseDecorator(response);
			}
			//交给HttpWebHandlerAdapter构建上下文ServerWebExchange
			return this.httpHandler.handle(request, response)
					.doOnError(ex -> logger.trace(request.getLogPrefix() + "Failed to complete: " + ex.getMessage()))
					.doOnSuccess(aVoid -> logger.trace(request.getLogPrefix() + "Handling completed"));
		}
		catch (URISyntaxException ex) {
			if (logger.isDebugEnabled()) {
				logger.debug("Failed to get request URI: " + ex.getMessage());
			}
			reactorResponse.status(HttpResponseStatus.BAD_REQUEST);
			return Mono.empty();
		}
	}
}
```

构建完request和response后，交给HttpWebHandlerAdapter构建上下文ServerWebExchange

```java
public class HttpWebHandlerAdapter extends WebHandlerDecorator implements HttpHandler {
	public Mono<Void> handle(ServerHttpRequest request, ServerHttpResponse response) {
		if (this.forwardedHeaderTransformer != null) {
			request = this.forwardedHeaderTransformer.apply(request);
		}
		//构建请求的上下文
		ServerWebExchange exchange = createExchange(request, response);
		LogFormatUtils.traceDebug(logger, traceOn ->
				exchange.getLogPrefix() + formatRequest(exchange.getRequest()) +
						(traceOn ? ", headers=" + formatHeaders(exchange.getRequest().getHeaders()) : ""));
		return getDelegate().handle(exchange)
				.doOnSuccess(aVoid -> logResponse(exchange))
				.onErrorResume(ex -> handleUnresolvedError(exchange, ex))
				.then(Mono.defer(response::setComplete));
	}
}
```

## 3、Route和RouteDefinition

我们在配置文件中配置的一个路由规则，对应到Java类就是GatewayProperties，Spring boot会将配置文件映射为Java类，例如如下配置：

```sh
spring:
  cloud:
    gateway:
      routes:
      - id: add_request_header_route
        uri: http://localhost:8080
        predicates:
        - Path=/test/**
        filters:
        - AddRequestHeader=NAME, test
```

RouteDefinition：路由定义，是GatewayProperties类中的一个属性，网关启动后，Springboot帮我们做了映射，上述配置的路由就设置到了 GatewayProperties对象中。

Route：是从路由定义

**路由信息映射到GatewayProperties后如何获取其中的RouteDefinition？**

答案是通过RouteDefinitionLocator，RouteDefinitionLocator有5个实现类

- PropertiesRouteDefinitionLocator：从Properties中读取

```java
public class PropertiesRouteDefinitionLocator implements RouteDefinitionLocator {
	private final GatewayProperties properties;
	//构造函数设置properties
	public PropertiesRouteDefinitionLocator(GatewayProperties properties) {
		this.properties = properties;
	}
	//从properties中读取RouteDefinition
	@Override
	public Flux<RouteDefinition> getRouteDefinitions() {
		return Flux.fromIterable(this.properties.getRoutes());
	}
}
```

- InMemoryRouteDefinitionRepository：对RouteDefinition进行增、删、查操作，基于内存存储
- CompositeRouteDefinitionLocator：组合的Locator，在构造函数中设置委托，将PropertiesRouteDefinitionLocator和InMemoryRouteDefinitionRepository组合。

```java
public class CompositeRouteDefinitionLocator implements RouteDefinitionLocator {
	private final Flux<RouteDefinitionLocator> delegates;
	//将PropertiesRouteDefinitionLocator和InMemoryRouteDefinitionRepository组合
	public CompositeRouteDefinitionLocator(Flux<RouteDefinitionLocator> delegates) {
		this.delegates = delegates;
	}
	//委托给PropertiesRouteDefinitionLocator或InMemoryRouteDefinitionRepository执行读取
	@Override
	public Flux<RouteDefinition> getRouteDefinitions() {
		return this.delegates.flatMap(RouteDefinitionLocator::getRouteDefinitions);
	}
}
```

## 4、GlobalFilter和GatewayFilter

两种Filter都是拦截到http请求后做一些处理，gateway为什么提供两种Filter？

**总结**：GlobalFilter是所有被gateway拦截的http请求都要做的处理；GatewayFilter是根据路由配置匹配predicate的http请求才会做的处理。

### 4.1、GlobalFilter

GlobalFilter：全局拦截器，是所有被拦截到的http请求都要去做的处理；例如拿到一个http请求后，我们的目的是转发到下游服务，请求结果并返回，那么所有被拦截到的http请求都需要做下列几件事：

- 按照predicate把符合规则的url转换为真正要去请求的url
- 调用真正的下游服务【SpringCloud Gateway是基于netty实现的http调用，具体代码在NettyRoutingFilter类中】
- 拿到response，返回给调用方

像这种每个被拦截到的http请求都要去做的处理抽象出来就是一个个的GlobalFilter

**接口定义**

```java
public interface GlobalFilter {
	Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain);
}
```

接口中只有一个filter方法，实现类实现该接口后在filter中去做具体拦截逻辑，这些Filter都实现了GlobalFilter接口，一起来看一下实现该接口的类都做了什么操作：

- **AdaptCachedBodyGlobalFilter**：优先级最高的Filter，请求到gateway后，将上下文【ServerWebExchange】中已有的缓存删除【请求信息】，将此次的请求信息缓存到上下文中。

```java
public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
		// 获取上下文中已有的请求缓存
		Flux<DataBuffer> body = exchange.getAttributeOrDefault(CACHED_REQUEST_BODY_KEY,
				null);
		if (body != null) {
			ServerHttpRequestDecorator decorator = new ServerHttpRequestDecorator(
					exchange.getRequest()) {
				@Override
				public Flux<DataBuffer> getBody() {
					return body;
				}
			};
			// 删除上下文中的请求缓存
			exchange.getAttributes().remove(CACHED_REQUEST_BODY_KEY);
			// 将此次请求信息添加到上下文缓存中
			return chain.filter(exchange.mutate().request(decorator).build());
		}
		return chain.filter(exchange);
	}
```

- **GatewayMetricsFilter**：统计网关的性能指标

```java
private void endTimerInner(ServerWebExchange exchange, Sample sample) {
    // 此处省略一部分代码
    // ...
    Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
    // 统计网关的性能指标
    Tags tags = Tags.of("outcome", outcome, "status", status, "routeId",
            route.getId(), "routeUri", route.getUri().toString());
    if (log.isTraceEnabled()) {
        log.trace("Stopping timer 'gateway.requests' with tags " + tags);
    }
    sample.stop(meterRegistry.timer("gateway.requests", tags));
}
```

- **NettyWriteResponseFilter**：基于Web Flux，若上下文中存在CLIENT_RESPONSE_CONN_ATTR，将响应数据返回。
- **ForwardPathFilter**：如果该请求还未被路由或scheme【URI对象的属性】不是forward，则将该请求对应配置的Route信息中uri的path设置到上下文ServerWebExchange中。

```java
public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
    URI routeUri = route.getUri();
    String scheme = routeUri.getScheme();
    if (isAlreadyRouted(exchange) || !"forward".equals(scheme)) {
        return chain.filter(exchange);
    }
    // 将该请求对应配置的Route信息中uri的path设置到上下文ServerWebExchange中
    exchange = exchange.mutate()
            .request(exchange.getRequest().mutate().path(routeUri.getPath()).build())
            .build();
    return chain.filter(exchange);
}
```

- **RouteToRequestUrlFilter**：将此次请求的uri和配置的Route规则做merged处理，拿到真正代理的下游服务的地址，将得到的url放到上下文中，key为GATEWAY_REQUEST_URL_ATTR
- **NoLoadBalancerClientFilter**：没有负载均衡的拦截器
- **WebsocketRoutingFilter**：路由WebSocket请求，校验逻辑在WebsocketRoutingFilter#changeSchemeIfIsWebSocketUpgrade中。
- **NettyRoutingFilter**：网关的http是基于netty实现的，若此次请求scheme是http或https则使用基于netty的httpClient执行调用，将返回结果写入上下文中。

```java
exchange.getAttributes().put(CLIENT_RESPONSE_ATTR, res);
exchange.getAttributes().put(CLIENT_RESPONSE_CONN_ATTR, connection);
```

- **ForwardRoutingFilter**：设置此次请求已被路由

```java
public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    URI requestUrl = exchange.getRequiredAttribute(GATEWAY_REQUEST_URL_ATTR);
    String scheme = requestUrl.getScheme();
    if (isAlreadyRouted(exchange) || !"forward".equals(scheme)) {
        return chain.filter(exchange);
    }
    // 设置此次请求已被路由
    setAlreadyRouted(exchange);
    if (log.isTraceEnabled()) {
        log.trace("Forwarding to URI: " + requestUrl);
    }
    return this.getDispatcherHandler().handle(exchange);
}
```

- WebClientHttpRoutingFilter：作用同NettyRoutingFilter，方式同LoadBalancerClientFilter
- WebClientWriteResponseFilter：作用同NettyWriteResponseFilter
- LoadBalancerClientFilter：网关提供了负载均衡的Filter，具体负载规则可以自己实现

```java
public class LoadBalancerClientFilter implements GlobalFilter, Ordered {
	// 可以自己去实现
	protected final LoadBalancerClient loadBalancer;
}
```

### 4.2、GatewayFilter

GatewayFilter是面向开发人员的，因需适配，当我们需要给符合predicate的url做一些处理时通过配置就可添加，例如，我们想给path匹配上/test/**的url添加header，通过下列配置就可添加，这类配置是根据业务需求进行的特殊配置。工厂较多，也比较简单，具体配置方法可参考官网 :[传送带](https://cloud.spring.io/spring-cloud-static/spring-cloud-gateway/2.1.0.RELEASE/multi/multi__gatewayfilter_factories.html)

**接口定义**

```java
public interface GatewayFilter extends ShortcutConfigurable {
	/**
	 * Name key.
	 */
	String NAME_KEY = "name";
	/**
	 * Value key.
	 */
	String VALUE_KEY = "value";
	Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain);
}
```

### 4.3、GatewayFilter对比GlobalFilter

前者接口定义中多了NAME_KEY和VALUE_KEY，原因是GatewayFilter是面向开发人员的，例如我们需要配置给path符合/test/**的请求添加header时，header是key-value形式，这时候就用到了

```java
spring:
  cloud:
    gateway:
      routes:
      - id: add_request_header_route
        uri: http://localhost:8080
        predicates:
        - Path=/test/**
        filters:
        - AddRequestHeader=NAME, test
```

```java
public class AddRequestHeaderGatewayFilterFactory
		extends AbstractNameValueGatewayFilterFactory {
	@Override
	public GatewayFilter apply(NameValueConfig config) {
		return (exchange, chain) -> {
		// 将要添加的key-value添加到上下文的header中
			ServerHttpRequest request = exchange.getRequest().mutate()
					.header(config.getName(), config.getValue()).build();
			return chain.filter(exchange.mutate().request(request).build());
		};
	}
}
```

### 4.4、应用

上述两种Filter作用不同，是在什么时候整合的？优先级如何处理？

每个Filter中都有一个Order属性，在执行时是在**FilteringWebHandler#handle方法**中对GlobalFilter和GatewayFilter进行的整合和排序，具体执行在**FilteringWebHandler#filter方法**

```java
/**
* 整合Filter 
*/
public Mono<Void> handle(ServerWebExchange exchange) {
		// 根据Route信息取出配置的GatewayFilter集合
		Route route = exchange.getRequiredAttribute(GATEWAY_ROUTE_ATTR);
		List<GatewayFilter> gatewayFilters = route.getFilters();
		// 取出globalFilters
		List<GatewayFilter> combined = new ArrayList<>(this.globalFilters);
		// 将GatewayFilter添加到combined
		combined.addAll(gatewayFilters);
		// combined根据Order排优先级
		AnnotationAwareOrderComparator.sort(combined);
		if (logger.isDebugEnabled()) {
			logger.debug("Sorted gatewayFilterFactories: " + combined);
		}
		return new DefaultGatewayFilterChain(combined).filter(exchange);
}
/**
* 执行Filter 
*/
public Mono<Void> filter(ServerWebExchange exchange) {
			return Mono.defer(() -> {
				if (this.index < filters.size()) {
					GatewayFilter filter = filters.get(this.index);
					DefaultGatewayFilterChain chain = new DefaultGatewayFilterChain(this,
							this.index + 1);
					return filter.filter(exchange, chain);
				}
				else {
					return Mono.empty(); // complete
				}
			});
}
```

执行过程中，可以看到排完优先级的Filter，其中红框圈出来的是我写的一个Demo，设置的一个GatewayFilter。

## 5、自定义Filter

### 5.1、自定义GlobalFilter

GlobalFilter具体的实现方式是实现接口，每个filter都实现了GlobalFilter接口

```java
public class GlobalTestFilter implements GlobalFilter, Ordered {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if("符合业务逻辑，处理完业务逻辑，继续执行下一个filter"){
            return chain.filter(exchange);
        }
        //不符合业务逻辑，直接返回
        return "按照不符合业务逻辑处理";
    }
}
```

### 5.2、自定义GatewayFilter

GatewayFilter具体的实现方式是工厂，每个工厂都继承了AbstractGatewayFilterFactory

```java
public class TestGatewayFilterFactory extends AbstractGatewayFilterFactory<TestGatewayFilterFactory.Config> {
    public TestGatewayFilterFactory() {
        super(TestGatewayFilterFactory.Config.class);
    }
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            if("符合条件，处理业务逻辑，继续执行下一个Filter"){
                return chain.filter(exchange);
            }
             // 不符合条件，直接返回
            return "false";
        };
    }
    public static class Config {
        private String businessAttributes;
        public String getBusinessAttributes() {
            return businessAttributes;
        }
        public void setBusinessAttributes(String businessAttributes) {
            this.businessAttributes = businessAttributes;
        }
    }
}
```

## 6、源码解析

### 6.1、网关启动阶段

①：yaml文件和GatewayProperties文件映射，映射处理源码在JavaBeanBinder.BeanProperty#getValue–>CollectionBinder#merge—>Binder#bindBean

②：加载Locator Bean,为后续读取RouteDefinition做准备【GatewayAutoConfiguration】,下述代码中的Locator就是本文的第二大节介绍的

```java
public class GatewayAutoConfiguration {
	@Bean
	@ConditionalOnMissingBean
	public PropertiesRouteDefinitionLocator propertiesRouteDefinitionLocator(
			GatewayProperties properties) {
		return new PropertiesRouteDefinitionLocator(properties);
	}
	@Bean
	@ConditionalOnMissingBean(RouteDefinitionRepository.class)
	public InMemoryRouteDefinitionRepository inMemoryRouteDefinitionRepository() {
		return new InMemoryRouteDefinitionRepository();
	}
	@Bean
	@Primary
	public RouteDefinitionLocator routeDefinitionLocator(
			List<RouteDefinitionLocator> routeDefinitionLocators) {
		return new CompositeRouteDefinitionLocator(
				Flux.fromIterable(routeDefinitionLocators));
	}
	@Bean
	@Primary
	// TODO: property to disable composite?
	public RouteLocator cachedCompositeRouteLocator(List<RouteLocator> routeLocators) {
		return new CachingRouteLocator(
				new CompositeRouteLocator(Flux.fromIterable(routeLocators)));
	}
}
```

③：初始化GlobalFilters【FilteringWebHandler】

```java
public class GatewayAutoConfiguration {
	@Bean
	public FilteringWebHandler filteringWebHandler(List<GlobalFilter> globalFilters) {
		return new FilteringWebHandler(globalFilters);
	}
}
```

```java
public class FilteringWebHandler implements WebHandler {
	private final List<GatewayFilter> globalFilters;
	//构造函数中设置globalFiltersglobalFilters
	public FilteringWebHandler(List<GlobalFilter> globalFilters) {
		this.globalFilters = loadFilters(globalFilters);
	}
	//设置globalFilters
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
}
```

④：初始化predicates，gatewayFilters，getRoutes【GatewayAutoConfiguration–>RouteDefinitionRouteLocator】

```java
public class RouteDefinitionRouteLocator
		implements RouteLocator, BeanFactoryAware, ApplicationEventPublisherAware {
	//构造函数中初始化
	public RouteDefinitionRouteLocator(RouteDefinitionLocator routeDefinitionLocator,
			List<RoutePredicateFactory> predicates,
			List<GatewayFilterFactory> gatewayFilterFactories,
			GatewayProperties gatewayProperties, ConversionService conversionService) {
		this.routeDefinitionLocator = routeDefinitionLocator;
		this.conversionService = conversionService;
		initFactories(predicates);
		gatewayFilterFactories.forEach(
				factory -> this.gatewayFilterFactories.put(factory.name(), factory));
		this.gatewayProperties = gatewayProperties;
	}
	//设置predicate工厂
	private void initFactories(List<RoutePredicateFactory> predicates) {
		predicates.forEach(factory -> {
			String key = factory.name();
			if (this.predicates.containsKey(key)) {
				this.logger.warn("A RoutePredicateFactory named " + key
						+ " already exists, class: " + this.predicates.get(key)
						+ ". It will be overwritten.");
			}
			this.predicates.put(key, factory);
			if (logger.isInfoEnabled()) {
				logger.info("Loaded RoutePredicateFactory [" + key + "]");
			}
		});
	}
	public Flux<Route> getRoutes() {
		//从RouteDefinitions转换为Route，转换过程在convertToRoute方法中实现
		return this.routeDefinitionLocator.getRouteDefinitions().map(this::convertToRoute)
				.map(route -> {
					if (logger.isDebugEnabled()) {
						logger.debug("RouteDefinition matched: " + route.getId());
					}
					return route;
				});
	}
	//RouteDefinition到Route的转换
	private Route convertToRoute(RouteDefinition routeDefinition) {
		//从routeDefinition获取predicate
		AsyncPredicate<ServerWebExchange> predicate = combinePredicates(routeDefinition);
		//从routeDefinition获取gatewayFilters
		List<GatewayFilter> gatewayFilters = getFilters(routeDefinition);
		//构造Route
		return Route.async(routeDefinition).asyncPredicate(predicate)
				.replaceFilters(gatewayFilters).build();
	}
	//获取GatewayFilters
	private List<GatewayFilter> getFilters(RouteDefinition routeDefinition) {
		List<GatewayFilter> filters = new ArrayList<>();
		//如果默认filter不为空，则去加载
		if (!this.gatewayProperties.getDefaultFilters().isEmpty()) {
			filters.addAll(loadGatewayFilters(DEFAULT_FILTERS,
					this.gatewayProperties.getDefaultFilters()));
		}
		//如果Filter不为空，则
		if (!routeDefinition.getFilters().isEmpty()) {
			filters.addAll(loadGatewayFilters(routeDefinition.getId(),
					routeDefinition.getFilters()));
		}
		AnnotationAwareOrderComparator.sort(filters);
		return filters;
	}
	@SuppressWarnings("unchecked")
	private List<GatewayFilter> loadGatewayFilters(String id,
			List<FilterDefinition> filterDefinitions) {
		List<GatewayFilter> filters = filterDefinitions.stream().map(definition -> {
			//从gatewayFilterFactories中根据key获取factory
			GatewayFilterFactory factory = this.gatewayFilterFactories
					.get(definition.getName());
			if (factory == null) {
				throw new IllegalArgumentException(
						"Unable to find GatewayFilterFactory with name "
								+ definition.getName());
			}
			//获取definition设置的Filter值
			Map<String, String> args = definition.getArgs();
			if (logger.isDebugEnabled()) {
				logger.debug("RouteDefinition " + id + " applying filter " + args + " to "
						+ definition.getName());
			}
			Map<String, Object> properties = factory.shortcutType().normalize(args,
					factory, this.parser, this.beanFactory);
			//每一个工厂中都有一个静态内部类Config，目的是存储我们设置的Filter值
			Object configuration = factory.newConfig();
			//将后几个参数的信息绑定到configuration
			ConfigurationUtils.bind(configuration, properties,
					factory.shortcutFieldPrefix(), definition.getName(), validator,
					conversionService);
			//获得GatewayFilter
			GatewayFilter gatewayFilter = factory.apply(configuration);
			if (this.publisher != null) {
				this.publisher.publishEvent(new FilterArgsEvent(this, id, properties));
			}
			return gatewayFilter;
		}).collect(Collectors.toList());
		ArrayList<GatewayFilter> ordered = new ArrayList<>(filters.size());
		for (int i = 0; i < filters.size(); i++) {
			GatewayFilter gatewayFilter = filters.get(i);
			if (gatewayFilter instanceof Ordered) {
				ordered.add(gatewayFilter);
			}
			else {
				ordered.add(new OrderedGatewayFilter(gatewayFilter, i + 1));
			}
		}
		return ordered;
	}
}
```

### 6.2、请求处理阶段

①ReactorHttpHandlerAdapter#apply方法是请求到网关执行的入口

```java
public class ReactorHttpHandlerAdapter implements BiFunction<HttpServerRequest, HttpServerResponse, Mono<Void>> {
	public Mono<Void> apply(HttpServerRequest reactorRequest, HttpServerResponse reactorResponse) {
		NettyDataBufferFactory bufferFactory = new NettyDataBufferFactory(reactorResponse.alloc());
		try {
			//获取请求的request和response
			ReactorServerHttpRequest request = new ReactorServerHttpRequest(reactorRequest, bufferFactory);
			ServerHttpResponse response = new ReactorServerHttpResponse(reactorResponse, bufferFactory);
			if (request.getMethod() == HttpMethod.HEAD) {
				response = new HttpHeadResponseDecorator(response);
			}
			//给到HttpWebHandlerAdapter执行构建
			return this.httpHandler.handle(request, response)
					.doOnError(ex -> logger.trace(request.getLogPrefix() + "Failed to complete: " + ex.getMessage()))
					.doOnSuccess(aVoid -> logger.trace(request.getLogPrefix() + "Handling completed"));
		}
		catch (URISyntaxException ex) {
			if (logger.isDebugEnabled()) {
				logger.debug("Failed to get request URI: " + ex.getMessage());
			}
			reactorResponse.status(HttpResponseStatus.BAD_REQUEST);
			return Mono.empty();
		}
	}
}
```

②HttpWebHandlerAdapter#handle构建网关上下文ServerWebExchange

```java
public class HttpWebHandlerAdapter extends WebHandlerDecorator implements HttpHandler {
	public Mono<Void> handle(ServerHttpRequest request, ServerHttpResponse response) {
		if (this.forwardedHeaderTransformer != null) {
			request = this.forwardedHeaderTransformer.apply(request);
		}
		//根据请求的request、response构建网关上下文
		ServerWebExchange exchange = createExchange(request, response);
		LogFormatUtils.traceDebug(logger, traceOn ->
				exchange.getLogPrefix() + formatRequest(exchange.getRequest()) +
						(traceOn ? ", headers=" + formatHeaders(exchange.getRequest().getHeaders()) : ""));
		return getDelegate().handle(exchange)
				.doOnSuccess(aVoid -> logResponse(exchange))
				.onErrorResume(ex -> handleUnresolvedError(exchange, ex))
				.then(Mono.defer(response::setComplete));
	}
}
```

③DispatcherHandler用于Http请求处理器/控制器的中央分发处理器，把请求分发给已经注册的处理程序处理，DispatcherHandler遍历Mapping获取对应的handler，网关一共有6个handlerMapping【此处会找到RoutePredicateHandlerMapping，通过RoutePredicateHandlerMapping获取FilteringWebHandler，通过FilteringWebHandler获取】

```java
public class DispatcherHandler implements WebHandler, ApplicationContextAware {
	public Mono<Void> handle(ServerWebExchange exchange) {
		if (this.handlerMappings == null) {
			return createNotFoundError();
		}
		//遍历mapping获取handler
		return Flux.fromIterable(this.handlerMappings)
				.concatMap(mapping -> mapping.getHandler(exchange))
				.next()
				.switchIfEmpty(createNotFoundError())
				.flatMap(handler -> invokeHandler(exchange, handler))
				.flatMap(result -> handleResult(exchange, result));
	}
}
```

```java
public class RoutePredicateHandlerMapping extends AbstractHandlerMapping {
	private final FilteringWebHandler webHandler;
	private final RouteLocator routeLocator;
	private final Integer managementPort;
	private final ManagementPortType managementPortType;
	//网关启动时进行了初始化
	public RoutePredicateHandlerMapping(FilteringWebHandler webHandler,
			RouteLocator routeLocator, GlobalCorsProperties globalCorsProperties,
			Environment environment) {
		this.webHandler = webHandler;
		this.routeLocator = routeLocator;
		this.managementPort = getPortProperty(environment, "management.server.");
		this.managementPortType = getManagementPortType(environment);
		setOrder(1);
		setCorsConfigurations(globalCorsProperties.getCorsConfigurations());
	}
	protected Mono<?> getHandlerInternal(ServerWebExchange exchange) {
		// don't handle requests on management port if set and different than server port
		if (this.managementPortType == DIFFERENT && this.managementPort != null
				&& exchange.getRequest().getURI().getPort() == this.managementPort) {
			return Mono.empty();
		}
		exchange.getAttributes().put(GATEWAY_HANDLER_MAPPER_ATTR, getSimpleName());
		return lookupRoute(exchange)
				// .log("route-predicate-handler-mapping", Level.FINER) //name this
				.flatMap((Function<Route, Mono<?>>) r -> {
					exchange.getAttributes().remove(GATEWAY_PREDICATE_ROUTE_ATTR);
					if (logger.isDebugEnabled()) {
						logger.debug(
								"Mapping [" + getExchangeDesc(exchange) + "] to " + r);
					}
					exchange.getAttributes().put(GATEWAY_ROUTE_ATTR, r);
					//返回FilteringWebHandler
					return Mono.just(webHandler);
				}).switchIfEmpty(Mono.empty().then(Mono.fromRunnable(() -> {
					exchange.getAttributes().remove(GATEWAY_PREDICATE_ROUTE_ATTR);
					if (logger.isTraceEnabled()) {
						logger.trace("No RouteDefinition found for ["
								+ getExchangeDesc(exchange) + "]");
					}
				})));
	}
}
```

④ RoutePredicateHandlerMapping#lookupRoute匹配路由，根据routeLocator获取我们在配置我文件中配置的Route，和当前请求的路由做匹配

```java
public class RoutePredicateHandlerMapping extends AbstractHandlerMapping {
	protected Mono<Route> lookupRoute(ServerWebExchange exchange) {
		//routeLocator获取我们在配置我文件中配置的Route
		return this.routeLocator.getRoutes()
				.concatMap(route -> Mono.just(route).filterWhen(r -> {
					exchange.getAttributes().put(GATEWAY_PREDICATE_ROUTE_ATTR, r.getId());
					//当前请求的路由做匹配
					return r.getPredicate().apply(exchange);
				})
						.doOnError(e -> logger.error(
								"Error applying predicate for route: " + route.getId(),
								e))
						.onErrorResume(e -> Mono.empty()))
				.next()
				.map(route -> {
					if (logger.isDebugEnabled()) {
						logger.debug("Route matched: " + route.getId());
					}
					validateRoute(route, exchange);
					return route;
				});
	}
}
```

⑤FilteringWebHandler创建过滤器链，执行过滤器

```java
public class FilteringWebHandler implements WebHandler {
	//创建过滤器链
	public Mono<Void> handle(ServerWebExchange exchange) {
		Route route = exchange.getRequiredAttribute(GATEWAY_ROUTE_ATTR);
		List<GatewayFilter> gatewayFilters = route.getFilters();
		List<GatewayFilter> combined = new ArrayList<>(this.globalFilters);
		combined.addAll(gatewayFilters);
		AnnotationAwareOrderComparator.sort(combined);
		if (logger.isDebugEnabled()) {
			logger.debug("Sorted gatewayFilterFactories: " + combined);
		}
		return new DefaultGatewayFilterChain(combined).filter(exchange);
	}
	private static class DefaultGatewayFilterChain implements GatewayFilterChain {
		//调用过滤器
		public Mono<Void> filter(ServerWebExchange exchange) {
			return Mono.defer(() -> {
				if (this.index < filters.size()) {
					GatewayFilter filter = filters.get(this.index);
					DefaultGatewayFilterChain chain = new DefaultGatewayFilterChain(this,
							this.index + 1);
					//执行调用
					return filter.filter(exchange, chain);
				}
				else {
					return Mono.empty(); // complete
				}
			});
		}
	}
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
