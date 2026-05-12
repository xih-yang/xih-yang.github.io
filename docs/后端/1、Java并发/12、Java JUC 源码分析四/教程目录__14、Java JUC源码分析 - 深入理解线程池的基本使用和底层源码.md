# 14、Java JUC源码分析 - 深入理解线程池的基本使用和底层源码
- 来源：https://ddkk.com/zhuanlan/java/concurrency/12/14.html
- 分类：Java并发
- 分组：教程目录
### 1，线程池的基本使用

在了解这个线程池的底层原理之前，来先了解一下线程池的基本使用，首先定义一个线程池的工具类，用于构建一个全局的线程池，这里通过获取空闲的cpu的个数来设置最大的线程数和核心线程数，阻塞队列选择带有容量的链表有界队列， 选用的默认的线程工厂

```java
/**
 * 线程池工具
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date : 2023/10/14
 */
public class ThreadPoolUtil {
    /**
     * io密集型：最大核心线程数为2N,可以给cpu更好的轮换，
     *           核心线程数不超过2N即可，可以适当留点空间
     * cpu密集型：最大核心线程数为N或者N+1，N可以充分利用cpu资源，N加1是为了防止缺页造成cpu空闲，
     *           核心线程数不超过N+1即可
     * 使用线程池的时机：1,单个任务处理时间比较短 2,需要处理的任务数量很大
     */
    public static synchronized ThreadPoolExecutor getThreadPool() {
        if (pool == null) {
            //获取当前机器的cpu
            int cpuNum = Runtime.getRuntime().availableProcessors();
            log.info("当前机器的cpu的个数为：" + cpuNum);
            int maximumPoolSize = cpuNum * 2 ;
            pool = new ThreadPoolExecutor(
                    maximumPoolSize - 2,
                    maximumPoolSize,
                    5L,   //5s
                    TimeUnit.SECONDS,
                    new LinkedBlockingQueue<>(50),  //链表有界队列
                    Executors.defaultThreadFactory(), //默认的线程工厂
                    new ThreadPoolExecutor.AbortPolicy());  //直接抛异常，默认异常
        }
        return pool;
    }
}
```

随后创建一个线程任务Task类，用于将线程加入到线程池中

```java
/**
 * @Author: zhenghuisheng
 * @Date: 2023/10/14 23:19
 */
public class Task implements Runnable {
    @Override
    public void run() {
        System.out.println("线程名称:" + Thread.currentThread().getName());
        try {
            //模拟业务
            Thread.sleep(10000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

最后来一个测试主类，用于添加任务，并且获取阻塞队列的长度

```java
/**
 * @Author: zhenghuisheng
 * @Date: 2023/10/14 23:17
 */
public class ThreadPoolDemo {
    //获取线程池
    static ThreadPoolExecutor pool = ThreadPoolUtil.getThreadPool();
    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            //创建线程任务
            Task task = new Task();
            //线程池添加任务
            pool.execute(task);
            //获取阻塞队列
            BlockingQueue<Runnable> queue = pool.getQueue();
            System.out.println("阻塞队列的长度为: " + queue.size());
        }
    }
}
```

在前面的阻塞队列系列中，有很多事关于线程池的使用的，可以参考那里的使用

### 2，线程池的核心参数

在线程池中，最重要的就是7个参数的设置，需要根据不同的场景设置不同的参数

```java
public ThreadPoolExecutor(int corePoolSize,
                              int maximumPoolSize,
                              long keepAliveTime,
                              TimeUnit unit,
                              BlockingQueue<Runnable> workQueue,
                              ThreadFactory threadFactory,
                              RejectedExecutionHandler handler){
}
```

接下来对上面的7个参数做一个初步的定义

```java
int corePoolSize：核心线程数，默认不设置超时时间，当然可以手动设置过期超时时间
int maximumPoolSize：最大线程数 = 非核心线程 + 核心线程数，即线程池里面最多容纳的数量
long keepAliveTime：线程池维护线程所允许的空闲时间，非核心线程超时则会默认被销毁
TimeUnit unit：时间单位，有分钟，s，毫秒，微秒，纳秒等
BlockingQueue<Runnable> workQueue：存放未来得及提交的任务，其本质为一个BlockingQueue的阻塞队列，当线程池
								   中的核心线程满了之后就会将任务放入到阻塞队列里面
