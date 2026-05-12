# 19、Netty入门 - Netty入站与出站机制
- 来源：https://ddkk.com/zhuanlan/server/netty/2/19.html
- 分类：服务器框架
- 分组：教程目录
## 1.基本说明

1、netty 的组件设计：Netty的主要组件有 Channel、EventLoop、ChannelFuture、ChannelHandler、ChannelPipe 等；

2、ChannelHandler 充当了处理入站和出站数据的应用程序逻辑的容器。例如，实现 ChannelInboundHandler 接口（或 ChannelInboundHandlerAdapter），你就可以接收入站事件和数据，这些数据会被业务逻辑处理。当要给客户端发送响应时，也可以从 ChannelInboundHandler 冲刷数据。业务逻辑通常卸载一个或者多个 ChannelInboundHandler 中。ChannelOutboundHandler 原理一样，只不过它是用来处理出站数据的。

3、ChannelPipeline 提供了 ChannelHandler 链的容器。以客户端应用程序为例，如果事件的运动方向是从客户端到服务端的，那么我们称这些事件为出站的，即客户端发送服务端的数据会通过 pipeline 中的一系列 ChannelOutboundHandler，并被这些 Handler 处理，反之则称为入站的

## 2.编码解码器

1、当 Netty 发送或者接收一个消息的时候，就将会发生一次数据转换。入站消息会被解码：从字节转换为另一种格式（比如 java 对象）；如果是出站消息，它会被编码成字节。

2、Netty 提供一系列实用的编解码器，他们都实现了 ChannelInboundHandler 或者 ChannelOutboundHandler 接口。在这些类中，channelRead 方法已经被重写了。已入站为例，对于每个从入站 Channel 读取的消息，这个方法会被调用。随后，它将调用由解码器所提供的 decode() 方法进行解码，并将已经解码的字节转发给 ChannelPipeline 中的下一个 ChannelInboundHandler。

## 2.1解码器 - ByteToMessageDecoder

1、关系继承图

2、由于不可能知道远程节点是否会一次性发送一个完成的信息，tcp有可能出现粘包拆包的问题，这个类会对入站数据进行缓冲，直到它准备好被处理。

3、关于ByteToMessageDecoder实例分析

```java
public class ToIntegerDecoder extends ByteToMessageDecoder {
    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        if(in.readableBytes() >=4){
            out.add(in.readInt());
        }
    }
}
```

说明：

1、这个例子，每次入站从 ByteBuf 读取4字节，将其解码为一个 int，然后将它添加到下一个 List 中。当没有更多元素可以被添加到该 List 中，它的内容将会发送给下一个 ChannelInboundHandler。int 在被添加到 List 中时，会被自动装箱为 Integer。在调用 readInt() 方法前必须验证所输入的 ByteBuf 是否具有足够的数据。

2、decode执行分析图。

## 2.2Netty的handler链的调用机制

要求：

1、使用自定义的编码器和解码器来说明 Netty 的 handler 调用机制。

### 2.2.1客户端发送给服务端

**服务端代码**

