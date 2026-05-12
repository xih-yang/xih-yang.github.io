# 18、Java并发编程：Lock锁
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/18.html
- 分类：Java并发
- 分组：教程目录
**Lock锁简介**

Lock锁机制是JDK 5之后新增的锁机制，不同于内置锁，Lock锁必须显式声明，并在合适的位置释放锁。Lock是一个接口，其由三个具体的实现：ReentrantLock、ReetrantReadWriteLock.ReadLock 和 ReetrantReadWriteLock.WriteLock，即重入锁、读锁和写锁。增加Lock机制主要是因为内置锁存在一些功能上局限性。比如无法中断一个正在等待获取锁的线程，无法在等待一个锁的时候无限等待下去。内置锁必须在释放锁的代码块中释放，虽然简化了锁的使用，但是却造成了其他等待获取锁的线程必须依靠阻塞等待的方式获取锁，也就是说内置锁实际上是一种阻塞锁。而新增的Lock锁机制则是一种非阻塞锁（这点后面还会详细介绍）。

首先我们看看Lock接口的源码：

```java
public interface Lock {
    //无条件获取锁
    void lock();
    //获取可响应中断的锁
    //在获取锁的时候可响应中断，中断的时候会抛出中断异常
    void lockInterruptibly() throws InterruptedException;
    //轮询锁。如果不能获得锁，则采用轮询的方式不断尝试获得锁
    boolean tryLock();
    //定时锁。如果不能获得锁，则每隔unit的时间就会尝试重新获取锁
    boolean tryLock(long time, TimeUnit unit) throws InterruptedException;
    //释放获得锁
    void unlock();
    //获取绑定的Lock实例的条件变量。在等待某个条件变量满足的之
    //前，lock实例必须被当前线程持有。调用Condition的await方法
    //会自动释放当前线程持有的锁
    Condition newCondition();
```

注释写得很详细就不再赘述，可以看出Lock锁机制新增的可响应中断锁和使用公平锁是内置锁机制锁没有的。使用Lock锁的示例代码如下：

```java
Lock lock = new ReentrantLock();
        lock.lock();
        try {
            //更新对象状态
            //如果有异常则捕获异常
            //必要时恢复不变性条件
            //如果由return语句必须放在这里
        }finally {
            lock.unlock();
        }
```

**ReentrantLock与synchronized实现策略的比较**

前面的文章有提到synchronized使用的是互斥锁机制，这种同步机制的最大问题在于当由多个线程需要获取通一把锁的时候只能通过阻塞同步的方式等待已经获得锁的线程自动释放锁。这个过程涉及线程的阻塞和线程的唤醒，这个过程需要在操作系统从用户态切换到内核态完成。那么问题来了，多个线程竞争同一把锁的时候，会引起CPU频繁的上下文切换，效率很低，系统开销也很大。这种策略被称为悲观并发策略，也是synchronized使用的并发策略。

ReentrantLock使用了更为先进的并发策略，既然互斥同步造成的阻塞会影响系统的性能，有没有一种办法不用阻塞也能实现同步呢？并发大师Doug Lea（也是Lock锁的作者）提出了以自旋的方式获得锁。简单来说，如果需要获得锁不存在争用的情况，那么获取成功；如果锁存在争用的情况，那么使用失败补偿措施（jdk 5之后到目前的jdk 8使用的是不断尝试重新获取，直到获取成功）解决争用的矛盾。由于自旋发生在线程内部，所以不用阻塞其他的线程，也就是实现了非阻塞同步。这种策略也称为基于冲突检测的乐观并发策略，也是ReentrantLock使用的并发策略。

简单总结ReentrantLock和synchronized，前者的先进性体现在以下几点：

**1、** 可响应中断的锁当在等待锁的线程如果长期得不到锁，那么可以选择不继续等待而去处理其他事情，而synchronized的互斥锁则必须阻塞等待，不能被中断；

**2、** 可实现公平锁所谓公平锁指的是多个线程在等待锁的时候必须按照线程申请锁的时间排队等待，而非公平性锁则保证这点，每个线程都有获得锁的机会synchronized的锁和ReentrantLock使用的默认锁都是非公平性锁，但是ReentrantLock支持公平性的锁，在构造函数中传入一个boolean变量指定为true实现的就是公平性锁不过一般而言，使用非公平性锁的性能优于使用公平性锁；

