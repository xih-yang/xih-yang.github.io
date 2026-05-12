# 06、Spring Boot 4 实战：声明式 HTTP 客户端 @HttpExchange 从入门到精通
- 来源：https://ddkk.com/springboot/4/6.html
- 分类：Spring Boot 4.0 实战教程
- 分组：教程目录
- 日期：2025-11-25
兄弟们，鹏磊今天来聊聊声明式 HTTP 客户端 @HttpExchange 这玩意儿；这是 Spring Framework 7.0 引入的新功能，用起来比 RestTemplate 和 WebClient 简单多了。今天咱从最基础的开始，一步步讲到高级用法，让你彻底掌握这玩意儿。这功能确实实用，代码量能减少一大半，值得好好研究。

## 一、入门篇：什么是声明式 HTTP 客户端？

### 1. 为什么需要声明式 HTTP 客户端？

传统的 HTTP 客户端（RestTemplate、WebClient）用起来比较繁琐，每次调用都要写一堆代码；声明式 HTTP 客户端只需要定义一个接口，Spring 会自动生成代理实现，代码量能减少 60% 以上。

```java
// 传统方式：使用 RestTemplate，代码繁琐
@Service
public class TraditionalUserService {
    @Autowired
    private RestTemplate restTemplate;
    public User getUser(Long id) {
        // 每次调用都要写 URL、处理响应、处理异常，代码重复
        String url = "http://api.example.com/users/" + id;
        try {
            ResponseEntity<User> response = restTemplate.getForEntity(url, User.class);
            return response.getBody();
        } catch (RestClientException e) {
            // 异常处理
            throw new RuntimeException("获取用户失败", e);
        }
    }
    public User createUser(User user) {
        String url = "http://api.example.com/users";
        try {
            ResponseEntity<User> response = restTemplate.postForEntity(url, user, User.class);
            return response.getBody();
        } catch (RestClientException e) {
            throw new RuntimeException("创建用户失败", e);
        }
    }
}
// 声明式方式：使用 @HttpExchange，代码简洁
@HttpExchange(url = "http://api.example.com")  // 定义基础 URL
public interface UserClient {
    @GetExchange("/users/{id}")  // GET 请求
    User getUser(@PathVariable Long id);  // 方法签名就是接口定义，不用写实现
    @PostExchange("/users")  // POST 请求
    User createUser(@RequestBody User user);  // 自动序列化和反序列化
}
@Service
public class DeclarativeUserService {
    @Autowired
    private UserClient userClient;  // 注入客户端，Spring 自动生成代理
    public User getUser(Long id) {
        // 直接调用，代码简洁多了
        return userClient.getUser(id);
    }
    public User createUser(User user) {
        // 直接调用，不用写 HTTP 请求代码
        return userClient.createUser(user);
    }
}
```

### 2. 第一个声明式 HTTP 客户端

让我们从最简单的例子开始：

```java
// 第一步：定义 HTTP 客户端接口
@HttpExchange(url = "http://api.example.com")  // 基础 URL，所有方法都基于这个路径
public interface SimpleUserClient {
    // GET 请求：获取用户信息
    @GetExchange("/users/{id}")  // 路径是 /users/{id}，{id} 是路径变量
    User getUser(@PathVariable Long id);  // @PathVariable 绑定路径变量
}
// 第二步：配置 HTTP 客户端
@Configuration
public class HttpClientConfig {
    // 创建 RestClient（推荐，Spring Framework 6.1+ 引入）
    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .baseUrl("http://api.example.com")  // 设置基础 URL
                .build();
    }
    // 创建 RestClient 适配器
    @Bean
    public RestClientAdapter restClientAdapter(RestClient restClient) {
        // RestClientAdapter 将 RestClient 适配到声明式 HTTP 客户端
        return RestClientAdapter.create(restClient);
    }
    // 创建 HTTP 服务代理工厂
    @Bean
    public HttpServiceProxyFactory httpServiceProxyFactory(RestClientAdapter adapter) {
        // HttpServiceProxyFactory 根据接口定义自动生成代理实现
        return HttpServiceProxyFactory.builderFor(adapter).build();
    }
    // 创建 UserClient 代理 Bean
    @Bean
    public SimpleUserClient simpleUserClient(HttpServiceProxyFactory factory) {
        // 使用工厂创建代理，Spring 会自动实现接口方法
        return factory.createClient(SimpleUserClient.class);
    }
}
// 第三步：使用客户端
@Service
public class UserService {
    @Autowired
    private SimpleUserClient userClient;  // 注入客户端
    public User getUser(Long id) {
        // 直接调用，就像调用普通方法一样
        return userClient.getUser(id);
    }
}
```

