# 11、Shiro 实战：Shiro多 Realm 验证
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/11.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。上一篇讲解了Shiro的密码MD5加盐校验，下面来讲解Shiro的多Realm验证。在我们之前的样例中，一直使用的是ShiroRealm来获取数据源中的账号密码封装信息的，而该Realm配置在securityManager中

```xml
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
    <property name="cacheManager" ref="cacheManager"/>
    <property name="realm" ref="shiroRealm"/>
</bean>
```

而在实际的业务场景中，会遇到安全数据存储在不同的数据库中的情况(例如两库用户登录同一系统)，比如一个是Mysql数据库中的数据，一个是Oracle数据库中的数据，其中Mysql中使用的加密算法是MD5，而Oracle中使用的加密算法是SHA1或其它与Mysql不同的加密算法。此时我们进行用户登录认证的时候，就需要同时访问这两个数据库，也就需要多个Realm。

我们通过查看源码，来看一下Subject的login方法底层是如何使用Realm校验的。在login的深层，会调用ModularRealmAuthenticator的doAuthenticate()方法，该方法如下：

```java
protected AuthenticationInfo doAuthenticate(AuthenticationToken authenticationToken) throws AuthenticationException {
    assertRealmsConfigured();
    Collection<Realm> realms = getRealms();
    if (realms.size() == 1) {
        return doSingleRealmAuthentication(realms.iterator().next(), authenticationToken);
    } else {
        return doMultiRealmAuthentication(realms, authenticationToken);
    }
}
```

可以看到，该方法中通过getRealms()获取Realm集合，如果realm只有一个，走的是doSingleRealmAuthentication方法，如果有多个，走的是doMultiRealmAuthentication方法。所以当我们使用ModularRealmAuthenticator类来配置多个Realm的时候，Shiro会使用我们配置的多个Realm进行认证。

我们先回顾一下ShiroRealm类的代码：

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
}
```

该ShiroRealm使用MD5加盐算法，为密码加密，并且采用MD5策略封装认证信息。

下面我们来进行多Realm认证的编写，首先创建一个名为“SecordRealm”的Realm类，复制之前ShiroRealm的代码，将加密方式改为“SHA1”，新增3个用户名不同的测试账户：

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
public class SecordRealm extends AuthenticatingRealm{
	private static Map<String,User> userMap = new HashMap<String,User>();
	static{
		//使用Map模拟数据库获取User表信息
		userMap.put("jack2", new User("jack2","837b21a5a86ed8df842a4c2114a8b9f7d7c6d02d",false));//密码明文：aaa123
		userMap.put("tom2", new User("tom2","ca578a1c0498fb93b7b0f06e30b2eecd155930db",false));//密码明文：bbb321
		userMap.put("jean2", new User("jean2","d523305baa947918891aaa578d7b195d3122d8d0",true));//密码明文：ccc213
	}
	@Override
	protected AuthenticationInfo doGetAuthenticationInfo(
			AuthenticationToken token) throws AuthenticationException {
		System.out.println("[SecordRealm]");
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
		SimpleAuthenticationInfo info = null; 
		info = new SimpleAuthenticationInfo(principal, credentials, credentialsSalt, realmName);
		return info;
	}
}
```

然后将该Realm配置到Spring的IOC容器中，即在Spring的applicationContext.xml配置文件中加入SecordRealm类的Bean配置：

```xml
<bean id="secordRealm" class="com.test.shiro.realms.SecordRealm">
	<property name="credentialsMatcher">
	    <bean class="org.apache.shiro.authc.credential.HashedCredentialsMatcher">
	        <property name="hashAlgorithmName" value="SHA1"></property>
	        <property name="hashIterations" value="1024"></property>
	    </bean>
	</property>
</bean>
```

为了实现多Realm校验，需要把这两个Realm(之前的ShiroRealm和现在的secordRealm)配置到ModularRealmAuthenticator认证器中：

```xml
<!-- 认证器 -->
<bean id="authenticator" class="org.apache.shiro.authc.pam.ModularRealmAuthenticator">
    <property name="realms">
        <list>
            <ref bean="shiroRealm"/>
            <ref bean="secordRealm"/>
        </list>
    </property>
</bean>
```

然后删除之前securityManager中配置的单个Realm，替换为上面的authenticator认证器：

```xml
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
    <property name="cacheManager" ref="cacheManager"/>
    <property name="authenticator" ref="authenticator"/>
</bean>
```

我们分别在不同的Realm的doGetAuthenticationInfo方法前面加一个打印，以此在控制台中可以看到Shiro使用了哪个Realm进行凭证获取：

```java
System.out.println("[ShiroRealm]");
```

```java
System.out.println("[SecordRealm]");
```

然后我们重新启动Shiro3工程，进行测试：

进入登录界面，我们分别输入jack和jack2的账号信息：

发现都会从两个Realm中获取认证信息：

获取Realm认证信息的顺序，就是ModularRealmAuthenticator认证器中realms集合的顺序。

这里我们其实还需要知道，两个Realm时，怎么才能知道认证通过了？是一个Realm通过了就通过，还是全部

Realm通过了才通过，还是其它？这就牵扯到了认证策略，下一篇我们继续讲解。
