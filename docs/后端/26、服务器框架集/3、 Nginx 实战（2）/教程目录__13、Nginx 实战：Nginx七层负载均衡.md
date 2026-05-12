# 13、Nginx 实战：Nginx七层负载均衡
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/13.html
- 分类：服务器框架
- 分组：教程目录
## 1.Nginx负载均衡基本概述

## 1.1为什么需要使用负载均衡

当我们的Web服务器直接面向用户，往往要承载大量并发请求，单台服务器难以负荷，我使用多台WEB服务器组成集群，前端使用Nginx负载均衡，将请求分散的打到我们的后端服务器集群中，实现负载的分发。那么会大大提升系统的吞吐率、请求性能、高容灾

往往我们接触的最多的是SLB(Server Load Balance)负载均衡，实现最多的也是SLB、那么SLB它的调度节点和服务节点通常是在一个地域里面。那么它在这个小的逻辑地域里面决定了他对部分服务的实时性、响应性是非常好的。

所以说当海量用户请求过来以后，它同样是请求调度节点，调度节点将用户的请求转发给后端对应的服务节点，服务节点处理完请求后在转发给调度节点，调度节点最后响应给用户节点。这样也能实现一个均衡的作用，那么Nginx则是一个典型的SLB

## 1.2负载均衡能实现的应用场景

负载均衡能实现的应用场景一: 四层负载均衡

所谓四层负载均衡指的是OSI七层模型中的传输层，那么传输层Nginx已经能支持TCP/IP的控制，所以只需要对客户端的请求进行TCP/IP协议的包转发就可以实现负载均衡，那么它的好处是性能非常快、只需要底层进行应用处理，而不需要进行一些复杂的逻辑。

负载均衡能实现的应用场景二: 七层负载均衡

七层负载均衡它是在应用层，那么它可以完成很多应用方面的协议请求，比如我们说的http应用的负载均衡，它可以实现http信息的改写、头信息的改写、安全应用规则控制、URL匹配规则控制、以及转发、rewrite等等的规则，所以在应用层的服务里面，我们可以做的内容就更多，那么Nginx则是一个典型的七层负载均衡SLB

## 1.3.四层负载均衡与七层负载均衡区别

四层负载均衡数据包在底层就进行了分发，而七层负载均衡数据包则是在最顶层进行分发、由此可以看出，七层负载均衡效率没有四负载均衡高。

但七层负载均衡更贴近于服务，如:http协议就是七层协议，我们可以用Nginx可以作会话保持，URL路径规则匹配、head头改写等等，这些是四层负载均衡无法实现的。

## 2.Nginx负载均衡配置场景

Nginx要实现负载均衡需要用到proxy_pass代理模块配置.

Nginx负载均衡与Nginx代理不同地方在于，Nginx代理仅代理一台服务器，而Nginx负载均衡则是将客户端请求代理转发至一组upstream虚拟服务池

Nginx upstream虚拟配置语法

```java
Syntax: upstream name { ... }
Default: -
Context: http
#upstream例
upstream backend {
    server backend1.example.com       weight=5;
    server backend2.example.com:8080;
    server unix:/tmp/backend3;
    server backup1.example.com:8080   backup;
}
server {
    location / {
        proxy_pass http://backend;
    }
}
```

## 2.0.环境规划

角色
外网IP(NAT)
内网IP(LAN)
主机名

LB01
eth0:10.0.0.5
eth1:172.16.1.5
lb01

web01
eth0:10.0.0.7
eth1:172.16.1.7
web01

web02
eth0:10.0.0.8
eth1:172.16.1.8
web02

## 2.1.Web01服务器上配置nginx, 并创建对应html文件

```java
[root@web01 ~]# cd /etc/nginx/conf.d/
[root@web01 conf.d]# cat node.conf 
server {
    listen 80;
    server_name node.oldboy.com;
    location / {
        root /node;
        index index.html;
    }
}
[root@web01 conf.d]# mkdir /node
[root@web01 conf.d]# echo "Web01..." > /node/index.html
[root@web01 conf.d]# systemctl restart nginx
```

## 2.2.Web02服务器上配置nginx, 并创建对应html文件

```java
[root@web02 ~]# cd /etc/nginx/conf.d/
[root@web02 conf.d]# cat node.conf 
server {
    listen 80;
    server_name node.oldboy.com;
    location / {
        root /node;
        index index.html;
    }
}
[root@web02 conf.d]# mkdir /node
[root@web02 conf.d]# echo "Web02..." > /node/index.html
[root@web02 conf.d]# systemctl restart nginx
```

## 2.3.配置Nginx负载均衡

```java
[root@lb01 ~]# cd /etc/nginx/conf.d/
[root@lb01 conf.d]# cat node_proxy.conf 
upstream node {
    server 172.16.1.7:80;
    server 172.16.1.8:80;
}
server {
    listen 80;
    server_name node.oldboy.com;
    location / {
        proxy_pass http://node;
        include proxy_params;
    }
}
[root@lb01 conf.d]# systemctl restart nginx
```

