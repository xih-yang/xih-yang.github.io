# 04、Dubbo 3.x 源码解析 - Dubbo SPI机制的源码
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/2/4.html
- 分类：J2EE框架
- 分组：教程目录
> 基于Dubbo 3.1，详细介绍了Dubbo SPI机制的源码。

## 1 ExtensionLoader扩展加载器

在Dubbo内部，通过ExtensionLoader类（扩展点加载器）实现SPI的功能，每个SPI都会对应一个ExtensionLoader类实例。这个类相当于JDK SPI中的ServiceLoader。

ServiceLoader的基本使用很简单，比如查找给定名字的LoadBalance的实现。此前版本的代码通常是：

LoadBalance loadBalance= ExtensionLoader.getExtensionLoader(LoadBalance.class).getExtension(name);

在Dubbo 3.0及其之后，调用方式发生了变更，上面的静态调用方法getExtensionLoader被标注为废弃，实际上内部的调用方式为：

```java
/**
 * @see ApplicationModel#getExtensionDirector()
 * @see FrameworkModel#getExtensionDirector()
 * @see ModuleModel#getExtensionDirector()
 * @see ExtensionDirector#getExtensionLoader(java.lang.Class)
 * @deprecated get extension loader from extension director of some module.
 */
@Deprecated
public static <T> ExtensionLoader<T> getExtensionLoader(Class<T> type) {
    //通过领域模型来获取getExtensionLoader
    return ApplicationModel.defaultModel().getDefaultModule().getExtensionLoader(type);
}
```

也就是说，现在Dubbo推荐使用领域模型来获取对应的getExtensionLoader。实际上领域模型的getExtensionLoader方法内部还是依靠Dubbo 3.0增加的ExtensionDirector来获取。

ExtensionDirector是个有作用范围的扩展加载器管理器，实际上getExtensionLoader方法由ExtensionDirector实现，他用于支持Dubbo SPI，可用于查找、创建、管理不同作用域下的 ExtensionLoader。

每个领域模型和ExtensionDirector都实现了ExtensionAccessor接口（Dubbo3.0对于扩展的可访问抽象），具有访问扩展的能力，而每个领域模型内部都持有一个ExtensionDirector实例。

## 2 ExtensionDirector#getExtensionLoader获取扩展加载器

该方法用于获取对应的接口的扩展加载器，首先从本地缓存extensionLoadersMap中获取，如果没有则创建一个并存入extensionLoadersMap。

```java
/**
 * ExtensionDirector的方法
 * <p>
 * 根据类型获取ExtensionLoader
 *
 * @param type SPI类型
 */
@Override
@SuppressWarnings("unchecked")
public <T> ExtensionLoader<T> getExtensionLoader(Class<T> type) {
    //销毁检查
    checkDestroyed();
    /*
     * Class类型校验,不能为null,必须是接口类型,接口上必须标注了@SPI注解
     */
    if (type == null) {
        throw new IllegalArgumentException("Extension type == null");
    }
    if (!type.isInterface()) {
        throw new IllegalArgumentException("Extension type (" + type + ") is not an interface!");
    }
    if (!withExtensionAnnotation(type)) {
        throw new IllegalArgumentException("Extension type (" + type +
            ") is not an extension, because it is NOT annotated with @" + SPI.class.getSimpleName() + "!");
    }
    /*
     * 1 首先从本地缓存中获取对应的类型的ExtensionLoader
     */
    ExtensionLoader<T> loader = (ExtensionLoader<T>) extensionLoadersMap.get(type);
    //获取对应的类型所属的scope域
    ExtensionScope scope = extensionScopeMap.get(type);
    if (scope == null) {
        //获取接口上的SPI注解，并获取注解的scope属性值，默认ExtensionScope.APPLICATION
        SPI annotation = type.getAnnotation(SPI.class);
        scope = annotation.scope();
        //将该类型及其对应的scope存入extensionScopeMap
        extensionScopeMap.put(type, scope);
    }
    //如果ExtensionLoader为空并且scope为SELF，那么创建一个实例并存入缓存
    if (loader == null && scope == ExtensionScope.SELF) {
        // create an instance in self scope
        loader = createExtensionLoader0(type);
    }
    // 2. find in parent
    /*
     * 2 如果本地缓存的ExtensionLoader为null并且存在父ExtensionDirector，那么尝试从父ExtensionDirector中获取
     */
    if (loader == null) {
        if (this.parent != null) {
            loader = this.parent.getExtensionLoader(type);
        }
    }
    /*
     * 3 如果最终本地缓存没有ExtensionLoader，那么创建并存入缓存
     */
    // 3. create it
    if (loader == null) {
        loader = createExtensionLoader(type);
    }
    return loader;
}
```

### 2.1 ExtensionDirector#createExtensionLoader创建ExtensionLoader

如果当前接口类型的SPI注解的scope值和当前ExtensionDirector的scope值不一致，则直接返回null，否则创建ExtensionLoader。将会直接创建一个ExtensionLoader对象并且存入extensionLoadersMap，最后返回该ExtensionLoader。

```java
/**
 * ExtensionDirector的方法
 * <p>
 * 创建给定类型的ExtensionLoader
 *
 * @param type SPI接口类型
 */
private <T> ExtensionLoader<T> createExtensionLoader(Class<T> type) {
    ExtensionLoader<T> loader = null;
    //如果当前接口类型的SPI注解的scope值和当前ExtensionDirector的scope值不一致，则直接返回null
    if (isScopeMatched(type)) {
        //如果scope一致，则创建ExtensionLoader
        loader = createExtensionLoader0(type);
    }
    return loader;
}
/**
 * ExtensionDirector的方法
 * <p>
 * 创建给定类型的ExtensionLoader
 *
 * @param type SPI接口类型
 */
@SuppressWarnings("unchecked")
private <T> ExtensionLoader<T> createExtensionLoader0(Class<T> type) {
    //销毁检查
    checkDestroyed();
    ExtensionLoader<T> loader;
    //创建一个ExtensionLoader对象并且存入extensionLoadersMap，最后返回该ExtensionLoader
    extensionLoadersMap.putIfAbsent(type, new ExtensionLoader<T>(type, this, scopeModel));
    loader = (ExtensionLoader<T>) extensionLoadersMap.get(type);
    return loader;
}
```

### 2.2 ExtensionLoader的构造器

创建ExtensionLoader的时候，将会初始化各种属性，例如设置扩展后处理器，ExtensionPostProcessor扩展后处理器，参考了Spring的BeanPostProcessor，在每个扩展实例被创建之后，在对其进行setter注入的前后会调用对应的postProcessBeforeInitialization和postProcessAfterInitialization方法，目前默认有一个ScopeModelAwareExtensionProcessor。

ExtensionLoader的常见方法如下：

方法名
描述

getExtension(String name)
获取给定SPI接口的给定名称的SPI扩展实例

getAdaptiveExtension()
获取给定SPI接口的自适应扩展实例

GetSupportedExtensionInstances()
获取给定SPI接口的全部扩展实例

getActivateExtension
获取给定SPI接口的自动激活的扩展点实例

getDefaultExtension()
获取给定SPI接口的默认扩展实例

```java
/**
 * ExtensionLoader的构造器
 *
 * @param type              SPI接口类型
 * @param extensionDirector 扩展管理者
 * @param scopeModel        域模型
 */
ExtensionLoader(Class<?> type, ExtensionDirector extensionDirector, ScopeModel scopeModel) {
    //设置相关属性
    this.type = type;
    this.extensionDirector = extensionDirector;
    //设置扩展后处理器，ExtensionPostProcessor扩展后处理器，参考了Spring的BeanPostProcessor
    //在每个扩展实例被创建之后，在对其进行初始化的前后会调用对应的postProcessBeforeInitialization和postProcessAfterInitialization方法。
    this.extensionPostProcessors = extensionDirector.getExtensionPostProcessors();
    //创建实例化策略对象
    initInstantiationStrategy();
    //如果当前SPI接口类型为ExtensionInjector扩展注入器类型，则基于SPI获取一个自适应的ExtensionInjector对象
    this.injector = (type == ExtensionInjector.class ? null : extensionDirector.getExtensionLoader(ExtensionInjector.class)
        .getAdaptiveExtension());
    //创建Activate注解的比较器
    this.activateComparator = new ActivateComparator(extensionDirector);
    this.scopeModel = scopeModel;
}
```

