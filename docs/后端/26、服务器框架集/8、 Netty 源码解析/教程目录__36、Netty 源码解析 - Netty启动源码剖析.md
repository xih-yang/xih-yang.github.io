# 36、Netty 源码解析 - Netty启动源码剖析
- 来源：https://ddkk.com/zhuanlan/server/netty/1/36.html
- 分类：服务器框架
- 分组：教程目录
## 一、绑定端口分析

1、服务器绑定端口是在 bind 方法里完成的

2、在bind 方法代码中，创建了一个端口对象，并做了一些判断，核心代码为：doBind 方法

```java
public ChannelFuture bind(SocketAddress localAddress) {
   validate();
    if (localAddress == null) {
        throw new NullPointerException("localAddress");
    }
    return doBind(localAddress);
}
```

3、doBind 核心的两个方法：initAndRegister 和 doBind0

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

4、initAndRegister 分析

```java
final ChannelFuture initAndRegister() {
    Channel channel = null;
    try {
        channel = channelFactory.newChannel();
        init(channel);
    } catch (Throwable t) {
        if (channel != null) {
            // channel can be null if newChannel crashed (eg SocketException("too many open files"))
            channel.unsafe().closeForcibly();
            // as the Channel is not registered yet we need to force the usage of the GlobalEventExecutor
            return new DefaultChannelPromise(channel, GlobalEventExecutor.INSTANCE).setFailure(t);
        }
        // as the Channel is not registered yet we need to force the usage of the GlobalEventExecutor
        return new DefaultChannelPromise(new FailedChannel(), GlobalEventExecutor.INSTANCE).setFailure(t);
    }
    ChannelFuture regFuture = config().group().register(channel);
    if (regFuture.cause() != null) {
        if (channel.isRegistered()) {
            channel.close();
        } else {
            channel.unsafe().closeForcibly();
        }
    }
    // If we are here and the promise is not failed, it's one of the following cases:
    // 1) If we attempted registration from the event loop, the registration has been completed at this point.
    //    i.e. It's safe to attempt bind() or connect() now because the channel has been registered.
    // 2) If we attempted registration from the other thread, the registration request has been successfully
    //    added to the event loop's task queue for later execution.
    //    i.e. It's safe to attempt bind() or connect() now:
    //         because bind() or connect() will be executed *after* the scheduled registration task is executed
    //         because register(), bind(), and connect() are all bound to the same thread.
    return regFuture;
}
```

**channelFactory.newChannel()方法的作用是通过 ServerBootstrap 的通道工厂反射创建一个 NioServerSocketChannel。**

**1、** 通过NIO的SelectorProvider的openServerSocketChannel方法得到JDK的channel目的是让Netty保证JDK的channel；

**2、** 创建了一个唯一的ChannelId，创建了一个NioMessageUnsafe，用于操作消息，创建了一个DefaultChannelPipeline管道，是个双向链表结构，用于过滤所有的进出消息；

**3、** 创建了一个NioServerSocketChannelConfig对象，用于对外展示一些配置；

**init 用于初始化 NioServerSocketChannel**

**1、** init方法，是AbstractBootstrap的一个抽象方法，由ServerBootstrap实现，setChannelOptions(channel,options,logger);；

**2、** 设置NioServerSocketChannel的TCP属性；

**3、** 由于LinkedHashMap是非线程安全的，会使用同步进行处理；

**4、** 对NioServerSocketChannel的ChannelPipeline添加ChannelInitializer处理器；

**5、** init方法的核心作用和ChannelPipeline相关；

**6、** 从NioServerSocketChannel的初始化过程中，可以知道pipeline是一个双向链表，并且，它本身就初始化了head和tail，addLast方法，也就是将整个handler插入到tail的前面，因为tail永远会在后面，需要做一些系统的固定工作；

**基本说明**

**1、** initAndRegister()初始化NioServerSocketChannel通道并注册各个handler，返回一个future；

**2、** 通过ServerBootstrap的通道工厂反射创建一个NioServerSocketChannel；

**3、** init用于初始化NioServerSocketChannel；

**4、** config().group().register(channel)通过ServerBootstrap的bossGroup注册NioServerSocketChanel；

**5、** 返回异步执行的占位符，即regFuture；

5、init 方法会调用 addLast

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

**1、** addLast方法在DefaultChannelPipeline；

**2、** addLast方法是pipeline方法的核心；

**3、** 会检查handler是否符合标准；

