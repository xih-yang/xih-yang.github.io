# 18、Java集合：Deque之Deque、BlockingDeque、LinkedBlockingDeque、ArrayDeque
- 来源：https://ddkk.com/zhuanlan/java/concurrency/3/18.html
- 分类：Java并发
- 分组：教程目录
## Deque

> public interface Deque extends Queue

**1、** 一个线性collection，支持在两端插入和移除元素；

**2、** 既支持有容量限制的双端队列，也支持没有固定大小限制的双端队列；

**3、** 每种方法都存在两种形式：一种形式在操作失败时抛出异常，另一种形式返回一个特殊值（null或false，具体取决于操作）插入操作的后一种形式是专为使用有容量限制的Deque实现设计的；在大多数实现中，插入操作不能失败；

**4、** 与List接口不同，此接口不支持通过索引访问元素；

**5、** 建议别插入null元素，因为各种方法会将null用作特殊的返回值来指示双端队列为空；

下表总结了上述 12 种方法：

此接口扩展了 Queue 接口。在将双端队列用作队列时，将得到 FIFO（先进先出）行为。将元素添加到双端队列的末尾，从双端队列的开头移除元素。从 Queue 接口继承的方法完全等效于 Deque 方法，如下表所示：

双端队列也可用作 LIFO（后进先出）堆栈。应优先使用此接口而不是遗留 Stack 类。在将双端队列用作堆栈时，元素被推入双端队列的开头并从双端队列开头弹出。堆栈方法完全等效于 Deque 方法，如下表所示：

接口方法太多，大家可查阅api，不作过多阐述。

## BlockingDeque

**1、** 支持两个附加操作的Queue，这两个操作是：获取元素时等待双端队列变为非空；存储元素时等待双端队列中的空间变得可用；

**2、** BlockingDeque是线程安全的，但不允许null元素，并且可能有（也可能没有）容量限制；

**3、** BlockingDeque实现可以直接用作FIFOBlockingQueue；

BlockingDeque 方法有四种形式：

继承自BlockingQueue 接口的方法精确地等效于下表中描述的 BlockingDeque 方法：

接口方法也太多，大家可查阅api，不作过多阐述。

待续更新

## LinkedBlockingDeque

> public class LinkedBlockingDeque extends AbstractQueue implements BlockingDeque, java.io.Serializable

**1、** 一个基于已链接节点的、任选范围的阻塞双端队列；

**2、** 可选的容量范围构造方法参数是一种防止过度膨胀的方式如果未指定容量，那么容量将等于Integer.MAX_VALUE；

**3、** 不允许使用NULL元素；

成员变量

```java
/** 双端队列内部节点类 */
static final class Node<E> {
   /**
    * 当前元素，若被移除则为null
    */
    E item;
    /**
     * 当前节点的上一个节点
     */
    Node<E> prev;
    /**
     * 当前节点的下一个节点
     */
    Node<E> next;
    Node(E x, Node<E> p, Node<E> n) {
        item = x;//当前元素
        prev = p;//上一个节点
        next = n;//下一个节点
    }
}
/** 头节点 */
transient Node<E> first;
/** 尾节点 */
transient Node<E> last;
/** 双端队列元素数 */
private transient int count;
/** 双端队列最大容量 */
private final int capacity;
/**  可重复的互斥锁 */
final ReentrantLock lock = new ReentrantLock();
/** takes 条件 */
private final Condition notEmpty = lock.newCondition();
/** puts 条件 */
private final Condition notFull = lock.newCondition();
```

构造方法

```java
/**
 * 创建一个容量为 Integer.MAX_VALUE 的 LinkedBlockingDeque。
 */
public LinkedBlockingDeque() {
    this(Integer.MAX_VALUE);
}
/**
 * 创建一个具有给定（固定）容量的 LinkedBlockingDeque。
 */
public LinkedBlockingDeque(int capacity) {
    if (capacity <= 0) throw new IllegalArgumentException();
    this.capacity = capacity;
}
/**
 * 创建一个容量为 Integer.MAX_VALUE 的 LinkedBlockingDeque，最初包含给定 collection 的元素，以该 collection 迭代器的遍历顺序添加。
 */
public LinkedBlockingDeque(Collection<? extends E> c) {
    this(Integer.MAX_VALUE);
    final ReentrantLock lock = this.lock;
    lock.lock(); // Never contended, but necessary for visibility
    try {
        for (E e : c) {//遍历插入到队尾
            if (e == null)
                throw new NullPointerException();
            if (!linkLast(e))//插入到队尾
                throw new IllegalStateException("Deque full");
        }
    } finally {
        lock.unlock();//释放锁
    }
}
```

