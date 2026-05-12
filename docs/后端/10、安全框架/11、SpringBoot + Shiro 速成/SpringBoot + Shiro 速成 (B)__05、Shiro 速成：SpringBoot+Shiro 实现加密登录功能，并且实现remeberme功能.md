# 05、Shiro 速成：SpringBoot+Shiro 实现加密登录功能，并且实现remeberme功能
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/14.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (B)
## 回顾

之前的maven项目，里面使用shiro进行验证，并且自定义了认证规则，里面我们还需要自己写ini文件，在这个ini文件里面进行shiro的配置，比如配置加密规则，配置自定义的认证规则。

反正还需要自己写ini文件

[04、Shiro 速成：SpringBoot+Shiro 框架实现自定义Realm，加密之后进行验证的流程](/zhuanlan/security/shiro/5/13.html)

## 不使用shiro框架实现登录（SSM）

### 搭建项目

创建一个maven项目

添加依赖

```xml
<!--配置继承-->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.1.10.RELEASE</version>
</parent>
<!--配置依赖-->
<dependencies>
<!--配置web启动器-->
<dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-web</artifactId>
 </dependency>
<!--配置mybatis启动器-->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>2.1.1</version>
</dependency>
<!--配置mysql驱动-->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>5.1.48</version>
</dependency>
<!--配置Thrmeleaf启动器-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
</dependencies>
```

写配置文件，连接数据库

```java
spring:
  datasource:
    driver-class-name: com.mysql.jdbc.Driver
    username: root
    url: jdbc:mysql://localhost:3306/mybatisplus?useSSL=false&useUnicode=true&characterEncoding=utf-8&zeroDateTimeBehavior=convertToNull&transformedBitIsBoolean=true&serverTimezone=GMT%2B8
    password: 123456
##配置mapper的xml文件的路径
mybatis:
  mapper-locations: classpath:mybatis/*.xml
```

创建每层的目录结构，还有Springboot项目的启动器

创建用户实体类

写mapper层

```java
public interface UserMapper {
    //根据用户名查询用户信息
    @Select("select * from t_user where uname=#{uname}")
    User selUserInfoMapper(@Param("uname") String uname);
}
```

写service层

```java
@Service
public class UserServiceImpl implements UserService {
    //声明mapper属性
    @Autowired
    private UserMapper userMapper;
    //用户登录
    @Override
    public User selUserInfoService(String uname) {
        return userMapper.selUserInfoMapper(uname);
    }
}
```

写controller层

```java
//声明单元方法：登录认证
@RequestMapping("userLogin")
public String userLogin(String uname,String pwd){
    //1.根据用户名获取用户信息
    User user=userService.selUserInfoService(uname);
    //2.判断用户名是否合法
    if(user!=null){
        //3.校验密码
        if(user.getPassword().equals(pwd)){
            //认证成功
            return "main";
        }
    }
    return "error";
}
```

写对应的登录页面和主页面

启动项目，进入登录页面

以上实现了没有shiro框架的登录

## 整合shiro框架实现登录

引入shiro的依赖

```xml
<!--配置shiro的启动器-->
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-spring-boot-web-starter</artifactId>
    <version>1.4.2</version>
</dependency>
<!--        添加shiro整合thymeleaf的依赖-->
<dependency>
    <groupId>com.github.theborakompanioni</groupId>
    <artifactId>thymeleaf-extras-shiro</artifactId>
    <version>2.0.0</version>
</dependency>
```

因为我们要使用shiro框架实现登录注册，并且用户的数据是存储在数据库，而shiro框架默认的数据是在ini文件里面的，有默认的认证策略，所以我们需要自己写realm认证策略，在这个认证策略里面要实现和数据库的对接。

自定义的认证策略realm

```java
//  在这个认证策略里面，将前段传过来的数据拿出来，并且从数据库查询出来数据，进行对比
@Component
public class MyRealm extends AuthorizingRealm {
    //声明业务层属性
    @Autowired
    private UserService userService;
    //自定义认证策略
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
        //声明认证代码
                //1.获取用户传递的用户名信息
                Object principal = token.getPrincipal();
                //2.根据用户名获取数据库中的用户信息
                User user = userService.selUserInfoService((String) principal);
                //3.认证
                if(user!=null){
     //用户名是正确的
                    //4.认证密码
                    AuthenticationInfo info=  new SimpleAuthenticationInfo(principal,user.getPassword(), ByteSource.Util.bytes(user.getId()+""),user.getUsername());
                    return info;
            }
        return null;
    }
}
```

