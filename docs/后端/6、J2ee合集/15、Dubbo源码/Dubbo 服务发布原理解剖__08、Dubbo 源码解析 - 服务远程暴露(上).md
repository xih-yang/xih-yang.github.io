# 08、Dubbo 源码解析 - 服务远程暴露(上)
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/8.html
- 分类：J2EE框架
- 分组：Dubbo 服务发布原理解剖
在上一篇文章我们讲解了一下 dubbo 服务暴露过程中的本地暴露。它只是一个开胃小菜，主要是为我们后面讲解远程暴露开个头。下面就来分析一下 dubbo 在远程暴露里面发生了哪些事。因为 dubbo 远程暴露里面的过程还是比较复杂的，所以我就分为三个文章来讲解 dubbo 的远程暴露：

**1、** dubbo远程暴露–Netty暴露服务；

**2、** dubbo远程暴露–Zookeeper连接；

**3、** dubbo远程暴露–Zookeeper注册&订阅；

这就篇就是分析 dubbo 服务暴露中通过 Netty 来暴露服务(当然 dubbo 还可以通过 Mina、Grizzly 来暴露服务，默认使用 Netty)。

#### 1、ServiceConfig#doExportUrls

首先通过方法`loadRegistries(true)`来加载注册中心。在方法`checkRegistry()`方法中判断如果 xml 里面没有配置注解中心，从 dubbo 的 properties 文件中获取(默认是`dubbo.properties`)。然后会返回`List` 作为配置信息的统一格式，所有扩展点都通过传递 URL 携带配置信息。URL的格式如下：

```java
registry://127.0.0.1:2181/com.alibaba.dubbo.registry.RegistryService?application=demo-provider&dubbo=2.0.0 ...
```

因为dubbo 支持多种协议，遍历所有协议分别根据不同的协议把服务export到不同的注册中心上去。

**1、** 把配置的信息通过`appendParameters`提取到map中；

**2、** 判断是否支持泛化调用；

**3、** 通过协议名称、host、port、contextPath和第一步提取出来的map构造协议的统一数据模型URL(如：`dubbo://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider...`)；

**4、** 循环遍注册中心，把服务暴露在不同的注册中心当中；

a) 如果配置了 monitor，就返回监控统一模型数据 URL，并给以 `monitor`为 key 添加到生成的 URL中，URL格式如下：

`registry://127.0.0.1:2181/com.alibaba.dubbo.registry.RegistryService?export=dubbo%3A%2F%2F169.254.69.197%3A20880%2Fcom.alibaba.dubbo.demo.DemoService& ...`

b) 把协议统一模型 URL 以`export`为 key，添加到注册中心的统一模型 URL中

c) 根据服务的具体实现、实现的接口以及注册中心统一模型 URL从代理工厂 `ProxyFactory`(SPI 默认获取到 JavassistProxyFactory)获取 `Invoker`对象。

d) 通过 Protocol#export(invoker) 暴露服务，因为注册的协议是 registry 所以生成的 Protocol 对象如下图所示。因为 ProtocolFilterWrapper和ProtocolFilterWrapper是过滤 registry协议的，所以最终通过 RegistryProtocol来处理暴露过程。

#### 2、RegistryProtocol#export

根据这个类名我们就可以推测出这个类具有的功能，具有 `Registry`(**注册**)与 `Protocol` (**协议–服务暴露**)在这个方法里面就包括上面提到的三个逻辑：

- dubbo 远程暴露 – Netty 暴露服务，通过配置的协议根据 SPI 获取到对应的 Protocol对象，这里是 DubboProtocol，对象。
- dubbo 远程暴露 – Zookeeper 连接 服务注册，通过RegistryFactory根据 SPI 获取对应的 Registry 对象(ZookeeperRegistry)，然后注册到注册中心上面去，供 consumer调用
- dubbo 远程暴露 – Zookeeper 注册 & 订阅，它会把创建2个节点：一个是/dubbo/服务全类名/provider/...节点提供给服务消费方查看节点信息；二是/dubbo/服务全类名/configurators/...节点提供给服务方 watch(监控) dubbo-admin 对于服务的修改。比如：服务权重。

