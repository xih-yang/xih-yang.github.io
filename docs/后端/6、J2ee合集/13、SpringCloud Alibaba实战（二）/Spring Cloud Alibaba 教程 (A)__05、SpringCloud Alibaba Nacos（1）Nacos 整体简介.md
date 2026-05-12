# 05、SpringCloud Alibaba Nacos（1）Nacos 整体简介
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/38.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
## 1.什么是 Nacos?

- Nacos 致力于发现、配置和管理微服务。它提供了一组简单易用的特性集，帮助快速实现动态服务发现、服务配置、服务元数据及流量管理。使用 Nacos 可以更敏捷和容易地构建、交付和管理微服务平台。 Nacos 是构建以“服务”为中心的现代应用架构 (例如微服务范式、云原生范式) 的服务基础设施。
- 服务（Service）是 Nacos 世界的一等公民。Nacos 支持几乎所有主流类型的“服务”的发现、配置和管理：
- Kubernetes Service.
- gRPC & Dubbo RPC Service.
- Spring Cloud RESTful Service

## 2.Nacos 的关键特性

- 服务发现和服务健康监测 ，支持基于 DNS 和 RPC 的服务发现，支持基于传输层和应用层的监控检查；
- 动态配置服务 ，可以以中心化、外部化和动态化的方式管理所有环境的应用配置和服务配置，同时支持版本追踪和一键回滚等功能；
- 动态 DNS 服务 ，动态 DNS 服务支持权重路由，让您更容易地实现中间层负载均衡、更灵活的路由策略、流量控制以及数据中心内网的简单 DNS 解析服务；
- 服务及其元数据管理 ，管理数据中心的所有服务及元数据，包括管理服务的描述、生命周期、服务的静态依赖分析、服务的健康状态、服务的流量管理、路由及安全策略、服务的 SLA 以及最首要的 metrics 统计数据

## 3.Nacos 的核心概念

- 服务 (Service)

服务是指一个或一组软件功能（例如特定信息的检索或一组操作的执行），其目的是不同的客户端可以为不同的目的重用（例如通过跨进程的网络调用）。Nacos 支持主流的服务生态，如 Kubernetes Service、gRPC|Dubbo RPC Service 或者 Spring Cloud RESTful Service.
- 服务注册中心 (Service Registry)

服务注册中心，它是服务实例及元数据的数据库。服务实例在启动时注册到服务注册表，并在关闭时注销。服务和路由器的客户端查询服务注册表以查找服务的可用实例。服务注册中心可能会调用服务实例的健康检查 API 来验证它是否能够处理请求。
- 服务元数据 (Service Metadata)

服务元数据是指包括服务端点(endpoints)、服务标签、服务版本号、服务实例权重、路由规则、安全策略等描述服务的数据
- 服务提供方 (Service Provider)

是指提供可复用和可调用服务的应用方
- 服务消费方 (Service Consumer)

是指会发起对某个服务调用的应用方
- 配置 (Configuration)

在系统开发过程中通常会将一些需要变更的参数、变量等从代码中分离出来独立管理，以独立的配置文件的形式存在。目的是让静态的系统工件或者交付物（如 WAR，JAR 包等）更好地和实际的物理运行环境进行适配。配置管理一般包含在系统部署的过程中，由系统管理员或者运维人员完成这个步骤。配置变更是调整系统运行时的行为的有效手段之一。
- 配置管理 (Configuration Management)

在数据中心中，系统中所有配置的编辑、存储、分发、变更管理、历史版本管理、变更审计等所有与配置相关的活动统称为配置管理。
- 名字服务 (Naming Service)

提供分布式系统中所有对象(Object)、实体(Entity)的“名字”到关联的元数据之间的映射管理服务，例如 ServiceName -> Endpoints Info, Distributed Lock Name -> Lock Owner/Status Info, DNS Domain Name -> IP List, 服务发现和 DNS 就是名字服务的 2 大场景。
- 配置服务 (Configuration Service)

在服务或者应用运行过程中，提供动态配置或者元数据以及配置管理的服务提供者。
