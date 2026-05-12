# 06、Spring Security 源码解析：如何自定义过滤器
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/21.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (A)
### 如何自定义过滤器

自定义过滤器需要继承GenericFilterBean，然后实现doFilter方法。

然后在configure(HttpSecurity http)中，调用addFilterBefore、addFilterAfter、addFilter、addFilterAt将自定义的过滤器注入到默认过滤器中。

以addFilterBefore为例，addFilterBefore的主要功能是将自定义的过滤器添加到指定过滤器之前。接下来看看，它是如何实现的吧！

以上只是在FilterComparator的filterToOrder集合里，在指定的过滤器前注入了自定义的过滤器。我们之前的源码也分析过，FilterComparator只是一个比较器，类似于声明，只有在FilterComparator里面定义过的过滤器，才能添加到HttpSecurity的filters集合中，实现真正的过滤。

### GenericFilterBean是什么

自定义过滤器需要继承GenericFilterBean，那什么是GenericFilterBean呢？

GenericFilterBean是SpringMVC提供的过滤器的基本实现，可以看到GenericFilterBean实现了很多的接口，Filter接口标志这个类可以作为过滤器使用、ServletContextAware获取Servlet容器上下文等。

GenericFilterBean作为过滤器的实现，最主要的就是init方法。GenericFilterBean对Filter的init方法进行了重写，最主要的功能就是获取到web.xml中配置的标签的值，并设置为bean的属性。

从上面两张图可以看到，GenericFilterBean的子类如果调用了addRequiredProperty方法，添加了需要加载的属性值，后续就可以从ServletContext中获取到对应的init-param的值，赋值给对应的bean属性。如果没有调用addRequiredProperty方法添加需要加载的属性值，那么就不会从ServletContext中获取init-param。

后续它们都会去调用initFilterBean方法，这个方法是由子类去实现的，像DelegatingFilterProxy就实现了initFilterBean方法。

**总结来说就是GenericFilterBean可以获取到web.xml中配置的标签的值，同时也提供了统一的destory方法（destory方法就暂不做分析了，有兴趣的可以自己了解下）。**

```java
而我们采用继承GenericFilterBean的方式来创建自定义的过滤器，其实如果不需要获取web.xml中配置的<init-param>标签的值，也可以采用实现Filter接口的方式来自定义过滤器！
```

### [完]
