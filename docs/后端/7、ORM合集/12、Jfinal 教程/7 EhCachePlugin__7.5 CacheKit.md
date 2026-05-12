# 7.5 CacheKit
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/72.html
- 分类：ORM框架
- 分组：7 EhCachePlugin
CacheKit是缓存操作工具类，以下是示例代码：

```java
public void list() {
    List<Blog> blogList = CacheKit.get("blog", "blogList");
    if (blogList == null) {
       blogList = Blog.dao.find("select * from blog");
       CacheKit.put("blog", "blogList", blogList);
    }
    setAttr("blogList", blogList);
    render("blog.html");
}
```

CacheKit 中最重要的两个方法是get(String cacheName, Object key)与put(String cacheName, Object key, Object value)。get方法是从cache中取数据，put方法是将数据放入cache。参数cacheName与ehcache.xml中的name属性值对应；参数key是指取值用到的key；参数value是被缓存的数据。

以下代码是CacheKit中重载的CacheKit.get(String, String, IDataLoader)方法使用示例：

```java
public void list() {
    List<Blog> blogList = CacheKit.get("blog", "blogList", new IDataLoader(){
       public Object load() {
           return Blog.dao.find("select * from blog");
    }});
    setAttr("blogList", blogList);
    render("blog.html");
}
```

CacheKit.get方法提供了一个IDataLoader接口，该接口中的load()方法在缓存值不存在时才会被调用。该方法的具体操作流程是：首先以cacheName=blog以及key=blogList为参数去缓存取数据，如果缓存中数据存在就直接返回该数据，不存在则调用IDataLoader.load()方法来获取数据。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
