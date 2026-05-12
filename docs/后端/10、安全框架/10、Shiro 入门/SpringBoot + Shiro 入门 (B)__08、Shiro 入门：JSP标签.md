# 08、Shiro 入门：JSP标签
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/27.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (B)
## JSP 标签

Shiro 提供了 JSTL 标签用于在 JSP/GSP 页面进行权限控制，如根据登录用户显示相应的页面按钮。

**导入标签库**

``

**guest 标签**

```xml
<shiro:guest>
欢迎游客访问，<a href="${pageContext.request.contextPath}/login.jsp">登录</a>
</shiro:guest>
```

用户没有身份验证时显示相应信息，即游客访问信息。

**user 标签**

```xml
<shiro:user>
欢迎访问，<a href="${pageContext.request.contextPath}/login.jsp">登录</a>
</shiro:user>
```

用户已经身份验证 / 记住我登录后显示相应的信息。

**authenticated 标签**

```xml
<shiro:authenticated>
    用户[<shiro:principal/>]已身份验证通过
</shiro:authenticated>
```

用户已经身份验证通过，即 Subject.login 登录成功，不是记住我登录的。

**notAuthenticated 标签**

```xml
<shiro:notAuthenticated>
    未身份验证（包括记住我）
</shiro:notAuthenticated> 
```

用户已经身份验证通过，即没有调用 Subject.login 进行登录，包括记住我自动登录的也属于未进行身份验证。

**principal 标签**

```xml
<shiro: principal/>
显示用户身份信息，默认调用 Subject.getPrincipal() 获取，即 Primary Principal。
<shiro:principal type="java.lang.String"/>
相当于 Subject.getPrincipals().oneByType(String.class)。
<shiro:principal type="java.lang.String"/>
相当于 Subject.getPrincipals().oneByType(String.class)。
<shiro:principal property="username"/>
相当于 ((User)Subject.getPrincipals()).getUsername()。
```

**hasRole 标签**

```xml
<shiro:hasRole name="admin">
    用户[<shiro:principal/>]拥有角色admin<br/>
</shiro:hasRole>
```

如果当前 Subject 有角色将显示 body 体内容。

**hasAnyRoles 标签**

```xml
<shiro:hasAnyRoles name="admin,user">
    用户[<shiro:principal/>]拥有角色admin或user<br/>
</shiro:hasAnyRoles>
```

如果当前 Subject 有任意一个角色（或的关系）将显示 body 体内容。

**lacksRole 标签**

```xml
<shiro:lacksRole name="abc">
    用户[<shiro:principal/>]没有角色abc<br/>
</shiro:lacksRole>
```

如果当前 Subject 没有角色将显示 body 体内容。

**hasPermission 标签**

```xml
<shiro:hasPermission name="user:create">
    用户[<shiro:principal/>]拥有权限user:create<br/>
</shiro:hasPermission>
```

如果当前 Subject 有权限将显示 body 体内容。

**lacksPermission 标签**

```xml
<shiro:lacksPermission name="org:create">
    用户[<shiro:principal/>]没有权限org:create<br/>
</shiro:lacksPermission>
```
