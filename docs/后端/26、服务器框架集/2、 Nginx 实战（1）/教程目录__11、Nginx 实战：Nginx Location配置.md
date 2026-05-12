# 11、Nginx 实战：Nginx Location配置
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/11.html
- 分类：服务器框架
- 分组：教程目录
## 一、概述

Location指令是nginx中最关键的指令之一，location指令的功能是用来匹配不同的url请求，进而对请求做不同的处理和响应，但一个server可以有多个location配置, 多个location的优先级该如何区分。

## 二、Location语法

```java
Syntax:	location [ = | ~ | ~* | ^~ ] uri { ... }
location @name { ... }
Default:	—
Context:	server, location
```

## 三、Location匹配符

匹配符
匹配规则
优先级

=
精确匹配
1

^~
以某个字符串开头
2

~
区分大小写的正则匹配
3

~*
不区分大小写的正则匹配
3

/
通用匹配，任何请求都会匹配到
4

## 四、Location优先级验证

```java
[root@web02 /etc/nginx/conf.d]# vim location.conf 
server {
    listen 80;
    server_name www.location.com;
   location / {
       default_type text/html;
       return 200 "location /";
   }
    location =/ {
        default_type text/html;
        return 200 "location =/";
    }
    location ~* / {
        default_type text/html;
        return 200 "location ~* /";
    }
    location ^~ / {
      default_type text/html;
      return 200 "location ^~";
    }
}
```

## 五、Location应用场景

```java
#通用匹配，任何请求都会匹配到
location / {
    ...
}
#严格区分大小写，匹配以.php结尾的都走这个location    
location ~ \.php$ {
    ...
}
#严格区分大小写，匹配以.jsp结尾的都走这个location 
location ~ \.jsp$ {
    ...
}
#不区分大小写匹配，只要用户访问.jpg,gif,png,js,css结尾的都走这条location
location ~* .*\.(jpg|gif|png|js|css)$ {
    ...
}
#不区分大小写匹配
location ~* "\.(sql|bak|tgz|tar.gz|.git)$" {
    ...
}
```
