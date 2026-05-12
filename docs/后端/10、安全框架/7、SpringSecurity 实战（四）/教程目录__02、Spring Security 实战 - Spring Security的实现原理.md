# 02、Spring Security 实战 - Spring Security的实现原理
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/2.html
- 分类：安全框架
- 分组：教程目录
## 一、实现原理

在Spring Security 中，认证、授权等功能都是基于过滤器来完成的。开发者所见到的 Spring Security 提供的功能，都是通过这些过滤器来实现的，这些过滤器按照既定的优先级排列，最终形成一个过滤器链。当然，开发者也可以自己定义过滤器，并通过`@Order`注解去调整自定义过滤器在过滤器链中的位置。

需要注意的是，**默认过滤器并不是直接放在 Web 项目的原生过滤器链中（即不是JavaWeb中的filter），** 而是通过一个 `FilterChainProxy` 来统一管理。Spring Security中的过滤器链通过 FilterChainProxy 嵌入到 Web 项目的原生过滤器链中。

在Spring Security 中，像上图中嵌入的过滤链不仅仅只有一个，可能会有多个，当存在多个过滤器链时，多个过滤器链之间要指定优先级，当请求到达后，会从 FilterChainProxy 进行分发，先和哪个过滤器链匹配上，就用哪个过滤器链进行处理。当系统中存在多个不同的认证体系时，那么使用多个过滤器链就非常有效。

FilterChainProxy 作为一个顶层管理者，将统一管理 Security Filter。**FilterChainProxy 本身将通过 Spring 框架提供的 DelegatingFilterProxy 整合到原生过滤器链中。**

## 二、内置Filter以及默认加载的Filter

下面表格是默认加载的 Filter（这里的 Filter 都不是原始的 Web Filter），加载顺序是按下表从上而下进行的。

默认加载Filter
过滤器作用
是否加载

WebAsyncManagerIntegrationFilter
将 WebAsyncManager 与SpringSecurity上下文集成
YES

SecurityContextPersistenceFilter
在处理请求之前，将安全信息加载到SecurityContextHolder中
YES

HeaderWriterFilter
处理头信息加入响应中
YES

CsrfFilter
处理CSRF攻击
YES

LogoutFilter
处理注销登录
YES

UsernamePasswordAuthenticationFilter
处理表单认证
YES

DefaultLoginPageGeneratingFilter
配置默认登录页面
YES

DefaultLogoutPageGeneratingFilter
配置默认注销页面
YES

BasicAuthenticationFilter
处理 HttpBasic 登录
YES

RequestCacheAwareFilter
处理请求缓存
YES

SecurityContextHolderAwareRequestFilter
包装原始请求
YES

AnoymousAuthenticationFilter
配置匿名认证
YES

SessionManagementFilter
处理Session并发问题
YES

ExceptionTraslationFilter
处理认证/授权中的异常
YES

加载顺序和上面表一致，通过调试也可以发现（其中第一个不属于内置的Filter，而是自定义的，用来禁用URL进行编码，而最后一个是拦截器并非过滤器，剩下的与上表对应）：

下面俩图总结了默认加载的和未默认加载的Spring Security中的过滤器。

可以看出，Spring Security 提供了 30 多个过滤器。默认情况下 Spring Boot 在对 Spring Security 进行自动化配置时（SpringBoot Auto Configuration），会创建一个名为 `SpringSecurityFilterChain` 的过滤器链对象，并注入到 Spring 容器中，这个过滤器链将负责所有的安全管理，包括用户认证、授权、重定向到登录页面等。

## 三、自动配置分析（SpringBootWebSecurityConfiguration）

