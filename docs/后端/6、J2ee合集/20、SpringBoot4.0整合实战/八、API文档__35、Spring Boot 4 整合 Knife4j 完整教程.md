# 35、Spring Boot 4 整合 Knife4j 完整教程
- 来源：https://ddkk.com/springboot/4-action/35.html
- 分类：Spring Boot 4 整合教程
- 分组：八、API文档
- 日期：2025-12-08
用Swagger写API文档的时候,最烦的就是UI界面太丑了,黑不溜秋的,看着就不舒服;而且功能也不够强大,想导出个离线文档还得自己写代码,想设置个全局参数还得改配置,累死累活还不好用;后来听说Knife4j这玩意儿不错,是Swagger的增强版,UI界面贼漂亮,功能还特别强大,支持离线文档导出、全局参数设置、接口搜索、接口分组这些高级功能,而且完全兼容Swagger注解,不需要改代码就能用;但是很多兄弟不知道里面的门道,也不知道咋在Spring Boot 4里整合Knife4j、配置增强功能、自定义UI这些高级用法,所以鹏磊今天就给兄弟们掰扯掰扯。

其实Knife4j在Spring Boot里早就支持了,以前用的是Springfox版本,但是Spring Boot 4开始就不支持Springfox了,现在都用SpringDoc OpenAPI;Knife4j也推出了`knife4j-openapi3-spring-boot-starter`和`knife4j-springdoc-ui`,专门支持SpringDoc OpenAPI;你只要加个依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋配置增强模式、离线文档、全局参数、接口搜索这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## Knife4j基础概念

### Knife4j是啥玩意儿

Knife4j是一个基于Swagger的增强解决方案,专门为Java MVC框架设计,提供了轻量级且强大的API文档生成能力;Knife4j的核心特性包括:

1. **美观的UI界面**: 提供比原生Swagger UI更美观、更易用的界面
2. **完全兼容Swagger**: 使用标准的Swagger/OpenAPI注解,无需修改代码
3. **增强功能**: 支持离线文档导出、全局参数设置、接口搜索等增强功能
4. **多版本支持**: 支持OpenAPI 2.0和OpenAPI 3.0规范
5. **SpringDoc集成**: 完美支持SpringDoc OpenAPI,适配Spring Boot 3+
6. **生产环境保护**: 支持生产环境禁用文档,保护接口安全
7. **Basic认证**: 支持Basic认证,保护文档访问

### Knife4j和Swagger的区别

1. **UI界面**: Knife4j提供更美观的UI界面;Swagger UI界面相对简单
2. **功能增强**: Knife4j提供离线文档导出、全局参数等增强功能;Swagger需要自己实现
3. **接口搜索**: Knife4j支持接口搜索功能;Swagger不支持
4. **离线文档**: Knife4j支持导出Markdown、Word等格式的离线文档;Swagger不支持
5. **兼容性**: Knife4j完全兼容Swagger注解;可以直接替换使用
6. **访问地址**: Knife4j访问地址是`/doc.html`;Swagger是`/swagger-ui.html`

### Knife4j版本说明

Knife4j有多个版本,针对不同的使用场景:

1. **knife4j-openapi2-spring-boot-starter**: 支持OpenAPI 2.0,适用于Spring Boot 2.x
2. **knife4j-openapi3-spring-boot-starter**: 支持OpenAPI 3.0,适用于Spring Boot 3+
3. **knife4j-springdoc-ui**: 基于SpringDoc OpenAPI的UI增强,适用于Spring Boot 3+
4. **knife4j-spring-boot-starter**: 旧版本,基于Springfox,不推荐在Spring Boot 4使用

对于Spring Boot 4,推荐使用`knife4j-openapi3-spring-boot-starter`或`knife4j-springdoc-ui`。

### Knife4j访问地址

添加依赖后,Knife4j UI会自动部署,默认访问地址:

- **Knife4j UI**: `http://localhost:8080/doc.html`
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`
- **OpenAPI YAML**: `http://localhost:8080/v3/api-docs.yaml`

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-knife4j-demo/
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

