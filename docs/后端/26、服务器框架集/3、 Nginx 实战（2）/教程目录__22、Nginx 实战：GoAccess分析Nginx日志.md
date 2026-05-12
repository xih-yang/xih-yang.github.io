# 22、Nginx 实战：GoAccess分析Nginx日志
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/22.html
- 分类：服务器框架
- 分组：教程目录
## 1.GoAccess基本概述

GoAccess是一个基于终端的快速日志分析器。其核心思想是实时快速分析和查看Web服务器统计信息。

**1、** 安装简单；

**2、** 操作容易；

**3、** 界面酷炫；

￼

## 2.GoAccess安装方式

安装分为yum安装与源码安装，大家可以自行选择，我这里选择使用源码的方式安装

## 2.1.安装goaccess

```java
[root@xly ~]# wget https://tar.goaccess.io/goaccess-1.3.tar.gz
[root@xly ~]# tar -xzvf goaccess-1.3.tar.gz
[root@xly ~]# cd goaccess-1.3/
[root@xly ~]# yum install -y GeoIP-deve ncurses-devel
[root@xly goaccess-1.3]# ./configure --enable-utf8 --enable-geoip=legacy
[root@xly goaccess-1.3]# make && make install
```

## 2.2.goaccess基本使用

```java
指定分析日志
[root@xly ~]# goaccess  -f  /var/log/nginx/access.log
按空格选择 NCSA Combined Log Format
注意: 如果是Nginx默认的日志格式无需调整选中回车即可。
```

## 2.3.等待一会时间后，会展示分析的结果

## 3.GoAccess使用方式

## 3.1.我们更希望能将此页面保存为HTML，然后通过浏览器访问，那么我们则需要配置日志格式

```java
#搜索并修改如下配置。
[root@xly ~]# mkdir -p  /usr/local/etc/goaccess/
[root@xly ~]# touch /usr/local/etc/goaccess/goaccess.conf
[root@xly ~]# vim /usr/local/etc/goaccess/goaccess.conf
time-format %H:%M:%S
date-format %d/%b/%Y
#NCSA Combined Log Format
log-format %h %^[%d:%t %^] "%r" %s %b "%R" "%u"
```

## 3.2.通过命令指定配置，将生成的信息保存为html

```java
#1.测试是否能通过终端直接展示
[root@xly ~]# goaccess -f /var/log/nginx/access.log -p /usr/local/etc/goaccess/goaccess.conf
#2.将分析结果保存为hTML
[root@xly ~]# goaccess /var/log/nginx/access.log -o /code/log/index.html -p /usr/local/etc/goaccess/goaccess.conf
Parsing... [323,899] [53,983/s]
```

## 3.3.添加定时任务，每隔30分钟执行一次

```java
[root@xly ~]# crontab -e 
#每隔30分钟生成一次html文件
30 * * * * /usr/local/bin/goaccess /var/log/nginx/access.log -o /code/log/index.html -p /usr/local/etc/goaccess/goaccess.conf
```

## 3.4.配置一个Nginx虚拟主机，将root指向/code/log，这样可以通过域名去访问html页面

**1、** 虚拟主机,在原有的配置加一个location；

```java
	location /log {
		root /code;
		index index.html;
	}
```