常用方法

> void put(E e)：将指定的元素插入此双端队列表示的队列中（即此双端队列的尾部），必要时将一直等待可用空间。

```java
public void put(E e) throws InterruptedException {
    putLast(e);
}
public void putLast(E e) throws InterruptedException {
    if (e == null) throw new NullPointerException();//元素非空校验
    final ReentrantLock lock = this.lock;
    lock.lock();//阻塞式获取锁
    try {
        while (!linkLast(e))//插入元素到队尾
            notFull.await();//队列已满，进行等待，释放锁
    } finally {
        lock.unlock();//释放锁
    }
}
```

> private boolean linkLast(E e)：插入元素到队尾，队列已满返回false，否则返回true。(offer、offerLast、add、addLast、put、putLast)底层均由该方法实现。

```java
/**
 * Links e as last element, or returns false if full.
 */
private boolean linkLast(E e) {
    // assert lock.isHeldByCurrentThread();
    if (count >= capacity)//判断队列是否已满
        return false;
    Node<E> l = last;//获取尾节点
    Node<E> x = new Node<E>(e, l, null);//实例化新节点，上一节点指向当前尾节点，下一节点为null
    last = x;
    if (first == null)//头节点为空，首次插入
        first = x;
    else
        l.next = x;//否则插入到当前尾节点后面
    ++count;//元素数+1
    notEmpty.signal();//唤醒takes线程
    return true;
}
```

> private boolean linkFirst(E e)：插入元素到队首，队列已满返回false，否则返回true。(offerFirst、addFirst、putFirst)底层均由该方法实现。

```java
/**
 * Links e as first element, or returns false if full.
 */
private boolean linkFirst(E e) {
    // assert lock.isHeldByCurrentThread();
    if (count >= capacity)//判断队列是否已满
        return false;
    Node<E> f = first;//获取头节点
    Node<E> x = new Node<E>(e, null, f);//实例化新节点，下一节点指向当前头节点，下一个节点为null
    first = x;
    if (last == null)//队列为空,首次插入
        last = x;
    else
        f.prev = x;//队列不为空，当前头节点上一个节点指向新插入的节点
    ++count;//更新元素数
    notEmpty.signal();//唤醒takes线程
    return true;
}
```

> Etake()：获取并移除此双端队列表示的队列的头部（即此双端队列的第一个元素），必要时将一直等待可用元素。

```java
public E take() throws InterruptedException {
    return takeFirst();
}
public E takeFirst() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lock();//阻塞式获取锁
    try {
        E x;
        while ( (x = unlinkFirst()) == null)//获取并移除头节点
            notEmpty.await();//队列为空，等待，释放锁
        return x;
    } finally {
        lock.unlock();//释放锁
    }
}
```

> private E unlinkFirst()：获取并移除队首，队列为空时，返回null。
>
> (tale、takeFirst、poll、pollFirst、remove、removeFirst)底层均由该方法实现。

```java
/**
 * Removes and returns first element, or null if empty.
 */
private E unlinkFirst() {
    // assert lock.isHeldByCurrentThread();
    Node<E> f = first;
    if (f == null)//队列为空，直接返回null
        return null;
    Node<E> n = f.next;//获取第二个节点
    E item = f.item;//获取第一个元素
    f.item = null;
    f.next = f; // 移除了头节点，自身指向自身，help GC
    first = n;//第二个节点前移到头节点
    if (n == null)//队列中只有一个元素，移除后队列为空，last也需要置null
        last = null;
    else
        n.prev = null;//移除后，队列中还有元素，头结点的上一个节点更新
    --count;//元素数-1
    notFull.signal();//唤醒puts线程
    return item;//返回被移除的元素
}
```

> private E unlinkLast() ：获取并移除队尾，队列为空时，返回null。
>
> （pollLast、takeLast、removeLast）底层均由该方法实现。

```java
/**
 * Removes and returns last element, or null if empty.
 */
private E unlinkLast() {
    // assert lock.isHeldByCurrentThread();
    Node<E> l = last;
    if (l == null)//队列为空，返回null
        return null;
    Node<E> p = l.prev;//获取倒数第二个元素的节点
    E item = l.item;//获取队尾元素
    l.item = null;
    l.prev = l; // 队尾元素置空，并指向自身，help GC
    last = p;//最后一个元素更新指向原先倒数第二个节点
    if (p == null)//队列只有一个元素，first也要置null
        first = null;
    else
        p.next = null;//新尾节点下一个元素置空
    --count;//元素数-1
    notFull.signal();//唤醒puts线程
    return item;//返回被移除的元素
}
```

