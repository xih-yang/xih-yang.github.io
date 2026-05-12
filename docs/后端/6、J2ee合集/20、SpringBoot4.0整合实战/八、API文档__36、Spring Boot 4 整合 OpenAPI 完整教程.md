# 36、Spring Boot 4 整合 OpenAPI 完整教程
- 来源：https://ddkk.com/springboot/4-action/36.html
- 分类：Spring Boot 4 整合教程
- 分组：八、API文档
- 日期：2025-12-08
写API接口的时候,最烦的就是接口规范不统一,前端兄弟不知道接口参数是啥、返回值是啥、错误码是啥,每次都要问来问去,累死累活还容易出错;后来听说OpenAPI这玩意儿不错,是一个标准的API规范格式,可以描述HTTP API的完整信息,包括路径、参数、返回值、错误码这些,而且机器可读,可以自动生成文档、生成客户端代码、做接口测试,功能全、可靠性高、社区活跃,是业界最广泛采用的API规范标准;但是直接用OpenAPI写规范文件,那叫一个复杂,写YAML、写JSON、定义Schema、配置路径,一堆配置写得人头疼;后来发现Spring Boot直接把这些都封装好了,用SpringDoc OpenAPI可以自动从代码生成OpenAPI规范,用起来贼简单;现在Spring Boot 4出来了,整合OpenAPI更是方便得不行,SpringDoc OpenAPI自动配置给你整得明明白白,零配置就能用;但是很多兄弟不知道里面的门道,也不知道咋理解OpenAPI规范结构、手动编写规范文件、从代码生成规范、使用OpenAPI 3.1这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

其实OpenAPI在Spring Boot里早就支持了,以前用的是Springfox,但是Spring Boot 3开始就不支持了,现在都用SpringDoc OpenAPI;SpringDoc OpenAPI可以自动从代码生成OpenAPI规范,也可以手动编写规范文件;你只要加个`springdoc-openapi-starter-webmvc-ui`依赖,基本上就能用;但是很多兄弟不知道里面的门道,也不知道咋理解OpenAPI规范的结构、手动编写规范文件、配置OpenAPI 3.1、使用组件复用这些高级功能,所以鹏磊今天就给兄弟们掰扯掰扯。

## OpenAPI基础概念

### OpenAPI是啥玩意儿

OpenAPI规范(OpenAPI Specification,简称OAS)是一个标准的、与编程语言无关的接口描述格式,用于描述HTTP API;OpenAPI规范的核心特性包括:

1. **标准格式**: 业界最广泛采用的API规范标准,兼容性好
2. **机器可读**: 使用JSON或YAML格式,可以被工具自动解析
3. **完整描述**: 可以描述API的完整信息,包括路径、参数、返回值、错误码等
4. **代码生成**: 可以根据OpenAPI规范生成客户端代码、服务端代码
5. **文档生成**: 可以根据OpenAPI规范自动生成API文档
6. **接口测试**: 可以根据OpenAPI规范进行接口测试和验证
7. **多版本支持**: 支持OpenAPI 2.0、3.0、3.1等多个版本

### OpenAPI和Swagger的关系

1. **历史关系**: OpenAPI规范最初由Swagger规范发展而来,Swagger 2.0后来被重命名为OpenAPI 2.0
2. **规范vs工具**: OpenAPI是规范标准;Swagger是实现工具
3. **版本对应**: Swagger 2.0对应OpenAPI 2.0;OpenAPI 3.0和3.1是新的规范版本
4. **工具支持**: Swagger工具集支持OpenAPI规范;SpringDoc OpenAPI也支持OpenAPI规范

### OpenAPI规范版本

OpenAPI规范有多个版本:

1. **OpenAPI 2.0**: 原Swagger 2.0规范,现在已不推荐使用
2. **OpenAPI 3.0**: 当前广泛使用的版本,功能完善
3. **OpenAPI 3.1**: 最新版本,支持JSON Schema 2020-12,功能更强大

对于Spring Boot 4,推荐使用OpenAPI 3.0或3.1。

### OpenAPI规范结构

OpenAPI规范文档包含以下主要部分:

1. **openapi**: OpenAPI规范版本号,如"3.0.0"或"3.1.0"
2. **info**: API的基本信息,包括标题、版本、描述等
3. **servers**: 服务器信息,定义API的基础URL
4. **paths**: API路径定义,描述所有可用的接口
5. **components**: 可复用的组件,包括schemas、parameters、responses等
6. **security**: 安全方案定义
7. **tags**: 标签定义,用于分组接口
8. **externalDocs**: 外部文档链接

## 项目搭建和依赖配置

### 创建Maven项目

首先你得有个Maven项目,用IDEA或者Eclipse都行,或者直接用Spring Initializr生成;项目结构大概是这样:

