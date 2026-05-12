# 09、SpringCloud+Security+Oauth2授权 - Oauth2&amp;JWT的认识
- 来源：https://ddkk.com/zhuanlan/security/oauth2/2/9.html
- 分类：安全框架
- 分组：教程目录
我们的授权方案是 SpringCloud + Security + Oauth2 + JWT 为了方便后面做认证授权先来普及两个概念Oauth2和JWT

## Oauth3部分

## 1.Oauth2概述

OAUTH协议为用户资源的授权提供了一个安全的、开放而又简易的标准。与以往的授权方式不同之处是OAUTH的授权不会使第三方触及到用户的帐号信息（如用户名与密码），即第三方无需使用用户的用户名与密码就可以申请获得该用户资源的授权，因此OAUTH是安全的，oAuth是Open Authorization的简写，目前的版本是2.0版。

## 2.Oauth2的授权流程

为了方便理解，这里以Oauth2授权码模式为例分析一下Oauth2的授权流程

这里以云打印案例举例，张三想要通过云打印平台打印QQ空间的照片，传统的流程是张三把QQ账号交给云打印平台，云打印平台拿着张三的账号去QQ空间认证成功后获取照片进行照片的打印，不难看出这种方式会将张三的账号泄露给云打印平台，有安全隐患。

OAUTH2授权模式是不需要接触到张三的账号的，QQ空间只需要向张三发起授权请求，得到张三的授权许可后向云打印颁发授权码(授权码模式)，云打印得到授权码可以根据授权码向QQ空间换取Token,云打印得到Token后又可以使用Token换取张三的照片资源

## 3.Oauth2四种授权模式

参考文档：http://www.ruanyifeng.com/blog/2014/05/oauth_2_0.html

Oauth2的授权模式是客户端必须得到用户的授权（authorization grant）才能获得令牌（access token），通过令牌可以换取用户的资源，为此OAuth 2.0定义了四种授权方式

- 授权码模式（authorization code）
- 简化模式（implicit）
- 密码模式（resource owner password credentials）
- 客户端模式（client credentials）

**Oauth2相关概念**

- Third-party application

第三方应用程序，本文中又称"客户端"（client），即栗子中的"云打印"。
- HTTP service

HTTP服务提供商，本文中简称"服务提供商"，即上一节例子中的QQ。
- Resource Owner

资源所有者，本文中又称"用户"（user）。
- User Agent

用户代理，如浏览器,移动端等。
- Authorization server

认证服务器，即服务提供商专门用来处理认证的服务器QQ。
- Resource server

资源服务器，即服务提供商存放用户生成的资源的服务器。它与认证服务器，可以是同一台服务器，也可以是不同的服务器QQ

### 3.1.授权码模式（authorization code）

授权码模式（authorization code）是功能最完整、流程最严密的授权模式。它的认授权流程如下：

**它的步骤如下**

- （A）用户访问客户端，后者将前者导向认证服务器。
- （B）用户选择是否给予客户端授权。
- （C）假设用户给予授权，认证服务器将用户导向客户端事先指定的"重定向URI"（redirection URI），同时附上一个授权码。
- （D）客户端收到授权码，附上早先的"重定向URI"，向认证服务器申请令牌。这一步是在客户端的后台的服务器上完成的，对用户不可见。
- （E）认证服务器核对了授权码和重定向URI，确认无误后，向客户端发送访问令牌（access token）和更新令牌（refresh token）。

**请求参数说明**

A步骤中(获取授权码)，客户端申请认证的URI，包含以下参数：

- response_type：表示授权类型，必选项，此处的值固定为"code"
- client_id：表示客户端的ID，必选项
- redirect_uri：表示重定向URI，可选项
- scope：表示申请的权限范围，可选项
- state：表示客户端的当前状态，可以指定任意值，认证服务器会原封不动地返回这个值。

例如：

```java
GET /authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz
        &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb HTTP/1.1
Host: server.example.com
```

C步骤中(返回授权码)，服务器回应客户端的URI，包含以下参数：

