# 20、Nginx 实战：HTTPS实现LNMP全站访问
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/20.html
- 分类：服务器框架
- 分组：教程目录
## 一、需求

1、恢复快照

2、搭建博客和phpmyadmin

3、数据库单独部署

4、配置7层负载均衡

5、多台WEB服务器（2台）文件共享

6、给项目配置全站HTTPS

## 二、环境准备

服务器
外网IP
内网IP
身份

lb01
10.0.0.4
172.16.1.4
负载均衡服务器

web01

172.16.1.7
Web服务器

web02

172.16.1.8
Web服务器

db01

172.16.1.51
数据库服务器

nfs

172.16.1.31
文件共享服务器

## 三、web01服务器配置

```java
1.关闭防火墙
[root@web01 ~]# systemctl disable firewalld
2.关闭selinux
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
[root@web01 ~]# yum -y install nginx
6.配置nginx文件
[root@web01 ~]# vim /etc/nginx/nginx.conf 
 user  www;
 client_max_body_size 200m;
 7.创建统一用户
 [root@web01 ~]# groupadd www -g 666
 [root@web01 ~]# useradd  www -u 666 -g 666
8.检查服务并启动服务、设置开机自启
[root@web01 ~]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web01 ~]# systemctl  start nginx
[root@web01 ~]# systemctl  enable nginx
Created symlink from /etc/systemd/system/multi-user.target.wants/nginx.service to /usr/lib/systemd/system/nginx.service.
9.配置nginx站点文件
[root@web01 ~]# vim /etc/nginx/conf.d/linux.wordpress.com.conf
server {
    listen 80;
    server_name linux.wordpress.com;
    charset utf-8;
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
[root@web01 ~]# vim /etc/nginx/conf.d/linux.php.com.conf 
server {
    listen 80;
    server_name linux.php.com;
    charset utf-8;
    root /code/php；
location / {
    index index.php;
}
location ~* \.php$ {
   fastcgi_pass 127.0.0.1:9000;
   fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
   include fastcgi_params;
 }
}
10.检查服务并重启
[root@web01 ~]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web01 ~]# systemctl  restart nginx
11.创建站点目录
[root@web01 ~]# mkdir /code
12.上传源码包并解压到指定目录
[root@web01 ~]# ll
-rw-r--r--  1 root root 11060845 Sep  1 15:39 phpMyAdmin-4.9.0.1-all-languages.zip
-rw-r--r--  1 root root 11098483 Aug 26 10:49 wordpress-5.0.3-zh_CN.tar.gz
[root@web01 ~]# tar  xf wordpress-5.0.3-zh_CN.tar.gz -C /code/
[root@web01 ~]# unzip phpMyAdmin-4.9.0.1-all-languages.zip  -d /code/
13.配置代码
[root@web01 /code]# cp php/config.sample.inc.php php/config.inc.php
[root@web01 /code]# vim php/config.inc.php
$cfg['Servers'][$i]['host'] = '172.16.1.51';
14.授权目录
[root@web01 ~]# chown  -R www:www  /code/
[root@web01 /code]# chown -R www.www /var/lib/php/session
```

## 四、web02服务器配置

