# 01、SpringBoot 实战 - 集成 SpringSecurity
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/5/1.html
- 分类：J2EE框架
- 分组：教程目录
> 亲测可行，送给探索SpringBoot和SpringSecurtiy的新手们

## 0.页面展示

## 登录页

## 首页

## 1.使用IDEA创建SpringBoot程序

## 2.整体包结构

## 3.pom.xml

> 如果是按照第一步正常勾选之后的SpringBoot程序无需改动pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.1.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.springboot.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>demo</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>1.8</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>2.1.1</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

## 4.数据库结构

```sql
create database my;
use my;
-- 创建用户表
CREATE TABLE sys_user (
    id int(11) NOT NULL AUTO_INCREMENT COMMENT '主键',
    username varchar(64) NOT NULL COMMENT '用户名',
    password varchar(64) NOT NULL COMMENT '密码',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户表';
-- 创建角色表
CREATE TABLE sys_role (
    id int(11) NOT NULL COMMENT '主键',
    name varchar(64) NOT NULL COMMENT '角色名',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='角色表';
-- 创建用户角色表
CREATE TABLE sys_user_role (
    user_id int(11) NOT NULL COMMENT '用户ID',
    role_id int(11) NOT NULL COMMENT '角色ID',
    PRIMARY KEY (user_id,role_id),
    KEY fk_role_id (role_id),
    CONSTRAINT fk_role_id FOREIGN KEY (role_id) REFERENCES sys_role (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES sys_user (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户角色表';
INSERT INTO sys_role VALUES ('1', 'ROLE_ADMIN');
INSERT INTO sys_role VALUES ('2', 'ROLE_USER');
INSERT INTO sys_user VALUES ('1', 'admin', '123456');
INSERT INTO sys_user VALUES ('2', 'test', '123456');
INSERT INTO sys_user_role VALUES ('1', '1');
INSERT INTO sys_user_role VALUES ('2', '2');
```

## 5.java源码

## config

### MyUserDetailsService

```java
package com.springboot.example.demo.config;
import com.springboot.example.demo.entity.SysRole;
import com.springboot.example.demo.entity.SysUser;
import com.springboot.example.demo.entity.SysUserRole;
import com.springboot.example.demo.service.SysRoleService;
import com.springboot.example.demo.service.SysUserRoleService;
import com.springboot.example.demo.service.SysUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
/**
 * <p> @Title MyUserDetailsService
 * <p> @Description 系统用户认证配置
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/27 14:37
 */
@Service("userDetailsService")
public class MyUserDetailsService implements UserDetailsService {
    @Autowired
    private SysUserService userService;
    @Autowired
    private SysRoleService roleService;
    @Autowired
    private SysUserRoleService userRoleService;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        // 从数据库中取出用户信息
        SysUser user = userService.selectByName(username);
        // 判断用户是否存在
        if(user == null) {
            throw new UsernameNotFoundException("用户名不存在");
        }
        // 添加权限
        List<SysUserRole> userRoles = userRoleService.listByUserId(user.getId());
        for (SysUserRole userRole : userRoles) {
            SysRole role = roleService.selectById(userRole.getRoleId());
            authorities.add(new SimpleGrantedAuthority(role.getName()));
        }
        // 返回UserDetails实现类
        return new User(user.getUsername(), user.getPassword(), authorities);
    }
}
```

### WebConfiguration

```java
package com.springboot.example.demo.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
/**
 * SpringBoot静态路径配置
 *
 * @author bask
 */
@Configuration
@Primary
public class WebConfiguration implements WebMvcConfigurer {
    /**
     * 访问外部文件配置
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("");
        WebMvcConfigurer.super.addResourceHandlers(registry);
    }
}
```

### WebSecurityConfig

