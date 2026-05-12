# 19、Java并发编程：嵌套管程锁死
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/19.html
- 分类：Java并发
- 分组：教程目录
## 嵌套管程锁死是如何发生的

嵌套管程锁死的问题类似于死锁。 嵌套管程锁死是这样发生的：

```java
Thread 1 synchronizes on A
Thread 1 synchronizes on B (while synchronized on A)
Thread 1 decides to wait for a signal from another thread before continuing
Thread 1 calls B.wait() thereby releasing the lock on B, but not A.
Thread 2 needs to lock both A and B (in that sequence)
        to send Thread 1 the signal.
Thread 2 cannot lock A, since Thread 1 still holds the lock on A.
Thread 2 remain blocked indefinately waiting for Thread1
        to release the lock on A
Thread 1 remain blocked indefinately waiting for the signal from
        Thread 2, thereby
        never releasing the lock on A, that must be released to make
        it possible for Thread 2 to send the signal to Thread 1, etc.
```

这听起来像是一种理论上的情况，但是请看下面Lock的直接实现：

```java
//带有嵌套管程锁死的lock实现
public class Lock{
  protected MonitorObject monitorObject = new MonitorObject();
  protected boolean isLocked = false;
  public void lock() throws InterruptedException{
    synchronized(this){
      while(isLocked){
        synchronized(this.monitorObject){
            this.monitorObject.wait();
        }
      }
      isLocked = true;
    }
  }
  public void unlock(){
    synchronized(this){
      this.isLocked = false;
      synchronized(this.monitorObject){
        this.monitorObject.notify();
      }
    }
  }
}
```

请注意lock（）方法首先在“ this”上同步，然后在monitorObject成员变量上同步。 如果isLocked为false，则没有问题。 该线程不调用monitorObject.wait（）。 但是，如果isLocked为true，则调用lock（）的线程将停在monitorObject.wait（）调用中。

这样做的问题在于，调用monitorObject.wait（）仅释放了monitorObject成员上的同步管程，而不释放与“ this”关联的同步管程。 换句话说，刚刚停在等待状态的线程仍持有“ this”上的同步锁。

当首个将Lock锁定的线程尝试调用unlock（）对其进行解锁时，将在尝试进入unlock（）方法中的synchronized(this)代码块时被阻塞。 它将一直保持阻塞状态，直到在lock（）中等待的线程离开了synchronized（this）为止。 但是，在lock（）方法中等待的线程不会离开该块，直到isLocked 设置为false，并执行monitorObject.notify（），而这正是unlock（）要做的。

简而言之，等待lock（）的线程需要成功执行一次unlock（），以使其退出lock（）和其中的同步块。 但是，在lock()中等待的线程离开外部同步块之前，没有任何线程可以实际执行unlock（）。

结果是，任何调用lock（）或unlock（）的线程都将永远阻塞。 这称为嵌套管程锁死。

## 一个更现实的例子

你可能会说，你永远不会照上面的方式实现一个锁。 因为你不会在内部管程对象上调用wait（）和notify（），而是在this上调用。很可能是这样。 但是在某些情况下，可能会出现上述设计。 例如，如果要在Lock中实现公平性。 这样做时，你希望每个线程在各自的队列对象上调用wait（），以便可以一次通知一个线程。

看一下这种公平锁的简单实现：

```java
//Fair Lock implementation with nested monitor lockout problem
public class FairLock {
  private boolean           isLocked       = false;
  private Thread            lockingThread  = null;
  private List<QueueObject> waitingThreads =
            new ArrayList<QueueObject>();
  public void lock() throws InterruptedException{
    QueueObject queueObject = new QueueObject();
    synchronized(this){
      waitingThreads.add(queueObject);
      while(isLocked || waitingThreads.get(0) != queueObject){
        synchronized(queueObject){
          try{
            queueObject.wait();
          }catch(InterruptedException e){
            waitingThreads.remove(queueObject);
            throw e;
          }
        }
      }
      waitingThreads.remove(queueObject);
      isLocked = true;
      lockingThread = Thread.currentThread();
    }
  }
  public synchronized void unlock(){
    if(this.lockingThread != Thread.currentThread()){
      throw new IllegalMonitorStateException(
        "Calling thread has not locked this lock");
    }
    isLocked      = false;
    lockingThread = null;
    if(waitingThreads.size() > 0){
      QueueObject queueObject = waitingThreads.get(0);
      synchronized(queueObject){
        queueObject.notify();
      }
    }
  }
}
```

```java
public class QueueObject {
     }
```

乍看起来，此实现看起来不错，但请注意lock（）方法调用了queueObject.wait（），该调用在两个同步块内部。 一个在“ this”上同步，另一个嵌套在其中，在queueObject局部变量上同步。 当线程调用queueObject.wait（）时，它释放QueueObject实例上的锁，但不释放与“ this”关联的锁。

还要注意，unlock（）方法声明为synchronized，它相当于synchronized（this）块。 这意味着，如果线程在lock（）中等待，则与“ this”关联的管程对象将被该等待的线程锁定。 所有调用unlock（）的线程将无限期地阻塞，等待正在等待的线程释放对“ this”的锁定。 但这永远不会发生，因为只有在线程成功将信号发送到等待的线程时才会发生，而发送信号只能通过执行unlock（）方法。

因此，上面的FairLock实现可能导致嵌套管程锁死。在《饥饿和公平性》篇中讲解了如何更好的实现公平锁。

## 嵌套管程锁死 vs 死锁

嵌套管程锁死和死锁的结果几乎相同：所涉及的线程最终被阻塞，永远等待对方。

但这两种情况并不等价。 如关于死锁篇中所述，当两个线程以不同顺序获得锁时，就会发生死锁。 线程1锁定A，等待B。线程2锁定B，然后等待A。如防死锁篇所述，可以通过始终以相同顺序锁定锁（锁定顺序）来避免死锁。 但是，嵌套管程锁死正是由两个线程以相同顺序进行锁定而发生。 线程1锁定A和B，然后释放B并等待来自线程2的信号。线程2同时需要A和B才能向线程1发送信号。 结果就是，一个线程正在等待信号，另一个线程正在等待释放锁。

## 区别总结如下：

- 在死锁中，两个线程等待彼此释放锁。
- 嵌套管程锁死中，线程1持有锁A，然后等待

来自线程2的信号。线程2需要锁A来发送

信号给线程1。
