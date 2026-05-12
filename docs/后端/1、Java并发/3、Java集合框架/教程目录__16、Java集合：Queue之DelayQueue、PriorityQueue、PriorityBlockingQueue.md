# 16、Java集合：Queue之DelayQueue、PriorityQueue、PriorityBlockingQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/16.html
- 分类：Java并发
- 分组：教程目录
## DelayQueue

> public class DelayQueue extends AbstractQueue implements BlockingQueue

**1、** Delayed元素的一个基于优先级的无界阻塞队列，只有在延迟期满时才能从中提取元素；

**2、** 如果延迟都还没有期满，则队列没有头部，并且poll将返回null；

**3、** 不允许使用null元素；

成员变量

```java
/**
 * 可重入的互斥锁
 */
private final transient ReentrantLock lock = new ReentrantLock();
/**
 * 一个基于优先级堆的无界优先级队列。可自然排序。不允许使用 null 元素。
 */
private final PriorityQueue<E> q = new PriorityQueue<E>();
/**
 * 唤醒或等待take线程的条件
 */
private final Condition available = lock.newCondition();
```

构造方法

```java
/**
 * 创建一个最初为空的新 DelayQueue。
 */
public DelayQueue() {}
/**
 * 创建一个最初包含 Delayed 实例的给定 collection 元素的 DelayQueue。
 */
public DelayQueue(Collection<? extends E> c) {
    this.addAll(c);
}
```

常用方法

> boolean add(E e)：将指定元素插入此延迟队列中。

```java
public boolean add(E e) {
    return offer(e);
}
```

> boolean offer(E e)：将指定元素插入此延迟队列。

```java
public boolean offer(E e) {
    final ReentrantLock lock = this.lock;
    lock.lock();//阻塞式获取锁
    try {
        E first = q.peek();//获取但不移除此队列的头部；如果此队列为空，则返回 null。
        q.offer(e);//将指定的元素插入此优先级队列。
        if (first == null || e.compareTo(first) < 0)
            available.signalAll();//队列中无元素，唤醒take线程
        return true;
    } finally {
        lock.unlock();//释放锁
    }
}
```

> Epeek()：获取但不移除此队列的头部；如果此队列为空，则返回 null。

```java
public E peek() {
    final ReentrantLock lock = this.lock;
    lock.lock();//阻塞式获取锁
    try {
        return q.peek();// 获取但不移除此队列的头；如果此队列为空，则返回 null。
    } finally {
        lock.unlock();//释放锁
    }
}
```

> Epoll()： 获取并移除此队列的头，如果此队列不包含具有已到期延迟时间的元素，则返回 null。

```java
public E poll() {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        E first = q.peek();//  获取但不移除此队列的头；如果此队列为空，则返回 null。
        //getDelay:返回与此对象相关的剩余延迟时间，以给定的时间单位表示。
        if (first == null || first.getDelay(TimeUnit.NANOSECONDS) > 0)
            return null;//队列为空或元素未到期
        else {
            E x = q.poll();//获取并移除此队列的头，如果此队列为空，则返回 null。
            assert x != null;//非空校验
            if (q.size() != 0)//队列中还有元素
                available.signalAll();//唤醒take线程
            return x;
        }
    } finally {
        lock.unlock();
    }
}
```

> void put(E e)：将指定元素插入此延迟队列。

```java
public void put(E e) {
    offer(e);
}
```

> Etake()：获取并移除此队列的头部，在可从此队列获得到期延迟的元素之前一直等待（如有必要）。

```java
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();//阻塞式获取锁，可响应线程中断
    try {
        for (;;) {
            E first = q.peek();//获取但不移除此队列的头；如果此队列为空，则返回 null。
            if (first == null) {
                available.await();//队列为空，线程等待，释放锁
            } else {
                long delay =  first.getDelay(TimeUnit.NANOSECONDS);//获取元素剩余到期市场，并判断是否到期
                if (delay > 0) {
                    long tl = available.awaitNanos(delay);//元素还未到期，线程等待指定时间，释放锁
                } else {
                    E x = q.poll();//获取并移除此队列的头，如果此队列为空，则返回 null。
                    assert x != null;//非空校验
                    if (q.size() != 0)
                        available.signalAll(); // 线程非空，唤醒其它所有take线程                        return x;//返回队头元素
                }
            }
        }
    } finally {
        lock.unlock();//释放锁
    }
}
```

由源码看出延迟队列DelayQueue操作元素是通过PriorityQueue实现的，PriorityQueue是一个基于优先级堆的无界优先级队列。利用可重入的互斥锁ReentrantLock保证线程安全，同时利用Condition保证插入或获取元素是阻塞的。

## PriorityQueue

> public class PriorityQueue extends AbstractQueue implements java.io.Serializable

**1、** 一个基于优先级堆的无界优先级队列；

**2、** 优先级队列不允许使用null元素；

**3、** 默认容量11，当元素容量小于64时，扩容double，否则扩容50%；

