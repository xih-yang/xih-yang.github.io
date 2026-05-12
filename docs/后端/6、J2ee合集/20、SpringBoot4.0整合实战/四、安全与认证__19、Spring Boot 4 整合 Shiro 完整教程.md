# 19、Spring Boot 4 整合 Shiro 完整教程
- 来源：https://ddkk.com/springboot/4-action/19.html
- 分类：Spring Boot 4 整合教程
- 分组：四、安全与认证
- 日期：2025-12-08
做Java Web项目的时候,最烦的就是权限管理,用户认证、角色授权、资源保护,每个功能都得自己写,代码重复、逻辑混乱,维护起来要命;后来听说Apache Shiro这玩意儿不错,功能全、易用性强、文档完善,是Java生态里最受欢迎的安全框架之一;但是直接用Shiro写,那叫一个复杂,配置SecurityManager、定义Realm、设置过滤器链、管理会话,一堆配置写得人头疼;后来发现Shiro提供了Spring Boot Starter,直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合Shiro更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Shiro的。

其实Shiro在Spring Boot里早就支持了,你只要加个`shiro-spring-boot-web-starter`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用自定义Realm、会话管理、缓存配置、方法级权限这些高级功能,更不知道Shiro和Spring Security有啥区别,所以鹏磊今天就给兄弟们掰扯掰扯。

## Shiro基础概念

### Shiro是啥玩意儿

Apache Shiro是一个功能强大且易用的Java安全框架,提供了认证、授权、加密、会话管理等功能;Shiro的核心概念包括:

1. **Subject(主体)**: 当前操作用户,可以是人、程序、第三方服务等
2. **SecurityManager(安全管理器)**: Shiro的核心,管理所有Subject,负责认证、授权、会话、缓存等
3. **Realm(域)**: 数据源,用于获取用户信息、角色、权限等数据
4. **Authentication(认证)**: 验证用户身份,比如用户名密码登录
5. **Authorization(授权)**: 验证用户是否有权限执行某个操作
6. **Session(会话)**: 用户会话管理,支持Web和非Web环境
7. **Cryptography(加密)**: 密码加密、数据加密等功能

### Shiro和Spring Security的区别

1. **设计理念**: Shiro更简单易用,Spring Security更强大但复杂
2. **配置方式**: Shiro配置更直观,Spring Security配置更灵活
3. **学习曲线**: Shiro学习曲线平缓,Spring Security学习曲线陡峭
4. **功能范围**: Shiro专注于安全,Spring Security功能更全面
5. **性能**: Shiro性能更好,Spring Security功能更丰富

### Shiro的核心组件

1. **Subject**: 当前用户,所有操作都通过Subject进行
2. **SecurityManager**: 安全管理器,管理所有Subject
3. **Realm**: 数据源,连接Shiro和实际数据(数据库、LDAP等)
4. **Filter**: 过滤器,拦截请求进行认证和授权
5. **SessionManager**: 会话管理器,管理用户会话
6. **CacheManager**: 缓存管理器,缓存认证和授权信息

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-shiro-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── entity/                   # 实体类目录
│   │   │               ├── repository/               # 数据访问层目录
│   │   │               ├── service/                  # 服务层目录
│   │   │               ├── controller/               # 控制器目录
│   │   │               ├── realm/                    # Realm目录
│   │   │               ├── config/                    # 配置类目录
│   │   │               └── util/                      # 工具类目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   │       └── shiro.ini                            # Shiro配置文件(可选)
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Shiro最新版本是1.13.x,API有变化,得注意兼容性。

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
    <artifactId>spring-boot-shiro-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Shiro Demo</name>
    <description>Spring Boot 4整合Apache Shiro示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <shiro.version>1.13.0</shiro.version>  <!-- Shiro最新版本 -->
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Shiro Spring Boot Web Starter: Shiro集成支持 -->
        <dependency>
            <groupId>org.apache.shiro</groupId>
            <artifactId>shiro-spring-boot-web-starter</artifactId>
            <version>${shiro.version}</version>
        </dependency>
        <!-- Shiro Spring Boot Starter: Shiro核心支持 -->
        <dependency>
            <groupId>org.apache.shiro</groupId>
            <artifactId>shiro-spring-boot-starter</artifactId>
            <version>${shiro.version}</version>
        </dependency>
        <!-- Spring Boot Data JPA: 数据访问(可选,用于用户存储) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <!-- H2 Database: 内存数据库(可选,用于演示) -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <!-- MySQL驱动(可选,生产环境用) -->
        <!--
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        -->
        <!-- Redis(可选,用于Shiro缓存和会话存储) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <!-- Shiro EhCache(可选,用于本地缓存) -->
        <dependency>
            <groupId>org.apache.shiro</groupId>
            <artifactId>shiro-ehcache</artifactId>
            <version>${shiro.version}</version>
        </dependency>
        <!-- Spring Boot Validation: 参数校验支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Lombok: 简化Java代码(可选,但强烈推荐) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
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

