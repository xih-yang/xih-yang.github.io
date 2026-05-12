# 16、Nginx 实战：Nginx负载均衡
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/16.html
- 分类：服务器框架
- 分组：教程目录
## 一、Nginx负载均衡概述

### 1.为什么做负载均衡

当我们的Web服务器直接面向用户，往往要承载大量并发请求，单台服务器难以负荷，我使用多台Web服务器组成集群，前端使用Nginx负载均衡，将请求分散的打到我们的后端服务器集群中，实现负载的分发。那么会大大提升系统的吞吐率、请求性能、高容灾

往往我们接触的最多的是SLB(Server Load Balance)负载均衡，实现最多的也是SLB、那么SLB它的调度节点和服务节点通常是在一个地域里面。那么它在这个小的逻辑地域里面决定了他对部分服务的实时性、响应性是非常好的。

所以说当海量用户请求过来以后，它同样是请求调度节点，调度节点将用户的请求转发给后端对应的服务节点，服务节点处理完请求后在转发给调度节点，调度节点最后响应给用户节点。这样也能实现一个均衡的作用，那么Nginx则是一个典型的SLB

### 2.负载均衡的叫法

```java
负载均衡
负载
Load Balance
LB
```

### 3.公有云中叫法

```java
1.SLB		阿里云产品
2.LB		青云产品
3.CLB		腾讯云产品
4.ULB		ucloud产品
```

## 二、常见的负载均衡软件

```java
Nginx
Haproxy
LVS
#LVS是最快的负载均衡软件
```

### 1.Nginx

```java
工作在网络的7层之上，可以针对http应用做一些分流的策略，比如针对域名、目录结构；
Nginx对网络的依赖比较小，理论上能ping通就就能进行负载功能；
Nginx安装和配置比较简单，测试起来比较方便；
可以承担高的负载压力且稳定，一般能支撑超过1万次的并发；
对后端服务器的健康检查，只支持通过端口来检测，不支持通过curl来检测。
Nginx对请求的异步处理可以帮助节点服务器减轻负载；
Nginx仅能支持http、https和Email协议，这样就在适用范围较小。
不支持Session的直接保持，但能通过ip_hash来解决。对Big request header的支持不是很好，
支持负载均衡算法：Round-robin（轮循）、Weight-round-robin（带权轮循）、Ip-hash（Ip哈希）
Nginx还能做Web服务器即Cache功能.
```

### 2.Haproxy

```java
支持两种代理模式：TCP（四层）和HTTP（七层），支持虚拟主机；
能够补充Nginx的一些缺点比如Session的保持，Cookie的引导等工作
支持url检测后端的服务器出问题的检测会有很好的帮助。
更多的负载均衡策略比如：动态加权轮循(Dynamic Round Robin)，加权源地址哈希(Weighted Source Hash)，加权URL哈希和加权参数哈希(Weighted Parameter Hash)已经实现
单纯从效率上来讲HAProxy更会比Nginx有更出色的负载均衡速度。
HAProxy可以对Mysql进行负载均衡，对后端的DB节点进行检测和负载均衡。
支持负载均衡算法：Round-robin（轮循）、Weight-round-robin（带权轮循）、source（原地址保持）、RI（请求URL）、rdp-cookie（根据cookie）
不能做Web服务器即Cache。
```

### 3.LVS

```java
抗负载能力强。抗负载能力强、性能高，能达到F5硬件的60%；对内存和cpu资源消耗比较低
工作在网络第4层，通过vrrp协议转发（仅作分发之用），具体的流量由linux内核处理，因此没有流量的产生。
稳定性、可靠性好，自身有完美的热备方案；（如：LVS+Keepalived）
应用范围比较广，可以对所有应用做负载均衡；
不支持正则处理，不能做动静分离。
支持负载均衡算法：rr（轮循）、wrr（带权轮循）、lc（最小连接）、wlc（权重最小连接）
配置 复杂，对网络依赖比较大，稳定性很高。
```

## 三、负载均衡类型

