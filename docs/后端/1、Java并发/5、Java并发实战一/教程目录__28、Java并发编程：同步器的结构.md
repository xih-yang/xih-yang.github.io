# 28、Java并发编程：同步器的结构
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/28.html
- 分类：Java并发
- 分组：教程目录
很多同步器（锁，信号量，阻塞队列等）虽然在功能上有所不同，但它们的内部设计通常没有太大不同。 换句话说，它们在内部由相同（或相似）的基本部分组成。 在设计同步器时，了解这些基本部分会很有帮助。 本文将重点讨论这些部分。

大多数（如果不是全部）同步器的目的是保护代码的某些区域（临界区）免受线程的并发访问。 为此，同步器中通常需要以下部分：

并非所有同步器都具有这些部分，而那些有这些部分的同步器也未必与此处所述完全相同。 不过，通常可以找到其中一个或多个部分。

## 状态

同步器的状态用于访问条件决定是否可以授予线程访问权限。 在Lock中，状态保存在一个boolean变量中，说明Lock是否被锁定。 在有界信号量中，内部状态保存在一个计数器（int）和一个上限（int）中，分别描述当前的“ takes”数量和“ takes”的最大数量。 在阻塞队列中，状态保留在队列中的元素列表以及最大队列大小（int）成员（如果有）中。

这是Lock和BoundedSemaphore的两个代码段。 状态代码以粗体标记。

public class Lock{

**//state is kept here

private boolean isLocked = false;**

public synchronized void lock()

throws InterruptedException{

while(isLocked){

wait();

}
isLocked = true;

}

…
}

public class BoundedSemaphore {

**//state is kept here

private int signals = 0;

private int bound = 0;**

public BoundedSemaphore(int upperBound){

this.bound = upperBound;

}

public synchronized void take() throws InterruptedException{

while(this.signals == bound) wait();

this.signal++;

this.notify();

}
…
}

## 访问条件

如果线程调用了“测试并设置状态”方法，访问条件决定了是否允许它设置状态。 访问条件通常基于同步器的状态，在while循环中检查，以防止虚假唤醒。 访问条件的检查结果是true或false。

在Lock中，访问条件只是检查isLocked成员变量的值。 在有界信号量中，实际上有两种访问条件，具体取决于是要“获取”还是“释放”信号量。 如果线程尝试获取信号量，则检查signals变量是否超出上限。 如果线程尝试释放信号量，则检查signals变量是否为0。

如下是Lock和BoundedSemaphore的两个代码段，访问条件用粗体标记。 注意始终在while循环中检查条件。

public class Lock{

private boolean isLocked = false;

public synchronized void lock()

throws InterruptedException{

**//access condition**

while(**isLocked**){

wait();

}
isLocked = true;

}

…
}

public class BoundedSemaphore {

private int signals = 0;

private int bound = 0;

public BoundedSemaphore(int upperBound){

this.bound = upperBound;

}

public synchronized void take() throws InterruptedException{

**//access condition**

while(**this.signals == bound**) wait();

this.signals++;

this.notify();

}

public synchronized void release() throws InterruptedException{

**//access condition**

while(**this.signals == 0**) wait();

this.signals–;

this.notify();

}
}

## 状态改变

一旦线程获得对临界区的访问权，它就必须更改同步器的状态，以（可能）阻止其他线程进入。 换句话说，状态需要反映一个事实，即有线程正在临界区内部执行。对于其他尝试获得访问权限的线程， 这将影响它们的访问条件。

在Lock中，状态更改是代码设置isLocked = true。 在信号量中，是signals–或者signals++。

如下是两个代码片段，其中状态更改代码以粗体显示：

public class Lock{

private boolean isLocked = false;

public synchronized void lock()

throws InterruptedException{

while(isLocked){

wait();

}
**//state change

isLocked = true;**

}

public synchronized void unlock(){

**//state change

isLocked = false;**

notify();

}
}

public class BoundedSemaphore {

private int signals = 0;

private int bound = 0;

public BoundedSemaphore(int upperBound){

this.bound = upperBound;

}

public synchronized void take() throws InterruptedException{

while(this.signals == bound) wait();

**//state change

this.signals++;**

this.notify();

}

public synchronized void release() throws InterruptedException{

while(this.signals == 0) wait();

**//state change

this.signals–;**

this.notify();

}
}

## 通知策略

一旦线程更改了同步器的状态，有时可能需要将状态更改通知其他正在等待的线程。 也许此状态更改会使其他线程的访问条件变为true。

