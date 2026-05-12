# 22、Java并发编程：Java中的读/写锁（可重入锁，完全可重入的ReadWriteLock）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/22.html
- 分类：Java并发
- 分组：教程目录
Java中的读/写锁比《java中的锁》一文中示例的Lock实现更复杂。设想，你有一个应用程序可以读写一些资源，但是写资源操作没有读取资源那样多。 两个线程读取同一资源不会彼此造成问题，因此，要读取资源的多个线程可以同时被授予访问权限，这可以重叠。 但是，如果某个线程想要写入资源，则在同一时刻不可以进行其他读取或写入。 要解决允许多个读线程但只有一个写线程的问题，你需要一个读/写锁。

Java 5在java.util.concurrent包中附带了读/写锁定实现。 即使这样，了解其实现背后的理论仍然是有用的。

## Java读/写锁的实现

首先，让我们总结一下获得资源的读写访问权的条件：

**读取访问权**

没有线程在写，并且没有线程请求写访问。

**写入访问权**

没有线程正在读取或写入。

如果线程想要读取资源，只要没有线程正在写入资源，并且没有线程请求对资源进行写访问，则可以。 我们只需优先处理写访问请求，即假设写请求比读请求更重要。 此外，如果读取操作最频繁，而我们没有提升写入优先级，则可能会发生饥饿。 请求写访问权限的线程会被阻塞，直到所有读线程都解锁了ReadWriteLock为止，。 如果新线程不断地获取到读取访问权限，则等待写入访问权限的线程将始终保持阻塞状态，从而导致饥饿。 因此，仅当没有线程正锁定ReadWriteLock进行写入，或请求锁定ReadWriteLock进行写入时，才可以授予线程读访问权限。

当没有线程在读或写资源时，想要获得写资源权限的线程可以被授予相应的权限。 不用考虑有多少个线程以及以哪种顺序请求了写访问权限，除非您想保证请求写访问的线程之间的公平性。

牢记这些简单的规则，我们可以实现一个如下的ReadWriteLock：

```java
public class ReadWriteLock{
  private int readers       = 0;
  private int writers       = 0;
  private int writeRequests = 0;
  public synchronized void lockRead() throws InterruptedException{
    while(writers > 0 || writeRequests > 0){
      wait();
    }
    readers++;
  }
  public synchronized void unlockRead(){
    readers--;
    notifyAll();
  }
  public synchronized void lockWrite() throws InterruptedException{
    writeRequests++;
    while(readers > 0 || writers > 0){
      wait();
    }
    writeRequests--;
    writers++;
  }
  public synchronized void unlockWrite() throws InterruptedException{
    writers--;
    notifyAll();
  }
}
```

ReadWriteLock有两个锁定方法和两个解锁方法。 一种锁定和解锁方法用于读访问，一种锁定和解锁方法用于写访问。

读取访问的规则在lockRead（）方法中实现。 除非存在具有写访问权限的线程，或者一个或多个线程请求写访问权限，否则所有线程都具有读访问权限。

用于写访问的规则在lockWrite（）方法中实现。 想要写访问权限的线程通过请求写访问权限（writeRequests ++）开始。 然后它将检查它是否真的可以获取写访问权限。 如果没有线程具有对资源的读访问权，也没有线程具有对资源的写访问权，则线程可以获得写访问权限。 有多少个线程请求写访问权限无关紧要。

值得注意的是，unlockRead（）和unlockWrite（）都调用notifyAll（）而不是notify（）。 为什么要这么做？请设想以下情形：

在ReadWriteLock内部，有等待读取的线程和等待写入的线程。 如果notify（）唤醒的线程是读线程，则它会返回等待状态，因为有线程在等待写访问权限。 但是，等待写入的线程没有一个被唤醒，因此其他什么也没发生。 没有任何线程获得读或写访问权限。 通过调用noftifyAll（），所有正在等待的线程都将被唤醒，并检查它们是否可以获得所需的访问权限。

调用notifyAll（）还有一个优点。 如果有多个线程正在等待读取权限，而没有线程在等待写入权限，并且已调用了unlockWrite（），则所有等待读取的线程都会被立即授予读取访问权限，而不是一个接一个。

## 读/写锁的可重入性

前面示例的ReadWriteLock类不是可重入的。 如果具有写访问权的线程再次请求它，则它将阻塞，因为已经有一个写线程了——它自己。 此外，请考虑这种情况：

**1、** 线程1获得读取访问权限；

**2、** 线程2请求写访问权限，但由于有一个读线程而被阻塞；

**3、** 线程1重新请求读取访问权限（重新进入该锁），但由于存在写请求而被阻塞；

在这种情况下，上面的ReadWriteLock将被锁定——这种情况类似于死锁。 不管是请求读取还是写入，线程都无法获得权限。

要使ReadWriteLock可重入，必须进行一些更改。 分别处理读线程和写线程的可重入性。

## 读锁重入

