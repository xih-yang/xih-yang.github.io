# 15、Java并发编程 - JUC阻塞队列（SynchronousQueue、LinkedTransferQueue）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/15.html
- 分类：Java并发
- 分组：教程目录
## 一、SynchronousQueue

## 1.1 API介绍

SynchronousQueue是一个没有数据缓冲的BlockingQueue，生产者线程对其的插入操作put必须等待消费者的移除操作take，反过来也一样。

SynchronousQueue内部并没有数据缓存空间，你不能调用peek()方法来看队列中是否有数据元素，因为数据元素只有当你试着取走的时候才可能存在，不取走而只想偷窥一下是不行的，当然遍历这个队列的操作也是不允许的。

数据是在配对的生产者和消费者线程之间直接传递的，并不会将数据缓冲到队列中。

SynchronousQueue支持公平访问队列，默认情况下，线程采用非公平策略，如果使用公平策略，等待的线程采用先进先出的顺序访问队列。

SynchronousQueue适合传递性场景，一个使用场景是在线程池里。Executors.newCachedThreadPool()就使用了SynchronousQueue，这个线程池根据需要（新任务到来时）创建新的线程，如果有空闲线程则会重复使用，线程空闲了60秒后会被回收。

- 插入操作会阻塞，直到这个元素被另一个线程消费。消费元素的操作也同理，反之亦然。
- peek方法获取但不删除该队列的头，如果该队列为空，则返回null，由于上面描述的特性SynchronousQueue队列的peek方法总是返回null，没用。
- 构造器有一个可选参数控制是否公平

## 1.2 源码简析

### 底层实现Transferer

```java
public class SynchronousQueue<E> extends AbstractQueue<E> implements BlockingQueue<E>, java.io.Serializable {
	...
	//有两个构造：
    /**
     * Creates a {@code SynchronousQueue} with nonfair access policy.
     */
    public SynchronousQueue() {
        this(false);
    }
    /**
     * Creates a {@code SynchronousQueue} with the specified fairness policy.
     *
     * @param fair if true, waiting threads contend in FIFO order for
     *        access; otherwise the order is unspecified.
     */
    public SynchronousQueue(boolean fair) {
	    //公平用TransferQueue，不公平用TransferStack
        transferer = fair ? new TransferQueue<E>() : new TransferStack<E>();
    }
	//TransferQueue和TransferStack都继承自Transferer这个内部类抽象类：
    /**
     * Shared internal API for dual stacks and queues.
     */
    abstract static class Transferer<E> {
	    //定义了一个transfer方法，无论是往队列插入还是删除元素最终都会调用这个transfer方法
        /**
         * Performs a put or take.
         *
         * @param e if non-null, the item to be handed to a consumer;
         *          if null, requests that transfer return an item
         *          offered by producer.
         *          非空时,表示这个元素要传递给消费者（提供者-put）;
         *          为空时, 则表示当前操作要请求消费一个数据（消费者-take）。
         * @param timed if this operation should timeout 决定是否存在timeout时间
         * @param nanos the timeout, in nanoseconds 超时时长
         * @return if non-null, the item provided or received; if null,
         *         the operation failed due to timeout or interrupt --
         *         the caller can distinguish which of these occurred
         *         by checking Thread.interrupted.
         *         如果返回非空, 代表数据已经被消费或者正常提供; 如果为空,
         *         则表示由于超时或中断导致失败。可通过Thread.interrupted来检
         *         查是那种。
         */
        abstract E transfer(E e, boolean timed, long nanos);
    }
	...
}
```

看到有两个实现，一个是队列的实现，一个是栈的实现，分别对应公平和非公平实现：

我们可以先看下SynchronousQueue的put、take、offer、poll方法，可以看到都调用了transferer.transfer：

