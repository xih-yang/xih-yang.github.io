# 25、Nginx 实战：Nginx性能优化
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/25.html
- 分类：服务器框架
- 分组：教程目录
## 一、性能优化概述

### 1.我们需要了解

1、首先需要了解我们当前系统的结构和瓶颈，了解当前使用的是什么，运行的是什么业务，都有哪些服务，了解每个服务最大能支撑多少并发。比如nginx作为静态资源服务并发是多少，最高瓶颈在哪里，能支持多少qps（每秒查询率）的访问请求，那我们怎么得出这组系统结构瓶颈呢，比如top查看系统的CPU负载、内存使用率、总得运行进程等，也可以通过日志去分析请求的情况，当然也可以通过我们前面介绍到的stub_status模块查看当前的连接情况，也可以对线上的业务进行压力测试（低峰期），去了解当前这套系统能承担多少的请求和并发，已做好响应的评估。这个是我们做性能优化最先考虑的地方。

2、其次我们需要了解业务模式，虽然我们是做性能优化，但每一个性能的优化都是为业务所提供的服务的，我们需要了解每个业务接口的类型，比如：电商网站中的抢购模式，这种情况下面，平时没什么流量，但到了抢购时间流量会突增。
我们还需要了解系统层次化的结构，比如：我们使用nginx做的是代理、还是动静分离、还是后端直接服务用户，那么这个就需要我们对每一层做好相应的梳理。以便更好的服务业务。

3、最后我们需要考虑性能与安全，往往注重了性能，但是忽略了安全。往往过于注重安全，对性能又会产生影响。比如：我们在设计防火墙功能时，检测过于严密，这样就会给性能带来影响。那么如果对于性能完全追求，却不顾服务的安全，这个也会造成很大的隐患，所以需要评估好两者的关系，把握好两者的孰重孰轻。以及整体的相关性，权衡好对应的点。

1、需要了解我们当前系统的结构和瓶颈

2、我们需要了解业务模式

3、我们还需要了解系统层次化的结构

4、需要考虑性能与安全

### 2.从那些方面入手

```java
OSI七层模型：物理层，数据链路层，网络层，传输层，会话层，表示层，应用层
1.硬件：磁盘，内存，CPU
2.网络：带宽，网速，丢包，延迟
3.系统：文件描述符（文件句柄数）
4.应用：服务与服务之间保持长连接
5.服务：nginx、MySQL、php
```

### 3.影响性能的指标

```java
1.网络
	1）网络的流量
	2）是否有丢包
	3）http请求速度
2.系统、硬件
	1）硬件损坏
	2）cpu、内存、硬盘 压力
3.服务
	1）连接优化
4.程序
	1）接口
	2）处理速度
	3）执行效率
5.数据库
```

## 二、压力测试工具 ab

### 1.安装ab工具

```java
#查看命令所在包
[root@web02 /server]# yum provides ab
#安装ab
[root@web02 /server]# yum install -y httpd-tools
```

### 2.工具使用

```java
[root@web01 ~]# ab -n 200 -c 2 http://linux.try.com/
-n	请求次数
-c	请求的并发数
-k	保持长连接
#语法
Usage: ab [options] [http[s]://]hostname[:port]/path
```

### 3.配置网站

```java
[root@web01 ~]# vim /etc/nginx/conf.d/t_file.conf 
server {
    listen 80;
    server_name linux.try.com;
    location / {
        root /code/try;
       index index.html index.htm;
        try_files $uri $uri/ @java;
    }
    location @java {
        proxy_pass http://172.16.1.8:8080;
    }
}
#配置 hosts
[root@web01 ~]# vim /etc/hosts
10.0.0.7 linux.try.com
```

### 4.ab测试nginx请求静态页

```java
[root@web01 ~]# ab -n 20000 -c 20 http://linux.try.com/
Concurrency Level:      20
Time taken for tests:   1.639 seconds
Complete requests:      20000
Failed requests:        0
Write errors:           0
Total transferred:      5120000 bytes
HTML transferred:       220000 bytes
Requests per second:    12200.40 [#/sec] (mean)
Time per request:       1.639 [ms] (mean)
Time per request:       0.082 [ms] (mean, across all concurrent requests)
Transfer rate:          3050.10 [Kbytes/sec] received
```

