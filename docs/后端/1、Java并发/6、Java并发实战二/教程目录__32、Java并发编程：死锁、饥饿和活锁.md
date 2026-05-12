# 32、Java并发编程：死锁、饥饿和活锁
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/32.html
- 分类：Java并发
- 分组：教程目录
死锁发生在一个线程需要获取多个资源的时候，这时由于两个线程互相等待对方的资源而被阻塞，死锁是最常见的活跃性问题。这里先分析死锁的情形：

假设当前情况是线程A已经获取资源R1，线程B已经获取资源R2，之后线程A尝试获取资源R2，这个时候因为资源R2已经被线程B获得了，所以线程A只能阻塞直到线程B释放资源R2。另一方面，线程B在已经获得资源R2的前提下尝试获取由线程A持有的资源R1，那么由于资源R1已经被线程A持有了，那么线程B只能被阻塞直到线程A释放资源R1。这样线程A和线程B都在等待对方持有的资源，就造成了死锁。这种情形由一个专业术语：顺序死锁。还有动态死锁、协作死锁以及资源死锁，其实本质都一样：都因为在等待被其他线程占有的资源而造成整个程序无法继续向下执行。

下面的程序演示了顺序死锁的情形：

```java
package com.ddkk.concurrency;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.TimeUnit;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-3.
 */
public class DeadLock {
    private static DateFormat format = new SimpleDateFormat("HH:mm:ss");
    public synchronized void tryOther(DeadLock other) throws InterruptedException {
        System.out.println(Thread.currentThread().getName() + " enter tryOther method at " + format.format(new Date()));
        TimeUnit.SECONDS.sleep(3);
        System.out.println(Thread.currentThread().getName() + " tryOther method is about to invoke other method at " + format.format(new Date()));
        other.other();
    }
    public synchronized void other() throws InterruptedException {
        System.out.println(Thread.currentThread().getName() + " enter other method at " + format.format(new Date()));
        TimeUnit.SECONDS.sleep(3);
    }
    public static void main(String[] args) throws InterruptedException {
        final DeadLock d1 = new DeadLock();
        final DeadLock d2 = new DeadLock();
        Thread t1 = new Thread(new Runnable() {
            public void run() {
                try {
                    d1.tryOther(d2);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "threadA");
        Thread t2 = new Thread(new Runnable() {
            public void run() {
                try {
                    d2.tryOther(d1);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "threadB");
        t1.start();
        //让threadA先运行一秒
        TimeUnit.SECONDS.sleep(1);
        t2.start();
        //运行10秒后尝试中断线程
        TimeUnit.SECONDS.sleep(10);
        t1.interrupt();
        t2.interrupt();
        System.out.println("Is threadA is interrupted? " + t1.isInterrupted());
        System.out.println("Is threadB is interrupted? " + t2.isInterrupted());
    }
}
```

运行结果如下：

可以看到在threadA和threadB并没有进入到other方法中，说明程序发生了死锁，threadA在等待threadB的资源，threadB在等待threadA的资源（这里由于使用了同步方法，所以资源确切地说是指d1和d2的对象级别锁）而导致了死锁。虽然在Java中没有很好避免死锁的方法，但是在编程时遵循一些规则有利于最大限度降低死锁的发生：

**1、** 尽可能减小锁的作用范围，比如使用同步代码块而不使用同步方法；

**2、** 尽量不编写在通时刻获取多个锁的代码，因为在一个线程持有多个资源的时候很容易发生死锁；

**3、** 根据情况将过大范围的锁进行切分，让每个锁的作用范围减小，从而降低死锁发生的概率这以原则的典型应用是ConcurrentHashMap的锁分段技术，具体可以参看这篇文章；

**饥饿**指的线程无法访问到它需要的资源而不能继续执行时，引发饥饿最常见资源就是CPU时钟周期。虽然在Thread API中由指定线程优先级的机制，但是只能作为操作系统进行线程调度的一个参考，换句话说就是操作系统在进行线程调度是平台无关的，会尽可能提供公平的、活跃性良好的调度，那么即使在程序中指定了线程的优先级，也有可能在操作系统进行调度的时候映射到了同一个优先级。通常情况下，不要区修改线程的优先级，一旦修改程序的行为就会与平台相关，并且会导致饥饿问题的产生。在程序中使用的Thread.yield或者Thread.sleep表明该程序试图客服优先级调整问题，让优先级更低的线程拥有被CPU调度的机会。

**活锁**指的是线程不断重复执行相同的操作，但每次操作的结果都是失败的。尽管这个问题不会阻塞线程，但是程序也无法继续执行。活锁通常发生在处理事务消息的应用程序中，如果不能成功处理这个事务那么事务将回滚整个操作。解决活锁的办法是在每次重复执行的时候引入随机机制，这样由于出现的可能性不同使得程序可以继续执行其他的任务。
