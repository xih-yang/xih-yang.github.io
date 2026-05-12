# 21、Java JUC 源码分析 - ReentrantReadWriteLock看这一篇就够了
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/21.html
- 分类：Java并发
- 分组：教程目录
上一篇博客我们介绍了ReentrantLock，其实如果单纯解决线程安全问题ReentrantLock就足够用了，但是ReentrantLock是独占锁，也就是说一次只能有一个线程获取到该锁，但是实际中会有写少读多的情况发生。我们知道，读取数据如果同时只能一个线程读取，那么会严重影响效率，显然我们的ReentrantLock满足不了这个需求，所以ReentrantReadWriteLock读写锁应运而生。它采用读写分离的策略，允许多个线程同时获取读锁。

## 1、初探ReentrantReadWriteLock

要想了解ReentrantReadWriteLock内部原理，我们先来看看他的类图吧：

我们可以看到ReentrantReadWriteLock内部维护了两把锁，ReadLock和WriteLock，他们都依赖Sync去实现具体的功能。Sync继承自AQS，并且也提供了公平与非公平的实现，在上一篇博客中我们介绍了公平与非公平的区别，及源码分析。这里就不做过多的赘述了。我这里就直接介绍非公平下的读写锁的实现。

我们知道AQS中只维护了state这个变量，且继承的子类需要根据具体用处，来给它定义。那么一个state如何用来表示读锁和写锁呢？ReentrantReadWriteLock巧妙地把state的高16位表示读状态，也就是获取读锁的次数，用state的低16位表示获取到写锁的可重入次数。我们可以简单来看一下Sync里面维护的变量的代码：

```java
static final int SHARED_SHIFT   = 16;
//共享锁的单位值1左移16位=65536
static final int SHARED_UNIT    = (1 << SHARED_SHIFT);
//共享锁的线程的最大数：1左移16位-1 = 65535
static final int MAX_COUNT      = (1 << SHARED_SHIFT) - 1;
//写锁掩码，二进制，15个1
static final int EXCLUSIVE_MASK = (1 << SHARED_SHIFT) - 1;
/** Returns the number of shared holds represented in count  */
//返回读锁的线程数
static int sharedCount(int c)    {
      return c >>> SHARED_SHIFT; }
/** Returns the number of exclusive holds represented in count  */
//返回写锁的重入次数
static int exclusiveCount(int c) {
      return c & EXCLUSIVE_MASK; }
/**
 *用来记录除去第一个获取到读锁的线程外的其他线程的重入次数
 */
private transient ThreadLocalHoldCounter readHolds;
/**
 *用来记录最后一个获取到读锁的线程的重入次数
 */
private transient HoldCounter cachedHoldCounter;
/**
 *用来记录第一个获取到读锁的线程
 */
private transient Thread firstReader = null;
/**
 *用来记录第一个获取到读锁的线程的重入次数
 */
private transient int firstReaderHoldCount;
```

读到这里，你肯定一堆疑惑，不要紧，你接着往下看：

## 2、写锁的获取与释放

### 2.1、void lock()

ReentrantReadWriteLock实现写锁是通过WriteLock来实现的。WriteLock写锁是一个独占锁也是一个可重入锁，也就是说同时只能有一个线程占有该锁。如果当前没有线程获取读锁和写锁，那么当前线程请求后可以直接获得（因为我们这里用的是非公平的方式）。如果当前有线程占用读锁和写锁，那么请求写锁的线程就会被阻塞挂起。如果当前线程已经获得了写锁，那么它还可以再次获取。话不多说，我们来看看他的源码：

```java
public void lock() {
    sync.acquire(1);
}
public final void acquire(int arg) {
    //尝试获取锁，失败后执行后面的代码
    if (!tryAcquire(arg) &&
        //获取锁失败，将当前线程变为Node.EXCLUSIVE的节点，加入AQS阻塞队列
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        //将自己阻塞挂起
        selfInterrupt();
}
```

那么我们接着看看tryLockAcquire的代码：

