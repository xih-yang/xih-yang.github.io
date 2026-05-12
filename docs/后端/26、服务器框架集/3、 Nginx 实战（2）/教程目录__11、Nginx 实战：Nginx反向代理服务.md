# 11、Nginx 实战：Nginx反向代理服务
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/11.html
- 分类：服务器框架
- 分组：教程目录
## 1Nginx代理服务基本概述

**1、** 代理一词并不陌生,该服务我们常常用到如(代理理财、代理租房、代理收货等等)，如下图所示；

**2、** 在没有代理模式的情况下，客户端和Nginx服务端，都是客户端直接请求服务端，服务端直接响应客户端；

**3、** 那么在互联网请求里面,客户端往往无法直接向服务端发起请求,那么就需要用到代理服务,来实现客户端和服务通信，如下图所示；

## 2.Nginx代理服务常见模式

**1、** 那Nginx作为代理服务,按照应用场景模式进行总结，代理分为正向代理、反向代理；

正向代理，(内部上网) 客户端代理->服务端

反向代理，用于公司集群架构中，客户端->代理服务端

**2、** 正向与反向代理的区别；

区别在于形式上服务的"对象"不一样

正向代理代理的对象是客户端，为客户端服务

反向代理代理的对象是服务端，为服务端服务

## 3.Nginx代理服务支持协议

**1、** Nginx作为代理服务，可支持的代理协议非常的多，具体如下图；

**2、** 如果将Nginx作为反向代理服务，常常会用到如下几种代理协议，如下图所示；

**3、** 反向代理模式与Nginx代理模块总结如表格所示；

反向代理模式
Nginx配置模块

http、websocket、https
ngx_http_proxy_module

fastcgi
ngx_http_fastcgi_module

uwsgi
ngx_http_uwsgi_module

grpc
ngx_http_v2_module

## 4.Nginx反向代理配置语法

## 4.1.Nginx代理配置语法

```java
Syntax: proxy_pass URL;
Default:    —
Context:    location, if in location, limit_except
http://localhost:8000/uri/
http://192.168.56.11:8000/uri/
http://unix:/tmp/backend.socket:/uri/
```

## 4.2.url跳转修改返回Location[不常用]参考URL

```java
Syntax: proxy_redirect default;
proxy_redirect off;proxy_redirect redirect replacement;
Default:    proxy_redirect default;
Context:    http, server, location
```

## 4.3.添加发往后端服务器的请求头信息

```java
Syntax: proxy_set_header field value;
Default:    proxy_set_header Host $proxy_host;
            proxy_set_header Connection close;
Context:    http, server, location
# 用户请求的时候HOST的值是www.bgx.com, 那么代理服务会像后端传递请求的还是www.bgx.com
proxy_set_header Host $http_host;
# 将$remote_addr的值放进变量X-Real-IP中，$remote_addr的值为客户端的ip
proxy_set_header X-Real-IP $remote_addr;
# 客户端通过代理服务访问后端服务, 后端服务通过该变量会记录真实客户端地址
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## 4.4.代理到后端的TCP连接、响应、返回等超时时间

```java
//nginx代理与后端服务器连接超时时间(代理连接超时)
Syntax: proxy_connect_timeout time;
Default: proxy_connect_timeout 60s;
Context: http, server, location
//nginx代理等待后端服务器的响应时间
Syntax: proxy_read_timeout time;
Default:    proxy_read_timeout 60s;
Context:    http, server, location
//后端服务器数据回传给nginx代理超时时间
Syntax: proxy_send_timeout time;
Default: proxy_send_timeout 60s;
Context: http, server, location
```

## 4.5.proxy_buffer代理缓冲区

```java
//nignx会把后端返回的内容先放到缓冲区当中，然后再返回给客户端,边收边传, 不是全部接收完再传给客户端
Syntax: proxy_buffering on | off;
Default: proxy_buffering on;
Context: http, server, location
//设置nginx代理保存用户头信息的缓冲区大小
Syntax: proxy_buffer_size size;
Default: proxy_buffer_size 4k|8k;
Context: http, server, location
//proxy_buffers 缓冲区
Syntax: proxy_buffers number size;
Default: proxy_buffers 8 4k|8k;
Context: http, server, location
```

## 4.6.Proxy代理网站常用优化配置如下，将配置写入新文件，调用时使用include引用即可

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

## 4.7.代理配置location时调用, 方便后续多个Location重复使用

```java
location / {
    proxy_pass http://127.0.0.1:8080;
    include proxy_params;
}
```

## 5.Nginx反向代理场景实践

Nginx反向代理配置实例

## 5.1.环境准备

角色
外网IP(NAT)
内网IP(LAN)
主机名

Proxy
eth0:10.0.0.5
eth1:172.16.1.5
lb01

web01

eth1:172.16.1.7
web01

## 5.2.web01服务器, 配置一个网站，监听在8080，此时网站仅172网段的用户能访问

```java
[root@web01 ~]# cd /etc/nginx/conf.d/
[root@web01 conf.d]# vim web.conf
server {
    listen 8080;
    server_name localhost;
    location / {
        root /code_8080;
        index index.html;
        deny 10.0.0.0/24;
        allow all;
    }
}
[root@web01 conf.d]# mkdir /code_8080
[root@web01 conf.d]# echo "web01-7...." >/code_8080/index.html
[root@web01 conf.d]# systemctl restart nginx
```

## 5.3.proxy代理服务器, 配置监听eth0的80端口，使10.0.0.0网段的用户，能够通过代理服务器访问到后端的172.16.1.7的8080端口站点内容

```java
[root@lb01 ~]# cd /etc/nginx/conf.d/
[root@lb01 conf.d]# cat proxy_web_node1.conf 
server {
    listen 80;
    server_name nginx.oldboy.com;
    location / {
        proxy_pass http://172.16.1.7:8080;
        include proxy_params;
    }
}
[root@lb01 conf.d]# systemctl enable nginx
[root@lb01 conf.d]# systemctl start nginx
```
