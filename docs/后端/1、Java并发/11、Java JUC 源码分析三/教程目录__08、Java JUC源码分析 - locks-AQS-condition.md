# 08、Java JUC源码分析 - locks-AQS-condition
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/8.html
- 分类：Java并发
- 分组：教程目录
AQS的conditionObject实现类似object的wait/notify/notify的功能，功能大概是：

**1、** object维护一个监视器和一个等待队列，condition对于一个lock可以有多个condition，对于每个condition维护一个条件队列；

**2、** 提供wait/signal/signalall功能；

来个入门demo：

```java
public class ConditionTest {
    private static ReentrantLock lock = new ReentrantLock();
    private static Condition condition = lock.newCondition();
    public static void main(String[] args) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    lock.lock();
                    System.out.println(Thread.currentThread()+ "等待条件完成");
                    condition.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    System.out.println(Thread.currentThread()+ "终于等到条件完成了，gogogo");
                    lock.unlock();
                }
            }
        }).start();
        Thread b = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    lock.lock();
                    condition.signalAll();
                    System.out.println(Thread.currentThread()+ "条件完成了，释放吧");
                } finally {
                    lock.unlock();
                }
            }
        });
        b.start();
    }
}
```

ConditionObject实现 Condition接口，Condition提供的方法定义：

有没有很熟悉的感觉。

ConditionObject每次new都会维护一个条件队列，通过node的nextWaiter串起来

```java
/** 条件队列的第一个节点 */
private transient Node firstWaiter;
/** 条件队列的最后一个节点 */
private transient Node lastWaiter;
/**
 * 空的构造，看下ReentrantLock.newCondition()每次都会new ConditionObject()可以维护多个条件队列
 */
public ConditionObject() { }
```

看下响应中断的await()流程

