# 04、SpringCloud Gateway 初始化加载流程源码解析
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/20.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 核心源码

### Route类

Route 是 gateway 中最基本的组件之一，表示一个具体的路由信息载体。路由信息由ID、目标URl、一组断言和一组过滤器组成。如果断言路由为真，则说明请求的URI和配置匹配。

```java
public class Route implements Ordered {
    private final String id;
    private final URI uri;
    private final int order;
    private final AsyncPredicate<ServerWebExchange> predicate;
    private final List<GatewayFilter> gatewayFilters;
    private final Map<String, Object> metadata;
}
```

Route的成员属性说明如下：

属性
作用

id
标识符，区别于其他 Route

uri
路由指向的目的地 uri，即客户端请求最终被转发的目的地

order
用于多个 Route 之间的排序，数值越小排序越靠前，匹配优先级越高

predicate
谓语，表示匹配该 Route 的前置条件，即满足相应的条件才会被路由到目的地 uri

gatewayFilters
过滤器用于处理切面逻辑，如路由转发前修改请求头等

metadata
元数据，用于描述路由

### AsyncPredicate接口

AsyncPredicate是Routed的一个成员属性，用于条件匹配。

其实现了 Java 8 提供的函数式接口Function ，Function 接口用来根据一个类型的数据得到另一个类型的数据，前者称为前置条件，后者称为后置条件。

```java
public interface AsyncPredicate<T> extends Function<T, Publisher<Boolean>> {
    default AsyncPredicate<T> and(AsyncPredicate<? super T> other) {
        return new AsyncPredicate.AndAsyncPredicate(this, other);
    }
    default AsyncPredicate<T> negate() {
        return new AsyncPredicate.NegateAsyncPredicate(this);
    }
    default AsyncPredicate<T> not(AsyncPredicate<? super T> other) {
        return new AsyncPredicate.NegateAsyncPredicate(other);
    }
    default AsyncPredicate<T> or(AsyncPredicate<? super T> other) {
        return new AsyncPredicate.OrAsyncPredicate(this, other);
    }
}
```

AsyncPredicate 定义了 3 种逻辑操作方法：

方法
说明

and
与操作，即两个 Predicate 组成一个，需要同时满足。

negate
取反操作，即对 Predicate 匹配结果取反。

or
或操作，即两个 Predicate 组成一个，只需满足其一。

### ServerWebExchange 接口

ServerWebExchange的注释： ServerWebExchange是一个HTTP请求-响应交互的契约。提供对HTTP请求和响应的访问，并公开额外的服务器端处理相关属性和特性，如请求属性。

其实，ServerWebExchange命名为服务网络交换器，存放着重要的请求-响应属性、请求实例和响应实例等等，有点像Context的角色。

```java
public interface ServerWebExchange {
    // 日志前缀属性的KEY，值为org.springframework.web.server.ServerWebExchange.LOG_ID
    // 可以理解为 attributes.set("org.springframework.web.server.ServerWebExchange.LOG_ID","日志前缀的具体值");
    // 作用是打印日志的时候会拼接这个KEY对饮的前缀值，默认值为""
    String LOG_ID_ATTRIBUTE = ServerWebExchange.class.getName() + ".LOG_ID";
    String getLogPrefix();
    // 获取ServerHttpRequest对象
    ServerHttpRequest getRequest();
    // 获取ServerHttpResponse对象
    ServerHttpResponse getResponse();
    // 返回当前exchange的请求属性，返回结果是一个可变的Map
    Map<String, Object> getAttributes();
    // 根据KEY获取请求属性
    @Nullable
    default <T> T getAttribute(String name) {
        return (T) getAttributes().get(name);
    }
    // 根据KEY获取请求属性，做了非空判断
    @SuppressWarnings("unchecked")
    default <T> T getRequiredAttribute(String name) {
        T value = getAttribute(name);
        Assert.notNull(value, () -> "Required attribute '" + name + "' is missing");
        return value;
    }
     // 根据KEY获取请求属性，需要提供默认值
    @SuppressWarnings("unchecked")
    default <T> T getAttributeOrDefault(String name, T defaultValue) {
        return (T) getAttributes().getOrDefault(name, defaultValue);
    } 
    // 返回当前请求的网络会话
    Mono<WebSession> getSession();
    // 返回当前请求的认证用户，如果存在的话
    <T extends Principal> Mono<T> getPrincipal();  
    // 返回请求的表单数据或者一个空的Map，只有Content-Type为application/x-www-form-urlencoded的时候这个方法才会返回一个非空的Map -- 这个一般是表单数据提交用到
    Mono<MultiValueMap<String, String>> getFormData();   
    // 返回multipart请求的part数据或者一个空的Map，只有Content-Type为multipart/form-data的时候这个方法才会返回一个非空的Map  -- 这个一般是文件上传用到
    Mono<MultiValueMap<String, Part>> getMultipartData();
    // 返回Spring的上下文
    @Nullable
    ApplicationContext getApplicationContext();   
    // 这几个方法和lastModified属性相关
    boolean isNotModified();
    boolean checkNotModified(Instant lastModified);
    boolean checkNotModified(String etag);
    boolean checkNotModified(@Nullable String etag, Instant lastModified);
    // URL转换
    String transformUrl(String url);    
    // URL转换映射
    void addUrlTransformer(Function<String, String> transformer); 
    // 注意这个方法，方法名是：改变，这个是修改ServerWebExchange属性的方法，返回的是一个Builder实例，Builder是ServerWebExchange的内部类
    default Builder mutate() {
         return new DefaultServerWebExchangeBuilder(this);
    }
    interface Builder {
        // 覆盖ServerHttpRequest
        Builder request(Consumer<ServerHttpRequest.Builder> requestBuilderConsumer);
        Builder request(ServerHttpRequest request);
        // 覆盖ServerHttpResponse
        Builder response(ServerHttpResponse response);
        // 覆盖当前请求的认证用户
        Builder principal(Mono<Principal> principalMono);
        // 构建新的ServerWebExchange实例
        ServerWebExchange build();
    }
}
```