```plaintext
spring-boot-openapi-demo/
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
│   │       ├── application.yml       # 配置文件
│   │       └── openapi/              # OpenAPI规范文件目录(可选)
│   │           └── openapi.yaml       # 手动编写的OpenAPI规范文件
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
    <artifactId>spring-boot-openapi-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>Spring Boot 4 OpenAPI Demo</name>
    <description>Spring Boot 4整合OpenAPI示例项目</description>
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
        <!-- SpringDoc OpenAPI API: 只包含OpenAPI规范生成,不包含UI(可选) -->
        <!-- 如果只需要生成OpenAPI规范,不需要UI,可以使用这个依赖 -->
        <!--
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-api</artifactId>
            <version>${springdoc.version}</version>
        </dependency>
        -->
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
    name: spring-boot-openapi-demo  # 应用名称
# SpringDoc OpenAPI配置
springdoc:
  api-docs:
    path: /v3/api-docs  # OpenAPI JSON文档路径,默认就是/v3/api-docs
    enabled: true  # 启用API文档生成
  swagger-ui:
    path: /swagger-ui.html  # Swagger UI访问路径,默认是/swagger-ui.html
    enabled: true  # 启用Swagger UI
  default-consumes-media-type: application/json  # 默认请求媒体类型
  default-produces-media-type: application/json  # 默认响应媒体类型
  # 配置OpenAPI规范版本,支持3.0.1和3.1.0
  default-produces-media-type: application/json
  # 使用OpenAPI 3.1规范(需要SpringDoc 2.2.0+)
  # default-flat-param-object: false  # 是否扁平化参数对象
```

## OpenAPI规范结构详解

### OpenAPI规范根对象

OpenAPI规范文档的根对象包含以下字段:

```yaml
openapi: 3.0.0  # OpenAPI规范版本,必需字段
info:  # API基本信息,必需字段
  title: Spring Boot 4 OpenAPI API
  version: 1.0.0
  description: 这是Spring Boot 4整合OpenAPI的示例项目API文档
servers:  # 服务器信息,可选字段
  - url: http://localhost:8080
    description: 开发环境
paths:  # API路径定义,必需字段
  /api/users:
    get:
      summary: 获取用户列表
      responses:
        '200':
          description: 成功
components:  # 可复用组件,可选字段
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string
security:  # 安全方案,可选字段
  - bearerAuth: []
tags:  # 标签定义,可选字段
  - name: 用户管理
    description: 用户相关的CRUD操作
externalDocs:  # 外部文档,可选字段
  description: 更多文档
  url: https://example.com/docs
```

### Info对象

Info对象包含API的基本信息:

```yaml
info:
  title: Spring Boot 4 OpenAPI API  # API标题,必需
  version: 1.0.0  # API版本,必需
  description: 这是Spring Boot 4整合OpenAPI的示例项目API文档  # API描述,可选
  termsOfService: https://example.com/terms  # 服务条款URL,可选
  contact:  # 联系人信息,可选
    name: 鹏磊
    url: https://example.com
    email: penglei@example.com
  license:  # 许可证信息,可选
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html
```

### Servers对象

Servers对象定义API的服务器信息:

```yaml
servers:
  - url: http://localhost:8080  # 服务器URL,必需
    description: 开发环境  # 服务器描述,可选
    variables:  # 服务器变量,可选
      port:
        default: "8080"
        enum:
          - "8080"
          - "8443"
  - url: https://api.example.com
    description: 生产环境
```

### Paths对象

Paths对象定义API的所有路径和操作:

```yaml
paths:
  /api/users:  # 路径,必需
    get:  # HTTP方法,必需
      summary: 获取用户列表  # 操作摘要,可选
      description: 获取所有用户的列表信息  # 操作描述,可选
      operationId: getUsers  # 操作ID,可选
      tags:  # 标签,可选
        - 用户管理
      parameters:  # 参数列表,可选
        - name: page
          in: query
          schema:
            type: integer
      responses:  # 响应定义,必需
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:  # 另一个HTTP方法
      summary: 创建用户
      requestBody:  # 请求体,可选
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreateRequest'
      responses:
        '201':
          description: 创建成功
```

### Components对象

Components对象包含可复用的组件定义:

```yaml
components:
  schemas:  # 数据模型定义
    User:
      type: object
      properties:
        id:
          type: integer
          format: int64
        username:
          type: string
        email:
          type: string
          format: email
      required:
        - id
        - username
  parameters:  # 参数定义
    userId:
      name: id
      in: path
      required: true
      schema:
        type: integer
  responses:  # 响应定义
    NotFound:
      description: 资源不存在
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
  requestBodies:  # 请求体定义
    UserRequest:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UserCreateRequest'
  headers:  # 请求头定义
    X-RateLimit-Limit:
      schema:
        type: integer
  securitySchemes:  # 安全方案定义
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### Schema对象

Schema对象定义数据模型的结构:

```yaml
components:
  schemas:
    User:
      type: object  # 对象类型
      properties:  # 属性定义
        id:
          type: integer  # 整数类型
          format: int64  # 64位整数
          description: 用户ID
          example: 1
        username:
          type: string  # 字符串类型
          description: 用户名
          example: "penglei"
          minLength: 3  # 最小长度
          maxLength: 20  # 最大长度
        email:
          type: string
          format: email  # 邮箱格式
          description: 邮箱
          example: "penglei@example.com"
        age:
          type: integer
          minimum: 1  # 最小值
          maximum: 150  # 最大值
          description: 年龄
          example: 30
        createTime:
          type: string
          format: date-time  # 日期时间格式
          description: 创建时间
      required:  # 必需字段
        - id
        - username
        - email
