# 06、Shiro 速成：SpringBoot+Shiro 集成缓存功能
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/6.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (A)
## 一、概述

Shiro 提供了类似于 Spring 的 Cache 抽象，即 Shiro 本身不实现 Cache，但是对 Cache 进行了又抽象，方便更换不同的底层 Cache 实现。

Shiro 提供的 Cache 接口：

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

Shiro 提供的 CacheManager 接口：

```java
public interface CacheManager {
    //根据缓存名字获取一个Cache
    public <K, V> Cache<K, V> getCache(String name) throws CacheException;
}
```

Shiro 还提供了 CacheManagerAware 用于注入 CacheManager：

```java
public interface CacheManagerAware {
    //注入CacheManager
    void setCacheManager(CacheManager cacheManager);
}
```

Shiro 内部相应的组件（DefaultSecurityManager）会自动检测相应的对象（如 Realm）是否实现了 CacheManagerAware 并自动注入相应的 CacheManager。

在上一篇文章【使用Shiro实现用户授权功能】中，我们通过在doGetAuthorizationInfo(PrincipalCollection principalCollection)方法中，每次都去查询用户对应的角色和权限信息，实际上对于一个用户来说，其权限在短时间内基本是不会变化的。因此，Shiro提供了缓存功能，可以将权限缓存起来，避免频繁访问数据库获取权限信息，本篇文章主要介绍基于Redis和Ehcache缓存的实现，下面我们来看具体的实现。

## 二、Shiro集成Redis实现缓存

【a】引入redis-shiro依赖

```xml
<!-- shiro-redis -->
<dependency>
    <groupId>org.crazycake</groupId>
    <artifactId>shiro-redis</artifactId>
    <version>2.4.2.1-RELEASE</version>
</dependency>
<!-- 对象池，使用redis时必须引入 -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
</dependency>
```

【b】application.yml中加入redis的配置

```java
spring:
  redis:
    host: localhost
    port: 6379
    timeout: 0ms
    lettuce:
      pool:
      连接池最大连接数（使用负值表示没有限制） 默认 8
      max-active: 8
      连接池最大阻塞等待时间（使用负值表示没有限制） 默认 -1
      max-wait: -1ms
      连接池中的最大空闲连接 默认 8
      max-idle: 8
      连接池中的最小空闲连接 默认 0
      min-idle: 0
```

【c】在Shiro全局配置类中配置Redis缓存管理器以及redis管理器

```java
/**
 * 配置Redis缓存管理器
 */
@Bean
public RedisCacheManager redisCacheManager() {
    RedisCacheManager redisCacheManager = new RedisCacheManager();
    //设置redis管理器
    redisCacheManager.setRedisManager(redisManager());
    return redisCacheManager;
}
/**
 * 配置redis管理器
 */
@Bean
public RedisManager redisManager() {
    RedisManager redisManager = new RedisManager();
    //设置一小时超时，单位是秒
    redisManager.setExpire(3600);
    return redisManager;
}
```

【d】将Redis缓存管理器加入给SecurityManager安全管理器管理

```java
//设置缓存管理器
defaultWebSecurityManager.setCacheManager(redisCacheManager());
```

【e】新增一个需要访问权限的接口

```java
@RequiresPermissions(value = "user:list")
@RequestMapping("/userList")
public String userList(){
    return "userList";
}
```

新建userList.html：

```xml
<!doctype html>
<!--注意：引入thymeleaf的名称空间-->
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
userList page
</body>
</html>
```

success.html中加入如下超链接：

```xml
<div>跳转到userList.html: <a href="/userList">userList.html</a><br></div>
```

【f】启动项目

```java
Caused by: java.lang.ClassNotFoundException: org.apache.shiro.event.EventBus
	at java.net.URLClassLoader.findClass(URLClassLoader.java:381) ~[na:1.8.0_121]
	at java.lang.ClassLoader.loadClass(ClassLoader.java:424) ~[na:1.8.0_121]
	at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:331) ~[na:1.8.0_121]
	at java.lang.ClassLoader.loadClass(ClassLoader.java:357) ~[na:1.8.0_121]
	... 25 common frames omitted
```