### 3. 支持的 HTTP 方法

声明式 HTTP 客户端支持所有常见的 HTTP 方法：

```java
@HttpExchange(url = "http://api.example.com")
public interface HttpMethodsClient {
    // GET 请求：获取资源
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);
    // POST 请求：创建资源
    @PostExchange("/users")
    User createUser(@RequestBody User user);
    // PUT 请求：更新资源（完整更新）
    @PutExchange("/users/{id}")
    User updateUser(@PathVariable Long id, @RequestBody User user);
    // PATCH 请求：部分更新资源
    @PatchExchange("/users/{id}")
    User patchUser(@PathVariable Long id, @RequestBody Map<String, Object> updates);
    // DELETE 请求：删除资源
    @DeleteExchange("/users/{id}")
    void deleteUser(@PathVariable Long id);
}
```

## 二、进阶篇：参数处理和配置

### 1. 路径变量（@PathVariable）

路径变量用于在 URL 中传递参数：

```java
@HttpExchange(url = "http://api.example.com")
public interface PathVariableClient {
    // 单个路径变量
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);
    // 多个路径变量
    @GetExchange("/users/{userId}/posts/{postId}")
    Post getUserPost(
        @PathVariable("userId") Long userId,  // 可以指定变量名
        @PathVariable("postId") Long postId
    );
    // 路径变量和查询参数组合
    @GetExchange("/users/{id}/orders")
    List<Order> getUserOrders(
        @PathVariable Long id,
        @RequestParam("status") String status  // 查询参数
    );
}
```

### 2. 查询参数（@RequestParam）

查询参数用于在 URL 后面添加参数：

```java
@HttpExchange(url = "http://api.example.com")
public interface RequestParamClient {
    // 单个查询参数
    @GetExchange("/users")
    List<User> getUsers(@RequestParam("page") int page);
    // 多个查询参数
    @GetExchange("/users")
    List<User> getUsers(
        @RequestParam("page") int page,
        @RequestParam("size") int size,
        @RequestParam("sort") String sort
    );
    // 可选查询参数
    @GetExchange("/users")
    List<User> getUsers(
        @RequestParam("page") int page,
        @RequestParam(value = "size", required = false) Integer size,  // 可选参数
        @RequestParam(value = "sort", required = false, defaultValue = "id") String sort  // 默认值
    );
    // Map 作为查询参数（会展开为多个参数）
    @GetExchange("/search")
    List<User> searchUsers(@RequestParam Map<String, String> params);
}
```

### 3. 请求头（@RequestHeader）

请求头用于传递额外的信息：

```java
@HttpExchange(url = "http://api.example.com")
public interface RequestHeaderClient {
    // 单个请求头
    @GetExchange("/users/{id}")
    User getUser(
        @PathVariable Long id,
        @RequestHeader("Authorization") String token  // 认证 token
    );
    // 多个请求头
    @GetExchange("/users/{id}")
    User getUser(
        @PathVariable Long id,
        @RequestHeader("Authorization") String token,
        @RequestHeader("X-Request-ID") String requestId
    );
    // Map 作为请求头（会展开为多个请求头）
    @GetExchange("/users/{id}")
    User getUser(
        @PathVariable Long id,
        @RequestHeader Map<String, String> headers
    );
}
```

