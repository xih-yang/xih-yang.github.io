# 06、Spring Security 源码解析 - HttpSecurity 详解
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/6.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (B)
## 〇、上篇回顾

- 上一章介绍了整个框架的建造者，其中 HttpSecurity 也是建造者之一，主要构建目标是 FilterChainProxy 对象中一组 SecurityFilterChain 的一个 。在实际项目中也是必须用到的类，且功能极多，所以单独拆分一章讲讲其内部各个方法的功能及用法。注：各方法功能说明及示例均来自HttpSecurity源码，如解释不清的时候请参考源码。

## 一、方法列表索引

- formLogin()
- openidLogin()
- headers()
- cors()
- sessionManagement()
- portMapper()
- jee()
- x509()
- rememberMe()
- authorizeRequests()
- requestCache()
- exceptionHandling()
- securityContext()
- servletApi()
- csrf()
- logout()
- anonymous()
- requiresChannel()
- httpBasic()
- requestMatchers()
- addFilterAt()
- requestMatcher()
- antMatcher()
- mvcMatcher()
- regexMatcher()
- getOrApply()
- setSharedObject()
- beforeConfigure()
- performBuild()
- authenticationProvider()
- userDetailsService()
- getAuthenticationRegistry()
- addFilterAfter()
- addFilterBefore()
- addFilter()

## formLogin()

- **说明**：指定支持 基于表单 的身份验证。如果没有指定{@link FormLoginConfigurer#loginPage()}，将生成一个默认的登录页面。
- **示例1**：最基本的配置是默认生成登录地址是 /login 的登录页，如果验证失败的话会重定向到 /login?error 页面。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and().formLogin();
}
```

- **示例2**：下面这个例子可以配置一些默认值。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and().formLogin()
            .usernameParameter("username")
            .passwordParameter("password")
            .loginPage("/authentication/login")
            .failureUrl("/authentication/login?failed")
            .loginProcessingUrl("/authentication/login/process");
}
```

## openidLogin()

- **说明**：配置基于 OpenID 的认证
- **示例**：启用 OpenID 认证

```java
@Configuration
@EnableWebSecurity
public class OpenIDLoginConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests().antMatchers("/**").hasRole("USER").and()
                .openidLogin()
                .permitAll();
    }
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.inMemoryAuthentication()
                // 用户名必须与登录用户的OpenID匹配
                .withUser(
                        "https://www.google.com/accounts/o8/id?id=lmkCn9xzPdsxVwG7pjYMuDgNNdASFmobNkcRPaWU")
                .password("password").roles("USER");
    }
}
```

## headers()

- **说明**：向响应添加 请求安全头 。当使用 {@link WebSecurityConfigurerAdapter} 的默认构造函数时，它会被默认激活。
- **示例1**：只调用 {@link HttpSecurity#headers()} ，其实相当于调用了以下的所有方法

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.headers()
            .contentTypeOptions()
            .and()
            .xssProtection()
            .and()
            .cacheControl()
            .and()
            .httpStrictTransportSecurity()
            .and()
            .frameOptions()
            .and()
    //      ...
    ;
}
```

- 示例2：当然你也可以禁用 headers()

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.headers()
            .disable()
    ;
}
```

- 示例3：你也可以使用部分请求头，前提你需要调用 {@link HeadersConfigurer#defaultsDisabled()} 先关闭所有，然后打开你想要的请求头

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.headers()
            .defaultsDisabled()
            .cacheControl()
            .and()
            .frameOptions()
            .and()
    //      ...
    ;
}
```

- 示例4：同样你可以选择默认值，而关闭某些特定的请求头

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.headers()
            .frameOptions()
            .disable()
            .and()
    //      ...
    ;
}
```

## cors()

- 说明：添加要使用的 {@link CorsFilter} 。如果提供了一个名为 corsFilter 的bean，则使用 {@link corsFilter} 添加该Filter。

## sessionManagement()

- 说明：允许配置 Session 会话管理
- 示例：
- 下面的配置演示如何强制一次只对用户的单个实例进行身份验证。如果用户使用用户名 `user` 进行身份验证而没有注销，并且尝试再次使用 `user` 进行身份验证，第一个会话将被强制终止并发送到 `/login?expired` URL。

