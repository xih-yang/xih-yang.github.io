# 14、Java JUC 源码分析 - Semaphore源码逐行深度分析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/14.html
- 分类：Java并发
- 分组：教程目录
## 前言

Semaphore即信号量，可以控制并发访问特定的资源的线程数量，比如可用于接口请求限流，和ReentrantLock一样依赖AQS实现。其整体结构和前面介绍的ReentrantLock差不多，也是通过静态内部类Sync继承AQS实现，并且也通过静态内部类FairSync和NonfairSync分别实现了公平和非公平场景下的信号量获取。

但是Semaphore相对于ReentrantLock来说更加复杂，复杂的点就是ReentrantLock作为同步锁，state只有0和1两种状态，整体控制流程保持lock-unlock-lock-unlock这样的逻辑，所以源码阅读还相对容易。但是信号量可以设置为多个(state > 1)，所以同时可能有多个信号量被释放，要尽可能的保证排队线程更快的获取到信号量并执行逻辑 。

## 使用

Semaphore使用的话比较简单，就是初始化，然后获取-释放就可以了：

```java
Semaphore semaphore = new Semaphore(10);
>thread-0:
semaphore.acquire();
//do somethis......
semaphore.release();
>thread-1:
semaphore.acquire();
//do somethis......
semaphore.release();
```

## 源码实现

前面提到了，Semaphore的类层次结构和ReentrantLock基本一样，这里就不贴继承关系图了，可以直接参考[ReentrantLock-NonfairSync源码逐行深度分析](/zhuanlan/java/concurrency/10/11.html)，我们直接开始跟代码。

## 构造函数

首先是构造函数：

```java
public class Semaphore{
	public Semaphore(int permits) {
		sync = new NonfairSync(permits);
	}
	public Semaphore(int permits, boolean fair) {
        sync = fair ? new FairSync(permits) : new NonfairSync(permits);
    }
	abstract static class Sync extends AbstractQueuedSynchronizer {
     }
	static final class FairSync extends Sync {
     }
	static final class NonfairSync extends Sync {
     }
}
```

构造函数需要指定**permits**，表示允许的并发量，默认创建的是一个非公平的实现-**NonfairSync**，也提供了一个带布尔参数的构造函数用于指定公平场景还是非公平场景。NonfairSync是Semaphore的一个静态内部类，在其构造函数中会调用父类Sync的setState方法，实际调用的是祖父类AQS的setState方法，将permits赋值给state字段。所以这里就可以发现了，在ReentrantLock中，state的值只有0和1，而在这里，state由用户指定，表示的是允许的并发量。

## 获取信号量

接下来我们在Semaphore中找到acquire()方法的实现：

```java
public void acquire() throws InterruptedException {
	sync.acquireSharedInterruptibly(1);
}
```

acquireSharedInterruptibly方法实现在AQS中，该方法有一个入参，支持一次释放多个信号量，这里默认是1。另外，类似于ReentrantLock中根据中断情况有不同处理的方法实现，这里acquireSharedInterruptibly也有"忽略"中断的版本（通过调用acquireUninterruptibly方法），不过这里我们不用关心这个了，cancelAcquire的方法的都是一个逻辑。

进入AQS的acquireSharedInterruptibly方法：

```java
public final void acquireSharedInterruptibly(int arg)
            throws InterruptedException {
        if (Thread.interrupted())
            throw new InterruptedException();
        //尝试获取信号量
        if (tryAcquireShared(arg) < 0)
            doAcquireSharedInterruptibly(arg);
    }
```

首先调用tryAcquireShared方法尝试获取信号量，如果获取结果小于0 ，就代表没有获取成功，那么进入doAcquireSharedInterruptibly方法完成入队阻塞的逻辑。tryAcquireShared的逻辑相对来说很简单，就是在将当前state（剩余信号量）减去arg（需要的信号量）。该方法定义在AQS中，但是是一个空方法，需要子类实现，我们这里关注的是非公平场景，那么到Semaphore的NonfairSync中找到该方法的实现：

```java
protected int tryAcquireShared(int acquires) {
	return nonfairTryAcquireShared(acquires);
}
```

调用的是nonfairTryAcquireShared方法：

