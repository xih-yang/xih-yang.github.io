# 14、Netty入门 - Netty核心组件
- 来源：https://ddkk.com/zhuanlan/server/netty/2/14.html
- 分类：服务器框架
- 分组：教程目录
## Bootstrap、ServerBootstrap

**1、** Bootstrap意思是引导，一个Netty应用通常由一个Bootstrap开始，主要作用是配置整个Netty程序，串联各个组件，Netty中Bootstrap类是客户端程序的启动引导类，ServerBootstrap是服务端启动引导类；

**2、** 常见的方法有；

- public ServerBootstrap group(EventLoopGroup parentGroup, EventLoopGroup childGroup)，该方法用于服务器，用来设置两个EventLoop。
- public B group(EventLoopGroup group)，该方法用来客户端，用来设置一个EventLoopGroup。
- public B channel(Class`` channelClass)，该方法用来设置一个服务器端的通道实现。
- public `` B option(ChannelOption`` option, T value)，用来给 ServerChannel添加配置。
- public `` ServerBootstrap childOption(ChannelOption`` childOption, T value)，用来给接收到的通道添加配置。
- public ServerBootstrap childHandler(ChannelHandler childHandler)，该方法用来设置业务处理类（自定义的handler）。
- public ChannelFuture bind(int inetPort)，该方法用于服务器端，用来设置占用的端口号。
- public ChannelFuture connect(String inetHost, int inetPort)，该方法用于客户端，用来连接服务器。

## Future、ChannelFuture

**1、** Netty中所有的IO操作都是异步的，不能立刻得知消息是否被正确处理但是可以过一会等它执行完成或者直接注册一个监听，具体的实现就是通过Future和ChannelFuture，他们可以注册一个监听，当操作执行成功或失败时监听会自动触发注册的监听事件；

**2、****常见的方法有**；

- Channel channel()，返回当前正在进行IO操作的通道。
- ChannelFuture sync()，等待异步操作执行完毕。

## Channel

**1、** Netty网络通信的组件，能够用于执行网络I/O操作；

**2、** 通过Channel可获得当前网络连接的通道的状态；

**3、** 通过Channel可获得网络连接的配置参数；

**4、** Channel提供异步的网络I/O操作（如建立连接，读写，绑定端口），异步调用意味着任何I/O调用都将立即返回，并且不保证在调用结束时所请求的I/O操作已完成；

**5、** 调用立即返回一个ChannelFuture实例，通过注册监听器到ChannelFuture上，可以I/O操作成功、失败或取消时回调通知调用方；

**6、** 支持关联I/O操作与对应的处理程序；

**7、** 不同协议、不同的阻塞类型的连接都有不同的Channel类型与之对应，常用的Channel类型：

**8、** NioSocketCHannel，异步的客户端TCPSocket连接；

**9、** NioServerSocketChannel，异步的服务器端TCPSocket连接；

**10、** NioDatagramChannel，异步的UDP连接；

**11、** NioSctpChannel，异步的客户端Sctp连接；

**12、** NioSctpServerChannel，异步的Sctp服务器连接，这些通道涵盖了UDP和TCP网络IO以及文件IO；

## Selector

**1、** Netty基于Selector对象实现I/O多路复用，通过Selector一个线程可以监听多个连接的Channel事件；

**2、** 当向一个Selector中注册Channel后Selector内部的机制就可以不断的查询（Select）这些注册的Channel是否有已就绪的I/O事件（例如可读，可写，网络连接完成等），这样程序就可以很简单地使用一个线程高效地管理多个Channel；

## ChannelHandler 及其实现类

**1、** ChannelHandler是一个接口，处理I/O事件或拦截I/O操作，并将其转发到其ChannelPipeline（业务处理链）中的下一个处理程序；

**2、** ChannelHandler本身并没有提供很多方法，因为这个接口有许多的方法需要实现，方便使用期间，可以继承它的子类；

**3、** ChannelHandler及其实现类一览图；

- ChannelInboundHandler 用于处理入站 I/O 事件。
- ChannelOutboundHandler 用于处理出站 I/O 事件。
- ChannelInboundHandlerAdapter 用于处理入站 I/O 事件。
- ChannelOutboundHandlerAdapter 用于处理出站 I/O 操作。
- ChannelDuplexHandler 用于处理入站和出站操作。

