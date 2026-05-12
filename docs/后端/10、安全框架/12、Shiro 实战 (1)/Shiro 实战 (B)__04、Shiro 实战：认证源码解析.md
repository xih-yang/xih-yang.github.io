# 04、Shiro 实战：认证源码解析
- 来源：https://ddkk.com/zhuanlan/security/shiro/7/19.html
- 分类：安全框架
- 分组：Shiro 实战 (B)
认证过程：

**1、** SecurityManager对象的生成SecurityManager对象是在监听器里面生成的；

**2、** 根据我们的shiroEnvironmentClass变量的值org.apache.shiro.web.env.IniWebEnvironment，初始化一个shiro环境对象；

**3、** 创建一个SecurityManager对象，并将其绑定到刚才通过字节码创建的Shiro环境对象中；

**4、** 查看subject.login(token)的源码Subject将用户的用户名密码（token）委托给了securityManager去认证；

**5、** securityManager将用户的token委托给内部认证组件authenticator去认证；

**6、** 用户的token需要去跟数据源Realm做对比，所以authenticator又将认证的任务交给Realm去做；

**7、** Realm在接到认证任务后，将调用Realm的实现类AuthenticatingRealm的doGetAuthenticationInfo(token)方法而这个方法，就是我们要重写的方法，首先我们自己编写了一个类，继承了AuthorizingRealm，并实现了doGetAuthenticationInfo方法，在doGetAuthenticationInfo中查询数据库，并将数据库中存放的用户名与密码封装成了一个AuthenticationInfo对象返回；

**8、** 把用户输入的帐号密码与刚才你从数据库中查出来的帐号密码对比一下即可token封装着用户的帐号密码，AuthenticationInfo封装着从数据库中查询出来的帐号密码如果没有报异常，说明本次登录成功；

总结：

**1、** 首先将用户名和密码封装成token如果数据库中的密码是加密的，则密码需要按指定加密方式生成对应的密文密码；

**2、** Subject门面获取到token，并传递到内部的SecurityManager中；

**3、** SecurityManager调用内部组件authenticator去验证；

**4、** authenticator将token传递到Realm中去；

**5、** 最终由我们自定义Realm继承AuthorizingRealm，并实现doGetAuthenticationInfo方法将数据库中的数据查询出来，放到Realm中去shiro将会分析用户输入的token是否与数据库中查出来的一致；
