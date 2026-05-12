# 06、SpringCloud Gateway GlobalFilter全局过滤器详解
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/22.html
- 分类：API网关
- 分组：SpringCloud Gateway
## GlobalFilter概述

GlobalFilter是应用于所有路由的特殊过滤器。

GlobalFilter接口的实现类如下图所示：

每个类的说明如下：

当请求与路由匹配时，Web 处理程序会将所有的GlobalFilter和特定的GatewayFilter添加到过滤器链中。这个组合过滤器链是按`org.springframework.core.Ordered`接口排序的，也通过实现getOrder()方法来设置。

## 默认全局过滤器

### ForwardRoutingFilter

`RouteToRequestUrlFilter`，转发路由网关过滤器。其根据 forward:// 前缀( Scheme )过滤处理，将请求转发到当前网关实例本地接口。

```java
public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
      // 获得 请求Url
    URI requestUrl = (URI)exchange.getRequiredAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);
    // 获取协议
    String scheme = requestUrl.getScheme();
    if (!ServerWebExchangeUtils.isAlreadyRouted(exchange) && "forward".equals(scheme)) {
        if (log.isTraceEnabled()) {
            log.trace("Forwarding to URI: " + requestUrl);
        }
        //  如果是forward ，则DispatcherHandler 匹配并转发到当前网关实例本地接口
        return this.getDispatcherHandler().handle(exchange);
    } else {
        return chain.filter(exchange);
    }
}
```

### ReactiveLoadBalancerClientFilter

该过滤器，可以使用服务发现机制，即通过注册服务名去访问实际IP地址，多个相同服务时，还可以实现负载均衡。

`ReactiveLoadBalancerClientFilter`会在ServerWebExchange 查询gatewayRequestUrl 属性。如果 URL 是lb开头（例如`lb://myservice`），则它使用ReactorLoadBalancer将名称`myservice`解析为实际主机和端口，并替换同一属性中的 URI。

