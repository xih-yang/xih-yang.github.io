# 19、Java并发编程 - JUC线程池（自定义线程池ThreadPoolExecutor）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/19.html
- 分类：Java并发
- 分组：教程目录
## 一、自定义线程池ThreadPoolExecutor

上一节我们演示了利用Executors创建了三种类型的线程池，但是实际生产环境中，我们是不会用这种方式创建线程池的，主要原因就是这些线程池用的阻塞队列没有限制容量，容易引发内存溢出的问题。

首先在来回顾一下ThreadPoolExecutor构造的七个参数：

## 1.1 ThreadPoolExecutor构造的七个参数

```java
/**
* 使用给定的参数创建ThreadPoolExecutor.
*
* @param corePoolSize 核心线程池中的核心线程数
* @param maximumPoolSize 总线程池中的最大线程数
* @param keepAliveTime 空闲线程的存活时间
* @param unit keepAliveTime的单位
* @param workQueue 任务队列, 保存已经提交但尚未被执行的线程
* @param threadFactory 线程创建工厂
* @param handler 拒绝策略 (当任务太多导致工作队列满时的处理策略)
*/
public ThreadPoolExecutor(int corePoolSize,
							int maximumPoolSize,
							long keepAliveTime,
							TimeUnit unit,
							BlockingQueue<Runnable> workQueue,
							ThreadFactory threadFactory,
							RejectedExecutionHandler handler) {
	if (corePoolSize < 0 ||
		maximumPoolSize <= 0 ||
		maximumPoolSize < corePoolSize ||
		keepAliveTime < 0)
		throw new IllegalArgumentException();
	if (workQueue == null || threadFactory == null || handler == null)
		throw new NullPointerException();
	this.corePoolSize = corePoolSize;
	this.maximumPoolSize = maximumPoolSize;
	this.workQueue = workQueue;
	this.keepAliveTime = unit.toNanos(keepAliveTime);
	this.threadFactory = threadFactory;
	this.handler = handler;
}
```

参数
意义

corePoolSize
线程池中的常驻核⼼线程数

maximumPoolSize
线程池中能够容纳同时指向的最⼤线程数，此值必须⼤于等于1

keepAliveTime
多余的空闲线程的存活时间，当前池中线程数量超过corePoolSize时，当空闲时间达到keepAliveTime时，多余线程会被销毁直到只剩下corePoolSize个线程为⽌

unit
keepAliveTime存活时间的单位

workQueue
任务队列，存放已提交但尚未执⾏的任务

threadFactory
表示⽣成线程池中⼯作线程的线程⼯⼚，⽤于创建线程，⼀般默认的即可

handler
拒绝策略，表示当队列满了，并且⼯作线程⼤于等于线程池的最⼤线程数（maximumPoolSize）时，如何来拒绝请求执⾏的runnable的策略

具体原理上一节已经讲解过，不再赘述，我们直接看官方文档给我们的创建线程池的指南：

## 1.2 官方自定义线程池指南（重要）

> 以下都摘自官方API介绍文档翻译过来的

### 核心和最大池大小

一个ThreadPoolExecutor将根据corePoolSize(参见getCorePoolSize())和maximumPoolSize(参见getMaximumPoolSize())设置的边界自动调整池大小(参见getPoolSize())。`当一个新任务在方法execute(Runnable)中提交，并且运行的线程少于corePoolSize，一个新的线程被创建来处理这个请求，即使其他工作线程是空闲的`。`如果运行的线程多于corePoolSize但少于maximumPoolSize，则只有在队列满时才会创建新线程`。通过将corePoolSize和maximumPoolSize设置为相同的值，您可以创建一个固定大小的线程池。通过将maximumPoolSize设置为一个基本无界的值，比如Integer。MAX_VALUE，允许池容纳任意数量的并发任务。最典型的是，核心和最大池大小仅在构建时设置，但它们也可以使用setCorePoolSize(int)和setMaximumPoolSize(int)动态更改。

### 按需建设

`默认情况下，即使是核心线程最初也只在新任务到达时创建和启动`，但这可以使用prestartCoreThread()或prestartAllCoreThreads()方法动态覆盖。如果使用非空队列构造池，可能需要预启动线程。

- prestartCoreThread()：预创建指定的核心线程数
- prestartAllCoreThreads：预创建所有的核心线程

### 创建新线程

使用ThreadFactory创建新线程。如果没有指定，则使用executers . defaultthreadfactory()，它创建的线程都在同一个ThreadGroup中，并且具有相同的NORM_PRIORITY优先级和非守护状态。`通过提供不同的ThreadFactory，您可以更改线程的名称、线程组、优先级、守护进程状态等。`如果通过从newThread返回null请求ThreadFactory创建线程失败，执行器将继续执行，但可能无法执行任何任务。线程应该拥有"modifyThread"运行时权限。如果工作线程或其他使用池的线程不具有此权限，服务可能会降级:配置更改可能无法及时生效，关闭池可能仍处于可能终止但未完成的状态。

