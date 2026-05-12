# 16、Shiro 实战：Shiro标签
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/16.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。前面我们剖析了Shiro的授权流程，并且编写了授权的小实例。下面我们来探讨一下Shiro的标签。

Shiro提供了JSTL标签用于在JSP页面进行权限控制，如根据登录用户显示相应的页面按钮。

Shiro提供的标签有如下几种：

(1)**guest标签**：用户没有身份验证时显示相应信息，即游客访问信息。

例如：

```xml
<shiro:guest>
    欢迎游客访问，<a href="login.jsp">登录</a>
</shiro:guest>
```

(2)**user标签**：用户已经经过“认证/记住我”登录后显示相应的信息。

例如：

```xml
<shiro:user>
    欢迎[<shiro:principal/>]登录，<a href="logout">注销</a>
</shiro:user>
```

(3)**authenticated标签**：用户已经身份验证通过，即Subject.login，不是“记住我”登录的。

例如：

```xml
<shiro:authenticated>
    用户[<shiro:principal/>]身份验证已经通过
</shiro:authenticated>
```

(4)**notAuthenticated标签**：用户未进行身份验证，即没有调用Subject.login进行登录，包括

“记住我”自动登录的也属于为进行身份验证。

例如：

```xml
<shiro:notAuthenticated>
    未进行身份验证(包括记住我)
</shiro:notAuthenticated>
```

(5)**principal标签**：显示用户身份信息。默认调用Subject.getPrincipal()获取，即Primary Principal。

例如：

```xml
<shiro:principal property="username"/>
```

这个principal就是在Realm最后返回的AuthenticationInfo对象中封装的principal对象，在前面的实例中，我们封装的是用户账号(username)信息：

开发人员可以根据需要，封装一些用户的其它信息为principal，例如封装User对象为principal，这样就可以在页面中使用principal标签获取用户的一些常用信息了。

(6)**hasRole标签**：如果当前Subject有角色将显示body体内容。

例如：

```xml
<shiro:hasRole name="admin"/>
    用户[<shiro:principal/>]拥有角色admin<br/>
</shiro:hasRole>
```

(7)**hasAnyRoles标签**：如果当前Subject有任意一个角色（或的关系）将显示body内容。

例如：

```xml
<shiro:hasAnyRoles name="admin,user">
    用户[<shiro:principal/>]拥有角色admin或user<br/>
</shiro:hasAnyRoles>
```

(8)**lacksRole**：如果当前Subject没有角色将显示body体内容。

例如：

```xml
<shiro:lacksRole name="admin"/>
    用户[<shiro:principal/>]没有角色admin<br/>
</shiro:lacksRole>
```

(9)**hasPermission**：如果当前Subject有权限将显示body体内容。

例如：

```xml
<shiro:hasPermission name="user:create"/>
    用户[<shiro:principal/>]拥有权限user:create<br/>
</shiro:hasPermission>
```

(8)**lacksPermission**：如果当前Subject没有权限将显示body体内容。

例如：

```xml
<shiro:lacksPermission name="org:create"/>
    用户[<shiro:principal/>]没有权限org:create<br/>
</shiro:lacksPermission>
```

下面我们来演示几个标签。

首先找到之前名为Shiro3的Web工程下的list.jsp页面：

```xml
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>首页</title>
  </head>
  <body>
     登录成功！欢迎<shiro:principal/>访问首页O(∩_∩)O
   <a href="userAuth/logout">登出</a>
   <br/><br/>
   <a href="admin.jsp">Admin Page</a>
   <br/><br/>
   <a href="User.jsp">User Page</a>
  </body>
</html>
```

在其中的“<%@ page ...”下放置shiro标签库：

```xml
<%@ taglib prefix="shiro" uri="http://shiro.apache.org/tags" %>
```

然后编写一些标签，显示一些信息：

```xml
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%@ taglib prefix="shiro" uri="http://shiro.apache.org/tags" %>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>首页</title>
  </head>
  <body>
     登录成功！欢迎访问首页O(∩_∩)O
   <a href="userAuth/logout">登出</a>
   <shiro:hasRole name="admin">
   <br/><br/>
   <a href="admin.jsp">Admin Page</a>
   </shiro:hasRole>
   <shiro:hasRole name="user">
   <br/><br/>
   <a href="User.jsp">User Page</a>
   </shiro:hasRole>
  </body>
</html>
```

在上面的页面中，首先欢迎信息中使用“[shiro:principal/](shiro:principal/)”显示用户名信息。而在下面，使用“hasRole”标签，如果用户有“admin”角色，则显示“Admin Page”的超链接，如果用户有“user”角色，则显示“User Page”的超链接。

下面验证一下结果，首先使用普通用户“jack”登录测试系统：

进入首页后，因为jack只有“user”角色，所以可以看到只显示了“User Page”的超链接。

而下面使用administrator用户登录测试系统：

进入首页后，因为administrator有“user”和“admin”角色，所以两个都能看到：

以上就是Shiro提供的页面标签。
