# 03、Java多线程：线程状态及线程池
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/13.html
- 分类：Java并发
- 分组：Java 多线程 (C)
## 线程状态

java.lang.Thread.State枚举类描述了线程的6种状态，一个线程在某个时间点上只有一种状态。

```java
public enum State {
    NEW,
    RUNNABLE,
    BLOCKED,
    WAITING,
    TIMED_WAITING,
    TERMINATED;
}
```

## 线程状态转换图

## 新建(New)

创建后尚未启动，new Thread();

## 可运行(Runnable)

t.start()开启线程后，线程会进入Runnable状态,线程可能正在Java虚拟机中Running，也可能正在等待CPU执行权。

## 阻塞(Blocking)

等待获取一个排它锁，如果其线程释放了锁就会结束此状态。

## 无限期等待(Waiting)

等待其它线程显式地唤醒，否则不会被分配 CPU 时间片。

进入方法
退出方法

没有设置 Timeout 参数的 Object.wait() 方法
Object.notify() / Object.notifyAll()

没有设置 Timeout 参数的 Thread.join() 方法
被调用的线程执行完毕

LockSupport.park() 方法
-

## 限期等待(Timed Waiting)

无需等待其它线程显式地唤醒，在一定时间之后会被系统自动唤醒。 调用 Thread.sleep() 方法使线程进入限期等待状态时，常常用“使一个线程睡眠”进行描述。 调用 Object.wait() 方法使线程进入限期等待或者无限期等待时，常常用“挂起一个线程”进行描述。 睡眠和挂起是用来描述行为，而阻塞和等待用来描述状态。 阻塞和等待的区别在于，阻塞是被动的，它是在等待获取一个排它锁。而等待是主动的，通过调用 Thread.sleep() 和 Object.wait() 等方法进入。

进入方法
退出方法

Thread.sleep() 方法
时间结束

设置了 Timeout 参数的 Object.wait() 方法
时间结束 / Object.notify() / Object.notifyAll()

设置了 Timeout 参数的 Thread.join() 方法
时间结束 / 被调用的线程执行完毕

LockSupport.parkNanos() 方法
-

LockSupport.parkUntil() 方法
-

## 死亡(Terminated)

可以是线程结束任务之后自己结束，或者产生了异常而结束。

## 测试案例：

**1、** Thread.sleep进入计时等待；

```java
public class ThreadStatusTest001 {
    public static void main(String[] args) {
        // 创建线程
        Thread t1 = new Thread(new Runnable() {
            @Override
            public void run() {
                for (int i = 0; i < 10; i++) {
                    System.out.println(Thread.currentThread().getName() + " is running..." + i); // t1
                    try {
                        //  Thread.sleep进入计时等待1秒钟
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });
        t1.start();
        System.out.println(Thread.currentThread().getName() + " is running..."); //main
    }
}
```

**1、** Object.wait进入计时等待，该方法只能在同步方法中调用如果当前线程不是锁的持有者，该方法抛出一个IllegalMonitorStateException异常；

```java
public class ThreadStatusTest002 {
    public static void main(String[] args) {
        Object obj = new Object();
        // 创建线程
        Thread t1 = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (obj) {
                    for (int i = 0; i < 10; i++) {
                        System.out.println(Thread.currentThread().getName() + " is running..." + i); // t1
                        try {
                            //  Object.wait进入计时等待1秒钟
                            obj.wait(1000);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
        });
        t1.start();
        System.out.println(Thread.currentThread().getName() + " is running..."); //main
    }
}
```

**1、** notify()，notifyAll()notify()通知一个在对象上等待的线程，使其从wait()返回，而返回的前提是该线程获取到了对象的锁notifyAll()通知所有等待在该对象上的线程；

```java
public class ThreadStatusTest002 {
    public static void main(String[] args) {
        Object obj = new Object();
        // 创建一个执行线程
        Thread t1 = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (obj) {
                    System.out.println(Thread.currentThread().getName() + " is running..."); // t1
                    try {
                        //  Object.wait进入无限等待
                        obj.wait();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });
        t1.start();
        // 创建一个执行线程 唤醒其他线程
        Thread t2 = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (obj) {
                    System.out.println(Thread.currentThread().getName() + " is running..." ); // t1
                    //
                    obj.notify();
                    // obj.notifyAll();
                }
            }
        });
        t2.start();
        System.out.println(Thread.currentThread().getName() + " is running..."); //main
    }
}
```

## wait()和sleep()的区别

**1、** sleep()方法是属于Thread类中的而wait()方法，则是属于Object类中的，任何类都可以使用；

**2、** sleep()需要捕获异常，wait()不需要；

**3、** 使用范围不同，sleep()方法则可以放在任何地方使用，wait()方法必须放在同步控制方法和同步代码块中使用；

