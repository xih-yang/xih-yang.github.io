# 15、Java并发编程：线程信号传递（忙等待，wait、notify、notifyall，信号丢失，虚假唤醒）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/15.html
- 分类：Java并发
- 分组：教程目录
线程信号传递的目的是使线程能够相互发送信号。另外，线程信号传递使线程能够等待来自其他线程的信号。例如，线程B可能会等待线程a发出的的信号，指示数据已准备好待处理。

## 通过共享对象发送信号

线程相互发送信号的一种简单方法是在某个共享对象变量中设置信号值。线程A可以在同步块内将布尔成员变量hasDataToProcess设置为true，线程B也可以在同步块内读取hasDataToProcess成员变量。下面是一个简单的对象示例，它可以保存这样的信号，并提供设置和检查它的方法：

```java
public class MySignal{
  protected boolean hasDataToProcess = false;
  public synchronized boolean hasDataToProcess(){
    return this.hasDataToProcess;
  }
  public synchronized void setHasDataToProcess(boolean hasData){
    this.hasDataToProcess = hasData;  
  }
}
```

线程A和B必须引用共享MySignal实例，才能使信令工作。如果线程A和线程B引用不同的MySignal实例，它们将不会互相检测信号。要处理的数据可以位于共享缓冲区中，与MySignal实例分离。

## 忙等待

处理数据的线程B正在等待数据可供处理。换言之，它正在等待来自线程a的信号，该信号会令hasDataToProcess（）返回true。这是线程B在等待此信号时运行的循环：

```java
protected MySignal sharedSignal = ...
...
while(!sharedSignal.hasDataToProcess()){
  //do nothing... busy waiting
}
```

注意while循环一直执行，直到hasDataToProcess（）返回true。这叫忙等待。线程等待时处于忙碌状态。

## wait(), notify() 和 notifyAll()

在运行等待线程的计算机中，忙等待没有很有效地利用CPU。除非平均等待时间很短，否则更有效的做法是，等待的线程能够以某种方式休眠或变为非活动状态，直到接收到正在等待的信号。

Java有一个内置的等待机制，使线程在等待信号时变为非活动状态。java.lang.Object类定义了三个方法，wait（）、notify（）和notifyAll（），以便实现。

线程对某个对象调用wait（）使自己变为非活动线程，直到另一个线程对该对象调用notify（）为止。要调用wait（）或notify（），调用线程必须首先获取该对象的锁。换句话说，调用线程必须从同步块内部调用wait（）或notify（）。下面是MySignal的一个修改版本，名为MyWaitNotify，它使用wait（）和notify（）。

```java
public class MonitorObject{
}
public class MyWaitNotify{
  MonitorObject myMonitorObject = new MonitorObject();
  public void doWait(){
    synchronized(myMonitorObject){
      try{
        myMonitorObject.wait();
      } catch(InterruptedException e){
     ...}
    }
  }
  public void doNotify(){
    synchronized(myMonitorObject){
      myMonitorObject.notify();
    }
  }
}
```

等待线程将调用doWait（），通知线程将调用doNotify（）。当线程调用对象的notify（）时，等待该对象的其中一个线程将被唤醒并允许执行。还有一个notifyAll（）方法，它将唤醒等待该对象的所有线程。

等待和通知线程都从同步块中调用wait（）和notify（）。这是必须的！如果线程不持有调用该方法的对象的锁，则不能调用wait（）、notify（）或notifyAll（）。否则，会引发IllegalMonitorStateException。

但是，这怎么可能呢？只要在同步块内执行，等待线程不就会保留monitor对象（myMonitorObject）上的锁吗？等待线程不会阻止通知线程进入doNotify（）中的synchronized块吗？不会阻止。一旦一个线程调用wait（），它就会释放在monitor对象上的锁。这允许其他线程也调用wait（）或notify（），因为这些方法必须在同步块内部调用。

线程被唤醒时，它不能直接退出wait（），而需等调用notify（）的线程离开其同步块。换句话说：唤醒的线程必须重新获取monitor对象上的锁，然后才能退出wait（），因为wait（）嵌套在同步块中。如果使用notifyAll（）唤醒多个线程，则一次只能有一个唤醒的线程可以退出wait（）方法，因为每个线程在退出wait（）之前必须依次获取monitor对象上的锁。

## 信号丢失

如果方法notify（）和notifyAll（）在调用时没有线程在等待，也不会保存该方法调用。因而通知信号就丢失了。因此，如果线程在等待线程调用wait（）之前调用notify（），则等待线程将错过该信号。这可能是问题，也可能不是问题，但在某些情况下，这可能会导致等待线程永远等待，永远不会唤醒，因为唤醒信号丢失了。

为了避免丢失信号，信号应该存储在发信号的类中。在MyWaitNotify示例中，通知信号应存储在MyWaitNotify实例内的成员变量中。这在下面的MyWaitNotify的修改版本中实现了：

```java
public class MyWaitNotify2{
  MonitorObject myMonitorObject = new MonitorObject();
  boolean wasSignalled = false;
  public void doWait(){
    synchronized(myMonitorObject){
      if(!wasSignalled){
        try{
          myMonitorObject.wait();
         } catch(InterruptedException e){
     ...}
      }
      //clear signal and continue running.
      wasSignalled = false;
    }
  }
  public void doNotify(){
    synchronized(myMonitorObject){
      wasSignalled = true;
      myMonitorObject.notify();
    }
  }
}
```

