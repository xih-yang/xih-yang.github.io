# 02、Spring Security 实战 - 内存方式配置用户
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/9/2.html
- 分类：安全框架
- 分组：教程目录
## 前言

在[Spring Security 实战（一、初体验）](/zhuanlan/security/springsecurity/9/1.html)中已经介绍了两种配置用户的方式，本节介绍通过**内存方式配置用户**进行登录。

## 配置

要实现内存方式配置用户，需要重写**SpringSecurity**中默认的方法。接下来，我们创建一个名为**SpringSecurityConfig**的类并继承**WebSecurityConfigurerAdapter**类，然后重写其中的方法。

指定一个名为user的用户，密码123，权限user的用户

```java
@EnableWebSecurity
public class SpringSecurityConfig extends WebSecurityConfigurerAdapter {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.inMemoryAuthentication()
                .withUser("user")
                .password(passwordEncoder().encode("123"))
                .authorities("user");
    }
}
```

由于在**SpringSecurity**中需要指定密码的加密方式，所以注入**PasswordEncoder**，使用**BCryptPasswordEncoder**进行密码加密。

> 注：想要让此配置生效，@EnableWebSecurity注解一定不能少

## 使用

启动项目，通过浏览器访问[http://localhost:8080/](http://localhost:8080/)

通过前面配置的**user**用户进行登录，发现登录成功，并成功返回了index

基于内存的方式配置用户就先介绍到这里。