```java
 protected final boolean tryAcquire(int acquires) {
     //获得当前线程
     Thread current = Thread.currentThread();
     //获取AQS的state
     int c = getState();
     //写锁的重入次数
     int w = exclusiveCount(c);
     //c!=0说明读锁或者写锁已经被获取了
     if (c != 0) {
         // w=0说明已经有线程获取了读锁，但是没获取写锁
         //w!=0并且线程也不是这个锁的拥有者，直接返回false，获取写锁失败
         if (w == 0 || current != getExclusiveOwnerThread())
             return false;
         //执行到这里，说明当前线程获取了写锁，然后判断一下重入的次数有没有越界
         if (w + exclusiveCount(acquires) > MAX_COUNT)
             throw new Error("Maximum lock count exceeded");
         // 重新设置state的值
         setState(c + acquires);
         return true;
     }
     //执行到这里，说明读锁或者写锁没被获取了
     //所以这是，第一个获取写锁的线程
     if (writerShouldBlock() ||
         !compareAndSetState(c, c + acquires))
         return false;
     //设置写锁的拥有者
     setExclusiveOwnerThread(current);
     return true;
 }
```

对于上面的代码，基本流程注释都写的很详细了，我这里只说一下writerShouldBlock，在各个方法其实就是用来区别公平锁和非公平锁的。非公平锁的实现方式：

```java
final boolean writerShouldBlock() {
    return false; // writers can always barge
}
```

就是直接返回false，也就是直接进行下面的CAS操作，并设置状态state，和锁的拥有者。也就是不管先来后到，只要到了这里就拿锁就完事了。

而公平锁的处理方式就像下面这样：

```java
final boolean writerShouldBlock() {
    return hasQueuedPredecessors();
}
```

它会先查看一下，AQS阻塞队列里面有没有比当前线程先来的线程。如果有，那么当前线程就会放弃争夺。直接返回false。

### 2.2、void lockInterruptibly()

类似于lock方法，他与lock方法的不同就在于，他对中断作出了响应。，当其他线程调用该线程的interrupt方法中断当前线程，那么当前线程会抛出InterruptedException异常。

```java
public void lockInterruptibly() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
```

### 2.3、boolean tryLock()

尝试获取写锁，如果当前没有其他线程占用读锁或者写锁，那么当前线程尝试获取锁就会成功，返回true。如果当前锁被其他线程占用，那么执行该方法会直接返回false，且不会阻塞线程，如果当前线程已经持有了写锁，那么增加AQS的状态值，并返回true。

```java
 public boolean tryLock( ) {
     return sync.tryWriteLock();
 }
final boolean tryWriteLock() {
    Thread current = Thread.currentThread();
    int c = getState();
    if (c != 0) {
        int w = exclusiveCount(c);
        if (w == 0 || current != getExclusiveOwnerThread())
            return false;
        if (w == MAX_COUNT)
            throw new Error("Maximum lock count exceeded");
    }
    if (!compareAndSetState(c, c + 1))
        return false;
    setExclusiveOwnerThread(current);
    return true;
}
```

上面的tryWriteLock方法和tryAcquire类似，这里我就不做多的赘述了。

### 2.4、boolean tryLock(long timeout , TimeUnit unit)

这个方法的不同之处就在于他设置了一个超时时间，如果尝试获取写锁失败则会把当前线程挂起指定时间，待超时以后就会激活该线程，如果还是没有获取到锁，那么就会返回false。另外，这个方法还对中断做了响应。

```java
public boolean tryLock(long timeout, TimeUnit unit)
    throws InterruptedException {
    return sync.tryAcquireNanos(1, unit.toNanos(timeout));
}
```

### 2.5、void unlock()

这个方法为释放锁，如果当前线程持有该锁，调用该方法会把AQS的状态值减1，减去1后为0，那么就释放该锁，否则就仅仅减1，特别要注意，我们一定要获取锁，才能释放锁。如果没有获得锁就释放，那么就会抛出IllegalMonitorStateException异常。我们一起看看源码吧：