```

## 从代码生成OpenAPI规范

### 创建实体类

先创建几个实体类,使用OpenAPI注解描述:

```java
package com.example.demo.entity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;
/**
 * 用户实体类
 * @Schema注解用于描述实体类,在OpenAPI规范中生成Schema定义
 */
@Data
@Schema(description = "用户信息")
public class User {
    @Schema(description = "用户ID", example = "1", required = true)
    private Long id;  // 用户ID
    @Schema(description = "用户名", example = "penglei", required = true, minLength = 3, maxLength = 20)
    private String username;  // 用户名
    @Schema(description = "邮箱", example = "penglei@example.com", format = "email")
    private String email;  // 邮箱
    @Schema(description = "年龄", example = "30", minimum = "1", maximum = "150")
    private Integer age;  // 年龄
    @Schema(description = "创建时间", example = "2024-01-01T00:00:00", format = "date-time")
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
    @Schema(description = "用户名", example = "penglei", required = true, minLength = 3, maxLength = 20)
    private String username;  // 用户名,必填,长度3-20
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Schema(description = "邮箱", example = "penglei@example.com", required = true, format = "email")
    private String email;  // 邮箱,必填,必须是邮箱格式
    @NotNull(message = "年龄不能为空")
    @Schema(description = "年龄", example = "30", required = true, minimum = "1", maximum = "150")
    private Integer age;  // 年龄,必填,范围1-150
}
```

### 创建控制器

创建控制器,使用OpenAPI注解描述接口:

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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/**
 * 用户控制器
 * @Tag注解用于给控制器分组,在OpenAPI规范中生成Tag定义
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理", description = "用户相关的CRUD操作接口")
public class UserController {
    // 模拟数据存储(实际项目中应该用Service和Repository)
    private List<User> users = new ArrayList<>();
    /**
     * 获取用户列表
     * @Operation注解用于描述接口操作,在OpenAPI规范中生成Operation定义
     */
    @GetMapping
    @Operation(
        summary = "获取用户列表",
        description = "获取所有用户的列表信息,支持分页查询",
        operationId = "getUsers"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "获取成功",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = User.class)
            )
        )
    })
    public ResponseEntity<List<User>> getUsers(
            @Parameter(description = "页码", example = "1")
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10")
            @RequestParam(required = false, defaultValue = "10") Integer size) {
        return ResponseEntity.ok(users);  // 返回用户列表
    }
    /**
     * 根据ID获取用户
     * @Parameter注解用于描述参数,在OpenAPI规范中生成Parameter定义
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "根据ID获取用户",
        description = "根据用户ID获取用户详细信息,如果用户不存在则返回404",
        operationId = "getUserById"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "获取成功",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = User.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "用户不存在",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = Error.class)
            )
        )
    })
    public ResponseEntity<User> getUserById(
            @Parameter(
                description = "用户ID",
                required = true,
                example = "1",
                schema = @Schema(type = "integer", format = "int64")
            )
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
     * @RequestBody表示请求体,在OpenAPI规范中生成RequestBody定义
     */
    @PostMapping
    @Operation(
        summary = "创建用户",
        description = "创建一个新用户,需要提供用户名、邮箱、年龄等信息",
        operationId = "createUser"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "201",
            description = "创建成功",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = User.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "参数校验失败",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = Error.class)
            )
        )
    })
    public ResponseEntity<User> createUser(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "用户创建请求",
                required = true,
                content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    schema = @Schema(implementation = UserCreateRequest.class)
                )
            )
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
    @Operation(
        summary = "更新用户",
        description = "根据ID更新用户信息",
        operationId = "updateUser"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "更新成功",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = User.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "用户不存在",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = Error.class)
            )
        )
    })
    public ResponseEntity<User> updateUser(
            @Parameter(description = "用户ID", required = true)
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "用户更新请求",
                required = true,
                content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    schema = @Schema(implementation = UserCreateRequest.class)
                )
            )
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
    @Operation(
        summary = "删除用户",
        description = "根据ID删除用户",
        operationId = "deleteUser"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "204",
            description = "删除成功"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "用户不存在",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = Error.class)
            )
        )
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
 * OpenAPI配置类
 * 用于自定义OpenAPI规范文档信息
 */
@Configuration
public class OpenAPIConfig {
    /**
     * 自定义OpenAPI信息
     * 包括API标题、描述、版本、联系人等信息
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .openapi("3.0.1")  // 指定OpenAPI规范版本,支持3.0.0、3.0.1、3.1.0
                .info(new Info()
                        .title("Spring Boot 4 OpenAPI API文档")  // API标题
                        .version("1.0.0")  // API版本
                        .description("这是Spring Boot 4整合OpenAPI的示例项目API文档\n\n" +
                                "## 功能特性\n" +
                                "- 用户管理: 支持用户的CRUD操作\n" +
                                "- 接口文档: 自动生成OpenAPI规范文档\n" +
                                "- 在线测试: 支持在Swagger UI中测试接口")  // API描述,支持Markdown格式
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
                ))
                .externalDocs(new io.swagger.v3.oas.models.ExternalDocumentation()
                        .description("更多文档")
                        .url("https://example.com/docs"));  // 外部文档链接
    }
}
```

## 手动编写OpenAPI规范文件

### 创建OpenAPI规范文件

