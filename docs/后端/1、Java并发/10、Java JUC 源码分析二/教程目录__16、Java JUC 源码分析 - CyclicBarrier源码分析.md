# 16、Java JUC 源码分析 - CyclicBarrier源码分析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/16.html
- 分类：Java并发
- 分组：教程目录
## 前言

CyclicBarrier可以建立一个屏障，这个屏障可以阻塞一个线程直到指定的所有线程都达到屏障。就像团队聚餐，等所有人都到齐了再一起动筷子。根据Cyclic就可以发现CyclicBarrier可以重复使用。现在有了前面分析ReentrantLock、Semaphore、CountDownLatch的经验，CyclicBarrier也不复杂了，只是这里又引入新的概念：Condition条件队列，这也是最开始我们分析AQS没有讲的东西。

> 注：看本文前建议先看看ReentrantLock源码分析、Semaphore源码分析、CountDownLatch源码分析

首先还是来看使用：

```java
		CyclicBarrier cb = new CyclicBarrier(10, () -> {
            System.out.println("所有人员到齐，准备开饭！");
        });
        ExecutorService es = Executors.newFixedThreadPool(10);
        for (int i = 0; i < 10; i++) {
            es.execute(() -> {
                try {
                    Thread.sleep(new Random().nextInt(5) * 1000);
                    System.out.println(Thread.currentThread().getId() + "-已入座,等待其他人...");
                    cb.await();
                    System.out.println(Thread.currentThread().getId() + "-开始吃饭");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } catch (BrokenBarrierException e) {
                    e.printStackTrace();
                }
            });
        }
        es.shutdown();
    }
```

初始化的时候可以指定一个parties表示等待线程的数量，每当一个线程调用await方法就表示一个线程已经准备好，线程会被阻塞，直到指定数量的线程都准备好才被唤醒。同时提供了一个可选的Runnable参数，当所有线程都准备好之后，唤醒阻塞线程之前会先同步执行这个Runnable。

## 源码分析

CyclicBarrier的结构没有CountDownLatch和Semaphore那些那样简单的使用一个内部类继承AQS，然后重写几个方法就实现了，其同时依赖了条件队列和同步队列。先来看看CyclicBarrier的类结构：

```java
public class CyclicBarrier {
	//使用ReentrantLock做同步锁
 	private final ReentrantLock lock = new ReentrantLock();
 	//通过lock创建一个Condition，实际上是一个ConditionObject
 	private final Condition trip = lock.newCondition();
 	//等待线程的数量，就是构造方法的入参，设置之后不会改变
 	private final int parties;
 	//内部维护的计数器，初始状态和parties相同，实际操作的是这个字段
 	private int count;
 	//所有线程到达之后执行的任务，可以不指定
 	private final Runnable barrierCommand;
 	//分代，CyclicBarrier可以重复使用，可以理解为一轮一轮的，每一轮就是一个Generation
 	private Generation generation = new Generation();
 	/*表示分代，内部类*/
	private static class Generation {
		//表示当前分代(轮)是否“中断”
        boolean broken = false;
	}
}
```

为了达到可以重复使用的目的，CyclicBarrier引入了Generation(分代)的概念，可以将其理解为一轮生命周期，每一轮都有一个Generation，对应到代码中有一个布尔类型的broke字段代表当前轮的生命周期是否被中断，如果被中断会有一系列的处理措施。

首先来看看CyclicBarrier的构造函数：

```java
	public CyclicBarrier(int parties) {
        this(parties, null);
    }
    public CyclicBarrier(int parties, Runnable barrierAction) {
        if (parties <= 0) throw new IllegalArgumentException();
        this.parties = parties;
        //将parties赋值给count
        this.count = parties;
        this.barrierCommand = barrierAction;
    }
```

提供了两个构造函数，初始会将parties赋值给count，然后提供了一个可选的barrierAction参数，会在所有线程准备就绪的时候被**同步调用**。

接下来看看核心的await方法：