**4、** 不是同步的；

成员变量

```java
/**
 * 初始容量
 */
private static final int DEFAULT_INITIAL_CAPACITY = 11;
/**
 * 元素以平衡二叉树形式存储
 */
private transient Object[] queue;
/**
 * 优先级队列元素数
 */
private int size = 0;
/**
 * 元素自然排序方式
 */
private final Comparator<? super E> comparator;
/**
 * 优先级队列修改次数
 */
private transient int modCount = 0;
```

构造方法

```java
/**
 *  使用默认的初始容量（11），并根据其自然顺序对元素进行排序。
 */
public PriorityQueue() {
    this(DEFAULT_INITIAL_CAPACITY, null);
}
 /**
 * 使用指定的初始容量创建Queue，并根据指定的比较器对元素进行排序。
 */
public PriorityQueue(int initialCapacity,
                     Comparator<? super E> comparator) {
    // Note: This restriction of at least one is not actually needed,
    // but continues for 1.5 compatibility
    if (initialCapacity < 1)
        throw new IllegalArgumentException();
    this.queue = new Object[initialCapacity];
    this.comparator = comparator;
}
```

常用方法

> boolean add(E e)：将指定的元素插入此优先级队列。

```java
public boolean add(E e) {
    return offer(e);
}
```

> boolean offer(E e)： 将指定的元素插入此优先级队列。

```java
public boolean offer(E e) {
    if (e == null)
        throw new NullPointerException();
    modCount++;//修改次数+1
    int i = size;
    if (i >= queue.length)
        grow(i + 1);//元素数可能不够，需要扩容
    size = i + 1;
    if (i == 0)//队列为空
        queue[0] = e;
    else
        siftUp(i, e);
    return true;
}
 /**
 * 队列扩容
 */
private void grow(int minCapacity) {
    if (minCapacity < 0) // overflow
        throw new OutOfMemoryError();
int oldCapacity = queue.length;//获取当前元素数
    // <64 双倍扩容; >=64 扩容 50%
    int newCapacity = ((oldCapacity < 64)?
                       ((oldCapacity + 1) * 2):
                       ((oldCapacity / 2) * 3));
    if (newCapacity < 0) // overflow
        newCapacity = Integer.MAX_VALUE;//最大边界
    if (newCapacity < minCapacity)
        newCapacity = minCapacity;
    queue = Arrays.copyOf(queue, newCapacity);//数组复制
}
//选择排序方式并插入相应位置
private void siftUp(int k, E x) {
    if (comparator != null)
        siftUpUsingComparator(k, x);
    else
        siftUpComparable(k, x);
}
/**
 * Comparable 方式排序
 */
private void siftUpComparable(int k, E x) {
    Comparable<? super E> key = (Comparable<? super E>) x;
    while (k > 0) {
        int parent = (k - 1) >>> 1;
        Object e = queue[parent];
        if (key.compareTo((E) e) >= 0)
            break;
        queue[k] = e;
        k = parent;
    }
    queue[k] = key;
}
 /**
 * Comparator 方式排序
 */
private void siftUpUsingComparator(int k, E x) {
    while (k > 0) {
        int parent = (k - 1) >>> 1;
        Object e = queue[parent];
        if (comparator.compare(x, (E) e) >= 0)
            break;
        queue[k] = e;
        k = parent;
    }
    queue[k] = x;
}
```

> Epeek()： 获取但不移除此队列的头；如果此队列为空，则返回 null。

```java
public E peek() {
    if (size == 0)
        return null;
    return (E) queue[0];
}
```

> Epoll() ：获取并移除此队列的头，如果此队列为空，则返回 null。

```java
public E poll() {
    if (size == 0)
        return null;
    int s = --size;//更新元素数
    modCount++;//修改次数+1
    E result = (E) queue[0];//获取队列头部元素
    E x = (E) queue[s];//获取尾部元素
    queue[s] = null;//末尾置空
    if (s != 0)//队列中还有元素
        siftDown(0, x);
    return result;
}
/**
 * 元素重新排序
 */
 private void siftDown(int k, E x) {
    if (comparator != null)
        siftDownUsingComparator(k, x);
    else
        siftDownComparable(k, x);
}
/**
 * Comparable方式重新排序
 */
private void siftDownComparable(int k, E x) {
    Comparable<? super E> key = (Comparable<? super E>)x;
    int half = size >>> 1;        // loop while a non-leaf
    while (k < half) {
        int child = (k << 1) + 1; // assume left child is least
        Object c = queue[child];
        int right = child + 1;
        if (right < size &&
            ((Comparable<? super E>) c).compareTo((E) queue[right]) > 0)
            c = queue[child = right];
        if (key.compareTo((E) c) <= 0)
            break;
        queue[k] = c;
        k = child;
    }
    queue[k] = key;
}
/**
 * Comparator方式重新排序
 */
private void siftDownUsingComparator(int k, E x) {
    int half = size >>> 1;
    while (k < half) {
        int child = (k << 1) + 1;
        Object c = queue[child];
        int right = child + 1;
        if (right < size &&
            comparator.compare((E) c, (E) queue[right]) > 0)
            c = queue[child = right];
        if (comparator.compare(x, (E) c) <= 0)
            break;
        queue[k] = c;
        k = child;
    }
    queue[k] = x;
}
```

