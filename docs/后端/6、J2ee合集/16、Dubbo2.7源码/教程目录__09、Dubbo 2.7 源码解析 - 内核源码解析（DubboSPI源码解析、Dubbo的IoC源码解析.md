# 09、Dubbo 2.7 源码解析 - 内核源码解析（DubboSPI源码解析、Dubbo的IoC源码解析
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/9.html
- 分类：J2EE框架
- 分组：教程目录
## 1. Dubbo 的 SPI 源码解析

> 我们可以直接运行源码中的dubbo-demo模块进行断点调试，只需要修改对应的注册中心地址即可。

下面以Protocol 的获取过程为例来解析 SPI 的执行过程。`入口就在org.apache.dubbo.config.ServiceConfig`

(该类后面讲 Dubbo与Spring 整合、服务发布 的时候会重点讲，现在只要知道有这么个类就好了)

```java
public class ServiceConfig<T> extends AbstractServiceConfig {
    private static final long serialVersionUID = 3033787999037024738L;
    //获取Protocol的自适应扩展类
    private static final Protocol protocol = ExtensionLoader
                    // 加载并缓存了Protocol接口的所有扩展类(四类)
                    .getExtensionLoader(Protocol.class)
                    .getAdaptiveExtension();
	...
}
```

### (1) ExtensionFactory 的 ExtensionLoader 实例的 objectFactory 成员变量是null

先看org.apache.dubbo.common.extension.ExtensionLoader#getExtensionLoader方法：

```java
public class ExtensionLoader<T> {
	...
	//缓存，key是SPI接口，注意是类级别的
	private static final ConcurrentMap<Class<?>, ExtensionLoader<?>> EXTENSION_LOADERS = new ConcurrentHashMap<>();
	...
	public static <T> ExtensionLoader<T> getExtensionLoader(Class<T> type) {
	    if (type == null) {
	        throw new IllegalArgumentException("Extension type == null");
	    }
	    //type不是接口抛异常
	    if (!type.isInterface()) {
	        throw new IllegalArgumentException("Extension type (" + type + ") is not an interface!");
	    }
	    //type不是@SPI注解标识的接口抛异常
	    if (!withExtensionAnnotation(type)) {
	        throw new IllegalArgumentException("Extension type (" + type +
	                ") is not an extension, because it is NOT annotated with @" + SPI.class.getSimpleName() + "!");
	    }
		//缓存获取
	    ExtensionLoader<T> loader = (ExtensionLoader<T>) EXTENSION_LOADERS.get(type);
	    if (loader == null) {
		    //没有就创建
	        EXTENSION_LOADERS.putIfAbsent(type, new ExtensionLoader<T>(type));
	        loader = (ExtensionLoader<T>) EXTENSION_LOADERS.get(type);
	    }
	    return loader;
	}
	...
}
```

进入ExtensionLoader的构造器：

```java
public class ExtensionLoader<T> {
	...
	private final ExtensionFactory objectFactory;
	...
    private ExtensionLoader(Class<?> type) {
	    //构造中，两件事
	    //一个指定了SPI接口的类型
        this.type = type;
        //创建该Loader用来加载扩展类实例的工厂
        //我们现在type是Protocol，objectFactory不为null，走后面逻辑
        //可以看到这个 objectFactory 实例也是通过 SPI方法 获取到的。
        objectFactory = (type == ExtensionFactory.class ? null : ExtensionLoader.getExtensionLoader(ExtensionFactory.class).getAdaptiveExtension());
    }
    ...
}
```

由此可见，要加载一个SPI接口的扩展类实例，首先需要SPI接口对应的ExtensionLoader实例，而ExtensionLoader实例创建过程中，内部需要一个ExtensionFactory的实例，而这个ExtensionFactory实例的加载也是通过DubboSPI机制加载的，所以就需要一个ExtensionFactory的ExtensionLoader实例，而ExtensionFactory的ExtensionLoader实例内部也需要一个ExtensionFactory实例，但从代码中可以看出，如果type为ExtensionFactory.class，那么objectFactory就为null，即`ExtensionFactory的扩展加载器是不需要实例工厂的`(有点绕…)，如下图：

### (2) 获取 ExtensionFactory 的自适应扩展类实例

`ExtensionLoader.getExtensionLoader(ExtensionFactory.class)`方法成功创建ExtensionFactory的ExtensionLoader实例后，我们看它的`getAdaptiveExtension`方法：

```java
public class ExtensionLoader<T> {
	...
	//自适应类实例的缓存
	private final Holder<Object> cachedAdaptiveInstance = new Holder<>();
	//org.apache.dubbo.common.extension.ExtensionLoader#getAdaptiveExtension
    public T getAdaptiveExtension() {
        // 双重检测锁，先从缓存尝试取
        Object instance = cachedAdaptiveInstance.get();
        if (instance == null) {
            if (createAdaptiveInstanceError == null) {
                synchronized (cachedAdaptiveInstance) {
                    instance = cachedAdaptiveInstance.get();
                    if (instance == null) {
                        try {
                            // 创建Adaptive类实例
                            instance = createAdaptiveExtension();
                            cachedAdaptiveInstance.set(instance);
                        } catch (Throwable t) {
                            createAdaptiveInstanceError = t;
                            throw new IllegalStateException("Failed to create adaptive instance: " + t.toString(), t);
                        }
                    }
                }
            } else {
                throw new IllegalStateException("Failed to create adaptive instance: " + createAdaptiveInstanceError.toString(), createAdaptiveInstanceError);
            }
        }
        return (T) instance;
    }
    ...
}
```

