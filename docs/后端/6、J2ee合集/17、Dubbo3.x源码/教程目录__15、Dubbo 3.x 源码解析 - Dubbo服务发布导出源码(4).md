# 15、Dubbo 3.x 源码解析 - Dubbo服务发布导出源码(4)
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/15.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo服务的发布与引用的源码。

此前我们学习了[Dubbo服务发布导出源码(3)](/zhuanlan/j2ee/dubbo/2/14.html)，也就是Dubbo服务导出的核心方法**doExportUrl的上半部分源码**，现在我们继续学习，服务导出的核心方法**doExportUrl的下半部分源码，也就是具体的远程服务协议导出。**

## 1 RegistryProtocol应用级远程服务导出协议

应用级服务远程导出协议以service-discovery-registry开头，其对应的Protocol实现就是RegistryProtocol。

**1、** 这里的Invoker中的url实际上是注册中心的url地址，例如service-discovery-registry://127.0.0.1:2181/org.apache.dubbo.registry.RegistryService?REGISTRY_CLUSTER=registry1&application=demo-provider&application.version=1&dubbo=2.0.2&pid=48272&registry=zookeeper&timeout=20001&timestamp=1666601882084；

**2、** 真正的服务导出url被保存到attributes属性中，key为export，value例如dubbo://127.0.0.1:20880/org.apache.dubbo.demo.GreetingService?anyhost=true&application=demo-provider&application.version=1&background=false&bind.ip=127.0.0.1&bind.port=20880&delay=5000&deprecated=false&dubbo=2.0.2&dynamic=true&generic=false&group=greeting&interface=org.apache.dubbo.demo.GreetingService&methods=hello&pid=48272&revision=1.0.0&service-name-mapping=true&side=provider&timeout=5000&timestamp=1666601909853&version=1.0.0；

这个方法内容很多，大概步骤为：

**1、** 创建**OverrideListener**存入**overrideListeners**集合，用于监听zk服务端**configurators**配置目录变更若监听到有变更，则会内部的**originInvoker**进行**reExport**，即重新导出；

**2、** 获取真实服务提供者url，调用**doLocalExport**方法进行服务导出，得到**Exporter**；

**3、** 基于DubboSPI机制**根据注册中心url加载具体的注册中心操作类**，service-discovery-registry对应着**ServiceDiscoveryRegistry**；

**4、** 调用**register**方法向远程注册中心注册服务提供者url；

**5、** 将**Exporter**包装为一个**DestroyableExporter**返回；