### 4. 请求体（@RequestBody）

请求体用于传递复杂对象：

```java
@HttpExchange(url = "http://api.example.com")
public interface RequestBodyClient {
    // POST 请求，传递对象
    @PostExchange("/users")
    User createUser(@RequestBody User user);  // 自动序列化为 JSON
    // PUT 请求，传递对象
    @PutExchange("/users/{id}")
    User updateUser(@PathVariable Long id, @RequestBody User user);
    // PATCH 请求，传递 Map（部分更新）
    @PatchExchange("/users/{id}")
    User patchUser(@PathVariable Long id, @RequestBody Map<String, Object> updates);
    // 传递多个对象（使用 @RequestPart 或自定义）
    @PostExchange("/users/{id}/avatar")
    void uploadAvatar(
        @PathVariable Long id,
        @RequestPart("file") MultipartFile file,
        @RequestPart("metadata") Map<String, String> metadata
    );
}
```

### 5. 响应处理

可以返回不同类型的响应：

```java
@HttpExchange(url = "http://api.example.com")
public interface ResponseClient {
    // 返回对象（自动反序列化）
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);
    // 返回 ResponseEntity（包含状态码、响应头等）
    @GetExchange("/users/{id}")
    ResponseEntity<User> getUserWithResponse(@PathVariable Long id);
    // 返回 Void（不关心响应体）
    @DeleteExchange("/users/{id}")
    void deleteUser(@PathVariable Long id);
    // 返回 String（原始响应）
    @GetExchange("/users/{id}")
    String getUserAsString(@PathVariable Long id);
    // 返回 List（数组响应）
    @GetExchange("/users")
    List<User> getUsers();
}
```

## 三、进阶篇：高级配置

### 1. 类型级别的配置

可以在接口级别配置公共属性：

```java
// 类型级别的配置，所有方法都继承这些配置
@HttpExchange(
    url = "http://api.example.com",  // 基础 URL
    accept = "application/json",  // 默认 Accept 头
    contentType = "application/json"  // 默认 Content-Type 头
)
public interface TypeLevelConfigClient {
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);
    // 方法级别的配置会覆盖类型级别的配置
    @PostExchange(contentType = "application/xml")  // 覆盖类型级别的 contentType
    User createUser(@RequestBody User user);
}
```

### 2. 方法级别的配置

可以在方法级别配置特定属性：

```java
@HttpExchange(url = "http://api.example.com")
public interface MethodLevelConfigClient {
    // 配置请求方法和路径
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);
    // 配置内容类型
    @PostExchange(contentType = "application/json")
    User createUser(@RequestBody User user);
    // 配置接受类型
    @GetExchange(value = "/users/{id}", accept = "application/json")
    User getUser(@PathVariable Long id);
    // 配置多个属性
    @PostExchange(
        value = "/users",
        contentType = "application/json",
        accept = "application/json"
    )
    User createUser(@RequestBody User user);
}
```

### 3. 使用 RestClient 配置

RestClient 是 Spring Framework 6.1+ 引入的新客户端，推荐使用：

```java
@Configuration
public class RestClientConfig {
    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .baseUrl("http://api.example.com")  // 基础 URL
                .defaultHeader("User-Agent", "MyApp/1.0")  // 默认请求头
                .defaultHeader("Accept", "application/json")  // 默认 Accept
                .requestInterceptor((request, body, execution) -> {
                    // 请求拦截器，可以在发送请求前修改请求
                    System.out.println("发送请求: " + request.getURI());
                    return execution.execute(request, body);
                })
                .requestInterceptor((request, body, execution) -> {
                    // 可以添加多个拦截器
                    long start = System.currentTimeMillis();
                    ClientHttpResponse response = execution.execute(request, body);
                    long duration = System.currentTimeMillis() - start;
                    System.out.println("请求耗时: " + duration + "ms");
                    return response;
                })
                .build();
    }
    @Bean
    public RestClientAdapter restClientAdapter(RestClient restClient) {
        return RestClientAdapter.create(restClient);
    }
    @Bean
    public HttpServiceProxyFactory httpServiceProxyFactory(RestClientAdapter adapter) {
        return HttpServiceProxyFactory.builderFor(adapter).build();
    }
}
```

