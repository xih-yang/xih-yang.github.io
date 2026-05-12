# 14、Nginx 精通 - HTTPS优化配置及典型问题
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/14.html
- 分类：服务器框架
- 分组：教程目录
HTTPS是在 HTTP 协议的基础上使用 TLS/SSL 加密，其主要目标是提高数据传输的安全性。从HTTP2.0开始，HTTPS已经是网站的标准协议，很多开放平台非HTTPS不能访问。Nginx为HTTPS提供了强大的支持，且对应用服务器是完全透明的。

**目录**

SSL/TLS基础

发展历史

TLS握手过程

加密套件

TLSv1.2及之前

TLSv1.3

SSL证书

SSL证书链

Nginx SSL配置

标准配置

优化配置

同时支持HTTP/HTTPS

HTTP强制转HTTPS

单证书多域名

HTTP 严格传输安全协议

经典问题

单IP多证书支持

解决方式一

解决方式二

浏览器质疑知名证书

安全漏洞问题

HTTPS指令

ssl_certificate

ssl_certificate_key

ssl_ciphers

ssl_session_cache

ssl_session_timeout

ssl_session_ticket

ssl_session_ticket_key

## SSL/TLS基础

SSL/TLS是一种密码通信框架，他是世界上使用最广泛的密码通信方法。SSL(Secure Socket Layer)安全套接层，是1994年由Netscape公司设计的一套协议，并与1995年发布了3.0版本。TLS(Transport Layer Security)传输层安全是IETF在SSL3.0基础上设计的协议，实际上相当于SSL的后续版本。虽然SSL一词仍然占主导地位，但现在谈论SSL时实际上指的是TLS，因为SSL的公共版本早已被弃用。

### 发展历史

注意：TLSv1.1在2020年已放弃使用了。当前主流使用TLSv1.2和TLSv1.3。

**TLSv1.2主要特点**：

- 引入更安全的加密算法。
- 提高了性能，减少了握手时间。

**TLSv1.3主要特点**：

- 删除不安全密码算法和密码套件
- 引入更多先进的加密算法。
- 大幅简化握手过程，降低延迟。
- 提供更好的前向保密性。
- 密码套件的概念改变

### TLS握手过程

**1、** client_hello：客户端发起请求，以明文传输请求信息，包含信息如下：；

- 版本信息：客户端可支持最高TLS版本
- 加密套件候选列表：可用的加密套件
- 压缩算法候选列表：用于后续的信息压缩传输
- 随机数 random_C，用于后续的密钥的生成;
- 扩展字段 extensions，支持协议与算法的相关参数以及其它辅助信息等。

**2、** server_hello：服务端返回协商的信息结果，包括：；

- 选择使用的协议版本 version
- 选择的加密套件 cipher suite
- 选择的压缩算法 compression method
- 随机数 random_S 等，其中随机数用于后续的密钥协商
- 扩展字段 extensions
- server_certificates： 服务器端配置证书(链)，用于身份验证与密钥交换
- server_hello_done：通知客户端 server_hello 信息发送结束

**3、** 证书校验：客户端验证证书的合法性，如果验证通过才会进行后续通信，否则根据错误情况不同做出提示和操作，合法性验证包括如下：证书(链)的可信性、证书是否吊销、是否有效期内、证书域名是否与当前的访问域名匹配等;；

证书校验通过后，顺序做如下处理：

- 生成客户端key（随机数字）
- 根据random_C 和 random_S 与客户端key计算得到通信密钥（客户端和服务器后续的通信都采用通信密钥和协商的加密算法进行加密）
- 结合之前所有通信参数的 hash 值与其它相关信息生成一段数据，采用通信密钥和协商的算法进行加密，然后发送给服务器用于数据与握手验证（成为”加密握手验证信息“）。

**4、** 客户端发送加密通信信息及验证信息给服务器端：加密通信信息包括客户端key、通信密钥、协商的加密算法等，验证信息是加密握手验证信息；

**5、** 服务器验证：；

