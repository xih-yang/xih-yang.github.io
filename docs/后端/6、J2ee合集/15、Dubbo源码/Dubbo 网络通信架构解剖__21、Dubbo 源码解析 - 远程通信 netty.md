# 21、Dubbo 源码解析 - 远程通信 netty
- 来源：https://ddkk.com/zhuanlan/j2ee/dubbo/1/21.html
- 分类：J2EE框架
- 分组：Dubbo 网络通信架构解剖
dubbo 做为 RPC 框架，需要进行跨 JVM 通信，要保证高性、稳定的进行远程通信。dubbo 底层通信选择了 netty 这个 nio 框架做为默认的网络通信框架并且通过自定义协议进行通信。dubbo 支持以下网络通信框架：

- Netty(默认)
- Mina
- Grizzly

#### 1、 netty 简介

在网络编码领悟，Netty 是 Java 的卓越框架。它封装了 Java NIO 操作的复杂性，使得开发者能够使用其提供的简易 API 就能够开发出高效的网络程序。

首先我们来看一下 netty 里面的关键特性：

分类
Netty的特性

设计
统一的 API ，支持多种传输类型，阻塞和非阻塞的简单
简单而强大的线程模型
真正的无连接数据报套接字支持
链接逻辑组件以支持复用

易于使用
详实的 javadoc 和大量的示例集
不需要超过 JDK 1.6 的依赖

性能
拥有比 Java 核心 API 更高的吞吐量以及更低的延迟
得益于池化和复用，拥有更低的资源消耗
最少的内存复制

健壮性
不会因为慢速、快速或者超载的连接而导致 OutOfMemoryError
消除在高速网络中 NIO 应用程序常见的不公平读/写比率

安全性
完整的 SSL/TLS 以及 StartTLS 支持
可用于受限环境下，如 Applet 和 OSGI

社区驱动
发布快速而频繁

很多公司包含：Apple、Twitter、Facebook、Google 都在使用 Netty，并且很多流行的开源项目也在使用 Netty如：Vert.x 、Apache Cassandra 和 Elasticsearch，它们所有的核心代码都是利用了 Netty 强大的网络抽象。

#### 2、netty 的核心组件

在netty 中主要包括以下主要的核心构件块：

- Channel
- EventLoop
- ChannelHandler
- ChannelFuture

##### 2.1 Channel

Channel 是 Java NIO 里面的一个基本构造。可以把它看做是传入或传出数据的载体，然后通过 NIO 里面的 Buffer 来进行数据传递。

而在Netty 中自己也定义了一个 Channel，它的主要作用是：

> 连接到网络套接字或能够进行输入输出的组件的连接操作，如读、写、连接和绑定。

通道提供给用户以下功能：

- 通道的当前状态（例如，open？connected？）
- 通道的 ChannelConfig 配置参数（例如，接收缓冲区大小）
- 通道支持的输入/输出操作（如读、写、连接和绑定）
- 通道处理与通道相关联的所有输入/输出事件和请求