通知策略通常分为三类。

**1、** 通知所有等待的线程；

**2、** 通知N个等待线程中随机的1个；

**3、** 通知N个等待线程中特定的1个；

通知所有正在等待的线程非常容易。 所有等待线程都在同一对象上调用wait（）。 每当线程想要通知等待的线程，它将某个对象上调用notifyAll（），该对象是等待的线程调用wait()的对象。

通知一个随机的等待线程也很容易。 只需让通知线程在某个对象上调用notify（），该对象是等待线程调用wait()的对象。 调用notify不能保证将通知哪个等待线程。 因此，这里用术语“随机等待线程”来表示。

有时可能需要通知特定的线程而不是随机的等待线程。 例如，如果需要保证以特定的顺序通知正在等待的线程，以它们调用同步器的顺序，或者以某些优先顺序。 为了实现这一点，每个等待线程必须在自己的单独对象上调用wait（）。 当通知线程想要通知特定的等待线程时，它将在该特定线程已调用wait（）的对象上调用notify（）。 在“饥饿与公平”一文中有这样一个例子。

下面是通知策略（通知1个随机等待线程，用粗体标记）的代码片段：

public class Lock{

private boolean isLocked = false;

public synchronized void lock()

throws InterruptedException{

while(isLocked){

**//wait strategy - related to notification strategy

wait();**

}
isLocked = true;

}

public synchronized void unlock(){

isLocked = false;

**notify(); //notification strategy**

}
}

## 检查并设置方法

同步器通常有两种类型的方法，其中第一种类型是检查并设置（另一种是设置）。 检查并设置是指调用此方法的线程**检查**同步器的内部状态是否满足访问条件。 如果满足条件，线程将**设置**同步器的内部状态以反映该线程已获得访问权限。

状态转换通常会导致其他尝试获取访问权限的线程的访问条件变为假，但可能并非总是如此。 例如，在“读写锁”中，获得读取访问权限的线程将更新读写锁的状态以反映该状态，但是只要没有线程请求写入访问权限，其他请求读取访问权限的线程也将被授予访问权限。

必须以原子方式执行“检查并设置”操作，这意味着在“检查并设置”方法的检查和状态设置之间不允许执行其他线程。

“检查并设置”方法的程序流程通常类似于以下内容：

**1、** 必要时在检查前设置状态；

**2、** 检查状态是否满足访问条件；

**3、** 如果不满足访问条件，继续等待；

**4、** 如果满足访问条件，设置状态，并在必要时通知等待线程；

下面显示的ReadWriteLock类的lockWrite（）方法是“检查并设置”方法的示例。 调用lockWrite（）的线程首先在检查之前设置状态（writeRequests ++）。 然后，它在canGrantWriteAccess（）方法中检查内部状态是否符合访问条件。 如果检查成功，则退出该方法之前，将再次设置内部状态。 请注意，此方法不会通知等待线程。

public class ReadWriteLock{

private Map readingThreads =

newHashMap();

```java
private int writeAccesses    = 0;
private int writeRequests    = 0;
private Thread writingThread = null;
```

**public synchronized void lockWrite() throws InterruptedException{

writeRequests++;

Thread callingThread = Thread.currentThread();

while(! canGrantWriteAccess(callingThread)){

wait();

}
writeRequests–;

writeAccesses++;

writingThread = callingThread;

}
}**

下面显示的BoundedSemaphore类具有两个“检查并设置”方法：take（）和release()。 两种方法都检查并设置内部状态。

```java
public class BoundedSemaphore {
  private int signals = 0;
  private int bound   = 0;
  public BoundedSemaphore(int upperBound){
    this.bound = upperBound;
  }
      public synchronized void take() throws InterruptedException{
      while(this.signals == bound) wait();
      this.signals++;
      this.notify();
      }
      public synchronized void release() throws InterruptedException{
      while(this.signals == 0) wait();
      this.signals--;
      this.notify();
      }
}
```

## 设置方法

设置方法是同步器通常包含的第二种方法。 设置方法仅设置同步器的内部状态，而无需先对其检查。 设置方法的一个典型示例是Lock类的unlock（）方法。 持有锁的线程可以总是直接解锁，而不必检查Lock是否已解锁。

设置方法的程序流通常遵循以下原则：

**1、** 设置内部状态；

**2、** 通知等待线程；

下面的示例是一个unlock()方法：

```java
public class Lock{
  private boolean isLocked = false;
      public synchronized void unlock(){
      isLocked = false;
      notify();
      }
}
```