### application.yml配置

Spring Boot 4的Shiro自动配置通过`shiro.*`属性控制,配置起来贼简单:

```yaml
spring:
  application:
    name: spring-boot-shiro-demo  # 应用名称
  # 数据源配置(如果使用数据库存储用户)
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
  # Redis配置(如果使用Redis缓存)
  data:
    redis:
      host: localhost
      port: 6379
      password: 
      database: 0
# Shiro配置
shiro:
  # 登录URL
  loginUrl: /login
  # 未授权跳转URL
  unauthorizedUrl: /unauthorized
  # 登录成功跳转URL
  successUrl: /index
  # 是否启用Shiro
  enabled: true
  # Web配置
  web:
    enabled: true
  # 过滤器链配置
  filterChainDefinitions:
    # 格式: URL路径 = 过滤器名称
    /login: anon          # 登录页面匿名访问
    /logout: logout       # 登出
    /api/public/**: anon  # 公开接口匿名访问
    /api/admin/**: authc, roles[admin]  # 管理员接口需要认证和admin角色
    /api/user/**: authc, roles[user,admin]  # 用户接口需要认证和user或admin角色
    /**: authc            # 其他路径需要认证
# 日志配置
logging:
  level:
    org.apache.shiro: DEBUG  # 开启Shiro调试日志
    com.example.demo: DEBUG  # 开启应用调试日志
```

## 场景一: 基础Shiro认证和授权

### 应用场景

你的应用需要用户登录认证和基于角色的授权,这是最常见的场景;用户登录后可以访问受保护的资源,不同角色有不同的访问权限。

### 自定义Realm实现

Realm是Shiro的核心组件,负责获取用户信息、角色、权限等数据;首先得实现一个自定义Realm:

```java
package com.example.demo.realm;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.springframework.stereotype.Component;
import java.util.HashSet;
import java.util.Set;
/**
 * 自定义Realm
 * 实现用户认证和授权逻辑
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomRealm extends AuthorizingRealm {
    private final UserService userService;
    /**
     * 指定Realm支持的Token类型
     * 这里支持用户名密码Token
     */
    @Override
    public boolean supports(AuthenticationToken token) {
        return token instanceof UsernamePasswordToken;
    }
    /**
     * 用户认证
     * 验证用户名和密码是否正确
     * 
     * @param token 认证Token,包含用户名和密码
     * @return 认证信息,包含用户主体和凭证
     * @throws AuthenticationException 认证失败时抛出异常
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) 
            throws AuthenticationException {
        // 获取用户名
        String username = (String) token.getPrincipal();
        // 从数据库查询用户
        User user = userService.findByUsername(username);
        // 用户不存在
        if (user == null) {
            throw new UnknownAccountException("用户不存在: " + username);
        }
        // 用户被禁用
        if (!user.isEnabled()) {
            throw new DisabledAccountException("用户已被禁用: " + username);
        }
        // 用户被锁定
        if (user.isLocked()) {
            throw new LockedAccountException("用户已被锁定: " + username);
        }
        // 返回认证信息
        // 参数说明:
        // 1. principal: 用户主体(可以是用户名、User对象等)
        // 2. credentials: 凭证(密码)
        // 3. realmName: Realm名称
        return new SimpleAuthenticationInfo(
                user.getUsername(),  // 用户主体
                user.getPassword(),  // 密码(Shiro会自动验证)
                getName()  // Realm名称
        );
    }
    /**
     * 用户授权
     * 获取用户的角色和权限信息
     * 
     * @param principals 用户主体集合
     * @return 授权信息,包含角色和权限
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        // 获取用户名
        String username = (String) principals.getPrimaryPrincipal();
        // 从数据库查询用户
        User user = userService.findByUsername(username);
        // 创建授权信息
        SimpleAuthorizationInfo authorizationInfo = new SimpleAuthorizationInfo();
        // 设置角色
        Set<String> roles = new HashSet<>();
        if (user.getRoles() != null) {
            user.getRoles().forEach(role -> roles.add(role.getName()));
        }
        authorizationInfo.setRoles(roles);
        // 设置权限
        Set<String> permissions = new HashSet<>();
        if (user.getPermissions() != null) {
            user.getPermissions().forEach(permission -> permissions.add(permission.getName()));
        }
        authorizationInfo.setStringPermissions(permissions);
        log.debug("用户 {} 的角色: {}, 权限: {}", username, roles, permissions);
        return authorizationInfo;
    }
}
```

