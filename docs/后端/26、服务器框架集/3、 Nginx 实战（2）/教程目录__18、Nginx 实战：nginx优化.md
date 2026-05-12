# 18、Nginx 实战：nginx优化
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/18.html
- 分类：服务器框架
- 分组：教程目录
## 一.性能优化概述

基询imm能优化,那么在性能优化这一章,我们将分为如下几个方面做介绍

**1、** 首先我们需要了解性能优化要考虑哪些方面；

**2、** 然后我们需要了解性能优化必须要用到的压力测试工具ab；

**3、** 最后我们需要了解系统上有哪些注意和优化点，以及Nginx配置文件；

我们在做性能优化工作前,我们重点需要考虑哪些方面,和了解哪些方面。

**1、** 首先需要了解我们当前系统结构和瓶颈,了解当前使用的是什么,运行的是什么业务,都有哪些服务，了解每个服务最大能支撑多大并发比如Nginx作为静态资源服务的并发是多少,最高支持多少qps（每秒查询率）的访问请求,那我们怎么得出这组系统结构瓶颈呢,比top查看系统负载的CPU、内存使用率、总的运行进程等,也可以通过曰志去分析请求的情况,当然也可以通过我们前面介绍到stub_status模块查看当前的连接情况,也可以对线上的业务进行压力测试（低峰期）,去了解当前这套系统能承担多少的请求和并发,以做好相应的评估这个是我们做性能优化最先考虑的地方；

**2、** 其次我们需要了解业务模式,虽然我们是做性能优化,但每一个性能的优化都是为业务所提供服务的，我们需要了解每个业务接口的类型,比如:电商网站中的抢购模式,这种情况下面,平时没什么流量,但到了抢购时间流量会突增；

我们还需要了解系统层次化的结构,比如:我们使用Nginx做的是代理、还是动静分离，还是后端直接服务用户,那么这个就需要我们对每一层做好相应的梳理，以便更好的服务业务。

**3、** 最后我们考虑性能与安全,往往注重了性能,但是忽略了安全往往过于注重安全,性能又会产生影响比如:我们在设计防火墙功能时,检测过于严密,这样就会给性能带来影响那么如果对性能完全追求,却不顾服务的安全,这个也会造成很大的隐患,所以需要评估好两者的关系,把握好两者的孰重孰轻以及整体的相关性,权衡好对应的点；

总结：

**1、** 系统结构和瓶颈；

**2、** 分析，压力测试工具ab、stub_status；

**3、** 了解业务模式；

**4、** 了解系统层次化的结构；

**5、** 性能与安全；

OSI[flag]

硬件代理(CPU) 静态(磁盘IO) 动态(cpu、内存)

网络

系统文件描述符(文件句柄)

应用服务于服务保持长连接 http1.1

服务静态资源服务优化

## 二.压力测试工具

在系统业务量没有增长之前,我们就要做好相应的准备工作,已防患业务量突增带来的接口压力,所以对于接口压力测试就显非常重要了。我们首先要评估好系统压力,然后使用工具检测当前系统情况,是否能满足对应压力的需求。

## 2.1.安装压力测试工具

```java
[root@web01 ~]# yum install httpd-tools -yum
```

## 2.2.了解压力测试工具的使用方式

```java
[root@web01 ~]# ab -n 200 -c 2 http://127.0.0.1/
-n   总的请求次数
-c   并发请求次数
-k   是否开启长连接
[root@web01 conf.d]# ab
ab: wrong number of arguments
Usage: ab [options] [http[s]://]hostname[:port]/path
```

## 2.3.配置Nginx静态网站和tomcat动态网站环境

```java
[root@web01 conf.d]# cat jsp.conf 
server {
        server_name _;
        listen 80;
        location / {
                root /code;
                try_files $uri @java_page;
        }
        location @java_page{
                proxy_pass http://127.0.0.1:8080;
        }
}
#分别给Nginx准备静态网站
[root@web01 ~]# cat /code/tt.html
Nginx Ab Load
#重启nginx
[root@web01 ~]# systemctl restart nginx
#进行压力测试
[root@web01 conf.d]# ab  -n100000 -c200 http://127.0.0.1/tt.html
[root@web01 conf.d]# ab -k -n100000 -c200 http://127.0.0.1/tt.html
#准备Tomcat网站
Tomcat
wget http://mirrors.hust.edu.cn/apache/tomcat/tomcat-9/v9.0.16/bin/apache-tomcat-9.0.16.tar.gz
tar xf apache-tomcat-9.0.16.tar.gz
cd  apache-tomcat-9.0.16/webapps/ROOT
echo "Tomcat Ab" > tt.html
../../bin/startup.sh
#进行压力测试
[root@web01 ~]# ab -k -n100000 -c200 http://127.0.0.1/tt.html
```

