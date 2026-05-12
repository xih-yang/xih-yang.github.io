# 25、Nginx 实战：Nginx Uwsgi代理
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/25.html
- 分类：服务器框架
- 分组：教程目录
## 1.Uwsgi代理基本概述

cgi、fastcgi、wsgi、uwsgi

python框架

Django是一个开放源代码的web的框架

Flask是一个使用python编写的轻量级web应用框架

## 2 框架为什么使用uwsgi，而不是proxy

1、安全（nginx可以实现访问控制），直接后端对外是无法控制

2、效率（实现动静分离）

## 3.Uwsgi代理配置实践

- 步骤一、安装python3的环境
- 步骤二、安装Django框架、uwsgi
- 步骤三、单独测试Django与uwsgi是否正常
- 步骤四、配置项目，使项目以uwsgi方式启动
- 步骤五、配置Nginx反向代理uwsgi

## 3.0.安装依赖软件包

```java
[root@web01 ~]# yum install openssl-devel bzip2-devel expat-devel gdbm-devel readline-devel sqlite-devel gcc gcc-c++  openssl-devel zlib zlib-devel -y
```

## 3.1.安装python3环境

```java
[root@web01 ~]# wget https://www.python.org/ftp/python/3.7.2/Python-3.7.2.tgz
[root@web01 ~]# tar xf Python-3.6.2.tgz
[root@web01 ~]# cd Python-3.6.2/
[root@web01 Python-3.6.2]# ./configure --prefix=/usr/local/
[root@web01 Python-3.6.2]# make && make install
[root@web01 Python-3.6.2]# ./configure && make && make install
```

## 3.2.安装Django框架和uwsgi

```java
[root@web01 ~]# pip3 install --upgrade pip
[root@web01 ~]# pip3 install uwsgi
[root@web01 ~]# pip3 install django
```

## 3.3.测试uwsgi是否正常，新建test.py文件，内容如下

```java
[root@web01 ~]# vim test.py
def application(env, start_response):
    start_response('200 OK', [('Content-Type','text/html')])
    return [b"Hello Django"]
#然后在终端运行： 
[root@web01 ~]# uwsgi --http :8001 --wsgi-file test.py
```

## 3.4.测试django是否正常，运行如下指令

```java
[root@web01 ~]# django-admin.py startproject demosite
[root@web01 ~]# cd demosite
[root@web01 demosite]# python3 manage.py runserver 0.0.0.0:8002
#在浏览器内输入：http://127.0.0.1:8002，检查django是否运行正常。
```

## 3.5.配置uwsgi

```java
[root@web01 ~]# cat /root/demosite/uwsgi.ini
[uwsgi]
socket = 127.0.0.1:9999        uwsgi监听的端口
workers = 2                    uwsgi启动多少个进程数
max-requests = 1000            最大接收多少请求数
buffer-size = 30000
pidfile = /run/uwsgi.pid       进程pid存放位置
daemonize = /var/log/uwsgi.log 日志位置
```

## 3.6.启动uwsgi

```java
#1.先停止之前测试的uwsgi
[root@web01 ~]# pkill $(ps aux|grep uwsgi)
#2.启动uwsgi
[root@web01 ~]# uwsgi --ini /root/demosite/uwsgi.ini
```

## 3.7.配置Nginx代理至uwsgi协议

```java
[root@web01 demosite]# cat /etc/nginx/conf.d/py.conf
server {
    listen 80;
    server_name py.test.com;
    client_max_body_size 100M;
    location / {
        index index.html;
        include uwsgi_params;
        uwsgi_pass 127.0.0.1:9999;
        uwsgi_param UWSGI_SCRIPT demosite.wsgi;  demosite/wsgi
        uwsgi_param UWSGI_CHDIR /root/demosite;  工程所在的目录位置
    }
}
```

## 3.8.使用UWSGI代理方式部署Python项目
