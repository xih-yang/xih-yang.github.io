# 16、Java并发编程：synchronized（1）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/6/16.html
- 分类：Java并发
- 分组：教程目录
在多线程并发访问资源（这类资源称为临街资源）的时候，由于割裂来了原子操作，所以会导致数据不一致的情况。为了避免这种情况，需要使用同步机制，同步机制能够保证多线程并发访问数据的时候不会出现数据不一致的情况。

一种同步机制是使用synchronized关键字，这种机制也称为互斥锁机制，这就意味着同一时刻只能有一个线程能够获取到锁，获得的锁也被称为互斥锁。其他需要获取该互斥锁的线程只能被阻塞，直到获取到该锁的线程释放锁。在Java中，每个类都有一个内置锁，之所以如此，是因为Java并发专家认为这样可以避免显式创建锁。

通过下面的代码可以直到synchronized到底是如何实现的：

```java
package com.ddkk.concurrency;
/**
 * DDKK.COM 弟弟快看，程序员编程资料站 16-4-3.
 */
public class Synchronied {
    public static void main(String[] args){
        synchronized (Synchronied.class){
        }
        a();
    }
    public static synchronized void a() {
    }
}
```

使用java -v Synchronized.class命令可以看到如下的结果：

```java
  public static void main(java.lang.String[]);
    descriptor: ([Ljava/lang/String;)V
    flags: ACC_PUBLIC, ACC_STATIC
    Code:
      stack=2, locals=3, args_size=1
         0: ldc          2                  // class com/rhwayfun/concurrency/Synchronied
         2: dup
         3: astore_1
         4: monitorenter
         5: aload_1
         6: monitorexit
         7: goto          15
        10: astore_2
        11: aload_1
        12: monitorexit
        13: aload_2
        14: athrow
        15: invokestatic 3                  // Method a:()V
        18: return
      Exception table:
         from    to  target type
             5     7    10   any
            10    13    10   any
      LineNumberTable:
        line 8: 0
        line 10: 5
        line 11: 15
        line 12: 18
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      19     0  args   [Ljava/lang/String;
  public static synchronized void a();
    descriptor: ()V
    flags: ACC_PUBLIC, ACC_STATIC, ACC_SYNCHRONIZED
    Code:
      stack=0, locals=0, args_size=0
         0: return
      LineNumberTable:
        line 15: 0
}
SourceFile: "Synchronied.java"
```

通过编译的class文件可以看到synchronized代码块使用了monitorenter和monitorexit两个指令分别获取锁标记和释放锁标记，而synchronized方法使用了ACC_SYNCHRONIZED来完成锁的获取与释放的。也就是锁的获取与释放synchronized关键字自动帮我们完成了。

对于使用synchronized关键字实现的同步机制由如下几点补充说明：

**1、** 如果同一个方法有多个线程访问，那么每个线程都有自己的线程拷贝（拷贝存储在工作内存中）；

**2、** 类的实例都有自己的对象锁，如果一个线程成功获取到该实例的对象锁那么当其他线程需要获取该实例的对象锁时，便需要阻塞等待，直到该实例的对象锁被成功释放对象锁可以作用在同步方法或者同步代码块中；

**3、** 如果不同的线程访问的是不同实例的对象锁，那么不会互相阻塞，因为不同实例的对象锁是不同的；

**4、** 获得实例的对象锁的线程会让其他想要获取相同对象锁的线程阻塞在synchronized代码外，比如由两个synchronized方法a()、b()，那么如果线程A成功进入了同步方法a()，那么该线程便获取了该实例（比如实例obj）的对象锁，而如果其他线程想要执行另一个同步方法b()，就会阻塞在外面，因为a()和b()持有的都是对象obj的对象锁；

**5、** 持有一个实例的对象锁不会阻止该线程被置换出来，也不会阻塞其他线程执行非synchronized方法，因为非synchronized方法执行的时候不需要获取实例的对象锁；

**6、** 使用同步代码块的时候，括号的对象可以为任意Object实例，当为this时，指的是当前对象的对象锁；

**7、** 类锁主要用于控制对static成员变量的并发访问；

**8、** synchronized块（可以是同步方法或者同步代码块）是可重入的，每次重入会把锁的计数器加1，每次退出将计数器减1，当计数器的值为0的时候，锁便被释放了；

**9、** JavaSE1.6为了减少获得锁和释放锁的性能消耗引入了偏向锁和轻量级锁，所以使用synchronized也没有那么重量级了；
