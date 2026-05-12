# 03、Shiro 速成：SpringBoot+Shiro 实现用户认证（密码加密）
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/3.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (A)
## 一、概述

前面一篇文章我们通过示例详细说明了Shiro如何进行用户身份认证的，但是我们是比对的明文密码，本篇文章将总结一下Shiro的加密功能，实现密文的比对。

如果还没有阅读前面一篇Shiro实现用户身份认证的，可以通过下面的链接进行阅读：

[02、Shiro 速成：SpringBoot+Shiro 现用户身份认证功能](/zhuanlan/security/shiro/5/2.html)

## 二、调整Shiro全局配置类

【a】Shiro全局配置类中注入HashedCredentialsMatcher密码匹配凭证管理器

```java
/**
 * 密码匹配凭证管理器（密码加密需要此配置）
 *
 * @return
 */
@Bean
public HashedCredentialsMatcher hashedCredentialsMatcher() {
    HashedCredentialsMatcher hashedCredentialsMatcher = new HashedCredentialsMatcher();
    //加密算法
    hashedCredentialsMatcher.setHashAlgorithmName("MD5");
    // 设置加密次数
    hashedCredentialsMatcher.setHashIterations(1024);
    return hashedCredentialsMatcher;
}
```

【b】Shiro全局配置类中配置Realm的密码加密管理器

```java
/**
 * 配置自定义的Realm
 *
 * @param matcher
 * @return
 */
@Bean
public MyShiroRealm myShiroRealm(HashedCredentialsMatcher matcher) {
    MyShiroRealm myShiroRealm = new MyShiroRealm();
    //配置密码加密
    myShiroRealm.setCredentialsMatcher(matcher);
    return myShiroRealm;
}
/**
 * 将Realm注册到securityManager中
 *
 * @return
 */
@Bean("securityManager")
public DefaultWebSecurityManager securityManager() {
    return new DefaultWebSecurityManager(myShiroRealm(hashedCredentialsMatcher()));
}
```

【c】Shiro MD5密码生成

Shiro中提供的MD5密码加密方法如下：

> public SimpleHash(String algorithmName, Object source, Object salt, int hashIterations)

参数说明：

- algorithmName：加密算法名称
- source：需要加密的密码
- salt：加密的盐值
- hashIterations：需要加密的次数

```java
public static void main(String[] args) {
    SimpleHash simpleHash = new SimpleHash("MD5", "123456", "admin", 1024);
    System.out.println(simpleHash);
}
```

【d】修改数据库中密码为加密后的密码

> 这里只是模拟密文的密码，实际生产环境中，肯定是需要前端加密再传输到后台的。

【e】修改一下自定义的Realm

由于需要将密码加密，所以需要使用复杂一点的构造方法构造SimpleAuthenticationInfo对象：

> public SimpleAuthenticationInfo(Object principal, Object hashedCredentials, ByteSource credentialsSalt, String realmName)

- 第一个字段是加密算法；
- 第二个字段是user.getPassword()，注意这里是指从数据库中获取的password；
- 第三个字段是盐值；
- 第四个字段是realm，即当前realm的名称；

```java
/**
 * 认证相关方法
 */
@Override
protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
    UsernamePasswordToken usernamePasswordToken = (UsernamePasswordToken) authenticationToken;
    //1.判断用户名, token中的用户信息是登录时候传进来的
    String username = usernamePasswordToken.getUsername();
    char[] password = usernamePasswordToken.getPassword();
    logger.info("username:" + username);
    logger.info("password:" + new String(password));
    //通过账号查找用户信息
    User user = userMapper.findUserByName(username);
    if (null == user) {
        logger.error("用户不存在..");
        throw new UnknownAccountException("用户不存在！");
    }
    if ("0".equals(user.getStatus())) {
        throw new LockedAccountException("账号已被锁定,请联系管理员！");
    }
    //数据库中查询的用户名
    Object principal = user.getUsername();
    Object credentials = user.getPassword();
    String realmName = getName();
    ByteSource byteSource = ByteSource.Util.bytes(username);
    //2.判断密码
    //第一个字段是加密算法
    //第二个字段是user.getPassword()，注意这里是指从数据库中获取的password。
    //第三个字段是盐值
    //第四个字段是realm，即当前realm的名称。
    //从这里传入的password（这里是从数据库获取的）和token（filter中登录时生成的）中的password做对比，如果相同就允许登录，不相同就抛出IncorrectCredentialsException异常。
    // 将账户名,密码,盐值,getName()实例化到SimpleAuthenticationInfo中交给Shiro来管理
    return new SimpleAuthenticationInfo(principal, credentials, byteSource, realmName);
}
```

【f】启动项目，访问：[http://localhost:8080/index](http://localhost:8080/index)， 使用admin/123456进行登录。

可以看到，登录成功， 说明我们的MD5密码加密管理器配置的没有问题。

【g】断点Debug，观察Shiro底层比对密码的关键代码：

在UsernamePasswordToken类的getPassword()方法打上一个断点，重新进行登录。

下图是MyShiroRealm执行login之后认证方法内：

继续单步调试，当运行到HashedCredentialsMatcher类的doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info)方法时，此方法就是真正进行密码比对的方法：

```java
public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
    //通过认证方法里面传入的UsernamePasswordToken对象中的密码，结合我们配置的密码加密器进行加密，生成密码1
    Object tokenHashedCredentials = this.hashProvidedCredentials(token, info);
    //通过认证方法返回值构造的SimpleAuthenticationInfo对象里面配置的密码，生成密码2
    Object accountCredentials = this.getCredentials(info);
    //将密码1和密码2进行比对，如果相等，返回true,表示认证成功，登录成功，反之认证失败。
    return this.equals(tokenHashedCredentials, accountCredentials);
}
```

## 三、总结

以上就是关于在Shiro中如何配置密码加密器进行密文密码的比对，并通过Debug方式找到了Shiro底层是如何进行比对密码的，实际工作中，肯定在前端就已经对密码加密了，然后再传输到后端由Shiro完成比对。
