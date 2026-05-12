# 15、Java JUC 源码分析 - CountDownLatch源码逐行深度分析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/15.html
- 分类：Java并发
- 分组：教程目录
## 前言

CountDownLatch维护了一个计数器（还是是state字段），调用countDown方法会将计数器减1，调用await方法会阻塞线程直到计数器变为0。可以用于实现一个线程等待所有子线程任务完成之后再继续执行的逻辑，也可以实现类似简易CyclicBarrier的功能，达到让多个线程等待同时开始执行某一段逻辑目的。

有了前面[Semaphore源码分析](/zhuanlan/java/concurrency/10/14.html)和[ReentrantLock源码分析](/zhuanlan/java/concurrency/10/11.html)的基础，再来看CountDownLatch的源码就简单的多了。

## 使用

- 一个线程等待其它线程执行完再继续执行

```java
	......
	CountDownLatch cdl = new CountDownLatch(10);
	ExecutorService es = Executors.newFixedThreadPool(10);
	for (int i = 0; i < 10; i++) {
		es.execute(() -> {
			//do something
			cdl.countDown();
		});
	}
	cdl.await();
	......
```

- 实现类似CyclicBarrier的功能，先await，再countDown

```java
	......
        CountDownLatch cdl = new CountDownLatch(1);
        ExecutorService es = Executors.newFixedThreadPool(10);
        for (int i = 0; i < 10; i++) {
            es.execute(() -> {
                cdl.await();
                //do something
            });
        }
        Thread.sleep(10000L);
        cdl.countDown();
        ......
```

## 源码分析

CountDownLatch的结构和ReentrantLock、Semaphore的结构类似，也是使用的内部类Sync继承AQS的方式，并且重写了tryAcquireShared和tryReleaseShared方法。

还是首先来看构造函数：

```java
public CountDownLatch(int count) {
        if (count < 0) throw new IllegalArgumentException("count < 0");
        this.sync = new Sync(count);
    }
```

需要传入一个大于0的count，代表CountDownLatch计数器的初始值，通过Sync的构造函数最终赋值给父类AQS的state字段。可一个看到这个state字段用法多多，在ReentrantLock中使用0和1来标识锁的状态，Semaphore中用来标识信号量，此处又用来表示计数器。

CountDownLatch要通过await方法完成阻塞，先来看看这个方法是如何实现的：

```java
public void await() throws InterruptedException {
        sync.acquireSharedInterruptibly(1);
    }
```

调用的是sync的acquireSharedInterruptibly方法，该方法定义在AQS中，Semaphore也调用的这个方法：

```java
public final void acquireSharedInterruptibly(int arg)
            throws InterruptedException {
        if (Thread.interrupted())
            throw new InterruptedException();
        if (tryAcquireShared(arg) < 0)
            doAcquireSharedInterruptibly(arg);
    }
```

这个方法的逻辑前面在解析SemaPhore的时候细说过了，这里不再赘述，主要就是两个方法的调用，先通过tryAcquireShared方法尝试获取"许可"，返回值代表此次获取后的剩余量，如果大于等于0表示获取成功，否则表示失败。如果失败，那么就会进入doAcquireSharedInterruptibly方法执行入队阻塞的逻辑。这里我们主要到CountDownLatch中看看tryAcquireShared方法的实现：

```java
protected int tryAcquireShared(int acquires) {
            return (getState() == 0) ? 1 : -1;
        }
```

和Semaphore的实现中每次将state减去requires不同，这里直接判断state是否为0，如果为0那么返回1，表示获取"许可"成功；如果不为0，表示失败，则需要入队阻塞。从这个tryAcquireShared方法就能看出CountDownLatch的逻辑了：等到state变为了0，那么所有线程都能获取运行许可。

关于doAcquireSharedInterruptibly方法，在Semaphore的文章中详细分析了，可以看看[Semaphore源码分析](/zhuanlan/java/concurrency/10/14.html)。

那么我们接下来来到countDown方法：

```java
public void countDown() {
        sync.releaseShared(1);
    }
```

调用的是sync的releaseShared方法，该方法定义在父类AQS中，Semaphore使用的也是这个方法：

```java
public final boolean releaseShared(int arg) {
        if (tryReleaseShared(arg)) {
        	//当state从非
            doReleaseShared();
            return true;
        }
        return false;
    }
```

前面提到了CountDownLatch也重写了tryReleaseShared方法：

