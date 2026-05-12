# 24、Netty入门 - Netty心跳机制源码剖析
- 来源：https://ddkk.com/zhuanlan/server/netty/2/24.html
- 分类：服务器框架
- 分组：教程目录
## 1.源码剖析的目的

Netty作为一个网络框架，提供了诸多功能，比如编码解码等，Netty 还提供了非常重要的一个服务 ---- 心跳机制 heartbeat。通过心跳检查对方是否有效，这在 RPC 框架中是必不可少的功能。下面我们分析一下 Netty 内部 心跳服务源码的实现。

## 2.源码解析使用案例

## 2.1 源码案例

```java
public class MyServer {
    public static void main(String[] args) throws InterruptedException {
        // 创建两个线程组
        NioEventLoopGroup bossGroup = new NioEventLoopGroup(1);
        NioEventLoopGroup workerGroup = new NioEventLoopGroup(8);
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .handler(new LoggingHandler(LogLevel.INFO)) // 在bossgroup增加一个日志处理器
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 加入 netty 提供的 IdleStateHandler
                            /**
                             * 说明
                             * 1. IdleStateHandler 是 netty 提供的处理空闲状态的处理器
                             * 2. readerIdleTime：表示多长时间没有读，就会发送一个心跳检测包，检测是否还是连接状态
                             * 3. writerIdleTime：表示多长时间没有写，就会发送一个心跳检测包，检测是否还是连接状态
                             * 4. allIdleTime：表示多长时间没有读写，就会发送一个心跳检测包，检测是否还是连接状态
                             * 5. 当 IdleStateEvent 触发后，就会传递给管道的下一个handler进行处理，通过调用（触发）下一个 handler 的userEventTrigged 方法，
                             * 在该方法中去处理 IdleStateEvent 事件
                             */
                            pipeline.addLast(new IdleStateHandler(3,5,7, TimeUnit.SECONDS));
                            // 加入一个对空闲检测进一步处理的handler（自定义）
                            pipeline.addLast(new MyServerHandler());
                        }
                    });
            ChannelFuture channelFuture = serverBootstrap.bind(7000).sync();
            channelFuture.channel().closeFuture().sync();
        }finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
}
/**
 * 心跳处理器
 */
public class MyServerHandler extends ChannelInboundHandlerAdapter {
    /**
     *
     * @param ctx 上下文
     * @param evt 事件
     * @throws Exception 异常
     */
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if(evt instanceof IdleStateEvent){
            // 将 evt 向下转型
            IdleStateEvent event = (IdleStateEvent) evt;
            String eventType = null;
            switch (event.state()){
                case READER_IDLE:
                    eventType = "读空闲";
                    break;
                case WRITER_IDLE:
                    eventType = "写空闲";
                    break;
                case ALL_IDLE:
                    eventType = "读写空闲";
                    break;
            }
            System.out.println(ctx.channel().remoteAddress() + "--超时事件发生-->" + eventType);
            System.out.println("服务器做相应处理......");
        }
    }
}
```

如上源码中，我们对 Netty 服务器的（读/写）活动情况进行监听，利用 IdleStateHandler 来完成，其中三个参数分别读、写、读/写 空闲时间。

## 2.2介绍

Netty 提供了 IdleStateHandler ，ReadTimeoutHandler，WriteTimeoutHandler 三个 Handler 检测连接的有效性。

ReadTimeout 事件和 WriteTimeout 事件都会自动关闭连接，而且，属于异常处理，所以，重点分析IdleStateHandler。

序号

名称

作用

1

IdleStateHandler

当连接的空闲时间（读或者写）太长时，将会触发一个 IdleStateEvent 事件。然后你可以通过你的 ChannelInboundHandler 中重写 userEventTrigged 方法来处理该事件。

2

ReadTimeoutHandler

如果在指定的时间没有发生读事件，就会抛出这个异常，并自动关闭这个连接。你可以在 exceptionCaught 方法中处理这个异常。

3

