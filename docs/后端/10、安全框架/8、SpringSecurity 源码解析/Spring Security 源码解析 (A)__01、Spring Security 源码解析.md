# 01、Spring Security 源码解析
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/16.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (A)
### Spring Security 是什么？

Spring官网中对Spring Security有这么一段介绍：

Spring Security is a powerful and highly customizable authentication and access-control framework. It is the de-facto standard for securing Spring-based applications.

Spring Security is a framework that focuses on providing both authentication and authorization to Java applications. Like all Spring projects, the real power of Spring Security is found in how easily it can be extended to meet custom requirements

翻译一下就是Spring Security是一个强力的并且高度定制化的身份验证和访问控制的框架。它是基于Spring应用程序的一套标准。Spring Security是一个致力于为java应用程序提供身份验证和授权的框架。和所有的Spring项目一样，Spring Security真正的强大在于可以非常简单的拓展功能来实现自定义的需求。

**总结来说，Spring Security是一套访问控制的框架，主要的功能是验证和授权。**

### 从官方文档了解Spring Security的架构设计

Spring Security支持Servlet和WebFlux。WebFlux的版本没有看过相关的源码，因此本文档只关注Spring Security对于Servlet的支持。

点开Spring Security（Servlet）的官方文档，点击Architecture，就可以看到Spring Security的整体架构设计。

从官网中选取最具代表性的一张架构设计图，可以清晰的看到客户端发送的请求，需要经过一系列的过滤器后才能执行真正的Servlet方法，Spring Security就是过滤器链中的其中一环。根据官方介绍，Spring Security中主要有2个类和1个接口，分别是DetegatingFilterProxy、FilterChainProxy和SecurityFilterChain。

本章主要简述Spring Security的整体设计，详细源码在后续章节讲解。

Spring Security的运行流程主要是由DetegatingFilterProxy进行分派，真正要执行的过滤器链由FilterChainProxy进行代理。在容器启动的时候，通过@Bean注解会在IOC容器里面创建springSecurityFilterChain，而**springSecurityFilterChain其本质就是FilterChainProxy对象**。在创建springSecurityFilterChain时，会通过FilterChainProxy的有参构造器注入默认的DefaultSecurityFilterChain和调用securityFilterChainBuilder的build方法生成的DefaultSecurityFilterChain。默认的DefaultSecurityFilterChain中没有任何过滤器，但是调用securityFilterChainBuilder的build方法生成的DefaultSecurityFilterChain里面就会注入Spring Security的一系列默认的过滤器。SecurityFilterChain是一个接口，接口里面定义了 matches方法和getFilters方法。FilterChainProxy执行过滤的时候会先调用SecurityFilterChain的matches方法，看是否满足匹配条件，如果不满足就继续下一个SecurityFilterChain。如果满足匹配条件，就会调用getFilters方法来获取到注册的过滤器，然后执行过滤器的doFilter方法进行过滤。

过滤成功和失败都提供了回调的接口，可以自定义实现，这个后续源码解析的时候再做分析。

### 后续篇幅摘要

下个篇章主要讲解**Spring Security主流程源码解析**
