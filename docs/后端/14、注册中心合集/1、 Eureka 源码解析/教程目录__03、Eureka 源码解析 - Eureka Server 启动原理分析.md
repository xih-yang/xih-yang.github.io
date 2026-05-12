# 03、Eureka 源码解析 - Eureka Server 启动原理分析
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/3.html
- 分类：注册中心
- 分组：教程目录
Eureka 是 Netflix 开源的一款注册中心，它提供服务注册与服务发现功能。下面就是官方提供的 eureka 的架构图。

在这个图中有以下几个角色：

- Eureka Server：Eureka 服务器，它是注册中心提供接口给应用把服务实例的信息注册上来
- Eureka Client：Eureka 客户端，Eureka 包装好了微服务访问 Eureka 服务器的一系列接口。比如：注册，心跳，服务下线等。
- Application Server：微服务应用服务器，一个单体服务可以按照不同的领域拆分为多个微服务。微服务可以依赖 Eureka 客户端这样就可以很方便的调用 Eureka 服务器上提供的接口进行服务注册与服务发现相关的功能

> 注意在上面的架构图中 Eureka Eureka 是集群模式，Eureka Server 之间需要同步数据。所以在 Eureka Server 里面也会构建一个 Eureka Client 实例用于集群同步

### 1、Eureka Server 项目结构

Eureka 项目使用的是 Java 进行编写的，使用 gradle 进行项目管理。它使用的是 jersey 这个 restful 框架进行客户端请求的处理，使用 Servlet 容器进行启动这个服务的。所以我们可以按照 Servlet 规范来分析这个框架。

首先我们先来分析一下 `eureka-server` 项目中的 `build.gradle` 来看一下 Eureka Server 的依赖关系。它最主要的依赖如下所示：

- eureka-client：之前我们就说过在集群环境下，eureka server要同步其它服务的注册信息，同时也要把注册到当前服务的微服务信息同步到其它 eureka server，所以它引用了 eureka-client。eureka-client 提供了调用 restful 接口的封装，可以很方便的以接口方法的形式调用。
- eureka-core：jersey 其实是一个 restful框架，在 eureka-core 当中就封装了接收客户端的请求处理，可以理解成 Spring MVC 当中的 Controller。com.netflix.eureka.resources 中的 XXXResource 就是对各种请求的处理。
- jersey-xxx：它就是对客户端请求处理的框架，可以把它理解成 Spring MVC。

`resources` 目录下就是 `eureka server` 与 `eureka client`(eureka server 本身也是一个 eureka client) 相关的配置。当使用 Gradle 进行项目打包的时候就会把 `eureka-resources` 项目 `resources` 下面的 css、js、jsp 文件打入 war 包当中。

下面我们再来分析一下 web.xml 这个容器配置文件。

- EurekaBootStrap：它是 Eureka 核心类，用于启动服务完成整个服务的初始化。EurekaBootStrap 实现了 ServletContextListener，在容器启动的时候就会调用 EurekaBootStrap#contextInitialized 从而完成对 Eureka 核心组件的初始化。
- StatusFilter：它是一个过滤器实现了 javax.servlet.Filter。用于过滤当前 Eureka Server 是否能够正常给外部提供服务(状态为 UP 就是正常)
- ServerRequestAuthFilter：它是一个过滤器,实现了 javax.servlet.Filter。用于 eureka server 权限相关的操作
- RateLimitingFilter：它是一个过滤器，实现了 javax.servlet.Filter。用于 eureka server 限流 eureka client 的调用
- GzipEncodingEnforcingFilter：它是一个过滤器，实现了 javax.servlet.Filter。用于请求压缩。
- ServletContainer：它是 jersey 框架的核心处理类，每一个 Web 框架都会有一个前端处理器。统一接收并处理客户端的请求。类似于 Spring MVC 中的 DispatcherServlet。与 DispatcherServlet 是一个 Servlet 不同的是它既是一个 Servlet 同时也实现了 Filter。
- status.jsp ：它设置的首页是 jsp/status.jsp ，也就是 eureka-resources 下面的这个页面。它会显示注册到当前注册中心的服务实例信息与其它 eureka server 信息等。

