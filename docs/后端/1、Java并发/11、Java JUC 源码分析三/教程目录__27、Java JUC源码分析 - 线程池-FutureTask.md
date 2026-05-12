# 27、Java JUC源码分析 - 线程池-FutureTask
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/27.html
- 分类：Java并发
- 分组：教程目录
在前一篇ThreadPoolExecutor学习时，在AbstractExecutorService代码重看到submit一个任务时，利用FutureTask的来封装提交的任务。这也应该是FutureTask最正常的使用吧。

如果对Future不了解的，有本书《java多线程设计模式》，真心是本好书，只是翻译的比较呵呵，里面讲解了很多多线程模式，主从、pc、Future等。

## 结构

```java
/**
 * 存在的状态变换
 * NEW -> COMPLETING -> NORMAL
 * NEW -> COMPLETING -> EXCEPTIONAL
 * NEW -> CANCELLED
 * NEW -> INTERRUPTING -> INTERRUPTED
 */
private volatile int state;
private static final int NEW          = 0;
private static final int COMPLETING   = 1;
private static final int NORMAL       = 2;
private static final int EXCEPTIONAL  = 3;
private static final int CANCELLED    = 4;
private static final int INTERRUPTING = 5;
private static final int INTERRUPTED  = 6;
/** 构造赋值，要执行的任务 */
private Callable<V> callable;
/** get方法返回值，返回执行结果或者异常 */
private Object outcome; // non-volatile, protected by state reads/writes
/** 运行callable的线程 */
private volatile Thread runner;
/** outcome的等待栈（单向链表结构） */
private volatile WaitNode waiters;
/** 单向链表结构 */
static final class WaitNode {
    volatile Thread thread;
    volatile WaitNode next;
    WaitNode() { thread = Thread.currentThread(); }
}
/** 2种构造，state写在后，后面使用的时候先读state，再读callable，volatile语义保证可见性，infoQ和并发网上各有一篇文章讲volatile语义的，可以看下 */
public FutureTask(Callable<V> callable) {
    if (callable == null)
        throw new NullPointerException();
    this.callable = callable;
    this.state = NEW;       // ensure visibility of callable
}
public FutureTask(Runnable runnable, V result) {
    this.callable = Executors.callable(runnable, result);
    this.state = NEW;       // ensure visibility of callable
}
```

内部结构，没有太多的东西，一个volatile语义的state标识状态，一个waitNode链表维护所有等待节点，最重要的是volatile的语义。

在state之前还有段英文解释为什么放弃之前版本使用的AQS:

```java
    /*
     * Revision notes: This differs from previous versions of this
     * class that relied on AbstractQueuedSynchronizer, mainly to
     * avoid surprising users about retaining interrupt status during
     * cancellation races. Sync control in the current design relies
     * on a "state" field updated via CAS to track completion, along
     * with a simple Treiber stack to hold waiting threads.
     *
     * Style note: As usual, we bypass overhead of using
     * AtomicXFieldUpdaters and instead directly use Unsafe intrinsics.
     */
```

之前版本使用AQS会出现cancel(true)问题，我看的代码是1.7的，后来找了之前版本的代码，最主要的原因是因为`innerCancel()`方法中的一段代码：

```java
innerCancel:
----
Thread thread = runner;
if(thread != null)
    thread.interrupt();
---
```

运行如下代码：

```java
        ExecutorService executor = Executors.newFixedThreadPool(1);
        executor.submit(new Task()).cancel(true);
        executor.submit(new Task());
```

假如第一个submit运行，然后cancel的时候运气不好，获取到runner后发生线程切换，executor执行第二个submit，然后又切换回去了，cancel代码继续运行，就会到thread.interrupt();这一句，这样再切换第二个task的任务的时候，就会发生中断。具体可以看参考里面的那个bug解释。

## 核心方法

先看下FutureTask的运行的基本流程：

**1、** submit一个task，获的返回的Future：提交task后，就是ThreadPoolExecutor的那一套流程addworker-runwork-gettask-task.run，最后会到提交的task的`run()`方法；

**2、** 通过Future的`get()`获取执行的结果；

**3、** 也可以`cancel()`方法取消未执行的task；

### run

