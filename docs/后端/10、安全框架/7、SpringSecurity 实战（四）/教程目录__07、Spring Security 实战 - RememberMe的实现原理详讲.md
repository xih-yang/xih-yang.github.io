# 07、Spring Security 实战 - RememberMe的实现原理详讲
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/7.html
- 分类：安全框架
- 分组：教程目录
## 一、RememberMe 的基本使用

先看看最简单用法的默认页面效果变化。

SecurityConfig 配置类

```java
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public InMemoryUserDetailsManager inMemoryUserDetailsManager(){
        return new InMemoryUserDetailsManager(
                User.withUsername("admin")
                        .password("{noop}123")
                        .roles("admin")
                        .build()
        );
    }
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(inMemoryUserDetailsManager())
                .and()
                .build();
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeRequests()
                .anyRequest()
                .authenticated()
                .and()
                .formLogin()
                .and()
                .rememberMe()
                .and()
                .csrf()
                .disable().build();
    }
}
```

测试TestController 代码

```java
@RestController
public class TestController {
    @GetMapping("/test")
    public String test(){
        return "test";
    }
}
```

以下是给出的默认的登录页面。

观察页面源代码可以发现，比原先没配置 RememberMe 之前多了个 name 为`remember-me` 的 checkbox 选项。

如果我们勾选了它并且登录成功后，当我们关闭掉当前浏览器，重新打开，是不必进行重新登录就可以访问登录用户所能访问了的资源的。在 [【Spring Security 实战（二）】Spring Security的实现原理](/zhuanlan/security/springsecurity/11/2.html?spm=1001.2014.3001.5501) 中小编列举了 Spring Security 中自带的过滤器，其中不是默认加载的队列中有个叫 `RememberMeAuthenticationFilter` ，它是用来处理 RememberMe 登录的。下面来通过对 RememberMeAuthenticationFilter 进行源码分析，了解 RememberMe 登录的实现原理。

## 二、RememberMeAuthenticationFilter 源码分析

我们知道 RememberMeAuthenticationFilter 是一个过滤器，其核心代码即在 `doFilter` 方法中，接下来就是对这个方法的源码分析。

`doFilter` 方法中主要实现可分为三步：

**1、** 请求到达过滤器后，首先判断SecurityContextHolder中是否有值，没值的话表示用户尚未登录，此时调用autoLogin方法进行自动登录；

**2、** 当自动登录成功后返回的rememberMeAuth不为null时，表示自动登录成功，此时调用authenticate方法对key进行校验，并且将登录成功的用户信息保存到SecurityContextHolder对象中，然后调用登录成功的回调，并发布登录成功时间需要注意的是：登录成功的回调并不包含RememberMeServices中的loginSuccess方法；

**3、** 失败的话会进行一些登录失败的回调，打印失败的日志信息；

可以看见其实现还得看 `rememberMeServices` 中的 autoLogin 方法，是否登录成功决定了后面成功和失败的回调。