**1、** 我们经常需要自定义一个Handler类去继承ChannelInboundHandlerAdapter，然后通过重写相应方法实现业务逻辑，我们接下来看看一般都需要重写哪些方法；

```java
public class ChannelInboundHandlerAdapter extends ChannelHandlerAdapter implements ChannelInboundHandler {
    @Override
    public void channelRegistered(ChannelHandlerContext ctx) throws Exception {
        ctx.fireChannelRegistered();
    }
    @Override
    public void channelUnregistered(ChannelHandlerContext ctx) throws Exception {
        ctx.fireChannelUnregistered();
    }
    // 通道就绪事件
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        ctx.fireChannelActive();
    }
    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        ctx.fireChannelInactive();
    }
    // 通道读取数据事件
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ctx.fireChannelRead(msg);
    }
    // 通道读取完毕事件
    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.fireChannelReadComplete();
    }
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        ctx.fireUserEventTriggered(evt);
    }
    @Override
    public void channelWritabilityChanged(ChannelHandlerContext ctx) throws Exception {
        ctx.fireChannelWritabilityChanged();
    }
    // 异常处理
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause)
            throws Exception {
        ctx.fireExceptionCaught(cause);
    }
}
```

## Pipeline和ChannelPipeline

**ChannelPipeline是一个重点：**

**1、** ChannelPipeline是一个Handler的集合，它负责处理和拦截inbound或者outbound的事件和操作，相当于一个贯穿Netty的链（也可以这样理解：ChannelPipeline是保存ChannelHandler的List，用于处理和拦截Channel的入站事件和出站操作）；

**2、** ChannelPipeline实现了一种高级形式的拦截过滤器模式，使用户可以完全控制事件的处理方式，以及Channel中各个的ChannelHandler如何相互交互；

**3、** 在Netty中每个Channel都有且仅有一个ChannelPipeline与之对应，他们的组成关系如下；

- 一个Channel包含了一个ChannelPipeline，而 ChannelPipeline 中又维护了一个由 ChannelHandlerContext 组成的双向链表，并且每个 ChannelHandlerContext 中又关联着一个 ChannelHandler。
- 入站事件和出站事件在一个双向链表中，入站事件会从链表 head 往后传递到最后一个入站的 handler，出站事件会从链表 tail 往前传递到最前一个出站的 handler，两种类型的handler互不干扰。

**4、****常用方法**；

- ChannelPipeline addFirst(ChannelHandler... handlers)，把一个业务处理类（handler）添加到链中的第一个位置。
- ChannelPipeline addLast(ChannelHandler... handlers)，把一个业务处理类（handler）添加到链中的最后一个位置。

## ChannelHandlerContext

**1、** 保存Channel相关的所有上下文信息，同时关联一个ChannelHandler对象；

**2、** 即ChannelHandlerContext中包含一个具体的事件处理器ChannelHandler，同时ChannelHandlerContext中也绑定了对应的pipeline和Channel信息，方便对ChannelHandler进行调试；

**3、****常用方法**；

- ChannelFuture close()，关闭通道
- ChannelOutboundInvoker flush()，刷新
- ChannelFuture writeAndFlush(Object msg)，将数据写到 ChannelPipeline 中当前ChannelHandler 的下一个 ChannelHandler开始处理（出站）

## ChannelOption

**1、** Netty在创建Channel实例后，一般都需要设置ChannelOption参数；

**2、** ChannelOption参数如下：

- ChannelOption.SO_BACKLOG

对应TCP/IP 协议 listen 函数中的backlog 参数，用来初始化服务器可连接队列大小。服务端处理客户端连接请求是顺序处理的，所以同一时间只能处理一个客户端连接。多个客户端来的时候，服务端将不能处理的客户端连接请求放在队列中等待处理，backlog 参数指定了队列的大小。

- ChannelOption.SO_KEEPALIVE

一直保持连接活动状态

## EventLoopGroup 和其实现类 NioEventLoopGroup

