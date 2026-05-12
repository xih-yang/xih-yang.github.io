# 12、Netty学习 - Netty 工作原理
- 来源：https://ddkk.com/zhuanlan/server/netty/5/12.html
- 分类：服务器框架
- 分组：教程目录
上一篇文章我们对 Reactor 模型进行了详细的讲解，下面我们就来探究一下 Netty 模型，Netty 采用的就是 主从 Reactor 多线程模型。

## Netty 模型

下图就是 Netty 的工作原理图：

执行流程如下：

- Netty 抽象出两组线程池 BossGroup 专门负责接收客户端的连接，WorkerGroup 专门负责网络的读写。
- BossGroup 和 WorkerGroup 类型都是 NioEventLoopGroup。
- NioEventLoopGroup 相当于一个事件循环组，这个组中含有多个事件循环 ，每一个事件循环是 NioEventLoop。
- NioEventLoop 表示一个不断循环的执行处理任务的线程， 每个NioEventLoop 都有一个selector ，用于监听绑定在其上的 socket 的网络通讯。
- NioEventLoopGroup 可以有多个线程，即可以含有多个 NioEventLoop。
- 每个Boss NioEventLoop 循环执行的步骤有3步 ：
- 1、轮询accept 事件 ；
- 2、处理accept 事件 ，与 client 建立连接 ，生成 `NioScocketChannel`，并将其注册到某个 worker NIOEventLoop 上的 selector；
- 3、处理任务队列的任务 ， 即 runAllTasks。
- 每个 Worker NIOEventLoop 循环执行的步骤 ：
- 1、轮询`read`，`write` 事件 处理 I/O 事件， 即 `read , write` 事件；
- 2、在对应`NioScocketChannel`处理；
- 3、处理任务队列的任务 ， 即 `runAllTasks`；
- 每个Worker NIOEventLoop 处理业务时，会使用pipeline(管道)，pipeline 中包含了channel ，即通过pipeline 可以获取到对应通道，管道中维护了很多的 处理器（ChannelHandler）。

## 代码示例

### 引入Maven依赖

```java
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-all</artifactId>
    <version>4.1.49.Final</version>
</dependency>
```

### 服务端的管道处理器

```java
public class NettyServerHandler extends ChannelInboundHandlerAdapter {
    //读取数据实际(这里我们可以读取客户端发送的消息)
    /*
    1. ChannelHandlerContext ctx:上下文对象, 含有 管道pipeline , 通道channel, 地址
    2. Object msg: 就是客户端发送的数据 默认Object
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        System.out.println("server ctx =" + ctx);
        Channel channel = ctx.channel();
        //将 msg 转成一个 ByteBuf
        //ByteBuf 是 Netty 提供的，不是 NIO 的 ByteBuffer.
        ByteBuf buf = (ByteBuf) msg;
        System.out.println("客户端发送消息是:" + buf.toString(CharsetUtil.UTF_8));
        System.out.println("客户端地址:" + channel.remoteAddress());
    }
    //数据读取完毕
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        //writeAndFlush 是 write + flush
        //将数据写入到缓存，并刷新
        //一般讲，我们对这个发送的数据进行编码
        ctx.writeAndFlush(Unpooled.copiedBuffer("公司最近账户没啥钱，再等几天吧！", CharsetUtil.UTF_8));
    }
    //处理异常, 一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        ctx.close();
    }
}
```

### 服务端主程序