```java
// RememberMeAuthenticationFilter 中的 doFilter 方法
private void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws IOException, ServletException {
        /*
        1. 请求到达过滤器后，首先判断 SecurityContextHolder 中是否有值，
        没值的话表示用户尚未登录，此时调用 autoLogin 方法进行自动登录
*/
    if (SecurityContextHolder.getContext().getAuthentication() != null) {
        this.logger.debug(LogMessage
                .of(() -> "SecurityContextHolder not populated with remember-me token, as it already contained: '"
                        + SecurityContextHolder.getContext().getAuthentication() + "'"));
        chain.doFilter(request, response);
        return;
    }
    Authentication rememberMeAuth = this.rememberMeServices.autoLogin(request, response);
    /*
    2. 当自动登录成功后返回的 rememberMeAuth 不为 null 时，
    表示自动登录成功，此时调用 authentication 方法对 key 进行校验，
    并且将登录成功的用户信息保存到 SecurityContextHolder 对象中，
    然后调用登录成功的回调，并发布登录成功时间。
    需要注意的是：登录成功的回调并不包含 RememberMeServices 中的 loginSuccess 方法。
    */
    if (rememberMeAuth != null) {
        // Attempt authenticaton via AuthenticationManager
        try {
            rememberMeAuth = this.authenticationManager.authenticate(rememberMeAuth);
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(rememberMeAuth);
            SecurityContextHolder.setContext(context);
            onSuccessfulAuthentication(request, response, rememberMeAuth);
            // 这里打印了保存到 SecurityContextHolder 中的authentication日志信息
            this.logger.debug(LogMessage.of(() -> "SecurityContextHolder populated with remember-me token: '"
                    + SecurityContextHolder.getContext().getAuthentication() + "'"));
            this.securityContextRepository.saveContext(context, request, response);
            if (this.eventPublisher != null) {
                this.eventPublisher.publishEvent(new InteractiveAuthenticationSuccessEvent(
                        SecurityContextHolder.getContext().getAuthentication(), this.getClass()));
            }
            if (this.successHandler != null) {
                this.successHandler.onAuthenticationSuccess(request, response, rememberMeAuth);
                return;
            }
        }
        catch (AuthenticationException ex) {
        /*
        3. 失败的话会进行一些登录失败的回调，
        打印失败的日志信息
*/
            this.logger.debug(LogMessage
                    .format("SecurityContextHolder not populated with remember-me token, as AuthenticationManager "
                            + "rejected Authentication returned by RememberMeServices: '%s'; "
                            + "invalidating remember-me token", rememberMeAuth),
                    ex);
            this.rememberMeServices.loginFail(request, response);
            onUnsuccessfulAuthentication(request, response, ex);
        }
    }
    chain.doFilter(request, response);
}
```

### RememberMeServices

RememberMeServices 是一个接口，其中定义了三个方法：

- autoLogin 方法可以从请求中提取出需要的参数，完成自动登录功能；
- loginFail 方法是自动登录失败的回调；
- loginSuccess 方法是自动登录成功的回调。

下面是Spring Security 中对 RememberMeServices 的实现类

#### TokenBasedRememberMeServices

TokenBasedRememberMeServices 是 Spring Security 的默认实现，接下来对其 autoLogin 进行源码分析，其实 autoLogin 是 AbstractRememberMeServices 中的一个方法，其子类并没有进行重写。子类重点重写的是 `processAutoLoginCookie` 方法。

先看看AbstractRememberMeServices 中实现的 autoLogin 方法（下面再对其内部调用的核心方法进行分析）

```java
// AbstractRememberMeServices 中实现的 autoLogin 方法
@Override
public final Authentication autoLogin(HttpServletRequest request, HttpServletResponse response) {
// 从request 对象中取对应 remember-me 名的 cookie 值
    String rememberMeCookie = extractRememberMeCookie(request);
    // 如果不存在的话就返回空
    if (rememberMeCookie == null) {
        return null;
    }
    this.logger.debug("Remember-me cookie detected");
    // 或者说是一个空值也返回空
    if (rememberMeCookie.length() == 0) {
        this.logger.debug("Cookie was empty");
        cancelCookie(request, response);
        return null;
    }
    try {
    // 先进行base64解码
    // 然后对rememberMeCookie进行 ：分割
        String[] cookieTokens = decodeCookie(rememberMeCookie);
        // 自动登录认证吧，算是
        // 去把用户名、密码、时长搞成MD5然后和cookie返回来的进行比对，认证过程在这个方法里
        UserDetails user = processAutoLoginCookie(cookieTokens, request, response);
        this.userDetailsChecker.check(user);
        this.logger.debug("Remember-me cookie accepted");
        // 创建一个RememberMeAuthenticationToken即为认证数据源
        return createSuccessfulAuthentication(request, user);
    }
    cancelCookie(request, response);
    return null;
}
```

获取对应 remember-name 名的 Cookie 值的方法源码如下

将Cookie 值进行 base64 解码，分割成字符串数组进行返回。

##### TokenBasedRememberMeServices 中对 processAutoLoginCookie 方法的实现

TokenBasedRememberMeServices 中对 `processAutoLoginCookie` 方法的实现，它主要是用来验证 Cookie 中的令牌信息是否合法的（下面说的 CookieTokens 是上面用base64解密，再分割的字符串数组）：

**1、** 首先判断CookieTokens长度是否为3，不为3就抛出异常；

**2、** 从CookieTokens中下标为1的值，也就是过期时间，判断令牌是否过期，如果已经过期，则抛出异常；

