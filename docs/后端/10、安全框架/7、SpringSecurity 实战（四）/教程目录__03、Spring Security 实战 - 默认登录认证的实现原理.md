# 03、Spring Security 实战 - 默认登录认证的实现原理
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/3.html
- 分类：安全框架
- 分组：教程目录
## 一、默认配置登录认证过程

## 二、流程分析

由默认的 SecurityFilterChain 为例（即表单登录），向服务器请求 /hello 资源Spring Security 的流程分析如下：

**1、** 请求/hello接口，在引入SpringSecurity之后会先经过一系列过滤器（一中请求的是/test接口）；

**2、** 在请求到达`FilterSecurityInterceptor`时，发现请求并未认证请求被拦截下来，并抛出`AccessDeniedException`异常；

3. 抛出 AccessDeniedException 的异常会被 ExceptionTranslationFilter 捕获，这个Filter中会去调用 LoginUrlAuthenticationEntryPoint#commence 方法给客户端返回 **302（暂时重定向）** ，要求客户端进行重定向到 /login 页面。
**4、** 客户端发送/login请求；

**5、** /login请求再次当遇到`DefaultLoginPageGeneratingFilter`过滤器时，会返回登录页面；

### 登录页面的由来

下面是`DefaultLoginPageGeneratingFilter` 重写的`doFilter`方法，也可以解释默认配置下为什么会返回登录页，登录页就由下面的过滤器实现而来。

```java
// DefaultLoginPageGeneratingFilter
@Override
public void doFilter(ServletRequest request,
 ServletResponse response, 
FilterChain chain)
        throws IOException, ServletException {
    doFilter((HttpServletRequest) request, (HttpServletResponse) response, chain);
}
private void doFilter(HttpServletRequest request, 
HttpServletResponse response, 
FilterChain chain) throws IOException, ServletException {
    boolean loginError = this.isErrorPage(request);
    boolean logoutSuccess = this.isLogoutSuccess(request);
    // 判断是否是登录请求、登录错误和注销确认
    // 不是的话给用户返回登录界面
    if (!this.isLoginUrlRequest(request) && !loginError && !logoutSuccess) {
        chain.doFilter(request, response);
    } else {
    // generateLoginPageHtml方法中有对页面登录代码进行了字符串拼接
    // 太长了，这里就不给出来了
        String loginPageHtml = this.generateLoginPageHtml(request, loginError, logoutSuccess);
        response.setContentType("text/html;charset=UTF-8");
        response.setContentLength(loginPageHtml.getBytes(StandardCharsets.UTF_8).length);
        response.getWriter().write(loginPageHtml);
    }
}
```

### 表单登录认证过程（源码分析）

在重定向到登录页面后，会有个疑问，它是怎么校验的，怎么对用户名和密码进行认证的呢？

首先知道默认加载中是开启了表单认证的，在[【Spring Security 实战（二）】Spring Security的实现原理](/zhuanlan/security/springsecurity/11/2.html?spm=1001.2014.3001.5501)中小编指出了默认加载的过滤器中有一个`UsernamePasswordAuthenticationFilter`，它是来处理表单请求的，其实它是在调用 `HttpSecurity` 中的 `formLogin` 方法配置的过滤器的。

接下来分析一个 UsernamePasswordAuthenticationFilter 干了什么（它不是原生的过滤器，里面是attemptAuthetication进行过滤，而不是doFilter，参数与原生过滤器相比少了个chain）：

```java
@Override
public Authentication attemptAuthentication(HttpServletRequest request, 
HttpServletResponse response)
        throws AuthenticationException {
        // 首先是判断是否是POST请求
    if (this.postOnly && !request.getMethod().equals("POST")) {
        throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
    }
    // 获取用户名和密码
    // 这是通过获取表单输入框名为username的数据
    String username = obtainUsername(request);
    username = (username != null) ? username.trim() : "";
    // 这是获取表单输入框名为password的数据
    String password = obtainPassword(request);
    password = (password != null) ? password : "";
    UsernamePasswordAuthenticationToken authRequest = UsernamePasswordAuthenticationToken.unauthenticated(username,
            password);
    // Allow subclasses to set the "details" property
    setDetails(request, authRequest);
    // 在一中小编也说了，这是Security中的认证
    // 通过调用AuthenticationManager中的authenticate方法
    // 需要传递的参数的Authentication对象，当时是这样解释的
    return this.getAuthenticationManager()
    .authenticate(authRequest);
}
```