```java
/**
响应中断的await
能调用await的方法的线程肯定获得锁
*/
public final void await() throws InterruptedException {
		//线程中断直接异常
    if (Thread.interrupted())
        throw new InterruptedException();
		//将当前线程封装加入condition的条件队列        
    Node node = addConditionWaiter();
    //释放AQS同步等待队列中的节点
    int savedState = fullyRelease(node);
    int interruptMode = 0;
    //看节点是否还在AQS的同步等待队列,因为signal/signalall调用的话会把节点加入到AQS的等待队列，如果没在那就说明需要park
    while (!isOnSyncQueue(node)) {
    		//不在的话那就应该在条件队列了，那么park吧
        LockSupport.park(this);
        //被signal/signalall唤醒后，检查中断状态，如果被中断，break，没有的话while
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
            break;
    }
    //这里说明已经加入到AQS的队列，重新acquire，注意的是acquireQueued返回值为是否中断，返回true肯定是中断，返回false
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
        interruptMode = REINTERRUPT;
    if (node.nextWaiter != null) // clean up if cancelled
        unlinkCancelledWaiters();
    if (interruptMode != 0)//中断时，直接throw还是设置中断状态
        reportInterruptAfterWait(interruptMode);
}
/**
先判断lastWaiter的状态，如果不是condition就过一遍条件队列，将所有状态不为condition的都去掉
然后将节点加入到lastWaiter(类似AQS中的tail)的nextWaiter，如果last为null，就将first和last的nextWaiter都指向新节点
最后将lastWaiter指向新加入节点
*/
private Node addConditionWaiter() {
    Node t = lastWaiter;
    // If lastWaiter is cancelled, clean out.
    if (t != null && t.waitStatus != Node.CONDITION) {
        unlinkCancelledWaiters();
        t = lastWaiter;
    }
    Node node = new Node(Thread.currentThread(), Node.CONDITION);
    if (t == null)
        firstWaiter = node;
    else
        t.nextWaiter = node;
    lastWaiter = node;
    return node;
}
/**
从firstWaiter开始，过滤掉所有状态不为condition的节点
基本上按trail-t-next逐个节点向后移动，t从firstWaiter开始
当时看的时候，拿纸画了一遍才清楚
*/
private void unlinkCancelledWaiters() {
    Node t = firstWaiter;
    Node trail = null;
    while (t != null) {
        Node next = t.nextWaiter;
        if (t.waitStatus != Node.CONDITION) {
            t.nextWaiter = null;
            if (trail == null)
                firstWaiter = next;
            else
                trail.nextWaiter = next;
            if (next == null)
                lastWaiter = trail;
        }
        else
            trail = t;
        t = next;
    }
}
/**
这里是释放掉AQS同步等待队列中的节点
返回释放前的state值
有异常的话就将节点的状态改为cancelled
*/
final int fullyRelease(Node node) {
    boolean failed = true;
    try {
        int savedState = getState();
        if (release(savedState)) {
            failed = false;
            return savedState;
        } else {
            throw new IllegalMonitorStateException();
        }
    } finally {
        if (failed)
            node.waitStatus = Node.CANCELLED;
    }
}
/**
看节点是否还在AQS的队列中
*/
final boolean isOnSyncQueue(Node node) {
    if (node.waitStatus == Node.CONDITION || node.prev == null)
        return false;
    if (node.next != null) // If has successor, it must be on queue
        return true;
    /*
     之前分析过AQS加入节点的顺序enq()，pre-tail-next，pre加入了，但是并不能说明这个节点就真正在AQS的等待队列，
     所以需要从tail往前过滤一遍看是否存在
     */
    return findNodeFromTail(node);
}
/**
从tail往前判断节点是否在队列中，找到返回true
*/
private boolean findNodeFromTail(Node node) {
    Node t = tail;
    for (;;) {
        if (t == node)
            return true;
        if (t == null)
            return false;
        t = t.prev;
    }
}
/** 
2个状态，表示await被唤醒后，如果检查线程是中断的，就需要判断是在什么时候被中断，然后判断怎么返回这个中断，是直接异常还是设置中断状态
 */
private static final int REINTERRUPT =  1;
private static final int THROW_IE    = -1;
/**
	检查中断状态，0：未中断，
	THROW_IE：
	REINTERRUPT：
 */
private int checkInterruptWhileWaiting(Node node) {
    return Thread.interrupted() ?
        (transferAfterCancelledWait(node) ? THROW_IE : REINTERRUPT) :
        0;
}
/**
检查中断是在什么时候发生的，是在signal前还是signal后
*/
final boolean transferAfterCancelledWait(Node node) {
	//如果调用signal的话，先把节点的状态设置成0，再把节点从条件队列转移(enq)到AQS的等待队列
	//所以下面这个cas成功，那么这个中断肯定是发生在signal前
  if (compareAndSetWaitStatus(node, Node.CONDITION, 0)) {
  		//把节点放入AQS队列，保证后面acquireQueued执行
      enq(node);
      return true;
  }
  /*
   * If we lost out to a signal(), then we can't proceed
   * until it finishes its enq().  Cancelling during an
   * incomplete transfer is both rare and transient, so just
   * spin.
   */
	/**
	到这里的话，肯定是已经发生了signal，但是signal的enq没有完成，所以自旋，让signal的enq完成，返回false
	*/   
  while (!isOnSyncQueue(node))
      Thread.yield();
  return false;
}
/**
这是根据之前的标识判断怎么处理中断
signal前就抛出，signal后就设置中断状态
*/
private void reportInterruptAfterWait(int interruptMode)
    throws InterruptedException {
    if (interruptMode == THROW_IE)
        throw new InterruptedException();
    else if (interruptMode == REINTERRUPT)
        selfInterrupt();
}
```

整个await的流程为：

**1、** 判断线程中断，中断直接抛出异常；

**2、** 将节点加入condition条件队列；

**3、** 释放AQS队列中的锁；

**4、** while判断是否在AQS等待队列；

**5、** 如果不在AQS队列中，就park；