### 4. 使用 WebClient 配置（响应式）

如果你用的是响应式编程，可以用 WebClient：

```java
@Configuration
public class WebClientConfig {
    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .baseUrl("http://api.example.com")  // 基础 URL
                .defaultHeader("User-Agent", "MyApp/1.0")  // 默认请求头
                .defaultHeader("Accept", "application/json")  // 默认 Accept
                .filter((request, next) -> {
                    // 响应式过滤器
                    return next.exchange(request)
                        .doOnNext(response -> {
                            System.out.println("响应状态: " + response.statusCode());
                        });
                })
                .build();
    }
    @Bean
    public WebClientAdapter webClientAdapter(WebClient webClient) {
        return WebClientAdapter.create(webClient);
    }
    @Bean
    public HttpServiceProxyFactory httpServiceProxyFactory(WebClientAdapter adapter) {
        return HttpServiceProxyFactory.builderFor(adapter).build();
    }
}
// 响应式客户端接口
@HttpExchange(url = "http://api.example.com")
public interface ReactiveUserClient {
    // 返回 Mono（单个结果）
    @GetExchange("/users/{id}")
    Mono<User> getUser(@PathVariable Long id);
    // 返回 Flux（多个结果）
    @GetExchange("/users")
    Flux<User> getUsers();
    // 接收 Mono 参数
    @PostExchange("/users")
    Mono<User> createUser(@RequestBody Mono<User> userMono);
}
```

### 5. 使用 RestTemplate 配置（兼容旧代码）

如果你还在用 RestTemplate，也可以配置：

```java
@Configuration
public class RestTemplateConfig {
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        // 配置消息转换器
        List<HttpMessageConverter<?>> converters = new ArrayList<>();
        converters.add(new MappingJackson2HttpMessageConverter());
        restTemplate.setMessageConverters(converters);
        // 配置请求拦截器
        restTemplate.setInterceptors(Collections.singletonList(
            (request, body, execution) -> {
                System.out.println("发送请求: " + request.getURI());
                return execution.execute(request, body);
            }
        ));
        return restTemplate;
    }
    @Bean
    public RestTemplateAdapter restTemplateAdapter(RestTemplate restTemplate) {
        return RestTemplateAdapter.create(restTemplate);
    }
    @Bean
    public HttpServiceProxyFactory httpServiceProxyFactory(RestTemplateAdapter adapter) {
        return HttpServiceProxyFactory.builderFor(adapter).build();
    }
}
```

## 四、精通篇：高级用法

### 1. 错误处理

声明式 HTTP 客户端支持多种错误处理方式：

```java
@HttpExchange(url = "http://api.example.com")
public interface ErrorHandlingClient {
    // 方式1：抛出异常（默认行为）
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);  // 如果状态码不是 2xx，会抛出异常
    // 方式2：返回 ResponseEntity，手动处理
    @GetExchange("/users/{id}")
    ResponseEntity<User> getUserWithResponse(@PathVariable Long id);
    // 方式3：使用自定义错误处理器
    @GetExchange("/users/{id}")
    User getUserWithErrorHandler(@PathVariable Long id);
}
// 配置错误处理器
@Configuration
public class ErrorHandlerConfig {
    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .baseUrl("http://api.example.com")
                .defaultStatusHandler(
                    HttpStatusCode::is4xxClientError,  // 4xx 错误
                    (request, response) -> {
                        // 自定义错误处理
                        throw new UserNotFoundException("用户不存在");
                    }
                )
                .defaultStatusHandler(
                    HttpStatusCode::is5xxServerError,  // 5xx 错误
                    (request, response) -> {
                        throw new ServerException("服务器错误");
                    }
                )
                .build();
    }
}
// 使用示例
@Service
public class UserService {
    @Autowired
    private ErrorHandlingClient userClient;
    public User getUser(Long id) {
        try {
            return userClient.getUser(id);
        } catch (UserNotFoundException e) {
            // 处理用户不存在的情况
            return null;
        } catch (ServerException e) {
            // 处理服务器错误
            throw new RuntimeException("服务暂时不可用", e);
        }
    }
}
```

