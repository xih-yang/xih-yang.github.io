# 03、SpringCloud Gateway 详解配置
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/3.html
- 分类：API网关
- 分组：SpringCloud Gateway
**1、** yml文件配置；

**2、** NewBean配置；

常用的Route Predicate Factory介绍

用来构建 API 网关。Spring Cloud Gateway 旨在提供一种简单而有效的方式来路由到 API，并为它们提供横切关注点，例如：安全性、监控/指标和弹性。

## SpringCloud Gateway 特点

- 动态路由：能够匹配任何请求属性的路由
- 谓词和过滤器特定于路由
- 熔断器集成
- 易于编写谓词和过滤器
- 集成SpringCloud的服务发现功能
- 请求速率限制
- 路径重写

## 从0到1构建Gateway

### 1、手动构建

**1.点击[SpringGateway初始化](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.5.5&packaging=jar&jvmVersion=11&groupId=com.example&artifactId=gateway&name=gateway&description=Demo%20project%20for%20Spring%20Boot&packageName=com.example.gateway&dependencies=cloud-gateway,cloud-resilience4j,cloud-contract-stub-runner) 会显示如下页面，点击GENRATE下载配置好的压缩包。**

> 请按需和实际场景选择 构建方式、语言、SpringBoot版本、打包方式和Java版本。

### 2、解压缩下载好的Gateway项目压缩包，用你喜欢的IDE打开，项目结构如下：

## 基本配置

### 1、Route组成

Route是网关的基本组成单元，它是由ID，目标URI和一组predicates和一组filters组成，如果一组断言结果为真，则匹配路由，目标URI会被访问。

**注意：**

- 多个 Predicate 之间是 逻辑and 的关系。
- 多个Predicate是从定义的顺序从上到下依次执行,也可以指定 order 属性的值。

### 2、配置方式

Gateway 提供了两种不同的方式来配置路由，一种是通过yml文件来配置，另一种是通过New Bean来配置。

**uri解析**

- http前缀

路由匹配完成后跳转到此地址

- lb前缀

> lb代表负载均衡，service-name代表服务注册中心该服务注册的服务名

### 3、yml文件配置

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
          #路由的ID 唯一即可
        - id: USER-CENTER
          #路由的地址
          uri:  http://localhost:8888/
         #uri:  lb://service-name 
          predicates:
            - Path=/user/**
```

### 4、New Bean配置

```java
package com.example.gateway.config;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * @author Yellow Duck 🦆
 * @date 2022-04-27 15:21
 */
@Configuration
public class GatewayConfig {
    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                //配置路由
                .route("USER-CENTER", r -> r.path("/user")
                        .uri("http://localhost:8888"))
                .build();
    }
}
```

**使用效果：**

- 启动服务后，可以通过终端或者Postman等工具调用 [http://localhost:8889/user](http://localhost:8889/user)
- 会发现请求被路由转发到[http://localhost:8888/user](http://localhost:8888/user)

## Route Predicate Factory

### 1、After

作用：请求在指定时间之后才匹配

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
                - After=2022-04-27T16:35:04.030+08:00[Asia/Shanghai]
```

### 2、Before

作用：请求在指定时间之前才匹配

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
                - Before=2022-04-27T16:35:04.030+08:00[Asia/Shanghai]
```

### 3、Between

作用：请求在指定时间区间之内才匹配，

🦆：第一个时间需要小于第二个时间。

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
            - Between=2022-04-22T16:00:00.020+08:00[Asia/Shanghai],2022-04-22T16:30:00.020+08:00[Asia/Shanghai]
```

### 4、Cookie

作用：请求携带指定Cookie才匹配

🦆：只有当请求Cookie中带有 name=yellowDuck 才可以匹配到此路由

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
            - Cookie=name,yellowDuck
```

### 5、Header

作用：请求携带指定Header才匹配

🦆：只有当请求Header种中带有 X-User-Id:001 才可以匹配到此路由，其中\d+为校验数字正则表达式，可以根据需要自己定制。

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
            - Header=X-User-Id,\d+
```

### 6、Host

作用：请求携带指定Host才匹配

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
            - Host=**.yellowDuck.com
```

### 7、Method

作用：请求指定Mehtod请求方式才匹配

🦆：只有GET,POST,DELETE请求才可以访问

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
            - Method=GET,POST,DELETE
```

### 8、Path

作用：请求路径匹配

