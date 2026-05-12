# 13、Java JUC源码分析 - locks-ReentrantReadWriteLock
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/13.html
- 分类：Java并发
- 分组：教程目录
ReentrantReadWriteLock基于AQS实现读写锁的同步：

**1、** 利用共享模式实现读锁，独占模式实现写锁；

**2、** 支持公平和非公平，非公平的情况下可能会出现读锁阻塞写锁的场景；

**3、** 写锁阻塞写锁和读锁，读锁阻塞写锁；

**4、** 写锁可以降级为读锁，读锁不能升级为写锁，只能先release再lock；

**5、** 写锁支持condition条件；

**6、** 读写锁都支持超时/中断lock；

**7、** 适合读多写少的场景；

实现ReadWriteLock接口，用于返回读/写锁：

```java
<span style="font-size:18px;">public interface ReadWriteLock {
    /**
     * Returns the lock used for reading.
     */
    Lock readLock();
    /**
     * Returns the lock used for writing.
     */
    Lock writeLock();
}</span>
```

看下内部类的AQS实现：

```java
<span style="font-size:18px;">abstract static class Sync extends AbstractQueuedSynchronizer {
    private static final long serialVersionUID = 6317671515068378041L;
    /*
	AQS中的int型state字段被拆为2部分，高16位表示共享读锁的持有次数(每个线程的重入次数，由HoldCounter保存)，低16位表示独占写锁的重入次数
     */
    static final int SHARED_SHIFT   = 16; //偏移单位
    static final int SHARED_UNIT    = (1 << SHARED_SHIFT); //00000000 00000001 00000000 00000000 state拆为2部分，所以读锁的持有次数计算都需要这个值做比较
    static final int MAX_COUNT      = (1 << SHARED_SHIFT) - 1; //00000000 00000000 11111111 11111111 读写锁的最大持有次数65535，2的16次方-1
    static final int EXCLUSIVE_MASK = (1 << SHARED_SHIFT) - 1; //00000000 00000000 11111111 11111111
    /** 读锁高16位无符号偏移16位，相当于计算读锁的持有持有次数  */
    static int sharedCount(int c)    { return c >>> SHARED_SHIFT; }
    /** 返回写锁的重入次数，state2种情况：
	如果拥有读锁，肯定大于65535，就用到了高16位，做&操作的话就等于0，可以用state!=0加这个返回值!=0判断拥有读锁
	如果是写锁的话,肯定是小于65535，用到了低16位，做&操作就返回写锁的重入次数*/
    static int exclusiveCount(int c) { return c & EXCLUSIVE_MASK; }
    /** 定义类保存读锁每个线程重入次数 */
    static final class HoldCounter {
        int count = 0;
        // 用id，而不是用thread保存，编译垃圾滞留
        final long tid = Thread.currentThread().getId();
    }
    /** ThreadLocal子类，持有HoldCounter*/
    static final class ThreadLocalHoldCounter
        extends ThreadLocal<HoldCounter> {
        public HoldCounter initialValue() {
            return new HoldCounter();
        }
    }
    /** 读锁的重入次数变量，在内部类Sync构造时初始化，在读锁release的重入减少到1时remove，然后-- */
    private transient ThreadLocalHoldCounter readHolds;
    /** 缓存最后一个成功获取读锁的持有，javadoc解释是，下一个要release的就是最后一个成功获取的，
	也是为了处理优化  */
    private transient HoldCounter cachedHoldCounter;
    /** 为了处理优化，保存第一个进来的线程和重入次数  */
    private transient Thread firstReader = null;
    private transient int firstReaderHoldCount;
    Sync() {		
        readHolds = new ThreadLocalHoldCounter();//读锁的重入次数初始化
        setState(getState()); // cas操作,加内存屏障，保证readHolds的可见性
    }
    /* 读写锁Acquire时候判断是否需要阻塞，公平和不公平实现处理方式不一样 */
    abstract boolean readerShouldBlock();
    abstract boolean writerShouldBlock();
    /* AQS独占api写锁的release */
    protected final boolean tryRelease(int releases) {
		//判断是否当前线程
        if (!isHeldExclusively())
            throw new IllegalMonitorStateException();		
        int nextc = getState() - releases;
		//写锁的重入次数判断
        boolean free = exclusiveCount(nextc) == 0;
        if (free)
            setExclusiveOwnerThread(null); //写锁重入为0时true，设置独占线程null
        setState(nextc);
        return free;
    }
	/* AQS独占api写锁的acquire */
    protected final boolean tryAcquire(int acquires) {
        /*
         * Walkthrough:
         * 1. If read count nonzero or write count nonzero
         *    and owner is a different thread, fail.
		 如果读锁或写锁不为0，且占有线程不是当前线程，false
         * 2. If count would saturate, fail. (This can only
         *    happen if count is already nonzero.)
		 持有次数大于最大65535，false
         * 3. Otherwise, this thread is eligible for lock if
         *    it is either a reentrant acquire or
         *    queue policy allows it. If so, update state
         *    and set owner.
		 否则，如果是重入的或者按照队列策略(应该是可以插队的情况下)容许，那就更新state值设置owner线程
         */
        Thread current = Thread.currentThread();
        int c = getState();
        int w = exclusiveCount(c); //上面说过2种情况：1.返回写锁的重入次数;2.返回0，可用于判断是否有读锁
        if (c != 0) {
			//c!=0 表示锁被占用
            // c!=0 and w==0表示用读锁，这样的话，读锁是阻塞写锁的返回false，挂起
			// c!=0 and w!=0表示有写锁，就判断下是不是重入，不是false，挂起
            if (w == 0 || current != getExclusiveOwnerThread())
                return false;
            if (w + exclusiveCount(acquires) > MAX_COUNT) //判断下是不是达到了最大重入次数
                throw new Error("Maximum lock count exceeded");
            // 到这里的话，那就当前线程重入了，那就设置state值，返回true，Acquire成功
            setState(c + acquires);
            return true;
        }
		//到这里那就是c为0了，需要看看是不是需要挂起(由公平和和非公平子类实现)
		//非公平直接返回false，公平的话就检查hasQueuedPredecessors检查head的next是不是非当前线程
        if (writerShouldBlock() ||
            !compareAndSetState(c, c + acquires))			
            return false; //需要挂起或cas失败，那就挂起吧
        setExclusiveOwnerThread(current);
        return true;
    }
	/*AQS共享api读锁release实现*/
    protected final boolean tryReleaseShared(int unused) {
        Thread current = Thread.currentThread();
        if (firstReader == current) {            
			//判断缓存的重入，如果只有一次，那就直接设置缓存线程null，否则递减
            if (firstReaderHoldCount == 1)
                firstReader = null;
            else
                firstReaderHoldCount--;
        } else {
			//从缓存的读锁重入变量里面取
            HoldCounter rh = cachedHoldCounter;
            if (rh == null || rh.tid != current.getId())
                rh = readHolds.get();
            int count = rh.count;
            if (count <= 1) {				
                readHolds.remove();
                if (count <= 0)
                    throw unmatchedUnlockException();
            }
            --rh.count; //递减重入次数
        }		
        for (;;) { //for循环loop设置读锁的holdCount减少
            int c = getState();
            int nextc = c - SHARED_UNIT;
            if (compareAndSetState(c, nextc))
                // Releasing the read lock has no effect on readers,释放读锁对其他读线程没有什么影响
                // but it may allow waiting writers to proceed if
                // both read and write locks are now free.
				// 如果读锁和写锁都空闲，就可以容许其他写线程处理，
				// 但是如果读多写少的场景下，非公平模式，很可能读释放了，写线程也没机会
                return nextc == 0;
        }
    }
    private IllegalMonitorStateException unmatchedUnlockException() {
        return new IllegalMonitorStateException(
            "attempt to unlock read lock, not locked by current thread");
    }
	/*AQS共享api读锁Acquire实现*/
    protected final int tryAcquireShared(int unused) {
        /*
         * Walkthrough:
         * 1. If write lock held by another thread, fail.
		 如果其他线程获取了写锁，false，也就是写锁阻塞了读锁
         * 2. Otherwise, this thread is eligible for
         *    lock wrt state, so ask if it should block
         *    because of queue policy. If not, try
         *    to grant by CASing state and updating count.
         *    Note that step does not check for reentrant
         *    acquires, which is postponed to full version
         *    to avoid having to check hold count in
         *    the more typical non-reentrant case.
		 否则，当前线程获取了写锁，根据队列策略看是否要阻塞读锁，不阻塞那就setstate，更新读锁重入次数		 
         * 3. If step 2 fails either because thread
         *    apparently not eligible or CAS fails or count
         *    saturated, chain to version with full retry loop.
		 如果第二步失败了那就fullTryAcquireShared
         */
        Thread current = Thread.currentThread();
        int c = getState();
        if (exclusiveCount(c) != 0 &&
            getExclusiveOwnerThread() != current) //有写锁并且不是当前线程，挂起
            return -1;
        int r = sharedCount(c); //读锁的holdCount
        if (!readerShouldBlock() && //公平非公平子类决定读锁是否阻塞
            r < MAX_COUNT && 
            compareAndSetState(c, c + SHARED_UNIT)) //cas设置state，注意updae值加了65535，保证更新的值是高16位
		{
            if (r == 0) {
				//读锁只有一个，直接缓存，不用放到readHolds里面
                firstReader = current;
                firstReaderHoldCount = 1;
            } else if (firstReader == current) {
				//不为0，但是缓存的是当前线程，直接累加
                firstReaderHoldCount++;
            } else {
				//其他情况，那就只能从缓存变量取值更新了
                HoldCounter rh = cachedHoldCounter;
                if (rh == null || rh.tid != current.getId())
                    cachedHoldCounter = rh = readHolds.get();
                else if (rh.count == 0)
                    readHolds.set(rh);
                rh.count++;
            }
            return 1;
        }
		//需要阻塞、读锁持有超过最大、cas失败那就for循环重试
        return fullTryAcquireShared(current);
    }
    /** 完全Acquire判断处理cas失败或者读锁重入  */
    final int fullTryAcquireShared(Thread current) {
        /*
         * This code is in part redundant with that in
         * tryAcquireShared but is simpler overall by not
         * complicating tryAcquireShared with interactions between
         * retries and lazily reading hold counts.
         */
        HoldCounter rh = null;
        for (;;) {
            int c = getState();
            if (exclusiveCount(c) != 0) {
                if (getExclusiveOwnerThread() != current)
					//到这里的话，其他线程持有写锁
                    return -1;
                // else we hold the exclusive lock; blocking here
                // would cause deadlock.
				//否则当前线程持有写锁，阻塞在这里会造成死锁
            } else if (readerShouldBlock()) {
				//写锁空闲，并且读锁需要阻塞
                // Make sure we're not acquiring read lock reentrantly
                if (firstReader == current) {
					//如果是当前线程的话，即使需要队列策略决定需要阻塞也不阻塞，直接后面cas操作
                    // assert firstReaderHoldCount > 0;
                } else {
                    if (rh == null) {
                        rh = cachedHoldCounter;
                        if (rh == null || rh.tid != current.getId()) {
                            rh = readHolds.get();
                            if (rh.count == 0)
                                readHolds.remove();
                        }
                    }
					//需要阻塞且count==0为非重入的话，那就阻塞
                    if (rh.count == 0)
                        return -1;
                }
            }
            if (sharedCount(c) == MAX_COUNT) //读锁持有超过最大
                throw new Error("Maximum lock count exceeded");
			//下面的cas操作跟对应的处理和前面tryAcquireshard里面一样
            if (compareAndSetState(c, c + SHARED_UNIT)) {
                if (sharedCount(c) == 0) {
                    firstReader = current;
                    firstReaderHoldCount = 1;
                } else if (firstReader == current) {
                    firstReaderHoldCount++;
                } else {
                    if (rh == null)
                        rh = cachedHoldCounter;
                    if (rh == null || rh.tid != current.getId())
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
    /** 写锁和tryAcquire相比少调用了writerShouldBlock.导致写锁的插队，不管你公平还是不公平了   */
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
    /** 读锁比fullreaderShouldBlock少判断了readerShouldBlock.也是读锁的插队，不管公平还是不公平模式了   */
    final boolean tryReadLock() {
        Thread current = Thread.currentThread();
        for (;;) {
            int c = getState();
            if (exclusiveCount(c) != 0 &&
                getExclusiveOwnerThread() != current)
                return false;
            int r = sharedCount(c);
            if (r == MAX_COUNT)
                throw new Error("Maximum lock count exceeded");
            if (compareAndSetState(c, c + SHARED_UNIT)) {
                if (r == 0) {
                    firstReader = current;
                    firstReaderHoldCount = 1;
                } else if (firstReader == current) {
                    firstReaderHoldCount++;
                } else {
                    HoldCounter rh = cachedHoldCounter;
                    if (rh == null || rh.tid != current.getId())
                        cachedHoldCounter = rh = readHolds.get();
                    else if (rh.count == 0)
                        readHolds.set(rh);
                    rh.count++;
                }
                return true;
            }
        }
    }
	// 当前线程是否是独占线程
    protected final boolean isHeldExclusively() {
        return getExclusiveOwnerThread() == Thread.currentThread();
    }
	//写锁的condition
    final ConditionObject newCondition() {
        return new ConditionObject();
    }
	// 获取独占线程
    final Thread getOwner() {
        // Must read state before owner to ensure memory consistency
        return ((exclusiveCount(getState()) == 0) ?
                null :
                getExclusiveOwnerThread());
    }
	//获取读锁持有次数
    final int getReadLockCount() {
        return sharedCount(getState());
    }
	//是否写锁持有
    final boolean isWriteLocked() {
        return exclusiveCount(getState()) != 0;
    }
	//如果当前线程为独占线程，获取下重入次数，否则0
    final int getWriteHoldCount() {
        return isHeldExclusively() ? exclusiveCount(getState()) : 0;
    }
	//获取当前线程的重入次数
    final int getReadHoldCount() {
        if (getReadLockCount() == 0)
            return 0;
        Thread current = Thread.currentThread();
        if (firstReader == current)
            return firstReaderHoldCount;
        HoldCounter rh = cachedHoldCounter;
        if (rh != null && rh.tid == current.getId())
            return rh.count;
        int count = readHolds.get().count;
        if (count == 0) readHolds.remove();
        return count;
    }
    /** 从stream重构实例  */
    private void readObject(java.io.ObjectInputStream s)
        throws java.io.IOException, ClassNotFoundException {
        s.defaultReadObject();
        readHolds = new ThreadLocalHoldCounter();
        setState(0); // reset to unlocked state
    }
	//获取state值
    final int getCount() { return getState(); }
}</span>
```