```java
public class SynchronousQueue<E> extends AbstractQueue<E> implements BlockingQueue<E>, java.io.Serializable {
	...
    /**
     * Adds the specified element to this queue, waiting if necessary for
     * another thread to receive it.
     *
     * @throws InterruptedException {@inheritDoc}
     * @throws NullPointerException {@inheritDoc}
     */
    public void put(E e) throws InterruptedException {
        if (e == null) throw new NullPointerException();
        //入队，要放入元素,false代表会一直阻塞直到成功
        if (transferer.transfer(e, false, 0) == null) {
            Thread.interrupted();
            throw new InterruptedException();
        }
    }
    /**
     * Inserts the specified element into this queue, waiting if necessary
     * up to the specified wait time for another thread to receive it.
     *
     * @return {@code true} if successful, or {@code false} if the
     *         specified waiting time elapses before a consumer appears
     * @throws InterruptedException {@inheritDoc}
     * @throws NullPointerException {@inheritDoc}
     */
    public boolean offer(E e, long timeout, TimeUnit unit)
        throws InterruptedException {
        if (e == null) throw new NullPointerException();
        //入队，要放入元素,true代表允许超时，最多等待指定的时间
        if (transferer.transfer(e, true, unit.toNanos(timeout)) != null)
            return true;
        if (!Thread.interrupted())
            return false;
        throw new InterruptedException();
    }
    /**
     * Retrieves and removes the head of this queue, waiting if necessary
     * for another thread to insert it.
     *
     * @return the head of this queue
     * @throws InterruptedException {@inheritDoc}
     */
    public E take() throws InterruptedException {
    	//出队，不需要放入元素，false代表会一直阻塞直到成功
        E e = transferer.transfer(null, false, 0);
        if (e != null)
            return e;
        Thread.interrupted();
        throw new InterruptedException();
    }
    /**
     * Retrieves and removes the head of this queue, if another thread
     * is currently making an element available.
     *
     * @return the head of this queue, or {@code null} if no
     *         element is available
     */
    public E poll() {
    	//出队，不需要放入元素,true代表允许超时，0代表不会阻塞。
        return transferer.transfer(null, true, 0);
    }
	...
}
```

### 非公平实现TransferStack 原理图解

先来简单看一下非公平模式的简单原理，它采用的栈这种`FILO先进后出的方式进行非公平处理`，它内部有三种状态，分别是REQUEST，DATA，FULFILLING，其中REQUEST代表的数据请求的操作也就是take操作，而DATA表示的是数据也就是Put操作将数据存放到栈中，用于消费者进行获取操作，而FULFILLING代表的是可以进行互补操作的状态。

当有相同模式情况下进行入栈操作，相同操作指的是REQUEST和DATA两种类型中任意一种进行操作时，模式相同则进行入栈操作，如下图所示：

同REQUEST进行获取数据时的入栈情况：

同样的put的操作，进行数据操作时为DATA类型的操作，此时队列情况为：

不同模式下又是如何进行操作的？当有不同模式进来的时候，他不是将当前的模式压入栈顶，而是将FullFill模式和当前模式进行按位或之后压入栈顶，也就是压入一个进行FullFill请求的模式进入栈顶，请求配对操作，如下图所示：

通过上图可见，本来栈中有一个DATA模式的数据等待消费者进行消费，这时候来了一个REQUEST模式的请求操作来进行消费数据，这时候并没有将REQUEST模式直接压入栈顶，而是将其转换为FULLFILLING模式，并且保留了原有的类型，这是进行FULLFILLING的请求，请求和栈顶下方元素进行匹配，当匹配成功后将栈顶和匹配元素同时进行出栈操作。

### 非公平实现TransferStack 核心流程代码分析

我们看下transferer.transfer做了什么事，看栈实现的Transferer，主要做了三件事：

