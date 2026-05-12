# 26、Java JUC源码分析 - 线程池-ThreadPoolExecutor
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/26.html
- 分类：Java并发
- 分组：教程目录
## 功能说明

使用线程池通过线程的重用，降低线程创建的开销，降低资源消耗，额外还增加了一些线程执行的管理功能，方便对线程执行状态的监控。

## 类图

先看Executor–ExecutorService–AbstractExecutorService–ThreadPoolExecutor这条线的源码。

## 预热

### Executor

```java
/** 主要是解耦command的提交和执行 */
public interface Executor {
    /**
     * 提交一个command，执行由实现类自己定义，可以直接执行，也可以新开线程执行等等
     */
    void execute(Runnable command);
}
```

### ExecutorService

接口ExecutorService继承Executor接口，提供线程终止的方法，扩展父接口`execute()`方法，提供future返回的submit方法。

```java
public interface ExecutorService extends Executor {
    /**
     * 关闭之前的任务会继续执行，但是不会接受新的任务，如果已经关闭，调用不会有任务影响
     */
    void shutdown();
    /**
     * 尝试停止正在执行的任务，暂停等待处理的任务，返回等待执行的任务列表
     * 没办法保证一定能够停止执行中的任务
     */
    List<Runnable> shutdownNow();
    /**
     * 执行器是否已经关闭
     */
    boolean isShutdown();
    /**
     * 是否所有任务都已关闭，必须先调用shutdown或shutdownnow
     */
    boolean isTerminated();
    /**
     * 阻塞等待所有任务都执行完毕
     */
    boolean awaitTermination(long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 下面3个方法都差不多，都是提交一个任务，返回一个Future，然后通过future.get()方法获取执行的结果
     */
    <T> Future<T> submit(Callable<T> task);
    <T> Future<T> submit(Runnable task, T result);
    Future<?> submit(Runnable task);
    /**
     * 执行给定的任务集合，当所有任务完成时，返回Future的结果
     */
    <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
        throws InterruptedException;
    <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks,
                                  long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 执行指定的任务集合，如果其中一个成功完成，那就返回，其他没有完成的就取消
     */
    <T> T invokeAny(Collection<? extends Callable<T>> tasks)
        throws InterruptedException, ExecutionException;
    <T> T invokeAny(Collection<? extends Callable<T>> tasks,
                    long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException;
}
```

`submit()`方法参数，runnable、callable、future3者简单的区别：

**runnable没有返回的执行，callable有返回值的，future是可取消的callable**。

### AbstractExecutorService

```java
protected <T> RunnableFuture<T> newTaskFor(Runnable runnable, T value) {
    return new FutureTask<T>(runnable, value);
}
protected <T> RunnableFuture<T> newTaskFor(Callable<T> callable) {
    return new FutureTask<T>(callable);
}
```

2个`newTask()`方法分别将callable、runnable转换为future返回，看下FutureTask类图：

返回的FutureTask既可以当Runnable用，也可以当Future使用。

该抽象类实现ExecutorService的`submit()`方法会调用`newTask()`方法做转换：

```java
public Future<?> submit(Runnable task) {
    if (task == null) throw new NullPointerException();
    RunnableFuture<Void> ftask = newTaskFor(task, null);
    execute(ftask);
    return ftask;
}
public <T> Future<T> submit(Runnable task, T result) {
    if (task == null) throw new NullPointerException();
    RunnableFuture<T> ftask = newTaskFor(task, result);
    execute(ftask);
    return ftask;
}
public <T> Future<T> submit(Callable<T> task) {
    if (task == null) throw new NullPointerException();
    RunnableFuture<T> ftask = newTaskFor(task);
    execute(ftask);
    return ftask;
}
```

看下`invokeAny()`的实现：

