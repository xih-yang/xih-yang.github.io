# 15、Java集合：Queue之ArrayBlockingQueue、LinkedBlockingQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/15.html
- 分类：Java并发
- 分组：教程目录
## ArrayBlockingQueue

> public class ArrayBlockingQueue extends AbstractQueue implements BlockingQueue, java.io.Serializable

**1、** 一个由数组支持的有界阻塞队列；

**2、** 队列按FIFO（先进先出）原则对元素进行排序；

**3、** 试图向已满队列中放入元素会导致操作受阻塞；试图从空队列中提取元素将导致类似阻塞；

**4、** 支持对等待的生产者线程和使用者线程进行排序的可选公平策略默认情况下，不保证是这种排序然而，通过将公平性(fairness)设置为true而构造的队列允许按照FIFO顺序访问线程公平性通常会降低吞吐量，但也减少了可变性和避免了“不平衡性”；

成员变量

```java
/** 队列元素存储在此数组中  */
private final E[] items;
/** 下一个被take or poll的元素的index */
private int takeIndex;
/** 下一个被put, offer, or add的元素的index */
private int putIndex;
/** 队列中元素数 */
private int count;
/** 可重入的互斥锁 Lock */
private final ReentrantLock lock;
/** 标识队列是否为空，即获取元素的等待条件 */
private final Condition notEmpty;
/** 标识队列是否已满 ，即放入元素的等待条件*/
private final Condition notFull;
```

构造方法

```java
/**
* 创建一个带有给定的（固定）容量和默认访问策略的ArrayBlockingQueue。
 */
public ArrayBlockingQueue(int capacity) {
    this(capacity, false);
}
/**
 * 创建一个具有给定的（固定）容量和指定访问策略的ArrayBlockingQueue。
 */
public ArrayBlockingQueue(int capacity, boolean fair) {
    if (capacity <= 0)
        throw new IllegalArgumentException();
    this.items = (E[]) new Object[capacity];//实例化指定容量数组
    lock = new ReentrantLock(fair);//实例化指定策略的重入锁(公平或非公平)
    //实例化判断是否非空的 Condition 实例
    notEmpty = lock.newCondition();
    //实例化判断是否已满的 Condition 实例
    notFull =  lock.newCondition();
}
/**
 * 创建一个具有给定的（固定）容量和指定访问策略的ArrayBlockingQueue。
 * 它最初包含给定 collection 的元素，并以 collection 迭代器的遍历顺序添加元素。
 */
public ArrayBlockingQueue(int capacity, boolean fair,
                          Collection<? extends E> c) {
    this(capacity, fair);
    if (capacity < c.size())
        throw new IllegalArgumentException();
    for (Iterator<? extends E> it = c.iterator(); it.hasNext();)
        add(it.next());
}
```

常用方法

> boolean add(E e)：将指定的元素插入到此队列的尾部（如果立即可行且不会超过该队列的容量），在成功时返回 true，如果此队列已满，则抛出 IllegalStateException。

```java
public boolean add(E e) {
	//调用的AbstractQueue.add方法，实际在父类调用了本类的offer方法
	return super.add(e);
}
```

> boolean offer(E e)： 将指定的元素插入到此队列的尾部（如果立即可行且不会超过该队列的容量），在成功时返回 true，如果此队列已满，则返回 false。

```java
public boolean offer(E e) {
	//判断元素是否为空
	if (e == null) throw new NullPointerException();
	//获取当前锁
    final ReentrantLock lock = this.lock;
    //获取锁（若未获得，会一直去获取，直到取到锁为止）
    lock.lock();
    try {
	    //判断当前数组中元素数和数组长度是否相等
	    //相等，说明数组已满，无法添加新元素，直接返回false
       if (count == items.length)
	       return false;
       else {
	       //数组未满，添加新元素
           insert(e);
           return true;
        }
	 } finally {
		 //释放锁
	     lock.unlock();
     }
}
/**
 * 插入元素
 */
private void insert(E x) {
	items[putIndex] = x;//将元素放入到队尾
    putIndex = inc(putIndex);//计算下一个待插入元素的index
    ++count;//更新当前元素数
    notEmpty.signal();//唤醒take相关的等待线程。
}
/**
 * 计算下一个待插入元素的index
 */
final int inc(int i) {
	return (++i == items.length)? 0 : i;
}
```

> boolean remove(Object o): 从此队列中移除指定元素的单个实例（如果存在）。