## 3 ExtensionLoader#getExtension获取给定名称的扩展实现

获取给定名称的扩展实现，允许wrapper包装，没找到则抛出异常。

```java
/**
 * ExtensionLoader的方法
 * <p>
 * 获取给定名称的扩展实现
 */
public T getExtension(String name) {
    //获取给定名称的扩展实现，允许wrapper包装
    T extension = getExtension(name, true);
    //没找到则抛出异常
    if (extension == null) {
        throw new IllegalArgumentException("Not find extension: " + name);
    }
    return extension;
}
```

### 3.1 ExtensionLoader#getExtension获取给定名称的扩展实现

获取给定名称的扩展实现。

**1、** 如果名字为空则抛出异常，如果名字为“true”就返回默认的实例；

**2、** 设置cacheKey为name，如果不允许wrapper包装则cacheKey加上_origin；

**3、** 从本地缓存cachedInstances中获取或者创建给定cacheKey的Holder实例，此时可能并没有获取到扩展实例；

**4、** 获取holder实例中的扩展实例，如果没有扩展实例，基于当前holder对象加锁然后再次获取，如果没有扩展实例则调用createExtension方法创建给定名称的扩展实现，并且将扩展实例加入holder；

```java
/**
 * ExtensionLoader的方法
 * <p>
 * 获取给定名称的扩展实现
 *
 * @param name 给定名称
 * @param wrap 是否允许wrapper包装
 * @return
 */
@SuppressWarnings("unchecked")
public T getExtension(String name, boolean wrap) {
    //销毁检测
    checkDestroyed();
    //空的名字则抛出异常
    if (StringUtils.isEmpty(name)) {
        throw new IllegalArgumentException("Extension name == null");
    }
    //名字是true就返回默认的实例
    if ("true".equals(name)) {
        return getDefaultExtension();
    }
    //设置cacheKey为name
    String cacheKey = name;
    //如果不允许wrapper包装则cacheKey加上_origin
    if (!wrap) {
        cacheKey += "_origin";
    }
    /*
     * 获取或者创建给定cacheKey的Holder实例，此时可能并没有获取到扩展实例
     */
    final Holder<Object> holder = getOrCreateHolder(cacheKey);
    //获取holder实例中的扩展实例
    Object instance = holder.get();
    //如果没有扩展实例
    if (instance == null) {
        //基于当前holder对象加锁
        synchronized (holder) {
            //再次获取，双重检测锁
            instance = holder.get();
            //如果没有扩展实例
            if (instance == null) {
                //创建给定名称的扩展实现
                instance = createExtension(name, wrap);
                //将扩展实例加入holder
                holder.set(instance);
            }
        }
    }
    return (T) instance;
}
```

#### 3.2 ExtensionLoader#getOrCreateHolder获取或者创建Holder

直接从本地缓存cachedInstances中获取Holder，如果为null，创建一个空的Holder实例并存入缓存。

cachedInstances是ConcurrentHashMap类型，能够保证线程安全。

```java
private Holder<Object> getOrCreateHolder(String name) {
    //直接从本地缓存cachedInstances中获取Holder
    Holder<Object> holder = cachedInstances.get(name);
    //如果为null
    if (holder == null) {
        //创建一个空的Holder实例并存入缓存
        cachedInstances.putIfAbsent(name, new Holder<>());
        //获取空的Holder实例
        holder = cachedInstances.get(name);
    }
    return holder;
}
```

## 4 ExtensionLoader#createExtension创建给定名称的扩展实现

**该方法可以说是Dubbo SPI机制的核心方法，大概步骤如下：**

**1、** 从缓存cachedClasses中获取name对应的扩展实例的Class，如果没有获取到Class则抛出异常这里可能涉及到扩展文件的加载；

**2、** 从缓存extensionInstances中获取对应class的扩展实例，如果没有获取到则调用createExtensionInstance方法创建该Class的实例并且存入缓存；

3. 获取该实例，调用所有ExtensionPostProcessor#postProcessBeforeInitialization方法执行前置处理。
**4、****调用injectExtension方法，对扩展实例进行setter方法注入，即Dubbo的IoC**；

5. 调用所有ExtensionPostProcessor#postProcessAfterInitialization方法执行后置处理。
**6、****如果允许包装，对实例通过wrapperClass进行包装增强，即Dubbo的AOP**；

7. 初始化扩展，如果当前扩展实例是Lifecycle类型则调用Lifecycle#initialize初始化方法。

如果大家看过Spring的源码，那么对上面的一些概念肯定不会陌生，比如IoC、AOP、前后置处理等等，但是Dubbo的实现和Spring却不一样，它比Spring的实现要更加的简单，但是同样很精妙，下面一起来看看。

```java
/**
 * 创建给定名称的扩展实现
 *
 * @param name 扩展名称
 * @param wrap 是否允许wrapper包装
 * @return 扩展实例
 */
@SuppressWarnings("unchecked")
private T createExtension(String name, boolean wrap) {
    /*
     * 1 从缓存中获取name对应的扩展实例的Class，如果没有获取到Class则抛出异常。这里可能涉及到扩展文件的加载
     */
    Class<?> clazz = getExtensionClasses().get(name);
    if (clazz == null || unacceptableExceptions.contains(name)) {
        throw findException(name);
    }
    try {
        //从缓存中获取对应class的实例
        T instance = (T) extensionInstances.get(clazz);
        //如果没有该实例缓存
        if (instance == null) {
            /*
             * 2 创建该Class的实例并且存入缓存
             */
            extensionInstances.putIfAbsent(clazz, createExtensionInstance(clazz));
            //获取该实例
            instance = (T) extensionInstances.get(clazz);
            //调用所有ExtensionPostProcessor#postProcessBeforeInitialization方法执行前置处理
            instance = postProcessBeforeInitialization(instance, name);
            /*
             * 3 对实例进行setter方法注入，即IoC
             */
            injectExtension(instance);
            //调用所有ExtensionPostProcessor#postProcessAfterInitialization方法执行后置处理
            instance = postProcessAfterInitialization(instance, name);
        }
        /*
         * 4 如果允许包装，对实例通过wrapperClass进行包装增强，即AOP
         */
        if (wrap) {
            //获取当前服务接口的所有实现中的所有WrapperClass包装类类型实现，并且排序
            List<Class<?>> wrapperClassesList = new ArrayList<>();
            if (cachedWrapperClasses != null) {
                wrapperClassesList.addAll(cachedWrapperClasses);
                //@Activate排序
                wrapperClassesList.sort(WrapperComparator.COMPARATOR);
                //反转顺序
                Collections.reverse(wrapperClassesList);
            }
            //如果当前服务接口的所有实现中有WrapperClass包装类类型实现
            if (CollectionUtils.isNotEmpty(wrapperClassesList)) {
                //遍历所有wrapperClass
                for (Class<?> wrapperClass : wrapperClassesList) {
                    //获取class上的Wrapper注解
                    Wrapper wrapper = wrapperClass.getAnnotation(Wrapper.class);
                    //判断当前wrapperClass是否能够支持对于当前name的扩展实现的包装
                    //如果Wrapper注解为null，或者Wrapper注解的matches属性为null或者Wrapper注解的matches属性包括当前name
                    //并且Wrapper注解的matches属性不包括当前name，那么表示能够支持
                    boolean match = (wrapper == null) ||
                        ((ArrayUtils.isEmpty(wrapper.matches()) || ArrayUtils.contains(wrapper.matches(), name)) &&
                            !ArrayUtils.contains(wrapper.mismatches(), name));
                    //如果匹配
                    if (match) {
                        //实例化wrapperClass，构造器参数为当前实例，然后对于wrapperClass实例进行setter方法注入
                        //最后将wrapperClass实例设置为当前实例
                        instance = injectExtension((T) wrapperClass.getConstructor(type).newInstance(instance));
                        //调用所有ExtensionPostProcessor#postProcessAfterInitialization方法执行后置处理
                        instance = postProcessAfterInitialization(instance, name);
                    }
                }
            }
        }
        // Warning: After an instance of Lifecycle is wrapped by cachedWrapperClasses, it may not still be Lifecycle instance, this application may not invoke the lifecycle.initialize hook.
        /*
         * 5 初始化扩展，如果当前扩展实例是Lifecycle类型则调用Lifecycle#initialize初始化方法
         * 由于是在经过setter注入和wrapperClass包装之后执行，那么如果当前实例被wrapperClass包装，并且wrapperClass没有实现Lifecycle接口，则并不会调用底层真实扩展实例的Lifecycle#initialize初始化方法
         */
        initExtension(instance);
        //返回最终的实例
        return instance;
    } catch (Throwable t) {
        throw new IllegalStateException("Extension instance (name: " + name + ", class: " +
            type + ") couldn't be instantiated: " + t.getMessage(), t);
    }
}
```

