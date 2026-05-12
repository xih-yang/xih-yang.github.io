# 03、Java多线程：Callable、Future、RunnableFuture、FutureTask
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/3.html
- 分类：Java并发
- 分组：Java 多线程 (A)
## Callable

> public interface Callable

**1、** 返回结果并且可能抛出异常的任务；

**2、** Callable接口类似于Runnable，两者都是为那些其实例可能被另一个线程执行的类设计的但是Runnable不会返回结果，并且无法抛出经过检查的异常；

**3、** Executors类包含一些从其他普通形式转换成Callable类的实用方法；

接口中定义的唯一一个方法。

```java
/**
 *计算结果，如果无法计算结果，则抛出一个异常。
 */
V call() throws Exception;
```

与FutureTask结合使用。

与Runnable区别：

**1、** 实现Callable接口能返回结果；而实现Runnable接口不能返回结果；

**2、** 实现Callable接口可抛出经过检查的异常；而实现Runnable接口不能抛出异常；

## Future

> public interface Future

**1、** Future表示异步计算的结果；

**2、** 它提供了检查计算是否完成的方法，以等待计算的完成，并获取计算的结果计算完成后只能使用get方法来获取结果，如有必要，计算完成前可以阻塞此方法取消则由cancel方法来执行还提供了其他方法，以确定任务是正常完成还是被取消了一旦计算完成，就不能再取消计算；

**3、** 如果为了可取消性而使用Future但又不提供可用的结果，则可以声明Future形式类型、并返回null作为底层任务的结果；

通俗地理解就是可以对正在执行的任务进行维护操作(取消任务、获取任务执行结果、判断任务是否已完成等)。

**接口方法**

> boolean cancel(boolean mayInterruptIfRunning)：试图取消对此任务的执行。

```java
/**
 * 如果任务已完成、或已取消，或者由于某些其他原因而无法取消，则此尝试将失败。
 * 当调用 cancel 时，如果调用成功，而此任务尚未启动，则此任务将永不运行。
 * 如果任务已经启动，则 mayInterruptIfRunning 参数确定是否应该以试图停止任务的方式来中断执行此任务的线程。
 * 此方法返回后，对 isDone() 的后续调用将始终返回 true。
 * 如果此方法返回 true，则对 isCancelled() 的后续调用将始终返回 true。
 */
boolean cancel(boolean mayInterruptIfRunning);
```

> boolean isCancelled()：如果在任务正常完成前将其取消，则返回 true。
>
> boolean isDone()：如果任务已完成，则返回 true。 可能由于正常终止、异常或取消而完成，在所有这些情况中，此方法都将返回 true。

> Vget()：如有必要，等待计算完成，然后获取其结果。

```java
/**
 * 如有必要，等待计算完成，然后获取其结果。
 *
 * @return 计算的结果
 * @throws CancellationException - 如果计算被取消
 * @throws ExecutionException    - 如果计算抛出异常
 * @throws InterruptedException  - 如果当前的线程在等待时被中断
 */
V get() throws InterruptedException, ExecutionException;
```

> Vget(long timeout, TimeUnit unit)：如有必要，最多等待为使计算完成所给定的时间之后，获取其结果（如果结果可用）。

```java
V get(long timeout, TimeUnit unit)
    throws InterruptedException, ExecutionException, TimeoutException;
```

## RunnableFuture

> public interface RunnableFuture extends Runnable, Future

**1、** 作为Runnable的Future成功执行run方法可以完成Future并允许访问其结果；

**唯一方法**

```java
/**
 *  在未被取消的情况下，将此 Future 设置为计算的结果。
 */
void run();
```

## FutureTask

> public class FutureTask implements RunnableFuture

**1、** 可取消的异步计算；

**2、** 利用开始和取消计算的方法、查询计算是否完成的方法和获取计算结果的方法，此类提供了对Future的基本实现；

**3、** 可使用FutureTask包装Callable或Runnable对象因为FutureTask实现了Runnable，所以可将FutureTask提交给Executor执行；

**4、** 仅在计算完成时才能获取结果；如果计算尚未完成，则阻塞get方法一旦计算完成，就不能再重新开始或取消计算；

**成员变量**

```java
/** Synchronization control for FutureTask */
private final Sync sync;
```

**构造方法**