```java
public boolean remove(Object o) {
	if (o == null) return false;//元素非空判断
    final E[] items = this.items;//获取当前元素组
    final ReentrantLock lock = this.lock;
    lock.lock();//获取锁
    try {
	    int i = takeIndex;//获取下一个被take的索引
        int k = 0;
        for (;;) {
	        if (k++ >= count)//循环次数大于实际元素数，退出循环
		        return false;
            if (o.equals(items[i])) {//判断是否是被移除的元素
                removeAt(i);//移除元素
                return true;
            }
            i = inc(i);//计算下一个被放入的元素
        }
    } finally {
	    lock.unlock();//释放锁
  }
}
/**
 * 移除指定index的元素
 * 若移除最后一个元素，tabkeIndex重置为0
 * 若移除0-[count-1]的任意元素，索引i后面的元素依次前移
 */
 void removeAt(int i) {
        final E[] items = this.items;//获取当前元素组
        // if removing front item, just advance
        if (i == takeIndex) {//刚刚移除队尾元素
            items[takeIndex] = null;//元素置空
            takeIndex = inc(takeIndex);//元素全部移除，takeIndex为0
        } else {
            // slide over all others up through putIndex.
            for (;;) {
                int nexti = inc(i);//被移除元素的下一个元素的index
                if (nexti != putIndex) {//下一个元素待插入的index
                    items[i] = items[nexti];//所以i后面的元素前移
                    i = nexti;
                } else {
                    items[i] = null;//队尾元素置空
                    putIndex = i;//更新实际下一个add的index为先前的队尾
                    break;
                }
            }
        }
        --count;//更新实际元素数
        notFull.signal();//唤醒add相关的等待线程。
    }
```

> Epoll()：获取并移除此队列的头，如果此队列为空，则返回 null。

```java
public E poll() {
	final ReentrantLock lock = this.lock;
    lock.lock();//阻塞，获取锁
    try {
	    if (count == 0)//队列为空，不需要移除
	        return null;
        E x = extract();//移除元素
        return x;//返回被移除的元素
    } finally {
	    lock.unlock();//释放锁
    }
}
/**
 * 移除并返回被移除的元素，获取到锁的前提下，调用此方法
 */
private E extract() {
    final E[] items = this.items;
    E x = items[takeIndex];//获取下一个takeIndex的元素
    items[takeIndex] = null;//元素置空
    takeIndex = inc(takeIndex);//计算下一个takeIndex
    --count;//更新元素数
    notFull.signal();//唤醒add相关线程
    return x;//返回被移除的元素
}
```

> Epeek()：获取但不移除此队列的头；如果此队列为空，则返回 null。

```java
public E peek() {
    final ReentrantLock lock = this.lock;
    lock.lock();//阻塞，获取锁
    try {
        //无元素，返回空，否则返回下一个待获取的元素
        return (count == 0) ? null : items[takeIndex];
    } finally {
        lock.unlock();//释放锁
    }
}
```

> void put(E e)：将指定的元素插入此队列的尾部，如果该队列已满，则等待可用的空间。

```java
public void put(E e) throws InterruptedException {
    if (e == null) throw new NullPointerException();//非空校验
    final E[] items = this.items;//获取当前元素组
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();//阻塞获取锁，但响应中断
    try {
        try {
            while (count == items.length)//队列已满
                notFull.await();//是否已满进行等待
        } catch (InterruptedException ie) {
            notFull.signal(); // 唤醒没有中断的线程
            throw ie;//抛出线程中断异常
        }
        insert(e);//队列未满，插入元素
    } finally {
        lock.unlock();//释放锁
    }
}
```

> Etake()：获取并移除此队列的头部，在元素变得可用之前一直等待（如果有必要）。

```java
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();//阻塞时获取锁，但响应中断
    try {
        try {
            while (count == 0)
                notEmpty.await();//队列为空，进行等待
        } catch (InterruptedException ie) {
            notEmpty.signal(); // 唤醒非中断线程
            throw ie;
        }
        E x = extract();//移除元素
        return x;//并返回被移除的元素
    } finally {
        lock.unlock();//释放锁
    }
}
```

由源码可知，ArrayBlockingQueue利用可重入的互斥锁ReentrantLock保证线程安全，并且利用Condition进行阻塞式take或者put。poll或offer支持两种操作限制：(Condition.await() 一直阻塞等待， awaitNanos(long nanosTimeout) 有时间限制的阻塞等待)

## LinkedBlockingQueue

> public class LinkedBlockingQueue extends AbstractQueue implements BlockingQueue, java.io.Serializable

**1、** 一个基于已链接节点的、范围任意的blockingqueue；

**2、** 队列按FIFO（先进先出）排序元素；

**3、** 链接队列的吞吐量通常要高于基于数组的队列，但是在大多数并发应用程序中，其可预知的性能要低；

**4、** 可选的容量范围构造方法参数作为防止队列过度扩展的一种方法如果未指定容量，则它等于Integer.MAX_VALUE除非插入节点会使队列超出容量，否则每次插入后会动态地创建链接节点；

