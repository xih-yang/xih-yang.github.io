# 15、Spring Security 入门 - Thymeleaf 中 Spring Security 的使用
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/15.html
- 分类：安全框架
- 分组：教程目录
Spring Security 可以在一些视图技术中进行控制显示效果。例如： JSP 或 Thymeleaf。在非前后端分离且使用 Spring Boot 的项目中多使用 Thymeleaf 作为视图展示技术

Thymeleaf 对 Spring Security 的支持都放在 thymeleaf-extras-springsecurityX 中，目前最新版本为 5。所以需要在项目中添加此 jar 包的依赖和 thymeleaf 的依赖

```xml
<dependency>
	<groupId>org.thymeleaf.extras</groupId>
	<artifactId>thymeleaf-extras-springsecurity5</artifactId>
</dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

在 html 页面中引入 thymeleaf 命名空间和 security 命名空间

```xml
<html xmlns="http://www.w3.org/1999/xhtml" 
	xmlns:th="http://www.thymeleaf.org" 
	xmlns:sec="http://www.thymeleaf.org/thymeleaf-extras-springsecurity5">
```

### 1.获取属性

可以在 html 页面中通过 sec:authentication="" 获取 UsernamePasswordAuthenticationToken 中所有 getXXX 的内容，包含父类中的 getXXX 的内容。

**根据源码得出下面属性：**

name：登录账号名称

principal：登录主体，在自定义登录逻辑中是 UserDetails

credentials：凭证

authorities：权限和角色

details：实际上是 WebAuthenticationDetails 的实例。可以获取 remoteAddress(客户端 ip)和 sessionId(当前 sessionId)

#### 1.1 实现步骤

##### 1.1.1 新建 demo.html

在项目 resources 中新建 templates 文件夹，在 templates 中新建 demo.html 页面

##### 1.1.2 编写 demo.html

在 demo.html 中编写下面内容，测试获取到的值

```xml
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
	xmlns:th="http://www.thymeleaf.org"
	xmlns:sec="http://www.thymeleaf.org/thymeleaf-extras-springsecurity5">
<head>
	<meta charset="UTF-8">
	<title>Title</title>
</head>
<body>
	登录账号:<span sec:authentication="name">123</span><br/>
	登录账号:<span sec:authentication="principal.username">456</span><br/>
	凭证：<span sec:authentication="credentials">456</span><br/>
	权限和角色：<span sec:authentication="authorities">456</span><br/>
	客户端地址：<span sec:authentication="details.remoteAddress">456</span><br/>
	sessionId：<span sec:authentication="details.sessionId">456</span><br/>
</body>
</html>
```

##### 1.1.3 编写控制器

thymeleaf 页面需要控制转发，在控制器类中编写下面方法

```java
@RequestMapping("/demo")
public String demo(){
	return "demo";
}
```

### 2.权限判断

在 html 页面中可以使用 sec:authorize=”表达式”进行权限控制，判断是否显示某些内容。表达式的内容和 access(表达式)的用法相同。如果用户具有指定的权限，则显示对应的内容；如果表达式不成立，则不显示对应的元素

#### 2.1 不同权限的用户显示不同的按钮

##### 2.1.1 设置用户角色和权限

设置用户角色和权限

```java
return new User(username,password, AuthorityUtils.commaSeparatedStringToAuthorityList("admin,ROLE_abc,/insert,/delete"));
```

##### 2.1.2 控制页面显示效果

在页面中根据用户权限和角色判断页面中显示的内容

```java
通过权限判断：
<button sec:authorize="hasAuthority('/insert')">新增</button>
<button sec:authorize="hasAuthority('/delete')">删除</button>
<button sec:authorize="hasAuthority('/update')">修改</button>
<button sec:authorize="hasAuthority('/select')">查看</button>
<br/>
通过角色判断：
<button sec:authorize="hasRole('abc')">新增</button>
<button sec:authorize="hasRole('abc')">删除</button>
<button sec:authorize="hasRole('abc')">修改</button>
<button sec:authorize="hasRole('abc')">查看</button>
```
