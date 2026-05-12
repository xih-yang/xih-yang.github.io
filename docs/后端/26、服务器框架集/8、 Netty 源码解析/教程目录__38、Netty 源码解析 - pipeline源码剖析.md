# 38、Netty 源码解析 - pipeline源码剖析
- 来源：https://ddkk.com/zhuanlan/server/netty/1/38.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本说明

Netty 中的 ChannelPipeline、ChannelHandler 和 ChannelHandlerContext 是非常核心的组件，我们从源码来分析 Netty 是如何设计这三个核心组件的，并分析是如何创建和协调工作的。

## 二、 三大核心组件介绍

### 2.1 三者关系

1、每当 ServerSocket 创建一个新的连接，就会创建一个 Socket，对应的就是目标客户端。

2、每一个新创建的 Socket 都将会分配一个全新的 ChannelPipeline（简称pipeline）。

3、每一个 ChannelPipeline 内部都含有多个 ChannelHandlerContext （简称Context）。

4、它们一起组成了双向链表，这些 Context 用于包装我们调用 addLast 方法时添加的 ChannelHandler（简称handler）

- 从图中可以看出，ChannelSocket 和 ChannelPipeline 是一对一的关联关系，而 pipeline 内部由多个 Context 形成了链表，Context 只是对 handler 的封装。
- 当有一个请求进来的时候，会进入 Socket 对应的 pipeline，并经过 pipeline 所有的 handler，这就是设计模式中的过滤器模式。

### 2.2 ChannelPipeline 作用及设计

可以看到 ChannelPipeline 接口继承了 Inbound、Outbound、Iterable 接口，表示它可以调用数据出站和入站的方法，同时也能遍历内部的链表，它的几个代表性的方法，基本上都是针对 handler 链表的插入、追加、删除、替换操作，类似是一个 LinkedList。同时，它也能够返回 channel：Channel channel()（也就是 socket）

1、在 pipeline 接口文档上，提供了一幅图

**说明：**

- 这是一个 handler 的 list，handler 用于处理或拦截入站事件和出站事件，pipeline 实现了过滤器的高级形式，以便用户控制事件如何处理 handler 在 pipeline 中的交互。
- 该图描述了一个典型的 handler 在 pipeline 中处理 I/O 事件的方式，I/O 事件由 InboundHandler 或者 outboundHandler 处理，并通过调用 ChannelHandlerContext.fireChannelRead 方法转发给其最近的处理程序。
- 如图所示，入站事件由入站处理程序以自下而上的方向处理。入站处理程序通常处理由图底部的 I/O 线程生成的入站数据。入站数据通常从 SocketChannel.read(ByteBuffer) 获取。
- 通常一个 pipeline 有多个 handler，例如，一个典型的服务器在每个通道的管道中都会有一下处理程序：协议解码器（将二进制数据转换为Java对象、协议编码器（将Java对象转换为二进制数据、业务逻辑处理程序。
- 注意：业务程序不能将线程阻塞，会影响 IO 的速度，进而影响整个 Netty 程序的性能。如果业务程序很快，就可以放在 IO 线程中，反之，需要异步执行。或者在添加 handler 的时候添加一个线程池，例如：

```java
// 下面这个任务执行的时候，将不会阻塞 IO 线程，执行的线程来自 group 线程池
pipeline.addLast(group,"handler",new MyBusinessLogicHandler());
```

### 2.3 ChannelHandler 作用及设计

1、源码

```java
public interface ChannelHandler {
	// 当把 ChannelHandler  添加到 pipeline 时被调用
	void handlerAdded(ChannelHandlerContext ctx) throws Exception;
	// 当从 pipeline 中移除时被调用
	void handlerRemoved(ChannelHandlerContext ctx) throws Exception;
	// 当处理过程中在 pipeline 发生异常时调用
	@Deprecated
    void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception;
}
```

2、ChannelHandler 的作用就是处理 IO 事件或拦截 IO 事件，并将其转发给下一个处理程序 ChannelHandler 。Handler 处理程序时分入站和出站，两个方向的操作都是不同的，因此，Netty 定义了两个子接口继承 ChannelHandler ：ChannelInboundHandler（入站事件接口）和 ChannelOutboundHandler（出站事件接口）

