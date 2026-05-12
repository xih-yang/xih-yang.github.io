# 16、Netty学习 - 自定义解码器、编码器、编解码器
- 来源：https://ddkk.com/zhuanlan/server/netty/5/16.html
- 分类：服务器框架
- 分组：教程目录
我们今天继续来分析 Netty 的编解码器，这次我们要自己动手实现**自定义的编码器、解码器和编解码器**。

## 自定义基于换行的解码器

### LineBasedFrameDecoder 类

LineBasedFrameDecoder 类是基于换行的，意味着只要在接收数据时遇到以换行符`\n`或者回车换行符`\r\n`结尾时，就表明数据已经接收完成可以被处理了。

LineBasedFrameDecoder 类继承自 ByteToMessageDecoder，并重写了 `decode`方法。

```java
public class LineBasedFrameDecoder extends ByteToMessageDecoder {
    /** 帧的最大长度限制  */
    private final int maxLength;
    /** 帧超长时是否抛出异常 */
    private final boolean failFast;
    private final boolean stripDelimiter;
    /** 如果超出长度则为True，表明需要丢弃输入的数据  */
    private boolean discarding;
    private int discardedBytes;
    /** 最后扫描的位置 */
    private int offset;
    public LineBasedFrameDecoder(final int maxLength) {
        this(maxLength, true, false);
    }
    public LineBasedFrameDecoder(final int maxLength, final boolean stripDelimiter, final boolean failFast) {
        this.maxLength = maxLength;
        this.failFast = failFast;
        this.stripDelimiter = stripDelimiter;
    }
    @Override
    protected final void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        Object decoded = decode(ctx, in);
        if (decoded != null) {
            out.add(decoded);
        }
    }
    protected Object decode(ChannelHandlerContext ctx, ByteBuf buffer) throws Exception {
        final int eol = findEndOfLine(buffer);
        if (!discarding) {
            if (eol >= 0) {
                final ByteBuf frame;
                final int length = eol - buffer.readerIndex();
                final int delimLength = buffer.getByte(eol) == '\r'? 2 : 1;
                if (length > maxLength) {
                    buffer.readerIndex(eol + delimLength);
                    fail(ctx, length);
                    return null;
                }
                if (stripDelimiter) {
                    frame = buffer.readRetainedSlice(length);
                    buffer.skipBytes(delimLength);
                } else {
                    frame = buffer.readRetainedSlice(length + delimLength);
                }
                return frame;
            } else {
                final int length = buffer.readableBytes();
                if (length > maxLength) {
                    discardedBytes = length;
                    buffer.readerIndex(buffer.writerIndex());
                    discarding = true;
                    offset = 0;
                    if (failFast) {
                        fail(ctx, "over " + discardedBytes);
                    }
                }
                return null;
            }
        } else {
            if (eol >= 0) {
                final int length = discardedBytes + eol - buffer.readerIndex();
                final int delimLength = buffer.getByte(eol) == '\r'? 2 : 1;
                buffer.readerIndex(eol + delimLength);
                discardedBytes = 0;
                discarding = false;
                if (!failFast) {
                    fail(ctx, length);
                }
            } else {
                discardedBytes += buffer.readableBytes();
                buffer.readerIndex(buffer.writerIndex());
                // 跳过缓冲区中的所有内容，需要再次将offset 设置为0
                offset = 0;
            }
            return null;
        }
    }
    private void fail(final ChannelHandlerContext ctx, int length) {
        fail(ctx, String.valueOf(length));
    }
    private void fail(final ChannelHandlerContext ctx, String length) {
        ctx.fireExceptionCaught(
                new TooLongFrameException(
                        "frame length (" + length + ") exceeds the allowed maximum (" + maxLength + ')'));
    }
    /**
     * 返回找到的行尾缓冲区的索引
     * 如果在缓冲区中未找到行尾，则返回 -1
     */
    private int findEndOfLine(final ByteBuf buffer) {
        int totalLength = buffer.readableBytes();
        int i = buffer.forEachByte(buffer.readerIndex() + offset, totalLength - offset, ByteProcessor.FIND_LF);
        if (i >= 0) {
            offset = 0;
            // 判断是否是回车符
            if (i > 0 && buffer.getByte(i - 1) == '\r') {
                i--;
            }
        } else {
            offset = totalLength;
        }
        return i;
    }
}
```

从上述代码可以看出，`LineBasedFrameDecoder`是通过查找回车换行符来找到数据结束的标志的。

### 定义解码器

定义了解码器`MyLineBasedFrameDecoder`，该解码器继承自`LineBasedFrameDecoder`，因此可以使用`LineBasedFrameDecoder`上的所有功能。

