# 05、Spring Boot 4 整合 WebFlux 完整教程
- 来源：https://ddkk.com/springboot/4-action/5.html
- 分类：Spring Boot 4 整合教程
- 分组：一、核心框架与模板
- 日期：2025-12-08
现在高并发场景越来越多了,传统的Spring MVC基于Servlet的阻塞模型就不够用了,线程池再大也扛不住;WebFlux是Spring 5.0引入的响应式Web框架,完全异步非阻塞,基于Reactor项目实现Reactive Streams规范,性能贼强;Spring Boot 4对WebFlux的支持也很完善,自动配置给你整得明明白白的,鹏磊今天就给兄弟们聊聊咋整合的。

WebFlux最大的优势就是非阻塞、高并发,一个线程可以处理大量请求,特别适合IO密集型应用;它支持两种编程模型,一种是注解式的(类似Spring MVC),一种是函数式的(更灵活),你可以根据项目需求选择。

## 项目搭建和依赖配置

### 创建Maven项目

项目结构跟之前差不多:

```plaintext
spring-boot-webflux-demo/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java
│   │   │               ├── config/          # 配置类目录
│   │   │               ├── controller/     # 控制器目录(注解式)
│   │   │               ├── router/         # 路由配置目录(函数式)
│   │   │               ├── handler/        # 处理器目录(函数式)
│   │   │               ├── service/        # 服务层目录
│   │   │               └── dto/            # 数据传输对象目录
│   │   └── resources/
│   │       ├── application.yml
│   │       └── static/              # 静态资源目录
│   └── test/
```

### pom.xml完整配置

WebFlux的依赖主要是`spring-boot-starter-webflux`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-webflux-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 WebFlux Demo</name>
    <description>Spring Boot 4整合WebFlux示例项目</description>
    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <!-- WebFlux Starter: 响应式Web框架 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webflux</artifactId>
        </dependency>
        <!-- Spring Boot Validation: 参数校验 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <!-- Spring Boot DevTools: 开发工具 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <!-- Lombok: 简化代码 -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- Spring Boot Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Reactor Test: 响应式测试工具 -->
        <dependency>
            <groupId>io.projectreactor</groupId>
            <artifactId>reactor-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
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

WebFlux的配置项不多,主要是端口、编码啥的:

```yaml
server:
  port: 8080
spring:
  application:
    name: spring-boot-webflux-demo
  # WebFlux配置
  webflux:
    # 静态资源路径
    static-path-pattern: /**
    # 基础路径
    base-path: /
# 日志配置
logging:
  level:
    root: INFO
    com.example.demo: DEBUG
    org.springframework.web.reactive: DEBUG  # WebFlux日志
    reactor.netty: DEBUG  # Netty日志
```

### 启动类配置

启动类跟之前一样:

```java
package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * Spring Boot 4 WebFlux应用启动类
 */
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("Spring Boot 4 WebFlux应用启动成功!");
    }
}
```

## Spring Boot 4的WebFlux自动配置

Spring Boot 4会自动配置WebFlux,核心类是`WebFluxAutoConfiguration`;它会自动创建`HttpHandler`、`WebHandler`等Bean,你基本不用手动配置。

自动配置会做这些事:

- 自动配置Netty作为响应式Web服务器(默认)
- 配置`HttpHandler`来处理HTTP请求
- 配置消息编解码器(JSON、XML等)
- 配置静态资源处理
- 支持注解式和函数式两种编程模型

## 注解式编程模型

注解式模型跟Spring MVC很像,用起来很熟悉,上手快。

### 响应式控制器

