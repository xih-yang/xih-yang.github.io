# 13、Java JUC 源码分析 - ReentrantLock-tryLock(long timeout, TimeUnit unit)源码分析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/13.html
- 分类：Java并发
- 分组：教程目录
在前文[ReentrantLock-NonfairSync源码逐行深度分析](/zhuanlan/java/concurrency/10/11.html)中，已经分析了AQS加解锁，阻塞唤醒与CLH队列的使用，这里主要看看带超时时间的tryLock实现。

在ReentrantLock的tryLock(timeout)方法中调用的是sync的tryAcquireNanos：

```java
public boolean tryLock(long timeout, TimeUnit unit)
            throws InterruptedException {
        return sync.tryAcquireNanos(1, unit.toNanos(timeout));
    }
```

我们知道Sync是ReentrantLock的一个静态内部类，继承自AQS，这个tryAcquireNanos方法实际实现在父类AQS中：

```java
public final boolean tryAcquireNanos(int arg, long nanosTimeout)
            throws InterruptedException {
        if (Thread.interrupted())
            throw new InterruptedException();
        return tryAcquire(arg) ||
            doAcquireNanos(arg, nanosTimeout);
    }
```

和lockInterruptibly方法的逻辑类似，首先尝试获取锁，获取锁失败则需要入队阻塞（具体逻辑参考前面文章）。只是这里调用的是doAcquireNanos方法，来看看这个方法的实现：

```java
    private boolean doAcquireNanos(int arg, long nanosTimeout)
            throws InterruptedException {
        if (nanosTimeout <= 0L)
            return false;
        //等待截止时间
        final long deadline = System.nanoTime() + nanosTimeout;
        final Node node = addWaiter(Node.EXCLUSIVE);
        boolean failed = true;
        try {
            for (;;) {
                final Node p = node.predecessor();
                if (p == head && tryAcquire(arg)) {
                	//如果是首个排队线程，那么在入队前再次尝试获取锁
                    setHead(node);
                    p.next = null; // help GC
                    failed = false;
                    return true;
                }
                //需要阻塞的时间
                nanosTimeout = deadline - System.nanoTime();
                if (nanosTimeout <= 0L)
                    return false;
                if (shouldParkAfterFailedAcquire(p, node) &&
                    nanosTimeout > spinForTimeoutThreshold)
                    //阻塞时间大于阈值才会park线程
                    LockSupport.parkNanos(this, nanosTimeout);
                if (Thread.interrupted())
                    throw new InterruptedException();
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
```

主体逻辑和doAcquireInterruptibly方法差不多，如果是首个排队线程，则需要再次尝试获取锁，失败则需要入队阻塞，中断也会抛出异常，然后在cancelAcquire方法中“移除”节点。但是这里多了等待时间的逻辑，实现也很简单：在阻塞的时候使用了**parkNanos**方法，传入了超时时间nanosTimeout，nanosTimeout每次自旋时由最大等待截止时间减去当前时间得到。

不过这里需要注意一个**spinForTimeoutThreshold**参数，当计算得到的nanosTimeout大于该值才会park线程。这个阈值存在的意义是，如果剩余等待的时间很短，那么就不需要陷入park中，默认为1000：

```java
static final long spinForTimeoutThreshold = 1000L;
```