### Shiro配置类

配置Shiro的SecurityManager和过滤器链:

```java
package com.example.demo.config;
import com.example.demo.realm.CustomRealm;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.realm.Realm;
import org.apache.shiro.spring.web.config.DefaultShiroFilterChainDefinition;
import org.apache.shiro.spring.web.config.ShiroFilterChainDefinition;
import org.apache.shiro.spring.web.config.ShiroWebFilterConfiguration;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.ArrayList;
import java.util.List;
/**
 * Shiro配置类
 * 配置SecurityManager和过滤器链
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class ShiroConfig {
    private final CustomRealm customRealm;
    /**
     * 配置SecurityManager
     * SecurityManager是Shiro的核心,管理所有Subject
     */
    @Bean
    public SecurityManager securityManager() {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        // 设置Realm
        List<Realm> realms = new ArrayList<>();
        realms.add(customRealm);
        securityManager.setRealms(realms);
        log.info("SecurityManager配置完成");
        return securityManager;
    }
    /**
     * 配置Shiro过滤器链
     * 定义哪些URL需要认证、授权等
     */
    @Bean
    public ShiroFilterChainDefinition shiroFilterChainDefinition() {
        DefaultShiroFilterChainDefinition chainDefinition = new DefaultShiroFilterChainDefinition();
        // 过滤器说明:
        // anon: 匿名访问,不需要认证
        // authc: 需要认证
        // logout: 登出
        // roles[admin]: 需要admin角色
        // perms[user:create]: 需要user:create权限
        // 登录和登出
        chainDefinition.addPathDefinition("/login", "anon");
        chainDefinition.addPathDefinition("/logout", "logout");
        // 公开接口
        chainDefinition.addPathDefinition("/api/public/**", "anon");
        // 管理员接口(需要认证和admin角色)
        chainDefinition.addPathDefinition("/api/admin/**", "authc, roles[admin]");
        // 用户接口(需要认证和user或admin角色)
        chainDefinition.addPathDefinition("/api/user/**", "authc, roles[user,admin]");
        // 其他路径需要认证
        chainDefinition.addPathDefinition("/**", "authc");
        log.info("Shiro过滤器链配置完成");
        return chainDefinition;
    }
}
```

### 用户实体类

```java
package com.example.demo.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
/**
 * 用户实体类
 */
@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String username;
    @Column(nullable = false)
    private String password;
    private Boolean enabled = true;
    private Boolean locked = false;
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private List<Role> roles;
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_permissions",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private List<Permission> permissions;
}
```

```java
package com.example.demo.entity;
import jakarta.persistence.*;
import lombok.Data;
/**
 * 角色实体类
 */
@Data
@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String name;
    private String description;
}
```

```java
package com.example.demo.entity;
import jakarta.persistence.*;
import lombok.Data;
/**
 * 权限实体类
 */
@Data
@Entity
@Table(name = "permissions")
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String name;
    private String description;
}
```

