# 27、Java并发编程：CountdownLatch
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/27.html
- 分类：Java并发
- 分组：教程目录
CountDownLatch是JDK提供的并发工具包，理解并掌握这些工具包的使用有助于简化特定场景下的编程。就CountDownLatch而言，允许一个或者多个线程等待其他线程完成操作。等待其他线程完成不是与Thread.join()方法类似吗，因为Thread.join()就是让当前的线程等待join的线程执行完毕再继续执行。这里基于一个简单的需求实现CountDownLatch的功能：读取某目录下不同的文件内容，每个线程读取不同的文件，等所有的线程都读取完毕提示读取完毕的信息。

下面的代码使用Thread.join方法模拟了这个过程：

```java
package com.ddkk.concurrency.r0406;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-6.
 */
public class WaitJoinTaskDemo {
    public static void main(String[] args) throws InterruptedException {
        final DateFormat format = new SimpleDateFormat("HH:mm:ss");
        //第一个线程开始读取
        Thread thread1 =  new Thread(new Runnable() {
            public void run() {
                long start = System.currentTimeMillis();
                //模拟IO的耗时过程
                for (;;){
                    if (System.currentTimeMillis() - start > 1000 * 10){
                        break;
                    }
                }
                System.out.println(Thread.currentThread().getName() + " finished task at " + format.format(new Date()));
            }
        }, "Thread-1");
        //第二个线程开始读取
        Thread thread2 = new Thread(new Runnable() {
            public void run() {
                long start = System.currentTimeMillis();
                //模拟IO的耗时过程
                for (;;){
                    if (System.currentTimeMillis() - start > 1000 * 5){
                        break;
                    }
                }
                System.out.println(Thread.currentThread().getName() + " finished task at " + format.format(new Date()));
            }
        }, "Thread-2");
        System.out.println(Thread.currentThread().getName() + " start task at " + format.format(new Date()));
        thread1.start();
        thread2.start();
        //等待thread1执行完毕
        thread1.join();
        //等待thread2执行完毕
        thread2.join();
        System.out.println(Thread.currentThread().getName() + " ended task at " + format.format(new Date()));
    }
}
```

运行结果如下：

> main start task at 13:38:28
>
> Thread-2 finished task at 13:38:33
>
> Thread-1 finished task at 13:38:38
>
> main ended task at 13:38:38

可以看到程序很好地完成了功能，实际上join的实现原理是让当前线程不停检查join的线程是否存活，如果join存活则让当前线程永远等待（join的线程运行结束后就不存活了，当前线程也不用等待了，这样就实现了等待join线程执行完毕的功能）。join的线程终止后，线程会调用Object.notifyAll()通知等待的线程唤醒，这样就能继续执行了。

下面的示例演示如何使用CountDownLatch完成同样的功能：

```java
package com.ddkk.concurrency.r0406;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.CountDownLatch;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-6.
 */
public class CountDownLatchDemo {
    //参数2表示一个计数器
    //这里可以理解为等待多少个线程执行完毕
    static CountDownLatch countDownLatch = new CountDownLatch(2);
    static final DateFormat format = new SimpleDateFormat("HH:mm:ss");
    public static void main(String[] args) throws InterruptedException {
        //第一个读取的线程
        Thread thread1 = new Thread(new Runnable() {
            public void run() {
                long start = System.currentTimeMillis();
                for (;;){
                    if (System.currentTimeMillis() - start > 1000 * 10){
                        break;
                    }
                }
                System.out.println(Thread.currentThread().getName() + " finished task at " + format.format(new Date()));
                countDownLatch.countDown();
            }
        });
        //第二个线程开始读取
        Thread thread2 = new Thread(new Runnable() {
            public void run() {
                long start = System.currentTimeMillis();
                for (;;){
                    if (System.currentTimeMillis() - start > 1000 * 5){
                        break;
                    }
                }
                System.out.println(Thread.currentThread().getName() + " finished task at " + format.format(new Date()));
                countDownLatch.countDown();
            }
        }, "Thread-2");
        System.out.println(Thread.currentThread().getName() + " start task at " + format.format(new Date()));
        thread1.start();
        thread2.start();
        //等待其他线程执行完毕
        countDownLatch.await();
        System.out.println(Thread.currentThread().getName() + " ended task at " + format.format(new Date()));
    }
}
```

运行结果与上面的一样，这样就使用CountDownLatch完成同样的功能。当然，CountDownLatch的功能远比join强大。CountDownLatch的构造函数会接收一个int类型的额参数作为计数器，如果想等待N个线程执行完成，那么传入的参数就是N。每次调用countDown方法N的值就会减1，await方法会阻塞当前线程，直到其他N个线程执行完毕。这个时候N变为0。然而，参数N不一定就是指N个线程，也可以代表N个步骤等其他的含义。如果某个线程需要执行很长时间（比如IO密集型的任务），不可能一直等待，这个时候可以使用另一个带指定等待时间的方法await(long time,TimeUnit unit)，当前线程在等待unit的时间后如果仍然没有执行完毕，那么就不再等待。

这里要注意的是CountDownLatch的构造函数传入的int值必须大于0，如果等于0，调用await地方是不会阻塞当前线程的。
