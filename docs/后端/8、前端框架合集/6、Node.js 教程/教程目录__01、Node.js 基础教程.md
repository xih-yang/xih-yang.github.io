# 01、Node.js 基础教程
- 来源：https://ddkk.com/zhuanlan/qianduan/nodejs/1.html
- 分类：前端框架
- 分组：教程目录
Node.js 是运行在服务端的 JavaScript

Node.js 是基于 Chrome V8 引擎开发的一个用于在服务器端运行 JavaScript 的平台

Node.js 是一个事件驱动 I/O 服务端 JavaScript 运行环境

## 谁适合阅读本教程？

如果你是一个前端程序员，希望使用 JavaScript 开发自己的后端服务，那么Node.js是一个非常好的选择

如果你是一个后端程序员，想部署一些高性能的服务，Node.js 也是一个非常好的选择

一句话，本教程适合 Node.js 初学者，

## 学习本教程前你需要了解

如果你是一个前端程序员，那么上手 Node.js 是非常容易的

如果你熟悉 JavaScript，那么上手 Node.js 也非常快

如果你熟悉其它的语言，那么 Node.js 也非常简单

如果以上都不是，那么我们希望你了解一些基本的计算机编程术语

## 本教程 Node 版本

本教程基于 Node 8.7.0 版本

你可以使用以下的脚本命令查看当前的 Node 版本

```javascript
$ node -v
v8、7.0
```

因为Node 每个版本都有些许差异，如果你在学习过程中发现有错误，请及时联系我们

## Node.js Hello World！

**1、****交互式Shell模式**；

打开终端或者命令行提示符，输入 node 然后回车

就会交互式 Shell 模式，可以输入一些代码语句后执行并显示结果

```javascript
$ node 
> console.log("Hello World!");
Hello World!
undefined
> console.log("Hello DDKK.COM 弟弟快看，程序员编程资料站!");
Hello DDKK.COM 弟弟快看，程序员编程资料站!
undefined
>
```

**2、****脚本模式**；

```javascript
将以下代码保存到 **main.js** 文件中
```

```javascript
/*
 * filename: main.js
 * author: DDKK.COM 弟弟快看，程序员编程资料站(ddkk.com)
 * Copyright © 2015-2065 ddkk.com. All rights reserved.
*/
console.log("Hello World!");
console.log("Hello DDKK.COM 弟弟快看，程序员编程资料站!");
```

```javascript
然后使用 **node main.js** 运行 Node.js 脚本，输出结果如下
```

```javascript
$ node main.js
Hello World!
Hello DDKK.COM 弟弟快看，程序员编程资料站!
```
