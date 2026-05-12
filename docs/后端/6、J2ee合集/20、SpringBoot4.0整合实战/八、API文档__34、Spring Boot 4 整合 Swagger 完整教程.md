# 34、Spring Boot 4 整合 Swagger 完整教程
- 来源：https://ddkk.com/springboot/4-action/34.html
- 分类：Spring Boot 4 整合教程
- 分组：八、API文档
- 日期：2025-12-08
写API接口的时候最烦的就是写文档,前端兄弟天天催你"接口文档呢?参数是啥?返回值是啥?",你写一遍文档,改个接口又得改文档,累死累活还容易出错;后来听说Swagger这玩意儿不错,能自动生成API文档,还能在线测试接口,功能全、可靠性高、社区活跃,是Java生态里最流行的API文档工具;但是直接用Swagger写,那叫一个复杂,配置注解、写OpenAPI规范、集成UI界面,一堆配置写得人头疼;后来发现Spring Boot直接把这些都封装好了,用起来贼简单;现在Spring Boot 4出来了,整合Swagger更是方便得不行,SpringDoc OpenAPI自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋用@Operation、@ApiResponse、分组管理、安全配置这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实Swagger在Spring Boot里早就支持了,以前用的是Springfox,但是Spring Boot 3开始就不支持了,现在都用SpringDoc OpenAPI;你只要加个`springdoc-openapi-starter-webmvc-ui`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置分组、自定义UI、集成安全认证、导出文档这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Swagger基础概念

### Swagger是啥玩意儿

Swagger是一套用于设计、构建、文档化和测试RESTful API的工具集;Swagger的核心特性包括:

1. **自动生成文档**: 通过注解自动生成API文档,不需要手动维护
2. **在线测试**: 提供Swagger UI界面,可以直接在浏览器里测试接口
3. **OpenAPI规范**: 遵循OpenAPI 3.0规范,兼容性好
4. **代码生成**: 可以根据OpenAPI规范生成客户端代码
5. **交互式文档**: 文档和测试一体化,方便前端对接
6. **多格式支持**: 支持JSON和YAML格式的OpenAPI规范

### SpringDoc OpenAPI是啥

SpringDoc OpenAPI是Spring Boot官方推荐的Swagger集成方案,专门为Spring Boot 3+设计;SpringDoc OpenAPI的核心特性包括:

1. **自动配置**: Spring Boot自动配置,无需手动配置
2. **零配置启动**: 添加依赖后即可使用,默认配置就能用
3. **注解驱动**: 使用标准OpenAPI注解,代码即文档
4. **多UI支持**: 支持Swagger UI、ReDoc等多种UI界面
5. **分组管理**: 支持多个API分组,方便大型项目管理
6. **安全集成**: 支持Spring Security、JWT等安全认证
7. **性能优化**: 运行时扫描,性能好,不影响启动速度

### SpringDoc和Springfox的区别

1. **Spring Boot版本**: SpringDoc支持Spring Boot 3+;Springfox只支持Spring Boot 2.x
2. **OpenAPI版本**: SpringDoc支持OpenAPI 3.0+;Springfox支持Swagger 2.0
3. **自动配置**: SpringDoc完全自动配置;Springfox需要手动配置
4. **性能**: SpringDoc性能更好,启动更快;Springfox启动慢
5. **维护状态**: SpringDoc活跃维护;Springfox已经停止维护
6. **注解**: SpringDoc使用标准OpenAPI注解;Springfox使用Swagger注解

### Swagger UI访问地址

添加依赖后,Swagger UI会自动部署,默认访问地址:

- **Swagger UI**: `http://localhost:8080/swagger-ui.html` 或 `http://localhost:8080/swagger-ui/index.html`
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`
- **OpenAPI YAML**: `http://localhost:8080/v3/api-docs.yaml`

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-swagger-demo/
├── pom.xml                          # Maven配置文件
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── Application.java          # 启动类
│   │   │               ├── entity/                   # 实体类目录
│   │   │               ├── dto/                      # 数据传输对象目录
│   │   │               ├── controller/               # 控制器目录
│   │   │               └── config/                   # 配置类目录
│   │   └── resources/
│   │       └── application.yml       # 配置文件
│   └── test/
└── README.md
```

### 添加Maven依赖

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且SpringDoc OpenAPI最新版本已经支持Spring Boot 4了。

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
    <artifactId>spring-boot-swagger-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Swagger Demo</name>
    <description>Spring Boot 4整合Swagger示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <!-- SpringDoc OpenAPI版本,支持Spring Boot 4 -->
        <springdoc.version>2.8.13</springdoc.version>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- SpringDoc OpenAPI UI: 包含Swagger UI和OpenAPI文档生成 -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>${springdoc.version}</version>
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

### 基础配置文件

在`application.yml`中添加基础配置:

```yaml
server:
  port: 8080  # 服务端口
spring:
  application:
    name: spring-boot-swagger-demo  # 应用名称
