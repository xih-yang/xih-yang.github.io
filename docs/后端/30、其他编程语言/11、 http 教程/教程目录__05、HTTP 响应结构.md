# 05、HTTP 响应结构
- 来源：https://ddkk.com/zhuanlan/other/http/5.html
- 分类：HTTP 教程
- 分组：教程目录
HTTP 响应也由四个部分组成，分别是：状态行、消息报头、空行和响应正文

- 状态行

服务器响应的第一行就是状态行

```sh
HTTP/1.1 200 OK
```

- 消息报头

从第二行开始到第一个 CRLF CRLF 之前的内容为报头

```sh
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

> CRLF 是回车换行的意思，CRLF CRLF 就是两个回车换行符

- 空行

空行就是 CRLF CRLF 也就是两个回车换行符 一个回车换行符提供换行，第二个回车换行符则提供了一个空行

- 响应正文

空行之后的所有内容都是响应正文

```sh
你好，世界
你好，DDKK.COM 弟弟快看，程序员编程资料站
```
