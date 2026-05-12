# 15、Nginx 实战：Nginx动静分离实战
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/15.html
- 分类：服务器框架
- 分组：教程目录
## 1.Nginx动静分离基本概述

动静分离, 通过中间件将动静分离和静态请求进行分离。

那为什么要通过中间件将动态请求和静态请求进行分离? 减少不必要的请求消耗, 同时能减少请求的延时。

通过中间件将动态请求和静态请求分离，逻辑图如下

动静分离只有好处: 动静分离后, 即使动态服务不可用, 但静态资源不会受到影响

## 2.Nginx动静分离场景实践

Nginx动静分离实践应用案例

## 2.0.环境准备

系统
服务
服务
地址

CentOS7.5
负载均衡
Nginx Proxy
10.0.0.5

CentOS7.5
静态资源
Nginx Static
10.0.0.7

CentOS7.5
动态资源
Tomcat Server
10.0.0.8

## 2.1.在10.0.0.7服务器上配置静态资源

```java
[root@web01 conf.d]# cat ds_oldboy.conf
server{
        listen 80;
        server_name ds.oldboy.com;
        root /soft/code;
        index index.html;
        location ~* .*\.(png|jpg|gif)$ {
                root /soft/code/images;
        }
}
# 准备目录, 以及静态相关图片
[root@web01 ~]# mkdir /soft/code/images -p
[root@web01 ~]# wget -O /soft/code/images/nginx.png http://nginx.org/nginx.png
[root@web01 ~]# systemctl restart nginx
```

## 2.2.在10.0.0.8服务器上配置动态资源

```java
[root@web01 ~]# yum install -y tomcat
[root@web01 ~]# mkdir /usr/share/tomcat/webapps/ROOT
[root@web01 ~]# vim /usr/share/tomcat/webapps/ROOT/java_test.jsp
<%@ page language="java" import="java.util.*" pageEncoding="utf-8"%>
<HTML>
    <HEAD>
        <TITLE>JSP Test Page</TITLE>
    </HEAD>
    <BODY>
      <%
        Random rand = new Random();
        out.println("<h1>Random number:</h1>");
        out.println(rand.nextInt(99)+100);
      %>
    </BODY>
</HTML>
#重启tomcat服务
[root@web01 ~]# systemctl start tomcat
```

## 2.3.在负载均衡10.0.0.5上配置调度, 实现访问jsp和png

```java
[root@lb01 conf.d]# cat ds_proxy.conf 
upstream static {
        server 10.0.0.7:80;
}
upstream java {
        server 10.0.0.8:8080;
}
server {
        listen 80;
        server_name ds.oldboy.com;
        location / {
                root /soft/code;
                index index.html;
        }
        location ~ .*\.(png|jpg|gif)$ {
                proxy_pass http://static;
                include proxy_params;
        }
        location  ~ .*\.jsp$ {
                proxy_pass http://java;
                include proxy_params;
        }
}
[root@lb01 conf.d]# systemctl restart nginx
```

## 2.4.通过负载测试访问静态资源

## 2.5.通过负载测试访问动态资源

## 2.6.在负载均衡10.0.0.5上整合动态和静态资源的html文件

```java
[root@lb01 ~]# mkdir /soft/code -p
[root@lb01 ~]# cat /soft/code/index.html
<html lang="en">
<head>
        <meta charset="UTF-8" />
        <title>测试ajax和跨域访问</title>
        <script src="http://libs.baidu.com/jquery/2.1.4/jquery.min.js"></script>
</head>
<script type="text/javascript">
$(document).ready(function(){
        $.ajax({
        type: "GET",
        url: "http://ds.oldboy.com/java_test.jsp",
        success: function(data) {
                $("#get_data").html(data)
        },
        error: function() {
                alert("fail!!,请刷新再试!");
        }
        });
});
</script>
        <body>
                <h1>测试动静分离</h1>
                <img src="http://ds.oldboy.com/nginx.png">
                <div id="get_data"></div>
        </body>
</html>
```

## 2.7.测试动态和静态资源是否能正常加载在一个html文件中

## 2.8.当使用systemctl stop nginx停止Nginx后, 会发现静态内容无法访问, 动态内容依旧运行正常

## 2.9.当使用systemctl stop tomcat停止tomcat后, 静态内容依旧能正常访问, 动态内容将不会被请求到

## 3.Nginx资源分离场景实践

Nginx通过负载均衡实现手机与PC调度至不同的后端节点应用案例

## 3.1.根据iphone、安卓、pc跳转不同的页面环境规划

系统版本
主机角色
外网IP
内网IP
提供端口

CentOS7.5
负载均衡
10.0.0.5
172.16.1.5
80

CentOS7.5
提供Android页面

172.16.1.7
9090

CentOS7.5
提供Iphone页面

172.16.1.7
9091

CentOS7.5
提供pc页面

172.16.1.7
9092

## 3.2.配置后端WEB节点的Nginx配置

```java
[root@web01 conf.d]# cat sj.conf 
server {
    listen 9090;
    location / {
        root /code/android;
        index index.html;
    }
}
server {
    listen 9091;
    location / {
        root /code/iphone;
        index index.html;
    }
}
server {
    listen 9092;
    location / {
        root /code/pc;
        index index.html;
    }
}
```

## 3.3.为后端WEB节点配置对应的网站目录以及代码

```java
[root@web01 conf.d]# mkdir -p /code/{android,iphone,pc}
[root@web01 conf.d]# echo "PC" > /code/pc/index.html
[root@web01 conf.d]# echo "Iphone" > /code/iphone/index.html
[root@web01 conf.d]# echo "Android" > /code/android/index.html
#检查语法并重载Nginx服务
[root@web01 conf.d]# nginx -t
[root@web01 conf.d]# systemctl restart nginx
```

## 3.4.配置负载均衡服务，根据不同的浏览器调度到不同的资源池

```java
[root@lb01 conf.d]# cat sj_proxy.conf 
upstream iphone {
    server 172.16.1.7:9091;
}
upstream android {
    server 172.16.1.7:9090;
}
upstream pc {
    server 172.16.1.7:9092;
}
server {
    listen 80;
    server_name sj.oldboy.com;
    location / {
   默认跳转至pc站点
    proxy_pass http://pc;
    include proxy_params;
       如果客户端是Iphone则跳转到iphone的资源池
        if ($http_user_agent ~* "Iphone") {
            proxy_pass http://iphone;
        }
       如果客户端是Android则跳转到android的资源池
        if ($http_user_agent ~* "Android"){
            proxy_pass http://android;
        }
       如果客户端是IE浏览器，则返回403错误。
        if ($http_user_agent ~* "msie"){
            return 403;
        }
    }
}
```

## 3.5.直接使用浏览器访问，返回默认的结果

## 3.6如果通过android设备访问，效果如下。

## 3.7如果通过Iphone设备访问，效果如下。
