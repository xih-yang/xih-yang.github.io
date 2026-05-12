# 04、Netty学习 - ChannelHandler
- 来源：https://ddkk.com/zhuanlan/server/netty/5/4.html
- 分类：服务器框架
- 分组：教程目录
先简略了解一下`ChannelPipeline`和`ChannelHandler`的概念。

> 想象一个流水线车间。当组件从流水线头部进入，穿越流水线，流水线上的工人按顺序对组件进行加工，到达流水线尾部时商品组装完成。可以将ChannelPipeline当做流水线，ChannelHandler当做流水线工人。源头的组件当做event，如read,write等等。

本篇文章我们先来讲讲`ChannelHandler`的相关知识，下面进入正文吧。

## 正文

### ChannelHandler

- ChannelHandler并不处理事件，而由其子类代为处理：ChannelInboundHandler拦截和处理入站事件，ChannelOutboundHandler拦截和处理出站事件。
- ChannelHandler和ChannelHandlerContext通过组合或继承的方式关联到一起成对使用。事件通过ChannelHandlerContext主动调用如fireXXX()和write(msg)等方法，将事件传播到下一个处理器。

`注意`：入站事件在`ChannelPipeline`双向链表中由头到尾正向传播，出站事件则方向相反。

`ChannaleHandler` 作为最顶层的接口，并不处理入站和出站事件，所以接口中只包含最基本的方法：

```java
 // Handler本身被添加到ChannelPipeline时调用
 void handlerAdded(ChannelHandlerContext var1) throws Exception;
  // Handler本身被从ChannelPipeline中删除时调用
 void handlerRemoved(ChannelHandlerContext var1) throws Exception;
 
 // 发生异常时调用
 @Deprecated
 void exceptionCaught(ChannelHandlerContext var1, Throwable var2) throws Exception;
```

`Sharable`注解：

> 当客户端连接到服务器时，Netty新建一个ChannelPipeline处理其中的事件，而一个ChannelPipeline中含有若干ChannelHandler。如果每个客户端连接都新建一个ChannelHandler实例，当有大量客户端时，服务器将保存大量的ChannelHandler实例。为此，Netty提供了Sharable注解，如果一个ChannelHandler状态无关，那么可将其标注为Sharable，如此，服务器只需保存一个实例就能处理所有客户端的事件。

```java
 @Inherited
 @Documented
 @Target({ElementType.TYPE})
 @Retention(RetentionPolicy.RUNTIME)
 public @interface Sharable {
 }
```

作为`ChannelHandler`的默认实现，`ChannelHandlerAdapter`有个重要的方法`isSharable()`，代码如下：

```java
 public boolean isSharable() {
     Class<?> clazz = this.getClass();
     // 每个线程一个缓存
     Map<Class<?>, Boolean> cache = InternalThreadLocalMap.get().handlerSharableCache();
     Boolean sharable = (Boolean)cache.get(clazz);
     if (sharable == null) {
         // Handler是否存在Sharable注解
         sharable = clazz.isAnnotationPresent(Sharable.class);
         cache.put(clazz, sharable);
     }
 
     return sharable;
 }
```

这里引入了优化的线程局部变量`InternalThreadLocalMap`，即每个线程都有一份`ChannelHandler`是否`Sharable`的缓存。这样可以减少线程间的竞争，提升性能。

### ChannelInboundHandler

> ChannelInboundHandler处理入站数据以及各种状态变化，当Channel状态发生改变会调用ChannelInboundHandler中的一些生命周期方法。这些方法与Channel的生命密切相关。

入站数据,就是进入`socket`的数据。下面展示一些该接口的生命周期API：

`ChannelInboundHandlerAdapter`作为`ChannelInboundHandler`的实现，默认将入站事件自动传播到下一个入站处理器。其中的代码高度一致，如下：

```java
 public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
     ctx.fireChannelRead(msg);
 }
```

### ChannelOutboundHandler

> 出站操作和数据将由 ChannelOutboundHandler 处理。它的方法将被 Channel、 ChannelPipeline 以及 ChannelHandlerContext 调用。ChannelOutboundHandler 的一个强大的功能是可以按需推迟操作或者事件，这使得可以通过一些复杂的方法来处理请求。
>
> 例如， 如果到远程节点的写入被暂停了， 那么你可以推迟冲刷操作并在稍后继续。

同理，`ChannelOutboundHandlerAdapter`作为`ChannelOutboundHandler`的事件，默认将出站事件传播到下一个出站处理器：

```java
 @Override
 public void read(ChannelHandlerContext ctx) throws Exception {
     ctx.read();
 }
```

### ChannelDuplexHandler

`ChannelDuplexHandler`则同时实现了`ChannelInboundHandler`和`ChannelOutboundHandler`接口。如果一个所需的`ChannelHandler`既要处理入站事件又要处理出站事件，推荐继承此类。

## 总结

以上就是关于`ChannelHandler`的分析，相信你对`ChannelHandler`也有一定的了解，下期我们再来分析`ChannelPipeline`的源码。
