# 07、SpringCloud Gateway 路由规则
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/7.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 1、路由

Spring Cloud Gateway包含许多内置的路由断言Factories。这些断言都匹配HTTP请求的不同属性。

### 1.1、After 路由断言

After Route Predicate 在该日期时间之后发生的请求都将被匹配（UTC日期个数xxxx-xx-xxTxx:xx:xx+08:00[Asia/Shanghai]）

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: after_route
        uri: http://localhost:8080
        predicates:
        - After=2022-03-30T18:00:00+08:00[Asia/Shanghai]
```

### 1.2、Before 路由断言

Before Route Predicate 在该日期时间之前发生的请求都将被匹配

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: before_route
        uri: http://localhost:8080
        predicates:
        - Before=2022-03-30T18:00:00+08:00[Asia/Shanghai]
```

### 1.3、Between 路由断言

Before Route Predicate 有两个参数，x和y。在x和y之间的请求将被匹配。y参数的实际时间必须在x之后。

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: between_route
        uri: http://localhost:8080
        predicates:
        - Between=2022-03-30T18:00:00+08:00[Asia/Shanghai], 2022-03-31T18:00:00+08:00[Asia/Shanghai]
```

### 1.4、Cookie路由断言

Cookie Route Predicate 有两个参数，cookie名称和正则表达式。请求包含次cookie名称且正则表达式匹配的将会被匹配。

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: cookie_route
        uri: http://localhost:8080
        predicates:
        - Cookie=token, \d
```

### 1.5、Header路由断言

Header Route Predicate 有两个参数，header名称和正则表达式。请求包含header名称且正则表达式匹配的将会被匹配。

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: header_route
        uri: http://localhost:8080
        predicates:
        - Header=X-Request-Id, \d+
```

### 1.6、Host 路由断言

Host Route Predicate 包括一个参数：host name列表。使用Ant path匹配规则。‘，’作为分隔符。

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: host_route
        uri: http://localhost:8080
        predicates:
        - Host=**.somehost.org,**.anotherhost.org
```

Antpath匹配规则：

符号
描述

？
匹配任何单字符

*
匹配0或者任意数量的字符

**
匹配0或者更多的目录

### 1.7、Method 路由断言

Method Route Predicate 包括一个参数： 需要匹配的HTTP请求方式。‘，’作为分隔符。

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: method_route
        uri: http://localhost:8080
        predicates:
        - Method=GET,POST
```

### 1.8、Path 路由断言

Path Route Predicate 有2个参数:

一个Spring PathMatcher表达式列表和可选matchOptionalTrailingSeparator标识 .

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: path_route
        uri: http://localhost:8080
        predicates:
        - Path=/foo/{
     segment},/bar/{
     segment}
```

URI模板变量 (如上例中的 segment ) 将以Map的方式保存于ServerWebExchange.getAttributes()。key为ServerWebExchangeUtils.URI_TEMPLATE_VARIABLES_ATTRIBUTE. 这些值将在GatewayFilter Factories使用

```shell
Map<String, String> map = ServerWebExchangeUtils.getPathPredicateVariables(exchange);
String segment = map .get("segment");
```

### 1.9、Query 路由断言

Query Route Predicate 有2个参数: 必选项 param 和可选项 regexp.

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: query_route
        uri: http://localhost:8080
        predicates:
        - Query=abc,ac. //请求包含abc参数,并且值匹配为ac.正则表达式 可以访问
```

### 2.1、RemoteAddr路由断言

RemoteAddr Route Predicate 的参数为IP地址

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: remoteAddr_route
        uri: http://localhost:8080
        predicates:
        - RemoteAddr=192.168.1.1
```

### 2.2、Weight路由断言

Weight Route Predicate 的参数有两个group和weight。按组分配权重

```shell
spring:
  cloud:
    gateway:
      routes:
      - id: weight_route1
        uri: http://localhost:8080
        predicates:
        - Weight=group1,8 # 80%
      - id: weight_route2
        uri: http://localhost:8080
        predicates:
        - Weight=group2,2 # 20%
```

## 2、过滤

Gateway分为pre类型的过滤器和post类型的过滤器

- pre类型的过滤在转发到后端微服务之前执行，可以做**鉴权**、**限流**等操作
- post类型的过滤在请求完成之后、将结果范围给客户端之前执行

大概可以分为以下几类：

**1、** Header；

**2、** Parameter；

**3、** Path；

**4、** Body；

**5、** Status；

**6、** Session；

**7、** Redirect；

**8、** Retry；

**9、** RateLimiter；

**10、** Hystrix；

常用的四种过滤器：

### 2.1、AddRequestParameter Gateway Filter

添加**请求参数**，属于前置过滤。两个参数：key和value

```java
spring:
  cloud:
    gateway:
      routes:
      - id: route1
        uri: http://localhost:8080
        predicates:
        - Path=/product/**
        filters:
        - AddRequestParameter=info,hehe
```

### 2.2、RewritePath Gateway Filter

将请求路径重写如：/api-gateway/xxx/重写为/xxx/,属于前置过滤。

```java
spring:
  cloud:
    gateway:
      routes:
      - id: route1
        uri: http://localhost:8080
        predicates:
        - Path=/product/**,/api-gateway/**
        filters:
        - RewritePath=/api-gateway(?<segment>/?.*),$\{
     segment}
```

### 2.3、SetStatus Gateway Filter

将响应的HTTP请求头设置为454，属于后置过滤

```java
spring:
  cloud:
    gateway:
      routes:
      - id: route1
        uri: http://localhost:8080
        predicates:
        - Path=/product/**,/api-gateway/**
        filters:
        - SetStatus=454
```

### 2.4、AddResponsHeader Gateway Filter

添加头信息，属于后置过滤

```java
spring:
  cloud:
    gateway:
      routes:
      - id: route1
        uri: http://localhost:8080
        predicates:
        - Path=/product/**,/api-gateway/**
        filters:
        - AddResponsHeader=X-Response-Author,test
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
