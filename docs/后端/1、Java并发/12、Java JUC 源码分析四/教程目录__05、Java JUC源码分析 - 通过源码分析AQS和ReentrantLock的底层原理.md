# 05、Java JUC源码分析 - 通过源码分析AQS和ReentrantLock的底层原理
- 来源：https://ddkk.com/zhuanlan/java/concurrency/12/5.html
- 分类：Java并发
- 分组：教程目录
## 一，深入理解AQS和ReentrantLock的底层原理

在学习这个AQS之前，需要先了解synchronized设计思想和底层实现，因为AQS的底层是参考于synchronized，可以看本人的上一篇文章

### 1，初识AQS

在上一篇中了解了synchronized的底层原理，synchronized是jvm层面的一把隐式锁，在java层面很难的去控制这把锁，如某些场景需要手动加解锁等，并且在jdk6之前，synchronized还是一把重锁，并没有后来的锁升级过程的一大堆优化，其性能也比较慢，需要来回的从用户态到内核态之间切换，名副其实的一把**重量级锁**。

为了实现一把java层面的锁，并且提高原来的性能的情况下，在编程大师 **Doug Lea** 的努力下，通过java代码实现锁的AQS终于问世。AQS主要是参考了synchronized的底层实现，如AQS内部也使用了同步等待队列和条件等待队列等，也是通过cas的方式抢锁，但是在性能上，是超过这个synchronized的，并且支持手动的加锁和解锁，对java开发者相对而言更加友好。即使后面synchronized经过了一系列锁的升级和优化，其性能也不如AQS

AQS：**AbstractQueuedSynchronizer** ，顾名思义，可以叫做**抽象队列同步器**，是一个java语言层面的一个抽象类，java层面主要是通过这个AQS的这种方式实现管程的，主要是支持jdk5及以上版本

### 2，AQS抽象类的源码分析

由于这个AQS是通过java语言实现的，所以直接来分析他的底层源码即可

```java
public abstract class AbstractQueuedSynchronizer extends AbstractOwnableSynchronizer
    implements java.io.Serializable {
     ...}
```

AQS是参考Synchronized的底层来实现的，因此可以直接根据Synchronized的底层思想来看这个AQS。首先Synchronized有两个重要的队列组成，一个是同步等待队列，一个是条件等待队列，那根据这两个队列，看看AQS底层是如何实现的

#### 2.1，同步等待队列

同步等待队列在synchronized是通过这个cxq队列实现的，其内部采用的是栈结构，先进后出，所以并不能保证锁的公平性。当线程一进来抢锁时，抢到锁的线程继续往下执行，没抢到锁的线程进入这个同步等待队列

在这个`AbstractQueuedSynchronizer` 抽象类中，该类继承了一个父类`AbstractOwnableSynchronizer` ，在这个类中，有一个重要的属性**exclusiveOwnerThread** ，表示当前的独占锁的线程，因为这个队列是一个同步的队列，因此需要通过这个参数来记录是哪个线程抢到了锁。

如在ReentrantLock中，会进行一个尝试获取锁的状态，就会判断当前线程是否拿到了这把锁

```java
if (Thread.currentThread() != getExclusiveOwnerThread())
```

在这个**AbstractQueuedSynchronizer** 抽象类中，里面有一个静态内部类Node，里面有如下参数

```java
static final class Node {
	...
}
```

根据注释，很明显可以看出，AQS的同步等待队列的名称叫做CLH同步等待队列，其底层是通过一个双向链表的方式形成的，链表是通过各个Node结点组成，每个结点都有自己的生命周期，前驱指针和后继指针，以及一个结点所处的状态，如能否被唤醒状态等。和synchronized中的cxq队列不同的是，CLH采用的是先进先出的队列结构，cxq采用的是先进后出的栈结构

在该类中，也能看到内部的抢锁逻辑，是通过这个cas比较与交换来实现的，主要是判断当前结点的线程是否为同步监视器中 exclusiveOwnerThread 线程

