# 13、Shiro Spring 集成
- 来源：https://ddkk.com/zhuanlan/security/shiro/1/13.html
- 分类：安全框架
- 分组：教程目录
## 与 Spring集成

Shiro 的组件都是 JavaBean/POJO 式的组件，所以非常容易使用 Spring 进行组件管理，可以非常方便的从 ini 配置迁移到 Spring 进行管理，且支持 JavaSE 应用及 Web 应用的集成。

在示例之前，需要导入 shiro-spring 及 spring-context 依赖，具体请参考 pom.xml。

spring-beans.xml 配置文件提供了基础组件如 DataSource、DAO、Service 组件的配置。

## JavaSE 应用

spring-shiro.xml 提供了普通 JavaSE 独立应用的 Spring 配置：

```java
<!-- 缓存管理器 使用Ehcache实现 -->
<bean id="cacheManager" class="org.apache.shiro.cache.ehcache.EhCacheManager">
    <property name="cacheManagerConfigFile" value="classpath:ehcache.xml"/>
</bean>
<!-- 凭证匹配器 -->
<bean id="credentialsMatcher" class="
com.github.zhangkaitao.shiro.chapter12.credentials.RetryLimitHashedCredentialsMatcher">
    <constructor-arg ref="cacheManager"/>
    <property name="hashAlgorithmName" value="md5"/>
    <property name="hashIterations" value="2"/>
    <property name="storedCredentialsHexEncoded" value="true"/>
</bean>
<!-- Realm实现 -->
<bean id="userRealm" class="com.github.zhangkaitao.shiro.chapter12.realm.UserRealm">
    <property name="userService" ref="userService"/>
    <property name="credentialsMatcher" ref="credentialsMatcher"/>
    <property name="cachingEnabled" value="true"/>
    <property name="authenticationCachingEnabled" value="true"/>
    <property name="authenticationCacheName" value="authenticationCache"/>
    <property name="authorizationCachingEnabled" value="true"/>
    <property name="authorizationCacheName" value="authorizationCache"/>
</bean>
<!-- 会话ID生成器 -->
<bean id="sessionIdGenerator" 
class="org.apache.shiro.session.mgt.eis.JavaUuidSessionIdGenerator"/>
<!-- 会话DAO -->
<bean id="sessionDAO" 
class="org.apache.shiro.session.mgt.eis.EnterpriseCacheSessionDAO">
    <property name="activeSessionsCacheName" value="shiro-activeSessionCache"/>
    <property name="sessionIdGenerator" ref="sessionIdGenerator"/>
</bean>
<!-- 会话验证调度器 -->
<bean id="sessionValidationScheduler" 
class="org.apache.shiro.session.mgt.quartz.QuartzSessionValidationScheduler">
    <property name="sessionValidationInterval" value="1800000"/>
    <property name="sessionManager" ref="sessionManager"/>
</bean>
<!-- 会话管理器 -->
<bean id="sessionManager" class="org.apache.shiro.session.mgt.DefaultSessionManager">
    <property name="globalSessionTimeout" value="1800000"/>
    <property name="deleteInvalidSessions" value="true"/>
    <property name="sessionValidationSchedulerEnabled" value="true"/>
   <property name="sessionValidationScheduler" ref="sessionValidationScheduler"/>
    <property name="sessionDAO" ref="sessionDAO"/>
</bean>
<!-- 安全管理器 -->
<bean id="securityManager" class="org.apache.shiro.mgt.DefaultSecurityManager">
    <property name="realms">
        <list><ref bean="userRealm"/></list>
    </property>
    <property name="sessionManager" ref="sessionManager"/>
    <property name="cacheManager" ref="cacheManager"/>
</bean>
<!-- 相当于调用SecurityUtils.setSecurityManager(securityManager) -->
<bean class="org.springframework.beans.factory.config.MethodInvokingFactoryBean">
<property name="staticMethod" 
value="org.apache.shiro.SecurityUtils.setSecurityManager"/>
    <property name="arguments" ref="securityManager"/>
</bean>
<!-- Shiro生命周期处理器-->
<bean id="lifecycleBeanPostProcessor" 
class="org.apache.shiro.spring.LifecycleBeanPostProcessor"/>
```

可以看出，只要把之前的 ini 配置翻译为此处的 spring xml 配置方式即可，无须多解释。 LifecycleBeanPostProcessor 用于在实现了 Initializable 接口的 Shiro bean 初始化时调用 Initializable 接口回调，在实现了 Destroyable 接口的 Shiro bean 销毁时调用 Destroyable 接口回调。如 UserRealm 就实现了 Initializable，而 DefaultSecurityManager 实现了 Destroyable。具体可以查看它们的继承关系。

测试用例请参考 com.github.zhangkaitao.shiro.chapter12.ShiroTest。

## Web 应用

Web应用和普通 JavaSE 应用的某些配置是类似的，此处只提供一些不一样的配置，详细配置可以参考 spring-shiro-web.xml。

```java
<!-- 会话Cookie模板 -->
<bean id="sessionIdCookie" class="org.apache.shiro.web.servlet.SimpleCookie">
    <constructor-arg value="sid"/>
    <property name="httpOnly" value="true"/>
    <property name="maxAge" value="180000"/>
</bean>
<!-- 会话管理器 -->
<bean id="sessionManager" 
class="org.apache.shiro.web.session.mgt.DefaultWebSessionManager">
    <property name="globalSessionTimeout" value="1800000"/>
    <property name="deleteInvalidSessions" value="true"/>
    <property name="sessionValidationSchedulerEnabled" value="true"/>
    <property name="sessionValidationScheduler" ref="sessionValidationScheduler"/>
    <property name="sessionDAO" ref="sessionDAO"/>
    <property name="sessionIdCookieEnabled" value="true"/>
    <property name="sessionIdCookie" ref="sessionIdCookie"/>
</bean>
<!-- 安全管理器 -->
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
<property name="realm" ref="userRealm"/>
    <property name="sessionManager" ref="sessionManager"/>
    <property name="cacheManager" ref="cacheManager"/>
</bean> 
```