### 2、Eureka Server 启动分析

在上面已经描述过了， Eureka Server 的核心组件是通过 EurekaBootStrap 进行服务启动的。它实现了 javax.servlet.ServletContextListener 所以在 Servlet 容器启动的时候就会调用 EurekaBootStrap#contextInitialized 进行 Eureka Server 启动。这个方法里面有两个方法。

> EurekaBootStrap#contextInitialized

```java
    @Override
    public void contextInitialized(ServletContextEvent event) {
        try {
            initEurekaEnvironment();
            initEurekaServerContext();
            ServletContext sc = event.getServletContext();
            sc.setAttribute(EurekaServerContext.class.getName(), serverContext);
        } catch (Throwable e) {
            logger.error("Cannot bootstrap eureka server :", e);
            throw new RuntimeException("Cannot bootstrap eureka server :", e);
        }
    }
```

- initEurekaEnvironment：这个方法比较简单，它设置一下项目的环境亦是：部署中心以及部署环境。
- initEurekaServerContext ：初始化 Eureka Server 的上下文，主要是初始化 Eureka Server 做为注册中心中需要使用到的核心组件
- 把 EurekaServerContext 设置到 Servlet 上下文(ServletContext) 当中

这里最核心的就是初始化 Eureka Servet 的上下文，下面我们来分析一下它的步骤。

### 3、Eureka Server 启动流程分析

我们在这里只会分析一下 Eureka Server 启动的核心流程，并且对于它的流程的细节也不会太过细致的分析，主要是了解 Eureka Server 在启动过程当中做了哪些事。对于它的细节部分我们将在后续的章节中进行讨论。希望大家在看这篇文章之前是看过 – [2、Eureka 源码解析 之 服务配置文件管理解析](/zhuanlan/registered/eureka/1/2.html)。因为对于 Eureka Server 配置相关的信息，本文只会一笔带过。

好了，下面我们就来分析一下 Eureka Server 的核心流程：创建 Euerka 上下文。

> EurekaBootStrap.java

```java
    protected void initEurekaServerContext() throws Exception {
        EurekaServerConfig eurekaServerConfig = new DefaultEurekaServerConfig();
        // For backward compatibility
        JsonXStream.getInstance().registerConverter(new V1AwareInstanceInfoConverter(), XStream.PRIORITY_VERY_HIGH);
        XmlXStream.getInstance().registerConverter(new V1AwareInstanceInfoConverter(), XStream.PRIORITY_VERY_HIGH);
        logger.info("Initializing the eureka client...");
        logger.info(eurekaServerConfig.getJsonCodecName());
        ServerCodecs serverCodecs = new DefaultServerCodecs(eurekaServerConfig);
        ApplicationInfoManager applicationInfoManager = null;
        if (eurekaClient == null) {
            EurekaInstanceConfig instanceConfig = isCloud(ConfigurationManager.getDeploymentContext())
                    ? new CloudInstanceConfig()
                    : new MyDataCenterInstanceConfig();
            applicationInfoManager = new ApplicationInfoManager(
                    instanceConfig, new EurekaConfigBasedInstanceInfoProvider(instanceConfig).get());
            EurekaClientConfig eurekaClientConfig = new DefaultEurekaClientConfig();
            eurekaClient = new DiscoveryClient(applicationInfoManager, eurekaClientConfig);
        } else {
            applicationInfoManager = eurekaClient.getApplicationInfoManager();
        }
        PeerAwareInstanceRegistry registry;
        if (isAws(applicationInfoManager.getInfo())) {
            registry = new AwsInstanceRegistry(
                    eurekaServerConfig,
                    eurekaClient.getEurekaClientConfig(),
                    serverCodecs,
                    eurekaClient
            );
            awsBinder = new AwsBinderDelegate(eurekaServerConfig, eurekaClient.getEurekaClientConfig(), registry, applicationInfoManager);
            awsBinder.start();
        } else {
            registry = new PeerAwareInstanceRegistryImpl(
                    eurekaServerConfig,
                    eurekaClient.getEurekaClientConfig(),
                    serverCodecs,
                    eurekaClient
            );
        }
        PeerEurekaNodes peerEurekaNodes = getPeerEurekaNodes(
                registry,
                eurekaServerConfig,
                eurekaClient.getEurekaClientConfig(),
                serverCodecs,
                applicationInfoManager
        );
        serverContext = new DefaultEurekaServerContext(
                eurekaServerConfig,
                serverCodecs,
                registry,
                peerEurekaNodes,
                applicationInfoManager
        );
        EurekaServerContextHolder.initialize(serverContext);
        serverContext.initialize();
        logger.info("Initialized server context");
        // Copy registry from neighboring eureka node
        int registryCount = registry.syncUp();
        registry.openForTraffic(applicationInfoManager, registryCount);
        // Register all monitoring statistics.
        EurekaMonitors.registerAllStats();
    }
```

