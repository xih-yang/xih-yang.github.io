# 12、Nepxion 教程 - Discovery 之 Discovery Agent 解决异步场景线程 ThreadLocal 上下文丢失问题
- 来源：https://ddkk.com/zhuanlan/j2ee/nepxion/1/12.html
- 分类：J2EE框架
- 分组：Nepxion 教程
在进行微服务调用的时候，不管是服务之间(A 服务调用 B 服务)还是服务内部调用(服务 A 某个方法进行里有异步)都存在异步调用。但是 `Nepxion Discovery` 在进行参数传递的时候很多情况是使用的是基于 `ThreadLocal`。

## 1、Discovery Agent 简介

`ThreadLocal` 的作用是提供线程内的局部变量，在多线程环境下访问时能保证各个线程内的`ThreadLocal`变量各自独立。在异步场景下，由于出现线程切换的问题，例如主线程切换到子线程，会导致线程`ThreadLocal`上下文丢失。`DiscoveryAgent`通过`Java Agent`方式解决这些痛点。它基本涵盖所有 Java 框架的异步场景，解决如下 7 个异步场景下丢失线程 `ThreadLocal` 上下文的问题：

- @Async
- Hystrix Thread Pool Isolation
- Runnable
- Callable
- Single Thread
- Thread Pool
- SLF4J MDC

## 2、异步跨线程 Agent

### 2.1 插件获取

插件获取方式有两种方式：

