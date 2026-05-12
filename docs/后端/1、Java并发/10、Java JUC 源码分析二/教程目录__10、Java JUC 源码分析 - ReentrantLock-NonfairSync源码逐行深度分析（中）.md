# 10、Java JUC 源码分析 - ReentrantLock-NonfairSync源码逐行深度分析（中）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/10.html
- 分类：Java并发
- 分组：教程目录
我们在前文[ReentrantLock-NonfairSync源码逐行深度分析（上）](/zhuanlan/java/concurrency/10/9.html)中分析了NonfairSync获取锁和阻塞线程的入队逻辑，也就是定义在AQS中的acquire方法：

```java
public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }
```

从前文中了解到，addWaiter方法会将Thread包装成一个Node对象，然后通过死循环(自旋)+CAS的方式保证node一定能够入队成功，入队成功之后会返回对应的node，然后当做入参传入acquireQueued方法中，该方法同样定义在AQS中：

```java
final boolean acquireQueued(final Node node, int arg) {
        boolean failed = true;
        try {
        	//标识是否被中断
            boolean interrupted = false;
            //自旋
            for (;;) {
            	//获取node节点的前驱节点
                final Node p = node.predecessor();
                //如果前驱节点是head节点，那么这里在阻塞之前再次尝试去获取锁
                if (p == head && tryAcquire(arg)) {
                	//如果获取锁成功，那么将这个node节点设置为新的头节点
                	//setHead方法会清空node的thread和prev属性，并将node赋值到head
                    setHead(node);
                    //把旧头结点的后驱指针设置为空
                    p.next = null; // help GC
                    //到这里相当于将旧的那个头结点孤立了，没有指针指向它，等待被GC回收
                    failed = false;
                    //返回是否被中断唤醒，明显这里是false
                    return interrupted;
                }
                //下面是阻塞和为唤醒做准备的操作
                if (shouldParkAfterFailedAcquire(p, node) &&
                    parkAndCheckInterrupt())
                    interrupted = true;
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
```

这里同样是自旋逻辑，首先会判断当前node的前驱节点是否是head节点，如果是，那么不会立即阻塞当前node代表的线程，而是再次尝试去获取锁。这个逻辑是什么意思呢？其实很好理解，如果这个条件成立，那就代表此时这个node是CLH的第一个真实排队节点，队列中的第二个节点（head头结点是一个空的Node）,此时可能锁已经被持锁线程释放了，那么这个排在首位的线程其实不需要被阻塞，直接获取锁就行了。但是也有可能会获取锁失败，比如现在是非公平锁的场景，即使node是第一个排队的节点，但此时又有一个新的线程来竞争锁，由于是非公平的，那么这个锁就可能被这个新来的线程获取，node还是需要被阻塞。如果获取锁成功，那么成功节点就需要”出队“，但是这里的出队并不是真正的出队，其执行的操作是：将节点的thread和prev属性置空，把head节点设置为当前节点，将旧head节点的next指针断掉。假如原本是这样的状态(t0已经被阻塞，head节点的waitStatus为SIGNAL)：

现在t0被唤醒获取锁成功，对应的node从CLH"出队"之后的状态：

可以看到，node节点并没有真正出队，而是通过一系列字段置空和断开指针操作，node节点变成了新的head节点，而旧的head节点由于没有引用，会被GC清理掉。当然，如果获取锁失败，那么还是需要进入阻塞状态。

接下来看看阻塞的逻辑，这里涉及到了两个方法的调用：shouldParkAfterFailedAcquire和parkAndCheckInterrupt。如果这两个方法都返回true，那么会将interrupted字段设置为true，然后继续下一次循环。首先来看shouldParkAfterFailedAcquire方法，注意该方法调用传入的pred参数是node节点的前驱节点。

