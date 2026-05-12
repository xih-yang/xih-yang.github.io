# 06、SpringCloud Gateway 会话共享
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/2/6.html
- 分类：API网关
- 分组：SpringCloud Gateway
在进行zuul切换到gateway时，需要重新实现session共享，本文主要分享一下自己实现的方案。

## 1、zuul中的session共享

在zuul中，是通过spring-session-data-redis这个组件，将session的信息存放到redis中实现的session共享。这次也简单说明下如何实现以及一些注意的点。

首先在网关zuul以及所有的微服务中添加spring-session-data-redis依赖：

```xml
<!-- session共享 -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.session</groupId>
  <artifactId>spring-session-data-redis</artifactId>
</dependency>
```

之后添加redis配置信息：

```sh
spring:
  redis:
    host: localhost
    port: 6379
```

添加EnableRedisHttpSession注解：

```java
/**
 * 指定flushMode为IMMEDIATE 表示立即将session写入redis
 *
 * @author yuanzhihao
 * @since 2022/5/8
 */
@EnableRedisHttpSession(flushMode = FlushMode.IMMEDIATE)
@Configuration
public class RedisSessionConfig {
}
```

在网关zuul工程中，路由跳转到微服务时，需要添加sensitiveHeaders，设置为空，表示将敏感信息透传到下游微服务，这边需要将cookie的信息传下去，session共享保存到redis里面需要用到：

```sh
zuul:
  routes:
    portal:
      path: /portal/**
      sensitiveHeaders: # 将敏感信息传到下游服务
      serviceId: portal
```

指定server.servlet.context-path路径：

```sh
server.servlet.context-path=/gateway
```

**zuul测试工程**

在我的代码库中，我提交了一个简单的demo，主要有四个工程，分别是网关zuul、主页portal、两个客户端client-1、server-1。

**网关zuul中添加路由信息：**

```sh
spring:
  application:
    name: zuul
  redis:
    host: localhost
    port: 6379
server:
  servlet:
    context-path: /gateway
zuul:
  routes:
    portal:
      path: /portal/**
      sensitiveHeaders:
      serviceId: portal
    client-1:
      path: /client1/**
      sensitiveHeaders:
      serviceId: eureka-client1
    server-1:
      path: /server1/**
      sensitiveHeaders:
      serviceId: eureka-server1
```

添加登录过滤器，对所有的请求进行拦截，对于没有登录的请求会自动跳转到登录页面：

```java
/**
 * 登录过滤器
 *
 * @author yuanzhihao
 * @since 2022/5/8
 */
@Component
@Slf4j
public class LoginFilter extends ZuulFilter {
    private static final List<String> white_List = Arrays.asList("/login", "/logout");
    @Override
    public String filterType() {
        return "pre";
    }
    @Override
    public int filterOrder() {
        return -1;
    }
    @Override
    public boolean shouldFilter() {
        HttpServletRequest request = RequestContext.getCurrentContext().getRequest();
        String requestURI = request.getRequestURI();
        for (String uri : white_List) {
            if (requestURI.endsWith(uri)) {
                return false;
            }
        }
        return true;
    }
    @SneakyThrows
    @Override
    public Object run() throws ZuulException {
        RequestContext currentContext = RequestContext.getCurrentContext();
        HttpServletRequest request = currentContext.getRequest();
        HttpSession session = request.getSession();
        UserInfo userInfo = (UserInfo) session.getAttribute("userInfo");
        if (userInfo == null) {
            HttpServletResponse response = currentContext.getResponse();
            response.sendRedirect("/gateway/portal/login");
        }
        return null;
    }
}
```

**portal中简单实现了登录逻辑：**

```java
/**
 * @author yuanzhihao
 * @since 2022/5/8
 */
@Controller
public class LoginController {
    @GetMapping(value = "/login")
    public String login(HttpServletRequest request, HashMap<String, Object> map) {
        UserInfo userInfo = (UserInfo) request.getSession().getAttribute("userInfo");
        if (userInfo != null) {
            map.put("userInfo", userInfo);
            return "index";
        }
        return "login";
    }
    @PostMapping("/login")
    public String login(UserInfo userInfo, HashMap<String, Object> map, HttpServletRequest request) {
        // 设置session
        request.getSession().setAttribute("userInfo", userInfo);
        map.put("userInfo", userInfo);
        return "index";
    }
    @GetMapping("/logout")
    public String logout(HttpServletRequest request) {
        request.getSession().invalidate();
        return "logout";
    }
}
```

在客户端client-1和server-1中可以请求到当前session中的用户信息：

```java
@GetMapping("/hello")
public String hello(HttpServletRequest request) {
  UserInfo userInfo = (UserInfo) request.getSession().getAttribute("userInfo");
  return "Client1 Hello " + userInfo.getUsername();
}
```

未登录时，通过网关访问其他微服务页面会重定向：

登录后，可以正常访问，并且在其他微服务中可以获取到session中的用户信息：

client-1：

server-1：

## 2、gateway中的session共享

### 2.1、httpSession和webSession

首先spring cloud gateway是基于webflux，是非阻塞的，zuul是基于servlet的，是阻塞的（这部分差异大家可以自行了解一下，我也不是很熟~）。他们的session是两种实现，在zuul中是httpSession，而到了gateway中是webSession。

在gateway中需要将EnableRedisHttpSession注解换成EnableRedisWebSession：

```java
/**
 * 指定saveMode为ALWAYS 功能和flushMode类似
 *
 * @author yuanzhihao
 * @since 2022/5/6
 */
@EnableRedisWebSession(saveMode = SaveMode.ALWAYS)
@Configuration
@Slf4j
public class RedisSessionConfig {
     }
```