了解性能指标：

```java
1.网络
	网络的流量
	网络是否丟包
	这些会影http的请求与调用
2.系统
	硬件有没有磁盘损坏、磁盘速率
	系统负载、内存、系统稳定性
3.服务
	连接优化、请求优化
	根据业务形态做对应的服务设置
4.程序
	接口性能
	处理速度
	程序执行效率
5.数据库
每个服务与服务之间都或多或少有一些关联,我们需要将整个架构进行分层.找到对应系统或服务的短板，然后进行优化。
```

## 三.系统性能优化

文件句柄，Linux-切皆文件,文件句柄可以理解为就是一个索引,文件句柄会随着我们进程的调用频繁增加,系统默认文件句柄是有限制的,不能让一个进程无限的调用,所以我们需要限制每个进程和每个服务使用多大的文件句柄,文件句柄也是必须要调整的优化参数.

文件句柄的设置方式, 1.系统全局性修改。2.用户局部性修改。3.进行局部性修改

系统层面必须要调整

```java
	1.系统全局性修改。
	# *代表所有用户
	* soft nofile 25535
	* hard nofile 25535
	2.用户局部性修改。
	root soft nofile 65535
	root hard nofile 65535
	3.进程局部性修改
	worker_rlimit_nofile 65535;	#针对Nginx进程(核心模块)
```

## 四.调整内核参数：让time_wait状态重用(端口重用)[flag]

```java
[root@web01 ROOT]# vim /etc/sysctl.conf
	net.ipv4.tcp_tw_reuse = 1
	net.ipv4.tcp_timestamps = 1
[root@web01 ROOT]# sysctl -p
```

## 五.代理服务优化[flag]

通常Nginx作为代理服务,负责转发用户的请求,那么在转发过程中建议开启HTTP长连接，用于减少握手次数,降低服务器损耗。upstream keepalive说明

## 5.1.长连接语法示例(应用层面优化)

```java
Syntax: keepalive connections;
Default:-
Context: upstream
This directive appeared in version 1.1.4.
```

## 5.2.配置Nginx代理服务使用长连接方式

```java
upstream http_backend {
    server 127.0.0.1:8080;
    keepalive 16;  长连接
}
server {
    ...
    location /http/ {
        proxy_pass http://http_backend;
        proxy_http_version 1.1;        对于http协议应该指定为1.1
        proxy_set_header Connection "";清除“connection”头字段
		proxy_next_upstream error timeout http_500 http_502 http_503 http_504; 平滑过渡
		proxy_set_header Host $http_host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwared-For $proxy_add_x_forwarded_for;
		proxy_connect_timeout 30s;		# 代理连接web超时时间
		proxy_read_timeout 60s;			# 代理等待web响应超时时间
		proxy_send_timeout 60s;			# web回传数据至代理超时时间
		proxy_buffering on;				# 开启代理缓冲区,web回传数据至缓冲区,代理边收边传返回给客户端
		proxy_buffer_size 32k;			# 代理接收web响应的头信息的缓冲区大小
		proxy_buffers 4 128k;			# 缓冲代理接收单个长连接内包含的web响应的数量和大小
        ...
    }
}
```

## 5.3.对于fastcgi服务器，需要设置fastcgi_keep_conn以便保持长连接[flag]

```java
upstream fastcgi_backend {
    server 127.0.0.1:9000;
    keepalive 8;
}
server {
    ...
    location /fastcgi/ {
        fastcgi_pass fastcgi_backend;
		fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        fastcgi_keep_conn on;
		fastcgi_connect_timeout 60s;
		include fastcgi_params;
        ...
    }
}
```

## 5.4.keepalive_requests设置通过一个keepalive连接提供的最大请求数。在发出最大请求数后,将关闭连接。

```java
Syntax: keepalive_requests number;
Default: keepalive_requests 100;
Context: upstream
该指令出现&:1.15.3版中。
```