以上只是自己写了一个认证策略，但是我们还需要告诉shiro框架，按之前告诉是在ini文件里面告诉，现在没有ini文件了，咋告诉了？

以上我们自己写的认证策略已经是bean对象了，只需要把bean对象赋值给security manager 对象就可以。

现在我们需要自己写一个shiro的配置类，代替之前的ini文件

以后关于shiro的配置都在这个类里面

```java
@Configuration
public class ShiroConfig {
    //声明MyRealm属性
    @Autowired
    private MyRealm myRealm;
    //声明bean方法
    @Bean
    public DefaultWebSecurityManager securityManager(){
# 拿到securityManager对象
        DefaultWebSecurityManager defaultWebSecurityManager
        =new DefaultWebSecurityManager();
        //将自定义的认证策略对象注入到SecurityManager
        defaultWebSecurityManager.setRealm(myRealm);
        return defaultWebSecurityManager;
    }
}
```

以上的配置就是一个最简单的配置，说白了就是把Realm认证策略赋值给了ecurityManager对象，和之前在ini文件里面写的一样。

写完以上的之后，我们的项目里面以后走controller层的某一个登录接口的时候，就可以在这个接口里面可以使用shiro框架相关的代码，实现登录，具体controller层的代码是：

```java
//声明单元方法：使用shiro认证
@RequestMapping("userLogin2")
public String userLogin2(String uname,String pwd,@RequestParam(defaultValue = "false") Boolean rememberme){
    //1.获取subject对象
    Subject subject = SecurityUtils.getSubject();
    //2.认证
    //创建认证对象存储认证信息
    AuthenticationToken token= new UsernamePasswordToken(uname,pwd);
    try{
        subject.login(token);
        return "redirect:main";
    }catch(Exception e){
        e.printStackTrace();
    }
    return "redirect:login";
}
```

但是在浏览器输入login.html的路径，后台会报错，这个原因是啥了

我们的shiro里面有很多的过滤器，Springboot项目整合了shiro之后，里面的过滤器已经生效了。

此时shiro的过滤器，将我们的 请求路径，转为login.jsp了，但是我们没有这个页面，所以报错

所以，我们要将一些路径放行，不要让shiro框架拦截，那么就需要在shiro的配置文件里面进行放行

```java
//自定义shiro过滤器参数bean，覆盖默认的
@Bean
public ShiroFilterChainDefinition shiroFilterChainDefinition(){
    DefaultShiroFilterChainDefinition definition = new DefaultShiroFilterChainDefinition();
    definition.addPathDefinition("/login", "anon");
    definition.addPathDefinition("/userLogin2", "anon");
    //开启shiro内置的退出过滤器，完成退出功能
    definition.addPathDefinition("/logout", "logout");
    //definition.addPathDefinition("/main", "anon");
    definition.addPathDefinition("/**", "user");
    return definition;
}
```

### 凭证匹配器

以上已经实现了shiro框架实现登录，但是数据库中的密码是加密的，所以我们要使用md5加密一下前段传过来的密码，之后和数据库的加密密码进行比较。

回顾之前我们是修改了realm的认证规则，在这个认证规则里面加盐，之后在ini文件里面配置了加密器md5，和加密的次数，并且将加密器配置给了自定义的认证类。

现在我们使用springboot项目，所以要实现以上的加密验证功能

如果加md5的认证方式呢？

之前也是在配置文件里面引入md5加密，现在也是

```java
@Configuration
public class ShiroConfig {
    //声明MyRealm属性
    @Autowired
    private MyRealm myRealm;
    //声明bean方法
    @Bean
    public DefaultWebSecurityManager securityManager(){
    DefaultWebSecurityManager defaultWebSecurityManager=new DefaultWebSecurityManager();
    之前也是在配置文件里面引入md5加密，现在也是
    //        //创建凭证匹配器
    HashedCredentialsMatcher matcher=new HashedCredentialsMatcher();
    //        //设置匹配器的加密算法
    matcher.setHashAlgorithmName("md5");
    //        //设置匹配器的迭代加密次数
    matcher.setHashIterations(2);
    //        //将匹配器注入到自定义的认证策略对象中
    myRealm.setCredentialsMatcher(matcher);
    //将自定义的认证策略对象注入到SecurityManager
    defaultWebSecurityManager.setRealm(myRealm);
    //将CookieRememberMeManager对象注入到SecurityManager，开启了rememberme功能
    //        defaultWebSecurityManager.setCacheManager(ehCacheManager());
    return defaultWebSecurityManager;
}
```

再修改realm认证策略，写加密的盐

