# 05、Spring Security 实战 - 登录成功响应Json
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/5.html
- 分类：安全框架
- 分组：教程目录
## 前言

在前后端分离项目中，页面的跳转都是交由前端来处理，后端只需要返回Json数据即可。

## 实现

使用之前写好的[统一返回结果](https://blog.csdn.net/csdn_20210509/article/details/116568006)类Result，并将Result对象转化成json字符串响应。

```java
@Component
public class SignInSuccessHandler implements AuthenticationSuccessHandler {
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication
            authentication) throws IOException {
        Result success = Result.ok().message("登录成功！");
        response.setContentType(MediaType.APPLICATION_JSON_UTF8_VALUE);
        response.getWriter().write(JsonUtil.toJsonString(success));
    }
}
```

在SpringSecurityConfig中注入SignInSuccessHandler对象

```java
@Autowired
SignInSuccessHandler signInSuccessHandler;
```

将SignInSuccessHandler对象添加到successHandler中

```java
http.formLogin()
            .successHandler(signInSuccessHandler);
```

启动项目验证

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
                .successHandler(signInSuccessHandler);
        http.authorizeRequests()
                .antMatchers("/user").hasAuthority("user")
                .antMatchers("/admin").hasAuthority("admin")
                .anyRequest().authenticated();
    }
}
```
