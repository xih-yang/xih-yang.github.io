# 07、Dubbo 源码解析 - 服务本地暴露
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/7.html
- 分类：J2EE框架
- 分组：Dubbo 服务发布原理解剖
在上一篇文章我们分析了一下 dubbo 在服务暴露发生了哪些事，今天我们就来分析一下整个服务暴露中的本地暴露。(PS:其实我感觉本地暴露蛮鸡肋的)。本地暴露需要服务提供方与服务消费方在同一个 JVM。下面我们来写一个本地暴露使用的例子：

> DemoService.java

```java
public interface DemoService {
    String sayHello(String name);
}
```

> DemoServiceImpl.java

```java
public class DemoServiceImpl implements DemoService {
    public String sayHello(String name) {
        return "Hello " + name + ", response form provider: " + RpcContext.getContext().getLocalAddress();
    }
}
```

> application.xml – Spring配置文件

```java
<!-- 提供方应用信息，用于计算依赖关系 -->
<dubbo:application name="demo-provider"/>
<!-- 和本地bean一样实现服务 -->
<bean id="demoService" class="com.alibaba.dubbo.demo.provider.DemoServiceImpl" />
<!-- 声明需要暴露的服务接口 -->
<dubbo:service interface="com.alibaba.dubbo.demo.DemoService" ref="demoService" registry="N/A" scope="local"/>
<dubbo:reference id="demoServiceDubbo" interface="com.alibaba.dubbo.demo.DemoService"  injvm="true"/>
```

> Provider.java – 调用本地暴露的服务

```java
public class Provider {
    public static void main(String[] args) throws Exception {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("application.xml");
        DemoService demoServiceDubbo = context.getBean("demoServiceDubbo", DemoService.class);
        String returnMessage = demoServiceDubbo.sayHello("carl");
        System.out.println(returnMessage);
    }
}
```

使用`context.getBean("demoServiceDubbo", DemoService.class)`这种方式来获取Bean还不如使用`context.getBean("demoService", DemoService.class)`来获取真正对象。前一种方式获取到是 dubbo 返回的代理类，其中可以获取到 dubbo 的`InvokerListener`与`Filter`这两个扩展点。可能这是与整个服务保持统一性吧。(大家如果有不同的观点欢迎留言)。下面我们就从源码的角度来分析一下 dubbo 的本地暴露吧。

