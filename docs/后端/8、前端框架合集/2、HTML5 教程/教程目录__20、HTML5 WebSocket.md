# 20、HTML5 WebSocket
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/20.html
- 分类：前端框架
- 分组：教程目录
HTML5 WebSocket 提供了一种在单个 TCP 连接上进行全双工通讯的协议

HTML5 WebSocket API 的实现中，浏览器和服务器只需要做一个握手的动作，然后，浏览器和服务器之间就形成了一条快速通道，两者之间就直接可以数据互相传送

浏览器通过 JavaScript 向服务器发出建立 WebSocket 连接的请求，连接建立以后，客户端和服务器端就可以通过 TCP 连接直接交换数据

当获取Web Socket 连接后，可以通过 **send()** 方法来向服务器发送数据，并通过 **onmessage** 事件来接收服务器返回的数据

下面的代码创建了一个 WebSocket 对象

```html
var ws = new WebSocket(url, [protocol] );
```

new WebSocket() 第一个参数 url, 指定连接的 URL

第二个参数 protocol 是可选的，指定了可接受的子协议

## HTML5 WebSocket 属性

下表列出了 WebSocket 对象的属性

其中：ws 是 WebSocket 的一个对象

属性
描述

ws.readyState
只读属性 readyState 表示连接状态，可以是以下值
0 - 表示连接尚未建立
1 - 表示连接已建立，可以进行通信
2 - 表示连接正在进行关闭
3 - 表示连接已经关闭或者连接不能打开

ws.bufferedAmount
只读属性 bufferedAmount 表示已被 send() 放入正在队列中等待传输，但是还没有发出的 UTF-8 文本字节数

## WebSocket 事件

下表列出了 WebSocket 对象的相关事件

其中：ws 是 WebSocket 的一个对象

事件
事件处理程序
描述

open
ws.onopen
连接建立时触发

message
ws.onmessage
客户端接收服务端数据时触发

error
ws.onerror
通信发生错误时触发

close
ws.onclose
连接关闭时触发

## WebSocket 方法

下表列出了 WebSocket 对象的相关方法

其中：ws 是 WebSocket 的一个对象

方法
描述

Socket.send()
使用连接发送数据

Socket.close()
关闭连接

## WebSocket 实例

WebSocket 协议本质上是一个基于 TCP 的协议

为了建立一个 WebSocket 连接，客户端浏览器首先要向服务器发起一个 HTTP 请求

这个请求和通常的 HTTP 请求不同，包含了一些附加头信息，其中附加头信息 "Upgrade: WebSocket" 表明这是一个申请协议升级的 HTTP 请求

服务器端解析这些附加的头信息然后产生应答信息返回给客户端

客户端和服务器端的 WebSocket 连接就建立起来了

双方就可以通过这个连接通道自由的传递信息，并且这个连接会持续存在直到客户端或者服务器端的某一方主动的关闭连接

### 客户端的 HTML 和 JavaScript

目前大部分浏览器支持 HTML5 WebSocket() 接口

我们可以在以下浏览器中尝试： Chrome, Mozilla, Opera 和 Safari

#### ws.html

```html
<!DOCTYPE HTML>
<meta charset="utf-8">
<script>
   function WebSocketTest()
   {
      if ("WebSocket" in window)
      {
         alert("您的浏览器支持 WebSocket!");
         // 打开一个 web socket
         var ws = new WebSocket("ws://localhost:9998/echo");
         ws.onopen = function()
         {
            // Web Socket 已连接上，使用 send() 方法发送数据
            ws.send("发送数据");
            alert("数据发送中...");
         };
         ws.onmessage = function (evt) 
         { 
            var received_msg = evt.data;
            alert("数据已接收...");
         };
         ws.onclose = function()
         { 
            // 关闭 websocket
            alert("连接已关闭..."); 
         };
      }
      else
      {
         // 浏览器不支持 WebSocket
         alert("您的浏览器不支持 WebSocket!");
      }
}
</script>
<div id="sse">
   <a href="javascript:WebSocketTest()">运行 WebSocket</a>
</div>
```

## 安装 pywebsocket

在执行以上程序前，我们需要创建一个支持 WebSocket 的服务

可从[pywebsocket](https://github.com/google/pywebsocket) 下载 mod_pywebsocket ,或者使用 git 命令下载

```html
git clone https://github.com/google/pywebsocket.git
```

mod_pywebsocket 需要 python 环境支持

mod_pywebsocket 是一个 Apache HTTP 的 Web Socket扩展，安装步骤如下：

**1、** 解压下载的文件；

**2、** 进入**pywebsocket**目录；

**3、** 执行命令：

`$` python setup.py build `$` sudo python setup.py install
**4、** 查看文档说明；

pydoc mod_pywebsocket

### 开启服务

在 **pywebsocket/mod_pywebsocket** 目录下执行以下命令

```html
$ sudo python standalone.py -p 9998 -w ../example/
```

以上命令会开启一个端口号为 9998 的服务，使用 -w 来设置处理程序 echo_wsh.py 所在的目录。

现在我们可以在 Chrome 浏览器打开前面创建的 ws.html 文件

如果浏览器支持 WebSocket(), 点击"运行 WebSocket"
