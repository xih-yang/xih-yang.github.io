# 06、Nginx 实战：Nginx配置文件详解
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/6.html
- 分类：服务器框架
- 分组：教程目录
为了让大家更清晰的了解Nginx软件的全貌，可使用rpm -ql nginx查看整体的目录结构及对应的功能，如下表格整理了Nginx比较重要的配置文件

```java
[root@staging ~]# rpm -ql nginx
/etc/logrotate.d/nginx
/etc/nginx/fastcgi.conf
/etc/nginx/fastcgi.conf.default
/etc/nginx/fastcgi_params
/etc/nginx/fastcgi_params.default
/etc/nginx/koi-utf
/etc/nginx/koi-win
/etc/nginx/mime.types
/etc/nginx/mime.types.default
/etc/nginx/nginx.conf
/etc/nginx/nginx.conf.default
/etc/nginx/scgi_params
/etc/nginx/scgi_params.default
/etc/nginx/uwsgi_params
/etc/nginx/uwsgi_params.default
/etc/nginx/win-utf
/usr/bin/nginx-upgrade
/usr/lib/systemd/system/nginx.service
/usr/lib64/nginx/modules
/usr/sbin/nginx
/usr/share/doc/nginx-1.16.1
/usr/share/doc/nginx-1.16.1/CHANGES
/usr/share/doc/nginx-1.16.1/README
/usr/share/doc/nginx-1.16.1/README.dynamic
/usr/share/doc/nginx-1.16.1/UPGRADE-NOTES-1.6-to-1.10
/usr/share/licenses/nginx-1.16.1
/usr/share/licenses/nginx-1.16.1/LICENSE
/usr/share/man/man3/nginx.3pm.gz
/usr/share/man/man8/nginx-upgrade.8.gz
/usr/share/man/man8/nginx.8.gz
/usr/share/nginx/html/404.html
/usr/share/nginx/html/50x.html
/usr/share/nginx/html/en-US
/usr/share/nginx/html/icons
/usr/share/nginx/html/icons/poweredby.png
/usr/share/nginx/html/img
/usr/share/nginx/html/index.html
/usr/share/nginx/html/nginx-logo.png
/usr/share/nginx/html/poweredby.png
/usr/share/vim/vimfiles/ftdetect/nginx.vim
/usr/share/vim/vimfiles/ftplugin/nginx.vim
/usr/share/vim/vimfiles/indent/nginx.vim
/usr/share/vim/vimfiles/syntax/nginx.vim
/var/lib/nginx
/var/lib/nginx/tmp
/var/log/nginx
```

## 一、Nginx主配置文件

路径
类型
作用

/etc/nginx/nginx.conf
配置文件
nginx主配置文件

/etc/nginx/conf.d/default.conf
配置文件
默认网站配置文件

## 二、Nginx代理相关参数文件

路径
类型
作用

/etc/nginx/fastcgi_params
配置文件
Fastcgi代理配置文件（php）

/etc/nginx/scgi_params
配置文件
scgi代理配置文件

/etc/nginx/uwsgi_params
配置文件
uwsgi代理配置文件（python）

## 三、Nginx编码相关配置文件

路径
类型
作用

/etc/nginx/win-utf
配置文件
Nginx编码转换映射文件

/etc/nginx/koi-utf
配置文件
Nginx编码转换映射文件

/etc/nginx/koi-win
配置文件
Nginx编码转换映射文件

/etc/nginx/mime.types
配置文件
Content-Type与扩展名，nginx支持的数据类型

## 四、Nginx管理相关命令

路径
类型
作用

/usr/sbin/nginx
命令
Nginx命令行管理终端工具

/usr/sbin/nginx-debug
命令
Nginx命令行与终端调试工具

## 五、Nginx日志相关目录与文件

路径
类型
作用

/var/log/nginx
目录
Nginx默认存放日志目录

/etc/logrotate.d/nginx
配置文件
Nginx默认的日志切割

