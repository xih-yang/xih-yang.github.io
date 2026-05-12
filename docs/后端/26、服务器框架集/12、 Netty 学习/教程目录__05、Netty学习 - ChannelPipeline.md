# 05、Netty学习 - ChannelPipeline
- 来源：https://ddkk.com/zhuanlan/server/netty/5/5.html
- 分类：服务器框架
- 分组：教程目录
我们在前面的文章中也对`ChannelPipeline`接口做了初步的介绍。

## ChannelPipeline 接口

`ChannelPipeline`接口采用了责任链设计模式，底层采用双向链表的数据结构，将链上的各个处理器串联起来。客户端每一个请求的到来，`ChannelPipeline`中所有的处理器都有机会处理它。

> 每一个新创建的Channel都将会被分配一个新的ChannelPipeline。这项关联是永久性的；Channel既不能附加另一个ChannelPipeline，也不能分离其当前的。

### 创建 ChannelPipeline

> ChannelPipeline数据管道是与Channel管道绑定的，一个Channel通道对应一个ChannelPipeline，ChannelPipeline是在Channel初始化时被创建。

观察下面这个实例：

```java
public void run() throws Exception {
    EventLoopGroup bossGroup = new NioEventLoopGroup(); // (1)
    EventLoopGroup workerGroup = new NioEventLoopGroup();
    try {
        ServerBootstrap b = new ServerBootstrap(); // (2)
        b.group(bossGroup, workerGroup)
            .channel(NioServerSocketChannel.class) // (3)
            .childHandler(new ChannelInitializer<SocketChannel>() { // (4)
                @Override
                public void initChannel(SocketChannel ch) throws Exception {
                    // 添加ChannelHandler到ChannelPipeline
                    ch.pipeline().addLast(new DiscardServerHandler());
                }
            })
            .option(ChannelOption.SO_BACKLOG, 128)          // (5)
            .childOption(ChannelOption.SO_KEEPALIVE, true); // (6)
        // 绑定端口，开始接收进来的连接
        ChannelFuture f = b.bind(port).sync(); // (7)
        System.out.println("DiscardServer已启动，端口：" + port);
        // 等待服务器  socket 关闭 。
        // 在这个例子中，这不会发生，但你可以优雅地关闭你的服务器。
        f.channel().closeFuture().sync();
    } finally {
        workerGroup.shutdownGracefully();
        bossGroup.shutdownGracefully();
    }
}
```

从上述代码中可以看到，当`ServerBootstrap`初始化后，直接就可以获取到`SocketChannel`上的`ChannelPipeline`，而无需手动实例化，因为 Netty 会为每个`Channel`连接创建一个`ChannelPipeline`。

`Channel`的大部分子类都继承了`AbstractChannel`，在创建实例时也会调用`AbstractChannel`构造器。在`AbstractChannel`构造器中会创建`ChannelPipeline`管道实例，核心代码如下：

```java
protected AbstractChannel(Channel parent) {
    this.parent = parent;
    this.id = this.newId();
    this.unsafe = this.newUnsafe();
    this.pipeline = this.newChannelPipeline();
}
protected DefaultChannelPipeline newChannelPipeline() {
    return new DefaultChannelPipeline(this);
}
```

从上述代码中可以看出，在创建`Channel`时，会由`Channel`创建`DefaultChannelPipeline`类的实例。`DefaultChannelPipeline`是`ChannelPipeline`的默认实现。

`pipeline`是`AbstractChannel`的属性，内部维护着一个以`AbstractChannelHandlerContext`为节点的双向链表，创建的`head`和`tail`节点分别指向链表头尾，源码如下：

```java
public class DefaultChannelPipeline implements ChannelPipeline {   	
    protected DefaultChannelPipeline(Channel channel) {
        this.channel = (Channel)ObjectUtil.checkNotNull(channel, "channel");
        this.succeededFuture = new SucceededChannelFuture(channel, (EventExecutor)null);
        this.voidPromise = new VoidChannelPromise(channel, true);
        this.tail = new DefaultChannelPipeline.TailContext(this);
        this.head = new DefaultChannelPipeline.HeadContext(this);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
    ...
    final class TailContext extends AbstractChannelHandlerContext implements ChannelInboundHandler {
        TailContext(DefaultChannelPipeline pipeline) {
            super(pipeline, (EventExecutor)null, DefaultChannelPipeline.TAIL_NAME, DefaultChannelPipeline.TailContext.class);
            this.setAddComplete();
        }
    ...
    }
      final class HeadContext extends AbstractChannelHandlerContext implements ChannelOutboundHandler, ChannelInboundHandler {
        private final Unsafe unsafe;
        HeadContext(DefaultChannelPipeline pipeline) {
            super(pipeline, (EventExecutor)null, DefaultChannelPipeline.HEAD_NAME, DefaultChannelPipeline.HeadContext.class);
            this.unsafe = pipeline.channel().unsafe();
            this.setAddComplete();
        }
     	...
      }
     ...
}
```

