# 22、Java JUC源码分析 - 队列-SynchronousQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/22.html
- 分类：Java并发
- 分组：教程目录
SynchronousQueue是一种比较特殊的阻塞队列，不同于之前的阻塞队列，特点为：

**1、** 每次put必须有take的存在，也就是说生产者将一个元素put传递给一个消费者，消费者不存在就put不成功；

**2、** 内部没有容量来维持存放元素，所以size，迭代等一些方法没有意义；

**3、** 使用cas操作，没有使用锁；

**4、** 通过栈(非公平)，队列(公平)2中结构来支持公平\非公平策略；

newCachedThreadPool线程池使用了这种队列。

```java
<span style="font-size:18px;">abstract static class Transferer {
    /**
     * put和take都调用这个函数
	 * e不为null，put操作，表示生产者将e转交给一个消费者
	 * e为null,take操作,表示消费者获取一个生产者转交的数据
	 * timed和nanos支持超时
     */
    abstract Object transfer(Object e, boolean timed, long nanos);
}</span>
```

这个是栈和队列的公共基类，所有的put，take操作最后都是调用这个transfer方法。

先来看下非公平的栈。

看下栈的SNode结构：

```java
static final class SNode {
    volatile SNode next;        // next node in stack
    volatile SNode match;       // 本节点的匹配节点
    volatile Thread waiter;     // 等待线程，用于park，unpark
    Object item;                // put时data，take时null
    int mode; //节点模式
    // Note: item and mode fields don't need to be volatile
    // since they are always written before, and read after,
    // other volatile/atomic operations.
    // 利用到到volatile语义的内存屏障
    SNode(Object item) {
        this.item = item;
    }
    boolean casNext(SNode cmp, SNode val) {
        return cmp == next &&
            UNSAFE.compareAndSwapObject(this, nextOffset, cmp, val);
    }
    /**
     * 匹配当前和s节点
     */
    boolean tryMatch(SNode s) {
        if (match == null &&
            UNSAFE.compareAndSwapObject(this, matchOffset, null, s)) { //match为null，则cas修改为s
            Thread w = waiter; //如果节点有等待的线程，那就置null，unpark
            if (w != null) {    // waiters need at most one unpark
                waiter = null;
                LockSupport.unpark(w);
            }
            return true;
        }
        return match == s; //如果match已经存在或者cas失败，那就直接匹配match跟s
    }
    /**
     * 匹配线程修改成自己
     */
    void tryCancel() {
        UNSAFE.compareAndSwapObject(this, matchOffset, null, this);
    }
    boolean isCancelled() {
        return match == this;
    }
    // Unsafe mechanics
    private static final sun.misc.Unsafe UNSAFE;
    private static final long matchOffset;
    private static final long nextOffset;
    static {
        try {
            UNSAFE = sun.misc.Unsafe.getUnsafe();
            Class k = SNode.class;
            matchOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("match"));
            nextOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("next"));
        } catch (Exception e) {
            throw new Error(e);
        }
    }
}
```

再看下栈的结构：

```java
static final class TransferStack extends Transferer {
    /* 节点状态 */
    /** 未匹配的消费者，take的时候 */
    static final int REQUEST    = 0;
    /** 未匹配的生产者，put的时候 */
    static final int DATA       = 1;
    /** 有其他线程匹配 */
    static final int FULFILLING = 2;
    /** true:已经有节点匹配 */
    static boolean isFulfilling(int m) { return (m & FULFILLING) != 0; }
    /** The head (top) of the stack */
    volatile SNode head;
    boolean casHead(SNode h, SNode nh) {
        return h == head &&
            UNSAFE.compareAndSwapObject(this, headOffset, h, nh);
    }
    /**
     * Creates or resets fields of a node. Called only from transfer
     * where the node to push on stack is lazily created and
     * reused when possible to help reduce intervals between reads
     * and CASes of head and to avoid surges of garbage when CASes
     * to push nodes fail due to contention.
     */
    static SNode snode(SNode s, Object e, SNode next, int mode) {
        if (s == null) s = new SNode(e);
        s.mode = mode;
        s.next = next;
        return s;
    }
    /**
     * Puts or takes an item.
     */
    Object transfer(Object e, boolean timed, long nanos) {
        ...
		...
    }
    /**
     * Spins/blocks until node s is matched by a fulfill operation.
     *
     * @param s the waiting node
     * @param timed true if timed wait
     * @param nanos timeout value
     * @return matched node, or s if cancelled
     */
    SNode awaitFulfill(SNode s, boolean timed, long nanos) {
        ...
		...
    }
    /**
     * 如果s节点是头结点、栈里面空的或者头结点有其他线程在匹配，那就自旋等等，说不定自旋一下，等下一次就有机会了
     */
    boolean shouldSpin(SNode s) {
        SNode h = head;
        return (h == s || h == null || isFulfilling(h.mode));
    }
    /**
     * Unlinks s from the stack.
     */
    void clean(SNode s) {
        ...
		...
    }
    // Unsafe mechanics
    private static final sun.misc.Unsafe UNSAFE;
    private static final long headOffset;
    static {
        try {
            UNSAFE = sun.misc.Unsafe.getUnsafe();
            Class k = TransferStack.class;
            headOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("head"));
        } catch (Exception e) {
            throw new Error(e);
        }
    }
}
```

