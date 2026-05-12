# 19、Nginx 实战：HTTPS协议介绍
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/19.html
- 分类：服务器框架
- 分组：教程目录
## 一、HTTPS协议概述

为什么需要使用HTTPS，因为HTTP不安全，当我们使用http网站时，会遭到劫持和篡改，如果采用https协议，那么数据在传输过程中是加密的，所以黑客无法窃取或者篡改数据报文信息，同时也避免网站传输时信息泄露。

那么我们在实现https时，需要了解ssl协议，但我们现在使用的更多的是TLS加密协议。

那么TLS是怎么保证明文消息被加密的呢？在OSI七层模型中，应用层是http协议，那么在应用层协议之下，我们的表示层，是ssl协议所发挥作用的一层，他通过（握手、交换秘钥、告警、加密）等方式，是应用层http协议没有感知的情况下做到了数据的安全加密

## 二、HTTPS协议特点

1.内容加密：采用混合加密技术，中间者无法直接查看明文内容

结合非对称加密和对称加密技术。客户端使用对称加密生成密钥对传输数据进行加密，然后使用非对称加密的公钥再对秘钥进行加密，所以网络上传输的数据是被秘钥加密的密文和用公钥加密后的秘密秘钥，因此即使被黑客截取，由于没有私钥，无法获取到加密明文的秘钥，便无法获取到明文数据。

2.验证身份：通过证书认证客户端访问的是自己的服务器

通过单向hash函数对原文进行哈希，将需加密的明文“摘要”成一串固定长度(如128bit)的密文，不同的明文摘要成的密文其结果总是不相同，同样的明文其摘要必定一致，并且即使知道了摘要也不能反推出明文。

3.保护数据完整性：防止传输的内容被中间人冒充或者篡改

数字签名建立在公钥加密体制基础上，是公钥加密技术的另一类应用。它把公钥加密技术和数字摘要结合起来，形成了实用的数字签名技术。

## 三、模拟网站篡改

```java
1.配置一个网站
[root@web01 /code]# vim /etc/nginx/conf.d/linux.jiechi.com.conf
server {
    listen 80;
    server_name linux.jiechi.com;
    charset utf-8;
    location / {
        root /code/jc;
        index index.html;
    }
} 
2.写一个网站页面
[root@web01 /code]# mkdir /code/jc
[root@web01 /code]# cat /code/jc/index.html 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>我是title</title>
</head>
<body>
<article>
  <header>
    <h1>我是qiudao</h1>
    <p>创建时间：<time pubdate="pubdate">2018/8/10</time></p>
  </header>
  <p>
    <b>Aticle</b>第一次用h5写文章,好他*的紧张...
  </p>
  <footer>
    <p><small>版权所有！</small></p>
  </footer>
</article>
</body>
</html>
3.重启nginx访问
[root@web01 /code]# systemctl restart nginx
#配置hosts
10.0.0.7 linux.jiechi.com
4.配置劫持网站的站点文件
[root@lb01 ~]# vim /etc/nginx/conf.d/linux.jiechi.com.conf
server {
    listen 80;
    server_name linux.jiechi.com;
    charset utf-8;
    location / {
    	#劫持
        proxy_pass http://10.0.0.7;
        include proxy_params;
       篡改
        sub_filter '<title>我是title</title>' '<title>我不是个东西</title>';
        sub_filter '<b>qiudao</b>第一次用h5写文章,好他*的紧张...' '<img src="https://blog.driverzeng.com/zenglaoshi/xingganheguan.gif">';
    }
}
5.配置hosts访问
[root@lb01 /code]# systemctl restart nginx
#配置hosts
#10.0.0.7 linux.jiechi.com
10.0.0.4 linux.jiechi.com
```

## 四、HTTPS证书下发流程

```java
我们首先需要申请证书，先去登记机构进行身份登记，我是谁，我是干嘛的，我想做什么，然后登记机构再通过CSR发给CA，CA中心通过后会生成一堆公钥和私钥，公钥会在CA证书链中保存，公钥和私钥证书我们拿到后，会将其部署在WEB服务器上
1.当浏览器访问我们的https站点时，他会去请求我们的证书
2.Nginx这样的web服务器会将我们的公钥证书发给浏览器
3.浏览器会去验证我们的证书是否合法有效
4.CA机构会将过期的证书放置在CRL服务器，CRL服务的验证效率是非常差的，所以CA有推出了OCSP响应程序，OCSP响应程序可以查询指定的一个证书是否过去，所以浏览器可以直接查询OSCP响应程序，但OSCP响应程序性能还不是很高
5.Nginx会有一个OCSP的开关，当我们开启后，Nginx会主动上OCSP上查询，这样大量的客户端直接从Nginx获取证书是否有效
```

```java
#不用记
1、浏览器发起往服务器的443端口发起请求，请求携带了浏览器支持的加密算法和哈希算法。 
2、服务器收到请求，选择浏览器支持的加密算法和哈希算法。 
3、服务器下将数字证书返回给浏览器，这里的数字证书可以是向某个可靠机构申请的，也可以是自制的。 
4、浏览器进入数字证书认证环节，这一部分是浏览器内置的TLS完成的：
 	4.1 首先浏览器会从内置的证书列表中索引，找到服务器下发证书对应的机构，如果没有找到，此时就会提示用户该证书是不是由权威机构颁发，是不可信任的。如果查到了对应的机构，则取出该机构颁发的公钥。 
 	4.2 用机构的证书公钥解密得到证书的内容和证书签名，内容包括网站的网址、网站的公钥、证书的有效期等。浏览器会先验证证书签名的合法性（验证过程类似上面Bob和Susan的通信）。签名通过后，浏览器验证证书记录的网址是否和当前网址是一致的，不一致会提示用户。如果网址一致会检查证书有效期，证书过期了也会提示用户。这些都通过认证时，浏览器就可以安全使用证书中的网站公钥了。 
 	4.3 浏览器生成一个随机数R，并使用网站公钥对R进行加密。
5、浏览器将加密的R传送给服务器。 
6、服务器用自己的私钥解密得到R。 
7、服务器以R为密钥使用了对称加密算法加密网页内容并传输给浏览器。
8、浏览器以R为密钥使用之前约定好的解密算法获取网页内容。
```

