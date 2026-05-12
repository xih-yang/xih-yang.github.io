# 29、Java JUC源码分析 - 线程池-ScheduledThreadPoolExecutor
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/29.html
- 分类：Java并发
- 分组：教程目录
第一次看到这个还是在netty源码中，可惜netty没有坚持看完，后来在工作中，原来公司框架的esb下发消息，jms不能做到可配置的启停，后来使用这个做了个监听，配合统一配置平台完成心跳，实现在项目发布期间，可以提前停掉队列监听。

## ScheduledExecutorService

ScheduledThreadPoolExecutor实现了该接口，看下这个接口：

```java
public interface ScheduledExecutorService extends ExecutorService {
    /**
     * 在指定延迟时间后，创建和执行一个一次性的task
     */
    public ScheduledFuture<?> schedule(Runnable command,
                                       long delay, TimeUnit unit);
    /**
     * 在指定延迟时间后，创建和执行一个一次性的task
     */
    public <V> ScheduledFuture<V> schedule(Callable<V> callable,
                                           long delay, TimeUnit unit);
    /**
     * 创建一个周期性的任务，第一次执行是延迟initialDelay，后面的是initialDelay+n*period
     */
    public ScheduledFuture<?> scheduleAtFixedRate(Runnable command,
                                                  long initialDelay,
                                                  long period,
                                                  TimeUnit unit);
    /**
     * 创建一个周期性的任务，第一次执行是延迟initialDelay，后面的是延迟时间是前一次任务执行完的时间+period
     */
    public ScheduledFuture<?> scheduleWithFixedDelay(Runnable command,
                                                     long initialDelay,
                                                     long delay,
                                                     TimeUnit unit);
}
```

注意`scheduleAtFixedRate()`和`scheduleWithFixedDelay()`的区别，javadoc里有个用法，改了下写了个demo：

```java
public class BeeperControl {
    private final static ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    public static void main(String[] args) {
        scheduler.scheduleAtFixedRate(new Runnable() {
            @SuppressWarnings("static-access")
            public void run() {
                System.out.println(formatDate2Str(new Date()));
                try {
                    Thread.currentThread().sleep(5000);
                } catch (Exception e) {
                }
                System.out.println("beep");
            }
        }, 3, 3, SECONDS);
    }
    public static final String C_TIME_PATTON_DEFAULT = "yyyy-MM-dd HH:mm:ss";
    public static String formatDate2Str(Date date) {
        SimpleDateFormat sdf = new SimpleDateFormat(C_TIME_PATTON_DEFAULT);
        return sdf.format(date);
    }
}
```

那个sleep使用来模拟task运行耗时的，可以注释掉，在scheduleAtFixedRate和scheduleWithFixedDelay间切换方法，体会下区别，这里不贴console的图了。

scheduleWithFixedDelay的延迟是上一次任务完成时长加上给定的delay，scheduleAtFixedRate如果task运行超过delay，那么会导致下一个task也推迟，不超过就正常的固定周期。

## 基本结构和构造

```java
/**
 * shutdown的时候继续还是关闭周期性任务.
 */
private volatile boolean continueExistingPeriodicTasksAfterShutdown;
/**
 * shutdown的时候继续还是关闭非周期任务.
 */
private volatile boolean executeExistingDelayedTasksAfterShutdown = true;
/**
 * task取消时是否从队列移除
 */
private volatile boolean removeOnCancel = false;
/**
 * 用来生成一个序列，task入队compare时比较，如果2个task延迟一样，可以用这个序列来比较
 */
private static final AtomicLong sequencer = new AtomicLong(0);
/**
 * 当前时间
 */
final long now() {
    return System.nanoTime();
}
/**
 * 4个构造创建Scheduled
 */
public ScheduledThreadPoolExecutor(int corePoolSize) {
    super(corePoolSize, Integer.MAX_VALUE, 0, TimeUnit.NANOSECONDS,
          new DelayedWorkQueue());
}
public ScheduledThreadPoolExecutor(int corePoolSize,
                                   ThreadFactory threadFactory) {
    super(corePoolSize, Integer.MAX_VALUE, 0, TimeUnit.NANOSECONDS,
          new DelayedWorkQueue(), threadFactory);
}
public ScheduledThreadPoolExecutor(int corePoolSize,
                                   RejectedExecutionHandler handler) {
    super(corePoolSize, Integer.MAX_VALUE, 0, TimeUnit.NANOSECONDS,
          new DelayedWorkQueue(), handler);
}
public ScheduledThreadPoolExecutor(int corePoolSize,
                                   ThreadFactory threadFactory,
                                   RejectedExecutionHandler handler) {
    super(corePoolSize, Integer.MAX_VALUE, 0, TimeUnit.NANOSECONDS,
          new DelayedWorkQueue(), threadFactory, handler);
}
```

