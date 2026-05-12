# 11、Java并发编程：Fork/Join分支合并框架
- 来源：https://ddkk.com/zhuanlan/java/concurrency/4/31.html
- 分类：Java并发
- 分组：Java 并发基础 (B)
## 11.1 Fork/Join框架概述

Fork/Join 可以将一个大的任务拆分成多个子任务进行并行处理，最后将子任务结果合并成最后的计算结果，并进行输出。

Fork/Join一共完成两件事情：

- 把一个复杂任务进行拆分，大事化小
- 把拆分结果进行合并

**1、** 任务分割：首先Fork/Join框架需要把大的任务分割成足够小的子任务，如果子任务比较大的话还要对子任务进行继续分割；

**2、** 执行任务并合并结果：分割的子任务分别放到双端队列里，然后几个启动线程分别从双端队列里获取任务进行执行子任务执行完的结果都放在另外一个队列里，启动一个线程从队列里取数据，然后合并这些数据；

在Fork/Join框架里，使用两个类实现上面的事情。

## 11.2 代码实现

实现1+2+3+4+...+100。分成多个子任务进行执行，每个子任务相加序列的最小值和最大值不能超过10，否则继续拆分成更小的任务。

```java
package forkjoin;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;
import java.util.concurrent.RecursiveTask;
public class ForkJoinDemo1 {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        //创建对象
        MyTask myTask = new MyTask(1, 100);
        //创建分支合并池对象
        ForkJoinPool forkJoinPool = new ForkJoinPool();
        ForkJoinTask<Integer> submit = forkJoinPool.submit(myTask);
        System.out.println(submit.get());
        forkJoinPool.shutdown();
    }
}
class MyTask extends RecursiveTask<Integer> {
    private int n1;
    private int n2;
    private int result;
    public MyTask(int n1, int n2) {
        this.n1 = n1;
        this.n2 = n2;
    }
    @Override
    protected Integer compute() {
        if(n2 - n1 >= 10) {
            int mid = n1 + (n2 - n1) / 2;
            MyTask task1 = new MyTask(n1, mid);
            MyTask task2 = new MyTask(mid+1, n2);
            task1.fork();
            task2.fork();
            result = task1.join() + task2.join();
        } else {
            for(int i = n1; i <= n2; i++) result += i;
        }
        return result;
    }
}
```
