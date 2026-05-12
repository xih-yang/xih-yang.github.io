# 41、Netty 源码解析 - EventLoop源码剖析
- 来源：https://ddkk.com/zhuanlan/server/netty/1/41.html
- 分类：服务器框架
- 分组：教程目录
## 一、基本说明

分析：EventLoopGroup bossGroup = new NioEventLoopGroup(1);

## 二、源码剖析

### 2.1 NioEventLoop 继承图

1、ScheduledExecutorService 接口表示是一个定时任务接口，EventLoop 可以接受定时任务。

2、EventLoop 接口，Netty 接口文档中说明该接口作用：一旦 Channl 注册了，就处理该 Channel 对应的所有 I/O 操作。

3、SingleThreadEventExecutor 表示这是一个单个线程的线程池。

4、EventLoop 是一个单例的线程池，里面含有一个死循环的线程不断的做着 3 件事情：监听端口、处理端口事件、处理队列事件。每个 EventLoop 都可以绑定多个 Channel ，而每个 Channel 始终只能由一个 EventLoop 来处理。

### 2.2 NioEventLoop的使用 – execute 方法

#### 2.2.1 execute方法

在EventLoop 的使用，一般就是 eventLoop.execute(task); 基于 SingleThreadEventExecutor 的实现：

```java
@Override
public void execute(Runnable task) {
    if (task == null) {
        throw new NullPointerException("task");
    }
    boolean inEventLoop = inEventLoop();
    if (inEventLoop) {
        addTask(task);
    } else {
        startThread();
        addTask(task);
        if (isShutdown() && removeTask(task)) {
            reject();
        }
    }
    if (!addTaskWakesUp && wakesUpForTask(task)) {
        wakeup(inEventLoop);
    }
}
```

1、首先判断该 EventLoop 的线程是否是当前线程，如果是，直接添加到任务队列中去，如果不是，则尝试启动线程（但由于线程是单个的，因此只能启动一次），随后再将任务添加到任务队列中。

2、如果线程已经停止，并且删除任务失败，则执行拒绝策略，默认是抛出异常。

3、如果 addTaskWakesUp 是false，并且任务不是 NonWakeupRunnable 类型的，就尝试唤醒 selector。这个时候，阻塞在 selector 的线程就会立即返回。

#### 2.2.2 addTask、offerTask

```java
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

#### 2.2.3 startThread 方法

1、当执行 execute 方法的时候，如果当前线程不是 EventLoop 所属线程，则尝试启动线程，也就是 startThread 方法，代码如下：

```java
private void startThread() {
    if (state == ST_NOT_STARTED) {
        if (STATE_UPDATER.compareAndSet(this, ST_NOT_STARTED, ST_STARTED)) {
            try {
                doStartThread();
            } catch (Throwable cause) {
                STATE_UPDATER.set(this, ST_NOT_STARTED);
                PlatformDependent.throwException(cause);
            }
        }
    }
}
```

该方法首先判断是否启动过了，保证 EventLoop 只有一个线程，如果没有启动过，则尝试使用 Cas 将 state 状态改为 ST_STARTED，也就是已经启动。然后调用 doStartThread 方法。如果失败，则进行回滚

2）doStartThread 方法，代码如下：

```java
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

- 首先调用 executor 的 execute 方法，这个 executor 就是在创建 EventLoopGroup 的时候创建的 ThreadPerTaskExecutor 类。该 execute 方法会将 Runnable 包装成 Netty 的 FastThreadLocalThread。
- 任务中，首先判断线程中断状态，然后设置最后一次的执行时间。
- 执行当前 NioEventLoop 的 run 方法，注意：这个方法是个死循环，是整个 EventLoop 的核心
- 在 finally 块中，使用 CAS 不断修改 state 状态，改为 ST_SHUTTING_DOWN。也就是当线程 Loop 结束的时候，关闭线程。最后还要死循环确认是否关闭，否则不会break。然后，执行 cleanup 操作，更新状态为 ST_TERMINATED，并释放当前线程锁。如果任务队列不是空，则打印队列中还有多少个未完成的任务。并回调 terminationFuture 方法
- 其实最核心的就是 EventLoop 自身的 run 方法。

#### 2.2.4 EventLoop 的 run 方法

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

1、从上面的步骤可以看出，整个 run 方法做了三件事情

- select 获取感兴趣的事情
- processSelectedKeys 处理事件
- runAllTasks 执行队列中的任务

2、select 方法（体现非阻塞）

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

调用selector 的 select 方法，默认阻塞一秒钟，如果有定时任务，则在定时任务剩余时间的基础上加上 0.5 秒进行阻塞。当执行 execute 方法的时候，也就是添加任务的时候，唤醒 selector ，防止 selector 阻塞时间过长。

## 三、总结

每次执行 execute 方法都是向队列中添加任务。当第一次添加时就启动线程，执行 run 方法，而 run 方法是整个 EventLoop 的核心，就像 EventLoop 的名字一样，Loop，Loop 完成以下 3件事情：

- 调用 selector 的 select 方法，默认阻塞一秒钟，如果有定时任务，则在定时任务剩余时间的基础上在加上0.5秒进行阻塞。当执行 execute 方法的时候，也就是添加任务的时候，会唤醒 selector，防止 selector 阻塞时间过长。
- 当 selector 返回的时候，会调用 processSelectedKeys 方法对 selectedKeys 进行处理。
- 当 processSelectedKeys 方法执行结束后，则按照 ioRatio 的比例执行 runAllTasks 方法，默认 IO 任务时间和非 IO 任务时间是相同的，你也可以根据你的应用特点进行调优。比如 非 IO 任务比较多，那么你就将 ioRatio 调小一点，这样 非 IO 任务就能执行的长一点，防止队列中积攒过多的任务。
