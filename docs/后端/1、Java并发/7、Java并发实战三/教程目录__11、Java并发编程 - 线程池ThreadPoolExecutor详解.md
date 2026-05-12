# 11、Java并发编程 - 线程池ThreadPoolExecutor详解
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/11.html
- 分类：Java并发
- 分组：教程目录
## 11、线程池

线程池重点内容：三大方法、7大参数、拒绝策略、优化配置。

### 11.1. 线程池原理

> 池化技术

程序运行的本质：占用系统资源，CPU/磁盘网络进行使用！我们希望可以高效的使用！池化技术就是演进出来的。

简单的说，池化技术就是：提前准备一些资源、以供使用！

线程池、连接池、内存池、对象池…这些东西都是池化技术。

线程的创建和销毁，数据库的连接和断开都十分浪费资源。

只要是“池”，就会设计到两个常量：minSize、maxSize，这些就是为了弹性访问，保证系统运行的效率。

如下，去银行取钱示例：

### 11.2. 为什么使用线程池

> 为什么使用线程池

如果你使用的是单核电脑，那你电脑上运行的多线程，都是假的，它运行原理是一个CPU对各个线程的交替执行，速度块。

但随着业务的发展，还是不能满足业务的要求，降低工作效率。现在我们使用的电脑是多核多CPU，各自的线程跑在独立的CPU上，不用切换，效率高很多。

**线程池的优势：**

> 1、控制运行的线程数量，处理的时候可以把一些任务放入队列 ；
>
> 2、实现线程的复用！控制最大并发数！

### 11.3. 创建线程池的三大方法

> 创建线程池的三大方法

数组有工具类Arrays，集合有工具类Collections，线程池同样有工具类Executors。利用线程池工具类Executors来创建线程池。线程池 Executors原生三大方法：

1、ExecutorService threadpool1 = Executors.newFixedThreadPool(5); // 固定线程池大小

2、ExecutorService threadpool2 = Executors.newCachedThreadPool(); //可以弹性伸缩的线程池，遇强则强

3、ExecutorService threadpool3 = Executors.newSingleThreadExecutor(); // 只有一个

线程池编写模型：

1、创建线程池 : ExecutorService threadpool = …

2、线程池执行线程： threadpool.execute()；

3、关闭线程池 : threadpool.shutdown()。

Executors.newFixedThreadPool()示例：

```java
 /**
     *  @description: 超过线程池大小部分，将拒绝
     *  @author DDKK.COM 弟弟快看，程序员编程资料站
     *  @date 2023/2/24 10:45
     */
    public static void fixedThreadPool() {
        /**
         *  @description: 线程池使用三部曲：1、创建线程池
         */
        ExecutorService executorService = Executors.newFixedThreadPool(5);// 固定大小
        //线程池要关闭，一般关闭我们放在finally中执行
        try {
            for (int i = 0; i < 10; i++) {
                /**
                 *  @description:线程池使用三部曲：2、线程池执行线程
                 */
                executorService.execute(() -> System.out.println(Thread.currentThread().getName() + ":running"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            /**
             *  @description:线程池使用三部曲：3、关闭线程池
             */
            executorService.shutdown();
        }
    }
```

超过线程池大小的线程将拒绝，只有5个线程在执行任务，运行效果如下：

Executors.newCachedThreadPool()示例：

```java
/**
 *  @description: 线程池大小根据请求量自动扩张
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/24 10:45
 */
public static void cachedThreadPool() {
    /**
     *  @description: 线程池使用三部曲：1、创建线程池
     */
    ExecutorService executorService = Executors.newCachedThreadPool();//可以弹性伸缩的线程池
    //线程池要关闭，一般关闭我们放在finally中执行
    try {
        for (int i = 0; i < 10; i++) {
            /**
             *  @description:线程池使用三部曲：2、线程池执行线程
             */
            executorService.execute(() -> System.out.println(Thread.currentThread().getName() + ":running"));
        }
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        /**
         *  @description:线程池使用三部曲：3、关闭线程池
         */
        executorService.shutdown();
    }
}
```

线程池大小根据请求量自动扩张，有10个线程在执行任务，运行效果如下：

Executors.newSingleThreadExecutor()示例：

