# 13、Java JUC源码分析 - 深入理解DelayQueue延迟队列的底层原理
- 来源：https://ddkk.com/zhuanlan/java/concurrency/12/13.html
- 分类：Java并发
- 分组：教程目录
## 一，深入理解DelayQueue延迟队列

延时队列，顾名思义，就是可以实现在一段时间之后在执行这个任务。在分布式场景下可能会更加的选择使用MQ来完成这些操作，但是在单JVM进程中，或者在mq挂了的兜底方案中，会考虑使用这个DelayQueue来完成这个延时任务的。如一些订单超时未支付，任务超时管理，短信异步通知等情况，就可以使用这个延时队列来完成了。

在了解这个DelayQueue延迟队列之前，需要先熟悉上一篇PriorityQueue的基本使用和底层原理，因为这个延迟队列的底层的数据结构，就是通过这个优先级队列来实现的

```java
class DelayQueue<E extends Delayed> extends AbstractQueue<E> implements BlockingQueue<E>{
    //组合了一个优先级队列
    private final PriorityQueue<E> q = new PriorityQueue<E>();
}
```

由于这个优先级队列采用的是二叉堆的数据结构，并且采用的是小顶堆的数据结构，因此很容易猜出这个DelayQueue的底层原理了，就是假设5个延时任务，会将最近到期的这个任务排在阻塞队列的前面，因此在出队的时候，就可以保证先过期的先出队。

由于底层是通过这个PriorityQueue的优先级队列实现的，因此这个DelayQueue也是一个无界的阻塞队列，在使用这个延迟队列时，需要实现一个**Delayed** 的接口。总而言之就是：**不保证先进先出，下一个即将过期的任务会排到队列的最前面**

### 1，DelayQueue的基本使用

由于在实际开发中，会有这种订单超时的场景，因此这里主要是模拟一个订单的超时任务，来体验一下这个DelayQueue的基本使用

首先创建一个实现了Delayed接口的OrderDelay订单延时类，Delayed也是Comparable类的一个具体实现

```java
/**
 * Delayed的具体的方法实现
 * @Author: zhenghuisheng
 * @Date: 2023/10/14 0:32
 */
@Data
public class OrderDelay implements Delayed {
    //需要延迟的时间
    private long delayTime;
    //订单id
    private Integer orderId;
    //商品名称
    private String productName;
    //构造方法
    public OrderDelay(long delayTime,Integer orderId,String productName){
        //需要延迟的 时间 + 当前系统的时间
        this.delayTime = delayTime + System.currentTimeMillis();
        this.orderId = orderId;
        this.productName = productName;
    }
    //获取剩余的延时时间
    @Override
    public long getDelay(TimeUnit unit) {
        //到达时间 - 剩余时间
        long residueTime = this.delayTime - System.currentTimeMillis();
        return unit.convert(residueTime,TimeUnit.MILLISECONDS);
    }
	//实现这个比较器方法
    @Override
    public int compareTo(Delayed o) {
        OrderDelay orderDelay = (OrderDelay)o;
        return orderDelay.delayTime > this.delayTime ? - 1 : 1;
    }
}
```

随后创建一个生产者Producer线程任务类，用于将为支付的订单加入到这个延时队列中

```java
@Data
public class Producer implements Runnable {
    //全局的阻塞队列
    private DelayQueue queue;
    //延迟队列订单类对象
    private  OrderDelay orderDelay;
    public Producer(DelayQueue queue,OrderDelay orderDelay){
        this.queue = queue;
        this.orderDelay = orderDelay;
    }
    //添加文件
    @Override
    public void run() {
        try {
            queue.put(orderDelay);	//加入阻塞队列
            System.out.println(orderDelay.getProductName() + "加入完毕...");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

随后创建一个消费者Consumer线程任务类，用于取出即将过期的订单任务

```java
/**
 * 消费者线程
 * @Author: zhenghuisheng
 * @Date: 2023/10/8 20:21
 */
