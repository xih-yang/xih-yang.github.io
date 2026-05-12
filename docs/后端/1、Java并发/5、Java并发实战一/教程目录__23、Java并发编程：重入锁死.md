# 23、Java并发编程：重入锁死
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/23.html
- 分类：Java并发
- 分组：教程目录
重入锁死是一种类似于[死锁](https://blog.csdn.net/GentelmanTsao/article/details/106331636)和[嵌套管程锁死](https://blog.csdn.net/GentelmanTsao/article/details/106404098)的情况。 重入锁死在[“锁”](https://blog.csdn.net/GentelmanTsao/article/details/106520225)和[“读/写锁”](https://blog.csdn.net/GentelmanTsao/article/details/106530480)一文中也有涉及。

如果线程重新进入Lock，ReadWriteLock或其他不可重入的同步器，则可能会发生重入锁死。 可重入是指已持有锁的线程可以重新获取该锁。 Java的同步块是可重入的。 因此，以下代码可以正常工作：

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

请注意，outer（）和inner（）都被声明为synchronized，这在Java中等效于synchronized（this）块。 如果线程调用external（），则从external（）内部调用inner（）不会有问题，因为两个方法（或块）都在同一个管程对象（“ this”）上同步。 如果线程已经拥有管程对象上的锁，则它可以访问在同一管程对象上同步的所有块。 这称为重入。 线程可以重新进入已持有锁的任何代码块。

以下Lock实现是不可重入的：

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

如果线程两次调用lock（）而不在其间调用unlock（），则第二次调用lock（）将阻塞。 发生了重入锁死。

有两种做法可以避免重入锁死：

- 避免编写出重新进入锁的代码
- 使用可重入锁

这两种做法哪种最适合你的项目，取决于具体情况。 可重入锁的性能通常不如不可重入锁，并且很难实现，但对于你的情况来说可能算不上是问题。代码用重入锁是否更易于实现必须视情况而定。

## 翻译花絮：

**原文：**

Whether or not your code is easier to implement with or without

lock reentrance must be determined case by case.

**解析：**

whether or not, with or without: 表示是或不是，用或不用，语义有重叠，所以翻译可以合并；

case by case：逐个情况；

**译文：**

代码用重入锁是否更易于实现必须视情况而定。