从上述源码可以看到，`TailContext`和`HeadContext`都继承了`AbstractChannelHandlerContext`，并实现了`ChannelHandler`接口。`AbstractChannelHandlerContext`内部维护着`next`、`prev`链表指针和入站、出站节点方向等。其中`TailContext`实现了`ChannelInboundHandler`，`HeadContext`实现了`ChannelOutboundHandler`和`ChannelInboundHandler`。

### ChannelPipeline 事件传输机制

通过`ChannelPipeline`的`addFirst()`方法来添加`ChannelHandler`，并为这个`ChannelHandler`创建一个对应的`DefaultChannelHandlerContext`实例。

```java
public class DefaultChannelPipeline implements ChannelPipeline {  
    //...
	public final ChannelPipeline addFirst(EventExecutorGroup group, String name, ChannelHandler handler) {
        AbstractChannelHandlerContext newCtx;
        synchronized(this) {
            checkMultiplicity(handler);
            name = this.filterName(name, handler);
            newCtx = this.newContext(group, name, handler);
            this.addFirst0(newCtx);
            if (!this.registered) {
                newCtx.setAddPending();
                this.callHandlerCallbackLater(newCtx, true);
                return this;
            }
            EventExecutor executor = newCtx.executor();
            if (!executor.inEventLoop()) {
                this.callHandlerAddedInEventLoop(newCtx, executor);
                return this;
            }
        }
        this.callHandlerAdded0(newCtx);
        return this;
    }
    //...
    private AbstractChannelHandlerContext newContext(EventExecutorGroup group, String name, ChannelHandler handler) {
        return new DefaultChannelHandlerContext(this, this.childExecutor(group), name, handler);
    }
    //...
}
```

处理出站事件

当处理出站事件时，`channelRead()`方法的示例如下：

```java
public class EchoServerHandler extends ChannelInboundHandlerAdapter {
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg) {
		System.out.println(ctx.channel().remoteAddress() + " -> Server :" + msg);
		// 写消息到管道
		ctx.write(msg);// 写消息
	}
	//...
}
```

上述代码中的`write()`方法会触发一个出站事件，该方法会调用`DefaultChannelPipeline`上的`write()`方法。

```java
public final ChannelFuture write(Object msg) {
    return this.tail.write(msg);
}
```

从上述源码可以看到，调用的是`DefaultChannelPipeline`上尾部节点（tail）的`write`方法。

上述方法最终会调用到`DefaultChannelHandlerContext`的`write()`方法。

```java
private void write(Object msg, boolean flush, ChannelPromise promise) {
    ObjectUtil.checkNotNull(msg, "msg");
    try {
        if (this.isNotValidPromise(promise, true)) {
            ReferenceCountUtil.release(msg);
            return;
        }
    } catch (RuntimeException var8) {
        ReferenceCountUtil.release(msg);
        throw var8;
    }
    AbstractChannelHandlerContext next = this.findContextOutbound(flush ? 98304 : '耀');
    Object m = this.pipeline.touch(msg, next);
    EventExecutor executor = next.executor();
    if (executor.inEventLoop()) {
        if (flush) {
            next.invokeWriteAndFlush(m, promise);
        } else {
            next.invokeWrite(m, promise);
        }
    } else {
        AbstractChannelHandlerContext.WriteTask task = AbstractChannelHandlerContext.WriteTask.newInstance(next, m, promise, flush);
        if (!safeExecute(executor, task, promise, m, !flush)) {
            task.cancel();
        }
    }
}
```

上述的`write()`方法会查找下一个出站的节点，也就是当前`ChannelHandler`后的一个出站类型的`ChannelHandler`，并调用下一个节点的`invokeWrite()`方法。