# SpringDoc OpenAPI配置
springdoc:
  api-docs:
    path: /v3/api-docs  # OpenAPI JSON文档路径,默认就是/v3/api-docs
    enabled: true  # 启用API文档生成
  swagger-ui:
    path: /swagger-ui.html  # Swagger UI访问路径,默认是/swagger-ui.html
    enabled: true  # 启用Swagger UI
    tags-sorter: alpha  # 标签排序方式,alpha表示按字母排序
    operations-sorter: alpha  # 操作排序方式
  show-actuator: false  # 是否显示Actuator端点,默认false
```

## 基础使用

### 创建实体类

先创建几个实体类,后面用来演示:

```java
package com.example.demo.entity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;
/**
 * 用户实体类
 * @Schema注解用于描述实体类,在Swagger文档中显示
 */
@Data
@Schema(description = "用户信息")
public class User {
    @Schema(description = "用户ID", example = "1")
    private Long id;  // 用户ID
    @Schema(description = "用户名", example = "penglei", required = true)
    private String username;  // 用户名
    @Schema(description = "邮箱", example = "penglei@example.com")
    private String email;  // 邮箱
    @Schema(description = "年龄", example = "30", minimum = "1", maximum = "150")
    private Integer age;  // 年龄
    @Schema(description = "创建时间")
    private LocalDateTime createTime;  // 创建时间
}
```

```java
package com.example.demo.dto;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
/**
 * 用户创建请求DTO
 * 用于接收创建用户的请求参数
 */
@Data
@Schema(description = "创建用户请求")
public class UserCreateRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度必须在3-20之间")
    @Schema(description = "用户名", example = "penglei", required = true)
    private String username;  // 用户名,必填,长度3-20
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Schema(description = "邮箱", example = "penglei@example.com", required = true)
    private String email;  // 邮箱,必填,必须是邮箱格式
    @NotNull(message = "年龄不能为空")
    @Schema(description = "年龄", example = "30", required = true, minimum = "1", maximum = "150")
    private Integer age;  // 年龄,必填,范围1-150
}
```

### 创建控制器

创建控制器,使用Swagger注解描述接口:

```java
package com.example.demo.controller;
import com.example.demo.dto.UserCreateRequest;
import com.example.demo.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/**
 * 用户控制器
 * @Tag注解用于给控制器分组,在Swagger UI中显示为标签
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理", description = "用户相关的CRUD操作接口")
public class UserController {
    // 模拟数据存储(实际项目中应该用Service和Repository)
    private List<User> users = new ArrayList<>();
    /**
     * 获取用户列表
     * @Operation注解用于描述接口操作,summary是简短描述,description是详细描述
     */
    @GetMapping
    @Operation(summary = "获取用户列表", description = "获取所有用户的列表信息")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "获取成功", 
                    content = @Content(schema = @Schema(implementation = User.class)))
    })
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(users);  // 返回用户列表
    }
    /**
     * 根据ID获取用户
     * @Parameter注解用于描述参数,description是参数描述,required表示是否必填
     */
    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取用户", description = "根据用户ID获取用户详细信息")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "获取成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在")
    })
    public ResponseEntity<User> getUserById(
            @Parameter(description = "用户ID", required = true, example = "1")
            @PathVariable Long id) {
        // 查找用户
        Optional<User> user = users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst();
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());  // 返回用户信息
        } else {
            return ResponseEntity.notFound().build();  // 返回404
        }
    }
    /**
     * 创建用户
     * @RequestBody表示请求体,会自动反序列化成UserCreateRequest对象
     */
    @PostMapping
    @Operation(summary = "创建用户", description = "创建一个新用户")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "创建成功"),
        @ApiResponse(responseCode = "400", description = "参数校验失败")
    })
    public ResponseEntity<User> createUser(
            @Valid @RequestBody UserCreateRequest request) {
        // 创建用户对象
        User user = new User();
        user.setId(System.currentTimeMillis());  // 使用时间戳作为ID
        user.setUsername(request.getUsername());  // 设置用户名
        user.setEmail(request.getEmail());  // 设置邮箱
        user.setAge(request.getAge());  // 设置年龄
        user.setCreateTime(LocalDateTime.now());  // 设置创建时间
        // 保存用户(实际项目中应该保存到数据库)
        users.add(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);  // 返回201状态码和用户信息
    }
    /**
     * 更新用户
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新用户", description = "根据ID更新用户信息")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "更新成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在")
    })
    public ResponseEntity<User> updateUser(
            @Parameter(description = "用户ID", required = true)
            @PathVariable Long id,
            @Valid @RequestBody UserCreateRequest request) {
        // 查找用户
        Optional<User> userOpt = users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst();
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setUsername(request.getUsername());  // 更新用户名
            user.setEmail(request.getEmail());  // 更新邮箱
            user.setAge(request.getAge());  // 更新年龄
            return ResponseEntity.ok(user);  // 返回更新后的用户
        } else {
            return ResponseEntity.notFound().build();  // 返回404
        }
    }
    /**
     * 删除用户
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除用户", description = "根据ID删除用户")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在")
    })
    public ResponseEntity<Void> deleteUser(
            @Parameter(description = "用户ID", required = true)
            @PathVariable Long id) {
        // 删除用户
        boolean removed = users.removeIf(u -> u.getId().equals(id));
        if (removed) {
            return ResponseEntity.noContent().build();  // 返回204状态码
        } else {
            return ResponseEntity.notFound().build();  // 返回404
        }
    }
}
```

### 启动应用

启动应用后,访问Swagger UI:

1. 打开浏览器,访问 `http://localhost:8080/swagger-ui.html`
2. 你会看到Swagger UI界面,左侧是API列表,右侧是接口详情
3. 点击接口可以展开查看详细信息,包括参数、返回值、示例等
4. 可以直接在界面上测试接口,输入参数后点击"Execute"按钮

## 高级配置

### 自定义OpenAPI信息

创建配置类,自定义OpenAPI文档信息:

```java
package com.example.demo.config;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;
/**
 * Swagger配置类
 * 用于自定义OpenAPI文档信息
 */