```java
public int await() throws InterruptedException, BrokenBarrierException {
        try {
            return dowait(false, 0L);
        } catch (TimeoutException toe) {
            throw new Error(toe); // cannot happen
        }
    }
public int await(long timeout, TimeUnit unit)
        throws InterruptedException,
               BrokenBarrierException,
               TimeoutException {
        return dowait(true, unit.toNanos(timeout));
    }
```

await又间接调用了dowait方法，该方法有两个入参，表示是否进行超时等待和超时的时间，那么我们就接着进入dowait方法，：

```java
    private int dowait(boolean timed, long nanos)
        throws InterruptedException, BrokenBarrierException,
               TimeoutException {
        final ReentrantLock lock = this.lock;
        //同步控制
        lock.lock();
        try {
            final Generation g = generation;
            if (g.broken)
           		//如果当前分代已经被打断了，那么当前线程需要抛出异常
                throw new BrokenBarrierException();
            if (Thread.interrupted()) {
            	//线程在lock中阻塞的过程中可能被中断，这里要判断一下中断标识
            	//如果当前线程被中断过，那么这里手动打断当前代
            	//会重置count，并且唤醒所有阻塞线程
                breakBarrier();
                throw new InterruptedException();
            }
			//--count，表示当前线程准备就绪
            int index = --count;
            if (index == 0) {
       // tripped
            	//表示所有线程准备就绪，需要唤醒阻塞线程
                boolean ranAction = false;
                try {
                    final Runnable command = barrierCommand;
                    if (command != null)
                    	//如果指定了command，在这里同步调用
                        command.run();
                    ranAction = true;
                    //开始下一轮
                    nextGeneration();
                    return 0;
                } finally {
                    if (!ranAction)
                    	//说明执行command的时候出现了异常
                    	//需要打断当前代
                        breakBarrier();
                }
            }
            // loop until tripped, broken, interrupted, or timed out
            for (;;) {
            	//自旋
                try {
                    if (!timed)
                    	//不使用超时等待
                        trip.await();
                    else if (nanos > 0L)
                    	//使用超时等待
                        nanos = trip.awaitNanos(nanos);
                } catch (InterruptedException ie) {
                	//如果线程被中断需要打断当前代
                    if (g == generation && ! g.broken) {
                        breakBarrier();
                        throw ie;
                    } else {
                        //可能的情况就是g != generation || g.broken
                        //说明已经换代或者已经被打断，这里自我中断向外传递状态
                        Thread.currentThread().interrupt();
                    }
                }
                if (g.broken)
                	//当前代被打断，比如某个线程等待超时被唤醒之后
                	//会强制打断当前代，抛出TimeoutException，并且唤醒其它阻塞线程
                	//线程被唤醒后发现当前代被打断，那么这里直接抛出BrokenBarrierException
                	//或者执行command出现异常
                    throw new BrokenBarrierException();
                if (g != generation)
                	//说明开始了新的代，当前线程是从同步队列中被唤醒的
                	//返回index，会在finally块中执行unlock唤醒同步队列中后面的阻塞线程
                    return index;
                if (timed && nanos <= 0L) {
                	//超时唤醒，强制打断当前代，唤醒所有阻塞线程
                    breakBarrier();
                    throw new TimeoutException();
                }
            }
        } finally {
        	//释放锁，这里很重要，线程传递唤醒是在这里处理的
        	//在finally块中保证传递唤醒不会异常被中断
            lock.unlock();
        }
    }
/*手动中断当前代*/
private void breakBarrier() {
        generation.broken = true;
        count = parties;
        //唤醒所有阻塞线程
        trip.signalAll();
    }
/*换代*/
private void nextGeneration() {
		//唤醒阻塞线程
        trip.signalAll();
        //重置count
        count = parties;
        //换代
        generation = new Generation();
    }
```

可以看到和前面几个工具的CAS操作不同，这里上来就是一个同步锁，之所以使用同步锁，是因为这里不是简单的更新count字段需要保证并发安全，并且线程阻塞唤醒也是依赖同步锁的解锁操作，其中还有较为繁杂的逻辑需要处理。

从这个await方法的逻辑中我们可以看出CyclicBarrier的一个大致工作流程：