```java
void invokeWrite(Object msg, ChannelPromise promise) {
    if (this.invokeHandler()) {
        this.invokeWrite0(msg, promise);
    } else {
        this.write(msg, promise);
    }
}
```

接着调用`invokeWrite0()`方法，该方法最终调用`ChannelOutboundHandler`的`write`方法。

```java
    private void invokeWrite0(Object msg, ChannelPromise promise) {
        try {
            ((ChannelOutboundHandler)this.handler()).write(this, msg, promise);
        } catch (Throwable var4) {
            notifyOutboundHandlerException(var4, promise);
        }
    }
```

至此，处理完成了第一个节点的处理，开始执行下一个节点并不断循环。

所以，处理出站事件时，数据传输的方向是从尾部节点`tail`到头部节点`head`。

处理入站事件

入站事件处理的起点是触发`ChannelPipeline fire`方法，例如`fireChannelActive()`方法的示例如下：

```java
public class DefaultChannelPipeline implements ChannelPipeline {   	  
    //...
    public final ChannelPipeline fireChannelActive() {
            AbstractChannelHandlerContext.invokeChannelActive(this.head);
            return this;
        }
    //...
}
```

从上述源码可以看到，处理的节点是头部节点`head`。`AbstractChannelHandlerContext.invokeChannelActive`方法定义如下：

```java
static void invokeChannelActive(final AbstractChannelHandlerContext next) {
    EventExecutor executor = next.executor();
    if (executor.inEventLoop()) {
        next.invokeChannelActive();
    } else {
        executor.execute(new Runnable() {
            public void run() {
                next.invokeChannelActive();
            }
        });
    }
}
```

该方法最终调用`ChannelInboundHandler`的`channelActive`方法。

```java
private void invokeChannelActive() {
    if (this.invokeHandler()) {
        try {
            ((ChannelInboundHandler)this.handler()).channelActive(this);
        } catch (Throwable var2) {
            this.invokeExceptionCaught(var2);
        }
    } else {
        this.fireChannelActive();
    }
}
```

至此完成了第一个节点的处理，开始执行下一个节点的不断循环。

所以，处理入站事件时，数据传输的方向是从头部节点`head`到尾部节点`tail`。

### ChannelPipeline 中的 ChannelHandler

从上述的`ChannelPipeline`接口源码可以看出，`ChannelPipeline`是通过`addXxx`或者`removeXxx`方法来将`ChannelHandler`动态的添加到`ChannelPipeline`中，或者从`ChannelPipeline`移除`ChannelHandler`的。那么`ChannelPipeline`是如何保障并发访问时的安全呢？

以`addLast`方法为例，`DefaultChannelPipeline`的源码如下：

```java
public final ChannelPipeline addLast(EventExecutorGroup group, String name, ChannelHandler handler) {
    AbstractChannelHandlerContext newCtx;
    //synchronized 保障线程安全
    synchronized(this) {
        checkMultiplicity(handler);
        newCtx = this.newContext(group, this.filterName(name, handler), handler);
        this.addLast0(newCtx);
        if (!this.registered) {
            newCtx.setAddPending();
            this.callHandlerCallbackLater(newCtx, true);
            return this;
        }
        EventExecutor executor = newCtx.executor();
        if (!executor.inEventLoop()) {
            this.callHandlerAddedInEventLoop(newCtx, executor);
            return this;
        }
    }
    this.callHandlerAdded0(newCtx);
    return this;
}
```

从上述源码可以看到，使用`synchronized`关键字保障了线程的安全访问。其他方法的实现方式也是类似。

### ChannelHandlerContext 接口

`ChannelHandlerContext`接口是联系`ChannelHandler`和`ChannelPipeline`之间的纽带。

每当有`ChannelHandler`添加到`ChannelPipeline`中时，都会创建`ChannelHandlerContext`。`ChannelHandlerContext`的主要功能是管理它所关联的`ChannelHandler`和在同一个`ChannelPipeline`中的其他`ChannelHandler`之间的交互。

例如，`ChannelHandlerContext`可以通知`ChannelPipeline`中的下一个`ChannelHandler`开始执行及动态修改其所属的`ChannelPipeline`。

