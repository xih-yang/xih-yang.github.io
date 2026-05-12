# 21、Nginx 精通 - 十几种提升性能的优化方法
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/21.html
- 分类：服务器框架
- 分组：教程目录
无论何种类型的服务器或应用，其性能都取决于许多可变项，包括但不限于物理硬件、操作系统、数据库、应用服务器等中间件、应用结构等。性能优化通常在碰到性能瓶颈时才进行调优测试，确定瓶颈，改进限制，并不断重复，直至满足性能需求。

本文仅针对Nginx作为一个中间件如何进行性能优化，解决出现在Nginx这个环节的瓶颈。如果是第一次优化，性能提升达到10倍都不是梦。

**目录**

调优工具与步骤

核心参数

连接请求优化

客户端长连接

分流/限制

SSL/TLS优化

实施HTTP/2

服务器端长连接

数据处理优化

数据缓存

响应缓冲

压缩数据

sendfile

日志缓存

优化Linux操作系统

net.core.somaxconn

文件描述符

端口

防止大量TIME_WAIT

硬件扩容

## 调优工具与步骤

性能调优的第一件事情就是选择压测工具，压测工具可确保测试结果的一致性和可重复性。常见压测工具有Apache Jmeter、Load impact、LoadRunner或团队现有的测试工具。压测基本步骤：

**1、** 建立环境；

**2、** 初测性能指标建立基线；

**3、** 缓慢增加模拟的并发用户数，以模拟典型的生产使用情况并确定改进点；

**4、** 调优改进；

**5、** 测试；

**6、** 不断重复3-5此流程，直至实现预期性能；

## 核心参数

NGINX 可以运行多个工作进程，每个都能够处理大量并发连接。示例：

```java
# 默认是1
worker_processes auto;
# 默认是512；合适值取决于服务器性能和流量性质，可通过测试确定。
worker_connections 16384;
```

参数详见：[精通Nginx（04）-核心指令](/zhuanlan/server/nginx/4/4.html)

## 连接请求优化

### 客户端长连接

要增加可在单个客户端连接上发起的请求数以及空闲连接可保持的时长。使用 keepalive_requests 和 keepalive_timeout 指令，更改可在单个连接上发起的请求 数以及空闲连接可保持打开状态的时长。示例如下：

```java
http {
    在1.19.10之前默认100；之后默认为1000
    keepalive_requests 1000; 
   默认75s
    keepalive_timeout 300s;
    ...
}
```

指令详见：[精通Nginx（05）-http工作机制、指令和内置变量](/zhuanlan/server/nginx/4/5.html)

### 分流/限制

根据客户端访问特点，可进行有效分流。

如果客户端消耗资源太多，可采用客户端限制策略。

具体配置操作详见：[精通Nginx（12）-流量管控](/zhuanlan/server/nginx/4/10.html)

### SSL/TLS优化

SSL/TLS在网站中的应用非常广泛，但同时带来的相关性能问题也困扰着许多网站。NGINX 通过SSL性能优化，可以将执行 SSL/TLS 加密和解密的时间及 CPU 消耗降到最低。

具体配置操作详见：[精通Nginx（14）-配置HTTPS](/zhuanlan/server/nginx/4/14.html)

### 实施HTTP/2

对于已经使用 SSL/TLS 的站点，HTTP/2 会让性能更上一层楼，因为一个连接仅需要一次握手，且单个连接是多路复用的，一个连接可同时承载多个请求和响应。

具体配置操作详见：[精通Nginx（16）-支持http2/3与websocket](/zhuanlan/server/nginx/4/16.html)

### 服务器端长连接

保持被代理 服务器长连接，通过连接复用提高性能。示例如下：

```java
http{
    HTTP1.1才允许在单个保持打开状态的连接上连续发送多个请求
    proxy_http_version 1.1; 
    删除默认请求头 close，以允许连接保持打开状态
    proxy_set_header Connection "";
    upstream backend { 
        server 10.0.0.42;
        server 10.0.2.56;
        每个 worker 进程可保持打开状态的最大空闲连接数
        keepalive 32;
    }
}
```

具体配置操作详见：： [精通Nginx（10）-负载均衡](/zhuanlan/server/nginx/4/10.html)

## 数据处理优化

### 数据缓存

客户端请求的数据分为两类：静态内容和动态内容。

- **静态内容缓存** —— 图像文件 (JPEG、PNG) 和代码文件 (CSS、JavaScript) 等不常更改的文件可以存储在Nginx服务器上，以便快速从内存或磁盘中检索。
- **动态内容缓存** —— 许多 Web 应用都会为每个页面请求生成新的 HTML。通过短暂缓存一份生成的 HTML 副本，可以大大减少必须要生成的页面总数，同时仍然提供足够满足需求的新鲜内容。假设一个页面每秒被查看 10 次，那么缓存 1 秒就代表这个页面有 90% 的请求来自缓存。

