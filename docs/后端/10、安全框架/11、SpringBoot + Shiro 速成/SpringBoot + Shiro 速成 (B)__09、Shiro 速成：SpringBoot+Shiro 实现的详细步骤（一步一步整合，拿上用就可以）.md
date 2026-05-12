# 09、Shiro 速成：SpringBoot+Shiro 实现的详细步骤（一步一步整合，拿上用就可以）
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/18.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (B)
使用shiro框架实现登录功能，这个登录功能有记住我功能，加密密码验证功能。不同用户权限不一样，看到的东西不一样。从数据库里面查询出来的权限放到缓冲里面。

1首先创建一个springboot的maven项目

2导入依赖

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
    <!--配置SpringBoot整合EHCache的依赖-->
    <dependency>
        <groupId>org.apache.shiro</groupId>
        <artifactId>shiro-ehcache</artifactId>
        <version>1.4.2</version>
    </dependency>
    <dependency>
        <groupId>commons-io</groupId>
        <artifactId>commons-io</artifactId>
        <version>2.6</version>
    </dependency>
</dependencies>
```

3写自定义的realm

```java
//  在这个认证策略里面，将前段传过来的数据拿出来，并且从数据库查询出来数据，进行对比
@Component
public class MyRealm extends AuthorizingRealm {
    //声明业务层属性
    @Autowired
    private UserService userService;
    //自定义授权策略
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        //1.从数据库中获取用户的权限信息
        //2.将权限信息存储到shiro授权对象中
        System.out.println("我是授权认证方法，我被执行了");
        SimpleAuthorizationInfo info=new SimpleAuthorizationInfo();
        info.addRole("role1");
        info.addRole("role2");
        info.addStringPermission("user:insert");
        info.addStringPermission("user:update");
        info.addStringPermission("sys:*");
        return info;
    }
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

4写shiro的配置文件

```java
import com.jing.shiro.MyRealm;
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;
import org.apache.shiro.cache.ehcache.EhCacheManager;
import org.apache.shiro.codec.Base64;
import org.apache.shiro.io.ResourceUtils;
import org.apache.shiro.spring.web.config.DefaultShiroFilterChainDefinition;
import org.apache.shiro.spring.web.config.ShiroFilterChainDefinition;
import org.apache.shiro.web.mgt.CookieRememberMeManager;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.apache.shiro.web.servlet.SimpleCookie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.io.InputStream;
@Configuration
public class ShiroConfig {
    //声明MyRealm属性
    @Autowired
    private MyRealm myRealm;
    //声明bean方法
    @Bean
    public DefaultWebSecurityManager securityManager(){
        DefaultWebSecurityManager defaultWebSecurityManager=new DefaultWebSecurityManager();
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
        defaultWebSecurityManager.setRememberMeManager(rememberMeManager());
        //将CookieRememberMeManager对象注入到SecurityManager，开启了rememberme功能
        defaultWebSecurityManager.setCacheManager(ehCacheManager());
        return defaultWebSecurityManager;
    }
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
    //创建rememberMeManager对象
    public CookieRememberMeManager rememberMeManager(){
        //创建CookieRememberMeManager对象
        CookieRememberMeManager cookieRememberMeManager=new CookieRememberMeManager();
        //注入Cookie对象
        cookieRememberMeManager.setCookie(rememberMeCookie());
        //设置密钥
        cookieRememberMeManager.setCipherKey(Base64.decode("Nzg5NjU0MTI3ODk2NTQxMg=="));
        //返回
        return cookieRememberMeManager;
    }
    //自定义shiro过滤器参数bean
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
    //创建Bean方法，ehCacheManager
    @Bean
    public EhCacheManager ehCacheManager(){
        //创建ehCacheManager对象
        EhCacheManager ehCacheManager=new EhCacheManager();
        //获取配置文件的流对象
        InputStream is=null;
        try{
             is = ResourceUtils.getInputStreamForPath("classpath:ehcache/ehcache-shiro.xml");
        }catch (Exception e){
            e.printStackTrace();
        }
        //获取CarManager对象
        net.sf.ehcache.CacheManager cacheManager = new net.sf.ehcache.CacheManager(is);
        ehCacheManager.setCacheManager(cacheManager);
        //返回
        return  ehCacheManager;
    }
    //创建解析Thymeleaf中的shiro属性的对象，由SpringBoot项目底层自动调用
    @Bean
    public ShiroDialect shiroDialect() {
        return new ShiroDialect();
    }
}
```

5写ehcache 的xml配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ehcache name="ehcache" updateCheck="false">
    <!-- 磁盘缓存位置 -->
    <diskStore path="java.io.tmpdir"/>
    <!-- 默认缓存 -->
    <defaultCache
            maxEntriesLocalHeap="1000"
            eternal="false"
            timeToIdleSeconds="3600"
            timeToLiveSeconds="3600"
            overflowToDisk="false">
    </defaultCache>
    <!-- 登录记录缓存 锁定10分钟 -->
    <cache name="loginRecordCache"
           maxEntriesLocalHeap="2000"
           eternal="false"
           timeToIdleSeconds="600"
           timeToLiveSeconds="0"
           overflowToDisk="false"
           statistics="true">
    </cache>
</ehcache>
```

6application.yml

```java
spring:
  datasource:
    driver-class-name: com.mysql.jdbc.Driver
    username: root
    url: jdbc:mysql://localhost:3306/mybatisplus?useSSL=false&useUnicode=true&characterEncoding=utf-8&zeroDateTimeBehavior=convertToNull&transformedBitIsBoolean=true&serverTimezone=GMT%2B8
    password: '123456'
##配置mapper的xml文件的路径
mybatis:
  mapper-locations: classpath:mybatis/*.xml
shiro:
 当用户访问某个需要登录的功能时，但是被shiro内置的过滤器拦截后，判断本次请求
 没有登录，而是直接访问的，则重定向到loginUrl的路径资源响应给用户
  loginUrl: /login
```

写controller层就可以了

```java
ontroller
public class UserController {
    //声明service属性
    @Autowired
    private UserService userService;
    //声明单元方法：使用shiro认证
    @RequestMapping("userLogin2")
    public String userLogin2(String uname,String pwd,@RequestParam(defaultValue = "false") Boolean rememberme){
        //1.获取subject对象
        Subject subject = SecurityUtils.getSubject();
        //2.认证
        //创建认证对象存储认证信息
        AuthenticationToken token= new UsernamePasswordToken(uname,pwd,rememberme);
        try{
            subject.login(token);
            return "redirect:main";
        }catch(Exception e){
            e.printStackTrace();
        }
        return "redirect:login";
    }
    //声明单元方法：登录认证
    @RequestMapping("userLogin")
    public String userLogin(String uname,String pwd){
        //1.根据用户名获取用户信息
        User user=userService.selUserInfoService(uname);
        System.out.println(user.toString());
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
    //声明单元方法:
    @RequiresPermissions("user:insert11")
    @ResponseBody
    @RequestMapping("demo")
    public  String demo(){
        return "ok";
    }
    //声明公共单元方法完成页面的内部转发
    @RequestMapping("{uri}")
    public String getPage(@PathVariable String uri){
        return uri;
    }
}
```