可见，项目启动报错：ClassNotFoundException: org.apache.shiro.event.EventBus。因为Maven依赖的jar包中缺少了EventBus这个class文件,原来maven工程中已经依赖了shiro-core1.4.0的版本 ，在shiro-redis依赖中使用了shiro-core-1.2版本，把1.4版本的排除了出去, 而这个类要在1.3版本上才有,所以需要排除1.2版本。

```xml
<!-- shiro-redis -->
<dependency>
    <groupId>org.crazycake</groupId>
    <artifactId>shiro-redis</artifactId>
    <version>2.4.2.1-RELEASE</version>
    <exclusions>
        <exclusion>
            <artifactId>shiro-core</artifactId>
            <groupId>org.apache.shiro</groupId>
        </exclusion>
    </exclusions>
</dependency>
```

重新启动项目，这次启动没有报错了，但是当你访问list.html页面时，页面报如下的错误：

```java
tried to access method redis.clients.jedis.JedisPool.returnResource
```

翻译一下，其实指的就是尝试从类org.crazycake.shiro.RedisManager访问方法，但是访问不到。

原因其实是redis.clients:jedis:3.1.0版本种的returnResource()方法访问修饰符变为protected，所以我们换低一点的版本即可：

```xml
<dependency>
    <groupId>org.crazycake</groupId>
    <artifactId>shiro-redis</artifactId>
    <version>2.4.2.1-RELEASE</version>
    <exclusions>
        <exclusion>
            <artifactId>shiro-core</artifactId>
            <groupId>org.apache.shiro</groupId>
        </exclusion>
        <exclusion>
            <artifactId>shiro-core</artifactId>
            <groupId>org.apache.shiro</groupId>
        </exclusion>
        <exclusion>
            <artifactId>jedis</artifactId>
            <groupId>redis.clients</groupId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>2.9.0</version>
</dependency>
```

再次重启项目，使用admin/123456进行登录：

依次访问userList.html和list.html两个需要授权的页面，如下图：

> 注意：需要首先启动好Redis服务，否则项目连不上Redis，会报错。

如下图，可以看到后台只打印出一次从数据库查询获取权限的日志信息，证明我们的redis缓存起效果。

以上就是关于Shiro整合Redis实现用户权限缓存功能，接下来我们再来看另外一种实现方式：Shiro整合Ehcache实现用户权限缓存功能。

## 三、Shiro集成Ehcache实现缓存

【a】引入Shiro跟Ehcachae整合相关依赖

```xml
<!-- shiro ehcache -->
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-ehcache</artifactId>
    <version>1.3.2</version>
</dependency>
<!-- ehchache -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
<dependency>
    <groupId>net.sf.ehcache</groupId>
    <artifactId>ehcache</artifactId>
</dependency>
```

【b】新建Ehcache配置文件

在resource/config路径下新建shiro-ehcache-config.xml配置文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ehcache xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="http://ehcache.org/ehcache.xsd"
         updateCheck="false">
    <diskStore path="java.io.tmpdir/Tmp_EhCache"/>
    <!--
          defaultCache:默认的缓存配置信息,如果不加特殊说明,则所有对象按照此配置项处理
          maxElementsInMemory:设置了缓存的上限,最多存储多少个记录对象
         eternal:代表对象是否永不过期
         timeToIdleSeconds:最大的发呆时间
         timeToLiveSeconds:最大的存活时间
         overflowToDisk:是否允许对象被写入到磁盘
      -->
    <defaultCache
            maxElementsInMemory="10000"
            eternal="false"
            timeToIdleSeconds="120"
            timeToLiveSeconds="120"
            overflowToDisk="false"
            diskPersistent="false"
            diskExpiryThreadIntervalSeconds="120"/>
    <!--
         cache:为指定名称的对象进行缓存的特殊配置
         name:指定对象的完整名
      -->
    <!-- 登录记录缓存锁定1小时 -->
    <cache
            name="passwordRetryCache"
            maxEntriesLocalHeap="2000"
            eternal="false"
            timeToIdleSeconds="3600"
            timeToLiveSeconds="0"
            overflowToDisk="false"
            statistics="true"/>
