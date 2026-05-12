# 02、Shiro 入门：Shiro 的认证
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/11.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (A)
**第一：导包**

**第二：书写 shiro.ini 文件**

```java
[users]
DQC=123
DQCGM=root
```

**第三：书写测试代码**

```java
package com.shiro1;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.IncorrectCredentialsException;
import org.apache.shiro.authc.UnknownAccountException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.realm.jdbc.JdbcRealm;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.util.Factory;
import org.apache.shiro.mgt.SecurityManager;
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
        UsernamePasswordToken token = new UsernamePasswordToken("DQC", "123");
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
