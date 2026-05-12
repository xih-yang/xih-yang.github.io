# 20、Spring Boot 4 整合 Spring Cloud Gateway 完整教程
- 来源：https://ddkk.com/springboot/4-action/20.html
- 分类：Spring Boot 4 整合教程
- 分组：五、微服务与云原生
- 日期：2025-12-08
做微服务项目的时候,最烦的就是服务发现、负载均衡、统一入口,每个服务都得自己处理这些,代码重复、配置混乱,维护起来要命;后来听说Spring Cloud Gateway这玩意儿不错,功能全、性能好、易扩展,是Spring Cloud生态里最流行的API网关;但是直接用Gateway写,那叫一个复杂,路由配置、过滤器链、负载均衡、限流熔断,一堆配置写得人头疼;后来发现Spring Boot直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合Gateway更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Gateway的。

其实Gateway在Spring Boot里早就支持了,你只要加个`spring-cloud-starter-gateway`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用路由、过滤器、断言、负载均衡、限流熔断这些高级功能,更不知道Gateway和Zuul有啥区别,所以鹏磊今天就给兄弟们掰扯掰扯。

## Gateway基础概念

### Gateway是啥玩意儿

Spring Cloud Gateway是Spring官方提供的API网关,基于Spring WebFlux和Project Reactor构建,提供统一的路由、过滤、限流、熔断等功能;Gateway的核心概念包括:

1. **Route(路由)**: 网关的基本构建块,包含ID、目标URI、断言集合、过滤器集合
2. **Predicate(断言)**: 匹配HTTP请求的条件,比如路径、方法、Header等
3. **Filter(过滤器)**: 在请求转发前后执行的逻辑,比如添加Header、修改请求路径等
4. **GatewayFilter**: 作用于单个路由的过滤器
5. **GlobalFilter**: 作用于所有路由的全局过滤器

### Gateway和Zuul的区别

1. **技术栈**: Gateway基于WebFlux(响应式),Zuul基于Servlet(阻塞式)
2. **性能**: Gateway性能更好,支持异步非阻塞
3. **功能**: Gateway功能更丰富,支持更多过滤器
4. **维护**: Gateway是Spring官方维护,Zuul已经进入维护模式
5. **学习曲线**: Gateway学习曲线稍陡,但功能更强大

### Gateway的核心组件

1. **RouteLocator**: 路由定位器,负责加载路由配置
2. **RoutePredicateFactory**: 断言工厂,创建路由断言
3. **GatewayFilterFactory**: 过滤器工厂,创建网关过滤器
4. **LoadBalancerClient**: 负载均衡客户端,用于服务发现和负载均衡
5. **CircuitBreaker**: 熔断器,用于服务降级和容错

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-gateway-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── gateway/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── config/                    # 配置类目录
│   │   │               ├── filter/                    # 过滤器目录
│   │   │               └── predicate/                 # 断言目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Cloud Gateway最新版本是4.x,需要Spring Cloud 2023.x版本。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-gateway-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Gateway Demo</name>
    <description>Spring Boot 4整合Spring Cloud Gateway示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <spring-cloud.version>2023.0.0</spring-cloud.version>  <!-- Spring Cloud版本 -->
    </properties>
    <dependencyManagement>
        <dependencies>
            <!-- Spring Cloud依赖管理 -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    <dependencies>
        <!-- Spring Cloud Gateway Starter: Gateway核心依赖 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
        <!-- Spring Boot Actuator: 监控和管理支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!-- Spring Cloud LoadBalancer: 负载均衡支持 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-loadbalancer</artifactId>
        </dependency>
        <!-- Spring Cloud Circuit Breaker: 熔断器支持 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-circuitbreaker-reactor-resilience4j</artifactId>
        </dependency>
        <!-- Redis: 限流支持(可选) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
        </dependency>
        <!-- Nacos Discovery: 服务发现支持(可选) -->
        <!--
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        -->
        <!-- Eureka Client: 服务发现支持(可选) -->
        <!--
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
        -->
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包成可执行JAR -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### application.yml配置

