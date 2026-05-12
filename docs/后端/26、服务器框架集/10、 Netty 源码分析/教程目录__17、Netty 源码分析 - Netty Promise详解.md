# 17、Netty 源码分析 - Netty Promise详解
- 来源：https://ddkk.com/zhuanlan/server/netty/3/17.html
- 分类：服务器框架
- 分组：教程目录
上篇文章我们讲解了 Netty 的 Future，本篇文章我就就来分析一下**可写的 Future**，也就是 `promise`，Netty 中的 Promise 扩展自 Netty 的 Future。

## Promise 接口

在Netty 中，Promise 接口是一种特殊的可写的 Future。 Promise 的核心源码如下：

```java
public interface Promise<V> extends Future<V> {
    Promise<V> setSuccess(V var1);
    boolean trySuccess(V var1);
    Promise<V> setFailure(Throwable var1);
    boolean tryFailure(Throwable var1);
    boolean setUncancellable();
    Promise<V> addListener(GenericFutureListener<? extends Future<? super V>> var1);
    Promise<V> addListeners(GenericFutureListener<? extends Future<? super V>>... var1);
    Promise<V> removeListener(GenericFutureListener<? extends Future<? super V>> var1);
    Promise<V> removeListeners(GenericFutureListener<? extends Future<? super V>>... var1);
    Promise<V> await() throws InterruptedException;
    Promise<V> awaitUninterruptibly();
    Promise<V> sync() throws InterruptedException;
    Promise<V> syncUninterruptibly();
}
```

从上面可以看出，Promise 就是一个可写的 Future。在 Future 机制中，业务逻辑所在任务执行的状态（成功或失败）是在 Future 中实现的；而在 Promise 中，可以在业务逻辑中控制任务的执行结果，相比 Future 更加灵活。

以下是一个 Promise 的示例（伪代码）。

```java
//异步的耗时任务接收一个 Promise
public Promise asynchronousFunction() {
    Promise promise = new PromiseImpl();
    Object result = null;
    return =search()  //业务逻辑
        if (sucess) {
            promise.setSuccess(result); //通知 promise 当前异步任务成功了，并传入结果
        } else if (failed) {
            promise.setFailure(reason);//通知 promise 当前异步任务失败了
        } else if (error) {
            promise.setFailure(error);//通知 promise 当前异步任务发生了异常
        }
}
//调用异步的耗时操作
Promise promise = asynchronousFunction(promise);//会立即返回 promise
//添加成功处理 / 失败处理 / 异步处理等事件
promise.addListener();//例如：可以添加成功后的执行事件
//继续做其他事件，不需要理会 asynchronousFunction 何时结束
doOtherThings();
```

在Netty 中，Promise 继承了 Future，因此也具备了 Future 的所有功能。在 Promise 机制中，可以在业务逻辑中人工设置业务逻辑的成功与失败。

Netty 的常用 Promise 类有 DefaultPromise 类，这是 Promise 实现的基础，DefaultChannelPromise 是 DefaultPromise 的子类，加入了`channel`属性。

## Netty 的 DefaultPromise

Netty 中涉及异步操作的地方都使用了 Promise 。例如，下面是服务器/客户端启动时的注册任务，最终会调用 Unsafe 的 register，调用过程中会传入一个Promise 。Unsafe 进行事件的注册时调用 Promise 可以设置成功或者失败。

```java
//SingleThreadEventLoop.java
public ChannelFuture register(ChannelPromise promise) {
    ObjectUtil.checkNotNull(promise, "promise");
    promise.channel().unsafe().register(this, promise);
    return promise;
}
//AbstractChannel.AbstractUnsafe
public final void register(EventLoop eventLoop, final ChannelPromise promise) {
    ObjectUtil.checkNotNull(eventLoop, "eventLoop");
    if (AbstractChannel.this.isRegistered()) {
        promise.setFailure(new IllegalStateException("registered to an event loop already"));
    } else if (!AbstractChannel.this.isCompatible(eventLoop)) {
        promise.setFailure(new IllegalStateException("incompatible event loop type: " + eventLoop.getClass().getName()));
    } else {
        AbstractChannel.this.eventLoop = eventLoop;
        if (eventLoop.inEventLoop()) {
            this.register0(promise);
        } else {
            try {
                eventLoop.execute(new Runnable() {
                    public void run() {
                        AbstractUnsafe.this.register0(promise);
                    }
                });
            } catch (Throwable var4) {
                AbstractChannel.logger.warn("Force-closing a channel whose registration task was not accepted by an event loop: {}", AbstractChannel.this, var4);
                this.closeForcibly();
                AbstractChannel.this.closeFuture.setClosed();
                this.safeSetFailure(promise, var4);
            }
        }
    }
}
```

