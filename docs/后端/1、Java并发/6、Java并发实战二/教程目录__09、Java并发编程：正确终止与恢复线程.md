# 09、Java并发编程：正确终止与恢复线程
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/9.html
- 分类：Java并发
- 分组：教程目录
前面提到了stop()、suspend()等方法在终止与恢复线程的弊端，那么问题来了，应该如何正确终止与恢复线程呢？这里可以使用两种方法：**interrupt()方法和使用boolean变量进行控制。**

在使用interrupt方法之前，有必要介绍一下中断以及与interrupt相关的方法。中断可以理解为线程的一个标志位属性，表示一个运行中的线程是否被其他线程进行了中断操作。这里提到了其他线程，所以可以认为中断是线程之间进行通信的一种方式，简单来说就是由其他线程通过执行interrupt方法对该线程打个招呼，让起中断标志位为true，从而实现中断线程执行的目的。

其他线程调用了interrupt方法后，该线程通过检查自身是否被中断进行响应，具体就是该线程需要调用isInterrupted方法进行判断是否被中断或者调用Thread类的静态方法interrupted对当前线程的中断标志位进行复位（变为false）。需要注意的是，如果该线程已经处于终结状态，即使该线程被中断过，那么调用isInterrupted方法返回仍然是false，表示没有被中断。

那么是不是线程调用了interrupt方法对该线程进行中断，该线程就会被中断呢？答案是否定的。因为Java虚拟机对会抛出InterruptedException异常的方法进行了特别处理：**Java虚拟机会将该线程的中断标志位清除，然后跑出InterruptedException，这个时候调用isInterrupted方法返回的也是false**。

下面的代码首先创建了两个线程，一个线程内部不停睡眠，另一个则不断执行，然后对这两个线程执行中断操作。

```java
package com.ddkk.concurrency;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-2.
 */
public class Interrupted {
    public static void main(String[] args){
        //创建一个休眠线程
        Thread sleepThread = new Thread(new SleepThread(),"SleepThread");
        //设为守护线程
        sleepThread.setDaemon(true);
        //创建一个忙线程
        Thread busyThread = new Thread(new BusyThread(),"BusyThread");
        //把该线程设为守护线程
        //守护线程只有当其他前台线程全部退出之后才会结束
        busyThread.setDaemon(true);
        //启动休眠线程
        sleepThread.start();
        //启动忙线程
        busyThread.start();
        //休眠5秒，让两个线程充分运行
        SleepUtil.second(5);
        //尝试中断线程
        //只需要调用interrupt方法
        sleepThread.interrupt();
        busyThread.interrupt();
        //查看这两个线程是否被中断了
        System.out.println("SleepThread interrupted is " + sleepThread.isInterrupted());
        System.out.println("BusyThread interrupted is " + busyThread.isInterrupted());
        //防止sleepThread和busyThread立刻退出
        SleepUtil.second(2);
    }
    /**
     * 不断休眠
     */
    static class SleepThread implements Runnable{
        public void run() {
            while (true){
                try {
                    TimeUnit.SECONDS.sleep(10);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }
    /**
     * 不断等待
     */
    static class BusyThread implements Runnable{
        public void run() {
            while (true){
                //忙等待
            }
        }
    }
}
```

执行结果：

可以发现内部不停睡眠的方法执行执行中断后，其中断标志位返回的是false，而一直运行的线程的中断标志位则为true。这里主要由于Sleep方法会抛出InterruptedException异常，所以Java虚拟机把SleepThread的中断标志位复位了，所以才会显示false。

那么使用interrupt方法正确终止线程已经很明显了，代码如下：

```java
package com.ddkk.concurrency;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.TimeUnit;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-2.
 */
public class SafeShutdownThread {
    public static void main(String[] args) throws InterruptedException {
        DateFormat format = new SimpleDateFormat("HH:mm:ss");
        Runner one = new Runner();
        //创建第一个计数线程，该线程使用jdk自带的中断方法执行中断
        Thread threadOne = new Thread(one,"ThreadOne");
        //执行第一个线程
        threadOne.start();
        //threadOne休眠一秒，然后由main thread执行中断
        TimeUnit.SECONDS.sleep(1);
        threadOne.interrupt();
        System.out.println("ThreadOne is interrupted ? " + threadOne.isInterrupted());
        System.out.println("main thread interrupt ThreadOne at " + format.format(new Date()));
        //创建第二个线程，该线程使用cancel方法执行中断
        Runner two = new Runner();
        Thread threadTwo = new Thread(two,"ThreadTwo");
        threadTwo.start();
        //休眠一秒，然后调用cancel方法中断线程
        TimeUnit.SECONDS.sleep(1);
        two.cancel();
        System.out.println("ThreadTwo is interrupted ? " + threadTwo.isInterrupted());
        System.out.println("main thread interrupt ThreadTwo at " + format.format(new Date()));
    }
    /**
     * 该线程是一个计数线程
     */
    private static class Runner implements Runnable{
        //变量i
        private long i;
        //是否继续运行的标志
        //这里使用volatile关键字可以保证多线程并发访问该变量的时候
        //其他线程都可以感知到该变量值的变化。这样所有线程都会从共享
        //内存中取值
        private volatile boolean on = true;
        public void run() {
            while (on && !Thread.currentThread().isInterrupted()){
                i++;
            }
            System.out.println("Count i = " + i);
        }
        //让线程终止的方法
        public void cancel(){
            on = false;
        }
    }
}
```

在计数线程中通过使用一个boolean变量成功终止了线程。这种通过标志位或者中断操作的方式能够使得线程在终止的时候有机会去清理资源，而不是武断地将线程终止，因此这种终止线程的做法更优雅和安全。

上面的程序只是正确地终止了线程，却没有给出正确恢复的方法。可能有人会想到：再写一个方法让on变量为true不就行了。事实并如此，因为在CountThread中，由于已经调用cancel方法，这时on变量已经是false了，线程按照顺序执行原则继续执行，所以即使改变on为true也是没用的，因为CountThread已经终止了。具体的解决方法将在下一篇关于等待通知机制的文章给出详细的解决措施。