具体的方法可以参看 Netty 的 javadoc 中的 [Channel](http://netty.io/4.0/api/io/netty/channel/Channel.html)

##### 2.2 EventLoop

EventLoop 是 Netty 的核心概念， netty 里面的网络编程处理都是基于事件回调。下面的图说明了 Channel、EventLoop、Thread 以及 EventLoopGroup 之间的关系

它们的关系是：

- 一个 EventLoopGroup 包含一个或者多个 EventLoop；
- 一个 EventLoop 在它的生命周期内只和一个 Thread 绑定;
- 所有的 EventLoop 处理的 I/O 事件都将在它专门的 Thread 被处理;
- 一个 Channel 在它的生命周期内只注册于一个 EventLoop;
- 一个 EventLoop 可能会被分配一个或者多个 Channel;

netty 这样的设计，一个操作 I/O 的 Channel 都会由相同的 Thread 执行的，这样就能够消除线程之间的同步。所以 netty 内部是通过回调来处理事件。当一个回调被触发时相关的事件。

##### 2.3 ChannelHandler

ChannelHandler 在 Netty 里面的地位，大家可以理解成 Bean 在 Spring 里面的地址。Spring 把需要操作的 POJO 抽象成 Bean，然后对于对象的管理都是可以通过 spring bean 的生命周期来进行管理。同样的，我们在操作 Netty 的时候，其实就是操作的就是 ChannelHandler。

在上一个小节阐述了 EventLoop 在一个线程里面管理 I/O 操作 Channel 的生命周期。而 netty 的内部是通过回调来处理相关的事件。理解 ChannelHandler 其实可以理解成 Java Servlet 里面的 Filter.

而Netty 在处理 Channel 的时候也是类似的。只不过它区别得更加明确， 入站的时候使用是 ChannelHandler 的子接口 ChannelInboundHandler，而出站使用的 ChannelHandler 的子接口 ChannelOutboundHandler，然后 ChannelPipeline 提供了 ChannelHandler 链的容器。

具体使用 Netty 的时候可以注册哪些回调事件，大家可以参看以下接口对应的 API：

- ChannelHandler：[ChannelHandler 的注册与删除](http://netty.io/4.0/api/io/netty/channel/ChannelHandler.html)
- ChannelInboundHandler：[ChannelHandler 的入站操作](http://netty.io/4.0/api/io/netty/channel/ChannelInboundHandler.html)
- ChannelOutboundHandler：[ChannelHandler 的出站操作](http://netty.io/4.0/api/io/netty/channel/ChannelOutboundHandler.html)

##### 2.4 ChannelFuture

因为Netty 里面的操作都是异步的，所以一个操作可能不会立即返回。这样我们就需要一种用于在之后的某个时间点确定其结果的方法。因此， Netty 提供了 ChannelFuture 接口。它提供了 `addListener()` 方法来注册一个 ChannelFutureListener，以便在某个操作完成时(无论是否成功) 得到通知。

> 可以将 ChannelFuture 看做是将来要执行的操作的结果的占位符。它究竟什么时候被执行则可能取决于若干因素，因此不可能准确的预测，但是可以肯定的是它将会被执行。并且，所有属于同一个 Channel 的操作都被保证其将以它们被调用的顺序被执行

#### 3、Netty Demo

在上面的章节介绍了 Netty 里面的核心概念，下面我们就来编写一个 Hello World 来加深一下对上面概念的理解。

##### 3.1 Netty Server

编写Server 端业务处理类，因为需要响应客户端传入的信息，所以需要实现 ChannelInboundHandler 接口。作为一个简单的 hello world 程序，我们可以继承 ChannelInboundHandlerAdapter 它提供了 ChannelInboundHandler 的默认实现，我们只需要重写需要关注的方法就行了。

> EchoServerHandler

```java
@ChannelHandler.Sharable
public class EchoServerHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        // 将接收到的消息写给发送者，而不冲刷出站消息
        ByteBuf in = (ByteBuf) msg;
        System.out.println("Server received : " + in.toString(CharsetUtil.UTF_8));
        ctx.write(in);
    }
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        // 将未决消息冲刷到远程节点，并且关闭该 Channel
        ctx.writeAndFlush(Unpooled.EMPTY_BUFFER).addListener(ChannelFutureListener.CLOSE);
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        // 打印异常堆栈
        cause.printStackTrace();
        // 关闭该 Channel
        ctx.close();
}
```

下面就需要创建引导服务器，绑定服务器并且监听并且接收传入连接请求的端口，配置 Channel ，用来将传入的入站消息通知给 EchoServerHandler 实例。

> EchoServer

```java
public class EchoServer {
    private final int port;
    public EchoServer(int port) {
        this.port = port;
    }
    public static void main(String[] args) throws Exception {
        new EchoServer(8080).start();
    }
    public void start() throws Exception {
        final EchoServerHandler serverHandler = new EchoServerHandler();
        EventLoopGroup boss = new NioEventLoopGroup();
        EventLoopGroup worker = new NioEventLoopGroup();
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(boss, worker)
                        .channel(NioServerSocketChannel.class)
                        .localAddress(new InetSocketAddress(port))
                        .childHandler(new ChannelInitializer<SocketChannel>() {
                            @Override
                            protected void initChannel(SocketChannel socketChannel) throws Exception {
                                socketChannel.pipeline().addLast(serverHandler);
                            }
                        });
            ChannelFuture future = bootstrap.bind().sync();
            future.channel().closeFuture().sync();
        } finally {
            boss.shutdownGracefully().sync();
            worker.shutdownGracefully().sync();
        }
    }
}
```

上面的服务主要做了以下几件事：

- main() 方法引导了服务器，引导过程中所需要以下步骤
- 创建一个 ServerBootstrap 的实例用于引导和绑定服务
- 创建两个 EventLoopGroup 实例，boss 用于接收请求，而 worker 用于真正的请求处理
- 指定服务器绑定到本地的 InetSocketAddress
- 使用一个 EventLoopGroup 的实例初始化每一个新的 Channel
- 调用 ServerBootstrap.bind() 方法绑定服务器

这个时候服务器已经初始化好了，可以 接收客户端发送过来的请求了。

##### 3.2 Netty Client

首先编码客户端处理类，客户端处理类需要发送一个或者多个消息到服务器。并且在发送消息之后接收服务器发回的响应，最后关闭连接。

> EchoClientHandler

```java
@ChannelHandler.Sharable
public class EchoClientHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        // 当被通知 Channel 活跃的时候,发送消息
        ctx.writeAndFlush(Unpooled.copiedBuffer("Netty rock ! ", CharsetUtil.UTF_8));
    }
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        // 打印服务端响应的信息
        ByteBuf in = (ByteBuf) msg;
        System.out.println("Client received : " + in.toString(CharsetUtil.UTF_8));
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        // 打印异常，并关闭 Channel
        cause.printStackTrace();
        ctx.close();
    }
}
```

下面我们就需要编写客户端引导类，用于连接服务端并且与服务端进行通信。

> EchoClient

```java
public class EchoClient {
    private final String host;
    private final int prot;
    public EchoClient(String host, int prot) {
        this.host = host;
        this.prot = prot;
    }
    public static void main(String[] args) throws Exception {
        new EchoClient("localhost", 8080).start();
    }
    public void start() throws Exception {
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group)
                        .channel(NioSocketChannel.class)
                        .remoteAddress(new InetSocketAddress(host, prot))
                        .handler(new ChannelInitializer<SocketChannel>() {
                            @Override
                            protected void initChannel(SocketChannel ch) throws Exception {
                                ch.pipeline().addLast(new EchoClientHandler());
                            }
                        });
            ChannelFuture future = bootstrap.connect().sync();
            future.channel().closeFuture().sync();
        } finally {
            group.shutdownGracefully().sync();
        }
    }
}
```

以上代码做的事如下：

- 创建一个 Bootstrap 实例以初始化客户端
- 创建一个 EventLoopGroup 实例处理创建新的连接以及处理入站和出站数据
- 为连接服务器创建一个 InetSocketAddress 实例
- 当连接被建立时，一个 EchoClientHandler 实例会被安装到 ChannelPipeline 中
- 一切设置完成后，调用 Bootstrap.connect() 方法连接到远程节点

下面我们就可以测试程序的正确性了。

##### 3.3 Test

运行服务端引导类 EchoServer，然后运行客户端引导类 EchoClient。此时在服务端的控制台打印以下结果：

接着在客户端的控制台打印以下结果：

是不是很简单 😃

参考资料：

- Netty In Action