具体配置操作详见：[精通Nginx（11）-缓存](/zhuanlan/server/nginx/4/11.html)

### 响应缓冲

数据缓存通常缓存在文件中。对于一部分响应内容缓存在内存中，直到缓冲区填满为止，可以实现与客户端更高效的通信。 示例如下：

```java
server {
    proxy_buffering 启用响应缓冲，默认是on
    proxy_buffering on; 
    proxy_buffer_size 读取来自代理服务器的响应首包和响应头的缓冲区大小，默认为 4K 或 8K
    proxy_buffer_size 8k; 
    proxy_buffers两个参数：缓冲区数量和缓冲区大小。默认情况下，proxy_buffers 指令被设置为 8 个缓冲区，依据平台不同单个缓冲区容量为 4k 或 8k
    proxy_buffers 8 32k; 
    proxy_busy_buffer_size限定了繁忙缓冲区的大小，繁忙缓冲区可支持在还未完全读取被代理服务响应内容的情况下直接响应客户端。繁忙缓冲区的大小默认为代理缓冲区或正常缓冲区大小的两倍
    proxy_busy_buffer_size 64k;
     ...
}
```

代理缓冲区能显著提升代理服务性能，具体取决于响应内容的大小。调整缓冲区设置可能会产生不利影响，非必要情况下不要设置过大缓冲区（可通过反复测试确定消息体的平均大小），因为这会占用大量的 NGINX 内存。可以只为已知 会返回大型响应消息体的特定位置设置大型缓冲区，从而优化性能。

具体配置操作详见： [精通Nginx（11）-缓存](/zhuanlan/server/nginx/4/11.html)

### 压缩数据