```java
/**
 *  @description: 线程池大小只有一个
 *  @author DDKK.COM 弟弟快看，程序员编程资料站
 *  @date 2023/2/24 10:45
 */
public static void singleThreadExecutor() {
    /**
     *  @description: 线程池使用三部曲：1、创建线程池
     */
    ExecutorService executorService = Executors.newSingleThreadExecutor(); // 只有一个
    //线程池要关闭，一般关闭我们放在finally中执行
    try {
        for (int i = 0; i < 10; i++) {
            /**
             *  @description:线程池使用三部曲：2、线程池执行线程
             */
            executorService.execute(() -> System.out.println(Thread.currentThread().getName() + ":running"));
        }
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        /**
         *  @description:线程池使用三部曲：3、关闭线程池
         */
        executorService.shutdown();
    }
}
```

线程池大小只有1个，只有1个线程在执行任务，运行效果如下：

### 11.4. ThreadPoolExecutor 七大参数

> ThreadPoolExecutor 七大参数

分析三个方法的源码

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
    return new ThreadPoolExecutor(int corePoolSize, int maximumPoolSize,
                                  0L, TimeUnit.MILLISECONDS,
                                  new LinkedBlockingQueue<Runnable>());
}
public static ExecutorService newCachedThreadPool() {
    return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                  60L, TimeUnit.SECONDS,
                                  new SynchronousQueue<Runnable>());
}
public static ExecutorService newSingleThreadExecutor() {
    return new FinalizableDelegatedExecutorService
        (new ThreadPoolExecutor(1, 1,
                                0L, TimeUnit.MILLISECONDS,
                                new LinkedBlockingQueue<Runnable>()));
}
```

线程池的三大方法最终调用的都是ThreadPoolExecutor，一共有7个参数

ThreadPoolExecutor核心方法：

```java
public ThreadPoolExecutor(int corePoolSize,  // 核心池子的大小
                          int maximumPoolSize,  // 池子的最大大小
                          long keepAliveTime,  // 空闲线程的保留时间
                          TimeUnit unit,  // 时间单位
                          BlockingQueue<Runnable> workQueue, // 队列
                          ThreadFactory threadFactory, // 线程工厂，不修改！用来创建线程
                          RejectedExecutionHandler handler // 拒绝策略) {
    if (corePoolSize < 0 ||
        maximumPoolSize <= 0 ||
        maximumPoolSize < corePoolSize ||
        keepAliveTime < 0)
        throw new IllegalArgumentException();
    if (workQueue == null || threadFactory == null || handler == null)
        throw new NullPointerException();
    this.acc = System.getSecurityManager() == null ?
            null :
            AccessController.getContext();
    this.corePoolSize = corePoolSize;
    this.maximumPoolSize = maximumPoolSize;
    this.workQueue = workQueue;
    this.keepAliveTime = unit.toNanos(keepAliveTime);
    this.threadFactory = threadFactory;
    this.handler = handler;
}
```

**思考：工作中怎么使用线程池？只能够自己根据业务情况去自定义线程池的大小策略，禁止使用Executors。**

阿里巴巴孤尽强调，禁止使用Executors去创建线程池。

**使用Executors创建的线程池容易发生OOM. 因为它允许的其你去队列大小是integer最大值。**

> ThreadPoolExecutor 底层工作原理

```java
package com.interview.concurrent.threadpool;
import java.util.concurrent.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:线程池7大参数的使用
 * 1、队列满了，就会触发最大线程池，否则永远都只是corePoolSize个线程在运行，所以，队列大小一定要根据业务情况进行设置；
 * 2、当请求线程超过线程池（maximumPoolSize + workQueue），就会触发拒绝策略，至于怎么拒绝，与拒绝策略RejectedExecutionHandler有关。
 * @date 2023/2/24 11:03
 */
