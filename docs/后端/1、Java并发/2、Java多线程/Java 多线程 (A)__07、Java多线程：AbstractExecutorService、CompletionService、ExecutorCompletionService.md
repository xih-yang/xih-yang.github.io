# 07、Java多线程：AbstractExecutorService、CompletionService、ExecutorCompletionService
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/7.html
- 分类：Java并发
- 分组：Java 多线程 (A)
## AbstractExecutorService

> public abstract class AbstractExecutorService implements ExecutorService

**1、** 提供ExecutorService执行方法的默认实现；

**2、** 此类使用newTaskFor返回的RunnableFuture实现submit、invokeAny和invokeAll方法，默认情况下，RunnableFuture是此包中提供的FutureTask类；

## 方法

RunnableFuture newTaskFor(Runnable runnable, T value)

> 为给定可调用任务返回一个 RunnableFuture。

```java
protected <T> RunnableFuture<T> newTaskFor(Runnable runnable, T value) {
    return new FutureTask<T>(runnable, value);
}
```

RunnableFuture newTaskFor(Callable callable)

> 为给定可调用任务返回一个 RunnableFuture。

```java
protected <T> RunnableFuture<T> newTaskFor(Callable<T> callable) {
    return new FutureTask<T>(callable);
}
```

**FutureTask构造方法**

```java
public FutureTask(Runnable runnable, V result) {
    sync = new Sync(Executors.callable(runnable, result));
}
public FutureTask(Callable<V> callable) {
    if (callable == null)
        throw new NullPointerException();
    sync = new Sync(callable);
}
```

submit(Callable task)

> 提交一个返回值的任务用于执行，返回一个表示任务的未决结果的 Future。
>
> 三种submit方式实现。