**3、** 根据用户名（CookieTokens下标为0的值）查询当前用户对象；

**4、** 调用makeTokenSignature方法生成一个签名，签名的生成过程如下：首先将`用户名、令牌过期时间、用户名密码以及key`组成一个字符串，中间用“`:`”隔开，然后通过`MD5`消息摘要算法对该字符串进行加密，并将加密结果转换为一个字符串返回；

**5、** 判断第4步生成的签名和通过Cookie传来的签名是否相等（即cookieTokens数组小标为2的值），如果相等，则表示令牌合法，直接返回用户对象，否则抛出异常；

下面是其源码，小编标号编号，与上解析相互对应

```java
@Override
protected UserDetails processAutoLoginCookie(String[] cookieTokens, HttpServletRequest request,
        HttpServletResponse response) {
        // 1
    if (cookieTokens.length != 3) {
        throw new InvalidCookieException(
                "Cookie token did not contain 3" + " tokens, but contained '" + Arrays.asList(cookieTokens) + "'");
    }
    // 2
    long tokenExpiryTime = getTokenExpiryTime(cookieTokens);
    if (isTokenExpired(tokenExpiryTime)) {
        throw new InvalidCookieException("Cookie token[1] has expired (expired on '" + new Date(tokenExpiryTime)
                + "'; current time is '" + new Date() + "')");
    }
    // 3
    UserDetails userDetails = getUserDetailsService().loadUserByUsername(cookieTokens[0]);
    Assert.notNull(userDetails, () -> "UserDetailsService " + getUserDetailsService()
            + " returned null for username " + cookieTokens[0] + ". " + "This is an interface contract violation");
    // 4
    String expectedTokenSignature = makeTokenSignature(tokenExpiryTime, userDetails.getUsername(),
            userDetails.getPassword());
        // 5
    if (!equals(expectedTokenSignature, cookieTokens[2])) {
        throw new InvalidCookieException("Cookie token[2] contained signature '" + cookieTokens[2]
                + "' but expected '" + expectedTokenSignature + "'");
    }
    return userDetails;
}
```

##### 总结

当用户通过用户名/密码的形式登录成功后，系统会根据用户的用户名、密码以及令牌的过期时间计算出一个签名，这个签名使用 MD5 消息摘要算法生成，是不可逆的。然后再将用户名、令牌过期时间以及签名拼接成一个字符串，中间用"`:`"隔开，对拼接好的字符串进行 Base64 编码，然后将编码后的字符串一起封装成 Cookie 值，返回给前端，也就是我们在浏览器中看到的令牌。**当关闭浏览器再次打开，访问系统资源时会自动携带上Cookie中的令牌，服务端拿到 Cookie 中的令牌后，先进行 Base64 解码，解码之后分别提取令牌中的三项数据；接着根据令牌中的数据判断令牌是否过期，如果没有过期，则根据令牌中的用户名查询出用户信息；接着再计算出一个签名和令牌中的签名进行比对，如果一致，表示会牌是合法令牌，自动登录成功，否则自动登录失败。**

##### 原理图式

## 三、提高安全性

通过上面的源码分析，我们知道，登录认证成功会去调用 TokenBasedRememberMeServices 中的 onLoginSuccess 方法生成 Cookie 响应给浏览器（其实对应的Cookie值就是Base6

编码后的值），浏览器会保存下来，当我们关闭浏览器后，可以利用请求报文中带有的这个 Cookie 进行认证从而访问到资源。这种免登录的方式是缺乏不安全的，有关 remember-me 的 Cookie 值暴露在外面，对隐私是有害的，那有什么办法让它变得安全吗？答案是没有绝对的安全，只能说是提高它的安全性。

### PersistentTokenBasedRememberMeServices

PersistentTokenBasedRememberMeServices 中的 onLoginSuccess 和 processAutoLoginCookie 不同于 TokenBasedRememberMeServices，下面看一下它的具体实现。

onLoginSuccess 具体实现

**1、** 先从认证数据源中获取用户名，然后将一序列号和用户名封装成一个PersistentRememberMeToken数据源；

**2、** 将这个数据源放入到tokenRepository仓库中，它是一个基于内存的仓库；

