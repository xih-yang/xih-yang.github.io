# 03、Netty学习 - Channel 概述
- 来源：https://ddkk.com/zhuanlan/server/netty/5/3.html
- 分类：服务器框架
- 分组：教程目录
前两篇文章我们已经对`Netty`进行了简单的了解和架构设计原理的剖析。

本篇文章我们就来开始对`Netty`源码的分析，首先我们来讲解 Netty 中`Channel`相关的功能和接口。

## Channel概述

> Channel 顾名思义就是 管道，代表网络 Socket 或能够进行 I/O 操作的组件的关系。这些 I/O 操作包括读、写、连接和绑定。

简单的说，Channel 就是代表连接，实体之间的连接，程序之间的连接，文件之间的连接，设备之间的连接。同时它也是数据入站和出站的载体。

Netty 中的 Channel 为用户提供了如下功能：

- 查询当前 Channel 的状态。例如，是打开还是已连接状态等。
- 提供 Channel 的参数配置。例如，接收缓冲区大小。
- 提供支持的 I/O 操作。例如，读、写、连接和绑定。
- 提供 ChannelPipeline。ChannelPipeline 用户处理所有与 Channel 关联的 I/O 事件和请求。

## Channel 特点

I/O操作都是异步的

`Channel`中的所有 I/O 操作都是异步的，一经调用就马上返回，而不保证所请求的 I/O 操作在调用结束时已完成。相反，在调用时都将返回一个 `ChannelFuture`实例，用来代表未来的结果。该实例会在 I/O 操作真正完成后通知用户，然后就可以得到具体的 I/O操作的结果。

Channel 是分层的

一个`Channel`会有一个对应的`parent`，该`parent`也是一个`Channel`。并且根据 `Channel`创建的不同，它的`parent`也会不一样。例如，在一个`SocketChannel`连接上`ServerSocketChannel`之后，该`SocketChannel`的`parent`就会是该`ServerSocketChannel`。层次的结构的语义取决于`Channel`使用了何种传输实现方式。

向下转型以下访问特定于输出的操作

某些传输公开了特定于该传输的相关操作，因此可以将该`Channel`向下转换为子类型以调用此类操作。

释放资源

一旦`Channel`完成，调用`ChannelOutboundInvoker.close()`或`ChannelOutboundInvoker.close(ChannelPromise)`来释放所有自恋是非常重要的。这样可以确保以适当的方式（以文件句柄）释放所有的资源。

## Channel 接口方法

以下是Channel接口的核心源码：

```java
public interface Channel extends AttributeMap, ChannelOutboundInvoker, Comparable<Channel> {
    //返回全局唯一的channel id
    ChannelId id();
    //返回该通道注册的事件轮询器
    EventLoop eventLoop();
    //返回该通道的父通道，如果是ServerSocketChannel实例则返回null，
    //SocketChannel实例则返回对应的ServerSocketChannel
    Channel parent();
    //返回该通道的配置参数
    ChannelConfig config();
    //端口是否处于open，通道默认一创建isOpen方法就会返回true，close方法被调用后该方法返回false
    boolean isOpen();
    //是否已注册到EventLoop
    boolean isRegistered();
    // 通道是否处于激活
    boolean isActive();
    // 返回channel的元数据
    ChannelMetadata metadata();
    // 服务器的ip地址
    SocketAddress localAddress();
    // remoteAddress 客户端的ip地址
    SocketAddress remoteAddress();
    //通道的关闭凭证（许可），这里是多线程编程一种典型的设计模式，一个channle返回一个固定的
    ChannelFuture closeFuture();
    //是否可写，如果通道的写缓冲区未满，即返回true，表示写操作可以立即 操作缓冲区，然后返回。
    boolean isWritable();
    long bytesBeforeUnwritable();
    long bytesBeforeWritable();
    Channel.Unsafe unsafe();
    // 返回管道
    ChannelPipeline pipeline();
    // 返回ByteBuf内存分配器
    ByteBufAllocator alloc();
    Channel read();
    Channel flush();
    public interface Unsafe {
        Handle recvBufAllocHandle();
        SocketAddress localAddress();
        SocketAddress remoteAddress();
        // 把channel注册进EventLoop
        void register(EventLoop var1, ChannelPromise var2);
        // 给channel绑定一个 adress,
        void bind(SocketAddress var1, ChannelPromise var2);
        // Netty客户端连接到服务端
        void connect(SocketAddress var1, SocketAddress var2, ChannelPromise var3);
        // 断开连接，但不会释放资源，该通道还可以再通过connect重新与服务器建立连接
        void disconnect(ChannelPromise var1);
        // 关闭通道，回收资源，该通道的生命周期完全结束
        void close(ChannelPromise var1);
        void closeForcibly();
        // 取消注册。
        void deregister(ChannelPromise var1);
        // 从channel中读取IO数据
        void beginRead();
        // 往channe写入数据
        void write(Object var1, ChannelPromise var2);
        void flush();
        ChannelPromise voidPromise();
        ChannelOutboundBuffer outboundBuffer();
    }
}
```

