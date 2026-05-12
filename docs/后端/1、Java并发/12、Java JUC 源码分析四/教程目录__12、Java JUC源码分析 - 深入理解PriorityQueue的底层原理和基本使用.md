# 12、Java JUC源码分析 - 深入理解PriorityQueue的底层原理和基本使用
- 来源：https://ddkk.com/zhuanlan/java/concurrency/12/12.html
- 分类：Java并发
- 分组：教程目录
## 一，深入理解PriorityQueue的底层原理

前面讲解了关于数组和链表的方式实现阻塞队列，但是在实际开发中，这两种队列并不能满足全部的需求，如在某些场景下需要会员优先，vip优先等活动，如购物场景中、或者一些办理业务的逻辑中。

为了更好的支持这种优先级排队的情况，在现有的数据结构中，**PriorityQueue** 选择的是采用二叉堆的方式来实现，相对于数组实现的阻塞队列，PriorityQueue支持数组的扩容，因此这个PriorityQueue又是一个无界的阻塞队列，总而言之就是：**优先级实现的阻塞队列，可以在出队的时候，优先级最高的可以先出，优先级依次排序**

### 1，PriorityQueue的基本使用

在了解一个PriorityQueue的底层原理之前，来先了解一下这个队列的基本使用。假设一个需求，就是会有一个文件类，接下来要将文件的大小加入到阻塞队列，在输出时文件小的先输出

首先先定义一个文件的实体类 **FileData**，里面的属性相对比较简单，够用就行

```java
/**
 * 文件信息
 * @Author: zhenghuisheng
 * @Date: 2023/10/12 6:22
 */
@Data
public class FileData implements Serializable {
    private Integer id;
    //文件名称
    private String fileName;
    //文件大小
    private Integer fileSize;
}
```

随后创建一个生产者的线程任务类**Producer**，用于将文件加入到阻塞队列中阻塞，并且排好队

```java
/**
 * 生产者线程
 * @Author: zhenghuisheng
 * @Date: 2023/10/12 6:22
 */
@Data
public class Producer implements Runnable {
    //全局的阻塞队列
    private PriorityBlockingQueue<FileData> priorityBlockingQueue;
    //需要添加的文件
    private FileData fileData;
    public Producer(PriorityBlockingQueue queue,FileData fileData){
        this.priorityBlockingQueue = queue;
        this.fileData = fileData;
    }
    //添加文件
    @Override
    public void run() {
        try {
            //加入阻塞队列
            priorityBlockingQueue.put(fileData);
            System.out.println("文件" + fileData.getFileName() + "加入完毕");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

随后创建一个消费者的线程任务类**Consumer**，用于将文件从阻塞队列中取出

```java
/**
 * 消费者线程
 * @Author: zhenghuisheng
 * @Date: 2023/10/8 20:21
 */
