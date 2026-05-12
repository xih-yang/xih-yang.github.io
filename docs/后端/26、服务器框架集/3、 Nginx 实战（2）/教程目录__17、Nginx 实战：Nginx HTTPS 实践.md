# 17、Nginx 实战：Nginx HTTPS 实践
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/17.html
- 分类：服务器框架
- 分组：教程目录
## 1.HTTPS安全证书基本概述

为什么需要使用HTTPS, 因为HTTP不安全。当我们使用http网站时，会遭到劫持和篡改，如果采用https协议，那么数据在传输过程中是加密的，所以黑客无法窃取或者篡改数据报文信息，同时也避免网站传输时信息泄露。

那么我们在实现https时，需要了解ssl协议，但我们现在使用的更多的是TLS加密协议。

那么TLS是怎么保证明文消息被加密的呢？在OSI七层模型中，应用层是http协议，那么在应用层协议之下，我们的表示层，是ssl协议所发挥作用的一层，它通过（握手、交换秘钥、告警、加密）等方式，使应用层http协议没有感知的情况下做到了数据的安全加密

那么在数据进行加密与解密过程中，如何确定双方的身份，此时就需要有一个权威机构来验证双方省份。那么这个权威机构则是CA机构。那CA机构又是如何颁发证书

我们首先需要申请证书，需要进行登记，登记我是谁，我是什么组织，我想做什么，到了登记机构在通过CSR发给CA，CA中心通过后，CA中心会生成一对公钥和私钥，那么公钥会在CA证书链中保存，公钥和私钥证书订阅人拿到后，会将其部署在WEB服务器上

- 1.当浏览器访问我们的https站点时，它会去请求我们的证书
- 2.Nginx这样的web服务器会将我们的公钥证书发给浏览器
- 3.浏览器会去验证我们的证书是否是合法和有效的。
- 4.CA机构会将过期的证书放置在CRL服务器，那么CRL服务的验证效率是非常差的，所以CA又推出了OCSP响应程序，OCSP响应程序可以查询指定的一个证书是否过期，所以浏览器可以直接查询OCSP响应程序，但OCSP响应程序性能还不是很高。
- 5.Nginx会有一个OCSP的开关，当我们开启后，Nginx会主动上OCSP上查询，这样大量的客户端直接从Nginx获取，证书是否有效。

## 1.1那么证书究竟是怎样组成的呢，接下来我们看一下证书有哪几种类型？

## 1.2HTTPS证书购买选择

保护1个域名 www

保护5个域名 www images cdn test m

通配符域名 *.oldboy.com

## 1.3HTTPS注意事项

```java
Https不支持续费,证书到期需重新申请新并进行替换.
Https不支持三级域名解析, 如test.m.oldboy.com
Https显示绿色, 说明整个网站的url都是https的。
Https显示黄色, 因为网站代码中包含http的不安全连接。
Https显示红色, 要么证书是假的，要么证书过期。
```

## 2.Nginx单台实现HTTPS实战

## 2.1.环境准备

```java
#nginx必须有ssl模块
[root@Nginx ~]# nginx -V
 --with-http_ssl_module
#创建存放ssl证书的路径
[root@Nginx ~]# mkdir -p /etc/nginx/ssl_key
[root@Nginx ~]# cd /etc/nginx/ssl_key
```

## 2.2.使用openssl命令充当CA权威机构创建证书(生产不使用此方式生成证书，不被互联网认可的黑户证书)

```java
[root@Nginx ssh_key]# openssl genrsa -idea -out server.key 2048
Generating RSA private key, 2048 bit long modulus
.....+++
#记住配置密码, 我这里是1234
Enter pass phrase for server.key:
Verifying - Enter pass phrase for server.key:
```

## 2.3.生成自签证书，同时去掉私钥的密码

```java
[root@Nginx ssl_key]# openssl req -days 36500 -x509 \
-sha256 -nodes -newkey rsa:2048 -keyout server.key -out server.crt
Country Name (2 letter code) [XX]:CN
State or Province Name (full name) []:WH
Locality Name (eg, city) [Default City]:WH
Organization Name (eg, company) [Default Company Ltd]:edu    
Organizational Unit Name (eg, section) []:SA
Common Name (eg, your name or your servers hostname) []:bgx
Email Address []:bgx@foxmail.com
# req  -->用于创建新的证书
# new  -->表示创建的是新证书
# x509 -->表示定义证书的格式为标准格式
# key  -->表示调用的私钥文件信息
# out  -->表示输出证书文件信息
# days -->表示证书的有效期
```