代码如下：

```java
public class MyLineBasedFrameDecoder extends LineBasedFrameDecoder {
    private final static int MAX_LENGTH = 1024; // 帧的最大长度
    public MyLineBasedFrameDecoder() {
        super(MAX_LENGTH);
    }
}
```

在上述代码中，通过`MAX_LENGTH`常量，来限制解码器帧的大小。超过该常量值的限制的话，则会抛出`TooLongFrameException`异常。

### 定义 ChannelHandler

ChannelHandler 定义如下：

```java
public class MyLineBasedFrameDecoderServerHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        // 接收msg消息，此处已经无需解码了
        System.out.println("Client -> Server: " + msg);
    }
}
```

`MyLineBasedFrameDecoderServerHandler`业务非常简单，把收到的消息打印出来即可。

### 定义 ChannelInitializer

定义一个 ChannelInitializer 用于容纳解码器 MyLineBasedFrameDecoder和 MyLineBasedFrameDecoderServerHandler，代码如下：

```java
public class MyLineBasedFrameDecoderChannelInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel channel) {
        // 基于换行符号
        channel.pipeline().addLast(new MyLineBasedFrameDecoder());
        // 解码转String
        channel.pipeline().addLast(new StringDecoder());
        // 自定义ChannelHandler
        channel.pipeline().addLast(new MyLineBasedFrameDecoderServerHandler());
    }
}
```

注意添加到`ChannelPipeline`的`ChannelHandler`的**顺序**，MyLineBasedFrameDecoder 在前，MyLineBasedFrameDecoderServerHandler 在后，意味着数据先经过`MyLineBasedFrameDecoder`解码，然后再交给`MyLineBasedFrameDecoderServerHandler`处理。

`StringDecoder`实现将数据转换为字符串。

### 编写服务器

定义服务器 `MyLineBasedFrameDecoderServer`代码如下：

```java
public class MyLineBasedFrameDecoderServer {
    public static int DEFAULT_PORT = 8023;
    public static void main(String[] args) throws Exception {
        int port = DEFAULT_PORT;
        // 多线程事件循环器
        EventLoopGroup bossGroup = new NioEventLoopGroup(1); // boss
        EventLoopGroup workerGroup = new NioEventLoopGroup(); // worker
        try {
            // 启动NIO服务的引导程序类
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup) // 设置EventLoopGroup
                    .channel(NioServerSocketChannel.class) // 指明新的Channel的类型
                    .childHandler(new MyLineBasedFrameDecoderChannelInitializer()) // 指定ChannelHandler
                    .option(ChannelOption.SO_BACKLOG, 128) // 设置的ServerChannel的一些选项
                    .childOption(ChannelOption.SO_KEEPALIVE, true); // 设置的ServerChannel的子Channel的选项
            // 绑定端口，开始接收进来的连接
            ChannelFuture f = b.bind(port).sync();
            System.out.println("MyLineBasedFrameDecoderServer已启动，端口：" + port);
            // 等待服务器 socket 关闭 。
            // 在这个例子中，这不会发生，但你可以优雅地关闭你的服务器。
            f.channel().closeFuture().sync();
        } finally {
            // 优雅的关闭
            workerGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
        }
    }
}
```

MyLineBasedFrameDecoderServer 中唯一需要注意的是，在 ServerBootstrap 中指定`MyLineBasedFrameDecoderChannelInitializer`，这样服务器就能应用咱们自定义的编码器和`ChannelHandler`了。

### 编写客户端

为了测试服务器，编写了一个简单的 TCP 客户端，代码如下：

```java
public class TcpClient {
    public static void main(String[] args) throws IOException {
        Socket socket = null;
        OutputStream out = null;
        try {
            socket = new Socket("localhost", 8023);
            out = socket.getOutputStream();
            // 请求服务器  
            String lines = "床前明月光\r\n疑是地上霜\r\n举头望明月\r\n低头思故乡\r\n";
            byte[] outputBytes = lines.getBytes("UTF-8");
            out.write(outputBytes);
            out.flush();
        } finally {
            // 关闭连接  
            out.close();
            socket.close();
        }
    }
}
```

上述客户端在启动后会发送一段文本，而后关闭连接。该文本每句用回车换行符`\r\n`结尾，这样服务器就能一句一句地解析了。

### 测试

先启动服务器，观察控制台，可以看到如下输出的内容：

```java
MyLineBasedFrameDecoderServer已启动，端口：8023
```

然后启动客户端。启动完成之后，再次观察服务器的控制台，可以看到如下输出内容：