```java
@Override
public <T> Exporter<T> export(final Invoker<T> originInvoker) throws RpcException {
    //获取注册中心url，实际上就是Invoker的url属性
    //service-discovery-registry://127.0.0.1:2181/org.apache.dubbo.registry.RegistryService?REGISTRY_CLUSTER=registry1&application=demo-provider&application.version=1&dubbo=2.0.2&pid=48272&registry=zookeeper&timeout=20001&timestamp=1666601882084
    URL registryUrl = getRegistryUrl(originInvoker);
    // url to export locally 获取服务提供者导出url，实际上是Invoker的url属性内部的export属性
    //dubbo://127.0.0.1:20880/org.apache.dubbo.demo.GreetingService?anyhost=true&application=demo-provider&application.version=1&background=false&bind.ip=127.0.0.1&bind.port=20880&delay=5000&deprecated=false&dubbo=2.0.2&dynamic=true&generic=false&group=greeting&interface=org.apache.dubbo.demo.GreetingService&methods=hello&pid=48272&revision=1.0.0&service-name-mapping=true&side=provider&timeout=5000&timestamp=1666601909853&version=1.0.0
    URL providerUrl = getProviderUrl(originInvoker);
    // Subscribe the override data
    // FIXME When the provider subscribes, it will affect the scene : a certain JVM exposes the service and call
    //  the same service. Because the subscribed is cached key with the name of the service, it causes the
    //  subscription information to cover.
    //根据服务提供者url获取订阅的url，将协议改为provider，添加category、configurators、check三个url参数，默认值false
    //provider://10.253.45.126:20880/org.apache.dubbo.demo.GreetingService?anyhost=true&application=demo-provider&application.version=1&background=false&bind.ip=10.253.45.126&bind.port=20880&category=configurators&check=false&delay=5000&deprecated=false&dubbo=2.0.2&dynamic=true&generic=false&group=greeting&interface=org.apache.dubbo.demo.GreetingService&methods=hello&pid=49884&revision=1.0.0&service-name-mapping=true&side=provider&timeout=5000&timestamp=1666602580965&version=1.0.0
    final URL overrideSubscribeUrl = getSubscribedOverrideUrl(providerUrl);
    //创建OverrideListener这个url监听器
    final OverrideListener overrideSubscribeListener = new OverrideListener(overrideSubscribeUrl, originInvoker);
    //获取ProviderConfigurationListener内部的overrideListeners
    Map<URL, NotifyListener> overrideListeners = getProviderConfigurationListener(providerUrl).getOverrideListeners();
    //将OverrideListener加入到overrideListeners，key为注册中心url
    overrideListeners.put(registryUrl, overrideSubscribeListener);
    providerUrl = overrideUrlWithConfig(providerUrl, overrideSubscribeListener);
    //export invoker
    /*
     * 1 根据真正providerUrl的协议来导出url
     */
    final ExporterChangeableWrapper<T> exporter = doLocalExport(originInvoker, providerUrl);
    // url to registry
    //基于Dubbo SPI机制根据注册中心url加载具体的注册中心操作类，service-discovery-registry对应着ServiceDiscoveryRegistry
    final Registry registry = getRegistry(registryUrl);
    //获取需要注册的服务url
    //dubbo://192.168.31.84:20880/org.apache.dubbo.demo.GreetingService?anyhost=true&application=demo-provider&application.version=1&background=false&delay=5000&deprecated=false&dubbo=2.0.2&dynamic=true&generic=false&group=greeting&interface=org.apache.dubbo.demo.GreetingService&methods=hello&pid=10920&revision=1.0.0&service-name-mapping=true&side=provider&timeout=5000&timestamp=1666621305141&version=1.0.0
    final URL registeredProviderUrl = getUrlToRegistry(providerUrl, registryUrl);
    // decide if we need to delay publish (provider itself and registry should both need to register)
    //决定我们是否需要延迟发布(提供者本身和注册中心都需要注册)
    boolean register = providerUrl.getParameter(REGISTER_KEY, true) && registryUrl.getParameter(REGISTER_KEY, true);
    /*
     * 2 向注册中心注册服务
     */
    if (register) {
        register(registry, registeredProviderUrl);
    }
    // register stated url on provider model
    //注册标准url
    registerStatedUrl(registryUrl, registeredProviderUrl, register);
    //设置注册中心url和订阅url
    exporter.setRegisterUrl(registeredProviderUrl);
    exporter.setSubscribeUrl(overrideSubscribeUrl);
    //如果不支持服务发现
    if (!registry.isServiceDiscovery()) {
        // Deprecated! Subscribe to override rules in 2.6.x or before.
        //订阅符合条件的注册数据，并在注册数据发生更改时自动推送。新版本不再需要了
        registry.subscribe(overrideSubscribeUrl, overrideSubscribeListener);
    }
    //通知exporter，实际上是通知RegistryProtocolListener
    notifyExport(exporter);
    //根据exporter构建为一个新的DestroyableExporter返回
    return new DestroyableExporter<>(exporter);
}
```

### 1.1 getRegistryUrl获取注册中心url

该方法并不是真正的注册中心协议，直接返回原服务发现协议url，例如：service-discovery-registry://127.0.0.1:2181/org.apache.dubbo.registry.RegistryService?REGISTRY_CLUSTER=registry1&application=demo-provider&application.version=1&dubbo=2.0.2&pid=48272&registry=zookeeper&timeout=20001&timestamp=1666601882084

```java
/**
 * RegistryProtocol的方法
 */
protected URL getRegistryUrl(Invoker<?> originInvoker) {
    //直接返回原服务发现协议url
    return originInvoker.getUrl();
}
```

### 1.2 doLocalExport本地导出服务