这是最关键的,依赖配置不对后面全是坑;Spring Boot 4需要Java 17以上,而且Knife4j最新版本已经支持Spring Boot 4了。

**方式一: 使用knife4j-openapi3-spring-boot-starter(推荐)**

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
    <artifactId>spring-boot-knife4j-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 Knife4j Demo</name>
    <description>Spring Boot 4整合Knife4j示例项目</description>
    <properties>
        <java.version>17</java.version>  <!-- Java 17以上 -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <!-- Knife4j版本,支持Spring Boot 4 -->
        <knife4j.version>4.4.0</knife4j.version>
    </properties>
    <dependencies>
        <!-- Spring Boot Web Starter: 包含Spring MVC、Tomcat等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Knife4j OpenAPI3 Starter: 包含Knife4j UI和OpenAPI文档生成 -->
        <dependency>
            <groupId>com.github.xiaoymin</groupId>
            <artifactId>knife4j-openapi3-spring-boot-starter</artifactId>
            <version>${knife4j.version}</version>
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

**方式二: 使用knife4j-springdoc-ui(基于SpringDoc)**

如果你已经使用了`springdoc-openapi-starter-webmvc-ui`,可以只添加Knife4j的UI增强:

```xml
<!-- SpringDoc OpenAPI UI -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.13</version>
</dependency>
<!-- Knife4j UI增强 -->
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-springdoc-ui</artifactId>
    <version>${knife4j.version}</version>
</dependency>
```

### 基础配置文件

在`application.yml`中添加基础配置:

```yaml
server:
  port: 8080  # 服务端口
spring:
  application:
    name: spring-boot-knife4j-demo  # 应用名称
# Knife4j配置
knife4j:
  enable: true  # 启用Knife4j增强模式,默认true
  setting:
    language: zh_cn  # 界面语言,zh_cn表示中文
    swagger-model-name: 实体类  # 实体类名称显示
  production: false  # 是否开启生产环境保护策略,生产环境建议设置为true
  basic:
    enable: false  # 是否启用Basic认证,默认false
    username: admin  # Basic认证用户名
    password: 123456  # Basic认证密码
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
 * @Schema注解用于描述实体类,在Knife4j文档中显示
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

创建控制器,使用Swagger注解描述接口(完全兼容):

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
 * @Tag注解用于给控制器分组,在Knife4j UI中显示为标签
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

启动应用后,访问Knife4j UI:

1. 打开浏览器,访问 `http://localhost:8080/doc.html`
2. 你会看到Knife4j UI界面,比Swagger UI更美观,功能更强大
3. 左侧是API列表,支持搜索功能
4. 右侧是接口详情,包括参数、返回值、示例等
5. 可以直接在界面上测试接口,输入参数后点击"发送请求"按钮

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
 * Knife4j配置类
 * 用于自定义OpenAPI文档信息
 */
