# 08、Spring Security 源码解析 - FilterChainProxy 是如何创建的？
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/8.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
## 〇、上篇回顾

- 整个框架的核心就是构建一个名字为 springSecurityFilterChain 的过滤器，它的类型是 FilterChainProxy
- 框架的主要参与者是 建造者 和 配置器 ，其中 WebSecurity 和 HttpSecurity 都是 建造者
- WebSecurity 的构建目标是 FilterChainProxy 对象，即核心过滤器 springSecurityFilterChain
- HttpSecurity 的构建目标只是 FilterChainProxy 对象中一组 SecurityFilterChain 的一个
- 配置器 主要关注 init()、configure() 方法

## 一、WebSecurityConfiguration

> 第一篇《Spring Security源码（一）：整体框架设计》文章提到，看源码可以从 @EnableWebSecurity 注解开始，点进去发现它引入了类 WebSecurityConfiguration，类中正好有生成核心过滤器的Bean方法 springSecurityFilterChain() ，还需要关注类中另一个方法 setFilterChainProxySecurityConfigurer()，一起来看看。

### setFilterChainProxySecurityConfigurer()

- 创建 WebSecurity 建造者对象，apply() 初始配置。

```java
@Autowired(required = false)
public void setFilterChainProxySecurityConfigurer(
        ObjectPostProcessor<Object> objectPostProcessor,
        @Value("#{@autowiredWebSecurityConfigurersIgnoreParents.getWebSecurityConfigurers()}") List<SecurityConfigurer<Filter, WebSecurity>> webSecurityConfigurers)
        throws Exception {
    webSecurity = objectPostProcessor
            .postProcess(new WebSecurity(objectPostProcessor));
    if (debugEnabled != null) {
        webSecurity.debug(debugEnabled);
    }
    Collections.sort(webSecurityConfigurers, AnnotationAwareOrderComparator.INSTANCE);
    Integer previousOrder = null;
    Object previousConfig = null;
    for (SecurityConfigurer<Filter, WebSecurity> config : webSecurityConfigurers) {
        Integer order = AnnotationAwareOrderComparator.lookupOrder(config);
        if (previousOrder != null && previousOrder.equals(order)) {
            throw new IllegalStateException(
                    "@Order on WebSecurityConfigurers must be unique. Order of "
                            + order + " was already used on " + previousConfig + ", so it cannot be used on "
                            + config + " too.");
        }
        previousOrder = order;
        previousConfig = config;
    }
    for (SecurityConfigurer<Filter, WebSecurity> webSecurityConfigurer : webSecurityConfigurers) {
        webSecurity.apply(webSecurityConfigurer);
    }
    this.webSecurityConfigurers = webSecurityConfigurers;
}
```

### springSecurityFilterChain()

- 建造者 webSecurity 调用 build() 方法，开始构建 springSecurityFilterChain。

```java
@Bean(name = AbstractSecurityWebApplicationInitializer.DEFAULT_FILTER_NAME)
public Filter springSecurityFilterChain() throws Exception {
    boolean hasConfigurers = webSecurityConfigurers != null
            && !webSecurityConfigurers.isEmpty();
    if (!hasConfigurers) {
        WebSecurityConfigurerAdapter adapter = objectObjectPostProcessor
                .postProcess(new WebSecurityConfigurerAdapter() {
                });
        webSecurity.apply(adapter);
    }
    return webSecurity.build();
}
```

## 二、FilterChainProxy的创建过程

### 创建过程

- springSecurityFilterChain() 方法中，webSecurity 调用了 build() 方法
- 方法进去继续调用了 doBuild()，该方法依次调用各个配置器的 init()、configure() 方法
- 等配置到位后，开始执行 performBuild()，进行核心过滤器 FilterChainProxy 的创建

```java
@Override
protected final O doBuild() throws Exception {
    synchronized (configurers) {
        buildState = BuildState.INITIALIZING;
        beforeInit();
        init();
        buildState = BuildState.CONFIGURING;
        beforeConfigure();
        configure();
        buildState = BuildState.BUILDING;
        O result = performBuild();
        buildState = BuildState.BUILT;
        return result;
    }
}
```

