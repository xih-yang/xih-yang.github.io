# 06、Java并发编程 - JUC介绍、JUC锁（公平锁、非公平锁、可重入锁/递归锁、自旋锁、ReentrantLock）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/6.html
- 分类：Java并发
- 分组：教程目录
## 一、JUC介绍

JUC就是指java.util.concurrent包下的接口、类，为并发编程提供便利。是在JDK 1.5 之后加入的。

我们可以通过官网查看JDK API文档，JDK从9开始按模块划分了，并且文档开始支持搜索功能，所以我们直接看JDK9的文档：

[https://docs.oracle.com/javase/9/docs/api/overview-summary.html](https://docs.oracle.com/javase/9/docs/api/overview-summary.html)

选择java.base：

在这里我们找到关于juc的三个包：

- java.util.concurrent：这个包包括一些小型的标准化可扩展框架，以及一些提供有用功能的类，这些类在其他方面非常繁琐或难以实现。主要包括这些组件：Executors、Queues、Timing、Synchronizers、Concurrent Collections、Memory Consistency Properties。
- java.util.concurrent.atomic：存放原子包装类的包，一个支持在单个变量上进行无锁线程安全编程的类的小工具包。
- java.util.concurrent.locks：存放锁相关的接口、类的包，该包下的接口和类为锁定和等待条件提供了一个框架，这与内置同步和监视器不同。该框架在使用锁和条件方面提供了更大的灵活性，但代价是语法更加笨拙。

从本章开始，我们会按照如下几个模块依次讲解JUC中相关的接口和类：

- **1. 锁（Lock）**
- **2. 原子包装类（Atomic）**
- **3. 并发集合（Concurrent Collections）**
- **4. 阻塞队列（Queues）**
- **5. 同步器工具（Synchronizers）**
- **6. 线程池（Executors）**

## 二、锁

## 2.1 锁介绍

`java.util.concurrent.locks` 包，该包提供了一系列基础的锁工具，用以对synchronizd、wait、notify等进行补充、增强。

juc-locks锁框架中一共就三个接口：Lock（锁）、Condition（条件）、ReadWriteLock（读写锁）。

[https://docs.oracle.com/javase/9/docs/api/java/util/concurrent/locks/package-summary.html](https://docs.oracle.com/javase/9/docs/api/java/util/concurrent/locks/package-summary.html)

真正介绍JUC中的锁前，先来了解一些概念。

## 2.2 锁相关概念

### 公平锁和非公平锁

先看下面这个案例，⼈⼯窗⼝排队购票(回顾)

```java
/**
 * 题目：三个售票员   卖出   30张票
 *
 */
class Ticket{
     //资源类
    //票
    private int number = 30;
    public synchronized void saleTicket(){
        if (number > 0) {
            System.out.println(Thread.currentThread().getName()+"\t卖出第："+(number--)+"\t还剩下："+number);
        }
    }
}
public class SaleTicketDemo {
    public static void main(String[] args) {
        Ticket ticket = new Ticket();
        new Thread(()->{
	        for (int i = 1; i <= 30 ; i++) ticket.saleTicket(); 
        }, "A").start();
        new Thread(()->{
	        for (int i = 1; i <= 30 ; i++) ticket.saleTicket(); 
        }, "B").start();
        new Thread(()->{
	        for (int i = 1; i <= 30 ; i++) ticket.saleTicket(); 
        }, "C").start();
    }
}
```

> synchronized就是非公平锁，谁先抢到CPU执行权谁就先执行

**概念**：所谓**公平锁**，就是多个线程按照**申请锁的顺序**来获取锁，类似排队，先到先得。⽽**⾮公平锁**，则是多个线程抢夺锁，会导致**优先级反转**或**饥饿现象**。

区别：

- 公平锁在获取锁时先查看此锁维护的**等待队列**，**为空**或者当前线程是等待队列的**队⾸**，则直接占有锁，否则插⼊到等待队列，FIFO原则。
- ⾮公平锁⽐较粗鲁，上来直接**先尝试占有锁**，失败则采⽤公平锁⽅式。⾮公平锁的优点是**吞吐量**⽐公平锁更⼤。

`synchronized` 和 `juc.ReentrantLock` 默认都是**⾮公平锁**。 `ReentrantLock` 在构造的时候传⼊`true`则是公平锁。

```java
Lock lock = new ReentrantLock(true)
```

```java
/**
 * 题目：三个售票员   卖出   30张票
 */
class Ticket{
     //资源类
    //票
    private int number = 30;
    Lock lock = new ReentrantLock(true);
    public void saleTicket(){
        try{
            //获取锁
            lock.lock();
            if (number > 0) {
                System.out.println(Thread.currentThread().getName()+"\t卖出第："+(number--)+"\t还剩下："+number);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            //释放锁
            lock.unlock();
        }
    }
}
public class SaleTicketDemo {
    public static void main(String[] args) {
        Ticket ticket = new Ticket();
        new Thread(()->{
	        for (int i = 1; i <= 30 ; i++) ticket.saleTicket(); 
        }, "A").start();
        new Thread(()->{
	        for (int i = 1; i <= 30 ; i++) ticket.saleTicket(); 
        }, "B").start();
        new Thread(()->{
	        for (int i = 1; i <= 30 ; i++) ticket.saleTicket(); 
        }, "C").start();
    }
}
```

这个DEMO不是特别的契合，主要是想描述 **公平锁** 和 **非公平锁**的概念，后面介绍ReentrantLock的时候会有更好的例子。

### 可重⼊锁/递归锁

可重⼊锁⼜叫递归锁，指的是同⼀个线程在**外层⽅法**获得锁后，进⼊**内层⽅法**遇到同一个锁可以直接获取。也就是说，线程可以进⼊任何⼀个它已经拥有锁的代码块。⽐如 method01 ⽅法⾥⾯有 method02 ⽅法，两个⽅法都有同⼀把锁，得到了 method01 的锁，就⾃动得到了 method02 的锁。

可重⼊锁可以**避免死锁**的问题。synchronized和juc的ReentrantLock都是可重入锁。

```java
/**
 * 可重入锁/递归锁
 */
class PhonePlus implements Runnable{
    //Synchronized Test
    public synchronized void sendEmail(){
        System.out.println(Thread.currentThread().getName()+"\t"+"sendEmail");
        sendSMS();
    }
    public synchronized void sendSMS(){
        System.out.println(Thread.currentThread().getName()+"\t"+"sendSMS");
    }
    //ReenTrantLock Test
    Lock lock = new ReentrantLock();
    public void method1(){
        lock.lock();
        try {
            System.out.println(Thread.currentThread().getName()+"\t"+"method1");
            method2();
        } finally {
            lock.unlock();
        }
    }
    public void method2() {
        lock.lock();
        try {
            System.out.println(Thread.currentThread().getName()+"\t"+"method2");
        } finally {
            lock.unlock();
        }
    }
    @Override
    public void run() {
        method1();
    }
}
public class ReentrantLockDemo {
    public static void main(String[] args) {
        PhonePlus phonePlus = new PhonePlus();
		//演示synchronized可重入
        new Thread(()->{
            phonePlus.sendEmail();
        }, "t1").start();
        new Thread(()->{
            phonePlus.sendEmail();
        }, "t2").start();
		//演示ReentrantLock可重入
        Thread t3 = new Thread(phonePlus);
        Thread t4 = new Thread(phonePlus);
        t3.start();
        t4.start();
    }
}
```

> 看到再次获取已经拥有的锁不会阻塞：

**锁的配对**

锁之间要配对，加了⼏把锁，最后就得解开⼏把锁，下⾯的代码编译和运⾏都没有任何问题。但锁的数量不匹配会导致死循环。

```java
lock.lock();
lock.lock();
try{
	someAction();
}finally{
	lock.unlock();
}
```

### ⾃旋锁

所谓⾃旋锁，就是尝试获取锁的线程不会**⽴即阻塞**，⽽是采⽤**循环的⽅式去尝试获取**。⾃⼰在那⼉⼀直循环获取，就像“**⾃旋**”⼀样。这样的好处是减少**线程切换的上下⽂开销**，缺点是会**消耗CPU**。CAS底层的 `getAndAddInt` 就是**⾃旋锁**思想。包括前面介绍的synchronized的轻量级锁。

```java
//跟CAS类似，⼀直循环⽐较。
while (!atomicReference.compareAndSet(null, thread)) {
      }
```

下面这个案例自己实现一个自旋锁：

```java
/**
 * 题目：实现一个自旋锁
 * 自旋锁好处：循环比较获取直到成功为止，没有类似wait的阻塞。
 *
 * 通过CAS操作完成自旋锁，A线程先进来调用myLock方法自己持有锁5秒钟，
 * B随后进来后发现当前有线程持有锁，不是null，所以只能通过自选等待，直到A释放锁后B随后抢到。
 */
public class SpinLockDemo {
    //原子引用（线程）
    AtomicReference<Thread> atomicReference = new AtomicReference<>(); //Thread ==> null
    //获取锁
    public void myLock(){
        Thread currentThread = Thread.currentThread();
        System.out.println(Thread.currentThread().getName()+"\t com in...");
        while(!atomicReference.compareAndSet(null, currentThread)){
     }
    }
    //释放锁
    public void myUnLock(){
        Thread currentThread = Thread.currentThread();
        atomicReference.compareAndSet(currentThread, null);
        System.out.println(Thread.currentThread().getName()+"\t unlock....");
    }
    public static void main(String[] args) {
        SpinLockDemo spinLockDemo = new SpinLockDemo();
        new Thread(()->{
            spinLockDemo.myLock();
            try {
	            TimeUnit.SECONDS.sleep(5); 
            } catch (InterruptedException e) {
	            e.printStackTrace(); 
            }
            spinLockDemo.myUnLock();
        }, "AA").start();
        try {
	        TimeUnit.SECONDS.sleep(1); 
        } catch (InterruptedException e) {
	        e.printStackTrace(); 
        }
        new Thread(()->{
            spinLockDemo.myLock();
            try {
	            TimeUnit.SECONDS.sleep(1); 
            } catch (InterruptedException e) {
	            e.printStackTrace(); 
            }
            spinLockDemo.myUnLock();
        }, "BB").start();
    }
}
```

## 2.3 ReentrantLock

### API介绍

ReentrantLock叫做可重入锁，指的是线程可以重复获取同一把锁，或者说该锁支持一个线程对资源的重复加锁。同时该锁还支持获取锁的公平性和非公平性选择，锁的公平性是指，在绝对时间上，先对锁获取的请求一定先被满足，也就是等待时间最长的那个线程优先获得，可以说，锁的获取是顺序的，即符合FIFO规则。

ReentrantLock也是互斥锁，因此也可以保证原子性。

ReentrantLock 重入锁的基本原理是判断上次获取锁的线程是否为当前线程，如果是则可再次进入临界区，如果不是，则阻塞。

### 源码简析

我们先看ReentrantLock的构造，真正公平和非公平实现是通过FairSync和NonfairSync实现的：

FairSync和NonfairSync都继承自Sync，再继承自AQS：

> 关于AQS，更深入原理可以参考：

[深入分析AQS实现原理](https://segmentfault.com/a/1190000017372067)

[Java并发之AQS详解](https://www.cnblogs.com/waterystone/p/4920797.html#!comments)

由于ReentrantLock是基于AQS实现的，底层通过操作同步状态来获取锁，下面看一下非公平锁获取的实现逻辑：

```java
//java.util.concurrent.locks.ReentrantLock.NonfairSync
final boolean nonfairTryAcquire(int acquires) {
	//获取当前线程
	final Thread current = Thread.currentThread();
	//通过AQS获取同步状态
	int c = getState();
	//同步状态为0，说明临界区处于无锁状态
	if (c == 0) {
		//修改同步状态，即加锁
		//这里体现了非公平锁，每个线程获取锁时会尝试直接抢占加塞一次，
		//而CLH队列中可能还有别的线程在等待
		if (compareAndSetState(0, acquires)) {
			//将当前线程设置为锁的owner
			setExclusiveOwnerThread(current);
			return true;
		}
	}
	//如果临界区处于锁定状态，且上次获取锁的线程为当前线程
	else if (current == getExclusiveOwnerThread()) {
     //可重入逻辑
		//则递增同步状态
		int nextc = c + acquires;
		if (nextc < 0) // overflow
			throw new Error("Maximum lock count exceeded");
		setState(nextc);
		return true;
	}
	return false;
}
```

公平锁的获取逻辑：

```java
//java.util.concurrent.locks.ReentrantLock.FairSync
protected final boolean tryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
    	//如果此时锁是无锁状态，则先判断同步队列中是否有线程在等待，
    	//只有队列为空才会去尝试获取锁，这里就体现了公平的特性！！
        if (!hasQueuedPredecessors() && 
            compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    else if (current == getExclusiveOwnerThread()) {
     //可重入逻辑
        int nextc = c + acquires;
        if (nextc < 0)
            throw new Error("Maximum lock count exceeded");
        setState(nextc);
        return true;
    }
    return false;
}
```

成功获取锁的线程再次获取锁，只是增加了同步状态值，在释放同步状态时，相应的减少同步状态值，实现如下：

```java
//java.util.concurrent.locks.ReentrantLock.Sync#tryRelease
protected final boolean tryRelease(int releases) {
	int c = getState() - releases;
	//判断释放锁的是否是当前锁的拥有线程
	if (Thread.currentThread() != getExclusiveOwnerThread())
		throw new IllegalMonitorStateException();
	boolean free = false;
	//在同步状态完全释放了，设置true
	if (c == 0) {
		free = true;
		setExclusiveOwnerThread(null);
	}
	setState(c);
	return free;
}
```

### 案例演示

公平锁和非公平锁的测试：

```java
public class ReentrantLockTest {
    private static Lock fairLock = new ReentrantLockMine(true);
    private static Lock unfairLock = new ReentrantLockMine(false);
    @Test
    public void unfair() throws InterruptedException {
        testLock("unfair lock", unfairLock);
    }
    @Test
    public void fair() throws InterruptedException {
        testLock("fair lock", fairLock);
    }
    private void testLock(String type, Lock lock) throws InterruptedException {
        System.out.println(type);
        for (int i = 0; i < 5; i++) {
            Thread thread = new Thread(new Job(lock)){
                public String toString() {
                	//方便打印观察线程名
                    return getName();
                }
            };
            thread.setName("" + i);
            thread.start();
        }
        Thread.sleep(11000);
    }
    private static class Job implements Runnable{
        private Lock lock;
        public Job(Lock lock) {
            this.lock = lock;
        }
        public void run() {
            for (int i = 0; i < 2; i++) {
                lock.lock();
                try {
                    Thread.sleep(1000);
                    //打印队列中正在等待的线程
                    System.out.println("获取锁的当前线程[" + Thread.currentThread().getName() + "], 同步队列中的线程" + ((ReentrantLockMine)lock).getQueuedThreads() + "");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    lock.unlock();
                }
            }
        }
    }
	//重新实现ReentrantLock类是为了重写getQueuedThreads方法，便于我们试验的观察
    private static class ReentrantLockMine extends ReentrantLock {
        public ReentrantLockMine(boolean fair) {
            super(fair);
        }
        @Override
        protected Collection<Thread> getQueuedThreads() {
        //获取同步队列中的线程
            List<Thread> arrayList = new ArrayList<Thread>(super.getQueuedThreads());
            Collections.reverse(arrayList);
            return arrayList;
        }
    }
}
```

我这里加大了样本数量，不然效果不明显：

非公平锁：完全无序的状态。（其实也不是完全无序，上面源码中可以看出，所谓的无序其实是如果有新的线程尝试获取锁的时候，会先尝试抢占一次，而忽略队列中等待的线程，如果失败了才会加入等待队列）

公平锁：

非公平锁的获取，只要获取了同步状态就可以获取锁，有可能导致饥饿现象，但是非公平锁，线程的切换比较少，更高效。

### ReentrantLock与synchronized的区别

- 重入

synchronized可重入，并且加锁和解锁自动进行，不必担心最后是否释放锁；

ReentrantLock也可重入，但加锁和解锁需要手动进行，且次数需一样，否则其他线程无法获得锁。
- 实现

synchronized是JVM实现的、而ReentrantLock是JDK实现的。说白了就是，是操作系统来实现，还是用户自己敲代码实现。
- 性能

在 Java 的 1.5 版本中，synchronized 性能不如 SDK 里面的 Lock，但 1.6 版本之后，synchronized 做了很多优化（偏向锁、轻量级锁），将性能追了上来。
- 功能

ReentrantLock锁的细粒度和灵活度，优于synchronized。

其他不同点：

- ReentrantLock不同点一：可在构造函数中指定是公平锁还是非公平锁，而synchronized只能是非公平锁。

```java
private static final ReentrantLock reentrantLock = new ReentrantLock(true);
```

- ReentrantLock不同点二：可以避免死锁问题，因为它可以非阻塞地获取锁。如果尝试获取锁失败，并不进入阻塞状态，而是直接返回false，这时候线程不用阻塞等待，可以先去做其他事情。所以不会造成死锁。

```java
// 支持非阻塞获取锁的 API
boolean tryLock();
```

tryLock还支持超时。调用tryLock时没有获取到锁，会等待一段时间，如果线程在一段时间之内还是没有获取到锁，不是进入阻塞状态，而是直接返回false，那这个线程也有机会释放曾经持有的锁，这样也能破坏死锁不可抢占条件。

```java
boolean tryLock(long time, TimeUnit unit)
```

- ReentrantLock不同点三：提供能够中断等待锁机制。

synchronized 的问题是，持有锁 A 后，如果尝试获取锁 B 失败，那么线程就进入阻塞状态，一旦发生死锁，就没有任何机会来唤醒阻塞的线程。

但如果阻塞状态的线程能够响应中断信号，也就是说当我们给阻塞的线程发送中断信号的时候，能够唤醒它，那它就有机会释放曾经持有的锁 A。ReentrantLock可以用`lockInterruptibly`方法来实现。

- ReentrantLock不同点四：可以用J.U.C包中的Condition实现分组唤醒需要等待的线程。而synchronized只能notify或者notifyAll。
