# 01、Spring Boot 4 整合 Spring MVC 完整教程
- 来源：https://ddkk.com/springboot/4-action/1.html
- 分类：Spring Boot 4 整合教程
- 分组：一、核心框架与模板
- 日期：2025-12-08
搞Web开发的时候,最烦的就是配置那一堆乱七八糟的XML文件,什么DispatcherServlet、HandlerMapping、ViewResolver,整得人头大;现在Spring Boot 4出来了,这些破事基本都不用你管了,自动配置给你整得明明白白的,咱今天就聊聊Spring Boot 4咋整合Spring MVC的。

其实Spring MVC在Spring Boot里早就默认集成了,你只要加个`spring-boot-starter-web`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋自定义配置,所以鹏磊今天就给兄弟们掰扯掰扯。

## 项目搭建和环境准备

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-mvc-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── controller/               # 控制器目录
│   │   │               ├── config/                    # 配置类目录
│   │   │               ├── service/                  # 服务层目录
│   │   │               └── dto/                       # 数据传输对象目录
│   │   └── resources/
│   │       ├── application.yml                       # 配置文件
│   │       ├── static/                               # 静态资源目录
│   │       └── templates/                           # 模板文件目录(可选)
│   └── test/
│       └── java/                                     # 测试代码目录
```

### pom.xml完整配置

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,JDK版本别搞错了。

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
    <artifactId>spring-boot-mvc-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 MVC Demo</name>
    <description>Spring Boot 4整合Spring MVC示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat、Jackson等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
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
        <!-- 如果需要使用Thymeleaf模板引擎 -->
        <!--
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        -->
        <!-- 如果需要使用FreeMarker模板引擎 -->
        <!--
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-freemarker</artifactId>
        </dependency>
        -->
    </dependencies>
    <build>
        <plugins>
            <!-- Spring Boot Maven插件: 打包和运行 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### application.yml配置

Spring Boot 4的配置文件可以用yml或者properties,yml看着更清爽;下面是一些常用的MVC相关配置:

```yaml
server:
  port: 8080  # 服务端口,默认8080
  servlet:
    context-path: /  # 上下文路径,默认是/
    encoding:
      charset: UTF-8  # 字符编码
      enabled: true
      force: true
spring:
  application:
    name: spring-boot-mvc-demo  # 应用名称
  # MVC相关配置
  mvc:
    # 静态资源路径映射
    static-path-pattern: /**  # 静态资源访问路径模式
    # 视图解析器配置
    view:
      prefix: /templates/  # 视图前缀
      suffix: .html  # 视图后缀
    # 路径匹配策略
    pathmatch:
      matching-strategy: ant_path_matcher  # 路径匹配策略
    # 内容协商
    contentnegotiation:
      favor-parameter: false  # 是否支持参数方式
      favor-path-extension: false  # 是否支持路径扩展名
  # 静态资源位置配置
  web:
    resources:
      static-locations: classpath:/static/,classpath:/public/,classpath:/resources/,classpath:/META-INF/resources/
      cache:
        period: 3600  # 静态资源缓存时间(秒)
  # Jackson JSON配置
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss  # 日期格式
    time-zone: GMT+8  # 时区
    serialization:
      write-dates-as-timestamps: false  # 日期不转时间戳
    default-property-inclusion: non_null  # 不序列化null值
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG  # 项目包日志级别
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

### 启动类配置

启动类很简单,就一个`@SpringBootApplication`注解,Spring Boot会自动扫描同包及子包下的组件:

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4应用启动类
 * @SpringBootApplication 包含了@Configuration、@EnableAutoConfiguration、@ComponentScan
 */
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        // 启动Spring Boot应用
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 MVC应用启动成功!");
    }
}
```

### 验证项目是否搭建成功

启动项目后,访问 `http://localhost:8080`,如果看到Whitelabel Error Page(白页错误),说明项目启动成功了,只是没有配置根路径的处理器而已;这时候你就可以开始写控制器了。

## Spring Boot 4的MVC自动配置机制

Spring Boot 4对Spring MVC的自动配置做了不少优化,核心就是`WebMvcAutoConfiguration`这个类;它会在检测到Spring MVC相关类的时候自动生效,不需要你手动加`@EnableWebMvc`注解,而且这两个还不能一起用,你要是加了`@EnableWebMvc`,自动配置就失效了。

自动配置会给你整这些玩意儿:

- DispatcherServlet的自动注册和配置
- 静态资源处理,包括WebJars支持
- 视图解析器(ViewResolver)的配置
- 消息转换器(MessageConverter)的配置
- 异常处理器的配置
- 格式化器(Formatter)和转换器(Converter)的支持

```java
// Spring Boot 4会自动注册DispatcherServlet
// 你不需要手动配置,框架会通过DispatcherServletRegistrationBean来处理
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);  // 启动后DispatcherServlet就自动配置好了
    }
}
```

## 创建第一个MVC控制器

在Spring Boot 4里创建控制器贼简单,你只需要写个类,加上`@Controller`或者`@RestController`注解就行了;`@RestController`是`@Controller`和`@ResponseBody`的组合,专门用来写RESTful API的。

### 完整的REST控制器示例

```java
package com.example.demo.controller;
import com.example.demo.dto.UserInfo;
import com.example.demo.dto.UserCreateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
/**
 * 用户控制器
 * @RestController = @Controller + @ResponseBody
 * 所有方法返回的数据都会自动转成JSON
 */
@RestController
@RequestMapping("/api/users")  // 定义基础路径,所有接口都是/api/users开头
public class UserController {
    // 模拟数据存储(实际项目中应该用Service和Repository)
    private List<UserInfo> users = new ArrayList<>();
    /**
     * GET请求: 获取欢迎信息
     * 访问地址: http://localhost:8080/api/users/hello
     */
    @GetMapping("/hello")
    public String hello() {
        return "Hello Spring Boot 4 MVC!";  // 返回字符串,会自动转成JSON
    }
    /**
     * GET请求: 获取用户信息
     * 访问地址: http://localhost:8080/api/users/info
     */
    @GetMapping("/info")
    public UserInfo getUserInfo() {
        UserInfo info = new UserInfo();  // 创建用户信息对象
        info.setId(1L);  // 设置ID
        info.setName("鹏磊");  // 设置名字
        info.setAge(30);  // 设置年龄
        info.setEmail("penglei@example.com");  // 设置邮箱
        info.setCreateTime(LocalDateTime.now());  // 设置创建时间
        return info;  // 返回对象,框架会自动序列化成JSON
    }
    /**
     * POST请求: 创建用户
     * 访问地址: http://localhost:8080/api/users
     * Content-Type: application/json
     */
    @PostMapping
    public ResponseEntity<UserInfo> createUser(@RequestBody UserCreateRequest request) {
        UserInfo user = new UserInfo();  // 创建新用户
        user.setId(System.currentTimeMillis());  // 用时间戳当ID(实际应该用数据库自增)
        user.setName(request.getName());  // 设置用户名
        user.setAge(request.getAge());  // 设置年龄
        user.setEmail(request.getEmail());  // 设置邮箱
        user.setCreateTime(LocalDateTime.now());  // 设置创建时间
        users.add(user);  // 添加到列表(实际应该保存到数据库)
        // 返回201 Created状态码和创建的用户信息
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
    /**
     * GET请求: 获取所有用户列表
     * 访问地址: http://localhost:8080/api/users
     */
    @GetMapping
    public ResponseEntity<List<UserInfo>> getAllUsers() {
        return ResponseEntity.ok(users);  // 返回200 OK和用户列表
    }
    /**
     * GET请求: 根据ID获取用户
     * 访问地址: http://localhost:8080/api/users/{id}
     * 路径变量示例: /api/users/1
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserInfo> getUserById(@PathVariable Long id) {
        // 查找用户(实际应该从数据库查询)
        UserInfo user = users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();  // 404 Not Found
        }
        return ResponseEntity.ok(user);  // 200 OK
    }
    /**
     * PUT请求: 更新用户信息
     * 访问地址: http://localhost:8080/api/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserInfo> updateUser(
            @PathVariable Long id,
            @RequestBody UserCreateRequest request) {
        // 查找用户
        UserInfo user = users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();  // 404
        }
        // 更新用户信息
        user.setName(request.getName());
        user.setAge(request.getAge());
        user.setEmail(request.getEmail());
        return ResponseEntity.ok(user);  // 200 OK
    }
    /**
     * DELETE请求: 删除用户
     * 访问地址: http://localhost:8080/api/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        boolean removed = users.removeIf(u -> u.getId().equals(id));  // 删除用户
        if (removed) {
            return ResponseEntity.noContent().build();  // 204 No Content
        } else {
            return ResponseEntity.notFound().build();  // 404 Not Found
        }
    }
}
```

