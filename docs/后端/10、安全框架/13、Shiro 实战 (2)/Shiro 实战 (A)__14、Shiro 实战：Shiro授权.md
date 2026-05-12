# 14、Shiro 实战：Shiro授权
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/14.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。我们之前讲解了Realm认证和认证器策略等知识，下面来讲解Shiro中比较重要的知识：授权。

对于授权，也叫访问控制，即在应用中控制谁访问哪些资源(如访问页面/编辑数据/页面操作等)。

## 一、授权的几个重要概念

在授权中需要了解几个关键对象：主体(Subject)、资源(Resource)、权限(Permission)、角色(Role)。

1、**主体(Subject)**：访问应用的用户，在Shiro中使用Subject代表用户。用户只有授权后才能访问相应的资源。

2、**资源(Resource)**：在应用中用户可以访问的URL，比如访问JSP页面、查看/编辑某些数据，访问某个业务方法，打印文本等等都是资源。用户只有授权后才可以访问。

3、**权限(Permission)**：安全策略中的原子授权单位，通过权限我们可以表示在应用中用户有没有操作某个资源的权利。即权限表示在应用中用户能不能访问某个资源。如：访问用户列表页面查看/新增/修改/删除用户数据(即很多时候都是CRUD(增删改查)式权限控制)等。权限代表了用户有没有操作某个资源的权利，即反应在某个资源上的操作允不允许。Shiro支持粗粒度权限(如用户模块的所有权限)和细粒度权限(操作某个用户的权限，即实例级别的)。

4、**角色(Role)**：权限的集合。一般情况下会赋予用户角色而不是权限，即这样用户可以拥有一组权限，赋予权限时比较方便。典型的如：项目经理、技术总监。CTO、开发工程师等都是角色，不同的角色拥有一组不同的权限。

## 二、Shiro授权方式

Shiro支持三种方式的授权：

(1)编程式：通过写if/else授权代码块完成

```java
if(subject.hasRole("admin")){
    //有权限
}else{
    //无权限
}
```

(2)注解式：通过在执行的Java方法上放置相应的注解完成，没有权限将抛出相应的异常。

```java
@RequiresRoles("admin")
public void hello(){
    //有权限
}
```

(3)JSP/GSP标签：在JSP/GSP页面通过相应的标签完成，如：

```xml
<shiro:hasRole name="admin">
<!--有权限-->
<shiro:hasRole>
```

## 三、Shiro授权使用的拦截器

回顾一下我们之前配置的Shiro测试工程的配置：

```xml
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <property name="loginUrl" value="/login.jsp"/>
    <property name="successUrl" value="/list.jsp"/>
    <property name="unauthorizedUrl" value="/index.jsp"/>
    <!--  
    	配置哪些页面需要受保护. 
    	以及访问这些页面需要的权限. 
    	1). anon 可以被匿名访问
    	2). authc 必须认证(即登录)后才可能访问的页面. 
    	3). logout 登出
    -->
    <property name="filterChainDefinitions">
        <value>
            /login.jsp = anon
            /userAuth/login = anon
            /userAuth/logout = logout
            everything else requires authentication:
            /** = authc
        </value>
    </property>
</bean>
```

可以看到，我们分别用了anon、authc和logout三个过滤器。而在Shiro中，内置了很多默认的拦截器，比如身份验证、授权等相关的。默认拦截器可以参考org.apache.shiro.web.filter.mgt.DefaultFilter中的枚举拦截器：

```java
public enum DefaultFilter {  
    anon(AnonymousFilter.class),  
    authc(FormAuthenticationFilter.class),  
    authcBasic(BasicHttpAuthenticationFilter.class),  
    logout(LogoutFilter.class),  
    noSessionCreation(NoSessionCreationFilter.class),  
    perms(PermissionsAuthorizationFilter.class),  
    port(PortFilter.class),  
    rest(HttpMethodPermissionFilter.class),  
    roles(RolesAuthorizationFilter.class),  
    ssl(SslFilter.class),  
    user(UserFilter.class);  
}   
```

其中分为三类拦截器：

**1、** 身份验证相关的；

**2、** 授权相关的；

在这里，我们实验一下roles拦截器的作用。在我们之前的Shiro3工程下创建一个admin.jsp和一个User.jsp页面：

其中的代码为：

```xml
<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>admin page</title>
  </head>
  <body>
    This is Admin page. <br>
  </body>
</html>
```

和

```xml
<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>user page</title>
  </head>
  <body>
    This is User page. <br>
  </body>
</html>
```

然后在原来的登录成功后看到的list.jsp页面中添加两个超链接：

```xml
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>首页</title>
  </head>
  <body>
     登录成功！欢迎访问首页O(∩_∩)O
   <a href="userAuth/logout">登出</a>
   <br/><br/>
   <a href="admin.jsp">Admin Page</a>
   <br/><br/>
   <a href="User.jsp">User Page</a>
  </body>
</html>
```

当没有权限时跳转的页面是index.jsp:

```xml
<%@ page language="java" import="java.util.*" pageEncoding="utf-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>提示</title>
  </head>
  <body>
    抱歉，没有权限访问该资源！<br>
  </body>
</html>
```

我们的需求就是，admin.jsp页面，只允许有“admin”角色的用户看到。而User.jsp页面，所有user权限用户均可看到。如果没有相关权限，Shiro会自动跳转至shiroFilter配置的unauthorizedUrl路径。

首先我们在applicationContext.xml中的shiroFilter拦截器配置中添加roles拦截：

```xml
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <property name="loginUrl" value="/login.jsp"/>
    <property name="successUrl" value="/list.jsp"/>
    <property name="unauthorizedUrl" value="/index.jsp"/>
    <!--  
    	配置哪些页面需要受保护. 
    	以及访问这些页面需要的权限. 
    	1). anon 可以被匿名访问
    	2). authc 必须认证(即登录)后才可能访问的页面. 
    	3). logout 登出
    	4). roles 角色过滤器
    -->
    <property name="filterChainDefinitions">
        <value>
            /login.jsp = anon
            /userAuth/login = anon
            /userAuth/logout = logout
            /User.jsp = roles[user]
            /admin.jsp = roles[admin]
            everything else requires authentication:
            /** = authc
        </value>
    </property>
</bean>
```

上面为User.jsp和admin.jsp配置了角色拦截器，控制“user”和“admin”角色的人可以访问相关页面。

我们尚且没有给任何用户配置角色，那么当任意一个用户登录时：

分别点击上面的Admin Page以及UserPage，发现都没有权限(跳转我们的unauthorizedUrl指向的jsp)：

证明我们的配置起到了作用。关于如何为用户设置相关的角色，在后面的章节会进行深入学习。

**3、** 其他；

了解了上面的Shiro授权相关知识，就可以为后面的授权流程学习奠定了基础。