- 服务器用私钥解密加密的客户端key，基于之前交换的两个明文随机数 random_C 和 random_S，计算得到通信密钥;
- 验证通信密钥正确性;
- 计算之前所有接收信息的 hash 值，然后解密客户端发送的加密握手验证信息
- 验证加密握手验证信息正确性;
- 服务器也结合所有当前的通信参数信息生成一段数据并采用通讯密钥与协商算法加密

**6、** 服务器发送通信密钥、协商的加密算法和加密验证信息到客户端；

**7、** 客户端验证：采用协商密钥解密加密验证信息，验证服务器发送的数据和密钥，验证通过则握手完成;；

至此，客户端就可以开始使用协商密钥与算法进行加密通信。

### 加密套件

加密套件是TLS中的一个概念，用作描述加密算法的结构，以便客户端和服务器协商算法（即决定使用哪些算法来保护它们的连接）。

加密套件结构TLS 1.3做出较大调整，因此分开说明。

#### TLSv1.2及之前

加密套件名称格式如下：

从图可看出，加密套件由多个部分构成，各部分用"_"相连。从左到右一次说明如下：

TLS：固定头。在Nginx配置中一般省略。

密钥交换算法：用于客户端与服务器之间握手时用的加密算法。常见的有DH、DHE、ECDHE等，目前支持前向加密的只有ECDHE和DHE算法，很多安全扫描里面提到的不支持AEAD就是在指这个部分。

身份验证算法：验证ssl证书的算法。

WITH：固定部分。在Nginx配置中一般省略。

通讯加密算法：对应用传输信息加密的算法，包括算法、密码长度和模式。

消息摘要算法：用于创建消息摘要的算法。

#### TLSv1.3

密码套件仅包含通讯加密算法和摘要算法，密钥交换算法和身份验证算法需另外配置。以下是 TLS v1.3 中使用的新密码套件集合：

- TLS_AES_256_GCM_SHA384（默认启用）
- TLS_CHACHA20_POLY1305_SHA256（默认启用）
- TLS_AES_128_GCM_SHA256（默认启用）
- TLS_AES_128_CCM_8_SHA256
- TLS_AES_128_CCM_SHA256

加密套件在Nginx中配置指令是ssl_ciphers。

### SSL证书

SSL数字证书凭借高强度签名算法，结合服务器端的加密协议，完成Web访问客户到服务器间的https加密传输，使网站可信，防劫持、防篡改、防监听。为网站访问者提供真实、有效、安全的网站内容。

SSL证书由权威认证中心（通常简称为"CA"）颁发。

### SSL证书链

SSL证书链的顶层是根证书颁发机构（Root Certificate Authority），它可以签署自身证书与签署中间CA（Intermediate Certificate Authority）证书。而该中间CA又可以签署其子节点CA证书，或者他们可以直接签署最终实体证书（即叶子证书）。如此，确保每个证书都引用了其上一节点的证书，可以追溯到根节点的证书，例如我们使用叶子节点的公钥解密（验证）叶子节点证书签名后，可以获得上一节点的签名，直至根节点。

当前客户端操作系统和浏览器中通常存储了受信任的根证书颁发机构的证书列表，因此操作系统和浏览器就可以轻松地验证所有证书的真实性。

## Nginx SSL配置

### 标准配置

下面是一个标准的SSL配置：

```java
server {
    443是https标准端口；ssl参数表示启用ssl配置
    listen              443 ssl;
    server_name         www.example.com;
    服务器SSL证书
    ssl_certificate     www.example.com.crt;
    服务器SSL私钥，应保证其安全
    ssl_certificate_key www.example.com.key;
    Nginx默认支持ssl/TLS版本 （用默认配置可以不配置）
    ssl_protocols       TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    Nginx采用的默认算法 （用默认配置可以不配置）
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ...
}
```

补充说明：

**1、** 服务器证书（www.example.com.crt）是一个公共实体，它会发送到连接到服务器的每个客户端；

**2、** 私钥（www.example.com.key）是一个安全的实体，应该存储在一个限制访问的文件中，但它必须是nginx的主进程可读的证书和密钥可以存储在一个文件中，但只有证书被发送到客户端；

