# 18、Java JUC 源码分析 - 抽象同步队列AQS概述
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/18.html
- 分类：Java并发
- 分组：教程目录
## 1、AQS初探

AQS是AbstractQueuedSynchronizer的全称，又叫做抽象同步队列，并发包中的很多锁的底层实现都是AQS。那么他是用来作什么的呢？你可以把他看成一个阻塞队列，这个队列里面装的是一个一个线程。它是实现同步器的一个基础组件。当然我们很多的开发者可能不会直接接触AQS，但是我们还是有必要去知道它的原理。那么我们先来看看他的类图吧：

从这个类图我们可以看出，AQS是一个FIFO（先进先出）的双向队列，不熟悉双向队列的，可以先去看看双向队列。这个队列里面装的是一个一个的Node（节点），他的head，tail顾名思义，就是队首结点和队尾节点。既然Node是组成这个队列的基本单位，我们先来仔细看看这个Node。

Node这个类在一开始就给我们定义了很多常量：

```java
/** Marker to indicate a node is waiting in shared mode */
//用来标记线程是获取共享资源时被阻塞挂起而进入同步队列
static final Node SHARED = new Node();
/** Marker to indicate a node is waiting in exclusive mode */
//用来标记线程是获取独占资源时被阻塞挂起而进入同步队列
static final Node EXCLUSIVE = null;
//用来记录线程的等待状态
volatile int waitStatus;
/** waitStatus value to indicate thread has cancelled */
//当waitStatus为CANCELLED，表示线程取消了
static final int CANCELLED =  1;
/** waitStatus value to indicate successor's thread needs unparking */
//当waitStatus为SIGNAL，表示线程需要被唤醒
static final int SIGNAL    = -1;
/** waitStatus value to indicate thread is waiting on condition */
//当waitStatus为CONDITION，表示线程在条件队列里面等待了
static final int CONDITION = -2;
/**
 * waitStatus value to indicate the next acquireShared should
 * unconditionally propagate
 */
//当waitStatus为PROPAGATE，表示线程释放共享资源时，需要通知其他节点
static final int PROPAGATE = -3;
//前驱节点
volatile Node prev;
//后继节点
volatile Node next;
//当前节点的线程
volatile Thread thread;
//下一个条件队列里等待的节点
Node nextWaiter;
```

Node这个类里面也就定义了这么一些东西，这些变量怎么使用呢？我们来仔细看看AQS，是怎么使用的。

首先AQS他里面维护了一个单一的状态信息state。这个变量对于不同的类有不同的意义。对于ReentrantLock来说，state表示当前线程可重入的次数；对于读写锁来说ReentrantReadWriteLock来说，state的高16位表示读的状态，也就是获取读锁的次数，低16位表示获取到写锁的线程的可重入次数；对于信号量semaphore来说，state表示当前可用的信号数量。对于CountDownlatch来说，state用来表示计数器当前的值。

AQS的内部有一个ConditionObject类，他用来结合锁来进行线程同步。ConditionObject可以直接访问AQS对象内部的变量，比如state状态值和AQS队列。ConditionObject是条件变量，至于什么是条件变量，我之后会说，大家只要记住一个条件变量对应条件队列（单向链表队列），他里面有signal，和await方法，大家其实就可以把它类比成和notify、wait方法来进行理解。这个类的firstWaiter和lastWaiter用来存放队首和队尾的Node。

对于AQS来说，线程同步的关键是对状态值state进行操作。我们根据state是否属于一个线程，把操作state的方式分为独占方式和共享方式。你也可以理解成排它锁和共享锁。在独占方式下，获取资源使用的是

```java
public final void acquire(int arg) ;
public final void acquireInterruptibly(int arg);
```

在共享方式下获取和释放资源的方法为:

```java
public final void acquireShared(int arg) ;
public final void acquireSharedInterruptibly(int arg) ;
```

使用独占方式获取资源其实是与具体的线程绑定的，也就是说如果一个线程获取到了资源，就会标记是这个线程获取到了，其他线程在尝试操作state获取资源时就会发现当前该资源不是自己持有，就会在失败后被阻塞。比如独占锁ReentrantLock的实现,当一个线程获取了ReentrantLock的锁喉，在AQS的内部会首先使用CAS操作把state状态值从0变为1，然后设置当前锁的持有者为当前线程，当该线程再次获取锁时发现他自己就是锁的持有者，这样会把状态值state从1改为2，也就变成了可重入次数，而当另外一个线程获取锁的时候发现自己并不是该锁的持有者就会放到AQS阻塞队列挂起。

对应的共享方式的资源是与具体线程不相关的，当多个线程去请求资源的时候通过CAS方法竞争获取资源，当一个线程获取到了资源后，另外一个线程再次去获取时如果当前资源还能满足他的需求，则当前线程只需要使用CAS方式进行获取即可。比如Semaphore信号量，当一个线程通过acquire（）方法获取信号量时，会首先看信号量个数是否满足需要，不满足就会放入阻塞队列，妈祖就会通过自旋CAS获得信号量。

## 2、获取与释放资源

### 2.1在独占的方式下，获取与释放资源的流程如下:

(1)当一个线程调用acquire（int arg）方法获取独占资源的时候(acquire的中文意思为获取)，首先会使用tryAcquire方法尝试获取资源，具体是设置状态变量state的值，成功就直接返回，如果失败就把当前线程封装为类型为Node.EXCLUSIVE的Node节点，然后插入到AQS阻塞队列的尾部，并调用LockSupport.park(this)阻塞这个线程。

```java
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        //把当前线程封装为类型为Node.EXCLUSIVE的Node节点，并加入队列
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        //失败后阻塞该线程
        selfInterrupt();
}
```