**4、** 对锁的处理机制不同由于sleep()方法的主要作用是让线程暂停执行一段时间，时间一到则自动恢复，不涉及线程间的通信，因此，调用sleep()方法并不会释放锁而wait()方法则不同，当调用wait()方法后，线程会释放掉他所占用的锁，从而使线程所在对象中的其他synchronized数据可以被其他线程使用；

## 线程池

**池化技术 (Pool)** ： 提前保存大量的资源，以备不时之需以及重复使用。池化技术应用广泛，如内存池，线程池，连接池等等。

**线程池（thread pool）** ： 事先创建若干个可执行的线程放入一个池（容器）中，需要的时候从池中获取线程不用自行创建，使用完毕不需要销毁线程而是放回池中，从而减少创建和销毁线程对象的开销。

## 线程池的优点

**1、** 线程复用；

线程的创建和销毁的开销是巨大的，而通过线程池的重用大大减少了这些不必要的开销，当然既然少了这么多消费内存的开销，其线程执行速度也是突飞猛进的提升。
**2、** 控制线程池的并发数；

控制线程池的并发数可以有效的避免大量的线程池争夺CPU资源而造成堵塞。
**3、** 线程池可以对线程进行管理；

线程池可以提供定时、定期、单线程、并发数控制等功能。比如通过ScheduledThreadPool线程池来执行S秒后，每隔N秒执行一次的任务。

## Executor

java.util.concurrent.Executor，大部分线程池的类都实现了此接口，Executor提供了execute()接口来执行已提交的 Runnable 任务的对象，Executor存在的目的是提供一种将"任务提交"与"任务如何运行"分离开来的机制。Runnable任务开辟在新线程中的使用方法为：new Thread(new RunnableTask())).start()，但在Executor中，可以使用Executor而不用显示地创建线程：executor.execute(new RunnableTask());

## Executors

java.util.concurrent.Executors工具类，供线程池相关操作。

### 三大方法

**1、** newSingleThreadExecutor()：创建一个单线程的线程池这个线程池只有一个核心线程在工作，也就是相当于单线程串行执行所有任务如果这个唯一的线程因为异常结束，那么会有一个新的线程来替代它此线程池保证所有任务的执行顺序按照任务的提交顺序执行；

```java
public static ExecutorService newSingleThreadExecutor() {
    return new FinalizableDelegatedExecutorService
        (new ThreadPoolExecutor(1, 1,
                                0L, TimeUnit.MILLISECONDS,
                                new LinkedBlockingQueue<Runnable>()));
}
```

```java
public class ExecutorsTest001 {
    public static void main(String[] args) {
        ExecutorService executorService = Executors.newSingleThreadExecutor();
        try {
            for (int i = 0; i < 10; i++) {
                final int index = i;
                executorService.execute(new Runnable() {
                    @Override
                    public void run() {
                        System.out.println(Thread.currentThread().getName() + "线程正在运行任务");
                        System.out.println("执行次数：" + (index + 1));
                        try {
                            Thread.sleep(1000);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
                });
            }
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            // 关闭线程池
            executorService.shutdown();
        }
    }
}
```

**1、** newCachedThreadPool()：无界线程池，可以进行自动线程回收该线程池比较适合没有固定大小并且比较快速就能完成的小任务，它将为每个任务创建一个线程允许的创建线程数量为Integer.MAX_VALUE，可能会创建大量的线程，从而导致OOM；

```java
    public static ExecutorService newCachedThreadPool() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>());
    }
```

**1、** newFixedThreadPool(int)：所有任务只能使用固定大小的线程，任意时间点，最多只能有固定数目的活动线程存在，此时如果有新的线程要建立，只能放在另外的队列中等待，直到当前的线程中某个线程终止直接被移出池子然后当有一个线程的任务结束之后，将会根据调度策略继续等待执行下一个任务；

```java
    public static ExecutorService newFixedThreadPool(int nThreads, ThreadFactory threadFactory) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>(),
                                      threadFactory);
    }
```

## ThreadPoolExecutor七大参数

三大方法中，实际调用的都是ThreadPoolExecutor（）方法，该方法需要7个参数。

```java
    public ThreadPoolExecutor(int corePoolSize,
                              int maximumPoolSize,
                              long keepAliveTime,
                              TimeUnit unit,
                              BlockingQueue<Runnable> workQueue,
                              ThreadFactory threadFactory,
                              RejectedExecutionHandler handler) {
        if (corePoolSize < 0 ||
            maximumPoolSize <= 0 ||
            maximumPoolSize < corePoolSize ||
            keepAliveTime < 0)
            throw new IllegalArgumentException();
        if (workQueue == null || threadFactory == null || handler == null)
            throw new NullPointerException();
        this.corePoolSize = corePoolSize;
        this.maximumPoolSize = maximumPoolSize;
        this.workQueue = workQueue;
        this.keepAliveTime = unit.toNanos(keepAliveTime);
        this.threadFactory = threadFactory;
        this.handler = handler;
    }
```

