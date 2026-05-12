# 10、Shiro 速成：SpringBoot+Shiro 注册登录使用的加密算法
- 来源：https://ddkk.com/zhuanlan/security/shiro/5/19.html
- 分类：安全框架
- 分组：SpringBoot + Shiro 速成 (B)
## 背景

在实现认证的时候，shiro有很多的加密算法，比如md5，SHA-1等。我们现在自己写一个工具类，里面是SHA-1的加密，有盐的加密。

我们数据库中保存的是加密的密码。在注册的时候，我们就可以将前段传过来的密码，作为参数传给工具类的entryptPassword（）方法，返回的就是加密后的密码，和一个盐，之后把密码和盐都保存到数据库里面

```java
package com.jing.utils;
import com.sun.org.apache.bcel.internal.generic.NEW;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.crypto.hash.SimpleHash;
import sun.security.util.Password;
import java.util.HashMap;
import java.util.Map;
/**
 * @Description：摘要
 */
public class DigestsUtil {
//加密的方式，固定的名字
    public static final String SHA1 = "SHA-1";
//加密的次数
public static final Integer ITERATIONS =512;
    /**
     * @Description sha1方法
     * @param input 需要散列字符串
     * @param salt 盐字符串
     * @return
     * 第一个就是明文密码，第二个就是随机生成的盐
     */
    public static String sha1(String input, String salt) {
       return new SimpleHash(SHA1, input, salt,ITERATIONS).toString();
    }
    /**
     * @Description 随机获得salt字符串
     * @return
     */
    public static String generateSalt(){
        SecureRandomNumberGenerator randomNumberGenerator = new SecureRandomNumberGenerator();
        return randomNumberGenerator.nextBytes().toHex();
    }
    /**
     * @Description 生成密码字符密文和salt密文
     * @param
     * @return
     */
    public static Map<String,String> entryptPassword(String passwordPlain) {
       Map<String,String> map = new HashMap<>();
       String salt = generateSalt();
       String password =sha1(passwordPlain,salt);
       map.put("salt", salt);
       map.put("password", password);
//       会将map里面的东西放到数据库中
       return map;
    }
    public static void main(String[] args) {
        System.out.println(entryptPassword("123456"));
    }
}
```

## shiro的认证实现

我们首先要自己写realm。

```java
package com.jing.shiro;
import com.jing.Login.pojo.User;
import com.jing.Login.service.UserService;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.SimpleAuthenticationInfo;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.ByteSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
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
//                    user对象里面是有盐的，将盐拿出来，放到第三个参数里面
                    //4.认证密码
                    AuthenticationInfo info=  new SimpleAuthenticationInfo(principal,user.getPassword(), ByteSource.Util.bytes(user.getSalt()),user.getUsername());
                    return info;
            }
        return null;
    }
}
```

z这个realm里面的代码意思是：

根据前段传过来的用户名，从数据库里面查出数据，将数据库里面的盐拿出来，进行认证。

我们还需要在shiro的配置类里面配置一下这个realm。

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
//        //创建凭证匹配器
        HashedCredentialsMatcher matcher=new HashedCredentialsMatcher();
//        //设置匹配器的加密算法      从工具类里面把加密算法拿出来
        matcher.setHashAlgorithmName(DigestsUtil.SHA1);
//        matcher.setHashAlgorithmName("md5");
//        //设置匹配器的迭代加密次数   从工具类里面把加密次数拿出来
        matcher.setHashIterations(DigestsUtil.ITERATIONS);
//        matcher.setHashIterations(2);
//        //将匹配器注入到自定义的认证策略对象中
        myRealm.setCredentialsMatcher(matcher);
        //将自定义的认证策略对象注入到SecurityManager
        defaultWebSecurityManager.setRealm(myRealm);
        defaultWebSecurityManager.setRememberMeManager(rememberMeManager());
        //将CookieRememberMeManager对象注入到SecurityManager，开启了rememberme功能
        defaultWebSecurityManager.setCacheManager(ehCacheManager());
        return defaultWebSecurityManager;
    }
```

以上就实现了工具类的加密的认证

## 注册登录

也就是在注册代码里面使用了工具类，在登录代码里面也使用了工具类

现在使用的是加密算法是SHA-1，其实还有MD5