**该方法根据指定的服务url进行服务导出。可以看到，该方法内部，将会根据真正的服务提供者url创建一个新的Invoker，然后调用Protocol#export方法导出为exporter，最后会存入bounds缓存中。这里所谓的localExport，并不是此前说的injvm协议的导出，而是区别于远程注册中心协议的其他协议的导出，例如dubbo协议导出。**

**这里的protocol同样是Protocol的自适应扩展实现，即Protocol$Adaptive，也就是说会根据传入的url中的protocol选择对应的Protocol SPI实现类，而默认实现就是dubbo协议，即DubboProtocol。**

```java
/**
 * RegistryProtocol的方法
 * <p>
 * 根据真正providerUrl的协议来导出url
 *
 * @param originInvoker 可执行对象
 * @param providerUrl   providerUrl的协议url
 */
@SuppressWarnings("unchecked")
private <T> ExporterChangeableWrapper<T> doLocalExport(final Invoker<T> originInvoker, URL providerUrl) {
    //获取缓存key，去除dynamic、enabled参数  dubbo://10.253.45.126:20880/org.apache.dubbo.demo.GreetingService?anyhost=true&application=demo-provider&application.version=1&background=false&bind.ip=10.253.45.126&bind.port=20880&delay=5000&deprecated=false&dubbo=2.0.2&generic=false&group=greeting&interface=org.apache.dubbo.demo.GreetingService&methods=hello&pid=56001&revision=1.0.0&service-name-mapping=true&side=provider&timeout=5000&timestamp=1666605432012&version=1.0.0
    String key = getCacheKey(originInvoker);
    //将exporter存入bounds缓存中
    return (ExporterChangeableWrapper<T>) bounds.computeIfAbsent(key, s -> {
        //新建一个invoker
        Invoker<?> invokerDelegate = new InvokerDelegate<>(originInvoker, providerUrl);
        //这里的这里的protocol是Protocol的自适应扩展实现，即Protocol$Adaptive
        //也就是说会根据传入的url中的protocol选择对应的Protocol SPI实现类，而默认实现就是dubbo协议，即DubboProtocol。
        return new ExporterChangeableWrapper<>((Exporter<T>) protocol.export(invokerDelegate), originInvoker);
    });
}
```

## 2 InterfaceCompatibleRegistryProtocol接口级远程服务导出协议

**接口级服务远程导出协议以registry开头，其对应的Protocol实现就是InterfaceCompatibleRegistryProtocol。**

**实际上InterfaceCompatibleRegistryProtocol继承了RegistryProtocol，大部分代码都是一样的，例如export导出协议的方法，仅仅是一些细微的代码不一致。我们来看看它在export过程中的特有的方法。**

### 2.1 getRegistryUrl获取注册中心url

该方法获取注册中心url，如果是RegistryProtocol协议，则直接返回originInvoker的url，并不会还原，而InterfaceCompatibleRegistryProtocol则会进行处理、还原。

获取url中的registry属性，也就是真实的注册中心协议，例如zookeeper，默认dubbo，然后替换掉registry协议并返回。

```java
/**
 * 获取注册中心url
 * @param originInvoker
 * @return
 */
@Override
protected URL getRegistryUrl(Invoker<?> originInvoker) {
    //获取注册中心url，例如：
    //registry://xxx.xxx.xxx.xxx:2181/org.apache.dubbo.registry.RegistryService?REGISTRY_CLUSTER=registry1&application=demo-provider&application.version=1&dubbo=2.0.2&pid=38947&registry=zookeeper&timeout=20001&timestamp=1666681960810
    URL registryUrl = originInvoker.getUrl();
    //如果协议是registry，即是接口级远程注册协议
    if (REGISTRY_PROTOCOL.equals(registryUrl.getProtocol())) {
        //获取url中的registry属性，也就是真实的注册中心协议，例如zookeeper，默认dubbo
        String protocol = registryUrl.getParameter(REGISTRY_KEY, DEFAULT_REGISTRY);
        //使用真实的注册中心协议替换registry协议，并且删除url中的registry参数
        registryUrl = registryUrl.setProtocol(protocol).removeParameter(REGISTRY_KEY);
    }
    //替换后的协议
    //zookeeper://xxx.xxx.xxx.xxx:2181/org.apache.dubbo.registry.RegistryService?REGISTRY_CLUSTER=registry1&application=demo-provider&application.version=1&dubbo=2.0.2&pid=38947&timeout=20001&timestamp=1666681960810
    return registryUrl;
}
```

