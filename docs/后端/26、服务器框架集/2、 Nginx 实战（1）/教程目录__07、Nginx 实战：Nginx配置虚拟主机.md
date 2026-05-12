# 07、Nginx 实战：Nginx配置虚拟主机
- 来源：https://ddkk.com/zhuanlan/server/nginx/2/7.html
- 分类：服务器框架
- 分组：教程目录
## 一、配置方式

虚拟主机配置方式：

1.基于多IP的方式

2.基于多端口的方式

3.基于多域名的方式

## 二、基于多IP的方式

```java
1.第一个配置文件
[root@web02 /etc/nginx/conf.d]# vim mali.conf 
server {
    listen 10.0.0.8:80;
    server_name localhost;
    location / {
        root /code/zhiwu;
        index index.html;
    }
}
2.第二个配置文件
[root@web02 /etc/nginx/conf.d]# vim tank.conf 
server {
    listen 172.16.1.8:80;
    server_name localhost;
    location / {
        root /code/tank;
        index index.html;
    }
}
3.检查配置重启
[root@web02 /etc/nginx/conf.d]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web02 /etc/nginx/conf.d]# systemctl restart nginx
```

## 三、基于多端口的方式

```java
1.第一个配置
[root@web02 /etc/nginx/conf.d]# cat mali.conf 
server {
    listen 80;
    server_name localhost;
    location / {
        root /code/zhiwu;
        index index.html;
    }
}
2.第二个配置
[root@web02 /etc/nginx/conf.d]# cat tank.conf 
server {
    listen 81;
    server_name localhost;
    location / {
        root /code/tank;
        index index.html;
    }
}
3.检查配置并重启
[root@web02 /etc/nginx/conf.d]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web02 /etc/nginx/conf.d]# systemctl restart nginx
4.访问测试
1）访问 http://10.0.0.8:80
2）访问 http://10.0.0.8:81
```

## 四、基于多域名的方式

```java
1.第一个配置
[root@web02 /etc/nginx/conf.d]# vim mali.conf 
server {
    listen 80;
    server_name www.mali.com;
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
    location / {
        root /code/tank;
        index index.html;
    }
}
3.检查并重启
[root@web03 /etc/nginx/conf.d]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
[root@web03 /etc/nginx/conf.d]# systemctl restart nginx
4.配置本地hosts
C:\Windows\System32\drivers\etc\hosts
10.0.0.8 www.mali.com
10.0.0.8 www.tank.com
5.访问测试
```