3、ChannelInboundHandler（入站事件接口）

- channelActive：用于当 Channel 处于活动状态时被调用
- channelRead：当从 Channel 读取数据时被调用
- 我们需要重写里面的方法，当发生关注的事件，需要在对应的方法实现业务逻辑，因为，当事件发生时，Netty 会回调对应的方法

4、ChannelOutboundHandler（出站事件接口）

- bind：当请求将 Channel 绑定到本地地址时调用
- close：当请求关闭 Channel 时调用
- 出站操作都是一些连接和写出数据类似的方法

5、ChannelDuplexHandler 处理出站和入站事件

- ChannelDuplexHandler 间接实现了入站接口并且实现了出站接口
- 是一个通用的能够同时处理入站事件和出站事件的类

### 2.4 ChannelHandlerContext 作用及设计

ChannelHandlerContext 继承了出站方法调用接口和入站方法调用接口

1、ChannelInboundInvoker 和 ChannelOutboundInvoker 部分源码

这两个invoker 就是针对入站或出站方法来的，就是在 入站或出站 handler 的外层再包装一层，达到在方法前后拦截并做一些特定操作的目的。

2、ChannelHandlerContext 部分源码

- ChannelHandlerContext 不仅仅继承了ChannelInboundInvoker 和ChannelOutboundInvoker 的方法，同时也定义了一些自己的方法。
- 这些方法能够获取 Context 上下文环境中对应的数据，比如：channel、executor、handler、pipeline、内存分配器、关联的handler是否被删除。
- Context 就是包装了 handler 相关的一切，以方便 Context 可以在 pipeline 中方便的操作 handler

### 2.5 pipeline、handler、context 创建过程

- 任何一个 ChannelSocket 创建的同时都会创建一个 pipeline
- 当用户或系统内部调用 pipeline 的 add**** 方法添加 handler 时，都会创建一个包装这个 handler 的 Context
- 这些 Context 在 pipeline 中组成了双向链表

1、Socket 创建的时候创建 pipeline，在 SocketChannel 的抽象父类 AbstractChannel 的构造方法中

```java
protected AbstractChannel(Channel parent) {
	this.parent = parent;
	id = newId();
    unsafe = newUnsafe();
    pipeline = newChannelPipeline(); // 断点
}
```

通过debug，继续追踪到

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

- 将 channel 赋值给 channel 字段，用于 pipeline 操作 channel
- 创建了一个 future 和 promise，用于异步回调使用
- 创建一个 inbound 的 TailContext，创建一个既是 inbound 类型又是 outbound 类型的 HeadContext
- 最后，将两个 Context 互相连接，形成双向链表
- TailContext 和 HeadContext 非常重要，所有的 pipeline 中的事件都会流经它们

2、在 add**** 添加处理器的时候创建 Context，可以看下 DefaultChannelPipeline 的 addLast 方法，代码如下：

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
        addLast(executor, null, h); // 进入
    }
    return this;
}
```

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

- pipeline 添加 handler，参数是线程池，name 是 null，handler 是自定义或者系统传入的 handler。Netty 为了防止多个线程导致安全问题，同步了这段代码
- 检查这个 handler 实例是否是共享的，如果不是，并且已经被别的 pipeline 使用了，则抛出异常
- 调用 newContext(group, filterName(name, handler), handler) 方法，创建一个 Context。从这里可以看出，每次添加一个 handler 都会创建一个关联 Context
- 调用 addLast 方法，将 Context 追加到链表中
- 如果这个通道还没有注册到 selector 上，就将这个 Context 添加到这个 pipeline 的待办任务中。当注册好了以后，就会调用 callHandlerAdded0() 方法（默认是什么都不做，用户可以实现这个方法）
- 到这里，针对三个对象创建过程，了解的差不多了，和最初说的一样，每当创建 ChannelSocket 的时候都会创建一个绑定的 pipeline，一对一的关系，创建 pipeline 的时候也会创建 tail 节点和 head 节点，形成最初的链表。tail 是入站 inbound 类型的 handler，head 既是 inbound 也是 outbound 类型的 handler。在调用 pipeline 的 addLast 方法的时候，会根据给定的 handler 创建一个 Context，然后，将这个 Context 插入到链表的尾部（tail前面）
