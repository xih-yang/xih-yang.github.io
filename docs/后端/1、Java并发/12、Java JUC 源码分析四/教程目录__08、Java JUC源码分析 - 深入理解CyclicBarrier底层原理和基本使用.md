# 08、Java JUC源码分析 - 深入理解CyclicBarrier底层原理和基本使用
- 来源：https://ddkk.com/zhuanlan/java/concurrency/12/8.html
- 分类：Java并发
- 分组：教程目录
## 一，深入理解CyclicBarrier的底层原理

在前面两篇讲述了Semaphore和CountDownLatch两个并发工具类，都是通过CLH等待队列实现的，接下来讲解第三个常用的并发工具类：**CyclicBarrier** ，该类与前二者不同，除了使用CLH同步等待队列 外，还用了条件等待队列来实现的，接下来详细的描述一下该类的基本语法和底层的源码实现。

顾名思义，可以被称为循环屏障，屏障指的是可以让多个线程在满足某一个条件的时候，再全部的同时执行，有点类似于之前的内存屏障，循环指的是这个条件可以一直循环的使用

### 1，CyclicBarrier的基本使用

先举一个简单的例子，了解一下这个工具类是如何使用的。在此之前，先定义一个线程池，通过线程池工具类来管理线程

```java
package com.zhs.study.util;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.concurrent.*;
/**
 * 线程池工具
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date : 2023/9/27
 */
public class ThreadPoolUtil {
    //日志级别(由高到低)：fatal -> error -> warn -> info -> debug,低级别的会输出高级别的信息，高级别的不会输出低级别的信息
    private static final Logger log = LoggerFactory.getLogger(ThreadPoolUtil.class);
    //构建线程池
    public static ThreadPoolExecutor pool = null;
    //向线程池中添提交任务,将任务返回
    //判断核心线程数数量，阻塞队列，创建非核心线程数，拒绝策略
    public static <T> Future<?> submit(Runnable runnable) {
        //提交任务，并将任务返回
        Future<?> future = getThreadPool().submit(runnable);
        //将任务存储在hash表中
        return future;
    }
    /**
     * io密集型：最大核心线程数为2N,可以给cpu更好的轮换，
     *           核心线程数不超过2N即可，可以适当留点空间
     * cpu密集型：最大核心线程数为N或者N+1，N可以充分利用cpu资源，N加1是为了防止缺页造成cpu空闲，
     *           核心线程数不超过N+1即可
     * 使用线程池的时机：1,单个任务处理时间比较短 2,需要处理的任务数量很大
     */
    public static synchronized ThreadPoolExecutor getThreadPool() {
        if (pool == null) {
            //获取当前机器的cpu
            int cpuNum = Runtime.getRuntime().availableProcessors();
            log.info("当前机器的cpu的个数为：" + cpuNum);
            int maximumPoolSize = cpuNum * 2 ;
            pool = new ThreadPoolExecutor(
                    maximumPoolSize - 2,
                    maximumPoolSize,
                    5L,   //5s
                    TimeUnit.SECONDS,
                    new LinkedBlockingQueue<>(),  //链表无界队列
                    Executors.defaultThreadFactory(), //默认的线程工厂
                    new ThreadPoolExecutor.AbortPolicy());  //直接抛异常，默认异常
        }
        return pool;
    }
}
```

接下来再自定义一个线程任务类，内部定义具体的run方法的实现

```java
package com.zhs.study.juc.aqs;
import java.util.concurrent.CyclicBarrier;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date : 2023/9/27
 */
public class Task implements Runnable {
    CyclicBarrier cyclicBarrier;
    //通过构造方法传参，保证拿到的是同一个对象
    public Task(CyclicBarrier cyclicBarrier){
        this.cyclicBarrier = cyclicBarrier;
    }
    @Override
    public void run() {
        try {
            System.out.println(Thread.currentThread().getName()
                    + "开始等待其他线程");
            cyclicBarrier.await();
            System.out.println(Thread.currentThread().getName() + "开始执行");
            //TODO 模拟业务处理
            Thread.sleep(5000);
            System.out.println(Thread.currentThread().getName() + "执行完毕");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

接下来定义一个main方法执行这个代码

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date : 2023/9/27
 */
public class CyclicBarrierDemo {
    //创建一个线程池
    static ThreadPoolExecutor threadPool = ThreadPoolUtil.getThreadPool();
    public static void main(String[] args) {
        CyclicBarrier cyclicBarrier = new CyclicBarrier(5);
        //创建20个线程任务
        for (int i = 0; i < 20; i++) {
            //创建任务
            Task task = new Task(cyclicBarrier);
            //提交任务
            threadPool.submit(task);
        }
    }
}
```

查看执行结果如下

