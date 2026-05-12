# 17、Dubbo 源码解析 - 集群容错总结
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/17.html
- 分类：J2EE框架
- 分组：Dubbo 集群容错的设计解剖
在集中式环境中服务的机器台只有一台，这样对于服务不仅存在服务单点故障问题而且还存在流量问题。为了解决这个问题，就引入的分布式与集群概念。

> 分布式：一个业务分拆多个子业务，部署在不同的服务器上
>
> 集群：同一个业务，部署在多个服务器上

当请求来临时，如何从多个服务器中，选择一个有效、合适的服务器，这个集群所需要面对一问题。所以在集群里面就引申出负载均衡（LoadBalance），高可用（HA），路由（Route）等概念。我们来看一下 dubbo 在进行服务调用的时候是如何处理的。

这张集群容错包含以下几个角色：

- Invoker：对 Provider (服务提供者) 的一个可调用 Service 接口的抽象，Invoker 封装了 Provider 地址及 Service 接口信息。
- Cluster：Directory 中的多个 Invoker 伪装成一个 Invoker，对上层透明，伪装过程包含了容错逻辑，调用失败后，重试另一个
- Directory：代表多个 Invoker，可以把它看成 List`` ，但与 List 不同的是，它的值可能是动态变化的，比如注册中心推送变更
- Router ： 负责从多个Invoker 中按路由规则选出子集，比如读写分离，应用隔离等
- LoadBalance：LoadBalance 负责从多个 Invoker 中选出具体的一个用于本次调用，选的过程包含了负载均衡算法，调用失败后，需要重选.

我们再来对照看一下 dubbo 的核心架构图。

通过之前的一系列的源码分析，以及上面的二张 dubbo 架构图，我们不难得出以下结论。

当dubbo 的 Provider 进行一次服务暴露的时候，就会有 Registry 注册一个服务，然后通过 Netty 进行暴露请求。当 Consumer 需要进行服务调用的时候，通过 Cluster 把多个服务伪装成一个 Invoke，这样对调用方就不需要关心到底有多少个服务调用方了。

集群通过到注册中心去拿暴露当前服务的接口信息的获取到 Directory (服务列表)，然后通过配置的 Route (路由规则) 找到满足的 Invoke 列表，最后通过 LoadBalance 找到合适的一个 Invoke 进行远程调用。在集群调用失败时，Dubbo 提供了多种容错方案，缺省为 failover 重试。这样就对服务的高可用做到了保证。
