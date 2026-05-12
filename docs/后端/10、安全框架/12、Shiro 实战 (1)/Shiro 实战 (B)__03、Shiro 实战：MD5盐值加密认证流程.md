# 03、Shiro 实战：MD5盐值加密认证流程
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/18.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
简介：

对于同一密码，同一加密算法会产生相同的hash值，这样，当用户进行身份验证时，也可对用户输入的明文密码应用相同的hash加密算法，得出一个hash值，然后使用该hash值和之前存储好的密文值进行对照，如果两个值相同，则密码认证成功，否则密码认证失败。

但是这样存在很大的问题，不同的用户极有可能会使用相同的密码，那么这些用户对应的密文也会相同，这样，当存储用户密码的数据库泄露后，攻击者会很容易便能找到相同密码的用户，从而也降低了破解密码的难度，因此，在对用户密码进行加密时，需要考虑对密码进行掩饰，即使是相同的密码，也应该要保存为不同的密文，即使用户输入的是弱密码，也需要考虑进行增强，从而增加密码被攻破的难度，而使用带盐的加密hash值便能满足该需求。

所以为了达到即便是相同的密码在加密之后，密文也不一样的需求。我们需要对密码进行盐值加密。

使用：

**1、** 获取当前的Subject，调用SecurityUtils.getSubject()；

**2、** 测试当前的用户是否已经被认证，即是否已经登录，调用Subject的isAuthenticated()；

**3、** 若没有被认证，对密码进行md5盐值加密，首先数据库中的密码必须是同一种加密方式；

**4、** 把用户名和密文密码封装为UsernamePasswordToken对象；

**5、** 执行登录：调用Subject的login(AuthenticationToken)方法；

```java
@RequestMapping("/login")
public String login(@RequestParam("username") String username, 
                    @RequestParam("password") String password){    
    Subject currentUser = SecurityUtils.getSubject();
    if (!currentUser.isAuthenticated()) {
　　　　　// 对密码进行MD5盐值加密
　　　　　String enPassword = getEnPassword(username,password);
     　　//把用户名和密文密码封装为UsernamePasswordToken对象，这个token会被传到Realm中比对
         UsernamePasswordToken token = 
         new UsernamePasswordToken(username, enPassword);
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
// 对密码进行md5盐值加密，盐值可以是用户名，盐值必须是唯一的
public String getEnPassword(String username,String password){
　　　　String hashAlgorithmName = "MD5";  // 加密方式：md5加密
　　　　Object credentials = password; 　　// 密码
　　　　Object salt = ByteSource.Util.bytes(username);　　// 盐
　　　　int hashIterations = 1024;  // 加密次数
　　　　Object result = new SimpleHash(hashAlgorithmName, credentials, salt, hashIterations);
　　　　return result.toString();
}
```

**6、** 自定义Realm的方法，从数据库中获取对应的记录,返回给Shiro；

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
