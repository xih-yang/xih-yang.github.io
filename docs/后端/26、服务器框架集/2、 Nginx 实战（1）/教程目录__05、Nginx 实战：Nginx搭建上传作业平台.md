# 05、Nginx 实战：Nginx搭建上传作业平台
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/5.html
- 分类：服务器框架
- 分组：教程目录
## 一、需求

1.使用两种方式安装方式安装nginx

2.搭建交作业页面

## 二、环境准备

主机
角色
IP

web02
web服务器
10.0.0.8

web01
web服务器
10.0.0.7

## 三、使用epol源配置nginx

```java
1.关闭防火墙
[root@web01 ~]# systemctl stop firewalld
[root@web01 ~]# systemctl disable firewalld
2.关闭selinux
[root@web01 ~]# setenforce 0         
[root@web01 ~]# vim /etc/selinux/config
SELINUX=disabled
3.安装nginx服务
[root@web01 ~]# yum -y install nginx
4.启动nginx服务并验证服务
[root@web01 ~]# systemctl  start nginx
[root@web01 ~]# netstat  -lntp
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:111             0.0.0.0:*               LISTEN      6125/rpcbind        
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      8752/nginx: master  
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      7108/sshd           
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      7249/master         
tcp6       0      0 :::111                  :::*                    LISTEN      6125/rpcbind        
tcp6       0      0 :::80                   :::*                    LISTEN      8752/nginx: master  
tcp6       0      0 :::22                   :::*                    LISTEN      7108/sshd           
tcp6       0      0 ::1:25                  :::*                    LISTEN      7249/master         
[root@web01 ~]# 
5.设置开机自启
[root@web01 ~]# systemctl enable nginx
Created symlink from /etc/systemd/system/multi-user.target.wants/nginx.service to /usr/lib/systemd/system/nginx.serv
6.上传交作业平台压缩包
[root@web01 ~]# rz -bye
[root@web01 ~]# ll
total 36
-rw-------. 1 root root  1350 2020-06-09 21:42 anaconda-ks.cfg
-rw-r--r--. 1 root root   497 2020-08-05 16:53 hostname_ip.sh
-rw-r--r--  1 root root 26995 2020-08-13 16:42 kaoshi.zip
7.修改nginx配置文件
[root@web01 ~]# vim /etc/nginx/conf.d/zuoye.conf 
server {
        listen       80;
        server_name  10.0.0.7;
        location / {
            root   /zuoye/www;
            index  index.html index.htm;
        }
#        access_log logs/www_access.log main;
    }
8.修改nginx主配置文件
[root@web01 ~]# vim /etc/nginx/nginx.conf
# For more information on configuration, see:
#   * Official English Documentation: http://nginx.org/en/docs/
#   * Official Russian Documentation: http://nginx.org/ru/docs/
worker_processes  1;
events {
    worker_connections  1024;
}
#error_log logs/error.log error;
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    log_format main '$remote_addr - $remote_user [$time_local] "$request"'
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    include conf.d/zuoye.conf;
}
~                                
9.创建目录
[root@web01 ~]# mkdir -p /zuoye/www
10.解压交作业平台压缩包到指定目录
[root@web01 ~]# unzip kaoshi.zip  -d /zuoye/www/
Archive:  kaoshi.zip
  inflating: /zuoye/www/info.php     
  inflating: /zuoye/www/bg.jpg       
  inflating: /zuoye/www/index.html   
  inflating: /zuoye/www/upload_file.php  
11.重启服务
[root@web01 ~]# systemctl  restart nginx
```

## 四、使用官方源配置nginx

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
[root@web02 ~]# yum install -y nginx
6.启动nginx服务并验证
[root@web02 ~]# systemctl start nginx
[root@web02 ~]# netstat -lntp
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:111             0.0.0.0:*               LISTEN      6131/rpcbind        
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      8929/nginx: master  
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      7144/sshd           
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN      7283/master         
tcp6       0      0 :::111                  :::*                    LISTEN      6131/rpcbind        
tcp6       0      0 :::22                   :::*                    LISTEN      7144/sshd           
tcp6       0      0 ::1:25                  :::*                    LISTEN      7283/master         
7.设置开机自启
[root@web02 ~]# systemctl enable nginx
Created symlink from /etc/systemd/system/multi-user.target.wants/nginx.service to /usr/lib/systemd/system/nginx.serv
8.上传交作业平台压缩包
[root@web02 ~]# rz -bye
[root@web02 ~]# ll
total 36
-rw-------. 1 root root  1350 2020-06-09 21:42 anaconda-ks.cfg
-rw-r--r--. 1 root root   497 2020-08-05 16:53 hostname_ip.sh
-rw-r--r--  1 root root 26995 2020-08-13 16:42 kaoshi.zip
9.配置nginx服务文件
[root@web02 ~]# vim /etc/nginx/conf.d/zuoye.conf
server {
        listen       80;
        server_name  10.0.0.8;
        location / {
           .   /zuoye/www;
            index  index.html index.htm;
        }
#        access_log logs/www_access.log main;
    }
10.创建目录
[root@web02 ~]# mkdir -p /zuoye/www
11.解压交作业平台压缩包到指定目录
[root@web02 ~]# unzip kaoshi.zip  -d /zuoye/www/
Archive:  kaoshi.zip
  inflating: /zuoye/www/info.php     
  inflating: /zuoye/www/bg.jpg       
  inflating: /zuoye/www/index.html   
  inflating: /zu/www/upload_file.php  
12.重启服务
[root@web02 ~]# systemctl  restart nginx
```

## 五、测试

```java
web01能正常访问上传作业平台
web02能正常访问上传作业平台
```
