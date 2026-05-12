# 24、Node.js JXcore 打包
- 来源：https://ddkk.com/zhuanlan/qianduan/nodejs/24.html
- 分类：前端框架
- 分组：教程目录
Node.js 采用 **事件驱动** 和 **异步I/O** 的方式，实现了一个单线程、高并发的运行时环境

因为是单线程，所以不能很好的利用多核优势

于是JXcore 就孕育而生了

JXcore 是一个支持多线程的 Node.js 发行版本

Node.js 现有代码不需要做任何改动就可以直接线程安全地以多线程运行

本章，我们将学习如何使用 Xcore 的打包功能

## JXcore 安装

JXcore 安装包里有一个 **jx** 命令，这个命令可以用来打包

JXcore 安装步骤如下

**1、** 下载JXcore安装包[https://github.com/jxcore/jxcore-release](https://github.com/jxcore/jxcore-release)；

可以根据你自己的系统环境来下载安装包：

Window 平台下载： [Download(Windows x64 (V8))][Download_Windows x64 _V8]

Linux / OSX 安装

使用以下命令安装 JXcore

```javascript
$ curl https://ddkk.com/static/media/jx_install.sh | bash
```

```javascript
如果权限不足，可以使用以下命令：
```

```javascript
curl https://ddkk.com/static/media/jx_install.sh | sudo bash
```

```javascript
如果一切顺利，以下命令会输出版本信息
```

```javascript
$ jx --version
v0.3.1.1
```

## 打包代码

假设我们某个项目有如下文件和文件夹，其中 main.js 是主文件

```javascript
$ ls -lh
total 16K
drwxr-xr-x  2 penglei staff   64 10 25 10:19 css
drwxr-xr-x  2 penglei staff   64 10 25 10:19 images
-rw-r--r--  1 penglei staff    0 10 25 10:19 index.html
-rw-r--r--  1 penglei staff    0 10 25 10:19 index.js
drwxr-xr-x  2 penglei staff   64 10 25 10:19 js
-rw-r--r--  1 penglei staff  739 10 25 10:01 main.js
drwxr-xr-x 22 penglei staff  704 10 25 09:18 node_modules
-rw-r--r--  1 penglei staff 1.3K 10 25 09:15 node_site.sql
-rw-r--r--  1 penglei staff 5.4K 10 25 09:18 package-lock.json
```

现在我们使用 **jx** 命令打包这个项目，并指定 index.js 为 Node.js 入口文件

```javascript
$ jx package index.js hello-jxcore
```

执行以上命令后，会生成两个文件：

**1、****hello-jxcore.jxp**是一个中间件文件，包含了需要编译的完整项目信息；

**2、****hello-jxcore.jx**是一个完整包信息的二进制文件，可运行在客户端上；

## 载入 JX 文件

使用JXcore **jx** 命令打包后，可以使用以下命令来执行生成的 jx 二进制文件

```javascript
$ jx hello-jxcore.jx command_line_arguments
```

更多JXcore 功能特性你可以参考官网： [https://github.com/jxcore/jxcore](https://github.com/jxcore/jxcore)
