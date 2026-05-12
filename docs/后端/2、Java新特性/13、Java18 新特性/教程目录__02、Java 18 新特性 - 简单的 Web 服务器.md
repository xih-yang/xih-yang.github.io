# 02、Java 18 新特性 - 简单的 Web 服务器
- 来源：https://ddkk.com/zhuanlan/java/java18/2.html
- 分类：Java 18 新特性
- 分组：教程目录
在Java 18 中，提供了一个新命令 `jwebserver`，运行这个命令可以启动一个**简单的 、最小化的**静态 Web 服务器，它不支持 CGI 和 Servlet，所以最好的使用场景是用来测试、教育、演示等需求。

其实在如 Python、Ruby、PHP、Erlang 等许多平台都提供了开箱即用的 Web 服务器，可见一个简单的 Web 服务器是一个常见的需求，Java 一直没有这方面的支持，现在可以了。

在Java 18 中，使用 `jwebserver` 启动一个 Web 服务器，默认发布的是当前目录。

在当前目录创建一个网页文件 index.html

```java
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
</head>
<body>
<h1>标题</h1>
</body>
</html>
```

启动`jwebserver`.

```java
➜  bin ./jwebserver
Binding to loopback by default. For all interfaces use "-b 0.0.0.0" or "-b ::".
Serving /Users/darcy/develop/jdk-18.jdk/Contents/Home/bin and subdirectories on 127.0.0.1 port 8000
URL http://127.0.0.1:8000/
```

浏览器访问：

有请求时会在控制台输出请求信息：

```java
127.0.0.1 - - [26/3月/2022:16:53:30 +0800] "GET /favicon.ico HTTP/1.1" 404 -
127.0.0.1 - - [26/3月/2022:16:55:13 +0800] "GET / HTTP/1.1" 200 -
```

通过`help` 参数可以查看 `jwebserver` 支持的参数。

```java
➜  bin ./jwebserver --help
Usage: jwebserver [-b bind address] [-p port] [-d directory]
                  [-o none|info|verbose] [-h to show options]
                  [-version to show version information]
Options:
-b, --bind-address    - 绑定地址. Default: 127.0.0.1 (loopback).
                        For all interfaces use "-b 0.0.0.0" or "-b ::".
-d, --directory       - 指定目录. Default: current directory.
-o, --output          - Output format. none|info|verbose. Default: info.
-p, --port            - 绑定端口. Default: 8000.
-h, -?, --help        - Prints this help message and exits.
-version, --version   - Prints version information and exits.
To stop the server, press Ctrl + C.
```