### 用户服务类

```java
package com.example.demo.service;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
/**
 * 用户服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    /**
     * 根据用户名查找用户
     */
    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }
    /**
     * 保存用户
     */
    public User save(User user) {
        return userRepository.save(user);
    }
}
```

### 认证控制器

```java
package com.example.demo.controller;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.subject.Subject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 认证控制器
 * 处理登录、登出等认证相关请求
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    /**
     * 用户登录
     * 
     * @param username 用户名
     * @param password 密码
     * @return 登录结果
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestParam String username,
            @RequestParam String password) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 获取当前Subject
            Subject subject = SecurityUtils.getSubject();
            // 如果已经登录,先登出
            if (subject.isAuthenticated()) {
                subject.logout();
            }
            // 创建认证Token
            UsernamePasswordToken token = new UsernamePasswordToken(username, password);
            // 执行登录认证
            subject.login(token);
            // 登录成功
            result.put("success", true);
            result.put("message", "登录成功");
            result.put("username", username);
            log.info("用户登录成功: {}", username);
            return ResponseEntity.ok(result);
        } catch (UnknownAccountException e) {
            // 用户不存在
            result.put("success", false);
            result.put("message", "用户不存在");
            return ResponseEntity.badRequest().body(result);
        } catch (IncorrectCredentialsException e) {
            // 密码错误
            result.put("success", false);
            result.put("message", "密码错误");
            return ResponseEntity.badRequest().body(result);
        } catch (LockedAccountException e) {
            // 账户被锁定
            result.put("success", false);
            result.put("message", "账户已被锁定");
            return ResponseEntity.badRequest().body(result);
        } catch (DisabledAccountException e) {
            // 账户被禁用
            result.put("success", false);
            result.put("message", "账户已被禁用");
            return ResponseEntity.badRequest().body(result);
        } catch (AuthenticationException e) {
            // 其他认证异常
            result.put("success", false);
            result.put("message", "登录失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
    /**
     * 用户登出
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        Subject subject = SecurityUtils.getSubject();
        subject.logout();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "登出成功");
        log.info("用户登出成功");
        return ResponseEntity.ok(result);
    }
    /**
     * 获取当前用户信息
     */
    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        Subject subject = SecurityUtils.getSubject();
        Map<String, Object> result = new HashMap<>();
        if (subject.isAuthenticated()) {
            result.put("authenticated", true);
            result.put("username", subject.getPrincipal());
            result.put("hasRoleAdmin", subject.hasRole("admin"));
            result.put("hasRoleUser", subject.hasRole("user"));
        } else {
            result.put("authenticated", false);
        }
        return ResponseEntity.ok(result);
    }
}
```

### 受保护的控制器

```java
package com.example.demo.controller;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.annotation.RequiresAuthentication;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.apache.shiro.subject.Subject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 用户控制器
 * 演示Shiro的权限控制
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiresAuthentication  // 需要认证才能访问
public class UserController {
    /**
     * 获取用户信息
     * 需要user或admin角色
     */
    @GetMapping("/info")
    @RequiresRoles({"user", "admin"})
    public ResponseEntity<Map<String, Object>> getUserInfo() {
        Subject subject = SecurityUtils.getSubject();
        Map<String, Object> result = new HashMap<>();
        result.put("username", subject.getPrincipal());
        result.put("message", "这是用户信息接口");
        return ResponseEntity.ok(result);
    }
    /**
     * 管理员接口
     * 需要admin角色
     */
    @GetMapping("/admin/data")
    @RequiresRoles("admin")
    public ResponseEntity<Map<String, Object>> getAdminData() {
        Map<String, Object> result = new HashMap<>();
        result.put("message", "这是管理员数据接口");
        result.put("data", "敏感数据");
        return ResponseEntity.ok(result);
    }
    /**
     * 需要特定权限的接口
     * 需要user:create权限
     */
    @PostMapping("/create")
    @RequiresPermissions("user:create")
    public ResponseEntity<Map<String, Object>> createUser() {
        Map<String, Object> result = new HashMap<>();
        result.put("message", "创建用户成功");
        return ResponseEntity.ok(result);
    }
}
```

