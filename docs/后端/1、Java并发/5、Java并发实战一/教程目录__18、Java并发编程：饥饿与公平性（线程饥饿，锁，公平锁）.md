# 18、Java并发编程：饥饿与公平性（线程饥饿，锁，公平锁）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/18.html
- 分类：Java并发
- 分组：教程目录
如果某个线程因为其他线程抢占了所有时间而没有获得CPU时间，则称为“饥饿”。 该线程“因饥饿而死亡”，因为其他线程占用了CPU时间而它却得不到。 饥饿的解决方案称为“公平性”——所有线程都被公平地给予执行的机会。

## java中饥饿的原因

以下三个常见原因可能导致Java中的线程的饥饿：

**1、** 高优先级的线程吞噬低优先级的线程的所有CPU时间；

**2、** 线程无限期地等待着进入同步块，因为在它之前始终有其他线程被允许访问同步块；

**3、** 在某个对象上等待的线程（在该对象上调用wait（））一直无限期地等待，因为其他线程会不断被唤醒，而轮不到它；

### 高优先级的线程吞噬低优先级的线程的所有CPU时间

你可以分别设置每个线程的线程优先级。 优先级越高，授予线程的CPU时间就越多。 你可以设置线程的优先级在1到10之间。对优先级的具体解释取决于应用程序所运行的操作系统。 对于大多数应用程序，最好不要更改优先级。

### 线程无限期地等待着进入同步块

Java的同步代码块可能是造成饥饿的另一个原因。 Java的同步代码块不能保证允许等待进入同步块的线程进入的顺序。 这意味着在理论上存在一种风险，那就是线程试图进入该块而始终处于阻塞状态，因为其他线程在此之前一直被授予访问权限。 这个问题称为“饥饿”，一个线程被“饿死”是因为其他线程占用了CPU时间而不是它。

### 在某个对象上等待的线程（在该对象上调用wait（））一直无限期地等待

如果多个线程在某对象上调用了wait（），则notify（）方法不能保证哪个线程被唤醒。 可能是任何正在等待的线程。 因此，存在这样的风险，即等待在某个对象上的线程永远不会被唤醒，因为被唤醒的总是其他等待线程而不是它。

## java中实现公平性

尽管不可能在Java中实现100％的公平性，但我们仍然可以实现同步结构来增加线程之间的公平性。

让我们先研究一个简单的同步代码块：

```java
public class Synchronizer{
  public synchronized void doSynchronized(){
    //do a lot of work which takes a long time
  }
}
```

如果有多个线程调用doSynchronized（）方法，则其中的一些线程将被阻塞，直到第一个被授予访问权限的线程离开该方法为止。 如果有多个线程被阻塞等待访问，则不能保证接下来被授予访问权限的是哪个线程。

### 使用锁替代同步块

为了增加等待线程的公平性，我们首先将代码块更改为由锁保护，而不是由同步块保护：

```java
public class Synchronizer{
  Lock lock = new Lock();
  public void doSynchronized() throws InterruptedException{
    this.lock.lock();
      //critical section, do a lot of work which takes a long time
    this.lock.unlock();
  }
}
```

请注意，doSynchronized（）方法不再声明为synchronized。 相反，临界区由lock.lock（）和lock.unlock（）调用保护。

Lock类的简单实现如下所示：

```java
public class Lock{
  private boolean isLocked      = false;
  private Thread  lockingThread = null;
  public synchronized void lock() throws InterruptedException{
    while(isLocked){
      wait();
    }
    isLocked      = true;
    lockingThread = Thread.currentThread();
  }
  public synchronized void unlock(){
    if(this.lockingThread != Thread.currentThread()){
      throw new IllegalMonitorStateException(
        "Calling thread has not locked this lock");
    }
    isLocked      = false;
    lockingThread = null;
    notify();
  }
}
```

查看上面的Synchronizer类并研究此Lock实现，你会注意到，如果多个线程同时调用lock（），则线程现在试图访问lock（）方法时被阻塞。 其次，如果锁被锁定，则线程在lock（）方法的while（isLocked）循环内的wait（）调用中被阻塞。 请记住，调用wait（）的线程会释放Lock实例上的同步锁，因此等待进入lock（）的线程现在可以这样做。 结果是多个线程最终可能在lock（）内部调用了wait（）。

如果回头看doSynchronized（）方法，您会注意到lock（）和unlock（）状态之间的注释，这两个调用之间的代码需要花费很长的时间才能执行。 让我们进一步假设，与进入lock（）方法和调用wait（）相比，此代码需要花费较长的时间执行，因为该锁已被锁定。 这意味着在等待锁定锁并进入临界区时，大部分时间都花在了lock（）方法内部的wait（）调用中，而不是阻塞在尝试进入lock（）方法时。

