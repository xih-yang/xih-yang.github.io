# 07、Dubbo 2.7 源码解析 - 系统架构解析（两大设计原则、三大领域模型、四大组件、十层架构图、Dubbo源码架构
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/7.html
- 分类：J2EE框架
- 分组：教程目录
Dubbo的系统架构解析

## 1. Dubbo 的两大设计原则

Dubbo 框架在设计时遵循了两大设计原则：

- Dubbo 使用“微内核+插件”的设计模式。内核只负责组装插件(扩展点)，Dubbo 的功能都是由插件实现的，也就是 Dubbo 的所有功能点都可被用户自定义扩展类所替换。
- 采用 URL 作为配置信息的统一格式，所有扩展点都通过传递 URL 携带配置信息。

> URL：协议://IP地址：端口/服务名/各种元数据信息...
>
> 为什么dubbo用url不用json?
>
> 个人理解，dubbo的应用场景涉及各种通信协议，url更契合这种通信场景，而json通用性太强了，用的话还要定义各种key，数据量会更大。

## 2. Dubbo 的三大领域模型

为了对Dubbo 整体架构叙述的方便，Dubbo 抽象出了三大领域模型。

- Protocol 服务域：是 Invoker 暴露和引用的主功能入口，它负责 Invoker 的生命周期管理。(管理消费者和提供者之间的通信协议，Dubbo支持多种协议的)
- Invoker 实体域：是 Dubbo 的核心模型，其它模型都向它靠扰，或转换成它，它代表一个可执行体，可向它发起 invoke 调用，它有可能是一个本地的实现，也可能是一个远程的实现，也可能一个集群实现。(可以简单理解为提供者的代理对象，就代表了提供者)
- Invocation 会话域：它持有调用过程中的变量，比如方法名，参数等。

## 3. Dubbo 的四大组件

Dubbo 中存在四大组件：

- Provider：暴露服务方，亦称为服务提供者。
- Consumer：调用远程服务方，亦称为服务消费者。
- Registry：服务注册与发现的中心，提供目录服务，亦称为服务注册中心
- Monitor：统计服务的调用次数、调用时间等信息的日志服务，亦称为服务监控中心

## 4. Dubbo 的十层架构

以后分析源码都是从Config层开始的，Service层就是平常我们定义的具体业务接口、接口实现。

Dubbo 的架构设计划分为了 10 层。图中`左边淡蓝色背景为服务 Consumer 使用的接口`，`右边淡绿色背景为服务 Provider 使用的接口`，`位于中轴线的为双方都要用到的接口。`对于这10 层，根据其总体功能划分，可以划分为三大层：

- Business 层
- Service层
- RPC 层
- config 配置层
- proxy 服务代理层
- registry 注册中心层
- cluster 路由层
- monitor 监控层
- protocol 远程调用层
- Remotting 层
- exchange 信息交换层
- transport 网络传输层
- serialize 数据序列化层

### 4.1 Business 层

该层仅包含一个 service 服务层，该层与实际业务逻辑有关，根据服务消费方和服务提供方的业务设计，实现对应的接口。

### 4.2 RPC 层

该层主要负责整个分布式系统中各个主机间的通讯。该层包含了以下 6 层。

#### (1) config 配置层

以ServiceConfig 和 ReferenceConfig 为中心，用于加载并解析 Spring 配置文件中的 Dubbo标签。

> 主要是和标签

#### (2) proxy 服务代理层

服务接口透明代理，生成服务的客户端 Stub 和服务器端 Skeleton, 以 ServiceProxy 为中心，扩展接口为 ProxyFactory（效果就是客户端和服务端只需要关注Service层定义的接口即可）。

Proxy 层封装了所有接口的透明化代理，而在其它层都以 Invoker 为中心，只有到了暴露给用户使用时，才用 Proxy 将 Invoker 转成接口，或将接口实现转成 Invoker，也就是去掉 Proxy 层 RPC 是可以运行的，只是不那么透明，不那么看起来像调本地服务一样调远程服务。(PS：接口指的就是我们定义的各种业务接口)

#### (3) registry 注册中心层

封装服务地址的注册和发现，以服务 URL 为中心，扩展接口为 RegistryFactory、Registry、RegistryService，可能没有服务注册中心，此时服务提供方直接暴露服务。

#### (4) cluster(集群) 路由层

封装多个提供者的路由和负载均衡，并桥接注册中心，以 Invoker 为中心，扩展接口为Cluster、Directory、Router 和 LoadBalance，将多个服务提供方组合为一个服务提供方，实现对服务消费透明。只需要与一个服务提供方进行交互。

Dubbo 官方指出，在 Dubbo 的整体架构中，Cluster 只是一个外围概念。Cluster 的目的是将多个 Invoker 伪装成一个 Invoker，这样用户只需关注 Protocol 层 Invoker 即可，加上Cluster 或者去掉 Cluster 对其它层都不会造成影响，因为只有一个提供者时，是不需要Cluster 的。

