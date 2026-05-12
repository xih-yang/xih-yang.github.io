# 22、Dubbo 源码解析 - consumer 发送与接收原理
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/22.html
- 分类：J2EE框架
- 分组：Dubbo 网络通信架构解剖
在前面的文章中,我们分析了 dubbo 从 `provider` 进行服务暴露,然后把服务信息注册到注册中心上面解耦 `consumer` 与 `provider` 的调用。`consumer` 通过 `javassist` 创建代理对象引用远程服务。当通过代理对象调用远程服务的时候，讲到进行真正调用的时候 dubbo 抽象出集群容错(**Cluster**、**Directory**、**Router**、**LoadBalance**)从服务多个暴露方选取出一个合适的 Invoke 来进行调用。 dubbo 默认是通过 `FailoverClusterInvoker` 从多个 Invoke 中选择出一个 Invoke 实例 `InvokerWrapper` 来进行远程调用。本次分析主要包括以下 4 个部分：

- consumer 发送扩展
- consumer 发送原理
- consumer 接收原理
- dubbo 异步变同步

#### 1、consumer 发送扩展

我们先来看一下 dubbo 中 consumer 端的请求发送原理，也就是从 **InvokerWrapper#invoke** 开始,在 consumer 服务引用分析的时候,我们知道根据 Invoke 调用的时候, dubbo 会创建 ProtocolListenerWrapper与 ProtocolFilterWrapper 来用集成框架使用者的扩展包含：InvokerListener 与 Filter。ProtocolListenerWrapper 在对象创建的时候就会调用InvokerListener#referred扩展,所以在远程服务调用的时候最主要的还是 Filter 扩展，下面我们就看一下在远程调用的时候默认包括哪些 Filter 扩展：

- ConsumerContextFilter
- FutureFilter
- MonitorFilter

##### 1.1 ConsumerContextFilter

`ConsumerContextFilter` 保存客户端信息到 `RpcContext`。

```java
@Activate(group = Constants.CONSUMER, order = -10000)
public class ConsumerContextFilter implements Filter {
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
        RpcContext.getContext()
                .setInvoker(invoker)
                .setInvocation(invocation)
                .setLocalAddress(NetUtils.getLocalHost(), 0)
                .setRemoteAddress(invoker.getUrl().getHost(),
                        invoker.getUrl().getPort());
        if (invocation instanceof RpcInvocation) {
            ((RpcInvocation) invocation).setInvoker(invoker);
        }
        try {
            return invoker.invoke(invocation);
        } finally {
            RpcContext.getContext().clearAttachments();
        }
    }
}
```

`RpcContext` 使用 `ThreadLocal` 来记录一个临时状态。当接收到 `RPC` 请求，或发起 `RPC`请求时，`RpcContext` 的状态都会变化。

> 比如：A 调 B，B 再调 C，则 B 机器上，在 B 调 C 之前，RpcContext 记录的是 A 调 B 的信息，在 B 调 C 之后，RpcContext 记录的是 B 调 C 的信息。

可以通过 `RpcContext` 上的 `setAttachment` 和 `getAttachment` 在服务消费方和提供方之间进行参数的隐式传递。

##### 1.2 FutureFilter

`FutureFilter` 会来处理 dubbo 服务接口调用方配置 `async="true"` 来使用同步调用来是异步调用。

```java
public class FutureFilter implements Filter {
    protected static final Logger logger = LoggerFactory.getLogger(FutureFilter.class);
    public Result invoke(final Invoker<?> invoker, final Invocation invocation) throws RpcException {
        final boolean isAsync = RpcUtils.isAsync(invoker.getUrl(), invocation);
        fireInvokeCallback(invoker, invocation);
        //需要在调用前配置好是否有返回值，已供invoker判断是否需要返回future.
        Result result = invoker.invoke(invocation);
        if (isAsync) {
            asyncCallback(invoker, invocation);
        } else {
            syncCallback(invoker, invocation, result);
        }
        return result;
    }
}
```

同步调用 dubbo 就会同步的返回 `provider` 方法调用返回的响应.如果是异步调用在进行调用的时候就会把请求信息发送到 `provider` 然后返回一个空的 `RpcResult`。`consumer` 端如果要获取响应需要通过以下方法获取:

```java
// 拿到调用的Future引用，当结果返回后，会被通知和设置到此Future
Future<Bar> barFuture = RpcContext.getContext().getFuture(); 
// 同理等待bar返回
Bar bar = barFuture.get(); 
```

##### 1.3 MonitorFilter

