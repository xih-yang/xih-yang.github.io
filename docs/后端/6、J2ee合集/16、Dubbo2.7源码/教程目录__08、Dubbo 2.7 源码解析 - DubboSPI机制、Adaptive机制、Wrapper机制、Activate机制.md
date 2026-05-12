# 08、Dubbo 2.7 源码解析 - DubboSPI机制、Adaptive机制、Wrapper机制、Activate机制
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/3/8.html
- 分类：J2EE框架
- 分组：教程目录
Dubbo 的内核解析

> 所谓 Dubbo 的内核是指，Dubbo 中所有功能都是基于它之上完成的，都是由它作为基础的。Dubbo 内核的工作原理由四部分构成：服务发现机制 SPI、自适应机制 Adaptive、包装机制 Wrapper 与激活机制 Activate。
>
> Dubbo 通过这四种机制实现了对插件的 IoC、AOP，实现了对自动生成类的动态编译 Compile。

## 1. JDK 的 SPI 机制

### 1.1 简介

SPI，Service Provider Interface，服务提供者接口，是一种服务发现机制。

### 1.2 JDK 的 SPI 规范

JDK的 SPI 规范规定：

- 接口名：可随意定义
- 实现类名：可随意定义
- 提供者配置文件路径：其查找的目录为 META-INF/services
- 提供者配置文件名称：接口的全限定性类名，没有扩展名。
- 提供者配置文件内容：该接口的所有实现类的全限类性类名写入到该文件中，一个类名占一行

### 1.3 代码举例 12-jdkspi

#### (1) 定义工程

创建一个 Maven 的 Java 工程。

#### (2) 定义接口

```java
public interface SomeService {
    void hello();
}
```

#### (3) 定义两个实现类

```java
public class OneServiceImpl implements SomeService {
    public void hello() {
        System.out.println("执行OneServiceImpl的hello()");
    }
}
public class TwoServiceImpl implements SomeService {
    public void hello() {
        System.out.println("执行TwoServiceImpl的hello()");
    }
}
```

#### (4) 创建目录与配置文件

#### (5) 定义配置文件内容

```java
com.abc.service.OneServiceImpl
com.abc.service.TwoServiceImpl
```

#### (6) 定义服务消费者类

```java
public class SPITest {
    public static void main(String[] args) {
        ServiceLoader<SomeService> loader = ServiceLoader.load(SomeService.class);
        Iterator<SomeService> iterator = loader.iterator();
        while (iterator.hasNext()) {
            SomeService service = iterator.next();
            service.hello();
            // OneServiceImpl service1 = new OneServiceImpl();
            // service1.hello();
            // 缺点：
            // 不能指定只调用其中某一个实现类
        }
    }
}
```

#### (7) 测试

#### (8) 源码解析

```java
/**
 * A simple service-provider loading facility.
 * 一个简单的服务提供者加载工具。
 * 
 * ...
 * <p><a name="format"> A service provider is identified by placing a
 * <i>provider-configuration file</i> in the resource directory
 * <tt>META-INF/services</tt>.</a>  The file's name is the fully-qualified <a
 * href="../lang/ClassLoader.html#name">binary name</a> of the service's type.
 * The file contains a list of fully-qualified binary names of concrete
 * provider classes, one per line.  Space and tab characters surrounding each
 * name, as well as blank lines, are ignored.  The comment character is
 * <tt>'#'</tt> (<tt>'\u0023'</tt>,
 * <font style="font-size:smaller;">NUMBER SIGN</font>); on
 * each line all characters following the first comment character are ignored.
 * The file must be encoded in UTF-8.
 * 
 * 通过在资源目录META-INF/services中放置提供者-配置文件，可以识别服务提供者。
 * 文件的名称是服务类型的完全限定二进制名称。该文件包含具体提供程序类的全限定二
 * 进制名称列表，每行一个。忽略每个名称周围的空格和制表符以及空白行。注释字符为
 * '#';在每行中，第一个注释字符之后的所有字符都将被忽略。该文件必须用UTF-8编码。
 * ...
 */
 public final class ServiceLoader<S> implements Iterable<S>{
     ...}
```

## 2. Dubbo 的 SPI

