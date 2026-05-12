# 05、Shiro 入门：授权
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/24.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (B)
## 授权

授权，也叫访问控制，即在应用中控制谁能访问哪些资源（如访问页面/编辑数据/页面操作等）。在授权中需了解的几个关键对象：**主体（Subject）、资源（Resource）、权限（Permission）、角色（Role）。**

**主体**

主体，即访问应用的用户，在 Shiro 中使用 **Subject** 代表该用户。用户只有授权后才允许访问相应的资源。

**资源**

在应用中用户可以访问的任何东西，比如访问 JSP 页面、查看/编辑某些数据、访问某个业务方法、打印文本等等都是资源。用户只要授权后才能访问。

**权限**

安全策略中的原子授权单位，通过权限我们可以表示在应用中用户有没有操作某个资源的权力。即权限表示在应用中用户能不能访问某个资源，如： 访问用户列表页面

查看/新增/修改/删除用户数据（即很多时候都是 CRUD（增查改删）式权限控制）

打印文档等等。。。

如上可以看出，权限代表了用户有没有操作某个资源的权利，即反映在某个资源上的操作允不允许，不反映谁去执行这个操作。所以后续还需要把权限赋予给用户，即定义哪个用户允许在某个资源上做什么操作（权限），Shiro 不会去做这件事情，而是由实现人员提供。

Shiro 支持粗粒度权限（如用户模块的所有权限）和细粒度权限（操作某个用户的权限，即实例级别的），后续部分介绍。

**角色**

角色代表了操作集合，可以理解为权限的集合，一般情况下我们会赋予用户角色而不是权限，即这样用户可以拥有一组权限，赋予权限时比较方便。典型的如：项目经理、技术总监、CTO、开发工程师等都是角色，不同的角色拥有一组不同的权限。

**隐式角色**：

即直接通过角色来验证用户有没有操作权限，如在应用中 CTO、技术总监、开发工程师可以使用打印机，假设某天不允许开发工程师使用打印机，此时需要从应用中删除相应代码；再如在应用中 CTO、技术总监可以查看用户、查看权限；突然有一天不允许技术总监查看用户、查看权限了，需要在相关代码中把技术总监角色从判断逻辑中删除掉；即粒度是以角色为单位进行访问控制的，粒度较粗；如果进行修改可能造成多处代码修改。

**显示角色**：

在程序中通过权限控制谁能访问某个资源，角色聚合一组权限集合；这样假设哪个角色不能访问某个资源，只需要从角色代表的权限集合中移除即可；无须修改多处代码；即粒度是以资源/实例为单位的；粒度较细。

## 基于角色与基于资源的权限访问控制(RBAC和RBAC新解)

基于角色的权限访问控制**RBAC**（**role**-based access control）是**以角色为中心**进行的访问控制，也就是判断主体subject是那个角色的方式进行权限访问控制，是粗粒度的

基于资源的权限访问控制**RBAC**（**resource**-based access control）是**以资源为中心**进行的访问控制，只需要为角色添加权限就可以

区别：

由于基于角色的权限访问控制的**角色与权限**往往是多对多的关系（比如admin角色可以所有CURD的权限，部门经理角色有Retrieve权限，这就是多对多关系了），如果角色所对应的权限发生变化 ，那我们所编写的判断逻辑就必须发生改变，可扩展性差

```java
比如：原本只有admin可以访问，那么判断可以这么写
if(role.equals(”admin”)){
　　　//retrieve
}
```

但是假设后期需要给部门经理角色也赋予retrieve权限，那么必须改变原有代码，或者另外增加代码，总之要改变原有的判断逻辑

```java
if(role.equals("admin") || role.equals("manager")){
//retrieve　　　　
\}
```

如果是基于资源的权限访问控制，资源和权限一对一关系比较常见，很多时候资源和权限在数据库中会被合并在一张表中，只需要为资源分配相应的权限。所以一个具体操作对应的权限，只要直接判断用户是否拥有该权限即可，可扩展性强

```java
//判断用户是否具有查看权限，用户的角色可以任意变化，而这条判断语句始终是可行的
if(user.hasPermission("retrieve")){
　　//retrieve　
}
如果用户的权限需要改变，只需要对数据库中用户的角色对应的权限进行改变，而权限与对应资源通常不会有改变的需求
```

**授权方式：**

Shiro 支持三种方式的授权：

编程式：通过写 if/else 授权代码块完成：

```java
Subject subject = SecurityUtils.getSubject();
if(subject.hasRole(“admin”)) {
    //有权限
} else {
    //无权限
}
```

```java
注解式：通过在执行的 Java 方法上放置相应的注解完成：
```

