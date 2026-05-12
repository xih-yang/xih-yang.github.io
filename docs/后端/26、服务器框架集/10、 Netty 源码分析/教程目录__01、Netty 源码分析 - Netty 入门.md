# 01、Netty 源码分析 - Netty 入门
- 来源：https://ddkk.com/zhuanlan/server/netty/3/1.html
- 分类：服务器框架
- 分组：教程目录
关于`Netty`的学习，最近看了不少有关视频和书籍，也收获不少，希望把我知道的分享给你们，一起加油，一起成长。前面我们对 `Java IO`、`BIO`、`NIO`、 `AIO`进行了分析，相关文章链接如下：

本篇文章我们就开始对 `Netty`来进行深入分析，首先我们来了解一下 `JAVA NIO` 、`AIO`的不足之处。

## Java原生API之痛

虽然`JAVA NIO` 和 `JAVA AIO`框架提供了多路复用IO/异步IO的支持，但是并没有提供上层“信息格式”的良好封装。用这些API实现一款真正的网络应用则并非易事。

`JAVA NIO` 和 `JAVA AIO`并没有提供断连重连、网络闪断、半包读写、失败缓存、网络拥塞和异常码流等的处理，这些都需要开发者自己来补齐相关的工作。

`AIO`在实践中，并没有比`NIO`更好。`AIO`在不同的平台有不同的实现，windows系统下使用的是一种异步IO技术：`IOCP`；Linux下由于没有这种异步 IO 技术，所以使用的是`epoll` 对异步 IO 进行模拟。所以 AIO 在 Linux 下的性能并不理想。AIO 也没有提供对 UDP 的支持。

综上，在实际的大型互联网项目中，Java 原生的 API 应用并不广泛，取而代之的是一款第三方Java 框架，这就是`Netty`。

## Netty的优势

> Netty 提供 异步的、事件驱动的网络应用程序框架和工具，用以快速开发高性能、高可靠性的网络服务器和客户端程序。

### 非阻塞 I/O

Netty 是基于 `Java NIO` API 实现的网络应用框架，使用它可以快速简单的开发网络应用程序，如服务器和客户端程序。Netty 大大简化了网络程序开发的过程，如 TCP 和 UDP 的 Socket 服务的开发。

由于是基于 NIO 的 API，因此，Netty 可以提供非阻塞的 `I/O`操作，极大的提升了性能。同时，Netty 内部封装了 Java NIO API 的复杂性，并提供了线程池的处理，使得开发 NIO 的应用变得极其简单。

### 丰富的协议

Netty 提供了简单、易用的 API ,但这并不意味着应用程序会有难维护和性能低的问题。Netty 是一个精心设计的框架，它从许多协议的实现中吸收了很多的经验，如 FTP 、SMTP、 HTTP、许多二进制和基于文本的传统协议。

Netty 支持丰富的网络协议，如`TCP`、 `UDP`、 `HTTP`、 `HTTP/2`、 `WebSocket`、 `SSL/TLS`等，这些协议实现开箱即用，因此，Netty 开发者能够在不失灵活的前提下来实现开发的简易性、高性能和稳定性。

### 异步和事件驱动

Netty 是异步事件驱动的框架，该框架体现为所有的`I/O`操作都是异步的，所有的`I/O`调用会立即返回，并不保证调用成功与否，但是调用会返回`ChannelFuture`。Netty 会通过 `ChannelFuture`通知调用是成功了还是失败了，抑或是取消了。

同时，Netty 是基于事件驱动的，调用者并不能立即获得结果，而是通过事件监听机制，用户可以方便地主动获取或者通过通知机制获得`I/O`操作的结果。

当`Future`对象刚刚创建时，处于非完成状态，调用者可以通过返回的`ChannelFuture`来获取操作执行的状态，再通过注册监听函数来执行完成后的操作，常见有如下操作：

- 通过isDone方法来判断当前操作是否完成。
- 通过isSuccess方法来判断已完成的当前操作是否成功。
- 通过getCause方法来获取已完成的当前操作失败的原因。
- 通过isCancelled方法来判断已完成的当前操作是否被取消。
- 通过addListener方法来注册监听器，当操作已完成(isDone方法返回完成)，将会通知指定的监听器；如果future对象已完成，则理解通知指定的监听器。

例如：下面的代码中绑定端口是异步操作，当绑定操作处理完，将会调用相应的监听器处理逻辑。

```java
serverBootstrap.bind(port).addListener(future -> {
    if(future.isSuccess()){
        System.out.println("端口绑定成功！");
    }else {
        System.out.println("端口绑定失败！");
    }
});
```

相比传统的阻塞 `I/O`，Netty 异步处理的好处是不会造成线程阻塞，线程在 `I/O`操作期间可以执行其他的程序，在高并发情形下会更稳定并拥有更高的吞吐量。

### 精心设计的API

Netty 从开始就为用户提供了体验最好的API及实现设计。

例如，在用户数较小的时候可能会选择传统的阻塞API，毕竟与 Java NIO 相比使用阻塞 API 将会更加容易一些。然而，当业务量呈指数增长并且服务器需要同时处理成千上万的客户连接，便会遇到问题。这种情况下可能会尝试使用 Java NIO，但是复杂的 NIO Selector 编程接口又会耗费大量的时间并最终会阻碍快速开发。

Netty 提供了一个叫作 `channel`的统一的异步`I/O`编程接口，这个编程接口抽象了所有点对点的通信操作。也就是说，如果应用是基于Netty 的某一种传输实现，那么同样的，应用也可以运行在 Netty 的另一种传输实现上。`Channel`常见的子接口有：

### 丰富的缓冲实现