Dubbo 并没有直接使用 JDK 的 SPI，而是在其基础之上对其进行了改进。

### 2.1 规范说明

Dubbo 的 SPI 规范是：

- 接口名：可以随意定义
- 实现类名：在接口名前添加一个用于表示自身功能的“标识前辍”字符串
- 提供者配置文件路径：在依次查找的目录为
- META-INF/dubbo/internal
- META-INF/dubbo
- META-INF/services
- 提供者配置文件名称：接口的全限定性类名，无需扩展名
- 提供者配置文件内容：文件的内容为 key=value 形式，value 为该接口的实现类的全限类性类名，key 可以随意，但一般为该实现类的“标识前辍”(首字母小写)。一个类名占一行。
- 提供者加载：ExtensionLoader 类相当于 JDK SPI 中的 ServiceLoader 类，用于加载提供者配置文件中指定的实现类，并创建相应的实例。

> Dubbo源码举例：
>
>
>
> 配置文件：
>
>
>
> 文件内容：

ExtensionLoader类getExtension(String)方法：

该方法可以根据“标识前缀”获取对应的实现类的实例，但它不是静态方法，所以使用前需要先获取ExtensionLoader实例。

```java
//org.apache.dubbo.common.extension.ExtensionLoader#getExtension
/**
 * Find the extension with the given name. If the specified name is not found, then {@link IllegalStateException}
 * will be thrown.
 */
@SuppressWarnings("unchecked")
public T getExtension(String name) {
	//这个name就是“标识前辍”
    if (name == null || name.length() == 0) {
        throw new IllegalArgumentException("Extension name == null");
    }
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

静态方法getExtensionLoader可以获取ExtensionLoader实例：

该方法入参是一个Class，可以传需要扩展的接口的Class，即`一个接口一个ExtensionLoader实例`，这样不同接口的实现类如果前缀相同不会相互影响。

```java
//org.apache.dubbo.common.extension.ExtensionLoader#getExtensionLoader
public static <T> ExtensionLoader<T> getExtensionLoader(Class<T> type) {
	//type就是接口
    if (type == null) {
        throw new IllegalArgumentException("Extension type == null");
    }
    if (!type.isInterface()) {
        throw new IllegalArgumentException("Extension type(" + type + ") is not interface!");
    }
    //传入的type，必须要有SPI注解标记为SPI接口
    if (!withExtensionAnnotation(type)) {
        throw new IllegalArgumentException("Extension type(" + type +
                ") is not extension, because WITHOUT @" + SPI.class.getSimpleName() + " Annotation!");
    }
    ExtensionLoader<T> loader = (ExtensionLoader<T>) EXTENSION_LOADERS.get(type);
    if (loader == null) {
        EXTENSION_LOADERS.putIfAbsent(type, new ExtensionLoader<T>(type));
        loader = (ExtensionLoader<T>) EXTENSION_LOADERS.get(type);
    }
    return loader;
}
```

DubboSPI有一个注解`@SPI`，用来标识接口是SPI接口，这样SPI接口就能和普通接口进行区分。

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({
     ElementType.TYPE})
public @interface SPI {
    /**
     * default extension name
     */
    String value() default "";
}
```

> 举例：

### 2.2 Dubbo 的 SPI 举例 13-dubbospi

下面将实现一个下单功能。其支付方式仅支持支付宝或微信两种方式。即这里要定义一个 SPI 接口，其存在两个扩展类。

#### (1) 创建工程

创建一个 Maven 的 Java 工程。

#### (2) 导入依赖

```java
<properties>
	<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
	<maven.compiler.source>1.8</maven.compiler.source>
	<maven.compiler.target>1.8</maven.compiler.target>
</properties>
<dependencies>
	<!--Dubbo依赖-->
	<dependency>
		<groupId>org.apache.dubbo</groupId>
		<artifactId>dubbo</artifactId>
		<version>2.7.3</version>
	</dependency>
	<dependency>
		<groupId>junit</groupId>
		<artifactId>junit</artifactId>
		<version>4.11</version>
		<scope>test</scope>
	</dependency>
</dependencies>
```

#### (3) 定义 SPI 接口

```java
/**
 * 下单接口
 */
@SPI("wechat")
public interface Order {
    // 支付方式
    String way();
}
```