> 看下Holder
>
>
>
> ```plaintext
```java 
/**
 * Helper Class for hold a value.
 */
public class Holder<T> {
    //volatile，可见性
    private volatile T value;
    public void set(T value) {
        this.value = value;
    }
    public T get() {
        return value;
    }
}
```

```plaintext
直接看创建Adaptive类实例的核心方法createAdaptiveExtension，两步：
 *  获取到当前type的adaptive类的Class，调用其无参构造创建实例
 *  对创建的实例进行初始化(通过调用该实例的setter完成注入)(不是本节重点，分析Dubbo的IoC的时候重点说)
```java 
public class ExtensionLoader<T> {
	...
	//org.apache.dubbo.common.extension.ExtensionLoader#createAdaptiveExtension
    private T createAdaptiveExtension() {
        try {
            // getAdaptiveExtensionClass() 获取到当前type的adaptive类
            // injectExtension() 参数中的实例，仅仅就是从配置文件中读取到的类
            // 创建的一个实例，没有进行初始化。这个方法就是调用该实例的setter完
            // 成注入(初始化)
            return injectExtension((T) getAdaptiveExtensionClass().newInstance());
        } catch (Exception e) {
            throw new IllegalStateException("Can't create adaptive extension " + type + ", cause: " + e.getMessage(), e);
        }
    }
    ...
}
```

这里我们主要关注getAdaptiveExtensionClass方法：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#getAdaptiveExtensionClass
private Class<?> getAdaptiveExtensionClass() {
    // 读取并缓存配置文件中所有的类(普通扩展类、adpative类、wrapper类、activate类)
    getExtensionClasses();
    // 若显式定义了adaptive类，则返回
    if (cachedAdaptiveClass != null) {
        return cachedAdaptiveClass;
    }
    // 没有显式定义adaptive类，则创建一个adaptive类(后面讲Dubbo动态编译的时候会详细介绍)
    return cachedAdaptiveClass = createAdaptiveExtensionClass();
}
```

这里有三个分支：

- 读取并缓存配置文件中所有的类(普通扩展类、adpative类、wrapper类、activate类)
- 若配置文件中显式定义了adaptive类，则返回显式定义的
- 否则动态编译生成一个adaptive类（分析Dubbo动态编译 Compile 源码的时候重点讲）

重点关注getExtensionClasses方法：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#getExtensionClasses
private Map<String, Class<?>> getExtensionClasses() {
    // cachedClasses 缓存着所有扩展类(不包含adaptive类与wrapper类)
    // 双重检测锁
    Map<String, Class<?>> classes = cachedClasses.get();
    if (classes == null) {
        synchronized (cachedClasses) {
            classes = cachedClasses.get();
            if (classes == null) {
                // 加载配置文件中所有的类
                classes = loadExtensionClasses();
                cachedClasses.set(classes);
            }
        }
    }
    return classes;
}
```

> 这里有个点需要注意：
>
>
> cachedClasses缓存的是扩展类，不包含adaptive类与wrapper类
> loadExtensionClasses方法会加载配置文件中所有的类，并且都会缓存起来，但是方法返回的时候只返回了扩展类(不包含adaptive类和wrapper类)（后面看源码就知道了）

继续看loadExtensionClasses方法：

```java
// synchronized in getExtensionClasses
private Map<String, Class<?>> loadExtensionClasses() {
    // 缓存默认的扩展名
    cacheDefaultExtensionName();
    // 创建一个map，用于存放配置文件中的扩展类(不包含adaptive类与wrapper类)
    Map<String, Class<?>> extensionClasses = new HashMap<>();
    // 加载META-INF/dubbo/internal下的配置文件
    loadDirectory(extensionClasses, DUBBO_INTERNAL_DIRECTORY, type.getName());
    // 兼容2.6版本
    loadDirectory(extensionClasses, DUBBO_INTERNAL_DIRECTORY, type.getName().replace("org.apache", "com.alibaba"));
    // 加载META-INF/dubbo下的配置文件
    loadDirectory(extensionClasses, DUBBO_DIRECTORY, type.getName());
    loadDirectory(extensionClasses, DUBBO_DIRECTORY, type.getName().replace("org.apache", "com.alibaba"));
    // 加载META-INF/services/下的配置文件
    loadDirectory(extensionClasses, SERVICES_DIRECTORY, type.getName());
    loadDirectory(extensionClasses, SERVICES_DIRECTORY, type.getName().replace("org.apache", "com.alibaba"));
    return extensionClasses;
}
```

先看下cacheDefaultExtensionName方法，这里就是通过@SPI注解指定默认扩展名称的地方：

```java
private void cacheDefaultExtensionName() {
    final SPI defaultAnnotation = type.getAnnotation(SPI.class);
    if (defaultAnnotation != null) {
        // 获取SPI注解的value属性
        String value = defaultAnnotation.value();
        // 处理指定了默认名称的情况
        if ((value = value.trim()).length() > 0) {
            String[] names = NAME_SEPARATOR.split(value);
            if (names.length > 1) {
                throw new IllegalStateException("More than 1 default extension name on extension " + type.getName()
                        + ": " + Arrays.toString(names));
            }
            if (names.length == 1) {
            	//cachedDefaultName 存的就是default extension name
                cachedDefaultName = names[0];
            }
        }
    }
}
```

