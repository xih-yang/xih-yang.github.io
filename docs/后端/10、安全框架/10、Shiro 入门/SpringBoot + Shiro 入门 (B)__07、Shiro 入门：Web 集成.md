# 07、Shiro 入门：Web 集成
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/26.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (B)
简介：

Shiro 提供了与 Web 集成的支持，其通过一个 **ShiroFilter**入口来拦截需要安全控制的 URL，然后进行相应的控制，ShiroFilter 类似于如 Strut2/SpringMVC 这种 web 框架的前端控制器，其是安全控制的入口点，其负责读取配置（如 ini 配置文件），然后判断 URL 是否需要登录 / 权限等工作。

Url匹配方式

?匹配一个字符 /admin? 可以匹配/admin1 或者/admin2 但是不能匹配/admin12 或者/admin

* 匹配零个或者一个或者多个字符 /admin* 可以匹配 /admin 或者/admin1 或者 /admin12 但是不能匹配/admin/abc

** 匹配零个或者多个路径 /admin/** 可以匹配/admin /admin/a 或者/admin/a/b

pom.xml

```xml
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>3.0.1</version>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.9</version>
</dependency>
<dependency>
    <groupId>commons-logging</groupId>
    <artifactId>commons-logging</artifactId>
    <version>1.1.3</version>
</dependency>
<!--     shiro-web   -->
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-web</artifactId>
    <version>1.2.2</version>
</dependency>
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-core</artifactId>
    <version>1.2.2</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

web.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://java.sun.com/xml/ns/javaee"
         xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd"
         id="WebApp_ID" version="2.5">
    <display-name>t</display-name>
    <welcome-file-list>
        <welcome-file>index.html</welcome-file>
        <welcome-file>index.htm</welcome-file>
        <welcome-file>index.jsp</welcome-file>
        <welcome-file>default.html</welcome-file>
        <welcome-file>default.htm</welcome-file>
        <welcome-file>default.jsp</welcome-file>
    </welcome-file-list>
    <listener>
        <listener-class>org.apache.shiro.web.env.EnvironmentLoaderListener</listener-class>
    </listener>
    <context-param>
        <param-name>shiroConfigLocations</param-name>
        <param-value>classpath:shiro-web.ini</param-value>
    </context-param>
    <filter>
        <filter-name>ShiroFilter</filter-name>
        <filter-class>org.apache.shiro.web.servlet.ShiroFilter</filter-class>
    </filter>
    <filter-mapping>
        <filter-name>ShiroFilter</filter-name>
        <url-pattern>/*</url-pattern>
        <dispatcher>REQUEST</dispatcher>
        <dispatcher>FORWARD</dispatcher>
        <dispatcher>INCLUDE</dispatcher>
        <dispatcher>ERROR</dispatcher>
    </filter-mapping>
    <servlet>
        <servlet-name>loginServlet</servlet-name>
        <servlet-class>com.lc.LoginServlet</servlet-class>
    </servlet>
    <servlet-mapping>
        <servlet-name>loginServlet</servlet-name>
        <url-pattern>/login</url-pattern>
    </servlet-mapping>
</web-app>
```

shiro-web.ini

```java
[main]
authc.loginUrl= /login
roles.unauthorizedUrl= /unauthorized.jsp
perms.unauthorizedUrl= /unauthorized.jsp
[users]
admin=123,role1
user1=456
[roles]
role1=admin:*
#如果加入了shiro-web支持，则需要配置urls，否则报错：Caused by: org.apache.shiro.env.RequiredTypeException: 
#Object named 'filterChainResolver' is not of required type [org.apache.shiro.web.filter.mgt.FilterChainResolver].
[urls]
/index.jsp = authc
/ = authc
/admin.jsp = authc,roles[role1]
/login = anon
/logout = logout
```

anon: 无需认证即可访问

authc: 需要认证才可访问

user: 点击“记住我”功能可访问

perms: 拥有权限才可以访问

role: 拥有某个角色权限才能访问

上面的配置文件说明：index,jsp要认证，admin.jsp不仅仅要认证还得有admin角色，/login无需认证谁都能看到

servlet

```java
@WebServlet(name = "loginServlet", urlPatterns = "/login")
public class LoginServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        /**
         * 如果用户没有登录就即没有在index.jsp页面登录就会跳转到这个方法
         */
        request.getRequestDispatcher("/login.jsp").forward(request, response);
    }
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String userName = request.getParameter("username");
        String passWord = request.getParameter("password");
        Subject subject = SecurityUtils.getSubject();
        UsernamePasswordToken token = new UsernamePasswordToken(userName, passWord);
        try {
            subject.login(token);
            System.out.println("登录成功");
            request.getRequestDispatcher("/index.jsp").forward(request, response);
        } catch (UnknownAccountException e) {
            System.out.println("用户名错误");
            response.sendRedirect("/login.jsp");
        } catch (IncorrectCredentialsException e) {
            System.out.println("密码错误");
            response.sendRedirect("/login.jsp");
        }
    }
}
```

- index.jsp

```xml
<body>
        欢迎登陆
</body>
```

- admin.jsp

```xml
<body>
    admin.jsp
</body>
```

- unauthorized.jsp

```xml
<body>
    该用户没有权限访问
</body>
```
