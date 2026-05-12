# 07、Nginx 精通 - web服务从C10k到C100k高性能
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/7.html
- 分类：服务器框架
- 分组：教程目录
Nginx初衷就是解决 C10K 问题：即客户端同时处理10,000 个连接的问题。因此作为Web服务器就是其最基础的功能。当前B/S应用实现一般都采用动态分离，Nginx作为静态Web服务器是个很好的选择。

**目录**

静态服务器配置

Web性能表现

测试环境

测试拓扑图

硬件

软件

协议

性能指标

nginx.conf配置

测试结果

CPS

RPS

吞吐量

## 静态服务器配置

nginx作为静态服务器的配置如下：

```java
server {
        default_server参数指示 NGINX 使用此服务器作为端口 80 的默认上下文，只要来自80端口没有匹配的域名，均访问这个服务
        listen 80 default_server;
        访问的匹配域名；配置了default_server，可不配置server_name 
        server_name www.example.com;
        location / {
            app的根目录（前端代码一般放在nginx目录的html下）
            root /usr/local/nginx/html;
            默认开始文件名
            index index.html index.htm;
        }
    }
```

root指令指向web根目录。

## Web性能表现

Nginx作为Web服务器，2017年8月，Nginx做过性能测试，摘录如下。

### 测试环境

#### 测试拓扑图

#### 硬件

CPU：2个Intel（R）Xeon（R）CPU E5‑2699 v3@2.30 GHz，36个实核（或72个HT）

网络：2个Intel XL710 40 GbE QSFP+（01版）

内存：16 GB

#### 软件

**1、** 在客户端计算机上运行的[wrk](https://github.com/wg/wrk)版本4.0.0生成NGINX代理的流量；

**2、** 在反向代理和Web服务器上运行NGINX1.9.7开源版本；

**3、** 三台服务器运行的系统版本是UbuntuLinux14.04.1；

#### 协议

**1、** http；

**2、** https；

ssl的加密参数：

- ECDHE-RSA-AES256-GCM-SHA384密码
- 2048位RSA密钥
- 完全正向保密（如密码名称中ECDHE所示）
- OpenSSL 1.0.1f

### 性能指标

**每秒连接数（CPS）** 衡量NGINX创建新的TCP连接回发出请求的客户端的能力。客户端发送一系列HTTP或HTTPS请求，每个请求都在一个新的连接上。NGINX解析请求，并为每个请求发回一个0字节的响应。请求得到满足后，连接将关闭。

**每秒请求数 (RPS)** – 测量处理每秒 HTTP 请求的能力。每个请求都从客户端机器发送到NGINX web服务器。测试是针对未加密的HTTP和加密的HTTPS流量进行的。

根据性能测试的常见做法，我们使用了四种标准文件大小：

- 0 KB模拟一个“空”的HTTP请求或响应，没有附带数据，例如302错误代码。
- 1KB大致相当于小型CSS或JavaScript文件或非常小的图像（如小图标）的大小。
- 10KB近似于较大的代码文件、较大的图标和较小的图像文件。
- 100KB表示大型代码文件和其他较大的文件。

**吞吐量(Throughput)** – 测量 NGINX Plus 通过 HTTP 为 100KB/1MB/10MB 文件提供服务时可维持的吞吐量。

###

nginx.conf配置

```java
user                 nginx;
worker_processes     auto;
worker_rlimit_nofile 10240;
pid                  /var/run/nginx.pid;
events {
    worker_connections 10240;
    accept_mutex       off;
    multi_accept       off;
}
http {
    access_log   off;
    include      /etc/nginx/mime.types;
    default_type application/octet-stream;
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" "$ssl_cipher" '
                    '"$ssl_protocol" ';
    sendfile on;
    keepalive_timeout  300s;     
    keepalive_requests 1000000;
    server {
        listen 80;
        root /var/www/html;
    }
}
```

### 测试结果

#### CPS

CPSfor http

CPSfor https

#### RPS

RPSfor http

RPSfor https

#### 吞吐量

测试NGINX能够在180秒内维持的HTTP请求吞吐量（以Gbps为单位）

**以上测试结果帮助我们感受到nginx的web服务性能，也可以在用于决定处理我们自己网站当前和未来流量所需的硬件规格。综合来看，8颗CPU是性价比最高的。**

性能测试摘自官网文章：[Testing the Performance of NGINX and NGINX Plus Web Servers - NGINX](https://www.nginx.com/blog/testing-the-performance-of-nginx-and-nginx-plus-web-servers/)
