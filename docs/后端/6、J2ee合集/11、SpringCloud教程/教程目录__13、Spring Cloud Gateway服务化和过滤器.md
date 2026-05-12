# 13、Spring Cloud Gateway服务化和过滤器
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloud/1/13.html
- 分类：J2EE框架
- 分组：教程目录
Springboot: 2.1.6.RELEASE

SpringCloud: Greenwich.SR1

如无特殊说明，本系列教程全采用以上版本

上一篇文章服务网关 Spring Cloud GateWay 初级篇，介绍了 Spring Cloud Gateway 的相关术语、技术原理，以及如何快速使用 Spring Cloud Gateway。这篇文章我们继续学习 Spring Cloud Gateway 的高级使用方式，比如如何配置服务中心来使用，如何使用熔断、限流等高级功能。

## 1. 注册中心

### 1.1 准备服务和注册中心

上篇主要讲解了网关代理单个服务的使用语法，在实际的工作中，服务的相互调用都是依赖于服务中心提供的入口来使用，服务中心往往注册了很多服务，如果每个服务都需要单独配置的话，这将是一份很枯燥的工作。Spring Cloud Gateway 提供了一种默认转发的能力，只要将 Spring Cloud Gateway 注册到服务中心，Spring Cloud Gateway 默认就会代理服务中心的所有服务，下面用代码演示。

在介绍Zuul的时候，我们用到了Eureka和producer，本次演示还是需要他们两个，将他们两个CV过来。

### 1.2 服务网关注册到注册中心

上一篇用到的gateway也CV过来，在依赖文件里面加入:

```java
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

添加对eureka的依赖，在启动文件加入注解@EnableEurekaClient。

修改配置文件application.yml：

```sh
server:
  port: 8080
spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
logging:
  level:
    org.springframework.cloud.gateway: debug
```

配置说明：

- spring.cloud.gateway.discovery.locator.enabled：是否与服务注册于发现组件进行结合，通过 serviceId 转发到具体的服务实例。默认为 false，设为 true 便开启通过服务中心的自动根据 serviceId 创建路由的功能。
- eureka.client.service-url.defaultZone指定注册中心的地址，以便使用服务发现功能
- logging.level.org.springframework.cloud.gateway 调整相 gateway 包的 log 级别，以便排查问题

修改完成后启动 gateway 项目，访问注册中心地址 [http://localhost:8761/](http://localhost:8761/) 即可看到名为 API-GATEWAY的服务。

### 1.3 测试

将gateway 注册到服务中心之后，网关会自动代理所有的在注册中心的服务，访问这些服务的语法为：

```java
http://网关地址：端口/服务中心注册 serviceId/具体的url
```

比如我们的 producer 项目有一个 /hello 的服务，访问此服务的时候会返回："hello "+name+"，producer is ready"。

比如访问地址：[http://localhost:8081/hello?name=spring，页面返回：hello](http://localhost:8081/hello?name=spring，页面返回：hello) spring，producer is ready。

按照上面的语法我们通过网关来访问，浏览器输入：[http://localhost:8080/SPRING-CLOUD-PRODUCER/hello?name=spring](http://localhost:8080/SPRING-CLOUD-PRODUCER/hello?name=spring) 同样返回：hello spring，producer is ready。证明服务网关转发成功。

我们将项目 producer 复制一份为 producer1，将/hello服务的返回值修改为 hello spring，producer1 is ready。修改端口号为 8082 ，修完完成后重启，这时候访问注册中心后台会发现有两个名为 SPRING-CLOUD-PRODUCER的服务。

在浏览器多次访问地址：[http://localhost:8888/SPRING-CLOUD-PRODUCER/hello，页面交替返回以下信息](http://localhost:8888/SPRING-CLOUD-PRODUCER/hello，页面交替返回以下信息)：

```java
hello spring，producer is ready。
hello spring，producer1 is ready。
```

说明后端服务自动进行了均衡负载。

## 2. 基于 Filter(过滤器) 实现的高级功能

在Zuul高级篇中大概介绍过 Filter 的概念。

Spring Cloud Gateway 的 Filter 的生命周期不像 Zuul 的那么丰富，它只有两个：“pre” 和 “post”。

- PRE： 这种过滤器在请求被路由之前调用。我们可利用这种过滤器实现身份验证、在集群中选择请求的微服务、记录调试信息等。
- POST：这种过滤器在路由到微服务以后执行。这种过滤器可用来为响应添加标准的 HTTP Header、收集统计信息和指标、将响应从微服务发送给客户端等。

Spring Cloud Gateway 的 Filter 分为两种：GatewayFilter 与 GlobalFilter。GlobalFilter 会应用到所有的路由上，而 GatewayFilter 将应用到单个路由或者一个分组的路由上。

Spring Cloud Gateway 内置了9种 GlobalFilter，比如 Netty Routing Filter、LoadBalancerClient Filter、Websocket Routing Filter 等，根据名字即可猜测出这些 Filter 的作者，具体大家可以参考官网内容：[Global Filters](https://cloud.spring.io/spring-cloud-gateway/single/spring-cloud-gateway.html#_global_filters)

利用GatewayFilter 可以修改请求的 Http 的请求或者响应，或者根据请求或者响应做一些特殊的限制。 更多时候我们会利用 GatewayFilter 做一些具体的路由配置，下面我们做一些简单的介绍。

### 2.1 快速上手 Filter 使用

我们以AddRequestParameter GatewayFilter 来演示一下，如何在项目中使用 GatewayFilter，AddRequestParameter GatewayFilter 可以在请求中添加指定参数。

#### 2.1.1 配置application.yml示例

```sh
server:
  port: 8080
spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
      routes:
        - id: add_request_parameter_route
          uri: http://localhost:8081
          filters:
            - AddRequestParameter=foo, bar
          predicates:
            - Method=GET
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
logging:
  level:
    org.springframework.cloud.gateway: debug
```

这里的routes 手动指定了服务的转发地址，设置所有的 GET 方法都会自动添加foo=bar，[http://localhost:8081](http://localhost:8081) 是 producer 项目，我们在此项目中添加一个 foo() 方法，用来接收转发中添加的参数 foo。

```java
@RequestMapping("/foo")
public String foo(String foo) {
    return "hello "+foo+"!";
}
```

修改完成后重启 gateway、producer 项目。访问地址 [http://localhost:8081/foo](http://localhost:8081/foo) 页面返回：hello null!，说明并没有接受到参数 foo；通过网关来调用此服务，浏览器访问地址 [http://localhost:8080/foo](http://localhost:8080/foo) 页面返回：hello bar!，说明成功接收到参数 foo 参数的值 bar ,证明网关在转发的过程中已经通过 filter 添加了设置的参数和值。

### 2.2 服务化路由转发

面我们使用 uri 指定了一个服务转发地址，单个服务这样使用问题不大，但是我们在注册中心往往会使用多个服务来共同支撑整个服务的使用，这个时候我们就期望可以将 Filter 作用到每个应用的实例上，spring cloud gateway 工了这样的功能，只需要简单配置即可。

为了测试两个服务提供者是否都被调用，我们在 producer1 项目中也同样添加 foo() 方法。

```java
@RequestMapping("/foo")
public String foo(String foo) {
    return "hello "+foo+"!@@@@";
}
```

为了和producer 中 foo() 方法有所区别，这里使用了多加了4个@。同时将 gateway 项目配置文件中的 uri 内容修改如下：

```java
#格式为：lb://应用注册服务名
uri: lb://spring-cloud-producer
```

修改完之后，重新启动项目 gateway、producer1，浏览器访问地址: [http://localhost:8080/foo](http://localhost:8080/foo) 页面交替出现：

```java
hello bar!
hello bar!@@@@
```

证明请求依据均匀转发到后端服务，并且后端服务均接收到了 filter 增加的参数 foo 值。

这里其实默认使用了全局过滤器 LoadBalancerClient ，当路由配置中 uri 所用的协议为 lb 时（以uri: lb://spring-cloud-producer为例），gateway 将使用 LoadBalancerClient 把 producer 通过 eureka 解析为实际的主机和端口，并进行负载均衡。

[示例代码-Github](https://github.com/meteor1993/SpringCloudLearning/tree/master/chapter13)

参考：

[http://www.ityouknow.com/springcloud/2019/01/19/spring-cloud-gateway-service.html](http://www.ityouknow.com/springcloud/2019/01/19/spring-cloud-gateway-service.html)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
