# 11、Shiro 入门：集成SSM框架
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/30.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (B)
**1、** 配置web.xml；

```xml
<!-- Shiro框架入口 -->
<filter>
    <filter-name>shiroFilter</filter-name>
    <filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
    <init-param>
        <param-name>targetFilterLifecycle</param-name>
        <param-value>true</param-value>
    </init-param>
</filter>
<filter-mapping>
    <filter-name>shiroFilter</filter-name>
    <url-pattern>/actions/*</url-pattern>
</filter-mapping>
```

**2、** 配置shiro.xml；

```xml
<!-- 这个bean的id与web.xml中shiro相关配置保持一致 -->
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <!-- 没认证后重定向的位置 -->
    <property name="loginUrl" value="/login.jsp"/>
    <!-- 登录成功跳转的位置 -->
    <property name="successUrl" value="/home.jsp"/>
    <!-- 没有权限跳转的位置 -->
    <property name="unauthorizedUrl" value="/unauthorized.jsp"/>
    <!-- 拦截请求-->
    <property name="filterChainDefinitions">
        <value>
            <!-- 登录请求不拦截 -->
            /actions/security/login = anon
            <!-- 访问admin相关的请求，需要认证，
                 且经过自定义拦截器permissionFilter，最后还需要coder权限-->
            /actions/admin/** = authc,permissionFilter,roles[coder]
            /actions/logout = logout
            /actions/** = authc
        </value>
    </property>
    <!-- 用户自定义的过滤器 -->
    <property name="filters">
        <map>
            <entry key="permissionFilter" value-ref="userAccessControlFilter"/>
            <!--<entry key="logout" value-ref="logoutFilter"/>-->
        </map>
    </property>
</bean>
```

**3、** spring的配置文件中引入shiro.xml；

```xml
<!-- 导入shiro的配置文件 -->
<import resource="shiro.xml"/>
```

**4、** 自定义Realm和自定义拦截器；

```java
public class UserRealm extends AuthorizingRealm {
    @Autowired
    private UserService userService;
    /**
     * 强制重写的认证方法
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token)
            throws AuthenticationException {
        //还记得吗，token封装了客户端的帐号密码，由Subject拉客并最终带到此处
        String clientUsername = (String) token.getPrincipal();
        //从数据库中查询帐号密码
        String passwordFromDB = userService.findPasswordByName(clientUsername);
        if (passwordFromDB == null) {
            //如果根据用户输入的用户名，去数据库中没有查询到相关的密码
            throw new UnknownAccountException();
        }
        /**
         * 返回一个从数据库中查出来的的凭证。用户名为clientUsername，密码为passwordFromDB 。封装成当前返回值
         * 接下来shiro框架做的事情就很简单了。
         * 它会拿你的输入的token与当前返回的这个数据库凭证SimpleAuthenticationInfo对比一下
         * 看看是不是一样，如果用户的帐号密码与数据库中查出来的数据一样，那么本次登录成功
         * 否则就是你密码输入错误
         */
        return new SimpleAuthenticationInfo(clientUsername, passwordFromDB, "UserRealm");
    }
    //授权
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        String yourInputUsername = (String) principals.getPrimaryPrincipal();
        //构造一个授权凭证
        SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();
        //通过你的用户名查询数据库，得到你的权限信息与角色信息。并存放到权限凭证中
        info.addRole(getYourRoleByUsernameFromDB(yourInputUsername));
        info.addStringPermissions(getYourPermissionByUsernameFromDB(yourInputUsername));
        //返回你的权限信息
        return info;
    }
    private String getYourRoleByUsernameFromDB(String username) {
        return "coder";
    }
    private List<String> getYourPermissionByUsernameFromDB(String username) {
        return Arrays.asList("code：insert", "code：update");
    }
}
```

```java
@Component("userAccessControlFilter")
public final class UserAccessControlFilter extends AccessControlFilter {
    private static final Logger LOGGER = LoggerFactory.getLogger(UserAccessControlFilter.class);
    /**
     * 即是否允许访问，返回true表示允许.
     * 如果返回false，则进入本类的onAccessDenied方法中进行处理
     */
    @Override
    protected boolean isAccessAllowed(ServletRequest request, ServletResponse response, Object object)
            throws Exception {
        final Subject subject = SecurityUtils.getSubject();
        //判断用户是否进行过登录认证，如果没经过认证则返回登录页
        if (subject.getPrincipal() == null || !subject.isAuthenticated()) {
            return Boolean.FALSE;
        }
        final String requestURI = this.getPathWithinApplication(request);
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("请求URL为:{}", requestURI);
        }
        final String requestHeader = ((HttpServletRequest) request).getHeader("Referer");
        //防盗链处理
        if (requestHeader == null || "".equals(requestHeader)) {
            return Boolean.FALSE;
        }
        //此处可以编写用于判断用户是否有相关权限的代码
        //subject.hasRole("需要的角色");
        //subject.isPermitted("需要的权限");
        return Boolean.TRUE;
    }
    /**
     * 如果返回true，则继续执行其它拦截器
     * 如果返回false，则表示拦截住本次请求，且在代码中规定处理方法为重定向到登录页面
     */
    @Override
    protected boolean onAccessDenied(ServletRequest servletRequest, ServletResponse servletResponse)
            throws Exception {
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("当前帐号没有相应的权限!");
        }
        //重定向到登录页面
        this.redirectToLogin(servletRequest, servletResponse);
        return Boolean.FALSE;
    }
}
```

**5、** login.jsp和Controller；

```xml
<form action="<c:url value="/actions/security/login"/>" method="post">
    用户名<input type="text" name="username"><br>
    密码<input type="password" name="password"><br>
    <input type="submit" value="提交">
</form>
```

```java
@RequestMapping(value = "security/login", method = {RequestMethod.POST})
public String login(@RequestParam("username") String userName, @RequestParam("password") String password) {
    //获取到Subject门面对象
    Subject subject = getSubject();
    try {
        //将用户数据交给Shiro框架去做
        //你可以在自定义Realm中的认证方法doGetAuthenticationInfo()处打个断点
        subject.login(new UsernamePasswordToken(userName, password));
    } catch (AuthenticationException exception) {
        if (!subject.isAuthenticated()) {
            //登录失败
            return "fail";
        }
    }
    //登录成功
    return "home";
}
@RequestMapping(value = "admin")
public String enterAdmin() {
    //跳转到 web-inf/pages/admin.jsp页面
    return "admin";
}
```

**6、** indexjsp；

```xml
<a href="<c:url value="/actions/obtainAllUsers"/> ">测试超链接</a><br>
<a href="<c:url value="/actions/admin"/> ">进入管理员页面</a><br>
<a href="<c:url value="/actions/logout"/> ">退出</a>
```

登陆成功才能访问其他链接，否则一致都是login

**https://github.com/1017020555/SSM-Shiro.git**