WriteTimeoutHandler

当一个写操作不能在一定的时间内完成时，抛出此异常，并关闭连接。你同样可以在 exceptionCaught 方法中处理这个异常。

ReadTimeout 事件和 WriteTimeout 事件都会自动关闭连接，而且，属于异常处理，所以，这里只重点介绍IdleStateHandler。

## 3.IdleStateHandler分析

首先，当调用 addLast 添加 IdleStateHandler 到 pipeline 中时，会触发 handlerAdd 方法

```java
// 添加操作
pipeline.addLast(new IdleStateHandler(3,5,7, TimeUnit.SECONDS));
// 该方法
@Override
public void handlerAdded(ChannelHandlerContext ctx) throws Exception {
    if (ctx.channel().isActive() && ctx.channel().isRegistered()) {
        // channelActive() event has been fired already, which means this.channelActive() will
        // not be invoked. We have to initialize here instead.
        initialize(ctx);
    } else {
        // channelActive() event has not been fired yet.  this.channelActive() will be invoked
        // and initialization will occur there.
    }
}
```

关注initialize 方法，如下代码中，对 IdleStateHandler 的属性进行初始化过程，涉及到以下几个。

```java
private void initialize(ChannelHandlerContext ctx) {
    // Avoid the case where destroy() is called before scheduling timeouts.
    // See: https://github.com/netty/netty/issues/143
    switch (state) {
    case 1:
    case 2:
        return;
    }
    state = 1;
    initOutputChanged(ctx);
    lastReadTime = lastWriteTime = ticksInNanos();
    if (readerIdleTimeNanos > 0) {
        readerIdleTimeout = schedule(ctx, new ReaderIdleTimeoutTask(ctx),
                readerIdleTimeNanos, TimeUnit.NANOSECONDS);
    }
    if (writerIdleTimeNanos > 0) {
        writerIdleTimeout = schedule(ctx, new WriterIdleTimeoutTask(ctx),
                writerIdleTimeNanos, TimeUnit.NANOSECONDS);
    }
    if (allIdleTimeNanos > 0) {
        allIdleTimeout = schedule(ctx, new AllIdleTimeoutTask(ctx),
                allIdleTimeNanos, TimeUnit.NANOSECONDS);
    }
}
```

- private final boolean observeOutput; ： 是否考虑出站时候较慢的情况，默认是false
- private final long readerIdleTimeNanos; ： 读事件空闲时间，0 则禁用事件
- private final long writerIdleTimeNanos; ： 写事件空闲时间，0 则禁用事件
- private final long allIdleTimeNanos; ： 读/写事件空闲时间，0 则禁用事件

源码中，当参数 > 0 时，就创建一个定时任务，每个事件都创建，同时将 state 设置为1，避免重复初始化，调用 initOutputChanged 方法初始化监控出站数据属性。

创建定时任务源码如下，利用 channel 中的 EventLoop 来添加一个 Scheduler，看源码并 debug，观察 EventLoop 中 Scheduler 线程池中是否有新增任务，如下：

```java
ScheduledFuture<?> schedule(ChannelHandlerContext ctx, Runnable task, long delay, TimeUnit unit) {
    return ctx.executor().schedule(task, delay, unit);
}
```

在ScheduledTaskQueue 中的确有3个Task，因为 addLast 的方法中有三个参数都被初始化了，那么我们来看下对应的三个 Task 实现方法。

三个Task 都是 ChannelDuplexHandler 中的内部类，并且有一个共同父类， AbstractIdleTask

```java
  private abstract static class AbstractIdleTask implements Runnable {
        private final ChannelHandlerContext ctx;
        AbstractIdleTask(ChannelHandlerContext ctx) {
            this.ctx = ctx;
        }
        @Override
        public void run() {
            if (!ctx.channel().isOpen()) {
                return;
            }
            run(ctx);
        }
        protected abstract void run(ChannelHandlerContext ctx);
    }
```

