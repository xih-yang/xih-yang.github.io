# 03、SpringSecurity 基础 - 认证原理
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/3.html
- 分类：安全框架
- 分组：教程目录
## 1.认证流程原理

### 1.1.认证流程

SpringSecurity是基于Filter实现认证和授权，底层通过FilterChainProxy代理去调用各种Filter(Filter链)，Filter通过调用AuthenticationManager完成认证 ，通过调用AccessDecisionManager完成授权，SpringSecurity中核心的过滤器链详细如下：

- SecurityContextPersistenceFilter

Filter的入口和出口，它是用来将SecurityContext(认证的上下文，里面有登录成功后的认证授权信息)对象持久到Session的Filter，同时会把SecurityContext设置给SecurityContextHolder方便我们获取用户认证授权信息
- UsernamePasswordAuthenticationFilter

默认拦截“/login”登录请求，处理表单提交的登录认证，将请求中的认证信息包括

username,password等封装成UsernamePasswordAuthenticationToken，然后调用

AuthenticationManager的认证方法进行认证
- BasicAuthenticationFilter

基本认证，支持httpBasic认证方式的Filter
- RememberAuthenticationFilter

记住我功能实现的Filter
- AnonymousAuthenticationFilter

匿名Filter，用来处理匿名访问的资源，如果用户未登录，SecurityContext中没有Authentication，

就会创建匿名的Token(AnonymousAuthenticationToken),然后通过

SecurityContextHodler设置到SecurityContext中。
- ExceptionTranslationFilter

用来捕获FilterChain所有的异常，进行处理，但是只会处理 AuthenticationException和AccessDeniedException，异常，其他的异常 会继续抛出。
- FilterSecurityInterceptor

用来做授权的Filter,通过父类(AbstractSecurityInterceptor.beforeInvocation)调用

AccessDecisionManager.decide方法对用户进行授权。

### 1.3.Security相关概念

**Authentication**

认证对象，用来封装用户的认证信息(账户状态，用户名，密码，权限等)所有提交给AuthenticationManager的认证请求都会被封装成一个Token的实现，比如 最容易理解的UsernamePasswordAuthenticationToken，其中包含了用户名和密码

Authentication常用的实现类：

UsernamePasswordAuthenticationToken：用户名密码登录的Token

AnonymousAuthenticationToken：针对匿名用户的Token

RememberMeAuthenticationToken：记住我功能的的Token

**AuthenticationManager**

用户认证的管理类，所有的认证请求（比如login）都会通过提交一个封装了到了登录信息的Token对象给 AuthenticationManager的authenticate()方法来实现认证。AuthenticationManager会 调

用AuthenticationProvider.authenticate进行认证。认证成功后，返回一个包含了认 证

信息的Authentication对象。

**AuthenticationProvider**

认证的具体实现类，一个provider是一种认证方式的实现，比如提交的用户名密码我 是通过和DB中查出的user记录做比对实现的，那就有一个DaoProvider；如果我是通 过CAS请求单点登录系统实现，那就有一个CASProvider。按照Spring一贯的作风， 主流的认证方式它都已经提供了默认实现，比如DAO、LDAP、CAS、OAuth2等。 前 面讲了AuthenticationManager只是一个代理接口，真正的认证就是由 AuthenticationProvider来做的。一个AuthenticationManager可以包含多个Provider， 每个provider通过实现一个support方法来表示自己支持那种Token的认证。 AuthenticationManager默认的实现类是ProviderManager。

**UserDetailService**

用户的认证通过Provider来完成，而Provider会通过UserDetailService拿到数据库（或 内存）中的认证信息然后和客户端提交的认证信息做校验。虽然叫Service,但是我更愿 意把它认为是我们系统里经常有的UserDao。

**SecurityContext**

当用户通过认证之后，就会为这个用户生成一个唯一的SecurityContext，里面包含用 户的认证信息Authentication。通过SecurityContext我们可以获取到用户的标识 Principle和授权信息GrantedAuthrity。在系统的任何地方只要通过 SecurityHolder.getSecruityContext()就可以获取到SecurityContext。在Shiro中通过 SecurityUtils.getSubject()到达同样的目的

### 1.4.SpringSecurity认证流程原理

