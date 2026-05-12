# 01、SpringCloud Gateway API网关概述
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/17.html
- 分类：API网关
- 分组：SpringCloud Gateway
## API网关（服务网关）

### 概念

APlGateway (API网关)，顾名思义，是出现在系统边界上的一个面向API的、串行集中式的强管控服务，这里的边界是企业Ⅰ系统的边界，可以理解为企业级应用防火墙，主要起到隔离外部访问与内部系统的作用。在微服务概念的流行之前，API网关就已经诞生了，例如银行、证券等领域常见的前置机系统，它也是解决访问认证、报文转换、访问统计等问题的。

API网关的流行，源于近几年来移动应用与企业互联需求的兴起。移动应用、企业互联，使得后台服务支持的对象，从以前单一的Web应用，扩展到多种使用场景，且每种使用场景对后台服务的要求都不尽相同。这不仅增加了后台服务的响应量，还增加了后台服务的复杂性。随着徵服务架构概念的提出，API网关成为了微服务架构的一个标配组件。

API网关是一个服务器，是系统对外的唯一入口。API网关封装了系统内部架构，为每个客户端提供定制的API。所有的客户端和消费都通过统一的网关接入微服务，在网关层处理所有非业务功能。

但对于服务数量众多、复杂度比较高、规模比较大的业务来说，引入API网关有一系列的好处:

- 聚合接口使得服务对调用者透明，客户端与后端的耦合度降低
- 聚合后台服务，节省流量。提高性能，提升户体验
- 提供安全、流控、过滤、缓存、计费、监控等API管理功能

### API 网关的作用

API网关的主要作用包括如下几点：

**1. 统一对外接口**

当用户需要集成不同产品或者服务之间的功能，调用不同服务提供的能力。利用APIGateway可以让用户在不感知服务边缘的情况下，利用统一的接口组装服务。

对于公司内部不同的服务，提供的接口可能在风格上存在一定的差异，通过APIGateway可以统一这种差异。 当内部服务修改时，可以通过APIGateway进行适配，不需要调用方进行调整。

**2. 增加系统安全性**

APIGateway对外部和内部进行了隔离，减少对外暴露服务可以增加系统安全性，保障了后台服务的安全性。

**3. 统一鉴权**

通过APIGateway对访问进行统一鉴权，不需要每个应用单独对调用方进行鉴权，应用可以专注业务。

**4. 服务注册与授权**

可以控制调用方可以使用和不可以使用的服务。

**5. 服务限流**

通过APIGateway可以对调用方调用每个接口的每日调用及总调用次数限制。

**6. 提升预发能力**

为服务熔断，灰度发布，线上测试提供简单方案。

**7. 全链路跟踪**

通过APIGateway提供的唯一请求Id，监控调用流程，以及调用的响应时间。

### 常用网关解决方案

#### 1. Netlix Zuul

[zuul](https://github.com/Netflix/zuul)是Netflx公司开源的一个API网关组件，Spring Cloud对其进行二次基于Spring Boot的注解式封装做到开箱即用。目前来说，结合sring Cloud 提供的服务治理体系，可以做到请求转发，根据配置或者默认的路由规则进行路由和Load Balance，无痛集成hystrix。

虽然可以通过自定义Filter实现我们想要的功能，但是由于zuul本身的设计是基于单线程的接收请求和转发处理，是阻塞10，不支持长连接。目前来看ZuulI就显得很鸡肋，随着Zuul2.x一直跳票(2019年5月发布了Zuul 2.0版本)，Spring Cloud推出自己的网关组件Spring Cloud Gateway。

#### 2. Spring Cloud Gateway

[Spring Cloud Gateway](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/#gateway-starter)作为Spring Cloud 生态系统中的网关，目标是替代 Netlix Zuul，其不仅提供统一的路由方式，并且还基于Filter链的方式提供了网关基本的功能。

Spring Cloud Gateway是基于Spring生态系统之上构建的API网关，包括: Spring 5，Spring Boot 2和Project Reactor。Spring cloud Gateway旨在提供一种简单而有效的方法来路由到API，并为它们提供跨领域的关注点，例如:安全性，监视/指标，限流等。由于Spring 5.0支持Netty，Http2，而Spring Boot 2.0支持 Spring 5.0，因此Spring Cloud Gateway支持 Netty和Http2顺理成章。

#### 3. Nginx + Lua

Nginx是由lgorSysoev为俄罗斯访阿量第二的 Ramble.ru站点开发的，一个高性能的 HTTP和反向代理服务器。Nginx一方面可以做反向代理，另外—方面做可以做静态资源服务器。

Nginx适合做门户网关，是作为整个全局的网关，对外的处于最外层的那种，而Gateway属于业务网关，主要用来对应不同的客户端提供服务，用于聚合业务。各个微服务独立部署，职责单一，对外提供服务的时候需要有一个东西把业务聚合起来。

Gateway 可以实现熔断、重试等功能，这是Nginx不具备的。

#### 4. Kong

[Kong](https://docs.konghq.com/) 是 Mashape提供的一款API管理软件，它本身是基于Ngnix + Lua的，但比 Nginx提供了更简单的配置方式，数据采用了Apache Cassandra/PostgresSQL存储，并且提供了一些优秀的插件，比如验证，日志，调用频次限制等。Kong非常诱人的地方就是提供了大量的插件来扩展应用，通过设置不同的插件可以为服务提供各种增强的功能。

**优点**:基于Nginx.所以在性能和稳定性上都没有问题。Kong作为一款商业软件，在Nginx上做了很扩展工作，而且还有很多付费的商业插件。Kong 本身也有付费的企业版，其中包括技术支持、使用培训服务以及API分析插件。

**缺点**:如果你使用Spring Cloud,Kong 如何结合目前已有的服务治理体系?

#### 5. Traefik

Traefik是一个开源的GO语言开发的为了让踯署微服务更加便捷而诞生的现代HTTP反向代理、负载均衡工具，它支持多种后台(Docker , Swarm , Kubernetes ,Marathon , Mesos,Consul, Etcd , Zzookeeper, BoltDB,Rest APl fle…来自动化、动态的应用它的配置文件设置。Trsefik拥有一个基于Angular)Si编写的简单网站界面，支持 Rest API，配置文件热更新，无需重启进程。高可用集群模式等。

相对Spring Cloud和 Kubernetes而言，目前比较适合 Kubernetes。

#### 6. Orange

[Orange](http://orange.sumory.com/docs/)一个基于 Open Resty 的API网关。除 Nginx 的基本功能外，它还可用于API监控、访问控制(鉴权、WAF)、流量筛选、访问限速、AB测试、静/动态分流 等。它有以下特性：

- 提供了一套默认的 Dashboard 用于动态管理各种功能和配置。
- 提供了API接口用于实现第三方服务(如个性化运维需求、第三方Dashboard等)。
- 可根据规范编写自定义插件扩展 Orange 功能。
