# 13、Java并发编程 - JUC阻塞队列（BlockingQueue、ArrayBlockingQueue、PriorityBlockingQueue、DelayQueue）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/13.html
- 分类：Java并发
- 分组：教程目录
## 一、BlockingQueue

## 1.1 什么是阻塞队列？

阻塞队列（BlockingQueue）是一个支持两个附加操作的队列。这两个附加的操作是：

- 在队列为空时，获取元素的线程会等待队列变为非空。
- 当队列满时，存储元素的线程会等待队列可用。

阻塞队列常用于生产者和消费者的场景，生产者是往队列里添加元素的线程，消费者是从队列里拿元素的线程。阻塞队列就是生产者存放元素的容器，而消费者也只从容器里拿元素。

阻塞队列提供了四种处理方法:

方法\处理方式
抛出异常
返回特殊值
一直阻塞
超时退出

插入方法
add(e)
offer(e)
put(e)
offer(e,time,unit)

移除方法
remove()
poll()
take()
poll(time,unit)

检查方法
element()
peek()
不可用
不可用

- 异常：是指当阻塞队列满时候，再往队列里插入元素，会抛出IllegalStateException(“Queue full”)异常。当队列为空时，从队列里获取元素时会抛出NoSuchElementException异常 。
- 返回特殊值：插入方法会返回是否成功，成功则返回true。移除方法，则是从队列里拿出一个元素，如果没有则返回null
- 一直阻塞：当阻塞队列满时，如果生产者线程往队列里put元素，队列会一直阻塞生产者线程，直到拿到数据，或者响应中断退出。当队列空时，消费者线程试图从队列里take元素，队列也会阻塞消费者线程，直到队列可用。
- 超时退出：当阻塞队列满时，队列会阻塞生产者线程一段时间，如果超过一定的时间，生产者线程就会退出。

## 1.2 API介绍

阻塞队列接口：

```java
public interface BlockingQueue<E> extends Queue<E> {
	//插入元素e到队列中，成功返回true, 否则抛出异常。如果向限定了容量的队列中插入值，推荐使用offer()方法。
	boolean add(E e);
	//插入元素e到队列中，如果设置成功返回true, 否则返回false. e的值不能为空，否则抛出空指针异常。
	boolean offer(E e);
	//插入元素e到队列中，，如果队列中没有多余的空间，该方法会一直阻塞，直到队列中有多余的空间。
	void put(E e) throws InterruptedException;
	//在给定的时间插入元素e到队列中，如果设置成功返回true, 否则返回false.
	boolean offer(E e, long timeout, TimeUnit unit) throws InterruptedException;
	//检索并从队列的头部删除元素，如果队列中没有值，线程会一直阻塞，直到队列中有值，并且该方法取得了该值。
	E take() throws InterruptedException;
	//在给定的时间范围内，检索并从队列的头部删除元素，从队列中获取值，如果没有取到会返回null
	E poll(long timeout, TimeUnit unit) throws InterruptedException;
	//获取队列中剩余的空间。
	int remainingCapacity();
	//从队列中移除指定的值。
	boolean remove(Object o);
	//判断队列中是否包含该值。
	public boolean contains(Object o);
	//将队列中值，全部移除，并追加到给定的集合中。
	int drainTo(Collection<? super E> c);
	//指定最多数量限制将队列中值，全部移除，并追加到给定的集合中。
	int drainTo(Collection<? super E> c, int maxElements);
}
```

## 1.3 子接口

### BlockingDeque

### TransferQueue

TransferQueue继承了BlockingQueue，并扩展了一些新方法。

BlockingQueue是指这样的一个队列：当生产者向队列添加元素但队列已满时，生产者会被阻塞；当消费者从队列移除元素但队列为空时，消费者会被阻塞。

TransferQueue则更进一步，生产者会一直阻塞直到所添加到队列的元素被某一个消费者所消费（不仅仅是添加到队列里就完事）。新添加的transfer方法用来实现这种约束。顾名思义，阻塞就是发生在元素从一个线程transfer到另一个线程的过程中，它有效地实现了元素在线程之间的传递（以建立Java内存模型中的happens-before关系的方式）。

> 【并发重要原则】happens-before理解和应用

TransferQueue还包括了其他的一些方法：两个tryTransfer方法，一个是非阻塞的，另一个带有timeout参数设置超时时间的。还有两个辅助方法hasWaitingConsumer()和getWaitingConsumerCount()。

## 1.4 实现类

JUC一共提供了7种实现类，我们会依次讲解：

ArrayBlockingQueue

