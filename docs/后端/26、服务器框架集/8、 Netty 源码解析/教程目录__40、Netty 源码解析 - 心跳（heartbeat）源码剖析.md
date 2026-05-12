# 40、Netty 源码解析 - 心跳（heartbeat）源码剖析
- 来源：https://ddkk.com/zhuanlan/server/netty/1/40.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本说明

Netty 作为一个网络框架，提供了诸多功能，比如编码解码等，Netty 还提供了非常重要的一个服务-----心跳机制heartbeat。通过心跳检查对方是否有效，这是 RPC 框架中必不可少的功能。

1、Netty 提供了 IdleStateHandler、ReadTimeoutHandler、WriteTimeoutHandler 三个 Handler 检测连接的有效性，重点分析 IdleStateHandler

2、简单描述

序号
名称
作用

1
IdleStateHandler
当连接的空闲时间（读或者写）太长时，将会触发一个 IdleStateEvent 事件，然后，你可以通过你的 ChannelInboundHandler 中重写 userEventTriggered 方法来处理该事件

2
ReadTimeoutHandler
如果在指定的时间没有发生读事件，就会抛出异常，并自动关闭这个连接。你可以在 exceptionCaught 方法中处理这个异常

3
WriteTimeoutHandler
当一个写操作不能在一定的时间内完成时，就会抛出异常，并关闭连接。你同样可以在 exceptionCaught 方法中处理这个异常

3、ReadTimeout 事件和 WriteTimeout 事件都会自动关闭连接，而且属于异常处理。

## 二、IdleStateHandler

### 2.1 四个属性

```java
private final boolean observeOutput; // 是否考虑出站慢的情况，默认值：false
private final long readerIdleTimeNanos; // 读事件空闲时间，0 则禁用事件
private final long writerIdleTimeNanos; // 写事件空闲时间，0 则禁用事件
private final long allIdleTimeNanos; // 读或写空闲时间，0 则禁用事件
```

### 2.2 handlerAdded 方法

当该handler 被添加到 pipeline 中时，则调用 initialize 方法

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
    	// 这里的 schedule 方法会调用 eventLoop 的 schedule 方法，将定时任务添加到队列中
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

只要给定的参数大于0，就创建一个定时任务，每个事件都创建。同时，将 state 状态设置为 1，防止重复初始化。调用 initOutputChanged 方法，初始化“监控出站数据属性”

### 2.3 三个定时任务类（内部类）

1、这三个定时任务分别对应：读、写、读或者写 事件，共有一个父类 AbstractIdleTask，这个父类提供了一个模板方法

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

**说明：** 当通道关闭了，就不执行任务了。反之，执行子类的 run 方法

2、读事件的 run 方法（即 ReaderIdleTimeoutTask 的 run 方法）

```java
@Override
protected void run(ChannelHandlerContext ctx) {
    long nextDelay = readerIdleTimeNanos;
    if (!reading) {
        nextDelay -= ticksInNanos() - lastReadTime;
    }
    if (nextDelay <= 0) {
        // Reader is idle - set a new timeout and notify the callback.
        readerIdleTimeout = schedule(ctx, this, readerIdleTimeNanos, TimeUnit.NANOSECONDS);
        boolean first = firstReaderIdleEvent;
        firstReaderIdleEvent = false;
        try {
            IdleStateEvent event = newIdleStateEvent(IdleState.READER_IDLE, first);
            channelIdle(ctx, event);
        } catch (Throwable t) {
            ctx.fireExceptionCaught(t);
        }
    } else {
        // Read occurred before the timeout - set a new timeout with shorter delay.
        readerIdleTimeout = schedule(ctx, this, nextDelay, TimeUnit.NANOSECONDS);
    }
}
```

- 得到用户设置的超时时间
- 如果读取操作结束了（执行了 channelReadComplete 方法设置），就用当前时间减去给定时间和最后一次读操作的时间（执行了 channelReadComplete 方法设置），如果小于0，就触发事件。反之，继续放入队列，间隔时间是新的计算时间。
- 触发的逻辑是，首先将任务再次放到队列，时间是刚开始设置的时间，返回一个 promise 对象，用于做取消操作。然后，设置 first 属性为false，表示，下一次读取不再是第一次了，这个属性在 channelRead 方法会被改成 true。
- 创建一个 IdleStateEvent 类型的事件对象，将此对象传递给用户的 userEventTriggered 方法，完成触发事件的操作。
- 总的来说，每次读取操作都会记录一个时间，定时任务时间到了，会计算当前时间和最后一次读的时间的间隔，如果间隔超过了设置的时间，就触发 userEventTriggered 方法。

3、写事件的 run 方法（即 WriterIdleTimeoutTask 的 run 方法）

```java
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
```

写任务的 run 代码逻辑基本和读任务的逻辑一样，唯一不同的就是有一个针对 出站较慢数据的判断：hasOutputChanged

3、所有事件的 run 方法（即 AllIdleTimeoutTask 的 run 方法）

```java
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
```

- 表示监控所有事件。当读写事件发生时，都会记录。代码逻辑和写事件的基本一致
- 唯一的不同在于

```java
long nextDelay = allIdleTimeNanos;
if (!reading) {
	// 当前时间减去 最后一次读或写的时间，若大于0，说明超时了
    nextDelay -= ticksInNanos() - Math.max(lastReadTime, lastWriteTime);
}
```

- 这里的时间计算是取 读写事件 中的最大值。然后像写事件一样，判断是否发生了写慢的情况

## 三、总结

**1、** IdleStateHandler可以实现心跳功能，当服务器和客户端没有任何读写交互时，并超过了给定的时间，则会触发用户handler的userEventTriggered方法用户可以在这个方法中尝试向对方发送消息，如果发送失败，则关闭连接；

**2、** IdleStateHandler的实现基于EventLoop的定时任务，每次读写都会记录一个值，在定时任务运行的时候，通过计算当前时间和设置时间和上次事件发生时间的结果，来判断是否空闲；

**3、** 内部有3个定时任务，分别对应读事件、写事件、读写事件通常用户监听读写事件就足够了；

**4、** 同时，IdleStateHandler内部也考虑了一些极端情况，客户端接收缓慢，一次接收数据的速度超过了设置的空闲时间Netty通过构造方法中的observeOutput属性来决定是否对出站缓冲区的情况进行判断；

**5、** 如果出站缓慢，Netty不认为这是空闲，也就不触发空闲事件但第一次无论如何也是要触发的因为第一次无法判断时出站缓慢还是空闲当然，出站缓慢的话，可能造成OOM，OOM比空闲的问题更大；

**6、** 所以，当你的应用出现了内存溢出，OOM之类，并且写空闲极少发生（使用了observeOutput为true），那么就需要注意是不是数据出站速度过慢；

**7、** 还有一个注意的地方，就是ReadTimeoutHandler，它继承自IdleStateHandler，当触发读空闲事件的时候，就触发ctx.fireExceptionCaught方法，并传入一个ReadTimeoutException，然后关闭Socket；

**8、** 而WriteTimeoutHandler的实现不是基于IdleStateHandler的，它的原理是，当调用write方法的时候，会创建一个定时任务，任务内容是根据传入的promise的完成情况来判断是否超出了写的时间当定时任务根据指定时间开始运行，发现promise的isDone方法返回false，表明还没有写完，说明超时了，则抛出异常当write方法完成后，会打断定时任务；
