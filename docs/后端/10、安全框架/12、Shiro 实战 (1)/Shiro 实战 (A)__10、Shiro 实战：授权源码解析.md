# 10、Shiro 实战：授权源码解析
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/10.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
## 一、授权流程

**1、** 首先调用 Subject.isPermitted*或hasRole* 接口，其会委托给 SecurityManager，而 SecurityManager 接着会委托给 Authorizer；

**2、** Authorizer是真正的授权者，如果调用如 isPermitted(“user:view”)，其首先会通过 PermissionResolver 把字符串转换成相应的 Permission 实例；

**3、** 在进行授权之前，其会调用相应的 Realm 获取 Subject 相应的角色和权限用于匹配传入的角色和权限；

**4、** Authorizer 会判断 Realm 的角色和权限是否和传入的匹配，如果 有多个Realm，会委托给 ModularRealmAuthorizer 进行循环判断， 如果匹配如 isPermitted*或hasRole* 会返回true，否则返回false表示 授权失败。

## 二、Permissions

规则：`资源标识符：操作：对象实例 ID` 即对哪个资源的哪个实例可以进行什么操作。其默认支持通配符权限字符串： `:表示资源、操作、实例的分割`；`, 表示操作的分割`，`* 表示任意资源、操作、实例`。

**多层次管理：**

例如：`user:query、user:edit`

冒号是一个特殊字符，它用来分隔权限字符串的下一部件：第一部分是权限被操作的领域，第二部分是被执行的操作。

多个值：每个部件能够保护多个值。因此，除了授予用户 `user:query` 和 `user:edit` 权限外，也可以简单地授予他们一个：`user:query,edit`

还可以用 `*` 号代替所有的值，如：`user:*` ， 也可以写：`*:query`，表示 某个用户在所有的领域都有 query 的权限。

**实例：**

通常会使用三个部件：域、操作、被付诸实施的实例。如：`user:edit:manager`

也可以使用通配符来定义，如：`user:edit:*`、`user:*:*`、 `user:*:manager`

部分省略通配符：缺少的部件意味着用户可以访问所有与之匹配的值，比如：`user:edit` 等价于 `user:edit :*`、 `user` 等价于 `user:*:*`

注意：通配符只能从字符串的结尾处省略部件，也就 是说 `user:edit` 并不等价于 `user:*:edit`

## 三、ModularRealmAuthorizer

ModularRealmAuthorizer 进行多 Realm 匹配流程：

**1、**首先检查相应的 Realm 是否实现了实现了Authorizer；

**2、**如果实现了 Authorizer，那么接着调用其相应的 isPermitted*或hasRole* 接口进行匹配；

**3、**如果有一个Realm匹配那么将返回 true，否则返回 false。

## 四、源码解析

Shiro的Subject门面为我们提供了两套验证角色与权限的API接口。一组是以has开头的，它返回Boolean类型，如果你有此权限，那么返回true，反之返回false。另外一组是以check开头的，无任何返回值。它在检查你的角色信息或者权限信息的时候，如果你有此权限或者角色信息，它将不做任何操作，反之，则抛出一个异常，以中断当前程序的运行。

**1、** 客户端调用Subject.isPermitted(“code:insert”)，判断当前用户是否有"code:insert"权限；

**2、** Subject门面对象接收到要被验证的权限信息"code:insert"，并将其委托给securityManager中验证；

**3、** securityManager将验证请求再次委托给内部组件Authorizer去验证；

**4、** 内部组件Authorizer又将其委托给了我们自定义的Realm去做；

**5、** 我们自定义的Realm先将用户传入的权限解析成一个Permission对象再调用isPermitted(principals,p)方法；

**6、** isPermitted的方法体中，调用我们重写的doGetAuthorizationInfo方法，获取我们从数据库中查询出来的权限信息；

**7、** 最后将用户传入的权限，与我们从数据库中查出来的权限做比较如果用户传入的权限在我们从数据库中查出来的权限中，则返回true，否则返回false；