```java
    //自定义认证策略
@Override
protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
//声明认证代码
//1.获取用户传递的用户名信息
Object principal = token.getPrincipal();
//2.根据用户名获取数据库中的用户信息
User user = userService.selUserInfoService((String) principal);
//3.认证
if(user!=null){
//用户名是正确的
//4.认证密码
AuthenticationInfo info=  new 
SimpleAuthenticationInfo(principal,user.getPassword(), 
ByteSource.Util.bytes(user.getId()+""),user.getUsername());
                return info;
        }
    return null;
}
}
```

### 流程总结

我们的springboot项目整合了shiro框架，一启动，那么就扫描当前启动类同级目录下，以及自目录下的文件，将bean对象都放到spring容器里面，将shiro配置里面的bean对象也放到spring容器里面。securitymanager对象也放到容器里面，并且securitymanager对象也放到了SecurityUtils里面，这个是一气呵成的，相当于之前我们写的

以上这些已经完成，是自动完成的哦，SecurityUtils里面已经有东西，我们从SecurityUtils里面拿出subject对象就可以了。

## remember me实现

我们都知道，一般的项目里面，有一个登录的功能，就是记住我的功能，当我们点击了记住我，那么下一次进一个页面，直接就进来了，不需要我们重新写用户名和密码了；

使用cookie功能：

```java
服务器端将用户的信息保存在cookie里面，并且将cookie返回给浏览器。也就是
只要服务端给浏览器返回了cookie，那么浏览器就保存用户的信息，用户的信息
就在cookie里面
```

### 登录拦截

我们已经在shiro的配置文件里面，配置了过滤器，就是除了登录页面的接口，退出的接口，其他的接口，必须登录之后才可以访问。

如果我们没有登录，直接访问需要登录才可以访问的接口，那么shiro框架会自定义给你转到login.jsp页面。我们现在不想要使用默认的，

我们现在想要实现的是，当没有登录时，默认转到我们自己写的登录页面，那么我们就需要自己配置，我们可以在yml里面进行配置

```java
shiro:
 当用户访问某个需要登录的功能时，但是被shiro内置的过滤器拦截后，判断本次请求
 没有登录，而是直接访问的，则重定向到loginUrl的路径资源响应给用户
  loginUrl: /login
```

### 现在的状态

我们现在登录成功了，但是浏览器关闭之后，我们还得登录才能访问，现在就需要3天免登录的功能了

### 实现记住我功能

修改登录页面

前段会往后端传3个值，一个用户名，一个密码，一个记住我的单选框

修改controller层

以上就是shiro框架已经拿到了remeberme 的参数了，框架就自动给你实现记住我功能了，但是得配置开启这个记住我的功能，如何开启，那么就需要在shiro的配置文件里面开启了。

比如我们需要配置这个cookie的过期时间是什么，哪些路径需要cookie。这些事需要我们设置的

首先写一个方法，里面写的是cookie的一些信息

```java
//设置Cookie的信息
public SimpleCookie rememberMeCookie(){
    SimpleCookie simpleCookie=new SimpleCookie("rememberMe");
    //设置有效路径
    simpleCookie.setPath("/");
    //设置声明周期
    simpleCookie.setMaxAge(30*24*60*60);
    //返回设置的cookie
    return simpleCookie;
}
```

再写一个方法，就是cookie管理的对象，把以上写的放到这个管理器里面

```java
//创建rememberMeManager对象
public CookieRememberMeManager rememberMeManager(){
    //创建CookieRememberMeManager对象
    CookieRememberMeManager cookieRememberMeManager=new CookieRememberMeManager();
    //注入Cookie对象
    cookieRememberMeManager.setCookie(rememberMeCookie());
    //设置密钥
    这个秘钥是随便写的cookieRememberMeManager.setCipherKey(Base64.decode("MTIzNDU2Nzg="));
    //返回
    return cookieRememberMeManager;
}
```

最后将rememberMeManager对象放到securitymanager对象里面

这个就相当于开启了记住我的功能

在shiro的过滤器里面，除了登录，退出，其他的路径都需要user这个过滤器，要 使用记住我这个功能，其他的路径必须要有这个过滤器，这个过滤器的意思是必须要有用户

以上配置完之后，在登录的时候，选择了记住我功能，之后登录成功之后，我们就可以看到‘’

cookie里面有一个记住我的东西，这个是浏览器关闭之后打开还在的，所以就实现了记住我的功能

### 友情提示

这个秘钥必须是16位的生成的base64,不然实现不了记住我功能
