# 05、Shiro 实战：Realm
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/20.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
## 一、简介：

域，Shiro从从Realm获取安全数据（如用户、角色、权限），就是说SecurityManager要验证用户身份，那么它需要从Realm获取相应的用户进行比较以确定用户身份是否合法；也需要从Realm得到用户相应的角色和权限进行验证用户是否能进行操作；可以把Realm看成DataSource，即安全数据源。

## 二、自定义 Realm：

自定义Realm 只需要继承AuthorizingRealm，就能够继承到认证与授权功能。AuthorizingRealm继承了 AuthenticatingRealm（即身份验证），而且也间接继承了 CachingRealm（带有缓存实现）。

## 三、将Realm设置到securityManager中

```java
@Bean
public CustomRealm customRealm(){
    CustomRealm customRealm=new CustomRealm();
    customRealm.setCredentialsMatcher(customHashedCredentialsMatcher());
    customRealm.setCacheManager(redisCacheManager());
    return customRealm;
}
@Bean
public SecurityManager securityManager(){
    DefaultWebSecurityManager defaultWebSecurityManager=new                                               DefaultWebSecurityManager();
    defaultWebSecurityManager.setRealm(customRealm());
    return defaultWebSecurityManager;
}
```

## 四、认证策略

SecurityManager 接口继承了 Authenticator，另外还有一个 ModularRealmAuthenticator实现，其委托给多个Realm 进行验证，验证规则通过 AuthenticationStrategy 接口指定。

**1、** AuthenticationStrategy接口的默认实现：；

FirstSuccessfulStrategy：只要有一个 Realm 验证成功即可，只返回第 一个 Realm 身份验证成功的认证信息，其他的忽略；

**2、** AtLeastOneSuccessfulStrategy：只要有一个Realm验证成功即可，和FirstSuccessfulStrategy不同，将返回所有Realm身份验证成功的认证信息；

**3、** AllSuccessfulStrategy：所有Realm验证成功才算成功，且返回所有Realm身份验证成功的认证信息，如果有一个失败就失败了；

**4、** ModularRealmAuthenticator默认是AtLeastOneSuccessfulStrategy策略；
