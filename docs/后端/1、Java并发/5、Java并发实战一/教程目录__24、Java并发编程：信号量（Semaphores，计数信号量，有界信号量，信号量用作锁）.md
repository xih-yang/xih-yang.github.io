# 24、Java并发编程：信号量（Semaphores，计数信号量，有界信号量，信号量用作锁）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/24.html
- 分类：Java并发
- 分组：教程目录
信号量是一种线程同步结构，可用于在线程之间发送信号以避免信号丢失，或像使用锁一样保护临界区。 Java 5在java.util.concurrent包中附带了信号量实现，因此你不必实现自己的信号量。 尽管如此，了解其实现和使用背后的理论还是很有用的。

## 简单的信号量

如下是一个简单的信号量实现：

```java
public class Semaphore {
  private boolean signal = false;
  public synchronized void take() {
    this.signal = true;
    this.notify();
  }
  public synchronized void release() throws InterruptedException{
    while(!this.signal) wait();
    this.signal = false;
  }
}
```

take（）方法发送一个信号，该信号存储在信号量内部。 release（）方法等待信号。 收到信号标志后，将再次将其清除，并退出release（）方法。

使用这样的信号量可以避免信号丢失。 用take（）代替notify（），以及用release（）代替wait（）。 如果对take（）的调用发生在对release（）的调用之前，则调用release（）的线程仍会知道take（）被调用了，因为信号存储在内部的signal变量中。 使用wait（）和notify（）不会存储信号。

当使用信号量进行信号传递时，方法名take（）和release（）似乎有点奇怪。 该名称源于信号量作为锁来使用，如本文后面所述。 在这种情况下，该方法名更有意义。

## 使用信号量传递信号

如下是一个简化示例，两个线程使用信号量互相发信号：

```java
Semaphore semaphore = new Semaphore();
SendingThread sender = new SendingThread(semaphore);
ReceivingThread receiver = new ReceivingThread(semaphore);
receiver.start();
sender.start();
```

```java
public class SendingThread {
  Semaphore semaphore = null;
  public SendingThread(Semaphore semaphore){
    this.semaphore = semaphore;
  }
  public void run(){
    while(true){
      //do something, then signal
      this.semaphore.take();
    }
  }
}
```

```java
public class RecevingThread {
  Semaphore semaphore = null;
  public ReceivingThread(Semaphore semaphore){
    this.semaphore = semaphore;
  }
  public void run(){
    while(true){
      this.semaphore.release();
      //receive signal, then do something...
    }
  }
}
```

## 计数信号量

上一节中的Semaphore实现不计算take（）方法发送信号的次数。 我们可以更改Semaphore来做到这一点。 这称为计数信号量。 如下是计数信号量的简单实现：

```java
public class CountingSemaphore {
  private int signals = 0;
  public synchronized void take() {
    this.signals++;
    this.notify();
  }
  public synchronized void release() throws InterruptedException{
    while(this.signals == 0) wait();
    this.signals--;
  }
}
```

## 有界信号量

CoutingSemaphore没有存储信号数量的上限。 我们可以将信号量的实现更改为有上限的，如下所示：

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

请注意，如果信号数量等于上限，则take（）方法现在会阻塞。 如果BoundedSemaphore已达到其信号上限，则调用take（）的线程不再允许传递其信号，直到某个线程调用release（）。

## 将信号量用作锁

可以将有界信号量用作锁。 为此，请将上限设置为1，并调用take（）和release（）来保护临界区。 如下是一个例子：

```java
BoundedSemaphore semaphore = new BoundedSemaphore(1);
...
semaphore.take();
try{
  //critical section
} finally {
  semaphore.release();
}
```

与使用信号相比，方法take（）和release（）现在由同一线程调用。 由于只允许一个线程使用信号量，因此所有调用take（）的其他线程都将被阻塞，直到调用release（）为止。 由于总是先调用take（），因此release（）的调用永远不会阻塞。

你还可以使用有界信号量来限制代码段中允许的线程数。 例如，在上面的示例中，如果将BoundedSemaphore的限制设置为5，情况会怎么样呢？ 那样的话，一次允许5个线程进入临界区。 但是，你必须确保这5个线程的线程操作不会冲突，否则应用程序将出错。

从finally块内部调用release（）方法以确保即使从临界区抛出异常也能被调用到。