```java
MyLineBasedFrameDecoderServer已启动，端口：8023
Client -> Server: 床前明月光
Client -> Server: 疑是地上霜
Client -> Server: 举头望明月
Client -> Server: 低头思故乡
```

上述的输出内容说明，`MyLineBasedFrameDecoderServerHandler`接收到了 4 条数据。那么为啥客户端发送了 1 条数据，到这里就变成了 4 条了呢？这是因为在前面介绍的`MyLineBasedFrameDecoderChannelInitializer`中，`MyLineBasedFrameDecoder`先被添加到`ChannelPipeline`，然后才添加到`MyLineBasedFrameDecoderServerHandler`,意味着数据先经过解码，再交给`MyLineBasedFrameDecoderServerHandler`处理，而在数据解码过程中，`MyLineBasedFrameDecoderServerHandler`是按照换行解码的，而客户端所发送的数据里面又包含了 4 个回车换行符，因此，数据被解码为了 4 条。

## 自定义编码器

### 定义消息通信协议

> 消息通信协议是连接客户端和服务器的密语，只有熟知双方的通信协议，客户端和服务器才能正常识别消息的内容。常见的消息通信协议有 HTTP、MQTT、XMPP、STOMP、AMQP和 RTMP等。

下图展示了消息通信协议的内容格式：

类型
名称
字节序列
取值范围
备注

消息头
msgType
0
0x00-0xff
消息类型

消息头
len
1-4
0-2147483647
消息体长度

消息体
body
变长
0-
消息体

从上述协议中可以看出，消息主要是由消息头和消息体组成，并说明如下：

- msgType 表示消息的类型。在本节示例中，请求用EMGW_LOGIN_REQ(0x00)，响应用EMGW_LOGIN_RES(0x01)表示。
- len 表示消息体的长度。
- body 表示消息体。

定义了如下`MsgType`枚举类型来表示消息类型：

```java
public enum MsgType {
    EMGW_LOGIN_REQ((byte) 0x00),
    EMGW_LOGIN_RES((byte) 0x01);
    private byte value;
    public byte getValue() {
        return value;
    }
    private MsgType(byte value) {
        this.value = value;
    }
}
```

消息头类 `MsgHeader`定义如下：

```java
public class MsgHeader {
    private byte msgType; // 消息类型
    private int len; // 长度
    public MsgHeader() {
    }
    public MsgHeader(byte msgType, int len) {
        this.msgType = msgType;
        this.len = len;
    }
    public byte getMsgType() {
        return msgType;
    }
    public void setMsgType(byte msgType) {
        this.msgType = msgType;
    }
    public int getLen() {
        return len;
    }
    public void setLen(int len) {
        this.len = len;
    }
}
```

消息类Msg 定义如下：

```java
public class Msg {
    private MsgHeader msgHeader = new MsgHeader();
    private String body;
    public MsgHeader getMsgHeader() {
        return msgHeader;
    }
    public void setMsgHeader(MsgHeader msgHeader) {
        this.msgHeader = msgHeader;
    }
    public String getBody() {
        return body;
    }
    public void setBody(String body) {
        this.body = body;
    }
}
```

### 定义编码器

```java
public class MyEncoder extends MessageToByteEncoder<Msg> {
    @Override
    protected void encode(ChannelHandlerContext ctx, Msg msg, ByteBuf out) throws Exception {
        if (msg == null | msg.getMsgHeader() == null) {
            throw new Exception("The encode message is null");
        }
        // 获取消息头
        MsgHeader header = msg.getMsgHeader();
        // 获取消息体
        String body = msg.getBody();
        byte[] bodyBytes = body.getBytes(Charset.forName("utf-8"));
        // 计算消息体的长度
        int bodySize = bodyBytes.length;
        System.out.printf("MyEncoder header: %s, body: %s", header.getMsgType(), body);
        out.writeByte(MsgType.EMGW_LOGIN_RES.getValue());
        out.writeInt(bodySize);
        out.writeBytes(bodyBytes);
    }
}
```

`MyEncoder`会将 Msg 消息转为 ByteBuf 类型。

### 定义解码器

