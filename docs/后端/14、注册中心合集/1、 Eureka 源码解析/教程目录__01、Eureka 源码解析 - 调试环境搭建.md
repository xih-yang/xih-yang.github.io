# 01、Eureka 源码解析 - 调试环境搭建
- 来源：https://ddkk.com/zhuanlan/registered/eureka/1/1.html
- 分类：注册中心
- 分组：教程目录
[Eureka](https://github.com/Netflix/eureka) ( 是一个基于 REST (Representational State Transfer)的服务，主要用于AWS云中定位服务，以实现中间层服务器的负载平衡和故障转移。

在Netflix, Eureka 除了在中间层负载平衡中扮演关键角色外，还用于以下目的。

- 帮助Netflix Asgard - 一个开源服务，使云部署更容易，在
- 快速回滚版本，以防出现问题，避免重新启动100个实例，这可能会花费很长时间。
- 在滚动推送中，为了避免在出现问题的情况下向所有情况传播新版本。
- 对于我们的 cassandra 部署，将实例从通信量中取出进行维护。
- 用于 memcached 缓存服务，以标识环中的节点列表。
- 因为其他各种原因，可以添加关于服务的其他应用程序特定的元数据。

前置条件：

- JDK ： eureka 基于 Java 开发，调度源码的时候需要依赖 JDK
- Gradle ：项目管理工具, eureka 采用的是 Gradle 作为项目依赖管理的)
- Idea ：java编程语言开发的集成环境，当然也可以选择 eclipse，看个人喜好。

项目地址：

[eureka github 地址](https://github.com/Netflix/eureka) ，直接拉取到个人电脑上面就可以了。

在eureka 项目的子项目中的 `eureka-server` 中的测试用例里面可以使用 `EurekaClientServerRestIntegrationTest` 进行 eureka 相关的功能测试。不过它这种是基于 War 的方式进行调式，当代码进行修改时还需要进行重新打包。我们可以修改 `startServer()` 启动服务的方式，使用 jetty 来启动项目。

> 改动前

```java
    private static void startServer() throws Exception {
        File warFile = findWar();
        server = new Server(8080);
        WebAppContext webapp = new WebAppContext();
        webapp.setContextPath("/");
        webapp.setWar(warFile.getAbsolutePath());
        server.setHandler(webapp);
        server.start();
        eurekaServiceUrl = "http://localhost:8080/v2";
    }
```

> 改动后

```java
    private static void startServer() throws Exception {
        server = new Server(8080);
        WebAppContext webAppCtx = new WebAppContext(new File("./src/main/webapp").getAbsolutePath(), "/");
        webAppCtx.setDescriptor(new File("./src/main/webapp/WEB-INF/web.xml").getAbsolutePath());
        webAppCtx.setResourceBase(new File("./src/main/resources").getAbsolutePath());
        webAppCtx.setClassLoader(Thread.currentThread().getContextClassLoader());
        server.setHandler(webAppCtx);
        server.start();
        eurekaServiceUrl = "http://localhost:8080/v2";
    }
```

随便打一个测试用例，比如测试服务注册(`testRegistration`)，运行结果如下：

方法执行结果是绿色就表示测试用例执行成功，`失败会是红色`。
