# 09、Shiro 入门：授权
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/18.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (A)
### 1.一般授权

- 授权:给身份认证通过的任授予某些资源的访问权限
- 权限的粒度 粗粒度 细粒度
- 粗粒度

User 具有 CRUD 的操作 通常指的是表的操作
- 细粒度
- 只允许查询 id=1 的用户 使用业务代码实现
- Shiro 的授权是粗粒度
- 角色：角色就是权限的集合

代码实现：

```java
package com.shiro1;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.IncorrectCredentialsException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.util.Factory;
import java.util.Arrays;
public class TestA {
    public static void main(String[] args) {
        //[1]解析shiro.ini文件
        Factory<SecurityManager> factory = new IniSecurityManagerFactory("classpath:shiro.ini");
        //[2]通过SecurityManager工厂获得SecurityManager实例
        SecurityManager securityManager = factory.getInstance();
        //[3]把SecurityManager对象设置到运行环境中
        SecurityUtils.setSecurityManager(securityManager);
        //[4]通过SecurityUtils获得主体subject
        Subject subject = SecurityUtils.getSubject();
        //[5]书写自己输入的账号和密码---相当于用户自己输入的账号和密码
        //我们拿着自己书写用户名密码去和shiro.ini 文件中的账号密码比较
        UsernamePasswordToken token = new UsernamePasswordToken("zs", "123");
        try {
            //[6]进行身份的验证
            subject.login(token);
        } catch (IncorrectCredentialsException e) {
            System.out.println("登录失败");
        }
        //授权的查询
        //基于角色的授权
        boolean flag = subject.hasRole("role1");
        System.out.println(flag);
        //判断是否具有多个角色
        boolean[] booleans = subject.hasRoles(Arrays.asList("role1", "role3"));
        for(Boolean b:booleans){
            System.out.println(b);
        }
        //可以使用checkRole判断指定用户是否具有对应角色
        //如果指定用户下没有对应的角色就会抛出异常UnauthorizedException
       /* subject.checkRole("role3");
        subject.checkRoles("role1","role2");*/
        //基于资源的授权
        boolean flag2 = subject.isPermitted("iii");
        System.out.println(flag2);
        //判读是否具有多个资源
        boolean permittedAll = subject.isPermittedAll("add", "oo", "ii");
        //通过checkPermission 进行判断指定用户下是否有指定的资源
        //如果没有就会抛出UnauthorizedException
        subject.checkPermission("uu");
        subject.checkPermissions("ii", "ooo", "add");
    }
}
```

```java
#指定具体的用户
[users]
zs=123,role1,role2
DQC=root
#角色的定义
[roles]
role1=add,update,delete
role2=find
#给对象中的属性赋值
#[main]
```

运行结果：

### 2.Shiro 中的授权检查的 3 种方式

- 编程式
- 注解式

```java
package com.shiro1;
import org.apache.shiro.authz.annotation.RequiresRoles;
public class Role {
	//加上后只有管理员可以访问这个方法
    @RequiresRoles("管理员")
    public void aa(){
    }
}
```

- 标签配置

```java
//在jsp中使用可以让持有add角色的人访问标签里的内容
<shiro:hasPermission name="add"> 
	<a>添加操作</a> 
</shiro:hasPermission>
```
