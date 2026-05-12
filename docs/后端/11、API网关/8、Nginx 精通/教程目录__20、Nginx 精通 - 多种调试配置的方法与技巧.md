# 20、Nginx 精通 - 多种调试配置的方法与技巧
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/20.html
- 分类：服务器框架
- 分组：教程目录
NGINX功能强大，模块多，对复杂需求要正确配置或正确调优 ，是有一定难度的。因此，如何进行配置调试就很重要，特别是对于生产环境调试。本文主要提供调试方法或技巧，对于配置调试Nginx非常又帮助。

**目录**

在线调试步骤

如何用好日志

日志配置

非调试级别日志

不匹配测试

匹配测试

调试级别日志

不匹配测试

匹配测试

指定客户端调试

如何使用debug_connection

配置指定客户端

不匹配测试

匹配测试

最佳实践

利用curl工具

巧用return

巧用响应头

## 在线调试步骤

**1、** 备份当前配置文件；

**2、** 配置调试；

**3、** 检查命令：；

nginx -t 测试 NGINX 配置。

nginx -T 测试 NGINX 配置并将验证后的配置打印到屏幕上。此命令在寻求支持时很有用。

**4、** 不中断加载配置命令：；

nginx -s reload

**5、** 观察如果出现较大问题，就先备份新配置，然后恢复旧配置重加载，接下来分析配置改动带来问题原因；

## 如何用好日志

用好日志是研发和运维人员的基本功。Nginx提供了强大的日志功能（用法详见[精通Nginx（06）-日志](/zhuanlan/server/nginx/4/6.html)）。

### 日志配置

**1、** 错误日志开启到debug级别（注意：如果Nginx是编译安装的，注意检查编译参数是否带--with-debug)；

**2、** 访问日志根据调试对象设置格式；

**3、** 调试rewrite，开启rewrite_log，开启指令：rewrite_logon;；

**4、** 针对特定的服务器，在server{...}单独定义访问及错误日志文件；

### 非调试级别日志

有如下配置：

```java
error_log  /var/log/nginx/error.log error;
http{
    server {
        listen 80;
        rewrite_log on;
        location /download/ {
            rewrite ^(/download/.*)/media/(.*)\..*$ $1/mp3/$2.mp3 break;
            rewrite ^(/download/.*)/audio/(.*)\..*$ $1/mp3/$2.ra  break;
            return  403;
        }
        location / {
             root /usr/share/nginx/trialroot;
             index index.html;
        }
    }
}
```

如果不开启debug级别日志，用error级别日志。

#### 不匹配测试

用如下实际不匹配的命令测试：

```java
curl -I http://127.0.0.1/download/media/a1.mp3
```

控制台返回如下：

error日志无输出（虽然rewrite不匹配，但无错误）。

#### 匹配测试

用如下命令测试：

```java
curl -I http://127.0.0.1/download/a/media/a1.mp3
```

控制台返回如下：

error日志输出（（虽然rewrite匹配，但有错误发生）：

### 调试级别日志

配置调整如下：

```java
error_log  /var/log/nginx/error.log debug;
```

重新加载：

```java
nginx -s reload
```

测试error日志输出如下：

```java
2023/11/16 10:02:00 [notice] 17969#17969: signal process started
# 打印当前请求处理模式
2023/11/16 10:02:00 [notice] 15995#15995: using the "epoll" event method
# 打印工作进程号
2023/11/16 10:02:00 [notice] 15995#15995: start worker processes
2023/11/16 10:02:00 [notice] 15995#15995: start worker process 17970
# 配置了缓存，启用了缓存管理器
2023/11/16 10:02:00 [notice] 15995#15995: start cache manager process 17971
# 内部信号控制
2023/11/16 10:02:01 [notice] 15995#15995: signal 17 (SIGCHLD) received from 17898
2023/11/16 10:02:01 [notice] 15995#15995: worker process 17898 exited with code 0
2023/11/16 10:02:01 [notice] 15995#15995: signal 29 (SIGIO) received
2023/11/16 10:02:01 [notice] 15995#15995: signal 17 (SIGCHLD) received from 17899
2023/11/16 10:02:01 [notice] 15995#15995: cache manager process 17899 exited with code 0
2023/11/16 10:02:01 [notice] 15995#15995: signal 29 (SIGIO) received
```

#### 不匹配测试

用如下实际不匹配的命令测试：

```java
curl -I http://127.0.0.1/download/media/a1.mp3
```

控制台返回同非调试级别一样。

error日志输出如下：

显然输出了不匹配信息。

#### 匹配测试

用如下命令测试：

```java
curl -I http://127.0.0.1/download/a/media/a1.mp3
```

控制台返回同非调试级别一样。

error日志输出如下：

输出了匹配信息 ，也输出了错误信息。

## 指定客户端调试

开启对特定连接的调试，用于测试客户端连接非常有效。用debug_connection 指令开启（详见[精通Nginx（04）-核心指令](/zhuanlan/server/nginx/4/4.html)）。注意：debug_connection 会自动在指定连接上开启debug级别日志，其它连接错误日志为error_log。如果开启了error_log为debug，可先关闭，这样可以集中在特定连接上。这可帮助调试生产问题，并避免因调试所有连接而降低性能。

### 如何使用debug_connection

Nginx默认不支持debug_connection指令。使用方式：

**1、** 如果是yum安装版，需用如下命令切换到调试版：；

```java
# 停止非调试版
service nginx stop
# 启用调试版
service nginx-debug start
```

**2、** 如果是编译版，需带"--with-debug"编译；