`MonitorFilter` 其实是在分析之前 `dubbo monitor` 的时候就进行了详细的分析。它主要是通过以下配置来激活 `provider` 与 `consumer` 端的指标监控。

```java
<dubbo:monitor protocol="registry" />
```

我们还是简单的来看一下它的源码：

```java
public class MonitorFilter implements Filter {
    private MonitorFactory monitorFactory;
    public void setMonitorFactory(MonitorFactory monitorFactory) {
        this.monitorFactory = monitorFactory;
    }
    // 调用过程拦截
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
        if (invoker.getUrl().hasParameter(Constants.MONITOR_KEY)) {
            RpcContext context = RpcContext.getContext(); // 提供方必须在invoke()之前获取context信息
            String remoteHost = context.getRemoteHost();
            long start = System.currentTimeMillis(); // 记录起始时间戮
            getConcurrent(invoker, invocation).incrementAndGet(); // 并发计数
            try {
                Result result = invoker.invoke(invocation); // 让调用链往下执行
                collect(invoker, invocation, result, remoteHost, start, false);
                return result;
            } catch (RpcException e) {
                collect(invoker, invocation, null, remoteHost, start, true);
                throw e;
            } finally {
                getConcurrent(invoker, invocation).decrementAndGet(); // 并发计数
            }
        } else {
            return invoker.invoke(invocation);
        }
    }
}
```

当启动 dubbo monitor 的时候会暴露一个远程服务 MonitorService 接口服务服务,具体的处理类是 SimpleMonitorService。而在 MonitorFilter#collect 方法里面 MonitorFactory 会创建一个 Monitor 接口实例(继承于 MonitorService)。其实就是 DubboMonitorFactroy#createMonitor 远程引用 dubbo monitor 暴露的 MonitorService 服务。

```java
public class DubboMonitorFactroy extends AbstractMonitorFactory {
    private Protocol protocol;
    private ProxyFactory proxyFactory;
    public void setProtocol(Protocol protocol) {
        this.protocol = protocol;
    }
    public void setProxyFactory(ProxyFactory proxyFactory) {
        this.proxyFactory = proxyFactory;
    }
    @Override
    protected Monitor createMonitor(URL url) {
        url = url.setProtocol(url.getParameter(Constants.PROTOCOL_KEY, "dubbo"));
        if (url.getPath() == null || url.getPath().length() == 0) {
            url = url.setPath(MonitorService.class.getName());
        }
        String filter = url.getParameter(Constants.REFERENCE_FILTER_KEY);
        if (filter == null || filter.length() == 0) {
            filter = "";
        } else {
            filter = filter + ",";
        }
        url = url.addParameters(Constants.CLUSTER_KEY, "failsafe", Constants.CHECK_KEY, String.valueOf(false),
                Constants.REFERENCE_FILTER_KEY, filter + "-monitor");
        Invoker<MonitorService> monitorInvoker = protocol.refer(MonitorService.class, url);
        MonitorService monitorService = proxyFactory.getProxy(monitorInvoker);
        return new DubboMonitor(monitorInvoker, monitorService);
    }
}
```

获取到远程服务 SimpleMonitorService，最后在 MonitorFilter#collect 调用 MonitorService#collect 进行监控数据采集提供给 dubbo monitor。调用过程如下所示：

#### 2、consumer 发送原理

最终 consumer 会到 DubboInvoke 进行服务调用。它会在 AbstractInvoker#invoke 添加一些扩展参数到 RpcInvocation 这个远程调用对象里面。添加的扩展参数包含：

- interface ： 远程调用的接口名称
- group ： 接口分组名称
- token ： 调用的 token 信息
- timeout ： 调用服务的超时时间
- async ： 是否异步调用
- id ： 异步操作默认添加 invocation id，用于保证操作幂等