上面粗略的讲了一下服务远程暴露主要干了哪些事，主要是想让大家有一个全局的意识。下面我们就来讲一下 dubbo 服务是如何通过 Netty 来暴露服务。

1. getCacheKey(originInvoker)，通过 Invoker 对象获取到缓存 key，还记得我们在ServiceConfig#doExportUrls的 4-b 步骤里面吗？它就是把保存在 注册统一模型里面的 export key 获取到协议的统一模型dubbo://169.254.69.197:20880/com.alibaba.dubbo.demo.DemoService?anyhost=true&application=demo-provider ...，然后再删除 dynamic与enabled 参数
**2、** 从`Map>bounds`缓存中根据上面获取的key获取Exporter对象，如果获取到直接返回；否则进行服务暴露；

**3、** 通过`originInvoker`获取里面的URL获取到协议的统一模型以及`originInvoker`本身创建`InvokerDelegete`；

**4、** 根据`InvokerDelegete`暴露服务，因为URL协议是`dubbo`，所以获取到的实例是`DubboProtocol`，而这个对象因为协议不是`registry`，所以生成`ProtocolListenerWrapper`会根据SPI机制检测dubbo里面配置的InvokerListener扩展；而`ProtocolFilterWrapper`会根据SPI机制检测dubbo里面配置的Filter扩展所以最终通过`DubboProtocol`来处理暴露过程；

**5、** 暴露生成的Exporter和传入的`originInvoker`会创建`ExporterChangeableWrapper`对象会以步骤1生成的key缓存在`Map>bounds`当中，并返回结果；

#### 3、DubboProtocol#export

整个DubboProtocol#export的代码如下：

```java
    public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
        URL url = invoker.getUrl();
        // export service.
        String key = serviceKey(url);
        DubboExporter<T> exporter = new DubboExporter<T>(invoker, key, exporterMap);
        exporterMap.put(key, exporter);
        //export an stub service for dispaching event
        Boolean isStubSupportEvent = url.getParameter(Constants.STUB_EVENT_KEY, Constants.DEFAULT_STUB_EVENT);
        Boolean isCallbackservice = url.getParameter(Constants.IS_CALLBACK_SERVICE, false);
        if (isStubSupportEvent && !isCallbackservice) {
            String stubServiceMethods = url.getParameter(Constants.STUB_EVENT_METHODS_KEY);
            if (stubServiceMethods == null || stubServiceMethods.length() == 0) {
                if (logger.isWarnEnabled()) {
                    logger.warn(new IllegalStateException("consumer [" + url.getParameter(Constants.INTERFACE_KEY) +
                            "], has set stubproxy support event ,but no stub methods founded."));
                }
            } else {
                stubServiceMethodsMap.put(url.getServiceKey(), stubServiceMethods);
            }
        }
        openServer(url);
        return exporter;
    }
```

这断代码主要的操作是：

**1、** 根据传入的`Invoker`中的URL通过`serviceKey(url)`获取到serviceKey，它的格式为：`com.alibaba.dubbo.demo.DemoService:20880`.；

**2、** 以传的`Invoker`、第1步生成的key和`Map>exporterMap`生成`DubboExporter`，并以第1步生成的key为索引，把生成的`DubboExporter`添加到`Map>exporterMap`中；

3. 根据 URL 判断是不是服务端，如果是服务端并且从Map`` serverMap获取到的 ExchangeServer 为空，就通过DubboProtocol#createServer 创建服务，达到服务暴露的目的。返回DubboExporter对象

#### 4、DubboProtocol#createServer

dubbo 远程服务(**Provider**)暴露最终其实就是创建一个 Netty Serve 服务，然后在 dubbo 在服务引用的时候创建一个 Netty Client 服务。其实 dubbo 远程通信的原理其实就是基于 Socket 的远程通信。下面我们来看一下 dubbo 是如何创建一个 Netty 服务的，下面就是它创建的序列图：

它通过传入 URL 与 `requestHandler`来创建一个 ExchangeServer，通过Netty 基于 NIO的形式通过自定义Channel来接收服务引用方传递过来的信息，以及发送调用远程服务的本地方法后的数据给服务调用者。URL 里面主要包含 IP 地址 与 端口信息用于创建 Socket 连接，而 `requestHandler`是一个 ExchangeHandler 通过自定义协议来处理 dubbo 的远程通信。
