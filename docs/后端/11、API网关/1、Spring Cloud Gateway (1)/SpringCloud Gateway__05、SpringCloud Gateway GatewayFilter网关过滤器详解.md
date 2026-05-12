# 05、SpringCloud Gateway GatewayFilter网关过滤器详解
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/21.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 前言

Spring Cloud Gateway 中的 Filter分为两种类型，分别是Gateway Filter和Global Filter。过滤器将会对请求和响应进行处理.。比如添加参数、URL重写等。

`GatewayFilter`是一个接口，其有很多实现类，这是 Spring Cloud Gateway已经提供了的，使用的时候只需要在yml中配置即可。

## 默认网关过滤器

Spring Cloud Gateway 定义的网关过滤器看类名就能见名知意。

### AddRequestHeader

`AddRequestHeader`需要name和value参数。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: add_request_header_route
        uri: https://example.org
        filters:
        - AddRequestHeader=X-Request-red, blue
```

示例表示将X-Request-red：blue消息头添加到所有匹配请求的下游请求消息头中。

### AddRequestParameter

`AddRequestParamete`需要name和value参数。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: add_request_parameter_route
        uri: https://example.org
        filters:
        - AddRequestParameter=red, blue
```

表示将red=blue添加到下游请求参数中。

### AddResponseHeader

`AddResponseHeader`需要name和value参数。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: add_response_header_route
        uri: https://example.org
        filters:
        - AddResponseHeader=X-Response-Red, Blue
```

表示将X-Response-Foo：Bar添加到所有匹配请求的下游响应消息头中。

### DedupeResponseHeader

`DedupeResponseHeader` 剔除重复的响应头，接受一个name参数和一个可选strategy参数。name可以包含以空格分隔的标题名称列表。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: dedupe_response_header_route
        uri: https://example.org
        filters:
        - DedupeResponseHeader=Access-Control-Allow-Credentials Access-Control-Allow-Origin
```

如果网关 CORS 逻辑和下游逻辑都添加了响应头Access-Control-Allow-Credentials和Access-Control-Allow-Origin响应头的重复值，这将删除它们。

该DedupeResponseHeader过滤器还接受一个可选的strategy参数。接受的值为RETAIN_FIRST（默认）、RETAIN_LAST、 和RETAIN_UNIQUE。

### CircuitBreaker

`CircuitBreaker`使用 Spring Cloud Circuit Breaker API 将网关路由包装在断路器中。Spring Cloud Circuit Breaker 支持多个可与 Spring Cloud Gateway 一起使用的库。Spring Cloud 支持开箱即用的 Resilience4J。

要启用Spring Cloud Circuit Breaker 过滤器，您需要放置`spring-cloud-starter-circuitbreaker-reactor-resilience4j`在类路径上。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: circuitbreaker_route
        uri: https://example.org
        filters:
        - CircuitBreaker=myCircuitBreaker
```

### FallbackHeaders

`FallbackHeaders`允许您在转发到fallbackUri外部应用程序中的请求的标头中添加 Spring Cloud Circuit Breaker 执行异常详细信息

。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: ingredients
        uri: lb://ingredients
        predicates:
        - Path=//ingredients/**
        filters:
        - name: CircuitBreaker
          args:
            name: fetchIngredients
            fallbackUri: forward:/fallback
      - id: ingredients-fallback
        uri: http://localhost:9994
        predicates:
        - Path=/fallback
        filters:
        - name: FallbackHeaders
          args:
            executionExceptionTypeHeaderName: Test-Header
```

在此示例中，在运行断路器时发生执行异常后，请求将转发到fallback运行于 localhost:9994上的应用程序中的端点或处理程序。带有异常类型、消息和（如果可用）根本原因异常类型和消息的标头由FallbackHeaders过滤器添加到该请求中。

您可以通过设置以下参数的值（显示为默认值）来覆盖配置中标题的名称：