**6、** 唤醒后检查是被signal唤醒还是中断唤醒；

**7、** 中断唤醒要判断signal前还是signal后，设置怎么处理中断，signal前的话还需要将节点enq到AQS的等待队列,转到4；

**8、** 如果在就acquireQueued，重新获取，这里判断acquire返回，为true则为中断，然后设置中断处理方式；

**9、** 如果节点的nextWaiter不为null，就清理下condition的条件队列，清除所有状态不为condition的节点；

**10、** 最后看是否需要处理中断,如有，signal前的中断直接抛出，signal后设置中断状态；

awaitNanos/awaitUntil/await(long time, TimeUnit unit)基本流程跟响应中断的await差不多，只不过多了超时时间处理，跟前面讲过的响应超时没什么区别，都是底层unsafe的那些。

看下signal/signalAll：

```java
public final void signal() {
    if (!isHeldExclusively())
        throw new IllegalMonitorStateException();
    Node first = firstWaiter;
    if (first != null)
        doSignal(first);
}
/**子类实现判断是否是自己拥有*/
protected boolean isHeldExclusively() {
    throw new UnsupportedOperationException();
}
/**
这里从first开始释放一个condition状态的节点
*/
private void doSignal(Node first) {
    do {
        if ( (firstWaiter = first.nextWaiter) == null)
            lastWaiter = null;
        first.nextWaiter = null;
    } while (!transferForSignal(first) &&
             (first = firstWaiter) != null);
}
final boolean transferForSignal(Node node) {
    /*
     * If cannot change waitStatus, the node has been cancelled.
     */
    //设置节点状态为0
    if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
        return false;
    /*
     * Splice onto queue and try to set waitStatus of predecessor to
     * indicate that thread is (probably) waiting. If cancelled or
     * attempt to set waitStatus fails, wake up to resync (in which
     * case the waitStatus can be transiently and harmlessly wrong).
     */
    //将节点加入AQS的等待队列，返回的是加入节点的pre
    Node p = enq(node);
    int ws = p.waitStatus;
    //设置节点状态为SIGNAL，如果失败直接unpark新加入的节点
    if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
        LockSupport.unpark(node.thread);
    return true;
}
```

signal只释放first的开始第一个状态为condition的节点，然后将节点加入到AQS的同步等待队列，设置新加入节点的pre的状态为SIGNAL。看下signalAll的释放：

```java
private void doSignalAll(Node first) {
    lastWaiter = firstWaiter = null;
    do {
        Node next = first.nextWaiter;
        first.nextWaiter = null;
        transferForSignal(first);
        first = next;
    } while (first != null);
}
```

看到signalAll最终是处理所有condition节点。

其实不管是await还是signal/signalAll都是模拟object.wait跟notify/notifyAll，可以对比来看。

AQS大概就这么多了，还有个AbstractQueuedLongSynchronizer这个类，跟AQS差不多，只是state状态采用的是long类型：

```java
    private volatile long state;
```

AQS采用的是：

```java
    private volatile int state;
```

注意：

await会有虚假唤醒的情况，即使没有signal，await的线程也可能被唤醒。参考：多线程编程中条件变量和虚假唤醒(spurious wakeup)的讨论 http://siwind.iteye.com/blog/1469216，最后的建议就是使用 while判断条件而不是使用if判断：

while(条件不满足){

condition_wait(cond, mutex);

}
而不是:

If(条件不满足 ){

Condition_wait(cond,mutex);

}

说实话最后我也没看懂什么原因导致虚假唤醒，后来去stackoverflow查询了下，这是解释，自己研究吧

http://stackoverflow.com/questions/1050592/do-spurious-wakeups-actually-happen，还有这篇http://blog.sina.com.cn/s/blog_e59371cc0102v29b.html

http://brokendreams.iteye.com/blog/2250372

http://ifeve.com/understand-condition/comment-page-1/#comment-26901
