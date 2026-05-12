# 33、Netty 源码解析 - TCP粘包和拆包
- 来源：https://ddkk.com/zhuanlan/server/netty/1/33.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本介绍

1、TCP 是面向连接的，面向流的，提供高可靠性服务。收发两端（客户端和服务器端）都要有一一成对的socket，因此，发送端为了将多个发给接收端的包，更有效的发给对方，使用了优化方法（Nagle算法），将多次间隔较小且数据量小的数据，合并成一个大的数据库，然后进行封包。这样做虽然提高了效率，但是接收端就难于分辨出完整的数据包了，因为**面向流的通信是无消息保护边界的**。

2、由于TCP无消息保护边界，需要在接受端处理消息边界问题，也就是我们所说的粘包、拆包问题。

3、TCP粘包、拆包图解

假设客户端分别发送了两个数据包D1和D2给服务器端，由于服务器端一次读取到字节数是不确定的，故可能存在以下四种情况：

**1、** 服务器端分两次读取到了两个独立的数据包，分别是D1和D2，没有粘包和拆包；

**2、** 服务器端一次接收到了两个数据包，D1和D2粘合在一起，称之为TCP粘包；

**3、** 服务器端分两次读取到了数据包，第一次读取到了完整的D1包和D2包的部分内容，第二次读取到了D2包的剩余内容，这称之为TCP拆包；

**4、** 服务器端分两次读取到了数据包，第一次读取到了D1包的部分内容D1_1，第二次读取到了D1包的剩余部分内容D1_2和完整的D2包；

## 二、实例

在编写Netty程序时，如果没有做处理，就会发生粘包和拆包的问题。

### 2.1 服务器端

**启动类：**

```java
public class MyServer {
    public static void main(String[] args) throws InterruptedException {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup,workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new MyServerInitializer()); // 自定义一个初始化类
            ChannelFuture future = bootstrap.bind(7000).sync();
            future.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

**初始化类：**

```java
public class MyServerInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();
        pipeline.addLast(new MyServerHandler());
    }
}
```

**服务器端处理器：**

```java
public class MyServerHandler extends SimpleChannelInboundHandler<ByteBuf> {
    private int count;
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, ByteBuf msg) throws Exception {
        byte[] buf = new byte[msg.readableBytes()];
        msg.readBytes(buf);
        // 将 buf 转成字符串
        String message = new String(buf, Charset.forName("utf-8"));
        System.out.println("服务器接收到数据 " + message);
        System.out.println("服务器接收到消息量=" + (++this.count));
        // 服务器回送数据给客户端，回送一个随机id
        ByteBuf responseBuf = Unpooled.copiedBuffer(UUID.randomUUID().toString() + " ", Charset.forName("utf-8"));
        ctx.writeAndFlush(responseBuf);
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

### 2.2 客户端

**启动类：**

```java
public class MyClient {
    public static void main(String[] args) throws InterruptedException {
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group)
                    .channel(NioSocketChannel.class)
                    .handler(new MyClientInitializer()); // 自定义一个初始化类
            ChannelFuture future = bootstrap.connect("127.0.0.1", 7000).sync();
            future.channel().closeFuture().sync();
        }finally {
            group.shutdownGracefully();
        }
    }
}
```

**初始化类：**

```java
public class MyClientInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        ChannelPipeline pipeline = ch.pipeline();
        pipeline.addLast(new MyClientHandler());
    }
}
```

**客户端处理器：**

```java
public class MyClientHandler extends SimpleChannelInboundHandler<ByteBuf> {
    private int count;
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        // 使用客户端发送10条数据：hello,server 编号
        for (int i = 0; i < 10; ++i) {
            ByteBuf buf = Unpooled.copiedBuffer("hello,server " + i, Charset.forName("utf-8"));
            ctx.writeAndFlush(buf);
        }
    }
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, ByteBuf msg) throws Exception {
        byte[] buf = new byte[msg.readableBytes()];
        msg.readBytes(buf);
        String message = new String(buf, Charset.forName("utf-8"));
        System.out.println("客户端接收到消息=" + message);
        System.out.println("客户端接收到消息数量=" + (++this.count));
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

### 2.3 演示效果