ScheduledThreadPoolExecutor继承了ThreadPoolExecutor，没有什么特殊的地方，4个构造super调用，主要是阻塞队列用了`DelayedWorkQueue`内部类，这个类似DelayQueue，可以当成一样的，我看的是1.7版本的JUC，之前版本的这个类的队列直接就是内部维护了一个DelayQueue。这个类还有一个ScheduledFutureTask内部类。

## 流程

一般创建schedule后，就可能会调用接口ScheduledExecutorService的4个方法了，分别看下实现：

### 4个schedule调度

```java
/** 2个一次性调度 */
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
public <V> ScheduledFuture<V> schedule(Callable<V> callable,
                                       long delay,
                                       TimeUnit unit) {
    if (callable == null || unit == null)
        throw new NullPointerException();
    RunnableScheduledFuture<V> t = decorateTask(callable,
        new ScheduledFutureTask<V>(callable,
                                   triggerTime(delay, unit)));
    delayedExecute(t);
    return t;
}
/** 固定频率调度 */
public ScheduledFuture<?> scheduleAtFixedRate(Runnable command,
                                              long initialDelay,
                                              long period,
                                              TimeUnit unit) {
    if (command == null || unit == null)
        throw new NullPointerException();
    if (period <= 0)
        throw new IllegalArgumentException();
    ScheduledFutureTask<Void> sft =
        new ScheduledFutureTask<Void>(command,
                                      null,
                                      triggerTime(initialDelay, unit),
                                      unit.toNanos(period));
    RunnableScheduledFuture<Void> t = decorateTask(command, sft);
    sft.outerTask = t;
    delayedExecute(t);
    return t;
}
/** 固定延迟 */
public ScheduledFuture<?> scheduleWithFixedDelay(Runnable command,
                                                 long initialDelay,
                                                 long delay,
                                                 TimeUnit unit) {
    if (command == null || unit == null)
        throw new NullPointerException();
    if (delay <= 0)
        throw new IllegalArgumentException();
    ScheduledFutureTask<Void> sft =
        new ScheduledFutureTask<Void>(command,
                                      null,
                                      triggerTime(initialDelay, unit),
                                      unit.toNanos(-delay));
    RunnableScheduledFuture<Void> t = decorateTask(command, sft);
    sft.outerTask = t;
    delayedExecute(t);
    return t;
}
```

这4个调度方法都是大体流程都类似：

**1、** 先计算出初次执行的延迟delay，decorateTask；

**2、** 封装ScheduleFutureTask；

**3、** delayedExecute执行；

先看下`triggerTime()`方法：

```java
/** 获取下次触发时间*/
private long triggerTime(long delay, TimeUnit unit) {
    return triggerTime(unit.toNanos((delay < 0) ? 0 : delay));
}
/** 这里触发时间加上now了 */
long triggerTime(long delay) {
    return now() +
        ((delay < (Long.MAX_VALUE >> 1)) ? delay : overflowFree(delay));
}
/** 控制溢出，使2个task建的延迟不会超过maxvalue，要不然入队compare时会出现异常，有可能本来排在后面的compare相减小于0,反而排在前面了 */
private long overflowFree(long delay) {
    Delayed head = (Delayed) super.getQueue().peek();
    if (head != null) {
        long headDelay = head.getDelay(TimeUnit.NANOSECONDS);
        if (headDelay < 0 && (delay - headDelay < 0)) //如果溢出为负数，就直接加上这个值，控制在maxvalue内
            delay = Long.MAX_VALUE + headDelay;
    }
    return delay;
}
```

```java
/** 给你机会在执行前修改下task，默认什么都不做 */
protected <V> RunnableScheduledFuture<V> decorateTask(
    Runnable runnable, RunnableScheduledFuture<V> task) {
    return task;
}
```

ScheduledFutureTask类过会说，先看下延迟执行的方法`delayedExecute()`:

```java
/**
 * 调度的主要执行方法
 */
private void delayedExecute(RunnableScheduledFuture<?> task) {
    if (isShutdown()) //如果已经关闭，调用reject
        reject(task);
    else {
        super.getQueue().add(task); //首先加入队列
        /** 再次判断线程池状态和该状态下，任务是否能执行，不能就remove，然后task取消 */
        if (isShutdown() &&
            !canRunInCurrentRunState(task.isPeriodic()) &&
            remove(task))
            task.cancel(false);
        else
            ensurePrestart(); // 如果可以运行，那就调用父类方法确保有一个线程运行
    }
}
/**
 * 在running或shutdown状态下，周期或非周期任务是否能能运行
 */
boolean canRunInCurrentRunState(boolean periodic) {
    return isRunningOrShutdown(periodic ?
                               continueExistingPeriodicTasksAfterShutdown :
                               executeExistingDelayedTasksAfterShutdown);
}
ThreadPoolExecutor:isRunningOrShutdown
/**
 * running或shutdown状态下是否还能运行，running状态肯定都能运行，shutdown状态还是取决于入参
 */
final boolean isRunningOrShutdown(boolean shutdownOK) {
    int rs = runStateOf(ctl.get());
    return rs == RUNNING || (rs == SHUTDOWN && shutdownOK);
}
```

`delayedExecute()`流程：

**1、** 如果已经关闭，那就reject，否则转2；

**2、** 添加任务到队列；

**3、** 再次判断线程池状态，状态为running转4，如果关闭，检查在此状态下，任务是否还要继续，如果shutdown状态还要继续，转4，否则，remove任务，失败转4，成功就调用task的cancel方法；

**4、** 调用父类方法`ensurePrestart()`确保线程池有一个运行线程；

跟ThreadPoolExecutor的执行有点不一样，ThreadPoolExecutor是先core添加，core满了就入队列，入不了队列就去addworker加大线程池大小，而schedule则直接入队列，再确保线程处理task。

### ScheduledFutureTask

看了下图左边的继承关系，主要是下面2个注意点：

```java
public interface Delayed extends Comparable<Delayed> {
    /**
     * 返回剩余的延期时长
     */
    long getDelay(TimeUnit unit);
}
public interface RunnableScheduledFuture<V> extends RunnableFuture<V>, ScheduledFuture<V> {
    /**
     * 是否是周期性任务
     */
    boolean isPeriodic();
}
```

看下task的实现：

```java
private class ScheduledFutureTask<V>
        extends FutureTask<V> implements RunnableScheduledFuture<V> {
    /** 序列号，compare时如果delay一样就比较这个，决定谁先入队 */
    private final long sequenceNumber;
    /** 任务执行的触发时间 */
    private long time;
    /**
     * 入参赋值，0表示非周期性任务，大于0的表示规定周期的任务，小于0表示规定延迟的任务
     */
    private final long period;
    /** 首次执行后，再次入队的任务 */
    RunnableScheduledFuture<V> outerTask = this;
    /**
     * 入队的位置索引
     */
    int heapIndex;
    /**
     * 3个构造，2个创建非周期的任务，一个创建周期性任务
     */
    ScheduledFutureTask(Runnable r, V result, long ns) {
        super(r, result);
        this.time = ns;
        this.period = 0;
        this.sequenceNumber = sequencer.getAndIncrement();
    }
    ScheduledFutureTask(Runnable r, V result, long ns, long period) {
        super(r, result);
        this.time = ns;
        this.period = period;
        this.sequenceNumber = sequencer.getAndIncrement();
    }
    ScheduledFutureTask(Callable<V> callable, long ns) {
        super(callable);
        this.time = ns;
        this.period = 0;
        this.sequenceNumber = sequencer.getAndIncrement();
    }
    /** Delayed接口实现，获取剩余延迟 */
    public long getDelay(TimeUnit unit) {
        return unit.convert(time - now(), TimeUnit.NANOSECONDS);
    }
    /** 入队的时候判断用 */
    public int compareTo(Delayed other) {
        if (other == this) // compare zero ONLY if same object
            return 0;
        if (other instanceof ScheduledFutureTask) {
            ScheduledFutureTask<?> x = (ScheduledFutureTask<?>)other;
            long diff = time - x.time;
            if (diff < 0)
                return -1;
            else if (diff > 0)
                return 1;
            else if (sequenceNumber < x.sequenceNumber) //这里在延迟一样的时候判断了序列号来决定
                return -1;
            else
                return 1;
        }
        long d = (getDelay(TimeUnit.NANOSECONDS) -
                  other.getDelay(TimeUnit.NANOSECONDS));
        return (d == 0) ? 0 : ((d < 0) ? -1 : 1);
    }
    /**
     * 0为非周期性，非0就是周期性任务
     */
    public boolean isPeriodic() {
        return period != 0;
    }
    /**
     * 周期性任务设置下次触发时间
     */
    private void setNextRunTime() {
        long p = period;
        /** 这里也看出来规定周期跟固定延迟的差别了，规定周期，直接time加延迟 */
        if (p > 0) 
            time += p;
        else
            time = triggerTime(-p); //固定延迟加上了now()当前时间，计算了任务运行的耗时
    }
    public boolean cancel(boolean mayInterruptIfRunning) {
        boolean cancelled = super.cancel(mayInterruptIfRunning); //先调用FutureTask的cancel
        if (cancelled && removeOnCancel && heapIndex >= 0) //父类取消Ok，然后判断参数是否从队列remove
            remove(this); //调用了ThreadPoolExecutor的remove
        return cancelled;
    }
    /**
     * 最重要的方法了，处理周期性任务
     */
    public void run() {
        boolean periodic = isPeriodic();
        if (!canRunInCurrentRunState(periodic)) //当前状态下是否能运行task
            cancel(false);
        else if (!periodic)
            ScheduledFutureTask.super.run(); //非周期性任务，直接调用futuretask来处理非周期性任务
        else if (ScheduledFutureTask.super.runAndReset()) { //调用runandreset先执行一次，runAndReset是没有result设置的
            setNextRunTime(); //设置下次触发时间
            reExecutePeriodic(outerTask); //重新执行周期性任务
        }
    }
}
```

