# 13、Spring Security 源码解析 - 权限访问控制是如何做到的？
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/13.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
## 〇、前文回顾

> 在实战篇《Spring Security 源码解析 - （下）：访问控制》我们学习了Spring Security强大的访问控制能力，只需要进行寥寥几行的配置就能做到权限的控制，本篇来看看它到底是如何做到的。

## 一、再聊过滤器链

> 源码篇中反复提到，请求进来需要经过的是一堆过滤器形成的过滤器链，走完过滤器链未抛出异常则可以继续访问后台接口资源，而最后一个过滤器就是来判断请求是否有权限继续访问后台资源，如果没有则会将拒绝访问的异常往上向异常过滤器抛，异常过滤器会对异常进行翻译，然后响应给客户端。

- 所以，一般情况下最后一个过滤器是做权限访问控制的核心过滤器FilterSecurityInterceptor ，而倒数第二个是异常翻译过滤器ExceptionTranslationFilter ，将异常进行翻译然后响应给客户端。
- 比如我们实战项目过滤器链图解

## 二、过滤器的创建

### FilterSecurityInterceptor的创建

- 这个过滤器的配置器是 ExpressionUrlAuthorizationConfigurer ，它的父类 AbstractInterceptUrlConfigurer 中的 configure() 方法创建了这个过滤器。

```java
abstract class AbstractInterceptUrlConfigurer<C extends AbstractInterceptUrlConfigurer<C, H>, H extends HttpSecurityBuilder<H>>
		extends AbstractHttpConfigurer<C, H> {
	...
	@Override
	public void configure(H http) throws Exception {
		FilterInvocationSecurityMetadataSource metadataSource = createMetadataSource(http);
		if (metadataSource == null) {
			return;
		}
		FilterSecurityInterceptor securityInterceptor = createFilterSecurityInterceptor(
				http, metadataSource, http.getSharedObject(AuthenticationManager.class));
		if (filterSecurityInterceptorOncePerRequest != null) {
			securityInterceptor
					.setObserveOncePerRequest(filterSecurityInterceptorOncePerRequest);
		}
		securityInterceptor = postProcess(securityInterceptor);
		http.addFilter(securityInterceptor);
		http.setSharedObject(FilterSecurityInterceptor.class, securityInterceptor);
	}
	...
}
```

- 这个过滤器的配置器是在 HttpSecurity 的 authorizeRequests() 方法中apply进来的，在我们自己配置的核心配置器中使用的就是该种基于 HttpServletRequest 限制访问的方式。

### ExceptionTranslationFilter的创建

- 这个过滤器的配置器是 ExceptionHandlingConfigurer ，它自己的 configure() 方法中创建了这个过滤器。

```java
public final class ExceptionHandlingConfigurer<H extends HttpSecurityBuilder<H>> extends
		AbstractHttpConfigurer<ExceptionHandlingConfigurer<H>, H> {
	...
	@Override
	public void configure(H http) throws Exception {
		AuthenticationEntryPoint entryPoint = getAuthenticationEntryPoint(http);
		ExceptionTranslationFilter exceptionTranslationFilter = new ExceptionTranslationFilter(
				entryPoint, getRequestCache(http));
		if (accessDeniedHandler != null) {
			exceptionTranslationFilter.setAccessDeniedHandler(accessDeniedHandler);
		}
		exceptionTranslationFilter = postProcess(exceptionTranslationFilter);
		http.addFilter(exceptionTranslationFilter);
	}
	...
}
```

- 这个过滤器的配置器是在 HttpSecurity 的 exceptionHandling() 方法中apply进来的，和上面不同的是，这个过滤器配置器会默认被apply进 HttpSecurity，在 WebSecurityConfigurerAdapter 中的 init() 方法，里面调用了 getHttp() 方法，这里定义了很多默认的过滤器配置，其中就包括当前过滤器配置。

## 三、源码流程

### FilterSecurityInterceptor

- 进入：doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
- 进入：invoke(FilterInvocation fi)
- 进入：beforeInvocation(Object object)

> 这个方法里面有个 attributes ，里面获取的就是当前request请求所能匹配中的权限Spel表达式，比如这里是 hasRole('ROLE_BUYER')

