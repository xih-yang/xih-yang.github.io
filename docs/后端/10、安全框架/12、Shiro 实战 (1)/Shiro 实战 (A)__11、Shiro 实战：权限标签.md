# 11、Shiro 实战：权限标签
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/11.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
Shiro 提供了 JSTL 标签用于在 JSP 页面进行权限控制，如根据登录用户显示相应的页面按钮。 需要在JSP 中导入 shiro 的标签库：``

## 一、常用标签

guest 标签：用户没有身份验证时显示相应信息，即游客访问信息。

user 标签：用户已经经过认证或记住我登录后显示相应的信息。

authenticated 标签：用户已经身份验证通过，即 Subject.login登录成功，不是记住我登录的。

notAuthenticated 标签：用户未进行身份验证，即没有调用Subject.login进行登录，包括记住我自动登录的也属于未进行身份验证。

pincipal 标签：显示用户身份信息，默认调用 Subject.getPrincipal() 获取，即 Primary Principal。

hasRole 标签：如果当前 Subject 有角色将显示 body 体的内容。

hasAnyRoles 标签：如果当前Subject有任意一个 角色将显示body体的内容。

lacksRole：如果当前 Subject 没有角色将显示 body 体的内容。

hasPermission：如果当前 Subject 有权限将显示 body 体的内容。

lacksPermission：如果当前Subject没有权限将显示body体的内容。

## 二、使用标签

```xml
<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="ISO-8859-1"%>
<%@ taglib prefix="shiro" uri="http://shiro.apache.org/tags" %>    
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>Insert title here</title>
</head>
<body>
	<h4>List Page</h4>
	Welcome: <shiro:principal></shiro:principal>
	<shiro:hasRole name="admin">
	<br><br>
	<a href="admin.jsp">Admin Page</a>
	</shiro:hasRole>
	<shiro:hasRole name="user">
	<br><br>
	<a href="user.jsp">User Page</a>
	</shiro:hasRole>
	<br><br>
	<a href="shiro/logout">Logout</a>
</body>
</html>
```

## 三、源码解析

**1、**``标签；

（1）、找到``标签，按住Ctrl打开shiro.tld

（2）、处理此标签的类是 org.apache.shiro.web.tags.PrincipalTag

（3）、获取门面对象Subject对象，拿到Subject对象里面的主凭证。主凭证可能是一个对象，比如user对象，将其地址 username 属性作为主凭证，那么可以这样配置：``

（4）、将数据刷新到JSP页面中。

**2、**``标签；

获取到当前Shiro环境的Subject对象，再判断当前登录用户是否有此角色。返回1则页面显示，返回0则页面不显示。

**3、**``标签；
