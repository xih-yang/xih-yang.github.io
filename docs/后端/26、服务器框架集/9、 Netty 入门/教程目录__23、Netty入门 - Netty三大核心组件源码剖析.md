# 23、Netty入门 - Netty三大核心组件源码剖析
- 来源：https://ddkk.com/zhuanlan/server/netty/2/23.html
- 分类：服务器框架
- 分组：教程目录
Netty中的 ChannelPipeline、ChannelHandler 和 ChannelHandlerContext 是非常核心的组件，从源码来分析 Netty 是如何设计这三个核心组件的，并分析是如何创建和协调工作的。

## 1.ChannelPipeline、ChannelHandler 和 ChannelHandlerContext介绍

## 1.1三者关系

1、每当 ServerSocket 创建一个新的连接，就会创建一个 Socket，对应的就是目标客户端。

2、每一个新创建的 Socket 都将会分配一个全新的 ChannelPipeline（以下简称 pipeline）。

3、每一个 ChannelPipeline 内部都含有多个 ChannelHandlerContext（以下简称 Context）。

4、他们一起组成了双向链表，这些 Context 用于包装我们调用 addLast 方法时添加的 ChannelHandler（以下简称 handler）。

- 上图中：ChannelSocket 和 ChannelPipeline 是一对一的关联关系，而 pipeline 内部的多个 Context 形成了链表，Context 只是对 Handler 的封装。
- 当一个请求进来的时候，会进入 Socket 对应的 pipeline，并经过 pipeline 所有的 handler，就是设计模式中的过滤器模式。

## 1.2 ChannelPipeline 作用及设计

pipeline的接口设计

可以看到该接口继承了 ChannelInboundInvoker、ChannelOutboundInvoker、Iterable 接口，表示他可以调用 数据出站的方法和入站的方法，同时也能遍历内部的链表，看看他的几个代表性的方法，基本上都是针对 handler 链表的插入，追加，删除，替换操作，类似是一个 LinkedList。同时，也能返回 channel（也就是 socket）。

在pipeline 的接口文档上，提供了一幅图

对上图的解释说明：

- 这是一个 handler 的 list，handler 用于处理或拦截入站事件和出站事件，pipeline 实现了过滤器的高级形式，以便用户控制事件如何处理以及 handler 在 pipeline 中如何交互。
- 上图描述了一个典型的 handler 在 pipeline 中处理 I/O 事件的方式，IO 事件由 inboundHandler 或者 outboundHandler 处理，并通过调用 ChannelHandlerContext.fireChannelRead 方法转发给其最近的处理程序。
- 入站事件由入站处理程序以自下而上的方向处理，如图所示。入站处理程序通常处理由图底部的 I/O 线程生成入站数据。入站数据通常从如 SocketChannel.read(ByteBuffer) 获取。
- 通常一个 pipeline 有多个 handler，例如，一个典型的服务器在每个通道的管道中都会有以下处理程序。
- 协议解码器 - 将二进制数据转换为 Java 对象。
- 协议编码器 - 将 Java 对象转换为二进制数据。
- 业务逻辑处理程序 - 执行实际业务逻辑（例如访问数据库）
- 你的业务程序不能将线程阻塞，会影响 IO 的速度，进而影响整个 Netty 程序的性能。如果你的业务程序很快，就可以放在 IO 线程中，反之，你需要异步执行。或者在添加 handler 的时候添加一个线程池，例如：

```java
// 下面这个任务执行的时候，将不会阻塞 IO 线程，执行的线程来自 group 线程池
pipeline.addLast(group, "handler", new MyBusinessLogicHandler())
```

## 1.3 ChannelHandler 作用及设计

1、源码

```java
public interface ChannelHandler {
    // 当把 ChannelHandler 添加到 pipeline 时被调用
    void handlerAdded(ChannelHandlerContext ctx) throws Exception;
    // 当从 pipeline 中移除时调用
    void handlerRemoved(ChannelHandlerContext ctx) throws Exception;
    // 当处理过程中在 pipeline 发生异常时调用
    @Deprecated
    void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception;
}
```

2、ChannelHandler 的作用就是处理 IO 事件或拦截 IO 事件，并将其转发给下一个处理程序 ChannelHandler。Handler 处理事件时分入站和出站的，两个方向的操作都是不同的，因此，Netty 定义了两个子接口继承 ChannelHandler。