@Configuration
public class SwaggerConfig {
    /**
     * 自定义OpenAPI信息
     * 包括API标题、描述、版本、联系人等信息
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Spring Boot 4 Swagger API文档")  // API标题
                        .version("1.0.0")  // API版本
                        .description("这是Spring Boot 4整合Swagger的示例项目API文档")  // API描述
                        .contact(new Contact()
                                .name("鹏磊")  // 联系人姓名
                                .email("penglei@example.com")  // 联系人邮箱
                                .url("https://example.com"))  // 联系人网址
                        .license(new License()
                                .name("Apache 2.0")  // 许可证名称
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))  // 许可证URL
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")  // 开发环境服务器地址
                                .description("开发环境"),
                        new Server()
                                .url("https://api.example.com")  // 生产环境服务器地址
                                .description("生产环境")
                ));
    }
}
```

### 配置分组

大型项目通常有多个模块,可以配置多个API分组:

```java
package com.example.demo.config;
import io.swagger.v3.oas.models.OpenAPI;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * Swagger分组配置
 * 用于将API按模块分组显示
 */
@Configuration
public class SwaggerGroupConfig {
    /**
     * 用户管理API分组
     * 只包含/api/users路径下的接口
     */
    @Bean
    public GroupedOpenApi userApi() {
        return GroupedOpenApi.builder()
                .group("用户管理")  // 分组名称,在Swagger UI中显示
                .pathsToMatch("/api/users/**")  // 匹配的路径
                .build();
    }
    /**
     * 订单管理API分组
     * 只包含/api/orders路径下的接口
     */
    @Bean
    public GroupedOpenApi orderApi() {
        return GroupedOpenApi.builder()
                .group("订单管理")
                .pathsToMatch("/api/orders/**")
                .build();
    }
    /**
     * 所有API分组
     * 包含所有接口
     */
    @Bean
    public GroupedOpenApi allApi() {
        return GroupedOpenApi.builder()
                .group("所有API")
                .pathsToMatch("/api/**")
                .build();
    }
}
```

配置分组后,在Swagger UI右上角会有一个下拉框,可以选择不同的分组查看。

### 配置安全认证

如果接口需要认证,可以配置安全方案:

```java
package com.example.demo.config;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
/**
 * Swagger安全配置
 * 用于配置API的安全认证方案
 */
@Configuration
public class SwaggerSecurityConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Spring Boot 4 Swagger API文档")
                        .version("1.0.0")
                        .description("需要认证的API文档"))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt",  // 安全方案名称
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)  // 类型为HTTP
                                        .scheme("bearer")  // 使用Bearer Token
                                        .bearerFormat("JWT")  // Bearer格式为JWT
                                        .description("请输入JWT Token,格式: Bearer {token}")))  // 描述信息
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));  // 默认所有接口都需要认证
    }
}
```

在控制器中使用安全注解:

```java
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理")
@SecurityRequirement(name = "bearer-jwt")  // 这个控制器下的所有接口都需要认证
public class UserController {
    @GetMapping("/public")
    @Operation(summary = "公开接口", description = "不需要认证的公开接口")
    @SecurityRequirements()  // 覆盖控制器级别的安全要求,这个接口不需要认证
    public ResponseEntity<String> publicEndpoint() {
        return ResponseEntity.ok("这是公开接口");
    }
    @GetMapping("/private")
    @Operation(summary = "私有接口", description = "需要认证的私有接口")
    // 使用控制器级别的安全要求,需要认证
    public ResponseEntity<String> privateEndpoint() {
        return ResponseEntity.ok("这是私有接口");
    }
}
```

### 配置文件配置

在`application.yml`中可以配置更多选项:

```yaml
springdoc:
  api-docs:
    path: /v3/api-docs  # OpenAPI JSON文档路径
    enabled: true  # 启用API文档生成
  swagger-ui:
    path: /swagger-ui.html  # Swagger UI访问路径
    enabled: true  # 启用Swagger UI
    tags-sorter: alpha  # 标签排序方式: alpha(字母), method(方法)
    operations-sorter: alpha  # 操作排序方式
    doc-expansion: none  # 文档展开方式: none(不展开), list(展开列表), full(全部展开)
    default-models-expand-depth: 1  # 默认模型展开深度
    default-model-expand-depth: 1  # 默认模型属性展开深度
    display-request-duration: true  # 显示请求耗时
    filter: true  # 启用过滤器
    show-extensions: true  # 显示扩展信息
    show-common-extensions: true  # 显示通用扩展信息
    try-it-out-enabled: true  # 启用"Try it out"功能
  show-actuator: false  # 是否显示Actuator端点
  use-management-port: false  # 是否使用管理端口
  packages-to-scan: com.example.demo.controller  # 扫描的包路径,多个用逗号分隔
  paths-to-match: /api/**  # 匹配的路径,多个用逗号分隔
  paths-to-exclude: /error  # 排除的路径,多个用逗号分隔
```

### 自定义响应示例

可以自定义响应示例,让文档更清晰:

```java
@GetMapping("/{id}")
@Operation(summary = "根据ID获取用户")
@ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "获取成功",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = User.class),
            examples = @ExampleObject(
                name = "成功示例",
                value = "{\"id\": 1, \"username\": \"penglei\", \"email\": \"penglei@example.com\", \"age\": 30}"
            )
        )
    ),
    @ApiResponse(
        responseCode = "404",
        description = "用户不存在",
        content = @Content(
            mediaType = "application/json",
            examples = @ExampleObject(
                name = "错误示例",
                value = "{\"code\": 404, \"message\": \"用户不存在\"}"
            )
        )
    )
})
public ResponseEntity<User> getUserById(@PathVariable Long id) {
    // 实现代码
}
```

## 常用注解说明

### 控制器注解

- `@Tag`: 用于给控制器分组,在Swagger UI中显示为标签
- `@Operation`: 用于描述接口操作,包括summary、description等
- `@Parameter`: 用于描述参数,包括description、required、example等
- `@ApiResponse`: 用于描述响应,包括responseCode、description等
- `@ApiResponses`: 用于描述多个响应
- `@SecurityRequirement`: 用于指定安全要求
- `@SecurityRequirements`: 用于覆盖安全要求

### 实体类注解

- `@Schema`: 用于描述实体类或字段,包括description、example、required等
- `@Hidden`: 用于隐藏接口或字段,不在Swagger文档中显示

### 使用示例

```java
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理", description = "用户相关的CRUD操作接口")
public class UserController {
    @GetMapping("/{id}")
    @Operation(
        summary = "根据ID获取用户",  // 简短描述
        description = "根据用户ID获取用户详细信息,如果用户不存在则返回404",  // 详细描述
        tags = {"用户查询"}  // 标签,可以自定义
    )
    @Parameter(
        name = "id",  // 参数名
        description = "用户ID",  // 参数描述
        required = true,  // 是否必填
        example = "1",  // 示例值
        schema = @Schema(type = "integer", format = "int64")  // 参数类型
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "获取成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在")
    })
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        // 实现代码
    }
}
```

## 最佳实践

1. **合理使用注解**: 不要过度使用注解,保持代码简洁;只在必要的地方添加注解
2. **统一响应格式**: 定义统一的响应格式,方便前端处理
3. **参数校验**: 使用Bean Validation进行参数校验,Swagger会自动显示校验规则
4. **分组管理**: 大型项目使用分组管理,方便查看和维护
5. **安全配置**: 需要认证的接口配置安全方案,方便测试
6. **示例数据**: 提供真实的示例数据,方便前端理解
7. **版本控制**: 使用URL版本控制,如`/api/v1/users`
8. **错误处理**: 定义统一的错误响应格式,在Swagger文档中展示
9. **文档更新**: 接口变更时及时更新Swagger文档
10. **生产环境**: 生产环境建议禁用Swagger UI,只保留API文档生成

## 常见问题

### 1. Swagger UI访问404

检查配置是否正确:

```yaml
springdoc:
  swagger-ui:
    path: /swagger-ui.html
    enabled: true
```

### 2. 接口不显示

检查包扫描配置:

```yaml
springdoc:
  packages-to-scan: com.example.demo.controller
```

### 3. 实体类字段不显示

确保实体类有getter方法,或者使用Lombok的`@Data`注解。

### 4. 安全认证不生效

检查安全配置是否正确,确保`@SecurityRequirement`注解正确使用。

## 文件上传下载

### 单文件上传

文件上传接口的Swagger配置:

```java
package com.example.demo.controller;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
/**
 * 文件上传控制器
 */
