# 28、Spring Boot 4 整合 Admin 完整教程
- 来源：https://ddkk.com/springboot/4-action/28.html
- 分类：Spring Boot 4 整合教程
- 分组：六、监控与运维
- 日期：2025-12-08
做微服务运维的时候,最头疼的就是应用监控和管理,应用跑得好不好、内存用多少、日志咋查看、配置咋修改,这些问题都让人头大;虽然Actuator提供了REST端点,但是用起来不方便,总不能每次都curl吧;后来听说Spring Boot Admin这玩意儿不错,提供了一个Web界面来管理和监控Spring Boot应用,健康检查、指标监控、日志查看、配置管理一应俱全,而且界面友好、功能强大;现在Spring Boot 4出来了,整合Spring Boot Admin更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Admin的。

其实Spring Boot Admin在Spring Boot里早就支持了,你只要加个`spring-boot-admin-starter-server`和`spring-boot-admin-starter-client`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置服务端、客户端、安全控制、服务发现这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Spring Boot Admin基础概念

### Spring Boot Admin是啥玩意儿

Spring Boot Admin是一个用于管理和监控Spring Boot应用的Web应用,它通过Actuator端点来收集应用信息;Spring Boot Admin的核心特性包括:

1. **应用注册**: 客户端应用自动注册到Admin服务器,支持HTTP注册和服务发现
2. **健康监控**: 实时显示应用的健康状态,包括各个组件的健康检查结果
3. **指标监控**: 展示应用的性能指标,包括JVM内存、线程、HTTP请求等
4. **日志查看**: 实时查看应用日志,支持日志级别动态调整
5. **环境信息**: 查看应用的配置属性、环境变量、系统属性等
6. **JMX管理**: 通过JMX管理应用,支持MBean操作
7. **通知告警**: 支持邮件、钉钉、Slack等多种通知方式

### Spring Boot Admin的核心概念

1. **Admin Server**: Admin服务器,负责收集和展示应用信息,提供Web界面
2. **Admin Client**: Admin客户端,被监控的应用,通过HTTP或服务发现注册到服务器
3. **应用注册**: 客户端向服务器注册的过程,包含应用的基本信息和Actuator端点地址
4. **实例(Instance)**: 一个应用实例,一个应用可以有多个实例(集群部署)
5. **服务发现**: 通过Eureka、Consul等服务发现机制自动发现应用
6. **通知(Notification)**: 当应用状态变化时发送的通知,比如应用下线、健康状态变化等

### Spring Boot Admin和Actuator的关系

- **Actuator**: 提供REST端点,暴露应用的健康、指标、日志等信息
- **Spring Boot Admin**: 基于Actuator端点,提供Web界面来可视化管理应用
- **关系**: Admin Server通过调用Client的Actuator端点来收集信息并展示

## 项目搭建和依赖配置

### 创建Admin Server项目

首先创建一个Admin Server项目,用于管理和监控其他应用:

```plaintext
spring-boot-admin-server/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── admin/
│   │   │               ├── AdminServerApplication.java    # 启动类
│   │   │               └── config/                        # 配置类目录
│   │   └── resources/
│   │       ├── application.yml                            # 配置文件
│   │       └── logback-spring.xml                         # 日志配置
│   └── test/
│       └── java/                                          # 测试代码目录
```

