# 25、Netty入门 - EventLoop 源码剖析
- 来源：https://ddkk.com/zhuanlan/server/netty/2/25.html
- 分类：服务器框架
- 分组：教程目录
## 1.源码解析目标

分析最核心组件 EventLoop 在 Netty 运行过程中所参与的事情，以及具体实现。

## 1.1 源码解析

使用netty 包example下 Echo 目录下的案例代码，当我们写一个 NettyServer 时候，第一句话就是 EventLoopGroup bossGroup = new NioEventLoopGroup(1);，我们先来看看 NioEventLoop 的 UML 图。

- 首先我们看 ScheduledEecutorService 接口，这个接口是 concurrent 包下的一个定时任务接口， EventLoop 实现了这个接口，因此可以接受定时任务，所以我们在 dubug 的时候，能在 EventLoop 中找到一个 scheduledTaskQueue。
- EventLoop 接口我们看下源码，如下，从注释中我们了解到，EventLoop 中一旦注册了 Channel，就会处理该 Channel 对应的所有 I/O 操作

```java
/**
 * Will handle all the I/O operations for a {@link Channel} once registered.
 *
 * One {@link EventLoop} instance will usually handle more than one {@link Channel} but this may depend on
 * implementation details and internals.
 *
 */
public interface EventLoop extends OrderedEventExecutor, EventLoopGroup {
    @Override
    EventLoopGroup parent();
}
```

- SingleThreadEventExecutor 也是一个比较重要的类，看源码注释,说明了SingleThreadEventExecutor 是一个单个线程的线程池

```java
/**
 * Abstract base class for {@link OrderedEventExecutor}'s that execute all its submitted tasks in a single thread.
 *
 */
public abstract class SingleThreadEventExecutor extends AbstractScheduledEventExecutor implements OrderedEventExecutor {......}
```

- 在SingleThreadEventExecutor 类中实现了很多对线程池的操作，例如runAllTask，executer，takeTask，pollTask，看下其中一个构造方法：

```java
         /**
     * Create a new instance
     *
     * @param parent            the {@link EventExecutorGroup} which is the parent of this instance and belongs to it
     * @param executor          the {@link Executor} which will be used for executing
     * @param addTaskWakesUp    {@code true} if and only if invocation of {@linkaddTask(Runnable)} will wake up the
     *                          executor thread
     * @param maxPendingTasks   the maximum number of pending tasks before new tasks will be rejected.
     * @param rejectedHandler   the {@link RejectedExecutionHandler} to use.
     */
    protected SingleThreadEventExecutor(EventExecutorGroup parent, Executor executor,
                                        boolean addTaskWakesUp, int maxPendingTasks,
                                        RejectedExecutionHandler rejectedHandler) {
        super(parent);
        this.addTaskWakesUp = addTaskWakesUp;
        this.maxPendingTasks = Math.max(16, maxPendingTasks);
        this.executor = ObjectUtil.checkNotNull(executor, "executor");
        taskQueue = newTaskQueue(this.maxPendingTasks);
        rejectedExecutionHandler = ObjectUtil.checkNotNull(rejectedHandler, "rejectedHandler");
    }
    /**
     * Create a new {@link Queue} which will holds the tasks to execute. This default implementation will return a
     * {@link LinkedBlockingQueue} but if your sub-class of {@link SingleThreadEventExecutor} will not do any blocking
     * calls on the this {@link Queue} it may make sense to {@code @Override} this and return some more performant
     * implementation that does not support blocking operations at all.
     */
    protected Queue<Runnable> newTaskQueue(int maxPendingTasks) {
        return new LinkedBlockingQueue<Runnable>(maxPendingTasks);
    }
```

- 如上，SingleThreadEventExecutor 队列中元素是实现了 Runnable 接口的对象，线程池中最重要的方法当然是 executer 方法，EventLoop 是 SingleThreadEventExecutor 的子类，那么EventLoop 类也可以直接调用 executer 方法来完成对事件的执行，我们来看源码

