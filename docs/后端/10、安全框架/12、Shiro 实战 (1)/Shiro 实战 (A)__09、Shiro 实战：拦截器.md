# 09、Shiro 实战：拦截器
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/9.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
## 一、简介

Shiro 内置了很多默认的拦截器，比如身份验证、授权等 相关的。默认拦截器可以参考 org.apache.shiro.web.filter.mgt.DefaultFilter中的枚举拦截器：

**1、** 身份验证相关的拦截器；

**2、** 授权相关的拦截器；

**3、** 其他拦截器；

## 二、权限配置（即拦截器的使用）

在Spring配置文件的 shiroFilter 中配置权限

```xml
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <!-- 配置登录页面 -->
    <property name="loginUrl" value="/login.jsp"/>
    <!-- 配置登录成功页面 -->
    <property name="successUrl" value="/list.jsp"/>
    <!-- 配置没有权限页面 -->
    <property name="unauthorizedUrl" value="/unauthorized.jsp"/>
    <!--  
    	权限配置：配置哪些页面需要受保护，以及访问这些页面需要的权限。
    		1). anon 可以被匿名访问
    		2). authc 必须认证(即登录)后才可能访问的页面. 
    		3). logout 登出.
    		4). roles 角色过滤器
    -->
    <property name="filterChainDefinitions">
        <value>
            /login.jsp = anon
            /shiro/login = anon
            /shiro/logout = logout
            /user.jsp = roles[user]
            /admin.jsp = roles[admin]
            /** = authc
        </value>
    </property>
</bean>
```

**1、** URL书写格式；

[urls] 部分的配置，其格式是： `url=拦截器[参数]，拦截器[参数]`；

如果当前请求的 url 匹配 [urls] 部分的某个 url 模式，将会执行其配置的拦截器。

anon（anonymous） 拦截器表示匿名访问（即不需要登录即可访问）

authc （authentication）拦截器表示需要身份认证通过后才能访问。

**2、** URL匹配模式；

url 模式使用 Ant 风格模式

Ant 路径通配符支持 `?`、`*`、`**`，注意通配符匹配不包括目录分隔符`/`：

`?`：匹配一个字符，如 /admin? 将匹配 /admin1，但不 匹配 /admin 或 /admin/；

*：匹配零个或多个字符串，如 /admin 将匹配 /admin、 /admin123，但不匹配 /admin/1；

**：匹配路径中的零个或多个路径，如 /admin/** 将匹配 /admin/a 或 /admin/a/b

**3、** URL匹配顺序；

URL 权限采取第一次匹配优先的方式，即从头开始使用第一个匹配的 url 模式对应的拦截器链。

如：

`/bb/**=filter1`

`/bb/aa=filter2`

`/**=filter3`

如果请求的url是`/bb/aa`，因为按照声明顺序进行匹配，那么将使用 filter1 进行拦截。

## 三、权限配置优化

上面的权限配置是写死在配置文件中的，事实上这些权限配置应该是通过数据库查询获得。

**1、** 修改shiroFilter的配置；

```xml
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <property name="loginUrl" value="/login.jsp"/>
    <property name="successUrl" value="/list.jsp"/>
    <property name="unauthorizedUrl" value="/unauthorized.jsp"/>
    <property name="filterChainDefinitionMap" ref="filterChainDefinitionMap"></property>
</bean>
<!-- 配置一个 bean, 该 bean 实际上是一个 Map. 通过实例工厂方法的方式 -->
<bean id="filterChainDefinitionMap" 
	factory-bean="filterChainDefinitionMapBuilder" factory-method="buildFilterChainDefinitionMap"></bean>
<bean id="filterChainDefinitionMapBuilder"
	class="com.atguigu.shiro.factory.FilterChainDefinitionMapBuilder"></bean>
```

**2、** 实例工厂类FilterChainDefinitionMapBuilder；

```java
public class FilterChainDefinitionMapBuilder {
	public LinkedHashMap<String, String> buildFilterChainDefinitionMap(){
		LinkedHashMap<String, String> map = new LinkedHashMap<>();
		map.put("/login.jsp", "anon");
		map.put("/shiro/login", "anon");
		map.put("/shiro/logout", "logout");
		map.put("/user.jsp", "roles[user]");
		map.put("/admin.jsp", "roles[admin]");
		map.put("/**", "authc");
		return map;
	}
}
```