这边经过调试进入到 `authenticate` 方法观察如何认证的，下面是调试的认证过程：

**1、** 进入authenticate方法后会调用`ProviderManager`下的authenticate方法，它是重写AuthenticationManager的，第一次providers里只有AnoymousAuthenticationProvider对象，用来匿名认证的，最后会判断支不支持此认证，不支持换Provider；

**2、** 此时匿名认证匹配不了，往下执行，由于`parent`属性不为空，所以会调用parent的authenticate进行认证（其parent也是一个ProviderManager对象，但其providers集合中有且存在`DaoAuthenticationProvider`认证对象）；

从这可以间接推出在 `UsernamePasswordAuthenticationFilter` 中的 AuthenticationManager对象 是通过以下构造方法得出来的。

**3、** 既然`provider.supports`方法匹配成功，那就让provider去验证，然后将验证后的结果集返回；

DaoAuthenticationProvider 中未重写 AuthenticationProvider 中的 authenticate 方法，由其抽象父类 `AbstractUserDetailsAuthenticationProvider` 实现的。核心方法通过`retrieveUser(username, (UsernamePasswordAuthenticationToken) authentication);`去获取`UserDetails`对象，然后结合一些其他参数去创Authentication对象将其返回。

```java
AbstractUserDetailsAuthenticationProvider下的authenticate方法
@Override
public Authentication authenticate(Authentication authentication) 
throws AuthenticationException {
// 断言 authentication 是否是UsernamePasswordAuthenticationToken对象
Assert.isInstanceOf(UsernamePasswordAuthenticationToken.class, authentication,
            () -> this.messages.getMessage("AbstractUserDetailsAuthenticationProvider.onlySupports",
                    "Only UsernamePasswordAuthenticationToken is supported"));
    // 获取一下用户名
    String username = determineUsername(authentication);
    boolean cacheWasUsed = true;
    // 从缓存中拿UserDetails 对象，显然没有，咱刚调试呢，哪来的缓存
    UserDetails user = this.userCache.getUserFromCache(username);
    if (user == null) {
    // 既然为空呢，就说明这不是从缓存中拿的，调为false
        cacheWasUsed = false;
        try {
        // 核心代码，获取UserDetails对象去
            user = retrieveUser(username, (UsernamePasswordAuthenticationToken) authentication);
        }
        catch (UsernameNotFoundException ex) {
            this.logger.debug("Failed to find user '" + username + "'");
            if (!this.hideUserNotFoundExceptions) {
                throw ex;
            }
            throw new BadCredentialsException(this.messages
                    .getMessage("AbstractUserDetailsAuthenticationProvider.badCredentials", "Bad credentials"));
        }
        Assert.notNull(user, "retrieveUser returned null - a violation of the interface contract");
    }
    try {
        this.preAuthenticationChecks.check(user);
        // 这里是验证密码的，通过子类DaoAuthenticationProvider的这个方法对密码去进行验证
        // 传过去的参数是user（UserDetails对象）和authentication对象
        additionalAuthenticationChecks(user, (UsernamePasswordAuthenticationToken) authentication);
    }
    catch (AuthenticationException ex) {
        if (!cacheWasUsed) {
            throw ex;
        }
        // There was a problem, so try again after checking
        // we're using latest data (i.e. not from the cache)
        cacheWasUsed = false;
        user = retrieveUser(username, (UsernamePasswordAuthenticationToken) authentication);
        this.preAuthenticationChecks.check(user);
        additionalAuthenticationChecks(user, (UsernamePasswordAuthenticationToken) authentication);
    }
    this.postAuthenticationChecks.check(user);
    if (!cacheWasUsed) {
        this.userCache.putUserInCache(user);
    }
    Object principalToReturn = user;
    if (this.forcePrincipalAsString) {
        principalToReturn = user.getUsername();
    }
    return createSuccessAuthentication(principalToReturn, authentication, user);
}
```