为了使ReadWriteLock对读线程可重入，我们首先要建立读锁重入的规则：

- 如果线程可以获取读取访问权限（无写入线程或写入请求），或者它已经拥有读取访问权限（不管有没有写入请求），则授予该线程读锁重入权限。

为了确定某个线程是否已经具有读取访问权限，将每个已授予读取访问权限的线程的引用保留在Map中，还包含其已获得读取锁定的次数。 在确定是否可以授予读取访问权限时，将检查此Map以获取调用线程的引用。 下面是修改后的lockRead（）和unlockRead（）方法：

```java
public class ReadWriteLock{
  private Map<Thread, Integer> readingThreads =
      new HashMap<Thread, Integer>();
  private int writers        = 0;
  private int writeRequests  = 0;
  public synchronized void lockRead() throws InterruptedException{
    Thread callingThread = Thread.currentThread();
    while(! canGrantReadAccess(callingThread)){
      wait();                                                                   
    }
    readingThreads.put(callingThread,
       (getAccessCount(callingThread) + 1));
  }
  public synchronized void unlockRead(){
    Thread callingThread = Thread.currentThread();
    int accessCount = getAccessCount(callingThread);
    if(accessCount == 1){
      readingThreads.remove(callingThread); }
    else {
      readingThreads.put(callingThread, (accessCount -1)); }
    notifyAll();
  }
  private boolean canGrantReadAccess(Thread callingThread){
    if(writers > 0)            return false;
    if(isReader(callingThread) return true;
    if(writeRequests > 0)      return false;
    return true;
  }
  private int getReadAccessCount(Thread callingThread){
    Integer accessCount = readingThreads.get(callingThread);
    if(accessCount == null) return 0;
    return accessCount.intValue();
  }
  private boolean isReader(Thread callingThread){
    return readingThreads.get(callingThread) != null;
  }
}
```

如你所见，读锁重入仅在当前没有线程写入资源时才被授予。 此外，如果调用线程已经具有读取访问权限，则此优先级高于所有写入请求。

## 写锁重入

仅当线程已经拥有写访问权限时，才授予写锁重入权限。 以下是修改后lockWrite（）和unlockWrite（）方法：

```java
public class ReadWriteLock{
    private Map<Thread, Integer> readingThreads =
        new HashMap<Thread, Integer>();
    private int writeAccesses    = 0;
    private int writeRequests    = 0;
    private Thread writingThread = null;
  public synchronized void lockWrite() throws InterruptedException{
    writeRequests++;
    Thread callingThread = Thread.currentThread();
    while(! canGrantWriteAccess(callingThread)){
      wait();
    }
    writeRequests--;
    writeAccesses++;
    writingThread = callingThread;
  }
  public synchronized void unlockWrite() throws InterruptedException{
    writeAccesses--;
    if(writeAccesses == 0){
      writingThread = null;
    }
    notifyAll();
  }
  private boolean canGrantWriteAccess(Thread callingThread){
    if(hasReaders())             return false;
    if(writingThread == null)    return true;
    if(!isWriter(callingThread)) return false;
    return true;
  }
  private boolean hasReaders(){
    return readingThreads.size() > 0;
  }
  private boolean isWriter(Thread callingThread){
    return writingThread == callingThread;
  }
}
```

注意，在确定调用线程是否可以得到写访问权限时，现在要考虑当前持有写锁的线程。

## 读锁到写锁重入

有时，拥有读取访问权限的线程也需要获得写入访问权限。 为此，线程必须是唯一的读线程。 为了实现这一点，要稍微更改writeLock（）方法。 像下面这样：

```java
public class ReadWriteLock{
    private Map<Thread, Integer> readingThreads =
        new HashMap<Thread, Integer>();
    private int writeAccesses    = 0;
    private int writeRequests    = 0;
    private Thread writingThread = null;
  public synchronized void lockWrite() throws InterruptedException{
    writeRequests++;
    Thread callingThread = Thread.currentThread();
    while(! canGrantWriteAccess(callingThread)){
      wait();
    }
    writeRequests--;
    writeAccesses++;
    writingThread = callingThread;
  }
  public synchronized void unlockWrite() throws InterruptedException{
    writeAccesses--;
    if(writeAccesses == 0){
      writingThread = null;
    }
    notifyAll();
  }
  private boolean canGrantWriteAccess(Thread callingThread){
    if(isOnlyReader(callingThread))    return true;
    if(hasReaders())                   return false;
    if(writingThread == null)          return true;
    if(!isWriter(callingThread))       return false;
    return true;
  }
  private boolean hasReaders(){
    return readingThreads.size() > 0;
  }
  private boolean isWriter(Thread callingThread){
    return writingThread == callingThread;
  }
  private boolean isOnlyReader(Thread thread){
      return readers == 1 && readingThreads.get(callingThread) != null;
      }
}
```

现在，ReadWriteLock类是读锁到写锁访问可重入的。