Netty 使用自建的缓存 API，而不是使用 Java NIO 的 `ByteBuffer` 来表示一个连续的字节序列。与 `ByteBuffer` 相比，这种方式拥有明显的优势。

Netty 使用新的缓冲类型 `ByteBuf` ,并且被设计为可从底层解决 `ByteBuffer` 问题，同时还满足日常网络应用开发需要的缓冲类型。

**Netty 重要有以下特性：**

- 允许使用自定义的缓冲类型。
- 复合缓冲类型中内置透明的零拷贝实现。
- 开箱即用动态缓冲类型，具有像 StringBuffer 一样的动态缓冲能力。
- 不再需要调用flip()方法。
- 正常情况下具有比ByteBuffer更快的响应速度。

### 高效的网络传输

Java 原生的序列化主要存在以下几个弊端：

- 无法跨语言。
- 序列化后码流太大。
- 序列化后性能太低。

业界有非常多的框架用于解决上述问题，如 `Google Protobuf` 、`JBoss Marshalling`、`Facebook Thrift`等。针对这些框架，Netty 都提供了相应的包将这些框架集成到应用中。同时，Netty 本身也提供了众多的编解码工具，方便开发者使用。开发者可以基于 Netty 来开发高效的网络传输应用，例如：高性能的消息中间件 `Apache RocketMQ`、高性能RPC框架`Apache Dubbo`等。

## Netty 核心概念

从上述的架构图可以看出，Netty 主要由三大块组成：

- 核心组件
- 传输服务
- 协议

### 核心组件

> 核心组件包括：事件模型、字节缓冲区和通信API

#### 事件模型

**Netty 是基于异步事件驱动的，该框架体现为所有的I/O操作都是异步的，调用者并不能立即获得结果，而是通过事件监听机制，用户可以方便地主动获取或者通过通知机制获得I/O操作的结果。**

Netty 将所有的事件按照它们与入站或出站数据流的相关性进行了分类。

可能由入站数据或者相关的状态更改而触发的事件包括以下几项：

- 连接已被激活或者连接失活。
- 数据读取。
- 用户事件。
- 错误事件。

出站事件是未来将会触发的某个动作的操作结果，包括以下动作：

- 打开或者关闭到远程节点的连接。
- 将数据写到或者冲刷到套接字。

每个事件都可以被分发到`ChannelHandler`类中的某个用户实现的方法。

#### 字节缓冲区

Netty 使用了区别于`Java ByteBuffer` 的新的缓冲类型`ByteBuf`,`ByteBuf`提供了丰富的特性。

#### 通信API

Netty 的通信API都被抽象到`Channel`里，以统一的异步`I/O`编程接口来满足所有点对点的通信操作。

### 传输服务

Netty 内置了一些开箱即用的传输服务。因为并不是它们所有的传输都支持每一种协议，所以必须选择一个和应用程序所使用的协议相兼容的传输。以下是Netty提供的所有的传输。

#### NIO

`io.netty.channel.socket.nio`包用于支持NIO。该包下面的实现是使用`java.nio.channels`包作为基础（基于选择器的方式）。

#### epoll

`io.netty.channel.epoll`包用于支持由 JNI 驱动的 epoll 和 非阻塞 IO。

需要注意的是，这个`epoll`传输只能在 Linux 上获得支持。`epoll`同时提供多种特性，如：SO_REUSEPORT 等，比 NIO传输更快，而且是完全非阻塞的。

#### OIO

`io.netty.channel.socket.oio`包用于支持使用`java.net`包作为基础的阻塞`I/O`。

#### 本地

`io.netty.channel.local`包用于支持在 VM 内部通过管道进行通信的本地传输。

#### 内嵌

`io.netty.channel.embedded`包作为内嵌传输，允许使用`ChannelHandler`而又不需要一个真正的基于网络的传输。

### 协议支持

Netty 支持丰富的网络协议，如`TCP`、 `UDP`、 `HTTP`、 `HTTP/2`、 `WebSocket`、 `SSL/TLS`等，这些协议实现开箱即用，因此，Netty 开发者能够在不失灵活的前提下来实现开发的简易性、高性能和稳定性。

## Netty简单应用

#### 引入Maven依赖

```java
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-all</artifactId>
    <version>4.1.49.Final</version>
</dependency>
```

#### 服务端的管道处理器

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

`NettyServerHandler`继承自`ChannelInboundHandlerAdapter`，这个类实现了`ChannelInboundHandler`接口。`ChannelInboundHandler`提供了许多事件处理的接口方法。

这里覆盖了`channelRead()`事件处理方法。每当从客户端收到新的数据时，这个方法会在收到消息时被调用。

`channelReadComplete()`事件处理方法是数据读取完毕时被调用，通过调用`ChannelHandlerContext`的`writeAndFlush()`方法，把消息写入管道，并最终发送给客户端。

`exceptionCaught()`事件处理方法是，当出现`Throwable`对象时才会被调用。

#### 服务端主程序

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
                    .childHandler(new ChannelInitializer<SocketChannel>() {
     //workerGroup使用 SocketChannel创建一个通道初始化对象																														(匿名对象)
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

#### 客户端管道处理器

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

`channelRead`方法中将接收到的消息转化为字符串，方便在控制台上打印出来。

`channelRead`接收到的消息类型为`ByteBuf`，`ByteBuf`提供了转为字符串的方便方法。

#### 客户端主程序

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

#### 测试运行

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

本篇文章主要讲解了 Netty 产生的背景、特点、核心组件及如何快速开启第一个 Netty 应用。

后面我们会分析`Netty架构设计`、`Channel`、`ChannelHandler`、字节缓冲区`ByteBuf`、`线程模型`、`编解码`、`引导程序`等方面的知识。