看下公平和非公平策略：

```java
<span style="font-size:18px;">static final class NonfairSync extends Sync {
    private static final long serialVersionUID = -8159625535654395037L;
    final boolean writerShouldBlock() {
        return false; // 非公平的写，可以插队
    }
    final boolean readerShouldBlock() {
        /* 就是检查队列的head的next是不是独占节点  */
        return apparentlyFirstQueuedIsExclusive();
    }
}
final boolean apparentlyFirstQueuedIsExclusive() {
    Node h, s;
    return (h = head) != null &&
        (s = h.next)  != null &&
        !s.isShared()         &&
        s.thread != null;
}
//公平的就要排队
static final class FairSync extends Sync {
    private static final long serialVersionUID = -2274990926593161451L;
    final boolean writerShouldBlock() {
        return hasQueuedPredecessors();
    }
    final boolean readerShouldBlock() {
        return hasQueuedPredecessors();
    }
}
AQS:
public final boolean hasQueuedPredecessors() {
    // The correctness of this depends on head being initialized
    // before tail and on head.next being accurate if the current
    // thread is first in queue.
    Node t = tail; // Read fields in reverse initialization order
    Node h = head;
    Node s;
    return h != t &&
        ((s = h.next) == null || s.thread != Thread.currentThread());
}</span>
```

