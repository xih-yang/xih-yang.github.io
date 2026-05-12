# 02、Netty学习 - Netty 架构设计
- 来源：https://ddkk.com/zhuanlan/server/netty/5/2.html
- 分类：服务器框架
- 分组：教程目录
上一篇文章，我们对 `Netty`做了一个基本的概述，知道什么是`Netty`以及`Netty`的简单应用。

本篇文章我们就来说说`Netty`的架构设计，解密高并发之道。学习一个框架之前，我们首先要弄懂它的设计原理，然后再进行深层次的分析。

接下来我们从三个方面来分析 Netty 的架构设计。

## Selector 模型

`Java NIO` 是基于 Selector 模型来实现非阻塞的 `I/O`。Netty 底层是基于 `Java NIO` 实现的，因此也使用了 Selector 模型。

`Selector` 模型解决了传统的阻塞 I/O 编程一个客户端一个线程的问题。Selector 提供了一种机制，用于监视一个或多个 NIO 通道，并识别何时可以使用一个或多个 NIO 通道进行数据传输。这样，一个线程就可以管理多个通道，从而管理多个网络连接。

`Selector` 提供了选择执行已经就绪的任务的能力。从底层来看，Selector 会轮询 Channel 是否已经准备好执行每个 I/O 操作。Selector 允许单线程处理多个 Channel 。Selector 是一种多路复用的技术。

### SelectableChannel

并不是所有的 Channel 都是可以被 Selector 复用的，只有抽象类 `SelectableChannel`的子类才能被 Selector 复用。

例如，`FileChannel` 就不能被选择器复用，因为 `FileChannel` 不是`SelectableChannel`的子类。

为了与Selector 一起使用，`SelectableChannel`必须首先通过`register`方法来注册此类的实例。此方法返回一个新的`SelectionKey`对象，该对象表示`Channel`已经在`Selector`进行了注册。向`Selector`注册后，`Channel`将保持注册状态，直到注销为止。

一个Channel 最多可以使用任何一个特定的 Selector 注册一次，但是相同的 Channel 可以注册到多个 Selector 上。可以通过调用 `isRegistered`方法来确定是否向一个或多个 Selector 注册了 Channel。

`SelectableChannel`可以安全的供多个并发线程使用。

### Channel 注册到 Selector

使用`SelectableChannel`的`register`方法，可将`Channel`注册到`Selector`。方法接口源码如下：

```java
    public final SelectionKey register(Selector sel, int ops)
        throws ClosedChannelException {
        return register(sel, ops, null);
    }
    public abstract SelectionKey register(Selector sel, int ops, Object att) throws ClosedChannelException;
```

其中各选项说明如下：

- sel：指定 Channel 要注册的 Selector。
- ops : 指定 Selector需要查询的通道的操作。

一个Channel在Selector注册其代表的是一个`SelectionKey`事件，`SelectionKey`的类型包括：

- OP_READ：可读事件；值为：1` Netty是一款异步的事件驱动的网络应用程序框架。在 Netty 中，事件是指对某些操作感兴趣的事。例如，在某个Channel注册了 OP_READ，说明该 Channel 对读感兴趣，当 Channel 中有可读的数据时，它会得到一个事件的通知。

在`Netty` 事件驱动模型中包括以下核心组件。

### Channel

> Channel（管道）是 Java NIO 的一个基本抽象，代表了一个连接到如硬件设备、文件、网络 socket 等实体的开放连接，或者是一个能够完成一种或多种不同的I/O 操作的程序。

### 回调

> 回调 就是一个方法，一个指向已经被提供给另外一个方法的方法的引用。这使得后者可以在适当的时候调用前者，Netty 在内部使用了回调来处理事件；当一个回调被触发时，相关的事件可以被一个ChannelHandler接口处理。

例如：在上一篇文章中，Netty 开发的服务端的管道处理器代码中，当`Channel`中有可读的消息时，`NettyServerHandler`的回调方法`channelRead`就会被调用。

```java
public class NettyServerHandler extends ChannelInboundHandlerAdapter {
    //读取数据实际(这里我们可以读取客户端发送的消息)
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        System.out.println("server ctx =" + ctx);
        Channel channel = ctx.channel();
        //将 msg 转成一个 ByteBuf
        //ByteBuf 是 Netty 提供的，不是 NIO 的 ByteBuffer.
        ByteBuf buf = (ByteBuf) msg;
        System.out.println("客户端发送消息是:" + buf.toString(CharsetUtil.UTF_8));
        System.out.println("客户端地址:" + channel.remoteAddress());
    }
    //处理异常, 一般是需要关闭通道
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        ctx.close();
    }
}
```

### Future

> Future 可以看作是一个异步操作的结果的占位符；它将在未来的某个时刻完成，并提供对其结果的访问，Netty 提供了 ChannelFuture 用于在异步操作的时候使用，每个 Netty 的出站 I/O 操作都将返回一个 ChannelFuture(完全是异步和事件驱动的)。

以下是一个 `ChannelFutureListener`使用的示例。

```java
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ChannelFuture future = ctx.channel().close();
        future.addListener(new ChannelFutureListener() {
            @Override
            public void operationComplete(ChannelFuture channelFuture) throws Exception {
                //..
            }
        });
    }