## 写锁到读锁重入

有时具有写访问权的线程也需要读访问权。 如果写线程请求读访问权，则应始终授予。 如果一个线程拥有写访问权限，则其他线程都不能有读或写访问权限，因此这样做并不危险。 更改后的canGrantReadAccess（）方法如下所示：

```java
public class ReadWriteLock{
    private boolean canGrantReadAccess(Thread callingThread){
      if(isWriter(callingThread)) return true;
      if(writingThread != null)   return false;
      if(isReader(callingThread)  return true;
      if(writeRequests > 0)       return false;
      return true;
    }
}
```

## 完全可重入的ReadWriteLock

下面是完全可重入的ReadWriteLock实现。 我对访问条件进行了一些重构，以使它们更易于阅读，从而更容易使自己确信它们是正确的。

```java
public class ReadWriteLock{
  private Map<Thread, Integer> readingThreads =
       new HashMap<Thread, Integer>();
   private int writeAccesses    = 0;
   private int writeRequests    = 0;
   private Thread writingThread = null;
  public synchronized void lockRead() throws InterruptedException{
    Thread callingThread = Thread.currentThread();
    while(! canGrantReadAccess(callingThread)){
      wait();
    }
    readingThreads.put(callingThread,
     (getReadAccessCount(callingThread) + 1));
  }
  private boolean canGrantReadAccess(Thread callingThread){
    if( isWriter(callingThread) ) return true;
    if( hasWriter()             ) return false;
    if( isReader(callingThread) ) return true;
    if( hasWriteRequests()      ) return false;
    return true;
  }
  public synchronized void unlockRead(){
    Thread callingThread = Thread.currentThread();
    if(!isReader(callingThread)){
      throw new IllegalMonitorStateException("Calling Thread does not" +
        " hold a read lock on this ReadWriteLock");
    }
    int accessCount = getReadAccessCount(callingThread);
    if(accessCount == 1){
      readingThreads.remove(callingThread); }
    else {
      readingThreads.put(callingThread, (accessCount -1)); }
    notifyAll();
  }
  public synchronized void lockWrite() throws InterruptedException{
    writeRequests++;
    Thread callingThread = Thread.currentThread();
    while(! canGrantWriteAccess(callingThread)){
      wait();
    }
    writeRequests--;
    writeAccesses++;
    writingThread = callingThread;
  }
  public synchronized void unlockWrite() throws InterruptedException{
    if(!isWriter(Thread.currentThread()){
      throw new IllegalMonitorStateException("Calling Thread does not" +
        " hold the write lock on this ReadWriteLock");
    }
    writeAccesses--;
    if(writeAccesses == 0){
      writingThread = null;
    }
    notifyAll();
  }
  private boolean canGrantWriteAccess(Thread callingThread){
    if(isOnlyReader(callingThread))    return true;
    if(hasReaders())                   return false;
    if(writingThread == null)          return true;
    if(!isWriter(callingThread))       return false;
    return true;
  }
  private int getReadAccessCount(Thread callingThread){
    Integer accessCount = readingThreads.get(callingThread);
    if(accessCount == null) return 0;
    return accessCount.intValue();
  }
  private boolean hasReaders(){
    return readingThreads.size() > 0;
  }
  private boolean isReader(Thread callingThread){
    return readingThreads.get(callingThread) != null;
  }
  private boolean isOnlyReader(Thread callingThread){
    return readingThreads.size() == 1 &&
           readingThreads.get(callingThread) != null;
  }
  private boolean hasWriter(){
    return writingThread != null;
  }
  private boolean isWriter(Thread callingThread){
    return writingThread == callingThread;
  }
  private boolean hasWriteRequests(){
      return this.writeRequests > 0;
  }
}
```

## 从finally子句中调用unlock（）

当使用ReadWriteLock保护临界区时，临界区可能会抛出异常，所以应该从从finally子句内部调用readUnlock（）和writeUnlock（）方法。 这样做可以确保ReadWriteLock可以解锁，以便其他线程可以锁定它。 下面是一个例子：

```java
lock.lockWrite();
try{
  //do critical section code, which may throw exception
} finally {
  lock.unlockWrite();
}
```

这个小结构可以确保在临界区的代码中抛出异常时，ReadWriteLock可以解锁。 如果未从finally子句中调用unlockWrite（），并且从临界区抛出了异常，则ReadWriteLock将永远保持写锁定，从而导致该ReadWriteLock实例上调用lockRead（）或lockWrite（）的所有线程一直暂停 。 再次解锁ReadWriteLock的唯一方法是在ReadWriteLock可重入的前提下，引发异常时锁定该锁的线程随后又成功锁定它，执行临界区并随后再次调用unlockWrite（）。 那样才能再次解锁ReadWriteLock。 但是，为什么要等这种情况发生呢？ 如果发生异常怎么办？从finally子句中调用unlockWrite（）是一个更可靠的解决方案。