```java
public <T> T invokeAny(Collection<? extends Callable<T>> tasks)
    throws InterruptedException, ExecutionException {
    try {
        return doInvokeAny(tasks, false, 0);
    } catch (TimeoutException cannotHappen) {
        assert false;
        return null;
    }
}
public <T> T invokeAny(Collection<? extends Callable<T>> tasks,
                       long timeout, TimeUnit unit)
    throws InterruptedException, ExecutionException, TimeoutException {
    return doInvokeAny(tasks, true, unit.toNanos(timeout));
}
/** invokeAny真正处理业务逻辑的地方，spring里面经常看到这样的方式，推荐使用 */
private <T> T doInvokeAny(Collection<? extends Callable<T>> tasks,
                        boolean timed, long nanos)
    throws InterruptedException, ExecutionException, TimeoutException {
    if (tasks == null)
        throw new NullPointerException();
    int ntasks = tasks.size();
    if (ntasks == 0)
        throw new IllegalArgumentException();
    List<Future<T>> futures= new ArrayList<Future<T>>(ntasks);
    ExecutorCompletionService<T> ecs =
        new ExecutorCompletionService<T>(this); //将this的Executor再封装一层
    // For efficiency, especially in executors with limited
    // parallelism, check to see if previously submitted tasks are
    // done before submitting more of them. This interleaving
    // plus the exception mechanics account for messiness of main
    // loop.
    try {
        // Record exceptions so that if we fail to obtain any
        // result, we can throw the last exception we got.
        ExecutionException ee = null;
        long lastTime = timed ? System.nanoTime() : 0;
        Iterator<? extends Callable<T>> it = tasks.iterator();
        // Start one task for sure; the rest incrementally
        futures.add(ecs.submit(it.next())); //先提交一个执行
        --ntasks;
        int active = 1;
        for (;;) {
            Future<T> f = ecs.poll(); //从ecs中poll个出来，然后检查结果
            if (f == null) { //
                if (ntasks > 0) {
                    --ntasks;
                    futures.add(ecs.submit(it.next())); 
                    ++active;
                }
                else if (active == 0)
                    break;
                else if (timed) {
                    f = ecs.poll(nanos, TimeUnit.NANOSECONDS);
                    if (f == null)
                        throw new TimeoutException();
                    long now = System.nanoTime();
                    nanos -= now - lastTime;
                    lastTime = now;
                }
                else
                    f = ecs.take();
            }
            if (f != null) { //不为null
                --active;
                try {
                    return f.get(); //返回结果
                } catch (ExecutionException eex) {
                    ee = eex;
                } catch (RuntimeException rex) {
                    ee = new ExecutionException(rex);
                }
            }
        }
        if (ee == null) 
            ee = new ExecutionException();
        throw ee; //异常存在就抛异常
    } finally {
        for (Future<T> f : futures)
            f.cancel(true); //有异常或者有结果返回前，取消所有提交的任务
    }
}
```

`invokeAny()`之前说过是执行一组任务，有一个完成就取消其他，这里都调用了`doInvokeAny()`来处理逻辑，大体流程是：

**1、** 先构造一个ExecutorCompletionService实例ecs(ecs简单解释，使用给定的执行器执行任务，按照给定的顺序返回执行结果future);；

**2、** 先提交一个任务，然后for循环检查ecs的future，为null那就分情况，如果还有任务那就再提交一个，或有超时设置，实在不行那就阻塞等待；不为null那就future.get()获取结果返回，如果future.get有异常那就设置异常；

**3、** 退出for循环的时候检查是否有异常，最后再return或throw异常前取消掉提交的任务；

看下`invokeAll()`的源码：

```java
public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
    throws InterruptedException {
    if (tasks == null)
        throw new NullPointerException();
    List<Future<T>> futures = new ArrayList<Future<T>>(tasks.size());
    boolean done = false;
    try {
        for (Callable<T> t : tasks) { //执行所有任务
            RunnableFuture<T> f = newTaskFor(t);
            futures.add(f);
            execute(f);
        }
        for (Future<T> f : futures) { //等待所有任务完成
            if (!f.isDone()) {
                try {
                    f.get();
                } catch (CancellationException ignore) {
                } catch (ExecutionException ignore) {
                }
            }
        }
        done = true;
        return futures;
    } finally {
        if (!done) //没执行完，那就取消任务
            for (Future<T> f : futures)
                f.cancel(true);
    }
}
public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks,
                                     long timeout, TimeUnit unit)
    throws InterruptedException {
    if (tasks == null || unit == null)
        throw new NullPointerException();
    long nanos = unit.toNanos(timeout);
    List<Future<T>> futures = new ArrayList<Future<T>>(tasks.size());
    boolean done = false;
    try {
        for (Callable<T> t : tasks)
            futures.add(newTaskFor(t));
        long lastTime = System.nanoTime();
        // Interleave time checks and calls to execute in case
        // executor doesn't have any/much parallelism.
        Iterator<Future<T>> it = futures.iterator();
        while (it.hasNext()) {
            execute((Runnable)(it.next()));
            long now = System.nanoTime();
            nanos -= now - lastTime;
            lastTime = now;
            if (nanos <= 0) //超时返回future
                return futures;
        }
        //假如上面超时返回了，future还是有可能存在已经完成的任务
        for (Future<T> f : futures) {
            if (!f.isDone()) {
                if (nanos <= 0)
                    return futures;
                try {
                    f.get(nanos, TimeUnit.NANOSECONDS);
                } catch (CancellationException ignore) {
                } catch (ExecutionException ignore) {
                } catch (TimeoutException toe) {
                    return futures;
                }
                long now = System.nanoTime();
                nanos -= now - lastTime;
                lastTime = now;
            }
        }
        done = true;
        return futures;
    } finally {
        if (!done)
            for (Future<T> f : futures)
                f.cancel(true);
    }
}
```

大体的流程基本是1.提交任务；2.等待任务完成。有点不同的是超时的`invokeAll()`方法，即使超时返回了，future也有可能存在已经完成的任务，估计调用的时候还是要自己检查future是否null再加上future.get()是否null来判断。

## ThreadPoolExecutor

### 线程池状态

