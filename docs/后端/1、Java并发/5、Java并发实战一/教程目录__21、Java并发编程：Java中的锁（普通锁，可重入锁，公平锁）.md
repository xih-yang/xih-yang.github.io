# 21、Java并发编程：Java中的锁（普通锁，可重入锁，公平锁）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/21.html
- 分类：Java并发
- 分组：教程目录
锁是一种类似于同步块的线程同步机制，但是锁比Java的同步块更复杂。 锁（以及其他更高级的同步机制）是使用同步块创建的，因此我们无法完全抛弃synchronized关键字。

从Java 5开始，包java.util.concurrent.locks包含多个锁实现，因此不需要再实现自己的锁。 但是你仍然需要知道如何使用它们，并且了解其实现背后的理论仍然很有用。 有关更多详细信息，请参见我在java.util.concurrent.locks.Lock接口上的教程。

## 简单的锁

让我们从Java代码的同步块开始看：

```java
public class Counter{
  private int count = 0;
  public int inc(){
    synchronized(this){
      return ++count;
    }
  }
}
```

注意inc（）方法中的synchronized（this）块。 此块可确保一次只有一个线程可以执行return ++ count。 同步块中的代码本来可以更复杂，但是用简单的++ count足以说明要点。

Counter类还可以这样写，使用Lock而不是同步块：

```java
public class Counter{
  private Lock lock = new Lock();
  private int count = 0;
  public int inc(){
    lock.lock();
    int newCount = ++count;
    lock.unlock();
    return newCount;
  }
}
```

lock（）方法锁定Lock实例，因而所有调用lock（）的线程都被阻塞，直到执行unlock（）为止。

这是一个简单的Lock实现：

```java
public class Lock{
  private boolean isLocked = false;
  public synchronized void lock()
  throws InterruptedException{
    while(isLocked){
      wait();
    }
    isLocked = true;
  }
  public synchronized void unlock(){
    isLocked = false;
    notify();
  }
}
```

注意while（isLocked）循环，也称为“自旋锁”。 自旋锁以及方法wait（）和notify（）在[“线程信号”](https://blog.csdn.net/GentelmanTsao/article/details/106279333)一文中有详细介绍。 当isLocked为true时，调用lock（）的线程将停在wait（）中等待。 万一线程在没有收到notify（）调用的情况下从wait（）中意外返回（也称为[“虚假唤醒”](https://blog.csdn.net/GentelmanTsao/article/details/106279333)），则该线程会重新检查isLocked条件以查看是否可以安全进行，而不是仅仅假定被唤醒就表示可以安全进行。 如果isLocked为false，则线程退出while（isLocked）循环，并将isLocked设置为true，以锁定Lock实例而不给其他调用lock（）的线程使用。

当线程执行完[临界区](https://blog.csdn.net/GentelmanTsao/article/details/105767287)中的代码（lock（）和unlock（）之间的代码），线程将调用unlock（）。 执行unlock（）会将isLocked设置为false，并通知（唤醒）在lock（）方法中的wait（）中等待的某个线程（如果有的话）。

## 锁的可重入性

Java中的同步块是可重入的。 这意味着，如果Java线程进入了同步的代码块，从而锁定了同步该块的管程对象，则该线程可以进入在同一管程对象上同步的其他Java代码块。 见下面的例子：

```java
public class Reentrant{
  public synchronized outer(){
    inner();
  }
  public synchronized inner(){
    //do something
  }
}
```

请注意，outer（）和inner（）都被声明为synchronized，这在Java中等效于synchronized（this）块。 如果线程调用outer()，则从outer()内部调用inner（）没问题，因为两个方法（或块）都在同一个管程对象（“ this”）上同步。 如果线程已经拥有管程对象上的锁，则它可以访问在同一管程对象上同步的所有的块。 这称为重入性。 线程可以重新进入已经为其持有锁的任何代码块。

前面所示的锁实现不是可重入的。 如果我们像下面那样重写Reentrant类，则调用outer()的线程将阻塞在inner（）方法的lock.lock（）内部。

```java
public class Reentrant2{
  Lock lock = new Lock();
  public outer(){
    lock.lock();
    inner();
    lock.unlock();
  }
  public synchronized inner(){
    lock.lock();
    //do something
    lock.unlock();
  }
}
```

调用outer()的线程将首先锁定Lock实例。 然后它将调用inner（）。 在inner（）方法内部，线程将再次尝试锁定Lock实例。 这将失败（这意味着线程将被阻塞），因为Lock实例已在outside（）方法中被锁定了。

线程第二次调用lock（）时，因为没有先调用unlock（）而被阻塞，这个原因查看lock（）实现就很明显了。

```java
public class Lock{
  boolean isLocked = false;
  public synchronized void lock()
  throws InterruptedException{
    while(isLocked){
      wait();
    }
    isLocked = true;
  }
  ...
}
```

是否允许线程退出lock（）方法是由while循环（自旋锁）中的条件决定的。 当前的条件是isLocked必须为false才能允许此操作，而不管由哪个线程锁定。

要使Lock类可重入，我们需要做一些小改动：

```java
public class Lock{
  boolean isLocked = false;
  Thread  lockedBy = null;
  int     lockedCount = 0;
  public synchronized void lock()
  throws InterruptedException{
    Thread callingThread = Thread.currentThread();
    while(isLocked && lockedBy != callingThread){
      wait();
    }
    isLocked = true;
    lockedCount++;
    lockedBy = callingThread;
  }
  public synchronized void unlock(){
    if(Thread.curentThread() == this.lockedBy){
      lockedCount--;
      if(lockedCount == 0){
        isLocked = false;
        notify();
      }
    }
  }
  ...
}
```

请注意，while循环（自旋锁）现在将锁定Lock实例的线程也考虑在内。 如果锁被解锁（isLocked = false）或调用线程是锁定Lock实例的线程，则while循环将不会执行，因而调用lock（）的线程能够退出该方法。

另外，我们需要计算锁被同一线程锁定的次数。 否则，即使该锁已被多次锁定，一次调用unlock（）也会解锁该锁。 除非锁定该锁的线程调用unlock（）的次数lock（）一样，否则我们不希望锁被解锁。

lock类现在是可重入的了。

## 锁的公平性

Java的同步块无法保证尝试进入同步块的线程的访问顺序。 因此，如果许多线程一直在争夺对同一同步块的访问权，一个或多个线程有可能永远得不到访问权——该访问权始终会授予其他线程。 这称为饥饿。 为了避免这种情况，锁应该实现公平性。 由于本文中示例的Lock实现在内部使用同步块，因此它们不能保证公平性。 关于饥饿和公平性，在[《饥饿和公平性》](https://blog.csdn.net/GentelmanTsao/article/details/106382176)篇中有更详细的讨论。

## 从finally子句中调用unlock（）

当用Lock保护临界区时，临界区可能会引发异常，因此一定要从finally子句内部调用unlock（）方法。 这样做可以确保锁可以被解锁，以便其他线程可以锁定它。 这是一个例子：

```java
lock.lock();
try{
  //do critical section code, which may throw exception
} finally {
  lock.unlock();
}
```

这个小结构确保万一临界区中的代码引发异常时，锁可以解锁。 如果不从finally子句内部调用unlock（），并且从临界区抛出了异常，则Lock将永远保持锁定状态，从而导致在该Lock实例上调用lock（）的所有线程无限期地暂停。