**1、** EventLoopGroup是一组EventLoop的抽象，Netty为了更好的利用多核CPU资源，一般会有多个EventLoop同时工作，每个EventLoop维护着一个Selector实例；

**2、** EventLoopGroup提供next接口，可以从组里面按照一定规则获取其中一个EventLoop来处理任务在Netty服务器端编程中，我们一般都需要提供两个EventLoopGroup，例如：BossEventLoopGroup和WorkerEventLoopGroup；

**3、** 通常一个服务端口即一个ServerSocketChannel对应一个Selector和一个EventLoop线程BossEventLoop负责接收客户端的连接并将SocketChannel交给WorkerEventLoopGroup来进行IO处理，如下图所示；

- BossEventLoopGroup 通常是一个单线程的 EventLoop，EventLoop 维护着一个注册了 ServerSocketChannel 的Selector 实例 BossEventLoop 不断轮询 Selector 将连接事件分离出来。
- 通常是OP_ACCEPT 事件，然后将接收到的 SocketChannel 交给 WorkerEventLoopGroup。
- WorkerEventLoopGroup 会由 next 选择其中一个EventLoopGroup 来将这个 SocketChannel 注册到其维护的 Selector 并对其后续的 IO 事件进行处理。

**4、** 常用方法；

- public NioEventLoopGroup()，构造方法
- public Future`` shutdownGracefully()，断开连接，关闭线程

## Unpooled类

**1、** Netty提供一个专门用来操作缓冲区（即Netty的数据容器）的工具类；

**2、** 常用方法如下所示；

//通过给定的数据的数据和字符编码返回一个 ByteBuf 对象（类似于 NIO 中的 ByteBuffer，但有区别）

public static ByteBuf copiedBuffer(CharSequence strng, Charset charset)

**3、** 举例说明Unpooled获取Netty的数据容器ByteBuf的基本使用；

案例一代码：

```java
public class NettyByteBuf001 {
    public static void main(String[] args) {
        // 创建一个ByteBuf
        // 说明
        // 1.创建对象，该对象包含一个数组arr，是一个byte[10]
        // 2.在 netty 的buffer中，不需要使用 flip 进行反转，底层维护了一个 readerIndex 和 writerIndex
        // 3. 通过  readIndex 和 writeIndex 和 capacity，将 buffer 分成三个区域
        // 0 --- readerIndex 已经读取的区域
        // readerIndex --- writerIndex，可读的区域
        // writerIndex --- capacity，可写的区域
        ByteBuf buffer = Unpooled.buffer(10);
        for (int i = 0; i < 10; i++) {
            buffer.writeByte(i);
        }
        System.out.println("capacity=" + buffer.capacity());
        // 输出
        /*for (int i = 0; i < buffer.capacity(); i++) {
            System.out.println(buffer.getByte(i));
        }*/
        for (int i = 0; i < buffer.capacity(); i++) {
            System.out.println(buffer.readByte());
        }
    }
}
```

> 可通过调试查看 readerIndex 和 writerIndex 的变化

案例二代码：

```java
public class NettyByteBuf002 {
    public static void main(String[] args) {
        // 创建一个ByteBuf
        ByteBuf byteBuf = Unpooled.copiedBuffer("hello,world!", Charset.forName("utf-8"));
        // 使用相关的 API
        if (byteBuf.hasArray()) { // true
            byte[] content = byteBuf.array();
            // 将 content 转成字符串
            System.out.println(new String(content, Charset.forName("utf-8")));
            System.out.println("byteBuf=" + byteBuf);
            System.out.println(byteBuf.arrayOffset());
            System.out.println(byteBuf.readerIndex());
            System.out.println(byteBuf.writerIndex());
            System.out.println(byteBuf.capacity());
            System.out.println(byteBuf.readByte());
            // 当前可读的字节数
            int len = byteBuf.readableBytes();
            System.out.println("len=" + len);
            // 使用for循环 取出各个字节
            for (int i = 0; i < len; i++) {
                System.out.println((char) byteBuf.getByte(i));
            }
            System.out.println(byteBuf.getCharSequence(0, 5, Charset.forName("utf-8")));
            System.out.println(byteBuf.getCharSequence(4, 8, Charset.forName("utf-8")));
        }
    }
}
```
