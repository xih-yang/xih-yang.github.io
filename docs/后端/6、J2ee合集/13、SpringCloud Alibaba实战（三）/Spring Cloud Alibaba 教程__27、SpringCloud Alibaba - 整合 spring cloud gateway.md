# 27、SpringCloud Alibaba - 整合 spring cloud gateway
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/3/27.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程
## 前言

spring cloud gateway 是基于Spring5.0+SpringBoot2.0+WebFlux，是非阻塞异步的框架，为微服务架构提供了简单有效的统一的API路由管理。

## 一、概念

**1、** RouteDefinition；

路由的元数据信息，包含路由id、目标uri、断言元数据信息PredicateDefinition、过滤器元数据信息FilterDefinition 等，可以通过配置文件配置。

**2、** Route；

路由，包含路由id,目标uri，断言AsyncPredicate和过滤器GatewayFilter等信息，数据时由RouteDefinition而来。

**3、** AsyncPredicate；

用于匹配路由信息，请求信息与断言相匹配则进行路由。

**4、** GatewayFilter；

网关过滤器，可以在请求被路由前或者之后对请求进行一下处理。

## 二、环境

**1、** 引入依赖；

```java
 <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-gateway</artifactId>
        <version>3.0.2</version>
    </dependency>
```

**2、** 配置信息；

```java
server.port=9003
spring.application.name=gateway
spring.cloud.nacos.discovery.server-addr=172.16.10.159:8848
# gateway为每一个服务创建了路由，以服务名开头的请求路径转发到对应的服务
spring.cloud.gateway.discovery.locator.enabled=true
# 将请求路径的服务名变成小写
spring.cloud.gateway.discovery.locator.lower-case-service-id=true
# 路由id标识
spring.cloud.gateway.routes[0].id=gateway-server
# lb其实是loadbalance缩写，server 是路由的服务
spring.cloud.gateway.routes[0].uri=lb://server
# 断言，请求路径以server开头，会使用该路由
spring.cloud.gateway.routes[0].predicates[0]=Path=/server/**
# 跳过固定前缀
spring.cloud.gateway.routes[0].filters[0]=StripPrefix=1
```

**3、** server端配置；

1、配置文件

```java
server.port=9004
spring.application.name=server
spring.cloud.nacos.discovery.server-addr=172.16.10.159:8848
```

2、controller

```java
@RestController
@RequestMapping("/server")
public class ServerController {
    @GetMapping("/test/{id}")
    public Object test(@PathVariable String id) {
        Map map = new HashMap();
        map.put("server", id);
        return map;
    }
}
```

## 三、测试

访问gateway 地址加上 server服务端的路径后缀

```java
http://192.168.100.73:9003/server/server/test/100
```

结果：

```java
{
    "server": "100"
}
```
