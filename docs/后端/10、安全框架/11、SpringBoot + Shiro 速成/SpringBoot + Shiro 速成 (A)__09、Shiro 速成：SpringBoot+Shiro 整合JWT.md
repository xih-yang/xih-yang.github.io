# 09、Shiro 速成：SpringBoot+Shiro 整合JWT
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/9.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (A)
## 一、概述

JWT，即Json Web Token，JWT作为当下比较流行的身份认证方式之一主要的特点是无状态，把信息放在客户端，服务器端不需要保存session，适合在分布式环境下使用。

**1、** 传统的Token认证方式：用户登录，服务器端返回Token，并将Token保存在服务器端，以后用户再次访问时，需携带Token，服务器端获取Token后，再去数据库中获取Token进行校验。

**2、** 基于JWTToken认证方式：用户登录，服务器端给用户返回一个Token，但是服务器端不保存，以后用户再次访问时，需要携带Token，服务器端获取Token后，再做Token校验。

通过上面的对比，JWT跟传统方式最明显的区别就是服务端不保存Token，这样服务端校验Token时就少了很多数据库操作。

Jwttoken结构：JWT Token一般分为三个部分：Header、Payload、Signature。下图是一个JWT Token，每一种颜色对应一个部分。

Header：内部包含算法和类型。 生成的逻辑：将json转换成字符串，然后使用Base64Url进行编码加密 。

```java
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- Payload：主要存放自定义的信息，如userId、用户名等，但是不要把敏感信息放在这里。生成的逻辑：将json转换成字符串，然后使用Base64Url进行编码加密。

```java
{
  "userId": "1234567890",
  "username": "John Doe",
  "exp": 12345678950  超时时间
}
```

Signature：将第一部分、第二部分的密文使用 "." 拼接起来，然后使用HS256算法进行加密 + 加盐，HS256算法进行加密后的密文再进行Base64Url进行编码加密。

```java
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

## 二、Shiro整合JWT

使用基于 Token 的身份验证方法，在服务端不需要存储用户的登录记录。

**1、** 客户端使用用户名跟密码请求登录；

**2、** 服务端收到请求，去验证用户名与密码；

**3、** 验证成功后，服务端会签发一个Token，再把这个Token发送给客户端；

**4、** 客户端收到Token以后可以把它存储起来，比如放在Cookie里；

**5、** 客户端每次向服务端请求资源的时候需要带着服务端签发的Token；

**6、** 服务端收到请求，然后去验证客户端请求里面带着的Token，如果验证成功，就向客户端返回请求的数据；

【a】引入JWT相关依赖

```xml
<!--jjwt 依赖-->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt</artifactId>
    <version>0.9.1</version>
</dependency>
```

【b】application.yml配置中增加JWT相关配置

```java
#jwt 配置
jwt:
  config:
   加密密匙
    secret: weixiaohuai
    token有效期，单位秒
    timeout: 3600
    后端免认证接口 url
    noAuthUrl: /userLogin,
```

【c】创建JWT工具类，负责生成JWT和解析JWT

```java
import com.wsh.springboot.springbootshiro.properties.JWTProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.Date;
@Component
public class JwtUtils {
    @Autowired
    private JWTProperties jwtProperties;
    /**
     * 生成JWTToken
     *
     * @param id      用户id
     * @param subject 用户名
     * @return java.lang.String
     */
    public String createJWTToken(String id, String subject) {
        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);
        JwtBuilder builder = Jwts.builder()
                .setId(id) //id
                .setSubject(subject) //主题
                .setIssuedAt(now) //签发时间
                .signWith(SignatureAlgorithm.HS256, jwtProperties.getSecret()); //加密
        //超时大于0 设置token超时
        if (jwtProperties.getTimeout() > 0) {
            //转换成超时毫秒
            long timeout = nowMillis + (jwtProperties.getTimeout() * 1000);
            builder.setExpiration(new Date(timeout));
        }
        return builder.compact();
    }
    /**
     * 解析JWT
     */
    public Claims parseJWToken(String jwtToken) {
        return Jwts.parser()
                .setSigningKey(jwtProperties.getSecret())
                .parseClaimsJws(jwtToken)
                .getBody();
    }
}
```

【d】自定义JWT属性配置文件，用于注入配置文件中的值