### 保活时间

`如果池当前有超过corePoolSize的线程，如果它们已经空闲超过keepAliveTime(参见getKeepAliveTime(TimeUnit))，多余的线程将被终止。`这提供了一种在池未被积极使用时减少资源消耗的方法。如果池在以后变得更加活跃，则将构造新线程。这个参数也可以使用方法setKeepAliveTime(long, TimeUnit)动态更改。使用Long.MAX_VALUE、TimeUnit.NANOSECONDS 有效地禁止空闲线程在关闭之前终止。`默认情况下，keep-alive策略只适用于有超过corePoolSize线程的情况。但是方法allowCoreThreadTimeOut(boolean)也可以用于将这种超时策略应用到核心线程，只要keepAliveTime值不为零。`

### 排队

任何BlockingQueue都可以用来传输和保存提交的任务。这个队列的使用与池大小相互作用:

- 如果运行的线程少于corePoolSize，执行程序总是喜欢添加一个新线程，而不是排队。
- 如果corePoolSize或更多的线程正在运行，执行程序总是倾向于将请求排队，而不是添加一个新线程。
- 如果一个请求不能排队，一个新的线程将被创建，除非这个线程将超过maximumPoolSize，在这种情况下，任务将被拒绝。

**一般有三种排队策略:**

- 直接的传递。工作队列的一个不错的默认选择是SynchronousQueue，它可以将任务交给线程，而不需要保留它们。在这里，如果没有立即可用的线程来运行一个任务，那么将该任务放入队列的尝试将失败，因此将构造一个新线程。该策略在处理可能具有内部依赖项的请求集时避免锁定。直接切换通常需要无限制的最大池大小，以避免拒绝新提交的任务。这反过来承认，当命令以高于处理速度的平均速度继续到达时，线程可能会无限增长。
- 无界队列。使用一个无界队列(例如没有预定义容量的LinkedBlockingQueue)将导致当所有corePoolSize线程都忙时，新的任务在队列中等待。因此，不会创建超过corePoolSize的线程。(因此，maximumPoolSize的值没有任何影响。)当每个任务完全独立于其他任务时，这可能是合适的，这样任务就不会影响其他任务的执行;例如，在web页面服务器中。虽然这种类型的队列在平滑请求的短暂爆发方面很有用，但它承认当命令以比处理速度更快的速度继续到达时，无界工作队列可能会无限制地增长。
- 有界的队列。有界队列(例如ArrayBlockingQueue)在使用有限的maximumpoolsize时有助于防止资源耗尽，但可能更难调优和控制。队列大小和最大池大小可能会相互交换:使用大队列和小池将CPU使用量、操作系统资源和上下文切换开销降至最低，但可能导致人为地降低吞吐量。如果任务经常阻塞(例如，如果它们受到I/O限制)，系统可能会为超出您允许的更多线程调度时间。使用小队列通常需要更大的池大小，这使cpu更忙，但可能会遇到不可接受的调度开销，这也会降低吞吐量。

### 拒绝接受任务

在方法execute(Runnable)中提交的新任务将在执行程序关闭，以及执行程序对最大线程和工作队列容量使用有限边界并达到饱和时被拒绝。在这两种情况下，execute方法都会调用它的RejectedExecutionHandler.rejectedExecution(Runnable, ThreadPoolExecutor) 方法。提供了四种预定义的处理程序策略:

- 在默认ThreadPoolExecutor.AbortPolicy中，处理程序在拒绝时抛出一个运行时RejectedExecutionException。
- ThreadPoolExecutor.CallerRunsPolicy中，调用execute的线程自己运行任务。这提供了一种简单的反馈控制机制，可以降低提交新任务的速度。
- 在ThreadPoolExecutor.DiscardPolicy中，不能执行的任务将被删除。
- 在 ThreadPoolExecutor.DiscardOldestPolicy中，如果executor没有关闭，则将删除工作队列头部的任务，然后重试执行(这可能再次失败，导致重复执行)。

可以定义和使用其他类型的RejectedExecutionHandler类。这样做需要一些小心，特别是当策略被设计为只在特定能力或排队策略下工作时。

### 钩方法

这个类提供了受保护的可重写的beforeExecute(Thread, Runnable)和afterExecute(Runnable, Throwable)方法，它们在每个任务执行之前和之后被调用。这些可用于操作执行环境;例如，重新初始化threadlocal、收集统计信息或添加日志条目。此外，可以重写方法terminated()，以便在Executor完全终止后执行任何特殊处理。

如果钩子或回调方法抛出异常，内部工作线程可能会失败并突然终止。

