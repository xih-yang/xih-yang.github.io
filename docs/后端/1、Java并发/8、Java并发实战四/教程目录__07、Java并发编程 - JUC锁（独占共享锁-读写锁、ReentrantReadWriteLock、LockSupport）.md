# 07、Java并发编程 - JUC锁（独占共享锁/读写锁、ReentrantReadWriteLock、LockSupport）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/7.html
- 分类：Java并发
- 分组：教程目录
## 一、读写锁/独占/共享

**读锁**是**共享的**，**写锁**是**独占的**。 `juc.ReentrantLock` 和 `synchronized` 都是**独占锁**，独占锁就是**⼀个锁**只能被**⼀个线程**所持有。有的时候，需要**读写分离**，那么就要引⼊读写锁，即 `juc.ReentrantReadWriteLock` 。

- 独占锁：指该锁⼀次只能被⼀个线程所持有。对ReentrantLock和Synchronized⽽⾔都是独占锁
- 共享锁：指该锁可被多个线程所持有
- 对ReenntrantReadWriteLock其读锁是共享锁，其写锁是独占锁。
- 读锁的共享锁可保证并发读是⾮常⾼效的，读写、写读、写写的过程是互斥的。

⽐如缓存，就需要读写锁来控制。缓存就是⼀个键值对，以下Demo模拟了缓存的读写操作，读的 get⽅法使⽤了 ReentrantReadWriteLock.ReadLock() ，写的 put ⽅法使⽤了ReentrantReadWriteLock.WriteLock() 。这样避免了写被打断，实现了多个线程同时读。

```java
/**
 * 多个线程同时读一个资源类没有任何问题，所以为了满足并发量，读取共享资源应该可以同时进行。
 * 但是，如果有一个线程想去写共享资料来，就不应该再有其他线程可以对该资源进行读或写
 * 小总结：
 * 		读-读 能共存
 * 		读-写 不能共存
 * 		写-写 不能共存
 */
//共享资源 Word
class MyCache{
    //缓存更新快，需要volatile关键字修饰，保证可见性，不保证原子性，一个线程修改后，通知其他线程
    private volatile Map<String, Object> map = new HashMap<>();
    //读写锁
    ReentrantReadWriteLock rwlock = new ReentrantReadWriteLock();
    //存(写操作)
    public void put(String key, Object value){
        rwlock.writeLock().lock();
        try{
            System.out.println(Thread.currentThread().getName()+"\t 正在写入：" + key);
            //模拟下耗时
            try {
	            TimeUnit.SECONDS.sleep(1); 
            } catch (InterruptedException e) {
	            e.printStackTrace(); 
            }
            map.put(key, value);
            System.out.println(Thread.currentThread().getName() +"\t 写入完成");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            rwlock.writeLock().unlock();
        }
    }
    //取
    public Object get(String key){
        Object result = null;
        rwlock.readLock().lock();
        try{
            System.out.println(Thread.currentThread().getName()+"\t 正在读取：" + key);
            //模拟下耗时
            try {
	            TimeUnit.SECONDS.sleep(1); 
            } catch (InterruptedException e) {
	            e.printStackTrace(); 
            }
            result = map.get(key);
            System.out.println(Thread.currentThread().getName() +"\t 读取完成");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            rwlock.readLock().unlock();
        }
        return result;
    }
}
public class ReadWriteLockDemo {
    public static void main(String[] args) {
        MyCache cache = new MyCache();
        //写
        for (int i = 1; i <= 5; i++) {
            final int tempInt = i;
            new Thread(()->{
                cache.put(tempInt+"", tempInt+"");
            }, String.valueOf(i)).start();
        }
        //读
        for (int i = 1; i <= 5; i++) {
            final int tempInt=i;
            new Thread(()->{
                cache.get(tempInt+"");
            }, String.valueOf(i)).start();
        }
    }
}
```

虽然没有演示出读写交替的效果，但是从结果来看，也能看出读写互斥、写写互斥，而读读可以共享：

`通常读写锁建议使用公平锁模式`，ReentrantReadWriteLock非公平模式下，想要获取写锁就变得比较困难了，因为读锁是不互斥的，这个时候大量的读操来读取数据，这个时候就会造成那一条申请写锁的线程会一直被阻塞，这就造成了写线程的饥饿，或者插入其他线程写锁，而无法获得写锁。

时间原因没有详细分析读写锁源码，关于源码可以参考博客：

