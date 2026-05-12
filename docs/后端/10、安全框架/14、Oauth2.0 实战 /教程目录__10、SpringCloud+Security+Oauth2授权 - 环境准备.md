# 10、SpringCloud+Security+Oauth2授权 - 环境准备
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/10.html
- 分类：安全框架
- 分组：教程目录
## 1.概述

### 1.1.SpringSecurity-Oauth2介绍#

SpingSecurity Oauth2实现了Oatuh2，SpingSecurity Oauth2分为两个大块，一者为认证授权(Authorization Server)服务和资源服务(Resource server)，认证授权服务一般负责执行认证逻辑(登录)和加载用户的权限(给用户授权)，以及认证成功后的令牌颁发 ，而资源服务器一般指的是我们系统中的微服务(被访问的微服务)，在资源服务器需要对用户的令牌(认证成功与否)，以及授权(是不是有访问权限)做检查 。

### 1.2.微服务Oauth2认证解决方案#

这里我们需要准备四个服务，1.授权服务 2.资源服务，3.网关，4注册中心，一共4个服务。授权服务和资源服务的流程图：

请求流程是：

- 浏览器向认证服务提交认证获取Token
- 浏览器存储Token并向资源服务器发起请求
- 资源服务器校验Token并对资源进行授权

## 2.微服务环境准备

注意：没有SpringCloud基础的同学先去学SpringCloud,搭建基本项目结构如下

```java
security-parent  //父工程
	security-auth-server  //统一认证微服务
	security-eureka-server  //注册中心
	security-resource-server  //资源微服务
	security-zuul-server  //网关
```

### 2.1.搭建父工程#

管理SpringBoot和SpringCloud相关依赖，管理公共依赖，以及依赖版本统一管理

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.0.5.RELEASE</version>
</parent>
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>Finchley.SR1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 2.2搭建EurekaServer注册中心#

**1、** 导入依赖；

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

**2、** 启动类；

```java
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class);
    }
}
```

**3、** yml配置；

```java
server:
  port: 1000
eureka:
  instance:
    hostname: localhost
  client:
    registerWithEureka: false禁用注册中心向自己注册
    fetchRegistry: false 不让注册中心获取服务的注册列表
    serviceUrl:
      defaultZone: http://localhost:1000/eureka/
     注册中心的注册地址 ，其他微服务需要向这个地址注册
```

### 2.3.搭建ZuulServer网关微服务#

微服务统一访问入口，后面实现统一鉴权操作。

**1、** 导入依赖；

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-zuul</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
</dependencies>
```

**2、** 启动类；

```java
@SpringBootApplication
@EnableZuulProxy
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class);
    }
}
```

**3、** yml配置；

```java
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:1000/eureka/注册中心地址
  instance:
    prefer-ip-address: true使用ip地址注册
    instance-id: zuul-server:2000 指定服务的id
server:
  port: 2000
zuul:
  ignored-services: "*"  禁止使用服务名字进行访问
  prefix: "/servers" 统一的前缀
  routes:配置路由，指定服务的访问路径
    resource1-server: "/resources/**"
spring:
  application:
    name: zuul-server
```

### 2.4.搭建AuthServer认证授权微服务#

认证微服务，实现认证逻辑，用户授权，令牌颁发等

**1、** 导入依赖；

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

**2、** 启动类；

```java
@SpringBootApplication
public class AuthServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServerApplication.class) ;
    }
}
```

**3、** yml配置；

```java
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:1000/eureka/注册中心地址
  instance:
    prefer-ip-address: true使用ip地址注册
    instance-id: auth-server:3000 指定服务的id
server:
  port: 3000
spring:
  application:
    name: auth-server
```

### 2.5.搭建Resource1Server资源微服务#

资源服务,负责校验Token和资源授权

**1、** 导入依赖；

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

**2、** 启动类；

```java
@SpringBootApplication
public class Resource1ServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(Resource1ServerApplication.class) ;
    }
}
```

**3、** yml配置；

```java
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:1000/eureka/注册中心地址
  instance:
    prefer-ip-address: true使用ip地址注册
    instance-id: resource1-server:4000 指定服务的id
server:
  port: 4000
spring:
  application:
    name: resource1-server
