# 22、Shiro 实战：Shiro之记住我
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/22.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。在我们登录一些网站的时候，在登录输入框的下侧一般都会有一个“记住我”的勾选框，选择之后，我们下次进入网站的时候就会自动进行登录操作，无需我们再次输入密码。而在访问一些敏感信息的时候，还是需要进行登录操作的。

有关“记住我”的实现原理如下：

**1、** 首先在登录页面选中“记住我”然后登录成功；如果是浏览器登录，一般会把“记住我”的Cookie写到客户端并保存下来。
**2、** 关闭浏览器再重新打开，会发现浏览器还是记住你的；

**3、** 访问一般的网页服务器端还是知道你是谁，且能正常访问；

**4、** 但是比如我们访问淘宝时，如果要查看我的订单或进行支付时，此时还是需要再进行身份认证的；

以确保当前用户还是你。

Shiro出了提供了登录时的“认证”操作，同时也提供了“记住我”的操作实现，那么两个有何区别呢？

**(1)subject.isAuthenticated()**

表示用户进行了身份验证登录的，即使用Subject.login进行了登录；

**(2)subject.isRemembered()**

表示用户是通过“记住我”登录的，此时可能并不是真正的你（如其他人使用你的电脑，或者你的cookie被窃取）在访问的，两者二选一，即subject.isAuthenticated()==true，则subject.isRemembered()==false；反之一样。

相关建议：

**(1)访问一般网页**

如个人在主页之类的，我们使用user拦截器即可，user拦截器只要用户登录 (isRemembered()||isAuthenticated())过即可访问成功。

**(2)访问特殊网页**

如提交订单页面，我们使用authc拦截器即可，authc拦截器会判断用户是否是通过Subject.login（isAuthenticated()==true）登录的，如果是才放行，否则会跳转到登录页面叫你重新登录。

下面演示一下使用Shiro实现“记住我”的效果。记得在之前的Web测试工程中，我们在Spring的application.xml配置文件中的shiroFilter中未相关服务请求配置过权限限定：

```xml
<!-- 6. 配置 ShiroFilter. 
6.1 id 必须和 web.xml 文件中配置的 DelegatingFilterProxy 的 <filter-name> 一致.
   若不一致, 则会抛出: NoSuchBeanDefinitionException. 因为 Shiro 会来 IOC 容器中查找和 <filter-name> 名字对应的 filter bean.
-->     
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <property name="loginUrl" value="/login.jsp"/>
    <property name="successUrl" value="/list.jsp"/>
    <property name="unauthorizedUrl" value="/index.jsp"/>
    <property name ="filterChainDefinitionMap" ref="filterChainDefinitionMap"></property>
</bean>
<bean id="filterChainDefinitionMap"
    factory-bean="filterChainDefinitionMapBuilder" factory-method="buildFilterChainDefinitionMap"/>
<!-- 配置一个bean，该bean实际上是一个Map，通过实例工厂方法的方式 -->
<bean id="filterChainDefinitionMapBuilder"
    	class="com.test.shiro.factory.FilterChainDefinitionMapBuilder"/>
```

而在FilterChainDefinitionMapBuilder中返回了含有页面授权信息的Map：

```java
package com.test.shiro.factory;
import java.util.LinkedHashMap;
public class FilterChainDefinitionMapBuilder {
    public LinkedHashMap<String,String> buildFilterChainDefinitionMap(){
    	LinkedHashMap<String,String> map = new LinkedHashMap<>();
    	/*配置哪些页面需要受保护. 
    	以及访问这些页面需要的权限. 
    	1). anon 可以被匿名访问
    	2). authc 必须认证(即登录)后才可能访问的页面. 
    	3). logout 登出
    	4). roles 角色过滤器*/
    	map.put("/login.jsp","anon");
    	map.put("/userAuth/login","anon");
    	map.put("/userAuth/logout","logout");
    	map.put("/User.jsp","authc,roles[user]");//需要认证并且有user角色
    	map.put("/admin.jsp","authc,roles[admin]");//需要认证并且有admin角色
    	map.put("/**","authc");
    	return map;
    }
}
```

注：这里使用filterChainDefinitionMapBuilder实例工厂从Java类中获取页面权限限定的Map，当然也可以使用filterChainDefinitions属性在XML中直接配置页面权限。

可以看到一些页面进行了权限限定，后面跟着的就是拦截器的配置代号，常用的身份验证相关的权限拦截器代号如下：

然后现在我们需要让用户仅需要通过“记住我”就可以访问Web系统的“list.jsp”页面：

我们需要在FilterChainDefinitionMapBuilder的buildFilterChainDefinitionMap方法的Map中添加“list.jsp”页面的权限限定，将其限定为“user”用户拦截器，即用户通过身份验证或“记住我”都可以访问：

```java
package com.test.shiro.factory;
import java.util.LinkedHashMap;
public class FilterChainDefinitionMapBuilder {
    public LinkedHashMap<String,String> buildFilterChainDefinitionMap(){
    	LinkedHashMap<String,String> map = new LinkedHashMap<>();
    	/*配置哪些页面需要受保护. 
    	以及访问这些页面需要的权限. 
    	1). anon 可以被匿名访问
    	2). authc 必须认证(即登录)后才可能访问的页面. 
    	3). logout 登出
    	4). roles 角色过滤器*/
    	map.put("/login.jsp","anon");
    	map.put("/userAuth/login","anon");
    	map.put("/userAuth/logout","logout");
    	map.put("/User.jsp","authc,roles[user]");//需要认证并且有user角色
    	map.put("/admin.jsp","authc,roles[admin]");//需要认证并且有admin角色
    	map.put("/list.jsp","user");//认证过或“记住我”都可访问list.jsp
    	map.put("/**","authc");
    	return map;
    }
}
```