继续看loadDirectory方法，看到被调用很多次，区别就是加载的路径不一样，进入loadDirectory方法：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#loadDirectory
private void loadDirectory(Map<String, Class<?>> extensionClasses, String dir, String type) {
    // 构建要加载的配置文件名称
    String fileName = dir + type;
    try {
	    // 这个文件可能在不同的模块中出现多次，所以这里加载的结果为urls(复数)
        Enumeration<java.net.URL> urls;
        ClassLoader classLoader = findClassLoader();
        if (classLoader != null) {
            urls = classLoader.getResources(fileName);
        } else {
            urls = ClassLoader.getSystemResources(fileName);
        }
        if (urls != null) {
            while (urls.hasMoreElements()) {
                java.net.URL resourceURL = urls.nextElement();
                // 加载
                loadResource(extensionClasses, classLoader, resourceURL);
            }
        }
    } catch (Throwable t) {
        logger.error("Exception occurred when loading extension class (interface: " +
                type + ", description file: " + fileName + ").", t);
    }
}
```

看loadResource方法，具体加载逻辑：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#loadResource
private void loadResource(Map<String, Class<?>> extensionClasses, ClassLoader classLoader, java.net.URL resourceURL) {
    try {
        // try-with-resource 流会自动关
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resourceURL.openStream(), StandardCharsets.UTF_8))) {
            String line;
            //一行一行的处理
            while ((line = reader.readLine()) != null) {
	            //同一行中#号后面的内容会被忽略
                final int ci = line.indexOf('#');
                if (ci >= 0) {
                    line = line.substring(0, ci);
                }
                line = line.trim();
                if (line.length() > 0) {
                    try {
                        String name = null;
	                    //有=号就解析出扩展名，可以没有=号
                        int i = line.indexOf('=');
                        if (i > 0) {
                            name = line.substring(0, i).trim(); // 扩展名
                            line = line.substring(i + 1).trim();  // 扩展类的全限定性类名
                        }
                        //类名不为空则
                        if (line.length() > 0) {
                            // 加载当前遍历的类
                            loadClass(extensionClasses, resourceURL, Class.forName(line, true, classLoader), name);
                        }
                    } catch (Throwable t) {
                        IllegalStateException e = new IllegalStateException("Failed to load extension class (interface: " + type + ", class line: " + line + ") in " + resourceURL + ", cause: " + t.getMessage(), t);
                        exceptions.put(line, e);
                    }
                }
            }
        }
    } catch (Throwable t) {
        logger.error("Exception occurred when loading extension class (interface: " +
                type + ", class file: " + resourceURL + ") in " + resourceURL, t);
    }
}
```

继续看loadClass：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#loadClass
private void loadClass(Map<String, Class<?>> extensionClasses, java.net.URL resourceURL, Class<?> clazz, String name) throws NoSuchMethodException {
    // 若当前类没有实现当前type接口，则抛出异常
    if (!type.isAssignableFrom(clazz)) {
        throw new IllegalStateException("Error occurred when loading extension class (interface: " +
                type + ", class line: " + clazz.getName() + "), class "
                + clazz.getName() + " is not subtype of interface.");
    }
    // 若当前类中被@Adaptive注解标记，则缓存这个adaptive类
    if (clazz.isAnnotationPresent(Adaptive.class)) {
        cacheAdaptiveClass(clazz);
    } else if (isWrapperClass(clazz)) {
       // 处理wrapper类
        cacheWrapperClass(clazz);
    } else {
       // 处理普通扩展类与activate类
        // 这句话说明，扩展类必须有无参构造器
        // 若没有，下面的语句直接抛出异常
        clazz.getConstructor();
        // 处理没有指定扩展名的情况
        if (StringUtils.isEmpty(name)) {
            // 为当前类找一个扩展名
            name = findAnnotationName(clazz);
            if (name.length() == 0) {
                throw new IllegalStateException("No such extension name for the class " + clazz.getName() + " in the config " + resourceURL);
            }
        }
        // 使用逗号分隔出所有扩展名
        String[] names = NAME_SEPARATOR.split(name);
        if (ArrayUtils.isNotEmpty(names)) {
            // 缓存activate类的第一个名称，
            // 并没有在这里缓存这个类
            cacheActivateClass(clazz, names[0]);
            // 缓存第一个扩展名及扩展类
            // 注意，若一个扩展类有多个名称，那么这多个名称都会与这个扩展类配对放入到map中
            for (String n : names) {
                cacheName(clazz, n);
                saveInExtensionClass(extensionClasses, clazz, n);
            }
        }
    }
}
```

该方法有三个分支：

- 处理adaptive类
- 处理wrapper类
- 处理普通扩展类和激活扩展类

#### A. 若当前类中出现了@Adaptive注解，则缓存这个adaptive类

```java
//org.apache.dubbo.common.extension.ExtensionLoader#cacheAdaptiveClass
private void cacheAdaptiveClass(Class<?> clazz) {
    // adaptive类只能有一个
    if (cachedAdaptiveClass == null) {
        cachedAdaptiveClass = clazz;
    } else if (!cachedAdaptiveClass.equals(clazz)) {
        throw new IllegalStateException("More than 1 adaptive class found: "
                + cachedAdaptiveClass.getClass().getName()
                + ", " + clazz.getClass().getName());
    }
}
```

`由此可见adaptive类只能有一个`

#### B. 处理wrapper类

先看怎么判断该类是wrapper类，isWrapperClass方法：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#isWrapperClass
private boolean isWrapperClass(Class<?> clazz) {
    try {
        // 若当前类中具有带一个参数的构造器(这个参数必须是当前的SPI类型)
        // 则什么也不做，否则抛出异常
        clazz.getConstructor(type);
        return true;
    } catch (NoSuchMethodException e) {
        return false;
    }
}
```

