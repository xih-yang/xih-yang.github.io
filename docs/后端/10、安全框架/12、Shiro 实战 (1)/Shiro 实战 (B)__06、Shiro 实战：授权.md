# 06、Shiro 实战：授权
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/21.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
## 一、简介：

授权，也叫访问控制，即在应用中控制谁访问哪些资源（如访问页面/编辑数据/页面操作等）。在授权中需了解的几个关键对象：主体（Subject）、资源（Resource）、权限 （Permission）、角色（Role）。

**主体(Subject)**：访问应用的用户，在 Shiro 中使用 Subject 代表该用户。用户只有授权 后才允许访问相应的资源。

**资源(Resource)**：在应用中用户可以访问的 URL，比如访问 JSP 页面、查看/编辑某些 数据、访问某个业务方法、打印文本等等都是资源。用户只要授权后才能访问。

**权限(Permission)**：安全策略中的原子授权单位，通过权限我们可以表示在应用中用户有没有操作某个资源的权力。即权限表示在应用中用户能不能访问某个资源，如：访问用 户列表页面查看/新增/修改/删除用户数据（即很多时候都是CRUD（增查改删）式权限控 制）等。权限代表了用户有没有操作某个资源的权利，即反映在某个资源上的操作允不允许。

**角色(Role)**：权限的集合，一般情况下会赋予用户角色而不是权限，即这样用户可以拥有 一组权限，赋予权限时比较方便。典型的如：项目经理、技术总监、CTO、开发工程师等都是角色，不同的角色拥有一组不同的权限。

## 二、shiro的三种授权方式：

**1、** 编程式：通过写if/else授权代码块完成；

```java
Subject subject = SecurityUtils.getSubject();  
if(subject.hasRole(“admin”)) {  
    //有权限  
} else {  
    //无权限  
}
```

**2、** 注解式：通过在执行的Java方法上放置相应的注解完成，没有权限将抛出相应的异常；

```java
@RequiresRoles("admin")  
public void hello() {  
    //有权限  
} 
```

**3、** JSP/html标签：在JSP/html页面通过相应的标签完成；

```xml
<shiro:hasRole name="admin">  
<!— 有权限 —>  
</shiro:hasRole>   
```

## 三、授权

授权需要继承 AuthorizingRealm 类，并实现其 doGetAuthorizationInfo 方法。AuthorizingRealm 类继承了 AuthenticatingRealm 类的抽象方法 doGetAuthenticationInfo， 所以认证和授权只需要继承 AuthorizingRealm 就可以了，同时实现他的两个抽象方法

```java
public class ShiroRealm extends AuthorizingRealm {
    //认证
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(
            AuthenticationToken token) throws AuthenticationException {
        return null;
    }
    //授权会被 shiro 回调的方法
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(
            PrincipalCollection principals) {
        //1. 从 PrincipalCollection 中来获取登录用户的信息
        Object principal = principals.getPrimaryPrincipal();
        //2. 利用登录的用户的信息来用户当前用户的角色或权限(可能需要查询数据库)
        Set<String> roles = new HashSet<>();
        roles.add("user");
        if("admin".equals(principal)){
            roles.add("admin");
        }
        //3. 创建 SimpleAuthorizationInfo, 并设置其 reles 属性.
        SimpleAuthorizationInfo info = new SimpleAuthorizationInfo(roles);
        //4. 返回 SimpleAuthorizationInfo 对象. 
        return info;
    }
}
```