除了从代码自动生成,也可以手动编写OpenAPI规范文件;在`src/main/resources/openapi/openapi.yaml`创建文件:

```yaml
openapi: 3.0.1  # OpenAPI规范版本
info:
  title: Spring Boot 4 OpenAPI API
  version: 1.0.0
  description: |
    这是Spring Boot 4整合OpenAPI的示例项目API文档
    
    ## 功能特性
    - 用户管理: 支持用户的CRUD操作
    - 接口文档: 自动生成OpenAPI规范文档
    - 在线测试: 支持在Swagger UI中测试接口
  contact:
    name: 鹏磊
    email: penglei@example.com
    url: https://example.com
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html
servers:
  - url: http://localhost:8080
    description: 开发环境
  - url: https://api.example.com
    description: 生产环境
paths:
  /api/users:
    get:
      summary: 获取用户列表
      description: 获取所有用户的列表信息,支持分页查询
      operationId: getUsers
      tags:
        - 用户管理
      parameters:
        - name: page
          in: query
          description: 页码
          required: false
          schema:
            type: integer
            default: 1
            minimum: 1
        - name: size
          in: query
          description: 每页大小
          required: false
          schema:
            type: integer
            default: 10
            minimum: 1
            maximum: 100
      responses:
        '200':
          description: 获取成功
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
        '500':
          description: 服务器错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
    post:
      summary: 创建用户
      description: 创建一个新用户,需要提供用户名、邮箱、年龄等信息
      operationId: createUser
      tags:
        - 用户管理
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreateRequest'
            examples:
              example1:
                summary: 示例1
                value:
                  username: penglei
                  email: penglei@example.com
                  age: 30
      responses:
        '201':
          description: 创建成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: 参数校验失败
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: 服务器错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  /api/users/{id}:
    get:
      summary: 根据ID获取用户
      description: 根据用户ID获取用户详细信息,如果用户不存在则返回404
      operationId: getUserById
      tags:
        - 用户管理
      parameters:
        - name: id
          in: path
          required: true
          description: 用户ID
          schema:
            type: integer
            format: int64
            example: 1
      responses:
        '200':
          description: 获取成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: 用户不存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: 服务器错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
    put:
      summary: 更新用户
      description: 根据ID更新用户信息
      operationId: updateUser
      tags:
        - 用户管理
      parameters:
        - name: id
          in: path
          required: true
          description: 用户ID
          schema:
            type: integer
            format: int64
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreateRequest'
      responses:
        '200':
          description: 更新成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: 用户不存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: 服务器错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
    delete:
      summary: 删除用户
      description: 根据ID删除用户
      operationId: deleteUser
      tags:
        - 用户管理
      parameters:
        - name: id
          in: path
          required: true
          description: 用户ID
          schema:
            type: integer
            format: int64
      responses:
        '204':
          description: 删除成功
        '404':
          description: 用户不存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: 服务器错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
    User:
      type: object
      description: 用户信息
      properties:
        id:
          type: integer
          format: int64
          description: 用户ID
          example: 1
        username:
          type: string
          description: 用户名
          example: "penglei"
          minLength: 3
          maxLength: 20
        email:
          type: string
          format: email
          description: 邮箱
          example: "penglei@example.com"
        age:
          type: integer
          description: 年龄
          example: 30
          minimum: 1
          maximum: 150
        createTime:
          type: string
          format: date-time
          description: 创建时间
          example: "2024-01-01T00:00:00"
      required:
        - id
        - username
        - email
    UserCreateRequest:
      type: object
      description: 创建用户请求
      properties:
        username:
          type: string
          description: 用户名
          example: "penglei"
          minLength: 3
          maxLength: 20
        email:
          type: string
          format: email
          description: 邮箱
          example: "penglei@example.com"
        age:
          type: integer
          description: 年龄
          example: 30
          minimum: 1
          maximum: 150
      required:
        - username
        - email
        - age
    Error:
      type: object
      description: 错误信息
      properties:
        code:
          type: integer
          description: 错误码
          example: 404
        message:
          type: string
          description: 错误信息
          example: "用户不存在"
        timestamp:
          type: string
          format: date-time
          description: 时间戳
          example: "2024-01-01T00:00:00"
      required:
        - code
        - message
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT Token认证
security:
  - bearerAuth: []
tags:
  - name: 用户管理
    description: 用户相关的CRUD操作接口
    externalDocs:
      description: 更多文档
      url: https://example.com/docs/users
```

### 加载外部OpenAPI规范文件

如果手动编写了OpenAPI规范文件,可以在配置类中加载:

```java
package com.example.demo.config;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.parser.OpenAPIV3Parser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
/**
 * 加载外部OpenAPI规范文件
 */
@Configuration
public class ExternalOpenAPIConfig {
    /**
     * 从YAML文件加载OpenAPI规范
     */
    @Bean
    public OpenAPI loadExternalOpenAPI() throws IOException {
        // 读取OpenAPI规范文件
        ClassPathResource resource = new ClassPathResource("openapi/openapi.yaml");
        String yamlContent = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        // 解析YAML文件
        OpenAPIV3Parser parser = new OpenAPIV3Parser();
        OpenAPI openAPI = parser.readContents(yamlContent, null, null).getOpenAPI();
        return openAPI;
    }
}
```