### 4.1 ExtensionLoader#getExtensionClasses获取扩展Class

首先直接从缓存获取当前接口的全部扩展名到对应的Class的映射，如果没有则说明当前扩展接口的所有扩展实现还没有从SPI文件中加载，那么从文件中加载当前扩展接口的所有扩展实现的Class并构建扩展名到Class的映射返回。

```java
private final Holder<Map<String, Class<?>>> cachedClasses = new Holder<>();
/**
 * 获取全部扩展的Class映射
 */
private Map<String, Class<?>> getExtensionClasses() {
    //从Holder中获取classes映射
    Map<String, Class<?>> classes = cachedClasses.get();
    //如果为null
    if (classes == null) {
        //加锁
        synchronized (cachedClasses) {
            //再次从Holder中获取classes映射
            classes = cachedClasses.get();
            //如果为null，说明当前扩展接口的所有扩展实现还没有从SPI文件中加载
            if (classes == null) {
                try {
                    //从文件中加载当前扩展接口的所有扩展实现的Class并返回
                    classes = loadExtensionClasses();
                } catch (InterruptedException e) {
                    logger.error("Exception occurred when loading extension class (interface: " + type + ")", e);
                    throw new IllegalStateException("Exception occurred when loading extension class (interface: " + type + ")", e);
                }
                //设置到holder中
                cachedClasses.set(classes);
            }
        }
    }
    return classes;
}
```

#### 4.1.1 ExtensionLoader#loadExtensionClasses加载扩展Class

**首先尝试从接口的SPI注解中提取并缓存默认扩展名到cachedDefaultName，实际上就是接口上的@SPI注解的value属性值。**

**然后遍历加载策略实现，默认有三个DubboInternalLoadingStrategy、DubboLoadingStrategy、ServicesLoadingStrategy，分别加载不同的文件目录下的给定接口的全部SPI实现的Class并且构建扩展名到Class的映射。**

```java
/**
 * 从文件中加载当前扩展接口的所有扩展实现的Class并构建扩展名到Class的映射返回。
 */
@SuppressWarnings("deprecation")
private Map<String, Class<?>> loadExtensionClasses() throws InterruptedException {
    //销毁检查
    checkDestroyed();
    /*
     * 1 尝试从接口的SPI注解中提取并缓存默认扩展名到cachedDefaultName，实际上就是接口上的@SPI注解的value属性值
     */
    cacheDefaultExtensionName();
    Map<String, Class<?>> extensionClasses = new HashMap<>();
    //遍历加载策略实现，默认有三个DubboInternalLoadingStrategy、DubboLoadingStrategy、ServicesLoadingStrategy，分别加载不同的文件目录
    for (LoadingStrategy strategy : strategies) {
        /*
         * 从文件加载给定接口的全部SPI实现
         */
        loadDirectory(extensionClasses, strategy, type.getName());
        // compatible with old ExtensionFactory 兼容旧的ExtensionFactory
        if (this.type == ExtensionInjector.class) {
            loadDirectory(extensionClasses, strategy, ExtensionFactory.class.getName());
        }
    }
    return extensionClasses;
}
```

#### 4.1.2 ExtensionLoader#cacheDefaultExtensionName缓存默认扩展名

获取接口的SPI注解，如果没有注解则直接返回。获取注解的value值，基于, 拆分为多个扩展名数组，如果设置了多个默认扩展，那么抛出异常，如果只有一个默认扩展，那么设置该值为cachedDefaultName属性值。

```java
/**
 * extract and cache default extension name if exists
 */
private void cacheDefaultExtensionName() {
    //获取接口的SPI注解
    final SPI defaultAnnotation = type.getAnnotation(SPI.class);
    //如果没有注解则直接返回
    if (defaultAnnotation == null) {
        return;
    }
    //获取注解的value值
    String value = defaultAnnotation.value();
    if ((value = value.trim()).length() > 0) {
        //基于, 拆分为多个扩展名数组
        String[] names = NAME_SEPARATOR.split(value);
        //如果设置了多个默认扩展，那么抛出异常
        if (names.length > 1) {
            throw new IllegalStateException("More than 1 default extension name on extension " + type.getName()
                + ": " + Arrays.toString(names));
        }
        //如果只有一个默认扩展，那么设置该值为cachedDefaultName属性值
        if (names.length == 1) {
            cachedDefaultName = names[0];
        }
    }
}
```

#### 4.1.3 ExtensionLoader#loadDirectory从文件加载扩展class

内部调ExtensionLoader#loadDirectoryInternal方法加载给定文件目录下的SPI文件class。

```java
/**
 * 加载给定文件目录下的SPI文件class
 *
 * @param extensionClasses 扩展class的map
 * @param strategy         加载策略
 * @param type             当前扩展接口名
 */
private void loadDirectory(Map<String, Class<?>> extensionClasses, LoadingStrategy strategy, String type) throws InterruptedException {
    //加载给定文件目录下的SPI文件class
    loadDirectoryInternal(extensionClasses, strategy, type);
    try {
        //替换旧的alibaba接口路径为新的apache接口路径
        String oldType = type.replace("org.apache", "com.alibaba");
        if (oldType.equals(type)) {
            return;
        }
        //if class not found,skip try to load resources
        //尝试加载新的接口的资源
        ClassUtils.forName(oldType);
        loadDirectoryInternal(extensionClasses, strategy, oldType);
    } catch (ClassNotFoundException classNotFoundException) {
        //异常捕获但并未处理
    }
}
```

#### 4.1.4 ExtensionLoader#loadDirectoryInternal从内部文件加载扩展class

从内部文件加载扩展class。根据loadingStrategy构建文件名：

**1、****DubboInternalLoadingStrategy**对应**META-INF/dubbo/internal/{type}**，Dubbo内置的扩展加载策略不允许覆盖同名扩展；

**2、****DubboLoadingStrategy**对应**META-INF/dubbo/{type}**，Dubbo普通的扩展加载策略允许覆盖同名扩展；

**3、****ServicesLoadingStrategy**对应**META-INF/services//{type}**，Dubbo兼容JAVASPI目录加载策略允许覆盖同名扩展；

**以上就是我们此前学习的Duboo SPI文件的三个默认存放位置。这些SPI文件的信息将会被加载到内存中，并被读取为一行行的字符串数据。**