## 3 DubboProtocol Dubbo协议导出

**上面讲到RegistryProtocol内部的doLocalExport方法会对真实协议进行导出，假设我们的Service服务协议采用dubbo协议，export方法我们在此前就说过了，会经过层层的包装，Dubbo协议的导出也不例外。区别是DubboProtocol还会进行网络通信处理。**

这里我们直接看最底层DubboProtocol的export方法，它的大概步骤为：

**1、** 根据**服务提供者url构建服务key**，例如：org.apache.dubbo.demo.DemoService:20880；

**2、** 根据**invoker**，key构建一个**DubboExporter**，然后将**key-invoker**，存入到**exporterMap**这个缓存中，**后续调用时，将会从exporterMap找到Exporter，然后找到Invoker进行调用**；

**3、** 导出用于调度事件的存根服务；

**4、** 调用**openServer**方法，**开启服务提供者端服务器，监听端口，这样就能接收consumer的远程调用请求**；

**5、** 调用**optimizeSerialization**方法，优化序列化；

```java
@Override
public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
    checkDestroyed();
    //获取服务提供者url
    //例如： dubbo://192.168.31.84:20880/org.apache.dubbo.demo.DemoService?anyhost=true&application=demo-provider&application.version=1&background=false&bind.ip=192.168.31.84&bind.port=20880&delay=5000&deprecated=false&dubbo=2.0.2&dynamic=true&generic=false&interface=org.apache.dubbo.demo.DemoService&methods=sayHello,sayHelloAsync&pid=20496&service-name-mapping=true&side=provider&timeout=3000&timestamp=1666619245421
    URL url = invoker.getUrl();
    /*
     * 1 导出服务
     */
    // export service.
    //构建服务key，例如  org.apache.dubbo.demo.DemoService:20880
    String key = serviceKey(url);
    //根据invoker，key构建一个DubboExporter
    //然后将key - invoker，存入到exporterMap这个缓存中，后续调用时，将会从exporterMap找到Exporter，然后找到Invoker进行调用。
    DubboExporter<T> exporter = new DubboExporter<T>(invoker, key, exporterMap);
    //export a stub service for dispatching event
    //导出用于调度事件的存根服务
    boolean isStubSupportEvent = url.getParameter(STUB_EVENT_KEY, DEFAULT_STUB_EVENT);
    boolean isCallbackService = url.getParameter(IS_CALLBACK_SERVICE, false);
    if (isStubSupportEvent && !isCallbackService) {
        String stubServiceMethods = url.getParameter(STUB_EVENT_METHODS_KEY);
        if (stubServiceMethods == null || stubServiceMethods.length() == 0) {
            if (logger.isWarnEnabled()) {
                logger.warn(new IllegalStateException("consumer [" + url.getParameter(INTERFACE_KEY) +
                    "], has set stub proxy support event ,but no stub methods founded."));
            }
        }
    }
    /*
     * 2 开启服务提供者端服务器
     */
    openServer(url);
    /*
     * 3 优化序列化
     */
    optimizeSerialization(url);
    return exporter;
}
```

### 3.1 openServer开启服务器

**开启服务提供者端服务器，监听端口，这样就能接收consumer的远程调用请求。**

**从服务缓存serverMap获取协议服务ProtocolServer，serverMap缓存key为url的address，因此同服务器同端口的多个Dubbo Service将会使用同一个key，即一般情况下，一个服务实例中的所有服务接口使用同一个服务器。**

**如果没有服务器那么调用createServer创建，否则调用reset重置，重置实际上就是更新Server的一些配置信息以及url参数信息。**