```java
public class SynchronousQueue<E> extends AbstractQueue<E> implements BlockingQueue<E>, java.io.Serializable {
	...
	//先看下TransferQueue，内部类
	static final class TransferStack<E> extends Transferer<E> {
		...
        /* Modes for SNodes, ORed together in node fields */
        /** Node represents an unfulfilled consumer */
        static final int REQUEST    = 0;//消费者模式
        /** Node represents an unfulfilled producer */
        static final int DATA       = 1;//提供者模式 
        /** Node is fulfilling another unfulfilled DATA or REQUEST */
        static final int FULFILLING = 2;//互补模式
        /**
         * Puts or takes an item.
         */
        @SuppressWarnings("unchecked")
        E transfer(E e, boolean timed, long nanos) {
            /*
             * Basic algorithm is to loop trying one of three actions:
             * 基本算法是循环尝试以下三种操作之一:
             * 
             * 1. If apparently empty or already containing nodes of same
             *    mode, try to push node on stack and wait for a match,
             *    returning it, or null if cancelled.
             *    如果显然是空的或者已经包含了相同模式的节点，尝试将node推入堆栈并等
             *    待匹配，并返回匹配，如果取消则返回null。
             *
             * 2. If apparently containing node of complementary mode,
             *    try to push a fulfilling node on to stack, match
             *    with corresponding waiting node, pop both from
             *    stack, and return matched item. The matching or
             *    unlinking might not actually be necessary because of
             *    other threads performing action 3:
             *    如果显然包含互补模式的节点，尝试将一个互补模式节点推到堆栈上，
             *    与相应的等待节点匹配，从堆栈中弹出两个节点，并返回匹配的项目。
             *    因为其他线程执行操作3，所以匹配或取消链接可能实际上是不必要的:
             *  
             * 3. If top of stack already holds another fulfilling node,
             *    help it out by doing its match and/or pop
             *    operations, and then continue. The code for helping
             *    is essentially the same as for fulfilling, except
             *    that it doesn't return the item.
             *    如果top of stack已经拥有另一个互补模式节点，通过执行匹配和/或弹出
             *    操作帮助它解决问题，然后继续。帮助的代码本质上和满足的代码是一样
             *    的，除了它不返回项目。
             */
            SNode s = null; // constructed/reused as needed
            int mode = (e == null) ? REQUEST : DATA;//节点模式，消费模式 或 生产模式
		    for (;;) {
		        SNode h = head;
		        if (h == null || h.mode == mode) {
       // 栈顶指针为空或者是模式相同
		            if (timed && nanos <= 0) {
           // 制定了timed并且时间小于等于0则取消操作。
		                if (h != null && h.isCancelled())
		                    casHead(h, h.next);     // 判断头结点是否被取消了取消了就弹出队列，将头结点指向下一个节点
		                else
		                    return null;
		            } else if (casHead(h, s = snode(s, e, h, mode))) {
     // 初始化新节点并且修改栈顶指针
		                SNode m = awaitFulfill(s, timed, nanos);			// 进行等待操作
		                if (m == s) {
                    // 返回内容是本身则进行清理操作
		                    clean(s);
		                    return null;
		                }
		                if ((h = head) != null && h.next == s)
		                    casHead(h, s.next);     // help s's fulfiller
		                return (E) ((mode == REQUEST) ? m.item : s.item);
		            }
		        } else if (!isFulfilling(h.mode)) {
      // 尝试去匹配
		            if (h.isCancelled())            // 判断是否已经被取消了
		                casHead(h, h.next);         // 弹出取消的节点并且从新进入主循环
		            else if (casHead(h, s=snode(s, e, h, FULFILLING|mode))) {
     //新建一个Full节点压入栈顶
		                for (;;) {
      // 循环直到匹配
		                    SNode m = s.next;       // s的下一个节点为匹配节点
		                    if (m == null) {
             // 代表没有等待内容了
		                        casHead(s, null);   // 弹出full节点
		                        s = null;           // 设置为null用于下次生成新的节点
		                        break;              // 退回到主循环中
		                    }
		                    SNode mn = m.next;
		                    if (m.tryMatch(s)) {
		                        casHead(s, mn);     // 弹出s节点和m节点两个节点
		                        return (E) ((mode == REQUEST) ? m.item : s.item);
		                    } else                  // 如果失去了匹配
		                        s.casNext(m, mn);   // 帮助取消连接
		                }
		            }
		        } else {
                                 // 这里是帮助进行fillull
		            SNode m = h.next;               // m是头结点的匹配节点
		            if (m == null)                  // 如果m不存在则直接将头节点赋值为nll
		                casHead(h, null);           // 弹出fulfill节点
		            else {
		                SNode mn = m.next;
		                if (m.tryMatch(h))          // h节点尝试匹配m节点
		                    casHead(h, mn);         // 弹出h和m节点
		                else                        // 丢失匹配则直接将头结点的下一个节点赋值为头结点的下下节点
		                    h.casNext(m, mn);       
		            }
		        }
		    }
		}
		...
	}
	...
}
```

> 源码中可以发现同步队列里面没有用到锁，是没有锁机制的。底层是通过大量自旋CAS完成的。好处是性能的提升，代价就是代码的复杂性。
>
> 举个例子，如果等待的某个线程中途取消了，会执行tryCancel方法：

### 公平模式TransferQueue 原理图解

