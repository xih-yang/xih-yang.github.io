# 14、Dubbo 3.x 源码解析 - Dubbo服务发布导出源码(3)
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/14.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo服务的发布与引用的源码。

此前我们学习了[Dubbo服务发布导出源码(2)](/zhuanlan/j2ee/dubbo/2/13.html)，也就是**Dubbo服务导出的核心方法doExportUrls的源码**，现在我们继续学习，**服务导出的核心方法doExportUrl的源码**。

## 1 doExportUrl导出服务url

无论是本地导出、远程导出还是直连导出，最终都是调用doExportUrl方法根据不同的协议向不同的注册中心进行服务导出的，调用该方法时参数中的url，可能是基于injvm协议的服务url（本地导出），也可能是追加了export:url属性的注册中心url（远程导出），还可能是原始的服务url（直连导出）。

该方法的大概步骤为：

**1、** 首先通过代理服务工厂**proxyFactory**将ref、interfaceClass、url包装成一个**Invoker**可执行体实例；

**2、** 通过协议**protocolSPI**对**invoker**进行服务导出，获取**Exporter**实例，然后将**exporter**加入到**exporters**缓存集合中；

```java
/**
 * ServiceConfig的方法
 * <p>
 * 导出服务url
 *
 * @param url          服务url，可能是基于injvm协议的服务url（本地导出），也可能是追加了export:url属性的注册中心url（远程导出），还可能是原始的服务url（直连导出）
 * @param withMetaData 是否包含元数据，远程导出true，本地导出false
 */
@SuppressWarnings({
     "unchecked", "rawtypes"})
private void doExportUrl(URL url, boolean withMetaData) {
    /*
     * 1 通过代理服务工厂proxyFactory将ref、interfaceClass、url包装成一个Invoker代理对象
     *
     * 这里的proxyFactory是ProxyFactory的自适应扩展实现，即ProxyFactory$Adaptive
     * 也就是说会根据传入的url中的参数proxy的值选择对应的代理工厂实现类，而默认实现就是JavassistProxyFactory
     */
    Invoker<?> invoker = proxyFactory.getInvoker(ref, (Class) interfaceClass, url);
    //是否包含元数据，远程导出、直连导出的方式为true，本地导出为false
    if (withMetaData) {
        //再包装一下，将服务元数据包括进去
        invoker = new DelegateProviderMetaDataInvoker(invoker, this);
    }
    /*
     * 2 通过协议protocolSPI对invoker进行导出
     *
     * 这里的protocolSPI是Protocol的自适应扩展实现，即Protocol$Adaptive
     * 也就是说会根据传入的url中的protocol的值选择对应的Protocol实现类，而默认实现就是dubbo协议，即DubboProtocol
     */
    Exporter<?> exporter = protocolSPI.export(invoker);
    //将exporter加入到exporters缓存集合中
    exporters.add(exporter);
}
```

## 2 getInvoker基于javassist构建Invoker

这里的proxyFactory是ProxyFactory的自适应扩展实现，即ProxyFactory$Adaptive，也就是说会根据传入的url中的参数proxy的值选择对应的代理工厂实现类，而默认实现就是JavassistProxyFactory，即基于javassist创建代理对象。

```java
public org.apache.dubbo.rpc.Invoker getInvoker(java.lang.Object arg0, java.lang.Class arg1, 
org.apache.dubbo.common.URL arg2) throws org.apache.dubbo.rpc.RpcException {
    if (arg2 == null) throw new IllegalArgumentException("url == null");
    org.apache.dubbo.common.URL url = arg2;
    //获取url中的proxy参数，默认javassist
    String extName = url.getParameter("proxy", "javassist");
    if (extName == null)
        throw new IllegalStateException("Failed to get extension (org.apache.dubbo.rpc.ProxyFactory) name from url (" + url.toString() + ") use keys([proxy])");
    ScopeModel scopeModel = ScopeModelUtil.getOrDefault(url.getScopeModel(), org.apache.dubbo.rpc.ProxyFactory.class);
    //基于Dubbo SPi机制查找指定名字的实现，默认JavassistProxyFactory
    org.apache.dubbo.rpc.ProxyFactory extension = (org.apache.dubbo.rpc.ProxyFactory) scopeModel.getExtensionLoader(org.apache.dubbo.rpc.ProxyFactory.class).getExtension(extName);
    //通过ProxyFactory的getInvoker方法获取Invoker实例
    return extension.getInvoker(arg0, arg1, arg2);
}
```

