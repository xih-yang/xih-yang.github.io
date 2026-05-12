# 02、Shiro 实战：认证流程
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/17.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
## 一、简介：

身份验证，即在应用中谁能证明他就是他本人。一般提供如他们的身份ID一些标识信息来表明他就是他本人，如提供身份证，用户名和密码来证明。在shiro中，用户需要提供principals （身份）和credentials（证明）给shiro，从而应用能验证用户身份。最常见的principals和credentials组合就是用户名和密码了。

## 二、身份认证流程：

**1、** 首先调用Subject.login(token)进行登录，其会自动委托给SecurityManager，调用之前必须通过SecurityUtils.getSubject()获取Subject；

**2、** SecurityManager负责真正的身份验证逻辑；它会委托给Authenticator进行身份验证；

**3、** Authenticator才是真正的身份验证者，ShiroAPI中核心的身份认证入口点，此处可以自定义插入自己的实现；

**4、** Authenticator可能会委托给相应的AuthenticationStrategy进行多Realm身份验证，默认ModularRealmAuthenticator会调用AuthenticationStrategy进行多Realm身份验证；

**5、** Authenticator会把相应的token传入Realm，从Realm获取身份验证信息，如果没有返回或抛出异常表示身份验证失败了此处可以配置多个Realm，将按照相应的顺序及策略进行访问；

## 三、使用步骤：

**1、** 获取当前的Subject，调用SecurityUtils.getSubject()；

**2、** 测试当前的用户是否已经被认证，即是否已经登录，调用Subject的isAuthenticated()；

**3、** 若没有被认证，则把用户名和密码封装为UsernamePasswordToken对象；

**4、** 执行登录：调用Subject的login(AuthenticationToken)方法；

```java
@RequestMapping("/login")
public String login(@RequestParam("username") String username, 
                    @RequestParam("password") String password){    
    Subject currentUser = SecurityUtils.getSubject();
    if (!currentUser.isAuthenticated()) {
     //把用户名和密码封装为UsernamePasswordToken对象，这个token会被传到Realm中比对
         UsernamePasswordToken token = 
         new UsernamePasswordToken(username, password);
        //rememberme记住我
        token.setRememberMe(true);
        try {
           //执行登录. 
           currentUser.login(token);
           } catch (AuthenticationException ae) { // 所有认证时异常的父类.
               System.out.println("登录失败: " + ae.getMessage());
           }
       }
    return "redirect:/list.jsp";
}
```

**5、** 自定义Realm的方法，从数据库中获取对应的记录,返回给Shiro；

1、 实际上需要继承 org.apache.shiro.realm.AuthenticatingRealm 类。

2、 实现 doGetAuthenticationInfo(AuthenticationToken) 方法。

3、通过 AuthenticatingRealm 的 credentialsMatcher 属性来进行的密码的比对

```java
public class ShiroRealm extends AuthenticatingRealm{
　　 // 认证
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(
            AuthenticationToken token) throws AuthenticationException {
        //1. 把 AuthenticationToken 转换为 UsernamePasswordToken
        UsernamePasswordToken upToken = (UsernamePasswordToken) token;
        //2. 从 UsernamePasswordToken 中来获取 username
        String username = upToken.getUsername();
        //3. 调用数据库的方法, 从数据库中查询 username 对应的用户记录
        User user = getUser(String username);
        //4. 若用户不存在, 则可以抛出 UnknownAccountException 异常
        if(user.isEmpty()){
            throw new UnknownAccountException("用户不存在!");
        }
        //5. 根据用户信息的情况, 决定是否需要抛出其他的 AuthenticationException 异常.
        if("monster".equals(username)){
            throw new LockedAccountException("用户被锁定");
        }
        //6. 根据用户的情况, 来构建 AuthenticationInfo 对象并返回.
        //以下信息是从数据库中获取的.AuthenticationInfo封装着从数据库中查询出来的帐号密码
        //1). principal: 认证的实体信息. 可以是 username, 也可以是数据表对应的用户的实体类对象.
        Object principal = user.getUserName();
        //2). credentials: 密码.
        Object credentials = user.getPassword;
        //3). realmName: 当前 realm 对象的 name. 调用父类的 getName() 方法即可
        String realmName = getName();
        SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(principal, credentials, realmName);
        return info;
    }
}
```

**6、** 需要用到的pom；

```xml
<!-- shiro -->
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-spring</artifactId>
    <version>1.4.2</version>
</dependency>
<dependency>
    <groupId>org.crazycake</groupId>
    <artifactId>shiro-redis</artifactId>
    <version>3.2.3</version>
    <!-- 排除最新3.1.0版本，引用2.9.0版本,https://github.com/alexxiyang/shiro-redis/issues/113 -->
    <exclusions>
        <exclusion>
            <groupId>redis.clients</groupId>
            <artifactId>jedis</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>com.github.theborakompanioni</groupId>
    <artifactId>thymeleaf-extras-shiro</artifactId>
    <version>2.0.0</version>
</dependency>    
```