方法源码如下，继续往下走

```java
protected InterceptorStatusToken beforeInvocation(Object object) {
    ...
    // 获取当前request请求所能匹配中的权限Spel表达式
    Collection<ConfigAttribute> attributes = this.obtainSecurityMetadataSource()
            .getAttributes(object);
    ...
    // Attempt authorization
    try {
        this.accessDecisionManager.decide(authenticated, object, attributes);
    }
    catch (AccessDeniedException accessDeniedException) {
        publishEvent(new AuthorizationFailureEvent(object, attributes, authenticated,
                accessDeniedException));
        throw accessDeniedException;
    }
    ...
}
```

- 进入：decide(Authentication authentication, Object object, Collection`` configAttributes)

> 这里有个投票器，投票结果为1表示可以访问直接返回，投票结果为-1表示拒绝访问，向上抛拒绝访问异常，这里使用的投票器是 WebExpressionVoter

```java
public void decide(Authentication authentication, Object object,
        Collection<ConfigAttribute> configAttributes) throws AccessDeniedException {
    int deny = 0;
    for (AccessDecisionVoter voter : getDecisionVoters()) {
        int result = voter.vote(authentication, object, configAttributes);
        if (logger.isDebugEnabled()) {
            logger.debug("Voter: " + voter + ", returned: " + result);
        }
        switch (result) {
        case AccessDecisionVoter.ACCESS_GRANTED:
            return;
        case AccessDecisionVoter.ACCESS_DENIED:
            deny++;
            break;
        default:
            break;
        }
    }
    if (deny > 0) {
        throw new AccessDeniedException(messages.getMessage(
                "AbstractAccessDecisionManager.accessDenied", "Access is denied"));
    }
    // To get this far, every AccessDecisionVoter abstained
    checkAllowIfAllAbstainDecisions();
}
```

- 进入：vote(Authentication authentication, FilterInvocation fi, Collection`` attributes)

> 这里面其实就是使用Spring的Spel表达式进行投票，使用请求中的权限表达式组装Expression，使用Token令牌中的权限组装EvaluationContext，然后调用 ExpressionUtils.evaluateAsBoolean(weca.getAuthorizeExpression(), ctx)，

```java
public int vote(Authentication authentication, FilterInvocation fi,
        Collection<ConfigAttribute> attributes) {
    assert authentication != null;
    assert fi != null;
    assert attributes != null;
    WebExpressionConfigAttribute weca = findConfigAttribute(attributes);
    if (weca == null) {
        return ACCESS_ABSTAIN;
    }
    EvaluationContext ctx = expressionHandler.createEvaluationContext(authentication,
            fi);
    ctx = weca.postProcess(ctx, fi);
    return ExpressionUtils.evaluateAsBoolean(weca.getAuthorizeExpression(), ctx) ? ACCESS_GRANTED
            : ACCESS_DENIED;
}
```

> evaluateAsBoolean() 方法里面就是调用Expression的 getValue() 方法，获取实际的匹配结果，如下图Spel表达式为 hasRole('ROLE_BUYER')

> 所以它实际调用的是 SecurityExpressionRoot#hasRole 方法（关于权限表达式对应实际调用的方法，在《Spring Security 源码解析 - （下）：访问控制》文章中已贴出，下面文章也补充一份），里面的逻辑其实就是判断Token令牌中是否包含有 ROLE_BUYER 的角色，有的话返回true，否则返回false，如下为 SecurityExpressionRoot#hasRole 方法源码：

```java
private boolean hasAnyAuthorityName(String prefix, String... roles) {
    Set<String> roleSet = getAuthoritySet();
    for (String role : roles) {
        String defaultedRole = getRoleWithDefaultPrefix(prefix, role);
        if (roleSet.contains(defaultedRole)) {
            return true;
        }
    }
    return false;
}
```

- 如果投票成功，则会一直返回到 invoke() 方法，再执行后续过滤器，未抛异常表示该请求已经有访问权限了
- 假如投票失败，在 decide() 方法中会向上抛拒绝访问异常，一直往上抛直到被处理，往上反向跟踪发现这个过滤器一直没有处理拒绝访问异常，那就继续往上个过滤器抛，就到了我们的异常翻译过滤器 ExceptionTranslationFilter。