## 六、Nginx主配置文件

### 1.nginx主配置文件概述

```java
Nginx主配置文件/etc/nginx/nginx.conf是一个纯文本类型的文件，整个配置文件是以区块的形式组织的。一般，每个区块以一对大括号{}来表示开始与结束。
Nginx主配置文件整体分为三块进行学习，分别是CoreModule(核心模块)，EventModule(事件驱动模块)，HttpCoreModule(http内核模块)
```

### 2.nginx主配置文件详解

```java
[root@web02 ~]# cat /etc/nginx/nginx.conf
#---------------------------核心模块------------------------------
#定义nginx启动用户和用户组
user  www www;
#工作进程数，建议设置为等于CPU总核心数
worker_processes  1;
#错误日志		debug/info/notice/warn/error/emeor
error_log  /var/log/nginx/error.log warn;
#pid文件
pid        /var/run/nginx.pid;
#---------------------------事件驱动模块---------------------------
#事件
events {
	#工作进程的连接数
    worker_connections  1024;
}
#------------------------------http内核模块------------------------
#网站配置
http {
	#nginx包含的文件类型
    include       /etc/nginx/mime.types;
   当遇到nginx不识别的文件就会下载
    default_type  application/octet-stream;
   日志格式   日志格式的名字
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
	#访问日志及调用格式
    access_log  /var/log/nginx/access.log  main;
   加快访问速度
    sendfile        on;
   tcp_nopush     on;
	#保持长连接
    keepalive_timeout  65;
	#压缩
   gzip  on;
	#包含的配置文件
    include /etc/nginx/conf.d/*.conf;
	server {
		#服务监听端口
        listen       80;
       域名
        server_name  localhost;
       字符集
        charset koi8-r;
       请求的地址
        location / {
        	#站点目录，当访问/的时候跳转目录
            root   /usr/share/nginx/html;
           默认访问页面
            index  index.html index.htm;
        }
    }
```

## 七、Nginx搭建小游戏示例

### 1.需求

```java
1.使用两种方式安装方式安装nginx
2.搭建一个和多个小游戏页面
```

### 2.环境准备

主机
角色
IP

web01
使用官方源安装nginx搭建多个小游戏
10.0.0.7

web02
使用源码安装nginx搭建一个游戏页面
10.0.0.8

### 3.web01搭建游戏页面

