# 09、Nginx 实战：nginx常用基础模块
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/9.html
- 分类：服务器框架
- 分组：教程目录
## 1Nginx目录索引

ngx_http_autoindex_module模块处理以斜杠字符('/')结尾的请求(就是处理location /)，并生成目录列表。当ngx_http_index_module模块找不到索引文件时，通常会将请求传递给模块ngx_http_autoindex_module。（即ngx_http_index_module模块找不到首页文件，就会交给ngx_http_autoindex_module把当前目录下的所有文件生成目录列表）

## 1.1.指令

```java
#启用或禁用目录列表输出，on开启，off关闭。
Syntax: autoindex on | off;
Default:    autoindex off;
Context:    http, server, location
#指定是否应在目录列表中输出确切的文件大小，on显示字节，off显示大概单位。
Syntax: autoindex_exact_size on | off;
Default: autoindex_exact_size on;
Context:    http, server, location
#指定目录列表中的时间是应以本地时区还是UTC输出。on本地时区，off UTC时间。
Syntax: autoindex_localtime on | off;
Default: autoindex_localtime off;
Context: http, server, location
```

## 1.2.示例配置

```java
[root@web ~]# cat /etc/nginx/conf.d/game.conf 
server {
    listen 80;
    server_name game.oldboy.com;
    charset utf-8,gbk; 设定字符集，防止中文字符乱码显示。
    location / {
        root /code/game;
        autoindex on;  (需要找不到index.html主页文件，才能以目录树的结构显示)
        autoindex_exact_size off;  (off显示的是确切的大小)
    }
}
```

## 2Nginx状态监控

ngx_http_stub_status_module模块提供对基本状态信息的访问。

默认情况下不构建此模块，应使用--with-http_stub_status_module 配置参数启用它 。

## 2.1.指令

```java
Syntax: stub_status;
Default: —
Context: server, location
```

## 2.2.示例配置

```java
[root@web ~]# cat /etc/nginx/conf.d/game.conf
server {
    listen 80;
    server_name game.oldboy.com;
    access_log off;
    location /nginx_status {
        stub_status;
    }
}
```

## 2.3.此配置创建一个简单的网页，其基本状态数据可能如下所示：

## 2.4.提供以下状态信息

```java
Active connections  当前活动客户端连接数，包括Waiting等待连接数。
accepts             已接受总的TCP连接数。
handled             已处理总的TCP连接数。
requests            客户端总的http请求数。
Reading             当前nginx读取请求头的连接数。
Writing             当前nginx将响应写回客户端的连接数。
Waiting             当前等待请求的空闲客户端连接数。
# 注意, 一次TCP的连接，可以发起多次http的请求, 如下参数可配置进行验证
keepalive_timeout  0;   类似于关闭长连接
keepalive_timeout  65;  65s没有活动则断开连接
```

## 3Nginx访问控制

ngx_http_access_module模块允许限制对某些客户端地址的访问。

## 3.1.指令

```java
#允许配置语法
Syntax: allow address | CIDR | unix: | all;
Default:    —
Context:    http, server, location, limit_except
#拒绝配置语法
Syntax: deny address | CIDR | unix: | all;
Default:    —
Context:    http, server, location, limit_except
```

## 3.2.示例配置，拒绝指定的IP访问该网站的/nginx_status, 其他IP全部允许访问

```java
[root@web ~]# cat /etc/nginx/conf.d/module.conf
server {
    listen 80;
    server_name module.bgx.com;
    location /nginx_status {
        stub_status;
        deny 10.0.0.1/32;  拒绝指定的地址或地址段
        allow all;         允许所有的地址
    }
}
[root@web01 conf.d]# curl 10.0.0.7/basic_status
Active connections: 3 
server accepts handled requests
 6 6 7 
Reading: 0 Writing: 1 Waiting: 2
```

## 3.3.示例配置，只允许指定的来源IP能访问/nginx_status, 其它网段全部拒绝

```java
[root@web ~]# cat /etc/nginx/conf.d/module.conf
server {
    listen 80;
    server_name module.bgx.com;
    location /nginx_status {
        stub_status;
        allow 127.0.0.1;
        allow 10.0.0.1/32; 允许地址或地址段
        deny all;             拒绝所有人
    }
}
```