Spring Boot 4的Gateway自动配置通过`spring.cloud.gateway.*`属性控制,配置起来贼简单:

```yaml
spring:
  application:
    name: spring-boot-gateway-demo  # 应用名称
  cloud:
    gateway:
      # 全局跨域配置
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins: "*"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            allowedHeaders: "*"
            allowCredentials: true
            maxAge: 3600
      # 路由配置
      routes:
        # 路由1: 用户服务
        - id: user-service-route
          uri: lb://user-service  # lb://表示负载均衡
          predicates:
            - Path=/api/user/**
          filters:
            - StripPrefix=1  # 去掉前缀/api/user
            - AddRequestHeader=X-Request-Id, ${random.uuid}  # 添加请求头
        # 路由2: 订单服务
        - id: order-service-route
          uri: lb://order-service
          predicates:
            - Path=/api/order/**
          filters:
            - StripPrefix=1
            - CircuitBreaker=myCircuitBreaker  # 熔断器
        # 路由3: 商品服务
        - id: product-service-route
          uri: http://localhost:8081  # 直接URL
          predicates:
            - Path=/api/product/**
            - Method=GET,POST  # 只匹配GET和POST请求
          filters:
            - StripPrefix=1
            - RequestRateLimiter=#{@redisRateLimiter}  # 限流
      # 默认过滤器(作用于所有路由)
      default-filters:
        - AddResponseHeader=X-Gateway-Response-Time, ${T(java.time.Instant).now()}
# Actuator配置
management:
  endpoints:
    web:
      exposure:
        include: gateway,health,info  # 暴露Gateway端点
  endpoint:
    gateway:
      enabled: true  # 启用Gateway端点
# 日志配置
logging:
  level:
    org.springframework.cloud.gateway: DEBUG  # 开启Gateway调试日志
    org.springframework.web: DEBUG
```

## 场景一: 基础路由配置

### 应用场景

你的微服务架构需要统一入口,所有请求都通过Gateway转发到后端服务,这是最常见的场景。

### YAML方式配置路由

最简单的方式就是用YAML配置路由,直观易懂:

```yaml
spring:
  cloud:
    gateway:
      routes:
        # 路由1: 转发到用户服务
        - id: user-service
          uri: http://localhost:8081
          predicates:
            - Path=/user/**
          filters:
            - StripPrefix=1  # 去掉/user前缀
        # 路由2: 转发到订单服务
        - id: order-service
          uri: http://localhost:8082
          predicates:
            - Path=/order/**
          filters:
            - StripPrefix=1
        # 路由3: 转发到商品服务
        - id: product-service
          uri: http://localhost:8083
          predicates:
            - Path=/product/**
          filters:
            - StripPrefix=1
```

### Java方式配置路由

用Java代码配置路由,更灵活,适合动态路由:

```java
package com.example.gateway.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * Gateway路由配置
 * 使用Java代码配置路由规则
 */
@Slf4j
@Configuration
public class GatewayRouteConfig {
    /**
     * 配置路由规则
     * 使用RouteLocatorBuilder构建路由
     */
    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // 用户服务路由
                .route("user-service", r -> r
                        .path("/user/**")  // 路径匹配
                        .uri("http://localhost:8081")  // 目标URI
                        .filters(f -> f
                                .stripPrefix(1)  // 去掉前缀
                                .addRequestHeader("X-Request-Id", java.util.UUID.randomUUID().toString())  // 添加请求头
                        )
                )
                // 订单服务路由
                .route("order-service", r -> r
                        .path("/order/**")
                        .uri("http://localhost:8082")
                        .filters(f -> f.stripPrefix(1))
                )
                // 商品服务路由
                .route("product-service", r -> r
                        .path("/product/**")
                        .uri("http://localhost:8083")
                        .filters(f -> f.stripPrefix(1))
                )
                .build();
    }
}
```

### 路由断言(Predicates)

路由断言用于匹配HTTP请求,只有匹配的请求才会被路由:

```java
package com.example.gateway.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.ZonedDateTime;
/**
 * Gateway路由断言配置
 * 演示各种路由断言的使用
 */
@Slf4j
@Configuration
public class GatewayPredicateConfig {
    @Bean
    public RouteLocator predicateRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // 路径断言: 匹配指定路径
                .route("path-route", r -> r
                        .path("/api/user/**")
                        .uri("http://localhost:8081")
                )
                // 方法断言: 只匹配GET请求
                .route("method-route", r -> r
                        .method("GET")
                        .uri("http://localhost:8081")
                )
                // Header断言: 匹配指定Header
                .route("header-route", r -> r
                        .header("X-Request-Id", ".*")
                        .uri("http://localhost:8081")
                )
                // Cookie断言: 匹配指定Cookie
                .route("cookie-route", r -> r
                        .cookie("sessionId", ".*")
                        .uri("http://localhost:8081")
                )
                // Query断言: 匹配查询参数
                .route("query-route", r -> r
                        .query("userId", ".*")
                        .uri("http://localhost:8081")
                )
                // 时间断言: 匹配指定时间之后
                .route("after-route", r -> r
                        .after(ZonedDateTime.now().plusHours(1))
                        .uri("http://localhost:8081")
                )
                // 时间断言: 匹配指定时间之前
                .route("before-route", r -> r
                        .before(ZonedDateTime.now().plusDays(1))
                        .uri("http://localhost:8081")
                )
                // 组合断言: 同时满足多个条件
                .route("combined-route", r -> r
                        .path("/api/**")
                        .and()
                        .method("POST")
                        .and()
                        .header("Content-Type", "application/json")
                        .uri("http://localhost:8081")
                )
                .build();
    }
}
```

## 场景二: 过滤器(Filter)使用

### 应用场景

请求转发前后需要添加Header、修改路径、记录日志等操作,这时候就得用过滤器。

### 内置过滤器

Gateway提供了很多内置过滤器,常用的有:

```java
package com.example.gateway.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * Gateway过滤器配置
 * 演示各种内置过滤器的使用
 */
@Slf4j
@Configuration
public class GatewayFilterConfig {
    @Bean
    public RouteLocator filterRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // AddRequestHeader: 添加请求头
                .route("add-header-route", r -> r
                        .path("/api/**")
                        .uri("http://localhost:8081")
                        .filters(f -> f
                                .addRequestHeader("X-Request-Id", java.util.UUID.randomUUID().toString())
                                .addRequestHeader("X-Gateway", "Spring-Cloud-Gateway")
                        )
                )
                // AddResponseHeader: 添加响应头
                .route("add-response-header-route", r -> r
                        .path("/api/**")
                        .uri("http://localhost:8081")
                        .filters(f -> f
                                .addResponseHeader("X-Response-Time", String.valueOf(System.currentTimeMillis()))
                        )
                )
                // StripPrefix: 去掉路径前缀
                .route("strip-prefix-route", r -> r
                        .path("/api/user/**")
                        .uri("http://localhost:8081")
                        .filters(f -> f.stripPrefix(2))  // 去掉/api/user
                )
                // PrefixPath: 添加路径前缀
                .route("prefix-path-route", r -> r
                        .path("/user/**")
                        .uri("http://localhost:8081")
                        .filters(f -> f.prefixPath("/api"))  // 添加/api前缀
                )
                // RewritePath: 重写路径
                .route("rewrite-path-route", r -> r
                        .path("/old/**")
                        .uri("http://localhost:8081")
                        .filters(f -> f.rewritePath("/old/(?<segment>.*)", "/new/${segment}"))  // /old/xxx -> /new/xxx
                )
                // SetPath: 设置路径
                .route("set-path-route", r -> r
                        .path("/api/user/{id}")
                        .uri("http://localhost:8081")
                        .filters(f -> f.setPath("/user/{id}"))  // 设置新路径
                )
                // RemoveRequestHeader: 移除请求头
                .route("remove-header-route", r -> r
                        .path("/api/**")
                        .uri("http://localhost:8081")
                        .filters(f -> f.removeRequestHeader("X-Secret-Header"))
                )
                // Retry: 重试
                .route("retry-route", r -> r
                        .path("/api/**")
                        .uri("http://localhost:8081")
                        .filters(f -> f
                                .retry(retryConfig -> retryConfig
                                        .setRetries(3)  // 重试3次
                                        .setStatuses(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)  // 500错误时重试
                                )
                        )
                )
                .build();
    }
}
```