同时需要覆盖webSession中读取sessionId的写法，将SESSION信息进行base64解码，默认实现中是没有base64解码的，sessionId传到下游时不一致，会导致session不共享：

```java
// 覆盖默认实现
@Bean
public WebSessionIdResolver webSessionIdResolver() {
    return new CustomWebSessionIdResolver();
}
private static class CustomWebSessionIdResolver extends CookieWebSessionIdResolver {
    // 重写resolve方法 对SESSION进行base64解码
    @Override
    public List<String> resolveSessionIds(ServerWebExchange exchange) {
        MultiValueMap<String, HttpCookie> cookieMap = exchange.getRequest().getCookies();
        // 获取SESSION
        List<HttpCookie> cookies = cookieMap.get(getCookieName());
        if (cookies == null) {
            return Collections.emptyList();
        }
        return cookies.stream().map(HttpCookie::getValue).map(this::base64Decode).collect(Collectors.toList());
    }
    private String base64Decode(String base64Value) {
        try {
            byte[] decodedCookieBytes = Base64.getDecoder().decode(base64Value);
            return new String(decodedCookieBytes);
        } catch (Exception ex) {
            log.debug("Unable to Base64 decode value: " + base64Value);
            return null;
        }
    }
}
```

这边可以参考下具体的源码。httpSession在读取的时候，会进行解码，具体方法地址org.springframework.session.web.http.DefaultCookieSerializer#readCookieValues

### 2.2、添加context-path

spring-cloud-gateway不是基于servlet的，所以设置了server.servlet.context-path属性并不生效，这边参考其他人的方案使用了另一种方法添加了context-path。使用StripPrefix的方式。StripPrefix的参数表示在进行路由转发到下游服务之前，剥离掉请求中StripPrefix参数个数的路径参数。比如StripPrefix为2，像网关发起的请求是/gateway/client1/name，转发到下游时，请求路径会变成/name，这样就添加完成了context-path。

具体路由的配置信息如下：

```java
spring:
  application:
    name: gateway
  cloud:
    gateway:
      routes:
       - id: client1
         uri: lb://eureka-client1
         predicates:
           - Path=/gateway/client1/**
         filters:
           - StripPrefix=2
       - id: server1Session
         uri: lb://eureka-server1
         predicates:
           - Path=/gateway/server1/**
         filters:
           - StripPrefix=2
       - id: portal
         uri: lb://portal
         predicates:
           - Path=/gateway/portal/**
         filters:
           - StripPrefix=2
```

到现在差不多就完成了gateway的session共享。

### 2.3、gateway测试工程

这边测试工程和上面一致，只是将网关换成了gateway。

我们在gateway中添加一个登录过滤器拦截所有的请求，对于没有登录的请求跳转到登录页面：

```java
/**
 * 登录过滤器
 *
 * @author yuanzhihao
 * @since 2022/5/6
 */
@Component
@Slf4j
public class LoginGlobalFilter implements GlobalFilter, Ordered {
    private static final List<String> white_List = Arrays.asList("/login", "/logout");
    // 登录地址
    private static final String PORTAL_URL = "https://localhost:7885/gateway/portal/login";
    @SneakyThrows
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        System.err.println("login filter starter");
        // 判断是否登录
        AtomicBoolean isLogin = new AtomicBoolean(false);
        exchange.getSession().subscribe(webSession -> {
            UserInfo userInfo = webSession.getAttribute("userInfo");
            System.err.println("userInfo is " + userInfo);
            if (userInfo != null) {
                isLogin.set(true);
            }
        });
        // 这边添加一个延时， 等待获取到session
        Thread.sleep(200);
        // url白名单
        String path = exchange.getRequest().getURI().getPath();
        boolean isWhiteUrl = white_List.stream().anyMatch(path::endsWith);
        // 登录状态或者在url白名单中 放行
        if (isLogin.get() || isWhiteUrl) {
            return chain.filter(exchange);
        }
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.SEE_OTHER);
        response.getHeaders().set(HttpHeaders.LOCATION, PORTAL_URL);
        response.getHeaders().add("Content-Type", "text/plain;charset=UTF-8");
        return response.setComplete();
    }
    @Override
    public int getOrder() {
        return -1;
    }
}
```

这边我添加了一个200ms的睡眠，因为测试验证的时候，当请求进入这个过滤器时，获取到的webSession是空，导致逻辑异常。猜测是由于spring-cloud-gateway是基于netty实现的非阻塞IO，所以获取session有一定的延迟，所有添加了一个sleep阻塞。后续会考虑修改。

之前也尝试过使用block()方法修改为阻塞的，但是抛异常了，具体原因没有分析出来。

这边通过gateway访问和zuul的结果一致：

在其他微服务中也可以获取到session中的用户信息 ：

## 3、结语

以上就是Spring Cloud Gateway中session共享的方案，在网络上相关的文章很少，如果大家有其他不错的方案，希望也可以分享一下。

参考地址：

[https://stackoverflow.com/questions/50325674/spring-cloud-gateway-api-context-path-on-routes-not-working](https://stackoverflow.com/questions/50325674/spring-cloud-gateway-api-context-path-on-routes-not-working)

[https://github.com/spring-cloud/spring-cloud-gateway/issues/1920](https://github.com/spring-cloud/spring-cloud-gateway/issues/1920)

[https://www.shuzhiduo.com/A/QV5Zg2o2dy/](https://www.shuzhiduo.com/A/QV5Zg2o2dy/)

代码地址：[https://github.com/yzh19961031/SpringCloudDemo](https://github.com/yzh19961031/SpringCloudDemo)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
