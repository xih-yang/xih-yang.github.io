# 08、Java多线程：ThreadPoolExecutor、RejectedExecutionHandler
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/8.html
- 分类：Java并发
- 分组：Java 多线程 (A)
## ThreadPoolExecutor

> public class ThreadPoolExecutor extends AbstractExecutorService

**1、** 线程池可以解决两个不同问题：由于减少了每个任务调用的开销，它们通常可以在执行大量异步任务时提供增强的性能，并且还可以提供绑定和管理资源（包括执行任务集时使用的线程）的方法；

**2、** 每个ThreadPoolExecutor还维护着一些基本的统计数据，如完成的任务数；

**3、** 一个ExecutorService，它使用可能的几个池线程之一执行每个提交的任务，通常使用Executors工厂方法配置；

## 构造方法

用给定的初始参数创建新的 ThreadPoolExecutor。

```java
ThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory, RejectedExecutionHandler handler) 
```

**构造方法参数解释：**

corePoolSize

> 池中所保存的线程数，包括空闲线程。

maximumPoolSize

> 池中允许的最大线程数。

keepAliveTime

> 当线程数大于核心时，此为终止前多余的空闲线程等待新任务的最长时间。

unit

> keepAliveTime 参数的时间单位。

workQueue

> 执行前用于保持任务的队列。此队列仅保持由 execute 方法提交的 Runnable 任务。

threadFactory

> 执行程序创建新线程时使用的工厂。
>
> 默认DefaultThreadFactory，创建普通的优先级为5且非守护的线程。

handler

> 由于超出线程范围和队列容量而使执行被阻塞时所使用的处理程序。
>
> 默认AbortPolicy，处理程序遭到拒绝将抛出运行时 RejectedExecutionException。

## 常见方法

void execute(Runnable command)

> 在将来某个时间执行给定任务。可以在新线程中或者在现有池线程中执行该任务。 如果无法将任务提交执行，或者因为此执行程序已关闭，或者因为已达到其容量，则该任务由当前 RejectedExecutionHandler 处理。

```java
public void execute(Runnable command) {
    if (command == null)
        throw new NullPointerException();
    if (poolSize >= corePoolSize || !addIfUnderCorePoolSize(command)) {
        if (runState == RUNNING && workQueue.offer(command)) {
            if (runState != RUNNING || poolSize == 0)
                ensureQueuedTaskHandled(command);
        }
        else if (!addIfUnderMaximumPoolSize(command))
            reject(command); // is shutdown or saturated
    }
}
```

其中通过Thread t = threadFactory.newThread(w)将command实例化成线程。 workers.add( new Worker(command))将command放入到HashSet workers存储的工作线程集合中，command执行完毕后 workers.remove(w);

void shutdown()

> 按过去执行已提交任务的顺序发起一个有序的关闭，但是不接受新任务。如果已经关闭，则调用没有其他作用。

```java
public void shutdown() {
	SecurityManager security = System.getSecurityManager();
	if (security != null)
            security.checkPermission(shutdownPerm);
        final ReentrantLock mainLock = this.mainLock;
        mainLock.lock();
        try {
            if (security != null) { // Check if caller can modify our threads
                for (Worker w : workers)
                    security.checkAccess(w.thread);
            }
            int state = runState;
            if (state < SHUTDOWN)
                runState = SHUTDOWN;
            try {
                for (Worker w : workers) {
                    w.interruptIfIdle();
                }
            } catch (SecurityException se) { // Try to back out
                runState = state;
                // tryTerminate() here would be a no-op
                throw se;
            }
            tryTerminate(); // Terminate now if pool and queue empty
        } finally {
            mainLock.unlock();
        }
}
```

shutdownNow

> 尝试停止所有的活动执行任务、暂停等待任务的处理，并返回等待执行的任务列表。在从此方法返回的任务队列中排空（移除）这些任务。
>
> 并不保证能够停止正在处理的活动执行任务，但是会尽力尝试。

```java
public List<Runnable> shutdownNow() {
	SecurityManager security = System.getSecurityManager();
	if (security != null)
            security.checkPermission(shutdownPerm);
        final ReentrantLock mainLock = this.mainLock;
        mainLock.lock();
        try {
            if (security != null) { // Check if caller can modify our threads
                for (Worker w : workers)
                    security.checkAccess(w.thread);
            }
            int state = runState;
            if (state < STOP)
                runState = STOP;
            try {
                for (Worker w : workers) {
                    w.interruptNow();
                }
            } catch (SecurityException se) { // Try to back out
                runState = state;
                // tryTerminate() here would be a no-op
                throw se;
            }
            List<Runnable> tasks = drainQueue();
            tryTerminate(); // Terminate now if pool and queue empty
            return tasks;
        } finally {
            mainLock.unlock();
        }
    }
```

shutdown及shutdownNow关闭任务的实现均是通过 Thread.interrupt() 取消任务，所以无法响应中断的任何任务可能永远无法终止。

poolSize与构造函数中几个参数的关系

> poolSize：当前运行的线程。

**1、** 新任务提交时，若poolSizecorePoolSize，且poolSizerunWorker()->getTask()

```java
    private Runnable getTask() {
        boolean timedOut = false; // Did the last poll() time out?
        for (;;) {
            int c = ctl.get();
            int rs = runStateOf(c);
            // Check if queue empty only if necessary.
            if (rs >= SHUTDOWN && (rs >= STOP || workQueue.isEmpty())) {
                decrementWorkerCount();
                return null;
            }
            int wc = workerCountOf(c);
            // 判断workers是否需要剔除，即是否需要保证core thread alive
            boolean timed = allowCoreThreadTimeOut || wc > corePoolSize;
            if ((wc > maximumPoolSize || (timed && timedOut))
                && (wc > 1 || workQueue.isEmpty())) {
                if (compareAndDecrementWorkerCount(c))
                    return null;
                continue;
            }
            try {
                Runnable r = timed ?
                    workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) :
                    workQueue.take();
                    //上述代码就保证了core thread是带有超时时间，还是一直阻塞等待任务
                if (r != null)
                    return r;
                timedOut = true;
            } catch (InterruptedException retry) {
                timedOut = false;
            }
        }
    }
```

## RejectedExecutionHandler

> public interface RejectedExecutionHandler

无法由ThreadPoolExecutor 执行的任务的处理程序。

```java
public interface RejectedExecutionHandler {
    /**
     * 当 execute 不能接受某个任务时，可以由 ThreadPoolExecutor 调用的方法。
     */
    void rejectedExecution(Runnable r, ThreadPoolExecutor executor);
}
```

ThreadPoolExecutor定义了四种：

**1、** ThreadPoolExecutor.AbortPolicy：拒绝并抛出RejectedExecutionException；

**2、** ThreadPoolExecutor.CallerRunsPolicy：拒绝但在调用者的线程中直接执行该任务；

**3、** ThreadPoolExecutor.DiscardPolicy：拒绝但不做任何动作；

**4、** ThreadPoolExecutor.DiscardOldestPolicy：如果执行程序尚未关闭，则位于工作队列头部的任务将被删除，然后重试执行程序（如果再次失败，则重复此过程）；
