# 08、Spring Security 实战 - 前后端分离-使用CSRF漏洞保护详讲
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/11/8.html
- 分类：安全框架
- 分组：教程目录
## 一、CSRF 概述

`CSRF`（Cross-Site Request Forgery 跨站请求伪造），也可称为一键式攻击（one-click-attack），通常缩写为 CSRF 或者 XSRF。

**CSRF 攻击是一种挟持用户在当前已登录的浏览器上发送恶意请求的攻击方法**。相对于 xss 利用用户对指定网站的信任，**CSRD 则是利用网站对用户网页浏览器的信任**。简单来说，CSRF 是致击者通过一些技术手段欺骗用户的浏览器，去访问一个用户曾经认证过的网站并执行恶意请求，例如发送邮件、发消息、甚至财产操作（如转账和购买商品）。由于客户端（浏览器）已经在该网站中认证过了，所以该网站会认为是真正用户在操作而执行请求（实际上并非用户的本意）。

举个简单的例子：

假设小柴 现在登录了某银行的网站准备完成一项转账操作，转账的链接如下：

```java
https://bank.xxx.com/withdraw?aaccount=小菜&amount=1000&for=myz
```

根据这个链接的请求参数可以看见，这个链接是想从 小柴 这个账户下转账 1000 元到 myz 账户下，假设 小柴 没有注释登录该银行的网站，就在同一个浏览器新的选项卡中打开了一个危险网站，这个危险网站中有一幅图片，代码如下：

```java
<img src="https://bank.xxx.com/withdraw?aaccount=小菜&amount=1000&for=zhangsan" />
```

一旦用户打开了这个网站，这个图片链接中的请求就会自动发送出去。由于是同一个浏览器并且用户尚未注销登录，所以该请求会自动携带上对应的有效的 Cookie 信息，进而完成一次转账操作。

这就是`CSRF` 跨站请求伪造。

Spring Security 默认是开启了 CSRF 防御的（没关闭即是开启）。

## 二、CSRF 攻击演示

银行网站：`server.port=8080`

转账接口

```java
@RestController
public class HelloController {
    @PostMapping("/withdraw")
    public String withdraw(){
        System.out.println("执行了一次转账操作");
        return "执行了一次转账操作";
    }
}
```

该网站安全配置（CSRF防御关闭）

```java
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeRequests()
                .anyRequest()
                .authenticated()
                .and()
                .formLogin()
                .and()
                .csrf()
                 .disable()
                // .and()
                .build();
    }
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(userDetailsService())
                .and()
                .build();
    }
    @Bean
    public UserDetailsService userDetailsService(){
        return new InMemoryUserDetailsManager(
                User.withUsername("root")
                        .password("{noop}123")
                        .roles("root")
                        .build()
        );
    }
}
```

攻击网站：`server.port=8081`

resources/static 目录下新建 index.html 文件，如下所示：

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>模拟 CSRF 跨站请求伪造</title>
</head>
<body>
    <form action="http://localhost:8080/withdraw" method="post">
        <input name="name" type="hidden" value="小柴"/>
        <input name="money" type="hidden" value="10000"/>
        <input type="submit" value="点我"/>
    </form>
