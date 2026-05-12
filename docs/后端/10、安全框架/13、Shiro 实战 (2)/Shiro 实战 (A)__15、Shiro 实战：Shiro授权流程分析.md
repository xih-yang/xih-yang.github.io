# 15、Shiro 实战：Shiro授权流程分析
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/15.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。上一篇讲解了Shiro授权的相关基础知识，并实验了“roles”拦截器的效果。可惜的是没有给用户进行授权工作，所以没有验证拥有角色后的权限校验工作。下面就来讲解一下Shiro的授权流程。

之前我们使用过认证的Realm，他是进行登录认证时提供认证数据的关键类，其继承了AuthenticatingRealm父类，并实现了doGetAuthenticationInfo抽象方法提供认证数据。那么我们的授权数据获取，继承AuthenticatingRealm是不够的，需要继承AuthenticatingRealm的子类AuthorizingRealm，并实现其抽象方法doGetAuthorizationInfo。

因为AuthorizingRealm授权Realm是AuthenticatingRealm认证Realm的子类，所以AuthorizingRealm既可以提供授权数据也可以提供认证数据，所以要实现认证与授权，只需要继承AuthorizingRealm类即可。

这里写一个Test类，继承AuthorizingRealm：

```java
package com.test.shiro.realms;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
public class TestRealm extends AuthorizingRealm{
	//用于授权的方法
	@Override
	protected AuthorizationInfo doGetAuthorizationInfo(
			PrincipalCollection principals) {
		// TODO Auto-generated method stub
		return null;
	}
	//用于认证的方法
	@Override
	protected AuthenticationInfo doGetAuthenticationInfo(
			AuthenticationToken token) throws AuthenticationException {
		// TODO Auto-generated method stub
		return null;
	}
}
```

可以看到，继承了AuthorizingRealm中之后，就要实现其两个方法：doGetAuthenticationInfo、doGetAuthorizationInfo上面两个方法分别用于为校验提供认证信息和授权信息。因为Subject的login方法会调用Realm的doGetAuthenticationInfo获取认证信息进行密码比对，而Subject的hasRole、hasPermission等方法会调用Realm的doGetAuthorizationInfo获取授权信息进行权限判定。

这里需要注意的一点，当我们配置了多个Realm授权时，如何判定是授权通过呢？

我们通过Subject的hasRole源码可看到：

上面可以看到执行了securityManager的hasRole方法，而securityManager根据不同情况会继承不同的类：

而其中的ModularRealmAuthorizer就是当有多个Realm时，securityManager继承的类。此时securityManager的hasRole的实现为ModularRealmAuthorizer父类的实现：

可以从上面的方法中得知，当配置有多个Realm时，只要一个Realm有该权限，那么就直接通过。

下面我们来实现授权Realm：

之前在Shiro3工程中有一个认证Realm为ShiroRealm，其继承了AuthenticatingRealm父类并实现了doGetAuthenticationInfo为系统的登录认证提供认证信息：

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
import org.apache.shiro.crypto.hash.SimpleHash;
import org.apache.shiro.realm.AuthenticatingRealm;
import org.apache.shiro.util.ByteSource;
import com.test.shiro.po.User;
public class ShiroRealm extends AuthenticatingRealm{
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
	public static void main(String[] args) {
		User u = null;
		Iterator<String> it = userMap.keySet().iterator();
		while(it.hasNext()){
			u = userMap.get(it.next());
			String hashAlgorithmName = "MD5";//加密方式
			Object crdentials = u.getPassword();//密码原值
			ByteSource salt = ByteSource.Util.bytes(u.getUsername());//以账号作为盐值
			int hashIterations = 1024;//加密1024次
			Object result = new SimpleHash(hashAlgorithmName,crdentials,salt,hashIterations);
			System.out.println(u.getUsername()+":"+result);
		}
	}
}
```

我们修改之前Shiro3工程中的ShiroRealm，将其原来继承的AuthenticatingRealm父类更换为AuthorizingRealm类，并实现其doGetAuthorizationInfo方法用于提供授权信息：

```java
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
```

由于这里我们没有数据库，仅仅用数据模拟角色添加，设置当登录账号为“adminstrator”时，为其添加admin角色。

记得上一篇我们在shiroFilter中配置了User.jsp与admin.jsp的访问权限：

```xml
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
    	3). logout 登出
    	4). roles 角色过滤器
    -->
    <property name="filterChainDefinitions">
        <value>
            /login.jsp = anon
            /userAuth/login = anon
            /userAuth/logout = logout
            /User.jsp = roles[user]
            /admin.jsp = roles[admin]
            everything else requires authentication:
            /** = authc
        </value>
    </property>
</bean>
```

然后主页list.jsp：

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
   <br/><br/>
   <a href="admin.jsp">Admin Page</a>
   <br/><br/>
   <a href="User.jsp">User Page</a>
  </body>
</html>
```

User.jsp:

```xml
<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>user page</title>
  </head>
  <body>
    This is User page. <br>
  </body>
</html>
```

admin.jsp:

```xml
<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <title>admin page</title>
  </head>
  <body>
    This is Admin page. <br>
  </body>
</html>
```

无权限时unauthorizedUrl指向的index.jsp页面：

```xml
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

下面使用jack普通用户登录：

然后点击User Page，发现可以进入：

然后点击Admin Page，发现没有权限：

接下来换administrator账号登录，然后点击User Page，发现可以进入：

再去点击Admin Page，发现也可以进入：

至此，我们实现了Shiro的一个完整的授权流程。