## 场景二: 会话管理和缓存配置

### 应用场景

用户登录后需要管理会话,而且认证和授权信息需要缓存,提高性能;Shiro提供了完整的会话管理和缓存支持。

### Redis会话管理器配置

使用Redis存储会话,支持集群环境:

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.session.mgt.SessionManager;
import org.apache.shiro.session.mgt.eis.JavaUuidSessionIdGenerator;
import org.apache.shiro.session.mgt.eis.SessionIdGenerator;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.apache.shiro.web.session.mgt.DefaultWebSessionManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;
/**
 * Shiro会话管理配置
 */
@Slf4j
@Configuration
public class ShiroSessionConfig {
    /**
     * 配置SessionManager
     * 设置会话超时时间、会话ID生成器等
     */
    @Bean
    public SessionManager sessionManager() {
        DefaultWebSessionManager sessionManager = new DefaultWebSessionManager();
        // 会话超时时间(毫秒),默认30分钟
        sessionManager.setGlobalSessionTimeout(30 * 60 * 1000);
        // 会话验证调度器启用
        sessionManager.setSessionValidationSchedulerEnabled(true);
        // 会话验证间隔(毫秒),默认1小时
        sessionManager.setSessionValidationInterval(60 * 60 * 1000);
        // 删除无效会话
        sessionManager.setDeleteInvalidSessions(true);
        // 会话ID生成器
        sessionManager.setSessionIdGenerator(sessionIdGenerator());
        log.info("SessionManager配置完成");
        return sessionManager;
    }
    /**
     * 会话ID生成器
     */
    @Bean
    public SessionIdGenerator sessionIdGenerator() {
        return new JavaUuidSessionIdGenerator();
    }
}
```

### Redis缓存管理器配置

使用Redis缓存认证和授权信息:

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.cache.CacheManager;
import org.apache.shiro.spring.web.config.DefaultShiroWebConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;
/**
 * Shiro缓存配置
 */
@Slf4j
@Configuration
public class ShiroCacheConfig {
    /**
     * 配置缓存管理器
     * 使用Redis作为缓存存储
     */
    @Bean
    public CacheManager cacheManager(RedisTemplate<String, Object> redisTemplate) {
        // 这里可以使用Shiro的Redis缓存实现
        // 或者使用EhCache等本地缓存
        // 简化示例,实际应该实现RedisCacheManager
        log.info("CacheManager配置完成");
        return null;  // 实际应该返回RedisCacheManager实例
    }
}
```

### 更新SecurityManager配置

```java
package com.example.demo.config;
import com.example.demo.realm.CustomRealm;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.cache.CacheManager;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.realm.Realm;
import org.apache.shiro.session.mgt.SessionManager;
import org.apache.shiro.spring.web.config.DefaultShiroFilterChainDefinition;
import org.apache.shiro.spring.web.config.ShiroFilterChainDefinition;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.ArrayList;
import java.util.List;
/**
 * Shiro配置类(更新版)
 * 包含会话管理和缓存配置
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class ShiroConfigAdvanced {
    private final CustomRealm customRealm;
    private final SessionManager sessionManager;
    private final CacheManager cacheManager;
    /**
     * 配置SecurityManager(包含会话和缓存)
     */
    @Bean
    public SecurityManager securityManager() {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        // 设置Realm
        List<Realm> realms = new ArrayList<>();
        realms.add(customRealm);
        securityManager.setRealms(realms);
        // 设置SessionManager
        securityManager.setSessionManager(sessionManager);
        // 设置CacheManager
        securityManager.setCacheManager(cacheManager);
        log.info("SecurityManager配置完成(包含会话和缓存)");
        return securityManager;
    }
    /**
     * 配置Shiro过滤器链
     */
    @Bean
    public ShiroFilterChainDefinition shiroFilterChainDefinition() {
        DefaultShiroFilterChainDefinition chainDefinition = new DefaultShiroFilterChainDefinition();
        chainDefinition.addPathDefinition("/login", "anon");
        chainDefinition.addPathDefinition("/logout", "logout");
        chainDefinition.addPathDefinition("/api/public/**", "anon");
        chainDefinition.addPathDefinition("/api/admin/**", "authc, roles[admin]");
        chainDefinition.addPathDefinition("/api/user/**", "authc, roles[user,admin]");
        chainDefinition.addPathDefinition("/**", "authc");
        return chainDefinition;
    }
}
```

