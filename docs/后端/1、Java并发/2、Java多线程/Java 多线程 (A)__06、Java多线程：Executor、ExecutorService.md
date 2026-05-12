# 06、Java多线程：Executor、ExecutorService
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/6.html
- 分类：Java并发
- 分组：Java 多线程 (A)
## Executor

> public interface Executor

**1、** 执行已提交的Runnable任务的对象；

**2、** 此接口提供一种将任务提交与每个任务将如何运行的机制（包括线程使用的细节、调度等）分离开来的方法；

**3、** 内存一致性效果：线程中将Runnable对象提交到Executor之前的操作happen-before其执行开始（可能在另一个线程中）；

通俗地理解是线程的提交与如何执行分离，执行已提交的 Runnable 任务的对象即可对已提交的线程任务进行自定义操作。

```java
public interface Executor {
    /**
     * 在未来某个时间执行给定的命令。该命令可能在新的线程、已入池的线程或者正调用的线程中执行，这由 Executor 实现决定。
     */
    void execute(Runnable command);
}
```

## ExecutorService

> public interface ExecutorService extends Executor

**1、** 提供了管理终止的方法，以及可为跟踪一个或多个异步任务执行状况而生成Future的方法；

**2、** 可以关闭ExecutorService，这将导致其拒绝新任务；

**3、** 提供两个方法来关闭ExecutorServiceshutdown()方法在终止前允许执行以前提交的任务，而shutdownNow()方法阻止等待任务启动并试图停止当前正在执行的任务；

**4、** 内存一致性效果：线程中向ExecutorService提交Runnable或Callable任务之前的操作happen-before由该任务所提取的所有操作，后者依次happen-before通过Future.get()获取的结果；

## 方法摘要

void shutdown()

> 启动一次顺序关闭，执行以前提交的任务，但不接受新任务。如果已经关闭，则调用没有其他作用。

List shutdownNow()

> 试图停止所有正在执行的活动任务，暂停处理正在等待的任务，并返回等待执行的任务列表。
>
> 无法保证能够停止正在处理的活动执行任务，但是会尽力尝试。例如，通过 Thread.interrupt() 来取消典型的实现，所以任何任务无法响应中断都可能永远无法终止。

boolean isShutdown()

> 如果此执行程序已关闭，则返回 true。

boolean isTerminated()

> 如果关闭后所有任务都已完成，则返回 true。注意，除非首先调用 shutdown 或 shutdownNow，否则 isTerminated 永不为 true。

boolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException

> 请求关闭、发生超时或者当前线程中断，无论哪一个首先发生之后，都将导致阻塞，直到所有任务完成执行。
>
> 一般shutdown之后，使用此方法保证所有以前提交的任务执行完成。

### Future submit(Callable task)

> 提交一个返回值的任务用于执行，返回一个表示任务的未决结果的 Future。该 Future 的 get 方法在成功完成时将会返回该任务的结果。
>
> 如果想立即阻塞任务的等待，则可以使用 result = exec.submit(aCallable).get(); 形式的构造。

Future submit(Runnable task, T result)

> 提交一个 Runnable 任务用于执行，并返回一个表示该任务的 Future。该 Future 的 get 方法在成功完成时将会返回给定的结果result。

Future`` submit(Runnable task)

> 提交一个 Runnable 任务用于执行，并返回一个表示该任务的 Future。该 Future 的 get 方法在 成功 完成时将会返回 null。
>
> 等价于 submit(task, null)。

List invokeAll(Collection`` tasks) throws InterruptedException

> 执行给定的任务，当所有任务完成时，返回保持任务状态和结果的 Future 列表。返回列表的所有元素的 Future.isDone() 为 true。
>
> 支持限时等待。

T invokeAny(Collection`` tasks) throws InterruptedException, ExecutionException

> 执行给定的任务，如果某个任务已成功完成（也就是未抛出异常），则返回其结果。一旦正常或异常返回后，则取消尚未完成的任务。如果此操作正在进行时修改了给定的 collection，则此方法的结果是不确定的。
>
> 支持限时等待。

**总结：**

**1、** Executor接口定义了execute()方法用来接收一个Runnable接口的对象，而ExecutorService接口中的submit()方法可以接受Runnable和Callable接口的对象；

**2、** Executor中的execute()方法不返回任何结果，而ExecutorService中的submit()方法可以通过一个Future对象返回运算结果，invokeAll返回Futrue列表，invokeAny返回运算结果；

**3、** ExecutorService可以关闭线程池shutDown，而Executor没有；

**4、** ExecutorService可以通过Future.cancel取消等待中的任务，而Executor没有；

通俗地理解：ExecutorService是Executor的增强。在执行已提交的 Runnable 任务的对象基础上，可对线程池关闭，或通过Future获得运算结果或取消线程。
