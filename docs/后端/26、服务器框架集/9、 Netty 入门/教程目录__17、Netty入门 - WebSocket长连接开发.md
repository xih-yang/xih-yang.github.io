# 17、Netty入门 - WebSocket长连接开发
- 来源：https://ddkk.com/zhuanlan/server/netty/2/17.html
- 分类：服务器框架
- 分组：教程目录
## 1.WebSocket基本介绍

WebSocket 是一种标准协议，用于在客户端和服务端之间进行双向数据传输。但它跟 HTTP 没什么关系，它是一种基于 TCP 的一种独立实现。

以前客户端想知道服务端的处理进度，要不停地使用 Ajax 进行轮询，让浏览器隔个几秒就向服务器发一次请求，这对服务器压力较高。另外一种轮询就是采用 long poll 的方式，这就跟打电话差不多，没收到消息就一直不挂电话，也就是说，客户端发起连接后，如果没消息，就一直不返回 Response 给客户端，连接阶段一直是阻塞的。

而WebSocket 解决了 HTTP 的这几个难题。首先，当服务器完成协议升级后（ HTTP -> WebSocket ），服务端可以主动推送信息给客户端，解决了轮询造成的同步延迟问题。由于 WebSocket 只需要一次 HTTP 握手，服务端就能一直与客户端保持通讯，直到关闭连接，这样就解决了服务器需要反复解析 HTTP 协议，减少了资源的开销。

随着新标准的推进，WebSocket 已经比较成熟了，并且各个浏览器对 WebSocket 的支持情况比较好。

使用WebSocket 的时候，前端使用是比较规范的，js 支持 ws 协议，感觉类似于一个轻度封装的 Socket 协议，只是以前需要自己维护 Socket 的连接，现在能够以比较标准的方法来进行。

## 2.Netty通过WebSocket编程实现服务器和客户端长链接

实例要求：

1、Http 协议是无状态的，浏览器和服务器间的请求响应一下，下一次会重新创建连接；

2、要求：实现基于 WebSocket 的长连接的全双工的交互；

3、改变 Http 协议多次请求的约束，实现长连接了，服务器可以发送消息给浏览器；

4、客户端浏览器和服务器端会相互感知，比如服务器关了，浏览器会感知，同样浏览器关了，服务器会感知；

代码实例如下。

服务器端代码：

```java
public class MyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建两个线程组
        NioEventLoopGroup bossGroup = new NioEventLoopGroup(1);
        NioEventLoopGroup workerGroup = new NioEventLoopGroup(8);
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .handler(new LoggingHandler(LogLevel.INFO)) // 在bossgroup增加一个日志处理器
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 因为基于 Http 协议，使用 http 的编码和解码器
                            pipeline.addLast(new HttpServerCodec());
                            // 是以块方式写，添加 ChunkedWrite 处理器
                            pipeline.addLast(new ChunkedWriteHandler());
                            /**
                             * 说明
                             * 1.因为 http 的数据在传输过程中是分段的，HttpObjectAggregator，可以将多个段聚合起来
                             * 2.这就是为什么当浏览器发送大量数据时，就会发出多次 http 请求
                             */
                            pipeline.addLast(new HttpObjectAggregator(8192));
                            /**
                             * 说明
                             * 1.对于websocket，它的数据是以帧的形式传递
                             * 2.可以看到 WebsocketFrame 下面有六个子类
                             * 3.浏览器请求时 ws://localhost:7000/xxx，表示请求的uri
                             * 4.WebSocketServerProtocolHandler 核心功能是将 http 协议升级为 ws 协议，保持长连接
                             * 5.是通过一个 状态码 101
                             */
                            pipeline.addLast(new WebSocketServerProtocolHandler("/hello"));
                            // 自定义的handler，处理业务逻辑
                            pipeline.addLast(new MyTextWebsocketFrameHandler());
                        }
                    });
            ChannelFuture channelFuture = serverBootstrap.bind(7000).sync();
            channelFuture.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
/**
 * 这里的 TextWebSocketFrame 类型，表示一个文本帧（frame）
 */
public class MyTextWebsocketFrameHandler extends SimpleChannelInboundHandler<TextWebSocketFrame> {
    // 当 web 客户端连接后，触发该方法
    @Override
    public void handlerAdded(ChannelHandlerContext ctx) throws Exception {
        // id 表示唯一的值，LongText 是唯一的，ShortText不是惟一得
        System.out.println("handlerAdded 被调用" + ctx.channel().id().asLongText());
        System.out.println("handlerAdded 被调用" + ctx.channel().id().asShortText());
    }
    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
        System.out.println("handlerRemoved 被调用" + ctx.channel().id().asLongText());
        System.out.println("handlerRemoved 被调用" + ctx.channel().id().asShortText());
    }
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, TextWebSocketFrame msg) throws Exception {
        System.out.println("服务器端收到消息 " + msg.text());
        // 回复消息
        ctx.channel().writeAndFlush(new TextWebSocketFrame("服务器时间 " + LocalDateTime.now() + " " + msg.text()));
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        System.out.println("异常发生 " + cause.getMessage());
        // 关闭连接
        ctx.close();
    }
}
```

客户端代码：

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<script type="text/javascript">
    var socket;
    // 判断当前浏览器是否支持 websocket
    if (window.WebSocket) {
        var socket = new WebSocket("ws://localhost:7000/hello");
        console.log(socket)
        // 相当于 channelRead0，ev 收到服务端端回送的消息
        socket.onmessage = function (ev) {
            var rt = document.getElementById('responseText');
            rt.value = rt.value + "\n" + ev.data;
        }
        // 连接开启
        socket.onopen = function (ev) {
            console.log('websocket open');
            var rt = document.getElementById('responseText');
            rt.value = "连接开启~";
        }
        // 连接关闭
        socket.onclose = function (ev) {
            var rt = document.getElementById('responseText');
            rt.value = rt.value + "\n" + "连接关闭~";
        }
    } else {
        alert("当前浏览器不支持 webSocket")
    }
    // 发送消息到服务器
    function send(msg) {
        // 判断socket是否创建好
        if (!window.socket) {
            console.log(msg)
            return;
        }
        if (socket.readyState == WebSocket.OPEN) {
            // 通过 socket 发送消息
            socket.send(msg);
        }else{
            alert("连接未开启");
        }
    }
</script>
<form onsubmit="return false">
    <textarea name="message" style="height: 300px; width: 300px"></textarea>
    <input type="button" value="发送消息" onclick="send(this.form.message.value)">
    <textarea id="responseText" style="height: 300px; width: 300px"></textarea>
    <input type="button" value="清空内容" onclick="document.getElementById('responseText').value=''">
</form>
</body>
</html>
```

测试结果：
