# 08、Java 7 新特性 - fork/join计算框架
- 来源：https://ddkk.com/zhuanlan/java/java7/8.html
- 分类：Java 7 新特性
- 分组：教程目录
Java7提供的一个用于并行执行任务的框架，是一个把大任务分割成若干个小任务，最终汇总每个小任务结果后得到大任务结果的框架。

该框架为Java8的并行流打下了坚实的基础

## Java中Fork/Join框架介绍

上述说明了Fork/Join框架的需求，我们可以看下Java中是如何实现此框架的。

- 分割任务，需要一个Fork类来分割任务，有可能任务很大，需要递归分割，直到分割的任务足够小；
- 执行任务，将分割的小任务分别放到双端队列中，然后启动线程从双端队列中获取任务并执行；
- 合并结果，小任务的执行结果会放到各自队列中，此时启动一个线程从各个队列中获取结果数据合并成最终结果。

Fork/Join使用一下两个类来完成以上三件事情：

- ForkJoinTask：我们要使用ForkJoin框架，必须首先创建一个ForkJoin任务。它提供在任务中执行fork()和join()操作的机制，通常情况下我们不需要直接继承ForkJoinTask类，而只需要继承它的子类，Fork/Join框架提供了以下两个子类：
- RecursiveAction：用于没有返回结果的任务。
- RecursiveTask ：用于有返回结果的任务。
- ForkJoinPool ：ForkJoinTask需要通过ForkJoinPool来执行，任务分割出的子任务会添加到当前工作线程所维护的双端队列中，进入队列的头部。当一个工作线程的队列里暂时没有任务时，它会随机从其他工作线程的队列的尾部获取一个任务。

## Fork/Join框架的使用

我们通过一个简单的例子来使用一下这个框架，例子：计算1+2+······+10的计算结果。

任务分割：每个子任务最多执行5个数的相加，那设置的廓值就是5，那就是分割成2个子任务即可。

执行任务：第一个任务执行1-5的和，第二个任务执行6-10的和

合并结果：第一个任务和+第二个任务和

```java
package com.hongguo.java7.forkjoin;
import java.util.concurrent.RecursiveTask;
/**
 * 由于需要返回值，所以继承RecursiveTask类
 */
public class CountTask extends RecursiveTask<Integer> {
    private static final int THRESHOLD = 5;
    private int start;
    private int end;
    public CountTask(int start, int end) {
        this.start = start;
        this.end = end;
    }
    @Override
    protected Integer compute() {
        int sum = 0;
        boolean canCompute = (end - start) <= THRESHOLD;
        // 任务小就直接计算
        if (canCompute) {
            for (int i = start; i <= end; i++) {
                sum += i;
            }
        } else {
            // 如果任务大于廓值，则分割成2个子任务计算
            int middle = (start + end) / 2;
            CountTask countTask1 = new CountTask(start, middle);
            CountTask countTask2 = new CountTask(middle + 1, end);
            // 执行子任务
            countTask1.fork();
            countTask2.fork();
            // 等待子任务执行完，得到执行结果
            int leftResult = countTask1.join();
            int rightResult = countTask2.join();
            // 合并子任务结果
            sum = leftResult + rightResult;
        }
        return sum;
    }
    public static void main(String[] args) throws Exception {
        ForkJoinPool pool = new ForkJoinPool();
        CountTask task = new CountTask(1, 10);
        Future<Integer> future = pool.submit(task);
        System.out.println(future.get());
    }
}
```

说明：ForkJoinTask与一般任务的主要区别在于需要实现compute方法，此方法中首先需要判断任务是否足够小，如果足够小就直接执行任务。如果不是足够小（大于我们设置的廓值时），就必须分割成两个子任务，子任务在调用fork方法时，又会进入compute方法，看看当前子任务是否需要继续分割成孙任务，如果不需要继续分割，则执行当前子任务并返回结果。使用join方法会等待子任务执行完并得到其结果。