[ReentrantReadWriteLock读写锁详解](https://www.cnblogs.com/xiaoxi/p/9140541.html)

[ReentrantReadWriteLock](https://blog.csdn.net/chenyixin121738/article/details/109713246)

## 二、LockSupport

JUC中的锁底层让线程阻塞实际上都是调用的LockSupport的park方法。并且JUC中大部分的功能锁，包括后面讲的同步器工具类，底层实现都是 AQS + LockSupport 。

## 2.1 API介绍

LockSupport类，是JUC包中的一个工具类，定义了一组静态方法，提供最基本的线程阻塞和唤醒功能，是构建同步组件的基础工具，用来创建锁和其他同步类的`基本线程阻塞原语`。

LockSupport类的核心方法其实就两个：park() 和 unpark()，其中 park() 方法用来阻塞线程，unpark()方法用于唤醒指定线程。

和Object类的wait() 和 signal() 方法有些类似，但是LockSupport的这两种方法从语意上讲比Object类的方法更清晰，而且可以针对指定线程进行阻塞和唤醒。

LockSupport类使用了一种名为Permit（许可）的概念来做到阻塞和唤醒线程的功能，可以把许可看成是一种(0,1)信号量（Semaphore），但与 Semaphore 不同的是，许可的累加上限是1。

初始时，permit为0，当调用 unpark() 方法时，线程的permit加1，当调用 park()方法时，如果permit为0，则调用线程进入阻塞状态。

**最核心三个方法：**

- getBlocker(Thread t)：返回提供给最近一次调用的尚未解除阻塞的park方法的阻塞器对象，如果未被阻塞，则为null。
- park() / park(Object blocker)：为线程调度目的禁用当前线程，除非许可可用。
- unpark(Thread thread)：使给定线程的许可可用(如果它还不可用的话)。

## 2.2 LockSupport的特点（很重要）

从官方的API描述中可以归纳出LockSupport如下几个特点：

- 调用park方法阻塞中的线程可以被线程中断唤醒（但是不会抛异常），或超时唤醒，或执行unpark唤醒
- 调用park(Object blocker)方法阻塞线程的时候，可以传入blocker对象来描述阻塞的原因，再通过getBlocker(Thread t)方法可以获取阻塞的原因，这个对一些监控程序来说很有用
- park() 和 unpark()没有顺序关系，不像wait() 和 signal()
- 如果在wait()之前执行了notify()会抛出IllegalMonitorStateException异常；
- 如果在park()之前执行了unpark()，线程不会被阻塞，直接跳过park()，继续执行后续内容；

> 具体效果和原因可以参考：阻塞和唤醒线程——LockSupport功能简介及原理浅析

park()使线程阻塞后并不会释放锁资源

## 2.3 源码简析

LockSupport底层调用的是UNSAFE类，直接操作硬件实现线程阻塞，是基本线程阻塞原语

本地方法再往下追就是C语言了。

## 2.4 案例演示

假设现在需要实现一种FIFO类型的独占锁，可以把这种锁看成是ReentrantLock的公平锁简单版本，且是不可重入的，就是说当一个线程获得锁后，其他等待线程以FIFO的调度方式等待获取锁。

```java
class FIFOMutex  {
    private final AtomicBoolean locked = new AtomicBoolean(false);//锁状态
    private final Queue<Thread> waiters = new ConcurrentLinkedQueue<>();//线程等待队列
    public void lock(){
        Thread current = Thread.currentThread();
        waiters.add(current);
        // 如果当前线程不在队首，或锁已被占用，则当前线程阻塞
        // 这个判断的内在意图：锁必须由队首元素拿到，实现公平
        while (waiters.peek() != current || !locked.compareAndSet(false,true)){
            LockSupport.park();
        }
        //执行到这代表当前线程锁获取成功
        waiters.remove();// 删除队首元素
    }
    public void unlock(){
        locked.set(false);
        LockSupport.unpark(waiters.peek());//唤醒队首等待线程
    }
}
public class TestFIFOMutex {
    public static void main(String[] args) throws InterruptedException {
        FIFOMutex mutex = new FIFOMutex();
        MyThread a1 = new MyThread("a", mutex);
        MyThread a2 = new MyThread("b", mutex);
        MyThread a3 = new MyThread("c", mutex);
        MyThread a4 = new MyThread("e", mutex);
        MyThread a5 = new MyThread("f", mutex);
        MyThread a6 = new MyThread("g", mutex);
        a1.start();
        a2.start();
        a3.start();
        a4.start();
        a5.start();
        a6.start();
        a1.join();
        a2.join();
        a3.join();
        a4.join();
        a5.join();
        a6.join();
        System.out.println("Finished");
    }
}
class MyThread extends Thread{
    private String name;
    private FIFOMutex mutex;
    private static int count;
    public MyThread(String name, FIFOMutex mutex) {
        this.name = name;
        this.mutex = mutex;
    }
    @Override
    public void run() {
        for (int i = 0; i < 20; i++) {
            mutex.lock();
            count++;
            System.out.println("thread:"+Thread.currentThread().getName()+" name:" + name + " count:" + count);
            mutex.unlock();
        }
    }
}
```

上述FIFOMutex类的实现中，当判断锁已被占用时，会调用 LockSupport.park(this) 方法，将当前调用线程阻塞；当使用完锁时，会调用 LockSupport.unpark(waiters.peek()) 方法将等待队列中的队首线程唤醒。

通过LockSupport的这两个方法，可以很方便的阻塞和唤醒线程。但是LockSupport的使用过程中还需要注意以下几点：

- 方法的调用一般要放在一个循环判断体里面。

- park 方法是会响应中断的，但是不会抛出异常。（也就是说如果当前调用线程被中断，则会立即返回但不会抛出中断异常）
- park 的重载方法 park(Object blocker)，会传入一个blocker对象，所谓Blocker对象，其实就是当前线程调用时所在调用对象（如上述示例中的FIFOMutex对象）。该对象一般供监视、诊断工具确定线程受阻塞的原因时使用。

## 2.5 与wait和notify区别

- 阻塞时不会释放锁
- park和unpark没有顺序要求
- park方法可以指定一个blocker，而getBlocker方法可以获取这个blocker，这个blocker可以用来记录阻塞原因、状态等信息为监控、诊断工具使用

更多其他内容可参考：

[Java多线程进阶（五）—— J.U.C之locks框架：LockSupport](https://segmentfault.com/a/1190000015562456)

[面试 LockSupport.park()会释放锁资源吗？](https://zhuanlan.zhihu.com/p/89389678)
