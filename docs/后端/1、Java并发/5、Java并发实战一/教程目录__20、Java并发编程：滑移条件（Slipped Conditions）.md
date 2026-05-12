# 20、Java并发编程：滑移条件（Slipped Conditions）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/20.html
- 分类：Java并发
- 分组：教程目录
## 什么是滑移条件？

滑移条件是指，一个线程从检查了某个条件到对其执行操作的时间内，该条件被另一个线程更改，从而使第一个线程操作出错。 下面是一个简单的示例：

```java
public class Lock {
    private boolean isLocked = true;
    public void lock(){
      synchronized(this){
        while(isLocked){
          try{
            this.wait();
          } catch(InterruptedException e){
            //do nothing, keep waiting
          }
        }
      }
      synchronized(this){
        isLocked = true;
      }
    }
    public synchronized void unlock(){
      isLocked = false;
      this.notify();
    }
}
```

请注意lock（）方法包含两个同步块。 第一个块等待，直到isLocked为false。 第二个块将isLocked设置为true，以锁定Lock实例，不让其他线程访问。

假设isLocked为false，并且两个线程同时调用lock（）。 如果第一个线程刚好抢占并进入第一个同步块，则该线程将检查isLocked并发现它为false。 如果现在允许第二个线程执行，从而进入第一个同步块，则该线程也将看到isLocked是false。 现在，两个线程读到的条件都是false。 然后，两个线程都将进入第二个同步块，将isLocked设置为true并继续执行。

这种情况是滑移条件的一个例子。 两个线程都检测条件，然后退出同步块，从而允许其他线程检测该条件，之后两个线程中的一个才为后续线程更改条件。 换句话说，从检查条件开始到该线程为后续线程更改条件之前，条件一直在打滑。

为了避免滑移条件，条件的测试和设置必须由执行该操作的线程自动进行，这意味着，在第一个线程测试和设置条件的时间内，其他线程不可以检测该条件。

上面示例中的解决方案很简单。 只需将isLocked = true；这行移到第一个同步块中，在while循环之后。 像下面这样：

```java
public class Lock {
    private boolean isLocked = true;
    public void lock(){
      synchronized(this){
        while(isLocked){
          try{
            this.wait();
          } catch(InterruptedException e){
            //do nothing, keep waiting
          }
        }
        isLocked = true;
      }
    }
    public synchronized void unlock(){
      isLocked = false;
      this.notify();
    }
}
```

现在，isLocked条件的测试和设置是在同一个同步块内部自动完成的。

## 更现实的示例

你可能会理直气壮地说，你永远不会像本文中所示的第一个实现那样实现Lock，因此断言滑移条件只不过是理论上存在的问题。 但是第一个示例之所以设计得这么简单是为了更好地传达滑移条件的概念。

