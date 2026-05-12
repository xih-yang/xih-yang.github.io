# 07、Spring Security 源码解析 - 配置器详解
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/7.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
## 〇、上篇回顾

- 前面文章介绍了整体架构的设计，知道了整个框架由 建造者 和 配置器 构成，而各个建造者在前文也已经了解了，本篇来学学 配置器，了解其内部的组成成员和功能。

## 一、配置器接口架构

- 整体UML类图
- 展开

### SecurityConfigurer

> 配置器的顶级接口，定义了 init() 和 configure() 接口方法

- init(B builder)：初始化 {@link SecurityBuilder}
- configure(B builder)：配置 {@link SecurityBuilder} 必要的属性

### SecurityConfigurerAdapter

> {@link SecurityConfigurer} 的子类，init() 和 configure() 皆为空实现，由子类去实现。它主要提供了 and() 方法，用于获得对正在配置的 {@link SecurityBuilder} 的访问权。

- postProcess(T object)：对传入的对象进行后置处理。
- and()、getBuilder()：返回当前正在配置的 SecurityBuilder 。

### AbstractHttpConfigurer

> 继承了 SecurityConfigurerAdapter 类，增加了禁用功能，一般自定义配置器时会继承这个类。

- disable()：通过移除 {@link AbstractHttpConfigurer} 来禁用该配置。
- withObjectPostProcessor：调用了父类的 postProcess(T object) 方法，进行对象的后置处理。

### WebSecurityConfigurerAdapter

> 提供了一个方便的子类来创建 {@link WebSecurityConfigurer} 实例。该实现允许通过重写方法进行定制。一般我们会继承这个类来定制自己的 WebSecurityConfig。

- configure(HttpSecurity http)：由子类重写这个方法来配置 HttpSecurity 建造者。
- configure(AuthenticationManagerBuilder auth)：由子类重写这个方法来配置 AuthenticationManagerBuilder 建造者。
- init(final WebSecurity web)：
- 创建 `HttpSecurity` 对象同时将其保存到 `securityFilterChainBuilders` 中，用于最后真正执行时创建单个的 `securityFilterChain`。
- 创建一个最后执行的线程，该线程的目的是将过滤器 `FilterSecurityInterceptor` 添加到 `WebSecurity` 中。

```java
public void init(final WebSecurity web) throws Exception {
    final HttpSecurity http = getHttp();
    web.addSecurityFilterChainBuilder(http).postBuildAction(new Runnable() {
        public void run() {
            FilterSecurityInterceptor securityInterceptor = http
                    .getSharedObject(FilterSecurityInterceptor.class);
            web.securityInterceptor(securityInterceptor);
        }
    });
}
```

## 二、如何使用这个框架？

- 其实在开发的时候，建造者我们是不会动的，我们能做的只是将我们自己的配置添加到整个架构下，所以我们能扩展的是配置器
- 可以参考其他一些源码中默认的配置器，定义我们自己 HttpConfigurer 也继承 AbstractHttpConfigurer ，将自定义的单个过滤器配置到 HttpSecurity。
- 可以定义自己的 WebSecurityConfig 配置器，继承 WebSecurityConfigurerAdapter，将源码中默认的一些过滤器和自定义的过滤器配置到 HttpSecurity ，由建造者创建后形成一条过滤器链。
- 可以这么理解记忆（但不是很准确）
- `AbstractHttpConfigurer` 配置器是用来配置 `HttpSecurity` 建造者
- `WebSecurityConfigurerAdapter` 配置器是用来配置 `WebSecurity` 建造者

## 三、总结

- 其实整个配置器最重要的两个方法就是 init() 和 configure() ，目的是配置 WebSecurity、HttpSecurity 和 AuthenticationManagerBuilder 三个建造者，所有都配置好后就可以创建核心过滤器了。
- AbstractHttpConfigurer 配置器是用来配置 HttpSecurity 建造者
- WebSecurityConfigurerAdapter 配置器是用来配置 WebSecurity 建造者