## 5.5.keepative_timeout设置超时,在此期间与代理服务器的空闲keepalive连接将保持打开状态。

```java
Syntax: keepalive_timeout timeout;
Default:keepalive_timeout 60s;
Context: upstream
#该指令出现在1.15.3版
```

注意:
**1、** scgi和uwsgi协议没有保持连接的概念；

**2、** 但无论是proxy、fastcgi、uwsgi协议都有cache缓存的功能，开启后可加速网站访问的效率（取决硬件）；

## 六、静态资源优化

nginx作为静态资源服务器，用于静态资源处理，传输非常的高效。

静态资源是指：非WEB服务器端运行处理而生成的文件

静态资源类型
种类

浏览器渲染
HTML、CSS, JS

图片文件
JPEG、GIF、PNG

讓文件
FLV、Mp4、AVI

其他文件
TXT、DOC、PDF、•••

## 6.1.静态资源缓存

浏览器缓存设置用于提高网站性能,尤其是新闻网站，图片一旦发布,改动的可能是非常小的。所以我们希望能否用户访问一次后,图片缓存在用户的浏览器长时间缓存。

浏览器是有自己的缓存机制,它是基于HTTP协议缓存机制来实现的,在HTTP协议中有很多头信息,那么实现浏览器的缓存就需要依赖特殊的头信息来与服务器进行特殊的验证，如:Expires (http/1.0) ；Cache-control (http/1.1)。

### 6.1.1.浏览器无缓存

### 6.1.2.浏览器有缓存

### 6.1.3.浏览器缓存过期校验检查机制,说明如下:

**1、** 浏览器请求服务器会先进行Expires、Cache-Control的检查,检查缓存是否过期.如果没有过期则直接从缓存文件中读取；

**2、** 如果缓存过期，首先检查是否存在etag,如果存在则客户端会向web服务器请求if-None-Match,与etag值进行比对,由服务器决策返回200还是304；

**3、** 如果etag不存在,则进last-Modified检查,客户瑞会向web服务器请求If-Moafied-Since,与last-Modified进行比对,由服务器决策返回200还是304；

**1、** 现在设置缓存10s中的时间10s到了缓存是不是应该过期；

浏览器If-None-Match "9-1550193224000"

询问web服务器 etag "9-1550193224000"

浏览器认为只是缓存过期，内容并没有修改，所以协商后还是304

浏览器If-Modified-Since Tue, 29 Jan 2019 02:29:51 GMT

询问web服务器 Last-Modified: Tue, 29 Jan 2019 02:29:51 GMT

浏览器认为只是缓存过期，内容并没有修改，所以协商后还是304

### 6.1.4.如何配置静态资源缓存expires

```java
作用：添加Cache-Control Expires头
Syntax: expires  [mondified]  time;
expires  epoch | max | off;
Default:expires  off;
Context: http，server，location，if in location
```

### 6.1.5.配置静态资源缓存场景

**1、** 开启浏览器缓存；

```java
server {
    listen 80;
    server_name static.bgx.com;
    location ~ .*\.(jpg|gif|png)$ {
        expires      7d;
    }
	location ~ .*\.(js|css)$ {
        expires      30d;
    }
}
```

**2、** 如果开发代码没有正式上线时，希望静态资源不被缓存；

```java
        location ~ \.*(png|jpg|gif|jpeg)$ {
                add_header Cache-Control no-store;
                add_header Pragma no-cache;
        }
}
```

## 6.2、静态资源读取

### 6.2.1.文件读取高效sendfile，如下图

```java
Syntax: sendfile on | off;
Default: sendfile off;
Context: http, server, location, if in location
```

传统读取文件方式\zS sendfile读取文件方式

### 6.2.2.将多个包一次发送,用于提升网络传输效率,大文件需要打开，需要开启sendfile 才行

```java
Syntax: tcp_nopush on | off;
Default: tcp_nopush off;
Context: http, server, location
```

### 6.2.3.提高网络传输实时性，需要开启keepalive

```java
Syntax: tcp_nodelay on | off;
Default: tcp_nodelay on;
Context: http, server, location
```

## 6.3、静态资源压缩

Nginx将响应报文发送至客户端之前启用压缩功能,然后进行传输,这能够有效地节约带宽,并提高响应至客户端的速度。

