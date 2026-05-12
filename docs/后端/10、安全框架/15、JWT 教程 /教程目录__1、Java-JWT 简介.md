# 1、Java-JWT 简介
- 来源：https://ddkk.com/zhuanlan/security/jwt/1.html
- 分类：安全框架
- 分组：教程目录
## 前言

Java 8、11 和 17 支持此库。对于 8 以上非 LTS 版本的问题，将根据具体情况进行考虑。

## 什么是Java JWT？

它是[JSON Web Token (JWT)]的一个java实现，可以用于身份验证，有关JSON Web Token请看这里

[https://tools.ietf.org/html/rfc7519](https://tools.ietf.org/html/rfc7519)

java-jwt的Github地址

[https://github.com/auth0/java-jwt](https://github.com/auth0/java-jwt)

java-jwt的文档：

[https://javadoc.io/doc/com.auth0/java-jwt/latest/index.html](https://javadoc.io/doc/com.auth0/java-jwt/latest/index.html)

## MAVEN依赖

```java
<dependency>
    <groupId>com.auth0</groupId>
    <artifactId>java-jwt</artifactId>
    <version>4.0.0</version>
</dependency>
```

## 目前可用的算法（v3.10.3）

JWS
Algorithm
Description

HS256
HMAC256
HMAC with SHA-256

HS384
HMAC384
HMAC with SHA-384

HS512
HMAC512
HMAC with SHA-512

RS256
RSA256
RSASSA-PKCS1-v1_5 with SHA-256

RS384
RSA384
RSASSA-PKCS1-v1_5 with SHA-384

RS512
RSA512
RSASSA-PKCS1-v1_5 with SHA-512

ES256
ECDSA256
ECDSA with curve P-256 and SHA-256

ES384
ECDSA384
ECDSA with curve P-384 and SHA-384

ES512
ECDSA512
ECDSA with curve P-521 and SHA-512

## 使用指南

## 选择一个Algorithm

Algorithm定义了一个token是如何被签名和验证的。

在HMAC算法中，它可以用密钥的原始值实例化，

在RSA和ECDSA算法中，它可以用密钥对或`KeyProvider`实例化。

Algorithm实例被初始化之后可以重复使用在签名和验证操作上。

## 使用静态secrets或keys

```java
//HMAC
Algorithm algorithmHS = Algorithm.HMAC256("secret");
//RSA
RSAPublicKey publicKey = //Get the key instance
RSAPrivateKey privateKey = //Get the key instance
Algorithm algorithmRS = Algorithm.RSA256(publicKey, privateKey);
```

获取或读取key的方式不在本文范围内，有关如何实现这一点的示例，请参阅：

[https://gist.github.com/lbalmaceda/9a0c7890c2965826c04119dcfb1a5469](https://gist.github.com/lbalmaceda/9a0c7890c2965826c04119dcfb1a5469)

## 使用KeyProvider

通过使用`KeyProvider` ，您可以在运行时更改用于验证令牌签名或为RSA或ECDSA算法签署新令牌的密钥。

这可以通过实现 `RSAKeyProvider` 或者`ECDSAKeyProvider` 来达成。

KeyProvider的方法：

- getPublicKeyById(String kid):它在令牌签名验证期间调用，它应该返回用于验证令牌的密钥。如果 key rotation 被使用到了, 例如 [JWK](https://tools.ietf.org/html/rfc7517) 它可以使用id获取正确的rotation key(或者只是一直返回相同的键)。
- getPrivateKey(): 它在令牌签名期间调用，它应该返回将用于对JWT签名的键。
- getPrivateKeyId(): 它是在令牌签名期间调用的，它应该返回标识由 getPrivateKey() 返回的密钥的id。这个值比在 JWTCreator.Builder#withKeyId(String) 方法设置的值更好. 如果你不需要设置一个 kid 值，那就避免使用KeyProvider实例化一个Algorithm对象。

下面这个例子展示了如何使用`JwkStore`，它是一个理想的[JWK Set](https://auth0.com/docs/jwks)实现，如果你想看使用JWKS实现简单的key rotation，请看这里：[https://github.com/auth0/jwks-rsa-java](https://github.com/auth0/jwks-rsa-java)

```java
final JwkStore jwkStore = new JwkStore("{JWKS_FILE_HOST}");
final RSAPrivateKey privateKey = //Get the key instance
final String privateKeyId = //Create an Id for the above key
RSAKeyProvider keyProvider = new RSAKeyProvider() {
    @Override
    public RSAPublicKey getPublicKeyById(String kid) {
        //Received 'kid' value might be null if it wasn't defined in the Token's header
        RSAPublicKey publicKey = jwkStore.get(kid);
        return (RSAPublicKey) publicKey;
    }
    @Override
    public RSAPrivateKey getPrivateKey() {
        return privateKey;
    }
    @Override
    public String getPrivateKeyId() {
        return privateKeyId;
    }
};
Algorithm algorithm = Algorithm.RSA256(keyProvider);
//Use the Algorithm to create and verify JWTs.
```

## Create and Sign a Token（创建Token并给它签名）

首先您需要调用`JWT.create()`方法来创建一个`JWTCreator`实例

使用builder来定义token需要的自定义声明。

最后调用`sign()`方法，并传递一个`Algorithm`实例来获得一个String类型的token

使用了`HS256`算法的案例：

```java
try {
    Algorithm algorithm = Algorithm.HMAC256("secret");
    String token = JWT.create()
        .withIssuer("auth0")
        .sign(algorithm);
} catch (JWTCreationException exception){
    //Invalid Signing configuration / Couldn't convert Claims.
}
```

使用了`RS256`算法的案例：

```java
RSAPublicKey publicKey = //Get the key instance
RSAPrivateKey privateKey = //Get the key instance
try {
    Algorithm algorithm = Algorithm.RSA256(publicKey, privateKey);
    String token = JWT.create()
        .withIssuer("auth0")
        .sign(algorithm);
} catch (JWTCreationException exception){
    //Invalid Signing configuration / Couldn't convert Claims.
}
```

如果一个`Claim`无法转换为JSON，或者签名过程中使用的key是无效的，都会引发一个 `JWTCreationException`异常

## Verify a Token（如何验证一个Token）

你首先需要调用`JWT.require()`方法并且传入一个`Algorithm`实例来创建一个`JWTVerifier`实例，如果你想让你的token拥有特殊的Claim，那你需要使用builder去定义它们。

通过build()方法返回的实例是可以重复使用的，所以你可以只定义它一次，然后用它来验证不同的token，最后调用verifier.verify()传递token。

使用了`HS256`算法的案例：

```java
String token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXUyJ9.eyJpc3MiOiJhdXRoMCJ9.AbIJTDMFc7yUa5MhvcP03nJPyCPzZtQcGEp-zWfOkEE";
try {
    Algorithm algorithm = Algorithm.HMAC256("secret");
    JWTVerifier verifier = JWT.require(algorithm)
        .withIssuer("auth0")
        .build(); //Reusable verifier instance
    DecodedJWT jwt = verifier.verify(token);
} catch (JWTVerificationException exception){
    //Invalid signature/claims
}
```

使用了`RS256`算法的案例：

```java
String token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXUyJ9.eyJpc3MiOiJhdXRoMCJ9.AbIJTDMFc7yUa5MhvcP03nJPyCPzZtQcGEp-zWfOkEE";
RSAPublicKey publicKey = //Get the key instance
RSAPrivateKey privateKey = //Get the key instance
try {
    Algorithm algorithm = Algorithm.RSA256(publicKey, privateKey);
    JWTVerifier verifier = JWT.require(algorithm)
        .withIssuer("auth0")
        .build(); //Reusable verifier instance
    DecodedJWT jwt = verifier.verify(token);
} catch (JWTVerificationException exception){
    //Invalid signature/claims
}
```

如果token的签名无效或者Claim需求未得到满足，就会抛出`JWTVerificationException`异常。

## Time Validation（Token的时间验证）

JWT令牌可以包括DateNumber字段，可以用来验证以下情况:

- 在过去日期发布的token "iat" `` TODAY and
- 可以正常使用的token "nbf" ` alg 和 typ 值总会在签名过程结束后被添加到Header里

## Payload Claims（负载声明）

- Issuer (“iss”)

返回Issuer值，如果它在Payload里未定义，则返回null。

```java
String issuer = jwt.getIssuer();
```

- Subject (“sub”)

返回Subject值，如果它在Payload里未定义，则返回null。

```java
String subject = jwt.getSubject();
```

- Audience (“aud”)

返回Audience值，如果它在Payload里未定义，则返回null。

```java
List<String> audience = jwt.getAudience();
```

- Expiration Time (“exp”)

返回Expiration Time值，如果它在Payload里未定义，则返回null。

```java
Date expiresAt = jwt.getExpiresAt();
```

- Not Before (“nbf”)

返回Not Before值，如果它在Payload里未定义，则返回null。

```java
Date notBefore = jwt.getNotBefore();
```

- Issued At (“iat”)

返回IssuedAt值，如果它在Payload里未定义，则返回null。

```java
Date issuedAt = jwt.getIssuedAt();
```

- JWT ID (“jti”)

返回JWT ID值，如果它在Payload里未定义，则返回null。

```java
String id = jwt.getId();
```

- Private Claims

可以通过调用`getClaims()` 或者 `getClaim()` 并传递Claim的name来获取其它定义在token的Payload里的Claim。

这两个方法一定会返回Claim对象，即使它找不到也会返回，所以它可能是空的，你可以调用`claim.isNull()`方法来检查它是不是空的。

```java
Map<String, Claim> claims = jwt.getClaims();    //Key is the Claim name
Claim claim = claims.get("isAdmin");
```

或者

```java
Claim claim = jwt.getClaim("isAdmin");
```

当使用`JWT.create()` 创建Token时，你可以通过调用`withClaim()`方法并传入name和value来指定自定义的Claim

```java
String token = JWT.create()
        .withClaim("name", 123)
        .withArrayClaim("array", new Integer[]{
     1, 2, 3})
        .sign(algorithm);
```

您还可以通过调用 `withClaim()` 并传递name和所需的value来验证`JWT.require()` 上的自定义声明。

```java
JWTVerifier verifier = JWT.require(algorithm)
    .withClaim("name", 123)
    .withArrayClaim("array", 1, 2, 3)
    .build();
DecodedJWT jwt = verifier.verify("my.jwt.token");
```

> 目前支持的自定义JWT Claim创建和验证的类有:Boolean, Integer, Double, String, Date and Arrays of type String and Integer.

## Claim Class（声明类）

Claim类是Claim值的包装类，它允许您以不同的类的类型获取声明，如下：

### 基础用法

- **asBoolean()**: 返回Boolean类型的值，如果无法被转换则返回null。
- **asInt()**: 返回Integer类型的值，如果无法被转换则返回null。
- **asDouble()**: 返回Double类型的值，如果无法被转换则返回null。
- **asLong()**: 返回Long类型的值，如果无法被转换则返回null。
- **asString()**: 返回String类型的值，如果无法被转换则返回null。
- **asDate()**: 返回Date类型的值，如果无法被转换则返回null。

这必须是NumericDate (Unix Epoch/Timestamp)类型，在 [JWT Standard](https://tools.ietf.org/html/rfc7519#section-2) 里指定了所有的NumericDate类型的值必须以秒为单位。

### 自定义类和集合

要获取作为集合的声明，您需要提供要转换的内容的**Class Type**。

- **as(class)**: 返回类型被转换为**Class Type**的值. 对于集合来说你需要使用 asArray 和 asList 方法。
- **asMap()**: 返回类型被转换为 **Map** 的值。
- **asArray(class)**: 返回类型被转换为 an Array of elements of type **Class Type**的值, 如果返回的类型不是JSON Array则返回null。
- **asList(class)**: 返回类型被转换为 a List of elements of type **Class Type**, 的值, 如果返回的类型不是JSON Array则返回null。

如果不能把参数转换为给定的**Class Type**的值，将会抛出 `JWTDecodeException` 异常。