```java
/**
 *  创建一个 FutureTask，一旦运行就执行给定的 Callable。
 */
public FutureTask(Callable<V> callable) {
    if (callable == null)
        throw new NullPointerException();
    sync = new Sync(callable);
}
/**
 * 创建一个 FutureTask，一旦运行就执行给定的 Runnable，并安排成功完成时 get 返回给定的结果 。  
 */
public FutureTask(Runnable runnable, V result) {
    sync = new Sync(Executors.callable(runnable, result));
}
```

**内部类Sync**

```java
private final class Sync extends AbstractQueuedSynchronizer {
    /** The underlying callable */
    private final Callable<V> callable;
    /** The result to return from get() */
    private V result;
    /** The exception to throw from get() */
    private Throwable exception;
    /**
     * The thread running task. When nulled after set/cancel, this
     * indicates that the results are accessible.  Must be
     * volatile, to ensure visibility upon completion.
     */
    private volatile Thread runner;
    Sync(Callable<V> callable) {
        this.callable = callable;
    }
}
```

**方法**

> boolean cancel(boolean mayInterruptIfRunning)：试图取消对此任务的执行。

```java
public boolean cancel(boolean mayInterruptIfRunning) {
    return sync.innerCancel(mayInterruptIfRunning);
}
/*sync.innerCancel方法*/
boolean innerCancel(boolean mayInterruptIfRunning) {
    for (;;) {
    int s = getState();//获取当前线程状态
    if (ranOrCancelled(s))//判断线程是否需要取消
        return false;
    if (compareAndSetState(s, CANCELLED))//设置线程为已取消状态
        break;
    }
        if (mayInterruptIfRunning) {//需要中断线程，中断当前线程
            Thread r = runner;
            if (r != null)
                r.interrupt();
        }
        releaseShared(0);
        done();
        return true;
    }
```

> Vget()：如有必要，等待计算完成，然后获取其结果。

```java
public V get(long timeout, TimeUnit unit)
    throws InterruptedException, ExecutionException, TimeoutException {
    return sync.innerGet(unit.toNanos(timeout));
}
/*Sync.innerGet*/
V innerGet(long nanosTimeout) throws InterruptedException, ExecutionException, TimeoutException {
    if (!tryAcquireSharedNanos(0, nanosTimeout))//判断是否超时
        throw new TimeoutException();
    if (getState() == CANCELLED)//判断线程是否已取消
        throw new CancellationException();
    if (exception != null)
        throw new ExecutionException(exception);
    return result;//返回预期指定的结果
  }
```

> boolean isCancelled()：如果在任务正常完成前将其取消，则返回 true。

```java
public boolean isCancelled() {
    return sync.innerIsCancelled();
}
boolean innerIsCancelled() {
    return getState() == CANCELLED;//判断线程状态是否已取消
}
```

> boolean isDone()：如果任务已完成，则返回 true。

```java
public boolean isDone() {
    return sync.innerIsDone();
}
boolean innerIsDone() {
    return ranOrCancelled(getState()) && runner == null;
}
```

> void run()： 除非已将此 Future 取消，否则将其设置为其计算的结果。

```java
public void run() {
    sync.innerRun();
}
void innerRun() {
    if (!compareAndSetState(0, RUNNING))//判断是否需要执行
        return;
    try {
        runner = Thread.currentThread();
        if (getState() == RUNNING) // 再次检查状态
                innerSet(callable.call());//执行任务并返回结果
        else
            releaseShared(0); // cancel
    } catch (Throwable ex) {
        innerSetException(ex);
    }
}
```

FutureTask还提供了受保护的runAndReset、set、setException方法，及默认实现不执行任何操作的done方法，便于自定义任务类。

从源码可知，FutureTask对线程的操作，都是通过内部类Sync实现的，其中通过CAS无锁操作维护线程状态，volatile Thread runner 保证当前线程任务的内存可见性，任务执行完成返回的结果存储在V result中。

**总结：**

由于FutureTask继承了Callable和Runnable，故既可作为一个Runnable直接被Thread执行，也可作为Future用来得到Callable的计算结果。

FutureTask一般配合ExecutorService来使用，也可以直接通过Thread来使用。

当调用cancel(true)方法的时候，最终执行Thread.interrupt()方法，而interrupt()方法只是设置中断标志位，如果runner处于sleep()、wait()或者join()处理中则会抛出InterruptedException异常。

FutureTask提供可得到返回结果及 protected 功能，让FutureTask扩展性增强。

Callable、Future、FutureTask关系。

FutureTask实现Future接口，可以对任务进行维护操作，包装 Callable可得到任务执行完成后计算的结果。