### 6.3.1、gzip传输压缩,传输前压缩,传输后解压

```java
Syntax: gzip on | off;
Default: gzip off;
Context: http, server, location, if in location
```

### 6.3.2、gzip压缩哪些类型的文件

```java
Syntax: gzip_types mime-type ...;
Default: gzip_types text/html;
Context: http, server, location
```

### 6.3.3、gzip压缩比率，加快传输，但压缩本身比较耗费服务端性能

```java
Syntax: gzip_comp_level level;
Default: gzip_comp_level  1;
Context: http, server, location
```

### 6.3.4、gzip压缩协议版本，压缩使用在http那个协议，主流选择1.1版本

```java
Syntax: gzip_http_version 1.0 | 1.1;
Default: gzip_http_version  1.1;
Context: http, server, location
```

### 6.3.5、静态图片配置压缩案例

```java
[root@Nginx conf.d]# cat static_server.conf 
server {
    listen 80;
    server_name static.oldboy.com;
    location ~*  .*\.(jpg|gif|png)$ {
        root /code/images;
        gzip on;
        gzip_http_version 1.1;
        gzip_comp_level 2;
        gzip_types  image/jpeg image/gif image/png;
        }
}
```

### 6.3.6、针对txt配置压缩案例

```java
[root@Nginx conf.d]# cat static_server.conf 
server {
    listen 80;
    server_name static.oldboy.com;
    sendfile on;
    location ~ .*\.(txt|xml|html|json|js|css)$ {
        gzip on;
        gzip_http_version 1.1;
        gzip_comp_level 1;
        gzip_types text/plain application/json application/x-javascript application/css application/xml text/javascript;
    }
}
```

## 6.4、防止资源盗链

防盗链,指的是防止资源被其他网站恶意盗用。

基础防盗链设置思路:主要是针对客户端请求过程中所携带的一些Header信息来验证请求的合法性,比如客户端在请求的过程中都会携带referer信息（referer会告诉服务器我是从哪一个页面过来的）。优点是规则简单,配置和使用都很方便,缺点是防盗链所依赖的Referer验证信息是可以伪造的,所以通过Referer信息防盗链并非100%可靠,但是它能够限制大部分的盗链情况。

```java
Syntax: valid_referers none | blocked | server_names | string ...;
Default: -
Context: server, location
#none：Referer来源头部为空的情况
#blocked：Referer来源头部不为空，这些值都不以http://或者https://开头
#server_names：来源头部包含当前的域名，可以正则匹配
```

### 6.4.1、提供资源的服务器：10.0.0.8 www.linanxi.fun

**1、** 配置Nginx；

```java
[root@web02 conf.d]# cat static.conf 
server {
	listen 80;
	server_name www.linanxi.fun;
	root /code;
	location / {
		index index.html;
	}
}
```

**2、** 上传2张图片；

一张是可以被盗链的图片

一张是广告位的图片：此图为了rewrite给盗链的人

**3、** 重启服务器；

```java
[root@web02 code]# systemctl restart nginx
```

### 6.4.2、盗链服务器10.0.0.7 dl.oldboy.com

**1、** 配置Nginx；

```java
[root@web01 conf.d]# cat try.conf
server {
	server_name dl.oldboy.com;
	listen 80;
	root /code;
	location / {
		index index.html;
	}
}
```

**2、** 在盗链服务器上，配置盗链的页面，偷取www.linanxi.fun网站上的图片；

```java
[root@web01 code]# cat /code/tt.html
<html>
<head>
    <meta charset="utf-8">
    <title>oldboyedu.com</title>
</head>
<body style="background-color:red;">
    <img src="http://www.linanxi.fun/smg.jpg"/>  根据情况修改你的服务器地址
</body>
</html>
```

### 6.4.3、在10.0.0.8 添加防盗链操作

```java
location ~* \.(gif|jpg|png|bmp)$ {
  valid_referers none blocked *.linanxi.fun;
  if ($invalid_referer) {
      return 403;						#可以选择直接返回403
      rewrite ^(.*)$ /ggw.png break;		#也可以选择返回一张水印的图片，给公司做广告
  }
```

以上配置的含义，所有来自linanxi.fun都可以访问到当前站点的图片，如果来源域名不在这个列表中，那么$invalid_referer等于1，在if语句中返回一个403给用户，这样用户就会看到一个403页面。