PriorityBlockingQueue

DelayQueue

LinkedBlockingQueue

LinkedBlockingDeque

SynchronousQueue

LinkedTransferQueue

## 二、ArrayBlockingQueue

## 2.1 API介绍

`ArrayBlockingQueue` 是一个`线程安全的、基于数组、有界的、阻塞的、FIFO 队列`。试图向已满队列中放入元素会导致操作受阻塞；试图从空队列中提取元素将导致类似阻塞。

此类基于 `java.util.concurrent.locks.ReentrantLock` 来实现线程安全，所以提供了 `ReentrantLock` 所能支持的公平性选择。

## 2.2 源码简析

底层是通过ReentrantLock，和Condition实现的阻塞、唤醒，原理比较简单：

以put方法添加元素为例：

队列空的话取元素也会阻塞：

dequeue是出队方法：

## 2.3 案例演示

```java
public class ArrayBlockingQueueDemo {
	public static void main(String[] args) {
		BlockingQueue<Integer> blockingQueue = new ArrayBlockingQueue<Integer>(3,true);
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

## 三、PriorityBlockingQueue

## 3.1 API介绍

PriorityBlockingQueue是带优先级的无界阻塞队列，每次出队都返回优先级最高的元素，是二叉树最小堆的实现。

> 无界阻塞队列，并不是无界而是说在容量快满的时候会自动扩容。
> 不允许空元素，并且添加的元素需要实现Comparable接口，实现自然排序。
> 不能保证优先级一样的元素的顺序，需要用额外属性进行排序。

[算法复杂度中的O(logN)底数是多少](https://blog.csdn.net/jdbc/article/details/42173751)

## 3.2 源码简析

### 底层数据结构是二叉堆

```java
public class PriorityBlockingQueue<E> extends AbstractQueue<E> implements BlockingQueue<E>, java.io.Serializable {
	...
	//可以看到底层是用平衡二叉堆存储元素的。
    /**
     * Priority queue represented as a balanced binary heap: the two
     * children of queue[n] are queue[2*n+1] and queue[2*(n+1)].  The
     * priority queue is ordered by comparator, or by the elements'
     * natural ordering, if comparator is null: For each node n in the
     * heap and each descendant d of n, n <= d.  The element with the
     * lowest value is in queue[0], assuming the queue is nonempty.
     */
    private transient Object[] queue;
    ...
}
```

关于二叉堆这里就不细说了。

### 扩容逻辑

```java
//扩容的时候会调用
/**
 * Tries to grow array to accommodate at least one more element
 * (but normally expand by about 50%), giving up (allowing retry)
 * on contention (which we expect to be rare). Call only while
 * holding lock.
 *
 * @param array the heap array
 * @param oldCap the length of the array
 */
private void tryGrow(Object[] array, int oldCap) {
    lock.unlock(); // must release and then re-acquire main lock
    Object[] newArray = null;
    if (allocationSpinLock == 0 &&
        UNSAFE.compareAndSwapInt(this, allocationSpinLockOffset,
                                 0, 1)) {
        try {
            int newCap = oldCap + ((oldCap < 64) ?
                                   (oldCap + 2) : // grow faster if small
                                   (oldCap >> 1));// 这里是扩容规则，一开始扩容速度会很慢
            if (newCap - MAX_ARRAY_SIZE > 0) {
         // possible overflow
                int minCap = oldCap + 1;
                if (minCap < 0 || minCap > MAX_ARRAY_SIZE)
                    throw new OutOfMemoryError();//超过最大容量会导致内存溢出
                newCap = MAX_ARRAY_SIZE;
            }
            if (newCap > oldCap && queue == array)
                newArray = new Object[newCap];
        } finally {
            allocationSpinLock = 0;
        }
    }
    if (newArray == null) // back off if another thread is allocating
        Thread.yield();
    lock.lock();
    if (newArray != null && queue == array) {
        queue = newArray;
        System.arraycopy(array, 0, newArray, 0, oldCap);
    }
}
```

### 获取元素

```java
//出队的操作，用二叉堆的下浮操作
/**
 * Mechanics for poll().  Call only while holding lock.
 */
