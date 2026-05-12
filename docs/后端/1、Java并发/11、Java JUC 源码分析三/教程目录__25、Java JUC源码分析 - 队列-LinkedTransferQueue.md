# 25、Java JUC源码分析 - 队列-LinkedTransferQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/25.html
- 分类：Java并发
- 分组：教程目录
> 前端妹子推荐Markdown排版，尝试下看看效果如何。

JUC集合队列的最后一个，LinkedTransferQueue是个好东西，利用链表FIFO实现无界队列，看到有说法说是ConcurrentLinkedQueue、SynchronousQueue (公平模式下)、无界的LinkedBlockingQueues等的超集，看完源码，感觉是有点这个意思。

BlockingQueue的是队列满了以后你再入队会阻塞，take的时候队列空也会阻塞；SynchronousQueue是一个取必须对应着一个入；而ConcurrentLinkedQueue则使用的wait-free算法解决并发问题。

## 原理

个人感觉先记得原理再去看这个queue更好，要不然累死。LinkedTransferQueue采用的一种预占模式。意思就是消费者线程取元素时，如果队列为空，那就生成一个节点（节点元素为null）入队，然后消费者线程park住，后面生产者线程入队时发现有一个元素为null的节点，生产者线程就不入队了，直接就将元素填充到该节点，唤醒该节点上park住线程，被唤醒的消费者线程拿货走人。这就是预占的意思：**有就拿货走人，没有就占个位置等着，等到或超时**。

## TransferQueue

LinkedTransferQueue实现了TransferQueue接口，这个接口继承了BlockingQueue。之前BlockingQueue是队列满时再入队会阻塞，而这个接口实现的功能是队列不满时也可以阻塞，实现一种有阻塞的入队功能。而这个接口在之前SynChronousQueue内种也有体现，作为内部抽象类Transferer，然后公平非公平2中实现，可以体会下。看下TransferQueue接口的代码：

```java
public interface TransferQueue<E> extends BlockingQueue<E> {
    /**
     * 立即转交一个元素给消费者，如果此时队列没有消费者，那就false
     */
    boolean tryTransfer(E e);
    /**
     * 转交一个元素给消费者，如果此时队列没有消费者，那就阻塞
     */
    void transfer(E e) throws InterruptedException;
    /**
     * 带超时的tryTransfer
     */
    boolean tryTransfer(E e, long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 是否有消费者等待接收数据，瞬时状态，不一定准
     */
    boolean hasWaitingConsumer();
    /**
     * 返回还有多少个等待的消费者，跟上面那个一样，都是一种瞬时状态，不一定准
     */
    int getWaitingConsumerCount();
}
```

## LinkedTransferQueue结构-Node

### Node节点

先看下大概样子：

isData
item
next
waiter

**isData**：表示该节点是存放数据还是获取数据；

**item**：存放数据，isData为false时，该节点为null，为true时，匹配后，该节点会置为null；

**next**：指向下一个节点；

**waiter**：上面原理部分说的会park住消费者线程，线程就放在这里。

### Node节点源码