@RestController
@RequestMapping("/api/files")
@Tag(name = "文件管理", description = "文件上传下载相关接口")
public class FileController {
    private static final String UPLOAD_DIR = "uploads/";  // 上传目录
    /**
     * 单文件上传
     * @Parameter注解的content属性用于指定文件类型
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传单个文件", description = "上传单个文件到服务器")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "上传成功"),
        @ApiResponse(responseCode = "400", description = "文件格式不支持")
    })
    public ResponseEntity<String> uploadFile(
            @Parameter(
                description = "要上传的文件",
                required = true,
                content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)
            )
            @RequestPart("file") MultipartFile file) {
        try {
            // 检查文件是否为空
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("文件不能为空");
            }
            // 创建上传目录
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            // 保存文件
            Path filePath = uploadPath.resolve(file.getOriginalFilename());
            Files.write(filePath, file.getBytes());
            return ResponseEntity.ok("文件上传成功: " + file.getOriginalFilename());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("文件上传失败: " + e.getMessage());
        }
    }
    /**
     * 多文件上传
     */
    @PostMapping(value = "/upload-multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传多个文件", description = "一次上传多个文件到服务器")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "上传成功"),
        @ApiResponse(responseCode = "400", description = "文件格式不支持")
    })
    public ResponseEntity<String> uploadMultipleFiles(
            @Parameter(
                description = "要上传的文件列表",
                required = true,
                content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)
            )
            @RequestPart("files") MultipartFile[] files) {
        try {
            int successCount = 0;
            int failCount = 0;
            // 创建上传目录
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            // 遍历保存每个文件
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    Path filePath = uploadPath.resolve(file.getOriginalFilename());
                    Files.write(filePath, file.getBytes());
                    successCount++;
                } else {
                    failCount++;
                }
            }
            return ResponseEntity.ok(String.format("上传完成: 成功%d个,失败%d个", successCount, failCount));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("文件上传失败: " + e.getMessage());
        }
    }
    /**
     * 文件下载
     */
    @GetMapping("/download/{filename}")
    @Operation(summary = "下载文件", description = "根据文件名下载文件")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "下载成功", 
                    content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE)),
        @ApiResponse(responseCode = "404", description = "文件不存在")
    })
    public ResponseEntity<org.springframework.core.io.Resource> downloadFile(
            @Parameter(description = "文件名", required = true)
            @PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            org.springframework.core.io.Resource resource = 
                    new org.springframework.core.io.UrlResource(filePath.toUri());
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
```

### 文件上传DTO

如果上传文件时还需要其他参数,可以创建一个DTO:

```java
package com.example.demo.dto;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
/**
 * 文件上传请求DTO
 * 包含文件和其他参数
 */
@Data
@Schema(description = "文件上传请求")
public class FileUploadRequest {
    @Schema(description = "上传的文件", required = true)
    private MultipartFile file;  // 文件
    @NotBlank(message = "文件描述不能为空")
    @Schema(description = "文件描述", example = "用户头像", required = true)
    private String description;  // 文件描述
    @Schema(description = "文件分类", example = "avatar")
    private String category;  // 文件分类
}
```

## 分页查询

### 分页请求DTO

```java
package com.example.demo.dto;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.Data;
/**
 * 分页请求DTO
 * 用于接收分页查询参数
 */
@Data
@Schema(description = "分页请求参数")
public class PageRequest {
    @Min(value = 1, message = "页码必须大于0")
    @Schema(description = "页码,从1开始", example = "1", defaultValue = "1")
    private Integer page = 1;  // 页码,默认1
    @Min(value = 1, message = "每页大小必须大于0")
    @Schema(description = "每页大小", example = "10", defaultValue = "10")
    private Integer size = 10;  // 每页大小,默认10
    @Schema(description = "排序字段", example = "createTime")
    private String sortBy;  // 排序字段
    @Schema(description = "排序方向", example = "DESC", allowableValues = {"ASC", "DESC"})
    private String sortDirection = "DESC";  // 排序方向,默认DESC
}
```

### 分页响应DTO

```java
package com.example.demo.dto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.util.List;
/**
 * 分页响应DTO
 * 用于返回分页查询结果
 */
@Data
@Schema(description = "分页响应")
public class PageResponse<T> {
    @Schema(description = "数据列表")
    private List<T> content;  // 数据列表
    @Schema(description = "总记录数", example = "100")
    private Long total;  // 总记录数
    @Schema(description = "总页数", example = "10")
    private Integer totalPages;  // 总页数
    @Schema(description = "当前页码", example = "1")
    private Integer currentPage;  // 当前页码
    @Schema(description = "每页大小", example = "10")
    private Integer pageSize;  // 每页大小
    @Schema(description = "是否有上一页", example = "false")
    private Boolean hasPrevious;  // 是否有上一页
    @Schema(description = "是否有下一页", example = "true")
    private Boolean hasNext;  // 是否有下一页
    /**
     * 创建分页响应
     */
    public static <T> PageResponse<T> of(List<T> content, Long total, Integer page, Integer size) {
        PageResponse<T> response = new PageResponse<>();
        response.setContent(content);
        response.setTotal(total);
        response.setCurrentPage(page);
        response.setPageSize(size);
        response.setTotalPages((int) Math.ceil((double) total / size));
        response.setHasPrevious(page > 1);
        response.setHasNext(page < response.getTotalPages());
        return response;
    }
}
```

### 分页查询接口

```java
@GetMapping("/page")
@Operation(summary = "分页查询用户", description = "根据条件分页查询用户列表")
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "查询成功")
})
public ResponseEntity<PageResponse<User>> getUsersByPage(
        @Parameter(description = "分页参数")
        @Valid PageRequest pageRequest,
        @Parameter(description = "用户名关键字,支持模糊查询")
        @RequestParam(required = false) String keyword) {
    // 模拟分页查询
    List<User> allUsers = users;  // 假设这是所有用户
    // 如果有关键字,进行过滤
    if (keyword != null && !keyword.isEmpty()) {
        allUsers = allUsers.stream()
                .filter(u -> u.getUsername().contains(keyword))
                .toList();
    }
    // 计算分页
    int start = (pageRequest.getPage() - 1) * pageRequest.getSize();
    int end = Math.min(start + pageRequest.getSize(), allUsers.size());
    List<User> pageContent = allUsers.subList(start, end);
    // 构建分页响应
    PageResponse<User> response = PageResponse.of(
            pageContent,
            (long) allUsers.size(),
            pageRequest.getPage(),
            pageRequest.getSize()
    );
    return ResponseEntity.ok(response);
}
```

## 复杂请求体示例

### 嵌套对象

```java
package com.example.demo.dto;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
/**
 * 订单创建请求DTO
 * 包含嵌套对象和集合
 */
