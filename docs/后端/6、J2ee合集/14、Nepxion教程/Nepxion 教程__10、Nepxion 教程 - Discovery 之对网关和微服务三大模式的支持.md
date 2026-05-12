# 10、Nepxion 教程 - Discovery 之对网关和微服务三大模式的支持
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/10.html
- 分类：J2EE框架
- 分组：Nepxion 教程
`Nepxion Discovery` 对于服务灰度发布参数支持：外置`Header`、 `Parameter`、`Cookie`、`域名`规则策略驱动。并且还内置本地和远程、局部和全局规则策略驱动。并且还支持正则表达式以及通配表达式支持。并且`Nepxion Discovery`支持`Spring Cloud Gateway`、`Zuul网关`和`微服务`三大模式的灰度发布和路由等一系列功能。 所以`Nepxion Discovery` 对于灰度发布的支持场景还是很丰富的，基本能够满足生产的大多数场景。关于`Nepxion Discovery`的策略博主准备分解成三篇文章来讲解：

- 配置中心对灰度的配置：包括初始化、对不同配置中心的适配以及配置中心策略变更的通知
- 服务灰度发布参数的支持：包含上面外置、内置规则策略驱动以及远程配置灰度参数的优先级
- 对网关和微服务三大模式的支持：包含不同模式对下游参数的传递以及如何进行负载均衡的

上面三个话题在之前的两篇文章中已经讨论过了，今天我们来讨论一下`Nepxion Discovery` 是如何支持支持`Spring Cloud Gateway`、`Zuul网关`和`微服务`三大模式的灰度发布参数传递以及如何在不同的模式中进行负载均衡的。`Nepxion Discovery` 认为对支持支持`Spring Cloud Gateway`、`Zuul网关`和`微服务`三大模式其实是一种插件策略，所以它把对它们的扩展机制都是添加到 `discovery-plugin-strategy` 里面。

```java
+ discovery-plugin-strategy
	└ discovery-plugin-strategy-starter                         【路由策略的Starter】
	└ discovery-plugin-strategy-starter-service                 【路由策略在微服务端的Starter】Starter】
	└ discovery-plugin-strategy-starter-zuul                    【路由策略在Zuul网关端的Starter】
	└ discovery-plugin-strategy-starter-gateway                 【路由策略在Spring Cloud Gateway网关端的Starter】
```

下面我们就来分别分析一下它是如何对不同模式的支持的吧。

## 1、Spring Cloud Gateway

要分析它是如何对 `Spring Cloud Gateway` 进行支持的，首先我们来看一下`discovery-plugin-strategy-starter-gateway` 这个模块。因为这个模块里面配置了 Spring Boot 的自动配置，毫无疑问我们就先来看一下里面的自动配置类。

在`discovery-plugin-strategy-starter-gateway/resources/META-INF/spring.factories` 我们可以看到如下配置：

> spring.factories

```java
org.springframework.boot.env.EnvironmentPostProcessor=\
com.nepxion.discovery.plugin.strategy.gateway.context.GatewayStrategyEnvironmentPostProcessor
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.nepxion.discovery.plugin.strategy.gateway.configuration.GatewayStrategyAutoConfiguration,\
com.nepxion.discovery.plugin.strategy.gateway.configuration.GatewayStrategyContextAutoConfiguration
```

熟悉Spring Boot 的同学应该都知道，`EnvironmentPostProcessor` 是环境处理类，它的功能是在 Spring Boot 在启动容器前就会进行环境做准备。而这个类的功能也特别简单，就是在系统变量里面添加当前系统(`spring.application.type`) 为 `gateway`。另外两个就是自动配置类：`GatewayStrategyAutoConfiguration` 与 `GatewayStrategyContextAutoConfiguration`。我们先来对这两个配置类进行分析一下，看里面配置了哪些组件。

> GatewayStrategyAutoConfiguration.java

