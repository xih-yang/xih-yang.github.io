# Websocket

### 1. WebSocket出现前

我们知道HTTP协议是**半双工通信**的，同一时刻数据只能单向流动，而且只能是客户端向服务器发起请求，服务器返回请求结果，服务器不能主动向服务端推送信息。如果我们需要与服务器进行持续的通信以保持双方信息的同步，就需要把不断地刷新页面，进行请求验证，这样就造成一定资源的浪费。

在WebSocket出现之前，想要持续的通讯，有以下几种解决方案：

**（1）短轮询**

短轮询通常采用`setInterval` 或者 `setTimeout` 来实现。每隔一段时间就发送一次ajax请求：

```javascript
setInterval(function() {
    $.get("/path/to/server", function(data, status) {
        console.log(data);
    });
}, 1000);
```

这样就基本实现了每隔一段时间进行一次轮询，但是也存在一定的问题。我们这里设置的请求的时间为，每隔一秒请求一次，如果网络情况不好，一秒钟时间数据还没返回回来，下一个请求就开始了，这就很容易导致数据的顺序错乱，所以可以使用下面的方法：

```javascript
function poll() {
    setTimeout(function() {
        $.get("/path/to/server", function(data, status) {
            console.log(data);
            // 发起下一次请求
            poll();
        });
    }, 1000);
}
```

这样设置的话，每次都会在上一次完成的情况下在进行新的请求。

**（2）长轮询**

上面的传统的轮询方式存在一个很大的问题，就是每次都会发送一个HTTP请求，然而并不是每次都能返回需要的数据，这无疑造成了资源的浪费，也给服务器带来了很大的负担。这时就可以使用长轮询的方式来解决这个问题。

在长轮询机制中，**当服务器收到客户端发来的请求后，不会直接进行响应，而是先将这个请求挂起，然后判断服务器端数据是否有更新。如果有更新，则进行响应；如果一直没有数据，则到达一定的时间限制(服务器端设置)才返回。 客户端在处理完服务器返回的信息后，再次发出请求，重新建立连接。**

长轮询和短轮询相比，明显是减少了很多不必要的HTTP请求，但是，长轮询在建立连接之后会挂起，等待服务端数据的更新，这样也会导致资源的浪费。

**（3）长连接（SSE）**

SSE是HTML5新增的功能，全称为Server-Sent Events，也就是服务器发送事件。通过 SSE ，客户端可以自动获取数据更新，而不用重复发送HTTP请求。一旦连接建立，“事件”便会自动被推送到客户端。

服务器端SSE通过事件流(Event Stream) 的格式产生并推送事件。客户端中，SSE借由 EventSource 对象实现。

EventSource 包含五个外部属性：`onerror`、 `onmessage`、`onopen`、`readyState`、`url`，以及两个内部属性：`reconnection time`与 `last event ID string`。在`onerror`属性中可以对错误捕获和处理，而 `onmessage` 则对应着服务器事件的接收和处理。另外也可以使用 `addEventListener` 方法来监听服务器发送事件，根据event字段区分处理。

```javascript
var eventSource = new EventSource("/path/to/server");
eventSource.onmessage = function (e) {
    console.log(e.event, e.data);
}
// 或者
eventSource.addEventListener("ping", function(e) {
    console.log(e.event, e.data);
}, false);
```

SEE的优势在于，它不需要建立或者保持大量客户端发送的请求，节约了资源，提高了应用的性能。但是它只支持单向数据通信，只能从服务端向客户端发送消息。

### 2. WebSocket 概述

WebSocket是HTML5提供的一种浏览器与服务器进行**全双工通讯**的网络技术，属于应用层协议。它基于TCP传输协议，并复用HTTP的握手通道。浏览器和服务器只需要完成一次握手，两者之间就直接可以创建持久性的连接， 并进行双向数据传输。

WebSocket 的出现就解决了半双工通信的弊端。它最大的特点是：**服务器可以向客户端主动推动消息，客户端也可以主动向服务器推送消息。**

***

**WebSocket原理**：客户端向 WebSocket 服务器通知（notify）一个带有所有接收者ID（recipients IDs）的事件（event），服务器接收后立即通知所有活跃的（active）客户端，只有ID在接收者ID序列中的客户端才会处理这个事件。

### 3. WebSocket 特点

* 支持双向通信，实时性更强
* 可以发送文本，也可以发送二进制数据‘’
* 建立在TCP协议之上，服务端的实现比较容易
* 数据格式比较轻量，性能开销小，通信高效
* 没有同源限制，客户端可以与任意服务器通信
* 协议标识符是ws（如果加密，则为wss），服务器网址就是 URL
* 与 HTTP 协议有着良好的兼容性。默认端口也是80和443，并且握手阶段采用 HTTP 协议，因此握手时不容易屏蔽，能通过各种 HTTP 代理服务器。

