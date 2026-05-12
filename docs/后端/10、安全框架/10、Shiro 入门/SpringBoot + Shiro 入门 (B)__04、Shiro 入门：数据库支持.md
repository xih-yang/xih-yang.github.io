# 04、Shiro 入门：数据库支持
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/23.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (B)
主要就是JdbcRealm这个类

先看一下部分源码：

先建表：users（用户名 / 密码）、user_roles（用户 / 角色）、roles_permissions（角色 / 权限），并且往users里面插入一条数据---lc/123，其实也就用了一个users表登陆一下

创建ini文件：

```java
jdbcRealm=org.apache.shiro.realm.jdbc.JdbcRealm
dataSource=com.alibaba.druid.pool.DruidDataSource
dataSource.driverClassName=com.mysql.jdbc.Driver
dataSource.url=jdbc:mysql://localhost:3306/shiro
dataSource.username=root
dataSource.password=123456
jdbcRealm.dataSource=$dataSource
securityManager.realms=$jdbcRealm
```

测试：

```java
@org.junit.Test
public void t4(){
    Factory<SecurityManager> factory=new IniSecurityManagerFactory("classpath:shiro-jdbc-realm.ini");
    SecurityManager securityManager = factory.getInstance();
    SecurityUtils.setSecurityManager(securityManager);
    Subject subject = SecurityUtils.getSubject();
    UsernamePasswordToken token=new UsernamePasswordToken("lcc","123");
    try {
        subject.login(token);
    }catch (AuthenticationException e){
        System.out.println("nonono!");
    }
    subject.logout();
}
```

测试成功
