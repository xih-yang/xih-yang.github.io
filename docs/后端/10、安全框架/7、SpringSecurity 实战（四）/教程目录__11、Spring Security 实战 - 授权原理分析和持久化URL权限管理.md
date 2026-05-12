# 11、Spring Security 实战 - 授权原理分析和持久化URL权限管理
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/11.html
- 分类：安全框架
- 分组：教程目录
## 一、必须知道的三大组件（Overview）

在[【Spring Security 实战（一）】Spring Security的整体架构](/zhuanlan/security/springsecurity/11/1.html?spm=1001.2014.3001.5501) 中小编解释过授权所用的三大组件，在此再解释说明一下（三大组件具体指：ConfigAttribute、AccessDecisionManager（决策管理器）、AccessDecisionVoter（决策投票器））

- ConfigAttribute 在 Spring Security 中，用户请求一个资源（通常是一个接口或者是一个 java 方法）需要的角色会被封装成一个 ConfigAttribute 对象，在ConfigAttribute 中只有一个 getAttribute 方法，该方法返回一个 String 字符串，就是角色的名称。一般来说，角色名称都带有一个 ROLE_ 前缀，投票器 AccessDecisionVoter 所做的事情，其实就是比较用户所具备的角色和请求某个资源所需的 ConfigAttribute 之间的关系。
- AccessDecisionVoter 和 AccessDecisionManager 都有众多的实现类，在 AccessDecisionManager 中会挨个遍历 AccessDecisionVoter，进而决定是否允许用户访问，因而 AccessDecisionVoter 和 AccessDecisionManager 两者的关系类似于 AuthenticationManager（ProviderManager） 和 AuthenticationProvider 的关系。

## 二、FilterSecurityInterceptor 源码分析

小编在述说 [【Spring Security 实战（二）】Spring Security的实现原理](/zhuanlan/security/springsecurity/11/2.html?spm=1001.2014.3001.5501) 的时候，总结出了 Spring Security 中所用的过滤器，其中有个 `FilterSecurityInterceptor` ，它是其默认加载的一个过滤器（FilterSecurityInterceptor 虽继承了 AbstractSecurityInterceptor，但同时也实现了 Filter，实现了其 doFilter 方法核心方法，并在 SecurityFilterChain 中，所以一般称过滤器比较合适）。

（下图展示了拦截请求的一流程，可以看完图下的源码分析后再回过头看这张图，会变得清晰很多。）

doFilter 方法具体实现

```java
@Override
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {
    // 将request、response、chain三个对象封装到一FilterInvocation中 
    // 然后再调用 invoke 方法
    invoke(new FilterInvocation(request, response, chain));
}
```

invoke 方法具体实现

```java
public void invoke(FilterInvocation filterInvocation) throws IOException, ServletException {
    // 判断用户在此次请求中是否已经被允许通过
    if (isApplied(filterInvocation) && this.observeOncePerRequest) {
        filterInvocation.getChain().doFilter(filterInvocation.getRequest(), filterInvocation.getResponse());
        return;
    }
    // 调用父类AbstractSecurityInterceptor 中的 beforeInvocation 方法
    // 传入的参数是 filterInvocation 对象，是request、response、chain的封装对象
    // 这个方法内部就是实现路径权限认证操作
    InterceptorStatusToken token = super.beforeInvocation(filterInvocation);
    try {
        filterInvocation
        .getChain()
        .doFilter(filterInvocation.getRequest(),
         filterInvocation.getResponse());
    }
    finally {
        super.finallyInvocation(token);
    }
    super.afterInvocation(token, null);
}
```

beforeInvocation 方法核心代码分析

```java
protected InterceptorStatusToken beforeInvocation(Object object) {
    // obtainSecurityMetadataSource() 方法获取子类的 FilterInvocationSecurityMetadataSource 的对象
    // 然后通过获取到的FilterInvocationSecurityMetadataSource对象调用getAttributes方法获取 ConfigAttribute 集合
    // 集用户要访问该资源需要的权限集（后面会对其进行源码分析，这里先知道是获取访问该资源需要的权限集就行，上面（一）也做了解释）
    Collection<ConfigAttribute> attributes = this.obtainSecurityMetadataSource().getAttributes(object);
    if (CollectionUtils.isEmpty(attributes)) {
        return null; // no further work post-invocation
    }
    // 判断是否已经认证过了，没认证重新认证（重新认证的Authentication对象是从SecurityContextHolder中获取的）
    // 返回用户认证信息
    Authentication authenticated = authenticateIfRequired();
    // Attempt authorization
    // 尝试对路径进行放行，即判断请求路径是否拥有访问权限
    attemptAuthorization(object, attributes, authenticated);
    // no further work post-invocation
    return new InterceptorStatusToken(SecurityContextHolder.getContext(), false, attributes, object);
}
```

attemptAuthorization 方法源码分析

