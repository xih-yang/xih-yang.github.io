# 09、Nginx 实战：Nginx常用模块
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/9.html
- 分类：服务器框架
- 分组：教程目录
## 一、概述

nginx模块分为两种，官方和第三方，我们通过命令 nginx -V 查看 nginx已经安装的模块！

```java
# 示例：
[root@stg-databridge001 ~]$ nginx -V
nginx version: nginx/1.20.0
built by gcc 4.8.5 20150623 (Red Hat 4.8.5-44) (GCC) 
built with OpenSSL 1.0.2k-fips  26 Jan 2017
TLS SNI support enabled
configure arguments: --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-compat --with-file-aio --with-threads --with-http_addition_module --with-http_auth_request_module --with-http_dav_module --with-http_flv_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_mp4_module --with-http_random_index_module --with-http_realip_module --with-http_secure_link_module --with-http_slice_module --with-http_ssl_module --with-http_stub_status_module --with-http_sub_module --with-http_v2_module --with-mail --with-mail_ssl_module --with-stream --with-stream_realip_module --with-stream_ssl_module --with-stream_ssl_preread_module --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic -fPIC' --with-ld-opt='-Wl,-z,relro -Wl,-z,now -pie'
```

## 二、Nginx常用模块类型

Nginx模块名称
模块作用

ngx_http_autoindex_module
用于自动生成目录列表.

ngx_http_access_module
四层基于IP的访问控制，可以通过匹配客户端源IP地址进行限制

ngx_http_auth_basic_module
可以使你使用用户名和密码基于 HTTP 基本认证方法来保护你的站点或其部分内容

ngx_http_stub_status_module
状态统计模块

ngx_http_gzip_module
文件的压缩功能

ngx_http_gzip_static_module
静态压缩模块

ngx_http_ssl_module
nginx 的https 功能

ngx_http_rewrite_module
重定向模块，解析和处理rewrite请求

ngx_http_referer_module
防盗链功能，基于访问安全考虑

ngx_http_proxy_module
将客户端的请求以http协议转发至指定服务器进行处理

ngx_stream_proxy_module
tcp负载，将客户端的请求以tcp协议转发至指定服务器处理

ngx_http_fastcgi_module
将客户端对php的请求以fastcgi协议转发至指定服务器助理

ngx_http_uwsgi_module
将客户端对Python的请求以uwsgi协议转发至指定服务器处理

ngx_http_headers_module
可以实现对头部报文添加指定的key与值

ngx_http_upstream_module
负载均衡模块，提供服务器分组转发、权重分配、状态监测、调度算法等高级功能

ngx_stream_upstream_module
后端服务器分组转发、权重分配、状态监测、调度算法等高级功能

ngx_http_fastcgi_module
实现通过fastcgi协议将指定的客户端请求转发至php-fpm处理

ngx_http_flv_module
为flv伪流媒体服务端提供支持

## 三、Nginx模块之HttpAutoindex模块

```java
ngx_http_autoindex_module只在 ngx_http_index_module模块未找到索引文件时发出请求。
```

### 1.参数选项

```java
#1.autoindex 激活/关闭自动索引
syntax: autoindex [ on|off ]
default: autoindex off
context: http, server, location
#2.autoindex_exact_size 设定索引时文件大小的单位(B,KB, MB 或 GB)
syntax: autoindex_exact_size [ on|off ]
default: autoindex_exact_size on
context: http, server, location
#3.autoindex_localtime 开启以本地时间来显示文件时间的功能。默认为关（GMT时间）
syntax: autoindex_localtime [ on|off ]
default: autoindex_localtime off
context: http, server, location
```

### 2.配置示例

```java
[root@web02 /etc/nginx/conf.d]# vim test.conf 
server {
    listen 80;
    server_name www.test.com;
    location / {
        root /code;
        index index.html;
    }
    location /download {
        root /code;
        index index.html;
        autoindex on;
        autoindex_exact_size on;
        autoindex_localtime off;
    }
}
```

## 四、Nginx模块之HttpAccess模块

```java
ngx_http_access_module 模块使有可能对特定IP客户端进行控制. 规则检查按照第一次匹配的顺序
```

### 1.参数选项

```java
#1.allow 描述的网络地址有权直接访问
syntax: allow [ address | CIDR | all ]
default: no
context: http, server, location, limit_except
#2.deny 描述的网络地址拒绝访问
syntax: deny [ address | CIDR | all ]
default: no
context: http, server, location, limit_except
```

