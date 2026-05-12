# 12、Shiro 实战：Shiro认证策略
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/12.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。上一篇我们讲到了Shiro的多Realm验证，并且编写实例进行了测试。对于多Realm校验，我们还需要知道，两个Realm时，怎么才能知道认证通过了？是一个Realm通过了就通过，还是全部Realm通过了才通过，还是其它？这就牵扯到了认证策略。

认证策略实际上是AuthenticationStrategy这个接口，它有三个实现：

1、**FirstSuccessfulStrategy**:只要有一个Realm验证成功即可，只返回第一个Realm身份验证成功的认证信息，其他的忽略。

2、**AtLeatOneSuccessfulStrategy**:只要有一个Realm验证成功即可，和FirstSuccessfulStrategy不同，将

返回所有Realm身份校验成功的认证信息。

3、**AllSuccessfulStrategy**:所有Realm验证成功才算成功，且返回所有Realm身份认证成功的认证信息，如果有一个失败就失败了。我们之前使用的ModularRealmAuthenticator默认是AtLeatOneSuccessfulStrategy。

我们再回顾一下ModularRealmAuthenticator的源码：

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

多Realm校验会走下面的doMultiRealmAuthentication方法，其源码如下：

```java
protected AuthenticationInfo doMultiRealmAuthentication(Collection<Realm> realms, AuthenticationToken token) {
    AuthenticationStrategy strategy = getAuthenticationStrategy();
    AuthenticationInfo aggregate = strategy.beforeAllAttempts(realms, token);
    if (log.isTraceEnabled()) {
        log.trace("Iterating through {} realms for PAM authentication", realms.size());
    }
    for (Realm realm : realms) {
        aggregate = strategy.beforeAttempt(realm, token, aggregate);
        if (realm.supports(token)) {
            log.trace("Attempting to authenticate token [{}] using realm [{}]", token, realm);
            AuthenticationInfo info = null;
            Throwable t = null;
            try {	
                info = realm.getAuthenticationInfo(token);
            } catch (Throwable throwable) {	
                t = throwable;	
                if (log.isDebugEnabled()) {		
                String msg = "Realm [" + realm + "] threw an exception during a multi-realm authentication attempt:";		
                log.debug(msg, t);	
                }
            }
            aggregate = strategy.afterAttempt(realm, token, info, aggregate, t);
        } else {
            log.debug("Realm [{}] does not support token {}.  Skipping realm.", realm, token);
        }
    }
    aggregate = strategy.afterAllAttempts(token, aggregate);
    return aggregate;
}
```

在上面的源码中，我们可以看到方法首先调用getAuthenticationStrategy()方法获取了一个认证策略类，而在方法的最后又获得了一个AuthenticationInfo认证消息。

为了看到使用ModularRealmAuthenticator最后获得的认证消息，我们将之前Shiro3工程的SecordRealm的代码做一些更改：

SimpleAuthenticationInfo info = null;info = new SimpleAuthenticationInfo("SecondRealmName", credentials, credentialsSalt, realmName);return info;

将第二个Realm的认证结果中的账号改为“SecondRealmName”。原来在我们的Shiro3工程中，ShiroRealm和SecordRealm中都没有admin账户，我们这里仅为SecordRealm添加一个admin账户，作为后面的测试区分：

userMap.put("admin", new User("admin","463c6a4b033daaee524da5cb3a5562a5f3feeaa7",false));//密码明文：aabbcc然后使用admin进行登录：

在doMultiRealmAuthentication的源码处打断点，首先可以发现的是getAuthenticationStrategy方法拿到的策略：

可以看到就是AtLeatOneSuccessfulStrategy策略。代码走到最后，我们可以看到返回的认证信息：

可以看到包含了两个Realm最后返回的认证信息，这就说明符合AtLeatOneSuccessfulStrategy策略的原则，只要有一个Realm校验通过就通过，并且返回所有Realm的认证信息。

如果我们想要更换认证策略，则需要在IOC容器的配置文件applicationContext.xml中为之前配置的认证器添加一个authenticationStrategy参数：

```xml
<!-- 认证器 -->
<bean id="authenticator" class="org.apache.shiro.authc.pam.ModularRealmAuthenticator">
    <property name="realms">
        <list>
            <ref bean="shiroRealm"/>
            <ref bean="secordRealm"/>
        </list>
    </property>
    <property name="authenticationStrategy">
        <bean class="org.apache.shiro.authc.pam.AllSuccessfulStrategy"></bean>
    </property>
</bean>
```

我们上面将认证策略更改为AllSuccessfulStrategy，即所有Realm验证成功才算成功。我们进行测试，使用admin进行登录，发现登录失败：

这是因为我们的两个Realm中，只有第二个Realm包含admin的认证信息，所以第一个Realm认证失败，第二个Realm认证成功，

而根据策略，所有Realm验证成功才算成功，所以但凡有一个Realm校验失败，本次校验都是失败的，剩余的Realm也无需执行。
