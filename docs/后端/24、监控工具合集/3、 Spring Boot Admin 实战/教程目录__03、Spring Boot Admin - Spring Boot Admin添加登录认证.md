# 03、Spring Boot Admin - Spring Boot Admin添加登录认证
- 来源：https://ddkk.com/zhuanlan/monitoring/springbootadmin/3.html
- 分类：监控工具
- 分组：教程目录
## 前言

在搭建成功并集成nacos后，未登录用户也可访问首页，然后敏感信息太多，肯定得需要进程登录认证，此处只是一个演示，实际需要整合自己项目得权限认证

## 步骤

**1、** amdin服务端项目添加pom；

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

**1、** amdin项目添加security配置类；

```java
package org.pearl.devops.admin.config;
import de.codecentric.boot.admin.server.config.AdminServerProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
/**
 * Created by TD on 2020/10/26
 */
@EnableWebSecurity
@Configuration(proxyBeanMethods = false)
public class AdminSecurityConfig extends WebSecurityConfigurerAdapter {
    private final String adminContextPath;
    public AdminSecurityConfig(AdminServerProperties adminServerProperties) {
        this.adminContextPath = adminServerProperties.getContextPath();
    }
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        // @formatter:off
        SavedRequestAwareAuthenticationSuccessHandler successHandler = new SavedRequestAwareAuthenticationSuccessHandler();
        successHandler.setTargetUrlParameter("redirectTo");
        successHandler.setDefaultTargetUrl(adminContextPath + "/");
        http.authorizeRequests()
                .antMatchers(adminContextPath + "/assets/**").permitAll()
                .antMatchers(adminContextPath + "/login").permitAll()
                .antMatchers(adminContextPath + "/instances/**").permitAll()
                .anyRequest().authenticated()
                .and()
                .formLogin().loginPage(adminContextPath + "/login").successHandler(successHandler).and()
                .logout().logoutUrl(adminContextPath + "/logout").and()
                .httpBasic().and()
                .csrf()
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringAntMatchers(
                        adminContextPath + "/instances",
                        adminContextPath + "/actuator/**"
                );
        // @formatter:on
    }
    @Override
    public void configure(WebSecurity web) {
        web.ignoring().antMatchers("/actuator/**");
    }
}
```

**1、** yml配置登录用户；

```java
spring:
  application:
    name: pearl-admin
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848     nacos注册地址
  security:
    user:
      name: admin
      password: admin
```

**1、** 跳转首页，使用admin/admin登录；