**3、** 最后将Cookie创建出来响应给浏览器，这个Cookie值是由series和token两项合并然后进行Base64编码的值；

processAutlLoginCookie 具体实现

**1、** 从CookieTokens数组中分别提取到series和token，然后根据series去内存中查询出一个PersistentRememberMeToken对象如果查询出来的对象为null，表示内存中并没有series对应的值，本次登录失败如果查询出来的token和从CookieTokens中解析出来的token不相同，说明自动登录令牌已经泄露（恶意用户利用令牌登录后，内存中的token就变了），此时移除当前用户的所有自动登录记录并抛出异常；

**2、** 根据数据库中查询出来的结果判断令牌是否过期，如果过期就抛出异常；

**3、** 生成一个新的PersistentRememberMeToken对象，用户名和series不变，token重新生成，data也使用当前时间newToken生成后，根据series去修改内存中的token和data（即每次自动登录后都会产生新的token和date）；

**4、** 调用addCookie方法添加Cookie，在addCookie方法中，实质是去调用了父类`AbstractRememberMeServices`中的setCookie方法，但是要注意第一个数组参数中只有两项：series和token（即返回到前端的令牌是通过对series和token进行base64编码得到的）；

**5、** 最后将根据用户名查询用户对象并返回；

### 内存令牌登录测试

Security 配置类

```java
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public InMemoryUserDetailsManager inMemoryUserDetailsManager(){
        return new InMemoryUserDetailsManager(
                User.withUsername("admin")
                        .password("{noop}123")
                        .roles("admin")
                        .build()
        );
    }
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(inMemoryUserDetailsManager())
                .and()
                .build();
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeRequests()
                .anyRequest()
                .authenticated()
                .and()
                .formLogin()
                .and()
                .rememberMe()
                // .rememberMeParameter("rememberMe")
                .rememberMeCookieName("rememberMe")
                .rememberMeServices(rememberMeServices())
                .and()
                .csrf()
                .disable().build();
    }
    @Bean
    public RememberMeServices rememberMeServices(){
        return new PersistentTokenBasedRememberMeServices(UUID.randomUUID().toString(),
                inMemoryUserDetailsManager(),
                new InMemoryTokenRepositoryImpl());
    }
}
```

测试结果：开一个浏览器进行登录认证，认证成功后携带了 remember-me Cookie，重开一个浏览器携带这个Cookie去访问服务器需认证的资源，然后再关闭刚开始的浏览器，再打开它进行访问一样的资源，会403重定向到登录页面且服务器端会报异常（此时内存中的令牌已经没了），报的是 CookieTheftException（Cookie被盗窃）。

注意：刷新没有报异常且可以访问资源，是因为存在SessionID，它在服务器端也可以进行认证，所以需要关闭浏览器让 SessionID 匹配不上（服务器端对应的 Session 自然会因超时被销毁）然后进行测试。

## 四、令牌数据库的持久化

在PersistentTokenBasedRememberMeServices 中存储令牌的 `PersistentTokenRepository` 仓库默认是基于内存实现的（即 `InMemoryTokenRepositoryImpl`），使用这种方式会出现一个问题，当服务器端重启应用程序时，那浏览器用户登录则需要重新登录，因为内存中肯定是没有对应的令牌了。

Spring Security 除了提供了 InMemoryTokenRepositoryImpl 实现外，还提供了`JdbcTokenRepositoryImpl` 对 PersistentTokenRepository 的实现。即将令牌会保存置数据库中，无需担心上面阐述的问题。

在JdbcTokenRepositoryImpl 中，已经为我们写好了需要的 SQL，令牌的增删改查实现已为我们提供了与数据库进行交互的支持。

测试一波，下面是配置代码

