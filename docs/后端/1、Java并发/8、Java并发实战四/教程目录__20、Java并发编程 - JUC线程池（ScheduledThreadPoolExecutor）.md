# 20、Java并发编程 - JUC线程池（ScheduledThreadPoolExecutor）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/20.html
- 分类：Java并发
- 分组：教程目录
## ScheduledThreadPoolExecutor

## 1.1 API介绍

### 构造线程池

Executors使用 `newScheduledThreadPool` 工厂方法创建ScheduledThreadPoolExecutor：

```java
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
	return new ScheduledThreadPoolExecutor(corePoolSize);
}
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize, ThreadFactory threadFactory) {
	return new ScheduledThreadPoolExecutor(corePoolSize, threadFactory);
}
```

ScheduledThreadPoolExecutor的构造器，内部其实都是调用了父类ThreadPoolExecutor的构造器，这里比较特别的是任务队列的选择——`DelayedWorkQueue`。

```java
public ScheduledThreadPoolExecutor(int corePoolSize) {
	super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS, new DelayedWorkQueue());
}
public ScheduledThreadPoolExecutor(int corePoolSize, ThreadFactory threadFactory) {
	super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS, new DelayedWorkQueue(), threadFactory);
}
public ScheduledThreadPoolExecutor(int corePoolSize, RejectedExecutionHandler handler) {
	super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS, new DelayedWorkQueue(), handler);
}
public ScheduledThreadPoolExecutor(int corePoolSize, ThreadFactory threadFactory, RejectedExecutionHandler handler) {
	super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS, new DelayedWorkQueue(), threadFactory, handler);
}
```

### 线程池的调度

该线程池的核心调度方法，是schedule、scheduleAtFixedRate（周期固定间隔时间调度）、scheduleWithFixedDelay(周期延迟调度)，通过 schedule方法来看下整个调度流程：

```java
public ScheduledFuture<?> schedule(Runnable command, long delay, TimeUnit unit) {
	if (command == null || unit == null)
		throw new NullPointerException();
	RunnableScheduledFuture<?> t = decorateTask(command, new ScheduledFutureTask<Void>(command, null,triggerTime(delay, unit)));
	delayedExecute(t);
	return t;
}
```

上述的decorateTask方法把Runnable任务包装成ScheduledFutureTask，`用户可以根据自己的需要覆写该方法`(扩展Task的入口)：

```java
protected <V> RunnableScheduledFuture<V> decorateTask(Runnable runnable, RunnableScheduledFuture<V> task) {
	return task;
}
```

ScheduledFutureTask是RunnableScheduledFuture接口的实现类，任务通过period字段来表示任务类型

```java
private class ScheduledFutureTask<V> extends FutureTask<V> implements RunnableScheduledFuture<V> {
	//任务序号, 自增唯一（如果延迟时间相同，会根据id判断先后顺序）
	private final long sequenceNumber;
	// 首次执行的时间点
	private long time;
	// 0: 非周期任务; >0: fixed-rate任务;<0: fixed-delay任务
	private final long period;
	//在堆中的索引
	int heapIndex;
	ScheduledFutureTask(Runnable r, V result, long ns) {
		super(r, result);
		this.time = ns;
		this.period = 0;
		this.sequenceNumber = sequencer.getAndIncrement();
	}
	// ...
}
```

ScheduledThreadPoolExecutor中的任务队列——DelayedWorkQueue，保存的元素就是ScheduledFutureTask。DelayedWorkQueue是一种堆结构，time最小的任务会排在堆顶（表示最早过期），每次出队都是取堆顶元素，这样最快到期的任务就会被先执行。如果两个ScheduledFutureTask的time相同，就比较它们的序号——sequenceNumber，序号小的代表先被提交，所以就会先执行。

## 1.2 核心流程源码简析

schedule的核心是其中的**delayedExecute**方法：

```java
private void delayedExecute(RunnableScheduledFuture<?> task) {
	if (isShutdown()) // 线程池已关闭
		reject(task); // 任务拒绝策略
	else {
		super.getQueue().add(task); // 将任务入队
		// 如果线程池已关闭且该任务是非周期任务, 则将其从队列移除
		if (isShutdown() && !canRunInCurrentRunState(task.isPeriodic()) && remove(task))
			task.cancel(false); // 取消任务
		else
			ensurePrestart(); // 添加一个工作线程
	}
}
```

处理过程：

