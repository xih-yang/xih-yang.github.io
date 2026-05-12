# 09、SpringCloud Gateway 配置SSL证书提供Https访问方式
- 来源：https://ddkk.com/zhuanlan/gateway/springcloudgateway/1/25.html
- 分类：API网关
- 分组：SpringCloud Gateway
## 前言

根据**网络安全等级保护技术2.0**（简称“等保2.0”）的**第三级等保标准要求**：从云计算、物联网、工控系统、移动互联、大数据安全五个方面着手采用密码技术保证网络通信安全，确保通信过程中数据的完整性、保密性和抗抵赖性。基于现阶段网络环境及等保2.0合规要求，全网站采用SSL证书进行HTTPS安全加密将势在必行！

### HTTPS协议

#### 概述

**HTTPS协议** = HTTP协议 + SSL/TLS协议，在HTTPS数据传输的过程中，需要用SSL/TLS对数据进行加密和解密，需要用HTTP对加密后的数据进行传输，由此可以看出HTTPS是由HTTP和SSL/TLS一起合作完成的。

当用户通过HTTP协议访问网站时，客户端与服务器之间传输的数据，如账号、密码、在线交易记录等敏感信息都是明文的，这样就会存在诸如信息泄露、窃取、篡改等安全隐患。当部署SSL证书，将由HTTP升级到HTTPS协议进行访问网站，客户端与服务器之间建立起SSL加密通道，并给网站加上一把安全锁，从而防止敏感数据被窃听、泄露或篡改，保证网络数据传输的安全，确保通信数据的保密性和完整性。

HTTPS有如下特点：

- 内容加密：采用混合加密技术，中间者无法直接查看明文内容
- 验证身份：通过证书认证客户端访问的是自己的服务器
- 保护数据完整性：防止传输的内容被中间人冒充或者篡改

#### 通信过程

**1、** 客户端向服务器发起HTTPS请求，连接到服务器的443端口；

**2、** 服务器端有一个密钥对，即公钥和私钥，是用来进行非对称加密使用的，服务器端保存着私钥，不能将其泄露，公钥可以发送给任何人；

**3、** 服务器将自己的公钥发送给客户端；

**4、** 客户端收到服务器端的证书之后，会对证书进行检查，验证其合法性，如果发现发现证书有问题，那么HTTPS传输就无法继续如果公钥合格，那么客户端会生成一个随机值，这个随机值就是用于进行对称加密的密钥，我们将该密钥称之为clientkey，即客户端密钥，这样在概念上和服务器端的密钥容易进行区分然后用服务器的公钥对客户端密钥进行非对称加密，这样客户端密钥就变成密文了，至此，HTTPS中的第一次HTTP请求结束；

**5、** 客户端会发起HTTPS中的第二个HTTP请求，将加密之后的客户端密钥发送给服务器；

**6、** 服务器接收到客户端发来的密文之后，会用自己的私钥对其进行非对称解密，解密之后的明文就是客户端密钥，然后用客户端密钥对数据进行对称加密，这样数据就变成了密文；

**7、** 然后服务器将加密后的密文发送给客户端；

**8、** 客户端收到服务器发送来的密文，用客户端密钥对其进行对称解密，得到服务器发送的数据这样HTTPS中的第二个HTTP请求结束，整个HTTPS传输完成；

### SSL/TLS 证书

SSL证书是数字证书的一种，类似于驾驶证、护照和营业执照的电子副本。因为配置在服务器上，也称为SSL服务器证书。

SSL的全称是Secure Sockets Layer，即安全套接层协议，是为网络通信提供安全及数据完整性的一种安全协议。SSL协议在1994年被Netscape发明，后来各个浏览器均支持SSL，其最新的版本是3.0

