# 10、Netty入门 - Netty模型
- 来源：https://ddkk.com/zhuanlan/server/netty/2/10.html
- 分类：服务器框架
- 分组：教程目录
## Netty模型

Netty主要基于主从Reactor多线程模型做了一定的改进，其中主从Reactor多线程模型有多个Reactor。

Netty模型工作原理示意图-简单版，如下所示。

1、BossGroup线程维护Selector，只关注Accept事件；

2、当接收到Accept事件，获取到对应的SocketChannel，封装成NIOSocketChannel并注册到Worker线程（事件循环），并进行维护；

3、当Worker线程监听到selector中通道发生自己感兴趣的事件后，就进行处理（就由handler完成），注意handler已经加入到通道中。

Netty模型工作原理示意图-进阶版，如下所示。

Netty模型工作原理示意图-详细版，如下所示。

1、Netty抽象出两组线程池 BossGroup（专门负责接收客户端的连接）和 WorkerGroup（专门负责网络的读写）；

2、BossGroup 和 WorkerGroup 类型都是 NioEventLoopGroup；

3、NioEventLoopGroup 相当于一个事件循环组，这个组中含有多个事件循环，每一个事件循环是NioEventLoop；

4、NioEventLoop 表示一个不断循环的执行处理任务的线程，每个 NioEventLoop 都有一个selector，用于监听绑定在其上的socket的网络通讯；

5、NioEventLoopGroup 可以有多个线程，即可以含有多个 NioEventLoop；

6、每个 Boss NioEventLoop 循环执行的步骤有3步：

**1、** 轮询accept事件；

**2、** 处理accept事件，与client建立连接，生成NioSocketChannel，并将其注册到某个WorkerNioEventLoop上的selector；

**3、** 处理任务队列的任务，即runAllTasks；

7、每个 Worker NioEventLoop 循环执行的步骤：

**1、** 轮询read、write事件；

**2、** 处理I/O事件，即read、write事件，在对应NioSocketChannel处理；

**3、** 处理任务队列的任务，即runAllTasks；

8、每个 Worker NioEventLoop 处理业务时，会使用 pipeline（管道），pipeline 中包含了 channel，即通过 pipeline 可以获取到对应通道，管道中维护了很多的处理器；

## Netty快速入门实例 - TCP服务

实例要求：

1、使用idea创建Netty项目；

2、Netty服务器在6668端口监听，客户端能发送消息给服务器 “hello，服务器~”；

3、服务器可以回复消息给客户端“hello，客户端~”；

4、目的：对Netty线程模型有一个初步认识，便于理解Netty模型理论；

思路：

1、编写服务端；2、编写客户端；

```java
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-all</artifactId>
    <version>4.1.20.Final</version>
    <scope>compile</scope>
</dependency>
```

```java
public class NettyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建 BossGroup 和 WorkerGroup
        // 说明
        // 1.创建两个线程组 BossGroup 和 WorkerGroup
        // 2. BossGroup 只是处理连接请求，真正的和客户端业务处理，会交给 WorkerGroup 完成
        // 3. 两个都是无线循环
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            // 创建服务器端的启动对象，配置启动参数
            ServerBootstrap bootstrap = new ServerBootstrap();
            // 使用链式编程进行设置
            bootstrap.group(bossGroup, workerGroup) // 设置两个线程组
                    .channel(NioServerSocketChannel.class) // 使用 ioServerSocketChannel 作为服务器通道实现
                    .option(ChannelOption.SO_BACKLOG, 128) // 设置线程队列等待连接个数
                    .childOption(ChannelOption.SO_KEEPALIVE, true)  // 设置保持活动连接状态
                    .childHandler(new ChannelInitializer<SocketChannel>() {// 创建一个通道初始化对象（匿名对象）
                        // 给 pipeline 设置处理器
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            socketChannel.pipeline().addLast(new NettyServerHandler());
                        }
                    });  // 给我们的WorkerGroup 的 EventLoop 对应的管道设置处理器
            System.out.println(".....服务器 is ready.....");
            // 绑定一个端口，并且同步，生成一个ChannelFuture对象
            // 启动服务器
            ChannelFuture cf = bootstrap.bind(6668).sync();
            // 对关闭通道进行监听
            cf.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

```java
/**
 * 说明：
 * 1.自定义一个 Handler 需要继承 netty 规定好的某个 handlerAdapter
 * 2.这是我们自定义的 Handler，才能称之为一个 handler
 */
public class NettyServerHandler extends ChannelInboundHandlerAdapter {
    // 读取数据实现（这里我们可以读取客户端发送的消息）
    /**
     * 1. ChannelHandlerContext ctx：上下文对象，含有管道 pipeline，通道channel，地址
     * 2. Object msg：就是客户端发送的数据 默认Object
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        System.out.println("server ctx = " + ctx);
        // 将 msg 转成一个 ByteBuf
        // ByteBuf 是 Netty 提供的，不是 NIO 的 ByteBuffer
        ByteBuf buf = (ByteBuf) msg;
        System.out.println("客户端发送消息是：" + buf.toString(CharsetUtil.UTF_8));
        System.out.println("客户端地址：" + ctx.channel().remoteAddress());
    }
    // 数据读取完毕
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        // writeAndFlush 是 write + flush
        // 将数据写入到缓存，并刷新
        // 一般讲，我们对这个发送的数据进行编码
        ctx.writeAndFlush(Unpooled.copiedBuffer("hello，客户端~", CharsetUtil.UTF_8));
    }
    // 处理异常，一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        ctx.close();
    }
}
```

```java
public class NettyClient {
    public static void main(String[] args) throws InterruptedException {
        // 客户端需要一个事件循环组
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            // 创建客户端启动对象
            // 注意客户端使用的不是 ServerBootStrap 而是 BootStrap
            Bootstrap bootstrap = new Bootstrap();
            // 设置相关参数
            bootstrap.group(group) // 设置线程组
                    .channel(NioSocketChannel.class) // 设置客户端通道的实现类（反射）
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ch.pipeline().addLast(new NettyClientHandler());  // 加入自己的处理器
                        }
                    });
            System.out.println("客户端 ok....");
            // 启动客户端去连接服务端
            // 关于 ChannelFuture 要分析，涉及到 netty 的异步模型
            ChannelFuture channelFuture = bootstrap.connect("127.0.0.1", 6668).sync();
            // 给关闭通道进行监听
            channelFuture.channel().closeFuture().sync();
        }finally {
            group.shutdownGracefully();
        }
    }
}
```

```java
public class NettyClientHandler extends ChannelInboundHandlerAdapter {
    // 当通道就绪，就会触发该方法
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        System.out.println("client " + ctx);
        ctx.writeAndFlush(Unpooled.copiedBuffer("hello，server： 喵", CharsetUtil.UTF_8));
    }
    // 当通道有读取事件时，会触发
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ByteBuf byteBuf = (ByteBuf) msg;
        System.out.println("服务器回复的消息：" + byteBuf.toString(CharsetUtil.UTF_8));
        System.out.println("服务器的地址： " + ctx.channel().remoteAddress());
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```
