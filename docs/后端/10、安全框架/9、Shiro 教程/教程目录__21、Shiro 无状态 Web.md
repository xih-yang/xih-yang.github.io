# 21、Shiro 无状态 Web
- 来源：https://ddkk.com/zhuanlan/security/shiro/1/21.html
- 分类：安全框架
- 分组：教程目录
## 无状态 Web 应用集成

在一些环境中，可能需要把 Web 应用做成无状态的，即服务器端无状态，就是说服务器端不会存储像会话这种东西，而是每次请求时带上相应的用户名进行登录。如一些 REST 风格的 API，如果不使用 OAuth2 协议，就可以使用如 REST+HMAC 认证进行访问。HMAC（Hash-based Message Authentication Code）：基于散列的消息认证码，使用一个密钥和一个消息作为输入，生成它们的消息摘要。注意该密钥只有客户端和服务端知道，其他第三方是不知道的。访问时使用该消息摘要进行传播，服务端然后对该消息摘要进行验证。如果只传递用户名 + 密码的消息摘要，一旦被别人捕获可能会重复使用该摘要进行认证。解决办法如：

**1、** 每次客户端申请一个Token，然后使用该Token进行加密，而该Token是一次性的，即只能用一次；有点类似于OAuth2的Token机制，但是简单些；

**2、** 客户端每次生成一个唯一的Token，然后使用该Token加密，这样服务器端记录下这些Token，如果之前用过就认为是非法请求；

为了简单，本文直接对请求的数据（即全部请求的参数）生成消息摘要，即无法篡改数据，但是可能被别人窃取而能多次调用。解决办法如上所示。

## 服务器端

对于服务器端，不生成会话，而是每次请求时带上用户身份进行认证。

### 服务控制器

```java
@RestController
public class ServiceController {
    @RequestMapping("/hello")
    public String hello1(String[] param1, String param2) {
        return "hello" + param1[0] + param1[1] + param2;
    }
} 
```

当访问/ hello 服务时，需要传入 param1、param2 两个请求参数。

### 加密工具类

com.github.zhangkaitao.shiro.chapter20.codec.HmacSHA256Utils：

```java
//使用指定的密码对内容生成消息摘要（散列值）
public static String digest(String key, String content);
//使用指定的密码对整个Map的内容生成消息摘要（散列值）
public static String digest(String key, Map<String, ?> map) 
```

对Map 生成消息摘要主要用于对客户端 / 服务器端来回传递的参数生成消息摘要。

### Subject 工厂

```java
public class StatelessDefaultSubjectFactory extends DefaultWebSubjectFactory {
    public Subject createSubject(SubjectContext context) {
        //不创建session
        context.setSessionCreationEnabled(false);
        return super.createSubject(context);
    }
} 
```

通过调用 context.setSessionCreationEnabled(false) 表示不创建会话；如果之后调用 Subject.getSession() 将抛出 DisabledSessionException 异常。

### StatelessAuthcFilter

类似于FormAuthenticationFilter，但是根据当前请求上下文信息每次请求时都要登录的认证过滤器。

```java
public class StatelessAuthcFilter extends AccessControlFilter {
  protected boolean isAccessAllowed(ServletRequest request, ServletResponse response, Object mappedValue) throws Exception {
      return false;
  }
  protected boolean onAccessDenied(ServletRequest request, ServletResponse response) throws Exception {
    //1、客户端生成的消息摘要
    String clientDigest = request.getParameter(Constants.PARAM_DIGEST);
    //2、客户端传入的用户身份
String username = request.getParameter(Constants.PARAM_USERNAME);
    //3、客户端请求的参数列表
    Map<String, String[]> params = 
      new HashMap<String, String[]>(request.getParameterMap());
    params.remove(Constants.PARAM_DIGEST);
    //4、生成无状态Token
    StatelessToken token = new StatelessToken(username, params, clientDigest);
    try {
      //5、委托给Realm进行登录
      getSubject(request, response).login(token);
    } catch (Exception e) {
      e.printStackTrace();
      onLoginFail(response); //6、登录失败
      return false;
    }
    return true;
  }
  //登录失败时默认返回401状态码
  private void onLoginFail(ServletResponse response) throws IOException {
    HttpServletResponse httpResponse = (HttpServletResponse) response;
    httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    httpResponse.getWriter().write("login error");
  }
}
 
```

获取客户端传入的用户名、请求参数、消息摘要，生成 StatelessToken；然后交给相应的 Realm 进行认证。

### StatelessToken

