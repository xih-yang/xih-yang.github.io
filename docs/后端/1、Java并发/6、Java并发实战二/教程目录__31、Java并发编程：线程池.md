# 31、Java并发编程：线程池
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/31.html
- 分类：Java并发
- 分组：教程目录
**线程池简介**

在之前介绍Executor框架的文章中对线程池有一个初步的认识，实际上线程池这种设计思想在Java中很普遍，比如JVM中常量池，以及Web开发使用到的数据库连接池。这些池本质上还是Java中的对象池，因为池中存放的都是Java对象。回到线程池，几乎所有需要异步或者执行并发任务的程序都可以使用到线程池。使用线程池带来的好处主要包括以下几个方面：

> 一，提高资源利用率。由于线程池中的线程使可以重复利用的，所以达到了循环利用的目的
>
> 二，提高响应速度。由于线程的创建也是需要开销的，如果请求到来的时候可以直接使用已经创建好的线程对象自然就能提高响应速度了
>
> 三，便于对线程进行统一的管理。线程属于稀缺资源，如果无限制的创建，不仅会消耗大量的资源还会大大降低系统的稳定性。使用线程池则可以对线程进行统一的分配和监控。

**线程池的实现原理**

其实线程池一句话就可以概括：通过将事先创建好的线程存放起来，在需要的时候直接拿过来使用就可以了。但是，为了提高线程池的性能，实际的线程池要比这种简化版复杂得多。在前面的线程池中，都只接收Runnable和Callable的任务，或者称为工作单元。那么就来分析当一个工作单元提交到线程池的时候具体发生了什么。

**1、** 线程池首先判断**核心线程池**中线程是否都在执行任务如果不是，则创建一个新的工作线程来执行任务如果都在执行任务，也就是没有空闲线程的话就进入下个流程；

**2、** 线程池继续判断**工作队列**是否已经满了如果工作队列没有满，则把新提交的任务放入该工作队列中，如果工作队列已经满了，则进入下个流程；

**3、** 线程池判断线程池中的线程是否都处于工作状态如果不是，则创建一个新的线程执行提交的任务，如果是，则执行**饱和策略**；

下面是线程池的执行流程：

在Java中实现的线程池的核心类是ThreadPoolExecutor，该类的execute方法的执行流程就是上面的过程。注意上面三个加粗的词汇：核心线程池、工作队列和饱和策略。细化到ThreadPoolExecutor执行execute方法的过程，对上面的过程补充如下：核心线程池对应corePoolSize变量的值，如果运行的线程小于corePoolSize，则创建新的线程执行任务（**这个过程需要获取全局锁**）；如果运行的线程大于corePoolSize，则将任务加入BlockingQueue（对应工作队列）；如果无法加入则创建新的线程执行任务，这个步骤中，如果创建新线程后当前运行的线程数大于maximumPoolSize，任务将被拒绝，并调用RejectedExecutionHandler.rejectedExcution()方法。

ThreadPoolExecutor为了避免执行新提交的任务获取全局锁，ThreadPoolExecutor在创建后会执行一个预热过程，所谓预热就是让当前运行的线程数大于等于corePoolSize。这样，后面新提交的任务都将直接加入到BlockingQueue。而这个过程是不需要获取全局锁的，自然就能提高线程池的性能。为了对ThreadPoolExecutor执行execute方法的过程一探究竟，来扒扒其源码：

```java
public void execute(Runnable command) {
        if (command == null)
            throw new NullPointerException();
        int c = ctl.get();
        //如果当前正在运行的线程数小于corePoolSize，则创建新的线程
        //执行当前任务
        if (workerCountOf(c) < corePoolSize) {
            if (addWorker(command, true))
                return;
            c = ctl.get();
        }
        //如果当前运行的线程数大于等于corePoolSize或者线程创建失败
        //则把当前任务放入工作队列
        if (isRunning(c) && workQueue.offer(command)) {
            int recheck = ctl.get();
            //判断之前是否已经添加过线程执行该任务（因为可能之前）
            //创建的线程已经死亡了）或者线程池是否已经关闭。如果
            //两个答案都是肯定的，那么选择拒绝执行任务
            if (! isRunning(recheck) && remove(command))
                reject(command);
            else if (workerCountOf(recheck) == 0)
                addWorker(null, false);
        }
        //如果线程池任务无法加入到工作队列（说明工作队列满了）
        //创建一个线程执行任务。如果新创建后当前运行的线程数大于
        //maximumPoolSize则拒绝执行任务
        else if (!addWorker(command, false))
            reject(command);
    }
```

如果线程池能够创建线程执行任务，那么将调用addWorker方法，将线程池创建的线程封装为Worker，Worker在执行完任务后还会循环获取队列中任务来执行。看看addWorker方法的源码：

