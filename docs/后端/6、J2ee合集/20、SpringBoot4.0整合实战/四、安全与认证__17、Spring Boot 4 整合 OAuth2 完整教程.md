# 17、Spring Boot 4 整合 OAuth2 完整教程
- 来源：https://ddkk.com/springboot/4-action/17.html
- 分类：Spring Boot 4 整合教程
- 分组：四、安全与认证
- 日期：2025-12-08
以前做项目的时候,需要集成第三方登录,比如用Google、GitHub、微信这些账号登录,但是每个平台都有自己的认证方式,写起来麻烦得要死;后来听说OAuth2这玩意儿不错,是业界标准的授权协议,支持第三方登录、API授权、单点登录这些场景;但是直接用OAuth2写,那叫一个复杂,授权码流程、令牌刷新、资源保护,一堆概念和配置写得人头疼;后来发现Spring Security OAuth2直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合OAuth2更是方便得不行,自动配置给你整得明明白白,咱今天就聊聊Spring Boot 4咋整合OAuth2的。

其实OAuth2在Spring Boot里早就支持了,你只要加个`spring-boot-starter-oauth2-client`或`spring-boot-starter-oauth2-resource-server`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道OAuth2客户端、资源服务器、授权服务器这三者的区别,更不知道咋用Spring Authorization Server搭建自己的授权服务器,所以鹏磊今天就给兄弟们掰扯掰扯。

## OAuth2基础概念

### OAuth2的四种角色

OAuth2协议定义了四种角色,理解这些角色是使用OAuth2的基础:

1. **资源所有者(Resource Owner)**: 就是用户本人,拥有被保护资源的所有权
2. **客户端(Client)**: 想要访问用户资源的应用,比如你的Web应用
3. **授权服务器(Authorization Server)**: 负责颁发访问令牌的服务器,比如Google、GitHub
4. **资源服务器(Resource Server)**: 存储用户资源的服务器,需要验证访问令牌

### OAuth2的授权流程

OAuth2最常用的授权码流程(Authorization Code Flow)是这样的:

1. 用户访问客户端应用,点击"使用Google登录"
2. 客户端重定向到授权服务器的登录页面
3. 用户登录并授权
4. 授权服务器重定向回客户端,带上授权码
5. 客户端用授权码换取访问令牌
6. 客户端用访问令牌访问资源服务器

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-oauth2-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── client/                   # OAuth2客户端相关
│   │   │               ├── resource/                 # 资源服务器相关
│   │   │               ├── authorization/            # 授权服务器相关
│   │   │               ├── controller/               # 控制器目录
│   │   │               └── config/                   # 配置类目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且需要根据你的需求选择不同的OAuth2依赖。

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
    <artifactId>spring-boot-oauth2-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 OAuth2 Demo</name>
    <description>Spring Boot 4整合OAuth2示例项目</description>
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
        <!-- Spring Boot Security Starter: Spring Security基础 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <!-- OAuth2客户端支持: 用于第三方登录(如Google、GitHub) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-client</artifactId>
        </dependency>
        <!-- OAuth2资源服务器支持: 用于保护API资源 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>
        <!-- OAuth2授权服务器支持: 用于搭建自己的授权服务器 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-authorization-server</artifactId>
        </dependency>
        <!-- Spring Boot Data JPA: 数据访问(可选,用于存储客户端信息) -->
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

## 场景一: OAuth2客户端 - 第三方登录

### 应用场景

你的应用需要支持用户使用Google、GitHub、微信等第三方账号登录,这时候你的应用就是OAuth2客户端。

### application.yml配置

Spring Boot 4的OAuth2客户端配置通过`spring.security.oauth2.client.*`属性控制:

```yaml
spring:
  application:
    name: spring-boot-oauth2-demo
  # OAuth2客户端配置
  security:
    oauth2:
      client:
        # 客户端注册配置
        registration:
          # Google登录配置
          google:
            client-id: your-google-client-id  # 从Google Cloud Console获取
            client-secret: your-google-client-secret  # 从Google Cloud Console获取
            scope:  # 请求的权限范围
              - openid
              - profile
              - email
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"  # 回调地址
            authorization-grant-type: authorization_code  # 授权码模式
            client-name: Google  # 客户端显示名称
          # GitHub登录配置
          github:
            client-id: your-github-client-id  # 从GitHub Settings > Developer settings > OAuth Apps获取
            client-secret: your-github-client-secret
            scope:
              - read:user
              - user:email
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            authorization-grant-type: authorization_code
            client-name: GitHub
        # 提供者配置(如果使用标准OIDC提供者,可以自动发现)
        provider:
          google:
            issuer-uri: https://accounts.google.com  # OIDC Issuer URI,会自动发现配置
          github:
            authorization-uri: https://github.com/login/oauth/authorize  # 授权端点
            token-uri: https://github.com/login/oauth/access_token  # 令牌端点
            user-info-uri: https://api.github.com/user  # 用户信息端点
            user-name-attribute: login  # 用户名属性名
```

### 安全配置

配置SecurityFilterChain启用OAuth2登录:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import static org.springframework.security.config.Customizer.withDefaults;
/**
 * OAuth2客户端安全配置
 * 启用OAuth2登录功能
 */
@Configuration
@EnableWebSecurity
public class OAuth2ClientSecurityConfig {
    /**
     * 配置安全过滤器链
     * 启用OAuth2登录
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 配置请求授权
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/", "/login", "/error", "/webjars/**").permitAll()  // 公开访问
                .anyRequest().authenticated()  // 其他请求需要认证
            )
            // 启用OAuth2登录
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")  // 自定义登录页面
                .defaultSuccessUrl("/home", true)  // 登录成功跳转
                .failureUrl("/login?error=true")  // 登录失败跳转
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService())  // 自定义用户服务(可选)
                )
            )
            // 配置登出
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            );
        return http.build();
    }
    /**
     * 自定义OAuth2用户服务
     * 用于处理OAuth2用户信息,可以保存到数据库
     */
    @Bean
    public CustomOAuth2UserService customOAuth2UserService() {
        return new CustomOAuth2UserService();
    }
}
```

### 自定义OAuth2用户服务

处理OAuth2登录后的用户信息:

```java
package com.example.demo.config;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.Map;
/**
 * 自定义OAuth2用户服务
 * 处理OAuth2登录后的用户信息
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    /**
     * 加载用户信息
     * 从OAuth2提供者获取用户信息后,可以保存到数据库
     */
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 调用父类方法获取用户信息
        OAuth2User oauth2User = super.loadUser(userRequest);
        // 获取客户端注册ID(如google、github)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        // 获取用户属性
        Map<String, Object> attributes = oauth2User.getAttributes();
        log.info("OAuth2登录成功: RegistrationId={}, Attributes={}", registrationId, attributes);
        // 根据不同的提供者提取用户信息
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();
        // 这里可以保存用户信息到数据库
        // userService.saveOrUpdate(oauth2User);
        // 返回OAuth2User对象
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                userNameAttributeName
        );
    }
}
```

### 控制器示例

```java
package com.example.demo.controller;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
/**
 * 测试控制器
 */