```java
static final class Node {
    final boolean isData;   // 如果是请求时是为false
    volatile Object item;   // isData为true时，item存放数据，后面匹配后置为null
    volatile Node next;
    volatile Thread waiter; // 请求时的park住的消费者线程
    // CAS methods for fields
    final boolean casNext(Node cmp, Node val) {
        return UNSAFE.compareAndSwapObject(this, nextOffset, cmp, val);
    }
    final boolean casItem(Object cmp, Object val) {
        // assert cmp == null || cmp.getClass() != Node.class;
        return UNSAFE.compareAndSwapObject(this, itemOffset, cmp, val);
    }
    /**
     * Constructs a new node.  Uses relaxed write because item can
     * only be seen after publication via casNext.
     */
    Node(Object item, boolean isData) {
        UNSAFE.putObject(this, itemOffset, item); // relaxed write
        this.isData = isData;
    }
    /**
     * 更新头节点后会将原来head节点的next指向自己for gc
     */
    final void forgetNext() {
        UNSAFE.putObject(this, nextOffset, this);
    }
    /**
     * 匹配过或节点被取消的时候会调用
     */
    final void forgetContents() {
        UNSAFE.putObject(this, itemOffset, this);
        UNSAFE.putObject(this, waiterOffset, null);
    }
    /**
     * 节点是否匹配过了，如果匹配或者取消，item会有变化，也会调用上面那个forgetContents(),item会指向自己
     */
    final boolean isMatched() {
        Object x = item;
        return (x == this) || ((x == null) == isData);
    }
    /**
     * 是否是一个未匹配的请求节点，如果是的话，那么isData为false，item为null，如果匹配，item会有值的
     */
    final boolean isUnmatchedRequest() {
        return !isData && item == null;
    }
    /**
     * 如给定节点类型不能挂在当前节点后返回true
     * 满足节点类型不同且当前节点还未匹配，未匹配参考下上面的isMatched()方法
     */
    final boolean cannotPrecede(boolean haveData) {
        boolean d = isData;
        Object x;
        return d != haveData && (x = item) != this && (x != null) == d;
    }
    /**
     * 匹配一个数据节点 -- used by remove.
     */
    final boolean tryMatchData() {
        // assert isData;
        Object x = item;
        if (x != null && x != this && casItem(x, null)) {
            LockSupport.unpark(waiter);
            return true;
        }
        return false;
    }
    private static final long serialVersionUID = -3375979862319811754L;
    // Unsafe mechanics
    private static final sun.misc.Unsafe UNSAFE;
    private static final long itemOffset;
    private static final long nextOffset;
    private static final long waiterOffset;
    static {
        try {
            UNSAFE = sun.misc.Unsafe.getUnsafe();
            Class k = Node.class;
            itemOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("item"));
            nextOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("next"));
            waiterOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("waiter"));
        } catch (Exception e) {
            throw new Error(e);
        }
    }
}
```

Node节点需要注意的是：**匹配后节点的item的变化，以及搭配isData来综合判断是否匹配过isMatched()**。

Node
node1(isData-item)
node2(isData-item)

匹配前
true-item
false-null

匹配后
true-null
false-this

### LinkedTransferQueue结构源码

```java
/** 判断多核 */
private static final boolean MP =
    Runtime.getRuntime().availableProcessors() > 1;
/**
 * 作为第一个等待节点在阻塞park前自旋次数
 */
private static final int FRONT_SPINS   = 1 << 7;
/**
 * 前驱节点正在处理，当前节点需要自旋的次数
 */
private static final int CHAINED_SPINS = FRONT_SPINS >>> 1;
/**
 * The maximum number of estimated removal failures (sweepVotes)
 * to tolerate before sweeping through the queue unlinking
 * cancelled nodes that were not unlinked upon initial
 * removal. See above for explanation. The value must be at least
 * two to avoid useless sweeps when removing trailing nodes.
 */
static final int SWEEP_THRESHOLD = 32;
 /** head of the queue; null until first enqueue */
transient volatile Node head;
/** tail of the queue; null until first append */
private transient volatile Node tail;
/** The number of apparent failures to unsplice removed nodes */
private transient volatile int sweepVotes;
// CAS methods for fields
private boolean casTail(Node cmp, Node val) {
    return UNSAFE.compareAndSwapObject(this, tailOffset, cmp, val);
}
private boolean casHead(Node cmp, Node val) {
    return UNSAFE.compareAndSwapObject(this, headOffset, cmp, val);
}
private boolean casSweepVotes(int cmp, int val) {
    return UNSAFE.compareAndSwapInt(this, sweepVotesOffset, cmp, val);
}
/*
 * 调用xfer时候需要传入,区分不同处理
 */
private static final int NOW   = 0; // for untimed poll, tryTransfer
private static final int ASYNC = 1; // for offer, put, add
private static final int SYNC  = 2; // for transfer, take
private static final int TIMED = 3; // for timed poll, tryTransfer
public LinkedTransferQueue() {
}
```

