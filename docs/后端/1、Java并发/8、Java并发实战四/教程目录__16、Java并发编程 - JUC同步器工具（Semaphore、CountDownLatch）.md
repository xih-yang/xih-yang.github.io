# 16、Java并发编程 - JUC同步器工具（Semaphore、CountDownLatch）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/16.html
- 分类：Java并发
- 分组：教程目录
## 一、Semaphore 信号量

## 1.1 API介绍

> 中间官方代码略。

Semaphore（信号量）是用来控制同时访问特定资源的线程数量，通过协调各个线程，保证合理的使用公共资源。

Semaphore维护了一个许可集，其实就是一定数量的“许可证”。

当有线程想要访问共享资源时，需要先获取(acquire)的许可；如果许可不够了，线程需要一直等待，直到许可可用。当线程使用完共享资源后，可以归还(release)许可，以供其它需要的线程使用。

和ReentrantLock类似，Semaphore支持公平/非公平策略。

## 1.2 源码简析

### AQS共享模型

和ReentrantLock类很相似，底层也是sync，继承于AQS，不过ReentrantLock用的是独占模式，而Semaphore用的是共享模式：

```java
public class Semaphore implements java.io.Serializable {
	...
	//获取
    public void acquire() throws InterruptedException {
        sync.acquireSharedInterruptibly(1);
    }
    //释放
    public void release() {
        sync.releaseShared(1);
    }
	...
}
```

AQS共享模型需要实现的API：

- tryAcquireShared(int)：共享方式。尝试获取资源。负数表示失败；0表示成功，但没有剩余可用资源；正数表示成功，且有剩余资源。
- tryReleaseShared(int)：共享方式。尝试释放资源，如果释放后允许唤醒后续等待结点返回true，否则返回false。

```java
public abstract class AbstractQueuedSynchronizer
    extends AbstractOwnableSynchronizer
    implements java.io.Serializable {
    ...
   	//AQS共享模型尝试获取锁
    public final void acquireSharedInterruptibly(int arg)
            throws InterruptedException {
        if (Thread.interrupted())
            throw new InterruptedException();
        if (tryAcquireShared(arg) < 0) //获取许可,结果小于0则获取失败
            doAcquireSharedInterruptibly(arg);//获取失败加入等待队列
    }
    //AQS共享模型释放锁
    public final boolean releaseShared(int arg) {
        if (tryReleaseShared(arg)) {
     //尝试释放
            doReleaseShared();//唤醒等待的线程
            return true;
        }
        return false;
    }
    ...
}
```