然后记得之前我们在登录Controller的login服务中，在登录验证成功之后，会设置“记住我”为true：

```java
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
```

同时回顾一下我们的授权Realm，里面有模拟数据库的四个测试账号：

```java
package com.test.shiro.realms;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.LockedAccountException;
import org.apache.shiro.authc.SimpleAuthenticationInfo;
import org.apache.shiro.authc.UnknownAccountException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.crypto.hash.SimpleHash;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.ByteSource;
import com.test.shiro.po.User;
public class ShiroRealm extends AuthorizingRealm{
	private static Map<String,User> userMap = new HashMap<String,User>();
	static{
		//使用Map模拟数据库获取User表信息
		userMap.put("administrator", new User("administrator","5703a57069fce1f17882d283132229e0",false));//密码明文：aaa123
		userMap.put("jack", new User("jack","43e66616f8730a08e4bf1663301327b1",false));//密码明文：aaa123
		userMap.put("tom", new User("tom","3abee8ced79e15b9b7ddd43b95f02f95",false));//密码明文：bbb321
		userMap.put("jean", new User("jean","1a287acb0d87baded1e79f4b4c0d4f3e",true));//密码明文：ccc213
	}
	@Override
	protected AuthenticationInfo doGetAuthenticationInfo(
			AuthenticationToken token) throws AuthenticationException {
		System.out.println("[ShiroRealm]");
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
		//7.根据用户的情况，来构建AuthenticationInfo对象,通常使用的实现类为SimpleAuthenticationInfo
		//以下信息是从数据库中获取的
		//1)principal：认证的实体信息，可以是username，也可以是数据库表对应的用户的实体对象
		Object principal = u.getUsername();
		//2)credentials：密码
		Object credentials = u.getPassword();
		//3)realmName：当前realm对象的name，调用父类的getName()方法即可
		String realmName = getName();
		//4)credentialsSalt盐值
		ByteSource credentialsSalt = ByteSource.Util.bytes(principal);//使用账号作为盐值
		SimpleAuthenticationInfo info = null; //new SimpleAuthenticationInfo(principal,credentials,realmName);
		info = new SimpleAuthenticationInfo(principal, credentials, credentialsSalt, realmName);
		return info;
	}
	//给Shiro的授权验证提供授权信息
	@Override
	protected AuthorizationInfo doGetAuthorizationInfo(
			PrincipalCollection principals) {
		//1.从principals中获取登录用户的信息
		Object principal = principals.getPrimaryPrincipal();
		//2.利用登录用户的信息获取当前用户的角色（有数据库的话，从数据库中查询）
		Set<String> roles = new HashSet<String>();//放置用户角色的set集合(不重复)
		roles.add("user");//放置所有用户都有的普通用户角色
		if("administrator".equals(principal)){
			roles.add("admin");//当账号为administrator时，添加admin角色
		}
		//3.创建SimpleAuthorizationInfo，并设置其roles属性
		SimpleAuthorizationInfo info = new SimpleAuthorizationInfo(roles);
		//4.返回SimpleAuthorizationInfo对象
		return info;
	}
}
```

list.jsp页面代码：

```xml
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%@ taglib prefix="shiro" uri="http://shiro.apache.org/tags" %>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>首页</title>
  </head>
  <body>
     登录成功！欢迎<shiro:principal/>访问首页O(∩_∩)O
   <a href="userAuth/logout">登出</a>
   <br/><br/>
   <a href="admin.jsp">Admin Page</a>
   <br/><br/>
   <a href="User.jsp">User Page</a>
  </body>
</html>
```

此时我们启动Web系统，然后登录一个普通用户“jack”(doGetAuthorizationInfo会自动分配“user”权限)：

让后进入首页list.jsp：

此时分别点击admin.jsp和User.jsp的超链接是一个可进入一个不可进入

(因为普通用户只有user角色，没有admin角色)：

那么这个时候关闭浏览器，重新打开，这个时候访问admin.jsp/User.jsp都访问不了，会直接跳回登录页：

而直接去访问list.jsp，发现依然可以：

这就说明list.jsp/admin.jsp/user.jsp页面访问权限过滤是有效的，特别是list.jsp，不管是登录认证，还是“记住我”都可以。

实际开发时会在登录页面放置一个checkBox复选框，让用户勾选是否“记住我”，以此来判断是否在后台调用“token.setRememberMe(true);”方法。

最后，我们可以给RememberMe设置一个生效时长（一个月/一年等），如何设置呢？我们在登录时，会使用securityManager配置的实现类DefaultWebSecurityManager，在其中含有rememberMeManager对象，其中含有一个cookie对象，在cookie对象中有一个名为maxAge的参数，代表了“记住我”的默认最大生效时间：

可以看到默认为31536000秒。所以我们可以通过设置securityManager的rememberManager的cookie对象的maxAge参数，来设置rememberMe的生效时间：

```xml
<!--1. 配置 SecurityManager-->     
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
    <property name="cacheManager" ref="cacheManager"/>
    <property name="authenticator" ref="authenticator"/>
    <property name="realms">
        <list>
            <ref bean="shiroRealm"/>
            <ref bean="secordRealm"/>
        </list>
    </property>
    <!-- 设置rememeberMe的时常为30分钟(1800秒) -->
    <property name="rememberMeManager.cookie.maxAge" value="1800"></property>
</bean>
```
