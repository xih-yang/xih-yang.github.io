# 07、Dubbo 实战 - 扩展点
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/7.html
- 分类：J2EE框架
- 分组：教程目录
与JDK的SPI机制类似，Dubbo也在META-INF路径下定义了多种扩展接口。只是JDK SPI机制是Java后台帮你实现读取文件并对接具体的实现类，而Dubbo是自己去读文件。

### 扩展点配置

扩展点机制有几个要点：

**1、** 根据关键字去读取配置文件，获得具体的实现类；

比如在dubbo-provider.xml文件中配置：

```java
<dubbo:protocol name="dubbo" port="20880" />
```

则会根据dubbo去读取具体的协议实现类DubboProtocol.java

**2、** 注解@SPI和@Adaptive；

- @SPI注解：可以认为是定义默认实现类；比如Protocol接口中，定义默认协议时dubbo；
- @Adaptive注解：该注解打在接口方法上；调ExtensionLoader.getAdaptiveExtension()获取适配类，会先通过前面的过程生成java的源代码，再通过编译器编译成class加载。但是Compiler的实现策略选择也是通过ExtensionLoader.getAdaptiveExtension()，如果也通过编译器编译成class文件那岂不是要死循环下去了吗？

此时分析ExtensionLoader.getAdaptiveExtension()函数，它获取适配类不再通过前面过程生成适配类java源代码，而是在读取扩展文件的时候遇到实现类打了注解@Adaptive就把这个类作为适配类缓存在ExtensionLoader中，调用时直接返回。

**3、** filter和listener；

在生成具体的实现类对象时，不是直接读取类文件，而是在读取类文件的基础上，通过filter和listener去封装类对象。

### 扩展点加载流程

```java
private static final Protocol protocol = ExtensionLoader.getExtensionLoader(Protocol.class).getAdaptiveExtension();
```

在这个例子中，首先Protocol类带有SPI注解，因此我们可以确认默认是使用dubbo=com.alibaba.dubbo.rpc.protocol.dubbo.DubboProtocol作为默认扩展点。

```java
/**
 * Protocol. (API/SPI, Singleton, ThreadSafe)
 */
@SPI("dubbo")
public interface Protocol {
    /**
     * Get default port when user doesn't config the port.
     *
     * @return default port
     */
    int getDefaultPort();
    /**
     * 暴露远程服务：<br>
     * 1. 协议在接收请求时，应记录请求来源方地址信息：RpcContext.getContext().setRemoteAddress();<br>
     * 2. export()必须是幂等的，也就是暴露同一个URL的Invoker两次，和暴露一次没有区别。<br>
     * 3. export()传入的Invoker由框架实现并传入，协议不需要关心。<br>
     *
     * @param <T>     服务的类型
     * @param invoker 服务的执行体
     * @return exporter 暴露服务的引用，用于取消暴露
     * @throws RpcException 当暴露服务出错时抛出，比如端口已占用
     */
    @Adaptive
    <T> Exporter<T> export(Invoker<T> invoker) throws RpcException;
    /**
     * 引用远程服务：<br>
     * 1. 当用户调用refer()所返回的Invoker对象的invoke()方法时，协议需相应执行同URL远端export()传入的Invoker对象的invoke()方法。<br>
     * 2. refer()返回的Invoker由协议实现，协议通常需要在此Invoker中发送远程请求。<br>
     * 3. 当url中有设置check=false时，连接失败不能抛出异常，需内部自动恢复。<br>
     *
     * @param <T>  服务的类型
     * @param type 服务的类型
     * @param url  远程服务的URL地址
     * @return invoker 服务的本地代理
     * @throws RpcException 当连接服务提供方失败时抛出
     */
    @Adaptive
    <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException;
    /**
     * 释放协议：<br>
     * 1. 取消该协议所有已经暴露和引用的服务。<br>
     * 2. 释放协议所占用的所有资源，比如连接和端口。<br>
     * 3. 协议在释放后，依然能暴露和引用新的服务。<br>
     */
    void destroy();
}
```

对应的函数为：