### Admin Server的pom.xml配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-admin-server</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Admin Server</name>
    <description>Spring Boot 4 Admin Server示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <spring-boot-admin.version>3.5.6</spring-boot-admin.version>  <!-- Spring Boot Admin版本 -->
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring Boot Admin Server Starter: Admin服务器 -->
        <dependency>
            <groupId>de.codecentric</groupId>
            <artifactId>spring-boot-admin-starter-server</artifactId>
            <version>${spring-boot-admin.version}</version>
        </dependency>
        <!-- Spring Boot Security: 安全控制(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包成可执行JAR -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### Admin Server的启动类

```java
package com.example.admin;
import de.codecentric.boot.admin.server.config.EnableAdminServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot Admin Server启动类
 * 
 * @author penglei
 */
@SpringBootApplication
@EnableAdminServer  // 启用Spring Boot Admin Server
public class AdminServerApplication {
    /**
     * 主方法,启动Admin Server
     * 
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(AdminServerApplication.class, args);
    }
}
```

### Admin Server的application.yml配置

```yaml
# 服务器配置
server:
  port: 8080  # Admin Server端口
# Spring应用配置
spring:
  application:
    name: spring-boot-admin-server  # 应用名称
# Spring Boot Admin Server配置
spring:
  boot:
    admin:
      # 上下文路径配置
      context-path: /admin  # Admin Server的上下文路径,默认/
      # 监控配置
      monitor:
        # 状态检查间隔
        status-interval: 10s  # 状态检查间隔,默认10秒
        # 信息更新间隔
        info-interval: 1m  # 信息更新间隔,默认1分钟
        # 生命周期检查间隔
        lifecycle-interval: 10s  # 生命周期检查间隔,默认10秒
        # 指标检查间隔
        metrics-interval: 1m  # 指标检查间隔,默认1分钟
      # 通知配置
      notify:
        # 提醒间隔(应用状态变化后多久提醒)
        reminder-period: 1h  # 提醒间隔,默认1小时
        # 状态变化通知
        status-changed:
          enabled: true  # 启用状态变化通知
        # 应用下线通知
        application-offline:
          enabled: true  # 启用应用下线通知
        # 应用上线通知
        application-online:
          enabled: true  # 启用应用上线通知
        # 应用注册通知
        application-registered:
          enabled: true  # 启用应用注册通知
        # 应用注销通知
        application-unregistered:
          enabled: true  # 启用应用注销通知
```

### 创建Admin Client项目

创建一个被监控的应用(Admin Client):

```plaintext
spring-boot-admin-client/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── client/
│   │   │               ├── ClientApplication.java        # 启动类
│   │   │               └── controller/                   # 控制器目录
│   │   └── resources/
│   │       ├── application.yml                           # 配置文件
│   │       └── logback-spring.xml                        # 日志配置
│   └── test/
│       └── java/                                          # 测试代码目录
```

### Admin Client的pom.xml配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <!-- 继承Spring Boot父POM,统一管理版本 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>  <!-- Spring Boot 4.0版本 -->
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-admin-client</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Admin Client</name>
    <description>Spring Boot 4 Admin Client示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <spring-boot-admin.version>3.5.6</spring-boot-admin.version>  <!-- Spring Boot Admin版本 -->
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Actuator Starter: Actuator监控和管理功能 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!-- Spring Boot Admin Client Starter: Admin客户端 -->
        <dependency>
            <groupId>de.codecentric</groupId>
            <artifactId>spring-boot-admin-starter-client</artifactId>
            <version>${spring-boot-admin.version}</version>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包成可执行JAR -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### Admin Client的启动类

```java
package com.example.client;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot Admin Client启动类
 * 
 * @author penglei
 */
@SpringBootApplication
public class ClientApplication {
    /**
     * 主方法,启动Admin Client
     * 
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(ClientApplication.class, args);
    }
}
```

### Admin Client的application.yml配置

```yaml
# 服务器配置
server:
  port: 8081  # Client应用端口
# Spring应用配置
spring:
  application:
    name: spring-boot-admin-client  # 应用名称,也是Admin Server中显示的名称
# Actuator配置
management:
  # 端点配置
  endpoints:
    # Web端点暴露配置
    web:
      # 暴露所有端点(生产环境建议只暴露必要的端点)
      exposure:
        include: "*"
      # 端点基础路径
      base-path: /actuator
  # 端点详细配置
  endpoint:
    # Health端点配置
    health:
      enabled: true
      show-details: always  # 显示详细信息
      show-components: always  # 显示组件详情
    # Info端点配置
    info:
      enabled: true
    # Metrics端点配置
    metrics:
      enabled: true
    # Loggers端点配置
    loggers:
      enabled: true
    # Logfile端点配置
    logfile:
      enabled: true  # 启用日志文件端点
# Spring Boot Admin Client配置
spring:
  boot:
    admin:
      client:
        # Admin Server地址
        url: http://localhost:8080  # Admin Server的URL
        # 或者使用数组配置多个Admin Server
        # urls: 
        #   - http://localhost:8080
        #   - http://localhost:8081
        # 实例配置
        instance:
          # 管理上下文路径
          management-url: http://localhost:8081/actuator  # 管理端点URL
          # 健康检查URL
          health-url: http://localhost:8081/actuator/health  # 健康检查URL
          # 服务URL
          service-url: http://localhost:8081  # 服务URL
          # 服务主机名
          prefer-ip: false  # 是否优先使用IP地址
          # 元数据
          metadata:
            user.name: admin  # 用于访问受保护端点的用户名
            user.password: admin123  # 用于访问受保护端点的密码
            startup: ${random.int}  # 启动标识,用于触发信息更新
        # 注册配置
        registration:
          # 注册间隔
          period: 10s  # 注册间隔,默认10秒
          # 连接超时
          connect-timeout: 5s  # 连接超时,默认5秒
          # 读取超时
          read-timeout: 5s  # 读取超时,默认5秒
        # 用户名和密码(用于注册到受保护的Admin Server)
        username: admin  # 注册用户名
        password: admin123  # 注册密码
# 日志配置(用于logfile端点)
logging:
  file:
    name: logs/application.log  # 日志文件路径
    # 或者使用path配置日志目录
    # path: logs/
  pattern:
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"  # 日志格式
```

## 安全配置

### Admin Server安全配置

为了保护Admin Server,需要配置Spring Security:

```java
package com.example.admin.config;
import de.codecentric.boot.admin.server.config.AdminServerProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import java.util.UUID;
/**
 * Spring Security配置类
 * 用于保护Admin Server
 * 
 * @author penglei
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final AdminServerProperties adminServer;
    /**
     * 构造函数,注入AdminServerProperties
     * 
     * @param adminServer AdminServerProperties对象
     */
    public SecurityConfig(AdminServerProperties adminServer) {
        this.adminServer = adminServer;
    }
    /**
     * 配置安全过滤器链
     * 
     * @param http HttpSecurity对象
     * @return SecurityFilterChain对象
     * @throws Exception 配置异常
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // 配置认证成功处理器
        SavedRequestAwareAuthenticationSuccessHandler successHandler = 
            new SavedRequestAwareAuthenticationSuccessHandler();
        successHandler.setTargetUrlParameter("redirectTo");
        successHandler.setDefaultTargetUrl(this.adminServer.path("/"));
        // 配置授权规则
        http.authorizeHttpRequests(auth -> auth
            // 允许访问静态资源
            .requestMatchers(this.adminServer.path("/assets/**")).permitAll()
            // 允许访问登录页面
            .requestMatchers(this.adminServer.path("/login")).permitAll()
            // 允许访问Actuator端点(用于健康检查)
            .requestMatchers(this.adminServer.path("/actuator/info")).permitAll()
            .requestMatchers(this.adminServer.path("/actuator/health")).permitAll()
            // 其他请求需要认证
            .anyRequest().authenticated()
        )
        // 配置表单登录
        .formLogin(formLogin -> formLogin
            .loginPage(this.adminServer.path("/login"))
            .successHandler(successHandler)
        )
        // 配置登出
        .logout(logout -> logout
            .logoutUrl(this.adminServer.path("/logout"))
        )
        // 配置HTTP Basic认证
        .httpBasic(httpBasic -> {});
        // 配置CSRF保护
        http.csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .ignoringRequestMatchers(
                // 忽略客户端注册端点
                this.adminServer.path("/instances"),
                // 忽略实例注销端点
                this.adminServer.path("/instances/*"),
                // 忽略Actuator端点
                this.adminServer.path("/actuator/**")
            )
        );
        // 配置Remember Me
        http.rememberMe(rememberMe -> rememberMe
            .key(UUID.randomUUID().toString())
            .tokenValiditySeconds(1209600)  // 14天
        );
        return http.build();
    }
    /**
     * 配置用户详情服务
     * 
     * @param passwordEncoder 密码编码器
     * @return UserDetailsService对象
     */
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        // 创建管理员用户
        UserDetails admin = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .roles("ADMIN", "USER")
                .build();
        // 创建普通用户
        UserDetails user = User.builder()
                .username("user")
                .password(passwordEncoder.encode("user123"))
                .roles("USER")
                .build();
        // 返回内存用户详情管理器
        return new InMemoryUserDetailsManager(admin, user);
    }
    /**
     * 配置密码编码器
     * 
     * @return PasswordEncoder对象
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### Admin Client安全配置(可选)

如果Client的Actuator端点需要保护,可以配置安全:

```java
package com.example.client.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
/**
 * Spring Security配置类
 * 用于保护Client的Actuator端点
 * 
 * @author penglei
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    /**
     * 配置安全过滤器链
     * 
     * @param http HttpSecurity对象
     * @return SecurityFilterChain对象
     * @throws Exception 配置异常
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            // 允许访问业务接口
            .requestMatchers("/api/**").permitAll()
            // Actuator端点需要认证
            .requestMatchers("/actuator/**").authenticated()
            // 其他请求需要认证
            .anyRequest().authenticated()
        )
        // HTTP Basic认证
        .httpBasic(httpBasic -> {})
        // 禁用CSRF保护(仅用于非浏览器客户端)
        .csrf(csrf -> csrf.disable());
        return http.build();
    }
    /**
     * 配置用户详情服务
     * 
     * @param passwordEncoder 密码编码器
     * @return UserDetailsService对象
     */
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        // 创建用户(用户名和密码要与Client配置中的metadata一致)
        UserDetails user = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .roles("USER")
                .build();
        return new InMemoryUserDetailsManager(user);
    }
    /**
     * 配置密码编码器
     * 
     * @return PasswordEncoder对象
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

## 测试Controller

创建一个简单的Controller用于测试:

```java
package com.example.client.controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;
/**
 * 测试Controller,用于验证应用是否正常运行
 * 
 * @author penglei
 */