注意:deny和allow的顺序是有影响的

默认情况下，从第一条规则进行匹配

如果匹配成功，则不继续匹配下面的内容。

如果匹配不成功，则继续往下寻找能匹配成功的内容。

## 4Nginx资源限制

ngx_http_auth_basic_module模块允许使用HTTP基本身份验证，验证用户名和密码来限制对资源的访问。

## 4.1.指令

```java
#使用HTTP基本身份验证协议启用用户名和密码验证。
Syntax: auth_basic string| off;
Default: auth_basic off;
Context: http, server, location, limit_except
#指定保存用户名和密码的文件
Syntax: auth_basic_user_file file;
Default: -
Context: http, server, location, limit_except
```

## 4.2.指定保存用户名和密码的文件，格式如下：

```java
#可以使用htpasswd程序或"openssl passwd"命令生成对应的密码;
name1：passwd1
name2：passwd2
#使用htpaaswd创建新的密码文件, -c创建新文件 -b允许命令行输入密码
[root@xuliangwei ~]# yum install httpd-tools
[root@xuliangwei ~]# htpasswd -b -c /etc/nginx/auth_conf tuchuang 123456
```

## 4.3.示例配置，基于用户名和密码认证实践

```java
server {
    listen 80;
    server_name module.bgx.com;
    access_log off;
    location /nginx_status {
        stub_status;
        auth_basic "Auth access Blog Input your Passwd!";
        auth_basic_user_file /etc/nginx/auth_conf;
    }
}
```

## 5Nginx访问限制

经常会遇到这种情况，服务器流量异常，负载过大等等。对于大流量恶意的攻击访问，会带来带宽的浪费，服务器压力，从而影响业务，针对这种情况我们可以考虑对同一个ip的连接数，请求数、进行限制。

## 5.1.ngx_http_limit_conn_module模块用于限制定义key的连接数

ngx_http_limit_conn_module模块用于限制定义key的连接数，特别是来自单个IP地址的连接数。但并非所有连接都被计算在内，仅当连接已经读取了整个请求头时才计算连接。

### 5.1.1.指令

```java
Syntax:  limit_conn_zone key zone=name:size;
Default: —
Context: http
Syntax: limit_conn zone number;
Default: —
Context: http, server, location
```

### 5.1.2.设置共享内存区域和给定键值的最大允许连接数。超过此限制时，服务器将返回错误以回复请求

```java
# http标签段定义连接限制
http{
    limit_conn_zone $binary_remote_addr zone=conn_zone:10m;
}
server {
    同一时刻只允许一个客户端连接
    limit_conn conn_zone 1; 
    location / {
        root /code;
        index index.html;
    }
```

### 5.1.3.使用ab工具进行压力测试

```java
[root@xuliangwei ~]# yum install -y httpd-tools
[root@xuliangwei ~]# ab -n 20 -c 2  http://127.0.0.1/index.html
```

### 5.1.4.nginx日志结果

```java
2018/10/24 18:04:49 [error] 28656#28656: *1148 limiting connections by zone "conn_zone", client: 123.66.146.123, server: www.xuliangwei.com, request: "GET / HTTP/1.0", host: "www.xuliangwei.com"
2018/10/24 18:04:49 [error] 28656#28656: *1155 limiting connections by zone "conn_zone", client: 123.66.146.123, server: www.xuliangwei.com, request: "GET / HTTP/1.0", host: "www.xuliangwei.com"
```

## 5.2.ngx_http_limit_req_module模块用于限制定义key请求的处理速率

ngx_http_limit_req_module模块用于限制定义key请求的处理速率，特别单一的IP地址的请求的处理速率。

### 5.2.1.指令

```java
#模块名ngx_http_limit_req_module
Syntax:  limit_req_zone key zone=name:size rate=rate;
Default: —
Context: http
Syntax: limit_conn zone number [burst=number] [nodelay];
Default: —
Context: http, server, location
```

### 5.2.2.设置共享内存区域和请求的最大突发大小。过多的请求被延迟，直到它们的数量超过最大的限制，在这种情况下请求以错误终止。

