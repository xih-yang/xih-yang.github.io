# 18、Spring Boot 4 整合 JWT 完整教程
- 来源：https://ddkk.com/springboot/4-action/18.html
- 分类：Spring Boot 4 整合教程
- 分组：四、安全与认证
- 日期：2025-12-08
做前后端分离项目的时候,最烦的就是Session管理,服务器得存会话状态,集群环境下还得搞Session共享,Redis、数据库、Cookie轮番上阵,麻烦得要死;后来听说JWT这玩意儿不错,无状态、跨域友好、适合微服务,直接把用户信息编码到Token里,服务器不用存状态;但是直接用JWT写,那叫一个复杂,密钥管理、Token生成、签名验证、过期处理,一堆代码写得人头疼;后来发现JJWT库直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合JWT更是方便得不行,配合Spring Security用起来贼爽,咱今天就聊聊Spring Boot 4咋整合JWT的。

其实JWT在Spring Boot里早就支持了,你只要加个`jjwt`依赖,配合Spring Security的过滤器链,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋用HMAC、RSA签名、刷新Token、自定义Claims这些高级功能,更不知道咋和Spring Security无缝集成,所以鹏磊今天就给兄弟们掰扯掰扯。

## JWT基础概念

### JWT是啥玩意儿

JWT(JSON Web Token)是一种开放标准(RFC 7519),用于在各方之间安全地传输信息;JWT由三部分组成,用点(.)分隔:

1. **Header(头部)**: 包含Token类型和签名算法,比如`{"alg":"HS256","typ":"JWT"}`
2. **Payload(载荷)**: 包含声明(Claims),就是你要传输的数据,比如用户ID、角色、过期时间
3. **Signature(签名)**: 用密钥对Header和Payload签名,确保Token没被篡改

### JWT的优势

1. **无状态**: 服务器不用存Session,减轻服务器压力
2. **跨域友好**: 可以放在请求头里,不受Cookie同源策略限制
3. **适合微服务**: Token可以在多个服务间传递,不用共享Session
4. **可扩展**: Payload可以放自定义数据,灵活得很
5. **标准化**: 符合RFC标准,各种语言都有实现

### JWT的签名算法

JWT支持多种签名算法,常用的有:

1. **HMAC**: 对称加密,用同一个密钥签名和验证,比如HS256、HS384、HS512
2. **RSA**: 非对称加密,用私钥签名、公钥验证,比如RS256、RS384、RS512
3. **ECDSA**: 椭圆曲线数字签名,比RSA更高效,比如ES256、ES384、ES512

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-jwt-demo/
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
│   │   │               ├── dto/                       # 数据传输对象目录
│   │   │               ├── config/                    # 配置类目录
│   │   │               └── security/                  # 安全相关目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且JJWT最新版本是0.12.x,API有变化,得注意兼容性。

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
    <artifactId>spring-boot-jwt-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 JWT Demo</name>
    <description>Spring Boot 4整合JWT示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <jjwt.version>0.12.3</jjwt.version>  <!-- JJWT最新版本 -->
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
        <!-- JJWT API: JWT核心API -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <!-- JJWT实现: JWT实现类 -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <!-- JJWT Jackson: JSON序列化支持 -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
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

Spring Boot 4的JWT配置主要通过自定义属性控制,配置起来贼简单:

```yaml
spring:
  application:
    name: spring-boot-jwt-demo  # 应用名称
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
# JWT配置
jwt:
  # JWT密钥(必须至少256位,生产环境要用强密钥)
  secret: ddkk-secret-key-must-be-at-least-256-bits-long-for-security-purposes-please-change-this-in-production-environment
  # Token过期时间(毫秒),默认24小时
  expiration: 86400000
  # 刷新Token过期时间(毫秒),默认7天
  refresh-expiration: 604800000
  # Token前缀
  token-prefix: "Bearer "
  # Token请求头名称
  header-name: "Authorization"
# 日志配置
logging:
  level:
    org.springframework.security: DEBUG  # 开启Security调试日志
    com.example.demo: DEBUG  # 开启应用调试日志
```

## 场景一: 基础JWT认证 - HMAC签名