```java
@Configuration
@AutoConfigureBefore(RibbonClientConfiguration.class)
@ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_CONTROL_ENABLED, matchIfMissing = true)
public class GatewayStrategyAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public GatewayStrategyRouteFilter gatewayStrategyRouteFilter() {
        return new DefaultGatewayStrategyRouteFilter();
    }
    @Bean
    @ConditionalOnMissingBean
    public GatewayStrategyClearFilter gatewayStrategyClearFilter() {
        return new DefaultGatewayStrategyClearFilter();
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_MONITOR_ENABLED, matchIfMissing = false)
    public GatewayStrategyMonitor gatewayStrategyMonitor() {
        return new DefaultGatewayStrategyMonitor();
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_HYSTRIX_THREADLOCAL_SUPPORTED, matchIfMissing = false)
    public GatewayStrategyCallableWrapper gatewayStrategyCallableWrapper() {
        return new DefaultGatewayStrategyCallableWrapper();
    }
    @Bean
    @ConditionalOnMissingBean
    public DiscoveryEnabledAdapter discoveryEnabledAdapter() {
        return new DefaultDiscoveryEnabledAdapter();
    }
}
```

- DefaultGatewayStrategyRouteFilter：Nepxion Discovery 实现 GlobalFilter 对 Spring Cloud Gateway 的进行扩展，同时实现自定义接口 StrategyRouteFilter 获取请求对象或者配置中心配置的灰度参数。与上一篇文章的 StrategyWrapper 是结合了起来，关于它的实现细节如果不清楚的同学可以看之前的博客 [Nepxion Discovery 之服务灰度发布参数的支持](/zhuanlan/j2ee/nepxion/1/9.html).
- DefaultGatewayStrategyClearFilter：Nepxion Discovery 实现 GlobalFilter 对 Spring Cloud Gateway 的进行扩展，主要是请求调用完成之后对一些资源的释放
- GatewayStrategyMonitor：Nepxion Discovery 对 Spring Cloud Gateway 监控的支持
- GatewayStrategyCallableWrapper：在进行远程 RPC 调用的时候，为了服务的扩展性会 Hystrix。使用线程隔离模式时，无法获取ThreadLocal中信息，Nepxion Discovery通过实现自定义并发策略StrategyCallableWrapper解决。
- DiscoveryEnabledAdapter：服务发现能力类，在灰度发布的时候会调用DiscoveryEnabledAdapter#apply方法进行服务实例灰度发布的选择。

> GatewayStrategyContextAutoConfiguration.java

```java
@Configuration
@AutoConfigureBefore(RibbonClientConfiguration.class)
public class GatewayStrategyContextAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public GatewayStrategyContextHolder gatewayStrategyContextHolder() {
        return new GatewayStrategyContextHolder();
    }
}
```

- GatewayStrategyContextHolder：里面有对外置参数通过 Header、Parameter以及HttpCookie 的支持。如果从外置参数里面获取不到还可以从 StrategyWrapper 里面配置的全局参数进行获取。

其实`Nepxion Discovery` 对于网关里面的参数最终是通过 `DefaultGatewayStrategyRouteFilter` 这个 Filter 的父类 `AbstractGatewayStrategyRouteFilter` 进行传递的。

`AbstractGatewayStrategyRouteFilter`在进行参数传递的时候可以通过参数来控制灰度参数的优先级：

- gatewayHeaderPriority：如果外界也传了相同的Header，例如，从Postman传递过来的Header，当下面的变量为true，以网关设置为优先，否则以外界传值为优先。可以通过环境变量:spring.application.strategy.gateway.header.priority 进行修改
- gatewayOriginalHeaderIgnored：当以网关设置为优先的时候，网关未配置Header，而外界配置了Header，仍旧忽略外界的Header，可以通过环境变量：spring.application.strategy.gateway.original.header.ignored 进行修改
- gatewayCoreHeaderTransmissionEnabled：Gateway上核心策略Header是否传递。当全局订阅启动时，可以关闭核心策略Header传递，这样可以节省传递数据的大小，一定程度上可以提升性能。核心策略Header，包含：1. n-d-version、2. n-d-region、3. n-d-address、4. n-d-version-weight、5. n-d-region-weight、6. n-d-id-blacklist、7. n-d-address-blacklist、8. n-d-env (不属于蓝绿灰度范畴的Header，只要外部传入就会全程传递)

