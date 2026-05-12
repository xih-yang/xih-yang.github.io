# 15、SpringBoot 实战 - 集成 Alibaba Sentinel
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/15.html
- 分类：J2EE框架
- 分组：教程目录
**官网地址：**[https://sentinelguard.io/zh-cn/](https://sentinelguard.io/zh-cn/)

**官方文档：**[https://sentinelguard.io/zh-cn/docs/introduction.html](https://sentinelguard.io/zh-cn/docs/introduction.html)

**Spring Cloud Alibaba Sentinel 官方文档：**[https://github.com/alibaba/spring-cloud-alibaba/wiki/Sentinel](https://github.com/alibaba/spring-cloud-alibaba/wiki/Sentinel)

**GitHub：**[https://github.com/alibaba/Sentinel](https://github.com/alibaba/Sentinel)

## 一、简介

### 1.什么是 Sentinel？

sentinel /ˈsentɪnl/ n. 哨兵

**背景：** 随着微服务的流行，服务和服务之间的稳定性变得越来越重要。

> Sentinel： 是一个面向分布式、多语言异构化服务架构的流量治理组件。主要以流量为切入点，是一款用于流量控制、熔断降级、系统保护等功能的开源框架，由阿里巴巴集团开发和维护。它可以帮助开发者在微服务架构中实现流量控制和服务保护，提高服务的可用性和稳定性。

### 2.Sentinel 基本概念：

- **资源：**

资源是 Sentinel 的关键概念。它可以是 Java 应用程序中的任何内容，例如：由应用程序提供的服务，或应用程序调用的其他应用提供的服务，甚至可以是一段代码。

只要通过 `Sentinel API` 定义的代码，就是资源，能够被 Sentinel 保护起来。大部分情况下，可以使用方法签名、URL、甚至服务名称作为资源名来标识资源。

- **规则：**

围绕资源的实时状态设定的规则，可以包括`流量控制规则`、`熔断降级规则`以及`系统保护规则`。所有规则可以动态实时调整。

### 3.Sentinel 主要功能

Sentinel 提供了很多功能，主要功能包括：

**1、**`流量控制`：对请求进行限流，防止系统被过多的请求打垮；

**2、**`熔断降级`：在系统资源不足或请求失败的情况下，可以自动降级或熔断服务，防止系统崩溃；

**3、**`系统保护`：对系统的资源（CPU、内存等）进行监控和保护，防止因为资源占用过多而导致系统崩溃；

**4、**`系统指标监控`：对系统的各种指标（例如CPU使用率、内存使用率等）进行监控和报警；

使用Spring Cloud Alibaba Sentinel 可以大大提高服务的可用性和稳定性，同时也提供了丰富的监控和报警功能，方便开发者对系统进行实时监控和管理。

### 4.什么是流量控制？

> 流量控制： 流量控制在网络传输中是一个常用的概念，它用于调整网络包的发送数据。然而，从系统稳定性角度考虑，在处理请求的速度上，也有很多讲究。任意时间到来的请求往往是随机不可控的，而系统的处理能力是有限的。我们需要根据系统的处理能力对流量进行控制。

Sentinel 作为一个调配器，可以根据需要把随机的请求调整成合适的形状，如下图所示：

流量控制有以下几个角度：

- 资源的调用关系，例如：资源的调用链路，资源和资源之间的关系；
- 运行指标，例如：QPS、线程池、系统负载等；
- 控制的效果，例如：直接限流、冷启动、排队等。

Sentinel 的设计理念是可以自由选择控制的角度，并进行灵活组合，从而达到想要的效果。

### 5.什么是熔断降级

> 熔断降级： 是一种服务保护机制，用于在系统遇到异常负载或资源不足的情况下，保证核心功能的可用性和稳定性。
>
>
> 熔断是指在系统出现故障时，自动切换到备用方案，防止故障扩散和影响到其他服务。
> 降级是指在系统资源紧张时，优先保证核心功能的可用性，减少不重要或低优先级的功能或服务提供。

通常，当系统的资源如CPU、内存等达到一定的阈值，或者出现负载过高的情况，就会触发熔断降级机制。这是，系统将关闭或限制某些功能或服务，以保证核心功能的正常运行，直到系统恢复正常状态。这样可以避免系统崩溃或出现更验证的问题，并提高服务的稳定性。

除了流量控制以外，降低调用链路中的不稳定资源也是 Sentinel 的使命之一。由于调用关系的复杂性，如果调用链路中的某个资源出现了不稳定，最终会导致请求发生堆积。

Sentinel 和 Hystrix 的原则是一致的：当调用链路中某个资源出现不稳定，例如：表现为 timeout，异常比例升高的时候，则对这个资源的调用进行限制，并让请求快速失败，避免影响到其它的资源，最终产生雪崩的效果。

### 6.熔断降级设计理念

在限制手段上，Sentinel 和 Hystrix 采取了完全不一样的方法。

- Hystrix 通过线程池的方式，来对依赖（在我们的概念中对应的资源）进行隔离。这样做的好处是资源和资源之间做到了最彻底的隔离。缺点是除了增加线程切换的成本，还需要预先给各个资源做线程池大小的分配。
- Sentinel 对这个问题采取了两种手段：

**1）通过并发线程数进行隔离**

和资源池隔离的方法不同，Sentinel 通过限制资源并发线程的数量，来减少不稳定资源对其它资源的影响。这样不但没有线程切换的损耗，也不需要您预先分配线程池的大小。当某个资源出现不稳定的情况下，例如响应时间变长，对资源的直接影响就是会造成线程数的逐步堆积。当线程数在特定资源上堆积到一定的数量之后，对该资源的新请求就会被拒绝。堆积的线程完成任务后才开始继续接收请求。

**2）通过响应时间对资源进行降级**

除了对并发线程数进行控制以外，Sentinel 还可以通过响应时间来快速降级不稳定的资源。当依赖的资源出现响应时间过长后，所有对该资源的访问都会被直接拒绝，直到过了指定的时间窗口后才重新恢复。

### 7.系统负载保护

Sentinel 同时提供系统维度的自适应保护能力。防止雪崩，是系统防护中重要的一环。当系统负载较高的时候，如果还持续让请求进入，可能会导致系统崩溃，无法响应。在集群环境下，网络负载均衡会把本应该在这台机器承载的流量转发到其它的机器上去。如果这个时候其它的机器也处在一个边缘状态的时候，这个增加的流量就会导致这台机器也崩溃，最后导致整个集群不可用。

针对这个情况，Sentinel 提供了对应的保护机制，让系统的入口流量和系统的负载达到一个平衡，保证系统在能力范围内出力最多的请求。

### 8.Sentinel、Hystrix、resilience4j 同类组件功能对比

[https://github.com/alibaba/Sentinel/wiki/在生产环境中使用-Sentinel](https://github.com/alibaba/Sentinel/wiki/%E5%9C%A8%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83%E4%B8%AD%E4%BD%BF%E7%94%A8-Sentinel)

功能项
Sentinel
Hystrix
resilience4j

隔离策略
信号量隔离（并发控制）
线程池隔离/信号量隔离
信号量隔离

熔断降级策略
基于慢调用比例、异常比例、异常数
基于异常比例
基于异常比例、响应时间

实时统计实现
滑动窗口（LeapArray）
滑动窗口（基于 RxJava）
有限支持

动态规则配置
支持近十种动态数据源
支持多种数据源
有限支持

扩展性
多个扩展点
插件的形式
接口的形式

基于注解的支持
支持
支持
支持

单机限流
基于 QPS，支持基于调用关系的限流
有限的限流
Rate Limiter

集群流控
支持
不支持
不支持

流量整形
支持预热模式与匀速排队控制效果
不支持
简单的 Rate Limiter 模式

系统自适应保护
支持
不支持
不支持

热点识别/防护
Java/Go/C++
Java
Java

Service Mesh支持
支持 Envoy/lstio
不支持
不支持

控制台
提供开箱即用的控制台，可配置规则、实时监控、机器发现等
简单的监控查看
不提供控制台，可对接其他监控系统

## 二、Sentinel 控制台

使用时，Sentinel 可以通过`核心库`单独使用，也可以通过`控制台`进行监控和管理，我们这里主要讲通过集成控制台的方式进行管理。

### 1.什么是 Sentinel 控制台？

**Sentinel Dashboard：** Sentinel 提供了一个轻量级的开源控制台，它提供机器发现以及健康情况管理、监控（单机和集群），规则管理和推送的功能。

**官方文档：**[https://sentinelguard.io/zh-cn/docs/dashboard.html](https://sentinelguard.io/zh-cn/docs/dashboard.html)

**GitHub：**[https://github.com/alibaba/Sentinel/tree/master/sentinel-dashboard](https://github.com/alibaba/Sentinel/tree/master/sentinel-dashboard)

Sentinel 控制台包含如下功能：

- **查看机器列表以及健康情况：** 收集 Sentinel 客户端发送的心跳包，用于判断机器是否在线。
- **监控（单机和集群聚合）：** 通过 Sentinel 客户端暴露的监控 API，定期拉取并且聚合应用监控信息，最终可以实现秒级的实时监控。
- **规则管理和推送：** 统一管理推送规则。
- **鉴权：** 生产环境中鉴权非常重要，这里需要每个开发者根据自己的实际情况进行定制。

**注意：** Sentinel 控制台目前仅支持单机部署。Sentinel 控制台项目提供 Sentinel 功能全集示例，不作为开箱即用的生产环境控制台，若希望在生产环境使用请根据`文档`自行进行定制和改造。

### 2.下载

这里我们有两种方式获取 Sentinel 控制台的 jar 包：

#### 方式一：直接下载

**release 页面：**[https://github.com/alibaba/Sentinel/releases](https://github.com/alibaba/Sentinel/releases)

我们可以从 `release` 页面下载最新版本的控制台 jar 包。

#### 方式二：手动打包

**GitHub：**[https://github.com/alibaba/Sentinel/tree/master/sentinel-dashboard](https://github.com/alibaba/Sentinel/tree/master/sentinel-dashboard)

我们也可以从 GitHub 页面拉取 `sentinel-dashboard` 代码，执行如下 Maven 命令进行打包：

```java
mvn clean package
```

### 3.启动

启动命令如下：

```java
java -Dserver.port=8080 \
	-Dcsp.sentinel.dashboard.server=localhost:8080 \
	-Dproject.name=sentinel-dashboard \
	-jar sentinel-dashboard.jar
```

JVM参数含义：

参数
作用

-Dserver.port=8080
指定服务的启动端口

-Dcsp.sentinel.dashboard.server=localhost:8080
向 Sentinel 接入端指定控制台的地址

-Dproject.name=sentinel-dashboard
向 Sentinel 指定应用名称。

更多启动配置项详见：[https://github.com/alibaba/Sentinel/wiki/启动配置项](https://github.com/alibaba/Sentinel/wiki/%E5%90%AF%E5%8A%A8%E9%85%8D%E7%BD%AE%E9%A1%B9)

从Sentinel 1.6.0 开始，Sentinel 控制台支持简单的登录功能，默认用户名和密码都是 `sentinel`。可以通过如下参数进行配置：

- -Dsentinel.dashboard.auth.username=sentinel 用于指定控制台的登陆用户名为 sentinel，默认为 sentinel；
- -Dsentinel.dashboard.auth.password=sentinel 用于指定控制台登陆密码为 sentinel，默认为 sentinel；
- -Dserver.servlet.session.timeout=7200 用于指定 Spring Boot 服务端 session 的过期时间，如： 7200 表示 7200秒；60m 表示 60 分钟，默认为 30m。

启动后控制台如下所示：

访问控制台页面：http://localhost:8080

输入用户名、密码，都是 `sentinel`，就可以看到我们的控制台了：

下面我们说一下 Sentinel 客户端的接入：

## 三、Sentinel 客户端

控制台启动后，客户端需要按照以下步骤接入到控制台：

这里我们主要使用 `Spring Cloud Alibaba Sentinel` 来接入：

**Spring Cloud Alibaba Sentinel 官方文档：**[https://github.com/alibaba/spring-cloud-alibaba/wiki/Sentinel](https://github.com/alibaba/spring-cloud-alibaba/wiki/Sentinel)

### 1.Maven依赖

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
    <version>2021.1</version>
</dependency>
```

### 2.application.yml

```java
server:
  port: 8081
spring:
  application:
    name: springboot-sentinel
  cloud:
    sentinel:
      transport:
        port: 8719
        client-ip: localhost
        dashboard: localhost:8080
```

### 3.TestController.java

```java
import com.demo.service.TestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * <p> @Title TestController
 * <p> @Description 测试Controller
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/3/24 20:36
 */
@RestController
@RequestMapping("/test")
public class TestController {
    @Autowired
    private TestService service;
    @GetMapping(value = "/hello/{name}")
    public String apiHello(@PathVariable String name) {
        return service.sayHello(name);
    }
}
```

### 4.TestService.java

```java
/**
 * <p> @Title TestService
 * <p> @Description 测试Service
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/3/26 21:51
 */
public interface TestService {
    /**
     * <p> @Title sayHello
     * <p> @Description 测试方法
     *
     * @param name 名称
     * @return java.lang.String
     */
    String sayHello(String name);
}
```

### 5.TestServiceImpl.java

```java
import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.demo.service.TestService;
import org.springframework.stereotype.Service;
/**
 * <p> @Title TestServiceImpl
 * <p> @Description 测试Service
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2023/3/26 21:51
 */
@Service
public class TestServiceImpl implements TestService {
    @SentinelResource(value = "sayHello")
    public String sayHello(String name) {
        // 测试方法
        return "Hello, " + name;
    }
}
```

### 6.启动服务

启动服务后，我们需要先访问接口：http://localhost:8081/test/hello/acgkaka

（注意：Sentinel 只有在接口有使用时才会进行初始化，开始向控制台发送心跳包）

> 注意：需要根据你的应用类型和接入方式引入对应的 适配依赖，否则即使有访问量也不能被 Sentinel 统计。

再次访问控制台页面：http://localhost:8080

可以看到，刚才启动的 Sentinel 客户端已经成功注册到控制台上了。

### 6.注解说明

`@SentinelResource` 注解用于定义资源，并提供可选的异常处理和服务降级配置。上述例子中，注解的属性值 `sayHello` 表示资源名。

`@SentinelResource` 注解包含以下属性：

- value：资源名称，必填
- entryType：entry 类型，可选项（默认 EntryType.OUT）
- blockHandler / blockHandlerClass：blockHandler 对应处理 BlockException 的函数名称，可选项。
- fallback / falbackClass：fallback 函数名称，可选项，用于在抛出异常的时候提供 fallback 处理逻辑。fallback 函数可以针对所有类型的异常（除了 exceptionsToIgnore 里面排除掉的异常类型）进行处理。若 blockHandler 和 fallback 都进行了配置，则被限流降级而抛出 BlockException 时只会进入 blockHandler 处理逻辑。
- defaultFallback（since 1.6.0）：默认的 fallback 函数名称，可选项，通常用于通用的 fallback 逻辑。默认 fallback 函数可以针对所有类型的异常（除了 exceptionsToIgnore 里面排除掉的异常类型）进行处理。若同时配置了 fallback 和 defaultFallback，则只有 fallback 会生效。

（1.8.0 版本开始，`defaultFallback` 支持在类级别进行配置。）

- exceptionsToIgnore（since 1.6.0）：用于指定哪些异常被排除掉，不会计入异常统计中，也不会进入 fallback 逻辑中，而是会原样抛出。

> 注意：1.6.0 之前的版本 fallback 函数只针对降级异常（DegradeException）进行处理，不能针对业务异常进行处理。

整理完毕，完结撒花~ 🌻