#### (4) 定义两个扩展类

```java
public class AlipayOrder implements Order {
    @Override
    public String way() {
        System.out.println("--- 支付宝way() ---");
        return "支付宝支付方式";
    }
}
public class WeChatOrder implements Order {
    @Override
    public String way() {
        System.out.println("--- 微信way() ---");
        return "微信支付方式";
    }
}
```

#### (5) 定义扩展类配置文件

META-INF/dubbo/internal/com.abc.spi.Order

```java
alipay=com.abc.spi.extension.AlipayOrder
wechat,wechat2=com.abc.spi.extension.WeChatOrder
```

#### (6) 定义测试类

```java
public class OrderTest {
    @Test
    public void test01() {
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        Order alipay = loader.getExtension("alipay");
        System.out.println(alipay.way());
        //同一个实现类，多个名称，是同一个实例
        Order wechat = loader.getExtension("wechat");
        System.out.println(wechat.way());
        Order wechat2 = loader.getExtension("wechat2");
        System.out.println(wechat2 == wechat);
    }
    @Test
    public void test02() {
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        //验证不指定前缀的情况，这里会报错
        //需要依靠 Adaptive 机制
        Order alipay = loader.getExtension(null);
        System.out.println(alipay.way());
    }
}
```

test01：

test02：

## 3. Adaptive 机制

Adaptive 机制，即扩展类的自适应机制。即其可以指定想要加载的扩展名，也可以不指定。若不指定，则直接加载默认的扩展类。即其会自动匹配，做到自适应。其是通过@Adaptive注解实现的。

### 3.1 @Adaptive 注解

`@Adaptive` 注解可以修饰类与方法，其作用相差很大。

#### (1) @Adaptive 修饰类

被@Adapative 修饰的 SPI 接口扩展类称为 Adaptive 类(自适应类)，表示该 SPI 扩展类会按照该`类中指定的方式`获取，即用于`固定实现方式`。其是装饰者设计模式的应用。

> 在dubbo框架中，一共就2个Adaptive类
>
> AdaptiveCompiler：
>
> AdaptiveExtensionFactory：

#### (2) @Adaptive 修饰方法

被@Adapative 修饰 SPI 接口中的方法称为 Adaptive 方法。在 SPI 扩展类中若没有找到Adaptive 类，但系统却发现了 Adapative 方法，就会根据 Adaptive 方法自动为该 SPI 接口动态生成一个 Adaptive 扩展类，并自动将其编译。例如 Protocol 接口中就包含两个 Adaptive方法。

> dubbo框架中Adaptive方法很多：
>
> Protocol：
>
>
>
> Cluster：

### 3.2 Adaptive 类代码举例 14-adaptiveclass

#### (1) 创建工程

复制13-dubbospi 工程，在其基础之上修改。

#### (2) 定义 adaptive 扩展类

```java
@Adaptive
public class AdaptiveOrder implements Order {
	//用于指定要加载的扩展名称
    private String orderName;
    public void setOrderName(String orderName) {
        this.orderName = orderName;
    }
    @Override
    public String way() {
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        Order order;
        if(StringUtils.isEmpty(orderName)) {
	        //若没有指定请求参数，则获取默认的扩展类实例
            order = loader.getDefaultExtension();
        } else {
	        //若指定了请求参数，则获取指定的扩展类实例
            order = loader.getExtension(orderName);
        }
        return order.way();
    }
}
```

#### (3) 修改扩展类配置文件

META-INF/dubbo/internal/com.abc.spi.Order

```java
alipay=com.abc.spi.extension.AlipayOrder
wechat=com.abc.spi.extension.WeChatOrder
adaptive=com.abc.spi.extension.AdaptiveOrder
```

#### (4) 测试 1

```java
public class OrderTest {
    @Test
    public void test01() {
	    //获取Order扩展类的加载对象Loader
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        //获取Order接口的自适应扩展类实例
        Order adaptiveExtension = loader.getAdaptiveExtension();
        //指定要加载的扩展名
        ((AdaptiveOrder)adaptiveExtension).setOrderName("wechat");
        System.out.println(adaptiveExtension.way());
    }
}
```

#### (5) 测试 2