@RestController
public class HomeController {
    /**
     * 首页
     * 需要认证才能访问
     */
    @GetMapping("/home")
    public Map<String, Object> home(@AuthenticationPrincipal OAuth2User oauth2User) {
        return Map.of(
            "message", "欢迎使用OAuth2登录",
            "user", oauth2User.getAttributes(),
            "name", oauth2User.getName()
        );
    }
    /**
     * 获取当前用户信息
     */
    @GetMapping("/user")
    public OAuth2User user(@AuthenticationPrincipal OAuth2User oauth2User) {
        return oauth2User;
    }
}
```

## 场景二: OAuth2资源服务器 - 保护API

### 应用场景

你的应用提供RESTful API,需要验证OAuth2访问令牌才能访问,这时候你的应用就是OAuth2资源服务器。

### application.yml配置

```yaml
spring:
  application:
    name: spring-boot-oauth2-resource-server
  # OAuth2资源服务器配置
  security:
    oauth2:
      resourceserver:
        # JWT配置(使用JWT令牌)
        jwt:
          # 方式1: 使用JWK Set URI(推荐)
          jwk-set-uri: https://your-auth-server.com/.well-known/jwks.json
          # 方式2: 使用OIDC Issuer URI(自动发现)
          # issuer-uri: https://your-auth-server.com
          # 方式3: 使用本地公钥文件
          # public-key-location: classpath:public-key.pem
          # 自定义声明验证
          # audience: your-audience
        # 不透明令牌配置(使用不透明令牌)
        # opaque-token:
        #   introspection-uri: https://your-auth-server.com/oauth2/introspect
        #   client-id: your-client-id
        #   client-secret: your-client-secret
```

### 安全配置

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
/**
 * OAuth2资源服务器安全配置
 * 保护API资源,验证OAuth2访问令牌
 */
@Configuration
@EnableWebSecurity
public class OAuth2ResourceServerSecurityConfig {
    /**
     * 配置安全过滤器链
     * 启用OAuth2资源服务器
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 配置请求授权
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/public/**").permitAll()  // 公开访问
                .requestMatchers("/api/admin/**").hasAuthority("SCOPE_admin")  // 需要admin权限
                .requestMatchers("/api/user/**").hasAnyAuthority("SCOPE_user", "SCOPE_admin")  // 需要user或admin权限
                .anyRequest().authenticated()  // 其他请求需要认证
            )
            // 启用OAuth2资源服务器
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    // 自定义JWT解码器(可选)
                    // .decoder(jwtDecoder())
                    // 自定义JWT认证转换器(可选)
                    // .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            );
        return http.build();
    }
}
```

### 控制器示例

```java
package com.example.demo.controller;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
/**
 * API控制器
 * 演示OAuth2资源服务器保护API
 */
@RestController
@RequestMapping("/api")
public class ApiController {
    /**
     * 用户API
     * 需要有效的OAuth2访问令牌
     */
    @GetMapping("/user/info")
    public Map<String, Object> userInfo(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
            "message", "这是受保护的API",
            "subject", jwt.getSubject(),  // 用户ID
            "claims", jwt.getClaims(),  // JWT声明
            "expiresAt", jwt.getExpiresAt()  // 过期时间
        );
    }
    /**
     * 管理员API
     * 需要admin权限
     */
    @GetMapping("/admin/data")
    public Map<String, Object> adminData(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
            "message", "这是管理员API",
            "user", jwt.getSubject()
        );
    }
}
```

## 场景三: OAuth2授权服务器 - 搭建自己的授权服务器

### 应用场景

你需要搭建自己的OAuth2授权服务器,为其他应用提供认证和授权服务,这时候可以使用Spring Authorization Server。

### application.yml配置

```yaml
spring:
  application:
    name: spring-boot-oauth2-authorization-server
  # 数据源配置(用于存储客户端和授权信息)
  datasource:
    url: jdbc:h2:mem:oauth2db
    driver-class-name: org.h2.Driver
    username: sa
    password: 
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
  # OAuth2授权服务器配置
  security:
    # 默认用户(用于授权服务器管理)
    user:
      name: admin
      password: admin123
      roles: ADMIN
    oauth2:
      authorizationserver:
        # 客户端注册配置
        client:
          # 客户端1: 用于Web应用
          web-client:
            registration:
              client-id: web-client-id
              client-secret: "{noop}web-client-secret"  # {noop}表示不加密
              client-authentication-methods:
                - client_secret_basic  # 客户端认证方式
              authorization-grant-types:
                - authorization_code  # 授权码模式
                - refresh_token  # 刷新令牌
              redirect-uris:
                - http://localhost:8080/login/oauth2/code/web-client
              scopes:
                - openid
                - profile
                - email
                - read
                - write
            require-authorization-consent: true  # 是否需要用户同意
          # 客户端2: 用于移动应用
          mobile-client:
            registration:
              client-id: mobile-client-id
              client-secret: "{noop}mobile-client-secret"
              client-authentication-methods:
                - client_secret_post
              authorization-grant-types:
                - authorization_code
                - refresh_token
              redirect-uris:
                - myapp://callback
              scopes:
                - openid
                - profile
```