@Data
@Schema(description = "订单创建请求")
public class OrderCreateRequest {
    @NotBlank(message = "订单号不能为空")
    @Schema(description = "订单号", example = "ORD20240101001", required = true)
    private String orderNo;  // 订单号
    @NotNull(message = "用户信息不能为空")
    @Valid  // 嵌套对象也需要校验
    @Schema(description = "用户信息", required = true)
    private UserInfo userInfo;  // 用户信息,嵌套对象
    @NotNull(message = "订单项不能为空")
    @Schema(description = "订单项列表", required = true)
    private List<@Valid OrderItem> items;  // 订单项列表
    @Schema(description = "收货地址")
    private Address address;  // 收货地址,嵌套对象
    /**
     * 用户信息内部类
     */
    @Data
    @Schema(description = "用户信息")
    public static class UserInfo {
        @NotBlank(message = "用户名不能为空")
        @Schema(description = "用户名", example = "penglei", required = true)
        private String username;
        @Schema(description = "手机号", example = "13800138000")
        private String phone;
    }
    /**
     * 订单项内部类
     */
    @Data
    @Schema(description = "订单项")
    public static class OrderItem {
        @NotBlank(message = "商品名称不能为空")
        @Schema(description = "商品名称", example = "iPhone 15", required = true)
        private String productName;
        @NotNull(message = "数量不能为空")
        @Schema(description = "数量", example = "2", required = true)
        private Integer quantity;
        @NotNull(message = "单价不能为空")
        @Schema(description = "单价", example = "5999.00", required = true)
        private Double price;
    }
    /**
     * 地址内部类
     */
    @Data
    @Schema(description = "收货地址")
    public static class Address {
        @Schema(description = "省份", example = "河南省")
        private String province;
        @Schema(description = "城市", example = "郑州市")
        private String city;
        @Schema(description = "详细地址", example = "金水区某某街道123号")
        private String detail;
    }
}
```

### 使用示例

```java
@PostMapping("/orders")
@Operation(summary = "创建订单", description = "创建一个新订单,包含用户信息、订单项和收货地址")
@ApiResponses({
    @ApiResponse(responseCode = "201", description = "创建成功"),
    @ApiResponse(responseCode = "400", description = "参数校验失败")
})
public ResponseEntity<Order> createOrder(
        @Valid @RequestBody OrderCreateRequest request) {
    // 创建订单逻辑
    Order order = new Order();
    order.setOrderNo(request.getOrderNo());
    // ... 其他字段设置
    return ResponseEntity.status(HttpStatus.CREATED).body(order);
}
```

## 枚举类型配置

### 枚举定义

```java
package com.example.demo.enums;
import io.swagger.v3.oas.annotations.media.Schema;
/**
 * 订单状态枚举
 * @Schema注解用于描述枚举
 */