- 请求过来会被过滤器链中的UsernamePasswordAuthenticationFilter拦截到，请求中的用户名和密码被封装成UsernamePasswordAuthenticationToken(Authentication的实现类)
- 过滤器将UsernamePasswordAuthenticationToken提交给认证管理器(AuthenticationManager)进行认证.
- AuthenticationManager委托AuthenticationProvider(DaoAuthenticationProvider)进行认证，AuthenticationProvider通过调用UserDetailsService获取到数据库中存储的用户信息(UserDetails)，然后调用passwordEncoder密码编码器对UsernamePasswordAuthenticationToken中的密码和UserDetails中的密码进行比较
- AuthenticationProvider认证成功后封装Authentication并设置好用户的信息(用户名，密码，权限等)返回
- Authentication被返回到UsernamePasswordAuthenticationFilter,通过调用SecurityContextHolder工具把Authentication封装成SecurityContext中存储起来。然后UsernamePasswordAuthenticationFilter调用AuthenticationSuccessHandler.onAuthenticationSuccess做认证成功后续处理操作
- 最后SecurityContextPersistenceFilter通过SecurityContextHolder.getContext()获取到SecurityContext对象然后调用SecurityContextRepository将SecurityContext存储起来，然后调用SecurityContextHolder.clearContext方法清理SecurityContext。

注意：SecurityContext是一个和当前线程绑定的工具，在代码的任何地方都可以通过SecurityContextHolder.getContext()获取到登陆信息。

## 2.认证流程源码跟踪

### SecurityContextPersistenceFilter#

这个filter是整个filter链的入口和出口，请求开始会从SecurityContextRepository中 获取SecurityContext对象并设置给SecurityContextHolder。在请求完成后将

SecurityContextHolder持有的SecurityContext再保存到配置好的

DecurityContextRepository中，同时清除SecurityContextHolder中的SecurityContext

总结一下：SecurityContextPersistenceFilter它的作用就是请求来的时候将包含了认证授权信息的SecurityContext对象从SecurityContextRepository中取出交给SecurityContextHolder工具类，方便我们通过SecurityContextHolder获取SecurityContext从而获取到认证授权信息，请求走的时候又把SecurityContextHolder清空，源码如下：

```java
public class SecurityContextPersistenceFilter extends GenericFilterBean {
  ...省略...
  public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
  ...省略部分代码...
  HttpRequestResponseHolder holder = new HttpRequestResponseHolder(request,
  			response);
  //从SecurityContextRepository获取到SecurityContext 
  	SecurityContext contextBeforeChainExecution = repo.loadContext(holder);
  	try {
  	 //把 securityContext设置到SecurityContextHolder，如果没认证通过，这个SecurtyContext就是空的
  		SecurityContextHolder.setContext(contextBeforeChainExecution);
  		//调用后面的filter，比如掉用usernamepasswordAuthenticationFilter实现认证
  		chain.doFilter(holder.getRequest(), holder.getResponse());
  	}
  	finally {
  		//如果认证通过了，这里可以从SecurityContextHolder.getContext();中获取到SecurityContext
  		SecurityContext contextAfterChainExecution = SecurityContextHolder
  				.getContext();
  		// Crucial removal of SecurityContextHolder contents - do this before anything
  		// else.
  		 //删除SecurityContextHolder中的SecurityContext 
  		SecurityContextHolder.clearContext();
  		//把SecurityContext 存储到SecurityContextRepository
  		repo.saveContext(contextAfterChainExecution, holder.getRequest(),
  				holder.getResponse());
  		request.removeAttribute(FILTER_APPLIED);
  		if (debug) {
  			logger.debug("SecurityContextHolder now cleared, as request processing completed");
  		}
  	}
...省略...
```

### UsernamePasswordAuthenticationFilter

它的重用是，拦截“/login”登录请求，处理表单提交的登录认证，将请求中的认证信息包括username,password等封装成UsernamePasswordAuthenticationToken，然后调用

AuthenticationManager的认证方法进行认证。

```java
public class UsernamePasswordAuthenticationFilter extends
		AbstractAuthenticationProcessingFilter {
	// ~ Static fields/initializers
	// =====================================================================================
	//从登录请求中获取参数：username,password的名字
	public static final String SPRING_SECURITY_FORM_USERNAME_KEY = "username";
	public static final String SPRING_SECURITY_FORM_PASSWORD_KEY = "password";
	private String usernameParameter = SPRING_SECURITY_FORM_USERNAME_KEY;
	private String passwordParameter = SPRING_SECURITY_FORM_PASSWORD_KEY;
	//默认支持POST登录
	private boolean postOnly = true;
	//默认拦截/login请求，Post方式
	public UsernamePasswordAuthenticationFilter() {
		super(new AntPathRequestMatcher("/login", "POST"));
	}
	// ~ Methods
	// ========================================================================================================
	public Authentication attemptAuthentication(HttpServletRequest request,
			HttpServletResponse response) throws AuthenticationException {
			//判断请求是否是POST
		if (postOnly && !request.getMethod().equals("POST")) {
			throw new AuthenticationServiceException(
					"Authentication method not supported: " + request.getMethod());
		}
		//获取到用户名和密码
		String username = obtainUsername(request);
		String password = obtainPassword(request);
		if (username == null) {
			username = "";
		}
		if (password == null) {
			password = "";
		}
		username = username.trim();
		//用户名和密码封装Token
		UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(
				username, password);
		//设置details属性
		// Allow subclasses to set the "details" property
		setDetails(request, authRequest);
		//调用AuthenticationManager().authenticate进行认证，参数就是Token对象
		return this.getAuthenticationManager().authenticate(authRequest);
	}
```