### 6.4.4、如果需要谷歌、百度等使用（盗链）我们的资源，需要如下操作：

```java
location ~* \.(gif|jpg|png|bmp)$ {
  valid_referers none blocked *.linanxi.fun  server_name  ~\.google\.  ~\.baidu\.;
  if ($invalid_referer) {
      return 403;						#可以选择直接返回403
      rewrite ^(.*)$ /ggw.png break;		#也可以选择返回一张水印的图片，给公司做广告
  }
```

## 6.5、跨站访问

什么是跨站访问,当我们通过浏览器访问a网站时,同时会利用到ajax或其他方式，同时也请求b网站,这样的话就出现了请求一个页面,使用了2个域名,这种方式对浏览器来说默认是禁止。

那Nginx允许跨站访问与浏览器有什么关系呢,因为浏览器会读取Access-Control-Allow-Origin的头信息,如果服务端允许,则浏览器不会进行拦截。

```java
Syntax: add_header name value [always]；
Default: 一
Context: http，server，location，if in location
```

**1、** 在a网站上准备跨站访问的文件；

```java
[root@Nginx ~]# cat /code/http_origin.html 
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
        url: "http://fj.xuliangwei.com/public/tt.html",			#调用的也是b网站
        success: function(data) {
                alert("sucess!!!");
        },
        error: function() {
                alert("fail!!,请刷新再试!");
        }
        });
});
</script>
        <body>
                <h1>测试跨域访问</h1>
        </body>
</html>
```

**2、** 准备b网站；

**3、** 通过浏览器测试跨域访问；

**4、** 在b网站上允许a网站跨域访问；

```java
[root@Nginx conf.d]# cat fj.xuliangwei.com.conf 
location ~ .*\.(html|htm)$ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods GET,POST,PUT,DELETE,OPTIONS;
}
```

## 6.6、cpu亲和配置

CPU亲和(affinity)减少进程之间不断频繁切换,减少性能损耗,其实现原理是将CPU核心和Nginx工作进程绑定方式,把每个worker进程固定对应的cpu上执行,减少切换cpu的cache miss,获得更好的性能。

**1、** 查看当前CPU物理状态；

```java
[root@nginx ~]# lscpu |grep "CPU(s)"
CPU(s):                24				#总的核心数
On-line CPU(s) list:   0-23
NUMA node0 CPU(s):     0,2,4,6,8,10,12,14,16,18,20,22
NUMA node1 CPU(s):     1,3,5,7,9,11,13,15,17,19,21,23
```

每个物理cpu使用的是那些核心（代表2颗物理CPU，）

本次演示服务器为 两颗物理cpu，每颗物理CPU12个核心, 总共有24个核心

**2、** 将Nginxworker进程绑定到不同的核心上；

```java
#最佳方式，修改nginx启动的work进程为自动。
worker_processes  auto;
worker_cpu_affinity auto;
```

```java
不推荐调整的方式
	# 第一种绑定组合方式
	worker_processes 24;
	worker_cpu_affinity 000000000001 000000000010 000000000100 000000001000 000000010000 000000100000 000001000000 000010000000 000100000000 001000000000 010000000000 10000000000;
	# 第二种方式(使用较少)
	worker_processes 2;
	worker_cpu_affinity 101010101010 010101010101;
```

**3、** 查看nginxworker进程绑定至对应的CPU；

```java
[root@web01 ~]# ps -eo pid,args,psr|grep [n]ginx
  1242 nginx: master process /usr/   2
  1243 nginx: worker process         0
  1244 nginx: worker process         1
  1245 nginx: worker process         2
  1246 nginx: worker process         3  
```

## 6.7、Nginx通用配置

Nginx通用配置 / Nginx代理相关配置 / Nginx Fastcgi可以写三个模板。

**Nginx主配置文件：**