```java
public class OrderTest {
    @Test
    public void test02() {
	    //获取Order扩展类的加载对象Loader
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        //获取Order接口的自适应扩展类实例
        Order adaptiveExtension = loader.getAdaptiveExtension();
        // ((AdaptiveOrder)adaptiveExtension).setOrderName("wechat");
        //没有指定会加载默认扩展类
        System.out.println(adaptiveExtension.way());
    }
}
```

#### (5) 测试 3

```java
public class OrderTest {
    @Test
    public void test03() {
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        // 获取真正的扩展类
        // adaptive类不属于SPI接口的真正扩展类
        Set<String> extensions = loader.getSupportedExtensions();
        System.out.println(extensions);
    }
}
```

### 3.3 Adaptive 方法规范

下面我们准备要定义 Adaptive 方法。那么 Adaptive 方法的定义有什么要求呢？我们通过查看动态生成的 Adaptive 类来总结 Adaptive 方法的要求。

#### (1) 动态生成 Adaptive 类格式

其中
adaptiveMethod表示SPI接口中被@Adaptive标记的方法

unAdaptiveMethod表示没有被标记的方法

```java
package <SPI 接口所在包>;
public class SPI 接口名$Adpative implements SPI 接口 {
	public adaptiveMethod (arg0, arg1, ...) {
		// 注意，下面的判断仅对 URL 类型，或可以获取到 URL 类型值的参数进行判断
		// 例如，dubbo 的 Invoker 类型中就包含有 URL 属性
		if(arg1==null) throw new IllegalArgumentException(异常信息)；
		if(arg1.getUrl()==null) throw new IllegalArgumentException(异常信息)；
		URL url = arg1.getUrl();
		// 其会根据@Adaptive 注解上声明的 Key 的顺序，从 URL 获取 Value，
		// 作为实际扩展类。若有默认扩展类，则获取默认扩展类名；否则获取
		// 指定扩展名名。
		String extName = url.get 接口名() == null?默认扩展前辍名:url.get 接口名();
		if(extName==null) throw new IllegalStateException(异常信息);
		SPI 接口 extension = ExtensionLoader.getExtensionLoader(SPI 接口.class)
		.getExtension(extName);
		return extension. adaptiveMethod(arg0, arg1, ...);
	}
	//未被标记的方法尝试用自适应类调用会抛异常
	public unAdaptiveMethod( arg0, arg1, ...) {
		throw new UnsupportedOperationException(异常信息);
	}
}
```

#### (2) 方法规范

从前面的动态生成的 Adaptive 类中的 adaptiveMethod()方法体可知，其对于要加载的扩展名的指定方式是通过 URL 类型的方法参数指定的。所以对于 Adaptive 方法的定义规范仅一条：`其参数包含 URL 类型的参数，或参数可以获取到 URL 类型的值。方法调用者是通过URL 传递要加载的扩展名的。`

注意该URL类，是dubbo自己的：org.apache.dubbo.common.URL

### 3.4 Adaptive 方法代码举例 14-adaptivemethod

#### (1) 创建工程

复制14-adaptiveclass 工程，在其基础之上修改。

#### (2) 修改 SPI 接口

```java
import org.apache.dubbo.common.URL;
import org.apache.dubbo.common.extension.Adaptive;
import org.apache.dubbo.common.extension.SPI;
// 下单接口
@SPI("alipay")
public interface Order {
    String way();
    @Adaptive
    String pay(URL url);
}
```

#### (3) 修改两个扩展类

```java
// 支付宝支付下单
public class AlipayOrder implements Order {
    @Override
    public String way() {
        System.out.println("--- 支付宝way() ---");
        return "支付宝支付方式";
    }
    @Override
    public String pay(URL url) {
        System.out.println("--- 支付宝pay() ---");
        return "使用支付宝支付";
    }
}
// 微信支付下单
public class WeChatOrder implements Order {
    @Override
    public String way() {
        System.out.println("--- 微信way() ---");
        return "微信支付方式";
    }
    @Override
    public String pay(URL url) {
        System.out.println("--- 微信pay() ---");
        return "使用微信支付";
    }
}
```

#### (4) 删除原来的 Adaptive 类

