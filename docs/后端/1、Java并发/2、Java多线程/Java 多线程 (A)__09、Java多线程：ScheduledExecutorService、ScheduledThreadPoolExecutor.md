# 09、Java多线程：ScheduledExecutorService、ScheduledThreadPoolExecutor
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/9.html
- 分类：Java并发
- 分组：Java 多线程 (A)
## ScheduledExecutorService

> public interface ScheduledExecutorService extends ExecutorService

**1、** 一个ExecutorService，可安排在给定的延迟后运行或定期执行的命令；

**2、** schedule方法使用各种延迟创建任务，并返回一个可用于取消或检查执行的任务对象；

**3、** scheduleAtFixedRate和scheduleWithFixedDelay方法创建并执行某些在取消前一直定期运行的任务；

**4、** 用Executor.execute(java.lang.Runnable)和ExecutorService的submit方法所提交的命令，通过所请求的0延迟进行安排schedule方法中允许出现0和负数延迟（但不是周期），并将这些视为一种立即执行的请求；

## 方法摘要

### ScheduledFuture schedule(Runnable command, long delay, TimeUnit unit)

> 创建并执行在给定延迟后启用的 ScheduledFuture。

### ScheduledFuture schedule(Callable callable, long delay, TimeUnit unit)

> 创建并执行在给定延迟后启用的一次性操作。

### ScheduledFuture scheduleAtFixedRate(Runnable command, long initialDelay, long period, TimeUnit unit)

> 创建并执行一个在给定初始延迟后首次启用的定期操作，后续操作具有给定的周期；也就是将在 initialDelay 后开始执行，然后在 initialDelay+period 后执行，接着在 initialDelay + 2 * period 后执行，依此类推。

### ScheduledFuture scheduleWithFixedDelay(Runnable command, long initialDelay, long delay, TimeUnit unit)

> 创建并执行一个在给定初始延迟后首次启用的定期操作，随后，在每一次执行终止和下一次执行开始之间都存在给定的延迟。

## ScheduledThreadPoolExecutor

> public class ScheduledThreadPoolExecutor extends ThreadPoolExecutor implements ScheduledExecutorService

**1、** 可另行安排在给定的延迟后运行命令，或者定期执行命令；

**2、** 需要多个辅助线程时，或者要求ThreadPoolExecutor具有额外的灵活性或功能时，此类要优于Timer；

**3、** 一旦启用已延迟的任务就执行它，但是有关何时启用，启用后何时执行则没有任何实时保证按照提交的先进先出(FIFO)顺序来启用那些被安排在同一执行时间的任务；

**4、** 此类重写AbstractExecutorService的submit方法，以生成内部对象控制每个任务的延迟和调度；

## 构造方法

```java
ScheduledThreadPoolExecutor(int corePoolSize, ThreadFactory threadFactory, RejectedExecutionHandler handler) 
```

可以自定义corePoolSize、threadFactory、handler。

corePoolSize - 池中所保存的线程数（包括空闲线程）

threadFactory - 执行程序创建新线程时使用的工厂，默认DefaultThreadFactory。

handler - 由于超出线程范围和队列容量而使执行被阻塞时所使用的处理程序，默认ThreadPoolExecutor.AbortPolicy。

ScheduledThreadPoolExecutor较ThreadPoolExecutor队列的区别是：前者只能使用DelayedWorkQueue，后者可自定义BlockingQueue。

## 方法实现

### Future submit(XX)

> 提交一个 Runnable 任务用于执行，并返回一个表示该任务的 Future。

```java
// Override AbstractExecutorService methods
public Future<?> submit(Runnable task) {
    return schedule(task, 0, TimeUnit.NANOSECONDS);
}
public <T> Future<T> submit(Runnable task, T result) {
    return schedule(Executors.callable(task, result),
                    0, TimeUnit.NANOSECONDS);
}
public <T> Future<T> submit(Callable<T> task) {
    return schedule(task, 0, TimeUnit.NANOSECONDS);
}
```

### void execute(Runnable command)

> 使用所要求的零延迟执行命令。