### GatewayFilter

GatewayFilter为网关过滤器，很多框架都有 Filter 的设计，用于实现可扩展的切面逻辑。

GatewayFilter 源代码：

```java
public interface GatewayFilter extends ShortcutConfigurable {
    String NAME_KEY = "name";
    String VALUE_KEY = "value";
    /**
     * Process the Web request and (optionally) delegate to the next
     * {@code WebFilter} through the given {@link GatewayFilterChain}.
     * @param exchange the current server exchange
     * @param chain provides a way to delegate to the next filter
     * @return {@code Mono<Void>} to indicate when request processing is complete
     */
    Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain);
}
```

Filter 最终是通过 filter chain 来形成链式调用的，每个 filter 处理完 pre filter 逻辑后委派给 filter chain，filter chain 再委派给下一下 filter。

GatewayFilterChain 源代码：

```java
public interface GatewayFilterChain {
    /**
     * Delegate to the next {@code WebFilter} in the chain.
     * @param exchange the current server exchange
     * @return {@code Mono<Void>} to indicate when request handling is complete
     */
    Mono<Void> filter(ServerWebExchange exchange);
}
```

### RouteLocator

RouteLocator是一个路由定位器，用来获取路由对象

```java
public interface RouteLocator {
    Flux<Route> getRoutes();
}
```

RouteLocator有三个实现类：

- RouteDefinitionRouteLocator 基于路由定义的定位器
- CachingRouteLocator 基于缓存的路由定位器
- CompositeRouteLocator 基于组合方式的路由定位器

### RouteDefinitionLocator接口

`RouteDefinitionLocator` 是路由定义定位器的顶级接口，它的主要作用就是读取路由的配置信息（org.springframework.cloud.gateway.route.RouteDefinition）。它有五种不同的实现类，如图

`org.springframework.cloud.gateway.route.RouteDefinitionLocator`，路由定义定位器接口，只有一个方法，用来获取路由定义列表的方法。

```java
public interface RouteDefinitionLocator {
	Flux<RouteDefinition> getRouteDefinitions();
}
```

通过RouteDefinitionLocator 的类图，可以看出该接口有多个实现类：

- PropertiesRouteDefinitionLocator：基于属性配置
- DiscoveryClientRouteDefinitionLocator：基于服务发现
- CompositeRouteDefinitionLocator：组合方式
- CachingRouteDefinitionLocator：缓存方式
- 其中还有一个接口 RouteDefinitionRepository 继承自RouteDefinitionLocator，用于对路由定义的操作（保存、删除路由定义）,其只有一个默认的实现类InMemoryRouteDefinitionRepository

### RouteDefinition 类

顾名思义，该组件用来对 Route 信息进行定义，最终会被 RouteLocator 解析成 Route，其属性和Route类的差不多。

```java
@Validated
public class RouteDefinition {
    private String id;
    @NotEmpty
    @Valid
    private List<PredicateDefinition> predicates = new ArrayList();
    @Valid
    private List<FilterDefinition> filters = new ArrayList();
    @NotNull
    private URI uri;
    private Map<String, Object> metadata = new HashMap();
    private int order = 0;
}
```

## 初始化加载流程

### 1. 路由构建方式

Spring 提供了两种方式：外部化配置和编程的方式。

外部化配置：

```java
spring:
  cloud:
    gateway:
      enabled: true
      routes:
        - id: app-service001 路由唯一ID
          uri: http://localhost:9000    目标URI,
          predicates:   断言，为真则匹配成功
            - Path=/app1/** 配置规则Path，如果是app1开头的请求，则会将该请求转发到目标URL
          filters:
            - AddRequestHeader=X-Request-Foo, Bar  定义了一个 Filter，所有的请求转发至下游服务时会添加请求头 X-Request-Foo:Bar ，由AddRequestHeaderGatewayFilterFactory 来生产。
```

编程方式：