```java
    @Override
    public void execute(Runnable task) {
        if (task == null) {
            throw new NullPointerException("task");
        }
        // 判断EventLoop中线程是否是当前线程，如果是，则直接将task添加到线程池队列中
        boolean inEventLoop = inEventLoop();
        // 如果不是则尝试启动一个线程（因为是单个线程的线程池，所以只能且只需要启动一次），
        // 之后在将任务添加到队列中去
        if (inEventLoop) {
            addTask(task);
        } else {
            startThread();
            addTask(task);
            // 如果线程已经停止并且删除任务失败，则直接拒绝策略
            if (isShutdown() && removeTask(task)) {
                reject();
            }
        }
        if (!addTaskWakesUp && wakesUpForTask(task)) {
            wakeup(inEventLoop);
        }
    }
```

接着看addTask 的实现

```java
    /**
     * Add a task to the task queue, or throws a {@link RejectedExecutionException} if this instance was shutdown
     * before.
     */
    protected void addTask(Runnable task) {
        if (task == null) {
            throw new NullPointerException("task");
        }
        if (!offerTask(task)) {
            reject(task);
        }
    }
    final boolean offerTask(Runnable task) {
        if (isShutdown()) {
            reject();
        }
        return taskQueue.offer(task);
    }
```

- 从注释中可以看出，addTask 方法会添加一个task任务到队列中，如果当前线程是 shutdown 的状态，那么直接抛出异常 RejectedExecutionException
- 接着来看 executer 方法中的 startThread(); ，当我们判断当前线程不是 EventLoop中 的线程的时候会执行这个方法，它是 NioEventLoop 中的核心方法，如下源码

```java
private void startThread() {
        // 通过状态判断是否执行过，保证EventLoop只有一个线程
        if (state == ST_NOT_STARTED) {
            // 如果没有启动 用cas的方式STATE_UPDATER.compareAndSet(this, ST_NOT_STARTED, ST_STARTED) 去修改状态为ST_STARTED，直接调用doStartThread方法
            if (STATE_UPDATER.compareAndSet(this, ST_NOT_STARTED, ST_STARTED)) {
                try {
                    doStartThread();
                } catch (Throwable cause) {
                    // 如果失败就回滚
                    STATE_UPDATER.set(this, ST_NOT_STARTED);
                    PlatformDependent.throwException(cause);
                }
            }
        }
    }
    private void doStartThread() {
        assert thread == null;
        executor.execute(new Runnable() {
            @Override
            public void run() {
                thread = Thread.currentThread();
                if (interrupted) {
                    thread.interrupt();
                }
                boolean success = false;
                updateLastExecutionTime();
                try {
                    SingleThreadEventExecutor.this.run();
                    success = true;
                } catch (Throwable t) {
                    logger.warn("Unexpected exception from an event executor: ", t);
                } finally {
                    for (;;) {
                        int oldState = state;
                        if (oldState >= ST_SHUTTING_DOWN || STATE_UPDATER.compareAndSet(
                                SingleThreadEventExecutor.this, oldState, ST_SHUTTING_DOWN)) {
                            break;
                        }
                    }
                    // Check if confirmShutdown() was called at the end of the loop.
                    if (success && gracefulShutdownStartTime == 0) {
                        logger.error("Buggy " + EventExecutor.class.getSimpleName() + " implementation; " +
                                SingleThreadEventExecutor.class.getSimpleName() + ".confirmShutdown() must be called " +
                                "before run() implementation terminates.");
                    }
                    try {
                        // Run all remaining tasks and shutdown hooks.
                        for (;;) {
                            if (confirmShutdown()) {
                                break;
                            }
                        }
                    } finally {
                        try {
                            cleanup();
                        } finally {
                            STATE_UPDATER.set(SingleThreadEventExecutor.this, ST_TERMINATED);
                            threadLock.release();
                            if (!taskQueue.isEmpty()) {
                                logger.warn(
                                        "An event executor terminated with " +
                                                "non-empty task queue (" + taskQueue.size() + ')');
                            }
                            terminationFuture.setSuccess(null);
                        }
                    }
                }
            }
        });
    }
```

- 接着分析 doStartThread 方法，首先会调用 Executor 的 execute 方法，这个 Executor 是我们在创建 EventLoopGroup 时候创建的是一个 ThreadPerTaskExecutor 类，如下图是在 channel 中对应的 EventLoop 找到的对象信息，该 execute 方法会将 Runable 包装成 Netty 的 FastThreadLocalThread
- 接着通过Thread.currentThread() 判断线程是否中断
- updateLastExecutionTime(); 然后设置最后一次执行的时间
- 核心方法是：SingleThreadEventExecutor.this.run(); 执行当前NioEventLoop的run方法，等会重点关注
- 接着完成run方法的事物处理后，在finally中使用cas不断的修改state状态，设置为ST_SHUTTING_DOWN，也就是当loop中run方法结束运行后，关闭线程，最后还会通过不断轮询来二次确认是否关闭，否则不会break跳出
- 接下来分析EventLoop中的Run方法，我们进入Run方法，就到了我们之前分析过的NioEventLoop中的run方法，此方法做了三件事情，如下源码

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