### DTO类定义

```java
package com.example.demo.dto;
import java.time.LocalDateTime;
/**
 * 用户信息DTO(数据传输对象)
 */
public class UserInfo {
    private Long id;  // 用户ID
    private String name;  // 用户名
    private Integer age;  // 年龄
    private String email;  // 邮箱
    private LocalDateTime createTime;  // 创建时间
    // 无参构造函数
    public UserInfo() {
    }
    // 全参构造函数
    public UserInfo(Long id, String name, Integer age, String email, LocalDateTime createTime) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.email = email;
        this.createTime = createTime;
    }
    // Getter和Setter方法
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public Integer getAge() {
        return age;
    }
    public void setAge(Integer age) {
        this.age = age;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public LocalDateTime getCreateTime() {
        return createTime;
    }
    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
/**
 * 创建用户请求DTO
 */
package com.example.demo.dto;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Min;
import javax.validation.constraints.Max;
public class UserCreateRequest {
    @NotBlank(message = "用户名不能为空")  // 非空校验
    private String name;
    @NotNull(message = "年龄不能为空")
    @Min(value = 1, message = "年龄必须大于0")
    @Max(value = 150, message = "年龄不能超过150")
    private Integer age;
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")  // 邮箱格式校验
    private String email;
    // Getter和Setter方法
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public Integer getAge() {
        return age;
    }
    public void setAge(Integer age) {
        this.age = age;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
}
```

## 自定义WebMvc配置

虽然Spring Boot 4的自动配置已经很完善了,但是实际项目中你肯定需要自定义一些东西,比如拦截器、格式化器、视图控制器啥的;这时候你就不能加`@EnableWebMvc`了,得实现`WebMvcConfigurer`接口。

### 完整的WebMvc配置类

```java
package com.example.demo.config;
import com.example.demo.interceptor.LoggingInterceptor;
import com.example.demo.interceptor.AuthInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.format.datetime.standard.DateTimeFormatterRegistrar;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.*;
import java.time.format.DateTimeFormatter;
import java.util.List;
/**
 * Spring MVC自定义配置类
 * 实现WebMvcConfigurer接口,可以自定义各种MVC相关配置
 * 注意: 不要加@EnableWebMvc注解,否则Spring Boot的自动配置就失效了
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    /**
     * 添加拦截器
     * 拦截器可以在请求处理前后做一些统一处理,比如日志、权限校验等
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 日志拦截器: 记录所有API请求
        registry.addInterceptor(new LoggingInterceptor())
                .addPathPatterns("/api/**")  // 拦截所有/api开头的请求
                .excludePathPatterns("/api/public/**", "/api/health");  // 排除公开接口和健康检查
        // 认证拦截器: 校验用户登录状态
        registry.addInterceptor(authInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/public/**", "/api/login", "/api/register");
    }
    /**
     * 配置静态资源处理
     * 静态资源包括图片、CSS、JS、字体文件等
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置classpath下的静态资源
        registry.addResourceHandler("/static/**")  // 访问路径: /static/xxx
                .addResourceLocations("classpath:/static/")  // 实际文件位置
                .setCachePeriod(3600);  // 缓存时间1小时
        // 配置文件系统路径的静态资源(比如上传的文件)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:/var/uploads/")  // 文件系统路径
                .setCachePeriod(0);  // 不缓存
        // 配置WebJars资源(前端框架的jar包)
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/");
    }
    /**
     * 配置跨域访问(CORS)
     * 前后端分离项目必须配置这个
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")  // 允许跨域的路径
                .allowedOrigins("http://localhost:3000", "http://localhost:8081")  // 允许的源
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")  // 允许的HTTP方法
                .allowedHeaders("*")  // 允许所有请求头
                .allowCredentials(true)  // 允许携带凭证
                .maxAge(3600);  // 预检请求缓存时间
    }
    /**
     * 配置路径匹配规则
     */
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.setUseTrailingSlashMatch(false);  // 不匹配尾部斜杠
        configurer.setUseSuffixPatternMatch(false);  // 不使用后缀模式匹配
    }
    /**
     * 配置消息转换器
     * 可以自定义JSON序列化规则
     */
    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        // 使用默认的转换器,Spring Boot已经配置好了Jackson
        // 如果需要自定义,可以在这里添加自定义的转换器
    }
    /**
     * 配置格式化器
     * 用于格式化日期、数字等
     */
    @Override
    public void addFormatters(FormatterRegistry registry) {
        // 注册日期时间格式化器
        DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
        registrar.setDateFormatter(DateTimeFormatter.ofPattern("yyyy-MM-dd"));  // 日期格式
        registrar.setTimeFormatter(DateTimeFormatter.ofPattern("HH:mm:ss"));  // 时间格式
        registrar.setDateTimeFormatter(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));  // 日期时间格式
        registrar.registerFormatters(registry);
    }
    /**
     * 创建认证拦截器Bean
     */
    @Bean
    public AuthInterceptor authInterceptor() {
        return new AuthInterceptor();
    }
}
```

