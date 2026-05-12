# 11、Java JUC源码分析 - locks-Semaphore
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/11.html
- 分类：Java并发
- 分组：教程目录
Semaphore不明白为什么直接放在juc包下，不是应该放locks下面嘛，这里还是当初locks学习吧。

Semaphore英文是信号量的意思，在这里我喜欢叫资源或者许可，实现的功能就是获取资源，获取到就干活，获取不到就排队，等别人释放了资源，然后所有排队的再去获取。实现AQS的共享api，看个入门demo：

```java
public class SemaphoreTest {
    //3个钥匙
    private static Semaphore semaphore = new Semaphore(3);
    public static void main(String[] args) throws InterruptedException {
        for(int i =0; i<10; i++){
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        semaphore.acquire();
                        System.out.println(Thread.currentThread() + "得到一把钥匙");
                        //模拟干些事情，要不然控制台看不出效果
                        Thread.sleep(10000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }finally{
                        semaphore.release();
                        System.out.println(Thread.currentThread() + "丢掉一把钥匙");
                    }
                }
            }).start();
        }
//不是占用锁的线程也可以release
//        semaphore.release(4);
//        Thread.sleep(4000);
//        System.out.println(semaphore.availablePermits());
    }
}
```

另外Semaphore也支持公平和非公平，区别跟ReetrantLock的公平非公平差不多，非公平就是获取的时候有可用的就插队，公平的就老老实实排队。不过lock的release必须是持有锁的线程去release，而Semaphore不是。

看下内部对AQS的实现：

```java
abstract static class Sync extends AbstractQueuedSynchronizer {
    private static final long serialVersionUID = 1192457210091910933L;
	//AQS的state保存许可的数量
    Sync(int permits) {
        setState(permits);
    }
    final int getPermits() {
        return getState();
    }
	//非公平的Acquire
    final int nonfairTryAcquireShared(int acquires) {
        for (;;) {
            int available = getState();
            int remaining = available - acquires;
            //许可量小于0就排队，要不然就cas设置返回可用的数量，肯定是大于0，不用排队
            if (remaining < 0 ||
                compareAndSetState(available, remaining))
                return remaining;
        }
    }
	//对AQS共享模式tryReleaseShard的release
    protected final boolean tryReleaseShared(int releases) {
        for (;;) {
            int current = getState();
            int next = current + releases;
            if (next < current) // overflow
                throw new Error("Maximum permit count exceeded");
            if (compareAndSetState(current, next))
                return true;
        }
    }
	//这是减少许可量，
	//举例说我项目要求有5个干活小弟，但是老大说人太多，只能给你3个人，好吧，那就减少2个吧
    final void reducePermits(int reductions) {
        for (;;) {
            int current = getState();
            int next = current - reductions;
            if (next > current) // underflow
                throw new Error("Permit count underflow");
            if (compareAndSetState(current, next))
                return;
        }
    }
	//这里是获取所有可用的许可量
    final int drainPermits() {
        for (;;) {
            int current = getState();
            if (current == 0 || compareAndSetState(current, 0))
                return current;
        }
    }
}
```

看下sync的公平和非公平的子类实现：

```java
tatic final class NonfairSync extends Sync {
    private static final long serialVersionUID = -2694183684443567898L;
	//父类设置state许可量
    NonfairSync(int permits) {
        super(permits);
    }
	//非公平的共享Acquire，调用分类实现
    protected int tryAcquireShared(int acquires) {
        return nonfairTryAcquireShared(acquires);
    }
}
static final class FairSync extends Sync {
    private static final long serialVersionUID = 2014338818796000944L;
	//父类设置state许可量
    FairSync(int permits) {
        super(permits);
    }
	//公平的共享Acquire
    protected int tryAcquireShared(int acquires) {
        for (;;) {
        	//这里是区分，看下pre是否有非自己线程排队的，非公平的没有这一步
            if (hasQueuedPredecessors())
                return -1;
            int available = getState();
            int remaining = available - acquires;
            if (remaining < 0 ||
                compareAndSetState(available, remaining))
                return remaining;
        }
    }
}
```

看下Semaphore的实现：

```java
//传入许可量，调用sync设置AQS的state的值，默认非公平
public Semaphore(int permits) {
    sync = new NonfairSync(permits);
}
/**
许可量跟是否公平标识
 */
public Semaphore(int permits, boolean fair) {
    sync = fair ? new FairSync(permits) : new NonfairSync(permits);
}
/**
调用AQS响应中断的Acquire
 */
public void acquire() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
/**
这个不响应中断的Acquire 
 */
public void acquireUninterruptibly() {
    sync.acquireShared(1);
}
/**
直接调用sync的非公平Acquire，如果你构造的时候使用的是公平模式，肯定会打破公平
 */
public boolean tryAcquire() {
    return sync.nonfairTryAcquireShared(1) >= 0;
}
/**
响应中断跟超时的Acquire
 */
public boolean tryAcquire(long timeout, TimeUnit unit)
    throws InterruptedException {
    return sync.tryAcquireSharedNanos(1, unit.toNanos(timeout));
}
/**
直接release一个许可
 */
public void release() {
    sync.releaseShared(1);
}
/**
响应Acquire指定数量的许可
 */
public void acquire(int permits) throws InterruptedException {
    if (permits < 0) throw new IllegalArgumentException();
    sync.acquireSharedInterruptibly(permits);
}
/**
不响应中断的Acquire指定数量的许可
 */
public void acquireUninterruptibly(int permits) {
    if (permits < 0) throw new IllegalArgumentException();
    sync.acquireShared(permits);
}
/**
非公平的Acquire指定数量的许可
 */
public boolean tryAcquire(int permits) {
    if (permits < 0) throw new IllegalArgumentException();
    return sync.nonfairTryAcquireShared(permits) >= 0;
}
/**
响应中断和超时的Acquire指定数量的许可
 */
public boolean tryAcquire(int permits, long timeout, TimeUnit unit)
    throws InterruptedException {
    if (permits < 0) throw new IllegalArgumentException();
    return sync.tryAcquireSharedNanos(permits, unit.toNanos(timeout));
}
/**
release指定数量的许可
 */
public void release(int permits) {
    if (permits < 0) throw new IllegalArgumentException();
    sync.releaseShared(permits);
}
/**
查询许可量
 */
public int availablePermits() {
    return sync.getPermits();
}
/**
Acquire所有可用的许可并返回许可量
 */
public int drainPermits() {
    return sync.drainPermits();
}
/**
扣减指定数量的许可，会导致许可量为负数，使用的时候注意，自己可以定义个子类看看
 */
protected void reducePermits(int reduction) {
    if (reduction < 0) throw new IllegalArgumentException();
    sync.reducePermits(reduction);
}
/**
验证是否是公平
 */
public boolean isFair() {
    return sync instanceof FairSync;
}
/**
调用AQS检查队列是否还有等待节点
 */
public final boolean hasQueuedThreads() {
    return sync.hasQueuedThreads();
}
/**
返回AQS中节点数量
 */
public final int getQueueLength() {
    return sync.getQueueLength();
}
/**
返回AQS同步等待队列所有等待Acquire的数量
 */
protected Collection<Thread> getQueuedThreads() {
    return sync.getQueuedThreads();
}
```

Semaphore还是比较简单的，因为实现的是共享模式API，所以不管lock还是lock的线程都可以release，另外感觉收缩许可量的时候可能会导致许可量为负，使用的时候需要注意。