</body>
</html>
```

测试

**注意：满足同源策略才会携带Cookie信息。**

## 三、CSRF 防御

CSRF 攻击的根源在于浏览器默认的身份验证机制（自动携带当前网站的Cookie信息，当然是满足同源策略的情况下），这种机制虽然可以保证请求是来自用户的某个浏览器，但是无法确保这请求是用户授权发送。攻击者和用户发送的请求一模一样，这意味着我们没有办法去直接拒绝这里的某个请求。如果能**在合法请求中额外携带一个攻击者无法获取的参数**，就可以成功区分出两种不同的情况，进而直接拒绝掉恶意请求。在 Spring Security 中就提供了这种机制来防御 CSRF 攻击，这种机制我们称之为 令牌同步模式。

### 令牌同步模式

> 这是目前主流的 CSRF 攻击防御方案。具体的操作方式就是在每一个 HTTP 请求中，除了默认自动携带的 Cookie 参数之外，再提供一个安全的、随机生成的字符串，我们称之为 CSRF 令牌。这个 CSRF 令牌由服务器端生成，生成后在 HttpSession 中保存一份。当前端请求到达后，将该请求携带的 CSRF 令牌信息和服务器端中保存的令牌进行比对，如果两者不相等，则拒绝掉该 HTTP 请求。

开启CSRF（当然是默认开启的）

服务器端生成的 CSRF 令牌

## 四、前后端分离使用 CSRF

### CsrfFilter 源码分析

在[【Spring Security 实战（二）】Spring Security的实现原理](/zhuanlan/security/springsecurity/11/2.html?spm=1001.2014.3001.5501) 中小编阐述了默认加载的过滤器，其中有个叫 `CsrfFilter` 的过滤器，它即是用来处理 CSRF 攻击的。

下面是它核心方法的源码

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
    request.setAttribute(HttpServletResponse.class.getName(), response);
    // 从请求 Cookie 中找 csrf 令牌
    CsrfToken csrfToken = this.tokenRepository.loadToken(request);
    // 是否存在令牌的标志
    boolean missingToken = (csrfToken == null);
    if (missingToken) {
        // 如果不存在的话就会去生成一个令牌，并存到 tokenRepository 仓库中
        csrfToken = this.tokenRepository.generateToken(request);
        this.tokenRepository.saveToken(csrfToken, request, response);
    }
    // 将 csrf 令牌放入 Request 作用域中
    request.setAttribute(CsrfToken.class.getName(), csrfToken);
    request.setAttribute(csrfToken.getParameterName(), csrfToken);
    // 判断请求方式，判断请求是否需要 CSRF 保护
    if (!this.requireCsrfProtectionMatcher.matches(request)) {
        if (this.logger.isTraceEnabled()) {
            this.logger.trace("Did not protect against CSRF since request did not match "
                    + this.requireCsrfProtectionMatcher);
        }
        filterChain.doFilter(request, response);
        return;
    }
    // 从请求头中获取名为 X-XSRF-TOKEN 令牌值
    String actualToken = request.getHeader(csrfToken.getHeaderName());
    if (actualToken == null) {
    // 请求头中没有的话，就从请求参数中获取名为 _csrf 的令牌值
        actualToken = request.getParameter(csrfToken.getParameterName());
    }
    // 将请求Cookie中的和请求参数/请求头中的 CSRF 令牌进行比对
    // 当然请求Cookie中不包含的话，会重新获取一个然后
    // 一致的话就放行，否则打印日志过滤掉该请求
    if (!equalsConstantTime(csrfToken.getToken(), actualToken)) {
        this.logger.debug(
                LogMessage.of(() -> "Invalid CSRF token found for " + UrlUtils.buildFullRequestUrl(request)));
        AccessDeniedException exception = (!missingToken) ? new InvalidCsrfTokenException(csrfToken, actualToken)
                : new MissingCsrfTokenException(actualToken);
        this.accessDeniedHandler.handle(request, response, exception);
        return;
    }
    filterChain.doFilter(request, response);
}
```

#### 源码一些方法的细究

- 如果请求中的 Cookie 不包含 CSRF 令牌信息的话，会通过 CsrfTokenRepository 中的 saveToken 方法 去存一个 Csrf 令牌（以Cookie的形式）放入 response 中响应回客户端。
- 下面红框框圈到的请求方式不参与 CSRF 防护。
- 如果是把 Csrf 令牌放入到请求头中去处理 Csrf 的话，请求头中参数名应该为X-XSRF-TOKEN；如果是把 Csrf 令牌放入到请求参数中处理 Csrf 的话，那请求参数中的参数名应该为_csrf。
- 如果请求方式满足，但请求参数或者请求头中没有 Csrf 对应的令牌的话，那请求是无法通过的。

### 测试

前后端分离开发时，需要将生成的 csrf 令牌放入到 Cookie 中，并在请求时获取 Cookie 中令牌信息进行提交即可（以请求头或者请求参数的形式提交）。

自定义认证过滤器处理登录认证