**1、** corePoolSize：核心线程数量；

线程池中会维护一个最小的线程数量，即使这些线程处理空闲状态，他们也不会被销毁，除非设置了allowCoreThreadTimeOut。
**2、** maximumPoolSize：最大线程数量；

应该是一个任务被提交到线程池以后，首先会找有没有空闲存活线程，如果有则直接执行，如果没有则会缓存到工作队列中，如果工作队列满了，才会创建一个新线程，然后从工作队列的头部取出一个任务交由新线程来处理，而将刚提交的任务放入工作队列尾部。线程池不会无限制的去创建新线程，它会有一个最大线程数量的限制，这个数量即由maximunPoolSize的数量减去corePoolSize的数量来确定，最多能达到maximunPoolSize即最大线程池线程数量。
**3、** keepAliveTime：空闲线程存活时间；

一个线程如果处于空闲状态，并且当前的线程数量大于corePoolSize，那么在指定时间后，这个空闲线程会被销毁。
**4、** unit：空闲线程存活时间单位；

**5、** workQueue：新任务被提交后，会先进入到此工作队列中，任务调度时再从队列中取出任务；

**6、** threadFactory：线程工厂；

创建一个新线程时使用的工厂，可以用来设定线程名、是否为daemon线程等。
**7、** handler：拒绝策略；

当工作队列中的任务已到达最大限制，并且线程池中的线程数量也达到最大限制，这时如果有新任务提交进来时，jdk中提供了4种拒绝策略

### 线程数量合理设置规则

**1、** CPU密集型（计算密集型）任务；

对于CPU密集型任务，由于CPU密集型任务的性质，导致CPU的使用率很高，如果线程池中的核心线程数量过多，会增加上下文切换的次数，带来额外的开销。因此，一般情况下线程池的核心线程数量等于CPU核心数+1。（注：这里核心线程数不是等于CPU核心数，是因为考虑CPU密集型任务由于某些原因而暂停，此时有额外的线程能确保CPU这个时刻不会浪费。但同时也会增加一个CPU上下文切换，因此核心线程数是等于CPU核心数？还是CPU核心数+1？可以根据实际情况来确定）
**2、** I/O密集型任务；

对于I/O密集型任务，由于I/O密集型任务CPU使用率并不和很高，可以让CPU在等待I/O操作的时去处理别的任务，充分利用CPU。因此，一般情况下线程的核心线程数等于2*CPU核心数。（注：有些公司会考虑所需要的CPU阻塞系数，即核心线程数=CPU核心数/(1-阻塞系数)）
**3、** 混合型任务；

由于包含2种类型的任务，故混合型任务的线程数与线程时间有关。一般情况下：线程池的核心线程数=（线程等待时间/线程CPU时间+1）*CPU核心数；在某种特定的情况下还可以将任务分为I/O密集型任务和CPU密集型任务，分别让不同的线程池去处理，但有一个前提–分开后2种任务的执行时间相差不太大。

### 4种拒绝策略

ThreadPoolExecutor提供了4种拒绝策略

**1、** CallerRunsPolicy；

在调用者线程中直接执行被拒绝任务的run方法，除非线程池已经shutdown，则直接抛弃任务。
**2、** AbortPolicy；

直接丢弃任务，并抛出RejectedExecutionException异常。
**3、** DiscardPolicy；

直接丢弃任务，什么都不做。
**4、** DiscardOldestPolicy；

抛弃进入队列最早的那个任务，然后尝试把这次拒绝的任务放入队列。

### 测试案例

```java
/**
 * Created by TD on 2021/4/12
 * 自定义线程池： 模拟车站卖票
 * 1.活动窗口为CPU核心线程数
 * 2.最大20个窗口同时卖票
 * 3.人数不多时，空间的窗口等待10秒，没人则会休息
 * 4.等待座位10个
 * 5.等待座位满了以后，开启一个Main窗口去卖票
 */
public class ThreadPoolExecutorTest001 {
    public static void main(String[] args) {
        // 卖出的票数
        int tickets = 0;
        // 总人数
        int people = 1000;
        // cpu核心线程数
        int cpuNum = Runtime.getRuntime().availableProcessors();
        System.out.println("当前开启活动窗口:" + cpuNum);
        LinkedBlockingDeque<Runnable> linkedBlockingDeque = new LinkedBlockingDeque<>(10);
        // 创建卖票Executor
        ThreadPoolExecutor executor = new ThreadPoolExecutor(cpuNum,
                20,
                10,
                TimeUnit.SECONDS,
                linkedBlockingDeque,
                Executors.defaultThreadFactory(),
                new ThreadPoolExecutor.CallerRunsPolicy()
        );
        //开启卖票
        try {
            for (int i = 0; i < people; i++) {
                executor.execute(() -> {
                    System.out.println(Thread.currentThread().getName() + "窗口正在卖票");
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            executor.shutdown();
        }
    }
}
```