```java
/**
 * DubboProtocol的方法
 * <p>
 * 开启服务端
 * @param url 服务提供者url
 */
private void openServer(URL url) {
    checkDestroyed();
    // find server.
    //获取服务器key，就是url的address、，例如：192.168.31.84:20880
    String key = url.getAddress();
    // client can export a service which only for server to invoke
    boolean isServer = url.getParameter(IS_SERVER_KEY, true);
    if (isServer) {
        //从服务map缓存获取协议服务ProtocolServer，同服务器同端口的多个Dubbo Service将会使用同一个key
        ProtocolServer server = serverMap.get(key);
        if (server == null) {
            //加锁
            synchronized (this) {
                //双重检测
                server = serverMap.get(key);
                if (server == null) {
                    //创建一个ProtocolServer存入进去
                    serverMap.put(key, createServer(url));
                    return;
                }
            }
        }
        // server supports reset, use together with override
        //如果已经有了ProtocolServer，那么重置
        server.reset(url);
    }
}
```

#### 3.1.1 createServer创建服务器

**该方法创建生产者网络通信服务器，即dubbo提供者端网络服务，默认采用netty作为底层网络通信库。**

**该方法的核心就是Exchangers#bind方法，该方法默认通过HeaderExchanger创建HeaderExchangeServer，HeaderExchangeServer内部包含基于NettyTransporter创建的NettyServer，NettyServer内部包含url和ChannelHandler，创建NettyServer时构造器内部会调用doOpen方法绑定端口并启动netty服务器，而ChannelHandler的包含关系为：ChannelHandlerDispatcher -> DecodeHandler -> HeaderExchangeHandler -> requestHandler(ExchangeHandlerAdapter)。**

```java
/**
 * DubboProtocol的方法
 * 创建服务器
 *
 * @param url 服务提供者url
 * @return 协议服务器
 */
private ProtocolServer createServer(URL url) {
    //添加url参数
    url = URLBuilder.from(url)
        // send readonly event when server closes, it's enabled by default 当服务器关闭时发送只读事件，默认情况下是启用的
        .addParameterIfAbsent(CHANNEL_READONLYEVENT_SENT_KEY, Boolean.TRUE.toString())
        // enable heartbeat by default  默认启用心跳
        .addParameterIfAbsent(HEARTBEAT_KEY, String.valueOf(DEFAULT_HEARTBEAT))
        .addParameter(CODEC_KEY, DubboCodec.NAME) //编解码器 dubbo
        .build();
    //获取指定的网络传输器，dubbo还提供了netty、grizzly、mina三种，默认dubbo
    String transporter = url.getParameter(SERVER_KEY, DEFAULT_REMOTING_SERVER);
    //如果没有该传输器的扩展，那么抛出异常，目前仅提供了NettyTransporter
    if (StringUtils.isNotEmpty(transporter) && !url.getOrDefaultFrameworkModel().getExtensionLoader(Transporter.class).hasExtension(transporter)) {
        throw new RpcException("Unsupported server type: " + transporter + ", url: " + url);
    }
    //创建ExchangeServer交换器，启动NettyServer
    ExchangeServer server;
    try {
        //默认通过HeaderExchanger创建HeaderExchangeServer
        //HeaderExchangeServer内部包含基于NettyTransporter创建的NettyServer
        //NettyServer内部包含url和ChannelHandler，ChannelHandlerDispatcher -> DecodeHandler -> HeaderExchangeHandler -> requestHandler(ExchangeHandlerAdapter)
        server = Exchangers.bind(url, requestHandler);
    } catch (RemotingException e) {
        throw new RpcException("Fail to start server(url: " + url + ") " + e.getMessage(), e);
    }
    transporter = url.getParameter(CLIENT_KEY);
    if (StringUtils.isNotEmpty(transporter) && !url.getOrDefaultFrameworkModel().getExtensionLoader(Transporter.class).hasExtension(transporter)) {
        throw new RpcException("Unsupported client type: " + transporter);
    }
    //包装为DubboProtocolServer
    DubboProtocolServer protocolServer = new DubboProtocolServer(server);
    //加载服务器配置，主要是配置dubbo.service.shutdown.wait属性，即服务器关闭等待超时时间，默认10000ms
    loadServerProperties(protocolServer);
    return protocolServer;
}
```

