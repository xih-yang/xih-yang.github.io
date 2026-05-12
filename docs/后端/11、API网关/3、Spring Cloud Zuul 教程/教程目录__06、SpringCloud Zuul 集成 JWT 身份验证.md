# 06、SpringCloud Zuul 集成 JWT 身份验证
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudzuul/6.html
- 分类：API网关
- 分组：教程目录
## 1、简介

使用微服务开发项目，肯定少不了身份认证，一般我们都会将身份认证放在网关中做，实现统一的身份认证。这里我们选用了JWT（Json Web Token）作为身份认证, jwt作为当下比较流行的身份认证方式之一主要的特点是无状态，把信息放在客户端，服务器端不需要保存session，适合在分布式环境下使用。微服务网关（如Zuul）验证token后，把解析出来的身份信息放在request header请求头或者请求体中返回给具体的业务微服务。

## 2、JWT简介

这里对JWT做一个简单的介绍。jwt，全称JSON Web Token，一般用于用户认证（前后端分离项目、微信小程序、APP端）。

- 传统的token认证方式：用户登录，服务器端返回token，并将token保存在服务器端，以后用户再次访问时，需携带token，服务器端获取token后，再去数据库中获取token进行校验。
- 基于jwt token认证方式：用户登录，服务器端给用户返回一个token，但是服务器端不保存，以后用户再次访问时，需要携带token,服务器端获取token后，再做token校验。

通过上面的对比，jwt跟传统方式最明显的区别就是服务端不保存token，这样服务端校验token时就少了很多数据库操作。

jwttoken结构：jwt token一般分为三个部分：Header、Payload、Signature。

下图是一个jwt token，每一种颜色对应一个部分。

- Header：内部包含算法和类型

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

生成的逻辑：将json转换成字符串，然后使用Base64Url进行编码加密 。

- Payload：主要存放自定义的信息，如userId、用户名等，但是不要把敏感信息放在这里。

```json
{
  "userId": "1234567890",
  "username": "John Doe",
  "exp": 12345678950   #超时时间
}
```

生成的逻辑：将json转换成字符串，然后使用Base64Url进行编码加密

- Signature：将第一部分、第二部分的密文使用.拼接起来，然后使用HS256算法进行加密 + 加盐。HS256算法进行加密后的密文再进行Base64Url进行编码加密。

```json
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret)
```

下面介绍一下jwt实现过程：

**1、** 第一步：用户提交用户名和密码给服务器端，如果登录成功，使用jwt创建一个token，并给用户返回；

**2、** 第二步：以后用户再来访问时，需携带token,后端需要对token进行校验；

**3、** 第三步：获取token，对token进行切割，对第二段进行Base64Url解密，获取Payload消息，检测token是否超时；

**4、** 第四步：将第一段和第二段进行拼接，然后使用HS256加密+加盐生成密文1，将第三段密文进行Base64Url解密生成密文2，最后比较两个密文1,2是否相等，如果相等表示token有效；

通过上面的介绍，相信大家已经对JWT有些初步的认识，那么下面就该动动手实现一下网关Zuul集成JWT认证。

## 3、Zuul集成JWT过程

下面会通过一个示例详细介绍如何在Spring Cloud Zuul中集成JWT实现用户认证功能，主要涉及到三个项目：

- zuul-eureka-server：端口1111.，服务注册中心。
- goods-service：端口2222，服务提供者。
- api-gateway：端口3333，网关服务，具体集成JWT主要是在网关中进行。

注意，笔者这里使用的还是比较旧的微服务版本：

- SpringBoot：1.5.8.RELEASE
- SpringCloud：Camden.SR6

**1、搭建zuul-eureka-server**

【a】pom.xml引入对应的依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-eureka-server</artifactId>
</dependency>
```

【b】启动类加上@EnableEurekaServer注解

```java
@SpringBootApplication
//@EnableEurekaServer注解的作用: 开启Eureka服务发现的功能
@EnableEurekaServer
public class ZuulEurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZuulEurekaServerApplication.class, args);
    }
}
```

【c】application.yml配置文件

```sh
server:
  port: 1111  #服务端口号
eureka:
  client:
    fetch-registry: false  #是否检索服务
    register-with-eureka: false  #表示不向Eureka注册自身服务
    service-url: #服务注册中心地址，其他服务可以通过指定eureka.client.serviceUrl.defaultZone=http://localhost:1111/eureka/注册到Eureka上
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
  instance:
    #主机名
    hostname: localhost
spring:
  application:
    #服务名称
    name: eureka-server
