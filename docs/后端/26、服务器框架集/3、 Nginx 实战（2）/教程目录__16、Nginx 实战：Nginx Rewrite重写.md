# 16、Nginx 实战：Nginx Rewrite重写
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/16.html
- 分类：服务器框架
- 分组：教程目录
## 1.Rewrite基本概述

## 1.1.什么是rewrite

Rewrite主要实现url地址重写, 以及地址重定向，就是将用户请求web服务器的地址重新定向到其他URL的过程。

## 1.2.Rewrite使用场景

1、地址跳转，用户访问www.xuliangwei.com/class这个URL时，将其定向至一个新的域名class.xuliangwei.com
2、协议跳转，用户通过http协议请求网站时，将其重新跳转至https协议方式
3、伪静态，将动态页面显示为静态页面方式的一种技术, 便于搜索引擎的录入, 同时减少动态URL地址对外暴露过多的参数, 提升更高的安全性。
4、搜索引擎，SEO优化依赖于url路径, 好记的url便于支持搜索引擎录入

## 1.3.Rewrite配置示例

```java
#rewrite表达式可以应用在server,location, if标签下
Syntax: rewrite regex replacement [flag];
Default: --
Context: server, location, if
#用于切换维护页面场景
#rewrite ^(.*)$ /page/wh.html break;
```

## 2.Rewrite标记Flag

rewrite指令根据表达式来重定向URI，或者修改URI字符串。

每行rewrite指令最后跟一个flag标记，支持的flag标记有如下表格所示：

flag|

---|---

last|本条规则匹配完成后，停止匹配，不在匹配后面的规则

break|本条规则匹配完成后，停止匹配，不在匹配后面的规则

redirect|返回302临时重定向, 地址栏会显示跳转后的地址

permanent|返回301永久重定向, 地址栏会显示跳转后的地址

## 2.1.last与break区别对比示例

```java
[root@bgx conf.d]# cat rewrite.conf
server {
    listen 80;
    server_name rewrite.oldboy.com;
    root /code;
    location ~ ^/break {
        rewrite ^/break /test/ break;
    }
    location ~ ^/last {
        rewrite ^/last /test/ last;
    }
    location  /test/ {
        return 200 'ok';
    }
}
#重启Nginx服务
[root@bgx conf.d]# systemctl restart nginx
```

## 2.2.使用浏览器访问/break测试

## 2.3.使用浏览器访问/last测试

## 2.4.last和 break 都是一个作用，都是表示停止rewrite规则，那last和break区别在哪呢

break匹配到规则，则会去本地路径中目录中寻找对应请求的文件。

last匹配到规则，会对其所在的server{...}标签重新发起请求。

所以，在访问/break和/last请求时，虽然对应的请求目录/test都是不存在了，理论上都应该返回404，但是实际请求/last的时候，是会有后面localtion所匹配到的结果返回的，如果last匹配不到location的结果则在返回错误。

## 2.5.redirect与permanent区别对比示例

```java
[root@Nginx ~]# cat /etc/nginx/conf.d/rewrite.conf
server {
    listen 80;
    server_name rewrite.oldboy.com;
    root /code;
    location ~ ^/bgx {
        rewrite ^(.*)$ https://www.xuliangwei.com redirect;
        rewrite ^(.*)$ https://www.xuliangwei.com permanent;
       return 301 http://kt.xuliangwei.com;
       return 302 http://kt.xuliangwei.com;
    }
}
```

## 2.6.通过浏览器访问，redirect会进行302跳转

## 2.7.使用 systemctl stop nginx停止nginx，然后再次访问网站测试 redirect

## 2.8.通过浏览器访问，permanent会进行301跳转

## 2.9.使用 systemctl stop nginx停止nginx，然后再次访问网站测试 permanent

## 2.10.redirect和permanent都是一个跳转，那redirect和permanent区别在哪呢

## 3.Rewrite规则实践

## 例3.1:用户访问/abc/1.html实际上真实访问是/ccc/bbb/2.html