CLH同步等待队列的大概图像如下，当然底层有着更加复杂的逻辑，下文会继续讲解。大概原理就是会有一个同步监视块(蓝色部分)，里面会记录当前获取到锁的线程exclusive和一个state状态，state为0表示队列中的线程可以抢锁，队列是由各个node结点组成的双向链表，每个结点里面会有一个前驱指针和后继指针，以及一个waitStatus的状态，为-1时表示可唤醒状态。

#### 2.2，条件等待队列

在synchronized中，当拿到锁的线程在调用wait方法之后，就会进入这个waitSet的条件等待队列中，在这个AQS中，也实现了这个条件等待队列的功能。在这个AbstractQueuedSynchronizer类中，有一个内部类ConditionObject类，如下，很明显这个条件等待队列是一个单向链表组成，并且里面也是由各个node结点组成，此时结点的waitState的值为-2.

```java
public class ConditionObject implements Condition, java.io.Serializable {
    /** First node of condition queue. */
   	private transient Node firstWaiter;
   	/** Last node of condition queue. */
   	private transient Node lastWaiter;
    ...
}
```

synchronized主要是通过这个wait，notify和notyfyAll的方式来实现阻塞和唤醒功能，而在这个AQS中，是通过这个**await，signal，signalAll** 这三个方法实现

```java
public final void await() throws InterruptedException {
     }
public final void signal() {
     }
public final void signalAll() {
     }
```

await方法的实现主要如下，内部会调用这个LockSupport.park进行阻塞，并且通过调用这个 **addConditionWaiter** 方法获取结点，可以发现这个结点时存放在链表的尾部的。在调用这个await方法之后，线程会释放资源，线程被sifnalAll唤醒的时候，会调用LockSupport.unpark的方式唤醒

```java
public final void await() throws InterruptedException {
	...
    Node node = addConditionWaiter();
    while (!isOnSyncQueue(node)) {
        LockSupport.park(this);  //阻塞
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
            break;
    }
}
```

CLH同步等待队列和条件等待队列的关系如下，当拿到锁的线程调用await方法之后，此时结点会加入到条件等待队列的队尾里面，当某个结点被唤醒或者被全部唤醒的时候，会将条件等待队列的结点按顺序加入到同步等待队列的队尾，这样就实现了同步等待队列和条件等待队列之间的转换。(橙色部分表示CLH同步等待队列，绿色部分表示条件等待队列)

### 3，Node结点分析

上面了解了不管是条件等待队列还是同步等待队列，内部都是由node结点组成，接下来重点聊一下这个Node结点

```java
public final class Node{
    static final Node SHARED = new Node();	//共享结点
	static final Node EXCLUSIVE = null;    	//独占结点
	static final int CANCELLED =  1;		//异常状态
	static final int SIGNAL    = -1;		//可以被唤醒的状态
	static final int CONDITION = -2;		//条件等待状态
	static final int PROPAGATE = -3;		//传播
	volatile int waitStatus;				//当前结点的生命状态，对应上面的1，-1，-2，-3
	volatile Node prev;						//前驱指针
	volatile Node next;						//后继指针
	volatile Thread thread;					//当前线程
	Node nextWaiter;						//下一个waiter
}
```

根据上面Node中的各个变量可知，Node可以分为共享结点和独占结点，每个结点有一个waitStatus的状态表示，主要有异常状态、可被唤醒状态、条件等待状态和可传播状态，每个结点可以有当前结点的生命状态，同时有一个前驱指针和后继指针，并有一个记录线程id的指针。

在阻塞队列中Node结点的waitStatus的值为-2，在信号量中Node结点的waitStatus值为-3

### 4，ReentrantLock底层源码分析

上面介绍了AQS的底层，接下来就可以分析一下这个耳熟能详的ReentrantLock了，依旧先分析一下他的底层源。这个类实现了Lock接口，在该接口中规范了如何加锁，解锁，尝试获取锁等

```java
public class ReentrantLock implements Lock, java.io.Serializable {
     }
```

在这个ReentrantLock内部类中，有一个 **Sync** 的抽象的静态内部类，并且继承了这个AbstractQueuedSynchronizer 抽象队列同步器类，也就是说Sync已经具有该类的所有特性了。