内部类中的读锁和写锁类也都是调用AQS里面的东西，然后有一些支持超时或中断的方法，其他的一些监控类也不难，都可以看懂。

要记住AQS的int型state拆为2部分：高16位为读锁持有次数(线程的重入由其他变量持有)，低16位为写锁的重入次数，共享读，独占写，读锁阻塞写锁，写锁阻塞写锁和读锁，写锁可将级为读锁，读锁不能升级为写锁。最后总结下读写锁的Acquire和release判断大致流程:

写锁Acquire：

**1、** 获取当前线程，state值和写锁重入次数；

**2、** 如果state不为0，说明锁被占用，可能写锁也可能读锁，需要继续判断；

**3、** 在state不为0情况下，如果写锁的重入为0，说明读锁被占用，因为读锁阻塞写锁，所有返回false；

**4、** 在state不为0情况下，如果写锁的重入不为0，说明写锁被占用，因为可重入，所以判断是否为当前线程，不是false；

**5、** 在3、4判断没问题，那就是当前线程写锁重入，就判断下写锁重入后是否大于最大限制，如达到，异常；

**6、** 如5判断没达到最大线程，那就设置写锁重入次数，返回true，获取成功；

**7、** 如果2判断锁没有被持有，基于队列策略判断写是否需要阻塞(非公平时，写不需要阻塞，公平时判断head->next是否null或非当前线程)，需要阻塞返回false，挂起，不需要阻塞就cas操作设置state值；