```java
# http标签段定义请求限制, rate限制速率，限制一秒钟最多一个IP请求
http {
    limit_req_zone $binary_remote_addr zone=req_zone:10m rate=1r/s;
}
server {
    listen 80;
    server_name module.bgx.com;
    1r/s只接收一个请求,其余请求拒绝处理并返回错误码给客户端
   limit_req zone=req_zone;
    请求超过1r/s,剩下的将被延迟处理,请求数超过burst定义的数量, 多余的请求返回503
    limit_req zone=req_zone burst=3 nodelay;
    location / {
        root /code;
        index index.html;
    }
}
```

### 5.2.3.使用ab工具进行压力测试

```java
[root@xuliangwei ~]# yum install -y httpd-tools
[root@xuliangwei ~]# ab -n 20 -c 2  http://127.0.0.1/index.html
```

### 5.2.4.nginx日志结果

```java
2018/10/24 07:38:53 [error] 81020#0: *8 limiting requests, excess: 3.998 by zone "req_zone", client: 10.0.0.10, server: module.bgx.com, request: "GET /index.html HTTP/1.0", host: "10.0.0.10"
2018/10/24 07:38:53 [error] 81020#0: *9 limiting requests, excess: 3.998 by zone "req_zone", client: 10.0.0.10, server: module.bgx.com, request: "GET /index.html HTTP/1.0", host: "10.0.0.10"
```

Nginx连接限制没有请求限制有效?

我们先来回顾一下http协议的连接与请求，首先HTTP是建立在TCP基础之上, 在完成HTTP请求需要先建立TCP三次握手（称为TCP连接）,在连接的基础上在完成HTTP的请求。

所以多个HTTP请求可以建立在一次TCP连接之上, 那么我们对请求的精度限制，当然比对一个连接的限制会更加的有效，因为同一时刻只允许一个TCP连接进入, 但是同一时刻多个HTTP请求可以通过一个TCP连接进入。所以针对HTTP的请求限制才是比较优的解决方案。

## 6Nginx Location

使用Nginx Location可以控制访问网站的路径, 但一个server允许出现多个location配置, 那多个location出现冲突谁的优先级会更高呢

## 6.1.Location语法示例

```java
location [=|^~|~|~*|!~|!~*|/] /uri/ { ...
}
```

## 6.2.Location语法优先级排列

匹配符
匹配规则
优先级

=
精确匹配
1

^~
以某个字符串开头
2

~
区分大小写的正则匹配
3

~*
不区分大小写的正则匹配
4

!~
区分大小写不匹配的正则
5

!~*
不区分大小写不匹配的正则
6

/
通用匹配，任何请求都会匹配到
7

## 6.3.配置网站验证Location优先级

```java
[root@Nginx conf.d]# cat testserver.conf 
server {
    listen 80;
    server_name module.oldboy.com;
    location / {
        default_type text/html;
        return 200 "location /";
    }
    location =/ {
        default_type text/html;
        return 200 "location =/";
    }
    location ~ / {
        default_type text/html;
        return 200 "location ~/";
    }
    location ^~ / {
      default_type text/html;
      return 200 "location ^~";
    }
}
```

## 6.4.测试Location优先级

```java
# 优先级最高符号=
[root@Nginx conf.d]# curl module.oldboy.com
location =/
# 注释掉精确匹配=, 重启Nginx
[root@Nginx ~]# curl module.oldboy.com
location ~/
# 注释掉~, 重启Nginx
[root@Nginx ~]# curl module.oldboy.com
location /
```

## 6.5.Locaiton规则配置应用场景

```java
# 通用匹配，任何请求都会匹配到
location / {
    ...
}
# 严格区分大小写，匹配以.php结尾的都走这个location    
location ~ \.php$ {
    ...
}
# 严格区分大小写，匹配以.jsp结尾的都走这个location 
location ~ \.jsp$ {
    ...
}
# 不区分大小写匹配，只要用户访问.jpg,gif,png,js,css 都走这条location
location ~* .*\.(jpg|gif|png|js|css)$ {
    ...
}
# 不区分大小写匹配
location ~* "\.(sql|bak|tgz|tar.gz|.git)$" {
    ...
}
```