### 4. Websocket的使用

在客户端中：

```javascript
// 在index.html中直接写WebSocket，设置服务端的端口号为 9999
let ws = new WebSocket('ws://localhost:9999');
// 在客户端与服务端建立连接后触发
ws.onopen = function() {
    console.log("Connection open."); 
    ws.send('hello');
};
// 在服务端给客户端发来消息的时候触发
ws.onmessage = function(res) {
    console.log(res);       // 打印的是MessageEvent对象
    console.log(res.data);  // 打印的是收到的消息
};
// 在客户端与服务端建立关闭后触发
ws.onclose = function(evt) {
  console.log("Connection closed.");
}; 
```

这里先不管服务端的实现了，以后学到后端的知识再补充……

### 5. WebSocket的API

#### 5.1 WebSocket构造函数

WebSocket对象作为一个构造函数，用于新建WebSocket实例：

```javascript
let ws = new WebSocket('ws://localhost:9999');
```

执行上面的语句之后，就会与服务器进行连接。

#### 5.2 webSocket.readyState

`readyState`属性会返回实例对象的当前状态，其值共有四种：

* **CONNECTING**：值为0，表示正在连接。
* **OPEN**：值为1，表示连接成功，可以通信了。
* **CLOSING**：值为2，表示连接正在关闭。
* **CLOSED**：值为3，表示连接已经关闭，或者打开连接失败。

```javascript
switch (ws.readyState) {
  case WebSocket.CONNECTING:
    // do something
    break;
  case WebSocket.OPEN:
    // do something
    break;
  case WebSocket.CLOSING:
    // do something
    break;
  case WebSocket.CLOSED:
    // do something
    break;
  default:
    // this never happens
    break;
}
```

#### 5.3 webSocket.onopen

实例对象的`onopen`属性用于指定连接成功之后的回调函数：

```javascript
ws.onopen = function() {
    console.log("Connection open."); 
    ws.send('hello');
};
```

如果需要指定多个回调函数，可以使用`addEventListener`方法：

```javascript
ws.addEventListener('open', function (event) {
    console.log("Connection open."); 
    ws.send('hello');
});
```

#### 5.4 webSocket.onclose

实例对象的onclose属性用于指定关闭连接之后的回调函数：

```javascript
// 在客户端与服务端建立关闭后触发
ws.onclose = function(evt) {
  console.log("Connection closed.");
}; 
```

如果需要指定多个回调函数，可以使用`addEventListener`方法：

```javascript
ws.addEventListener("close", function(event) {
  console.log("Connection closed.");
});
```

#### 5.5 webSocket.onmessage

实例对象的`onmessage`属性用于指定接收到服务器数据后的回调函数：

```javascript
ws.onmessage = function(res) {
    console.log(res);       // 打印的是MessageEvent对象
    console.log(res.data);  // 打印的是收到的消息
};
```

如果需要指定多个回调函数，可以使用`addEventListener`方法：

```javascript
ws.addEventListener("message", function(res) {
   console.log(res);       // 打印的是MessageEvent对象
   console.log(res.data);  // 打印的是收到的消息
});
```

注意，服务器数据可能是二进制数据，也可能是文本，我们需要对数据进行类型的判断：

```javascript
ws.onmessage = function(event){
  if(typeof event.data === String) {
    console.log("文本");
  }
  if(event.data instanceof ArrayBuffer){
    var buffer = event.data;
    console.log("二进制");
  }
}
```

#### 5.5 webSocket.send()

实例对象的`send()`方法用于向服务器发送数据：

```javascript
ws.send('hello');
```

#### 5.7 webSocket.bufferedAmount

实例对象的`bufferedAmount`属性，表示还有多少字节的二进制数据没有发送出去。它可以用来判断发送是否结束：

```javascript
var data = new ArrayBuffer(10000000);
socket.send(data);
if (socket.bufferedAmount === 0) {
  // 发送完毕
} else {
  // 未发送完
}
```

#### 5.8 webSocket.onerror

实例对象的`onerror`属性用于指定报错时的回调函数：

```javascript
socket.onerror = function(event) {
  // handle error event
};
```

如果需要指定多个回调函数，可以使用`addEventListener`方法：

```javascript
socket.addEventListener("error", function(event) {
  // error event
});
```

上面总共提到了四种及时通信的协议，从性能的角度来看：

**WebSocket > 长连接（SEE） > 长轮询 > 短轮询**

但是，我们如果考虑浏览器的兼容性问题，顺序就恰恰相反了：

**短轮询 > 长轮询 > 长连接（SEE） > WebSocket**

所以，还是要根据具体的使用场景来判断使用哪种方式。


> 更新: 2023-12-06 21:49:12  
> 原文: <https://www.yuque.com/cuggz/feplus/dyt3c8>