### 队列的维护

方法getQueue()允许访问工作队列以进行监视和调试。强烈反对将此方法用于任何其他目的。提供的两个方法，remove(Runnable)和purge()可以在大量队列任务被取消时帮助存储回收。

### 终结

程序中不再引用且没有剩余线程的池将自动关闭。如果您希望确保未引用的池被回收，即使用户忘记调用shutdown()，那么您必须安排未使用的线程最终死亡，通过设置适当的保持活动时间，使用0核心线程的下限和/或设置allowCoreThreadTimeOut(boolean)。

## 1.3 线程池开发规范

《Java 开发⼿册》阿⾥巴巴集团技术团队对线程池的创建有明确要求：

## 1.4 线程池的拒绝策略

其实官方文档已经描述过了，这里在强调一下，JUC提供了4种拒绝策略：

**1、****AbortPolicy**：默认的策略，直接抛出RejectedExecutionException异常，阻⽌系统正常运⾏；

**2、****CallerRunsPolicy**：既不会抛出异常，也不会终⽌任务，⽽是将任务返回给调⽤者，从⽽降低新任务的流量（谁提交的谁执行）；

**3、****DiscardOldestPolicy**：抛弃队列中等待最久的任务，然后把当前任务加⼊队列中尝试再次提交任务；

**4、****DiscardPolicy**：该策略默默地丢弃⽆法处理的任务，不予任何处理也不抛出异常如果允许任务丢失，这是最好的⼀种策略；

## 1.5 案例演示

```java
public class ThreadPoolExecutorTest {
    public static void main(String[] args) throws InterruptedException, IOException {
        int corePoolSize = 2;
        int maximumPoolSize = 4;
        long keepAliveTime = 10;
        TimeUnit unit = TimeUnit.SECONDS;
        BlockingQueue<Runnable> workQueue = new ArrayBlockingQueue<>(2);
        RejectedExecutionHandler handler = new RejectedExecutionPolicy();
        ThreadPoolExecutor executor = new ThreadPoolExecutor(corePoolSize, maximumPoolSize, keepAliveTime, unit,
                workQueue, handler);
        executor.prestartAllCoreThreads(); // 预启动所有核心线程
        for (int i = 1; i <= 10; i++) {
            ThreadTask task = new ThreadTask(String.valueOf(i));
            executor.execute(task);
        }
        System.in.read(); //阻塞主线程
    }
    public static class RejectedExecutionPolicy implements RejectedExecutionHandler {
        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            doLog(r, e);
        }
        private void doLog(Runnable r, ThreadPoolExecutor e) {
            // 可做日志记录等
            System.err.println( r.toString() + " rejected");
        }
    }
    static class ThreadTask implements Runnable {
        private String name;
        public ThreadTask(String name) {
            this.name = name;
        }
        @Override
        public void run() {
            try {
                System.out.println(this.toString() + " is running!");
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        public String getName() {
            return name;
        }
        @Override
        public String toString() {
            return "ThreadTask [name=" + name + "]";
        }
    }
}
```

## 1.6 生产环境线程池选择

单⼀、可变、定⻓都不⽤！原因就是 FixedThreadPool 和 SingleThreadExecutor 底层都是⽤ LinkedBlockingQueue 实现的，这个队列最⼤⻓度为 Integer.MAX_VALUE ，显然会导致OOM。所以实际⽣产⼀般⾃⼰通过 ThreadPoolExecutor 的7个参数，⾃定义线程池。

```java
ExecutorService threadPool = new ThreadPoolExecutor(
	2,
	5,
	1L,
	TimeUnit.SECONDS,
	new LinkedBlockingQueue<>(3),
	Executors.defaultThreadFactory(),
	new ThreadPoolExecutor.AbortPolicy()
);
```

### ⾃定义线程池参数选择

`对于CPU密集型任务，最⼤线程数是CPU线程数+1。`

`对于IO密集型任务，尽量多配点，可以是CPU线程数*2，或者CPU线程数/(1-阻塞系数)。`

- IO密集型，即该任务需要⼤量的IO，即⼤量的阻塞。

在单线程上运⾏IO密集型的任务会导致浪费⼤量的CPU运算能⼒在等待上。所以在IO密集型任务中使⽤多线程可以⼤⼤的加速程序运⾏，即使在单核CPU上，这种加速主要就是利⽤了被浪费掉的阻塞时间。
- IO密集型时，⼤部分线程都阻塞，故需要多配置线程数：

参考公式：CPU核数 / 1 - 阻塞系数 阻塞系数在 0.8~0.9 之间

⽐如 8 核 CPU：8/1 - 0.9 = 80个线程数
- 队列容量 一般是 最大线程数 或者 最大线程数 - 核心线程数

> 具体的数值都是不断压测进行调整得出的值