### 拦截器实现

```java
package com.example.demo.interceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
/**
 * 日志拦截器
 * 记录请求和响应信息
 */
@Component
public class LoggingInterceptor implements HandlerInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(LoggingInterceptor.class);
    /**
     * 请求处理前执行
     * @return true继续处理,false拦截请求
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        long startTime = System.currentTimeMillis();  // 记录开始时间
        request.setAttribute("startTime", startTime);  // 保存到request属性中
        logger.info("请求开始: {} {}", request.getMethod(), request.getRequestURI());  // 记录请求信息
        return true;  // 继续处理请求
    }
    /**
     * 请求处理后,视图渲染前执行
     */
    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, 
                          Object handler, ModelAndView modelAndView) {
        logger.info("请求处理完成: {} {}", request.getMethod(), request.getRequestURI());
    }
    /**
     * 整个请求完成后执行(包括视图渲染)
     */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                               Object handler, Exception ex) {
        long startTime = (Long) request.getAttribute("startTime");  // 获取开始时间
        long endTime = System.currentTimeMillis();  // 获取结束时间
        long duration = endTime - startTime;  // 计算耗时
        logger.info("请求完成: {} {}, 耗时: {}ms", 
                   request.getMethod(), request.getRequestURI(), duration);
        if (ex != null) {
            logger.error("请求异常: {}", ex.getMessage(), ex);  // 记录异常信息
        }
    }
}
/**
 * 认证拦截器
 * 校验用户登录状态
 */
package com.example.demo.interceptor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
@Component
public class AuthInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 从请求头获取token
        String token = request.getHeader("Authorization");
        if (token == null || token.isEmpty()) {
            // 没有token,返回401未授权
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;  // 拦截请求
        }
        // 这里应该验证token的有效性(实际项目中应该调用认证服务)
        // 简单示例: 假设token格式是 "Bearer xxxxx"
        if (!token.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        // token验证通过,继续处理
        return true;
    }
}
```

## 使用WebMvcRegistrations自定义核心组件

如果你需要完全自定义`RequestMappingHandlerMapping`、`RequestMappingHandlerAdapter`或者`ExceptionHandlerExceptionResolver`这些核心组件,但是还想保留Spring Boot的自动配置,那就可以用`WebMvcRegistrations`接口。

```java
import org.springframework.boot.webmvc.autoconfigure.WebMvcRegistrations;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
// 自定义核心MVC组件注册
@Configuration
public class CustomWebMvcRegistrations implements WebMvcRegistrations {
    // 自定义请求映射处理器,可以控制URL映射规则
    @Override
    public RequestMappingHandlerMapping getRequestMappingHandlerMapping() {
        RequestMappingHandlerMapping mapping = new RequestMappingHandlerMapping();
        mapping.setOrder(0);  // 设置优先级
        mapping.setRemoveSemicolonContent(false);  // 保留分号内容
        return mapping;
    }
}
```

## 全局异常处理

Spring Boot 4的MVC自动配置也包含了异常处理,但是你可以用`@ControllerAdvice`来定义全局异常处理器,统一处理各种异常;这样就不用每个控制器都写try-catch了,代码更清爽。

### 完整的全局异常处理器