**8、** 如果7需要阻塞或cas设置失败，返回false，挂起；

**9、** 如果7不需要阻塞且cas成功，设置独占线程，返回true，Acquire成功；

写锁release：

**1、** 首先判断是否当前线程持有，否就异常；

**2、** 计算state释放后的值；

**3、** 判断释放后的写锁重入是否为0；

**4、** 如果3为true，写锁重入为0那就设置独占线程为null；

**5、** 最后设置AQS的state值，返回3的判断结果；

读锁Acquire：

**1、** 获取当前线程和state锁持有次数；

**2、** 线程持有的写锁可降级为读锁，判断有没有其他线程持有写锁，如有，因为写锁阻塞读锁，那就挂起当前线程；

**3、** 如2没有其他线程持有写锁，说明要不写锁没被占用，要不当前线程持有，那就继续，获取读锁的持有；

**4、** 判断3个条件：；

**4、** 1）读释放不需要挂起；非公平时判断是否存在head->next为读线程，公平时判断head->next是否null或非当前线程；

**4、** 2）读锁持有小于最大；

**4、** 3）cas设置读锁持有成功；

**5、** 如果4的判断都没有问题，继续判断读锁持有是否为0:；

**5、** 1）为0表示首次持有读锁，设置2个首次变量缓存首次持有读线程和首次持有读线程的重入次数，这样处理，如果只有一个读的话，以后就不用去查询缓存；