```java
protected boolean tryReleaseShared(int releases) {
            // Decrement count; signal when transition to zero
            for (;;) {
                int c = getState();
                if (c == 0)
                	//如果state等于0了直接返回false
                	//保证在并发情况下，最多只会有一个线程返回true
                	//也包括调用countDown的次数超过state的初始值
                    return false;
                int nextc = c-1;
                if (compareAndSetState(c, nextc))
                	//如果返回true，表示state从非0变为了0
                	//那么后续需要唤醒阻塞线程
                    return nextc == 0;
            }
        }
```

Semaphore在释放信号量的时候，是将获取的许可归还到state中，但是CountDownLatch没有获取许可的逻辑(获取许可的时候是判断state是否等于0)，所以在countDown的时候没有释放的逻辑，就是将state减1，然后根据state减1之后的值是否为0判断release是否成功，如果state本来大于0，经过减1之后变为了0，那么返回true。tryReleaseShared方法的返回值决定了后续需不需要调用doReleaseShared方法唤醒阻塞线程。

这里有个逻辑：如果state已经为0，那么返回false。这个主要应对两种情况：

- 调用countDown的次数超过了state的初始值
- 多线程并发调用的时候保证只有一个线程去完成阻塞线程的唤醒操作

可以看到CountDownLatch没有锁的概念，countDown方法可以被一个线程重复调用，只需要对state做reduce操作，而不用关心是谁做的reduce。如果tryReleaseShared返回true，那么表示需要在后面进入doReleaseShared方法，该方法和Semaphore中调用的方法是同一个，主要是唤醒阻塞线程或者设置PROPAGAGE状态，这里也不再赘述~

阻塞线程被唤醒之后，会在doAcquireSharedInterruptibly方法中继续循环，虽然和Semaphore调用的是同样的方法，但是这里有不一样的地方，所以还是提一句。我们首先回到doAcquireSharedInterruptibly方法：

```java
 private void doAcquireSharedInterruptibly(int arg)
        throws InterruptedException {
        final Node node = addWaiter(Node.SHARED);
        boolean failed = true;
        try {
            for (;;) {
                final Node p = node.predecessor();
                if (p == head) {
                	//如果head.next被unpark唤醒，说明此时state==0
                	//那么tryAcquireShared会返回1
                    int r = tryAcquireShared(arg);
                    //r==1
                    if (r >= 0) {
                    	//node节点被唤醒后，还会继续唤醒node.next
                    	//这样依次传递，因为在这里的r一定为1
                        setHeadAndPropagate(node, r);
                        p.next = null; // help GC
                        failed = false;
                        return;
                    }
                }
                if (shouldParkAfterFailedAcquire(p, node) &&
                    parkAndCheckInterrupt())
                    throw new InterruptedException();
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
```

当head.next线程被unpark唤醒后，会进入tryAcquireShared方法判断，由于此时state已经为0（只有当state变为0时，才会unpark唤醒线程），而前面提到了在CountDownLatch重写的tryAcquireShared中，如果state==0，那么会返回1，所以会进入setHeadAndPropagate方法：

```java
private void setHeadAndPropagate(Node node, int propagate) {
        Node h = head; // Record old head for check below
        setHead(node);
        if (propagate > 0 || h == null || h.waitStatus < 0 ||
            (h = head) == null || h.waitStatus < 0) {
            Node s = node.next;
            if (s == null || s.isShared())
                doReleaseShared();
        }
    }
```

该方法在Semaphore中详细介绍过，这里我们就站在CountDownLatch的角度来看看。其实很简单了，注意此时该方法的propagate参数值是1，那么就会进入到下面的if逻辑里，继续唤醒下一个node。当下一个node对应的线程被唤醒后，同样会进入setHeadAndPropagate方法，propagage同样为1，那么继续唤醒下一个node，就这样依次将整个CLH队列的节点都唤醒。

## 总结

如果单独把CountDownLatch拿出来看其实是很复杂的，只是CountDownLatch（包括Semaphore和ReentrantLock）都高度共用了AQS提供的一些方法，而这些方法在前面介绍Semaphore和ReentrantLock的时候已经详细分析过，所以到本文分析CountDownLatch的时候，只需要关注它内部类Sync重写的两个方法：tryAcquireShared和tryReleaseShared，也就是"获取许可"和"释放许可"的逻辑。

CountDownLatch在await的逻辑里，如果当前state的值大于0，那么会进入CLH队列进行阻塞等待unpark唤醒（或者中断唤醒）；在countDown的逻辑里，就是简单的将state-1，如果一个线程把state从1减为0，那么该线程就会负责唤醒head.next节点，head.next节点被唤醒后，又会在setHeadAndPropagate方法中唤醒next.next节点，这样依次唤醒所有CLH队列中的阻塞节点。当然，如果线程被中断唤醒，那么也会进入cancelAcquire中进行无效节点的移除逻辑。