## 五、HTTPS证书类型介绍

对比
域名型 DV
企业型 OV
增强型 EV

绿色地址栏

一般用途
个人站点和应用； 简单的https加密需求
电子商务站点和应用； 中小型企业站点
大型金融平台； 大型企业和政府机构站点

审核内容
域名所有权验证
全面的企业身份验证； 域名所有权验证
最高等级的企业身份验证； 域名所有权验证

颁发时长
10分钟-24小时
3-5个工作日
5-7个工作日

单次申请年限
1年
1-2年
1-2年

赔付保障金
——
125-175万美金
150-175万美金

## 六、HTTPS证书购买选择

```java
1.单个域名       www.mumusir.com
2.保护多个域名      www.   class.   test.   cdn.   all.
3.通配符域名
```

## 七、HTTPS证书注意选项

```java
1.https证书不支持续费，证书到期需要重新申请并进行替换
2.https不支持三级域名解析，如 test.mall.mumsir.com
3.https显示绿色，说明整个网站的url都是https的
4.https显示黄色，因为网站代码中包含http的不安全链接
5.https显示红色，那么证书是假的或者证书过期。
```

## 八、单台机器配置HTTPS

### 1.检查nginx

```java
[root@web01 /code]# nginx -v
nginx version: nginx/1.18.0
[root@web01 /code]# nginx -V
--with-http_ssl_module
```

### 2.创建存放证书的目录

```java
[root@web01 /code]# mkdir /etc/nginx/ssl_key
[root@web01 /code]# cd /etc/nginx/ssl_key/
```

### 3.生成证书

```java
#使用openssl命令充当CA权威机构创建证书（生产不使用此方式生成证书，不被互联网认可的黑户证书）
[root@web01 /etc/nginx/ssl_key]# openssl genrsa -idea -out server.key 2048
Generating RSA private key, 2048 bit long modulus
....+++
..................................................+++
e is 65537 (0x10001)
Enter pass phrase for server.key: 123456
Verifying - Enter pass phrase for server.key: 123456
#生成自签证书，同时去掉私钥的密码
[root@web03 ssl_key]# openssl req -days 36500 -x509 -sha256 -nodes -newkey rsa:2048 -keyout server.key -out server.crt
Generating a 2048 bit RSA private key
..................................................................................................+++
...................................................................................................+++
writing new private key to 'server.key'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [XX]:zhongguo
string is too long, it needs to be less than  2 bytes long
Country Name (2 letter code) [XX]:CN   
State or Province Name (full name) []:meiguo
Locality Name (eg, city) [Default City]:riben
Organization Name (eg, company) [Default Company Ltd]:heiyiren
Organizational Unit Name (eg, section) []:heiyiren
Common Name (eg, your name or your server's hostname) []:kenan
Email Address []:123@qq.com
# req  --> 用于创建新的证书
# new  --> 表示创建的是新证书    
# x509 --> 表示定义证书的格式为标准格式
# key  --> 表示调用的私钥文件信息
# out  --> 表示输出证书文件信息
# days --> 表示证书的有效期
#证书生成后两个文件
[root@web01 /etc/nginx/ssl_key]# ll
total 8
-rw-r--r-- 1 root root 1387 Sep  4 11:30 server.crt
-rw-r--r-- 1 root root 1704 Sep  4 11:30 server.key
```

### 4.证书配置语法

```java
#开启ssl认证
Syntax:	ssl on | off;
Default:	ssl off;
Context:	http, server
#指定证书文件
Syntax:	ssl_certificate file;
Default:	—
Context:	http, server
#指定私钥文件
Syntax:	ssl_certificate_key file;
Default:	—
Context:	http, server
```

### 5.配置nginx证书

```java
[root@web01 ~]# vim /etc/nginx/conf.d/linux.ssl.com.conf
server {
    listen 443 ssl;
    server_name linux.ssl.com;
    ssl_certificate /etc/nginx/ssl_key/server.crt;
    ssl_certificate_key /etc/nginx/ssl_key/server.key;
    location / {
        root /code/ssl;
        index index.html;
    }
}
```

### 6.重启访问

```java
[root@web01 ~]# systemctl restart nginx
#配置hosts
10.0.0.7 linux.ssl.com
```

### 7.http自动转化为HTTPS

```java
[root@web01 ~]# vim /etc/nginx/conf.d/linux.ssl.com.conf
server {
    listen 443 ssl;
    server_name linux.ssl.com;
    ssl_certificate /etc/nginx/ssl_key/server.crt;
    ssl_certificate_key /etc/nginx/ssl_key/server.key;
    location / {
        root /code/ssl;
        index index.html;
    }
}
server {
    listen 80;
    server_name linux.ssl.com;
    rewrite (.*) https://linux.ssl.com$1;
   return 302 https://$server_name$request_uri;
}
```