```java
1.关闭防火墙
[root@web02 ~]# systemctl disable firewalld
2.关闭selinux
[root@web02 ~]# vim /etc/selinux/config 
SELINUX=disabled
3.配置官方源
[root@web02 ~]# vim /etc/yum.repos.d/nginx.repo
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
4.安装依赖
[root@web02 ~]# yum install -y gcc gcc-c++ autoconf pcre pcre-devel make automake wget httpd-tools vim tree
5.安装nginx
[root@web02 ~]# yum -y install nginx
6.配置nginx
[root@web02 ~]# vim /etc/nginx/nginx.conf 
user  www;
client_max_body_size 200m;
7.创建统一用户
[root@web02 ~]# groupadd www -g 666
[root@web02 ~]# useradd  www -u 666 -g 666
8.启动服务并设置开机自启
[root@web02 ~]# systemctl  start nginx
[root@web02 ~]# systemctl  enable nginx
Created symlink from /etc/systemd/system/multi-user.target.wants/nginx.service to /usr/lib/systemd/system/nginx.servi
9.配置nginx站点文件
[root@web01 /code]# scp /etc/nginx/conf.d/* 172.16.1.8:/etc/nginx/conf.d/
root@172.16.1.8's password: 
linux.php.com.conf                                                                     100%  286   124.7KB/s   00:00    
linux.wordpress.com.conf                                                               100%  323   228.3KB/s   00:00   
10.检查服务并重启
[root@web02 ~]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web02 ~]# systemctl  restart nginx
11.创建目录
[root@web02 ~]# mkdir /code
12.上传源码包并解压
[root@web01 /code]# scp /root/wordpress-5.0.3-zh_CN.tar.gz  172.16.1.8:/code
root@172.16.1.8's password: 
wordpress-5.0.3-zh_CN.tar.gz                                                           100%   11MB  21.8MB/s   00:00    
[root@web01 /code]# scp /root/phpMyAdmin-4.9.0.1-all-languages.zip   172.16.1.8:/code
root@172.16.1.8's password: 
phpMyAdmin-4.9.0.1-all-languages.zip                                                   100%   11MB  25.6MB/s   00:00    
[root@web02 ~]# cd /code/
[root@web02 /code]# tar  xf wordpress-5.0.3-zh_CN.tar.gz 
[root@web02 /code]# unzip phpMyAdmin-4.9.0.1-all-languages.zip 
13.配置代码
[root@web02 /code]# cp php/config.sample.inc.php php/config.inc.php
[root@web02 /code]# vim php/config.inc.php
$cfg['Servers'][$i]['host'] = '172.16.1.51';
14.授权目录
[root@web02 ~]# chown  -R www:www  /code/
[root@web02 /code]# chown -R www.www /var/lib/php/session
```

## 五、web01安装PHP

```java
1.创建目录
[root@web01 ~]# mkdir /package
[root@web01 ~]# cd /package/
2.上传源码包并解压
[root@web01 /package]# rz
[root@web01 /package]# ll
total 19424
-rw-r--r-- 1 root root 19889622 Aug 26 09:04 php.tar.gz
[root@web01 /package]# tar xf php.tar.gz 
3.安装PHP
[root@web01 /package]# yum -y localinstall  *.rpm
5.配置PHP
[root@web01 /package]# vim /etc/php-fpm.d/www.conf 
user = www
group = www
[root@web01 /package]# vim /etc/php.ini 
post_max_size = 200M
upload_max_filesize = 200M
6.启动PHP并设置开机自启
[root@web01 /package]# systemctl  restart php-fpm.service 
[root@web01 /package]# systemctl  enable php-fpm.service 
Created symlink from /etc/systemd/system/multi-user.target.wants/php-fpm.service to /usr/lib/systemd/system/php-fpm.service.
```

## 六、web02安装PHP

```java
1.创建目录
[root@web02 /code]# mkdir /package
[root@web02 /code]# cd /package/
2.上传源码包并解压
[root@web02 /package]# rz
[root@web02 /package]# ll
total 19424
-rw-r--r-- 1 root root 19889622 Aug 26 09:04 php.tar.gz
[root@web02 /package]# tar xf php.tar.gz 
3.安装PHP
[root@web02 /package]# yum -y localinstall  *.rpm
5.配置PHP
[root@web02 /package]# vim /etc/php-fpm.d/www.conf 
user = www
group = www
[root@web02 /package]# vim /etc/php.ini 
post_max_size = 200M
upload_max_filesize = 200M
6.启动PHP并设置开机自启
[root@web02 /package]# systemctl  start php-fpm.service 
[root@web02 /package]# systemctl  enable php-fpm.service 
Created symlink from /etc/systemd/system/multi-user.target.wants/php-fpm.service to /usr/lib/systemd/system/php-fpm.service.
```

## 七、db01安装数据库

```java
1.安装数据库
[root@db01 ~]# yum -y install  mariadb-server
2.启动服务并设置开机自启
[root@db01 ~]# systemctl  start mariadb.service 
[root@db01 ~]# systemctl  enable mariadb.service 
Created symlink from /etc/systemd/system/multi-user.target.wants/mariadb.service to /usr/lib/systemd/system/mariadb.service.
3.设置服务器密码并验证密码
[root@db01 ~]# mysqladmin  -uroot password 
New password: 
Confirm new password: 
[root@db01 ~]# mysql -u root -p
Enter password: 
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 3
Server version: 5.5.65-MariaDB MariaDB Server
Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
MariaDB [(none)]> 
4.进行数据库授权
MariaDB [(none)]> create database wordpress;
Query OK, 1 row affected (0.00 sec)
MariaDB [(none)]> grant all on wordpress.* to wp@'172.16.1.%' identified by 'wp123';
Query OK, 0 rows affected (0.00 sec)
MariaDB [(none)]> grant all on *.* to admin@'172.16.1.%' identified by 'admin123';
Query OK, 0 rows affected (0.00 sec)
MariaDB [(none)]> flush privileges;
Query OK, 0 rows affected (0.00 sec)
```

