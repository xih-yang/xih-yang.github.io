# 10、Nginx 实战：Nginx官方源安部署
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/10.html
- 分类：服务器框架
- 分组：教程目录
## 一、需求

1.恢复快照

2.三台机器使用官方源安装

3.搭建小游戏

4.使用模块搭建目录索引页面，可以下载文件

## 二、环境准备

主机
角色
IP

web01
使用官方源搭建nginx完成相关要求
10.0.0.7

web02
使用官方源搭建nginx完成相关要求
10.0.0.8

web03
使用官方源搭建nginx完成相关要求
10.0.0.9

## 三、web01服务器搭建Nginx

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
6.启动服务并验证服务
[root@web01 ~]# netstat  -lntp
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:111             0.0.0.0:*               LISTEN      6125/rpcbind        
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      9456/nginx: master  
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      7108/sshd           
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      7249/master         
tcp6       0      0 :::111                  :::*                    LISTEN      6125/rpcbind        
tcp6       0      0 :::22                   :::*                    LISTEN      7108/sshd           
tcp6       0      0 ::1:25                  :::*                    LISTEN      7249/master         
7.配置nginx文件
[root@web01 ~]# vim /etc/nginx/nginx.conf 
user www;
8.创建统一用户
[root@web01 ~]# groupadd -g 666 www
[root@web01 ~]# useradd -u 666 -g 666 www
9.配置nginx站点目录
[root@web01 /code/download]# vim /etc/nginx/conf.d/tank.conf 
server {
    listen 80;
    server_name localhost;
    charset utf-8;
    access_log /var/log/nginx/tank.log main;
location / {
    root /code/tank;
    index index.html;
    }
location /download {
    root /code;
    autoindex on;
    autoindex_exact_size off;
    autoindex_localtime on;
    index index.html;
    }
}
10.创建目录
[root@web01 ~]# mkdir /code
[root@web01 ~]# mkdir /code/download
11.上传游戏压缩包并解压到指定文件夹
[root@web01 ~]# rz -E
rz waiting to receive.
[root@web01 ~]# ll
total 172
-rw-------. 1 root root   1350 2020-06-09 21:42 anaconda-ks.cfg
-rw-r--r--. 1 root root    497 2020-08-05 16:53 hostname_ip.sh
-rw-r--r--  1 root root 167427 2020-06-05 00:00 tank.zip
[root@web01 ~]# 
[root@web01 ~]# unzip tank.zip  -d /code/
12.上传文件到指定目录
[root@web01 /code/download]# ll
total 340
-rw-r--r-- 1 root root  53519 2020-08-19 14:46 HTTP_Status_Chrome插件_1_0_2_.crx
-rw-r--r-- 1 root root  26995 2020-08-13 16:42 kaoshi.zip
-rw-r--r-- 1 root root  64723 2020-06-04 18:40 tuixiangzi.zip
-rw-r--r-- 1 root root 195152 2020-06-04 18:38 wuziqi.zip
13.授权目录
[root@web01 /code/download]#chown -R www:www /code
14.检查服务并重启
[root@web01 /code/download]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web01 /code/download]# systemctl  restart nginx
```

## 四、web02服务器搭建Nginx

```java
1.关闭防火墙
[root@web02 ~]# systemctl stop firewalld
[root@web02 ~]# systemctl disable firewalld
2.关闭selinux
[root@web02 ~]# setenforce 0         
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
[root@web02 ~]# yum -y install  nginx
6.启动服务并验证
[root@web02 ~]# systemctl  restart nginx
[root@web02 ~]# ps aux |grep nginx
root      24880  0.0  0.0  46352   968 ?        Ss   16:18   0:00 nginx: master process /usr/sbin/nginx -c /etc/nginx/nginx.conf
nginx     24881  0.0  0.0  46744  1668 ?        S    16:18   0:00 nginx: worker process
root      24883  0.0  0.0 112708   972 pts/2    R+   16:18   0:00 grep --color=auto nginx
7.配置nginx文件
user  www;
8.创建统一用户
[root@web02 ~]# groupadd -g 666 www
[root@web02 ~]# useradd -u 666 -g 666 www
9.配置nginx站点文件
[root@web02 ~]# vim /etc/nginx/conf.d/default.conf 
server {
    listen       80;
    server_name  www.jindada.com;
    access_log /var/log/nginx/www.jindada.com.log main;
    charset utf-8;
location / {
    root /code/tuixiangzi;
    index index.html;
}
location /mydownload  {
    root /code;
    index index.html;
    autoindex on;
    autoindex_exact_size off;
    autoindex_localtime on;
}
}
10.创建目录
[root@web02 ~]# mkdir /code 
[root@web02 ~]# mkdir /code/mydownload
11.上传游戏压缩包并解压到指定文件夹
[root@web02 ~]# rz
[root@web02 ~]# ll
total 72
-rw-------. 1 root root  1350 2020-06-09 21:42 anaconda-ks.cfg
-rw-r--r--. 1 root root   497 2020-08-05 16:53 hostname_ip.sh
-rw-r--r--  1 root root 64723 2020-06-04 18:40 tuixiangzi.zip
[root@web02 ~]# unzip tuixiangzi.zip  -d /code/
12.上传文件到指定文件夹
[root@web02 ~]# ll /code/mydownload/
total 1020
-rw-r--r-- 1 root root  17742 2017-11-30 15:41 mysql函数练习1.docx
-rw-r--r-- 1 root root 714029 2017-12-11 14:46 mysql视图操作练习.docx
-rw-r--r-- 1 root root      0 2020-08-24 16:33 ؍rz
-rw-r--r-- 1 root root    289 2017-10-16 15:01 作业注意事项.txt
-rw-r--r-- 1 root root  26934 2017-11-02 14:20 单表查询操作.docx
-rw-r--r-- 1 root root  55632 2017-12-07 16:25 数据库操作命令和截图.docx
-rw-r--r-- 1 root root 120070 2017-10-19 16:10 数据查询操作.docx
-rw-r--r-- 1 root root  15662 2017-11-02 15:07 数据查询操作练习.docx
-rw-r--r-- 1 root root  77312 2017-10-16 21:08 新建_Microsoft_Word_文档.doc
13.授权目录
[root@web02 ~]# chown  -R www:www /code/
14.配置本地域名解析
C:\Windows\System32\drivers\etc
10.0.0.6   www.jindada.com
15.检查服务和重启服务
[root@web02 ~]# nginx -t 
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web02 ~]# systemctl  restart nginx
```

## 五、web03服务器搭建Nginx

```java
1.关闭防火墙
[root@web03 ~]# systemctl stop firewalld
[root@web03 ~]# systemctl disable firewalld
2.关闭selinux
[root@web03 ~]# setenforce 0         
[root@web03 ~]# vim /etc/selinux/config
SELINUX=disabled
3.配置官方源
[root@web03 ~]# vim /etc/yum.repos.d/nginx.repo
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
4.安装依赖
[root@web03 ~]# yum install -y gcc gcc-c++ autoconf pcre pcre-devel make automake wget httpd-tools vim tree
5.安装nginx
[root@web03 ~]# yum -y install  nginx
6.启动服务和验证服务
[root@web03 ~]# systemctl  start nginx
[root@web03 ~]# ps aux |grep nginx
root      24946  0.0  0.0  46352   976 ?        Ss   16:43   0:00 nginx: master process /usr/sbin/nginx -c /etc/nginx/nginx.conf
nginx     24947  0.0  0.0  46744  1936 ?        S    16:43   0:00 nginx: worker process
root      24949  0.0  0.0 112708   976 pts/2    R+   16:43   0:00 grep --color=auto nginx
7.配置nginx主配置文件
[root@web03 ~]# vim /etc/nginx/nginx.conf 
user  www;
8.创建统一用户
[root@web03 ~]# groupadd -g 666 www
[root@web03 ~]# useradd -u 666 -g 666 www
9.配置nginx站点目录
[root@web03 ~]# vim /etc/nginx/conf.d/default.conf 
server {
    listen       80;
    server_name  www.jh.com;
    charset utf-8;
    access_log /var/log/nginx/www.jh.com.log main;
location / {
    root /code/wuziqi;
    index index.html;
}
location /jhdownload {
    root /code;
    index index.html;
    autoindex on;
    autoindex_exact_size off;
    autoindex_localtime on;
}
}
10.创建目录
[root@web03 ~]# mkdir /code
[root@web03 ~]# mkdir /code/jhdownload
11.上传游戏压缩包并解压到指定目录
[root@web03 ~]# rz
[root@web03 ~]# ll
total 200
-rw-------. 1 root root   1350 2020-06-09 21:42 anaconda-ks.cfg
-rw-r--r--. 1 root root    497 2020-08-05 16:53 hostname_ip.sh
-rw-r--r--  1 root root 195152 2020-06-04 18:38 wuziqi.zip
[root@web03 ~]# unzip wuziqi.zip  -d /code/
12.上传文件到指定目录
root@web03 /code/jhdownload]#ll
total 1852
-rw-r--r-- 1 root root 545433 2017-08-30 16:01 云计算安全框架V2.0部署手册.pdf
-rw-r--r-- 1 root root 545433 2017-08-30 16:01 云计算安全框架V2.0部署手册.pdf.0
-rw-r--r-- 1 root root 795660 2017-08-30 16:01 先电云计算网络搭建操作手册-Clo
13.授权目录
[root@web03 /code/jhdownload]# chown  -R www:www  /code/
14.修改本地域名解析文件
C:\Windows\System32\drivers\etc
10.0.0.9 www.jh.com
15.检查服务并重启
[root@web03 /code/jhdownload]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web03 /code/jhdownload]# 
[root@web03 /code/jhdownload]# systemctl  restart nginx
```

## 六、测试

```java
1.web01服务器
可以正常访问游戏页面和文件页面
2.web02服务器
可以正常访问游戏页面和文件页面
3.web03服务器
可以正常访问游戏页面和文件页面
```
