# 10、SpringCloud Gateway 配置Gateway详解
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/26.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 前言

在之前介绍了一些Spring Cloud Gateway配置项，接下来详细介绍下所有配置项。

[官方文档地址](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/appendix.html)

## application.yml 配置项

可以在application.properties、application.yml、代码、命令行开关中指定各种属性。

本附录提供了常见 Spring Cloud Gateway 属性的列表以及对使用它们的底层类的引用。

名称
默认
说明

spring.cloud.gateway.default-filters

作用于每个路由的过滤器列表

spring.cloud.gateway.discovery.locator.enabled
false
启用服务发现，动态路由

spring.cloud.gateway.discovery.locator.filters

spring.cloud.gateway.discovery.locator.include-expression
true
是否在网关集成中包含服务的 SpEL 表达式，默认为：true。

spring.cloud.gateway.discovery.locator.lower-case-service-id
false
在谓词和过滤器中小写 serviceId ，默认为 false。当 eureka 自动大写 serviceId 时很有用。所以 MYSERIVCE，会匹配 /myservice/**

spring.cloud.gateway.discovery.locator.predicates

spring.cloud.gateway.discovery.locator.route-id-prefix

routeId 的前缀，默认为 discoveryClient.getClass().getSimpleName() + “_”+服务 ID 。将以创建 routeId。

spring.cloud.gateway.discovery.locator.url-expression
‘lb://’+serviceId
为每个路由创建 uri 的 SpEL 表达式，默认为：‘lb://’+serviceId。

spring.cloud.gateway.enabled
true
启用网关功能。

spring.cloud.gateway.fail-on-route-definition-error
true
路由定义错误失败的选项，默认为 true。否则，将记录警告。

spring.cloud.gateway.filter.add-request-header.enabled
true
启用 add-request-header 过滤器。

spring.cloud.gateway.filter.add-request-parameter.enabled
true
启用添加请求参数过滤器。

spring.cloud.gateway.filter.add-response-header.enabled
true
启用添加响应头过滤器。

spring.cloud.gateway.filter.circuit-breaker.enabled
true
启用断路器过滤器。

spring.cloud.gateway.filter.dedupe-response-header.enabled
true
启用重复数据删除响应头过滤器。

spring.cloud.gateway.filter.fallback-headers.enabled
true
启用回退标头过滤器。

spring.cloud.gateway.filter.hystrix.enabled
true
启用 hystrix 过滤器。

spring.cloud.gateway.filter.map-request-header.enabled
true
启用 map-request-header 过滤器。

spring.cloud.gateway.filter.modify-request-body.enabled
true
启用修改请求正文过滤器。

spring.cloud.gateway.filter.modify-response-body.enabled
true
启用修改响应正文过滤器。

spring.cloud.gateway.filter.prefix-path.enabled
true
启用前缀路径过滤器。

spring.cloud.gateway.filter.preserve-host-header.enabled
true
启用保留主机头过滤器。

spring.cloud.gateway.filter.redirect-to.enabled
true
启用重定向过滤器。

spring.cloud.gateway.filter.remove-hop-by-hop.headers

spring.cloud.gateway.filter.remove-hop-by-hop.order

spring.cloud.gateway.filter.remove-request-header.enabled
true
启用 remove-request-header 过滤器。

spring.cloud.gateway.filter.remove-request-parameter.enabled
true
启用删除请求参数过滤器。

spring.cloud.gateway.filter.remove-response-header.enabled
true
启用 remove-response-header 过滤器。

spring.cloud.gateway.filter.request-header-size.enabled
true
启用请求头大小过滤器。

spring.cloud.gateway.filter.request-header-to-request-uri.enabled
true
启用 request-header-to-request-uri 过滤器。

spring.cloud.gateway.filter.request-rate-limiter.deny-empty-key
true
如果密钥解析器返回空密钥，则切换到拒绝请求，默认为 true。

spring.cloud.gateway.filter.request-rate-limiter.empty-key-status-code

当 denyEmptyKey 为 true 时返回的 HttpStatus，默认为 FORBIDDEN。

spring.cloud.gateway.filter.request-rate-limiter.enabled
true
启用请求速率限制器过滤器。

spring.cloud.gateway.filter.request-size.enabled
true
启用请求大小过滤器。

spring.cloud.gateway.filter.retry.enabled
true
启用重试过滤器。

spring.cloud.gateway.filter.rewrite-location-response-header.enabled
true
启用 rewrite-location-response-header 过滤器。

spring.cloud.gateway.filter.rewrite-location.enabled
true
启用重写位置过滤器。

spring.cloud.gateway.filter.rewrite-path.enabled
true
启用重写路径过滤器。

spring.cloud.gateway.filter.rewrite-response-header.enabled
true
启用重写响应头过滤器。

spring.cloud.gateway.filter.save-session.enabled
true
启用保存会话过滤器。

spring.cloud.gateway.filter.secure-headers.content-security-policy
default-src ‘self’ https:; font-src ‘self’ https: data:; img-src ‘self’ https: data:; object-src ‘none’; script-src https:; style-src ‘self’ https: ‘unsafe-inline’

spring.cloud.gateway.filter.secure-headers.content-type-options
nosniff

spring.cloud.gateway.filter.secure-headers.disable

spring.cloud.gateway.filter.secure-headers.download-options
noopen

spring.cloud.gateway.filter.secure-headers.enabled
true
启用安全标头过滤器。

spring.cloud.gateway.filter.secure-headers.frame-options
DENY

spring.cloud.gateway.filter.secure-headers.permitted-cross-domain-policies
none

spring.cloud.gateway.filter.secure-headers.referrer-policy
no-referrer

spring.cloud.gateway.filter.secure-headers.strict-transport-security
max-age=631138519

spring.cloud.gateway.filter.secure-headers.xss-protection-header
1 ; mode=block

spring.cloud.gateway.filter.set-path.enabled
true
启用设置路径过滤器。

spring.cloud.gateway.filter.set-request-header.enabled
true
启用 set-request-header 过滤器。

spring.cloud.gateway.filter.set-request-host-header.enabled
true
启用 set-request-host-header 过滤器。

spring.cloud.gateway.filter.set-response-header.enabled
true
启用 set-response-header 过滤器。

spring.cloud.gateway.filter.set-status.enabled
true
启用设置状态过滤器。

spring.cloud.gateway.filter.strip-prefix.enabled
true
启用带前缀过滤器。

spring.cloud.gateway.forwarded.enabled
true
启用 ForwardedHeadersFilter。

spring.cloud.gateway.global-filter.adapt-cached-body.enabled
true
启用adapt-cached-body 全局过滤器。

spring.cloud.gateway.global-filter.forward-path.enabled
true
启用转发路径全局过滤器。

spring.cloud.gateway.global-filter.forward-routing.enabled
true
启用转发路由全局过滤器。

spring.cloud.gateway.global-filter.load-balancer-client.enabled
true
启用负载平衡器客户端全局过滤器。

spring.cloud.gateway.global-filter.netty-routing.enabled
true
启用 netty-routing 全局过滤器。

spring.cloud.gateway.global-filter.netty-write-response.enabled
true
启用 netty-write-response 全局过滤器。

spring.cloud.gateway.global-filter.reactive-load-balancer-client.enabled
true
启用reactive-load-balancer-client 全局过滤器。

spring.cloud.gateway.global-filter.remove-cached-body.enabled
true
启用 remove-cached-body 全局过滤器。

spring.cloud.gateway.global-filter.route-to-request-url.enabled
true
启用 route-to-request-url 全局过滤器。

spring.cloud.gateway.global-filter.websocket-routing.enabled
true
启用 websocket-routing 全局过滤器。

spring.cloud.gateway.globalcors.add-to-simple-url-handler-mapping
false
如果应将全局 CORS 配置添加到 URL 处理程序。

spring.cloud.gateway.globalcors.cors-configurations

spring.cloud.gateway.httpclient.compression
false
为 Netty HttpClient 启用压缩。

spring.cloud.gateway.httpclient.connect-timeout

以毫秒为单位的连接超时，默认为 45 秒。

spring.cloud.gateway.httpclient.max-header-size

最大响应标头大小。

spring.cloud.gateway.httpclient.max-initial-line-length

最大初始行长度。

spring.cloud.gateway.httpclient.pool.acquire-timeout

仅针对 FIXED 类型，等待获取的最长时间（以毫秒为单位）。

spring.cloud.gateway.httpclient.pool.eviction-interval
0
以指定的时间间隔在后台执行定期驱逐检查。默认禁用 ({@link Duration#ZERO})

spring.cloud.gateway.httpclient.pool.max-connections

仅适用于 FIXED 类型，即在现有连接上开始挂起获取之前的最大连接数。

spring.cloud.gateway.httpclient.pool.max-idle-time

通道关闭之前的时间（以毫秒为单位）。如果为 NULL，则没有最大空闲时间。

spring.cloud.gateway.httpclient.pool.max-life-time

通道将关闭的持续时间。如果为 NULL，则没有最大生命周期。

spring.cloud.gateway.httpclient.pool.metrics
false
允许在 Micrometer 中收集和注册通道池指标。默认禁用。

spring.cloud.gateway.httpclient.pool.name
proxy
通道池映射名称

spring.cloud.gateway.httpclient.pool.type

HttpClient 使用的池类型，默认为 ELASTIC。

spring.cloud.gateway.httpclient.proxy.host

Netty HttpClient 代理配置的主机名。

spring.cloud.gateway.httpclient.proxy.non-proxy-hosts-pattern

用于配置的主机列表的正则表达式 (Java)。应该直接到达，绕过代理

spring.cloud.gateway.httpclient.proxy.password

Netty HttpClient 代理配置密码。

spring.cloud.gateway.httpclient.proxy.port

Netty HttpClient 的代理配置端口。

spring.cloud.gateway.httpclient.proxy.type

proxyType 用于 Netty HttpClient 的代理配置。

spring.cloud.gateway.httpclient.proxy.username

Netty HttpClient 代理配置的用户名。

spring.cloud.gateway.httpclient.response-timeout

响应超时。

spring.cloud.gateway.httpclient.ssl.close-notify-flush-timeout
3000ms
SSL close_notify 刷新超时。默认为 3000 毫秒。

spring.cloud.gateway.httpclient.ssl.close-notify-read-timeout
0
SSL close_notify 读取超时。默认为 0 毫秒。

spring.cloud.gateway.httpclient.ssl.default-configuration-type

默认的 ssl 配置类型。默认为 TCP。

spring.cloud.gateway.httpclient.ssl.handshake-timeout
10000ms
SSL 握手超时。默认为 10000 毫秒

spring.cloud.gateway.httpclient.ssl.key-password

密钥密码，默认与keyStorePassword 相同。

spring.cloud.gateway.httpclient.ssl.key-store

Netty HttpClient 的密钥库路径。

spring.cloud.gateway.httpclient.ssl.key-store-password

密钥库密码。

spring.cloud.gateway.httpclient.ssl.key-store-provider

Netty HttpClient 的密钥库提供程序，可选字段。

spring.cloud.gateway.httpclient.ssl.key-store-type
JKS
Netty HttpClient 的密钥库类型，默认为 JKS。

spring.cloud.gateway.httpclient.ssl.trusted-x509-certificates

用于验证远程端点证书的可信证书。

spring.cloud.gateway.httpclient.ssl.use-insecure-trust-manager
false
安装 netty InsecureTrustManagerFactory。这是不安全的，不适合生产。

spring.cloud.gateway.httpclient.websocket.max-frame-payload-length

最大帧有效载荷长度。

spring.cloud.gateway.httpclient.websocket.proxy-ping
true
代理 ping 帧到下游服务，默认为 true。

spring.cloud.gateway.httpclient.wiretap
false
为 Netty HttpClient 启用窃听调试。

spring.cloud.gateway.httpserver.wiretap
false
为 Netty HttpServer 启用窃听调试。

spring.cloud.gateway.loadbalancer.use404
false

spring.cloud.gateway.metrics.enabled
false
启用指标数据的收集。

spring.cloud.gateway.metrics.prefix
spring.cloud.gateway
网关发出的所有指标的前缀。

spring.cloud.gateway.metrics.tags

添加到指标的标签映射。

spring.cloud.gateway.predicate.after.enabled
true
启用 after 谓词。

spring.cloud.gateway.predicate.before.enabled
true
启用 before 谓词。

spring.cloud.gateway.predicate.between.enabled
true
启用 between 谓词。

spring.cloud.gateway.predicate.cloud-foundry-route-service.enabled
true
启用 cloud-foundry-route-service 谓词。

spring.cloud.gateway.predicate.cookie.enabled
true
启用 cookie 谓词。

spring.cloud.gateway.predicate.header.enabled
true
启用标头谓词。

spring.cloud.gateway.predicate.host.enabled
true
启用主机谓词。

spring.cloud.gateway.predicate.method.enabled
true
启用方法谓词。

spring.cloud.gateway.predicate.path.enabled
true
启用路径谓词。

spring.cloud.gateway.predicate.query.enabled
true
启用查询谓词。

spring.cloud.gateway.predicate.read-body.enabled
true
启用 read-body 谓词。

spring.cloud.gateway.predicate.remote-addr.enabled
true
启用远程地址谓词。

spring.cloud.gateway.predicate.weight.enabled
true
启用权重谓词。

spring.cloud.gateway.redis-rate-limiter.burst-capacity-header
X-RateLimit-Burst-Capacity
返回突发容量配置的标头名称。

spring.cloud.gateway.redis-rate-limiter.config

spring.cloud.gateway.redis-rate-limiter.include-headers
true
是否包含包含速率限制器信息的标头，默认为 true。

spring.cloud.gateway.redis-rate-limiter.remaining-header
X-RateLimit-Remaining
返回当前秒内剩余请求数的标头名称。

spring.cloud.gateway.redis-rate-limiter.replenish-rate-header
X-RateLimit-Replenish-Rate
返回补货率配置的标题名称。

spring.cloud.gateway.redis-rate-limiter.requested-tokens-header
X-RateLimit-Requested-Tokens
返回请求的令牌配置的标头的名称。

spring.cloud.gateway.routes

route 路由集合。

spring.cloud.gateway.set-status.original-status-header-name

包含代理请求的 http 代码的标头名称。

spring.cloud.gateway.streaming-media-types

spring.cloud.gateway.x-forwarded.enabled
true
启用 XForwardedHeadersFilter。

spring.cloud.gateway.x-forwarded.for-append
true
如果已启用将 X-Forwarded-For 作为列表附加。

spring.cloud.gateway.x-forwarded.for-enabled
true
如果启用 X-Forwarded-For。

spring.cloud.gateway.x-forwarded.host-append
true
如果启用将 X-Forwarded-Host 作为列表附加。

spring.cloud.gateway.x-forwarded.host-enabled
true
X-Forwarded-Host 启用。

spring.cloud.gateway.x-forwarded.order
0
XForwardedHeadersFilter 的顺序。

spring.cloud.gateway.x-forwarded.port-append
true
如果启用将 X-Forwarded-Port 作为列表附加。

spring.cloud.gateway.x-forwarded.port-enabled
true
如果启用 X-Forwarded-Port。

spring.cloud.gateway.x-forwarded.prefix-append
true
如果将 X-Forwarded-Prefix 作为列表附加已启用。

spring.cloud.gateway.x-forwarded.prefix-enabled
true

spring.cloud.gateway.x-forwarded.proto-append
true
如果启用将 X-Forwarded-Proto 作为列表附加。

spring.cloud.gateway.x-forwarded.proto-enabled
true
如果启用 X-Forwarded-Proto。

## 其他配置

### Http超时配置

可以为所有路由配置 Http 超时（响应和连接），并可以为每个路由特定配置。

**1. 全局超时**

配置全局 http 超时：

- connect-timeout必须以毫秒为单位指定。
- response-timeout必须指定为 java.time.Duration

示例：

```java
spring:
  cloud:
    gateway:
      httpclient:
        connect-timeout: 1000
        response-timeout: 5s
```

**2. 每个路由超时**

要配置每条路由超时：

- connect-timeout必须以毫秒为单位指定。
- response-timeout必须以毫秒为单位指定。

```bash
- id: per_route_timeouts
uri: https://example.org
predicates:
  - name: Path
    args:
      pattern: /delay/{
 timeout}
metadata:
  response-timeout: 200
  connect-timeout: 200
```

**3. 使用 Java 代码为每条路由超时配置**

```java
import static org.springframework.cloud.gateway.support.RouteMetadataUtils.CONNECT_TIMEOUT_ATTR;
import static org.springframework.cloud.gateway.support.RouteMetadataUtils.RESPONSE_TIMEOUT_ATTR;
      @Bean
      public RouteLocator customRouteLocator(RouteLocatorBuilder routeBuilder){
         return routeBuilder.routes()
               .route("test1", r -> {
                  return r.host("*.somehost.org").and().path("/somepath")
                        .filters(f -> f.addRequestHeader("header1", "header-value-1"))
                        .uri("http://someuri")
                        .metadata(RESPONSE_TIMEOUT_ATTR, 200)
                        .metadata(CONNECT_TIMEOUT_ATTR, 200);
               })
               .build();
      }
```

### 使用 Java API配置路由

为了允许在 Java 中进行简单配置，该RouteLocatorBuilderbean 包括一个流畅的 API。以下清单显示了它的工作原理：

```java
// static imports from GatewayFilters and RoutePredicates
@Bean
public RouteLocator customRouteLocator(RouteLocatorBuilder builder, ThrottleGatewayFilterFactory throttle) {
    return builder.routes()
            .route(r -> r.host("**.abc.org").and().path("/image/png")
                .filters(f ->
                        f.addResponseHeader("X-TestHeader", "foobar"))
                .uri("http://httpbin.org:80")
            )
            .route(r -> r.path("/image/webp")
                .filters(f ->
                        f.addResponseHeader("X-AnotherHeader", "baz"))
                .uri("http://httpbin.org:80")
                .metadata("key", "value")
            )
            .route(r -> r.order(-1)
                .host("**.throttle.org").and().path("/get")
                .filters(f -> f.filter(throttle.apply(1,
                        1,
                        10,
                        TimeUnit.SECONDS)))
                .uri("http://httpbin.org:80")
                .metadata("key", "value")
            )
            .build();
}
```

这种风格还允许更多的自定义谓词断言。Route Definition Locator bean定义的谓词使用逻辑组合and。通过使用流利的Java API，你可以使用and()，or()以及negate()的Predicate类。

### Discovery Client路由 配置谓词和过滤器

默认情况下，网关使用DiscoveryClient.

默认谓词是使用模式定义的路径谓词/serviceId/**，其中serviceId是DiscoveryClient.

默认过滤器是带有正则表达式/serviceId/?(?.*)和替换的重写路径过滤器/${ remaining}。这会在向下游发送请求之前从路径中剥离服务 ID。

如果要自定义DiscoveryClient路由使用的谓词或过滤器，请设置`spring.cloud.gateway.discovery.locator.predicates[x]`和`spring.cloud.gateway.discovery.locator.filters[y]`。这样做时，如果您想保留该功能，您需要确保包含前面显示的默认谓词和过滤器。以下示例显示了它的样子：

```java
spring.cloud.gateway.discovery.locator.predicates[0].name: Path
spring.cloud.gateway.discovery.locator.predicates[0].args[pattern]: "'/'+serviceId+'/**'"
spring.cloud.gateway.discovery.locator.predicates[1].name: Host
spring.cloud.gateway.discovery.locator.predicates[1].args[pattern]: "'**.foo.com'"
spring.cloud.gateway.discovery.locator.filters[0].name: CircuitBreaker
spring.cloud.gateway.discovery.locator.filters[0].args[name]: serviceId
spring.cloud.gateway.discovery.locator.filters[1].name: RewritePath
spring.cloud.gateway.discovery.locator.filters[1].args[regexp]: "'/' + serviceId + '/?(?<remaining>.*)'"
spring.cloud.gateway.discovery.locator.filters[1].args[replacement]: "'/${remaining}'"
```

### CORS 配置

您可以配置网关以控制 CORS 行为。全局 CORS 配置是 URL 模式到Spring Framework Cors Configuration的映射。以下示例配置 CORS：

```bash
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins: "https://docs.spring.io"
            allowedMethods:
            - GET
```

在前面的示例中，允许来自docs.spring.io所有 GET 请求路径的请求的 CORS 请求。

要为某些网关路由谓词未处理的请求提供相同的 CORS 配置，请将spring.cloud.gateway.globalcors.add-to-simple-url-handler-mapping属性设置为true。