(2)当一个线程调用release（int arg）方法时会尝试使用tryRelease操作释放资源，这里其实也是设置state的值，然后调用LockSupport.unpark(h)，激活等待队列的头元素，被激活的就又会使用tryAcquire继续尝试，看当前状态变量state的值是否能够满足他的要求，满足则执行，不满足又会进入等待队列。

```java
public final boolean release(int arg) {
    if (tryRelease(arg)) {
        Node h = head;
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);
        return true;
    }
    return false;
}
```

需要注意的是，AQS类并没有提供可用的tryAcquire和tryRelease方法。正如AQS是锁阻塞和同步器的基础框架一样，tryAcquire和tryRelease需要由具体的子类来实现。子类在实现tryAcquire和tryRelease的时候要根据具体的场景使用CAS算法尝试修改state状态值，成功返回true，失败返回false，子类还需要定义，state增减的含义。

比如继承自AQS的独占锁ReentrantLock，定义当state为0时表示锁空闲，为1时表示被占用。在重写tryAcquire时，在内部需要使用CAS算法查看当前state是否为0，如果为0，则设置为1，并设置当前锁的持有者为当前线程，而后返回true，如果cas失败则返回false。在实现tryRelease时，在内部需要使用CAS算法把当前state的值从1修改为0，并设置当前的持有者为null，然后返回true，如果CAS失败就是返回false。

### 2.2在共享的方式下，获取与释放资源的流程如下：

（1）当线程调用acquireShared（int arg）获取共享资源时，会首先使用tryAquireShared尝试获取资源，具体是设置状态变量state的值，成功后直接返回，失败则将当前线程封装为类型NodeSHARED的Node节点，然后将它插入到AQS阻塞队列的队尾，并使用LockSuppor.unpark(this)将当前线程阻塞挂起：

```java
public final void acquireShared(int arg) {
    if (tryAcquireShared(arg) < 0)
        doAcquireShared(arg);
}
private void doAcquireShared(int arg) {
    final Node node = addWaiter(Node.SHARED);
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            final Node p = node.predecessor();
            if (p == head) {
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    if (interrupted)
                        selfInterrupt();
                    failed = false;
                    return;
                }
            }
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
```

(2)当一个线程调用releaseShared（int arg）时会尝试使用tryReleaseShared操作释放资源，这里是设置变量state的值，然后使用LockSupport.unpark(thread)去唤醒AQS队列里面别阻塞的线程。被激活的线程又会进入tryReleaseShared查看当前状态变量state的值是否满足自己的需求，满足则执行，不满足又会进入AQS等待队列。

同样要注意的是，AQS也没有提供tryReleaseShared，tryAquireShared的实现，具体实现都交给了子类。

比如继承自AQS实现的读写锁ReentrantReadWriteLock里面的读锁在重写tryAquireShared时，首先就会查看写锁是否被其他线程持有，如果是则直接返回false，否则使用CAS递增state的高16位。那么重写tryReleaseShared时候，在内部使用CAS操作把当前state的值高16位减1，然后返回true，失败则返回false。

基于AQS的子类要重写上述方法外，还要重写一个isHeldExclusively方法，这个用来判断当前锁是独占还是共享。

另外你可能会好奇，上面再说获取资源的时候提供了4个方法

```java
public final void acquire(int arg) ;
public final void acquireInterruptibly(int arg);
public final void acquireShared(int arg) ;
public final void acquireSharedInterruptibly(int arg) ;
```

而我们下面却只讲了两个，那么这个加上Interruptibly的方法和原来的房又有什么区别呢？

其实不带Interruptibly的方法是不对中断进行响应，也就是线程在调用不带Interruptibly的方法获取资源时，或者获取失败被挂起时，其他线程中断了该线程，那么该线程不会因为中断而抛出异常，他还是继续获取资源，或者被挂起。也就是忽略中断。

而带Interruptibly关键字的方法要对中断进行响应，也就是线程在调用带Interruptibly的方法获取资源时，或者获取失败被挂起时，其他线程中断了该线程，那么该线程会因为中断而抛出异常并返回。

## 3、AQS如何维护队列的

我们最后来看看AQS如何维护他自己的队列的吧，这里主要看入队操作。

也就是当一个线程获取资源失败后该线程就会被转化为一个Node节点，然后就会使用enq（final Node node）方法将这个节点插入到队列。话不多说，看代码更加直观：

```java
private Node enq(final Node node) {
    for (;;) {
        Node t = tail;//（1）
        if (t == null) {
      // Must initialize
            if (compareAndSetHead(new Node()))//（2）
                tail = head;
        } else {
            node.prev = t;//（3）
            if (compareAndSetTail(t, node)) {
     //（4）
                t.next = node;
                return t;
            }
        }
    }
}
```

如上代码，在第一次循环中，当要在AQS队列尾部插入元素时，AQS状态就是默认的状态，如图（defalut）所示。也就是队列的头和尾都指向null；当执行代码1后，节点t也指向尾部节点，这个时候整个队列如图（1）所示。这个时候t为null，执行代码2，便会使用CAS算法设置一个哨兵节点为头结点，如果CAS设置成功，则尾部节点也指向哨兵节点，这个时候如图（2）所示：

但是到现在为止只插入了一个哨兵节点，还需要插入一个node节点，那又会怎么执行呢？第二次执行循环的时候，执行到代码（1），这个时候队列如图（3）所示，然后我们会执行代码（3）去设置node的前驱节点为尾节点，这个时候队列的状态就为图（4），然后执行代码4，使用CAS操作设置尾节点，成功后如图（5）所示，然后在执行后面代码，把哨兵节点的前驱设置为node，这时候完成了双向链表的插入，最终如图（6）所示：