private E dequeue() {
    int n = size - 1;
    if (n < 0)
        return null;
    else {
        Object[] array = queue;
        E result = (E) array[0];//二叉队出队逻辑是弹出顶端元素
        E x = (E) array[n];//将最后一个元素放到顶端，执行下浮操作
        array[n] = null;
        Comparator<? super E> cmp = comparator;
        if (cmp == null)//使用比较器排序执行下浮操作
            siftDownComparable(0, x, array, n);
        else//使用自然排序执行下浮操作
            siftDownUsingComparator(0, x, array, n, cmp);
        size = n;
        return result;
    }
}
```

下浮操作是二叉堆移除元素的算法，本节不细究。

```java
//可以看到take就是调用dequeue出队方法获取元素的
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    E result;
    try {
        while ( (result = dequeue()) == null)//通过dequeue方法获取元素，如果队列为空就会进行一个阻塞操作
            notEmpty.await();
    } finally {
        lock.unlock();
    }
    return result;
}
```

### 添加元素

```java
//追加元素，用上浮操作
/**
 * Inserts the specified element into this priority queue.
 * As the queue is unbounded, this method will never return {@code false}.
 *
 * @param e the element to add
 * @return {@code true} (as specified by {@link Queue#offer})
 * @throws ClassCastException if the specified element cannot be compared
 *         with elements currently in the priority queue according to the
 *         priority queue's ordering
 * @throws NullPointerException if the specified element is null
 */
