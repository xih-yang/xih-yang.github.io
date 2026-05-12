# 26、Nginx 精通 - 构建Nginx高可用、集群及性能监控
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/26.html
- 分类：服务器框架
- 分组：教程目录
高可用性的核心理念是在多个活跃节点上进行负载均衡、主-主、主-备故障转移，高可用性应用不会出现单点故障。通过Nginx负载均衡，被代理的应用服务器达到了高可用目的。作为一个高可用理念的完整系统，Nginx本身也应该是高可用的。

## 高可用方案

### Nginx-plus+Keepalived

nginx-ha-keepalived 包基于 keepalived，管理暴露给客户端的虚拟 IP 地址。在NGINX 服务器上运行的另一个进程可确保 NGINX Plus 和 keepalived 进程保持运行。Keepalived 进程使用虚拟路由器冗余协议（VRRP）将短消息（通常被称为心跳消息）发送到备份服务器。如果备份服务器连续三个周期接收不到心跳消息，备份服务器就会启动故障转移，将虚拟 IP 地址切换到自己这里并成为主服务器。nginx-ha-keepalived 的故障转移功能经配置，可识别自定义故障情形。

### Nginx+Keepalived

开源版Nginx没有像Nginx-plus提供完整nginx-ha-keepalived包来快速搭建高可用环境，需要自己手工完成。

下面以Centos7下操作为例。

#### Nginx安装配置略

略

#### Keepalived安装配置

配置**假定：两台Nginx，主机A: 192.168.1.223，从B: 192.168.1.222。虚拟ip：192.168.1.221**

**1、** 安装keepalived；

```java
# 安装
yum install keepalived
# 成为服务
systemctl enable keepalived.service
# 备份默认配置
mv /etc/keepalived/keepalived.conf /etc/keepalived/keepalived.conf.bak
# 启动
systemctl start keepalived
```

**2、** 主A/从B配置；

主A配置：

vi/etc/keepalived/keepalived.conf

```java
global_defs {
    router_id real-server1  　#运行keepalived机器的标识
    script_user root
    enable_script_security
 }
vrrp_script chk_nginx {
    script "/etc/nginx/check_nginx_status.sh"  监控服务脚本，脚本记得授予x执行权限；
    interval 2    指定脚本执行的间隔。单位是秒。默认为1s。
    weight -20
}
vrrp_instance VI_1 {
     state BACKUP
     interface eth1        绑定内网网卡
     virtual_router_id 151  虚拟路由id，和从机保持一致
     priority 100  优先级
     nopreempt              Master如果故障恢复后，不抢占成为Master
     advert_int 5           状态检查间隔，默认1秒，VRRP心跳包的发送周期，单位为s 组播信息发送间隔，两个节点设置必须一样
     authentication {
         auth_type  PASS  　主辅认证密码（生产环境修改），最长支持八位
         auth_pass  1111
     }
     virtual_ipaddress {     
       虚拟IP地址，绑定网卡eth0; 配置label ，不配置可能用ifconfig看不到ip
        192.168.1.221/16 dev eth0 scope global label eth0:1
     }
      track_script {                                                                                  
       chk_nginx
    }
 }
```

从B配置：

vi/etc/keepalived/keepalived.conf

```java
global_defs {
    router_id real-server2  　#运行keepalived机器的标识
    script_user root
    enable_script_security
 }
vrrp_script chk_nginx {
    script "/data/shell/check_nginx_status.sh"  监控服务脚本，脚本记得授予x执行权限；
    interval 2    指定脚本执行的间隔。单位是秒。默认为1s。
    weight -20
}
vrrp_instance VI_1 {
     state BACKUP
     interface eth1        绑定网卡eth1
     virtual_router_id 151  虚拟路由id，和从机保持一致
     priority 150  优先级
     advert_int 5           状态检查间隔，默认1秒，VRRP心跳包的发送周期，单位为s 组播信息发送间隔，两个节点设置必须一样
     authentication {
         auth_type  PASS  　主辅认证密码（生产环境修改），最长支持八位
         auth_pass  1111
     }
     virtual_ipaddress {     
        192.168.1.223/16 dev eth0 scope global label eth0:1
     }
      track_script {                                                                                  
       chk_nginx
    }
 }
```

配置检查脚本：

vi/etc/nginx/check_nginx_status.sh

```java
#!/bin/bash
nginx_status=$(ps -ef | grep nginx | grep -v grep | grep -v check | wc -l)
if [ $nginx_status -eq 0 ];then
		systemctl stop keepalived.service
fi
```

**3、** 防火墙配置；

```java
firewall-cmd --add-rich-rule='rule protocol value="vrrp" accept' --permanent
firewall-cmd --reload
```

**4、** 关闭SELinux；

```java
setenforce 0
```

永久关闭：

vi/etc/selinux/config

```java
SELINUX=disabled
```

**5、** 重启；

```java
systemctl restart keepalived
```

**6、** 配置好后测试，常见问题是：；

```java
curl: (7) Failed connect to ...; No route to host
```

通常检查：

**1、** 虚拟ip的掩码是否同环境一致；

**2、** 防火墙没停或没配置好；

**3、** SELinux影响，可关闭测试；

这里只是示例keepalived的安装配置，更复杂情形配置找相关文章查看。

### DNS+Nginx

通过向DNS A 记录中添加多个Nginx地址，使用 DNS 轮询 NGINX 服务器。A 记录允许在单个 FQDN 下列出多个 IP 地址。DNS 将自动轮询所有列出的 IP。DNS 还为加权记录提供加权轮询。该种方式**主要优点是只要DNS服务商开放这个服务，配置实现非常简单**。但存在如下一些缺点：

