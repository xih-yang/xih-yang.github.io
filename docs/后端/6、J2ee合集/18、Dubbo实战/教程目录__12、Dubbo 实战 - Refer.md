# 12、Dubbo 实战 - Refer
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/12.html
- 分类：J2EE框架
- 分组：教程目录
Spring在启动Dubbo客户端应用时，会实例化ReferenceBean并设置配置属性，然后调用ReferenceConfig中的get方法：

```java
public synchronized T get() {
    if (destroyed) {
        throw new IllegalStateException("Already destroyed!");
    }
    if (ref == null) {
        init();
    }
    return ref;
}
```

```java
private void init() {
    if (initialized) {
        return;
    }
    initialized = true;
    // 省略...
    ref = createProxy(map);    // 这里使用了动态代理生成对象
    ConsumerModel consumerModel = new ConsumerModel(getUniqueServiceName(), this, ref, interfaceClass.getMethods());　　// ref保存到consumerModel
    ApplicationModel.initConsumerModel(getUniqueServiceName(), consumerModel);　　// consumerModel保存到concurrentHashMap，内存中
}
```

ref = createProxy(map); 这里使用了动态代理生成了代理对象（这里也可以成为远程代理，因为在这个代理中进行了远程调用），ref 即getBean返回的对象，这样在本地调用业务Service接口时就会使用代理处理器com.alibaba.dubbo.rpc.proxy.InvokerInvocationHandler。

```java
@SuppressWarnings({"unchecked", "rawtypes", "deprecation"})
private T createProxy(Map<String, String> map) {
    URL tmpUrl = new URL("temp", "localhost", 0, map);
    final boolean isJvmRefer;
    if (isInjvm() == null) {
        if (url != null && url.length() > 0) { // if a url is specified, don't do local reference
            // 指定URL的情况下，不进行本地引用
            isJvmRefer = false;
        } else if (InjvmProtocol.getInjvmProtocol().isInjvmRefer(tmpUrl)) {
            // by default, reference local service if there is
            // 默认情况下如果本地有服务暴露，则引用本地服务
            isJvmRefer = true;
        } else {
            isJvmRefer = false;
        }
    } else {
        isJvmRefer = isInjvm().booleanValue();
    }
    if (isJvmRefer) {
        URL url = new URL(Constants.LOCAL_PROTOCOL, NetUtils.LOCALHOST, 0, interfaceClass.getName()).addParameters(map);
        invoker = refprotocol.refer(interfaceClass, url);
        if (logger.isInfoEnabled()) {
            logger.info("Using injvm service " + interfaceClass.getName());
        }
    } else {
        // 用户指定URL，指定的URL可能是点对点直连地址，也可能是注册中心URL
        if (url != null && url.length() > 0) { // user specified URL, could be peer-to-peer address, or register center's address.
            String[] us = Constants.SEMICOLON_SPLIT_PATTERN.split(url);
            if (us != null && us.length > 0) {
                for (String u : us) {
                    URL url = URL.valueOf(u);
                    if (url.getPath() == null || url.getPath().length() == 0) {
                        url = url.setPath(interfaceName);
                    }
                    if (Constants.REGISTRY_PROTOCOL.equals(url.getProtocol())) {
                        urls.add(url.addParameterAndEncoded(Constants.REFER_KEY, StringUtils.toQueryString(map)));
                    } else {
                        urls.add(ClusterUtils.mergeUrl(url, map));
                    }
                }
            }
        } else { // assemble URL from register center's configuration
            // 通过注册中心配置拼装URL
            List<URL> us = loadRegistries(false);
            if (us != null && !us.isEmpty()) {
                for (URL u : us) {
                    URL monitorUrl = loadMonitor(u);
                    if (monitorUrl != null) {
                        map.put(Constants.MONITOR_KEY, URL.encode(monitorUrl.toFullString()));
                    }
                    urls.add(u.addParameterAndEncoded(Constants.REFER_KEY, StringUtils.toQueryString(map)));
                }
            }
            if (urls == null || urls.isEmpty()) {
                throw new IllegalStateException("No such any registry to reference " + interfaceName + " on the consumer " + NetUtils.getLocalHost() + " use dubbo version " + Version.getVersion() + ", please config <dubbo:registry address=\"...\" /> to your spring config.");
            }
        }
        if (urls.size() == 1) {
            invoker = refprotocol.refer(interfaceClass, urls.get(0));
        } else {
            List<Invoker<?>> invokers = new ArrayList<Invoker<?>>();
            URL registryURL = null;
            for (URL url : urls) {
                invokers.add(refprotocol.refer(interfaceClass, url));
                if (Constants.REGISTRY_PROTOCOL.equals(url.getProtocol())) {
                    // 用了最后一个registry url
                    registryURL = url; // use last registry url
                }
            }
            // 有 注册中心协议的URL
            if (registryURL != null) { // registry url is available
                // use AvailableCluster only when register's cluster is available
                // 对有注册中心的Cluster 只用 AvailableCluster
                URL u = registryURL.addParameter(Constants.CLUSTER_KEY, AvailableCluster.NAME);
                invoker = cluster.join(new StaticDirectory(u, invokers));
            } else { // not a registry url
                // 不是 注册中心的URL
                invoker = cluster.join(new StaticDirectory(invokers));
            }
        }
    }
    Boolean c = check;
    if (c == null && consumer != null) {
        c = consumer.isCheck();
    }
    if (c == null) {
        c = true; // default true
    }
    if (c && !invoker.isAvailable()) {
        throw new IllegalStateException("Failed to check the status of the service " + interfaceName + ". No provider available for the service " + (group == null ? "" : group + "/") + interfaceName + (version == null ? "" : ":" + version) + " from the url " + invoker.getUrl() + " to the consumer " + NetUtils.getLocalHost() + " use dubbo version " + Version.getVersion());
    }
    if (logger.isInfoEnabled()) {
        logger.info("Refer dubbo service " + interfaceClass.getName() + " from url " + invoker.getUrl());
    }
    // create service proxy
    // 创建服务代理
    return (T) proxyFactory.getProxy(invoker);
}
```

