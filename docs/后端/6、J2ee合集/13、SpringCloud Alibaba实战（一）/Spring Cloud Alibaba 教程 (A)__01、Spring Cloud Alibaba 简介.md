# 01、Spring Cloud Alibaba 简介
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/1/1.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
Spring Cloud 本身并不是一个拿来即可用的框架，它是一套微服务规范，共有两代实现。

> Spring Cloud Netflix 是 Spring Cloud 的第一代实现，主要由 Eureka、Ribbon、Feign、Hystrix 等组件组成。
>
> Spring Cloud Alibaba 是 Spring Cloud 的第二代实现，主要由 Nacos、Sentinel、Seata 等组件组成。

## 一、Spring Cloud Alibaba

**Spring Cloud Alibaba 官网**

[Spring Cloud Alibaba](https://spring.io/projects/spring-cloud-alibaba)

**GitHub地址**：[https://github.com/alibaba/spring-cloud-alibaba](https://github.com/alibaba/spring-cloud-alibaba)

> Spring Cloud Alibaba provides a one-stop solution for distributed application development. It contains all the components required to develop distributed applications, making it easy for you to develop your applications using Spring Cloud.
>
> With Spring Cloud Alibaba, you only need to add some annotations and a small amount of configurations to connect Spring Cloud applications to the distributed solutions of Alibaba, and build a distributed application system with Alibaba middleware.
>
> Features
>
> Spring Cloud
>
>
> Flow control and service degradation：flow control, circuit breaking and system adaptive protection with Alibaba Sentinel
> Service registration and discovery：instances can be registered with Alibaba Nacos and clients can discover the instances using Spring-managed beans. Supports Ribbon, the client side load-balancer via Spring Cloud Netflix
> Distributed Configuration：using Alibaba Nacos as a data store
> Event-driven：building highly scalable event-driven microservices connected with Spring Cloud Stream RocketMQ Binder
> Message Bus: link nodes of a distributed system with Spring Cloud Bus RocketMQ
> Distributed Transaction：support for distributed transaction solution with high performance and ease of use with Seata
> Dubbo RPC：extend the communication protocols of Spring Cloud service-to-service calls by Apache Dubbo RPC
>
> Spring Cloud Alibaba为分布式应用开发提供一站式解决方案。它包含了开发分布式应用程序所需的所有组件，使您能够轻松地使用Spring Cloud开发应用程序。
>
> 有了Spring Cloud Alibaba，你只需要添加一些注释和少量的配置，就可以把Spring Cloud的应用和阿里巴巴的分布式解决方案连接起来，用阿里巴巴中间件搭建分布式应用系统。
>
> 特性
>
> 1、流量控制和服务退化:阿里巴巴哨兵的流量控制、断路和系统自适应保护
>
> 2、服务注册和发现:可以向Alibaba Nacos注册实例，客户端可以使用spring管理的bean发现实例。通过Spring Cloud Netflix支持客户端负载均衡器Ribbon
>
> 3、分布式配置:使用阿里巴巴Nacos作为数据存储
>
> 4、事件驱动:构建高度可伸缩的事件驱动微服务，并与Spring Cloud Stream RocketMQ Binder连接
>
> 5、消息总线:使用Spring Cloud Bus RocketMQ连接分布式系统的节点
>
> 6、分布式事务:支持高性能、易用的Seata分布式事务解决方案
>
> 7、Dubbo RPC:通过Apache Dubbo RPC扩展Spring Cloud service-to-service调用的通信协议

2018 年 12 月12 日，Netflix 公司宣布 Spring Cloud Netflix 系列大部分组件都进入维护模式，不再添加新特性。因此各大互联网公司开始使用Spring Cloud 的第二代实现：Spring Cloud Alibaba

## 1、Spring Cloud Alibaba 组件

Spring Cloud Alibaba 包含了多种开发分布式微服务系统的必需组件

**1、****Nacos**：阿里巴巴开源产品，一个更易于构建云原生应用的动态服务发现,配置管理和服务管理平台；

**2、****Sentinel**：阿里巴巴开源产品，把流量作为切入点,从流量控制,熔断降级,系统负载保护等多个维度保护服务的稳定性；

**3、****RocketMQ**：ApacheRocketMQ是一款基于Java的高性能、高吞吐量的分布式消息和流计算平台；

**4、****Dubbo**：ApacheDubbo是一款高性能的JavaRPC框架；

**5、****Seata**：阿里巴巴开源产品，一个易于使用的高性能微服务分布式事务解决方案；

**6、****AlibabaCloudOSS**：阿里云对象存储服务器（ObjectStorageService，简称OSS），是阿里云提供的海量、安全、低成本、高可靠的云存储服务；

**7、****AlibabaCloudSchedulerx**：阿里中间件团队开发的一款分布式调度产品,支持周期性的任务与固定时间点触发任务；

通过Spring Cloud Alibaba 的这些组件，我们只需要添加一些注解和少量配置，就可以将 Spring Cloud 应用接入阿里微服务解决方案，通过阿里中间件来迅速搭建分布式应用系统

## 2、Spring Cloud Alibaba 版本依赖

### 1、SpringCloud和SpringBoot关联

SpringBoot专注于快速方便的开发单个个体微服务。

SpringCloud是关注全 局的微服务协调整理治理框架，它将SpringBoot开发的一个个单体微服务整合并管理起来，为各个微服务之间提供:配置管理，服务发现，断路器，路由，微代理，事件总线，全局锁，决策竞选，分布式会话等等集成服务。

**SpringBoot专注于快速、方便的开发单个个体微服务, SpringCloud关注全局的服务治理框架**

**Spring Boot 不需要 Spring Cloud，就能直接创建可独立运行的工程或模块**

**Spring Cloud 是基于 Spring Boot 实现的，它不能独立创建工程或模块，更不能脱离 Spring Boot 独立运行**

Spring Cloud 与 Spring Boot的兼容版本对应关系如下（参考自[Spring Cloud](https://spring.io/projects/spring-cloud) 官网）

### 2、Spring Cloud、Spring Cloud Alibaba 以及 Spring Boot 之间版本依赖关系如下

注：刚开始博主在 Spring Cloud Alibaba 官方没有找到文档专门说明对应关系，加了一些官网技术群咨询；不过最近博主在GitHub上找到了版本说明，以及组件版本关系

官网文档：[版本说明 · alibaba/spring-cloud-alibaba Wiki · GitHub][_ alibaba_spring-cloud-alibaba Wiki _ GitHub]

Spring Cloud Alibaba 版本
Spring Cloud 版本
Spring Boot 版本

2021.0.1.0
Spring Cloud 2021.0.1
2.6.3

2021.1
Spring Cloud 2020.0.1
2.4.2

2.2.8.RELEASE
Spring Cloud Hoxton.SR12
2.3.12.RELEASE

2.2.7.RELEASE
Spring Cloud Hoxton.SR12
2.3.12.RELEASE

2.2.6.RELEASE
Spring Cloud Hoxton.SR9
2.3.2.RELEASE

2.1.4.RELEASE
Spring Cloud Greenwich.SR6
2.1.13.RELEASE

2.2.1.RELEASE
Spring Cloud Hoxton.SR3
2.2.5.RELEASE

2.2.0.RELEASE
Spring Cloud Hoxton.RELEASE
2.2.X.RELEASE

2.1.2.RELEASE
Spring Cloud Greenwich
2.1.X.RELEASE

2.0.4.RELEASE（停止维护，建议升级）
Spring Cloud Finchley
2.0.X.RELEASE

1.5.1.RELEASE（停止维护，建议升级）
Spring Cloud Edgware
1.5.X.RELEASE

## 3、Spring Cloud Alibaba 组件版本关系

官网文档：[版本说明 · alibaba/spring-cloud-alibaba Wiki · GitHub][_ alibaba_spring-cloud-alibaba Wiki _ GitHub]

Spring Cloud Alibaba 下各组件版本关系如下

Spring Cloud Alibaba 版本
Sentinel 版本
Nacos 版本
RocketMQ 版本
Dubbo 版本
Seata 版本

2.2.8.RELEASE

1.8.4

2.1.0

4.9.3

~

1.5.1

2021.0.1.0

1.8.3

1.4.2

4.9.2

~

1.4.2

2.2.7.RELEASE
1.8.1
2.0.3
4.6.1
2.7.13
1.3.0

2.2.6.RELEASE
1.8.1
1.4.2
4.4.0
2.7.8
1.3.0

2021.1 or 2.2.5.RELEASE or 2.1.4.RELEASE or 2.0.4.RELEASE
1.8.0
1.4.1
4.4.0
2.7.8
1.3.0

2.2.3.RELEASE or 2.1.3.RELEASE or 2.0.3.RELEASE
1.8.0
1.3.3
4.4.0
2.7.8
1.3.0

2.2.1.RELEASE or 2.1.2.RELEASE or 2.0.2.RELEASE
1.7.1
1.2.1
4.4.0
2.7.6
1.2.0

2.2.0.RELEASE
1.7.1
1.1.4
4.4.0
2.7.4.1
 1.0.0

2.1.1.RELEASE or 2.0.1.RELEASE or 1.5.1.RELEASE
1.7.0
1.1.4
4.4.0
2.7.3
0.9.0

2.1.0.RELEASE or 2.0.0.RELEASE or 1.5.0.RELEASE
1.6.3
1.1.1
4.4.0
2.7.3
0.7.1

## 4、Spring Cloud Alibaba 和 Spring Cloud Netflix组件对比

下表展示了 Spring Cloud 两代实现的组件对比

Spring Cloud 第一代实现（Netflix）
状态
Spring Cloud 第二代实现（Alibaba）
状态

Ereka
2.0 孵化失败
Nacos Discovery
性能更好，感知力更强

Ribbon
停止更新，进入维护
Spring Cloud Loadbalancer
Spring Cloud 原生组件，用于代替 Ribbon

Hystrix
停止更新，进入维护
Sentinel
可视化配置，上手简单

Zuul
停止更新，进入维护
Spring Cloud Gateway
性能为 Zuul 的 1.6 倍

Spring Cloud Config
搭建过程复杂，约定过多，无可视化界面，上手难点大
Nacos Config
搭建过程简单，有可视化界面，配置管理更简单，容易上手
