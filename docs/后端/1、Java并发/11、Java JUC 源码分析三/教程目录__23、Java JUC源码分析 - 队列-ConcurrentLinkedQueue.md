# 23、Java JUC源码分析 - 队列-ConcurrentLinkedQueue
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/23.html
- 分类：Java并发
- 分组：教程目录
之前看的队列大都是基于锁来实现阻塞，ConcurrentLinkedQueue采用wait-free算法来实现'无锁'的并发队列。wait-free算法之前没听说过，只听过lock-free，大牛解析说2中不同，具体看参考，有空后面翻译下。

ConcurrentLinkedQueue基于单向链表实现线程安全的无界队列。队列元素遵循FIFO。

看下队列内部结构：

```java
/**
* Node节点，一个item一个next
*/
private static class Node<E> {
    volatile E item;
    volatile Node<E> next;
    /**
     * Constructs a new node.  Uses relaxed write because item can
     * only be seen after publication via casNext.
     */
    Node(E item) {
        UNSAFE.putObject(this, itemOffset, item);
    }
    boolean casItem(E cmp, E val) {
        return UNSAFE.compareAndSwapObject(this, itemOffset, cmp, val);
    }
    void lazySetNext(Node<E> val) {
        UNSAFE.putOrderedObject(this, nextOffset, val);
    }
    boolean casNext(Node<E> cmp, Node<E> val) {
        return UNSAFE.compareAndSwapObject(this, nextOffset, cmp, val);
    }
    // Unsafe mechanics
    private static final sun.misc.Unsafe UNSAFE;
    private static final long itemOffset;
    private static final long nextOffset;
    static {
        try {
            UNSAFE = sun.misc.Unsafe.getUnsafe();
            Class k = Node.class;
            itemOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("item"));
            nextOffset = UNSAFE.objectFieldOffset
                (k.getDeclaredField("next"));
        } catch (Exception e) {
            throw new Error(e);
        }
    }
}
/**
 * A node from which the first live (non-deleted) node (if any)
 * can be reached in O(1) time.
 * Invariants:
 * - all live nodes are reachable from head via succ()
 * - head != null
 * - (tmp = head).next != tmp || tmp != head
 * Non-invariants:
 * - head.item may or may not be null.
 * - it is permitted for tail to lag behind head, that is, for tail
 *   to not be reachable from head!
 */
private transient volatile Node<E> head;
/**
 * A node from which the last node on list (that is, the unique
 * node with node.next == null) can be reached in O(1) time.
 * Invariants:
 * - the last node is always reachable from tail via succ()
 * - tail != null
 * Non-invariants:
 * - tail.item may or may not be null.
 * - it is permitted for tail to lag behind head, that is, for tail
 *   to not be reachable from head!
 * - tail.next may or may not be self-pointing to tail.
 */
private transient volatile Node<E> tail;
/**
 * Creates a {@code ConcurrentLinkedQueue} that is initially empty.
 */
public ConcurrentLinkedQueue() {
    head = tail = new Node<E>(null);
}
```

内部结构比较简单，一个head一个tail，构造函数初始化时指向一个null型Node节点，Node节点只有item和next

看下add和offer方法：