ThreadFactory threadFactory：线程工厂默认使用Executors里面的 defaultThreadFactory方法 来创建线程
RejectedExecutionHandler handler：拒绝策略，当线程池里面满了以及阻塞阻塞队列满了的情况下，会触发拒绝策略
```

#### 2.1，通过银行案例说明这7个参数

1，假设今天只开了三个窗口，对应的就是三个核心线程的数量，一个人来办理业务就对应一个窗口，即为对应的核心线程

2，如果三个窗口满了，则下一个人在等候区等待，就是对应的阻塞队列，当然等候区的座位有限，即对应队列的长度也是有 限的，不过第一个人来到等候区会第一个办理业务，即对应队列的性质，先进先出

3，等候区也满了，银行发现今天来办理业务的人多，因此就会多开窗口临时接待这些办理业务的人员，该窗口对应的就是非核心线程，当然窗口有限，因此非核心线程的数量也是有限的，又因为该窗口为临时窗口，所以在没人的时候或者人数少的时候，该窗口也会被关闭，让临时工休息或者解雇，以防止资源的浪费，因此对应的非核心线程就被设置了空闲状态下的超时时间，也是为了避免资源的浪费

4，如果柜台的人数也满了，等候区的人数也满了，即达到饱和状态，银行就会劝退接下来要来办理业务的人，让他们下午来或者明天来，当然不同人有不同的劝退方式，这就是线程池的存在的多种拒绝策略的原因

#### 2.2，如何设置核心线程数和最大线程数

为了更加充分合理的理由这个cpu和内存等资源，因此需要根据实际开发的工作类型来设置核心数的大小。这里是参考与Doug Lea写的 《Java并发编程实战》

##### 2.2.1，cpu密集型

cpu的职责主要就是两件事，**取指令、执行指令** ，在设计到大量的计算、排序、加密解密等，则可以优先的考虑使用这个cpu密集型任务。因此为了充分的利用cpu，核心线程数可以设置为剩余cpu的个数n，最大线程数可以设置为n+1到2n都可以，最好设置成n+1。这里加1主要是为了防止缺页中断而导致cpu的空闲

```java
//获取系统可用的处理器的个数，1个cpu对应两个处理器
int n = Runtime.getRuntime().availableProcessors();
```

##### 2.2.1，io密集型

io密集型，指的是存在大量的磁盘io、网络io等，这种特点是不会特别的消耗cpu资源，但是io会耗时很长，如果一个cpu对应一个线程，那么cpu就会长时间的等待，因此为了充分的利用cpu，一般会设置这个核心线程数为n，但是最大线程数为2n，甚至更多

```java
//获取系统可用的处理器的个数，1个cpu对应两个处理器
int n = Runtime.getRuntime().availableProcessors();
```

但是最合理的线程数设置应该是需要进行压测的，这里的设置只是一个初步的方案

#### 2.3，如何挑选阻塞队列

在前面的几篇文章中，详细的描述了阻塞队列的几种具体实现，分别是： **ArrayBlockingQueue、LinkedBlockingqueue、PriorityQueue、DelayQueue**，这几种队列的特性和源码在前面几篇都有详细的描述。

如果是为了追求性能和吞吐量，并且在经过压测之后不会出现OOM的情况下，可以优先选择使用带有容量的链表实现的阻塞队列 **LinkedBlockingqueue**，因为内部用了两把互斥锁，使得生产者和消费者职责更加单一

```java
LinkedBlockingqueue queue = new LinkedBlockingqueue(50);
```

如果是需要排队等设置优先级的情况，如VIP优先，会员优先等情况，可以考虑使用二叉堆实现的PriorityQueue

```java
//默认长度是11，会扩容
Priorityqueue queue = new PriorityQueue();
```

如果是需要用到延时队列，如一些订单方案，超时方案等，可以优先选择 **DelayQueue**

```java
DelayQueue Queue = new DelayQueue();
```

如果没有要求，或者说生产者生产速度和消费者的消费的速度接近，那么可以选择这个数组的方式，但是数组内部使用的环状数组，不支持扩容的操作。如果可以的话，链表实现的阻塞队列绝大多数是可以代替这个数组的

```java
ArrayBlockingQueue queue = new ArrayBlockingQueue(50); 
```

#### 2.4，如何挑选拒绝策略

在线程池的拒绝策略中，主要有四种拒绝策略

> CallerRunsPolicy：由execute方法提交任务来执行这个任务
>
> AbortPolicy：抛出异常、拒绝提交任务
>
> DiscardPolicy：直接抛异常，不做任何处理
>
> DiscardOldestPolicy：去除队列中的第一个任务

线程池中，默认使用的是抛出异常，拒绝提交任务的策略

```java
private static final RejectedExecutionHandler defaultHandler = new AbortPolicy();
```

但是在实际开发中，如果真的有关于订单，用户信息等重要的任务时，是真的不可能直接使用上面这四种任务的，而是使用自定义的拒绝策略，如写一个 **RejectedExecutionHandler** 的具体实现，并重写里面的抽象方法即可。

```java
/**
 * @Author: zhenghuisheng
 * @Date: 2023/10/16 5:20
 */