### AuthenticationManager

请求通过UsernamePasswordAuthenticationFilter调用AuthenticationManager，默认走的实现类是ProviderManager，它会找到能支持当前认证的AuthenticationProvider实现类调用器authenticate方法执行认证，认证成功后会清除密码，然后抛出AuthenticationSuccessEvent事件

```java
public class ProviderManager implements AuthenticationManager, MessageSourceAware,
    InitializingBean {
    ...省略...
    //这里authentication 是封装了登录请求的认证参数，
    //即：UsernamePasswordAuthenticationFilter传入的Token对象
public Authentication authenticate(Authentication authentication)
        throws AuthenticationException {
    Class<? extends Authentication> toTest = authentication.getClass();
    AuthenticationException lastException = null;
    AuthenticationException parentException = null;
    Authentication result = null;
    Authentication parentResult = null;
    boolean debug = logger.isDebugEnabled();
    //找到所有的AuthenticationProvider ，选择合适的进行认证
    for (AuthenticationProvider provider : getProviders()) {
        //是否支持当前认证
        if (!provider.supports(toTest)) {
            continue;
        }
        if (debug) {
            logger.debug("Authentication attempt using "
                    + provider.getClass().getName());
        }
        try {
            //调用provider执行认证
            result = provider.authenticate(authentication);
            if (result != null) {
                copyDetails(authentication, result);
                break;
            }
        }
            ...省略...
    }
    ...省略...
    //result就是Authentication ，使用的实现类依然是UsernamepasswordAuthenticationToken，
    //封装了认证成功后的用户的认证信息和授权信息
    if (result != null) {
        if (eraseCredentialsAfterAuthentication
            && (result instanceof CredentialsContainer)) {
        // Authentication is complete. Remove credentials and other secret data
        // from authentication
        //这里在擦除登录密码
        ((CredentialsContainer) result).eraseCredentials();
    }
    // If the parent AuthenticationManager was attempted and successful than it will publish an AuthenticationSuccessEvent
    // This check prevents a duplicate AuthenticationSuccessEvent if the parent AuthenticationManager already published it
    if (parentResult == null) {
        //发布事件
        eventPublisher.publishAuthenticationSuccess(result);
    }
    return result;
}
```

### DaoAuthenticationProvider

请求到达AuthenticationProvider，默认实现是DaoAuthenticationProvider，它的作用是根据传入的Token中的username调用UserDetailService加载数据库中的认证授权信息(UserDetails)，然后使用PasswordEncoder对比用户登录密码是否正确

```java
public class DaoAuthenticationProvider extends AbstractUserDetailsAuthenticationProvider {
		//密码编码器
		private PasswordEncoder passwordEncoder;
		//UserDetailsService ，根据用户名加载UserDetails对象，从数据库加载的认证授权信息
		private UserDetailsService userDetailsService;
		//认证检查方法
		protected void additionalAuthenticationChecks(UserDetails userDetails,
			UsernamePasswordAuthenticationToken authentication)
			throws AuthenticationException {
		if (authentication.getCredentials() == null) {
			logger.debug("Authentication failed: no credentials provided");
			throw new BadCredentialsException(messages.getMessage(
					"AbstractUserDetailsAuthenticationProvider.badCredentials",
					"Bad credentials"));
		}
		//获取密码
		String presentedPassword = authentication.getCredentials().toString();
		//通过passwordEncoder比较密码，presentedPassword是用户传入的密码，userDetails.getPassword()是从数据库加载到的密码
		//passwordEncoder编码器不一样比较密码的方式也不一样
		if (!passwordEncoder.matches(presentedPassword, userDetails.getPassword())) {
			logger.debug("Authentication failed: password does not match stored value");
			throw new BadCredentialsException(messages.getMessage(
					"AbstractUserDetailsAuthenticationProvider.badCredentials",
					"Bad credentials"));
		}
	}
	//检索用户，参数为用户名和Token对象
	protected final UserDetails retrieveUser(String username,
			UsernamePasswordAuthenticationToken authentication)
			throws AuthenticationException {
		prepareTimingAttackProtection();
		try {
			//调用UserDetailsService的loadUserByUsername方法，
			//根据用户名检索数据库中的用户，封装成UserDetails 
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
	//创建认证成功的认证对象Authentication，使用的实现是UsernamepasswordAuthenticationToken,
	//封装了认证成功后的认证信息和授权信息，以及账户的状态等
	@Override
	protected Authentication createSuccessAuthentication(Object principal,
			Authentication authentication, UserDetails user) {
		boolean upgradeEncoding = this.userDetailsPasswordService != null
				&& this.passwordEncoder.upgradeEncoding(user.getPassword());
		if (upgradeEncoding) {
			String presentedPassword = authentication.getCredentials().toString();
			String newPassword = this.passwordEncoder.encode(presentedPassword);
			user = this.userDetailsPasswordService.updatePassword(user, newPassword);
		}
		return super.createSuccessAuthentication(principal, authentication, user);
	}
	...省略...
```