### 自定义全局过滤器

实现GlobalFilter接口,创建自定义全局过滤器:

```java
package com.example.gateway.filter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.util.UUID;
/**
 * 自定义全局过滤器
 * 为所有请求添加请求ID
 */
@Slf4j
@Component
public class RequestIdGlobalFilter implements GlobalFilter, Ordered {
    private static final String REQUEST_ID_HEADER = "X-Request-Id";
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        // 如果请求头中没有Request-Id,就生成一个
        if (!request.getHeaders().containsKey(REQUEST_ID_HEADER)) {
            String requestId = UUID.randomUUID().toString();
            ServerHttpRequest modifiedRequest = request.mutate()
                    .header(REQUEST_ID_HEADER, requestId)
                    .build();
            log.info("添加请求ID: {}", requestId);
            // 将修改后的请求传递给下一个过滤器
            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        }
        return chain.filter(exchange);
    }
    /**
     * 过滤器执行顺序
     * 数字越小优先级越高
     */
    @Override
    public int getOrder() {
        return -100;  // 高优先级
    }
}
```

### 自定义路由过滤器

实现GatewayFilter接口,创建自定义路由过滤器:

```java
package com.example.gateway.filter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.util.Arrays;
import java.util.List;
/**
 * 自定义路由过滤器工厂
 * 记录请求处理时间
 */
@Slf4j
@Component
public class ElapsedGatewayFilterFactory extends AbstractGatewayFilterFactory<ElapsedGatewayFilterFactory.Config> {
    public ElapsedGatewayFilterFactory() {
        super(Config.class);
    }
    @Override
    public List<String> shortcutFieldOrder() {
        return Arrays.asList("enabled");
    }
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            if (!config.isEnabled()) {
                return chain.filter(exchange);
            }
            long startTime = System.currentTimeMillis();
            ServerHttpRequest request = exchange.getRequest();
            log.info("请求开始: {} {}", request.getMethod(), request.getURI());
            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                long elapsedTime = System.currentTimeMillis() - startTime;
                log.info("请求完成: {} {}, 耗时: {}ms", 
                        request.getMethod(), request.getURI(), elapsedTime);
            }));
        };
    }
    /**
     * 过滤器配置类
     */
    public static class Config {
        private boolean enabled = true;
        public boolean isEnabled() {
            return enabled;
        }
        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }
}
```

## 场景三: 负载均衡和服务发现

### 应用场景

微服务架构下,同一个服务有多个实例,需要负载均衡分发请求,而且需要自动发现服务实例。

### 负载均衡配置

使用`lb://`协议启用负载均衡:

```yaml
spring:
  cloud:
    gateway:
      routes:
        # 使用负载均衡
        - id: user-service-lb
          uri: lb://user-service  # lb://表示负载均衡
          predicates:
            - Path=/api/user/**
          filters:
            - StripPrefix=1
```

### 服务发现配置

集成Nacos或Eureka进行服务发现:

```yaml
spring:
  cloud:
    gateway:
      # 启用服务发现
      discovery:
        locator:
          enabled: true  # 启用服务发现定位器
          lower-case-service-id: true  # 服务ID转小写
          url-expression: "'lb://'+serviceId"  # URL表达式
```

### Java配置负载均衡

