# 05、SpringCloud Gateway 执行流程
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/5.html
- 分类：API网关
- 分组：SpringCloud Gateway
版本：2.2.9.RELEASE

## 1、基本介绍与简单使用

网关是整个微服务 API 请求的入口，负责拦截所有请求，分发到服务上去。可以实现**日志拦截、权限控制、解决跨域问题、限流、熔断、负载均衡，隐藏服务端的ip，黑名单与白名单拦截、授权**等，常用的网关有 Zuul （netflix 已经停更）和 SpringCloud Gateway。SpringCloud Gateway是一个全新的项目，其基于 Spring5.0 以及 SpringBoot2.0 和 [Webflux](https://docs.spring.io/spring-framework/docs/current/reference/html/web-reactive.html) 等技术开发的网关，其主要的目的是为微服务架构提供一种简单有效的API路由管理方式。

**名词解释**

官方：

- **Route**: 组成网关的最基本模块，由路由 ID（确保唯一）、目标 URI、predicates 与 filters 集合组成，如果 predicate 为 true，则表示路由匹配，并访问目标 URI。
- **Predicate**: 这是一个 Java 8 的 Predicate，入参为 Spring 框架的 ServerWebExchange，可以使用它来匹配来自 HTTP 请求的任何内容，例如 headers 或参数。
- **Filter**: GatewayFilter 的实例，可以在发送下游请求之前或之后修改请求和响应。

**白话：**

元素
概念
作用

Route
网关的基本组成，由路由id（唯一）以及一系列的断言与过滤器组成
根据断言转发到对应的 uri 上，支持注册中心

Predicate
断言目前 SpringCloud Gateway 支持多种方式，常见如：Path、Query、Method、Header等，写法必须遵循 key=vlue的形式
路由转发的判断条件

Filter
过滤器是路由转发请求时所经过的过滤逻辑
可用于修改请求、响应内容；如 日志记录获取请求与响应内容

**Example application.yml**

```sh
spring:
  cloud:
    gateway:
      routes:
      - id: reform-pinoint
        uri: lb://reform-pinpoint
        predicates:
        - Path=/app/pinpoint/**
        filters:
        - RewritePath=/app/pinpoint/(?<remaining>.*), /${
       remaining}
```

上面配置的意思是当访问 http://localhost:18000/app/pinpoint/login 时，会被路由到 reform-pinpoint 服务的 login 接口。filters 配置了一个重写路径的方法，将原本访问 http://localhost:18000/app/pinpoint/login 的 URL 修改为 http://localhost:18000/login，否则如果 reform-pinpoint 没有 /app/pinpoint/login 这个 URI 时将会出现 404。

上面的配置有一点其实是有错误的，在 yml 文档中 $ 要写成 $\ ，因此 ${remaining} 应该改为 $\ {remaining}

更多配置请参考：[Gateway Config](https://docs.spring.io/spring-cloud-gateway/docs/2.2.9.RELEASE/reference/html/#shortcut-configuration)

## 2、整体流程

**1、** 请求处理流程UML图；

从 UML 图可以看得出来 gateway 使用了与 Spring Mvc 类似的处理逻辑，即适配器模式；先从 Mapping 中匹配到适配器，然后使用适配器调用 handler。

**1、** 官网流程图；

**2、** 针对路由的UML时序图；

整体流程是：

- 请求从 DispatcherHandler 进来
- 循环遍历所有的 HandlerMapping 并找到合适的 Handler（可能有多个）
- 遍历所有的适配器 Adapter，找到能够支持执行 Handler 的适配器
- 通过适配器 Adapter 去执行 Handler

## 3、Talk is cheap. Show me the code

```java
@Override
public Mono<Void> handle(ServerWebExchange exchange) {
    if (this.handlerMappings == null) {
        return createNotFoundError();
    }
    // 遍历所有 HandlerMapping 并找到处理器适配器，再执行 handler
    return Flux.fromIterable(this.handlerMappings)
        .concatMap(mapping -> mapping.getHandler(exchange))
        .next()
        .switchIfEmpty(createNotFoundError())
        .flatMap(handler -> invokeHandler(exchange, handler))
        .flatMap(result -> handleResult(exchange, result));
}
```

对于最后执行的过滤链，简单分析下会走哪些过滤器，从 FilteringWebHandler 的 handler 方法可以得知过滤器的流程：

```java
@Override
public Mono<Void> handle(ServerWebExchange exchange) {
    // 获取路由，该 Route 会在 lookupRoute() 完成后 put 到 attributes
    Route route = exchange.getRequiredAttribute(GATEWAY_ROUTE_ATTR);
    // 拿到所有的 GatewayFilter 实现类
    List<GatewayFilter> gatewayFilters = route.getFilters();
    // 添加所有的 GlobalFilter，在源码的构造方法已将 GlobalFilter 转为 GatewayFilter 类型
    List<GatewayFilter> combined = new ArrayList<>(this.globalFilters);
    // 此处可以得知，是先执行 GlobalFilter 再执行 GatewayFilter
    combined.addAll(gatewayFilters);
    // 此方法根据 order 进行升序排序，因此 order 的值越小越先执行；对于 order 值相同的则按文件名排序
    // 因为扫描 bean 的时候是按文件顺序扫描的
    AnnotationAwareOrderComparator.sort(combined);
    if (logger.isDebugEnabled()) {
        logger.debug("Sorted gatewayFilterFactories: " + combined);
    }
	// 执行过滤器
    return new DefaultGatewayFilterChain(combined).filter(exchange);
}
```

过滤器的执行过程与 servlet 的过滤器逻辑一致，都是靠回调拿到过滤链的下一个过滤器，源码如下：

```java
@Override
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

## 4、下面针对时序图中的 lookupRoute 源码进行分析：

路由的设计采用的是一种委托模式，可以理解为责任链模式。最顶层的接口为 **RouteLocator** ，调用的入口为 CachingRouteLocator，依次经过的链路如下：（思考为何入口为 CachingRouteLocator ？）

```java
CachingRouteLocator -> CompositeRouteLocator -> RouteDefinitionRouteLocator
```

为何入口为 CachingRouteLocator ？从 GatewayAutoConfiguration.java 源码可以知道：

```java
@Bean
// 在注入所有的 RouteLocator 后，添加了 @Primary 注解，意味着在 lookupRoute 方法中使用的 bean 实现类就是 CachingRouteLocator 
@Primary
public RouteLocator cachedCompositeRouteLocator(List<RouteLocator> routeLocators) {
    return new CachingRouteLocator(
        new CompositeRouteLocator(Flux.fromIterable(routeLocators)));
}
```

源码中构建责任链的代码如下（GatewayAutoConfiguration.java）：

```java
@Bean
@Primary // 注意此处
@ConditionalOnMissingBean(name = "cachedCompositeRouteLocator")
public RouteLocator cachedCompositeRouteLocator(List<RouteLocator> routeLocators) {
    return new CachingRouteLocator(
        new CompositeRouteLocator(Flux.fromIterable(routeLocators)));
}
```

假如缓存（CachingRouteLocator）中的路由信息被清除，则会调用*下一级*的 CompositeRouteLocator 负责合并多个实现类的路由，再走到*下一级* RouteDefinitionRouteLocator；而 RouteDefinitionRouteLocator 需要查找路由，则需要依赖真正能够查询路由的接口 **RouteDefinitionLocator** 来查询（路由数据源可以是配置文件、数据库、注册中心等）。 **RouteDefinitionLocator** 接口的实现类这里不展开讲，其实际与 **RouteLocator** 的处理类似。

## 5、CachingRouteLocator 缓存何时失效？

通过跟踪 org.springframework.cloud.gateway.route.RouteDefinitionLocator#getRouteDefinitions 的调用栈信息，能够找到有一个用来刷新路由的监听器， 在 onApplicationEvent 方法中有看到路由有监听心跳事件 HeartbeatEvent，调用该事件里面的 resetIfNeeded 将会把缓存中的路由清空（在哪里清空？请自行查看监听 RefreshRoutesEvent 事件的类），那么心跳事件是如何产生的呢？

```java
public class RouteRefreshListener implements ApplicationListener<ApplicationEvent> {
	// 略...
	@Override
	public void onApplicationEvent(ApplicationEvent event) {
		if (event instanceof ContextRefreshedEvent
				|| event instanceof RefreshScopeRefreshedEvent
				|| event instanceof InstanceRegisteredEvent) {
			reset();
		}
		else if (event instanceof ParentHeartbeatEvent) {
			ParentHeartbeatEvent e = (ParentHeartbeatEvent) event;
			resetIfNeeded(e.getValue());
		}
        // 监听路由心跳
		else if (event instanceof HeartbeatEvent) {
			HeartbeatEvent e = (HeartbeatEvent) event;
			resetIfNeeded(e.getValue());
		}
	}
    /**
	 * 如果更新值成功，则清空路由
	 *
	 * @param value
	 */
    private void resetIfNeeded(Object value) {
		if (this.monitor.update(value)) {
			reset();
		}
	}
    /**
	 * 此方法会清空缓存的路由
	 */
	private void reset() {
		this.publisher.publishEvent(new RefreshRoutesEvent(this));
	}
	// 略...
}
```

在 org.springframework.cloud.gateway.route.RouteRefreshListener#onApplicationEvent 此方法的路由事件处打上断点，跟踪它的调用栈信息；我们很容易就能找到 NacosWatch 类，可以看到该类会新建一个定时的线程，负责调用所有监听 HeartbeatEvent 事件的方法。那么这个心跳的间隔是多少呢？

```java
public class NacosWatch implements ApplicationEventPublisherAware, SmartLifecycle {
	// 略...
	private final TaskScheduler taskScheduler;
	@Override
	public void start() {
		if (this.running.compareAndSet(false, true)) {
			this.watchFuture = this.taskScheduler.scheduleWithFixedDelay(
					this::nacosServicesWatch, this.properties.getWatchDelay());
		}
	}
    public void nacosServicesWatch() {
		// nacos doesn't support watch now , publish an event every 30 seconds.
		this.publisher.publishEvent(
				new HeartbeatEvent(this, nacosWatchIndex.getAndIncrement()));
	}
    // 略...
}
```

鼠标左键点进去 this.properties.getWatchDelay() 就能看到 NacosDiscoveryProperties 配置类，如果不作特别的配置的话，他默认取的就是 30 秒发送一次心跳事件

```java
@ConfigurationProperties("spring.cloud.nacos.discovery")
public class NacosDiscoveryProperties {
    // 略...
	/**
	 * watch delay,duration to pull new service from nacos server.
	 */
	private long watchDelay = 30000;
    // 略...
}
```

## 6、总结

简单介绍了 Spring Cloud Gateway 的作用、组成单元以及断言匹配跟过滤器重写路径的实例，所有支持配置的 Filter 以及 Predicate 都有 Spring 自带的一系列 Factory 实现；从源码的角度分析了 GateWay 处理请求的流程与动态路由获取刷新的逻辑。

参考链接：[https://www.cnblogs.com/crazymakercircle/p/11704077.html](https://www.cnblogs.com/crazymakercircle/p/11704077.html)

https://docs.spring.io/spring-cloud-gateway/docs/2.2.9.RELEASE/reference/html/

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