`ChannelHandlerContext`中包含了许多方法，其中一些方法也出现在`Channel`和`ChannelPipeline`中。如果通过`Channel`或`ChannelPipeline`的实例来调用这些方法，它们就会在整个`ChannelPipeline`中传播。相比之下，一样的方法在`ChannelHandlerContext`的实例上调用，就只会从当前的`ChannelHandler`开始并传播到相关管道中的下一个有处理事件能力的`ChannelHandler`中。因此，`ChannelHandlerContext`所包含的事件流比其他类中同样的方法都要短，利用这一点可以尽可能提高性能。

ChannelHandlerContext 与其他组件的关系

下图展示了`ChannelPipeline`、`Channel`、`ChannelHandler`和`ChannelHandlerContext`之间的关系做了如下说明：

（1）`Channel`被绑定到`ChannelPipeline`上。

（2）和`Channel`绑定的`ChannelPipeline`包含了所有的`ChannelHandler`。

（3）`ChannelHandler`。

（4）当添加`ChannelHandler`到`ChannelPipeline`时，`ChannelHandlerContext`被创建。

跳过某些 ChannelHandler

下面的代码，展示了从`ChannelHandlerContext`获取到`Channel`的引用，并通过调用`Channel`上的`write()`方法来触发一个写事件到流中。

```java
ChannelHandlerContext ctx = context;
Channel channel = ctx.channel(); //获取ChannelHandlerContext上的Channel
channel.write(msg);
```

以下代码展示了从`ChannelHandlerContext`获取到`ChannelPipeline`。

```java
ChannelHandlerContext ctx = context;
ChannelPipeline pipeline = ctx.pipeline(); //获取ChannelHandlerContext上的ChannelPipeline 
pipeline.write(msg);
```

上述的两个示例，事件流是一样的。虽然被调用的`Channel`和`ChannelPipeline`上的`write()`方法将一直传播事件通过整个`ChannelPipeline`，但是在`ChannelHandler`的级别上，事件从一个`ChannelHandler`到下一个`ChannelHandler`的移动是由`ChannelHandlerContext`上的调用完成的。

下图展示了`Channel`或者`ChannelPipeline`进行的事件传播机制。

在上图中可以看出：

（1）事件传递给`ChannelPipeline`的第一个`ChannelHandler`；

（2）`ChannelHandler`通过关联的`ChannelHandlerContext`传递事件给`ChannelPipeline`中的下一个`ChannelHandler`。

（3）`ChannelHandler`通过关联的`ChannelHandlerContext`传递事件给`ChannelPipeline`中的下一个`ChannelHandler`。

从上面的流程可以看出，如果通过`Channel`或`ChannelPipeline`的实例来调用这些方法，它们肯定会在整个`ChannelPipeline`中传播。

> 那么是否可以跳过某些处理器呢？答案是肯定的。

通过减少`ChannelHandler`不感兴趣的事件的传递减少开销，并排除掉特定的对此事件感兴趣的处理器的处理以提升性能。想要实现从一个特定的`ChannelHandler`开始处理，必须引用与此`ChannelHandler`的前一个`ChannelHandler`关联的`ChannelHandlerContext`。这个`ChannelHandlerContext`将会调用与自身关联的`ChannelHandler`的下一个`ChannelHandler`，代码如下：

```java
ChannelHandlerContext ctx = context;
ctx.write(msg);
```

直接调用`ChannelHandlerContext`的`write()`方法，将会把缓冲区发送到下一个`ChannelHandler`。

如下图，消息会将从下一个`ChannelHandler`开始流过`ChannelPipeline`，绕过所有在它之前的`ChannelHandler`。

（1）执行`ChannelHandlerContext`方法调用。

（2）事件发送到了下一个`ChannelHandler`。

（3）经过最后一个`ChannelHandler`后，事件从`ChannelPipeline`中移除。

当调用某个特定的`ChannelHandler`操作时，它尤为有用。

例如：

```java
public class EchoServerHandler extends ChannelInboundHandlerAdapter {
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg) {
		System.out.println(ctx.channel().remoteAddress() + " -> Server :" + msg);
        // 写消息到管道
		ctx.write(msg);// 写消息
		ctx.flush(); // 冲刷消息
		// 上面两个方法等同于 ctx.writeAndFlush(msg);
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
		// 当出现异常就关闭连接
		cause.printStackTrace();
		ctx.close();
	}
}
```

## 总结

以上就是关于`ChannelPipeline`的源码分析，相信认真看完了，你就明白`ChannelPipeline`、`Channel`、`ChannelHandler`和`ChannelHandlerContext`之间的关系。下节我们继续来剖析 Netty 的源码。
