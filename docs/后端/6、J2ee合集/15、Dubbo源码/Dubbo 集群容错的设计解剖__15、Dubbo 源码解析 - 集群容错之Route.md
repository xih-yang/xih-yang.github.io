# 15、Dubbo 源码解析 - 集群容错之Route
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/15.html
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

#### 2、 路由服务

下面我们来分析一下 Route, 也就是路由服务。我们可以来看一下 [维基百科](http://en.wikipedia.org/wiki/Routing), 对于路由服务的描述。

路由是在一个网络中，或在多个网络之间或跨多个网络中选择一条路径的过程。路由是为许多类型的网络执行的，包括电路交换网络，如公共交换电话网络（PSTN）和计算机网络，如因特网。

在分组交换网络中，路由是通过特定的包转发机制将网络数据包从其源引导到目的地的高级决策。包转发是从一个网络接口到另一个网络接口的逻辑处理网络数据包的传输。中间节点通常是网络硬件设备，如路由器、桥、网关、防火墙或交换机。通用计算机也转发数据包并执行路由，尽管它们没有专门针对任务的优化硬件。路由过程通常在路由表的基础上进行转发，它维护了到各种网络目的地的路由记录。因此，在路由器的内存中构建路由表对于有效的路由是非常重要的。大多数路由算法一次只使用一个网络路径。多路径路由技术支持使用多种可选路径。

在狭义的术语中，路由通常与桥接的关系形成对比，即网络地址是结构化的，并且类似的地址意味着在网络中接近。结构化的地址允许单个路由表条目表示到一组设备的路由。在大型网络中，结构化寻址（狭义的路由）优于非结构化寻址（桥接）。路由已经成为在互联网上寻址的主要形式。

#### 3、Route

在dubbo 中路由规则决定一次服务调用的目标服务器，分为条件路由规则和脚本路由规则，并且支持可扩展(SPI)。

下面就是 dubbo 里面 Route 路由接口的定义：

```java
public interface Router extends Comparable<Router> {
    URL getUrl();
    <T> List<Invoker<T>> route(List<Invoker<T>> invokers, URL url, Invocation invocation) throws RpcException;
}
```

调用`route` 方法，传入从目录服务获取到的 Invoke 列表，通过 URL 或者 Invocation 里面配置的条件筛选出满足条件的 Invoke 列表。

下面是dubbo 路由服务的类图：

dubbo 默认会在 AbstractDirectory#setRouters 自动添加 MockInvokersSelector 路由规则。

##### 3.1 MockInvokersSelector

MockInvokersSelector：其实就是用于路由 Mock 服务与非 Mock 服务。

```java
    public <T> List<Invoker<T>> route(final List<Invoker<T>> invokers,
                                      URL url, final Invocation invocation) throws RpcException {
        if (invocation.getAttachments() == null) {
            return getNormalInvokers(invokers);
        } else {
            String value = invocation.getAttachments().get(Constants.INVOCATION_NEED_MOCK);
            if (value == null)
                return getNormalInvokers(invokers);
            else if (Boolean.TRUE.toString().equalsIgnoreCase(value)) {
                return getMockedInvokers(invokers);
            }
        }
        return invokers;
    }
```

上面的代码逻辑其实就是：

- 如果 Invocation 的扩展参数不为空 并且 Invocation 的扩展参数里面包含 invocation.need.mock 参数并且值为 true 就获取 Invoke 列表里面 protocol 为 mock 的 Invoke 列表。
- 否则获取Invoke 列表里面 protocol 为非 mock 的 Invoke 列表。

##### 3.2 ConditionRouter

ConditionRouter：基于条件表达式的路由规则，它的条件规则如下：

- =>` 之前的为消费者匹配条件，所有参数和消费者的 URL 进行对比，当消费者满足匹配条件时，对该消费者执行后面的过滤规则。
- =>` 之后为提供者地址列表的过滤条件，所有参数和提供者的 URL 进行对比，消费者最终只拿到过滤后的地址列表。
- 如果匹配条件为空，表示对所有消费方应用，如：=>` host != 10.20.153.11
- 如果过滤条件为空，表示禁止访问，如：host = 10.20.153.10 =>`

参数支持：

- 服务调用信息，如：method, argument 等，暂不支持参数路由
- URL 本身的字段，如：protocol, host, port 等
- 以及 URL 上的所有参数，如：application, organization 等

条件支持：

- 等号 = 表示"匹配"，如：host = 10.20.153.10
- 不等号 != 表示"不匹配"，如：host != 10.20.153.10

值支持：

- 以逗号 , 分隔多个值，如：host != 10.20.153.10,10.20.153.11
- 以星号 * 结尾，表示通配，如：host != 10.20.*
- 以美元符 `$` 开头，表示引用消费者参数，如：host = `$`host

##### 3.3 ScriptRouter

ScriptRouter：脚本路由规则，脚本路由规则支持 JDK 脚本引擎的所有脚本，比如：javascript, jruby, groovy 等，通过 `type=javascript` 参数设置脚本类型，缺省为 javascript。

基于脚本引擎的路由规则，如：

```java
（function route(invokers) {
    var result = new java.util.ArrayList(invokers.size());
    for (i = 0; i < invokers.size(); i ++) {
        if ("10.20.153.10".equals(invokers.get(i).getUrl().getHost())) {
            result.add(invokers.get(i));
        }
    }
    return result;
} (invokers)）; // 表示立即执行方法
```

#### 4、Route 功能

通过配置不同的 Route 规则，我们可以实现以下功能。

**1、** 排除预发布机：；

```java
 => host != 172.22.3.91
```

**2、** 白名单：；

```java
 host != 10.20.153.10,10.20.153.11 =>
```

**3、** 黑名单：；

```java
 host = 10.20.153.10,10.20.153.11 =>
```

**4、** 服务寄宿在应用上，只暴露一部分的机器，防止整个集群挂掉：；

```java
 => host = 172.22.3.1*,172.22.3.2*
```

**5、** 为重要应用提供额外的机器：；

```java
 application != kylin => host != 172.22.3.95,172.22.3.96
```

**6、** 读写分离：；

```java
 method = find*,list*,get*,is* => host = 172.22.3.94,172.22.3.95,172.22.3.96
 method != find*,list*,get*,is* => host = 172.22.3.97,172.22.3.98
```

**7、** 前后台分离：；

```java
 application = bops => host = 172.22.3.91,172.22.3.92,172.22.3.93
 application != bops => host = 172.22.3.94,172.22.3.95,172.22.3.96
```

**8、** 隔离不同机房网段：；

```java
 host != 172.22.3.* => host != 172.22.3.*
```

**9、** 提供者与消费者部署在同集群内，本机只访问本机的服务：；

```java
 => host = $host
```

参考文章：

**1、** http://en.wikipedia.org/wiki/Routing；

**2、** http://dubbo.apache.org/books/dubbo-user-book/demos/routing-rule.html；
