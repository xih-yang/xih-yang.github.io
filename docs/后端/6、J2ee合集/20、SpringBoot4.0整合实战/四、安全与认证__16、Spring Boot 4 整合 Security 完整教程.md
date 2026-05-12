# 16、Spring Boot 4 整合 Security 完整教程
- 来源：https://ddkk.com/springboot/4-action/16.html
- 分类：Spring Boot 4 整合教程
- 分组：四、安全与认证
- 日期：2025-12-08
为啥需要Spring Security?因为现在的Web应用到处都是安全漏洞,SQL注入、XSS攻击、CSRF攻击,一不小心就被黑客搞了;后来听说Spring Security这玩意儿不错,功能全、可靠性高、社区活跃,是Java生态里最成熟的安全框架;但是直接用Spring Security写,那叫一个复杂,配置过滤器链、用户认证、权限控制、会话管理,一堆配置写得人头疼;后来发现Spring Boot直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合Spring Security更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合Security的。

其实Spring Security在Spring Boot里早就支持了,你只要加个`spring-boot-starter-security`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用SecurityFilterChain、UserDetailsService、方法级安全、JWT认证这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-security-demo/
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
│   │   │               └── config/                   # 配置类目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Spring Boot 4默认使用Spring Security 6.x版本。

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
    <artifactId>spring-boot-security-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Security Demo</name>
    <description>Spring Boot 4整合Spring Security示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring Boot Security Starter: Spring Security集成支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
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
        <!-- JWT支持(可选,用于JWT认证) -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.3</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <!-- Spring Boot Test: 测试支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Spring Security Test: 安全测试支持 -->
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
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

Spring Boot 4的Security自动配置通过`spring.security.*`属性控制,配置起来贼简单:

```yaml
spring:
  application:
    name: spring-boot-security-demo  # 应用名称
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
  # Security配置
  security:
    # 默认用户配置(开发环境用,生产环境不要用)
    user:
      name: admin          # 默认用户名
      password: admin123   # 默认密码
      roles: ADMIN,USER   # 默认角色
# 日志配置
logging:
  level:
    org.springframework.security: DEBUG  # 开启Security调试日志
    org.springframework.boot.security: WARN  # 默认密码会在WARN级别打印
```

## 基础使用: 默认安全配置

### 默认安全行为

Spring Boot 4默认会启用Spring Security,所有端点都需要认证;启动应用后,访问任何URL都会跳转到登录页面。

```java
package com.example.demo.controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
/**
 * 测试控制器
 * 演示默认安全配置
 */
@RestController
public class TestController {
    /**
     * 测试接口
     * 默认需要认证才能访问
     */
    @GetMapping("/hello")
    public String hello() {
        return "Hello Spring Security!";
    }
    /**
     * 公开接口
     * 需要配置SecurityFilterChain才能公开访问
     */
    @GetMapping("/public")
    public String publicEndpoint() {
        return "This is a public endpoint";
    }
}
```

## 自定义安全配置

### 配置SecurityFilterChain

Spring Boot 4推荐使用SecurityFilterChain来配置安全规则:

```java
package com.example.demo.config;
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
import static org.springframework.security.config.Customizer.withDefaults;
/**
 * Spring Security配置类
 * 配置安全规则和用户认证
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    /**
     * 配置安全过滤器链
     * 定义哪些路径需要认证,哪些可以公开访问
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 配置请求授权
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/public/**", "/login", "/error").permitAll()  // 公开访问
                .requestMatchers("/admin/**").hasRole("ADMIN")  // 需要ADMIN角色
                .requestMatchers("/user/**").hasAnyRole("USER", "ADMIN")  // 需要USER或ADMIN角色
                .anyRequest().authenticated()  // 其他请求需要认证
            )
            // 配置表单登录
            .formLogin(form -> form
                .loginPage("/login")  // 自定义登录页面
                .defaultSuccessUrl("/home", true)  // 登录成功跳转
                .failureUrl("/login?error=true")  // 登录失败跳转
                .permitAll()
            )
            // 配置登出
            .logout(logout -> logout
                .logoutUrl("/logout")  // 登出URL
                .logoutSuccessUrl("/login?logout=true")  // 登出成功跳转
                .invalidateHttpSession(true)  // 使会话失效
                .deleteCookies("JSESSIONID")  // 删除Cookie
                .permitAll()
            )
            // 配置HTTP Basic认证(可选)
            .httpBasic(withDefaults())
            // 配置CSRF保护(默认启用)
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/api/**")  // API接口可以禁用CSRF
            );
        return http.build();
    }
    /**
     * 配置用户详情服务
     * 使用内存存储用户信息(生产环境应该用数据库)
     */
    @Bean
    public UserDetailsService userDetailsService() {
        // 创建用户详情
        UserDetails admin = User.withDefaultPasswordEncoder()
                .username("admin")
                .password("admin123")
                .roles("ADMIN", "USER")
                .build();
        UserDetails user = User.withDefaultPasswordEncoder()
                .username("user")
                .password("user123")
                .roles("USER")
                .build();
        // 返回内存用户管理器
        return new InMemoryUserDetailsManager(admin, user);
    }
    /**
     * 配置密码编码器
     * 用于加密密码
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 基于数据库的用户认证

实际项目中应该用数据库存储用户信息:

```java
package com.example.demo.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.util.Set;
/**
 * 用户实体
 */
@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String username;  // 用户名
    @Column(nullable = false)
    private String password;  // 密码(加密后)
    private boolean enabled = true;  // 是否启用
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles;  // 用户角色
}
```

```java
package com.example.demo.entity;
import jakarta.persistence.*;
import lombok.Data;
/**
 * 角色实体
 */
@Entity
@Table(name = "roles")
@Data
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String name;  // 角色名称(如: ROLE_ADMIN, ROLE_USER)
}
```

```java
package com.example.demo.repository;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
/**
 * 用户数据访问接口
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * 根据用户名查找用户
     */
    Optional<User> findByUsername(String username);
}
```

```java
package com.example.demo.service;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
/**
 * 自定义用户详情服务
 * 从数据库加载用户信息
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;
    /**
     * 根据用户名加载用户
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 从数据库查找用户
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + username));
        // 转换为Spring Security的UserDetails
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().replace("ROLE_", ""))
                        .toArray(String[]::new))
                .disabled(!user.isEnabled())
                .build();
    }
}
```

## 高级功能

### JWT认证

JWT(JSON Web Token)是一种无状态的认证方式,适合前后端分离的应用:

```java
package com.example.demo.config;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
/**
 * JWT工具类
 * 用于生成和验证JWT Token
 */
@Component
public class JwtTokenUtil {
    @Value("${jwt.secret:mySecretKey123456789012345678901234567890}")
    private String secret;
    @Value("${jwt.expiration:86400000}")  // 24小时
    private Long expiration;
    /**
     * 生成JWT Token
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("authorities", userDetails.getAuthorities());
        return createToken(claims, userDetails.getUsername());
    }
    /**
     * 创建Token
     */
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }
    /**
     * 从Token中获取用户名
     */
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }
    /**
     * 从Token中获取过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }
    /**
     * 从Token中获取指定声明
     */
    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }
    /**
     * 从Token中获取所有声明
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    /**
     * 检查Token是否过期
     */
    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }
    /**
     * 验证Token
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = getUsernameFromToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
    /**
     * 获取签名密钥
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}
```

```java
package com.example.demo.config;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
/**
 * JWT认证过滤器
 * 在每个请求中验证JWT Token
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenUtil jwtTokenUtil;
    private final UserDetailsService userDetailsService;
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        // 从请求头获取Token
        final String authHeader = request.getHeader("Authorization");
        String username = null;
        String jwt = null;
        // 检查Authorization头格式: Bearer <token>
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtTokenUtil.getUsernameFromToken(jwt);
            } catch (Exception e) {
                logger.error("JWT Token解析失败", e);
            }
        }
        // 如果Token有效且当前没有认证信息,设置认证
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (jwtTokenUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}
```

```java
package com.example.demo.config;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
/**
 * JWT安全配置
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class JwtSecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF(因为使用JWT,不需要CSRF保护)
            .csrf(csrf -> csrf.disable())
            // 配置会话管理为无状态(使用JWT,不需要Session)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // 配置请求授权
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()  // 认证接口公开
                .anyRequest().authenticated()  // 其他接口需要认证
            )
            // 添加JWT过滤器
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

### 方法级安全

Spring Security支持方法级的安全控制:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
/**
 * 方法级安全配置
 */
