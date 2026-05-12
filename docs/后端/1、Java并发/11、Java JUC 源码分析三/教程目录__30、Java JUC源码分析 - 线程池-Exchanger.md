# 30、Java JUC源码分析 - 线程池-Exchanger
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/30.html
- 分类：Java并发
- 分组：教程目录
本想JUC最后一节写下Executors的，然后结束JUC。看了下代码，完全是一个工具类，哎，都是ThreadPoolExecutor、ScheduledThreadPoolExecutor还有callable的封装，代码看起来也没什么难度，不能浪费时间，还是看下Exchanger吧。

## Demo

Exchanger还真没用过，写个demo试验下看看。

```java
public class Hello {
    public static void main(String[] args) throws InterruptedException, ClassNotFoundException, InstantiationException, IllegalAccessException {
        final Exchanger<String> presents = new Exchanger<String>();
        Thread boy = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println(Thread.currentThread()+ "送美女一朵：鲜花");
                try {
                    String gift = presents.exchange("flower");
                    System.out.println(Thread.currentThread() + "获得美女赠送的：" + gift);
                } catch (InterruptedException e) {
                }
            }
        });
        Thread girl = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println(Thread.currentThread()+ "送哥们一个kiss");
                try {
                    String gift = presents.exchange("kiss");
                    System.out.println(Thread.currentThread() + "获得帅哥赠送的：" + gift);
                } catch (InterruptedException e) {
                }
            }
        });
        boy.start();
        girl.start();
        Thread.yield();
    }
}
```

运行结果为：

```java
Thread[Thread-0,5,main]送美女一朵：鲜花
Thread[Thread-1,5,main]送哥们一个kiss
Thread[Thread-0,5,main]获得美女赠送的：kiss
Thread[Thread-1,5,main]获得帅哥赠送的：flower
```

可以看到实现了2个线程间的数据交换。

与之前看过的SynchronousQueue不同的是，Exchanger实现了不同线程间的相互交换，而SynchronousQueue是一个线程传递数据给另一个线程，一个是交换，一个是传递。

## 算法原理

javadoc里面有一段关于Exchanger的实现的介绍，原文为：

```java
The basic idea is to maintain a "slot", which is a reference to
a Node containing both an Item to offer and a "hole" waiting to
get filled in.  If an incoming "occupying" thread sees that the
slot is null, it CAS'es (compareAndSets) a Node there and waits
for another to invoke exchange.  That second "fulfilling" thread
sees that the slot is non-null, and so CASes it back to null,
also exchanging items by CASing the hole, plus waking up the
occupying thread if it is blocked.  In each case CAS'es may
fail because a slot at first appears non-null but is null upon
CAS, or vice-versa.  So threads may need to retry these
actions.
```

看懂应该没什么问题，举个栗子说明下，2个部落人（精灵和矮人吧）去集市交易，精灵到集市找一圈发现矮人没来，就想地皮那么贵先圈块地插个牌占坑吧，然后精灵扔下货该睡觉睡觉，该干嘛干嘛去了，矮人来集市一看我靠，你来这么早啊，赶紧把货交换了，通知下精灵，东西我换了，我先走了，赶紧拿货回家吧，拜了拜个了您。

## 结构

```java
/** cup个数，控制slot数量和自旋 */
private static final int NCPU = Runtime.getRuntime().availableProcessors();
/** slot数量 */
private static final int CAPACITY = 32;
/** 
 * slot最大用到多少
 */
private static final int FULL =
    Math.max(0, Math.min(CAPACITY, NCPU / 2) - 1);
/** spin次数 */
private static final int SPINS = (NCPU == 1) ? 0 : 2000;
/** 超时exchange在park前的自旋次数 */
private static final int TIMED_SPINS = SPINS / 20;
/** tryCancel时更新，表示取消 */
private static final Object CANCEL = new Object();
/** 代表null入参或exchange返回null */
private static final Object NULL_ITEM = new Object();
/** 要交换数据的节点 */
private static final class Node extends AtomicReference<Object> {
    /** 创建该Node的线程要交换的数据 */
    public final Object item;
    /** 绑定的线程 */
    public volatile Thread waiter;
    /**
     * Creates node with given item and empty hole.
     * @param item the item
     */
    public Node(Object item) {
        this.item = item;
    }
}
/**
 * slot（坑位）就是数据交换的地方，用了缓存行填充，避免伪共享
 */
private static final class Slot extends AtomicReference<Object> {
    // Improve likelihood of isolation on <= 64 byte cache lines
    long q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, qa, qb, qc, qd, qe;
}
/**
 * Slot 数组
 */
private volatile Slot[] arena = new Slot[CAPACITY];
/**
 * slot数组最大有几个可用
 */
private final AtomicInteger max = new AtomicInteger();
/** 空构造 */
public Exchanger() {
}
```

