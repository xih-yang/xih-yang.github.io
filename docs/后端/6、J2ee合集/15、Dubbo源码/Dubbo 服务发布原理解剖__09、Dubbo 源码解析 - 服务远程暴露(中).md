# 09、Dubbo 源码解析 - 服务远程暴露(中)
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/9.html
- 分类：J2EE框架
- 分组：Dubbo 服务发布原理解剖
在上一篇文章我们讲解了一下 dubbo 远程服务暴露过程中通过 Netty 进行 Socket 服务暴露。使得远程客户端可以访问这个暴露的服务，这个只是解决了访问之前点到点的服务调用。对于分步式环境当中，越来越多的服务我们如何管理并且治理这些服务是一个问题。因此 dubbo 引入了注册中心这个概念，把服务暴露、服务调用的信息保存到注册中心上面。并且还可以订阅注册中心，实现服务自动发现。因为 dubbo 远程暴露里面的过程还是比较复杂的，所以我就分为三个文章来讲解 dubbo 的远程暴露：

- dubbo 远程暴露 – Netty 暴露服务
- dubbo 远程暴露 – Zookeeper 连接
- dubbo 远程暴露 – Zookeeper 注册 & 订阅

**dubbo 支持以下几种注册中心**：

注册中心
成熟度
优点
问题
建议

Zookeeper注册中心
Stable
支持基于网络的集群方式，有广泛周边开源产品，建议使用dubbo-2.3.3以上版本（推荐使用）
依赖于Zookeeper的稳定性
可用于生产环境

Redis注册中心
Stable
支持基于客户端双写的集群方式，性能高
要求服务器时间同步，用于检查心跳过期脏数据
可用于生产环境

Multicast注册中心
Tested
去中心化，不需要安装注册中心
依赖于网络拓普和路由，跨机房有风险
小规模应用或开发测试环境

Simple注册中心
Tested
Dogfooding，注册中心本身也是一个标准的RPC服务
没有集群支持，可能单点故障
试用

官方推荐使用 [zookeeper](https://blog.csdn.net/u012410733/article/details/77800285) 为注册中心。在我们分析一下 dubbo 中是如何集成 zookeeper 之前，我们先来回顾一下 dubbo 服务暴露里面的主要步骤。

#### 1、RegistryProtocol#export

下面就是 dubbo 暴露的核心步骤的代码，可能由于版本的原因(下面的代码基于 `2.6.1`)代码会有所差异但是核心思想不变。

```java
    public <T> Exporter<T> export(final Invoker<T> originInvoker) throws RpcException {
        //export invoker
        final ExporterChangeableWrapper<T> exporter = doLocalExport(originInvoker);
        URL registryUrl = getRegistryUrl(originInvoker);
        //registry provider
        final Registry registry = getRegistry(originInvoker);
        final URL registedProviderUrl = getRegistedProviderUrl(originInvoker);
        //to judge to delay publish whether or not
        boolean register = registedProviderUrl.getParameter("register", true);
        ProviderConsumerRegTable.registerProvider(originInvoker, registryUrl, registedProviderUrl);
        if (register) {
            register(registryUrl, registedProviderUrl);
            ProviderConsumerRegTable.getProviderWrapper(originInvoker).setReg(true);
        }
        // Subscribe the override data
        // FIXME When the provider subscribes, it will affect the scene : a certain JVM exposes the service and call the same service. Because the subscribed is cached key with the name of the service, it causes the subscription information to cover.
        final URL overrideSubscribeUrl = getSubscribedOverrideUrl(registedProviderUrl);
        final OverrideListener overrideSubscribeListener = new OverrideListener(overrideSubscribeUrl, originInvoker);
        overrideListeners.put(overrideSubscribeUrl, overrideSubscribeListener);
        registry.subscribe(overrideSubscribeUrl, overrideSubscribeListener);
        //Ensure that a new exporter instance is returned every time export
        return new DestroyableExporter<T>(exporter, originInvoker, overrideSubscribeUrl, registedProviderUrl);
    }
```

之前我们分析了第一步：`ExporterChangeableWrapper exporter = doLocalExport(originInvoker);`dubbo 基于 socket 的本地暴露提供服务给远程客户端调用。下面我们就来分析服务远程暴露的注册服务到 zookeeper 这个注册中心上面来实现**高可用**的。

#### 2、RegistryProtocol#getRegistry

**1、** 把URL里面的`protocol`设置成` 1、Curator – CuratorZookeeperClient#init()

```java
// 构造连接参数
CuratorFramework client = builder.build();
// 进行连接操作
client.start();
```

> 2、Zkclient – ZkclientZookeeperClient#init()

```java
// 构造连接参数
ZkClientWrapper client =  = new ZkClientWrapper(url.getBackupAddress(), 30000);
// 进行连接操作
client.start();
```

这个就是 dubbo 平等对待第三方框架，而且把 zk 的两种不同的客户端的代码风格统一了起来。