[http://www.bgx.com/abc/1.html](http://www.bgx.com/abc/1.html) ==> [http://www.bgx.com/ccc/bbb/2.html](http://www.bgx.com/ccc/bbb/2.html)

```java
#1.准备真实的访问路径
[root@web03 ~]# mkdir /code/ccc/bbb -p
[root@web03 ~]# echo "ccc_bbb_2" > /code/ccc/bbb/2.html
#2.Nginx跳转配置
[root@web03 conf.d]# cat ccbb.conf 
server {
    listen 80;
    location / {
        root /code;
        index index.html;
    }
    location /abc {
        rewrite (.*) /ccc/bbb/2.html redirect;
       return 302 /ccc/bbb/2.html;
    }
}
#3.重启Nginx服务
[root@web03 ~]# systemctl restart nginx
```

## 例3.2:用户访问/2018/ccc/bbb/2.html实际上真实访问是/2014/ccc/bbb/2.html

[http://www.bgx.com/2018/ccc/bbb/2.html](http://www.bgx.com/2018/ccc/bbb/2.html) ==> [http://www.bgx.com/2014/ccc/bbb/2.html](http://www.bgx.com/2014/ccc/bbb/2.html)

```java
#1.准备真实的访问路径
[root@web03 ~]# mkdir /code/2014/ccc/bbb -p
[root@web03 ~]# echo "2014_ccc_bbb_2" > /code/2014/ccc/bbb/2.html
#2.Nginx跳转配置
[root@web03 conf.d]# cat ccbb.conf 
server {
    listen 80;
    location / {
        root /code;
        index index.html;
    }
    location /2018 {
        rewrite ^/2018/(.*)$ /2014/$1 redirect;
    }
}
#3.重启Nginx服务
[root@web03 ~]# systemctl restart nginx
```

## 例3.3:用户访问/test目录下任何内容, 实际上真实访问是http://www.xuliangwei.com

```java
location /test {
    rewrite (.*) http://www.xuliangwei.com redirect;
}
```

## 例3.4:用户访问course-11-22-33.html实际上真实访问是/course/11/22/33/course_33.html

[http://www.bgx.com/course-11-22-33.html](http://www.bgx.com/course-11-22-33.html) ==> [http://www.bgx.com/course/11/22/33/course_33.html](http://www.bgx.com/course/11/22/33/course_33.html)

```java
#1.准备真实的访问路径
[root@web03 ~]# mkdir /code/course/11/22/33/ -p
[root@web03 ~]# echo "Curl docs.etiantian.org" > /code/course/11/22/33/course_33.html
#2.Nginx跳转配置
[root@web03 conf.d]# cat ccbb.conf 
server {
        listen 80;
        root /code;
        index index.html;
        location / {
               灵活
            rewrite ^/course-(.*)-(.*)-(.*).html$ /course/$1/$2/$3/course_$3.html redirect;
               固定
           rewrite ^/course-(.*)  /course/11/22/33/course_33.html redirect;
        }
#3.重启Nginx服务
[root@web03 ~]# systemctl restart nginx
```

## 例3.5:将http请求，跳转至https

```java
server {
        listen 80;
        server_name bgx.com;
        rewrite ^(.*) https://$server_name$1 redirect;
       return 302 https://$server_name$request_uri;
}
server {
    listen 443;
    server_name bgx.com;
    ssl on;
}
```

## 4.Rewrite规则补充

## 4.1.Rewrite优先级

- 1.先执行server块的rewrite指令
- 2.其次执行location匹配规则
- 3.最后执行location中的rewrite

## 4.2.Rewrite常用变量，在匹配过程中可以引用一些Nginx的全局变量

\(server_name 当前用户请求的域名 \)request_filename 当前请求的文件路径名（带网站的主目录/code/images/test.jpg）

\(request_uri 当前请求的文件路径名（不带网站的主目录/images/test.jpg） \)scheme用的协议，比如http或者https

## 4.3.如何优雅的书写Rewrite规则

```java
server {
    listen 80;
    server_name www.oldboyedu.com oldboyedu.com;
    if ($http_host = oldboyedu.com){
        rewrite (.*) http://www.nginx.org$1;
    }
}
#推荐的书写格式
server {
    listen 80;
    server_name oldboyedu.com;
    rewrite ^ http://www.oldboyedu.com$request_uri;
}
server {
    listen 80;
    server_name www.oldboyedu.com;
}
```