### 生成Invoker

这里调用 invoker = refprotocol.refer(interfaceClass, urls.get(0)); 来生成invoker，代码如下：

```java
public <T> Invoker<T> refer(Class<T> serviceType, URL url) throws RpcException {
    optimizeSerialization(url);
    // create rpc invoker.
    DubboInvoker<T> invoker = new DubboInvoker<T>(serviceType, url, getClients(url), invokers);
    invokers.add(invoker);
    return invoker;
}
```

目前客户端invoke后，调用DubboInvoker的doInvoke函数，doInvoke函数中，通过currentClient.send或者currentClient.request发送数据。

```java
@Override
protected Result doInvoke(final Invocation invocation) throws Throwable {
    RpcInvocation inv = (RpcInvocation) invocation;
    final String methodName = RpcUtils.getMethodName(invocation);
    inv.setAttachment(Constants.PATH_KEY, getUrl().getPath());
    inv.setAttachment(Constants.VERSION_KEY, version);
    ExchangeClient currentClient;
    if (clients.length == 1) {
        currentClient = clients[0];
    } else {
        currentClient = clients[index.getAndIncrement() % clients.length];
    }
    try {
        boolean isAsync = RpcUtils.isAsync(getUrl(), invocation);
        boolean isOneway = RpcUtils.isOneway(getUrl(), invocation);
        int timeout = getUrl().getMethodParameter(methodName, Constants.TIMEOUT_KEY, Constants.DEFAULT_TIMEOUT);
        if (isOneway) {
            // 直接发送请求，不要求响应
            boolean isSent = getUrl().getMethodParameter(methodName, Constants.SENT_KEY, false);
            currentClient.send(inv, isSent);
            RpcContext.getContext().setFuture(null);
            return new RpcResult();
        } else if (isAsync) {
            // 异步方式发送请求，将响应存储在future中
            ResponseFuture future = currentClient.request(inv, timeout);
            RpcContext.getContext().setFuture(new FutureAdapter<Object>(future));
            return new RpcResult();
        } else {
            // 同步方式发送请求，并等待响应
            RpcContext.getContext().setFuture(null);
            return (Result) currentClient.request(inv, timeout).get();
        }
    } catch (TimeoutException e) {
        throw new RpcException(RpcException.TIMEOUT_EXCEPTION, "Invoke remote method timeout. method: " + invocation.getMethodName() + ", provider: " + getUrl() + ", cause: " + e.getMessage(), e);
    } catch (RemotingException e) {
        throw new RpcException(RpcException.NETWORK_EXCEPTION, "Failed to invoke remote method: " + invocation.getMethodName() + ", provider: " + getUrl() + ", cause: " + e.getMessage(), e);
    }
}
```

