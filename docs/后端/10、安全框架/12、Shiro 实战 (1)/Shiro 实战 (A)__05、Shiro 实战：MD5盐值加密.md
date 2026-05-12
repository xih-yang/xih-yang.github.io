# 05、Shiro 实战：MD5盐值加密
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/5.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
对于同一密码，同一加密算法会产生相同的hash值，这样，当用户进行身份验证时，也可对用户输入的明文密码应用相同的hash加密算法，得出一个hash值，然后使用该hash值和之前存储好的密文值进行对照，如果两个值相同，则密码认证成功，否则密码认证失败。

但是这样存在很大的问题，不同的用户极有可能会使用相同的密码，那么这些用户对应的密文也会相同，这样，当存储用户密码的数据库泄露后，攻击者会很容易便能找到相同密码的用户，从而也降低了破解密码的难度，因此，在对用户密码进行加密时，需要考虑对密码进行掩饰，即使是相同的密码，也应该要保存为不同的密文，即使用户输入的是弱密码，也需要考虑进行增强，从而增加密码被攻破的难度，而使用带盐的加密hash值便能满足该需求。

所以为了达到即便是相同的密码在加密之后，密文也不一样的需求。我们需要对密码进行盐值加密。

```java
public class ShiroRealm extends AuthenticatingRealm {
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
		Object credentials = null;
		//模拟 MD5 盐值加密后的密码
		if("admin".equals(username)){
			credentials = "038bdaf98f2037b31f1e75b5b4c9b26e"; // 使用"admin" 盐值加密后的密码
		}else if("user".equals(username)){
			credentials = "098d2c478e9c11555ce2823231e02ec1"; // 使用"user" 盐值加密后的密码
		}
		//3). realmName: 当前 realm 对象的 name. 调用父类的 getName() 方法即可
		String realmName = getName();
		//4). 盐值。使用username作为盐值，盐值必须是唯一的
		ByteSource credentialsSalt = ByteSource.Util.bytes(username);
		//将盐值作为参数传入，以便 shiro 在比对密码时使用
		SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(principal, credentials, credentialsSalt, realmName);
		return info;
	}
	// MD5 盐值加密
	public static void main(String[] args) {
		String hashAlgorithmName = "MD5";
		Object credentials = "123456";
		Object salt = ByteSource.Util.bytes("user");;
		int hashIterations = 1024;
		Object result = new SimpleHash(hashAlgorithmName, credentials, salt, hashIterations);
		System.out.println(result);
	}
}
```

总结：

**1、** 在 doGetAuthenticationInfo 方法返回值创建 SimpleAuthenticationInfo 对象的时候, 需要使用SimpleAuthenticationInfo(principal, credentials, credentialsSalt, realmName) 构造器

**2、** 使用 ByteSource.Util.bytes() 来计算盐值

**3、** 盐值需要唯一：一般使用随机字符串或 userId

**4、** 使用 new SimpleHash(hashAlgorithmName, credentials, salt, hashIterations); 来计算盐值加密后的密码的值
