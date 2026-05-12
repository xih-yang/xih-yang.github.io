# 37、Netty 源码解析 - Netty请求过程源码剖析
- 来源：https://ddkk.com/zhuanlan/server/netty/1/37.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本说明

1、服务器启动后肯定是要接收客户端请求并返回客户端想要的信息，Netty 在启动后是如何接收客户端请求的？

2、源码包：io.netty.example

## 二、请求过程源码剖析

1、从服务器启动源码中，可以得知，服务器最终注册了一个 Accept 事件等待客户端的连接。我们也知道，NioServerSocketChannel 将自己注册到了 boss 单例线程池（reactor线程）上，也就是 EventLoop。

2、EventLoop 的作用是一个死循环，在这个死循环中要处理三件事：

- 有条件的等待 Nio 事件
- 处理 Nio 事件
- 处理消息队列中的任务

3、进入到 NioEventLoop 源码中后，进入到 processSelectedKey 方法，找到以下代码

```java
if ((readyOps & (SelectionKey.OP_READ | SelectionKey.OP_ACCEPT)) != 0 || readyOps == 0) {
    unsafe.read(); // 断点位置
}
```

4、执行浏览器：http://localhost:8007/，客户端发出请求

5、从断点可以看出，readyOps 是 16，也就是 Accept 事件。说明浏览器的请求已经进来了。

6、这个 unsafe 是 boss 线程中 NioServerSocketChannel 的 AbstractNioMessageChannel N i o M e s s a g e U n s a f e 对 象 。 进 入 到 A b s t r a c t N i o M e s s a g e C h a n n e l NioMessageUnsafe 对象。进入到 AbstractNioMessageChannel NioMessageUnsafe对象。进入到AbstractNioMessageChannelNioMessageUnsafe 的 read 方法中

