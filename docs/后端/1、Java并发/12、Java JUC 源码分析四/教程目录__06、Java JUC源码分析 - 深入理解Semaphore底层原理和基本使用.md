# 06、Java JUC源码分析 - 深入理解Semaphore底层原理和基本使用
- 来源：https://ddkk.com/zhuanlan/java/concurrency/12/6.html
- 分类：Java并发
- 分组：教程目录
## 一、深入理解Semaphore的底层原理和基本使用

在上一篇中，讲解了AQS和ReentrantLock的底层原理和基本使用，除了这个Reentrant锁是AQS实现之外，还有很多线程协作的并发工具类也是通过这个AQS的底层来实现的，如**CountDownLatch、Semaphore和CyclicBarrier** 等，接下来要讲解的主角就是 **Semaphore**

在很多限流的工具类中，其底层实现都是采用这个Semaphore信号量来实现的，如sentinel等，其内部是通过PV操作来实现线程间的同步和互斥的。接下来先通过代码举一个例子，看看这个Semaphore信号量是如何使用的

在后续讲解源码时，一定得先看上一篇AQS的底层实现。

### 1，代码举例

首先先建议一个线程池工具类，线程池部分参数设置如下，假设这是一个io密集型的线程，因此设置最大线程数为空闲处理器的两倍(一个cpu对应两个处理器)，队列为链表阻塞队列。

```java
package com.zhs.study.util;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.concurrent.*;
/**
 * 线程池工具
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date : 2023/9/15
 */
public class ThreadPoolUtil {
    //日志级别(由高到低)：fatal -> error -> warn -> info -> debug,低级别的会输出高级别的信息，高级别的不会输出低级别的信息
    private static final Logger log = LoggerFactory.getLogger(ThreadPoolUtil.class);
    //构建线程池
    public static ThreadPoolExecutor pool = null;
    //向线程池中添提交任务,无参数返回
    //判断核心线程数数量，阻塞队列，创建非核心线程数，拒绝策略
    public static void execute(Runnable runnable) {
        getThreadPool().execute(runnable);
    }
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

接下来定义一个线程任务类，里面设置这个Semaphore为全局对象，由于需要返回数据，因此可以实现这个Callable接口，如果不需要的话也可以直接实现这个Runnable接口。在call方法中，通过acquire去获取锁，通过release去释放锁，通过sleep睡眠3秒中模拟业务逻辑

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date : 2023/9/15
 */
@Data
public class AqsTask implements Callable, Serializable {
    private Integer x;
    private Integer y;
    //信号量
    Semaphore semaphore;
    public AqsTask(int x,int y,Semaphore semaphore){
        this.x = x;
        this.y = y;
        this.semaphore = semaphore;
    }
    @Override
    public Object call() throws Exception {
        semaphore.acquire();  	//获取锁
        if (semaphore.availablePermits() == 2) System.out.println("=============开始抢锁=============");
        System.out.println(Thread.currentThread().getName() + "拿到锁");
        Thread.sleep(3000);		//模拟业务逻辑
        semaphore.release();	//释放锁
        return x+y;				//返回数据
    }
}
```

接下来定义一个测试类，创建一个线程池和一个信号量锁，假设此时只允许三个线程在一段时间内同时获取锁

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date : 2023/9/15
 */
public class SemaphoreTest {
    //创建一个线程池
    static ThreadPoolExecutor threadPool = ThreadPoolUtil.getThreadPool();
    //信号量锁
    static Semaphore semaphore = new Semaphore(3);
    //主线程
    public static void main(String[] args) {
        //创建三个信号量
        for (int i = 0; i < 10; i++) {
            //创建一个任务
            AqsTask aqsTask = new AqsTask(i,i,semaphore);
            try {
                Future<?> future = threadPool.submit(aqsTask);
            } catch (Exception e){
                e.printStackTrace();
            }
        }
    }
}
```

最终打印结果如下，就是每次只有三个线程可以在同一个时间段可以拿到锁。限流就是的底层原理就是这种，通过互斥+信号量的方式来实现底层获取锁的逻辑

```java
11:41:50.319 [main] INFO com.zhs.study.util.ThreadPoolUtil - 当前机器的cpu的个数为：4
=============开始抢锁=============
pool-1-thread-1拿到锁
pool-1-thread-2拿到锁
pool-1-thread-3拿到锁
=============开始抢锁=============
pool-1-thread-4拿到锁
pool-1-thread-5拿到锁
pool-1-thread-6拿到锁
=============开始抢锁=============
...
```

### 2，Semaphore底层源码剖析

在这个**Semaphore** 类中，是一个顶层类，没有实现其他的接口

```java
public class Semaphore implements java.io.Serializable {
     ...}