```java
   @Bean
    public RouteLocator customerRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route(r -> r.path("/app1/**")
                        .filters(f -> f.filter(new RequestLogGatewayFilter()))
                        .uri("http://localhost:9000")
                )
                .build();
    }
```

### 2. 加载配置

基于Spring Boot的自动装配功能，Gateway 模块自动装配类为 `GatewayAutoConfiguration`，对应的配置类为 GatewayProperties。

可以看到，`GatewayAutoConfiguration`中注入了很多个需要使用的Bean对象。

在yml中配置路由后，在加载的时候会被解析为RouteDefinition对象集合，每个RouteDefinition包含了Id、uri、 predicates、filters等。

### 3. 加载PropertiesRouteDefinitionLocator

`PropertiesRouteDefinitionLocator`是RouteDefinitionLocator，主要用来获取RouteDefinition（路由定义信息），

可以看到直接使用GatewayProperties创建，

```java
    @Bean
    @ConditionalOnMissingBean
    public PropertiesRouteDefinitionLocator propertiesRouteDefinitionLocator(GatewayProperties properties) {
        return new PropertiesRouteDefinitionLocator(properties);
    }
```

我们的路由信息是保存在`PropertiesRouteDefinitionLocator` Bean对象中。

### 4. 加载RouteDefinitionRouteLocator

`RouteDefinitionRouteLocator`也会在 `GatewayAutoConfiguration`类中被加载，注意不要和上面的`RouteDefinitionLocator`搞混了，名字很像：

- RouteDefinitionLocator ：通过配置、JAVA代码、服务发现，加载路由为RouteDefinition。
- RouteDefinitionRouteLocator：用于将 RouteDefinition 转换成 Route。

```java
    @Bean
    public RouteLocator routeDefinitionRouteLocator(GatewayProperties properties, List<GatewayFilterFactory> gatewayFilters, List<RoutePredicateFactory> predicates, RouteDefinitionLocator routeDefinitionLocator, ConfigurationService configurationService) {
        return new RouteDefinitionRouteLocator(routeDefinitionLocator, predicates, gatewayFilters, properties, configurationService);
    }
```

可以看到，使用RouteDefinitionRouteLocator构造函数，传入了GatewayProperties 、GatewayFilterFactory、RoutePredicateFactory、RouteDefinitionLocator 、ConfigurationService 。可以网关过滤器有28个，断言工厂有13个。

其构造函数会初始化相关属性，

```java
public RouteDefinitionRouteLocator(RouteDefinitionLocator routeDefinitionLocator, List<RoutePredicateFactory> predicates, List<GatewayFilterFactory> gatewayFilterFactories, GatewayProperties gatewayProperties, ConfigurationService configurationService) {
    // 设置 RouteDefinitionLocator
    this.routeDefinitionLocator = routeDefinitionLocator;
    // 设置ConfigurationService
    this.configurationService = configurationService;
    // 初始化predicates，将所有的RoutePredicateFactory放入一个Map中，并会打印"Loaded RoutePredicateFactory + 前缀 日志
    this.initFactories(predicates);
    // 初始化GatewayFilter，将所有的GatewayFilter放入一个Map中
    gatewayFilterFactories.forEach((factory) -> {
        GatewayFilterFactory var10000 = (GatewayFilterFactory)this.gatewayFilterFactories.put(factory.name(), factory);
    });
    // 设置 GatewayProperties
    this.gatewayProperties = gatewayProperties;
}
```

最终Route定位器完成了初始化，并注入到了Spring IOC中。其中维护了路由信息、过滤器、断言工厂等信息。

### 5. 加载HandlerMapping、WebHandler

在之前的[文档](https://blog.csdn.net/qq_43437874/article/details/121610943)中，我们分析过网关的执行流程，

客户端向Spring Cloud Gateway发出请求。再由网关处理程序Gateway Handler Mapping 映射确定与请求相匹配的路由，将其发送到网关Web处理程序Gateway Web Handler。该处理程序通过指定的过滤嚣也将请求发送到我们实际的服务执行业务逻辑，然后返回。

所以，Gateway初始化时，还会加载HandlerMapping及WebHandler，这里涉及到Web flux的相关知识，后续再详细介绍。

```java
    @Bean
    public FilteringWebHandler filteringWebHandler(List<GlobalFilter> globalFilters) {
        return new FilteringWebHandler(globalFilters);
    }
    @Bean
    public RoutePredicateHandlerMapping routePredicateHandlerMapping(FilteringWebHandler webHandler, RouteLocator routeLocator, GlobalCorsProperties globalCorsProperties, Environment environment) {
        return new RoutePredicateHandlerMapping(webHandler, routeLocator, globalCorsProperties, environment);
    }
```

### 5. 启动服务

在所有的组件完成初始化后，服务就启动完成了，Web 程序监听端口，会接受到外部请求，然后通过核心控制器、处理映射器、web处理器、过滤器，然后到达目标地址，再一路返回，整个流程就结束了。