```java
1.四层负载均衡
所谓四层负载均衡指的是OSI七层模型中的传输层，那么传输层Nginx已经能支持TCP/IP的控制，所以只需要对客户端的请求进行TCP/IP协议的包转发就可以实现负载均衡，那么它的好处是性能非常快、只需要底层进行应用处理，而不需要进行一些复杂的逻辑。
2.七层负载均衡
七层负载均衡它是在应用层，那么它可以完成很多应用方面的协议请求，比如我们说的http应用的负载均衡，它可以实现http信息的改写、头信息的改写、安全应用规则控制、URL匹配规则控制、以及转发、rewrite等等的规则，所以在应用层的服务里面，我们可以做的内容就更多，那么Nginx则是一个典型的七层负载均衡SLB
```

## 四、Nginx负载均衡配置

```java
Nginx要实现负载均衡需要用到proxy_pass代理模块配置.
Nginx负载均衡与Nginx代理不同地方在于，Nginx的一个location仅能代理一台服务器，而Nginx负载均衡则是将客户端请求代理转发至一组upstream虚拟服务池.
```

### 1.语法模块 ngx_http_upstream_module

```java
Syntax:	upstream name { ... }
Default:	—
Context:	http
upstream backend {
    server backend1.example.com       weight=5;
    server backend2.example.com:8080;
    server backup1.example.com:8080   backup;
    server backup2.example.com:8080   backup;
}
server {
    location / {
        proxy_pass http://backend;
    }
}
```

### 2.环境准备

主机
外网ip
身份

lb01
10.0.0.4,172.16.1.4
负载均衡

web01
172.16.1.7
web

web03
172.16.1.9
web

### 3.操作web01

#### 1）配置nginx

```java
[root@web01 conf.d]# vim linux.node.com.conf 
server {
    listen 80;
    server_name linux.node.com;
    charset utf-8;
    location / {
        root /code/node;
        index index.html;
    }
}
```

#### 2）配置站点

```java
[root@web01 conf.d]# mkdir /code/node
[root@web01 conf.d]# echo "我是web01......" > /code/node/index.html
```

#### 3）配置hosts

```java
10.0.0.7 linux.node.com
#重启访问
[root@web01 conf.d]# systemctl restart nginx
```

### 4.操作web03

#### 1）配置nginx

```java
[root@web03 conf.d]# vim linux.node.com.conf 
server {
    listen 80;
    server_name linux.node.com;
    charset utf-8;
    location / {
        root /code/node;
        index index.html;
    }
}
```

#### 2）配置站点

```java
[root@web03 conf.d]# mkdir /code/node
[root@web03 conf.d]# echo "我是web03......" > /code/node/index.html
```

#### 3）配置hosts

```java
10.0.0.9 linux.node.com
#重启访问
[root@web03 conf.d]# systemctl restart nginx
```

### 5.配置负载均衡配置文件

```java
[root@lb01 conf.d]# vim node_proxy.conf 
upstream web {
    server 172.16.1.7:80;
    server 172.16.1.8:80;
}
server {
    listen 80;
    server_name linux.node.com;
    location / {
        proxy_pass http://web;
        include proxy_params;
    }
}
```

### 6.配置优化文件

```java
[root@Nginx ~]# vim /etc/nginx/proxy_params
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_connect_timeout 30;
proxy_send_timeout 60;
proxy_read_timeout 60;
proxy_buffering on;
proxy_buffer_size 32k;
proxy_buffers 4 128k;
```

## 五、Nginx负载均衡调度算法

调度算法
概述

轮询
按时间顺序逐一分配到不同的后端服务器(默认)

weight
加权轮询,weight值越大,分配到的访问几率越高

ip_hash
每个请求按访问IP的hash结果分配,这样来自同一IP的固定访问一个后端服务器

url_hash
按照访问URL的hash结果来分配请求,是每个URL定向到同一个后端服务器

least_conn
最少链接数,那个机器链接数少就分发

### 1.轮询配置方法

```java
upstream node {
    server 172.16.1.7:80;
    server 172.16.1.8:80;
}
```

### 2.加权轮询配置方法

```java
#访问根据配置的权重比例进行分配
upstream node {
    server 172.16.1.7:80 weight=5;
    server 172.16.1.8:80 weight=1;
}
```

