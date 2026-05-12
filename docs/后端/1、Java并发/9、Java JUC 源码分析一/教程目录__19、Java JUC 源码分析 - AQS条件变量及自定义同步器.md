# 19、Java JUC 源码分析 - AQS条件变量及自定义同步器
- 来源：https://ddkk.com/zhuanlan/java/concurrency/9/19.html
- 分类：Java并发
- 分组：教程目录
## 1、AQS–条件变量

我在之前的博客里面讲到过，wait和notify，他是配合synchronized内置锁实现线程同步的基础的工具方法，而条件变量ConditionObject的signal和await方法也是用来配合锁（使用AQS实现的锁）实现线程同步的的基础工具方法。

他们的不同就是，synchronized只能与一个共享变量的notify或者wait方法实现同步，而AQS一把锁可以对应多个条件变量。之前我们讲wait和notify实现同步之前不需获取该共享变量的synchronized内置锁，当然同理我们在使用条件变量的signal和await方法也是需要先获得条件变量的锁。

那么到底什么是条件变量呢？如何使用呢？大家一头雾水吧！我们先来看个例子：

```java
ReentrantLock lock = new ReentrantLock();//(1)
Condition condition = lock.newCondition();//(2)
lock.lock();//(3)
try{
	System.out.println("begin wait");
    condition.await();//(4)
    System.out.println("end wait");
}catch(Exception e){
    e.printStackTrace();
}finally{
    lock.unlock();//(5)
}
lock.lock();//(6)
try{
	System.out.println("begin signal");
    condition.signal();//(7)
    System.out.println("end signal");
}catch(Exception e){
    e.printStackTrace();
}finally{
    lock.unlock();//(8)
}
```

代码（1）创建一个独占锁ReentrantLock对象，ReentrantLock是基于AQS实现的锁。代码（2）使用ReentrantLock的对象创建了一个ConditionObject条件变量。需要注意的是，一个Lock对象可以创建多个条件变量。

当执行到代码（3）首先获取独占锁，代码（4）则调用了条件变量的await方法阻塞挂起了当前执行线程。只有当其他线程执行调用这个条件变量的signal方法，这个线程才会被唤醒。需要格外注意的是没如果我们没有给获取到锁，就调用条件变量的await方法，他就会和Object的wait方法一样会抛出java.lang.IllegalMonitorStateException异常。

然后该线程依旧会执行finally代码块的操作，释放锁。

其实这里的lock大家可以认为他等价于synchronized加上共享变量。调用lock.lock()方法就相当于进入了synchronized代码块（获取到了内置锁），调用lock.unlock()方法就相当于释放锁，离开synchronized代码块。调用await方法就相当于共享变量调用wait方法，同理，调用条件变量的signal方法，就等同于调用共享变量的notify方法。代用条件变量的signalAll就相当于notifyAll方法。

经过上面的解释，大家应该对条件变量有个大概的理解了吧

在上面的代码中，lock.newCondition()的作用其实是new了一个在AQS内部声明的ConditionObject对象，ConditionObject其实是AQS的内部类，可以访问AQS内部的变量（就例如state）和方法。而且在每个条件变量内都维护了一个条件队列，用来存放调用该条件变量的await（）方法时被阻塞的线程。注意这个条件队列和AQS队列并不是一回事哦。那么接下来我们来看看ConditionObject中的await和signal方法的源码：

如下代码,当线程调用条件变量的await方法时（必须先调用锁的lock（）方法），在内部会构造一个类型为Node.CONDITION的node节点，然后将这个节点插入条件队列的末尾，之后当线程线程会释放这个锁（在内部就是操作所对应的state变量）并阻塞挂起。如果这个时候其他线程调用lock.lock()尝试获取锁，就会有一个线程获取锁，如果获取到锁的线程调用了条件变量的await（）方法，则该线程也会被放入条件变量的阻塞队列，然后释放获取到的锁，在await()方法处阻塞

```java
 public final void await() throws InterruptedException {
     if (Thread.interrupted())
         throw new InterruptedException();
     //创建新的Node节点，并插入到条件队列的末尾
     Node node = addConditionWaiter();
     //释放当前线程获取到的锁
     int savedState = fullyRelease(node);
     int interruptMode = 0;
     //调用park方法阻塞当前线程
     while (!isOnSyncQueue(node)) {
         LockSupport.park(this);
         if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
             break;
     }
     if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
         interruptMode = REINTERRUPT;
     if (node.nextWaiter != null) // clean up if cancelled
         unlinkCancelledWaiters();
     if (interruptMode != 0)
         reportInterruptAfterWait(interruptMode);
 }
```

如下代码，当一个线程调用条件变量的signal方法时，在内部会把条件队列里队首的那个线程节点从队列里面移除，并放入AQS的阻塞队列，然后激活这个线程：

```java
public final void signal() {
    if (!isHeldExclusively())
        throw new IllegalMonitorStateException();
    Node first = firstWaiter;
    if (first != null)
        doSignal(first);
}
```

需要注意的是，AQS只提供了ConditionObject的实现，并没有提供newCondition的实现，它的实现需要由AQS的子类来实现。

下面我们来看一下当一个线程调用条件变量的await（）方法而被阻塞后，如何将其放入条件队列。