```java
    证书和私钥在同一个文件
    ssl_certificate     www.example.com.cert;
    ssl_certificate_key www.example.com.cert;
```

### 优化配置

SSL操作会消耗额外的CPU资源，从测试来看https性能相对于http的性能会呈指数下降。在多处理器系统上，应该运行几个工作进程，不少于可用CPU内核的数量。最耗费CPU的操作是SSL握手。有两种方法可以最大限度地减少每个客户端的这些操作数量：

第一种方法是启用保活连接，通过一个连接发送多个请求；

第二种方法是重用SSL会话参数，以避免并行和后续连接的SSL握手。TLS 协议有两类会话缓存机制：会话标识 session ID 与会话记录 session ticket。session ID 由服务器端支持，协议中的标准字段，因此基本所有服务器都支持，服务器端保存会话ID以及协商的通信信息;session ticket需要服务器和客户端都支持，属于一个扩展字段，将协商的通信信息加密之后发送给客户端保存，密钥只有服务器知道，占用服务器资源很少。二者却别主要是保存协商信息的位置与方式不同。如果确认支持session_ticket，优先考虑session_ticket缓存机制（用ssl_session_ticket指令打开）。session ID存储在工作进程之间共享的SSL会话缓存中，并由SSL_session_cache指令进行配置。1M字节的缓存包含大约4000个会话。默认缓存超时为5分钟。可以使用ssl_session_timeout指令来增加它。

以下是针对具有10兆字节共享session ID缓存的多核系统优化的配置示例：

```java
# 尽量利用CPU
worker_processes auto;
http {
    定义ssl会话参数缓存，以便共享使用
    ssl_session_cache   shared:SSL:10m;
    缓存时间10分钟 （默认是5分钟）
    ssl_session_timeout 10m;
    server {
        listen              443 ssl;
        server_name         www.example.com;
        每次连接保活70秒
        keepalive_timeout   70;
        ssl_certificate     www.example.com.crt;
        ssl_certificate_key www.example.com.key;
        ssl_protocols       TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ...
    }
    ...
}
```

### 同时支持HTTP/HTTPS

一个服务器可以同时支持HTTP和HTTPS，配置如下：

```java
server {
    listen              80;
    listen              443 ssl;
    server_name         www.example.com;
    ssl_certificate     www.example.com.crt;
    ssl_certificate_key www.example.com.key;
    ...
}
```

### HTTP强制转HTTPS

客户端以HTTP访问服务器，强制转HTTPS，配置如下：

```java
server {
    ipv4
    listen 80 default_server;
    ipv6
    listen [::]:80 default_server; 
    server_name www.example.com;
    强制转https
    return 301 https://$host$request_uri;
}
```

### 单证书多域名

一个证书可提供多个域名使用(前提条件：证书本身必须是支持多域名的)。

```java
http{
    在http配置证书和私钥，多个服务器共用
    ssl_certificate     common.crt;
    ssl_certificate_key common.key;
    server {
        listen          443 ssl;
        server_name     www.example.com;
        ...
    }
    server {
        listen          443 ssl;
        server_name     www.example.org;
        ...
    }
}
```

### HTTP 严格传输安全协议

对于某些应用来说，一个 HTTP 请求遭到中间人攻击就可能会摧毁整个公司。如果一个包含敏感信息的表单通过 HTTP 发送，势必会造成损害，就算是通过 NGINX 进行HTTPS 重定向也于事无补。可设置 Strict-Transport-Security 请求头，使用 HTTP 严格传输安全协议（HSTS）增强。

```java
# 将 Strict-Transport-Security 请求头的使用时间设置为最长一年。所有请求都将通过 HTTPS 发出。
add_header Strict-Transport-Security max-age=31536000;
```

## 经典问题

### 单IP多证书支持

先看如下示例：

```java
server {
    listen          443 ssl;
    server_name     www.example.com;
    ssl_certificate www.example.com.crt;
    ...
}
server {
    listen          443 ssl;
    server_name     www.example.org;
    ssl_certificate www.example.org.crt;
    ...
}
```