### 5.安装tomcat

```java
#1.下载或上传tomcat包
[root@web01 ~]# mkdir /server
[root@web01 ~]# cd /server
[root@web01 server]# rz apache-tomcat-9.0.30.tar.gz
#2.解压代码包
[root@web01 server]# tar xf apache-tomcat-9.0.30.tar.gz
#3.配置java环境
1.上传并解压至指定文件夹
[root@web01 server]# tar xf jdk-8u40-linux-x64.gz -C /server/
[root@web01 server]# mv jdk1.8.0_40 java1.8
2.修改添加环境变量
[root@web01 server]# vim /etc/profile.d/java.sh
export JAVA_HOME=/server/java1.8
export JRE_HOME=/server/java1.8/jre
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar:$JAVA_HOME/lib:$JRE_HOME/lib:$CLASSPATH
export PATH=$PATH:$JAVA_HOME/bin
[root@web01 server]# source /etc/profile
#4.配置tomcat页面
[root@web01 server]# echo "tomcat" > apache-tomcat-9.0.30/webapps/ROOT/index.html
#5.启动tomcat，启动的时候最好看着日志
[root@web01 server]# /server/apache-tomcat-8.5.51/bin/startup.sh && tail -f /server/apache-tomcat-8.5.51/logs/catalina.out
```

### 6.ab测试tomcat请求静态页

```java
[root@web01 ~]# rm -rf /code/try
Concurrency Level:      20
Time taken for tests:   11.736 seconds
Complete requests:      20000
Failed requests:        0
Write errors:           0
Total transferred:      5120000 bytes
HTML transferred:       140000 bytes
Requests per second:    1704.10 [#/sec] (mean)
Time per request:       11.736 [ms] (mean)
Time per request:       0.587 [ms] (mean, across all concurrent requests)
Transfer rate:          426.03 [Kbytes/sec] received
```

### 7.测试结果

```java
nginx处理静态文件的速度比tomcat服务快
```

## 三、系统优化

```java
文件句柄，文件描述符，会随着进程数增加而增加
```

### 1.查看文件句柄命令

```java
#查看文件句柄数设置
[root@web01 ~]# ulimit -n
65535
#查看总共打开的文件句柄数
[root@web01 ~]# lsof | wc -l
#查看进程打开的文件句柄数
[root@web01 ~]# lsof -p 71336 | wc -l
32
```

### 2.设置文件句柄数

#### 1）系统全局设置

```java
[root@web01 ~]# vim /etc/security/limits.conf
* - nofile 65535
* soft nofile 65535
* hard nofile 65535
*		#代表所有用户
-		#超过文件句柄数时，什么都不干
soft	#超过文件句柄数时，仅提示
hard	#超过文件句柄数时，直接限制
```

#### 2）用户局部设置

```java
[root@web01 ~]# vim /etc/security/limits.conf
root - nofile 65535
root soft nofile 65535
root hard nofile 65535
```

#### 3）针对nginx服务

```java
[root@web01 ~]# vim /etc/nginx/nginx.conf 
user  www;
worker_processes  1;
worker_rlimit_nofile 65535;
```

### 3.系统优化

```java
[root@web01 ~]# vim /etc/sysctl.conf
net.ipv4.tcp_fin_timeout = 2
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_tw_recycle = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_keepalive_time = 600
net.ipv4.ip_local_port_range = 4000   65000
net.ipv4.tcp_max_syn_backlog = 16384
net.ipv4.tcp_max_tw_buckets = 36000
net.ipv4.route.gc_timeout = 100
net.ipv4.tcp_syn_retries = 1
net.ipv4.tcp_synack_retries = 1
net.core.somaxconn = 16384
net.core.netdev_max_backlog = 16384
net.ipv4.tcp_max_orphans = 16384
net.ipv4.ip_forward = 1
[root@web01 ~]# sysctl -p
```