```java
package com.example.demo.controller;
import com.example.demo.dto.User;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
/**
 * 用户控制器(响应式)
 * 使用@RestController注解,类似Spring MVC
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    // 模拟数据存储
    private List<User> users = new ArrayList<>();
    /**
     * 获取所有用户
     * 返回Flux<User>,表示多个用户的流
     */
    @GetMapping
    public Flux<User> getAllUsers() {
        return Flux.fromIterable(users)  // 从集合创建Flux
                .delayElements(Duration.ofMillis(100));  // 模拟延迟,演示非阻塞
    }
    /**
     * 根据ID获取用户
     * 返回Mono<User>,表示单个用户
     */
    @GetMapping("/{id}")
    public Mono<User> getUserById(@PathVariable Long id) {
        return Mono.justOrEmpty(users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst());  // 返回Optional,转换为Mono
    }
    /**
     * 创建用户
     * 接收Mono<User>,表示单个用户的流
     */
    @PostMapping
    public Mono<User> createUser(@RequestBody Mono<User> userMono) {
        return userMono
                .doOnNext(user -> {
                    user.setId(System.currentTimeMillis());  // 设置ID
                    user.setCreateTime(LocalDateTime.now());  // 设置创建时间
                    users.add(user);  // 添加到列表
                })
                .log();  // 记录日志
    }
    /**
     * 更新用户
     */
    @PutMapping("/{id}")
    public Mono<User> updateUser(@PathVariable Long id, @RequestBody Mono<User> userMono) {
        return userMono
                .flatMap(user -> {
                    // 查找并更新用户
                    return Mono.justOrEmpty(users.stream()
                            .filter(u -> u.getId().equals(id))
                            .findFirst()
                            .map(existing -> {
                                existing.setName(user.getName());
                                existing.setEmail(user.getEmail());
                                existing.setAge(user.getAge());
                                return existing;
                            }));
                });
    }
    /**
     * 删除用户
     */
    @DeleteMapping("/{id}")
    public Mono<Void> deleteUser(@PathVariable Long id) {
        return Mono.fromRunnable(() -> users.removeIf(u -> u.getId().equals(id)))
                .then();  // 返回Mono<Void>
    }
    /**
     * 流式返回用户列表(Server-Sent Events)
     * 客户端可以实时接收数据流
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<User> streamUsers() {
        return Flux.fromIterable(users)
                .delayElements(Duration.ofSeconds(1))  // 每秒发送一个用户
                .repeat();  // 重复发送
    }
    /**
     * 搜索用户
     * 演示响应式流处理
     */
    @GetMapping("/search")
    public Flux<User> searchUsers(@RequestParam String keyword) {
        return Flux.fromIterable(users)
                .filter(user -> user.getName().contains(keyword) || 
                              user.getEmail().contains(keyword))  // 过滤
                .take(10);  // 最多返回10个
    }
}
```

### 用户实体类

```java
package com.example.demo.dto;
import java.time.LocalDateTime;
/**
 * 用户实体类
 */
public class User {
    private Long id;  // 用户ID
    private String name;  // 用户名
    private String email;  // 邮箱
    private Integer age;  // 年龄
    private LocalDateTime createTime;  // 创建时间
    // 构造函数
    public User() {
    }
    public User(Long id, String name, String email, Integer age) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.age = age;
        this.createTime = LocalDateTime.now();
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
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public Integer getAge() {
        return age;
    }
    public void setAge(Integer age) {
        this.age = age;
    }
    public LocalDateTime getCreateTime() {
        return createTime;
    }
    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
```

## 函数式编程模型

函数式模型更灵活,路由和处理逻辑分离,适合复杂的路由场景。

### 路由配置

```java
package com.example.demo.router;
import com.example.demo.handler.UserHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;
import static org.springframework.web.reactive.function.server.RequestPredicates.*;
/**
 * 路由配置类
 * 使用函数式编程模型定义路由
 */
@Configuration
public class UserRouter {
    /**
     * 定义用户相关的路由
     */
    @Bean
    public RouterFunction<ServerResponse> userRoutes(UserHandler userHandler) {
        return RouterFunctions.route()
                // GET /api/users - 获取所有用户
                .GET("/api/users", userHandler::getAllUsers)
                // GET /api/users/{id} - 根据ID获取用户
                .GET("/api/users/{id}", userHandler::getUserById)
                // POST /api/users - 创建用户
                .POST("/api/users", userHandler::createUser)
                // PUT /api/users/{id} - 更新用户
                .PUT("/api/users/{id}", userHandler::updateUser)
                // DELETE /api/users/{id} - 删除用户
                .DELETE("/api/users/{id}", userHandler::deleteUser)
                // GET /api/users/stream - 流式返回用户
                .GET("/api/users/stream", accept(org.springframework.http.MediaType.TEXT_EVENT_STREAM), 
                     userHandler::streamUsers)
                .build();  // 构建路由
    }
}
```

### 处理器实现

