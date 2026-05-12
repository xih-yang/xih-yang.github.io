# 08、Shiro 入门：加密算法
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/17.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (A)
- 在身份认证的过程中往往都会涉及到加密,如果不加密,这个时候信息就会非常的不安全,shiro 中提供的算法比较多
- 如 MD5 SHA 等

### 1.手动处理数据时，自行使用MD5加密

```java
package com.shiro3;
import org.apache.shiro.crypto.hash.Md5Hash;
public class TestDemo {
    public static void main(String[] args) {
        //使用MD5加密
        Md5Hash md5 = new Md5Hash("DQC");
        System.out.println("DQC==" + md5);
        //加盐
        md5 = new Md5Hash("DQC", "DQCGM");
        System.out.println("DQC==" + md5);
        //迭代次数
        md5 = new Md5Hash("DQC", "DQCGM", 2);
        System.out.println("DQC==" + md5);
    }
}
```

运行结果：

### 2.使用Shiro的MD5方式进行加密

数据库：

```java
[main]
#设置securityManager中realm
credentialsMatcher=org.apache.shiro.authc.credential.HashedCredentialsMatcher
#设置加密方式
credentialsMatcher.hashAlgorithmName=md5
#设置迭代次数
credentialsMatcher.hashIterations=2
userRealm=com.shiro3.UserRealm
userRealm.credentialsMatcher=$credentialsMatcher
securityManager.realms=$userRealm
```

```java
package com.shiro3;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.SimpleAuthenticationInfo;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.ByteSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
public class UserRealm extends AuthorizingRealm {
    //认证
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
        try {
            Class.forName("com.mysql.jdbc.Driver");
            Connection conn = DriverManager.getConnection("jdbc:mysql://127.0.0.1:3306/shiro", "root", "Root");
            PreparedStatement prepareStatement = conn.prepareStatement("select  uname,pwd  from  admin ");
            ResultSet rs = prepareStatement.executeQuery();
            System.out.println(rs);
            while (rs.next()) {
            	//ByteSource.Util.bytes("DQCGM")是加盐的盐是什么
                SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(rs.getString("uname"), rs.getString("pwd"), ByteSource.Util.bytes("DQCGM"), "userRealm");
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
        return null;
    }
}
```

```java
package com.shiro3;
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
        Factory<SecurityManager> factory = new IniSecurityManagerFactory("classpath:shiro-jdbc3.ini");
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
            }
        } catch (IncorrectCredentialsException e) {
            System.out.println("登录失败");
        } catch (UnknownAccountException e) {
            System.out.println("用户名不正确");
        }
    }
}
```

运行结果：