```java
package com.springboot.example.demo.config;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.password.PasswordEncoder;
/**
 * <p> @Title WebSecurityConfig
 * <p> @Description Spring Security 配置
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/27 14:38
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
@AllArgsConstructor
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
    private MyUserDetailsService userDetailsService;
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService).passwordEncoder(new PasswordEncoder() {
            @Override
            public String encode(CharSequence charSequence) {
                return charSequence.toString();
            }
            @Override
            public boolean matches(CharSequence charSequence, String s) {
                return s.equals(charSequence.toString());
            }
        });
    }
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
                // 如果有允许匿名的url，填在下面
                // .antMatchers().permitAll()
                // 其他所有请求需要身份认证
                .anyRequest().authenticated()
                .and()
                // 设置登陆页
                .formLogin().loginPage("/login")
                // 设置登陆成功页
                .successForwardUrl("/").permitAll()
                .failureForwardUrl("/login?error=用户名或密码不正确")
                // 自定义登陆用户名和密码参数，默认为username和password
                // .usernameParameter("username")
                // .passwordParameter("password")
                .and()
                .logout().permitAll();
        // 关闭CSRF跨域
        http.csrf().disable();
    }
    @Override
    public void configure(WebSecurity web) {
        web.ignoring().antMatchers("/js/**")
                .antMatchers("/css/**");
    }
}
```

## controller

### IndexController

```java
package com.springboot.example.demo.controller;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
/**
 * <p> @Title IndexController
 * <p> @Description 首页Controller
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/10/23 20:23
 */
@Controller
@AllArgsConstructor
public class IndexController {
    private static final Logger LOGGER = LoggerFactory.getLogger(IndexController.class);
    @RequestMapping("/")
    public String showHome() {
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        LOGGER.info("当前登陆用户：" + name);
        return "redirect:/index";
    }
    @RequestMapping("/index")
    public String index() {
        return "home";
    }
    @RequestMapping("/login")
    public String showLogin() {
        return "login";
    }
    @RequestMapping("/admin")
    @ResponseBody
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public String printAdmin() {
        return "如果你看见这句话，说明你有ROLE_ADMIN角色";
    }
    @RequestMapping("/user")
    @ResponseBody
    @PreAuthorize("hasRole('ROLE_USER')")
    public String printUser() {
        return "如果你看见这句话，说明你有ROLE_USER角色";
    }
}
```

## dao

### SysRoleMapper

```java
package com.springboot.example.demo.dao;
import com.springboot.example.demo.entity.SysRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
/**
 * <p> @Title SysUserRoleMapper
 * <p> @Description 系统角色Mapper
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/27 14:28
 */
@Mapper
public interface SysRoleMapper {
    /**
     * 根据角色ID查找角色
     *
     * @param id 角色ID
     * @return 角色
     */
    @Select("select * from sys_role where id ={id}")
    SysRole findById(Long id);
}
```

### SysUserMapper

```java
package com.springboot.example.demo.dao;
import com.springboot.example.demo.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;
/**
 * <p> @Title SysUserMapper
 * <p> @Description 系统用户Mapper
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/27 10:28
 */
@Mapper
public interface SysUserMapper {
    /**
     * 根据用户名查找用户
     *
     * @param username 用户名
     * @return 用户
     */
    @Select("select * from sys_user where username ={username}")
    SysUser findByName(String username);
}
```

### SysUserRoleMapper

```java
package com.springboot.example.demo.dao;
import com.springboot.example.demo.entity.SysUserRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;
/**
 * <p> @Title SysUserRoleMapper
 * <p> @Description 系统用户角色Mapper
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/27 14:28
 */
@Mapper
public interface SysUserRoleMapper {
    /**
     * 根据用户ID查找用户角色
     *
     * @param userId 用户ID
     * @return 用户角色
     */
    @Select("select * from sys_user_role where user_id ={userId}")
    List<SysUserRole> findByUserId(Long userId);
}
```

## entity

### SysRole

