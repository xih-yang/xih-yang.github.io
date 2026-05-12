# 01、SkyWalking技术理论之全链路监控系统分析（Zipkin，Pinpoint，SkyWalking，CAT）
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/1.html
- 分类：链路追踪
- 分组：SkyWalking 全链路监控系统分析
## 一、全链路监控背景

## 1、调用链路的产生背景

### 1.1背景描述

随着微服务架构的流行，服务按照不同的维度进行拆分，一次请求往往需要涉及到多个服务。

互联网应用构建在不同的软件模块集上，这些软件模块，有可能是由不同的团队开发、可能使用不同的编程语言来实现、有可能布在了几千台服务器，横跨多个不同的数据中心。

因此，就需要一些可以帮助理解系统行为、用于分析性能问题的工具，以便发生故障的时候，能够快速定位和解决问题。

全链路监控组件就在这样的问题背景下产生了。

最出名的是谷歌公开的论文提到的 [Google Dapper](https://link.juejin.im/?target=http%3A%2F%2Fbigbully.github.io%2FDapper-translation)。

想要在这个上下文中理解分布式系统的行为，就需要监控那些横跨了不同的应用、不同的服务器之间的关联动作。

所以，在复杂的微服务架构系统中，几乎每一个前端请求都会形成一个复杂的分布式服务调用链路。一个请求完整调用链可能如下图所示：

### 1.2案例

**在google的首页页面，提交一个查询请求后，会经历什么？**

- 可能对上百台查询服务器发起了一个Web查询，每一个查询都有自己的Index
- 这个查询可能会被发送到多个的子系统，这些子系统分别用来处理广告、进行拼写检查或是查找一些像图片、视频或新闻这样的特殊结果
- 根据每个子系统的查询结果进行筛选，得到最终结果，最后汇总到页面上

**总结如下：**

- 一次全局搜索有可能调用上千台服务器，涉及各种服务
- 用户对搜索的耗时是很敏感的，而任何一个子系统的低效都导致最终的搜索耗时

**如果一次查询耗时不正常，工程师怎么来排查到底是由哪个服务调用造成的？**

- 首先，这个工程师可能无法准确的定位到这次全局搜索是调用了哪些服务，因为新的服务、乃至服务上的某个片段，都有可能在任何时间上过线或修改过，有可能是面向用户功能，也有可能是一些例如针对性能或安全认证方面的功能改进
- 其次，你不能苛求这个工程师对所有参与这次全局搜索的服务都了如指掌，每一个服务都有可能是由不同的团队开发或维护的
- 再次，这些暴露出来的服务或服务器有可能同时还被其他客户端使用着，所以这次全局搜索的性能问题甚至有可能是由其他应用造成的

**从上面可以看出调用链系统的需要：**

- 无所不在的部署，无所不在的重要性不言而喻，因为在使用跟踪系统的进行监控时，即便只有一小部分没被监控到，那么人们对这个系统是不是值得信任都会产生巨大的质疑
- 持续的监控

## 2、调用链路带来的问题

在业务规模不断增大、服务不断增多以及频繁变更的情况下，面对复杂的调用链路就带来一系列问题：

- 如何快速发现问题？
- 如何判断故障影响范围？
- 如何梳理服务依赖以及依赖的合理性？
- 如何分析链路性能问题以及实时容量规划？

## 3、请求调用的关注点

我们会关注在请求处理期间各个调用的各项性能指标，比如：吞吐量（TPS）、响应时间及错误记录等。

- 吞吐量，根据拓扑可计算相应组件、平台、物理设备的实时吞吐量。
- 响应时间，包括整体调用的响应时间和各个服务的响应时间等。
- 错误记录，根据服务返回统计单位时间异常次数。

## 4、全链路监控目的

全链路性能监控从整体维度到局部维度展示各项指标，将跨应用的所有调用链性能信息集中展现，可方便度量整体和局部性能，并且方便找到故障产生的源头，生产上可极大缩短故障排除时间。

有了全链路监控工具，我们能够达到：

- 请求链路追踪，故障快速定位：可以通过调用链结合业务日志快速定位错误信息。
- 可视化： 各个阶段耗时，进行性能分析。
- 依赖优化：各个调用环节的可用性、梳理服务依赖关系以及优化。
- 数据分析，优化链路：可以得到用户的行为路径，汇总分析应用在很多业务场景。

## 5、调用链监控好处

- 准确掌握生产一线应用部署情况；
- 从调用链全流程性能角度，识别对关键调用链，并进行优化；
- 提供可追溯的性能数据，量化 IT 运维部门业务价值；
- 快速定位代码性能问题，协助开发人员持续性的优化代码；
- 协助开发人员进行白盒测试，缩短系统上线稳定期；

## 二、调用链监控技术对比

## 1、常见技术

市场常见调用链技术：Zipkin，Pinpoint，SkyWalking，CAT。

## 2、技术特点

### 2.1、Zipkin

是Twitter开源的调用链分析工具，目前基于springcloud sleuth得到了广泛的使用。特点是轻量，使用部署简单。

但是功能较简单。支持技术栈spring-cloud。

### 2.2、Pinpoint

是韩国人开源的基于字节码注入的调用链分析，以及应用监控分析工具，使用java编写。

特点是支持多种插件，UI功能强大，接入端无代码侵入。

使用java探针字节码增加技术，实现对整个应用的监控。对应用零侵入。

### 2.3、SkyWalking

是本土开源的基于字节码注入的调用链分析，以及应用监控分析工具。

2015年由个人吴晟（华为开发者）开源 ， 2017年加入Apache孵化器。

特点是支持多种插件，UI功能较强，接入端无代码侵入。目前已加入Apache孵化器。

其核心是个分布式追踪系统。使用java探针字节码增加技术，实现对整个应用的监控。对应用零侵入。

### 2.4、CAT

是大众点评开源的基于编码和配置的调用链分析，应用监控分析，日志采集，监控报警等一系列的监控平台工具。

集成方案是通过代码埋点的方式来实现监控，比如： 拦截器，注解，过滤器等。 对代码的侵入性很大，集成成本较高。风险较大。

## 3、特性对比

### 3.1实现方式

**类别**

**Zipkin**

**Pinpoint**

**SkyWalking**

**CAT**

**实现方式**

拦截请求，发送（HTTP，mq）数据至zipkin服务

java探针，字节码增强

java探针，字节码增强

代码埋点（拦截器，注解，过滤器等）

### 3.2接入方式

**类别**

**Zipkin**

**Pinpoint**

**SkyWalking**

**CAT**

**接入方式**

基于linkerd或者sleuth方式，引入配置即可

javaagent字节码

javaagent字节码

代码侵入

**OpenTracing**

√

×

√

×

### 3.3通信方式

**类别**

**Zipkin**

**Pinpoint**

**SkyWalking**

**CAT**

**agent到collector通信**

http,MQ

thrift

gRPC

http/tcp

### 3.4常见特性

**类别**

**Zipkin**

**Pinpoint**

**SkyWalking**

**CAT**

**颗粒度**

接口级

方法级

方法级

代码级

**全局调用统计**

×

√

√

√

**traceid查询**

√

×

√

×

**报警**

×

√

√

√

**JVM监控**

×

×

√

√

### 3.5数据存储

**类别**

**Zipkin**

**Pinpoint**

**SkyWalking**

**CAT**

**数据存储**

ES，mysql,
 Cassandra,内存

Hbase

ES，H2

mysql,hdfs

### 3.6页面UI展示

**类别**

**Zipkin**

**Pinpoint**

**SkyWalking**

**CAT**

**健壮度**

**

*****

****

*****

### 3.7 PinPoint和skyWalking支持的插件对比

**类别**

**Pinpoint**

**SkyWalking**

**web容器**

Tomcat6/7/8,Resin,Jetty,JBoss,Websphere

Tomcat7/8/9,Resin,Jetty

**JDBC**

Oracle,mysql

Oracle,mysql,Sharding-JDBC

**消息中间件**

ActiveMQ, RabbitMQ

RocketMQ 4.x,Kafka

**日志**

log4j, Logback

log4j,log4j2, Logback

**HTTP库**

ApacheHTTPClient,GoogleHttpClient, OkHttpClient

ApacheHTTPClient, OkHttpClient,Feign

**Spring体系**

spring,springboot

spring,springboot,eureka,hystrix

**RPC框架**

Dubbo,Thrift

Dubbo,Motan,gRPC,ServiceComb

**NOSQL**

Memcached, Redis, CASSANDRA

Memcached, Redis

### 3.8社区活跃度

**类别**

**Zipkin**

**Pinpoint**

**SkyWalking**

**CAT**

**STAR**

8.4k

5.9k

3.3k

4.9k

### 3.9缺点

**类别**

**Zipkin**

**Pinpoint**

**SkyWalking**

**CAT**

**缺点**

默认使用的http请求向zipkin上报信息，耗性能；
 跟sleuth结合可以使用rabbitMQ的方式异步来做，增加了复杂度，需要引入rabbitMQ ；
 数据分析比较简单。

不支持查询单个调用链， 对外表现的是整个应用的调用生态；
 二次开发难度较高。

3.2版本之前BUG较多 ，网上反映兼容性较差；
 依赖较多。

代码侵入性较强，需要埋点；
 文档比较混乱，文档与发布版本的符合性较低；
 需要依赖大众点评私服。

## 三、SkyWalking

## 1、背景

### 1.1描述

在目前的微服务或者分布式架构下，分布式追踪变得很重要，在开发测试中可以帮助我们更快发现架构或者一些设计有问题的地方，在生产上可以帮我们统计和分析服务器性能和一些部署相关的问题，还可以帮助我们解决或者分析一些未知的问题。

skywalking的定位是apm，不仅提供了自动分布式追踪，还可以通过手动埋探针的方式去处理我们的一些特殊问题。同时它还支持了很多中间件和jvm监控，这是目前一些分布式追踪技术未能解决的问题。

比如spring cloud sleuth zipkin技术，不能解决kafka等一些中间件和jvm的监控功能，也不支持自定义去追踪自己想要了解的链路信息。

在这些方面skywalking做的还是比较好，通过探针的方式来进行监控做到代码0侵入性，而开销也不是很大。

### 1.2案例

随着微服务架构的流行，一些微服务架构下的问题也会越来越突出。

比如一个请求会涉及多个服务，而服务本身可能也会依赖其他服务，整个请求路径就构成了一个网状的调用链，而在整个调用链中一旦某个节点发生异常，整个调用链的稳定性就会受到影响。

所以会深深的感受到 "银弹" 这个词是不存在的，每种架构都有其优缺点 。

面对以上情况， 我们就需要一些可以帮助理解系统行为、用于分析性能问题的工具，以便发生故障的时候，能够快速定位和解决问题，这就是所谓的APM（应用性能管理）。

## 2、是什么

### 1.1、解释

Skywalking是一款APM（应用程序性能监视器），尤其适用于微服务，Cloud Native和基于容器的架构系统。也称为分布式跟踪系统。

它提供了一种自动检测应用程序的方法：无需更改目标应用程序的任何源代码; 以及具有高效流媒体模块的收集器。

针对分布式系统的APM（应用性能监控）系统，特别针对微服务、cloud native和容器化(Docker, Kubernetes, Mesos)架构， 其核心是个分布式追踪系统。

该项目由国人吴晟基于OpenTracking实现的开源项目skywalking（码云、github）。

2017年12月8日，Apache软件基金会孵化器项目管理委员会 ASF IPMC宣布"SkyWalking全票通过，进入Apache孵化器"。

### 1.2、github官网

使用Skywalking实现全链路监控。

Zipkin与Apache SkyWalking共舞—SkyWalking分析 Zipkin 追踪数据。

SkyWalking的发展之路—从无名小卒到拥抱全球。

### 1.3、apache官网

[https://github.com/apache/incubator-skywalking](https://github.com/apache/incubator-skywalking)

SkyWalking：一种APM（应用程序性能监视器）系统，专为微服务，云原生和基于容器（Docker，Kubernetes，Mesos）架构而设计。

**SkyWalking**: an APM(application performance monitor) system, especially designed for microservices, cloud native and container-based (Docker, Kubernetes, Mesos) architectures.

## 3、有何用

- 为微服务架构和云原生架构系统而设计，并且支持分布式链路追踪的APM系统（即应用性能监控系统）。它通过探针自动收集所需的指标，并进行分布式追踪。
- 通过这些调用链路以及指标，Skywalking会感知应用间关系和服务间关系，并进行相应的指标统计。
- [Skywalking](https://github.com/apache/incubator-skywalking)通过加载探针的方式收集应用调用链路信息，并对采集的调用链路信息进行分析，生成应用间关系和服务间关系以及服务指标。
- [Skywalking](https://github.com/apache/incubator-skywalking)目前支持多种语言，其中包括[Java](https://github.com/apache/incubator-skywalking)，[.Net Core](https://github.com/OpenSkywalking/skywalking-netcore)，[Node.js](https://github.com/OpenSkywalking/skywalking-nodejs)和[Go](https://github.com/OpenSkywalking/skywalking-go)语言。
- 目前支持链路追踪和监控应用组件如下，基本涵盖主流框架和容器，如国内的Dubbo、motan等，以及国际化的spring boot，spring cloud都支持。

## 4、特性

[https://github.com/apache/incubator-skywalking](https://github.com/apache/incubator-skywalking)

apache官网：

Abstract

SkyWalking is an open source APM system, including monitoring, tracing, diagnosing capabilities for distributed system in Cloud Native architecture. The core features are following.

Service, service instance, endpoint metrics analysis

Root cause analysis

Service topology map analysis

Service, service instance and endpoint dependency analysis

Slow services and endpoints detected

Performance optimization

Distributed tracing and context propagation

Alarm

用于追踪、监控和诊断分布式系统，特别是为使用微服务架构，提供以下主要功能：

- **分布式追踪和上下文传输**
- **应用、实例、服务性能指标分析**
- **根源分析**
- **应用拓扑分析**
- **应用和服务依赖分析**
- **慢服务检测**
- **性能优化**

## 5、优点

性能好，针对单实例5000tps的应用，在全量采集的情况下，只增加 10% 的CPU开销。详细评测见《skywalking agent performance test》。

支持多语言探针。

支持自动及手动探针。

自动探针：Java支持的中间件、框架与类库列表;

手动探针：OpenTrackingApi、@Trace注解、trackId集成到日志中。

采用探针技术，在使用过程中，完全是0代码，无侵入，分布式自动采集与监控系统运行。

[https://www.cnblogs.com/xiaoqi/p/skywalking-usage.html](https://www.cnblogs.com/xiaoqi/p/skywalking-usage.html)

[https://blog.csdn.net/qq_36236890/article/details/79647017](https://blog.csdn.net/qq_36236890/article/details/79647017)

- **Java自动探针，追踪和监控程序时，不需要修改应用程序源代码 。**
- **手动探针。它支持手动探针去追踪业务方法**
- **多种后端存储：ElasticSearch， H2。采用elasticsearch做数据存储，能够达到实时搜索、稳定、可靠。**
- **核心的Collector为纯Java后端实现，提供RESTful和gRPC接口。兼容接受其他语言探针发送数据。**
- **支持**[OpenTracing](http://opentracing.io/)
- **Java自动探针支持和OpenTracing API协同工作**
- **轻量级、完善功能的后端聚合和分析**
- **现代化Web UI。提供了良好的可视化管理界面，包括应用、实例、服务性能指标分析、拓扑图、分布式追踪、性能预警。**
- **日志集成**
- **应用、实例和服务的告警**

## 6、Web功能

目前Skywalking已经支持从6个可视化维度剖析分布式系统的运行情况。

- **总览视图是应用和组件的全局视图，其中包括组件和应用数量，应用的告警波动，慢服务列表以及应用吞吐量；**
- **拓扑图从应用依赖关系出发，展现整个应用的拓扑关系；**
- **应用视图则是从单个应用的角度，展现应用的上下游关系，TopN的服务和服务器，JVM的相关信息以及对应的主机信息；**
- **服务视图关注单个服务入口的运行情况以及此服务的上下游依赖关系，依赖度，帮助用户针对单个服务的优化和监控；**
- **调用链展现了调用的单次请求经过的所有埋点以及每个埋点的执行时长；**
- **告警视图根据配置阈值针对应用、服务器、服务进行实时告警。**

## 四、技术架构

## 1、架构图

[https://github.com/apache/incubator-skywalking](https://github.com/apache/incubator-skywalking)

[https://www.cnblogs.com/xiaoqi/p/skywalking-usage.html](https://www.cnblogs.com/xiaoqi/p/skywalking-usage.html)

[https://www.jianshu.com/p/2fd56627a3cf](https://www.jianshu.com/p/2fd56627a3cf)

**说明：**

上面的架构图看似模块有点多，但在实际使用时我们并不需要关注太多的实现方式，HTTP、gRPC 、GraphQL 这些都是其内部架构使用到的技术，我们只需安装 SkyWalking Collecter、Elasticsearch 或 H2，然后在需要追踪的服务内配置少量的代码（Java 项目通过修改 JVM 参数即可），最后通过 SkyWalking UI 查看结果。

## 2、三大组件

### 2.1概述

[https://blog.csdn.net/zhangkang65/article/details/78991760](https://blog.csdn.net/zhangkang65/article/details/78991760)

SkyWalking总体架构分为三部分

- skywalking-agent：探针，用来收集和发送数据到归集器。
- skywalking-collector：链路数据归集器，数据可以落地ElasticSearch，单机也可以落地H2，不推荐，H2仅作为临时演示用。
- skywalking-web：web可视化平台，用来展示落地的数据。

### 2.2关系

**2、** 2.1、部署4部分；

- collector：主要为收集agent发送过来的数据，和为web提供接口服务
- web：主要提供UI监控服务
- agent：探针，获取应用信息
- ES：其中数据存储为elasticsearch（5.0版本以下单机支持本地h2）

**2、** 2.2、关系说明；

通过在应用程序中添加 SkyWalking Agent，就可以将接口、服务、数据库、MQ等进行追踪，将追踪结果通过 HTTP 或 gRPC 发送到 SkyWalking Collecter。

SkyWalking Collecter 经过分析和聚合，将结果存储到 Elasticsearch 或 H2。

SkyWalking 同时提供了一个 SkyWalking UI 的可视化界面，UI 以 GraphQL + HTTP 方式获取存储数据进行展示。
