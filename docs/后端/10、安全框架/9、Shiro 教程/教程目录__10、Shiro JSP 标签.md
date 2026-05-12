# 10、Shiro JSP 标签
- 来源：https://ddkk.com/zhuanlan/security/shiro/1/10.html
- 分类：安全框架
- 分组：教程目录
## JSP 标签

Shiro 提供了 JSTL 标签用于在 JSP/GSP 页面进行权限控制，如根据登录用户显示相应的页面按钮。

**导入标签库**

``

标签库定义在 shiro-web.jar 包下的 META-INF/shiro.tld 中定义。

guest 标签

```java
<shiro:guest>
欢迎游客访问，<a href="${pageContext.request.contextPath}/login.jsp">登录</a>
</shiro:guest> 
```

用户没有身份验证时显示相应信息，即游客访问信息。

**user 标签**

```java
<shiro:guest>
欢迎游客访问，<a href="${pageContext.request.contextPath}/login.jsp">登录</a>
</shiro:guest> 
```

用户已经身份验证 / 记住我登录后显示相应的信息。

**authenticated 标签**

```java
<shiro:authenticated>
    用户[<shiro:principal/>]已身份验证通过
</shiro:authenticated> 
```

用户已经身份验证通过，即 Subject.login 登录成功，不是记住我登录的。

**notAuthenticated 标签**

```java
<shiro:notAuthenticated>
    未身份验证（包括记住我）
</shiro:notAuthenticated> 
```

用户已经身份验证通过，即没有调用 Subject.login 进行登录，包括记住我自动登录的也属于未进行身份验证。

**principal 标签**

``

显示用户身份信息，默认调用 Subject.getPrincipal() 获取，即 Primary Principal。

``

相当于Subject.getPrincipals().oneByType(String.class)。

``

相当于Subject.getPrincipals().oneByType(String.class)。

``

相当于((User)Subject.getPrincipals()).getUsername()。

**hasRole 标签**

```java
<shiro:hasRole name="admin">
    用户[<shiro:principal/>]拥有角色admin<br/>
</shiro:hasRole> 
```

如果当前 Subject 有角色将显示 body 体内容。

**hasAnyRoles 标签**

```java
<shiro:hasAnyRoles name="admin,user">
    用户[<shiro:principal/>]拥有角色admin或user<br/>
</shiro:hasAnyRoles> 
```

如果当前 Subject 有任意一个角色（或的关系）将显示 body 体内容。

**lacksRole 标签**

```java
<shiro:lacksRole name="abc">
    用户[<shiro:principal/>]没有角色abc<br/>
</shiro:lacksRole> 
```

如果当前 Subject 没有角色将显示 body 体内容。

**hasPermission 标签**

```java
<shiro:hasPermission name="user:create">
    用户[<shiro:principal/>]拥有权限user:create<br/>
</shiro:hasPermission> 
```

如果当前 Subject 有权限将显示 body 体内容。

**lacksPermission 标签**

```java
<shiro:lacksPermission name="org:create">
    用户[<shiro:principal/>]没有权限org:create<br/>
</shiro:lacksPermission> 
```

如果当前 Subject 没有权限将显示 body 体内容。

另外又提供了几个权限控制相关的标签：

**导入自定义标签库**

``

**示例**

```java
<zhang:hasAllRoles name="admin,user">
    用户[<shiro:principal/>]拥有角色admin和user<br/>
</zhang:hasAllRoles>
<zhang:hasAllPermissions name="user:create,user:update">
    用户[<shiro:principal/>]拥有权限user:create和user:update<br/>
</zhang:hasAllPermissions>
<zhang:hasAnyPermissions name="user:create,abc:update">
    用户[<shiro:principal/>]拥有权限user:create或abc:update<br/>
</zhang:hasAnyPermissions> 
```

hasAllRoles 表示拥有所有相关的角色；hasAllPermissions 表示拥有所有相关的权限；hasAnyPermissions 表示拥有任意一个相关的权限。