**1、** sessionIdCookie是用于生产SessionIDCookie的模板；

**2、** 会话管理器使用用于web环境的DefaultWebSessionManager；

**3、** 安全管理器使用用于web环境的DefaultWebSecurityManager；

```java
<!-- 基于Form表单的身份验证过滤器 -->
<bean id="formAuthenticationFilter" 
class="org.apache.shiro.web.filter.authc.FormAuthenticationFilter">
    <property name="usernameParam" value="username"/>
    <property name="passwordParam" value="password"/>
    <property name="loginUrl" value="/login.jsp"/>
</bean>
<!-- Shiro的Web过滤器 -->
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <property name="loginUrl" value="/login.jsp"/>
    <property name="unauthorizedUrl" value="/unauthorized.jsp"/>
    <property name="filters">
        <util:map>
            <entry key="authc" value-ref="formAuthenticationFilter"/>
        </util:map>
    </property>
    <property name="filterChainDefinitions">
        <value>
            /index.jsp = anon
            /unauthorized.jsp = anon
            /login.jsp = authc
            /logout = logout
            /** = user
        </value>
    </property>
</bean> 
```

**1、** formAuthenticationFilter为基于Form表单的身份验证过滤器；此处可以再添加自己的Filterbean定义；

**2、** shiroFilter：此处使用ShiroFilterFactoryBean来创建ShiroFilter过滤器；filters属性用于定义自己的过滤器，即ini配置中的[filters]部分；filterChainDefinitions用于声明url和filter的关系，即ini配置中的[urls]部分；

接着需要在 web.xml 中进行如下配置：

```java
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>
        classpath:spring-beans.xml,
        classpath:spring-shiro-web.xml
    </param-value>
</context-param>
<listener>
   <listener-class>
org.springframework.web.context.ContextLoaderListener
</listener-class>
</listener> 
```

通过ContextLoaderListener 加载 contextConfigLocation 指定的 Spring 配置文件。

```java
<filter>
    <filter-name>shiroFilter</filter-name>
    <filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
    <init-param>
        <param-name>targetFilterLifecycle</param-name>
        <param-value>true</param-value>
    </init-param>
</filter>
<filter-mapping>
    <filter-name>shiroFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping> 
```

DelegatingFilterProxy 会自动到 Spring 容器中查找名字为 shiroFilter 的 bean 并把 filter 请求交给它处理。

其他配置请参考源代码。

## Shiro 权限注解

Shiro 提供了相应的注解用于权限控制，如果使用这些注解就需要使用 AOP 的功能来进行判断，如 Spring AOP；Shiro 提供了 Spring AOP 集成用于权限注解的解析和验证。

为了测试，此处使用了 Spring MVC 来测试 Shiro 注解，当然 Shiro 注解不仅仅可以在 web 环境使用，在独立的 JavaSE 中也是可以用的，此处只是以 web 为例了。

在spring-mvc.xml 配置文件添加 Shiro Spring AOP 权限注解的支持：

```java
<aop:config proxy-target-class="true"></aop:config>
<bean class="
org.apache.shiro.spring.security.interceptor.AuthorizationAttributeSourceAdvisor">
    <property name="securityManager" ref="securityManager"/>
</bean> 
```

如上配置用于开启 Shiro Spring AOP 权限注解的支持；`` 表示代理类。

接着就可以在相应的控制器（AnnotationController）中使用如下方式进行注解：

```java
@RequiresRoles("admin")
@RequestMapping("/hello2")
public String hello2() {
    return "success";
} 
```

访问hello2 方法的前提是当前用户有 admin 角色。

当验证失败，其会抛出 UnauthorizedException 异常，此时可以使用 Spring 的 ExceptionHandler（DefaultExceptionHandler）来进行拦截处理：

```java
@ExceptionHandler({UnauthorizedException.class})
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public ModelAndView processUnauthenticatedException(NativeWebRequest request, UnauthorizedException e) {
    ModelAndView mv = new ModelAndView();
    mv.addObject("exception", e);
    mv.setViewName("unauthorized");
    return mv;
} 
```

如果集成 Struts2，需要注意《Shiro+Struts2+Spring3 加上 @RequiresPermissions 后 @Autowired 失效》问题：

[http://jinnianshilongnian.iteye.com/blog/1850425](http://jinnianshilongnian.iteye.com/blog/1850425)

**权限注解**

@RequiresAuthentication

表示当前 Subject 已经通过 login 进行了身份验证；即 Subject.isAuthenticated() 返回 true。

@RequiresUser

表示当前 Subject 已经身份验证或者通过记住我登录的。

@RequiresGuest

表示当前 Subject 没有身份验证或通过记住我登录过，即是游客身份。

@RequiresRoles(value={“admin”, “user”}, logical= Logical.AND)

表示当前 Subject 需要角色 admin 和 user。

@RequiresPermissions (value={“user:a”, “user:b”}, logical= Logical.OR)

表示当前 Subject 需要权限 user：a 或 user：b。