结构就是一个head一个tail，构造为空，最重要的是：

```java
private static final int NOW   = 0; // for untimed poll, tryTransfer
private static final int ASYNC = 1; // for offer, put, add
private static final int SYNC  = 2; // for transfer, take
private static final int TIMED = 3; // for timed poll, tryTransfer
```

调用核心方法`xfer(E e, boolean haveData, int how, long nanos)`方法时传入参数(how)，用于区分不同操作。

## 核心方法

### put-offer-add

```java
public void put(E e) {
    xfer(e, true, ASYNC, 0);
}
public boolean offer(E e, long timeout, TimeUnit unit) {
    xfer(e, true, ASYNC, 0);
    return true;
}
public boolean offer(E e) {
    xfer(e, true, ASYNC, 0);
    return true;
}
public boolean add(E e) {
    xfer(e, true, ASYNC, 0);
    return true;
}
```

这几个BlockingQueue的实现方法，因为LinkedTransferQueue队列是无界的，不会阻塞，所以在调用`xfer()`的时候传入的都是ASYNC，直接返回true。

### untimed poll-tryTransfer

```java
public boolean tryTransfer(E e) {
    return xfer(e, true, NOW, 0) == null;
}
public E poll() {
    return xfer(null, false, NOW, 0);
}
```

2者都是尝试下，也不会阻塞，传入`xfer()`的是now，tryTransfer将元素转交给消费者线程，不会入队，poll是出队。

### transfer-take

```java
public void transfer(E e) throws InterruptedException {
    if (xfer(e, true, SYNC, 0) != null) {
        Thread.interrupted(); // failure possible only due to interrupt
        throw new InterruptedException();
    }
}
public E take() throws InterruptedException {
    E e = xfer(null, false, SYNC, 0);
    if (e != null)
        return e;
    Thread.interrupted();
    throw new InterruptedException();
}
```

这2个方法需要阻塞。

### 超时的poll-tryTransfer

```java
public boolean tryTransfer(E e, long timeout, TimeUnit unit)
    throws InterruptedException {
    if (xfer(e, true, TIMED, unit.toNanos(timeout)) == null)
        return true;
    if (!Thread.interrupted())
        return false;
    throw new InterruptedException();
}
public E poll(long timeout, TimeUnit unit) throws InterruptedException {
    E e = xfer(null, false, TIMED, unit.toNanos(timeout));
    if (e != null || !Thread.interrupted())
        return e;
    throw new InterruptedException();
}
```

这2个超时的也需要阻塞，使用TIMED区分SYNC。

### 核心xfer()

