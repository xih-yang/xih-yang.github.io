# 24、SpringBoot 实战 - 集成 LoadBalancer
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/24.html
- 分类：J2EE框架
- 分组：教程目录
**官方文档：**[https://spring.io/guides/gs/spring-cloud-loadbalancer/](https://spring.io/guides/gs/spring-cloud-loadbalancer/)

**GitHub：**[https://github.com/spring-cloud/spring-cloud-commons/tree/main/spring-cloud-loadbalancer](https://github.com/spring-cloud/spring-cloud-commons/tree/main/spring-cloud-loadbalancer)

## 一、简介

### 1.定义

`Spring Cloud LoadBalancer` 是 **Spring Cloud** 框架提供的**负载均衡组件**，用于在微服务框架中实现服务之间的负载均衡。

### 2.取代 Ribbon

Spring Cloud LoadBalancer 的设计目标是简化和统一负载均衡的使用方式，并提供良好的扩展性。从 **Spring Cloud 2020.0** 版本、**Spring Boot 2.4.x** 版本开始，Spring Boot 框架官方放弃了对 **Ribbon** 的支持，转而使用 **Spring Cloud LoadBalancer** 作为默认的负载均衡器。虽然提供了与 Ribbon 类似的功能，但是与 Ribbon 相比，Spring Cloud LoadBalancer 具有**更轻量级的实现，更好的性能表现**，并且**更适合与 Spring Cloud Gateway 等其他组件集成使用**。

### 3.主要特点与功能

Spring Cloud LoadBalancer 的主要特点和功能包括：

1）`简化集成`：Spring Cloud LoadBalancer 可以与 Spring Cloud 服务注册与发现组件（如 Eureka、Consul）集成，**从注册中心获取服务信息，并进行负载均衡**。

2）`内置负载均衡策略`：Spring Cloud LoadBalancer 提供了一些内置的负载均衡策略，如**轮询（Round Robin）** 、**随机（Random）** 等，可以根据需要选择合适的负载均衡策略。

3）`定制负载均衡策略`：Spring Cloud LoadBalancer 还支持定制负载均衡策略，开发人员可以**根据实际需求自定义负载均衡算法**。

4）`故障转移`：当某个服务节点不可用时，Spring Cloud LoadBalancer 可以**自动将请求发送到其他可用的节点**，提高系统的可靠性和容错性。

5）`可扩展性`：Spring Cloud LoadBalancer 提供了扩展点，开发人员可以**根据需要进行扩展和定制**，以满足特定的负载均衡需求。

在使用Spring Cloud LoadBalancer 时，可以通过相关的依赖和配置来进行集成和使用。它可以与其他 Spring Cloud 组件（如 Spring Cloud Gateway、Spring Cloud OpenFeign 等）一起使用，为应用程序提供完整的微服务环境。

### 4.LoadBalancer 和 OpenFeign 的关系

很多人一直认为 **OpenFeign 和 LoadBalancer 的关系就是简单的包含**，其实**这种看法是错误的**。我们可以看看 Spring Cloud 里产品 Map 图里的关系，就一目了然了。

`OpenFeign` 的定位是 **annotation** 化的 **RESTFUL Client**。需要认识到 OpenFeign 的本质其实是 **Spring Cloud** 里面比 **RestTemplate** 更高阶的一个升级组件，实现的是 RESTFUL Client，只是通过 Open Feign 的一些 annotaion 可以实现的比较简单而已。

而`LoadBalancer` 是 Spring Cloud 里的一个 Common 组件，是可以给其他组件提供服务的基础组件。**使用 LoadBalancer 无需 Open Feign 的集成**，**打开 LoadBalancer 的支持功能**，有关 RestTemplate 的地方**就可以实现客户端的负载均衡**了，OpenFeign 是 RestTemplate 的扩展，当然也就同样可以支持到负载均衡。

细心的朋友可以发现，咱们下面介绍的有关 Loadbalance 的使用，基本上都是和 OpenFeign 没有任何联系的； OpenFeign 只是我们后来进行验证效果的方式。

## 二、使用场景一：Eureka + LoadBalancer

服务架构图如下：

服务列表如下：

### 服务A：loadbalancer-consumer 消费者

#### 1.Maven依赖

注意：这里的 LoadBalancer 依赖必须引入，否则即使编译不报错，负载均衡也是失效的。

```xml
<!-- Web -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<!-- Eureka -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
<!-- LoadBalancer -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

#### 2.application.yml配置

```java
server:
  port: 8081
spring:
  application:
    name: loadbalancer-consumer
#eureka client
eureka:
  client:
    service-url:
      defaultZone: http://demo:Demo2023@localhost:1001/eureka/
  instance:
    hostname: localhost
    prefer-ip-address: true 是否使用 ip 地址注册
    instance-id: ${
     spring.cloud.client.ip-address}:${
     server.port} ip:port
    lease-renewal-interval-in-seconds: 5 实例续期心跳间隔（默认30s），设置之后启动服务不需要等很久就可以访问到服务的内容
    lease-expiration-duration-in-seconds: 15 实例续期持续多久后失效（默认90s）
```

#### 3.RestTemplateConfig.java

```java
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
/**
 * <p> @Title RestTemplateConfig
 * <p> @Description RestTemplate配置类
 *
 * @author zhj
 * @date 2023/9/17 20:58
 */
@Configuration
public class RestTemplateConfig {
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

#### 4.DemoController.java

```java
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
/**
 * <p> @Title DemoController
 * <p> @Description 测试Controller
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/4/24 18:02
 */
@Slf4j
@RestController
@RequestMapping("/demo")
public class DemoController {
    @Autowired
    private RestTemplate restTemplate;
    @RequestMapping("/consumeTest")
    public Object test() {
        log.info(">>>>>>>>>>【INFO】DemoController.consumeTest()...");
        String url = "http://loadbalancer-producer/demo/produceTest";
        return restTemplate.getForObject(url, Object.class);
    }
}
```

###

### 服务B：loadbalancer-producer 生产者

#### 1.Maven依赖

```xml
<!-- Web -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<!-- Eureka -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

#### 2.application.yml配置

```java
server:
  port: 8082
spring:
  application:
    name: loadbalancer-producer
#eureka client
eureka:
  client:
    service-url:
      defaultZone: http://demo:Demo2023@localhost:1001/eureka/
  instance:
    hostname: localhost
    prefer-ip-address: true 是否使用 ip 地址注册
    instance-id: ${
     spring.cloud.client.ip-address}:${
     server.port} ip:port
    lease-renewal-interval-in-seconds: 5 实例续期心跳间隔（默认30s），设置之后启动服务不需要等很久就可以访问到服务的内容
    lease-expiration-duration-in-seconds: 15 实例续期持续多久后失效（默认90s）
```

#### 3.DemoController.java

```java
import com.demo.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * <p> @Title DemoController
 * <p> @Description 测试Controller
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/4/24 18:02
 */
@Slf4j
@RestController
@RequestMapping("/demo")
public class DemoController {
    @Value("${server.port}")
    private String port;
    @RequestMapping("/produceTest")
    public Result<Object> produceTest() {
        Result<Object> result = Result.succeed();
        log.info(">>>>>>>>>>【INFO】DemoController.produceTest()...");
        return result.setData("Hello, I'm from port: " + port);
    }
}
```

### 调用测试

请求地址：[http://localhost:8081/demo/consumeTest](http://localhost:8081/demo/consumeTest)

可以发现分别打印了不同的服务端口，说明负载生效：

## 三、使用场景二：Eureka + LoadBalancer + OpenFeign

服务架构图如下：

服务列表如下：

### 服务A：loadbalancer-feign-a

#### 1.Maven依赖

```xml
<!-- Web -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<!-- Eureka -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
<!-- OpenFeign -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

#### 2.application.yml配置

```java
server:
  port: 8081
spring:
  application:
    name: loadbalancer-feign-a
#eureka client
eureka:
  client:
    service-url:
      defaultZone: http://demo:Demo2023@localhost:1001/eureka/
  instance:
    hostname: localhost
    prefer-ip-address: true 是否使用 ip 地址注册
    instance-id: ${
     spring.cloud.client.ip-address}:${
     server.port} ip:port
    lease-renewal-interval-in-seconds: 5 实例续期心跳间隔（默认30s），设置之后启动服务不需要等很久就可以访问到服务的内容
    lease-expiration-duration-in-seconds: 15 实例续期持续多久后失效（默认90s）
##feign参数优化
feign:
  client:
    config:
      这里用 default 就是全局配置，如果是写服务名称，则是针对某个服务的配置。
      default:
        日志级别（忽略大小写），包括：NONE（默认）、BASIC、HEADERS、FULL
        loggerLevel: FULL
```

#### 3.DemoController.java

```java
import com.demo.common.Result;
import com.demo.feign.DemoFeignClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@Slf4j
@RestController
@RequestMapping("/demo")
public class DemoController {
    @Value("${server.port:}")
    private String port;
    @Autowired
    private DemoFeignClient demoFeignClient;
    @GetMapping("/feignTest")
    public Result<Object> feignTest() {
        return demoFeignClient.test();
    }
}
```

#### 4.DemoFeignClient.java

```java
import com.demo.common.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
@FeignClient(value = "loadbalancer-feign-b")
public interface DemoFeignClient {
    @GetMapping("/demo/test")
    Result<Object> test();
}
```

### 服务B：loadbalancer-feign-b

#### 1.Maven依赖

```xml
<!-- Web -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<!-- Eureka -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

#### 2.application.yml配置

```java
server:
  port: 8082
spring:
  application:
    name: loadbalancer-feign-b
#eureka client
eureka:
  client:
    service-url:
      defaultZone: http://demo:Demo2023@localhost:1001/eureka/
  instance:
    hostname: localhost
    prefer-ip-address: true 是否使用 ip 地址注册
    instance-id: ${
     spring.cloud.client.ip-address}:${
     server.port} ip:port
    lease-renewal-interval-in-seconds: 5 实例续期心跳间隔（默认30s），设置之后启动服务不需要等很久就可以访问到服务的内容
    lease-expiration-duration-in-seconds: 15 实例续期持续多久后失效（默认90s）
```

#### 3.DemoController.java

```java
import com.demo.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@Slf4j
@RestController
@RequestMapping("/demo")
public class DemoController {
    @Value("${server.port:}")
    private String port;
    @GetMapping("/test")
    public Result<Object> test() {
        String data = "This is a test! port:" + port;
        log.info(">>>>>>>>>> 【INFO】data:{}", data);
        return Result.succeed().setData(data);
    }
}
```

### 调用测试

请求地址：[http://localhost:8081/demo/feignTest](http://localhost:8081/demo/feignTest)

可以发现分别打印了不同的服务端口，说明负载生效：
