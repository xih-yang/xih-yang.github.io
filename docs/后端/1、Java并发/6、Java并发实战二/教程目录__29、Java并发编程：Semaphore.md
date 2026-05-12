# 29、Java并发编程：Semaphore
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/29.html
- 分类：Java并发
- 分组：教程目录
Semaphore（信号量）是用来控制线程并发数的，如果想对特定资源限制允许访问的线程数，那么就可以使用Semaphore来协调各个线程，从而保证线程合理运行。Semaphore由一个构造方法用来指定资源允许访问的线程数，也称为许可证的数量。使用Semaphore信号量控制并发线程数很简单，只需要在构造方法中执行一个参数就可以，该参数就表示有多少个线程可以并发访问该资源。

当需要一个许可证的时候，只需要调用Semaphore的acquire方法就可以了，而在使用完许可证需要归还许可证的时候，只要调用release方法就可以了。Semaphore还可以使用tryAcquire方法尝试获取许可证。Semaphore非常适合用于流量控制，特别是公有资源有限的场景。

下面的代码演示了在有10个线程并发执行但是只允许2个线程并发访问资源的情况：

```java
package com.ddkk.concurrency.r0406;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-6.
 */
public class SemaphoreDemo {
    /**
     * 并发执行的线程数
     */
    private static final int THREAD_COUNT = 10;
    /**
     * 线程池
     */
    private static ExecutorService threadPool = Executors.newFixedThreadPool(THREAD_COUNT);
    /**
     * 信号量
     * 只有2个许可证
     */
    private static Semaphore semaphore = new Semaphore(2);
    public static void main(String[] args){
        for (int i = 0; i < THREAD_COUNT; i++){
            final int num = i;
            threadPool.execute(new Runnable() {
                public void run() {
                    try {
                        //获取许可证
                        semaphore.acquire();
                        System.out.println(Thread.currentThread().getName() + " acquire permit " + num);
                        //输出信息
                        for (int i = 0; i < 999999;i++);
                        System.out.println("save data!");
                        //释放许可证
                        semaphore.release();
                        System.out.println(Thread.currentThread().getName() + " release permit " + num);
                        //当前可用的许可证
                        System.out.println("     current available permits:" + semaphore.availablePermits());
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            });
        }
        threadPool.shutdown();
    }
}
```

运行结果如下所示：

> pool-1-thread-2 acquire permit 1
>
> pool-1-thread-1 acquire permit 0
>
> save data!
>
> pool-1-thread-1 release permit 0
>
> current available permits:1
>
> pool-1-thread-5 acquire permit 4
>
> save data!
>
> save data!
>
> pool-1-thread-3 acquire permit 2
>
> pool-1-thread-4 acquire permit 3
>
> pool-1-thread-5 release permit 4
>
> save data!
>
> current available permits:0
>
> pool-1-thread-6 acquire permit 5
>
> save data!
>
> pool-1-thread-6 release permit 5
>
> current available permits:1
>
> pool-1-thread-7 acquire permit 6
>
> save data!
>
> pool-1-thread-7 release permit 6
>
> pool-1-thread-8 acquire permit 7
>
> save data!
>
> save data!
>
> pool-1-thread-8 release permit 7
>
> current available permits:1
>
> pool-1-thread-9 acquire permit 8
>
> save data!
>
> pool-1-thread-9 release permit 8
>
> current available permits:2
>
> current available permits:0
>
> pool-1-thread-4 release permit 3
>
> current available permits:2
>
> pool-1-thread-3 release permit 2
>
> current available permits:2
>
> pool-1-thread-10 acquire permit 9
>
> save data!
>
> pool-1-thread-10 release permit 9
>
> current available permits:2
>
> pool-1-thread-2 release permit 1
>
> current available permits:2

从以上运行可以看出，虽然由10个线程在执行，但是真正并发执行的线程数2个。这点恰好可以验证Semaphore在流量控制方面的作用。