由源码看出，PriorityQueue是非线程安全的，利用Comparator或Comparable进行自然排序，从而实现有优先级的队列，以平衡二叉树的形式存储在transient Object[] queue中，虽然api中介绍说是无界队列，但从源码看出其实是有边界的 ，值为Integer.MAX_VALUE;只是边界特别大，从某种程度上来说，可以理解为无边界。

## PriorityBlockingQueue

> public class PriorityBlockingQueue extends AbstractQueue implements BlockingQueue, java.io.Serializable

**1、** 一个无界阻塞队列，它使用与类PriorityQueue相同的顺序规则，并且提供了阻塞获取操作；

**2、** 此队列逻辑上是无界的，但是资源被耗尽时试图执行add操作也将失败（导致OutOfMemoryError）；

**3、** 不允许使用null元素；

**4、** 不允许插入不可比较的对象；

成员变量

```java
//元素操作均基于PriorityQueue
private final PriorityQueue<E> q;
//可重入的互斥锁，该处采用公平锁
private final ReentrantLock lock = new ReentrantLock(true);
//take条件
private final Condition notEmpty = lock.newCondition();
```

构造方法

```java
/**
 * 用默认的初始容量 (11) 创建一个 PriorityBlockingQueue，并根据元素的自然顺序对其元素进行排序。
 */
public PriorityBlockingQueue() {
    q = new PriorityQueue<E>();
}
/**
 * 使用指定的初始容量创建一个 PriorityBlockingQueue，并根据指定的比较器对其元素进行排序。
 */
public PriorityBlockingQueue(int initialCapacity,
                             Comparator<? super E> comparator) {
    q = new PriorityQueue<E>(initialCapacity, comparator);
}
/**
 * 使用指定的初始容量创建一个 PriorityBlockingQueue，并根据元素的自然顺序对其元素进行排序。
 */
public PriorityBlockingQueue(int initialCapacity) {
    q = new PriorityQueue<E>(initialCapacity, null);
}
/**
 * 创建一个包含指定 collection 元素的 PriorityBlockingQueue。
 */
public PriorityBlockingQueue(Collection<? extends E> c) {
    q = new PriorityQueue<E>(c);
}
```

常用方法

> boolean add(E e)：将指定元素插入此优先级队列。

```java
public boolean add(E e) {
    return offer(e);
}
```

> boolean offer(E e)：将指定元素插入此优先级队列。

```java
public boolean offer(E e) {
    final ReentrantLock lock = this.lock;
    lock.lock();//阻塞式获取锁
    try {
        boolean ok = q.offer(e);//插入元素
        assert ok;
        notEmpty.signal();//唤醒take线程
        return true;
    } finally {
        lock.unlock();//释放锁
    }
}
```

> Epeek()：获取但不移除此队列的头；如果此队列为空，则返回 null。

```java
public E peek() {
    final ReentrantLock lock = this.lock;
    lock.lock();//阻塞式获取锁
    try {
        return q.peek();//获取元素
    } finally {
        lock.unlock();//释放锁
    }
}
```

> Epoll()：获取并移除此队列的头，如果此队列为空，则返回 null。

```java
public E poll() {
    final ReentrantLock lock = this.lock;
    lock.lock();//阻塞式获取锁
    try {
        return q.poll();//获取并移除此队列的头
    } finally {
        lock.unlock();//释放锁
    }
}
```

> Etake()：获取并移除此队列的头部，在元素变得可用之前一直等待（如果有必要）。

```java
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();//阻塞式获取锁，可响应线程中断
    try {
        try {
            while (q.size() == 0)
                notEmpty.await();//队列中无元素，阻塞等待，释放锁
        } catch (InterruptedException ie) {
            notEmpty.signal(); // propagate to non-interrupted thread
            throw ie;
        }
        E x = q.poll();//有元素，获取并移除元素
        assert x != null;
        return x;//返回元素
    } finally {
        lock.unlock();//释放锁
    }
}
```

> void put(E e)：将指定元素插入此优先级队列。

```java
public void put(E e) {
    offer(e); // never need to block
}
```

有源码看出，PriorityBlockingQueue是基于PriorityQueue实现具有优先级的无界阻塞队列，利用ReentrantLock实现线程安全，Condition实现阻塞。

DelayQueue及PriorityBlockingQueue实现具有优先级的无界阻塞队列都是基于PriorityQueue的，区别在于DelayQueue加入了延迟概念。虽说都是无界，但最大边界为：Integer.MAX_VALUE。