@Schema(description = "订单状态")
public enum OrderStatus {
    @Schema(description = "待支付")
    PENDING("待支付"),
    @Schema(description = "已支付")
    PAID("已支付"),
    @Schema(description = "已发货")
    SHIPPED("已发货"),
    @Schema(description = "已完成")
    COMPLETED("已完成"),
    @Schema(description = "已取消")
    CANCELLED("已取消");
    private final String description;  // 描述
    OrderStatus(String description) {
        this.description = description;
    }
    public String getDescription() {
        return description;
    }
}
```

### 使用枚举

```java
@GetMapping("/orders/status/{status}")
@Operation(summary = "根据状态查询订单", description = "根据订单状态查询订单列表")
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "查询成功")
})
public ResponseEntity<List<Order>> getOrdersByStatus(
        @Parameter(
            description = "订单状态",
            required = true,
            schema = @Schema(implementation = OrderStatus.class),
            example = "PENDING"
        )
        @PathVariable OrderStatus status) {
    // 根据状态查询订单
    List<Order> orders = orderService.findByStatus(status);
    return ResponseEntity.ok(orders);
}
```

## 泛型响应体

### 统一响应格式

```java
package com.example.demo.dto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
/**
 * 统一响应格式
 * 使用泛型支持不同类型的数据
 */
