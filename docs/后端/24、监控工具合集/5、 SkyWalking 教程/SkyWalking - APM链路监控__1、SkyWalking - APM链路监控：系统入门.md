# 1、SkyWalking - APM链路监控：系统入门
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/15.html
- 分类：链路追踪
- 分组：SkyWalking - APM链路监控
## 微服务开发遇到的问题

在微服务架构系统中，系统被拆分为各个独立服务系统，例如一个电商，会独立出用户、订单、库存、商品等等子系统，往往每个实例都使用独立的存储系统，甚至使用的语言都会不通。他们之间相互协作，通过rest或者rpc调用完成业务操作。

但是随着业务越来越复杂，调用关系也会很复杂：

发现问题时：

- 无法追踪定位具体是哪个服务异常
- 无法综合了解每个服务状态

## 什么是APM

APM的全称是Application Performance Monitor，帮助理解系统行为、用于分析性能问题的工具，以便发生故障的时候，能够快速定位和解决问题，这就是APM系统。

常用的APM系统：

- cat: 大众点评开源，实现方式为代码埋点，自带报表系统，集成时需要入侵代码，[地址](https://github.com/dianping/cat)
- pinpoint: 韩国团队开发，通过JavaAgent实现，功能丰富，但收集数据过多，性能较差，[地址](https://github.com/naver/pinpoint)
- zipkin :推特开源，与spring cloud集成较好，但也需修改代码[地址](https://github.com/openzipkin/zipkin)
- skywalking : 华为吴晟开源，通过JavaAgent实现（本系列使用）

## OpenTracing

**开放式分布式追踪规范**

分布式链路追踪最早由2010年提出的，当时谷歌发布了一篇DApper论文，介绍了谷歌自研的分布式链路追踪的实现原理。2012年Zipkin发布。

OpenTracing通过提供平台无关、厂商无关的API，使得开发人员能够方便的添加（或更换）追踪系统的实现。

OpenTracing提供了用于运营支撑系统的和针对特定平台的辅助程序库。

## SkyWalking资料地址

[GitHub地址](https://github.com/apache/skywalking)

[官网地址](https://skywalking.apache.org/)

[V8.0文档](https://github.com/apache/skywalking/tree/v8.1.0/docs)

## 什么是 SkyWalking

一个开放源代码的可观察性平台，用于收集，分析，聚合和可视化来自服务和云本机基础结构的数据。SkyWalking提供了一种简便的方法来维护您的分布式系统的清晰视图，即使在整个云中也是如此。它是一种现代的APM，专门为基于云的基于容器的分布式系统而设计。

## 特性

- 多种监控手段，语言探针和service mesh
- 多语言自动探针，Java, .Net Core, PHP, NodeJS, Golang, LUA
- 轻量高效，不需要大数据
- 模块化，UI、存储、集群管理多种机制可选
- 支持告警
- 优秀的可视化方案

## 架构

从逻辑上讲，SkyWalking分为四个部分：探针，平台后端，存储和UI。

- 探针收集数据并重新格式化以符合SkyWalking的要求（不同的探针支持不同的来源）。
- 平台后端，支持数据聚合，分析并驱动从探针到UI的流程。该分析包括SkyWalking本机跟踪和度量，第三方，包括Istio和Envoy遥测，Zipkin跟踪格式等。您甚至可以通过使用针对本机度量的Observability Analysis Language和针对扩展度量的Meter System来定制聚合和分析。
- 存储设备通过开放/可插入的界面存储 SkyWalking数据。您可以选择现有的实现，例如ElasticSearch，H2或由Sharding-Sphere管理的MySQL集群，也可以实现自己的实现。
- UI是一个高度可定制的基于Web的界面，允许SkyWalking最终用户可视化和管理SkyWalking数据。