- 首先需要通过ReentrantLock加锁
- 一个线程调用了await方法获取到锁，就代表该线程准备就绪，将count减1
- 如果count减一之后大于0，就代表还有线程没有准备就绪，那么需要阻塞当前线程
- 如果count减一之后等于0，就代表所有线程都准备就绪，那么需要同步调用创建CyclicBarrier时指定的command(如果有的话)。然后唤醒阻塞线程，并且进行换代操作，将count重置为初始值(也就是parties)，这样CyclicBarrier就能重复使用了
- 如果运行command出现了异常，那么会导致当前代被"中断"，仍然会唤醒所有阻塞线程，只是线程被唤醒后发现当前代被打断，那么继而会抛出BrokenBarrierException异常
- 既然调用了ReentrantLock的lock方法，那么不要忘记前面分析ReentrantLock的内容，这里默认创建的是非公平锁，并且lock方法不会抛出中断异常，但是会向外传递中断状态，所以如果线程在lock期间被中断，那么需要在后续逻辑中获取到中断状态，然后手动"中断"当前代，重置count并且唤醒所有阻塞线程
- Condition.await方法可能会抛出中断异常，如果当前代的一个阻塞线程被中断，也会导致重置count，唤醒所有阻塞线程，然后向外抛出异常；如果线程中断的时候已经换代或者当前代已经被"中断"，那么只需要自我中断打上中断标记，向外传递即可
- 如果是带超时的等待，一个线程等待超时了，同样会"中断"当前代唤醒阻塞线程，并且抛出超时异常

其实上面根据dowait方法分析出来的逻辑已经大概涵盖了CyclicBarrier的核心内容，但是我们难免还是会有所疑问：

- 阻塞线程存放到哪里的？还是依赖的CLH队列吗？
- 线程是如何阻塞/唤醒的？还是简单的park/unpark吗？
- 条件队列是如何使用的？
- 等等

为了解开这些疑问，我们还需要深入到各个方法调用的细节~ 但是这里先声明一点，源码中有很多关于各种情况下中断唤醒的判断处理(主要是打断分代和抛出异常)，而且是结合条件队列和CLH队列的共同使用，细节点也很多，一个方法的编码逻辑考虑的情况可能都够写一个小节，所以本文先从总体脉络上进行梳理。

ReentrantLock的lock方法的中断处理在其源码分析文章中详细说明过，这里我们不多说，首先来看看CyclicBarrier的线程是如何被阻塞的？也就是进入AQS中ConditionObject类的await方法：

```java
		public final void await() throws InterruptedException {
            if (Thread.interrupted())
                throw new InterruptedException();
            //添加当前线程到条件等待队列
            Node node = addConditionWaiter();
            //释放AQS中的state，相当于当前线程已经入队，那么可以"释放锁"，但是没有执行释放锁的逻辑
            int savedState = fullyRelease(node);
            int interruptMode = 0;
            while (!isOnSyncQueue(node)) {
            	//如果当前节点不再同步队列CLH中，通过park阻塞当前线程
                LockSupport.park(this);
                //检测唤醒类型，一共有三个状态：0、1、-1
                if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
                	//如果不等于0，则跳出循环
                    break;
            }
            //acquireQueued是ReentrantLock入队阻塞的逻辑
            if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
                interruptMode = REINTERRUPT;
            if (node.nextWaiter != null) // clean up if cancelled
                unlinkCancelledWaiters();
            if (interruptMode != 0)
                reportInterruptAfterWait(interruptMode);
        }
```

阻塞的第一步就是addConditionWaiter添加到条件等待队列，这个队列不再是我们熟悉的CLH队列，看看该方法的实现：

```java
private Node addConditionWaiter() {
            Node t = lastWaiter;
            //如果ws不是CONDITION，说明逻辑上已经从条件队列中取消
            //这里将其从队列中移除
            if (t != null && t.waitStatus != Node.CONDITION) {
            	//该方法就是从条件队列中移除取消的节点
                unlinkCancelledWaiters();
                t = lastWaiter;
            }
            //创建条件队列中的节点，waitStatus为CONDITION（-2）
            Node node = new Node(Thread.currentThread(), Node.CONDITION);
            if (t == null)
            	//条件队列为空，设置firstWaiter
                firstWaiter = node;
            else
            	//条件队列不为空，将当前节点添加到链表中
                t.nextWaiter = node;
            //设置lastWaiter为最新入队的节点
            lastWaiter = node;
            return node;
        }
```

