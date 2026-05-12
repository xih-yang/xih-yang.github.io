# 13、Shiro 实战：SecurityManager配置realms
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/13.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。大家可以注意到，在没有使用认证器之前，我们是这样配置Realm的：

```xml
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
    <property name="cacheManager" ref="cacheManager"/>
    <property name="realm" ref="shiroRealm"/>
</bean>
<bean id="shiroRealm" class="com.test.shiro.realms.ShiroRealm"></bean>
```

后来使用了多Realm验证时，会将多个Realm配置到认证器中，再将认证器配置给securityManager：

```xml
<!--1. 配置 SecurityManager-->     
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
    <property name="cacheManager" ref="cacheManager"/>
    <property name="authenticator" ref="authenticator"/>
</bean>
<!-- 认证器 -->
<bean id="authenticator" class="org.apache.shiro.authc.pam.ModularRealmAuthenticator">
    <property name="realms">
        <list>
            <ref bean="shiroRealm"/>
            <ref bean="secordRealm"/>
        </list>
    </property>
    <property name="authenticationStrategy">
        <bean class="org.apache.shiro.authc.pam.AtLeastOneSuccessfulStrategy"></bean>
    </property>
</bean>
```

那么，我们如果将authenticator中的realms删除，而重新在securityManager添加两个Realm配置，

我们的工程还能跑起来吗？可以试验一下，首先将配置改为一下配置：

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
<!-- 认证器 -->
<bean id="authenticator" class="org.apache.shiro.authc.pam.ModularRealmAuthenticator">
    <property name="authenticationStrategy">
        <bean class="org.apache.shiro.authc.pam.AtLeastOneSuccessfulStrategy"></bean>
    </property>
</bean>
```

重启Shiro3项目，然后使用jack登录：

发现依然可以进行正常的校验：

那么可以证明这种写法是没有问题的，但是我们要想一下，为什么这样可以呢？

可以看到，我们是在securityManager中配置了authenticator的，所以在进行校验的时候是通过authenticator来获取认证信息并且校验的(ModularRealmAuthenticator源码)：

而使用的realms集合是authenticator类(ModularRealmAuthenticator)自己的realms属性，而我们在上面的配置中又没有给ModularRealmAuthenticator配置realms参数，而是给securityManager配置了realms属性，那么我们的程序是如何获取两个realm的认证信息的呢？

观察ModularRealmAuthenticator的源码我们可以看到，它除了包含名为realms的集合变量外，还有相应的get和set方法(当然这是IOC必须的)，是不是有人在某个时候给它悄悄set了realms属性呢？

我们在AuthenticationSecurityManager中找到了答案：

发现在上面的方法中，只要校验出authenticator的类型属于ModularRealmAuthenticator，则会将SecurityManager的realms属性赋值给对应的authenticator类。所以确实是SecurityManager将自己的realms集合属性给了authenticator，所以authenticator才有realm可以用。

以后我们将使用这种写法来配置realm，因为后面我们讲解授权的时候，需要使用到SecurityManager的realms属性。