## OpenAPI 3.0和3.1的区别

### OpenAPI 3.1新特性

OpenAPI 3.1相比3.0的主要改进:

1. **JSON Schema 2020-12支持**: 支持最新的JSON Schema规范
2. **更好的类型系统**: 改进了类型定义和验证
3. **Webhooks支持**: 原生支持Webhooks定义
4. **更好的扩展性**: 改进了扩展机制

### 配置OpenAPI 3.1

在配置类中指定OpenAPI 3.1版本:

```java
@Bean
public OpenAPI customOpenAPI() {
    return new OpenAPI()
            .openapi("3.1.0")  // 使用OpenAPI 3.1规范
            .info(new Info()
                    .title("Spring Boot 4 OpenAPI API文档")
                    .version("1.0.0"));
}
```

在配置文件中也可以指定:

```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
  # 使用OpenAPI 3.1规范(需要SpringDoc 2.2.0+)
  default-flat-param-object: false
```

## 组件复用

### 定义可复用组件

在OpenAPI规范中,可以使用`$ref`引用组件:

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string
  parameters:
    userId:
      name: id
      in: path
      required: true
      schema:
        type: integer
  responses:
    NotFound:
      description: 资源不存在
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

### 在代码中使用组件引用

在代码中,可以使用`@Schema`注解引用组件:

```java
@GetMapping("/{id}")
@Operation(summary = "根据ID获取用户")
@ApiResponses({
    @ApiResponse(
        responseCode = "404",
        description = "用户不存在",
        content = @Content(
            mediaType = MediaType.APPLICATION_JSON_VALUE,
            schema = @Schema(ref = "#/components/schemas/Error")  // 引用组件
        )
    )
})
public ResponseEntity<User> getUserById(@PathVariable Long id) {
    // 实现代码
}
```

## 安全方案配置

### 定义安全方案

在OpenAPI规范中定义安全方案:

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT Token认证
    basicAuth:
      type: http
      scheme: basic
      description: Basic认证
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
      description: API Key认证
```

### 在代码中配置安全方案

```java
@Bean
public OpenAPI customOpenAPI() {
    return new OpenAPI()
            .info(new Info()
                    .title("Spring Boot 4 OpenAPI API文档")
                    .version("1.0.0"))
            .components(new Components()
                    .addSecuritySchemes("bearer-jwt",
                            new SecurityScheme()
                                    .type(SecurityScheme.Type.HTTP)
                                    .scheme("bearer")
                                    .bearerFormat("JWT")
                                    .description("请输入JWT Token")))
            .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));  // 默认所有接口都需要认证
}
```

### 在接口中使用安全方案

```java
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理")
@SecurityRequirement(name = "bearer-jwt")  // 这个控制器下的所有接口都需要认证
public class UserController {
    @GetMapping("/public")
    @Operation(summary = "公开接口")
    @SecurityRequirements()  // 覆盖控制器级别的安全要求,这个接口不需要认证
    public ResponseEntity<String> publicEndpoint() {
        return ResponseEntity.ok("这是公开接口");
    }
    @GetMapping("/private")
    @Operation(summary = "私有接口")
    // 使用控制器级别的安全要求,需要认证
    public ResponseEntity<String> privateEndpoint() {
        return ResponseEntity.ok("这是私有接口");
    }
}
```

## 导出和使用OpenAPI规范

### 导出OpenAPI规范

启动应用后,可以通过以下方式获取OpenAPI规范:

1. **JSON格式**: `http://localhost:8080/v3/api-docs`
2. **YAML格式**: `http://localhost:8080/v3/api-docs.yaml`
3. **特定分组**: `http://localhost:8080/v3/api-docs/{group-name}`

### 使用OpenAPI规范生成代码

可以使用OpenAPI Generator根据规范生成客户端代码:

```bash
# 安装OpenAPI Generator
npm install @openapitools/openapi-generator-cli -g
# 生成Java客户端代码
openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g java \
  -o ./generated-client
```

### 使用OpenAPI规范进行测试

可以使用Postman、Insomnia等工具导入OpenAPI规范进行接口测试。

## 最佳实践

1. **使用注解生成**: 优先使用注解从代码生成OpenAPI规范,保持代码和文档同步
2. **组件复用**: 使用components定义可复用的组件,减少重复定义
3. **版本控制**: 使用URL版本控制,如`/api/v1/users`
4. **统一响应格式**: 定义统一的响应格式,方便前端处理
5. **错误处理**: 定义统一的错误响应格式,在OpenAPI规范中展示
6. **安全配置**: 需要认证的接口配置安全方案
7. **示例数据**: 提供真实的示例数据,方便前端理解
8. **文档更新**: 接口变更时及时更新OpenAPI规范
9. **规范验证**: 使用工具验证OpenAPI规范的合法性
10. **代码生成**: 使用OpenAPI Generator生成客户端代码,提高开发效率

## 常见问题

### 1. OpenAPI规范不生成

检查配置是否正确:

```yaml
springdoc:
  api-docs:
    enabled: true
    path: /v3/api-docs
```

### 2. 实体类字段不显示

确保实体类有getter方法,或者使用Lombok的`@Data`注解。

### 3. 手动编写的规范文件不生效

检查文件路径和加载方式是否正确。

