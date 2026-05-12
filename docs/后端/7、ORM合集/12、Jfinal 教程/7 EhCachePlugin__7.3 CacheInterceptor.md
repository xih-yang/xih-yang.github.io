# 7.3 CacheInterceptor
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/70.html
- 分类：ORM框架
- 分组：7 EhCachePlugin
CacheInterceptor可以将action所需数据全部缓存起来，下次请求到来时如果cache存在则直接使用数据并render，而不会去调用action。此用法可使action完全不受cache相关代码所污染，即插即用，以下是示例代码：

```java
@Before(CacheInterceptor.class)
public void list() {
    List<Blog> blogList = Blog.dao.find("select * from blog");
    User user = User.dao.findById(getParaToInt());
    setAttr("blogList", blogList);
    setAttr("user", user);
    render("blog.html");
}
```

上例中的用法将使用actionKey作为cacheName，在使用之前需要在ehcache.xml中配置以actionKey命名的cache如：，注意actionKey作为cacheName配置时斜杠”/”不能省略。此外CacheInterceptor还可以与CacheName 注解配合使用，以此来取代默认的actionKey作为cacheName，以下是示例代码：

```java
@Before(CacheInterceptor.class)
@CacheName("blogList")
public void list() {
    List<Blog> blogList = Blog.dao.find("select * from blog");
    setAttr("blogList", blogList);
    render("blog.html");
}
```

以上用法需要在ehcache.xml中配置名为blogList的cache如：。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