**上面就是创建 EurekaContext 的主要过程，对于不是很重要的代码下面的文章将不会提及需要大家能够理解**

> 1、解析 eureka-server.properties

```java
EurekaServerConfig eurekaServerConfig = new DefaultEurekaServerConfig();
```

DefaultEurekaServerConfig 实现了接口 EurekaServerConfig。EurekaServerConfig主要是 Eureka Server 逻辑中需要使用的一些变量，它主要包含。上面的代码的逻辑就是通过它的构建器调用 init 方法。然后调用 ConfigurationManager#loadCascadedPropertiesFromResources 方法法 eureka-server.properties 加载到配置管理器 ConfigurationManager 当中。

**这个类的作用就是用来获取 Eureka 服务的配置信息。**

> 2、解析 eureka-client.properties，创建 EurekaInstanceConfig 对象

当Eureka Server 进行启动的时候，`eurekaClient` 必然是空，而且我们的服务一般也不是部署在 AWS 上面，所以会调用 `new MyDataCenterInstanceConfig()`。

```java
            EurekaInstanceConfig instanceConfig = isCloud(ConfigurationManager.getDeploymentContext())
                    ? new CloudInstanceConfig()
                    : new MyDataCenterInstanceConfig();
```

`MyDataCenterInstanceConfig` 的类继承结构如下：

`MyDataCenterInstanceConfig` 实现了接口 `EurekaInstanceConfig` 接口。上面已经说过 Eureka Server 在集群环境下，它其实本身也是一个 `Eureka Client`也可以认为是一个服务实例 ，`EurekaInstanceConfig` 这个接口它主要是对于服务实例信息的一个抽象。

在初始化 MyDataCenterInstanceConfig的时候会调用 MyDataCenterInstanceConfig 的无参构建器，初始化子类之前会调用它的父类 PropertiesInstanceConfig 的无参构建器。它会通过 Archaius1Utils#initConfig 把 eureka-client.properties 加载解析到 ConfigurationManager 当中，并返回一个 DynamicPropertyFactory 实例对象用于获取配置信息。

**这个类的作用就是用来获取 Eureka Client 作为一个服务实例的信息的配置信息。**

> 3、创建应用信息管理器

```java
applicationInfoManager = new ApplicationInfoManager(
       instanceConfig, new EurekaConfigBasedInstanceInfoProvider(instanceConfig).get());
```

在创建创建应用信息管理器信息的时候会把第二步创建好的 EurekaInstanceConfig 与 通过 EurekaConfigBasedInstanceInfoProvider#get 创建的 InstanceInfo 信息用来创建应用信息管理器。首先我们来分析一下 InstanceInfo 是如何进行创建的。通过 EurekaConfigBasedInstanceInfoProvider 的构造器传入从 eureka-client.properties 解析来的 Eureka Client 的配置信息。然后通过 EurekaConfigBasedInstanceInfoProvider#get 通过构建器 InstanceInfo.Builder 进行对象构建。里面的代码比较简单，你如果比较感兴趣可以自己看看。这里就不贴出来分析了。

> 4、解析 eureka-client.properties，创建 EurekaClientConfig 对象

`Eureka Server` 在集群环境下，它需要同步其它 `Eureka Server` 的信息。而 `Eureka Client`提供了很方便的方法接口来调用 `Eureka Server` 提供的接口。

```java
EurekaClientConfig eurekaClientConfig = new DefaultEurekaClientConfig();
```