#### 3.ip_hash的配置方法

```java
#根据访问的来源IP分配至同一台服务器
upstream node {
    server 172.16.1.7:80;
    server 172.16.1.8:80;
    ip_hash;
}
#经常使用这种方式进行会话保持
```

## 六、Nginx负载均衡后端状态

状态
概述

down
当前的server暂时不参与负载均衡

backup
预留的备份服务器

max_fails
允许请求失败的次数

fail_timeout
经过max_fails失败后, 服务暂停时间

max_conns
限制最大的接收连接数

### 1.down状态配置测试

```java
[root@lb01 ~]# vim /etc/nginx/conf.d/proxy.conf 
upstream web {
    server 172.16.1.7:80 down;
    server 172.16.1.9:80;
}
#一般在代码上线或维护服务器时使用该状态
```

### 2.backup状态测试

```java
[root@lb01 ~]# vim /etc/nginx/conf.d/proxy.conf 
upstream web {
    server 172.16.1.7:80;
    server 172.16.1.9:80;
    server 172.16.1.10:80 backup;
    server 172.16.1.11:80 backup;
}
```

### 3.max_fails配置

```java
[root@lb01 ~]# vim /etc/nginx/conf.d/proxy.conf 
upstream web {
    server 172.16.1.7:80 max_fails=3 fail_timeout=10s;
    server 172.16.1.9:80;
}
```

### 4.测试max_conns最大TCP连接数

```java
[root@lb01 ~]# vim /etc/nginx/conf.d/proxy.conf 
upstream web {
    server 172.16.1.7:80 max_conns=10;
    server 172.16.1.9:80;
}
```

## 七、负载均衡结合项目

### 1.配置blog的负载均衡

```java
[root@lb01 ~]# vim /etc/nginx/conf.d/blog.conf 
upstream blog {
    server 172.16.1.7:80;
    server 172.16.1.9:80;
}
server {
    listen 80;
    server_name linux.blog.com;
    location / {
        proxy_pass http://blog;
        include /etc/nginx/proxy_params;
    }
}
[root@lb01 ~]# systemctl restart nginx
#配置hosts，访问测试
```

### 2.配置wecenter的负载均衡

```java
[root@lb01 ~]# vim /etc/nginx/conf.d/zh.conf 
upstream zh {
    server 172.16.1.7:80;
    server 172.16.1.9:80;
}
server {
    listen 80;
    server_name linux.zh.com;
    location / {
        proxy_pass http://zh;
        include /etc/nginx/proxy_params;
    }
}
```

## 八、Nginx负载均衡常见错误

### 1.错误

```java
如果后端服务器返回报错，负载均衡仍然会将请求分配到出错的web服务器，因为负载均衡只会根据调度算法将请求分配到后端，不会进行判断后端是否正常
```

### 2.解决错误的模块语法

```java
Syntax:	proxy_next_upstream error | timeout | invalid_header | http_500 | http_502 | http_503 | http_504 | http_403 | http_404 | http_429 | non_idempotent | off ...;
Default:	proxy_next_upstream error timeout;
Context:	http, server, location
```

### 3.配置方法

```java
[root@lb01 ~]# vim /etc/nginx/conf.d/zh.conf 
upstream zh {
    server 172.16.1.7:80;
    server 172.16.1.9:80;
}
server {
    listen 80;
    server_name linux.zh.com;
    location / {
        proxy_pass http://zh;
        include /etc/nginx/proxy_params;
        proxy_next_upstream http_502 error timeout;
    }
}
```

## 九、Nginx负载均衡健康检查

### 1.概述

```java
在Nginx官方模块提供的模块中，没有对负载均衡后端节点的健康检查模块，但可以使用第三方模块。
nginx_upstream_check_module来检测后端服务的健康状态。
```

### 2.安装依赖包

```java
[root@lb02 ~]# yum install -y gcc glibc gcc-c++ pcre-devel openssl-devel patch
```

### 3.下载nginx源码包以及nginx_upstream_check模块第三方模块

```java
[root@lb02 ~]# wget http://nginx.org/download/nginx-1.14.2.tar.gz
[root@lb02 ~]# wget https://github.com/yaoweibin/nginx_upstream_check_module/archive/master.zip
```

