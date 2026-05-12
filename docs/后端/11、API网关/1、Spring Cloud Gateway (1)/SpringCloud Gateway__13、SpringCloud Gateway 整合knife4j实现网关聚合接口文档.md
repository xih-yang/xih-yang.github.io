# 13、SpringCloud Gateway 整合knife4j实现网关聚合接口文档
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/29.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 前言

在微服务架构下，每个后台应用都接入swagger 在线文档，在服务特别多的情况下，就需要做聚合文档处理，也就是将所有服务的文档聚合在一起。

`Spring Cloud Gateway`作为微服务的API网关，可以整合swagger 实现聚合接口文档。

## 方式1 Spring Cloud Gateway

方式1使用`Spring Cloud Gateway`直接聚合，使用[knife4j](https://doc.xiaominfo.com/knife4j/documentation/description.html) 作为在线接口文档。

### 1. 后台服务配置 knife4j

首先在后台应用中添加knife4j 依赖。

```xml
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-spring-boot-starter</artifactId>
    <version>2.0.9</version>
</dependency>
```

添加配置类：

```java
@Configuration
@EnableSwagger2WebMvc
@EnableKnife4j
public class SwaggerConfiguration {
    @Bean(value = "userApi")
    @Order(value = 1)
    public Docket groupRestApi() {
        return new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(groupApiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage("org.pearl.app"))
                .paths(PathSelectors.any())
                .build();
    }
    private ApiInfo groupApiInfo() {
        return new ApiInfoBuilder()
                .title("swagger-bootstrap-ui很棒~~~！！！")
                .description("<div style='font-size:14px;color:red;'>swagger-bootstrap-ui-demo RESTful APIs</div>")
                .termsOfServiceUrl("http://www.group.com/")
                .contact("group@qq.com")
                .version("1.0")
                .build();
    }
}
```

添加一个测试接口

```java
@RestController
@RequestMapping("/app1")
@Api(tags = "测试")
public class App1Controller {
    @GetMapping("/test")
    @ApiOperation(value = "测试接口")
    @ApiOperationSupport(author = "xiaoymin@foxmail.com")
    public Object test() {
        return "app1";
    }
}
```

访问`/doc.html`并测试：

### 2. 网关聚合

**思路**： 在文档首页，是有一个分组功能的，如果我们按照服务名来分组，显示在这里，就能实现聚合了。

可以打开F12，看到，是通过`/swagger-resources` 路径来访问展示资源的，那么我们可以重写这个接口。

首先在`gateway` 项目也引入knife4j 的依赖：

```xml
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-spring-boot-starter</artifactId>
    <version>2.0.9</version>
</dependency>
```

自定义实现`SwaggerResourcesProvider`，在网关中查询路由信息，生成对应的资源信息。

```java
@Component
@RequiredArgsConstructor
public class MySwaggerResourceProvider implements SwaggerResourcesProvider {
    /**
     * swagger2默认的url后缀
     */
    private static final String SWAGGER2_URL = "/v2/api-docs";
    /**
     * 路由定位器
     */
    private final RouteLocator routeLocator;
    /**
     * 网关应用名称
     */
    @Value("${spring.application.name}")
    private String gatewayName;
    /**
     * 获取 Swagger 资源
     */
    @Override
    public List<SwaggerResource> get() {
        List<SwaggerResource> resources = new ArrayList<>();
        List<String> routeHosts = new ArrayList<>();
        // 1. 获取路由Uri 中的Host=> 服务注册则为服务名=》app-service001
        routeLocator.getRoutes()
                .filter(route -> route.getUri().getHost() != null)
                .filter(route -> !gatewayName.equals(route.getUri().getHost()))
                .subscribe(route -> routeHosts.add(route.getUri().getHost()));
        // 2. 创建自定义资源
        for (String routeHost : routeHosts) {
            String serviceUrl = "/" + routeHost + SWAGGER2_URL; // 后台访问添加服务名前缀
            SwaggerResource swaggerResource = new SwaggerResource(); // 创建Swagger 资源
            swaggerResource.setUrl(serviceUrl); // 设置访问地址
            swaggerResource.setName(routeHost); // 设置名称
            swaggerResource.setSwaggerVersion("3.0.0");
            resources.add(swaggerResource);
        }
        return resources;
    }
}
```

添加一个`/swagger-resources` 访问接口，覆盖默认。

```java
@RestController
@RequestMapping("/swagger-resources")
@RequiredArgsConstructor
public class SwaggerResourceController {
    private final  MySwaggerResourceProvider swaggerResourceProvider;
    @RequestMapping
    public ResponseEntity<List<SwaggerResource>> swaggerResources() {
        return new ResponseEntity<>(swaggerResourceProvider.get(), HttpStatus.OK);
    }
}
```

启动项目，访问网关+`/doc.html`，可以看到后台服务名，显示在了分组列表中，然后点击分组，就能显示对应后台的接口文档了，测试正常访问，集成成功。

## 方式2 Knife4jAggregation微服务聚合中间件

[官方文档](https://doc.xiaominfo.com/knife4j/documentation/knife4jAggregation.html)

自2.0.8版本开始，Knife4j提供的轻量级聚合中间件，也就是不推荐使用`Spring Cloud Gateway` 聚合了，可以采用`aggregation` ，统一集成。

具体集成步骤，官网已经写得很详细了，所以这里就不赘述了，其步骤大概为：

- 安装Knife4jAggregationDesktop
- 后台添加 knife4j-aggregation-spring-boot-starter依赖，配置