```java
public Future<?> submit(Runnable task) {
    if (task == null) throw new NullPointerException();
    RunnableFuture<Object> ftask = newTaskFor(task, null);
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

List invokeAll(Collection`` tasks)

> 执行给定的任务，当所有任务完成时，返回保持任务状态和结果的 Future 列表。

```java
public <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
    throws InterruptedException {
    if (tasks == null)
        throw new NullPointerException();
    List<Future<T>> futures = new ArrayList<Future<T>>(tasks.size());
    boolean done = false;
    try {
        for (Callable<T> t : tasks) {
            RunnableFuture<T> f = newTaskFor(t);
            futures.add(f);
            execute(f);
        }
        for (Future<T> f : futures) {
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
        if (!done)
            for (Future<T> f : futures)
                f.cancel(true);
    }
}
```

限时等待只是在上述源码中做了超时判断。

invokeAny(Collection`` tasks)

> 执行给定的任务，如果某个任务已成功完成（也就是未抛出异常），则返回其结果。

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
/**
 * the main mechanics of invokeAny.
 */
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
        new ExecutorCompletionService<T>(this);
    // For efficiency, especially in executors with limited
    // parallelism, check to see if previously submitted tasks are
    // done before submitting more of them. This interleaving
    // plus the exception mechanics account for messiness of main
    // loop.
    try {
        // Record exceptions so that if we fail to obtain any
        // result, we can throw the last exception we got.
        ExecutionException ee = null;
        long lastTime = (timed)? System.nanoTime() : 0;
        Iterator<? extends Callable<T>> it = tasks.iterator();
        // Start one task for sure; the rest incrementally
        futures.add(ecs.submit(it.next()));
        --ntasks;
        int active = 1;
        for (;;) {
            Future<T> f = ecs.poll();
            if (f == null) {
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
            if (f != null) {
                --active;
                try {
                    return f.get();
                } catch (InterruptedException ie) {
                    throw ie;
                } catch (ExecutionException eex) {
                    ee = eex;
                } catch (RuntimeException rex) {
                    ee = new ExecutionException(rex);
                }
            }
        }
        if (ee == null)
            ee = new ExecutionException();
        throw ee;
    } finally {
        for (Future<T> f : futures)
            f.cancel(true);
    }
}
```

从源码看出，AbstractExecutorService中submit、invokeAll使用了newTaskFor来实现。

在invokeAny方法中使用了ExecutorCompletionService来判定集合中的任务是否都已执行完成。

## CompletionService

> public interface CompletionService

**1、** 将生产新的异步任务与使用已完成任务的结果分离开来的服务；

**2、** 生产者submit执行的任务使用者take已完成的任务，并按照完成这些任务的顺序处理它们的结果；

通常，CompletionService 依赖于一个单独的 Executor 来实际执行任务，在这种情况下，CompletionService 只管理一个内部完成队列。

## 方法摘要

Future poll()

> 获取并移除表示下一个已完成任务的 Future，如果不存在这样的任务，则返回 null。

Future poll(long timeout,TimeUnit unit)throws InterruptedException

> 获取并移除表示下一个已完成任务的 Future，如果目前不存在这样的任务，则将等待指定的时间（如果有必要）。

Future take() throws InterruptedException

> 获取并移除表示下一个已完成任务的 Future，如果目前不存在这样的任务，则等待。

Future submit(Runnable task, V result)

> 提交要执行的 Runnable 任务，并返回一个表示任务完成的 Future，可以提取或轮询此任务。

Future submit(Callable task)

> 提交要执行的值返回任务，并返回表示挂起的任务结果的 Future。在完成时，可能会提取或轮询此任务。

通过接口定义及解释可看出，CompletionService可以将任务应用与生产t者、消费者模式。

生产者使用 submit 提交需要执行的任务。消费者 take or poll已完成的任务，并可按照任务的完成顺序进行处理。

## ExecutorCompletionService

> public class ExecutorCompletionService implements CompletionService

**1、** 使用提供的Executor来执行任务的CompletionService；

**2、** 此类将安排那些完成时提交的任务，把它们放置在可使用take访问的队列上；

**3、** CompletionService的接口实现；

## 成员变量

```java
private final Executor executor;
private final AbstractExecutorService aes;
private final BlockingQueue<Future<V>> completionQueue;
```

默认使用LinkedBlockingQueue队列存储已完成的任务队列。

使用executor执行任务。

也可自定义BlockingQueue队列，由其构造方法决定。

```java
ExecutorCompletionService(Executor executor)
or
ExecutorCompletionService(Executor executor,
                 BlockingQueue<Future<V>> completionQueue)
```

## 方法

submit

> 提交要执行的值返回任务，并返回表示挂起的任务结果的 Future。

```java
public Future<V> submit(Callable<V> task) {
    if (task == null) throw new NullPointerException();
    RunnableFuture<V> f = newTaskFor(task);
    executor.execute(new QueueingFuture(f));
    return f;
}
public Future<V> submit(Runnable task, V result) {
    if (task == null) throw new NullPointerException();
    RunnableFuture<V> f = newTaskFor(task, result);
    executor.execute(new QueueingFuture(f));
    return f;
}
```

newTaskFor

```java
private RunnableFuture<V> newTaskFor(Callable<V> task) {
    if (aes == null)
        return new FutureTask<V>(task);
    else
        return aes.newTaskFor(task);
}
private RunnableFuture<V> newTaskFor(Runnable task, V result) {
    if (aes == null)
        return new FutureTask<V>(task, result);
    else
        return aes.newTaskFor(task, result);
}
```

**内部类QueueingFuture**

```java
private class QueueingFuture extends FutureTask<Void> {
    QueueingFuture(RunnableFuture<V> task) {
        super(task, null);
        this.task = task;
    }
    protected void done() { completionQueue.add(task); }
    private final Future<V> task;
}
```

注意其覆写了done()方法，当任务被完成或者取消时，会执行此方法，即将该任务放入已完成队列BlockingQueue中，从而等待被take。

poll

> 获取并移除表示下一个已完成任务的 Future，如果不存在这样的任务，则返回 null。

```java
public Future<V> poll() {
    return completionQueue.poll();
}
public Future<V> poll(long timeout, TimeUnit unit) throws InterruptedException {
    return completionQueue.poll(timeout, unit);
}
```

take

> 获取并移除表示下一个已完成任务的 Future，如果目前不存在这样的任务，则等待。

```java
public Future<V> take() throws InterruptedException {
    return completionQueue.take();
}
```

从源码看出，poll or take即由BlockingQueue实现，那么很容易理解poll直接获取并移除，若没有已完成任务，则可指定等待时间，否则返回null。take与前者的区别在于，当队列中没有已完成任务时，会一直等待，直到有为止。
