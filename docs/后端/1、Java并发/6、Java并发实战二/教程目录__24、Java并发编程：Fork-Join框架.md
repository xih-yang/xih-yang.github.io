# 24、Java并发编程：Fork/Join框架
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/24.html
- 分类：Java并发
- 分组：教程目录
**Fork/Join框架简介**

Fork/Join框架是Java 7提供的用于并行执行任务的框架。具体是把大任务切分为小任务，再把小任务的结果汇总为大任务的结果。从这两个单词的角度分析，Fork是分叉的意思，可以引申为切分，Join是加入的意思，可以引申为合并。Fork的作用是把大任务切分为小任务，Join则是把这些小任务的执行结果进行合并的过程。

以计算1+2+3+4为例，假设阈值是2，那么Fork会将这个计算任务切分为1+2和3+4两个计算任务并行执行，Join则把1+2这个计算任务的执行结果，也就是3，和3+4这个计算任务的执行结果，也就是7，进行合并，也就是合并3+7，得到的最终的结果就是10了。

**工作窃取算法**

工作窃取算法是指线程从其他任务队列中窃取任务执行（可能你会很诧异，这个算法有什么用。待会你就知道了）。考虑下面这种场景：有一个很大的计算任务，为了减少线程的竞争，会将这些大任务切分为小任务并分在不同的队列等待执行，然后为每个任务队列创建一个线程执行队列的任务。那么问题来了，有的线程可能很快就执行完了，而其他线程还有任务没执行完，执行完的线程与其空闲下来不如帮助其他线程执行任务，这样也能加快执行进程。所以，执行完的空闲线程从其他队列的尾部窃取任务执行，而被窃取任务的线程则从队列的头部取任务执行（这里使用了双端队列，既不影响被窃取任务的执行过程又能加快执行进度）。

从以上的介绍中，能够发现工作窃取算法的优点是充分利用线程提高并行执行的进度。当然缺点是在某些情况下仍然存在竞争，比如双端队列只有任务需要执行的时候。

**Fork/Join框架详解**

使用Fork/Join框架分为两步：

- 分割任务：首先需要创建一个ForkJoin任务，执行该类的fork方法可以对任务不断切割，直到分割的子任务足够小
- 合并任务执行结果：子任务执行的结果同一放在一个队列中，通过启动一个线程从队列中取执行结果。

下面是计算1+2+3+4为例演示如何使用使用Fork/Join框架：

```java
package com.ddkk.concurrency.r0406;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;
import java.util.concurrent.RecursiveTask;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-6.
 */
public class CountTask extends RecursiveTask<Integer>{
    //阈值
    private static final int THRESHOLD = 2;
    //起始值
    private int start;
    //结束值
    private int end;
    public CountTask(int start, int end) {
        this.start = start;
        this.end = end;
    }
    @Override
    protected Integer compute() {
        boolean compute = (end - start) <= THRESHOLD;
        int res = 0;
        if (compute){
            for (int i = start; i <= end; i++){
                res += i;
            }
        }else {
            //如果长度大于阈值，则分割为小任务
            int mid = (start + end) / 2;
            CountTask task1 = new CountTask(start,mid);
            CountTask task2 = new CountTask(mid + 1, end);
            //计算小任务的值
            task1.fork();
            task2.fork();
            //得到两个小任务的值
            int task1Res = task1.join();
            int task2Res = task2.join();
            res = task1Res + task2Res;
        }
        return res;
    }
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        ForkJoinPool pool = new ForkJoinPool();
        CountTask task = new CountTask(1,5);
        ForkJoinTask<Integer> submit = pool.submit(task);
        System.out.println("Final result:" + submit.get());
    }
}
```

代码执行结果为：

> 15

代码中使用了FokJoinTask，其与一般任务的区别在于它需要实现compute方法，在方法需要判断任务是否在阈值区间内，如果不是则需要把任务切分到足够小，直到能够进行计算。每个被切分的子任务又会重新进入compute方法，再继续判断是否需要继续切分，如果不需要则直接得到子任务执行的结果，如果需要的话则继续切分，如此循环，直到调用join方法得到最终的结果。

可以发现Fork/Join框架的需要把提交给ForkJoinPool，ForkJoinPool由ForkJoinTask数组和ForkJoinWorkerThread数组组成，前者负责将存放程序提交给ForkJoinPool的任务，后者则负责执行这些任务。关键在于在于fork方法与join方法。先看看fork方法的实现原理：

```java
    public final ForkJoinTask<V> fork() {
        Thread t;
        if ((t = Thread.currentThread()) instanceof ForkJoinWorkerThread)
            ((ForkJoinWorkerThread)t).workQueue.push(this);
        else
            ForkJoinPool.common.externalPush(this);
        return this;
    }
    //把当前任务放入ForkJoinTask数组队列中，然后调用signalWork
    //方法唤醒或者创建一个新的工作线程执行任务
    final void push(ForkJoinTask<?> task) {
            ForkJoinTask<?>[] a; ForkJoinPool p;
            int b = base, s = top, n;
            if ((a = array) != null) {    // ignore if queue removed
                int m = a.length - 1;     // fenced write for task visibility
                U.putOrderedObject(a, ((m & s) << ASHIFT) + ABASE, task);
                U.putOrderedInt(this, QTOP, s + 1);
                if ((n = s - b) <= 1) {
                    if ((p = pool) != null)
                        p.signalWork(p.workQueues, this);
                }
                else if (n >= m)
                    growArray();
            }
        }
```

再看看join方法的实现原理：

```java
    //返回已经执行完毕的子任务的结果
    public final V join() {
        int s;
        if ((s = doJoin() & DONE_MASK) != NORMAL)
            reportException(s);
        return getRawResult();
    }
```

源码中主要调用了doJoin方法判断当前任务执行的状态，任务的状态共有以下几种：

```java
    //完成的掩码
    static final int DONE_MASK   = 0xf0000000;  
    //执行完毕
    static final int NORMAL      = 0xf0000000;  
    //被取消
    static final int CANCELLED   = 0xc0000000;  
    //出现异常
    static final int EXCEPTIONAL = 0x80000000;  
    //信号
    static final int SIGNAL      = 0x00010000;  
    //信号掩码
    static final int SMASK       = 0x0000ffff;  
```

看看doJoin方法源码：

```java
    private int doJoin() {
        int s; Thread t; ForkJoinWorkerThread wt; ForkJoinPool.WorkQueue w;
        return (s = status) < 0 ? s :
            ((t = Thread.currentThread()) instanceof ForkJoinWorkerThread) ?
            (w = (wt = (ForkJoinWorkerThread)t).workQueue).
            tryUnpush(this) && (s = doExec()) < 0 ? s :
            wt.pool.awaitJoin(w, this, 0L) :
            externalAwaitDone();
    }
```

首先判断当前任务的状态，如果已经执行完毕直接返回任务状态；如果没有执行完则从任务数组中取出任务并执行（源码中的doExec方法），然后再判断任务的状态，如果顺利完成，则设置任务状态为NORMAL，如果出现异常则记录该异常并且设置任务的状态为EXCEPTIONAL。
