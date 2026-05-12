# 08、SpringCloud Alibaba 之 Sentinel 流量控制、熔断降级
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/8.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 一、Sentinel

随着微服务的流行，服务和服务之间的稳定性变得越来越重要。

[Sentinel](https://sentinelguard.io/) 以流量为切入点，从流量控制、流量路由、熔断降级、系统自适应过载保护、热点流量防护等多个维度保护服务的稳定性。

Sentinel 具有以下特征:

**丰富的应用场景**：Sentinel 承接了阿里巴巴近 10 年的双十一大促流量的核心场景，例如秒杀（即突发流量控制在系统容量可以承受的范围）、消息削峰填谷、集群流量控制、实时熔断下游不可用应用等。

**完备的实时监控**：Sentinel 同时提供实时的监控功能。您可以在控制台中看到接入应用的单台机器秒级数据，甚至 500 台以下规模的集群的汇总运行情况。

**广泛的开源生态**：Sentinel 提供开箱即用的与其它开源框架/库的整合模块，例如与 Spring Cloud、Apache Dubbo、gRPC、Quarkus 的整合。您只需要引入相应的依赖并进行简单的配置即可快速地接入 Sentinel。同时 Sentinel 提供 Java/Go/C++ 等多语言的原生实现。

**完善的 SPI 扩展机制**：Sentinel 提供简单易用、完善的 SPI 扩展接口。您可以通过实现扩展接口来快速地定制逻辑。例如定制规则管理、适配动态数据源等。

> SPI ，全称为 Service Provider Interface，是一种服务发现机制。它可以在 ClassPath 路径下的 META-INF/services 文件夹查找文件，并自动加载文件中定义的类。

### Github：

[GitHub - alibaba/Sentinel: A powerful flow control component enabling reliability, resilience and monitoring for microservices. (面向云原生微服务的高可用流控防护组件)](https://github.com/alibaba/Sentinel)

Sentinel 是由阿里巴巴中间件团队开发的开源项目，是一种面向分布式微服务架构的轻量级高可用流量控制组件。

Sentinel 主要以流量为切入点，从流量控制、熔断降级、系统负载保护等多个维度帮助用户保护服务的稳定性。

2012 年，Sentinel 诞生，主要功能是提供请求流量控制；

2013-2017 年，Sentinel在阿里巴巴集团内部大量用于生产实践，成为基础技术模块，覆盖了所有的核心场景；

2018 年，Sentinel 对外开源，并持续演进和版本迭代。

Sentinel在经过阿里巴巴内部一系列秒杀大促，特别是双11这样电商大促中的锤炼，目前已有不少企业在使用开源版本和云版本的Sentinel，包括顺丰、vivo、每日优鲜、拼多多、易企秀、爱奇艺、融金所、VIPKID、喜马拉雅FM、百融金服等；

更多使用者：[Wanted: Who is using Sentinel · Issue #18 · alibaba/Sentinel · GitHub](https://github.com/alibaba/Sentinel/issues/18)

> Sentinel 的主要特性

> Sentinel 分为两个部分:

**核心库**（Java 客户端）不依赖任何框架/库，能够运行于所有 Java 运行时环境，同时对 Dubbo / Spring Cloud 等框架也有较好的支持

**控制台**（Dashboard）基于 Spring Boot 开发，打包后可以直接运行，不需要额外的 Tomcat 等应用容器

> 从功能上来说，Sentinel 与 Spring Cloud Netfilx Hystrix 类似，但 Sentinel 要比 Hystrix 更加强大，例如 Sentinel 提供了流量控制功能、比 Hystrix 更加完善的实时监控功能等等

> Sentinel 的基本概念有两个，它们分别是：资源和规则

基本概念
描述

资源
资源是 Sentinel 的关键概念。它可以是 Java 应用程序中的任何内容，例如由应用程序提供的服务或者是服务里的方法，甚至可以是一段代码。

 我们可以通过 Sentinel 提供的 API 来定义一个资源，使其能够被 Sentinel 保护起来。通常情况下，我们可以使用方法名、URL 甚至是服务名来作为资源名来描述某个资源。

规则
围绕资源而设定的规则。Sentinel 支持流量控制、熔断降级、系统保护、来源访问控制和热点参数等多种规则，所有这些规则都可以动态实时调整。

## 二、 Sentinel 控制台（Dashboard）

Sentinel 提供了一个轻量级的开源控制台 Sentinel Dashboard，它提供了机器发现与健康情况管理、监控（单机和集群）、规则管理与推送等多种功能

Sentinel Dashboard是一个独立的web应用，可以接受客户端的连接，然后与客户端之间进行通讯，他们之间使用http协议进行通讯

Sentinel的GitHub

[https://github.com/alibaba/Sentinel/wiki/%E6%8E%A7%E5%88%B6%E5%8F%B0](https://github.com/alibaba/Sentinel/wiki/%E6%8E%A7%E5%88%B6%E5%8F%B0)

> Sentinel 控制台包含如下功能:

[查看机器列表以及健康情况](https://github.com/alibaba/Sentinel/wiki/%E6%8E%A7%E5%88%B6%E5%8F%B0#4-%E6%9F%A5%E7%9C%8B%E6%9C%BA%E5%99%A8%E5%88%97%E8%A1%A8%E4%BB%A5%E5%8F%8A%E5%81%A5%E5%BA%B7%E6%83%85%E5%86%B5)：收集 Sentinel 客户端发送的心跳包，用于判断机器是否在线。

[监控 (单机和集群聚合)](https://github.com/alibaba/Sentinel/wiki/%E6%8E%A7%E5%88%B6%E5%8F%B0#5-%E7%9B%91%E6%8E%A7)：通过 Sentinel 客户端暴露的监控 API，定期拉取并且聚合应用监控信息，最终可以实现秒级的实时监控。

[规则管理和推送](https://github.com/alibaba/Sentinel/wiki/%E6%8E%A7%E5%88%B6%E5%8F%B0#6-%E8%A7%84%E5%88%99%E7%AE%A1%E7%90%86%E5%8F%8A%E6%8E%A8%E9%80%81)：统一管理推送规则。

[鉴权](https://github.com/alibaba/Sentinel/wiki/%E6%8E%A7%E5%88%B6%E5%8F%B0#%E9%89%B4%E6%9D%83)：生产环境中鉴权非常重要。这里每个开发者需要根据自己的实际情况进行定制。

**注意**：Sentinel 控制台目前仅支持单机部署。Sentinel 控制台项目提供 Sentinel 功能全集示例，不作为开箱即用的生产环境控制台，不提供安全可靠保障。若希望在生产环境使用请根据[文档](https://github.com/alibaba/Sentinel/wiki/%E5%9C%A8%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83%E4%B8%AD%E4%BD%BF%E7%94%A8-Sentinel)自行进行定制和改造。

## 1、Sentinel Dashboard 安装启动

**1、** SentinelDashboard下载地址；

[Releases · alibaba/Sentinel · GitHub](https://github.com/alibaba/Sentinel/releases)

**2、** 打开命令行窗口，跳转到SentinelDashboardjar包所在的目录，执行以下命令，启动SentinelDashboard；

```bash
java -jar sentinel-dashboard-1.8.4.jar
```

**3、** 启动完成，输出如下；

4、浏览器访问 http:ip:8080 访问 ，如：“http://localhost:8080/”，跳转到 Sentinel 控制台登陆页面

登录账号，默认用户名密码都是 **sentinel/sentinel**

## 2、服务消费者

**1、** 添加依赖；

```xml
<!--spring-cloud-starter-alibaba-sentinel-->
    <dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

**2、** application.properties配置文件；

```bash
#指定sentinel-dashboard控制台的连接地址
spring.cloud.sentinel.transport.dashboard=192.168.133.129:8080
#指定微服务与sentinel-dashboard控制台的连接端口(默认8719)
spring.cloud.sentinel.transport.port=8719
```

**3、** 启动访问，就可看到nacos中，sentinel-DashBoard中都有服务；

4、我们还可以通过访问 http://{微服务注册的ip地址}:8719/api 接口查看微服务暴露给Sentinel控制台调用的API列表

如访问：[http://localhost:8719/api](http://localhost:8719/api)

注：

这里可下载 [JSONVue](https://github.com/gildas-lormeau/JSONVue)

谷歌浏览器的 扩展程序 进行JSON数据格式解析

可参考[Chrome - 谷歌浏览器安装 JSON 格式化插件](https://blog.csdn.net/MinggeQingchun/article/details/125724122)

Sentinel Dashboard是一个独立的web应用，可以接受客户端的连接，然后与客户端之间进行通讯，他们之间使用http协议进行通讯，客户端代码需要引入依赖

```xml
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-transport-simple-http</artifactId>
    <version>1.6.3</version>
</dependency>
```

***spring-cloud-starter-alibaba-sentinel** 依赖已经包含了上述依赖*