由此可见只要这个类包含一个`单个参数，且参数就是SPI类型的的构造器`则认为是wrapper类

缓存wrapper类，cacheWrapperClass方法：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#cacheWrapperClass
private void cacheWrapperClass(Class<?> clazz) {
    // 一个SPI可以有多个wrapper
    if (cachedWrapperClasses == null) {
    	// 并且注意,ConcurrentHashSet的key是无序的
        cachedWrapperClasses = new ConcurrentHashSet<>();
    }
    cachedWrapperClasses.add(clazz);
}
```

#### C. 处理普通扩展类与activate类

```java
//org.apache.dubbo.common.extension.ExtensionLoader#loadClass
private void loadClass(Map<String, Class<?>> extensionClasses, java.net.URL resourceURL, Class<?> clazz, String name) throws NoSuchMethodException {
	...
    } else {
       // 处理普通扩展类与activate类
        // 这句话说明，扩展类必须有无参构造器
        // 若没有，下面的语句直接抛出异常
        clazz.getConstructor();
        // 处理没有指定扩展名的情况
        if (StringUtils.isEmpty(name)) {
            // 为当前类找一个扩展名
            name = findAnnotationName(clazz);
            if (name.length() == 0) {
                throw new IllegalStateException("No such extension name for the class " + clazz.getName() + " in the config " + resourceURL);
            }
        }
        // 使用逗号分隔出所有扩展名
        String[] names = NAME_SEPARATOR.split(name);
        if (ArrayUtils.isNotEmpty(names)) {
            // 缓存activate类的第一个名称，
            // 并没有在这里缓存这个类
            cacheActivateClass(clazz, names[0]);
            for (String n : names) {
            	// cacheName方法只会缓存第一个扩展名及扩展类
                cacheName(clazz, n);
                // 注意，若一个扩展类有多个名称，那么这多个名称都会与这个扩展类配对放入到map中
                saveInExtensionClass(extensionClasses, clazz, n);
            }
        }
    }
}
```

> 注意，一个类是可以配置多个扩展名的：

这里一共做了四件事：

- a. 处理没有指定扩展名的情况
- b. 缓存activate类的Activate注解对象
- c. 缓存第一个扩展名及扩展类
- d. 将扩展类放入extensionClasses(Map)

**a. 处理没有指定扩展名的情况**

看findAnnotationName方法，为当前类找一个扩展名：

- 如果类上被@Extension注解标记(该注解已经过时)，则使用注解的value作为扩展名
- 没有出现，则获取类的简单类名，如果类名符合 “前缀”+接口名 的规范，则取“前缀”作为扩展名

```java
private String findAnnotationName(Class<?> clazz) {
    // 查看当前类上是否出现了@Extension注解
    org.apache.dubbo.common.Extension extension = clazz.getAnnotation(org.apache.dubbo.common.Extension.class);
    // 若没有@Extension注解，则获取当前类的简单类名，
    // 然后去掉SPI接口字符串，剩余的部分全小写，即为该类的默认扩展名
    if (extension == null) {
        String name = clazz.getSimpleName();
        if (name.endsWith(type.getSimpleName())) {
            name = name.substring(0, name.length() - type.getSimpleName().length());
        }
        return name.toLowerCase();
    }
    return extension.value();
}
```

> @Extension注解：
>
> 虽然过时了，但是可以通过注解方式指定扩展名
>
>
>
> 注意该注解专门用来定义扩展名的，不能完全代替配置文件的
>
> 注解方式指定扩展名后，配置文件中可以把扩展名去掉，但是类名不能去掉

由此可见有三种方式指定前缀，按优先级顺序：

- 配置文件中=号方式指定
- @Extension注解指定
- 实现类命名规范符合： 前缀+SPI接口名，则取前缀全小写，否则就是整个实现类简单类名

**b. 缓存activate类的Activate注解对象**

我们看cacheActivateClass(clazz, names[0])方法，注意传参中，第二个参数是names[0]，如果扩展名有多个，传的是第一个，这里只会缓存activate类的第一个扩展名称：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#cacheActivateClass
private void cacheActivateClass(Class<?> clazz, String name) {
	// 判断是否被@Activate注解标记
    Activate activate = clazz.getAnnotation(Activate.class);
    if (activate != null) {
	    //注意，这里缓存的activate是注解对象
        cachedActivates.put(name, activate);
    } else {
        // 兼容2.6版本
        // support com.alibaba.dubbo.common.extension.Activate
        com.alibaba.dubbo.common.extension.Activate oldActivate = clazz.getAnnotation(com.alibaba.dubbo.common.extension.Activate.class);
        if (oldActivate != null) {
            cachedActivates.put(name, oldActivate);
        }
    }
}
```

注意：

- cachedActivates中缓存的key是Activate类的第一个扩展名称，而value是Activate注解对象，并不是Activate类的Class!!

> Activate类代表的激活的扩展类，就是扩展类，所以类的缓存处理就是按照普通扩展类处理的，这里并没有缓存类