```java
1.关闭防火墙
[root@web01 ~]# systemctl stop firewalld
[root@web01 ~]# systemctl disable firewalld
2.关闭selinux
[root@web01 ~]# setenforce 0         
[root@web01 ~]# vim /etc/selinux/config
SELINUX=disabled
3.配置官方源
[root@web01 ~]# vim /etc/yum.repos.d/nginx.repo
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
4.安装依赖
[root@web01 ~]# yum install -y gcc gcc-c++ autoconf pcre pcre-devel make automake wget httpd-tools vim tree
5.安装nginx
[root@web01 ~]# yum -y install  nginx
6.启动服务设置开机自启并验证服务
[root@web01 ~]# systemctl  start nginx
[root@web01 ~]# systemctl  enable nginx
[root@web01 ~]# netstat  -lntp
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:111             0.0.0.0:*               LISTEN      6125/rpcbind        
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      8840/nginx: master  
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      7108/sshd           
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      7249/master         
tcp6       0      0 :::111                  :::*                    LISTEN      6125/rpcbind        
tcp6       0      0 :::22                   :::*                    LISTEN      7108/sshd           
tcp6       0      0 ::1:25                  :::*                    LISTEN      7249/master     
8.修改nginx主配置文件
[root@web01 ~]# vim /etc/nginx/nginx.conf 
user  www;
9.创建统一用户
[root@web01 ~]# groupadd www -g 666
[root@web01 ~]# useradd www -u 666 -g 666
10.修改nginx站点配置文件
[root@web01 /code]# vim /etc/nginx/conf.d/default.conf 
 server {
   listen 80;
   server_name www.oldboy.com;
   location / {
   root /code/malio;
   index index.html index.htm;
        }
}
 server {
   listen 81;
   server_name www.jh.com;
   location / {
   root /code/tank;
   index index.html index.htm;
        }
}
 server {
   listen 82;
   server_name www.jindada.com;
   location / {
   root /code/tuixiangzi;
   index index.html index.htm;
        }
}
11.创建目录
[root@web01 ~]# mkdir /code
12.上传游戏压缩包
[root@web01 ~]# rz -E
rz waiting to receive.
[root@web01 ~]# ll
total 2852
-rw-r--r--  1 root root  148142 Jun  5 00:06 html5-mario.zip
-rw-r--r--  1 root root  167427 Jun  5 00:00 tank.zip
-rw-r--r--  1 root root   64723 Jun  4 18:40 tuixiangzi.zip
-rw-r--r--  1 root root 2525626 Jun  4 18:06 weijingzhanzheng.zip
13。解压到指定目录，并重命名
[root@web01 ~]# unzip /root/html5-mario.zip -d /code
[root@web01 ~]# mv html5-mario/ ./malio
[root@web01 ~]# unzip /root/tank.zip  -d /code/
[root@web01 ~]# mv Battle_City/ ./tank
[root@web01 ~]# unzip /root/tuixiangzi.zip  -d /code/
[root@web01 ~]# mv HTML5\ canvas小人推箱子小游戏/ tuixiangzi
14.修改权限
[root@web01 ~]# chown  -R www:www /code/
15.检查nginx，重启服务
[root@web01 /code]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web01 /code]# systemctl  restart nginx
16.修改windows下hosts文件
C:\Windows\System32\drivers\etc\hosts
10.0.0.7	www.jh.com
10.0.0.7	www.oldboy.com
10.0.0.7	www.jindada.com
```

### 4.web02搭建游戏页面

```java
1.关闭防火墙
[root@web02 ~]# systemctl stop firewalld
[root@web02 ~]# systemctl disable firewalld
2.关闭selinux
[root@web02 ~]# setenforce 0         
[root@web02 ~]# vim /etc/selinux/config
SELINUX=disabled
3.安装依赖
[root@web02 ~]# yum install -y gcc gcc-c++ autoconf pcre pcre-devel make automake wget httpd-tools vim tree
4.下载或上传源码包
[root@web02 ~]#  wget http://nginx.org/download/nginx-1.18.0.tar.gz
#或者
[root@web03 ~]# rz nginx-1.18.0.tar.gz
5.解压
[root@web02 ~]# tar xf nginx-1.18.0.tar.gz 
6.创建用户
[root@web02 ~]# groupadd www -g 666
[root@web02 ~]# useradd www -u 666 -g 666
7.生成编译文件
[root@web02 ~]# cd nginx-1.18.0/
[root@web02 ~/nginx-1.18.0]# ./configure --prefix=/usr/local/nginx-1.18.0 --user=www --group=www --with-http_addition_module --with-http_auth_request_module --without-http_gzip_module
8.编译安装
[root@web02 ~/nginx-1.18.0]# make && make install
9.配置system管理
[root@web02 ~]# vim /etc/systemd/system/nginx.service 
[Unit]
Description=nginx - high performance web server
After=network.target remote-fs.target nss-lookup.target
[Service]
Type=forking
ExecStart=/usr/local/nginx/sbin/nginx -c /usr/local/nginx/conf/nginx.conf
ExecReload=/usr/local/nginx/sbin/nginx -s reload
ExecStop=/usr/local/nginx/sbin/nginx -s stop
[Install]
WantedBy=multi-user.target
10.做软连接
[root@web02 ~]# ln -s /usr/local/nginx-1.18.0 /usr/local/nginx
12.配置环境变量
[root@web02 ~]# vim /etc/profile.d/nginx.sh
export PATH=/usr/local/nginx/sbin/:$PATH
13.启动nginx服务
[root@web03 ~]# systemctl daemon-reload
[root@web03 ~]# systemctl start nginx
#配置开机自启
[root@web03 ~]# systemctl enable nginx
14.修改nginx主配置文件
[root@web02 ~]# vim /usr/local/nginx-1.18.0/conf/nginx.conf
user  www;
    server {
        listen       80;
        server_name  localhost;
       charset koi8-r;
       access_log  logs/host.access.log  main;
            root   /code/tuixiangzi;
            index  index.html index.htm;
        }
14.创建目录
[root@web02 ~]# mkdir /code
15.上传游戏包并解压到指定目录,重命名为tuixiangzi
[root@web02 ~]# rz -bye
[root@web02 ~]# ll
total 1088
-rw-r--r--  1 root root   64723 2020-06-04 18:40 tuixiangzi.zip
[root@web02 ~]#  unzip tuixiangzi.zip  -d /code/
[root@web02 ~]# mv /code/HTML5\ canvas小人推箱子小游戏/ /code/tuixiangzi
16.修改权限
[root@web02 ~]# chown  -R www:www /code/
17.验证服务重启服务
[root@web02 ~]# nginx  -t
nginx: the configuration file /usr/local/nginx-1.18.0/conf/nginx.conf syntax is ok
nginx: configuration file /usr/local/nginx-1.18.0/conf/nginx.conf test is successful
[root@web02 ~]# systemctl  restart nginx
```