**这里提供了三个方法**

- additionalAuthenticationChecks：通过passwordEncoder比对密码
- retrieveUser：根据用户名调用UserDetailsService加载用户认证授权信息
- createSuccessAuthentication：登录成功，创建认证对象Authentication

然而你发现 DaoAuthenticationProvider 中并没有authenticate认证方法，真正的认证逻辑是通过父类AbstractUserDetailsAuthenticationProvider.authenticate方法完成的

**AbstractUserDetailsAuthenticationProvider**

```java
public abstract class AbstractUserDetailsAuthenticationProvider implements
AuthenticationProvider, InitializingBean, MessageSourceAware {
//认证逻辑
public Authentication authenticate(Authentication authentication)
    throws AuthenticationException {
    //得到传入的用户名
    String username = (authentication.getPrincipal() == null) ? "NONE_PROVIDED"
        : authentication.getName();
        //从缓存中得到UserDetails
    boolean cacheWasUsed = true;
    UserDetails user = this.userCache.getUserFromCache(username);
    if (user == null) {
    cacheWasUsed = false;
    try {
        //检索用户，底层会调用UserDetailsService加载数据库中的UserDetails对象，保护认证信息和授权信息
        user = retrieveUser(username,
                (UsernamePasswordAuthenticationToken) authentication);
    }
    catch (UsernameNotFoundException notFound) {
        ...省略...
    }
    try {
        //前置检查，主要检查账户是否锁定，账户是否过期等
        preAuthenticationChecks.check(user);
        //比对密码在这个方法里面比对的
        additionalAuthenticationChecks(user,
            (UsernamePasswordAuthenticationToken) authentication);
    }
    catch (AuthenticationException exception) {
    ...省略...
    }
    //后置检查
    postAuthenticationChecks.check(user);
    if (!cacheWasUsed) {
        //设置UserDetails缓存
        this.userCache.putUserInCache(user);
    }
    Object principalToReturn = user;
    if (forcePrincipalAsString) {
        principalToReturn = user.getUsername();
    }
    //认证成功，创建Auhentication认证对象
    return createSuccessAuthentication(principalToReturn, authentication, user);
}
```

### UsernamePasswordAuthenticationFilter

认证成功，请求会重新回到UsernamePasswordAuthenticationFilter，然后会通过其父类AbstractAuthenticationProcessingFilter.successfulAuthentication方法将认证对象封装成SecurityContext设置到SecurityContextHolder中

```java
protected void successfulAuthentication(HttpServletRequest request,
        HttpServletResponse response, FilterChain chain, Authentication authResult)
        throws IOException, ServletException {
    if (logger.isDebugEnabled()) {
        logger.debug("Authentication success. Updating SecurityContextHolder to contain: "
                + authResult);
    }
    //认证成功，吧Authentication 设置到SecurityContextHolder
    SecurityContextHolder.getContext().setAuthentication(authResult);
    //处理记住我业务逻辑
    rememberMeServices.loginSuccess(request, response, authResult);
    // Fire event
    if (this.eventPublisher != null) {
        eventPublisher.publishEvent(new InteractiveAuthenticationSuccessEvent(
                authResult, this.getClass()));
    }
    //重定向登录成功地址
    successHandler.onAuthenticationSuccess(request, response, authResult);
}
```

然后后续请求又会回到SecurityContextPersistenceFilter，它就可以从SecurityContextHolder获取到SecurityContext持久到SecurityContextRepository(默认实现是HttpSessionSecurityContextRepository基于Session存储)

到这里认证流程就结束了，希望对您有所帮助