**c. 缓存第一个扩展名及扩展类**

虽然外部循环遍历了所有扩展名，每次遍历都调用了cacheName方法：

```java
/**
 * cache name
 */
private void cacheName(Class<?> clazz, String name) {
    // 缓存第1个名称
    if (!cachedNames.containsKey(clazz)) {
        cachedNames.put(clazz, name);
    }
}
```

注意：因为key是Class，所以这里只会缓存第一个名称，后面进来的都不会覆盖

**d. 无论普通扩展类还是Activate类，都将其放入extensionClasses**

```java
private void saveInExtensionClass(Map<String, Class<?>> extensionClasses, Class<?> clazz, String name) {
    Class<?> c = extensionClasses.get(name);
    if (c == null) {
        extensionClasses.put(name, clazz);
    } else if (c != clazz) {
        throw new IllegalStateException("Duplicate extension " + type.getName() + " name " + name + " on " + c.getName() + " and " + clazz.getName());
    }
}
```

若一个扩展类有多个名称，那么这多个名称都会与这个扩展类配对放入到map中

### (3) 获取 Protocol 的 extensionLoader

上面代码执行完毕，一层层的返回，回到getAdaptiveExtensionClass方法：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#getAdaptiveExtensionClass
private Class<?> getAdaptiveExtensionClass() {
    // 读取并缓存配置文件中所有的类（普通扩展类、adpative类、wrapper类、activate类）
    getExtensionClasses();
    // 若显式定义了adaptive类，则返回
    if (cachedAdaptiveClass != null) {
        return cachedAdaptiveClass;
    }
    // 没有显式定义adaptive类，则创建一个adaptive类
    return cachedAdaptiveClass = createAdaptiveExtensionClass();
}
```

通过之前的分析，可以知道getExtensionClasses方法执行完毕后，会缓存配置文件中所有的类，此时如果显式定义了adaptive类，则cachedAdaptiveClass就是缓存的adaptive类，如果没显式定义，则会动态编译生成一个Adaptive类，无论怎样，总会返回一个Adaptive类的Class，然后通过Class创建实例，最终一层层返回，到如下图：

> 此时跟的是ExtensionFactory的加载流程，ExtensionFactory是有显式定义Adaptive类的：org.apache.dubbo.common.extension.factory.AdaptiveExtensionFactory

此时Protocol 的 ExtensionLoader 的 objectFactory 实例就创建完毕。返回其调用语句。

最后第131 行返回这个新创建的 loader，返回给该 getExtensionLoader(Protocol.class)方法的调用语句。

### (4) 获取 Protocol 的自适应扩展类实例

此时再跟踪 getAdaptiveExtension()方法，是通过刚才获取到的 Protocol 的extensionLoader 对象获取 Protocol 的自适应实例。其执行过程与前面的相同。

唯一的区别就是Protocol接口没有显式定义Adaptice类，所以会通过动态编译的方式生成Adaptive类，createAdaptiveExtensionClass方法等下一章分析Dubbo 的动态编译 Compile 源码时详细讲。

## 2. Dubbo 的 IoC 源码解析

之前分析SPI机制，是以 Protocol 的获取过程为例来分析的，现在我们换一个流程跟，跟dubbo启动时第一个使用SPI机制加载的扩展类ZookeeperDynamicConfigurationFactory：

> 首先要知道dubbo应用启动的时候，会从配置中心获取动态配置，为我们启动做一些准备，准备运行环境等。
>
> 如果项目没有指定配置中心，它会默认使用注册中心做配置中心，即通常情况下配置中心也是ZK
>
> Dubbo就是通过org.apache.dubbo.configcenter.support.zookeeper.ZookeeperDynamicConfigurationFactory类从ZK中获取动态配置：
>
>
>
> ```plaintext
```java 
public class ZookeeperDynamicConfigurationFactory extends AbstractDynamicConfigurationFactory {
    //既然要从ZK读取动态配置，就需要ZK的客户端，就是ZookeeperTransporter 
    private ZookeeperTransporter zookeeperTransporter;
    //通过set方法注入
    public void setZookeeperTransporter(ZookeeperTransporter zookeeperTransporter) {
        this.zookeeperTransporter = zookeeperTransporter;
    }
    @Override
    protected DynamicConfiguration createDynamicConfiguration(URL url) {
        return new ZookeeperDynamicConfiguration(url, zookeeperTransporter);
    }
}
```