```java
public class MyDecoder extends LengthFieldBasedFrameDecoder {
    private static final int MAX_FRAME_LENGTH = 1024 * 1024;
    private static final int LENGTH_FIELD_LENGTH = 4;
    private static final int LENGTH_FIELD_OFFSET = 1;
    private static final int LENGTH_ADJUSTMENT = 0;
    private static final int INITIAL_BYTES_TO_STRIP = 0;
    private static final int HEADER_SIZE = 5;
    private byte msgType; // 消息类型
    private int len; // 长度
    public MyDecoder() {
        super(MAX_FRAME_LENGTH,
                LENGTH_FIELD_OFFSET, LENGTH_FIELD_LENGTH,
                LENGTH_ADJUSTMENT, INITIAL_BYTES_TO_STRIP);
    }
    @Override
    protected Msg decode(ChannelHandlerContext ctx, ByteBuf in2) throws Exception {
        ByteBuf in = (ByteBuf) super.decode(ctx, in2);
        if (in == null) {
            return null;
        }
        // 校验头长度
        if (in.readableBytes() < HEADER_SIZE) {
            return null;
        }
        msgType = in.readByte();
        len = in.readInt();
        // 校验消息体长度
        if (in.readableBytes() < len) {
            return null;
        }
        ByteBuf buf = in.readBytes(len);
        byte[] req = new byte[buf.readableBytes()];
        buf.readBytes(req);
        String body = new String(req, "UTF-8");
        // ByteBuf转为Msg类型
        Msg msg = new Msg();
        MsgHeader msgHeader = new MsgHeader(msgType, len);
        msg.setBody(body);
        msg.setMsgHeader(msgHeader);
        return msg;
    }
}
```

`MyDecoder`集成自 Netty 内嵌的解码器`LengthFieldBasedFrameDecoder`。`LengthFieldBasedFrameDecoder`是一种基于灵活长度的解码器。在数据包中，加了一个长度字段，保存上层包的长度。解码时，会按照这个长度，进行上层 ByteBuf 应用包的提取。其中，初始化`LengthFieldBasedFrameDecoder`时，需要指定以下参数：

- maxFrameLength：发送数据包最大的长度。
- lengthFieldOffset：长度域偏移量，指的是长度域位于整个数据包字节数组中的下标。
- lengthFieldLength：长度域的字节长度。
- lengthAdjustment：长度域的偏移量矫正。
- initialBytesToStrip：丢弃的初始字节数。丢弃处于有效数据前面的字节数量。

### 定义服务器 ChannelHandler

```java
public class MyServerHandler extends SimpleChannelInboundHandler<Object> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object obj) throws Exception {
        Channel incoming = ctx.channel();
        if (obj instanceof Msg) {
            Msg msg = (Msg) obj;
            System.out.println("Client->Server:" + incoming.remoteAddress() + msg.getBody());
            incoming.write(obj);
        }
    }
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.flush();
    }
}
```

`MyServerHandler`逻辑比较简单，只是把收到的消息内容打印出来。

### 定义客户端 ChannelHandler

```java
public class MyClientHandler extends SimpleChannelInboundHandler<Object> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object obj) throws Exception {
        Channel incoming = ctx.channel();
        if (obj instanceof Msg) {
            Msg msg = (Msg) obj;
            System.out.println("Server->Client:" + incoming.remoteAddress() + msg.getBody());
        } else {
            System.out.println("Server->Client:" + incoming.remoteAddress() + obj.toString());
        }
    }
}
```

`MyClientHandler`逻辑比较简单，只是把收到的消息内容打印出来。

### 定义服务器的主程序

```java
public class MyServer {
    private int port;
    public MyServer(int port) {
        this.port = port;
    }
    public void run() throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup).channel(NioServerSocketChannel.class)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        public void initChannel(SocketChannel ch) throws Exception {
                            ch.pipeline().addLast("decoder", new MyDecoder());
                            ch.pipeline().addLast("encoder", new MyEncoder());
                            ch.pipeline().addLast(new MyServerHandler());
                        }
                    }).option(ChannelOption.SO_BACKLOG, 128).childOption(ChannelOption.SO_KEEPALIVE, true);
            ChannelFuture f = b.bind(port).sync();
            System.out.println("Server start listen at " + port);
            f.channel().closeFuture().sync();
        } finally {
            workerGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
        }
    }
    public static void main(String[] args) throws Exception {
        int port;
        if (args.length > 0) {
            port = Integer.parseInt(args[0]);
        } else {
            port = 8082;
        }
        new MyServer(port).run();
    }
}
```

注意添加到`ChannelPipeline`的`ChannelHandler`的顺序，`MyDecoder`在前，`MyEncoder`在后，业务处理的`MyServerHandler`在最后。

### 定义客户端主程序