```java
package com.example.demo.handler;
import com.example.demo.dto.User;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
/**
 * 用户处理器
 * 处理用户相关的请求
 */
@Component
public class UserHandler {
    // 模拟数据存储
    private List<User> users = new ArrayList<>();
    /**
     * 获取所有用户
     */
    public Mono<ServerResponse> getAllUsers(ServerRequest request) {
        Flux<User> userFlux = Flux.fromIterable(users)
                .delayElements(Duration.ofMillis(100));  // 模拟延迟
        return ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(userFlux, User.class);  // 返回响应体
    }
    /**
     * 根据ID获取用户
     */
    public Mono<ServerResponse> getUserById(ServerRequest request) {
        Long id = Long.parseLong(request.pathVariable("id"));  // 获取路径变量
        Mono<User> userMono = Mono.justOrEmpty(users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst());
        return userMono
                .flatMap(user -> ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(user))  // 返回单个对象
                .switchIfEmpty(ServerResponse.notFound().build());  // 找不到返回404
    }
    /**
     * 创建用户
     */
    public Mono<ServerResponse> createUser(ServerRequest request) {
        Mono<User> userMono = request.bodyToMono(User.class)  // 解析请求体
                .doOnNext(user -> {
                    user.setId(System.currentTimeMillis());
                    user.setCreateTime(LocalDateTime.now());
                    users.add(user);
                });
        return ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(userMono, User.class);
    }
    /**
     * 更新用户
     */
    public Mono<ServerResponse> updateUser(ServerRequest request) {
        Long id = Long.parseLong(request.pathVariable("id"));
        Mono<User> userMono = request.bodyToMono(User.class)
                .flatMap(user -> {
                    return Mono.justOrEmpty(users.stream()
                            .filter(u -> u.getId().equals(id))
                            .findFirst()
                            .map(existing -> {
                                existing.setName(user.getName());
                                existing.setEmail(user.getEmail());
                                existing.setAge(user.getAge());
                                return existing;
                            }));
                });
        return userMono
                .flatMap(user -> ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(user))
                .switchIfEmpty(ServerResponse.notFound().build());
    }
    /**
     * 删除用户
     */
    public Mono<ServerResponse> deleteUser(ServerRequest request) {
        Long id = Long.parseLong(request.pathVariable("id"));
        boolean removed = users.removeIf(u -> u.getId().equals(id));
        if (removed) {
            return ServerResponse.noContent().build();  // 204 No Content
        } else {
            return ServerResponse.notFound().build();  // 404 Not Found
        }
    }
    /**
     * 流式返回用户(Server-Sent Events)
     */
    public Mono<ServerResponse> streamUsers(ServerRequest request) {
        Flux<User> userFlux = Flux.fromIterable(users)
                .delayElements(Duration.ofSeconds(1))
                .repeat();
        return ServerResponse.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .body(userFlux, User.class);
    }
}
```

## 响应式编程基础

### Mono和Flux

WebFlux基于Reactor项目,核心是`Mono`和`Flux`:

- **Mono**: 表示0或1个元素的异步序列
- **Flux**: 表示0到N个元素的异步序列

```java
// Mono示例
Mono<String> mono = Mono.just("Hello");  // 单个值
Mono<String> emptyMono = Mono.empty();  // 空值
Mono<String> errorMono = Mono.error(new RuntimeException("错误"));  // 错误
// Flux示例
Flux<String> flux = Flux.just("A", "B", "C");  // 多个值
Flux<Integer> rangeFlux = Flux.range(1, 10);  // 范围
Flux<Long> intervalFlux = Flux.interval(Duration.ofSeconds(1));  // 间隔生成
```

### 常用操作符

```java
// 转换操作
Flux<String> upperCase = flux.map(String::toUpperCase);  // 映射
Flux<String> flatMapped = flux.flatMap(s -> Flux.just(s, s));  // 扁平化
// 过滤操作
Flux<String> filtered = flux.filter(s -> s.length() > 3);  // 过滤
Flux<String> distinct = flux.distinct();  // 去重
Flux<String> take = flux.take(5);  // 取前N个
// 组合操作
Flux<String> merged = flux1.mergeWith(flux2);  // 合并
Flux<String> zipped = Flux.zip(flux1, flux2, (a, b) -> a + b);  // 组合
// 错误处理
Flux<String> onError = flux.onErrorReturn("默认值");  // 错误时返回默认值
Flux<String> retry = flux.retry(3);  // 重试3次
```

## WebClient使用

WebClient是WebFlux的HTTP客户端,完全响应式,可以用来调用其他服务。

### WebClient配置

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
/**
 * WebClient配置类
 */
@Configuration
public class WebClientConfig {
    /**
     * 创建WebClient Bean
     */
    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        return builder
                .baseUrl("http://localhost:8080")  // 基础URL
                .defaultHeader("User-Agent", "WebFlux-Client")  // 默认请求头
                .build();
    }
}
```

### 使用WebClient

```java
package com.example.demo.service;
import com.example.demo.dto.User;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
/**
 * 用户服务(使用WebClient调用外部API)
 */