```plaintext
> 
>为什么说ZookeeperTransporter就是ZK客户端，看下ZookeeperTransporter：  
>![&nbsp;][nbsp 10]
> 
>ZookeeperDynamicConfigurationFactory 本身也是通过SPI方式创建的，通过SPI源码分析我们知道它会获取该类的无参构造器new出来对象，但是它的成员变量zookeeperTransporter是怎么注入进来的呢？这个就是Dubbo IOC要做的工作
之前分析SPI源码的时候已经碰到了，但没有细究：  
org.apache.dubbo.common.extension.ExtensionLoader\#getAdaptiveExtension  
org.apache.dubbo.common.extension.ExtensionLoader\#createAdaptiveExtension
```java 
private T createAdaptiveExtension() {
    try {
        // getAdaptiveExtensionClass() 获取到当前type的adaptive类
        // injectExtension() 参数中的实例，仅仅就是从配置文件中读取到的类创建的一个实例，
        // 没有进行初始化。这个方法就是调用该实例的setter完成注入(初始化)
        return injectExtension((T) getAdaptiveExtensionClass().newInstance());
    } catch (Exception e) {
        throw new IllegalStateException("Can't create adaptive extension " + type + ", cause: " + e.getMessage(), e);
    }
}
```

其中这个injectExtension方法就会通过调用实例的set方法注入完成初始化

### 2.1 通过加载配置中心流程，找到 IoC 代码

入口在org.apache.dubbo.config.ServiceConfig#export(谁调的它先不管，后面分析"服务发布"的时候会详细分析走这个流程)

```java
public class ServiceConfig<T> extends AbstractServiceConfig {
	...
	//org.apache.dubbo.config.ServiceConfig#export
    public synchronized void export() {
        // 检查并更新子配置(子标签)
        checkAndUpdateSubConfigs();
        // 若配置的是不发布服务，则直接结束
        if (!shouldExport()) {
            return;
        }
        // 判断是否延迟发布
        if (shouldDelay()) {
            // 定义定时任务     this::doExport Lambda中的实例方法引用
            DELAY_EXPORT_EXECUTOR.schedule(this::doExport, getDelay(), TimeUnit.MILLISECONDS);
        } else {
            // 直接发布
            doExport();
        }
    }
	...
}
```

> 什么是子标签：

这里主要跟checkAndUpdateSubConfigs

```java
//org.apache.dubbo.config.ServiceConfig#checkAndUpdateSubConfigs
public void checkAndUpdateSubConfigs() {
    // Use default configs defined explicitly on global configs
    completeCompoundConfigs();
    // Config Center should always being started first.
	// 注册中心没有配置的话这里是不会启动的
    startConfigCenter();
    // 一堆注册中心相关的检查
    checkDefault();
    checkProtocol();
    checkApplication();
    // if protocol is not injvm checkRegistry
    // 若不是只本地暴露，则检查注册中心的配置
    if (!isOnlyInJvm()) {
	    //检查注册中心的配置
        checkRegistry();
    }
    this.refresh();
    checkMetadataReport();
    if (StringUtils.isEmpty(interfaceName)) {
        throw new IllegalStateException("<dubbo:service interface=\"\" /> interface not allow null!");
    }
	...
    checkStubAndLocal(interfaceClass);
    checkMock(interfaceClass);
}
```

看checkRegistry方法，检查注册中心的配置：

```java
//父类抽象类方法
//org.apache.dubbo.config.AbstractInterfaceConfig#checkRegistry
protected void checkRegistry() {
	//过时的一种加载注册中心的方式
    loadRegistriesFromBackwardConfig();
    convertRegistryIdsToRegistries();
    // 这里可以保证所有注册中心都是可用的
    for (RegistryConfig registryConfig : registries) {
        if (!registryConfig.isValid()) {
            throw new IllegalStateException("No registry config found or it's not a valid config! " +
                    "The registry config is: " + registryConfig);
        }
    }
    // 代码运行到这里，说明所有注册中心都是可用的
    // 若没有设置配置中心，则将注册中心作为配置中心使用
    useRegistryForConfigIfNecessary();
}
```

跟useRegistryForConfigIfNecessary方法，用注册中心作为配置中心，如果需要的话：

```java
//org.apache.dubbo.config.AbstractInterfaceConfig#useRegistryForConfigIfNecessary
private void useRegistryForConfigIfNecessary() {
	//遍历注册中心，如果存在zookeeper的注册中心，取第一个，并执行下面逻辑
    registries.stream().filter(RegistryConfig::isZookeeperProtocol).findFirst().ifPresent(rc -> {
        // we use the loading status of DynamicConfiguration to decide whether ConfigCenter has been initiated.
        // java.util.Optional#orElseGet逻辑：getDynamicConfiguration返回的
        // Optional中的value不为null则就返回该值，否则执行下面代码
        // 即获取动态配置 ，如果不存在，说明配置中心还没初始化并启动
        // 则用注册中心作为配置中心，再次启动配置中心
        Environment.getInstance().getDynamicConfiguration().orElseGet(() -> {
            ConfigManager configManager = ConfigManager.getInstance();
            ConfigCenterConfig cc = configManager.getConfigCenter().orElse(new ConfigCenterConfig());
            // rc就是RegistryConfig
            // cc就是ConfigCenterConfig
            // 若没有设置配置中心，则将注册中心作为配置中心
            // 将注册中心的协议，地址给注册中心
            cc.setProtocol(rc.getProtocol());
            cc.setAddress(rc.getAddress());
            cc.setHighestPriority(false);
            setConfigCenter(cc);
            // 再次启动配置中心（之前执行过该方法，如果配置中心不存在不会启动）
            startConfigCenter();
            return null;
        });
    });
}
```

跟startConfigCenter，再次尝试启动配置中心：

```java
//org.apache.dubbo.config.AbstractInterfaceConfig#startConfigCenter
void startConfigCenter() {
    if (configCenter == null) {
        ConfigManager.getInstance().getConfigCenter().ifPresent(cc -> this.configCenter = cc);
    }
	// 此时configCenter肯定不为null
    if (this.configCenter != null) {
        // TODO there may have duplicate refresh
        this.configCenter.refresh();
        // 准备运行环境
        // 从配置中心获取动态配置
        prepareEnvironment();
    }
    ConfigManager.getInstance().refreshAll();
}
```

跟prepareEnvironment，准备运行环境：

```java
//org.apache.dubbo.config.AbstractInterfaceConfig#prepareEnvironment
private void prepareEnvironment() {
    if (configCenter.isValid()) {
        if (!configCenter.checkOrUpdateInited()) {
            return;
        }
        // 核心代码在这：
        // 从指定的配置中心获取动态配置
        DynamicConfiguration dynamicConfiguration = getDynamicConfiguration(configCenter.toUrl());
        // 从获取的动态配置中获取内容，对内容进行解析...
        String configContent = dynamicConfiguration.getProperties(configCenter.getConfigFile(), configCenter.getGroup());
        String appGroup = application != null ? application.getName() : null;
        String appConfigContent = null;
        if (StringUtils.isNotEmpty(appGroup)) {
            appConfigContent = dynamicConfiguration.getProperties
                    (StringUtils.isNotEmpty(configCenter.getAppConfigFile()) ? configCenter.getAppConfigFile() : configCenter.getConfigFile(),
                     appGroup
                    );
        }
        try {
            Environment.getInstance().setConfigCenterFirst(configCenter.isHighestPriority());
            Environment.getInstance().updateExternalConfigurationMap(parseProperties(configContent));
            Environment.getInstance().updateAppExternalConfigurationMap(parseProperties(appConfigContent));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to parse configurations from Config Center.", e);
        }
    }
}
```

核心代码就是getDynamicConfiguration，从指定的配置中心获取动态配置：

```java
//org.apache.dubbo.config.AbstractInterfaceConfig#getDynamicConfiguration
private DynamicConfiguration getDynamicConfiguration(URL url) {
    DynamicConfigurationFactory factories = ExtensionLoader
			// 获取DynamicConfigurationFactory的扩展加载器
            // 底层：加载并缓存指定SPI接口的所有扩展类(四类)
            .getExtensionLoader(DynamicConfigurationFactory.class)
            // 获取指定名称的扩展类实例
            // 此时url.getProtocol值应该为zookeeper
            .getExtension(url.getProtocol());
    DynamicConfiguration configuration = factories.getDynamicConfiguration(url);
    Environment.getInstance().setDynamicConfiguration(configuration);
    return configuration;
}
```

> 断点：

我们继续跟getExtension方法：

```java
//org.apache.dubbo.common.extension.ExtensionLoader#getExtension
public T getExtension(String name) {
    if (StringUtils.isEmpty(name)) {
        throw new IllegalArgumentException("Extension name == null");
    }
    if ("true".equals(name)) {
        return getDefaultExtension();
    }
    final Holder<Object> holder = getOrCreateHolder(name);
    Object instance = holder.get();
    if (instance == null) {
        synchronized (holder) {
            instance = holder.get();
            if (instance == null) {
		        // 创建扩展类实例
                // 创建、setter及wrapper指定名称的扩展类实例
                instance = createExtension(name);
                holder.set(instance);
            }
        }
    }
    return (T) instance;
}
```

第一次获取肯定为null，走createExtension方法，创建扩展类实例，该方法有三个核心步骤：

- 创建扩展类实例
- set注入
- wrapper装饰

```java
private T createExtension(String name) {
	// 此时name是"zookeeper"
    // getExtensionClasses() 之前跟过，获取到当前type的所有扩展类(不包含adaptive与wrapper)
    // 获取指定功能性扩展名所对应的扩展类
    Class<?> clazz = getExtensionClasses().get(name);
    if (clazz == null) {
        throw findException(name);
    }
    try {
        T instance = (T) EXTENSION_INSTANCES.get(clazz);
        if (instance == null) {
            // 创建这个类的实例
            // 此时就是ZookeeperDynamicConfigurationFactory的实例
            EXTENSION_INSTANCES.putIfAbsent(clazz, clazz.newInstance());
            instance = (T) EXTENSION_INSTANCES.get(clazz);
        }
        // 调用instance的setter注入，完成初始化
        injectExtension(instance);
        // 从缓存获取当前SPI接口的所有wrapper类
        // 注意是Set集合，无序的
        Set<Class<?>> wrapperClasses = cachedWrapperClasses;
        if (CollectionUtils.isNotEmpty(wrapperClasses)) {
            // 遍历所有wrapper，逐层包装instance
            for (Class<?> wrapperClass : wrapperClasses) {
                instance = injectExtension((T) wrapperClass.getConstructor(type).newInstance(instance));
            }
        }
        return instance;
    } catch (Throwable t) {
        throw new IllegalStateException("Extension instance (name: " + name + ", class: " +
                type + ") couldn't be instantiated: " + t.getMessage(), t);
    }
}
```

关于Dubbo IOC的内容就在方法injectExtension中

### 2.2 injectExtension()

```java
//org.apache.dubbo.common.extension.ExtensionLoader#injectExtension
private T injectExtension(T instance) {
    try {
	    //只有ExtensionFactory的ExtensionLoader的objectFactory为空
        if (objectFactory != null) {
            // 遍历当前instance的所有方法
            for (Method method : instance.getClass().getMethods()) {
                // 判断当前遍历的方法是否是setter
                if (isSetter(method)) {
                    /**
                     * Check {@link DisableInject} to see if we need auto injection for this property
                     */
                    // 若方法上有@DisableInject注解，表示该方法不是用于注入的setter，
                    // 虽然其方法签名符合setter的标准
                    if (method.getAnnotation(DisableInject.class) != null) {
                        continue;
                    }
                    // 获取到setter方法的参数类型
                    Class<?> pt = method.getParameterTypes()[0];
                    // 若当前setter的参数类型为基本数据类型，则不进行处理
                    if (ReflectUtils.isPrimitives(pt)) {
                        continue;
                    }
                    try {
                        // 获取setter方法的形参名称
                        String property = getSetterProperty(method);
                        // 通过objectFactory获取指定类型与名称的扩展类实例
                        // 这里就是ExtensionFactory的工作过程：其会尝试通过SPI与Spring容器获取指定实例
                        // 注意此时objectFactory是AdaptiveExtensionFactory，自适应的 
                        Object object = objectFactory.getExtension(pt, property);
                        // 若实例不为null，则调用该instance的setter方法，方法参数是刚刚获取到
                        // 的那个object实例
                        if (object != null) {
                            method.invoke(instance, object);
                        }
                    } catch (Exception e) {
                        logger.error("Failed to inject via method " + method.getName()
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

> 怎么判断是否是Set方法
>
>
>
> ```plaintext
```java 
private boolean isSetter(Method method) {
    //set开头、参数只有一个、方法是public
    return method.getName().startsWith("set")
            && method.getParameterTypes().length == 1
            && Modifier.isPublic(method.getModifiers());
}
```

```plaintext
### 2.3 Dubbo IOC的关键ExtensionFactory
现在我们看objectFactory.getExtension(pt, property)方法，注意objectFactory是AdaptiveExtensionFactory，自适应的：
```java 
@Adaptive
public class AdaptiveExtensionFactory implements ExtensionFactory {
    private final List<ExtensionFactory> factories;
    public AdaptiveExtensionFactory() {
        ExtensionLoader<ExtensionFactory> loader = ExtensionLoader.getExtensionLoader(ExtensionFactory.class);
        List<ExtensionFactory> list = new ArrayList<ExtensionFactory>();
        for (String name : loader.getSupportedExtensions()) {
            list.add(loader.getExtension(name));
        }
        //unmodifiableList，将list变成不可修改
        factories = Collections.unmodifiableList(list);
    }
    @Override
    public <T> T getExtension(Class<T> type, String name) {
        // 遍历SPI与Spring容器，查找相应的扩展类实例
        // 先跟的是SPI
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

通过构造其实可以看出来，factories是所有ExtensionFactory接口的扩展类实例，全局搜索ExtensionFactory的配置文件，最终会发现有两个ExtensionFactory的扩展类，SPI和Spring容器。并且顺序是先执行SPI。

> 断点先看一下：

#### 2.3.1 SpiExtensionFactory

先跟SPI的ExtensionFactory：

```java
/**
 * SpiExtensionFactory
 */
public class SpiExtensionFactory implements ExtensionFactory {
    @Override
    public <T> T getExtension(Class<T> type, String name) {
        // 判断当前type是否是SPI接口
        if (type.isInterface() && type.isAnnotationPresent(SPI.class)) {
            ExtensionLoader<T> loader = ExtensionLoader.getExtensionLoader(type);
            // 若当前type的扩展类(不包含adaptive与wrapper)不为空，则获取该类型的
            // adaptive类，进行自适应获取
            if (!loader.getSupportedExtensions().isEmpty()) {
                return loader.getAdaptiveExtension();
            }
        }
        return null;
    }
}
```

#### 2.3.2 SpringExtensionFactory

如果不是SPI的接口，或者该SPI接口下没有定义扩展类，则使用 Spring 容器获取。

- 先根据名称获取
- 名称获取不到根据类型获取

```java
/**
 * SpringExtensionFactory
 */
public class SpringExtensionFactory implements ExtensionFactory {
	...
    @Override
    @SuppressWarnings("unchecked")
    public <T> T getExtension(Class<T> type, String name) {
        //SPI should be get from SpiExtensionFactory
        // 若type为SPI接口，则直接返回null
        if (type.isInterface() && type.isAnnotationPresent(SPI.class)) {
            return null;
        }
        // 能走到这里，说明当前type为普通接口
        // 根据  名称  从所有spring容器中查找bean
        for (ApplicationContext context : CONTEXTS) {
	        // 注意，这个name是set方法上的形参名称
            if (context.containsBean(name)) {
                Object bean = context.getBean(name);
                if (type.isInstance(bean)) {
                    return (T) bean;
                }
            }
        }
        logger.warn("No spring extension (bean) named:" + name + ", try to find an extension (bean) of type " + type.getName());
        // 当前type不能是Object类型
        if (Object.class == type) {
            return null;
        }
        // 根据  类型  从所有spring容器中查找bean
        for (ApplicationContext context : CONTEXTS) {
            try {
                return context.getBean(type);
            } catch (NoUniqueBeanDefinitionException multiBeanExe) {
	            //超出一个抛出异常
                logger.warn("Find more than 1 spring extensions (beans) of type " + type.getName() + ", will stop auto injection. Please make sure you have specified the concrete parameter type and there's only one extension of that type.");
            } catch (NoSuchBeanDefinitionException noBeanExe) {
                if (logger.isDebugEnabled()) {
                    logger.debug("Error when get spring extension(bean) for type:" + type.getName(), noBeanExe);
                }
            }
        }
        logger.warn("No spring extension (bean) named:" + name + ", type:" + type.getName() + " found, stop get bean.");
        return null;
    }
	...
}
```