```java
/**
 * 加载给定文件目录下的SPI文件class
 *
 * @param extensionClasses 扩展class的map
 * @param loadingStrategy  加载策略
 * @param type             当前扩展接口名
 */
private void loadDirectoryInternal(Map<String, Class<?>> extensionClasses, LoadingStrategy loadingStrategy, String type) throws InterruptedException {
    //根据loadingStrategy构建文件名
    //DubboInternalLoadingStrategy对应META-INF/dubbo/internal/{type}
    //DubboLoadingStrategy对应META-INF/dubbo/{type}
    //ServicesLoadingStrategy对应META-INF/services//{type}
    String fileName = loadingStrategy.directory() + type;
    try {
        List<ClassLoader> classLoadersToLoad = new LinkedList<>();
        // try to load from ExtensionLoader's ClassLoader first
        //首先尝试从ExtensionLoader的ClassLoader加载
        if (loadingStrategy.preferExtensionClassLoader()) {
            ClassLoader extensionLoaderClassLoader = ExtensionLoader.class.getClassLoader();
            if (ClassLoader.getSystemClassLoader() != extensionLoaderClassLoader) {
                classLoadersToLoad.add(extensionLoaderClassLoader);
            }
        }
        //特殊的类型加载，默认空map
        if (specialSPILoadingStrategyMap.containsKey(type)) {
            String internalDirectoryType = specialSPILoadingStrategyMap.get(type);
            //skip to load spi when name don't match
            if (!LoadingStrategy.ALL.equals(internalDirectoryType)
                && !internalDirectoryType.equals(loadingStrategy.getName())) {
                return;
            }
            classLoadersToLoad.clear();
            classLoadersToLoad.add(ExtensionLoader.class.getClassLoader());
        } else {
            //从领域模型加载
            Set<ClassLoader> classLoaders = scopeModel.getClassLoaders();
            if (CollectionUtils.isEmpty(classLoaders)) {
                Enumeration<java.net.URL> resources = ClassLoader.getSystemResources(fileName);
                if (resources != null) {
                    while (resources.hasMoreElements()) {
                        loadResource(extensionClasses, null, resources.nextElement(), loadingStrategy.overridden(),
                            loadingStrategy.includedPackages(),
                            loadingStrategy.excludedPackages(),
                            loadingStrategy.onlyExtensionClassLoaderPackages());
                    }
                }
            } else {
                classLoadersToLoad.addAll(classLoaders);
            }
        }
        //通过 loadResources 加载SPI配置文件到内存中
        Map<ClassLoader, Set<java.net.URL>> resources = ClassLoaderResourceLoader.loadResources(fileName, classLoadersToLoad);
        resources.forEach(((classLoader, urls) -> {
            //遍历SPI配置文件解析每一行的扩展名和扩展类型，并存入extensionClasses
            loadFromClass(extensionClasses, loadingStrategy.overridden(), urls, classLoader,
                loadingStrategy.includedPackages(),
                loadingStrategy.excludedPackages(),
                loadingStrategy.onlyExtensionClassLoaderPackages());
        }));
    } catch (InterruptedException e) {
        throw e;
    } catch (Throwable t) {
        logger.error("Exception occurred when loading extension class (interface: " +
            type + ", description file: " + fileName + ").", t);
    }
}
private void loadFromClass(Map<String, Class<?>> extensionClasses, boolean overridden, Set<java.net.URL> urls, ClassLoader classLoader,
                           String[] includedPackages, String[] excludedPackages, String[] onlyExtensionClassLoaderPackages) {
    if (CollectionUtils.isNotEmpty(urls)) {
        //遍历文件资源读取
        for (java.net.URL url : urls) {
            loadResource(extensionClasses, classLoader, url, overridden, includedPackages, excludedPackages, onlyExtensionClassLoaderPackages);
        }
    }
}
```

#### 4.1.5 ExtensionLoader#loadResource加载文件资源

**该方法加载文件资源每行数据。首先会去除每一行的注释，然后获取 = 的位置，=前面的就是获取扩展名，=后面的就是扩展实现类的全路径名，如果没有=，那么该行的所有有效文字都算作扩展实现类的全路径名。**

**最后判断如果没有排除该扩展实现，那么调用Class.forName方法加载Class，然后调用loadClass方法缓存该Class的相关信息。**

```java
/**
 * 加载文件资源每行数据
 */
private void loadResource(Map<String, Class<?>> extensionClasses, ClassLoader classLoader,
                          java.net.URL resourceURL, boolean overridden, String[] includedPackages, String[] excludedPackages, String[] onlyExtensionClassLoaderPackages) {
    try {
        //获取文件资源的每一行
        List<String> newContentList = getResourceContent(resourceURL);
        String clazz;
        //遍历每一行
        for (String line : newContentList) {
            //去除每一行的注释
            final int ci = line.indexOf('#');
            if (ci >= 0) {
                line = line.substring(0, ci);
            }
            line = line.trim();
            if (line.length() > 0) {
                try {
                    String name = null;
                    //获取 = 的位置
                    int i = line.indexOf('=');
                    if (i > 0) {
                        //获取扩展名
                        name = line.substring(0, i).trim();
                        //获取扩展实现类的全路径名
                        clazz = line.substring(i + 1).trim();
                    } else {
                        //如果没有=，那么该行的所有有效文字都算作扩展实现类的全路径名
                        clazz = line;
                    }
                    //如果没有排除该扩展实现
                    if (StringUtils.isNotEmpty(clazz) && !isExcluded(clazz, excludedPackages) && isIncluded(clazz, includedPackages)
                        && !isExcludedByClassLoader(clazz, classLoader, onlyExtensionClassLoaderPackages)) {
                        /*
                         * 加载该行的class
                         */
                        loadClass(extensionClasses, resourceURL, Class.forName(clazz, true, classLoader), name, overridden);
                    }
                } catch (Throwable t) {
                    IllegalStateException e = new IllegalStateException("Failed to load extension class (interface: " + type +
                        ", class line: " + line + ") in " + resourceURL + ", cause: " + t.getMessage(), t);
                    exceptions.put(line, e);
                }
            }
        }
    } catch (Throwable t) {
        logger.error("Exception occurred when loading extension class (interface: " +
            type + ", class file: " + resourceURL + ") in " + resourceURL, t);
    }
}
```

#### 4.1.6 ExtensionLoader#loadClass缓存扩展相关信息

**这个方法用于缓存该Class的相关信息，是加载扩展信息的核心代码：**

**1、****如果当前扩展Class上有Adaptive注解，那么表示当前类是该接口的自适应扩展实现**；

**1、****缓存当前Class为cachedAdaptiveClass属性，如果此前已存在其他自适应实现Class且不允许覆盖，则抛出异常**；

**2、** 否则，**如果当前扩展Class是WrapperClass**；

**1、** 那么**缓存当前Class到cachedWrapperClasses集合**；

**3、** 否则，表示**当前扩展Class是普通的扩展实现**；

**1、****如果扩展名为空，获取Class上的Extension注解的value属性值作为扩展名，如果没有该注解，则获取扩展实现的小写类名作为扩展名**；

**2、****使用,符号拆分扩展名数组获取当前扩展Class上的Activate注解，并将扩展名和Activate注解的映射关系缓存到cachedActivates集合**；

**3、****遍历扩展名将当前CLass和扩展名的映射关系缓存到cachedNames集合，将扩展名和当前CLass的映射关系缓存到extensionClasses集合，如果不允许覆盖并且出现同名，则抛出异常**；

```java
/**
 * 缓存该Class的相关信息
 *
 * @param extensionClasses 扩展class映射
 * @param resourceURL      资源
 * @param clazz            加载的Class
 * @param name             扩展名
 * @param overridden       是否覆盖同名缓存
 */
private void loadClass(Map<String, Class<?>> extensionClasses, java.net.URL resourceURL, Class<?> clazz, String name,
                       boolean overridden) {
    //如果当前实现类的类型和接口的类型不匹配，则报错
    if (!type.isAssignableFrom(clazz)) {
        throw new IllegalStateException("Error occurred when loading extension class (interface: " +
            type + ", class line: " + clazz.getName() + "), class "
            + clazz.getName() + " is not subtype of interface.");
    }
    //如果当前扩展Class上有Adaptive注解，那么表示当前类是该接口的自适应扩展实现
    if (clazz.isAnnotationPresent(Adaptive.class)) {
        //缓存当前class为cachedAdaptiveClass属性，如果此前已存在其他自适应实现Class且不允许覆盖，则抛出异常
        cacheAdaptiveClass(clazz, overridden);
    }
    //否则，如果当前扩展Class是WrapperClass
    else if (isWrapperClass(clazz)) {
        //那么缓存当前class到cachedWrapperClasses集合
        cacheWrapperClass(clazz);
    } 
    //否则，表示普通的扩展实现
    else {
        //如果扩展名为空，那么获取Class上的Extension注解
        if (StringUtils.isEmpty(name)) {
            //获取Class上的Extension注解的value属性值作为扩展名
            //如果没有该注解，则获取扩展实现的小写类名作为扩展名
            name = findAnnotationName(clazz);
            if (name.length() == 0) {
                throw new IllegalStateException("No such extension name for the class " + clazz.getName() + " in the config " + resourceURL);
            }
        }
        //使用 , 拆分扩展名数组
        String[] names = NAME_SEPARATOR.split(name);
        if (ArrayUtils.isNotEmpty(names)) {
            //获取当前扩展Class上的Activate注解，并将扩展名和Activate注解的映射关系缓存到cachedActivates集合
            cacheActivateClass(clazz, names[0]);
            //遍历扩展名
            for (String n : names) {
                //将当前CLass和扩展名的映射关系缓存到cachedNames集合
                cacheName(clazz, n);
                //将扩展名和当前CLass的映射关系缓存到extensionClasses集合，如果不允许覆盖并且出现同名，则抛出异常
                saveInExtensionClass(extensionClasses, clazz, n, overridden);
            }
        }
    }
}
```