若存在Adaptive 类，即使定义了 Adaptive 方法，其执行的也是 Adaptive 类，所以这里要首先将 Adaptive 类删除。

#### (5) 定义扩展类配置文件

由于Adaptive 类已经删除，所以在配置文件中也需要将 Adaptive 类的注册也删除。

META-INF/dubbo/internal/com.abc.spi.Order

```java
alipay=com.abc.spi.extension.AlipayOrder
wechat=com.abc.spi.extension.WeChatOrder
```

#### (6) 测试 1

```java
public class OrderTest {
    @Test
    public void test01() {
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        Order adaptiveExtension = loader.getAdaptiveExtension();
        // 模拟一个URL
        URL url = URL.valueOf("xxx://localhost/ooo");
        System.out.println(adaptiveExtension.pay(url));
    }
}
```

#### (7) 测试 2

```java
public class OrderTest {
    @Test
    public void test02() {
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        Order adaptiveExtension = loader.getAdaptiveExtension();
        // 模拟一个URL
        // SPI接口为GoodsOrder  此时的url为xxx://localhost/ooo?goods.order=wechat
        URL url = URL.valueOf("xxx://localhost/ooo?order=wechat");
        System.out.println(adaptiveExtension.pay(url));
        System.out.println(adaptiveExtension.way());
    }
}
```

### 3.5 源码简单分析

简单看下org.apache.dubbo.common.extension.ExtensionLoader#getAdaptiveExtension方法实现(后期会详细说)：

```java
public T getAdaptiveExtension() {
    Object instance = cachedAdaptiveInstance.get();
    if (instance == null) {
        if (createAdaptiveInstanceError == null) {
            synchronized (cachedAdaptiveInstance) {
                instance = cachedAdaptiveInstance.get();
                if (instance == null) {
                    try {
	                    //跟这个
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
//org.apache.dubbo.common.extension.ExtensionLoader#createAdaptiveExtension
private T createAdaptiveExtension() {
    try {
	    //主要先看下getAdaptiveExtensionClass
	    //获取自适应扩展类
        return injectExtension((T) getAdaptiveExtensionClass().newInstance());
    } catch (Exception e) {
        throw new IllegalStateException("Can't create adaptive extension " + type + ", cause: " + e.getMessage(), e);
    }
}
private Class<?> getAdaptiveExtensionClass() {
    getExtensionClasses();
    if (cachedAdaptiveClass != null) {
        return cachedAdaptiveClass;
    }
    //如果是Adaptive方法的话，这里肯定没有CLass
    //所以跟createAdaptiveExtensionClass
    return cachedAdaptiveClass = createAdaptiveExtensionClass();
}
private Class<?> createAdaptiveExtensionClass() {
	//这个code就是动态生成的Adaptive类
    String code = new AdaptiveClassCodeGenerator(type, cachedDefaultName).generate();
    ClassLoader classLoader = findClassLoader();
    org.apache.dubbo.common.compiler.Compiler compiler = ExtensionLoader.getExtensionLoader(org.apache.dubbo.common.compiler.Compiler.class).getAdaptiveExtension();
    return compiler.compile(code, classLoader);
}
```

通过断点，可以截取到code内容

将内容拷贝出来

```java
package com.abc.spi;
import org.apache.dubbo.common.extension.ExtensionLoader;
public class Order$Adaptive implements com.abc.spi.Order {
    public java.lang.String pay(org.apache.dubbo.common.URL arg0)  {
        if (arg0 == null) throw new IllegalArgumentException("url == null");
        org.apache.dubbo.common.URL url = arg0;
        //这里默认是接口名，首字母小写，可以通过@Adaptive指定key
        String extName = url.getParameter("order", "alipay");
        if(extName == null) throw new IllegalStateException("Failed to get extension (com.abc.spi.Order) name from url (" + url.toString() + ") use keys([order])");
        com.abc.spi.Order extension = (com.abc.spi.Order)ExtensionLoader.getExtensionLoader(com.abc.spi.Order.class).getExtension(extName);
        return extension.pay(arg0);
    }
    public java.lang.String way()  {
        throw new UnsupportedOperationException("The method public abstract java.lang.String com.abc.spi.Order.way() of interface com.abc.spi.Order is not adaptive method!");
    }
}
```

## 4. Wrapper 机制