@RestController
@RequestMapping("/api")
public class TestController {
    /**
     * 测试接口,返回简单的JSON响应
     * 
     * @return 包含消息的Map对象
     */
    @GetMapping("/test")
    public Map<String, Object> test() {
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Hello, Spring Boot Admin Client!");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
}
```

## 应用信息配置

在Client的`application.yml`中配置应用信息:

```yaml
# 应用信息配置(用于info端点)
info:
  app:
    name: ${spring.application.name}
    version: 1.0.0
    description: Spring Boot Admin Client示例应用
  java:
    version: ${java.version}
  build:
    artifact: ${project.artifactId}
    name: ${project.name}
    version: ${project.version}
```

## 访问Admin Server

启动Admin Server和Client后:

1. 访问Admin Server: http://localhost:8080/admin
2. 使用配置的用户名和密码登录(默认: admin/admin123)
3. 在应用列表中可以看到注册的Client应用
4. 点击应用名称可以查看详细信息:

- **Details**: 应用详细信息
- **Metrics**: 性能指标
- **Environment**: 环境变量和配置属性
- **Loggers**: 日志级别管理
- **Logfile**: 日志文件查看
- **Threads**: 线程信息
- **Heap Dump**: 堆转储
- **JMX**: JMX管理

## 服务发现集成

### 集成Eureka

如果使用Eureka作为服务发现,可以自动发现应用:

#### Admin Server配置

```yaml
spring:
  boot:
    admin:
      discovery:
        # 启用服务发现
        enabled: true
        # 服务发现顺序(优先级)
        order: 0
        # 服务发现配置
        ignored-services:
          - spring-boot-admin-server  # 忽略Admin Server自身
```

#### 添加Eureka依赖

在Admin Server的`pom.xml`中添加:

```xml
<!-- Spring Cloud Eureka Client -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

#### Client配置

Client需要注册到Eureka,并在metadata中配置认证信息:

```yaml
eureka:
  instance:
    metadata-map:
      user.name: admin  # 用于访问受保护端点的用户名
      user.password: admin123  # 用于访问受保护端点的密码
      startup: ${random.int}  # 启动标识
```

### 集成Consul

如果使用Consul作为服务发现:

#### Admin Server配置

```yaml
spring:
  boot:
    admin:
      discovery:
        enabled: true
        ignored-services:
          - spring-boot-admin-server
```

#### 添加Consul依赖

```xml
<!-- Spring Cloud Consul Discovery -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-consul-discovery</artifactId>
</dependency>
```

#### Client配置

```yaml
spring:
  cloud:
    consul:
      discovery:
        metadata:
          user-name: admin  # Consul使用短横线而不是点
          user-password: admin123
          startup: ${random.int}
```

## 通知配置

### 邮件通知

配置邮件通知,当应用状态变化时发送邮件:

```yaml
spring:
  boot:
    admin:
      notify:
        # 邮件通知配置
        mail:
          enabled: true  # 启用邮件通知
          to: admin@example.com  # 收件人
          from: admin-server@example.com  # 发件人
          cc: ops@example.com  # 抄送
          subject: "Spring Boot Admin Alert"  # 邮件主题
```

#### 添加邮件依赖

```xml
<!-- Spring Boot Mail Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

#### 配置邮件服务器

```yaml
spring:
  mail:
    host: smtp.example.com  # SMTP服务器地址
    port: 587  # SMTP端口
    username: your-email@example.com  # 邮箱用户名
    password: your-password  # 邮箱密码
    properties:
      mail:
        smtp:
          auth: true  # 启用认证
          starttls:
            enable: true  # 启用TLS
```

### 自定义通知

可以实现自定义通知器:

```java
package com.example.admin.notify;
import de.codecentric.boot.admin.server.domain.entities.Instance;
import de.codecentric.boot.admin.server.domain.entities.InstanceRepository;
import de.codecentric.boot.admin.server.domain.events.InstanceEvent;
import de.codecentric.boot.admin.server.notify.AbstractStatusChangeNotifier;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
/**
 * 自定义通知器示例
 * 
 * @author penglei
 */
@Component
public class CustomNotifier extends AbstractStatusChangeNotifier {
    /**
     * 构造函数
     * 
     * @param repository InstanceRepository对象
     */
    public CustomNotifier(InstanceRepository repository) {
        super(repository);
    }
    /**
     * 处理状态变化事件
     * 
     * @param event 实例事件
     * @param instance 应用实例
     * @return Mono<Void>
     */
    @Override
    protected Mono<Void> doNotify(InstanceEvent event, Instance instance) {
        // 实现自定义通知逻辑
        // 比如发送钉钉消息、Slack消息等
        return Mono.fromRunnable(() -> {
            System.out.println("Application " + instance.getRegistration().getName() 
                + " status changed: " + event.getType());
        });
    }
}
```

## 生产环境最佳实践

### 1. 安全配置

- 启用Spring Security保护Admin Server
- 使用HTTPS加密通信
- 配置强密码和角色控制
- 限制Admin Server访问范围

### 2. 端点暴露

- 生产环境只暴露必要的Actuator端点
- 使用安全配置保护敏感端点
- 配置端点访问权限

### 3. 性能优化

- 合理设置监控间隔,避免过于频繁
- 使用服务发现自动发现应用
- 配置通知阈值,避免通知风暴

### 4. 高可用配置

- Admin Server可以部署多个实例
- 使用Hazelcast实现集群复制
- 配置持久化存储保持状态

### 5. 监控告警

- 配置邮件、钉钉等通知渠道
- 设置合理的告警阈值
- 监控Admin Server自身状态

## 总结

Spring Boot 4整合Admin非常简单,只需要添加`spring-boot-admin-starter-server`和`spring-boot-admin-starter-client`依赖就能使用;Spring Boot Admin提供了友好的Web界面来管理和监控Spring Boot应用,包括健康检查、指标监控、日志查看、配置管理等功能;通过配置安全、服务发现、通知等功能,可以构建一个完善的监控和管理体系;在生产环境中,要注意安全配置、性能优化和高可用配置,确保监控系统的稳定性和可靠性。

好了,今天就聊到这里,兄弟们有啥问题可以留言,鹏磊看到会及时回复的。
