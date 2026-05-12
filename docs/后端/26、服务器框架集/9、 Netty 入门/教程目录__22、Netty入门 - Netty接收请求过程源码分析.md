# 22、Netty入门 - Netty接收请求过程源码分析
- 来源：https://ddkk.com/zhuanlan/server/netty/2/22.html
- 分类：服务器框架
- 分组：教程目录
## 1.源码剖析的目的

1、服务器启动后肯定是要接受客户端请求并返回客户端想要的 信息的，下面源码分析 Netty 在启动之后是如何接受客户端请求的。

2、源码使用 io.netty.example 包下的echo包下的代码。

## 2.源码剖析

**说明：**

1、从之前服务器启动的源码中，我们得知，服务器最终注册了一个 Accept 时间等待客户端的连接。我们也知道， NIOServerSocketChannel 将自己注册到了 boss 单例线程池（reactor 线程）上，也就是 EventLoop。

2、先简单说下 EventLoop 的逻辑

- EventLoop 的作用是一个死循环，而这个循环中做 3 件事情：
- 有条件的等待 Nio 事件。
- 处理 Nio 事件。
- 处理消息队列中的任务。
- 仍用前面的项目来分析：进入到 NioEventLoop 源码中后，在private void processSelectedKey(SelectionKey k, AbstractNioChannel ch) 方法开始调试，最终我们要分析到 AbstractNioChannel 的 doBeginRead 方法，当到这个方法时，针对于这个客户端的连接就完成了，接下来就可以监听读事件了。

## 3.源码分析过程