```java
@RequiresRoles("admin")
public void hello() {
    //有权限
}
```

没有权限将抛出相应的异常；

JSP/GSP 标签：在 JSP/GSP 页面通过相应的标签完成：

```xml
<shiro:hasRole name="admin">
<!— 有权限 —>
</shiro:hasRole>
```

Demo:

**基于角色的访问控制（隐式角色）**

配置文件：

测试：

```java
public class TestRole {
    @Test
    public void t1(){
        Factory<SecurityManager> factory= new IniSecurityManagerFactory("classpath:shiro-role.ini");
        SecurityManager securityManager = factory.getInstance();
        SecurityUtils.setSecurityManager(securityManager);
        Subject subject = SecurityUtils.getSubject();
        UsernamePasswordToken token=new UsernamePasswordToken("lc","123");
        try {
            subject.login(token);
            System.out.println("用户是否拥有此角色："+subject.hasRole("user"));
            System.out.println("用户是否拥有任意一个角色："+subject.hasAllRoles(Arrays.asList("admin","root")));
            System.out.println("用户受否拥有角色："+Arrays.toString(subject.hasRoles(Arrays.asList("admin","root"))));
　　　　　　  subject.checkRole("admin");
            subject.checkRoles("admin","r");
            System.out.println();
        }catch (AuthenticationException e){
            System.out.println("失败！ "+e);
        }
        subject.logout();
    }
}
```

由配置文件知，lc用户只有admin与root两个角色，没有user角色，所以是false，其他两个方法类似；checkRole检查断言角色，admin可以，没有r角色所以报错。

**基于资源的访问控制（显示角色）**

配置文件：两个用户对应着自己的角色，角色对应着权限

root角色权限：select,update,insert,delete

admin角色权限：select,delete

user角色权限：select

测试：

由配置文件知cc用户角色为user，对应的权限为select，lc用户角色为root,admin，权限为select，update，insert,delete

```java
@Test
public void t2(){
        Factory<SecurityManager> factory=new IniSecurityManagerFactory("classpath:shiro-permission.ini");
        SecurityManager securityManager = factory.getInstance();
        SecurityUtils.setSecurityManager(securityManager);
        Subject subject = SecurityUtils.getSubject();
        UsernamePasswordToken token=new UsernamePasswordToken("cc","123");
        UsernamePasswordToken token2=new UsernamePasswordToken("lc","123");
        try {
                subject.login(token);
                System.out.println(subject.isPermitted("select"));
                System.out.println( subject.isPermittedAll("select","insert","delete"));
                subject.login(token2);
                System.out.println(subject.isPermitted("select"));
                System.out.println( subject.isPermittedAll("select","insert","delete"));
                　　　　　　　　
                subject.checkPermission("select");
                subject.checkPermissions("select","insert");
        }
    catch (AuthenticationException e){ 
        System.out.println("nono"+e); } 
    subject.logout();
    }
```

结果：

### 授权流程

**1、** 首先调用`Subject.isPermitted*/hasRole*`接口，其会委托给SecurityManager，而SecurityManager接着会委托给Authorizer；

**2、****Authorizer是真正的授权者**，如果我们调用如isPermitted(“select”)，其首先会通过PermissionResolver把字符串转换成相应的Permission实例；

**3、** 在进行授权之前，其会调用相应的Realm获取Subject相应的角色/权限用于匹配传入的角色/权限；

**4、** Authorizer会判断Realm的角色/权限是否和传入的匹配，如果有多个Realm，会委托给ModularRealmAuthorizer进行循环判断，如果匹配如`isPermitted*/hasRole*`会返回true，否则返回false表示授权失败；

经典权限系：

大致用到５张表：用户表（UserInfo）、角色表（RoleInfo）、菜单表（MenuInfo）、用户角色表（UserRole）、角色菜单表（RoleMenu）。

**各表的大体表结构如下：**

**１、** 用户表（UserInfo）：Id、UserName、UserPwd

**２、** 角色表（RoleInfo）：Id、RoleName

**３、** 菜单表（MenuInfo）：Id、MenuName

**４、** 用户角色表（UserRole）：Id、UserId、RoleId

**５、** 角色菜单表（RoleMenu）：Id、RoleId、MenuId

最关键的地方是，某个用户登录时，如何查找该用户的菜单权限？其实一条语句即可搞定：

假如用户的用户名为zhangsan，则他的菜单权限查询如下：

```java
Select m.Id,m.MenuName from MenuInfo m ,UserInfo u UserRole ur, RoleMenu rm Where m.Id = rm.MenuId and ur.RoleId = rm.RoleId and ur.UserId = u.Id and u.UserName = 'zhangsan'
```
