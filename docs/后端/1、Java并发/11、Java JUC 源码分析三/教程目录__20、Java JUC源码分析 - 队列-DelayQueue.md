# 20、Java JUC源码分析 - 队列-DelayQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/20.html
- 分类：Java并发
- 分组：教程目录
画个JUC阻塞队列的类关系图，之前都没在意，画一下感觉会清楚很多

DelayQueue是无界的阻塞队列，其特点是实现队列元素的延迟出队，通俗点说就是队列元素可以设置延迟时间，时间不到，就待在队列中，很有意思的东西，感觉跟redis设置过期时间一样。队列元素不容许添加null元素。DelayQueue可以用来实现调度的定时任务或者缓存的过期。

添加的队列元素必须实现Delayed接口：

```java
//实现Delayed接口的类也必须实现Comparable接口
public interface Delayed extends Comparable<Delayed> {
    /**
     * 获取剩余延迟时间，注意这里的传入的时间单位，getDelay返回的时间要做转换
     */
    long getDelay(TimeUnit unit);
}
```

实现类必须同时实现Delayed和Comparable接口。

看下内部结构和构造：

```java
private transient final ReentrantLock lock = new ReentrantLock();
//内部使用PriorityQueue存储数据
private final PriorityQueue<E> q = new PriorityQueue<E>();
/**
 * Thread designated to wait for the element at the head of
 * the queue.  This variant of the Leader-Follower pattern
 * (http://www.cs.wustl.edu/~schmidt/POSA/POSA2/) serves to
 * minimize unnecessary timed waiting.  When a thread becomes
 * the leader, it waits only for the next delay to elapse, but
 * other threads await indefinitely.  The leader thread must
 * signal some other thread before returning from take() or
 * poll(...), unless some other thread becomes leader in the
 * interim.  Whenever the head of the queue is replaced with
 * an element with an earlier expiration time, the leader
 * field is invalidated by being reset to null, and some
 * waiting thread, but not necessarily the current leader, is
 * signalled.  So waiting threads must be prepared to acquire
 * and lose leadership while waiting.
 */
private Thread leader = null;
/**
 * Condition signalled when a newer element becomes available
 * at the head of the queue or a new thread may need to
 * become leader.
 */
private final Condition available = lock.newCondition();
/**
 * 默认空构造
 */
public DelayQueue() {}
```

使用PriorityQueue存储元素，leader的用法有点ReetrantLock的独占锁的意思。

添加元素的方法：

```java
public boolean add(E e) {
    return offer(e);
}
/**
 * 添加元素
 */
public boolean offer(E e) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        q.offer(e);
        if (q.peek() == e) { //添加元素后peek还是e，重置leader，通知条件队列
            leader = null;
            available.signal();
        }
        return true;
    } finally {
        lock.unlock();
    }
}
public void put(E e) {
    offer(e);
}
/**
 * 超时时间没有，无界，肯定成功
 */
public boolean offer(E e, long timeout, TimeUnit unit) {
    return offer(e);
}
```

最后都是调动offer，带超时的offer，超时时间不起作用，因为是无界的，不会产生阻塞，所以超时没有意思。

看下获取poll\take\peek:

```java
public E poll() {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        E first = q.peek();
        if (first == null || first.getDelay(TimeUnit.NANOSECONDS) > 0) //队列为空或者延迟时间未过期
            return null;
        else
            return q.poll();
    } finally {
        lock.unlock();
    }
}
/**
 * take元素，元素未过期需要阻塞
 */
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    try {
        for (;;) {
            E first = q.peek();
            if (first == null)
                available.await(); //队列空，加入条件队列
            else {
                long delay = first.getDelay(TimeUnit.NANOSECONDS); //获取剩余延迟时间
                if (delay <= 0) //小于0，那就poll元素
                    return q.poll();
                else if (leader != null) //有延迟，检查leader，不为空说明有其他线程在等待，那就加入条件队列
                    available.await();
                else { 
                    Thread thisThread = Thread.currentThread();
                    leader = thisThread; //设置当前为leader等待
                    try {
                        available.awaitNanos(delay); //条件队列等待指定时间
                    } finally {
                        if (leader == thisThread) //检查是否被其他线程改变，没有就重置，再次循环
                            leader = null;
                    }
                }
            }
        }
    } finally {
        if (leader == null && q.peek() != null) //leader为空并且队列不空，说明没有其他线程在等待，那就通知条件队列
            available.signal();
        lock.unlock();
    }
}
/**
 * 响应超时的poll
 */
public E poll(long timeout, TimeUnit unit) throws InterruptedException {
    long nanos = unit.toNanos(timeout);
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    try {
        for (;;) {
            E first = q.peek();
            if (first == null) {
                if (nanos <= 0)
                    return null;
                else
                    nanos = available.awaitNanos(nanos);
            } else {
                long delay = first.getDelay(TimeUnit.NANOSECONDS);
                if (delay <= 0)
                    return q.poll();
                if (nanos <= 0)
                    return null;
                if (nanos < delay || leader != null)
                    nanos = available.awaitNanos(nanos);
                else {
                    Thread thisThread = Thread.currentThread();
                    leader = thisThread;
                    try {
                        long timeLeft = available.awaitNanos(delay);
                        nanos -= delay - timeLeft;
                    } finally {
                        if (leader == thisThread)
                            leader = null;
                    }
                }
            }
        }
    } finally {
        if (leader == null && q.peek() != null)
            available.signal();
        lock.unlock();
    }
}
/**
 * 获取queue[0]，peek是不移除的
 */
public E peek() {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        return q.peek();
    } finally {
        lock.unlock();
    }
}
```

不带阻塞的poll，直接peek元素，判断非空并且延迟时间未到，那就return null，到了那就poll。take()方法考虑的就比较多：1.队列为空，阻塞；2.不空就看延迟时间，到了就poll，没到就看有没有其他线程已经占用等待了，有就阻塞，没有就自己占用leader，然后wait。

DelayedQueue其他方法不看了，理解offer和take就OK了。