```

至此，服务注册中心Eureka就搭建成功了。

**2、搭建goods-service**

【a】pom.xml引入相关依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-eureka</artifactId>
</dependency>
```

【b】启动类加上@EnableDiscoveryClient注解将服务注册到Eureka中

```java
@SpringBootApplication
@EnableDiscoveryClient //注册Eureka客户端
public class GoodsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(GoodsServiceApplication.class, args);
    }
}
```

【c】application.yml配置文件

```sh
server:
  port: 2222
spring:
  application:
    name:  goods-service
eureka:
  instance:
    hostname: localhost
  client:
    serviceUrl:
      defaultZone: http://localhost:1111/eureka/
```

【d】定义一个测试Controller接口

```java
@RestController
public class GoodsController {
    //模拟几个商品
    private static List<String> goodsList = new ArrayList<>();
    static {
        goodsList.add("图书");
        goodsList.add("相册");
        goodsList.add("风扇");
        goodsList.add("手机");
        goodsList.add("电脑");
    }
    @GetMapping("/getGoodsList")
    public List<String> getGoodsList() {
        return goodsList;
    }
}
```

至此，goods-service服务提供者也搭建完成，下面搭建最重要的网关服务。

**3、搭建api-gateway**

【a】pom.xml引入相关依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-eureka</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-zuul</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt</artifactId>
    <version>0.9.1</version>
</dependency>
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.4</version>
</dependency>
```

注意这里引入了jwt工具包io.jsonwebtoken.jjwt。

【b】启动类加上注解@EnableDiscoveryClient开启服务注册功能、@EnableZuulProxy开启服务路由功能

```java
@SpringBootApplication
@EnableDiscoveryClient
//@EnableZuulProxy注解用于开启Zuul路由功能(反向代理)
@EnableZuulProxy
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
```

【c】application.yml配置文件

```sh
server:
  port: 3333
spring:
  application:
    name: api-gateway
eureka:
  client:
    service-url:
      defaultZone: http://localhost:1111/eureka/
zuul:
  routes:
    goods-service:
      path: /goods/**
      serviceId:  goods-service
    api-gateway:
      path: /api/login/**
      serviceId: api-gateway
common:
  login:
    url: /api/login/userLogin  #登录请求地址,可设置多个,使用逗号分隔开
exclude:
  auth:
    url: /api/login/userLogin #不需要授权验证的请求地址,可设置多个,使用逗号分隔开,会跳过AuthFilter授权验证
```

注意：这里定义了网关路由的一些规则以及登录请求的URL以及需要排除掉不需要进行认证的URL配置信息，在后面的过滤器中使用到。

【d】编写LoginController,模拟登录接口

```java
package com.springcloud.zuul.apigateway.controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class LoginController {
    @GetMapping(value = "/userLogin")
    public String loginByPassword() {
        //此处省略具体的登录逻辑
        return "登录成功！";
    }
}
```

【e】封装JwtUtil，主要包含两个方法

- 创建token
- 解析（并验证）token

```java
package com.springcloud.zuul.apigateway.utils;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;
import java.util.Date;
import java.util.Map;
@Component
public class JwtUtils {
    /**
     * 签名用的密钥
     */
    private static final String SIGNING_KEY = "u3HYQHDdH8JBblN0Jyhu4Fy9IMXEiilM";
    /**
     * 用户登录成功后生成Jwt token
     * 使用Hs256算法
     *
     * @param exp    jwt过期时间
     * @param claims 保存在Payload（有效载荷）中的内容
     * @return token字符串
     */
    public String createJwtToken(Date exp, Map<String, Object> claims) {
        //token生成的时间，默认取当前时间
        Date now = new Date(System.currentTimeMillis());
        //创建一个JwtBuilder，设置jwt的body
        JwtBuilder builder = Jwts.builder()
                //保存在Payload（有效载荷）中的内容, 自定义一些数据保存在这里
                .setClaims(claims)
                //iat: jwt的签发时间
                .setIssuedAt(now)
                //设置过期时间
                .setExpiration(exp)
                //使用HS256算法和签名使用的秘钥生成密文
                .signWith(SignatureAlgorithm.HS256, SIGNING_KEY);
        return builder.compact();
    }
    /**
     * 解析token，获取到Payload（有效载荷）中的内容，包括验证签名，判断是否过期
     *
     * @param token 令牌
     * @return
     */
    public Claims parseJwtToken(String token) {
        //得到DefaultJwtParser
        return Jwts.parser()
                //设置签名的秘钥
                .setSigningKey(SIGNING_KEY)
                //设置需要解析的token
                .parseClaimsJws(token).getBody();
    }
}
```

【f】封装路由匹配工具类

```java
package com.springcloud.zuul.apigateway.utils;
import org.springframework.util.AntPathMatcher;
public class PathMatchUtil {
    private static AntPathMatcher matcher = new AntPathMatcher();
    public static boolean isPathMatch(String pattern, String path) {
        return matcher.match(pattern, path);
    }
}
```

【g】定义LoginFilter拦截登录方法，登录成功后创建token，返回给前端

大体流程：

**1、** 拦截类型是“post”后置拦截器，在路由方法响应之后拦截；

**2、** 判断请求的uri是否是登录接口（与配置文件中设置的登录uri是否匹配），需要在配置文件配置登录接口地址；

**3、** 判断登录方法返回成功，创建token，并添加到responsebody或responseheader，返回给前端；

```java
package com.springcloud.zuul.apigateway.filter;
import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import com.springcloud.zuul.apigateway.utils.JwtUtils;
import com.springcloud.zuul.apigateway.utils.PathMatchUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
/**
 * @author weixiaohuai
 * @date 2022-07-19 14:34
 * @description 拦截登录请求后的过滤器
 */