## 2.4.准备Nginx负载均衡调度使用的proxy_params

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

## 2.5.使用浏览器访问node.oldboy.com, 然后不断刷新测试

## 3.Nginx负载均衡调度算法

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

## 3.1.Nginx负载均衡[wrr]轮询具体配置

```java
upstream load_pass {
    server 10.0.0.7:80;
    server 10.0.0.8:80;
}
```

## 3.2.Nginx负载均衡[weight]权重轮询具体配置

```java
upstream load_pass {
    server 10.0.0.7:80 weight=5;
    server 10.0.0.8:80;
}
```

## 3.3.Nginx负载均衡ip_hash具体配置, 不能和weight一起使用。

如果客户端都走相同代理, 会导致某一台服务器连接过多

```java
upstream load_pass {
    ip_hash;
    server 10.0.0.7:80 weight=5;
    server 10.0.0.8:80;
}
```

## 4.Nginx负载均衡后端状态

后端Web服务器在前端Nginx负载均衡调度中的状态

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

## 4.1.测试down状态, 测试该Server不参与负载均衡的调度

```java
upstream load_pass {
   不参与任何调度, 一般用于停机维护
    server 10.0.0.7:80 down;
}
```

## 4.2.测试backup以及down状态

```java
upstream load_pass {
    server 10.0.0.7:80 down;
    server 10.0.0.8:80 backup;
    server 10.0.0.9:80 max_fails=1 fail_timeout=10s;
}
location  / {
    proxy_pass http://load_pass;
    include proxy_params;
}
```

## 4.3.测试max_fails失败次数和fail_timeout多少时间内失败多少次则标记down

```java
upstream load_pass {
    server 10.0.0.7:80;
    server 10.0.0.8:80 max_fails=2 fail_timeout=10s;
}
```

## 4.4.测试max_conns最大TCP连接数

```java
upstream load_pass {
    server 10.0.0.7:80;
    server 10.0.0.8:80 max_conns=1;
}
```

## 5.Nginx负载均衡健康检查

在Nginx官方模块提供的模块中，没有对负载均衡后端节点的健康检查模块，但可以使用第三方模块nginx_upstream_check_module来检测后方服务的健康状态upstream_check_module项目地址

## 5.1.安装依赖包

```java
[root@lb02 ~]# yum install -y gcc glibc gcc-c++ prce-devel openssl-devel pcre-devel patch
```

## 5.2.下载nginx源码包以及nginx_upstream_check模块第三方模块

```java
[root@lb02 ~]# wget http://nginx.org/download/nginx-1.14.2.tar.gz
[root@lb02 ~]# wget https://github.com/yaoweibin/nginx_upstream_check_module/archive/master.zip
```

## 5.3.解压nginx源码包以及第三方模块

```java
[root@lb02 ~]# tar xf nginx-1.14.2.tar.gz
[root@lb02 ~]# unzip master.zip
```

## 5.4.进入nginx目录，打补丁(nginx的版本是1.14补丁就选择1.14的,p1代表在nginx目录，p0是不在nginx目录)

```java
[root@lb02 ~]# cd nginx-1.14.2/
[root@lb02 nginx-1.14.2]# patch -p1 <../nginx_upstream_check_module-master/check_1.14.0+.patch
```

## 5.5.编译Nginx，需要添加upstream_check第三方模块

```java
[root@lb02 nginx-1.14.2]# ./configure --prefix=/etc/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --pid-path=/var/run/nginx.pid --lock-path=/var/run/nginx.lock --http-client-body-temp-path=/var/cache/nginx/client_temp --http-proxy-temp-path=/var/cache/nginx/proxy_temp --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp --http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx --group=nginx --with-compat --with-file-aio --with-threads --with-http_addition_module --with-http_auth_request_module --with-http_dav_module --with-http_flv_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_mp4_module --with-http_random_index_module --with-http_realip_module --with-http_secure_link_module --with-http_slice_module --with-http_ssl_module --with-http_stub_status_module --with-http_sub_module --with-http_v2_module --with-mail --with-mail_ssl_module --with-stream --with-stream_realip_module --with-stream_ssl_module --with-stream_ssl_preread_module --add-module=/root/nginx_upstream_check_module-master --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic -fPIC' --with-ld-opt='-Wl,-z,relro -Wl,-z,now -pie'
[root@lb02 nginx-1.14.2]# make && make install
```

## 5.6.配置nginx负载均衡，同时打开upstream健康检查功能

```java
[root@lb02 conf.d]# cat proxy.blog.bgx.com.conf
upstream blog.bgx.com {
    server 172.16.1.7:80;
    server 172.16.1.8:80;
    check interval=3000 rise=2 fall=3 timeout=1000 type=tcp;
   interval检测间隔时间，单位为毫秒
   rsie表示请求2次正常，标记此后端的状态为up
   fall表示请求3次失败，标记此后端的状态为down
   type  类型为tcp
   timeout为超时时间，单位为毫秒
}
server {
    listen 80;
    server_name blog.bgx.com;
    location / {
        proxy_pass http://blog.bgx.com;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location /upstream_status {
        check_status;    开启upstream状态页面
    }
}
```