- 任务被提交到线程池后，会判断线程池的状态，如果不是RUNNING状态会执行拒绝策略；
- 然后，将任务添加到阻塞队列中，由于DelayedWorkQueue是无界队列，所以一定会add成功；
- 然后，会创建一个工作线程，加入到核心线程池或者非核心线程池；

```java
void ensurePrestart() {
	int wc = workerCountOf(ctl.get());
	if (wc < corePoolSize)//如果核心线程池未满，则新建的工作线程会被放到核心线程池中。
		addWorker(null, true);
	else if (wc == 0) //当通过setCorePoolSize方法设置核心线程池大小为0时，这里必须要保证任务能够被执行，会创建一个工作线程，放到非核心线程池中。
		addWorker(null, false);
	//如果核心线程池已经满了,不会再去创建工作线程,直接返回。
}
```

- 最后，线程池中的工作线程会去任务队列获取任务并执行，当任务被执行完成后，如果该任务是周期任务，则会重置time字段，并重新插入队列中，等待下次执行。
- 从队列中获取元素的方法：

对于核心线程池中的工作线程来说，如果没有超时设置（ allowCoreThreadTimeOut == false ），则会使用阻塞方法take获取任务（因为没有超时限制，所以会一直等待直到队列中有任务）；如果设置了超时，则会使用poll方法（方法入参需要超时时间），超时还没拿到任务的话，该工作线程就会被回收。对于非工作线程来说，都是调用poll获取队列元素，超时取不到任务就会被回收。

## 1.3 案例演示

```java
public class ScheduledThreadPoolExecutorTest {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
       ScheduledThreadPoolExecutorTest.scheduleWithFixedDelay();
  //      ScheduledThreadPoolExecutorTest.scheduleAtFixedRate();
//        ScheduledThreadPoolExecutorTest.scheduleCaller();
//        ScheduledThreadPoolExecutorTest.scheduleRunable();
    }
    // 任务以固定时间间隔执行，延迟5s后开始执行任务，任务执行完毕后间隔5s再次执行，依次往复
    static void scheduleWithFixedDelay() throws InterruptedException, ExecutionException {
        ScheduledExecutorService executorService = new ScheduledThreadPoolExecutor(10);
        ScheduledFuture<?> result = executorService.scheduleWithFixedDelay(new Runnable() {
            public void run() {
                System.out.println(System.currentTimeMillis());
            }
        }, 5000, 5000, TimeUnit.MILLISECONDS);
        // 由于是定时任务，一直不会返回
        result.get();
        System.out.println("over");
    }
    // 相对开始加入任务的时间点固定频率执行：从加入任务开始算2s后开始执行任务，2+5s开始执行，2+2*5s执行，2+n*5s开始执行；
    // 但是如果执行任务时间大于5s,则不会并发执行，后续任务将会延迟。
    static void scheduleAtFixedRate() throws InterruptedException, ExecutionException {
        ScheduledExecutorService executorService = new ScheduledThreadPoolExecutor(10);
        ScheduledFuture<?> result = executorService.scheduleAtFixedRate(new Runnable() {
            public void run() {
                try {
                    Thread.sleep(10000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(System.currentTimeMillis());
            }
        }, 2000, 5000, TimeUnit.MILLISECONDS);
        // 由于是定时任务，一直不会返回
        result.get();
        System.out.println("over");
    }
    // 延迟2s后开始执行，只执行一次，没有返回值
    static void scheduleRunable() throws InterruptedException, ExecutionException {
        ScheduledExecutorService executorService = new ScheduledThreadPoolExecutor(10);
        ScheduledFuture<?> result = executorService.schedule(new Runnable() {
            @Override
            public void run() {
                System.out.println("gh");
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }
            }
        }, 2000, TimeUnit.MILLISECONDS);
        System.out.println(result.get());
    }
    // 延迟2s后开始执行，只执行一次，有返回值
    static void scheduleCaller() throws InterruptedException, ExecutionException {
        ScheduledExecutorService executorService = new ScheduledThreadPoolExecutor(10);
        ScheduledFuture<String> result = executorService.schedule(new Callable<String>() {
            @Override
            public String call() throws Exception {
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }
                return "gh";
            }
        }, 2000, TimeUnit.MILLISECONDS);
        // 阻塞，直到任务执行完成
        System.out.print(result.get());
    }
}
```

scheduleWithFixedDelay：