## 2.4.证书申请完成后需要了解Nginx如何配置Https

```java
#启动ssl功能
Syntax: ssl on | off;
Default: ssl off;
Context: http, server
#证书文件
Syntax: ssl_certificate file;
Default: —
Context: http, server
#私钥文件
Syntax: ssl_certificate_key file;
Default: —
Context: http, server
```

## 2.5.配置Nginx配置Https实例

```java
[root@Nginx ~]# cat /etc/nginx/conf.d/ssl.conf
server {
    listen 443;
    server_name s.oldboy.com;
    ssl on;
    ssl_certificate   ssl_key/server.crt;
    ssl_certificate_key  ssl_key/server.key;
    location / {
        root /code;
        index index.html;
    }
}
#准备对应的站点目录, 并重启Nginx服务
[root@Nginx ~]# mkdir -p /code
[root@Nginx ~]# echo "Https" > /code/index.html
[root@Nginx ~]# systemctl restart nginx
```

## 2.6.浏览器输入https://s.oldboy.com访问, 由于该证书非第三方权威机构颁发，而是我们自己签发的，所以浏览器会警告

## 2.7.以上配置如果用户忘记在浏览器地址栏输入 https:// 那么将不会跳转至https，建议配置将用户访问 http请求强制跳转https

```java
[root@Nginx ~]# cat /etc/nginx/conf.d/ssl.conf 
server {
    listen 443;
    server_name s.oldboy.com;
    ssl on;
    ssl_certificate   ssl_key/server.crt;
    ssl_certificate_key  ssl_key/server.key;
    location / {
        root /code;
        index index.html;
    }
}
server {
        listen 80;
        server_name s.oldboy.com;
        rewrite ^(.*) https://$server_name$1 redirect; rewrite跳转方式
       return 302 https://$server_name$request_uri;  return跳转方式   
}
```

## 3.Nginx集群实现HTTPS实践

实战Nginx负载均衡+Nginx WEB配置HTTPS安全

## 3.1环境准备

主机名
外网IP(NAT)
内网IP(LAN)
角色

lb01
eth0:10.0.0.5
eth1:172.16.1.5
nginx-proxy

web01
eth0:10.0.0.7
eth1:172.16.1.7
nginx-web01

web02
eth0:10.0.0.8
eth1:172.16.1.8
nginx-web02

## 3.2配置后端两台web节点监听80端口, 如已配置则无需修改

```java
[root@web01 conf.d]# cat blog.oldboy.com.conf 
server {
    listen 80;
    server_name blog.oldboy.com;
    root /code/wordpress;
    index index.php index.html;
    location ~ \.php$ {
        root /code/wordpress;
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }
}
```

## 3.3 配置第二台web节点

```java
[root@web02 ~]# yum install -y nginx
[root@web01 ~]# scp -rp /etc/nginx/ssl_key/ root@172.16.1.8:/etc/nginx/  
[root@web01 ~]# scp -rp /etc/nginx/conf.d/ root@172.16.1.8:/etc/nginx/
```

## 3.4 重启两台后端web节点Nginx

```java
[root@web01 ~]# systemctl restart nginx
[root@web02 ~]# systemctl restart nginx
```

## 3.5 Nginx负载均衡先生成证书

```java
[root@lb01 ~]# mkdir /etc/nginx/ssl_key -p
[root@lb01 ~]# cd /etc/nginx/ssl_key
[root@lb01 ~]# openssl genrsa -idea -out server.key 2048
[root@lb01 ~]# openssl req -days 36500 -x509 -sha256 -nodes -newkey rsa:2048 -keyout server.key -out server.crt
```

## 3.6 Nginx负载均衡配置文件如下

```java
[root@lb01 ~]# cat /etc/nginx/conf.d/proxy.conf 
# 定义后端资源池
upstream site {
    server 172.16.1.7:80 max_fails=2 fail_timeout=10s;
    server 172.16.1.8:80 max_fails=2 fail_timeout=10s;
}
# https配置
server {
    listen 443;
    server_name blog.oldboy.com;
    ssl on;
    ssl_certificate  ssl_key/server.crt;
    ssl_certificate_key  ssl_key/server.key;
    location / {
        proxy_pass http://site;
        include proxy_params;
    }
}
# 用户http请求跳转至https
server {
    listen 80;
    server_name blog.oldboy.com;
    return 302 https://$server_name$request_uri;
}
```

## 3.7 重启Nginx 负载均衡

```java
[root@lb01 ~]# nginx -t
[root@lb01 ~]# systemctl restart nginx
```