```java
/**ctl代表2个含义：高3位为线程池运行状态，低29位线程数量 */
private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0)); //11100000000000000000000000000000
private static final int COUNT_BITS = Integer.SIZE - 3; //29
private static final int CAPACITY   = (1 << COUNT_BITS) - 1; //00011111111111111111111111111111
// runState is stored in the high-order bits
/**
 *   RUNNING:  接收新的任务并且也会处理已经提交等待的任务
 *   SHUTDOWN: 不会接收新的任务，但会处理已经提交等待的任务
 *   STOP:     不接受新任务，不处理已经提交等待的任务，而且还会中断处理中的任务
 *   TIDYING:  所有的任务被终止，workCount为0，为此状态时将会调用terminated()方法
 *   TERMINATED: terminated()调用完成
 *
 * 状态流转：
 * RUNNING -> SHUTDOWN
 *    On invocation of shutdown(), perhaps implicitly in finalize()
 * (RUNNING or SHUTDOWN) -> STOP
 *    On invocation of shutdownNow()
 * SHUTDOWN -> TIDYING
 *    When both queue and pool are empty
 * STOP -> TIDYING
 *    When pool is empty
 * TIDYING -> TERMINATED
 *    When the terminated() hook method has completed
 */
private static final int RUNNING    = -1 << COUNT_BITS; //11100000000000000000000000000000
private static final int SHUTDOWN   =  0 << COUNT_BITS; //00000000000000000000000000000000
private static final int STOP       =  1 << COUNT_BITS; //00100000000000000000000000000000
private static final int TIDYING    =  2 << COUNT_BITS; //01000000000000000000000000000000
private static final int TERMINATED =  3 << COUNT_BITS; //01100000000000000000000000000000
// Packing and unpacking ctl
private static int runStateOf(int c)     { return c & ~CAPACITY; } //&操作比较高3位获取线程池状态
private static int workerCountOf(int c)  { return c & CAPACITY; } // &比较低29位获取线程数量
private static int ctlOf(int rs, int wc) { return rs | wc; } //通过rs高3位运行状态|wc低29位线程数量计算最后的值
/*
 * Bit field accessors that don't require unpacking ctl.
 * These depend on the bit layout and on workerCount being never negative.
 */
private static boolean runStateLessThan(int c, int s) {
    return c < s;
}
private static boolean runStateAtLeast(int c, int s) {
    return c >= s;
}
private static boolean isRunning(int c) {
    return c < SHUTDOWN;
}
/**
 * Attempt to CAS-increment the workerCount field of ctl.
 */
private boolean compareAndIncrementWorkerCount(int expect) {
    return ctl.compareAndSet(expect, expect + 1);
}
/**
 * Attempt to CAS-decrement the workerCount field of ctl.
 */
private boolean compareAndDecrementWorkerCount(int expect) {
    return ctl.compareAndSet(expect, expect - 1);
}
/**
 * Decrements the workerCount field of ctl. This is called only on
 * abrupt termination of a thread (see processWorkerExit). Other
 * decrements are performed within getTask.
 */
private void decrementWorkerCount() {
    do {} while (! compareAndDecrementWorkerCount(ctl.get()));
}
private void advanceRunState(int targetState) {
    for (;;) {
        int c = ctl.get();
        if (runStateAtLeast(c, targetState) ||
            ctl.compareAndSet(c, ctlOf(targetState, workerCountOf(c))))
            break;
    }
}
```

主要是ctl高低位分离，之前读写锁的时候也有这种处理。

### ThreadPoolExecutor大致结构

```java
/**
 * 一般来说，如果线程池大小没到corePoolSize大小，会新增线程运行，如果到了，那就入workQueue队列，等线程运行
 */
private final BlockingQueue<Runnable> workQueue;
/**
 * 一些操作需要加锁
 */
private final ReentrantLock mainLock = new ReentrantLock();
/**
 * 线程池，所有的线程
 */
private final HashSet<Worker> workers = new HashSet<Worker>();
/**
 * awaitTermination时条件
 */
private final Condition termination = mainLock.newCondition();
/**
 * 线程池线程最大数量
 */
private int largestPoolSize;
/**
 * 已经结束的任务，只有在关闭线程池的时候才累加
 */
private long completedTaskCount;
/**
 * 线程池工厂，里面有一个newThread()方法用来产生工作线程，如果构造没提供，默认有一个
 */
private volatile ThreadFactory threadFactory;
/**
 * 大部分用在线程池满了以后，新的任务过来，使用那种拒绝策略，默认会提供一个
 */
private volatile RejectedExecutionHandler handler;
/** 
 * 线程数量大于corePoolSize时，线程可以空闲的时间，如果设置了allowCoreThreadTimeOut，小于corePoolSize时也一样处理，否则就等待任务到来
 */
private volatile long keepAliveTime;
/**
 * false，核心线程空闲等待，true的话就是用keepAliveTime超时控制获取任务
 */
private volatile boolean allowCoreThreadTimeOut;
/**
 * 核心线程数量
 */
private volatile int corePoolSize;
/**
 * 跟largestPoolSize这个不一样，这个用来控制线程池大小
 */
private volatile int maximumPoolSize;
/**
 * 默认的拒绝策略
 */
private static final RejectedExecutionHandler defaultHandler =
    new AbortPolicy();
```

构造函数：

