# 20、Dubbo 源码解析 - 远程调用概述
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/20.html
- 分类：J2EE框架
- 分组：Dubbo 网络通信架构解剖
在之前的文章我们分析了 dubbo 的服务治理，也就是在 consumer 端在进行服务引用的时候。consumer 首先会根据配置 Protocol(协议) 创建 Invoke 调用对象，它代表一个可执行体，可向它发起 invoke 调用，它有可能是一个本地的实现，也可能是一个远程的实现，也可能一个集群实现。然后再使用 ProxyFactory 接口创建代理对象，进行远程调用。

创建的代理对象为 InvokeInvocationHandler，然后它组合了一个 MockClusterInvoker 对象。 dubbo 里面的服务治理就是通过它来完成的。这个里面就涉及到服务治理也就是集群容错。

- 首先通过 MockClusterInvoke 将多个 Invoker 伪装成一个Invoker，这样其它人只要关注Protocol 层 Invoker 即可，加上 Cluster 或者去掉 Cluster 对其它层都不会造成影响，因为只有一个提供者时，是不需要Cluster的。
- 接着 Directory 服务的主要作用是通过注册中心推送变更。当 Provider 暴露新的接口服务，或者失效掉接口服务的时候就会动态的更新 Invoke。
- 然后 Router 服务配置可以过滤 Directory 服务里面注册的接口服务，可以通过路由规则从多个 Invoke 里面选择出子集。
- 最后 LoadBalance 负责从过滤后的 Invoke 列表中通过负载均衡算法选择一个具体的 Invoke 来用于本次服务调用。

这就是之前分析集群容错源码的整个过程。其实就是通过服务治理从多个服务中选择中一个具体的 Invoke 来进行调用。最终选择出来的 Invoke 如下把示：

它是RegistryDirectory 的内部类 InvokerDelegete，而这个类又是继承于 InvokerWrapper 类，所以最终是通过 InvokerWrapper 来进行远程调用的。

dubbo 调用流程图：

我们已经获取到了一个具体的 Invoke，所以我们下面就是需要来分析一下以下几个问题：

- consumer 的发送与接收原理
- provider 的接收与发送原理
- dubbo 的通信方式

因为dubbo 的远程网络传输默认 netty NIO的非阻塞并行调用通信的。所以将会再下一个章节来简单的介绍一下 netty 的使用。