- NioEventLoop 中的 loop 轮询是依靠 run 方法来执行的，在方法中可以看到是一个 for 循环其中三件事情,如下图中EventLoop部分
- case SelectStrategy.SELECT: 当事件类似是SELECT 时候， 通过select(wakenUp.getAndSet(false));方法获取感兴趣的事件
- processSelectedKeys(); 处理选中的事件
- runAllTasks 执行队列中的任务。

- 上图不管是bossGroup还是WorkerGroup中的EventLoop都由run方法完成

**select 方法实现**

```java
private void select(boolean oldWakenUp) throws IOException {
        Selector selector = this.selector;
        try {
            int selectCnt = 0;
            long currentTimeNanos = System.nanoTime();
            long selectDeadLineNanos = currentTimeNanos + delayNanos(currentTimeNanos);
            for (;;) {
                long timeoutMillis = (selectDeadLineNanos - currentTimeNanos + 500000L) / 1000000L;
                if (timeoutMillis <= 0) {
                    if (selectCnt == 0) {
                        selector.selectNow();
                        selectCnt = 1;
                    }
                    break;
                }
                // If a task was submitted when wakenUp value was true, the task didn't get a chance to call
                // Selector#wakeup. So we need to check task queue again before executing select operation.
                // If we don't, the task might be pended until select operation was timed out.
                // It might be pended until idle timeout if IdleStateHandler existed in pipeline.
                if (hasTasks() && wakenUp.compareAndSet(false, true)) {
                    selector.selectNow();
                    selectCnt = 1;
                    break;
                }
                int selectedKeys = selector.select(timeoutMillis);
                selectCnt ++;
                if (selectedKeys != 0 || oldWakenUp || wakenUp.get() || hasTasks() || hasScheduledTasks()) {
                    // - Selected something,
                    // - waken up by user, or
                    // - the task queue has a pending task.
                    // - a scheduled task is ready for processing
                    break;
                }
                if (Thread.interrupted()) {
                    // Thread was interrupted so reset selected keys and break so we not run into a busy loop.
                    // As this is most likely a bug in the handler of the user or it's client library we will
                    // also log it.
                    //
                    // See https://github.com/netty/netty/issues/2426
                    if (logger.isDebugEnabled()) {
                        logger.debug("Selector.select() returned prematurely because " +
                                "Thread.currentThread().interrupt() was called. Use " +
                                "NioEventLoop.shutdownGracefully() to shutdown the NioEventLoop.");
                    }
                    selectCnt = 1;
                    break;
                }
                long time = System.nanoTime();
                if (time - TimeUnit.MILLISECONDS.toNanos(timeoutMillis) >= currentTimeNanos) {
                    // timeoutMillis elapsed without anything selected.
                    selectCnt = 1;
                } else if (SELECTOR_AUTO_REBUILD_THRESHOLD > 0 &&
                        selectCnt >= SELECTOR_AUTO_REBUILD_THRESHOLD) {
                    // The selector returned prematurely many times in a row.
                    // Rebuild the selector to work around the problem.
                    logger.warn(
                            "Selector.select() returned prematurely {} times in a row; rebuilding Selector {}.",
                            selectCnt, selector);
                    rebuildSelector();
                    selector = this.selector;
                    // Select again to populate selectedKeys.
                    selector.selectNow();
                    selectCnt = 1;
                    break;
                }
                currentTimeNanos = time;
            }
            if (selectCnt > MIN_PREMATURE_SELECTOR_RETURNS) {
                if (logger.isDebugEnabled()) {
                    logger.debug("Selector.select() returned prematurely {} times in a row for Selector {}.",
                            selectCnt - 1, selector);
                }
            }
        } catch (CancelledKeyException e) {
            if (logger.isDebugEnabled()) {
                logger.debug(CancelledKeyException.class.getSimpleName() + " raised by a Selector {} - JDK bug?",
                        selector, e);
            }
            // Harmless exception - log anyway
        }
    }
```