```java
[root@nginx ~]# cat nginx.conf
user www;                  		 nginx进程启动用户
worker_processes auto;    	与cpu核心一致即可
worker_cpu_affinity auto;   	 cpu亲和
error_log /var/log/nginx/error.log warn;    错误日志
pid /run/nginx.pid;
worker_rlimit_nofile 35535;    每个work能打开的文件描述符，调整至1w以上,负荷较高建议2-3w
events {
    use epoll;                  使用epoll高效网络模型
    worker_connections 10240;   限制每个进程能处理多少个连接，10240x[cpu核心]
}
http {
    include             mime.types;
    default_type        application/octet-stream;
    charset utf-8;      统一使用utf-8字符集
   定义日志格式
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    access_log  /var/log/nginx/access.log  main;    访问日志
    server_tokens off;  禁止浏览器显示nginx版本号
    client_max_body_size 200m;  文件上传大小限制调整
   文件高效传输，静态资源服务器建议打开
    sendfile            on;
    tcp_nopush          on;
    文件实时传输，动态资源服务建议打开,需要打开keepalive
    tcp_nodelay         on;
    keepalive_timeout   65;
    Gzip 压缩
    gzip on;
    gzip_disable "MSIE [1-6]\.";
    gzip_http_version 1.1;
	gzip_comp_level 2;
    gzip_buffers 16 8k;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml applicati
on/xml+rss text/javascript image/jpeg;
    虚拟主机
    include /etc/nginx/conf.d/*.conf;
} 
```

## 七、Nginx安全与优化总结

```java
1.cpu亲和、worker进程数、调整每个worker进程打开的文件数
2.使用epool网络模型、调整每个worker进程的最大连接数
3.文件的高效读取sendfile、nopush、
4.文件的传输实时性、nodealy
5.开启tcp长链接、以及长链接超时时间keepalived
6.开启文件传输压缩gzip
7.开启静态文件expires缓存
8.隐藏Nginx的版本号
9.禁止通过IP地址访问,禁止恶意域名解析,只允许域名访问
10.配置放盗链、以及跨域访问
11.防DDOS、cc攻击, 限制单IP并发连接，以及http请求
12.优雅限制nginx错误页面
13.nginx加密传输https优化
14.nginx proxy_cache、fastcgi_cache、uwsgi_cache缓存
			squid、varnish()
```

## 八、PHP服务优化

## 8.1.php程序配置管理文件/etc/php.ini，主要调整日志、文件上传、禁止危险函数、关闭版本号显示等

```java
#;;;;;;;;;;;;;;;;;
# Error  logging ; 错误日志设置
#;;;;;;;;;;;;;;;;;
expose_php = Off                        关闭php版本信息
display_error = Off                     屏幕不显示错误日志
error_reporting = E_ALL                 记录PHP的每个错误
log_errors = On                         开启错误日志
error_log = /var/log/php_error.log      错误日志写入的位置
date.timezone = Asia/Shanghai           调整时区,默认PRC
#;;;;;;;;;;;;;;;
# File Uploads ;   文件上传设置
#;;;;;;;;;;;;;;;
file_uploads = On           允许文件上传
upload_max_filesize = 300M  允许上传文件的最大大小
post_max_size = 300M        允许客户端单个POST请求发送的最大数据
max_file_uploads = 20       允许同时上传的文件的最大数量
memory_limit = 128M         每个脚本执行最大内存
[Session]		#会话共享
session.save_handler = redis
session.save_path = "tcp://172.16.1.51:6379"
```