```java
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public InMemoryUserDetailsManager inMemoryUserDetailsManager(){
        return new InMemoryUserDetailsManager(
                User.withUsername("admin")
                        .password("{noop}123")
                        .roles("admin")
                        .build()
        );
    }
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(inMemoryUserDetailsManager())
                .and()
                .build();
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeRequests()
                .anyRequest()
                .authenticated()
                .and()
                .formLogin()
                .and()
                .rememberMe()
                // .rememberMeParameter("rememberMe")
                .rememberMeCookieName("remember-me")
                // .rememberMeServices(rememberMeServices())
                .tokenRepository(persistentTokenRepository())
                .and()
                .csrf()
                .disable()
                .build();
    }
    @Resource
    private DataSource dataSource;
    @Bean
    public PersistentTokenRepository persistentTokenRepository(){
        JdbcTokenRepositoryImpl tokenRepository = new JdbcTokenRepositoryImpl();
        tokenRepository.setDataSource(dataSource);
        // 设置为true要保障数据库该表不存在，不然会报异常哦
        // 所以第二次打开服务器应用程序的时候得把它设为false
        tokenRepository.setCreateTableOnStartup(true);
        return tokenRepository;
    }
}
```

当开启服务器应用的时候，自动为我们创建了表，如下图所示

认证后数据库表中会新增数据

## 五、总结

- RememberMe 实质呢就是将令牌以 Cookie 的形式响应给浏览器，然后浏览器进行了本地存储，等下次再次访问资源的时候，即会拿该令牌连请求一起到服务器端，令牌会使得后台进行自动登录（即用户认证）。
- 当我们自定义 SecurityFilterChain 安全过滤器链的时候，如果配置了 rememberMe() 的话，那RememberMeAuthenticationFilter 即会是过滤器链中的一员。
- 阐述一下流程（实现该功能最主要的类是 RememberMeServices，首次认证的响应和自动登录的认证它都是主角）：在没有自定义过滤器的情况下，一般都是使用 UsernamePasswordAuthenticationFilter 进行用户认证的，当点击了 checkbox 按钮连同用户信息一起向服务器端请求时，首先是 UsernamePasswordAuthenticationFilter 去完成认证，如果认证成功会调用 RememberMeServices 中的 onLoginSuccess 方法（这个看具体实现），此时响应中就已存在其令牌信息了（即 Cookie）。当关闭浏览器或Session过期，访问服务器端需要认证的资源时，请求报文中会带着这个Cookie一起到服务器端，会进入到 RememberMeAuthenticationFilter 过滤器中，它会调用 RememberMeServices 中的 autoLogin 方法进行自动登录，在 autoLogin 自动登录过程中，会调用 processAutoLoginCookie 方法进行令牌认证（该方法取决于 RememberMeServices 的实现类），autoLogin 方法执行完成认证成功后，返回了用户数据源信息，接下来就是一些封装数据信息到 SecurityContextHolder 中等等一些操作。
- RememberMeServices 是核心类，Spring Security 中提供了两种实现类，一种是 TokenBasedRememberMeServices，这种方式就是将用户名、超时时间、密码等信息进行Base64编码即一些操作组成的令牌给服务器，验证令牌就是对浏览器中发来的进行反编码看看是否一致，这种方式安全度很低；另一种实现是 PersistentTokenBasedRememberMeServices，它内部依赖于 PersistentTokenRepository 仓库，提供了基于内存和基于 Jdbc 的实现，它比前一种安全，原因是它每次自动认证后会更新令牌（即Cookie），如果在自动认证过程中发现令牌不一致会及时剔除（即从PersistentTokenRepository仓库中删除），报Cookie被盗窃异常。
- PersistentTokenBasedRememberMeServices 中同 TokenBasedRememberMeServices 一样的是它也使用的是 Base64 编码后进行令牌设置，自动登录认证令牌的时候也需要解码；不同的是它是由两数据组成的（序列号（固定的），token（会变化的）），而 TokenBasedRememberMeServices 是三。也不能说序列号是固定的吧，就是说它是在 onLoginSuccess 方法中生成的，然后存在浏览器上，在 processAutoLoginCookie 方法中不会改变这个序列号，只会变token，可以说浏览器Cookie解码后的序列号是固定死的（没有重新登录验证的情况下）。
- 使用起来很简单（一般使用的是PersistentTokenBasedRememberMeServices，且使用的仓库实现是 JdbcTokenRepositoryImpl），在配置 rememberMeConfigurer 时，配置一个 tokenRepository(PersistentTokenRepository) 即可，它会自动为我们配置 rememberMeServices 的，因为Spring Security就俩那实现，如果你配置了 PersistentTokenRepository，实质就默认你是使用了 PersistentTokenBasedRememberMeServices。