**1、** 接下来就是核心方法`retrieveUser(username,(UsernamePasswordAuthenticationToken)authentication)`的概述了，它是`DaoAuthenticationProvider`下的一个方法，用来返回UserDetails对象，即用户的详细信息，方便等等封装到认证信息Authentication中然后返回结果，判断是否认证成功；

```java
// 一共两个参数，一个是用户名，一个是传过来的认证信息
@Override
protected final UserDetails retrieveUser(String username, 
UsernamePasswordAuthenticationToken authentication)
        throws AuthenticationException {
    prepareTimingAttackProtection();
    try {
    // 核心方法就是这个，通过UserDetatilsService中的loadUserByUsername方法去获取UserDetails对象
        UserDetails loadedUser = this.getUserDetailsService().loadUserByUsername(username);
        if (loadedUser == null) {
            throw new InternalAuthenticationServiceException(
                    "UserDetailsService returned null, which is an interface contract violation");
        }
        return loadedUser;
    }
    catch (UsernameNotFoundException ex) {
        mitigateAgainstTimingAttack(authentication);
        throw ex;
    }
    catch (InternalAuthenticationServiceException ex) {
        throw ex;
    }
    catch (Exception ex) {
        throw new InternalAuthenticationServiceException(ex.getMessage(), ex);
    }
}
```

我们可以看见默认配置下它是一个 InMemoryUserDetailsManager 对象，是一个基于内存的关于UserDetails 的操作对象。简单看看它里面的loadUserByUsername方法，写的也是非常简单，它这里面用户名不区分大小写。

**1、** 再说说密码验证，密码验证在`3`源码里指出了，在获取UserDetails对象user后，会调用子类的`additionalAuthenticationChecks`方法进行密码验证主要就是和输出框输入的密码和那个UserDetails对象中的密码进行比较，UserDetails密码可以理解为是通过`PasswordEncoder`编码后的密码（密文），而输入框输入的是可以理解为是明文，可以简单这样先理解然后通过`PasswordEncoder`去看看是否匹配默认是`DelegatingPasswordEncoder`密码编码器；

## 三、UserDetailsService

### Spring Security 中 UserDetailsService 的实现

- UserDetailsManager 在 UserDetailsService 的基础上，继续定义了添加用户、更新用户、删除用户、修改密码以及判断用户是否存在共 5 种方法。
- JdbcDaoImpl 在 UserDetailsService 的基础上，通过 spring-jdbc 实现了从数据库中查询用户的方法。
- InMemoryUserDetailsManager 实现了 UserDetailsManager 中关于用户的增删改查方法，不过都是基于内存的操作，数据并没有持久化。
- JdbcUserDetailsManager 继承自 JdbcDaoImpl 同时又实现了 UserDetailsManager 接口，因此可以通过 JdbcUserDetailsManager 实现对用户的增删改查操作，这些操作都会持久化到数据库中。不过 JdbcUserDetailsManager 有一个局限性，就是操作数据库中用户的 SQL 都是提前写好的，不够灵活，因此在实际开发中 JdbcUserDetailsManager 使用并不多。
- CachingUserDetailsService 的特点是会将 UserDetailsService 缓存起来。
- UserDetailsServiceDelegator 则是提供了 UserDetailsService 的懒加载功能。
- ReactiveUserDetailsServiceAdapter 是 webflux-web-security 模块定义的 UserDetailsService 的实现。

### 默认的 UserDetailsService 配置（源码分析）

关于UserDetailsService的默认配置在`UserDetailsServiceAutoConfiguration`自动配置类中。（由于代码很长，这里只提取核心部分）