```java
    private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
    	//pred为node节点的前驱节点
    	//获取前驱结点pred的waitStatus值
        int ws = pred.waitStatus;
        if (ws == Node.SIGNAL)
        	//ws == -1
            return true;
        if (ws > 0) {
            do {
            	//如果waitStatus为1（CANCELLED）
            	//那么需要移除pred节点，如果pred的前驱节点还是为CANCELLED
            	//那么继续移除，直到节点为非CANCELLED状态
                node.prev = pred = pred.prev;
            } while (pred.waitStatus > 0);
            pred.next = node;
        } else {
        	//将pred的waitStatus字段设置为-1
            compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
        }
        return false;
    }
```

该方法主要是针对waitStatus的一系列操作，关于Node对象的waitStatus字段，前面提到过，其定义了4个值：

> -1 ：SIGNAL：可被唤醒
>
> 1：CANCELLED：需要删除
>
> -2：CONDITION：条件等待
>
> -3：PROPAGATE：无条件传播

当然还有一个默认的0值，关于1、-2、-3几个值，在本文中不用去关心，后续在总结其它AQS相关实现的工具时遇到再谈，这里只需要关注默认值0和-1。初始状态ws的值为默认值0，那么将会走到CAS修改waitStatus的逻辑，将前驱结点的ws的值修改为-1，然后这个方法返回false（关于ws大于0，当前只定义了一个大于0的值，就是CANCELLED，本文不用理会，这里做的逻辑处理在代码中也给出了注释，就不再多言~）。

shouldParkAfterFailedAcquire方法返回false之后，紧接着的parkAndCheckInterrupt方法也就不会执行，那么在acquireQueued方法中会进入下一次循环，这里我们就先不考虑node是首个排队节点的情况，会再次进入shouldParkAfterFailedAcquire方法的逻辑，只是此时前驱节点的ws的值成了-1，ws == Node.SIGNAL返回true，那么这个方法此时就会返回true。那么就会接着执行parkAndCheckInterrupt方法，该方法很简单，定义如下：

```java
private final boolean parkAndCheckInterrupt() {
        LockSupport.park(this);
        return Thread.interrupted();
    }
```

通过LockSupport.park方法实现了线程的阻塞。方法体中关于返回当前线程中断状态的逻辑我们暂时不管，现在先来重新思考shouldParkAfterFailedAcquire和parkAndCheckInterrupt两个方法的逻辑。经过前面的分析，shouldParkAfterFailedAcquire会执行两次（不考虑pread==head并且获取锁成功的情况，这时节点不会再阻塞），第一次将node的前驱节点的waitStatus设置为SIGNAL(-1)，方法返回false，第二次判断到waitStatus等于-1，方法返回true，进而进入parkAndCheckInterrupt方法通过park进行阻塞。所以是node节点的前驱节点的waitStatus的取值影响node节点是否会进入park阻塞，这样做的意义暂时不谈，先知道这么个事儿，等我们看了释放锁的逻辑之后再回过头来看。

那现在就来看ReentrantLock的**unlock**方法：

```java
public void unlock() {
        sync.release(1);
}
```

调用的是AQS的release方法：

```java
public final boolean release(int arg) {
		//尝试释放锁
        if (tryRelease(arg)) {
            Node h = head;
            if (h != null && h.waitStatus != 0)
                unparkSuccessor(h);
            return true;
        }
        return false;
    }
```

该方法的布尔类型返回值表示释放锁是否成功，先不管失败的情况，直接看看tryReleaes方法是如何实现的。该方法在AQS中也是一个空方法，具体实现在子类中，这里我们看看ReentrantLock类中的实现（Sync）：

```java
protected final boolean tryRelease(int releases) {
			//releases传入的是1
			//将当前state的值减去1
            int c = getState() - releases;
            if (Thread.currentThread() != getExclusiveOwnerThread())
            	//只能是持锁线程才能释放锁，否则抛出异常
                throw new IllegalMonitorStateException();
            boolean free = false;
            if (c == 0) {
            	//如果state减为0才表示释放锁成功
            	//对于锁重入的场景，必须有对应重入次数的释放动作
                free = true;
                //锁释放成功，将exclusiveOwnerThread设置为空
                setExclusiveOwnerThread(null);
            }
            //更新state属性
            setState(c);
            return free;
        }
```