```java
final int nonfairTryAcquireShared(int acquires) {
            for (;;) {
            	//获取当前剩余信号量
                int available = getState();
                //减去需要的信号量
                int remaining = available - acquires;
                //如果小于0表示没有足够的信号量，返回后可能需要入队阻塞
                //由于可能有多个线程同时来获取信号量，所以需要通过自旋+CAS的方式保障信号量的并发安全访问与更新
                if (remaining < 0 ||
                    compareAndSetState(available, remaining))
                    return remaining;
            }
        }
```

代码逻辑很简单，也给出了注释，主要注意这里需要通过自旋CAS的方式保证并发安全。回到acquireSharedInterruptibly方法，如果这里返回的remaining>=0，那么表示获取成功可以执行后面的业务逻辑，否则表示获取失败，需要进入doAcquireSharedInterruptibly方法：

```java
private void doAcquireSharedInterruptibly(int arg)
        throws InterruptedException {
        //自旋保证线程必须入队成功，注意这里的mode为SHARED
        final Node node = addWaiter(Node.SHARED);
        boolean failed = true;
        try {
            for (;;) {
                final Node p = node.predecessor();
                if (p == head) {
                    int r = tryAcquireShared(arg);
                    if (r >= 0) {
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

咋一看，该方法逻辑和ReentrantLock使用lockInterruptibly方法时调用的入队阻塞逻辑基本一毛一样（也就是AQS的doAcquireInterruptibly方法）。大体逻辑就是：

- 首先通过自旋保证线程节点一定要入队成功，只是这里传入的mode为**SHARED**，在ReentrantLock中传入的是**EXCLUSIVE**
- 接着判断当前节点是否为第一个排队节点（head.next），如果是的话，那么会再次尝试去获取信号量，如果获取成功那么当前节点"出队"：孤立原有head，当前node成为新的head。这也和ReentrantLock中基本一致，只是加锁是逻辑成了获取信号量，而且这里多了唤醒其它线程的逻辑
- 如果获取信号量失败，则需要在shouldParkAfterFailedAcquire方法中将前驱节点的waitState修改为SIGNAL（-1），然后再次循环，如果-

没有达到获取信号量的条件或者没有获取到信号量，则会进入parkAndCheckInterrupt方法通过park进行阻塞，这就和ReentrantLock中逻辑完全一致
- 如果阻塞线程被中断唤醒，则会进入finally代码块中的cancelAcquire方法中执行无效节点移除的逻辑

tryAcquireShared方法前面已经看过了，就是根据当前剩余信号量减去需求信号量，得到remaining，然后根据remaining是否大于等于0判断获取信号量是否成功，那么主要就需要关注setHeadAndPropagate方法的调用，该方法定义在AQS中：

```java
private void setHeadAndPropagate(Node node, int propagate) {
		//先保存旧head节点的引用
        Node h = head; // Record old head for check below
        //清空node的thread和prev属性，变为新的head节点
        setHead(node);
        //根据状态判断是否需要继续唤醒后续线程
        if (propagate > 0 || h == null || h.waitStatus < 0 ||
            (h = head) == null || h.waitStatus < 0) {
            Node s = node.next;
            if (s == null || s.isShared())
                doReleaseShared();
        }
}
private void setHead(Node node) {
        head = node;
        node.thread = null;
        node.prev = null;
}
```

关于node节点变更为新的head节点没有摆头，主要是最后的那个if逻辑和doReleaseShared方法调用需要注意。这里经过一系列的条件判断，可能会去尝试继续唤醒阻塞的线程，为什么在一个线程获取到信号量之后还要去继续唤醒线程呢？主要就是因为如果一个线程成功获取了信号量，那么有可能信号量还有剩余，也可能有多个线程都释放了信号量，那么此时就可以同时继续唤醒阻塞线程，提高效率。当然这里也可能会有无效的唤醒，也就是被唤醒的线程仍然无法获取到信号量。关于这里的逻辑和doReleaseShared方法，我们等到看了释放信号量的逻辑再来一起细说，才更好理解。

如果没能成功获取到信号量，就需要进入阻塞的逻辑，按照CLH队列的逻辑，如果现在要两个排队线程t1和t2，那么队列可能是下面两种情况：

- t2已经入队但还未被park：
- t2已经被park：

## 释放信号量

接下来我们来到释放信号量，也就是release()方法的逻辑：

```java
public void release() {
        sync.releaseShared(1);
    }