```java
public boolean add(E e) {
    return offer(e);
}
/** 无界队列，返回true */
public boolean offer(E e) {
    checkNotNull(e); //非空校验
    final Node<E> newNode = new Node<E>(e); //构造Node节点
    for (Node<E> t = tail, p = t;;) { //for循环，p、t初始都指向tail节点
        Node<E> q = p.next; //p节点的next
        if (q == null) { //因为p节点指向tail，所以p的next为null表示q为最后一个节点
            // p is last node
            if (p.casNext(null, newNode)) { //将新的节点加入队列，如果不成功，说明有race，那就循环
                // Successful CAS is the linearization point
                // for e to become an element of this queue,
                // and for newNode to become "live".
                if (p != t) // hop two nodes at a time 这里应该是新加入节点经过不止一次循环才成功，导致原本p\t指向tail现在p\t不一致
                    casTail(t, newNode);  // Failure is OK.不成功也无所谓，总会有其他成功的
                return true; //最后都返回true
            }
            // Lost CAS race to another thread; re-read next
        }
        else if (p == q) //p的next指向自己，说明p节点被删除
            // We have fallen off list.  If tail is unchanged, it
            // will also be off-list, in which case we need to
            // jump to head, from which all live nodes are always
            // reachable.  Else the new tail is a better bet.
            p = (t != (t = tail)) ? t : head; //看尾节点是否有变化，有变化就赋值p，重新循环，否则指向head
        else
            // Check for tail updates after two hops. 
			//这里就是q不为null，说明有节点加入了，如果tail没变化，那就向后推进，如果tail变了，那就指向tail重新循环
            p = (p != t && t != (t = tail)) ? t : q;
    }
}
```

offer方法大概这2步：1.找到待插入位置，2.casTail更新尾节点。因为使用的无锁，所以找到待插入位置的代码理解就比较困难，妈的，烦死。可以写demo，模拟多个线程插入race，断点打在for循环第一句，然后模拟不同race情况的代码走向。另外需要注意的是，更新尾节点，不是插入一个节点就更新一次。

poll方法：

```java
public E poll() {
    restartFromHead:
    for (;;) {
        for (Node<E> h = head, p = h, q;;) {
            E item = p.item;
            if (item != null && p.casItem(item, null)) { //先将item置null
                // Successful CAS is the linearization point
                // for item to be removed from this queue.
                if (p != h) // hop two nodes at a time 上面cas成功，更新head
                    updateHead(h, ((q = p.next) != null) ? q : p);
                return item;
            }
            else if ((q = p.next) == null) { //有race情况下存在next被删除的情况,更新head，返回null
                updateHead(h, p);
                return null;
            }
            else if (p == q) //这里就是指向自己了，节点被删除，一旦next指向自己，那肯定head是变了，需要重新for循环初始化
                continue restartFromHead;
            else
                p = q;
        }
    }
}
/** 流程大致相同，不会设置item为null */
public E peek() {
    restartFromHead:
    for (;;) {
        for (Node<E> h = head, p = h, q;;) {
            E item = p.item;
            if (item != null || (q = p.next) == null) {
                updateHead(h, p);
                return item;
            }
            else if (p == q)
                continue restartFromHead;
            else
                p = q;
        }
    }
}
/** 获取第一个item不为null */
Node<E> first() {
    restartFromHead:
    for (;;) {
        for (Node<E> h = head, p = h, q;;) {
            boolean hasItem = (p.item != null);
            if (hasItem || (q = p.next) == null) {
                updateHead(h, p);
                return hasItem ? p : null;
            }
            else if (p == q)
                continue restartFromHead;
            else
                p = q;
        }
    }
}
public boolean isEmpty() {
    return first() == null;
}
public int size() {
    int count = 0;
    for (Node<E> p = first(); p != null; p = succ(p))
        if (p.item != null)
            // Collection.size() spec says to max out
            if (++count == Integer.MAX_VALUE)
                break;
    return count;
}
final void updateHead(Node<E> h, Node<E> p) {
    if (h != p && casHead(h, p))
        h.lazySetNext(h); //断开节点
}
```

poll方法updateHead,同casTail一样也不会立即更新。

其他的没有什么了。ConcurrentLinkedQueue需要注意的是peer和poll操作不会立即更新head\tail节点，而且更新cas也不会判断是否成功，即使失败了，也会有其他线程保证成功。

这个类当时看的时候，有点烦躁，因为是无锁的，所以考虑的场景就比较多，而且他的head\tail节点也立即更新，所以分析的时候，很容易，后来就看代码写demo分析代码走向才好点。还是需要多锻炼！