```java
package com.example.demo.exception;
import com.example.demo.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
/**
 * 全局异常处理器
 * @ControllerAdvice 会处理所有控制器抛出的异常
 */
@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    /**
     * 处理参数校验异常(@Valid注解校验失败)
     * 当使用@Valid注解校验请求参数时,如果校验失败会抛出这个异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public ErrorResponse handleValidationException(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();  // 存储字段错误信息
        // 遍历所有字段错误
        e.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();  // 获取字段名
            String errorMessage = error.getDefaultMessage();  // 获取错误信息
            errors.put(fieldName, errorMessage);
        });
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setCode(400);
        errorResponse.setMessage("参数校验失败");
        errorResponse.setErrors(errors);
        errorResponse.setTimestamp(LocalDateTime.now());
        logger.warn("参数校验失败: {}", errors);
        return errorResponse;
    }
    /**
     * 处理约束违反异常(方法参数校验失败)
     */
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public ErrorResponse handleConstraintViolationException(ConstraintViolationException e) {
        Map<String, String> errors = new HashMap<>();
        Set<ConstraintViolation<?>> violations = e.getConstraintViolations();
        for (ConstraintViolation<?> violation : violations) {
            String fieldName = violation.getPropertyPath().toString();  // 获取字段路径
            String errorMessage = violation.getMessage();  // 获取错误信息
            errors.put(fieldName, errorMessage);
        }
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setCode(400);
        errorResponse.setMessage("参数校验失败");
        errorResponse.setErrors(errors);
        errorResponse.setTimestamp(LocalDateTime.now());
        return errorResponse;
    }
    /**
     * 处理参数异常(IllegalArgumentException)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public ErrorResponse handleIllegalArgumentException(IllegalArgumentException e) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setCode(400);
        errorResponse.setMessage("参数错误: " + e.getMessage());
        errorResponse.setTimestamp(LocalDateTime.now());
        logger.warn("参数错误: {}", e.getMessage());
        return errorResponse;
    }
    /**
     * 处理运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ResponseBody
    public ErrorResponse handleRuntimeException(RuntimeException e) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setCode(500);
        errorResponse.setMessage("服务器内部错误: " + e.getMessage());
        errorResponse.setTimestamp(LocalDateTime.now());
        logger.error("运行时异常: ", e);  // 记录完整异常堆栈
        return errorResponse;
    }
    /**
     * 处理所有未捕获的异常
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ResponseBody
    public ErrorResponse handleException(Exception e) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setCode(500);
        errorResponse.setMessage("系统异常,请联系管理员");
        errorResponse.setTimestamp(LocalDateTime.now());
        logger.error("系统异常: ", e);  // 记录完整异常堆栈
        return errorResponse;
    }
    /**
     * 处理自定义业务异常
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseBody
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setCode(e.getCode());
        errorResponse.setMessage(e.getMessage());
        errorResponse.setTimestamp(LocalDateTime.now());
        logger.warn("业务异常: {}", e.getMessage());
        return ResponseEntity.status(e.getHttpStatus()).body(errorResponse);
    }
}
/**
 * 错误响应DTO
 */
package com.example.demo.dto;
import java.time.LocalDateTime;
import java.util.Map;
public class ErrorResponse {
    private Integer code;  // 错误码
    private String message;  // 错误信息
    private Map<String, String> errors;  // 字段错误详情(用于参数校验)
    private LocalDateTime timestamp;  // 时间戳
    public ErrorResponse() {
        this.timestamp = LocalDateTime.now();  // 自动设置时间戳
    }
    // Getter和Setter方法
    public Integer getCode() {
        return code;
    }
    public void setCode(Integer code) {
        this.code = code;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public Map<String, String> getErrors() {
        return errors;
    }
    public void setErrors(Map<String, String> errors) {
        this.errors = errors;
    }
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
/**
 * 自定义业务异常
 */
package com.example.demo.exception;
import org.springframework.http.HttpStatus;
public class BusinessException extends RuntimeException {
    private Integer code;  // 业务错误码
    private HttpStatus httpStatus;  // HTTP状态码
    public BusinessException(String message) {
        super(message);
        this.code = 400;
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }
    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }
    public BusinessException(Integer code, String message, HttpStatus httpStatus) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
    }
    public Integer getCode() {
        return code;
    }
    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
```

## 视图解析和模板引擎

虽然现在前后端分离是主流,但是有些项目还是需要服务端渲染;Spring Boot 4支持多种模板引擎,比如Thymeleaf、FreeMarker、Groovy、Mustache等。

```java
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
// 传统MVC控制器,返回视图名称
@Controller
public class PageController {
    // 返回Thymeleaf模板
    @GetMapping("/user/list")
    public String userList(Model model) {
        model.addAttribute("users", getUserList());  // 往模型里添加数据
        return "user/list";  // 返回视图名称,框架会找templates/user/list.html
    }
    private List<User> getUserList() {
        // 模拟获取用户列表
        return Arrays.asList(
            new User("张三", 25),
            new User("李四", 30)
        );
    }
}
```

## 消息转换器配置