##### 3.1.1.1 Exchangers#bind创建交换器

该方法内部基于Dubbo SPI获取Exchanger，默认HeaderExchanger，然后调用HeaderExchanger#bind方法。

```java
/**
 * Exchangers的方法
 *
 * 创建交换服务器
 * @param url 服务提供者url
 * @param handler  请求处理器
 */
public static ExchangeServer bind(URL url, ExchangeHandler handler) throws RemotingException {
    if (url == null) {
        throw new IllegalArgumentException("url == null");
    }
    if (handler == null) {
        throw new IllegalArgumentException("handler == null");
    }
    //添加url属性codec，值为exchange
    url = url.addParameterIfAbsent(Constants.CODEC_KEY, "exchange");
    //基于Dubbo SPI获取Exchanger，默认HeaderExchanger，然后调用HeaderExchanger#bind方法
    return getExchanger(url).bind(url, handler);
}
```

**HeaderExchanger#bind方法中，首先对handler进行包装：DecodeHandler -> HeaderExchangeHandler -> requestHandler。**

**1、** DecodeHandler用于负责内部的dubbo协议的请求解码；

**2、** HeaderExchangeHandler用于完成请求响应的映射；

**3、** 用于nettyHandler真正处理请求；

**随后调用Transporters#bind方法绑定并启动底层远程网络通信服务器，返回RemotingServer。Transporter是Dubbo对网络传输层的抽象接口，Exchanger依赖于Transporter。**

**最后基于RemotingServer构建HeaderExchangeServer返回。**

```java
@Override
public ExchangeServer bind(URL url, ExchangeHandler handler) throws RemotingException {
    //包装handler：DecodeHandler -> HeaderExchangeHandler -> handler
    //调用Transporters#bind方法绑定并启动底层远程网络通信服务器，返回RemotingServer
    //基于RemotingServer构建HeaderExchangeServer返回
    return new HeaderExchangeServer(Transporters.bind(url, new DecodeHandler(new HeaderExchangeHandler(handler))));
}
```

Transporters#bind方法将会在handler的最外层继续包装一层ChannelHandlerDispatcher，它所有的 ChannelHandler 接口实现都会调用其中每个 ChannelHandler 元素的相应方法。随后基于Dubbo SPI机制获取Transporter的实现，并调用bind方法完成绑定，目前仅NettyTransporter，基于netty4。

```java
public static RemotingServer bind(URL url, ChannelHandler... handlers) throws RemotingException {
    if (url == null) {
        throw new IllegalArgumentException("url == null");
    }
    if (handlers == null || handlers.length == 0) {
        throw new IllegalArgumentException("handlers == null");
    }
    //继续包装一层ChannelHandlerDispatcher
    ChannelHandler handler;
    if (handlers.length == 1) {
        handler = handlers[0];
    } else {
        handler = new ChannelHandlerDispatcher(handlers);
    }
    //基于Dubbo SPI机制获取Transporter的实现，并调用bind方法完成绑定
    return getTransporter(url).bind(url, handler);
}
```

##### 3.1.1.2 NettyTransporter#bind创建NettyServer

该方法很简单，就是根据url和handler创建一个NettyServer实例，在NettyServer的构造器中，会调用doOpen()开启服务，创建ServerBootstrap，设置EventLoopGroup，编配ChannelHandlerPipeline，最终调用bind()绑定本地端口。

```java
@Override
public RemotingServer bind(URL url, ChannelHandler handler) throws RemotingException {
    //基于url和handler创建NettyServer
    return new NettyServer(url, handler);
}
```

NettyServer的构造器如下，将会调用父类构造器启动服务。

```java
public NettyServer(URL url, ChannelHandler handler) throws RemotingException {
    // you can customize name and type of client thread pool by THREAD_NAME_KEY and THREAD_POOL_KEY in CommonConstants.
    // the handler will be wrapped: MultiMessageHandler->HeartbeatHandler->handler
    //可通过CommonConstants中的THREAD_NAME_KEY和THREAD_POOL_KEY自定义客户端线程池的名称和类型
    //继续包装handler： MultiMessageHandler->HeartbeatHandler->handler
    super(ExecutorUtil.setThreadName(url, SERVER_THREAD_POOL_NAME), ChannelHandlers.wrap(handler, url));
    // read config before destroy
    //获取服务器关闭等待超时时间，默认10000ms
    serverShutdownTimeoutMills = ConfigurationUtils.getServerShutdownTimeout(getUrl().getOrDefaultModuleModel());
}
```