@Configuration
@EnableMethodSecurity(
    prePostEnabled = true,  // 启用@PreAuthorize和@PostAuthorize
    securedEnabled = true,  // 启用@Secured
    jsr250Enabled = true    // 启用@RolesAllowed
)
public class MethodSecurityConfig {
}
```

```java
package com.example.demo.service;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
/**
 * 业务服务
 * 演示方法级安全
 */
@Service
public class BusinessService {
    /**
     * 只有ADMIN角色可以访问
     */
    @PreAuthorize("hasRole('ADMIN')")
    public String adminOnly() {
        return "This is admin only";
    }
    /**
     * 只有USER角色可以访问
     */
    @PreAuthorize("hasRole('USER')")
    public String userOnly() {
        return "This is user only";
    }
    /**
     * 使用SpEL表达式控制访问
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public String adminOrUser() {
        return "This is for admin or user";
    }
    /**
     * 基于方法参数的访问控制
     */
    @PreAuthorize("#username == authentication.name")
    public String getOwnData(String username) {
        return "Your data: " + username;
    }
}
```

## 最佳实践

### 1. CORS配置

前后端分离应用需要配置CORS:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
/**
 * CORS配置
 */
@Configuration
public class CorsConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 允许的源
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:8080"));
        // 允许的方法
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // 允许的请求头
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        // 允许发送凭证
        configuration.setAllowCredentials(true);
        // 预检请求的有效期
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

在SecurityFilterChain中启用CORS:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        // ... 其他配置
    return http.build();
}
```

### 2. 异常处理

自定义安全异常处理:

```java
package com.example.demo.config;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;
/**
 * 访问拒绝处理器
 */
@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {
    @Override
    public void handle(HttpServletRequest request, 
                      HttpServletResponse response,
                      AccessDeniedException accessDeniedException) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"访问被拒绝\",\"message\":\"" + 
                accessDeniedException.getMessage() + "\"}");
    }
}
```

### 3. 密码加密

使用BCrypt加密密码:

```java
package com.example.demo.service;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
/**
 * 用户服务
 */
@Service
@RequiredArgsConstructor
public class UserService {
    private final PasswordEncoder passwordEncoder;
    /**
     * 创建用户
     * 密码会自动加密
     */
    public void createUser(String username, String rawPassword) {
        // 加密密码
        String encodedPassword = passwordEncoder.encode(rawPassword);
        // 保存用户...
    }
    /**
     * 验证密码
     */
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}
```

## 总结

Spring Boot 4整合Spring Security确实方便,自动配置给你整得明明白白;用SecurityFilterChain配置安全规则、UserDetailsService加载用户信息,简单得不行;支持JWT认证、方法级安全、CORS配置这些高级功能,基本能满足大部分业务需求;密码加密、异常处理、会话管理这些也都有现成的方案,用起来贼顺手。

兄弟们在实际项目中用Spring Security的时候,注意几个点:一是合理配置安全规则,公开接口和受保护接口要分清楚;二是做好密码加密,千万别明文存储密码;三是使用JWT时要设置合理的过期时间,定期刷新Token;四是配置好CORS,前后端分离应用必须配置;五是生产环境记得禁用默认用户,使用数据库存储用户信息。

好了,今天就聊到这,有啥问题评论区见。