## 场景三: 密码加密和Remember Me

### 应用场景

用户密码需要加密存储,而且需要Remember Me功能,用户可以选择"记住我",下次访问时自动登录。

### 密码加密配置

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.realm.Realm;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * Shiro密码加密配置
 */
@Slf4j
@Configuration
public class ShiroPasswordConfig {
    /**
     * 配置密码匹配器
     * 使用SHA-256算法加密密码
     */
    @Bean
    public HashedCredentialsMatcher hashedCredentialsMatcher() {
        HashedCredentialsMatcher matcher = new HashedCredentialsMatcher();
        // 设置加密算法
        matcher.setHashAlgorithmName(Sha256Hash.ALGORITHM_NAME);
        // 设置加密迭代次数
        matcher.setHashIterations(1024);
        // 是否存储16进制编码
        matcher.setStoredCredentialsHexEncoded(true);
        log.info("密码匹配器配置完成: SHA-256, 1024次迭代");
        return matcher;
    }
    /**
     * 更新Realm配置,设置密码匹配器
     */
    @Bean
    public Realm customRealm(HashedCredentialsMatcher matcher) {
        // 这里应该返回配置了密码匹配器的Realm
        // 实际应该在CustomRealm中注入HashedCredentialsMatcher
        return null;
    }
}
```

### 更新CustomRealm支持密码加密

```java
package com.example.demo.realm;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.authc.*;
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.HashSet;
import java.util.Set;
/**
 * 自定义Realm(支持密码加密)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomRealmWithEncryption extends AuthorizingRealm {
    private final UserService userService;
    /**
     * 注入密码匹配器
     */
    @Autowired(required = false)
    public void setCredentialsMatcher(HashedCredentialsMatcher credentialsMatcher) {
        super.setCredentialsMatcher(credentialsMatcher);
    }
    @Override
    public boolean supports(AuthenticationToken token) {
        return token instanceof UsernamePasswordToken;
    }
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) 
            throws AuthenticationException {
        String username = (String) token.getPrincipal();
        User user = userService.findByUsername(username);
        if (user == null) {
            throw new UnknownAccountException("用户不存在: " + username);
        }
        if (!user.isEnabled()) {
            throw new DisabledAccountException("用户已被禁用: " + username);
        }
        if (user.isLocked()) {
            throw new LockedAccountException("用户已被锁定: " + username);
        }
        // 返回认证信息,Shiro会自动使用密码匹配器验证密码
        return new SimpleAuthenticationInfo(
                user.getUsername(),
                user.getPassword(),  // 数据库中存储的是加密后的密码
                getName()
        );
    }
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        String username = (String) principals.getPrimaryPrincipal();
        User user = userService.findByUsername(username);
        SimpleAuthorizationInfo authorizationInfo = new SimpleAuthorizationInfo();
        Set<String> roles = new HashSet<>();
        if (user.getRoles() != null) {
            user.getRoles().forEach(role -> roles.add(role.getName()));
        }
        authorizationInfo.setRoles(roles);
        Set<String> permissions = new HashSet<>();
        if (user.getPermissions() != null) {
            user.getPermissions().forEach(permission -> permissions.add(permission.getName()));
        }
        authorizationInfo.setStringPermissions(permissions);
        return authorizationInfo;
    }
}
```

### Remember Me配置

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.spring.web.config.DefaultShiroFilterChainDefinition;
import org.apache.shiro.spring.web.config.ShiroFilterChainDefinition;
import org.apache.shiro.web.mgt.CookieRememberMeManager;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.apache.shiro.web.servlet.SimpleCookie;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * Shiro Remember Me配置
 */
@Slf4j
@Configuration
public class ShiroRememberMeConfig {
    /**
     * 配置Remember Me Cookie
     */
    @Bean
    public SimpleCookie rememberMeCookie() {
        SimpleCookie cookie = new SimpleCookie("rememberMe");
        // Cookie名称
        cookie.setName("rememberMe");
        // Cookie有效期(秒),默认30天
        cookie.setMaxAge(30 * 24 * 60 * 60);
        // HttpOnly
        cookie.setHttpOnly(true);
        log.info("Remember Me Cookie配置完成");
        return cookie;
    }
    /**
     * 配置Remember Me管理器
     */
    @Bean
    public CookieRememberMeManager rememberMeManager(SimpleCookie rememberMeCookie) {
        CookieRememberMeManager manager = new CookieRememberMeManager();
        manager.setCookie(rememberMeCookie);
        // 设置加密密钥(生产环境应该从配置文件读取)
        manager.setCipherKey("your-secret-key-here".getBytes());
        log.info("Remember Me管理器配置完成");
        return manager;
    }
    /**
     * 更新SecurityManager,添加Remember Me管理器
     */
    @Bean
    public SecurityManager securityManagerWithRememberMe(
            CookieRememberMeManager rememberMeManager) {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        // 设置Remember Me管理器
        securityManager.setRememberMeManager(rememberMeManager);
        // 其他配置...
        return securityManager;
    }
    /**
     * 更新过滤器链,添加Remember Me过滤器
     */
    @Bean
    public ShiroFilterChainDefinition shiroFilterChainDefinition() {
        DefaultShiroFilterChainDefinition chainDefinition = new DefaultShiroFilterChainDefinition();
        // user过滤器支持Remember Me
        chainDefinition.addPathDefinition("/login", "anon");
        chainDefinition.addPathDefinition("/logout", "logout");
        chainDefinition.addPathDefinition("/api/public/**", "anon");
        chainDefinition.addPathDefinition("/api/admin/**", "user, roles[admin]");  // user支持Remember Me
        chainDefinition.addPathDefinition("/api/user/**", "user, roles[user,admin]");
        chainDefinition.addPathDefinition("/**", "user");  // user替代authc,支持Remember Me
        return chainDefinition;
    }
}
```