在使用[DiscoveryGuide](https://github.com/Nepxion/DiscoveryGuide) 进行灰度框架试用的时候，我一直没有弄明白为什么需要在配置文件中配置 `nacos` 配置中心。直到我理解了 `Spring Cloud Gateway` 的负载均衡调用我才解开的这个谜团。

spring cloud gateway 如果需要进行负载均衡调用，那么就需要对 Filter 进行扩展。因为进行远程调用的时候是 `NettyRoutingFilter`。而 `Spring Cloud Gateway` 的接口调用处理的入口就是 `FilteringWebHandler`。我在搜索 `GlobalFilter` 的实现的时候找到了 `LoadBalancerClientFilter` 。

> LoadBalancerClientFilter.java

```java
public class LoadBalancerClientFilter implements GlobalFilter, Ordered {
	/**
	 * Filter order for {@link LoadBalancerClientFilter}.
	 */
	public static final int LOAD_BALANCER_CLIENT_FILTER_ORDER = 10100;
	private static final Log log = LogFactory.getLog(LoadBalancerClientFilter.class);
	protected final LoadBalancerClient loadBalancer;
	private LoadBalancerProperties properties;
	public LoadBalancerClientFilter(LoadBalancerClient loadBalancer,
			LoadBalancerProperties properties) {
		this.loadBalancer = loadBalancer;
		this.properties = properties;
	}
	@Override
	public int getOrder() {
		return LOAD_BALANCER_CLIENT_FILTER_ORDER;
	}
	@Override
	@SuppressWarnings("Duplicates")
	public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
		URI url = exchange.getAttribute(GATEWAY_REQUEST_URL_ATTR);
		String schemePrefix = exchange.getAttribute(GATEWAY_SCHEME_PREFIX_ATTR);
		if (url == null
				|| (!"lb".equals(url.getScheme()) && !"lb".equals(schemePrefix))) {
			return chain.filter(exchange);
		}
		// preserve the original url
		addOriginalRequestUrl(exchange, url);
		if (log.isTraceEnabled()) {
			log.trace("LoadBalancerClientFilter url before: " + url);
		}
		final ServiceInstance instance = choose(exchange);
		if (instance == null) {
			throw NotFoundException.create(properties.isUse404(),
					"Unable to find instance for " + url.getHost());
		}
		URI uri = exchange.getRequest().getURI();
		// if the lb:`<scheme>` mechanism was used, use `<scheme>` as the default,
		// if the loadbalancer doesn't provide one.
		String overrideScheme = instance.isSecure() ? "https" : "http";
		if (schemePrefix != null) {
			overrideScheme = url.getScheme();
		}
		URI requestUrl = loadBalancer.reconstructURI(
				new DelegatingServiceInstance(instance, overrideScheme), uri);
		if (log.isTraceEnabled()) {
			log.trace("LoadBalancerClientFilter url chosen: " + requestUrl);
		}
		exchange.getAttributes().put(GATEWAY_REQUEST_URL_ATTR, requestUrl);
		return chain.filter(exchange);
	}
	protected ServiceInstance choose(ServerWebExchange exchange) {
		return loadBalancer.choose(
				((URI) exchange.getAttribute(GATEWAY_REQUEST_URL_ATTR)).getHost());
	}
}
```

在这个Filter 里面找到了 `loadBalancer.reconstructURI` 调用，看来就是它了。但是我们里面的逻辑，如果要调用到负载均衡必须要满足 URI 的 `scheme` 或者 `exchange.getAttribute(GATEWAY_SCHEME_PREFIX_ATTR)` 的值都是 `lb`。我在使用 `Nepxion Discovery` 提供的网关调用的时候其实是 http 的，那么是什么地方完成对 `http` 转换成 `lb` 的呢?

我们可以看到它是通过 `exchange.getAttribute(GATEWAY_REQUEST_URL_ATTR)` 获取到的 URI。接着就找到了类 `RouteToRequestUrlFilter`.

> RouteToRequestUrlFilter.java

```java
public class RouteToRequestUrlFilter implements GlobalFilter, Ordered {
	/**
	 * Order of Route to URL.
	 */
	public static final int ROUTE_TO_URL_FILTER_ORDER = 10000;
	private static final Log log = LogFactory.getLog(RouteToRequestUrlFilter.class);
	private static final String SCHEME_REGEX = "[a-zA-Z]([a-zA-Z]|\\d|\\+|\\.|-)*:.*";
	static final Pattern schemePattern = Pattern.compile(SCHEME_REGEX);
	/* for testing */
	static boolean hasAnotherScheme(URI uri) {
		return schemePattern.matcher(uri.getSchemeSpecificPart()).matches()
				&& uri.getHost() == null && uri.getRawPath() == null;
	}
	@Override
	public int getOrder() {
		return ROUTE_TO_URL_FILTER_ORDER;
	}
	@Override
	public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
		Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
		if (route == null) {
			return chain.filter(exchange);
		}
		log.trace("RouteToRequestUrlFilter start");
		URI uri = exchange.getRequest().getURI();
		boolean encoded = containsEncodedParts(uri);
		URI routeUri = route.getUri();
		if (hasAnotherScheme(routeUri)) {
			// this is a special url, save scheme to special attribute
			// replace routeUri with schemeSpecificPart
			exchange.getAttributes().put(GATEWAY_SCHEME_PREFIX_ATTR,
					routeUri.getScheme());
			routeUri = URI.create(routeUri.getSchemeSpecificPart());
		}
		if ("lb".equalsIgnoreCase(routeUri.getScheme()) && routeUri.getHost() == null) {
			// Load balanced URIs should always have a host. If the host is null it is
			// most
			// likely because the host name was invalid (for example included an
			// underscore)
			throw new IllegalStateException("Invalid host: " + routeUri.toString());
		}
		URI mergedUrl = UriComponentsBuilder.fromUri(uri)
				// .uri(routeUri)
				.scheme(routeUri.getScheme()).host(routeUri.getHost())
				.port(routeUri.getPort()).build(encoded).toUri();
		exchange.getAttributes().put(GATEWAY_REQUEST_URL_ATTR, mergedUrl);
		return chain.filter(exchange);
	}
}
```

在这个类里面我们可以看到它对我们的 URI 进行了改写，从路由(Route)里面获取到域名端口进行 URI 重写。那么这个路由又是哪里来的呢？从配置文件来看并没有进行 Spring Cloud Gateway 路由的配置。但是 Spring Cloud Gateway 的路由都是通过 `RouteDefinitionLocator` 进行加载的。我们来看一下它的实现类。

看到它的实现类我们就很明白了，它是通过 `DiscoveryClientRouteDefinitionLocator` 这个类通过配置中心来加载路由，这里也就解释了为什么需要在网关配置注册中心。而 `DiscoveryLocatorProperties` 属性 `String urlExpression = "'lb://'+serviceId"` 。会把服务实例信息转换成 URI 为 `lb:serviceId` 的 Route(路由)。

```java
public class DiscoveryClientRouteDefinitionLocator implements RouteDefinitionLocator {
	public DiscoveryClientRouteDefinitionLocator(ReactiveDiscoveryClient discoveryClient,
			DiscoveryLocatorProperties properties) {
		this(discoveryClient.getClass().getSimpleName(), properties);
		serviceInstances = discoveryClient.getServices()
				.flatMap(service -> discoveryClient.getInstances(service).collectList());
	}
	......
}
```

首先我们把 Spring Cloud 实现负载均衡的整个过程总结一下：

- 启动使用 [DiscoveryGuide](https://github.com/Nepxion/DiscoveryGuide) 进行灰度框架试用项目的时候，GatewayDiscoveryClientAutoConfiguration 自动配置初始化的时候会对 DiscoveryClientRouteDefinitionLocator 进行初始化，然后就会加载配置中心中的服务实例信息列表。根据服务实例信息列表会构建
- 在进行 Gateway 网关调用示例，调用 http://localhost:5001/discovery-guide-service-a/invoke/gateway 时，会进行根据 discovery-guide-service-a进行路由选择，选择由 DiscoveryClient 从注册中心获取到的服务列表中的 discovery-guide-service-a 构建的路由(lb:discovery-guide-service-a)。
- 然后RouteToRequestUrlFilter 过滤器会把请求原路径 http://localhost:5001/discovery-guide-service-a/invoke/gateway 修改为：lb://discovery-guide-service-a/invoke/gateway.
- 最后在 LoadBalancerClientFilter 调用负载均衡在注册中收选择一个合适的discovery-guide-service-a服务实例，并通过 LoadBalancerClient#reconstructURI 渲染地址，比如把：lb://discovery-guide-service-a/invoke/gateway 修改为: http//172.20.10.2:3001/invoke/gateway 完成在网关的负载均衡调用。

## 2、Zuul

同样的要分析 `Nepxion Discovery` 是如何对 `Zuul` 进行支持的，首先我们来看一下`discovery-plugin-strategy-starter-zuul` 这个模块。因为这个模块里面配置了 Spring Boot 的自动配置，毫无疑问我们就先来看一下里面的自动配置类。

在`discovery-plugin-strategy-starter-zuul/resources/META-INF/spring.factories` 我们可以看到如下配置：

> spring.factories

```java
org.springframework.boot.env.EnvironmentPostProcessor=\
com.nepxion.discovery.plugin.strategy.zuul.context.ZuulStrategyEnvironmentPostProcessor
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.nepxion.discovery.plugin.strategy.zuul.configuration.ZuulStrategyAutoConfiguration,\
com.nepxion.discovery.plugin.strategy.zuul.configuration.ZuulStrategyContextAutoConfiguration
```

`EnvironmentPostProcessor` 是环境处理类，它的功能是在 Spring Boot 在启动容器前就会进行环境做准备。而`ZuulStrategyEnvironmentPostProcessor` 这个类的功能也特别简单，就是在系统变量里面添加当前系统(`spring.application.type`) 为 `gateway`。另外两个就是自动配置类：`ZuulStrategyAutoConfiguration` 与 `ZuulStrategyContextAutoConfiguration`。我们先来对这两个配置类进行分析一下，看里面配置了哪些组件。

> ZuulStrategyAutoConfiguration.java

```java
@Configuration
@AutoConfigureBefore(RibbonClientConfiguration.class)
@ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_CONTROL_ENABLED, matchIfMissing = true)
public class ZuulStrategyAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public ZuulStrategyRouteFilter zuulStrategyRouteFilter() {
        return new DefaultZuulStrategyRouteFilter();
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_MONITOR_ENABLED, matchIfMissing = false) // 只用于调用链
    public ZuulStrategyClearFilter zuulStrategyClearFilter() {
        return new DefaultZuulStrategyClearFilter();
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_MONITOR_ENABLED, matchIfMissing = false)
    public ZuulStrategyMonitor zuulStrategyMonitor() {
        return new DefaultZuulStrategyMonitor();
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_HYSTRIX_THREADLOCAL_SUPPORTED, matchIfMissing = false)
    public ZuulStrategyCallableWrapper zuulStrategyCallableWrapper() {
        return new DefaultZuulStrategyCallableWrapper();
    }
    @Bean
    @ConditionalOnMissingBean
    public DiscoveryEnabledAdapter discoveryEnabledAdapter() {
        return new DefaultDiscoveryEnabledAdapter();
    }
}
```

- DefaultZuulStrategyRouteFilter：Nepxion Discovery 实现 ZuulFilter 对 Zuul 的进行扩展，同时实现自定义接口 StrategyRouteFilter 获取请求对象或者配置中心配置的灰度参数。
- DefaultZuulStrategyClearFilter：Nepxion Discovery 实现 ZuulFilter 对 Zuul 的进行扩展，主要是请求调用完成之后对一些资源的释放
- DefaultZuulStrategyMonitor：Nepxion Discovery 对 Zuul 监控的支持
- DefaultZuulStrategyCallableWrapper：在进行远程 RPC 调用的时候，为了服务的扩展性会 Hystrix。使用线程隔离模式时，无法获取ThreadLocal中信息，Nepxion Discovery通过实现自定义并发策略StrategyCallableWrapper解决。
- DiscoveryEnabledAdapter：服务发现能力类，在灰度发布的时候会调用DiscoveryEnabledAdapter#apply方法进行服务实例灰度发布的选择。

```java
@Configuration
@AutoConfigureBefore(RibbonClientConfiguration.class)
public class ZuulStrategyContextAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public ZuulStrategyContextHolder zuulStrategyContextHolder() {
        return new ZuulStrategyContextHolder();
    }
}
```

- GatewayStrategyContextHolder：里面有对外置参数通过 Header、Parameter以及HttpCookie 的支持。如果从外置参数里面获取不到还可以从 StrategyWrapper 里面配置的全局参数进行获取。

Zuul 在进行网关参数传递的时候是通过 `DefaultZuulStrategyRouteFilter` 的父类 `AbstractZuulStrategyRouteFilter` 进行传递的，思路和 Spring Cloud 参数传递类似，这里就不赘述了。下面我们来看一下是 Zuul 网关是如何进行负载均衡的。

同样的要扩展 Zuul ，我们应该去找 ZuulFilter 的实现，这样我们就找到了 RibbonRoutingFilter。服务要进行调用的时候会调用 RibbonRoutingFilter#run。我们看一下这个方法里面的实现。

- 首先通过调用地址：http://localhost:5002/discovery-guide-service-a/invoke/zuul获致到服务 ID discovery-guide-service-a/以及 header、请求等信息参数构建RibbonCommandContext。
- 通过 HttpClientRibbonCommandFactory 传入参数 RibbonCommandContext创建 HttpClientRibbonCommand，并且 HttpClientRibbonCommand 对象持有 RibbonLoadBalancingHttpClient 这个负载均衡器。
- 最终会调用到AbstractLoadBalancerAwareClient#executeWithLoadBalancer 完成整个 Zuul 网关的负载均衡调用。

## 3、Service

同样的首先我们来看一下`discovery-plugin-strategy-starter-service` 这个模块。因为这个模块里面配置了 Spring Boot 的自动配置，毫无疑问我们就先来看一下里面的自动配置类。

在`discovery-plugin-strategy-starter-service/resources/META-INF/spring.factories` 我们可以看到如下配置：

> spring.factories

```java
org.springframework.boot.env.EnvironmentPostProcessor=\
com.nepxion.discovery.plugin.strategy.service.context.ServiceStrategyEnvironmentPostProcessor
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.nepxion.discovery.plugin.strategy.service.configuration.ServiceStrategyAutoConfiguration,\
com.nepxion.discovery.plugin.strategy.service.configuration.ServiceStrategyContextAutoConfiguration
```

`EnvironmentPostProcessor` 是环境处理类，它的功能是在 Spring Boot 在启动容器前就会进行环境做准备。而`ServiceStrategyEnvironmentPostProcessor` 这个类的功能也特别简单，就是在系统变量里面添加当前系统(`spring.application.type`) 为 `service`。另外两个就是自动配置类：`ServiceStrategyAutoConfiguration` 与 `ServiceStrategyContextAutoConfiguration`。我们先来对这两个配置类进行分析一下，看里面配置了哪些组件。

> ServiceStrategyAutoConfiguration.java

```java
@Configuration
@AutoConfigureBefore(RibbonClientConfiguration.class)
@ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_CONTROL_ENABLED, matchIfMissing = true)
public class ServiceStrategyAutoConfiguration {
    @Autowired
    private ConfigurableEnvironment environment;
    @Bean
    @ConditionalOnProperty(value = ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_RPC_INTERCEPT_ENABLED, matchIfMissing = false)
    public RpcStrategyAutoScanProxy rpcStrategyAutoScanProxy() {
        String scanPackages = environment.getProperty(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES);
        if (StringUtils.isEmpty(scanPackages)) {
            throw new DiscoveryException(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'s value can't be empty");
        }
        if (scanPackages.contains(DiscoveryConstant.ENDPOINT_SCAN_PACKAGES)) {
            throw new DiscoveryException("It can't scan packages for '" + DiscoveryConstant.ENDPOINT_SCAN_PACKAGES + "', please check '" + ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'");
        }
        return new RpcStrategyAutoScanProxy(scanPackages);
    }
    @Bean
    @ConditionalOnProperty(value = ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_RPC_INTERCEPT_ENABLED, matchIfMissing = false)
    public RpcStrategyInterceptor rpcStrategyInterceptor() {
        String scanPackages = environment.getProperty(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES);
        if (StringUtils.isEmpty(scanPackages)) {
            throw new DiscoveryException(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'s value can't be empty");
        }
        if (scanPackages.contains(DiscoveryConstant.ENDPOINT_SCAN_PACKAGES)) {
            throw new DiscoveryException("It can't scan packages for '" + DiscoveryConstant.ENDPOINT_SCAN_PACKAGES + "', please check '" + ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'");
        }
        return new RpcStrategyInterceptor();
    }
    @Bean
    @ConditionalOnProperty(value = ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_REST_INTERCEPT_ENABLED, matchIfMissing = true)
    public FeignStrategyInterceptor feignStrategyInterceptor() {
        String contextRequestHeaders = environment.getProperty(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_CONTEXT_REQUEST_HEADERS);
        String businessRequestHeaders = environment.getProperty(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_BUSINESS_REQUEST_HEADERS);
        return new FeignStrategyInterceptor(contextRequestHeaders, businessRequestHeaders);
    }
    @Bean
    @ConditionalOnProperty(value = ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_REST_INTERCEPT_ENABLED, matchIfMissing = true)
    public RestTemplateStrategyInterceptor restTemplateStrategyInterceptor() {
        String contextRequestHeaders = environment.getProperty(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_CONTEXT_REQUEST_HEADERS);
        String businessRequestHeaders = environment.getProperty(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_BUSINESS_REQUEST_HEADERS);
        return new RestTemplateStrategyInterceptor(contextRequestHeaders, businessRequestHeaders);
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_REST_INTERCEPT_ENABLED, matchIfMissing = true)
    public RestTemplateStrategyBeanPostProcessor restTemplateStrategyBeanPostProcessor() {
        return new RestTemplateStrategyBeanPostProcessor();
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_REST_INTERCEPT_ENABLED, matchIfMissing = true)
    public DiscoveryEnabledAdapter discoveryEnabledAdapter() {
        return new DefaultDiscoveryEnabledAdapter();
    }
    @Bean
    @ConditionalOnMissingBean
    public ServiceStrategyRouteFilter serviceStrategyRouteFilter() {
        return new DefaultServiceStrategyRouteFilter();
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_MONITOR_ENABLED, matchIfMissing = false)
    public ServiceStrategyMonitor serviceStrategyMonitor() {
        return new DefaultServiceStrategyMonitor();
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_PROVIDER_ISOLATION_ENABLED, matchIfMissing = false)
    public ProviderIsolationStrategyAutoScanProxy providerIsolationStrategyAutoScanProxy() {
        String scanPackages = environment.getProperty(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES);
        if (StringUtils.isEmpty(scanPackages)) {
            throw new DiscoveryException(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'s value can't be empty");
        }
        if (scanPackages.contains(DiscoveryConstant.ENDPOINT_SCAN_PACKAGES)) {
            throw new DiscoveryException("It can't scan packages for '" + DiscoveryConstant.ENDPOINT_SCAN_PACKAGES + "', please check '" + ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'");
        }
        return new ProviderIsolationStrategyAutoScanProxy(scanPackages);
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_PROVIDER_ISOLATION_ENABLED, matchIfMissing = false)
    public ProviderIsolationStrategyInterceptor providerIsolationStrategyInterceptor() {
        String scanPackages = environment.getProperty(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES);
        if (StringUtils.isEmpty(scanPackages)) {
            throw new DiscoveryException(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'s value can't be empty");
        }
        if (scanPackages.contains(DiscoveryConstant.ENDPOINT_SCAN_PACKAGES)) {
            throw new DiscoveryException("It can't scan packages for '" + DiscoveryConstant.ENDPOINT_SCAN_PACKAGES + "', please check '" + ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'");
        }
        return new ProviderIsolationStrategyInterceptor();
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_MONITOR_ENABLED, matchIfMissing = false)
    public ServiceStrategyMonitorAutoScanProxy serviceStrategyMonitorAutoScanProxy() {
        String scanPackages = environment.getProperty(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES);
        if (StringUtils.isEmpty(scanPackages)) {
            throw new DiscoveryException(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'s value can't be empty");
        }
        if (scanPackages.contains(DiscoveryConstant.ENDPOINT_SCAN_PACKAGES)) {
            throw new DiscoveryException("It can't scan packages for '" + DiscoveryConstant.ENDPOINT_SCAN_PACKAGES + "', please check '" + ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'");
        }
        return new ServiceStrategyMonitorAutoScanProxy(scanPackages.endsWith(DiscoveryConstant.SEPARATE) ? (scanPackages + DiscoveryConstant.ENDPOINT_SCAN_PACKAGES) : (scanPackages + DiscoveryConstant.SEPARATE + DiscoveryConstant.ENDPOINT_SCAN_PACKAGES));
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_MONITOR_ENABLED, matchIfMissing = false)
    public ServiceStrategyMonitorInterceptor serviceStrategyMonitorInterceptor() {
        String scanPackages = environment.getProperty(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES);
        if (StringUtils.isEmpty(scanPackages)) {
            throw new DiscoveryException(ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'s value can't be empty");
        }
        if (scanPackages.contains(DiscoveryConstant.ENDPOINT_SCAN_PACKAGES)) {
            throw new DiscoveryException("It can't scan packages for '" + DiscoveryConstant.ENDPOINT_SCAN_PACKAGES + "', please check '" + ServiceStrategyConstant.SPRING_APPLICATION_STRATEGY_SCAN_PACKAGES + "'");
        }
        return new ServiceStrategyMonitorInterceptor();
    }
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(value = StrategyConstant.SPRING_APPLICATION_STRATEGY_HYSTRIX_THREADLOCAL_SUPPORTED, matchIfMissing = false)
    public ServiceStrategyCallableWrapper serviceStrategyCallableWrapper() {
        return new DefaultServiceStrategyCallableWrapper();
    }
}
```

- RpcStrategyAutoScanProxy：RPC 调用策略类，添加 RpcStrategyInterceptor 增强类，添加调用的 Class、 方法名以及请求参数。增强类上添加了 RestController 或者 ServiceStrategy
- RpcStrategyInterceptor：RPC 调用增强类，添加调用的 Class、 方法名以及请求参数。增强类上添加了 RestController 或者 ServiceStrategy。
- FeignStrategyInterceptor：实现接口 RequestInterceptor 完成对 Feign 调用的增强，把灰度参数传递下流服务完成整个调用链的灰度调用。实现逻辑与之前网关的类似。
- RestTemplateStrategyInterceptor：实现 ClientHttpRequestInterceptor 接口完成对 RestTemplate 的增强，把灰度参数传递下流服务完成整个调用链的灰度调用。实现逻辑与之前网关的类似。
- RestTemplateStrategyBeanPostProcessor：实现 BeanPostProcessor ，对 RestTemplate 类型的 Spring Bean 进行增强，把 RestTemplateStrategyInterceptor添加到 RestTemplate 类型的 Spring bean 的拦截器链中。
- DiscoveryEnabledAdapter：服务发现能力类，在灰度发布的时候会调用DiscoveryEnabledAdapter#apply方法进行服务实例灰度发布的选择。
- DefaultServiceStrategyRouteFilter：实现OncePerRequestFilter，对 Spring MVC 项目进行增强，把灰度参数传递下流服务完成整个调用链的灰度调用。实现逻辑与之前网关的类似。
- DefaultServiceStrategyMonitor：服务监控类
- ProviderIsolationStrategyAutoScanProxy：对 Isolation 服务的支持
- ServiceStrategyCallableWrapper：在进行远程 RPC 调用的时候，为了服务的扩展性会 Hystrix。使用线程隔离模式时，无法获取ThreadLocal中信息，Nepxion Discovery通过实现自定义并发策略

> ServiceStrategyContextAutoConfiguration.java

```java
@Configuration
@AutoConfigureBefore(RibbonClientConfiguration.class)
public class ServiceStrategyContextAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public ServiceStrategyContextHolder serviceStrategyContextHolder() {
        return new ServiceStrategyContextHolder();
    }
}
```

- ServiceStrategyContextHolder：里面有对外置参数通过 Header、Parameter以及HttpCookie 的支持。如果从外置参数里面获取不到还可以从 StrategyWrapper 里面配置的全局参数进行获取。

其实上面对依赖的分析已经说明了 Service 服务是如何进行向下参数传递以及进行负载均衡的，如果大家还是不太清楚可以查询之前的博客：[Nepxion Discovery 之 Spring Cloud 负载均衡处理](/zhuanlan/j2ee/nepxion/1/6.html)。

好了，上面就完成了对 `Nepxion Discovery` 对网关和微服务三大模式的支持。`Nepxion Discovery` 是以插件化的思想支持`Spring Cloud Gateway`、`Zuul网关`和`微服务`三大模式的灰度发布和路由。
