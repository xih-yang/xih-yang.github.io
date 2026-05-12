# 29、Spring Boot 3.x - RESTful API集成SpringDoc&amp;Swagger-UI
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/29.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
`springdoc-openapi` 帮助使用Spring Boot项目自动化API文档的生成。`springdoc-openapi`的工作原理是在运行时检查应用程序，根据Spring配置、类结构和各种注释推断`API`语义。

自动生成`JSON/YAML`和`HTML`格式的`API`文档。这个文档可以通过使用`swagger-api`注解来完成。

官方网站：[springdoc.org](https://springdoc.org/v2/#Introduction)

由于`Spring Boot 3`使用的是`Jakarta EE 9`，对应的`springdoc`版本需要升级到`v2`,目前里程碑`M2`版本。支持以下内容：

- OpenAPI 3
- Spring-boot v3 (Java 17 & Jakarta EE 9)
- JSR-303 特别注解 @NotNull, @Min, @Max, 和 @Size.
- Swagger-ui
- OAuth 2
- GraalVM native images

> Swagger2已经在17年停止维护了，取而代之的是 Swagger3（基于OpenAPI 3),OpenApi是业界真正的 api 文档标准，其是由 Swagger 来维护。

这是一个基于社区的项目，不是由Spring Framework贡献者(Pivotal)维护的。

## 一、快速开始

为了集成`spring-boot`和`swagger-ui`，将下列依赖添加到你项目即可(不需要额外的配置)。

```java
   <dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
      <version>2.0.0-M2</version>
   </dependency>
```

这样自动将`swagger-ui`部署到一个`spring-boot`应用程序:

**1、** 使用官方的`swagger-uijar`，可以获得`HTML`格式的文档；

**2、** SwaggerUI页面地址`http://server:port/context-path/swagger-ui.html`，`OpenAPI`描述将在以下`json`格式的`url`上可用:`http://server:port/context-path/v3/api-docs`；

> 例如：http://localhost:8080/swagger-ui.html http://localhost:8080/v3/-api-docs

**1、** 文档也可以以`yaml`格式提供，位于以下路径:`/v3/api-docs.yaml`；

> 对于HTML格式的swagger文档的自定义路径，在spring-boot配置文件中添加一个自定义springdoc属性:。
>
> springdoc.swagger-ui.path=/swagger-ui.html

## 二、Springdoc-openapi模块

### Spring WebMvc支持

```xml
<dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webmvc-api</artifactId>
      <version>2.0.0-M2</version>
   </dependency>
```

### Spring WebFlux 支持

```java
 <dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webflux-ui</artifactId>
      <version>2.0.0-M2</version>
   </dependency>
```

## 三、Restful Api服务集成

本节已[Spring Boot3 Restful Api服务](/zhuanlan/j2ee/springboot/9/28.html)为例集成。

**1、** 在原有项目基础上加入SpringDocwebmvc依赖；

**2、** 启动项目；

**3、** 访问`http://localhost:8080/swagger-ui/index.html`；

### 基础配置

**1.接口文档全局基础信息配置。**

```java
/**
 * spring doc配置
 */
@Configuration
public class SpringDocConfig {
    @Bean
    public OpenAPI restfulOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("Spring Boot3 Restful Zoo API")
                        .description("Zoo & Animal Detail APi")
                        .version("v0.0.1")
                        .license(new License().name("Apache 2.0").url("http://springdoc.org")))
                .externalDocs(new ExternalDocumentation()
                        .description("SpringDoc Wiki Documentation")
                        .url("https://springdoc.org/v2"));
    }
}
```

**2.重启项目，接口文档展示具体的描述以及开源协议和wiki地址。**

**3.接口描述和字段描述**

默认情况下接口的功能描述和参数以及字段描述都为空，需要添加对应的注解`SpringDoc`才能解析：

在swagger2中SpringFox项目使用非常广泛，它也是让spring boot项目快速的集成swagger。目前此项目已经停止更新。那么他们直接注解的对应关系如下：

```java
@Api → @Tag
@ApiIgnore → @Parameter(hidden = true) or @Operation(hidden = true) or @Hidden
@ApiImplicitParam → @Parameter
@ApiImplicitParams → @Parameters
@ApiModel → @Schema
@ApiModelProperty(hidden = true) → @Schema(accessMode = READ_ONLY)
@ApiModelProperty → @Schema
@ApiOperation(value = "foo", notes = "bar") → @Operation(summary = "foo", description = "bar")
@ApiParam → @Parameter
@ApiResponse(code = 404, message = "foo") → @ApiResponse(responseCode = "404", description = "foo")
```

下面已`ZooController`为例：

`@Tag 描述整个Controller`

```java
@Tag(name = "ZooController", description = "动物园API")
@RestController
@RequestMapping("/zoos")
public class ZooController {
     }
```

`@Operation描述具体接口信息，@Parameter描述参数信息 @ApiResponse 接口响应描述信息`

```java
  //描述具体接口信息，参数信息
    @Operation(summary = "获取动物园详情", description = "返回单个对象",
            parameters = {
     @Parameter(name = "id", description = "动物园id")})
    @ApiResponse(responseCode = "2xx",description = "动物园实体对象")
    @SneakyThrows
    @GetMapping(value = "/{id}")
    public ResponseEntity<ZooResponse> detail(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(zooService.detail(id));
    }
```

`@Schema` 描述对象信息

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "ZooResponse", title = "动物园对象")
public class ZooResponse implements Serializable {
    @Schema(title = "动物园id")
    private Integer id;
    @Schema(title = "动物园名称")
    private String name;
    @Schema(title = "动物园地址")
    private String address;
    @Schema(title = "动物园电话")
    private String telephone;
}
```

## 总结

SpringDoc集成Swagger到Spring Boot3 非常的方便，目前2者都是m2版本，等待最终GA版本。
