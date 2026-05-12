# 16、Dubbo 源码解析 - 集群容错之LoadBalance
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/16.html
- 分类：J2EE框架
- 分组：Dubbo 集群容错的设计解剖
在集中式环境中服务的机器台只有一台，这样对于服务不仅存在服务单点故障问题而且还存在流量问题。为了解决这个问题，就引入的分布式与集群概念。

> 分布式：一个业务分拆多个子业务，部署在不同的服务器上
>
> 集群：同一个业务，部署在多个服务器上

#### 1、 dubbo 服务治理

当请求来临时，如何从多个服务器中，选择一个有效、合适的服务器，这个集群所需要面对一问题。所以在集群里面就引申出负载均衡（LoadBalance），高可用（HA），路由（Route）等概念。我们来看一下 dubbo 在进行服务调用的时候是如何处理的。

这张集群容错包含以下几个角色：

- Invoker：对 Provider (服务提供者) 的一个可调用 Service 接口的抽象，Invoker 封装了 Provider 地址及 Service 接口信息。
- Cluster：Directory 中的多个 Invoker 伪装成一个 Invoker，对上层透明，伪装过程包含了容错逻辑，调用失败后，重试另一个
- Directory：代表多个 Invoker，可以把它看成 List`` ，但与 List 不同的是，它的值可能是动态变化的，比如注册中心推送变更
- Router ： 负责从多个Invoker 中按路由规则选出子集，比如读写分离，应用隔离等
- LoadBalance：LoadBalance 负责从多个 Invoker 中选出具体的一个用于本次调用，选的过程包含了负载均衡算法，调用失败后，需要重选.

#### 2、负载均衡

下面我们来分析一下 LoadBalance, 也就是负载均衡。我们可以来看一下 [维基百科](http://en.wikipedia.org/wiki/Load_balancing_%28computing%29), 对于负载均衡的描述。

在计算中，负载平衡1提高了跨多个计算资源的工作负载分布，例如计算机、计算机集群、网络链接、中央处理器或磁盘驱动器。负载平衡的目的是优化资源使用，最大化吞吐量，最小化响应时间，避免任何单一资源的过载。使用负载平衡而不是单个组件的多个组件可以通过冗余来提高可靠性和可用性。负载平衡通常涉及专用的软件或硬件，比如多层交换机或域名系统服务器进程。

负载平衡与渠道结合的不同之处在于,负载平衡分裂之间的交通网络上的网络接口插座(OSI模型层4)基础上,而通道结合意味着一个部门之间的交通物理接口在一个较低的水平,每包(OSI模型层3)或在一个数据链路(OSI模型层2)基础与最短路径等协议桥接。

#### 3、dubbo LoadBalance

以下是dubbo 中 负载均衡的定义：

```java
public interface LoadBalance {
    /**
     * select one invoker in list.
     *
     * @param invokers   invokers.
     * @param url        refer url
     * @param invocation invocation.
     * @return selected invoker.
     */
    @Adaptive("loadbalance")
    <T> Invoker<T> select(List<Invoker<T>> invokers, URL url, Invocation invocation) throws RpcException;
}
```

负载平衡的其实就是根据不同的策略从 Invoker 列表中选择中一个适合的 Invoker 来进行远程调用。

我们来看一下 dubbo 里面的 LoadBalance 类图：

##### 3.1 RandomLoadBalance

RandomLoadBalance ： 随机，按权重设置随机概率。

在一个截面上碰撞的概率高，但调用量越大分布越均匀，而且按概率使用权重后也比较均匀，有利于动态调整提供者权重。

##### 3.2 RoundRobinLoadBalance

RoundRobinLoadBalance：轮循，按公约后的权重设置轮循比率。

存在慢的提供者累积请求的问题，比如：第二台机器很慢，但没挂，当请求调到第二台时就卡在那，久而久之，所有请求都卡在调到第二台上。

##### 3.3 LeastActiveLoadBalance

LeastActiveLoadBalance ：最少活跃调用数，相同活跃数的随机，活跃数指调用前后计数差。

使慢的提供者收到更少请求，因为越慢的提供者的调用前后计数差会越大。

##### 3.4 ConsistentHashLoadBalance

- **一致性 Hash**，相同参数的请求总是发到同一提供者。
- 当某一台提供者挂时，原本发往该提供者的请求，基于虚拟节点，平摊到其它提供者，不会引起剧烈变动。
- 算法参见：[http://en.wikipedia.org/wiki/Consistent_hashing](http://en.wikipedia.org/wiki/Consistent_hashing)
- 缺省只对第一个参数 Hash，如果要修改，请配置 ``
- 缺省用 160 份虚拟节点，如果要修改，请配置 ``

#### 4、LoadBalance 算法

负载均衡算法有几种经典实现，已经是老生常谈了，总结后主要有如下几个：

**1、** 轮询（RoundRobin）；

**2、** 加权轮询（WeightRoundRobin）；

**3、** 随机（Random）；

**4、** 加权随机（WeightRandom）；

**5、** 源地址哈希（Hash）；

**6、** 一致性哈希（ConsistentHash）；

**7、** 最小连接数（LeastConnections）；

**8、** 低并发优先（ActiveWeight）；

dubbo 默认支持 1、2、3、7 这4种负载均衡策略，如果你需要使用另外 4 种负载均衡策略。可以使用 dubbo 的 SPI 机制来扩展 LoadBalance。具体可以参考 [dubbo 负载均衡扩展](http://dubbo.apache.org/books/dubbo-dev-book/impls/load-balance.html)

参考文章：

**1、** http://en.wikipedia.org/wiki/Load_balancing_(computing)；

**2、** http://dubbo.apache.org/books/dubbo-user-book/demos/loadbalance.html；

**3、** https://www.cnkirito.moe/rpc-cluster/；