> 14:36:50.581 [main] INFO com.zhs.study.util.ThreadPoolUtil - 当前机器的cpu的个数为：4
>
> pool-1-thread-1开始等待其他线程
>
> pool-1-thread-2开始等待其他线程
>
> pool-1-thread-3开始等待其他线程
>
> pool-1-thread-4开始等待其他线程
>
> pool-1-thread-5开始等待其他线程
>
> pool-1-thread-5开始执行
>
> pool-1-thread-1开始执行
>
> pool-1-thread-6开始等待其他线程
>
> pool-1-thread-2开始执行
>
> pool-1-thread-4开始执行
>
> …

主要就是当线程累加到5个之后，就会通过这个屏障执行以下的业务，如果没有达到5个，就会被阻塞着。与CountDownLatch的底层实现不同，后者是通过减法的方式实现业务，而循环屏障使用的是加法，并且循环屏障的参数是可以循环使用的，而CountDownLatch不能。

### 2，CyclicBarrier的底层源码实现

接下来研究一下**CyclicBarrier** 这个类，先查看一下这个类中的部分属性和构造方法。内部引入了ReentrantLock和trip条件队列对象，并且定义了一个重置内存屏障的对象，在构造方法中，除了引用一个正常的类加的数据之外，还引入了一个副本参数，用于循环使用

```java
public class CyclicBarrier {
    //用于重置内存屏障
    private static class Generation {
        boolean broken = false;
    }
    //引入了ReentrantLock锁，因此有AQS的所有特性以及该锁的特性
    private final ReentrantLock lock = new ReentrantLock();
    //条件对象，用于构建条件等待队列
    private final Condition trip = lock.newCondition();
    //构造方法如下
	public CyclicBarrier(int parties, Runnable barrierAction) {
    	if (parties <= 0) throw new IllegalArgumentException();
    	this.parties = parties;		//外部传入参数的副本，用于循环使用
    	this.count = parties;		//外部参数的个数，用于累计
    	this.barrierCommand = barrierAction;	//线程任务，优先级更高
    }
}
```

在初步的熟悉了这个类之后，还是得通过这个 **await** 了解底层到底第如何实现的

```java
cyclicBarrier.await();
```

接下来进入这个await方法内部，在源码中，一般真正干活的方法，都是以do开头的方法

```java
public int await() throws InterruptedException, BrokenBarrierException {
    try {
        return dowait(false, 0L);	//真正干活的方法
    } catch (TimeoutException toe) {
        throw new Error(toe); // cannot happen
    }
}
```

在这个**dowait** 方法中，这个方法内部逻辑是比较多的，如下图，接下来会一段一段的分析这里面的方法

#### 2.1，lock加锁操作

首先在该方法中定义了一把ReentrantLock锁，并进行了一个加锁的操作。这个操作其实也不难理解，因为在条件等待队列中，需要加锁在能阻塞，就类似于使用wait方法时，必须在外层加synchronized关键字的

```java
final ReentrantLock lock = this.lock;
lock.lock();	//独占锁
```

#### 2.2，条件队列入队操作

如在CyclicBarrier构造方法中，会有一个count用于做具体的执行操作，因此在这会有一个自减的操作，如果这个count的自减操作的值不为0，那么会继续进入下面这个for循环的自旋操作，首先会有一个trip.await方法用于条件等待队列进行入队操作

```java
int index = --count;			//自减操作
for (;;) {
    try {
        //trip是一个条件等待队列对象，调用的这个await是条件等待的入队和阻塞
        if (!timed) trip.await();	
        else if (nanos > 0L) nanos = trip.awaitNanos(nanos);
    } catch (InterruptedException ie) {
        if (g == generation && ! g.broken) {
            breakBarrier();
            throw ie;
        } else {
            Thread.currentThread().interrupt();
        }
    }
    if (g.broken) throw new BrokenBarrierException();
    if (g != generation) return index;
    if (timed && nanos <= 0L) {
        breakBarrier();
        throw new TimeoutException();
    }
}
```

接下来查看这个await方法的具体实现，里面首先会有一个**addConditionWaiter** 结点入队的操作

```java
public final void await() throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    Node node = addConditionWaiter();	//结点入队
    int savedState = fullyRelease(node);	//结点释放锁 
    int interruptMode = 0;
    while (!isOnSyncQueue(node)) {
     		//判断是不是同步等待队列结点
        LockSupport.park(this);			//不是则阻塞
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
            break;
    }
    //被唤醒的结点尝试获取锁
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
        interruptMode = REINTERRUPT;
    if (node.nextWaiter != null) // clean up if cancelled
        unlinkCancelledWaiters();
    if (interruptMode != 0)
        reportInterruptAfterWait(interruptMode);
}
```