锁释放的逻辑很简单，看代码中的注释就行，这里不再赘述。假设现在锁释放成功，返回的free为true，那么就需要执行阻塞线程的唤醒动作：

```java
if (tryRelease(arg)) {
	//获取头结点
	Node h = head;
	if (h != null && h.waitStatus != 0)
		//这里要求头结点的waitStatus!=0才会去尝试唤醒阻塞线程
		unparkSuccessor(h);
	//返回true，表示锁释放成功，如果head为null，或head.waitStatus==0，那么不会去尝试唤醒阻塞线程
	return true;
}
```

释放锁和唤醒阻塞线程虽然都由持锁线程处理，但是这两个是独立的动作，按照代码逻辑来看，它们允许不同时发生，判断依据就是**waitStatus**字段。对应到前面提到的，线程在阻塞之前，会有两次循环，第一次会先把前驱节点的waitStatus修改为SIGNAL(-1)，然后第二次才会进入parkAndCheckInterrupt方法进行阻塞。注意这里唤醒线程是从CLH的头结点开始唤醒，所以需要判断head的waitStatus字段是否不为默认值0，以下状态表示t0线程可以尝试被唤醒：

此时head节点的waitStatus==-1，那么可以进入unparkSuccessor方法尝试唤醒阻塞的线程，该方法同样定义在AQS中：

```java
private void unparkSuccessor(Node node) {
		//此时传入的node是head节点
        int ws = node.waitStatus;
        if (ws < 0)
        	//如果waitStatus小于0，则需要重置其状态
            compareAndSetWaitStatus(node, ws, 0);
        //需要唤醒的是node的后驱节点 
        Node s = node.next;
        if (s == null || s.waitStatus > 0) {
        	//如果node没有后驱节点，或者后驱节点的waitStatus属性大于0 
        	//目前大于0的值就只定义了1，表示CANCELLED，需要被移除
            s = null;
            for (Node t = tail; t != null && t != node; t = t.prev)
            	//从后往前找，找到最靠近队头的一个waitStatus<=0的节点
                if (t.waitStatus <= 0)
                	//CANCELLED状态的节点不能被唤醒
                    s = t;
        }
        if (s != null)
        	//找到了需要唤醒的节点，调用unpark唤醒节点对应的线程
            LockSupport.unpark(s.thread);
    }
```

前面介绍了在shouldParkAfterFailedAcquire方法中有对应CANCELLED节点的移除逻辑，这里也暂时不用考虑太多，只需要知道我们找到了一个需要被唤醒的线程，然后通过unpark方法将其唤醒，而这里被唤醒的节点就是head节点的后驱节点。

那么当对应阻塞的线程被唤醒之后呢？我们回到线程阻塞的代码段：

```java
private final boolean parkAndCheckInterrupt() {
		//线程阻塞在这里
        LockSupport.park(this);
        //返回的是线程是否被中断，该方法会重置中断标志
        return Thread.interrupted();
    }
final boolean acquireQueued(final Node node, int arg) {
        boolean failed = true;
        try {
            boolean interrupted = false;
            for (;;) {
            	//阻塞线程被唤醒后，会继续循环，其前驱节点是head节点，才会尝试继续获取锁
                final Node p = node.predecessor();
                if (p == head && tryAcquire(arg)) {
                    setHead(node);
                    p.next = null; // help GC
                    //线程成功获取到锁，failed参数设置为false
                    failed = false;
                    return interrupted;
                }
                if (shouldParkAfterFailedAcquire(p, node) &&
                    parkAndCheckInterrupt())
                    //如果线程是被中断唤醒，那么将中断表示interrupted设置为true
                    interrupted = true;
            }
        } finally {
            if (failed)
            	//在这里线程如果重新获取到锁，failed不会是true
                cancelAcquire(node);
        }
    }
```

这里有几个非常重要的点：