3、ChannelInboundHandler 入站事件接口

```java
public interface ChannelInboundHandler extends ChannelHandler {
    void channelRegistered(ChannelHandlerContext ctx) throws Exception;
    void channelUnregistered(ChannelHandlerContext ctx) throws Exception;
    void channelActive(ChannelHandlerContext ctx) throws Exception;
    void channelInactive(ChannelHandlerContext ctx) throws Exception;
    void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception;
    void channelReadComplete(ChannelHandlerContext ctx) throws Exception;
    void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception;
    void channelWritabilityChanged(ChannelHandlerContext ctx) throws Exception;
    @Override
    @SuppressWarnings("deprecation")
    void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception;
}
```

- channelActive 用于当 Channel 处于活动状态时被调用；
- channelRead 当从 Channel 读取数据时被调用等等方法。
- 程序员需要重写一些方法，当发生关注的事件，需要在方法中实现我们的业务逻辑，因为当事件发生时，Netty 会回调对应的方法。

4、ChannelOutboundHandler 出站事件接口

```java
public interface ChannelOutboundHandler extends ChannelHandler {
    void bind(ChannelHandlerContext ctx, SocketAddress localAddress, ChannelPromise promise) throws Exception;
    void connect(
            ChannelHandlerContext ctx, SocketAddress remoteAddress,
            SocketAddress localAddress, ChannelPromise promise) throws Exception;
    void disconnect(ChannelHandlerContext ctx, ChannelPromise promise) throws Exception;
    void close(ChannelHandlerContext ctx, ChannelPromise promise) throws Exception;
    void deregister(ChannelHandlerContext ctx, ChannelPromise promise) throws Exception;
    void read(ChannelHandlerContext ctx) throws Exception;
    void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception;
    void flush(ChannelHandlerContext ctx) throws Exception;
}
```

- bind 方法，当请求将 Channel 绑定到本地地址时调用。
- close 方法，当请求关闭 Channel 时调用等等。
- 出站操作都是一些连接和写出数据类似的方法。

5、ChannelDuplexHandler 处理出站和入站事件

```java
public class ChannelDuplexHandler extends ChannelInboundHandlerAdapter implements ChannelOutboundHandler {
    @Override
    public void bind(ChannelHandlerContext ctx, SocketAddress localAddress,
                     ChannelPromise promise) throws Exception {
        ctx.bind(localAddress, promise);
    }
    @Override
    public void connect(ChannelHandlerContext ctx, SocketAddress remoteAddress,
                        SocketAddress localAddress, ChannelPromise promise) throws Exception {
        ctx.connect(remoteAddress, localAddress, promise);
    }
    @Override
    public void disconnect(ChannelHandlerContext ctx, ChannelPromise promise)
            throws Exception {
        ctx.disconnect(promise);
    }
    @Override
    public void close(ChannelHandlerContext ctx, ChannelPromise promise) throws Exception {
        ctx.close(promise);
    }
    @Override
    public void deregister(ChannelHandlerContext ctx, ChannelPromise promise) throws Exception {
        ctx.deregister(promise);
    }
    @Override
    public void read(ChannelHandlerContext ctx) throws Exception {
        ctx.read();
    }
    @Override
    public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception {
        ctx.write(msg, promise);
    }
    @Override
    public void flush(ChannelHandlerContext ctx) throws Exception {
        ctx.flush();
    }
}
```

- ChannelDuplexHandler 间接实现了入站接口并直接实现了出站接口。
- 是一个通用的能够同时处理入站事件和出站事件的类。

## 1.4 ChannelHandlerContext 作用及设计

1、ChannelHandlerContext UML图

ChannelHandlerContext 继承了出站方法调用接口和入站方法调用接口

2、ChannelInboundInvoker 和 ChannelOutboundInvoker 部分源码

这两个invoker 就是针对入站或出站方法来的，就是在 入站或出站 handler 的外层在包装一层，达到在方法前后拦截并做一些特定操作的目的

3、ChannelHandlerContext部门源码

- ChannelHandlerContext 不仅仅是继承了他们两个的方法，同时也定义了一些自己的方法。
- 这些方法能够获取 Context 上下文环境中对应的比如 channel、executor、handler、pipeline、内存分配器、关联的 handler 是否被删除。
- Context 就是包装了 handler 相关的一切，以方便 Context 可以在 pipeline 方便的操作 handler。