## 调用方法

### exchange

```java
public V exchange(V x) throws InterruptedException {
    if (!Thread.interrupted()) {
        Object v = doExchange((x == null) ? NULL_ITEM : x, false, 0);
        if (v == NULL_ITEM)
            return null;
        if (v != CANCEL)
            return (V)v;
        Thread.interrupted(); // Clear interrupt status on IE throw
    }
    throw new InterruptedException();
}
public V exchange(V x, long timeout, TimeUnit unit)
    throws InterruptedException, TimeoutException {
    if (!Thread.interrupted()) {
        Object v = doExchange((x == null) ? NULL_ITEM : x,
                              true, unit.toNanos(timeout));
        if (v == NULL_ITEM)
            return null;
        if (v != CANCEL)
            return (V)v;
        if (!Thread.interrupted()) //线程没有被中断抛超时异常
            throw new TimeoutException();
    }
    throw new InterruptedException();
}
```

一个带超时响应一个不带，最后都是调用`doExchange()`方法。返回值3种情况：

**1、** 交换到null；

**2、** 正常值；

**3、** 被中断，抛异常；

### doExchange

```java
/** 实现交换的方法，timed和nanos控制超时 */
private Object doExchange(Object item, boolean timed, long nanos) {
    Node me = new Node(item);                 // 创建node
    int index = hashIndex();                  // hasIndex近似对max的mode操作,获取slot的index
    int fails = 0;                            // cas失败次数
    for (;;) {
        Object y;                             // Contents of current slot
        Slot slot = arena[index]; //arena并没有初始化，所以slot用到的时候需要create
        if (slot == null)                     // 如果slot为null，那就创建一个
            createSlot(index);                // Continue loop to reread
        else if ((y = slot.get()) != null &&  // 如果某个slot不会null，那就说明已经有其他线程占用在等待交换
                 slot.compareAndSet(y, null)) { //先cas设置为null，防止其他线程
            Node you = (Node)y;               // Transfer item
            if (you.compareAndSet(null, item)) { 
                LockSupport.unpark(you.waiter); //交换自己的值，然后唤醒节点等待的线程
                return you.item; //返回交换后的值
            }                                 // Else cancelled; continue
        }
        else if (y == null &&                 // 如果slot还没有被占用，那就占用
                 slot.compareAndSet(null, me)) {
            if (index == 0)                   // 在0 slot上阻塞
                return timed ?
                    awaitNanos(me, slot, nanos) :
                    await(me, slot);
            Object v = spinWait(me, slot);    // Spin wait for non-0
            if (v != CANCEL)
                return v;
            me = new Node(item);              // 丢弃之前的cancel节点，新建一个
            int m = max.get();
            if (m > (index >>>= 1))           // 有可能是max太大了，减少下
                max.compareAndSet(m, m - 1);  
        }
        else if (++fails > 1) {               // 如果在一个index slot上2次都失败
            int m = max.get();
            if (fails > 3 && m < FULL && max.compareAndSet(m, m + 1)) //失败3次，那就扩大max，index换个位置试试
                index = m + 1;                // Grow on 3rd failed slot
            else if (--index < 0)
                index = m;                    // Circularly traverse
        }
    }
}
```

### hashIndex