- webSecurity 调用的 performBuild() 方法就创建了核心过滤器 FilterChainProxy。

> 注意创建过程可不是这么简单的由 webSecurity 一次性调用下来，就是说 doBuild() 可不只是被 webSecurity 对象调用，会被很多创建者重复调用，重复的去走创建流程，比如被一堆的 HttpSecurity 调用目的是创建单条过滤器链，可以自己Debug去走一走。

### performBuild() 介绍

> 回顾第二章《Spring Security源码（二）：建造者详解》，该方法被 WebSecurity、HttpSecurity、AuthenticationManagerBuilder 三个建造者所实现，此篇先不关心后者。

- HttpSecurity#performBuild：创建核心过滤器中单条过滤器链：SecurityFilterChain

```java
@Override
protected DefaultSecurityFilterChain performBuild() throws Exception {
    Collections.sort(filters, comparator);
    return new DefaultSecurityFilterChain(requestMatcher, filters);
}
```

- WebSecurity#performBuild：创建核心过滤器：FilterChainProxy

```java
@Override
protected Filter performBuild() throws Exception {
    Assert.state(
            !securityFilterChainBuilders.isEmpty(),
            "At least one SecurityBuilder<? extends SecurityFilterChain> needs to be specified. Typically this done by adding a @Configuration that extends WebSecurityConfigurerAdapter. More advanced users can invoke "
                    + WebSecurity.class.getSimpleName()
                    + ".addSecurityFilterChainBuilder directly");
    int chainSize = ignoredRequests.size() + securityFilterChainBuilders.size();
    List<SecurityFilterChain> securityFilterChains = new ArrayList<SecurityFilterChain>(
            chainSize);
    for (RequestMatcher ignoredRequest : ignoredRequests) {
        securityFilterChains.add(new DefaultSecurityFilterChain(ignoredRequest));
    }
    for (SecurityBuilder<? extends SecurityFilterChain> securityFilterChainBuilder : securityFilterChainBuilders) {
        securityFilterChains.add(securityFilterChainBuilder.build());
    }
    FilterChainProxy filterChainProxy = new FilterChainProxy(securityFilterChains);
    if (httpFirewall != null) {
        filterChainProxy.setFirewall(httpFirewall);
    }
    filterChainProxy.afterPropertiesSet();
    Filter result = filterChainProxy;
    if (debugEnabled) {
        logger.warn("\n\n"
                + "********************************************************************\n"
                + "**********        Security debugging is enabled.       *************\n"
                + "**********    This may include sensitive information.  *************\n"
                + "**********      Do not use in a production system!     *************\n"
                + "********************************************************************\n\n");
        result = new DebugFilter(filterChainProxy);
    }
    postBuildAction.run();
    return result;
}
```

### securityFilterChainBuilders 什么时候插入的？

> 上面 WebSecurity#performBuild 方法中循环所有的 securityFilterChainBuilders 创建单条过滤器链，其中的数据是什么时候插入的？

- 其实在上一章[《Spring Security源码（四）：配置器详解》](/zhuanlan/security/springsecurity/10/7.html)讲到了，是在 WebSecurityConfigurerAdapter#init 方法中插入的。

## 三、Debug

### 结果分析

- 可以看到核心过滤器 FilterChainProxy 有两个过滤器链，其中一个就是我们自己定义的，有14个过滤器，部分是我们定义的部分是系统默认的，仔细发现两个过滤器链最后一个过滤器都是 FilterSecurityInterceptor。

### FilterSecurityInterceptor

- 这个类是在 WebSecurityConfigurerAdapter#init 方法中创建的，创建了一个新线程，最后在 WebSecurity#performBuild 中启动该线程 postBuildAction.run(); 将这个过滤器添加到每个过滤器链的末位，在认证过程中保证该过滤器是最后执行的。
- 这个过滤器是整个链条的最后一环，过了它就可以访问我们后台的资源服务了。
- Spring Security的访问控制功能，它起到了至关重要的作用，后面文章来对它进行详细解析。

## 四、总结

- 其实找到源码入口，跟踪方法调用链，再去了解下相关的一些建造者、配置器类，也就基本知道核心过滤器是怎么创建的了。