**3、** 每个synchronized只能支持绑定一个条件变量，这里的条件变量是指线程执行等待或者通知的条件，而ReentrantLock支持绑定多个条件变量，通过调用lock.newCondition()可获取多个条件变量不过使用多少个条件变量需要依据具体情况确定；

**如何在ReentrantLock和synchronized之间进行选择**

> 在一些内置锁无法满足一些高级功能的时候才考虑使用ReentrantLock。这些高级功能包括：可定时的、可轮询的与可中断的锁获取操作，公平队列，以及非块结构的锁。否则还是应该优先使用synchronized。

这段话是并发大师Brian Goetz的建议。那么，我们来分析一下，为什么在ReentrantLock具有那么多优势的前提下仍然建议优先使用synchronized呢？

首先，内置锁被开发人员锁熟悉（这个理由当然不足以让人信服），而且内置锁的优势在于避免了手动释放锁这一操作。如果在使用ReentrantLock的时候忘记在finally调用unlock了，那么就相当于埋下了一颗定时炸弹，并且影响其他代码的执行（还不够有说服力）。其次，使用内置锁dump线程信息可以帮助分析哪些调用帧获得了哪些锁，并且能够帮助检测和识别发生死锁的线程。这点是ReentrantLock无法做到的（有那么一点说服力了）。最后，synchronized未来还将继续优化，目前的synchronized已经进行了自适应、自旋、锁消除、锁粗化、轻量级锁和偏向锁等方面的优化，在线程阻塞和线程唤醒方面的性能已经没有那么大了。另一方面，ReentrantLock的性能可能就止步于此，未来优化的可能性很小（好吧，我认了）。这点主要是由于synchronized是JVM的内置属性，执行synchronized优化自然顺理成章（嘿嘿，毕竟是亲儿子嘛）。

**使用可中断锁**

可中断锁的使用示例如下：

```java
    ReentrantLock lock = new ReentrantLock();
    ...........
    lock.lockInterruptibly();//获取响应中断锁
    try {
        //更新对象的状态
        //捕获异常,必要时恢复到原来的不变性条件
        //如果有return语句必须放在这里，原因已经说过了
    }finally{
        lock.unlock();
        //锁必须在finally块中释放
    }
```

下面通过一个具体的例子演示如何使用可中断锁：

首先我们看看使用synchronized同步然后尝试进行中断的例子

```java
package com.ddkk.concurrency.r0405;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.TimeUnit;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-5.
 */
public class SyncInterruptDemo {
    //锁对象
    private static Object lock = new Object();
    //日期格式器
    private static DateFormat format = new SimpleDateFormat("HH:mm:ss");
    /**
     * 写数据
     */
    public void write(){
        synchronized (lock){
            System.out.println(Thread.currentThread().getName() + ":start writing data at " + format.format(new Date()));
            long start = System.currentTimeMillis();
            for (;;){
                //写15秒的数据
                if (System.currentTimeMillis() - start > 1000 * 15){
                    break;
                }
            }
            //过了15秒才会运行到这里
            System.out.println(Thread.currentThread().getName() + ":finish writing data at " + format.format(new Date()));
        }
    }
    /**
     * 读数据
     */
    public void read(){
        synchronized (lock){
            System.out.println(Thread.currentThread().getName() + ":start reading data at "
                    + format.format(new Date()));
        }
    }
    /**
     * 执行写数据的线程
     */
    static class Writer implements Runnable{
        private SyncInterruptDemo syncInterruptDemo;
        public Writer(SyncInterruptDemo syncInterruptDemo) {
            this.syncInterruptDemo = syncInterruptDemo;
        }
        public void run() {
            syncInterruptDemo.write();
        }
    }
    /**
     * 执行读数据的线程
     */
    static class Reader implements Runnable{
        private SyncInterruptDemo syncInterruptDemo;
        public Reader(SyncInterruptDemo syncInterruptDemo) {
            this.syncInterruptDemo = syncInterruptDemo;
        }
        public void run() {
            syncInterruptDemo.read();
            System.out.println(Thread.currentThread().getName() + ":finish reading data at "
                    + format.format(new Date()));
        }
    }
    public static void main(String[] args) throws InterruptedException {
        SyncInterruptDemo syncInterruptDemo = new SyncInterruptDemo();
        Thread writer = new Thread(new Writer(syncInterruptDemo),"Writer");
        Thread reader = new Thread(new Reader(syncInterruptDemo),"Reader");
        writer.start();
        reader.start();
        //运行5秒，然后尝试中断读线程
        TimeUnit.SECONDS.sleep(5);
        System.out.println(reader.getName() +":I don't want to wait anymore at " + format.format(new Date()));
        //中断读的线程
        reader.interrupt();
    }
}
```