```java
public class NettyServer {
    public static void main(String[] args) throws Exception {
        //创建BossGroup 和 WorkerGroup
        //说明
        //1. 创建两个线程组 bossGroup 和 workerGroup
        //2. bossGroup 只是处理连接请求 , 真正的和客户端业务处理，会交给 workerGroup完成
        //3. 两个都是无限循环
        //4. bossGroup 和 workerGroup 含有的子线程(NioEventLoop)的个数
        //   默认实际 cpu核数 * 2
        //
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup(); //8
        try {
            //创建服务器端的启动对象，配置参数
            ServerBootstrap bootstrap = new ServerBootstrap();
            //使用链式编程来进行设置
            bootstrap.group(bossGroup, workerGroup) //设置两个线程组
                    .channel(NioServerSocketChannel.class) //bossGroup使用NioSocketChannel 作为服务器的通道实现
                    .option(ChannelOption.SO_BACKLOG, 128) // 设置线程队列得到连接个数 option主要是针对boss线程组，
                    .childOption(ChannelOption.SO_KEEPALIVE, true) //设置保持活动连接状态 child主要是针对worker线程组
                    .childHandler(new ChannelInitializer<SocketChannel>() {//workerGroup使用 SocketChannel创建一个通道初始化对象																														(匿名对象)
                        //给pipeline 设置处理器
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            //可以使用一个集合管理 SocketChannel， 再推送消息时，可以将业务加入到各个channel 对应的 NIOEventLoop 的 									taskQueue 或者 scheduleTaskQueue
                            ch.pipeline().addLast(new NettyServerHandler());
                        }
                    }); // 给我们的workerGroup 的 EventLoop 对应的管道设置处理器
            System.out.println(".....服务器 is ready...");
            //绑定一个端口并且同步, 生成了一个 ChannelFuture 对象
            //启动服务器(并绑定端口)
            ChannelFuture cf = bootstrap.bind(7788).sync();
            //给cf 注册监听器，监控我们关心的事件
            cf.addListener(new ChannelFutureListener() {
                @Override
                public void operationComplete(ChannelFuture future) throws Exception {
                    if (cf.isSuccess()) {
                        System.out.println("服务已启动,端口号为7788...");
                    } else {
                        System.out.println("服务启动失败...");
                    }
                }
            });
            //对关闭通道进行监听
            cf.channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

`NioEventLoopGroup`是用来处理`I/O`操作的多线程事件循环器。Netty 提供了许多不同的`EventLoopGroup`的实现来处理不同的传输。

上面的服务端应用中，有两个`NioEventLoopGroup`被使用。第一个叫作`bossGroup`，用来接收进来的连接。第二个叫作`workerGroup`，用来处理已经被接收的连接，一旦 `bossGroup`接收连接，就会把连接的信息注册到`workerGroup`上。

`ServerBootstrap`是一个NIO服务的引导启动类。可以在这个服务中直接使用`Channel`。

- group方法用于 设置EventLoopGroup。
- 通过Channel方法，可以指定新连接进来的Channel类型为NioServerSocketChannel类。
- childHandler用于指定ChannelHandler，也就是前面实现的NettyServerHandler。
- 可以通过option设置指定的Channel来实现NioServerSocketChannel的配置参数。
- childOption主要设置SocketChannel的子Channel的选项。
- bind用于绑定端口启动服务。

### 客户端管道处理器

```java
public class NettyClientHandler extends ChannelInboundHandlerAdapter {
    //当通道就绪就会触发该方法
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        System.out.println("client ctx =" + ctx);
        ctx.writeAndFlush(Unpooled.copiedBuffer("老板，工资什么时候发给我啊？", CharsetUtil.UTF_8));
    }
    //当通道有读取事件时，会触发
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ByteBuf buf = (ByteBuf) msg;
        System.out.println("服务器回复的消息:" + buf.toString(CharsetUtil.UTF_8));
        System.out.println("服务器的地址： "+ ctx.channel().remoteAddress());
    }
    //处理异常, 一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

### 客户端主程序

```java
public class NettyClient {
    public static void main(String[] args) throws Exception {
        //客户端需要一个事件循环组
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            //创建客户端启动对象
            //注意客户端使用的不是 ServerBootstrap 而是 Bootstrap
            Bootstrap bootstrap = new Bootstrap();
            //设置相关参数
            bootstrap.group(group) //设置线程组
                    .channel(NioSocketChannel.class) // 设置客户端通道的实现类(反射)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ch.pipeline().addLast(new NettyClientHandler()); //加入自己的处理器
                        }
                    });
            System.out.println("客户端 ok..");
            //启动客户端去连接服务器端
            //关于 ChannelFuture 要分析，涉及到netty的异步模型
            ChannelFuture channelFuture = bootstrap.connect("127.0.0.1", 7788).sync();
            //给关闭通道进行监听
            channelFuture.channel().closeFuture().sync();
        } finally {
            group.shutdownGracefully();
        }
    }
}
```

客户端只需要一个`NioEventLoopGroup`就可以了。

### 测试运行

分别启动服务器 `NettyServer` 和客户端 `NettyClient`程序

服务端控制台输出内容：

```java
.....服务器 is ready...
服务已启动,端口号为7788...
server ctx =ChannelHandlerContext(NettyServerHandler#0, [id: 0xa1b2233c, L:/127.0.0.1:7788 - R:/127.0.0.1:63239])
客户端发送消息是:老板，工资什么时候发给我啊？
客户端地址:/127.0.0.1:63239
```

客户端控制台输出内容：

```java
客户端 ok..
client ctx =ChannelHandlerContext(NettyClientHandler#0, [id: 0x21d6f98e, L:/127.0.0.1:63239 - R:/127.0.0.1:7788])
服务器回复的消息:公司最近账户没啥钱，再等几天吧！
服务器的地址： /127.0.0.1:7788
```

至此，一个简单的基于Netty开发的服务端和客户端就完成了。

## 总结

本篇文章主要讲解了 Netty 的工作原理及简单应用。下节我们来讲解 Netty 的编解码。