@Component
public class LoginFilter extends ZuulFilter {
    @Value("${common.login.url}")
    private String loginUrl;
    @Autowired
    private JwtUtils jwtUtils;
    @Override
    public String filterType() {
        return "post";
    }
    @Override
    public int filterOrder() {
        return 1;
    }
    @Override
    public boolean shouldFilter() {
        //只有路径与配置文件中配置的登录路径相匹配，才会放行该过滤器,执行过滤操作
        RequestContext ctx = RequestContext.getCurrentContext();
        String requestURI = ctx.getRequest().getRequestURI();
        for (String url : loginUrl.split(",")) {
            if (PathMatchUtil.isPathMatch(url, requestURI)) {
                return true;
            }
        }
        return false;
    }
    @Override
    public Object run() {
        RequestContext requestContext = RequestContext.getCurrentContext();
        try {
            HttpServletRequest httpServletRequest = requestContext.getRequest();
            //此处简单模拟登录,并非生产环境登录使用.
            String username = httpServletRequest.getParameter("username");
            String password = httpServletRequest.getParameter("password");
            if ("weishihuai".equals(username) && "password".equals(password)) {
                //表示登录成功,服务器端需要生成token返回给客户端
                //过期时间: 2分钟
                Date expDate = new Date(System.currentTimeMillis() + 2 * 60 * 1000);
                Map<String, Object> claimsMap = new HashMap<>();
                claimsMap.put("username", "weishihuai");
                claimsMap.put("userId", "201324131147");
                claimsMap.put("expDate", expDate);
                String jwtToken = jwtUtils.createJwtToken(expDate, claimsMap);
                //响应头设置token
                requestContext.addZuulResponseHeader("token", jwtToken);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
```

【h】定义认证过滤器AuthFilter，拦截具体的业务接口，验证token

大体流程：

**1、** 拦截类型是“pre”前置过滤器，在调用业务接口之前拦截；

**2、** 判断请求的uri是否排除在外不需要认证的URL，需要在配置文件配置业务接口地址；

**3、** 判断token验证是否通过，通过则路由，不通过返回错误提示；

```java
package com.springcloud.zuul.apigateway.filter;
import com.alibaba.fastjson.JSONObject;
import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import com.springcloud.zuul.apigateway.utils.JwtUtils;
import com.springcloud.zuul.apigateway.utils.PathMatchUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
/**
 * @author weixiaohuai
 * @date 2022-07-19 14:40
 * @description 验证授权的过滤器
 */
@Component
public class AuthFilter extends ZuulFilter {
    private static Logger logger = LoggerFactory.getLogger(AuthFilter.class);
    /**
     * 读取配置文件中排除不需要授权的URL
     */
    @Value("${exclude.auth.url}")
    private String excludeAuthUrl;
    @Autowired
    private JwtUtils jwtUtils;
    @Override
    public String filterType() {
        //由于授权需要在请求之前调用，所以这里使用前置过滤器
        return "pre";
    }
    @Override
    public int filterOrder() {
        return 2;
    }
    @Override
    public boolean shouldFilter() {
        //路径与配置文件中的相匹配，则执行过滤
        RequestContext ctx = RequestContext.getCurrentContext();
        String requestURI = ctx.getRequest().getRequestURI();
        List<String> excludesUrlList = Arrays.asList(excludeAuthUrl.split(","));
        return !excludesUrlList.contains(requestURI);
    }
    @Override
    public Object run() {
        RequestContext requestContext = RequestContext.getCurrentContext();
        HttpServletRequest httpServletRequest = requestContext.getRequest();
        String token = httpServletRequest.getHeader("token");
        Claims claims;
        try {
            //解析没有异常则表示token验证通过，如有必要可根据自身需求增加验证逻辑
            claims = jwtUtils.parseJwtToken(token);
            //对请求进行路由
            requestContext.setSendZuulResponse(true);
            //请求头加入userId，传给具体的微服务
            requestContext.addZuulRequestHeader("userId", claims.get("userId").toString());
        } catch (ExpiredJwtException expiredJwtEx) {
            logger.error("token : {} 已过期", token);
            //不对请求进行路由
            requestContext.setSendZuulResponse(false);
            JSONObject resultJSONObject = new JSONObject();
            resultJSONObject.put("code", "40002");
            resultJSONObject.put("msg", "token已过期");
            requestContext.setResponseBody(resultJSONObject.toJSONString());
            HttpServletResponse response = requestContext.getResponse();
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType("application/json;charset=utf-8");
        } catch (Exception ex) {
            logger.error("token : {} 验证失败", token);
            //不对请求进行路由
            requestContext.setSendZuulResponse(false);
            JSONObject resultJSONObject = new JSONObject();
            resultJSONObject.put("code", "40001");
            resultJSONObject.put("msg", "非法token");
            requestContext.setResponseBody(resultJSONObject.toJSONString());
            HttpServletResponse response = requestContext.getResponse();
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType("application/json;charset=utf-8");
        }
        return null;
    }
}
```

至此，网关服务集成JWT就算是搭建成功了，下面我们进行测试一下。

## 4、测试

（一）、测试登录接口，查看是否被LoginFilter所拦截，这里使用postman模拟发请求。

请求登录接口：[http://localhost:3333/api/login/userLogin?username=weishihuai&password=password](http://localhost:3333/api/login/userLogin?username=weishihuai&password=password)

我们看到header里都有了token：

eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1OTUxNjQ5ODYsInVzZXJJZCI6IjIwMTMyNDEzMTE0NyIsImlhdCI6MTU5NTE2NDg2NiwiZXhwRGF0ZSI6MTU5NTE2NDk4NjAwMywidXNlcm5hbWUiOiJ3ZWlzaGlodWFpIn0.IL1jRpAmykS4QsMaztQCRHaCnie8fyULOVT6by_zBW4

前面我们已经介绍过token分为了三段结构，第二段payload部分使我们存放的自定义信息，是经过base64URL加密后的密文，下面我们将它进行解密：

eyJleHAiOjE1OTUxNjQ5ODYsInVzZXJJZCI6IjIwMTMyNDEzMTE0NyIsImlhdCI6MTU5NTE2NDg2NiwiZXhwRGF0ZSI6MTU5NTE2NDk4NjAwMywidXNlcm5hbWUiOiJ3ZWlzaGlodWFpIn0

解密后的明文为：

```java
{"exp":1595164986,"userId":"201324131147","iat":1595164866,"expDate":1595164986003,"username":"weishihuai"}
```

可见，其中包含了过期时间、用户id、token签发时间等。

（二）、测试业务接口

请求业务接口 ：[http://localhost:3333/goods/getGoodsList](http://localhost:3333/goods/getGoodsList)， 请求头不传token或传错误的token：

可以看到返回了错误信息：

```java
{
    "msg": "非法token",
    "code": "40001"
}
```

因为token有效期为两分钟，所以这里需要等待两分钟后，此时token已经过期。我们再次请求业务接口 ：[http://localhost:3333/goods/getGoodsList](http://localhost:3333/goods/getGoodsList)， 传入刚刚那个token，看是否会提示token已过期。

可以看到返回了错误信息 ：

```java
{
    "msg": "token已过期",
    "code": "40002"
}
```

因为刚刚那个token已经失效了，所以这里我们重新获取一个token，然后再次请求[http://localhost:3333/goods/getGoodsList](http://localhost:3333/goods/getGoodsList)，传入正确的token，看下数据是否能够正常返回。

可以看到返回了业务数据，说明已经请求到了业务接口，身份认证成功。

## 5、总结

本文主要总结了如何在Spring Clous Zuul网关中集成JWT实现身份认证功能，主要利用了JWT Token无状态特性，不需要保存在服务器端，所以节省了很多数据库IO操作，至于集成过程，主要是通过继承ZuulFilter拦截所有发往网关的请求，类似于拦截功能，详细的实现过程已经在前面介绍了。限于笔者水平有限，如有不对之处，还望指出。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