DefaultPromise 提供的功能可以分为两个部分；一个是为调用者提供 `get()`和`addListen()`用于获取 Future 任务执行结果和添加监听事件；另一部分是为业务处理任务提供`setSucess()`等方法设置任务的成功或失败。

## 1、设置任务的成功或失败

DefaultPromise 核心源码如下：

```java
public class DefaultPromise<V> extends AbstractFuture<V> implements Promise<V> {
    public Promise<V> setSuccess(V result) {
        if (this.setSuccess0(result)) {
            return this;
        } else {
            throw new IllegalStateException("complete already: " + this);
        }
    }
    public boolean trySuccess(V result) {
        return this.setSuccess0(result);
    }
    public Promise<V> setFailure(Throwable cause) {
        if (this.setFailure0(cause)) {
            return this;
        } else {
            throw new IllegalStateException("complete already: " + this, cause);
        }
    }
    public boolean tryFailure(Throwable cause) {
        return this.setFailure0(cause);
    }
    public boolean setUncancellable() {
        if (RESULT_UPDATER.compareAndSet(this, (Object)null, UNCANCELLABLE)) {
            return true;
        } else {
            Object result = this.result;
            return !isDone0(result) || !isCancelled0(result);
        }
    }
    public boolean isSuccess() {
        Object result = this.result;
        return result != null && result != UNCANCELLABLE && !(result instanceof DefaultPromise.CauseHolder);
    }
    public boolean isCancellable() {
        return this.result == null;
    }
    //...
}
```

## 2、获取 Future 任务执行结果和添加监听事件

DefaultPromise 的`get`方法有 3 个。

- 无参数的get会阻塞等待；
- 有参数的get会等待指定事件，若未结束就抛出超时异常，这两个get是在其父类 AbstractFuture中实现的。getNow()方法则会立马返回结果。

源码如下：

```java
public V getNow() {
    Object result = this.result;
    return !(result instanceof DefaultPromise.CauseHolder) && result != SUCCESS && result != UNCANCELLABLE ? result : null;
}
public V get() throws InterruptedException, ExecutionException {
    Object result = this.result;
    if (!isDone0(result)) {
        this.await();
        result = this.result;
    }
    if (result != SUCCESS && result != UNCANCELLABLE) {
        Throwable cause = this.cause0(result);
        if (cause == null) {
            return result;
        } else if (cause instanceof CancellationException) {
            throw (CancellationException)cause;
        } else {
            throw new ExecutionException(cause);
        }
    } else {
        return null;
    }
}
public V get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException {
    Object result = this.result;
    if (!isDone0(result)) {
        if (!this.await(timeout, unit)) {
            throw new TimeoutException();
        }
        result = this.result;
    }
    if (result != SUCCESS && result != UNCANCELLABLE) {
        Throwable cause = this.cause0(result);
        if (cause == null) {
            return result;
        } else if (cause instanceof CancellationException) {
            throw (CancellationException)cause;
        } else {
            throw new ExecutionException(cause);
        }
    } else {
        return null;
    }
}
```

`await()` 方法判断 Future 任务是否结束，之后获取 this 锁，如果任务未完成则调用 Object 的 `wait()`等待。源码如下：

```java
public Promise<V> await() throws InterruptedException {
    if (this.isDone()) {
        return this;
    } else if (Thread.interrupted()) {
        throw new InterruptedException(this.toString());
    } else {
        this.checkDeadLock();
        synchronized(this) {
            while(!this.isDone()) {
                this.incWaiters();
                try {
                    this.wait();
                } finally {
                    this.decWaiters();
                }
            }
            return this;
        }
    }
    //...
}
```

