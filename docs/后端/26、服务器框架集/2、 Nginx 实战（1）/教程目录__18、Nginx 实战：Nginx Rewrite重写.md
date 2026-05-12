# 18、Nginx 实战：Nginx Rewrite重写
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/18.html
- 分类：服务器框架
- 分组：教程目录
## 一、Nginx Rewrite概述

现在Nginx已经成为很多公司作为前端反向代理服务器的首选，在实际工作中往往会到很多跳转(重写URL)的需求。比如更换域名后需要保持旧的域名能跳转到新的域名上、某网页发生改变需要跳转到新的页面、网站防盗链等等需求。如果在后端使用的Apache服务器，虽然也能做跳转，规则库也很强大，但是用Nginx跳转效率会更高。

Rewrite主要实现url地址重写，以及重定向，就是把传入web的请求重定向到其他url的过程。

## 二、Nginx Rewrite使用场景

1、地址跳转，用户访问www.baidu.com这个URL时，将其定向至一个新的域名mobile.baidu.com

2、协议跳转，用户通过http协议请求网站时，将其重新跳转至https协议方式

3、伪静态，将动态页面显示为静态页面方式的一种技术，便于搜索引擎的录入，同时建上动态URL地址对外暴露过多的参数，提升更高的安全性。

4、搜索引擎，SEO优化依赖于url路径，好记的url便于智齿搜索引擎录入

## 三、Nginx Rewrite跳转实现

Nginx是通过ngx_http_rewrite_module模块支持url重写、支持if条件判断，但不支持else。另外该模块需要 PCRE支持，应在编译Nginx时指定PCRE 支持，默认已经安装。根据相关变量重定向和选择不同的配置，从一个location跳转到另一个location，不过这样的循环最多可以执行10次，超过后Nginx将返回500错误。同时，重写模块包含set指令，来创建新的变量并设其值，这在有些情景下非常有用的，如记录条件标识、传递参数到其他location、记录做了什么等等。rewrite功能就是，使用Nginx提供的全局变量或自己设置的变量，结合正则表达式和标志位实现url重写以及重定向。

```java
Nginx跳转需求的实现方式:
1.使用rewrite进行匹配跳转
2.使用if匹配全局变量后跳转
3.使用location匹配在跳转
```

## 四、Nginx Rewrite基本语法

```java
Syntax:	rewrite regex replacement [flag];
Default:	—
Context:	server, location, if
rewrite			#调用模块
regex 			#请求的链接（可以使用正则表达式）
replacement 	#跳转的链接
[flag];			#rewrite支持的flag标记
#示例
server {
    ...
    rewrite ^(/download/.*)/media/(.*)\..*$ $1/mp3/$2.mp3 last;
    rewrite ^(/download/.*)/audio/(.*)\..*$ $1/mp3/$2.ra  last;
    ...
}
```

## 五、Nginx Rewrite的flag标记

```java
rewrite指令根据表达式来重定向URL，或者修改字符串，可以应用于server，location，if环境下，每行rewrite指令最后跟一个flag标记，支持的flag标记有如下表格所示：
```

标记
说明

last
相当于Apache的【L】标记，表示完成rewrite,本条规则匹配完成后，停止匹配，不再匹配后面的规则

break
本条规则匹配完成即终止，不在匹配后面的任何规则

redirect
返回302临时重定向，浏览器地址会显示跳转后的URL地址，爬虫不会更新url

permanent
返回301永久重定向，浏览器地址栏会显示跳转后的URL地址，爬虫更新url

## 六、last和break的区别

```java
1.配置nginx
[root@web01 ~]# vim /etc/nginx/conf.d/linux.rewrite.com.conf
server {
        listen 80;
        server_name linux.rewrite.com;
        root /code;
        location ~ ^/break {
                rewrite ^/break /test/ break;
        }
        location ~ ^/last {
                rewrite ^/last /test/ last;
        }
        location /test/ {
                default_type application/json;
                return 200 "ok";
        }
}
2.重启
[root@web01 ~]# nginx -t
[root@web01 ~]# systemctl restart nginx
3.配置hosts测试
10.0.0.7 linux.rewrite.com
#结果
1）访问 linux.rewrite.com/break，返回结果404
2）访问 linux.rewrite.com/last，返回结果ok
4.结论
break只要匹配到规则，则会去本地配置路径的目录中寻找请求的文件；
而last只要匹配到规则，会对其所在的server(...)标签重新发起请求。
break请求：
    1）请求 linux.rewrite.com/break
    2）匹配 location ~ ^/break 会跳转请求 到 linux.rewrite.com/test
    3）请求跳转后，会去查找本地的站点目录下的 test/index.html;
    4）如果找到了，则返回站点目录下的 test/index.html的内容；
    5）如果没找到该目录则报错404，如果找到该目录没找到对应的文件则403
last请求:
    1）请求 rewrite.drz.com/last
    2）匹配 location ~ ^/last 会跳转请求 到 linux.rewrite.com/test
    2）请求跳转后，会去查找本地的站点目录下的 test/index.html;
    3）如果找到了，则返回站点目录下的 test/index.html的内容；
    4）如果没找到，会对当前server重新的发起一次请求，linux.rewrite.com/test/
    5）如果有location匹配上，则直接返回该location的内容。
    4）如果也没有location匹配，再返回404;
```