成员变量

```java
static class Node<E> {//静态内部类
    /**
     * 当前元素
     */
    E item;
    /**
     * 当前元素的下一个元素
     */
    Node<E> next;
    Node(E x) { item = x; }
}
/** 链表队列最大容量 */
private final int capacity;
/** 当前元素数 */
private final AtomicInteger count = new AtomicInteger(0);
/** 链表头节点 */
private transient Node<E> head;
/** 链表尾节点 */
private transient Node<E> last;
/** 针对take相关的可重复入的互斥锁 */
private final ReentrantLock takeLock = new ReentrantLock();
/** take等待条件 */
private final Condition notEmpty = takeLock.newCondition();
/** 针对put, offer相关的可重复入的互斥锁  */
private final ReentrantLock putLock = new ReentrantLock();
/** put等待条件 */
private final Condition notFull = putLock.newCondition();
```

构造方法

```java
/**
 * 创建一个容量为 Integer.MAX_VALUE 的 LinkedBlockingQueue。
 */	
public LinkedBlockingQueue() {
    this(Integer.MAX_VALUE);
}
/**
 * 创建一个具有给定（固定）容量的 LinkedBlockingQueue。
 */
public LinkedBlockingQueue(int capacity) {
    if (capacity <= 0) throw new IllegalArgumentException();//判断容量值是否合法
    this.capacity = capacity;//更新容量最大值
    last = head = new Node<E>(null);设置头尾节点为空元素
}
/**
 * 创建一个容量是 Integer.MAX_VALUE 的 LinkedBlockingQueue，最初包含给定 collection 的元素，元素按该 collection 迭代器的遍历顺序添加。
 */
public LinkedBlockingQueue(Collection<? extends E> c) {
    this(Integer.MAX_VALUE);
    final ReentrantLock putLock = this.putLock;
    putLock.lock(); // 一直阻塞，直到获取锁
    try {
        int n = 0;
        for (E e : c) {//加强循环c
            if (e == null)//元素不能为null
                throw new NullPointerException();
            if (n == capacity)//队列已满
                throw new IllegalStateException("Queue full");
            enqueue(e);//将元素放入队列
            ++n;//元素数+1
        }
        count.set(n);//设置当前元素数
    } finally {
        putLock.unlock();//释放锁
    }
}
/**
 * 将元素插入到链表尾部
 */
private void enqueue(E x) {
    last = last.next = new Node<E>(x);
}    
```

常用方法

> boolean offer(E e)：将指定元素插入到此队列的尾部（如果立即可行且不会超出此队列的容量），在成功时返回 true，如果此队列已满，则返回 false。

```java
public boolean offer(E e) {
    if (e == null) throw new NullPointerException();//非空检查
    final AtomicInteger count = this.count;//获取当前元素数
    if (count.get() == capacity)//判断元素数是否已到阀值
        return false;
    int c = -1;
    final ReentrantLock putLock = this.putLock;
    putLock.lock();//获取add锁
    try {
        if (count.get() < capacity) {//判断元素数是否已到阀值
            enqueue(e);//插入元素到链表尾部
            c = count.getAndIncrement();//获取add前元素数，并且更新元素数
            if (c + 1 < capacity)//元素数没到阀值，唤醒add相关线程
                notFull.signal();
        }
    } finally {
        putLock.unlock();//释放锁
    }
    if (c == 0)//说明元素已插入，唤醒take相关线程
        signalNotEmpty();
    return c >= 0;//返回是否已插入成功
}
/**
 * 唤醒非空的线程
 */
private void signalNotEmpty() {
    final ReentrantLock takeLock = this.takeLock;
    takeLock.lock();//阻塞式获取take锁
    try {
        notEmpty.signal();//唤醒take相关线程
    } finally {
        takeLock.unlock();//释放锁
    }
}
```

> Epeek()：获取但不移除此队列的头；如果此队列为空，则返回 null。

```java
public E peek() {
    if (count.get() == 0)//判断队列中是否已无元素
        return null;
    final ReentrantLock takeLock = this.takeLock;
    takeLock.lock();//阻塞式获取take锁
    try {
        Node<E> first = head.next;//获取头节点的下一个元素
        if (first == null)//
            return null;
        else
            return first.item;//返回
    } finally {
        takeLock.unlock();
    }
}
```

> void put(E e)：将指定元素插入到此队列的尾部，如有必要，则等待空间变得可用。

