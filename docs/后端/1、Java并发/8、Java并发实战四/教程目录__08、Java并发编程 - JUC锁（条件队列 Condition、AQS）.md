# 08、Java并发编程 - JUC锁（条件队列 Condition、AQS）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/8/8.html
- 分类：Java并发
- 分组：教程目录
## 一、Condition

## 1.1 API介绍

> 可以看到Condition是一个接口，它的实现类在AbstractQueuedLongSynchronizer, AbstractQueuedSynchronizer中，都叫ConditionObject

官方文档给的例子：

```java
 class BoundedBuffer {
   final Lock lock = new ReentrantLock();
   final Condition notFull  = lock.newCondition(); 
   final Condition notEmpty = lock.newCondition(); 
   final Object[] items = new Object[100];
   int putptr, takeptr, count;
   public void put(Object x) throws InterruptedException {
     lock.lock();
     try {
       while (count == items.length)
         notFull.await();
       items[putptr] = x;
       if (++putptr == items.length) putptr = 0;
       ++count;
       notEmpty.signal();
     } finally {
       lock.unlock();
     }
   }
   public Object take() throws InterruptedException {
     lock.lock();
     try {
       while (count == 0)
         notEmpty.await();
       Object x = items[takeptr];
       if (++takeptr == items.length) takeptr = 0;
       --count;
       notFull.signal();
       return x;
     } finally {
       lock.unlock();
     }
   }
 }
```

> 官方的文档第一次看可能会有点吃力，当你掌握以后再回来细看，就会慢慢懂每一句的意思了。

在没有Lock之前，我们使用synchronized来控制同步，配合Object的wait()、wait(long timeout)、notify()、以及notifyAll 等方法可以实现等待/通知模式。

Condition接口也提供了类似于Object的监听器方法、与Lock接口配合可以实现等待/通知模式，但是两者还是有很大区别的，下图是两者的对比：

> 如果你对阻塞和挂起有歧义，可以参考： 线程和进程/阻塞和挂起

Condition 将 Object 监视器方法（wait、notify 和 notifyAll）分解成截然不同的对象，以便通过将这些对象与任意 Lock 实现组合使用，为每个对象提供多个等待 set（wait-set）。其中，Lock 替代了 synchronized 方法和语句的使用，Condition 替代了 Object 监视器方法的使用。

条件（也称为条件队列 或条件变量）为线程提供了一个含义，以便在某个状态条件现在可能为 true 的另一个线程通知它之前，一直挂起该线程（即让其“等待”）。因为访问此共享状态信息发生在不同的线程中，所以它必须受保护，因此要将某种形式的锁与该条件相关联。等待提供一个条件的主要属性是：以原子方式 释放相关的锁，并挂起当前线程，就像 Object.wait 做的那样。

Condition 实例实质上被绑定到一个锁上。要为特定 Lock 实例获得 Condition 实例，请使用其newCondition() 方法。

**核心方法**

Condition提供了一系列的方法来对阻塞和唤醒线程：

- **await()**：造成当前线程在接到信号或被中断之前一直处于等待状态。
- **await(long time, TimeUnit unit)** ：造成当前线程在接到信号、被中断或到达指定等待时间之前一直处于等待状态。
- **awaitNanos(long nanosTimeout)** ：造成当前线程在接到信号、被中断或到达指定等待时间之前一直处于等待状态。返回值表示剩余时间，如果在nanosTimesout之前唤醒，那么返回值 = nanosTimeout - 消耗时间，如果返回值  AbstractQueuedSynchronizer：AQS是JUC非常核心的抽象类，这个抽象类定义了一套规范、模板，AQS定义两种资源共享方式：Exclusive（独占，只有一个线程能执行，如ReentrantLock）和Share（共享，多个线程可同时执行，如Semaphore/CountDownLatch）。我们要去实现并发编程，比如同步器都需要基于这样的规范、模板来构建，这套规范涉及如下内容：
>
>
> 同步状态的管理
> 线程的阻塞和唤醒（通过LockSupport实现）
> 同步队列、条件队列的管理（这里条件队列指的就是Condition）
>
> 简单来说有了这个抽象类，我们想要实现一个同步器，只需要继承它，然后只需要关注实现锁的获取和释放，而不需要关心线程的管理，比如什么时候让线程阻塞，什么时候让线程进入同步队列，什么时候唤醒线程这些都不需要再实现了。AQS采用了模版设计模式。