```java
@AutoConfiguration
@ConditionalOnClass(AuthenticationManager.class)
@ConditionalOnBean(ObjectPostProcessor.class)
@ConditionalOnMissingBean(
		value = {
      AuthenticationManager.class, AuthenticationProvider.class, UserDetailsService.class,
				AuthenticationManagerResolver.class },
		type = {
      "org.springframework.security.oauth2.jwt.JwtDecoder",
				"org.springframework.security.oauth2.server.resource.introspection.OpaqueTokenIntrospector",
				"org.springframework.security.oauth2.client.registration.ClientRegistrationRepository",
				"org.springframework.security.saml2.provider.service.registration.RelyingPartyRegistrationRepository" })
public class UserDetailsServiceAutoConfiguration {
	@Bean
	@Lazy
	public InMemoryUserDetailsManager inMemoryUserDetailsManager(SecurityProperties properties,
			ObjectProvider<PasswordEncoder> passwordEncoder) {
			// 这里是从SecurityProperties中获取User对象（这里的User对象是SecurityProperties的静态内部类）
		SecurityProperties.User user = properties.getUser();
		List<String> roles = user.getRoles();
		// 然后创建InMemoryUserDetailsManager对象返回
		// 交给Spring容器管理
		return new InMemoryUserDetailsManager(User.withUsername(user.getName())
			.password(getOrDeducePassword(user, passwordEncoder.getIfAvailable()))
			.roles(StringUtils.toStringArray(roles))
			.build());
	}
	}
```

观察UserDetailsServiceAutoConfiguration 上的注解 `@ConditionalOnMissingBean` ，联想到啥？自动化配置 SecurityFilterChain 遇到过。

上面配置意思的，要想使用默认配置，得先满足容器中不含 AuthenticationManager、AuthenticationProvider、UserDetailsService、AuthenticationManagerResolver实例这个条件。

### 默认用户名和密码

从上面自动化配置 UserDetailsService 中，我们也发现了使用的User对象是从 `SecurityProperties` 中获取的，那咱看一下是怎么个 User 对象吧。

首先是调用的 getUser 去获取的，而这个user 就一直接 new 的一个User对象，它是一个静态内部类实例。

看下面静态内部类User属性可以看见，其用户名name是"user"，而密码则是一个UUID字符串，roles是一个list集合，可以指定多个。

注意：下面的 getter、setter 方法没有截取出来。

那可不可以自己配置用户名和密码呢？

当然是可以滴。

可以看见，`SecurityProperties` 被 `@ConfigurationProperties` 注解修饰了（这里得知道SecurityProperties是由Spring容器管理的一个对象）。

而@ConfigurationProperties 注解是通过 setter 注入的方式，将配置文件配置的值，映射到被该注解修饰的对象中。

所以我们可以在配置文件中进行自己的配置，可以配置自己的用户名和密码。

比如我这么配置：

```java
# application.yml
spring:
  security:
    user:
      name: xxx
      password: 123
```

用户名、密码就被更改。

## 四、总结

- AuthenticationManager、ProviderManager、AuthenticationProvider关系。
- 得知道 DaoAuthenticationProvider retrieveUser 方法和 additionalAuthenticationChecks 方法（这俩方法分别应用了UserDetailsService和PasswordEncoder对象）。UsernamePasswordAuthenticationFilter 最后也是去通过 ProviderManager 中的 authenticate 去认证，最后还是调到 DaoAuthenticationProvider 的父类 AbstractUserDetailsAuthenticationProvider 的 authenticate 去认证，我们得清楚这个流程和这些类、方法，方便后期需要以及调试可用。
- 我们可以通过去实现 UserDetailsService 接口（自定义UserDetailsService），然后将实现类实例交给 Spring 容器管理，这样就不会用默认实现了，而是用我们的自定义实现。
- UserDetails 是用户的详情对象，里面封装了用户名、密码、权限等信息。也是 UserDetailsService 的返回值，这些都是可以自定义的。