## 四、Nginx做代理的优化

```java
nginx作为代理，负责转发用户的请求，如果不配置默认是短链接，需要手动配置
```

### 1.配置nginx代理开启长连接

```java
[root@lb01 ~]# vim /etc/nginx/conf.d/proxy.conf 
upstream web {
    server 172.16.1.7:80;
    keepalive 16;				#开启长连接
}
server {
    listen 80;
    server_name linux.node.com;
    location / {
        proxy_pass http://web;
        proxy_http_version 1.1;		#指定长连接版本
        include /etc/nginx/proxy_params;
    }
}
```

### 2.配置nginx代理PHP开启长连接

```java
[root@web01 ~]# cat /etc/nginx/conf.d/linux.blog.com.conf
server {
	listen 80;
	server_name linux.blog.com;
	root /code/wordpress;
	location ~* \.php$ {
		fastcgi_pass 127.0.0.1:9000;
		fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
		fastcgi_keep_conn on;				#配置代理http开启长连接
		include fastcgi_params;
	}
}
```

## 五、Nginx处理静态资源优化

```java
nginx作为静态资源服务器，用于处理静态资源非常的高效
```

静态资源类型
后缀

html资源
html、css、js

图片文件
jpg、png、gif、jpeg

视频文件
mp3、mp4、avi

文本文件
txt、doc、xml

其他文件
pdf

### 1.静态资源缓存

#### 1）浏览器缓存

```java
#响应头部
cache-control: max-age=2592000
expires: Thu, 19 Nov 1981 08:52:00 GMT
ETag: "5f3fefc8-2d03"
Last-Modified: Fri, 21 Aug 2020 16:01:12 GMT
#请求头部
If-Modified-Since: Fri, 21 Aug 2020 16:01:12 GMT
If-None-Match: "5f3fefc8-2d03"
```

#### 2）浏览器读取缓存流程

```java
1.浏览器会先去查看响应头部的cache-control（缓存控制）
2.如果没有到达过期时间，会直接返回缓存中的内容，不需要重新读取服务器
3.如果cache-control设置为 no-cache，浏览器会去读取expires（缓存过期时间）
4.如果没有到达expires过期时间，会直接返回缓存中的内容，不需要重新读取服务器
5.如果cache-control和expires都没有设置
6.浏览器会去查看服务器上面ETag值，如果有浏览器会拿着 If-None-Match 去跟他对比
7.如果ETag与浏览器的 If-None-Match 相同，则走缓存
8.如果ETag与浏览器的 If-None-Match 不相同，浏览器会去查看服务器上面 Last-Modified值
9.如果服务器上有 Last-Modified值，浏览器会拿着If-Modified-Since去跟他对比
10.如果Last-Modified值与浏览器的 If-Modified-Since 相同，则走缓存
11.如果Last-Modified值与浏览器的 If-Modified-Since 不相同，重新去服务器读取数据
#含义
1.cache-control：缓存控制，记录的时文件保留时间
2.expires：缓存时间，记录的是文件的过期时间
3.ETag：服务器上保留的文件唯一标识符
4.If-None-Match：浏览器上保留的文件唯一标识符
5.Last-Modified：服务器上保留的文件最后修改时间
6.If-Modified-Since：浏览器上保留的文件最后修改时间
```

#### 3）配置缓存过期时间

```java
#语法
Syntax:	expires [modified] time;
		expires epoch | max | off;
Default:	expires off;
Context:	http, server, location, if in location
#配置过期时间
[root@web01 ~]# vim /etc/nginx/conf.d/cacha.conf 
server {
    listen 80;
    server_name linux.cache.com;
    root /code/cache;
    location ~* \.(jpg|png|gif)$ {
        root /code/cache;
        expires 7d;
    }
}
```

#### 4）配置不走缓存

