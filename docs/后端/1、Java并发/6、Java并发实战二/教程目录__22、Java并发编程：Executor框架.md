# 22、Java并发编程：Executor框架
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/22.html
- 分类：Java并发
- 分组：教程目录
Java使用线程完成异步任务是很普遍的事，而线程的创建与销毁需要一定的开销，如果每个任务都需要创建一个线程将会消耗大量的计算资源，JDK 5之后把工作单元和执行机制区分开了，工作单元包括Runnable和Callable，而执行机制则由Executor框架提供。Executor框架为线程的启动、执行和关闭提供了便利，底层使用线程池实现。使用Executor框架管理线程的好处在于简化管理、提高效率，还能避免this逃逸问题——是指不完整的对象被线程调用。

Executor框架使用了两级调度模型进行线程的调度。在上层，Java多线程程序通常把应用分解为多个任务，然后使用用户调度框架Executor将这些任务映射为固定数量的线程；在底层，操作系统内核将这些线程映射到硬件处理器上。

Executor框架包括线程池,Executor,Executors,ExecutorService,CompletionService,Future,C

allable 等。

主线程首先通过Runnable或者Callable接口创建任务对象。工具类Executors可以把一个Runnable对象封装为Callable对象（通过调用Executors.callable(Runnable task)实现），然后可以把Runnable对象直接交给ExecutorService执行，ExecutorService通过调用ExecutorService.execute(Runnable command)完成任务的执行；或者把Runnable对象或Callable对象交给ExecutorService执行，ExecutorService通过调用ExecutorService.submit(Runnable task)或者ExecutorService.submit(Callable task)完成任务的提交。在使用ExecutorService的submit方法的时候会返回一个实现Future接口的对象（目前返回的是FutureTask对象）。由于FutureTask实现了Runnable，也可以直接创建FutureTask，然后交给ExecutorService执行。

ExecutorService 接口继承自 Executor 接口，它提供了更丰富的实现多线程的方法。比如可以调用 ExecutorService 的 shutdown()方法来平滑地关闭 ExecutorService，调用该方法后，将导致 ExecutorService 停止接受任何新的任务且等待已经提交的任务执行完成(已经提交的任务会分两类：一类是已经在执行的，另一类是还没有开始执行的)，当所有已经提交的任务执行完毕后将会关闭 ExecutorService。

通过Executors工具类可以创建不同的线程池ThreadPoolExecutor：SingleThreadExecutor、FixedThreadPool和CachedThreadPool。

**FixedThreadPool**

```java
public static ExecutorService newFixedThreadPool(int nThreads)
public static ExecutorService newFixedThreadPool(int nThreads,ThreadFactory factory)
```

FixedThreadPool适用于为了满足管理资源的需求，而需要限制当前线程数量的应用场景，它适用于负载比较重的服务器。

**SingleThreadExecutor**

```java
public static ExecutorService newSingleThreadExecutor()
public static ExecutorService newSingleThreadExecutor(ThreadFactory factory)
```

SingleThreadExecutor适用于需要保证顺序地执行各个任务，并且在任意时间点不会有多个线程在活动的场景。

**CachedThreadPool**

```java
public static ExecutorService newCachedThreadPool()
public static ExecutorService newCachedThreadPool(ThreadFactory factory)
```

CachedThreadPool是大小无界的线程池，适用于执行很多的短期异步任务的小程序，或者负载比较轻的服务器。

**ScheduledThreadPoolExecutor**

```java
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize)
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize,ThreadFactory factory)
```

创建一个支持定时及周期性的任务执行的线程池，多数情况下可用来替代Timer类。ScheduledThreadPoolExecutor适用于需要在多个后台线程执行周期任务，同时为了满足资源管理需求需要限制后台线程数量的应用场景。

Executor框架的最核心的类是**ThreadPoolExecutor**，它是线程池的实现类，主要由四个组件构成。

**1、** corePool：核心线程池的大小；

**2、** maximumPool：最大线程池的大小；

**3、** BlockingQueue：用来暂时保存任务的工作队列；

**4、** RejectedExecutionHandler：饱和策略当ThreadPoolExecutor已经关闭或者ThreadPoolExecutor已经饱和时（是指达到了最大线程池的大小且工作队列已满），execute方法将要调用的Handler；

**使用Executor框架执行Runnable任务**

```java
package com.ddkk.concurrency;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-4.
 */
public class ExecutorRunnableTest {
    static class Runner implements Runnable{
        public void run() {
            System.out.println(Thread.currentThread().getName() + " is called");
        }
    }
    public static void main(String[] args){
        ExecutorService cachedThreadPool = Executors.newCachedThreadPool();
        for (int i = 0; i < 5; i++){
            cachedThreadPool.execute(new Runner());
        }
        cachedThreadPool.shutdown();
    }
}
```

结果如下：

通过下面对CachedThreadPool的分析就能知道执行任务的时候首先会从线程池选择空闲的线程执行任务，如果没有没有空闲的线程就会创建一个新的线程执行任务。这里出现同一个线程执行两遍的原因在于第一次执行任务的空闲线程执行完任务后不会马上终止，认识等待60秒才会终止。

**使用Executor框架执行Callable任务**

Runnable 任务没有返回值而 Callable 任务有返回值。并且 Callable 的call()方法只能通过 ExecutorService 的 submit(Callable task) 方法来执行，并且返回一个 Future（目前是FutureTask），是表示任务等待完成的 Future。如果需要得到Callable执行返回的结果，可以通过吊桶FutureTask的get方法得到。

