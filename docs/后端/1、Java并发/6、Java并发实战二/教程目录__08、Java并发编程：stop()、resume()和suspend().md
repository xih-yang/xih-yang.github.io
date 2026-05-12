# 08、Java并发编程：stop()、resume()和suspend()
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/8.html
- 分类：Java并发
- 分组：教程目录
这三个方法已经是jdk是过期的方法，为什么仍然要单独拿出来说呢？主要目的是理解jdk多线程API设计的初衷，理解并且更好使用线程API。那么就来说说这三个方法吧：stop方法用于终止一个线程的执行，resume方法用于恢复线程的执行，suspend方法用于暂停线程的执行。要注意的resume方法需要和suspend方法配对使用，因为被暂停的线程需要执行恢复方法才能继续执行。

虽然这三个方法不在推荐使用，但是作为学习，我们可以深入研究下这三个方法的作用以及为什么不再推荐使用。

下面的代码首先创建一个打印线程，该线程完成的工作是每隔一秒钟打印当前时间，然后由主线程对该打印线程进行停止、暂停和恢复操作。

```java
package com.ddkk.concurrency;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.TimeUnit;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-2.
 */
public class DeprecatedThreadMethod {
    public static void main(String[] args) throws InterruptedException {
        DateFormat format = new SimpleDateFormat("HH:mm:ss");
        Thread printThread = new Thread(new Runner(),"PrintThread");
        //设为守护线程
        printThread.setDaemon(true);
        //开始执行
        printThread.start();
        //休眠3秒，也就是PrintThread运行了3秒
        TimeUnit.SECONDS.sleep(3);
        //尝试暂停
        printThread.suspend();
        System.out.println("main thread suspend PrintThread at " + format.format(new Date()));
        TimeUnit.SECONDS.sleep(3);
        //将PrintThread进行恢复，继续输出内容
        printThread.resume();
        System.out.println("main thread resume PrintThread at " + format.format(new Date()));
        TimeUnit.SECONDS.sleep(3);
        //尝试终止PrintThread，停止输出内容
        printThread.stop();
        System.out.println("main thread stop PrintThread at " + format.format(new Date()));
        TimeUnit.SECONDS.sleep(3);
    }
    /**
     * 该任务实现每隔一秒打印信息
     */
    static class Runner implements Runnable{
        public void run() {
            DateFormat format = new SimpleDateFormat("HH:mm:ss");
            while (true){
                System.out.println(Thread.currentThread().getName() + " run at " + format.format(new Date()));
                //休眠一秒后继续打印
                SleepUtil.second(1);
            }
        }
    }
}
```

执行结果如下：

可能你会很惊讶，这与我们设想的输出结果如出一辙：首先打印线程运行3秒后，主线程暂停打印线程的执行，暂停3秒后，主线程正确地恢复了打印线程的执行，打印线程重新运行3秒后，主线程停止了打印线程的执行，程序结束。

我们可以看到，时间上还是完全吻合的，那么如此好用的方法为什么就不再推荐使用了呢？我们看看官方怎么说：

> This method has been deprecated, as it is inherently deadlock-prone. If the target thread holds a lock on the monitor protecting a critical system resource when it is suspended, no thread can access this resource until the target thread is resumed. If the thread that would resume the target thread attempts to lock this monitor prior to calling resume, deadlock results. Such deadlocks typically manifest themselves as “frozen” processes.

简单地说主要是：suspend方法为例，该方法容易导致死锁，因为该线程在暂停的时候仍然占有该资源，这会导致其他需要该资源的线程与该线程产生环路等待，从而造成死锁。stop方法同样如此，该方法在终结一个线程时不会保证线程的资源正常释放，通常是没有给予线程完成资源释放工作的机会，因此会导致程序在可能在工作状态不确定的情况下工作。
