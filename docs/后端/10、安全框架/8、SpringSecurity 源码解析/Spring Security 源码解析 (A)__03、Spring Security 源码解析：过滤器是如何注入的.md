# 03、Spring Security 源码解析：过滤器是如何注入的
- 来源：https://ddkk.com/zhuanlan/security/springsecurity/10/18.html
- 分类：安全框架
- 分组：Spring Security 源码解析 (A)
### Spring Security主流程总结

Spring Security的主流程主要有以下步骤：

**1、** Servlet容器的初始化过程中创建了DelegatingFilterProxy，并作为第一个过滤器加入到了Servlet容器中，因此在用户发起请求后，DelegatingFilterProxy的doFilter方法将被调用；

**2、** DelegatingFilterProxy的doFilter主要是将过滤转派给beanName为springSecurityFilterChain的过滤器，让springSecurityFilterChain执行过滤；

**3、** springSecurityFilterChain本质上是FilterChainProxy，因此执行过滤的是FilterChainProxy；

**4、** FilterChainProxy的doFilter方法中，先根据SecurityFilterChain的matches方法判断是否满足匹配条件，然后根据getFilters方法获取到默认的过滤器；

**5、** 获取到所有的过滤器后，通过回调的方式循环每一个过滤器；

### Spring Security都有哪些默认的过滤器

以下是Spring Security5.7.1版本的官方文档中列举的默认过滤器

而在FilterComparator类中也定义了一系列的过滤器，这些过滤器就是Spring Security的所有默认声明的过滤器，而不是真正被注入的默认过滤器。

### Spring Security的默认过滤器是如何注入的

已经了解了所有声明的过滤器，那么哪些过滤器被真正的注入，然后执行了呢？

以注入默认过滤器CsrfFilter为例，之前的篇章已经讲解了SpringSecurity主流程，我们已经知道会创建springSecurityFilterChain。

在创建springSecurityFilterChain的时候，会去调用WebSecurityConfigurerAdapter的init方法，在init方法中会调用getHttp方法来获取HttpSecurity对象。

在创建HttpSecurity对象时就会调用csrf方法，接着会将CsrfConfigurer对象放入到this.configurers这个map集合中。

调用完init方法后，会接着调用configure方法，然后在configure方法中循环调用this.configurers这个map集合中的所有元素的configure方法，也就是会调用CsrfConfigurer的configure方法。

在CsrfConfigurer的configure方法中，会调用FilterComparator的isRegistered方法来判断要注入的过滤器是否在FilterComparator声明过，如果校验通过，将会把CsrfFilter添加到HttpSecurity的filters集合中。

然后在创建HttpSecurity对象时就会将带有CsrfFilter的过滤器集合作为构造参数传入，以此创建出默认过滤器链。至此，CsrfFilter就实现了注入。

以上只是以注入CsrfFilter为例。下方图片中，红色框框标记的方法中注入了大部分其他类型的过滤器，整个流程和注入CsrfFilter是一致的。

### 后续篇幅摘要

下个篇章主要讲解**Spring Security的三个config方法。**
