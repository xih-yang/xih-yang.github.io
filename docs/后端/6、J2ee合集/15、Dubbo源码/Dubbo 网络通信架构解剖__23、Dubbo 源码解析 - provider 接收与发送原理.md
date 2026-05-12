# 23、Dubbo 源码解析 - provider 接收与发送原理
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/23.html
- 分类：J2EE框架
- 分组：Dubbo 网络通信架构解剖
在前面一篇博客中分享了 dubbo 在网络通信当中的 consumer 的发送以及接收原理。通过集群容错最终选择一个合适的 Invoke 通过 netty 直联调用 provider 的服务。众所周知， netty 是基于 Java Nio 的 Reactor 模型的异步网络通信框架，所以 dubbo 在 consumer 端把异步变成了同步。

大概总结了 consumer 的发送与接收原理，下面我们来讨论一下 dubbo 网络通信当中 provider 的接收与发送原理。这样就完成了 dubbo 架构图里面的 consumer 调用 provider 的过程.

本次是分析 dubbo 的 provider 的接收与发送原理，讨论包括以下几个点：

- provider 接收 consumer 请求
- provider 的扩展点调用
- provider 响应 consumer 调用
- dubbo 服务调用总结

#### 1、provider 接收 consumer 请求

同 consumer 一样 provider 默认也是通过 netty 进行网络通信的。在之前的分析 dubbo 进行服务暴露(NettyServer#doOpen)的时候， 它是通过 Netty 进行服务暴露，添加了一个 dubbo 的自定义 netty 的 ChannelHandler 也就是 NettyServerHandler 来处理网络通信事件。下面我们来看一下 provider 是如何接收 consumer 发送过来请求的。

以上就是 provider 接收 consumer 端的调用图，可以发现其实是和 consumer 端接收 provider 端的类似都是通过自定义 netty 的 ChannelHandler 也就是 NettyServerHandler 来接收网络请求。并且同样的通过 dubbo 自定义的 ChannelHandler 来处理请求。下面我们还是来分析一下这些 dubbo 自定义 ChannelHandler 的作用：

- MultiMessageHandler：支持 MultiMessage 消息处理，也就是多条消息处理。
- HeartbeatHandler：netty 心条检测。如果心跳请求，发送心跳然后直接 return，如果是心跳响应直接 return。
- AllChannelHandler：使用线程池通过 ChannelEventRunnable 工作类来处理网络事件。
- DecodeHandler：解码 message，解析成 dubbo 中的 Request 对象
- HeaderExchangeHandler：处理解析后的 consumer 端请求的 Request 信息，把请求信息传递到 DubboProtocol 并从 DubboExpoter 里面找到相应具体的 Invoke 进行服务调用(后面具体分析)。

其实可以看到 consumer 与 provider 接收网络请求都是通过自定义 netty 的 ChannelHandler。然后通过调用自定义 ChannelHandler#channelRead (其实是 ChannelHandler 的子接口 ChannelInboundHandler#channelRead )来接收并处理网络请求。在之前服务暴露分析的时候我们讲过AbstractProtocol#exporterMap 也就是 dubbo 在进行服务暴露的时候通过 AbstractProtocol#serviceKey 为 key 以 DubboExporter(Invoke 转化成 Exporter) 为 value 的服务接口暴露信息。然后把请求信息交给 DubboProtocol 根据 consumer 里面 Request 里面的 Invocation 请求信息获取到 DubboExporter。最后通过DubboExporter#getInvoker 获取暴露服务具体的服务实现，完成整个调用。

我们可以看到 consumer 与 provider 进行网络接收信息是类似的，相同点都是通过自定义的 ChannelHandler 来处理网络请求信息。通过 dubbo 这个自定义的 ChannelHandler 来适配不同的 Java Nio 框架，因为在 AbstractPeer 类中都持有 dubbo 自定义的这个 ChannelHandler 。 dubbo 默认使用的是 netty 作为 Nio 框架，通过配置 dubbo 还可以以 Mina 与 Grizzly 作为 Nio 框架。

> 这个就用到了 dubbo 的核心 SPI 平等的对待第三方框架。

上面我们讨论了相同点，下面我们来看一下 consumer 与 provider 接收网络请求的不同点：

- consumer 接收的是 provider 端发送过来的 Response(响应信息)，而 provider 是接收 consumer 端发送过来的 Request(请求信息)。
- consumer 最后在 HeaderExchangeHandler 中调用 handleResponse 方法，而 provider 最在是在HeaderExchangeHandler 中调用 handleRequest 方法。
- consumer 会默认会同步等待 provider 处理后的响应信息(也可以异步处理)，而 provider 在处理完成之后就会同步的把响应请求发送给 consumer.

#### 2、provider 的扩展点调用

与consumer 引用服务一样， provider 在暴露服务的时候也会有扩展点。 就像 J2EE 调用 Servlet 的时候也可以通过 java.servlet.Filter 进行调用扩展，dubbo 在进行服务暴露方的时候也会有 dubbo 自己的 Filter 扩展。那么我们就来看一下在进行 Invoke 调用的时候 dubbo 都有哪些扩展：

可以看到默认情况下，dubbo 在进行服务暴露的时候会加上框架自定义的 7 个 Filter 扩展。下面就来简单描述一下这 7 个 Filter 的作用：

- EchoFilter：回声测试,用于检测服务是否可用，回声测试按照正常请求流程执行，能够测试整个调用是否通畅，可用于监控。
- ClassLoaderFilter：
- GenericFilter：实现泛化调用,泛接口实现方式主要用于服务器端没有API接口及模型类元的情况，参数及返回值中的所有POJO均用Map表示，通常用于框架集成.比如：实现一个通用的远程服务Mock框架，可通过实现GenericService接口处理所有服务请求。
- TraceFilter：方法调用时间查探扩展器, 通过 TraceFilter#addTracer 添加需要查探类的方法与查探最大次数。当进行方法调用的时如果该方法的调用次数少于传递的最大次数就会把方法调用耗时发送给远程服务。
- MonitorFilter：MonitorFilter 其实是在分析之前 dubbo monitor 的时候就进行了详细的分析。它主要是通过``来激活 provider 与 consumer 端的指标监控。
- TimeoutFilter：如果调用时间超过设置的 timeout 就打印 Log,但是不要阻止服务器的运行。
- ExceptionFilter：非检测的异常将会为 ERROR 级别记录在 Provider 端。非检测的异常是未在接口上声明的未经检查的异常.dubbo 会将在这在 API 包中未引入的异常包装到RuntimeException中。

以上就是 dubbo 框架在 provider 端的默认 Filter 扩展，当然如果你有需求也可以自定义 Filter 扩展。具体可以参考 dubbo 官网的 [调用拦截扩展](http://dubbo.apache.org/books/dubbo-dev-book/impls/filter.html)。

#### 3、调用服务并响应 consumer

provider 端通过接收 consumer 的请求并且解码，然后调用 provider 的一系列自定义扩展。下面就是调用服务端暴露服务的真正实现了。在进行服务暴露的时候最终会调用 SPI 接口 ProxyFactory (默认是

JavassistProxyFactory) 来获取 Invoke。我们可以来看一下 dubbo 官网对于服务提供者暴露一个服务的详细过程：

下面我们来看一下 JavassistProxyFactory 的源代码：

> JavassistProxyFactory .java

```java
public class JavassistProxyFactory extends AbstractProxyFactory {
    @Override
    @SuppressWarnings("unchecked")
    public <T> T getProxy(Invoker<T> invoker, Class<?>[] interfaces) {
        return (T) Proxy.getProxy(interfaces).newInstance(new InvokerInvocationHandler(invoker));
    }
    @Override
    public <T> Invoker<T> getInvoker(T proxy, Class<T> type, URL url) {
        // TODO Wrapper cannot handle this scenario correctly: the classname contains '$'
        final Wrapper wrapper = Wrapper.getWrapper(proxy.getClass().getName().indexOf('$') < 0 ? proxy.getClass() : type);
        return new AbstractProxyInvoker<T>(proxy, type, url) {
            @Override
            protected Object doInvoke(T proxy, String methodName,
                                      Class<?>[] parameterTypes,
                                      Object[] arguments) throws Throwable {
                return wrapper.invokeMethod(proxy, methodName, parameterTypes, arguments);
            }
        };
    }
}
```

在这里需要说明 ProxyFactory#getInvoker 这个方法的三个请求参数：

- proxy ： 暴露接口服务的具体实现类，比如 dubbo-demo-provider 中的 org.apache.dubbo.demo.provider.DemoServiceImpl 实例对象。
- type ： 暴露接口服务的 Class 对象，比如 dubbo-demo-api 中的 org.apache.dubbo.demo.DemoService 的 Class 实例对象。
- url ： 暴露接口服务的配置信息。具体信息如下：

```java
registry://localhost:2181/org.apache.dubbo.registry.RegistryService?application=demo-provider&dubbo=2.0.2&export=dubbo%3A%2F%2F192.168.75.1%3A20880%2Forg.apache.dubbo.demo.DemoService%3Fanyhost%3Dtrue%26application%3Ddemo-provider%26bind.ip%3D192.168.75.1%26bind.port%3D20880%26dubbo%3D2.0.2%26generic%3Dfalse%26interface%3Dorg.apache.dubbo.demo.DemoService%26methods%3DsayHello%26pid%3D3900%26qos.port%3D22222%26side%3Dprovider%26timestamp%3D1530184958055&pid=3900&qos.port=22222&registry=zookeeper&timestamp=1530184958041
```

然后进行服务调用的时候最终就会调用到暴露接口服务的具体实现类，也就是 DemoServiceImpl。最终返回的结果如下：

HeaderExchangeHandler 再通过 DubboInvoke 调用到了暴露接口服务的真正实现，并获取到返回值时。它还需要通过 HeaderExchangeHandler 也就是它自身把响应发送给 consumer。具体的调用时序图如下：

可以看到 dubbo 在响应 consumer 时最终也是通过 netty 来进行网络通信的。

#### 4、服务调用总结

当服务越来越多，容量的评估，小服务资源的浪费等问题逐渐显现，此时需增加一个调度中心基于访问压力实时管理集群容量，提高集群利用率。此时，用于提高机器利用率的资源调度和治理中心(SOA)是关键。

- 服务容器负责启动，加载，运行服务提供者。
- 服务提供者在启动时，向注册中心注册自己提供的服务。
- 服务消费者在启动时，向注册中心订阅自己所需的服务。
- 注册中心返回服务提供者地址列表给消费者，如果有变更，注册中心将基于长连接推送变更数据给消费者。
- 服务消费者，从提供者地址列表中，基于软负载均衡算法，选一台提供者进行调用，如果调用失败，再选另一台调用。
- 服务消费者和提供者，在内存中累计调用次数和调用时间，定时每分钟发送一次统计数据到监控中心。

当分析了整个 dubbo 从服务暴露到服务引用，然后再分析了 dubbo 的集群调用 以及 consumer 与 provider 的调用细节之后。再来看 dubbo 的调用图是不是另外有一番滋味。

参考资料：

- http://dubbo.apache.org/books/dubbo-user-book/demos/echo-service.html
- http://dubbo.apache.org/books/dubbo-user-book/demos/generic-service.html
- http://dubbo.apache.org/books/dubbo-admin-book/install/simple-monitor-center.html
- http://dubbo.apache.org/books/dubbo-dev-book/impls/filter.html
- http://dubbo.apache.org/books/dubbo-dev-book/implementation.html
- http://dubbo.apache.org/books/dubbo-user-book/preface/architecture.html