```java
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
/**
 * 自定义JWT属性配置文件，用于注入配置文件中的值
 */
@Configuration
@Component
@ConfigurationProperties(prefix = "jwt.config")
public class JWTProperties {
    /**
     * jwt加密秘钥
     */
    private String secret;
    /**
     * jwt有效时间
     */
    private long timeout;
    /**
     * 过滤不需要认证的URL
     */
    private String noAuthUrl;
    public JWTProperties() {
    }
    public String getSecret() {
        return secret;
    }
    public void setSecret(String secret) {
        this.secret = secret;
    }
    public long getTimeout() {
        return timeout;
    }
    public void setTimeout(long timeout) {
        this.timeout = timeout;
    }
    public String getNoAuthUrl() {
        return noAuthUrl;
    }
    public void setNoAuthUrl(String noAuthUrl) {
        this.noAuthUrl = noAuthUrl;
    }
}
```

【e】创建统一结果返回包装类

```java
/**
 * 自定义返回结果
 */
public class CustomResultSet {
    private String code;
    private String msg;
    private String data;
    public CustomResultSet() {
    }
    public String getCode() {
        return code;
    }
    public void setCode(String code) {
        this.code = code;
    }
    public String getMsg() {
        return msg;
    }
    public void setMsg(String msg) {
        this.msg = msg;
    }
    public String getData() {
        return data;
    }
    public void setData(String data) {
        this.data = data;
    }
    public CustomResultSet(String code, String msg, String data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }
}
```

【f】自定义过滤器CutomJWTFilter

我们使用的是 shiro 默认的权限拦截 Filter，而因为JWT的整合，我们需要自定义自己的过滤器 CutomJWTFilter，CutomJWTFilter 继承了 BasicHttpAuthenticationFilter，并部分方法进行了重写。

**1、** 检验请求头是否带有token((HttpServletRequest)request).getHeader("Token")!=null；

**2、** 如果带有token，执行shiro的login()方法，将token提交到Realm中进行检验；如果没有token，说明当前状态为游客状态（或者其他一些不需要进行认证的接口）；

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wsh.springboot.springbootshiro.entity.CustomResultSet;
import com.wsh.springboot.springbootshiro.entity.JWTToken;
import com.wsh.springboot.springbootshiro.properties.JWTProperties;
import org.apache.shiro.authz.UnauthorizedException;
import org.apache.shiro.web.filter.authc.BasicHttpAuthenticationFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.RequestMethod;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
/**
 * @Description 自定义JWT过滤器, 继承自BasicHttpAuthenticationFilter
 * @Date 2022/11/7 20:23
 * @Author weishihuai
 * 说明:
 */