```java
public void put(E e) throws InterruptedException {
    if (e == null) throw new NullPointerException();//非空判断
    int c = -1;//判断是否添加成功
    final ReentrantLock putLock = this.putLock;
    final AtomicInteger count = this.count;//获取当前元素数
    putLock.lockInterruptibly();//获取add锁，可响应线程中断
    try {
        while (count.get() == capacity) { //链表队列已满，线程等待
                notFull.await();
        }
        enqueue(e);//插入元素到链表尾部
        c = count.getAndIncrement();//获取插入前的元素数，并+1
        if (c + 1 < capacity)//插入后未超阀值，唤醒add相关线程
            notFull.signal();
    } finally {
        putLock.unlock();//释放锁
    }
    if (c == 0)
        signalNotEmpty();//说明已插入元素，唤醒take相关线程
}
```

> Epoll()：获取并移除此队列的头，如果此队列为空，则返回 null。

```java
public E poll() {
    final AtomicInteger count = this.count;
    if (count.get() == 0)//判断队列中是否还有元素
        return null;
    E x = null;
    int c = -1;
    final ReentrantLock takeLock = this.takeLock;
    takeLock.lock();//阻塞式获取take锁
    try {
        if (count.get() > 0) {
            x = dequeue();//获取并移除元素
            c = count.getAndDecrement();//更新元素数
            if (c > 1)
                notEmpty.signal();//说明队列中还有元素，唤醒take相关线程
        }
    } finally {
        takeLock.unlock();//释放锁
    }
    if (c == capacity)
        signalNotFull();//移除了一个元素，说明队列未满，唤醒add线程
    return x;//返回被移除的元素
}
 /**
 * 从队列头部移除元素(实际头部元素为：head.next)
 */
private E dequeue() {
    Node<E> h = head;//获取头节点
    //获取头节点的下一个元素(实际是头节点，因为head.item始终为null)
    Node<E> first = h.next;
    h.next = h; // help GC(此时head.next指向自身，相当于head.next元素未被引用，便于垃圾回收)
    head = first;// 将下一个元素前移
    E x = first.item;//获取实际头节点元素
    first.item = null;//头节点元素置空(即head.item=null)
    return x;//返回头节点元素
}
```

> Etake()：取并移除此队列的头部，在元素变得可用之前一直等待（如果有必要）。

```java
public E take() throws InterruptedException {
    E x;
    int c = -1;
    final AtomicInteger count = this.count;
    final ReentrantLock takeLock = this.takeLock;
    takeLock.lockInterruptibly();//阻塞式获取take锁，可响应线程中断
    try {
            while (count.get() == 0) {//队列中无元素，线程等待
                notEmpty.await();
            }
        x = dequeue();//获取并移除元素
        c = count.getAndDecrement();//更新元素数，返回移除前元素数
        if (c > 1)
            notEmpty.signal();//队列中还有元素，唤醒take相关线程
    } finally {
        takeLock.unlock();
    }
    if (c == capacity)
        signalNotFull();
    return x;
}
```

在看源码时，出现过疑惑，即head和last是怎么以链表形式连接起来的。此处要求大家需要区分基本数据类型和引用类型的区别。

具体截取的部分核心源码

```java
//内部类  元素以nodex形式在链表中
static class Node<E> {
    E item;
    Node<E> next;
    Node(E x) { item = x; }
}
//构造LinkedBlockingQueue实例时，都会执行下面这行代码
 last = head = new Node<E>(null); //ps:此时last和head的引用地址是相同的。
 //上面代码可分解非下面三行：
 Node<E> node0 = new Node<E>(null);
 head = node0;
 last = head;
 //插入类方法最终会调用下面这 代码:
 last = last.next = new Node<E>(x);
 //可拆分为下面三行：
 Node<E> node1 = new Node<E>(x);
 last.next = node1;//该行执行完毕时，last.next为node1，同时   head.next也为node1；引用地址的特性，
 last = last.next;//此时改变last引用地址，head与last引用地址不相同，且last.next为null;
  //  head=node0 但值有变化
  //  add前：head.item=null,head.next=node0;   
  //  add后：head.item=null,head.next=node1; 
  //  last= node0变为：last= node1
  //  add前：last.item=null,last.next=node0;   
  //  add后：last.item=x,last.next=null; 
 //由此每次add，通过node.next构成链表式队列。head.item始终为null
//接下来再看看出队(FIFO)，从队头开始
public E dequeue() {
    Node<E> h = head;//获取头节点
    Node<E> first = h.next;
    h.next = h; // 此时相当于h.next指向自身，帮助GC回收node0即头节点
    head = first;// 将下一个元素前移
    E x = first.item;//获取实际头节点元素
    first.item = null;//头节点元素置空(即head.item=null)
    return x;//返回头节点元素
}
```

由此看出，LinkedBlockingQueue利用两个锁ReentrantLock(takeLock、putLock)、两个Condition(notEmpty、notFull)进行读写分离，提高效率，利用Node构成链表式队列。
