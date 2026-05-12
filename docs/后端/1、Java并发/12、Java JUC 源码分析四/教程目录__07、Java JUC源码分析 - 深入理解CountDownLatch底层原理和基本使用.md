# 07、Java JUC源码分析 - 深入理解CountDownLatch底层原理和基本使用
- 来源：https://ddkk.com/zhuanlan/java/concurrency/12/7.html
- 分类：Java并发
- 分组：教程目录
## 一，深入理解CountDownLatch的底层原理

在上一篇中，讲解了通过AbstractQueuedSynchronizer底层实现的信号量，接下来这篇也是讲解该底层实现的一个并发工具类**CountDownLatch** ，并且内部也是使用的一个共享锁的结点。该类是一个线程同步的协作类，允许一个线程或者多个线程之间等待，直到其他线程完成操作集。

### 1，CountDownLatch的基本使用

在该工具类中，主要用来当一个计数器的使用，比如说让一个线程等待或者让多个线程等待，如一个模拟并发的场景，其代码如下。

```java
public class CountDownLatchTest {
    public static void main(String[] args) throws InterruptedException {
        //创建一个计数器
        CountDownLatch countDownLatch = new CountDownLatch(1);
        for (int i = 0; i < 5; i++) {
            new Thread(() -> {
                try {
                    //子线程阻塞
                    countDownLatch.await();
                    System.out.println(Thread.currentThread().getName() + "开始执行……");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }).start();
        }
        Thread.sleep(2000);// 主线程睡眠
        countDownLatch.countDown();// 子线程唤醒
    }
}
```

其使用相对而言来说也比较简单，主要是通过await方法和countDown方法来实现阻塞和唤醒机制，由于是一个计数器，因此大概可以猜出其内部的实现原理，当计数器不为0时被阻塞，计数器减为0时线程被唤醒

```java
countDownLatch.await(); 		//阻塞
countDownLatch.await(long timeout,TimeUnit unit); 		//阻塞超时问题
countDownLatch.countDown()		//减1，直到为0
```

一些简单的应用场景如：裁判员的发号施令枪、王者荣耀五个人开黑等等。

### 2，CountDownLatch的源码实现

#### 2.1，Sync类的内部实现

首先进入这个CountDownLatch方法，可以查看到其构造方法如下。需要一个整型的参数，用于定义可以被阻塞线程的个数，并且内部主要是初始化了一个 **Sync** 的内部类

```java
public CountDownLatch(int count) {
     		//需要一个参数
    if (count < 0) throw new IllegalArgumentException("count < 0");
    this.sync = new Sync(count);
}
```

在经过前面两篇的ReentrantLock和Semaphore的源码读解之后，再来看这个其实已经是轻车熟路了。而与前者不同的是，并没有继承于Sync的公平锁和非公平锁，因此在countDownLatch中，默认是没有公平和非公平的概念的。在这个CountDownLatch静态内部类Sync类中，其构造方法会去set一个state的值，该state是AQS类中的变量，加了volatile修饰，可以保证线程间的可见性，该state为同步等待队列中，监视器的值。

```java
private static final class Sync extends AbstractQueuedSynchronizer {
    private static final long serialVersionUID = 4982264981922014374L;
    Sync(int count) {
        //设置state的值
        setState(count);
    }
    int getCount() {
        //获取同步监视器中的state的值
        return getState();
    }
}
```

在这个Sync类中，还有尝试去获取锁的方法，根据方法名称可以知道，带有Shared的方法，可以知道该Node结点采用的是共享锁的方式。

```java
 //尝试能否获取锁
protected int tryAcquireShared(int acquires) {
    //判断状态是否为0
    return (getState() == 0) ? 1 : -1;
}
//获取锁逻辑
protected boolean tryReleaseShared(int releases) {
    // Decrement count; signal when transition to zero
    for (;;) {
        int c = getState();		//获取当前同步监视器的state值是否为0
        if (c == 0)	
            return false;
        int nextc = c-1;		//如果不为0，则将同步监视器的状态值减1
        if (compareAndSetState(c, nextc))	//通过cas比较和交换去修改cas的值
            return nextc == 0;
    }
}
```

#### 2.2，await阻塞的底层实现

在介绍完这个Sync类之后，再回到最初的await和countDown两个方法，从这两个方法中去查看底层实现

```java
countDownLatch.await(); 		//阻塞
countDownLatch.countDown()		//减1，直到为0
```

首先进入这个await方法中，其内部实现，回去调用sync类中的 **acquireSharedInterruptibly** 方法，参数为1

```java
public void await() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
```

在这个acquireSharedInterruptibly方法中，会调用这个 **tryAcquireShared** 尝试获取锁，由于在if中是和0比较，因此可以知道返回是一个int类型的 **tryAcquireShared** 方法

```java
public final void acquireSharedInterruptibly(int arg)
        throws InterruptedException {
    if (Thread.interrupted())				//判断线程是否中断
        throw new InterruptedException();
    if (tryAcquireShared(arg) < 0)			//尝试去获取锁
        doAcquireSharedInterruptibly(arg);
}
```

在int类型的 **tryAcquireShared** 方法中，其主要是对能否获取锁进行一个判断，由于此时参数是1，因此state状态不为0，因此返回的是一个-1，那么满足小于0的条件，就会进入这个 **doAcquireSharedInterruptibly** 方法

