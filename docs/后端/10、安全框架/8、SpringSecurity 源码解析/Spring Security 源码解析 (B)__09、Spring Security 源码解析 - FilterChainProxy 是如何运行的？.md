# 09、Spring Security 源码解析 - FilterChainProxy 是如何运行的？
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/9.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
## 〇、上篇回顾

- 上篇文章学习了如何通过建造者和配置器创建出核心过滤器 springSecurityFilterChain ，但也只是个加入Bean容器的对象而已，对于如何在项目中运行起来的，要让我们创建的 Filter 有效需要将其加入 Servlet 容器，一起来看看。

## 一、关于 SpringBoot 中 Filter 加入 Servlet 容器的方式

> 在学习如何将核心过滤器加入 Servlet 容器之前，我们先来了解 SpringBoot 中添加 Filter 到 Servlet 容器的方式。

### 方式一

- 使用 @WebFilter 注解，@ServletComponentScan 所扫描的包路径必须包含该 Filter

```java
@WebFilter(filterName = "myFilter",urlPatterns = "/*")
public class MyFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
    }
    @Override
    public void destroy() {
    }
}
@SpringBootApplication
@EnableAutoConfiguration
@EnableWebMvc
@ServletComponentScan(basePackages = "com.fanyin.eghm")
public class EghmApplication {
    public static void main(String[] args) {
        SpringApplication.run(EghmApplication.class, args);
    }
}
```

### 方式二

```java
@Configuration
public class FilterConfig {
    @Bean
    public FilterRegistrationBean filterRegistrationBean(){
        FilterRegistrationBean bean = new FilterRegistrationBean();
        bean.setFilter(new MyFilter2());
        bean.addUrlPatterns("/*");
        return bean;
    }
}
```

### 方式三

```java
@Bean("proxyFilter")
public Filter filter (){
    return new Filter() {
        @Override
        public void init(javax.servlet.FilterConfig filterConfig) throws ServletException {
        }
        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        }
        @Override
        public void destroy() {
        }
    };
}
@Bean
public DelegatingFilterProxyRegistrationBean delegatingFilterProxyRegistrationBean(){
    DelegatingFilterProxyRegistrationBean bean = new DelegatingFilterProxyRegistrationBean("proxyFilter");
    bean.addUrlPatterns("/*");
    return bean;
}
```

- 第二种和第三种类似，均实现了 AbstractFilterRegistrationBean 接口，而该接口间接实现了 ServletContextInitializer ，SpringBoot 在启动容器后会查找实现该接口的 Bean，并调用 onStartup() 方法添加自定义的 Filter，两者的区别：
- `DelegatingFilterProxyRegistrationBean` 通过传入的 proxyFilter 名字，在 WebApplicationContext 查找该 Fillter Bean，并通过 DelegatingFilterProxy 生成基于该 Bean 的代理 Filter 对象。
- `FilterRegistrationBean` 则是直接设置一个Filter，因此该 Filter 可以有 Spring 容器管理，也可不用 Spring 管理。

### 方式四

- 如果 Filter 声明为一个 Bean，则不需要定义为 FilterRegistrationBean，也会被 Spring 发现并添加，就是方法四，该方式无法定义拦截规则等，默认全局，慎用。

```java
@Bean("myFilter")
public Filter filter() {
    return new Filter() {
        @Override
        public void init(javax.servlet.FilterConfig filterConfig) throws ServletException {
        }
        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        }
        @Override
        public void destroy() {
        }
    };
}
```

> 本小节参考来源：https://www.jianshu.com/p/3d421fbce734

## 二、核心过滤器是如何加入 Sevlet 容器的？

### SecurityFilterAutoConfiguration

> 其实核心过滤器的加入方式使用的是上面提到的方式三，SpringBoot 提供了这么一个类：SecurityFilterAutoConfiguration