public class ThreadPoolExecutorDemo {
    public static void main(String[] args) {
        threadPoolExecutor();
    }
    public static void threadPoolExecutor(){
        ExecutorService threadPool = new ThreadPoolExecutor(
                2, // 核心池子的大小
                5, // 线程池最大大小5
                2L,  // 空闲线程的保留时间
                TimeUnit.SECONDS, // 超时回收空闲的线程
                new LinkedBlockingDeque<>(3), // 根据业务设置队列大小，队列大小一定要设置
                Executors.defaultThreadFactory(), // 不用变
                new ThreadPoolExecutor.CallerRunsPolicy() //拒绝策略
        );
        // 拒绝策略说明：
        // 1. AbortPolicy （默认的：队列满了，就丢弃任务抛出异常！）
        // 2. CallerRunsPolicy（哪来的回哪去？ 谁叫你来的，你就去哪里处理）
        // 3. DiscardOldestPolicy (尝试将最早进入对立与的人任务删除,尝试加入队列)
        // 4. DiscardPolicy (队列满了任务也会丢弃,不抛出异常)
        try {
            // 队列  RejectedExecutionException 拒绝策略
            for (int i = 1; i <= 10; i++) {
                // 默认在处理
                threadPool.execute(()->{
                    System.out.println(Thread.currentThread().getName()+" running....");
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            threadPool.shutdown();
        }
    }
}
```

注：

1、队列满了，就会触发最大线程池，否则永远都只是corePoolSize个线程在运行，所以，队列大小一定要根据业务情况进行设置；

2、当请求线程超过线程池（maximumPoolSize + workQueue），就会触发拒绝策略，至于怎么拒绝，与拒绝策略RejectedExecutionHandler有关。

### 11.5. 四种拒绝策略

四种拒绝策略：

拒绝策略说明：

1. AbortPolicy （默认的：队列满了，就丢弃任务抛出异常！）；
2. CallerRunsPolicy（哪来的回哪去？ 谁叫你来的，你就去哪里处理）；
3. DiscardOldestPolicy (尝试将最早进入队列的任务删除,尝试加入新任务)；
4. DiscardPolicy (队列满了任务也会丢弃,不抛出异常)。

流程图：

> 线程池用哪个？生产中如何设置合理参数

在工作中，我们不会使用Executors，自定根据业务来定义线程池！

### 11.6. 优化配置

**注意点：最大参数该如何设置？可通过以下两种方式去设置**

1、CPU 密集型：最大支持多少个线程同时跑，根据CPU去设置，一般设置成与CPU处理器一样大，每一次都要去写吗？ 通过Runtime来获取。

```java
Runtime.getRuntime.availableProcessors();
```

2、IO 密集型：磁盘读写、 一个线程在IO操作的时候、另外一个线程在CPU中跑，造成CPU空闲。最大线程数应该设置为 IO任务数！ 对于大文件的读写非常耗时，我们应该用单独的线程让他慢慢跑。

可以将以上代码的最大线程池使用Runtime.getRuntime.availableProcessors();来代替，如下代码：

```java
package com.interview.concurrent.threadpool;
import java.util.concurrent.*;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:线程池7大参数的使用
 * 1、队列满了，就会触发最大线程池，否则永远都只是corePoolSize个线程在运行，所以，队列大小一定要根据业务情况进行设置；
 * 2、当请求线程超过线程池（maximumPoolSize + workQueue），就会触发拒绝策略，至于怎么拒绝，与拒绝策略RejectedExecutionHandler有关。
 * @date 2023/2/24 11:03
 */
public class ThreadPoolExecutorDemo {
    public static void main(String[] args) {
        threadPoolExecutorRuntimeProcessors();
    }
    public static void threadPoolExecutorRuntimeProcessors(){
        ExecutorService threadPool = new ThreadPoolExecutor(
                2, // 核心池子的大小
                Runtime.getRuntime().availableProcessors(), // 获取当前运行环境的可用线程数
                2L,  // 空闲线程的保留时间
                TimeUnit.SECONDS, // 超时回收空闲的线程
                new LinkedBlockingDeque<>(3), // 根据业务设置队列大小，队列大小一定要设置
                Executors.defaultThreadFactory(), // 不用变
                new ThreadPoolExecutor.CallerRunsPolicy() //拒绝策略
        );
        // 拒绝策略说明：
        // 1. AbortPolicy （默认的：队列满了，就丢弃任务抛出异常！）
        // 2. CallerRunsPolicy（哪来的回哪去？ 谁叫你来的，你就去哪里处理）
        // 3. DiscardOldestPolicy (尝试将最早进入对立与的人任务删除,尝试加入队列)
        // 4. DiscardPolicy (队列满了任务也会丢弃,不抛出异常)
        try {
            // 队列  RejectedExecutionException 拒绝策略
            for (int i = 1; i <= 10; i++) {
                // 默认在处理
                threadPool.execute(()->{
                    System.out.println(Thread.currentThread().getName()+" running....");
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            threadPool.shutdown();
        }
    }
}
```
