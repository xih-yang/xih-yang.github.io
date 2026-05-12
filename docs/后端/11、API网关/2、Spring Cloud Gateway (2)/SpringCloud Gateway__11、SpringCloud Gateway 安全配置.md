# 11、SpringCloud Gateway 安全配置
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/11.html
- 分类：API网关
- 分组：SpringCloud Gateway
## Spring Cloud Gateway-安全及其他配置

Spring Cloud Gateway作为网关，除了提供了内置的一些常用的服务转发能力和报文修改能力以外，还有一些其他的能力，比如安全、监控等。

本节为大家介绍安全及其他配置。

## TLS及SSL配置

网关通过配置Spring Server的相关参数即可方便的实现监听HTTPS请求，如下示例：

```sh
server:
  ssl:
    enabled: true
    key-alias: mykey
    key-store-password: ******
    key-store: classpath:mykeystore.p12
    key-store-type: PKCS12
```

同时网关可以支持将请求路由到HTTP服务以及HTTPS服务，如果需要路由到HTTPS服务，可以通过以下配置实现信任服务提供方的任何证书：

```sh
spring:
  cloud:
    gateway:
      httpclient:
        ssl:
          useInsecureTrustManager: true
```

在一些对于安全要求较高的场景中，不允许直接使用不安全的可信管理器，那么就要用安全的可信管理器，如下配置：

```sh
spring:
  cloud:
    gateway:
      httpclient:
        ssl:
          trustedX509Certificates:
          - service1.pem
          - service2.pem
```

在路由转发时用了SSL协议时，我们可以对TLS握手相关参数进行配置，如下：

```sh
spring:
  cloud:
    gateway:
      httpclient:
        ssl:
          handshake-timeout-millis: 10000
          close-notify-flush-timeout-millis: 3000
          close-notify-read-timeout-millis: 0
```

## 网关配置

在前边的几篇文章中为大家介绍了Spring Cloud Gateway的很多配置参数和配置方式，那么这些配置是怎么加载生效的呢？

其实Spring Cloud Gateway的配置参数是通过一组RouteDefinitionLocator实例来加载生效的，默认是通过PropertiesRouteDefinitionLocator采用Spring Boot的@ConfigurationProperties机制来加载的，之前介绍的各种在application.yml中的配置都是通过这种方式来加载的。

但是在一些场景中，大家需要自定义参数配置来源，比如从数据库中加载配置，从Redis中加载配置，或者从其他来源加载配置，在这种情况下则需要用户自行实现RouteDefinitionLocator接口逻辑。

## 路由元数据

在application.yml中配置路由信息时，除了断言与过滤器以外，还可以配置附加的元数据，用于一些特殊用途，配置方式与获取方式如下：

```sh
spring:
  cloud:
    gateway:
      routes:
      - id: myroute
        uri: https://127.0.0.1:8080
        metadata:
          ignoredHost: 127.0.0.1
```

```java
Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
// 获取全部元数据
route.getMetadata();
// 获取指定元数据
route.getMetadata(someKey);
```

## Http超时时间配置

在配置SSL时介绍了TSL握手相关的超时配置，另外还有路由转发时http请求相关的超时时间connect-timeout、response-timeout。

这两个参数可以配置全局生效，也可以配置到具体的路由：

```sh
spring:
  cloud:
    gateway:
      httpclient:
        connect-timeout: 1000 #时间单位为ms
        response-timeout: 5s #全局配置需带时间单位
      routes:
      - id: myRoute
        uri: http://127.0.0.1
        predicates:
          - name: Path
            args:
              pattern: /delay/{
     timeout}
        metadata:
          response-timeout: 200 #时间单位为ms，不能指定时间单位
          connect-timeout: 200  #时间单位为ms
```

除了可以通过application.yml配置以外，也可以在通过java代码设置路由时配置：