```java
public void execute(Runnable command) {
    if (command == null)
        throw new NullPointerException();
    schedule(command, 0, TimeUnit.NANOSECONDS);
}
```

从源码看出，submit和execute方法均由schedule(task, 0, TimeUnit.NANOSECONDS)来实现。

### shutdown

> 在以前已提交任务的执行中发起一个有序的关闭，但是不接受新任务。

```java
public void shutdown() {
    cancelUnwantedTasks();
    super.shutdown();
}
/**
 * Cancels and clears the queue of all tasks that should not be run
 * due to shutdown policy.
 */
private void cancelUnwantedTasks() {
    boolean keepDelayed = getExecuteExistingDelayedTasksAfterShutdownPolicy();
    boolean keepPeriodic = getContinueExistingPeriodicTasksAfterShutdownPolicy();
    if (!keepDelayed && !keepPeriodic)
        super.getQueue().clear();
    else if (keepDelayed || keepPeriodic) {
        Object[] entries = super.getQueue().toArray();
        for (int i = 0; i < entries.length; ++i) {
            Object e = entries[i];
            if (e instanceof RunnableScheduledFuture) {
                RunnableScheduledFuture<?> t = (RunnableScheduledFuture<?>)e;
                if (t.isPeriodic()? !keepPeriodic : !keepDelayed)
                    t.cancel(false);
            }
        }
        entries = null;
        purge();
    }
}
```

由源码看出，取消线程是利用Future.cancel特性，shutdown是调用的父类ThreadPoolExecutor.shutdown方法。

### shutdownNow

> 尝试停止所有正在执行的任务、暂停等待任务的处理，并返回等待执行的任务列表。

```java
public List<Runnable> shutdownNow() {
    return super.shutdownNow();//ThreadPoolExecutor.shutdownNow
}
```

##### ScheduledFuture schedule(Runnable command, long delay, TimeUnit unit)

```java
public ScheduledFuture<?> schedule(Runnable command,
                                   long delay,
                                   TimeUnit unit) {
    if (command == null || unit == null)
        throw new NullPointerException();
    RunnableScheduledFuture<?> t = decorateTask(command,
        new ScheduledFutureTask<Void>(command, null,
                                      triggerTime(delay, unit)));
    delayedExecute(t);
    return t;
}
```

schedule(Callable callable, long delay, TimeUnit unit)与其实现基本相同。

声明RunnableScheduledFuture由其内部类ScheduledFutureTask实现。

延迟执行的核心实现

```java
private void delayedExecute(Runnable command) {
    if (isShutdown()) {
        reject(command);//线程已关闭
        return;
    }
    if (getPoolSize() < getCorePoolSize())//运行的线程小于核心线程，开启新的线程
        prestartCoreThread();
    super.getQueue().add(command);
}
```

DelayedWorkQueue是ScheduledThreadPoolExecutor内部类，队列的核心基于无界阻塞队列DelayQueue实现。

```java
private static class DelayedWorkQueue extends AbstractCollection<Runnable> implements BlockingQueue<Runnable> {
private final DelayQueue<RunnableScheduledFuture> dq =      new  DelayQueue<RunnableScheduledFuture>();
}
```

### scheduleAtFixedRate

> 给定初始延迟后首次启用的定期操作后，以initialDelay + N * period固定周期执行任务(N>=0)。

### scheduleWithFixedDelay

> 给定初始延迟后首次启用的定期操作后，每一次执行终止和下一次执行开始之间都存在给定的延迟delay。

通俗地理解scheduleAtFixedRate到了时间就自动执行，scheduleWithFixedDelay是每一次任务执行完成后，延迟delay时间，再执行一个任务。

第一种情况若任务执行时间长，任务有可能并行，而第二种只能串行。

ScheduledThreadPoolExecutor继承ThreadPoolExecutor，只用了核心线程池，其任务队列是采用了内部类DelayedWorkQueue实现， 任务实体由内部类ScheduledFutureTask实现，其实现compareTo方法，达到内部自然排序，具有延迟或定期执行任务的特性。