在 EurekaClientConfig 构建器当中它会通过 Archaius1Utils#initConfig 把 eureka-client.properties 加载解析到 ConfigurationManager 当中，并返回一个 DynamicPropertyFactory 实例对象传入 DefaultEurekaTransportConfig 构造器中创建 EurekaTransportConfig 用于获取 Eureka 网络传输的配置信息。

> 5、创建 DiscoveryClient

```java
EurekaClient eurekaClient = new DiscoveryClient(applicationInfoManager, eurekaClientConfig);
```

上文已经说过了， `Eureka Server`在集群环境下会同步其它 `Eureka Server`的注册信息到当前 `Eureka Server`当中来。到这里就会通过上面构建的 `ApplicationInfoManager`(应用信息管理器) 与 `EurekaClientConfig`(Eureka Client 配置信息) 来创建一个 `EurekaClient`。 `EurekaClient`的构建过程有点复杂这里就不作过多分析，在下面的一篇文章当中会详细的分析它的初始化过程。

它最主要的功能就是同时发送心跳到 `Eureka Server`，定时同步最新的注册表到当前 `Eureka Client`(服务的自动上线与下线)。

> 6、创建 PeerAwareInstanceRegistry 实例对象

```java
        PeerAwareInstanceRegistry registry;
        if (isAws(applicationInfoManager.getInfo())) {
            registry = new AwsInstanceRegistry(
                    eurekaServerConfig,
                    eurekaClient.getEurekaClientConfig(),
                    serverCodecs,
                    eurekaClient
            );
            awsBinder = new AwsBinderDelegate(eurekaServerConfig, eurekaClient.getEurekaClientConfig(), registry, applicationInfoManager);
            awsBinder.start();
        } else {
            registry = new PeerAwareInstanceRegistryImpl(
                    eurekaServerConfig,
                    eurekaClient.getEurekaClientConfig(),
                    serverCodecs,
                    eurekaClient
            );
        }
```

根据`Eureka Server 配置`、`Eureka Client 配置`以及 `EurekaClient` 创建 `PeerAwareInstanceRegistryImpl` 类，这个类实现了 `PeerAwareInstanceRegistry`、`InstanceRegistry` 这两个接口。主要具有服务注册以及从其它的 `Eureka Server` 集群拉取注册信息。

> 7、创建 PeerEurekaNodes 对象

```java
 PeerEurekaNodes peerEurekaNodes = getPeerEurekaNodes(
         registry,
         eurekaServerConfig,
         eurekaClient.getEurekaClientConfig(),
         serverCodecs,
         applicationInfoManager
 );
```

创建 PeerEurekaNodes ，这个类主要是通过 PeerEurekaNodes#start 方法来更新 Eureka Server 集群的服务信息。

> 8、构建并初始化 EurekaServerContext 对象

```java
EurekaServerContext serverContext = new DefaultEurekaServerContext(
        eurekaServerConfig,
        serverCodecs,
        registry,
        peerEurekaNodes,
        applicationInfoManager
);
EurekaServerContextHolder.initialize(serverContext);
serverContext.initialize();
```

把上面创建的所有组件信息用来创建 `EurekaServerContext` 信息，调用把 `EurekaServerContext` 保存到 `EurekaServerContextHolder` 当中，然后进行初始化。主要包括以下步骤：

- 调用 PeerEurekaNodes#start方法定时更新 Eureka Server 服务信息列表
- 调用 PeerAwareInstanceRegistry#init 方法初始化响应缓存(ResponseCache)，这个响应缓存主要是缓存服务的注册信息；然后就是启动检测服务的心跳是否过期了(**eureka client 会定期向服务器发送心跳，也就是续约**[renewal])。

> 9、从其它 Eureka Server 同步注册表

```java
int registryCount = registry.syncUp();
registry.openForTraffic(applicationInfoManager, registryCount);
```

在这里它会通过 `Eureka Client` 请求远程相邻的 `Eureka Server` 获取注册的服务信息，初始化注册列表

> 10、注册监控信息

```java
EurekaMonitors.registerAllStats()
```

在这里它会利用 `JmxMonitorRegistry` 把 `EurekaMonitors` 所有的枚举类注册到 JMX 监控当中