运行结果如下：

从结果可以看到，尝试在读线程运行5秒后中断它，发现无果，因为写线程需要运行15秒，sleep5秒后过了10秒（sleep的5秒加上10刚好是写线程的15秒）读线程才显示中断的信息，意味着在写线程释放锁之后才响应了主线程的中断事件，也就是说在synchronized代码块运行期间不允许被中断，这点也验证了上面对synchronized的讨论。

然后我们使用ReentrantLock试一下，读线程能否正常响应中断，根据分析，在读线程运行5秒后，主线程中断读线程的时候读线程应该能够正常响应中断，然后停止执行读数据的操作。我们看看代码：

```java
package com.ddkk.concurrency.r0405;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-5.
 */
public class LockInterruptDemo {
    //锁对象
    private static Lock lock = new ReentrantLock();
    //日期格式器
    private static DateFormat format = new SimpleDateFormat("HH:mm:ss");
    /**
     * 写数据
     */
    public void write() {
        lock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + ":start writing data at "
                    + format.format(new Date()));
            long start = System.currentTimeMillis();
            for (;;){
                if (System.currentTimeMillis() - start > 1000 * 15){
                    break;
                }
            }
            System.out.println(Thread.currentThread().getName() + ":finish writing data at "
                    + format.format(new Date()));
        }finally {
            lock.unlock();
        }
    }
    /**
     * 读数据
     */
    public void read() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            System.out.println(Thread.currentThread().getName() + ":start reading data at "
                    + format.format(new Date()));
        }finally {
            lock.unlock();
        }
    }
    /**
     * 执行写数据的线程
     */
    static class Writer implements Runnable {
        private LockInterruptDemo lockInterruptDemo;
        public Writer(LockInterruptDemo lockInterruptDemo) {
            this.lockInterruptDemo = lockInterruptDemo;
        }
        public void run() {
            lockInterruptDemo.write();
        }
    }
    /**
     * 执行读数据的线程
     */
    static class Reader implements Runnable {
        private LockInterruptDemo lockInterruptDemo;
        public Reader(LockInterruptDemo lockInterruptDemo) {
            this.lockInterruptDemo = lockInterruptDemo;
        }
        public void run() {
            try {
                lockInterruptDemo.read();
                System.out.println(Thread.currentThread().getName() + ":finish reading data at "
                        + format.format(new Date()));
            } catch (InterruptedException e) {
                System.out.println(Thread.currentThread().getName() + ": interrupt reading data at "
                        + format.format(new Date()));
            }
            System.out.println(Thread.currentThread().getName() + ":end reading data at "
                    + format.format(new Date()));
        }
    }
    public static void main(String[] args) throws InterruptedException {
        LockInterruptDemo lockInterruptDemo = new LockInterruptDemo();
        Thread writer = new Thread(new Writer(lockInterruptDemo), "Writer");
        Thread reader = new Thread(new Reader(lockInterruptDemo), "Reader");
        writer.start();
        reader.start();
        //运行5秒，然后尝试中断
        TimeUnit.SECONDS.sleep(5);
        System.out.println(reader.getName() + ":I don't want to wait anymore at " + format.format(new Date()));
        //中断读的线程
        reader.interrupt();
    }
}
```

运行结果如下：

显然，读线程正常响应了我们的中断，因为读线程输出了中断信息，即使写线程写完数据后，读线程也没有输出结束读数据的信息，这点是在我们意料之中的。这样也验证了可中断锁的分析。
