# 07、Shiro 实战：实现Shiro认证流程
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/7.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
上一篇我们剖析了Shiro的整个认证思路，这次来动手实现一个简单的Web登录认证程序。

首先在MyEclipse中创建一个Web Project:

然后在lib中加入Shiro/Spring/SpringMVC以及ehcache和日志相关jar：

然后在src下创建Spring配置文件applicationContext.xml以及缓存ehcache.xml文件，在WEB-INF下创建SpringMVC配置文件

具体配置如下：applicationContext.xml：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <!--1. 配置 SecurityManager-->     
    <bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
        <property name="cacheManager" ref="cacheManager"/>
        <property name="realm" ref="shiroRealm"/>
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
    <bean id="shiroRealm" class="com.test.shiro.realms.ShiroRealm"></bean>
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
    <!-- 6. 配置 ShiroFilter. 
    6.1 id 必须和 web.xml 文件中配置的 DelegatingFilterProxy 的 <filter-name> 一致.
       若不一致, 则会抛出: NoSuchBeanDefinitionException. 因为 Shiro 会来 IOC 容器中查找和 <filter-name> 名字对应的 filter bean.
    -->     
    <bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
        <property name="securityManager" ref="securityManager"/>
        <property name="loginUrl" value="/login.jsp"/>
        <property name="successUrl" value="/list.jsp"/>
        <property name="unauthorizedUrl" value="/index.jsp"/>
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
    </bean>
</beans>
```

ehcache.xml：

```xml
<ehcache>
    <diskStore path="java.io.tmpdir"/>
    <cache name="authorizationCache"
           eternal="false"
           timeToIdleSeconds="3600"
           timeToLiveSeconds="0"
           overflowToDisk="false"
           statistics="true">
    </cache>
    <cache name="authenticationCache"
           eternal="false"
           timeToIdleSeconds="3600"
           timeToLiveSeconds="0"
           overflowToDisk="false"
           statistics="true">
    </cache>
    <cache name="shiro-activeSessionCache"
           eternal="false"
           timeToIdleSeconds="3600"
           timeToLiveSeconds="0"
           overflowToDisk="false"
           statistics="true">
    </cache>
    <defaultCache
        maxElementsInMemory="10000"
        eternal="false"
        timeToIdleSeconds="120"
        timeToLiveSeconds="120"
        overflowToDisk="true"
        />
    <cache name="sampleCache1"
        maxElementsInMemory="10000"
        eternal="false"
        timeToIdleSeconds="300"
        timeToLiveSeconds="600"
        overflowToDisk="true"
        />
    <cache name="sampleCache2"
        maxElementsInMemory="1000"
        eternal="true"
        timeToIdleSeconds="0"
        timeToLiveSeconds="0"
        overflowToDisk="false"
        /> 
</ehcache>
```

spring-servlet.xml：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:mvc="http://www.springframework.org/schema/mvc"
	xmlns:context="http://www.springframework.org/schema/context"
	xsi:schemaLocation="http://www.springframework.org/schema/mvc http://www.springframework.org/schema/mvc/spring-mvc-4.0.xsd
		http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-4.0.xsd">
	<context:component-scan base-package="com.test.shiro"></context:component-scan>
	<bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
		<property name="prefix" value="/"></property>
		<property name="suffix" value=".jsp"></property>
	</bean>
	<mvc:annotation-driven></mvc:annotation-driven>
	<mvc:default-servlet-handler/>
</beans>
```