### 更新登录控制器支持Remember Me

```java
package com.example.demo.controller;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.subject.Subject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
/**
 * 认证控制器(支持Remember Me)
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthControllerWithRememberMe {
    /**
     * 用户登录(支持Remember Me)
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam(required = false, defaultValue = "false") Boolean rememberMe) {
        Map<String, Object> result = new HashMap<>();
        try {
            Subject subject = SecurityUtils.getSubject();
            if (subject.isAuthenticated()) {
                subject.logout();
            }
            // 创建认证Token,设置Remember Me
            UsernamePasswordToken token = new UsernamePasswordToken(username, password);
            token.setRememberMe(rememberMe);  // 设置Remember Me
            subject.login(token);
            result.put("success", true);
            result.put("message", "登录成功");
            result.put("username", username);
            result.put("rememberMe", rememberMe);
            log.info("用户登录成功: {}, Remember Me: {}", username, rememberMe);
            return ResponseEntity.ok(result);
        } catch (AuthenticationException e) {
            result.put("success", false);
            result.put("message", "登录失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
}
```

## 场景四: 方法级权限控制

### 应用场景

除了URL级别的权限控制,还需要方法级别的权限控制,比如某些方法只有特定角色或权限才能调用。

### 启用方法级权限

```java
package com.example.demo.config;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.spring.security.interceptor.AuthorizationAttributeSourceAdvisor;
import org.apache.shiro.spring.web.config.DefaultShiroFilterChainDefinition;
import org.apache.shiro.spring.web.config.ShiroFilterChainDefinition;
import org.springframework.aop.framework.autoproxy.DefaultAdvisorAutoProxyCreator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * Shiro方法级权限配置
 */
@Slf4j
@Configuration
public class ShiroMethodSecurityConfig {
    /**
     * 启用Shiro的注解支持
     * 支持@RequiresRoles、@RequiresPermissions等注解
     */
    @Bean
    public DefaultAdvisorAutoProxyCreator advisorAutoProxyCreator() {
        DefaultAdvisorAutoProxyCreator advisorAutoProxyCreator = new DefaultAdvisorAutoProxyCreator();
        advisorAutoProxyCreator.setProxyTargetClass(true);
        return advisorAutoProxyCreator;
    }
    /**
     * 配置授权属性源顾问
     * 使@RequiresRoles、@RequiresPermissions等注解生效
     */
    @Bean
    public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(
            org.apache.shiro.mgt.SecurityManager securityManager) {
        AuthorizationAttributeSourceAdvisor advisor = new AuthorizationAttributeSourceAdvisor();
        advisor.setSecurityManager(securityManager);
        return advisor;
    }
}
```

