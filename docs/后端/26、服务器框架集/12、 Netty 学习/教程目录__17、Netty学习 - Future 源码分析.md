# 17、Netty学习 - Future 源码分析
- 来源：https://ddkk.com/zhuanlan/server/netty/5/17.html
- 分类：服务器框架
- 分组：教程目录
JDK中提供了 Future 接口，Future 代表了一个异步处理的结果。

Netty 中对 JDK 的 Future 做了扩展。

为了深入了解这两者的不同点，下面我们就来分析这两者的源码。

### JDK 的 Future 接口

Future 接口提供了一些方法检查是否计算完毕，例如，等待计算完毕，获取计算结果的方法。当计算完毕之后只能通过 `get` 方法获取结果，或者一直阻塞等待计算的完成。取消操作可以通过 `cancel` 方法。另外也提供了 `isDone` 方法，用于检测是正常完成还是被取消终止。

需要注意的是，当 Future 的计算完成后，不能进行取消操作。

Future 的核心源码如下：

```java
public interface Future<V> {
     /**
     * 用来取消任务，取消成功则返回true，取消失败则返回false。
     * mayInterruptIfRunning参数表示是否允许取消正在执行却没有执行完毕的任务，设为true，则表示可以取消正在执行过程中的任务。
     * 如果任务已完成，则无论mayInterruptIfRunning为true还是false，此方法都返回false，即如果取消已经完成的任务会返回false；
     * 如果任务正在执行，若mayInterruptIfRunning设置为true，则返回true，若mayInterruptIfRunning设置为false，则返回false；
     * 如果任务还没有执行，则无论mayInterruptIfRunning为true还是false，肯定返回true。
     */
    boolean cancel(boolean mayInterruptIfRunning);
    /**
     * 表示任务是否被取消成功，如果在任务正常完成前被取消成功，则返回true
     */
    boolean isCancelled();
    /**
     * 表示任务是否已经完成，若任务完成，则返回true
     */
    boolean isDone();
    /**
     * 获取执行结果，如果最终结果还没得出该方法会产生阻塞，直到任务执行完毕返回结果
     */
    V get() throws InterruptedException, ExecutionException;
    /**
     * 获取执行结果，如果在指定时间内，还没获取到结果，则抛出TimeoutException
     */
    V get(long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException;
}
```

在上面的接口定义中可以知道，jdk 中的 Future 无论结果是成功、失败还是取消，都用 `isdone()` 来检测，而且无法区分到底是正常成功了，还是异常终止了。因此在 Netty 中对 jdk 的 Future 做了扩展。

### Netty 的 Future 接口

核心源码如下：

```java
public interface Future<V> extends java.util.concurrent.Future<V> {
    //异步操作完成且正常终止
    boolean isSuccess();
    //异步操作是否可以取消
    boolean isCancellable();
    //异步操作失败的原因
    Throwable cause();
    //添加一个监听，异步操作完成时调用
    Future<V> addListener(GenericFutureListener<? extends Future<? super V>> var1);
    Future<V> addListeners(GenericFutureListener<? extends Future<? super V>>... var1);
    //移除监听者
    Future<V> removeListener(GenericFutureListener<? extends Future<? super V>> var1);
    Future<V> removeListeners(GenericFutureListener<? extends Future<? super V>>... var1);
    //阻塞直到异步操作完成
    Future<V> sync() throws InterruptedException;
    Future<V> syncUninterruptibly();
    //阻塞直到异步操作完成
    Future<V> await() throws InterruptedException;
    Future<V> awaitUninterruptibly();
    boolean await(long var1, TimeUnit var3) throws InterruptedException;
    boolean await(long var1) throws InterruptedException;
    boolean awaitUninterruptibly(long var1, TimeUnit var3);
    boolean awaitUninterruptibly(long var1);
    //非阻塞地返回异步结果，如果尚未完成返回 null
    V getNow();
    boolean cancel(boolean var1);
}
```

Netty 中的 Future 相对于jdk 中的 Future 做了以下几个方面的扩展。