```java
#公司测试化境经常更新前端代码，需要关闭缓存
1.使用无痕模式
2.开启浏览器 Disable cache
3.配置nginx
    location ~* \.(jpg|png|gif)$ {
        root /code/cache;
        add_header Cache-Control no-cache;
        etag off;
        if_modified_since off;
    }
```

### 2.静态资源读取

#### 1）文件高速读取

```java
Syntax:	sendfile on | off;
Default:	sendfile off;
Context:	http, server, location, if in location
```

#### 2）高效传输（开启了sendfile）

```java
Syntax:	tcp_nopush on | off;
Default:	tcp_nopush off;
Context:	http, server, location
```

#### 3）长连接传输（必须开启长连接）

```java
Syntax:	tcp_nodelay on | off;
Default:	tcp_nodelay on;
Context:	http, server, location
```

#### 4）注意

```java
tcp_nodelay和tcp_nopush只能配置一个，不能同时配置
```

### 3.静态资源压缩

#### 1）静态资源压缩语法

```java
#开启压缩
Syntax:	gzip on | off;
Default:	gzip off;
Context:	http, server, location, if in location
#指定压缩类型
Syntax:	gzip_types mime-type ...;
Default:	gzip_types text/html;
Context:	http, server, location
#指定压缩比例
Syntax:	gzip_comp_level level;
Default:	gzip_comp_level 3-5;    1-9个级别
Context:	http, server, location
#指定传输协议
Syntax:	gzip_http_version 1.0 | 1.1;
Default:	gzip_http_version 1.1;
Context:	http, server, location
```

#### 2）压缩配置

```java
[root@web01 /code/cache]# vim /etc/nginx/conf.d/gzip.conf 
server {
    listen 80;
    server_name linux.gzip.com;
    root /code/cache;
    location ~* \.(jpg|png|gif)$ {
        gzip on;
        gzip_types image/jpeg image/gif image/png;
        gzip_comp_level 9;
    }
    location ~* \.(txt|css)$ {
        gzip on;
        gzip_types text/css text/plain;
        gzip_comp_level 5;
    }
}
```

### 4.防资源盗链

#### 1）配置被盗链的网站

```java
[root@web02 /etc/nginx/conf.d]# vim beidaolian.conf
server {
    listen 80;
    server_name linux.beidaolian.com;
    location / {
        root /code/beidaolian;
        index index.html;
    }
}
[root@web02 /etc/nginx/conf.d]# mkdir /code/beidaolian
[root@web02 /etc/nginx/conf.d]# cd /code/beidaolian/
[root@web02 /code/beidaolian]# rz
[root@web02 /code/beidaolian]# ll
total 13444
-rw-r--r-- 1 root root   18632 2020-09-11 15:57 1.jpg
-rw-r--r-- 1 root root  471421 2020-09-11 15:57 3.jpg
```

#### 2）配置盗链的网站

```java
[root@web01 /]# vim /etc/nginx/conf.d/daolian.conf
server {
    listen 80;
    server_name linux.daolian.com;
    root /code/cache;
}
[root@web01 /]# vim /code/cache/index.html 
<img src="http://linux.beidaolian.com/1.jpg" />
#配置hosts
[root@web01 /]# vim /etc/hosts
10.0.0.8 linux.beidaolian.com
#windows配置访问页面
10.0.0.7 linux.daolian.com
访问http://linux.daolian.com/
```

#### 3）配置防盗链语法

```java
Syntax:	valid_referers none | blocked | server_names | string ...;
Default:	—
Context:	server, location
none		#nginx日志中referer部分为空
blocked		#nginx日志中referer部分没有携带协议，没有http或者https
server_names	#nginx日志中referer部分为指定的域名
```

#### 4）防盗链配置

```java
[root@web02 /code/beidaolian]# cat /etc/nginx/conf.d/beidaolian.conf 
server {
	listen 80;
	server_name linux.beidaolian.com;
	location / {
		root /code/beidaolian;
		index index.html;
	}
	location ~* \.jpg$ {
		root /code/beidaolian;
		#valid_referers none blocked server_name linux.beidaolian.com *.baidu.com;
		valid_referers none blocked linux.beidaolian.com;
		if ($invalid_referer) {
    		return 403;
		}
	}
}
```

