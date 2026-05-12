# 12、Java JUC 源码分析 - ReentrantLock-FairSync源码分析(hasQueuedPredecessors)
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/12.html
- 分类：Java并发
- 分组：教程目录
## 前言

有了前面[ReentrantLock-NonfairSync源码逐行深度分析](/zhuanlan/java/concurrency/10/11.html)的基础，理解公平锁FairSync的实现就很简单了。

## 一、公平的实现

ReentrantLock的默认构造函数创建的是非公平锁，同时提供了布尔类型的有参构造函数，true表示创建公平锁。

```java
public ReentrantLock() {
	sync = new NonfairSync();
}
public ReentrantLock(boolean fair) {
	sync = fair ? new FairSync() : new NonfairSync();
}
```

在前文中我们已经分析过，使用ReentrantLock加锁其实是调用的内部sync.lock()方法，lock()方法在FairSync和NonfairSync中都有实现，本文主要看看FairSync，也就是公平锁中的lock方法：

```java
static final class FairSync extends Sync {
        final void lock() {
            acquire(1);
        }
}
```

这里已经看到和非公平锁不一样的地方了，非公平锁在lock的时候，会首先去竞争锁，竞争失败才会调用acquire方法。而在此处公平锁的实现中并没有直接就去获取锁，为了对比，这里再贴一下NonfairSync的lock方法：

```java
static final class NonfairSync extends Sync {
        final void lock() {
			//首先尝试去或获取锁
            if (compareAndSetState(0, 1))
                setExclusiveOwnerThread(Thread.currentThread());
            else
                acquire(1);
        }
}
```

acquire方法定义在父类AQS中，首先是调用tryAcquire方法尝试获取锁，失败则调用addWaiter方法将线程包装为Node。然后自旋CAS入队，接着在acquireQueued方法中完成线程的阻塞：

```java
public abstract class AbstractQueuedSynchronizer
    extends AbstractOwnableSynchronizer
    implements java.io.Serializable {
	public final void acquire(int arg) {
	        if (!tryAcquire(arg) &&
	            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
	            selfInterrupt();
	    }
}
```

其中的所有方法调用在前文已经详细分析过，这里就不再赘述，我们主要关注**tryAcquire**方法。tryAcquire方法在AQS中是一个空方法，由具体的子类重写实现逻辑，当然此处我们看FairSync中的实现：

```java
static final class FairSync extends Sync {
	protected final boolean tryAcquire(int acquires) {
				//获取当前线程
	            final Thread current = Thread.currentThread();
	            //获取state
	            int c = getState();
	            if (c == 0) {
	            	//发现没有线程持有锁
	            	//调用hasQueuedPredecessors函数判断队列中是否有优先于此线程的排队线程
	            	//如果没有才去尝试竞争锁
	                if (!hasQueuedPredecessors() &&
	                    compareAndSetState(0, acquires)) {
	                    setExclusiveOwnerThread(current);
	                    return true;
	                }
	            }
	            else if (current == getExclusiveOwnerThread()) {
	            	//锁重入
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

可以看到这里的逻辑和NonfairSync唯一的区别就是FairSync多了**hasQueuedPredecessors**函数的调用，在竞争锁之前需要先看队列中是否有优先于此线程的排队线程，如果有的话，那么FairSync不会去竞争锁，而是直接进入后面入队阻塞的逻辑。那么这里强调的优先于此线程的排队线程是什么意思呢？因为FairSync是公平锁的实现，获取锁总要有个先来后到。

## 二、hasQueuedPredecessors函数

接着我们来看看hasQueuedPredecessors函数的实现，该函数也定义在AQS中：

```java
public final boolean hasQueuedPredecessors() {
        Node t = tail;
        Node h = head;
        Node s;
        return h != t && ((s = h.next) == null || s.thread != Thread.currentThread());
    }
```

虽然这个方法代码很少，但是细节点可一点儿不少，首先我们来关注最后一条返回语句：

```java
return h != t && ((s = h.next) == null || s.thread != Thread.currentThread());
```

可以看到，如果 h != t，那么会进入后面的条件判断，会调用h.next。这里考虑一个问题，在h != t的情况下，h可不可能为null？也就是h.next可不可能抛出空指针异常？

我们先从语法层面上分析一下，要在h != t 为true的情况下使得h为null，那么t就不能为null，也就是要考虑会不会出现head == null，但是tail != null的情况。

要从理论上看待这个问题，就需要回顾一下线程入队的逻辑，也就是enq方法：

```java
private Node enq(final Node node) {
        for (;;) {
            Node t = tail;
            if (t == null) {
            	//初始化CLH队列
                if (compareAndSetHead(new Node()))
                    tail = head;
            } else {
                node.prev = t;
                if (compareAndSetTail(t, node)) {
                    t.next = node;
                    return t;
                }
            }
        }
    }
