# 02、Shiro 速成：SpringBoot+Shiro INI文件介绍，实现认证流程
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/11.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (B)
## INI文件介绍

**1、** INI英文名称(InitializationFile)

**2、** INI文件是Window系统配置文件的扩展名

**3、** Shiro的全局配置文件就是.ini文件，ini中数据都是固定数据，后面会用数据库中数据替代下面users和roles（固定数据部分）

**.ini文件内容的语法和.properties类似都是key=value,value格式.**

## INI文件中包含了四个部分

### 1[main] 主体部分.

这部分配置类对象,或设置属性等操作.

内置了根对象：securityManager，注意对象名大小写。

```java
[main]
securityManager.属性=值
key=value
securityManager.对象属性=com.pojo.People 后面值是字符串
举例：
peo=com.pojo.People
securityManager.对象属性=$peo       出现$时才表示是引用对象
```

### 2[users]

定义用户,密码及用户可以具有的角色.

```java
[users]
用户名=密码,角色1,角色2    角色部分可以省略.
zhangsan=zs
zhangsan=zs,role1,role2
```

### 3[roles]

定于角色具有的权限

```java
[roles]
角色名=权限名,权限名
role1=user:insert,user:update
role2=insert,update
role3=user:*
```

### 4[urls]

定义哪个控制器被哪个过滤器过滤.Shiro内置很多过滤器。此部分主要在WEB应用中使用。

以下就是内置的过滤器

```java
anon：不认证也可以访问。例如：/admin/**=anon
admin这个路径下的所有的功能   不需要认证就可以访问
authc：必须认证。
authcBasic：没有参数时表示httpBasic认证(客户端认证方式)。
logout：退出。
noSessionCreation：新增Filter，表示没有Session创建。
perms：判断是有具有指定权限。
例如：/admin/user/**=perms[“per1”,”per2”]。必须同时具有
给定权限才可以访问。如果只有一个权限可以省略双引号。
port：限制端口。例如：/admin/**=port[8081]。
只要请求不是8081端口就重新发送URL到8081端口。
rest：请求方式和权限的简便写法。例如：/admin/**=rest[user]，
相当于/admin/** = perms[user:方式]，方式是http请求的方式：
post、get等。
roles：判断是否具有指定权限。/admin/**=roles[role1]
ssl：表示是安全的请求。协议为https
user：表示必须存在用户。
```

```java
[urls]
控制器名称=过滤器名称
/login=authc
/**=anon
```

## 认证流程

**1、** 获取主体,通过主体Subject对象的login方法进行登录

**2、** 把Subject中内容传递给Security Manager

**3、** Security Manager内部组件Authenticator进行认证

**4、** 认证数据使用InI Realm,调用Ini文件中数据

名词解释

```java
Principal: 身份。用户名,邮箱,手机等能够唯一确认身份的信息.
Credential: 凭证，代表密码等。
AuthenticationInfo：认证时存储认证信息。
```
