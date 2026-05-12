# 03、Node.js 创建第一个应用
- 来源：https://ddkk.com/zhuanlan/qianduan/nodejs/3.html
- 分类：前端框架
- 分组：教程目录
Node.js 一般用来创建高性能、高吞吐量的 WEB 应用程序

### 如果你会 PHP ？

如果你会 PHP 开发，应该发现了我们开发的 PHP 后端程序，需要 Apache 或者 Nginx 的 HTTP 服务器，并配上 mod_php5 模块和 php-cgi

从某些方面说，PHP 并没有参与 接收 HTTP 请求并提供 Web 页面 的全部过程

但使用Node.js 开发 WEB 应用程序就不一样了。使用 Node.js 时，我们不仅仅 在实现一个应用，同时还实现了整个 HTTP 服务器。

事实上，我们的 Web 应用以及对应的 Web 服务器基本上是一样的。

### Node.js 应用程序基本组成部分

在我们创建 Node.js 第一个 “Hello, World!” 应用前，先来解下 Node.js 应用是由哪几部分组成的：

**1、****引入模块**：我们可以使用**require**指令来载入Node.js模块；

**2、****创建服务器**：服务器可以监听客户端的请求，类似于Apache、Nginx等HTTP服务器；

**3、****接收请求与响应请求**：服务器很容易创建，客户端可以使用浏览器或终端发送HTTP请求，服务器接收请求后返回响应数据；

## 创建 Node.js 应用

了解了Node.js 应用程序基本的构造，我们就可以动手开发我们的第一个 Node.js WEB 应用程序了

**1、****引入模块**；

```javascript
使用 **require** 指令来载入 http 模块，并将实例化的 HTTP 赋值给变量 http
```

```javascript
var http = require("http");
```

**2、** 创建WEB服务器；

```javascript
我们使用 http.createServer() 方法创建服务器  
并使用 listen 方法绑定 8080 端口，开启监听服务
通过 request, response 参数来接收和响应数据
在我们项目的根目录下创建一个叫 main.js 的文件，并写入以下代码
```

```javascript
/*
 * filename: main.js
 * author: DDKK.COM 弟弟快看，程序员编程资料站(ddkk.com)
 * Copyright © 2015-2065 ddkk.com. All rights reserved.
*/
var http = require('http');
http.createServer(function (request, response) {
    // 发送 HTTP 头部 
    // HTTP 状态值: 200 : OK
    // 内容类型: text/plain
    response.writeHead(200, {'Content-Type': 'text/plain'});
    // 发送响应数据 "Hello World"
    response.end('Hello World\n');
}).listen(8080);
// 终端打印如下信息
console.log('Server running at http://127.0.0.1:8080/');
```

```javascript
这些代码就完成了一个可以工作的 HTTP 服务器
```

**3、** 使用**node**命令执行以上的代码；

```javascript
$ node main.js
Server running at http://127.0.0.1:8080/
```

```javascript
![img\_1.png][img_1.png]
```

打开浏览器访问 [http://127.0.0.1:8888/](http://127.0.0.1:8080/)，就会看到一个写着 “Hello World”的网页
