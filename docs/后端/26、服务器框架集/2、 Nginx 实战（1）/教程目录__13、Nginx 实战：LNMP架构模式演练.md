# 13、Nginx 实战：LNMP架构模式演练
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/13.html
- 分类：服务器框架
- 分组：教程目录
## 一、LNMP架构简介

LNMP是一套技术的组合，L=Linux、N=Nginx、M~=MySQL、P~=PHP

不仅仅包含这些，还有redis/ELK/zabbix/git/jenkins/kafka

## 二、LNMP工作方式

```java
首先Nginx服务是不能处理动态请求，那么当用户发起动态请求时, Nginx又是如何进行处理的。
1.静态请求：请求静态文件的请求
静态文件：
1）上传时什么样子，查看时就是什么样子
2）html的页面都是静态的
2.动态请求：请求动态内容，带参数的请求
1）服务器上并不是真实存在的，需要都数据库等服务上去获取数据，组成的页面
当用户发起http请求，请求会被Nginx处理，如果是静态资源请求Nginx则直接返回，如果是动态请求Nginx则通过fastcgi协议转交给后端的PHP程序处理
```

## 三、LNMP访问流程

```java
1.浏览器输入域名，浏览器拿着域名去本地hosts文件解析，然后再去DNS服务器解析
2.本地hosts文件或者DNS服务器解析域名为IP
3.浏览器去请求该IP对应的web服务器
4.浏览器请求nginx
5.nginx判断请求是动态请求还是静态请求
	#静态请求
	location / {
    	root /code;
    	index index.html;
	}
	location ~* \.(jpg|png|mp4)$ {
        root /code/pic;
	}
	#动态请求
	location ~* \.php$ {
    	fastcgi_pass 127.0.0.1:9000;
    	... ...
	}
6.如果是静态请求，nginx直接返回内容
7.如果是动态内容，nginx会通过fastcgi协议找php-fpm管理进程
8.php-fpm管理进程会去下发工作给wrapper工作进程
9.wrapper工作进程判断是不是php文件
10.如果只是php文件，可以直接解析然后返回结果
11.如果还需要读取数据库，wrapper进程会去读取数据库数据，然后返回数据
12.数据流转：
	1）请求：浏览器-->负载均衡-->nginx-->php-fpm-->wrapper-->mysql
	2）响应：mysql-->wrappe-->php-fpm-->nginx-->负载均衡-->浏览器
```

## 四、LNMP架构部署

### 1.安装nginx

```java
1.配置官方源
[root@web01 ~]# vim /etc/yum.repos.d/nginx.repo
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
2.安装nginx
[root@web01 ~]# yum install -y nginx
3.配置nginx
[root@web01 ~]# vim /etc/nginx/nginx.conf 
user  www;
4.添加用户
[root@web01 ~]# groupadd www -g 666
[root@web01 ~]# useradd www -u 666 -g 666
5.启动服务
[root@web01 ~]# systemctl start nginx
[root@web01 ~]# systemctl enable nginx
Created symlink from /etc/systemd/system/multi-user.target.wants/nginx.service to /usr/lib/systemd/system/nginx.service.
6.验证服务
[root@web01 ~]# ps -ef | grep nginx
```

### 2.安装PHP

```java
1.配置第三方源
[root@web01 ~]# vim /etc/yum.repos.d/php.repo
[php-webtatic]
name = PHP Repository
baseurl = http://us-east.repo.webtatic.com/yum/el7/x86_64/
gpgcheck = 0
2.卸载旧版本
[root@web01 ~]# yum remove php-mysql-5.4 php php-fpm php-common
3.安装PHP
[root@web01 ~]# yum -y install php71w php71w-cli php71w-common php71w-devel php71w-embedded php71w-gd php71w-mcrypt php71w-mbstring php71w-pdo php71w-xml php71w-fpm php71w-mysqlnd php71w-opcache php71w-pecl-memcached php71w-pecl-redis php71w-pecl-mongodb
4.安装方式二
#创建存放服务包的目录
[root@web01 ~]# mkdir /package
[root@web01 ~]# cd /package/
#上传包
[root@web01 /package]# rz php.tar.gz
#解压包
[root@web01 /package]# tar xf php.tar.gz
#安装所有rpm包
[root@web01 /package]# yum localinstall -y *.rpm
5.配置PHP
[root@web01 /package]# vim /etc/php-fpm.d/www.conf
user = www
group = www
6.启动服务
[root@web01 /package]# systemctl start php-fpm
[root@web01 /package]# systemctl enable php-fpm
7.验证启动
[root@web01 /package]# ps -ef | grep php
[root@web01 /package]# netstat -lntp
tcp       0      0 127.0.0.1:9000         0.0.0.0:*        LISTEN      7748/php-fpm: master
```

