# 10、Shiro 入门：会话管理
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/29.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (B)
## 会话管理

Shiro 提供了完整的企业级会话管理功能，不依赖于底层容器（如 web 容器 tomcat），不管 JavaSE 还是 JavaEE 环境都可以使用，提供了会话管理、会话事件监听、会话存储 / 持久化、容器无关的集群、失效 / 过期支持、对 Web 的透明支持、SSO 单点登录的支持等特性。即直接使用 Shiro 的会话管理可以直接替换如 Web 容器的会话管理。

## 会话

所谓会话，即用户访问应用时保持的连接关系，在多次交互中应用能够识别出当前访问的用户是谁，且可以在多次交互中保存一些数据。如访问一些网站时登录成功后，网站可以记住用户，且在退出之前都可以识别当前用户是谁。

Shiro 的会话支持不仅可以在普通的 JavaSE 应用中使用，也可以在 JavaEE 应用中使用，如 web 应用。且使用方式是一致的。

在Shiro里面可以发现所有的用户的会话信息都会由Shiro来进行控制，那么也就是说只要是与用户有关的一切的处理信息操作都可以通过Shiro取得，实际上Shiro的会话能够获取到HttpSession中存储的值，这所有的信息都可以通过Subject接口取得。

常见API：

```java
Subject.getSession()----- 获取Shiro的session
session.setAttribute(key,val) & session.getAttribute(key) & session.removeAttribute(key)
session.getId()------ 获取会话ID
session.getTimeout() & session.setTimeout(毫秒)-------设置/获取当前Session的过期时间。
session.getStartTimestamp() & session.getLastAccessTime() --------获取会话的启动时间及最后访问时间
session.stop()------Subject.logout()会自动调用session.stop()。
```

如果要进行session管理，一定要定期释放空间，所以这个时候一定需要定时组件才可以完成。

```xml
<dependency>
     <groupId>org.apache.shiro</groupId>
     <artifactId>shiro-quartz</artifactId>
     <version>1.2.2</version>
</dependency>
```

shiro-single.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
http://www.springframework.org/schema/beans/spring-beans-4.0.xsd">
    <!-- 这个bean的id与web.xml中shiro相关配置保持一致 -->
    <bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
        <property name="securityManager" ref="securityManager"/>
        <!-- 没认证后重定向的位置 -->
        <property name="loginUrl" value="/actions/login"/>
        <!-- 登录成功跳转的位置 -->
        <property name="successUrl" value="/home.jsp"/>
        <!-- 没有权限跳转的位置 -->
        <property name="unauthorizedUrl" value="/unauthorized.jsp"/>
        <!-- 拦截请求-->
        <property name="filterChainDefinitions">
            <value>
                <!-- 登录请求不拦截 -->
                /actions/security/login = anon
                <!-- 访问admin相关的请求，需要认证，
                     且经过自定义拦截器permissionFilter，最后还需要coder权限-->
                /actions/admin/** = authc,permissionFilter,roles[coder]
                /actions/obtainAllUsers = user
                /actions/logout = logout
                /actions/** = authc
            </value>
        </property>
        <!-- 用户自定义的过滤器 -->
        <property name="filters">
            <map>
                <entry key="permissionFilter" value-ref="userAccessControlFilter"/>
            </map>
        </property>
    </bean>
    <!-- 自定义Realm -->
    <bean id="userRealm" class="com.jay.shiro.UserRealm"/>
    <!-- securityManager 对象-->
    <bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
        <!-- 引入UserRealm -->
        <property name="realm" ref="userRealm"/>
        <!-- 引入记住我管理器-->
        <property name="rememberMeManager" ref="rememberMeManager"/>
        <!-- 引入sessionManager-->
        <property name="sessionManager" ref="sessionManager"/>
    </bean>
    <!-- 会话管理器 ,时间单位是毫秒-->
    <bean id="sessionManager" class="org.apache.shiro.web.session.mgt.DefaultWebSessionManager">
        <!--去掉URL中的JSESSIONID-->
        <property name="sessionIdUrlRewritingEnabled" value="false"/>
        <!-- 会话存活时间(毫秒) -->
        <property name="globalSessionTimeout" value="200000"/><!-- 10分钟 -->
        <!-- 是否删除无效的session-->
        <property name="deleteInvalidSessions" value="true"/>
        <!-- 扫描session线程,负责清理超时会话 -->
        <property name="sessionValidationSchedulerEnabled" value="true"/>
        <!-- 使用的是QuartZ组件来定时清理-->
        <property name="sessionValidationScheduler" ref="sessionValidationScheduler"/>
        <!-- session需要使用会话cookie模版-->
        <property name="sessionIdCookieEnabled" value="true"/>
        <property name="sessionIdCookie" ref="sessionIdCookie"/>
        <!-- 对session进行增删错改查的实现类 -->
        <property name="sessionDAO" ref="sessionDAO"/>
    </bean>
    <!-- 会话验证调度器 ,时间单位是毫秒-->
    <bean id="sessionValidationScheduler" class="org.apache.shiro.session.mgt.quartz.QuartzSessionValidationScheduler">
        <property name="sessionValidationInterval" value="30000"/>
        <property name="sessionManager" ref="sessionManager"/>
    </bean>
    <!-- 会话 ID 生成器 -->
    <bean id="sessionIdGenerator" class="org.apache.shiro.session.mgt.eis.JavaUuidSessionIdGenerator"/>
    <!-- 会话读写实现类-->
    <bean id="sessionDAO" class="org.apache.shiro.session.mgt.eis.EnterpriseCacheSessionDAO">
        <property name="activeSessionsCacheName" value="shiro-activeSessionCache"/>
        <property name="sessionIdGenerator" ref="sessionIdGenerator"/>
    </bean>
    <!-- 会话Cookie模板 -->
    <bean id="sessionIdCookie" class="org.apache.shiro.web.servlet.SimpleCookie">
        <constructor-arg value="sid"/>
        <property name="httpOnly" value="true"/>
        <!--maxAge=-1表示浏览器关闭时失效此Cookie -->
        <property name="maxAge" value="-1"/>
    </bean>
    <!-- rememberMeCookie：即记住我的Cookie，保存时长30天 -->
    <bean id="rememberMeCookie" class="org.apache.shiro.web.servlet.SimpleCookie">
        <constructor-arg value="rememberMe"/>
        <property name="httpOnly" value="true"/>
        <property name="maxAge" value="2592000"/><!-- 30天 -->
    </bean>
    <!-- rememberMe管理器 -->
    <bean id="rememberMeManager"
          class="org.apache.shiro.web.mgt.CookieRememberMeManager">
        <property name="cipherKey" value="#{T(org.apache.shiro.codec.Base64).decode('4AvVhmFLUs0KTA3Kprsdag==')}"/>
        <property name="cookie" ref="rememberMeCookie"/>
    </bean>
    <!-- Shiro 生命周期处理器,，保证实现shiro内部的生命周期函数bean的执行 -->
    <bean id="lifecycleBeanPostProcessor" class="org.apache.shiro.spring.LifecycleBeanPostProcessor"/>
</beans>
```

在spring中引入shiro-single.xml

```xml
<!-- 导入shiro的配置文件 -->
<import resource="shiro-single.xml"/>
```

在登陆时传入一个值，在登陆后从session中拿到

再点击"进入管理员页面"超链接，返送相关请求。后台处理此请求的Controller里面，使用Shiro获取到Shiro的会话Session，尝试获取到Key为"abc"的键值对的值。在控制台打印出"def"，说明Shiro提供的会话session能够正确的从HttpSession中获取键值对。同时也证明本次集成Shiro会话成功。
