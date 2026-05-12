# 21、Java JUC源码分析 - 队列-LinkedBlockingDeque
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/21.html
- 分类：Java并发
- 分组：教程目录
LinkedBlockingDeque基于双向链表实现的阻塞队列，根据构造传入的容量大小决定有界还是无界，默认不传的话，大小Integer.Max。

实现BlockingDequeue接口，这个接口继承BlockingQueue和Dequeue，看下接口方法：

```java
public interface BlockingDeque<E> extends BlockingQueue<E>, Deque<E> {
	/** Deque 方法 */
    /**
     * 插入元素到队列头，队列满就IllegalStateException异常
     */
    void addFirst(E e);
    /**
     * 插入元素到队列尾，队列满就IllegalStateException异常
     */
    void addLast(E e);
    /**
     * 插入元素到队列头，队列满就false
     */
    boolean offerFirst(E e);
    /**
     * 插入元素到队列尾，队列满就false
     */
    boolean offerLast(E e);
    /**
     * 上面的几个插入方法，如果插入时队列满就返回异常或false，这里put操作加入条件队列wait
     */
    void putFirst(E e) throws InterruptedException;
    /**
     * 插入元素到队列尾，队列满就加入条件队列wait
     */
    void putLast(E e) throws InterruptedException;
    /**
     * 响应超时的offer插入队列头
     */
    boolean offerFirst(E e, long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 响应超时的offer插入队列尾
     */
    boolean offerLast(E e, long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 获取队列头，队列不可用就wait
     */
    E takeFirst() throws InterruptedException;
    /**
     * 获取队列尾，队列不可用就wait
     */
    E takeLast() throws InterruptedException;
    /**
     * 响应超时的获取队列头
     */
    E pollFirst(long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 响应超时的获取队列尾
     */
    E pollLast(long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 删除第一个匹配的指定元素
     */
    boolean removeFirstOccurrence(Object o);
    /**
     * 删除最后一个匹配的指定元素
     */
    boolean removeLastOccurrence(Object o);
    // *** BlockingQueue methods 之前看过***
    boolean add(E e);
    boolean offer(E e);
    void put(E e) throws InterruptedException;
    boolean offer(E e, long timeout, TimeUnit unit)
        throws InterruptedException;
    E remove();
    E poll();
    E take() throws InterruptedException;
    E poll(long timeout, TimeUnit unit)
        throws InterruptedException;
    /**
     * 获取队列头，跟peek不同的是，队列空，抛异常
     */
    E element();
    E peek();
    boolean remove(Object o);
    public boolean contains(Object o);
    public int size();
    Iterator<E> iterator();
    // *** Stack methods ***
    /**
     * addFirst
     */
    void push(E e);
}
```

因为是双向结构，所以基本的操作成对的XXXFirst，XXXLast。

```java
/** 双向链表节点 */
static final class Node<E> {
    /**
     * 元素值
     */
    E item;
    /**
     * 节点前驱
	 * 1.指向前驱；2.指向this，说明前驱是尾节点，看unlinklast；3.指向null说明没有前驱
     */
    Node<E> prev;
    /**
     * 节点后继
	 * 1.指向后继；2.指向this,说明后继是头结点，看unlinkfirst；3.指向null说明没有后继
     */
    Node<E> next;
    Node(E x) {
        item = x;
    }
}
/**
 * 首节点
 */
transient Node<E> first;
/**
 * 尾节点
 */
transient Node<E> last;
/** 队列元素个数 */
private transient int count;
/** 队列容量 */
private final int capacity;
/** Main lock guarding all access */
final ReentrantLock lock = new ReentrantLock();
/** 获取的条件等待：非空条件 */
private final Condition notEmpty = lock.newCondition();
/** 插入元素的条件等待：非满条件 */
private final Condition notFull = lock.newCondition();
/**
 * 空构造，默认容量最大
 */
public LinkedBlockingDeque() {
    this(Integer.MAX_VALUE);
}
/**
 * 指定容量
 */
public LinkedBlockingDeque(int capacity) {
    if (capacity <= 0) throw new IllegalArgumentException();
    this.capacity = capacity;
}
```

构造的时候可以传入链表容量大小，没传入就Integer.MAX。

看下最基础的几个方法：

```java
// 4个基础方法，Dequeue的操作基本都是调用这些
/**
 * 设置node为链表头节点，链表满时为false
 */
private boolean linkFirst(Node<E> node) {
    // assert lock.isHeldByCurrentThread();
    if (count >= capacity) //超过容量false
        return false;
    Node<E> f = first;
    node.next = f; //新节点的next指向原first
    first = node; //设置node为新的first
    if (last == null) //没有尾节点，就将node设置成尾节点
        last = node;
    else
        f.prev = node; //有尾节点，那就将之前first的pre指向新增node
    ++count; //累加节点数量
    notEmpty.signal(); //有新节点入队，通知非空条件队列
    return true;
}
/**
 * 设置node为链表尾节点，链表满时为false
 */
private boolean linkLast(Node<E> node) {
    // assert lock.isHeldByCurrentThread();
    if (count >= capacity)
        return false;
    Node<E> l = last;
    node.prev = l;
    last = node;
    if (first == null) //为null，说明之前队列空吧，那就first也指向node
        first = node;
    else
        l.next = node; //非null，说明之前的last有值，就将之前的last的next指向node
    ++count;
    notEmpty.signal();
    return true;
}
/**
 * 移除头结点，链表空返回null
 */
private E unlinkFirst() {
    // assert lock.isHeldByCurrentThread();
    Node<E> f = first;
    if (f == null)
        return null; //空返回null
    Node<E> n = f.next;
    E item = f.item;
    f.item = null;
    f.next = f; // help GC
    first = n;
    if (n == null) //说明之前应该只有一个节点，移除头结点后，链表空，现在first和last都指向null了
        last = null;
    else
        n.prev = null; //否则的话，n的pre原来指向之前的first，现在n变为first了，pre指向null
    --count;
    notFull.signal(); //通知非满条件队列
    return item;
}
/**
 * 移除尾结点，链表空返回null
 */
private E unlinkLast() {
    // assert lock.isHeldByCurrentThread();
    Node<E> l = last;
    if (l == null)
        return null;
    Node<E> p = l.prev;
    E item = l.item;
    l.item = null;
    l.prev = l; // help GC
    last = p;
    if (p == null)
        first = null;
    else
        p.next = null;
    --count;
    notFull.signal();
    return item;
}
/**
 * 移除指定节点：p--》x--》n
 */
void unlink(Node<E> x) {
    // assert lock.isHeldByCurrentThread();
    Node<E> p = x.prev;
    Node<E> n = x.next; 
    if (p == null) { //prev为null说明x节点为头结点
        unlinkFirst();
    } else if (n == null) {
        unlinkLast(); //nex为null说明待清除节点为尾节点
    } else { //否则的话节点处于链表中间
        p.next = n; //将p和n互链
        n.prev = p;
        x.item = null;
        // 没有断开x节点链接，可能有其他线程在迭代链表
        --count;
        notFull.signal();
    }
}
```

大部分的Deque的实现都是调用这几个方法。因为是双端队列，所以link\unlink都有针对first和last的操作。看明白这几个方法，其他方法应该都没问题了。
