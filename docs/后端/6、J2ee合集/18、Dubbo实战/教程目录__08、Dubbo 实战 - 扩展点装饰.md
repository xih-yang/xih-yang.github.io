# 08、Dubbo 实战 - 扩展点装饰
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/8.html
- 分类：J2EE框架
- 分组：教程目录
### Filter

Filter是Dubbo里面非常重要的模块，Dubbo里面日志记录、超时等功能都是在这一部分实现。

如上一节在介绍扩展点加载时所述，在生成Protocol的invoker时，实际上使用了装饰模式，第一个是filter，第二个是listener。

我们先来看filter，具体ProtocolFilterWrapper类：

```java
/**
 * ListenerProtocol
 */
public class ProtocolFilterWrapper implements Protocol {
    private final Protocol protocol;
    public ProtocolFilterWrapper(Protocol protocol) {
        if (protocol == null) {
            throw new IllegalArgumentException("protocol == null");
        }
        this.protocol = protocol;
    }
    private static <T> Invoker<T> buildInvokerChain(final Invoker<T> invoker, String key, String group) {
        Invoker<T> last = invoker;
        List<Filter> filters = ExtensionLoader.getExtensionLoader(Filter.class).getActivateExtension(invoker.getUrl(), key, group);
        if (!filters.isEmpty()) {
            for (int i = filters.size() - 1; i >= 0; i--) {
                final Filter filter = filters.get(i);
                final Invoker<T> next = last;
                last = new Invoker<T>() {
                    public Class<T> getInterface() {
                        return invoker.getInterface();
                    }
                    public URL getUrl() {
                        return invoker.getUrl();
                    }
                    public boolean isAvailable() {
                        return invoker.isAvailable();
                    }
                    public Result invoke(Invocation invocation) throws RpcException {
                        return filter.invoke(next, invocation);
                    }
                    public void destroy() {
                        invoker.destroy();
                    }
                    @Override
                    public String toString() {
                        return invoker.toString();
                    }
                };
            }
        }
        return last;
    }
    public int getDefaultPort() {
        return protocol.getDefaultPort();
    }
    public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
        if (Constants.REGISTRY_PROTOCOL.equals(invoker.getUrl().getProtocol())) {
            return protocol.export(invoker);
        }
        return protocol.export(buildInvokerChain(invoker, Constants.SERVICE_FILTER_KEY, Constants.PROVIDER));
    }
    public <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException {
        if (Constants.REGISTRY_PROTOCOL.equals(url.getProtocol())) {
            return protocol.refer(type, url);
        }
        return buildInvokerChain(protocol.refer(type, url), Constants.REFERENCE_FILTER_KEY, Constants.CONSUMER);
    }
    public void destroy() {
        protocol.destroy();
    }
}
```

这个类有3个特点，第一它有一个参数为Protocol protocol的构造函数；第二，它实现了Protocol接口；第三，它使用职责链模式，对export和refer函数进行了封装。

对于函数封装，有点类似于tomcat的filter机制；我们来看buildInvokerChain函数：它读取所有的filter类，利用这些类封装invoker。

```java
List<Filter> filters = ExtensionLoader.getExtensionLoader(Filter.class).getActivateExtension(invoker.getUrl(), key, group);
```

我们看文件：META-INF/dubbo/internal/com.alibaba.dubbo.rpc.Filter

