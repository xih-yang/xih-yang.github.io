# 10、Dubbo 源码解析 - 服务远程暴露(下)
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/10.html
- 分类：J2EE框架
- 分组：Dubbo 服务发布原理解剖
在前面的文章我们分析了一下 dubbo 远程服务暴露过程中通过 Netty 进行 Socket 服务暴露。使得远程客户端可以访问这个暴露的服务，这个只是解决了访问之前点到点的服务调用。对于分步式环境当中，越来越多的服务我们如何管理并且治理这些服务是一个问题。因此 dubbo 引入了注册中心这个概念，把服务暴露、服务调用的信息保存到注册中心上面。并且还可以订阅注册中心，实现服务自动发现。因为 dubbo 远程暴露里面的过程还是比较复杂的，所以我就分为三个文章来讲解 dubbo 的远程暴露：

- dubbo 远程暴露 – Netty 暴露服务
- dubbo 远程暴露 – Zookeeper 连接
- dubbo 远程暴露 – Zookeeper 注册 & 订阅

在上篇文章中我们分析 dubbo 是如何创建 zookeeper 这个注册中心的。下面我们就来分析一下 dubbo 究竟使用 zookeeper 这个组件来做了哪些事。

#### 1、RegistryProtocol#export

下面就是 dubbo 暴露的核心步骤的代码，可能由于版本的原因(下面的代码基于 2.6.1)代码会有所差异但是核心思想不变。

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

在之前的文章中分析了 dubbo 通过 netty 暴露服务，然后获取到 zookeeper 注册中心 — `ZookeeperRegistry`。下面就是把 Provider (服务提供者)的信息注册到注册中心上。这样 Consumer (服务消费者)就可以通过 Registry (注册中心)获取到 Provider 的信息。这样就解耦了 Provider 与 Consumer，并且可以通过 Registry 来修改路由规则、权重等控制。这样就达到的服务的治理。下面我们就来讲解一下，服务的注册与订阅。

#### 2、ZookeeperRegistry#register

这个就是把服务信息注册到 Zookeeper 上面去。

1、AbstractRegistry#register添加注册Set`` registered(已注册的URL)，用于失败重试。

2、ZookeeperRegistry#doRegister通过上篇 blog 讲解的获取到的 ZookeeperClient 把服务信息注册到 Zookeeper 上。此时的 URL 为：

```java
dubbo://192.168.75.1:20880/com.alibaba.dubbo.demo.DemoService?
anyhost=true&application=demo-provider&dubbo=2.0.0&generic=false&
interface=com.alibaba.dubbo.demo.DemoService&methods=sayHello&pid=2076&
side=provider&timestamp=1522237459900
```

dubbo 会基于这个 URL 生成一个新的URL，生成规则为：

```java
"/dubbo/" + url里面的interface的值 + "/providers/" + URL.encode(url)
```

**生成后的值 :**

```java
/dubbo/com.alibaba.dubbo.demo.DemoService/providers/
dubbo%3A%2F%2F192.168.75.1%3A20880%2Fcom.alibaba.dubbo.demo.DemoService%3Fanyhost%3Dtrue%26application%3Ddemo-provider%26dubbo%3D2.0.0%26generic%3Dfalse%26interface%3Dcom.alibaba.dubbo.demo.DemoService%26methods%3DsayHello%26pid%3D2076%26side%3Dprovider%26timestamp%3D1522237459900
```

然后在Zookeeper 上面把 `/dubbo/com.alibaba.dubbo.demo.DemoService/providers/` 创建成持久化节点，而后面部分的 URL 就会创建成临时节点。

把服务提供者信息创建成临时节点的好处就是如果当前服务挂掉，这个节点就会自动删除。这样失效服务就可以自动剔除。

> Zookeeper 持久化节点 和临时节点有什么区别？
>
> 持久化节点：一旦被创建，触发主动删除掉，否则就一直存储在ZK里面。
>
> 临时节点：与客户端会话绑定，一旦客户端会话失效，这个客户端端所创建的所有临时节点都会被删除。

#### 3、ZookeeperRegistry#subscribe

通过订阅 Zookeeper 上面的的节点信息变更， 可以通过 `dubbo-admin`来修改服务路由规则、权重等。

**1、** 创建一个`NotifyListener`实例`OverrideListener`，当收到服务变更通知时触发；

**2、** 在Zookeeper注册中心创建持久化节点`/dubbo/com.alibaba.dubbo.demo.DemoService/configurators`，用于接收`dubbo-admin`这个客户端上对于集群的服务治理；

```java
ZookeeperRegistry#doSubscribe {
	zkClient.create(path, false)
}
```

**3、** 启动加入订阅`/dubbo/com.alibaba.dubbo.demo.DemoService/configurators`，如果该节点信息发生改变，就会交给`FailbackRegistry.notify`处理；

```java
ZookeeperRegistry#doSubscribe {
	zkClient.addChildListener(path, zkListener)
}
```

#### 4、FailbackRegistry#notify

1、把服务端的注册 url 信息更新到本地缓存(AbstractRegistry#saveProperties)，以Window为例：

```java
C:\Users\Carl\.dubbo\dubbo-registry-10.65.209.12.cache
```

2、调用传入的OverrideListener#notify，如果修改了 URL 信息，调用RegistryProtocol.this.doChangeLocalExport(originInvoker, newUrl)重新暴露当前服务。

前面二篇加上这一篇就是 dubbo 远程服务暴露的整个过程。下面这张图片就是 dubbo 进行服务暴露、服务远程调用添加 dubbo monitor 后 Zookeeper 上面 dubbo 节点的结构图。

关于[zookeeper在Dubbo中扮演了一个什么角色，起到了什么作用啊？](https://www.zhihu.com/question/25070185/answer/86166486)，大家可以看一下这篇知乎上面的问答。