第一个是阻塞线程被唤醒之后，不是立马就把锁给它，而是会继续执行循环体，再执行一次：判断前驱结点是否为head，然后尝试通过CAS去竞争锁。对于非公平锁的情况下，如果持锁线程将锁释放了，并不能保证被唤醒线程一定能拿到锁，因为此时可能有一个新的线程来竞争锁，那么这个锁就可能被这个新线程获取到，被唤醒的线程还需要再次陷入阻塞，关于这点在前面分析acquireQueued方法的时候已经有过说明。在前面unparkSuccessor方法唤醒阻塞线程的逻辑中，将head的waitStatus的值又重置为了初始值0，那么这里如果被唤醒线程竞争失败，需要重新陷入阻塞，会又重复两次循环，先将前驱节点(这里是head)的waitStatus设置为SIGNAL(-1)，然后再陷入阻塞，这样不断循环~

第二个是线程中断的处理。线程在方法parkAndCheckInterrupt被阻塞，然后唤醒后，返回了当前线程是否被中断的标志。关于线程中断，可以理解为是一个信号，以前终结一个线程需要调用thread.stop方法，该方法会调用native方法stop0，这个方法很暴力，线程会被直接kill，如果线程正在执行某些操作，也就会被暴力打断。所以后面提供了一个优雅一点的方式：interrupt。线程被中断后，开发人员可以获取到该标识：Thread.interrupted()，然后优雅地退出线程。需要注意的是，调用该方法会**重置线程的中断状态**：

```java
/**
     * Tests if some Thread has been interrupted.  The interrupted state
     * is reset or not based on the value of ClearInterrupted that is
     * passed.
     */
    private native boolean isInterrupted(boolean ClearInterrupted);
```

所以被park阻塞的线程，既可以被upark唤醒，也可以被interrupt唤醒，在此处的实现逻辑中，可以看到不论interrupt是true还是false都没有影响，仍然会不断循环重试，直到成功获取到锁，最终interrupted作为acquireQueued方法的返回值返回给调用者，在前文已经分析过了，其调用者是AQS的acquire方法：

```java
public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            //acquireQueued方法返回的是线程是否被中断过
            //如果被中断过，则需要在这里进行一次自我中断
            selfInterrupt();
    }
static void selfInterrupt() {
		//线程自己中断自己
        Thread.currentThread().interrupt();
    }
```

为什么需要自己中断自己？原因就是前面提到的，Thread.interrupted()方法会重置线程的interrput状态，这里需要把中断状态向外传递，使得外层调用者能正确感知到线程被中断过，以便做出相应的处理，所以需要自己中断自己重新设置中断状态。

第三是acquireQueued方法中断finally 代码块：

```java
finally {
	if (failed)
		cancelAcquire(node);
	}
```

在此处的场景中，这个failed好像除了未知的异常发生之外，永远不会为true，因为即使线程被中断唤醒了，也会继续竞争锁，竞争失败会继续陷入阻塞，竞争成功，那么failed会被设置为false。事实上，ReentrantLock除了lock()方法之外，还有一个lockInterruptibly方法，看方法名可能就知道了，这个方法是支持中断的，看看其在AQS中的实现：

```java
public final void acquireInterruptibly(int arg)
            throws InterruptedException {
        if (Thread.interrupted())
        	//如果线程被中断，那么直接抛出中断异常
            throw new InterruptedException();
        if (!tryAcquire(arg))
        	//如果首次尝试获取锁失败，那么调用doAcquireInterruptibly方法阻塞
            doAcquireInterruptibly(arg);
    }
```

如果线程被中断，那么直接抛出中断异常，否则就尝试调用tryAcquire方法获取锁，如果获取锁失败，那么调用方法**doAcquireInterruptibly**完成线程的阻塞工作（前面介绍的lock逻辑是通过acquireQueued方法实现的），来看看这个方法：