#### (5) monitor 监控层

RPC调用时间和次数监控，以 Statistics 为中心，扩展接口 MonitorFactory、Monitor 和MonitorService。

#### (6) protocol 远程调用层

封装RPC 调用，以 Invocation 和 Result 为中心，扩展接口为 Protocol、Invoker 和 Exporter。

- Protocol 是服务域，它是 Invoker 暴露和引用的主功能入口，它负责 Invoker 的生命周期管理。
- Invoker 是实体域，它是 Dubbo 的核心模型，其他模型都是向它靠拢，或转换成它，它代表一个可执行体，可向它发起 Invoker 调用，它有可能是一个本地实现，也有可能是一个远程实现，也有可能是一个集群实现。
- Exporter 代表服务暴露，消费者只能调用提供者暴露的服务

在RPC 中，Protocol 是核心层，也就是只要有 Protocol + Invoker + Exporter 就可以完成非透明的 RPC 调用，然后在 Invoker 的主过程上 Filter 拦截点。

### 4.3 Remotting 层

Remoting 实现是 Dubbo 协议的实现，如果我们选择 RMI 协议，整个 Remoting 都不会用上，Remoting 内部再划为 Transport 传输层和 Exchange 信息交换层，Transport 层只负责单向消息传输，是对 Mina, Netty, Grizzly的抽象，它也可以扩展 UDP 传输，而 Exchange层是在传输层之上封装了 Request-Response 语义。

具体包含以下三层：

#### (1) exchange 信息交换层

封装请求响应模式，同步转异步，以 Request 和 Response 为中心，扩展接口为 Exchanger和 ExchangeChannel,ExchangeClient 和 ExchangeServer。

#### (2) transport 网络传输层

抽象和mina 和 netty 为统一接口，以 Message 为中心，扩展接口为 Channel、Transporter、Client、Server 和 Codec。

#### (3) serialize 数据序列化层

可复用的一些工具，扩展接口为 Serialization、ObjectInput、ObejctOutput 和 ThreadPool。

## 5. Dubbo 源码架构

注：这里解析的源码为 dubbo-2.7.3 版本。

### 5.1 将 Dubbo 源码工程导入 Idea

本例以Dubbo2.7.3 为例进行源码解析。从官网下载到源码的 zip 包后解压后就可以直接导入到 Idea 中。

### 5.2 Dubbo2.7 版本与 2.6 版本

Dubbo2.7 版本需要 Java 8 及以上版本。

**2、** 7.0版本在改造的过程中遵循了一个原则，即保持与低版本的兼容性，因此从功能层面来说它是与2.6.x及更低版本完全兼容的2.7与2.6版本相比，改动最大的就是包名，由原来的com.alibaba.dubbo改为了org.apache.dubbo；

### 5.3 Dubbo源码模块介绍：

#### dubbo-cluster 集群模块

该模块主要负责 服务的提供者列表、路由、负责均衡等功能。

Directory：列表封装了现有的所有Invoker提供者信息，负载均衡就是从它里面获取到的内容进行负载均衡

#### dubbo-common 通用模块

Dubbo的一些通用功能、内核功能全在这里。

**2、** 7与2.6版本相比，改动最大的就是包名，由原来的com.alibaba.dubbo改为了org.apache.dubbo；

Dubbo的一些内核功能： SPI机制、自适应机制、Wrapper机制、Activate机制的实现，就在extension包下。（内核解析下期讲）

#### dubbo-compatible 兼容模块

该模块就是为了兼容老版本。

#### dubbo-config 配置模块

对spring配置文件的解析都在该模块里

ReferenceBean和ServiceBean就是ReferenceConfig和ServiceConfig的父类

#### dubbo-configcenter 配置中心模块

该模块可以看到dubbo支持的所有配置中心。

#### dubbo-container 容器模块

#### dubbo-demo 演示模块

相当于开发的测试模块，后期分析源码，断点演示，我们直接用这里面的代码。

#### dubbo-filter 过滤器模块

#### dubbo-metadata-report 元数据-报告模块

该模块负责两个功能：

- 元数据的定义
- 元数据的持久化(即将元数据“报告”到哪里)

元数据相关的功能都由该模块负责：

> protobuf，谷歌的，与语言、平台无关的，扩展性强，主要做数据序列化的，网络通信，数据存储都可以用它

#### dubbo-monitor 监控模块

#### dubbo-plugin 插件模块

#### dubbo-registry 注册模块

从该模块中可以看到dubbo支持哪些应用作为注册中心：

#### dubbo-remoting 远程通信模块

#### dubbo-rpc 远程调用模块

该模块放的是各种远程调用协议(也叫 服务暴露协议)的实现：

其中有个比较特殊的injvm，它是一个伪协议，本地暴露协议，处理消费者调用自己本地服务的情况(如果调用的服务本地也提供了直接调用本地服务)。

#### dubbo-serialization 序列化模块

处理数据序列化的。