#### 5）伪造referer请求头

```java
[root@web01 ~]# curl -e "http://linux.daolian.com" -I linux.beidaolian.com/1.jpg
HTTP/1.1 500 Internal Server Error
Server: nginx/1.18.0
Date: Fri, 11 Sep 2020 08:23:52 GMT
Content-Type: text/html
Content-Length: 177
Connection: close
[root@web01 ~]# curl -e "http://linux.beidaolian.com" -I linux.beidaolian.com/1.jpg
HTTP/1.1 200 OK
Server: nginx/1.18.0
Date: Fri, 11 Sep 2020 08:24:19 GMT
Content-Type: image/jpeg
Content-Length: 18632
Last-Modified: Fri, 11 Sep 2020 07:57:48 GMT
Connection: keep-alive
ETag: "5f5b2dfc-48c8"
Accept-Ranges: bytes
```

### 5.允许跨域访问

```java
#盗链就是由我的网站向你的网站发起get获取资源的请求
#跨域访问由我的网站向你的网站发起http的链接请求
```

#### 1）配置被跨域的网站

```java
[root@web02 /etc/nginx/conf.d]# vim beikuayu.conf
server {
    listen 80;
    server_name linux.beikuayu.com;
    location / {
        root /code/beikuayu;
        index index.html;
    }
}
#创建站点
[root@web02 ~]# echo "bei kua yu de wang zhan" > /code/beikuayu/index.html
```

#### 2）配置跨域的网站

```java
[root@web01 ~]# vim /etc/nginx/conf.d/kuayu.conf
server {
    listen 80;
    server_name linux.kuayu.com;
    location / {
        root /code/kuayu;
        index index.html;
    }
}
#配置站点
[root@web01 ~]# mkdir /code/kuayu
[root@web01 ~]# vim /code/kuayu/index.html
<html lang="en">
<head>
        <meta charset="UTF-8" />
        <title>测试ajax和跨域访问</title>
        <script src="http://libs.baidu.com/jquery/2.1.4/jquery.min.js"></script>
</head>
<script type="text/javascript">
$(document).ready(function(){
        $.ajax({
        type: "GET",
        url: "http://linux.beikuayu.com",
        success: function(data) {
                alert("sucess 卧槽 卧槽 卧槽 成功了!!!");
        },
        error: function() {
                alert("fail!!,跨不过去啊，不让进去啊，只能蹭蹭!");
        }
        });
});
</script>
        <body>
                <h1>测试跨域访问</h1>
        </body>
</html>
```

#### 3）配置hosts

```java
[root@web01 ~]# vim /etc/hosts
10.0.0.7 linux.beikuayu.com
10.0.0.8 linux.beikuayu.com
[root@web02 ~]# vim /etc/hosts
10.0.0.7 linux.beikuayu.com
10.0.0.8 linux.beikuayu.com
#配置windows的hosts
10.0.0.7 linux.kuayu.com
```

#### 4）配置允许跨域访问

```java
[root@web02 /etc/nginx/conf.d]# vim beikuayu.conf 
server {
    listen 80;
    server_name linux.beikuayu.com;
    root /code/beikuayu;
    index index.html;
    location ~* \.html$ {
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods GET,POST,PUT,DELETE,OPTIONS;
    }
}
```

## 六、配置cpu亲和

### 1.方式一

```java
worker_processes  16; 
worker_cpu_affinity 0000000000000001 0000000000000010 0000000000000100 0000000000001000 0000000000010000 0000000000100000 
0000000001000000 0000000010000000 0000000100000000 0000001000000000 0000010000000000 0000100000000000 0001000000000000 0010000000000000 0100000000000000 1000000000000000;
```

### 2.方式二

```java
worker_processes  2; 
#worker_cpu_affinity 01 10;
#worker_cpu_affinity 0101 1010;
worker_cpu_affinity 010101 101010;
```

### 3.方式三

```java
worker_processes  auto; 
worker_cpu_affinity auto;
```