- AbstractIdleTask内部类设计用来单例模式，模板模式UML如下

- 模板方法的通用流程：当通道关闭，就不执行任务，反之则执行抽象方法 run 方法，

## 3.1 读事件 task 分析

- 先看 ReaderIdelTimeoutTask 方法中的 run 方法的实现

```java
private final class ReaderIdleTimeoutTask extends AbstractIdleTask {
    ReaderIdleTimeoutTask(ChannelHandlerContext ctx) {
        super(ctx);
    }
    @Override
    protected void run(ChannelHandlerContext ctx) {
        long nextDelay = readerIdleTimeNanos;
        if (!reading) {
            nextDelay -= ticksInNanos() - lastReadTime;
        }
        if (nextDelay <= 0) {
            // Reader is idle - set a new timeout and notify the callback.
            // 用于取消任务 promise
            readerIdleTimeout = schedule(ctx, this, readerIdleTimeNanos, TimeUnit.NANOSECONDS);
            boolean first = firstReaderIdleEvent;
            firstReaderIdleEvent = false;
            try {
                // 再次提交任务
                IdleStateEvent event = newIdleStateEvent(IdleState.READER_IDLE, first);
                // 触发用户 handler use
                channelIdle(ctx, event);
            } catch (Throwable t) {
                ctx.fireExceptionCaught(t);
            }
        } else {
            // Read occurred before the timeout - set a new timeout with shorter delay.
            readerIdleTimeout = schedule(ctx, this, nextDelay, TimeUnit.NANOSECONDS);
        }
    }
}
```

> 说明：
>
> 1、得到用户设置的超时时间。
>
> 2、如果读取操作结束了（执行了 channelReadComplete 方法设置），就用当前时间减去给定时间和最后一次读（执行了操作的时间 channelReadComplete 方法设置），如果小于 0 ，就触发事件。反之，继续放入队列。间隔时间是新的计算时间。
>
> 3、触发的逻辑是：首先将任务再次放到队列，时间是刚开始设置的时间，返回一个 promise 对象，用于做取消操作。然后，设置 first 属性为 false，表示下一次读取不是第一次了。这个属性在 channelRead 方法会被改成 true。
>
> 4、创建一个 IdleStateEvent 类型的写事件对象，将此对象传递给用户的 UserEventTriggered 方法。完成触发事件的操作。
>
> 5、总的来说，每次读取操作都会记录一个时间，定时任务时间到了，会计算当前时间和最后一次读的时间的间隔，如果间隔超过了设置的时间，就出发 UserEventTriggered 方法。

## 3.2 写事件 task 分析

- 写事件的run方法WriterIdleTimeoutTask， 和读事件的差不多，如下有一点区别

```java
private final class WriterIdleTimeoutTask extends AbstractIdleTask {
    WriterIdleTimeoutTask(ChannelHandlerContext ctx) {
        super(ctx);
    }
    @Override
    protected void run(ChannelHandlerContext ctx) {
        long lastWriteTime = IdleStateHandler.this.lastWriteTime;
        long nextDelay = writerIdleTimeNanos - (ticksInNanos() - lastWriteTime);
        if (nextDelay <= 0) {
            // Writer is idle - set a new timeout and notify the callback.
            writerIdleTimeout = schedule(ctx, this, writerIdleTimeNanos, TimeUnit.NANOSECONDS);
            boolean first = firstWriterIdleEvent;
            firstWriterIdleEvent = false;
            try {
                if (hasOutputChanged(ctx, first)) {
                    return;
                }
                IdleStateEvent event = newIdleStateEvent(IdleState.WRITER_IDLE, first);
                channelIdle(ctx, event);
            } catch (Throwable t) {
                ctx.fireExceptionCaught(t);
            }
        } else {
            // Write occurred before the timeout - set a new timeout with shorter delay.
            writerIdleTimeout = schedule(ctx, this, nextDelay, TimeUnit.NANOSECONDS);
        }
    }
}
```