### 应用场景

你的应用需要无状态认证,用户登录后生成JWT Token,后续请求带上Token就能访问受保护的资源,这是最常见的场景。

### JWT工具类实现

首先得有个JWT工具类,负责生成和验证Token;这里用HMAC-SHA256算法,对称加密,简单高效:

```java
package com.example.demo.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
/**
 * JWT工具类
 * 用于生成和验证JWT Token,使用HMAC-SHA256算法
 */
@Slf4j
@Component
public class JwtTokenUtil {
    /**
     * JWT密钥,从配置文件读取
     * 注意: 密钥长度必须至少256位(32字节),否则会报错
     */
    @Value("${jwt.secret}")
    private String secret;
    /**
     * Token过期时间(毫秒),默认24小时
     */
    @Value("${jwt.expiration:86400000}")
    private Long expiration;
    /**
     * 获取签名密钥
     * 使用HMAC-SHA256算法,密钥长度至少256位
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    /**
     * 生成JWT Token
     * 
     * @param username 用户名,作为Token的主题(Subject)
     * @return JWT Token字符串
     */
    public String generateToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, username);
    }
    /**
     * 生成带自定义声明的JWT Token
     * 
     * @param username 用户名
     * @param claims 自定义声明,比如角色、权限等
     * @return JWT Token字符串
     */
    public String generateToken(String username, Map<String, Object> claims) {
        return createToken(claims, username);
    }
    /**
     * 创建Token
     * 使用JJWT的Builder模式,链式调用构建Token
     */
    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        return Jwts.builder()
                .claims(claims)  // 设置自定义声明
                .subject(subject)  // 设置主题(通常是用户名)
                .issuedAt(now)  // 设置签发时间
                .expiration(expiryDate)  // 设置过期时间
                .signWith(getSigningKey())  // 使用密钥签名
                .compact();  // 生成最终的Token字符串
    }
    /**
     * 从Token中获取用户名
     * 
     * @param token JWT Token字符串
     * @return 用户名
     */
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }
    /**
     * 从Token中获取过期时间
     * 
     * @param token JWT Token字符串
     * @return 过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }
    /**
     * 从Token中获取指定声明
     * 
     * @param token JWT Token字符串
     * @param claimsResolver 声明解析函数
     * @return 声明值
     */
    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }
    /**
     * 从Token中获取所有声明
     * 这里会验证Token的签名和过期时间
     */
    private Claims getAllClaimsFromToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())  // 使用密钥验证签名
                    .build()
                    .parseSignedClaims(token)  // 解析并验证Token
                    .getPayload();  // 获取Payload部分
        } catch (Exception e) {
            log.error("JWT Token解析失败: {}", e.getMessage());
            throw e;
        }
    }
    /**
     * 检查Token是否过期
     * 
     * @param token JWT Token字符串
     * @return true-已过期,false-未过期
     */
    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }
    /**
     * 验证Token是否有效
     * 
     * @param token JWT Token字符串
     * @param username 用户名,用于验证Token是否属于该用户
     * @return true-有效,false-无效
     */
    public Boolean validateToken(String token, String username) {
        final String tokenUsername = getUsernameFromToken(token);
        return (tokenUsername.equals(username) && !isTokenExpired(token));
    }
    /**
     * 验证Token是否有效(不验证用户名)
     * 
     * @param token JWT Token字符串
     * @return true-有效,false-无效或已过期
     */
    public Boolean validateToken(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            log.error("JWT Token验证失败: {}", e.getMessage());
            return false;
        }
    }
}
```

### JWT认证过滤器

接下来得有个过滤器,在每个请求中验证JWT Token,如果Token有效就设置认证信息:

