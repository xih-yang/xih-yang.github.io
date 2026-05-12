# 09、Java JUC 源码分析 - ReentrantLock-NonfairSync源码逐行深度分析（上）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/9.html
- 分类：Java并发
- 分组：教程目录
> 本文主要分析非公平锁的逻辑，其逻辑本身并不复杂，但考虑到AQS中的逻辑重用和队列维护的基础结构会影响到后续对其他相关子类的理解，所以描述的会比较啰嗦~

ReentrantLock的使用很简单，就像这样：

```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
//do something
lock.unlock();
```

先看ReentrantLock的构造方法：

```java
	private final Sync sync;
	public ReentrantLock() {
        sync = new NonfairSync();
    }
    public ReentrantLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
    }
```

ReentrantLock主要提供两个构造函数对成员变量sync进行赋值，Sync是一个静态内部抽象类，继承自AbstractQueuedSynchronizer（AQS）。

Sync有两个子类，**FairSync**和**NonfairSync**，分别代表公平锁的实现和非公平锁的实现，这两个类也是ReentrantLock的静态内部类。无参构造函数创建的是NonfairSync，也就是非公平锁。我们接着来看看NonfairSync的继承关系：

从继承关系图中可以看出来，AQS还继承了一个AbstractOwnableSynchronizer类，这个类是一个抽象类，其提供了一个Thread类型的**exclusiveOwnerThread**属性。这个属性用于保存当前持有锁的线程，可以用于判断锁的重入，这在下面的源码中也会有所体现。

我们回到ReentrantLock的加锁逻辑，lock()方法：

```java
public void lock() {
	sync.lock();
}
```

lock()方法调用的就是sync.lock()方法，本例中我们使用默认构造函数生成的是NonfairSync，所以先来看看NonfairSync类：

```java
	static final class NonfairSync extends Sync {
        final void lock() {
            if (compareAndSetState(0, 1))
                setExclusiveOwnerThread(Thread.currentThread());
            else
                acquire(1);
        }
        protected final boolean tryAcquire(int acquires) {
            return nonfairTryAcquire(acquires);
        }
    }
```