```java
private void doAcquireInterruptibly(int arg)
        throws InterruptedException {
        //和前面分析的acquireQueued方法一样，自旋CAS保证入队成功
        final Node node = addWaiter(Node.EXCLUSIVE);
        boolean failed = true;
        try {
            for (;;) {
            	//同样的自旋获取锁
                final Node p = node.predecessor();
                if (p == head && tryAcquire(arg)) {
                    setHead(node);
                    p.next = null; // help GC
                    failed = false;
                    return;
                }
                //同样的修改waitState和阻塞逻辑
                if (shouldParkAfterFailedAcquire(p, node) &&
                    parkAndCheckInterrupt())
                    //但是这里是抛出异常，前面是设置interrupted = true
                    //抛出异常后，failed 还是为初始值true，那么就会执行finally代码块中的cancelAcquire方法
                    throw new InterruptedException();
            }
        } finally {
            if (failed)
            	//如果前面抛出InterruptedException就会执行这个方法
                cancelAcquire(node);
        }
    }
```

可以看到doAcquireInterruptibly方法和acquireQueued方法"唯一"的区别就是，doAcquireInterruptibly没有返回值，在这里面如果阻塞线程**被中断唤醒**，那么不会继续参与锁的竞争，而是直接抛出InterruptedException，然后会在finally代码块中执行cancelAcquire方法；而acquireQueued方法即使线程被中断唤醒，那么也只是将中断状态保存下来，然后会继续参与锁的竞争，最终获取到锁之后，会把中断标识返回给方法调用者，最终通过selfInterrupt线程自我中断重新打上中断标记，以便更外层的调用者能够获取到该状态。

那么我们来看看cancelAcquire方法：

```java
private void cancelAcquire(Node node) {
        if (node == null)
        	//判空
            return;
		//置空当前节点的thread，因为被中断后就不需要了，也不需要被唤醒了
        node.thread = null;
        //获取node的前驱节点
        Node pred = node.prev;
        while (pred.waitStatus > 0)
        	//跳过node所有waitStatus>0(也就是CANCELLED)的前驱节点
        	//将node的前驱指针指向最近的一个非CANCELLED节点pred
            node.prev = pred = pred.prev;
		//获取pred的后驱节点
        Node predNext = pred.next;
        //将当前node节点的waitStatus设置为CANCELLED
        node.waitStatus = Node.CANCELLED;
        if (node == tail && compareAndSetTail(node, pred)) {
        	//情况1：node是尾结点并且成功通过CAS将pred设置为尾结点（可能有其它新线程节点入队，导致node不再是尾结点）
        	//将pred的后驱指针置空：相当于移除了当前node和node的所有CANCELLED前驱节点
            compareAndSetNext(pred, predNext, null);
        } else {
       		//node不是尾结点，或者本来是尾结点，但是CAS的时候被其它线程更新了CLH(上面compareAndSetTail失败)，node变成了非尾节点
            int ws;
            if (pred != head &&
                ((ws = pred.waitStatus) == Node.SIGNAL ||
                 (ws <= 0 && compareAndSetWaitStatus(pred, ws, Node.SIGNAL))) &&
                pred.thread != null) {
                //情况2：pred不是head节点，并且pred是有效的节点（waitStatus不是CANCELLED，并且是SIGNAL或被成功修改为SIGNAL,thread不为空）
                //如果pred的waitStatus不等于SIGNAL，会尝试将其修改为SIGNAL，表示下个节点可被唤醒
                //由于节点的waitStatus可能被其它线程修改，所以使用了CAS操作
                Node next = node.next;
                if (next != null && next.waitStatus <= 0)
                	//当node==tail，但是CAS替换tail的时候失败了，逻辑也可能走到这里，所以next可能为null，需要判空
                    compareAndSetNext(pred, predNext, next);
            } else {
            	//情况三：pred是head节点或者无效的节点
                unparkSuccessor(node);
            }
			//将node的next指向自己
            node.next = node; // help GC
        }
    }
```

这个方法代码比较复杂，但是实现的逻辑很简单，就是根据节点的不同位置采取不同的逻辑，将该节点从CLH队列中移除，需要的时候还会尝试唤醒后驱节点，代码中给出了相应的注释，这里也通过画图再详细解释一下其逻辑。

首先是注释中提到的，跳过所有waitStatus>0(也就是CANCELLED)的前驱节点，重新设置node的前驱指针。假设初始状态是这样（注意这里不关注waitState<=0的具体状态，所以图中节点只画了1和0两个状态）：

