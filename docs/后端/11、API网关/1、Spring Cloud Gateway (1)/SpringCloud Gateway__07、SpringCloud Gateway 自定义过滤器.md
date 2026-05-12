# 07、SpringCloud Gateway 自定义过滤器
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/23.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 自定义网关过滤器

需求：编写一个网关过滤器，实现打印请求URI。

### 方式1 继承AbstractGatewayFilterFactory

#### 1. 继承抽象类

仿照默认的网关过滤器，实现一个简单打印请求路径和过滤器配置参数的功能。

```java
@Slf4j
@Component
public class RequestLogGatewayFilterFactory extends AbstractGatewayFilterFactory<AbstractGatewayFilterFactory.NameConfig> {
    public RequestLogGatewayFilterFactory() {
        super(NameConfig.class);
    }
    @Override
    public List<String> shortcutFieldOrder() {
        return Arrays.asList("name");
    }
    @Override
    public GatewayFilter apply(NameConfig config) {
        return new GatewayFilter() {
            @Override
            public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
                // 获取请求路径
                URI uri = exchange.getRequest().getURI();
                log.info("获取到请求路径：{}", uri.toString());
                //
                log.info("配置属性：{}", config.getName());
                return chain.filter(exchange);
            }
            @Override
            public String toString() {
                return GatewayToStringStyler.filterToStringCreator(RequestLogGatewayFilterFactory.this).toString();
            }
        };
    }
}
```

#### 2. 添加配置

YML中添加当前过滤器

```bash
spring:
  cloud:
    gateway:
      enabled: true
      routes:
      - id: app-service001 路由唯一ID
        uri: http://localhost:9000    目标URI,
        predicates:   断言，为真则匹配成功
        匹配亚洲上海时间 2021-11-29：17:42:47 以后的请求
        - After=2021-11-29T17:42:47.000+08:00[Asia/Shanghai]
        - Path=/app1/** 配置规则Path，如果是app1开头的请求，则会将该请求转发到目标URL
        filters:
          - RequestLog=config
```

#### 3. 测试

访问一下路径：

```bash
http://localhost/app1/test
```

发现进入到过滤器断点，可以看到ServerWebExchange，封装了请求响应等Web信息。

GatewayFilterChain过滤器链，封装了很多过滤器。

放行后打印了过滤器中的日志信息，配置成功

### 方式2 实现GatewayFilter 接口

可以直接实现GatewayFilter 接口，编写过滤器逻辑处理。

```java
@Slf4j
public class RequestLogGatewayFilter implements GatewayFilter, Ordered {
    /**
     * @param exchange 网络交换机
     * @param chain    过滤器链
     * @return
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 获取请求路径
        URI uri = exchange.getRequest().getURI();
        log.info("获取到请求路径：{}", uri.toString());
        return chain.filter(exchange);
    }
    /**
     * 设置过滤器执行顺序，数值越低，优先级越搞
     *
     * @return
     */
    @Override
    public int getOrder() {
        return 0;
    }
}
```

但是这种方式需要用JAVA代码编写路由信息添加过滤器，所以不是很推荐使用：

```java
@Configuration
public class GatewayConfig {
    @Bean
    public RouteLocator customerRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route(r -> r.path("/app1/**")
                        .filters(f -> f.filter(new RequestLogGatewayFilter()))
                        .uri("http://localhost:9000")
                )
                .build();
    }
}
```

## 自定义全局过滤器

自定义全局过滤器需要实现以下两个接口:`GlobalFilter`,`ordered`。通过全局过滤器可以实现权限校验，安全性验证等功能。

### 案例演示之鉴权

**需求**：对所有请求进行鉴权，校验消息头是否携带了 Spring Security Oauth2 访问令牌，没有则直接拦截，还需要对登录等接口进行放行处理。

#### 1. 编写过滤器

全局过滤器只需要实现 GlobalFilter, Ordered接口就可以了，完整代码如下所示，