### 4.配置完cpu亲和查看进程绑定

```java
[root@web02 ~]# ps -eo pid,args,psr | grep [n]ginx
  7024 nginx: master process /usr/   1
  7025 nginx: worker process         0
  7026 nginx: worker process         1
  7027 nginx: worker process         2
  7028 nginx: worker process         3
```

## 七、nginx优化部分完整配置文件

### 1.nginx企业配置文件

```java
[root@nginx ~]# cat nginx.conf
user www;											#nginx启动用户
worker_processes auto;								#worker进程数
worker_cpu_affinity auto;							#开启亲和
error_log /var/log/nginx/error.log warn;			错误日志 存放位置 日志级别
pid /run/nginx.pid;									#指定pid文件存放路径
worker_rlimit_nofile 35535;							#nginx的最大文件描述
events {
    use epoll;										#使用epoll网络模型
    worker_connections 10240;						 worker进程最大连接数
}
http {
    include             mime.types;						#nginx识别的文件类型
    default_type        application/octet-stream;		#如果不识别，默认下载
    charset utf-8;									 字符集
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';			#定义日志格式
    access_log  /var/log/nginx/access.log  main;		#指定访问日志路径  日志格式
    server_tokens off;								 隐藏nginx版本号
    client_max_body_size 200m;						 上传文件大小
    sendfile            on;							 高效读取
    tcp_nopush          on;							 高效传输
   tcp_nodelay         on;							 实时传输
    keepalive_timeout   65;							 开启长连接
    gzip on;										#开启压缩
    gzip_disable "MSIE [1-6]\.";					 IE浏览器不压缩
    gzip_http_version 1.1;							 gzip传输协议
    gzip_comp_level 4;								压缩级别
    gzip_buffers 16 8k;								压缩缓存
    gzip_min_length 1024;							最小压缩的文件大小
    gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript image/jpeg;			#需要压缩的文件
    include /etc/nginx/conf.d/*.conf;				 包含的配置文件
}
```

```java
[root@nginx ~]# cat nginx.conf
user www;
worker_processes auto;
worker_cpu_affinity auto;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;
worker_rlimit_nofile 35535;
events {
    use epoll;
    worker_connections 10240;
}
http {
    include             mime.types;
    default_type        application/octet-stream;
    charset utf-8;
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    access_log  /var/log/nginx/access.log  main;
    server_tokens off;
    client_max_body_size 200m;
    sendfile            on;
    tcp_nopush          on;
   tcp_nodelay         on;
    keepalive_timeout   65;
    gzip on;
    gzip_disable "MSIE [1-6]\.";
    gzip_http_version 1.1;
    gzip_comp_level 2;
    gzip_buffers 16 8k;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript image/jpeg;
    include /etc/nginx/conf.d/*.conf;
}
```

### 2.nginx优化总结

```java
1、CPU亲和、worker进程数、调整nginx进程打开的文件句柄数
2、使用Epool网络模型、调整每个worker进程的最大连接数
3、文件的高效读取sendfile、nopush
4、文件的传输实时性、nodealy
5、开启tcp长连接，以及长连接超时时间keepalive_timeout
6、开启文件传输压缩gzip
7、开启静态文件expires缓存
8、隐藏nginx版本号
9、禁止通过ip地址访问，禁止恶意域名解析，只允许域名访问
10、配置防盗链、以及跨域访问
11、防DDOS、cc攻击，限制单IP并发连接，以及http请求
12、优雅显示nginx错误页面
13、nginx加密传输https优化
14、nginx proxy_cache、fastcgi_cache、uwsgi_cache 代理缓存，第三方工具（squid、varnish）
```

## 八、PHP优化

### 1.配置PHP页面

```java
[root@web02 ~]# vim /etc/nginx/conf.d/php.conf
server {
    listen 80;
    server_name linux.php.com;
    root /code/php;
    index index.php;
    location ~* \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
#配置站点
[root@web02 ~]# vim /code/php/index.php 
<?php
    phpinfo();
```