```java
@Override
public void read() {
    assert eventLoop().inEventLoop();
    final ChannelConfig config = config();
    final ChannelPipeline pipeline = pipeline();
    final RecvByteBufAllocator.Handle allocHandle = unsafe().recvBufAllocHandle();
    allocHandle.reset(config);
    boolean closed = false;
    Throwable exception = null;
    try {
        try {
            do {
                int localRead = doReadMessages(readBuf);
                if (localRead == 0) {
                    break;
                }
                if (localRead < 0) {
                    closed = true;
                    break;
                }
                allocHandle.incMessagesRead(localRead);
            } while (allocHandle.continueReading());
        } catch (Throwable t) {
            exception = t;
        }
        int size = readBuf.size();
        for (int i = 0; i < size; i ++) {
            readPending = false;
            pipeline.fireChannelRead(readBuf.get(i));
        }
        readBuf.clear();
        allocHandle.readComplete();
        pipeline.fireChannelReadComplete();
        if (exception != null) {
            closed = closeOnReadError(exception);
            pipeline.fireExceptionCaught(exception);
        }
        if (closed) {
            inputShutdown = true;
            if (isOpen()) {
                close(voidPromise());
            }
        }
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

- assert eventLoop().inEventLoop()：检查该 eventLoop 线程是否是当前线程。
- 执行 doReadMessages 方法，并传入一个 readBuf 变量，这个变量是一个List，也就是容器。

7、doReadMessages 是读取 boss 线程中的 NioServerSocketChannel 接收到的请求。并把这些请求放进容器。

```java
@Override
protected int doReadMessages(List<Object> buf) throws Exception {
    SocketChannel ch = SocketUtils.accept(javaChannel());
    try {
        if (ch != null) {
            buf.add(new NioSocketChannel(this, ch));
            return 1;
        }
    } catch (Throwable t) {
        logger.warn("Failed to create a new channel from an accepted socket.", t);
        try {
            ch.close();
        } catch (Throwable t2) {
            logger.warn("Failed to close a socket.", t2);
        }
    }
    return 0;
}
```

**1、** 通过SocketUtils工具类，调用NioServerSocketChannel内部封装的serverSocketChannel的accept方法，这是Nio的做法；

**2、** 获取到一个JDK的SocketChannel，然后，使用NioSocketChannel进行封装，然后添加到容器中；

**3、** 这样容器buf中就有了NioSocketChannel；

8、循环容器，执行 pipeline.fireChannelRead(readBuf.get(i))

- doReadMessages 方法的作用是通过 ServerSocket 的 accept 方法获取到 TCP 连接，然后封装成 Netty 的 NioSocketChannel 对象，最后添加到容器中。
- 在 read 方法中，循环调用 ServerSocket 的 pipeline 的 fireChannelRead 方法，开始执行管道中的 handler 的 ChannelRead 方法
- 经过debug多次，可以发现会反复执行多个 handler 的 ChannelRead 方法，因为，在 pipeline 中有多个 handler，分别是：Head、LoggingHandler、ServerBootstrapAcceptor、Tail
- ServerBootstrapAcceptor，debug之后，断点会进入到 ServerBootstrapAcceptor 中来，观察里面的 ChannelRead 方法

```java
// 说明
// msg 强转成 Channel，实际上就是 NioSocketChannel
// 添加 NioSocketChannel 的 pipeline 的 handler，就是在 main 方法里面设置的 childHandler 方法里的
// 设置 NioSocketChannel 各种属性
// 将该 NioSocketChannel 注册到 childGroup 中的一个 EventLoop 上，并添加一个监听器
// 这个 childGroup 就是 main 方法创建的数组 workerGroup
@Override
@SuppressWarnings("unchecked")
public void channelRead(ChannelHandlerContext ctx, Object msg) {
    final Channel child = (Channel) msg;
    child.pipeline().addLast(childHandler);
    setChannelOptions(child, childOptions, logger);
    for (Entry<AttributeKey<?>, Object> e: childAttrs) {
        child.attr((AttributeKey<Object>) e.getKey()).set(e.getValue());
    }
    try {
    	// 将客户端连接注册到 worker 线程池
        childGroup.register(child).addListener(new ChannelFutureListener() {
            @Override
            public void operationComplete(ChannelFuture future) throws Exception {
                if (!future.isSuccess()) {
                    forceClose(child, future.cause());
                }
            }
        });
    } catch (Throwable t) {
        forceClose(child, t);
    }
}
```

9、进入到 register 方法

```java
@Override
public final void register(EventLoop eventLoop, final ChannelPromise promise) {
    if (eventLoop == null) {
        throw new NullPointerException("eventLoop");
    }
    if (isRegistered()) {
        promise.setFailure(new IllegalStateException("registered to an event loop already"));
        return;
    }
    if (!isCompatible(eventLoop)) {
        promise.setFailure(
                new IllegalStateException("incompatible event loop type: " + eventLoop.getClass().getName()));
        return;
    }
    AbstractChannel.this.eventLoop = eventLoop;
    if (eventLoop.inEventLoop()) {
        register0(promise);
    } else {
        try {
            eventLoop.execute(new Runnable() {
                @Override
                public void run() {
                    register0(promise); // 进入到此方法
                }
            });
        } catch (Throwable t) {
            logger.warn(
                    "Force-closing a channel whose registration task was not accepted by an event loop: {}",
                    AbstractChannel.this, t);
            closeForcibly();
            closeFuture.setClosed();
            safeSetFailure(promise, t);
        }
    }
}
```

10、最终会调用 doBeginRead 方法，也就是 AbstractNioChannel 类的方法，执行到这里时，针对这个客户端的连接就完成了，接下来就可以监听读事件了。

```java
 @Override
 protected void doBeginRead() throws Exception {
     // Channel.read() or ChannelHandlerContext.read() was called
     final SelectionKey selectionKey = this.selectionKey;
     if (!selectionKey.isValid()) {
         return;
     }
     readPending = true;
     final int interestOps = selectionKey.interestOps();
     if ((interestOps & readInterestOp) == 0) {
         selectionKey.interestOps(interestOps | readInterestOp);
     }
 }
```