##### 4.1.6.1 ExtensionLoader#cacheAdaptiveClass缓存自适应Class

**如果当前扩展Class上有Adaptive注解，那么表示当前类是该接口的自适应扩展实现。缓存当前Class为cachedAdaptiveClass属性，如果此前已存在其他自适应实现Class且不允许覆盖，则抛出异常。**

```java
/**
 * cache Adaptive class which is annotated with <code>Adaptive</code>
 */
private void cacheAdaptiveClass(Class<?> clazz, boolean overridden) {
    //如果当前没有自适应class或者允许覆盖，那么设置cachedAdaptiveClass属性为当前class
    if (cachedAdaptiveClass == null || overridden) {
        cachedAdaptiveClass = clazz;
    }
    //如果此前的自适应class不是当前class，那么抛出异常
    else if (!cachedAdaptiveClass.equals(clazz)) {
        throw new IllegalStateException("More than 1 adaptive class found: "
            + cachedAdaptiveClass.getName()
            + ", " + clazz.getName());
    }
}
```

##### 4.1.6.2 ExtensionLoader#isWrapperClass是否是WrapperClass

**WrapperClass用于Dubbo SPI使用AOP机制，WrapperClass是Dubbo中的一个概念，它并不是一个具体的接口。**

**如果某个扩展实现类拥有只有一个参数的构造函数，并且参数类型就是当前扩展接口类型，那么这个扩展实现类就作为WrapperClass包装类，会被记录在cachedWrapperClasses缓存集合中。**

```java
/**
 * test if clazz is a wrapper class
 * <p>
 * which has Constructor with given class type as its only argument
 */
protected boolean isWrapperClass(Class<?> clazz) {
    //获取当前Class的所有构造器
    Constructor<?>[] constructors = clazz.getConstructors();
    for (Constructor<?> constructor : constructors) {
        //如果构造器有一个参数，并且参数类型为当前SPI接口类型，那么表示当前class就是WrapperClass
        if (constructor.getParameterTypes().length == 1 && constructor.getParameterTypes()[0] == type) {
            return true;
        }
    }
    return false;
}
```

##### 4.1.6.3 ExtensionLoader#cacheWrapperClass缓存WrapperClass

如果一个class是WrapperClass，那么缓存该class到cachedWrapperClasses集合。

```java
/**
 * cache wrapper class
 * <p>
 * like: ProtocolFilterWrapper, ProtocolListenerWrapper
 */
private void cacheWrapperClass(Class<?> clazz) {
    //缓存当前class到cachedWrapperClasses集合
    if (cachedWrapperClasses == null) {
        cachedWrapperClasses = new ConcurrentHashSet<>();
    }
    cachedWrapperClasses.add(clazz);
}
```

##### 4.1.6.4 ExtensionLoader#findAnnotationName查找扩展名

**如果SPI文件中没指定扩展名，那么获取Class上的Extension注解的value属性值作为扩展名，如果没有该注解，则获取扩展实现的小写类名作为扩展名。**

```java
@SuppressWarnings("deprecation")
private String findAnnotationName(Class<?> clazz) {
    //获取Class上的Extension注解的value属性值作为扩展名
    Extension extension = clazz.getAnnotation(Extension.class);
    if (extension != null) {
        return extension.value();
    }
    //获取Class简短类名
    String name = clazz.getSimpleName();
    if (name.endsWith(type.getSimpleName())) {
        name = name.substring(0, name.length() - type.getSimpleName().length());
    }
    //转换为小写
    return name.toLowerCase();
}
```

##### 4.1.6.5 ExtensionLoader#cacheActivateClass缓存ActivateClass

**获取当前扩展Class上的Activate注解，并将第一个扩展名和Activate注解的映射关系缓存到cachedActivates集合。**

```java
/**
 * cache Activate class which is annotated with <code>Activate</code>
 * <p>
 * for compatibility, also cache class with old alibaba Activate annotation
 */
@SuppressWarnings("deprecation")
private void cacheActivateClass(Class<?> clazz, String name) {
    //获取当前扩展Class上的Activate注解
    Activate activate = clazz.getAnnotation(Activate.class);
    if (activate != null) {
        //将扩展名和Activate注解的映射关系缓存到cachedActivates集合
        cachedActivates.put(name, activate);
    } else {
        //老的alibaba注解支持
        // support com.alibaba.dubbo.common.extension.Activate
        com.alibaba.dubbo.common.extension.Activate oldActivate = clazz.getAnnotation(com.alibaba.dubbo.common.extension.Activate.class);
        if (oldActivate != null) {
            cachedActivates.put(name, oldActivate);
        }
    }
}
```

##### 4.1.6.6 ExtensionLoader#cacheName缓存扩展名

将当前Class和第一个扩展名的映射关系缓存到cachedNames集合。

```java
/**
 * cache name
 */
private void cacheName(Class<?> clazz, String name) {
    //如果不存在则添加
    if (!cachedNames.containsKey(clazz)) {
        cachedNames.put(clazz, name);
    }
}
```

##### 4.1.6.7 ExtensionLoader#saveInExtensionClass扩展名映射

将扩展名和当前Class的映射关系缓存到extensionClasses集合，如果出现同名不同class并且不允许覆盖，则抛出异常。

```java
/**
 * put clazz in extensionClasses
 */
private void saveInExtensionClass(Map<String, Class<?>> extensionClasses, Class<?> clazz, String name, boolean overridden) {
    //从map获取该名字的扩展class
    Class<?> c = extensionClasses.get(name);
    //如果不存在或者允许覆盖，则设置新值为当前class
    if (c == null || overridden) {
        extensionClasses.put(name, clazz);
    } 
    //如果class不相等，那么抛出异常
    else if (c != clazz) {
        // duplicate implementation is unacceptable
        unacceptableExceptions.add(name);
        String duplicateMsg = "Duplicate extension " + type.getName() + " name " + name + " on " + c.getName() + " and " + clazz.getName();
        logger.error(duplicateMsg);
        throw new IllegalStateException(duplicateMsg);
    }
}
```

### 4.2 ExtensionLoader#createExtensionInstance创建扩展实例

**内部利用实例化策略对象InstantiationStrategy#instantiate方法创建实例。**

```java
/**
 * 创建该Class的实例并且存入缓存
 */
private Object createExtensionInstance(Class<?> type) throws ReflectiveOperationException {
    //利用实例化策略对象创建实例
    return instantiationStrategy.instantiate(type);
}
```

#### 4.2.1 InstantiationStrategy#instantiate创建扩展实例

**InstantiationStrategy用于创建扩展实例。**

**1、** 获取**默认无参构造器defaultConstructor**，将有参并且参数类型都是ScopeModel类型的构造器加入matchedConstructors集合；

**2、** 下面选择构造器：；

**1、** 如果matchedConstructors个数多于一个，那么抛出异常因为匹配的有参构造器只能有一个；

**2、** 否则，如果matchedConstructors个数只有一个，那么取该构造器；

**3、** 否则，如果存在默认无参构造器，那么取该构造器；

**4、** 否则，抛出异常因为没有找到任何匹配的构造器；

**3、** 选取构造器之后，获取构造器参数并且为每个参数填充对应的类型的ScopeModel，最后**反射调用该构造器创建扩展实例**；