```java
@Configuration(proxyBeanMethods = false)
// 仅在 Servlet 环境下生效
@ConditionalOnWebApplication(type = Type.SERVLET)
// 确保安全属性配置信息被加载并以 bean 形式被注册到容器
@EnableConfigurationProperties(SecurityProperties.class)
// 仅在特定类存在于 classpath 上时才生效
@ConditionalOnClass({
      AbstractSecurityWebApplicationInitializer.class, SessionCreationPolicy.class })
// 指定该配置类在 SecurityAutoConfiguration 配置类应用之后应用
@AutoConfigureAfter(SecurityAutoConfiguration.class)
public class SecurityFilterAutoConfiguration {
	// 要注册到 Servlet 容器的 DelegatingFilterProxy Filter的目标代理 Filter Bean 的名称：springSecurityFilterChain，
	// 会发现实际上就是我们的核心过滤器的 Bean。
	private static final String DEFAULT_FILTER_NAME = AbstractSecurityWebApplicationInitializer.DEFAULT_FILTER_NAME;
	// 定义一个 securityFilterChainRegistration 的 Bean，其目的是注册另外一个 Bean 到 Servlet 容器
	// 实现类为 DelegatingFilterProxy 的一个 Servlet Filter，该 DelegatingFilterProxy Filter 其实是一个代理过滤器
	// 它被 Servlet 容器用于匹配特定URL模式的请求，而它会将任务委托给名字为 springSecurityFilterChain 的 Filter
	@Bean
	@ConditionalOnBean(name = DEFAULT_FILTER_NAME)
	public DelegatingFilterProxyRegistrationBean securityFilterChainRegistration(
			SecurityProperties securityProperties) {
		DelegatingFilterProxyRegistrationBean registration = new DelegatingFilterProxyRegistrationBean(
				DEFAULT_FILTER_NAME);
		registration.setOrder(securityProperties.getFilter().getOrder());
		registration.setDispatcherTypes(getDispatcherTypes(securityProperties));
		return registration;
	}
	private EnumSet<DispatcherType> getDispatcherTypes(SecurityProperties securityProperties) {
		if (securityProperties.getFilter().getDispatcherTypes() == null) {
			return null;
		}
		return securityProperties.getFilter().getDispatcherTypes().stream()
				.map((type) -> DispatcherType.valueOf(type.name()))
				.collect(Collectors.toCollection(() -> EnumSet.noneOf(DispatcherType.class)));
	}
}
```

### 类说明

- 该类主要定义了一个 securityFilterChainRegistration 的 Bean，其目的是注册另外一个 Bean 到 Servlet 容器，实现类为 DelegatingFilterProxy 的一个 Servlet Filter。
- 这个 DelegatingFilterProxy Filter 其实是一个代理过滤器，它被 Servlet 容器用于匹配特定 URL 模式的请求，而它会将任务委托给名字为 springSecurityFilterChain 的 Filter。
- 正好，我们 Spring Security 的核心过滤器名字就是 springSecurityFilterChain，其实现类是 FilterChainProxy。

## 三、运行过程

- FilterChainProxy 过滤器已经加入了 ServletContext，请求到达的时候会调用 doFilter()
- doFilter() 里面进入方法 doFilterInternal()，里面 getFilters() 方法返回第一条匹配中请求的过滤器链，然后使用过滤器链（filters）和请求（fwRequest）以及原始过滤器链（chain）共同创建出类型为 VirtualFilterChain 虚拟过滤器链对象 vfc，目的是为了在过滤器链上传递请求，这里便是典型的责任链模式。
- 之后请求开始被所有 Filter 处理，所有 Filter 都处理过之后会使用原始过滤器调用 doFilter(request, response) 继续被其他的过滤器处理，如下截取了部分代码：

```java
public void doFilter(ServletRequest request, ServletResponse response)
        throws IOException, ServletException {
    if (currentPosition == size) {
        if (logger.isDebugEnabled()) {
            logger.debug(UrlUtils.buildRequestUrl(firewalledRequest)
                    + " reached end of additional filter chain; proceeding with original chain");
        }
        // Deactivate path stripping as we exit the security filter chain
        this.firewalledRequest.reset();
        originalChain.doFilter(request, response);
    }
    else {
        currentPosition++;
        Filter nextFilter = additionalFilters.get(currentPosition - 1);
        if (logger.isDebugEnabled()) {
            logger.debug(UrlUtils.buildRequestUrl(firewalledRequest)
                    + " at position " + currentPosition + " of " + size
                    + " in additional filter chain; firing Filter: '"
                    + nextFilter.getClass().getSimpleName() + "'");
        }
        nextFilter.doFilter(request, response, this);
    }
}
```

## 四、总结

- 首先我们需要将过滤器加入到 ServletContext 才能起作用
- 要了解 SpringBoot 中 如何将 Filter 加入 Servlet 容器
- 最后要知道 Spring Security 的过滤器链也只是整个请求处理的一环