## 5.7.通过访问域名/upstream_status则能打开状态页面

## 5.8.尝试关闭一台后端的webserver，再次打开检查见面

## 6.Nginx负载均衡会话共享

在使用负载均衡的时候会遇到会话保持的问题，可通过如下方式进行解决

- 1.使用nginx的ip_hash，根据客户端的来源IP，将请求分配到相同服务器上
- 2.基于服务端的Session会话共享（mysql/memcache/redis/file）

在解决负载均衡会话问题我们需要了解session和cookie。

- 1.用户第一次请求服务端网站时，服务端会生成对应的session_id，然后存储至客户端浏览器的cookie中。
- 2.客户端尝试登陆服务端网站时，浏览器的请求头自动携带cookie信息，在cookie信息中保存的则是session_id。
- 3.客户端登陆服务端网站后，服务端会将session_id存储在本地文件中, 当用户下次请求网站时会去查询用户提交的cookie作为key去存储里找对应的value(session)

注意:同一域名下的网站登陆后cookie都是一样的。所以无论负载后端有几台服务器,无论请求分配到哪一台服务器上同一用户的cookie是不会发生变化的。也就是说cookie对应的session也是唯一的。所以，这里只要保证多台业务服务器访问同一个共享服务器(memcache/redis/mysql/file)就行了。

## 6.1.首先在多台web上都安装并配置phpmyadmin

```java
#1.安装phpmyadmin（web01和web02上都装）
[root@web01 conf.d]# cd /code
[root@web01 code]# wget https://files.phpmyadmin.net/phpMyAdmin/4.8.4/phpMyAdmin-4.8.4-all-languages.zip
[root@web01 code]# unzip phpMyAdmin-4.8.4-all-languages.zip
#2.配置phpmyadmin连接远程的数据库
[root@web01 code]# cd phpMyAdmin-4.8.4-all-languages/
[root@web01 phpMyAdmin-4.8.4-all-languages]# cp config.sample.inc.php config.inc.php
[root@web01 phpMyAdmin-4.8.4-all-languages]# vim config.inc.php
/* Server parameters */
$cfg['Servers'][$i]['host'] = '172.16.1.51';
```

## 6.2.在多台web上准备phpmyadmin的nginx配置文件

```java
[root@web01 ~]# cat /etc/nginx/conf.d/php.conf
server {
    listen 80;
    server_name php.oldboy.com;
    root /code/phpMyAdmin-4.8.4-all-languages;
    location / {
        index index.php index.html;
    }
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
#重启Nginx服务
[root@web01 ~]# systemctl restart nginx
```

## 6.3.配置负载均衡服务，调度到后端两台web节点

```java
[root@lb01 ~]# cat /etc/nginx/conf.d/proxy_php.com.conf 
upstream php {
        server 172.16.1.7:80;
        server 172.16.1.8:80;
}
server {
        listen 80;
        server_name php.oldboy.com;
        location / {
                proxy_pass http://php;
                include proxy_params;
        }
}
#检查语法并重启nginx
[root@lb01 conf.d]# nginx -t
[root@lb01 conf.d]# systemctl restart nginx
```

## 6.4.准备redis内存数据库存储session会话

```java
#1.安装redis内存数据库
[root@db01 ~]# yum install redis -y
#2.配置redis监听在172.16.1.0网段上
[root@db01 ~]# sed  -i '/^bind/c bind 127.0.0.1 172.16.1.51' /etc/redis.conf
#3.启动redis
[root@db01 ~]# systemctl start redis
[root@db01 ~]# systemctl enable redis
```

## 6.5.配置php连接redis服务

```java
#1.修改/etc/php.ini文件
[root@web ~]# vim /etc/php.ini
session.save_handler = redis
session.save_path = "tcp://172.16.1.51:6379"
;session.save_path = "tcp://172.16.1.51:6379?auth=123"如果redis存在密码，则使用该方式
#2.注释php-fpm.d/www.conf里面的两条内容，否则session内容会一直写入/var/lib/php/session目录中
;php_value[session.save_handler] = files
;php_value[session.save_path]    = /var/lib/php/session
```

## 6.6.使用浏览器登陆网站，获取对应的cookie信息

## 6.7.检查redis中是否存在cookie对应的session

```java
172.16.1.51:6379> keys *
1) "PHPREDIS_SESSION:393ff522ed2a7e26ba44f6d925f991f2"
172.16.1.51:6379>
```

## 6.8.此时用户的cookie始终都不会发生任何变化，无论请求被负载调度到那一台后端web节点服务器都不会出现没有登陆情况。