一个更现实的例子是在公平锁的实现中，如[《饥饿和公平篇》](https://blog.csdn.net/GentelmanTsao/article/details/106382176)中所述。 如果我们看看[《嵌套管程锁死篇》](https://blog.csdn.net/GentelmanTsao/article/details/106404098)中的那个稚拙的实现，并尝试消除嵌套管程锁死问题，那么很容易得出带有滑移条件的实现。 首先，我们看一下《嵌套管程锁死》篇中的示例：

```java
//公平锁的实现，存在嵌套管程锁定问题
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
      QueueObject queueObject = waitingThread.get(0);
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

请注意，synchronized（queueObject）连同其queueObject.wait（）调用嵌套在synchronized（this）块内，从而导致嵌套管程锁死问题。 为避免此问题，必须将synchronized（queueObject）块移到Synchronized（this）块之外。 像下面这样：

```java
//公平锁的实现，存在滑移条件问题
public class FairLock {
  private boolean           isLocked       = false;
  private Thread            lockingThread  = null;
  private List<QueueObject> waitingThreads =
            new ArrayList<QueueObject>();
  public void lock() throws InterruptedException{
    QueueObject queueObject = new QueueObject();
    synchronized(this){
      waitingThreads.add(queueObject);
    }
    boolean mustWait = true;
    while(mustWait){
      synchronized(this){
        mustWait = isLocked || waitingThreads.get(0) != queueObject;
      }
      synchronized(queueObject){
        if(mustWait){
          try{
            queueObject.wait();
          }catch(InterruptedException e){
            waitingThreads.remove(queueObject);
            throw e;
          }
        }
      }
    }
    synchronized(this){
      waitingThreads.remove(queueObject);
      isLocked = true;
      lockingThread = Thread.currentThread();
    }
  }
}
```

注意：仅展示lock（）方法，因为我只修改了这个方法。

请注意，lock（）方法现在包含3个同步块。

第一个sync（this）块通过设置mustWait = isLocked || waitingThreads.get(0) != queueObject来检查条件。

第二个synchronized（queueObject）块检查线程是否要等待。 此时，另一个线程可能已经解除了锁定，但是我们暂且不管。 假设锁已解锁，那么线程立即退出了synchronized（queueObject）块。

第三个synchronized（this）块仅当mustWait = false时才执行。 这会将条件isLocked设置回true，并离开lock（）方法。

设想，如果两个线程在锁解锁时同时调用lock（）将会发生什么。首先，线程1将检查isLocked条件，并发现它是false。 然后线程2将执行相同的操作。 然后它们都不等待，并且都将状态isLocked设置为true。 这是滑移条件的典型例子。

## 消除滑移条件问题

要从上面的示例中消除滑移条件问题，必须将最后一个synchronized（this）块的内容上移到第一个块中。 当然，为了适应这一变化，代码自然也必须稍作更改。 像下面这样：

```java
//公平锁的实现，不存在嵌套管程锁死问题
//但存在信号丢失问题
public class FairLock {
  private boolean           isLocked       = false;
  private Thread            lockingThread  = null;
  private List<QueueObject> waitingThreads =
            new ArrayList<QueueObject>();
  public void lock() throws InterruptedException{
    QueueObject queueObject = new QueueObject();
    synchronized(this){
      waitingThreads.add(queueObject);
    }
    boolean mustWait = true;
    while(mustWait){
        synchronized(this){
            mustWait = isLocked || waitingThreads.get(0) != queueObject;
            if(!mustWait){
                waitingThreads.remove(queueObject);
                isLocked = true;
                lockingThread = Thread.currentThread();
                return;
            }
        } 
      synchronized(queueObject){
        if(mustWait){
          try{
            queueObject.wait();
          }catch(InterruptedException e){
            waitingThreads.remove(queueObject);
            throw e;
          }
        }
      }
    }
  }
}
```

注意，现在在同一个同步代码块中测试和设置局部变量mustWait。 还要注意，即使在synchronized（this）代码块之外也对mustWait局部变量进行了检查，在while（mustWait）子句中，mustWait变量的值也不会在synchronized（this）之外被改变。 一个将mustWait判断为false的线程也会自动设置内部条件（isLocked），所以其他线程检查该条件都回判断为true。

synchronized(this)块中的return语句不是必须的，而只是一个小的优化。如果线程不必等待（mustWait == false），则没有理由进入synchronized（queueObject）块并执行if（mustWait）子句。

细心的读者会注意到，上述公平锁的实现仍然存在信号丢失的问题。 设想，当线程调用lock（）时，FairLock实例被锁定。 在第一个synchronized(this)块之后mustWait为true。 再设想一下，调用lock（）的线程被抢占了，而锁定了锁的线程则调用了unlock（）。 如果查看前面所示的unlock（）实现，会注意到它调用queueObject.notify（）。 但是，由于在lock（）中等待的线程尚未调用queueObject.wait（），因此queueObject.notify（）无法被接收到。 信号丢失了。 当线程在调用queueObject.wait（）之后立即调用lock（）时，它将保持阻塞状态，直到其他线程调用unlock（），这可能永远也等不到。

信号丢失问题的原因在[“饥饿和公平篇”](https://blog.csdn.net/GentelmanTsao/article/details/106382176)中的FairLock实现有提到。在该篇中将QueueObject类改为一个信号量，有两个方法：doWait（）和doNotify（）。 这些方法在QueueObject内部存储并响应信号。 这样，即使在doWait（）之前调用了doNotify（），也不会丢失信号。
