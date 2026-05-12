# 12、Dubbo 源码解析 - Listener &amp; Filter
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/12.html
- 分类：J2EE框架
- 分组：Dubbo 服务引用原理解剖
Dubbo 是阿里巴巴开源的一个高性能优秀的服务框架，使得应用可通过高性能的 RPC 实现服务的输入与输出功能。作为一个优秀的框架，至少应该包含以下几个特点：

- 完善的文档
- 活跃的社区
- 良好的扩展性

今天主要讨论的主题就是 dubbo 中良好的扩展性。 dubbo 的扩展点加载是从 JDK 标准的 SPI (Service Provider Interface) 扩展点发现加强而来。

- JDK 标准的 SPI 会一次性实例化扩展点所有实现，如果有扩展实现初始化很耗时，但如果没用上也加载，会很浪费资源。
- 如果扩展点加载失败，连扩展点的名称都拿不到了。比如：JDK 标准的 ScriptEngine，通过 getName() 获取脚本类型的名称，但如果 RubyScriptEngine 因为所依赖的 jruby.jar 不存在，导致 RubyScriptEngine 类加载失败，这个失败原因被吃掉了，和 ruby 对应不起来，当用户执行 ruby 脚本时，会报不支持 ruby，而不是真正失败的原因。
- 增加了对扩展点 IoC 和 AOP 的支持，一个扩展点可以直接 setter 注入其它扩展点。

我们知道 dubbo 最核心的三个概念分别是：Provider(服务提供者)、Consumer(服务消费者)与 Registry(注册中心)，通过注册中心解耦了服务方与消费方的调用关系。在服务发布与服务引用的时候 dubbo 分别提供了 ExporterListener 与 InvokerListener 对于服务进行不同的扩展。

dubbo 在进行服务调用的过程中最核心的概念就是 Invoke，就相当于 Spring 里面的 bean 一样。对于 Invoke 这个核心模型 dubbo 也有 Filter 对其进行扩展。在这里大家有没有联想到 Servlet 里面的 Listener 与 Filter，可以看到优秀的框架里面有很多思想都是相通的。

#### 1、dubbo 的领域模型

在dubbo 中主要包含以下三个核心领域模型：

- Protocol 是服务域，它是 Invoker 暴露和引用的主功能入口，它负责 Invoker 的生命周期管理。
- Invoker 是实体域，它是 Dubbo 的核心模型，其它模型都向它靠扰，或转换成它，它代表一个可执行体，可向它发起 invoke 调用，它有可能是一个本地的实现，也可能是一个远程的实现，也可能一个集群实现。
- Invocation 是会话域，它持有调用过程中的变量，比如方法名，参数等。

dubbo 通过 Protocol 服务暴露 Invoke 这个服务调用的执行体，然后通过 Protocol 引用 Invoke 调用 Invocation 提供调用过程中的变量就可以完成一次服务的发布与调用过程。

#### 2、dubbo 扩展之 Listener

dubbo 的服务发布与引用都提供了Listener 分别是 ExporterListener(服务暴露监听) 与 InvokerListener(服务调用监听)。

##### 2.1 ExporterListener

ExporterListener 是 dubbo 通过 Protocol 进行服务暴露的时候调用的扩展点，也就是 Protocol 在进行 export() 方法的时候对服务暴露的一个扩展点。最终是在 ProtocolListenerWrapper#export 方法中通过 dubbo 的 SPI 机制加载进去，然后包装成一个 ListenerExporterWrapper 对象。

```java
    public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
        if (Constants.REGISTRY_PROTOCOL.equals(invoker.getUrl().getProtocol())) {
            return protocol.export(invoker);
        }
        return new ListenerExporterWrapper<T>(protocol.export(invoker),
                Collections.unmodifiableList(ExtensionLoader.getExtensionLoader(ExporterListener.class)
                        .getActivateExtension(invoker.getUrl(), Constants.EXPORTER_LISTENER_KEY)));
    }
```

ExporterListener 接口的定义如下：

```java
public interface ExporterListener {
    void exported(Exporter<?> exporter) throws RpcException;
    void unexported(Exporter<?> exporter);
}
```

- exported() ：在 ListenerExporterWrapper 对象进行初始化的时候就会进行调用
- unexported() ：Exporter#unexport 的时候就会进行调用

##### 2.1 InvokerListener

InvokerListener是 dubbo 通过 Protocol 进行服务引用的时候调用的扩展点，也就是 Protocol 在进行 refer() 方法的时候对服务暴露的一个扩展点。最终是在 ProtocolListenerWrapper#export 方法中通过 dubbo 的 SPI 机制加载进去，然后包装成一个 ListenerInvokerWrapper 对象。

```java
    public <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException {
        if (Constants.REGISTRY_PROTOCOL.equals(url.getProtocol())) {
            return protocol.refer(type, url);
        }
        return new ListenerInvokerWrapper<T>(protocol.refer(type, url),
                Collections.unmodifiableList(
                        ExtensionLoader.getExtensionLoader(InvokerListener.class)
                                .getActivateExtension(url, Constants.INVOKER_LISTENER_KEY)));
    }
```

InvokerListener 接口的定义如下：

