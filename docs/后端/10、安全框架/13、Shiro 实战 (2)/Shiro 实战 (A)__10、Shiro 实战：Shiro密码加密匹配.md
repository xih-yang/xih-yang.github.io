# 10、Shiro 实战：Shiro密码加密匹配
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/10.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
下面我们来说一下在Shiro中对密码的加密。我们知道线上系统的数据库中存储的密码不应该是明文，而是密码加密后的字符串，并且要求加密算法是不可逆的。著名的加密算法有MD5、SHA1等。其中MD5是目前比较可靠的不可逆的加密方式。

我们如何利用Shiro实现用户登录密码的MD5加密呢？这就需要让Shiro的自定义Realm去使用带有加密机制的CredentialsMatcher密码匹配类。如何做到呢？这就需要替换当前Realm的credentialsMatcher属性。在上一篇总结中，我们看到了自定义的ShiroRealm(AuthenticatingRealm为父类)执行的assertCredentialsMatch方法调用的是CredentialsMatcher类来进行密码比较的，而这个CredentialsMatcher类有很多实现类，例如MD5CredentialsMatcher，而这个类现在已经过时了，官方推荐使用HashedCredentialsMatcher来进行加密密码的匹配工作。所以下面我们在自定义Realm中直接使用HashedCredentialsMatcher对象，并设置加密算法即可。

首先更改Shiro的配置文件applicationContext.xml，将自定义的Realm中的CredentialsMatcher

的实现类注入为HashedCredentialsMatcher：

```xml
<bean id="shiroRealm" class="com.test.shiro.realms.ShiroRealm">
	<property name="credentialsMatcher">
	    <bean class="org.apache.shiro.authc.credential.HashedCredentialsMatcher">
	        <property name="hashAlgorithmName" value="MD5"></property>
                <property name="hashIterations" value="1024"></property>
	    </bean>
	</property>
</bean>
```

注入HashedCredentialsMatcher类型实现类，并将其中的加密算法名称属性hashAlgorithmName设置为“MD5”,加密次数设置为1024次。设置完上面的密码匹配类之后，就可以将用户的登录密码自动加密为MD5。我们为之前的测试系统的assertCredentialsMatch方法源码打一个断点：

当用户输入账号密码后，可以在assertCredentialsMatch方法中看到CredentialsMatch的类型为HashedCredentialsMatcher：

而在HashedCredentialsMatcher的doCredentialsMatch方法，可以看到密码已经被加密为MD5：

那么HashedCredentialsMatcher怎么给密码进行加密的？观察HashedCredentialsMatcher的

中doCredentialsMatch方法：

```java
@Override
public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
	Object tokenHashedCredentials = hashProvidedCredentials(token, info);
	Object accountCredentials = getCredentials(info);
	return equals(tokenHashedCredentials, accountCredentials);
}
```

可以发现其中有一个hashProvideCredentials方法，在该方法中，给取出了盐值的操作 判断info的类型是否是 SaltedAuthenticationInfo ：

```java
protected Object hashProvidedCredentials(AuthenticationToken token, AuthenticationInfo info) {
        Object salt = null;
        if (info instanceof SaltedAuthenticationInfo) {
            salt = ((SaltedAuthenticationInfo)info).getCredentialsSalt();
        } else if (this.isHashSalted()) {
            salt = this.getSalt(token);
        }
        return this.hashProvidedCredentials(token.getCredentials(), salt, this.getHashIterations());
    }
```

然后又返回了一个传入新参数hashIterations（加密次数）的hashProvideCredentials方法，在该方法中，提供了密码加密的逻辑：

```java
protected Hash hashProvidedCredentials(Object credentials, Object salt, int hashIterations) {
    String hashAlgorithmName = assertHashAlgorithmName();
    return new SimpleHash(hashAlgorithmName, credentials, salt, hashIterations);
}
```

可以看到返回了一个SimpleHash对象(org.apache.shiro.crypto.hash.SimpleHash)，该构造方法返回的就是一个加密后的Hash值。在该构造方法中有四个参数，其中hashAlgorithmName指定的是加密方式，即是之前我们注入在XML的参数(value为MD5)，credentials为加密前的密码。salt代表盐值，hashIterations为加密次数(加密次数越多越安全)。

我们做一个测试，来实验SimpleHash的加密方法：

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

结果：

可以看到，MD5加密成功、说明在Shiro中，是使用org.apache.shiro.crypto.hash.SimpleHash类的构造方法进行加密并返回加密结果的。

提示：想要进一步学习如何使用Java对一个字符串进行MD5加密，详见下面博文：

**《Java实现四大加密算法》[http://blog.csdn.net/acmman/article/details/51830744](http://blog.csdn.net/acmman/article/details/51830744)**

有关密码加盐的问题请看下一篇总结。