```

调用的是Sync的relaseShared方法，该方法定义在AQS中，同样支持传入一个数量，默认为1：

```java
public final boolean releaseShared(int arg) {
		//首先释放信号量
        if (tryReleaseShared(arg)) {
        	//可能需要唤醒线程
            doReleaseShared();
            return true;
        }
        return false;
    }
```

关于tryReleaseShared方法的逻辑很简单，就是自旋CAS释放信号量，释放的逻辑就是将state的值加上释放的数量（这里是1），以供其它线程获取，我们在Semaphore中找到该方法的实现：

```java
protected final boolean tryReleaseShared(int releases) {
            for (;;) {
            	//通过CAS保证释放一定成功
                int current = getState();
                int next = current + releases;
                if (next < current) // overflow
                    throw new Error("Maximum permit count exceeded");
                if (compareAndSetState(current, next))
                    return true;
            }
        }
```

tryReleaseShared释放信号量成功之后，就需要调用doReleaseShared方法唤醒阻塞线程，该方法在前文一个线程成功获取到信号量的时候可能会调用，来看看该方法的实现逻辑：

```java
private void doReleaseShared() {
        for (;;) {
        	//自旋
            Node h = head;
            if (h != null && h != tail) {
                int ws = h.waitStatus;
                if (ws == Node.SIGNAL) {
                	//如果head.ws==-1，那么可以尝试唤醒head.next节点
                	//但是如果有多个线程同时执行这个逻辑（线程阻塞前获取信号量和线程释放信号量两处逻辑都可能调用这个方法），就会有并发问题，所以这里使用CAS，如果失败就需要自旋重试
                	//当然，如果下一次循环发现ws!=-1，就不会到这里的逻辑了
                    if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                        continue;            // loop to recheck cases
                    //唤醒head.next节点
                    unparkSuccessor(h);
                }
                else if (ws == 0 &&
                         !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                    //ws可能被其它线程更新为了0 ，那么会走到这里的逻辑，将ws修改为PROPAGATE(传播)
                    //但是这里也可能有并发产生，所以还是需要CAS保证安全
                    //如果CAS失败，还是需要自旋重试(可能是被其它线程修改为了PROPAGATE，也可能是h.next线程将其修改为了SIGNAL)
                    //当然，如果下一次循环又发现ws!=0，也就不会到这里的逻辑了
                    continue;                // loop on failed CAS
            }
            if (h == head)                   // loop if head changed
                //如果head节点发生了变更，那么就需要重试
                //如果head节点没有变更，对于当前线程来说，要么已经唤醒了head.next
                //要么已经将head.ws修改为了PROPAGATE(传播)，可以退出自旋
                break;
        }
    }
```

方法中给出了详细的注释，逻辑这里就不再赘述了，这里需要特别注意的是，在信号量的场景中，很可能会有多个线程同时获取/释放信号量，头结点的状态和头结点本身都随时可能发生变更，所以在doReleaseShared中需要使用自旋CAS保证并发安全。

另外关于**PROPAGATE**状态的设置，可以从逻辑中看到，当多个线程同时执行doReleaseShared方法的时候，对于head节点不变的情况下，只有一个线程能够调用unparkSuccessor方法去尝试唤醒head.next节点，而其它CAS失败的线程会去将head.ws修改为PROPAGATE状态，并且这个操作也是只有一个线程能够执行成功，其它失败的线程会跳出自旋循环。

在unparkSuccessor的逻辑里，会将head节点的ws重置为默认值0（虽然这个动作在doReleaseShared方法中也做了），然后再唤醒head.next线程，被唤醒线程会在自旋循环中尝试去获取信号量，如果它获取信号量成功呢？这里就回到前文没有讲完的setHeadAndPropagate方法：

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

这里主要看下面if的逻辑，其中propagate入参代表的是当前线程成功获取到信号量之后，当前信号量还剩余的数量（也就是currentState-requires），如果propagate大于0，表示还有剩余，那么立即尝试去唤醒下一个节点，这个是可以理解的。但是后面的四个判断是什么意思呢？

我们试想一个这样的场景，首先初始状态为，线程t0和t1将信号量瓜分完了，都在处理自己的逻辑，线程t2和t3依次被阻塞，CLH状态如下：

> head(ws==-1)  t2(ws==-1)  t3(ws==0)

假设现在t0释放了信号量，在doReleaseShared中唤醒了线程t2，并且将head.ws重置为了0，然后t2获取信号量成功，t2对应节点应该要成为新的head。但是这时候t1逻辑也处理完了，也会去执行doReleaseShared方法释放信号量，此时就可能出现两种情况：

- head还是老的head
- head已经变成了t2节点

如果head还是老的head，那么head.ws==0，t1会尝试将ws修改为PROPAGATE（-3），表示传播状态，意思就是又有线程释放了信号量，然后在t2的逻辑中就可以根据head.ws判断如果ws小于0，那么说明可能又有了充足的信号量，那就尝试再唤醒一个线程(t3)。如果head已经被更新为了t2节点，那么其ws==-1，在t1执行doReleaseShared的时候自然就会尝试去唤醒t3线程。

不过这里还有另一个情况，还是上面t0、t1、t2、t3的例子，线程t0和t1将信号量瓜分完了，都在处理自己的逻辑，线程t2被阻塞，但是t3虽然已经入队，但是还没有被阻塞，那么此时CLH状态如下：

> head(ws==-1)t2(ws==0)t3(ws==0)。

这个时候t0先释放信号量，head已经被更新为了t2节点之后，t1再释放信号量进入doReleaseShared方法，就有可能会出现head.ws==0的情况，这个时候也把其ws修改为PROPAGATE状态，那么在t2执行setHeadAndPropagate方法的时候根据最新head（也就是t2节点），判断发现ws head(ws==-1)  t2(ws==-1)  t3(ws==0)

现t0先释放信号量，唤醒t2线程，会把head.ws设置为0，然后t2线程会去获取信号量，获取成功，此时剩余可用信号量(remaining)又变为0，然后t2线程会调用setHeadAndPropagate方法。

但是在t2调用setHeadAndPropagate之前（**还没有更新head**），t1线程又释放信号量进入了doReleaseShared方法，所以此时t1得到的head是旧的head，其不为null，但是ws==0，按照以前的代码逻辑不会去执行unparkSuccessor方法唤醒线程。然后t2线程继续运行，判断其获取到的剩余可用信号量remaining为0（此时真实可用信号量已经大于0，因为t1释放了信号量，但是t2获取remainning发生在t1释放之前），也不会去执行unparkSuccessor方法唤醒线程，所以出现了CLH队列hang住的情况。在引入PROPAGATE之后，这个问题得到了解决。

## 总结

总的来说Semaphore和ReentrantLock差不多，都是依赖AQS的CLH队列完成的同步控制，连代码结构也基本一致，只是Semaphore在多信号量的背景下更为复杂~这里总结一个非公平场景下Semaphore的大体流程：

acquire的时候，线程首先根据需求(permits)尝试去获取信号量(remainning=state-permits)，如果remainning>=0表示获取成功，否则表示失败。如果remainning==0，表示此线程获取之后已经没有更多信号量了，如果获取失败，那么会自旋CAS入队，然后判断如果当前node(**SHARED**)是head.next，那么再次尝试获取信号量，如果获取失败，则修改当前node.prev.waitStatus=-1，然后在第二次循环中如果还是没有获取到信号量，那就通过park阻塞线程。

线程在调用release方法之后，会首先释放(归还)信号量(state+=permits)，然后会进入核心方法**doReleaseShared**，该方法可能会被并发访问，所以使用了自旋CAS的方式，完成的工作主要是唤醒head.next线程或者设置head.waitStatus为**PROPAGATE**状态。

如果一个被阻塞的线程被中断唤醒，那么会进入**cancelAcquire**方法执行无效节点移除的逻辑（如果调用的是acquireUninterruptibly则不会），如果被unpark唤醒，那么会继续方法内自旋循环去获取信号量，如果获取失败，最终会再次被阻塞，如果获取成功，那么会进入核心方法**setHeadAndPropagate**，根据剩余信号量和新老head的waitStatus状态，可能也会调用doReleaseShared方法，尝试去唤醒阻塞的线程。这里可能出现先unpark一个线程，然后该线程再去调用park阻塞的情况，但是先unpark，再park是不会阻塞线程的，该线程还是能继续下一次循环去尝试获取信号量。

Semaphore使用了一个新的waitStatus，PROPAGATE，表示传播状态，既解决了老版本Semaphore可能导致CLH hang住的问题，也提高了CLH队列的活跃性，保证了一旦可能有可用的信号量，能够较为快速的唤醒线程去竞争。