</ehcache>
```

【c】Shiro全局配置类中配置Ehcache

```java
/**
 * Ehcache缓存管理器
 * @return
 */
@Bean
@Primary  //指定ehcache为主要的缓存管理器
public EhCacheManager ehCacheManager() {
    EhCacheManager ehCacheManager = new EhCacheManager();
    ehCacheManager.setCacheManagerConfigFile("classpath:config/shiro-ehcache-config.xml");
    return ehCacheManager;
}
```

【d】将缓存对象注入到SecurityManager中

```java
//设置EhCacheManager缓存管理员
defaultWebSecurityManager.setCacheManager(ehCacheManager());
```

【e】启动项目测试

使用admin/123456进行登录：

依次访问userList.html和list.html两个需要授权的页面，如下图：

如下图，可以看到后台只打印出一次从数据库查询获取权限的日志信息，同样证明我们的ehcache缓存起效果。

> 注意，需要注释掉前面在shiro全局配置类中注入的redis缓存，否则启动会报错：因为发现两个缓存管理器。当然如果不注释的话，也可以使用@Primary注解指定某个缓存管理器为主要的管理器。

## 扩展知识：

Ehcache的配置详细说明如下：

## 1、以下属性是必须的：

**1、** name： Cache的名称，必须是唯一的(ehcache会把这个cache放到HashMap里)。

**2、** maxElementsInMemory：在内存中缓存的element的最大数目。

**3、** maxElementsOnDisk：在磁盘上缓存的element的最大数目，默认值为0，表示不限制。

**４、** eternal：设定缓存的elements是否永远不过期。如果为true，则缓存的数据始终有效，如果为false那么还要根据timeToIdleSeconds，timeToLiveSeconds判断。

**５、** overflowToDisk： 如果内存中数据超过内存限制，是否要缓存到磁盘上。

## 2、以下属性是可选的：

**１、** timeToIdleSeconds： 对象空闲时间，指对象在多长时间没有被访问就会失效。只对eternal为false的有效。默认值0，表示一直可以访问。

**２、** timeToLiveSeconds： 对象存活时间，指对象从创建到失效所需要的时间。只对eternal为false的有效。默认值0，表示一直可以访问。

**３、** diskPersistent： 是否在磁盘上持久化。指重启jvm后，数据是否有效。默认为false。

**４、** diskExpiryThreadIntervalSeconds： 对象检测线程运行时间间隔。标识对象状态的线程多长时间运行一次。

**５、** diskSpoolBufferSizeMB： DiskStore使用的磁盘大小，默认值30MB。每个cache使用各自的DiskStore。

**６、** memoryStoreEvictionPolicy： 如果内存中数据超过内存限制，向磁盘缓存时的策略。默认值LRU，可选FIFO、LFU。

## 3、缓存的3 种清空策略 ：

**１、** FIFO ，First In First Out (先进先出)；

**２、** LFU ， Less Frequently Used (最少使用)。意思是一直以来最少被使用的。缓存的元素有一个hit 属性，hit 值最小的将会被清出缓存；

**３、** LRU ，Least Recently Used(最近最少使用)。 (ehcache 默认值).缓存的元素有一个时间戳，当缓存容量满了，而又需要腾出地方来缓存新的元素的时候，那么现有缓存元素中时间戳离当前时间最远的元素将被清出缓存；

## 四、总结

本篇文章主要总结了Shiro提供的缓存功能，能大大减少授权的时候对数据库的查询，通过配置两种缓存管理器：Redis和Ehcache缓存管理器。在实际项目中，可以根据需求配置两种缓存管理器，实现用户高效授权操作。