## 3.8 wordpress早期安装如果是使用http方式, 那开启https后会导致, wordpress出现加载或无法登陆问题。

```java
#web节点增加此参数
location ~ \.php$ {
    ...
    fastcgi_param  HTTPS on;
    ...
}
```

## 4.阿里云Nginx实现HTTPS实践

在云上签发各品牌数字证书，实现网站HTTPS化，使网站可信，防劫持、防篡改、防监听。并进行统一生命周期管理，简化证书部署，一键分发到云上产品

## 4.1上传阿里云证书, 并解压

```java
[root@Nginx ssl_key]# rz 
rz waiting to receive.
Starting zmodem transfer.  Press Ctrl+C to cancel.
Transferring 1524377920931.zip...
  100%       3 KB       3 KB/sec    00:00:01       0 Errors
//解压
[root@Nginx ssl_key]# unzip 1524377920931.zip
```

## 4.2配置nginx https

```java
[root@Nginx conf.d]# cat ssl.nginx.bjstack.com.conf
server {
    listen 443;
    server_name nginx.bjstack.com;
    ssl on;
    ssl_session_timeout 10m;
    ssl_certificate ssl_key/1524377920931.pem;
    ssl_certificate_key ssl_key/1524377920931.key;
    ssl_ciphers 
    ssl_protocols 
    ssl_session_cache shared:SSL:10m;在建立完ssl握手后如果断开连接，在session_timeout时间内再次连接，是不需要在次建立握手，可以复用之前的连接
    ssl_session_timeout 1440m;          ssl连接断开后的超时时间
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;使用的TLS版本协议
    ssl_prefer_server_ciphers on;       Nginx决定使用哪些协议与浏览器进行通讯
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;配置加密套间
    location / {
        root /soft/code;
        index index.html index.htm;
    }
}
server {
        listen 80;
        server_name nginx.bjstack.com;
        return 302 https://$server_name$request_uri;
}
```

## 4.3测试访问Https

使用腾讯云ATS检测工具检查是否满足苹果IOS要求苹果ATS测试传送门

## 5.阿里云SLB负载实现HTTPS实践

**1、** 环境准备；

角色
外网IP(NAT)
内网IP(LAN)
协议

slb
eth0:10.0.0.5
eth1:172.16.1.5
https

ecs01
eth0:10.0.0.7
eth1:172.16.1.7
http

ecs02
eth0:10.0.0.8
eth1:172.16.1.8
http

## 6.Nginx4+7层负载实现HTTPS实战

配置1台nginx四层负载均衡，2台7层nginx负载，4台后端web节点实现全栈https

角色
弹性公网
内网网络
协议
端口

tcp_proxy
47.104.29.64
172.16.1.164
https/http 80/443

http_proxy01

172.16.1.165
http/https
80/443

http_proxy02

172.16.1.166
http/https
80/443

http_web01

172.16.1.167
http
80

http_web02

172.16.1.168
http
80

http_web03

172.16.1.169
http
80

http_web04

172.16.1.170
http
80

## 6.1.Nginx四层负载均衡配置如下

```java
[root@tcp_lb conf.c]# cat tcp_lb.bjstack.com.conf
stream {
    upstream proxy_lb_bjstack {
        server 172.16.1.165:80;
        server 172.16.1.166:80;
    }
    upstream proxy_lb_bjstack_443 {
        server 172.16.1.165:443;
        server 172.16.1.166:443;
    }
    server {
        listen 80;
        proxy_pass proxy_lb_bjstack;
    }
    server {
        listen 443;
        proxy_pass proxy_lb_bjstack_443;
    }
}
```

## 6.2.lb01与lb02配置七层负载均，具体内容如下

```java
[root@lb-node1 ~]# cat /etc/nginx/conf.d/proxy_lb.bjstack.com.conf
upstream node {
    server 172.16.1.167:80;
    server 172.16.1.168:80;
    server 172.16.1.169:80;
    server 172.16.1.170:80;
}
server {
    listen 80;
    server_name lb.bjstack.com;
    location / {
        return 302 https://$server_name$request_uri;
    }
}
server {
    listen 443;
    server_name lb.bjstack.com;
    ssl on;
    ssl_certificate   ssl_key/server.crt;
    ssl_certificate_key  ssl_key/server.key;
    location / {
        proxy_pass http://node;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 6.3.后端多台web节点配置如下

```java
[root@web02 ~]# cat /etc/nginx/conf.d/web_lb.bjstack.com.conf
server {
        listen 80;
        server_name lb.bjstack.com;
        location / {
                root /code;
                index index.html;
        }
}
```
