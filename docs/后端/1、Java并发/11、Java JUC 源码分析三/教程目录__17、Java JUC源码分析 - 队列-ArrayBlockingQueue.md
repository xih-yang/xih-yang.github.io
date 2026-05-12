# 17、Java JUC源码分析 - 队列-ArrayBlockingQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/17.html
- 分类：Java并发
- 分组：教程目录
看ArrayBlockingQueue的javadoc说明，简单翻译过来：

**1、** 基于数组实现的有界阻塞队列，队列采用FIFO；

**2、** 因为基于数组，所以队列创建后大小不能改变线程在插入元素到一个满的队列时会阻塞，线程获取元素时，队列为空也会阻塞；

**3、** 对于队列的生产和消费线程提供了公平非公平策略；

ArrayBlockingQueue继承AbstractQueue抽象类，实现了BlockingQueue接口，BlockingQueue接口也在juc包，看下先：

```java
public interface BlockingQueue<E> extends Queue<E> {
    /**    
     * 插入元素到队列，成功就true，失败就IllegalStateException异常     
     */
    boolean add(E e);
    /**
     * 跟add一样，插入元素到队列，成功就true，不过失败的时候是false，不是异常
     */
    boolean offer(E e);
    /**
     * 插入元素到队列，跟上面2个的区别是add跟offer如果插入的时候队列full就直接返回false，而put会加入到条件队列
     */
    void put(E e) throws InterruptedException;
    /**
     * 插入元素到队列，如果队列full，就等待timeout时间，还不行就返回false
     */
    boolean offer(E e, long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 获取元素，队列空的时候会等待
     */
    E take() throws InterruptedException;
    /**
     * 获取元素，队列空的时候会等待timeout时间
     */
    E poll(long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 获取剩余容量，不能通过检查这个方法判断插入操作是否成功，因为可能有别的线程插入或删除元素
     */
    int remainingCapacity();
    boolean remove(Object o);
    public boolean contains(Object o);
    /**
     * 从队列移除元素，添加到新的
     */
    int drainTo(Collection<? super E> c);
    /**
     * 移除指定大小的元素，添加到新的
    int drainTo(Collection<? super E> c, int maxElements);
}
```

看下ArrayBlockingQueue的结构：

```java
//数组存储队列元素
final Object[] items;
/** 队列获取位置 for next take, poll, peek or remove */
int takeIndex;
/** 队列存储位置 for next put, offer, or add */
int putIndex;
/** 队列元素个数 */
int count;
/*
 * 利用可重入锁ReentrantLock控制并发
 */
/** Main lock guarding all access */
final ReentrantLock lock;
/** 条件队列控制获取 */
private final Condition notEmpty;
/** 条件队列控制put */
private final Condition notFull;
/**
*初始化，传入队列大小和重入锁的公平策略，默认非公平
*/    
public ArrayBlockingQueue(int capacity) {
    this(capacity, false);
}
public ArrayBlockingQueue(int capacity, boolean fair) {
    if (capacity <= 0)
        throw new IllegalArgumentException();
    this.items = new Object[capacity];
    lock = new ReentrantLock(fair);
    notEmpty = lock.newCondition();
    notFull =  lock.newCondition();
}
```

这里可以看到ArrayBlockingQueue是基于数组实现的有界队列，利用可重入锁ReentrantLock控制并发，然后lock的2个条件队列分别用于获取时队列为空时等待，存储时队列full时等待。

看下几个重要方法：

add和offer：

```java
//add操作和offer的区别就在于插入的时候队列full是返回异常还是false
public boolean add(E e) {
    return super.add(e);
}
调用AbstractQueue中的：
public boolean add(E e) {
    if (offer(e)) 
        return true;
    else
        throw new IllegalStateException("Queue full");
}
回到ArrayBlockingQueue的offer
public boolean offer(E e) {
    checkNotNull(e); //单独提出一个方法判null
    final ReentrantLock lock = this.lock;
    lock.lock(); //获取锁
    try {
        if (count == items.length) //队列满时返回false
            return false;
        else {
            insert(e); //队列不满就插入元素，返回true
            return true;
        }
    } finally {
        lock.unlock(); //释放条件锁
    }
}
//响应超时时间的存储
public boolean offer(E e, long timeout, TimeUnit unit)
    throws InterruptedException {
    checkNotNull(e);
    long nanos = unit.toNanos(timeout);
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly(); //响应中断
    try {
        while (count == items.length) { //offer的时候队列full
            if (nanos <= 0) //重新唤醒后检查超时，小于0就返回false，不行就继续条件队列park
                return false;
            nanos = notFull.awaitNanos(nanos); //加入lock条件队列，底层park指定时间
        }
        insert(e);
        return true;
    } finally {
        lock.unlock();
    }
}
private static void checkNotNull(Object v) {
    if (v == null)
        throw new NullPointerException();
}
//插入元素
private void insert(E x) {
    items[putIndex] = x;
    putIndex = inc(putIndex); //新的put位置
    ++count;
    notEmpty.signal(); //这里在插入元素后通知lock的非空条件队列上的线程
}
//使用使用数组
final int inc(int i) {
    return (++i == items.length) ? 0 : i;
}
```

put和take:

```java
public void put(E e) throws InterruptedException {
    checkNotNull(e);
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly(); //可中断
    try {
        while (count == items.length) //存储时队列满，noteFull条件队列等待
            notFull.await();
        insert(e); //插入元素
    } finally {
        lock.unlock();
    }
}
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly(); //可中断
    try {
        while (count == 0) //获取时队列空，notEmpty条件队列等待
            notEmpty.await();
        return extract(); //获取元素
    } finally {
        lock.unlock();
    }
}
private E extract() {
    final Object[] items = this.items;
    E x = this.<E>cast(items[takeIndex]); //类型转换，单独出来的方法
    items[takeIndex] = null;
    takeIndex = inc(takeIndex); //改变take位置
    --count;
    notFull.signal(); //获取元素后，需要通知所有等待插入条件队列线程可以插入元素
    return x;
}
```

put和take操作获取lock的时候都是响应中断的，跟之前的不一样。put操作insert后需要通知条件等待队列notEmpty的线程，让线程可以take。take操作extract获取元素后通知notFull，让线程可以put插入元素。有点绕口，记得有2个条件等待队列跟他们的作用就行，不要纠结名称。

看下poll：

```java
public E poll() {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        return (count == 0) ? null : extract(); //获取锁后，队列不空就返回当前，否则返回null
    } finally {
        lock.unlock();
    }
}
public E poll(long timeout, TimeUnit unit) throws InterruptedException {
    long nanos = unit.toNanos(timeout);
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly(); //可中断
    try {
        while (count == 0) {
            if (nanos <= 0)
                return null; //返回null
            nanos = notEmpty.awaitNanos(nanos); //获取锁，响应超时的获取
        }
        return extract();
    } finally {
        lock.unlock();
    }
}
```

2个poll跟take的区别是take获取时队列空会加入条件队列，而一个poll则返回null，另一个响应超时后返回null，都不会加入条件队列。

其他方法都差不多，看起来还是相对简单的。