- code：表示授权码，必选项。该码的有效期应该很短，通常设为10分钟，客户端只能使用该码一次，否则会被授权服务器拒绝。该码与客户端ID和重定向URI，是一一对应关系。
- state：如果客户端的请求中包含这个参数，认证服务器的回应也必须一模一样包含这个参数。

例如

```java
HTTP/1.1 302 Found
Location: https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA
          &state=xyz
```

D步骤中(获取令牌)，客户端向认证服务器申请令牌的HTTP请求，包含以下参数：

- grant_type：表示使用的授权模式，必选项，此处的值固定为"authorization_code"。
- code：表示上一步获得的授权码，必选项。
- redirect_uri：表示重定向URI，必选项，且必须与A步骤中的该参数值保持一致。
- client_id：表示客户端ID，必选项。

例如：

```java
POST /token HTTP/1.1
Host: server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded
grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb
```

E步骤中，认证服务器发送的HTTP回复，包含以下参数：

- access_token：表示访问令牌，必选项。
- token_type：表示令牌类型，该值大小写不敏感，必选项，可以是bearer类型或mac类型。
- expires_in：表示过期时间，单位为秒。如果省略该参数，必须其他方式设置过期时间。
- refresh_token：表示更新令牌，用来获取下一次的访问令牌，可选项。
- scope：表示权限范围，如果与客户端申请的范围一致，此项可省略。

例如

```java
 HTTP/1.1 200 OK
 Content-Type: application/json;charset=UTF-8
 Cache-Control: no-store
 Pragma: no-cache
 {
   "access_token":"2YotnFZFEjr1zCsicMWpAA",
   "token_type":"example",
   "expires_in":3600,
   "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA",
   "example_parameter":"example_value"
 }
```

从上面代码可以看到，相关参数使用JSON格式发送（Content-Type: application/json）。此外，HTTP头信息中明确指定不得缓存

### 3.2.简化模式（implicit）

简化模式（implicit grant type）不通过第三方应用程序的服务器，直接在浏览器中向认证服务器申请令牌，跳过了"授权码"这个步骤，因此得名。所有步骤在浏览器中完成，令牌对访问者是可见的，且客户端不需要认证。

它的步骤如下

- （A）客户端将用户导向认证服务器。
- （B）用户决定是否给于客户端授权。
- （C）假设用户给予授权，认证服务器将用户导向客户端指定的"重定向URI"，并在URI的Hash部分包含了访问令牌。
- （D）浏览器向资源服务器发出请求，其中不包括上一步收到的Hash值。
- （E）资源服务器返回一个网页，其中包含的代码可以获取Hash值中的令牌。
- （F）浏览器执行上一步获得的脚本，提取出令牌。
- （G）浏览器将令牌发给客户端

A步骤中，客户端发出的HTTP请求，包含以下参数：

- response_type：表示授权类型，此处的值固定为"token"，必选项。
- client_id：表示客户端的ID，必选项。
- redirect_uri：表示重定向的URI，可选项。
- scope：表示权限范围，可选项。
- state：表示客户端的当前状态，可以指定任意值，认证服务器会原封不动地返回这个值。

**获取令牌URL**

例如：

```java
    GET /authorize?response_type=token&client_id=s6BhdRkqt3&state=xyz
        &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb HTTP/1.1
    Host: server.example.com
```

**C步骤中，认证服务器回应客户端的URI，包含以下参数**：

- access_token：表示访问令牌，必选项。
- token_type：表示令牌类型，该值大小写不敏感，必选项。
- expires_in：表示过期时间，单位为秒。如果省略该参数，必须其他方式设置过期时间。
- scope：表示权限范围，如果与客户端申请的范围一致，此项可省略。
- state：如果客户端的请求中包含这个参数，认证服务器的回应也必须一模一样包含这个参数。

下面是一个例子。

```java
HTTP/1.1 302 Found
Location: http://example.com/cb#access_token=2YotnFZFEjr1zCsicMWpAA
&state=xyz&token_type=example&expires_in=3600
```

在上面的例子中，认证服务器用HTTP头信息的Location栏，指定浏览器重定向的网址。注意，在这个网址的Hash部分包含了令牌。

根据上面的D步骤，下一步浏览器会访问Location指定的网址，但是Hash部分不会发送。接下来的E步骤，服务提供商的资源服务器发送过来的代码，会提取出Hash中的令牌。

