# 18、Shiro 实战：Shiro从数据表中初始化资源和权限
- 来源：https://ddkk.com/zhuanlan/security/shiro/8/18.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
注：该系列所有测试均在之前创建的Shiro3的Web工程的基础上。前面我们讲解了Shiro的标签以及权限注解，下面我们来讲解一下Shiro如何从数据表中初始化资源和权限。

之前在测试的Web工程下，我们在applicationContext.xml中配置了shiroFilter资源拦截器信息：

```xml
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <property name="loginUrl" value="/login.jsp"/>
    <property name="successUrl" value="/list.jsp"/>
    <property name="unauthorizedUrl" value="/index.jsp"/>
    <!--  
    	配置哪些页面需要受保护. 
    	以及访问这些页面需要的权限. 
    	1). anon 可以被匿名访问
    	2). authc 必须认证(即登录)后才可能访问的页面. 
    	3). logout 登出
    	4). roles 角色过滤器
    -->
    <property name="filterChainDefinitions">
        <value>
            /login.jsp = anon
            /userAuth/login = anon
            /userAuth/logout = logout
            /User.jsp = roles[user]
            /admin.jsp = roles[admin]
            everything else requires authentication:
            /** = authc
        </value>
    </property>
</bean>
```

我们注意到受保护的资源根据对应的权限关系是配死在applicationContext.xml配置文件中的。这样配是可以的，但是有的时候受保护的资源与权限的关系特别多，这样一个一个配很不方便，最好的方式是将这些信息配置在数据库中，使用SQL查询的方式将其取出来。那么如何做到呢？

我们注意上面的配置，权限资源都配置在名为“filterChainDefinitions”这个属性中，我们在编译器中使用Ctrl键加鼠标点击该名称，可以看到它是ShiroFilterFactoryBean的一个属性：

```java
public void setFilterChainDefinitions(String definitions) {
    Ini ini = new Ini();
    ini.load(definitions);
    //did they explicitly state a 'urls' section?  Not necessary, but just in case:
    Ini.Section section = ini.getSection(IniFilterChainResolverFactory.URLS);
    if (CollectionUtils.isEmpty(section)) {
        //no urls section.  Since this _is_ a urls chain definition property, just assume the
        //default section contains only the definitions:
        section = ini.getSection(Ini.DEFAULT_SECTION_NAME);
    }
    setFilterChainDefinitionMap(section);
}
```

发现经过一系列初始化后，它调用了setFilterChainDefinitionMap这个方法，点开这个方法：

```java
public void setFilterChainDefinitionMap(Map<String, String> filterChainDefinitionMap) {
     this.filterChainDefinitionMap = filterChainDefinitionMap;
}
```

我们在该处源码打断点，然后启动测试工程，看一下此处传入什么值：

可以看到，这里传入的是一个LinkedHashMap，其中的键值对就是我们在applicationContext.xml配置文件中filterChainDefinitions属性配置的信息。

所以，我们只需要去构建一个Map，然后将其配置为FilterChainDefinitionMap属性就可以了。

配置方式如下：

首先将filterChainDefinitions注释，然后配置一个filterChainDefinitionMap属性，并连接一个Map信息：

```xml
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <property name="loginUrl" value="/login.jsp"/>
    <property name="successUrl" value="/list.jsp"/>
    <property name="unauthorizedUrl" value="/index.jsp"/>
    <property name ="filterChainDefinitionMap" ref="filterChainDefinitionMap"></property>
</bean>
```

然后我们需要去新建并配置一个Bean，通过实例工厂的方式来产生Map。该Bean创建如下：

```java
package com.test.shiro.factory;
import java.util.LinkedHashMap;
public class FilterChainDefinitionMapBuilder {
    public LinkedHashMap<String,String> buildFilterChainDefinitionMap(){
    	LinkedHashMap<String,String> map = new LinkedHashMap<String,String>();
    	return map;
    }
}
```

然后在shiroFilter的bean配置下方放置一个实例工厂和通过实例工厂注册的Map实例：

```xml
<bean id="filterChainDefinitionMap"
    factory-bean="filterChainDefinitionMapBuilder" factory-method="buildFilterChainDefinitionMap"/>
<!-- 配置一个bean，该bean实际上是一个Map，通过实例工厂方法的方式 -->
<bean id="filterChainDefinitionMapBuilder"
    	class="com.test.shiro.factory.FilterChainDefinitionMapBuilder"/>
```

最上面的filterChainDefinitionMap就是在shiroFilter中引入的name ="filterChainDefinitionMap"的property属性。

此时我们就可以在FilterChainDefinitionMapBuilder的buildFilterChainDefinitionMap方法中对Map进行初始化即可，此时就可以从数据库取出相关权限资源信息传入Map中。我们这里没有连接数据库，所以就简单模拟一下数据库取出数据的效果，如下：

```java
package com.test.shiro.factory;
import java.util.LinkedHashMap;
public class FilterChainDefinitionMapBuilder {
    public LinkedHashMap<String,String> buildFilterChainDefinitionMap(){
    	LinkedHashMap<String,String> map = new LinkedHashMap<String,String>();
    	map.put("/login.jsp","anon");
    	map.put("/userAuth/login","anon");
    	map.put("/userAuth/logout","logout");
    	map.put("/User.jsp","roles[user]");
    	map.put("/admin.jsp","roles[admin]");
    	map.put("/**","authc");
    	return map;
    }
}
```

经过测试，登录jack去访问Admin的Page，是被拒绝的：

所以我们使用实例工厂来初始化资源权限信息是成功的。
