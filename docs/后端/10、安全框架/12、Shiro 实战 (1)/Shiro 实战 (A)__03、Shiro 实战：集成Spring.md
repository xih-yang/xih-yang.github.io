# 03、Shiro 实战：集成Spring
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/3.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
**1、** 引入shiro的依赖shiro-all包括shiro所有的jar包，如：核心包shiro-core，与web整合的shiro-web、与spring整合的shiro-spring、与任务调度quartz整合的shiro-quartz等；

```xml
<dependency>
   <groupId>org.apache.shiro</groupId>
   <artifactId>shiro-all</artifactId>
   <version>1.2.3</version>
</dependency>
```

**2、** 在web.xml中配置shiroFilter；

```xml
<!-- 
1. 配置  Shiro 的 shiroFilter.  
2. DelegatingFilterProxy 实际上是 Filter 的一个代理对象. 默认情况下, Spring 会到 IOC 容器中查找和 
<filter-name> 对应的 filter bean. 也可以通过 targetBeanName 的初始化参数来配置 filter bean 的 id.-->
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

Shiro 提供了与 Web 集成的支持，其通过一个 ShiroFilter 入口来拦截需要安全控制的URL，然后进行相应的控制。 ShiroFilter 类似于如 Strut2和SpringMVC 这种 web 框架的前端控制器，是安全控制的入口点，其负责读取配置（如ini 配置文件），然后判断URL 是否需要登录和权限等工作。

DelegatingFilterProxy 作用是自动到 Spring 容器查找名字为 shiroFilter（filter-name）的 bean 并把所有 Filter 的操作委托给它。

**3、** 在Spring的配置文件applicationContext.xml中配置shiro；

```xml
<!-- 1. 配置 SecurityManager -->
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
    <property name="cacheManager" ref="cacheManager"/>
    <property name="realm" ref="jdbcRealm"/>
</bean>
<!--
    2. 配置 CacheManager.
    2.1 需要加入 ehcache 的 jar 包及配置文件.
-->     
<bean id="cacheManager" class="org.apache.shiro.cache.ehcache.EhCacheManager">
    <property name="cacheManagerConfigFile" value="classpath:ehcache.xml"/> 
</bean>
<!-- 
	3. 配置 Realm 
	3.1 直接配置实现了 org.apache.shiro.realm.Realm 接口的 bean
-->     
<bean id="jdbcRealm" class="com.atguigu.shiro.realms.ShiroRealm"></bean>
<!--  
    4. 配置 LifecycleBeanPostProcessor. 可以自定的来调用配置在 Spring IOC 容器中 shiro bean 的生命周期方法.
-->       
<bean id="lifecycleBeanPostProcessor" class="org.apache.shiro.spring.LifecycleBeanPostProcessor"/>
<!--  
    5. 启用 IOC 容器中使用 shiro 的注解. 但必须在配置了 LifecycleBeanPostProcessor 之后才可以使用.
-->     
<bean class="org.springframework.aop.framework.autoproxy.DefaultAdvisorAutoProxyCreator"
      depends-on="lifecycleBeanPostProcessor"/>
<bean class="org.apache.shiro.spring.security.interceptor.AuthorizationAttributeSourceAdvisor">
    <property name="securityManager" ref="securityManager"/>
</bean>
<!--  
    6. 配置 ShiroFilter.
    6.1 id 必须和 web.xml 文件中配置的 DelegatingFilterProxy 的 <filter-name> 一致.
           若不一致, 则会抛出: NoSuchBeanDefinitionException. 因为 Shiro 默认会来 IOC 容器中查找和 <filter-name> 名字对应的 filter bean
-->     
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <!-- 配置登录页面 -->
    <property name="loginUrl" value="/login.jsp"/>
    <!-- 配置登录成功页面 -->
    <property name="successUrl" value="/list.jsp"/>
    <!-- 配置没有权限页面 -->
    <property name="unauthorizedUrl" value="/unauthorized.jsp"/>
    <!--  
    	配置哪些页面需要受保护. 
    	以及访问这些页面需要的权限. 
    	1). anon 可以被匿名访问
    	2). authc 必须认证(即登录)后才可能访问的页面. 
    	3). logout 登出.
    	4). roles 角色过滤器
    -->
    <property name="filterChainDefinitions">
        <value>
            /login.jsp = anon
            /shiro/login = anon
            /shiro/logout = logout
            /user.jsp = roles[user]
            /admin.jsp = roles[admin]
            /** = authc
        </value>
    </property>
</bean>
```

添加ehcache依赖

```xml
<dependency>            
	<groupId>net.sf.ehcache</groupId>            
	<artifactId>ehcache-core</artifactId>            
	<version>2.6.6</version>        
</dependency>
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

创建类ShiroRealm 实现 Realm 接口

```java
public class ShiroRealm implements Realm {
	@Override
	public AuthenticationInfo getAuthenticationInfo(AuthenticationToken token)
			throws AuthenticationException {
		return null;
	}
	@Override
	public String getName() {
		return null;
	}
	@Override
	public boolean supports(AuthenticationToken token) {
		return null;
	}
}
```

注意：在Spring配置文件中配置ShiroFilter时，必须和 web.xml 文件中配置的 DelegatingFilterProxy 的 `` 一致。若不一致，则会抛出: NoSuchBeanDefinitionException。因为 Shiro 默认会来 IOC 容器中查找和 `` 名字对应的 filter。此外我们也可以通过 targetBeanName 的初始化参数来配置 filter bean 的 id。

```xml
<filter>
  <filter-name>shiroFilter</filter-name>
     <filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
     <init-param>
         <param-name>targetFilterLifecycle</param-name>
         <param-value>true</param-value>
     </init-param>
	 <init-param>
	 	<param-name>targetBeanName</param-name>
	 	<param-value>abc</param-value>
	 </init-param>
 </filter>
 <filter-mapping>
     <filter-name>shiroFilter</filter-name>
     <url-pattern>/*</url-pattern>
 </filter-mapping>
```

那么在Spring配置文件中配置ShiroFilter时，ShiroFilter的id应该为targetBeanName 指定的abc

```xml
<bean id="abc" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
```
