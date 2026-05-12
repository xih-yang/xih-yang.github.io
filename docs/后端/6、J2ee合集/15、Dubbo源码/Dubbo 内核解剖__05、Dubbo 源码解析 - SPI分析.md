# 05、Dubbo 源码解析 - SPI分析
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/5.html
- 分类：J2EE框架
- 分组：Dubbo 内核解剖
如果大家看过之前的 dubbo 内核 SPI 实现 – [2.dubbo源码分析 之 内核SPI实现](/zhuanlan/j2ee/dubbo/1/2.html), 有可能还是一头雾水,下面我讲一下dubbo的具体应用。最典型的应用就是 Protocol 接口。

Protocol 属于 [dubbo 十层结构](http://dubbo.io/books/dubbo-dev-book/design.html) 中的远程调用层, 它封装了RPC调用。以Invocation 和 Result 为中心, 其它的扩展接口还包括 Invoker 和 Exporter。 Protocol 是服务域, 它是 Invoker 暴露和引用的主功能入口, 它负责 Invoker 的生命周期管理。

Invoker是实体域, 它是Dubbo的核心模型, 其它模型都向它靠扰, 或转换成它. 它代表一个可执行体，可向它发起invoke调用，它有可能是一个本地的实现，也可能是一个远程的实现，也可能一个集群实现。

**PS: 大家可以把 dubbo 的日志级别设置为 debug 级别。这样 dubbo 由 Javassist 字节码框架生成代理对象就会打印到控制台。大家可以把创建这个类, 然后就可以 debug 这个类了。**

在服务端配置类中 ServiceConfig 中我们可以看到它聚合了 Protocol。 而且是通过 dubbo 自己实现的 SPI 机制获取的。当我们启动 dubbo 源码中的 `dubbo-demo` 中的 `com.alibaba.dubbo.demo.provider.Provider` 类的时候就会进行服务发布。我们可以在控制台中看到生成的 Protocol 接口的动态代理类 Protocol$Adaptive：

我们只需要把这个类按生成的规则， 也就是包名与类名一致的放在 dubbo 源码中就可以 debug 这个类了。

在之前讲 dubbo 的 SPI 机制中， 我们知道 dubbo 在通过 ExtensionLoader#createExtension 方法来创建相应的 SPI 的扩展。在这个方法中 dubbo SPI 实现了自己的 IOC 与 AOP。

```java
private T createExtension(String name) {
    // 获取解析Adaptive标注了@Adaptive的对象缓存在属性cachedNames
    Class<?> clazz = getExtensionClasses().get(name);
    if (clazz == null) {
        throw findException(name);
    }
    try {
        // 从已创建Extension实例缓存中获取  
        T instance = (T) EXTENSION_INSTANCES.get(clazz);
        if (instance == null) {
            EXTENSION_INSTANCES.putIfAbsent(clazz, (T) clazz.newInstance());
            instance = (T) EXTENSION_INSTANCES.get(clazz);
        }
        // dubbo ioc
        injectExtension(instance);
        Set<Class<?>> wrapperClasses = cachedWrapperClasses;
        // dubbo aop
        if (wrapperClasses != null && wrapperClasses.size() > 0) {
            for (Class<?> wrapperClass : wrapperClasses) {
                instance = injectExtension((T) wrapperClass.getConstructor(type).newInstance(instance));
            }
        }
        return instance;
    } catch (Throwable t) {
        throw new IllegalStateException("Extension instance(name: " + name + ", class: " +
                type + ")  could not be instantiated: " + t.getMessage(), t);
    }
}
```

在`injectExtension` 方法中是 dubbo 实现自己的依赖注入。 dubbo 通过 ExtensionFactory 来获取需要依赖注入的对象。然后对当前实例通过反射调用 setter 方法来进行依赖注入。

当dubbo进行服务暴露的时候。首先是通过 Protocol 的 SPI 接口 与 获取到 RegistryProtocol 实例。然后通过 dubbo 的 aop把这个对象先代理到 ProtocolListenerWrapper， 然后再将代理后的对象代理到 ProtocolFilterWrapper中。

**1、调用SPI生成的代理对象**

调用SPI生成的代理对象， 对象 dubbo 的SPI 机制通过 ExtensionLoader#createExtension 获取到 RegistryProtocol实例。

**2、调用SPI的AOP生成最终对象**

获取到需要代理的对象，这里的 `cachedWrapperClasses` 包装对象是在解析 dubbo SPI 扩展文件生成的。 这个对象的满足的条件是实现了 SPI 接口， 并且有只有 SPI 接口为构造器， 且配置在 SPI 扩展文件的对象。我们可以看到针对 Protocol 接口，以下2个类满足条件：

- ProtocolListenerWrapper
- ProtocolFilterWrapper

**它的执行过程如下：**

**1、** 通过dubbo的SPI获取RegistryProtocol实例；

**2、** 然后通过调用ProtocolListenerWrapper的`ProtocolListenerWrapper(Protocolprotocol)`生成代理对象，然后再将代理后的对象传入到ProtocolFilterWrapper的`ProtocolFilterWrapper(Protocolprotocol)`中生成代理对象；

**3、** 生成的最终对象返回到我们最开始说的ServiceConfig这个类中；
