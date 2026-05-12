# 02、Shiro 入门：身份验证基本流程
- 来源：https://ddkk.com/zhuanlan/security/shiro/6/21.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 入门 (B)
简介:

在shiro 中，用户需要提供 principals （身份）和 credentials（证明）给 shiro，从而应用能验证用户身份：

**principals**：身份，即主体的标识属性，可以是任何东西，如用户名、邮箱等，唯一即可。一个主体可以有多个 principals，但只有一个 Primary principals，一般是用户名 / 密码 / 手机号。

**credentials**：证明 / 凭证，即只有主体知道的安全值，如密码 / 数字证书等。

最常见的 principals 和 credentials 组合就是用户名 / 密码了。接下来先进行一个基本的身份认证。

**1、** 引入依赖：；

```xml
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.9</version>
</dependency>
<dependency>
    <groupId>commons-logging</groupId>
    <artifactId>commons-logging</artifactId>
    <version>1.1.3</version>
</dependency>
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-core</artifactId>
    <version>1.2.2</version>
</dependency>
```

**2、** resources下创建shrio.ini文件，里面有两个身份和凭据；

```java
[users]
lc=123
tt=123
```

**3、** 测试类：；

```java
public class Test {
    @org.junit.Test
    public void t1(){
        //获取SecurityManager工厂，此处使用Ini配置文件初始化SecurityManager
        Factory<SecurityManager> factory= new IniSecurityManagerFactory("classpath:shiro.ini");
        //得到SecurityManager实例 并绑定给SecurityUtils
        SecurityManager securityManager = factory.getInstance();
        SecurityUtils.setSecurityManager(securityManager);
        //得到Subject及创建用户名/密码身份验证Token（即用户身份/凭证）
        Subject subject = SecurityUtils.getSubject();
        UsernamePasswordToken token=new UsernamePasswordToken("lc","123");
        try {
            //用token去登陆
            subject.login(token);
            System.out.println(subject.isAuthenticated()+" "+subject.getPrincipals());
        //身份验证失败异常
        }catch (AuthenticationException e){
            System.out.println("失败！");
        }
        //登出
        subject.logout();
    }
}
```

运行后：验证成功

将用户更改为一个错误的username，登陆失败，抛出验证失败异常

**4、** 总结：；

流程如下：

**1、** 首先调用Subject.login(token)进行登录，其会自动委托给SecurityManager，调用之前必须通过SecurityUtils.setSecurityManager()设置；

**2、** SecurityManager负责真正的身份验证逻辑；它会委托给Authenticator进行身份验证；

**3、** Authenticator才是真正的身份验证者，ShiroAPI中核心的身份认证入口点，此处可以自定义插入自己的实现；

**4、** Authenticator可能会委托给相应的AuthenticationStrategy进行多Realm身份验证，默认ModularRealmAuthenticator会调用AuthenticationStrategy进行多Realm身份验证；

**5、** Authenticator会把相应的token传入Realm，从Realm获取身份验证信息，如果没有返回/抛出异常表示身份验证失败了此处可以配置多个Realm，将按照相应的顺序及策略进行访问；