```java
@Bean
public RouteLocator customRouteLocator(RouteLocatorBuilder routeBuilder){
    return routeBuilder.routes()
          .route("test1", r -> {
            return r.host("localhost").and().path("/test")
                  .filters(f -> f.addRequestHeader("test", "xxxx"))
                  .uri("http://127.0.0.1:8080")
                  .metadata(RESPONSE_TIMEOUT_ATTR, 200)
                  .metadata(CONNECT_TIMEOUT_ATTR, 200);
          })
          .build();
}
```

在配置具体路由时如果配置response-timeout为-1，则会使全局的配置无效。

## Java方式配置路由

通过Fluent Java API代码的方式配置路由：

```java
@Bean
public RouteLocator customRouteLocator(RouteLocatorBuilder builder, ThrottleGatewayFilterFactory throttle) {
    return builder.routes()
            .route(r -> r.host("localhost").and().path("/image/png")
                .filters(f ->
                        f.addResponseHeader("X-TestHeader", "foobar"))
                .uri("http://127.0.0.1:8080")
            )
            .route(r -> r.path("/image/webp")
                .filters(f ->
                        f.addResponseHeader("X-AnotherHeader", "baz"))
                .uri("http://127.0.0.1:8081")
                .metadata("key", "value")
            )
            .route(r -> r.order(-1)
                .host("localhost").and().path("/get")
                .filters(f -> f.filter(throttle.apply(1,
                        1,
                        10,
                        TimeUnit.SECONDS)))
                .uri("http://127.0.0.1:8082")
                .metadata("key", "value")
            )
            .build();
}
```

## 对接注册中心

用户还可以通过配置DiscoveryClient适配Eureka、Consul或者Zookeeper注册中心，实现服务地址自动发现。

只需要配置`spring.cloud.gateway.discovery.locator.enabled=true`

## Netty访问日志配置

用户可以在Java System Property中配置`-Dreactor.netty.http.server.accessLogEnabled=true`来开启Netty日志。

日志可通过logback.xml配置如下：

```xml
<appender name="accessLog" class="ch.qos.logback.core.FileAppender">
    <file>access_log.log</file>
    <encoder>
        <pattern>%msg%n</pattern>
    </encoder>
</appender>
<appender name="async" class="ch.qos.logback.classic.AsyncAppender">
    <appender-ref ref="accessLog" />
</appender>
<logger name="reactor.netty.http.server.AccessLog" level="INFO" additivity="false">
    <appender-ref ref="async"/>
</logger>
```

## 跨资源共享（CORS）配置

可以通过以下参数配置CORS：

```sh
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins: "http://www.mydomain.com"
            allowedMethods:
            - GET
        add-to-simple-url-handler-mapping: true
```

## Actuator API

用户可以通过配置开启/gateway端点来实现对Spring Cloud Gateway的监控，配置如下：

```sh
management.endpoint.gateway.enabled=true
management.endpoints.web.exposure.include=gateway
```

通过GET请求`/actuator/gateway/globalfilters`可以获取所有全局过滤器。

通过GET请求`/actuator/gateway/routefilters`可以获取所有配置到具体路由的过滤器。

通过POST请求`/actuator/gateway/refresh`可以刷新路由缓存。

通过GET请求`/actuator/gateway/routes`可以获取所有路由配置。

通过GET请求`/actuator/gateway/routes/{id}`可以获取指定路由配置。

通过DELETE请求`/gateway/routes/{id}`可以删除指定路由配置。

通过POST请求`/gateway/routes/{id}`可以创建新的路由，post的请求报文为：

```json
{
  "id": "first_route",
  "predicates": [{
    "name": "Path",
    "args": {
     "_genkey_0":"/first"}
  }],
  "filters": [],
  "uri": "https://www.uri-destination.org",
  "order": 0
}
```

## 集群实例路由定义同步

在集群部署的情况下，用户需要实现不同实例之间的路由数据同步，这时我们可以通过配置`spring.cloud.gateway.redis-route-definition-repository.enabled=true`来实现。

## 问题处理

有时为了定位问题，我们需要知道网关接收到的数据和发出去的数据，这时我们可以通过配置`spring.cloud.gateway.httpserver.wiretap=true`和`spring.cloud.gateway.httpclient.wiretap=true`来实现对出入数据的监控。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
