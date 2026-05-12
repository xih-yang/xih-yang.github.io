# 14、Java并发编程 - 分支合并ForkJoin
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/14.html
- 分类：Java并发
- 分组：教程目录
## 14、分支合并：ForkJoin

### 14.1. 什么是ForkJoin

ForkJoin,任务切分、合并操作。大数据中的mapreduce ，就是任务切分，结果合并。原理如下图所示：

### 14.2. 工作窃取

> 工作窃取

A任务1 --> 任务2 --> 任务3 --> 任务4 A领先执行完成 ，帮B执行任务（从B任务的尾部开始窃取任务执行）！

B任务1 --> 任务2 任务3 任务4

工作开始从头，窃取从尾，有效提高速度，双端队列

### 14.3. 核心类

#### 14.3.1. ForkJoinPool

> 1、ForkJoinPool

ForkJoinPool ，是实现了ExecutorService的任务池，将任务ForkJoinTask放到ForkJoinPool中，去运行线程。 通过队列来执行，找到实现接口的类

而ForkJoinPool 中存在一个内部类,工作队列WorkQueue,是ForkJoinPool 的 一个内部类。每一个线程都有一个 WorkQueue ！

#### 14.3.2. ForkJoinTask

> 2、ForkJoinTask

**ForkJoinTask** 是一个抽象类，代表正在 ForkJoinPool 中运行的 任务，它有三个主要的方法：

fork： 安排任务异步执行，简单的说，就是创建一个子任务。

join：当任务完成后获取去返回的计算结果！

invoke：开始执行！如果计算没有完毕，就会等待！

#### 14.3.3. RecursiveTask

3、RecursiveTask

**ForkJoinTask的一个重要子类** 递归 RecursiveTask

其中有个计算方法compute

```java
/**
 * The main computation performed by this task.
 * @return the result of the computation
 */
protected abstract V compute();
```

> 我们一般要继承RecursiveTask类，重写compute方法，如下示例：

MyRecursiveTask

```java
package com.interview.concurrent.stream;
import java.util.concurrent.RecursiveTask;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：递归任务，泛型是计算后返回的结果类型
 * @date 2023/2/24 15:56
 */
public class MyRecursiveTask extends RecursiveTask<Long> {
    private long start; //开始值
    private long end; //结束值
    private static final long temp = 10000L; //中间值
    public MyRecursiveTask(long start, long end) {
        this.start = start;
        this.end = end;
    }
    @Override
    protected Long compute() {
        if (end - start <= temp) {
            long sum = 0L;
            for (long i = start; i <= end; i++) {
                sum += i;
            }
            return sum;
        }else{
            //获取中间值
            long middle = (start + end)/2;
           /**
           * fork()会不断的循环
           */
            //第一个任务
            MyRecursiveTask rightTask = new MyRecursiveTask(start,middle);
            rightTask.fork();
            //第二个任务
            MyRecursiveTask leftTask = new MyRecursiveTask(middle+1, end);
            leftTask.fork();
            //合并结果
            return rightTask.join() + leftTask.join();
        }
    }
}
```

fork()会不断的循环。

ForkJoin代码编写模型：

1、创建ForkJoinPool;

2、创建ForkJoinTask;

3、ForkJoinPool对象调用invoke执行，并将ForkJoinTask对象放入ForkJoinPool中

示例：计算1到10,0000,0000的和，通过三种方式，比较性能

```java
package com.interview.concurrent.stream;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.LongStream;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:计算1到10,0000,0000的和
 * @date 2023/2/24 15:40
 */
public class ForkJoinDemo {
    public static void main(String[] args) {
        //calculateNormal();   //time:781 sum:500000000500000000
        //calculateForkJoin(); //time:724 sum:500000000500000000
        calculateStream();     //time:473 sum:500000000500000000
    }
    // 正常测试
    public static void calculateNormal(){
        long startTime = System.currentTimeMillis();
        long sum = 0L;
        for (long i = 0L; i <= 10_0000_0000L; i++) {
            sum += i;
        }
        long endTime = System.currentTimeMillis();
        System.out.println("time:"+(endTime-startTime)+" sum:"+sum);
    }
    // ForkJoin测试
    public static void calculateForkJoin(){
        long startTime = System.currentTimeMillis();
       /** 
       *1、创建ForkJoinPool;
       */
        ForkJoinPool forkJoinPool = new ForkJoinPool();
        /** 
       *2、创建ForkJoinTask;
       */
        MyRecursiveTask recursiveTask = new MyRecursiveTask(0L,10_0000_0000L);
        /** 
       3、ForkJoinPool对象调用invoke执行，并将ForkJoinTask对象放入ForkJoinPool中;
       */
        long sum = forkJoinPool.invoke(recursiveTask);
        long endTime = System.currentTimeMillis();
        System.out.println("time:"+(endTime-startTime)+" sum:"+sum);
    }
    // Stream并行流测试
    public static void calculateStream(){
        long startTime = System.currentTimeMillis();
        long sum = LongStream.rangeClosed(0L,10_0000_0000L).parallel().reduce(0L,Long::sum);
        long endTime = System.currentTimeMillis();
        System.out.println("time:"+(endTime-startTime)+" sum:"+sum);
    }
}
```