当使用 {@link SessionManagementConfigurer#maximumSessions()} 时，不要忘记为应用程序配置 {@link HttpSessionEventPublisher} ，以确保过期的会话被清除。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .anyRequest().hasRole("USER")
            .and()
            .formLogin().permitAll()
            .and()
            .sessionManagement().maximumSessions(1)
            .expiredUrl("/login?expired");
}
@Override
protected void configure(AuthenticationManagerBuilder auth) throws Exception {
    auth.inMemoryAuthentication()
            .withUser("user").password("password")
            .roles("USER");
}
```

## portMapper()

- 说明：允许配置 {@link HttpSecurity#getSharedObject()} 中可用的 {@link PortMapper} 端口映射。
- 示例：提供的 {@link SecurityConfigurer} 对象在从HTTP重定向到HTTPS，或从HTTPS重定向到HTTP时，使用这个配置作为默认的 {@link PortMapper}。默认情况下，Spring Security使用 {@link PortMapperImpl} 将HTTP端口8080映射到HTTPS端口8443，将HTTP端口80映射到HTTPS端口443。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and()
            .formLogin().permitAll()
            .and()
            .portMapper().http(9090).mapsTo(9443).http(80).mapsTo(443);
}
```

## jee()

- 说明：配置 基于容器 的预认证。在本例中，身份验证由Servlet容器管理。
- 示例：这个示例将使用 {@link HttpServletRequest} 上找到的用户，如果用户是角色 ROLE_USER 或 ROLE_ADMIN ，则将其添加到生成的 {@link Authentication} 中。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and()
            .jee().mappableRoles("ROLE_USER", "ROLE_ADMIN");
}
```

## x509()

- 说明：配置基于 X509 的预认证。
- 示例：这个示例将尝试从 X509 证书中提取用户名。请记住，需要配置Servlet容器来请求客户端证书，这样才能工作。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and()
            .x509();
}
```

## rememberMe()

- 说明：配置 Remember Me 认证。
- 示例：下面的配置演示了如何允许基于令牌的 remember me 身份验证。在进行身份验证时，如果名为 remember-me 的HTTP参数存在，那么即使在他们的 {@link javax.servlet.http.HttpSession} 过期失效之后，用户也会被记住。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and().formLogin()
            .permitAll().and()
            .rememberMe();
}
```

## authorizeRequests()

- 说明：配置基于 {@link HttpServletRequest} 使用限制访问
- 示例1：最基本的例子是配置所有 url 都需要有 ROLE_USER 角色。下面这个配置示例要求对每个URL进行身份验证，并将授予用户 admin 和 user 不同的访问权限。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and()
            .formLogin();
}
@Override
protected void configure(AuthenticationManagerBuilder auth) throws Exception {
    auth.inMemoryAuthentication()
            .withUser("user").password("password").roles("USER")
            .and()
            .withUser("admin").password("password").roles("ADMIN", "USER");
}
```

