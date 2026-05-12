# 24、Nginx 精通 - Nginx Plus增强功能之身份验证JWT
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/24.html
- 分类：服务器框架
- 分组：教程目录
使用NGINX Plus，可以使用JWT身份验证来控制对资源的访问。JWT 规范是 OpenID Connect 的重要基础，它为 OAuth 2.0 生态系统提供了单点登录令牌。JWT 本身还可以用作身份验证凭证，相比传统 API 密钥，它提供了一种更好的对基于 Web 的 API 的访问控制。API和微服务的部署者也在转向JWT标准，因为它的简单性和灵活性。使用JWT身份验证，客户端提供一个JSON Web令牌，该令牌将根据本地密钥文件或远程服务进行验证。

## 从session认证说起

互联网服务基本都离不开用户认证。目前最主流的用户认证就是采用session认证模式。

### session基本流程

**1、** 客户端浏览器向服务器发送用户名和密码；

**2、** 服务器验证通过后，在当前对话（session）里面保存相关数据，比如用户角色、登录时间等等；

**3、** 服务器向用户返回一个session_id，写入用户的Cookie；

**4、** 用户随后的每一次请求，都会通过Cookie，将session_id传回服务器；

**5、** 服务器收到session_id，找到前期保存的数据，由此得知用户的身份；

### session认证缺点

session认证模式最大优点就是简单成熟。但存在如下缺点：

**1、** 服务端保存每个用户的session，随着认证用户的增多，服务端的开销会明显增大；

**2、** session信息保存在当前服务器内存中，意味着用户下次请求还必须要请求在这台服务器上如果是分布式应用，就相应限制了负载均衡器的能力，也就意味着限制了应用的扩展能力；

**3、** 因为后续访问合法性是基于cookie中session_id来进行的，如果cookie被截获，用户就会很容易受到跨站请求伪造的攻击；

### session优化方案

针对分布式应用，session优化方案就是session信息集中缓存到缓存服务器（redis），每次用户访问，从缓存服务器获取session信息验证。这样能解决前述缺点1、2。

另一类涉及单点登陆，如A和B两个系统是同一家公司的关联系统，要求用户只要在其中一个系统登录，再访问另一个系统就会自动登录。如果上述方案想要解决，还需把用户及权限信息从A、B系统中抽取出来统一化。

优化方案的另一种思路方案就是服务器不保存 session 数据，所有数据都保存在客户端，客户端每次请求都发回服务器。JWT就是这种方案实现规范。

## 了解JWT

JWT（Json Web Token）是一种开放标准协议(RFC7519)，它定义了一种“紧凑”和“自包含”的方式，用于各方之间作为JSON对象安全地传输信息。JWT通常用于在各方之间安全地将信息作为JSON对象进行传输，可以在数据传输过程中对数据进行加密、签名等处理。

JWT的使用场景包括身份认证和授权，可以在用户登录后将JWT包含在响应中返回给客户端，客户端在后续请求中将JWT放在请求头中，服务器验证JWT的签名和有效性后，根据JWT中的声明信息进行权限验证。

JWT的优点包括：自包含，可以避免多次数据库查询，提高性能；适用于跨域通信，可以在多个服务之间安全地传输信息；可以通过加密和签名保护数据的安全性和完整性。

需要注意的是，JWT不是一种加密技术，它不能保护数据的内容，只能保护数据的传输安全性和完整性。同时，由于JWT是基于JSON的，它的大小比较有限制，不适合传输大量数据。

### 基本原理

JWT的原理是服务器认证以后将用户信息生成一个 JWT的Token，发回给客户端保存，后续客户端每次请求服务端只需要使用保存的密钥验证token的正确性，服务端不用再保存任何session数据，降低服务端资源消耗，同时使服务端变得无状态，更便于系统扩展。

### JWT结构

在URL传输中，JWT表现为：AAA.BBB.CCC（从前到后包括用"."隔开的三部分），实际例子如下：

```java
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBcHAgU3lzdGVtIiwic3ViIjoiQXBwLUFQSS1HYXRld2EiLCJleHRyYSI6InRlc3QifQ.f65pTyWLg2dj77Gj3eKp3eU8tf3H-z7tiSHwD5u-3iI
```

JWT三部分分别是：头部（Header）内容、负载（Payload）内容和签名（Signature）内容。