```java
package com.example.demo.security;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
/**
 * JWT认证过滤器
 * 在每个HTTP请求中验证JWT Token,如果Token有效就设置Spring Security的认证信息
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenUtil jwtTokenUtil;
    /**
     * Token前缀,从配置文件读取
     */
    @Value("${jwt.token-prefix:Bearer }")
    private String tokenPrefix;
    /**
     * Token请求头名称,从配置文件读取
     */
    @Value("${jwt.header-name:Authorization}")
    private String headerName;
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        // 从请求头获取Token
        String token = getTokenFromRequest(request);
        // 如果Token存在且有效,设置认证信息
        if (StringUtils.hasText(token) && jwtTokenUtil.validateToken(token)) {
            String username = jwtTokenUtil.getUsernameFromToken(token);
            // 如果当前没有认证信息,就设置一个
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // 创建认证对象,这里简化处理,实际可以从Token中读取角色权限
                List<SimpleGrantedAuthority> authorities = Collections.emptyList();
                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                                username,  // 主体(用户名)
                                null,  // 凭证(密码),JWT不需要
                                authorities  // 权限列表
                        );
                // 设置认证详情,包括IP地址、Session ID等
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                // 将认证信息设置到SecurityContext中
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("JWT Token验证成功,用户: {}", username);
            }
        }
        // 继续过滤器链
        filterChain.doFilter(request, response);
    }
    /**
     * 从请求头中提取JWT Token
     * 
     * @param request HTTP请求
     * @return JWT Token字符串,如果不存在返回null
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(headerName);
        // 检查Token格式: Bearer <token>
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(tokenPrefix)) {
            return bearerToken.substring(tokenPrefix.length());
        }
        return null;
    }
}
```

### Spring Security配置

配置Spring Security,禁用Session、添加JWT过滤器:

```java
package com.example.demo.config;
import com.example.demo.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
/**
 * Spring Security配置
 * 配置JWT认证和授权规则
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    /**
     * 配置安全过滤器链
     * 禁用Session、CSRF,添加JWT过滤器
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF(因为使用JWT,不需要CSRF保护)
            .csrf(csrf -> csrf.disable())
            // 配置会话管理为无状态(使用JWT,不需要Session)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // 配置请求授权规则
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()  // 认证接口公开访问
                .requestMatchers("/api/public/**").permitAll()  // 公开接口
                .anyRequest().authenticated()  // 其他接口需要认证
            )
            // 添加JWT过滤器,在UsernamePasswordAuthenticationFilter之前执行
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    /**
     * 密码编码器
     * 使用BCrypt算法加密密码
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 认证控制器

提供登录接口,生成JWT Token:

```java
package com.example.demo.controller;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.security.JwtTokenUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
/**
 * 认证控制器
 * 提供登录、注册等认证相关接口
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final JwtTokenUtil jwtTokenUtil;
    private final PasswordEncoder passwordEncoder;
    /**
     * 用户登录
     * 验证用户名密码,生成JWT Token
     * 
     * @param loginRequest 登录请求,包含用户名和密码
     * @return 登录响应,包含JWT Token和用户信息
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        // 这里简化处理,实际应该从数据库查询用户
        String username = loginRequest.getUsername();
        String password = loginRequest.getPassword();
        // 模拟用户验证(实际应该查询数据库)
        if (!"admin".equals(username) || !passwordEncoder.matches(password, 
                passwordEncoder.encode("admin123"))) {
            throw new RuntimeException("用户名或密码错误");
        }
        // 生成JWT Token
        String token = jwtTokenUtil.generateToken(username);
        // 构建响应
        LoginResponse response = LoginResponse.builder()
                .token(token)
                .username(username)
                .build();
        log.info("用户登录成功: {}", username);
        return ResponseEntity.ok(response);
    }
    /**
     * 获取当前用户信息
     * 从SecurityContext中获取当前认证用户
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("username", username);
        return ResponseEntity.ok(userInfo);
    }
}
```

### 数据传输对象

```java
package com.example.demo.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
/**
 * 登录请求DTO
 */
@Data
public class LoginRequest {
    @NotBlank(message = "用户名不能为空")
    private String username;
    @NotBlank(message = "密码不能为空")
    private String password;
}
```

```java
package com.example.demo.dto;
import lombok.Builder;
import lombok.Data;
/**
 * 登录响应DTO
 */