```java
public void run() {
    /** 没有运行就设置runner */ 
    if (state != NEW ||
        !UNSAFE.compareAndSwapObject(this, runnerOffset,
                                     null, Thread.currentThread()))
        return;
    try {
        Callable<V> c = callable;
        if (c != null && state == NEW) {
            V result;
            boolean ran;
            try {
                result = c.call();
                ran = true;
            } catch (Throwable ex) {
                result = null;
                ran = false;
                setException(ex); //异常结束
            }
            if (ran)
                set(result); //正常结束
        }
    } finally {
        //在上面set或setException中会设置state状态，这里再设置runner为null，
        //2个顺序颠倒，会出现state还未转换到下一个状态，结果runner为空，如果这时有调用run方法，就会有并发问题
        runner = null; 
        // state must be re-read after nulling runner to prevent
        // leaked interrupts
        int s = state;//这里处理可能有cancel产生中断
        if (s >= INTERRUPTING)
            handlePossibleCancellationInterrupt(s);
    }
}
/** run正常结束时不推进状态，，不设置返回结果，这样就可以多次运行 */
protected boolean runAndReset() {
    if (state != NEW ||
        !UNSAFE.compareAndSwapObject(this, runnerOffset,
                                     null, Thread.currentThread()))
        return false;
    boolean ran = false;
    int s = state;
    try {
        Callable<V> c = callable;
        if (c != null && s == NEW) {
            try {
                c.call(); // don't set result
                ran = true;
            } catch (Throwable ex) {
                setException(ex);
            }
        }
    } finally {
        // runner must be non-null until state is settled to
        // prevent concurrent calls to run()
        runner = null;
        // state must be re-read after nulling runner to prevent
        // leaked interrupts
        s = state;
        if (s >= INTERRUPTING)
            handlePossibleCancellationInterrupt(s);
    }
    return ran && s == NEW;
}
```

`run()`方法涉及的状态变换。

**1、** 正常结束:推进状态NEW->COMPLETING->NORMAL，然后unpark所有等待线程：；

```java
/** 状态NEW-COMPLETING-NORMAL */
protected void set(V v) {
    if (UNSAFE.compareAndSwapInt(this, stateOffset, NEW, COMPLETING)) {
        outcome = v;
        UNSAFE.putOrderedInt(this, stateOffset, NORMAL); 
        finishCompletion(); //unpark所有等待节点
    }
}
/** unpark所有等待节点 */
private void finishCompletion() {
    // assert state > COMPLETING;
    for (WaitNode q; (q = waiters) != null;) {
        if (UNSAFE.compareAndSwapObject(this, waitersOffset, q, null)) {
            for (;;) {
                Thread t = q.thread;
                if (t != null) {
                    q.thread = null;
                    LockSupport.unpark(t);  //unpark所有等待
                }
                WaitNode next = q.next;
                if (next == null)
                    break;
                q.next = null; // unlink to help gc
                q = next;
            }
            break;
        }
    }
    done(); //空，子类实现
    callable = null;        // to reduce footprint
}
```

**1、** task.run有异常产生，推进状态NEW->COMPLETING->EXCEPTIONAL，唤醒等待线程：；

```java
protected void setException(Throwable t) {
    if (UNSAFE.compareAndSwapInt(this, stateOffset, NEW, COMPLETING)) {
        outcome = t; //这里将异常返回，get时获取到异常
        UNSAFE.putOrderedInt(this, stateOffset, EXCEPTIONAL); // final state
        finishCompletion();
    }
}
```

**1、** 处理可能由`cancel(true)`产生的中断，保证这个中断一定会在run或runAndReset方法中会被处理：；

```java
/** 确保由cancel(true)产生的中断一定会在run或runandreset中处理 */
private void handlePossibleCancellationInterrupt(int s) {
    // 如果状态为INTERRUPTING，那肯定是有cancel(true)在处理了，那就yield
    if (s == INTERRUPTING)
        while (state == INTERRUPTING)
            Thread.yield(); // wait out pending interrupt
    // assert state == INTERRUPTED;
    // 这里没办法区分中断来自cancel还是外部产生，没有清除中断状态
    //
    // Thread.interrupted();
}
```

### cancel

先看`cancel()`再看`get()`方法：