## 七、redirect和permanent的区别

```java
1.配置nginx
[root@web01 ~]# vim /etc/nginx/conf.d/linux.rw.com.conf
server {
    listen 80;
    server_name linux.rw.com;
    root /code;
    location /test {
       rewrite ^(.*)$  https://www.baidu.com redirect;
       rewrite ^(.*)$  https://www.baidu.com permanent;
       return 301 https://www.baidu.com;
        return 302 https://www.baidu.com;
    }
}
2.配置hosts测试
#配置redirect时
	关闭nginx之后访问失败
#配置permanent时
	关闭nginx仍然访问成功
#结论：
redirect，每次访问服务器都会进行询问，是否进行跳转
permanent，记录一次跳转，以后都不会询问，直接跳转页面，除非清空缓存
```

## 八、Nginx Rewrite实践

### 1.案例一：用户访问/abc/1.html实际上真实访问的是/ccc/bbb/2.html

```java
1.创建页面
[root@web01 ~]# mkdir /code/ccc/bbb/ -p
[root@web01 ~]# echo "/ccc/bbb/2.html" > /code/ccc/bbb/2.html
2.配置nginx
[root@web01 ~]# vim /etc/nginx/conf.d/rw.conf
server {
    listen 80;
    server_name nginx.rewrite.com;
    root /code;
    location ~* /abc {
        rewrite ^(.*)$ /ccc/bbb/2.html redirect;
    }
}
```

### 2.案例二：用户访问/2018/ccc/bbb/2.html实际上真实访问的是/2014/bbb/ccc/2.html

```java
[root@web01 ~]# mkdir /code/2014/bbb/ccc/ -p
[root@web01 ~]# echo "/2014/bbb/ccc/2.html" > /code/2014/bbb/ccc/2.html
#配置nginx
[root@web01 ~]# vim /etc/nginx/conf.d/rw.conf
server {
    listen 80;
    server_name nginx.rewrite.com;
    root /code;
    location ~* ^/2018 {
        rewrite ^/2018/(.*)/(.*)/(.*) /2014/$2/$1/$3 redirect;
    }
}
```

### 3.案例三：用户访问course-11-22-33.html实际上真实访问的是/course/11/22/33/course_33.html

```java
[root@web01 ~]# mkdir /code/course/11/22/33/ -p
[root@web01 ~]# echo "/course/11/22/33/course_33.html" >/code/course/11/22/33/course_33.html
#配置
[root@web01 ~]# vim /etc/nginx/conf.d/rw.conf
server {
    listen 80;
    server_name nginx.rewrite.com;
    root /code;
    location ~* ^/course {
       灵活配法
        rewrite ^/(.*)-(.*)-(.*)-(.*).html$ /$1/$2/$3/$4/$1_$4.html redirect;
       固定配法
       rewrite ^/course-(.*) /course/11/22/33/course_33.html redirect;
    }
}
```

### 4.案例四：将http请求跳转到https

```java
#Nginx跳转配置
server {
        listen 80;
        server_name www.baidu.com;
        rewrite ^(.*) https://$server_name$1 redirect;
       return 302 https://$server_name$request_uri;
}       
server {
        listen 443;
        server_name www.baidu.com;
        ssl on;
}
浏览器输入：baidu.com
浏览器转换：http://www.baidu.com/index.html
server层转换，rewrite跳转：https://www.baidu.com/index.html
```

## 九、Nginx Rewrite实现伪静态