```java
public class MyServer {
    public static void main(String[] args) throws InterruptedException {
        NioEventLoopGroup bossGroup = new NioEventLoopGroup(1);
        NioEventLoopGroup workerGroup = new NioEventLoopGroup(8);
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new MyServerInitializer());
            ChannelFuture channelFuture = serverBootstrap.bind(7000).sync();
            channelFuture.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

```java
public class MyServerInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();
        // 入站的 handler 进行解码
        pipeline.addLast(new MyByteToLongDecoder());
        pipeline.addLast(new MyServerHandler());
    }
}
```

```java
public class MyByteToLongDecoder extends ByteToMessageDecoder {
    /**
     * decode 会根据接收的数据，被调用多次，知道确定没有新的元素被添加到list，或者是Bytebuf 没有更多的可读字节为止
     * 如果 list out 不为空，就会将list的内容传递给下一个 channelInboundHandler 处理，该处理器的方法也会被调用多次
     *
     * @param ctx 上下文
     * @param in 入站的 ByteBuf
     * @param out List 集合，将解码后的数据传给下一个 handler 处理
     * @throws Exception
     */
    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        System.out.println("MyByteToLongDecoder 的 decode()方法被调用");
        // 因为 long 是 8 个字节，需要判断有 8 个字节，才能读取一个 long
        if(in.readableBytes() >= 8){
            out.add(in.readLong());
        }
    }
}
```

```java
public class MyServerHandler extends SimpleChannelInboundHandler<Long> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Long msg) throws Exception {
        System.out.println("从客户端" + ctx.channel().remoteAddress() + "读取到的数据到long " + msg);
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

**客户端代码**

```java
public class MyClinet {
    public static void main(String[] args) throws InterruptedException {
        NioEventLoopGroup group = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group)
                    .channel(NioSocketChannel.class)
                    .handler(new MyClientInitializer());
            ChannelFuture channelFuture = bootstrap.connect("localhost", 7000).sync();
            channelFuture.channel().closeFuture().sync();
        }finally {
            group.shutdownGracefully();
        }
    }
}
```

```java
public class MyClientInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();
        //加入一个出站的handler，对数据进行一个编码
        pipeline.addLast(new MyLongToByteEncoder());
        //加入一个自定义的handler，处理业务逻辑
        pipeline.addLast(new MyClientHandler());
    }
}
```

```java
public class MyLongToByteEncoder extends MessageToByteEncoder<Long> {
    @Override
    protected void encode(ChannelHandlerContext ctx, Long msg, ByteBuf out) throws Exception {
        System.out.println("MyLongToByteEncoder 的 encode()方法被调用");
        System.out.println("msg = " + msg);
        out.writeLong(msg);
    }
}
```

```java
public class MyClientHandler extends SimpleChannelInboundHandler<Long> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Long msg) throws Exception {
    }
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        System.out.println("MyClientHandler 发送数据");
        ctx.writeAndFlush(123456L);
        // 分析
        // 1. "abcdabcdabcdabcd" 是16个字节
        // 2. 该处理器的前一个 handler 是 MyLongToByteEncoder
        // 3. MyLongToByteEncoder 父类是 MessageToByteEncoder
        // 4. 父类 MessageToByteEncoder 中 acceptOutboundMessage(msg) 会判断当前 msg 是不是应该处理的类型，如果是就处理，不是就跳过
        // 5. 编写 Encoder 时要注意传入的数据类型和处理的数据类型需要一致
//        ctx.writeAndFlush(Unpooled.copiedBuffer("abcdabcdabcdabcd", CharsetUtil.UTF_8));
    }
}
```

### 2.2.2服务端发送给客户端

客户端增加一个Decoder，服务端增加一个Encoder。

**修改服务端代码**

```java
public class MyServerInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();
        // 入站的 handler 进行解码
        pipeline.addLast(new MyByteToLongDecoder());
        pipeline.addLast(new MyLongToByteEncoder());
        pipeline.addLast(new MyServerHandler());
    }
}
```

```java
public class MyServerHandler extends SimpleChannelInboundHandler<Long> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Long msg) throws Exception {
        System.out.println("从客户端" + ctx.channel().remoteAddress() + "读取到的数据到long " + msg);
        // 给客户端发送一个 long
        ctx.writeAndFlush(123L);
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

**修改客户端代码**

```java
public class MyClientInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();
        pipeline.addLast(new MyLongToByteEncoder());
        pipeline.addLast(new MyByteToLongDecoder());
        pipeline.addLast(new MyClientHandler());
    }
}
```

```java
public class MyClientHandler extends SimpleChannelInboundHandler<Long> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Long msg) throws Exception {
        System.out.println("服务器的ip=" + ctx.channel().remoteAddress());
        System.out.println("服务器回送的消息：" + msg );
    }
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        System.out.println("MyClientHandler 发送数据");
        ctx.writeAndFlush(123456L);
        // 分析
        // 1. "abcdabcdabcdabcd" 是16个字节
        // 2. 该处理器的前一个 handler 是 MyLongToByteEncoder
        // 3. MyLongToByteEncoder 父类是 MessageToByteEncoder
        // 4. 父类 MessageToByteEncoder 中 acceptOutboundMessage(msg) 会判断当前 msg 是不是应该处理的类型，如果是就处理，不是就跳过
        // 5. 编写 Encoder 时要注意传入的数据类型和处理的数据类型需要一致
