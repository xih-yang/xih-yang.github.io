# 08、Shiro 速成：SpringBoot+Shiro 使用这个ehcache缓冲技术
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/17.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (B)
## ehcache简介

EHCache是sourceforge的开源缓存项目，现已经具有独立官网，网址：(http://www.ehcache.org)。其本身是纯JAVA实现的，所以可以和绝大多数Java项目无缝整合，例如：Hibernate的缓存就是基于EHCache实现的。

EHCache支持内存和磁盘缓存，默认是存储在内存中的，当内存不够时允许把缓存数据同步到磁盘中，所以不需要担心内存不够问题。

EHCache支持基于Filter的Cache实现，同时也支持Gzip压缩算法提高响应速度。

## 为什么使用这个ehcache技术

现在的问题，我们在页面只用shiro标签实现是否有权限，或者注解判断是否有权限，每一个标签，或者每一个注解，都会走realm里面的授权的方法，里面会从数据库查询权限之后，放到权限对象里面。每一个标签或者注解都会走这个方法，都会进行查询数据库一次，我们的项目里面是使用了很多的权限标签和注解的，每一个都走数据库，那么是不好的。

所以我们希望就查询数据库一次，把查询出来的数据放到缓冲里面，以后每一个权限标签 或者 注解都走缓冲就可以了。

## 代码实现

### 添加依赖

```xml
2.1添加依赖
从3.0版本开始groupid为org.ehcache
<!--配置SpringBoot整合EHCache的依赖-->
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-ehcache</artifactId>s
    <version>1.4.2</version>
</dependency>
<dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.6</version>
</dependency>
```

### 写ehcache的配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ehcache name="ehcache" updateCheck="false">
    <!-- 磁盘缓存位置 -->
    <diskStore path="java.io.tmpdir"/>
    <!-- 默认缓存 -->
    <defaultCache
            maxEntriesLocalHeap="1000"
            eternal="false"
            timeToIdleSeconds="3600"
            timeToLiveSeconds="3600"
            overflowToDisk="false">
    </defaultCache>
    <!-- 登录记录缓存 锁定10分钟 -->
    <cache name="loginRecordCache"
           maxEntriesLocalHeap="2000"
           eternal="false"
           timeToIdleSeconds="600"
           timeToLiveSeconds="0"
           overflowToDisk="false"
           statistics="true">
    </cache>
</ehcache>
```

有了这个配置文件，需要我们的项目识别，也就是这个配置的对象需要shiro框架识别，那么就需要在shiro配置文件里面配置，要放到securitymanager对象里面。

```java
//创建Bean方法，ehCacheManager
@Bean
public EhCacheManager ehCacheManager(){
    //创建ehCacheManager对象
    EhCacheManager ehCacheManager=new EhCacheManager();
    //获取配置文件的流对象
    InputStream is=null;
    try{
         is = ResourceUtils.getInputStreamForPath("classpath:ehcache/ehcache-shiro.xml");
    }catch (Exception e){
        e.printStackTrace();
    }
    //获取CarManager对象
    net.sf.ehcache.CacheManager cacheManager = new net.sf.ehcache.CacheManager(is);
    ehCacheManager.setCacheManager(cacheManager);
    //返回
    return  ehCacheManager;
}
```

以上配置好之后，realm里面的授权代码，就会只是执行一次啦