```

### 事件及处理器

在Netty 中事件按照出/入站数据流进行分类：

**入站数据或相关状态更改触发的事件包括：**

- 连接已被激活或者失活。
- 数据读取。
- 用户事件。
- 错误事件，

**出站事件是未来将会出发的某个动作的操作结果：**

- 打开或者关闭到远程节点的连接。
- 将数据写或者冲刷到套接字。

每个事件都可以被分发给`ChannelHandler`类中的某个用户实现的方法。如下图展示了一个事件是如何被一个这样的`ChannelHandler`链所处理的。

`ChannelHandler` 为处理器提供了基本的抽象，可理解为一种为了响应特定事件而被执行的回调。

## 责任链模式

> 责任链模式(Chain of Responsibility Pattern)是一种行为型设计模式，它为请求创建了一个处理对象的链。其链中每一个节点都看作是一个对象，每个节点处理的请求均不同，且内部自动维护一个下一节点对象。当一个请求从链式的首端发出时，会沿着链的路径依次传递给每一个节点对象，直至有对象处理这个请求为止。

责任链模式的重点在这个 "链"上，由一条链去处理相似的请求，在链中决定谁来处理这个请求，并返回相应的结果。在Netty中，定义了`ChannelPipeline`接口用于对责任链的抽象。

责任链模式会定义一个抽象处理器（Handler）角色，该角色对请求进行抽象，并定义一个方法来设定和返回对下一个处理器的引用。在Netty中，定义了`ChannelHandler`接口承担该角色。

### 责任链模式的优缺点

优点：

- 发送者不需要知道自己发送的这个请求到底会被哪个对象处理掉，实现了发送者和接受者的解耦。
- 简化了发送者对象的设计。
- 可以动态的添加节点和删除节点。

缺点：

- 所有的请求都从链的头部开始遍历，对性能有损耗。
- 不方便调试。由于该模式采用了类似递归的方式，调试的时候逻辑比较复杂。

使用场景：

- 一个请求需要一系列的处理工作。
- 业务流的处理，例如文件审批。
- 对系统进行扩展补充。

### ChannelPipeline

Netty 的`ChannelPipeline`设计，就采用了责任链设计模式， 底层采用双向链表的数据结构,，将链上的各个处理器串联起来。

客户端每一个请求的到来，Netty都认为，`ChannelPipeline`中的所有的处理器都有机会处理它，因此，对于入栈的请求，全部从头节点开始往后传播，一直传播到尾节点(来到尾节点的msg会被释放掉)。

**入站事件**：通常指 IO 线程生成了入站数据（通俗理解：从 socket 底层自己往上冒上来的事件都是入站）。

比如`EventLoop`收到`selector`的`OP_READ`事件，入站处理器调用`socketChannel.read(ByteBuffer)`接受到数据后，这将导致通道的`ChannelPipeline`中包含的下一个中的`channelRead`方法被调用。

**出站事件**：通常指 IO 线程执行实际的输出操作（通俗理解：想主动往 socket 底层操作的事件的都是出站）。

比如`bind`方法用意时请求`server socket`绑定到给定的`SocketAddress`，这将导致通道的`ChannelPipeline`中包含的下一个出站处理器中的`bind`方法被调用。

### 将事件传递给下一个处理器

处理器必须调用`ChannelHandlerContext`中的事件传播方法，将事件传递给下一个处理器。

入站事件和出站事件的传播方法如下图所示：

以下示例说明了事件传播通常是如何完成的：

```java
public class MyInboundHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        System.out.println("Connected!");
        ctx.fireChannelActive();
    }
}
public class MyOutboundHandler extends ChannelOutboundHandlerAdapter {
    @Override
    public void close(ChannelHandlerContext ctx, ChannelPromise promise) throws Exception {
        System.out.println("Closing...");
        ctx.close(promise);
    }
}
```

## 总结

正是由于 **Netty 的分层架构设计非常合理**，基于 Netty 的各种应用服务器和协议栈开发才能够如雨后春笋般得到快速发展。
