# 1、Sentinel 简介+安装控制台
- 来源：https://ddkk.com/zhuanlan/guarantee/sentinel/1.html
- 分类：服务保障
- 分组：Sentinel 之 使用教程（A）
随着分布式系统变得越来越流行，服务之间的可靠性变得比以往任何时候都更加重要。Sentinel以“流”为切入点，并在流控制， 流量整形，电路中断和系统自适应保护等多个领域工作，以确保微服务的可靠性和弹性。

## 特性

**1、丰富的适用场景**：Sentinel已在阿里巴巴中广泛使用，并且在过去10年中涵盖了Double-11（11.11）购物节中几乎所有的核心场景，例如“ Second Kill”需要将突发流量限制为满足系统容量，消息峰值削波和谷底填充，不可靠下游服务的断路，集群流量控制等。

**2、实时监控**：Sentinel还提供了实时监控功能。您可以实时查看单个计算机的运行时信息，以及少于500个节点的群集的聚合运行时信息。

**3、广泛的开源生态系统**：Sentinel提供了与常用框架和库（如Spring Cloud，Dubbo和gRPC）的现成集成。您只需将适配器依赖项添加到服务中即可轻松使用Sentinel。

**4、多种语言支持**：Sentinel已为Java，Go和C ++提供了本机支持。

**5、各种SPI扩展**：Sentinel提供了易于使用的SPI扩展接口，使您可以快- 速自定义逻辑，例如，自定义规则管理，调整数据源等。

Sentinel 的主要特性

Sentinel 的开源生态

Sentinel 分为两个部分

- 核心库（Java 客户端）不依赖任何框架/库，能够运行于所有 Java 运行时环境，同时对 Dubbo / Spring Cloud 等框架也有较好的支持。
- 控制台（Dashboard）基于 Spring Boot 开发，打包后可以直接运行，不需要额外的 Tomcat 等应用容器。

同类组件功能对比：

## 控制台

Sentinel 提供一个轻量级的开源控制台，它提供机器发现以及健康情况管理、监控（单机和集群），规则管理和推送的功能。

**Sentinel 控制台包含如下功能:**

- 查看机器列表以及健康情况：收集 Sentinel 客户端发送的心跳包，用于判断机器是否在线。
- 监控 (单机和集群聚合)：通过 Sentinel 客户端暴露的监控 API，定期拉取并且聚合应用监控信息，最终可以实现秒级的实时监控。
- 规则管理和推送：统一管理推送规则。
- 鉴权：生产环境中鉴权非常重要。这里每个开发者需要根据自己的实际情况进行定制。

**注意**：Sentinel 控制台目前仅支持单机部署。Sentinel 控制台项目提供 Sentinel 功能全集示例，不作为开箱即用的生产环境控制台，若希望在生产环境使用请根据文档自行进行定制和改造。

## 安装控制台

**1、** 下载jar包，[下载地址](https://github.com/alibaba/Sentinel/releases)；

**2、** 编写启动cmd脚本；

```java
java -Dserver.port=8080 -Dproject.name=sentinel-dashboard -Dsentinel.dashboard.auth.username=admin -Dsentinel.dashboard.auth.password=123456 -jar sentinel-dashboard-1.7.2.jar
```

**1、** 使用8080端口启动并访问控制台，使用admin/123456登录，安装成功；