```java
/**
 * 所有入队出队都调用该方法
 * @param e the item or null for take
 * @param haveData true if this is a put, else a take
 * @param how NOW, ASYNC, SYNC, or TIMED
 * @param nanos timeout in nanosecs, used only if mode is TIMED
 * @return an item if matched, else e
 * @throws NullPointerException if haveData mode but e is null
 */
private E xfer(E e, boolean haveData, int how, long nanos) {
    if (haveData && (e == null)) //put时非空校验
        throw new NullPointerException();
    Node s = null;                        // the node to append, if needed
    retry:
    for (;;) {                            // restart on append race
        for (Node h = head, p = h; p != null;) { // 从head开始查找匹配的节点，p为null队列为空
            boolean isData = p.isData;
            Object item = p.item;
            if (item != p && (item != null) == isData) { // 如果找到的节点没有匹配过
                if (isData == haveData)   // 节点类型跟待处理的类型一样，那肯定不行，例如找到的是一个data节点，匹配的肯定是一个false的reservation,你给一个data节点来匹配肯定不行
                    break;
                if (p.casItem(item, e)) { // 可以匹配，那就casItem，2中情况，如果p的item原来是data，那么匹配后item为null，原来为null，现在有值了
                    for (Node q = p; q != h;) { //这里是帮助推进head节点，跟之前的SynchronousQueue类似效果
                        Node n = q.next;  // update by 2 unless singleton
                        if (head == h && casHead(h, n == null ? q : n)) {
                            h.forgetNext();
                            break;
                        }                 // advance and retry
                        if ((h = head)   == null ||
                            (q = h.next) == null || !q.isMatched())
                            break;        // unless slack < 2
                    }
                    LockSupport.unpark(p.waiter); //匹配后将p上park的线程unpark，还是2种情况
                    return this.<E>cast(item); //返回item
                }
            }
            Node n = p.next; //如果上面找到的节点已经匹配过了，那就往后再找
            p = (p != n) ? n : (h = head); // 如果p的next指向p本身，说明p节点已经有其他线程处理过了，只能从head重新开始
        }
        if (how != NOW) {                 // 如果上面没有找到匹配的，对不同how进来的处理不同，NOW为untimed poll, tryTransfer，不需要入队
            if (s == null)
                s = new Node(e, haveData);
            Node pred = tryAppend(s, haveData); //append节点，返回前驱节点
            if (pred == null)
                continue retry;           // 返回的前驱节点为null，那就是有race，被其他的抢了，那就continue 整个for
            if (how != ASYNC) //这里就是SYNC  = 2; transfer, take 和TIMED = 3; timed poll, tryTransfer需要阻塞等待匹配
                return awaitMatch(s, pred, e, (how == TIMED), nanos);
        }
        return e; // Now 和 ASYNC = 1; for offer, put, add，无界队列返回就是
    }
}
```

我觉得大体流程还算清晰，总结下：

**1、****findmatch**，主要是判断匹配条件，节点本身还未匹配，且isData类型和待匹配的不一样就行，匹配后就是casItem，unpark匹配节点waiter，返回就是；

**2、****unmatched**，如果没找到，那就根据不同方法入参how处理了，now的就直接返回，其他的3种先入队，然后ASYNC入队后返回，SYNC和TIMED阻塞等待匹配；

### 其他辅助方法