```java
cache=com.alibaba.dubbo.cache.filter.CacheFilter
validation=com.alibaba.dubbo.validation.filter.ValidationFilter
echo=com.alibaba.dubbo.rpc.filter.EchoFilter
generic=com.alibaba.dubbo.rpc.filter.GenericFilter
genericimpl=com.alibaba.dubbo.rpc.filter.GenericImplFilter
token=com.alibaba.dubbo.rpc.filter.TokenFilter
accesslog=com.alibaba.dubbo.rpc.filter.AccessLogFilter
activelimit=com.alibaba.dubbo.rpc.filter.ActiveLimitFilter
classloader=com.alibaba.dubbo.rpc.filter.ClassLoaderFilter
context=com.alibaba.dubbo.rpc.filter.ContextFilter
consumercontext=com.alibaba.dubbo.rpc.filter.ConsumerContextFilter
exception=com.alibaba.dubbo.rpc.filter.ExceptionFilter
executelimit=com.alibaba.dubbo.rpc.filter.ExecuteLimitFilter
deprecated=com.alibaba.dubbo.rpc.filter.DeprecatedFilter
compatible=com.alibaba.dubbo.rpc.filter.CompatibleFilter
timeout=com.alibaba.dubbo.rpc.filter.TimeoutFilter
trace=com.alibaba.dubbo.rpc.protocol.dubbo.filter.TraceFilter
future=com.alibaba.dubbo.rpc.protocol.dubbo.filter.FutureFilter
monitor=com.alibaba.dubbo.monitor.support.MonitorFilter
```

这其中涉及到很多功能，包括权限验证、异常、超时等等，当然可以预计计算调用时间等等应该也是在这其中的某个类实现的。

这里我们可以看到export和refer过程都会被filter过滤，那么如果记录接口调用时间时，服务器端部分只是记录接口在服务器端的执行时间，而客户端部分会记录接口在服务器端的执行时间+网络传输时间。

### Listener

看到对应的类为：ProtocolListenerWrapper

```java
/**
 * ListenerProtocol
 */
public class ProtocolListenerWrapper implements Protocol {
    private final Protocol protocol;
    public ProtocolListenerWrapper(Protocol protocol) {
        if (protocol == null) {
            throw new IllegalArgumentException("protocol == null");
        }
        this.protocol = protocol;
    }
    public int getDefaultPort() {
        return protocol.getDefaultPort();
    }
    public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
        if (Constants.REGISTRY_PROTOCOL.equals(invoker.getUrl().getProtocol())) {
            return protocol.export(invoker);
        }
        return new ListenerExporterWrapper<T>(protocol.export(invoker),
                Collections.unmodifiableList(ExtensionLoader.getExtensionLoader(ExporterListener.class)
                        .getActivateExtension(invoker.getUrl(), Constants.EXPORTER_LISTENER_KEY)));
    }
    public <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException {
        if (Constants.REGISTRY_PROTOCOL.equals(url.getProtocol())) {
            return protocol.refer(type, url);
        }
        return new ListenerInvokerWrapper<T>(protocol.refer(type, url),
                Collections.unmodifiableList(
                        ExtensionLoader.getExtensionLoader(InvokerListener.class)
                                .getActivateExtension(url, Constants.INVOKER_LISTENER_KEY)));
    }
    public void destroy() {
        protocol.destroy();
    }
}
```

我们可以看到export和refer分别对应了不同的Wrapper； 经过debug，发现ExporterListener并没有实现类，同时通过debug也会发现ListenerExporterWrapper在执行过程中确实listeners变量是空的； 而对于ListenerInvokerWrapper，我们发现在文件META-INF/dubbo/internal/com.alibaba.dubbo.rpc.InvokerListener中：

```java
deprecated=com.alibaba.dubbo.rpc.listener.DeprecatedInvokerListener
```

而对于DeprecatedInvokerListener实际上只是实现了

```java
/**
 * DeprecatedProtocolFilter
 */
@Activate(Constants.DEPRECATED_KEY)
public class DeprecatedInvokerListener extends InvokerListenerAdapter {
    private static final Logger LOGGER = LoggerFactory.getLogger(DeprecatedInvokerListener.class);
    public void referred(Invoker<?> invoker) throws RpcException {
        if (invoker.getUrl().getParameter(Constants.DEPRECATED_KEY, false)) {
            LOGGER.error("The service " + invoker.getInterface().getName() + " is DEPRECATED! Declare from " + invoker.getUrl());
        }
    }
}
```