//        ctx.writeAndFlush(Unpooled.copiedBuffer("abcdabcdabcdabcd", CharsetUtil.UTF_8));
    }
}
```

### 2.2.3ChannelPipeline类中的图

```java
 * <pre>
 *                                                 I/O Request
 *                                            via {@link Channel} or
 *                                        {@link ChannelHandlerContext}
 *                                                      |
 *  +---------------------------------------------------+---------------+
 *  |                           ChannelPipeline         |               |
 *  |                                                  \|/              |
 *  |    +---------------------+            +-----------+----------+    |
 *  |    | Inbound Handler  N  |            | Outbound Handler  1  |    |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |              /|\                                  |               |
 *  |               |                                  \|/              |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |    | Inbound Handler N-1 |            | Outbound Handler  2  |    |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |              /|\                                  .               |
 *  |               .                                   .               |
 *  | ChannelHandlerContext.fireIN_EVT() ChannelHandlerContext.OUT_EVT()|
 *  |        [ method call]                       [method call]         |
 *  |               .                                   .               |
 *  |               .                                  \|/              |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |    | Inbound Handler  2  |            | Outbound Handler M-1 |    |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |              /|\                                  |               |
 *  |               |                                  \|/              |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |    | Inbound Handler  1  |            | Outbound Handler  M  |    |
 *  |    +----------+----------+            +-----------+----------+    |
 *  |              /|\                                  |               |
 *  +---------------+-----------------------------------+---------------+
 *                  |                                  \|/
 *  +---------------+-----------------------------------+---------------+
 *  |               |                                   |               |
 *  |       [ Socket.read() ]                    [ Socket.write() ]     |
 *  |                                                                   |
 *  |  Netty Internal I/O Threads (Transport Implementation)            |
 *  +-------------------------------------------------------------------+
 * </pre>
```

### 2.2.4结论

**1、** 不论解码器handler还是编码器handler，即接收的消息类型必须与待处理的消息类型一致，否则该handler不会被执行；

**2、** 在解码器进行数据解码时，需要判断缓存区（ByteBuf）的数据是否足够，否则接收到的结果和期望结果可能不一致；

## 3.常用其他解码器

## 3.1解码器-ReplayingDecoder

1、public abstract class ReplayingDecoder extends ByteToMessageDecoder

2、ReplayingDecoder扩展了ReplayingDecoder类，使用这个类，我们不必调用 readableBytes()方法。参数S指定了用户状态管理的类型，其中Void代表不需要状态管理。

3、应用实例：使用 ReplayingDecoder 编写解码器，对前面的案例进行简化。

代码修改如下：

```java
public class MyByteToLongDecoder2 extends ReplayingDecoder<Void> {
    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        System.out.println("MyByteToLongDecoder2 的 decode()方法被调用");
        // 在ReplayingDecoder 不需要判断数据是否足够读取，内部会进行处理判断
        out.add(in.readLong());
    }
}
```

```java
public class MyServerInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();
        // 入站的 handler 进行解码
        pipeline.addLast(new MyByteToLongDecoder2());
        pipeline.addLast(new MyLongToByteEncoder());
        pipeline.addLast(new MyServerHandler());
    }
}
```

```java
public class MyClientInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();
        pipeline.addLast(new MyLongToByteEncoder());
        pipeline.addLast(new MyByteToLongDecoder2());
        pipeline.addLast(new MyClientHandler());
    }
}
```

4、ReplayingDecoder使用方便，但它也有一些局限性：

- 并不是所有的 ByteBuf 操作都被支持，如果调用了一个不被支持的方法，将会抛出一个UnsupportedOperationException。
- ReplayingDecoder 在某些情况下可能稍慢于 ByteToMessageDecoder，例如网络缓慢并且消息格式复杂时，消息会被拆成了多个碎片，速度变慢。

## 3.2解码器-LineBasedFrameDecoder

LineBasedFrameDecoder：这个类在 Netty 内部也有使用，它使用行尾控制字符（\n 或者 \r\n）作为分隔符来解析数据。

## 3.3解码器-DelimiterBasedFrameDecoder

DelimiterBasedFrameDecoder：使用自定义的特殊字符作为消息的分隔符。

## 3.4 解码器-HttpObjectDecoder

HttpObjectDecoder：一个 HTTP 数据的解码器。

## 3.5解码器-LengthFieldBasedFrameDecoder

LengthFieldBasedFrameDecoder：通过指定长度来标识整包消息，这样就可以自动的处理粘包和半包消息。