```java
public void unlock() {
    sync.release(1);
}
public final boolean release(int arg) {
    //尝试释放锁
    if (tryRelease(arg)) {
        //释放成功，则激活阻塞队列里面的队头线程
        Node h = head;
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);
        return true;
    }
    return false;
}
 protected final boolean tryRelease(int releases) {
     //判断释放锁的线程，是否应有这把锁，如果没有锁就抛出异常
     if (!isHeldExclusively())
         throw new IllegalMonitorStateException();
     //状态值-1
     int nextc = getState() - releases;
     //判断重入的次数是否为0
     boolean free = exclusiveCount(nextc) == 0;
     //重入次数为0，就把写锁的所有者设置为null
     if (free)
         setExclusiveOwnerThread(null);
     //把新的状态值设置回AQS
     setState(nextc);
     return free;
 }
```

## 3、读锁的获取与释放

ReentrantReadWriteLock实现读锁是通过ReadLock来实现的。读锁是一个共享锁，也就是允许多个线程去读取，也是一个可重入锁。

### 3.1、 void lock()

当一个线程获取读锁时，如果当前没有其他线程持有读锁和写锁，则当前线程可以获取读锁，然后AQS的state的高16位的值就会加1，然后方法返回。但是如果其他线程持有写锁，注意是写锁，那么当前线程就会被阻塞。因为有线程持有写锁，说明他正在修改数据，你这个时候去读到的数据必然会产生不一致性。

接下来我们就来看看读锁的lock的源码：

```java
public void lock() {
    sync.acquireShared(1);
}
public final void acquireShared(int arg) {
    if (tryAcquireShared(arg) < 0)
        doAcquireShared(arg);
}
protected final int tryAcquireShared(int unused) {
    //获得当前线程
    Thread current = Thread.currentThread();
    //获得AQS的state值
    int c = getState();
    //如果写锁的重入次数不为0，写锁的拥有者不为当前线程，则返回-1
    //也就是写锁被其他线程占用了
    if (exclusiveCount(c) != 0 &&
        getExclusiveOwnerThread() != current)
        return -1;
    //获得读锁的计数，也就是有多少个线程拥有写锁
    int r = sharedCount(c);
    //和上面说的writeShouldBlock（）方法大同小异，
    //不同的实现，会得到公平锁和非公平锁
    //整个判断为尝试获取锁，多个线程只有一个会成功，不成功的进入fullTryAcquireShared自旋
    if (!readerShouldBlock() &&
        //判断当前线程有没有超过最大数
        r < MAX_COUNT &&
        //上面都通过了，当前线程拿到写锁，并执行CAS修改c
        compareAndSetState(c, c + SHARED_UNIT)) {
        //如果r为0，说明他是第一个获取读锁的线程
        if (r == 0) {
            //设置相关属性
            firstReader = current;
            firstReaderHoldCount = 1;
         //否则就判断一下当前线程和第一个线程是否为同一个线程
        } else if (firstReader == current) {
            //相等，重入次数加一
            firstReaderHoldCount++;
        } else {
            //获得最后一个获取读锁的线程的重入次数
            HoldCounter rh = cachedHoldCounter;
            if (rh == null || rh.tid != getThreadId(current))
                cachedHoldCounter = rh = readHolds.get();
            //或者记录其他线程可重入的次数
            else if (rh.count == 0)
                readHolds.set(rh);
            rh.count++;
        }
        return 1;
    }
    //类似于TtryAcquireShared方法，但是是自旋获取锁
    return fullTryAcquireShared(current);
}
```

那么我们接下来看看fullTryAcquireShared这个方法吧：

