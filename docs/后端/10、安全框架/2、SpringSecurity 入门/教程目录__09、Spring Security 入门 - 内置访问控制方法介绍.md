# 09、Spring Security 入门 - 内置访问控制方法介绍
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/9.html
- 分类：安全框架
- 分组：教程目录
Spring Security 匹配了 URL 后调用了 permitAll()表示不需要认证，随意访问。在 Spring Security 中提供了多种内置控制

### 1.permitAll()

permitAll()表示所匹配的 URL 任何人都允许访问

### 2.authenticated()

authenticated()表示所匹配的 URL 都需要被认证才能访问。

### 3.anonymous()

anonymous()表示可以匿名访问匹配的 URL。和 permitAll()效果类似，只是设置为 anonymous()的 url 会执行 filter 链中

官方源码定义如下：

### 4.denyAll()

denyAll()表示所匹配的 URL 都不允许被访问

### 5.rememberMe()

被“remember me”的用户允许访问

### 6.fullyAuthenticated()

如果用户不是被 remember me 的，才可以访问。
