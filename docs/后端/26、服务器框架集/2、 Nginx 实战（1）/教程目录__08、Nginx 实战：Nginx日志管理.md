# 08、Nginx 实战：Nginx日志管理
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/8.html
- 分类：服务器框架
- 分组：教程目录
## 一、Nginx日志概述

Nginx有非常灵活的日志记录模式，每个级别的配置可以有各自独立的访问日志,日志格式通过log_format命令定义格式。

通过访问日志，你可以得到用户地域来源、跳转来源、使用终端、某个URL访问量等相关信息；通过错误日志，你可以得到系统某个服务或server的性能瓶颈等。因此，将日志好好利用，你可以得到很多有价值的信息。

## 二、Nginx日志语法

```java
#配置语法: 包括: error.log access.log
		#指定格式  日志格式名称   日志格式      日志内容
Syntax: log_format name [escape=default|json] string ...;
Default: log_format combined "...";
Context: http
```

## 三、Nginx日志格式

```java
打开nginx.conf配置文件：vim /usr/local/nginx/conf/nginx.conf
日志部分内容：
#access_log  logs/access.log  main;
日志生成的到Nginx根目录logs/access.log文件，默认使用“main”日志格式，也可以自定义格式。
log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';
```

## 四、Nginxlog_format日志参数

$remote_addr
#记录客户端IP地址

$remote_user
#记录客户端用户名

$time_local
#记录通用的本地时间

$time_iso8601
#记录ISO8601标准格式下的本地时间

$request
#记录请求的方法以及请求的http协议

$status
#记录请求状态码(用于定位错误信息)

$body_bytes_sent
#发送给客户端的资源字节数，不包括响应头的大小

$bytes_sent
#发送给客户端的总字节数

$msec
#日志写入时间。单位为秒，精度是毫秒。

$http_referer
#记录从哪个页面链接访问过来的

$http_user_agent
#记录客户端浏览器相关信息

$http_x_forwarded_for
#记录客户端IP地址

$request_length
#请求的长度（包括请求行，请求头和请求正文）。

$request_time
#请求花费的时间，单位为秒，精度毫秒

```java
ps:如果Nginx位于负载均衡器，nginx反向代理之后， web服务器无法直接获取到客户端真实的IP地址。
# $remote_addr获取的是反向代理的IP地址。 反向代理服务器在转发请求的http头信息中。
# 增加X-Forwarded-For信息，用来记录客户端IP地址和客户端请求的服务器地址。
```

## 五、Nginx自定义日志

```java
1.第一个配置
[root@web02 /etc/nginx/conf.d]# vim mali.conf 
server {
    listen 80;
    server_name www.mali.com;
    access_log /var/log/nginx/www.mali.com.log main;
    location / {
        root /code/zhiwu;
        index index.html;
    }
}
2.第二个配置
[root@web02 /etc/nginx/conf.d]# vim tank.conf 
server {
    listen 80;
    server_name www.tank.com;
    access_log /var/log/nginx/www.tank.com.log main;
    location / {
        root /code/tank;
        index index.html;
    }
}
3.访问页面，查看日志
```

## 六、Nginx日志切割

```java
[root@web02 ~]# vim /etc/logrotate.d/nginx
#指定切割的日志
/var/log/nginx/*.log {
		#每天切割一次
        daily
       忽略丢失的日志
        missingok
       日志的保留时间
        rotate 52
       日志文件压缩
        compress
       延时压缩
        delaycompress
       忽略空文件
        not if empty
       指定日志文件权限
        create 640 nginx adm
       开启脚本
        shared scripts
       脚本内容
        postrotate
        		#判断nginx是否启动
                if [ -f /var/run/nginx.pid ]; then
                		#生成新的nginx访问日志
                        kill -USR1 cat /var/run/nginx.pid
                fi
       结束脚本
        endscript
}
```
