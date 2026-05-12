# 38、SpringCloud Alibaba Dubbo（1）项目简介与功能完成度
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/71.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.项目简介

Dubbo Spring Cloud 基于 Dubbo Spring Boot 2.7.1 和 Spring Cloud 2.x 开发，无论开发人员是 Dubbo 用户还是 Spring Cloud 用户，都能轻松地驾驭，并以接近“零”成本的代价使应用向上迁移。Dubbo Spring Cloud 致力于简化 Cloud Native 开发成本，提高研发效能以及提升应用性能等目的。

Dubbo Spring Cloud 首个 Preview Release，随同 SpringCloud Alibaba 0.2.2.RELEASE 和 0.9.0.RELEASE 一同发布，分别对应 Spring Cloud Finchley 与 Greenwich(下文分别简称为 “F” 版 和 “G” 版)

## 2.功能的完成度

由于 Dubbo Spring Cloud 构建在原生的 Spring Cloud 之上，其服务治理方面的能力可认为是 Spring Cloud Plus，不仅完全覆盖 Spring Cloud 原生特性，而且提供更为稳定和成熟的实现，特性比对如下表所示：

功能组件
Spring Cloud
Dubbo Spring Cloud

分布式配置（Distributed configuration）
Git、Zookeeper、 Consul、JDBC
Spring Cloud 分布式配置 + Dubbo 配置中心

服务注册与发现（Service registration and discovery）
Eureka、 Zookeeper、 Consul
Spring Cloud 原生注册中心 + Dubbo 原生注册中心

负载均衡（Load balancing）
Ribbon（随机、 轮询等算法）
Dubbo 内建实现（随机、轮询等算法 + 权重等特性）

服务熔断（Circuit Breakers）
Spring Cloud Hystrix
Spring Cloud Hystrix + Alibaba Sentinel[9] 等

服务调用 （Service-to-service calls）
Open Feign、 RestTemplate
Spring Cloud 服务调用 + Dubbo @Reference

链路跟踪（Tracing）
Spring Cloud Sleuth[10] + Zipkin[11]
Zipkin、opentracing 等