### 2. 请求和响应拦截器

可以添加拦截器来记录日志、添加请求头等：

```java
@Configuration
public class InterceptorConfig {
    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .baseUrl("http://api.example.com")
                .requestInterceptor((request, body, execution) -> {
                    // 请求拦截器：在发送请求前执行
                    HttpHeaders headers = request.getHeaders();
                    headers.add("X-Request-ID", UUID.randomUUID().toString());  // 添加请求 ID
                    headers.add("X-Timestamp", String.valueOf(System.currentTimeMillis()));  // 添加时间戳
                    // 记录请求日志
                    System.out.println("请求方法: " + request.getMethod());
                    System.out.println("请求 URL: " + request.getURI());
                    System.out.println("请求头: " + headers);
                    return execution.execute(request, body);
                })
                .requestInterceptor((request, body, execution) -> {
                    // 响应拦截器：在收到响应后执行
                    long start = System.currentTimeMillis();
                    ClientHttpResponse response = execution.execute(request, body);
                    long duration = System.currentTimeMillis() - start;
                    // 记录响应日志
                    System.out.println("响应状态: " + response.getStatusCode());
                    System.out.println("响应耗时: " + duration + "ms");
                    return response;
                })
                .build();
    }
}
```

### 3. 认证处理

可以配置各种认证方式：

```java
@Configuration
public class AuthenticationConfig {
    // 方式1：Basic 认证
    @Bean
    public RestClient basicAuthRestClient() {
        return RestClient.builder()
                .baseUrl("http://api.example.com")
                .requestInterceptor((request, body, execution) -> {
                    // 添加 Basic 认证头
                    String auth = "username:password";
                    String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
                    request.getHeaders().set("Authorization", "Basic " + encodedAuth);
                    return execution.execute(request, body);
                })
                .build();
    }
    // 方式2：Bearer Token 认证
    @Bean
    public RestClient bearerTokenRestClient(@Value("${api.token}") String token) {
        return RestClient.builder()
                .baseUrl("http://api.example.com")
                .defaultHeader("Authorization", "Bearer " + token)  // 默认添加 Bearer Token
                .build();
    }
    // 方式3：OAuth2 认证（需要 Spring Security）
    @Bean
    public RestClient oauth2RestClient(OAuth2AuthorizedClientService clientService) {
        return RestClient.builder()
                .baseUrl("http://api.example.com")
                .requestInterceptor((request, body, execution) -> {
                    // 从 OAuth2 服务获取 token
                    OAuth2AuthorizedClient client = clientService.loadAuthorizedClient(
                        "my-client", "user-name"
                    );
                    if (client != null) {
                        String token = client.getAccessToken().getTokenValue();
                        request.getHeaders().set("Authorization", "Bearer " + token);
                    }
                    return execution.execute(request, body);
                })
                .build();
    }
}
// 使用认证客户端
@HttpExchange(url = "http://api.example.com")
public interface AuthenticatedClient {
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);  // 会自动添加认证头
}
```

### 4. 重试机制

可以配置重试机制来处理临时失败：