### 安全配置

```java
package com.example.demo.config;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.authorization.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.UUID;
/**
 * OAuth2授权服务器安全配置
 * 搭建自己的OAuth2授权服务器
 */
@Configuration
@EnableWebSecurity
public class OAuth2AuthorizationServerSecurityConfig {
    /**
     * 授权服务器安全过滤器链
     * 优先级最高,处理授权服务器端点
     */
    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
        http
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/login"))
            );
        return http.build();
    }
    /**
     * 默认安全过滤器链
     * 处理其他请求
     */
    @Bean
    @Order(2)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/login").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
            );
        return http.build();
    }
    /**
     * 注册客户端仓库
     * 存储OAuth2客户端信息
     */
    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        // 注册客户端1: Web应用
        RegisteredClient webClient = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("web-client-id")
                .clientSecret("{noop}web-client-secret")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("http://localhost:8080/login/oauth2/code/web-client")
                .scope(OidcScopes.OPENID)
                .scope(OidcScopes.PROFILE)
                .scope("read")
                .scope("write")
                .clientSettings(ClientSettings.builder()
                        .requireAuthorizationConsent(true)
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofHours(1))  // 访问令牌有效期1小时
                        .refreshTokenTimeToLive(Duration.ofDays(7))  // 刷新令牌有效期7天
                        .reuseRefreshTokens(true)  // 重用刷新令牌
                        .build())
                .build();
        // 注册客户端2: 移动应用
        RegisteredClient mobileClient = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("mobile-client-id")
                .clientSecret("{noop}mobile-client-secret")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("myapp://callback")
                .scope(OidcScopes.OPENID)
                .scope(OidcScopes.PROFILE)
                .scope("read")
                .clientSettings(ClientSettings.builder()
                        .requireAuthorizationConsent(false)
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(30))
                        .refreshTokenTimeToLive(Duration.ofDays(30))
                        .reuseRefreshTokens(false)
                        .build())
                .build();
        return new InMemoryRegisteredClientRepository(webClient, mobileClient);
    }
    /**
     * JWK源
     * 用于JWT签名和验证
     */
    @Bean
    public JWKSource<SecurityContext> jwkSource() {
        KeyPair keyPair = generateRsaKey();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(UUID.randomUUID().toString())
                .build();
        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }
    /**
     * 生成RSA密钥对
     */
    private KeyPair generateRsaKey() {
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            return keyPairGenerator.generateKeyPair();
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
    /**
     * JWT解码器
     * 用于资源服务器验证JWT
     */
    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }
    /**
     * 授权服务器设置
     */
    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder()
                .issuer("http://localhost:9000")  // 授权服务器地址
                .build();
    }
}
```

### 授权服务器端点

Spring Authorization Server自动提供以下端点:

- `/oauth2/authorize`: 授权端点,用户在这里授权
- `/oauth2/token`: 令牌端点,用授权码换取访问令牌
- `/oauth2/introspect`: 令牌内省端点,验证令牌有效性
- `/oauth2/revoke`: 令牌撤销端点,撤销令牌
- `/.well-known/openid-configuration`: OIDC配置发现端点
- `/.well-known/jwks.json`: JWK Set端点,提供公钥

## 完整示例: 三端协作

### 架构说明

