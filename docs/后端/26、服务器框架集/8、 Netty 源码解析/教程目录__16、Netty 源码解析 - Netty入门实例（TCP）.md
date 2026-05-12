# 16、Netty 源码解析 - Netty入门实例（TCP）
- 来源：https://ddkk.com/zhuanlan/server/netty/1/16.html
- 分类：服务器框架
- 分组：教程目录
## 一、实例要求

1、使用IDEA创建Netty项目

2、Netty服务器在6668端口监听，客户端能发送消息给服务器：“Hello，服务器”

3、服务器可以回复消息给客户端：“Hello，客户端”

4、目的：对Netty线程模型有一个初步认识，便于理解Netty模型理论

5、说明：创建Maven项目，并引入Netty包

## 二、服务器端

**Netty服务器端：**

```java
public class NettyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建 BossGroup 和 WorkerGroup
        // 说明
        // 1. 创建两个线程组 bossGroup 和 workerGroup
        // 2. bossGroup 只处理连接请求，真正和客户端的业务处理，交给 workerGroup
        // 3. 两个线程组都是无限循环
        // 4. bossGroup 和 workerGroup 含有的子线程（NioEventLoop）的个数
        //    默认是 CPU核数 * 2
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            // 创建服务器端启动对象，配置参数
            ServerBootstrap bootstrap = new ServerBootstrap();
            // 使用链式编程来进行设置
            bootstrap.group(bossGroup,workerGroup) // 设置两个线程组
                    .channel(NioServerSocketChannel.class) // 使用NioServerSocketChannel作为服务器的通道实现
                    .option(ChannelOption.SO_BACKLOG,128) // 设置线程队列等待连接的个数
                    .childOption(ChannelOption.SO_KEEPALIVE,true) // 设置保持活动连接状态
                    .childHandler(new ChannelInitializer<SocketChannel>() { // 创建一个通道初始化对象（匿名对象）
                        // 给pipeline设置处理器
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ch.pipeline().addLast(new NettyServerHandler());
                        }
                    }); // 给workerGroup的EventLoop对应的管道设置处理器
            System.out.println(".........server is ready.......");
            // 绑定一个端口并且同步处理，生成了一个 ChannelFuture 对象，已经启动了服务器（并绑定端口）
            ChannelFuture future = bootstrap.bind(6668).sync();
            // 对关闭通道进行监听
            future.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

**Netty服务器端处理器：**

```java
public class NettyServerHandler extends ChannelInboundHandlerAdapter {
    // 读取数据的事件（可以读取客户端发送的消息）
    /*
    1. ChannelHandlerContext ctx：上下文对象，含有：管道pipeline、通道channel、地址
    2. Object msg：就是客户端发送的数据，默认Object
    */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        System.out.println("服务器读取线程：" + Thread.currentThread().getName());
        System.out.println("server ctx = " + ctx);
        System.out.println("channel 和 pipeline 的关系");
        Channel channel = ctx.channel();
        ChannelPipeline pipeline = ctx.pipeline(); // 本质是一个双向链表，出站和入站
        // 将 msg 转成一个 ByteBuf
        // ByteBuf 是 Netty 提供的，不是 NIO 的 ByteBuffer
        ByteBuf buf = (ByteBuf) msg;
        System.out.println("客户端发送消息是：" + buf.toString(CharsetUtil.UTF_8));
        System.out.println("客户端地址：" + channel.remoteAddress());
    }
    // 数据读取完毕
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        // writeAndFlush 是 write + flush
        // 将数据写入到缓冲，并刷新
        // 一般来讲，要对这个发送的数据进行编码
        ctx.writeAndFlush(Unpooled.copiedBuffer("Hello，客户端",CharsetUtil.UTF_8));
    }
    // 处理异常，一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

## 三、客户端

**Netty客户端：**

```java
public class NettyClient {
    public static void main(String[] args) throws InterruptedException {
        // 客户端需要一个事件循环组
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            // 创建客户端启动对象
            // 注意客户端使用的不是 ServerBootstrap，而是Bootstrap
            Bootstrap bootstrap = new Bootstrap();
            // 设置相关参数
            bootstrap.group(group) // 设置线程组
                    .channel(NioSocketChannel.class) // 使用NioSocketChannel作为客户端的通道实现（反射）
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ch.pipeline().addLast(new NettyClientHandler()); // 加入自己的处理器
                        }
                    });
            System.out.println(".........client is ready.......");
            // 启动客户端，并连接服务器端
            // 关于 ChannelFuture，涉及到netty的异步模型
            ChannelFuture future = bootstrap.connect("127.0.0.1", 6668).sync();
            // 对关闭通道进行监听
            future.channel().closeFuture().sync();
        }finally {
            group.shutdownGracefully();
        }
    }
}
```

**Netty客户端处理器：**

```java
public class NettyClientHandler extends ChannelInboundHandlerAdapter {
    // 当通道就绪就会触发该方法
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        System.out.println("client " + ctx);
        ctx.writeAndFlush(Unpooled.copiedBuffer("Hello，服务器", CharsetUtil.UTF_8));
    }
    // 当通道有读取事件时，会触发
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ByteBuf buf = (ByteBuf)msg;
        System.out.println("服务器回复的消息：" + buf.toString(CharsetUtil.UTF_8));
        System.out.println("服务器地址：" + ctx.channel().remoteAddress());
    }
    // 处理异常，一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```