```java
abstract static class Sync extends AbstractQueuedSynchronizer{
     }
```

在这个Sync中类中，有两个静态的子类，分别是FairSync和NonfairSync类，分别代表着公平锁和非公平锁

```java
static final class NonfairSync extends Sync {
     }
static final class FairSync extends Sync {
     }
```

在ReentrantLock类的构造方法中，默认的是一个非公平锁，减少阻塞，其效率相对较高

```java
public ReentrantLock(boolean fair) sync = fair ? new FairSync() : new NonfairSync();
public ReentrantLock()  sync = new NonfairSync();
```

#### 4.1，NonfairSync

因为ReentrantLock默认采用的是非公平锁的，因此先研究这个 **NonfairSync** ，如下

```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
lock.unlock()
```

接下来研究这个lock方法，其内部实现如下，会先结果一个cas的比较与交换操作，随后将同步器中的Exclusive的值设置为当前线程的值。同步状态器为0时可以抢锁，为1时不能抢锁，在释放锁时又会设置成0。

```java
 final void lock() {
    //cas操作，比较与交换
    if (compareAndSetState(0, 1)) setExclusiveOwnerThread(Thread.currentThread());
    else acquire(1);
}
```

上面方法中的state状态和exclusive独占线程对应的就是下图中蓝色部分的同步监视器。

如果cas抢锁失败，那么就会调用这个acquire()方法，并传入参数1

```java
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&  //尝试加锁
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg)) //加入队列中
        selfInterrupt();  //阻塞
}
```

##### 4.1.1，线程尝试获取锁

尝试获取锁的代码如下，会判断同步状态器的state值以及判断是否为重入锁

```java
//判断是否获取锁
final boolean nonfairTryAcquire(int acquires) {
    //获取当前获取锁的线程
    final Thread current = Thread.currentThread();
    //获取当前同步器状态，被volatile修饰的整型值，默认为0
    int c = getState();
    //如果同步状态器的值为0，说明外面的线程可以进行加锁操作
    if (c == 0) {
        //compareAndSetState:原子操作，比较与交换，进行加锁的操作，将state变量将0变为1
        //setExclusiveOwnerThread:设置获取锁的的线程拥有者
        if (compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    //如果状态同步器不为0，可能由自己持有，也可能由别的线程持有锁
    //重复加锁，如定义一个全局锁，出现了这个可重入锁的问题
    else if (current == getExclusiveOwnerThread()) {
        //重入一次就+1
        int nextc = c + acquires;
        if (nextc < 0)
            throw new Error("Maximum lock count exceeded");
        setState(nextc);
        return true;
    }
    //别的线程获有锁，直接返回
    return false;
}
```

##### 4.1.2，双向链表的创建

如果尝试加锁失败，则会进入下一步操作，就是将这个Node加入队列中，即进入这个addWaiter方法中，其底层实现主要如下，首先会判断当前的队列是否为空，如果不为空，则将当前结点的前驱指针指向队列中的尾结点，随后通过cas的方式将当前结点作为尾结点，反之出现并发问题。如果队列中尾结点不存在，那么需要一个初始化队列和一个入队的操作，调用的是enq方法

```java
//线程入队操作
private Node addWaiter(Node mode) {
    //获取当前线程的Node结点，此时的mode是一个独占的结点
    Node node = new Node(Thread.currentThread(), mode);
    // Try the fast path of enq; backup to full enq on failure
    Node pred = tail;
    if (pred != null) {
        //将当前结点的前驱指针指向队列中的尾结点
        node.prev = pred;
        //将当前结点做为队列的尾结点
        if (compareAndSetTail(pred, node)) {
            pred.next = node;
            return node;
        }
    }
    //结点入队
    enq(node);
    return node;
}
```

##### 4.1.3，Node结点入队

**enq方法**的底层实现如下，如果尾结点为空，就会通过自旋+cas的方式进行一个队列初始化的工作，然后队列不为空，此时大量线程依旧在自旋，则执行一个结点插入到队列的尾结点的操作。通过这个for循环，可以保证当前线程是一定可以入队成功的

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