transfer等几个相关方法，放上面太长了，单独提出来学习下：

```java
Object transfer(Object e, boolean timed, long nanos) {
    /*
     * Basic algorithm is to loop trying one of three actions:
     *
     * 1. If apparently empty or already containing nodes of same
     *    mode, try to push node on stack and wait for a match,
     *    returning it, or null if cancelled.
     *
     * 2. If apparently containing node of complementary mode,
     *    try to push a fulfilling node on to stack, match
     *    with corresponding waiting node, pop both from
     *    stack, and return matched item. The matching or
     *    unlinking might not actually be necessary because of
     *    other threads performing action 3:
     *
     * 3. If top of stack already holds another fulfilling node,
     *    help it out by doing its match and/or pop
     *    operations, and then continue. The code for helping
     *    is essentially the same as for fulfilling, except
     *    that it doesn't return the item.
	 *
	 * transfer主要处理3种情况:
	 * 1.栈为空或跟头结点模式相同，那就入栈，等待匹配
	 * 2.可以匹配，那就入栈修改头结点标记FULFILLING|mode，然后匹配出栈
	 * 3.发现其他线程在匹配，那就帮忙把匹配的节点出栈unlink
     */
    SNode s = null; // constructed/reused as needed
    int mode = (e == null) ? REQUEST : DATA; //根据e来决定mode，e入参取决于是put还是take操作
    for (;;) {
        SNode h = head;
        if (h == null || h.mode == mode) {  // empty or same-mode
            if (timed && nanos <= 0) {      // 超时了，
                if (h != null && h.isCancelled())
                    casHead(h, h.next);     // pop cancelled node
                else
                    return null;
            } else if (casHead(h, s = snode(s, e, h, mode))) {//没有超时或者不需要超时，那就新建node入栈
                SNode m = awaitFulfill(s, timed, nanos); //入栈后就等待其他线程来匹配，匹配后返回匹配的节点
                if (m == s) {               // 如果返回的匹配节点就是自己，那说明节点被取消
                    clean(s); //清理，返回null
                    return null;
                }
				//上面s为head，这里head变化了，说明有其他线程入栈，然后匹配唤醒了s，则推进下
				//考虑先transfer(e,true,10),然后在10时间内transfer(null,false,0)情况
                if ((h = head) != null && h.next == s) 
                    casHead(h, s.next);     // help s's fulfiller
                return (mode == REQUEST) ? m.item : s.item;
            }
        } else if (!isFulfilling(h.mode)) { // 在mode不同，头结点没有其他在匹配情况下
            if (h.isCancelled())            // 头结点被取消，那就重新设置head
                casHead(h, h.next);         // pop and retry
            else if (casHead(h, s=snode(s, e, h, FULFILLING|mode))) {//否则新节点入栈
                for (;;) { // loop until matched or waiters disappear
                    SNode m = s.next;       // m为s的匹配节点
                    if (m == null) {        // m丢失了，可能被其他线程匹配了
                        casHead(s, null);   // 出栈，重新走主流程
                        s = null;           // use new node next time
                        break;              // restart main loop
                    }
                    SNode mn = m.next;
                    if (m.tryMatch(s)) { //s和m匹配，方法修改m的match为s,并unpark m上等待线程
                        casHead(s, mn);     // 弹出s和m节点
                        return (mode == REQUEST) ? m.item : s.item;
                    } else                  // 不匹配，说明有其他线程在匹配
                        s.casNext(m, mn);   // help unlink
                }
            }
        } else {                            // 到这里说明栈顶在匹配了，那就推进下匹配流程，类似上面那个else if流程，只是没返回
            SNode m = h.next;               // m is h's match
            if (m == null)                  // waiter is gone
                casHead(h, null);           // pop fulfilling node
            else {
                SNode mn = m.next;
                if (m.tryMatch(h))          // help match
                    casHead(h, mn);         // pop both h and m
                else                        // lost match
                    h.casNext(m, mn);       // help unlink
            }
        }
    }
}
/** 可用的处理器个数 */
static final int NCPUS = Runtime.getRuntime().availableProcessors();
/** 限时最大的空旋 */
static final int maxTimedSpins = (NCPUS < 2) ? 0 : 32;
/** 不限时最大空旋 */
static final int maxUntimedSpins = maxTimedSpins * 16;
/** 空旋的阈值 */
static final long spinForTimeoutThreshold = 1000L;
/**
 * 自旋等待匹配或者cancel掉
 */
SNode awaitFulfill(SNode s, boolean timed, long nanos) {
    /*
     * When a node/thread is about to block, it sets its waiter
     * field and then rechecks state at least one more time
     * before actually parking, thus covering race vs
     * fulfiller noticing that waiter is non-null so should be
     * woken.
     * 阻塞park前先设置节点的waiter线程，这样匹配的时候可以唤醒该线程
	 * 
     * When invoked by nodes that appear at the point of call
     * to be at the head of the stack, calls to park are
     * preceded by spins to avoid blocking when producers and
     * consumers are arriving very close in time.  This can
     * happen enough to bother only on multiprocessors.
     * 节点调用时，如果正好在栈顶，通过自旋运气好，说不定下一次就匹配了。多处理器时可能发生这种情况。
	 * 
     * The order of checks for returning out of main loop
     * reflects fact that interrupts have precedence over
     * normal returns, which have precedence over
     * timeouts. (So, on timeout, one last check for match is
     * done before giving up.) Except that calls from untimed
     * SynchronousQueue.{poll/offer} don't check interrupts
     * and don't wait at all, so are trapped in transfer
     * method rather than calling awaitFulfill.
     */
    long lastTime = timed ? System.nanoTime() : 0;
    Thread w = Thread.currentThread();
    SNode h = head;
    int spins = (shouldSpin(s) ?
                 (timed ? maxTimedSpins : maxUntimedSpins) : 0); //自旋次数
    for (;;) { //自旋
        if (w.isInterrupted())
            s.tryCancel(); //线程被中断了，那就cancel,match设置成自己
        SNode m = s.match;
        if (m != null) // 匹配节点存在就返回
            return m;
        if (timed) { 
            long now = System.nanoTime();
            nanos -= now - lastTime;
            lastTime = now;
            if (nanos <= 0) {
                s.tryCancel(); //超时就cancel
                continue;
            }
        }
        if (spins > 0)
            spins = shouldSpin(s) ? (spins-1) : 0; //空旋减1
        else if (s.waiter == null) 
            s.waiter = w; // establish waiter so can park next iter 空旋结束还没有匹配，设置waiter，下一次会park
        else if (!timed) //如果不限制超时，那就park
            LockSupport.park(this);
        else if (nanos > spinForTimeoutThreshold) //限制了超时，看看自旋的阈值，通俗讲就是看看，自旋划算还是park划算
            LockSupport.parkNanos(this, nanos);
    }
}
/**
 * Returns true if node s is at head or there is an active
 * fulfiller.
 */
boolean shouldSpin(SNode s) {
    SNode h = head;
    return (h == s || h == null || isFulfilling(h.mode));
}
/**
 * 从栈中unlink节点s
 */
void clean(SNode s) {
    s.item = null;   // forget item
    s.waiter = null; // forget thread
    /*
     * At worst we may need to traverse entire stack to unlink
     * s. If there are multiple concurrent calls to clean, we
     * might not see s if another thread has already removed
     * it. But we can stop when we see any node known to
     * follow s. We use s.next unless it too is cancelled, in
     * which case we try the node one past. We don't check any
     * further because we don't want to doubly traverse just to
     * find sentinel.
     */
    SNode past = s.next;
    if (past != null && past.isCancelled())
        past = past.next;
    // Absorb cancelled nodes at head
    SNode p;
    while ((p = head) != null && p != past && p.isCancelled())
        casHead(p, p.next); //从头结点到past节点去掉连续的cancel节点
    // Unsplice embedded nodes
    while (p != null && p != past) { //上面是去掉连续的cancel节点，这里去掉不连续的cancel节点
        SNode n = p.next;
        if (n != null && n.isCancelled())
            p.casNext(n, n.next);
        else
            p = n;
    }
}
```

处理还是挺复杂的，主要是不像之前那些用锁来控制。看的时候想下假如有多个线程，各自不同操作，会出现什么情况，然后跟代码走一遍。

公平的队列的结构不想看了，transfer的流程跟栈差不多，模式相同入队列，不同则从头结点匹配。参考里面那个哥们2种情况都有，真强悍。

这个阻塞队列看的太累，改天还要再看看。