```java
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue) {
    this(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue,
         Executors.defaultThreadFactory(), defaultHandler);
}
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory) {
    this(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue,
         threadFactory, defaultHandler);
}
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          RejectedExecutionHandler handler) {
    this(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue,
         Executors.defaultThreadFactory(), handler);
}
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory,
                          RejectedExecutionHandler handler) {
    if (corePoolSize < 0 ||
        maximumPoolSize <= 0 ||
        maximumPoolSize < corePoolSize ||
        keepAliveTime < 0)
        throw new IllegalArgumentException();
    if (workQueue == null || threadFactory == null || handler == null)
        throw new NullPointerException();
    this.corePoolSize = corePoolSize;
    this.maximumPoolSize = maximumPoolSize;
    this.workQueue = workQueue;
    this.keepAliveTime = unit.toNanos(keepAliveTime);
    this.threadFactory = threadFactory;
    this.handler = handler;
}
```

构造函数基本就是对那些变量的检查赋值。

在看`execute()`方法前先看下默认提供的线程工厂和拒绝策略。

```java
/** ThreadPoolExecutor构造的时候如果不传入，默认这个，用于产生工作线程 */
static class DefaultThreadFactory implements ThreadFactory {
    private static final AtomicInteger poolNumber = new AtomicInteger(1);
    private final ThreadGroup group;
    private final AtomicInteger threadNumber = new AtomicInteger(1);
    private final String namePrefix;
    DefaultThreadFactory() {
        SecurityManager s = System.getSecurityManager();
        group = (s != null) ? s.getThreadGroup() :
                              Thread.currentThread().getThreadGroup();
        namePrefix = "pool-" +
                      poolNumber.getAndIncrement() +
                     "-thread-";
    }
    /** 返回一个线程：name为pool-线程池序列-thread-线程序列，优先级为5，非守护线程 */
    public Thread newThread(Runnable r) {
        Thread t = new Thread(group, r,
                              namePrefix + threadNumber.getAndIncrement(),
                              0);
        if (t.isDaemon())
            t.setDaemon(false);
        if (t.getPriority() != Thread.NORM_PRIORITY)
            t.setPriority(Thread.NORM_PRIORITY);
        return t;
    }
}
```

线程池构造如果不传参，默认提供了一个拒绝策略AbortPolicy

```java
public static class CallerRunsPolicy implements RejectedExecutionHandler {
    /**
     * Creates a {@code CallerRunsPolicy}.
     */
    public CallerRunsPolicy() { }
    /**
     * 如果线程池没有关闭，在调用者线程直接运行该任务，否则discard
     */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        if (!e.isShutdown()) {
            r.run();
        }
    }
}
public static class AbortPolicy implements RejectedExecutionHandler {
    /**
     * Creates an {@code AbortPolicy}.
     */
    public AbortPolicy() { }
    /**
     * throws RejectedExecutionException.直接抛出异常
     */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        throw new RejectedExecutionException("Task " + r.toString() +
                                             " rejected from " +
                                             e.toString());
    }
}
public static class DiscardPolicy implements RejectedExecutionHandler {
    /**
     * Creates a {@code DiscardPolicy}.
     */
    public DiscardPolicy() { }
    /**
     * 什么都不做
     */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
    }
}
public static class DiscardOldestPolicy implements RejectedExecutionHandler {
    /**
     * Creates a {@code DiscardOldestPolicy} for the given executor.
     */
    public DiscardOldestPolicy() { }
    /**
     * 线程池没有关闭就把任务队列的第一个丢弃然后执行新的
     */
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        if (!e.isShutdown()) {
            e.getQueue().poll();
            e.execute(r);
        }
    }
}
```

实在不满意提供的，那就自己写个吧。

## 核心代码流程

按照代码调用流程来分解。

### execute()

```java
/**
 * 执行给定的线程，可能是在一个新的线程或者是一个已经存在的线程池
 */
public void execute(Runnable command) {
    if (command == null)
        throw new NullPointerException();
    int c = ctl.get();
    if (workerCountOf(c) < corePoolSize) { //小于核心线程数
        if (addWorker(command, true)) //增加一个核心线程
            return;
        c = ctl.get();
    }
    if (isRunning(c) && workQueue.offer(command)) { //如果核心线程数满了，任务就入队列
        int recheck = ctl.get(); //double-check
        if (! isRunning(recheck) && remove(command)) //线程池关闭，remove任务，按照给定的策略reject
            reject(command);
        else if (workerCountOf(recheck) == 0) //如果线程池还在或者remove失败，但是核心线程已经没有了，那就开一个执行队列中的任务
            addWorker(null, false);
    }
    else if (!addWorker(command, false)) //如果检查的时候线程池就关闭了或者线队列满了入队列失败，那就再开一个线程，如果失败那就reject
        reject(command);
}
```

### addWorker