下面SecurityFilterChain 自动配置的具体含义：让所有资源都必须经过认证，通过表单和Basic认证。

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnWebApplication(type = Type.SERVLET)
class SpringBootWebSecurityConfiguration {
/*
如果用户指定他们自己的WebSecurityConfigurerAdapter
或SecurityFilterChain bean，这将完全取消
，并且用户应该指定他们想要配置的所有位作为自定义安全配置的一部分。
*/
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnDefaultWebSecurity
	static class SecurityFilterChainConfiguration {
		@Bean
		@Order(SecurityProperties.BASIC_AUTH_ORDER)
		SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
			http.authorizeRequests()
			.anyRequest()
			.authenticated();// 这表示所有请求都必须认证
			http.formLogin();// 开启表单认证
			http.httpBasic();// 开启basic认证
			return http.build();
		}
	}
	/**
	 * Configures the {@link ErrorPageSecurityFilter}.
	 */
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(WebInvocationPrivilegeEvaluator.class)
	@ConditionalOnBean(WebInvocationPrivilegeEvaluator.class)
	static class ErrorPageSecurityFilterConfiguration {
		@Bean
		FilterRegistrationBean<ErrorPageSecurityFilter> errorPageSecurityFilter(ApplicationContext context) {
			FilterRegistrationBean<ErrorPageSecurityFilter> registration = new FilterRegistrationBean<>(
					new ErrorPageSecurityFilter(context));
			registration.setDispatcherTypes(DispatcherType.ERROR);
			return registration;
		}
	}
	@Configuration(proxyBeanMethods = false)
	@ConditionalOnMissingBean(name = BeanIds.SPRING_SECURITY_FILTER_CHAIN)
	@ConditionalOnClass(EnableWebSecurity.class)
	@EnableWebSecurity
	static class WebSecurityEnablerConfiguration {
	}
}
```

如果用户指定了他们自己的配置，那这个 SecurityFilterChain 配置就会按用户指定的来。

### @ConditionalOnMissingBean

**实现效果是源于 SpringBoot 内的 @ConditionalOnMissingBean 注解，用于根据是否存在指定类型的Bean来决定是否创建或注册一个Bean。如果存在指定类型的Bean，则不会创建或注册该Bean；否则，会创建或注册该Bean。**

@ConditionalOnDefaultWebSecurity =》

元注解@Conditional(DefaultWebSecurityCondition.class) =》

```java
@ConditionalOnClass({
      SecurityFilterChain.class, 
					HttpSecurity.class })
	static class Classes {
	}
@ConditionalOnMissingBean({
org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter.class,
SecurityFilterChain.class })
```

上述源码表示使用默认配置的条件有俩条：

**1、**`类路径`得有SecurityFilterChain、HttpSecurity（**注意是类路径，容器内有对SecurityFilterChain的默认实现类，但没有交给容器管理，所以也是满足条件2的**）；

**2、** 容器内不得有SecurityFilterChain和WebSecurityConfigurerAdapter实例对象；

即容器中没有 `WebSecurityConfigurerAdapter` 对象或 `SecurityFilterChain` 对象，就会按默认配置来，有的话就按用户自定义来。

但是在`Spring Security 5.7.8` 这个新版本中已经把继承 WebSecurityConfigurerAdapter 这种方式给弃用了，而是去使用`@EnableWebSecurity`注解。原因是这样可以更加灵活地配置安全策略，并且能够更好地与Spring Boot等框架进行集成。比如使用 `@EnableGlobalMethodSecurity` 注解进行进一步的安全配置。

## 四、自己配置SecurityFilterChain

在5.7.8 之后已经开始推荐使用 @EnableWebSecurity 注解的形式进行开发了，而 WebSecurityConfigurerAdapter 这个类已经被弃用。新版配置如下：

```java
@EnableWebSecurity
public class WebSecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(@Autowired HttpSecurity http) throws Exception {
        return http.authorizeRequests()
                .anyRequest()
                .authenticated()
                .and()
                .formLogin()
                .and()
                .build();
    }
}
```

**注意：可以不用在写@Configuration注解去表明这是配置类了，这是因为@EnableWebSecurity 上被@Configuration 元注解标识了。**
