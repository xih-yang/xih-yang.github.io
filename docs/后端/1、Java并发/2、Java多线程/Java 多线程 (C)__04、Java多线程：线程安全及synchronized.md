# 04、Java多线程：线程安全及synchronized
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/14.html
- 分类：Java并发
- 分组：Java 多线程 (C)
## 基础概念

## 线程安全

**线程安全**：线程安全是编程中的术语，指某个函数、函数库在并发（Concurrent）环境中被调用时，能够正确地处理多个线程之间的共享变量，使程序功能正确完成。我们就称之为线程安全，反之，线程不安全。

## 共享变量

进程是分配资源的基本单位，线程是执行的基本单位。多个线程之间可以共享一部分进程中的数据。在JVM中，Java**堆**和**方法区**的区域是多个线程共享的数据区域。也就是说，多个线程可以操作保存在堆或者方法区中的同一个数据。保存在堆和方法区中的变量就是Java中的共享变量。

### 变量类型

Java语言支持的变量类型有：

- **类变量（静态变量）** ：独立于方法之外的变量，用 static 修饰。分配在**方法区**（静态区，跟堆一样，被所有的线程共享）中。无论一个类创建了多少个对象，类只拥有类变量的一份拷贝。在第一次被访问时创建，在程序结束时销毁
- **实例变量（成员变量）** ：

独立于方法之外的变量，不过没有 static 修饰。分配在**堆内存**中，在方法、构造方法、或者语句块被执行的时候创建，当它们执行完成后，变量将会被销毁。
- **局部变量**：

类的方法中的变量，分配在**栈内存**中，在方法、构造方法、或者语句块被执行的时候创建，当它们执行完成后，变量将会被销毁。

```java
public class Variable{
    static int allClicks=0;    // 类变量
    String str="hello world";  // 实例变量
    public void method(){
        int i =0;  // 局部变量
    }
}
```

## 线程不安全案例

**1、** 创建抢票线程；

```java
public class TicketWindow implements Runnable {
    private static int MAX = 100;
    @Override
    public void run() {
        // 抢票
        while (MAX > 0) {
            try {
                System.out.println(Thread.currentThread().getName() + "抢到第" + MAX-- + "张票");
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
    public TicketWindow() {
    }
}
```

**1、** 开启三个线程同时抢票；

```java
public class TicketWindowTest {
    public static void main(String[] args) {
        TicketWindow ticketWindow = new TicketWindow();
        Thread t1 = new Thread(ticketWindow, "001");
        Thread t2 = new Thread(ticketWindow, "002");
        Thread t3 = new Thread(ticketWindow, "003");
        t1.start();
        t2.start();
        t3.start();
    }
}
```

**1、** 启动抢票，出现线程不安全问题：多个线程会抢同一张票；

## synchronized

## 概念

多个线程同时操作共享资源时会引起的线程不安全问题。在JDK1.5版本以前，要解决这个问题需要使用synchronized关键字，synchronized提供了一种排他机制，也就是在同一时间只能有一个线程执行某些操作。

### 官网解释

synchronized关键字可以实现一个简单的策略来防止线程干扰和内存一致性错误，如果一个对象对多个线程是可见的，那么对该对象的所有读或者写都将通过同步的方式来进行,具体表现如下：

- synchronized关键字提供了一种锁的机制，能够确保共享变量的互斥访问，从而防止数据不一致问题的出现。
- synchronized关键字包括monitor enter 和 monitor exit两个JVM指令，它能够保证在任何时候任何线程执行到monitor enter成功之前都必须从主内存中获取数据，而不是从缓存中，在monitor exit运行成功之后，共享变量被更新后的值必须刷入主内存。
- synchronized的指令严格遵守java happens-before规则，一个monitor exit 指令之前必定要有一个monitor enter。

## 用法

synchronized可以用于对代码块或方法进行修饰，而不能够用于对class 以及变量进行修饰。下面将抢票的程序进行优化，解决不安全问题。

### 同步方法

在方法修饰符后添加synchronized关键字

```java
    public synchronized void ticket(){
            try {
                System.out.println(Thread.currentThread().getName() + "抢到第" + MAX-- + "张票");
                Thread.sleep(300);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
    }
```

### 同步代码块

synchronized代码块，并添加一个锁对象。

```java
public class TicketWindow implements Runnable {
    private static int MAX = 100;
    private final Object MUTEX = new Object();
    public void run() {
        // 抢票
        while (MAX > 0) {
            synchronized (MUTEX) {
                System.out.println(Thread.currentThread().getName() + "抢到第" + MAX-- + "张票");
            }
            try {
                TimeUnit.MILLISECONDS.sleep(100);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
```

### 注意事项

**1、** 使用synchronized代码块时，锁对象不能为null；

```java
    private final Object MUTEX = new Object();
```

**1、** 作用域；

由于synchronized关键字存在排他性，也就是说所有的线程必须串行地经过synchronized保护的共享区域，如果synchronized作用域越大，则代表着其效率越低，甚至还会丧失并发的优势，synchronized关键字应该尽可能地只作用于共享资源（数据)的读写作用域。

上述同步代码块案例应该这么写，否则会出现-1：

```java
            synchronized (MUTEX) {
                if (MAX > 0) {
                    System.out.println(Thread.currentThread().getName() + "抢到第" + MAX-- + "张票");
                }else {
                    break;
                }
            }
```

**1、** 锁对象；

同步代码块：传入的对象锁

同步方法：非静态方法为对象实例this作为对象锁，静态方法是使用class类锁
**2、** 同一个Runable实例；

Runnable实例作为线程逻辑执行单元传递给Thread时，应为同一个实例，不然起起到互斥的作用。
**3、** 多个锁的交叉导致死锁；

多个锁的交叉很容易引起线程出现死锁的情况

```java
            synchronized (MUTEX) {
                System.out.println(Thread.currentThread().getName() + "抢到第" + MAX-- + "张票");
                synchronized (MUTEX02) {
                    System.out.println(Thread.currentThread().getName() + "抢到第" + MAX-- + "张票");
                }
            }
```