如果大家看过[dubbo官网的API配置](http://dubbo.io/books/dubbo-user-book/configuration/api.html)(建议大家分析码源的时候都使用API的形式调用，尽量少的引入第三方Jar包比如xml配置dubbo)，我们就可以知道。dubbo服务的暴露的起点是ServiceConfig#export。下面我们就以这个方法以起点来分析它：

`export`这个方法就是dubbo服务暴露的入口，主要就是判断这个服务是否暴露以及通过`ScheduledThreadPoolExecutor`这个线程池类支持延迟暴露。

接下来就是`doExport`方法，在这个方法的前面就是做一些 check 操作，不是重点，就不一一分析了。我们主要看一下它的`appendProperties方法`以及`doExportUrls`这两个方法。`appendProperties()`方法主要是为当前对象通过setter 方法来添加属性，它主要是通过以下方式来添加属性：

- 从 System 中获取属性key值的优先通讯是： dubbo.provider. + 当前类 Id + 当前属性名称 >` dubbo.provider. + 当前属性名称 为 key 获取值.
- 首先从特定properties文件加载属性：首先 System.getProperty("dubbo.properties.file")获取到文件路径，如果获取不到就会试图加载 dubbo 的默认的路径 dubbo.properties加载。获取属性的 key 和上面从 System 里面获取的规则一样。

然后我们就来分析一下`doExportUrl`这个方法，因为 Dubbo 允许配置多协议，在不同服务上支持不同协议或者同一服务上同时支持多种协议。所以这里需要循环各个协议进行多协议暴露服务。

```java
private void doExportUrls() {
    List<URL> registryURLs = loadRegistries(true);
    for (ProtocolConfig protocolConfig : protocols) {
        doExportUrlsFor1Protocol(protocolConfig, registryURLs);
    }
}
```

然后我们来分析一下ServiceConfig#doExportUrlsFor1Protocol，首先我们来看一下appendParameters(Map, Object)这个方法，这个方法的作用就是通过调用当前对象的getter方法获取到传入对象的值然后塞到 map 当中去。用于后面的构造URL这个对象。

```java
public final class URL implements Serializable {
    private static final long serialVersionUID = -1985165475234910535L;
	// 协议
    private final String protocol;
	// 用户名
    private final String username;
	// 密码
    private final String password;
	// 主机
    private final String host;
	// 端口
    private final int port;
	// path
    private final String path;
	// 其它参数
    private final Map<String, String> parameters;
}
```

**注：URL，配置信息的统一格式，所有扩展点都通过传递 URL 携带配置信息)**

如果大家没有看过我[6、dubbo源码分析 之 服务暴露概述](/zhuanlan/j2ee/dubbo/1/6.html)在这点我再向大家提醒一下，dubbo的对象扭转过程是：

> 服务配置类 --> Invoker --> Exporter

首先通过 ref (服务实现类)、服务接口类以及 URL 默认通过 `javassist`，也就是 `JavassistProxyFactory`类获取到代理对象。

然后再把 Invoker 对象转化成Exporter对象。还记得之前的[5.dubbo源码分析 之 SPI分析](http://blog.csdn.net/u012410733/article/details/79084133)之前是分析的远程暴露中的获取Protocol 实例。只是这里的 protocol实例是 本地方法暴露获取的实例。它也是 dubbo 自定义的 SPI 生成的 Protocol`$`Adaptive通过它的getExtension(name)方法创建 Protocol实例，然后通过 Protocol#export 方法获取Exporter。

我们可以看到`Protocol$Adaptive`这个类生成的 `Protocol`对象的结构是:

- ProtocolListenerWrapper
- ProtocolFilterWrapper

InjvmProtocol

dubbo 的定义 SPI 里面包括 AOP，其实就是获取到所有的 SPI 接口的实例对象。然后在调用 getExtension(name)方法返回指定名字的扩展的时候会判断哪些实现类的构造器只包含 SPI 接口就会进行代理。这里的name是从 URL 中获取协议。在调用ServiceConfig#loadRegistries方法的里面返回的 URL 格式为registry://127.0.0.1:2181/com.alibaba.dubbo.registry.RegistryService?xxx=xxx然后再调用ServiceConfig#exportLocal(URL)方法的时候里面把协议(protocol)设置成injvm， 然后 在 Protocol`$`Adaptive 进行服务暴露的时候：

因为duubo 默认在`dubbo-rpc-injvm`的自定义`Protocol`配置文件(`${dubbo-rpc-injvm}/src/main/resources/META-INF/dubbo/internal/com.alibaba.dubbo.rpc.Protocol`)配置的是`injvm=com.alibaba.dubbo.rpc.protocol.injvm.InjvmProtocol`所以得到的对象是InjvmProtocol。因为`ProtocolListenerWrapper` 与 `ProtocolFilterWrapper` 其实都包括 SPI 接口 `Protocol`的构造器。所以创建出来的对象如上所以。关于 dubbo 的SPI机制可以参看 – [2.dubbo源码分析 之 内核SPI实现](/zhuanlan/j2ee/dubbo/1/2.html).

- ProtocolListenerWrapper ： 通过 SPI 机制获取到 dubbo 的自定义扩展 InvokerListener。
- ProtocolFilterWrapper ： 通过 SPI 机制获取到 dubbo 的自定义扩展 Filter(**常用**)。

其实关于 dubbo 通过 SPI 机制获取机制获取到 dubbo 的自定义扩展 `Filter`，还蛮复杂与重要的。在这里就不多说了，感兴趣的朋友可以下去参看源码。

最终就到了`InjvmProtocol`暴露服务，其实它就是创建一个 `InjvmExporter` 对象返回。里面包括 4 个属性：

- invoker：Invoker 对象实例
- key：服务 key 值，在进行服务调用的时候会根据这个 key 值。获取到当前服务暴露生成的 Exporter 对象。
- exporterMap：服务 key 值与当前 Exporter 的映射

最后这个生成的 Exporter 最终会返回添加到 `ServiceConfig`的 `exporters` 属性当中去。这样就完成了 dubbo 服务暴露的本地暴露的过程。

其实整个 dubbo 的本地暴露逻辑还是蛮简单的，把它分开来主要还是整个服务暴露过程比较复杂。先给大家讲解一下本地暴露。如果大家清楚了本地暴露，然后再理解远程暴露就会更加容易。