```java
@SuppressWarnings("unchecked")
    public T getAdaptiveExtension() {
        Object instance = cachedAdaptiveInstance.get();
        if (instance == null) {
            if (createAdaptiveInstanceError == null) {
                synchronized (cachedAdaptiveInstance) {
                    instance = cachedAdaptiveInstance.get();
                    if (instance == null) {
                        try {
                            instance = createAdaptiveExtension();
                            cachedAdaptiveInstance.set(instance);
                        } catch (Throwable t) {
                            createAdaptiveInstanceError = t;
                            throw new IllegalStateException("fail to create adaptive instance: " + t.toString(), t);
                        }
                    }
                }
            } else {
                throw new IllegalStateException("fail to create adaptive instance: " + createAdaptiveInstanceError.toString(), createAdaptiveInstanceError);
            }
        }
        return (T) instance;
    }
```

这里看到createAdaptiveExtension函数：

```java
@SuppressWarnings("unchecked")
    private T createAdaptiveExtension() {
        try {
            return injectExtension((T) getAdaptiveExtensionClass().newInstance());
        } catch (Exception e) {
            throw new IllegalStateException("Can not create adaptive extension " + type + ", cause: " + e.getMessage(), e);
        }
    }
```

```java
private Class<?> getAdaptiveExtensionClass() {
        getExtensionClasses();
        if (cachedAdaptiveClass != null) {
            return cachedAdaptiveClass;
        }
        return cachedAdaptiveClass = createAdaptiveExtensionClass();
    }
```

若有cachedAdaptiveClass对象，则直接返回，否则通过生成类文件，然后complier出来。

此时我们分析getExtension函数：

```java
/**
     * 返回指定名字的扩展。如果指定名字的扩展不存在，则抛异常 {@link IllegalStateException}
     * will be thrown.
     */
    @SuppressWarnings("unchecked")
    public T getExtension(String name) {
        if (name == null || name.length() == 0)
            throw new IllegalArgumentException("Extension name == null");
        if ("true".equals(name)) {
            return getDefaultExtension();
        }
        Holder<Object> holder = cachedInstances.get(name);
        if (holder == null) {
            cachedInstances.putIfAbsent(name, new Holder<Object>());
            holder = cachedInstances.get(name);
        }
        Object instance = holder.get();
        if (instance == null) {
            synchronized (holder) {
                instance = holder.get();
                if (instance == null) {
                    instance = createExtension(name);
                    holder.set(instance);
                }
            }
        }
        return (T) instance;
    }
```

此时我们分析createExtension：