#### 头部

JWT头部为json格式，包含令牌类型和算法信息，定义如下：

```java
{
    JWT头类型固定为"JWT"
    "typ":"JWT",
    签名算法
    "alg":"HS256"
}
```

**头部字符串就是JSON头部json的Base64url编码。**

#### 负载

负载部分就是要传输json格式的数据，通常是用户相关信息；JWT 规定了7个字段值，分别是：

- iss (issuer)：jwt签发者，大小写敏感
- sub (subject)：主题字符串（通常用于区分是哪个应用），必须是在发行人的上下文中是唯一的。大小写敏感
- aud (audience)：受众，即处理JWT的主体。如果处理JWT的主体不是自己，则JWT必须被拒绝。
- exp (expiration time)：过期时间，在这个时间之后JWT无效。是一个NumericDate值。
- nbf (Not Before)：生效时间，在这个时间之前JWT无效。是一个NumericDate值。
- iat (Issued At)：jwt签发时间。
- jti (JWT ID)：JWT唯一标识符。标识符值的分配方式必须确保相同值意外分配给不同数据对象的可能性可以忽略不计；如果应用程序使用多个颁发者，则必须防止不同颁发者生成的值之间发生冲突。“jti”声明可以用来防止JWT被重播。“jti”值是一个区分大小写的字符串。

虽然JWT 规定了7个字段值，但均为可选，实际上负载可为任何数据。如果用于身份验证，优先选用规定的字段值。

**负载字符串就是负载json的Base64url编码。**

#### 签名

签名就是对头部和负载的签名，以保证令牌的完整性。签名用的算法是头部指定("alg")。JWT支持的签名（JWS-JSON Web Signature，相关规范为RFC7515）算法如下：

- HS256, HS384, HS512
- RS256, RS384, RS512
- ES256, ES384, ES512
- EdDSA(Ed25519 and Ed448 signatures)

### JWT使用演示

用手工生成使用JWT的一个过程。实例中的头部为：

```java
{
  "typ": "JWT",
  "alg": "HS256",
}
```

负载为：

```java
{
  "iss": "App System",
  "sub": "App-API-Gatewa",
  非标准字段
  "extra": "test"
}
```

步骤如下：

**1、** 分别对头部和负载进行Base64URL编码；

```java
# echo -n '{"typ":"JWT","alg":"HS256"}' | base64 | tr '+/' '-_' | tr -d '='
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9
# echo -n '{"iss":"App System","sub":"App-API-Gatewa","extra":"test"}' | base64 | tr '+/' '-_' | tr -d '='
eyJpc3MiOiJBcHAgU3lzdGVtIiwic3ViIjoiQXBwLUFQSS1HYXRld2EiLCJleHRyYSI6InRlc3QifQ
```

**2、** 签名；

```java
# HEADER_PAYLOAD=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJBcHAgU3lzdGVtIiwic3ViIjoiQXBwLUFQSS1HYXRld2EiLCJleHRyYSI6InRlc3QifQ
# echo -n $HEADER_PAYLOAD | openssl dgst -binary -sha256 -hmac fantasticjwt | base64 | tr '+/' '-_' | tr -d '='
f65pTyWLg2dj77Gj3eKp3eU8tf3H-z7tiSHwD5u-3iI
```

**3、** 形成jwt串并发给客户端；

```java
jwt_str=${HEADER_PAYLOAD}.f65pTyWLg2dj77Gj3eKp3eU8tf3H-z7tiSHwD5u-3iI
```

**4、** 客户端发送到服务器；

```java
curl -H "Authorization: Bearer ${jwt_str}" http://localhost/api/apply
```

curl 命令将 JWT 以 Bearer Token 的形式发送给服务器。根据 JWT 标准，URL使用JWT默认头字段为"Authentication"。

至此模拟了jwt如何生成并使用，可初步感受到JWT用处。

### JWT特点

**1、** JWT默认是不加密，但也是可以加密的生成原始Token以后，可以用密钥再加密一次；

**2、** JWT不加密的情况下，不建议将敏感数据写入JWT；

**3、** JWT不仅可以用于认证，也可以用于交换信息有效使用JWT，可以降低服务器查询数据库的次数；