addListener 方法被调用时，将传入的回调传入`listeners`对象中。如果监听多于 1 个，会创建`DeflaultFutureListeners`对象将回调方法保存在一个数组中。

`removeListener`会将`listeners`设置为null(只有一个时)或从数组中移除（多个回调时）。源码如下。

```java
public Promise<V> addListener(GenericFutureListener<? extends Future<? super V>> listener) {
    ObjectUtil.checkNotNull(listener, "listener");
    synchronized(this) {
        this.addListener0(listener);
    }
    if (this.isDone()) {
        this.notifyListeners();
    }
    return this;
}   
public Promise<V> addListeners(GenericFutureListener<? extends Future<? super V>>... listeners) {
    ObjectUtil.checkNotNull(listeners, "listeners");
    synchronized(this) {
        GenericFutureListener[] var3 = listeners;
        int var4 = listeners.length;
        int var5 = 0;
        while(var5 < var4) {
            GenericFutureListener<? extends Future<? super V>> listener = var3[var5];
            if (listener != null) {
                this.addListener0(listener);
                ++var5;
                continue;
            }
        }
    }
    if (this.isDone()) {
        this.notifyListeners();
    }
    return this;
}
public Promise<V> removeListener(GenericFutureListener<? extends Future<? super V>> listener) {
    ObjectUtil.checkNotNull(listener, "listener");
    synchronized(this) {
        this.removeListener0(listener);
        return this;
    }
}
public Promise<V> removeListeners(GenericFutureListener<? extends Future<? super V>>... listeners) {
    ObjectUtil.checkNotNull(listeners, "listeners");
    synchronized(this) {
        GenericFutureListener[] var3 = listeners;
        int var4 = listeners.length;
        for(int var5 = 0; var5 < var4; ++var5) {
            GenericFutureListener<? extends Future<? super V>> listener = var3[var5];
            if (listener == null) {
                break;
            }
            this.removeListener0(listener);
        }
        return this;
    }
}
```

在添加监听器的过程中，如果任务刚好执行完毕 done()，则立即触发监听事件。触发监听通过`notifyListeners()`实现。主要逻辑如下：

如果当前`addListener`的线程（准确来说应该是调用了`notifyListeners`的线程，因为`addListener`和`setSuccess`都会调用`notifyListeners`和 Promise 内的线程池）与当前执行的线程是同一个线程，则放在线程池中执行，否则提交到线程池中执行；

而如果是执行 Future 任务的线程池中的`setSuccess`时，调用`notifyListeners()`，会放在当前线程中执行。内部维护了`notifyListeners`用来记录是否已经触发过监听事件，只有未触发过且监听列表不为空，才会依次遍历并调用`operationComplete`。

## Netty 的 DefaultChannelPromise

DefaultChannelPromise 是 DefaultPromise 的子类，内部维护了一个通道变量 `channel`。

Promise 机制相关的方法都是调用父类方法。

除此之外，DefaultChannelPromise 还实现了`FlushCheckpoint`接口，供`ChannelFlushPromiseNotifier`使用，可以将`ChannelFuture`注册到`ChannelFlushPromiseNotifier`类，当有数据写入或到达`checkpoint`时使用。

核心源码如下：

```java
public class DefaultChannelPromise extends DefaultPromise<Void> implements ChannelPromise, FlushCheckpoint {
    private final Channel channel;
    private long checkpoint;
	//...
    public Channel channel() {
        return this.channel;
    }
    public ChannelPromise setSuccess() {
        return this.setSuccess((Void)null);
    }
    public ChannelPromise setSuccess(Void result) {
        super.setSuccess(result);
        return this;
    }
    public boolean trySuccess() {
        return this.trySuccess((Object)null);
    }
    public ChannelPromise setFailure(Throwable cause) {
        super.setFailure(cause);
        return this;
    }
    //...
    public ChannelPromise promise() {
        return this;
    }
    protected void checkDeadLock() {
        if (this.channel().isRegistered()) {
            super.checkDeadLock();
        }
    }
    public ChannelPromise unvoid() {
        return this;
    }
    public boolean isVoid() {
        return false;
    }
}
```

## 总结

以上我们分析了 Netty 中的 Promise，知道了它是扩展自 Netty 的 Future，是一个可写的 Future。
