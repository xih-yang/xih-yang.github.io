# 13、SpringBoot 实战 - 集成 Actuator
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/13.html
- 分类：J2EE框架
- 分组：教程目录
**官方文档：**[https://docs.spring.io/spring-boot/docs/2.4.5/reference/htmlsingle/#production-ready](https://docs.spring.io/spring-boot/docs/2.4.5/reference/htmlsingle/#production-ready)

（`2.4.5` 为 SpringBoot 版本号，查看其他的 SpringBoot 版本对应的 Spring Actuator 文档可以直接在地址栏替换后访问。）

## 一、简介

**Spring Actuator：** 是 Spring Boot 提供的一组用于 监控和管理 Spring Boot 应用 的组件，可以通过 HTTP、JMX 或远程 Shell 访问应用的运行时信息和统计数据。Actuator 提供了一些常用的端点（endpoint），可以用来获取应用的健康状况、环境信息、配置信息、日志 等。

`端点`：指的是用于监控应用服务的指标，比如应用服务的健康状况等，一般是 `HTTP` 或 `JMX` 接口形式。

常用的端点包括：

- /health：用于获取应用的健康状况，返回的结果包含应用的状态信息、健康检查结果、数据库连接状态等；
- /info：用于获取应用的基本信息，返回的结果包含应用的版本信息、构建时间、Git 提交 ID 等。
- /metrics：用于获取应用的统计信息，返回的结果包含应用的请求数、响应时间、错误数等。
- /env：用于获取应用的环境信息，返回的结果包含应用的配置属性、系统属性等。
- /loggers：用于获取或修改应用的日志记录器，可以查看日志的级别、修改日志的级别等。

*（更多端点的详细信息在文章的后面具体介绍）*

`Actuator` 还提供了一些扩展的端点和功能，如审计（Audit）、远程 Shell 访问、线程 Dump 等。通过 `Actuator`，开发者可以更方便地了解应用地运行状况和性能，同时可以通过暴露地端点和功能来对应用进行管理和调优。可以通过在 `pom.xml` 文件中引入 `spring-boot-starter-actuator` 依赖来使用 `Actuator` 组件。

## 二、Maven依赖

```xml
<!-- Spring Actuator -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

## 三、使用入门

### 1.HTTP 方式访问端点

查看服务开启的 `HTTP` 端点，浏览器访问地址：http://localhost:8080/actuator

查看不同服务的端点，只需要在端口后拼接 `/actuator`+ `/` + `端点` 即可，例如：http://localhost:8080/actuator/health

### 2.JMX 方式访问端点

`JMX（Java Management Extensions）` 接口需要通过 `Java Console（jconsole）` 来进行访问。

> Java Console（jconsole） 是 Java 平台自带的一款监控工具，可以用于监控 Java 应用程序的性能和资源使用情况。jconsole 可以监控本地或远程的 Java 进程，并提供了可视化界面（GUI）展示 Java 进程的运行状态和性能指标。

注意：因为 `jconsole` 使用 `GUI` 进行可视化界面的展示，所以没有可视化界面的 Linux 服务器是无法使用的。

`jconsole` 与 `JMX` 服务一起使用，通过 `JMX` 服务暴露的 `MBean（Managed Bean）` 对象来获取和管理 Java 应用程序的状态和属性信息。开发者可以在 Java 应用程序中使用 JMX API 来暴露自定义的 MBean 对象，并在 jconsole 中查看和管理这些 `MBean` 对象。

jconsole 使用方式：

- 方式一：命令行直接输入 jconsole 回车；
- 方式二：Windows 系统下可以使用 Ctrl + R，输入 jconsole 回车。

选择好自己的 Java 项目后，可以双击连接。

会提示`无法使用 SSL 连接到 ***` ，这个不影响，我们点击 `不安全的连接` 即可。

然后就可以看到我们的可视化界面了，这里我们可以查看 `概览`、`内存`、`线程`、`类`、`VM`、`概要`、`MBean` 等信息。

我们把标签切换到 `MBean`，点击 `org.springframework.boot`，再点击 `Endpoint`，就可以看到 `Spring Actuator` 在 `JMX` 中默认暴露出来的端点了。（这里可以发现：JMX 暴露的端点比 HTTP 暴露的端点更多）

### 3.端点信息整理

以下是与技术无关的可用端点：

*（HTTP 方式默认只开启 health 和 info，JMX 方式默认全部开启）*

端点ID
说明
默认HTTP
默认JMX

auditevents
展示当前应用程序的审核事件信息。需要一个 AuditEventRepository bean。
N
Y

beans
展示应用中所有 Spring bean 的完整列表。
N
Y

caches
展示所有可用的缓存。
N
Y

conditions
显示在配置和自动配置类上评估的条件以及它们匹配或不匹配的原因。
N
Y

configprops
显示所有 @ConfigurationProperties 的信息。
N
Y

env
显示 ConfigurableEnvironment 中的属性。
N
Y

flyway
显示已应用的任何 Flyway 数据库迁移。需要一个或多个 Flyway bean。
N
Y

health
显示应用程序健康信息。
Y
Y

httptrace
显示 HTTP 跟踪信息（默认情况下，最近 100 次 HTTP 请求-响应交换）。需要一个 HttpTraceRepository bean。
N
Y

info
显示任意应用程序信息。
Y
Y

integrationgraph
显示 Spring Integration 图。需要对 spring-integration-core。
N
Y

loggers
显示和修改应用程序中 loggers 的配置。
N
Y

liquibase
显示已应用的任何 Liquibase 数据库迁移。需要一个或多个 Liquibase bean。
N
Y

metrics
显示当前应用程序的“指标”信息。
N
Y

mappings
显示所有路径的整理列表 @RequestMapping。
N
Y

scheduledtasks
显示应用程序中的计划任务。
N
Y

sessions
允许从 Spring Session 支持的会话存储中检索和删除用户会话。需要使用 Spring Session 的基于Servlet 的 Web 应用程序。
N
Y

shutdown
让应用程序正常关闭。默认情况下禁用。
N
Y

startup
显示收集的启动步骤数据 ApplicationStartup。需要 SpringApplication 配欸只一个 BufferingApplicationStartup。
N
Y

threaddump
执行线程转储。
N
Y

如果您的应用程序是 Web 应用程序（Spring MVC、Spring WebFlux 或 Jersey），可以使用以下附加端点：

端点ID
说明
默认HTTP
默认JMX

heapdump
返回 hprof 堆转储文件。
N
不适用

jolokia
通过 HTTP 展示 JMX bean（当 Jolokia 在类路径上时，不适用于 WebFlux）。需要 jolokia-core 依赖。
N
不适用

logfile
返回日志文件的内容（如果 logging.file.name 或 logging.file.path 属性已设置）。支持使用 HTTP Range 标头检索日志文件的部分内容。
N
不适用

prometheus
以 Prometheus 服务器可以抓取的格式展示指标。需要 micrometer-registry-prometheus 依赖。
N
不适用

### 4.端点的启用与禁用

默认情况下，除 `shutdown` 之外的所有端点都是开启的。如果需要配置一个端点的启用状态，可以使用 `management.endpoint..enabled` 属性。例如启用 `shutdown` 端口：

```java
management.endpoint.shutdown.enabled=true
```

如果你希望端点是指定哪些启用而不是指定哪些禁用，可以将 `management.endpoints.enabled-by-default` 属性设置为 `false` 并想要启用端点的 `enabled` 属性设置为 `true`。例如启用 `info` 端点并禁用其他所有端点：

```java
management.endpoints.enabled-by-default=false
management.endpoint.info.enabled=true
```

注意：禁用的端点会完全从应用程序的上下文中删除。如果只想更改公开的端点，可以使用 `include` 和 `exclude` 属性。

### 5.端点的公开

要更改公开的端点，可以使用以下方式指定 HTTP 或 JMX 的 `include` 和 `exclude` 属性。

属性
默认

management.endpoints.jmx.exposure.exclude

management.endpoints.jmx.exposure.include
*

management.endpoints.web.exposure.exclude

management.endpoints.web.exposure.include
info, health

- include 属性列出了公开的端点 ID；
- exclude 属性列出不应公开的端点 ID。
- 属性 exclude 优于 include 属性。

例如：要停止公开通过 JMX 的所有端点并仅公开 `health` 和 `info` 端点，请使用以下属性：

```java
management.endpoints.jmx.exposure.include=info,health
```

符号`*` 可用于选择所有的端点。例如：公开通过 HTTP 除 `env` 和 `beans` 端点之外的所有内容，请使用以下属性：

```java
management.endpoints.web.exposure.include=*
management.endpoints.web.exposure.exclude=env,beans
```

**注意：** 符号 `*` 在 YAML 中具有特殊函数，因此如果要包含（或排除）所有端点，请务必添加引号：

```java
management:
  endpoints:
    web:
      exposure:
        include: "*"
        exclude: "env,beans"
```

**补充：** 如果想在暴露端点时实时自己的策略，可以自己注册一个 `EndpointFilter` bean。

### 6.保护 HTTP 端点

我们需要像保护任何其他敏感 `URL` 一样注意保护 `HTTP` 端点。如果存在 `Spring Security`，则默认情况下使用 Spring Security 的`内容协商策略`保护端点。如果希望为 HTTP 端点配置自定义安全性，例如，只允许具有特定角色的用户访问它们，Spring Boot 提供了一些 `RequestMatcher` 可以与 Spring Security 结合使用的方便对象。

典型的Spring Security 配置可能类似于以下示例：

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.requestMatcher(EndpointRequest.toAnyEndpoint()).authorizeRequests((requests) -> 
        requests.anyRequest().hasRole("ENDPOINT_ADMIN"));
    http.httpBasic();
    return http.build();
}
```

前面的示例使用 `EndpointRequest.toAnyEndpoint()` 将请求匹配到任何端点，然后确保所有端点都具有该 `ENDPOINT_ADMIN` 角色。`EndpointRequest` 上还提供了其他几种匹配器方法。相关的 API 文档地址：[https://docs.spring.io/spring-boot/docs/2.4.5/actuator-api/htmlsingle/](https://docs.spring.io/spring-boot/docs/2.4.5/actuator-api/htmlsingle/)

如果是在防火墙后部署应用程序，你可能希望无需身份验证即可访问所有执行器端点。可以通过更改 `management.endpoints.web.exposure.include` 属性来实现，如下所示：

```java
management:
  endpoints:
    web:
      exposure:
        include: "*"
```

此外，如果存在 Spring Security，将需要添加自定义安全配置，以允许对端点进行未经身份验证的访问，如下所示：

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throw Exception {
    http.requestMatcher(EndpointRequest.toAnyEndpoint()).authorizeRequest((requests) ->
		requests.anyRequest().permitAll());
    return http.build();
}
```

**注意：** 在上面的两个示例中，配置仅适用于执行器断电。由于 Spring Boot 的安全配置在任何 bean 存在的情况下都需要完全退出 `SecurityFilterChain`，因此您需要使用 `SecurityFilterChain` 适用于应用程序其余部分的规则配置额外的 bean。

### 7.配置 CORS 跨域

可以进行如下配置：

```java
managements:
  endpoints:
    web:
      cors:
        allowed-origins: "https://example.com"
        allowed-methos: "GET,POST"
```

整理完毕，完结撒花~ 🌻
