# 09、Dubbo 实战 - ExtensionFactory
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/4/9.html
- 分类：J2EE框架
- 分组：教程目录
ExtensionLoader.java中注意到injectExtension函数是为了设置所生成的对象的field；其方法为对于有set函数的field进行设置。此时用到了ExtensionFactory；说白了ExtensionFactory就是根据类型和名字来获取对象。

下面我们来看看ExtensionFactory是如何根据类型和名字来获取对象的，ExtensionFactory也是基于dubbo的spi扩展机制的。

```java
/**
 * SpiExtensionFactory
 */
public class SpiExtensionFactory implements ExtensionFactory {
    public <T> T getExtension(Class<T> type, String name) {
        if (type.isInterface() && type.isAnnotationPresent(SPI.class)) {
            ExtensionLoader<T> loader = ExtensionLoader.getExtensionLoader(type);
            if (!loader.getSupportedExtensions().isEmpty()) {
                return loader.getAdaptiveExtension();
            }
        }
        return null;
    }
}
```

```java
/**
 * SpringExtensionFactory
 */
public class SpringExtensionFactory implements ExtensionFactory {
    private static final Set<ApplicationContext> contexts = new ConcurrentHashSet<ApplicationContext>();
    public static void addApplicationContext(ApplicationContext context) {
        contexts.add(context);
    }
    public static void removeApplicationContext(ApplicationContext context) {
        contexts.remove(context);
    }
    @SuppressWarnings("unchecked")
    public <T> T getExtension(Class<T> type, String name) {
        for (ApplicationContext context : contexts) {
            if (context.containsBean(name)) {
                Object bean = context.getBean(name);
                if (type.isInstance(bean)) {
                    return (T) bean;
                }
            }
        }
        return null;
    }
}
```

```java
/**
 * AdaptiveExtensionFactory
 */
@Adaptive
public class AdaptiveExtensionFactory implements ExtensionFactory {
    private final List<ExtensionFactory> factories;
    public AdaptiveExtensionFactory() {
        ExtensionLoader<ExtensionFactory> loader = ExtensionLoader.getExtensionLoader(ExtensionFactory.class);
        List<ExtensionFactory> list = new ArrayList<ExtensionFactory>();
        for (String name : loader.getSupportedExtensions()) {
            list.add(loader.getExtension(name));
        }
        factories = Collections.unmodifiableList(list);
    }
    public <T> T getExtension(Class<T> type, String name) {
        for (ExtensionFactory factory : factories) {
            T extension = factory.getExtension(type, name);
            if (extension != null) {
                return extension;
            }
        }
        return null;
    }
}
```

它跟Compiler接口一样适配类注解@Adaptive是打在类AdaptiveExtensionFactory上，而不是通过javassist编译生成的。

AdaptiveExtensionFactory持有所有ExtensionFactory对象的集合，dubbo内部默认实现的对象工厂是SpiExtensionFactory和SpringExtensionFactory，他们经过TreeMap排好序的查找顺序是优先先从SpiExtensionFactory获取，如果返回空在从SpringExtensionFactory获取。 这里我们可以看文件：/META-INF/dubbo/internal/com.alibaba.dubbo.common.extension.ExtensionFactory

```java
adaptive=com.alibaba.dubbo.common.extension.factory.AdaptiveExtensionFactory
spi=com.alibaba.dubbo.common.extension.factory.SpiExtensionFactory
spring=com.alibaba.dubbo.config.spring.extension.SpringExtensionFactory
```

我们来分析一下ExtensionFactory的初始化过程，会对SPI及Adaptive注解机制有更深入的了解：

```java
private ExtensionLoader(Class<?> type) {
        this.type = type;
        objectFactory = (type == ExtensionFactory.class ? null : ExtensionLoader.getExtensionLoader(ExtensionFactory.class).getAdaptiveExtension());
    }
```

这里我们看到getExtensionLoader会是一个死循环，因为会不断调用；但是实际上在getAdaptiveExtension中会直接返回被Adaptive注解的类，因此避免了死循环。

在getExtensionClasses函数中，在读取文件加载类的过程过程中，会判断该类是否带有Adaptive注解，如果是，则直接赋值

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
```

这里同时可以确认，对于一个spi接口，有且只有一个类带有adaptive注解，否则会出错。

我们继续分析AdaptiveExtensionFactory类

```java
/**
 * AdaptiveExtensionFactory
 */
@Adaptive
public class AdaptiveExtensionFactory implements ExtensionFactory {
    private final List<ExtensionFactory> factories;
    public AdaptiveExtensionFactory() {
        ExtensionLoader<ExtensionFactory> loader = ExtensionLoader.getExtensionLoader(ExtensionFactory.class);
        List<ExtensionFactory> list = new ArrayList<ExtensionFactory>();
        for (String name : loader.getSupportedExtensions()) {
            list.add(loader.getExtension(name));
        }
        factories = Collections.unmodifiableList(list);
    }
    public <T> T getExtension(Class<T> type, String name) {
        for (ExtensionFactory factory : factories) {
            T extension = factory.getExtension(type, name);
            if (extension != null) {
                return extension;
            }
        }
        return null;
    }
}
```

从这里我们看出，factory. getExtension(Class type, String name)是先从SpiExtensionFactory获得扩展点，再从SpringExtensionFactory获得扩展点。
