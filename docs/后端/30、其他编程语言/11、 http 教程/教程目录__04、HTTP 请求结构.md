# 04、HTTP 请求结构
- 来源：https://ddkk.com/zhuanlan/other/http/4.html
- 分类：HTTP 教程
- 分组：教程目录
HTTP 是基于客户端(代理)/服务端（C/S）的架构模型，通过一个可靠的链接来交换信息，是一个无状态的请求/响应协议

## HTTP 请求过程

一个HTTP 代理(userAgent) 是一个应用程序（Web浏览器或其他任何客户端），通过连接到服务器达到向服务器发送一个或多个 HTTP 的请求的目的

一个HTTP 服务器(SERVER) 同样也是一个应用程序（通常是一个 Web 服务，如Apache Web 服务器或IIS服务器或 NGINX 等），通过接收客户端的请求并向客户端发送HTTP响应数据

HTTP 使用统一资源标识符（Uniform Resource Identifiers, URI）来传输数据和建立连接

一旦建立连接后，数据消息就通过类似 Internet 邮件所使用的格式 [RFC5322]和多用途Internet邮件扩展（MIME）[RFC2045]来传送

## 客户端请求消息

客户端发送一个HTTP请求到服务器的请求消息包括以下格式：请求行（request line）、请求头部（header）、空行和请求数据四个部分组成

- 请求行（request line）

请求行是请求消息里的第一行数据

```sh
GET /static/media/hello.txt HTTP/1.1
```

- 请求头部（header）

请求头部为第二行到第一个空行之前所有的内容

```sh
Host: www.ddkk.com
User-Agent: curl/7.54.0
Accept: */*
```

- 空行

空行就是两个 CRLF

- 请求数据

请求数据就是空行之后的所有数据

> 除了 POST 方法和 PUT 方法，其他所有的方法都没有请求数据
