# 02、Java并发编程：Lock接口
- 来源：https://ddkk.com/zhuanlan/java/concurrency/4/22.html
- 分类：Java并发
- 分组：Java 并发基础 (B)
## 2.1 复习Synchronized

**1、** synchronized是Java中的关键字，是一种同步锁；

它修饰的对象有以下几种：

- 修饰一个代码段，被修饰的代码块称为同步语句块。作用范围是大括号括起来的代码，作用对象是调用这个代码块的对象。
- 修饰一个方法，被修饰的方法称为同步方法。作用范围是整个方法，作用对象是调用这个方法的对象。
- 修饰一个静态的方法，作用的范围是整个静态静态方法，作用的对象是这个类的所有对象。
- 修饰一个类，其作用范围是synchronized括号括起来的部分，作用的对象是这个类的所有对象。

**2、** 案例演示；

多线程编程步骤：

**1、** 创建资源类，在资源类创建属性和操作方法；

**2、** 创建多个线程，调用资源类的操作方法；

```java
package sync;
//创建一个资源类
public class SaleTicket {
    public static void main(String[] args) {
        Ticket ticket = new Ticket();
        new Thread(new Runnable() {
            @Override
            public void run() {
                for(int i = 0; i < 40; i++) {
                    ticket.sale();
                }
            }
        }, "thread1").start();
        new Thread(new Runnable() {
            @Override
            public void run() {
                for(int i = 0; i < 40; i++) {
                    ticket.sale();
                }
            }
        }, "thread2").start();
        new Thread(new Runnable() {
            @Override
            public void run() {
                for(int i = 0; i < 40; i++) {
                    ticket.sale();
                }
            }
        }, "thread3").start();
    }
}
class Ticket {
    //票数
    private int number = 30;
    //操作方法：卖票
    public synchronized void sale() {
        //判断：当前是否有票
        if(number > 0) {
            System.out.printf(Thread.currentThread().getName() + " ： 还剩%d张票" + "\n", --number);
        }
    }
}
```

synchronized关键字修饰了sale()方法，所以，当一个线程调用这个方法时，其他的线程只能等待。

synchronized关键字的上锁和解锁是程序自动完成的，接下来学习的Lock接口可以让我们自己来进行上锁和解锁。

## 2.2 Lock接口

### 介绍

Lock锁的实现提供了比使用同步方法和语句更广泛的锁操作，允许更灵活的结构。

Lock是一个类，而synchronized是关键字，是Java语言内置的。

Lock和synchronized有一点非常大的不同就是：采用synchronized不需要用户去手动释放锁，而Lock需要，否则可能导致死锁。

### 使用Lock锁的方法来进行上锁和解锁：

```java
class Ticket {
    //票数
    private int number = 30;
    //创建可重入锁
    private final ReentrantLock lock = new ReentrantLock();
    //卖票
    public void sale() {
        lock.lock();
        try{
            if(number > 0){
                System.out.printf(Thread.currentThread().getName() + ":" + "还剩%d张票\n", --number);
            }
        } finally {
            lock.unlock();
        }
    }
}
```

### 总结synchronized和Lock的区别

- Lock是一个接口，而synchronized是Java中的一个关键字，synchronized是内置的语言实现。
- synchronized在发生异常时，会自动释放线程占用的锁，因此不会有死锁现象；而Lock发生异常时，如果没有主动unlock()，将不会释放锁。这也是为什么通常使用try-catch结构来释放锁，将unlock()操作放在finally中。
- Lock可以让等待锁的线程响应中断，而synchronized不行，线程会一直等待下去，无法中断
- 使用Lock可以知道线程有没有成功获得锁，而synchronized无法办到。
- Lock可以提高多个线程读操作的效率。

从性能上来说，如果竞争不激烈，两者性能差不多；而当竞争很激烈时（比如有很多线程在竞争资源），Lock的性能要远远优于synchronized。
