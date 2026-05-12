# 09、Shiro 实战：基于前端的权限控制和基于后端的权限控制
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/24.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
问题描述：

如何让前端的某个按钮在用户拥有该按钮的权限时才显示？如何让后端的某个接口在用户拥有该访问的权限时才可以访问？

解决方法：

基于前端的权限控制：前端某个按钮的隐藏或显示可以通过shiro的页面标签来控制，当用户拥有该权限时，我们就让该按钮显示，否则隐藏；

基于后端的权限控制：后端的某个接口我们可以通过shiro的注解来控制是否允许访问，当用户拥有该权限时，我们就允许访问，否则不允许访问；

## 一、基于前端的权限控制

标签名
作用

shiro:guest
允许游客访问的代码块

shiro:user
允许已经验证或者通过"记住我"登录的用户才能访问的代码块。

shiro:authenticated
只有通过登录操作认证身份，而并非通过"记住我"登录的用户才能访问的代码块。

shiro:notAuthenticated
未登录的用户显示的代码块。

shiro:principal
显示当前登录的用户信息。

只有拥有admin角色的用户才能访问的代码块。

只有拥有admin或者manager角色的用户才能访问的代码块。

没有admin角色的用户显示的代码块

只有拥有"admin:delete"权限的用户才能访问的代码块。

没有"admin:delete"权限的用户显示的代码块。

**1、** 添加依赖；

```xml
<!-- springboot 集成shiro依赖-->
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-spring</artifactId>
    <version>1.4.0</version>
</dependency>
<!-- 因为shiro默认是jsp页面的，官方文档上的标签也只支持taglib，所以需要thymeleaf额外集成shiro标签支持 -->
<dependency>
    <groupId>com.github.theborakompanioni</groupId>
    <artifactId>thymeleaf-extras-shiro</artifactId>
    <version>2.0.0</version>
</dependency>
```

**2、** 在页面头上加标签支持；

```xml
<html  xmlns:th="http://www.thymeleaf.org" xmlns:shiro="http://www.pollix.at/thymeleaf/shiro">
```

**3、** 配置shiro标签；

```java
//配置ShiroDialect:用于thymeleaf和shiro标签配合使用
@Bean
public ShiroDialect getShiroDialect(){
    return new ShiroDialect();
}
```

**4、** 在页面中使用shiro标签进行权限控制:有两种方式；

```xml
<script type="text/html" id="toolbar">
    <!--方式1-->
    <div class="layui-btn-group">
        <button type="button" class="layui-btn" lay-event="addMenu" shiro:hasPermission="sys:permission:add">
            <i class="layui-icon"></i> 添加
        </button>
        <button type="button" class="layui-btn" lay-event="deleteMenu" shiro:hasPermission="sys:permission:delete">
            <i class="layui-icon"></i> 删除
        </button>
    </div>
    <!--方式2-->
    <shiro:hasPermission name=“sys:permission:update”>
    <div class="layui-btn-group">
        <button type="button" class="layui-btn" lay-event="updateMenu">
            <i class="layui-icon"></i> 更新
        </button>
    </div>
    <shiro:hasPermission>
</script>
```

## 二、基于后端的权限控制

`@RequiresAuthentication`：表示当前Subject已经通过login 进行了身份验证；即 Subject. isAuthenticated() 返回 true。

`@RequiresUser`：表示当前 Subject 已经身份验证或者通过记住我登录的。

`@RequiresGuest`：表示当前Subject没有身份验证或通过记住我登录过，即是游客身份。

`@RequiresRoles(value={“admin”, “user”}, logical= Logical.AND)`：表示当前 Subject 需要 admin 和 user 角色。

`@RequiresPermissions (value={“user:a”, “user:b”}, logical= Logical.OR)`：表示当前 Subject 需要 `user:a` 或 `user:b` 权限

**1、** 添加依赖；

```xml
<!-- springboot 集成shiro依赖-->
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-spring</artifactId>
    <version>1.4.0</version>
</dependency>
<!-- 因为shiro默认是jsp页面的，官方文档上的标签也只支持taglib，所以需要thymeleaf额                外集成shiro标签支持 -->
<dependency>
    <groupId>com.github.theborakompanioni</groupId>
    <artifactId>thymeleaf-extras-shiro</artifactId>
    <version>2.0.0</version>
</dependency>
```

**2、** 配置注解支持；

```java
/**
 * 开启shiro aop注解支持.
 */
@Bean
public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(SecurityManager securityManager) {
    AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor =       new AuthorizationAttributeSourceAdvisor();
    authorizationAttributeSourceAdvisor.setSecurityManager(securityManager);
    return authorizationAttributeSourceAdvisor;
}
```

**3、** 在控制层接口上添加注解；

```java
@GetMapping("/users")
@RequiresPermissions("sys:user:list") //只有拥有该权限的用户才能访问该接口
public DataResult<List<User>> getAllDept(User user){
    DataResult result =DataResult.success();
    result.setData(this.userService.getUser());
    return result;
}
```
