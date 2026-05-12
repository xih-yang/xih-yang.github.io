# 03、HTTP 范例
- 来源：https://ddkk.com/zhuanlan/other/http/3.html
- 分类：HTTP 教程
- 分组：教程目录
我们接下来要讲解的内容都会用到下面这个范例

我们使用 CURL 发送模拟 GET 请求服务器上的 static/media/hello.txt 文件

### shell 命令

```sh
curl -v  /static/media/hello.txt
```

> 关于如何使用 CURL ,你可以查看我们的 Linux CURL 教程

### 客户端请求信息：

```sh
GET /static/media/hello.txt HTTP/1.1
Host: www.ddkk.com
User-Agent: curl/7.54.0
Accept: */*
```

### 服务端响应:

```sh
HTTP/1.1 200 OK
Server: Tengine
Date: Sun, 03 Sep 2017 01:08:42 GMT
Content-Type: text/plain
Content-Length: 38
Last-Modified: Sun, 03 Sep 2017 01:08:21 GMT
Connection: keep-alive
ETag: "59ab5605-26"
Strict-Transport-Security: max-age=31536000;includeSubdomains;preload
X-Frame-Options: DENY
Accept-Ranges: bytes
```

### 输出结果：

```sh
你好，世界
你好，DDKK.COM 弟弟快看，程序员编程资料站
```