### 3.搭建交作业平台

```java
1.配置nginx
[root@web01 /package]# vim /etc/nginx/conf.d/default.conf 
server {
    listen 80;
    server_name www.zuoye.com;
    location / {
        root /code/zuoye;
        index index.html;
    }
}
2创建站点目录
[root@web01 /package]# mkdir /code/zuoye -p
3.上传代码
[root@web01 /package]# cd /code/zuoye/
[root@web01 /code/zuoye]# rz kaoshi.zip
[root@web01 /code/zuoye]# yum install -y unzip
[root@web01 /code/zuoye]# unzip kaoshi.zip
#授权
[root@web01 /code/zuoye]# chown -R www.www /code/
4.修改交作业代码
[root@web01 /code/zuoye]# vim upload_file.php 
$wen="/code/zuoye/upload";
5.访问测试
[root@web01 /code/zuoye]# systemctl restart nginx
#配置本地hosts文件
10.0.0.7 www.zuoye.com
#访问www.zuoye.com
6.问题
#报错405，原因是nginx作为web服务器没有办法处理post请求，我们要用php的代码，需要关联nginx和php
```

### 4.关联nginx和PHP

```java
1.关联语法
#fastcgi_pass，进行连接PHP
Syntax:	fastcgi_pass address;
Default:	—
Context:	location, if in location
#默认php页面
Syntax:	fastcgi_index name;
Default:	—
Context:	http, server, location
#请求的文件
Syntax:	fastcgi_param parameter value [if_not_empty];
Default:	—
Context:	http, server, location
2.配置
[root@web01 /code/zuoye]# vim /etc/nginx/conf.d/default.conf 
server {
    listen 80;
    server_name www.zuoye.com;
    location / {
        root /code/zuoye;
        index index.html;
    }
    location ~* \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME /code/zuoye/$fastcgi_script_name;
        include fastcgi_params;
    }
}
3.访问页面测试
#访问http://www.zuoye.com/
1)上传文件成功
2)413报错：文件过大，解决方式
#修改nginx上传文件大小
[root@web01 /code/zuoye]# vim /etc/nginx/nginx.conf
http {
	... ...
    client_max_body_size 100M;
    ... ...
}
[root@web01 /code/zuoye]# systemctl restart nginx
#修改php上传文件大小
[root@web01 /code/zuoye]# vim /etc/php.ini
post_max_size = 100M
upload_max_filesize = 100M
[root@web01 /code/zuoye]# systemctl restart php-fpm
```

### 5.搭建mariadb

```java
1安装
[root@web01 /code/zuoye]# yum install -y mariadb-server
2.启动服务
[root@web01 /code/zuoye]# systemctl start mariadb
[root@web01 /code/zuoye]# systemctl enable mariadb
3.验证
[root@web01 /code/zuoye]# netstat -lntp
tcp        0      0 0.0.0.0:3306            0.0.0.0:*               LISTEN      9887/mysqld
4，连接
[root@web01 /code/zuoye]# mysql
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 2
Server version: 5.5.65-MariaDB MariaDB Server
Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
MariaDB [(none)]> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| test               |
+--------------------+
4 rows in set (0.00 sec)
5.设置数据库密码
#设置密码
[root@web01 /code/zuoye]# mysqladmin -u root password "123"
#使用密码连接
[root@web01 /code/zuoye]# mysql -u root -p
Enter password:
```

### 6.关联PHP和mariadb