@Data
@Schema(description = "统一响应格式")
public class ApiResult<T> {
    @Schema(description = "状态码", example = "200")
    private Integer code;  // 状态码
    @Schema(description = "提示信息", example = "操作成功")
    private String message;  // 提示信息
    @Schema(description = "响应数据")
    private T data;  // 响应数据
    @Schema(description = "时间戳", example = "1704067200000")
    private Long timestamp;  // 时间戳
    /**
     * 成功响应
     */
    public static <T> ApiResult<T> success(T data) {
        ApiResult<T> result = new ApiResult<>();
        result.setCode(200);
        result.setMessage("操作成功");
        result.setData(data);
        result.setTimestamp(System.currentTimeMillis());
        return result;
    }
    /**
     * 失败响应
     */
    public static <T> ApiResult<T> fail(Integer code, String message) {
        ApiResult<T> result = new ApiResult<>();
        result.setCode(code);
        result.setMessage(message);
        result.setTimestamp(System.currentTimeMillis());
        return result;
    }
}
```

### 使用统一响应格式

```java
@GetMapping("/{id}")
@Operation(summary = "根据ID获取用户")
@ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "获取成功",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = ApiResult.class)
        )
    )
})
public ResponseEntity<ApiResult<User>> getUserById(@PathVariable Long id) {
    Optional<User> user = users.stream()
            .filter(u -> u.getId().equals(id))
            .findFirst();
    if (user.isPresent()) {
        return ResponseEntity.ok(ApiResult.success(user.get()));
    } else {
        return ResponseEntity.ok(ApiResult.fail(404, "用户不存在"));
    }
}
```

## 与Spring Security集成

### 配置Swagger安全

如果项目使用了Spring Security,需要配置Swagger的访问权限:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
/**
 * Spring Security配置
 * 配置Swagger UI的访问权限
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // 允许访问Swagger UI相关路径
                .requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-resources/**",
                    "/webjars/**"
                ).permitAll()  // 允许所有人访问
                // 其他接口需要认证
                .anyRequest().authenticated()
            )
            .formLogin();  // 使用表单登录
        return http.build();
    }
}
```

### 配置Swagger安全方案

```java
@Bean
public OpenAPI customOpenAPI() {
    return new OpenAPI()
            .info(new Info()
                    .title("Spring Boot 4 Swagger API文档")
                    .version("1.0.0"))
            .components(new Components()
                    .addSecuritySchemes("bearer-jwt",
                            new SecurityScheme()
                                    .type(SecurityScheme.Type.HTTP)
                                    .scheme("bearer")
                                    .bearerFormat("JWT")
                                    .description("请输入JWT Token")))
            .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
}
```

## 自定义OperationCustomizer

可以自定义OperationCustomizer来修改接口文档:

```java
package com.example.demo.config;
import io.swagger.v3.oas.models.Operation;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
/**
 * 自定义OperationCustomizer
 * 用于统一添加接口描述或修改接口信息
 */
@Component
public class CustomOperationCustomizer implements OperationCustomizer {
    @Override
    public Operation customize(Operation operation, HandlerMethod handlerMethod) {
        // 统一添加接口前缀
        if (operation.getSummary() != null) {
            operation.setSummary("[API] " + operation.getSummary());
        }
        // 统一添加接口描述后缀
        if (operation.getDescription() != null) {
            operation.setDescription(operation.getDescription() + "\n\n注意: 所有接口都需要认证");
        }
        return operation;
    }
}
```

## 自定义ModelConverter

可以自定义ModelConverter来修改模型定义:

```java
package com.example.demo.config;
import io.swagger.v3.oas.models.media.Schema;
import org.springdoc.core.customizers.PropertyCustomizer;
import org.springframework.stereotype.Component;
/**
 * 自定义PropertyCustomizer
 * 用于统一修改属性定义
 */
@Component
public class CustomPropertyCustomizer implements PropertyCustomizer {
    @Override
    public Schema customize(Schema property, org.springframework.core.MethodParameter methodParameter) {
        // 如果是String类型,统一添加最大长度说明
        if (property.getType() != null && property.getType().equals("string")) {
            if (property.getMaxLength() == null) {
                property.setMaxLength(255L);  // 默认最大长度255
            }
        }
        return property;
    }
}
```

## 条件显示接口

可以使用`@Hidden`注解隐藏接口:

```java
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理")
public class UserController {
    @GetMapping("/public")
    @Operation(summary = "公开接口")
    public ResponseEntity<String> publicEndpoint() {
        return ResponseEntity.ok("这是公开接口");
    }
    @GetMapping("/internal")
    @Hidden  // 隐藏接口,不在Swagger文档中显示
    public ResponseEntity<String> internalEndpoint() {
        return ResponseEntity.ok("这是内部接口,不对外暴露");
    }
}
```

也可以使用配置文件控制:

```yaml
springdoc:
  paths-to-exclude: /api/internal/**,/api/admin/**
```

## 导出OpenAPI文档

### 导出JSON格式

访问 `http://localhost:8080/v3/api-docs` 可以获取JSON格式的OpenAPI文档。

### 导出YAML格式

访问 `http://localhost:8080/v3/api-docs.yaml` 可以获取YAML格式的OpenAPI文档。

### 导出特定分组的文档

访问 `http://localhost:8080/v3/api-docs/{group-name}` 可以获取特定分组的文档。

例如:

- `http://localhost:8080/v3/api-docs/用户管理` - 用户管理分组的文档
- `http://localhost:8080/v3/api-docs/订单管理` - 订单管理分组的文档

### 使用代码导出