**4、** JWT的最大缺点是，由于服务器不保存session状态，因此无法在使用过程中废止某个token，或者更改token的权限也就是说，一旦JWT签发了，在到期之前就会始终有效，除非服务器部署额外的逻辑；

**5、** JWT本身包含了认证信息，一旦泄露，任何人都可以获得该令牌的所有权限为了减少盗用，JWT的有效期应该设置得比较短对于一些比较重要的权限，使用时应该再次对用户进行认证；

**6、** 为了减少盗用，JWT不应该使用HTTP协议明文传输，要使用HTTPS协议传输；

## Nginx用JWT身份验证

### API认证

当我们系统同第三方系统对接时，对方系统访问我们系统通常需要身份认证识别，一般解决方案如下：

**1、** 为对方分配应用号+key，以及签名方法；

**2、** 对方编程访问验证接口，返回通讯token；

**3、** 后续对方每次访问带token，我们系统验证token合法性；

JWT就比较好的能解决这个问题，用Nginx plus作为API访问网关，负责对调用API的第三方进行身份验证，业务API可以不关注身份识别问题，也不对外部提供直接访问，而是通过Nginx plus验证合格后才能访问。系统访问示意如下：

具体实现步骤如下：

**1、** 生成外部系统JWT（可以程序或手工），负载中增加字段”appid"，代表每个外部系统；

**2、** 发送JWT给外部系统的第三方，第三方开发规范要求是在访问系统API时，必须在头部增加字段：Authentication，值为JWT；

**3、** 外部系统发起访问API，Nginx进行JWT验证，合法就反向代理到内部系统API服务；

Nginx做配置如下：

```java
# 所有外部可访问API都是"/api/"开始的
location /api/ {
    开启JWT验证，默认从Authentication头字段取JWT
    auth_jwt "api"; 
    JWT类型
    auth_jwt_type     encrypted;
    验证需要的密钥文件
    auth_jwt_key_file conf/keys.jwk;
    反向代理到真实api
    从jwt中取出appid，api按此识别不同第三方系统
    proxy_set_header "appid" $jwt_claim_appid
    proxy_pass http://api_server;
}
```

### 指令与内置变量

#### auth_jwt

格式：auth_jwt string [token=$variable] | off; 默认：auth_jwt off;

启用JWT验证。

string：设置验证领域，出错时会返回。参数值可以包含变量。

token：指定一个包含JWT变量。默认情况下，JWT作为承载令牌在“Authorization”标头中传递。JWT也可以作为cookie或查询字符串的一部分传递：

```java
# 从cookie中的auth_token取jwt
auth_jwt "valid access" token=$cookie_auth_token;
# 从查询参数的apijwt取jwt
auth_jwt "valid access" token=$arg_apijwt;
```

off：取消从以前的配置级别继承的auth_jwt指令的效果。

#### auth_jwt_key_file

格式：auth_jwt_key_file file;

指定JWK格式(RFC7516)的文件，用于验证JWT签名。文件后缀可以是".jwk"或".json"，但内容需要符合规范。可以指定多个文件，例如：

```java
auth_jwt_key_file conf/keys.json;
auth_jwt_key_file conf/key.jwk;
```

#### auth_jwt_key_request

格式：auth_jwt_key_request uri;

从子请求中uri检索JWK文件以验证JWT签名。参数值可以包含变量。为了避免验证开销，建议缓存密钥文件，示例如下：

```java
proxy_cache_path /data/nginx/cache levels=1 keys_zone=foo:10m;
server {
    ...
    location / {
        auth_jwt             "closed site";
        auth_jwt_key_request /jwks_uri;
    }
    location = /jwks_uri {
        internal;
        缓存（后续可自动从缓存获取）
        proxy_cache foo;
        proxy_pass  http://idp.example.com/keys;
    }
}
```

可以来自多个子请求，如：

```java
auth_jwt_key_request /jwks_uri;
auth_jwt_key_request /jwks2_uri;
```

#### auth_jwt_type

格式：auth_jwt_type signed | encrypted | nested; 默认：auth_jwt_type signed;

JWT类型，有三种：signed-只是签名；encrypted-只加密； nested-先签名再加密

#### auth_jwt_header_set

格式：auth_jwt_header_set $variable name ...;

设置JWT头部变量值。$variable 为对应key