压缩数据是一个重要的、潜在的性能加速器。图片（JPEG 和 PNG）、视频 (MPEG-4）和音乐 (MP3) 等文件都有着精心打造和非常高效的压缩标准，其中任何一个标准都可以将文件缩小一个数量级甚至更多。而HTML（包括纯文本和 HTML 标签）、CSS 和代码(如 JavaScript）等文本数据经常在不压缩的情况下进行传输。压缩这些数据可能会对可感知到的 Web 应用性能产生特别明显的影响，尤其是对速度缓慢或移动连接受限的客户端来说。

智能内容压缩通常可以将 HTML、Javascript、CSS 和其他文本内容的带宽需求减少 30% 及以上，并相应地减少加载时间。如果使用 SSL，压缩可以减少必须进行 SSL 编码的数据量，从而抵消压缩数据所需的一些 CPU 时间。

具体配置操作详见：[精通Nginx（13）-数据压缩](/zhuanlan/server/nginx/4/13.html)

### sendfile

操作系统的 sendfile() 系统调用可将数据从一个文件标识符拷贝到另一个文件标识符，通常可实现零拷贝，这可加速 TCP 数据传输。可在 http 上下文或 server 或 location 上下文中包含 sendfile 指令，如下：

```java
# 默认off
sendfile on;
```

配置sendfile on后，Nginx无需切换到用户空间，即可把缓存或磁盘上的内容写入套接字，而且写入速度非常快，消耗更少的 CPU 周期。注意，由于使用 sendfile() 拷贝的数据可以绕过用户空间，因此不受制于常规 NGINX 处理链和更改内容的过滤器，例如 gzip。当配置环境中包含 sendfile 指令以及激活内容更改过滤器的指令时，NGINX 会自动禁用 sendfile。

### 日志缓存

对于存在大量请求的站点和应用来说，访问日志会显著影响磁盘和 CPU 的使用率。启用日志缓冲，可降低 NGINX worker 进程发生阻塞 的可能性。日志缓存方式就是不要立即将每个请求的日志写到磁盘，可以先将条目放到内存缓冲区，然后再批量写入。示例如下：

```java
http {
    access_log /var/log/nginx/access.log main buffer=32k flush=1m gzip=1;
}
```

日志在写入磁盘之前，可保存在缓冲区（buffer=32k）中的最长时间1分钟(flush=1m)。日志数据在写入日志之前会进行压缩（gzip=1），具有 1（最快轻度压缩）到 9 （最慢极限压缩）九个压缩级别。

更多配置操作详见：[精通Nginx（06）-日志](/zhuanlan/server/nginx/4/6.html)

##

优化Linux操作系统

Linux 是当今大多数 Web 服务器的底层操作系统。默认情况下，许多 Linux 系统的优化都比较保守，以占用少量资源。Linux调优NGINX，重点考虑以下几个参数。

### net.core.somaxconn

net.core.somaxconn是linux监听队列的上限值，当系统接到一个请求(request)尚未被处理或者建立时，它就会进入监听队列。如果监听队列被填满后，新来的请求就会被拒绝。如果当前连接限制数太小，就会收到错误消息，可以逐渐增加此参数，直到错误消息不再出现。

`操作命令：`

```java
​# 查看
sysctl -a | grep net.core.somaxconn
# 临时修改命令（重启失效）：
sysctl -w net.core.somaxconn=1024
# 永久修改：
vi /etc/sysctl.conf  加入下面内容：
net.core.somaxconn=1024
执行下列命令：
sysctl -p
```

### 文件描述符

NGINX 最多对每个连接使用两个文件描述符。如果系统服务于很多连接，则可能需要增大 `sys.fs.file_max`（整个系统范围内对文件描述符的限制）以及 `nofile`（用户文件描述符限制），以支持增加的负载。

`sys.fs.file_max`命令：

```java
# 查看
cat /proc/sys/fs/file-max
或
sysctl -a | grep 'fs.file-max'
# 更改临时生效命令
echo 数量 > /proc/sys/fs/file-max
或
sysctl -w "fs.file-max=数量"
# 更改永久生效: 
echo "fs.file-max = 数量" >> /etc/sysctl.conf
```

`nofile命令：`

```java
# 查看
ulimit -n
# 临时修改
 ulimit -n 65536
# 永久修改（重启生效）
vi /etc/security/limits.conf   增加内容：
* hard nofile 65536
* soft nofile 65536
```

通常需要配合更改Nginx核心指令：Nginx worker_connections 和 worker_rlimit_nofile 的值。 参数详见： [精通Nginx（04）-核心指令](/zhuanlan/server/nginx/4/4.html)

### 端口

当用作代理时，NGINX 会为每个上游服务器创建临时端口。可修改`net.ipv4.ip_local_port_range` 值阈，以增加可用端口的数量。

net.ipv4.ip_local_port_range操作命令：

```java
# 查看
sysctl net.ipv4.ip_local_port_range
# 临时修改（通常最大值65535，最小值不同系统而异）
sysctl -w net.ipv4.ip_local_port_range="32768 65535"
# 永久性修改
vi /etc/sysctl.conf  增加或修改
net.ipv4.ip_local_port_range = 1024 6553
```

### 防止大量TIME_WAIT

根据TCP协议定义的3次握手断开连接规定,发起主动关闭的一方 socket将进入TIME_WAIT状态，TIME_WAIT状态将持续2个MSL(Max Segment Lifetime-默认为240秒），TIME_WAIT状态下的socket不能被回收使用。具体现象是对于一个处理大量短连接的服务器，如果是由服务器主动关闭客户端的连接，将导致服务器端存在大量的处于TIME_WAIT状态的socket，严重影响服务器的处理能力，甚至耗尽可用的socket，停止服务。

用vi /etc/sysctl.conf 增加或修改`相关参数如下：`

```java
# 启SYN Cookies。当出现SYN等待队列溢出时，启用cookies来处理，可防止洪水攻击，高并发系统需要将此项关闭
net.ipv4.tcp_syncookies = 0
# 开启TCP连接重用，允许处理TIME-WAIT状态的连接重新用于新的TCP连接
net.ipv4.tcp_tw_reuse = 1
# 开启快速回收TCP连接中处于TIME-WAIT状态的连接
net.ipv4.tcp_tw_recycle = 1
＃修改超时时间(s)，该值表示如果连接由本端关闭，则连接处于 FIN-WAIT-2状态的时间为
net.ipv4.tcp_fin_timeout = 30
# 当 keepalive（长连接）启用的时候，TCP发送 keepalive 消息（探测包）的时间间隔时间(S),默认为2个小时
net.ipv4.tcp_keepalive_time =1200
# SYN队列的长度，可以容纳更多等待连接的网络连接数，默认为1024
net.ipv4.tcp_max_syn_backlog = 65535
# 保持TIME_WAIT状态连接的最大数量，如果超过此值，TIME_WAIT 将立刻被清除并打印警告信息，默认为180000
net.ipv4.tcp_max_tw_buckets =5000
# 每个网络接口接收数据包的速率比内核处理这些包的速率快时，允许送到队列的数据包的最大数目
net.core.netdev_max_backlog =65535
```

查看参数用：sysctl 参数名。

## 硬件扩容

如果前述措施不能解决或解决情况下，性能仍然达不到需要，考虑增强相关硬件。

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
