# 20、Java JUC 源码分析 - 独占锁ReentrantLock源码分析----抽丝剥茧
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/20.html
- 分类：Java并发
- 分组：教程目录
注意：本博客为连载，如果没有看之前的博客，这一节理解起来可能会有点吃力。

## 1、ReentrantLock初探

看过我之前博客的，肯定对可重入的独占锁ReentrantLock有一定的了解了吧。可重入我就不解释了，前面的博客里面有一节锁的概述，里面讲的应该很清楚了。这里我就只讲讲独占锁，独占锁，顾名思义就是只允许一个线程占有该锁，其他获取该锁的线程会被阻塞而被放入该锁的AQS队列里面。接下来，我们先来看看ReentrantLock的类图，以便对于他有一个很好的理解：

从上面的类图我们可以看出，ReentrantLock其实还是使用AQS来实现的，并且，根据参数来决定内部是一个公平锁，还是一个非公平锁。如果没有传递参数，那么内部默认为非公平锁。(来看看原代码就很容易理解了)

```java
//无参构造器，默认非公平锁
public ReentrantLock() {
    sync = new NonfairSync();
}
//传递true，为公平锁实现，传递false，为非公平锁实现
public ReentrantLock(boolean fair) {
    sync = fair ? new FairSync() : new NonfairSync();
}
```

通过类图我们可以看出来，ReentrantLock内部维护了一个Sync锁，Sync是AQS的具体实现的子类，Sync还有两个子类，分别为NonfairLock和FairLock，非公平锁和公平锁。

在这里AQS的state状态值表示的是重入的次数，在默认的情况下，state的值为0表示当前没有线程占用该锁，当一个线程第一次获取该锁的时候，那么state的值会cas为1，如果cas失败，就进入AQS阻塞队列。如果这个线程获得锁成功了，且在释放锁之前，又一次尝试获取这把锁，那么这回state的值又会加1变成2.在释放锁的时候，每一次state都只-1。

## 2、具体实现的方法

### 2.1 void lock()方法

当一个线程调用了ReentrantLock的lock方法，其实就是想获取独占锁。如果这把锁当前没有被其他线程占用，并且线程之前也没有获取过这把锁，那么当前线程就会获取到这把锁，然后设置当前锁的拥有者为该线程，并设置AQS的state为1，然后直接返回。如果当前线程之前已经获取过这把锁了，那么再次获取只需要把AQS的state+1即可，然后返回。如果获取失败，也就是这把锁被其他线程占用了，那么该线程就会进入AQS阻塞队列了。

```java
public void lock() {
    sync.lock();
}
```

如上代码，如果我们调用ReentrantLock的lock方法，执行的其实是内部的Sync的lock方法。Sync的lock方法具体实现是根据传递的参数来的，也就是看使用者选择的是FairSync还是NonfairSync。那么我们就看看这两个类的lock方法吧

```java
static final class NonfairSync extends Sync {
    private static final long serialVersionUID = 7316153563782823691L;
    final void lock() {
        //CAS设置state的值为1
        if (compareAndSetState(0, 1))
            //设置锁的所有者为当前线程
            setExclusiveOwnerThread(Thread.currentThread());
        else
            //获取锁失败，也就是将当前线程丢到AQS阻塞队列里面
            acquire(1);
    }
    protected final boolean tryAcquire(int acquires) {
        return nonfairTryAcquire(acquires);
    }
}
```

如上代码，因为默认AQS的状态值为0，所以第一个调用Lock的线程会通过CAS设置状态值为1，CAS成功则代表线程获取到了锁，那么就设置锁的所有者为当前线程。失败了，就调用AQS的acquire方法，并传递参数1。下面我们来简单的看看acquire的核心代码：

```java
public final void acquire(int arg) {
    //调用ReentranLock重写的tryAcquire方法
    if (!tryAcquire(arg) &&
        //因为锁被占用，上面的方法返回false，整体返回true
        //然后就会执行到这一步，将当前线程假如AQS阻塞队列
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

之前我们说过，tryAcquire方法，AQS并没有给出具体的实现，而是需要子类自己实现。那么我们来看看非公平锁的tryAcquire的具体实现

```java
 protected final boolean tryAcquire(int acquires) {
     return nonfairTryAcquire(acquires);
 }