public class CustomJWTFilter extends BasicHttpAuthenticationFilter {
    private static final Logger logger = LoggerFactory.getLogger(CustomJWTFilter.class);
    //请求头中"access_token"
    private static final String ACCESS_TOKEN = "access_token";
    //JWT属性配置信息
    private JWTProperties jwtProperties;
    private AntPathMatcher pathMatcher = new AntPathMatcher();
    //因为CustomJWTFilter并没有注册到IOC容器中，所以不能使用@Autowired注入JWTProperties，得使用setter或者构造方法注入
    public CustomJWTFilter(JWTProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }
    /**
     *
     * 为什么最终返回的都是true，即允许访问?
     * 例如我们提供一个地址 GET /list, 登入用户和游客看到的内容是不同的， 如果在这里返回了false，请求会被直接拦截，用户看不到任何东西
     * 所以我们在这里返回true，Controller中可以通过 subject.isAuthenticated() 来判断用户是否登入.
     * 如果有些资源只有登入用户才能访问，我们只需要在方法上面加上 @RequiresAuthentication 注解即可.
     */
    @Override
    protected boolean isAccessAllowed(ServletRequest request, ServletResponse response, Object mappedValue) throws UnauthorizedException {
        logger.info("CustomJWTFilter ---> isAccessAllowed().....");
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        String[] split = jwtProperties.getNoAuthUrl().split(",");
        for (String url : split) {
            //如果是在配置文件中配置的免认证URL，则直接返回true，表示放行
            if (pathMatcher.match(url, httpServletRequest.getRequestURI())) {
                return true;
            }
        }
        //判断请求的请求头是否带上access_token属性
        if (isLoginAttempt(request, response)) {
            //如果请求头中包含access_token属性，则执行executeLogin方法进行登入操作，检查access_token是否正确
            try {
                return executeLogin(request, response);
            } catch (IOException e) {
                e.printStackTrace();
            }
        } else {
            try {
                this.returnErrorMsg(response, "token为空");
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return false;
    }
    @Override
    protected boolean executeLogin(ServletRequest request, ServletResponse response) throws IOException {
        logger.info("CustomJWTFilter ---> executeLogin().....");
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        String token = httpServletRequest.getHeader(ACCESS_TOKEN);
        try {
            // 提交给realm进行登入，如果错误他会抛出异常并被捕获
            getSubject(request, response).login(new JWTToken(token));
            // 如果没有抛出异常则代表登入成功，返回true
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            this.returnErrorMsg(response, "executeLogin--->token认证失败");
            return false;
        }
    }
    /**
     * 判断用户是否想要登入。
     * 检查请求头中是否包含access_token即可
     */
    @Override
    protected boolean isLoginAttempt(ServletRequest request, ServletResponse response) {
        logger.info("CustomJWTFilter ---> isLoginAttempt().....");
        HttpServletRequest req = (HttpServletRequest) request;
        return null != req.getHeader(ACCESS_TOKEN);
    }
    /**
     * 返回自定义错误信息
     *
     * @param response
     * @param msg
     * @throws IOException
     */
    private void returnErrorMsg(ServletResponse response, String msg) throws IOException {
        CustomResultSet resultSet = new CustomResultSet("500", msg, null);
        //响应token为空
        response.setContentType("application/json;charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        //清空第一次流响应的内容
        response.resetBuffer();
        //转成json格式
        ObjectMapper object = new ObjectMapper();
        String asString = object.writeValueAsString(resultSet);
        response.getWriter().println(asString);
    }
    /**
     * 对跨域提供支持
     */
    @Override
    protected boolean preHandle(ServletRequest request, ServletResponse response) throws Exception {
        logger.info("CustomJWTFilter ---> preHandle().....");
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;
        httpServletResponse.setHeader("Access-control-Allow-Origin", httpServletRequest.getHeader("Origin"));
        httpServletResponse.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
        httpServletResponse.setHeader("Access-Control-Allow-Headers", httpServletRequest.getHeader("Access-Control-Request-Headers"));
        // 跨域时会首先发送一个 option请求，这里我们给 option请求直接返回正常状态
        if (httpServletRequest.getMethod().equals(RequestMethod.OPTIONS.name())) {
            httpServletResponse.setStatus(HttpStatus.OK.value());
            return false;
        }
        return super.preHandle(request, response);
    }
```

所有的请求都会先经过Filter，所以我们继承官方的BasicHttpAuthenticationFilter，并且重写鉴权的方法。代码的执行流程preHandle -> isAccessAllowed -> isLoginAttempt -> executeLogin。

【g】自定义JWTToken，继承自AuthenticationToken

JWTToken差不多就是Shiro用户名密码的载体。因为我们是前后端分离，服务器无需保存用户状态，所以不需要RememberMe这类功能，我们简单的实现下AuthenticationToken接口即可。

```java
/**
 * 自定义JWTToken,继承AuthenticationToken
 */
public class JWTToken implements AuthenticationToken {
    private String token;
    public JWTToken(String token) {
        this.token = token;
    }
    public JWTToken() {
    }
    @Override
    public Object getPrincipal() {
        return this.token;
    }
    @Override
    public Object getCredentials() {
        return this.token;
    }
}
```

【h】Shiro全局配置类中增加自定义jwtFilter过滤器，用来拦截并处理携带JWT token的请求

```java
package com.wsh.springboot.springbootshiro.config;
import at.pollux.thymeleaf.shiro.dialect.ShiroDialect;
import com.wsh.springboot.springbootshiro.filter.CustomJWTFilter;
import com.wsh.springboot.springbootshiro.listener.CustomShiroSessionListener;
import com.wsh.springboot.springbootshiro.properties.JWTProperties;
import com.wsh.springboot.springbootshiro.realm.MyShiroRealm;
import org.apache.shiro.codec.Base64;
import org.apache.shiro.mgt.DefaultSessionStorageEvaluator;
import org.apache.shiro.mgt.DefaultSubjectDAO;
import org.apache.shiro.session.SessionListener;
import org.apache.shiro.session.mgt.SessionManager;
import org.apache.shiro.session.mgt.eis.SessionDAO;
import org.apache.shiro.spring.security.interceptor.AuthorizationAttributeSourceAdvisor;
import org.apache.shiro.spring.web.ShiroFilterFactoryBean;
import org.apache.shiro.web.mgt.CookieRememberMeManager;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.apache.shiro.web.servlet.SimpleCookie;
import org.apache.shiro.web.session.mgt.DefaultWebSessionManager;
import org.crazycake.shiro.RedisCacheManager;
import org.crazycake.shiro.RedisManager;
import org.crazycake.shiro.RedisSessionDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.DelegatingFilterProxy;
import javax.servlet.Filter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
/**
 * @Description: Shiro全局配置类
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @Date: 2022/11/3 09:23
 * <p>
 * 三大组件:
 * 1. Subject： 用户主体（把操作交给SecurityManager）
 * 2. SecurityManager：安全管理器（关联Realm）
 * 3. Realm：Shiro连接数据的桥梁
 */
@Configuration
public class ShiroConfiguration {
    @Autowired
    private JWTProperties jwtProperties;
    /**
     * 将Realm注册到securityManager中
     *
     * @return
     */
    @Bean("securityManager")
    public DefaultWebSecurityManager securityManager() {
        DefaultWebSecurityManager defaultWebSecurityManager = new DefaultWebSecurityManager();
        defaultWebSecurityManager.setRealm(myShiroRealm());
        //将cookie管理器交给SecurityManager进行管理
        defaultWebSecurityManager.setRememberMeManager(rememberMeManager());
        //设置Redis缓存管理器
        defaultWebSecurityManager.setCacheManager(redisCacheManager());
        /*
         * 关闭shiro自带的session
         */
        DefaultSubjectDAO subjectDAO = new DefaultSubjectDAO();
        DefaultSessionStorageEvaluator defaultSessionStorageEvaluator = new DefaultSessionStorageEvaluator();
        defaultSessionStorageEvaluator.setSessionStorageEnabled(false);
        subjectDAO.setSessionStorageEvaluator(defaultSessionStorageEvaluator);
        defaultWebSecurityManager.setSubjectDAO(subjectDAO);
        return defaultWebSecurityManager;
    }
    /**
     * 配置自定义的Realm
     *
     * @param matcher
     * @return
     */
    @Bean
    public MyShiroRealm myShiroRealm() {
        MyShiroRealm myShiroRealm = new MyShiroRealm();
        //配置密码加密
        return myShiroRealm;
    }
    /**
     * 如果没有此name,将会找不到shiroFilter的Bean
     * <p>
     * Shiro内置过滤器，可以实现权限相关的拦截器
     * 常用的过滤器：
     * anon: 无需认证（登录）可以访问
     * authc: 必须认证才可以访问
     * user: 如果使用rememberMe的功能可以直接访问
     * perms： 该资源必须得到资源权限才可以访问
     * role: 该资源必须得到角色权限才可以访问
     */
    @Bean
    public ShiroFilterFactoryBean shiroFilter(@Qualifier("securityManager") DefaultWebSecurityManager securityManager) {
        ShiroFilterFactoryBean shiroFilterFactoryBean = new ShiroFilterFactoryBean();
        shiroFilterFactoryBean.setSecurityManager(securityManager);
        LinkedHashMap<String, Filter> filtersMap = new LinkedHashMap<>();
        //添加自己的自定义jwt过滤器，并取名为jwt
        filtersMap.put("jwt", new CustomJWTFilter(jwtProperties));
        shiroFilterFactoryBean.setFilters(filtersMap);
        //表示指定登录页面
        shiroFilterFactoryBean.setLoginUrl("/userLogin");
        //登录成功后要跳转的链接
        shiroFilterFactoryBean.setSuccessUrl("/success");
        //未授权页面
        shiroFilterFactoryBean.setUnauthorizedUrl("/unauthorized");
        //拦截器, 配置不会被拦截的链接 顺序判断
        Map<String, String> filterChainDefinitionMap = new LinkedHashMap<>();
        //所有匿名用户均可访问到Controller层的该方法下
        filterChainDefinitionMap.put("/forceLogout", "anon");
        filterChainDefinitionMap.put("/index", "anon");
        filterChainDefinitionMap.put("/userLogin", "anon");
        filterChainDefinitionMap.put("/admin", "roles[admin]");
        filterChainDefinitionMap.put("/user", "roles[user]");
        //user表示配置记住我或认证通过可以访问的地址
        filterChainDefinitionMap.put("/remember", "user");
        filterChainDefinitionMap.put("/logout", "logout");
        //authc:所有url都必须认证通过才可以访问; anon:所有url都都可以匿名访问
//        filterChainDefinitionMap.put("/**", "authc");
        //所有url都必须认证通过jwt过滤器才可以访问
        filterChainDefinitionMap.put("/**", "jwt");
        shiroFilterFactoryBean.setFilterChainDefinitionMap(filterChainDefinitionMap);
        return shiroFilterFactoryBean;
    }
    /**
     * SpringShiroFilter首先注册到spring容器
     * 然后被包装成FilterRegistrationBean
     * 最后通过FilterRegistrationBean注册到servlet容器
     *
     * @return
     */
    @Bean
    public FilterRegistrationBean delegatingFilterProxy() {
        FilterRegistrationBean filterRegistrationBean = new FilterRegistrationBean();
        DelegatingFilterProxy proxy = new DelegatingFilterProxy();
        proxy.setTargetFilterLifecycle(true);
        proxy.setTargetBeanName("shiroFilter");
        filterRegistrationBean.setFilter(proxy);
        return filterRegistrationBean;
    }
    /**
     * 开启Shiro注解配置
     *
     * @param securityManager
     * @return
     */
    @Bean
    public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(@Qualifier("securityManager") DefaultWebSecurityManager securityManager) {
        AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor = new AuthorizationAttributeSourceAdvisor();
        authorizationAttributeSourceAdvisor.setSecurityManager(securityManager);
        return authorizationAttributeSourceAdvisor;
    }
    /**
     * 配置Redis缓存管理器
     */
    @Bean
    public RedisCacheManager redisCacheManager() {
        RedisCacheManager redisCacheManager = new RedisCacheManager();
        //设置redis管理器
        redisCacheManager.setRedisManager(redisManager());
        return redisCacheManager;
    }
//    /**
//     * Ehcache缓存管理器
//     * @return
//     */
//    @Bean
//    @Primary
//    public EhCacheManager ehCacheManager() {
//        EhCacheManager ehCacheManager = new EhCacheManager();
//        ehCacheManager.setCacheManagerConfigFile("classpath:config/shiro-ehcache-config.xml");
//        return ehCacheManager;
//    }
    /**
     * 为了在thymeleaf中使用shiro的自定义tag
     */
    @Bean
    public ShiroDialect shiroDialect() {
        return new ShiroDialect();
    }
    /**
     * 配置redis管理器
     */
    @Bean
    public RedisManager redisManager() {
        RedisManager redisManager = new RedisManager();
        //设置一小时超时，单位是秒
        redisManager.setExpire(3600);
        return redisManager;
    }
}
```

【i】关闭shiro自带的session

因为用了jwt的访问认证，所以要把默认session支持关掉。即不保存用户登录状态，保证每次请求都重新认证。

```java
/*
 * 关闭shiro自带的session
 */
DefaultSubjectDAO subjectDAO = new DefaultSubjectDAO();
DefaultSessionStorageEvaluator defaultSessionStorageEvaluator = new DefaultSessionStorageEvaluator();
defaultSessionStorageEvaluator.setSessionStorageEnabled(false);
subjectDAO.setSessionStorageEvaluator(defaultSessionStorageEvaluator);
defaultWebSecurityManager.setSubjectDAO(subjectDAO);
```

【j】配置自己实现的ShiroRealm

```java
import com.wsh.springboot.springbootshiro.entity.JWTToken;
import com.wsh.springboot.springbootshiro.entity.Permission;
import com.wsh.springboot.springbootshiro.entity.Role;
import com.wsh.springboot.springbootshiro.entity.User;
import com.wsh.springboot.springbootshiro.mapper.PermissionMapper;
import com.wsh.springboot.springbootshiro.mapper.RoleMapper;
import com.wsh.springboot.springbootshiro.mapper.UserMapper;
import com.wsh.springboot.springbootshiro.util.JwtUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
public class MyShiroRealm extends AuthorizingRealm {
    private static final Logger logger = LoggerFactory.getLogger(MyShiroRealm.class);
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private RoleMapper roleMapper;
    @Autowired
    private PermissionMapper permissionMapper;
    @Autowired
    private JwtUtils jwtUtils;
    /**
     * 支持自定义认证令牌
     * 必须重写此方法，不然Shiro会报错
     * 限定这个 Realm 只处理我们自定义的 JwtToken
     */
    @Override
    public boolean supports(AuthenticationToken token) {
        return token instanceof JWTToken;
    }
    /**
     * 默认使用此方法进行用户名正确与否验证，错误抛出异常即可
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
        logger.info("MyShiroRealm ---> doGetAuthenticationInfo()认证.....");
        // 这里的 token是从 CutomJWTFilter 的 executeLogin 方法传递过来的
        String token = (String) authenticationToken.getCredentials();
        String username;
        try {
            username = jwtUtils.parseJWToken(token).getSubject();
        } catch (Exception e) {
            //抛出token认证失败
            throw new AuthenticationException("doGetAuthenticationInfo--->token认证失败");
        }
        // 通过用户名到数据库查询用户信息
        User user = userMapper.findUserByName(username);
        if (user == null) {
            throw new UnknownAccountException("用户不存在！");
        }
        return new SimpleAuthenticationInfo(user.getUsername(), token, getName());
    }
    /**
     * 授权相关方法
     *
     * @param principalCollection
     * @return
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principalCollection) {
        logger.info("MyShiroRealm ---> doGetAuthorizationInfo()授权.....");
        //1.获取用户名
        String username = (String) principalCollection.getPrimaryPrincipal();
        logger.info("username:" + username);
        //返回AuthorizationInfo授权类的子类
        SimpleAuthorizationInfo simpleAuthorizationInfo = new SimpleAuthorizationInfo();
        //2.根据用户名查询用户所有的角色信息
        List<Role> allRoleList = roleMapper.getAllRoleListByUsername(username);
        Set<String> rolesSet = new HashSet<>();
        for (Role r : allRoleList) {
            String roleName = r.getName();
            rolesSet.add(roleName);
        }
        logger.info("用户：{} 拥有的角色有：{}", username, rolesSet);
        //设置用户角色信息
        simpleAuthorizationInfo.setRoles(rolesSet);
        //3.根据用户名查询用户所有的权限信息
        List<Permission> allPermissionList = permissionMapper.getAllPermissionListByUsername(username);
        Set<String> permissionSet = new HashSet<>();
        for (Permission permission : allPermissionList) {
            String permissionName = permission.getName();
            permissionSet.add(permissionName);
        }
        simpleAuthorizationInfo.setStringPermissions(permissionSet);
        logger.info("用户：{} 拥有的权限有：{}", username, permissionSet);
        return simpleAuthorizationInfo;
    }
}
```

【k】修改登录接口，登录成功发放jwt token

```java
@RequestMapping(value = "/userLogin", method = RequestMethod.POST)
@ResponseBody
public CustomResultSet toLogin(String username, String password) {
    // 密码加密
    String md5Password = new SimpleHash("MD5", password, username, 1024).toString();
    User user = userMapper.findUserByName(username);
    if (user != null && md5Password.equals(user.getPassword())) {
        String jwtToken = jwtUtils.createJWTToken(user.getId(), user.getUsername());
        //这里只是简单的返回到前台，实际项目中这里可以将签发的JWT token设置到 HttpServletResponse 的Header中
        //((HttpServletResponse) response).setHeader(JwtUtils.AUTH_HEADER, jwtToken);
        return new CustomResultSet("200", "获取token成功", jwtToken);
    }
    return new CustomResultSet("500", "用户不存在或者密码错误", null);
}
```

【l】新建一个测试jwt的controller方法

```java
@RequestMapping("/jwtTest")
@ResponseBody
@RequiresPermissions("admin:list")
public String jwtTest() {
    return "测试shiro整合jwt......";
}
```

【m】测试启动项目，使用admin/123456进行登录，登录之后，可以看到返回的结果信息中包含有access_token。

```java
{"code":"200","msg":"获取token成功","data":"eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxIiwic3ViIjoiYWRtaW4iLCJpYXQiOjE2MDQ4MzkwMzAsImV4cCI6MTYwNDg0MjYzMH0.Ld4T92poGelbnS6GTWSCY2JGvFVlQWCsy1NPgOnfln8"}
```

这里我们我们选用postman进行请求测试，分为如下三种情况进行测试：

- (1)、不带access_token

可以看到，当我们请求中没有携带token，后台返回的错误信息如下：

```java
{
    "code": "500",
    "msg": "token为空",
    "data": null
}
```

- (2)、带上错误的access_token

可见，当我们携带的token是无效时，后台返回的错误信息如下：

```java
{
    "code": "500",
    "msg": "executeLogin--->token认证失败",
    "data": null
}
```

- (3)、带上正确的access_token

可见，当我们携带登录接口返回的正确的token是，请求正常返回数据。

至此，我们简单实现了Shiro整合JWT实现认证功能。

## 三、总结

本文主要总结了Shiro如何整合JWT来实现用户认证功能，当然仅仅是简单实现，还有很多需要优化的地方：

- 暂时还没实现动态刷新access_token功能；
- access_token缓存问题；
- ...

由于笔者水平有限，文中难免存在没有考虑到的地方，还望大家指点，相互学习，一起进步！
