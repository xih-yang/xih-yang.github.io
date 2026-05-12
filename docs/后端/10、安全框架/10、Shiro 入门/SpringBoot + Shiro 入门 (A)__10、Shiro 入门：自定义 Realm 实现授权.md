# 10、Shiro 入门：自定义 Realm 实现授权
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/19.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (A)
- 我们仅仅通过配置文件指定授权是非常的不灵活的
- 在实际的应用中我们是将用户的信息和合权限信息保存到数据库中，我们是从数据库中获得用户的信息 ，使用 JDBCRealm 进行授权 。
- 使用 JDBCRealm 操作的时候也不是很灵活。所以我们一般使用自定义 Realm 实现授权。

代码实现：

```java
package com.shiro;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.IncorrectCredentialsException;
import org.apache.shiro.authc.UnknownAccountException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.util.Factory;
public class TestB {
    public static void main(String[] args) {
        /*Realm*/
        //[1]解析shiro.ini文件
        Factory<SecurityManager> factory = new IniSecurityManagerFactory("classpath:shiro-jdbc2.ini");
        //[2]通过SecurityManager工厂获得SecurityManager实例
        SecurityManager securityManager = factory.getInstance();
        //[3]把SecurityManager对象设置到运行环境中
        SecurityUtils.setSecurityManager(securityManager);
        //[4]通过SecurityUtils获得主体subject
        Subject subject = SecurityUtils.getSubject();
        //[5]书写自己输入的账号和密码---相当于用户自己输入的账号和密码
        //我们拿着自己书写用户名密码去和shiro.ini 文件中的账号密码比较
        UsernamePasswordToken token = new UsernamePasswordToken("DQCGM", "123");
        try {
            //[6]进行身份的验证
            subject.login(token);
            //[7]通过方法判断是否登录成功
            if (subject.isAuthenticated()) {
                System.out.println("登录成功");
                //授权的校验
                System.out.println("是否存在该菜单：" + subject.isPermitted("updateUser2123"));
            }
        } catch (IncorrectCredentialsException e) {
            System.out.println("登录失败");
        } catch (UnknownAccountException e) {
            System.out.println("用户名不正确");
        }
    }
}
```

```java
package com.shiro;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.SimpleAuthenticationInfo;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
public class UserRealm extends AuthorizingRealm {
    //认证
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
        //System.out.println(authenticationToken.getPrincipal());
        try {
            Class.forName("com.mysql.jdbc.Driver");
            Connection conn = DriverManager.getConnection("jdbc:mysql://127.0.0.1:3306/shiro", "root", "Root");
            PreparedStatement prepareStatement = conn.prepareStatement("select  pwd  from  admin  where  uname =? ");
            prepareStatement.setObject(1, authenticationToken.getPrincipal());
            ResultSet rs = prepareStatement.executeQuery();
            while (rs.next()) {
                SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(authenticationToken.getPrincipal(), rs.getString("pwd"), "userRealm");
                return info;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
    //授权
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principalCollection) {
        String username = principalCollection.getPrimaryPrincipal().toString();
        //获得username  然后去数据库查询这个用户对应的角色，在根据角色查询出指定角色下对应的菜单，
        //返回给指定角色下的所有菜单--List集合
        System.out.println("username=" + username);
        //模拟数据库查的菜单
        List<String> list = new ArrayList<>();
        list.add("updateUser");
        list.add("addUser");
        list.add("deleteUser");
        SimpleAuthorizationInfo simpleAuthorizationInfo = new SimpleAuthorizationInfo();
        for (String l : list) {
            simpleAuthorizationInfo.addStringPermission(l);
        }
        return simpleAuthorizationInfo;
    }
}
```

```java
[main]
#设置securityManager中realm
userRealm=com.shiro.UserRealm
securityManager.realms=$userRealm
```

运行结果：