### 2.配置示例

```java
[root@web02 /etc/nginx/conf.d]# vim test.conf 
server {
    listen 80;
    server_name www.test.com;
    location / {
        root /code;
        index index.html;
    }
    location /download {
        root /code;
        index index.html;
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
        allow 10.0.0.0/24;
        deny 10.0.0.1;
        deny all;
    }
}
ps:在上面的例子中,仅允许网段 10.0.0.0/24中除 10.0.0.1之外的ip访问。当执行很多规则时,最好使用 ngx_http_geo_module 模块.
```

## 五、Nginx模块之HttpAuthBasic模块

```java
该模块可以使你使用用户名和密码基于 HTTP 基本认证方法来保护你的站点或其部分内容.
```

### 1.参数选项

```java
#1.auth_basic 该指令包含用于 HTTP 基本认证 的测试名和密码。分配的参数用于认证领域。值 "off" 可以使其覆盖来自上层指令的继承性。
syntax： auth_basic [ text|off ]
default: auth_basic off
context: http, server, location, limit_except
#2.auth_basic_user_file
syntax： auth_basic_user_file the_file
default: no
context: http, server, location, limit_except
```

### 2.配置示例

```java
#生成密码文件
[root@web02 /etc/nginx/conf.d]# htpasswd -c /etc/nginx/auth_basic lhd
New password: 
Re-type new password: 
Adding password for user lhd
#生成密码，在命令行输入密码
[root@web02 /etc/nginx/conf.d]# htpasswd -b -c /etc/nginx/auth_basic lhd linux
Adding password for user lhd
#查看
[root@web02 /etc/nginx/conf.d]# vim /etc/nginx/auth_basic
lhd:$apr1$JmblF9to$jDnvQn1w7oETPYyvaL2OG.
#配置
[root@web02 /etc/nginx/conf.d]# vim test.conf 
server {
	listen 80;
	server_name www.test.com;
	location / {
		root /code;
		index index.html;
	}
	location /download {
		root /code;
		index index.html;
		autoindex on;
		autoindex_exact_size off;
		autoindex_localtime on;
		allow 10.0.0.1;
		deny all;
		auth_basic "输入用户名和密码";
		auth_basic_user_file /etc/nginx/auth_basic;
    }
}
#不添加-c参数可以添加多个用户
[root@web02 /etc/nginx/conf.d]# htpasswd /etc/nginx/auth_basic lhd
New password: 
Re-type new password: 
Adding password for user lhd
[root@web02 /etc/nginx/conf.d]# vim /etc/nginx/auth_basic
qiudao:$apr1$UL89inf6$.59e04v5ILGHpkMs2xZzF.
lhd:$apr1$9fOQ/hLl$DEugqKzv.0SNBziFMLdVZ1
```

## 六、Nginx模块之StubStatus模块

```java
这个模块能够获取Nginx自上次启动以来的工作状态
此模块非核心模块，需要在编译的时候手动添加编译参数 --with-http_stub_status_module
```

### 1.参数选项

```java
#1.stub_status 获取Nginx自上次启动以来的工作状态
syntax： stub_status on
default: -
context: server,location
```

### 2.配置示例

```java
[root@web02 /etc/nginx/conf.d]# vim test.conf 
server {
	listen 80;
	server_name www.test.com;
	location / {
		root /code;
		index index.html;
	}
	location /download {
		root /code;
		index index.html;
		autoindex on;
		autoindex_exact_size off;
		autoindex_localtime on;
		allow 10.0.0.1;
		deny all;
		auth_basic "输入用户名和密码";
		auth_basic_user_file /etc/nginx/auth_basic;
    }
	location /status {
		stub_status on;
    }
}
```

### 3.访问状态页

```java
#访问 http://www.test.com/status
#"stub status" 模块返回的状态信息跟 mathopd's 的状态信息很相似. 返回的状态信息如下：
Active connections: 2 
server accepts handled requests
 		  2 	 2 	   	 1 
Reading: 0 Writing: 1 Waiting: 1 
#nginx七种状态
Active connections		#对后端发起的活动连接数
accepts				  接受的TCP连接数
handled				  已处理的TCP连接数
requests			  请求数
Reading				  读取到客户端的Header信息数
Writing				  返回给客户端的Header信息数
Waiting				  开启 keep-alive 的情况下，这个值等于active-(reading + writing)，意思就是Nginx说已经处理完正在等候下一次请求指令的驻留连接
#可以用作监控日PV
[root@web02 /etc/nginx/conf.d]# curl -s http://www.test.com/status | awk 'NR==3 {print $3}'
```