最重要的肯定是run方法了：

**1、** 首先判当前状态下是否能运行该任务，可以就继续，不行就cancel；

**2、** 非周期性任务直接父类run执行；

**3、** 周期性任务runAndReset，然后设置下次触发时间，重新执行；

看下`reExecutePeriodic()`方法：

```java
/** 跟delayedExecute方法很像，入队然后确保有线程运行 */
void reExecutePeriodic(RunnableScheduledFuture<?> task) {
    if (canRunInCurrentRunState(true)) {
        super.getQueue().add(task);
        if (!canRunInCurrentRunState(true) && remove(task))
            task.cancel(false);
        else
            ensurePrestart();
    }
}
```

### 接口的几个实现方法

Executor接口的execute和ExecutorService的submit：

```java
/** 调用schedule方法，delay为0，没有延迟 */
public void execute(Runnable command) {
    schedule(command, 0, TimeUnit.NANOSECONDS);
}
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

都是调用schedule方法，delay为0。

还有对ExecutorService的shutdown和shutdownNow都是对父类的调用，pass。

对continueExistingPeriodicTasksAfterShutdown、executeExistingDelayedTasksAfterShutdown 、removeOnCancel 的get方法pass，看其中continueExistingPeriodicTasksAfterShutdown一个set方法：

```java
public void setContinueExistingPeriodicTasksAfterShutdownPolicy(boolean value) {
    continueExistingPeriodicTasksAfterShutdown = value;
    if (!value && isShutdown())
        onShutdown();
}
```

因为有2个参数存在，所以这里实现了父类的`onShutdown()`方法，在父类ThreadPoolExecutor中当调用`shutdown()`关闭线程池时给了一个空方法`onShutdown()`，这里调度做了实现：

```java
@Override void onShutdown() {
    BlockingQueue<Runnable> q = super.getQueue();
    /** 获取2个策略 */
    boolean keepDelayed =
        getExecuteExistingDelayedTasksAfterShutdownPolicy();
    boolean keepPeriodic =
        getContinueExistingPeriodicTasksAfterShutdownPolicy();
    /** 如果都是不执行，那就task.cancel，然后情况队列 */
    if (!keepDelayed && !keepPeriodic) {
        for (Object e : q.toArray())
            if (e instanceof RunnableScheduledFuture<?>)
                ((RunnableScheduledFuture<?>) e).cancel(false);
        q.clear();
    }
    else {
        // Traverse snapshot to avoid iterator exceptions
        for (Object e : q.toArray()) {
            if (e instanceof RunnableScheduledFuture) {
                RunnableScheduledFuture<?> t =
                    (RunnableScheduledFuture<?>)e;
                //根据任务时周期还是非周期，看使用哪种策略，如果都不取消，再检查下任务是否已经取消
                if ((t.isPeriodic() ? !keepPeriodic : !keepDelayed) ||
                    t.isCancelled()) { // also remove if already cancelled
                    if (q.remove(t))
                        t.cancel(false);
                }
            }
        }
    }
    tryTerminate();
}
```

### DelayedWorkQueue

**1、** 7版本之前的DelayWorkerQueue是内部直接维护一个DelayQueue，由DelayQueue来实现入队出队，之前看过DelayQueue内部又维护一个优先级的PriorityQueue队列，估计大神觉得这样看起来不爽，1.7后干脆调度内部直接实现一个内部类DelayedWorkQueue，实现这2个功能；

其实现原理跟PriorityQueue基本一致，有兴趣的可以先去看下PriorityQueue的源码分析。