@Data
@Builder
public class LoginResponse {
    private String token;
    private String username;
}
```

## 场景二: 刷新Token机制

### 应用场景

Token过期了用户就得重新登录,体验不好;可以用双Token机制,Access Token短期有效、Refresh Token长期有效,用Refresh Token刷新Access Token。

### 刷新Token工具类扩展

扩展JWT工具类,支持刷新Token:

```java
package com.example.demo.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
/**
 * JWT工具类扩展
 * 支持Access Token和Refresh Token
 */
@Slf4j
@Component
public class JwtTokenUtilExtended extends JwtTokenUtil {
    /**
     * 刷新Token过期时间(毫秒),默认7天
     */
    @Value("${jwt.refresh-expiration:604800000}")
    private Long refreshExpiration;
    /**
     * 生成刷新Token
     * Refresh Token有效期更长,用于刷新Access Token
     * 
     * @param username 用户名
     * @return Refresh Token字符串
     */
    public String generateRefreshToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");  // 标记为刷新Token
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpiration);
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }
    /**
     * 验证刷新Token是否有效
     * 
     * @param token Refresh Token字符串
     * @return true-有效,false-无效
     */
    public Boolean validateRefreshToken(String token) {
        try {
            Claims claims = getAllClaimsFromToken(token);
            String type = claims.get("type", String.class);
            return "refresh".equals(type) && !isTokenExpired(token);
        } catch (Exception e) {
            log.error("Refresh Token验证失败: {}", e.getMessage());
            return false;
        }
    }
    /**
     * 使用Refresh Token刷新Access Token
     * 
     * @param refreshToken Refresh Token字符串
     * @return 新的Access Token字符串
     */
    public String refreshAccessToken(String refreshToken) {
        if (!validateRefreshToken(refreshToken)) {
            throw new RuntimeException("Refresh Token无效或已过期");
        }
        String username = getUsernameFromToken(refreshToken);
        return generateToken(username);
    }
}
```

### 刷新Token控制器

```java
package com.example.demo.controller;
import com.example.demo.dto.RefreshTokenRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.security.JwtTokenUtilExtended;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
/**
 * Token刷新控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class TokenRefreshController {
    private final JwtTokenUtilExtended jwtTokenUtil;
    /**
     * 刷新Access Token
     * 使用Refresh Token获取新的Access Token
     * 
     * @param request 刷新Token请求,包含Refresh Token
     * @return 新的Access Token
     */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        // 使用Refresh Token刷新Access Token
        String newAccessToken = jwtTokenUtil.refreshAccessToken(refreshToken);
        String username = jwtTokenUtil.getUsernameFromToken(refreshToken);
        LoginResponse response = LoginResponse.builder()
                .token(newAccessToken)
                .username(username)
                .build();
        log.info("Token刷新成功: {}", username);
        return ResponseEntity.ok(response);
    }
}
```

## 场景三: RSA非对称签名

### 应用场景

微服务架构下,多个服务需要验证Token,如果用HMAC对称加密,每个服务都得知道密钥,不安全;用RSA非对称加密,授权服务用私钥签名,其他服务用公钥验证,更安全。

### RSA密钥生成

```java
package com.example.demo.security;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.security.KeyPair;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
/**
 * RSA密钥生成工具
 * 用于生成RSA密钥对,用于JWT签名和验证
 */
@Slf4j
@Component
public class RsaKeyGenerator {
    /**
     * 生成RSA密钥对
     * 使用RS256算法,密钥长度2048位
     * 
     * @return RSA密钥对
     */
    public KeyPair generateKeyPair() {
        return Jwts.SIG.RS256.keyPair().build();
    }
    /**
     * 从密钥对中获取私钥
     * 
     * @param keyPair 密钥对
     * @return RSA私钥
     */
    public RSAPrivateKey getPrivateKey(KeyPair keyPair) {
        return (RSAPrivateKey) keyPair.getPrivate();
    }
    /**
     * 从密钥对中获取公钥
     * 
     * @param keyPair 密钥对
     * @return RSA公钥
     */
    public RSAPublicKey getPublicKey(KeyPair keyPair) {
        return (RSAPublicKey) keyPair.getPublic();
    }
}
```

### RSA签名JWT工具类

```java
package com.example.demo.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
/**
 * RSA签名JWT工具类
 * 使用RSA非对称加密算法签名和验证JWT Token
 */