```java
/** append一个节点到tail */
private Node tryAppend(Node s, boolean haveData) {
    for (Node t = tail, p = t;;) {        // 从tail节点开始
        Node n, u;                        // temps for reads of next & tail
        if (p == null && (p = head) == null) { //队列空
            if (casHead(null, s)) //将节点设置成head
                return s;                 // initialize
        }
        else if (p.cannotPrecede(haveData))
            return null;                  // lost race vs opposite mode
        else if ((n = p.next) != null)    // not last; keep traversing
            p = p != t && t != (u = tail) ? (t = u) : // stale tail
                (p != n) ? n : null;      // restart if off list
        else if (!p.casNext(null, s))
            p = p.next;                   // re-read on CAS failure
        else {
            if (p != t) {                 // update if slack now >= 2
                while ((tail != t || !casTail(t, s)) &&
                       (t = tail)   != null &&
                       (s = t.next) != null && // advance and retry
                       (s = s.next) != null && s != t);
            }
            return p;
        }
    }
}
/** 等待匹配或者超时时间到,大体流程跟SynchronousQueue的那个awaitFulfill类似 */
private E awaitMatch(Node s, Node pred, E e, boolean timed, long nanos) {
    long lastTime = timed ? System.nanoTime() : 0L;
    Thread w = Thread.currentThread();
    int spins = -1; // initialized after first item and cancel checks
    ThreadLocalRandom randomYields = null; // bound if needed
    for (;;) {
        Object item = s.item;
        if (item != e) {                  // 匹配后，xfer会有个casItem操作，这里park被唤醒后检查是否有变化
            // assert item != s;
            s.forgetContents();           // avoid garbage
            return this.<E>cast(item);
        }
        if ((w.isInterrupted() || (timed && nanos <= 0)) &&
                s.casItem(e, s)) {        // 超时了
            unsplice(pred, s); //将节点unlink
            return e;
        }
        if (spins < 0) {                  // 自旋 establish spins at/near front
            if ((spins = spinsFor(pred, s.isData)) > 0) //自旋次数
                randomYields = ThreadLocalRandom.current();
        }
        else if (spins > 0) {             // spin
            --spins;
            if (randomYields.nextInt(CHAINED_SPINS) == 0) //这里没太明白为什么要yield
                Thread.yield();           // occasionally yield
        }
        else if (s.waiter == null) {
            s.waiter = w;                 // park前肯定会调用一次
        }
        else if (timed) { //超时的park
            long now = System.nanoTime();
            if ((nanos -= now - lastTime) > 0)
                LockSupport.parkNanos(this, nanos);
            lastTime = now;
        }
        else {
            LockSupport.park(this); //没有超时的park
        }
    }
}
/** 将节点s从队列断开 */
final void unsplice(Node pred, Node s) {
    s.forgetContents(); // forget unneeded fields
    /*
     * See above for rationale. Briefly: if pred still points to
     * s, try to unlink s.  If s cannot be unlinked, because it is
     * trailing node or pred might be unlinked, and neither pred
     * nor s are head or offlist, add to sweepVotes, and if enough
     * votes have accumulated, sweep.
     */
    if (pred != null && pred != s && pred.next == s) {
        Node n = s.next;
        if (n == null ||
            (n != s && pred.casNext(s, n) && pred.isMatched())) {
            for (;;) {               // check if at, or could be, head
                Node h = head;
                if (h == pred || h == s || h == null)
                    return;          // at head or list empty
                if (!h.isMatched())
                    break;
                Node hn = h.next;
                if (hn == null)
                    return;          // now empty
                if (hn != h && casHead(h, hn)) //推进head节点
                    h.forgetNext();  // advance head
            }
            if (pred.next != pred && s.next != s) { // recheck if offlist
                for (;;) {           // 通过sweepVotes变量控制到达足够次数后清除matched节点
                    int v = sweepVotes;
                    if (v < SWEEP_THRESHOLD) {
                        if (casSweepVotes(v, v + 1))
                            break;
                    }
                    else if (casSweepVotes(v, 0)) {
                        sweep();
                        break;
                    }
                }
            }
        }
    }
}
/** 通过pre节点计算自旋次数 */
private static int spinsFor(Node pred, boolean haveData) {
    if (MP && pred != null) { //必须多核
        if (pred.isData != haveData)      // phase change
            return FRONT_SPINS + CHAINED_SPINS;
        if (pred.isMatched())             // pre已经匹配了，那就可以少自旋一些 probably at front
            return FRONT_SPINS;
        if (pred.waiter == null)          // pre节点在匹配中了，那可以再少自旋一点 pred apparently spinning
            return CHAINED_SPINS;
    }
    return 0;
}
```

主流程看完，其他不看了，`unsplice()`方法的细节有些不清楚，还需要再看看深挖下。

## Example

**这里的东西是从参考1那个哥们的文章里面看到的**，感觉放在最后，看完源码后，看这个能加深对LinkedTransferQueue的理解，感谢那位哥们！

1：Head->Data Input->Data

Match: 根据他们的属性 发现 cannot match ，因为是同类的

处理节点: 所以把新的data放在原来的data后面，然后head往后移一位，Reservation同理

HEAD=DATA->DATA

2：Head->Data Input->Reservation （取数据）

Match: 成功match，就把Data的item变为reservation的值（null,有主了），并且返回数据。

处理节点： 没动，head还在原地

HEAD=DATA（用过）

3：Head->Reservation Input->Data（放数据）

Match: 成功match，就把Reservation的item变为Data的值（有主了），并且叫waiter来取

处理节点： 没动

HEAD=RESERVATION(用过)
