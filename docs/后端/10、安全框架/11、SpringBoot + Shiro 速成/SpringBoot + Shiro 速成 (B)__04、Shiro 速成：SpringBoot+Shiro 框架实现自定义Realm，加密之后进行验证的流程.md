# 04、Shiro 速成：SpringBoot+Shiro 框架实现自定义Realm，加密之后进行验证的流程
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/13.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (B)
## 回顾

第一个shiro项目，里面的realm是框架自带的，原数据是ini文件里面的，也就是之前认证的时候，shiro框架会自己用默认的认证规则到ini文件里面进行认证。现在想要自己改认证的数据源，那么就**需要自己写认证规则**

## 自己写一个认证规则

```java
/**
 *
 * 自定义的认证规则
 */
public class MyRealm extends AuthenticatingRealm {
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
        System.out.println("执行认证");
        //用户名//用户名（拿到前段传过来的用户名）
        String username = token.getPrincipal().toString();
        //密码（拿到前段传过来的密码）
        String pwd = new String((char[])token.getCredentials());
        System.out.println(username+"  "+pwd);
        //先从数据库查询select * from user where username=? 查看用户名是否存在
        if(username.equals("admin")){
     //假设用户名为admin时能从数据库中查询出来
            //根据之前查询出来的用户信息获取密码。假设查询出来的密码是pwd
            String password= "pwd";
            //此处需要注意，第二个参数是从数据库查询出来的密码，而不是传递过来的密码。
            //第三个参数自定义。但是尽量不重复了。常直接使用用户名当做realname名字。
            //token.getPrincipal() 这个是用户传过来的用户名
            AuthenticationInfo info = new SimpleAuthenticationInfo(token.getPrincipal(),password,"realmname");
            //shiro会判断从数据库查询出来的密码和客户端传递过来的密码是否一致。
            return info;
        }
        //返回null说明用户名不存在。
        return null;
    }
}
```

### 解释以上代码

我们自己写的认证规则，如果想要shiro框架认识，必须实现shiro框架里面的一个接口AuthenticatingRealm ，并且重写里面的方法doGetAuthenticationInfo（），在这个方法里面写自己的认证规则，这个方法的参数就是 token，这个token里面保存的就是前段传过来的用户名和密码。

在这个自己写的认证规则里面，自己查询数据库，和前段传过来的数据进行对比

### 将认证规则配置到shiro里面

修改配置文件

在配置文件中添加下面内容

```java
[main]
myrealm=com.jing.MyRealm
securityManager.realms=$myrealm
```

测试结果：

在ShiroRun中修改用户名和密码，当用户名和密码为admin、pwd时可以正常登录。

此时无论shiro.ini是否配置了[users]，都按照Realm中配置的逻辑进行比较用户名和密码。

## 凭证匹配器

前段用户传过来的密码是明文的，但是数据库里面的密码是md5加密之后的，所以我们要在自定义的认证规则里面，写加密相关的

### 1修改自定义Realm

```java
AuthenticationInfo 的构造方法由三个参数变成四个参数的。
新增第三个参数表示加盐。
一般都是拿用户数据的id作为盐。
//密码必须是MD5加密后的密码
String password= "7614fd642608ca0755b78d2b2c352e19";
//假设id是从数据库中取出的id
Long id = 123L;
//第三个参数是加密的盐
AuthenticationInfo info = new SimpleAuthenticationInfo(token.getPrincipal(), password, ByteSource.Util.bytes(id+"") ,token.getPrincipal().toString());
```

以上改完认证规则，已经有了加密的盐，但是我们还没有设置用什么加密器进行加密，迭代的次数也没有。所以我们还要配置一下

在ini配置文件里面的【main】里面进行配置

### 2修改配置文件

在配置文件中配置凭证匹配器配置。

```java
[main]
告诉shiro使用MD5加密
md5CredentialsMatcher=org.apache.shiro.authc.credential.Md5CredentialsMatcher
告诉shiro迭代加密两次
md5CredentialsMatcher.hashIterations=2
myrealm=com.jing.MyRealm
myrealm.credentialsMatcher=$md5CredentialsMatcher
securityManager.realms=$myrealm
```

以上配置之后，就告诉shiro，将用户传过来的密码使用MD5进行加密，并且迭代两次之后，和数据库里面的数据进行比较。

## 总结

```java
subject.login(token);
```

代码执行到以上处，然后就到了自定义规则里面了，在自定义规则里面，从token里面拿出前段传过来的用户名和密码，然后根据用户名从数据库查一下，数据库里面有没有这个用户，有的话，拿出数据库里面存储的密码，代码就走到了

```java
//第一个参数是用户传过来的用户名
//此处需要注意，第二个参数是从数据库查询出来的密码，
//而不是传递过来的密码。
// 第三个参数是加盐的字符串
//第四个参数自定义。但是尽量不重复了。
//常直接使用用户名当做realname名字。
AuthenticationInfo info = new SimpleAuthenticationInfo(token.getPrincipal(),password, ByteSource.Util.bytes(id),"realmname");
//shiro会判断从数据库查询出来的密码和客户端传递过来的密码是否一致。
```