```

启动测试http://localhost:1000/

## 3.认证服务配置

### 3.1.创建相关组件#

修改security-auth-server服务，完成User，Role,Permission实体类的创建，以及mapper映射器，Mapper.xml等相关组件的创建 ， 以及相关表的创建和关系维护，这里省略…

### 3.2.集成MyBatis#

**1、** security-auth-server增加依赖,"spring-cloud-starter-oauth2"包含了Oauth2和Security的内容；

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-oauth2</artifactId>
    </dependency>
        <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>druid</artifactId>
        <version>1.1.20</version>
    </dependency>
    <!-- mysql 数据库驱动. -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
    </dependency>
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>1.1.1</version>
    </dependency>
</dependencies>
```

**2、** 开启Mapper扫描"MapperScan"；

```java
@SpringBootApplication
@MapperScan("cn.itsource.mapper")
public class AuthServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServerApplication.class) ;
    }
}
```

**3、** yml增加DataSource和MyBatis配置；

```java
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:1000/eureka/注册中心地址
  instance:
    prefer-ip-address: true使用ip地址注册
    instance-id: auth-server:3000 指定服务的id
server:
  port: 3000
mybatis:
  mapper-locations: classpath:cn/itsource/mapper/*Mapper.xml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    username: root
    password: admin
    url: jdbc:mysql:///auth-rbac
    driver-class-name: com.mysql.jdbc.Driver
  application:
    name: auth-server
```

### 3.3.配置UserDetailsService#

定义一个类，实现UserDetailsService接口，复写loadUserByUsername，根据用户名从数据库中获取认证的用户对象，并且加载用户的权限信息，把用户的认证信息和权限信息封装成UserDetaials返回。

在前面的章节已经学习过UserDetailsService的配置这里不在赘述配置如下

```java
package cn.itsource.userdetails;
import cn.itsource.domain.Permission;
import cn.itsource.domain.User;
import cn.itsource.mapper.PermissionMapper;
import cn.itsource.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
@Component
public class UserDetailServiceImpl implements UserDetailsService {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private PermissionMapper permissionMapper;
    /**
     * 加载数据库中的认证的用户的信息：用户名，密码，用户的权限列表
     * @param username: 该方法把username传入进来，
        我们通过username查询用户的信息(密码，权限列表等)
        然后封装成 UserDetails进行返回 ，交给security 。
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        //User是security内部的对象，UserDetails的实现类 ，
        //用来封装用户的基本信息（用户名，密码，权限列表）
        //public User(String username, String password, Collection<? extends GrantedAuthority> authorities)
		User userFromDB = userMapper.selectByUsername(username);
        if(null == userFromDB){
            throw new RuntimeException("无效的用户");
        }
        //模拟存储在数据库的用户的密码：123
        //String password = passwordEncoder.encode("123");
        String password = userFromDB.getPassword();
        //查询用户的权限
        List<Permission> permission = permissionMapper.selectPermissionsByUserId(userFromDB.getId());
        //用户的权限列表,暂时为空
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        permission.forEach(e->{
            System.out.println("用户："+userFromDB.getUsername()+" 加载权限："+e.getExpression());
            authorities.add(new SimpleGrantedAuthority(e.getExpression()));
        });
		//注意：这里的User是Security的User不是我们自己的User
        org.springframework.security.core.userdetails.User  user = new org.springframework.security.core.userdetails.User (username,password, authorities);
        return user;
    }
}
```

认证服务在处理认证逻辑的时候会通过该userDetailService加载用户在数据库中的认证信息实现身份认证，同时在整个方法中也加载了用户的权限列表，后续当用户发起对资源服务的访问时，是否能够授权成功就跟用户的权限列表息息相关了。

### 3.4.配置Security#

在前面的章节已经学习过WebSecurity的配置这里不在赘述，配置如下

```java
//Security配置
@Configuration
@EnableWebSecurity(debug = false)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
    //密码 编码器
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
    //授权规则配置
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable()   //屏蔽跨域防护
                .authorizeRequests()          //对请求做授权处理
                .antMatchers("/login").permitAll()  //登录路径放行
                .anyRequest().authenticated() //其他路径都要拦截
                .and().formLogin()  //允许表单登录， 设置登陆页
                .and().logout().permitAll();    //登出
    }
    //配置认证管理器，授权模式为“poassword”时会用到
    @Bean
    public AuthenticationManager authenticationManager() throws Exception {
        return super.authenticationManager();
    }
}
```

这里多配置了一个AuthenticationManager 认证管理器，配置它的目录是后续Oauth2支持password模式需要做认证时会用到认证管理器

配置到这里已经完成了一个简单的认证流程了，测试访问：http://localhost:3000/login 应该可以完成一个简单的认证流程
