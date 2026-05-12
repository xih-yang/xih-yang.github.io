# 16、Spring Security 入门 - 退出登录
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/5/16.html
- 分类：安全框架
- 分组：教程目录
用户只需要向 Spring Security 项目中发送/logout 退出请求即可

### 1.退出实现

实现退出非常简单，只要在页面中添加/logout 的超链接即可

```xml
<a href="/logout">退出登录</a>
```

为了实现更好的效果，通常添加退出的配置。默认的退出 url 为 /logout，退出成功后跳转到/login?logout

如果不希望使用默认值，可以通过下面的方法进行修改。

```java
http.logout()
	.logoutUrl("/logout")
	.logoutSuccessUrl("/login.html");
```

### 2.logout 其他常用配置源码解读

#### 2.1 addLogoutHandler(LogoutHandler)

默认是 contextLogoutHandler

默认实例内容

#### 2.2 clearAuthentication(boolean)

是否清除认证状态，默认为 true

#### 2.3 invalidateHttpSession(boolean)

是否销毁 HttpSession 对象，默认为 true

#### 2.4 logoutSuccessHandler(LogoutSuccessHandler)

退出成功处理器。

也可以自己进行定义退出成功处理器。只要实现了 LogoutSuccessHandler 接口。与之前讲解的登录成功处理器和登录失败处理器极其类似。