下面的代码演示使用Executor框架执行Callable任务：

```java
package com.ddkk.concurrency;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-4.
 */
public class ExecutorCallableTest {
    /**
     * Callable任务
     */
    static class Runner implements Callable<String> {
        private String runId;
        public Runner(String runId) {
            this.runId = runId;
        }
        public String call() throws Exception {
            System.out.println(Thread.currentThread().getName() + " call method is invoked!");
            return Thread.currentThread().getName() + " call method and id is " + runId;
        }
    }
    public static void main(String[] args) {
        //线程池
        ExecutorService cachedThreadPool = Executors.newCachedThreadPool();
        //接收Callable任务的返回结果
        List<Future<String>> futureTaskList = new ArrayList<Future<String>>();
        for (int i = 0; i < 5; i++) {
            Future<String> future = cachedThreadPool.submit(new Runner(String.valueOf(i)));
            futureTaskList.add(future);
        }
        //遍历线程执行的返回结果
        for (Future f : futureTaskList) {
            try {
                //如果任务没有完成则忙等待
                while (!f.isDone()) {}
                System.out.println(f.get());
            } catch (InterruptedException e) {
                e.printStackTrace();
            } catch (ExecutionException e) {
                e.printStackTrace();
            } finally {
                //关闭线程池，不再接收新的任务
                cachedThreadPool.shutdown();
            }
        }
    }
}
```

程序的运行结果如下：

submit 方法也是首先选择空闲线程来执行任务,如果没有,才会创建新的线程来执行任务。如果 Future 的返回尚未完成则 get()方法会阻塞等待直到 Future 完成返回。

## FixedThreadPool详解

创建FixedThreadPool的源码如下：

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>());
    }
```

其corePoolSize和maximumPoolSize都被设为nThreads的值。当线程池中的线程数大于corePoolSize时，keepAliveTime为多余的空闲线程等待新任务的最长时间，超过这个时间后多余的线程将被终止。具体在FixedThreadPool的执行过程如下：

**1、** 如果当前运行的线程数少于corePoolSize，就创建新的线程执行任务；

**2、** 在线程池如果当前运行的线程数等于corePoolSize时，将任务加入到LinkedBlockingQueue等待执行；

**3、** 线程执行完1中的任务后，会在循环中反复从LinkedBlockingQueue获取任务来执行；

由于LinkedBlockingQueue使用的无界队列，所以线程池中线程数不会超过corePoolSize，因此不断加入线程池中的任务将被执行，因为不会马上被执行的任务都加入到LinkedBlockingQueue等待了。

## CachedThreadPool详解

CachedThreadPool是一个根据需要创建线程的线程池。创建一个CachedThreadPool的源码如下：

```java
public static ExecutorService newCachedThreadPool() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>());
    }
```

由源码可以看出，CachedThreadPool的corePoolSize为0，maximumPoolSize为Integer.MAX_VALUE，keepAliveTime为60L，意味着多余的空闲线程等待新任务的执行时间为60秒。

CachedThreadPool使用没有容量的SynchronousQueue作为线程池的工作队列（SynchronousQueue是一个没有容量的阻塞队列，每个插入操作必须等待另一个线程的对应移除操作），但是CachedThreadPool的maximumPool是无界的。这就意味着如果线程的提交速度高于线程的处理速度，CachedThreadPool会不断创建线程，极端情况是因为创建线程过多耗尽CPU和内存资源。

CachedThreadPool的执行过程如下：

**1、** 首先执行SynchronousQueue的offer方法如果maximumPool有空闲线程正在执行SynchronousQueue.poll(keepAliveTime,TimeUnit.NANOSECONDS)，那么主线程执行offer操作与空闲线程的poll操作配对成功，主线程把任务交给空闲线程执行，否则执行2；

**2、** 如果maximumPool为空或者maximumPool没有空闲线程时，CachedThreadPool将会创建一个新线程执行任务；

**3、** 在步骤2新创建的线程将任务执行完后，将会在SynchronousQueue队列中等待60秒，如果60秒内主线程提交了新任务，那么将继续执行主线程提交的新任务，否则会终止该空闲线程；

## ScheduledThreadPoolExecutor详解

ScheduledThreadPoolExecutor继承自ThreadPoolExecutor，主要用来在给定的延迟之后执行任务，或者定期运行任务。Timer类也具有类似的功能，Timer对应的单个的后台线程，而ScheduledThreadPoolExecutor可以在构造函数内指定多个对应的后台线程。

ScheduledThreadPoolExecutor为了支持周期性任务的执行，使用了DelayQueue作为任务队列。ScheduledThreadPoolExecutor会把待调度的任务（该任务是ScheduledFutureTask）放到DelayQueue中，线程池中的线程从DelayQueue中获取要执行的定时任务并执行。

ScheduledFutureTask包含了3个变量：

**1、** long型变量time，是任务具体的执行时间；

**2、** long型变量sequenceNumber，是这个任务被添加到ScheduledThreadPoolExecutor中的序号；

**3、** long型成员period，表示任务执行的间隔周期；

下面是ScheduledThreadPoolExecutor具体的执行步骤：

**1、** 线程从DelayQueue中获取已经到期的ScheduledFutureTask到期任务是指time大于等于当前时间的任务；

**2、** 线程执行这个过期任务；

**3、** 线程修改这个任务的time变量为下次执行的时间（当前时间加上间隔时间）；

**4、** 线程把修改后的任务放回DelayQueue，过期后会被重新执行；