调用NettyClient的send方法：

```java
public void send(Object message, boolean sent) throws RemotingException {
    if (send_reconnect && !isConnected()) {
        connect();
    }
    Channel channel = getChannel();
    //TODO Can the value returned by getChannel() be null? need improvement.
    if (channel == null || !channel.isConnected()) {
        throw new RemotingException(this, "message can not send, because channel is closed . url:" + getUrl());
    }
    channel.send(message, sent);
}
```

这里实际上是利用netty的网络通信机制进行通信，而netty的机制保证数据接收处理：

```java
@Override
protected void doOpen() throws Throwable {
    NettyHelper.setNettyLoggerFactory();
    bootstrap = new ClientBootstrap(channelFactory);
    // config
    // @see org.jboss.netty.channel.socket.SocketChannelConfig
    bootstrap.setOption("keepAlive", true);
    bootstrap.setOption("tcpNoDelay", true);
    bootstrap.setOption("connectTimeoutMillis", getTimeout());
    final NettyHandler nettyHandler = new NettyHandler(getUrl(), this);
    bootstrap.setPipelineFactory(new ChannelPipelineFactory() {
        public ChannelPipeline getPipeline() {
            NettyCodecAdapter adapter = new NettyCodecAdapter(getCodec(), getUrl(), NettyClient.this);
            ChannelPipeline pipeline = Channels.pipeline();
            pipeline.addLast("decoder", adapter.getDecoder());
            pipeline.addLast("encoder", adapter.getEncoder());
            pipeline.addLast("handler", nettyHandler);
            return pipeline;
        }
    });
}
```

此时若收到数据，则会调用NettyHandler的messageReceived函数：

```java
@Override
public void messageReceived(ChannelHandlerContext ctx, MessageEvent e) throws Exception {
    NettyChannel channel = NettyChannel.getOrAddChannel(ctx.getChannel(), url, handler);
    try {
        handler.received(channel, e.getMessage());
    } finally {
        NettyChannel.removeChannelIfDisconnected(ctx.getChannel());
    }
}
```

此时，会发现，最后是调用DubboProtocol中requestHandler的received函数。

Handler的调用链是职责链模式和装饰器模式的混合模式（类似Tomcat的Filter），外层的Handler调用内层的Handler，并在调用前后加上一些逻辑； 最后，在received函数中：

```java
@Override
public void received(Channel channel, Object message) throws RemotingException {
    if (message instanceof Invocation) {
        reply((ExchangeChannel) channel, message);
    } else {
        super.received(channel, message);
    }
}
```

这里会发现super.received(channel, message)是空函数，因此若是客户端处理到这里，就不做任何处理了； 如果是服务器端，调用的是reply函数：

