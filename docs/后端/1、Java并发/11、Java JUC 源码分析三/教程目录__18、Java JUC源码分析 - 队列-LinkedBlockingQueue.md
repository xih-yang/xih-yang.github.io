# 18、Java JUC源码分析 - 队列-LinkedBlockingQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/18.html
- 分类：Java并发
- 分组：教程目录
LinkedBlockingQueue是基于单向链表实现的有界阻塞队列，队列元素遵循FIFO，LinkedBlockingQueue比基于数组的阻塞队列拥有更好的吞吐量，但是在大部分并发应用中，性能不如基于数组的队列。

和ArrayBlocingQueue一样继承AbstractQueue，实现BlockingQueue接口，不再看BlockingQueue接口代码，直接看LinkedBlockingQueue的结构吧。

```java
//单向链表的节点
static class Node<E> {
    E item;
    /**
     * One of:
     * - the real successor Node
     * - this Node, meaning the successor is head.next
     * - null, meaning there is no successor (this is the last node)
     */
    Node<E> next;
    Node(E x) { item = x; }
}
/** The capacity bound, or Integer.MAX_VALUE if none */
private final int capacity; //链表的容量，如果构造不传入，那就最大
/** Current number of elements */
private final AtomicInteger count = new AtomicInteger(0); //元素的个数
private transient Node<E> head;
private transient Node<E> last;
//因为阻塞队列，从head取元素，从tail存元素，链表采用2个lock分别对应存取
//2个对应的条件队列对应非空和非满
/** Lock held by take, poll, etc */
private final ReentrantLock takeLock = new ReentrantLock();
/** Wait queue for waiting takes */
private final Condition notEmpty = takeLock.newCondition();
/** Lock held by put, offer, etc */
private final ReentrantLock putLock = new ReentrantLock();
/** Wait queue for waiting puts */
private final Condition notFull = putLock.newCondition();
//构造，如果不传入容量大小，默认最大，还是传入的好
public LinkedBlockingQueue() {
    this(Integer.MAX_VALUE);
}
public LinkedBlockingQueue(int capacity) {
    if (capacity <= 0) throw new IllegalArgumentException();
    this.capacity = capacity;
    last = head = new Node<E>(null);  //初始head和last指向一个元素为null的Node
}
```

看下put():

```java
public void put(E e) throws InterruptedException {
    if (e == null) throw new NullPointerException(); 
    // Note: convention in all put/take/etc is to preset local var
    // holding count negative to indicate failure unless set.
    int c = -1;
    Node<E> node = new Node(e); //新建一个node
    final ReentrantLock putLock = this.putLock;
    final AtomicInteger count = this.count;
    putLock.lockInterruptibly(); //响应中断的lock
    try {
        /*
         * Note that count is used in wait guard even though it is
         * not protected by lock. This works because count can
         * only decrease at this point (all other puts are shut
         * out by lock), and we (or some other waiting put) are
         * signalled if it ever changes from capacity. Similarly
         * for all other uses of count in other wait guards.
         */
        while (count.get() == capacity) { //put时，元素数量等于容量大小，那就条件队列等待
            notFull.await();
        }
        enqueue(node); //将node加入链表
        c = count.getAndIncrement();
        if (c + 1 < capacity) //容量未到达限制，可以继续加入，通知notfull条件队列
            notFull.signal();
    } finally {
        putLock.unlock(); //释放锁
    }
	//这里c默认是-1，经过enqueue入队，c=count.getAndIncrement(),如果变成0，说明链表队列原来是空的，现在有元素了
	//所以这里可以唤醒一个notEmpty条件队列种线程，take元素
    if (c == 0) 
        signalNotEmpty();
}    
//将元素加入链表
private void enqueue(Node<E> node) {
    // assert putLock.isHeldByCurrentThread();
    // assert last.next == null;
    last = last.next = node; //只需要修改last的next，然后将last指向新加入的node
}
```

看下take():

```java
public E take() throws InterruptedException {
    E x;
    int c = -1;
    final AtomicInteger count = this.count;
    final ReentrantLock takeLock = this.takeLock;
    takeLock.lockInterruptibly();
    try {
        while (count.get() == 0) { //这里判断元素个数
            notEmpty.await(); //为0，队列空，那就加入notEmpyt条件队列
        }
        x = dequeue(); 
        c = count.getAndDecrement();
        if (c > 1) //c大于1说明还有元素，那就可以继续take，所以可以唤醒
            notEmpty.signal();
    } finally {
        takeLock.unlock();
    }
	//默认c为-1，经过take后c=count.getAndDecrement();说明原来队列是满的，take后不满，就可以唤醒notFull条件队列
    if (c == capacity) 
        signalNotFull();
    return x;
}
//返回的是head指向的next的元素，并且断开与原head的链接，head指向原head的next
private E dequeue() {
    // assert takeLock.isHeldByCurrentThread();
    // assert head.item == null;
    Node<E> h = head; //初始化的时候head的item为null
    Node<E> first = h.next; //第一个真正有值的元素
    h.next = h; // help GC ，head的next指向自己
    head = first; 
    E x = first.item;
    first.item = null;
    return x;
}
/**
 * Signals a waiting take. Called only from put/offer (which do not
 * otherwise ordinarily lock takeLock.)
 */
private void signalNotEmpty() {
    final ReentrantLock takeLock = this.takeLock;
    takeLock.lock();
    try {
        notEmpty.signal();
    } finally {
        takeLock.unlock();
    }
}
/**
 * Signals a waiting put. Called only from take/poll.
 */
private void signalNotFull() {
    final ReentrantLock putLock = this.putLock;
    putLock.lock();
    try {
        notFull.signal();
    } finally {
        putLock.unlock();
    }
}
```

其他的offer，poll都比较简单，大都能看懂。不过这些获取存储都是使用单个的锁，LinkedBlockingQueue里面有个remove操作使用的是2把锁：

```java
public boolean remove(Object o) {
    if (o == null) return false;
    fullyLock();
    try {
        for (Node<E> trail = head, p = trail.next;
             p != null;
             trail = p, p = p.next) {
            if (o.equals(p.item)) {
                unlink(p, trail);
                return true;
            }
        }
        return false;
    } finally {
        fullyUnlock();
    }
}
void fullyLock() {
    putLock.lock();
    takeLock.lock();
}
/**
 * Unlock to allow both puts and takes.
 */
void fullyUnlock() {
    takeLock.unlock();
    putLock.unlock();
}
void unlink(Node<E> p, Node<E> trail) {
    // assert isFullyLocked();
    // p.next is not changed, to allow iterators that are
    // traversing p to maintain their weak-consistency guarantee.
    p.item = null;
    trail.next = p.next;
    if (last == p)
        last = trail;
    if (count.getAndDecrement() == capacity)
        notFull.signal();
}
```

因为remove操作需要遍历整个链表，所以加2把锁遍历。