### 5.测试

```java
1.web01打开浏览器使用域名正常登陆游戏页面
wwwww.jh.com:81		#正常显示
www.oldboy.com		#正常显示
www.jindada.cow:82	#正常显示
2.web02打开浏览器使用ip正常登陆游戏页面
10.0.0.8		#正常显示
```

## 八、Nginx常用配置方式

### 1.配置方式一

```java
1.配置
[root@web03 ~]# cat /usr/local/nginx/conf/nginx.conf
user www;
worker_processes  1;
error_log /tmp/nginx.err;
events {
    worker_connections  1024;
}
http {
    include       /usr/local/nginx/mime.types;
    default_type  application/octet-stream;
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    access_log  /usr/local/nginx/logs/access.log  main;
    sendfile        on;
    keepalive_timeout  65;
    server {
        listen       80;
        server_name  localhost;
        location / {
            root   /code;
            index  index.html;
        }
    }
}
2.上传小游戏代码
[root@web03 ~]# mkdir /code
#推送代码到站点目录
[root@web02 /code]# scp -r tuixiangzi 172.16.1.9:/code/
[root@web03 ~]# ll /code/
total 0
drwxr-xr-x 4 root root 48 2020-08-24 17:08 tuixiangzi
3、访问测试略
```

### 2.配置方式二

```java
1.配置
[root@web03 ~]# cat !$
cat /usr/local/nginx/conf/nginx.conf
user www;
worker_processes  1;
error_log /tmp/nginx.err;
events {
    worker_connections  1024;
}
http {
    include       /usr/local/nginx/conf/mime.types;
    default_type  application/octet-stream;
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    access_log  /usr/local/nginx/logs/access.log  main;
    sendfile        on;
    keepalive_timeout  65;
    include    /usr/local/nginx/conf/conf.d/*.conf;
}
#创建指定配置文件的目录
[root@web03 ~]# mkdir /usr/local/nginx/conf/conf.d
#配置
[root@web03 ~]# vim /usr/local/nginx/conf/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    location / {
        root /code/tuixiangzi;
        index index.html;
    }
}
#检查配置，授权
[root@web03 ~]# nginx -t
nginx: the configuration file /usr/local/nginx-1.18.0/conf/nginx.conf syntax is ok
nginx: configuration file /usr/local/nginx-1.18.0/conf/nginx.conf test is successful
[root@web03 ~]# chown -R www.www /usr/local/nginx/conf/
#重启
[root@web03 ~]# systemctl restart nginx
2.访问测试略
```