```java
public Object reply(ExchangeChannel channel, Object message) throws RemotingException {
    if (message instanceof Invocation) {
        Invocation inv = (Invocation) message;
        Invoker<?> invoker = getInvoker(channel, inv);
        // need to consider backward-compatibility if it's a callback
        // 如果是callback 需要处理高版本调用低版本的问题
        if (Boolean.TRUE.toString().equals(inv.getAttachments().get(IS_CALLBACK_SERVICE_INVOKE))) {
            String methodsStr = invoker.getUrl().getParameters().get("methods");
            boolean hasMethod = false;
            if (methodsStr == null || methodsStr.indexOf(",") == -1) {
                hasMethod = inv.getMethodName().equals(methodsStr);
            } else {
                String[] methods = methodsStr.split(",");
                for (String method : methods) {
                    if (inv.getMethodName().equals(method)) {
                        hasMethod = true;
                        break;
                    }
                }
            }
            if (!hasMethod) {
                logger.warn(new IllegalStateException("The methodName " + inv.getMethodName()
                        + " not found in callback service interface ,invoke will be ignored."
                        + " please update the api interface. url is:"
                        + invoker.getUrl()) + " ,invocation is :" + inv);
                return null;
            }
        }
        RpcContext.getContext().setRemoteAddress(channel.getRemoteAddress());
        return invoker.invoke(inv);
    }
    throw new RemotingException(channel, "Unsupported request: "
            + (message == null ? null : (message.getClass().getName() + ": " + message))
            + ", channel: consumer: " + channel.getRemoteAddress() + " --> provider: " + channel.getLocalAddress());
}
```

此时getInvoker实际上是从exporter中去获取Invoker。这里通过if (message instanceof Invocation)可知，如果不是调用，则此时不做其他处理，也就是客户端调用在这里是不做任何处理的。 因此我们返回到客户端的调用中，会发现HeaderExchangeClient的如下函数处理：

```java
public ResponseFuture request(Object request) throws RemotingException {
    return channel.request(request);
}
```

此时，转到HeaderExchangeChannel：

```java
public ResponseFuture request(Object request, int timeout) throws RemotingException {
    if (closed) {
        throw new RemotingException(this.getLocalAddress(), null, "Failed to send request " + request + ", cause: The channel " + this + " is closed!");
    }
    // create request.
    Request req = new Request();
    req.setVersion("2.0.0");
    req.setTwoWay(true);
    req.setData(request);
    DefaultFuture future = new DefaultFuture(channel, req, timeout);
    try {
        channel.send(req);
    } catch (RemotingException e) {
        future.cancel();
        throw e;
    }
    return future;
}
```

实际上这里返回的是DefaultFuture。而从doInvoke函数中， return (Result) currentClient.request(inv, timeout).get(); 返回的是一个Result的子对象。而我们返回到客户端的调用InvokerInvocationHandler：

```java
public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    String methodName = method.getName();
    Class<?>[] parameterTypes = method.getParameterTypes();
    if (method.getDeclaringClass() == Object.class) {
        return method.invoke(invoker, args);
    }
    if ("toString".equals(methodName) && parameterTypes.length == 0) {
        return invoker.toString();
    }
    if ("hashCode".equals(methodName) && parameterTypes.length == 0) {
        return invoker.hashCode();
    }
    if ("equals".equals(methodName) && parameterTypes.length == 1) {
        return invoker.equals(args[0]);
    }
    return invoker.invoke(new RpcInvocation(method, args)).recreate();
}
```

此时会发现最后结果是从Result的recreate()函数返回而来，实际上这是一个RpcResult。此时我们可以猜测服务器端返回给客户端的是一个Response对象，同时其中的mResult（private Object mResult）是一个实现了Result接口的对象，我搜索了一下代码，目前只有RpcResult对象实现了Result接口，因此可以肯定的是服务器端返回给客户端的是一个RpcResult对象。

Invoker屏蔽了通信相关的细节，此时需要注意的是默认使用的网络实现是Netty。
