# 07、Node.js 回调函数
- 来源：https://ddkk.com/zhuanlan/qianduan/nodejs/7.html
- 分类：前端框架
- 分组：教程目录
回调函数是 Node.js 实现异步编程最重要的组成部分

回调函数在完成任务后就会被调用

Node.js 使用了大量的回调函数

Node.js 所有 API 都支持回调函数

有了回调函数， Node.js 就可以可以一边读取文件，一边执行其它命令，在文件读取完成后，再将文件内容作为回调函数的参数返回，这样在执行代码时就没有阻塞或等待文件 I/O 操作，大大提高了 Node.js 的性能，可以处理大量的并发请求

Node.js fs 模块 (文件系统模块) 同时支持同步阻塞和异步模式两套函数

我们现在当前目录下创建文件 demo.txt 内容如下

```javascript
DDKK.COM 弟弟快看，程序员编程资料站，教程 
DDKK.COM 弟弟快看，程序员编程资料站官网 : https://ddkk.com
```

现在我们分别使用 同步阻塞和异步 IO 模式读取 demo.txt 内容

### 同步阻塞

使用fs.readFileSync 方法以同步阻塞模式读取文件内容

#### main.js

```javascript
/*
 * filename: main.js
 * author: DDKK.COM 弟弟快看，程序员编程资料站(ddkk.com)
 * Copyright © 2015-2065 ddkk.com. All rights reserved.
*/
var fs = require("fs");
var data = fs.readFileSync('demo.txt');
console.log(data.toString());
console.log("程序执行结束!");
```

运行以上 Node.js 脚本，输出结果如下

```javascript
$ node main.js 
DDKK.COM 弟弟快看，程序员编程资料站，教程 
DDKK.COM 弟弟快看，程序员编程资料站官网 : https://ddkk.com
程序执行结束!
```

## 异步 IO 模式

#### main.js

```javascript
/*
 * filename: main.js
 * author: DDKK.COM 弟弟快看，程序员编程资料站(ddkk.com)
 * Copyright © 2015-2065 ddkk.com. All rights reserved.
*/
var fs = require("fs");
fs.readFile('demo.txt', function (err, data) {
    if (err) return console.error(err);
    console.log(data.toString());
});
console.log("程序执行结束!");
```

运行以上 Node.js 脚本，输出结果如下

```javascript
$ node main.js
程序执行结束!
DDKK.COM 弟弟快看，程序员编程资料站，教程 
DDKK.COM 弟弟快看，程序员编程资料站官网 : https://ddkk.com
```

我们可以从范例中了解到阻塞和非阻塞调用的不同：

**1、** 阻塞模式要等到读取完数据后才执行完程序；

**2、** 非阻塞模式不需要等待文件读取完，这样就可以在读取文件时同时执行接下来的代码，大大提高了程序的性能；

阻塞是按顺序执行的，而非阻塞是不需要按顺序的

如果需要处理回调函数的参数，我们就需要写在回调函数内