### 3.3.密码模式（resource owner password credentials）

密码模式（Resource Owner Password Credentials Grant）中，用户向客户端提供自己的用户名和密码。客户端使用这些信息，向"服务商提供商"索要授权。

在这种模式中，用户必须把自己的密码给客户端，但是客户端不得储存密码。这通常用在用户对客户端高度信任的情况下，比如客户端是操作系统的一部分，或者由一个著名公司出品。而认证服务器只有在其他授权模式无法执行的情况下，才能考虑使用这种模式。

它的步骤如下

- （A）用户向客户端提供用户名和密码。
- （B）客户端将用户名和密码发给认证服务器，向后者请求令牌。
- （C）认证服务器确认无误后，向客户端提供访问令牌。

B步骤中，客户端发出的HTTP请求，包含以下参数：

- grant_type：表示授权类型，此处的值固定为"password"，必选项。
- username：表示用户名，必选项。
- password：表示用户的密码，必选项。
- scope：表示权限范围，可选项。

下面是一个例子。

```java
POST /token HTTP/1.1
Host: server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded
grant_type=password&username=johndoe&password=A3ddj3w
```

整个过程中，客户端不得保存用户的密码。

### 3.4.客户端模式（client credentials）

客户端模式（Client Credentials Grant）指客户端以自己的名义，而不是以用户的名义，向"服务提供商"进行认证。严格地说，客户端模式并不属于OAuth框架所要解决的问题。在这种模式中，用户直接向客户端注册，客户端以自己的名义要求"服务提供商"提供服务，其实不存在授权问题。

它的步骤如下：

- （A）客户端向认证服务器进行身份认证，并要求一个访问令牌。
- （B）认证服务器确认无误后，向客户端提供访问令牌。

A步骤中，客户端发出的HTTP请求，包含以下参数：

- granttype：表示授权类型，此处的值固定为"clientcredentials"，必选项。
- scope：表示权限范围，可选项

```java
 POST /token HTTP/1.1
 Host: server.example.com
 Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
 Content-Type: application/x-www-form-urlencoded
 grant_type=client_credentials
```

### 3.5.刷新令牌

如果用户访问的时候，客户端的"访问令牌"已经过期，则需要使用"更新令牌"申请一个新的访问令牌。

客户端发出更新令牌的HTTP请求，包含以下参数：

- granttype：表示使用的授权模式，此处的值固定为"refreshtoken"，必选项。
- refresh_token：表示早前收到的更新令牌，必选项。

scope：表示申请的授权范围，不可以超出上一次申请的范围，如果省略该参数，则表示与上一次一致。

下面是一个例子。

```java
 POST /token HTTP/1.1
 Host: server.example.com
 Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
 Content-Type: application/x-www-form-urlencoded
 grant_type=refresh_token&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
```

### JWT部分

## 1.JWT概述

### 1.1.什么是JWT

JSON Web Token（JWT）是一个非常轻巧的规范。这个规范允许我们使用JWT在用户和服务器之间传递安全可靠的信息。

JWT以 JSON 对象的形式安全传递信息。因为存在数字签名，因此所传递的信息是安全的。客户端身份经过服务器验证通过后，会生成带有签名的 JSON 对象并将它返回给客户端。客户端在收到这个 JSON 对象后存储起来。

在以后的请求中客户端将 JSON 对象连同请求内容一起发送给服务器，服务器收到请求后通过 JSON 对象标识用户，如果验证不通过则不返回请求的数据。

总结：使用JWT生产的Token是安全的,它实现了数据的安全传输，并且Token中可以携带认证信息，做到真正的无状态，是“客户端Token”模式授权方案的不二选择

### 1.2.JWT特点

- 基于JSON，方便解析
- 可以在令牌中定义内容，方便扩展
- 非对称加密算法即数字签名，JWT防篡改
- Token携带认证信息，无效访问认证服务器即可完成权限校验，做到“无状态”

### 1.3.JWT组成

JWT包含三部分组成

**1、** 头部(header)：