实际上dubbo还提供了基于jdk的动态代理实现JdkProxyFactory，而默认选择JavassistProxyFactory，因为dubbo利用javassist动态创建了Class对应的Wrapper对象，动态生成的Wrapper类改写invokeMethod方法，其内部会被改写为根据接口方法名和参数直接调用ref对应名字的方法，避免通过Jdk的反射调用方法带来的性能问题。

```java
/**
 * JavassistProxyFactory的方法
 * <p>
 * 将ref、interfaceClass、url包装成一个Invoker代理对象
 *
 * @param proxy 被代理的实例
 * @param type  代理接口Class
 * @param url   服务url，可能是基于injvm协议的服务url（本地导出），也可能是追加了export=url参数的注册中心url（远程导出），还可能是原始的服务url（直连导出）
 * @return 一个Invoker可执行体实例
 */
@Override
public <T> Invoker<T> getInvoker(T proxy, Class<T> type, URL url) {
    try {
        // TODO Wrapper cannot handle this scenario correctly: the classname contains '$'
        //基于javassist动态创建了Class对应的Wrapper对象，动态生成的Wrapper类改写invokeMethod方法，其内部会被改写为根据接口方法名和参数直接调用ref对应名字的方法
        //这样后续调用方法时，就可以避免Jdk动态代理中通过反射调用方法带来的性能问题
        final Wrapper wrapper = Wrapper.getWrapper(proxy.getClass().getName().indexOf('$') < 0 ? proxy.getClass() : type);
        //创建一个AbstractProxyInvoker的匿名实例
        return new AbstractProxyInvoker<T>(proxy, type, url) {
            @Override
            protected Object doInvoke(T proxy, String methodName,
                                      Class<?>[] parameterTypes,
                                      Object[] arguments) throws Throwable {
                //调用wrapper的invokeMethod方法
                return wrapper.invokeMethod(proxy, methodName, parameterTypes, arguments);
            }
        };
    } catch (Throwable fromJavassist) {
        // try fall back to JDK proxy factory
        try {
            Invoker<T> invoker = jdkProxyFactory.getInvoker(proxy, type, url);
            logger.error("Failed to generate invoker by Javassist failed. Fallback to use JDK proxy success. " +
                "Interfaces: " + type, fromJavassist);
            // log out error
            return invoker;
        } catch (Throwable fromJdk) {
            logger.error("Failed to generate invoker by Javassist failed. Fallback to use JDK proxy is also failed. " +
                "Interfaces: " + type + " Javassist Error.", fromJavassist);
            logger.error("Failed to generate invoker by Javassist failed. Fallback to use JDK proxy is also failed. " +
                "Interfaces: " + type + " JDK Error.", fromJdk);
            throw fromJavassist;
        }
    }
}
```

下面看看JdkProxyFactory的实现，可以发现，基于jdk反射创建Invoker的速度更快，因为不需要动态改写字节码并动态创建Wrapper代理对象，但是我们能够发现，在doInvoke方法中，每次调用这个方法的时候，都会反射根据调用的方法名字获取对应的method方法对象，然后反射调用方法，这样的调用方法将会拖慢每一次请求的性能。

**因此Dubbo选择启动时更慢但是运行时更快的JavassistProxyFactory。**

```java
/**
 * JdkProxyFactory的方法
 * <p>
 * 将ref、interfaceClass、url包装成一个Invoker代理对象
 *
 * @param proxy 被代理的实例
 * @param type  代理接口Class
 * @param url   服务url，可能是基于injvm协议的服务url（本地导出），也可能是追加了export=url参数的注册中心url（远程导出），还可能是原始的服务url（直连导出）
 * @return 一个Invoker可执行体实例
 */
@Override
public <T> Invoker<T> getInvoker(T proxy, Class<T> type, URL url) {
    //创建一个AbstractProxyInvoker的匿名实例
    return new AbstractProxyInvoker<T>(proxy, type, url) {
        @Override
        protected Object doInvoke(T proxy, String methodName,
                                  Class<?>[] parameterTypes,
                                  Object[] arguments) throws Throwable {
            //反射根据调用的方法名字获取对应的method方法对象
            Method method = proxy.getClass().getMethod(methodName, parameterTypes);
            //反射调用方法
            return method.invoke(proxy, arguments);
        }
    };
}
```

## 3 export导出服务

在获取到可执行对象**Invoker**之后，将会通过协议**protocolSPI**对**invoker**进行导出。这里的**protocolSPI**是**Protocol**的自适应扩展实现，即**Protocol$Adaptive**。

### 3.1 Protocol$Adaptive自适应实现

**Protocol$Adaptive**会根据传入的url中的protocol选择对应的**Protocol SPI**实现类，而默认实现就是dubbo协议，即**DubboProtocol**。

