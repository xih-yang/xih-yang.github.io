# 2、SpringBoot整合JWT实现登录验证（一）
- 来源：https://ddkk.com/zhuanlan/security/jwt/2.html
- 分类：安全框架
- 分组：教程目录
## 1 定义

JWT全称为**JSON Web Token**，是目前最流行的跨域身份验证解决方案。JWT是为了在网络应用环境间传递声明而制定的一种基于**JSON**的开放标准。

此信息可以进行验证和信任，因为它是经过**数字签名**的。JWT 可以使用密钥（使用 HMAC 算法）或使用 RSA 或 ECDSA 的公钥/私钥对进行签名。

JWT特别适用于分布式站点的单点登录（SSO）场景。JWT的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源，也可被加密。

[官方介绍](https://jwt.io/introduction/)

## 2 JWT的数据结构 ##

JWT其实就是一个很长的字符串，【将JSON对象进行Base64编码拼凑而成】字符之间通过"."分隔符分为三个子串，各字串之间没有换行符。每一个子串表示了一个功能块，总共有三个部分：**JWT头(header)**、**有效载荷(payload)**、**签名(signature)**，如下图所示：

## 2.1 JWT头

JWT头是一个描述JWT元数据的JSON对象，通常如下所示：

```java
{
     "alg": "HS256","typ": "JWT"}
```

alg：表示签名使用的算法，默认为HMAC SHA256（写为HS256）

typ：表示令牌的类型，JWT令牌统一写为JWT

最后，使用Base64 URL算法将上述JSON对象转换为字符串

## 2.2 有效载荷

有效载荷，是JWT的主体内容部分，也是一个JSON对象，包含需要传递的数据。

有效载荷部分规定有如下七个默认字段供选择：

```java
iss：发行人
exp：到期时间
sub：主题
aud：用户
nbf：在此之前不可用
iat：发布时间
jti：JWT ID用于标识该JWT
```

除以上默认字段外，还可以自定义私有字段。

## 2.3 签名

签名实际上是一个加密的过程，是对上面两部分数据通过指定的算法生成哈希，以确保数据不会被篡改。

首先需要指定一个密码（secret），该密码仅仅保存在服务器中，并且不能向用户公开。然后使用JWT头中指定的签名算法（默认情况下为HMAC SHA256），根据以下公式生成签名哈希：

```java
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload),secret)
```

在计算出签名哈希后，JWT头，有效载荷和签名哈希的三个部分组合成一个字符串，每个部分用"."分隔，就构成整个JWT对象。

***请注意，对于已签名的令牌，令牌中包含的所有信息都会向用户或其他方公开，即使他们无法更改它。这意味着您不应将机密信息放在令牌中。***

## 2. 3 JWT签名算法

JWT签名算法中，一般有两个选择：HS256和RS256。

HS256 (带有 SHA-256 的 HMAC )是一种对称加密算法, 双方之间仅共享一个密钥。由于使用相同的密钥生成签名和验证签名, 因此必须注意确保密钥不被泄密。

RS256 (采用SHA-256 的 RSA 签名) 是一种非对称加密算法, 它使用公共/私钥对: JWT的提供方采用私钥生成签名, JWT 的使用方获取公钥以验证签名。

## 3JWT的认证机制

在身份验证中，当用户使用其凭据成功登录时，将返回 JSON Web 令牌。在身份验证中，当用户使用其凭据成功登录时，将返回 JSON Web 令牌。

每当用户想要访问受保护的路由或资源时，用户代理都应发送 JWT，通常在授权标头中使用持有者架构。标头的内容应如下所示：

```java
Authorization: Bearer <token>
```

## 4 整合SpringBoot

## 4.1 相关依赖

```java
  <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
<!--jwt创建与校验-->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt</artifactId>
            <version>0.9.1</version>
        </dependency>
    </dependencies>
```

## 4.2 JWT通用方法

```java
import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.io.*;
import java.security.*;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.HashMap;
import java.util.Map;
/**
 * @author lyf
 * @create 2022-03-05 17:43
 * JWT验证的工具类
 **/
public class JWTUtil {
    /**
     * 根据有效荷载创建JWT验证字符串
     * 使用的签名算法为HS256,对称算法，生成JWT字符串与解析JWT
     * @param playload JWT有效荷载
     * @param key 签名的key,
     * @return
     */
    public String createJWTStrHS256(Map<String,Object> playload,String key){
        //头部JSON数据，固定写法
        Map<String,Object>headerMap=new HashMap<>();
        //算法HS256
        headerMap.put("alg", SignatureAlgorithm.HS256.getValue());
        headerMap.put("typ", "JWT");
        //使用JJWT提供的API创建JWT
        String s = Jwts.builder()
                //设置头部数据
                .setHeader(headerMap)
                //设置有效荷载数据
                .setClaims(playload)
                //使用HS256签名算法
                .signWith(SignatureAlgorithm.HS256, key)
                .compact();
        return s;
    }
    /**
     * 从JWT字符串中获得有效荷载对象
     * @param JwtStr
     * @param key 自定义key，与创建JWT使用的key一致
     * @return
     */
    public Object decodeJWTrHS256(String JwtStr,String key){
        //头部JSON数据，固定写法
        Map<String,Object>headerMap=new HashMap<>();
        //算法HS256
        headerMap.put("alg", SignatureAlgorithm.HS256.getValue());
        headerMap.put("typ","JWT");
        Jwt jwt = Jwts.parser()
                .setSigningKey(key)
                .parse(JwtStr);
        return jwt.getBody();
    }
    /**
     * 生成RS256签名算法中需要的公钥私钥文件
     * @param password 随机密码
     */
    public void generateRS256Key(String password) throws NoSuchAlgorithmException {
        //钥匙对生成Generator，使用的是RSA算法
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        SecureRandom secureRandom = new SecureRandom(password.getBytes());
        keyPairGenerator.initialize(1024, secureRandom);
        //获得钥匙对
        KeyPair keyPair = keyPairGenerator.genKeyPair();
        //公钥字节码
        byte[] publicKeyBytes = keyPair.getPublic().getEncoded();
        //私钥字节码
        byte[] privateKeyBytes = keyPair.getPrivate().getEncoded();
        //公私钥匙对信息写入文件
        try {
            FileOutputStream fos=new FileOutputStream("..\\pub.key");
            fos.write(publicKeyBytes);
            fos.close();
            FileOutputStream fos_1=new FileOutputStream("..\\pri.key");
            fos_1.write(privateKeyBytes);
            fos_1.close();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    /**
     * 根据私钥物理文件来创建私钥对象，用于JWT使用RSA256签名算法
     * @return
     */
    public PrivateKey generatePrivateKey( )  {
        try {
            //根据类路径下的pri.key私钥物理文件获得输入流
            InputStream resourceAsStream =
                    this.getClass().getClassLoader().getResourceAsStream("pri.key");
            DataInputStream dis = new DataInputStream(resourceAsStream);
            byte[] keyBytes = new byte[resourceAsStream.available()];
            dis.readFully(keyBytes);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            return kf.generatePrivate(spec);
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (InvalidKeySpecException e) {
            e.printStackTrace();
        }
        return null;
    }
    /**
     * 根据公钥物理文件来创建公钥对象，用于JWT使用RSA256签名算法
     * @return
     */
    public PublicKey generatePublicKey(){
        try {
            //根据类路径下的pri.key私钥物理文件获得输入流
            InputStream resourceAsStream =
                    this.getClass().getClassLoader().getResourceAsStream("pri.key");
            DataInputStream dis = new DataInputStream(resourceAsStream);
            byte[] keyBytes = new byte[resourceAsStream.available()];
            dis.readFully(keyBytes);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            return kf.generatePublic(spec);
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (InvalidKeySpecException e) {
            e.printStackTrace();
        }
        return null;
    }
    /**
     * 根据有效荷载创建JWT验证字符串
     * 使用的签名算法为RS256,非对称算法，创建JWT字符串需要使用私钥
     * @param playload JWT有效荷载
     * @return
     */
    public String createJWTStrRS256(Map<String,Object> playload){
        //头部JSON数据，固定写法
        Map<String,Object>headerMap=new HashMap<>();
        //算法HS256
        headerMap.put("alg", SignatureAlgorithm.RS256.getValue());
        headerMap.put("typ","JWT");
        PrivateKey key=generatePrivateKey();
        //使用JJWT提供的API创建JWT
        String s = Jwts.builder()
                //设置头部数据
                .setHeader(headerMap)
                //设置有效荷载数据
                .setClaims(playload)
                //使用HS256签名算法
                .signWith(SignatureAlgorithm.RS256, key)
                .compact();
        return s;
    }
    /**
     * 从JWT字符串中获得有效荷载对象
     * @param JwtStr 需要从公钥中解析JWT
     * @return
     */
    public Object decodeJWTrRS256(String JwtStr){
        //头部JSON数据，固定写法
        Map<String,Object>headerMap=new HashMap<>();
        //算法HS256
        headerMap.put("alg", SignatureAlgorithm.RS256.getValue());
        headerMap.put("typ","JWT");
        PrivateKey key=generatePrivateKey();
        Jwt jwt = Jwts.parser()
                .setSigningKey(key)
                .parse(JwtStr);
        return jwt.getBody();
    }
}
```

## 4.3 项目结构

## 4.4 测试JWT字符串的生成与解析

```java
@Test
public void test1(){
    Map<String, Object> playload=new HashMap<>();
    playload.put("userId","100");
    playload.put("tes","test");
    //使用HS256加密算法
    String str = util.createJWTStrHS256(playload, "123456");
    System.out.println(str);
    Object o = util.decodeJWTrHS256(str, "123456");
    System.out.println(o);
    //使用RS256加密算法
    String str1 = util.createJWTStrRS256(playload);
    System.out.println(str1);
    Object o1 = util.decodeJWTrRS256(str1);
    System.out.println(o1);
}
```

整合swagger2实现token登录验证的代码将在下一章节进行介绍

[SpringBoot整合JWT实现登录验证(2)](https://blog.csdn.net/contact97/article/details/123359023)

>