Spring Boot 4默认会用Jackson来处理JSON序列化和反序列化,但是你可以自定义消息转换器,比如支持XML、支持自定义日期格式等。

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.util.List;
// 自定义消息转换器配置
@Configuration
public class MessageConverterConfig implements WebMvcConfigurer {
    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        // 创建Jackson转换器
        MappingJackson2HttpMessageConverter jsonConverter = new MappingJackson2HttpMessageConverter();
        ObjectMapper objectMapper = new ObjectMapper();  // 创建ObjectMapper对象
        objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);  // 日期不转时间戳
        objectMapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));  // 设置日期格式
        jsonConverter.setObjectMapper(objectMapper);  // 设置自定义的ObjectMapper
        converters.add(jsonConverter);  // 添加到转换器列表
    }
}
```

## 测试MVC控制器

Spring Boot 4提供了`@WebMvcTest`注解来测试MVC控制器,它会自动配置Spring MVC基础设施,但是只扫描控制器相关的Bean,不会加载完整的应用上下文,测试速度贼快;比`@SpringBootTest`轻量多了。

### 完整的测试类示例

```java
package com.example.demo.controller;
import com.example.demo.dto.UserCreateRequest;
import com.example.demo.dto.UserInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import static org.assertj.core.api.Assertions.assertThat;
/**
 * 用户控制器测试类
 * @WebMvcTest 只加载MVC相关配置,不加载完整的Spring上下文
 * 测试速度更快,适合单元测试
 */