- 示例2：也可以配置多个url。下面的配置要求对每个URL进行身份验证，并且只允许 admin 用户访问以 /admin/ 开头的URL。任何一个用户都可以访问所有其他url。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/admin/**").hasRole("ADMIN")
            .antMatchers("/**").hasRole("USER")
            .and()
            .formLogin();
}
@Override
protected void configure(AuthenticationManagerBuilder auth) throws Exception {
    auth.inMemoryAuthentication()
            .withUser("user").password("password").roles("USER")
            .and()
            .withUser("admin").password("password").roles("ADMIN", "USER");
}
```

- 示例3：注意匹配器是按顺序匹配的。因此以下是无效的，因为第一个匹配器匹配每个请求，并且永远不会到达第二个匹配器。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .antMatchers("/admin/**").hasRole("ADMIN")
            .and()
            .formLogin();
}
```

## requestCache()

- 说明：允许配置 请求缓存 。例如，一个受保护的页面 /protected 可能会在身份验证之前被请求。应用程序将用户重定向到登录页面，身份验证之后，Spring Security将用户重定向到最初请求的受保护页面 /protected 。当使用 {@link WebSecurityConfigurerAdapter} 时，会被默认激活。

## exceptionHandling()

- 说明：允许配置 异常处理 。当使用 {@link WebSecurityConfigurerAdapter} 时，会被默认激活。

## securityContext()

- 说明：在 {@link HttpServletRequest} 之间的 {@link SecurityContext} 上建立 {@link SecurityContextHolder} 的管理。当使用 {@link WebSecurityConfigurerAdapter} 时，会被默认激活。

## servletApi()

- 说明：将 {@link HttpServletRequest} 方法与 {@link SecurityContext} 上的值集成起来。当使用 {@link WebSecurityConfigurerAdapter} 时，会被默认激活。

## csrf()

- 说明：添加 CSRF 支持
- 示例：当使用 {@link WebSecurityConfigurerAdapter} 时，会被默认激活。你可以禁用它

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .csrf().disable();
}
```

## logout()

- 说明：提供 注销 的支持。当使用 {@link WebSecurityConfigurerAdapter} 时，会被默认激活。默认情况下，访问URL /logout 将使HTTP会话失效，清除配置的所有 {@link HttpSecurity#rememberMe()} 身份验证，清除 {@link SecurityContextHolder} ，然后重定向到 /login?success，从而使用户退出。
- 示例：下面的配置，当 /custom-logout 接口被调用时，会走注销流程。注销将删除名为 remove 的cookie，清除 SecurityContexHolder，但是不会使 HttpSession 失效，在完成上面动作之后重定向到 /logout-success。

```java
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests().antMatchers("/**").hasRole("USER")
            .and().formLogin()
            .and()
            .logout().deleteCookies("remove").invalidateHttpSession(false)
            .logoutUrl("/custom-logout")
            .logoutSuccessUrl("/logout-success");
}
```

## anonymous()

- 说明：允许配置 匿名用户 的表示方式。当使用 {@link WebSecurityConfigurerAdapter} 时，会被默认激活。默认情况下，匿名用户将用 {@link org.springframework.security.authentication.AnonymousAuthenticationToken} ，包含角色 ROLE_ANONYMOUS。
- 示例1：下面的配置演示了如何指定匿名用户应该包含角色 ROLE_ANON。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and().formLogin()
            .and()
            .anonymous().authorities("ROLE_ANON");
}
```

- 示例2：下面演示了如何将匿名用户表示为空。注意，假设启用了匿名身份验证可能会导致代码中出现空指针异常。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
http.authorizeRequests()
        .antMatchers("/**").hasRole("USER")
        .and().formLogin()
        .and()
        .anonymous().disable();
}
```

## requiresChannel()

- 说明：配置 通道安全（HTTPS访问）。为了使该配置有用，至少必须提供一个到所需通道的映射。
- 示例：下面的例子演示了如何为每个请求要求HTTPS。不建议只支持某些请求需要HTTPS，因为允许HTTP的应用程序会引入许多安全漏洞。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and().formLogin()
            .and().requiresChannel().anyRequest().requiresSecure();
}
```

## httpBasic()

- 说明：配置 HTTP基本认证 。
- 示例：下面的示例演示如何为应用程序配置HTTP基本身份验证。默认的领域是 Spring Security Application ，但是可以使用 {@link HttpBasicConfigurer#realmName()} 自定义。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and()
            .httpBasic();
}
```

## requestMatchers()

- 说明：

// TODO … 。如果只需要一个 {@link RequestMatcher}，可以考虑使用 {@linkmvcMatcher()} 、{@linkantMatcher()}、 {@linkregexMatcher()}、或{@linkrequestMatcher()}。
- 调用 {@linkrequestMatchers()} 不会覆盖之前对 {@linkmvcMatcher()}、{@linkrequestMatchers()}、{@linkantMatcher()}、{@linkregexMatcher()} 和 {@linkrequestMatcher()} 的调用。

示例1：下面配置了以 /api/ 和 /oauth/ 开头的URL，无需认证。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .requestMatchers()
            .antMatchers("/api/**", "/oauth/**")
            .and()
            .authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and()
            .httpBasic();
}
```

- 示例2：下面的配置与前面的配置相同

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .requestMatchers()
            .antMatchers("/api/**")
            .antMatchers("/oauth/**")
            .and()
            .authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and()
            .httpBasic();
}
```

- 示例3：下面的配置也与上面的配置相同

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
            .requestMatchers()
            .antMatchers("/api/**")
            .and()
            .requestMatchers()
            .antMatchers("/oauth/**")
            .and()
            .authorizeRequests()
            .antMatchers("/**").hasRole("USER")
            .and()
            .httpBasic();
}
```

## addFilterAt()

- 说明：在指定的过滤器位置添加过滤器。

## requestMatcher()

- 说明：允许将 {@link HttpSecurity} 配置为只在匹配所提供的 {@link RequestMatcher} 时被调用。如果需要更高级的配置，可以考虑使用{@linkrequestMatchers()}。

## antMatcher()

- 说明：允许将 {@link HttpSecurity} 配置为只在匹配所提供的 ant 模式时被调用。如果需要更高级的配置，可以考虑使用 {@linkrequestMatchers()} 或 {@linkrequestMatcher()}。

## mvcMatcher()

- 说明：允许将 {@link HttpSecurity} 配置为只在匹配所提供的 Spring MVC 模式时被调用。如果需要更高级的配置，可以考虑使用 {@linkrequestMatchers()} 或 {@linkrequestMatcher(requestMatcher)} 。

## regexMatcher()

- 说明：允许将 {@link HttpSecurity} 配置为只在匹配所提供的 正则表达式 模式时被调用。如果需要更高级的配置，可以考虑使用 {@linkrequestMatchers()} 或 {@linkrequestMatcher()}。

## getOrApply()

- 说明：如果 {@link SecurityConfigurer} 已经被指定获取原始的，否则应用新的 {@link SecurityConfigurerAdapter} 配置。

## performBuild()

- 说明：实现的父类 AbstractConfiguredSecurityBuilder 的抽象接口，目的是创建SecurityFilterChain实例