```java
// 参数说明：
// 1. object是filterInvocation对象，即request、response、chain的封装体
// 2. attributes 是访问路径需要的权限集
// 3. authentication 用户认证的权限信息
private void attemptAuthorization(Object object, Collection<ConfigAttribute> attributes,
        Authentication authenticated) {
    try {
        // 通过 AccessDecisionManager 决策管理器对象进行决策是否放行
        this.accessDecisionManager.decide(authenticated, object, attributes);
    }
    catch (AccessDeniedException ex) {
        publishEvent(new AuthorizationFailureEvent(object, attributes, authenticated, ex));
        throw ex;
    }
}
```

这是AccessDecisionManager 的结构图，SpringSecurity 默认实现是 AffirmativeBased（我看最新版本即6.1.0，这些全弃用了，估计是让咱自身实现吧🤔）。

AffirmativeBased 中的 decide 方法源码分析

```java
@Override
public void decide(Authentication authentication, Object object, Collection<ConfigAttribute> configAttributes)
        throws AccessDeniedException {
    // 否认的一个标志变量，用来判断是否授权成功
    int deny = 0;
    // 遍历 AccessDecisionVoter，看看是否能投票通过
    for (AccessDecisionVoter voter : getDecisionVoters()) {
        int result = voter.vote(authentication, object, configAttributes);
        switch (result) {
        // result 为 1 的话，就说有该 AccessDecisionVoter 已经投票通过了
        case AccessDecisionVoter.ACCESS_GRANTED:
            return;
        // result 为 0 的话，说明被否认了，否认的voter数加1	
        case AccessDecisionVoter.ACCESS_DENIED:
            deny++;
            break;
        // 如果是 -1 或者说其他的话，就表示弃权，不产于投票	
        default:
            break;
        }
    }
    // 到这的话如果deny大于0的话说明被否认了
    // 授权没通过，抛出异常
    if (deny > 0) {
        throw new AccessDeniedException(
                this.messages.getMessage("AbstractAccessDecisionManager.accessDenied", "Access is denied"));
    }
    // To get this far, every AccessDecisionVoter abstained
    checkAllowIfAllAbstainDecisions();
}
```

对授权源码分析后的总结：

**1、** 先是被`FilterSecurityInterceptor`拦截，调用doFilter方法，doFilter中调用了其自身实现的invoke方法；

**2、** 在invoke方法中，调用了父类AbstractSecurityInterceptor的beforeInvocation方法进行；

**3、** 在beforeInvocation方法中，调用了`attemptAuthorization`方法进行授权操作；

**4、** 在attemptAuthorization方法中，使用`AccessDecisionManager`决策对象调用decide方法进行决策，即授权；

**5、** 在decide方法中，即是遍历`AccessDecisionVoter`对象调用`vote`方法进行投票，判断是否授权成功（这里与AuthenticationManager中的authenticate方法遍历AuthenticationProvider对象进行认证类似）与上图对应；

### SecurityMetadataSource 分析

在FilterSecurityInterceptor 中有个 `FilterInvocationSecurityMetadataSource` 类型的属性对象，它可以通过 setter 方式进行注入的。FilterInvocationSecurityMetadataSource 中没有方法，继承了 SecurityMetadataSource，Spring Security 对其的默认实现是 DefaultFilterInvocationSecurityMetadataSource。

下面是默认实现的结构图

DefaultFilterInvocationSecurityMetadataSource 中的 `getAttributes` 方法源码分析如下：

```java
private final Map<RequestMatcher, Collection<ConfigAttribute>> requestMap;
// 构造注入 路径 <=> 权限集 映射
// requestMap 为 LinkedHashMap 的对象
public DefaultFilterInvocationSecurityMetadataSource(
        LinkedHashMap<RequestMatcher, Collection<ConfigAttribute>> requestMap) {
    this.requestMap = requestMap;
}
@Override
public Collection<ConfigAttribute> getAttributes(Object object) {
    // 注意 object instanceOf FilterInvocation 为 true
    final HttpServletRequest request = ((FilterInvocation) object).getRequest();
    // 遍历 requestMap，匹配请求路径一致的权限集
    for (Map.Entry<RequestMatcher, Collection<ConfigAttribute>> entry : this.requestMap.entrySet()) {
        if (entry.getKey().matches(request)) {
            return entry.getValue();
        }
    }
    return null;
}
```

## 三、自定义 FilterSecurityMetadataSource 对象（实战）

配置`SecurityFilterChain` 时，使用代码的方式配置 URL 拦截规则 和 请求 URL 所需要的权限，这种方式比较死板，如果想要调整访问某一个 URL 所需要的权限，就需要修改代码。

动态管理权限规则就是我们将 URL 拦截规则和访问 URI 所需要的权限都保存在数据库中，这样，在不修改源代码的情况下，只需要修改数据库中的数据，就可以对权限进行调整。即不用去修改代码，达到了解耦的效果。

当URL 和角色进行匹配的时候，Spring Security 是默认采用“或者”（OR）的方式来匹配用户所拥有的角色。比如：/hello 需要 ROLE_ADMIN、ROLE_USER 角色即可访问，即当用户拥有俩个角色的其中一个就可以访问。

### 自定义表

用户表（user）- 非 RememberMe 持久化那个 persistent_logins 表

角色表（role）

用户角色关联表 user -> role（user_role）

