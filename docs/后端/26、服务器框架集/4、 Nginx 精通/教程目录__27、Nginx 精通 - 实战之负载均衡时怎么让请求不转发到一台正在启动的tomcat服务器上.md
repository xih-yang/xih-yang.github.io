# 27、Nginx 精通 - 实战之负载均衡时怎么让请求不转发到一台正在启动的tomcat服务器上
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/27.html
- 分类：服务器框架
- 分组：教程目录
## 问题描述

用nginx做负载均衡的时候，当一台挂掉的时候，请求会转发到另外一台。但挂掉这一台的tomcat服务在启动过程中，Nginx请求可能会转发到这台正在启动的服务器上，就会一直等待直到超时，前端使用者的体验就会很差。如何让Nginx等待tomcat启动完成后才转发请求到服务器呢？

## 解决方案

共有如下几种方式。

### 方式1

重启tomcat服务前，关闭tomcat服务端口：

```java
firewall-cmd --zone=public --remove-port=8080/tcp --permanent  关闭8080端口
firewall-cmd --reload   使配置立刻生效
```

重启tomcat服务完成，开启tomcat服务端口：

```java
firewall-cmd --zone=public --add-port=8080/tcp --permanent   开放8080端口
firewall-cmd --reload   使配置立刻生效
```

以上方式可编写成shell脚本执行，完整脚本如下：

```java
#!/bin/bash
# 关闭端口
firewall-cmd --zone=public --remove-port=8080/tcp --permanent
firewall-cmd --reload
tomcat_dir=/opt/tomcat
# 备份之前日志
mv -f $tomcat_dir/logs/catalina.out $tomcat_dir/logs/catalina.out.old
# 启动tomcat
$tomcat_dir/bin/startup.sh
# 监控是否启动完成
loopCount=0
while [ $loopCount -lt 100 ]
do
    根据启动日志检查 
    upCheck=grep 'org.apache.catalina.startup.Catalina.start Server startup in' $tomcat_dir/logs/catalina.out
    if [ -n "$upCheck" ]
    then
        break
    fi
    sleep 10
    loopCount=expr $loopCount + 1
done
# 开启端口
firewall-cmd --zone=public --add-port=8080/tcp --permanent
firewall-cmd --reload
```

对于非Nginx plus版本，建议采用该种方式。

### 方式2

在重启前，手工修改Nginx配置文件，屏蔽掉这台机，用nginx -s reload在线更新配置。

启动好后，修改配置文件加回这台机，用nginx -s reload在线更新配置。

顺便说以下，通过设置 proxy_connect_timeout 1s; 不能解决问题。

### 方式3

在Nginx plus中，按如下方式简单设置即可：

```java
upstream {
    slow_start略大于服务启动到正常的时间
    server server1.example.com slow_start=20s; 
}
```

该种方式缺点是：不能支持hash、ip_hash和random负载均衡策略。

### 方式4

方式3不行的话，可用Nginx plus的主动健康检查功能。配置如下：

```java
http {
    server {
        ...
        location / {
            proxy_pass http://backend; 
            启动健康检查
            health_check interval=2s fails=1 passes=2 uri=/chk_start.html match=welcome;
        }
    }
    状态码是 200，内容类型是 "text/html",
    正文包含 "I am ok!" 
    match welcome {
        status 200;
        header Content-Type = text/html; 
        body ~ "I am ok!";
    }
}
```

应用服务器根目录下chk_start.html内容如下：

```java
I am ok!
```

详细参数说明见 [Nginx Plus增强功能之负载均衡](/zhuanlan/server/nginx/4/23.html)