@Configuration
public class Knife4jConfig {
    /**
     * 自定义OpenAPI信息
     * 包括API标题、描述、版本、联系人等信息
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Spring Boot 4 Knife4j API文档")  // API标题
                        .version("1.0.0")  // API版本
                        .description("这是Spring Boot 4整合Knife4j的示例项目API文档")  // API描述
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
 * Knife4j分组配置
 * 用于将API按模块分组显示
 */
@Configuration
public class Knife4jGroupConfig {
    /**
     * 用户管理API分组
     * 只包含/api/users路径下的接口
     */
    @Bean
    public GroupedOpenApi userApi() {
        return GroupedOpenApi.builder()
                .group("用户管理")  // 分组名称,在Knife4j UI中显示
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

配置分组后,在Knife4j UI右上角会有一个下拉框,可以选择不同的分组查看。

### 配置文件详细配置

在`application.yml`中可以配置更多选项:

```yaml
# Knife4j配置
knife4j:
  enable: true  # 启用Knife4j增强模式,默认true
  setting:
    language: zh_cn  # 界面语言: zh_cn(中文), en(英文)
    swagger-model-name: 实体类  # 实体类名称显示
    enable-version: false  # 是否显示版本号
    enable-document-manage: true  # 是否显示文档管理功能
    enable-home-custom: true  # 是否显示首页自定义
    enable-search: true  # 是否启用搜索功能
    enable-footer: false  # 是否显示页脚
    enable-footer-custom: false  # 是否显示自定义页脚
    enable-dynamic-params: true  # 是否启用动态参数
    enable-request-cache: true  # 是否启用请求缓存
    enable-host: false  # 是否显示Host地址
    enable-host-text: http://127.0.0.1:8080  # Host地址文本
    enable-home-custom-path: /  # 首页自定义路径
    enable-try-it-out: true  # 是否启用"Try it out"功能
    enable-filter-multipart-api-method-type: POST  # 过滤的请求方式
    enable-filter-multipart-apis: false  # 是否过滤文件上传接口
    enable-request-cache: true  # 是否启用请求缓存
    enable-after-script: true  # 是否启用后置脚本
    enable-filter-multipart-apis: false  # 是否过滤文件上传接口
    enable-document-manage: true  # 是否启用文档管理
    swagger-model-name: 实体类  # 实体类名称
    enable-reload-cache-parameter: false  # 是否启用重新加载缓存参数
    enable-footer: false  # 是否显示页脚
    enable-dynamic-params: true  # 是否启用动态参数
    enable-debug: true  # 是否启用调试模式
    enable-version: false  # 是否显示版本号
    enable-oauth2: false  # 是否启用OAuth2
    enable-oauth2-password: false  # 是否启用OAuth2密码模式
    enable-oauth2-client-credentials: false  # 是否启用OAuth2客户端凭证模式
    enable-oauth2-authorization-code: false  # 是否启用OAuth2授权码模式
    enable-oauth2-implicit: false  # 是否启用OAuth2隐式模式
  production: false  # 是否开启生产环境保护策略,生产环境建议设置为true
  basic:
    enable: false  # 是否启用Basic认证,默认false
    username: admin  # Basic认证用户名
    password: 123456  # Basic认证密码
```

### 生产环境配置

生产环境建议禁用Knife4j UI,保护接口安全:

```yaml
# 生产环境配置
knife4j:
  enable: false  # 禁用Knife4j增强模式
  production: true  # 开启生产环境保护策略
```

或者使用配置文件区分环境:

```yaml
# application-dev.yml (开发环境)
knife4j:
  enable: true
  production: false
# application-prod.yml (生产环境)
knife4j:
  enable: false
  production: true
```

### Basic认证配置

如果需要保护文档访问,可以启用Basic认证:

```yaml
knife4j:
  basic:
    enable: true  # 启用Basic认证
    username: admin  # 用户名
    password: 123456  # 密码
```

启用后,访问`/doc.html`时需要输入用户名和密码。

## Knife4j增强功能

### 离线文档导出

Knife4j支持导出离线文档,包括Markdown、Word、PDF等格式:

1. 在Knife4j UI界面右上角,点击"文档管理"
2. 选择"离线文档"
3. 选择导出格式(Markdown、Word、PDF等)
4. 点击"导出"按钮即可下载

### 全局参数设置

Knife4j支持设置全局参数,所有接口都会自动带上这些参数:

1. 在Knife4j UI界面右上角,点击"全局参数设置"
2. 添加参数,包括参数名、参数值、参数位置(Header、Query、Path等)
3. 保存后,所有接口请求都会自动带上这些参数

### 接口搜索

Knife4j支持接口搜索功能:

1. 在Knife4j UI界面顶部,有一个搜索框
2. 输入关键词,可以搜索接口名称、描述、路径等
3. 支持模糊搜索,方便快速找到需要的接口

### 接口分组管理

Knife4j支持接口分组管理:

1. 在Knife4j UI界面右上角,有一个分组下拉框
2. 可以选择不同的分组查看接口
3. 分组可以在配置类中定义

### 请求缓存

Knife4j支持请求缓存功能:

1. 在接口测试时,可以启用请求缓存
2. 相同的请求参数会自动使用缓存结果
3. 提高测试效率,减少重复请求

### 动态参数

Knife4j支持动态参数功能:

1. 在接口测试时,可以设置动态参数
2. 支持JavaScript表达式,可以动态生成参数值
3. 例如: `{{timestamp}}`、`{{random}}`等

## 与Spring Security集成

### 配置Knife4j访问权限

如果项目使用了Spring Security,需要配置Knife4j的访问权限:

```java
package com.example.demo.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
/**
 * Spring Security配置
 * 配置Knife4j UI的访问权限
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // 允许访问Knife4j UI相关路径
                .requestMatchers(
                    "/doc.html",
                    "/doc.html/**",
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
                    .title("Spring Boot 4 Knife4j API文档")
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

## 文件上传下载

### 单文件上传

文件上传接口的Knife4j配置:

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
}
```

## 最佳实践

1. **生产环境禁用**: 生产环境建议禁用Knife4j UI,只保留API文档生成功能
2. **使用Basic认证**: 如果需要暴露文档,建议启用Basic认证保护
3. **合理使用分组**: 大型项目使用分组管理,方便查看和维护
4. **统一响应格式**: 定义统一的响应格式,方便前端处理
5. **参数校验**: 使用Bean Validation进行参数校验,Knife4j会自动显示校验规则
6. **示例数据**: 提供真实的示例数据,方便前端理解
7. **版本控制**: 使用URL版本控制,如`/api/v1/users`
8. **错误处理**: 定义统一的错误响应格式,在Knife4j文档中展示
9. **文档更新**: 接口变更时及时更新Knife4j文档
10. **离线文档**: 定期导出离线文档,方便团队协作

## 常见问题

### 1. Knife4j UI访问404

检查配置是否正确:

```yaml
knife4j:
  enable: true
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

### 5. 离线文档导出失败

确保Knife4j增强模式已启用:

```yaml
knife4j:
  enable: true
```

### 6. 全局参数不生效

检查全局参数设置是否正确,确保参数位置(Header、Query等)正确。

### 7. 搜索功能不工作

检查搜索功能是否启用:

```yaml
knife4j:
  setting:
    enable-search: true
```

### 8. Basic认证不生效

检查Basic认证配置:

```yaml
knife4j:
  basic:
    enable: true
    username: admin
    password: 123456
```

### 9. 生产环境仍然可以访问

检查生产环境配置:

```yaml
knife4j:
  enable: false
  production: true
```

### 10. 中文乱码问题

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

## Knife4j和Swagger的对比

### UI界面对比

1. **Knife4j**: UI界面更美观,支持暗色主题,界面布局更合理
2. **Swagger**: UI界面相对简单,功能较少

### 功能对比

1. **离线文档**: Knife4j支持导出Markdown、Word、PDF等格式;Swagger不支持
2. **全局参数**: Knife4j支持全局参数设置;Swagger不支持
3. **接口搜索**: Knife4j支持接口搜索;Swagger不支持
4. **请求缓存**: Knife4j支持请求缓存;Swagger不支持
5. **动态参数**: Knife4j支持动态参数;Swagger不支持

### 兼容性对比

1. **注解兼容**: Knife4j完全兼容Swagger注解,可以直接替换使用
2. **配置兼容**: Knife4j配置与Swagger基本一致,迁移成本低

## 总结

Spring Boot 4整合Knife4j非常方便,只需要添加`knife4j-openapi3-spring-boot-starter`依赖就能用;Knife4j是Swagger的增强版,提供了更美观的UI界面和更强大的功能;支持离线文档导出、全局参数设置、接口搜索、请求缓存等增强功能;完全兼容Swagger注解,不需要修改代码就能用;兄弟们根据实际需求选择合适的配置,就能轻松搞定API文档了;但是要注意生产环境建议禁用Knife4j UI,避免暴露接口信息;同时要注意使用Basic认证保护文档访问,确保接口安全。