```java
return (getState() == 0) ? 1 : -1;
```

**doAcquireSharedInterruptibly** 的方法如下，顾名思义，就是对这些没有获取锁的node结点进行一个阻塞的操作，其具体实现如下，该方法是属于AQS中的方法，因此很多通过AQS实现的共享结点的阻塞方法都是调用这个方法，在Semapher信号量中，也是调用这个阻塞方法

```java
private void doAcquireSharedInterruptibly(int arg)
    throws InterruptedException {
    final Node node = addWaiter(Node.SHARED);		//入队操作,该结点是一个共享结点
    boolean failed = true;
    try {
        for (;;) {
            final Node p = node.predecessor();
            if (p == head) {
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    failed = false;
                    return;
                }
            }
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                throw new InterruptedException();
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
```

首先在获取这个锁失败的情况下，会先进行一个Node结点入队的操作，调用的是 **addWaiter** 方法，如果双向链表不为空，则直接将结点入队即可

```java
private Node addWaiter(Node mode) {
    //创建一个结点，将当前线程作为参数
    Node node = new Node(Thread.currentThread(), mode);
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
    enq(node);  	//如果为结点为空，表示链表为空，因此需要先创建一个双向链表
    return node;
}
```

如果尾结点为空，表示组成CLH同步等待队列的双向链表为空，因此需要先创建一个双向链表

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

在结点入队之后，那么需要将结点进行阻塞操作，

```java
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
```

接下来查看这个park前的方法 **shouldParkAfterFailedAcquire** ，里面有一个重要的修改结点状态的方法，将默认的状态修改成可被唤醒的状态

```java
//将当前默认的状态0修改成可被唤醒的状态-1
compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
```

设置完状态之后，会调用这个 **parkAndCheckInterrupt** 方法进行一个park阻塞和线程中断的操作，里面主要是通过这个LockSupport.park() 方法实现

```java
private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);		//阻塞操作
    return Thread.interrupted();
}
```

#### 2.3，countDown减值唤醒的实现

在countDown方法中，会调用一个**releaseShared** 释放共享锁的方法

```java
public void countDown() {
    sync.releaseShared(1);	//释放锁
}
```

releaseShared的底层实现如下，里面有一个 **tryReleaseShared** 方法和一个 **doReleaseShared** 的方法

```java
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
     	//尝试释放锁
        doReleaseShared();			//释放锁的真正逻辑
        return true;
    }
    return false;
}
```

首先先查看这个释放锁的逻辑，其代码如下，主要是对同步状态器的值减1

```java
protected boolean tryReleaseShared(int releases) {
    // Decrement count; signal when transition to zero
    for (;;) {
        int c = getState();		//获取同步状态器state的值
        if (c == 0)	
            return false;
        int nextc = c-1;		//减1操作
        if (compareAndSetState(c, nextc))	//通过cas比较交换
            return nextc == 0;
    }
}
```

在减1成功之后，会调用这个 **doReleaseShared** 同步等待队列中的一些逻辑操作

```java
private void doReleaseShared() {
    for (;;) {
        Node h = head;
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            if (ws == Node.SIGNAL) {
     		//如果是可被唤醒状态
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))	//修改成初始状态	
                    continue;            // loop to recheck cases
                unparkSuccessor(h);
            }
            else if (ws == 0 &&	
                     !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;                // loop on failed CAS
        }
        if (h == head)                   // loop if head changed
            break;
    }
}
```

在将结点的唤醒状态修改成初始状态之后，会调用这个 **unparkSuccessor** 方法，作用只有两个，一个是释放锁的结点出队，另一个就是唤醒先一个被阻塞的线程

```java
private void unparkSuccessor(Node node) {
    int ws = node.waitStatus; 	//获取当前结点的状态
    if (ws < 0)
        compareAndSetWaitStatus(node, ws, 0);		//将当前状态修改成初始状态
    Node s = node.next;
    if (s == null || s.waitStatus > 0) {
        s = null;
        for (Node t = tail; t != null && t != node; t = t.prev)	//将下一个结点作为头结点
            if (t.waitStatus <= 0)
                s = t;
    }
    if (s != null)
        LockSupport.unpark(s.thread);	//unpark释放锁
}
```

### 3，总结

无论是ReentrantLock，还是Semaphore，还是现在的countDownLatch，其内部都是采用AQS的底层实现，全部的逻辑大概都是这样：先通过cas抢锁，抢锁失败则创建双向链表组成的队列，进入队列，修改结点为可被唤醒状态，阻塞结点，释放锁，修改结点为默认状态，唤醒结点

在这个countDownLatch中，其逻辑如下，首先会在构造方法中设置一个参数，作为同步状态器的值，也就是同时允许多少个线程抢锁，如果这个同步状态器的state值不小于0，那么此时所有获取锁的结点会处于一个阻塞状态，并加入到CLH同步等待队列中，直到调用countDown方法对同步状态器的值减1并且一直减到为0的时候，才会将这个处于阻塞的结点的锁给释放，内部的线程才能继续往下执行，否则一直处于阻塞状态。

总而言之就一句话：同步状态器的state状态不为0，进来的Node结点直接进入CLH同步等待队列中阻塞