### 4. OpenAPI 3.1不生效

确保SpringDoc版本支持OpenAPI 3.1(需要2.2.0+),并在配置中指定版本。

### 5. 组件引用不生效

检查`$ref`路径是否正确,确保组件已定义。

### 6. 安全方案不生效

检查安全配置是否正确,确保`@SecurityRequirement`注解正确使用。

### 7. 外部文档链接不显示

检查`externalDocs`配置是否正确。

### 8. 服务器信息不显示

检查`servers`配置是否正确。

### 9. 标签分组不生效

检查`tags`配置是否正确,确保在接口中使用了`@Tag`注解。

### 10. 规范文件格式错误

使用在线工具验证OpenAPI规范的合法性,如https://editor.swagger.io/。

## Schema对象详解

### 数据类型

OpenAPI支持以下基本数据类型:

1. **string**: 字符串类型
2. **number**: 数字类型(包括整数和浮点数)
3. **integer**: 整数类型
4. **boolean**: 布尔类型
5. **array**: 数组类型
6. **object**: 对象类型
7. **null**: 空值类型(OpenAPI 3.1+)

### 数据格式

OpenAPI支持以下数据格式:

1. **string格式**:

- `date`: 日期格式,如"2024-01-01"
- `date-time`: 日期时间格式,如"2024-01-01T00:00:00Z"
- `email`: 邮箱格式
- `uri`: URI格式
- `uuid`: UUID格式
- `password`: 密码格式(用于隐藏显示)
- `byte`: Base64编码的字节
- `binary`: 二进制数据
2. **integer格式**:

- `int32`: 32位整数
- `int64`: 64位整数
3. **number格式**:

- `float`: 单精度浮点数
- `double`: 双精度浮点数

### Schema对象属性

Schema对象支持以下属性:

```yaml
components:
  schemas:
    User:
      type: object  # 数据类型,必需
      title: 用户信息  # 标题,可选
      description: 用户实体类  # 描述,可选
      properties:  # 属性定义,可选
        id:
          type: integer
          format: int64
      required:  # 必需字段列表,可选
        - id
        - username
      nullable: false  # 是否允许null值,可选
      readOnly: false  # 是否只读,可选
      writeOnly: false  # 是否只写,可选
      deprecated: false  # 是否已废弃,可选
      example:  # 示例值,可选
        id: 1
        username: "penglei"
      examples:  # 多个示例值,可选
        - id: 1
          username: "penglei"
        - id: 2
          username: "zhangsan"
      default:  # 默认值,可选
        id: 0
      enum:  # 枚举值,可选
        - ACTIVE
        - INACTIVE
      allOf:  # 组合多个Schema,可选
        - $ref: '#/components/schemas/BaseEntity'
        - type: object
          properties:
            username:
              type: string
      oneOf:  # 满足其中一个Schema,可选
        - $ref: '#/components/schemas/Cat'
        - $ref: '#/components/schemas/Dog'
      anyOf:  # 满足任意一个Schema,可选
        - $ref: '#/components/schemas/Error1'
        - $ref: '#/components/schemas/Error2'
      not:  # 不满足指定的Schema,可选
        $ref: '#/components/schemas/Invalid'
      discriminator:  # 鉴别器,用于多态,可选
        propertyName: type
        mapping:
          cat: '#/components/schemas/Cat'
          dog: '#/components/schemas/Dog'
```

### 字符串约束

字符串类型支持以下约束:

```yaml
username:
  type: string
  minLength: 3  # 最小长度
  maxLength: 20  # 最大长度
  pattern: "^[a-zA-Z0-9_]+$"  # 正则表达式
  format: email  # 格式
```

### 数字约束

数字类型支持以下约束:

```yaml
age:
  type: integer
  minimum: 1  # 最小值
  maximum: 150  # 最大值
  exclusiveMinimum: true  # 是否排除最小值
  exclusiveMaximum: false  # 是否排除最大值
  multipleOf: 1  # 倍数
```

### 数组约束

数组类型支持以下约束:

```yaml
tags:
  type: array
  items:  # 数组元素类型
    type: string
  minItems: 1  # 最小元素数量
  maxItems: 10  # 最大元素数量
  uniqueItems: true  # 元素是否唯一
```

### 对象约束

对象类型支持以下约束:

```yaml
metadata:
  type: object
  additionalProperties:  # 允许额外属性
    type: string
  minProperties: 1  # 最小属性数量
  maxProperties: 10  # 最大属性数量
```

## 复杂数据结构

### 嵌套对象

定义嵌套对象:

```yaml
components:
  schemas:
    Order:
      type: object
      properties:
        id:
          type: integer
        user:  # 嵌套对象
          type: object
          properties:
            id:
              type: integer
            username:
              type: string
        items:  # 嵌套数组
          type: array
          items:
            type: object
            properties:
              productId:
                type: integer
              quantity:
                type: integer
```

### 使用引用定义嵌套对象

更好的方式是使用引用:

```yaml
components:
  schemas:
    Order:
      type: object
      properties:
        id:
          type: integer
        user:
          $ref: '#/components/schemas/User'  # 引用User Schema
        items:
          type: array
          items:
            $ref: '#/components/schemas/OrderItem'  # 引用OrderItem Schema
    User:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string
    OrderItem:
      type: object
      properties:
        productId:
          type: integer
        quantity:
          type: integer
```