```java
package com.springboot.example.demo.entity;
import lombok.Data;
/**
 * <p> @Title SysRole
 * <p> @Description 用户角色
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/27 10:23
 */
@Data
public class SysRole {
    /** 主键 */
    private Long id;
    /** 角色名 */
    private String name;
}
```

### SysUser

```java
package com.springboot.example.demo.entity;
import lombok.Data;
import java.io.Serializable;
/**
 * <p> @Title SysUser
 * <p> @Description 系统用户
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/23 10:49
 */
@Data
public class SysUser implements Serializable {
    /** 主键 */
    private Long id;
    /** 用户名. */
    private String username;
    /** 密码. */
    private String password;
}
```

### SysUserRole

```java
package com.springboot.example.demo.entity;
import lombok.Data;
/**
 * <p> @Title SysUserRole
 * <p> @Description 用户角色关系表
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/27 10:25
 */
@Data
public class SysUserRole {
    /** 用户ID */
    private Long userId;
    /** 角色ID */
    private Long roleId;
}
```

## service

### SysRoleService

```java
package com.springboot.example.demo.service;
import com.springboot.example.demo.dao.SysRoleMapper;
import com.springboot.example.demo.entity.SysRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
/**
 * <p> @Title SysRoleService
 * <p> @Description 系统角色Service
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/27 14:34
 */
@Service
public class SysRoleService {
    @Autowired
    private SysRoleMapper roleMapper;
    public SysRole selectById(Long id){
        return roleMapper.findById(id);
    }
}
```

### SysUserRoleService

```java
package com.springboot.example.demo.service;
import com.springboot.example.demo.dao.SysUserRoleMapper;
import com.springboot.example.demo.entity.SysUserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
/**
 * <p> @Title SysUserRoleService
 * <p> @Description 系统用户角色Service
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/27 14:35
 */
@Service
public class SysUserRoleService {
    @Autowired
    private SysUserRoleMapper userRoleMapper;
    public List<SysUserRole> listByUserId(Long userId) {
        return userRoleMapper.findByUserId(userId);
    }
}
```

### SysUserService

```java
package com.springboot.example.demo.service;
import com.springboot.example.demo.dao.SysUserMapper;
import com.springboot.example.demo.entity.SysUser;
import org.springframework.beans.factory.annotation.Autowired;
/**
 * <p> @Title SysUserService
 * <p> @Description 系统用户Service
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date 2022/11/23 10:53
 */
@Service
public class SysUserService {
    @Autowired
    private SysUserMapper sysUserMapper;
    public SysUser selectByName(String username) {
        return sysUserMapper.findByName(username);
    }
}
```

## DemoApplication

```java
package com.springboot.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

## 6.resources源码

## templates

### home.html

```xml
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<h1>登陆成功</h1>
<a href="/admin">检测ROLE_ADMIN角色</a>
<a href="/user">检测ROLE_USER角色</a>
<button onclick="window.location.href='/logout'">退出登录</button>
</body>
</html>
```

### login.html

```xml
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>登陆</title>
</head>
<body>
    <center>
        <h1>登陆</h1>
        <form method="post" action="/login">
            <div>
                用户名：<input type="text" name="username">
            </div>
            <br/>
            <div>
                密  码：<input type="password" name="password">
            </div>
            <br/>
            <div>
                <button type="submit">立即登陆</button>
            </div>
        </form>
    </center>
</body>
</html>
```

## application.yml

```java
server:
  port: 8080
  servlet:
    context-path: / 项目路径
spring:
  mvc:
    view:
      prefix: /templates/
      suffix: .html
  datasource:
    driver-class-name: com.mysql.jdbc.Driver
    url: jdbc:mysql://localhost:3306/my?useUnicode=true&characterEncoding=utf-8&useSSL=true
    username: root
    password: root
#开启Mybatis下划线命名转驼峰命名
mybatis:
  configuration:
    map-underscore-to-camel-case: true
```

源码下载:

CSDN下载: //download.csdn.net/download/qq_33204709/12004398

> 漫漫学习路, 永无止境。。。