```java
package com.example.gateway.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 负载均衡路由配置
 */
@Slf4j
@Configuration
public class LoadBalancerRouteConfig {
    @Bean
    public RouteLocator loadBalancerRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // 使用lb://协议启用负载均衡
                .route("user-service-lb", r -> r
                        .path("/api/user/**")
                        .uri("lb://user-service")  // lb://表示负载均衡
                        .filters(f -> f.stripPrefix(1))
                )
                .route("order-service-lb", r -> r
                        .path("/api/order/**")
                        .uri("lb://order-service")
                        .filters(f -> f.stripPrefix(1))
                )
                .build();
    }
}
```

## 场景四: 限流和熔断

### 应用场景

高并发场景下需要限流保护后端服务,而且需要熔断机制防止服务雪崩。

### Redis限流配置

使用Redis实现限流:

```java
package com.example.gateway.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;
/**
 * 限流配置
 */
@Slf4j
@Configuration
public class RateLimiterConfig {
    /**
     * 限流键解析器
     * 根据用户IP限流
     */
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String ip = exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
            log.debug("限流键: {}", ip);
            return Mono.just(ip);
        };
    }
    /**
     * 根据用户ID限流
     */
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId == null) {
                userId = "anonymous";
            }
            return Mono.just(userId);
        };
    }
    /**
     * Redis限流器配置
     */
    @Bean
    public RedisRateLimiter redisRateLimiter() {
        // 参数说明:
        // replenishRate: 每秒允许的请求数
        // burstCapacity: 令牌桶容量
        // requestedTokens: 每个请求消耗的令牌数
        return new RedisRateLimiter(10, 20, 1);
    }
}
```

### 限流路由配置

```java
package com.example.gateway.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 限流路由配置
 */
@Slf4j
@Configuration
public class RateLimitRouteConfig {
    private final RedisRateLimiter redisRateLimiter;
    public RateLimitRouteConfig(RedisRateLimiter redisRateLimiter) {
        this.redisRateLimiter = redisRateLimiter;
    }
    @Bean
    public RouteLocator rateLimitRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // 限流路由
                .route("rate-limit-route", r -> r
                        .path("/api/**")
                        .uri("lb://user-service")
                        .filters(f -> f
                                .requestRateLimiter(rateLimiter -> rateLimiter
                                        .setRateLimiter(redisRateLimiter)
                                        .setKeyResolver(new org.springframework.cloud.gateway.filter.ratelimit.KeyResolver() {
                                            @Override
                                            public reactor.core.publisher.Mono<String> resolve(
                                                    org.springframework.web.server.ServerWebExchange exchange) {
                                                return reactor.core.publisher.Mono.just(
                                                        exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                                                );
                                            }
                                        })
                                )
                        )
                )
                .build();
    }
}
```

### 熔断器配置

使用Resilience4j实现熔断:

```java
package com.example.gateway.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.circuitbreaker.resilience4j.ReactiveResilience4JCircuitBreakerFactory;
import org.springframework.cloud.circuitbreaker.resilience4j.Resilience4JConfigBuilder;
import org.springframework.cloud.client.circuitbreaker.Customizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * 熔断器配置
 */
@Slf4j
@Configuration
public class CircuitBreakerConfig {
    /**
     * 配置Resilience4j熔断器
     */
    @Bean
    public Customizer<ReactiveResilience4JCircuitBreakerFactory> defaultCustomizer() {
        return factory -> factory.configureDefault(id -> new Resilience4JConfigBuilder(id)
                .circuitBreakerConfig(io.github.resilience4j.circuitbreaker.CircuitBreakerConfig.ofDefaults())
                .timeLimiterConfig(io.github.resilience4j.timelimiter.TimeLimiterConfig.custom()
                        .timeoutDuration(java.time.Duration.ofSeconds(5))  // 超时时间5秒
                        .build())
                .build());
    }
}
```

### 熔断路由配置

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: circuit-breaker-route
          uri: lb://user-service
          predicates:
            - Path=/api/user/**
          filters:
            - StripPrefix=1
            - CircuitBreaker=myCircuitBreaker  # 使用熔断器
            - CircuitBreakerFallbackUri=forward:/fallback  # 熔断降级URI
```

## 场景五: 认证和授权

### 应用场景

Gateway作为统一入口,需要统一处理认证和授权,避免每个服务都实现一遍。

### JWT认证过滤器

```java
package com.example.gateway.filter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
/**
 * JWT认证全局过滤器
 * 验证JWT Token
 */