@Component
public class MyRejectException implements RejectedExecutionHandler {
    @Override
    public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
        //获取线程
        Task task = (Task) r;
        Order order = task.getOrder();
        //入库
        order.getId();
        //...
    }
}
```

### 3，源码分析

#### 3.1，ThreadPoolExecutor的基本属性

在了解了线程池的基本使用之后，再来深入的了解一下这个线程池的底层原路

```java
public class ThreadPoolExecutor extends AbstractExecutorService {
     }
```

首先最下面是一个线程的状态，用整型32位的高三位表示

```java
private static final int RUNNING    = -1 << COUNT_BITS;		//运行
private static final int SHUTDOWN   =  0 << COUNT_BITS;		//关闭
private static final int STOP       =  1 << COUNT_BITS;		//停止
private static final int TIDYING    =  2 << COUNT_BITS;
private static final int TERMINATED =  3 << COUNT_BITS;
```

随后内部定义了这些个参数，除了这个阻塞队列是一个final固定的工作队列之外，其他的关键字都用了volatile关键字修饰，都是为了保证线程间的可见性的

```java
private volatile int corePoolSize;
private volatile int maximumPoolSize;
private volatile long keepAliveTime;
private final BlockingQueue<Runnable> workQueue;
private volatile ThreadFactory threadFactory;
private volatile RejectedExecutionHandler handler;
```

既然涉及到阻塞队列的入队出队，那么就需要一个互斥锁以及条件队列来保证这个线程安全，条件队列肯定是满了的时候被阻塞的

```java
private final ReentrantLock mainLock = new ReentrantLock();		//互斥锁
private final Condition termination = mainLock.newCondition();	//条件队列
```

接着就是这个 **Worker** 的静态内部类，很明显，该类是继承于AQS实现的，那这个整体设计就是基于同步队列来实现的一个工作类，因此可以先熟读前面的AQS系列的文章

```java
private final class Worker extends AbstractQueuedSynchronizer implements Runnable
```

在这个类中还有一个重要的工具，就是hashset，会将所有的worker加入到这个hashset里面

```java
private final HashSet<Worker> workers = new HashSet<Worker>();
```

#### 3.2，Worker类的基本属性

##### 3.2.1，线程工厂创建线程

接着就是查看一下这个Worker类的内部，在这个构造方法，在构建这个Wroker类的结点时，默认会将该结点的状态设置成-1，即运行状态，随后从线程工厂中创建一个线程

```java
Worker(Runnable firstTask) {
    setState(-1); // 设置线程不可中断
    this.firstTask = firstTask;
    this.thread = getThreadFactory().newThread(this);
}
```

随后就是查看这个默认的工厂的创建，即直接查看这个 **getThreadFactory** 方法，由此可知线程创建的底层最终是通过这个 **System.getSecurityManager** 系统底层来创建的，

```java
DefaultThreadFactory() {
    SecurityManager s = System.getSecurityManager();
    group = (s != null) ? s.getThreadGroup() :
                          Thread.currentThread().getThreadGroup();
    namePrefix = "pool-" +
                  poolNumber.getAndIncrement() +
                 "-thread-";
}
```

随后通过调用这个 **newThread** 方法来获取创建的线程

```java
public Thread newThread(Runnable r) {
    Thread t = new Thread(group, r,
                          namePrefix + threadNumber.getAndIncrement(),
                          0);
    if (t.isDaemon())
        t.setDaemon(false);
    if (t.getPriority() != Thread.NORM_PRIORITY)
        t.setPriority(Thread.NORM_PRIORITY);
    return t;
}
```

##### 3.2.2，如何通过AQS自定义设置一把锁

继续看这个Worker的这个内部类，发现里面有两个重要的方法获取锁和释放锁的方法，在前面讲解这个AQS的CLH同步队列中，画了一个图，如下所示

根据上面的图就知道这个AQS是如何保证线程安全的，那么就是下面的俩个方法。在抢锁时，通过cas判断这个state是否为0，进入一个抢锁逻辑，是的话设置这个同步状态器的exclusive的值为当前线程；在释放锁时，直接将同步状态器的exclusive值设置为null，将state的值设置为0，这样就简单的实现了一把aqs锁了

```java
protected boolean tryAcquire(int unused) {
    if (compareAndSetState(0, 1)) {
        setExclusiveOwnerThread(Thread.currentThread());
        return true;
    }
    return false;
}
protected boolean tryRelease(int unused) {
    setExclusiveOwnerThread(null);
    setState(0);
    return true;
}
```

#### 3.3，线程池执行逻辑

在创建任务以及线程池后，一般有两种方式将线程池加入到线程池中，一种是execute，一种是submit，前者没有返回值，后者有返回值，但是最终都是要调用这个execute方法的，因此这里以execute方法作为入口

```java
pool.execute(task);		//将任务加入到线程池中
```

接着直接进入这个 **execute** 方法中，

```java
public void execute(Runnable command) {
    if (command == null)	//判空
        throw new NullPointerException();
    int c = ctl.get();		//获取线程数的数量
    if (workerCountOf(c) < corePoolSize) {
     	//判断已有线程数是否小于核心线程
        if (addWorker(command, true))		//创建核心线程
            return;
        c = ctl.get();
    }
    //线程为运行状态，并且线程入队成功
    if (isRunning(c) && workQueue.offer(command)) {
     	//入队逻辑
        int recheck = ctl.get();	
        //双重检测，防止在那一刻变成了不可运行状态
        if (! isRunning(recheck) && remove(command))
            reject(command);
        else if (workerCountOf(recheck) == 0)
            addWorker(null, false);
    }
    else if (!addWorker(command, false))	//拒绝策略
        reject(command);
}
```

他的整体流程，可以直接通过下面这种图片来概括

接下来进入这个 **addWorker** 方法，首先会对这个worker进行一个校验，判断他的状态是否为运行状态。随后就是一个AQS的入队操作，会将所有创建的wroker加入到hashset里面，最后会调用这个start方法运行这个线程

```java
private boolean addWorker(Runnable firstTask, boolean core) {
retry:
for (;;) {
    int c = ctl.get();	//线程记录数
    int rs = runStateOf(c);	//获取线程的状态
    //如果是上面的1,2,3的三种形态，则直接false
    //或者说队列不是空的
    if (rs >= SHUTDOWN &&! (rs == SHUTDOWN &&firstTask == null &&! workQueue.isEmpty()))
        return false;
    for (;;) {
        int wc = workerCountOf(c);	//获取最大的核心线程数
        if (wc >= CAPACITY ||wc >= (core ? corePoolSize : maximumPoolSize)) return false;
        if (compareAndIncrementWorkerCount(c)) break retry;
        c = ctl.get();  // Re-read ctl
        if (runStateOf(c) != rs) continue retry;
    }
}
//上面一堆判断主要是验证是否能增加核心线程或者非核心线程
boolean workerStarted = false;
boolean workerAdded = false;
Worker w = null;
//接下来的就是AQS的逻辑
try {
    w = new Worker(firstTask);	//创建一个Worker工作结点
    final Thread t = w.thread;
    if (t != null) {
        final ReentrantLock mainLock = this.mainLock;	//获取互斥锁
        mainLock.lock();	//加锁
        try {
            int rs = runStateOf(ctl.get());	//判断结点的状态
			//状态小于0或者等于0，头结点为空
            if (rs < SHUTDOWN ||(rs == SHUTDOWN && firstTask == null)) {
                if (t.isAlive()) throw new IllegalThreadStateException();
                workers.add(w);	//加入hashset里面
                int s = workers.size();
                if (s > largestPoolSize) largestPoolSize = s;
                workerAdded = true;
            }
        } finally {
            mainLock.unlock();	//解锁
        }
        if (workerAdded) {
            t.start();	//执行start方法
            workerStarted = true;
        }
    }
} finally {
    if (! workerStarted)
        addWorkerFailed(w);
}
return
}
```

在调用它的start方法之后，最后会执行他的run方法

```java
public void run() {
    runWorker(this);
}
```

接着再研究他的 **runWorker** 的这个方法，在这个执行的run方法中，可以得知队列中的任务是最后执行的，核心线程和非核心线程时先执行的。并且在run运行这个线程任务的时候，可以手动的重写**beforeExecute** 前置任务和 **afterExecute** 后置任务

```java
final void runWorker(Worker w) {
    Thread wt = Thread.currentThread();
    Runnable task = w.firstTask;
    w.firstTask = null;
    w.unlock(); // allow interrupts
    boolean completedAbruptly = true;
    try {
        //精髓点，先执行非核心线程和核心线程，最后执行队列中的任务
        while (task != null || (task = getTask()) != null) {
            w.lock();
            if ((runStateAtLeast(ctl.get(), STOP) ||
                 (Thread.interrupted() &&
                  runStateAtLeast(ctl.get(), STOP))) &&
                !wt.isInterrupted())
                wt.interrupt();
            try {
                beforeExecute(wt, task);	//前置任务
                Throwable thrown = null;
                try {
                    task.run();
                } finally {
                    afterExecute(task, thrown);	//后置任务
                }
            } finally {
                task = null;
                w.completedTasks++;
                w.unlock();
            }
        }
        completedAbruptly = false;
    } finally {
        processWorkerExit(w, completedAbruptly);
    }
}
```

在线程池中，是通过有限的线程个数，加上对应的run方法的数量来加快响应速率的。在多线程中，需要创建一个线程对象调用一个start方法，如果要100个线程，那么就得创建100个线程，调用100个run方法，但是如果是线程池的话，只需要创建最大的线程数量，加上100个run方法即可，因此线程池的速率会比多线程的快。**总而言之，线程池是对线程run方法的调用**

在这个运行线程的方法最后，有一个 **processWorkerExit** 方法，表示当前线程已经执行完毕，可以继续执行下一个任务的run方法

```java
private void processWorkerExit(Worker w, boolean completedAbruptly) {
    int c = ctl.get();
    if (runStateLessThan(c, STOP)) {
        if (!completedAbruptly) {
            int min = allowCoreThreadTimeOut ? 0 : corePoolSize;
            if (min == 0 && ! workQueue.isEmpty())
                min = 1;
            if (workerCountOf(c) >= min)
                return; // replacement not needed
        }
        addWorker(null, false);		//增加一个线程任务，空线程
    }
}
```

### 4，为何不推荐jdk自带的线程池

在jdk中有四种自带的线程池，分别是：**newSingleThreadExecutor，newCachedThreadPool，newFixedThreadPool，newScheduledThreadPool** ，接下来通过这些构建线程池的具体参数来分析为何会不推荐使用

先看这个单例的线程池，首先最大线程数和核心线程数是1，强行由多线程变成单线程，一般场景是不会选择的，但是这并不是重点，而是阻塞队列选择的是无界的阻塞队列，LinkedBlockingqueue无界阻塞队列的长度是整型的最大值，假设一个对象占1m，那么这么多线程加入队列，得2^32 - 1m的容量，那么迟早**OOM**

```java
public static ExecutorService newSingleThreadExecutor(ThreadFactory threadFactory) {
    return new FinalizableDelegatedExecutorService
        (new ThreadPoolExecutor(1, 1,
                                0L, TimeUnit.MILLISECONDS,
                                new LinkedBlockingQueue<Runnable>(),
                                threadFactory));
}
```

接下来看这个固定长度的线程池，和单例的是一个问题，使用的LinkedBlockingqueue无界阻塞队列，**OOM**

```java
public static ExecutorService newFixedThreadPool(int nThreads, ThreadFactory threadFactory) {
	return new ThreadPoolExecutor(nThreads, nThreads,
                                  0L, TimeUnit.MILLISECONDS,
                                  new LinkedBlockingQueue<Runnable>(),
                                  threadFactory);
}
```

下一个缓存的线程池，好不容易用的是同步队列不OOM了，但是最大线程时整型最大值，就是丢这么多任务到内存中，那么CPU和内存迟早溢出

```java
public static ExecutorService newCachedThreadPool(ThreadFactory threadFactory) {
    return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                  60L, TimeUnit.SECONDS,
                                  new SynchronousQueue<Runnable>(),
                                  threadFactory);
}
```

最后一个延时的线程池，和上面的缓存的一样，最大核心线程数整型最大值，cpu打满和内存溢出

```java
public ScheduledThreadPoolExecutor(int corePoolSize,
                                   ThreadFactory threadFactory) {
    super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
          new DelayedWorkQueue(), threadFactory);
}
```

### 5，总结

首先通过execute方法将任务加入到线程池，随后会先判断线程池中已有线程数是否小于核心线程数，小于则继续创建核心线程，线程数大于或者等于核心线程数时，则将线程加入到阻塞队列中，队列满了的情况下则创建非核心线程。线程的数量是有限的，通过有限的线程去执行任务线程的run方法，从而让线程池更加的高效，在执行任务时，会先执行完非核心线程和核心线程的任务，最后再执行阻塞队列的任务。

在实际开发中，最好选择自定义线程池的方式，而不是选择jdk的自带的线程，并且根据具体的业务场景选择相应的阻塞队列，设置相应大小的核心线程数和最大线程数，重写对应的拒绝则略做补偿机制等。