@Data
public class Consumer implements Runnable {
    private PriorityBlockingQueue<FileData> queue;
    public Consumer(PriorityBlockingQueue priorityBlockingQueue){
        this.queue = priorityBlockingQueue;
    }
    @Override
    public void run() {
        //消费者消费
        try {
            System.out.println(queue.take());
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

随后创建一个线程池的工具类，用于定义线程池中的各个参数

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

由于在这个PriorityBlockingQueue中默认是直接比较元素的值的，而这里的元素是文件实体，因此需要自定义一个实现了Comparator的类，并重写一个compare的比较方法，从而实现文件大小的比较

```java
/**
 * @Author: zhenghuisheng
 * @Date: 2023/10/12 6:43
 */
public class ComparatorFileSize implements Comparator {
    @Override
    public int compare(Object o1, Object o2) {
        FileData firstFileData = (FileData)o1;
        FileData endFileData = (FileData)o2;
        return firstFileData.getFileSize()-endFileData.getFileSize();
    }
}
```

最后来一个带有Main方法的主线程类，用于测试

```java
/**
 * @Author: zhenghuisheng
 * @Date: 2023/10/12 6:29
 */
public class PriorityBlockingQueueDemo {
    //创建一个线程池
    static ThreadPoolExecutor pool = ThreadPoolUtil.getThreadPool();
    //Comparator比较器类的具体实现，加入二叉堆时需要的比较器
    static ComparatorFileSize comparatorFileSize = new ComparatorFileSize();
    //创建一个全局阻塞队列
    private static PriorityBlockingQueue queue = new PriorityBlockingQueue(16,comparatorFileSize);
    public static void main(String[] args) throws Exception {
        //生产者任务
        for (int i = 0; i < 10; i++) {
            //创建文件类
            FileData fileData = new FileData();
            fileData.setId(i);
            fileData.setFileSize(10000 + new Random().nextInt(10000));
            fileData.setFileName("文件" + i);
            //创建生产者任务
            Producer producer = new Producer(queue, fileData);
            //任务加入线程池
            pool.execute(producer);
        }
        Thread.sleep(1000);
        //消费者消费
        for (int i = 0; i < 10 ; i++) {
            Consumer consumer = new Consumer(queue);
            pool.execute(consumer);
        }
//        Thread.sleep(10000);
//        System.exit(0);
    }
}
```

在输出时就可以发现已经满足了一个堆的结构了

### 2，priorityBlockingQueue的底层源码

根据前面这么多篇JUC的源码分析以及基本使用，相信本人分析源码的方式各位已经习惯了，就是先学会怎么使用，随后看底层源码，先看这个类的基本属性和构造方法，随后再看对应的put方法的逻辑和take方法的逻辑

#### 2.1，priorityBlockingQueue类的属性

首先是先看这一步，该类依旧是继承了一个抽象类，并且BlockingQueue的一个具体实现

```java
public class PriorityBlockingQueue<E> extends AbstractQueue<E> implements BlockingQueue<E>
```

接下来继续看内部的属性，根据其大概得属性就能知道很多东西，看下面两个东西，不难猜出这个也是和数组实现的方式一样，采用的是一把互斥锁来实现，并且在出队时需要判断是否为空，如果为空则要将这个线程加入到条件队列中，由于PriorityBlockingQueue是无界的，因此在加入队列时是不需要考虑是否为满的情况，因此这个时使用**ReentrantLock+一个条件队列** 实现AQS的

```java
private final ReentrantLock lock;		//互斥锁
private final Condition notEmpty;		//出对判断队列是否为空，空则阻塞
```

还有就是优先级实现的阻塞队列底层是通过数组的方式实现的，数组初始的默认容量为11，最大容量为整型最大值减8

```java
private transient Object[] queue;	//数组的方式实现队列
private transient int size;			//容量大小
private static final int DEFAULT_INITIAL_CAPACITY = 11;		//数组的默认容量为11
private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;	//最大容量
```

最后再看看这个优先级队列的构造方法，内部就是对上面的这些属性进行复赋值的操作

```java
public PriorityBlockingQueue(int initialCapacity,Comparator<? super E> comparator) {
    if (initialCapacity < 1) throw new IllegalArgumentException();
    this.lock = new ReentrantLock();	//初始化互斥锁
    this.notEmpty = lock.newCondition();	//初始化条件队列
    this.comparator = comparator;	//比较器
    this.queue = new Object[initialCapacity];	//初始化容量
}
```

#### 2.2，priorityBlockingQueue入队操作

在上面的案例中使用的是put方法，put方法中又是通过offer方法实现具体的入队操作的，因此直接来看这个offer方法。主要分为扩容，数组入队，入队时排序，唤醒因为队列为空而加入到条件队列的结点，解锁

```java
public boolean offer(E e) {
    if (e == null)	throw new NullPointerException();
    final ReentrantLock lock = this.lock;	//获取到这把互斥锁
    lock.lock();	//加锁
    int n, cap;	
    Object[] array;	
    //如果此时数组的长度大于等于原先设置的长度，则会进行扩容操作
    while ((n = size) >= (cap = (array = queue).length))
        tryGrow(array, cap);
    try {
        Comparator<? super E> cmp = comparator;
        if (cmp == null)
            siftUpComparable(n, e, array);
        else
            siftUpUsingComparator(n, e, array, cmp);
        size = n + 1;
        notEmpty.signal();
    } finally {
        lock.unlock();
    }
    return true;
}
```

##### 2.2.1，数组扩容操作

接下来查看一下这个**tryGrow** 的扩容操作时如何实现的，首先会有一个释放锁的操作，但是在后文又有一个加锁操作，因此也解决了并发的阻塞问题。

**重点还是看这个扩容操作，假设此时的容量小于64，则扩大原来的容量+2，如果大于64，则扩大原来的容量一倍，就是说假设此时容量为16，那么第一次扩容就是 16+16+2为34，第二次扩容为34 + 34 + 2为70，第三次扩容为70 + 70*2 = 210。** 最后创建一个新的数组，将旧值复制到新的数组，将新数组返回

```java
private void tryGrow(Object[] array, int oldCap) {
    lock.unlock(); // must release and then re-acquire main lock
    Object[] newArray = null;
    if (allocationSpinLock == 0 &&
        UNSAFE.compareAndSwapInt(this, allocationSpinLockOffset,
                                 0, 1)) {
        try {
            //重点还是看这里
            int newCap = oldCap + ((oldCap < 64) ?
                                   (oldCap + 2) : // grow faster if small
                                   (oldCap >> 1));
            //数组超过最大值抛异常
            if (newCap - MAX_ARRAY_SIZE > 0) {
         // possible overflow
                int minCap = oldCap + 1;
                if (minCap < 0 || minCap > MAX_ARRAY_SIZE)
                    throw new OutOfMemoryError();
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
        queue = newArray;	//获取新数组
        System.arraycopy(array, 0, newArray, 0, oldCap);	//将原值copy到新数组
    }
}
```

##### 2.2.2，数组的入队并排序(重点)

接下里重点进入这个入队的方法，首先先看这个默认的 **siftUpComparable** 方法。从下面可以看出该队列时通过**小顶堆** 的方式实现的，就是通过一个while循环+一个赋值的方式实现

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

在入队之后，数组的size+1，并且最后会唤醒因为数组为空而被加入到条件队列的线程

```java
notEmpty.signal();
```

最后会通过unlock方法，唤醒同步队列中的线程结点数据

```java
lock.unlock();
```

#### 2.3，priorityBlockingQueue出队操作

在出队操作中，依旧是通过这个take方法来进行分析，其源码如下，内部主要是出队的操作，如果队列为空，则直接调用这个await进行阻塞，并加入条件队列中

```java
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    E result;
    try {
        //出队操作
        while ( (result = dequeue()) == null)
            notEmpty.await();	//阻塞，加入条件队列
    } finally {
        lock.unlock();
    }
    return result;
}
```

随后继续查看这个 **dequeue()** 方法，就是获取当前队列，先获取第一个堆顶元素和最后一个元素，将最后一个元素值清空

```java
private E dequeue() {
    int n = size - 1;	
    if (n < 0) return null; //如果初始值为空则小于0
    else {
        Object[] array = queue;	//获取当前队列
        E result = (E) array[0];	//获取第一个数据
        E x = (E) array[n];	//获取最后一个数据
        array[n] = null;	//清除最后一个数据
        Comparator<? super E> cmp = comparator;	//获取比较构造器
        if (cmp == null)
            siftDownComparable(0, x, array, n); //出队操作
        else
            siftDownUsingComparator(0, x, array, n, cmp);
        size = n;
        return result;
    }
}
```

##### 2.3.1，数组出队并重新排序

随后真正的调用这个出队的方法 **siftDownComparable** ，其具体实现如下。首先第一步是头结点出队，然后将尾结点作为头结点；其次是递归的比较当前结点的左结点和右结点谁小，谁小则和当前结点比较，如果比当前结点还小则继续交换，直到当前结点没有子结点

```java
private static <T> void siftDownComparable(int k, T x, Object[] array,int n) {
    if (n > 0) {
        //x是最后一个数据
        Comparable<? super T> key = (Comparable<? super T>)x;
        int half = n >>> 1;           // 二分
        while (k < half) {
     		//判断当前结点
            int child = (k << 1) + 1; // 获取当前结点的左结点
            Object c = array[child];	
            int right = child + 1;	//获取当前结点的右结点
            if (right < n &&	//左节点右结点比较和交换
                ((Comparable<? super T>) c).compareTo((T) array[right]) > 0)
                c = array[child = right];	//谁小谁和头结点交换
            if (key.compareTo((T) c) <= 0)
                break;
            array[k] = c;	
            k = child;
        }
        array[k] = key;
    }
}
```

这样就成功的实现了小顶堆的出队操作了，在最后会调用这个unlock()方法进行解锁，并唤醒同步队列中线程结点

```java
lock.unlock();
```

### 3，总结

优先级的阻塞队列依旧是采用ReentrantLock+条件队列的方式实现，底层采用二叉堆的数据结构，从而实现有序的数组形式。该阻塞队列为无界队列，并且内部有对应的扩容机制，在一些需要优先级的场景中，可以采用这种实现方式。
