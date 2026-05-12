# 13、Shiro 实战：授权不生效的解决方案
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/28.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
shiro开启注释

shiroconfiguration中增加

```java
@Bean
public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(SecurityManager securityManager) {
    AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor
        = new AuthorizationAttributeSourceAdvisor();
    authorizationAttributeSourceAdvisor.setSecurityManager(securityManager);
    return authorizationAttributeSourceAdvisor;
}
```

在controller中的方法前加上注解

```java
@RequiresPermissions("userInfo:test")
```

若还没生效，应该是aop没起作用，

解决方法一

shiroconfiguration中增加

```java
@Bean
    @ConditionalOnMissingBean
    public DefaultAdvisorAutoProxyCreator defaultAdvisorAutoProxyCreator() {
        DefaultAdvisorAutoProxyCreator defaultAAP = new DefaultAdvisorAutoProxyCreator();
        defaultAAP.setProxyTargetClass(true);
        return defaultAAP;
    }
```

解决方法二

pom.xml中加入

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

同时application.properties中补充

```java
spring.aop.proxy-target-class=true
```