```java
/**
 * Interface to create instance for specify type, using both in {@link ExtensionLoader} and {@link ScopeBeanFactory}.
 */
public class InstantiationStrategy {
    private ScopeModelAccessor scopeModelAccessor;
    public InstantiationStrategy() {
        this(null);
    }
    public InstantiationStrategy(ScopeModelAccessor scopeModelAccessor) {
        this.scopeModelAccessor = scopeModelAccessor;
    }
    /**
     * 实例化扩展对象
     */
    public <T> T instantiate(Class<T> type) throws ReflectiveOperationException {
        // should not use default constructor directly, maybe also has another constructor matched scope model arguments
        //不应该直接使用默认构造函数，也许还有另一个构造函数匹配作用域模型参数
        // 1. 尝试获取默认构造器
        Constructor<T> defaultConstructor = null;
        try {
            //获取无参构造器
            defaultConstructor = type.getConstructor();
        } catch (NoSuchMethodException e) {
            // ignore no default constructor
        }
        // 2. use matched constructor if found
        //匹配的构造器集合
        List<Constructor> matchedConstructors = new ArrayList<>();
        //获取全部构造器
        Constructor<?>[] declaredConstructors = type.getConstructors();
        //遍历每一个构造器
        for (Constructor<?> constructor : declaredConstructors) {
            //如果构造器的所有参数类型都是ScopeModel类型，那么表示匹配
            if (isMatched(constructor)) {
                //加入到匹配的构造器集合
                matchedConstructors.add(constructor);
            }
        }
        // remove default constructor from matchedConstructors
        //从集合中移除默认无参构造器
        if (defaultConstructor != null) {
            matchedConstructors.remove(defaultConstructor);
        }
        // match order:
        // 1. the only matched constructor with parameters
        // 2. default constructor if absent
        //匹配的构造器排序
        //
        Constructor targetConstructor;
        //如果匹配的有参构造器个数多余一个，那么抛出异常
        if (matchedConstructors.size() > 1) {
            throw new IllegalArgumentException("Expect only one but found " +
                matchedConstructors.size() + " matched constructors for type: " + type.getName() +
                ", matched constructors: " + matchedConstructors);
        }
        //否则，如果匹配的有参构造器只有一个，那么取该构造器
        else if (matchedConstructors.size() == 1) {
            targetConstructor = matchedConstructors.get(0);
        }
        //否则，如果存在默认无参构造器，那么取该构造器
        else if (defaultConstructor != null) {
            targetConstructor = defaultConstructor;
        } else {
            throw new IllegalArgumentException("None matched constructor was found for type: " + type.getName());
        }
        // create instance with arguments
        //获取选择的构造器的参数师叔祖
        Class[] parameterTypes = targetConstructor.getParameterTypes();
        //参数数组
        Object[] args = new Object[parameterTypes.length];
        //填充对应的类型的ScopeModel
        for (int i = 0; i < parameterTypes.length; i++) {
            args[i] = getArgumentValueForType(parameterTypes[i]);
        }
        //反射调用该构造器创建实例
        return (T) targetConstructor.newInstance(args);
    }
    private boolean isMatched(Constructor<?> constructor) {
        //遍历构造器的全部参数
        for (Class<?> parameterType : constructor.getParameterTypes()) {
            //如果该参数不是ScopeModel类型，那么返回false
            if (!isSupportedConstructorParameterType(parameterType)) {
                return false;
            }
        }
        return true;
    }
    private boolean isSupportedConstructorParameterType(Class<?> parameterType) {
        //是否是ScopeModel类型
        return ScopeModel.class.isAssignableFrom(parameterType);
    }
    private Object getArgumentValueForType(Class parameterType) {
        // get scope mode value
        //获取对应类型的ScopeModel
        if (scopeModelAccessor != null) {
            if (parameterType == ScopeModel.class) {
                return scopeModelAccessor.getScopeModel();
            } else if (parameterType == FrameworkModel.class) {
                return scopeModelAccessor.getFrameworkModel();
            } else if (parameterType == ApplicationModel.class) {
                return scopeModelAccessor.getApplicationModel();
            } else if (parameterType == ModuleModel.class) {
                return scopeModelAccessor.getModuleModel();
            }
        }
        return null;
    }
}
```

### 4.3 ExtensionLoader#injectExtension实例IoC setter注入

**对实例进行setter方法注入，即Dubbo的IoC的实现。**

**1、** 如果自适应扩展注入器injector为null，那么直接返回实例，一般都不是null而是AdaptiveExtensionInjector；

**2、** 获取实例的所有方法，尝试执行setter方法注入：；

**1、****如果不是setter方法，则跳过该方法注入名称开头为set、并且参数只有一个、并且是public的方法，就是setter方法**；

**2、****如果方法上存在DisableInject注解，那么表示跳过对该方法的setter注入**；

**3、****如果方法所属的类属于ScopeModelAware,则跳过对该方法的setter注入**；

**4、****如果扩展实例属于ScopeModelAware,或者ExtensionAccessorAware，并且方法是属于这两个接口的方法之一，则跳过对该方法的setter注入**；

**5、****获取方法参数pt如果方法参数是基本类型、String、Number等原始类型，则跳过对该方法的setter注入**；

**6、****获取参数名property，实际上就是setter方法的方法名除去开头的set剩下的字符串，并且将首字母改为小写**；

**7、****调用injector.getInstance方法获取需要注入的参数实例**；

**8、****反射调用方法执行IoC注入**；

```java
/**
 * 对实例进行setter方法注入，即Dubbo IoC
 */
private T injectExtension(T instance) {
    //如果自适应扩展注入器为null，那么直接返回实例，一般都不是null而是AdaptiveExtensionInjector
    if (injector == null) {
        return instance;
    }
    try {
        //获取实例的所有方法
        for (Method method : instance.getClass().getMethods()) {
            //名称开头为set、并且参数只有一个、并且是public的方法，就是setter方法
            //如果不是setter方法，则跳过该方法注入
            if (!isSetter(method)) {
                continue;
            }
            /**
             * Check {@link DisableInject} to see if we need auto-injection for this property
             */
            //如果方法上存在DisableInject注解，那么表示跳过对该方法的setter注入
            if (method.isAnnotationPresent(DisableInject.class)) {
                continue;
            }
            // When spiXXX implements ScopeModelAware, ExtensionAccessorAware,
            // the setXXX of ScopeModelAware and ExtensionAccessorAware does not need to be injected
            //如果方法所属的类属于ScopeModelAware,则跳过对该方法的setter注入
            if (method.getDeclaringClass() == ScopeModelAware.class) {
                continue;
            }
            //如果扩展实例属于ScopeModelAware, 或者ExtensionAccessorAware，并且方法是属于这两个接口的方法之一，则跳过对该方法的setter注入
            if (instance instanceof ScopeModelAware || instance instanceof ExtensionAccessorAware) {
                if (ignoredInjectMethodsDesc.contains(ReflectUtils.getDesc(method))) {
                    continue;
                }
            }
            //获取方法参数
            Class<?> pt = method.getParameterTypes()[0];
            //如果方法参数是基本类型、String、Number等原始类型，则跳过对该方法的setter注入
            if (ReflectUtils.isPrimitives(pt)) {
                continue;
            }
            try {
                //获取参数名，实际上就是setter方法的方法名除去开头的set剩下的字符串，并且将首字母改为小写
                String property = getSetterProperty(method);
                //获取需要注入的参数实例
                Object object = injector.getInstance(pt, property);
                if (object != null) {
                    //反射调用方法执行IoC注入
                    method.invoke(instance, object);
                }
            } catch (Exception e) {
                logger.error("Failed to inject via method " + method.getName()
                    + " of interface " + type.getName() + ": " + e.getMessage(), e);
            }
        }
    } catch (Exception e) {
        logger.error(e.getMessage(), e);
    }
    return instance;
}
```

#### 4.3.1 AdaptiveExtensionInjector#getInstance获取注入的参数

**此前创建ExtensionLoader的构造器中，对于injector，将会获取ExtensionInjector接口的自适应扩展实现AdaptiveExtensionInjector。**

**下面看看AdaptiveExtensionInjector的getInstance方法。该方法循环调用内部的injectors集合中的每个injector注入器，查找符合给定类型和名字的参数实例，将找到的第一个不为null的结果返回。**

```java
@Override
public <T> T getInstance(final Class<T> type, final String name) {
    //循环调用injectors集合中的每个injector注入器，查找符合给定类型和名字的参数实例，将找到的第一个不为null的结果返回
    return injectors.stream()
        .map(injector -> injector.getInstance(type, name))
        .filter(Objects::nonNull)
        .findFirst()
        .orElse(null);
}
```

injectors集合中存储的是全部的injector注入器，实际上就是通过这些注入器去不同的来源中查找可以注入的实例的。