示例配置的意思是www.example.com和www.example.org使用各自的证书，但实际情况可能是无论请求的服务器名称如何，浏览器都只会接收默认服务器（第一个server）的证书，即www.example.com.crt。这是由SSL协议行为引起的。SSL连接是在浏览器发送HTTP请求之前建立的，nginx不知道请求的服务器的名称。因此，它可能只提供默认服务器的证书。

#### 解决方式一

服务器配置多网卡，基于网卡IP进行监听区分开来，示例：

```java
server {
    网卡1，内网地址为：192.168.1.1
    listen          192.168.1.1:443 ssl;
    server_name     www.example.com;
    ssl_certificate www.example.com.crt;
    ...
}
server {
    网卡2，内网地址为：192.168.1.2
    listen          192.168.1.2:443 ssl;
    server_name     www.example.org;
    ssl_certificate www.example.org.crt;
    ...
}
```

#### 解决方式二

采用SNI（TLS Server Name Indication extension，RFC 6066），它允许浏览器在SSL握手期间传递请求的服务器名称，因此，服务器将知道它应该使用哪个证书进行连接。

目前大多数现代浏览器都支持SNI，但一些旧的或特殊的客户端可能不会使用SNI。SNI中只能传递域名，但如果请求中包含文字IP地址，某些浏览器可能会错误地将服务器的IP地址作为其名称传递。

要使用SNI，Nginx和OpenSSL库都需支持。Nginx从TLS v1.2开始支持SNI，默认是开启的。OpenSSL库从0.9.8f版本开始支持SNI，在默认情况下处于启用状态。

nginx是否支持SNI，用下面命令查看：

```java
$ nginx -V
...
TLS SNI support enabled
...
```

如果启用了SNI的nginx，但OpenSSL库不支持SNI，nginx会显示警告：

```java
nginx was built with SNI support, however, now it is linked
dynamically to an OpenSSL library which has no tlsext support,
therefore SNI is not available
```

### 浏览器质疑知名证书

配置好SSL后，大多数浏览器应该会接受该证书而不会出现问题。但有一些浏览器可能会对知名证书颁发机构签名的证书提出质疑。这是因为颁发机构使用中间证书签署了服务器证书，而该中间证书不存在于随特定浏览器分发的知名可信证书颁发机构的证书库中。在这种情况下，该机构应该提供了一组与已签署的服务器证书连接的链接证书。我们把服务器证书和链接证书合在一起，如下：

```java
# www.example.com.crt-ssl证书 bundle.crt是链接证书，用cat合并
$ cat www.example.com.crt bundle.crt > www.example.com.chained.crt
```

在配置中直接把合并后文件当成证书使用即可。

如果服务器证书和捆绑包的连接顺序错误，nginx将无法启动，并显示错误消息：

```java
SSL_CTX_use_PrivateKey_file(" ... /www.example.com.key") failed
   (SSL: error:0B080074:x509 certificate routines:
    X509_check_private_key:key values mismatch)
```

为了确保服务器发送完整的证书链，可以使用openssl命令行实用程序查看，例如：

```java
$ openssl s_client -connect www.godaddy.com:443
...
Certificate chain
 0 s:/C=US/ST=Arizona/L=Scottsdale/1.3.6.1.4.1.311.60.2.1.3=US
     /1.3.6.1.4.1.311.60.2.1.2=AZ/O=GoDaddy.com, Inc
     /OU=MIS Department/CN=www.GoDaddy.com
     /serialNumber=0796928-7/2.5.4.15=V1.0, Clause 5.(b)
   i:/C=US/ST=Arizona/L=Scottsdale/O=GoDaddy.com, Inc.
     /OU=http://certificates.godaddy.com/repository
     /CN=Go Daddy Secure Certification Authority
     /serialNumber=07969287
 1 s:/C=US/ST=Arizona/L=Scottsdale/O=GoDaddy.com, Inc.
     /OU=http://certificates.godaddy.com/repository
     /CN=Go Daddy Secure Certification Authority
     /serialNumber=07969287
   i:/C=US/O=The Go Daddy Group, Inc.
     /OU=Go Daddy Class 2 Certification Authority
 2 s:/C=US/O=The Go Daddy Group, Inc.
     /OU=Go Daddy Class 2 Certification Authority
   i:/L=ValiCert Validation Network/O=ValiCert, Inc.
     /OU=ValiCert Class 2 Policy Validation Authority
     /CN=http://www.valicert.com//emailAddress=info@valicert.com
...
```