- executionExceptionTypeHeaderName (“Execution-Exception-Type”)
- executionExceptionMessageHeaderName (“Execution-Exception-Message”)
- rootCauseExceptionTypeHeaderName (“Root-Cause-Exception-Type”)
- rootCauseExceptionMessageHeaderName (“Root-Cause-Exception-Message”)

### MapRequestHeader

`MapRequestHeader` 采用fromHeader和toHeader参数。它创建一个新的命名标头 ( toHeader)，并从传入的 http 请求中从现有命名标头 ( fromHeader) 中提取值。如果输入标头不存在，则过滤器没有影响。如果新命名的标头已存在，则其值将使用新值进行扩充。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: map_request_header_route
        uri: https://example.org
        filters:
        - MapRequestHeader=Blue, X-Request-Red
```

以上配置表示这将X-Request-Red:使用来自传入 HTTP 请求Blue标头的更新值向下游请求添加标头。

### PrefixPath

`PrefixPath`采用单个prefix参数。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: prefixpath_route
        uri: https://example.org
        filters:
        - PrefixPath=/mypath
```

以上配置表示将/mypath作为所有匹配请求路径的前缀。因此，将向/hello 发送请求/mypath/hello。

### PreserveHostHeader

`PreserveHostHeade`没有参数。此过滤器设置路由过滤器检查的请求属性，以确定是否应发送原始Host 消息头，而不是由 HTTP 客户端确定的Host 消息头。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: preserve_host_route
        uri: https://example.org
        filters:
        - PreserveHostHeader
```

### RequestRateLimiter

`RequestRateLimiter`使用RateLimiter实现是否允许继续执行当前请求。如果不允许继续执行，则返回HTTP 429 - Too Many Requests （默认情况下）。用于限流，后续详解。

### RedirectTo

`RedirectTo`需要两个参数，status和url。该status参数应该是300系列HTTP重定向代码，如301，url参数应该是一个有效的URL。这是消息头的Location值。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: prefixpath_route
        uri: https://example.org
        filters:
        - RedirectTo=302, https://acme.org
```

以上配置表示，将设置302状态码，并添加Location为 https://acme.org的消息头。

### RemoveRequestHeader

`RemoveRequestHeader` 需要一个name参数。它是要删除的请求消息头的名称。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: removerequestheader_route
        uri: https://example.org
        filters:
        - RemoveRequestHeader=X-Request-Foo
```

这会在向下游发送之前删除标头X-Request-Foo。

### RemoveResponseHeader

`RemoveResponseHeader`工厂需要一个name参数。它是要删除的响应消息头的名称。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: removeresponseheader_route
        uri: https://example.org
        filters:
        - RemoveResponseHeader=X-Response-Foo
```

这将在响应返回到网关客户端之前从响应中删除标头X-Response-Foo。

要删除任何类型的敏感标头，您应该为您可能想要这样做的任何路由配置此过滤器。此外，您可以使用此过滤器配置一次spring.cloud.gateway.default-filters并将其应用于所有路由。

### RemoveRequestParameter

`RemoveRequestParameter`需要一个name参数。它是要删除的请求参数的名称。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: removerequestparameter_route
        uri: https://example.org
        filters:
        - RemoveRequestParameter=red
```

这将在将参数发送到下游之前删除参数red。

### RewritePath

`RewritePath`采用regexp参数和replacement参数。使用 Java 正则表达式来灵活地重写请求路径。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: rewritepath_route
        uri: https://example.org
        predicates:
        - Path=/red/**
        filters:
        - RewritePath=/red/?(?<segment>.*), /$\{
     segment}
```

对于/red/blue的请求路径，这会在发出下游请求之前将路径设置为/blue。

### RewriteLocationResponseHeader

`RewriteLocationResponseHeade`r修改响应头Location的值，通常摆脱于后端的具体细节。需要stripVersionMode，locationHeaderName，hostValue，和protocolsRegex参数。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: rewritelocationresponseheader_route
        uri: http://example.org
        filters:
        - RewriteLocationResponseHeader=AS_IN_REQUEST, Location, ,