🦆：只有包含配置的路径才可以匹配 也可以支持/duck/{color}参数形式

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
            - Path=/duck/**
```

### 9、Query

作用：请求参数包含才匹配

🦆：请求中必须有duck这个参数才可以访问

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
            - Query=duck
```

### 10、RemoteAddr

作用：请求的IP/IP段一致才可以访问

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
            - RemoteAddr=127.0.0.1/24
```

### 11、Weight

作用：根据权重的分配路由到相应的请求

🦆：group分组，wight权重，是一个int值，下面代表有90%的请求会分配到[http://localhost:8888/](http://localhost:8888/)有10%请求会分配到[http://localhost:8887](http://localhost:8887)

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          predicates:
            - Weight=group1,9
        - id: DUCK-CENTER #路由的ID
          uri: http://localhost:8887/ #匹配后路由地址
          predicates:
            - Weight=group2,1
```

## Route Filters

> 过滤器 Filter 将会对请求和响应进行修改处理，路由过滤器只能指定路由进行使用。

### 1、AddRequestParameter

作用：对请求添加参数

🦆：如下对GET请求添加 duck=yellow 相当于 ?duck=yellow

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          filters:
            - AddRequestParameter=duck,yellow
          predicates:
            - Method=GET
```

### 2、StripPrefix GatewayFilter

作用：对指定数量的路径进行删除过滤

🦆：比如 [http://localhost:8888/yellow/big/duck](http://localhost:8888/duck/yellow/big) 过滤前两个路径后会变成 [http://localhost:8888/duck](http://localhost:8888/duck/yellow/big)

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          filters:
            - Path=/duck/**
          predicates:
            - StripPrefix=2
```

### 3、PrefixPath GatewayFilter

作用：对指定的路径进行增加

🦆：比如 [http://localhost:8888/duck](http://localhost:8888/duck/yellow/big) 过滤增加路径后会变成 [http://localhost:8888/yellow/duck](http://localhost:8888/duck/yellow/big)

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          filters:
            - Method=POST
          predicates:
            - PrefixPath=/yellow
```

### 4、Hystrix GatewayFilter

**1、** 首先需要添加Hystrix依赖，Hystrix提供了熔断和降级；

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
</dependency>
```

**2、** 编写服务降级的处理类；

```java
package com.gostop.cloud.gateway.config;
import com.gostop.cloud.gateway.handle.HystrixFallbackHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RequestPredicates;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
/**
 *
 * @date 2022-04-28 15:02
 * @author YellowDuck
 */
@Configuration
public class GatewayFallbackConfiguration {
    @Autowired
    private HystrixFallbackHandler hystrixFallbackHandler;
    @Bean
    public RouterFunction routerFunction() {
        return RouterFunctions.route(
                RequestPredicates.GET("/defaultfallback")
                        .and(RequestPredicates.accept(MediaType.TEXT_PLAIN)), hystrixFallbackHandler);
    }
}
```

```java
package com.gostop.cloud.gateway.handle;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.HandlerFunction;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;
/**
 * 覆盖异常处理
 * @date 2022-04-28 15:03
 * @author Yellow Duck
 */
@Slf4j
@Component
public class HystrixFallbackHandler implements HandlerFunction<ServerResponse> {
    @Override
    public Mono<ServerResponse> handle(ServerRequest serverRequest) {
        serverRequest.attribute(ServerWebExchangeUtils.GATEWAY_ORIGINAL_REQUEST_URL_ATTR)
                .ifPresent(originalUrls -> log.error("=====网关执行请求:{}失败,服务降级处理=====", originalUrls));
        return ServerResponse
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON_UTF8)
                .body(BodyInserters.fromValue("网络繁忙！"));
    }
}
```

作用：提供了熔断和降级功能

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          filters:
            - name: Hystrix
              args:
                name: fallback
                fallbackUri: forward:/defaultfallback
          predicates:
            - Method=GET
```

### 5、RequestRateLimiter GatewayFilter

引入Redis限流

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
</dependency>
```

作用：用于限流

```sh
#GateWay项目端口号
server:
  port: 8889
spring:
  cloud:
    gateway:
      routes:
        - id: USER-CENTER #路由的ID
          uri:  http://localhost:8888/ #匹配后路由地址
          filters:
            - name: RequestRateLimiter
              args:
                #每秒允许处理的请求数量
                redis-rate-limiter.replenishRate: 10 
                #每秒最大处理的请求数量
                redis-rate-limiter.burstCapacity: 20 
                redis-rate-limiter.requestedTokens: 1
          predicates:
            - Method=GET,POST
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