### ExceptionTranslationFilter

- 该过滤器的 doFilter() 方法很简单，没有逻辑处理，只对后续过滤器抛出的异常进行处理，源码如下：

```java
public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
        throws IOException, ServletException {
    HttpServletRequest request = (HttpServletRequest) req;
    HttpServletResponse response = (HttpServletResponse) res;
    try {
        chain.doFilter(request, response);
        logger.debug("Chain processed normally");
    }
    catch (IOException ex) {
        throw ex;
    }
    catch (Exception ex) {
        // Try to extract a SpringSecurityException from the stacktrace
        Throwable[] causeChain = throwableAnalyzer.determineCauseChain(ex);
        RuntimeException ase = (AuthenticationException) throwableAnalyzer
                .getFirstThrowableOfType(AuthenticationException.class, causeChain);
        if (ase == null) {
            ase = (AccessDeniedException) throwableAnalyzer.getFirstThrowableOfType(
                    AccessDeniedException.class, causeChain);
        }
        if (ase != null) {
            handleSpringSecurityException(request, response, chain, ase);
        }
        else {
            // Rethrow ServletExceptions and RuntimeExceptions as-is
            if (ex instanceof ServletException) {
                throw (ServletException) ex;
            }
            else if (ex instanceof RuntimeException) {
                throw (RuntimeException) ex;
            }
            // Wrap other Exceptions. This shouldn't actually happen
            // as we've already covered all the possibilities for doFilter
            throw new RuntimeException(ex);
        }
    }
}
```

- 当抛出拒绝访问异常后，继续调用 handleSpringSecurityException(HttpServletRequest request, HttpServletResponse response, FilterChain chain, RuntimeException exception) 方法，方法里面主要将异常信息和错误码设置到响应头，然后响应到客户端，请求结束。

### 补充：权限表达式

权限表达式（ExpressionUrlAuthorizationConfigurer）
说明
Spel表达式
Spel表达式实际执行方法（SecurityExpressionOperations）

permitAll()
表示允许所有，永远返回true
permitAll
permitAll()

denyAll()
表示拒绝所有，永远返回false
denyAll
denyAll()

anonymous()
当前用户是anonymous时返回true
anonymous
isAnonymous()

rememberMe()
当前用户是rememberMe用户时返回true
rememberMe
isRememberMe()

authenticated()
当前用户不是anonymous时返回true
authenticated
isAuthenticated()

fullyAuthenticated()
当前用户既不是anonymous也不是rememberMe用户时返回true
fullyAuthenticated
isFullyAuthenticated()

hasRole(“BUYER”)
用户拥有指定权限时返回true
hasRole(‘ROLE_BUYER’)
hasRole(String role)

hasAnyRole(“BUYER”，“SELLER”)
用于拥有任意一个角色权限时返回true
hasAnyRole (‘ROLE_BUYER’，‘ROLE_BUYER’)
hasAnyRole(String… roles)

hasAuthority(“BUYER”)
同hasRole
hasAuthority(‘ROLE_BUYER’)
hasAuthority(String role)

hasAnyAuthority(“BUYER”，“SELLER”)
同hasAnyRole
hasAnyAuthority (‘ROLE_BUYER’，‘ROLE_BUYER’)
hasAnyAuthority(String… authorities)

hasIpAddress(‘192.168.1.0/24’)
请求发送的Ip匹配时返回true
hasIpAddress(‘192.168.1.0/24’)
hasIpAddress(String ipAddress)，该方法在WebSecurityExpressionRoot类中

access("@rbacService.hasPermission(request, authentication)")
可以自定义Spel表达式
@rbacService.hasPermission (request, authentication)
hasPermission(request, authentication) ，该方法在自定义的RbacServiceImpl类中

## 四、总结

- 访问控制的核心过滤器是 FilterSecurityInterceptor ，当然这个是可选的，我们完全也可以自定义一个过滤器去处理权限访问。
- 处理访问异常处理的过滤器是 ExceptionTranslationFilter ，里面逻辑很简单，给response设置异常信息错误码，再返回给客户端。