可以看到NonfairSync类非常简单，因为其主要逻辑都在父类中。所以lock(）方法看起来非常简单，就是一个if-else。我们先看if的条件，也就是：

```java
compareAndSetState(0, 1)
```

这个方法定义在父类AQS中：

```java
protected final boolean compareAndSetState(int expect, int update) {
	return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
}
```

这行代码的逻辑就是通过CAS的方式将静态long型的变量state设置为update值。

> 注：这里涉及到两点，分别是CAS和state字段位移，可以参考这两篇文章Java对象内存布局和深入OpenJDK源码核心探秘Unsafe(含JNI完整使用流程)，在本文就不赘述了~

这里引出了一个变量：**state**，那么这个变量是干啥的呢？它定义在AQS中，是一个volatile修饰的int类型：

```java
public abstract class AbstractQueuedSynchronizer
    extends AbstractOwnableSynchronizer
    implements java.io.Serializable {
    ......
	private volatile int state;
	......
}
```

可以理解state为一个状态标识字段，由于它是int类型，也没有显示指定默认值，所以默认为0，如果一个线程获取到了锁，那么该值就会被设置为1（同时，在前面提到的exclusiveOwnerThread也会被设置为持有锁的线程），意思就是通过这个字段来实现加锁的逻辑。

那么又是如何保证多个线程同时执行，只有一个线程能够成功呢？没错，就是前面看到的CAS，同时还通过volatile变量保证其可见性。

当然，如果要释放锁就需要重新将state设置为0。另外，一旦一个线程重复获取锁，那么就将state值再加1，释放锁就将其减1，直到state减为0才算锁完全被释放，也就实现了可重入锁的逻辑。

我们再回到NonfairSync.lock方法中的compareAndSetState(0, 1)，如果此时有多个线程并发执行，那么最多只会有一个线程能修改成功(state:0 -> 1)，也可能没有线程能修改成功，因为有可能锁已经被一个线程持有，即state!=0。

这里可能你已经发现另一个问题，怎么没有重入的逻辑？CAS是将state从0修改为1，那么即使是同一个线程来加锁，那么第二次进行CAS也会失败，也就是说只有第一次获取锁成功才会返回true。事实也的确是这样的，重入锁的逻辑在CAS失败的逻辑里，马上我们就能看到~

总之，这里会有逻辑分流：CAS成功的线程和CAS失败的线程，那么我们分别来看。

首选是CAS成功的逻辑，这也代表着一个线程加锁成功，成功之后只执行了一个方法：

```java
if (compareAndSetState(0, 1))
	setExclusiveOwnerThread(Thread.currentThread());
```

调用父类提供的setExclusiveOwnerThread方法，将当前线程赋值到exclusiveOwnerThread字段，也验证了我们前面提到的逻辑。

然后是CAS失败的逻辑：调用acquire(1)，acquire方法也定义在父类AQS中：

```java
public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }
```

这个acquire方法看起来很简单，但是实现的逻辑却并不简单，这里实现了加锁、阻塞、排队、中断的所有逻辑。我们慢慢来理~

首先是调用tryAcquire方法，传入的参数为1，如果tryAcquire方法返回false，那么会紧接着调用acquireQueued方法，acquireQueued方法接收的入参是addWaiter方法的返回值，如果返回true，那么就执行selfInterrupt方法。

我们暂时不看具体的逻辑，先根据方法名来猜一下这些方法是干啥的~ 但在这之前，我们先站在开发者的角度考虑一下，要实现一个并发控制锁，有哪些要素？

首先当然是加解锁的手段，这个我们前面提到了，就是通过CAS修改state的值；其次，加锁失败的线程需要被阻塞，阻塞之后，后续还需要被唤醒，那么就需要阻塞和唤醒的手段，而且还需要一个地方把加锁失败的线程存起来以便后续唤醒。线程被唤醒之后还需要重新参与锁的竞争，竞争失败那还得继续被阻塞。

总结说来就是：加解锁手段、阻塞唤醒手段、存储阻塞线程的数据结构。

说了这么多，我们再回到acquire方法中，首先是tryAcquire方法，看名字猜就是尝试去获取锁，返回的布尔值代表获取锁成功或失败。如果线程获取锁失败，那么需要将这个线程保存起来，并且阻塞等待被唤醒，acquireQueued(addWaiter())方法应该就是干这个事的，对于addWaiter方法，那么猜测保存阻塞线程的时候，并不是一个单纯的Thread对象，而是先进行了一层包装，再添加到对应的数据结构中，最终会在acquireQueued中实现阻塞。对于selfInterrupt，我们后面再看。

既然现在有了猜测，那么我们分别到方法内部去看看是不是这么些个逻辑。

tryAcquire定义在父类AQS中，但是是一个空方法：

```java
protected boolean tryAcquire(int arg) {
	throw new UnsupportedOperationException();
}
```

具体的实现在子类当中，本文研究的是NonfairSync类，那么就又回到了NonfairSync中：

```java
protected final boolean tryAcquire(int acquires) {
	return nonfairTryAcquire(acquires);
}
```

其中调用了nonfairTryAcquire方法， 而该方法定义在父类Sync中：

```java
final boolean nonfairTryAcquire(int acquires) {
			//获取当前线程
            final Thread current = Thread.currentThread();
            //获取当前state值，前面提到了，默认值是0，通过CAS修改这个值完成加解锁的操作
            int c = getState();
            if (c == 0) {
            	//如果state为0，那么说明此时没有线程获取到锁，state使用了volatile修饰，能保证其可见性
                if (compareAndSetState(0, acquires)) {
                	//继续使用CAS修改state值，这里不能直接修改，因为可能会有多个线程并发操作
                	//CAS成功表示持锁成功，设置exclusiveOwnerThread为当前线程
                    setExclusiveOwnerThread(current);
                    //返回true，表示持锁成功
                    return true;
                }
            }
            else if (current == getExclusiveOwnerThread()) {
            	//这里state不为0，表示锁已经被一个线程持有，那么需要判断是否有重入
            	//判断exclusiveOwnerThread是否是当前线程，这里就是锁重入的逻辑，在前面也有提及
            	//将state的值加1（这个方法调用的时候acquires传入的是1）
            	//但是这里对state做加法没有用CAS操作，因为这里已经确定锁是被当前线程持有，所以不会有并发
                int nextc = c + acquires;
                if (nextc < 0) // overflow
                    throw new Error("Maximum lock count exceeded");
                setState(nextc);
                //返回true，表示锁重入成功
                return true;
            }
            //竞争锁和锁重入都失败，返回false
            return false;
        }
```

看方法名字也能知道这个方法用于非公平获取锁，逻辑还是比较清晰，我已经在代码中加入了足够详细的注释，这里就不赘述了。总之就是加锁成功或锁重入成功返回true，否则返回false

这里为了更直观，再贴一下acquire方法：

```java
public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }
```

如果tryAcquire方法返回true，表示持锁成功，再取反，就成了false，那么这个if复合条件就被中断了，直接返回，线程可以继续执行业务逻辑；如果tryAcquire方法返回false,表示持锁失败，再取反，就成了true，那么就需要进入if的第二个条件，也就是acquireQueued(addWaiter(Node.EXCLUSIVE), arg)。那么我们首先看addWaiter方法，这个方法接收了一个入参，这里使用的是Node.EXCLUSIVE。

我们前面提到了，保存一个需要被阻塞的线程的时候，并不是使用的原生Thread对象，而是对Thread进行了一层封装，这个**Node**就是这个封装。

Node是AQS的一个静态内部类，其中有几个关键属性(这里只列出本文关注的几个属性)：

```java
static final class Node {
	//节点的”等待状态“
	volatile int waitStatus;
	//前一个节点
	volatile Node prev;
	//后一个节点
	volatile Node next;
	//线程对象
	volatile Thread thread;
	//定义waiteStatus的值
	static final int CANCELLED =  1;
	static final int SIGNAL    = -1;
	static final int CONDITION = -2;
	static final int PROPAGATE = -3;
	//定义模式
	static final Node SHARED = new Node();
	static final Node EXCLUSIVE = null;
}
```

从这几个属性可以看出来，Node构造的是一个**双向链表**，阻塞的线程对象保存在其thread属性中，而且这些变量都是用volatile保证可见性，这个链表称为**CLH队列**（三个发明者的名字首字母…），从名字也不难看出来，这个是用双向链表结构实现的一个队列(FIFO)，这些都很好理解。

要注意的是这里int类型的**waitStatus**属性，它可能的值也以常量的方式定义在Node类中，上面代码中也贴出来了，不过由于waitStatus是基础数据类型，所以其默认值是0，所以其可能的值包括：

> 0、1、-1、-2、-3

这个要解释起来就比较复杂了，不同的值代表不同的含义，在这里不用理会太多，只需要知道默认值是0，在后面遇到了再解释。

另外，Node内部还定义了两个Node类型的属性SHARED(共享)和EXCLUSIVE（独占），表示两种模式，分别用一个空的Node对象和null表示。在本文也不用理会他们，只需要知道使用的就是EXCLUSIVE就行了。

好了，我们进入addWaiter方法内部看看，该方法定义在AQS类中，这里入参传入的是EXCLUSIVE：

```java
public abstract class AbstractQueuedSynchronizer
    extends AbstractOwnableSynchronizer
    implements java.io.Serializable {
	//标识双向链表的头节点
	private transient volatile Node head;
	//标识双向链表的尾节点
	private transient volatile Node tail;
	private Node addWaiter(Node mode) {
		//首先创建一个Node节点，传入了当前线程和EXCLUSIVE(null)
		//对应的构造函数很简单，就是设置了两个属性值，就不贴代码了
        Node node = new Node(Thread.currentThread(), mode);
        //获取CLH的尾节点
        Node pred = tail;
        if (pred != null) {
        	//如果尾节点不为空，说明队列不为空，需要将新节点插入到队列尾部
        	//将新节点的前置指针指向当前尾节点
            node.prev = pred;
            if (compareAndSetTail(pred, node)) {
            	//通过CAS把当前节点设置为尾节点，这里可能有多个线程都需要入队，所以会有并发
            	//CAS成功才将原本尾节点的next节点设置为新尾节点，完成双向链表尾节点的插入
                pred.next = node;
                //插入成功之后返回新节点
                return node;
            }
            //如果CAS失败，不能返回,会转入下面enq方法中保证入队成功
        }
        //对于此时队列为空或者不为空但是入队失败的线程，都要在enq方法中入队
        enq(node);
        //返回新节点
        return node;
    }
```

前面引入CLH队列（双向链表），在AQS中还有两个属性head和tail分别代表了链表的头节点和尾节点，也就是队头和队尾，它们初始状态为null。上述代码中给出了相应的注释，这里总结一下：首先判断队列是否为空，如果不为空，那么就需要执行双向链表尾节点的插入操作，但是这里可能出现并发，所以使用的CAS保证只有一个线程能够成为此时的尾节点，对于失败的线程和进入此方法时发现队列为空的线程都要进入enq方法完成入队。那么我们来看看enq方法：

```java
private Node enq(final Node node) {
		//自旋
        for (;;) {
        	//获取当前尾节点
            Node t = tail;
            if (t == null) {
            	//如果为空，表示队列为空
                if (compareAndSetHead(new Node()))
                	//通过CAS将一个空的Node对象设置为头节点
                	//并且把head赋值给tail
                	//此时双向链表中之后一个空的Node节点，并且head和tail都指向它
                	//注意此时方法并没有返回，新节点还没有正式入队
                    tail = head;
            } else {
            	//如果队列不为空
            	//将当前需要入队节点的前驱指针指向尾节点
                node.prev = t;
                if (compareAndSetTail(t, node)) {
                	//使用CAS设置当前需要入队节点为新尾节点
                	//CAS成功才将旧尾节点的后驱指针指向新尾节点，真正完成尾节点的插入
                    t.next = node;
                    //如果入队成功，那么就返回入队的node
                    return t;
                }
                //如果CAS失败，则需要继续循环，重复上面的操作，直到新节点入队成功
            }
        }
    }
```

虽然代码中给出了详细的注释，但是这个方法实现的逻辑很重要，所以还是有必要进一步说明。

首先我们先不考虑自旋，进入循环的逻辑，如果发现队列为空，那么就需要初始化队列，但是这里要注意，初始化队列不是使用的方法入参传入的节点，而是创建了一个**空的Node对象**，以它作为双向链表的头节点，将tail属性指向它，双像链表就算初始化好了，这个操作也是使用CAS完成的，也就是只会有一个线程能够操作成功，其它操作失败的线程会进入下一次循环，同时这个CAS成功的线程只负责了初始化工作，初始化完成后还是会进入下一次循环。初始化成功之后，CLH队列状态如下所示：

然后在循环的时候再次判断，发现这个队列不为空，就会进入下面插入尾节点的逻辑，这就和前面addWaiter方法使用CAS插入尾节点的逻辑是一样的，成功的线程会把对应的node插入到尾节点，tail会指向最新的尾节点(CAS就是更新的tail)，而失败的线程会继续循环，直到对应的node入队成功。假设插入了两个节点（线程），CLH队列状态如下所示（注意这里没有修改waitStatus，暂时不用关注该字段，在后面阻塞的逻辑中会修改前驱节点的waitStatus）：

经过梳理，我们发现这里有两个关键点，其一是队头节点是一个空的Node对象，而不是第一个入队的node；其二是方法的死循环(自旋)逻辑。

自旋能够理解，因为我们必须要保证一个需要被阻塞的线程入队成功，如果入队失败，那对应的这个线程被阻塞之后，还怎么找到它然后唤醒它呢？所以需要自旋入队，直到入队成功。但是对于队头节点是一个空的Node对象，又该怎么理解呢？有数据结构经验的同学应该想到了一点，一个链表在使用的时候会去做判空操作，特别是双向链表使用前驱指针的时候，不然可能出现空指针，如果一个链表初始化的时候就为其指定一个空节点，真正意义上的头节点其实是第二个节点，那么在后续使用过程中就不用再去判空了，在这里也可以先暂时这样理解，不过Doug lea对这里设计的考量还体现在结合waitStatus唤醒阻塞线程的地方，这个就留待我们分析唤醒逻辑的时候再细说。

总之，到这里addWaiter方法已经分析完毕，逻辑和我们猜测的基本一致，就是将Thread包装成一个Node节点对象，然后通过自旋+CAS的方式保证节点能够成功入队，最后返回成功入队的Node对象，那么接下来就到了acquireQueued方法，未完待续~

## 总结

本文分析了使用ReentrantLock的非公平锁加锁时的部分逻辑，进度到了阻塞线程的入队逻辑，这里简单总结一下目前发现的一些关键点：

- 通过CAS修改state值完成加锁操作
- 通过exclusiveOwnerThread字段保存持锁线程，依赖它完成锁重入判断
- 使用双向链表结构的CLH队列作为存储阻塞线程的数据结构，链表节点类型为Node，Node是AQS的静态内部类，包装了thread
- AQS有两个Node类型的字段head和tail，分别表示CLH的头节点和尾节点
- CLH的头节点是一个空的Node对象，而不是一个真实代表了thread的Node
- 竞争锁失败的线程通过死循环（自旋）+CAS的方式保证必须入队成功（总是从尾部插入）