- 关注点在于 select方法如何体现出非阻塞，如下图中，选择器获取对应事件debug
- 在select中参数timeoutMillis是1 秒，也就是默认情况下阻塞1秒中，具体的算法： long timeoutMillis = (selectDeadLineNanos - currentTimeNanos + 500000L) / 1000000L;
- 其中 long selectDeadLineNanos = currentTimeNanos + delayNanos(currentTimeNanos); 表示当前时间 + 定时任务的时间，那么timeoutMillis 意思就是，当有定时任务的时候 delayNanos(currentTimeNanos) 返回的事件不为空，那么定时任务剩余时间 t +0.5秒阻塞的时间，否则就默认1秒中阻塞时间
- 接着判断： if (selectedKeys != 0 || oldWakenUp || wakenUp.get() || hasTasks() || hasScheduledTasks())
- 如果1秒（或者t+0.5）后能获取到selectedKeys ：selectedKeys != 0
- 或者select被用户唤醒 ：oldWakenUp， wakenUp.get()
- 或者任务队列中有任务存在 ： hasTasks()
- 或者有定时任务即将被执行 ： hasScheduledTasks()
- 有以上任何情况则跳出循环，否则继续轮询，直到满足其中一个条件为止

**runAllTask实现**

- 在接着runAllTasks 的执行参数

- ioRatio 默认大小50，ioStartTime 记录执行processSelectedKeys之前的事件，ioTime计算processSelectedKeys执行耗时
- ioTime * (100 - ioRatio) / ioRatio。processSelectedKeys * （100 -50）/100，也就是取processSelectedKeys 耗时一半的事件作为runAllTask的入参
- 进入runAllTask

```java
/**
     * Poll all tasks from the task queue and run them via {@link Runnable#run()} method.  This method stops running
     * the tasks in the task queue and returns if it ran longer than {@code timeoutNanos}.
     */
    protected boolean runAllTasks(long timeoutNanos) {
        fetchFromScheduledTaskQueue();
        Runnable task = pollTask();
        if (task == null) {
            afterRunningAllTasks();
            return false;
        }
        final long deadline = ScheduledFutureTask.nanoTime() + timeoutNanos;
        long runTasks = 0;
        long lastExecutionTime;
        for (;;) {
            safeExecute(task);
            runTasks ++;
            // Check timeout every 64 tasks because nanoTime() is relatively expensive.
            // XXX: Hard-coded value - will make it configurable if it is really a problem.
            if ((runTasks & 0x3F) == 0) {
                lastExecutionTime = ScheduledFutureTask.nanoTime();
                if (lastExecutionTime >= deadline) {
                    break;
                }
            }
            task = pollTask();
            if (task == null) {
                lastExecutionTime = ScheduledFutureTask.nanoTime();
                break;
            }
        }
        afterRunningAllTasks();
        this.lastExecutionTime = lastExecutionTime;
        return true;
    }
```

- fetchFromScheduledTaskQueue首先获取一个即将要执行的定时任务task，并将此任务添加到任务队列taskQueue中
- deadline = ScheduledFutureTask.nanoTime() + timeoutNanos;根据之前计算事件的出本次轮询任务执行的最后时间
- for循环中，执行任务队列中任务，每次执行完统计时间，当任务队列中task 空，或者时间超过了deadline，则跳出，完成本次执行轮询，更新任务的最后执行时间
- 总结runAllTask，就是在规定时间内，尽量多的执行queue或者scheduler中的任务

**processSelectedKeys 实现**

- processSelectedKeys 的作用是处理事件，例如，连接，接收连接，读，写事件，接下来看源码

```java
    private void processSelectedKeys() {
        if (selectedKeys != null) {
            processSelectedKeysOptimized();
        } else {
            processSelectedKeysPlain(selector.selectedKeys());
        }
    }
```

- 当selectedKeys不为空，说明有事件需要处理，processSelectedKeysOptimized 是具体处理的逻辑，最终的实现代码如下

