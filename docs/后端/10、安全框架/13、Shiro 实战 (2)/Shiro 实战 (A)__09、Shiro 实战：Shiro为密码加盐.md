# 09、Shiro 实战：Shiro为密码加盐
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/9.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
上一篇我们提到了使用Shiro为密码进行MD5加密，这次来说一下密码加盐的问题。当两个用户的密码相同时，单纯使用不加盐的MD5加密方式，会发现数据库中存在相同结构的密码，这样也是不安全的。我们希望即便是两个人的原始密码一样，加密后的结果也不一样。如何做到呢？其实就好像炒菜一样，两道一样的鱼香肉丝，加的盐不一样，炒出来的味道就不一样。MD5加密也是一样，需要进行盐值加密。

在之前的加密样例中，我们可以注意到SimpleHash构造方法的参数中有一个salt参数，该参数就是MD5加密的盐值信息：

```java
public static void main(String[] args) {
	String hashAlgorithmName = "MD5";//加密方式
	Object crdentials = "123456";//密码原值
	Object salt = null;//盐值
	int hashIterations = 1024;//加密1024次
	Object result = new SimpleHash(hashAlgorithmName,crdentials,salt,hashIterations);
	System.out.println(result);
}
```

加盐需要注意以下步骤：

(1)加密之后的结果要加上盐。

(2)返回值(AuthenticationInfo)要将盐带过去。

我们回顾一下之前的校验Realm：

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
import org.apache.shiro.crypto.hash.SimpleHash;
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
		//7.根据用户的情况，来构建AuthenticationInfo对象,通常使用的实现类为SimpleAuthenticationInfo
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
	public static void main(String[] args) {
		String hashAlgorithmName = "MD5";//加密方式
		Object crdentials = "123456";//密码原值
		Object salt = null;//盐值
		int hashIterations = 1024;//加密1024次
		Object result = new SimpleHash(hashAlgorithmName,crdentials,salt,hashIterations);
		System.out.println(result);
	}
}
```

其中doGetAuthenticationInfo是用于返回相应账号对应的数据库中账号密码信息的方法，下面的main是测试Shiro的MD5加密方法。

如果我们要对密码进行MD5加盐操作，我们的返回值就不能是SimpleAuthenticationInfo的简单构造方法了，要使用最复杂的，带有盐值参数的构造方法：SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(principal, hashedCredentials, credentialsSalt, realmName);其中principal是账号信息，hashedCredentials是MD5加密后的密码，credentialsSalt是密码加密的盐值，realmName为当前realm对象的name。

对于盐值credentialsSalt，在Shiro中为org.apache.shiro.util.ByteSource对象：ByteSource credentialsSalt = ByteSource.Util.bytes("");ByteSource提供了一个内部方法，可以将字符串转换为对应的盐值信息。一般情况下我们使用一个唯一的字符串作为盐值。在本测试样例中，我们使用用户名作为盐的原始值。

在上面的测试样例中，模拟的账号密码信息如下：

```java
private static Map<String,User> userMap = new HashMap<String,User>();
static{
    //使用Map模拟数据库获取User表信息
    userMap.put("jack", new User("jack","aaa123",false));
    userMap.put("tom", new User("tom","bbb321",false));
    userMap.put("jean", new User("jean","ccc213",true));
}
```

为了对应测试账号的加密后的密码，我们要将密码进行加盐加密，改写刚才的main对应的测试方法，分别为jack、tom以及jean的账号加盐加密：

```java
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
```

结果：

然后将这些密码设置到静态代码块中，初始化测试账号：

```java
private static Map<String,User> userMap = new HashMap<String,User>();
static{
	//使用Map模拟数据库获取User表信息
	userMap.put("jack", new User("jack","43e66616f8730a08e4bf1663301327b1",false));
	userMap.put("tom", new User("tom","3abee8ced79e15b9b7ddd43b95f02f95",false));
	userMap.put("jean", new User("jean","1a287acb0d87baded1e79f4b4c0d4f3e",true));
}
```

然后在下面的doGetAuthenticationInfo方法中，改写之前封装账号密码的方式：

```java
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
```

可以看到，之前封装返回给校验类的SimpleAuthenticationInfo类一共是三步，分别是获取数据库中的用户账号、密码以及当前realm对象的name，而现在多了一步创建credentialsSalt盐值，并且以账号作为盐的原值，而SimpleAuthenticationInfo的构造方法也使用了带有盐值参数的构造方法。

完成上面的代码，MD5的盐值加密就成功了。下面我们来测试一下，启动我们的Shiro3测试工程：

进入登录界面：

在上面输入jack的账号以及密码“aaa123”，在后台的Controller的登录方法断点中，可以看到用户

输入的密码原值：

然后在校验ShiroRealm类中的doGetAuthenticationInfo方法，可以看到账号密码以及盐值信息：

然后发现校验成功，用户成功登录：

最后总结一下Shiro的MD5加盐加密：

1、在doGetAuthenticationInfo方法返回值创建SimpleAuthenticationInfo对象的时候，需要使用SimpleAuthenticationInfo(principal, credentials, credentialsSalt, realmName)构造器。

2、使用ByteSource.Util.bytes()来计算盐值

3、盐值需要唯一，一般使用随机字符串或者userid

4、使用new SimpleHash(hashAlgorithmName,crdentials,salt,hashIterations)来计算盐值加密后的密码的值。

**转载请注明出处：[http://blog.csdn.net/acmman/article/details/78585662](http://blog.csdn.net/acmman/article/details/78585662)**