以及 RpcContext 传递过来的扩展参数(RpcContext#attachments)。然后在 DubboInvoker#doInvoke 中会添加 path (接口全类名) 以及 version(版本信息)。再根据 dubbo 的调用模式进行远程调用，包含以下三种调用模式：

- oneway 模式：``标签的 return 属性配置为false，则是oneway模式，利用ExchangeClient 对象向服务端发送请求消息之后，立即返回空 RpcResult 对象
- 异步模式：``标签的 async 属性配置为 ture，则是异步模式，直接返回空 RpcResult对象，由 FutureFilter 和 DefaultFuture 完成异步处理工作
- 同步模式：默认即是同步，则发送请求之后线程进入等待状态，直到收到服务端的响应消息或者超时。

下面我们看一下 dubbo 同步调用时序图：

```java
ChannelFuture future = channel.write(message);
```

最终是调用 `org.jboss.netty.channel.Channel` 通过 socket 发送消息到从集群中选择出的一个暴露服务信息的服务器发送网络数据。

#### 3、consumer 接收原理

我们都知道 dubbo 其实是通过 `netty` 来进行 socket 通信的。而在使用 `netty` 进行网络编程的时候，其实核心就是就是实现 `ChannelHandler`。而在 dubbo 中对应的实现类就是 `NettyHandler`(高版本支持支持 `netty 4` 使用的是 `NettyClientHandler` ，NettyHandler 使用的是 `netty 3.x`)。如果在 `consumer` 端(`provider` 也支持)需要使用 `netty 4` 进行业务处理，需要进行进行以下配置：

```java
<dubbo:consumer client="netty4" />
```

所以 consumer 接收 provider 响应的入口就在 NettyClientHandler#channelRead：

首先`ChannelHandler` 用于接收 `provider` 端响应回来的请求，然后经过 3 个 dubbo 自定义的 `ChannelHandler`。

- MultiMessageHandler：支持 MultiMessage 消息处理，也就是多条消息处理。
- HeartbeatHandler：netty 心条检测。如果心跳请求，发送心跳然后直接 return，如果是心跳响应直接 return。
- DecodeHandler：解码 message，解析成 dubbo 中的 Response 对象
- HeaderExchangeHandler：处理解析后的 provider 端返回的 Response 响应信息，把响应结果赋值到 DefaultFuture 响应获取阻塞对象中。

##### 4、dubbo 异步变同步

我们都知道 dubbo 是基于 `netty NIO` 的非阻塞 并行调用通信。所以 dubbo 在 `consumer` 请求 `provider` 后响应都是异步的。但是在 dubbo 里面默认是同步返回的，那么 dubbo 是如何把异步响应变成同步请求的呢？带着这个问题，首先我们来看一下 dubbo 里面的几种请求方式。

##### 4.1 异步且无返回值

这种请求最简单，`consumer` 把请求信息发送给 `provider` 就行了。只是需要在 `consumer` 端把请求方式配置成异步请求就好了。如下：

```java
<dubbo:method name="sayHello" return="false"></dubbo:method>
```

##### 4.2 异步且有返回值

这种情况下 consumer 首先把请求信息发送给 provider 。这个时候在 consumer 端不仅把请求方式配置成异步，并且需要 RpcContext 这个 ThreadLocal 对象获取到 Future 对象，然后通过 Future#get() 阻塞式获取到 provider 的响应。那么这个 Future 是如果添加到 RpcContext 中呢？

在第二小节讲服务发送的时候， 在 `DubboInvoke` 里面有三种调用方式，之前只具体请求了同步请求的发送方式而且没有异步请求的发送。异步请求发送代码如下：

> DubboInvoker#doInvoke 中的 else if (isAsync) 分支

```java
    ResponseFuture future = currentClient.request(inv, timeout);
    FutureAdapter<T> futureAdapter = new FutureAdapter<>(future);
    RpcContext.getContext().setFuture(futureAdapter);
    Result result;
    if (RpcUtils.isAsyncFuture(getUrl(), inv)) {
        result = new AsyncRpcResult<>(futureAdapter);
    } else {
        result = new RpcResult();
    }
    return result;
```

上面的代码逻辑是直接发送请求到 provider 返回一个 ResponseFuture 实例，然后把这个 Future 对象保存到 RpcContext#LOCAL 这个 ThreadLocal 当前线程对象当中，并且返回一个空的 RpcResult对象。如果要获取到 provider 响应的信息，需要进行以下操作：

```java
// 拿到调用的Future引用，当结果返回后，会被通知和设置到此Future
Future<String> temp= RpcContext.getContext().getFuture();
// 同理等待bar返回
hello=temp.get();
```

##### 4.3 异步变同步(默认)

下面我们就来讨论一下 dubbo 是如何把异步请求转化成同步请求的。其实原理和异步请求的通过 Future#get 等待 provider 响应返回一样，只不过异步有返回值是显示调用而默认是 dubbo 内部把这步完成了。下面我们就来分析一下 dubbo 是如何把 netty 的异步响应变成同步返回的。(**当前线程怎么让它 “暂停”，等结果回来后，再执行？**)

我们都知道在 consumer 发送请求的时候会调用 HeaderExchangeChannel#request 方法：

> HeaderExchangeChannel#request

```java
    public ResponseFuture request(Object request, int timeout) throws RemotingException {
        if (closed) {
            throw new RemotingException(this.getLocalAddress(), null, "Failed to send request " + request + ", cause: The channel " + this + " is closed!");
        }
        // create request.
        Request req = new Request();
        req.setVersion(Version.getProtocolVersion());
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

它首先会通过 dubbo 自定义的 `Channel`、`Request` 与 `timeout(int)` 构造一个 `DefaultFuture` 对象。然后再通过 `NettyChannel` 发送请求到 `provider`，最后返回这个 `DefaultFuture`。下面我们来看一下通过构造方法是如何创建 `DefaultFuture` 的。我只把主要涉及到的属性展示出来：

```java
public class DefaultFuture implements ResponseFuture {
    private static final Map<Long, Channel> CHANNELS = new ConcurrentHashMap<Long, Channel>();
    private static final Map<Long, DefaultFuture> FUTURES = new ConcurrentHashMap<Long, DefaultFuture>();
    private final long id;
    private final Channel channel;
    private final Request request;
    private final int timeout;
    public DefaultFuture(Channel channel, Request request, int timeout) {
        this.channel = channel;
        this.request = request;
        this.id = request.getId();
        this.timeout = timeout > 0 ? timeout : channel.getUrl().getPositiveParameter(Constants.TIMEOUT_KEY, Constants.DEFAULT_TIMEOUT);
        // put into waiting map.
        FUTURES.put(id, this);
        CHANNELS.put(id, channel);
    }
}
```

这个 id 是在创建 Request 的时候使用 AtomicLong#getAndIncrement 生成的。从 1 开始并且如果它一直增加直到生成负数也能保证这台机器这个值是唯一的，且不冲突的。符合唯一主键原则。 dubbo 默认同步变异步其实和异步调用一样，也是在 DubboInvoker#doInvoke 实现的。

> DubboInvoker#doInvoke

```java
    RpcContext.getContext().setFuture(null);
    return (Result) currentClient.request(inv, timeout).get();
```

关键就在 ResponseFuture#get 方法上面，下面我们来看一下这个方法的源码：

```java
    public Object get(int timeout) throws RemotingException {
        if (timeout <= 0) {
            timeout = Constants.DEFAULT_TIMEOUT;
        }
        if (!isDone()) {
            long start = System.currentTimeMillis();
            lock.lock();
            try {
                while (!isDone()) {
                    done.await(timeout, TimeUnit.MILLISECONDS);
                    if (isDone() || System.currentTimeMillis() - start > timeout) {
                        break;
                    }
                }
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } finally {
                lock.unlock();
            }
            if (!isDone()) {
                throw new TimeoutException(sent > 0, channel, getTimeoutMessage(false));
            }
        }
        return returnFromResponse();
    }
```

其实就是 while 循环，利用 java 的 lock 机制判断如果在超时时间范围内 DefaultFuture#response 如果赋值成不为空就返回响应，否则抛出 TimeoutException 异常。下面我们就来看一下 DefaultFuture#response 是如何被赋值的。

还记得 consumer 接收 provider 响应的最后一步吗？就是 DefaultFuture#received，在 provider 端会带回 consumer 请求的 id。我们来看一下它的具体处理逻辑：

```java
    public static void received(Channel channel, Response response) {
        try {
            DefaultFuture future = FUTURES.remove(response.getId());
            if (future != null) {
                future.doReceived(response);
            } else {
                logger.warn("The timeout response finally returned at "
                        + (new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS").format(new Date()))
                        + ", response " + response
                        + (channel == null ? "" : ", channel: " + channel.getLocalAddress()
                        + " -> " + channel.getRemoteAddress()));
            }
        } finally {
            CHANNELS.remove(response.getId());
        }
    }
```

它会从最开始通过构造函数传进去的 DefaultFuture#FUTURES 根据请求的 id 拿到 DefaultFuture ，然后根据这个 DefaultFuture 调用 DefaultFuture#doReceived 方法。通过 Java 里面的 lock 机制把 provider 的值赋值给 DefaultFuture#response。此时 consumer 也正在调用 DefaultFuture#get 方法进行阻塞，当这个 DefaultFuture#response 被赋值后，它的值就不为空。阻塞操作完成，且根据请求号的 id 把 consumer 端的 Request 以及 Provider 端返回的 Response 关联了起来。

这个就是 Dubbo 异步转同步的原理，是不是很巧妙，很简单。 😃

参考资料：

- http://dubbo.apache.org/books/dubbo-user-book/demos/async-call.html
- http://dubbo.apache.org/books/dubbo-user-book/demos/attachment.html
- https://blog.csdn.net/meilong_whpu/article/details/72178447
- http://dubbo.apache.org/books/dubbo-user-book/demos/netty4.html
