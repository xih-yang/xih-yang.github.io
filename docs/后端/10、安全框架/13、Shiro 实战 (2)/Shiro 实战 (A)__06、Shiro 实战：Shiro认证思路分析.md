# 06、Shiro 实战：Shiro认证思路分析
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/6.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
下面来说一下Shiro的认证。

如何来做Shiro的认证呢？首先回顾一下之前剖析的Shiro的HelloWorld程序中有关认证的部分代码：

```java
//获取当前的Subject
Subject currentUser = SecurityUtils.getSubject();
//测试当前用户是否已经被认证(即是否已经登录)
if (!currentUser.isAuthenticated()) {
    //将用户名与密码封装为UsernamePasswordToken对象
    UsernamePasswordToken token = new UsernamePasswordToken("lonestarr", "vespa");
    token.setRememberMe(true);//记录用户
    try {
        currentUser.login(token);//调用Subject的login方法执行登录
    } catch (UnknownAccountException uae) {
        log.info("There is no user with username of " + token.getPrincipal());
    } catch (IncorrectCredentialsException ice) {
        log.info("Password for account " + token.getPrincipal() + " was incorrect!");
    } catch (LockedAccountException lae) {
        log.info("The account for username " + token.getPrincipal() + " is locked.  " +
                "Please contact your administrator to unlock it.");
    }
}
```

在上面的代码中，首先获取当前用户的Subject对象，然后通过Subject的isAuthenticated判断用户是否已经登录。如果没有登录，就需要创建一个UsernamePasswordToken进行账号密码的校验，在构造方法中传入账号和密码，然后将该token传入Subject的login方法即可进行校验。

那么要注意的是，账号和密码一般都是从前端的用户填写的form表单中获取的，验证用户登录是否成功，需要从数据库取出相关账号密码进行比对，才能确定用户是否可以登录系统。而在Shiro是如何通过UsernamePasswordToken进行账号密码校验的呢？

回顾一下之前的架构：

注意其中的Realm，在Shiro的架构中，负责和数据库交互的对象就是Realm对象。当校验账号与密码时，会使用Realm获取数据表中对应的记录，而比较密码的工作是Shiro来帮我们完成的（相关校验细节在下面）。

所以在Shiro中，完整的认证过程如下：

**1、** 获取当前的Subject，调用SecurityUtils.getSubject()进行获取；

**2、** 测试当前的用户是否已经被认证，即是否已经登录调用Subject的isAuthenticated方法；

**3、** 若没有被认证，则把用户名和密码封装为UsernamePasswordToken对象其中用户名与密码的获取流程如下：

1、用户打开填写用户名密码的表单页面

2、用户输入完账号密码后点击“登录”，会将请求提交到SpringMVC的Handler(Controller方法)

3、在相关的Controller请求处理方法中，通过形参或者HttpServletRequest对象获取前端页面表单中的账号密码。

**4、** 执行登录，调用Subject的login方法(参数为实现了AuthenticationToken接口的实现类，其中UsernamePasswordToken就是这样的类)；

**5、** 自定义Realm的方法，从数据库获取对应的记录，返回给Shiro；

要实现自定义的Realm方法去获取数据库中的记录，具体过程如下：

1)创建类并实现Realm接口(授权/认证)，如果我们只需要认证过程，继承AuthenticatingRealm类。

**观察Realm接口的组成：**

在上面的结构中，Realm实现认证的实际上是org.apache.shiro.realm.AuthenticatingRealm类，所以如果我们仅需要认证的话，单独继承AuthenticatingRealm类即可。

2)实现doGetAuthenticationInfo(AuthenticationToken)方法。

**6、** 由Shiro进行密码校验；

Shiro如何通过传入的token进行密码校验的呢？又是如何利用我们自定义的Realm进行数据库密码匹配的呢？来查看一下源代码：

currentUser.login(token);

上面当前用户的Subject的login方法如下：

```java
public void login(AuthenticationToken token) throws AuthenticationException {
    clearRunAsIdentitiesInternal();
    Subject subject = securityManager.login(this, token);
    //下面代码省略...
}
```

可以看到校验时是使用的securityManager的login方法。而在securityManager的login中：

```java
public Subject login(Subject subject, AuthenticationToken token) throws AuthenticationException {
    AuthenticationInfo info;
    try {
        info = authenticate(token);
    } catch (AuthenticationException ae) {
        //下面代码省略...
    }
    //下面代码省略...
}
```

调用了其父类的authenticate方法：

```java
public AuthenticationInfo authenticate(AuthenticationToken token) throws AuthenticationException {
    return this.authenticator.authenticate(token);
}
```

可以看到其调用了认证器的authenticate方法，而在认证器的authenticate方法中调用了

doAuthenticate方法：

```java
info = doAuthenticate(token);
```

而doAuthenticate逻辑如下所示：

```java
public AuthenticationInfo doAuthenticate(AuthenticationToken token) throws AuthenticationException {
    assertRealmsConfidured();
    Collection<Realm> realms = getRealms();
    if(realms.size() == 1 ){
        return doSingleRealmAuthentication(realms,iterator().next,authenticationToken);
    }else{
        return doMutiRealmAuthentication(realms,authenticationToken);
    }
}
```

可以看到，在doAuthenticate方法中，首先会获取所有的Realm，然后根据Realm的数量来决定使用单个Realm的校验方法，还是多个Realm的校验方法。在配置了单个Realm时，调用的是doSingleRealmAuthentication方法，在该方法中会通过Realm根据token获取AuthenticationInfo对象：

```java
AuthenticationInfo info = realm.getAuthenticationInfo(token);
```

而在getAuthenticationInfo方法中执行了doGetAuthenticationInfo方法来获取AuthenticationInfo对象。

```java
info = doGetAuthenticationInfo(token);
```

doGetAuthenticationInfo方法就是AuthenticationRealm抽象类的抽象方法，而该方法就是上面的校验过程中，实现认证的自定义Realm需要实现的方法。所以在仅实现认证的情况下，创建的自定义Realm只需要单独继承AuthenticatingRealm类，并实现其doGetAuthenticationInfo(AuthenticationToken)方法即可。