1. **授权服务器**(端口9000): 提供认证和授权服务
2. **资源服务器**(端口8080): 提供API资源,验证访问令牌
3. **客户端应用**(端口8081): 用户访问的应用,使用OAuth2登录

### 授权服务器配置

```java
// 见上面的OAuth2AuthorizationServerSecurityConfig
```

### 资源服务器配置

```yaml
# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:9000  # 指向授权服务器
```

```java
// 见上面的OAuth2ResourceServerSecurityConfig
```

### 客户端应用配置

```yaml
# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          my-client:
            provider: my-auth-server
            client-id: web-client-id
            client-secret: web-client-secret
            authorization-grant-type: authorization_code
            scope: openid,profile,read,write
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
        provider:
          my-auth-server:
            issuer-uri: http://localhost:9000
```

## 最佳实践

### 1. 使用数据库存储客户端信息

生产环境应该用数据库存储客户端信息,而不是内存:

```java
package com.example.demo.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
/**
 * 注册客户端实体
 */
@Entity
@Table(name = "oauth2_registered_client")
@Data
public class RegisteredClientEntity {
    @Id
    private String id;
    private String clientId;
    private Instant clientIdIssuedAt;
    private String clientSecret;
    private Instant clientSecretExpiresAt;
    private String clientName;
    @Column(length = 1000)
    private String clientAuthenticationMethods;
    @Column(length = 1000)
    private String authorizationGrantTypes;
    @Column(length = 1000)
    private String redirectUris;
    @Column(length = 1000)
    private String scopes;
    @Column(length = 2000)
    private String clientSettings;
    @Column(length = 2000)
    private String tokenSettings;
}
```

```java
package com.example.demo.repository;
import com.example.demo.entity.RegisteredClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface RegisteredClientRepository extends JpaRepository<RegisteredClientEntity, String> {
    Optional<RegisteredClientEntity> findByClientId(String clientId);
}
```

### 2. 自定义令牌格式

可以自定义JWT的声明和格式:

```java
@Bean
public OAuth2TokenCustomizer<JwtEncodingContext> tokenCustomizer() {
    return (context) -> {
        if (OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) {
            context.getClaims().claim("custom-claim", "custom-value");
            // 添加自定义声明
        }
    };
}
```

### 3. 令牌刷新策略

合理配置令牌刷新策略:

```java
TokenSettings.builder()
    .accessTokenTimeToLive(Duration.ofHours(1))  // 访问令牌1小时
    .refreshTokenTimeToLive(Duration.ofDays(30))  // 刷新令牌30天
    .reuseRefreshTokens(false)  // 不重用刷新令牌,更安全
    .build()
```

### 4. 安全建议

1. **使用HTTPS**: 生产环境必须使用HTTPS
2. **保护客户端密钥**: 不要将客户端密钥提交到代码仓库
3. **设置合理的令牌有效期**: 平衡安全性和用户体验
4. **启用PKCE**: 对于公共客户端(如SPA),启用PKCE增强安全性
5. **监控和日志**: 记录所有授权和令牌颁发操作

## 总结

Spring Boot 4整合OAuth2确实方便,自动配置给你整得明明白白;用OAuth2客户端实现第三方登录、用资源服务器保护API、用授权服务器搭建自己的认证中心,简单得不行;支持JWT令牌、刷新令牌、OIDC这些高级功能,基本能满足大部分业务需求;数据库存储、自定义令牌、安全策略这些也都有现成的方案,用起来贼顺手。

兄弟们在实际项目中用OAuth2的时候,注意几个点:一是理解清楚OAuth2的四种角色和授权流程,别搞混了;二是合理选择使用场景,客户端、资源服务器、授权服务器要分清楚;三是生产环境记得用数据库存储客户端信息,别用内存存储;四是配置好令牌有效期和刷新策略,平衡安全性和用户体验;五是做好安全防护,使用HTTPS、保护密钥、启用PKCE这些都要考虑。

好了,今天就聊到这,有啥问题评论区见。
