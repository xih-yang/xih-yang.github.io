# 04、Shiro 实战：认证流程
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/4.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
## 一、简介

身份验证，即在应用中谁能证明他就是他本人。一般提供如他们的身份ID一些标识信息来表明他就是他本人，如提供身份证，用户名和密码来证明。在shiro中，用户需要提供principals （身份）和credentials（证明）给shiro，从而应用能验证用户身份。最常见的principals和credentials组合就是用户名和密码了。

**principals**：身份，即主体的标识属性，可以是任何东西，如用户名、邮箱等，唯一即可。一个主体可以有多个principals，但只有一个Primary principals，一般是用户名或密码或手机号。

**credentials**：证明/凭证，即只有主体知道的安全值，如密码/数字证书等。

## 二、身份验证的基本流程

**1、** 首先调用Subject.login(token)进行登录，其会自动委托给Security Manager，调用之前必须通过SecurityUtils. setSecurityManager()设置；

**2、** SecurityManager负责真正的身份验证逻辑；它会委托给Authenticator进行身份验证；

**3、** Authenticator才是真正的身份验证者，Shiro API中核心的身份认证入口点，此处可以自定义插入自己的实现；

**4、** Authenticator可能会委托给相应的AuthenticationStrategy进行多Realm身份验证，默认ModularRealmAuthenticator会调用AuthenticationStrategy进行多Realm身份验证；

**5、** Authenticator会把相应的token传入Realm，从Realm获取身份验证信息，如果没有返回或抛出异常表示身份验证失败了。此处可以配置多个Realm，将按照相应的顺序及策略进行访问。

## 三、使用步骤

**1、** 获取当前的 Subject，调用 SecurityUtils.getSubject()。

**2、** 测试当前的用户是否已经被认证，即是否已经登录，调用 Subject 的 isAuthenticated() 。

**3、** 若没有被认证， 则把用户名和密码封装为 UsernamePasswordToken 对象。

**4、** 执行登录：调用 Subject 的 login(AuthenticationToken) 方法。

```java
@RequestMapping("/login")
public String login(@RequestParam("username") String username, 
		@RequestParam("password") String password){
	Subject currentUser = SecurityUtils.getSubject();
	if (!currentUser.isAuthenticated()) {
       	   // 把用户名和密码封装为 UsernamePasswordToken 对象，这个token会被传到Realm 中比对
           UsernamePasswordToken token = new UsernamePasswordToken(username, password);
           // rememberme 记住我
           token.setRememberMe(true);
           try {
               // 执行登录. 
               currentUser.login(token);
           } catch (AuthenticationException ae) { // 所有认证时异常的父类.
           	System.out.println("登录失败: " + ae.getMessage());
           }
       }
	return "redirect:/list.jsp";
}
```

5、自定义 Realm 的方法，从数据库中获取对应的记录, 返回给 Shiro。

**1、** 实际上需要继承 org.apache.shiro.realm.AuthenticatingRealm 类。

**2、** 实现 doGetAuthenticationInfo(AuthenticationToken) 方法。

6、由 shiro 完成对密码的比对。通过 AuthenticatingRealm 的 credentialsMatcher 属性来进行的密码的比对。

修改Spring配置文件中 Realm 的配置。对用户输入的密码进行加密

```xml
<!-- 
	3. 配置 Realm 
	3.1 直接配置实现了 org.apache.shiro.realm.Realm 接口的 bean
-->     
<bean id="jdbcRealm" class="com.atguigu.shiro.realms.ShiroRealm">
	<property name="credentialsMatcher">
		<bean class="org.apache.shiro.authc.credential.HashedCredentialsMatcher">
			<property name="hashAlgorithmName" value="MD5"></property>
			<property name="hashIterations" value="1024"></property>
		</bean>
	</property>
</bean>
```

```java
public class ShiroRealm extends AuthenticatingRealm{
	@Override
	protected AuthenticationInfo doGetAuthenticationInfo(
			AuthenticationToken token) throws AuthenticationException {
		System.out.println("[FirstRealm] doGetAuthenticationInfo");
		//1. 把 AuthenticationToken 转换为 UsernamePasswordToken
		UsernamePasswordToken upToken = (UsernamePasswordToken) token;
		//2. 从 UsernamePasswordToken 中来获取 username
		String username = upToken.getUsername();
		//3. 调用数据库的方法, 从数据库中查询 username 对应的用户记录
		System.out.println("从数据库中获取 username: " + username + " 所对应的用户信息.");
		//4. 若用户不存在, 则可以抛出 UnknownAccountException 异常
		if("unknown".equals(username)){
			throw new UnknownAccountException("用户不存在!");
		}
		//5. 根据用户信息的情况, 决定是否需要抛出其他的 AuthenticationException 异常.
		if("monster".equals(username)){
			throw new LockedAccountException("用户被锁定");
		}
		//6. 根据用户的情况, 来构建 AuthenticationInfo 对象并返回. 通常使用的实现类为: SimpleAuthenticationInfo
		//以下信息是从数据库中获取的.
		//1). principal: 认证的实体信息. 可以是 username, 也可以是数据表对应的用户的实体类对象.
		Object principal = username;
		//2). credentials: 密码.
		Object credentials = "fc1709d0a95a6be30bc5926fdb7f22f4";
		//3). realmName: 当前 realm 对象的 name. 调用父类的 getName() 方法即可
		String realmName = getName();
		SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(principal, credentials, realmName);
		return info;
	}
	// 对数据库查询出的密码 "123456" 进行加密
	public static void main(String[] args) {
		String hashAlgorithmName = "MD5"; // 加密算法
		Object credentials = "123456"; // 待加密字符串
		Object salt = null; // 盐值
		int hashIterations = 1024; // 加密次数
		Object result = new SimpleHash(hashAlgorithmName, credentials, salt, hashIterations);
		System.out.println(result); // "123456" 加密后的结果是 "fc1709d0a95a6be30bc5926fdb7f22f4"
	}
}
```
