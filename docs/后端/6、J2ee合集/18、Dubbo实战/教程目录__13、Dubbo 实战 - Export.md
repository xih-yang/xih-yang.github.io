# 13、Dubbo 实战 - Export
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/13.html
- 分类：J2EE框架
- 分组：教程目录
Spring在启动Dubbo服务端应用时，会实例化ServiceBean并设置配置属性，然后调用export方法：

```java
@SuppressWarnings({"unchecked", "deprecation"})
public void afterPropertiesSet() throws Exception {
    // 设置一揽子provider属性
    ......
    if (!isDelay()) {
        export();
    }
}
```

此后调用的是ServiceConfig中的doExportUrls方法：

```java
@SuppressWarnings({"unchecked", "rawtypes"})
private void doExportUrls() {
    // 获取注册中心地址
    List<URL> registryURLs = loadRegistries(true);
    for (ProtocolConfig protocolConfig : protocols) {
        doExportUrlsFor1Protocol(protocolConfig, registryURLs);
    }
}
```

最终实现的是如下逻辑：

```java
private void doExportUrlsFor1Protocol(ProtocolConfig protocolConfig, List<URL> registryURLs) {
    // 省略...
    ......
    String scope = url.getParameter(Constants.SCOPE_KEY);
    // don't export when none is configured
    if (!Constants.SCOPE_NONE.toString().equalsIgnoreCase(scope)) {
        // export to local if the config is not remote (export to remote only when config is remote)
        if (!Constants.SCOPE_REMOTE.toString().equalsIgnoreCase(scope)) {
            // 暴露到本地，使用injvm协议，本地调用服务时会采用此协议
            exportLocal(url);
        }
        // export to remote if the config is not local (export to local only when config is local)
        if (!Constants.SCOPE_LOCAL.toString().equalsIgnoreCase(scope)) {
            // 暴露到服务注册中心
            if (logger.isInfoEnabled()) {
                logger.info("Export dubbo service " + interfaceClass.getName() + " to url " + url);
            }
            if (registryURLs != null && !registryURLs.isEmpty()) {
                for (URL registryURL : registryURLs) {
                    url = url.addParameterIfAbsent("dynamic", registryURL.getParameter("dynamic"));
                    URL monitorUrl = loadMonitor(registryURL);
                    if (monitorUrl != null) {
                        url = url.addParameterAndEncoded(Constants.MONITOR_KEY, monitorUrl.toFullString());
                    }
                    if (logger.isInfoEnabled()) {
                        logger.info("Register dubbo service " + interfaceClass.getName() + " url " + url + " to registry " + registryURL);
                    }
                    Invoker<?> invoker = proxyFactory.getInvoker(ref, (Class) interfaceClass, registryURL.addParameterAndEncoded(Constants.EXPORT_KEY, url.toFullString()));
                    DelegateProviderMetaDataInvoker wrapperInvoker = new DelegateProviderMetaDataInvoker(invoker, this);
                    // 暴露服务，protocol实例为ProtocolListenerWrapper，ProtocolListenerWrapper使用装饰器模式，会不断的调用Protocol接口的子类实例
                    Exporter<?> exporter = protocol.export(wrapperInvoker);
                    exporters.add(exporter);
                }
            } else {
                Invoker<?> invoker = proxyFactory.getInvoker(ref, (Class) interfaceClass, url);
                DelegateProviderMetaDataInvoker wrapperInvoker = new DelegateProviderMetaDataInvoker(invoker, this);
                Exporter<?> exporter = protocol.export(wrapperInvoker);
                exporters.add(exporter);
            }
        }
    }
    this.urls.add(url);
}
```

代码Exporter exporter = protocol.export(wrapperInvoker); protocol实例为ProtocolListenerWrapper，ProtocolListenerWrapper使用了装饰器模式，依次包装了Protocol接口的子类，其中最重要的两个子类是DubboProtocol和RegistryProtocol。DubboProtocol的主要功能是启动NettyServer和重置服务URL的部分参数，RegistryProtocol的主要功能是暴露服务到注册中心，例如zookeeper。

接下来先看DubboProtocol的export方法：

```java
public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
    URL url = invoker.getUrl();
    // export service.
    String key = serviceKey(url);
    DubboExporter<T> exporter = new DubboExporter<T>(invoker, key, exporterMap);
    exporterMap.put(key, exporter);
    //export an stub service for dispatching event
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
    // 启动NettyServer和重置服务URL的部分参数
    openServer(url);
    optimizeSerialization(url);
    return exporter;
}
```

```java
private void openServer(URL url) {
    // find server.
    String key = url.getAddress();
    //client can export a service which's only for server to invoke
    boolean isServer = url.getParameter(Constants.IS_SERVER_KEY, true);
    if (isServer) {
        ExchangeServer server = serverMap.get(key);
        if (server == null) {
            // 启动NettyServer并放入serverMap
            serverMap.put(key, createServer(url));
        } else {
            // server supports reset, use together with override
            // 重置服务URL的部分参数
            server.reset(url);
        }
    }
}
```

```java
private ExchangeServer createServer(URL url) {
    ......
    url = url.addParameter(Constants.CODEC_KEY, DubboCodec.NAME);
    ExchangeServer server;
    try {
        // 启动NettyServer
        server = Exchangers.bind(url, requestHandler);
    } catch (RemotingException e) {
        throw new RpcException("Fail to start server(url: " + url + ") " + e.getMessage(), e);
    }
    ......
    return server;
}
```

最终会调用HeaderExchanger的bind方法：

```java
public ExchangeServer bind(URL url, ExchangeHandler handler) throws RemotingException {
        return new HeaderExchangeServer(Transporters.bind(url, new DecodeHandler(new HeaderExchangeHandler(handler))));
    }
```

剩下就是实例化NettyServer了，这里不再贴出该部分代码，若感兴趣可自行跟踪源码啦。

这里注意到NettyServer中有一个属性channels，这里维护了所有客户端的连接。