```java
/**
 * 基于当前线程池的状态和大小(core:true使用corePoolSize，false使用maximumPoolSize)，能否加入一个新的工作类
 */
private boolean addWorker(Runnable firstTask, boolean core) {
    retry:
    for (;;) {
        int c = ctl.get();
        int rs = runStateOf(c);
        /** 1.如果为Running状态无所谓，不管新增线程还是接收新任务都可以
         * 2.如果为shutdown状态那就只能处理任务，不能接收任务。这时入参firstTask必须null且，队列不为空，可以增加一个线程来处理队列，但不能新增任务
         * 3.其他状态直接false
         */
        if (rs >= SHUTDOWN &&
            ! (rs == SHUTDOWN &&
               firstTask == null &&
               ! workQueue.isEmpty()))
            return false;
        for (;;) {
            int wc = workerCountOf(c);
            if (wc >= CAPACITY ||
                wc >= (core ? corePoolSize : maximumPoolSize)) //根据core检验大小
                return false;
            if (compareAndIncrementWorkerCount(c)) //线程数量加1
                break retry;
            c = ctl.get();  // Re-read ctl
            if (runStateOf(c) != rs)
                continue retry;
            // else CAS failed due to workerCount change; retry inner loop
        }
    }
    boolean workerStarted = false;
    boolean workerAdded = false;
    Worker w = null;
    try {
        final ReentrantLock mainLock = this.mainLock;
        w = new Worker(firstTask);
        final Thread t = w.thread; //这里产生Thread时候可能为null，workerStarted为false，finally会处理addWorkerFailed
        if (t != null) {
            mainLock.lock(); //线程池主锁
            try {
                // Recheck while holding lock.
                // Back out on ThreadFactory failure or if
                // shut down before lock acquired.
                int c = ctl.get();
                int rs = runStateOf(c);
                if (rs < SHUTDOWN ||
                    (rs == SHUTDOWN && firstTask == null)) {
                    if (t.isAlive()) // precheck that t is startable 刚开始对这里的处理感觉又疑问，后来想到可以自定义线程工厂newThread，存在提前启动线程可能
                        throw new IllegalThreadStateException();
                    workers.add(w); //加入线程池
                    int s = workers.size();
                    if (s > largestPoolSize)
                        largestPoolSize = s; //设置线程池大小
                    workerAdded = true;
                }
            } finally {
                mainLock.unlock(); //解锁
            }
            if (workerAdded) { //true说明已经加入线程池，那就start吧
                t.start();
                workerStarted = true;
            }
        }
    } finally {
        if (! workerStarted) //线程t为null或有异常产生，workerStarted为false
            addWorkerFailed(w);
    }
    return workerStarted;
}
```

### Worker

addWorker中用到了Worker：

```java
w = new Worker(firstTask);
final Thread t = w.thread;
...
t.start();
```

看下Worker类：

```java
/**
 * Class Worker mainly maintains interrupt control state for
 * threads running tasks, along with other minor bookkeeping.
 * This class opportunistically extends AbstractQueuedSynchronizer
 * to simplify acquiring and releasing a lock surrounding each
 * task execution.  This protects against interrupts that are
 * intended to wake up a worker thread waiting for a task from
 * instead interrupting a task being run.  We implement a simple
 * non-reentrant mutual exclusion lock rather than use
 * ReentrantLock because we do not want worker tasks to be able to
 * reacquire the lock when they invoke pool control methods like
 * setCorePoolSize.  Additionally, to suppress interrupts until
 * the thread actually starts running tasks, we initialize lock
 * state to a negative value, and clear it upon start (in
 * runWorker).
 * 英文保留，便于后面的时候对照，以免歧义：
 * Worker实现Runnable接口，所以本身可以作为参数传给Thread运行，继承AQS，实现的是独占模式的api
 * 主要是为了控制线程task运行的中断状态，每次运行前后加解锁
 * 没有使用可重入锁，主要是为了避免获得锁的情况下去修改线程池的一些加锁的方法
 * AQS的初始状态为-1，后面lock为1，unlock为0，可以简单判断state大于等于0值来判断是否运行过
 */
private final class Worker
    extends AbstractQueuedSynchronizer
    implements Runnable
{
    /**
     * This class will never be serialized, but we provide a
     * serialVersionUID to suppress a javac warning.
     */
    private static final long serialVersionUID = 6138294804551838833L;
    /** Thread this worker is running in.  Null if factory fails. */
    final Thread thread;
    /** Initial task to run.  Possibly null. */
    Runnable firstTask;
    /** Per-thread task counter */
    volatile long completedTasks; //每个线程完成的任务统计
    /**
     * Creates with given first task and thread from ThreadFactory.
     * @param firstTask the first task (null if none)
     */
    Worker(Runnable firstTask) {
        setState(-1); // 初始为-1
        this.firstTask = firstTask;
        this.thread = getThreadFactory().newThread(this); //线程工厂newThread
    }
    /** Delegates main run loop to outer runWorker  */
    public void run() {
        runWorker(this); //线程运行后最后会调用ThreadPoolExecutor的runWorker，后面看
    }
    // AQS的独占api实现
    //
    // 0表示unlocked
    // 1表示lock
    protected boolean isHeldExclusively() {
        return getState() != 0;
    }
    protected boolean tryAcquire(int unused) {
        if (compareAndSetState(0, 1)) {
            setExclusiveOwnerThread(Thread.currentThread());
            return true;
        }
        return false;
    }
    protected boolean tryRelease(int unused) {
        setExclusiveOwnerThread(null);
        setState(0);
        return true;
    }
    public void lock()        { acquire(1); }
    public boolean tryLock()  { return tryAcquire(1); }
    public void unlock()      { release(1); }
    public boolean isLocked() { return isHeldExclusively(); }
    void interruptIfStarted() {
        Thread t;
        if (getState() >= 0 && (t = thread) != null && !t.isInterrupted()) { //检查aqs状态和线程状态，只有运行过采取中断
            try {
                t.interrupt();
            } catch (SecurityException ignore) {
            }
        }
    }
}
```

