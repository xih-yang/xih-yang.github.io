# 14、Java并发编程 - JUC阻塞队列（LinkedBlockingQueue、LinkedBlockingDeque）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/14.html
- 分类：Java并发
- 分组：教程目录
## 一、LinkedBlockingQueue

## 1.1 API介绍

链式阻塞队列分单向（LinkedBlockingQueue）、双向（LinkedBlockingDeque）

链表里面元素的存储是离散的，分散在内存区不同地方，不需要连续的存储区间

FIFO：first in first out

LinkedBlockingQueue是一个基于单向链表的、范围任意的（其实是有界的）、FIFO 阻塞队列。`访问与移除操作是在队头进行，添加操作是在队尾进行，并分别使用不同的锁进行保护，只有在可能涉及多个节点的操作才同时对两个锁进行加锁。`

队列是否为空、是否已满仍然是通过元素数量的计数器（count）进行判断的，由于可以同时在队头、队尾并发地进行访问、添加操作，所以这个计数器必须是线程安全的，这里使用了一个原子类 `AtomicInteger` ，这就决定了它的容量范围是： `1 – Integer.MAX_VALUE`。

由于同时使用了两把锁，在需要同时使用两把锁时，加锁顺序与释放顺序是非常重要的：必须以固定的顺序进行加锁，再以与加锁顺序的相反的顺序释放锁。

头结点和尾结点一开始总是指向一个哨兵的结点，它不持有实际数据，当队列中有数据时，头结点仍然指向这个哨兵，尾结点指向有效数据的最后一个结点。这样做的好处在于，与计数器 count 结合后，对队头、队尾的访问可以独立进行，而不需要判断头结点与尾结点的关系。

> 链表在插入和删除时，为了使得操作不用区分是在头部还是中间进行，一般会在头部插入一个 dummy node（哨兵节点），使得在链表任意位置做插入、删除时，能保证有一个前继节点，这样写插入、删除代码就不用写出 if (前继存在) 和 if (!前继存在) 两套代码了。所以 dummy node 并不是用于存放数据，它内部的内容就显得无关紧要了，不过实际实现中，通常会将它的内容赋一个非法值，所以你看到这里 head = new Node(null) 会存储为 null。

## 1.2 源码简析

### 重要成员属性

```java
public class LinkedBlockingQueue<E> extends AbstractQueue<E> implements BlockingQueue<E>, java.io.Serializable {
	...
	//队列的容量
    /** The capacity bound, or Integer.MAX_VALUE if none */
    private final int capacity;
	//当前队列元素个数
    /** Current number of elements */
    private final AtomicInteger count = new AtomicInteger();
    //头结点
    /**
     * Head of linked list.
     * Invariant: head.item == null
     */
    transient Node<E> head;
	//尾节点
    /**
     * Tail of linked list.
     * Invariant: last.next == null
     */
    private transient Node<E> last;
    /** Lock held by take, poll, etc */
    private final ReentrantLock takeLock = new ReentrantLock();
    /** Wait queue for waiting takes */
    private final Condition notEmpty = takeLock.newCondition();
    /** Lock held by put, offer, etc */
    private final ReentrantLock putLock = new ReentrantLock();
    /** Wait queue for waiting puts */
    private final Condition notFull = putLock.newCondition();
    ...
}
```

### 入队操作