```java
public org.apache.dubbo.rpc.Exporter export(org.apache.dubbo.rpc.Invoker arg0) throws 
org.apache.dubbo.rpc.RpcException {
    if (arg0 == null) throw new IllegalArgumentException("org.apache.dubbo.rpc.Invoker argument == null");
    if (arg0.getUrl() == null)
        throw new IllegalArgumentException("org.apache.dubbo.rpc.Invoker argument getUrl() == null");
    //获取url的协议，默认dubbo
    org.apache.dubbo.common.URL url = arg0.getUrl();
    String extName = (url.getProtocol() == null ? "dubbo" : url.getProtocol());
    if (extName == null)
        throw new IllegalStateException("Failed to get extension (org.apache.dubbo.rpc.Protocol) name from url (" + url.toString() + ") use keys([protocol])");
    ScopeModel scopeModel = ScopeModelUtil.getOrDefault(url.getScopeModel(), org.apache.dubbo.rpc.Protocol.class);
    //基于Dubbo SPI或者对应的扩展名字的实例，默认DubboProtocol
    org.apache.dubbo.rpc.Protocol extension = (org.apache.dubbo.rpc.Protocol) scopeModel.getExtensionLoader(org.apache.dubbo.rpc.Protocol.class).getExtension(extName);
    //通过对应的实例调用export方法
    return extension.export(arg0);
}
```

**最后调用具体protocol的实现类的export方法导出服务返回Exporter。**

在基于Dubbo SPI查找实现的时候，由于wrapper机制的存在，最终返回的并不一定是原始的实现类，还可能经过了wrapper的层层包装，这里的Protocol就经过了几层的wrapper的包装。

**以InjvmProtocol协议为例，可以看到经过了三层包装，调用时由外向内调用，即ProtocolSerializationWrapper -> ProtocolFilterWrapper -> ProtocolListenerWrapper -> InjvmProtocol（具体的Protocol实现）。实际上Dubbo正是采用warpper机制和装饰设计模式实现类似aop的功能。**

**本地导出的injvm协议对应InjvmProtocol，需要导出到接口级注册中心的registry对应InterfaceCompatibleRegistryProtocol，需要导出到应用级注册中心的service-discovery-registry对应RegistryProtocol。**

**下面我们分别讲解这些wrapper和protocol是如何进行服务导出的！**

### 3.2 ProtocolSerializationWrapper协议序列化包装器

protocol的最外层wrapper，它会将导出的服务url存入**FrameworkServiceRepository**仓库内部的providerUrlsWithoutGroup缓存中，key就是serviceKey并去除了group，value是一个服务url列表。

```java
/**
 * ProtocolSerializationWrapper的方法
 * 
 * @param invoker Service invoker
 */
@Override
public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
    //将导出的服务url存入FrameworkServiceRepository仓库内部的providerUrlsWithoutGroup缓存中，key就是serviceKey并去除了group，value是一个服务url列表
    getFrameworkModel(invoker.getUrl().getScopeModel()).getServiceRepository().registerProviderUrl(invoker.getUrl());
    //调用下层export方法
    return protocol.export(invoker);
}
```

### 3.3 ProtocolFilterWrapper协议过滤器包装器

**这个包装器首先会判断如果是注册中心的协议，例如registry或者service-discovery-registry，那么直接调用下一层export方法。**

否则，获取服务url对应的Filter并且将Invoker构建为一个InvokerChain对象，内部包含了一个Invoker和一条过滤器调用链，随后作为参数调用下一层export方法。

```java
/**
 * ProtocolFilterWrapper的方法
 * @param invoker Service invoker
 */
@Override
public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
    //如果是注册中心的协议，例如registry或者service-discovery-registry，那么直接调用下一层export方法
    if (UrlUtils.isRegistry(invoker.getUrl())) {
        return protocol.export(invoker);
    }
    //获取服务url对应的Filter并且将Invoker构建为一个InvokerChain对象，内部包含了一个Invoker和一条过滤器调用链，随后作为参数调用下一层export方法。
    FilterChainBuilder builder = getFilterChainBuilder(invoker.getUrl());
    return protocol.export(builder.buildInvokerChain(invoker, SERVICE_FILTER_KEY, CommonConstants.PROVIDER));
}
```

目前有11个filter

### 3.4 ProtocolListenerWrapper协议监听器包装器

这个包装器首先会判断如果是注册中心的协议，例如registry或者service-discovery-registry，那么直接调用下一层export方法。

否则，调用下一层export方法，并将返回的Exporter包装为ListenerExporterWrapper，内部包含了一个Exporter和一个监听器列表。

