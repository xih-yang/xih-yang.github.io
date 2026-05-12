# 17、Spring Security 入门 - Spring Security 中 CSRF
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/17.html
- 分类：安全框架
- 分组：教程目录
从刚开始说明 Spring Security 时，在配置类中一直存在这样一行代码：http.csrf().disable();如果没有这行代码导致用户无法被认证。这行代码的含义是：关闭 csrf 防护

### 1.什么是 CSRF

CSRF（Cross-site request forgery）跨站请求伪造，也被称为“OneClick Attack” 或者 Session Riding。通过伪造用户请求访问受信任站点的非法请求访问。

跨域：只要网络协议，ip 地址，端口中任何一个不相同就是跨域请求。

客户端与服务进行交互时，由于 http 协议本身是无状态协议，所以引入了 cookie 进行记录客户端身份。在 cookie 中会存放 session id 用来识别客户端身份的。在跨域的情况下，session id 可能被第三方恶意劫持，通过这个 session id 向服务端发起请求时，服务端会认为这个请求是合法的，可能发生很多意想不到的事情

### 2.Spring Security 中 CSRF

从 Spring Security4 开始 CSRF 防护默认开启。默认会拦截请求。进行 CSRF 处理。CSRF 为了保证不是其他第三方网站访问，要求访问时携带参数名为_csrf 值为 token(token 在服务端产生)的内容，如果 token 和服务端的 token 匹配成功，则正常访问。

#### 2.1 实现步骤

##### 2.1.1 编写控制器方法

编写控制器方法，跳转到 templates 中 login.html 页面

```java
@GetMapping("/showLogin")
public String showLogin() {
	return "login";
}
```

##### 2.1.2 新建 login.html

在项目 resources 下新建 templates 文件夹，并在文件夹中新建 login.html 页面。红色部分是必须存在的否则无法正常登录。

```xml
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" 
	xmlns:th="http://www.thymeleaf.org">
<head>
	<meta charset="UTF-8">
	<title>Title</title>
</head>
<body>
<form action = "/login" method="post">
	<input type="hidden" th:value="${_csrf.token}" name="_csrf" th:if="${_csrf}"/>
	用户名：<input type="text" name="username"/><br/>
	密码:<input type="password" name="password"/><br/>
	<input type="submit" value="登录"/>
</form>
</body>
</html>
```

##### 2.1.3 修改配置类

在配置类中注释掉 CSRF 防护失效

```java
//关闭 csrf 防护
//http.csrf().disable();
```
