# 25、Netty 源码解析 - Websocket实例
- 来源：https://ddkk.com/zhuanlan/server/netty/1/25.html
- 分类：服务器框架
- 分组：教程目录
## 一、实例要求

1、Http协议是无状态的，浏览器和服务器间的请求响应一次，下一次会重新创建连接

2、要求：实现基于Websocket的长连接的全双工的交互

3、改变Http协议多次请求的约束，实现长连接，服务器可以发送消息给浏览器

4、客户端浏览器和服务器端会相互感知，比如服务器关闭了，浏览器会感知，同样浏览器关闭了，服务器会感知。

## 二、代码演示

**服务器端代码：**

```java
public class MyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建两个线程组
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup(); // 8个NioEventLoop
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .handler(new LoggingHandler(LogLevel.INFO)) // 在 bossGroup 增加一个日志处理器
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 因为基于http协议，使用http的编码和解码器
                            pipeline.addLast(new HttpServerCodec());
                            // 是以块方式写，添加 ChunkedWriteHandler
                            pipeline.addLast(new ChunkedWriteHandler());
                            /**
                             * 说明
                             * 1. http数据在传输过程中是分段的，HttpObjectAggregator 就是将多个段进行聚合
                             * 2. 这就是为什么，当浏览器发送大量数据时，就会发出多次http请求
                             */
                            pipeline.addLast(new HttpObjectAggregator(8192));
                            /**
                             * 说明
                             * 1. 对于 websocket，它的数据是以 帧（frame） 的形式传递的
                             * 2. 可以看到 WebsocketFrame 下面有六个子类
                             * 3. 浏览器请求时，ws://localhost:7000/hello 表示请求的uri
                             * 4. WebSocketServerProtocolHandler 核心功能是将 http 协议升级为 ws 协议，保持长连接
                             * 5. 是通过一个 状态码 101
                             */
                            pipeline.addLast(new WebSocketServerProtocolHandler("/hello"));
                            // 自定义的 handler，处理业务逻辑
                            pipeline.addLast(new MyTextWebsocketFrameHandler());
                        }
                    });
            // 启动服务器
            ChannelFuture future = bootstrap.bind(7000).sync();
            future.channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

```java
// TextWebSocketFrame 类型，表示一个文本帧（frame）
public class MyTextWebsocketFrameHandler extends SimpleChannelInboundHandler<TextWebSocketFrame> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, TextWebSocketFrame msg) throws Exception {
        System.out.println("服务器收到消息 " + msg.text());
        TextWebSocketFrame textWebSocketFrame = new TextWebSocketFrame("服务器时间" + LocalDateTime.now() + " " + msg.text());
        ctx.channel().writeAndFlush(textWebSocketFrame);
    }
    // 当web客户端连接后，触发方法
    @Override
    public void handlerAdded(ChannelHandlerContext ctx) throws Exception {
        // id 表示唯一的值，LongText 是唯一的，ShortText 不是唯一的
        System.out.println("handlerAdded 被调用" + ctx.channel().id().asLongText());
        System.out.println("handlerAdded 被调用" + ctx.channel().id().asShortText());
    }
    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) throws Exception {
        System.out.println("handlerRemoved 被调用" + ctx.channel().id().asLongText());
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        System.out.println("异常发生 " + cause.getMessage());
        ctx.close(); // 关闭连接
    }
}
```

**客户端代码：**

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
    <script>
        var socket;
        // 判断当前浏览器是否支持webSocket
        if(window.WebSocket){
            // go on
            socket = new WebSocket("ws://localhost:7000/hello");
            // 相当于channelRead0，ev 可以收到服务器端会送的消息
            socket.onmessage = function (ev) {
                var rt = document.getElementById("responseText");
                rt.value = rt.value + "\n" + ev.data;
            }
            // 相当于连接开启（感知到连接开启）
            socket.onopen = function (ev) {
                var rt = document.getElementById("responseText");
                rt.value = "连接开启了...";
            }
            // 相当于连接关闭（感知到连接关闭）
            socket.onclose = function (ev) {
                var rt = document.getElementById("responseText");
                rt.value = rt.value + "\n连接关闭了";
            }
        }else {
            alert("当前浏览器不支持websocket");
        }
        // 发送消息到服务器
        function send(message) {
            if(!window.socket){ // 先判断socket是否创建好
                return;
            }
            if(socket.readyState == WebSocket.OPEN){
                // 通过socket发送消息
                socket.send(message);
            }else{
                alert("连接未开启");
            }
        }
    </script>
    <form onsubmit="return false">
        <textarea name="message" style="height: 300px;width: 300px"></textarea>
        <input type="button" value="发送消息" onclick="send(this.form.message.value)"/>
        <textarea id="responseText" style="height: 300px;width: 300px"></textarea>
        <input type="button" value="清空内容" onclick="document.getElementById('responseText').value=''"/>
    </form>
</body>
</html>
```

## 三、最终效果