```

这个方法在前文已经详细分析过，就不细说了，这里我们要关注在初始化CLH队列的时候是**先通过CAS设置了head节点，然后将head赋值给tail**，注意这是两步操作，也就是非原子的。有可能一个线程t0执行CAS设置了head节点，但是在设置tail节点之前时间片用完了，轮到执行hasQueuedPredecessors方法的线程t1，那么此时t1去获取head和tail节点，就可能得到head不为空，但是tail为空的情况。不过，由于t1线程在hasQueuedPredecessors方法中是**先获取的tail，再获取的head**，而t0线程在enq方法中是**先设置head，再设置tail**，所以不论t1线程在什么时候运行，只要获取的tail不为null，那么head一定不为null，也就是不可能出现head == null，但是tail != null的情况。

那现在回过头来试想一下，如果先获取head，再获取tail会不会有什么问题？贴个图就能明白了：

在上图的场景中，t1先获取head，此时为null，时间片耗尽，然后t0线程运行设置head和tail，然后t1线程恢复获取tail，此时不为null。这就出现了head == null，但是tail != null的情况，那么以下语句就会出现空指针异常：

```java
return h != t && ((s = h.next) == null || s.thread != Thread.currentThread());
```

所以基于这条判断语句，**获取head和tail的顺序要和其初始化的顺序相反**，才能保证不出异常，并且head和tail都被volatile修饰，即保证了可见性，也保证了不会被指令重排影响执行顺序。基于这样获取顺序，h(head)和t(tail)只可能是以下几种情况：

- h == null and t == null
- h != null and t != null
- h !=null and t == null

然后我们再回过头来看这个条件判断语句，要表达的意思其实很简单：如果CLH队列中有排队线程，并且首个排队线程不是当前线程，那么方法需要返回true，表示有优先级比当前高的线程正在排队。

但是这里需要注意一个点，就是(s = h.next) == null这个条件判断是什么意思呢？既然CLH队列中有排队线程，那么h.next肯定是有节点才对啊？其实这个条件对应的就是我们前面提到的，由于线程穿插执行导致的，h != null，但是t == null的情况。如果出现这个情况，那么h.next就为null，因为前一个线程正在入队，但是还没有入队，当然也表示前面有线程优先级更高，只是还没有入队。也就是 h != t成立之后，有两种情况：

- h !=null and t == null：此时h.next == null，表示已经有线程正在入队，但还未入队
- h != null and t != null：此时表示CLH队列中已经有了排队线程，只需要判断h.next.thread是否为当前线程即可

所以这个hasQueuedPredecessors方法可以改写成：

```java
public final boolean hasQueuedPredecessors() {
        //先获取tail，再获取head，可以避免得到 h ==null，但是t != null的情况
        Node t = tail;
        Node h = head;
        if(h != null && t == null){
        	//线程交叉执行，可能导致这个情况，但是此时表明前面已经有线程正在入队
        	return true;
        }
        if(h != null && t != null){
        	//队列中已经有排队线程
        	return s.thread != Thread.currentThread();
        }
        if(h == null && t == null){
        	//队列为空，当前线程可以尝试去竞争锁
        	return false;
        }
    }
```

## 2.1 返回值并不可靠

### 2.1.1 返回true不可靠

由于一个线程随时可能被中断唤醒或者超时唤醒，比如我们调用的lockInterruptibly方法获取锁（这个方法在前面的文章也详细介绍过了），阻塞线程一旦被中断，那么在醒来后会立即抛出异常，然后在finally代码块中的cancelAcquire方法中移除该节点，但是在这个方法逻辑还没有完成的时候（准确来说应该是被移除节点可能还没有真正被移除：队列中只有一个排队线程，移除的逻辑是通过CAS修改指针完成的，详情参考前面文章），那此时新来一个线程调用hasQueuedPredecessors返回的还是为true，表示前面有优先级更高的排队节点，虽然它已经是个无效节点。

### 2.1.2 返回false不可靠

现在考虑这样一种情况，两个线程同时准备竞争锁，都调用了hasQueuedPredecessors，此时CLH队列还没有初始化，连head节点都没有，所以都会得到head==null，并且tail==null的结果，返回false，那么它们都会尝试去通过CAS修改state，这个时候哪个线程获取到锁就是未知数了，即使两个线程有先后顺序。

## 三、总结

可以看到公平锁相对于非公平锁的区别主要就是多了hasQueuedPredecessors方法的调用，尽可能的保证线程按照先来后到去获取锁。而从这个简单hasQueuedPredecessors方法都能看到Doug Lea有多细~