```java
@Component
@Slf4j
public class AuthGlobalFilter implements GlobalFilter, Ordered {
    @Autowired
    ObjectMapper objectMapper;
    // 放行路径，可以编写配置类，配置在YML中
    private static final String[] SKIP_PATH = {
     "/app1/login", "/app1/skip/**"};
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 1. 判断是否放行路径
        String requestPath = exchange.getRequest().getPath().pathWithinApplication().value();
        boolean match = Arrays.stream(SKIP_PATH).map(path -> path.replaceAll("/\\*\\*", "")).anyMatch(path -> path.startsWith(requestPath));
        if (match) {
            return chain.filter(exchange);
        }
        // 2. 判断是否包含Oauth2 令牌
        String authorizationHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (StringUtils.isEmpty(authorizationHeader) ) {
            // 如果消息头中没有 Authorization ，并且不是 Bearer开头，则抛出异常
            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            response.getHeaders().add("Content-Type", "application/json;charset=UTF-8");
            String result = "";
            try {
                Map<String, Object> map = new HashMap<>(16);
                map.put("code", HttpStatus.UNAUTHORIZED.value());
                map.put("msg", "当前请求未认证，不允许访问");
                map.put("data", null);
                result = objectMapper.writeValueAsString(map);
            } catch (JsonProcessingException e) {
                log.error(e.getMessage(), e);
            }
            DataBuffer buffer = response.bufferFactory().wrap(result.getBytes(StandardCharsets.UTF_8));
            return response.writeWith(Flux.just(buffer));
        }
        return chain.filter(exchange);
    }
    @Override
    public int getOrder() {
        return -1;
    }
}
```

#### 2. 测试

访问/app1/test ，发现返回了我们定义的异常信息。

访问/app1/login 则没问题，是因为配置了放行路径。

### 案例演示之防范XSS 攻击

**需求**：对所有请求进行鉴权，校验Get请求参数是否携带了恶意脚本，发现时，拒绝访问。

添加一个全局过滤器，获取Get请求参数，然后正则匹配是否包含恶意脚本。

```java
@Slf4j
@Component
public class XssGlobalFilter implements GlobalFilter, Ordered {
    @Autowired
    ObjectMapper objectMapper;
    private final static Pattern[] scriptPatterns = {
            Pattern.compile("<script>(.*?)</script>", Pattern.CASE_INSENSITIVE),
            Pattern.compile("src[\r\n]*=[\r\n]*\\\'(.*?)\\\'", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
            Pattern.compile("</script>", Pattern.CASE_INSENSITIVE),
            Pattern.compile("<script(.*?)>", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
            Pattern.compile("eval\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
            Pattern.compile("expression\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
            Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE),
            Pattern.compile("vbscript:", Pattern.CASE_INSENSITIVE),
            Pattern.compile("onload(.*?)=", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL)
    };
    @SneakyThrows
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest serverHttpRequest = exchange.getRequest();
        HttpMethod method = serverHttpRequest.getMethod();
        URI uri = exchange.getRequest().getURI();
        if (method == HttpMethod.GET) {
            String paramsString = uri.getRawQuery().replaceAll("[\u0000\n\r]", "");
            if (StringUtils.isBlank(paramsString)) {
                return chain.filter(exchange);
            }
            String lowerValue = URLDecoder.decode(paramsString, "UTF-8").toLowerCase();
            for (Pattern pattern : scriptPatterns) {
                if (pattern.matcher(lowerValue).find()) {
                    return xssResponse(exchange);
                }
            }
        }
        return chain.filter(exchange);
    }
    @Override
    public int getOrder() {
        return 0;
    }
    public Mono<Void> xssResponse(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.BAD_REQUEST);
        response.getHeaders().add("Content-Type", "application/json;charset=UTF-8");
        String result = "";
        try {
            Map<String, Object> map = new HashMap<>(16);
            map.put("code", HttpStatus.BAD_REQUEST.value());
            map.put("msg", "当前请求可能存在恶意脚本，拒绝访问");
            result = objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            log.error(e.getMessage(), e);
        }
        DataBuffer buffer = response.bufferFactory().wrap(result.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Flux.just(buffer));
    }
}
```

测试，携带一个脚本参数去访问，被拒绝。