```java
1.创建站点目录
[root@web01 /code]# mkdir discuz
[root@web01 /code]# unzip Discuz_X3.3_SC_GBK.zip -d /code/discuz/
#授权
[root@web01 /code]# chown -R www.www /code/discuz/
2.配置nginx配置文件
[root@web01 /code]# vim /etc/nginx/conf.d/linux.discuz.com.conf
server {
    listen 80;
    server_name linux.discuz.com;
    root /code/discuz/upload;
    location / {
        index index.php index.html;
    }
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
3.重启访问
[root@web01 /code]# nginx -t
[root@web01 /code]# systemctl restart nginx
#配置hosts
10.0.0.7 nginx.rewrite.com linux.discuz.com
4.创建数据库
[root@db01 ~]# mysql -uroot -pLinhd@123
MariaDB [(none)]> create database discuz;
Query OK, 1 row affected (0.00 sec)
MariaDB [(none)]> grant all on discuz.* to discuz@'172.16.1.%' identified by '123456';
Query OK, 0 rows affected (0.01 sec)
5.配置伪静态
[root@web01 /code]# cat /etc/nginx/conf.d/linux.discuz.com.conf
server {
	listen 80;
	server_name linux.discuz.com;
	root /code/discuz/upload;
    location / {
        index index.php index.html;
    }
	rewrite ^([^\.]*)/topic-(.+)\.html$ $1/portal.php?mod=topic&topic=$2 last;
	rewrite ^([^\.]*)/article-([0-9]+)-([0-9]+)\.html$ $1/portal.php?mod=view&aid=$2&page=$3 last;
	rewrite ^([^\.]*)/forum-(\w+)-([0-9]+)\.html$ $1/forum.php?mod=forumdisplay&fid=$2&page=$3 last;
	rewrite ^([^\.]*)/thread-([0-9]+)-([0-9]+)-([0-9]+)\.html$ $1/forum.php?mod=viewthread&tid=$2&extra=page%3D$4&page=$3 last;
	rewrite ^([^\.]*)/group-([0-9]+)-([0-9]+)\.html$ $1/forum.php?mod=group&fid=$2&page=$3 last;
	rewrite ^([^\.]*)/space-(username|uid)-(.+)\.html$ $1/home.php?mod=space&$2=$3 last;
	rewrite ^([^\.]*)/blog-([0-9]+)-([0-9]+)\.html$ $1/home.php?mod=space&uid=$2&do=blog&id=$3 last;
	rewrite ^([^\.]*)/(fid|tid)-([0-9]+)\.html$ $1/archiver/index.php?action=$2&value=$3 last;
	rewrite ^([^\.]*)/([a-z]+[a-z0-9_]*)-([a-z0-9_\-]+)\.html$ $1/plugin.php?id=$2:$3 last;
	if (!-e $request_filename) {
		return 404;
	}
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
	}
}
rewrite ^([^\.]*)/forum-(\w+)-([0-9]+)\.html$ $1/forum.php?mod=forumdisplay&fid=$2&page=$3 last;
http://linux.discuz.com/forum-2-1.html
http://linux.discuz.com/forum.php?mod=forumdisplay&fid=2&page=1
```

```java
	if (!-e $request_filename) {
		return 404;
	}
#判断请求的内容是否存在
-e:文件或目录是否存在
-d:目录是否存在
-f：文件是否存在
-x：文件是否可执行
```

## 十、Nginx Rwrite匹配优先级

```java
1.匹配优先级
	1)先执行server层的rewrite
	2)再根据location匹配优先级匹配
	3)再执行location下的rewrite
	4)最后再执行location下if配置的rewrite
2.配置
[root@web01 /code]# vim /etc/nginx/conf.d/youxianji.conf
server {
    listen 80;
    server_name linux.youxian.com;
    location / {
        rewrite (.*) http://www.jd.com;
    }
    location =/ {
        rewrite (.*) http://www.taobao.com;
    }
    rewrite (.*) http://www.baidu.com;
}
```

## 十一、Nginx Rewrite环境变量

```java
1.$server_name
$server_name		#当前请求的域名
server {
        listen 80;
        server_name test.linux.com;
        rewrite ^(.*)$ https://$server_name$1;
}
http://test.linux.com/1.html
https://test.linux.com/1.html
2.请求文件
$request_filename 	#请求的文件路径名（带网站的站点目录 /code/images/test.jpg）
$request_uri 		#当前请求的文件路径（不带网站的站点目录 /images/test.jpg）
#大多数用于http协议转https协议
server {
        listen 80;
        server_name test.linux.com;
        root /code;
        return 302 https://$server_name$request_uri;
}
URL:	http://test.linux.com/images/test.jpg
URI:	/images/test.jpg
3.$scheme 
$scheme      用的协议，比如http或者https
4.$http_host
#很久之前的配置方法
server {
        listen 80;
        server_name www.baidu.com baidu.com;
        if ($http_host = baidu.com){
            rewrite (.*) http://www.baidu.com$1;
        }
}
#推荐书写格式
server {
        listen 80;
        server_name baidu.com;
        return 302 http://www.baidu.com$request_uri;
}
server {
        listen 80;
        server_name www.drz.com;
}
```

## 十二、Nginx Rewrite日志开启

```java
#配置
[root@web01 /code]# vim /etc/nginx/nginx.conf
... ...
error_log  /var/log/nginx/error.log notice;
... ...
http {
    ... ...
    rewrite_log on;
    ... ...
}
```