> 关于详细的AQS讲解，可以参考：

[Java并发之AQS详解](https://www.cnblogs.com/waterystone/p/4920797.html)

[并发编程——详解 AQS CLH 锁](https://www.jianshu.com/p/4682a6b0802d)

### ConditionObject

获取一个Condition必须要通过Lock的newCondition()方法。该方法定义在接口Lock下，返回的结果是绑定到此 Lock 实例的新 Condition 实例。

Condition为一个接口，其下仅有一个实现类ConditionObject，由于Condition的操作需要获取相关的锁，而AQS是同步锁的实现基础，所以ConditionObject则定义为AQS的内部类。

```java
//java.util.concurrent.locks.AbstractQueuedSynchronizer.ConditionObject
public class ConditionObject implements Condition, java.io.Serializable {
	// 省略方法
}
```

### 等待队列

每个Condition对象都包含着一个FIFO队列，该队列是Condition对象通知/等待功能的关键。在队列中每一个节点都包含着一个线程引用，该线程就是在该Condition对象上等待的线程。

Condition的定义：

```java
//java.util.concurrent.locks.AbstractQueuedSynchronizer.ConditionObject
public class ConditionObject implements Condition, java.io.Serializable {
	private static final long serialVersionUID = 1173984872572414699L;
	/** First node of condition queue. */
	private transient Node firstWaiter;
	/** Last node of condition queue. */
	private transient Node lastWaiter;
	/**
	* Creates a new {@code ConditionObject} instance.
	*/
	public ConditionObject() {
      }
	// Internal methods
	// 省略方法
}
```

从上面代码可以看出Condition拥有首节点（firstWaiter），尾节点（lastWaiter）。

当前线程调用await()方法，将会以当前线程构造成一个节点（Node），并将节点加入到该队列的尾部。

Node里面包含了当前线程的引用。Node定义与AQS的CLH`同步队列`的节点使用的都是同一个类。

Condition的队列结构比CLH同步队列的结构简单些，新增过程较为简单只需要将原尾节点的nextWaiter指向新增节点，然后更新lastWaiter即可。

### — 等待 —

调用Condition的await()方法会使当前线程进入等待状态，同时会加入到Condition等待队列并释放锁。

当从await()方法返回时，当前线程一定是获取了Condition相的锁。

```java
//java.util.concurrent.locks.AbstractQueuedSynchronizer.ConditionObject#await()
public final void await() throws InterruptedException {
	// 当前线程中断、直接异常
	if (Thread.interrupted())
		throw new InterruptedException();
	//加入等待队列
	Node node = addConditionWaiter();
	//释放锁
	int savedState = fullyRelease(node);
	int interruptMode = 0;
	//检测当前节点是否在同步队列上、如果不在则说明该节点没有资格竞争锁，继续等待。
	while (!isOnSyncQueue(node)) {
		// 挂起线程
		LockSupport.park(this);
		// 线程等待过程中是否被中断，中断直接退出
		if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
		break;
	}
	// 走到这说明被signal或者中断唤醒
	// acquireQueued竞争锁
	// 
	if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
		interruptMode = REINTERRUPT;
	// 清理条件队列
	if (node.nextWaiter != null) // clean up if cancelled
		unlinkCancelledWaiters();// 清除条件队列中取消等待的线程的node
	if (interruptMode != 0)
		//判断是否是因为中断唤醒的，因为LockSupport被中断唤醒是不会抛异常的
		//所以这里会做一个补操作，抛中断异常
		reportInterruptAfterWait(interruptMode);
}
```

此段代码的逻辑是：

- 首先将当前线程新建一个节点同时加入到等待队列中，然后释放当前线程持有的同步状态。
- 然后则是不断检测该节点代表的线程是否出现在CLH同步队列中（收到signal信号之后就会在AQS队列中检测到），如果不存在则一直挂起，否则参与竞争同步状态。

### 加入条件队列

加入条件队列addConditionWaiter()方法源码如下：

```java
//java.util.concurrent.locks.AbstractQueuedSynchronizer.ConditionObject#addConditionWaiter
private Node addConditionWaiter() {
	//队列的尾节点
	Node t = lastWaiter;
	// If lastWaiter is cancelled, clean out.
	// 如果该节点的状态的不是CONDITION，则说明该节点不在等待队列上，需要清除
	if (t != null && t.waitStatus != Node.CONDITION) {
		// 清除等待队列中状态不为CONDITION的节点
		unlinkCancelledWaiters();
		//清除后重新获取尾节点
		t = lastWaiter;
	}
	// 将当前线程构造成等待节点
	Node node = new Node(Thread.currentThread(), Node.CONDITION);
	// 将node节点添加到等待队列的尾部
	if (t == null)
		firstWaiter = node;
	else
		t.nextWaiter = node;
	lastWaiter = node;
	return node;
}
```

该方法主要是将当前线程加入到Condition条件队列中。当然在加入到尾节点之前会清除所有状态不为Condition的节点。

### 释放当前线程持有的锁

fullyRelease(Node node)：负责释放当前线程持有的锁

```java
//java.util.concurrent.locks.AbstractQueuedSynchronizer#fullyRelease
final int fullyRelease(Node node) {
	boolean failed = true;
	try {
		// 获取节点持有锁的状态（数量）
		int savedState = getState();
		// 释放锁也就是释放共享状态
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
```

### 被唤醒后判断是否在线程等待同步队列上

isOnSyncQueue(Node node)：如果一个节点刚开始在条件队列上等待，现在在同步队列上则返回true，参与锁的竞争。

```java
final boolean isOnSyncQueue(Node node) {
	// 判断节点的状态，如果状态是CONDITION，说明节点肯定不在同步队列中，同时哪怕同步
	// 队列是刚刚初始化的，也会有一个冗余的头节点存在，所以节点的前驱节点如果为null，
	// 那么节点也肯定不在同步队列中，返回fasle
	if (node.waitStatus == Node.CONDITION || node.prev == null)
		return false;
	// 节点的后继节点不为null，说明节点肯定在同步队列中，返回true，
	// 这里很重要的一点要明白，prev和next都是针对同步队列的节点
	// 而条件队列的节点用的是nextWaiter
	if (node.next != null) // If has successor, it must be on queue
		return true;
	/*
	* node.prev can be non-null, but not yet on queue because
	* the CAS to place it on queue can fail. So we have to
	* traverse from tail to make sure it actually made it. It
	* will always be near the tail in calls to this method, and
	* unless the CAS failed (which is unlikely), it will be
	* there, so we hardly ever traverse much.
	*/
	return findNodeFromTail(node);
}
```

### 将条件队列中状态不为Condition的节点删除

unlinkCancelledWaiters()：负责将条件队列中状态不为Condition的节点删除。

```java
//java.util.concurrent.locks.AbstractQueuedSynchronizer.ConditionObject#unlinkCancelledWaiters
private void unlinkCancelledWaiters() {
	// 首节点
	Node t = firstWaiter;
	Node trail = null;
	// 从头开始清除状态不为CONDITION的节点
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
```

### — 通知 —

调用Condition的signal()方法，将会唤醒在等待队列中等待最长时间的节点（条件队列里的首节点），在唤醒节点前，会将节点移到同步队列中。

```java
//java.util.concurrent.locks.AbstractQueuedSynchronizer.ConditionObject#signal
public final void signal() {
	// 如果同步是以独占方式进行的，并且当前线程已经获得锁，则返回 true；其他情况则返回 false
	if (!isHeldExclusively())
		throw new IllegalMonitorStateException();
	// 唤醒首节点
	Node first = firstWaiter;
	if (first != null)
		doSignal(first);
}
```

该方法首先会判断当前线程是否已经获得了锁，这是前置条件。然后唤醒条件队列中的头节点。

### 唤醒头节点

doSignal(Node first)：唤醒头节点

```java
//java.util.concurrent.locks.AbstractQueuedSynchronizer.ConditionObject#doSignal
private void doSignal(Node first) {
	do {
		// 修改头节点、方便移除
		if ( (firstWaiter = first.nextWaiter) == null)
			lastWaiter = null;
		first.nextWaiter = null;
		// 将该节点移到同步队列，如果失败会反复CAS重试
	} while (!transferForSignal(first) && (first = firstWaiter) != null);
}
```

doSignal(Node first)主要是做两件事：

- 修改头节点；
- 调用transferForSignal(Node first) 方法将节点移动到CLH同步队列中。

### 将节点移动到CLH同步队列中

transferForSignal(Node first)源码如下：

```java
//java.util.concurrent.locks.AbstractQueuedSynchronizer#transferForSignal
final boolean transferForSignal(Node node) {
	/*
	* If cannot change waitStatus, the node has been cancelled.
	*/
	// 将该节点的状态改为初始状态0
	if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
		return false;
	/*
	* Splice onto queue and try to set waitStatus of predecessor to
	* indicate that thread is (probably) waiting. If cancelled or
	* attempt to set waitStatus fails, wake up to resync (in which
	* case the waitStatus can be transiently and harmlessly wrong).
	*/
	// 将该节点添加到同步队列的尾部、返回的是旧的尾部节点，也就是 node.prev节点
	Node p = enq(node);
	//如果结点p的状态为cancel 或者修改waitStatus失败，则直接唤醒
	int ws = p.waitStatus;
	if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
		LockSupport.unpark(node.thread);
	return true;
}
```

关于最后倒数第二行到倒数第四行，为什么要这么做，可以参考：

[Condition中的transferForSignal()方法的不解](https://blog.csdn.net/dataiyangu/article/details/105029337)

### — 流程总结 —

整个通知的流程如下：

- 判断当前线程是否已经获取了锁，如果没有获取则直接抛出异常，因为获取锁为通知的前置条件。
- 如果线程已经获取了锁，则将唤醒条件队列的首节点。
- 唤醒首节点是先将条件队列中的头节点移出，然后调用AQS的enq(Node node)方法将其安全地移到CLH同步队列中 。
- 最后判断如果该节点的同步状态是否为Cancel，或者修改状态为Signal失败时，则直接调用LockSupport唤醒该节点的线程。

一个线程获取锁后，通过调用Condition的await()方法，会将当前线程先加入到条件队列中，然后释放锁，最后通过isOnSyncQueue(Node node)方法不断自检看节点是否已经在CLH同步队列了，如果是则尝试获取锁，否则一直挂起。

当线程调用signal()方法后，程序首先检查当前线程是否获取了锁，然后通过doSignal(Node first)方法唤醒条件队列的首节点。被唤醒的线程，将从await()方法中的while循环中退出来，然后调用acquireQueued()方法竞争同步状态。

## 1.3 案例演示

下个是一个真实的阿里面试题，题目大概意思这样的：

给一个字符串，比如"hello"，使用多线程交替打印字符hello hello hello …，要求可扩展。

当然我的实现用到了线程池，这个还没说，只需要先关注Condition即可：

```java
public class Test {
    public static void main(String[] args) {
        printl("hello");
    }
    public static void printl(String str) {
        if (str == null || str.length() <= 0) {
            return;
        }
        char[] chars = (str + " ").toCharArray();
        Executor executor = new ThreadPoolExecutor(Runtime.getRuntime().availableProcessors(),
            Runtime.getRuntime().availableProcessors() + 1, 2, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(chars.length));
        List<Runnable> runnableList = new ArrayList<>(chars.length);
        Lock lock = new ReentrantLock();
        Condition[] conditions = new Condition[chars.length];
        for (int i = 0; i < chars.length; i++) {
            conditions[i] = lock.newCondition();
            runnableList.add(new PrintTask(chars[i], i, lock, conditions));
        }
        while (true) {
            for (Runnable runnable : runnableList) {
                executor.execute(runnable);
            }
            try {
                // 睡眠防止队列太快满 拒绝处理
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException exception) {
                exception.printStackTrace();
            }
        }
    }
    static class PrintTask implements Runnable {
        private Character character;
        private int currentId;
        private static int num = 0;
        private Lock lock;
        private Condition[] conditionList;
        public PrintTask(Character character, int currentId, Lock lock, Condition[] conditionList) {
            this.currentId = currentId;
            this.lock = lock;
            this.character = character;
            this.conditionList = conditionList;
        }
        @Override
        public void run() {
            lock.lock();
            try {
                while (num != currentId) {
                    conditionList[currentId].await();
                }
                System.out.printf(String.valueOf(character));
                num = currentId + 1;
                if (num >= (conditionList.length)) {
                    num = 0;
                }
                conditionList[num].signal();
            } catch (InterruptedException exception) {
                exception.printStackTrace();
            } finally {
                lock.unlock();
            }
        }
    }
}
```