### 使用注解进行权限控制

```java
package com.example.demo.service;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.authz.annotation.RequiresAuthentication;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.springframework.stereotype.Service;
/**
 * 用户服务类(演示方法级权限)
 */
@Slf4j
@Service
@RequiresAuthentication  // 类级别: 所有方法都需要认证
public class UserServiceWithMethodSecurity {
    /**
     * 需要admin角色才能调用
     */
    @RequiresRoles("admin")
    public void deleteUser(Long userId) {
        log.info("删除用户: {}", userId);
        // 删除用户逻辑
    }
    /**
     * 需要user:create权限才能调用
     */
    @RequiresPermissions("user:create")
    public void createUser(String username, String password) {
        log.info("创建用户: {}", username);
        // 创建用户逻辑
    }
    /**
     * 需要user:update权限才能调用
     */
    @RequiresPermissions("user:update")
    public void updateUser(Long userId, String username) {
        log.info("更新用户: {}", userId);
        // 更新用户逻辑
    }
    /**
     * 需要user或admin角色才能调用
     */
    @RequiresRoles({"user", "admin"})
    public void getUserInfo(Long userId) {
        log.info("获取用户信息: {}", userId);
        // 获取用户信息逻辑
    }
}
```

## 最佳实践和注意事项

### 1. Realm设计

1. **单一职责**: 每个Realm只负责一种数据源(数据库、LDAP等)
2. **缓存授权信息**: 授权信息变化不频繁,应该缓存
3. **异常处理**: 认证失败时抛出合适的异常,便于错误处理
4. **性能优化**: 避免在Realm中执行耗时操作,可以异步处理

### 2. 过滤器链配置

1. **顺序很重要**: 过滤器链的顺序影响匹配结果,具体路径应该放在通用路径之前
2. **anon过滤器**: 公开资源使用anon过滤器,不需要认证
3. **authc过滤器**: 需要认证的资源使用authc过滤器
4. **user过滤器**: 支持Remember Me的资源使用user过滤器

### 3. 会话管理

1. **会话超时**: 根据业务需求设置合适的会话超时时间
2. **会话存储**: 集群环境使用Redis等外部存储
3. **会话验证**: 定期验证会话有效性,清理无效会话
4. **会话安全**: 使用HTTPS传输,防止会话劫持

### 4. 密码安全

1. **加密算法**: 使用强加密算法(SHA-256、BCrypt等)
2. **盐值**: 为每个用户生成唯一盐值,防止彩虹表攻击
3. **迭代次数**: 增加加密迭代次数,提高安全性
4. **密码策略**: 强制用户使用强密码,定期更换密码

### 5. 性能优化

1. **缓存授权信息**: 使用Redis或EhCache缓存角色和权限
2. **减少数据库查询**: 在Realm中批量查询,避免N+1问题
3. **异步处理**: 非关键操作可以异步处理
4. **连接池**: 使用数据库连接池,提高性能

## 总结

Spring Boot 4整合Shiro其实不难,核心就几个点:配置SecurityManager、实现自定义Realm、设置过滤器链、管理会话和缓存;但是要写好也不容易,密码加密、Remember Me、方法级权限、性能优化,一堆细节要注意;鹏磊今天给兄弟们讲了基础认证授权、会话管理、密码加密、方法级权限这几个场景,基本上覆盖了大部分使用场景;Shiro相比Spring Security更简单易用,适合中小型项目;兄弟们按需选择,有啥问题随时问,鹏磊看到就回。