未修改的原始 URL 将附加到`ServerWebExchangeUtils.GATEWAY_ORIGINAL_REQUEST_URL_ATTR`属性中的列表中。过滤器还会查看`ServerWebExchangeUtils.GATEWAY_SCHEME_PREFIX_ATTR`属性以查看它是否等于lb。如果是这样，则适用相同的规则。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: myRoute
        uri: lb://service
        predicates:
        - Path=/service/**
```

默认情况下，当无法找到服务实例时LoadBalancer，将503返回。您可以通过设置将网关配置为返回 404

。Gateway 支持所有 LoadBalancer 功能。

```bash
spring.cloud.gateway.loadbalancer.use404=true。
```

### NettyRoutingFilter

Netty 路由网关过滤器。其根据 http:// 或 https:// 前缀( Scheme )过滤处理，使用基于 Netty 实现的 HttpClient 请求后端 Http 服务。

如果`ServerWebExchangeUtils.GATEWAY_ REQUEST_ URL_ ATTR`请求属性中的URL 具有http 或https 前缀，NettyRoutingFilter 路由过滤器将运行，它使用 Netty Http Client 代理对下游的请求。响应信息放在`ServerWebExchangeUtils.CLIENT_ RESPONSE_ ATTR`属性中，在过滤器链中进行传递。

首先获取请求的URL及前缀，判断前缀是不是http或者https，如果该请求已经被路由或者前缀不合法，则调用过滤器链直接向后传递；否则正常对头部进行过滤操作。

NettyRoutingFilter 过滤器的构造函数有三个参数：

- HttpClient httpClient ： 基于 Netty 实现的 HttpClient，通过该属性请求后端 的 Http 服务
- ObjectProvider headersFilters： ObjectProvider 类型 的 headersFilters，用于头部过滤
- HttpClientProperties properties： Netty HttpClient 的配置属性

### NettyWriteResponseFilter

如果有一个运行的NettyHttpClientResponse在`ServerWebExchangeUtils.CLIENT_RESPONSE_ATTR`属性。它在所有其他过滤器完成后运行，并将代理响应写回网关客户端响应。

```java
public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    return chain.filter(exchange)
        // 这个cleanup()的作用是关闭连接，此处的意思是出错时关闭response connection
        .doOnError(throwable -> cleanup(exchange))
        .then(Mono.defer(() -> {
            // 1.从exchange拿到response connection，它是被NettyRoutingFilter发请求后塞进去的
            Connection connection = exchange.getAttribute(CLIENT_RESPONSE_CONN_ATTR);
            if (connection == null) {
                return Mono.empty();
            }
            ServerHttpResponse response = exchange.getResponse();
            // 2.从connection接收字节流写入response
            final Flux<DataBuffer> body = connection
                .inbound()
                .receive()
                .retain()
                .map(byteBuf -> wrap(byteBuf, response));
            MediaType contentType = null;
            try {
                contentType = response.getHeaders().getContentType();
            }
            catch (Exception e) {
     }
            // 3.针对response是否为流媒体内容采取不同的返回调用，最终就返回给请求方了
            return (isStreamingMediaType(contentType)
                ? response.writeAndFlushWith(body.map(Flux::just))
                : response.writeWith(body));
        })).doOnCancel(() -> cleanup(exchange));
}
```

`NettyWriteResponseFilter`与 `NettyRoutingFilter`成对使用的网关过滤器。其将 NettyRoutingFilter 请求后端 Http 服务的响应写回客户端。

大体流程如下 ：

另外，Spring Cloud Gateway 实现了`WebClientHttpRoutingFilter / WebClientWriteResponseFilter` ，功能上和 `NettyRoutingFilter / NettyWriteResponseFilter` 相同，差别在于基于 `org.springframework.cloud.gateway.filter.WebClient`实现的 HttpClient 请求后端 Http 服务。

### RouteToRequestUrlFilter

这个过滤器用于将从request里获取的原始url转换成Gateway进行请求转发时所使用的url。

当请求进来时，`RouteToRequestUrlFilter` 会从 exchange 中获取 `ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR` 属性的值，该值是一个 Route 对象。若该对象不为空的话，`RouteToRequestUrlFilter`会基于请求 URL 及 Route 对象里的 URL 来创建一个新的 URL。新 URL 会被放到 exchange 的

`ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR`属性中。

如果URL 具有 scheme 前缀，例如 lb:ws://serviceid ，该 lb scheme将从URL中剥离，并放到 `ServerWebExchangeUtils.GATEWAY_SCHEME_PREFIX_ATTR`中，方便后面的过滤器使用。

源码如下：

```java
public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    // 获取Route 对象
    Route route = (Route)exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
    if (route == null) {
        return chain.filter(exchange);
    } else {
        log.trace("RouteToRequestUrlFilter start");
        // 获取请求URI 
        URI uri = exchange.getRequest().getURI();
        boolean encoded = ServerWebExchangeUtils.containsEncodedParts(uri);
        // 路由中的uri
        URI routeUri = route.getUri();
        if (hasAnotherScheme(routeUri)) {
            exchange.getAttributes().put(ServerWebExchangeUtils.GATEWAY_SCHEME_PREFIX_ATTR, routeUri.getScheme());
            routeUri = URI.create(routeUri.getSchemeSpecificPart());
        }
        if ("lb".equalsIgnoreCase(routeUri.getScheme()) && routeUri.getHost() == null) {
            throw new IllegalStateException("Invalid host: " + routeUri.toString());
        } else {
            // 是将原始的url请求根据route中配置的uri，将请求的具体资源信息组合到一起，形成一个真正往后端服务的请求，将真实的请求url路径，配置到exchange中attribute的Map中
            URI mergedUrl = UriComponentsBuilder.fromUri(uri).scheme(routeUri.getScheme()).host(routeUri.getHost()).port(routeUri.getPort()).build(encoded).toUri();
            exchange.getAttributes().put(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR, mergedUrl);
            return chain.filter(exchange);
        }
    }
}
```

### WebsocketRoutingFilter

如果位于`ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR`交换属性中的 URL具有ws或wss方案，则 WebsocketRoutingFilter 路由过滤器运行。它使用 Spring Web Socket 基础结构向下游转发 web socket 请求。

您可以通过在 URI 前加上lb 前缀来对 websockets 进行负载平衡，例如lb:ws://serviceid.

如果你使用Sock JS作为普通 HTTP 的后备，你应该配置一个普通的 HTTP 路由以及 websocket 路由。

以下清单配置了一个 websocket 路由过滤器：

```bash
spring:
  cloud:
    gateway:
      routes:
      SockJS route
      - id: websocket_sockjs_route
        uri: http://localhost:3001
        predicates:
        - Path=/websocket/info/**
      Normal Websocket route
      - id: websocket_route
        uri: ws://localhost:3001
        predicates:
        - Path=/websocket/**
```

### GatewayMetricsFilter

要启用网关指标，请将 `spring-boot-starter-actuator` 添加为项目依赖项。然后，默认情况下，只要属性`spring.cloud.gateway.metrics.enabled`未设置为false，网关指标过滤器就会运行。此过滤器添加了一个以`spring.cloud.gateway.requests`以下标签命名的计时器指标：

- routeId: 路由ID。
- routeUri：API 路由到的 URI。
- outcome：结果，按HttpStatus.Series分类。
- status：返回给客户端的请求的 HTTP 状态。
- httpStatusCode：返回给客户端的请求的 HTTP 状态。
- httpMethod：用于请求的 HTTP 方法。

此外，通过属性spring.cloud.gateway.metrics.tags.path.enabled（默认情况下，设置为 false），您可以使用标签激活额外的指标：

- path: 请求的路径。

然后可以从`/actuator/metrics/spring.cloud.gateway.requests`中抓取这些指标，并且可以轻松地与 Prometheus 集成以创建Grafana 仪表板。

要启用prometheus 端点，请添加micrometer-registry-prometheus为项目依赖项。

**案例演示**：

**1. 添加相关依赖：**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<!-- https://mvnrepository.com/artifact/io.micrometer/micrometer-registry-prometheus -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

**1、** 添加Bean:；

```java
@Bean
MeterRegistryCustomizer<MeterRegistry> configurer(
        @Value("${spring.application.name}") String applicationName) {
    return (registry) -> registry.config().commonTags("application", applicationName);
}
```

**3. 添加YML配置：**

```bash
server:
  port: 80
spring:
  cloud:
    gateway:
      enabled: true
      metrics:
        开启 GatewayMetricsFilter
        enabled: true
      routes:
        - id: app-service001 路由唯一ID
          uri: http://localhost:9000    目标URI,
          predicates:   断言，为真则匹配成功
            - Path=/app1/** 配置规则Path，如果是app1开头的请求，则会将该请求转发到目标URL
          filters:
            - AddRequestHeader=X-Request-Foo, Bar  定义了一个 Filter，所有的请求转发至下游服务时会添加请求头 X-Request-Foo:Bar ，由AddRequestHeaderGatewayFilterFactory 来生产。
  application:
    name: gateway
management:
  endpoint:
    health:
      是否显示health详细信息
      show-details: always
      show-components: always
  endpoints:
    Web端点的配置属性
    web:
      exposure:
         开放端点的ID集合（eg:['health','info','beans','env']），配置为“*”表示全部
        include: '*'
  metrics:
    tags:
       应用名称添加到计量器注册表的tag中
      application: ${
     spring.application.name}
```

**4. 访问Gateway 监控端点，返回了一些访问总次数、路由状态码等信息**

```java
http://localhost/actuator/metrics/spring.cloud.gateway.requests
```

**5. 访问Promethues 监控端点，可以看到网关的监控指标被采集到。**

```java
http://localhost/actuator/prometheus
```

**6. 集成Grafana，导入监控面板的时候，发现这个已经很久没更新了，导入后，发现查询指标时都没有数据，集成还有有点问题，不推荐使用。**

### WebClientHttpRoutingFilter

`WebClientHttpRoutingFilte`rHttp 路由网关过滤器。其根据 http:// 或 https:// 前缀( Scheme )过滤处理，使用基于 `org.springframework.cloud.gateway.filter.WebClient`实现的 HttpClient 请求后端 Http 服务。

`WebClientWriteResponseFilter`，与 `WebClientHttpRoutingFilter`成对使用的网关过滤器。其将 `WebClientWriteResponseFilter`请求后端 Http 服务的响应写回客户端。

大体流程如下 ：

## 参考文档

https://www.iocoder.cn/Spring-Cloud-Gateway/filter-netty-routing/
