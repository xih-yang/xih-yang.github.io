# 20、Netty 源码解析 - Netty核心模块1
- 来源：https://ddkk.com/zhuanlan/server/netty/1/20.html
- 分类：服务器框架
- 分组：教程目录
## 一、Bootstrap和ServerBootstrap

1、Bootstrap意思是引导，一个Netty应用通常由一个Bootstrap开始，主要作用是配置整个Netty程序，串联各个组件，Netty中Bootstrap类是客户端程序的启动引导类，ServerBootstrap是服务器端启动引导类。

2、**常见的方法：**

- public ServerBootstrap group(EventLoopGroup parentGroup, EventLoopGroup childGroup)：该方法用于服务器端，用来设置两个 EventLoopGroup
- public B group(EventLoopGroup group)：该方法用于客户端，用来设置一个 EventLoopGroup
- public B channel(Class`` channelClass)：该方法用来设置一个服务器端的通道实现
- public B option(ChannelOption option, T value)：用来给 ServerChannel 添加配置
- public ServerBootstrap childOption(ChannelOption childOption, T value)：用来给接收到的通道添加配置
- public B handler(ChannelHandler handler)：对应 bossGroup
- public ServerBootstrap childHandler(ChannelHandler childHandler)：该方法用来设置业务处理类（自定义的handler），对应 workerGroup
- public ChannelFuture bind(int inetPort)：该方法用于服务器端，用来设置占用的端口
- public ChannelFuture connect(String inetHost, int inetPort)：该方法用于客户端，用来连接服务器

## 二、Future和ChannelFuture

1、Netty中所有的 IO 操作都是异步的，不能立刻得知消息是否被正确处理。但是可以过一会等它执行完成或者直接注册一个监听，具体的实现就是通过Future和ChannelFuture，它们可以注册一个监听，当操作执行成功或失败时监听会自动触发注册的监听事件。

2、**常见的方法：**

- Channel channel()：返回当前正在进行 IO 操作的通道
- ChannelFuture sync()：等待异步操作执行完毕

## 三、Channel

1、Netty网络通信的组件，能够用于执行网络 IO 操作

2、通过Channel可获得当前网络连接的通道的状态

3、通过Channel可获得网络连接的配置参数（例如接收缓冲区大小）

4、Channel 提供异步的网络 IO 操作（如建立连接、读写、绑定端口），异步调用意味着任何 IO 调用都将立即返回，并且不保证在调用结束时所请求的 IO 操作已完成

5、调用立即返回一个 ChannelFuture 实例，通过注册监听器到 ChannelFuture 上，可以在 IO 操作成功、失败或取消时回调通知调用方

6、支持关联 IO 操作与对应的处理程序

7、不同协议、不同的阻塞类型的连接都有不同的 Channel 类型与之对应，常用的Channel类型：

- NioSocketChannel：异步的客户端 TCP Socket连接
- NioServerSocketChannel：异步的服务器端 TCP Socket连接
- NioDatagramChannel：异步的UDP连接
- NioSctpChannel：异步的客户端 Sctp 连接
- NioSctpServerChannel：异步的 Sctp 服务器端连接

这些通道涵盖了UDP和TCP网络IO以及文件IO。

## 四、Selector

1、Netty基于 Selector 对象实现 IO 多路复用，通过 Selector 一个线程可以监听多个连接的 Channel 事件

2、当向一个 Selector 中注册 Channel 后，Selector 内部的机制就可以自动不断地查询（Select）这些注册的Channel是否有已就绪的IO事件（例如可读、可写、网络连接完成等），这样程序就可以很简单地使用一个线程高效地管理多个Channe

## 五、ChannelHandler及其实现类

1、ChannelHandler是一个接口，处理 IO 事件或拦截 IO 操作，并将其转发到其 ChannelPipeline（业务处理链）中的下一个处理程序。

2、ChannelHandler本身并没有提供很多方法，因为这个接口有许多的方法需要实现，方便使用期间，可以继承它的子类。

3、ChannelHandler及其实现类

- ChannelInboundHandler：用于处理入站 IO 事件
- ChannelOutboundHandler：用于处理出站 IO 操作
- ChannelInboundHandlerAdapter：用于处理入站 IO 事件
- ChannelOutboundHandlerAdapter：用于处理出站 IO 操作
- ChannelDuplexHandler：用于处理入站和出站事件

4、我们经常需要自定义一个 Handler 类去继承 ChannelInboundHandlerAdapter，然后通过重写相应方法实现业务逻辑，对应的方法有：

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
	//读取数据完毕事件
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
	// 通道发生异常事件
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause)
            throws Exception {
        ctx.fireExceptionCaught(cause);
    }
}
```

## 六、Pipeline和ChannelPipeline

1、ChannelPipeline 是一个 Handler 的集合，它负责处理和拦截 inbound 或者outbound 的事件和操作，相当于一个贯穿 Netty 的链。（也可以这样理解：ChannelPipeline 是保存 ChannelHandler 的List，用于处理或拦截Channel的入站事件和出站操作）

2、ChannelPipeline 实现了一种高级形式的拦截过滤器模式，使用户可以完全控制事件的处理方式，以及Channel中各个的 ChannelHandler 如何相互交互

3、在 Netty 中每个 Channel 都有且仅有一个 ChannelPipeline 与之对应，它们的组成关系如下：

**1、** 一个Channel包含了一个ChannelPipeline，而ChannelPipeline中又维护了一个由ChannelHandlerContext组成的双向链表，并且每个ChannelHandlerContext中又关联着一个ChannelHandler；

**2、** 入站事件和出站事件在一个双向链表中，入站事件会从链表head往后传递到最后一个入站的handler，出站事件会从链表tail往前传递到最前一个出站的handler，两种类型的handler互不干扰；

4、常用方法

- ChannelPipeline addLast(ChannelHandler… handlers)：把一个业务处理类（handler）添加到链表中的最后一个位置
- ChannelPipeline addFirst(ChannelHandler… handlers)：把一个业务处理类（handler）添加到链表中的第一个位置