##### 4.1.4，Node结点的阻塞

在线程入队之后，就需要堆线程进行阻塞操作，主要是通过**acquireQueued** 方法实现，其实现的底层逻辑如下，其逻辑和入队的逻辑一样，也是用了for自旋的方式来保证该结点一定会拿到锁。在拿到锁之前，就需要在队列中阻塞以及将当前结点修改成可被唤醒的状态

```java
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        //中断机制
        boolean interrupted = false;
        for (;;) {
      //for循环，保证可以一直拿到锁
            final Node p = node.predecessor();  //获取前驱结点，就是一直往前取，获取头结点
            if (p == head && tryAcquire(arg)) {
      //判断是不是头结点，尝试获取锁
                setHead(node); 	
                p.next = null; // help GC
                failed = false;
                return interrupted;
            }
            if (shouldParkAfterFailedAcquire(p, node) &&  //如果获取锁失败，修改Node标志
                parkAndCheckInterrupt())   //阻塞
                interrupted = true;
        }
    } finally {
        if (failed) cancelAcquire(node);
    }
}
```

可以再研究一下以下这段代码，在这个**shouldParkAfterFailedAcquire** 方法中，将这个Node结点的waitStatus的状态修改成-1，即可被唤醒的状态

```java
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
    int ws = pred.waitStatus;
    if (ws == Node.SIGNAL)return true;  //可被唤醒状态
    if (ws > 0) {
        //取消状态
        do {
            node.prev = pred = pred.prev; //将链表移除
        } while (pred.waitStatus > 0);
        pred.next = node;
    }
    else compareAndSetWaitStatus(pred, ws, Node.SIGNAL);  //设置成可被唤醒状态
    return false;
}
```

在修改完状态之后，又会调用这个 **parkAndCheckInterrupt** 方法，接下来查看这个方法可以得知，在该方法中会调用 `LockSupport.park()` 这个方法实现阻塞，并且调用这个interupted实现线程中断

```java
private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);
    return Thread.interrupted();
}
```

##### 4.1.5，同步监视器修改状态，释放资源和释放锁

在线程被阻塞之后，需要通过调用unlock方法对线程进行解锁操作，接下来看看底层是如何实现的。

```java
public void unlock() {
    sync.release(1);
}
```

接下来继续往下看这个**release** 方法，首先会进行一个**tryRelease**尝试释放锁的方法

```java
public final boolean release(int arg) {
    if (tryRelease(arg)) {
       //尝试释放锁
        Node h = head;		
        if (h != null && h.waitStatus != 0) //判断当前链表的头结点是否存在
            unparkSuccessor(h);		 
        return true;
    }
    return false;
}
```

接下来查看这个**tryRelease** 的底层实现，如下由于此时已经有线程拿到了锁，因此此时同步监视器中的state状态为1(没拿到为0)，因此这个c的值为0，此时会将将同步监视器中的Exclusive的线程设置为null，如下图看图理解好一点，这样的话就是一步释放锁的操作，此时state状态为0，其他线程也可以来抢锁

```java
protected final boolean tryRelease(int releases) {
    int c = getState() - releases;   // 0 = 1-1
    if (Thread.currentThread() != getExclusiveOwnerThread())
        throw new IllegalMonitorStateException();
    boolean free = false;
    if (c == 0) {
        free = true; 
        setExclusiveOwnerThread(null); //将exclusive的的线程清空
    }
    setState(c);	//修改同步监视器状态，将状态0返回
    return free;
}
```

##### 4.1.6，唤醒链表中的下一个结点

接下来进入release方法中的这个**unparkSuccessor** 方法中，查看其底层逻辑如下：首先会将当前结点的状态从-1可被唤醒状态改成0默认状态，由于队列中的线程都被阻塞，因此需要唤醒线程来抢锁，所以将当前结点的下一个结点给唤醒，通过调用：**LockSupport.unpark** 方法实现线程的唤醒