```java
public class MyClient {
    private String host;
    private int port;
    public MyClient(String host, int port) {
        this.host = host;
        this.port = port;
    }
    public void run() throws InterruptedException {
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            Bootstrap b = new Bootstrap();
            b.group(workerGroup);
            b.channel(NioSocketChannel.class);
            b.option(ChannelOption.SO_KEEPALIVE, true);
            b.handler(new ChannelInitializer<SocketChannel>() {
                @Override
                public void initChannel(SocketChannel ch) throws Exception {
                    ch.pipeline().addLast("decoder", new MyDecoder());
                    ch.pipeline().addLast("encoder", new MyEncoder());
                    ch.pipeline().addLast(new MyClientHandler());
                }
            });
            // 启动客户端
            ChannelFuture f = b.connect(host, port).sync();
            while (true) {
                // 发送消息给服务器
                Msg msg = new Msg();
                MsgHeader msgHeader = new MsgHeader();
                msgHeader.setMsgType(MsgType.EMGW_LOGIN_REQ.getValue());
                String body = "床前明月光，疑是地上霜。";
                byte[] bodyBytes = body.getBytes(Charset.forName("utf-8"));
                int bodySize = bodyBytes.length;
                msgHeader.setLen(bodySize);
                msg.setMsgHeader(msgHeader);
                msg.setBody(body);
                f.channel().writeAndFlush(msg);
                Thread.sleep(2000);
            }
        } finally {
            workerGroup.shutdownGracefully();
        }
    }
    public static void main(String[] args) throws InterruptedException {
        new MyClient("localhost", 8082).run();
    }
}
```

注意添加到`ChannelPipeline`的`ChannelHandler`的顺序，`MyDecoder`在前，`MyEncoder`在后，业务处理的`MyClientHandler`在最后。

上述的客户端程序，会每隔 2 秒给服务器发送一条消息。

### 测试

分别运行服务器和客户端程序。

客户端输出如下：

```java
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
```

服务端输出如下：

```java
Server start listen at 8082
Client->Server:/127.0.0.1:62927床前明月光，疑是地上霜。
MyEncoder header: 1, body: 床前明月光，疑是地上霜。Client->Server:/127.0.0.1:62927床前明月光，疑是地上霜。
MyEncoder header: 1, body: 床前明月光，疑是地上霜。Client->Server:/127.0.0.1:62927床前明月光，疑是地上霜。
MyEncoder header: 1, body: 床前明月光，疑是地上霜。Client->Server:/127.0.0.1:62927床前明月光，疑是地上霜。
MyEncoder header: 1, body: 床前明月光，疑是地上霜。Client->Server:/127.0.0.1:62927床前明月光，疑是地上霜。
MyEncoder header: 1, body: 床前明月光，疑是地上霜。Client->Server:/127.0.0.1:62927床前明月光，疑是地上霜。
```

## 自定义编解码器

> 前面我们实现了编码器 MyEncoder 和 解码器 MyDecoder。这些代码无须做任何改动。

### 自定义编解码器

使用`CombinedChannelDuplexHandler` 类对编码器 `MyEncoder` 和 解码器 `MyDecoder`进行组合。代码如下：

```java
public class MyCodec extends CombinedChannelDuplexHandler<MyDecoder, MyEncoder> {
    public MyCodec() {
        super(new MyDecoder(), new MyEncoder());
    }
}
```

### 使用编解码器

分别修改 MyServer 和 MyClient 类，添加编解码器，修改代码如下：

```java
// 添加编解码器
ch.pipeline().addLast("codec", new MyCodec());
```

上述代码将原来的 `MyEncoder` 和 `MyDecoder`从`ChannelPipeline`中剔除掉了，取而代之是`MyEncoder`。

### 测试

分别运行服务器和客户端。

客户端输出如下：

```java
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
MyEncoder header: 0, body: 床前明月光，疑是地上霜。Server->Client:localhost/127.0.0.1:8082床前明月光，疑是地上霜。
```

服务端输出如下：

```java
Server start listen at 8082
Client->Server:/127.0.0.1:56181床前明月光，疑是地上霜。
MyEncoder header: 1, body: 床前明月光，疑是地上霜。Client->Server:/127.0.0.1:56181床前明月光，疑是地上霜。
MyEncoder header: 1, body: 床前明月光，疑是地上霜。Client->Server:/127.0.0.1:56181床前明月光，疑是地上霜。
MyEncoder header: 1, body: 床前明月光，疑是地上霜。Client->Server:/127.0.0.1:56181床前明月光，疑是地上霜。
MyEncoder header: 1, body: 床前明月光，疑是地上霜。Client->Server:/127.0.0.1:56181床前明月光，疑是地上霜。
MyEncoder header: 1, body: 床前明月光，疑是地上霜。
```

## 总结

以上就是关于一些自定义的编码器、解码器、编解码器的示例应用，我们下节继续深入 Netty 源码。