```java
@Configuration
public class RetryConfig {
    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .baseUrl("http://api.example.com")
                .requestInterceptor((request, body, execution) -> {
                    // 实现重试逻辑
                    int maxRetries = 3;
                    int retryCount = 0;
                    while (retryCount < maxRetries) {
                        try {
                            ClientHttpResponse response = execution.execute(request, body);
                            // 如果是 5xx 错误，重试
                            if (response.getStatusCode().is5xxServerError()) {
                                retryCount++;
                                if (retryCount < maxRetries) {
                                    Thread.sleep(1000 * retryCount);  // 指数退避
                                    continue;
                                }
                            }
                            return response;
                        } catch (IOException e) {
                            retryCount++;
                            if (retryCount < maxRetries) {
                                try {
                                    Thread.sleep(1000 * retryCount);
                                } catch (InterruptedException ie) {
                                    Thread.currentThread().interrupt();
                                    throw new RuntimeException(ie);
                                }
                            } else {
                                throw new RuntimeException("请求失败，已重试 " + maxRetries + " 次", e);
                            }
                        }
                    }
                    throw new RuntimeException("请求失败");
                })
                .build();
    }
}
```

### 5. 超时配置

可以配置连接超时和读取超时：

```java
@Configuration
public class TimeoutConfig {
    @Bean
    public RestClient restClient() {
        // 使用 HttpClient（需要添加依赖）
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)  // 连接超时 5 秒
                .responseTimeout(Duration.ofSeconds(10));  // 响应超时 10 秒
        ClientHttpConnector connector = new ReactorClientHttpConnector(httpClient);
        return RestClient.builder()
                .baseUrl("http://api.example.com")
                .clientConnector(connector)
                .build();
    }
}
```

### 6. 分组管理 HTTP 服务

Spring Framework 7.0 支持分组管理 HTTP 服务，方便管理多个服务：

```java
// 定义多个 HTTP 服务接口
@HttpExchange(url = "http://weather-api.example.com")
public interface WeatherService {
    @GetExchange("/weather/{city}")
    Weather getWeather(@PathVariable String city);
}
@HttpExchange(url = "http://user-api.example.com")
public interface UserService {
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);
}
// 分组配置
@Configuration
@ImportHttpServices(group = "weather", types = {WeatherService.class})  // 天气服务组
@ImportHttpServices(group = "user", types = {UserService.class})  // 用户服务组
public class HttpServicesGroupConfig extends AbstractHttpServiceRegistrar {
    @Bean
    public RestClientHttpServiceGroupConfigurer groupConfigurer() {
        return groups -> groups
                .filterByName("weather", "user")  // 过滤出这两个组
                .configureClient((group, builder) -> {
                    // 为每个组配置客户端
                    if ("weather".equals(group.getName())) {
                        builder.baseUrl("http://weather-api.example.com")
                               .defaultHeader("User-Agent", "WeatherApp/1.0");
                    } else if ("user".equals(group.getName())) {
                        builder.baseUrl("http://user-api.example.com")
                               .defaultHeader("User-Agent", "UserApp/1.0");
                    }
                });
    }
}
```

### 7. 自定义序列化和反序列化

可以自定义 JSON 序列化和反序列化：

```java
@Configuration
public class SerializationConfig {
    @Bean
    public RestClient restClient(ObjectMapper objectMapper) {
        // 配置 ObjectMapper
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        // 创建消息转换器
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);
        // 配置 RestClient（需要通过 RestTemplate 或自定义）
        // 这里简化示例，实际需要更复杂的配置
        return RestClient.builder()
                .baseUrl("http://api.example.com")
                .build();
    }
}
```

### 8. 文件上传和下载

可以处理文件上传和下载：

```java
@HttpExchange(url = "http://api.example.com")
public interface FileClient {
    // 文件上传
    @PostExchange(value = "/upload", contentType = "multipart/form-data")
    UploadResponse uploadFile(
        @RequestPart("file") MultipartFile file,
        @RequestPart("description") String description
    );
    // 文件下载
    @GetExchange("/download/{fileId}")
    ResponseEntity<Resource> downloadFile(@PathVariable String fileId);
}
// 使用示例
@Service
public class FileService {
    @Autowired
    private FileClient fileClient;
    public void uploadFile(MultipartFile file) {
        UploadResponse response = fileClient.uploadFile(file, "文件描述");
        System.out.println("上传成功: " + response.getFileId());
    }
    public void downloadFile(String fileId, String savePath) throws IOException {
        ResponseEntity<Resource> response = fileClient.downloadFile(fileId);
        Resource resource = response.getBody();
        if (resource != null) {
            Files.copy(resource.getInputStream(), Paths.get(savePath), StandardCopyOption.REPLACE_EXISTING);
        }
    }
}
```