跳过所有CANCELLED前驱节点，重新设置前驱指针，置空thread，接着获取pred的后驱节点，然后将node的waitStatus设置为CANCELLED：

这些逻辑都是做的准备工作，接下来对于三个情况有不同的处理逻辑。

- 情况1：当前node节点是尾结点（tail）。那么就直接移除node节点，还顺带把node的所有CANCELLED前驱节点一并移除，移除的操作是，先将pred设置为tail，然后将pred的next置空，对应到上图就成了这个状态：

最后两个waitStatus为1的节点（包括node）被逻辑移除，没有了GC Root引用链引用，可以被GC清理。当然，CAS更新尾结点可能会失败，如果失败，那么就会走入下面的逻辑。
- 情况2：pred不是head节点，并且pred是有效的节点。那么先获取node的next节点，如果该节点是有效节点，那么尝试将pred的next指向这个node的next，最终将node的next指向自己：

可以看到，中间那个无效节点的指针已经断了，但是node的后驱节点的prev指针仍然指向node，不过没有影响，因为在其后面入队的节点准备阻塞或者中断后会从后往前遍历节点，同时"移除"无效节点。
- 情况3：pred是head节点或者无效的节点。此时直接尝试唤醒node的后驱节点，最后将node的next指向自己。

这里需要注意，情况3中调用unparkSuccessor方法的目的是什么？我们假设这里unparkSuccessor方法调用之前是以下状态：

现在唤醒t1线程，t1线程会在acquireQueued方法中继续循环，显然此时t1的prev节点不是head节点，所以会进入shouldParkAfterFailedAcquire方法修改前驱节点的waitStatus，但是发现前驱节点（也就是node）的watiStatus大于0 ，所以会跳过该节点，前面已经分析过shouldParkAfterFailedAcquire方法，这里就不详细说明了，只贴一下此处关心的代码：

```java
if (ws > 0) {
            do {
                node.prev = pred = pred.prev;
            } while (pred.waitStatus > 0);
            pred.next = node;
        }
return false;
```

经过这个操作之后，状态变成了：

此时shouldParkAfterFailedAcquire方法返回的false，接着又进行一次循环，这次循环发现t1节点的prev节点是head，那么t1就会尝试去竞争锁，如果竞争失败，则再次陷入阻塞状态。那么为什么不直接修改指针，要通过唤醒t1线程去修改指针呢？试想一下，如果持锁线程unlock释放了锁，那么需要从head唤醒一个阻塞的线程，由于node是head的后驱节点，所以node会被唤醒，而node对应的线程却在方法返回之前突然又出现异常（比如tryAcquire方法中获取锁时抛出了异常），也就相当于唤醒失败了，没有成功获取到锁，从而进入了cancelAcquire方法，那么这个node会在cancelAcquire中被移除。但是这里要注意，node移除之后，本次unlock就相当于没有唤醒任何线程（因为node由于异常持锁失败），如果不来新的线程竞争锁，就可能出现没有线程持有锁，但是却有很多线程被阻塞排队等待锁被释放唤醒它们的情况（纯属个人猜测~）。

另外，关于unparkSuccessor方法前文已经介绍过了，这里不再赘述，就是前文逻辑中入参是head，此处是node。但是为什么寻找有效节点是从后往前找，不是从前往后找呢？结合到无效节点出队的逻辑，可以发现一些无效节点的指针一开始并没有全部断开，而是保留了部分后驱节点对其的前置指针，从后往前遍历可以根据这个前置指针找到这些无效节点，完成真正的出队，也就相当于出队动作被延迟了。

## 总结

Doug Lea将众多逻辑都凝练到AQS中，单独看某个函数的时候，可能会觉得有些逻辑明明可以有更简单的实现，有些逻辑又是莫名其妙，因为这些函数逻辑考虑了AQS的众多应用场景，所以需要对这块儿有个整体上的把握才能更好的理解其设计。正是由于这个原因，本文在分析函数的时候大多都只考虑当前分析的场景，不然可能会很懵逼。
