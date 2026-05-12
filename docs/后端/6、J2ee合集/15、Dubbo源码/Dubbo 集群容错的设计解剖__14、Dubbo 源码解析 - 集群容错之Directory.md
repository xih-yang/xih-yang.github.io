# 14、Dubbo 源码解析 - 集群容错之Directory
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/14.html
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

#### 2、 目录服务

下面我们来分析一下 Directory, 也就是目录服务。我们可以来看一下 [维基百科](https://en.wikipedia.org/wiki/Directory_service), 对于目录服务的描述。

在计算中，目录服务或名称服务将网络资源的名称映射到它们各自的网络地址。它是一个共享的信息基础设施，用于定位、管理、管理和组织日常项目和网络资源，这些资源包括卷、文件夹、文件、打印机、用户、组、设备、电话号码和其他对象。目录服务是网络操作系统的关键组件。目录服务器是提供此类服务的服务器。网络上的每个资源都被目录服务器视为对象。关于特定资源的信息存储为与该资源或对象相关联的属性集合。

目录服务为网络定义一个名称空间。名称空间用于为每个对象分配名称（惟一标识符）。目录通常有一组规则来决定如何命名和识别网络资源，这通常包括一个要求，标识符是唯一的和明确的。在使用目录服务时，用户不需要记住网络资源的物理地址;提供一个名称来定位资源。有些目录服务包括访问控制条款，限制了对授权用户的目录信息的可用性。

#### 3、Directory

下面我们来看一下 Directory 接口的定义：

```java
public interface Directory<T> extends Node {
    /**
     * get service type.
     *
     * @return service type.
     */
    Class<T> getInterface();
    /**
     * list invokers.
     *
     * @return invokers
     */
    List<Invoker<T>> list(Invocation invocation) throws RpcException;
}
```

集群调用的时候可以通过目录服务的`list` 方法获取到 Invoker 列表，它有两种具体的实现：

##### 3.1、StaticDirectory

StaticDirectory ：静态目录，它的 Invoke 列表是通过构造器传入。服务消费方在引用服务的时候把多注册中心暴露的 Invoke 以构造器的形式传入到 StaticDirectory，然后再由 Cluster 伪装为一个 Invoke 提供给服务消费方调用。

StaticDirectory 的 list 方法直接返回所有 invoker 集合。

##### 3.2、RegistryDirectory

RegistryDirectory：注册目录服务，实现 NotifyListener 接口。当有服务注册到注册中心上面，会动态更新到注册目录服务里面。

消费方调用某个远程服务，会向注册中心订阅这个服务的所有服务提供方。当服务提供方的数据有变动时就会回调消费方RegistryDirectory#notify把传入的所有服务提供方的 URL 地址转换为 Invoker 列表。

这样就起到了服务治理中的服务自动发现。