```java
private void unparkSuccessor(Node node) {
    int ws = node.waitStatus;  //获取当前释放锁的node结点状态
    if (ws < 0) compareAndSetWaitStatus(node, ws, 0); //将状态从可被唤醒状态修改成默认状态 
    Node s = node.next; //获取下一个要加锁的结点
    if (s == null || s.waitStatus > 0) {
        s = null;
        for (Node t = tail; t != null && t != node; t = t.prev)
            if (t.waitStatus <= 0)
                s = t;
    }
    if (s != null) LockSupport.unpark(s.thread);  //唤醒下一个结点
}
```

在3.1.4的acquireQueued方法中，有一个 **setHead()** 方法，就是会将当前当前结点作为头结点，当前结点的前驱指针指向null，这样就可以实现上一个结点出队的逻辑

```java
private void setHead(Node node) {
    head = node;
    node.thread = null;
    node.prev = null;
}
```

#### 4.2，FairSync

fairSync表示的是公平锁，其底层逻辑实现和非公平锁的步骤几乎一模一样，就是在入队之前，非公平锁可以直接进行一次cas抢锁的机会，但是公平锁需要判断队列中是否有数据，有就需要排队的操作。因此在这不做过多的解释，理解了非公平锁自然就能理解公平锁的底层实现了。

#### 4.3，ReentrantLock底层实现总结

ReentrantLock是Lock的一个实现类，在该类内部定义了一个继承AQS的Sync内部类，该类有两个子类，分别是实现非公平锁的**NonfairSync**和实现公平锁的**FairSync**，默认使用的是非公平锁。以非公平锁为例，如下：

**调用lock方法进行加锁：** 首先会进行一个cas的抢锁逻辑，如果抢锁失败，则会加入到CLH同步等待队列，加入队列之前，会判断该队列是否已经创建，如果没有创建则创建，该队列是由Node结点组成的双向链表，如果队列已经创建，则将该线程当做一个Node结点对象加入到队列的尾部，此时通过调用LockSupport.park的方法将Node结点阻塞，并修改状态为-1，即可被唤醒状态。

**调用unlock方法进行解锁：** 内部首先会先释放同步监视器资源，并修改state的状态为0，这样可以保证锁没有被抢占，其次是将当前结点的下一个结点通过调用LockSupport.unpark的方式唤醒，这样就会有线程去获取锁，最后就是将被释放锁的结点移除，下一个获取锁的结点作为头结点。

### 5，ReentrantLock的特性

通过上面的源码可知，ReentrantLock具有一下特性

- 阻塞等待队列：CLH同步等待队列，每个结点在队列中处于阻塞状态
- 共享/独占：每个Node结点分为独占模式和共享模式
- 公平/非公平：通过fair和unfair两种方式实现公平锁和非公平锁
- 可重入：在尝试获取锁时会对锁是否重复加进行判断和累加
- 允许中断 ：在调用LockSupport.park方法之后，会对当前线程中断

### 6，ReentrantLock和Synchronized联系

- ReentrantLock是通过java语言层次实现的锁；Synchronized是通过jvm层次实现的
- ReentrantLock采用的是队列(FIFO)方式实现的同步队列，因此可以实现公平锁和非公平锁锁；Synchronized是通过栈(LIFO)的方式实现的同步队列，因此是一把非公平锁
- ReentrantLock可以在代码中获取锁的状态，Synchronized不行
- ReentrantLock可以在代码中实现中断，Synchronized不行
- ReentrantLock需要手动的加锁解锁，Synchronized不需要
- ReentrantLock可以保证先进来的线程先执行(队列)，Synchronized可以保证后进来的线程先执行(栈)
- ReentrantLock是通过CLH队列(队列FIFO)的方式实现的同步等待队列；Synchronized是通过CXQ(栈LIFO)的方式实现的同步等待队列
- ReentrantLock和Synchronized都是支持可重入锁

如有转载，请标明出处：[/zhuanlan/java/concurrency/12/5.html](/zhuanlan/java/concurrency/12/5.html)