```java
1.编写PHP测试连接数据库代码
[root@web01 /code/zuoye]# vim php_mysql.php
<?php
    $servername = "localhost";
    $username = "root";
    $password = "123";
    // 创建连接
    $conn = mysqli_connect($servername, $username, $password);
    // 检测连接
    if (!$conn) {
        die("Connection failed: " . mysqli_connect_error());
    }
    echo "小哥哥,php可以连接MySQL...";
?>
<img style='width:100%;height:100%;' src=https://blog.driverzeng.com/zenglaoshi/php_mysql.png>
2.访问
http://www.zuoye.com/php_mysql.php
```

## 五、LNMP架构搭建WordPress

### 1.上传代码

```java
[root@web01 /code/zuoye]# cd /code/
[root@web01 /code]# rz wordpress-5.0.3-zh_CN.tar.gz
```

### 2.解压源码包

```java
[root@web01 /code]# tar xf wordpress-5.0.3-zh_CN.tar.gz 
[root@web01 /code]# ll
total 10844
drwxr-xr-x 5 1006 1006     4096 Jan 11  2019 wordpress
#授权
[root@web01 /code]# chown -R www.www /code/
```

### 3.配置nginx

```java
[root@web01 /code]# vim /etc/nginx/conf.d/linux.blog.com.conf
server {
    listen 80;
    server_name linux.blog.com;
    location / {
        root /code/wordpress;
        index index.php;
    }
    location ~* \.php$ {
        root /code/wordpress;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 4.重启访问

```java
#重启nginx
[root@web01 /code]# systemctl restart nginx
#配置本地hosts
10.0.0.7 linux.blog.com
#访问
http://linux.blog.com
```

### 5.创建数据库

```java
[root@web01 /code]# mysql -uroot -p123
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 3
Server version: 5.5.65-MariaDB MariaDB Server
Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
MariaDB [(none)]> create database blog;
Query OK, 1 row affected (0.00 sec)
MariaDB [(none)]> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| blog               |
| mysql              |
| performance_schema |
| test               |
+--------------------+
5 rows in set (0.00 sec)
```

## 六、LNMP架构搭建知乎

### 1.上传代码

```java
[root@web01 /code]# rz WeCenter_3-2-1.zip
```

### 2.解压源码包

```java
[root@web01 /code]# unzip WeCenter_3-2-1.zip
[root@web01 /code]# mv WeCenter_3-2-1 zhihu
#授权
[root@web01 /code]# chown -R www.www /code/
```

### 3.配置nginx

```java
[root@web01 /code]# vim /etc/nginx/conf.d/linux.zh.com.conf
server {
    listen 80;
    server_name linux.zh.com;
    location / {
        root /code/zhihu;
        index index.php;
    }
    location ~* \.php$ {
        root /code/zhihu;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 4.重启访问

```java
[root@web01 /code]# systemctl restart nginx
#配置本地hosts
```

### 5.创建数据库

```java
[root@web01 /code]# mysql -uroot -p123
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 131
Server version: 5.5.65-MariaDB MariaDB Server
Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
MariaDB [(none)]> create database zh;
Query OK, 1 row affected (0.00 sec)
MariaDB [(none)]> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| blog               |
| mysql              |
| performance_schema |
| test               |
| zh                 |
+--------------------+
6 rows in set (0.00 sec)
```

## 七、LNMP架构实战演练

### 1.需求

```java
1.使用nginx关联php搭建交作业页面
2.搭建wordpress
3.搭建知乎
```

### 2.环境准备

主机
角色
IP

web02
使用web02服务器搭建LNMP架构
10.0.0.8

### 3官方源安装nginx

```java
1.配置官方源
[root@web02 ~]# vim /etc/yum.repos.d/nginx.repo 
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
2.安装nginx
[root@web02 ~]# yum -y install nginx
3.启动服务并设置开机自启
[root@web02 ~]# systemctl start nginx
[root@web02 ~]# systemctl enable nginx
4.配置nginx
[root@web02 ~]# vim /etc/nginx/nginx.conf 
user  www;
5.创建统一用户
[root@web02 ~]# groupadd www -g 666
[root@web02 ~]# useradd www -u 666 -g 666
6.重启服务并验证服务
[root@web02 ~]# systemctl restart nginx
[root@web02 ~]# ps aux |grep nginx
root      33463  0.0  0.0  46352   980 ?        Ss   19:46   0:00 nginx: master process /usr/sbin/nginx -c /etc/nginx/nginx.conf
www       33464  0.0  0.0  46744  1940 ?        S    19:46   0:00 nginx: worker process
root      33468  0.0  0.0 112708   976 pts/0    R+   19:46   0:00 grep --color=auto nginx
```

### 4.安装PHP

```java
1.上传源码包并解压
[root@web02 ~]# mkdir /package/
[root@web02 ~]# cd /package/
[root@web02 /package]# rz -be
[root@web02 /package]# ll
total 19424
-rw-r--r-- 1 root root 19889622 2020-08-26 09:04 php.tar.gz
[root@web02 /package]# 
[root@web02 /package]# tar xf php.tar.gz
2.安装源码包
[root@web02 /package]# yum -y localinstall *.rpm
3.配置PHP
[root@web02 /package]# vim /etc/php-fpm.d/www.conf 
user = www
group = www
4，重启服务
[root@web02 /package]# systemctl  restart php-fpm.service 
[root@web02 /package]# systemctl  enable php-fpm.service 
Created symlink from /etc/systemd/system/multi-user.target.wants/php-fpm.service to /usr/lib/systemd/system/php-fpm.service.
5.验证服务
[root@web02 /package]# netstat -lntp
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 127.0.0.1:9000          0.0.0.0:*               LISTEN      33804/php-fpm: mast 
tcp        0      0 0.0.0.0:111             0.0.0.0:*               LISTEN      6131/rpcbind        
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      33463/nginx: master 
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      7144/sshd           
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      7283/master         
tcp6       0      0 :::111                  :::*                    LISTEN      6131/rpcbind        
tcp6       0      0 :::22                   :::*                    LISTEN      7144/sshd           
tcp6       0      0 ::1:25                  :::*                    LISTEN      7283/master         
```

### 5.搭建交作业平台

```java
1.配置nginx
[root@web02 /package]# vim /etc/nginx/conf.d/linux.zuoye.com.conf
server {
    listen 80;
    server_name linux.zuoye.com;
location / {
    root /code/zuoye;
    index index.html;
 }
}
2.创建站点目录
[root@web02 /package]# mkdir -p /code/zuoye
3.上传交作业平台源码包并解压
[root@web02 /package]# cd /code/zuoye/
[root@web02 /code/zuoye]# rz -be
[root@web02 /code/zuoye]# ll
total 28
-rw-r--r-- 1 root root 26995 2020-08-13 16:42 kaoshi.zip
[root@web02 /code/zuoye]# unzip kaoshi.zip 
4.授权目录
[root@web02 /code/zuoye]# chown  -R  www:www  /code/
5.重启服务
[root@web02 /code/zuoye]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web02 /code/zuoye]# systemctl restart nginx
6.配置本地hosts文件
C:\Windows\System32\drivers\etc
10.0.0.8	linux.zuoye.com
```

### 6.nginx关联PHP

```java
1.配置nginx文件
[root@web02 /code/zuoye]# vim /etc/nginx/conf.d/linux.zuoye.com.conf 
server {
    listen 80;
    server_name linux.zuoye.com;
location / {
    root /code/zuoye;
    index index.html;
 }
location ~* \.php$ {
    root /code/zuoye;
    fastcgi_pass 127.0.0.1:9000;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
 }
}
2.配置php文件上传和下载大小
[root@web02 /code/zuoye]# vim /etc/php.ini
post_max_size = 100M
upload_max_filesize = 100M
3.配置nginx文件上传和下载大小
[root@web02 /code/zuoye]# vim /etc/nginx/nginx.conf 
client_max_body_size 100M;
4.验证nginx并重启
[root@web02 /code/zuoye]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web02 /code/zuoye]# systemctl  restart nginx
[root@web02 /code/zuoye]# systemctl  restart php-fpm.service 
```

### 7.创建数据库mariadb

```java
1.安装数据库
[root@web02 /code/zuoye]# yum -y install  mariadb-server
2.启动数据库设置开机自启
[root@web02 /code/zuoye]# systemctl start mariadb.service 
[root@web02 /code/zuoye]# systemctl enable mariadb.service 
Created symlink from /etc/systemd/system/multi-user.target.wants/mariadb.service to /usr/lib/systemd/system/mariadb.service.
3.设置数据库密码
[root@web02 /code/zuoye]# mysqladmin  -u root  password root
4.密码进入验证
[root@web02 /code/zuoye]# mysql -uroot -p 
Enter password: 
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 4
Server version: 5.5.65-MariaDB MariaDB Server
Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
MariaDB [(none)]> 
5.创建数据库
MariaDB [(none)]> create database blog;
Query OK, 1 row affected (0.00 sec)
MariaDB [(none)]> create database zh;
Query OK, 1 row affected (0.00 sec)
```

### 8.关联PHP和mariadb

```java
1.编写PHP测试连接数据库代码
[root@web02 /code/zuoye]# vim php_mysql.php
<?php
    $servername = "localhost";
    $username = "root";
    $password = "root";
    // 创建连接
    $conn = mysqli_connect($servername, $username, $password);
    // 检测连接
    if (!$conn) {
        die("Connection failed: " . mysqli_connect_error());
    }
    echo "小哥哥,php可以连接MySQL...";
?>
<img style='width:100%;height:100%;' src=https://blog.driverzeng.com/zenglaoshi/php_mysql.png>
2.访问
http://www.zuoye.com/php_mysql.php
```

### 9.搭建WordPress

```java
1.上传代码
[root@web02 /code]# rz -be
[root@web02 /code]# ll
-rw-r--r-- 1 root root  8451194 2020-08-26 18:31 WeCenter_3-2-1.zip
-rw-r--r-- 1 root root 11098483 2020-08-26 10:49 wordpress-5.0.3-zh_CN.tar.gz
drwxr-xr-x 2 www  www       116 2020-08-26 20:25 zuoye
[root@web02 /code]# tar xf wordpress-5.0.3-zh_CN.tar.gz 
2.授权目录
[root@web02 /code]# chown -R www:www /code/
3.配置nginx
[root@web02 /code]# vim /etc/nginx/conf.d/linux.blog.com.conf
server {
    listen 80;
    server_name linux.blog.com;
location / {
    root /code/wordpress;
    index index.php;
 }
location ~* \.php$ {
    root /code/wordpress;
    fastcgi_pass 127.0.0.1:9000;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
 }
4.验证并重启
[root@web02 /code]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web02 /code]# systemctl  restart   nginx
5.配置本地hosts文件
C:\Windows\System32\drivers\etc
10.0.0.8	linux.blog.com
```

### 10.搭建wecenter

```java
1.上传代码
[root@web02 /code]#rz -be
[root@web02 /code]# ll
-rw-r--r--  1 www  www   8451194 2020-08-26 18:31 WeCenter_3-2-1.zip
drwxr-xr-x  5 www  www      4096 2019-01-11 18:00 wordpress
-rw-r--r--  1 www  www  11098483 2020-08-26 10:49 wordpress-5.0.3-zh_CN.tar.gz
drwxr-xr-x  2 www  www       116 2020-08-26 20:25 zuoye
[root@web02 /code]#unzip WeCenter_3-2-1.zip
2.授权目录
[root@web02 /code]# chown  -R www:www /code/
3.配置nginx
[root@web02 /code]# vim /etc/nginx/conf.d/linux.zh.com.conf
server {
    listen 80;
    server_name linux.zh.com;
location / {
    root /code/zh;
    index index.php;
 }
location ~* \.php$ {
    root /code/zh;
    fastcgi_pass 127.0.0.1:9000;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
 }
}
4.验证并重启
[root@web02 /code]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web02 /code]# systemctl  restart   nginx
5.配置本地hosts文件
C:\Windows\System32\drivers\etc
10.0.0.8	linux.zh.com
```