## 七、Nginx模块之HttpGzip模块

```java
这个模块支持在线实时压缩输出数据流
```

### 1.参数选项

```java
#1.gzip 开启或者关闭gzip模块
syntax： gzip on|off
default: gzip off
context: http, server, location, if (x) location
#2.gzip_buffers 设置系统获取几个单位的缓存用于存储gzip的压缩结果数据流。 例如 4 4k 代表以4k为单位，按照原始数据大小以4k为单位的4倍申请内存。 4 8k 代表以8k为单位，按照原始数据大小以8k为单位的4倍申请内存。如果没有设置，默认值是申请跟原始数据相同大小的内存空间去存储gzip压缩结果。
syntax: gzip_buffers number size
default: gzip_buffers 4 4k/8k
context: http, server, location
#3.gzip_comp_level gzip压缩比，1 压缩比最小处理速度最快，9 压缩比最大但处理最慢（传输快但比较消耗cpu）。
syntax: gzip_comp_level 1..9
default: gzip_comp_level 1
context: http, server, location
#4.gzip_min_length 设置允许压缩的页面最小字节数，页面字节数从header头中的Content-Length中进行获取。默认值是0，不管页面多大都压缩。建议设置成大于1k的字节数，小于1k可能会越压越大。 即: gzip_min_length 1024
syntax: gzip_min_length length
default: gzip_min_length 0
context: http, server, location
#5.gzip_http_version 识别http的协议版本。由于早期的一些浏览器或者http客户端，可能不支持gzip自解压，用户就会看到乱码，所以做一些判断还是有必要的。 注：21世纪都来了，现在除了类似于百度的蜘蛛之类的东西不支持自解压，99.99%的浏览器基本上都支持gzip解压了，所以可以不用设这个值,保持系统默认即可。
syntax: gzip_http_version 1.0|1.1
default: gzip_http_version 1.1
context: http, server, location
#6.gzip_proxied Nginx作为反向代理的时候启用，开启或者关闭后端服务器返回的结果，匹配的前提是后端服务器必须要返回包含"Via"的 header头。
syntax: gzip_proxied [off|expired|no-cache|no-store|private|no_last_modified|no_etag|auth|any] ...
default: gzip_proxied off
context: http, server, location
off - 关闭所有的代理结果数据的压缩
expired - 启用压缩，如果header头中包含 "Expires" 头信息
no-cache - 启用压缩，如果header头中包含 "Cache-Control:no-cache" 头信息
no-store - 启用压缩，如果header头中包含 "Cache-Control:no-store" 头信息
private - 启用压缩，如果header头中包含 "Cache-Control:private" 头信息
no_last_modified - 启用压缩,如果header头中不包含 "Last-Modified" 头信息
no_etag - 启用压缩 ,如果header头中不包含 "ETag" 头信息
auth - 启用压缩 , 如果header头中包含 "Authorization" 头信息
any - 无条件启用压缩
#7.gzip_types 匹配MIME类型进行压缩，（无论是否指定）"text/html"类型总是会被压缩的。
syntax: gzip_types mime-type [mime-type ...]
default: gzip_types text/html
context: http, server, location
ps：如果作为http server来使用，主配置文件中要包含文件类型配置文件
```

### 2.配置示例