可以看到条件队列就是一个**单向链表**，通过**nextWaiter**指针指向下一个节点，队列的第一个节点就是第一个排队的线程，这个和CLH双向链表和head节点为空Node的结构差别很大。

线程入条件队列之后会释放ReentrantLock的锁，也就是释放state字段，接着判断线程是否在同步队列中，也就是isOnSyncQueue方法：

```java
final boolean isOnSyncQueue(Node node) {
		//如果ws是CONDITION或者node.prev为null，说明线程在条件队列中
        if (node.waitStatus == Node.CONDITION || node.prev == null)
        	//CLH入队会先设置node的prev，如果为空，说明一定没有入队
            return false;
        if (node.next != null) // If has successor, it must be on queue
            //到这里说明prev!=null，如果next也不为null，结合CHL入队的逻辑
            //node一定在CLH队列中，并且是中间节点
            return true;
        //逻辑到这里的条件是ws!=CONDITION && prev!=null && next==null
        //这个条件理论上就代表了node是CLH的尾节点
        //但是在节点入CLH队列的时候，是先设置prev，再通过CAS设置tail
        //而CAS可能会失败
        return findNodeFromTail(node);
    }
```

首先，如果ws为CONDITION，那么说明线程肯定在条件队列中，否则就要看情况，看什么情况呢？这个需要回顾一下ReentrantLock部分介绍的CLH队列入队操作，这里回顾一下代码片段：

```java
node.prev = t;
if (compareAndSetTail(t, node)) {
	t.next = node;
	return t;
}
```

入队的逻辑是先设置当前节点的prev节点为队列当前的尾节点，然后通过CAS设置新的尾节点为当前入队节点。那么通过这个逻辑我们可以发现，如果prev!=null&&next!=null，那么node一定在CLH队列中，并且是中间节点；如果prev!=null&&next==null，并不能代表已经是CLH队列中的尾节点，CAS可能会失败，然后继续自旋。所以需要findNodeFromTail方法进一步检查：

```java
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
```

该方法逻辑很简单，就是从tail节点开始往前寻找，如果找到了对应的节点，那么表示在队列中，否则就不在。因为节点入CLH队列的逻辑是先设置prev，所以prev是可靠的，如果next!=null也可靠，但是next==null则不可靠。

如果判断到节点不在同步队列中，那么还是通过park方法阻塞线程。阻塞的逻辑先看到这里，我们接着来看看唤醒的逻辑，进入nextGeneration方法：

```java
	private void nextGeneration() {
        //唤醒线程
        trip.signalAll();
        //重置count，开始下一轮分代
        count = parties;
        generation = new Generation();
    }
```

到AQS中的ConditionObject中找到signalAll方法：

```java
        public final void signalAll() {
            if (!isHeldExclusively())
                throw new IllegalMonitorStateException();
            Node first = firstWaiter;
            if (first != null)
                doSignalAll(first);
        }
```

将条件队列的头结点firstWaiter传入doSignalAll方法：

```java
		private void doSignalAll(Node first) {
            lastWaiter = firstWaiter = null;
            do {
                Node next = first.nextWaiter;
                first.nextWaiter = null;
                //将条件队列中的节点转入同步队列（CLH）
                transferForSignal(first);
                first = next;
            } while (first != null);
        }
```

该逻辑中将条件队列中的节点按照从头到尾的顺序转入到CLH队列中，核心逻辑在transferForSignal方法中：

```java
final boolean transferForSignal(Node node) {
		//通过CAS将node.ws修改为0
        //如果node.ws不为CONDITION，说明被取消了，直接返回false，不用转入同步队列
        if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
            return false;
        //自旋CAS入队的逻辑
        Node p = enq(node);
        int ws = p.waitStatus;
        //检查节点状态，如果节点被取消，那么直接唤醒node
        if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
            LockSupport.unpark(node.thread);
        return true;
    }
```