从上述源码可以看到`Channel`接口继承了`AttributeMap`、`ChannelOutboundInvoker`、`Comparable`外，还提供了很多接口。

## ChannelOutboundInvoker

`ChannelOutboundInvoker`接口声明了所有的出站的网络操作。

以下是`ChannelOutboundInvoker`接口的核心源码：

```java
public interface ChannelOutboundInvoker {
    ChannelFuture bind(SocketAddress var1);
    ChannelFuture connect(SocketAddress var1);
    ChannelFuture connect(SocketAddress var1, SocketAddress var2);
    ChannelFuture disconnect();
    ChannelFuture close();
    ChannelFuture deregister();
    ChannelFuture bind(SocketAddress var1, ChannelPromise var2);
    ChannelFuture connect(SocketAddress var1, ChannelPromise var2);
    ChannelFuture connect(SocketAddress var1, SocketAddress var2, ChannelPromise var3);
    ChannelFuture disconnect(ChannelPromise var1);
    ChannelFuture close(ChannelPromise var1);
    ChannelFuture deregister(ChannelPromise var1);
    ChannelOutboundInvoker read();
    ChannelFuture write(Object var1);
    ChannelFuture write(Object var1, ChannelPromise var2);
    ChannelOutboundInvoker flush();
    ChannelFuture writeAndFlush(Object var1, ChannelPromise var2);
    ChannelFuture writeAndFlush(Object var1);
    ChannelPromise newPromise();
    ChannelProgressivePromise newProgressivePromise();
    ChannelFuture newSucceededFuture();
    ChannelFuture newFailedFuture(Throwable var1);
    ChannelPromise voidPromise();
}
```

从上述源码可以看到`ChannelOutboundInvoker`接口中大部分方法的返回值都是`ChannelFuture`及`ChannelPromise`。因此，`ChannelOutboundInvoker`接口的操作都是异步的。

`ChannelFuture`与`ChannelPromise`的差异在于，`ChannelFuture`用于获取异步的结果，而`ChannelPromise`则是对`ChannelFuture`进行扩展，支持写的操作。因此，`ChannelPromise`也被称为可写的`ChannelFuture`。

## AttributeMap

`Channel`接口继承了`AttributeMap`接口，那么`AttributeMap`接口的作用是什么呢？

以下是`AttributeMap`接口的核心源码：

```java
public interface AttributeMap {
    <T> Attribute<T> attr(AttributeKey<T> var1);
    <T> boolean hasAttr(AttributeKey<T> var1);
}
```

从源码可以看到，`AttributeMap`其实就是类似于 Map 的键值对，而键就是`AttributeKey`类型，值就是`Attribute`类型。换言之，`AttributeMap`是用来存放属性的。

我们知道每一个`ChannelHandlerContext`都是`ChannelHandler`和`ChannelPipeline`之间连接的桥梁，每一个`ChannelHandlerContext`都有属于自己的上下文，也就说每一个`ChannelHandlerContext`上如果有`AttributeMap`都是绑定上下文的，也就说如果A的`ChannelHandlerContext`中的`AttributeMap`，是无法被B的`ChannelHandlerContext`读取到的。

Netty 提供了`AttributeMap`的默认实现类`DefaultAttributeMap`。与 JDK 中 `ConcurrentHashMap`相比，在高并发下`DefaultAttributeMap`可以更加节省内存。

`DefaultAttributeMap`的核心源码如下：