@Slf4j
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {
    private static final String TOKEN_PREFIX = "Bearer ";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        // 公开路径不需要认证
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }
        // 获取Token
        String token = getToken(request);
        if (!StringUtils.hasText(token)) {
            log.warn("请求缺少Token: {}", path);
            return unauthorized(exchange);
        }
        // 验证Token(这里简化处理,实际应该调用认证服务验证)
        if (!isValidToken(token)) {
            log.warn("Token无效: {}", path);
            return unauthorized(exchange);
        }
        // Token有效,继续处理
        log.debug("Token验证通过: {}", path);
        return chain.filter(exchange);
    }
    /**
     * 判断是否为公开路径
     */
    private boolean isPublicPath(String path) {
        return path.startsWith("/api/public/") || 
               path.startsWith("/api/auth/login") ||
               path.startsWith("/actuator/");
    }
    /**
     * 从请求头获取Token
     */
    private String getToken(ServerHttpRequest request) {
        String bearerToken = request.getHeaders().getFirst(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(TOKEN_PREFIX)) {
            return bearerToken.substring(TOKEN_PREFIX.length());
        }
        return null;
    }
    /**
     * 验证Token是否有效
     * 实际应该调用认证服务验证
     */
    private boolean isValidToken(String token) {
        // 简化处理,实际应该解析JWT并验证
        return StringUtils.hasText(token);
    }
    /**
     * 返回401未授权响应
     */
    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return response.setComplete();
    }
    @Override
    public int getOrder() {
        return -200;  // 高优先级
    }
}
```

## 最佳实践和注意事项

### 1. 路由配置

1. **路由顺序**: 路由按配置顺序匹配,具体路径应该放在通用路径之前
2. **路由ID**: 路由ID应该唯一且有意义,便于管理和监控
3. **URI配置**: 生产环境使用`lb://`协议启用负载均衡
4. **路径匹配**: 使用通配符匹配时注意性能影响

### 2. 过滤器使用

1. **过滤器顺序**: 注意过滤器的执行顺序,影响请求处理结果
2. **性能考虑**: 避免在过滤器中执行耗时操作
3. **异常处理**: 过滤器中的异常要妥善处理,避免影响请求
4. **日志记录**: 关键操作要记录日志,便于排查问题

### 3. 限流配置

1. **限流策略**: 根据业务需求选择合适的限流策略(IP、用户、接口等)
2. **限流阈值**: 设置合理的限流阈值,既要保护服务又要保证用户体验
3. **限流响应**: 限流时返回友好的错误信息
4. **监控告警**: 限流触发时要及时告警

### 4. 熔断配置

1. **熔断阈值**: 设置合理的熔断阈值和恢复时间
2. **降级策略**: 熔断时要有降级策略,返回默认数据或错误信息
3. **监控告警**: 熔断触发时要及时告警
4. **恢复机制**: 熔断后要有自动恢复机制

### 5. 性能优化

1. **连接池**: 配置合适的HTTP连接池大小
2. **超时设置**: 设置合理的超时时间,避免请求堆积
3. **缓存**: 合理使用缓存,减少后端请求
4. **异步处理**: 非关键操作可以异步处理

## 总结

Spring Boot 4整合Gateway其实不难,核心就几个点:配置路由规则、使用过滤器、启用负载均衡、配置限流熔断;但是要写好也不容易,路由设计、过滤器链、性能优化、监控告警,一堆细节要注意;Gateway相比Zuul性能更好、功能更丰富,是微服务架构的首选API网关;鹏磊今天给兄弟们讲了基础路由、过滤器、负载均衡、限流熔断、认证授权这几个场景,基本上覆盖了大部分使用场景;兄弟们按需选择,有啥问题随时问,鹏磊看到就回。
