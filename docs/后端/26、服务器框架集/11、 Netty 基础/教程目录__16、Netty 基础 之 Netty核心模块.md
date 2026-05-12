# 16、Netty 基础 之 Netty核心模块
- 来源：https://ddkk.com/zhuanlan/server/netty/4/16.html
- 分类：服务器框架
- 分组：教程目录
## 一、Bootstrap、ServerBootstrap

**1、** Bootstrap意思是引导，一个netty应用通常由一个Bootstrap开始，主要作用是配置整个netty程序，串联各个组件，netty中Bootstrap类是客户端程序的启动引导类，ServerBootstrap是服务端启动引导类；

**2、** 常见的方法有；

1、public ServerBootstrap group(EventLoopGroup parentGroup, EventLoopGroup childGroup)

该方法用于服务器端，用来设置两个EventLoop。

2、public B group(EventLoopGroup group)

该方法用于客户端，用来设置一个EventLoop。

3、public B channel(Class channelClass)

该方法用来设置一个服务器端、客户端的通道实现。

4、public  B option(ChannelOption option, T value)

用来给ServerChannel添加配置。

5、public  ServerBootstrap childOption(ChannelOption childOption, T value)

用来给接收到的通道添加配置。

6、public ServerBootstrap childHandler(ChannelHandler childHandler)

该方法用来设置业务处理类（自定义的handler）。对应workerGroup。

public B handler(ChannelHandler handler)

对应bossGroup。

7、public ChannelFuture bind(int inetPort)

该方法用于服务器端，用来设置占用的端口号。

8、public ChannelFuture connect(String inetHost, int inetPort)

该方法用于客户端，用来连接服务器。

## 二、Future、ChannelFuture

**1、** netty中所有的IO操作都是异步的，不能立刻得知消息是否被正确处理但是可以过一会儿等它执行完成或者直接注册一个监听，具体的实现就是通过Future和ChannelFuture，他们可以注册一个监听，当操作执行成功或失败时监听会自动触发注册的监听事件；

**2、** 常见的方法有；

1、Channel channel()

返回当前正在进行IO操作的通道。

2、ChannelFuture sync()

等待异步操作执行完成，阻塞当前线程（同步）。

## 三、Channel

**1、** netty网络通信的组件，能够用于执行网络I/O操作；

**2、** 通过Channel可获得当前网络连接的通道的状态；

**3、** 通过Channel可获得网络连接的配置参数（例如接收缓冲区大小）；

**4、** Channel提供异步的网络I/O操作（如建立连接，读写，绑定端口），异步调用意味着任何I/O调用都将立即返回，并且不保证在调用结束时所请求的I/O操作已完成；

**5、** 调用立即返回一个ChannelFuture实例，通过注册监听器到ChannelFuture上，可以在I/O操作成功、失败或取消时回调通知调用方；

**6、** Channel支持关联I/O操作与对应的处理程序；

**7、** 不同协议、不同的阻塞类型的连接都有不同的Channel类型与之对应，常用的Channel类型；

1、NioSocketChannel

异步的客户端TCP Socket连接。

2、NioServerSocketChannel

异步的服务器端TCP Socket连接。

3、NioDatagramChannel

异步的UDP连接。

4、NioSctpChannel

异步的客户端Sctp连接。

5、NioSctpServerChannel

异步的Sctp服务器端连接。

这些通道涵盖了UDP和TCP网络IO以及文件IO。

## 四、Selector

**1、** netty基于Selector对象实现I/O多路复用，通过Selector一个线程可以监听多个连接的Channel事件；

**2、** 当向一个Selector中注册Channel后，Selector内部的机制就可以自动不断的查询（Select）这些注册的Channel是否有已就绪的I/O事件（例如可读，可写，网络连接完成等），这样程序就可以很简单的使用一个线程高效的管理多个Channel；

## 五、ChannelHandler及其实现类

**1、** ChannelHandler是一个接口，处理I/O事件或拦截I/O操作，并将其转发到其ChannelPipeline（业务处理链）中的下一个处理程序；

**2、** ChannelHandler本身并没有提供很多方法，因为这个接口有许多的方法需要实现，方便使用期间，可以继承它的子类；

**3、** ChannelHandler及其实现类；

1、ChannelInboundHandler

用于处理入站I/O事件。

2、ChannelOutboundHandler

用于处理出站I/O事件。

3、ChannelInboundHandlerAdapter

用于处理入站I/O事件。

4、ChannelOutboundHandlerAdapter

用于处理出站I/O事件。

5、ChannelDuplexHandler

用于处理入站和出站事件。