命令行输出解释如下：

证书链是最左边从上到下有0、1、2，代表0号证书（服务器证书）由1号证书颁发；1号证书由2号证书颁发，2号证书由“ValiCert, Inc”颁发。如果尚未添加链接证书，则只显示服务器证书0。

### 安全漏洞问题

用安全软件扫描，针对SSL常报如下警告（安全程度划分不同安全软件划分标准不一定一致）：

**启用 TLS 1.0**：中危。应对措施：禁用 TLS 1.0 并将其替换为 TLS 1.2 或更高版本。

**TLS/SSL Sweet32 攻击**：中危。应对措施：禁用对过时 64 位块密码的支持。

**TLS/SSL 弱密码套件**：中危。应对措施：避免使用弱密码套件。

**POODLE 攻击**（带有 CBC 密码套件的 SSLv3）：中危。应对措施：禁用 SSLv3 并将其替换为 TLS 1.2 或更高版本

通常使用TLS1.2或以上。

## HTTPS指令

仅列出常用指令。

### ssl_certificate

格式：ssl_certificate `file`;

为给定的服务器指定具有PEM格式证书的文件。如果除了主证书之外还应指定中间证书，则应在同一文件中按以下顺序指定这些证书：先指定主证书，然后指定中间证书。PEM格式的密钥可以被放置在相同的文件中。

自1.11.0版本以来，可以多次指定此指令来加载不同类型的证书，例如RSA和ECDSA：

```java
server {
    listen              443 ssl;
    server_name         example.com;
    ssl_certificate     example.com.rsa.crt;
    ssl_certificate_key example.com.rsa.key;
    ssl_certificate     example.com.ecdsa.crt;
    ssl_certificate_key example.com.ecdsa.key;
    ...
}
```

### ssl_certificate_key

格式：ssl_certificate_key `file`;

为给定的虚拟服务器指定具有PEM格式密钥的文件。

可以指定值engine:name:id，而不是文件，该文件从OpenSSL引擎名称加载具有指定id的密钥。

### ssl_ciphers

格式：ssl_ciphers ciphers;

默认：ssl_ciphers HIGH:!aNULL:!MD5;

以OpenSSL库所理解的格式指定启用的算法列表。

**1、** 算法列表格式：；