```java
/**
 * ProtocolListenerWrapper的方法
 * @param invoker Service invoker
 */
@Override
public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
    //如果是注册中心的协议，例如registry或者service-discovery-registry，那么直接调用下一层export方法
    if (UrlUtils.isRegistry(invoker.getUrl())) {
        return protocol.export(invoker);
    }
    //调用下一层export方法，并将返回的Exporter包装为ListenerExporterWrapper，内部包含了一个Exporter和一个监听器列表。
    return new ListenerExporterWrapper<T>(protocol.export(invoker),
            Collections.unmodifiableList(ScopeModelUtil.getExtensionLoader(ExporterListener.class, invoker.getUrl().getScopeModel())
                    .getActivateExtension(invoker.getUrl(), EXPORTER_LISTENER_KEY)));
}
```

## 4 InjvmProtocol本地协议

这是本地导出的协议实现，其代码很简单，就是构建一个InjvmExporter，并且以serviceKey为key，key构成规则为{group}/{serviceInterfaceName}:{version}:{port}，以当前InjvmExporter对象为值，存入到exporterMap这个缓存中，后续调用时，将会从exporterMap找到Exporter，然后找到Invoker进行调用。

本地导出并没有涉及到注册中心以及网络服务器。

```java
@Override
public <T> Exporter<T> export(Invoker<T> invoker) throws RpcException {
    //构建一个InjvmExporter返回
    return new InjvmExporter<T>(invoker, invoker.getUrl().getServiceKey(), exporterMap);
}
```

## 5 总结

本次我们学习了doExportUrl方法的大概步骤：

1. **首先通过代理服务工厂proxyFactory#getInvoker方法将ref、interfaceClass、url包装成一个Invoker可执行体实例，Invoker可以统一调用方式，屏蔽调用细节。**

**1、** 这里的proxyFactory是ProxyFactory的自适应扩展实现，即ProxyFactory$Adaptive，也就是说会根据传入的url中的参数proxy的值选择对应的代理工厂实现类，而默认实现就是**JavassistProxyFactory**；

JavassistProxyFactory将会利用javassist动态创建了Class对应的Wrapper对象，动态生成的Wrapper类改写invokeMethod方法，其内部会被改写为根据接口方法名和参数直接调用ref对应名字的方法，避免通过Jdk的反射调用方法带来的性能问题。

然后创建一个**AbstractProxyInvoker**匿名实现类对象返回，重写了doInvoke方法，内部实际调用的**wrapper#invokeMethod**方法。

**2、****获取到可执行对象Invoker之后，通过协议protocolSPI对invoker进行服务导出，获取Exporter实例，然后将exporter加入到exporters缓存集合中**；

**1、****这里的protocolSPI是Protocol的自适应扩展实现，即Protocol$Adaptive，也就是说会根据传入的url中的protocol选择对应的ProtocolSPI实现类，而默认实现就是dubbo协议，即DubboProtocol本地导出的injvm协议对应InjvmProtocol，需要导出到接口级注册中心的registry对应InterfaceCompatibleRegistryProtocol，需要导出到应用级注册中心的service-discovery-registry对应RegistryProtocol**；

**2、****由于DubboSPIwrapper机制的存在，返回的Protocol就经过了几层的wrapper的包装Dubbo3.1默认经过了三层包装，即ProtocolSerializationWrapper->ProtocolFilterWrapper->ProtocolListenerWrapper->具体的Protocol实现**；

ProtocolSerializationWrapper会将导出的服务url存入FrameworkServiceRepository仓库内部的providerUrlsWithoutGroup缓存中。

ProtocolFilterWrapper将会为Invoker添加各种Filter，形成InvokerChain。

ProtocolListenerWrapper将返回的Exporter包装为ListenerExporterWrapper，内部包含了一个Invoker和一个监听器列表。

**当获取到经过包装的Protocol之后，将会调用Protocol#export方法进行服务的导出。**

**对于本地导出，也就是InjvmProtocol**，本地导出并没有涉及到注册中心以及网络服务器，它仅仅是基于Invoer构建一个InjvmExporter，并且存入到exporterMap这个缓存map集合中，key构成规则为{group}/{serviceInterfaceName}:{version}:{port}。后续调用时，将会从exporterMap找到Exporter，然后找到Invoker进行调用。

**对于远程导出就比较复杂**，包括接口级注册中心的registry对应**InterfaceCompatibleRegistryProtocol**，应用级注册中心的service-discovery-registry对应**RegistryProtocol**。

下一篇文章，我们将会学习Dubbo远程服务导出，这是我们最常用的服务导出方式，也就是注册到远程服务注册中心。