**4、** 我们经常需要自定义一个Handler类去继承ChannelInboundHandlerAdapter，然后通过重写响应方法实现业务逻辑；

1、public void channelActive(ChannelHandlerContext ctx) throws Exception

通道就绪事件。

2、public void channelInactive(ChannelHandlerContext ctx) throws Exception

通道处于非活动的状态。

3、public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception

通道读取数据事件发生。

4、public void channelReadComplete(ChannelHandlerContext ctx) throws Exception

通道读取完毕事件。

5、public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause)

通道发生异常事件。

6、public void channelUnregistered(ChannelHandlerContext ctx) throws Exception

客户端断开连接时触发。

## 六、Pipeline和ChannelPipeline

**1、** ChannelPipeline是一个Handler的集合，它负责处理和拦截inbound或者outbound的事件和操作，相当于一个贯穿netty的链；

（也可以这样理解：ChannelPipeline是保存ChannelHandler的List，用于处理或拦截Channel的入站事件和出站操作）

**2、** ChannelPipeline实现了一种高级形式的拦截过滤器模式，使用户可以完全控制事件的处理方式，以及Channel中各个的ChannelHandler如何相互交互；

**3、** 在netty中，每个Channel都有且仅有一个ChannelPipeline与之对应，他们的组成关系如下；

1、一个Channel包含了一个ChannelPipeline，而ChannelPipeline中又维护了一个由ChannelHandlerContext组成的双线链表，并且每个ChannelHandlerContext中又关联着一个ChannelHandler。

2、入站事件和出站事件在一个双向链表中，入站事件会从链表head往后传递到最后一个入站的handler，出站事件会从链表tail往前传递到最前一个出站的handler，两种类型的handler互不干扰。

**4、** 常用方法；

1、public final ChannelPipeline addFirst(ChannelHandler... handlers)

把一个业务处理类（handler）添加到链中的第一个位置。

2、public final ChannelPipeline addLast(ChannelHandler... handlers)

把一个业务处理类（handler）添加到链中的最后一个位置。

## 七、ChannelHandlerContext

**1、** 保存Channel相关的所有上下文信息，同时关联一个ChannelHandler对象；

**2、** 即ChannelHandlerContext中包含一个具体的事件处理器ChannelHandler，同时ChannelHandlerContext中也绑定了对应的pipeline和Channel的信息，方便对ChannelHandler进行调用；

**3、** 常用方法；

1、ChannelFuture close()

关闭通道。

2、ChannelOutboundInvoker flush()

刷新。
3、ChannelFuture writeAndFlush(Object msg)

将数据写到ChannelPipeline中当前ChannelHandler的下一个ChannelHandler开始处理（出站）。

## 八、ChannelOption

**1、** netty在创建Channel实例后，一般都需要设置ChannelOption参数；

**2、** ChannelOption参数如下；

1、ChannelOption.SO_BACKLOG

对应TCP/IP协议listen函数中的backlog参数，用来初始化服务器可连接队列大小。服务器端处理客户端连接请求是顺序处理的，所以同一时间只能处理一个客户端连接。多个客户端来的时候，服务端将不能处理的客户端连接请求放在队列中等待处理，backlog参数指定了队列的大小。

2、ChannelOption.SO_KEEPALIVE

一直保持连接活动状态。

## 九、EventLoopGroup和其实现类NioEventLoopGroup

**1、** EventLoopGroup是一组EventLoop的抽象，netty为了更好的利用多核CPU资源，一般会有多个EventLoop同时工作，每个EventLoop维护着一个Selector实例；

**2、** EventLoopGroup提供next接口，可以从组里面按照一定规则获取其中一个EventLoop来处理任务在netty服务器端编程中，我们一般都需要提供两个EventLoopGroup，例如：BossEventLoopGroup和WorkerEventLoopGroup；

**3、** 通常一个服务端口即一个ServerSocketChannel对应一个Selector和一个EventLoop线程BossEventLoop负责接收客户端的连接并将SocketChannel交给WorkerEventLoopGroup来进行IO处理；

1、BossEventLoopGroup通常是一个单线程的EventLoop，EventLoop维护着一个注册了ServerSocketChannel的Selector实例。BossEventLoop不断轮询Selector将连接事件分离出来。

2、通常是OP_ACCEPT事件，然后将接收到的SocketChannel交给WorkerEventLoopGroup。

3、WorkerEventLoopGroup会由next选择其中一个EventLoopGroup来将这个SocketChannel注册到其维护的Selector并对其后续的IO事件进行处理。

**4、** 常用方法；

1、public NioEventLoopGroup()

构造方法。

2、public Future shutdownGracefully()

断开连接，关闭线程。