#### auth_jwt_claim_set

格式：auth_jwt_claim_set $variable name ...;

设置JWT负载部变量值。$variable 为对应key

#### 内部变量-$jwt_header_name

返回JWT头部字段值，name是头部字段key，使用时用实际key名代替name

#### 内部变量-$jwt_claim_name

返回JWT负载部字段值，name是负载字段key，使用时用实际key名代替name

#### 内部变量-$jwt_payload

对于nested类型JWT，返回封闭的JWS Token。对于encrypted类型JWT，返回带有负载的JSON。

### JWK 文件

Nginx plus对JWT要进行加密（JWE-JSON Web Encryption ，规范RFC7516），加密时在JWT头部增加”enc“字段，说明是哪种加密算法，支持的加密算法有：

- A128CBC-HS256, A192CBC-HS384, A256CBC-HS512
- A128GCM, A192GCM, A256GCM

加密必然涉及密钥，NGINX Plus 使用 RFC 标准中指定的 JWK （JSON Web Key）格式。该标准允许在 JWK 文件中包含一个关键对象数组。密钥文件示例如下：

```java
{"keys":[
    {
        密码类型
        "kty":"oct",
        密钥顺序号
        "kid":"0001",
         密码（base64URL编码）
        "k":"OctetSequenceKeyValue"
    },
    {
        "kty":"EC",
        "kid":"0002"
        "crv":"P-256",
        "x": "XCoordinateValue",
        "y": "YCoordinateValue",
        "d": "PrivateExponent",
        "use": "sig"
    },
    {
        "kty":"RSA",
        "kid":"0003"
        "n": "Modulus",
        "e": "Exponent",
        "d": "PrivateExponent"
    }
]}
```

其中”kty"是密钥类型。该文件显示了三种密钥类型：Octet Sequence （oct）、EllipticCurve（EC）和 RSA 类型。kid 属性是密钥 ID。其它属性可查[RFC7517规范文件](https://datatracker.ietf.org/doc/html/rfc7517#page-5)。

密钥文件是敏感数据，应注意安全保护。

### 注销 JWT

JWT一个缺点就是由于服务器不保存 session 状态，因此无法在使用过程中废止某个 token，或者更改 token 的权限。Nginx plus通过将 API 客户端的 JWT 标记为无效来拒绝该客户端访问，直到 JWT 到期为止（到期时间在 `exp` 声明中表示），此时该 JWT 的 `map` 条目可以被安全删除。示例如下：

```java
# 负载部sub值为"quotes"、"test"标记为"revoked"
map $jwt_claim_sub $jwt_status {
    "quotes" "revoked";
    "test"   "revoked";
    default  "";
}
server {
    listen 80;
    location /products/ {
        auth_jwt "Products API";
        auth_jwt_key_file conf/api_secret.jwk;
        标记为"revoked"的请求拒绝访问
        if ( $jwt_status = "revoked" ) {
            return 403;
        }
        proxy_pass http://api_server;
    }
}
```

### JWT其它用途

JWT验证完成后，NGINX Plus 可以访问标头和有效负载中作为变量的所有字段。这些可以通过将 `$jwt_header_` 或 `$jwt_claim_` 前缀添加到所需字段（例如 for the `sub` 声明的 `$jwt_claim_sub`）来访问。这意味着可以非常轻松地将 JWT 内包含的信息代理到 API 端点，而不需要在 API 本身中实现 JWT 处理。

以下配置示例灵活运用JWT：

```java
log_format jwt '$remote_addr - $remote_user [$time_local] "$request" '
               '$status $body_bytes_sent "$http_referer" "$http_user_agent" '
               '$jwt_header_alg $jwt_claim_sub'; 用到jwt变量
# 用$jwt_claim_sub作为key定义限制请求缓存区
limit_req_zone $jwt_claim_sub zone=10rps_per_client:1m rate=10r/s;
server {
    listen 80;
    location /API/ {
        auth_jwt "Products API";
        auth_jwt_key_file conf/api_secret.jwk;
        限制请求数
        limit_req zone=10rps_per_client;
        proxy_pass http://api_server;
        传参给API
        proxy_set_header API-Client $jwt_claim_sub;
        记录日志
        access_log /var/log/nginx/access_jwt.log jwt;
    }
}
```

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