### 4.解压nginx源码包以及第三方模块

```java
[root@lb02 ~]# tar xf nginx-1.14.2.tar.gz
[root@lb02 ~]# unzip master.zip
```

### 5.进入nginx目录，打补丁(nignx的版本是1.14，补丁就选择1.14的，p1代表在nginx目录，po表示不在nginx目录)

```java
[root@lb02 ~]# cd nginx-1.14.2/
[root@lb02 nginx-1.14.2]# patch -p1 <../nginx_upstream_check_module-master/check_1.14.0+.patch
[root@lb02 nginx-1.14.2]# ./configure --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-compat --with-file-aio --with-threads --with-http_addition_module --with-http_auth_request_module --with-http_dav_module --with-http_flv_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_mp4_module --with-http_random_index_module --with-http_realip_module --with-http_secure_link_module --with-http_slice_module --with-http_ssl_module --with-http_stub_status_module --with-http_sub_module --with-http_v2_module --with-mail --with-mail_ssl_module --with-stream --with-stream_realip_module --with-stream_ssl_module --with-stream_ssl_preread_module --add-module=/root/nginx_upstream_check_module-master --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic -fPIC' --with-ld-opt='-Wl,-z,relro -Wl,-z,now -pie'
[root@lb02 nginx-1.14.2]# make && make install
```

### 6.在已有的负载均衡上增加健康检查的功能

```java
[root@lb02 /etc/nginx]# vim /etc/nginx/nginx.conf
http {
    include conf.d/*.conf;
    ... ...
}
[root@lb02 /etc/nginx]# mkdir /etc/nginx/conf.d
[root@lb01 conf.d]# cat proxy_web.conf
upstream web {
    server 172.16.1.7:80 max_fails=2 fail_timeout=10s;
    server 172.16.1.8:80 max_fails=2 fail_timeout=10s;
    check interval=3000 rise=2 fall=3 timeout=1000 type=tcp;
   interval  检测间隔时间，单位为毫秒
   rise      表示请求2次正常，标记此后端的状态为up
   fall      表示请求3次失败，标记此后端的状态为down
   type      类型为tcp
   timeout   超时时间，单位为毫秒
}
server {
    listen 80;
    server_name linux.web.com;
    location / {
        proxy_pass http://web;
        include proxy_params;
    }
    location /upstream_check {
        check_status;
    }
}
#编辑优化文件
[root@lb02 /etc/nginx]# vim /etc/nginx/proxy_params 
proxy_set_header Host $http_host;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_connect_timeout 60s;
proxy_read_timeout 60s;
proxy_send_timeout 60s;
proxy_buffering on;
proxy_buffer_size 32k;
proxy_buffers 8 128k;
```

### 7.创建用户和目录

```java
[root@lb02 /etc/nginx]# groupadd nginx -g 666
[root@lb02 /etc/nginx]# useradd nginx -u 666 -g 666
[root@lb02 /etc/nginx]# mkdir /var/cache/nginx/
```

### 8.启动并访问

```java
[root@lb02 /etc/nginx]# /usr/sbin/nginx
#配置hosts
10.0.0.5 linux.web.com
```

## 十、Nginx负载均衡会话保持

### 1.概述

```java
在使用负载均衡的时候会遇到会话保持的问题，可通过如下方式进行解决。
1.使用nginx的ip_hash，根据客户端的IP，将请求分配到对应的IP上
2.基于服务端的session会话共享（file+NFS，MySQL，redis）
```

### 2.session共享的方法

```java
1.把多台机器的session文件挂载到NFS
2.通过程序将session存储到mysql数据库
3.通过程序将session存储到redis
```

### 3.搭建第一台phpmyadmin