Wrapper 机制，即扩展类的包装机制。就是对扩展类中的 SPI 接口方法进行增强，进行包装，是 AOP 思想的体现，是 Wrapper 设计模式的应用。一个 SPI 可以包含多个 Wrapper。

### 4.1 Wrapper 类规范

Wrapper 机制`不是通过注解实现的，而是通过一套 Wrapper 规范实现的。`

Wrapper 类在定义时需要遵循如下规范。(其实就是装饰设计模式的规范)

- 该类要实现 SPI 接口
- 该类中要有 SPI 接口的引用
- 该类中 SPI 接口实例是通过仅包含一个 SPI 接口参数的带参构造器传的(**源码中判断是否是Wrapper类是以这个为标准的**)
- 在接口实现方法中要调用 SPI 接口引用对象的相应方法
- 该类名称以 Wrapper 结尾

> dubbo源码中例子：
>
>
>
> 以ProtocolFilterWrapper为例：

### 4.2 代码举例 15-wrapper

复制14-adaptivemethod 工程，在其基础之上修改。

#### (1) 定义两个 wrapper 类

```java
public class OrderWrapper implements Order {
    private Order order;
    public OrderWrapper(Order order) {
        this.order = order;
    }
    @Override
    public String way() {
        System.out.println("before-这是wrapper对way()的增强");
        String way = order.way();
        System.out.println("after-这是wrapper对way()的增强");
        return way;
    }
    @Override
    public String pay(URL url) {
        System.out.println("before-这是wrapper对pay()的增强");
        String pay = order.pay(url);
        System.out.println("after-这是wrapper对pay()的增强");
        return pay;
    }
}
public class OrderWrapper2 implements Order {
    private Order order;
    public OrderWrapper2(Order order) {
        this.order = order;
    }
    @Override
    public String way() {
        System.out.println("before222-这是wrapper对way()的增强");
        String way = order.way();
        System.out.println("after222-这是wrapper对way()的增强");
        return way;
    }
    @Override
    public String pay(URL url) {
        System.out.println("before222-这是wrapper对pay()的增强");
        String pay = order.pay(url);
        System.out.println("after222-这是wrapper对pay()的增强");
        return pay;
    }
}
```

#### (2) 修改扩展类配置文件

将这两个 wrapper 注册到扩展类配置文件中。

META-INF/dubbo/internal/com.abc.spi.Order

```java
alipay=com.abc.spi.extension.AlipayOrder
wechat=com.abc.spi.extension.WeChatOrder
wrapper=com.abc.spi.extension.OrderWrapper
wrapper2=com.abc.spi.extension.OrderWrapper2
```

#### (3) 测试

```java
public class OrderTest {
    @Test
    public void test01() {
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        Order adaptiveExtension = loader.getAdaptiveExtension();
        URL url = URL.valueOf("xxx://localhost/ooo");
        System.out.println(adaptiveExtension.pay(url));
    }
    @Test
    public void test02() {
        ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
        Set<String> extensions = loader.getSupportedExtensions();
        System.out.println(extensions);
    }
}
```

test01：

test02：

说明wrapper 类不属于扩展类

## 5. Activate 机制

用于激活扩展类的。

Activate 机制，即扩展类的激活机制。通过指定的条件来激活当前的扩展类。其是通过@Activate 注解实现的。

### 5.1 @Activate 注解

在@Activate 注解中共有五个属性，其中 before、after 两个属性已经过时，剩余有效属性还有三个。它们的意义为：

- group：为扩展类指定所属的组别，是当前扩展类的一个标识。String[]类型，表示一个扩展类可以属于多个组。
- value：为当前扩展类指定的 key(必须是META-INF/dubbo/internal/com.abc.spi.Order中配置的前缀)，是当前扩展类的一个标识。String[]类型，表示一个扩展类可以有多个指定的 key。
- order：指定筛选条件相同的扩展类的加载顺序。序号越小，优先级越高。默认值为 0。

### 5.2 代码举例

#### (1) 创建工程

复制13-dubbospi 工程，在其基础之上修改。

#### (2) 修改扩展类 AlipayOrder

支付宝属于线上支付，group为online