JSON格式，描述JWT的最基本的信息，如签名算法等效果如下：`{"typ":"JWT","alg":"HS256"}` 这里指明了签名算法是HS256算法。在使用过程中会对该 JSON进行BASE64编码如：`yJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9`
**2、** 载荷(playload)：

JSON格式，包含了需要的数据内容，也需要BASE64编码。包含三部分

标准中注册的声明（建议但不强制使用）

```java
iss: jwt签发者
sub: jwt所面向的用户
aud: 接收jwt的一方
exp: jwt的过期时间，这个过期时间必须要大于签发时间
nbf: 定义在什么时间之前，该jwt都是不可用的.
iat: jwt的签发时间
jti: jwt的唯一身份标识，主要用来作为一次性token。
```

公共的声明 ：公共的声明可以添加任何的信息，一般添加用户的相关信息或其他业务需要的必要信息.但不建议添加敏感信息，因为该部分在客户端可解密.

私有的声明 ：私有声明是提供者和消费者所共同定义的声明，一般不建议存放敏感信息，因为base64是对称解密的，意味着该部分信息可以归类为明文信息。

定义一个payload: 如 `{"sub":"1234","name":"xxx","admin":true}` 进行Base64编码后得到JWT第二部分如 `eyJzdWIiOiIxMjM0NTY3ODkbmFtZSI6IkpvaG4gRG9lIiwiYW...`
**3、** 签名(signature)：通过指定的算法生成哈希，以确保数据不会被篡改jwt的第三部分是一个签证信息，通过指定的算法生成哈希，以确保数据不会被篡改，这个签证信息由三部分组成：head(base64编码后的)；playload(base64编码后的)；secret(秘钥)签名后的密文构成JWT第三部分如：`ThecMfgYjtoys3JX7dpx3hu6pUm0piZ0tXXr`最后JWT构建的内容编码后的字符串；

```java
eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI4ODgiLCJzdWIiOiLlsI_nmb0iLCJpYXQiOjE1NTc5MDQxODF9.ThecMfgYjtoys3JX7dpx3hu6pUm0piZ0tXXreFU_u3Y
```

## 2.JWT初探

### 2.1.创建JWT令牌

首先我们来加入JWT的依赖

```xml
<dependency>
 <groupId>io.jsonwebtoken</groupId>
 <artifactId>jwt</artifactId>
 <version>0.9.0</version>
</dependency>
```

令牌的签发

```java
//系统时间
long now=System.currentTimeMillis();
//计算过期时间30秒过期
long exp=now+1000*30;
//使用Jwts签发令牌
JwtBuilder jwtBuilder = Jwts.builder().setId( "111" )	//设置唯一编号
 .setSubject( "zs" )	//主题，可以扔一个JSON
 .setIssuedAt( new Date() )//签发时间
 .setExpiration( new Date( exp ) )//过期时间
 .claim( "roles","admin" )	//扩展数据，角色
 .signWith( SignatureAlgorithm.HS256, "123" );	//使用HS256算法，并设置SecretKey(字符串)
String token = jwtBuilder.compact();
System.out.println(token);
```

打印一个很长的密文：`eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI4ODgiLCJzdWIiOiLlsI_nmb0iLCJpYXQiOjE1NTc5MDQxODF9.ThecMfgYjtoys3JX7dpx3hu6pUm0piZ0t...`

解析令牌

```java
String token ="eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI4ODgiLCJzdWIiOiLlsI_nmb0iLCJpYXQiOjE1NjIyNTM3NTQsImV4cCI6MTU2MjI1Mzc4Mywicm9sZXMiOiJhZG1pbiJ9.CY6CMembCi3mAkBHS3ivzB5w9uvtZim1HkizRu2gWaI";
Claims claims = Jwts.parser().setSigningKey( "123" ).parseClaimsJws( token ).getBody();	
System.out.println(claims);	//扩展数据
System.out.println(claims.get( "roles" ));	//角色信息
```

打印效果{jti=111, sub=zs…}

### 总结

这里简单介绍一下Oauth2的四周授权模式以及对JWT的简单认识，目的是为后面微服务授权做铺垫，在spring为我们提供了一个解决方案：`spring-cloud-starter-ouath2` 这个Jar集成了Oauth2和JWT，我们直接使用它即可
