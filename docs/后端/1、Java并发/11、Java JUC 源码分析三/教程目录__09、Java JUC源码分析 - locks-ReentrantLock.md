# 09、Java JUC源码分析 - locks-ReentrantLock
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/9.html
- 分类：Java并发
- 分组：教程目录
ReentrantLock可重入锁，使用比synchronized方便灵活，可作为替代使用：

**1、** 支持公平/不公平锁；

**2、** 支持响应超时，响应中断；

**3、** 支持condition；

ReentrantLock实现了Lock接口，内部使用static类继承AQS实现独占式的api来实现这些功能，使用AQS的state来表示锁可重入次数：

之前学习AQS的时候说过请求和release的大的流程：

acquire：

if(!tryacquire())

加入AQS的等待队列

release:

if(tryrelease)

unpark等待队列的节点

先看下内部类的实现：

```java
<span style="font-size:18px;">abstract static class Sync extends AbstractQueuedSynchronizer {
    private static final long serialVersionUID = -5179523762034025860L;
    /**
     * Performs {@link Lock#lock}. The main reason for subclassing
     * is to allow fast path for nonfair version.
     */
    abstract void lock();
    /**
			非公平锁的acquire
     */
    final boolean nonfairTryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        //判断state是否被占用
        if (c == 0) {
        //没有被占用，直接cas占用，成功的话就设置当前线程为占用线程
            if (compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        //如果state不为0,因为是可重入锁，需要判断是不是自己占用的，如果是累加state值
        else if (current == getExclusiveOwnerThread()) {
            int nextc = c + acquires;
            if (nextc < 0) // overflow
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        //acquire失败，AQS等待队列排队
        return false;
    }
		//release的时候也需要判断是不是当前线程。因为可重入，所以可以lock多次，release的时候就要release多次
    protected final boolean tryRelease(int releases) {
        int c = getState() - releases;
        if (Thread.currentThread() != getExclusiveOwnerThread())
            throw new IllegalMonitorStateException();
        boolean free = false;
        if (c == 0) {
            free = true;
            setExclusiveOwnerThread(null);
        }
        setState(c);
        return free;
    }
		/**AbstractOwnableSynchronizer.exclusiveOwnerThread 判断是否为当前占用lock的线程*/
    protected final boolean isHeldExclusively() {
        // While we must in general read state before owner,
        // we don't need to do so to check if current thread is owner
        return getExclusiveOwnerThread() == Thread.currentThread();
    }
		/**lock.newCondition每次直接new一个AQS的conditionObject维护一个条件队列*/
    final ConditionObject newCondition() {
        return new ConditionObject();
    }
    // Methods relayed from outer class
    final Thread getOwner() {
        return getState() == 0 ? null : getExclusiveOwnerThread();
    }
    final int getHoldCount() {
        return isHeldExclusively() ? getState() : 0;
    }
    final boolean isLocked() {
        return getState() != 0;
    }
    /**
     * Reconstitutes this lock instance from a stream.
     * @param s the stream
     */
    private void readObject(java.io.ObjectInputStream s)
        throws java.io.IOException, ClassNotFoundException {
        s.defaultReadObject();
        setState(0); // reset to unlocked state
    }
}</span>
```

内部类实现了AQS独占api的tryRelease，看下公平和非公平锁的tryAcquire实现：

```java
static final class NonfairSync extends Sync {
    private static final long serialVersionUID = 7316153563782823691L;
    /**非公平锁进来就cas，成功就设置独占线程，不成功再去Acquire排队，这就是公平不公平的区分*/
    final void lock() {
        if (compareAndSetState(0, 1))
            setExclusiveOwnerThread(Thread.currentThread());
        else
            acquire(1);
    }
		/**直接使用父类中notFairAcquire*/
    protected final boolean tryAcquire(int acquires) {
        return nonfairTryAcquire(acquires);
    }
}
static final class FairSync extends Sync {
    private static final long serialVersionUID = -3000897897090466540L;
    final void lock() {
        acquire(1);
    }
		/**公平锁的tryAcquire*/
    protected final boolean tryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        if (c == 0) {
        		//锁还在并且AQS没有其他等待节点，cas设置，然后再设置独占线程
            if (!hasQueuedPredecessors() &&
                compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        else if (current == getExclusiveOwnerThread()) {
        //因为是可重入锁，state不为0看是不是自己占用了，如果是更新state值
            int nextc = c + acquires;
            if (nextc < 0)
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        return false;
    }
}
//判断队列没有其他等待节点
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

看下ReentrantLock对lock接口的实现和构造方法：

```java
ublic ReentrantLock() {
    sync = new NonfairSync();
}
public ReentrantLock(boolean fair) {
    sync = fair ? new FairSync() : new NonfairSync();
}
public void lock() {
    sync.lock();
}
public void lockInterruptibly() throws InterruptedException {
    sync.acquireInterruptibly(1);
}
public boolean tryLock() {
    return sync.nonfairTryAcquire(1);
}
public boolean tryLock(long timeout, TimeUnit unit)
        throws InterruptedException {
    return sync.tryAcquireNanos(1, unit.toNanos(timeout));
}
public void unlock() {
    sync.release(1);
}
public Condition newCondition() {
    return sync.newCondition();
}
```

默认是非公平锁，也可以传入参数明确要求采用公平还是非公平锁。对接口实现基本上都是调用AQS的东西。

基本来看出来ReetrantLock的公平和非公平的区分就是在Acquire的时候，非公平会先直接尝试cas修改，不成功再去排队，就是插队，而公平锁就是老老实实请求排队操作。

ReetrantLock还有其他一些监控方法，如isLocked等，没什么东西。