## 2.ChannelPipeline、channelHandler、ChannelHandlerContext 创建过程

分为3个步骤来看创建的过程：

- 任何一个 ChannelSocket 创建的同时都会创建一个 pipeline；
- 当用户或系统内部调用 pipeline 的 add*** 方法添加 handler 时，都会创建一个包装这个 handler 的context。
- 这些 context 在 pipeline 中组成了双向链表。

## 2.1 Socket 创建的时候创建 pipeline

源码还是基于io.netty.example.echo包下的源码进行debbug

服务端源码：

```java
public final class EchoServer {
    static final boolean SSL = System.getProperty("ssl") != null;
    static final int PORT = Integer.parseInt(System.getProperty("port", "8007"));
    public static void main(String[] args) throws Exception {
        // Configure SSL.
        final SslContext sslCtx;
        if (SSL) {
            SelfSignedCertificate ssc = new SelfSignedCertificate();
            sslCtx = SslContextBuilder.forServer(ssc.certificate(), ssc.privateKey()).build();
        } else {
            sslCtx = null;
        }
        // Configure the server.
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
             .channel(NioServerSocketChannel.class)
             .option(ChannelOption.SO_BACKLOG, 100)
             .handler(new LoggingHandler(LogLevel.INFO))
             .childHandler(new ChannelInitializer<SocketChannel>() {
                 @Override
                 public void initChannel(SocketChannel ch) throws Exception {
                     ChannelPipeline p = ch.pipeline();
                     if (sslCtx != null) {
                         p.addLast(sslCtx.newHandler(ch.alloc()));
                     }
                     //p.addLast(new LoggingHandler(LogLevel.INFO));
                     p.addLast(new EchoServerHandler());
                 }
             });
            // Start the server.
            // 此处进行debug
            ChannelFuture f = b.bind(PORT).sync();
            // Wait until the server socket is closed.
            f.channel().closeFuture().sync();
        } finally {
            // Shut down all event loops to terminate all threads.
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
```

通过debug，AbstractBootstrap -> doBind() 方法中，接着跟进 initAndRegister()方法

```java
private ChannelFuture doBind(final SocketAddress localAddress) {
        final ChannelFuture regFuture = initAndRegister();
        final Channel channel = regFuture.channel();
        if (regFuture.cause() != null) {
            return regFuture;
        }
        if (regFuture.isDone()) {
            // At this point we know that the registration was complete and successful.
            ChannelPromise promise = channel.newPromise();
            doBind0(regFuture, channel, localAddress, promise);
            return promise;
        } else {
            // Registration future is almost always fulfilled already, but just in case it's not.
            final PendingRegistrationPromise promise = new PendingRegistrationPromise(channel);
            regFuture.addListener(new ChannelFutureListener() {
                @Override
                public void operationComplete(ChannelFuture future) throws Exception {
                    Throwable cause = future.cause();
                    if (cause != null) {
                        // Registration on the EventLoop failed so fail the ChannelPromise directly to not cause an
                        // IllegalStateException once we try to access the EventLoop of the Channel.
                        promise.setFailure(cause);
                    } else {
                        // Registration was successful, so set the correct executor to use.
                        // See https://github.com/netty/netty/issues/2586
                        promise.registered();
                        doBind0(regFuture, channel, localAddress, promise);
                    }
                }
            });
            return promise;
        }
    }
```

在SocketChannel 的抽象父类 AbstractChannel 的构造方法中

```java
protected AbstractChannel(Channel parent) {
    this.parent = parent;
    id = newId();
    unsafe = newUnsafe();
    // debug
    pipeline = newChannelPipeline();
}
```

跟进newChannelPipeline()方法，会进入到 DefaultChannelPipeline 类的构造方法中。

```java
protected DefaultChannelPipeline(Channel channel) {
    this.channel = ObjectUtil.checkNotNull(channel, "channel");
    succeededFuture = new SucceededChannelFuture(channel, null);
    voidPromise =  new VoidChannelPromise(channel, true);
    tail = new TailContext(this);
    head = new HeadContext(this);
    head.next = tail;
    tail.prev = head;
}
```

ChannelPipeline的创建到此为止。

> 说明：
>
> 1、将 channel 赋值给 channel 字段，用于 pipeline 操作 channel。
>
> 2、创建一个 future 和 promise，用于异步回调使用。
>
> 3、创建一个 inbound 的 tailContext，创建一个即是 inbound 类型又是 outbound 类型的 headContext。
>
> 4、最后，将两个 Context 互相连接，形成双向链表。
>
> 5、TailContext 和 HeadContext 非常的重要，所有 pipeline 中的事件都会流经他们。