TransferQueue内部是如何进行工作的，这里先大致讲解下，队列采用了互补模式进行等待，队列中的元素QNode中有一个字段是isData，代表是生产模式还是消费模式，如果模式相同或空队列时进行等待操作，互补的情况下就进行消费操作。

入队操作相同模式

不同模式时进行出队列操作：

这时候来了一个isData=false的互补模式，队列就会变成如下状态：

### 公平模式TransferQueue 核心流程代码分析

```java
E transfer(E e, boolean timed, long nanos) {
    /* Basic algorithm is to loop trying to take either of
     * two actions:
     *
     * 1. If queue apparently empty or holding same-mode nodes,
     *    try to add node to queue of waiters, wait to be
     *    fulfilled (or cancelled) and return matching item.
     *
     * 2. If queue apparently contains waiting items, and this
     *    call is of complementary mode, try to fulfill by CAS'ing
     *    item field of waiting node and dequeuing it, and then
     *    returning matching item.
     *
     * In each case, along the way, check for and try to help
     * advance head and tail on behalf of other stalled/slow
     * threads.
     *
     * The loop starts off with a null check guarding against
     * seeing uninitialized head or tail values. This never
     * happens in current SynchronousQueue, but could if
     * callers held non-volatile/final ref to the
     * transferer. The check is here anyway because it places
     * null checks at top of loop, which is usually faster
     * than having them implicitly interspersed.
     */
    QNode s = null; // constructed/reused as needed
    // 分为两种状态1.有数据=true 2.无数据=false
    boolean isData = (e != null);
    // 循环内容
    for (;;) {
        // 尾部节点。
        QNode t = tail;
        // 头部节点。
        QNode h = head;
        // 判断头部和尾部如果有一个为null则自旋转。
        if (t == null || h == null)         // 还未进行初始化的值。
            continue;                       // 自旋
        // 头结点和尾节点相同或者尾节点的模式和当前节点模式相同。
        if (h == t || t.isData == isData) {
      // 空或同模式。
            // tn为尾节点的下一个节点信息。
            QNode tn = t.next;
            // 这里我认为是阅读不一致，原因是当前线程还没有阻塞的时候其他线程已经修改了尾节点tail会导致当前线程的tail节点不一致。
            if (t != tail)                  // inconsistent read
                continue;
            if (tn != null) {
                    // lagging tail
                advanceTail(t, tn);
                continue;
            }
            if (timed && nanos <= 0)        // 这里如果指定timed判断时间小于等于0直接返回。
                return null;
            // 判断新增节点是否为null,为null直接构建新节点。
            if (s == null)
                s = new QNode(e, isData);
            if (!t.casNext(null, s))        // 如果next节点不为null说明已经有其他线程进行tail操作
                continue;
            // 将t节点替换为s节点
            advanceTail(t, s);
            // 等待有消费者消费线程。
            Object x = awaitFulfill(s, e, timed, nanos);
            // 如果返回的x，指的是s.item,如果s.item指向自己的话清除操作。
            if (x == s) {
                clean(t, s);
                return null;
            }
            // 如果没有取消联系
            if (!s.isOffList()) {
                // 将当前节点替换头结点
                advanceHead(t, s);          // unlink if head
                if (x != null)              // 取消item值，这里是take方法时会进行item赋值为this
                    s.item = s;
                // 将等待线程设置为null
                s.waiter = null;
            }
            return (x != null) ? (E)x : e;
        } else {
                                 // complementary-mode
            // 获取头结点下一个节点
            QNode m = h.next;               // node to fulfill
            // 如果当前线程尾节点和全局尾节点不一致,重新开始
            // 头结点的next节点为空，代表无下一个节点，则重新开始，
            // 当前线程头结点和全局头结点不相等，则重新开始
            if (t != tail || m == null || h != head)
                continue;                   // inconsistent read
            Object x = m.item;
            if (isData == (x != null) ||    // m already fulfilled
                x == m ||                   // m cancelled
                !m.casItem(x, e)) {
              // lost CAS
                advanceHead(h, m);          // dequeue and retry
                continue;
            }
            advanceHead(h, m);              // successfully fulfilled
            LockSupport.unpark(m.waiter);
            return (x != null) ? (E)x : e;
        }
    }
}
```

更多详细分析，推荐博文