注意，在调用notify（）之前，doNotify（）方法将wasSignaled变量设置为true。另外，注意doWait（）方法在调用wait（）之前检查wasSignaled变量。事实上，只有前一个doWait（）调用和此调用之间没有收到信号时，才调用wait（）。

## 虚假唤醒

使没有调用notify（）和notifyAll（），线程也有可能被莫名其妙地唤醒。这就是所谓的虚假唤醒，无缘无故地醒来。

如果MyWaitNofity2类的doWait（）方法中出现虚假唤醒，则等待线程没有接收正确的信号就可以继续处理！这可能会导致应用程序出现严重问题。

为了防止虚假唤醒，要在while循环中而不是在if语句中检查信号成员变量。这种while循环也称为自旋锁。线程唤醒后会旋转，直到自旋锁（while循环）中的条件变为false。下面是MyWaitNotify2的修改版本，展示了自旋锁的用法：

```java
public class MyWaitNotify3{
  MonitorObject myMonitorObject = new MonitorObject();
  boolean wasSignalled = false;
  public void doWait(){
    synchronized(myMonitorObject){
      while(!wasSignalled){
        try{
          myMonitorObject.wait();
         } catch(InterruptedException e){
     ...}
      }
      //clear signal and continue running.
      wasSignalled = false;
    }
  }
  public void doNotify(){
    synchronized(myMonitorObject){
      wasSignalled = true;
      myMonitorObject.notify();
    }
  }
}
```

注意wait（）调用现在是嵌套在while循环中而不是if语句中。如果等待的线程在没有收到信号的情况下唤醒，则成员变量wassignaled仍然为false，while循环将再次执行，从而导致唤醒的线程返回到等待状态。

## 多个线程等待同一个信号

如果有多个线程在等待，while循环也是一个不错的解决方案，这些线程都是使用notifyAll（）唤醒的，但是应该只允许其中一个线程继续。一次只能有一个线程能够获得monitor对象上的锁，这意味着只有一个线程可以退出wait（）并清除wassignaled标志。一旦这个线程在doWait（）方法中退出synchronized块，其他线程就可以退出wait（）并检查while循环中的wassignaled成员变量。但是，第一个线程唤醒时清除了该标志，因此其余唤醒的线程返回等待状态，直到下一个信号到达。

## 不要对常量字符串或全局对象调用wait（）

本文在以前有一个版本的MyWaitNotify示例类使用常量字符串（“”）作为监视对象，如下所示：

```java
public class MyWaitNotify{
  String myMonitorObject = "";
  boolean wasSignalled = false;
  public void doWait(){
    synchronized(myMonitorObject){
      while(!wasSignalled){
        try{
          myMonitorObject.wait();
         } catch(InterruptedException e){
     ...}
      }
      //clear signal and continue running.
      wasSignalled = false;
    }
  }
  public void doNotify(){
    synchronized(myMonitorObject){
      wasSignalled = true;
      myMonitorObject.notify();
    }
  }
}
```

对空字符串或常量字符串调用wait（）和notify（）的问题是，JVM/编译器在内部将常量字符串转换为同一个对象。这意味着，即使有两个不同的MyWaitNotify实例，它们都引用同一个空字符串实例。这也意味着在第一个MyWaitNotify实例上调用doWait（）的线程有可能错误地被第二个MyWaitNotify实例上的doNotify（）调用唤醒。

这种情况如下图所示：

请记住，即使4个线程对同一个共享字符串实例调用wait（）和notify（），来自doWait（）和doNotify（）的信号也分别存储在两个MyWaitNotify实例中。对MyWaitNotify 1的doNotify（）调用可能会唤醒在MyWaitNotify 2中等待的线程，但该信号将仅存储在MyWaitNotify 1中。

起初，这似乎不是什么大问题。毕竟，如果在第二个MyWaitNotify实例上调用doNotify（），那么真正可能发生的是线程A和B被错误唤醒。此唤醒线程（A或B）将在while循环中检查其信号，并返回到waiting，因为在其等待的第一个MyWaitNotify实例上并未调用doNotify（）。这种情况相当于引起一次虚假觉醒。线程A或线程B在没有信号通知的情况下被唤醒。但是代码可以处理这个问题，所以线程返回到等待状态。

问题是，由于doNotify（）只调用了notify（）而不调用notifyAll（），即使4个线程在同一个字符串实例（空字符串）上等待，也只有一个线程被唤醒。因此，如果一个线程A或B被唤醒，而信号真正要给的是C或D，那么被唤醒的线程（A或B）将检查其信号，发现没有收到信号，然后返回等待。C或D都没有唤醒来检查它们实际应接收的信号，因此信号丢失。这种情况等同于前面描述的丢失信号问题。C和D收到了一个信号，但没有回应。

如果doNotify（）方法调用了notifyAll（）而不是notify（），则所有等待的线程都会依次被唤醒并检查信号。线程A和B会回到等待状态，但是C或D中的一个会注意到这个信号，并离开doWait（）方法。C和D中的另一个将返回等待，因为检测到信号的线程在离开doWait（）时已将信号清除。

然后，你可能很想总是调用notifyAll（）而不是notify（），但这对性能不利。当只有一个线程可以响应信号时，没有理由唤醒所有等待的线程。

所以：不要对wait（）/notify（）机制使用全局对象、字符串常量等。对于使用对象的构造方法来说，对象应该是唯一的。例如，每个MyWaitNotify3（前面章节的示例）实例都有自己的MonitorObject实例，而不是使用空字符串进行wait（）/notify（）调用。
