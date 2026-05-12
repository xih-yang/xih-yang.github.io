# 16、Nginx 精通 - 利用http2/http3提升系统性能及支持websocket
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/16.html
- 分类：服务器框架
- 分组：教程目录
## HTTP发展历史

HTTP（ Hyper Text Transfer Protocol 超文本传输协议）是为Web浏览器与Web服务器之间的通信而设计的应用层传输协议，用于传输超文本文档，基于TCP协议。HTTP/2和HTTP/3都是HTTP发展产物，当前主流是HTTP/2，所有客户端器和服务端均支持。HTTP/3支持还并不那么全面。

Nginx也是在最新版本Nginx1.25版本开始支持HTTP/3。

### HTTP1.1

HTTP 1.1是标准化的协议，HTTP 1.1消除了大量歧义内容并引入了多项改进。

### HTTP2.0

HTTP2.0(http/2)是HTTP协议的第一个主要修订版，由 IETF（互联网工程任务组）于 2015 年 5 月发布，旨在通过实施各种优化技术来减少网页加载延迟。

主要特点如下：

**1、** HTTP2.0将请求和响应消息编码为二进制，而HTTP1.1是可见的通纯文本消息；

**2、** HTTP2.0是完全多路复用和并发的，连接都是永久的，每个来源仅需一个连接HTTP1.1请求之间是相互孤立的，每次请求重新建立TCP连接，用完关闭；

**3、** HTTP2.0头部元数据可进行很大的压缩，减小开销；HTTP1.1中，头部元数据都是以纯文本的形式发送的，每个请求约增加500-8000字节；

**4、** 流控制：阻止发送方向接收方（服务器）发送大量数据的机制；

**5、** 服务器可主动推送信息；

### HTTP3.0

HTTP3.0（HTTP/3）是2020年8月发布的新版本HTTP，基于QUIC（Quick UDP Internet Connections，最初由Google开发）协议，旨在显著减少延迟并提高效率，特别是当网络条件不是最佳时。

主要特点如下：

**1、** HTTP3.0基于UDP，之前HTTP都是基于TCP；

**2、** HTTP3.0具备前向纠错能力，解决之前HTTP丢包阻塞问题；

**3、** HTTP3.0具备连接迁移能力，支持切换到新网络而无需发送另一次握手之前HTTP不具备这个特点特别适合移动端设备；

**4、** HTTP3.0头压缩采用QPACK算法，相对于HTTP/2采用的HPACK算法，具备更好的压缩比、更快的压缩和解压缩速度以及更大的灵活性；

## HTTP/2配置

HTTP/2由模块ngx_http_v2_module实现。

### 基本配置

如下代码开启HTTP2：

```java
server {
    listen 443 ssl;
    http2 on;
    上两行配置等同于下面这行配置
   listen 443 ssl http2;
    ssl_certificate server.crt;
    ssl_certificate_key server.key;
    ...
}
```

注：HTTP2通常是需要SSL/TLS支持的。

### 服务器推送

推送示例如下：

```java
server {
    listen 443 ssl http2 default_server;
    ssl_certificate server.crt; 
    ssl_certificate_key server.key; 
    如果响应头字段中包含“Link”，开启后将其指定的链接预加载并自动转换为推送请求。
    http2_push_preload off;
    root /usr/share/nginx/html;
    location = /demo.html { 
        只有具有绝对路径的相对URI才会被推送处理
        http2_push /style.css; 
        http2_push /demo.jpg;
    }
}
```

当客户端请求/demo.html时，自动推送style.css和demo.jpg到客户端，无需客户端请求。

**注意：推送指令http2_push_preload 、http2_push都在Nginx1.25.1被标记为过时指令，因此不推荐使用。**

## HTTP/3配置

Nginx1.25.0开始支持HTTP/3。

由模块ngx_http_v3_module实现。

HTTP/3配置实例如下：

```java
http {
    log_format quic '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" "$http3"';
    access_log logs/access.log quic;
    server {
        http/3和https使用相同的端口
        listen 8443 quic reuseport;
        listen 8443 ssl;
        ssl_certificate     certs/example.com.crt;
        ssl_certificate_key certs/example.com.key;
        location / {
            增加头字段表示用HTTP/3协议
            add_header Alt-Svc 'h3=":8443"; ma=86400';
        }
    }
}
```

要使用HTTP/3，需注意的事项：

**1、** 确保Nginx是正确版本用nginx-V查看，须有"--with-http_v3_module"项；

**2、** 确保是TLSv1.3协议，OpenSSL1.1.1版本或以上；

**3、** 确保客户端实际通过QUIC发送请求；

## Websocket支持

WebSocket 是HTML5中的标准功能，是在浏览器端和服务器端间建立实时连接的一种通信协议，可以在服务器和浏览器端建立类似 socket 方式的消息通信。最大优势是方便服务器和浏览器之间的双向数据实时通信。WebSocket 在网络中传输的最小单位也是帧，数据的传输也可以理解为流式的传输。

当Nginx用作反向代理时，浏览器端和服务器端并不能直接通讯，因此Nginx专门做了WebSocket支持。

### websocket与http两者关系

**1、** websocket是独立的协议（连接协议为：ws://），但实现是建立在TCP协议之上；

**2、** 、websocket与HTTP协议有着良好的兼容性，默认端口也是80和443；

**3、** websocket握手阶段采用HTTP协议，因此能通过HTTP代理服务器建立连接；

**4、** websocket只需要建立一次连接，之后就可以保持连接状态并进行双向通信因此建立连接后，就同Http无关了；

### websocket握手连接

**1、** 客户端建立连接时，通过HTTP发起请求报文，报文表示请求服务器端升级协议为WebSocket与普通的HTTP请求协议区别在于增加了如下协议头：；

Upgrade：websocket

Connection：Upgrade

**2、** 服务器端响应客户端，告诉客户端正在更换协议（状态码101），更新应用层协议为WebSocket协议，并在当前的套接字连接上应用新的协议；

**3、** 一旦WebSocket握手成功，服务器端与客户端将会呈现对等的效果，都能接收和发送消息；

### Nginx配置

配置实例如下：

```java
location /chat/ {
    proxy_pass http://backend;
    proxy_http_version 1.0|1.1; 默认proxy_http_version 1.0。需指定1.1才支持
    proxy_http_version 1.1;
    把头字段"Upgrade"和"Connection"从客户端传递到被代理服务器
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

注意：

**1、** 默认情况下，如果代理服务器在60秒内未传输任何数据，则连接将关闭，可通过proxy_read_timeout指令来增加；

**2、** 客户端或服务器定期发送ping帧，保活WebSocket连接例如客户端js保活:；

```java
# 连接保活：每隔 5 秒钟向服务器发送一个 Ping 帧，带type参数值为"ping"。服务器收到 Ping 帧后，应该立即回复一个 Pong 帧，含type参数值为"pong"
const webSocket = new WebSocket("wss://example.com");
// 每隔 50 秒钟发送一次 Ping 帧
setInterval(function() {
    if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ type: "ping" }), { fin: true, opcode: 0x9 });
    }
}, 50000);
```

**3、** 浏览器需支持websocket协议；

这篇文章如果对您有所帮助或者启发的话，帮忙关注或点赞，有问题请评论，必有所复。您的支持是我写作的最大动力！
