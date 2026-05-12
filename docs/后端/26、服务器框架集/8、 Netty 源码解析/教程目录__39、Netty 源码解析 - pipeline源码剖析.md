# 39、Netty 源码解析 - pipeline源码剖析
- 来源：https://ddkk.com/zhuanlan/server/netty/1/39.html
- 分类：服务器框架
- 分组：教程目录
## 一、pipeline 调度 handler

1、当一个请求进来的时候，pipeline 是如何调用内部的这些 handler 的？

2、首先，当一个请求进来的时候，会第一个调用 pipeline 的相关方法，如果是入站事件，这些方法由 fire 开头，表示开始管道的流动。让后面的 handler 继续处理。

### 1.1 说明

1、当浏览器输入 http://localhost:8007，可以看到会执行 handler

2、在Debug时，可以将断点下在 DefaultChannelPipeline 类的

```java
@Override
public final ChannelPipeline fireChannelRead(Object msg) {
     AbstractChannelHandlerContext.invokeChannelRead(head, msg); // 断点
     return this;
 }
```

### 1.2 源码解析（DefaultChannelPipeline）

1、pipeline 的 intbound 的 fire 方法实现

```java
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

可以看出来，这些方法都是 inbound 的方法，也就是入站事件，调用静态方法传入的也是 inbound 类型的 head handler。这些静态方法则会调用 head 的 ChannelInboundInvoker 接口的方法，然后再调用 handler 的真正方法

```java
private void invokeChannelRead(Object msg) {
  if (invokeHandler()) {
       try {
           ((ChannelInboundHandler) handler()).channelRead(this, msg);
       } catch (Throwable t) {
           notifyHandlerException(t);
       }
   } else {
       fireChannelRead(msg);
   }
}
```

2、pipeline 的 outbound 的 fire 方法实现

```java
public class DefaultChannelPipeline implements ChannelPipeline {
	@Override
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
}
```

- 这些都是出站的实现，但是调用的是 outbound 类型的 tail handler 来进行处理，因为这些都是 ountbound 事件
- 出站是 tail 开始，入站从 head 开始。因为出站是从内部向外面写，从 tail 开始，能够让前面的 handler 进行处理，防止 handler 被遗漏，比如编码。反之，入站是从 head 往内部输入，让后面的 handler 能够处理这些输入的数据，比如解码。虽然 head 也实现了 outbound 接口，但是不能从 head 开始执行出站任务。

### 1.3 pipeline 如何 调度 handler

- pipeline 首先会调用 Context 的静态方法 fireXXX，并传入 Context
- 然后，静态方法调用 Context 的 invoker 方法，而 invoker 方法内部会调用该 Context 所包含的 Handler 的真正的 XXX 方法，调用结束后，如果还需要继续向后传递，就调用 Context 的 fireXXX2 方法，循环往复。

### 1.4 总结

1、Context 包装 handler，多个 Context 在 pipeline 中形成了双向链表，入站方向叫 inbound，由 head 节点开始，出站方向叫 outbound，由 tail 节点开始

2、而节点中间的传递通过 AbstractChannelHandlerContext 类内部的 fire 系列方法完成，找到当前节点的下一个节点不断的循环传播。是一个过滤器模式完成对 handler 的调度。