**4、** 创建一个AbstractChannelHandlerContext对象，ChannelHandlerContext对象是ChannelHandler和ChannelPipeline之间的关联，每当有ChannelHandler添加到pipeline中时，都会创建ContextContext的主要功能是管理它所关联的Handler和同一个pipeline中的其它Handler之间的交互；

**5、** 将Context添加到链表中，也就是追加到tail节点的前面；

**6、** 同步、异步或者晚点异步的调用callHandlerAdded0方法；

6、doBind0 方法

```java
private static void doBind0(
        final ChannelFuture regFuture, final Channel channel,
         final SocketAddress localAddress, final ChannelPromise promise) {
     // This method is invoked before channelRegistered() is triggered.  Give user handlers a chance to set up
     // the pipeline in its channelRegistered() implementation.
     channel.eventLoop().execute(new Runnable() {
         @Override
         public void run() {
             if (regFuture.isSuccess()) {
                 channel.bind(localAddress, promise).addListener(ChannelFutureListener.CLOSE_ON_FAILURE);
             } else {
                 promise.setFailure(regFuture.cause());
             }
         }
     });
 }
```

**1、** 该方法的参数为initAndRegister的future，NioServerSocketChannel，端口地址，NioServerSocketChannel的promise；

**2、** 一直Debug到NioServerSocketChannel的doBind方法，说明Netty底层使用的是Nio；

```java
@Override
 protected void doBind(SocketAddress localAddress) throws Exception {
     if (PlatformDependent.javaVersion() >= 7) {
         javaChannel().bind(localAddress, config.getBacklog());
     } else {
         javaChannel().socket().bind(localAddress, config.getBacklog());
     }
 }
```

**1、** 最后一步：safeSetSuccess(promise)，告诉promise任务成功了，就可以监听执行器的方法了到此整个启动过程就结束了；

**2、** 继续alt+v服务器就会进入到NioEventLoop的一个循环代码，进行监听；

```java
@Override
 protected void run() {
     for (;;) {
         try {
             switch (selectStrategy.calculateStrategy(selectNowSupplier, hasTasks())) {
                 case SelectStrategy.CONTINUE:
                     continue;
                 case SelectStrategy.SELECT:
                     select(wakenUp.getAndSet(false));
                     // 'wakenUp.compareAndSet(false, true)' is always evaluated
                     // before calling 'selector.wakeup()' to reduce the wake-up
                     // overhead. (Selector.wakeup() is an expensive operation.)
                     //
                     // However, there is a race condition in this approach.
                     // The race condition is triggered when 'wakenUp' is set to
                     // true too early.
                     //
                     // 'wakenUp' is set to true too early if:
                     // 1) Selector is waken up between 'wakenUp.set(false)' and
                     //    'selector.select(...)'. (BAD)
                     // 2) Selector is waken up between 'selector.select(...)' and
                     //    'if (wakenUp.get()) { ... }'. (OK)
                     //
                     // In the first case, 'wakenUp' is set to true and the
                     // following 'selector.select(...)' will wake up immediately.
                     // Until 'wakenUp' is set to false again in the next round,
                     // 'wakenUp.compareAndSet(false, true)' will fail, and therefore
                     // any attempt to wake up the Selector will fail, too, causing
                     // the following 'selector.select(...)' call to block
                     // unnecessarily.
                     //
                     // To fix this problem, we wake up the selector again if wakenUp
                     // is true immediately after selector.select(...).
                     // It is inefficient in that it wakes up the selector for both
                     // the first case (BAD - wake-up required) and the second case
                     // (OK - no wake-up required).
                     if (wakenUp.get()) {
                         selector.wakeup();
                     }
                     // fall through
                 default:
             }
             cancelledKeys = 0;
             needsToSelectAgain = false;
             final int ioRatio = this.ioRatio;
             if (ioRatio == 100) {
                 try {
                     processSelectedKeys();
                 } finally {
                     // Ensure we always run tasks.
                     runAllTasks();
                 }
             } else {
                 final long ioStartTime = System.nanoTime();
                 try {
                     processSelectedKeys();
                 } finally {
                     // Ensure we always run tasks.
                     final long ioTime = System.nanoTime() - ioStartTime;
                     runAllTasks(ioTime * (100 - ioRatio) / ioRatio);
                 }
             }
         } catch (Throwable t) {
             handleLoopException(t);
         }
         // Always handle shutdown even if the loop processing threw an exception.
         try {
             if (isShuttingDown()) {
                 closeAll();
                 if (confirmShutdown()) {
                     return;
                 }
             }
         } catch (Throwable t) {
             handleLoopException(t);
         }
     }
 }
```