我们发现节点转入CLH同步队列之后就没有下文了，transferForSignal中的unpark也只是特殊"异常情况"的处理，那么线程是在哪里被唤醒的呢？

不要忘记了整个CyclicBarrier的核心方法**dowait**的逻辑：先通过ReentrantLock的lock方法加锁，线程进入条件队列后会将state释放，但是此时**没有执行释放锁**(unlock)的逻辑，条件队列是通过ReentrantLock创建的，ConditionObject是AQS的内部类。当最后一个线程到达(await)之后会**将条件队列中的节点"转入"同步队列**，最终会到dowait方法的finally中执行lock.unlock()，这个lock.unlock唤醒的就是同步队列中的阻塞线程，按照ReentrantLock的释放逻辑，unlock会唤醒head.next节点，head.next被唤醒后，由于已经换代，那么会从自旋中退出，同样到finally中的unlock逻辑，这样依次循环唤醒同步队列中的所有线程。

## 总结

在CyclicBarrier初始化的时候，会把parties赋值给count字段，每个线程调用await方法(最终调用dowait方法)的时候，会先通过ReentrantLock上锁，接着会将count减1，如果count被减之后还大于0 ，那么表示还有线程没有就位，就需要将当前线程放入条件等待队列（使用Node构建的一个单向链表），释放lock中的state（只是释放了state，但是没有执行唤醒阻塞线程的逻辑），然后park阻塞；如果count被减之后等于0，那么表示所有线程已经到位，那么最后就位的这个线程会将条件队列中的阻塞线程转移到CLH队列中，然后重置count为parties的值，并且创建一个新的Generation，表示已经换代，如果指定了command，还会**同步执行**其run方法。接着dowait方法可以返回，但是会在finally块中执行ReentrantLock的unlock方法，会唤醒head.next节点对应的阻塞线程，按照ReentrantLock的逻辑，线程被唤醒之后，该节点会成为新的head节点。一个阻塞线程被唤醒之后会继续执行逻辑，判断到已经换代，那么直接跳出自旋，同样来到finally中的unlock方法，然后唤醒下一个节点对应的阻塞线程，然后该节点又成为新的head节点，接着下一个阻塞线程又被唤醒，就这样一个线程唤醒下一个线程，依次将所有线程唤醒。对此我们可以总结以下几个关键点：

- 一旦一个线程被唤醒之后发现当前分代被打断，那么会抛出BrokenBarrierException异常
- 如果线程在ReentrantLock的lock中被中断过，即使由于lock方法不会抛出异常，但是会自我中断携带中断标识(参考ReentrantLock中的逻辑)，在dowait的逻辑中判断到线程被中断过，也会打断当前代，唤醒其它阻塞线程，并且抛出InterruptedException
- 所谓的条件队列和同步队列都是逻辑上的定义，实质上他们都是Node节点，条件队列的头节点为firstWaiter，同步队列(CLH)的头结点为head。换句话说就是一个阻塞线程只有一个Node对象与之对应，它在条件队列中和在同步队列中的node都是同一个对象
- 线程正常的唤醒流程是：最后一个就位线程负责把所有条件队列中的线程添加到同步队列，然后在finally中执行ReentrantLock的unlock方法唤醒同步队列中的head.next，本节点成为新的head节点，然后被唤醒线程同样会到finally的unlock方法中唤醒下一个线程，这样传递唤醒
- 如果一个带超时阻塞的线程被超时唤醒，那么会强制打断当前分代，然后唤醒所有线程，并且抛出TimeoutException异常。这种情况下，其它线程被唤醒后发现是当前分代被打断了，那么会抛出BrokenBarrierException异常
- 如果指定的command在执行过程中出现异常，那么也会打断当前分代，唤醒所有线程，被唤醒线程会抛出BrokenBarrierException异常

上述逻辑是站在一个普遍正常的流程下的描述，事实上一个线程被阻塞之后随时都可能被中断唤醒，被中断唤醒的时候可能在条件队列中，也可能在同步队列中，源码中对于一些特殊情况作出了处理，代码细节点不少，由于篇幅问题本文也就没有每行代码都分析到位~