```java
public interface InvokerListener {
    void referred(Invoker<?> invoker) throws RpcException;
    void destroyed(Invoker<?> invoker);
}
```

- referred() ：在 ListenerInvokerWrapper 对象进行初始化的时候就会进行调用
- destroyed() ：Invoker#destroyed 的时候就会进行调用

#### 3、dubbo 扩展之 Filter

Filter 是 dubbo 对于服务调用 (Invoker) 的进行拦截。dubbo 中 Invoke 是服务暴露方与服务引用方共用的一个核心概念，所以对于 Filter 对于这两都都会进行拦截。分别通过 ProtocolFilterWrapper#export 与 ProtocolFilterWrapper#refer 构建 Filter 对服务暴露方与服务引用方的 Invoke 进行拦截。

**1) 服务暴露方**

```java
    public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
        if (Constants.REGISTRY_PROTOCOL.equals(invoker.getUrl().getProtocol())) {
            return protocol.export(invoker);
        }
        return protocol.export(buildInvokerChain(invoker, Constants.SERVICE_FILTER_KEY, Constants.PROVIDER));
    }
```

**2) 服务引用方**

```java
    public <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException {
        if (Constants.REGISTRY_PROTOCOL.equals(url.getProtocol())) {
            return protocol.refer(type, url);
        }
        return buildInvokerChain(protocol.refer(type, url), Constants.REFERENCE_FILTER_KEY, Constants.CONSUMER);
    }
```

服务暴露方与引用方它们都是构建成一个或者多个 Filter 拦截链。然后反向遍历 Filter 对 Invoke 调用来进行增强。

```java
    private static <T> Invoker<T> buildInvokerChain(final Invoker<T> invoker, String key, String group) {
        Invoker<T> last = invoker;
        List<Filter> filters = ExtensionLoader.getExtensionLoader(Filter.class).getActivateExtension(invoker.getUrl(), key, group);
        if (filters.size() > 0) {
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
```

#### 4、扩展点自动激活

对于Filter, InvokerListener, ExportListener 这些扩展点，可以用 @Activate 来自动激活。

```java
@Activate // 无条件自动激活
public class XxxFilter implements Filter {
    // ...
}
```

或者：

```java
@Activate("xxx") // 当配置了xxx参数，并且参数为有效值时激活，比如配了cache="lru"，自动激活CacheFilter。
public class XxxFilter implements Filter {
    // ...
}
```

或者：

```java
@Activate(group = "provider", value = "xxx") // 只对提供方激活，group可选"provider"或"consumer"
public class XxxFil![这里写图片描述](https://img-blog.csdn.net/201804132214529?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3UwMTI0MTA3MzM=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)ter implements Filter {
    // ...
}
```

在项目中 ，放置扩展点配置文件 `META-INF/dubbo/接口全限定名`，内容为：`配置名=扩展实现类全限定名`，多个实现类用换行符分隔。然后在项目启动的时候 dubbo 就会扫描所有的 jar 包内的同名文件，然后进行合并。

#### 5、扩展点应用

dubbo 里面的 Listener 与 Filter 扩展点，应用最广的还是 Filter。在 dubbo 的内部也大量的使用了 Filter 进行扩展。

同时我们可以使用使用自定义的 Filter 进行自定义的扩展，举一个最简单的例子就是日志根据。基于 dubbo 进行服务间的调用，一般都会涉及到很多个系统之间的调用。这里就可以使用 Filter 对于服务间的调用进行过滤。

> 1、日志

```java
public class TradeIdFilter implements Filter {
    @Override
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
        Result result = null;
        String role = invoker.getUrl().getParameter(Constants.SIDE_KEY);
        if (Constants.CONSUMER.equals(role)) {// consumer
            String tradeId = UUID.randomUUID().toString();
            RpcContext.getContext().setAttachment("tradeId", tradeId);
            MDC.put("tradeId", tradeId);
        } else if (Constants.PROVIDER.equals(role)) {// provider
            String tradeId = RpcContext.getContext().getAttachment("tradeId");
            MDC.put("tradeId", tradeId);
        }
        try {
            result = invoker.invoke(invocation);
        } catch (Exception e) {
            throw new RpcException(e);
        } finally {
            MDC.clear();
        }
        return result;
    }
}
```

> 2、黑白名单

```java
public class AuthorityFilter implements Filter {  
    private static final Logger LOGGER = LoggerFactory.getLogger(AuthorityFilter.class);  
    private IpWhiteList ipWhiteList;  
    //dubbo通过setter方式自动注入  
    public void setIpWhiteList(IpWhiteList ipWhiteList) {  
        this.ipWhiteList = ipWhiteList;  
    }  
    @Override  
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {  
        if (!ipWhiteList.isEnabled()) {  
            LOGGER.debug("白名单禁用");  
            return invoker.invoke(invocation);  
        }  
        String clientIp = RpcContext.getContext().getRemoteHost();  
        LOGGER.debug("访问ip为{}", clientIp);  
        List<String> allowedIps = ipWhiteList.getAllowedIps();  
        if (allowedIps.contains(clientIp)) {  
            return invoker.invoke(invocation);  
        } else {  
            return new RpcResult();  
        }  
    }  
}  
```