### 继承和组合

使用`allOf`实现继承:

```yaml
components:
  schemas:
    BaseEntity:
      type: object
      properties:
        id:
          type: integer
        createTime:
          type: string
          format: date-time
        updateTime:
          type: string
          format: date-time
    User:
      allOf:  # 组合BaseEntity和User特有属性
        - $ref: '#/components/schemas/BaseEntity'
        - type: object
          properties:
            username:
              type: string
            email:
              type: string
```

### 多态支持

使用`discriminator`实现多态:

```yaml
components:
  schemas:
    Pet:
      type: object
      required:
        - type
      properties:
        type:
          type: string
      discriminator:
        propertyName: type
        mapping:
          cat: '#/components/schemas/Cat'
          dog: '#/components/schemas/Dog'
    Cat:
      allOf:
        - $ref: '#/components/schemas/Pet'
        - type: object
          properties:
            type:
              type: string
              enum:
                - cat
            huntingSkill:
              type: string
              enum:
                - lazy
                - aggressive
    Dog:
      allOf:
        - $ref: '#/components/schemas/Pet'
        - type: object
          properties:
            type:
              type: string
              enum:
                - dog
            packSize:
              type: integer
```

## 文件上传的OpenAPI规范

### 单文件上传

定义单文件上传接口:

```yaml
paths:
  /api/files/upload:
    post:
      summary: 上传单个文件
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                description:
                  type: string
      responses:
        '200':
          description: 上传成功
```

### 多文件上传

定义多文件上传接口:

```yaml
paths:
  /api/files/upload-multiple:
    post:
      summary: 上传多个文件
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                files:
                  type: array
                  items:
                    type: string
                    format: binary
      responses:
        '200':
          description: 上传成功
```

### 在代码中定义文件上传

```java
@PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@Operation(summary = "上传单个文件")
@io.swagger.v3.oas.annotations.parameters.RequestBody(
    description = "文件上传请求",
    required = true,
    content = @Content(
        mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
        schema = @Schema(
            type = "object",
            properties = {
                @SchemaProperty(name = "file", schema = @Schema(type = "string", format = "binary")),
                @SchemaProperty(name = "description", schema = @Schema(type = "string"))
            }
        )
    )
)
public ResponseEntity<String> uploadFile(
        @RequestPart("file") MultipartFile file,
        @RequestPart(value = "description", required = false) String description) {
    // 实现代码
}
```

## 参数序列化

### Query参数序列化

定义Query参数的序列化方式:

```yaml
parameters:
  - name: filter
    in: query
    style: form  # 序列化样式: form, spaceDelimited, pipeDelimited, deepObject
    explode: true  # 是否展开数组
    schema:
      type: object
      properties:
        name:
          type: string
        age:
          type: integer
```

### Path参数序列化

定义Path参数的序列化方式:

```yaml
parameters:
  - name: id
    in: path
    required: true
    style: simple  # 序列化样式: simple, label, matrix
    explode: false
    schema:
      type: integer
```

### Header参数序列化

定义Header参数的序列化方式:

```yaml
parameters:
  - name: X-User-Id
    in: header
    style: simple
    explode: false
    schema:
      type: integer
```

## 响应定义

### 定义响应

定义详细的响应:

```yaml
responses:
  '200':
    description: 获取成功
    headers:  # 响应头定义
      X-RateLimit-Limit:
        schema:
          type: integer
        description: 请求限制数量
      X-RateLimit-Remaining:
        schema:
          type: integer
        description: 剩余请求数量
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
        examples:  # 多个示例
          user1:
            summary: 用户示例1
            value:
              id: 1
              username: "penglei"
          user2:
            summary: 用户示例2
            value:
              id: 2
              username: "zhangsan"
      application/xml:
        schema:
          $ref: '#/components/schemas/User'
```

### 使用引用定义响应

定义可复用的响应:

```yaml
components:
  responses:
    NotFound:
      description: 资源不存在
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    BadRequest:
      description: 参数错误
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    InternalServerError:
      description: 服务器错误
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
paths:
  /api/users/{id}:
    get:
      responses:
        '200':
          description: 获取成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'  # 引用响应定义
        '500':
          $ref: '#/components/responses/InternalServerError'
```

## Webhooks支持(OpenAPI 3.1)

OpenAPI 3.1支持Webhooks定义:

```yaml
openapi: 3.1.0
webhooks:
  newPet:  # Webhook名称
    post:  # HTTP方法
      requestBody:
        description: 新宠物信息
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
      responses:
        '200':
          description: Webhook处理成功
```

## 验证OpenAPI规范

### 使用在线工具验证

可以使用以下在线工具验证OpenAPI规范:

1. **Swagger Editor**: https://editor.swagger.io/
2. **OpenAPI Validator**: https://validator.swagger.io/
3. **Swagger UI**: https://swagger.io/tools/swagger-ui/

### 使用命令行工具验证

使用swagger-cli验证:

```bash
# 安装swagger-cli
npm install -g @apidevtools/swagger-cli
# 验证OpenAPI规范文件
swagger-cli validate openapi.yaml
# 合并多个OpenAPI文件
swagger-cli bundle openapi.yaml -o bundled.yaml
```

