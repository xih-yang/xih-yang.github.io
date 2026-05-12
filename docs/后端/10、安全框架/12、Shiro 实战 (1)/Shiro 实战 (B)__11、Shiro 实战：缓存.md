# 11、Shiro 实战：缓存
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/26.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
## 一、简介：

**1、** Shiro内部相应的组件（DefaultSecurityManager）会自动检测相应的对象（如Realm）是否实现了CacheManagerAware并自动注入相应的CacheManager；

**2、** Shiro提供了CachingRealm，其实现了CacheManagerAware接口，提供了缓存的一些基础实现；AuthenticatingRealm及AuthorizingRealm也分别提供了对AuthenticationInfo和AuthorizationInfo信息的缓存；

## 二、使用

**1、** 在springboot中配置缓存：将缓存设置到Realm中；

```java
@Bean
public RedisCacheManager redisCacheManager(){
    return new RedisCacheManager();
}
@Bean
public CustomRealm customRealm(){
    CustomRealm customRealm=new CustomRealm();
    customRealm.setCacheManager(redisCacheManager());
    return customRealm;
}
```
