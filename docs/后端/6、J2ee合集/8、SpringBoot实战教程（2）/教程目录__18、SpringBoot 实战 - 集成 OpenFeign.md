# 18、SpringBoot 实战 - 集成 OpenFeign
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/18.html
- 分类：J2EE框架
- 分组：教程目录
**官方文档：**[https://spring.io/projects/spring-cloud-openfeign](https://spring.io/projects/spring-cloud-openfeign)

**GitHub：**[https://github.com/OpenFeign/feign](https://github.com/OpenFeign/feign)

## 一、简介

### 1.定义

`OpenFeign`：是由 Netflix 开发的声明式的 Web 服务客户端。它简化了向 RESTful Web 服务发送 HTTP 请求的过程，开发人员可以通过定义接口来指定所需的端点和请求/响应的格式。OpenFeign 根据这些接口定义自动生成 HTTP 客户端代码，抽象了处理 HTTP 通信的底层细节。

### 2.关键特征

OpenFeign 的一些关键特征包括：

1）`声明式注解`：OpenFeign 使用注解，如 `@FeignClient`、`@RequestMapping` 和 `@RequestParam` 来定义所需的 API 端点和参数。

2）`与 Spring Boot 集成`：OpenFeign 与 Spring Boot 应用程序无缝集成，可以轻松将 Web 服务客户端融入到现有项目中。

3）`负载均衡和容错处理`：OpenFeign 与 `Ribbon` 等负载均衡器集成，并通过 `Hystrix` 等断路器提供容错处理功能。

4）`支持序列化和反序列化`：OpenFeign 根据指定的内容自动将 Java 对象序列化为 JSON、XML 或其他格式，并进行反序列化。

总的来说，OpenFeign 是一个方便易用的 HTTP 客户端框架，通过它客户快速构建出与 RESTful 服务端交互的客户端代码。

## 二、Maven依赖

```xml
<!-- OpenFeign -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
    <version>2.2.2.RELEASE</version>
</dependency>
<!-- Jackson -->
<dependency>
    <groupId>org.codehaus.jackson</groupId>
    <artifactId>jackson-mapper-asl</artifactId>
    <version>1.9.13</version>
</dependency>
```

我们可以从 Maven 的依赖树中看到，`spring-cloud-starter-openfeign` 中集成了 Ribbon 和 Hystrix 依赖。

注意：从 Spring Cloud 2020.0.0 版本开始，spring-cloud-starter-openfeign 不再包含 Ribbon 和 Hystrix。

- 替代 Hystrix 的方案是使用 Spring Cloud Circuit Breaker 来实现断路器的功能。

Spring Cloud Circuit Breaker是一个抽象层，可以灵活地选择和切换不同的断路器实现，比如Resilience4j、Sentinel等。

- 替代 Ribbon 的方案是使用 Spring Cloud LoadBalancer 来实现负载均衡器的功能。

Spring Cloud LoadBalancer是Spring Cloud提供的一个负载均衡器，与服务发现组件（如Eureka、Consul等）无缝集成，能够动态地将请求转发到可用的服务实例上。

## 三、编写配置

### 1.Feign日志配置

**Feign 的日志级别如下：**

- NONE：默认，不记录任何日志，性能最佳，适用于生产环境。
- BASIC：仅记录请求方法、URL、响应状态代码以及执行时间，适用于生产环境追踪问题。
- HEADERS：在 BASIC 级别的基础上，记录请求和相应的 header。
- FULL：记录请求和相应的 header、body 和元数据，适用于开发测试定位问题。

> 注意： Feign 日志级别生效的前提：需要在配置文件中将日志级别设置为 DEBUG。

Feign 的日志级别配置有两种生效方式：`yaml文件配置`、`java代码配置`：

**yaml文件配置：**

```java
feign:
  client:
    config:
      这里用 default 就是全局配置，如果是写服务名称，则是针对某个服务的配置。
      default:
        日志级别（忽略大小写），包括：NONE（默认）、BASIC、HEADERS、FULL
        loggerLevel: FULL
```

**java代码配置：**

```java
@Configuration
public class FeignConfig {
    @Bean
    public Logger.Level logLevel(){
        return Logger.Level.BASIC;
    }
}
```

### 2.其他配置

类型
作用
说明

feign.codec.Decoder
指定响应结果解析器
HTTP远程调用的结果做解析，例如解析JSON字符串为 java 对象。

feign.codec.Encoder
指定请求参数编码器
将请求参数编码，便于通过HTTP请求发送。

feign.Contract
支持的注解格式
默认是SpringMVC的注解。

feign.Retry
失败重试机制
请求失败的重试机制，默认是不重试，不过会使用 Ribbon 的重试。

### 3.底层实现优化

我们都知道，Feign 组件其实就是一个封装 HTTP 请求为接口的组件，底层还是发送的 HTTP 请求。那么针对 HTTP 请求的发送就存在可以优化的点。

**Feign 支持以下几种 HTTP 请求的实现方式：**

- URL Connection：默认实现，不支持连接池。
- Apache HttpClient：支持连接池。
- OKHttp：支持连接池。

由此，我们可以用 `Apache HttpClient` 或者 `OKHttp` 来对 Feign 调用进行优化。

这里我们以 `Apache HttpClient` 为例进行说明。

**Feign 集成 HttpClient：**

1）引入依赖

```xml
<!--引入HttpClient依赖-->
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-httpclient</artifactId>
</dependency>
```

2）配置连接池

```java
feign:
  httpclient:
    enabled: true 支持HttpClient开关
    max-connections: 200 最大连接数
    max-connections-per-route: 50 单个路径的最大连接数
```

**优化总结：**

1）日志级别尽量用 `BASIC`；

2）使用 `HttpClient` 或 `OKHttp` 代替 `URLConnection` 实现连接池。

## 四、编写代码

### 1.DemoController.java

```java
@RestController
@RequestMapping("/demo")
public class DemoController {
    @Value("${server.port:}")
    private String port;
    @Autowired
    private DemoFeignClient demoFeignClient;
    @GetMapping("/test")
    public Result<Object> test() {
        String data = "This is a test! port:" + port;
        return Result.succeed().setData(data);
    }
    @GetMapping("/feignTest")
    public Result<Object> feignTest() {
        return demoFeignClient.test();
    }
}
```

### 2.DemoFeignClient.java

```java
@FeignClient(value = "springboot-feign")
public interface DemoFeignClient {
    @GetMapping("/demo/test")
    Result<Object> test();
}
```

### 3.启动类注解 @EnableFeignClients

```java
@EnableFeignClients
@EnableEurekaClient
@SpringBootApplication
public class SpringbootDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootDemoApplication.class, args);
    }
}
```

## 四、测试

直接访问地址：http://localhost:8081/demo/test

feign访问地址：http://localhost:8081/demo/feignTest

> 代码参考地址：https://gitee.com/acgkaka/SpringBootExamples/tree/master/springboot-feign
