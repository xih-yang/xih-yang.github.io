# 17、Spring Boot 3.x - Servlet Web应用程序开发(嵌入式容器)
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/17.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
对于servlet应用程序，Spring Boot包括对嵌入式`Tomcat`、`Jetty`和`Undertow`服务器的支持。大多数开发人员使用适当的“`Starter`”来获得完全配置的实例。默认情况下，嵌入式服务器在端口`8080`上侦听HTTP请求。

## 使用非Tomcat容器

许多Spring Boot启动器都包含默认的嵌入式容器。对于servlet堆栈应用程序，`spring-boot-starter-web`通过包含`spring-boot-starter-tomcat`来包含Tomcat，但您可以使用`spring-boot-starter-jetty`或`spring-boot-starter-undertow`来代替。

当切换到不同的HTTP服务器时，您需要将默认依赖项交换为您需要的依赖项。为了帮助完成这个过程，Spring Boot为每个受支持的HTTP服务器提供了一个单独的starter。

下面的Maven示例展示了如何在Spring MVC中排除Tomcat并包含Jetty:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <!-- Exclude the Tomcat dependency -->
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<!-- Use Jetty instead -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

如果你想使用`Jetty 10`，它支持`servlet 4.0`，你可以这样做，如下所示的例子:

```xml
<properties>
    <jetty.version>10.0.8</jetty.version>
</properties>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <!-- Exclude the Tomcat dependency -->
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
        <!-- Exclude the Jetty-9 specific dependencies -->
        <exclusion>
            <groupId>org.eclipse.jetty.websocket</groupId>
            <artifactId>websocket-server</artifactId>
        </exclusion>
        <exclusion>
            <groupId>org.eclipse.jetty.websocket</groupId>
            <artifactId>javax-websocket-server-impl</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<!-- Use Jetty instead -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

## Servlet, Filter, 和 Listener

当使用嵌入的`servlet`容器时，你可以通过使用`Spring bean`或扫描`servlet`组件从`servlet`规范注册`Servlet`、`Filter`和`Listener`(如`HttpSessionListener`)。

### 注册

任何作为Spring bean的`Servlet`、`Filter`或`servlet *Listener`实例都被注册到嵌入式容器中。而且非常方便使用`application.properties`的属性值。

默认情况下，如果上下文只包含单个`Servlet`，则将其映射到`/`。在使用多个`servlet bean`的情况下，`bean`名被用作路径前缀。过滤器映射到`/*`。

如果基于约定的映射不够灵活，你可以使用ServletRegistrationBean、`FilterRegistrationBean`和`ServletListenerRegistrationBean`类进行完全控制。

通常情况下，保持过滤器无序是安全的。如果需要特定的顺序，你应该用@Order注解过滤器，或者让它实现`Ordered`接口。

不能通过使用@Order注解过滤器的`bean方法`来配置它的顺序。

如果你不能更改`Filter`类以添加`@Order`或实现`Ordered`接口，则必须为`Filter`定义一个`FilterRegistrationBean`，并使用`setOrder(int)`方法设置注册`bean`的顺序。

避免配置顺序为`Ordered.HIGHEST_PRECEDENCE`读取请求体的过滤器，因为它可能会违背应用程序的字符编码配置。如果`servlet`过滤器包装了请求，它应该配置一个小于或等于`OrderedFilter.REQUEST_WRAPPER_FILTER_MAX_ORDER`的顺序。

> 要查看应用程序中每个Filter的顺序，请为web日志记录组启用调试级别日志记录(logging.level.web=debug)。注册过滤器的详细信息，包括它们的顺序和URL模式，将在启动时被记录。
>
> 注册Filter bean时要小心，因为它们是在应用程序生命周期的早期初始化的。如果你需要注册与其他bean交互的过滤器，请考虑使用DelegatingFilterProxyRegistrationBean。

### 扫描

当使用嵌入式容器时，可以通过使用@ServletComponentScan来启用带有@WebServlet、@WebFilter和@WebListener注释的类的自动注册。

> @ServletComponentScan在独立的容器中不起作用，而是使用容器的内置发现机制。

### Servlet上下文初始化

嵌入的servlet容器不会直接执行`jakarta.servlet.ServletContainerInitializer`接口或Spring的`org.springframework.web.WebApplicationInitializer`接口。

这是一个有意的设计决策，旨在减少第三方库在war中运行可能破坏Spring Boot应用程序的风险。

如果你需要在Spring Boot应用程序中执行servlet上下文初始化，你应该注册一个实现`org.springframework.boot.web.servlet.ServletContextInitializer`接口的`bean`。

单个`onStartup`方法提供了对`ServletContext`的访问，如果有必要，可以很容易地将其用作现有`WebApplicationInitializer`的适配器。

### ServletWebServerApplicationContext

在内部，Spring Boot使用了一种不同类型的`ApplicationContext`来支持嵌入式`servlet`容器。

`ServletWebServerApplicationContext`是`WebApplicationContext`的一种特殊类型，它通过搜索单个`ServletWebServerFactory` bean来引导自己。

通常`TomcatServletWebServerFactory`, `JettyServletWebServerFactory`，或`UndertowServletWebServerFactory`已经被自动配置。

在嵌入式容器设置中，`ServletContext`被设置为在应用程序上下文初始化期间发生的服务器启动的一部分。因此，`ApplicationContext`中的bean不能用`ServletContext`可靠地初始化。

解决这个问题的一种方法是将`ApplicationContext`作为bean的依赖项注入，并仅在需要时访问`ServletContext`。另一种方法是在服务器启动后使用回调。可以使用`ApplicationListener`来监听`ApplicationStartedEvent`，如下所示:

```java
public class MyDemoBean implements ApplicationListener<ApplicationStartedEvent> {
    private ServletContext servletContext;
    @Override
    public void onApplicationEvent(ApplicationStartedEvent event) {
        ApplicationContext applicationContext = event.getApplicationContext();
        this.servletContext = ((WebApplicationContext) applicationContext).getServletContext();
    }
}
```

### 定制嵌入式Servlet容器

`servlet`容器设置可以通过使用Spring Environment属性来配置。通常可以在application.properties 或 `application.yaml`配置属性

常用的服务器设置包括:

**1、****网络设置**：`HTTP`请求的监听端口(`server.port`),绑定地址(`server.address`)；

**2、****Session设置**：会话是否持久(`server.servlet.session.persistent`),`session`超时(`server.servlet.session.timeout`),会话数据存储位置(`server.servlet.session.store-dir`),`session-cookie`配置(`server.servlet.session.cookie.*`)；

**3、****错误管理**:错误页面的路径(`server.error.path`)；

**4、****SSL**:`SSL`可以通过设置各种`server.ssl.*`属性，通常在`application.properties`；

**5、****HTTP**压缩；

除了通用配置，针对不同容器Spring Boot也有个性化配置比如:`server.tomcat` 和 `server.undertow`。

### SameSite Cookie

浏览器可以使用`SameSite``cookie`属性来控制是否以及如何在跨站点请求中提交`cookie`。

> Chrome 51 开始，浏览器的 Cookie 新增加了一个SameSite属性，用来防止 CSRF 攻击和用户追踪。

如果你想改变你的`session cookie`的`SameSite`属性，你可以使用`server.servlet.session.cookie.same-site`属性。自动配置的`Tomcat`、`Jetty`和`Undertow`服务器支持此属性。它还用于配置基于`SessionRepository` bean的`Spring Session servlet`。

例如，如果你希望你的会话`cookie`有一个`SameSite`属性为`None`，你可以将以下内容添加到你的`application.properties` 或者 `application.yaml`文件:

```java
server:
  servlet:
    session:
      cookie:
        same-site: "none"
```

如果你想要改变添加到`HttpServletResponse`的其他`cookie`上的`SameSite`属性，你可以使用`CookieSameSiteSupplier`。`CookieSameSiteSupplier`被传递一个`Cookie`，会返回一个SameSite值或`null`。

你可以使用许多方便的工厂和过滤器方法来快速匹配特定的`cookie`。例如，添加以下bean将自动匹配名称为`myapp.*`的cookie，并设置`SameSite`为`Lax`。

```java
@Configuration(proxyBeanMethods = false)
public class MySameSiteConfiguration {
    @Bean
    public CookieSameSiteSupplier applicationCookieSameSiteSupplier() {
        return CookieSameSiteSupplier.ofLax().whenHasNameMatching("myapp.*");
    }
}
```

### 编码配置容器

如果需要以编程方式配置嵌入式`servlet`容器，你可以注册一个实现`WebServerFactoryCustomizer`接口的Spring bean。`WebServerFactoryCustomizer`提供对`ConfigurableServletWebServerFactory`的访问。 其中包括许多自定义setter方法。下面的例子显示了以编程方式设置端口:

```java
@Component
public class MyWebServerFactoryCustomizer implements WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> {
    @Override
    public void customize(ConfigurableServletWebServerFactory server) {
        server.setPort(9000);
    }
}
```

`TomcatServletWebServerFactory`, `JettyServletWebServerFactory`和`UndertowServletWebServerFactory`是`ConfigurableServletWebServerFactory`的专用变体，它们为`Tomcat`,`Jetty`,`Undertow`提供了额外的定制`setter`方法。

下面的例子展示了如何定制`TomcatServletWebServerFactory`来提供对特定于`tomcat`的配置选项的访问:

```java
@Component
public class MyTomcatWebServerFactoryCustomizer implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {
    @Override
    public void customize(TomcatServletWebServerFactory server) {
        server.addConnectorCustomizers((connector) -> connector.setAsyncTimeout(Duration.ofSeconds(20).toMillis()));
    }
}
```

### 直接定制ConfigurableServletWebServerFactory

对于需要从`ServletWebServerFactory`扩展的更高级用例，你可以自己公开此类类型的`bean`。

为许多配置选项提供了`setter`。如果您需要执行一些更特殊的操作，还提供了几个受保护的方法“`hooks`”。

> 自动配置的定制器仍然应用于自定义工厂，因此要谨慎使用该选项。

### JSP限制

当运行使用嵌入式`servlet`容器(并打包为可执行归档文件)的Spring Boot应用程序时，JSP支持存在一些限制。

**1、** 使用`Jetty`和`Tomcat`，如果您使用war打包，它应该可以工作当使用`java-jar`启动时，可执行`war`可以工作，也可以部署到任何标准容器使用可执行jar时不支持jsp；

**2、**`Undertow`不支持`jsp`；

**3、** 创建自定义`error.jsp`页面不会覆盖用于错误处理的默认视图，需要使用自定义错误页面方式；