**AbstractServer的构造器如下，将会获取绑定的ip和端口以及其他参数，然后调用doOpen方法真正的开启netty服务。最后还会为当前url构建线程池并存入executors。**

```java
public AbstractServer(URL url, ChannelHandler handler) throws RemotingException {
    super(url, handler);
    executorRepository = url.getOrDefaultApplicationModel().getExtensionLoader(ExecutorRepository.class).getDefaultExtension();
    localAddress = getUrl().toInetSocketAddress();
    //获取绑定的ip
    String bindIp = getUrl().getParameter(Constants.BIND_IP_KEY, getUrl().getHost());
    //获取绑定的端口
    int bindPort = getUrl().getParameter(Constants.BIND_PORT_KEY, getUrl().getPort());
    //如果url有anyhost=true参数或者ip是本地ip，那么设置绑定ip为0.0.0.0
    if (url.getParameter(ANYHOST_KEY, false) || NetUtils.isInvalidLocalHost(bindIp)) {
        bindIp = ANYHOST_VALUE;
    }
    //构建绑定host
    bindAddress = new InetSocketAddress(bindIp, bindPort);
    //获取accepts参数，即最大可接受链接数，默认值0
    this.accepts = url.getParameter(ACCEPTS_KEY, DEFAULT_ACCEPTS);
    try {
        /*
         * 开启netty服务器
         */
        doOpen();
        if (logger.isInfoEnabled()) {
            logger.info("Start " + getClass().getSimpleName() + " bind " + getBindAddress() + ", export " + getLocalAddress());
        }
    } catch (Throwable t) {
        throw new RemotingException(url.toInetSocketAddress(), null, "Failed to bind " + getClass().getSimpleName()
            + " on " + getLocalAddress() + ", cause: " + t.getMessage(), t);
    }
    //为当前url构建线程池并存入executors
    executors.add(executorRepository.createExecutorIfAbsent(url));
}
```

##### 3.1.1.3 doOpen初始化并启动netty服务器

**该方法用于初始化并启动netty服务器，是非常标准的netty服务端启动代码。创建ServerBootstrap，设置bossGroup和workerGroup，编配ChannelHandler，最终调用bind()绑定本地端口。至此成功启动netty服务端，可以开始监听网络请求了。**