```

但是在这个类内部，是和reentrantLock一样，通过组合的方式将AQS整合进来，内部有一个Sync的静态内部类继承了AQS这个接口，并且该类有两个子类，实现了公平锁类和非公平锁类

![](https://img-blog.csdnimg.cn/10879217fbb84161b9789ee81b464c16.png)

接下来查看这个类的构造方法，permits表示的是信号量的个数，即一段时间内限流的个数，默认使用的是非公平锁，非公平锁可以减少Node结点的阻塞时间，其效率相对较高。也可以手动通过参数设置是公平锁还是非公平锁

```java
public Semaphore(int permits) {
    sync = new NonfairSync(permits);
}
public Semaphore(int permits, boolean fair) {
    sync = fair ? new FairSync(permits) : new NonfairSync(permits);
}
```

通过以下代码，来对整个流程进行分析

```java
Semaphore semaphore = new Semaphore(3);   	//初始化信号量
semaphore.acquire();						//抢锁
semaphore.release();						//释放锁
```

#### 2.1，尝试获取锁

首先进入这个 **acquire** 方法，可以发现内部获取的是一把share的共享锁

```java
public void acquire() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
```

接下来进入这个 **acquireSharedInterruptibly** 尝试获取锁的方法，内部主要会验证该线程是否被中断

```java
public final void acquireSharedInterruptibly(int arg)
        throws InterruptedException {
    if (Thread.interrupted()) //验证当前线程是否处于中断状态
        throw new InterruptedException();
    if (tryAcquireShared(arg) < 0) //尝试获取锁
        doAcquireSharedInterruptibly(arg);
}
```

如果当前线程不是中断状态，那么就会调用 **tryAcquireShared** 方法尝试获取这把共享锁

```java
protected int tryAcquireShared(int acquires) {
    //非公平锁尝试获取锁
    return nonfairTryAcquireShared(acquires);
}
```

其获取锁的底层逻辑如下，这个state是AQS类中的属性，在Semaphore的同步监视器中，信号量的个数会等于同步监视器中state的个数，因此会通过getstate验证此时状态的个数，即可抢锁线程的个数。将小于0放在比较和交换的前面，这样在不满足条件是，可以减少比较和交换的次数，从而降低cpu的消耗

```java
final int nonfairTryAcquireShared(int acquires) {
    for (;;) {
        int available = getState(); //获取可以抢锁的线程的个数
        int remaining = available - acquires;  //外部传参为1，因此减1即可
        if (remaining < 0 ||
             //比较和交换状态
            compareAndSetState(available, remaining)) 
            return remaining;
    }
}
```

#### 2.2，结点获取锁失败入队

上面这部分是获取锁的逻辑，将最后的状态返回，返回可以用的信号量个数小于0，那么就会执行这个 **doAcquireSharedInterruptibly** 方法，里面就是阻塞的逻辑

```java
if (tryAcquireShared(arg) < 0) //尝试获取锁
        doAcquireSharedInterruptibly(arg);