```java
final int fullTryAcquireShared(Thread current) {
    HoldCounter rh = null;
    //自旋
    for (;;) {
        int c = getState();
        if (exclusiveCount(c) != 0) {
            if (getExclusiveOwnerThread() != current)
                return -1;
            // else we hold the exclusive lock; blocking here
            // would cause deadlock.
        } else if (readerShouldBlock()) {
            // Make sure we're not acquiring read lock reentrantly
            if (firstReader == current) {
                // assert firstReaderHoldCount > 0;
            } else {
                if (rh == null) {
                    rh = cachedHoldCounter;
                    if (rh == null || rh.tid != getThreadId(current)) {
                        rh = readHolds.get();
                        if (rh.count == 0)
                            readHolds.remove();
                    }
                }
                if (rh.count == 0)
                    return -1;
            }
        }
        if (sharedCount(c) == MAX_COUNT)
            throw new Error("Maximum lock count exceeded");
        if (compareAndSetState(c, c + SHARED_UNIT)) {
            if (sharedCount(c) == 0) {
                firstReader = current;
                firstReaderHoldCount = 1;
            } else if (firstReader == current) {
                firstReaderHoldCount++;
            } else {
                if (rh == null)
                    rh = cachedHoldCounter;
                if (rh == null || rh.tid != getThreadId(current))
                    rh = readHolds.get();
                else if (rh.count == 0)
                    readHolds.set(rh);
                rh.count++;
                cachedHoldCounter = rh; // cache for release
            }
            return 1;
        }
    }
}
```

你会发现，其实和上面的真的大同小异，只是多了一个自旋而已。

接下来，我们直接来看释放锁吧

### 3.2、void unlock()

我们找到他的释放锁的代码：

```java
public void unlock() {
    sync.releaseShared(1);
}
```

我们发现他的释放锁的方法，其实是委托给Sync的releaseShared方法来实现的。

那么我们来看看releaseShared的代码：

```java
public final boolean releaseShared(int arg) {
    //尝试释放锁，成功返回true，失败返回false
    if (tryReleaseShared(arg)) {
        doReleaseShared();
        return true;
    }
    return false;
}
 protected final boolean tryReleaseShared(int unused) {
     //获取当前线程
     Thread current = Thread.currentThread();
     //判断当前线程是不是第一个获得读锁的线程
     if (firstReader == current) {
         //如果是，判断他的重入次数是否为1
         if (firstReaderHoldCount == 1)
             //如果为1，就释放第一次获取到的锁的线程
             firstReader = null;
         else
             //不是，则重入次数-1
             firstReaderHoldCount--;
     } else {
         //不是第一个获得锁的线程
         //获得最后一个获得锁的线程的重入次数
         HoldCounter rh = cachedHoldCounter;
         //判断当前线程是否为最后一个获得锁的线程
         if (rh == null || rh.tid != getThreadId(current))
             //不是，则拿当前线程的重入次数
             rh = readHolds.get();
         int count = rh.count;
         //如果重入次数小于=1
         if (count <= 1) {
             //释放
             readHolds.remove();
             //如果小于等于0，那么抛出异常
             if (count <= 0)
                 throw unmatchedUnlockException();
         }
         //将重入次数-1
         --rh.count;
     }
     //自旋进行CAS，CAS成功则返回true，释放成功
     for (;;) {
         int c = getState();
         int nextc = c - SHARED_UNIT;
         if (compareAndSetState(c, nextc))
             return nextc == 0;
     }
 }
```

## 4、案例介绍

上一篇博客介绍了ReentrantLock实现线程安全的ArrayList，但是ReentrantLock是独占锁，所以在读多写少的情况下，他的效率非常低下。那么下面我来使用ReentrantReadWriteLock来实现。读取list的元素使用读锁，增加删除操作使用写锁。

```java
public class ReadWriteArrayList {
    //用线程不安全的ArrayList当做底层容器
    private ArrayList<String> list = new ArrayList<String>();
    //创建读写锁
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    //获得读锁
    private final Lock read = lock.readLock();
    //获得写锁
    private final Lock write = lock.writeLock();
    //添加元素
    public boolean add(String e){
        write.lock();
        try{
            list.add(e);
            return true;
        }catch (Exception ex){
            return false;
        } finally {
            write.unlock();
        }
    }
    //获得元素
    public String get(int index){
        read.lock();
        try{
            return list.get(index);
        }finally {
            read.unlock();
        }
    }
    //删除元素
    public boolean remove(String e){
        write.lock();
        try{
            list.remove(e);
            return true;
        }catch (Exception ex){
            return false;
        } finally {
            write.unlock();
        }
    }
}
```