```java
public boolean cancel(boolean mayInterruptIfRunning) {
    if (state != NEW) //如果已经运行，不能取消
        return false;
    if (mayInterruptIfRunning) { //容许中断，那就中断
        if (!UNSAFE.compareAndSwapInt(this, stateOffset, NEW, INTERRUPTING))
            return false;
        Thread t = runner;
        if (t != null)
            t.interrupt(); //中断
        UNSAFE.putOrderedInt(this, stateOffset, INTERRUPTED); //  推荐状态到最终状态
    }
    else if (!UNSAFE.compareAndSwapInt(this, stateOffset, NEW, CANCELLED)) //取消
        return false;
    finishCompletion();
    return true;
}
```

2种状态变换：

**1、** 容许中断：NEW->INTERRUPTING->INTERRUPTED；

**2、** 不容许中断：NEW->CANCELLED；

所有的最终状态时都会`finishCompletion()`unpark等待线程。

### get

```java
public V get() throws InterruptedException, ExecutionException {
    int s = state;
    if (s <= COMPLETING) //如果任务还未运行或者运行中，那就等
        s = awaitDone(false, 0L);
    return report(s); //根据状态返回
}
/** get超时等待 */
public V get(long timeout, TimeUnit unit)
    throws InterruptedException, ExecutionException, TimeoutException {
    if (unit == null)
        throw new NullPointerException();
    int s = state;
    if (s <= COMPLETING &&
        (s = awaitDone(true, unit.toNanos(timeout))) <= COMPLETING)
        throw new TimeoutException(); //超时后还未到最终状态那就timeout异常
    return report(s);
}
/** 根据状态返回 */
private V report(int s) throws ExecutionException {
    Object x = outcome;
    if (s == NORMAL)
        return (V)x;
    if (s >= CANCELLED)
        throw new CancellationException();
    throw new ExecutionException((Throwable)x);
}
```

`get()`思路还是挺简单的，如果还没到最终状态，那就加入链表等待(之前说过到最终状态时会调用finishCompletion),否则就根据状态返回。

### awaitDone

```java
private int awaitDone(boolean timed, long nanos)
    throws InterruptedException {
    final long deadline = timed ? System.nanoTime() + nanos : 0L;
    WaitNode q = null;
    boolean queued = false;
    for (;;) {
        if (Thread.interrupted()) {
            //如果线程中断，那就remove节点，抛出中断异常
            removeWaiter(q);
            throw new InterruptedException();
        }
        int s = state;
        if (s > COMPLETING) { //有结果了，那就返回状态
            if (q != null)
                q.thread = null; 
            return s;
        }
        else if (s == COMPLETING) // cannot time out yet
            Thread.yield();
        else if (q == null)
            q = new WaitNode(); //一般会new一个节点
        else if (!queued)
            queued = UNSAFE.compareAndSwapObject(this, waitersOffset,
                                                 q.next = waiters, q); //加入链表
        else if (timed) { //看是否需要等待超时控制
            nanos = deadline - System.nanoTime();
            if (nanos <= 0L) {
                removeWaiter(q);
                return state;
            }
            LockSupport.parkNanos(this, nanos);
        }
        else
            LockSupport.park(this);
    }
}
/** 超时或线程中断时移除节点 */
private void removeWaiter(WaitNode node) {
    if (node != null) {
        node.thread = null;
        retry:
        for (;;) {          // restart on removeWaiter race
            for (WaitNode pred = null, q = waiters, s; q != null; q = s) {
                s = q.next;
                if (q.thread != null)
                    pred = q;
                else if (pred != null) {
                    pred.next = s;
                    if (pred.thread == null) // check for race
                        continue retry;
                }
                else if (!UNSAFE.compareAndSwapObject(this, waitersOffset,
                                                      q, s))
                    continue retry;
            }
            break;
        }
    }
}
```

### 其他方法

```java
public boolean isCancelled() {
    return state >= CANCELLED;
}
public boolean isDone() {
    return state != NEW;
}
/** finishCompletion方法调用，可以用来处理收尾 */
protected void done() { }
```

## 总结

最主要的应该还是通过state标识各种运行状态吧，其他的都是Future这种模式本身的特性实现。

## 参考

**1、**[http://www.infoq.com/cn/articles/java-memory-model-4/](http://www.infoq.com/cn/articles/java-memory-model-4/)深入理解Java内存模型（四）——volatile；

**2、**[http://bugs.java.com/bugdatabase/view_bug.do?bug_id=8016247](http://bugs.java.com/bugdatabase/view_bug.do?bug_id=8016247)以前版本使用aqs时的并发bug；