## 2.2 在 add***添加处理器的时候创建 Context***

可以看下 DefaultChannelPipeline 的addLast 方法如何创建的 Context，代码如下

```java
    @Override
    public final ChannelPipeline addLast(EventExecutorGroup executor, ChannelHandler... handlers) {
        if (handlers == null) {
            throw new NullPointerException("handlers");
        }
        for (ChannelHandler h: handlers) {
            if (h == null) {
                break;
            }
            // 断点
            addLast(executor, null, h);
        }
        return this;
    }
```

继续debug

```java
@Override
    public final ChannelPipeline addLast(EventExecutorGroup group, String name, ChannelHandler handler) {
        final AbstractChannelHandlerContext newCtx;
        synchronized (this) {
            checkMultiplicity(handler);
            newCtx = newContext(group, filterName(name, handler), handler);
            addLast0(newCtx);
            // If the registered is false it means that the channel was not registered on an eventloop yet.
            // In this case we add the context to the pipeline and add a task that will call
            // ChannelHandler.handlerAdded(...) once the channel is registered.
            if (!registered) {
                newCtx.setAddPending();
                callHandlerCallbackLater(newCtx, true);
                return this;
            }
            EventExecutor executor = newCtx.executor();
            if (!executor.inEventLoop()) {
                newCtx.setAddPending();
                executor.execute(new Runnable() {
                    @Override
                    public void run() {
                        callHandlerAdded0(newCtx);
                    }
                });
                return this;
            }
        }
        callHandlerAdded0(newCtx);
        return this;
    }
```

> 说明：
>
> 1、pipeline 添加 handler，参数是线程池，name 是 null，handler 是我们或者系统传入的 handler。Netty 为了防止多个线程导致安全问题，同步了这段代码，步骤如下：
>
> 2、检查这个 handler 实例是否是共享的，如果不是，并且已经被别的 pipeline 使用了，则抛出异常。
>
> 3、调用 newContext(group, filterName(name, handler), handler) 方法，创建一个 Context。从这里可以看出来了，每次添加一个 handler，都会创建一个关联 Context。
>
> 4、调用 addLast 方法，将 Context 追加到链表中。
>
> 5、如果这个通道还没有注册到 selector 上，就将这个 Context 添加到这个 pipeline 的待办任务中。当注册好了以后，就会调用 callHandlerAdded() 方法（默认是什么都不做，用户可以实现这个方法）。
>
> 6、到这里，针对三对象创建过程，了解的差不多了，和最初说的一样，每当创建 ChannelSocket 的时候都会创建一个绑定的 pipeline，一对一的关系，创建 pipeline 的时候也会创建 tail 节点和 head 节点，形成最初的链表。tail 是入站 inbound 类型的 handler，head 即是 inbound 也是 outbound 类型的 handler。在调用 pipeline 的 addLast 方法的时候，会根据给定的 handler 创建一个 Context，然后，将这个 Context 插入到链表的尾端（tail 前面）。

## 2.3 创建过程梳理

1、每当创建 ChannelSocket 的时候都会创建一个绑定的 pipeline，一对一的关系，创建 pipeline 的时候也会创建 tail 节点和 head 节点，形成最初的链表。

2、在调用 pipeline 的 addLast 方法的时候，会根据给定的 handler 创建一个 Context，然后，将这个 Context 插入到链表的尾端（tail前面）。

3、Context 包装 handler，多个 Context 在 pipeline 中形成了双向链表。

4、入站方向叫 inbound，由 head 节点开始，出站方法加 outbound，由 tail 节点开始。

## 3.ChannelPipeline 调度 handler 的源码剖析

## 3.1源码剖析目的

1、当一个请求进来的时候，ChannelPipeline 是如何调用内部的这些 handler 的呢？首先，当一个请求进来的时候，会第一个调用 pipeline的相关方法，如果是入站事件，这些方法有 fire 开头，表示开始管道的流动，让后面的 handler 继续处理。

2、通过源码梳理 ChannelPipeline 与 ChannelHandlerContext 中的 read，fireChannelRead 等方法的不同。