直接debug模式启动Server端，然后在浏览器输入[http://localhost:8007](http://localhost:8007)，接着以下代码分析。

因为我们想要分析接受client 连接的代码，先找到对应的 EventLoop源码，如图中的 NioEventLoop 循环，找到如下源码

```java
@Override
protected void run() {
    int selectCnt = 0;
    for (;;) {
        try {
            int strategy;
            try {
                strategy = selectStrategy.calculateStrategy(selectNowSupplier, hasTasks());
                switch (strategy) {
                ......
                // 处理各种 strategy 类型
                default:
                }
            } catch (IOException e) {
                // If we receive an IOException here its because the Selector is messed up. Let's rebuild
                // the selector and retry. https://github.com/netty/netty/issues/8566
                rebuildSelector0();
                selectCnt = 0;
                handleLoopException(e);
                continue;
            }
            selectCnt++;
            cancelledKeys = 0;
            needsToSelectAgain = false;
            final int ioRatio = this.ioRatio;
            boolean ranTasks;
            if (ioRatio == 100) {
                try {
                    if (strategy > 0) {
                        //对strategy事件进行处理
                        processSelectedKeys();
                    }
                } finally {
                    // Ensure we always run tasks.
                    ranTasks = runAllTasks();
                }
            } else if (strategy > 0) {
                final long ioStartTime = System.nanoTime();
                try {
                    processSelectedKeys();
                } finally {
                    ......
                }
            } else {
                ranTasks = runAllTasks(0); // This will run the minimum number of tasks
            }
            ......
        } catch (CancelledKeyException e) {
            ......
        } catch (Error e) {
            ......
        } catch (Throwable t) {
            ......
        } finally {
            .......
        }
    }
}
```

如上代码 strategy 根据请求的类型走不同的策略，最后处理策略的方法是 processSelectedKeys()，继续跟踪核心方法 processSelectedKeys()，源码如下：

```java
//进入processSelectedKeys ---> processSelectedKeysOptimized(); ---> processSelectedKey
private void processSelectedKey(SelectionKey k, AbstractNioChannel ch) {
        final AbstractNioChannel.NioUnsafe unsafe = ch.unsafe();
        // 事件合法性验证
        if (!k.isValid()) {
            final EventLoop eventLoop;
            try {
                eventLoop = ch.eventLoop();
            } catch (Throwable ignored) {
                // If the channel implementation throws an exception because there is no event loop, we ignore this
                // because we are only trying to determine if ch is registered to this event loop and thus has authority
                // to close ch.
                return;
            }
            // Only close ch if ch is still registered to this EventLoop. ch could have deregistered from the event loop
            // and thus the SelectionKey could be cancelled as part of the deregistration process, but the channel is
            // still healthy and should not be closed.
            // See https://github.com/netty/netty/issues/5125
            if (eventLoop == this) {
                // close the channel if the key is not valid anymore
                unsafe.close(unsafe.voidPromise());
            }
            return;
        }
        try {
            // 获取 readyOps
            int readyOps = k.readyOps();
            // We first need to call finishConnect() before try to trigger a read(...) or write(...) as otherwise
            // the NIO JDK channel implementation may throw a NotYetConnectedException.
            if ((readyOps & SelectionKey.OP_CONNECT) != 0) {
                // remove OP_CONNECT as otherwise Selector.select(..) will always return without blocking
                // See https://github.com/netty/netty/issues/924
                int ops = k.interestOps();
                ops &= ~SelectionKey.OP_CONNECT;
                k.interestOps(ops);
                unsafe.finishConnect();
            }
            // Process OP_WRITE first as we may be able to write some queued buffers and so free memory.
            if ((readyOps & SelectionKey.OP_WRITE) != 0) {
                // Call forceFlush which will also take care of clear the OP_WRITE once there is nothing left to write
               unsafe.forceFlush();
            }
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

第一个if中对事件合法性验证，接着获取readyOps，我们debug得到是16，也就是 Accept 事件。说明浏览器的请求已经进来了。

SelectionKey中16 代码的意义:

属于连接请求，这就是我们拿到了之前用[Http://localhost:8007](http://localhost:8007) 请求的连接，接着继续跟进代码 EventLoopGroup —> processSelectedKey —> unsafe.read();其中unsafe是 boss线程中 NioServerSocketChannel 的 AbstractNioMessageChannel$NioMessageUnsafed 对象。

继续跟进AbstractNioMessageChannel$NioMessageUnsafed —> read() ，得到如下源码，源码如下：

```java
@Override
public void read() {
    // 判断eventLoop线程是否当前线程
    assert eventLoop().inEventLoop();
    // 获取NioServerSocketChannelConfig
    final ChannelConfig config = config();
    // 获取DefaultChannelPipeline。是一个双向链表，可以看到内部包含 LoggingHandler，ServerBootStraptHandler
    final ChannelPipeline pipeline = pipeline();
    final RecvByteBufAllocator.Handle allocHandle = unsafe().recvBufAllocHandle();
    allocHandle.reset(config);
    boolean closed = false;
    Throwable exception = null;
    try {
        try {
            do {
                // 执行doReadMessages方法，并传入一个 readBuf 变量，这个变量是一个List，也就是一个容器
                // doReadMessages 是读取 boss 线程中的 NioServerSocketChannel 接收到的请求。并把这些请求放进容器
                int localRead = doReadMessages(readBuf);
                ......
                allocHandle.incMessagesRead(localRead);
            } while (continueReading(allocHandle));
        } catch (Throwable t) {
            exception = t;
        }
        // 循环容器，执行 pipeline.fireChannelRead(readBuf.get(i));
        int size = readBuf.size();
        for (int i = 0; i < size; i ++) {
            readPending = false;
            // 处理这些接收的请求或者其他事件
            pipeline.fireChannelRead(readBuf.get(i));
        }
        ......
        if (exception != null) {
            ......
        }
        if (closed) {
            ......
        }
    } finally {
        ......
    }
}
}
```

继续跟进 NioServersocketChannel —> doMessage（buf），可以进入到NioServerSocketChannel，找到doMessage方法

```java
@Override
// 参数buf是一个静态队列。private final List readBuf = new ArrayList(); 
// 读取boss线程中的NioServerSocketChannel接受到的请求，并且将请求放到buf容器中
protected int doReadMessages(List<Object> buf) throws Exception {
    //通过Nio中工具类的建立连接，其实底层是调用了ServerSocketChannelImpl —> accept()方法建立TCP连接，
    //并返回一个Nio中的SocketChannel
    SocketChannel ch = SocketUtils.accept(javaChannel());
    try {
        if (ch != null) {
            // 将获取到的Nio中SocketCHannel包装成Netty中的NioSocketChannel 并且添加到buf队列中（list）
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

doReadMessages到这分析完。

回到EventLoopGroup —> ProcessSelectedKey

循环遍历之前doReadMessage中获取的buf中的所有请求，调用Pipeline的firstChannelRead方法，用于处理这些接受的请求或者其他事件，在read方法中，循环调用ServerSocket的Pipeline的fireChannelRead方法，开始执行管道中的handler的ChannelRead方法，如下

继续跟进，进入 pipeline.fireChannelRead(readBuf.get(i)); 一直跟到AbstracChannelHandlerContext —> invokeChannelRead

```java
private void invokeChannelRead(Object msg) {
        if (invokeHandler()) {
            try {
                // DON'T CHANGE
                // Duplex handlers implements both out/in interfaces causing a scalability issue
                // see https://bugs.openjdk.org/browse/JDK-8180450
                final ChannelHandler handler = handler();
                final DefaultChannelPipeline.HeadContext headContext = pipeline.head;
                if (handler == headContext) {
                    headContext.channelRead(this, msg);
                } else if (handler instanceof ChannelDuplexHandler) {
                    ((ChannelDuplexHandler) handler).channelRead(this, msg);
                } else {
                    ((ChannelInboundHandler) handler).channelRead(this, msg);
                }
            } catch (Throwable t) {
                invokeExceptionCaught(t);
            }
        } else {
            fireChannelRead(msg);
        }
    }
```

进入handler() 中，DefaultChannelPipeline —> handler()

debug源码可以看到，在管道中添加了多个Handler，分别是：HeadContext，LoggingContext，ServerBootStrapAcceptor，TailContext 因此debug时候会依次进入每一个Handler中。我们重点看ServerBootStrapAcceptor中的channelRead方法

```java
@Override
        @SuppressWarnings("unchecked")
        public void channelRead(ChannelHandlerContext ctx, Object msg) {
            // msg 强转成 Channel，实际上就是 NioSocketChannel
            final Channel child = (Channel) msg;
            // 添加 NioSocketChannel 的各种属性
            child.pipeline().addLast(childHandler);
            setChannelOptions(child, childOptions, logger);
            for (Entry<AttributeKey<?>, Object> e: childAttrs) {
                child.attr((AttributeKey<Object>) e.getKey()).set(e.getValue());
            }
            try {
                // 将 客户端连接注册到 worker 线程池
                // 将该 NioSocketChannel 注册到 childGroup 中的一个 EventLoop 上，并添加一个监听器
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

进入register方法, MultithreadEventLoopGroup —>register , SingleThreadEventLoop —>register , AbstractChannel —> register，如下

首先看MultithreadEventLoopGroup 中的 register

```java
@Override
public ChannelFuture register(Channel channel) {
    return next().register(channel);
}
```

进入next()方法中，最终我们可以追到 DefaultEventExecutorChooserFactory —> GenericEventExecutorChooser —> next()

内部类中的next

```java
private static final class GenericEventExecutorChooser implements EventExecutorChooser {
    private final AtomicInteger idx = new AtomicInteger();
    private final EventExecutor[] executors;
    GenericEventExecutorChooser(EventExecutor[] executors) {
        this.executors = executors;
    }
    @Override
    public EventExecutor next() {
        return executors[Math.abs(idx.getAndIncrement() % executors.length)];
    }
}
```

通过debug可以看到，next返回的就是我们在workerGroup中创建的线程数组中的某一个子线程EventExecutor

接下来我们在回到register方法： AbstractChannel —> register 方法，如下：

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
                    register0(promise);
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

关键方法register0

```java
private void register0(ChannelPromise promise) {
    try {
        // check if the channel is still open as it could be closed in the mean time when the register
        // call was outside of the eventLoop
        if (!promise.setUncancellable() || !ensureOpen(promise)) {
            return;
        }
        boolean firstRegistration = neverRegistered;
        doRegister();
        neverRegistered = false;
        registered = true;
        // Ensure we call handlerAdded(...) before we actually notify the promise. This is needed as the
        // user may already fire events through the pipeline in the ChannelFutureListener.
        pipeline.invokeHandlerAddedIfNeeded();
        safeSetSuccess(promise);
        pipeline.fireChannelRegistered();
        // Only fire a channelActive if the channel has never been registered. This prevents firing
        // multiple channel actives if the channel is deregistered and re-registered.
        if (isActive()) {
            if (firstRegistration) {
                pipeline.fireChannelActive();
            } else if (config().isAutoRead()) {
                // This channel was registered before and autoRead() is set. This means we need to begin read
                // again so that we process inbound data.
                //
                // See https://github.com/netty/netty/issues/4805
                beginRead();
            }
        }
    } catch (Throwable t) {
        // Close the channel directly to avoid FD leak.
        closeForcibly();
        closeFuture.setClosed();
        safeSetFailure(promise, t);
    }
}
```

进入doRegister(); 方法：AbstractNioChannel —> doRegister

```java
@Override
    protected void doRegister() throws Exception {
        boolean selected = false;
        for (;;) {
            try {
                selectionKey = javaChannel().register(eventLoop().unwrappedSelector(), 0, this);
                return;
            } catch (CancelledKeyException e) {
                if (!selected) {
                    // Force the Selector to select now as the "canceled" SelectionKey may still be
                    // cached and not removed because no Select.select(..) operation was called yet.
                    eventLoop().selectNow();
                    selected = true;
                } else {
                    // We forced a select operation on the selector before but the SelectionKey is still cached
                    // for whatever reason. JDK bug ?
                    throw e;
                }
            }
        }
    }
```

上代码，selectionKey = javaChannel().register(eventLoop().unwrappedSelector(), 0, this);此处我们将bossGroup中的EventLoop的channel 注册到workerGroup中的EventLoop中的 select中，方法中会得到一个selectionKey

我们可以看register方法的注视，如下：

> Registers this channel with the given selector, returning a selection key.
>
> 使用给定的选择器注册此通道，并返回选择键。

接着debug，最终回到 AbstractNioChannel 中的 doBeginRead 方法

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

追到这里，针对客户的连接已经完成，接下来是读取监听事件，也就是bossGroup的连接建立，注册步骤已经完成了，接下来就是workerGroup中的事件处理了。

## 4.Netty接受请求过程梳理

- 总体流程：接收连接 ---> 创建一个新的 NioSocketChannel ---> 注册到一个 WorkerEventLoop 上 ---> 注册 selectRead 事件
- 服务器轮询 Accept 事件（文中最开始的那个 for 循环），获取事件后调用 unsafe 的read 方法，这个 unsafe 是ServerSocket 的内部类，方法内部由两部分组成
- doReadMessage 用于创建 NioSocketChannel 对象，该对象包装 JDK 的 NioChannel 客户端，该方法创建一个 ServerSocketChannel
- 之后执行 pipeline.fireChannelRead(readBuf.get(i));方法，并且将自己绑定到一个 chooser 选择器选择的 workerGroup 中的某个 EventLoop 上，并且注册一个 0（连接），表示注册成功，但是并没有注册1（读取）
