# 14、Shiro 实战：缓存
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/14.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
**1、** CacheManagerAware接口；

Shiro 内部相应的组件（DefaultSecurityManager）会自动检测相应的对象（如Realm）是否实现了 CacheManagerAware 并自动注入相应的 CacheManager。

**2、** Realm缓存；

Shiro 提供了 CachingRealm，其实现了 CacheManagerAware 接口，提供了缓存的一些基础实现；

AuthenticatingRealm 及 AuthorizingRealm 也分别提供了对AuthenticationInfo 和 AuthorizationInfo 信息的缓存。

在Spring的配置文件applicationContext.xml中配置Ehcache缓存

```xml
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
    <property name="cacheManager" ref="cacheManager"/>
</bean>
<bean id="cacheManager" class="org.apache.shiro.cache.ehcache.EhCacheManager">
    <property name="cacheManagerConfigFile" value="classpath:ehcache.xml"/> 
</bean>
```

添加ehcache.xml配置文件

```xml
<ehcache>
    <!-- 磁盘上缓存的位置 -->
    <diskStore path="java.io.tmpdir"/>
    <!--
	    name:缓存名称
	    maxElementsInMemory 缓存最大数
	    eternal 缓存中对象是否为永久
	    overflowToDisk 内存不足时，是否启用磁盘缓存
	    timeToLiveSeconds 缓存数据的生存时间（单位秒）
	    timeToIdleSeconds 缓存对象空闲多久后删除（单位秒）
	    diskPersistent 是否在VM重启时存储硬盘的缓存数据
	    diskExpiryThreadIntervalSeconds 磁盘失效线程运行时间间隔
    -->
    <defaultCache
            maxElementsInMemory="10000"
            eternal="false"
            overflowToDisk="false"
            timeToIdleSeconds="300"
            timeToLiveSeconds="300"
            diskPersistent="false"
            diskExpiryThreadIntervalSeconds="120"
    />
</ehcache>
```

完成以上配置，我们就可以在shiro环境中使用ehcache缓存了。