```java
[root@stg-databridge001 ~]$ vim /etc/nginx/nginx.conf 
user root;
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

## 八、Nginx模块之HttpGzipStatic模块

```java
在开始压缩创建硬盘上的文件之前，本模块将查找同目录下同名的.gz压缩文件，以避免同一文件再次压缩。
nginx 0.6.24开始加入ngx_http_gzip_static_module . 编译时加上参数 --with-http_gzip_static_module
```

### 1.参数选项

```java
#1.gzip_static 开启静态压缩模块
syntax: gzip_static on|off
default: gzip_static off
context: http, server, location
#2.gzip_http_version
See NginxHttpGzipModule
#3.gzip_proxied
See NginxHttpGzipModule
#4.gzip_disable
See NginxHttpGzipModule
#5.gzip_vary
See NginxHttpGzipModule
```

### 2.配置示例

```java
[root@stg-databridge001 ~]$ vim /etc/nginx/nginx.conf 
user root;
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
    gzip_static on;
    gzip_http_version   1.1;
    gzip_proxied        expired no-cache no-store private auth;
    gzip_vary           on;
    gzip on;
    gzip_disable "MSIE [1-6]\.";
    gzip_comp_level 2;
    gzip_buffers 16 8k;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript image/jpeg;
    include /etc/nginx/conf.d/*.conf;                               
}
```

## 九、Nginx模块之HttpLimit zone模块

```java
本模块可以针对条件，进行会话的并发连接数控制。（例如：限制每个IP的并发连接数。）
```

### 1.参数选项

```java
#设置限制的空间
Syntax:	limit_conn_zone key zone=name:size;
Default:	—
Context:	http
limit_conn_zone 	#调用限制模块
key 			  存储的内容
zone=			  空间
name:			  空间的名字
size;			  空间的大小
#调用空间
Syntax:	limit_conn zone number;
Default:	—
Context:	http, server, location
limit_conn 			#调用空间
zone 				#空间名字
number;				#同一个信息可以保存的次数
```

### 2.配置示例

```java
[root@web02 /etc/nginx/conf.d]# vim test.conf 
limit_conn_zone $remote_addr zone=conn_zone:1m;
server {
	listen 80;
	server_name www.test.com;
	limit_conn conn_zone 1;
	location / {
		root /code;
		index index.html;
	}
	location /download {
		root /code;
		index index.html;
		autoindex on;
		autoindex_exact_size off;
		autoindex_localtime on;
		allow 10.0.0.1;
		deny all;
		auth_basic "输入用户名和密码";
		auth_basic_user_file /etc/nginx/auth_basic;
    }
	location /status {
		stub_status;
    }
}
```

## 十、Nginx模块之HttpLimitReqest模块

```java
本模块可以针对条件，进行会话的并发连接数控制。（例如：限制每个IP的并发连接数。）
```

### 1.参数选项

```java
#设置请求限制的空间
Syntax:	limit_req_zone key zone=name:size rate=rate [sync];
Default:	—
Context:	http
limit_req_zone 		#调用模块
key 				#空间存储的内容
zone=				#指定空间
name:				#空间的名字
size 				#空间的大小
rate=rate;			#读写速率
#调用空间
Syntax:	limit_req zone=name [burst=number] [nodelay | delay=number];
Default:	—
Context:	http, server, location
limit_req 					#调用空间
zone=name 					#指定空间名字
[burst=number] 				#扩展
[nodelay | delay=number];	 延时
```

### 2.配置示例

```java
[root@web02 /etc/nginx/conf.d]# vim test.conf 
limit_conn_zone $remote_addr zone=conn_zone:1m;
limit_req_zone $remote_addr zone=req_zone:1m rate=1r/s;
server {
	listen 80;
	server_name www.test.com;
	limit_conn conn_zone 1;
	limit_req zone=req_zone;
	location / {
		root /code;
		index index.html;
	}
	location /download {
		root /code;
		index index.html;
		autoindex on;
		autoindex_exact_size off;
		autoindex_localtime on;
		allow 10.0.0.1;
		deny all;
		auth_basic "输入用户名和密码";
		auth_basic_user_file /etc/nginx/auth_basic;
    }
	location /status {
		stub_status;
    }
}
3.测试请求限制
[root@web02 /etc/nginx/conf.d]# ab -n 200 -c 2 http://www.test.com/
This is ApacheBench, Version 2.3 <$Revision: 1430300 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/
Benchmarking www.test.com (be patient)
Completed 100 requests
Completed 200 requests
Finished 200 requests
Server Software:        nginx/1.18.0
Server Hostname:        www.test.com
Server Port:            80
Document Path:          /
Document Length:        13 bytes
Concurrency Level:      2
Time taken for tests:   0.036 seconds
Complete requests:      200
Failed requests:        199
   (Connect: 0, Receive: 0, Length: 199, Exceptions: 0)
Write errors:           0
Non-2xx responses:      199
Total transferred:      73674 bytes
HTML transferred:       39216 bytes
Requests per second:    5492.24 [#/sec] (mean)
Time per request:       0.364 [ms] (mean)
Time per request:       0.182 [ms] (mean, across all concurrent requests)
Transfer rate:          1975.76 [Kbytes/sec] received
Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.8      0      12
Processing:     0    0   0.6      0       4
Waiting:        0    0   0.5      0       4
Total:          0    0   1.0      0      12
Percentage of the requests served within a certain time (ms)
  50%      0
  66%      0
  75%      0
  80%      0
  90%      0
  95%      0
  98%      4
  99%      4
 100%     12 (longest request)
```