```

接下来进入这个 **doAcquireSharedInterruptibly** 方法里面，首先会调用一个 **addWaiter** 方法，

```java
private void doAcquireSharedInterruptibly(int arg)
    throws InterruptedException {
    //入队操作
    final Node node = addWaiter(Node.SHARED);
    ...
}
```

接下来查看这个 **addWaiter** 方法，如果组成CLH同步等待队列的Node双向链表不为空，则直接尾插法入队，如果双向链表是空的，则调用 **enq** 方法，创建一个双向链表，并且入队

```java
private Node addWaiter(Node mode) {
    //创建一个结点，将当前线程作为参数
    Node node = new Node(Thread.currentThread(), mode);
    // Try the fast path of enq; backup to full enq on failure
    Node pred = tail;   //获取尾结点
    if (pred != null) {
     	//如果尾结点不为空
        node.prev = pred;    //则将新加入的结点的前驱指针指向尾结点
        if (compareAndSetTail(pred, node)) {
     	//将新加入的结点作为尾结点
            pred.next = node;	//之前的尾结点的后继指针指向现在加入的新结点
            return node;
        }
    }
    enq(node);  
    return node;
}
```

创建链表的enq方法的底层实现如下，首先会有一个for循环的自旋操作，保证线程一定可以入队。

```java
private Node enq(final Node node) {
    for (;;) {
        Node t = tail;
        //如果尾结点为空
        if (t == null) {
      // Must initialize
            //给头结点定义一个新的结点，自旋+cas实现，实现队列的初始化
            if (compareAndSetHead(new Node()))
                //此时头结点和尾结点是同一个结点
                tail = head;
        } else {
            //当前结点的前驱指针指向尾结点
            node.prev = t;
            //通过比较与交换
            if (compareAndSetTail(t, node)) {
                t.next = node;
                return t;
            }
        }
    }
}
```

#### 2.3，Node结点阻塞

在线程入队成功之后，又会通过一个自旋方法进行阻塞操作，这样可以保证结点一定可以阻塞成功。

```java
private void doAcquireSharedInterruptibly(int arg) throws InterruptedException {
    try {
        //自旋
        for (;;) {
            final Node p = node.predecessor();
            //判断当前结点是不是头结点
            if (p == head) {
                //尝试获取共享锁，会和上面获取锁的逻辑一样
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    failed = false;
                    return;
                }
            }
            //如果不是头结点，则会进行阻塞的操作
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                throw new InterruptedException();
        }
    }
}
```

接下来查看这个park前的方法**shouldParkAfterFailedAcquire** ，里面有一个重要的修改结点状态的方法，将默认的状态修改成可被唤醒的状态

```java
//将当前默认的状态0修改成可被唤醒的状态-1
compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
```

设置完状态之后，会调用这个 **parkAndCheckInterrupt** 方法进行一个park阻塞和线程中断的操作，里面主要是通过这个LockSupport.park() 方法实现

```java
private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);
    return Thread.interrupted();
}
```

#### 2.4，Node结点唤醒

Semaphore信号量是通过调用release方法来实现结点的唤醒机制

```java
public void release() {
    //释放共享锁
    sync.releaseShared(1);
}
```

在这个释放共享锁的方法中，首先会先去尝试释放这个共享锁

```java
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        doReleaseShared();
        return true;
    }
    return false;
}
```

尝试释放共享锁的代码如下，主要是通过这个 **tryReleaseShared** 方法实现。内部是一个自旋操作，由于此时锁全被占用完，此时state的值为0，然后+1操作，让这个state变为1，随后通过比较与交换操作，将同步监视器中的state值修改成1，由于这个state用了volatile修饰，从而保证了可见性，那么就会让新的线程来抢锁

```java
protected final boolean tryReleaseShared(int releases) {
    for (;;) {
        int current = getState();		//此时为0
        int next = current + releases;	//修改成1
        if (next < current) // overflow
            throw new Error("Maximum permit count exceeded");
        if (compareAndSetState(current, next))	//比较和交换操作
            return true;
    }
}
```

虽然锁是可以被抢了，但是结点是被阻塞的，只有被唤醒才能来抢锁。因此继续看这个 **doReleaseShared** 方法，其逻辑如下。主要是会修改结点的状态，将被唤醒状态改成默认的初始状态，随后调用 **unparkSuccessor** 方法进行一个唤醒的操作

```java
private void doReleaseShared() {
    for (;;) {
        Node h = head;
        if (h != null && h != tail) {
            int ws = h.waitStatus;		//获取当前线程的结点状态
            if (ws == Node.SIGNAL) {
     	//如果是可唤醒状态
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))	//将状态改成默认状态0
                    continue;          
                unparkSuccessor(h);		//随后进行一个唤醒的操作
            }
            else if (ws == 0 && !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;                // loop on failed CAS
        }
        if (h == head)  break;
    }
}
```

接下来查看这个 **unparkSuccessor** 唤醒的方法，里面最主要的就是这个 **LockSupport.unpark** 线程被唤醒的方法，node结点存储线程信息，从而通过操作结点来实现线程的阻塞和唤醒

```java
private void unparkSuccessor(Node node) {
    int ws = node.waitStatus;
    if (ws < 0)
        compareAndSetWaitStatus(node, ws, 0);
    Node s = node.next;  //获取将被唤醒的结点
    if (s == null || s.waitStatus > 0) {
        s = null;
        for (Node t = tail; t != null && t != node; t = t.prev)
            if (t.waitStatus <= 0)
                s = t;
    }
    if (s != null) LockSupport.unpark(s.thread);
}
```

#### 2.5，结点出队以及传播

由于上面通过了unpark唤醒了队列的线程，由于是队列结构，那么唤醒的是第一个header结点，并且此时同步状态器中的state的值为1，那么该结点就会去获取锁的操作，那么又会进入到 **doAcquireSharedInterruptibly** 方法里面，此时刚好Node结点是head，那么就会进入尝试获取锁的逻辑，由于state为1，那么返回值是大于0的，接下来就是进入一个重点方法 **setHeadAndPropagate**

```java
private void doAcquireSharedInterruptibly(int arg)
    try {
        for (;;) {
     		//自旋
            final Node p = node.predecessor();
            if (p == head) {
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    setHeadAndPropagate(node, r);  //唤醒和传播
                    p.next = null; // help GC
                    failed = false;
                    return;
                }
            }
        }
    }
}
```

**setHeadAndPropagate** 方法顾名思义，就是设置头结点并且传播的意思。意思就是说如果当前队列中的结点被唤醒之后，会判断当前结点是不是头结点，如果是头结点就去尝试获取锁，如果获取锁成功的话，就会判断当前结点的下一个结点是不是共享结点，如果是就会尝试着去唤醒和回去呀锁，在锁资源充足的情况下，就能获取锁，如果锁资源不充分，此时线程处于唤醒状态，但是state处于0，就会等state大于0时去获取资源

```java
private void setHeadAndPropagate(Node node, int propagate) {
    Node h = head; // Record old head for check below
    setHead(node); //将当前结点设置成头结点
    if (propagate > 0 || h == null || h.waitStatus < 0 ||
        (h = head) == null || h.waitStatus < 0) {
        Node s = node.next; 	//获取当前结点的下一个结点
        if (s == null || s.isShared())	//判断当前结点是否为共享结点
            doReleaseShared();	//如果是共享结点，则会唤醒该结点
    }
}
```

这样做的好处就是可以提前的去唤醒线程，从而提高并发量。但是如果唤醒了多个线程的话，在获取锁时也会存在cas的锁竞争问题，没抢到锁的线程即使被唤醒也会继续阻塞。

### 3，总结

Semaphore信号量的阻塞逻辑和ReentrantLock是差不多的，都是先cas抢锁，抢不到入队，都是通过双向联表实现的CLH同步等待队列，队列不存在则先创建，存在则Node结点直接入队，随后修改结点的状态为可被唤醒状态-1，随后调用park方法进行阻塞。

唤醒逻辑有部分不一样，首先都是先修改结点的状态为0初始状态，随后调用unpark进行唤醒的操作，但是Semaphore在唤醒时，除了自身结点被唤醒之外，还会判断下一个结点是不是共享结点，如果是也会被唤醒去获取锁，通过提前唤醒机制来提高并发量。