AdaptiveExtensionInjector实现了Lifecycle接口，在它实例化完毕之后，将会调用它的initialize方法，而injectors就是在此方法中初始化的。

常见的ExtensionInjector，按顺序有以下几种：

**1、****ScopeBeanExtensionInjector，领域模型实例扩展注入器，从领域模型内部的ScopeBeanFactory中查找注入的实例ScopeBeanFactory中存储的是域内部使用的共享bean，参考了Spring的BeanFactory，在CommonScopeModelInitializer可以看到注册，在各种ScopeModelInitializer中也能看到注册**；

**2、****SpiExtensionInjector，DubboSPI扩展加载器，如果参数类型支持DubboSPI，那么返回该类型接口的自适应扩展实现作为参数实例**；

**3、****SpringExtensionInjector，Spring扩展加载器从Spring容器中查找注入的实例**；

```java
@Override
public void initialize() throws IllegalStateException {
    //获取ExtensionInjector的扩展加载器
    ExtensionLoader<ExtensionInjector> loader = extensionAccessor.getExtensionLoader(ExtensionInjector.class);
    //获取全部的SPI扩展实现转换为list
    injectors = loader.getSupportedExtensions().stream()
        .map(loader::getExtension)
        .collect(Collectors.collectingAndThen(Collectors.toList(), Collections::unmodifiableList));
}
```

### 4.4 WrapperClass实例AOP增强

**在此前加载SPI文件的时候，我们就讲过cachedWrapperClasses这个缓存，他存放了SPI接口的所有WrapperClass。**

**在进行setter方法注入之后，还会判断如果cachedWrapperClasses缓存不为空，即该服务接口的所有实现中有WrapperClass包装类类型，那么直接实例化该包装类类型，并在构造器中传入当前实例，最后会返回一个包装类的实例，这就是Dubbo对于AOP的支持。**

**WrapperClass是Dubbo中的一个概念，它并不是一个具体的接口，因为一个扩展接口可能有多个扩展实现类，而这些扩展实现类会有一个相同的或者公共的逻辑，因此可以用一个专门的扩展实现类，其内部存放公共的逻辑，方便维护。**

**如果某个扩展实现类拥有只有一个参数的构造函数，并且参数就是当前扩展接口类型，那么这个扩展实现类就作为WrapperClass包装类，会被记录在cachedWrapperClasses缓存中。**

**后续如果要查找某个名字的实现，那么在对真正的实现类实例化完毕之后，会直接实例化该包装类类型，并在构造器中传入真正的当前实例，然后对于包装类实例也会进行setter注入。并且包装类还可以进行多层包装，最后会返回的是最外层的一个包装类的实例。**

**每一层的WrapperClass相当于一个切面，这种方式就是Dubbo对于AOP的支持，将重复的代码逻辑抽取出来，形成复用，如果从设计模式方面来说的话，那就是装饰设计模式。**

这种WrapperClass机制在很多的模块的SPI中都能见到。例如Protocol：

```java
/*
 * 4 如果允许包装，对实例通过wrapperClass进行包装增强，即AOP
 */
if (wrap) {
    //获取当前服务接口的所有实现中的所有WrapperClass包装类类型实现，并且排序
    List<Class<?>> wrapperClassesList = new ArrayList<>();
    if (cachedWrapperClasses != null) {
        wrapperClassesList.addAll(cachedWrapperClasses);
        //@Activate排序
        wrapperClassesList.sort(WrapperComparator.COMPARATOR);
        //反转顺序
        Collections.reverse(wrapperClassesList);
    }
    //如果当前服务接口的所有实现中有WrapperClass包装类类型实现
    if (CollectionUtils.isNotEmpty(wrapperClassesList)) {
        //遍历所有wrapperClass
        for (Class<?> wrapperClass : wrapperClassesList) {
            //获取class上的Wrapper注解
            Wrapper wrapper = wrapperClass.getAnnotation(Wrapper.class);
            //判断当前wrapperClass是否能够支持对于当前name的扩展实现的包装
            //如果Wrapper注解为null，或者Wrapper注解的matches属性为null或者Wrapper注解的matches属性包括当前name
            //并且Wrapper注解的matches属性不包括当前name，那么表示能够支持
            boolean match = (wrapper == null) ||
                ((ArrayUtils.isEmpty(wrapper.matches()) || ArrayUtils.contains(wrapper.matches(), name)) &&
                    !ArrayUtils.contains(wrapper.mismatches(), name));
            //如果匹配
            if (match) {
                //实例化wrapperClass，构造器参数为当前实例，然后对于wrapperClass实例进行setter方法注入
                //最后将wrapperClass实例设置为当前实例
                instance = injectExtension((T) wrapperClass.getConstructor(type).newInstance(instance));
                //调用所有ExtensionPostProcessor#postProcessAfterInitialization方法执行后置处理
                instance = postProcessAfterInitialization(instance, name);
            }
        }
    }
}
```

## 5 ExtensionLoader#getAdaptiveExtension获取自适应扩展实现

**很多时候，有些扩展实现并不想在框架启动阶段被加载和选择，而是希望在扩展方法被调用时，根据运行时参数进行动态加载和选择。Dubbo的SPI增加了自适应扩展机制，可以根据请求时候的参数来动态选择对应的扩展，提高了 Dubbo 的扩展能力。**

**Dubbo的一个SPI扩展点只允许有一个自适应扩展实现。在自适应扩展实现的方法中，会在运行的时候动态根据传递的参数（例如来自url的参数）值获取指定的真实扩展实现，随后再调用获取的真实扩展实现完成真正的业务逻辑。这是一种代理机制。**

**Dubbo通过@Adaptive注解标注来表明某个实现是一个自适应实现，这个注解可以修饰在类或者方法上。在类上的时候表示该类实例就是自适应扩展实现，在方法上的时候则会生成代理类（默认基于javassist创建代理）。**

**ExtensionLoader#getAdaptiveExtension方法用于获取自适应的ExtensionLoader实现，首先获取缓存cachedAdaptiveInstance的自适应扩展实例，如果没有则调用createAdaptiveExtension方法创建自适应扩展实例，然后设置到cachedAdaptiveInstance缓存中并返回。**

```java
@SuppressWarnings("unchecked")
public T getAdaptiveExtension() {
    //销毁检测
    checkDestroyed();
    //首先获取缓存的自适应扩展实例
    Object instance = cachedAdaptiveInstance.get();
    //如果自适应扩展实例为null
    if (instance == null) {
        //如果创建自适应扩展实例异常不为null，那么抛出该异常
        if (createAdaptiveInstanceError != null) {
            throw new IllegalStateException("Failed to create adaptive instance: " +
                createAdaptiveInstanceError.toString(),
                createAdaptiveInstanceError);
        }
        //对于Holder加锁
        synchronized (cachedAdaptiveInstance) {
            //再次获取缓存的自适应扩展实例，双重检测锁
            instance = cachedAdaptiveInstance.get();
            //如果自适应扩展实例为null
            if (instance == null) {
                try {
                    /*
                     * 创建自适应扩展实例
                     */
                    instance = createAdaptiveExtension();
                    //设置到缓存中
                    cachedAdaptiveInstance.set(instance);
                } catch (Throwable t) {
                    //如果抛出了异常，则记录抛出的异常
                    createAdaptiveInstanceError = t;
                    throw new IllegalStateException("Failed to create adaptive instance: " + t.toString(), t);
                }
            }
        }
    }
    return (T) instance;
}
```

### 5.1 ExtensionLoader#createAdaptiveExtension创建自适应扩展实现

**这里的步骤和上面讲的ExtensionLoader#createExtension方法差不多，但是并没有对自适应扩展实现进行wrapper包装：**

**1、** 调用getAdaptiveExtensionClass方法获取或者创建自适应扩展实现的class并且反射调用无参构造器实例化；

2. 调用所有ExtensionPostProcessor#postProcessBeforeInitialization方法执行前置处理。。
**3、** 对扩展实例进行setter方法注入，即Dubbo的IoC；

4. 调用所有ExtensionPostProcessor#postProcessAfterInitialization方法执行后置处理。
5. 初始化扩展，如果当前扩展实例是Lifecycle类型则调用Lifecycle#initialize初始化方法。