调试版启动后，输出信息很多（会不停输出），部分截图如下：

### 配置指定客户端

配置如下：

```java
# 如果用指定客户端调试模式，错误日志级别设置为error为好；如果设置debug，会输出大量信息
error_log  /var/log/nginx/error.log error;
events {
    worker_connections  1024;
    调试指定客户端：为选定的客户端连接启用调试日志。其他连接将使用error_log指令设置的日志记录级别
    debug_connection 127.0.0.1;
    debug_connection 192.168.1.168;
}
```

### 不匹配测试

用如下实际不匹配的命令测试：

```java
curl -I http://127.0.0.1/download/media/a1.mp3
```

控制台返回同非调试级别一样。

error日志输出如下：

### 匹配测试

用如下命令测试：

```java
curl -I http://127.0.0.1/download/a/media/a1.mp3
```

控制台返回同非调试级别一样。

error日志输出如下：

上图详细展示rewrite过程，由于rewrite用"/download/"匹配，结果又含有" /download/"，rewrite实际执行了10次。

如果用非127.0.0.1发出命令测试，错误日志不会输出信息，除非发生错误（如rewrite后，结果网页不存在）。

### 最佳实践

**1、** 用nginx-debug可查看Nginx指令详细工作过程，非常有助于学习nginx；

**2、** 用nginx-debug(或编译带选项），如果错误日志用debug级别，会输出大量信息；因此通常把错误日志设置为error级别，然后指定客户端来进行调试；

## 利用curl工具

利用curl命令在客户端发起请求。

格式： curl [option] url

curl url ：默认会发送 GET 请求来获取链接内容到标准输出

option参数意义：

-I（i大写i） ：发送 GET 请求，显示 响应头信息，但不显示文件内容

-i ：发送 GET 请求，显示 响应头信息，且显示文件内容

-H：发送自定义head头信息

-d: 发送数据

-xPOST：post方式提交

-cfile：保存cookie到文件

简单示例如下：

```java
# 访问baidu
curl https://www.baidu.com
# 只显示响应头信息
curl -I https://www.baidu.com
# 自定义头信息
curl -H "Referer: www.example.com" -H "User-Agent: Custom-User-Agent" http://www.baidu.com
# POST方式提交，带需要数据
curl -d "userName=jack&passwd=123456" -X POST http://www.example.com/login
# 保存cookie
curl -c "cookie-example" http://www.example.com
```

## 巧用return

调试rewrite时，可用return指令来明确nginx到达位置。实例如下：

```java
    server {
        测试看return效果
        listen 8000 default_server;
        location = / {
            return 901;
        }
        location / {
            return 902;
        }
        location /a/ {
            return 903;
        }
        location /a/b/ {
            return 904;
        }
    }
```

用curl -I非常方便查看。上述示例查看如下：

```java
###### 901#
# 只有ip+端口（域名）
[root@ddkk.com nginx]# curl -I http://127.0.0.1:8000
HTTP/1.1 901 
Server: nginx/1.24.0
Date: Thu, 16 Nov 2023 01:26:06 GMT
Content-Length: 0
Connection: keep-alive
# ip+端口+"/"
[root@ddkk.com nginx]# curl -I http://127.0.0.1:8000/
HTTP/1.1 901 
Server: nginx/1.24.0
Date: Thu, 16 Nov 2023 01:26:15 GMT
Content-Length: 0
Connection: keep-alive
###### 902#
# ip+端口+"/"+任何不匹配其它项
[root@ddkk.com nginx]# curl -I http://127.0.0.1:8000/index.html
HTTP/1.1 902 
Server: nginx/1.24.0
Date: Thu, 16 Nov 2023 01:26:29 GMT
Content-Length: 0
Connection: keep-alive
# ip+端口+"/a"，注意匹配项是"/a/"，因此值匹配902
[root@ddkk.com nginx]# curl -I http://127.0.0.1:8000/a
HTTP/1.1 902 
Server: nginx/1.24.0
Date: Thu, 16 Nov 2023 01:26:37 GMT
Content-Length: 0
Connection: keep-alive
###### 903#
# ip+端口+"/a/"+任何不匹配其它项
[root@ddkk.com nginx]# curl -I http://127.0.0.1:8000/a/
HTTP/1.1 903 
Server: nginx/1.24.0
Date: Thu, 16 Nov 2023 01:27:00 GMT
Content-Length: 0
Connection: keep-alive
# ip+端口+"/a/b"，不匹配"/a/b/"
[root@ddkk.com nginx]# curl -I http://127.0.0.1:8000/a/b
HTTP/1.1 903 
Server: nginx/1.24.0
Date: Thu, 16 Nov 2023 01:27:04 GMT
Content-Length: 0
Connection: keep-alive
###### 903#
# ip+端口+"/a/b/"
[root@ddkk.com nginx]# curl -I http://127.0.0.1:8000/a/b/
HTTP/1.1 904 
Server: nginx/1.24.0
Date: Thu, 16 Nov 2023 01:27:09 GMT
Content-Length: 0
Connection: keep-alive
```

## 巧用响应头

使用add_header，可在响应头增加相关变量或其它值，以便查看具体值。例如：

```java
location ~ .*\.(gif|jpg|jpeg|bmp|png|ico|txt|js|css)$
    {
       ...
       添加响应头，主要用于调试（非必须）
       add_header Nginx-Cache $upstream_cache_status;
       add_header Nginx-Cache-Static-Key $scheme$proxy_host$request_uri;
    }
```

显示结果如下：

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
