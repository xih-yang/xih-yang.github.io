# 07、HTTP 头部信息
- 来源：https://ddkk.com/zhuanlan/other/http/7.html
- 分类：HTTP 教程
- 分组：教程目录
HTTP 请求头提供了关于请求，响应或者其他的发送实体的信息

应答头
说明

Allow
服务器支持哪些请求方法（如GET、POST等）

Content-Encoding
文档的编码（Encode）方法

Content-Length
表示响应内容长度

Content-Type
表示响应内容属于什么 MIME类型

Date
当前的 GMT 时间

Expires
指示响应内容过期时间，到了时间就要重新发起请求

Last-Modified
指示响应内容最后改动时间

Location
表示客户应当到哪里去提取文档

Refresh
表示浏览器应该在多少时间之后刷新文档，以秒计

Server
服务器名字

Set-Cookie
设置和页面关联的Cookie

WWW-Authenticate
客户应该在Authorization头中提供什么类型的授权信息

## 最佳实战

Content-Encoding

利用gzip压缩文档能够显著地减少HTML文档的下载时间

Content-Length

只有当浏览器使用持久HTTP连接时才需要这个数据

Content-Type

通常需要显式地指定为 text/html

Last-Modified

客户可以通过 If-Modified-Since 请求头提供一个日期

该请求将被视为一个条件 GET

只有改动时间迟于指定时间的文档才会返回

否则返回一个304（Not Modified）状态

Refresh

除了刷新当前文档之外，还可以通过设置响应头部

```sh
Refresh:5; URL=http://host/path
```

让浏览器读取指定的页面

注意这种功能通常是通过设置 HTML 页面 `` 区的 `` 实现

```sh
＜meta http-equiv="refresh" content="5;URL=http://host/path"＞
```

注意Refresh的意义是"N秒之后刷新本页面或访问指定页面"，而不是"每隔N秒刷新本页面或访问指定页面"。因此，连续刷新要求每次都发送一个Refresh头，而发送204状态代码则可以阻止浏览器继续刷新，不管是使用Refresh头还是

```sh
＜meta http-equiv="Refresh" ...＞
```

注意Refresh头不属于HTTP 1.1正式规范的一部分，而是一个扩展，但目前所有浏览器都支持

WWW-Authenticate

在包含401（Unauthorized）状态行的应答中这个头是必需的