```java
package com.example.demo.service;
import io.swagger.v3.oas.models.OpenAPI;
import org.springdoc.core.models.GroupedOpenApi;
import org.springdoc.core.properties.SpringDocConfigProperties;
import org.springdoc.core.providers.ObjectMapperProvider;
import org.springdoc.core.service.OpenAPIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.FileWriter;
import java.io.IOException;
/**
 * OpenAPI文档导出服务
 */
@Service
public class OpenAPIExportService {
    @Autowired
    private OpenAPIService openAPIService;
    /**
     * 导出OpenAPI文档为JSON文件
     */
    public void exportToJson(String groupName, String filePath) throws IOException {
        OpenAPI openAPI = openAPIService.getOpenAPI(groupName);
        // 使用ObjectMapper转换为JSON
        ObjectMapperProvider objectMapperProvider = new ObjectMapperProvider(new SpringDocConfigProperties());
        String json = objectMapperProvider.jsonMapper().writeValueAsString(openAPI);
        // 写入文件
        try (FileWriter writer = new FileWriter(filePath)) {
            writer.write(json);
        }
    }
    /**
     * 导出OpenAPI文档为YAML文件
     */
    public void exportToYaml(String groupName, String filePath) throws IOException {
        OpenAPI openAPI = openAPIService.getOpenAPI(groupName);
        // 使用ObjectMapper转换为YAML
        ObjectMapperProvider objectMapperProvider = new ObjectMapperProvider(new SpringDocConfigProperties());
        String yaml = objectMapperProvider.yamlMapper().writeValueAsString(openAPI);
        // 写入文件
        try (FileWriter writer = new FileWriter(filePath)) {
            writer.write(yaml);
        }
    }
}
```

## 集成测试

### 测试Swagger UI

```java
package com.example.demo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
/**
 * Swagger集成测试
 */
@SpringBootTest
@AutoConfigureMockMvc
class SwaggerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;
    /**
     * 测试Swagger UI是否可以访问
     */
    @Test
    void testSwaggerUI() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().isOk());
    }
    /**
     * 测试OpenAPI文档是否可以访问
     */
    @Test
    void testOpenAPIDocs() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk());
    }
    /**
     * 测试OpenAPI YAML文档是否可以访问
     */
    @Test
    void testOpenAPIDocsYaml() throws Exception {
        mockMvc.perform(get("/v3/api-docs.yaml"))
                .andExpect(status().isOk());
    }
}
```

## 性能优化建议

1. **生产环境禁用Swagger UI**: 生产环境建议禁用Swagger UI,只保留API文档生成功能

```yaml
springdoc:
  swagger-ui:
    enabled: false  # 禁用Swagger UI
  api-docs:
    enabled: true  # 保留API文档生成
```

1. **限制扫描路径**: 只扫描需要的包,减少扫描时间

```yaml
springdoc:
  packages-to-scan: com.example.demo.controller  # 只扫描controller包
  paths-to-match: /api/**  # 只匹配/api/**路径
```

1. **使用分组**: 大型项目使用分组,减少单次加载的接口数量
2. **缓存OpenAPI文档**: 如果文档不经常变化,可以缓存OpenAPI文档

```java
@Bean
public OpenAPIService openAPIService() {
    SpringDocConfigProperties springDocConfigProperties = new SpringDocConfigProperties();
    springDocConfigProperties.setCacheDisabled(false);  // 启用缓存
    return new OpenAPIService(springDocConfigProperties, ...);
}
```

## 更多常见问题

### 5. 文件上传接口不显示文件选择按钮

确保使用`@RequestPart`而不是`@RequestParam`:

```java
// 正确
@RequestPart("file") MultipartFile file
// 错误
@RequestParam("file") MultipartFile file
```

### 6. 枚举类型显示不正确

确保枚举类有`@Schema`注解,并且在参数中使用`@Schema(implementation = EnumClass.class)`:

```java
@Parameter(
    schema = @Schema(implementation = OrderStatus.class),
    example = "PENDING"
)
@PathVariable OrderStatus status
```

### 7. 泛型响应体不显示

使用`@Schema`注解指定具体类型:

```java
@ApiResponse(
    responseCode = "200",
    content = @Content(
        schema = @Schema(implementation = ApiResult.class)
    )
)
```

### 8. 日期时间格式问题

在配置文件中设置日期时间格式:

```yaml
spring:
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: GMT+8
```

### 9. 中文乱码问题

确保配置文件使用UTF-8编码,或者在启动类中设置:

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        System.setProperty("file.encoding", "UTF-8");
        SpringApplication.run(Application.class, args);
    }
}
```

### 10. 接口排序问题

在配置文件中设置排序方式:

```yaml
springdoc:
  swagger-ui:
    tags-sorter: alpha  # 标签按字母排序
    operations-sorter: method  # 操作按HTTP方法排序
```

## 总结

Spring Boot 4整合Swagger非常方便,只需要添加`springdoc-openapi-starter-webmvc-ui`依赖就能用;支持自动生成API文档、在线测试接口、分组管理、安全认证等功能;使用标准OpenAPI注解,代码即文档;支持文件上传下载、分页查询、复杂请求体、枚举类型、泛型响应体等复杂场景;可以自定义OperationCustomizer和ModelConverter来扩展功能;支持导出OpenAPI文档;兄弟们根据实际需求选择合适的配置,就能轻松搞定API文档了;但是要注意生产环境建议禁用Swagger UI,避免暴露接口信息;同时要注意性能优化,合理使用分组和缓存,提升文档生成速度。
