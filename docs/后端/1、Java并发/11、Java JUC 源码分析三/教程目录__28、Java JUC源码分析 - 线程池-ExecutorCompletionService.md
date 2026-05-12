# 28、Java JUC源码分析 - 线程池-ExecutorCompletionService
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/28.html
- 分类：Java并发
- 分组：教程目录
之前在看AbstractExecutorService的`doInvokeAny()`时看到这样的代码：

```java
ExecutorCompletionService<T> ecs =
    new ExecutorCompletionService<T>(this);
.....
futures.add(ecs.submit(it.next()));
....
ecs.take();
....
for (Future<T> f : futures)
        f.cancel(true);
....
```

使用ExecutorCompletionService来执行提交的任务，如果有执行成功的，就可以take获取，还可以对剩下的cancel取消。

阅读javadoc，发现这个类将已经完成的任务放入队列，然后就可以通过take或poll来获取这些已经完成的任务，提供了2个常用场景的例子：

**1、** 正常的Future用法；

**2、** 就是上面doInvokeAny的使用方法：提交一组任务，只要其中有完成的返回，就可以取消其他任务；

## CompletionService

ExecutorCompletionService实现了CompletionService接口：

```java
/** 提供一种分离任务提交和获取执行结果的服务 */
public interface CompletionService<V> {
    Future<V> submit(Callable<V> task);
    Future<V> submit(Runnable task, V result);
    /** 获取一个已经完成的任务Future,没有就等待 */
    Future<V> take() throws InterruptedException;
    /** 获取一个已经完成的任务Future,没有就null */
    Future<V> poll();
    /** 获取一个已经完成的任务Future,超时获取 */
    Future<V> poll(long timeout, TimeUnit unit) throws InterruptedException;
}
```

## 源码

```java
private final Executor executor; 
private final AbstractExecutorService aes;
private final BlockingQueue<Future<V>> completionQueue; //阻塞队列，用来存放已经完成的task
/** 继承自FutureTask，实现done方法，在任务完成时将其放入阻塞队列 */
private class QueueingFuture extends FutureTask<Void> {
    QueueingFuture(RunnableFuture<V> task) {
        super(task, null);
        this.task = task;
    }
    protected void done() { completionQueue.add(task); }
    private final Future<V> task;
}
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
/** 2种构造 */
public ExecutorCompletionService(Executor executor) {
    if (executor == null)
        throw new NullPointerException();
    this.executor = executor;
    this.aes = (executor instanceof AbstractExecutorService) ?
        (AbstractExecutorService) executor : null;
    this.completionQueue = new LinkedBlockingQueue<Future<V>>();
}
public ExecutorCompletionService(Executor executor,
                                 BlockingQueue<Future<V>> completionQueue) {
    if (executor == null || completionQueue == null)
        throw new NullPointerException();
    this.executor = executor;
    this.aes = (executor instanceof AbstractExecutorService) ?
        (AbstractExecutorService) executor : null;
    this.completionQueue = completionQueue;
}
```

**1、** QueueingFuture继承自FutureTask，并且实现了`done()`方法，之前看FutureTask源码时了解到这个方法在`finishCompletion()`时被调用，而`finishCompletion()`在任务正常完成、异常、中断取消都会调用ExecutorCompletionService也正是通过在任务完成时将其放入一个阻塞队列completionQueue来实现基本功能；

**2、** 构造传入executor用于执行后面提交的任务；

```java
/** 2个submit方法 */
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
/** 下面3个从阻塞队列获取执行完成的Future */
public Future<V> take() throws InterruptedException {
    return completionQueue.take();
}
public Future<V> poll() {
    return completionQueue.poll();
}
public Future<V> poll(long timeout, TimeUnit unit)
        throws InterruptedException {
    return completionQueue.poll(timeout, unit);
}
```

这个有点简单，看过一遍，记住2点：

**1、** 维护一个阻塞队列；

**2、** 内部类实现FutureTask，实现`done()`方法，在任务完成时将其放入阻塞队列，后面就可以从阻塞队列take、poll；

结束吧！