### 2.php.ini配置文件优化

```java
#;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
#; Error handling and logging ;
#;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
expose_php = Off                        关闭php版本信息
display_error = Off                     屏幕不显示错误日志（开发环境可以开启 on）
error_reporting = E_ALL                 记录PHP的每个错误
log_errors = On                         开启错误日志
error_log = /var/log/php_error.log      错误日志写入的位置（程序处理代码时的错误）
date.timezone = Asia/Shanghai           调整时区,默认PRC
#;;;;;;;;;;;;;;;;
#; File Uploads ;
#;;;;;;;;;;;;;;;;
file_uploads = On           允许文件上传
upload_max_filesize = 300M  允许上传文件的最大大小
post_max_size = 300M        允许客户端单个POST请求发送的最大数据
max_file_uploads = 20       允许同时上传的文件的最大数量
memory_limit = 128M         每个脚本执行最大内存
```

### 3.PHP危险函数

```java
有时候为了安全我们需要禁掉一些PHP危险函数，整理如下需要的朋友可以参考下 
phpinfo() 
功能描述：输出 PHP 环境信息以及相关的模块、WEB 环境等信息。 
危险等级：中
passthru() 
功能描述：允许执行一个外部程序并回显输出，类似于 exec()。 
危险等级：高
exec() 
功能描述：允许执行一个外部程序（如 UNIX Shell 或 CMD 命令等）。 
危险等级：高
system() 
功能描述：允许执行一个外部程序并回显输出，类似于 passthru()。 
危险等级：高
chroot() 
功能描述：可改变当前 PHP 进程的工作根目录，仅当系统支持 CLI 模式 
PHP 时才能工作，且该函数不适用于 Windows 系统。 
危险等级：高
scandir() 
功能描述：列出指定路径中的文件和目录。 
危险等级：中
chgrp() 
功能描述：改变文件或目录所属的用户组。 
危险等级：高
chown() 
功能描述：改变文件或目录的所有者。 
危险等级：高
shell_exec() 
功能描述：通过 Shell 执行命令，并将执行结果作为字符串返回。 
危险等级：高
proc_open() 
功能描述：执行一个命令并打开文件指针用于读取以及写入。 
危险等级：高
proc_get_status() 
功能描述：获取使用 proc_open() 所打开进程的信息。 
危险等级：高
error_log() 
功能描述：将错误信息发送到指定位置（文件）。 
安全备注：在某些版本的 PHP 中，可使用 error_log() 绕过 PHP safe mode， 
执行任意命令。 
危险等级：低
ini_alter() 
功能描述：是 ini_set() 函数的一个别名函数，功能与 ini_set() 相同。 
具体参见 ini_set()。 
危险等级：高
ini_set() 
功能描述：可用于修改、设置 PHP 环境配置参数。 
危险等级：高
ini_restore() 
功能描述：可用于恢复 PHP 环境配置参数到其初始值。 
危险等级：高
dl() 
功能描述：在 PHP 进行运行过程当中（而非启动时）加载一个 PHP 外部模块。 
危险等级：高
pfsockopen() 
功能描述：建立一个 Internet 或 UNIX 域的 socket 持久连接。 
危险等级：高
syslog() 
功能描述：可调用 UNIX 系统的系统层 syslog() 函数。 
危险等级：中
readlink() 
功能描述：返回符号连接指向的目标文件内容。 
危险等级：中
symlink() 
功能描述：在 UNIX 系统中建立一个符号链接。 
危险等级：高
popen() 
功能描述：可通过 popen() 的参数传递一条命令，并对 popen() 所打开的文件进行执行。 
危险等级：高
stream_socket_server() 
功能描述：建立一个 Internet 或 UNIX 服务器连接。 
危险等级：中
putenv() 
功能描述：用于在 PHP 运行时改变系统字符集环境。在低于 5.2.6 版本的 PHP 中，可利用该函数 
修改系统字符集环境后，利用 sendmail 指令发送特殊参数执行系统 SHELL 命令。 
危险等级：高
禁用方法如下： 
打开/etc/php.ini文件， 
查找到 disable_functions ，添加需禁用的函数名，如下： 
phpinfo,eval,passthru,exec,system,chroot,scandir,chgrp,chown,shell_exec,proc_open,proc_get_status,ini_alter,ini_alter,ini_restore,dl,p
```