- 算法列表包含一个或多个":"隔开(","或空格亦可，但冒号最普遍）
- 完整算法套件
- 某一类算法套件，如":SHA1:"代表所有的算法套件中的摘要算法为SHA1
- 加特殊字符或字符串

**2、** 特殊字符或串：；

- +：表示多算法同时包含，如":SHA1+DES:"代表所有同时包含SHA1和DES的算法套件
- !：表示从算法列表中删除该算法，且删除了的算法将不会再出现。如":!MD5:"表示删除含MD5的算法
- -：表示从算法列表中删除该算法。但是可以通过后面的选项将一个或所有的算法可以被再次添加。
- DEFAULT：默认的算法列表。这个在编译的时候决定，OpenSSL1.0.0以上的版本默认的是”“ALL:!aNULL:!eNULL”。
- ALL：所有的算法套件但是不包括”eNULL“算法，因为eNULL算法必须被明确的激活。
- HIGH：高加密算法套件。目前意味着密钥长度值大于128位。
- MEDIUM：中加密算法套件。目前一些算法套件是128字节的加密。
- LOW：低加密算法套件。目前使用64位或56位密钥的加密算法，但是不包括export系列的算法套件。
- aNULL：算法套件中提供没有验证算法。当前它是一个匿名的DH算法。这些算法套件是易受到中间攻击的，于是不建议使用它。
- eNULL/NULL：“NULL”类型的算法，它表明不用进行任何加密操作。因为他们一直不提供加密如果要显示包含的数据则存在一些安全风险。
- TLSv1/SSLv3/SSLv2：TLS v1.0, SSL v3.0 or SSL v2.0算法套件。
- DH：算法套件使用DH算法，包括匿名的DH。
- ADH：匿名的DH算法套件。
- AES：算法套件使用AES算法。
- CAMELLIA：算法套件使用CAMELLIA算法。
- 3DES：算法套件使用3des算法。
- DES：算法套件使用des算法。
- RC4：算法套件使用rc4算法。
- RC2：算法套件使用rc2算法。
- IDEA：算法套件使用IDEA算法。
- SEED：算法套件使用SEED算法。
- MD5：算法套件使用MD5算法。
- SHA1/SHA：算法套件使用SHA算法。
- aGOST：算法套件使用GOST R 34.10 (either 2001 or 94)来执行验证操作（需要一个支持GOST算法的硬件引擎）。
- aGOST01：算法套件使用GOST R 34.10-2001来执行验证操作。
- aGOST94：算法套件使用GOST R 34.10-94来执行验证操作（注意R 34.10-94的标准已经过期了，建议使用GOST R 34.10-2001）。
- kGOST：用VKO 34.10来执行密钥交换操作。在RFC4357中指定。
- GOST94：算法套件，用基于GOST R 34.11-94的HMAC算法。
- GOST89MAC：算法套件，用GOST 28147-89摘要算法来代替HMAC。

ssl_protocols

格式：ssl_protocols [SSLv2] [SSLv3] [TLSv1] [TLSv1.1] [TLSv1.2] [TLSv1.3];

默认：ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;

开启的协议。

具体支持的协议同使用的OpenSSL库相关，对应关系如下：

`TLSv1.1` / `TLSv1.2：`OpenSSL 1.0.1或以上

`TLSv1.3：`OpenSSL 1.1.1或以上

如果可以，只启用TLSv1.2、TLSv1.3

### ssl_session_cache

格式：ssl_session_cache off | none | [builtin[:size]] [shared:name:size];

默认：ssl_session_cache none;

设置存储会话参数的缓存的类型和大小。缓存可以是以下任何类型：

off：会话缓存的使用是严格禁止的，nginx明确地告诉客户端会话不能被重用。

none：不允许使用会话缓存，nginx告诉客户端可以重用会话，但实际上并没有将会话参数存储在缓存中。

builtin：在OpenSSL中构建的缓存；仅由一个工作进程使用。缓存大小是在会话中指定的。如果未给定大小，则等于20480个会话。使用内置缓存可能会导致内存碎片。

shared：在所有工作进程之间共享的缓存。缓存大小以字节为单位指定；一兆字节可以存储大约4000个会话。每个共享缓存都应该有一个任意的名称。具有相同名称的缓存可以在多个虚拟服务器中使用。它还用于自动生成、存储和定期轮换TLS会话票证密钥，除非使用ssl_session_ticket_key指令进行了明确配置。

仅使用共享高速缓存而不使用内置高速缓存更有效。

### ssl_session_timeout

格式：ssl_session_timeout time;

默认：ssl_session_timeout 5m;

配置客户端可以重用会话参数的时间。默认5分钟。

### ssl_session_ticket

格式：ssl_session_ticket on|off ;

模式：ssl_session_ticket off ;

启用或停用session ticket缓存。

### ssl_session_ticket_key

格式：ssl_session_ticket_key file;

启用session ticket缓存机制下，配置用于加密和解密Tsession ticket的密钥文件。该文件必须包含80或48字节的随机数据。80字节文件使用AES256加密，48字节文件使用AES128进行加密。

默认情况下，SSL会话用的密钥是随机生成的。如果同一个密钥必须在多个服务器之间共享，则该指令是必要的。

密钥文件可用下述命令创建：

```java
openssl rand 80 > ticket.key
```

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