这个Node对象是ConditionObject类下面声明的对象，在ConditionObject这个对象中，只对了Node结点的头指针和尾指针，因此组成这个**条件等待的队列是一个由Node结点组成的单向链表**，CLH同步等待队列中的Node结点和这个Condition条件等待队列的Node结点是同一个类的对象，只是实现两种队列的结构不一样。

```java
public class ConditionObject implements Condition, java.io.Serializable {
    private static final long serialVersionUID = 1173984872572414699L;
    //定义头结点
    private transient Node firstWaiter;
    //定义尾结点
    private transient Node lastWaiter;
	...
}
```

结点入队的操作如下，首先会先修改Node结点的状态为-2条件等待状态，其次会判断这个单向链表是否存在，如果存在则直接将结点加入到单向链表的尾部，如果不存在则直接将结点作为头结点。

```java
private Node addConditionWaiter() {
    Node t = lastWaiter;	//获取条件等待队列的尾结点
    // If lastWaiter is cancelled, clean out.
    if (t != null && t.waitStatus != Node.CONDITION) {
        unlinkCancelledWaiters();
        t = lastWaiter;			//如果链表存在，则直接将结点插入到尾结点中
    }
    //设置结点的waitStatus为-2，即为条件等待状态
    Node node = new Node(Thread.currentThread(), Node.CONDITION);
    if (t == null) firstWaiter = node;	//如果链表不存在，则创建链表，将头结点设置为当前结点
    else t.nextWaiter = node;			//如果链表存在，则直接将链表接入到队尾即可
    lastWaiter = node;	//将当前结点设置为尾结点
    return node;
}
```

#### 2.3，同步状态器state设置为0

依旧是2.2的await方法中，会有一个 **fullyRelease** 方法，由于在一开始调用了lock方法，这个lock是一把独占锁，其内部也是通过CLH同步等待队列实现，因此也是通过修改state的值来让其他线程可以来抢锁，因此需要通过这个 fullyRelease 方法来实现修改状态的功能。

```java
final int fullyRelease(Node node) {
    boolean failed = true;
    try {
        int savedState = getState();	//此时同步状态器的值为1
        if (release(savedState)) {
     	//释放锁
            failed = false;
            return savedState;
        } else {
            throw new IllegalMonitorStateException();
        }
    } finally {
        if (failed)
            node.waitStatus = Node.CANCELLED;
    }
}
```

主要是通过这个 **release(savedState)** 方法来进行释放锁，最终会调用tryRelease方法，将同步状态器中的state的值设置为0，并且将exclusive的值设置为null，主要从外面进来的线程(非队列中的阻塞线程)就可以去抢锁。

```java
protected final boolean tryRelease(int releases) {
    //外部传参为1，因此 1-1=0
    int c = getState() - releases;
    if (Thread.currentThread() != getExclusiveOwnerThread())
        throw new IllegalMonitorStateException();
    boolean free = false;
    if (c == 0) {
        free = true;
        setExclusiveOwnerThread(null);	//exclusive设置为null
    }
    setState(c);	//设置为0
    return free;
}
```

#### 2.4，条件队列Node结点阻塞

依旧是2.2的await方法中，会有一个判断当前结点是不是同步等待队列中的结点，很明显不是，因此会进入方法内部，就会有一个park方法阻塞的功能

```java
while (!isOnSyncQueue(node)) {
     		//判断是不是同步等待队列结点
    LockSupport.park(this);			//不是则阻塞
    if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
        break;
}
```

#### 2.5，signalAll满足屏障条件进入下一屏障

如果此时的count值被减为0，那么就会跳过这个循环屏障，即可以执行这个循环屏障，并且会判断构造方法的参数中是否有这个线程任务，如果有则优先执行这个线程任务

```java
int index = --count;			//自减操作
if (index == 0) {
       // tripped	//如果此时为0
    boolean ranAction = false;	//设置一个标志位
    try {
        final Runnable command = barrierCommand;	//获取构造方法中的这个参数
        if (command != null)	//判断是否存在自定义的任务线程
            command.run();		//该线程优先级更高，可以先执行
        ranAction = true;		
        nextGeneration();		//进入下一个循环屏障
        return 0;
    } finally {
        if (!ranAction)
            breakBarrier();
    }
}
```

进入下一个循环屏障的nextGeneration方法的具体实现如下，里面会有一个signalAll

```java
private void nextGeneration() {
    // signal completion of last generation
    trip.signalAll();
    // set up next generation
    count = parties;		//副本重置、复原
    generation = new Generation();
}
```

通过下图可以更加直观的分析流程，通过await将Node结点加入到队列，并让结点阻塞，那么可以直接通过这个signalAll方法将结点从同步等待队列中唤醒，但是唤醒之后结点的状态还是-2，因此需要解决park的唤醒，还是得加入到同步等待队列中，通过同步等待队列的唤醒机制，将状态改成-1，才能去抢锁，才能最终的释放锁和唤醒线程。