```java
private T createAdaptiveExtension() {
    try {
        //获取自适应扩展实现的class并且反射调用构造器实例化
        T instance = (T) getAdaptiveExtensionClass().newInstance();
        //调用所有ExtensionPostProcessor#postProcessBeforeInitialization方法执行前置处理。
        instance = postProcessBeforeInitialization(instance, null);
        //对扩展实例进行setter方法注入，即Dubbo的IoC。
        injectExtension(instance);
        //调用所有ExtensionPostProcessor#postProcessAfterInitialization方法执行后置处理。
        instance = postProcessAfterInitialization(instance, null);
        //初始化扩展，如果当前扩展实例是Lifecycle类型则调用Lifecycle#initialize初始化方法。
        initExtension(instance);
        return instance;
    } catch (Exception e) {
        throw new IllegalStateException("Can't create adaptive extension " + type + ", cause: " + e.getMessage(), e);
    }
}
```

### 5.2 ExtensionLoader#getAdaptiveExtensionClass获取自适应扩展class

首先从SPI文件获取自适应扩展class，如果没有则会实时创建一个class。

**1、** 首先尝试调用一次getExtensionClasses方法获取全部扩展的Class映射，这一步可能会触发SPI文件的加载以及各种缓存的构建；

**2、** 如果缓存的自适应扩展classcachedAdaptiveClass不为null，那么返回该class因为在加载SPI文件的时候会判断其中的扩展实现是或否是自适应扩展，此时就可能会解析到自适应扩展class；

**3、** 如果SPI文件中没有指定自适应扩展，那么调用createAdaptiveExtensionClass方法创建一个自适应扩展class；

```java
private Class<?> getAdaptiveExtensionClass() {
    //获取全部扩展的Class映射，这一步可能会触发SPI文件的加载以及各种缓存的构建
    getExtensionClasses();
    //如果缓存的自适应扩展class不为null，那么返回该class
    if (cachedAdaptiveClass != null) {
        return cachedAdaptiveClass;
    }
    //如果SPI文件中没有指定自适应扩展，那么创建一个
    return cachedAdaptiveClass = createAdaptiveExtensionClass();
}
```

#### 5.2.1 ExtensionLoader#createAdaptiveExtensionClass创建自适应扩展class

**该方法动态创建一个自适应扩展Class。首先根据SPI接口类型type和默认扩展名cachedDefaultName，动态生成自适应扩展类的源码字符串，然后获取自适应编译器:AdaptiveCompiler，最后通过自适应编译器编译源码成为Class，实际的默认编译器为JavassistCompiler。**

**这种动态创建自适应class的SPI接口在dubbo中有很多，例如Protocol、Cluster、LoadBalance等接口，它们的自适应扩展class分别是Protocol A d a p t i v e 、 C l u s t e r Adaptive、Cluster Adaptive、ClusterAdaptive、LoadBalance$Adaptive。**

```java
private Class<?> createAdaptiveExtensionClass() {
    // Adaptive Classes' ClassLoader should be the same with Real SPI interface classes' ClassLoader
    //Adaptive类的ClassLoader应该与真实 SPI接口类的ClassLoader相同
    ClassLoader classLoader = type.getClassLoader();
    try {
        //是否使用native-image编译dubbo的标识符，一般false
        //https://dubbo.apache.org/zh/docs3-v2/java-sdk/reference-manual/graalvm/
        if (NativeUtils.isNative()) {
            return classLoader.loadClass(type.getName() + "$Adaptive");
        }
    } catch (Throwable ignore) {
    }
    //根据SPI接口类型type和默认扩展名cachedDefaultName，动态生成自适应扩展类的源码字符串
    String code = new AdaptiveClassCodeGenerator(type, cachedDefaultName).generate();
    //获取自适应编译器:AdaptiveCompiler
    org.apache.dubbo.common.compiler.Compiler compiler = extensionDirector.getExtensionLoader(
        org.apache.dubbo.common.compiler.Compiler.class).getAdaptiveExtension();
    //通过自适应编译器编译源码成为Class
    return compiler.compile(type, code, classLoader);
}
```

## 6 Dubbo SPI机制的总结

本次我们学习了Dubbo SPI机制的源码，可以发现Dubbo SPI机制相比于Java原生SPI机制更加灵活、性能更强。

下面对于重点进行总结，更多的总结性知识点可以参考此前我们学习的[Dubbo 3.x源码(3)—Dubbo SPI机制的介绍与使用](/zhuanlan/j2ee/dubbo/2/3.html)。

**关于Dubbo IoC：在创建了扩展实例之后，将会通过ExtensionLoader#injectExtension方法进行实例IoC setter注入，即Dubbo的IoC的实现。**

**1、** 首先查找实例的需要注入的setter方法，在这里方法名称开头为set、并且参数只有一个、并且是public的方法，就是setter方法；

**2、** 通过在方法上添加DisableInject注解可以跳过IoC注入，如果方法参数是基本类型、String、Number等原始类型，则同样跳过对该方法的setter注入；

**3、** Dubbo找到需要注入的方法之后，获取注入参数名，实际上就是setter方法的方法名除去开头的set剩下的字符串，并且将首字母改为小写；

**4、** 随后通过ExtensionInjector注入器查找依赖并且执行注入常见的ExtensionInjector，按顺序有以下几种：；

**ScopeBeanExtensionInjector**，领域模型实例扩展注入器，从领域模型内部的ScopeBeanFactory中查找注入的实例。ScopeBeanFactory中存储的是域内部使用的共享bean，参考了Spring的BeanFactory，在CommonScopeModelInitializer可以看到注册，在各种ScopeModelInitializer中也能看到注册。

**SpiExtensionInjector**，Dubbo SPI扩展加载器，如果参数类型支持Dubbo SPI，那么返回该类型接口的自适应扩展实现作为参数实例。

**SpringExtensionInjector**，Spring扩展加载器。从Spring容器中查找注入的实例。

**5、** 以上就是DubboIoC支持注入的对象来源；

**6、** 找到依赖之后，通过反射调用方法执行注入；

**关于DubboAop：WrapperClass是Dubbo中的一个概念，它并不是一个具体的接口，因为一个扩展接口可能有多个扩展实现类，而这些扩展实现类会有一个相同的或者公共的逻辑，因此可以用一个专门的扩展实现类，其内部存放公共的逻辑，方便维护Dubbo基于WrapperClass实现Aop**；

**1、** 如果某个扩展实现类拥有只有一个参数的构造函数，并且参数就是当前扩展接口类型，那么这个扩展实现类就作为WrapperClass包装类，会被记录在cachedWrapperClasses缓存中；

**2、** 后续如果要查找某个名字的实现，那么在对真正的实现类实例化完毕之后，会直接实例化该包装类类型，并在构造器中传入真正的当前实例，然后对于包装类实例也会进行setter注入并且包装类还可以进行多层包装，最后会返回的是最外层的一个包装类的实例；

**3、** 每一层的WrapperClass相当于一个切面，这种方式就是Dubbo对于AOP的支持，将重复的代码逻辑抽取出来，形成复用，如果从设计模式方面来说的话，那就是装饰设计模式；

**关于AdaptiveExtension自适应扩展实现：很多时候，有些扩展实现并不想在框架启动阶段被加载和选择，而是希望在扩展方法被调用时，根据运行时参数进行动态加载和选择Dubbo的SPI增加了自适应扩展机制，可以根据请求时候的参数来动态选择对应的扩展，提高了Dubbo的扩展能力**；

Dubbo的一个SPI扩展点只允许有一个自适应扩展实现在自适应扩展实现的方法中，会在运行的时候动态根据传递的参数（例如来自url的参数）值获取指定的真实扩展实现，随后再调用获取的真实扩展实现完成真正的业务逻辑这是一种代理机制；

Dubbo通过@Adaptive注解标注来表明某个实现是一个自适应实现，这个注解可以修饰在类或者方法上在类上的时候表示该类实例就是自适应扩展实现，在方法上的时候则会生成代理类（默认基于javassist创建代理）** ；

ExtensionLoader#getAdaptiveExtension方法用于获取自适应的ExtensionLoader实现，首先获取缓存cachedAdaptiveInstance的自适应扩展实例，如果没有则调用createAdaptiveExtension方法创建自适应扩展实例，然后设置到cachedAdaptiveInstance缓存中并返回。