- 操作完成的结果做了区分，分为 sucess 、fail、canceled 三种。
- 通过 addListeners() 方法可以添加回调操作，即触发或者完成时需要进行的操作。
- sync()和await()，可以以阻塞的方式等待异步完成。
- getNow() 可以获取异步操作的结果，如果还未完成则返回 null 。

### ChannelFuture 接口

在Netty 中，ChannelFuture 表示 Channel 的异步 I/O 操作的结果。

ChannelFuture 的核心源码如下：

```java
public interface ChannelFuture extends Future<Void> {
    Channel channel();
    ChannelFuture addListener(GenericFutureListener<? extends Future<? super Void>> var1);
    ChannelFuture addListeners(GenericFutureListener<? extends Future<? super Void>>... var1);
    ChannelFuture removeListener(GenericFutureListener<? extends Future<? super Void>> var1);
    ChannelFuture removeListeners(GenericFutureListener<? extends Future<? super Void>>... var1);
    ChannelFuture sync() throws InterruptedException;
    ChannelFuture syncUninterruptibly();
    ChannelFuture await() throws InterruptedException;
    ChannelFuture awaitUninterruptibly();
    boolean isVoid();
}
```

从上述源码可以看到，**ChannelFuture 接口基本上继承自 Netty 的 Future 接口**。

在Netty 中所有的 I/O 操作都是异步的，意味着很多的 I/O 操作被调用过后会立刻返回，并且不能保证 I/O请求操作被调用后计算完毕，替代它的是返回一个当前 I/O 操作状态和结果信息的 ChannelFuture 实例。

**一个 ChannelFuture 要么是完成的，要么是未完成的。当一个 I/O 操作开始时，会创建一个 Future 对象，Future 初始化时为完成的状态，它既不是成功，也不是失败，也不是被取消。因为 I/O 操作还没有完全结束。如果 I/O 操作已经完成，那它要么是成功，要么是失败，要么是被取消，这个 future 会被标记成已完成并伴随其他信息，比如失败的原因。**

下图展示了 ChannelFuture 从未完成到完成的所有场景的状态变化。

```java
                                                      +---------------------------+
                                                      | Completed successfully    |
                                                      +---------------------------+
                                                 +---->      isDone() = true      |
                 +--------------------------+    |    |   isSuccess() = true      |
                 |        Uncompleted       |    |    +===========================+
                 +--------------------------+    |    | Completed with failure    |
                 |      isDone() = false    |    |    +---------------------------+
                 |   isSuccess() = false    |----+---->   isDone() = true         |
                 | isCancelled() = false    |    |    | cause() = non-null     |
                 |    cause() = null     |    |    +===========================+
                 +--------------------------+    |    | Completed by cancellation |
                                                 |    +---------------------------+
                                                 +---->      isDone() = true      |
                                                      | isCancelled() = true      |
                                                      +---------------------------+
```

ChannelFuture 提供了各种各样的方法来检查 I/O 操作是否已完成，等待完成，返回 I/O 操作的结果。同时，也能让你增加`ChannelFutureListener`，这样当 I/O 操作完成的时候，你就能获得通知。

推荐优先使用`addListener(GenericFutureListener)`方法，而不是`await()`方法。在可能的情况下，这样就能在 I/O 操作完成时收到通知，并且可以去做后续的任务处理。`addListener(GenericFutureListener)` 本身是非阻塞的，它会添加一个指定的`ChannelFutureListener` 到`ChannelFuture`，并且 I/O 线程完成对应的操作将会通知监听器，**ChannelFutureListener也会提供最好的性能和资源利用率，因为它永远不会阻塞，但是如果不是基于事件编程，它可能在顺序逻辑上存在棘手的问题。**

相反的，`await()`是一个阻塞的操作，一旦被调用，调用者线程在操作完成之前的阻塞的。

### 总结

以上我们分析了 JDK 提供的 Future 以及 Netty 的 Future 接口，下节我们来分析 Netty 中的 `Promise`，`Promise`是可写的 `Future`, Future 自身并没有写操作相关的接，Netty 通过`Promise`对 `Future`进行扩展，用于设置 I/O 操作的结果。
