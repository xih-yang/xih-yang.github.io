# 02、Dubbo 源码解析 - 内核SPI实现
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/2.html
- 分类：J2EE框架
- 分组：Dubbo 内核解剖
Dubbo采用微内核+插件体系，使得设计优雅，扩展性强。那所谓的微内核+插件体系是如何实现的呢！大家是否熟悉spi(service providerinterface)机制，即我们定义了服务接口标准，让厂商去实现（如果不了解spi的请谷歌百度下）, jdk通过ServiceLoader类实现spi机制的服务查找功能 – [Java 规范 SPI](http://blog.csdn.net/u012410733/article/details/52475039)。

#### 1、为什么不使用JDK SPI

在dubbo中它实现了一套自己的SPI机制。JDK标准的SPI会一次性实例化扩展点所有实现，如果有扩展实现初始化很耗时，但如果没用上也加载，会很浪费资源.

增加了对扩展点IoC和AOP的支持，一个扩展点可以直接setter注入其它扩展点。

#### 2、Dubbo SPI 约定

SPI文件的存储路径在以下三个文件路径：

- META-INF/dubbo/internal/ **dubbo内部实现的各种扩展都放在了这个目录了**
- META-INF/dubbo/
- META-INF/services/

spi文件 存储路径在以上三个SPI目录下，并且文件名为接口的全路径名 就是=接口的包名+接口名也就是SPI接口的全路径类名:例如

```java
E:\Project\github\dubbo\dubbo-rpc\dubbo-rpc-default\src\main\resources
\META-INF\dubbo\internal\
com.alibaba.dubbo.rpc.Protocol
```

每个spi 文件里面的格式定义为： 扩展名=具体的类名，例如

```java
dubbo=com.alibaba.dubbo.rpc.protocol.dubbo.DubboProtoco
```

#### 3、涉及到类与注解简单说明

在dubbo SPI中最关键的类是ExtensionLoader。每个定义的spi的接口都会构建一个ExtensionLoader实例，存储在ExtensionLoader对象的`ConcurrentMap,ExtensionLoader> EXTENSION_LOADERS`这个map对象中。

获取SPI对象的典型方式为：

```java
Protocol protocol = ExtensionLoader.getExtensionLoader(Protocol.class).getAdaptiveExtension();
```

对于获取SPI对象的过程会在后面详细说明。

涉及到几个注解。下面我们就来简单的分析一下这些注解。

- @SPI:标识在dubbo中需要使用SPI的接口上，指定的SPI里面指定的值为默认值。
- @Adaptive:这个注解和@SPI注解配置使用，用于它可以标注在SPI接口扩展类上，也可以标注在SPI接口的方法上。如果这个注解标注在SPI接口实现的扩展类上时，获取的SPI实例对象就是标注了@Adaptive注册的类。例如：ExtensionFactory的SPI扩展对象为AdaptiveExtensionFactory。如果注解在标注在SPI接口的方法上说明就是一个动态代理类，它会通过dubbo里面的com.alibaba.dubbo.common.compiler.CompilerSPI接口通过字节码技术来创建对象。创建出来的对象名格式为SPI接口`$`Adaptive，例如Protocol接口创建的SPI对象为Protocol`$`Adaptive。
- @Activate： 是一个 Duboo 框架提供的注解。在 Dubbo 官方文档上有记载：

对于集合类扩展点，比如：Filter, InvokerListener, ExportListener, TelnetHandler, StatusChecker等， 可以同时加载多个实现，此时，可以用自动激活来简化配置。

#### 4、ExtensionLoader

在上一个章节我们就说过对于每个定义的spi的接口都会构建一个ExtensionLoader实例，然后通过这个实例的`getAdaptiveExtension`就可以获取一个扩展。下面我们就来详细的解剖一下ExtensionLoader这个对象。

在这个对象里面有几个重要的方法：

- getExtensionLoader(Class type) 就是为该接口new 一个-ExtensionLoader，然后缓存起来。
- getAdaptiveExtension() 获取一个扩展类，如果@Adaptive注解在类上就是一个装饰类；如果注解在方法上就是一个动态代理类，例如Protocol`$`Adaptive对象。
- getExtension(String name) 获取一个指定对象。
- getActivateExtension(URL url, String[] values, String group)：方法主要获取当前扩展的所有可自动激活的实现标注了@Activate注解

```java
Protocol protocol = ExtensionLoader.getExtensionLoader(Protocol.class).getAdaptiveExtension();
```

基于以上的dubbo SPI典型使用我们来分析一下这些方法。

##### 4.1 getExtensionLoader

就是为该接口new 一个`ExtensionLoader`，然后缓存起来。并为非ExtensionFactory的对象创建一个objectFactory用来依赖注入。

> com.alibaba.dubbo.common.extension.ExtensionLoader#getExtensionLoader

```java
    public static <T> ExtensionLoader<T> getExtensionLoader(Class<T> type) {
        ExtensionLoader<T> loader = (ExtensionLoader<T>) EXTENSION_LOADERS.get(type);
        if (loader == null) {
	        // 创建一个ExtensionLoader
            EXTENSION_LOADERS.putIfAbsent(type, new ExtensionLoader<T>(type));
            loader = (ExtensionLoader<T>) EXTENSION_LOADERS.get(type);
        }
        return loader;
    }
```

为SPI接口创建一个ExtensionLoader对象，用于获取扩展对象。

> com.alibaba.dubbo.common.extension.ExtensionLoader#ExtensionLoader

```java
    private ExtensionLoader(Class<?> type) {
        this.type = type;
        objectFactory = (type == ExtensionFactory.class ? null : ExtensionLoader.getExtensionLoader(ExtensionFactory.class).getAdaptiveExtension());
    }
```

在创建ExtensionLoader对象的时候，如果当前对象不是ExtensionFactory为当前SPI接口创建一个ExtensionFactory对象。当调用ExtensionLoader#injectExtension方法的时候进行依赖注入。

##### 4.2 getAdaptiveExtension

这个方法是dubbo SPI里最核心的方法。dubbo通过这个方法来获取到SPI接口的对应扩展类。

> com.alibaba.dubbo.common.extension.ExtensionLoader#getAdaptiveExtension

```java
    public T getAdaptiveExtension() {
        Object instance = cachedAdaptiveInstance.get();
        if (instance == null) {
            if(createAdaptiveInstanceError == null) {
                synchronized (cachedAdaptiveInstance) {
                    instance = cachedAdaptiveInstance.get();
                    if (instance == null) {
                        try {
	                        // 创建对应的扩展类
                            instance = createAdaptiveExtension();
                            cachedAdaptiveInstance.set(instance);
                        } 
                    }
                }
            }
        }
        return (T) instance;
    }
```

当SPI接口首次调用这个方法的时候，扩展类还没有创建好，所以它就会直接访问`createAdaptiveExtension`方法。

> com.alibaba.dubbo.common.extension.ExtensionLoader#createAdaptiveExtension

```java
    private T createAdaptiveExtension() {
        try {
            return injectExtension((T) getAdaptiveExtensionClass().newInstance());
        } catch (Exception e) {
            throw new IllegalStateException("Can not create adaptive extenstion " + type + ", cause: " + e.getMessage(), e);
        }
    }
```

通过getAdaptiveExtensionClass获取到SPI扩展对象Class的实例，然后通过反射方法newInstance()创建这个对象。最后通过最开始介绍的ExtensionLoader#getExtensionLoader创建的objectFactory进行依赖注入。

> com.alibaba.dubbo.common.extension.ExtensionLoader#getAdaptiveExtensionClass

```java
    private Class<?> getAdaptiveExtensionClass() {
	    // @Adaptive 注解在类上
        getExtensionClasses();
        if (cachedAdaptiveClass != null) {
            return cachedAdaptiveClass;
        }
        // @Adaptive注解在SPI接口方法上
        return cachedAdaptiveClass = createAdaptiveExtensionClass();
    }
```

这里就是上面说的，如果@Adaptive接口标注在@SPI接口的实现类上面就会直接返回这个对象的Class实例。如果标注在@SPI接口的方法上，就会通过dubbo中的字节码Compiler接口通过动态代理来创建SPI接口的实例。

##### 4.2.1 @Adaptive在类上

下面我们就来分析一下@Adaptive标注在SPI接口的实现类上。SPI扩展的创建过程。

> com.alibaba.dubbo.common.extension.ExtensionLoader#getExtensionClasses

```java
	private Map<String, Class<?>> getExtensionClasses() {
        Map<String, Class<?>> classes = cachedClasses.get();
        if (classes == null) {
            synchronized (cachedClasses) {
                classes = cachedClasses.get();
                if (classes == null) {
	                // 加载扩展类
                    classes = loadExtensionClasses();
                    cachedClasses.set(classes);
                }
            }
        }
        return classes;
	}
```

加载扩展类，并把扩展类Class实例设置到cachedClasses中。

> com.alibaba.dubbo.common.extension.ExtensionLoader#loadExtensionClasses

```java
    private Map<String, Class<?>> loadExtensionClasses() {
        final SPI defaultAnnotation = type.getAnnotation(SPI.class);
        if(defaultAnnotation != null) {
            String value = defaultAnnotation.value();
            if(value != null && (value = value.trim()).length() > 0) {
                String[] names = NAME_SEPARATOR.split(value);
                if(names.length > 1) {
                    throw new IllegalStateException("more than 1 default extension name on extension " + type.getName()
                            + ": " + Arrays.toString(names));
                }
	            // 设置扩展类的默认名称
                if(names.length == 1) cachedDefaultName = names[0];
            }
        }
        Map<String, Class<?>> extensionClasses = new HashMap<String, Class<?>>();
        // 加载上面所说的三个配置文件中的dubbo SPI文件
        loadFile(extensionClasses, DUBBO_INTERNAL_DIRECTORY);
        loadFile(extensionClasses, DUBBO_DIRECTORY);
        loadFile(extensionClasses, SERVICES_DIRECTORY);
        return extensionClasses;
    }
```

从代码里面可以看到，在loadExtensionClasses中首先会检测扩展点在@SPI注解中配置的默认扩展实现的名称，并将其赋值给cachedDefaultName属性进行缓存，后面想要获取该扩展点的默认实现名称就可以直接通过访问cachedDefaultName字段来完成，比如getDefaultExtensionName方法就是这么实现的。从这里的代码中又可以看到，具体的扩展实现类型，是通过调用loadFile方法来加载，分别从一下三个地方加载：

- META-INF/dubbo/internal/
- META-INF/dubbo/
- META-INF/services/

那么这个loadFile方法则至关重要了，看看其源代码：

```java
private void loadFile(Map<String, Class<?>> extensionClasses, String dir) {
    // SPI目录与SPI接口
    String fileName = dir + type.getName();
    try {
        Enumeration<java.net.URL> urls;
        ClassLoader classLoader = findClassLoader();
        // 扫描classpath下面的当前SPI接口的扩展
        if (classLoader != null) {
            urls = classLoader.getResources(fileName);
        } else {
            urls = ClassLoader.getSystemResources(fileName);
        }
        if (urls != null) {
            while (urls.hasMoreElements()) {
                java.net.URL url = urls.nextElement();
                try {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(url.openStream(), "utf-8"));
                    try {
                        String line = null;
                        while ((line = reader.readLine()) != null) {
                            final int ci = line.indexOf('#');
                            // 读取SPI文件中的SPI扩展
                            if (ci >= 0) line = line.substring(0, ci);
                            line = line.trim();
                            if (line.length() > 0) {
                                try {
                                    String name = null;
                                    int i = line.indexOf('=');
                                    if (i > 0) {
                                        name = line.substring(0, i).trim();
                                        line = line.substring(i + 1).trim();
                                    }
                                    if (line.length() > 0) {
                                        Class<?> clazz = Class.forName(line, true, classLoader);
                                        if (! type.isAssignableFrom(clazz)) {
                                            throw new IllegalStateException("Error when load extension class(interface: " +
                                                    type + ", class line: " + clazz.getName() + "), class " 
                                                    + clazz.getName() + "is not subtype of interface.");
                                        }
                                        // 如果Adaptive注解标注在这个对象上，设置cachedAdaptiveClass值为当前对象
                                        if (clazz.isAnnotationPresent(Adaptive.class)) {
                                            if(cachedAdaptiveClass == null) {
                                                cachedAdaptiveClass = clazz;
                                            } else if (! cachedAdaptiveClass.equals(clazz)) {
                                                throw new IllegalStateException("More than 1 adaptive class found: "
                                                        + cachedAdaptiveClass.getClass().getName()
                                                        + ", " + clazz.getClass().getName());
                                            }
                                        } else {
                                            try {
                                                // 判断这个SPI扩展是否以当前SPI接口为构造器,使用装饰器模式增强这个类
                                                clazz.getConstructor(type);
                                                Set<Class<?>> wrappers = cachedWrapperClasses;
                                                if (wrappers == null) {
                                                    cachedWrapperClasses = new ConcurrentHashSet<Class<?>>();
                                                    wrappers = cachedWrapperClasses;
                                                }
                                                wrappers.add(clazz);
                                            } catch (NoSuchMethodException e) {
                                                // 没有以当前SPI接口为构造器
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
                                                    // 标注了Activate注解，保存在cachedActivates属性中
                                                    Activate activate = clazz.getAnnotation(Activate.class);
                                                    if (activate != null) {
                                                        cachedActivates.put(names[0], activate);
                                                    }
                                                    for (String n : names) {
                                                        // 把扩展名称与扩展类的映射关系保存在cachedNames中
                                                        if (! cachedNames.containsKey(clazz)) {
                                                            cachedNames.put(clazz, n);
                                                        }
                                                        Class<?> c = extensionClasses.get(n);
                                                        if (c == null) {
                                                            // 把扩展名称与扩展类的映射关系保存在extensionClasses中，用于返回
                                                            extensionClasses.put(n, clazz);
                                                        } else if (c != clazz) {
                                                            throw new IllegalStateException("Duplicate extension " + type.getName() + " name " + n + " on " + c.getName() + " and " + clazz.getName());
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } catch (Throwable t) {
                                    IllegalStateException e = new IllegalStateException("Failed to load extension class(interface: " + type + ", class line: " + line + ") in " + url + ", cause: " + t.getMessage(), t);
                                    exceptions.put(line, e);
                                }
                            }
                        } // end of while read lines
                    } finally {
                        reader.close();
                    }
                } catch (Throwable t) {
                    logger.error("Exception when load extension class(interface: " +
                                        type + ", class file: " + url + ") in " + url, t);
                }
            } // end of while urls
        }
    } catch (Throwable t) {
        logger.error("Exception when load extension class(interface: " +
                type + ", description file: " + fileName + ").", t);
    }
}
```

这里就把@Adaptive的对象放置到cachedAdaptiveClass属性中，把有SPI接口为构造的包装对象放置在cachedWrapperClasses属性中，把没有SPI接口为构造的对象放置在cachedNames属性中。

##### 4.2.2 @Adaptive在方法上

如果@Adaptive标注在SPI接口的方法上，那么dubbo就会通过SPI接口Compiler进行字节码操作生成代理对象。默认使用Javassist字节码框架生成代理对象。

> com.alibaba.dubbo.common.extension.ExtensionLoader#createAdaptiveExtensionClass

```java
    private Class<?> createAdaptiveExtensionClass() {
        String code = createAdaptiveExtensionClassCode();
        ClassLoader classLoader = findClassLoader();
        com.alibaba.dubbo.common.compiler.Compiler compiler = ExtensionLoader.getExtensionLoader(com.alibaba.dubbo.common.compiler.Compiler.class).getAdaptiveExtension();
        return compiler.compile(code, classLoader);
    }
```

生成的代码对象的模板如下：

```java
package <扩展点接口所在包>;
public class <扩展点接口名>$Adpative implements <扩展点接口> {
    public <有@Adaptive注解的接口方法>(<方法参数>) {
        if(是否有URL类型方法参数?) 使用该URL参数
        else if(是否有方法类型上有URL属性) 使用该URL属性
        <else 在加载扩展点生成自适应扩展点类时抛异常，即加载扩展点失败！>
        if(获取的URL == null) {
            throw new IllegalArgumentException("url == null");
        }
              根据@Adaptive注解上声明的Key的顺序，从URL获致Value，作为实际扩展点名。
               如URL没有Value，则使用缺省扩展点实现。如没有扩展点， throw new IllegalStateException("Fail to get extension");
               在扩展点实现调用该方法，并返回结果。
    }
    public <有@Adaptive注解的接口方法>(<方法参数>) {
        throw new UnsupportedOperationException("is not adaptive method!");
    }
}
```

例如Protocol生成的代理对象Protocol$Adpative如下：

```java
package com.alibaba.dubbo.rpc;
import com.alibaba.dubbo.common.extension.ExtensionLoader;
public class Protocol$Adpative implements com.alibaba.dubbo.rpc.Protocol {
    public void destroy() {
        throw new UnsupportedOperationException("method public abstract void com.alibaba.dubbo.rpc.Protocol.destroy() of interface com.alibaba.dubbo.rpc.Protocol is not adaptive method!");
    }
    public int getDefaultPort() {
        throw new UnsupportedOperationException("method public abstract int com.alibaba.dubbo.rpc.Protocol.getDefaultPort() of interface com.alibaba.dubbo.rpc.Protocol is not adaptive method!");
    }
    public com.alibaba.dubbo.rpc.Exporter export(com.alibaba.dubbo.rpc.Invoker arg0) throws com.alibaba.dubbo.rpc.RpcException {
        if (arg0 == null) throw new IllegalArgumentException("com.alibaba.dubbo.rpc.Invoker argument == null");
        if (arg0.getUrl() == null)
            throw new IllegalArgumentException("com.alibaba.dubbo.rpc.Invoker argument getUrl() == null");
        com.alibaba.dubbo.common.URL url = arg0.getUrl();
        String extName = (url.getProtocol() == null ? "dubbo" : url.getProtocol());
        if (extName == null)
            throw new IllegalStateException("Fail to get extension(com.alibaba.dubbo.rpc.Protocol) name from url(" + url.toString() + ") use keys([protocol])");
        com.alibaba.dubbo.rpc.Protocol extension = (com.alibaba.dubbo.rpc.Protocol) ExtensionLoader.getExtensionLoader(com.alibaba.dubbo.rpc.Protocol.class).getExtension(extName);
        return extension.export(arg0);
    }
    public com.alibaba.dubbo.rpc.Invoker refer(java.lang.Class arg0, com.alibaba.dubbo.common.URL arg1) throws com.alibaba.dubbo.rpc.RpcException {
        if (arg1 == null) throw new IllegalArgumentException("url == null");
        com.alibaba.dubbo.common.URL url = arg1;
        String extName = (url.getProtocol() == null ? "dubbo" : url.getProtocol());
        if (extName == null)
            throw new IllegalStateException("Fail to get extension(com.alibaba.dubbo.rpc.Protocol) name from url(" + url.toString() + ") use keys([protocol])");
        com.alibaba.dubbo.rpc.Protocol extension = (com.alibaba.dubbo.rpc.Protocol) ExtensionLoader.getExtensionLoader(com.alibaba.dubbo.rpc.Protocol.class).getExtension(extName);
        return extension.refer(arg0, arg1);
    }
}
```

创建自适应扩展点实现类型和实例化就已经完成了，下面就来看下扩展点自动注入的实现injectExtension：

> com.alibaba.dubbo.common.extension.ExtensionLoader#injectExtension

```java
private T injectExtension(T instance) {
    try {
        if (objectFactory != null) {
            for (Method method : instance.getClass().getMethods()) {
                // 处理所有set方法
                if (method.getName().startsWith("set")
                        && method.getParameterTypes().length == 1
                        && Modifier.isPublic(method.getModifiers())) {
                    // 获取set方法参数类型
                    Class<?> pt = method.getParameterTypes()[0];
                    try {
                        // 获取setter对应的property名称
                        String property = method.getName().length() > 3 ? method.getName().substring(3, 4).toLowerCase() + method.getName().substring(4) : "";
                        // 根据类型，名称信息从ExtensionFactory获取  
                        Object object = objectFactory.getExtension(pt, property);
                        if (object != null) {
                            // 如果不为空，说set方法的参数是扩展点类型，那么进行注入  
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

这里可以看到，扩展点自动注入的一句就是根据setter方法对应的参数类型和property名称从ExtensionFactory中查询，如果有返回扩展点实例，那么就进行注入操作。到这里getAdaptiveExtension方法就分析完毕了。

##### 4.3 getExtension

这个方法的主要作用是用来获取ExtensionLoader实例代表的扩展的指定实现。已扩展实现的名字作为参数，结合前面学习getAdaptiveExtension的代码，我们可以推测，这方法中也使用了在调用getExtensionClasses方法的时候收集并缓存的数据，其中涉及到名字和具体实现类型对应关系的缓存属性是cachedClasses。具体是是否如我们猜想的那样呢，学习一下相关代码就知道了：

```java
public T getExtension(String name) {  
    if (name == null || name.length() == 0)  
        throw new IllegalArgumentException("Extension name == null");  
    // 判断是否是获取默认实现
    if ("true".equals(name)) {    
        return getDefaultExtension();  
    }  
    Holder<Object> holder = cachedInstances.get(name);// 缓存  
    if (holder == null) {  
        cachedInstances.putIfAbsent(name, new Holder<Object>());  
        holder = cachedInstances.get(name);  
    }  
    Object instance = holder.get();  
    if (instance == null) {  
        synchronized (holder) {  
            instance = holder.get();  
            if (instance == null) {  
                // 没有缓存实例则创建  
                instance = createExtension(name);
                holder.set(instance);// 缓存起来  
            }  
        }  
    }  
    return (T) instance;  
}  
```

判断是使用默认的扩展 还是根据名称来创建相应的SPI扩展。

> com.alibaba.dubbo.common.extension.ExtensionLoader#createExtension

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
        // 注入AdaptiveExtension
        injectExtension(instance);
        Set<Class<?>> wrapperClasses = cachedWrapperClasses;
        // Wrapper类型进行包装，层层包裹
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

这里或许有一个疑问： 从代码中看，不论instance是否存在于EXTENSION_INSTANCE，都会进行扩展点注入和Wrap操作。那么如果对于同一个扩展点，调用了两次createExtension方法的话，那不就进行了两次Wrap操作么？

如果外部能够直接调用createExtension方法，那么确实可能出现这个问题。但是由于createExtension方法是private的，因此外部无法直接调用。而在ExtensionLoader类中调用它的getExtension方法(只有它这一处调用)，内部自己做了缓存(cachedInstances)，因此当getExtension方法内部调用了一次createExtension方法之后，后面对getExtension方法执行同样的调用时，会直接使用cachedInstances缓存而不会再去调用createExtension方法了。

##### 4.4 getActivateExtension

getActivateExtension方法主要获取当前扩展的所有可自动激活的实现。可根据入参(values)调整指定实现的顺序，在这个方法里面也使用到getExtensionClasses方法中收集的缓存数据。

> com.alibaba.dubbo.common.extension.ExtensionLoader#getActivateExtension(com.alibaba.dubbo.common.URL, java.lang.String[], java.lang.String)

```java
public List<T> getActivateExtension(URL url, String[] values, String group) {  
    List<T> exts = new ArrayList<T>();
    List<String> names = values == null ? new ArrayList<String>(0) : Arrays.asList(values);  
    // 如果未配置"-default",则加载所有Activates扩展(names指定的扩展)  
    if (! names.contains(Constants.REMOVE_VALUE_PREFIX + Constants.DEFAULT_KEY)) {  
        // 加载当前Extension所有实现,会获取到当前Extension中所有@Active实现，赋值给cachedActivates变量  
        getExtensionClasses(); 
        // 遍历当前扩展所有的@Activate扩展  
        for (Map.Entry<String, Activate> entry : cachedActivates.entrySet()) { 
            String name = entry.getKey();  
            Activate activate = entry.getValue();  
            // 判断group是否满足,group为null则直接返回true 
            if (isMatchGroup(group, activate.group())) {  
                // 获取扩展示例  
                T ext = getExtension(name); 
                // 排除names指定的扩展;并且如果names中没有指定移除该扩展(-name)，且当前url匹配结果显示可激活才进行使用  
                if (! names.contains(name)  
                        && ! names.contains(Constants.REMOVE_VALUE_PREFIX + name)   
                        && isActive(activate, url)) {  
                    exts.add(ext);  
                }  
            }  
        }  
        Collections.sort(exts, ActivateComparator.COMPARATOR); // 默认排序  
    }  
    // 对names指定的扩展进行专门的处理  
    List<T> usrs = new ArrayList<T>();  
    // 遍历names指定的扩展名 
    for (int i = 0; i < names.size(); i ++) {  
        String name = names.get(i);  
        if (! name.startsWith(Constants.REMOVE_VALUE_PREFIX)  
                // 未设置移除该扩展  
                && ! names.contains(Constants.REMOVE_VALUE_PREFIX + name)) { 
            if (Constants.DEFAULT_KEY.equals(name)) { 
            // default表示上面已经加载并且排序的exts,将排在default之前的Activate扩展放置到default组之前,例如:ext1,default,ext2  
                if (usrs.size() > 0) { // 如果此时user不为空,则user中存放的是配置在default之前的Activate扩展  
                    exts.addAll(0, usrs); // 注意index是0，放在default前面  
                    usrs.clear(); // 放到default之前，然后清空  
                }  
            } else {  
                T ext = getExtension(name);  
                usrs.add(ext);  
            }  
        }  
    }  
    if (usrs.size() > 0) { // 这里留下的都是配置在default之后的  
        exts.addAll(usrs); // 添加到default排序之后  
    }  
    return exts;  
}  
```

#### 5、总结

上面把SPI的思路以及源代码分析了一遍，有几点可能需要注意的地方：

- 每个ExtensionLoader实例只负责加载一个特定扩展点实现
- 每个扩展点对应最多只有一个ExtensionLoader实例
- 对于每个扩展点实现，最多只会有一个实例
- 一个扩展点实现可以对应多个名称(逗号分隔)
- 对于需要等到运行时才能决定使用哪一个具体实现的扩展点，应获取其自使用扩展点实现(AdaptiveExtension)
- @Adaptive注解要么注释在扩展点@SPI的方法上，要么注释在其实现类的类定义上
- 如果@Adaptive注解注释在@SPI接口的方法上，那么原则上该接口所- - 有方法都应该加@Adaptive注解(自动生成的实现中默认为注解的方法抛异常)
- 每个扩展点最多只能有一个被AdaptiveExtension
- 每个扩展点可以有多个可自动激活的扩展点实现(使用@Activate注解)
- 由于每个扩展点实现最多只有一个实例，因此扩展点实现应保证线程安全
- 如果扩展点有多个Wrapper，那么最终其执行的顺序不确定(内部使用ConcurrentHashSet存储)

参考文章：

**1、**[Dubbo原理解析-Dubbo内核实现之基于SPI思想Dubbo内核实现](http://blog.csdn.net/quhongwei_zhanqiu/article/details/41577235)；

**2、** [SpringBoot中如何使用DubboActivate扩展点][SpringBoot_DubboActivate]；

**3、** [Dubbo扩展点加载机制-ExtensionLoader][Dubbo_-ExtensionLoader]；