```java
/**
 * NettyServer的方法
 *
 * 初始化并启动netty服务器
 */
@Override
protected void doOpen() throws Throwable {
    //创建ServerBootstrap，说明这是一个netty服务端
    bootstrap = new ServerBootstrap();
    //创建bossGroup
    bossGroup = createBossGroup();
    //创建workerGroup
    workerGroup = createWorkerGroup();
    //创建NettyServerHandler
    final NettyServerHandler nettyServerHandler = createNettyServerHandler();
    //获取 worker channel
    channels = nettyServerHandler.getChannels();
    //初始化ServerBootstrap
    initServerBootstrap(nettyServerHandler);
    // bind
    //绑定ip:port，并且生成一个ChannelFuture，启动服务器，现在可以开始监听网络请求了
    ChannelFuture channelFuture = bootstrap.bind(getBindAddress());
    //让当前线程同步等待Netty server的close事件
    channelFuture.syncUninterruptibly();
    channel = channelFuture.channel();
}
protected EventLoopGroup createBossGroup() {
    //默认1个线程，线程名NettyServerBoss
    return NettyEventLoopFactory.eventLoopGroup(1, EVENT_LOOP_BOSS_POOL_NAME);
}
protected EventLoopGroup createWorkerGroup() {
    //默认Math.min(Runtime.getRuntime().availableProcessors() + 1, 32)个线程，可通过iothreads参数指定
    //线程名NettyServerWorker
    return NettyEventLoopFactory.eventLoopGroup(
            getUrl().getPositiveParameter(IO_THREADS_KEY, Constants.DEFAULT_IO_THREADS),
        EVENT_LOOP_WORKER_POOL_NAME);
}
protected NettyServerHandler createNettyServerHandler() {
    //创建NettyServerHandler，当前NettyServer对象本身也是一个ChannelHandler实例，其received方法委托给创建实例时传递的内部的handler处理
    return new NettyServerHandler(getUrl(), this);
}
protected void initServerBootstrap(NettyServerHandler nettyServerHandler) {
    //从url参数keep.alive获取是否保持连接，默认false
    boolean keepalive = getUrl().getParameter(KEEP_ALIVE_KEY, Boolean.FALSE);
    //配置线程组
    bootstrap.group(bossGroup, workerGroup)
        //IO模型
            .channel(NettyEventLoopFactory.serverSocketChannelClass())
        //设置Socket 参数
            .option(ChannelOption.SO_REUSEADDR, Boolean.TRUE)
            .childOption(ChannelOption.TCP_NODELAY, Boolean.TRUE)
            .childOption(ChannelOption.SO_KEEPALIVE, keepalive)
            .childOption(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT)
        //设置处理器
            .childHandler(new ChannelInitializer<SocketChannel>() {
                //用于添加ServerSocketChannel对应的 Handle
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {
                    // FIXME: should we use getTimeout()?
                    int idleTimeout = UrlUtils.getIdleTimeout(getUrl());
                    NettyCodecAdapter adapter = new NettyCodecAdapter(getCodec(), getUrl(), NettyServer.this);
                    if (getUrl().getParameter(SSL_ENABLED_KEY, false)) {
                        ch.pipeline().addLast("negotiation", new SslServerTlsHandler(getUrl()));
                    }
                    //自定义客户端消息的业务处理逻辑Handler
                    ch.pipeline()
                        //解码
                            .addLast("decoder", adapter.getDecoder())
                        //编码
                            .addLast("encoder", adapter.getEncoder())
                        //心跳检测
                            .addLast("server-idle-handler", new IdleStateHandler(0, 0, idleTimeout, MILLISECONDS))
                        //最后是此前创建的nettyServerHandler
                            .addLast("handler", nettyServerHandler);
                }
            });
}
```

## 4 总结

**对于远程导出就比较复杂，包括接口级注册中心的registry对应InterfaceCompatibleRegistryProtocol，应用级注册中心的service-discovery-registry对应RegistryProtocol。大概步骤如下：**

**需要从注册中心url的attributes属性中，获取真实的服务导出url，然后调用doLocalExport方法进行服务导出，该方法内部实际上就是重复前面的Protocol$Adaptive#export的过程。**

**1、****此时，将会调用真实协议对应的Protocol实现，例如dubbo协议对应着DubboProtocol，而在这些协议的export方法中，除了构建Exportor加入exporterMap缓存之外，还会调用openServer方法，开启一个服务提供者端服务器，监听端口，这样就能接收consumer的远程调用请求**；

**2、****同ip同端口（同一个dubbo服务端）的Dubbo应用中，多个DubboService将会使用同一个服务器，即只有在第一次调用openServer的时候才会创建服务器ip就是服务器的ip，端口就是20880端口**；

**3、****创建服务器的时候，默认使用netty作为底层通信库，即创建一个netty服务端**；

**然后，就是通过Registry#register方法向远程注册中心注册服务提供者url，这部分的源码我们下回分解！**

**另外，其实我们发现，凡事涉及到需要依靠网络通信的框架，无论是RPC框架还是各种MQ框架等等，底层网络通信几乎都是依靠的Netty来支持。所以，虽然我们实际开发可能不会主动接触Netty，但是我们确实是一直都在使用它。**

**Netty作为一个的非常底层的网络通信框架，它在我们Java工程师的进阶过程中是非常重要的一个坎，直白的说，对于高级、资深Java工程师的面试特别有帮助，后续我将会免费的、开源的、具有深度的解析Netty的各种流程源码，欢迎大家关注！**