**5、** 2）如果读锁不为0，说明有线程持有读锁，判断当前线程是否是之前缓存的首次持有读线程，如果是，累加缓存的首次持有读线程的重入次数；

**5、** 3）如果上面2个都不满足，那就从缓存的持有变量取当前线程的持有，然后累加重入次数，Acquire成功；

**6、** 如4的条件不满足，那就for循环处理当前线程，处理的流程大致同2、3、4、5：；

**6、** 1）先判断是否有写锁，如有继续判断是否其他线程持有，如果其他线程持有，那就挂起；

**6、** 2）如果没有线程持有写锁，那就判断读是否要阻塞，如果需要阻塞，继续判断：；

**6、** 2.1）已经获取读锁的重入，即使需要阻塞也不管，转到6.3处理，Acquire成功；

**6、** 2.1）如果是其他线程的首次请求，加上上面又判断需要阻塞了，那就Acquire失败，阻塞；

**6、** 3）上面判断Acquire没问题，判断读的持有是否达到最大，最大那就异常，没有下面处理下一些缓存变量，同5的处理，Acquire成功；

读锁release：

**1、** 取当前线程；

**2、** 判断是否已经持有读锁了：；

1）如果是，判断重入次数，为1就直接读锁为null，否则递减重入次数；

2）如果不是，那就从缓存的持有里面取当前线程的重入，如果重入小于等于1，需要从持有缓存remove当前线程，这里有个小于等于0的判断，没搞懂什么场景出现，最后递减；

**3、** for循环设置读锁的持有次数，返回持有次数跟0的比较值；

终于看完AQS部分了，人生不死，学习不止！
