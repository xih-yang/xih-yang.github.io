# 03、Nginx 实战：Centos7下Nginx各种方式安装
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/3.html
- 分类：服务器框架
- 分组：教程目录
## 一、epol源安装

```java
[root@web01 ~]# yum install -y nginx
```

## 二、官方源安装

### 1.配置官方源

```java
[root@web02 ~]# vim /etc/yum.repos.d/nginx.repo
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
```

### 2.安装依赖

```java
[root@web02 ~]# yum install -y gcc gcc-c++ autoconf pcre pcre-devel make automake wget httpd-tools vim tree
```

### 3.安装nginx

```java
[root@web02 ~]# yum install -y nginx
```

### 4.启动服务

```java
[root@web02 ~]# systemctl start nginx
#或者
[root@web02 ~]# nginx
```

### 5.检验启动

```java
#方式一：
	[root@web02 ~]# ps -ef | grep nginx
#方式二：
	[root@web02 ~]# netstat -lntp | grep 80
#方式三：
	访问页面 10.0.0.8:80
#方式四：
1.查看版本
[root@web02 ~]# nginx -v
2.查看安装模块
[root@web02 ~]# nginx -V
```

## 三、源码包安装

### 1.安装依赖

```java
[root@web03 ~]# yum install -y gcc gcc-c++ autoconf pcre pcre-devel make automake wget httpd-tools vim tree
```

### 2.下载或上传源码包

```java
[root@web03 ~]# wget http://nginx.org/download/nginx-1.18.0.tar.gz
#或者
[root@web03 ~]# rz nginx-1.18.0.tar.gz
```

### 3.解压

```java
[root@web03 ~]# tar xf nginx-1.18.0.tar.gz
```

### 4.创建用户

```java
[root@web03 ~]# groupadd www -g 666
[root@web03 ~]# useradd www -u 666 -g 666
```

### 5.生成编译文件

```java
[root@web03 ~]# cd nginx-1.18.0/
[root@web03 ~/nginx-1.18.0]# ./configure --prefix=/usr/local/nginx-1.18.0 --user=www --group=www --with-http_addition_module --with-http_auth_request_module --without-http_gzip_module
```

### 6.编译安装

```java
[root@web03 ~/nginx-1.18.0]# make && make install
```

### 7.配置system管理

```java
[root@web03 ~]# vim /etc/systemd/system/nginx.service 
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
```

### 8.做软连接

```java
[root@web03 ~]# ln -s /usr/local/nginx-1.18.0 /usr/local/nginx
#软连接的作用：
1)配置环境变量可以不加版本号
2)配置system启动可以不加版本号
3)升级直接切换软连接的链接文件即可
```

### 9.配置环境变量

```java
[root@web03 ~]# cat /etc/profile.d/nginx.sh 
export PATH=/usr/local/nginx/sbin/:$PATH
```

### 10.启动

```java
[root@web03 ~]# systemctl daemon-reload
[root@web03 ~]# systemctl start nginx
#配置开机自启
[root@web03 ~]# systemctl enable nginx
```

## 四、Nginx常用命令

### 1.启动命令

```java
[root@web02 ~]# systemctl start nginx
#或者
[root@web02 ~]# nginx
ps:使用哪种方式启动就用哪种方式关闭
```

### 2.关闭命令

```java
[root@web02 ~]# systemctl stop nginx
#或者
[root@web02 ~]# nginx -s stop
```

### 3.重启命令

```java
[root@web02 ~]# systemctl restart nginx
```

### 4.nginx重载配置文件

```java
[root@web02 ~]# systemctl reload nginx
#或者
[root@web02 ~]# nginx -s reload
```

### 5.检查nginx配置

```java
[root@web01 ~]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 6.加入开机自启

```java
[root@web01 ~]# systemctl enable nginx
Created symlink from /etc/systemd/system/multi-user.target.wants/nginx.service to /usr/lib/systemd/system/nginx.service.
```

### 7.CentOS6操作

```java
#启动
[root@web01 ~]# nginx
[root@web01 ~]# /etc/init.d/nginx start
[root@web01 ~]# service nginx start
#配置开机自启
[root@web01 ~]# chkconfig nginx on
```
