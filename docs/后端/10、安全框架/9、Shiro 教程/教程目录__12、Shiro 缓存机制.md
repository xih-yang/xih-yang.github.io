# 12、Shiro 缓存机制
- 来源：https://ddkk.com/zhuanlan/security/shiro/1/12.html
- 分类：安全框架
- 分组：教程目录
## 缓存机制

Shiro 提供了类似于 Spring 的 Cache 抽象，即 Shiro 本身不实现 Cache，但是对 Cache 进行了又抽象，方便更换不同的底层 Cache 实现。对于 Cache 的一些概念可以参考我的《Spring Cache 抽象详解》：[http://jinnianshilongnian.iteye.com/blog/2001040](http://jinnianshilongnian.iteye.com/blog/2001040)。

**Shiro 提供的 Cache 接口**：

```java
public interface Cache<K, V> {
    //根据Key获取缓存中的值
    public V get(K key) throws CacheException;
    //往缓存中放入key-value，返回缓存中之前的值
    public V put(K key, V value) throws CacheException; 
    //移除缓存中key对应的值，返回该值
    public V remove(K key) throws CacheException;
    //清空整个缓存
    public void clear() throws CacheException;
    //返回缓存大小
    public int size();
    //获取缓存中所有的key
    public Set<K> keys();
    //获取缓存中所有的value
    public Collection<V> values();
}
```

**Shiro 提供的 CacheManager 接口**：

```java
public interface CacheManager {
    //根据缓存名字获取一个Cache
    public <K, V> Cache<K, V> getCache(String name) throws CacheException;
}
```

**Shiro 还提供了 CacheManagerAware 用于注入 CacheManager**：

```java
public interface CacheManagerAware {
    //注入CacheManager
    void setCacheManager(CacheManager cacheManager);
}
```

Shiro 内部相应的组件（DefaultSecurityManager）会自动检测相应的对象（如 Realm）是否实现了 CacheManagerAware 并自动注入相应的 CacheManager。

本章用例使用了与第六章的代码。

## Realm 缓存

Shiro 提供了 CachingRealm，其实现了 CacheManagerAware 接口，提供了缓存的一些基础实现；另外 AuthenticatingRealm 及 AuthorizingRealm 分别提供了对 AuthenticationInfo 和 AuthorizationInfo 信息的缓存。

**ini 配置**

```java
userRealm=com.github.zhangkaitao.shiro.chapter11.realm.UserRealm
userRealm.credentialsMatcher=$credentialsMatcher
userRealm.cachingEnabled=true
userRealm.authenticationCachingEnabled=true
userRealm.authenticationCacheName=authenticationCache
userRealm.authorizationCachingEnabled=true
userRealm.authorizationCacheName=authorizationCache
securityManager.realms=$userRealm
cacheManager=org.apache.shiro.cache.ehcache.EhCacheManager
cacheManager.cacheManagerConfigFile=classpath:shiro-ehcache.xml
securityManager.cacheManager=$cacheManager 
```

- userRealm.cachingEnabled：启用缓存，默认 false；
- userRealm.authenticationCachingEnabled：启用身份验证缓存，即缓存 AuthenticationInfo 信息，默认 false；
- userRealm.authenticationCacheName：缓存 AuthenticationInfo 信息的缓存名称；
- userRealm. authorizationCachingEnabled：启用授权缓存，即缓存 AuthorizationInfo 信息，默认 false；
- userRealm. authorizationCacheName：缓存 AuthorizationInfo 信息的缓存名称；
- cacheManager：缓存管理器，此处使用 EhCacheManager，即 Ehcache 实现，需要导入相应的 Ehcache 依赖，请参考 pom.xml；

因为测试用例的关系，需要将 Ehcache 的 CacheManager 改为使用 VM 单例模式： this.manager = new net.sf.ehcache.CacheManager(getCacheManagerConfigFileInputStream())； 改为 this.manager = net.sf.ehcache.CacheManager.create(getCacheManagerConfigFileInputStream())；

**测试用例**

```java
@Test
public void testClearCachedAuthenticationInfo() {
    login(u1.getUsername(), password);
    userService.changePassword(u1.getId(), password + "1");
    RealmSecurityManager securityManager =
     (RealmSecurityManager) SecurityUtils.getSecurityManager();
    UserRealm userRealm = (UserRealm) securityManager.getRealms().iterator().next();   userRealm.clearCachedAuthenticationInfo(subject().getPrincipals());
    login(u1.getUsername(), password + "1");
} 
```

首先登录成功（此时会缓存相应的 AuthenticationInfo），然后修改密码；此时密码就变了；接着需要调用 Realm 的 clearCachedAuthenticationInfo 方法清空之前缓存的 AuthenticationInfo；否则下次登录时还会获取到修改密码之前的那个 AuthenticationInfo；

```java
@Test
public void testClearCachedAuthorizationInfo() {
    login(u1.getUsername(), password);
    subject().checkRole(r1.getRole());
    userService.correlationRoles(u1.getId(), r2.getId());
    RealmSecurityManager securityManager =
      (RealmSecurityManager) SecurityUtils.getSecurityManager();
    UserRealm userRealm = (UserRealm)securityManager.getRealms().iterator().next();   userRealm.clearCachedAuthorizationInfo(subject().getPrincipals());
    subject().checkRole(r2.getRole());
} 
```

和之前的用例差不多；此处调用 Realm 的 clearCachedAuthorizationInfo 清空之前缓存的 AuthorizationInfo；

另外还有 clearCache，其同时调用 clearCachedAuthenticationInfo 和 clearCachedAuthorizationInfo，清空 AuthenticationInfo 和 AuthorizationInfo。

UserRealm 还提供了 clearAllCachedAuthorizationInfo、clearAllCachedAuthenticationInfo、clearAllCache，用于清空整个缓存。

在某些清空下这种方式可能不是最好的选择，可以考虑直接废弃 Shiro 的缓存，然后自己通过如 AOP 机制实现自己的缓存；可以参考： [https://github.com/zhangkaitao/es/tree/master/web/src/main/java/com/sishuok/es/extra/aop](https://github.com/zhangkaitao/es/tree/master/web/src/main/java/com/sishuok/es/extra/aop)

另外如果和 Spring 集成时可以考虑直接使用 Spring 的 Cache 抽象，可以考虑使用 SpringCacheManagerWrapper，其对 Spring Cache 进行了包装，转换为 Shiro 的 CacheManager 实现：

[https://github.com/zhangkaitao/es/blob/master/web/src/main/java/org/apache/shiro/cache/spring/SpringCacheManagerWrapper.java](https://github.com/zhangkaitao/es/blob/master/web/src/main/java/org/apache/shiro/cache/spring/SpringCacheManagerWrapper.java)

## Session 缓存

当我们设置了 SecurityManager 的 CacheManager 时，如：

securityManager.cacheManager= `$` cacheManager

当我们设置 SessionManager 时：

```java
sessionManager=org.apache.shiro.session.mgt.DefaultSessionManager
securityManager.sessionManager=$sessionManager 
```

如securityManager 实现了 SessionsSecurityManager，其会自动判断 SessionManager 是否实现了 CacheManagerAware 接口，如果实现了会把 CacheManager 设置给它。然后 sessionManager 会判断相应的 sessionDAO（如继承自 CachingSessionDAO）是否实现了 CacheManagerAware，如果实现了会把 CacheManager 设置给它；如第九章的 MySessionDAO 就是带缓存的 SessionDAO；其会先查缓存，如果找不到才查数据库。

对于CachingSessionDAO，可以通过如下配置设置缓存的名称：

```java
sessionDAO=com.github.zhangkaitao.shiro.chapter11.session.dao.MySessionDAO
sessionDAO.activeSessionsCacheName=shiro-activeSessionCache 
```

activeSessionsCacheName 默认就是 shiro-activeSessionCache。
