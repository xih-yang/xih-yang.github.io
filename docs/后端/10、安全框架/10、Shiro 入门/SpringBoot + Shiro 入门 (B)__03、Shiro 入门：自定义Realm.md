# 03、Shiro 入门：自定义Realm
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/22.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (B)
简介：

Realm：域，Shiro 从从 Realm 获取安全数据（如用户、角色、权限），就是说 SecurityManager 要验证用户身份，那么它需要从 Realm 获取相应的用户进行比较以确定用户身份是否合法；也需要从 Realm 得到用户相应的角色 / 权限进行验证用户是否能进行操作；可以把 Realm 看成 DataSource，即安全数据源。如我们之前的 ini 配置方式将使用 org.apache.shiro.realm.text.**IniRealm**。

Realm源码：

```java
public interface Realm {
    String getName();             //返回一个唯一的Realm名字
    boolean supports(AuthenticationToken var1);    //判断此Realm是否支持此Token
    AuthenticationInfo getAuthenticationInfo(AuthenticationToken var1) throws AuthenticationException;   //根据Token获取认证信息
}
```

一般继承 **AuthorizingRealm**（授权）即可；其继承了 AuthenticatingRealm（即身份验证），而且也间接继承了 CachingRealm（带有缓存实现）。其中主要默认实现如下：

**org.apache.shiro.realm.text.IniRealm**：[users] 部分指定用户名 / 密码及其角色；[roles] 部分指定角色即权限信息；

**org.apache.shiro.realm.text.PropertiesRealm**： user.username=password,role1,role2 指定用户名 / 密码及其角色；role.role1=permission1,permission2 指定角色及权限信息；

**org.apache.shiro.realm.jdbc.JdbcRealm**：通过 sql 查询相应的信息，如 “select password from users where username = ?” 获取用户密码，“select password,password_salt from users where username = ?” 获取用户密码及盐；“select role_name from user_roles where username = ?” 获取用户角色；“select permission from roles_permissions where role_name = ?” 获取角色对应的权限信息；也可以调用相应的 api 进行自定义 sql；

**单Realm：**

自己写一个类实现Realm接口

```java
public class MyRealm implements Realm {
    @Override
    public String getName() {
        return "myrealm";
    }
    @Override
    public boolean supports(AuthenticationToken authenticationToken) {
//仅支持UsernamePasswordToken类型的Token
        return authenticationToken instanceof UsernamePasswordToken;
    }
    @Override
    public AuthenticationInfo getAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
        String username = (String)authenticationToken.getPrincipal();  //得到用户名
        String password = new String((char[])authenticationToken.getCredentials()); //得到密码
        if (!"lc".equals(username)){
            throw new UnknownAccountException();
        }
        if (!"123".equals(password)){
            throw new IncorrectCredentialsException();
        }
        return new SimpleAuthenticationInfo(username,password,getName());
    }
}
```

shiro-realm.ini

```java
myrealm=com.lc.demo.MyRealm
securityManager.realms=$myrealm
```

测试：

```java
 @org.junit.Test
    public void t2(){
        Factory<SecurityManager> factory=new IniSecurityManagerFactory("classpath:shiro-realm.ini");
        SecurityManager securityManager = factory.getInstance();
        SecurityUtils.setSecurityManager(securityManager);
        Subject subject = SecurityUtils.getSubject();
        UsernamePasswordToken token=new UsernamePasswordToken("lcc","123");     //账户不正确，验证异常
        try {
            subject.login(token);
        }catch (AuthenticationException e){
            System.out.println("验证失败");
        }
        subject.logout();
    }
```

**多Realm 配置**

与上面的类似：两个myrealm

```java
public class MyRealm2 implements Realm {
    @Override
    public String getName() {
        return "myrealm2";
    }
    @Override
    public boolean supports(AuthenticationToken authenticationToken) {
        return authenticationToken instanceof UsernamePasswordToken;
    }
    @Override
    public AuthenticationInfo getAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
        String username = (String)authenticationToken.getPrincipal();  //得到用户名
        String password = new String((char[])authenticationToken.getCredentials()); //得到密码
        if (!"admin".equals(username)){
            throw new UnknownAccountException();
        }
        if (!"123".equals(password)){
            throw new IncorrectCredentialsException();
        }
        return new SimpleAuthenticationInfo(username,password,getName());
    }
}
```

**shiro-multi-realm.ini：**

securityManager 会按照 realms 指定的顺序进行身份认证。此处我们使用显示指定顺序的方式指定了 Realm 的顺序，如果删“securityManager.realms=$myRealm,$myRealm2”，那么securityManager 会按照 realm 声明的顺序进行使用（即无需设置 realms 属性，其会自动发现），当我们显示指定 realm 后，其他没有指定 realm 将被忽略，如 “securityManager.realms=$myRealm”，那么 myRealm2 不会被自动设置进去。

```java
myrealm=com.lc.demo.MyRealm
myrealm2=com.lc.demo.MyRealm2
securityManager.realms=$myrealm,$myrealm2
```

测试：

```java
@org.junit.Test
public void t3(){
    Factory<SecurityManager> factory=new IniSecurityManagerFactory("classpath:shiro-multi-realm.ini");
     SecurityManager securityManager = factory.getInstance();
     SecurityUtils.setSecurityManager(securityManager);
         Subject subject = SecurityUtils.getSubject();
         UsernamePasswordToken token=new UsernamePasswordToken("lc","123");
         UsernamePasswordToken token2=new UsernamePasswordToken("admin","123");
         try {
         subject.login(token);
         subject.login(token2);
     }catch (AuthenticationException e){
         System.out.println("nonono!");
     }
     subject.logout();
 }
```
