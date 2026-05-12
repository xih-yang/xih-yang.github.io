# 07、Spring Security 实战 - 退出成功响应Json
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/7.html
- 分类：安全框架
- 分组：教程目录
## 前言

前面介绍了登录失败时候响应的Json，下面接着介绍退出成功时响应Json

## 实现

跟之前一样，新建一个SignOutSuccessHandler类，实现以下代码

```java
@Component
public class SignOutSuccessHandler implements LogoutSuccessHandler {
    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication
            authentication) throws IOException {
        Result success = Result.ok().message("退出成功！");
        response.setContentType(MediaType.APPLICATION_JSON_UTF8_VALUE);
        response.getWriter().write(JsonUtil.toJsonString(success));
    }
}
```

还是在**SpringSecurityConfig**类中，首先注入SignOutSuccessHandler对象，然后进行配置

```java
@Autowired
SignOutSuccessHandler signOutSuccessHandler;
```

```java
http.logout()
    .logoutSuccessHandler(signOutSuccessHandler);
```

启动项目，在浏览器先进行登录，然后通过[http://localhost:8080/logout](http://localhost:8080/logout)进行退出

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
    }
}
```
