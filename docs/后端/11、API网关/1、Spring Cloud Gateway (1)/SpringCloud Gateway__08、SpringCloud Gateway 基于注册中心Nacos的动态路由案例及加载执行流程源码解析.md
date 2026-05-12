# 08、SpringCloud Gateway 基于注册中心Nacos的动态路由案例及加载执行流程源码解析
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/24.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 前言

在之前的案例中，我们的路由都是写在配置文件中的，在微服务架构中，后台有很多个，如果每一个都需要配置，那么肯定是不现实的，所以Spring Cloud Gateway提供了基于注册中心服务发现机制的动态路由。

Spring Cloud Gateway支持与Eureka、Nacos、Consul等整合开发，根据service ld自动从注册中心获取服务地址并转发请求，这样做的好处不仅可以通过单个端点来访问应用的所有服务，而且在添加或移除服务实例时不用修改Gateway的路由配置。

## 实现案例

### 1. 引入Nacos

参照这个文档[Nacos系列(3)-SpringCloud集成Nacos](https://blog.csdn.net/qq_43437874/article/details/107852072)，网关及后台服务都注册到Nacos中。

如果spring cloud 采用2020 版本，需要引入loadbalancer 依赖。

```xml
 <dependency>
     <groupId>org.springframework.cloud</groupId>
     <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

否则会报错：

```bash
Parameter 0 of method loadBalancerWebClientBuilderBeanPostProcessor in org.springframework.cloud.client.loadbalancer.reactive.LoadBalancerBeanPostProcessorAutoConfiguration required a bean of type 'org.springframework.cloud.client.loadbalancer.reactive.DeferringLoadBalancerExchangeFilterFunction' that could not be found.
Action:
Consider defining a bean of type 'org.springframework.cloud.client.loadbalancer.reactive.DeferringLoadBalancerExchangeFilterFunction' in your configuration.
```

### 2. 网关添加配置

```bash
spring:
  cloud:
    nacos:
      server-addr: localhost:8848
    gateway:
      enabled: true
      metrics:
        开启 GatewayMetricsFilter
        enabled: true
      discovery:
        locator:
          开启服务发现动态路由
          enabled: true
          是否将服务名称小写
          lower-case-service-id: true
```

### 3. 测试

通过以下方式访问，就可以通过服务名，转发到具体的后台应用。

```bash
# 网关地址/服务注册名/目标请求路径
http://localhost/app-service001/app1/test
```

## 执行流程

### 1. 动态加载路由

**1.1 DiscoveryClientRouteDefinitionLocator**类

在之前的案例中，我们分析过，路由信息会被加载到`RouteDefinitionLocator`中，YML配置的路由是`PropertiesRouteDefinitionLocator`来加载的。

基于服务发现时，使用的是`DiscoveryClientRouteDefinitionLocator`。

`DiscoveryClientRouteDefinitionLocator`的成员属性如下所示：

```java
private final DiscoveryLocatorProperties properties;
private final String routeIdPrefix;
private final SimpleEvaluationContext evalCtxt;
private Flux<List<ServiceInstance>> serviceInstances;
```

`DiscoveryLocatorProperties` 是针对服务发现的相关配置，

`routeIdPrefix`表示路由的前缀，没有设置时，默认为：**ReactiveCompositeDiscoveryClient_**。

`SimpleEvaluationContext` 是SPEL表达式的Context。

`serviceInstances`就存放了动态的路由规则。

**1.2 初始化DiscoveryClientRouteDefinitionLocator**

通过构造函数进行初始化，

```java
public DiscoveryClientRouteDefinitionLocator(ReactiveDiscoveryClient discoveryClient, DiscoveryLocatorProperties properties) {
    // 1. 属性初始化，routeIdPrefix、SimpleEvaluationContext 
    this(discoveryClient.getClass().getSimpleName(), properties);
    // 2. 调用服务发现客户端，查询动态的路由信息。
    this.serviceInstances = discoveryClient.getServices().flatMap((service) -> {
        return discoveryClient.getInstances(service).collectList();
    });
}
```

构造函数需要`ReactiveDiscoveryClient`和`DiscoveryLocatorProperties`参数，ReactiveDiscoveryClient是一个服务发现客户端，是Spring cloud提供的协议接口，因为我们引入的是Nacos，所以这里的客户端为`NacosReactiveDiscoveryClient`。

**1.3 获取RouteDefinitions**

`DiscoveryClientRouteDefinitionLocator`通过调用 DiscoveryClient 获取在注册中心的服务列表，生成对应的 RouteDefinition 数组，调用的是getRouteDefinitions方法，最终在注册中心的服务，就被网关获取到路由信息了。

### 2. 执行过滤器

**2.1 路由信息**

获取到动态路由后，就是方法执行了。

首先可以看到，动态路由中，有一个Path类型的断言，其值为`/app-service001/**`，那么只要是访问路径以注册服务名开头，则就会匹配这个路由。

还可以看到，这个路由还有一个网关过滤器RewritePath。

**2.2 进入网关过滤器RewritePathGatewayFilterFactory**

请求经过Web 处理=》断言通过以后，就到达了`RewritePathGatewayFilterFactory`网关过滤器中，主要是去掉访问路径的服务名，并设置到Request中。

```java
ServerHttpRequest req = exchange.getRequest();
// ServerWebExchange添加属性，gatewayOriginalRequestUrl=》http://localhost/app-service001/app1/test
ServerWebExchangeUtils.addOriginalRequestUrl(exchange, req.getURI());
// 原始路径=》/app-service001/app1/test
String path = req.getURI().getRawPath();
// 新路径=》/app1/test
String newPath = path.replaceAll(config.regexp, replacement);
ServerHttpRequest request = req.mutate().path(newPath).build();
// 将重写后的的URL（http://localhost/app1/test），写到ServerWebExchange的gatewayRequestUrl属性中。
exchange.getAttributes().put(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR, request.getURI());
return chain.filter(exchange.mutate().request(request).build());
```

**2.3 进入全局过滤器 ReactiveLoadBalancerClientFilter**

`ReactiveLoadBalancerClientFilter`通过LoadBalancer 负载均衡器去获取当前服务可用的实际IP地址等信息，然后调用。

```java
public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    //  lb://app-service001/app1/test
    URI url = (URI)exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);
    // lb 
    String schemePrefix = (String)exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_SCHEME_PREFIX_ATTR);
    if (url != null && ("lb".equals(url.getScheme()) || "lb".equals(schemePrefix))) {
        ServerWebExchangeUtils.addOriginalRequestUrl(exchange, url);
        if (log.isTraceEnabled()) {
            log.trace(ReactiveLoadBalancerClientFilter.class.getSimpleName() + " url before: " + url);
        }
        // lb://app-service001/app1/test
        URI requestUri = (URI)exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);
        // 服务名=》app-service001
        String serviceId = requestUri.getHost();
        Set<LoadBalancerLifecycle> supportedLifecycleProcessors = LoadBalancerLifecycleValidator.getSupportedLifecycleProcessors(this.clientFactory.getInstances(serviceId, LoadBalancerLifecycle.class), RequestDataContext.class, ResponseData.class, ServiceInstance.class);
        // 创建客户端请求对象
        DefaultRequest<RequestDataContext> lbRequest = new DefaultRequest(new RequestDataContext(new RequestData(exchange.getRequest()), this.getHint(serviceId, this.loadBalancerProperties.getHint())));
        return this.choose(lbRequest, serviceId, supportedLifecycleProcessors).doOnNext((response) -> {
            if (!response.hasServer()) {
                supportedLifecycleProcessors.forEach((lifecycle) -> {
                    lifecycle.onComplete(new CompletionContext(Status.DISCARD, lbRequest, response));
                });
                throw NotFoundException.create(this.properties.isUse404(), "Unable to find instance for " + url.getHost());
            } else {
                // 获取到可用服务的实际IP 地址和端口
                ServiceInstance retrievedInstance = (ServiceInstance)response.getServer();
                // 访问路径 http://localhost/app1/test
                URI uri = exchange.getRequest().getURI();
                // 请求协议 HTTP
                String overrideScheme = retrievedInstance.isSecure() ? "https" : "http";
                if (schemePrefix != null) {
                    overrideScheme = url.getScheme();
                }
                DelegatingServiceInstance serviceInstance = new DelegatingServiceInstance(retrievedInstance, overrideScheme);
                // 实际访问地址=》http://192.168.58.1:9000/app1/test
                URI requestUrl = this.reconstructURI(serviceInstance, uri);
                if (log.isTraceEnabled()) {
                    log.trace("LoadBalancerClientFilter url chosen: " + requestUrl);
                }
                // 将实际的访问地址塞到请求对象中，供后续过滤器去调用访问。
                exchange.getAttributes().put(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR, requestUrl);
                exchange.getAttributes().put(ServerWebExchangeUtils.GATEWAY_LOADBALANCER_RESPONSE_ATTR, response);
                supportedLifecycleProcessors.forEach((lifecycle) -> {
                    lifecycle.onStartRequest(lbRequest, response);
                });
            }
        }).then(chain.filter(exchange)).doOnError((throwable) -> {
            supportedLifecycleProcessors.forEach((lifecycle) -> {
                lifecycle.onComplete(new CompletionContext(Status.FAILED, throwable, lbRequest, (Response)exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_LOADBALANCER_RESPONSE_ATTR)));
            });
        }).doOnSuccess((aVoid) -> {
            supportedLifecycleProcessors.forEach((lifecycle) -> {
                lifecycle.onComplete(new CompletionContext(Status.SUCCESS, lbRequest, (Response)exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_LOADBALANCER_RESPONSE_ATTR), new ResponseData(exchange.getResponse(), new RequestData(exchange.getRequest()))));
            });
        });
    } else {
        return chain.filter(exchange);
    }
}
```

最终，`ReactiveLoadBalancerClientFilter`完成了动态服务名到实际访问地址的转换，再经过其他过滤器去调动，获取到响应，最终返回到网关，再响应给页面，整个流程就结束了。