## 五、最佳实践

### 1. 接口设计原则

- **单一职责**：每个接口只负责一个服务的调用
- **命名清晰**：方法名要能清楚表达功能
- **参数合理**：避免参数过多，可以用对象封装

```java
// 好的设计
@HttpExchange(url = "http://api.example.com")
public interface UserClient {
    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);
    @PostExchange("/users")
    User createUser(@RequestBody CreateUserRequest request);  // 使用请求对象
}
// 不好的设计
@HttpExchange(url = "http://api.example.com")
public interface BadClient {
    // 参数太多，不易维护
    @PostExchange("/users")
    User createUser(
        @RequestParam String name,
        @RequestParam String email,
        @RequestParam String phone,
        @RequestParam String address,
        @RequestParam Integer age
    );
}
```

### 2. 错误处理策略

- **统一异常处理**：定义统一的异常类
- **重试机制**：对临时失败进行重试
- **降级处理**：服务不可用时返回默认值

```java
// 统一异常类
public class ApiException extends RuntimeException {
    private final int statusCode;
    public ApiException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }
    public int getStatusCode() {
        return statusCode;
    }
}
// 错误处理配置
@Configuration
public class ErrorHandlingConfig {
    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .baseUrl("http://api.example.com")
                .defaultStatusHandler(
                    HttpStatusCode::isError,
                    (request, response) -> {
                        throw new ApiException(
                            response.getStatusCode().value(),
                            "API 调用失败: " + response.getStatusCode()
                        );
                    }
                )
                .build();
    }
}
```

### 3. 性能优化

- **连接池配置**：合理配置连接池大小
- **超时设置**：设置合理的超时时间
- **缓存响应**：对不经常变化的数据进行缓存

```java
@Configuration
public class PerformanceConfig {
    @Bean
    public RestClient restClient() {
        // 配置连接池
        ConnectionProvider connectionProvider = ConnectionProvider.builder("http-pool")
                .maxConnections(100)  // 最大连接数
                .maxIdleTime(Duration.ofSeconds(20))  // 最大空闲时间
                .maxLifeTime(Duration.ofSeconds(60))  // 最大生存时间
                .pendingAcquireTimeout(Duration.ofSeconds(10))  // 获取连接超时
                .build();
        HttpClient httpClient = HttpClient.create(connectionProvider)
                .responseTimeout(Duration.ofSeconds(10));
        ClientHttpConnector connector = new ReactorClientHttpConnector(httpClient);
        return RestClient.builder()
                .baseUrl("http://api.example.com")
                .clientConnector(connector)
                .build();
    }
}
```

## 六、总结

声明式 HTTP 客户端 @HttpExchange 是 Spring Framework 7.0 引入的强大功能，主要优势：

- **代码简洁**：代码量减少 60% 以上，这提升不是一点半点
- **类型安全**：编译时检查，减少运行时错误，用起来放心
- **易于维护**：接口定义清晰，易于理解和维护，团队协作更方便
- **功能强大**：支持所有 HTTP 方法、参数类型、认证方式等，基本啥都能干

使用建议：

- **入门**：从简单的 GET 请求开始，逐步学习；别着急，慢慢来
- **进阶**：掌握参数处理、配置、错误处理；这些是核心功能，得熟练掌握
- **精通**：掌握高级用法、性能优化、最佳实践；用好了性能提升明显

反正鹏磊觉得这功能确实实用，特别是做微服务的时候，调用其他服务方便多了。代码简洁，维护起来也省事。

好了，今天就聊到这；下一篇咱详细说说 GraalVM 原生镜像编译与性能优化，包括怎么用 GraalVM 编译原生镜像，提升启动速度和性能。兄弟们有啥问题可以在评论区留言，鹏磊看到会回复的。