```java
// @Activate的作用就是为当前扩展类添加一个用于筛选的标签，
// group与value的关系为  与
@Activate(group = "online", value = "alipay")
public class AlipayOrder implements Order {
    @Override
    public String way() {
        System.out.println("--- 支付宝way() ---");
        return "支付宝支付方式";
    }
}
```

#### (3) 修改扩展类 WeChatOrder

微信属于线上支付，group为online

```java
@Activate(group = "online", value = "wechat")
public class WeChatOrder implements Order {
    @Override
    public String way() {
        System.out.println("--- 微信way() ---");
        return "微信支付方式";
    }
}
```

#### (4) 定义扩展类 CardOrder

银行卡线上、线下都行，group为online、offline

```java
@Activate(group = {
     "online", "offline"}, order = 3)
public class CardOrder implements Order {
    @Override
    public String way() {
        System.out.println("--- 银行卡way() ---");
        return "银行卡支付方式";
    }
}
```

#### (5) 定义扩展类 CashOrder

```java
@Activate(group = "offline", order = 4)
public class CashOrder implements Order {
    @Override
    public String way() {
        System.out.println("--- 现金way() ---");
        return "现金支付方式";
    }
}
```

#### (6) 定义扩展类 CouponOrder

```java
@Activate(group = "offline", order = 5)
public class CouponOrder implements Order {
    @Override
    public String way() {
        System.out.println("--- 购物券way() ---");
        return "购物券支付方式";
    }
}
```

#### (7) 注册扩展类

META-INF/dubbo/internal/com.abc.spi.Order

```java
alipay=com.abc.spi.extension.AlipayOrder
wechat=com.abc.spi.extension.WeChatOrder
card=com.abc.spi.extension.CardOrder
cash=com.abc.spi.extension.CashOrder
coupon=com.abc.spi.extension.CouponOrder
```

#### (8) 测试类

test01：

```java
@Test
public void test01() {
    ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
    URL url = URL.valueOf("xxx://localhost/ooo");
    // 激活group为online的所有扩展类
    List<Order> activateExtensions = loader.getActivateExtension(url, "", "online");
    for (Order order : activateExtensions) {
        System.out.println(order.way());
    }
}
```

微信和支付宝order都是0，后注册的优先级更高

test02：

```java
@Test
public void test02() {
    ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
    URL url = URL.valueOf("xxx://localhost/ooo");
    // 激活group为offline的所有扩展类
    List<Order> activateExtensions = loader.getActivateExtension(url, "", "offline");
    for (Order order : activateExtensions) {
        System.out.println(order.way());
    }
}
```

test03：

```java
@Test
public void test03() {
    ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
    URL url = URL.valueOf("xxx://localhost/ooo?xxx=alipay");
    // 激活group为online、或  功能性扩展名为alipay扩展类
    // "xxx"代表可以随意
    List<Order> activateExtensions = loader.getActivateExtension(url, "xxx", "online");
    for (Order order : activateExtensions) {
        System.out.println(order.way());
    }
}
```

```java
@Activate(group = "online", value = "alipay")
public class AlipayOrder implements Order {
     ...}
@Activate(group = "online", value = "wechat")
public class WeChatOrder implements Order {
     ...}
@Activate(group = {
     "online", "offline"}, order = 3)
public class CardOrder implements Order {
     ...}
```

`由此可见group和value是与的关系`,但是因为CardOrder没有指定value，所以也会被匹配上

test04：

```java
@Test
public void test04() {
    ExtensionLoader<Order> loader = ExtensionLoader.getExtensionLoader(Order.class);
    Set<String> extensions = loader.getSupportedExtensions();
    System.out.println(extensions);
}
```

## 6. 总结

在扩展类配置文件中可能会存在四种类：普通扩展类、Adaptive 类、Wrapper 类，及Activate 类。

- 它们的共同点是，都实现了 SPI 接口。
- Adaptive 类与 Activate 类都是通过注解定义的，而 Wrapper 则是通过一套规范定义的。
- 一个 SPI 接口的 Adaptive 类只能有一个(无论是否是自动生成的)，而 Wrapper 类与Activate 类可以有多个。
- 只有普通扩展类与 Activate 类属于扩展类范畴，Adaptive 类与 Wrapper 类不属于扩展类范畴。