[SynchronousQueue原理详解-公平模式](https://www.cnblogs.com/dwlsxj/p/Thread.html)

[SynchronousQueue原理详解-非公平模式](https://www.cnblogs.com/dwlsxj/p/synchronousqueue-unfair-pattern.html)

## 1.3 案例演示

```java
public class SynchronousQueueDemo {
	public static void main(String[] args) {
		BlockingQueue<Integer> blockingQueue = new SynchronousQueue<>();
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
				Thread.sleep(1000l);//每消费一次睡眠一秒
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

> 和前面的阻塞队列最大区别就是：前面队列的阻塞是队列为空或者满了才会发生阻塞，而同步队列入队的操作只要没有对应的出队线程进行出队操作则会一直阻塞，反之亦然。

## 二、LinkedTransferQueue

## 2.1 API介绍

LinkedTransferQueue是一个由链表结构组成的无界阻塞TransferQueue队列。`相对于其他阻塞队列LinkedTransferQueue多了tryTransfer和transfer方法。`

- **transfer方法**。如果当前有消费者正在等待接收元素（消费者使用take()方法或带时间限制的poll()方法时），transfer方法可以把生产者传入的元素立刻transfer（传输）给消费者。如果没有消费者在等待接收元素，transfer方法会将元素存放在队列的tail节点，并等到该元素被消费者消费了才返回。transfer方法的关键代码如下：

```java
Node pred = tryAppend(s, haveData);
return awaitMatch(s, pred, e, (how == TIMED), nanos);
```

第一行代码是试图把存放当前元素的s节点作为tail节点。第二行代码是让CPU自旋等待消费者消费元素。因为自旋会消耗CPU，所以自旋一定的次数后使用Thread.yield()方法来暂停当前正在执行的线程，并执行其他线程。

- **tryTransfer方法**。则是用来试探下生产者传入的元素是否能直接传给消费者。如果没有消费者等待接收元素，则返回false。和transfer方法的区别是tryTransfer方法无论消费者是否接收，方法立即返回。而transfer方法是必须等到消费者消费了才返回。

对于带有时间限制的tryTransfer(E e, long timeout, TimeUnit unit)方法，则是试图把生产者传入的元素直接传给消费者，但是如果没有消费者消费该元素则等待指定的时间再返回，如果超时还没消费元素，则返回false，如果在超时时间内消费了元素，则返回true。

```java
public interface TransferQueue<E> extends BlockingQueue<E> {
    // 如果存在一个消费者已经等待接收它，则立即传送指定的元素，否则返回false，并且不进入队列。
    boolean tryTransfer(E e);
    // 如果存在一个消费者已经等待接收它，则立即传送指定的元素，否则等待直到元素被消费者接收。
    void transfer(E e) throws InterruptedException;
    // 在上述方法的基础上设置超时时间
    boolean tryTransfer(E e, long timeout, TimeUnit unit) throws InterruptedException;
    // 如果至少有一位消费者在等待，则返回true
    boolean hasWaitingConsumer();
    // 获取所有等待获取元素的消费线程数量
    int getWaitingConsumerCount();
}
```

> 该集合既能满足单链表的阻塞队列，又能满足同步队列

> 和SynchronousQueue相比，LinkedTransferQueue多了一个可以存储的队列，与LinkedBlockingQueue相比，LinkedTransferQueue多了直接传递元素，少了用锁来同步。

## 2.2 源码简析

### 入队、出队方法

```java
public class LinkedTransferQueue<E> extends AbstractQueue<E> implements TransferQueue<E>, java.io.Serializable {
	...
	//看到入队都会调用xfer方法
    public void put(E e) {
        xfer(e, true, ASYNC, 0);
    }
    public boolean offer(E e) {
        xfer(e, true, ASYNC, 0);
        return true;
    }
    public boolean add(E e) {
        xfer(e, true, ASYNC, 0);
        return true;
    }
    //TransferQueue接口定义的方法也会调用xfer方法
    public void transfer(E e) throws InterruptedException {
        if (xfer(e, true, SYNC, 0) != null) {
            Thread.interrupted(); // failure possible only due to interrupt
            throw new InterruptedException();
        }
    }
	//出队也是调用xfer方法
    public E take() throws InterruptedException {
        E e = xfer(null, false, SYNC, 0);
        if (e != null)
            return e;
        Thread.interrupted();
        throw new InterruptedException();
    }
    public E poll(long timeout, TimeUnit unit) throws InterruptedException {
        E e = xfer(null, false, TIMED, unit.toNanos(timeout));
        if (e != null || !Thread.interrupted())
            return e;
        throw new InterruptedException();
    }
	...
}
```

我们可以看到，这些出队、入队方法都会调用xfer方法，因为LinkedTransferQueue是无界的，入队操作都会成功，所以入队操作都是ASYNC的，而出队方法，则是根据不同的要求传入不同的值，比如需要阻塞的出队方法就传入SYNC，需要加入超时控制的就传入TIMED。

### 核心流程xfer方法流程图解

### 核心流程xfer方法分析

xfer方法是实现LinkedTransferQueue的关键方法：

```java
public class LinkedTransferQueue<E> extends AbstractQueue<E> implements TransferQueue<E>, java.io.Serializable {
	...
    /*
     * Possible values for "how" argument in xfer method.
     */
	// xfer方法的how参数的可能取值
	// 用于无等待的poll、tryTransfer
	private static final int NOW   = 0; // for untimed poll, tryTransfer
	// 用于offer、put、add
	private static final int ASYNC = 1; // for offer, put, add
	// 用于无超时的阻塞transfer、take
	private static final int SYNC  = 2; // for transfer, take
	// 用于超时等待的poll、tryTransfer
	private static final int TIMED = 3; // for timed poll, tryTransfer
    /**
     * Implements all queuing methods. See above for explanation.
     *
     * @param e the item or null for take //元素，入队的话就是入队元素，出队就是null
     * @param haveData true if this is a put, else a take //是否有数据，true代表有数据是入队，false代表没有数据是出队
     * @param how NOW, ASYNC, SYNC, or TIMED //now，同步，异步，超时
     * @param nanos timeout in nanosecs, used only if mode is TIMED
     * @return an item if matched, else e
     * @throws NullPointerException if haveData mode but e is null
     */
	private E xfer(E e, boolean haveData, int how, long nanos) {
	    // 如果haveData但是e为null，则抛出NullPointerException异常
	    if (haveData && (e == null))
	        throw new NullPointerException();
	    // s是将要被添加的节点，如果需要
	    Node s = null;                        // the node to append, if needed
	    retry:
	    for (;;) {
                                 // restart on append race
	        // 从首节点开始匹配
	        for (Node h = head, p = h; p != null;) {
      // find & match first node
	            boolean isData = p.isData;
	            Object item = p.item;
	            // 判断节点是否被匹配过
	            // item != null有2种情况：一是put操作，二是take的item被修改了(匹配成功)
	            // (itme != null) == isData 要么表示p是一个put操作，要么表示p是一个还没匹配成功的take操作
	            if (item != p && (item != null) == isData) {
      // unmatched
	                // 节点与此次操作模式一致，无法匹配
	                if (isData == haveData)   // can't match
	                    break;
	                // 匹配成功
	                if (p.casItem(item, e)) {
      // match
	                    for (Node q = p; q != h;) {
	                        Node n = q.next;  // update by 2 unless singleton
	                        // 更新head为匹配节点的next节点
	                        if (head == h && casHead(h, n == null ? q : n)) {
	                            // 将旧节点自连接
	                            h.forgetNext();
	                            break;
	                        }                 // advance and retry
	                        if ((h = head)   == null ||
	                            (q = h.next) == null || !q.isMatched())
	                            break;        // unless slack < 2
	                    }
	                    // 匹配成功，则唤醒阻塞的线程
	                    LockSupport.unpark(p.waiter);
	                    // 类型转换，返回匹配节点的元素
	                    return LinkedTransferQueue.<E>cast(item);
	                }
	            }
	            // 若节点已经被匹配过了，则向后寻找下一个未被匹配的节点
	            Node n = p.next;
	            // 如果当前节点已经离队，则从head开始寻找
	            p = (p != n) ? n : (h = head); // Use head if p offlist
	        }
	        // 若整个队列都遍历之后，还没有找到匹配的节点，则进行后续处理
	        // 把当前节点加入到队列尾
	        if (how != NOW) {
                      // No matches available
	            if (s == null)
	                s = new Node(e, haveData);
	            // 将新节点s添加到队列尾并返回s的前驱节点
	            Node pred = tryAppend(s, haveData);
	            // 前驱节点为null，说明有其他线程竞争，并修改了队列，则从retry重新开始
	            if (pred == null)
	                continue retry;           // lost race vs opposite mode
	            // 不为ASYNC方法，则同步阻塞等待
	            if (how != ASYNC)
	                return awaitMatch(s, pred, e, (how == TIMED), nanos);
	        }
	        // how == NOW，则立即返回
	        return e; // not waiting
	    }
	}
	...
}
```

xfer方法的整个操作流程如下所示：

- 1、寻找和操作匹配的节点
- 从head开始向后遍历寻找未被匹配的节点，找到一个未被匹配并且和本次操作的模式不同的节点，匹配节点成功就通过CAS 操作将匹配节点的item字段设置为e，若修改失败，则继续向后寻找节点。
- 通过CAS操作更新head节点为匹配节点的next节点，旧head节点进行自连接，唤醒匹配节点的等待线程waiter，返回匹配的 item。如果CAS失败，并且松弛度大于等于2，就需要重新获取head重试。
- 2、如果在上述操作中没有找到匹配节点，则根据参数how做不同的处理：
- NOW：立即返回，也不会插入节点
- SYNC：插入一个item为e（isData = haveData）到队列的尾部，然后自旋或阻塞当前线程直到节点被匹配或者取消。
- ASYNC：插入一个item为e（isData = haveData）到队列的尾部，不阻塞直接返回。
- TIMED：插入一个item为e（isData = haveData）到队列的尾部，然后自旋或阻塞当前线程直到节点被匹配或者取消或者超时。

上面提到了一个松弛度的概念，它是什么作用呢？

在节点被匹配（被删除）之后，不会立即更新head/tail，而是当 head/tail 节点和最近一个未匹配的节点之间的距离超过一个“松弛阀值”之后才会更新（在LinkedTransferQueue中，这个值为 2）。这个“松弛阀值”一般为1-3，如果太大会降低缓存命中率，并且会增加遍历链的长度；太小会增加 CAS 的开销。

更多详细分析推荐博文：

[Java并发编程之LinkedTransferQueue阻塞队列详解](https://blog.csdn.net/qq_38293564/article/details/80593821)

## 2.3 案例演示

```java
public class LinkedTransferQueueTest {
	public static void main(String[] args) {
		LinkedTransferQueue<Integer> blockingQueue = new LinkedTransferQueue<Integer>();
		Producer producer = new Producer(blockingQueue);
		Consumer consumer = new Consumer(blockingQueue);
		new Thread(producer).start();
		new Thread(consumer).start();
	}
}
class Producer implements Runnable {
	private LinkedTransferQueue<Integer> linkedTransferQueue;
	private static int element = 0;
	public Producer(LinkedTransferQueue<Integer> linkedTransferQueue) {
		this.linkedTransferQueue = linkedTransferQueue;
	}
	public void run() {
		try {
			while(element < 20) {
				System.out.println("生产元素："+element);
				linkedTransferQueue.put(element++);
			}
		} catch (Exception e) {
			System.out.println("生产者在等待空闲空间的时候发生异常！");
			e.printStackTrace();
		}
		System.out.println("生产者终止了生产过程！");
	}
}
class Consumer implements Runnable {
	private LinkedTransferQueue<Integer> linkedTransferQueue;
	public Consumer(LinkedTransferQueue<Integer> linkedTransferQueue) {
		this.linkedTransferQueue = linkedTransferQueue;
	}
	public void run() {
		try {
			while(true) {
				Thread.sleep(1000l);
				System.out.println("消费元素："+linkedTransferQueue.take());
			}
		} catch (Exception e) {
			System.out.println("消费者在等待新产品的时候发生异常！");
			e.printStackTrace();
		}
		System.out.println("消费者终止了消费过程！");
	}
}
```

生产者没有阻塞会很快：

把生产者的put改成transfer再次查看：

```java
class Producer implements Runnable {
    private  LinkedTransferQueue<Integer> linkedTransferQueue;
    private static int element = 0;
    public Producer(LinkedTransferQueue<Integer> linkedTransferQueue) {
        this.linkedTransferQueue = linkedTransferQueue;
    }
    public void run() {
        try {
            while(element < 20) {
                System.out.println("生产元素："+element);
                linkedTransferQueue.transfer(element++);
            }
        } catch (Exception e) {
            System.out.println("生产者在等待空闲空间的时候发生异常！");
            e.printStackTrace();
        }
        System.out.println("生产者终止了生产过程！");
    }
}
```

看到生产 和 消费变成 交替出现了