- 在 [Netty启动过程源码分析](https://zhufei.blog.csdn.net/article/details/129531970) 文中我们已经知道，启动后，Netty通过监听processSelectedKey来对事件进行监听，我们找到NioEventLoop类中对应方法，如下

```java
 private void processSelectedKey(SelectionKey k, AbstractNioChannel ch) {
        final AbstractNioChannel.NioUnsafe unsafe = ch.unsafe();
      ......
            // Also check for readOps of 0 to workaround possible JDK bug which may otherwise lead
            // to a spin loop
            if ((readyOps & (SelectionKey.OP_READ | SelectionKey.OP_ACCEPT)) != 0 || readyOps == 0) {
                unsafe.read();
            }
        } catch (CancelledKeyException ignored) {
            unsafe.close(unsafe.voidPromise());
        }
    }
```

- 通过Debug方式启动Server， 通过run的方式启动Client，
- 我们关注的OP_READ事件的监听，调用的unsafe.read方法，

第一次时完成连接操作OP_ACCEPT

第二次到read方法才是OP_READ

- 接着追，完成SocketUtil连接后，我们得到了一个封装好的HandlerList，遍历这个list并且调用fireChannelRead，如下源码

```java
@Override
public final void read() {
    final ChannelConfig config = config();
    final ChannelPipeline pipeline = pipeline();
    final ByteBufAllocator allocator = config.getAllocator();
    final RecvByteBufAllocator.Handle allocHandle = recvBufAllocHandle();
    allocHandle.reset(config);
    ByteBuf byteBuf = null;
    boolean close = false;
    try {
        do {
            byteBuf = allocHandle.allocate(allocator);
            allocHandle.lastBytesRead(doReadBytes(byteBuf));
            if (allocHandle.lastBytesRead() <= 0) {
                // nothing was read. release the buffer.
                byteBuf.release();
                byteBuf = null;
                close = allocHandle.lastBytesRead() < 0;
                if (close) {
                    // There is nothing left to read as we received an EOF.
                    readPending = false;
                }
                break;
            }
            allocHandle.incMessagesRead(1);
            readPending = false;
            //继续追fireChannelRead方法
            pipeline.fireChannelRead(byteBuf);
            byteBuf = null;
        } while (allocHandle.continueReading());
        allocHandle.readComplete();
        pipeline.fireChannelReadComplete();
        if (close) {
            closeOnRead(pipeline);
        }
    } catch (Throwable t) {
        handleReadException(pipeline, byteBuf, t, close, allocHandle);
    } finally {
        // Check if there is a readPending which was not processed yet.
        // This could be for two reasons:
        // * The user called Channel.read() or ChannelHandlerContext.read() in channelRead(...) method
        // * The user called Channel.read() or ChannelHandlerContext.read() in channelReadComplete(...) method
        //
        // See https://github.com/netty/netty/issues/2254
        if (!readPending && !config.isAutoRead()) {
            removeReadOp();
        }
    }
}
```

*继续追fireChannelRead方法，进入我们今天要关注的DefaultChannelPipeline*

```java
    @Override
    public final ChannelPipeline fireChannelRead(Object msg) {
        AbstractChannelHandlerContext.invokeChannelRead(head, msg);
        return this;
    }
```

- 我们在来看下DefaultChannelPipeline的类UML图

```java
//inbound部分
public class DefaultChannelPipeline implements ChannelPipeline {
    @Override
    public final ChannelPipeline fireChannelActive() {
        AbstractChannelHandlerContext.invokeChannelActive(head);
        return this;
    }
    @Override
    public final ChannelPipeline fireChannelInactive() {
        AbstractChannelHandlerContext.invokeChannelInactive(head);
        return this;
    }
    @Override
    public final ChannelPipeline fireExceptionCaught(Throwable cause) {
        AbstractChannelHandlerContext.invokeExceptionCaught(head, cause);
        return this;
    }
    @Override
    public final ChannelPipeline fireUserEventTriggered(Object event) {
        AbstractChannelHandlerContext.invokeUserEventTriggered(head, event);
        return this;
    }
    @Override
    public final ChannelPipeline fireChannelRead(Object msg) {
        AbstractChannelHandlerContext.invokeChannelRead(head, msg);
        return this;
    }
    @Override
    public final ChannelPipeline fireChannelReadComplete() {
        AbstractChannelHandlerContext.invokeChannelReadComplete(head);
        return this;
    }
    @Override
    public final ChannelPipeline fireChannelWritabilityChanged() {
        AbstractChannelHandlerContext.invokeChannelWritabilityChanged(head);
        return this;
    }
}
```

- inbound部分源码可以看出，所有的入站事件都是由fire开头，表示管道的流动，让后面的handler继续处理（此处之后源码分析）
- 观察以上方法的入参，他们给定的都是一个Handler，并且都是HeadHandler节点，说明我们的入站事件都是从Head节点开始，事件依次在每一个Handler中流转最终到我们服务端，如下源码

```java
static void invokeChannelRead(final AbstractChannelHandlerContext next, Object msg) {
    final Object m = next.pipeline.touch(ObjectUtil.checkNotNull(msg, "msg"), next);
    // 首先获取一个NioEventLoop 执行器
    EventExecutor executor = next.executor();
    // 判断当前线程是否是执行器的线程，接着执行 next.invokeChannelRead(m)
    if (executor.inEventLoop()) {
        next.invokeChannelRead(m);
    } else {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                next.invokeChannelRead(m);
            }
        });
    }
}
```

- 接着从Head节点开始执行以下方法执行以下

```java
private void invokeChannelRead(Object msg) {
    if (invokeHandler()) {
        try {
            // 关键方法，channelRead(this, msg);参数this就是当前Handler， 首先就是HeadContextHandler
            ((ChannelInboundHandler) handler()).channelRead(this, msg);
        } catch (Throwable t) {
            notifyHandlerException(t);
        }
    } else {
        fireChannelRead(msg);
    }
}
```

- 接着看HeadHandler中的channelRead方法，只有一个fireChannelRead

```java
@Override
public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
    ctx.fireChannelRead(msg);
}
//所以又来到了这里，第二次执行，会再次获取一次Next，也就是第二个handler
static void invokeChannelRead(final AbstractChannelHandlerContext next, Object msg) {
    final Object m = next.pipeline.touch(ObjectUtil.checkNotNull(msg, "msg"), next);
    EventExecutor executor = next.executor();
    if (executor.inEventLoop()) {
        next.invokeChannelRead(m);
    } else {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                next.invokeChannelRead(m);
            }
        });
    }
}
```

- 也就是HeadHandler只做了一次转发，将持有的msg转发给了下一个Handler，也就是我们自己添加的EchoServerHandler，如果我们实现的方法分中没有fireChannelRead ，则不会到tailContext中，那么读事件久完成了，总流程如下
- fireChannelRead方法 —〉 AbstractChannelHandlerContext.invokeChannelRead(context); —〉next(context) 中 next.invokeChannelRead(m); —〉具体Handler的channelRead 方法（以及自实现方法）—〉Context的fireChannelRead方法参数是下一个节点的ChannelHandlerContext（此处不一定是fireChannelRead，只是这次我们Debug是read，有可能是Actice等其他事件）

## 3.2 outbound 源码解析

- Pipeline的outbound的fire相关方法，同样截取DefaultChannelPipeline

```java
  @Override
  public class DefaultChannelPipeline implements ChannelPipeline {
    public final ChannelFuture bind(SocketAddress localAddress) {
        return tail.bind(localAddress);
    }
    @Override
    public final ChannelFuture connect(SocketAddress remoteAddress) {
        return tail.connect(remoteAddress);
    }
    @Override
    public final ChannelFuture connect(SocketAddress remoteAddress, SocketAddress localAddress) {
        return tail.connect(remoteAddress, localAddress);
    }
    @Override
    public final ChannelFuture disconnect() {
        return tail.disconnect();
    }
    @Override
    public final ChannelFuture close() {
        return tail.close();
    }
    @Override
    public final ChannelFuture deregister() {
        return tail.deregister();
    }
    @Override
    public final ChannelPipeline flush() {
        tail.flush();
        return this;
    }
    @Override
    public final ChannelFuture bind(SocketAddress localAddress, ChannelPromise promise) {
        return tail.bind(localAddress, promise);
    }
    @Override
    public final ChannelFuture connect(SocketAddress remoteAddress, ChannelPromise promise) {
        return tail.connect(remoteAddress, promise);
    }
    @Override
    public final ChannelFuture connect(
            SocketAddress remoteAddress, SocketAddress localAddress, ChannelPromise promise) {
        return tail.connect(remoteAddress, localAddress, promise);
    }
    @Override
    public final ChannelFuture disconnect(ChannelPromise promise) {
        return tail.disconnect(promise);
    }
    @Override
    public final ChannelFuture close(ChannelPromise promise) {
        return tail.close(promise);
    }
    @Override
    public final ChannelFuture deregister(final ChannelPromise promise) {
        return tail.deregister(promise);
    }
    @Override
    public final ChannelPipeline read() {
        tail.read();
        return this;
    }
    @Override
    public final ChannelFuture write(Object msg) {
        return tail.write(msg);
    }
    @Override
    public final ChannelFuture write(Object msg, ChannelPromise promise) {
        return tail.write(msg, promise);
    }
    @Override
    public final ChannelFuture writeAndFlush(Object msg, ChannelPromise promise) {
        return tail.writeAndFlush(msg, promise);
    }
    @Override
    public final ChannelFuture writeAndFlush(Object msg) {
        return tail.writeAndFlush(msg);
    }
}
```

- 这些都是出站方法的实现，但是都是调用的outboumd类的tailHandler来进程处理的，也就是我们用pipeline中的出站方法时候总是从TailHandler节点开始处理事件。
- 出站是 tail 开始，入站从 head 开始。因为出站是从内部向外面写，从 tail 开始，能够让前面的 handler 进行处理，防止 handler 被遗漏，比如编码。反之，入站当然是从 head 往内部输入，让后面的 handler 能够处理这些输入的数据。比如解码。因此虽然 head 也实现了 outbound 接口，但不是从 head 开始执行出站任务。
- 找一个比较典型的outbound方法分析，bind方法，如下源码

```java
@Override
public final ChannelFuture bind(SocketAddress localAddress) {
    return tail.bind(localAddress);
}
//继续根bind
@Override
public ChannelFuture bind(final SocketAddress localAddress, final ChannelPromise promise) {
    if (localAddress == null) {
        throw new NullPointerException("localAddress");
    }
    if (isNotValidPromise(promise, false)) {
        // cancelled
        return promise;
    }
    final AbstractChannelHandlerContext next = findContextOutbound();
    EventExecutor executor = next.executor();
    if (executor.inEventLoop()) {
        next.invokeBind(localAddress, promise);
    } else {
        safeExecute(executor, new Runnable() {
            @Override
            public void run() {
                next.invokeBind(localAddress, promise);
            }
        }, promise, null);
    }
    return promise;
}
```

- 以上源码首先参数检验，isNotValidPromise
- 接着，findContextOutbound 找第一个outbound节点对应的Handler（while循环，之前文章分析过）
- 接着同inbound流程一样 next.executor(); 拿到当前HandlerContext的执行器
- 执行对于HandlerContext对于的 next.invokeBind(localAddress, promise); 方法
- 举例一个具体的HandlerContext对应的invokeBind方法，LoggingHandler，如下

```java
@Override
public void bind(ChannelHandlerContext ctx, SocketAddress localAddress, ChannelPromise promise) throws Exception {
    if (logger.isEnabled(internalLevel)) {
        logger.log(internalLevel, format(ctx, "BIND", localAddress));
    }
    ctx.bind(localAddress, promise);//又回到了bind，然后接着next，同inbound一样的流程
}
```

## 4.总结

- ChannelPipeline中的出入站方法中出站是从tail开始，入站是从head开始，
- 因为出站是从服务器端通过ChannelPipeline到SocketChannel写，从tailHandlerContext开始，能让前面所有的Handler进行处理，能防止Handler被遗漏，比如编码
- 入站当然是从SocketChannel通过 ChannelPipeline 到服务器端，当然是从head开始往内部输入，让后面的handler能处理这些输入数据，比如解码
- 即使HeadHandler也实现了outbound接口，但是不是从head开始执行出站任务的
- 用如下图来理解数据在源码中执行的流程

- 说明
- pipeline首先会调用Conetxt的静态方法，并传入Context
- 接着静态方法调用Context的 invoke 方法，而invoke方法内部会调用该Context所包含的Handler的真正的XXX方法（例如我们自己实现的EchoServerHandler中的Read，activity等事件方法）
- 调用结束后，如果还需要继续向后传递，就调用Contexxt的firexxx2方法，循环往复
- 由上可以得出，ChannelPipeline中的inbound，outbound 分别是从HeadContext，tailContext，开始执行过每一个handler
- 而ChannelHandlerContext中的inbound，outbound是从本节点开始 向后或者向前传递