### 使用Java库验证

使用swagger-parser验证:

```xml
<dependency>
    <groupId>io.swagger.parser.v3</groupId>
    <artifactId>swagger-parser</artifactId>
    <version>2.1.16</version>
</dependency>
```

```java
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.ParseOptions;
import io.swagger.v3.parser.core.models.SwaggerParseResult;
public class OpenAPIValidator {
    public static void validate(String yamlContent) {
        OpenAPIV3Parser parser = new OpenAPIV3Parser();
        ParseOptions options = new ParseOptions();
        options.setResolve(true);  // 解析引用
        options.setFlatten(true);  // 扁平化
        SwaggerParseResult result = parser.readContents(yamlContent, null, options);
        if (result.getMessages() != null && !result.getMessages().isEmpty()) {
            // 有错误或警告
            result.getMessages().forEach(System.out::println);
        } else {
            // 验证通过
            System.out.println("OpenAPI规范验证通过");
        }
    }
}
```

## 使用OpenAPI Generator生成代码

### 安装OpenAPI Generator

```bash
# 使用npm安装
npm install @openapitools/openapi-generator-cli -g
# 或使用Homebrew安装(Mac)
brew install openapi-generator
# 或使用Docker
docker pull openapitools/openapi-generator-cli
```

### 生成Java客户端

```bash
# 从URL生成
openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g java \
  -o ./generated-client/java
# 从文件生成
openapi-generator-cli generate \
  -i openapi.yaml \
  -g java \
  -o ./generated-client/java \
  --additional-properties=library=resttemplate,dateLibrary=java8
```

### 生成TypeScript客户端

```bash
openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g typescript-axios \
  -o ./generated-client/typescript
```

### 生成服务端代码

```bash
# 生成Spring Boot服务端代码
openapi-generator-cli generate \
  -i openapi.yaml \
  -g spring \
  -o ./generated-server/spring \
  --additional-properties=library=spring-boot,interfaceOnly=true
```

## 集成测试

### 测试OpenAPI规范生成

```java
package com.example.demo;
import io.swagger.v3.oas.models.OpenAPI;
import org.springdoc.core.service.OpenAPIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringJUnitTest;
import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest
class OpenAPITest {
    @Autowired
    private OpenAPIService openAPIService;
    @Test
    void testOpenAPIGeneration() {
        // 获取生成的OpenAPI规范
        OpenAPI openAPI = openAPIService.build();
        // 验证基本信息
        assertNotNull(openAPI);
        assertNotNull(openAPI.getInfo());
        assertEquals("Spring Boot 4 OpenAPI API文档", openAPI.getInfo().getTitle());
        assertEquals("1.0.0", openAPI.getInfo().getVersion());
        // 验证路径定义
        assertNotNull(openAPI.getPaths());
        assertTrue(openAPI.getPaths().containsKey("/api/users"));
        // 验证组件定义
        assertNotNull(openAPI.getComponents());
        assertNotNull(openAPI.getComponents().getSchemas());
        assertTrue(openAPI.getComponents().getSchemas().containsKey("User"));
    }
}
```

### 测试OpenAPI端点

```java
@SpringBootTest
@AutoConfigureMockMvc
class OpenAPIEndpointTest {
    @Autowired
    private MockMvc mockMvc;
    @Test
    void testOpenAPIDocs() throws Exception {
        // 测试JSON格式
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.openapi").exists())
                .andExpect(jsonPath("$.info.title").value("Spring Boot 4 OpenAPI API文档"));
    }
    @Test
    void testOpenAPIDocsYaml() throws Exception {
        // 测试YAML格式
        mockMvc.perform(get("/v3/api-docs.yaml"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/x-yaml"));
    }
}
```

## 性能优化

### 缓存OpenAPI规范

可以缓存生成的OpenAPI规范,提高性能:

```java
@Configuration
public class OpenAPICacheConfig {
    @Bean
    public OpenAPIService openAPIService() {
        SpringDocConfigProperties properties = new SpringDocConfigProperties();
        properties.setCacheDisabled(false);  // 启用缓存
        return new OpenAPIService(properties, ...);
    }
}
```

### 限制扫描路径

只扫描需要的包,减少扫描时间:

```yaml
springdoc:
  packages-to-scan: com.example.demo.controller
  paths-to-match: /api/**
  paths-to-exclude: /error, /actuator/**
```

## 总结

Spring Boot 4整合OpenAPI非常方便,只需要添加`springdoc-openapi-starter-webmvc-ui`依赖就能用;OpenAPI是一个标准的API规范格式,可以描述HTTP API的完整信息,包括路径、参数、返回值、错误码等;支持从代码自动生成OpenAPI规范,也支持手动编写规范文件;支持OpenAPI 3.0和3.1规范;支持组件复用、安全方案配置、Webhooks等高级功能;可以根据OpenAPI规范生成客户端代码、服务端代码、进行接口测试;支持复杂数据结构、多态、继承等高级特性;兄弟们根据实际需求选择合适的配置,就能轻松搞定API规范了;但是要注意保持代码和文档同步,及时更新OpenAPI规范,确保文档的准确性;同时要注意使用工具验证OpenAPI规范的合法性,避免规范错误导致的问题。