- 不通地方在于，run代码中多了一个判断hasOutputChanged 用来判断出站事件处理是否很慢，例如，我一个出站需要写的数据量大，需要处理20秒，但是我们执行写事件监测的时间是 5秒，此时我们只有第一次会触发，因为 hasOutputChanged 中有判断first 的时候还是会执行异常抛出

## 3.3 所有事件（读/写）事件 task 分析

```java
private final class AllIdleTimeoutTask extends AbstractIdleTask {
    AllIdleTimeoutTask(ChannelHandlerContext ctx) {
        super(ctx);
    }
    @Override
    protected void run(ChannelHandlerContext ctx) {
        long nextDelay = allIdleTimeNanos;
        if (!reading) {
            nextDelay -= ticksInNanos() - Math.max(lastReadTime, lastWriteTime);
        }
        if (nextDelay <= 0) {
            // Both reader and writer are idle - set a new timeout and
            // notify the callback.
            allIdleTimeout = schedule(ctx, this, allIdleTimeNanos, TimeUnit.NANOSECONDS);
            boolean first = firstAllIdleEvent;
            firstAllIdleEvent = false;
            try {
                if (hasOutputChanged(ctx, first)) {
                    return;
                }
                IdleStateEvent event = newIdleStateEvent(IdleState.ALL_IDLE, first);
                channelIdle(ctx, event);
            } catch (Throwable t) {
                ctx.fireExceptionCaught(t);
            }
        } else {
            // Either read or write occurred before the timeout - set a new
            // timeout with shorter delay.
            allIdleTimeout = schedule(ctx, this, nextDelay, TimeUnit.NANOSECONDS);
        }
    }
}
```

- 与写事件基本一致，不同地方在于事件判断
- nextDelay -= tickInNanos() - Math.max(lastReadTime, lastWriteTime);当前时间-最后一次写/读的时间，如果>0说明超过了
- 此处的时间判断是取读，写事件中的最大值，然后像写事件一样，判断是否发生了写很慢的情况

## 4.Netty心跳机制总结

1、IdleStateHandler 实现心跳检测功能，当服务器和客户端没有任务读写，并且超过设置事件，会触发 handler 的 userEventTriggered 方法，用户可以在这个方法中实现自己的逻辑。

2、IdleStateHandler 的实现基于 EventLoop 的定时任务，每次读写都会记录一个值，在定时任务运行的时候，通过计算当前时间和设置时间和上次事件发生时间的结果，来判断是否空闲。

3、内部有 3 个定时任务，分别对应读事件、写事件、读写事件。通常用户监听读写事件就足够了。

4、同时，IdleStateHandler 内部也考虑了一些极端情况：客户端接收缓慢，一次接收数据的速度超过了设置的空闲时间。Netty 通过构造方法中的 observeOutput 属性来决定是否对出站缓冲区的情况进行判断。

5、如果出站缓慢，Netty 不任务这是空闲，也就不触发空闲事件。但第一次无论如何也是要触发的。因为第一次无法判断是出站缓慢还是空闲。当然，出站缓慢的话，可能造成 OOM，OOM比空闲的问题更大。

6、所以，当你的应用出现了内存溢出，OOM之类，并且写空闲极少发生（使用了 observeOutput 为 true），那么就需要注意是不是数据出站速度过慢。

7、还有一个注意的地方：就是 ReadTimeoutHandler，它继承自 IdelStateHandler，当触发读空闲事件的时候，就触发 ctx.fireExceptionCaught 方法，并传入一个 ReadTimeoutException，然后关闭 Socket。

8、而 WriteTimeoutHandler 的实现不是基于 IdleStateHandler 的，他的原理是，当调用 write方法的时候，会创建一个定时任务，任务内容是根据传入的 promise 的完成情况来判断是否超出了写的时间。当定时任务根据指定时间开始运行，发现 promise 的 isDone 方法返回 false，表名还没有写完，说明超时了，则抛出异常。当 write 方法完成后，会打断定时任务。
