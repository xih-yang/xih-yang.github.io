# 7.4 EvictInterceptor
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/71.html
- 分类：ORM框架
- 分组：7 EhCachePlugin
EvictInterceptor可以根据CacheName注解自动清除缓存。以下是示例代码：

```java
@Before(EvictInterceptor.class)
@CacheName("blogList")
public void update() {
    getModel(Blog.class).update();
    redirect("blog.html");
}
```

上例中的用法将清除cacheName为blogList的缓存数据，与其配合的CacheInterceptor会自动更新cacheName为blogList的缓存数据。

jfinal 3.6 版本支持 @CacheName 参数使用逗号分隔多个 cacheName，方便针对多个 cacheName 进行清除，例如：

```java
@Before(EvictInterceptor.class)
@CacheName("blogList, hotBlogList")   // 逗号分隔多个 cacheName
public void update() {
   ...
}
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
