# 08、Spring Security 实战 - 无权限响应Json
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/8.html
- 分类：安全框架
- 分组：教程目录
## 前言

在[配置权限](/zhuanlan/security/springsecurity/9/3.html)章节中，我们看到当用户没有权限时，浏览器中显示下面代码，这显然对用户来说不友好，因为根本看不懂这些。接下来，我们通过json的形式，响应一个友好的提示。

```java
Whitelabel Error Page
This application has no explicit mapping for /error, so you are seeing this as a fallback.
Sun May 16 18:38:30 CST 2021
There was an unexpected error (type=Forbidden, status=403).
```

## 实现

创建NoPermissionHandler类，实现AccessDeniedHandler接口

```java
@Component
public class NoPermissionHandler implements AccessDeniedHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException e) throws IOException, ServletException {
        Result error = Result.error(ResultCode.NO_PERMISSION);
        response.setContentType(MediaType.APPLICATION_JSON_UTF8_VALUE);
        response.getWriter().write(JsonUtil.toJsonString(error));
    }
}
```

在SpringSecurityConfig类中注入NoPermissionHandler 对象

```java
@Autowired
NoPermissionHandler noPermissionHandler;
```

添加以下配置

```java
http.exceptionHandling()
    .accessDeniedHandler(noPermissionHandler);
```

## 验证

启动项目，进行验证

## 完整代码

```java
@EnableWebSecurity
public class SpringSecurityConfig extends WebSecurityConfigurerAdapter {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Autowired
    SignInSuccessHandler signInSuccessHandler;
    @Autowired
    SignInFailureHandler signInFailureHandler;
    @Autowired
    SignOutSuccessHandler signOutSuccessHandler;
    @Autowired
    NoPermissionHandler noPermissionHandler;
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.inMemoryAuthentication()
                .withUser("user")
                .password(passwordEncoder().encode("123"))
                .authorities("user");
        auth.inMemoryAuthentication()
                .withUser("admin")
                .password(passwordEncoder().encode("123"))
                .authorities("admin");
    }
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.formLogin()
                .successHandler(signInSuccessHandler)
                .failureHandler(signInFailureHandler);
        http.logout()
                .logoutSuccessHandler(signOutSuccessHandler);
        http.authorizeRequests()
                .antMatchers("/user").hasAuthority("user")
                .antMatchers("/admin").hasAuthority("admin")
                .anyRequest().authenticated();
        http.exceptionHandling()
                .accessDeniedHandler(noPermissionHandler);
    }
}
```
