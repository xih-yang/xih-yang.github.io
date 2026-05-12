# 04、Shiro 速成：SpringBoot+Shiro 实现记住登录状态
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/4.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (A)
## 一、概述

Shiro 提供了记住我（RememberMe）的功能，比如访问如淘宝等一些网站时，关闭了浏览器下次再打开时还是能记住你是谁，下次访问时无需再登录即可访问，基本流程如下：

**1、** 首先在登录页面选中RememberMe然后登录成功；如果是浏览器登录，一般会把RememberMe的Cookie写到客户端并保存下来；

**2、** 关闭浏览器再重新打开；会发现浏览器还是记住你的；

**3、** 访问一般的网页服务器端还是知道你是谁，且能正常访问；

**4、** 但是比如我们访问淘宝时，如果要查看我的订单或进行支付时，此时还是需要再进行身份认证的，以确保当前用户还是你；

在实际项目中，根据需要选择性的开放记住我（RememberMe）功能，Shiro提供了一个内部过滤器：user 来表示配置记住我或认证通过可以访问的地址。

## 二、Shiro的RememberMe配置

【a】Shiro全局配置类中加入CookieRememberMeManager和SimpleCookie对象

```java
/**
 * 设置cookie
 *
 * @return
 */
@Bean
public SimpleCookie rememberMeCookie() {
    //这个参数是cookie的名称,对应前端的checkbox的name=rememberMe
    SimpleCookie simpleCookie = new SimpleCookie("rememberMe");
    //如果httyOnly设置为true，则客户端不会暴露给客户端脚本代码，使用HttpOnly cookie有助于减少某些类型的跨站点脚本攻击；
    simpleCookie.setHttpOnly(true);
    //记住我cookie生效时间10秒钟(单位秒)
    simpleCookie.setMaxAge(10);
    return simpleCookie;
}
/**
 * cookie管理对象,记住我功能
 *
 * @return
 */
@Bean
public CookieRememberMeManager rememberMeManager() {
    CookieRememberMeManager cookieRememberMeManager = new CookieRememberMeManager();
    cookieRememberMeManager.setCookie(rememberMeCookie());
    // rememberMe cookie加密的密钥  建议每个项目都不一样 默认AES算法 密钥长度(128 256 512 位)
    cookieRememberMeManager.setCipherKey(Base64.decode("4AvVhmFLUs0KTA3Kprsdag=="));
    return cookieRememberMeManager;
}
```

【b】将上一步定义的CookieRememberMeManager加入到SecurityManager安全管理器去管理

```java
/**
 * 将Realm注册到securityManager中
 *
 * @return
 */
@Bean("securityManager")
public DefaultWebSecurityManager securityManager() {
    DefaultWebSecurityManager defaultWebSecurityManager = new DefaultWebSecurityManager();
    defaultWebSecurityManager.setRealm(myShiroRealm(hashedCredentialsMatcher()));
    //将cookie管理器交给SecurityManager进行管理
    defaultWebSecurityManager.setRememberMeManager(rememberMeManager());
    return defaultWebSecurityManager;
}
```

【c】配置哪些路径支持RememberMe功能

```java
//user表示配置记住我或认证通过可以访问的地址
filterChainDefinitionMap.put("/remember", "user");
```

> 这里我们配置“/remember = user”，表示访问该地址的用户是身份验证通过或 RememberMe 登录的都可以。

【d】controller中新建一个/remember跳转接口，并新建remember.html页面

```java
@GetMapping("/remember")
public String remember() {
    return "remember";
}
```

remember.html：

```xml
<!doctype html>
<!--注意：引入thymeleaf的名称空间-->
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>RememberMe</title>
</head>
<body>
this is RememberMe Page
</body>
</html>
```

【e】修改index.html，加入checkbox记住我复选框

```xml
<form method="post" action="/userLogin">
    用户名: <input type="text" name="username"><br/>
    密码: <input type="password" name="password"><br/>
    <P><input type="checkbox" name="rememberMe" />记住我</P>
    <input type="submit" name="submit"><br/>
</form>
```

【f】修改登录toLogin接口，接收单选框的值

使用public UsernamePasswordToken(String username, String password, boolean rememberMe) 此构造方法构造UsernamePasswordToken 对象，传入前台传入的boolean值类型的rememberMe值，true表示记住我，false表示不记住我。

```java
@RequestMapping(value = "/userLogin", method = RequestMethod.POST)
public String toLogin(String username, String password, Model model, boolean rememberMe) {
    //1.获取Subject
    Subject subject = SecurityUtils.getSubject();
    //2.封装用户数据
    UsernamePasswordToken token = new UsernamePasswordToken(username, password, rememberMe);
    //.......
}
```

【g】测试

启动项目：

访问[http://localhost:8080/remember](http://localhost:8080/remember) ，会跳转到登录页面，登录成功后会设置会话及 rememberMe Cookie；

如下图，可以看到成功登陆。

关闭浏览器，此时会话 cookie 将失效；

然后重新打开浏览器，直接访问[http://localhost:8080/remember](http://localhost:8080/remember) ，我们发现还是可以访问的；

因为我们设置的cookie过期时间为10秒钟，所以我们稍等十秒钟后，重新访问[http://localhost:8080/remember](http://localhost:8080/remember) ，此时是不能访问的，因为cookie已经过期了，浏览器并不认识你。

- 如果此时访问其他我们没有配置user过滤器的页面，Shiro一样会拦截下来，然后跳转到登录页面重新进行身份验证。

## 三、总结

- subject.isAuthenticated() ：表示用户进行了身份验证登录的，即使用 Subject.login 进行了登录；
- subject.isRemembered()：表示用户是通过记住我登录的，此时可能并不是真正的你（如你的朋友使用你的电脑， 或者你的 cookie 被窃取）在访问的；
- 以上两者二选一，即 subject.isAuthenticated() == true，则subject.isRemembered() == false；反之一样。

**另外对于过滤器，一般这样使用：**

访问一般网页，如个人在主页之类的，我们使用 user 拦截器即可，user 拦截器只要用户登录 (isRemembered() == true or isAuthenticated() == true) 过即可访问成功；

访问特殊网页，如我的订单，提交订单页面，我们使用 authc 拦截器即可，authc 拦截器会判断用户是否是通过 Subject.login（isAuthenticated() == true）登录的，如果是才放行，否则会跳转到登录页面叫你重新登录。

本篇文章主要总结了Shiro提供的RememberMe记住我功能，在工作中，可以根据具体需求选择性开放记住我权限的接口或者页面，并且支持设置cookie的过期时长，即设置允许浏览器记住你多久。