```java
//入队
/**
 * Inserts the specified element at the tail of this queue, waiting if
 * necessary for space to become available.
 *
 * @throws InterruptedException {@inheritDoc}
 * @throws NullPointerException {@inheritDoc}
 */
public void put(E e) throws InterruptedException {
    if (e == null) throw new NullPointerException();
    // Note: convention in all put/take/etc is to preset local var
    // holding count negative to indicate failure unless set.
    int c = -1;
    Node<E> node = new Node<E>(e);
    final ReentrantLock putLock = this.putLock;//获取入队的锁
    final AtomicInteger count = this.count;//获取当前队列元素个数
    putLock.lockInterruptibly();//一直尝试获取锁直到当前线程被中断
    try {
        /*
         * Note that count is used in wait guard even though it is
         * not protected by lock. This works because count can
         * only decrease at this point (all other puts are shut
         * out by lock), and we (or some other waiting put) are
         * signalled if it ever changes from capacity. Similarly
         * for all other uses of count in other wait guards.
         */
        while (count.get() == capacity) {
     //判断队列容量是否满了
            notFull.await();//满了先阻塞等待
        }
        enqueue(node);//入队
        c = count.getAndIncrement();//这一步再次get，有可能已经出队了一些元素
        if (c + 1 < capacity)//所以这里再次判断如果容量够的话唤醒一个其他添加元素被阻塞的线程
            notFull.signal();
    } finally {
        putLock.unlock();
    }
    if (c == 0) //c为0说明当前添加元素的时候，队列是空的，现在不是空了
        signalNotEmpty();//唤醒一个出队的线程
}
//入队逻辑，是一个简单的链表操作，向链表尾部插入元素
/**
 * Links node at end of queue.
 *
 * @param node the node
 */
private void enqueue(Node<E> node) {
    // assert putLock.isHeldByCurrentThread();
    // assert last.next == null;
    last = last.next = node;
}
```

### 出队操作

```java
//出队
public E take() throws InterruptedException {
    E x;
    int c = -1;
    final AtomicInteger count = this.count;//获取当前队列元素个数
    final ReentrantLock takeLock = this.takeLock;//获取出队锁
    takeLock.lockInterruptibly();//一直尝试获取锁直到当前线程被中断
    try {
        while (count.get() == 0) {
     //队列为空，则阻塞当前线程
            notEmpty.await();
        }
        x = dequeue();//出队
        c = count.getAndDecrement();//元素个数-1
        if (c > 1)
            notEmpty.signal();//大于1说明队列还有元素，唤醒一个其他获取元素的线程
    } finally {
        takeLock.unlock();
    }
    if (c == capacity)//条件成立说明此时获取元素的时候队列容量是满的，现在取出一个就不满了
        signalNotFull();//所以唤醒一个入队的线程
    return x;
}
//出队操作
/**
 * Removes a node from head of queue.
 *
 * @return the node
 */
private E dequeue() {
    // assert takeLock.isHeldByCurrentThread();
    // assert head.item == null;
    Node<E> h = head;
    Node<E> first = h.next;
    h.next = h; // help GC
    head = first;
    E x = first.item;//这里可以看出，头部元素的item是null已经被取出了，但是对象还在
    first.item = null;//下一次取元素的时候，把头部元素去掉，取下一个元素的item返回
    //所以头部永远有一个空节点
    return x;
}
```

## 1.3 案例演示

```java
public class ArrayBlockingQueueDemo {
	public static void main(String[] args) {
		BlockingQueue<Integer> blockingQueue = new LinkedBlockingQueue<>();
		Producer producer = new Producer(blockingQueue);
		Consumer consumer = new Consumer(blockingQueue);
		new Thread(producer).start();
		new Thread(consumer).start();
	}
}
class Producer implements Runnable {
	private BlockingQueue<Integer> blockingQueue;
	private static int element = 0;
	public Producer(BlockingQueue<Integer> blockingQueue) {
		this.blockingQueue = blockingQueue;
	}
	public void run() {
		try {
			while(element < 20) {
				System.out.println("生产元素："+element);
				blockingQueue.put(element++);
			}
		} catch (Exception e) {
			System.out.println("生产者在等待空闲空间的时候发生异常！");
			e.printStackTrace();
		}
		System.out.println("生产者终止了生产过程！");
	}
}
class Consumer implements Runnable {
	private BlockingQueue<Integer> blockingQueue;
	public Consumer(BlockingQueue<Integer> blockingQueue) {
		this.blockingQueue = blockingQueue;
	}
	public void run() {
		try {
			while(true) {
				System.out.println("消费元素："+blockingQueue.take());
			}
		} catch (Exception e) {
			System.out.println("消费者在等待新产品的时候发生异常！");
			e.printStackTrace();
		}
		System.out.println("消费者终止了消费过程！");
	}
}
```

## 二、LinkedBlockingDeque

## 2.1 API介绍

