# 04、Shiro 实战：Shiro工作流程
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/4.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
在上一篇总结中我们已经将Spring与Shiro的集成框架搭建起来了，下面就来简单看一下Shiro的整个工作流程。

之前由于配置在shiroFilter的filterChainDefinitions中配置了一些访问权限：

```xml
<!--  
	配置哪些页面需要受保护. 
	以及访问这些页面需要的权限. 
	1). anon 可以被匿名访问
	2). authc 必须认证(即登录)后才可能访问的页面. 
-->
<property name="filterChainDefinitions">
    <value>
        /login.jsp = anon
        everything else requires authentication:
        /** = authc
    </value>
</property>
```

所以当访问非login.jsp页面以外的页面时(哪怕页面不存在)，都会自动跳转回login.jsp页面。该流程是怎样一回事呢？

回顾我们在测试工程的web.xml中配置的shiroFilter过滤器：

```xml
<filter>
	<filter-name>shiroFilter</filter-name>
	<filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
	<init-param>
		<param-name>targetFilterLifecycle</param-name>
		<param-value>true</param-value>
	</init-param>
</filter>
<filter-mapping>
	<filter-name>shiroFilter</filter-name>
	<url-pattern>/*</url-pattern>
</filter-mapping>
```

实际上在web.xml中配置的shiroFilter过滤器是一个入口，它类似于如Struts2/SpringMVC这种web框架的前端控制器，是安全控制的入口点，其负责读取配置(如ini配置文件)，然后判断URL是否需要登录/权限等操作。当访问任何路径时，会通过web.xml中配置的shiroFilter的拦截器(拦截机制是所有请求“/*”)，

而shiroFilter拦截器会加载配置在Spring配置文件applicationContext.xml中的id同为“shiroFilter”的bean配置，其中的filterChainDefinitions参数定义了一些页面的访问规则，通过这些访问规则来对请求进行拦截或放行。在配置shiroFilter时需要注意一个细节，就是Spring配置文件applicationContext.xml文件中的shiroFilter配置中的id必须与web.xml中的shiroFilter中的属性一致。

如果不一致的话，会抛出NoSuchBeanDefinitionException异常，这是因为web.xml中的shiroFilter

对应的中的类DelegatingFilterProxy实际上是一个Filter的一个代理对象， 默认情况下, Spring会到IOC容器中查找和对应的 filter bean(也可以通过targetBeanName 的初始化参数来配置filter bean的id)。

查看DelegatingFilterProxy源码，其中有这么一段：

```java
protected Filter iniDelegate(WebApplicationContext wac) throws ServletException{
    Filter delegate = wac.getBean(getTargetBeanName(),Filter.class);
    if(){
        delegate,init(getFilterConfig());
    }
}
```

可以看到，DelegatingFilterProxy作为Filter过滤器代理对象，本身是没有过滤机制的，需要加载用户自己配置有校验规则的实体Filter类，而该Filter类需要通过web.xml中配置的属性(即“TargetBeanName”)在Spring的配置文件applicationContext.xml中获取。所以一旦DelegatingFilterProxy找不到相关类，代表这个代理对象就是无用的了，后面也无法执行Shiro的一些校验工作，所以就会抛出NoSuchBeanDefinitionException的异常，提示开发者为该代理对象配置Filter的实体bean，好让其去代理。

综上所述，Shiro的请求处理整体流程如下图：