```java
private void processSelectedKey(SelectionKey k, AbstractNioChannel ch) {
        final AbstractNioChannel.NioUnsafe unsafe = ch.unsafe();
        if (!k.isValid()) {
            final EventLoop eventLoop;
            try {
                eventLoop = ch.eventLoop();
            } catch (Throwable ignored) {
                // If the channel implementation throws an exception because there is no event loop, we ignore this
                // because we are only trying to determine if ch is registered to this event loop and thus has authority
                // to close ch.
                return;
            }
            // Only close ch if ch is still registered to this EventLoop. ch could have deregistered from the event loop
            // and thus the SelectionKey could be cancelled as part of the deregistration process, but the channel is
            // still healthy and should not be closed.
            // See https://github.com/netty/netty/issues/5125
            if (eventLoop != this || eventLoop == null) {
                return;
            }
            // close the channel if the key is not valid anymore
            unsafe.close(unsafe.voidPromise());
            return;
        }
        try {
            int readyOps = k.readyOps();
            // We first need to call finishConnect() before try to trigger a read(...) or write(...) as otherwise
            // the NIO JDK channel implementation may throw a NotYetConnectedException.
            if ((readyOps & SelectionKey.OP_CONNECT) != 0) {
                // remove OP_CONNECT as otherwise Selector.select(..) will always return without blocking
                // See https://github.com/netty/netty/issues/924
                int ops = k.interestOps();
                ops &= ~SelectionKey.OP_CONNECT;
                k.interestOps(ops);
                unsafe.finishConnect();
            }
            // Process OP_WRITE first as we may be able to write some queued buffers and so free memory.
            if ((readyOps & SelectionKey.OP_WRITE) != 0) {
                // Call forceFlush which will also take care of clear the OP_WRITE once there is nothing left to write
                ch.unsafe().forceFlush();
            }
            // Also check for readOps of 0 to workaround possible JDK bug which may otherwise lead
            // to a spin loop
            if ((readyOps & (SelectionKey.OP_READ | SelectionKey.OP_ACCEPT)) != 0 || readyOps == 0) {
                unsafe.read();
            }
        } catch (CancelledKeyException ignored) {
            unsafe.close(unsafe.voidPromise());
        }
    }
```

- k.isValid() 首先判断SelectionKey 是否合法
- readyOps = k.readyOps(); 获取事件类型
- OP_CONNECT 事件处理逻辑：当获取到连接事件，在NIO中我们需要确定是否已经完成连接，会调用unsafe.finishConnect(); 方法，底层是利用Nio中的SocketChannel.finishConnect 完成连接操作
- OP_WRITE 事件处理逻辑：直接调用forceFlush，完成缓存刷新，此处有必要解释一下，根源码，最终来到flush0 方法，如下

```java
        @Override
        protected final void flush0() {
            // Flush immediately only when there's no pending flush.
            // If there's a pending flush operation, event loop will call forceFlush() later,
            // and thus there's no need to call it now.
            if (isFlushPending()) {
                return;
            }
            super.flush0();
        }
```

- 在实际flush之前，netty调用isFlushPending判断，这个channel是否注册了可写事件，如果有可写事件就等会再发送。如果没有，就会调用父类的flush0方法直接写。解释之前我们先要了解ChannelOutboundBuffer
- 每个 ChannelSocket 的 Unsafe 都有一个绑定的 ChannelOutboundBuffer ， Netty 向站外输出数据的过程统一通过 ChannelOutboundBuffer 类进行封装，目的是为了提高网络的吞吐量，在外面调用 write 的时候，数据并没有写到 Socket，而是写到了 ChannelOutboundBuffer 这里，当调用 flush 的时候，才真正的向 Socket 写出，而write只是将数据写入ChanneloutboundBuffer这个单向链表中
- 之后我们重新开一篇文来说明ChannelOutboundBuffer在写事件中的具体实现以及Netty（nio）对写事件效率提升的一些优化
- 接着回到processSelectedKey ，之后会处理OP_READ，OP_ACCEPT 事件，会调用NioMessageUnsafe 的read方法对传入的数据进行读操作

## 1.2 总结

- 每次执行execute方法就会向队列中添加任务。当第一次添加时候就启动线程，执行run方法，run方法是EventLoop的核心实现，负责轮询获取事件，处理事件，执行队列中任务
- 其中调用selector的select方法默认阻塞一秒，有定时任务就t+0.5，t是定时任务剩余时间，当执行execute方法时候，也就是添加任务的时候，唤醒selector，防止selector阻塞时间过长
- 当selector返回的时候，会调用processSelectedKeys对selectKey进行处理
- 当processSelectedKeys 方法执行结束，按照ioRatio比例执行runAllTasks方法默认是 IO 任务时间和非 IO 任务时间是相同的代码如下