由源码看出，LinkedBlockingDeque是一个基于已链接节点的、有界的阻塞双端队列。利用ReentrantLock保证线程安全即同步，利用Condition保证put及take方法阻塞。

对于插入类队头或队尾元素的方法、移除类队头或队尾元素的方法，都分别封装到各自对应的一个底层方法，体系java封装特性，且便于对Condition的管理。

## ArrayDeque

> public class ArrayDeque extends AbstractCollection implements Deque, Cloneable, Serializable

**1、** Deque接口的大小可变数组的实现，默认初始容量16；

**2、** 禁止null元素；

**3、** 不是线程安全的，fail-fast；

**4、** 此类很可能在用作堆栈时快于Stack，在用作队列时快于LinkedList；

成员变量

```java
/**
 * 元素以数组结构形式存储
 */
private transient E[] elements;
/**
 * 头元素索引
 */
private transient int head;
/**
 * 下一个待插入的元素索引
 */
private transient int tail;
/**
 * 最小初始容量
 */
private static final int MIN_INITIAL_CAPACITY = 8;
```

构造方法

```java
/**
 * 构造一个初始容量能够容纳 16 个元素的空数组双端队列。
 */
public ArrayDeque() {
    elements = (E[]) new Object[16];
}
/**
 * 构造一个包含指定 collection 的元素的双端队列，这些元素按 collection 的迭代器返回的顺序排列。
 */
public ArrayDeque(int numElements) {
    allocateElements(numElements);
}
/**
 * 构造一个初始容量能够容纳指定数量的元素的空数组双端队列。
 */
public ArrayDeque(Collection<? extends E> c) {
    allocateElements(c.size());
    addAll(c);
}
```

常用方法

> void addLast(E e)：将指定元素插入此双端队列的末尾。
>
> （add、offer、offerLast）底层均由此方法实现。

```java
public void addLast(E e) {
    if (e == null)//非空校验
        throw new NullPointerException();
    elements[tail] = e;//元素放入队尾
    if ( (tail = (tail + 1) & (elements.length - 1)) == head)
        doubleCapacity();//队列已满 进行双倍扩容
}
/**
 * 进行双倍扩容
 */
private void doubleCapacity() {
    assert head == tail;
    int p = head;
    int n = elements.length;
    int r = n - p; // number of elements to the right of p
    int newCapacity = n << 1;//p元素右边元素数*2
    if (newCapacity < 0)
        throw new IllegalStateException("Sorry, deque too big");
    Object[] a = new Object[newCapacity];//实例化新的数组
    System.arraycopy(elements, p, a, 0, r);//元素复制
    System.arraycopy(elements, 0, a, r, p);
    elements = (E[])a;//数组替换
    head = 0;//更新头元素索引
    tail = n;//更新尾元素索引
}
public boolean add(E e) {
    addLast(e);
    return true;
}
public boolean offer(E e) {
    return offerLast(e);
}
public boolean offerLast(E e) {
    addLast(e);
    return true;
}
```

> EpollFirst()：获取并移除此双端队列的第一个元素；如果此双端队列为空，则返回 null。
>
> （poll、remove、removeFirst、pop）底层均由该方法实现。

```java
public E pollFirst() {
    int h = head;
    E result = elements[h]; // 获取头元素
    if (result == null)
        return null;//队列为空，返回null
    elements[h] = null;     // 移除尾元素
    head = (h + 1) & (elements.length - 1);//重新计算头结点index
    return result;
}
public E remove() {
    return removeFirst();
}
public E removeFirst() {
    E x = pollFirst();
    if (x == null)
        throw new NoSuchElementException();
    return x;
}
public E poll() {
    return pollFirst();
}
```

> Epeek()：获取，但不移除此双端队列所表示的队列的头；如果此双端队列为空，则返回 null。

```java
public E peek() {
    return peekFirst();
}
public E peekFirst() {
    return elements[head]; // elements[head] is null if deque empty
}
```

> void push(E e)：将元素推入此双端队列所表示的堆栈。

```java
public void push(E e) {
    addFirst(e);
}
public void addFirst(E e) {
    if (e == null)
        throw new NullPointerException();
    elements[head = (head - 1) & (elements.length - 1)] = e;//放入头部
    if (head == tail)//头尾index一样，进行双倍扩容
        doubleCapacity();
}
```

由源码看出，ArrayDeque是非线程安全的，以数组结构形式操作元素，可作堆栈或队列使用。
