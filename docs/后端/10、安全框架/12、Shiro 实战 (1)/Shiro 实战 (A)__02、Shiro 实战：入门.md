# 02、Shiro 实战：入门
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/2.html
- 分类：安全框架
- 分组：Shiro 实战 (A)
## 一、官方示例

**1、** shiro.ini配置文件；

```java
[users]
# user 'root' with password 'secret' and the 'admin' role
root = secret, admin
# user 'guest' with the password 'guest' and the 'guest' role
guest = guest, guest
# user 'presidentskroob' with password '12345' ("That's the same combination on
# my luggage!!!" ;)), and role 'president'
presidentskroob = 12345, president
# user 'darkhelmet' with password 'ludicrousspeed' and roles 'darklord' and 'schwartz'
darkhelmet = ludicrousspeed, darklord, schwartz
# user 'lonestarr' with password 'vespa' and roles 'goodguy' and 'schwartz'
lonestarr = vespa, goodguy, schwartz
[roles]
# 'admin' role has all permissions, indicated by the wildcard '*'
admin = *
# The 'schwartz' role can do anything (*) with any lightsaber:
schwartz = lightsaber:*
# The 'goodguy' role is allowed to 'delete' (action) the user (type) with
# license plate 'zhangsan' (instance specific id)
goodguy = user:delete:zhangsan
```

**2、** 测试示例；

```java
public class Quickstart {
    private static final transient Logger log = LoggerFactory.getLogger(Quickstart.class);
    public static void main(String[] args) {
        Factory<SecurityManager> factory = new IniSecurityManagerFactory("classpath:shiro.ini");
        SecurityManager securityManager = factory.getInstance();
        SecurityUtils.setSecurityManager(securityManager);
        // 获取当前的 Subject. 调用 SecurityUtils.getSubject();
        Subject currentUser = SecurityUtils.getSubject();
        // 测试使用 Session 
        // 获取 Session: Subject#getSession()
        Session session = currentUser.getSession();
        session.setAttribute("someKey", "aValue");
        String value = (String) session.getAttribute("someKey");
        if (value.equals("aValue")) {
            log.info("---> Retrieved the correct value! [" + value + "]");
        }
        // 测试当前的用户是否已经被认证. 即是否已经登录. 
        // 调动 Subject 的 isAuthenticated() 
        if (!currentUser.isAuthenticated()) {
        	// 把用户名和密码封装为 UsernamePasswordToken 对象
            UsernamePasswordToken token = new UsernamePasswordToken("lonestarr", "vespa");
            // rememberme
            token.setRememberMe(true);
            try {
            	// 执行登录. 
                currentUser.login(token);
            } 
            // 若没有指定的账户, 则 shiro 将会抛出 UnknownAccountException 异常. 
            catch (UnknownAccountException uae) {
                log.info("----> There is no user with username of " + token.getPrincipal());
                return; 
            } 
            // 若账户存在, 但密码不匹配, 则 shiro 会抛出 IncorrectCredentialsException 异常。 
            catch (IncorrectCredentialsException ice) {
                log.info("----> Password for account " + token.getPrincipal() + " was incorrect!");
                return; 
            } 
            // 用户被锁定的异常 LockedAccountException
            catch (LockedAccountException lae) {
                log.info("The account for username " + token.getPrincipal() + " is locked.  " +
                        "Please contact your administrator to unlock it.");
            }
            // 所有认证时异常的父类. 
            catch (AuthenticationException ae) {
                //unexpected condition?  error?
            }
        }
        log.info("----> User [" + currentUser.getPrincipal() + "] logged in successfully.");
        // 测试是否有某一个角色. 调用 Subject 的 hasRole 方法. 
        if (currentUser.hasRole("schwartz")) {
            log.info("----> May the Schwartz be with you!");
        } else {
            log.info("----> Hello, mere mortal.");
            return; 
        }
        // 测试用户是否具备某一个行为. 调用 Subject 的 isPermitted() 方法。 
        if (currentUser.isPermitted("lightsaber:weild")) {
            log.info("----> You may use a lightsaber ring.  Use it wisely.");
        } else {
            log.info("Sorry, lightsaber rings are for schwartz masters only.");
        }
        // 测试用户是否具备某一个行为. 
        if (currentUser.isPermitted("user:delete:zhangsan")) {
            log.info("----> You are permitted to 'drive' the winnebago with license plate (id) 'eagle5'.  " +
                    "Here are the keys - have fun!");
        } else {
            log.info("Sorry, you aren't allowed to drive the 'eagle5' winnebago!");
        }
        // 执行登出. 调用 Subject 的 Logout() 方法. 
        System.out.println("---->" + currentUser.isAuthenticated());
        currentUser.logout();
        System.out.println("---->" + currentUser.isAuthenticated());
        System.exit(0);
    }
}
```

## 二、基本使用

**1、** shiro.ini配置文件；

```java
[users]  
zhang=123  
wang=123  
```

**2、** 测试；

```java
@Test  
public void testHelloworld() {  
    //1、获取SecurityManager工厂，此处使用Ini配置文件初始化SecurityManager  
    Factory<org.apache.shiro.mgt.SecurityManager> factory =  
            new IniSecurityManagerFactory("classpath:shiro.ini");  
    //2、得到SecurityManager实例 并绑定给SecurityUtils  
    org.apache.shiro.mgt.SecurityManager securityManager = factory.getInstance();  
    SecurityUtils.setSecurityManager(securityManager);  
    //3、得到Subject及创建用户名/密码身份验证Token（即用户身份/凭证）  
    Subject subject = SecurityUtils.getSubject();  
    UsernamePasswordToken token = new UsernamePasswordToken("zhang", "123");  
    try {  
        //4、登录，即身份验证  
        subject.login(token);  
    } catch (AuthenticationException e) {  
        //5、身份验证失败  
    }  
    Assert.assertEquals(true, subject.isAuthenticated()); //断言用户已经登录  
    //6、退出  
    subject.logout();  
}  
```

**身份验证的基本流程**：

**1、** 首先通过new IniSecurityManagerFactory并指定一个ini配置文件来创建一个SecurityManager工厂；

**2、** 接着获取SecurityManager并绑定到SecurityUtils，这是一个全局设置，设置一次即可；

**3、** 通过SecurityUtils得到Subject，其会自动绑定到当前线程；如果在web环境在请求结束时需要解除绑定；然后获取身份验证的Token，如用户名和密码；

**4、** 调用subject.login方法进行登录，其会自动委托给SecurityManager.login方法进行登录；

**5、** 如果身份验证失败请捕获AuthenticationException或其子类，常见的如： DisabledAccountException（禁用的帐号）、LockedAccountException（锁定的帐号）、UnknownAccountException（错误的帐号）、ExcessiveAttemptsException（登录失败次数过多）、IncorrectCredentialsException （错误的凭证）、ExpiredCredentialsException（过期的凭证）等；

**6、** 最后可以调用subject.logout退出，其会自动委托给SecurityManager.logout方法退出。

身份验证的步骤：

**1、** 收集用户身份和凭证，即如用户名和密码；

**2、** 调用Subject.login进行登录，如果失败将得到相应的AuthenticationException异常，根据异常提示用户错误信息；否则登录成功；

**3、** 最后调用Subject.logout进行退出操作。

如上测试的几个问题：

**1、** 用户名/密码硬编码在ini配置文件，以后需要改成如数据库存储，且密码需要加密存储；

**2、** 用户身份Token可能不仅仅是用户名和密码，也可能还有其他的，如登录时允许用户名、邮箱和手机号同时登录。