public boolean offer(E e) {
    if (e == null)
        throw new NullPointerException();
    final ReentrantLock lock = this.lock;
    lock.lock();//先获取锁进行锁定
    int n, cap;
    Object[] array;
    while ((n = size) >= (cap = (array = queue).length))//判断队列容量是否需要扩容
        tryGrow(array, cap);
    try {
        Comparator<? super E> cmp = comparator;
        if (cmp == null)//比较器为空就自然排序进行插入
            siftUpComparable(n, e, array);
        else
            siftUpUsingComparator(n, e, array, cmp);
        size = n + 1;//插入成功，容量大小+1
        notEmpty.signal();//发一个信号，如果有线程在等待队列里的元素，做一个唤醒。
    } finally {
        lock.unlock();
    }
    return true;
}
```

上浮操作是二叉堆的添加元素算法，本节不细究。

```java
//可以看到put、offer(timeout)都调用的的offer，因为这个队列是无界的
//所以不会产生因为队列满而阻塞的情况
public void put(E e) {
    offer(e); // never need to block
}
public boolean offer(E e, long timeout, TimeUnit unit) {
    return offer(e); // never need to block
}
```

## 3.3 案例演示

```java
public class PriorityBlockingQueueTest {
	public static void main(String[] args) throws InterruptedException {
		PriorityBlockingQueue<PriorityElement> queue = new PriorityBlockingQueue<>();
		for (int i = 0; i < 5; i++) {
			Random random=new Random();
			PriorityElement ele = new PriorityElement(random.nextInt(10));
			queue.put(ele);
		}
		while(!queue.isEmpty()){
			System.out.println(queue.take());
		}
	}
}
class PriorityElement implements Comparable<PriorityElement> {
	private int priority;//定义优先级
	PriorityElement(int priority) {
		//初始化优先级
		this.priority = priority;
	}
	@Override
	public int compareTo(PriorityElement o) {
		//按照优先级大小进行排序
		return priority >= o.getPriority() ? 1 : -1;
	}
	public int getPriority() {
		return priority;
	}
	public void setPriority(int priority) {
		this.priority = priority;
	}
	@Override
	public String toString() {
		return "PriorityElement [priority=" + priority + "]";
	}
}
```

## 四、DelayQueue

## 4.1 API介绍

DelayQueue队列中每个元素都有个过期时间，并且队列是个优先级队列，当从队列获取元素时候，只有过期元素才会出队列。

> 应用场景：
>
>
> 比如买东西下订单，一天之内没有付款就会关闭，或者秒杀业务，有时间限制等，就可以使用这个延迟队列。
> 比如连接服务器，服务器会监测到很多连接是空闲的，这个时候超过一定时间也可以把空闲连接进行关闭。

> 三个特点：无界、阻塞、过期、只能取到队首的过期元素

### Delayed 接口

放入DelayQueue的元素必须实现`Delayed`接口

> Delayed继承自Comparable，所以也需要实现自然排序。

## 4.2 源码简析

### 底层数据结构是PriorityQueue

```java
public class DelayQueue<E extends Delayed> extends AbstractQueue<E> implements BlockingQueue<E> {
	//看到底层用带优先级的队列来存储元素
    private final PriorityQueue<E> q = new PriorityQueue<E>();
	...
}
```

### 等待优化

```java
public class DelayQueue<E extends Delayed> extends AbstractQueue<E> implements BlockingQueue<E> {
	...
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
     * 
     * 指定等待队列头元素的线程。这个Leader-Follower模式的变体(http://www.cs.wustl.edu/~schmidt/POSA/POSA2/)
     * 可以将不必要的时间等待最小化。当一个线程成为leader时，它只等待下一次延迟，而其他线程则无限期地等待。
     * 在从take()或 poll(…)返回之前，领头线程必须向其他线程发出信号，除非其他线程在过渡期间成为领头线程。
     * 当队列的头被具有较早过期时间的元素替换时，leader字段将被重置为null，并向一些等待的线程发出信号，但
     * 不一定是当前的leader。因此，等待线程必须准备好在等待时获得或失去领导权。
     */
    private Thread leader = null;
    /**
     * Condition signalled when a newer element becomes available
     * at the head of the queue or a new thread may need to
     * become leader.
     * 当一个新的元素在队列的最前面可用或者一个新的线程需要成为leader时，发出信号的条件。
     */
    private final Condition available = lock.newCondition();
    ...
}
```

DelayQueue做了一个优化，如果一个线程获取队首元素，但是该元素还没有过期，那么会将当前线程记录到leader变量上，让其阻塞到该元素刚好过期的时间，期间其他线程获取元素的时候会直接无限期等待。这样可以将不必要的时间等待最小化。

如果leader等待过程中添加了更早的的元素，会做相应的唤醒等一系列处理。

### 获取元素

```java
//获取元素的方法
/**
 * Retrieves and removes the head of this queue, waiting if necessary
 * until an element with an expired delay is available on this queue.
 *
 * @return the head of this queue
 * @throws InterruptedException {@inheritDoc}
 */
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();//阻塞可中断
    try {
        for (;;) {
      //循环
            E first = q.peek(); //优先级队列中取出头元素
            if (first == null)
                available.await();//空队列则阻塞线程
            else {
                long delay = first.getDelay(NANOSECONDS);
                if (delay <= 0)//判断是否过期
                    return q.poll();//过期直接出队返回
                first = null; // don't retain ref while waiting
                if (leader != null)
                    available.await();//leader不为null，说明已经有其他线程比自己先等待了，当前线程就无限期阻塞
                else {
                 	//空的话说明没有其他线程在等待
                    Thread thisThread = Thread.currentThread();
                    //当前线程变为leader
                    leader = thisThread;
                    try {
                        available.awaitNanos(delay);//使当前线程等待，直到发出信号或中断，或者指定的等待时间过去。
                        //等待时间刚好是元素过期的时间
                    } finally {
                        if (leader == thisThread)
                            leader = null;//释放leader
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
```

### 添加元素

```java
//追加元素
/**
 * Inserts the specified element into this delay queue.
 *
 * @param e the element to add
 * @return {@code true}
 * @throws NullPointerException if the specified element is null
 */
public boolean offer(E e) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        q.offer(e);
        if (q.peek() == e) {
         	//成立说明刚添加的元素是队列里面延迟时间最短的元素
         	//刷新了最短记录，这个时候需要把leader情况，然后唤醒所有等待的线程
         	//重新执行获取元素的逻辑
            leader = null;
            available.signal();
        }
        return true;
    } finally {
        lock.unlock();
    }
}
```

## 4.3 案例演示

```java
public class DelayQueueTest  {
    public static void main(String[] args) throws InterruptedException {
        Item item1 = new Item("item1", 5, TimeUnit.SECONDS);
        Item item2 = new Item("item2",10, TimeUnit.SECONDS);
        Item item3 = new Item("item3",15, TimeUnit.SECONDS);
        DelayQueue<Item> queue = new DelayQueue<>();
        queue.put(item1);
        queue.put(item2);
        queue.put(item3);
        System.out.println("begin time:" + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        for (int i = 0; i < 3; i++) {
            Item take = queue.take();//阻塞获取
            System.out.format("name:{%s}, time:{%s}\n",take.name, LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        }
    }
}
class Item implements Delayed {
    /* 触发时间*/
    private long time;
    String name;
    public Item(String name, long time, TimeUnit unit) {
        this.name = name;
        this.time = System.currentTimeMillis() + (time > 0? unit.toMillis(time): 0);
    }
    @Override
    public long getDelay(TimeUnit unit) {
        return time - System.currentTimeMillis();
    }
    @Override
    public int compareTo(Delayed o) {
        Item item = (Item) o;
        long diff = this.time - item.time;
        if (diff <= 0) {
     // 改成>=会造成问题
            return -1;
        }else {
            return 1;
        }
    }
    @Override
    public String toString() {
        return "Item{" +
                "time=" + time +
                ", name='" + name + '\'' +
                '}';
    }
}
```