final boolean nonfairTryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    //拿到state
    int c = getState();
    //如果state为0，说明锁没有线程占用
    if (c == 0) {
        //执行CAS修改state，
        if (compareAndSetState(0, acquires)) {
            //设置锁的所有者为当前线程
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    //当前线程为锁的拥有者，说明重入了
    else if (current == getExclusiveOwnerThread()) {
        //acquires传入的是1
        int nextc = c + acquires;
        if (nextc < 0) // overflow 如果nextc<0说明可重复的次数溢出
            throw new Error("Maximum lock count exceeded");
        //设置state的值，也就是在原来的基础上+1
        setState(nextc);
        return true;
    }
    return false;
}
```

对于上面的方法，注释里应该已经把每一步解释清楚了。

介绍完了非公平锁的实现代码，回过头来看看非公平是在哪里实现的呢。首先非公平是说尝试获取锁的线程并不一定比后尝试获取锁的线程优先获取到锁。我们来想一想。

假设线程A调用了lock（）方法时执行到nonfairTryAcquire方法，发现他的状态state不为0，然而他也不是锁的持有者，这个时候就会返回false，然后当前线程老老实实进入AQS的阻塞队列。这个时候线程B也调用了lock（）方法，也同样执行到nonfairTryAcquire方法，发现状态state为0（假设其他线程释放了锁），所以就通过CAS获得了锁。

但是我们思考一下，明明是A线程先来的，却变成了B线程先获得这把锁，这就是不公平啊。线程B在获得锁之前，并没有查看当前AQS队列里面是否有比自己更早请求该锁的线程，而是直接抢夺，真是野蛮。

那么我们来看看公平锁是怎样的实现的呢？因为再讲非公平锁的时候，讲了他的流程，公平锁的流程大同小异，所以我们直接来看他的tryAcquire方法吧：

```java
 static final class FairSync extends Sync {
        private static final long serialVersionUID = -3000897897090466540L;
        final void lock() {
            acquire(1);
        }
        /**
         * Fair version of tryAcquire.  Don't grant access unless
         * recursive call or no waiters or is first.
         */
        protected final boolean tryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            //先获得state
            int c = getState();
            //如果state为0，说明锁没有线程占用
            if (c == 0) {
                //先去查看一下AQS阻塞队列里面有没有比当前线程，早获取锁的线程
                //而所谓的公平就体现在这个方法
                if (!hasQueuedPredecessors() &&
                    compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;
                if (nextc < 0)
                    throw new Error("Maximum lock count exceeded");
                setState(nextc);
                return true;
            }
            return false;
        }
    }
```

如上代码所示：公平锁的tryAcquire方法与非公平锁最大的区别，就在于在CASstate之前加入了一个hasQueuedPredecessors方法，该方法就是实现公平的核心代码：

```java
public final boolean hasQueuedPredecessors() {
    // The correctness of this depends on head being initialized
    // before tail and on head.next being accurate if the current
    // thread is first in queue.
    Node t = tail; // Read fields in reverse initialization order
    Node h = head;
    Node s;
    return h != t &&
        ((s = h.next) == null || s.thread != Thread.currentThread());
}
```

其实我们主要看最后return的语句：如上代码，如果当前线程节点有前驱节点则返回true，否则如果当前AQS阻塞队列为空或者当前线程节点是AQS的第一个节点则返回false。其中如果ht,则说明当前队列为空，直接返回false；如果h!=t并且snull则说明有一个元素将要作为AQS的第一个节点入队列（回顾前面的内容，enq函数的第一个元素入队列是2步操作：首先创建一个哨兵头结点，然后将第一个元素插入到哨兵节点后面），那么返回true。如果h!=t并且s!=null和s.thread!=Thread.currentThread()则说明队列里面的一个元素不是当前线程，那么返回true。

### 2.2 void lockTnterruptibly()方法

该方法与lock方法类似，不过他做了对中断的响应，就是当前线程调用该方法时，如果其他线程调用了当前线程的interrupt（）方法，则当前线程会抛出InterruptedException异常，然后返回。

```java
public void lockInterruptibly() throws InterruptedException {
    sync.acquireInterruptibly(1);
}
public final void acquireInterruptibly(int arg)
    throws InterruptedException {
    //如果当前线程被中断了，直接抛出异常
    if (Thread.interrupted())
        throw new InterruptedException();
    if (!tryAcquire(arg))
        doAcquireInterruptibly(arg);
}
```

### 2.3 boolean tryLock(long timeout , TimeUnit unit)方法

这个方法tryLock不同之处就在于，它设置了超时时间如果超时时间到了没有获取到该锁，那么就返回false。避免过度自旋带来的资源浪费

```java
public boolean tryLock(long timeout, TimeUnit unit)
    throws InterruptedException {
    return sync.tryAcquireNanos(1, unit.toNanos(timeout));
}
```

## 3、释放锁

### 3.1 void unlock()方法

当一个线程调用unlock方法，会尝试释放锁。如果当前线程持有该锁，则调用该方法会让该线程对线程持有的AQS状态值-1，如果减去1后当前状态值为0，则当前线程会释放该锁，否则就仅仅只是减去1而已。如果当前线程没有持有该锁而调用了unlock方法，就会抛出IllegalMonitorStateException异常，代码如下：

```java
public void unlock() {
    sync.release(1);
}
public final boolean release(int arg) {
    if (tryRelease(arg)) {
        Node h = head;
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);
        return true;
    }
    return false;
}
protected final boolean tryRelease(int releases) {
    //这里传递的releases是1，所以这里通常-1得到c
    int c = getState() - releases;
    //判断当前线程是否为锁的拥有者
    if (Thread.currentThread() != getExclusiveOwnerThread())
        //不是，则抛出异常
        throw new IllegalMonitorStateException();
    boolean free = false;
    //当c为0是才释放锁
    //也就是把锁的拥有者变为空
    if (c == 0) {
        free = true;
        setExclusiveOwnerThread(null);
    }
    //然后把c的值设置给state
    setState(c);
    return free;
}
```

## 4、案例介绍

下面我就用ReentrantLock来实现一个简单的线程安全的ArrayList：

```java
public class ReentrantArrayList {
    //用线程不安全的ArrayList当做底层容器
    private ArrayList<String> list = new ArrayList<String>();
    //独占锁(非公平锁)
    private ReentrantLock lock = new ReentrantLock();
    //添加元素
    public boolean add(String e){
        lock.lock();
        try{
            list.add(e);
            return true;
        }catch (Exception ex){
            return false;
        } finally {
            lock.unlock();
        }
    }
    //获得元素
    public String get(int index){
        lock.lock();
        try{
            return list.get(index);
        }finally {
            lock.unlock();
        }
    }
    //删除元素
    public boolean remove(String e){
        lock.lock();
        try{
            list.remove(e);
            return true;
        }catch (Exception ex){
            return false;
        } finally {
            lock.unlock();
        }
    }
}
```