```java
    private boolean addWorker(Runnable firstTask, boolean core){
        //省略部分代码
        boolean workerStarted = false;
        boolean workerAdded = false;
        Worker w = null;
        try {
            //这里就将提交的任务封装成为Worker了
            w = new Worker(firstTask);
            final Thread t = w.thread;
            if (t != null) {
                //使用加锁的方式原子添加工作线程
                final ReentrantLock mainLock = this.mainLock;
                mainLock.lock();
                try {
                    //在获得锁期间再次检查线程池的运行状态：如果
                    //线程池已经关闭或者任务为空则抛出异常
                    int rs = runStateOf(ctl.get());
                    if (rs < SHUTDOWN ||
                        (rs == SHUTDOWN && firstTask == null)) {
                        if (t.isAlive()) 
                            throw new IllegalThreadStateException();
                        //加入Worker数组
                        workers.add(w);
                        int s = workers.size();
                        if (s > largestPoolSize)
                            largestPoolSize = s;
                        workerAdded = true;
                    }
                } finally {
                    mainLock.unlock();
                }
                if (workerAdded) {
                    //如果添加成功则启动线程执行任务
                    t.start();
                    workerStarted = true;
                }
            }
        } finally {
            if (! workerStarted)
                addWorkerFailed(w);
        }
        return workerStarted;
    }
```

之后我们看看执行t.start()后会发生的事，因为Worker本身实现了Runnable，所以start后将调用Worker的run方法，源码如下：

```java
        public void run() {
           runWorker(this);
       }
       final void runWorker(Worker w) {
        Thread wt = Thread.currentThread();
        Runnable task = w.firstTask;
        w.firstTask = null;
        w.unlock(); // allow interrupts
        boolean completedAbruptly = true;
        try {
            while (task != null || (task = getTask()) != null) {
                w.lock();
                try {
                    beforeExecute(wt, task);
                    Throwable thrown = null；
                    task.run();
                    afterExecute(task, thrown);
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

以上源码其实就干了一件事：创建的线程在执行完提交的任务后会反复从BlockingQueue中获取任务来执行。

**使用线程池**

前面分析了线程池的执行过程以及对源码进行了剖析，下面我们自己创建一个线程池并熟悉线程池的使用。创建一个线程池需要几个输入参数：

**1、** corePoolSize：线程池的基本大小当提交一个任务给线程池时，线程池会创建一个线程执行任务，但是即使线程池有空闲的线程也会创建新的线程，直到执行的任务数大于等于corePoolSize时就不再创建；

**2、** runnableTaskQueue：用于保存等待执行的任务的阻塞队列；

**3、** maximumPoolSize：线程池的最大数量如果线程池的工作队列满了，并且已经创建的线程数小于最大的线程数，那么线程池会再创建新的线程执行任务；

**4、** ThreadFactory：用于设置创建线程的工厂；

**5、** RejectedExecutionHandler：饱和策略当队列和线程池都满了，说明线程已经处于饱和状态，那么必须采取一种策略处理提交的任务默认的策略是拒绝执行，也就是抛出异常；

提交任务的方式有两种：execute()和submit()。区别在于后者提交的任务是有返回值的。返回值可以通过Future对象的get()方法得到。执行后需要调用线程池的关闭关闭线程池。主要有shutdown()和shutdownNow()两个方法，原理都是遍历线程池中的工作线程，然后逐个调用线程的interrupt()方法中断线程。区别在于shutdownNow()方法首先会把线程池的状态设为STOP，然后尝试终止正在执行的线程和等待执行的线程，并返回等待执行的任务列表；而shutdown()方法只是将线程池的状态设为SHUTDOWN，然后中断所有没有正在执行的线程。一般而言，**如果要等到任务执行完再关闭线程池，则调用shutdown()方法，如果不一定要等到把任务执行完，那么就执行shutdownNow()方法。**

一个简单的线程池的例子如下（建议造轮子）：

```java
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-7.
 */