```java
public class StatelessToken implements AuthenticationToken {
    private String username;
    private Map<String, ?> params;
    private String clientDigest;
    //省略部分代码
    public Object getPrincipal() {  return username;}
    public Object getCredentials() {  return clientDigest;}
} 
```

用户身份即用户名；凭证即客户端传入的消息摘要。

### StatelessRealm

用于认证的 Realm。

```java
public class StatelessRealm extends AuthorizingRealm {
    public boolean supports(AuthenticationToken token) {
        //仅支持StatelessToken类型的Token
        return token instanceof StatelessToken;
    }
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        //根据用户名查找角色，请根据需求实现
        String username = (String) principals.getPrimaryPrincipal();
        SimpleAuthorizationInfo authorizationInfo =  new SimpleAuthorizationInfo();
        authorizationInfo.addRole("admin");
        return authorizationInfo;
    }
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
        StatelessToken statelessToken = (StatelessToken) token;
        String username = statelessToken.getUsername();
        String key = getKey(username);//根据用户名获取密钥（和客户端的一样）
        //在服务器端生成客户端参数消息摘要
        String serverDigest = HmacSHA256Utils.digest(key, statelessToken.getParams());
        //然后进行客户端消息摘要和服务器端消息摘要的匹配
        return new SimpleAuthenticationInfo(
                username,
                serverDigest,
                getName());
    }
    private String getKey(String username) {//得到密钥，此处硬编码一个
        if("admin".equals(username)) {
            return "dadadswdewq2ewdwqdwadsadasd";
        }
        return null;
    }
} 
```

此处首先根据客户端传入的用户名获取相应的密钥，然后使用密钥对请求参数生成服务器端的消息摘要；然后与客户端的消息摘要进行匹配；如果匹配说明是合法客户端传入的；否则是非法的。这种方式是有漏洞的，一旦别人获取到该请求，可以重复请求；可以考虑之前介绍的解决方案。

### Spring 配置——spring-config-shiro.xml

```java
<!-- Realm实现 -->
<bean id="statelessRealm" 
  class="com.github.zhangkaitao.shiro.chapter20.realm.StatelessRealm">
    <property name="cachingEnabled" value="false"/>
</bean>
<!-- Subject工厂 -->
<bean id="subjectFactory" 
 class="com.github.zhangkaitao.shiro.chapter20.mgt.StatelessDefaultSubjectFactory"/>
<!-- 会话管理器 -->
<bean id="sessionManager" class="org.apache.shiro.session.mgt.DefaultSessionManager">
    <property name="sessionValidationSchedulerEnabled" value="false"/>
</bean>
<!-- 安全管理器 -->
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
    <property name="realm" ref="statelessRealm"/>
    <property name="subjectDAO.sessionStorageEvaluator.sessionStorageEnabled"
      value="false"/>
    <property name="subjectFactory" ref="subjectFactory"/>
    <property name="sessionManager" ref="sessionManager"/>
</bean>
<!-- 相当于调用SecurityUtils.setSecurityManager(securityManager) -->
<bean class="org.springframework.beans.factory.config.MethodInvokingFactoryBean">
    <property name="staticMethod" 
      value="org.apache.shiro.SecurityUtils.setSecurityManager"/>
    <property name="arguments" ref="securityManager"/>
</bean> 
```

sessionManager 通过 sessionValidationSchedulerEnabled 禁用掉会话调度器，因为我们禁用掉了会话，所以没必要再定期过期会话了。

```java
<bean id="statelessAuthcFilter" 
    class="com.github.zhangkaitao.shiro.chapter20.filter.StatelessAuthcFilter"/> 
```

每次请求进行认证的拦截器。

```java
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <property name="filters">
        <util:map>
            <entry key="statelessAuthc" value-ref="statelessAuthcFilter"/>
        </util:map>
    </property>
    <property name="filterChainDefinitions">
        <value>
            /**=statelessAuthc
        </value>
    </property>
</bean> 
```

所有请求都将走 statelessAuthc 拦截器进行认证。

其他配置请参考源代码。

SpringMVC 学习请参考：

5分钟构建 spring web mvc REST 风格 HelloWorld