LinkedBlockingDeque是一个由链表结构组成的双向阻塞队列。所谓双向队列指的你可以从队列的两端插入和移出元素。双端队列因为多了一个操作队列的入口，在多线程同时入队时，也就减少了一半的竞争。相比其他的阻塞队列，LinkedBlockingDeque多了addFirst，addLast，offerFirst，offerLast，peekFirst，peekLast等方法，以First单词结尾的方法，表示插入，获取（peek）或移除双端队列的第一个元素。以Last单词结尾的方法，表示插入，获取或移除双端队列的最后一个元素。另外插入方法add等同于addLast，移除方法remove等效于removeFirst。在初始化LinkedBlockingDeque时可以初始化队列的容量，用来防止其再扩容时过渡膨胀。

## 2.2 源码简析

### 出队操作

```java
public E take() throws InterruptedException {
    return takeFirst();//take默认调用takeFirst
}
public E takeFirst() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        E x;
        while ( (x = unlinkFirst()) == null)//循环阻塞直到获取成功
            notEmpty.await();
        return x;
    } finally {
        lock.unlock();
    }
}
/**
 * Removes and returns first element, or null if empty.
 */
private E unlinkFirst() {
    // assert lock.isHeldByCurrentThread();
    Node<E> f = first;
    if (f == null)
        return null;
    Node<E> n = f.next;
    E item = f.item;
    f.item = null;
    f.next = f; // help GC
    first = n;
    if (n == null) //n 为null说明此时队列只有一个元素，已经拿走了
        last = null;
    else
        n.prev = null;
    --count;
    notFull.signal();
    return item;
}
```

### 入队操作

```java
//入队
public void put(E e) throws InterruptedException {
    putLast(e);//put默认调用putLast
}
/**
 * @throws NullPointerException {@inheritDoc}
 * @throws InterruptedException {@inheritDoc}
 */
public void putLast(E e) throws InterruptedException {
    if (e == null) throw new NullPointerException();
    Node<E> node = new Node<E>(e);
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        while (!linkLast(node))//一直循环阻塞直到添加成功
            notFull.await();//队列容量满了，添加失败就会阻塞线程
    } finally {
        lock.unlock();
    }
}
/**
 * Links node as last element, or returns false if full.
 */
private boolean linkLast(Node<E> node) {
    // assert lock.isHeldByCurrentThread();
    if (count >= capacity)//超过容量则添加失败
        return false;
    Node<E> l = last;
    node.prev = l;
    last = node;
    if (first == null)//first为null说明当前添加的节点是第一个元素
        first = node;
    else
        l.next = node;
    ++count;
    notEmpty.signal();
    return true;
}
```

## 2.3 案例演示

```java
public class LinkedBlockingQueueDemo {
	public static void main(String[] args) {
		BlockingQueue<Integer> blockingQueue = new LinkedBlockingDeque<Integer>();
		Producer producer = new Producer(blockingQueue);
		Consumer consumer = new Consumer(blockingQueue);
		new Thread(producer).start();
		new Thread(consumer).start();
	}
}
class Producer implements Runnable {
	private BlockingQueue<Integer> blockingQueue;
	private static int element = 0;
	public Producer(BlockingQueue<Integer> blockingQueue) {
		this.blockingQueue = blockingQueue;
	}
	public void run() {
		try {
			while(element < 20) {
				System.out.println("生产元素："+element);
				blockingQueue.put(element++);
			}
		} catch (Exception e) {
			System.out.println("生产者在等待空闲空间的时候发生异常！");
			e.printStackTrace();
		}
		System.out.println("生产者终止了生产过程！");
	}
}
class Consumer implements Runnable {
	private BlockingQueue<Integer> blockingQueue;
	public Consumer(BlockingQueue<Integer> blockingQueue) {
		this.blockingQueue = blockingQueue;
	}
	public void run() {
		try {
			while(true) {
				System.out.println("消费元素："+blockingQueue.take());
			}
		} catch (Exception e) {
			System.out.println("消费者在等待新产品的时候发生异常！");
			e.printStackTrace();
		}
		System.out.println("消费者终止了消费过程！");
	}
}
```