### 4.php-fpm服务配置

##### 1）php-fpm.conf配置优化

```java
[root@web02 ~]# vim /etc/php-fpm.conf
[global]
;pid = /var/log/php-fpm/php-fpm.pid     	#pid文件存放的位置
;error_log = /var/log/php-fpm/php-fpm.log  错误日志存放的位置（启动时的日志）
;log_level = error                  	#日志级别, alert, error, warning, notice, debug
rlimit_files = 65535                	#php-fpm进程能打开的文件句柄数
;events.mechanism = epoll           	#使用epoll事件模型处理请求
include=/etc/php-fpm.d/*.conf
```

##### 2）包含配置文件优化

```java
[root@web02 ~]# vim /etc/php-fpm.d/www.conf
[www]       				  池名称
user = www  				  进程运行的用户
group = www 				  进程运行的组
;listen = /dev/shm/php-fpm.sock监听在本地socket文件
listen = 127.0.0.1:9000        监听在本地tcp的9000端口
;listen.allowed_clients = 127.0.0.1允许访问FastCGI进程的IP，any不限制 
pm = dynamic                   管理方式（dynamic为动态，static为静态）
pm.max_children = 512          最大启动的php-fpm进程数（静态管理，配置dynamic时失效）
pm.start_servers = 32          动态方式下的起始php-fpm进程数量。
pm.min_spare_servers = 32      动态方式下的最小php-fpm进程数量。
pm.max_spare_servers = 64      动态方式下的最大php-fpm进程数量。
pm.max_requests = 1500         达到这个请求数，子进程会重启，如果是0那就一直接受请求
pm.process_idle_timeout = 15s; 没有请求时多久释放一个进程
pm.status_path = /phpfpm_status开启php的状态页面
php_flag[display_errors] = off
php_admin_value[error_log] = /var/log/phpfpm_error.log
php_admin_flag[log_errors] = on
request_slowlog_timeout = 5s   php脚本执行超过5s的文件
slowlog = /var/log/php_slow.log记录至该文件中
```

### 5.php状态页

##### 1）配置php

```java
[root@web02 ~]# vim /etc/php-fpm.d/www.conf
pm.status_path = /phpfpm_status 		#开启php的状态页面
[root@web02 ~]# systemctl restart php-fpm
```

##### 2）配置nginx

```java
[root@web02 ~]# cat /etc/nginx/conf.d/php.conf
server {
	listen 80;
	server_name linux.php.com;
	root /code/php;
	index index.php;
	location ~* \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
	}
	location /status {
		stub_status;
	}
	location /php_status {
		fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
	}	
}
```

##### 3）访问页面

```java
#访问  http://linux.php.com/php_status
pool:                 www							#池名称
process manager:      dynamic						#动态管理
start time:           14/Sep/2020:18:52:12 +0800	 启动时间
start since:          14							#启动了多久
accepted conn:        1								#连接数
listen queue:         0								#等待队列
max listen queue:     0								#最大等待队列
listen queue len:     511							#等待队列长度
idle processes:       4								#空闲的进程数
active processes:     1								#活跃的进程数
total processes:      5								#总的进程数
max active processes: 1								#最大的活跃进程数
max children reached: 0								#进程最大的限制连接数
slow requests:        0								#慢查询
```

## 九、优化总结

```java
1.nginx
	1）硬件	nginx做代理比较消耗CPU，如果做静态资源处理要考虑磁盘和IO
	2）网络
	3）系统
	4）应用	nginx做代理，开启长连接
	5）服务	nginx处理静态资源做缓存，做压缩，防盗链，跨域访问
2.php
	1）php.ini		文件上传，访问日志
	2）php-fpm.conf		php状态页面，PHP慢查询
```