@Data
public class Consumer implements Runnable {
    private DelayQueue queue;
    public Consumer(DelayQueue delayQueue){
        this.queue = delayQueue;
    }
    @Override
    public void run() {
        try {
            System.out.println(queue.take());
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

然后再创建一个线程池的工具类，用于更好的监控和管理线程

```java
/**
 * 线程池工具
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @date : 2023/3/22
 */
public class ThreadPoolUtil {
    /**
     * io密集型：最大核心线程数为2N,可以给cpu更好的轮换，
     *           核心线程数不超过2N即可，可以适当留点空间
     * cpu密集型：最大核心线程数为N或者N+1，N可以充分利用cpu资源，N加1是为了防止缺页造成cpu空闲，
     *           核心线程数不超过N+1即可
     * 使用线程池的时机：1,单个任务处理时间比较短 2,需要处理的任务数量很大
     */
    public static synchronized ThreadPoolExecutor getThreadPool() {
        if (pool == null) {
            //获取当前机器的cpu
            int cpuNum = Runtime.getRuntime().availableProcessors();
            log.info("当前机器的cpu的个数为：" + cpuNum);
            int maximumPoolSize = cpuNum * 2 ;
            pool = new ThreadPoolExecutor(
                    maximumPoolSize - 2,
                    maximumPoolSize,
                    5L,   //5s
                    TimeUnit.SECONDS,
                    new LinkedBlockingQueue<>(),  //数组有界队列
                    Executors.defaultThreadFactory(), //默认的线程工厂
                    new ThreadPoolExecutor.AbortPolicy());  //直接抛异常，默认异常
        }
        return pool;
    }
}
```

最后创建一个有Main方法的测试类，用于对这个DelayQueue进行测试

```java
/**
 * @Author: zhenghuisheng
 * @Date: 2023/10/14 1:41
 */
public class DelayQueueDemo {
    //创建一个线程池
    static ThreadPoolExecutor pool = ThreadPoolUtil.getThreadPool();
    //创建一个全局的延迟队列
    static DelayQueue<OrderDelay> delayQueue = new DelayQueue();
    public static void main(String[] args) throws Exception {
        //生产者创建任务
        for (int i = 7; i > 2; i--) {
            OrderDelay orderDelay = new OrderDelay(i * 1000, i, "id_" + i);
            //创建生产者线程
            Producer producerTask = new Producer(delayQueue, orderDelay);
            //提交到线程池
            pool.execute(producerTask);
        }
        Thread.sleep(50);
        System.out.println("====生产者线程创建完毕====");
        //创建消费者线程
        for (int i = 0; i < 5; i++) {
            Consumer consumerTask = new Consumer(delayQueue);
            pool.execute(consumerTask);
        }
    }
}
```

最后看执行结果，先进来但是延迟时间长，所以后出去

> id_7加入完毕…
>
> id_5加入完毕…
>
> id_6加入完毕…
>
> id_4加入完毕…
>
> id_3加入完毕…
>
> 生产者线程创建完毕
>
> OrderDelay(delayTime=1697221724133, orderId=3, productName=id_3)
>
> OrderDelay(delayTime=1697221725133, orderId=4, productName=id_4)
>
> OrderDelay(delayTime=1697221726132, orderId=5, productName=id_5)
>
> OrderDelay(delayTime=1697221727132, orderId=6, productName=id_6)
>
> OrderDelay(delayTime=1697221728129, orderId=7, productName=id_7)

### 2，DelayQueue的底层源码分析

#### 2.1，DelayQueue类属性

首先查看这个 **DelayQueue** 类，也是继承了这个抽象类，也是实现了这个BlockingQueue

```java
class DelayQueue<E extends Delayed> extends AbstractQueue<E> implements BlockingQueue<E>
```

在这个类中首先最重要的就是这个PriorityQueue优先级队列，说明这个延迟队列的底层是通过这个优先级队列实现的

```java
//组合了一个优先级队列
private final PriorityQueue<E> q = new PriorityQueue<E>();
```

随后就是一把互斥锁加一个条件队列组成，互斥锁就是offer方法和take方法的互斥，然后这个条件队列是在队列为空时存储这个线程结点的

```java
private final transient ReentrantLock lock = new ReentrantLock();
private final Condition available = lock.newCondition();
```

还有一个重要的属性，就是一个leader的线程标记，用对记录队头的线程，谁最早过期就记录谁

```java
private Thread leader = null;
```

最后来看看该类的构造方法，里面是空的，因为里面的offer和take主要是操作这个PriorityQueue类

```java
public DelayQueue() {
     }
```

#### 2.2，入队offer方法

接下来直接看这个类的offer方法的具体实现，这下面的逻辑是比较简单的，就是先入队，如果是第一个元素入队，那么回去唤醒条件队列中被阻塞的结点，因为这些结点是队列为空而将线程阻塞的，现在队列已经不为空了

```java
public boolean offer(E e) {
    final ReentrantLock lock = this.lock;	//获取这把互斥锁
    lock.lock();		//加锁
    try {
        q.offer(e);		//线程入队
        if (q.peek() == e) {
     	//如果堆顶为当前元素，表示第一个元素入队
            leader = null;
            available.signal();	//那么就会去唤醒因对列为空而被阻塞的线程结点
        }
        return true;
    } finally {
        lock.unlock();	//解锁
    }
}
```

随后依旧是进入上面的offer方法，做一个具体的入队操作，这里需要结合PriorityQueue的属性来看，首先会判断这个数组是否达到设置的最大值或者扩容后的最大值，如果是，则继续扩容

```java
public boolean offer(E e) {
    if (e == null)	throw new NullPointerException(); 	//结点为空
    modCount++;	
    int i = size;
    if (i >= queue.length)	//达到最大值
        grow(i + 1);	//扩容
    size = i + 1;		
    if (i == 0) queue[0] = e;	//队列为空则直接加入堆顶
    else	siftUp(i, e);	//否则上浮，堆算法
    return true;
}
```

数组扩容的方法如下，先做一个扩容操作，并且最后创建一个新数组，将旧值copy到新数组中，随后将新数组返回假设此时的容量小于64，则扩大原来的容量+2，如果大于64，则扩大原来的容量一倍。

**就是说假设此时容量为16，那么第一次扩容就是 16+16+2为34，第二次扩容为34 + 34 + 2为70，第三次扩容为70 + 70*2 = 210**。

```java
private void grow(int minCapacity) {
    int oldCapacity = queue.length;
    // Double size if small; else grow by 50%
    int newCapacity = oldCapacity + ((oldCapacity < 64) ?
                                     (oldCapacity + 2) :
                                     (oldCapacity >> 1));
    // overflow-conscious code
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    queue = Arrays.copyOf(queue, newCapacity);
}
```

如果此时不是第一个结点入队，那么就会调用这个 **siftUp** 方法，如果有自定义实现的比较器，则用自定义的，否则则直接使用内部默认的比较器

```java
private void siftUp(int k, E x) {
    if (comparator != null)
        siftUpUsingComparator(k, x);
    else
        siftUpComparable(k, x);
}
```

接着直接来看内部默认实现的这个上浮的方法吧，就是一个小顶堆的入队操作

```java
private static <T> void siftUpComparable(int k, T x, Object[] array) {
    Comparable<? super T> key = (Comparable<? super T>) x;	//创建一个比较构造器
    while (k > 0) {
     	//队列的元素值
        int parent = (k - 1) >>> 1;	//获取当前结点的父节点的索引，左移一位即可
        Object e = array[parent];	//根据索引下标取值
        if (key.compareTo((T) e) >= 0)	//比较和交换，如果当前值大于父节点则不动
            break;
        array[k] = e;	//如果当前结点的值小于父结点，则将当前结点改成父结点的值(默认使用的是小顶堆)
        k = parent;		//k在这个while循环下一定会等于0，因此会走最下面的赋值，就是不断地通过while循环将最小的交换到最上面
    }
    array[k] = key;	//如果队列的长度为0，则直接将堆顶元素赋值
}
```

在成功入队之后，最后会调用这个unlock方法，用于解锁，并且唤醒被阻塞的结点

```java
lock.unlock();
```

#### 2.3，出队take方法

在结点入队之后，那么接下来就看这个结点出队的方法，出队方法相对来说是稍微多一点的。首先出队第一个头结点，如果已经过期则直接出队，否者获取这个即将过期的时间延迟阻塞，即阻塞到到一定的时间主动唤醒，最后执行这个任务，会在这个for自旋中，可以保证所有的结点出队。并且通过一个临时变量 **leader**，只需获取最早过期的结点进行阻塞，从而不需关心比该结点更晚过期的结点，从而减少阻塞的数量。

```java
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    try {
        for (;;) {
     	//自旋
            E first = q.peek();	//头结点出队
            if (first == null)	//如果队列为空
                available.await();	//则加入条件队列阻塞
            else {
                //获取头结点的过期时间
                long delay = first.getDelay(NANOSECONDS);	
                //头结点的过期时间小于0，说明已经过期。则直接出队
                if (delay <= 0)	return q.poll();
                first = null; // don't retain ref while waiting
                //特别说明，这个leader就是用于记录最早过期的那个线程
                if (leader != null)	//如果已经存在记录的最近过期的结点
                    available.await();	//则阻塞
                else {
                    Thread thisThread = Thread.currentThread();
                    leader = thisThread;
                    try {
                        //延时阻塞，阻塞到一定时间主动唤醒
                        available.awaitNanos(delay);
                    } finally {
                        if (leader == thisThread)
                            leader = null;
                    }
                }
            }
        }
    } finally {
        if (leader == null && q.peek() != null)	
            available.signal();		//优化，主动唤醒
        lock.unlock();	//解锁
    }
}
```

最后会通过unlock进行一个解锁操作。

```java
lock.unlock();
```

### 3，总结

延迟队列的底层是通过这个优先级队列来实现的，越早过期的结点越先出队，内部也是采用ReentrantLock+条件队列来实现安全问题以及性能问题。延迟队列的结构也是无界队列形成的数组，在入队的结点元素需要时Delayed类的具体实现。