### runWorker

调用`t.start()`后，最后调用到`runWorker()`，这是线程处理任务最重要的方法。`runWorker()`大概处理流程是：初始firstTask不为null就先处理这个任务，然后循环再从workQueue获取getTask来处理，如果队列也取不到任务了，那就退出了，这时候就要看keepAliveTime和allowCoreThreadTimeOut了决定是，大概先这样理解，细节再说。

```java
/**
 * Main worker run loop.  Repeatedly gets tasks from queue and
 * executes them, while coping with a number of issues:
 *
 * 1. We may start out with an initial task, in which case we
 * don't need to get the first one. Otherwise, as long as pool is
 * running, we get tasks from getTask. If it returns null then the
 * worker exits due to changed pool state or configuration
 * parameters.  Other exits result from exception throws in
 * external code, in which case completedAbruptly holds, which
 * usually leads processWorkerExit to replace this thread.
 *
 * 2. Before running any task, the lock is acquired to prevent
 * other pool interrupts while the task is executing, and
 * clearInterruptsForTaskRun called to ensure that unless pool is
 * stopping, this thread does not have its interrupt set.
 *
 * 3. Each task run is preceded by a call to beforeExecute, which
 * might throw an exception, in which case we cause thread to die
 * (breaking loop with completedAbruptly true) without processing
 * the task.
 *
 * 4. Assuming beforeExecute completes normally, we run the task,
 * gathering any of its thrown exceptions to send to
 * afterExecute. We separately handle RuntimeException, Error
 * (both of which the specs guarantee that we trap) and arbitrary
 * Throwables.  Because we cannot rethrow Throwables within
 * Runnable.run, we wrap them within Errors on the way out (to the
 * thread's UncaughtExceptionHandler).  Any thrown exception also
 * conservatively causes thread to die.
 *
 * 5. After task.run completes, we call afterExecute, which may
 * also throw an exception, which will also cause thread to
 * die. According to JLS Sec 14.20, this exception is the one that
 * will be in effect even if task.run throws.
 *
 * The net effect of the exception mechanics is that afterExecute
 * and the thread's UncaughtExceptionHandler have as accurate
 * information as we can provide about any problems encountered by
 * user code.
 *
 * @param w the worker
 */
final void runWorker(Worker w) {
    Thread wt = Thread.currentThread();
    Runnable task = w.firstTask; //线程初始的task
    w.firstTask = null;
    w.unlock(); // allow interrupts 这里是worker构造默认的aqs为-1，这里unlock下，容许中断
    boolean completedAbruptly = true; //线程退出的原因，true是任务导致，false是线程正常退出
    try {
        while (task != null || (task = getTask()) != null) {
            w.lock();
            // If pool is stopping, ensure thread is interrupted;
            // if not, ensure thread is not interrupted.  This
            // requires a recheck in second case to deal with
            // shutdownNow race while clearing interrupt
            if ((runStateAtLeast(ctl.get(), STOP) ||
                 (Thread.interrupted() &&
                  runStateAtLeast(ctl.get(), STOP))) &&
                !wt.isInterrupted())
                wt.interrupt(); //设置中断
            try {
                beforeExecute(wt, task); //空方法，子类可以重载
                Throwable thrown = null;
                try {
                    task.run();
                } catch (RuntimeException x) {
                    thrown = x; throw x;
                } catch (Error x) {
                    thrown = x; throw x;
                } catch (Throwable x) {
                    thrown = x; throw new Error(x);
                } finally {
                    afterExecute(task, thrown);  // 也是空方法，子类重载
                }
            } finally {
                task = null;
                w.completedTasks++;
                w.unlock();
            }
        }
        completedAbruptly = false; //线程正常退出，false
    } finally {
        processWorkerExit(w, completedAbruptly); //work退出，做收尾工作
    }
}
```

### getTask