```java
public class DefaultAttributeMap implements AttributeMap {
        //以原子方式更新attributes变量的引用
        private static final AtomicReferenceFieldUpdater<DefaultAttributeMap, AtomicReferenceArray> updater = 		AtomicReferenceFieldUpdater.newUpdater(DefaultAttributeMap.class, AtomicReferenceArray.class, "attributes");
        //默认桶的大小
        private static final int BUCKET_SIZE = 4;
        //掩码 桶大小 3
        private static final int MASK = 3;
        //延迟初始化，节约内存
        private volatile AtomicReferenceArray<DefaultAttributeMap.DefaultAttribute<?>> attributes;
        public <T> Attribute<T> attr(AttributeKey<T> key) {
        ObjectUtil.checkNotNull(key, "key");
        AtomicReferenceArray<DefaultAttributeMap.DefaultAttribute<?>> attributes = this.attributes;
        if (attributes == null) {
            //当attributes为空时则创建它，默认数组长度4
            attributes = new AtomicReferenceArray(4);
            //原子方式更新attributes，如果attributes为null则把新创建的对象赋值
			//原子方式更新解决了并发赋值问题
            if (!updater.compareAndSet(this, (Object)null, attributes)) {
                attributes = this.attributes;
            }
        }
        //根据key计算下标
        int i = index(key);
        DefaultAttributeMap.DefaultAttribute<?> head = (DefaultAttributeMap.DefaultAttribute)attributes.get(i);
        if (head == null) {
            head = new DefaultAttributeMap.DefaultAttribute();
            DefaultAttributeMap.DefaultAttribute<T> attr = new DefaultAttributeMap.DefaultAttribute(head, key);
            head.next = attr;
            attr.prev = head;
            if (attributes.compareAndSet(i, (Object)null, head)) {
                return attr;
            }	
			//返回attributes数组中的第一个元素
            head = (DefaultAttributeMap.DefaultAttribute)attributes.get(i);
        }
        //对head同步加锁
        synchronized(head) {
            //curr 赋值为head    head为链表结构的第一个变量
            DefaultAttributeMap.DefaultAttribute curr = head;
            while(true) {
                //依次获取next
                DefaultAttributeMap.DefaultAttribute<?> next = curr.next;
                //next==null，说明curr为最后一个元素
                if (next == null) {
                    //创建一个新对象传入head和key
                    DefaultAttributeMap.DefaultAttribute<T> attr = new DefaultAttributeMap.DefaultAttribute(head, key);
                    //curr后面指向attr
                    curr.next = attr;
                    //attr的前面指向curr
                    attr.prev = curr;
                    //返回新对象
                    return attr;
                }
				//如果next的key等于传入的key，并且没有被移除
                if (next.key == key && !next.removed) {
                    //这直接返回next
                    return next;
                }
				//否则把curr变量指向下一个元素
                curr = next;
            }
        }
    }
        public <T> boolean hasAttr(AttributeKey<T> key) {
        ObjectUtil.checkNotNull(key, "key");
        //attributes为null直接返回false
        AtomicReferenceArray<DefaultAttributeMap.DefaultAttribute<?>> attributes = this.attributes;
        if (attributes == null) {
            return false;
        } else {
            //计算数组下标
            int i = index(key);
            //获取头 为空直接返回false
            DefaultAttributeMap.DefaultAttribute<?> head = (DefaultAttributeMap.DefaultAttribute)attributes.get(i);
            if (head == null) {
                return false;
            } else {
                //对head同步加锁
                synchronized(head) {
                    //从head的下一个开始，因为head不存储元素
                    for(DefaultAttributeMap.DefaultAttribute curr = head.next; curr != null; curr = curr.next) {
                        if (curr.key == key && !curr.removed) {
                            return true;
                        }
                    }
                    return false;
                }
            }
        }
    }
    private static int index(AttributeKey<?> key) {
		//与掩码&运算，数值肯定<=mask 正好是数组下标
        return key.id() & 3;
    }
}
```

从上述源码可以看出，`DefaultAttributeMap`使用了`AtomicReferenceArray`和`synchronized`等来保证并发的安全。

`AtomicReferenceArray`类提供了可以原子读取和写入的底层引用数组的操作，并且还包含高级原子操作。`AtomicReferenceArray`支持对底层引用数组变量的原子操作。它具有获取和设置的方法，如在变量上的读取和写入。`compareAndSet()`方法用于判断当前值是否等于预期值，如果是，则以原子方式将位置`i`的元素设置为给定的更新值。

## 总结

看完以上关于`Channel`的介绍，相信你对`Channel`应该有了一定的认识，后面我们继续分析`Channel`相关的接口和源码。