- 当 NGINX 服务器处理请求遇到故障时，DNS记录可能不会被删除。
- 不能保障同一客户端在一个会话期内始终分发到同一个Nginx。

这些缺点能否避免，主要看DNS服务商是否提供如下服务：

- DNS 产品提供健康检查和故障转移功能。
- 客户端会话一致性服务

该方案适用Nginx和Nginx-plus。

### SLB+Nginx

现在云服务器商都提供SLB(Server Load Balancer)服务(如阿里云的SLB，百度云的BLB、腾讯云的CLB)，主要目的是通过将流量分发到不同的后端服务来扩展应用系统的服务吞吐能力，消除单点故障并提升应用系统的可用性，且都同时提供4层和7层负载均衡。由于云服务器商提供的是通用策略，不如Nginx提供那么多强大和个性化的要求，例如多种负载均衡方法、流量管控、高速缓存、安全管控等，因此可在SLB之后加入Nginx，把Nginx作为SLB负载均衡的对象。当然，如果SLB能满足我们的应用要求，就可以直接使用，不再使用Nginx。

该方案适用Nginx和Nginx-plus。

## 集群方案

集群是Nginx-plus功能，Nginx不具备。

Nginx脚本同步可采用Ansible配置工具。

### 配置脚本同步

Nginx-plus配置高可用后，对于多台Nginx-plus，可使用独有的配置同步功能实现配置同步。工作示意图如下：

步骤如下：

**1、** 安装nginx-sync；

```java
yum install nginx-sync
```

**2、** 指定一台服务器为主配置机（简称“主机”），授予主机以root身份SSH访问对等机具体步骤如下：；

**2、** 1、主机产生密钥(root或运行用户)：；

ssh-keygen -t rsa -b 4096 -P ''

**2、** 2.主机专用命令拷贝并设置生效；

ssh-copy-id -i -p 端口 ~/.ssh/id_rsa.pub username@从服务器ip

ssh-copy-id 可以把本地主机的公钥复制到远程主机的 authorized_keys 文件上。ssh-copy-id 也会给远程主机的用户主目录（home）和 ~/.ssh 和 ~/.ssh/authorized_keys 设置合适的权限。

**2、** 3、测试：主机执行如下命令：；

ssh从服务器ip date

正常显示日期时间就表示配好了，表示主机可以免密访问从服务器。

**3、** 在主机上使用以下配置创建配置文件/etc/nginx-sync.conf：；

```java
# 同步的服务器节点名 空格隔开的主机名或 IP 地址的字符串
NODES="node2.example.com node3.example.com node4.example.com"
# 同步的文件或目录
CONFPATHS="/etc/nginx/nginx.conf /etc/nginx/conf.d"
# 不同步的文件
EXCLUDE="default.conf"
```

**4、** 对配置进行测试：；

```java
# 显示使用信息
nginx-sync.sh -h 
# 与节点2比较配置
nginx-sync.sh -c node2.example.com 
# 与所有对等节点比较主要配置
nginx-sync.sh -C 
# 在所有对等节点上同步配置并重载 NGINX
nginx-sync.sh 
```

### 运行状态共享和区域同步

NGINX Plus 运行时，可在大量高可用性服务器之间同步其共享内存区，共享内容包括速率限制、粘性学习（sticky-learn）、会话和键值（key-value）存储等方面。通过共享内存区，每个客户端的会话是共享的，因此真正实现一台应用服务器故障时能无缝转移到另一台应用服务器。

示例如下：

```java
http {
    upstream my_backend {
        zone my_backend 64k;
        server backends.example.com resolve;
        同步会话信息
        sticky learn zone=sessions:1m create=$upstream_cookie_session lookup=$cookie_session sync; 
    }
    server {
        listen 80;
        location / {
            proxy_pass http://my_backend;
        }
    }
}
```

可共享内容的指令后面都有可选项[sync] ，如Sticky learn、limit_req_zone、keyval_zone 。配置时加上sync即开启同步。

## 性能监控

为了确保应用以最佳性能和精度运行，需要清晰地了解Nginx有关其活动的监控指标。如果需要更专业的性能监控，可使用NGINX Management Suite。

### Nginx监控

启用NGINX HTTP 服务器内 location 代码块中的 stub_status 模块：

```java
location /stub_status {
    开启状态监控
    stub_status;
    限制可使用的客户端
    allow 127.0.0.1;
    deny all;
}
```

通过发送如下请求来测试配置：

```java
$ curl http://127.0.0.1/stub_status
Active connections: 1
server accepts handled requests
1 1 1
Reading: 0 Writing: 1 Waiting: 0
```

NGINX 开源版服务器stub_status可进行基本的监控，包括活跃连接数、已接受的连接总数、已处理的连接数、服务请求数。还包括当前正处于读入、写入或等待状态的连接数。所提供的信息为全局信息，并非特定于定义 stub_status 指令的父 server，将其定义在特定的server 上是为了更安全的目的。同时stub_status将活跃连接数作为嵌入式变量提供，以用于日志和其他地方。这些变量包括 $connections_active、$connections_reading、$connections_writing 以及 $connections_waiting。

### NGINX Plus 监控仪表盘

NGINX Plus提供专业的监控仪表盘，仪表盘提供有关 NGINX 系统状态的详细信息，例如活跃连接数、正常运行时间、上游服务器池信息等。监控仪表盘的图示如下（演示地址：[NGINX Plus Dashboard](https://demo.nginx.com/dashboard.html)）：

配置如下：

```java
server {
    location /api {
        api write=on;
    }
    location = /dashboard.html {
        root /usr/share/nginx/html;
    }
}
```

浏览器访问url： http://主机/dashboard.html。

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
