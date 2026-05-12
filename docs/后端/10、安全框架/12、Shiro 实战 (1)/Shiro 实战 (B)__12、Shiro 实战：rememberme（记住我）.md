# 12、Shiro 实战：rememberme（记住我）
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/27.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
## 一、简介：

Shiro 提供了记住我（RememberMe）的功能，比如访问如淘宝等一些网站时，关闭了浏览器，下次再打开时还是能记住你是谁， 下次访问时无需再登录即可访问，基本流程如下：

**1、** 首先在登录页面选中RememberMe然后登录成功；如果是浏览器登录，一般会把RememberMe的Cookie写到客户端并保存下来；

**2、** 关闭浏览器再重新打开；会发现浏览器还是记住你的；

**3、** 访问一般的网页是能正常访问；

**4、** 但是比如我们访问淘宝时，如果要查看我的订单或进行支付时，此时还是需要再进行身份认证的，以确保当前用户还是你；

## 二、认证和记住我：

**1、** subject.isAuthenticated()表示用户进行了身份验证登录的，即使有Subject.login进行了登录；

**2、** subject.isRemembered()：表示用户是通过记住我登录的，此时可能并不是真正的你（如你的朋友使用你的电脑，或者你的cookie被窃取）在访问的；

**3、** 两者只能二选一，即subject.isAuthenticated()==true，则subject.isRemembered()==false；反之一样；

## 三、建议和测试

建议：

**1、** 访问一般网页：如个人在主页之类的，我们使用user拦截器即可，user拦截器只要用户登录(isRemembered()||isAuthenticated())过即可访问成功；

**2、** 访问特殊网页：如我的订单，提交订单页面，我们使用authc拦截器即可，authc拦截器会判断用户是否是通过Subject.login（isAuthenticated()==true）登录的，如果是才放行，否则会跳转到登录页面重新登录；

测试：

**1、** 设置访问权限；

```java
public class FilterChainDefinitionMapBuilder {
    public LinkedHashMap<String, String> buildFilterChainDefinitionMap(){
        LinkedHashMap<String, String> map = new LinkedHashMap<>();
        map.put("/login.jsp", "anon");
        map.put("/shiro/login", "anon");
        map.put("/shiro/logout", "logout");
        map.put("/user.jsp", "authc,roles[user]");
        map.put("/admin.jsp", "authc,roles[admin]");
        map.put("/list.jsp", "user");
        map.put("/**", "authc");
        return map;
    }
}
```

**2、** 开启记住我功能token.setRememberMe(true)；

```java
@Controller
@RequestMapping("/shiro")
public class ShiroHandler {
    @RequestMapping("/login")
    public String login(@RequestParam("username") String username,
            @RequestParam("password") String password){
        Subject currentUser = SecurityUtils.getSubject();
        if (!currentUser.isAuthenticated()) {
            // 把用户名和密码封装为 UsernamePasswordToken 对象
            UsernamePasswordToken token = new UsernamePasswordToken(username, password);
            // 设置记住我
            token.setRememberMe(true);
            try {
                System.out.println("1. " + token.hashCode());
                // 执行登录.
                currentUser.login(token);
            } catch (AuthenticationException ae) { // 所有认证时异常的父类.
                System.out.println("登录失败: " + ae.getMessage());
            }
        }
        return "redirect:/list.jsp";
    }
}
```

**3、** 在securityManager中通过设置属性rememberMeManager.cookie.maxAge来设置记住我的时间单位是秒；

```java
@Bean
public SecurityManager securityManager(ShiroRealm shiroRealm) {
    DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();// 配置 rememberMeCookie
    securityManager.setRememberMeManager(rememberMeManager());
    return securityManager;
}
/**
 * rememberMe cookie 效果是重开浏览器后无需重新登录
 *
 */
private SimpleCookie rememberMeCookie() {
    // 设置 cookie 名称，对应 login.html 页面的 <input type="checkbox" name="rememberMe"/>
    SimpleCookie cookie = new SimpleCookie("rememberMe");
    // 设置 cookie 的过期时间，单位为秒，这里为一天
    cookie.setMaxAge(86400);
    return cookie;
}
/**
 * cookie管理对象
 *
 * @return CookieRememberMeManager
 */
private CookieRememberMeManager rememberMeManager() {
    CookieRememberMeManager cookieRememberMeManager = new CookieRememberMeManager();
    cookieRememberMeManager.setCookie(rememberMeCookie());
    // rememberMe cookie 加密的密钥
    String encryptKey = "febs_shiro_key";
    byte[] encryptKeyBytes = encryptKey.getBytes(StandardCharsets.UTF_8);
    String rememberKey = Base64Utils.encodeToString(Arrays.copyOf(encryptKeyBytes, 16));
    cookieRememberMeManager.setCipherKey(Base64.decode(rememberKey));
    return cookieRememberMeManager;
}
```
