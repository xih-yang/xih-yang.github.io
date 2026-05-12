# 21、Shiro 实战：Shiro缓存
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/21.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。在使用Shiro框架进行授权或者权限管理时，可以利用Shiro框架的缓存特性来提高系统的性能。那么如何来实现Shiro的缓存效果呢？

Shiro中提供了一个CacheManagerAware接口，实现此接口的类都可以进行缓存的一些基础操作。同理也即是说Realm实现了CacheManagerAware接口就可以操作缓存。

当我们的Realm实现了CacheManagerAware接口或继承了实现CacheManagerAware接口的父类的时候，在Shiro内部有组件（DefaultSecurityManager）会自动检测相应的对象（如Realm）是否实现了CacheManagerAware并自动注入相应的CacheManager。

Shiro提供了一个叫CachingRealm的Realm类，它实现了CacheManagerAware接口，所以该Realm提供了缓存的一些基础实现；

那么我们自己创建的，继承AuthorizingRealm类的自定义Realm其实是可以直接操作缓存的，因为自定义Realm继承的AuthorizingRealm类继承了AuthenticatingRealm类，而AuthenticatingRealm类继承了CachingRealm类：

正如上面所说，CachingRealm类实现了CacheManagerAware接口，可以操作缓存：

所以说我们的Realm是有缓存的。

下面我们通过一个授权操作来看一下在Realm缓存的效果。

首先回顾一下名为“Shiro3”的Web工程中的“ShiroRealm”类：

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

然后我们在doGetAuthorizationInfo方法的“Object principal = principals.getPrimaryPrincipal();”处打断点，然后运行Web程序，在登录界面登录账号为“jack”的账户：

然后进入了断点：

这说明是第一次登录，此时系统还没有授权信息的缓存，会调用doGetAuthorizationInfo的方法获取用户的授权信息。然后再一次访问页面之后，因为上一次缓存了用户的授权信息，所以就不会再进入doGetAuthorizationInfo方法的断点了。

而前面说到，Shiro内部组件DefaultSecurityManager会自动检测相应的对象（如Realm）是否实现了CacheManagerAware并自动注入相应的CacheManager。那么也就是说如果不注入CacheManager就无法实现缓存的效果，所以在Web工程的Spring配置文件application.xml中是配置了CacheManager的：

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
</bean>
<!--  
2. 配置 CacheManager. 
2.1 需要加入 ehcache 的 jar 包及配置文件. 
-->     
<bean id="cacheManager" class="org.apache.shiro.cache.ehcache.EhCacheManager">
    <property name="cacheManagerConfigFile" value="classpath:ehcache.xml"/> 
</bean>
```

如果我们将以及下面相关Bean配置去掉，那么Realm将失去缓存效果，也就是说每一次进入系统的页面时，都需要去访问doGetAuthorizationInfo方法来获取缓存，这种操作是十分耗费性能的，这也是缓存存在的意义。

实际上在配置Realm的时候，还可以设置Realm缓存的一些属性：

而同意我们可以在ehcache配置文件ehcache.xml中可以设置这些缓存属性：

```xml
<ehcache>
    <diskStore path="java.io.tmpdir"/>
    <!-- 授权的时候使用的缓存策略 -->
    <cache name="authorizationCache"
           eternal="false"
           timeToIdleSeconds="3600"
           timeToLiveSeconds="0"
           overflowToDisk="false"
           statistics="true">
    </cache>
    <!-- 认证的时候使用的缓存策略 -->
    <cache name="authenticationCache"
           eternal="false"
           timeToIdleSeconds="3600"
           timeToLiveSeconds="0"
           overflowToDisk="false"
           statistics="true">
    </cache>
<ehcache>
```

而Session也可以使用缓存，实现方式大致相同，其也是通过实现CacheManagerAware接口或继承实现CacheManagerAware接口的父类来获取缓存的。如SecurityManager实现了SessionSecurityManager，其会判断SessionManager是否实现了CacheManagerAware接口，如果实现了会把CacheManager设置给它。SessionManager也会判断相应的SessionDAO（如继承 自CachingSessionDAO）是否实现了CacheManagerAware，如果实现了会把CacheManager设置给它。设置了缓存的SessionManager，查询时会先查缓存，如果找不到才查数据库。

实际开发时，通常会使用Redis来作为Session的缓存。