```java
1.上传源码包
[root@web01 ~]# cd /code/
[root@web01 /code]# rz phpMyAdmin-4.9.0.1-all-languages.zip
2.解压源码包
[root@web01 /code]# unzip phpMyAdmin-4.9.0.1-all-languages.zip
[root@web01 /code]# mv phpMyAdmin-4.9.0.1-all-languages php
3.配置代码
[root@web01 /code]# cp php/config.sample.inc.php php/config.inc.php
[root@web01 /code]# vim php/config.inc.php
$cfg['Servers'][$i]['host'] = '172.16.1.51';
4.配置nginx
[root@web01 /code]# vim /etc/nginx/conf.d/linux.php.com.conf
server {
    listen 80;
    server_name linux.php.com;
    root /code/php;
    location / {
        index index.php;
    }
    location ~* \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
5.重启访问
[root@web01 /code]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web01 /code]# systemctl restart nginx
#配置hosts
10.0.0.7 linux.php.com
 6.访问页面错误
#报错
session_start(): open(SESSION_FILE, O_RDWR) failed: Permission denied (13)
session_start(): Failed to read session data: files (path: /var/lib/php/session)
#解决：
[root@web01 /code]# chown -R www.www /var/lib/php/session
 7.再次访问测试
#如果忘记数据库远程连接密码
[root@db01 ~]# mysql -uroot -pLinhd@123
MariaDB [(none)]> grant all on *.* to root@'172.16.1.%' identified by '123';
Query OK, 0 rows affected (0.00 sec)
MariaDB [(none)]> select user,host,password from mysql.user;
```

### 4.同步配置到第二台服务器

```java
1.推送配置和站点
#推送站点目录
[root@web01 /code]# scp -r /code/php 172.16.1.9:/code/
#推送nginx配置
[root@web01 /code]# scp /etc/nginx/conf.d/linux.php.com.conf 172.16.1.9:/etc/nginx/conf.d/
2.重启访问
[root@web03 ~]# systemctl restart nginx
#配置hosts
10.0.0.9 linux.php.com
3.授权目录
#报错
session_start(): open(SESSION_FILE, O_RDWR) failed: Permission denied (13)
session_start(): Failed to read session data: files (path: /var/lib/php/session)
#解决：
[root@web03 /code]# chown -R www.www /var/lib/php/session
```

### 5.配置负载均衡

```java
1.配置
[root@lb01 ~]# cp /etc/nginx/conf.d/blog.conf /etc/nginx/conf.d/php.conf
[root@lb01 ~]# vim /etc/nginx/conf.d/php.conf
upstream php {
    server 172.16.1.7:80;
    server 172.16.1.9:80;
}
server {
    listen 80;
    server_name linux.php.com;
    location / {
        proxy_pass http://php;
        include /etc/nginx/proxy_params;
    }
}
2.重启并访问
[root@lb01 ~]# systemctl restart nginx
#配置hosts
10.0.0.4 linux.php.com
```

### 6.使用redis实现session共享

```java
1.安装redis
[root@db01 ~]# yum install -y redis
2.配置redis
[root@db01 ~]# vim /etc/redis.conf
bind 127.0.0.1 172.16.1.51
3.启动redis
[root@db01 ~]# systemctl start redis
#检查启动
[root@db01 ~]# netstat -lntp  
tcp        0      0 172.16.1.51:6379        0.0.0.0:*          LISTEN      29104/redis-server
tcp        0      0 127.0.0.1:6379          0.0.0.0:*          LISTEN      29104/redis-server 
4.配置PHP服务将session存储到redis
[root@web01 /code]# vim /etc/php.ini
#原配置 session.save_handler = files
session.save_handler = redis
session.save_path = "tcp://172.16.1.51:6379"
[root@web01 /code]# vim /etc/php-fpm.d/www.conf
#最下面几行注释
;php_value[session.save_handler] = files
;php_value[session.save_path]    = /var/lib/php/session
5.重启PHP
[root@web01 /code]# systemctl restart php-fpm
[root@web03 /code]# systemctl restart php-fpm
6.访问测试
7.redis查看session
[root@db01 ~]# redis-cli 
127.0.0.1:6379> keys *
1) "PHPREDIS_SESSION:8b8721df0b5736149ea0c716f05773e9"
2) "PHPREDIS_SESSION:b59336d7a1a053c6d26c2550032c1609
127.0.0.1:6379> TTL PHPREDIS_SESSION:b59336d7a1a053c6d26c2550032c1609
(integer) 1199
```