```java
/**
 * 存在阻塞或超时获取任务或由于下列原因返回null:
 * 1. 超过设置的线程池大小maximumPoolSize；
 * 2. 线程池stop.
 * 3. 线程池shutdown，队列为空.
 * 4. 线程超时等待任务，This worker timed out waiting for a task, and timed-out
 *    workers are subject to termination (that is,
 *    {@code allowCoreThreadTimeOut || workerCount > corePoolSize})
 *    both before and after the timed wait.
 *
 * @return task, or null if the worker must exit, in which case
 *         workerCount is decremented
 */
private Runnable getTask() {
    boolean timedOut = false; // Did the last poll() time out? 控制超时获取poll后是否退出，return null
    retry:
    for (;;) {
        int c = ctl.get();
        int rs = runStateOf(c);
        // Check if queue empty only if necessary.
        // shutdown时如果队列空，那就直接worker减1，返回null
        // Stop往后的状态，那就null，这时候也不会去处理任务
        if (rs >= SHUTDOWN && (rs >= STOP || workQueue.isEmpty())) {
            decrementWorkerCount();
            return null;
        }
        //到这里的时候线程池状态为running或者shutdown但队列不空
        boolean timed;      // 是否超时获取task
        for (;;) {
            int wc = workerCountOf(c);
            /** 
            * 1.容许核心线程超时即allowCoreThreadTimeOut为true
            * 2.不容许容许核心线程超时即allowCoreThreadTimeOut为false，检查线程池数量：
            * 如果大于核心线程数量，那就超时poll获取，否则核心线程阻塞获取
            */
            timed = allowCoreThreadTimeOut || wc > corePoolSize;
            //timeout第一次为false，所以肯定会有一次poll或take发生，这里控制的应该是在发生一次后是否还继续超时获取
            if (wc <= maximumPoolSize && ! (timedOut && timed))
                break;
            if (compareAndDecrementWorkerCount(c)) //不需要，那就扣减返回null
                return null;
            c = ctl.get();  // Re-read ctl
            if (runStateOf(c) != rs)
                continue retry;
            // else CAS failed due to workerCount change; retry inner loop
        }
        try {
            Runnable r = timed ?
                workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) :
                workQueue.take();
            if (r != null)
                return r;
            timedOut = true; 
        } catch (InterruptedException retry) {
            timedOut = false; //响应中断，重新开始
        }
    }
}
```

### processWorkerExit

在上面`runWorker()`中如果`getTask()`返回null或者在用户task.run过程中有异常出现时需要对线程退出做收尾工作`processWorkerExit()`:

```java
/**
 * 线程退出收尾
 */
private void processWorkerExit(Worker w, boolean completedAbruptly) {
    if (completedAbruptly) // 为true的时候，用户线程运行异常，需要扣减，false的时候为getTask方法中扣减线程数量
        decrementWorkerCount();
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        completedTaskCount += w.completedTasks;
        workers.remove(w); //从线程池移除
    } finally {
        mainLock.unlock();
    }
    tryTerminate(); //有worker线程移除，可能是最后一个线程退出需要尝试终止线程池
    int c = ctl.get();
    if (runStateLessThan(c, STOP)) { //线程池可能为running或shutdown状态
        if (!completedAbruptly) { //这里是线程正常退出
            int min = allowCoreThreadTimeOut ? 0 : corePoolSize; //检查allowCoreThreadTimeOut字段，看是否需要维持核心线程数量
            if (min == 0 && ! workQueue.isEmpty()) //如果不需要维持核心线程数量但是队列不空，那至少保持一个线程处理队列
                min = 1;
            if (workerCountOf(c) >= min) //如果线程数量大于最少数量，直接返回，否则下面至少要addWorker一个
                return; // replacement not needed
        }
        addWorker(null, false); //用户异常退出，或者线程数量小于需要维护的数量，那就add
    }
}
```

### addWorkerFailed

最开始的时候`addWorker()`时产生thread失败或线程已经提前启动时的处理.

```java
/**
 * 回滚worker创建
 */
private void addWorkerFailed(Worker w) {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        if (w != null)
            workers.remove(w); // 1.有可能已经加入线程池，remove
        decrementWorkerCount(); //2.线程池数量减1
        tryTerminate(); //3.涉及线程的扣钱都有要去尝试终止线程池
    } finally {
        mainLock.unlock();
    }
}
```

### tryTerminate

在addworker失败和work处理任务失败退出都涉及到线程的扣钱，可能就剩下这一个线程，就需要关闭线程池，所以需要尝试下关闭线程池。

```java
/**
 * 尝试终止线程池
 */
final void tryTerminate() {
    for (;;) {
        int c = ctl.get();
        //线程池状态为Running\状态已经是TIDYING或TERMINATED说明已经终止了\SHUTDOWN但是队列不空还需要处理任务，不需要终止
        if (isRunning(c) ||
            runStateAtLeast(c, TIDYING) ||
            (runStateOf(c) == SHUTDOWN && ! workQueue.isEmpty()))
            return;
        // 到这里只剩下，shutdown状态队列空，Stop状态
        if (workerCountOf(c) != 0) { 
            //线程池还有线程，但是队列没有任务了，需要中断唤醒等待任务的线程（runwoker的时候首先就通过w.unlock设置线程可中断，getTask最后面的catch处理中断）
            //中断空闲线程传入的true，唤醒一个等待线程来处理就行
            interruptIdleWorkers(ONLY_ONE); 
            return;
        }
        final ReentrantLock mainLock = this.mainLock;
        mainLock.lock();
        try {
            if (ctl.compareAndSet(c, ctlOf(TIDYING, 0))) { //线程池状态转为TIDYING
                try {
                    terminated();
                } finally {
                    ctl.set(ctlOf(TERMINATED, 0)); //线程池状态转为TERMINATED
                    termination.signalAll(); //awaitTermination的termination.awaitNanos(nanos)需要signal
                }
                return;
            }
        } finally {
            mainLock.unlock();
        }
        // else retry on failed CAS
    }
}
/** 空实现，子类覆盖，最好先调用super.terminated() */
protected void terminated() { }
```

### interruptWorkers-interruptIdleWorkers