TLS的全称是Transport Layer Security，即安全传输层协议，最新版本的TLS（Transport Layer Security，传输层安全协议）是IETF（Internet Engineering Task Force，Internet工程任务组）制定的一种新的协议，它建立在SSL 3.0协议规范之上，是SSL 3.0的后续版本。在TLS与SSL3.0之间存在着显著的差别，主要是它们所支持的加密算法不同，所以TLS与SSL3.0不能互操作。虽然TLS与SSL3.0在加密算法上不同，但是在我们理解HTTPS的过程中，我们可以把SSL和TLS看做是同一个协议。

HTTPS为了兼顾安全与效率，同时使用了对称加密和非对称加密。数据是被对称加密传输的，对称加密过程需要客户端的一个密钥，为了确保能把该密钥安全传输到服务器端，采用非对称加密对该密钥进行加密传输，总的来说，对数据进行对称加密，对称加密所要使用的密钥通过非对称加密传输。

### 如何申请SSL 证书

SSL证书由受信任的数字证书颁发机构CA，在验证服务器身份后颁发，具有服务器身份验证和数据传输加密功能。

阿里云、腾讯云、华为云都可以直接申请，但是看了下一年要4000多大洋。。。

### 使用keytool 生成ssl证书

keytool 是JDK自带的keytool证书工具，当然我们自己生成的不安全，所以浏览器会提示：

使用以下命令就可以生成一个证书：

```java
keytool -genkey -alias gateway -storetype PKCS12 -keyalg RSA -keysize 2048 -keystore scg-keystore.p12  -validity 3650
```

命令参数说明：

```java
-genkey 生成秘钥
-alias 别名
-keyalg 秘钥算法
-keysize 秘钥长度
-validity 有效期（天）
-keystore 生成秘钥库的存储路径和名称
-keypass 秘钥口令
-storepass 秘钥库口令
-dname 拥有者信息，CN：姓名；OU：组织单位名称；O：组织名称；L：省/市/自治区名称；C：国家/地区代码
```

执行后如下图：

按照提示，依次输入，就可以看到证书了：

## Spring Cloud Gateway配置SSL 证书

Spring Cloud Gateway 网关可以通过配置SSL 或者TLS 证书来侦听 HTTPS 上的请求。

首先将证书复制到resources目录下：

然后在yml中配置SSL 证书：

```bash
server:
  port: 443
  配置SSL 证书
  ssl:
    enabled: true
    证书位置
    key-store: classpath:scg-keystore.p12
    证书别名
    key-alias: gateway
    秘钥库类型
    key-store-type: PKCS12
    秘钥库口令（密码）
    key-store-password: 123123
```

测试：使用Https 方式访问以下路径，发现成功返回

```bash
https://localhost:8443/app-service001/app1/test
```

整个流程就是：https访问=》网关=》代理到http 后端

## 其他场景案例

### 场景1 后台服务也是Https

**1. 发现问题**

给集成到网关和注册中心中的后台服务，也设置为Https 访问，会正常执行吗？

首先给app-service001 也设置一个SSL证书：

通过网关去访问，发现Bad Request 异常。

**2. 分析原因**

问题原因：Spring Cloud Gateway 在去Nacos 中查询实例的时候，返回的isSecure 属性为false。

在重写协议的时候，会根据isSecure ，返回请求协议，这里是false，所以会使用http 去调用后台服务，所有就会报错。

**3. 解决方案**

在app-service001 服务中，添加Nacos 注册为Https 就可以了。

```bash
spring:
  cloud:
    nacos:
      server-addr: localhost:8848
      discovery:
        配置为Https 
        secure: true
```

然后还需要将网关配置为信任所有下游证书，否则证书还会报错。

```bash
spring:
  cloud:
    nacos:
      server-addr: localhost:8848
    gateway:
      discovery:
        locator:
          开启服务发现动态路由
          enabled: true
          是否将服务名称小写
          lower-case-service-id: true
      httpclient:
        ssl:
          信任所有下游证书
          useInsecureTrustManager: true
```

再次访问，就可以了