菜单表（menu）请求路径

菜单可被什么角色访问，即菜单关联角色表（menu_role）

### CustomSecurityMetadataSource

CustomSecurityMetadataSource 是小编自定义的 FilterSecurityMetadataSource 的实现类，根据上面的源码分析，如获取路径的匹配权限需要自己设定的话，需要自定义SecurityMetadataSource中的`getAttribute`方法。

CustomSecurityMetadataSource

```java
@Component
public class CustomSecurityMetadataSource implements FilterInvocationSecurityMetadataSource {
    private final MenuService menuService;
    public CustomSecurityMetadataSource(@Autowired MenuService menuService){
        this.menuService = menuService;
    }
    AntPathMatcher antPathMatcher = new AntPathMatcher();
    @Override
    public Collection<ConfigAttribute> getAttributes(Object object)
            throws IllegalArgumentException {
        HttpServletRequest request = (HttpServletRequest) ((FilterInvocation) object).getRequest();
        String requestURI = request.getRequestURI();
        // 查询所有菜单
        List<Menu> menus = menuService.getMenus();
        // 遍历菜单
        for (Menu menu : menus) {
            if(antPathMatcher.match(menu.getPattern(),requestURI)){
                String[] roles = menu.getRoles().stream().map(Role::getName).toArray(String[]::new);
                // 将 roles 转化成 List<ConfigAttribute) 对象
                return SecurityConfig.createList(roles);
            }
        }
        return null;
    }
    @Override
    public Collection<ConfigAttribute> getAllConfigAttributes() {
        return null;
    }
    @Override
    public boolean supports(Class<?> clazz) {
        return FilterInvocation.class.isAssignableFrom(clazz);
    }
}
```

### 配置自定义的 SecurityMetadataSource

SecurityConfig 配置类

```java
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    @Resource
    private MyUserDetailService myUserDetailService;
    private final CustomSecurityMetadataSource customSecurityMetadataSource;
    @Autowired
    public SecurityConfig(CustomSecurityMetadataSource securityMetadataSource){
        this.customSecurityMetadataSource = securityMetadataSource;
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // 1. 获取工厂对象
        ApplicationContext applicationContext = http.getSharedObject(ApplicationContext.class);
        // 2. 设置自定义 url 权限处理
        http.apply(new UrlAuthorizationConfigurer<>(applicationContext))
                .withObjectPostProcessor(new ObjectPostProcessor<FilterSecurityInterceptor>(){
                    @Override
                    public <O extends FilterSecurityInterceptor> O postProcess(O object) {
                        object.setSecurityMetadataSource(customSecurityMetadataSource);
                        // 是否拒绝公共资源的访问
                        object.setRejectPublicInvocations(false);
                        return object;
                    }
                }
                );
        return http
                .formLogin()
                .and()
                .csrf()
                .disable().build();
    }
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(myUserDetailService)
                .and()
                .build();
    }
}
```

### 测试代码

测试Controller 如下（Service、Dao、entity 类代码都没给出来，如果需要该测试工程代码，可以私聊，博客不好全部写出）

```java
@RestController
public class HelloController {
    @GetMapping("/admin/hello")
    public String admin(){
        return "Hello admin!";
    }
    @GetMapping("/user/hello")
    public String user(){
        return "Hello user!";
    }
    @GetMapping("/guest/hello")
    public String guest(){
        return "Hello Guest!";
    }
    @GetMapping("/hello")
    public String hello(){
        return "Hello!";
    }
}
```

### 测试效果

拿user/123 进行测试，从数据库表中可以得知，user 用户只有 ROLE_USER 角色，只能访问 /user/** 和 /guest/** 的资源。

测试效果：

效果解释：user 用户只有 ROLE_USER 角色，可以访问 /user/** 资源，也可以访问 /guest/** ，这是原因 Spring Security默认的匹配规则是 OR，访问 /guest/** 只要有 ROLE_GUEST 或 ROLE_USER 即可。而不能访问 /admin/** ，因为该请求需要 ROLE_ADMIN 角色。

## 四、总结

- 三大组件：ConfigAttribute（角色的封装体）、AccessDecisionManager（决策管理者，调用 decide 方法进行决策）、AccessDecisionVoter（决策者，通过 vote 方法进行投票决策）。
- 请求授权流程概述：被 FilterSecurityInterceptor 拦截-》调用invoke方法-》调用父类 AbstractSecurityInterceptor 的 beforeInvocation 方法-》通过 FilterSecurityMetadataSource 对象调用 getAttribute 得知访问该路径可被哪些权限访问-》将其作为参数调用 attemptAuthorization 进行尝试授权-》通过 AccessDecisionManager 做出决策，做决策者是 AccessDecisionVoter，遍历决策者得出决策结果。
- AccessDecisionManager 和 AccessDecisionVoter 之间的关系，类似于前期说的认证中的 AuthenticationManager 和 AuthenticationProvider。
- 自定义持久化URL权限管理时，需要自定义 FilterSecurityMetadataSource 实现类，实现 getAttribute 方法（在该方法中从数据库中获取对应 URL 匹配的角色），然后进行配置。