```java
public class LoginFilter extends UsernamePasswordAuthenticationFilter {
    public LoginFilter() {
    }
    public LoginFilter(AuthenticationManager authenticationManager) {
        super(authenticationManager);
    }
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        if (!request.getMethod().equals("POST")) {
            throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
        }
        if(request.getContentType().equalsIgnoreCase(MediaType.APPLICATION_JSON_VALUE)){
            try {
                Map<String,String> loginInfo = JSONObject.parseObject(request.getInputStream(), Map.class);
                String username = loginInfo.get(getUsernameParameter());
                String password = loginInfo.get(getPasswordParameter());
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, password);
                setDetails(request,auth);
                return getAuthenticationManager().authenticate(auth);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
        return super.attemptAuthentication(request, response);
    }
}
```

Spring Security 对应的安全配置信息

```java
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public UserDetailsService userDetailsService(){
        return new InMemoryUserDetailsManager(
                User.withUsername("root")
                        .password("{noop}123")
                        .roles("admin")
                        .build()
        );
    }
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(userDetailsService())
                .and()
                .build();
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeRequests()
                .anyRequest()
                .authenticated()
                .and()
                .logout()
                .logoutUrl("/api/auth/logout")
                .and()
                .addFilterBefore(loginFilter(http), LogoutFilter.class)
                .csrf()
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()) // 将令牌保存到 Cookie 中，允许 Cookie 前端获取
                .and().build();
    }
    @Bean
    public LoginFilter loginFilter(HttpSecurity http) throws Exception {
        LoginFilter loginFilter = new LoginFilter(authenticationManager(http));
        loginFilter.setFilterProcessesUrl("/api/auth/login");
        loginFilter.setAuthenticationFailureHandler(this::onAuthenticationFailure);
        loginFilter.setAuthenticationSuccessHandler(this::onAuthenticationSuccess);
        return loginFilter;
    }
    @Resource
    private ObjectMapper objectMapper;
    private void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                         AuthenticationException exception) throws IOException, ServletException {
        response.setCharacterEncoding("utf-8");
        response.setContentType("text/html;charset=utf-8");
        PrintWriter out = response.getWriter();
        out.print(objectMapper.writeValueAsString(JsonData.failure(401,exception.getMessage())));
        out.close();
    }
    private void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException, ServletException{
        response.setCharacterEncoding("utf-8");
        response.setContentType("text/html;charset=utf-8");
        PrintWriter out = response.getWriter();
        if(request.getRequestURI().endsWith("/login")){
            Map<String,Object> info = new HashMap<>();
            info.put("msg","登录成功");
            info.put("用户信息", SecurityContextHolder.getContext().getAuthentication().getPrincipal());
            out.write(objectMapper.writeValueAsString(JsonData.success(info)));
        }
        else if(request.getRequestURI().endsWith("/logout"))
            out.write(objectMapper.writeValueAsString(JsonData.success("注销成功")));
        // out.write(JSONObject.toJSONString(JsonData.success("登录成功")));
        out.close();
    }
}
```

测试结果

请求头中输入参数测试

Url请求参数中输入参数测试

## 五、总结

- CSRF（Cross-Site Request Forgery 跨站请求伪造），也可称为一键式攻击（one-click-attack），通常缩写为 CSRF 或者 XSRF。CSRF 攻击是一种挟持用户在当前已登录的浏览器上发送恶意请求的攻击方法。
- Spring Security 默认开启 CSRF 防御，当开启 CSRF 防御时，即安全过滤器链 SecurityFilterChain 中会多一个名为 CsrfFilter 的过滤器，该过滤器可以说是 CSRF 防御认证的过程。
- 前后端分离使用 CSRF 漏洞保护，首先是得从 Cookie 中获取对应的 xsrf（即csrf）令牌信息，享受服务器端的服务需要在请求参数中或者请求头中配置这个令牌信息（这里请求方式不包括GET、HEAD、OPTIONS、TRACE，如果是这四个请求方式，过滤器会直接放行），请求参数中配置名为_csrf，值是令牌信息；请求头的话配置名是X-XSRF-TOKEN，值是令牌信息。这样在一定程度上就提高了系统的安全性，不刻意去搞的话，这种方式很大程度上防御了跨站请求伪造（CSRF）。

**1、** 请求参数中携带令牌；

```java
key: _csrf
value: "???"
```

**1、** 请求头中携带令牌；

```java
X-XSRF-TOKEN:value
```