@Service
public class UserService {
    private final WebClient webClient;
    public UserService(WebClient webClient) {
        this.webClient = webClient;
    }
    /**
     * 获取所有用户
     */
    public Flux<User> getAllUsers() {
        return webClient.get()
                .uri("/api/users")  // 请求路径
                .retrieve()  // 获取响应
                .bodyToFlux(User.class);  // 转换为Flux<User>
    }
    /**
     * 根据ID获取用户
     */
    public Mono<User> getUserById(Long id) {
        return webClient.get()
                .uri("/api/users/{id}", id)  // 路径变量
                .retrieve()
                .bodyToMono(User.class);  // 转换为Mono<User>
    }
    /**
     * 创建用户
     */
    public Mono<User> createUser(User user) {
        return webClient.post()
                .uri("/api/users")
                .bodyValue(user)  // 请求体
                .retrieve()
                .bodyToMono(User.class);
    }
    /**
     * 更新用户
     */
    public Mono<User> updateUser(Long id, User user) {
        return webClient.put()
                .uri("/api/users/{id}", id)
                .bodyValue(user)
                .retrieve()
                .bodyToMono(User.class);
    }
    /**
     * 删除用户
     */
    public Mono<Void> deleteUser(Long id) {
        return webClient.delete()
                .uri("/api/users/{id}", id)
                .retrieve()
                .bodyToMono(Void.class);
    }
}
```

## 全局异常处理

WebFlux的异常处理跟Spring MVC不太一样,需要用`@ControllerAdvice`或者函数式的方式。

### 注解式异常处理

```java
package com.example.demo.exception;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import reactor.core.publisher.Mono;
/**
 * 全局异常处理器
 */
@ControllerAdvice
public class GlobalExceptionHandler {
    /**
     * 处理运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    public Mono<ResponseEntity<ErrorResponse>> handleRuntimeException(RuntimeException e) {
        ErrorResponse error = new ErrorResponse();
        error.setCode(500);
        error.setMessage(e.getMessage());
        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error));
    }
    /**
     * 处理参数异常
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public Mono<ResponseEntity<ErrorResponse>> handleIllegalArgumentException(IllegalArgumentException e) {
        ErrorResponse error = new ErrorResponse();
        error.setCode(400);
        error.setMessage("参数错误: " + e.getMessage());
        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error));
    }
}
/**
 * 错误响应实体
 */
class ErrorResponse {
    private Integer code;
    private String message;
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
}
```

## 测试WebFlux应用

WebFlux的测试用`WebTestClient`,完全响应式。

### 测试示例

```java
package com.example.demo.controller;
import com.example.demo.dto.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
/**
 * WebFlux控制器测试
 */
@WebFluxTest(UserController.class)
class UserControllerTest {
    @Autowired
    private WebTestClient webTestClient;  // WebFlux测试客户端
    @Test
    void testGetAllUsers() {
        webTestClient.get()
                .uri("/api/users")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()  // 发送请求
                .expectStatus().isOk()  // 断言状态码
                .expectHeader().contentType(MediaType.APPLICATION_JSON)  // 断言Content-Type
                .expectBodyList(User.class);  // 断言响应体类型
    }
    @Test
    void testCreateUser() {
        User user = new User(null, "测试用户", "test@example.com", 25);
        webTestClient.post()
                .uri("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(user)
                .exchange()
                .expectStatus().isOk()
                .expectBody(User.class)
                .value(u -> {
                    assert u.getName().equals("测试用户");
                });
    }
}
```

## 最佳实践和注意事项

### 1. 选择合适的编程模型

注解式模型适合从Spring MVC迁移过来的项目,函数式模型适合新项目或者复杂路由场景;两种模型可以混用,但是建议统一用一种。

### 2. 理解响应式编程

WebFlux的核心是响应式编程,要理解`Mono`和`Flux`的使用,理解非阻塞、背压等概念;如果团队不熟悉响应式编程,建议先学习Reactor。

### 3. 避免阻塞操作

WebFlux是非阻塞的,不要在响应式链中调用阻塞操作(比如同步IO、Thread.sleep等),否则会失去响应式的优势;如果必须用阻塞操作,要用`publishOn`切换到专门的线程池。

### 4. 错误处理

要做好错误处理,使用`onErrorReturn`、`onErrorResume`等操作符处理错误;全局异常处理器也要配置好。

### 5. 性能优化

WebFlux适合IO密集型应用,CPU密集型应用可能不如传统MVC;要根据实际场景选择合适的框架。

### 6. 数据库访问

如果要用响应式数据库访问,需要用R2DBC或者MongoDB Reactive;传统的JDBC是阻塞的,不适合WebFlux。

### 7. 测试

WebFlux的测试用`WebTestClient`,跟传统的`MockMvc`不一样;要熟悉响应式测试的写法。

### 8. 监控和调试

响应式应用的调试比传统应用难,建议使用日志和监控工具;Spring Boot Actuator支持WebFlux,可以监控应用状态。

## 总结

Spring Boot 4整合WebFlux其实很简单,主要就是加个依赖,然后写响应式控制器或者函数式路由就行了;WebFlux适合高并发、IO密集型场景,性能比传统MVC强很多;关键是要理解响应式编程的思想,理解`Mono`和`Flux`的使用;鹏磊在实际项目中多练练,慢慢就熟悉了;记住一点,WebFlux不是万能的,要根据实际场景选择合适的框架,CPU密集型应用还是用传统MVC比较好。