## 八、nfs服务器实现文件共享

```java
1.安装nfs
[root@nfs ~]# yum -y install  rpcbind nfs-utils
2.启动服务并设置开机自启
[root@nfs ~]# systemctl start  rpcbind  nfs
[root@nfs ~]# systemctl enable  rpcbind  nfs
Created symlink from /etc/systemd/system/multi-user.target.wants/nfs-server.service to /usr/lib/systemd/system/nfs-server.service.
3.创建用户
[root@nfs ~]# groupadd  www -g 666
[root@nfs ~]# useradd www -u 666 -g 666
4.创建目录并授权
[root@nfs ~]# mkdir -p /data/wp
[root@nfs ~]# chown  -R www:www  /data/wp/
5.配置nfs
[root@nfs ~]# vim /etc/exports
/data/wp        172.16.1.0/24(rw,sync,all_squash,anonuid=666,anongid=666)
6.重启并检查配置
[root@nfs ~]# systemctl  restart rpcbind nfs
[root@nfs ~]# cat /var/lib/nfs/etab 
/data/wp	172.16.1.0/24(rw,sync,wdelay,hide,nocrossmnt,secure,root_squash,all_squash,no_subtree_check,secure_locks,acl,no_pnfs,anonuid=666,anongid=666,sec=sys,rw,secure,root_squash,all_squash)
```

## 九、web01、web02实现nfs挂载

### 1.web01服务器配置

```java
1.安装nfs
[root@web01 /code]# yum -y install  rpcbind nfs-utils
2.启动服务并设置开机自启
[root@web01 /code]# systemctl start rpcbind nfs
[root@web01 /code]# systemctl enable rpcbind nfs
Created symlink from /etc/systemd/system/multi-user.target.wants/nfs-server.service to /usr/lib/systemd/system/nfs-server.service.
3.查看挂载点
[root@web01 /code]# showmount  -e 172.16.1.31
Export list for 172.16.1.31:
/data/wp 172.16.1.0/24
4.挂载目录并查看挂载
[root@web01 /code]# mount -t nfs 172.16.1.31:/data/wp /code/wordpress/wp-content/uploads/
[root@web01 /code]# df -h
Filesystem            Size  Used Avail Use% Mounted on
/dev/sda3              98G  1.9G   96G   2% /
devtmpfs              980M     0  980M   0% /dev
tmpfs                 991M     0  991M   0% /dev/shm
tmpfs                 991M  9.6M  981M   1% /run
tmpfs                 991M     0  991M   0% /sys/fs/cgroup
/dev/sda1             497M  120M  378M  25% /boot
tmpfs                 199M     0  199M   0% /run/user/0
172.16.1.31:/data/wp   98G  1.7G   96G   2% /code/wordpress/wp-content/uploads
```

### 2.web02服务器配置

```java
1.安装nfs
[root@web02 /package]# yum -y install  rpcbind nfs-utils
2.启动服务并设置开机自启
[root@web02 /package]# systemctl start rpcbind nfs
[root@web02 /package]# systemctl enable rpcbind nfs
Created symlink from /etc/systemd/system/multi-user.target.wants/nfs-server.service to /usr/lib/systemd/system/nfs-server.service.
3.查看挂载点
[root@web02 /package]# showmount  -e 172.16.1.31
Export list for 172.16.1.31:
/data/wp 172.16.1.0/24
4.挂载目录并查看挂载
[root@web02 /package]# mount -t nfs 172.16.1.31:/data/wp /code/wordpress/wp-content/uploads/
[root@web02 /package]# df -h
Filesystem            Size  Used Avail Use% Mounted on
/dev/sda3              98G  1.9G   96G   2% /
devtmpfs              980M     0  980M   0% /dev
tmpfs                 991M     0  991M   0% /dev/shm
tmpfs                 991M  9.6M  981M   1% /run
tmpfs                 991M     0  991M   0% /sys/fs/cgroup
/dev/sda1             497M  120M  378M  25% /boot
tmpfs                 199M     0  199M   0% /run/user/0
172.16.1.31:/data/wp   98G  1.7G   96G   2% /code/wordpress/wp-content/uploads
```