```java
private final int hashIndex() {
    long id = Thread.currentThread().getId();
    int hash = (((int)(id ^ (id >>> 32))) ^ 0x811c9dc5) * 0x01000193;
    int m = max.get();
    int nbits = (((0xfffffc00  >> m) & 4) | // Compute ceil(log2(m+1))
                 ((0x000001f8 >>> m) & 2) | // The constants hold
                 ((0xffff00f2 >>> m) & 1)); // a lookup table
    int index;
    while ((index = hash & ((1 << nbits) - 1)) > m)       // May retry on
        hash = (hash >>> nbits) | (hash << (33 - nbits)); // non-power-2 m
    return index;
}
```

这个方法用了FNV-1a算法，说实话没看懂，但是近似看成是对max的mod操作，返回要查找的slot数组下标。

### createSlot

```java
/** 创建一个slot */
private void createSlot(int index) {
    // Create slot outside of lock to narrow sync region
    Slot newSlot = new Slot();
    Slot[] a = arena;
    synchronized (a) {
        if (a[index] == null)
            a[index] = newSlot;
    }
}
```

### await

```java
/** slot 0上的阻塞 */
private static Object await(Node node, Slot slot) {
    Thread w = Thread.currentThread();
    int spins = SPINS; //跟awaitNanos不一样
    for (;;) {
        Object v = node.get();
        if (v != null) //这里判断node.get，如果有其他线程交换会cas这个值
            return v;
        else if (spins > 0)                 // 先自旋
            --spins;
        else if (node.waiter == null)       // 自旋次数够了后，如果节点的等待线程null，设置当前
            node.waiter = w;
        else if (w.isInterrupted())         // 如果线程被中断，cancel节点
            tryCancel(node, slot);
        else                                // park等待唤醒
            LockSupport.park(node);
    }
}
/** 响应超时的await */
private Object awaitNanos(Node node, Slot slot, long nanos) {
    int spins = TIMED_SPINS; //跟await不一样
    long lastTime = 0;
    Thread w = null;
    for (;;) {
        Object v = node.get();
        if (v != null)
            return v;
        long now = System.nanoTime();
        if (w == null)
            w = Thread.currentThread();
        else
            nanos -= now - lastTime;
        lastTime = now;
        if (nanos > 0) { //还没超时
            if (spins > 0)
                --spins;
            else if (node.waiter == null)
                node.waiter = w;
            else if (w.isInterrupted())
                tryCancel(node, slot);
            else
                LockSupport.parkNanos(node, nanos);
        }
        else if (tryCancel(node, slot) && !w.isInterrupted()) 
            //超时后cancel节点，如果线程没有被中断，扫描其他位置slot，看看有没有可交换的，有就交换
            return scanOnTimeout(node);
    }
}
```

带超时的await，在超时后如果线程没有被中断，会扫描其他位置的slot，看看有没有可交换的节点。

### tryCancel

```java
/** cancel指定slot位置的节点，清空slot、设置节点的值cancel */
private static boolean tryCancel(Node node, Slot slot) {
    if (!node.compareAndSet(null, CANCEL))
        return false;
    if (slot.get() == node) // 再次校验node是否变化，估计是怕节点被交换处理掉了
        slot.compareAndSet(node, null);
    return true;
}
```

### spinWait

```java
/** 在非0slot自旋 */
private static Object spinWait(Node node, Slot slot) {
    int spins = SPINS; //这里的spins跟awaitNanos里面的超时自旋不一样
    for (;;) {
        Object v = node.get();
        if (v != null)
            return v;
        else if (spins > 0)
            --spins;
        else
            tryCancel(node, slot); //自旋次数达到还没有交换，那就cancel
    }
}
```

## 总结

Exchanger这个类，估计是我孤陋寡闻了，没看见实际运用的案例，不过还好，不是很难，理解原理看看代码就行。

写完这个类，就结束JUC系列吧，其实还有个forkjoin没写，后面看看吧。当初面试阿里，窃以为谈的不错，没想到最后挂了，哎，郁闷了好久，所以写了这个系列，磕磕绊绊的，没想到能写这么多，感谢网上那些参考的文章，有些漏了没写，过段时间再试试阿里吧。
