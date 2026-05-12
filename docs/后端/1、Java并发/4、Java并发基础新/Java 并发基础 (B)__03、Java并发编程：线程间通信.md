# 03、Java并发编程：线程间通信
- 来源：https://ddkk.com/zhuanlan/java/concurrency/4/23.html
- 分类：Java并发
- 分组：Java 并发基础 (B)
## 3.1 多线程通信概述和案例

多线程编程步骤：

**1、** 创建资源类，在资源类创建属性和操作方法；

**2、** 在资源类操作方法：判断、干活、通知；

**3、** 创建多个线程，调用资源类的操作方法；

例子：

```java
有两个线程，
对一个初始化为0的变量，
一个对其进行加1操作（在值为0的情况下），一个对其进行减1操作（在值为1的情况下）
```

代码：

```java
package communicate;
//第一步 创建资源类，定义属性和操作方法
class Share {
    //初始值
    private int number = 0;
    //+1的方法
    public synchronized void incr() throws InterruptedException {
        //第二步 判断 干活 通知
        if(number == 1) {
            this.wait();
        }
        number++;
        System.out.println(Thread.currentThread().getName() + ":" + number);
        this.notifyAll();
    }
    //-1的方法
    public synchronized void decr() throws InterruptedException {
        if(number == 0) {
            this.wait();
        }
        number--;
        System.out.println(Thread.currentThread().getName() + ":" + number);
        this.notifyAll();
    }
}
public class ThreadDemo1 {
    public static void main(String[] args) {
        Share share = new Share();
        new Thread(()->{
            for(int i = 0; i < 10; i++) {
                try {
                    share.incr();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "增大线程").start();
        new Thread(()->{
            for(int i = 0; i < 10; i++) {
                try {
                    share.decr();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "减小线程").start();
    }
}
```

## 3.2 虚假唤醒问题

假设我们再增加一个`增大线程`和`减小线程`，也就是说有两个`增大线程`和两个`减小程`，现在就可能会出现虚假唤醒的问题：

```java
首先有两个前提：
1、wait()后，进程会释放锁
2、在哪里睡，就在哪里醒
3、被notifyAll()唤醒后，处于wait()状态的线程需要先竞争锁才能继续执行wait()后面的操作。
步骤：
1、假设有A、B、C、D四个线程，A和C是增加线程，B和D是减小线程
2、假设A和C均处于wait()状态，B调用notifyAll()后，C竞争到锁被唤醒，进行了+1操作。
3、C调用notifyAll()，将A唤醒，此时会将number值加到2。
那3（即那些大于2的值）是怎么来的？
1、在上面的第三步中，C调用notifyAll()后，A获得锁之前，C又拿到了锁并调用wait()阻塞了
2、此时A被唤醒，它的notifyAll()又能将C唤醒，所以会出现3。
```

解决办法：

将if改成while：

```java
package communicate;
//第一步 创建资源类，定义属性和操作方法
class Share {
    //初始值
    private int number = 0;
    //+1的方法
    public synchronized void incr() throws InterruptedException {
        //第二步 判断 干活 通知
        while(number == 1) {
            this.wait();
        }
        number++;
        System.out.println(Thread.currentThread().getName() + ":" + number);
        this.notifyAll();
    }
    //-1的方法
    public synchronized void decr() throws InterruptedException {
        while(number == 0) {
            this.wait();
        }
        number--;
        System.out.println(Thread.currentThread().getName() + ":" + number);
        this.notifyAll();
    }
}
```

## 3.3 Lock实现线程间通信

`lock.lock()`、`lock.unlock()`可以实现synchronized的效果

`condition.await()`、`condition.singalAll()`可以实现`wait()`和`notifyAll()`的效果

代码：

```java
package communicate;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
public class ThreadDemo2 {
    public static void main(String[] args) {
        AnotherShare share = new AnotherShare();
         new Thread(()->{
             for(int i = 0; i < 10; i++) {
                 try {
                     share.incr();
                 } catch (InterruptedException e) {
                     e.printStackTrace();
                 }
             }
         }, "A").start();
         new Thread(()->{
             for(int i = 0; i < 10; i++) {
                 try {
                     share.decr();
                 } catch (InterruptedException e) {
                     e.printStackTrace();
                 }
             }
         }, "B").start();
        new Thread(()->{
            for(int i = 0; i < 10; i++) {
                try {
                    share.incr();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "C").start();
        new Thread(()->{
            for(int i = 0; i < 10; i++) {
                try {
                    share.decr();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "D").start();
    }
}
//第一步，创建资源类，定义属性和方法
class AnotherShare {
    private int number = 0;
    //创建Lock
    private Lock lock = new ReentrantLock();
    private Condition condition = lock.newCondition();
    //+1操作
    public void incr() throws InterruptedException {
        //上锁
        lock.lock();
        try {
            while(number != 0) {
                condition.await();
            }
            number++;
            System.out.println(Thread.currentThread().getName() + ":" + number);
            condition.signalAll();
        } finally {
            lock.unlock();
        }
    }
    //-1操作
    public void decr() throws InterruptedException {
        //上锁
        lock.lock();
        try {
            while(number != 1) {
                condition.await();
            }
            number--;
            System.out.println(Thread.currentThread().getName() + ":" + number);
            condition.signalAll();
        } finally {
            lock.unlock();
        }
    }
}
```