@Slf4j
@Component
public class RsaJwtTokenUtil {
    private final ResourceLoader resourceLoader;
    @Value("${jwt.rsa.private-key-path:classpath:rsa/private_key.pem}")
    private String privateKeyPath;
    @Value("${jwt.rsa.public-key-path:classpath:rsa/public_key.pem}")
    private String publicKeyPath;
    @Value("${jwt.expiration:86400000}")
    private Long expiration;
    public RsaJwtTokenUtil(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }
    /**
     * 加载RSA私钥
     * 从文件或类路径加载私钥
     */
    private RSAPrivateKey loadPrivateKey() throws IOException {
        Resource resource = resourceLoader.getResource(privateKeyPath);
        byte[] keyBytes = Files.readAllBytes(Paths.get(resource.getURI()));
        String key = new String(keyBytes)
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = java.util.Base64.getDecoder().decode(key);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decoded);
        try {
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return (RSAPrivateKey) keyFactory.generatePrivate(keySpec);
        } catch (Exception e) {
            throw new RuntimeException("加载RSA私钥失败", e);
        }
    }
    /**
     * 加载RSA公钥
     * 从文件或类路径加载公钥
     */
    private RSAPublicKey loadPublicKey() throws IOException {
        Resource resource = resourceLoader.getResource(publicKeyPath);
        byte[] keyBytes = Files.readAllBytes(Paths.get(resource.getURI()));
        String key = new String(keyBytes)
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = java.util.Base64.getDecoder().decode(key);
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);
        try {
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return (RSAPublicKey) keyFactory.generatePublic(keySpec);
        } catch (Exception e) {
            throw new RuntimeException("加载RSA公钥失败", e);
        }
    }
    /**
     * 生成JWT Token(使用RSA私钥签名)
     * 
     * @param username 用户名
     * @return JWT Token字符串
     */
    public String generateToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, username);
    }
    /**
     * 创建Token(使用RSA私钥签名)
     */
    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        try {
            RSAPrivateKey privateKey = loadPrivateKey();
            return Jwts.builder()
                    .claims(claims)
                    .subject(subject)
                    .issuedAt(now)
                    .expiration(expiryDate)
                    .signWith(privateKey, Jwts.SIG.RS256)  // 使用RSA私钥签名
                    .compact();
        } catch (Exception e) {
            log.error("生成RSA签名JWT Token失败", e);
            throw new RuntimeException("生成Token失败", e);
        }
    }
    /**
     * 验证JWT Token(使用RSA公钥验证)
     * 
     * @param token JWT Token字符串
     * @return true-有效,false-无效
     */
    public Boolean validateToken(String token) {
        try {
            RSAPublicKey publicKey = loadPublicKey();
            Jwts.parser()
                    .verifyWith(publicKey)  // 使用RSA公钥验证
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.error("验证RSA签名JWT Token失败", e);
            return false;
        }
    }
    /**
     * 从Token中获取用户名
     */
    public String getUsernameFromToken(String token) {
        try {
            RSAPublicKey publicKey = loadPublicKey();
            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (Exception e) {
            log.error("解析RSA签名JWT Token失败", e);
            throw new RuntimeException("解析Token失败", e);
        }
    }
}
```

## 场景四: 自定义Claims和角色权限

### 应用场景

Token里不光要存用户名,还得存角色、权限、部门等信息,这样每个服务都能直接拿到用户权限,不用查数据库。

### 带角色权限的JWT工具类

```java
package com.example.demo.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;
/**
 * 带角色权限的JWT工具类
 * Token中包含用户角色和权限信息
 */