[http://jinnianshilongnian.iteye.com/blog/1996071](http://jinnianshilongnian.iteye.com/blog/1996071)

跟我学SpringMVC

[http://www.iteye.com/blogs/subjects/kaitao-springmvc](http://www.iteye.com/blogs/subjects/kaitao-springmvc)

## 客户端

此处使用 SpringMVC 提供的 RestTemplate 进行测试。请参考如下文章进行学习：

Spring MVC 测试框架详解——客户端测试

[http://jinnianshilongnian.iteye.com/blog/2007180](http://jinnianshilongnian.iteye.com/blog/2007180)

Spring MVC 测试框架详解——服务端测试

[http://jinnianshilongnian.iteye.com/blog/2004660](http://jinnianshilongnian.iteye.com/blog/2004660)

此处为了方便，使用内嵌 jetty 服务器启动服务端：

```java
public class ClientTest {
    private static Server server;
    private RestTemplate restTemplate = new RestTemplate();
    @BeforeClass
    public static void beforeClass() throws Exception {
        //创建一个server
        server = new Server(8080);
        WebAppContext context = new WebAppContext();
        String webapp = "shiro-example-chapter20/src/main/webapp";
        context.setDescriptor(webapp + "/WEB-INF/web.xml");  //指定web.xml配置文件
        context.setResourceBase(webapp);  //指定webapp目录
        context.setContextPath("/");
        context.setParentLoaderPriority(true);
        server.setHandler(context);
        server.start();
    }
    @AfterClass
    public static void afterClass() throws Exception {
        server.stop(); //当测试结束时停止服务器
    }
} 
```

在整个测试开始之前开启服务器，整个测试结束时关闭服务器。

**测试成功情况**

```java
@Test
public void testServiceHelloSuccess() {
    String username = "admin";
    String param11 = "param11";
    String param12 = "param12";
    String param2 = "param2";
    String key = "dadadswdewq2ewdwqdwadsadasd";
    MultiValueMap<String, String> params = new LinkedMultiValueMap<String, String>();
    params.add(Constants.PARAM_USERNAME, username);
    params.add("param1", param11);
    params.add("param1", param12);
    params.add("param2", param2);
    params.add(Constants.PARAM_DIGEST, HmacSHA256Utils.digest(key, params));
    String url = UriComponentsBuilder
            .fromHttpUrl("http://localhost:8080/hello")
            .queryParams(params).build().toUriString();
     ResponseEntity responseEntity = restTemplate.getForEntity(url, String.class);
    Assert.assertEquals("hello" + param11 + param12 + param2, responseEntity.getBody());
} 
```

对请求参数生成消息摘要后带到参数中传递给服务器端，服务器端验证通过后访问相应服务，然后返回数据。

**测试失败情况**

```java
@Test
public void testServiceHelloFail() {
    String username = "admin";
    String param11 = "param11";
    String param12 = "param12";
    String param2 = "param2";
    String key = "dadadswdewq2ewdwqdwadsadasd";
    MultiValueMap<String, String> params = new LinkedMultiValueMap<String, String>();
    params.add(Constants.PARAM_USERNAME, username);
    params.add("param1", param11);
    params.add("param1", param12);
    params.add("param2", param2);
    params.add(Constants.PARAM_DIGEST, HmacSHA256Utils.digest(key, params));
    params.set("param2", param2 + "1");
    String url = UriComponentsBuilder
            .fromHttpUrl("http://localhost:8080/hello")
            .queryParams(params).build().toUriString();
    try {
        ResponseEntity responseEntity = restTemplate.getForEntity(url, String.class);
    } catch (HttpClientErrorException e) {
        Assert.assertEquals(HttpStatus.UNAUTHORIZED, e.getStatusCode());
        Assert.assertEquals("login error", e.getResponseBodyAsString());
    }
} 
```

在生成请求参数消息摘要后，篡改了参数内容，服务器端接收后进行重新生成消息摘要发现不一样，报 401 错误状态码。

到此，整个测试完成了，需要注意的是，为了安全性，请考虑本文开始介绍的相应解决方案。

**SpringMVC 相关知识请参考**

5分钟构建 spring web mvc REST 风格 HelloWorld

[http://jinnianshilongnian.iteye.com/blog/1996071](http://jinnianshilongnian.iteye.com/blog/1996071)

跟我学SpringMVC

[http://www.iteye.com/blogs/subjects/kaitao-springmvc](http://www.iteye.com/blogs/subjects/kaitao-springmvc)

Spring MVC 测试框架详解——客户端测试

[http://jinnianshilongnian.iteye.com/blog/2007180](http://jinnianshilongnian.iteye.com/blog/2007180)

Spring MVC 测试框架详解——服务端测试

[http://jinnianshilongnian.iteye.com/blog/2004660](http://jinnianshilongnian.iteye.com/blog/2004660)
