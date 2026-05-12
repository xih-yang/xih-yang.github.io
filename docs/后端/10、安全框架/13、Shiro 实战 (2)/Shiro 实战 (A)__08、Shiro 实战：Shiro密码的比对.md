# 08、Shiro 实战：Shiro密码的比对
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/8.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
上一次总结了如何实现一个简单的Shiro认证流程。首先通过前端页面的form表单提交，在Controller请求处理层获取了form表单中的账号密码，然后获取当前用户的Subject对象，执行了Subject的login方法进行登录操作，并将账号密码封装进Token对象，作为参数传入。而后面设置了认证需要的Realm类，该Realm类继承了AuthenticatingRealm父类，实现了doGetAuthenticationInfo方法，在doGetAuthenticationInfo方法中获取用户的账号密码，在做完一些校验后，传递给了SimpleAuthenticationInfo，并返回出去：

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

可以看到，代码中并没有账号密码的校验，那么Subject对象是如何通过Realm返回的AuthenticationInfo对象来进行账号密码比对的呢？

通过上面的登录流程我们可以知道，目前有两个对象是保存有用户的账号和密码信息的，一个是封装了前台用户在form表单中填写的账号密码信息的UsernamePasswordToken，一个是封装了从数据库取出的对应账号的账号密码信息的SimpleAuthenticationInfo对象。我们可以推测出，Shiro的密码比对一定是通过这两个对象进行比较的，那么Shiro是什么时候进行密码比对的呢？

其实并不难知道Shiro的校验位置，因为在Shiro进行密码比对时，一定会去拿UsernamePasswordToken和SimpleAuthenticationInfo中封装的密码信息，那么此时要调用UsernamePasswordToken的getPassword方法，或者调用SimpleAuthenticationInfo的getCredentials方法。

既然这样，可以关联UsernamePasswordToken的源代码，然后找到其getPassword方法，在该处打断点：

这样我们重新运行校验实例程序的时候，就可以发现校验的时机了。

我们在前台输入账号密码点击登录：

然后发现断点停止了，查看Debug的视窗，看一下在获取密码之前的操作是什么：

看到前四步的SimpleCredentialsMatcher有一个doCredentialsMatch方法，在该方法中就进行了密码比对工作：

```java
public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
     Object tokenCredentials = getCredentials(token);
     Object accountCredentials = getCredentials(info);
     return equals(tokenCredentials, accountCredentials);
}
```

还可以看到，是我们自定义的ShiroRealm(AuthenticatingRealm为父类)执行的assertCredentialsMatch方法调用的该doCredentialsMatch方法进行密码比对：

```java
protected void assertCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) throws AuthenticationException {
    CredentialsMatcher cm = getCredentialsMatcher();
    if (cm != null) {
        if (!cm.doCredentialsMatch(token, info)) {
		//not successful - throw an exception to indicate this:
		String msg = "Submitted credentials for token [" + token + "] did not match the expected credentials.";
		throw new IncorrectCredentialsException(msg);
	}
    } else {
        throw new AuthenticationException("A CredentialsMatcher must be configured in order to verify " +
	"credentials during authentication.  If you do not wish for credentials to be examined, you " +
	"can configure an " + AllowAllCredentialsMatcher.class.getName() + " instance.");
    }
}
```

总结一下也就是，密码的具体比对工作是我们自定义的继承了AuthenticatingRealm父类的自定义Realm类调用CredentialsMatcher的doCredentialsMatch方法完成的。

目前，我们的密码比对是直接明文对比的，在实际的生产环境中，密码往往会进行加密工作，那么我们如何进行密码的加密呢？下一篇将介绍如何使用MD5盐值加密。