@Slf4j
@Component
public class JwtTokenUtilWithRoles extends JwtTokenUtil {
    /**
     * 生成带角色权限的JWT Token
     * 
     * @param username 用户名
     * @param roles 角色列表
     * @param permissions 权限列表
     * @return JWT Token字符串
     */
    public String generateToken(String username, List<String> roles, List<String> permissions) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);  // 角色列表
        claims.put("permissions", permissions);  // 权限列表
        return createToken(claims, username);
    }
    /**
     * 从Token中获取角色列表
     * 
     * @param token JWT Token字符串
     * @return 角色列表
     */
    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        Object roles = claims.get("roles");
        if (roles instanceof List) {
            return (List<String>) roles;
        }
        return Collections.emptyList();
    }
    /**
     * 从Token中获取权限列表
     * 
     * @param token JWT Token字符串
     * @return 权限列表
     */
    @SuppressWarnings("unchecked")
    public List<String> getPermissionsFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        Object permissions = claims.get("permissions");
        if (permissions instanceof List) {
            return (List<String>) permissions;
        }
        return Collections.emptyList();
    }
    /**
     * 从Token中获取Spring Security的权限列表
     * 
     * @param token JWT Token字符串
     * @return GrantedAuthority列表
     */
    public List<GrantedAuthority> getAuthoritiesFromToken(String token) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        // 添加角色权限(ROLE_前缀)
        getRolesFromToken(token).forEach(role -> {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        });
        // 添加普通权限
        getPermissionsFromToken(token).forEach(permission -> {
            authorities.add(new SimpleGrantedAuthority(permission));
        });
        return authorities;
    }
}
```

### 带权限的JWT过滤器

```java
package com.example.demo.security;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
/**
 * 带权限的JWT认证过滤器
 * 从Token中提取角色权限信息,设置到Spring Security上下文中
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilterWithRoles extends OncePerRequestFilter {
    private final JwtTokenUtilWithRoles jwtTokenUtil;
    @Value("${jwt.token-prefix:Bearer }")
    private String tokenPrefix;
    @Value("${jwt.header-name:Authorization}")
    private String headerName;
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = getTokenFromRequest(request);
        if (StringUtils.hasText(token) && jwtTokenUtil.validateToken(token)) {
            String username = jwtTokenUtil.getUsernameFromToken(token);
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // 从Token中获取权限列表
                var authorities = jwtTokenUtil.getAuthoritiesFromToken(token);
                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                authorities  // 设置从Token中提取的权限
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("JWT Token验证成功,用户: {}, 权限: {}", username, authorities);
            }
        }
        filterChain.doFilter(request, response);
    }
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(headerName);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(tokenPrefix)) {
            return bearerToken.substring(tokenPrefix.length());
        }
        return null;
    }
}
```

## 最佳实践和注意事项

### 1. 密钥管理

1. **密钥长度**: HMAC密钥至少256位(32字节),RSA密钥至少2048位
2. **密钥存储**: 生产环境不要硬编码密钥,用环境变量或密钥管理服务
3. **密钥轮换**: 定期轮换密钥,但要考虑Token有效期,避免大量用户被迫重新登录

### 2. Token过期时间

1. **Access Token**: 短期有效,比如15分钟到1小时,减少泄露风险
2. **Refresh Token**: 长期有效,比如7天到30天,用于刷新Access Token
3. **过期处理**: Token过期后返回401,前端用Refresh Token刷新或跳转登录

### 3. 安全性考虑

1. **HTTPS传输**: 生产环境必须用HTTPS,防止Token被截获
2. **Token存储**: 前端不要存localStorage(容易被XSS攻击),优先用httpOnly Cookie
3. **签名验证**: 必须验证Token签名,防止Token被篡改
4. **过期检查**: 必须检查Token过期时间,防止过期Token被使用

### 4. 性能优化

1. **Token大小**: 不要往Token里塞太多数据,影响传输和解析性能
2. **缓存验证结果**: 可以缓存Token验证结果,减少重复验证
3. **异步验证**: 大量并发时可以异步验证Token,提高吞吐量

## 总结

Spring Boot 4整合JWT其实不难,核心就几个点:用JJWT库生成和验证Token,用Spring Security过滤器链拦截请求,用SecurityContext存储认证信息;但是要写好也不容易,密钥管理、Token刷新、角色权限、安全性考虑,一堆细节要注意;鹏磊今天给兄弟们讲了基础JWT认证、刷新Token、RSA签名、自定义Claims这几个场景,基本上覆盖了大部分使用场景;兄弟们按需选择,有啥问题随时问,鹏磊看到就回。