然后在web.xml中配置Spring加载器，SpringMVC前端控制器，以及Shiro的shiroFilter：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
	xmlns="http://java.sun.com/xml/ns/javaee" 
	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd" 
	id="WebApp_ID" version="3.0">
	<!-- Spring加载器 -->
	<context-param>
		<param-name>contextConfigLocation</param-name>
		<param-value>classpath:applicationContext.xml</param-value>
	</context-param>
	<listener>
		<listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
	</listener>
	<!-- SpringMVC 前端控制器 -->
	<servlet>
		<servlet-name>spring</servlet-name>
		<servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
		<load-on-startup>1</load-on-startup>
	</servlet>
	<servlet-mapping>
		<servlet-name>spring</servlet-name>
		<url-pattern>/</url-pattern>
	</servlet-mapping>
	<!-- 
	1. 配置  Shiro 的 shiroFilter.  
	2. DelegatingFilterProxy 实际上是 Filter 的一个代理对象. 默认情况下, Spring 会到 IOC 容器中查找和 
	<filter-name> 对应的 filter bean. 也可以通过 targetBeanName 的初始化参数来配置 filter bean 的 id. 
	-->
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
</web-app>
```

工程结构如下：

然后在WebRoot下创建一个名为login.jsp的页面：

```xml
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>登录</title>
  </head>
  <body>
     <form action="userAuth/login" method="post">
             账号：<input type="text" name="username"><br/><br/>
             密码：<input type="password" name="password"><br/><br/>
       <input type="submit" value="登录">
     </form>
  </body>
</html>
```

可以看到登录请求的名称为“userAuth/login”，由于我们使用的是SpringMVC框架，所以需要编写相应的Controller方法(Handler类)来响应该请求。

在src中创建名为ShiroLoginController的类，并编写相关的请求响应方法：

```java
package com.test.shiro.controller;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.subject.Subject;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
@Controller
@RequestMapping("userAuth")
public class ShiroLoginController {
	@RequestMapping("login")
	public String login(String username,String password){
		//获取当前的Subject
        Subject currentUser = SecurityUtils.getSubject();
        //测试当前用户是否已经被认证(即是否已经登录)
        if (!currentUser.isAuthenticated()) {
            //将用户名与密码封装为UsernamePasswordToken对象
            UsernamePasswordToken token = new UsernamePasswordToken(username, password);
            token.setRememberMe(true);//记录用户
            try {
                currentUser.login(token);//调用Subject的login方法执行登录
            } catch (AuthenticationException e) {//所有认证时异常的父类
                System.out.println("登录失败："+e.getMessage());
            } 
        }
		return "redirect:/list.jsp";
	}
}
```

然后在WebRoot下创建一个list.jsp作为的登录成功后的响应界面：

```xml
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>首页</title>
  </head>
  <body>
     登录成功！欢迎访问首页O(∩_∩)O
     <a href="userAuth/logout">登出</a>
  </body>
</html>
修改index.jsp，因为在applicationContext.xml中设置未授权时默认跳转至index.jsp，所以在
该页面要提示用户没有权限：
<%@ page language="java" import="java.util.*" pageEncoding="utf-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>提示</title>
  </head>
  <body>
    抱歉，没有权限访问该资源！<br>
  </body>
