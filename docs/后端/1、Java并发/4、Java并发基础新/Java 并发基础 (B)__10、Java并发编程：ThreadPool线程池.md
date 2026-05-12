# 10、Java并发编程：ThreadPool线程池
- 来源：https://ddkk.com/zhuanlan/java/concurrency/4/30.html
- 分类：Java并发
- 分组：Java 并发基础 (B)
## 10.1 线程池概述

线程池（ThreadPool）：一种线程使用模式。线程过多会带来调度开销，进而影响缓存局部性和整体性能。而线程池维护着多个线程，等待着监督管理者分配可并发执行的任务，这避免了在处理短时间任务时创建与销毁线程的代价。线程池不仅能保证内核的充分使用，还能防止过分调度。

线程池的优势：线程池的工作是控制运行的线程数量。处理过程中将任务放入队列，然后创建线程来进行执行。如果线程数量超多了最大数量，超出数量的线程排队等候。等其他线程执行完毕后，再从队列中取出任务来进行执行。

它的主要特点：

- 降低资源消耗，通过重复利用已创建的线程降低线程创建和销毁造成的消耗。
- 提高响应速度，当任务到达时，任务可以不需要等待线程创建就可以立即执行。
- 提高线程的可管理性：线程是稀缺资源，如果无限制地创建，不仅会消耗系统资源，还会降低系统的稳定性，使用线程池可以进行统一的分配、调优和监控。
- Java中的线程池是通过Executor框架实现的，该框架中用到了Executor、Executors、ExecutorService、ThreadPoolExecutor这几个类。

## 10.2 线程池的架构

## 10.3 线程池使用方式

**1、** Executors.newFixedThreadPool(int)；

创建一个线程池，线程池中有固定的n个线程

特点：

- 线程池中线程的数量是一定的，可以很好地控制线程的并发量
- 线程可以重复利用。在显式关闭之前，都将一直存在
- 当线程被使用完时，新来的任务需要等待

**2、** Executors.newSingleThreadExecutor()；

一池一线程，一个任务一个任务地执行

**3、** Executors.newCachedThreadPool()；

线程池根据需求创建线程，可扩容

代码演示：

一池多线程：

```java
package pool;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
public class ThreadPoolDemo1 {
    public static void main(String[] args) {
        //一池五线程
        ExecutorService threadPool1 = Executors.newFixedThreadPool(5);
        //十个请求
        try {
            for(int i = 0; i < 10; i++) {
                threadPool1.execute(()->{
                    System.out.println(Thread.currentThread().getName() + "正在办理业务");
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            threadPool1.shutdown();
        }
    }
}
```

输出：

可以发现，最多出现5个线程，说明线程池是重复利用已经创建的线程。

一池一线程：

```java
package pool;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
public class ThreadPoolDemo2 {
    public static void main(String[] args) {
        //一池一线程
        ExecutorService threadpool2 = Executors.newSingleThreadExecutor();
        try{
            for(int i = 0; i < 10; i++) {
                threadpool2.execute(()->{
                    System.out.println(Thread.currentThread().getName() + "正在办理业务");
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            threadpool2.shutdown();
        }
    }
}
```

输出：

说明确实是只有一个线程，然后被反复利用。

一池可扩容线程：

```java
package pool;
import java.lang.reflect.Executable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
public class ThreadPoolDemo3 {
    public static void main(String[] args) {
        ExecutorService threadPool3 = Executors.newCachedThreadPool();
        try {
            for(int i = 0; i < 10; i++) {
                threadPool3.execute(()->{
                    System.out.println(Thread.currentThread().getName() + "正在办理业务");
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            threadPool3.shutdown();
        }
    }
}
```

输出：

## 10.4 创建线程池的7个参数

```java
public ThreadPoolExecutor(int corePoolSize,
                              int maximumPoolSize,
                              long keepAliveTime,
                              TimeUnit unit,
                              BlockingQueue<Runnable> workQueue,
                              ThreadFactory threadFactory,
                              RejectedExecutionHandler handler)
```

**1、** corePoolSize；

常驻（核心）线程数量

**2、** maximumPoolSize；

最大线程数量

**3、** keepAliveTime；

当线程数大于核心时，此为在关闭前多余的空闲线程等待新任务的最长时间，也称为缓存时间

**4、** unit；

设置最大存活时间时的单位

**5、** workQueue；

执行前用于保持任务的阻塞队列。此队列仅保持由 execute方法提交的 Runnable任务。

**6、** threadFactory；

线程工厂，用于创建线程

**7、** handler；

拒绝策略

定义固定长度线程池：

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>());
    }
```

定义一池一线程：

```java
public static ExecutorService newSingleThreadExecutor() {
        return new FinalizableDelegatedExecutorService
            (new ThreadPoolExecutor(1, 1,
                                    0L, TimeUnit.MILLISECONDS,
                                    new LinkedBlockingQueue<Runnable>()));
    }
```

定义可扩容线程池：

```java
public static ExecutorService newCachedThreadPool() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>());
    }
```

## 10.5 线程池底层工作流程

请看链接：[线程池底层工作原理](https://www.cnblogs.com/franson-2016/p/13291591.html)，7张图讲清楚线程池底层的工作原理。

4种拒绝策略：

- AbortPolicy：直接抛出RejectedExecutionException异常阻止系统正常运行
- CallerRunsPolicy：既不抛弃任务，也不抛出异常，而是将某些任务回退给调用者，从而降低任务的流量。
- DiscardOldestPolicy：抛弃等待队列中最先等待的任务，然后把当前任务加入队列中
- DiscardPolicy：既不处理也不抛出异常。如果允许任务丢弃，这是最好的方法。

## 10.6 自定线程池

由Executors创建的线程池的弊端：

**1、** FixedThreadPool和SingleThreadPool，允许请求队列的长读为Integer.MAX_VALUE，有可能造成大量请求的堆积，最终造成OOM；

**2、** CachedThreadPool和ScheduledThreadPool，允许创建的线程的最大数目为Integer.MAX_VALUE，可能会创建大量的线程，最终造成OOM；

```java
package pool;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
public class ThreadPoolDemo4 {
    public static void main(String[] args) {
        ThreadPoolExecutor threadPool4 = new ThreadPoolExecutor(
                2,
                5,
                2L,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(3),
                Executors.defaultThreadFactory(),
                new ThreadPoolExecutor.AbortPolicy()
        );
        try {
            for(int i = 0; i < 10; i++) {
                threadPool4.execute(()->{
                    System.out.println(Thread.currentThread().getName() + "正在处理任务");
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            threadPool4.shutdown();
        }
    }
}
```