因此继续分析这个signalAll方法，其实现如下，具体的唤醒方法在doSignalAll中实现，并且首先唤醒的是头结点

```java
public final void signalAll() {
    if (!isHeldExclusively())
        throw new IllegalMonitorStateException();
    Node first = firstWaiter;	//将头结点获取
    if (first != null)
        doSignalAll(first);
}
```

#### 2.6，条件队列结点出队

里面首先会将条件队列的头结点和尾结点置为null，随后通过first结点执向头结点，随后将头结点的下一个结点也置为空，此时头结点出队。随后通过dowhile的方式，会将所有的结点遍历一遍，此时所有的结点出队

```java
private void doSignalAll(Node first) {
    lastWaiter = firstWaiter = null;	//将头结点和尾结点全部置为null	
    do {
        Node next = first.nextWaiter;
        first.nextWaiter = null;	//将头结点的下一个结点也置为null
        transferForSignal(first);
        first = next;	
    } while (first != null);
}
```

#### 2.7，条件队列结点入队同步队列

由于只有同步队列中才能去唤醒线程，因此只能将出队的队列加入到同步等待队列中，因此查看这个transferForSignal方法底层的具体实现。此时会先修改结点的状态，改成0，其次会有一个结点的enq入队操作，前面几篇都有写这个具体实现。

```java
final boolean transferForSignal(Node node) {
    //将结点的-2条件状态改成0默认状态
    if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
        return false;
    //随后结点入队操作
    Node p = enq(node);
    //获取结点的状态
    int ws = p.waitStatus;	
    //如果当前结点的前驱结点为-1，则唤醒
    if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
        LockSupport.unpark(node.thread);	
    return true;
}
```

入队的操作依旧是那些，双向链表不存在则创建，存在则直接将结点加入，随后修改状态为-1可被唤醒状态，随后结点阻塞，详细可以看前面三篇文章

#### 2.8，unlock解锁

在所有流程走完之后，会在finally里面有一个解锁的方法

```java
lock.unlock();
```

此时结点已经从条件队列中入队到同步等待队列中，此时条件等待队列的结点都是处于阻塞的，并且状态都为-1，因此需要通过这个unlock方法，去对里面的对象进行唤醒和出队的功能，内部最终会调用这个unpark这个方法

```java
LockSupport.unpark(s.thread);
```

在被唤醒之后，又会调用这个**acquireQueued** 进行一个获取锁的功能，这里的抢锁时之际通过cas获取锁的

```java
acquireQueued()
```

获取锁之后，进入同步队列的结点出队。(同步队列的具体实现看前两篇，写烂了…)

```java
setHead(node);
p.next = null; // help GC
failed = false;
```

通过unlock方法，可以不断的出队和唤醒下一个线程，这样就能将进入同步队列的条件队列结点给全部唤醒，这样就可以执行参数定义为n个线程了。

### 3，总结

在整个流程中，可以发现在刚进入是需要加lock获取锁，在await方法中，当结点进入条件队列之后有会释放锁，然后在条件队列结点进入同步队列时又会去抢锁，然后在执行完毕时又会释放锁，总共会有两次加锁和解锁的过程

> 第一次lock获取锁：配合await使用
>
> 第一次await释放锁：将state的值置为0，允许外部线程和同步队列线程结点抢锁
>
> 第二次获取锁：条件队列结点进入同步队列时，抢锁成功执行逻辑，失败进入同步队列阻塞
>
> 第二次unlock释放锁：同步队列执行完逻辑之后，需要唤醒同步队列中阻塞的结点

循环屏障是通过ReentrantLock和条件队列配合使用的，ReentrantLock中底层通过AQS实现，因此满足了同步队列和条件队列的同时使用。

**整个流程可以总结如下：**

首先可以在循环屏障中定义一个参数用于表示需要满足的条件，随后线程会调用这个await方法，先通过lock进行一个加锁操作，随后结点会进入条件等待队列，此时结点的状态为-2，在结点阻塞之后，会将同步状态器的state值改成0，锁就进行了释放，此时就会允许外部的线程进行一个抢锁的操作；

当满足这个循环屏障的条件的时候，此时就会进入下一个循环屏障，那么就需要将条件队列的结点进行一个出队的操作，由于唤醒线程只有在同步队列中实现，因此还要将结点加入到同步队列中，入队时又会有一个cas锁的操作，如果抢锁成功，则执行逻辑，如果抢锁失败，则加入到同步队列中并阻塞，当获取锁成功之后，需要结点出队并且唤醒同步队列中被阻塞的结点，因此需要调用最终的unlock方法