如前所述，如果有多个线程在等待进入同步块，则同步块不能保证授予哪个线程访问权限。 wait（）也不保证在调用notify（）时唤醒了哪个线程。 因此，当前的Lock类版本与doSynchronized（）的synchronized 版本在公平性方面没有什么不同。 但是我们可以修改。

当前版本的Lock类调用自己的wait（）方法。 然而，如果每个线程在一个单独的对象上调用wait（），从而只有一个线程在各自对象上调用了wait（），则Lock类可以决定在哪个对象上调用notify（），从而实际上准确的选择要唤醒的线程 。

## 公平锁

下面展示了将原来的Lock类变成了一个公平锁，即FairLock。 你会发现，与前面展示的Lock类相比，在同步和wait（）/ notify（）上的实现有所变化。

确切地说，达成这个设计是从上一个Lock类开始的。说来话长，这涉及几个增量设计步骤，每个步骤都解决了上一步的问题：嵌套管程锁死，滑丝条件和[信号丢失](https://blog.csdn.net/GentelmanTsao/article/details/106279333)。 为了使文本简短，该讨论被省略了，但是每个步骤在该主题的相应文章中讨论（请参见上面的链接）。 重要的是，现在每个调用lock（）的线程都已排队，并且只有队列中的第一个线程才可以锁定FairLock实例（如果已解锁）。 所有其他线程将被暂存，直到它们到达队列的头部。

```java
public class FairLock {
    private boolean           isLocked       = false;
    private Thread            lockingThread  = null;
    private List<QueueObject> waitingThreads =
            new ArrayList<QueueObject>();
  public void lock() throws InterruptedException{
    QueueObject queueObject           = new QueueObject();
    boolean     isLockedForThisThread = true;
    synchronized(this){
        waitingThreads.add(queueObject);
    }
    while(isLockedForThisThread){
      synchronized(this){
        isLockedForThisThread =
            isLocked || waitingThreads.get(0) != queueObject;
        if(!isLockedForThisThread){
          isLocked = true;
           waitingThreads.remove(queueObject);
           lockingThread = Thread.currentThread();
           return;
         }
      }
      try{
        queueObject.doWait();
      }catch(InterruptedException e){
        synchronized(this) {
      waitingThreads.remove(queueObject); }
        throw e;
      }
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
      waitingThreads.get(0).doNotify();
    }
  }
}
```

```java
public class QueueObject {
  private boolean isNotified = false;
  public synchronized void doWait() throws InterruptedException {
    while(!isNotified){
        this.wait();
    }
    this.isNotified = false;
  }
  public synchronized void doNotify() {
    this.isNotified = true;
    this.notify();
  }
  public boolean equals(Object o) {
    return this == o;
  }
}
```

首先，你可能会注意到lock（）方法不再声明为synchronized， 而是仅将需要同步的块嵌套在synchronized块内。

FairLock创建一个新的QueueObject实例，并为每个调用lock（）的线程排队。 调用unlock（）的线程将获取队列头部的QueueObject并对其调用doNotify（），以唤醒在该对象上等待的线程。 这样，一次仅唤醒一个等待线程，而不唤醒所有等待线程。 这个部分决定着FairLock的公平性。

请注意，同一同步块内仍要测试并设置锁的状态，以免发生滑丝条件。

还要注意，QueueObject实际上是一个信号量。 doWait（）和doNotify（）方法将信号存储在QueueObject中。 这样做是为了避免导致信号丢失——由于线程在调用queueObject.doWait（）之前被另一个线程所抢占，而另一个线程又调用unlock（），从而调用queueObject.doNotify（）。 调用queueObject.doWait（）放置在synchronized（this）块之外，以避免嵌套管程锁死，因此，当在lock（）方法的synchronized（this）块内没有线程正在执行时，另一个线程实际上可以调用unlock（）。

最后，请注意在try-catch块内调用了queueObject.doWait（）。 如果抛出InterruptedException，线程将离开lock（）方法，我们需要将其出队。

## 性能上的说明

如果比较Lock和FairLock类，你会发现FairLock类的lock（）和unlock（）内部还有更多操作。 此额外的代码使FairLock成为比Lock稍慢的同步机制。 它对应用程序的影响取决于FairLock保护的临界区中的代码执行的时间。 执行时间越长，同步器增加的开销就越小。 当然，这也取决于此代码被调用的频率。