```java
@SuppressWarnings("unchecked")
    private T createExtension(String name) {
        Class<?> clazz = getExtensionClasses().get(name);
        if (clazz == null) {
            throw findException(name);
        }
        try {
            T instance = (T) EXTENSION_INSTANCES.get(clazz);
            if (instance == null) {
                EXTENSION_INSTANCES.putIfAbsent(clazz, (T) clazz.newInstance());
                instance = (T) EXTENSION_INSTANCES.get(clazz);
            }
            injectExtension(instance);
            Set<Class<?>> wrapperClasses = cachedWrapperClasses;
            if (wrapperClasses != null && !wrapperClasses.isEmpty()) {
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

而这里injectExtension类，则是为生成的instance注入变量； 其目标是搜索所有set开头，同时只有一个入参的函数，执行该函数，对变量进行注入：

```java
private T injectExtension(T instance) {
        try {
            if (objectFactory != null) {
                for (Method method : instance.getClass().getMethods()) {
                    if (method.getName().startsWith("set")
                            && method.getParameterTypes().length == 1
                            && Modifier.isPublic(method.getModifiers())) {
                        Class<?> pt = method.getParameterTypes()[0];
                        try {
                            String property = method.getName().length() > 3 ? method.getName().substring(3, 4).toLowerCase() + method.getName().substring(4) : "";
                            Object object = objectFactory.getExtension(pt, property);
                            if (object != null) {
                                method.invoke(instance, object);
                            }
                        } catch (Exception e) {
                            logger.error("fail to inject via method " + method.getName()
                                    + " of interface " + type.getName() + ": " + e.getMessage(), e);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        }
        return instance;
    }
```

此时我们的目光转到如下一段代码：

```java
Set<Class<?>> wrapperClasses = cachedWrapperClasses;
            if (wrapperClasses != null && !wrapperClasses.isEmpty()) {
                for (Class<?> wrapperClass : wrapperClasses) {
                    instance = injectExtension((T) wrapperClass.getConstructor(type).newInstance(instance));
                }
            }
```

在分析这段代码的作用之前，我们先来分析一下 Set cachedWrapperClasses是如何被赋值的，此时我们转到 private void loadFile(Map> extensionClasses, String dir) 函数：

```java
if (clazz.isAnnotationPresent(Adaptive.class)) {
            if (cachedAdaptiveClass == null) {
                cachedAdaptiveClass = clazz;
            } else if (!cachedAdaptiveClass.equals(clazz)) {
                throw new IllegalStateException("More than 1 adaptive class found: "
                        + cachedAdaptiveClass.getClass().getName()
                        + ", " + clazz.getClass().getName());
            }
        } else {
            try {
                clazz.getConstructor(type);
                Set<Class<?>> wrappers = cachedWrapperClasses;
                if (wrappers == null) {
                    cachedWrapperClasses = new ConcurrentHashSet<Class<?>>();
                    wrappers = cachedWrapperClasses;
                }
                wrappers.add(clazz);
            } catch (NoSuchMethodException e) {
                clazz.getConstructor();
                if (name == null || name.length() == 0) {
                    name = findAnnotationName(clazz);
                    if (name == null || name.length() == 0) {
                        if (clazz.getSimpleName().length() > type.getSimpleName().length()
                                && clazz.getSimpleName().endsWith(type.getSimpleName())) {
                            name = clazz.getSimpleName().substring(0, clazz.getSimpleName().length() - type.getSimpleName().length()).toLowerCase();
                        } else {
                            throw new IllegalStateException("No such extension name for the class " + clazz.getName() + " in the config " + url);
                        }
                    }
                }
                String[] names = NAME_SEPARATOR.split(name);
                if (names != null && names.length > 0) {
                    Activate activate = clazz.getAnnotation(Activate.class);
                    if (activate != null) {
                        cachedActivates.put(names[0], activate);
                    }
                    for (String n : names) {
                        if (!cachedNames.containsKey(clazz)) {
                            cachedNames.put(clazz, n);
                        }
                        Class<?> c = extensionClasses.get(n);
                        if (c == null) {
                            extensionClasses.put(n, clazz);
                        } else if (c != clazz) {
                            throw new IllegalStateException("Duplicate extension " + type.getName() + " name " + n + " on " + c.getName() + " and " + clazz.getName());
                        }
                    }
                }
            }
        }
```

这里实际上是如果该类带有Adaptive注解，则认为是cachedAdaptiveClass；若该类没有Adaptive注解，则判断该类是否带有参数是type类型的构造函数，若有，则认为是wrapper类。

于是我们分析文件META-INF/dubbo/internal/com.alibaba.dubbo.rpc.Protocol 其内容为：

```java
filter=com.alibaba.dubbo.rpc.protocol.ProtocolFilterWrapper
listener=com.alibaba.dubbo.rpc.protocol.ProtocolListenerWrapper
mock=com.alibaba.dubbo.rpc.support.MockProtocol
```

我们分析这三个类，会发现mock类没有参数为Protocol的自定义参数，而其他两个均有； 此时我们返回到createExtension函数：

```java
Set<Class<?>> wrapperClasses = cachedWrapperClasses;
            if (wrapperClasses != null && !wrapperClasses.isEmpty()) {
                for (Class<?> wrapperClass : wrapperClasses) {
                    instance = injectExtension((T) wrapperClass.getConstructor(type).newInstance(instance));
                }
            }
```

此时可以发现这里对instance加了装饰类；对于Protocol来说加了两个装饰类 ProtocolFilterWrapper和ProtocolListenerWrapper； 也就injectExtension 实例化包装类，并注入接口的适配器， 注意这个地方返回的是最后一个包装类。
