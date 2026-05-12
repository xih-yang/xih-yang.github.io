# 06、Shiro 入门：认证策略
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/15.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (A)
全部三个例子只需要更改配置验证器最后的认证策略就行了

导包：

数据库创建：

- 规定了如果有多个数据源的时候应该如何操作

### 1.AtLeastOneSuccessfulStrategy

- 如果一个（或更多）Realm 验证成功，则整体的尝试被认为是成功的。
- 如果没有一个验证成功，
- 则整体尝试失败 类似于 java 中的 &

```java
[main]
#获得数据源A
dataSou=com.mchange.v2.c3p0.ComboPooledDataSource
dataSou.driverClass=com.mysql.jdbc.Driver
dataSou.jdbcUrl=jdbc:mysql://127.0.0.1:3306/shiro
dataSou.user=root
dataSou.password=Root
#配置了jdbcRealmA
jdbcRealm=org.apache.shiro.realm.jdbc.JdbcRealm
jdbcRealm.dataSource=$dataSou
#获得数据源B
dataSou1=com.mchange.v2.c3p0.ComboPooledDataSource
dataSou1.driverClass=com.mysql.jdbc.Driver
dataSou1.jdbcUrl=jdbc:mysql://127.0.0.1:3306/shiro1
dataSou1.user=root
dataSou1.password=Root
#配置了jdbcRealmB
jdbcRealm1=org.apache.shiro.realm.jdbc.JdbcRealm
jdbcRealm1.dataSource=$dataSou1
#配置验证器
authenticationStrategy=org.apache.shiro.authc.pam.AtLeastOneSuccessfulStrategy
#设置securityManager中realm
securityManager.realms=$jdbcRealm,$jdbcRealm1
securityManager.authenticator.authenticationStrategy=$authenticationStrategy
```

```java
package com.shiro1;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.IncorrectCredentialsException;
import org.apache.shiro.authc.UnknownAccountException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.realm.Realm;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.util.Factory;
public class TestA {
    public static void main(String[] args) {
        /*Realm*/
        //[1]解析shiro.ini文件
        Factory<SecurityManager> factory = new IniSecurityManagerFactory("classpath:shiro-jdbc.ini");
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

### 2.FirstSuccessfulStrategy

- 只有第一个成功地验证的 Realm 返回的信息将被使用。
- 所有进一步的 Realm 将被忽略。如果没有一个验证成功，则整体尝试失败
- 类似于 java 中的 &&

**数据库使用第一个例子的两个**

```java
[main]
#获得数据源A
dataSou=com.mchange.v2.c3p0.ComboPooledDataSource
dataSou.driverClass=com.mysql.jdbc.Driver
dataSou.jdbcUrl=jdbc:mysql://127.0.0.1:3306/shiro
dataSou.user=root
dataSou.password=Root
#配置了jdbcRealmA
jdbcRealm=org.apache.shiro.realm.jdbc.JdbcRealm
jdbcRealm.dataSource=$dataSou
#获得数据源B
dataSou1=com.mchange.v2.c3p0.ComboPooledDataSource
dataSou1.driverClass=com.mysql.jdbc.Driver
dataSou1.jdbcUrl=jdbc:mysql://127.0.0.1:3306/shiro1
dataSou1.user=root
dataSou1.password=Root
#配置了jdbcRealmB
jdbcRealm1=org.apache.shiro.realm.jdbc.JdbcRealm
jdbcRealm1.dataSource=$dataSou1
#配置验证器
authenticationStrategy=org.apache.shiro.authc.pam.FirstSuccessfulStrategy
#设置securityManager中realm
securityManager.realms=$jdbcRealm,$jdbcRealm1
securityManager.authenticator.authenticationStrategy=$authenticationStrategy
```

```java
package com.shiro1;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.IncorrectCredentialsException;
import org.apache.shiro.authc.UnknownAccountException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.realm.Realm;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.util.Factory;
public class TestA {
    public static void main(String[] args) {
        /*Realm*/
        //[1]解析shiro.ini文件
        Factory<SecurityManager> factory = new IniSecurityManagerFactory("classpath:shiro-jdbc.ini");
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

### 3.AllSuccessfulStrategy

- 为了整体的尝试成功，所有配置的 Realm 必须验证成功。如果没有一个验 证成功，则整体尝试失败

```java
[main]
#获得数据源A
dataSou=com.mchange.v2.c3p0.ComboPooledDataSource
dataSou.driverClass=com.mysql.jdbc.Driver
dataSou.jdbcUrl=jdbc:mysql://127.0.0.1:3306/shiro
dataSou.user=root
dataSou.password=Root
#配置了jdbcRealmA
jdbcRealm=org.apache.shiro.realm.jdbc.JdbcRealm
jdbcRealm.dataSource=$dataSou
#获得数据源B
dataSou1=com.mchange.v2.c3p0.ComboPooledDataSource
dataSou1.driverClass=com.mysql.jdbc.Driver
dataSou1.jdbcUrl=jdbc:mysql://127.0.0.1:3306/shiro1
dataSou1.user=root
dataSou1.password=Root
#配置了jdbcRealmB
jdbcRealm1=org.apache.shiro.realm.jdbc.JdbcRealm
jdbcRealm1.dataSource=$dataSou1
#配置验证器
authenticationStrategy=org.apache.shiro.authc.pam.AllSuccessfulStrategy
#设置securityManager中realm
securityManager.realms=$jdbcRealm,$jdbcRealm1
securityManager.authenticator.authenticationStrategy=$authenticationStrategy
```

```java
package com.shiro1;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.IncorrectCredentialsException;
import org.apache.shiro.authc.UnknownAccountException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.realm.Realm;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.util.Factory;
public class TestA {
    public static void main(String[] args) {
        /*Realm*/
        //[1]解析shiro.ini文件
        Factory<SecurityManager> factory = new IniSecurityManagerFactory("classpath:shiro-jdbc.ini");
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