//线程池接口
public interface ThreadPool<Job extends Runnable> {
    //执行任务
    void execute(Job job);
    //关闭线程池
    void shutdown();
}
//演示用线程池
package com.ddkk.patchwork.concurrency.r0407;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.atomic.AtomicLong;
public class DemoThreadPool<Job extends Runnable> implements ThreadPool<Job> {
    //阻塞队列
    private BlockingQueue<Runnable> workQueue = null;
    //保存线程池的工作线程
    private List<DemoThread> demoThreadList = Collections.synchronizedList(new ArrayList<DemoThread>());
    //线程池状态
    private boolean isShutdown = false;
    //线程池默认的大小
    private static final int DEFAULT_WORKER_NUM = 5;
    //线程池最大的大小
    private static final int MAX_WORKER_NUM = 10;
    //线程池最小的大小
    private static final int MIN_WORKER_NUM = 1;
    //工作者线程的数量
    private int workNum;
    //线程编号
    private AtomicLong threadNum = new AtomicLong();
    public DemoThreadPool(int num) {
        workNum = num > MAX_WORKER_NUM ? MAX_WORKER_NUM : num < MIN_WORKER_NUM ? MIN_WORKER_NUM : num;
        init(workNum);
    }
    public DemoThreadPool() {
        init(DEFAULT_WORKER_NUM);
    }
    /**
     * 线程池初始化
     * @param workNum
     */
    private void init(int workNum) {
        //初始化工作队列
        workQueue = new ArrayBlockingQueue<>(DEFAULT_WORKER_NUM);
        //将指定数量的工作线程加入到列表中
        for (int i = 0; i < workNum; i++) {
            demoThreadList.add(new DemoThread(workQueue));
        }
        //启动指定数量的工作线程
        for (DemoThread thread : demoThreadList) {
            Thread worker = new Thread(thread, "ThreadPool-Worker-" + threadNum.incrementAndGet());
            System.out.println("ThreadPool-Worker-" + threadNum.get() + " add to workQueue!");
            worker.start();
        }
    }
    /**
     * 执行一个任务
     * @param job
     */
    @Override
    public void execute(Runnable job) {
        if (isShutdown) throw new IllegalStateException("ThreadPool is shutdown!");
        if (demoThreadList != null) {
                try {
                    //添加一个任务到工作队列中
                    workQueue.put(job);
                    System.out.println("ThreadPool receives a task!");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
        }
    }
    /**
     * 关闭线程池
     */
    @Override
    public void shutdown() {
            isShutdown = true;
            for (DemoThread t : demoThreadList) {
                t.stopToSelf();
            }
    }
}
//工作者线程
package com.ddkk.patchwork.concurrency.r0407;
import java.util.concurrent.BlockingQueue;
public class DemoThread implements Runnable {
    private BlockingQueue<Runnable> workQueue;
    private volatile boolean shutdown = false;
    public DemoThread(BlockingQueue<Runnable> workQueue) {
        this.workQueue = workQueue;
    }
    @Override
    public void run() {
        while (!shutdown){
            try {
                Runnable job = workQueue.take();
                job.run();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
    public void stopToSelf(){
        shutdown = true;
        //调用interrupt方法让等待在工作队列打算出队的线程从wait方法返回
        new Thread(this).interrupt();
    }
}
//测试程序
package com.ddkk.patchwork.concurrency.r0407;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.TimeUnit;
public class DemoThreadPoolTest {
    public static void main(String[] args) throws InterruptedException {
        //日期格式器
        final SimpleDateFormat format = new SimpleDateFormat("HH:mm:ss");
        //创建线程池
        DemoThreadPool<DemoThread> threadPool = new DemoThreadPool<>();
        //添加15个任务
        for (int i = 0; i < 15; i++){
            Runnable task = new Runnable() {
                @Override
                public void run() {
                    System.out.println(Thread.currentThread().getName() + " get result " +format.format(new Date()));
                }
            };
            threadPool.execute(task);
        }
        threadPool.shutdown();
        TimeUnit.SECONDS.sleep(10);
        System.out.println("work done! Time is " + format.format(new Date()));
    }
}
```

以上程序的执行结果为：

> ThreadPool-Worker-1 add to workQueue!
>
> ThreadPool-Worker-2 add to workQueue!
>
> ThreadPool-Worker-3 add to workQueue!
>
> ThreadPool-Worker-4 add to workQueue!
>
> ThreadPool-Worker-5 add to workQueue!
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool receives a task!
>
> ThreadPool-Worker-1 get result 19:36:48
>
> ThreadPool-Worker-2 get result 19:36:48
>
> ThreadPool-Worker-3 get result 19:36:48
>
> ThreadPool-Worker-4 get result 19:36:48
>
> ThreadPool-Worker-5 get result 19:36:48
>
> work done! Time is 19:37:03

从线程池的实现上可以看到，当客户端调用execute(Runnable task)时，会不断将任务加入工作队列BlockingQueue中，而每个工作者线程DemoThread则不断从工作队列中取任务执行，当工作队列为空时，工作者线程进入等待状态。执行完任务后线程调用shutdown()方法关闭线程池，要注意的是调用了工作者线程的stopToSelf方法停止从工作队列中取任务执行，除了把shutdown变量设为false外，还调用工作者线程的interrupt方法中断线程，进行如此操作的目的是将因为需要取任务而陷入等待的工作者线程进行中断从而让其从wait方法返回，然后停止执行。

可以看到，线程池的本质就是使用了一个线程安全的工作队列连接线程和客户端线程，客户端线程将任务放入工作队列后便直接返回，而工作者线程则不断从工作队列上取出任务并执行。当工作队列为空时，所有的工作者线程都等待在工作队列上，当有客户端提交新的任务时便会通知任意一个工作者线程，随着新提交的任务的增多，将有更多的工作者线程被唤醒。