@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired
    private MockMvcTester mvc;  // 注入MockMvc测试工具(Spring Boot 4新特性)
    @Autowired
    private ObjectMapper objectMapper;  // JSON序列化工具
    /**
     * 测试hello接口
     */
    @Test
    void testHello() {
        // 发送GET请求到/api/users/hello
        assertThat(mvc.get()
                .uri("/api/users/hello")
                .accept(MediaType.TEXT_PLAIN))
            .hasStatusOk()  // 断言状态码是200
            .hasBodyTextEqualTo("Hello Spring Boot 4 MVC!");  // 断言响应内容
    }
    /**
     * 测试获取用户信息接口
     */
    @Test
    void testGetUserInfo() {
        // 发送GET请求到/api/users/info
        assertThat(mvc.get()
                .uri("/api/users/info")
                .accept(MediaType.APPLICATION_JSON))
            .hasStatusOk()  // 断言状态码是200
            .hasBodyJsonPath("$.name", "鹏磊")  // 断言JSON字段name的值
            .hasBodyJsonPath("$.age", 30)  // 断言JSON字段age的值
            .hasBodyJsonPath("$.email").exists();  // 断言email字段存在
    }
    /**
     * 测试创建用户接口
     */
    @Test
    void testCreateUser() throws Exception {
        // 创建请求对象
        UserCreateRequest request = new UserCreateRequest();
        request.setName("测试用户");
        request.setAge(25);
        request.setEmail("test@example.com");
        // 发送POST请求
        assertThat(mvc.post()
                .uri("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(request)))  // 将对象转成JSON字符串
            .hasStatusCreated()  // 断言状态码是201
            .hasBodyJsonPath("$.id").exists()  // 断言返回的用户有ID
            .hasBodyJsonPath("$.name", "测试用户")  // 断言用户名正确
            .hasBodyJsonPath("$.createTime").exists();  // 断言创建时间存在
    }
    /**
     * 测试创建用户参数校验失败
     */
    @Test
    void testCreateUserValidationFailed() throws Exception {
        // 创建无效的请求对象(邮箱格式错误)
        UserCreateRequest request = new UserCreateRequest();
        request.setName("测试用户");
        request.setAge(25);
        request.setEmail("invalid-email");  // 无效的邮箱格式
        // 发送POST请求,应该返回400错误
        assertThat(mvc.post()
                .uri("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(request)))
            .hasStatusBadRequest()  // 断言状态码是400
            .hasBodyJsonPath("$.code", 400)  // 断言错误码是400
            .hasBodyJsonPath("$.errors").exists();  // 断言有错误详情
    }
    /**
     * 测试根据ID获取用户
     */
    @Test
    void testGetUserById() {
        // 先创建一个用户
        UserCreateRequest request = new UserCreateRequest();
        request.setName("测试用户");
        request.setAge(25);
        request.setEmail("test@example.com");
        // 创建用户
        var createResponse = mvc.post()
                .uri("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(request));
        // 获取创建的用户ID(实际应该从响应中提取)
        // 这里简化处理,假设ID是1
        // 根据ID获取用户
        assertThat(mvc.get()
                .uri("/api/users/1")
                .accept(MediaType.APPLICATION_JSON))
            .hasStatusOk()
            .hasBodyJsonPath("$.id", 1)
            .hasBodyJsonPath("$.name", "测试用户");
    }
    /**
     * 测试获取不存在的用户
     */
    @Test
    void testGetUserByIdNotFound() {
        // 获取不存在的用户ID
        assertThat(mvc.get()
                .uri("/api/users/99999")
                .accept(MediaType.APPLICATION_JSON))
            .hasStatusNotFound();  // 断言状态码是404
    }
    /**
     * 测试更新用户
     */
    @Test
    void testUpdateUser() throws Exception {
        // 先创建用户
        UserCreateRequest createRequest = new UserCreateRequest();
        createRequest.setName("原始用户");
        createRequest.setAge(20);
        createRequest.setEmail("original@example.com");
        mvc.post()
            .uri("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .body(objectMapper.writeValueAsString(createRequest));
        // 更新用户信息
        UserCreateRequest updateRequest = new UserCreateRequest();
        updateRequest.setName("更新后的用户");
        updateRequest.setAge(30);
        updateRequest.setEmail("updated@example.com");
        assertThat(mvc.put()
                .uri("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(updateRequest)))
            .hasStatusOk()
            .hasBodyJsonPath("$.name", "更新后的用户")
            .hasBodyJsonPath("$.age", 30);
    }
    /**
     * 测试删除用户
     */
    @Test
    void testDeleteUser() {
        // 先创建用户
        UserCreateRequest request = new UserCreateRequest();
        request.setName("待删除用户");
        request.setAge(25);
        request.setEmail("delete@example.com");
        mvc.post()
            .uri("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .body(objectMapper.writeValueAsString(request));
        // 删除用户
        assertThat(mvc.delete()
                .uri("/api/users/1"))
            .hasStatusNoContent();  // 断言状态码是204
    }
}
```

### 集成测试示例

如果需要进行集成测试(测试完整的Spring上下文),可以使用`@SpringBootTest`:

```java
package com.example.demo.controller;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
/**
 * 集成测试
 * @SpringBootTest 会加载完整的Spring上下文
 * @AutoConfigureMockMvc 自动配置MockMvc
 */
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;  // 注入MockMvc
    @Test
    void testHelloIntegration() throws Exception {
        // 使用MockMvcRequestBuilders构建请求
        mockMvc.perform(MockMvcRequestBuilders.get("/api/users/hello"))
                .andExpect(status().isOk())  // 断言状态码是200
                .andExpect(content().string("Hello Spring Boot 4 MVC!"));  // 断言响应内容
    }
}
```

## 最佳实践和注意事项

### 1. 不要使用@EnableWebMvc

如果你用了`@EnableWebMvc`,Spring Boot的自动配置就失效了,你就得手动配置所有东西,这不是给自己找罪受吗;除非你真的需要完全控制Spring MVC的配置,否则别用这个注解。

### 2. 合理使用@RestController和@Controller

RESTful API用`@RestController`,需要返回视图的用`@Controller`,别混着用;`@RestController`会自动给所有方法加上`@ResponseBody`,返回的数据会转成JSON。

### 3. 统一异常处理

用`@ControllerAdvice`统一处理异常,别让异常信息直接暴露给前端,不安全也不好看;生产环境不要把详细的异常堆栈信息返回给客户端。

### 4. 静态资源管理

静态资源放在`src/main/resources/static`目录下,Spring Boot会自动处理;生产环境建议用CDN或者Nginx来处理静态资源,减轻应用服务器压力。

### 5. 接口版本控制

大型项目建议在URL里加版本号,比如`/api/v1/users`,方便后续升级;这样新老版本可以共存,逐步迁移。

```java
@RestController
@RequestMapping("/api/v1/users")  // 版本号在路径中
public class UserV1Controller {
    // v1版本的接口
}
@RestController
@RequestMapping("/api/v2/users")  // 新版本
public class UserV2Controller {
    // v2版本的接口,可以有不同的实现
}
```

### 6. 参数校验

用`@Valid`和Bean Validation来校验请求参数,别在控制器里写一堆if判断;校验逻辑写在DTO类上,代码更清晰。

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    /**
     * 创建用户接口,使用@Valid进行参数校验
     * 如果参数校验失败,框架会自动返回400错误,不需要手动处理
     */
    @PostMapping
    public ResponseEntity<UserInfo> createUser(@Valid @RequestBody UserCreateRequest request) {
        // 如果参数校验失败,框架会自动返回400错误,不会执行到这里
        UserInfo user = new UserInfo();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        return ResponseEntity.ok(user);
    }
}
```

### 7. 使用统一响应格式

定义统一的响应格式,方便前端处理;不要有的接口返回对象,有的返回字符串,搞得前端很懵逼。

```java
package com.example.demo.dto;
/**
 * 统一响应格式
 */
public class ApiResponse<T> {
    private Integer code;  // 状态码,200表示成功
    private String message;  // 提示信息
    private T data;  // 响应数据
    private Long timestamp;  // 时间戳
    // 成功响应
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(200);
        response.setMessage("操作成功");
        response.setData(data);
        response.setTimestamp(System.currentTimeMillis());
        return response;
    }
    // 失败响应
    public static <T> ApiResponse<T> fail(Integer code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMessage(message);
        response.setTimestamp(System.currentTimeMillis());
        return response;
    }
    // Getter和Setter方法
    public Integer getCode() {
        return code;
    }
    public void setCode(Integer code) {
        this.code = code;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public T getData() {
        return data;
    }
    public void setData(T data) {
        this.data = data;
    }
    public Long getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
}
```

### 8. 使用Swagger/OpenAPI生成API文档

大型项目建议集成Swagger或者SpringDoc OpenAPI,自动生成API文档,方便前端对接和测试。

```xml
<!-- 在pom.xml中添加依赖 -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.2.0</version>
</dependency>
```

```java
package com.example.demo.config;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Spring Boot 4 MVC API文档")
                        .version("1.0.0")
                        .description("Spring Boot 4整合Spring MVC示例项目API文档"));
    }
}
```

启动项目后访问 `http://localhost:8080/swagger-ui.html` 就能看到API文档了。

### 9. 生产环境配置优化

生产环境记得配置这些:

```yaml
# application-prod.yml
server:
  port: 8080
  compression:
    enabled: true  # 启用响应压缩
    mime-types: application/json,application/xml,text/html,text/xml,text/plain
  error:
    include-stacktrace: never  # 不包含堆栈信息
    include-message: never  # 不包含错误信息
spring:
  mvc:
    throw-exception-if-no-handler-found: true  # 找不到处理器时抛出异常
  web:
    resources:
      add-mappings: false  # 禁用默认的静态资源映射(用Nginx处理)
logging:
  level:
    root: WARN  # 生产环境日志级别设高一点
    com.example.demo: INFO
```

### 10. 性能优化建议

1. **使用连接池**: 如果连接数据库,记得配置连接池,别用默认的。
2. **启用HTTP/2**: 如果支持,启用HTTP/2协议,性能更好。
3. **合理使用缓存**: 对于频繁查询的数据,使用缓存减少数据库压力。
4. **异步处理**: 对于耗时操作,使用`@Async`异步处理,别阻塞主线程。

```java
@Service
public class UserService {
    @Async  // 异步执行
    public CompletableFuture<UserInfo> getUserInfoAsync(Long id) {
        // 耗时操作
        UserInfo user = getUserById(id);
        return CompletableFuture.completedFuture(user);
    }
}
```

### 11. 安全建议

1. **使用HTTPS**: 生产环境必须使用HTTPS,别用HTTP。
2. **参数校验**: 所有用户输入都要校验,防止SQL注入、XSS攻击。
3. **敏感信息**: 不要在日志里打印敏感信息,比如密码、token等。
4. **CORS配置**: 跨域配置要严格,别用`allowedOrigins("*")`,指定具体的域名。

### 12. 测试建议

1. **单元测试**: 每个控制器方法都要写单元测试,覆盖率至少80%以上。
2. **集成测试**: 关键业务流程要写集成测试,确保整个流程没问题。
3. **API测试**: 使用Postman或者Apifox等工具测试API,确保接口正常工作。

## 总结

Spring Boot 4整合Spring MVC其实没啥难度,主要是理解自动配置的机制,知道啥时候该自定义配置,啥时候用默认的就行;大部分场景下默认配置就够用了,只有特殊需求才需要自定义;兄弟们在实际项目中多实践,遇到问题多查文档,慢慢就熟悉了;记住一点,别瞎折腾,能用默认配置就别自己写,省事还不容易出错。