```java
/**
 * 调用worker的interruptIfStarted，中断已经start的所有线程
 */
private void interruptWorkers() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        for (Worker w : workers)
            w.interruptIfStarted();
    } finally {
        mainLock.unlock();
    }
}
/**
 * 根据参数中断一个还是所有空闲线程，注意是空闲线程，interruptWorkers这个方法，不管空闲不空闲都会中断
 */
private void interruptIdleWorkers(boolean onlyOne) {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        for (Worker w : workers) {
            Thread t = w.thread;
            if (!t.isInterrupted() && w.tryLock()) { //trylock保证是空闲的线程
                try {
                    t.interrupt();
                } catch (SecurityException ignore) {
                } finally {
                    w.unlock();
                }
            }
            if (onlyOne)
                break;
        }
    } finally {
        mainLock.unlock();
    }
}
/**
 * 还是调用上面那个有参数的方法，防止忘记true\false含义
 */
private void interruptIdleWorkers() {
    interruptIdleWorkers(false);
}
/** 中断空闲线程时只处理一个 */
private static final boolean ONLY_ONE = true;
```

注意：**interruptWorkers中断所有线程，interruptIdleWorkers是中断空闲的线程**。

## ExecutorService接口实现

### shutdown

```java
/** 1.推进状态到shutdown，不接受新任务(addworker时检查状态会控制) 2.中断所有空闲线程，会检查线程池状态和队列是否空，保证已经提交的肯定会执行*/
public void shutdown() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        checkShutdownAccess();
        advanceRunState(SHUTDOWN); //推进线程池状态
        interruptIdleWorkers(); //中断空闲的线程
        onShutdown(); // hook for ScheduledThreadPoolExecutor
    } finally {
        mainLock.unlock();
    }
    tryTerminate(); //最后线程池尝试关闭下
}
/**
 * 推进状态到targetState
 *
 * @param targetState the desired state, either SHUTDOWN or STOP
 *        (but not TIDYING or TERMINATED -- use tryTerminate for that)
 */
private void advanceRunState(int targetState) {
    for (;;) {
        int c = ctl.get();
        if (runStateAtLeast(c, targetState) ||
            ctl.compareAndSet(c, ctlOf(targetState, workerCountOf(c))))
            break;
    }
}
/** 空实现，子类覆盖*/
void onShutdown() {
}
```

### shutdownNow

```java
/** 中断所有线程，不管是执行中还是getTask等待的，返回没执行的task列表 */
public List<Runnable> shutdownNow() {
    List<Runnable> tasks;
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        checkShutdownAccess();
        advanceRunState(STOP);
        interruptWorkers(); //中断所有线程
        tasks = drainQueue(); 
    } finally {
        mainLock.unlock();
    }
    tryTerminate();
    return tasks;
}
/**
 * 从元队列删除，添加到返回队列
 */
private List<Runnable> drainQueue() {
    BlockingQueue<Runnable> q = workQueue;
    List<Runnable> taskList = new ArrayList<Runnable>();
    q.drainTo(taskList);
    if (!q.isEmpty()) {
        for (Runnable r : q.toArray(new Runnable[0])) {
            if (q.remove(r))
                taskList.add(r);
        }
    }
    return taskList;
}
```

### awaitTermination

```java
/** 之前的shutdown和shutdownnow是不等待线程池变为中断状态的，这里等待指定超时时间 */
public boolean awaitTermination(long timeout, TimeUnit unit)
    throws InterruptedException {
    long nanos = unit.toNanos(timeout);
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        for (;;) {
            if (runStateAtLeast(ctl.get(), TERMINATED))
                return true;
            if (nanos <= 0)
                return false;
            nanos = termination.awaitNanos(nanos); //tryTerminate()会termination.signalAll()
        }
    } finally {
        mainLock.unlock();
    }
}
```

### isTerminated

```java
public boolean isShutdown() {
    return ! isRunning(ctl.get());
}
/**
 * 在running和TERMINATED之间的3个状态
 */
public boolean isTerminating() {
    int c = ctl.get();
    return ! isRunning(c) && runStateLessThan(c, TERMINATED);
}
/** TERMINATED状态 */
public boolean isTerminated() {
    return runStateAtLeast(ctl.get(), TERMINATED);
}
```

## 其他辅助方法

上面看完基本线程这个类就Ok了，这里看下一些辅助方法。

### finalize

```java
/**
 * Invokes {@code shutdown} when this executor is no longer
 * referenced and it has no threads.
 */
protected void finalize() {
    shutdown(); //默认调用shutdown处理已提交的任务
}
```

### 提前启动线程

```java
/**
 * 启动一个线程
 */
public boolean prestartCoreThread() {
    return workerCountOf(ctl.get()) < corePoolSize &&
        addWorker(null, true);
}
/**
 * 确保肯定启动一个线程
 */
void ensurePrestart() {
    int wc = workerCountOf(ctl.get());
    if (wc < corePoolSize)
        addWorker(null, true);
    else if (wc == 0)
        addWorker(null, false);
}
/**
 * 启动所有核心线程
 */
public int prestartAllCoreThreads() {
    int n = 0;
    while (addWorker(null, true))
        ++n;
    return n;
}
```

其他的方法大都是get\set方法，不关心，线程池这个类还需要多看看，有些细节需要深入下，这个看懂了，才能去看其他的。