禁止危险函数的详细讲解：[https://blog.csdn.net/unixtech/article/details/53761832](https://blog.csdn.net/unixtech/article/details/53761832)

php禁止危险函数执行（取决于实际情况，需要和开发沟通）

disable_functions = chown,chmod,pfsockopen,phpinfo

## 8.2.php-fpm进程管理配置文件/etc/php-fpm.conf

```java
#第一部分，fpm配置
;include=etc/fpm.d/*.conf
#第二部分，全局配置
[global]
;pid = /var/log/php-fpm/php-fpm.pid    pid文件存放的位置
;error_log = /var/log/php-fpm/php-fpm.log  错误日志存放的位置
;log_level = error 日志级别, alert, error, warning, notice, debug
rlimit_files = 65535    php-fpm进程能打开的文件数
;events.mechanism = epoll使用epoll事件模型处理请求
#第三部分，进程池定义
[www]      池名称
user = www 进程运行的用户
group = www进程运行的组
;listen = /dev/shm/php-fpm.sock监听在本地socket文件
listen = 127.0.0.1:9000        监听在本地tcp的9000端口
;listen.allowed_clients = 127.0.0.1允许访问FastCGI进程的IP，any不限制 
pm = dynamic                    	动态调节php-fpm的进程数
pm.max_children = 512          最大启动的php-fpm进程数
pm.start_servers = 32          	初始启动的php-fpm进程数
pm.min_spare_servers = 32   最少的空闲php-fpm进程数
pm.max_spare_servers = 64  最大的空闲php-fpm进程数
pm.max_requests = 1500       每一个进程能响应的请求数
pm.process_idle_timeout = 15s;
pm.status_path = /phpfpm_status开启php的状态页面
#第四部分，日志相关
php_flag[display_errors] = off
php_admin_value[error_log] = /var/log/phpfpm_error.log
php_admin_flag[log_errors] = on
#慢日志
request_slowlog_timeout = 5s   php脚本执行超过5s的文件
slowlog = /var/log/php_slow.log记录至该文件中
慢日志示例
[21-Nov-2013 14:30:38] [pool www] pid 11877
script_filename = /usr/local/lnmp/nginx/html/www.quancha.cn/www/fyzb.php
[0xb70fb88c] file_get_contents() /usr/local/lnmp/nginx/html/www.quancha.cn/www/fyzb.php:2
```

## 8.3、php-fpm监控模块，用于监控php-fpm状态使用

```java
[root@nginx ~]# vim /etc/php-fpm.d/www.conf
pm.status_path = /phpfpm_status开启php的状态页面
#修改nginx配置：加一个location
新增配置如下：
location /phpfpm_status {
fastcgi_pass 127.0.0.1:9000;
fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
include	fastcgi_params;
}
状态显示如下：
[root@nginx ~]# curl http://127.0.0.1/phpfpm_status
pool:                 www          fpm池名称,大多数为www
process manager:      dynamic      动态管理phpfpm进程
start time:           05/Jul/2016  启动时间，如果重启会发生变化
start since:          409          php-fpm运行时间
accepted conn:        22           当前池接受的连接数
listen queue:         0    请求等待队列,如果这个值不为0,那么需要增加FPM的进程数量
max listen queue:     0    请求等待队列最高的数量
listen queue len:     128  请求等待队列的长度
idle processes:       4    php-fpm空闲的进程数量
active processes:     1    php-fpm活跃的进程数量
total processes:      5    php-fpm总的进程数量
max active processes: 2    php-fpm最大活跃的进程数量(FPM启动开始计算)
max children reached: 0    进程最大数量限制的次数，如果数量不为0，则说明phpfpm最大进程数量过小,可以适当调整。
```

## 8.4、PHP-FPM配置文件 4核16G、4核32G

```java
[root@nginx ~]# cat /etc/php-fpm.d/www.conf
[global]
pid = /var/run/php-fpm.pid
error_log = /var/log/php-fpm.log
log_level = warning
rlimit_files = 655350
events.mechanism = epoll
[www]
user = nginx
group = nginx
listen = 127.0.0.1:9000
listen.allowed_clients = 127.0.0.1
pm = dynamic
pm.max_children = 512
pm.start_servers = 32
pm.min_spare_servers = 32
pm.max_spare_servers = 64
pm.process_idle_timeout = 15s;
pm.max_requests = 2048
pm.status_path = /phpfpm_status
#php-www模块错误日志
php_flag[display_errors] = off
php_admin_value[error_log] = /var/log/php/php-www.log
php_admin_flag[log_errors] = on
#php慢查询日志
request_slowlog_timeout = 5s
slowlog = /var/log/php-slow.log
```

## 九、总结：

nginx

```java
	硬件层面		代理比较的消耗CPU、内存、          静态比较消耗磁盘IO、
	网络层面    	网络带宽大小、传输速率、是否有丢包、
	系统层面    	调整文件描述。  timewait重用
	应用层面    	nginx作为代理    keepalive 长连接
	服务层面    	nginx作为静态    浏览器缓存、文件传输、压缩、防盗链、跨域访问、CPU亲和
				nginx作为缓存    proxy_cache fastcgi_cache uwsgi_cache
				nginx作为安全	 nginx+lua实现waf防火墙
```

php

```java
	php.ini		错误日志记录、文件大小的调整、session会话共享的配置、禁止不必要的函数(与开发协商)
	php-fpm		监听地址、进程的动态调节、日志开启。
	php状态		php自身监控的状态信息
	php慢查询	什么时间、什么进程、运行什么文件、哪个函数、第几行达到了超时时间
```
