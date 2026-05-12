# 06、Spring Security 实战 - 登录失败响应Json
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/6.html
- 分类：安全框架
- 分组：教程目录
## 前言

之前已经介绍了[登录成功响应Json](/zhuanlan/security/springsecurity/9/5.html)，那么**登录失败响应Json**跟之前一样的原理，下面进行实现。

## 实现

新建SignInFailureHandler

```java
@Component
public class SignInFailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        Result error = Result.error();
        if (exception instanceof LockedException) {
            error.message(ResultCode.ACCOUNT_LOCKED.getMessage());
        } else if (exception instanceof CredentialsExpiredException) {
            error.message(ResultCode.CREDENTIALS_EXPIRED.getMessage());
        } else if (exception instanceof AccountExpiredException) {
            error.message(ResultCode.ACCOUNT_EXPIRED.getMessage());
        } else if (exception instanceof DisabledException) {
            error.message(ResultCode.ACCOUNT_DISABLED.getMessage());
        } else if (exception instanceof BadCredentialsException) {
            error.message(ResultCode.BAD_CREDENTIALS.getMessage());
        } else if (exception instanceof SessionAuthenticationException){
            error.message(ResultCode.EXCEED_MAX_SESSION.getMessage());
        } else {
            error.message(exception.getMessage());
        }
        response.setContentType(MediaType.APPLICATION_JSON_UTF8_VALUE);
        response.getWriter().write(JsonUtil.toJsonString(error));
    }
}
```

将SignInFailureHandler注入到SpringSecurityConfig中。

```java
@Autowired
SignInFailureHandler signInFailureHandler;
```

```java
http.formLogin()
            .successHandler(signInSuccessHandler)
            .failureHandler(signInFailureHandler);
```

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
        http.authorizeRequests()
                .antMatchers("/user").hasAuthority("user")
                .antMatchers("/admin").hasAuthority("admin")
                .anyRequest().authenticated();
    }
}
```

## 验证

启动项目，数据错误的用户名密码
