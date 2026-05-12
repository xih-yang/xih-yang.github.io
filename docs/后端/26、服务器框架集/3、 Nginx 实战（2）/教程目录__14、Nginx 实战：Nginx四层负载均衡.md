# 14、Nginx 实战：Nginx四层负载均衡
- 来源：https://ddkk.com/zhuanlan/server/nginx/3/14.html
- 分类：服务器框架
- 分组：教程目录
## 1.Nginx四层负载均衡基本概述

## 1.1.什么是四层负载均衡

四层负载均衡基于传输层协议包来封装的（如：TCP/IP），那我们前面使用到的七层是指的应用层，它的组装在四层基础之上，无论四层还是七层都是指的OSI网络模型。

## 1.2.四层层负载均衡应用场景

- 1.四层+七层来作负载均衡，4层可以保证7层的负载均衡的高可用性。如:nginx就无法保证自己的服务高可用，需要依赖lvs或者keepalive来作。
- 2.如:tcp协议的负载均衡，有些请求是TCP协议的(mysql、ssh)，或者说这些请求只需要使用4层进行端口的转发就可以了，所以使用4层负载均衡。

## 1.3.四层+七层构建大规模集群架构使用场景

## 1.4四层负载均衡总结

- 1.四层负载均衡仅能转发TCP/IP协议、UDP协议，通常用来转发端口，如: tcp/3306，tcp/22，udp/53。
- 2.四层负载均衡可以用来解决七层负载均衡的端口限制问题。（七层负载均衡最大使用65535个端口号）
- 3.可以用来解决七层负载均衡的高可用问题。（多台后端七层负载均衡能同时的使用）
- 4.四层的转发效率比七层的高的多，但仅支持tcp/ip协议，不支持http或者https协议

## 2.Nginx四层负载均衡场景实践

Nginx如何配置四层负载均衡

- 1.通过访问负载均衡的5555端口，实际是后端的web01的22端口在提供服务。
- 2.通过访问负载均衡的6666端口，实际是后端的mysql的3306端口在提供服务。

## 2.1.Nginx四层负载均衡配置语法

```java
stream {
    upstream backend {
        hash $remote_addr consistent;
        server backend1.example.com:12345 weight=5;
        server 127.0.0.1:12345 max_fails=3 fail_timeout=30s;
        server unix:/tmp/backend3;
    }
    server {
        listen 12345;
        proxy_connect_timeout 1s;
        proxy_timeout 3s;
        proxy_pass backend;
    }
}
```

## 2.2.Nginx四层负载均衡实战

```java
[root@lb01 ~]# mkdir -p /etc/nginx/conf.c
[root@lb01 ~]# vim /etc/nginx/nginx.conf
# 在events层下面，http层上面配置include
include  /etc/nginx/conf.c/*.conf;
# 编写四层代理配置
[root@lb01 ~]# cd /etc/nginx/conf.c/
[root@lb01 conf.c]# cat stream.conf 
stream {
   1.定义虚拟资源池
    upstream ssh {
        server 172.16.1.7:22;
    }
    upstream mysql {
        server 172.16.1.51:3306;
    }
   2.调用虚拟资源池
    server {
        listen 5555;
        proxy_connect_timeout 1s;
        proxy_timeout 300s;
        proxy_pass ssh;
    }
    server {
        listen 6666;
        proxy_connect_timeout 1s;
        proxy_timeout 300s;
        proxy_pass mysql;
    }
}
[root@lb01 conf.c]# systemctl restart nginx
```

## 2.3.如何记录四层负载均衡日志，四层负载均衡日志必须配置在stream模块

```java
[root@lb01 ~]# cat /etc/nginx/conf.c/tcp_proxy.conf
stream {
#定义日志的格式
log_format  proxy '$remote_addr -  [$time_local]  $status $protocol'
                  '"$upstream_addr" "$upstream_bytes_sent" "$upstream_connect_time"' ;
   调用日志，使用proxy格式
    access_log /var/log/nginx/tcp_proxy.log proxy;
    upstream ssh {
        server 172.16.1.7:22;
    }
    server {
        listen 5555;
        proxy_pass proxy_node1;
    }
}
```
