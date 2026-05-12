# 12、SpringCloud Gateway 限流算法使用案例详解及源码解析
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/28.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 四种常见的限流算法

[原文链接](https://blog.csdn.net/weixin_41846320/article/details/95941361)

### 1、计数器（固定窗口）算法

计数器算法是使用计数器在周期内累加访问次数，当达到设定的限流值时，触发限流策略。下一个周期开始时，进行清零，重新计数。

此算法在单机还是分布式环境下实现都非常简单，使用redis的incr原子自增性和线程安全即可轻松实现。

这个算法通常用于QPS限流和统计总访问量，对于秒级以上的时间周期来说，会存在一个非常严重的问题，那就是临界问题，如下图：

假设1min内服务器的负载能力为100，因此一个周期的访问量限制在100，然而在第一个周期的最后5秒和下一个周期的开始5秒时间段内，分别涌入100的访问量，虽然没有超过每个周期的限制量，但是整体上10秒内已达到200的访问量，已远远超过服务器的负载能力，由此可见，计数器算法方式限流对于周期比较长的限流，存在很大的弊端。

### 2、滑动窗口算法

滑动窗口算法是将时间周期分为N个小周期，分别记录每个小周期内访问次数，并且根据时间滑动删除过期的小周期。

如下图，假设时间周期为1min，将1min再分为2个小周期，统计每个小周期的访问数量，则可以看到，第一个时间周期内，访问数量为75，第二个时间周期内，访问数量为100，超过100的访问则被限流掉了。

由此可见，当滑动窗口的格子划分的越多，那么滑动窗口的滚动就越平滑，限流的统计就会越精确。

此算法可以很好的解决固定窗口算法的临界问题。

### 3、漏桶算法

漏桶算法是访问请求到达时直接放入漏桶，如当前容量已达到上限（限流值），则进行丢弃（触发限流策略）。漏桶以固定的速率进行释放访问请求（即请求通过），直到漏桶为空。

### 4、令牌桶算法

令牌桶算法是程序以r（r=时间周期/限流值）的速度向令牌桶中增加令牌，直到令牌桶满，请求到达时向令牌桶请求令牌，如获取到令牌则通过请求，否则触发限流策略

**各个算法比较**

## Spring Cloud Gateway 限流源码

Spring Cloud Gateway提供了RequestRateLimiter 网关过滤器用于限流， 使用 Redis + Lua +令牌桶算法实现分布式限流。而限流的粒度，支持 URL、用户、IP 等。

被限流时响应`HTTP 429 - Too Many Requests`信息。

`RequestRateLimiter`源码：

```java
public GatewayFilter apply(RequestRateLimiterGatewayFilterFactory.Config config) {
    // 获得 KeyResolver，限流键解析器。默认情况下，使用 PrincipalNameKeyResolver
    KeyResolver resolver = (KeyResolver)this.getOrDefault(config.keyResolver, this.defaultKeyResolver);
    RateLimiter<Object> limiter = (RateLimiter)this.getOrDefault(config.rateLimiter, this.defaultRateLimiter);
    boolean denyEmpty = (Boolean)this.getOrDefault(config.denyEmptyKey, this.denyEmptyKey);
    HttpStatusHolder emptyKeyStatus = HttpStatusHolder.parse((String)this.getOrDefault(config.emptyKeyStatus, this.emptyKeyStatusCode));
    return (exchange, chain) -> {
        return resolver.resolve(exchange).defaultIfEmpty("____EMPTY_KEY__").flatMap((key) -> {
            if ("____EMPTY_KEY__".equals(key)) {
                if (denyEmpty) {
                    ServerWebExchangeUtils.setResponseStatus(exchange, emptyKeyStatus);
                    return exchange.getResponse().setComplete();
                } else {
                    return chain.filter(exchange);
                }
            } else {
                String routeId = config.getRouteId();
                if (routeId == null) {
                    Route route = (Route)exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
                    routeId = route.getId();
                }
                return limiter.isAllowed(routeId, key).flatMap((response) -> {
                    Iterator var4 = response.getHeaders().entrySet().iterator();
                    while(var4.hasNext()) {
                        Entry<String, String> header = (Entry)var4.next();
                        exchange.getResponse().getHeaders().add((String)header.getKey(), (String)header.getValue());
                    }
                    // 允许访问
                    if (response.isAllowed()) {
                        return chain.filter(exchange);
                    } else {
                        // 被限流，不允许访问
                        ServerWebExchangeUtils.setResponseStatus(exchange, config.getStatusCode());
                        return exchange.getResponse().setComplete();
                    }
                });
            }
        });
    };
}
```

可以在源码中看到限流LUA 脚本。

限流的核心在isAllowed方法中对限流进行判断：

```java
public Mono<Response> isAllowed(String routeId, String id) {
    if (!this.initialized.get()) {
        throw new IllegalStateException("RedisRateLimiter is not initialized");
    } else {
        // 获取RedisRateLimiter配置 
        RedisRateLimiter.Config routeConfig = this.loadConfiguration(routeId);
        int replenishRate = routeConfig.getReplenishRate();
        int burstCapacity = routeConfig.getBurstCapacity();
        int requestedTokens = routeConfig.getRequestedTokens();
        try {
            // 限流的Key =>request_rate_limiter.{/app-service001/app1/test}.tokens
            // request_rate_limiter.{/app-service001/app1/test}.timestamp
            List<String> keys = getKeys(id);
            List<String> scriptArgs = Arrays.asList(replenishRate + "", burstCapacity + "", Instant.now().getEpochSecond() + "", requestedTokens + "");			// 执行限流脚本 
            Flux<List<Long>> flux = this.redisTemplate.execute(this.script, keys, scriptArgs);
            return flux.onErrorResume((throwable) -> {
                if (this.log.isDebugEnabled()) {
                    this.log.debug("Error calling rate limiter lua", throwable);
                }
                return Flux.just(Arrays.asList(1L, -1L));
            }).reduce(new ArrayList(), (longs, l) -> {
                longs.addAll(l);
                return longs;
            }).map((results) -> {
                // 判断结果
                boolean allowed = (Long)results.get(0) == 1L;
                Long tokensLeft = (Long)results.get(1);
                Response response = new Response(allowed, this.getHeaders(routeConfig, tokensLeft));
                if (this.log.isDebugEnabled()) {
                    this.log.debug("response: " + response);
                }
                return response;
            });
        } catch (Exception var10) {
            this.log.error("Error determining if user allowed from redis", var10);
            return Mono.just(new Response(true, this.getHeaders(routeConfig, -1L)));
        }
    }
}
```

## 案例演示

接下来，我们使用令牌桶算法，实现各种限流。

因为需要用到Redis，所以添加Redis的依赖和配置：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
</dependency>
```

```bash
spring:
  redis:
    host: 127.0.0.1
    port: 6379
    password: 123456
    timeout: 20000
    jedis:
      pool:
        max-active: 8
        min-idle: 0
        max-idle: 8
        max-wait: -1
```

### 1. URI限流

URI限流，就是针对同一个访问路径进行限流。

首先我们可以定义一个KeyResolver，设置Key生成的策略为请求的URI：

```java
public class UriKeyResolver implements KeyResolver {
    public static final String BEAN_NAME = "uriKeyResolver";
    @Override
    public Mono<String> resolve(ServerWebExchange exchange) {
          return Mono.just(exchange.getRequest().getURI().getPath());
    }
}
```

然后在`@Configuration`类中注入KeyResolver。

```java
    @Bean
    public UriKeyResolver uriKeyResolver() {
        return new UriKeyResolver();
    }
    @Bean
    @Primary
    public PrincipalNameKeyResolver principalNameKeyResolver() {
        return new PrincipalNameKeyResolver();
    }
```

添加限流的配置：

```bash
spring:
  cloud:
    gateway:
      discovery:
        locator:
          开启服务发现动态路由
          enabled: true
          是否将服务名称小写
          lower-case-service-id: true
      filter:
        request-rate-limiter:
          是否拒绝限流时，Key为空的请求
          deny-empty-key: true
          Key为空响应状态码
          empty-key-status-code: 400
      default-filters:
        - name: RequestRateLimiter
          args:
              key-resolver: '#{@uriKeyResolver}'    使用SpEL表达式按名称 引用Key生成器 bean
              redis-rate-limiter.replenishRate: 1  令牌桶每秒填充速率
              redis-rate-limiter.burstCapacity: 2  令牌桶总容量
              redis-rate-limiter.requestedTokens: 1 每次消耗令牌个数
```

访问路由，发现在Redis中，按照请求路径生成了一个Key，因为演示设置的时间很短，所以马上过期了。

然后发现，快速刷新页面时，触发限流规则，返回429 状态码。

### 2. 参数限流

按照上面配置规则，其他限流方式，只需要修改KeyResolver就可以了。

添加根据参数限流的KeyResolver。

```java
public class ParamsKeyResolver implements KeyResolver {
    public static final String BEAN_NAME = "paramsKeyResolver";
    @Override
    public Mono<String> resolve(ServerWebExchange exchange) {
        return Mono.just(Objects.requireNonNull(exchange.getRequest().getQueryParams().getFirst("name")));
    }
}
```

注入到IOC中。

```java
    @Bean
    public ParamsKeyResolver paramsKeyResolver() {
        return new ParamsKeyResolver();
    }
```

配置过滤器使用的KeyResolver为 ParamsKeyResolver。

```java
      default-filters:
        - name: RequestRateLimiter
          args:
              key-resolver: '#{@paramsKeyResolver}'    使用SpEL表达式按名称 引用Key生成器 bean
```

使用相同参数去访问时，会触发限流

### 3. IP限流

写一个根据请求中的RemoteAddr 生成KeyResolver 的解析器就可以了，其他步骤和上面的一样就不赘述了。

```java
public class IpKeyResolver implements KeyResolver {
    public static final String BEAN_NAME = "ipKeyResolver";
    @Override
    public Mono<String> resolve(ServerWebExchange exchange) {
        return Mono.just(Objects.requireNonNull(Objects.requireNonNull(exchange.getRequest().getRemoteAddress()).getHostName()));
    }
}
```

### 4. 接入Sentinel 限流

Spring Cloud Gateway 虽然提供了一些限流策略，但实际上功能太少，不够灵活，所以一般都会使用第三方限流组件，比如阿里巴巴的Sentinel。