## 十、lb01服务器配置

```java
1.配置官方源
[root@lb01 ~]# scp 172.16.1.7:/etc/yum.repos.d/nginx.repo /etc/yum.repos.d/
The authenticity of host '172.16.1.7 (172.16.1.7)' can't be established.
ECDSA key fingerprint is SHA256:g6buQ4QMSFl+5MMAh8dTCmLtkIfdT8sgRFYc6uCzV3c.
ECDSA key fingerprint is MD5:5f:d7:ad:07:e8:fe:d2:49:ec:79:2f:d4:91:59:c5:03.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '172.16.1.7' (ECDSA) to the list of known hosts.
root@172.16.1.7's password: 
nginx.repo                                                                             100%  183   137.6KB/s   00:00    
2.安装依赖
[root@lb01 ~]# yum install -y gcc gcc-c++ autoconf pcre pcre-devel make automake wget httpd-tools vim tree
3.安装nginx
[root@lb01 ~]# yum -y install  nginx
3.配置nginx
[root@lb01 ~]# vim /etc/nginx/nginx.conf 
user  www;
4.创建用户
[root@lb01 ~]# groupadd www -g 666
[root@lb01 ~]# useradd www -u666 -g 666
5.生成https证书
[root@lb01 ~]# mkdir /etc/nginx/ssl_key
[root@lb01 ~]# cd /etc/nginx/ssl_key/
[root@lb01 /etc/nginx/ssl_key]# openssl genrsa -idea -out server.key 2048
Generating RSA private key, 2048 bit long modulus
...............................................+++
.............+++
e is 65537 (0x10001)
Enter pass phrase for server.key:
Verifying - Enter pass phrase for server.key:
[root@lb01 /etc/nginx/ssl_key]# openssl req -days 36500 -x509 -sha256 -nodes -newkey rsa:2048 -keyout server.key -out server.crt
Generating a 2048 bit RSA private key
.........................+++
.......................................................................................................+++
writing new private key to 'server.key'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [XX]:cn
State or Province Name (full name) []:mei
Locality Name (eg, city) [Default City]:guo
Organization Name (eg, company) [Default Company Ltd]:shan
Organizational Unit Name (eg, section) []:kou
Common Name (eg, your name or your server's hostname) []:kenan
Email Address []:kenan
6.配置站点文件
[root@lb01 /etc/nginx/ssl_key]# vim /etc/nginx/conf.d/linux.wordpress.com.conf 
upstream wordpress {
    server 172.16.1.7:80;
    server 172.16.1.8:80;
}
server {
    listen 80;
    server_name linux.wordpress.com;
    rewrite (.*) https://linux.wordpress.com$1;
}
server {
    listen 443 ssl;
    server_name linux.wordpress.com;
    ssl_certificate /etc/nginx/ssl_key/server.crt;
    ssl_certificate_key /etc/nginx/ssl_key/server.key;
    location / {
        proxy_pass http://wordpress;
        include /etc/nginx/conf.d/proxy_params;
    }
}
[root@lb01 /etc/nginx/conf.d]# vim linux.php.com.conf
upstream php {
    server 172.16.1.7:80;
    server 172.16.1.8:80;
}
server {
    listen 80;
    server_name linux.php.com;
    rewrite (.*) https://linux.php.com$1;
}
server {
    listen 443 ssl;
    server_name linux.php.com;
    ssl_certificate /etc/nginx/ssl_key/server.crt;
    ssl_certificate_key /etc/nginx/ssl_key/server.key;
    location / {
        proxy_pass http://php;
        include /etc/nginx/conf.d/proxy_params;
    }
}
7.重启服务并设置开机自启
[root@lb01 /etc/nginx/ssl_key]# systemctl  start nginx
[root@lb01 /etc/nginx/ssl_key]# systemctl  enable nginx
Created symlink from /etc/systemd/system/multi-user.target.wants/nginx.service to /usr/lib/systemd/system/nginx.service.
```

## 十一、阿里云配置HTTPS

```java
1.购买云主机
2.购买负载均衡
3.配置负载均衡端口转发
4.通过端口转发连接并配置web机器
5.配置负载均衡
6.访问负载均衡
7.申请证书
8.部署证书
```