```

该stripVersionMode参数具有以下可能的值：NEVER_STRIP、AS_IN_REQUEST（默认）和ALWAYS_STRIP。

- NEVER_STRIP: 版本不会被剥离，即使原始请求路径不包含版本。
- AS_IN_REQUEST 仅当原始请求路径不包含版本时才会剥离版本。
- ALWAYS_STRIP 版本总是被剥离，即使原始请求路径包含版本。

该hostValue参数（如果提供）用于替换host:port响应Location标头的部分。如果未提供，Host则使用请求标头的值。

protocolsRegex参数必须是一个有效的正则表达式String，抵靠该协议名称匹配。如果不匹配，则过滤器不执行任何操作。默认为http|https|ftp|ftps。

### RewriteResponseHeader

`RewriteResponseHeader` 需要name，regexp和replacement参数。它使用 Java 正则表达式来灵活地重写响应头值。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: rewriteresponseheader_route
        uri: https://example.org
        filters:
        - RewriteResponseHeader=X-Response-Red, , password=[^&]+, password=***
```

对于/aaa?user=ford&password=omg!what&flag=true的 header 值，在发出下游请求后设置为/aaa?user=ford&password=***&flag=true。

### SaveSession

`SaveSession`在向下游服务转发请求之前强制执行 WebSession::save操作。这在将Spring Session 之类的东西与惰性数据存储一起使用时特别有用，并且您需要确保在进行转发调用之前已保存会话状态。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: save_session
        uri: https://example.org
        predicates:
        - Path=/foo/**
        filters:
        - SaveSession
```

### SecureHeaders

`SecureHeaders`会向响应添加多个头数据，括号中是默认值:

- X-Xss-Protection:1 (mode=block)
- Strict-Transport-Security (max-age=631138519)
- X-Frame-Options (DENY)
- X-Content-Type-Options (nosniff)
- Referrer-Policy (no-referrer)
- Content-Security-Policy (default-src ‘self’ https:; font-src ‘self’ https: data:; img-src ‘self’ https: data:; object-src ‘none’; script-src https:; style-src ‘self’ https: ‘unsafe-inline)’
- X-Download-Options (noopen)
- X-Permitted-Cross-Domain-Policies (none)

要更改默认值，请在spring.cloud.gateway.filter.secure-headers命名空间中设置适当的属性。以下属性可用：

- xss-protection-header
- strict-transport-security
- x-frame-options
- x-content-type-options
- referrer-policy
- content-security-policy
- x-download-options
- x-permitted-cross-domain-policies

要禁用默认值，请spring.cloud.gateway.filter.secure-headers.disable使用逗号分隔值设置属性。以下示例显示了如何执行此操作：

```bash
spring.cloud.gateway.filter.secure-headers.disable=x-frame-options,strict-transport-security
```

### SetPath

`SetPath` 输入一个参数：template，匹配 Spring Framework URI 路径模板并修改，允许多个匹配

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: setpath_route
        uri: http://www.hxmec.com
        predicates:
        - Path=/foo/{
     segment}
        filters:
        - SetPath=/{
     segment}
```

如上所示，请求 /foo/bar 会被设置为 /bar 到下游。

### SetRequestHeader

`setRequestHeader`重置请求头的值，使用 name 和 value 参数接收值

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: setrequestheader_route
        uri: https://www.hxmec.com
        filters:
        - SetRequestHeader=X-Request-Foo, Bar
```

与AddRequestHeader不同的是，这是替换 Header 而不是添加

### SetResponseHeader

`SetResponseHeader`采用name和value参数。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: setresponseheader_route
        uri: https://example.org
        filters:
        - SetResponseHeader=X-Response-Red, Blue
```

此GatewayFilter 替换（而不是添加）具有给定名称的所有标头。因此，如果下游服务器以X-Response-Red:1234 响应，则将其替换为X-Response-Red:Blue，这是网关客户端将收到的。

### SetStatus

`SetStatus`采用单个参数，status。它必须是有效的 Spring Http Status。它可能是404枚举的整数值或字符串表示形式：NOT_FOUND。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: setstatusstring_route
        uri: https://example.org
        filters:
        - SetStatus=BAD_REQUEST
      - id: setstatusint_route
        uri: https://example.org
        filters:
        - SetStatus=401
```

无论哪种情况，响应的 HTTP 状态都设置为 401。

您可以将 SetStatus 配置为从响应的标头中的代理请求返回原始 HTTP 状态代码。如果配置了以下属性，则将标头添加到响应中：

```bash
spring:
  cloud:
    gateway:
      set-status:
        original-status-header-name: original-http-status
```

### StripPrefix

`StripPrefix` 有一个参数：parts。该parts参数指示在将请求发送到下游之前要从请求中剥离的路径中的部分数。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: nameRoot
        uri: https://nameservice
        predicates:
        - Path=/name/**
        filters:
        - StripPrefix=2
```

当通过网关向/name/blue/red发出请求时，向 nameservice发出的请求看起来像nameservice/red.

### Retry

该过滤器用于重试请求，支持如下参数的配置：

- retries: 重试的次数
- statuses: 应被重试的 HTTP Status Codes，参考 org.springframework.http.HttpStatus
- methods: 应被重试的 HTTP Methods，参考org.springframework.http.HttpMethod
- series: 应被重试的 Status Codes 系列，参考 org.springframework.http.HttpStatus.Series
- exceptions: 应被重试的异常列表
- backoff: 为重试配置指数级的 backoff。重试时间间隔的计算公式为 firstBackoff * (factor ^ n)，n 是重试的次数；如果设置了 maxBackoff，最大的 backoff 限制为 maxBackoff. 如果 basedOnPreviousValue 设置为 true, backoff 计算公式为 prevBackoff * factor.

如果Retry filter 启用，默认配置如下：

- retries — 3 times
- series — 5XX series
- methods — GET method
- exceptions — IOException and TimeoutException
- backoff — disabled

以下是Retry配置示例：

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: retry_test
        uri: http://localhost:8080/flakey
        predicates:
        - Host=*.retry.com
        filters:
        - name: Retry
          args:
            retries: 3
            statuses: BAD_GATEWAY
            methods: GET,POST
            backoff:
              firstBackoff: 10ms
              maxBackoff: 50ms
              factor: 2
              basedOnPreviousValue: false
```

上面例子，当下游服务返回502状态码时，gateway会重试3次。

**注意**：当将重试过滤器与带有forward:前缀的 URL 一起使用时，应仔细编写目标端点，以便在发生错误的情况下，它不会做任何可能导致响应发送到客户端并提交的操作。 例如，如果目标端点是带注释的控制器，则目标控制器方法不应返回带有错误状态代码的 ResponseEntity。 相反，它应该引发 Exception 或发出错误信号（例如，通过Mono.error(ex)返回值），可以配置重试过滤器来进行重试处理。

**警告**：当将重试过滤器与任何带有 body 的 HTTP方法一起使用时，body 将被缓存，并且网关将受到内存的限制。 body 将缓存在 ServerWebExchangeUtils.CACHED_REQUEST_BODY_ATTR定义的请求属性中，对象的类型是org.springframework.core.io.buffer.DataBuffer。

可以使用单个status和来添加简化的“快捷方式”符号method。

下面两个例子是等价的：

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: retry_route
        uri: https://example.org
        filters:
        - name: Retry
          args:
            retries: 3
            statuses: INTERNAL_SERVER_ERROR
            methods: GET
            backoff:
              firstBackoff: 10ms
              maxBackoff: 50ms
              factor: 2
              basedOnPreviousValue: false
      - id: retryshortcut_route
        uri: https://example.org
        filters:
        - Retry=3,INTERNAL_SERVER_ERROR,GET,10ms,50ms,2,false
```

### RequestSize

RequestSize 当请求大小大于允许的限制时，RequestSize可以限制请求到达下游服务。过滤器接受一个maxSize参数。可以被定义为一个数字，后跟一个可选的DataUnit后缀，例如“KB”或“MB”。字节的默认值为“Bit”。它是以字节为单位定义的请求的允许大小限制。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: request_size_route
        uri: http://localhost:8080/upload
        predicates:
        - Path=/upload
        filters:
        - name: RequestSize
          args:
            maxSize: 5000000
```

RequestSize设置响应状态作为413 ，errorMessage为Payload Too Large与另外的报头时，请求被由于尺寸拒绝。以下示例显示了这样的errorMessage：

```bash
errorMessage : Request size is larger than permissible limit. Request size is 6.0 MB where permissible limit is 5.0 MB
```

如果未在路由定义中作为过滤器参数提供，则默认请求大小设置为 5 MB。

### SetRequestHostHeader

`SetRequestHostHeader`在某些情况下，可能需要覆盖消息头Host。在这种情况下，SetRequestHostHeade可以用指定的值替换现有的Host。过滤器接受一个host参数。

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: set_request_host_header_route
        uri: http://localhost:8080/headers
        predicates:
        - Path=/headers
        filters:
        - name: SetRequestHostHeader
          args:
            host: example.org
```

该SetRequestHostHeade替换Host的值为example.org。

### ModifyRequestBody

`ModifyRequestBody`修改请求主体，然后将其由网关向下游发送。只能使用 Java DSL 来配置此过滤器。如下示例：

```bash
@Bean
public RouteLocator routes(RouteLocatorBuilder builder) {
    return builder.routes()
        .route("rewrite_request_obj", r -> r.host("*.rewriterequestobj.org")
            .filters(f -> f.prefixPath("/httpbin")
                .modifyRequestBody(String.class, Hello.class, MediaType.APPLICATION_JSON_VALUE,
                    (exchange, s) -> return Mono.just(new Hello(s.toUpperCase())))).uri(uri))
        .build();
}
static class Hello {
    String message;
    public Hello() {
      }
    public Hello(String message) {
        this.message = message;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
}
```

如果请求没有正文，RewriteFilter则将通过null。Mono.empty()应该返回以在请求中分配缺失的主体。

### Token Relay

`Token Relay`是 OAuth2 消费者充当客户端并将传入令牌转发到传出资源请求的地方。消费者可以是纯客户端（如 SSO 应用程序）或资源服务器。

Spring Cloud Gateway 可以将 OAuth2 访问令牌下游转发到它正在代理的服务。要将此功能添加到网关，您需要添加 TokenRelayGatewayFilterFactory如下内容：

```bash
@Bean
public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
    return builder.routes()
            .route("resource", r -> r.path("/resource")
                    .filters(f -> f.tokenRelay())
                    .uri("http://localhost:9000"))
            .build();
}
```

或

```bash
spring:
  cloud:
    gateway:
      routes:
      - id: resource
        uri: http://localhost:9000
        predicates:
        - Path=/resource
        filters:
        - TokenRelay=
```

并且它将（除了登录用户并获取令牌之外）将身份验证令牌下游传递给服务（在本例中 /resource）。

要为Spring Cloud Gateway 启用此功能，请添加以下依赖项

```bash
org.springframework.boot:spring-boot-starter-oauth2-client
```

### Default Filters

要添加过滤器并将其应用于所有路由，您可以使用spring.cloud.gateway.default-filters. 此属性采用过滤器列表。以下清单定义了一组默认过滤器：

```bash
spring:
  cloud:
    gateway:
      default-filters:
      - AddResponseHeader=X-Response-Default-Red, Default-Blue
      - PrefixPath=/httpbin
```