</html>
```

别忘记在applicationContext.xml的shiroFilter对应的url过滤机制中对userAuth域下登入登出请求

放行：

```xml
<property name="filterChainDefinitions">
    <value>
        /login.jsp = anon
        /userAuth/login = anon
        /userAuth/logout = logout
        everything else requires authentication:
        /** = authc
    </value>
</property>
```

其中anon(anonymous)拦截器表示匿名访问(既不需要登录即可访问)。

其中logout表示该Subject对应的用户登出(登出操作由Shiro来执行，无需自定义方法)。

如前面一篇总结所讲，Shiro认证时需要一个Realm。而在上面的applicationContext.xml中已经为securityManager配置了一个realm：

```xml
<bean id="shiroRealm" class="com.test.shiro.realms.ShiroRealm"></bean>
```

所以要在src下创建该realm类：

```java
package com.test.shiro.realms;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.realm.AuthenticatingRealm;
public class ShiroRealm extends AuthenticatingRealm{
	@Override
	protected AuthenticationInfo doGetAuthenticationInfo(
			AuthenticationToken token) throws AuthenticationException {
		// TODO Auto-generated method stub
		return null;
	}
}
```

注意，前面我们说过，如果仅仅需要校验的话，无需实现Realm接口，只需要继承AuthenticatingRealm类，以及实现doGetAuthenticationInfo方法即可。因为在之前剖析Subject的login方法源码的时候知道，其login方法最终调用的是AuthenticatingRealm实现类的doGetAuthenticationInfo方法，而其参数token就是封装的UsernamePasswordToken(可以通过在两个方法中分别调用token.hashCode()来观察是否是一个对象)。

在doGetAuthenticationInfo方法中添加具体校验的逻辑：

```java
package com.test.shiro.realms;
import java.util.HashMap;
import java.util.Map;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.LockedAccountException;
import org.apache.shiro.authc.SimpleAuthenticationInfo;
import org.apache.shiro.authc.UnknownAccountException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.realm.AuthenticatingRealm;
import com.test.shiro.po.User;
public class ShiroRealm extends AuthenticatingRealm{
	private static Map<String,User> userMap = new HashMap<String,User>();
	static{
                //使用Map模拟数据库获取User表信息
		userMap.put("jack", new User("jack","aaa123",false));
		userMap.put("tom", new User("tom","bbb321",false));
		userMap.put("jean", new User("jean","ccc213",true));
	}
	@Override
	protected AuthenticationInfo doGetAuthenticationInfo(
			AuthenticationToken token) throws AuthenticationException {
		//1.把AuthenticationToken转换为UsernamePasswordToken
		UsernamePasswordToken userToken = (UsernamePasswordToken) token;
		//2.从UsernamePasswordToken中获取username
		String username = userToken.getUsername();
		//3.调用数据库的方法，从数据库中查询Username对应的用户记录
		System.out.println("从数据看中获取UserName为"+username+"所对应的信息。");
		//Map模拟数据库取数据
		User u = userMap.get(username);
		//4.若用户不行存在，可以抛出UnknownAccountException
		if(u==null){
			throw new UnknownAccountException("用户不存在");
		}
		//5.若用户被锁定，可以抛出LockedAccountException
		if(u.isLocked()){
			throw new LockedAccountException("用户被锁定");
		}
		//6.根据用户的情况，来构建AuthenticationInfo对象,通常使用的实现类为SimpleAuthenticationInfo
		//以下信息是从数据库中获取的
		//1)principal：认证的实体信息，可以是username，也可以是数据库表对应的用户的实体对象
		Object principal = u.getUsername();
		//2)credentials：密码
		Object credentials = u.getPassword();
		//3)realmName：当前realm对象的name，调用父类的getName()方法即可
		String realmName = getName();
		SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(principal,credentials,realmName);
		return info;
	}
}
```

其中User类：

```java
package com.test.shiro.po;
public class User {
	private String username;
	private String password;
	private boolean Locked;
	public User(String username, String password, boolean locked) {
		super();
		this.username = username;
		this.password = password;
		Locked = locked;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public boolean isLocked() {
		return Locked;
	}
	public void setLocked(boolean locked) {
		Locked = locked;
	}
}
```

**上面的验证的主要核心步骤总结起来为3步：**

1、把AuthenticationToken转换为UsernamePasswordToken

2、从UsernamePasswordToken中获取username

3、预校验(账户存在性，锁定等业务校验)后，将账户信息封装至AuthenticationInfo的某种实现类，返回出去。

所以我们在doGetAuthenticationInfo中做的事情，就是将正确的用户信息封装至AuthenticationInfo类中，返回给Shiro，具体的密码比对验证工作交由Shiro来完成。

我们下面来测试一下认证功能是否成功。首先将工程部署至tomcat中：

启动tomcat，在浏览器中输入“http://localhost:8080/Shiro3/login.jsp”，

可以看到登录界面：

然后输入jack对应的账号密码，点击登录，发现登录成功：

点击“登出”之后，会回到登录界面，然后输入不存在的账号：

可以在后台看到用户不存在的信息：

然后输入正确的账号和错误的密码，在后台可以看到：

其中报错信息中提到了作为密码表标识的credentials是与数据库不匹配的。

最后输入被锁定的jean的账号密码：

可以看到后台提示用户被锁定：

至此我们的一个简单的Shiro校验工程编写完毕。

注意我们使用的AuthenticationInfo对象为SimpleAuthenticationInfo实现类，而一般密码都是会进行加密的，所以当加密的时候要使用其它类型的AuthenticationInfo实现类，这个在下一篇总结中会提到。

**转载请注明出处：[http://blog.csdn.net/acmman/article/details/78397096](http://blog.csdn.net/acmman/article/details/78397096)**
