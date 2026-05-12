# 08、Shiro 实战：授权源码解析
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/23.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
## 一、简介：

Shiro的Subject门面为我们提供了两套验证角色与权限的API接口。一组是以has开头的，它返回Boolean类型，如果你有此权限，那么返回true，反之返回false。另外一组是以check开头的，无任何返回值。它在检查你的角色信息或者权限信息的时候，如果你有此权限或者角色信息，它将不做任何操作，反之，则抛出一个异常，以中断当前程序的运行

## 二、授权流程：

**1、** 客户端调用Subject.isPermitted(“code:insert”)，判断当前用户是否有"code:insert"权限；

**2、** Subject门面对象接收到要被验证的权限信息"code:insert"，并将其委托给securityManager中验证；

**3、** securityManager将验证请求再次委托给内部组件Authorizer去验证；

**4、** 内部组件Authorizer又将其委托给了AuthorizingRealm去做；

**5、** AuthorizingRealm先将用户传入的权限解析成一个Permission对象再调用isPermitted(principals,p)方法；

**6、** isPermitted的方法体中，调用我们自定义Realm重写的doGetAuthorizationInfo方法，获取我们从数据库中查询出来的权限信息；

**7、** 最后将用户传入的权限，与我们从数据库中查出来的权限做比较如果用户传入的权限在我们从数据库中查出来的权限中，则返回true，否则返回false；