[Java并发之AQS详解](https://www.cnblogs.com/waterystone/p/4920797.html)

[AQS深入理解 doReleaseShared源码分析 JDK8](https://blog.csdn.net/anlian523/article/details/106319538/)

### Semaphore中的实现

看下Semaphore的实现：

```java
public class Semaphore implements java.io.Serializable {
	...
    /**
     * NonFair version 非公平
     */
    static final class NonfairSync extends Sync {
        private static final long serialVersionUID = -2694183684443567898L;
        NonfairSync(int permits) {
        	//初始信号量个数，父类会调用aqs的setState方法
            super(permits);
        }
        protected int tryAcquireShared(int acquires) {
        	//nonfairTryAcquireShared方法实现在父类Sync中
            return nonfairTryAcquireShared(acquires);
        }
    }
    abstract static class Sync extends AbstractQueuedSynchronizer {
		...
        final int nonfairTryAcquireShared(int acquires) {
            for (;;) {
                int available = getState();//获取许可个数
                int remaining = available - acquires;//剩余的许可数 - 要获取的许可数
                if (remaining < 0 ||
                    compareAndSetState(available, remaining))
                    return remaining;//不够返回负数，够返回剩余许可数
            }
        }
        //释放
        protected final boolean tryReleaseShared(int releases) {
            for (;;) {
                int current = getState();
                int next = current + releases;
                if (next < current) // overflow
                    throw new Error("Maximum permit count exceeded");
                if (compareAndSetState(current, next))
                    return true;
            }
        }
        ...
	}
    /**
     * Fair version 公平
     */
    static final class FairSync extends Sync {
        private static final long serialVersionUID = 2014338818796000944L;
        FairSync(int permits) {
            super(permits);
        }
        protected int tryAcquireShared(int acquires) {
            for (;;) {
                if (hasQueuedPredecessors())//判断等待队列是否有线程等待
                    return -1;//有的话直接返回负数代表获取失败，当前线程会进入等待队列
                //后面逻辑就和上面一样了
                int available = getState();
                int remaining = available - acquires;
                if (remaining < 0 ||
                    compareAndSetState(available, remaining))
                    return remaining;
            }
        }
    }
    ...
}
```

## 1.3 案例演示

```java
/**
 * 在信号量上我们定义两种操作：
 * acquire（获取）当一个线程调用acquire操作时，他要么通过成功获取信号量（信号量减1），要么一直等待下去，直到有线程释放信号量，或超时。
 * release（释放）实际上会将信号量加1，然后唤醒等待的线程。
 *
 * 信号量主要用于两个目的，一个是用于多个共享资源的互斥使用，另一个用于并发线程数的控制
 */
public class SemaphoreDemo {
    public static void main(String[] args) {
        Semaphore semaphore = new Semaphore(3);//模拟资源类，有3个空车位
        for (int i = 1; i <= 6; i++) {
            new Thread(()->{
                try{
                    //占有资源
                    semaphore.acquire();
                    System.out.println(Thread.currentThread().getName()+"\t抢到车位");
                    try {
      TimeUnit.SECONDS.sleep(3); } catch (InterruptedException e) {
     e.printStackTrace(); }
                    System.out.println(Thread.currentThread().getName()+"\t停车3秒后离开车位");
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    //释放资源
                    semaphore.release();
                }
            }, String.valueOf(i)).start();
        }
    }
}
```

## 二、CountDownLatch 倒计时门闩

## 2.1 API介绍

CountDownLatch 内部维护了⼀个计数器，只有当计数器==0时，调用await的线程才会停⽌阻塞，开始执⾏。

**官方使用案例1**

下面是两个类，其中一组工作线程使用了两个倒计时锁存:

第一个是启动信号，阻止任何工人继续，直到司机准备好让他们继续;

```java
class Driver {
      // ...
   void main() throws InterruptedException {
     CountDownLatch startSignal = new CountDownLatch(1);
     CountDownLatch doneSignal = new CountDownLatch(N);
     for (int i = 0; i < N; ++i) // create and start threads
       new Thread(new Worker(startSignal, doneSignal)).start();
     doSomethingElse();            // don't let run yet
     startSignal.countDown();      // let all threads proceed
     doSomethingElse();
     doneSignal.await();           // wait for all to finish
   }
 }
 class Worker implements Runnable {
   private final CountDownLatch startSignal;
   private final CountDownLatch doneSignal;
   Worker(CountDownLatch startSignal, CountDownLatch doneSignal) {
     this.startSignal = startSignal;
     this.doneSignal = doneSignal;
   }
   public void run() {
     try {
       startSignal.await();
       doWork();
       doneSignal.countDown();
     } catch (InterruptedException ex) {
     } // return;
   }
   void doWork() {
      ... }
 }
```

**官方使用案例2**

第二个是一个完成信号，它允许驱动程序等待所有的工人完成。

另一个典型的用法是将一个问题分成N个部分，用一个运行程序来描述每个部分，执行该部分并在latch上倒数，然后将所有的运行程序排队到一个执行程序。当所有的子部分都完成时，协调线程将能够通过await。(当线程必须以这种方式重复计数时，请使用CyclicBarrier。)

```java
 class Driver2 {
      // ...
   void main() throws InterruptedException {
     CountDownLatch doneSignal = new CountDownLatch(N);
     Executor e = ...
     for (int i = 0; i < N; ++i) // create and start threads
       e.execute(new WorkerRunnable(doneSignal, i));
     doneSignal.await();           // wait for all to finish
   }
 }
 class WorkerRunnable implements Runnable {
   private final CountDownLatch doneSignal;
   private final int i;
   WorkerRunnable(CountDownLatch doneSignal, int i) {
     this.doneSignal = doneSignal;
     this.i = i;
   }
   public void run() {
     try {
       doWork(i);
       doneSignal.countDown();
     } catch (InterruptedException ex) {
     } // return;
   }
   void doWork() {
      ... }
 }
```

在多线程协作完成业务功能时，有时候需要等待其他多个线程完成任务之后，主线程才能继续往下执行业务功能，在这种的业务场景下，通常可以使用Thread类的join方法，让主线程等待被join的线程执行完之后，主线程才能继续往下执行。当然，使用线程间消息通信机制也可以完成。其实，java并发工具类中为我们提供了类似“倒计时”这样的工具类，可以十分方便的完成所说的这种业务场景。

CountDownLatch允许一个或多个线程等待其他线程完成工作。

**CountDownLatch相关方法：**

- public CountDownLatch(int count) 构造方法会传入一个整型数N，之后调用CountDownLatch的 countDown 方法会对N减一，直到N减到0的时候，当前调用 await 方法的线程继续执行。
- await() throws InterruptedException：调用该方法的线程等到构造方法传入的N减到0的时候，或者被中断了，才能继续往下执行；
- await(long timeout, TimeUnit unit)：与上面的await方法功能一致，只不过这里有了时间限制，调用该方法的线程等到指定的timeout时间后，不管N是否减至为0，都会继续往下执行；
- countDown()：使CountDownLatch初始值N减1；
- long getCount()：获取当前CountDownLatch维护的值

## 2.2 源码简析

### 同理底层用的AQS共享模型

```java
public class CountDownLatch {
	...
    public void await() throws InterruptedException {
        sync.acquireSharedInterruptibly(1);
    }
    public void countDown() {
        sync.releaseShared(1);
    }
    ...
}
```

```java
public abstract class AbstractQueuedSynchronizer
    extends AbstractOwnableSynchronizer
    implements java.io.Serializable {
    ...
    public final void acquireSharedInterruptibly(int arg)
            throws InterruptedException {
        if (Thread.interrupted())
            throw new InterruptedException();
        if (tryAcquireShared(arg) < 0)
            doAcquireSharedInterruptibly(arg);//获取锁失败则将当前线程加入等待队列
    }
    public final boolean releaseShared(int arg) {
        if (tryReleaseShared(arg)) {
            doReleaseShared();
            return true;
        }
        return false;
    }
    ...
}
```

### CountDownLatch中的实现

```java
public class CountDownLatch {
    /**
     * Synchronization control For CountDownLatch.
     * Uses AQS state to represent count.
     */
    private static final class Sync extends AbstractQueuedSynchronizer {
        private static final long serialVersionUID = 4982264981922014374L;
        Sync(int count) {
            setState(count);
        }
        int getCount() {
            return getState();
        }
        protected int tryAcquireShared(int acquires) {
        	//只有计数为0才允许获取锁，否则调用await -> tryAcquireShared
        	//的线程会阻塞，进入阻塞队列
            return (getState() == 0) ? 1 : -1;
        }
        protected boolean tryReleaseShared(int releases) {
        	// 每调用一次countDown，releases会传入1
        	// 然后计数-1
            // Decrement count; signal when transition to zero
            for (;;) {
                int c = getState();
                if (c == 0)
                    return false;
                int nextc = c-1;
                if (compareAndSetState(c, nextc))
                    return nextc == 0;//只有0返回true，代表锁释放成功，才会唤醒等待的线程
            }
        }
    }
    ...
}
```

## 2.3 案例演示

模拟如下场景：运动员进行跑步比赛时，假设有6个运动员参与比赛，裁判员在终点会为这6个运动员分别计时，可以想象没当一个运动员到达终点的时候，对于裁判员来说就少了一个计时任务。直到所有运动员都到达终点了，裁判员的任务也才完成。这6个运动员可以类比成6个线程，当线程调用CountDownLatch.countDown方法时就会对计数器的值减一，直到计数器的值为0的时候，裁判员（调用await方法的线程）才能继续往下执行。

```java
public class CountDownLatchTest {
    private static CountDownLatch startSignal = new CountDownLatch(1);
    //用来表示裁判员需要维护的是6个运动员
    private static CountDownLatch endSignal = new CountDownLatch(6);
    public static void main(String[] args) throws InterruptedException {
        ExecutorService executorService = Executors.newFixedThreadPool(6);
        for (int i = 0; i < 6; i++) {
            executorService.execute(() -> {
                try {
                    System.out.println(Thread.currentThread().getName() + " 运动员等待裁判员响哨！！！");
                    startSignal.await();
                    Thread.sleep(1000);
                    System.out.println(Thread.currentThread().getName() + "正在全力冲刺");
                    endSignal.countDown();
                    System.out.println(Thread.currentThread().getName() + "  到达终点");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });
        }
        System.out.println("裁判员响哨开始啦！！！");
        startSignal.countDown();
        endSignal.await();
        System.out.println("所有运动员到达终点，比赛结束！");
        executorService.shutdown();
    }
}
```

该示例代码中设置了两个CountDownLatch，第一个endSignal用于控制让main线程（裁判员）必须等到其他线程（运动员）让CountDownLatch维护的数值N减到0为止，相当于一个完成信号；另一个startSignal用于让main线程对其他线程进行“发号施令”，相当于一个入口或者开关。

startSignal引用的CountDownLatch初始值为1，而其他线程执行的run方法中都会先通过startSignal.await()让这些线程都被阻塞，直到main线程通过调用startSignal.countDown();，将值N减1，CountDownLatch维护的数值N为0后，其他线程才能往下执行，并且，每个线程执行的run方法中都会通过endSignal.countDown();对endSignal维护的数值进行减一，由于往线程池提交了6个任务，会被减6次，所以endSignal维护的值最终会变为0，因此main线程在latch.await();阻塞结束，才能继续往下执行。

注意：当调用CountDownLatch的countDown方法时，当前线程是不会被阻塞，会继续往下执行。