```java
 private Node addConditionWaiter() {
     Node t = lastWaiter;
     // If lastWaiter is cancelled, clean out.
     if (t != null && t.waitStatus != Node.CONDITION) {
         unlinkCancelledWaiters();
         t = lastWaiter;
     }
     //(1)创建一个Node.CONDITION的节点
     Node node = new Node(Thread.currentThread(), Node.CONDITION);
     //(2)
     if (t == null)
         firstWaiter = node;
     else
         //(3)
         t.nextWaiter = node;
     //(4)
     lastWaiter = node;
     return node;
 }
```

上面代码的234步，是在单向队列尾部插入一个元素。

## 2、AQS–条件变量小结

当多个线程同时调用lock.lock()方法获取锁的时候，只有一个线程会获取到锁，其他线程会转化为Node节点插入到lock锁对应的AQS阻塞队列里面去，并且做自旋CAS尝试获取锁。如果获取到锁的线程调用了await方法，那么该线程就会释放锁，并转换为Node节点插入到条件变量对应的条件队列里面去。

这个时候因为调用lock.lock()方法获取锁而阻塞到AQS队列的线程会获取到被释放的锁，如果他获取到锁也调用了await方法，那么该线程就会释放锁，并且也会转换为Node节点插入到条件变量对应的条件队列里面去。

当另外一个线程调用了条件变量的signal()或者signalAll()方法，会把条件队列里面的一个或者全部Node移动到AQS阻塞队列里面去，等待时机获取锁。

## 3、基于AQS实现自定义同步器

这里我基于AQS实现一个不可重入的独占锁，自定义AQS需要重写一系列方法。这里我们定义state为0，表示目前没有线程持有，state为1表示锁已经被某一个线程持有，由于是不可重入锁，所以不需要记录持有锁的次数。具体代码如下：

```java
public class NoReentrantLock implements Lock , java.io.Serializable {
    //自己定义一个内部帮助类
    private static class Sync extends AbstractQueuedSynchronizer{
        //锁是否被持有
        protected boolean isHeldExclusively(){
            return getState() == 1;
        }
        //如果state为0，尝试获取锁
        public boolean tryAcquire(int acquires){
            //这里使用一个断言，acquires！=1那么程序抛出AssertionError，并终止执行
            assert acquires == 1;
            if(compareAndSetState(0,1)){
                //设置拿到锁的线程为当前线程
                setExclusiveOwnerThread(Thread.currentThread());
                //拿到了锁
                return true;
            }
            //CAS失败，没拿到锁
            return false;
        }
        //把state设置为0，也就是释放锁
        protected boolean tryRelease(int release){
            //这里使用一个断言，release！=1那么程序抛出AssertionError，并终止执行
            assert release == 1 ;
            //如果state的值已经为0了，则抛出异常
            if(getState() == 0)
                throw new IllegalMonitorStateException();
            //清空锁的所有者
            setExclusiveOwnerThread(null);
            setState(0);
            return true;
        }
        //提供条件变量的接口
        Condition newCondition(){
            return new ConditionObject();
        }
    }
    //这里创建一个Sync来用作具体使用
    private final Sync sync = new Sync();
    @Override
    public void lock() {
        sync.acquire(1);
    }
    @Override
    public void lockInterruptibly() throws InterruptedException {
        sync.acquireInterruptibly(1);
    }
    @Override
    public boolean tryLock() {
        return sync.tryAcquire(1);
    }
    @Override
    public boolean tryLock(long time, TimeUnit unit) throws InterruptedException {
        return sync.tryAcquireSharedNanos(1,unit.toNanos(time));
    }
    @Override
    public void unlock() {
        sync.release(1);
    }
    @Override
    public Condition newCondition() {
        return sync.newCondition();
    }
}
```

下面我们来验证一下我们上面写的锁是否正确，这里我又写了一个生产者消费者的例子：

```java
public class NoReentrantLockDemo {
    //不可重入锁
    final static NoReentrantLock lock = new NoReentrantLock();
    //队列未满的条件变量
    final static Condition notFull = lock.newCondition();
    //队列未空的条件变量
    final static Condition notEmpty = lock.newCondition();
    //生产者消费者的共享队列
    final static Queue<String> queue = new LinkedBlockingDeque<String>();
    //共享队列大小
    final static int queueSize = 10;
    public static void main(String[] args) {
        Thread producter = new Thread(new Runnable() {
            @Override
            public void run() {
                //加锁
                lock.lock();
                try {
                    //如果队列满了，则等待
                    while (queue.size() == queueSize){
                        notEmpty.await();
                    }
                    //如果执行到这一步，说明队列，没满可以继续生产
                    queue.add("产品1");
                    //唤醒消费线程
                    notFull.signalAll();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }finally {
                    //释放锁
                    lock.unlock();
                }
            }
        });
        Thread consumer = new Thread(new Runnable() {
            @Override
            public void run() {
                lock.lock();
                try{
                    //队列为空,等待
                    while(queue.size() == 0){
                        notFull.await();
                    }
                    //如果能执行这一步，说明队列不为空,出队
                    queue.poll();
                    //唤醒生产者
                    notEmpty.signalAll();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }finally {
                    lock.unlock();
                }
            }
        });
        producter.start();
        consumer.start();
    }
}
```