- 通过 [https://github.com/Nepxion/DiscoveryAgent/releases](https://github.com/Nepxion/DiscoveryAgent/releases)下载最新版本的Discovery Agent
- 编译 [https://github.com/Nepxion/DiscoveryAgent](https://github.com/Nepxion/DiscoveryAgent) 产生discovery-agent目录

### 2.2 插件使用

- discovery-agent-starter-`$`{discovery.version}.jar 为 Agent 引导启动程序，JVM 启动时进行加载；discovery-agent/plugin 目录包含 discovery-agent-starter-plugin-strategy-`$`{discovery.version}.jar 为 Nepxion Discovery自带的实现方案，业务系统可以自定义plugin，解决业务自己定义的上下文跨线程传递
- 通过如下-javaagent启动，基本格式，如下：

```java
-javaagent:/discovery-agent/discovery-agent-starter-${
     discovery.agent.version}.jar -Dthread.scan.packages=com.abc;com.xyz
```

**例如：**

```java
-javaagent:C:/opt/discovery-agent/discovery-agent-starter-${
     discovery.agent.version}.jar -Dthread.scan.packages=org.springframework.aop.interceptor;com.netflix.hystrix;com.nepxion.discovery.guide.service.feign
```

**参数说明：**

- /discovery-agent：Agent 所在的目录，需要对应到实际的目录上
- -Dthread.scan.packages ：Runnable，Callable对象所在的扫描目录，该目录下的 Runnable，Callable对象都会被装饰。该目录最好精细和准确，这样可以减少被装饰的对象数，提高性能，目录如果有多个，用 “;”分隔。该参数只作用于服务侧，网关侧不需要加。参数定义为:
- `@Async` 场景下的扫描目录对应为`org.springframework.aop.interceptor`
- `Hystrix`线程池隔离场景下的扫描目录对应为`com.netflix.hystrix`
- 线程，线程池的扫描目录对应为自定义 `Runnable`，`Callable` 对象所在类的目录
- 上述扫描路径如果含有`“;”`，可能会在某些操作系统中无法被识别，请用""进行引入，例如，`-Dthread.scan.packages="com.abc;com.xyz"`
- -Dthread.request.decorator.enabled：异步调用场景下在服务端的 Request请求的装饰，当主线程先于子线程执行完的时候，Request 会被 Destory，导致 Header 仍旧拿不到，开启装饰，就可以确保拿到。默认为开启，根据实践经验，大多数场景下，需要开启该开关
- -Dthread.mdc.enabled：SLF4J MDC 日志输出到异步子线程。默认关闭，如果需要，则开启该开关

### 2.3 插件扩展

- 根据规范开发一个插件，插件提供了钩子函数，在某个类被加载的时候，可以注册一个事件到线程上下文切换事件当中，实现业务自定义 ThreadLocal 的跨线程传递
- plugin 目录为放置需要在线程切换时进行 ThreadLocal 传递的自定义插件。业务自定义插件开发完后，放入到 plugin 目录下即可

具体步骤介绍，如下

**①SDK侧工作**

新建ThreadLocal 上下文类

> MyContext.java

```java
public class MyContext {
    private static final ThreadLocal<MyContext> THREAD_LOCAL = new ThreadLocal<MyContext>() {
        @Override
        protected MyContext initialValue() {
            return new MyContext();
        }
    };
    public static MyContext getCurrentContext() {
        return THREAD_LOCAL.get();
    }
    public static void clearCurrentContext() {
        THREAD_LOCAL.remove();
    }
    private Map<String, String> attributes = new HashMap<>();
    public Map<String, String> getAttributes() {
        return attributes;
    }
    public void setAttributes(Map<String, String> attributes) {
        this.attributes = attributes;
    }
}
```

**②Agent侧工作**

新建一个模块，引入如下依赖

```java
<dependency>
    <groupId>com.nepxion</groupId>
    <artifactId>discovery-agent-starter</artifactId>
    <version>${discovery.agent.version}</version>
    <scope>provided</scope>
</dependency>
```

新建一个 `ThreadLocalHook` 类继承 `AbstractThreadLocalHook`：

> MyContextHook.java

```java
public class MyContextHook extends AbstractThreadLocalHook {
    @Override
    public Object create() {
        // 从主线程的ThreadLocal里获取并返回上下文对象
        return MyContext.getCurrentContext().getAttributes();
    }
    @Override
    public void before(Object object) {
        // 把create方法里获取到的上下文对象放置到子线程的ThreadLocal里
        if (object instanceof Map) {
            MyContext.getCurrentContext().setAttributes((Map<String, String>) object);
        }
    }
    @Override
    public void after() {
        // 线程结束，销毁上下文对象
        MyContext.clearCurrentContext();
    }
}
```

新建一个 `Plugin` 类继承 `AbstractPlugin`：

> MyContextPlugin.java

```java
public class MyContextPlugin extends AbstractPlugin {
    private Boolean threadMyPluginEnabled = Boolean.valueOf(System.getProperty("thread.myplugin.enabled", "false"));
    @Override
    protected String getMatcherClassName() {
        // 返回存储ThreadLocal对象的类名，由于插件是可以插拔的，所以必须是字符串形式，不允许是显式引入类
        return "com.nepxion.discovery.example.sdk.MyContext";
    }
    @Override
    protected String getHookClassName() {
        // 返回ThreadLocalHook类名
        return MyContextHook.class.getName();
    }
    @Override
    protected boolean isEnabled() {
        // 通过外部-Dthread.myplugin.enabled=true/false的运行参数来控制当前Plugin是否生效。该方法在父类中定义的返回值为true，即缺省为生效
        return threadMyPluginEnabled;
    }
}
```

定义SPI扩展，在 `src/main/resources/META-INF/services` 目录下定义 `SPI` 文件，名称为固定如下格式：

```java
com.nepxion.discovery.agent.plugin.Plugin
```

内容为`Plugin` 类的全路径：

```java
com.nepxion.discovery.example.agent.MyContextPlugin
```

执行`Maven` 编译，把编译后的包放在 `discovery-agent/plugin` 目录下：

给服务增加启动参数并启动，如下：

```java
-javaagent:C:/opt/discovery-agent/discovery-agent-starter-${
     discovery.agent.version}.jar -Dthread.scan.packages=com.nepxion.discovery.example.application -Dthread.myplugin.enabled=true
```

**③Application侧工作**

执行`MyApplication`，它模拟在主线程 `ThreadLocal` 放入 Map 数据，子线程通过 `DiscoveryAgent` 获取到该 Map 数据，并打印出来：

> MyApplication.java

```java
@SpringBootApplication
@RestController
public class MyApplication {
    private static final Logger LOG = LoggerFactory.getLogger(MyApplication.class);
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
        invoke();
    }
    public static void invoke() {
        RestTemplate restTemplate = new RestTemplate();
        for (int i = 1; i <= 10; i++) {
            restTemplate.getForEntity("http://localhost:8080/index/" + i, String.class).getBody();
        }
    }
    @GetMapping("/index/{value}")
    public String index(@PathVariable(value = "value") String value) throws InterruptedException {
        Map<String, String> attributes = new HashMap<String, String>();
        attributes.put(value, "MyContext");
        MyContext.getCurrentContext().setAttributes(attributes);
        LOG.info("【主】线程ThreadLocal：{}", MyContext.getCurrentContext().getAttributes());
        new Thread(new Runnable() {
            @Override
            public void run() {
                LOG.info("【子】线程ThreadLocal：{}", MyContext.getCurrentContext().getAttributes());
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                LOG.info("Sleep 5秒之后，【子】线程ThreadLocal：{} ", MyContext.getCurrentContext().getAttributes());
            }
        }).start();
        return "";
    }
}
```

**输出结果，如下：**

```java
2020-11-09 00:08:14.330  INFO 16588 --- [nio-8080-exec-1] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     1=MyContext}
2020-11-09 00:08:14.381  INFO 16588 --- [       Thread-4] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     1=MyContext}
2020-11-09 00:08:14.402  INFO 16588 --- [nio-8080-exec-2] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     2=MyContext}
2020-11-09 00:08:14.403  INFO 16588 --- [       Thread-5] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     2=MyContext}
2020-11-09 00:08:14.405  INFO 16588 --- [nio-8080-exec-3] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     3=MyContext}
2020-11-09 00:08:14.406  INFO 16588 --- [       Thread-6] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     3=MyContext}
2020-11-09 00:08:14.414  INFO 16588 --- [nio-8080-exec-4] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     4=MyContext}
2020-11-09 00:08:14.414  INFO 16588 --- [       Thread-7] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     4=MyContext}
2020-11-09 00:08:14.417  INFO 16588 --- [nio-8080-exec-5] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     5=MyContext}
2020-11-09 00:08:14.418  INFO 16588 --- [       Thread-8] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     5=MyContext}
2020-11-09 00:08:14.421  INFO 16588 --- [nio-8080-exec-6] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     6=MyContext}
2020-11-09 00:08:14.422  INFO 16588 --- [       Thread-9] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     6=MyContext}
2020-11-09 00:08:14.424  INFO 16588 --- [nio-8080-exec-7] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     7=MyContext}
2020-11-09 00:08:14.425  INFO 16588 --- [      Thread-10] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     7=MyContext}
2020-11-09 00:08:14.427  INFO 16588 --- [nio-8080-exec-8] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     8=MyContext}
2020-11-09 00:08:14.428  INFO 16588 --- [      Thread-11] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     8=MyContext}
2020-11-09 00:08:14.430  INFO 16588 --- [nio-8080-exec-9] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     9=MyContext}
2020-11-09 00:08:14.431  INFO 16588 --- [      Thread-12] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     9=MyContext}
2020-11-09 00:08:14.433  INFO 16588 --- [io-8080-exec-10] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     10=MyContext}
2020-11-09 00:08:14.434  INFO 16588 --- [      Thread-13] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     10=MyContext}
2020-11-09 00:08:19.382  INFO 16588 --- [       Thread-4] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     1=MyContext} 
2020-11-09 00:08:19.404  INFO 16588 --- [       Thread-5] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     2=MyContext} 
2020-11-09 00:08:19.406  INFO 16588 --- [       Thread-6] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     3=MyContext} 
2020-11-09 00:08:19.416  INFO 16588 --- [       Thread-7] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     4=MyContext} 
2020-11-09 00:08:19.418  INFO 16588 --- [       Thread-8] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     5=MyContext} 
2020-11-09 00:08:19.422  INFO 16588 --- [       Thread-9] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     6=MyContext} 
2020-11-09 00:08:19.425  INFO 16588 --- [      Thread-10] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     7=MyContext} 
2020-11-09 00:08:19.428  INFO 16588 --- [      Thread-11] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     8=MyContext} 
2020-11-09 00:08:19.432  INFO 16588 --- [      Thread-12] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     9=MyContext} 
2020-11-09 00:08:19.434  INFO 16588 --- [      Thread-13] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     10=MyContext} 
```

如果不加异步 `Agent`，则输出结果，如下，可以发现在子线程中 `ThreadLocal` 上下文全部都丢失:

```java
2020-11-09 00:01:40.133  INFO 16692 --- [nio-8080-exec-1] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     1=MyContext}
2020-11-09 00:01:40.135  INFO 16692 --- [       Thread-8] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     }
2020-11-09 00:01:40.158  INFO 16692 --- [nio-8080-exec-2] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     2=MyContext}
2020-11-09 00:01:40.159  INFO 16692 --- [       Thread-9] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     }
2020-11-09 00:01:40.162  INFO 16692 --- [nio-8080-exec-3] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     3=MyContext}
2020-11-09 00:01:40.163  INFO 16692 --- [      Thread-10] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     }
2020-11-09 00:01:40.170  INFO 16692 --- [nio-8080-exec-5] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     4=MyContext}
2020-11-09 00:01:40.170  INFO 16692 --- [      Thread-11] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     }
2020-11-09 00:01:40.173  INFO 16692 --- [nio-8080-exec-4] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     5=MyContext}
2020-11-09 00:01:40.174  INFO 16692 --- [      Thread-12] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     }
2020-11-09 00:01:40.176  INFO 16692 --- [nio-8080-exec-6] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     6=MyContext}
2020-11-09 00:01:40.177  INFO 16692 --- [      Thread-13] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     }
2020-11-09 00:01:40.179  INFO 16692 --- [nio-8080-exec-8] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     7=MyContext}
2020-11-09 00:01:40.180  INFO 16692 --- [      Thread-14] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     }
2020-11-09 00:01:40.182  INFO 16692 --- [nio-8080-exec-7] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     8=MyContext}
2020-11-09 00:01:40.182  INFO 16692 --- [      Thread-15] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     }
2020-11-09 00:01:40.185  INFO 16692 --- [nio-8080-exec-9] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     9=MyContext}
2020-11-09 00:01:40.186  INFO 16692 --- [      Thread-16] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     }
2020-11-09 00:01:40.188  INFO 16692 --- [io-8080-exec-10] c.n.d.example.application.MyApplication  : 【主】线程ThreadLocal：{
     10=MyContext}
2020-11-09 00:01:40.189  INFO 16692 --- [      Thread-17] c.n.d.example.application.MyApplication  : 【子】线程ThreadLocal：{
     }
2020-11-09 00:01:45.136  INFO 16692 --- [       Thread-8] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     } 
2020-11-09 00:01:45.160  INFO 16692 --- [       Thread-9] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     } 
2020-11-09 00:01:45.163  INFO 16692 --- [      Thread-10] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     } 
2020-11-09 00:01:45.171  INFO 16692 --- [      Thread-11] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     } 
2020-11-09 00:01:45.174  INFO 16692 --- [      Thread-12] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     } 
2020-11-09 00:01:45.177  INFO 16692 --- [      Thread-13] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     } 
2020-11-09 00:01:45.181  INFO 16692 --- [      Thread-14] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     } 
2020-11-09 00:01:45.183  INFO 16692 --- [      Thread-15] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     } 
2020-11-09 00:01:45.187  INFO 16692 --- [      Thread-16] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     } 
2020-11-09 00:01:45.190  INFO 16692 --- [      Thread-17] c.n.d.example.application.MyApplication  : Sleep 5秒之后，【子】线程ThreadLocal：{
     } 
```

## 3、DiscoveryAgent 源码分析

下面我们来分析一下 `DiscoveryAgent`是如何实现的，通过上面的示例，可以得出如果我们需要自定义的插件扩展有以下几个比较重要的关键点：

- 新建一个 ThreadLocalHook 类继承 AbstractThreadLocalHook，完成自己的跨线程变量共享。 AbstractThreadLocalHook 这个抽象类实现了 ThreadLocalHook 这个接口。通过名称我们可以大胆猜测 ThreadLocalHook 是属于 DiscoveryAgent 的钩子程序，我们在分析源码的时候需要注意ThreadLocalHook这个接口
- 新建一个 Plugin 类继承 AbstractPlugin： AbstractPlugin这个抽象了实现 Plugin 这个接口。从它的名字我们就可以猜测这个类是插件增强类。install 方法把添加当前插件注册到 TransformTemplate。
- 引入新增的 Agent，并通过 -javaagent:/Users/carl/.m2/repository/com/nepxion/discovery-agent-starter/1.0.1/discovery-agent-starter-1.0.1.jar -Dthread.scan.packages=com.nepxion.discovery.example.application -Dthread.myplugin.enabled=true 加载 discovery-agent-starter 并扫描需要增强的包。

有了以上几个前置条件我们再来分析一下 DiscoveryAgent 的源码。

`DiscoveryAgent` 其实是基于 Java Agent 特性，关于 Java Agent 不知道的同学可以看我之前的博客 – [基于 Java Agent 实现零倾入监控](https://blog.csdn.net/u012410733/article/details/104878111)。这样就可以找到

DiscoveryAgent 的处理入口类是：DiscoveryAgent#premain。

> DiscoveryAgent.java

```java
public class DiscoveryAgent {
    public static void premain(String agentArgs, Instrumentation instrumentation) {
        LOG.info(String.format("%s agent on load, version %s", DiscoveryAgent.class.getSimpleName(), DiscoveryAgentConstant.DISCOVERY_AGENT_VERSION));
        TransformTemplate transformTemplate = new TransformTemplate();
        PluginFinder.load(transformTemplate);
        instrumentation.addTransformer(new DispatcherClassFileTransformer(transformTemplate));
        System.setProperty(DiscoveryAgentConstant.SPRING_APPLICATION_DISCOVERY_AGENT_VERSION, DiscoveryAgentConstant.DISCOVERY_AGENT_VERSION);
    }
}
```

这个类里面其实最主要做了以下几件事。

- 创建 TransformTemplate 对象，这个对象主要是装载 Plugin 增强
- 加载DiscoveryAgent 提供的默认 Plugin 以及通过 SPI 外置的 Plugin
- 添加类增强转换分发器DispatcherClassFileTransformer 到 Instrumentation，看哪些类需要进行 Agent 增强。
- 添加 key 值为 spring.application.discovery.agent.version , value 为 1.0.0 到系统变量里面

第4步特别简单，不做分析，下面就来详细分析一下其它各个步骤。

### 3.1 创建 TransformTemplate 对象

创建`TransformTemplate` 对象，这个类里面的里面就 3 个 Map 属性。

```java
    private final Map<ClassMatcher, TransformCallback> register = new HashMap<>();
    private final Map<String, ClassMatcher> classMatcherFinder = new HashMap<>();
    private final Map<MatcherOperator, ClassMatcher> interfaceMatcherFinder = new HashMap<>();
```

在介绍这 3 个属性之前，首先先来分析一下这些属性泛型里面涉及到的对象。

- ClassMatcher：这其实是一个接口，它通过传入 ClassInfo(包含：class 名称， class 的字节流以及相关的 ClassLoader) 来判断这个类是否需要 Agent 增强。它有 3 个实现类：InterfaceMatcher，根据传入的 ClassInfo 中的 class 名称是否包含指定接口来判断是否匹配，包含就匹配，不包含就不匹配；ClassNameMatcher，根据传入的ClassInfo 中的 class 名称是否与指定的类全名相等来判断是否匹配，相等就匹配，不包含就不匹配；MatcherOperator，它实现 ClassMatcher 的 match 始终为 false，但是它提供了另外一个匹配方法，首先是否包匹配(class 名称是否以指定包开始)，然后根据InterfaceMatcher 进行匹配。
- TransformCallback：这个其实就是通过字节码技术对 Class 进行增强，它的实现类就是具体的功能增强。

在明白上面的 2 个接口的概念之后，下面我们再来分析一下 `TransformTemplate` 里面的 3 个 Map 对象相信大家就应该更容易理解一点了。

- register : 其它类在调用 TransformTemplate#transform 方法时会把 ClassMatch(增强的类匹配规则) 以及 TransformCallback 映射关系添加到这个 Map 当中
- classMatcherFinder: 其它类在调用 TransformTemplate#transform 方法时，如果 ClassMatch 属于 ClassNameMatcher 就会把 class 名称与 ClassMatcher 的关系添加到 classMatcherFinder 当中
- interfaceMatcherFinder：其它类在调用 TransformTemplate#transform 方法时，如果 ClassMatch 属于 MatcherOperator 就会把 MatcherOperator 与 ClassMatcher的关系添加到 interfaceMatcherFinder 当中

也就是如果一个类要找它是否需要增强，需要先把从 `classMatcherFinder` 或者 `interfaceMatcherFinder` 看是否能够找到 ClassMatch，如果找不到就不需要进行增强，如果找到才从`register` 映射关系里面找是如何进行增强的。

### 3.2 PluginFinder 加载 Plugin 逻辑

> PluginFinder.java

```java
public class PluginFinder {
    public static void load(TransformTemplate transformTemplate) {
        new SpringAsyncPlugin().install(transformTemplate);
        new ThreadPlugin().install(transformTemplate);
        URL[] pluginUrls = getPlugin().toArray(new URL[] {
     });
        ClassLoader classLoader = URLClassLoaderFactory.createClassLoader("discovery.agent", pluginUrls, PluginFinder.class.getClassLoader());
        List<Plugin> loadPlugins = PluginLoader.load(classLoader, Plugin.class);
        for (Plugin plugin : loadPlugins) {
            if (plugin.isEnabled()) {
                plugin.install(transformTemplate);
                LOG.info(String.format("%s install successfully", plugin.getClass().getSimpleName()));
            } else {
                LOG.info(String.format("%s disable to install", plugin.getClass().getSimpleName()));
            }
        }
    }
}
```

- SpringAsyncPlugin：调用 SpringAsyncPlugin#install 对 Spring @Async 异步处理注解进行增强
- ThreadPlugin：调用 ThreadPlugin#install 对 java 中的 Callable 与 Runnable 异步操作进行增强。首先需要在环境变量中配置变量 thread.scan.packages，然后使用 RunnableTransformCallback 对 Runnable 进行增强，使用 CallableTransformCallback 对 Callable 接口进行增强。
- 加载自定义的 Plugin 列表，并逐个调用 Plugin#install 把字节增强添加到 TransformTemplate 中。

上面 3 种不同的 Plugin 增强方式是不一样的。但是它们最终的思想都是一样的。就拿SpringAsyncPlugin#install 对 Spring @Async 异步处理注解进行增强为线，它会在 AsyncExecutionAspectSupport 类的 doSubmit 方法通过字符码增强创建的 Callable 类型的对象使用 WrapCallable 进行包装。

> WrapCallable.java

```java
public class WrapCallable<T> implements AsyncContextAccessor, Callable<T> {
    private Callable<T> callable;
    private AsyncContext asyncContext;
    public WrapCallable(Callable<T> callable) {
        this.callable = callable;
        Object[] objects = ThreadLocalCopier.create();
        setAsyncContext(new AsyncContext(objects));
    }
    @Override
    public T call() throws Exception {
        Object[] objects = asyncContext.getObjects();
        ThreadLocalCopier.before(objects);
        try {
            return callable.call();
        } finally {
            ThreadLocalCopier.after();
        }
    }
    @Override
    public void setAsyncContext(AsyncContext asyncContext) {
        this.asyncContext = asyncContext;
    }
    @Override
    public AsyncContext getAsyncContext() {
        return asyncContext;
    }
}
```

WrapCallable 创建对象的时候构造器里面会通过 ThreadLocalCopier.create() 创建 ThreadLocalCopier 对象持有的 ThreadLocalHook 列表的 ThreadLocalHook#create 方法。然后再异步方法调用前会调用 ThreadLocalHook#before， 异步方法调用后会调用 ThreadLocalHook#after 方法。

对上面的代码再进一步白话就是在异步方法调用之前通过 ThreadLocalHook#create 创建需要进行异步传递的参数。然后在异常方法之前通过ThreadLocalHook#before把这个值添加到 ThreadLocal 里面，最后通过 ThreadLocalHook#aflter 把这个 ThreadLocal 进行异步清除。

在这里需要特别注意的是：包装类必须实现 AsyncContextAccessor 接口，这样在构建器进行增强的时候就可以把 ThreadLocalHook#create 创建的对象添加进去。在进行异步方法执行之前就可以通过AsyncContextAccessor#getObjects() 。在 WrapCallable 这个对象面向不明显，可以查看对 Runnable 以及 Callable 的构建器增强 ThreadConstructorInterceptor 以及 ThreadCallInterceptor。

### 3.3 添加类增强转换分发器DispatcherClassFileTransformer到 Instrumentation

这里其实最重要的就是分发器`DispatcherClassFileTransformer`，它实现了 `ClassFileTransformer`主要就是对 Class 进行增强。`DispatcherClassFileTransformer` 持有对象 TransformTemplate。它是对需要字节码对象增强的注册表。上面我们已经分析了而 `DispatcherClassFileTransformer` 逻辑其实挺简单的。核心逻辑如下：

- 获取到当前类加载的 class 名称
- 根据 class 名称匹配查找 ClassMatch
- 如果根据 class 名称匹配找不到，就根据接口名称匹配查找 ClassMatch
- 如果 ClassMatch 不为空说明找到对应的类增强，就进行类增强，否则不进行类增强
