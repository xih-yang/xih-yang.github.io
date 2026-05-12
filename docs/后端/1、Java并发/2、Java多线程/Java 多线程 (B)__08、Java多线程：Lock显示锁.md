# 08、Java多线程：Lock显示锁
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/22.html
- 分类：Java并发
- 分组：Java 多线程 (B)
在JDK5中新增了Lock锁接口，有ReentrantLock实现类等。ReentrantLock锁称为可重入锁，它的功能要比synchronized多。

## 7.1 锁的可重入性

锁的可重入性是指，当一个线程获得一个对象锁后，再次请求该对象锁时，可以再次获得该对象的锁。

以下代码可以顺利运行下去，代表synchronized里面的锁是具有可重入性的：

```java
package lock.reentrant;
public class Test01 {
    public synchronized void sm1() {
        System.out.println("同步方法1");
        sm2();
    }
    public synchronized void sm2() {
        System.out.println("同步方法2");
        sm3();
    }
    public synchronized void sm3() {;
        System.out.println("同步方法3");
    }
    public static void main(String[] args) {
        Test01 obj = new Test01();
        new Thread(new Runnable() {
            @Override
            public void run() {
                obj.sm1();
            }
        }).start();
    }
}
```

## 7.2 ReentrantLock

ReentrantLock的基本使用：

```java
package lock.reentrant;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
/**
 * 使用lock锁同步不同方法中的同步代码块
 * 
 * 只要使用了同一个Lock，不管在哪里的代码都可以进行同步
 */
public class Test03 {
    static Lock lock = new ReentrantLock();  //定义锁对象
    public static void sm1() {
        //经常在try中获得Lock锁，在finally()代码块中释放锁
        try {
            lock.lock();
            System.out.println(Thread.currentThread().getName() + "--method1--" + System.currentTimeMillis());
            TimeUnit.SECONDS.sleep(1);
            System.out.println(Thread.currentThread().getName() + "--method1--" + System.currentTimeMillis());
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
    public static void sm2() {
        //经常在try中获得Lock锁，在finally()代码块中释放锁
        try {
            lock.lock();
            System.out.println(Thread.currentThread().getName() + "--method2--" + System.currentTimeMillis());
            TimeUnit.SECONDS.sleep(1);
            System.out.println(Thread.currentThread().getName() + "--method2--" + System.currentTimeMillis());
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
    public static void main(String[] args) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                sm1();
            }
        }).start();
        new Thread(new Runnable() {
            @Override
            public void run() {
                sm2();
            }
        }).start();
    }
}
```

一般将lock.lock()写在try中，lock.unlock()写在finally中。

不管在哪里的代码，只要使用了同一个Lock，都可以进行线程同步。

lockInterruptibly()方法：

如果在获取锁的过程中，线程的中断标志位为true，则获取锁失败，且立即报InterruptedException异常，并将中断标志位的值置为false。

对于synchronized内部锁来说，如果一个线程在等待锁，只有两个结果。要么线程获得锁继续执行，要么就保持。

对于Reentrant Lock可重入锁来说，提供了另外一种可能，在等待锁的过程中，程序可以根据需要取消对锁的请求。

lockInterruptibly()方法解决死锁问题：

```java
package lock.reentrant;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
public class Test06 {
    static class IntLock implements Runnable {
        public static ReentrantLock lock1 = new ReentrantLock();
        public static ReentrantLock lock2 = new ReentrantLock();
        int lockNum = 0;  //定义整数变量，决定使用哪个锁
        public IntLock(int lockNum) {
            this.lockNum = lockNum;
        }
        @Override
        public void run() {
            try {
                if(lockNum % 2 == 1) {
                    lock1.lockInterruptibly();
                    System.out.println(Thread.currentThread().getName() + "获得了锁1，还需要获得锁2");
                    TimeUnit.SECONDS.sleep(1);
                    lock2.lockInterruptibly();
                    System.out.println(Thread.currentThread().getName() + "同时获得了锁1和锁2");
                } else {  //偶数
                    lock2.lockInterruptibly();
                    System.out.println(Thread.currentThread().getName() + "获得了锁2，还需要获得锁1");
                    TimeUnit.SECONDS.sleep(1);
                    lock1.lockInterruptibly();
                    System.out.println(Thread.currentThread().getName() + "同时获得了锁1和锁2");
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                if(lock1.isHeldByCurrentThread()){
                    lock1.unlock();
                    System.out.println(Thread.currentThread().getName() + "释放了lock1");
                }
                if(lock2.isHeldByCurrentThread()) {
                    lock2.unlock();
                    System.out.println(Thread.currentThread().getName() + "释放了lock2");
                }
                System.out.println(Thread.currentThread().getName() + "线程退出");
            }
        }
        public static void main(String[] args) throws InterruptedException {
            IntLock intLock1 = new IntLock(1);
            IntLock intLock2 = new IntLock(2);
            Thread t1 = new Thread(intLock1);
            Thread t2 = new Thread(intLock2);
            t1.start();
            t2.start();
            //睡眠3s，如果程序还没结束，中断一个线程，让其放弃申请锁，并释放自己占有的锁
            TimeUnit.SECONDS.sleep(3);
            if(t1.isAlive()) t1.interrupt();
//            if(t2.isAlive()) t2.interrupt();
        }
    }
}
```

tryLock(Long time, TimeUnit)：限时等待，在给定时间内如果能获得该锁就获得，得不到就放弃申请。

tryLock()：调用时如果该锁能获得就获得，否则就放弃申请。

代码示例：

```java
package lock.reentrant;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
public class Test08 {
    static class TimeLock implements Runnable {
        private static ReentrantLock lock = new ReentrantLock();
        @Override
        public void run() {
            try {
                if(lock.tryLock(3, TimeUnit.SECONDS)) {
                    System.out.println(Thread.currentThread().getName() + "获得锁，执行耗时任务");
                    TimeUnit.SECONDS.sleep(5);
                } else {  //没有获得锁
                    System.out.println(Thread.currentThread().getName() + "没有获得锁");
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                if(lock.isHeldByCurrentThread()) {
                    lock.unlock();
                    System.out.println(Thread.currentThread().getName() + "释放了锁");
                }
            }
        }
    }
    public static void main(String[] args) {
        TimeLock timeLock1 = new TimeLock();
        TimeLock timeLock2 = new TimeLock();
        Thread t1 = new Thread(timeLock1);
        Thread t2 = new Thread(timeLock2);
        t1.start();
        t2.start();
    }
}
```

tryLock()避免死锁：

```java
package lock.reentrant;
import java.util.concurrent.locks.ReentrantLock;
/**
 * 使用tryLock()避免死锁
 */
public class Test10 {
    static class IntLock implements Runnable {
        private static ReentrantLock lock1 = new ReentrantLock();
        private static ReentrantLock lock2 = new ReentrantLock();
        int lockNum = 0;
        public IntLock(int lockNum) {
            this.lockNum = lockNum;
        }
        @Override
        public void run() {
            try {
                if(lockNum % 2 == 0) {
                    if(lock1.tryLock()) {
                        System.out.println(Thread.currentThread().getName() + "获取锁1，尝试获取锁2");
                        Thread.sleep(1000);
                    }
                    if(lock2.tryLock()) {
                        System.out.println(Thread.currentThread().getName() + "获取锁2，同时获取了锁1和锁2");
                    }
                } else  {
                    if(lock2.tryLock()) {
                        System.out.println(Thread.currentThread().getName() + "获取锁2，尝试获取锁1");
                        Thread.sleep(1000);
                    }
                    if(lock1.tryLock()) {
                        System.out.println(Thread.currentThread().getName() + "获取锁1，同时获取了锁1和锁2");
                    }
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                if(lock1.isHeldByCurrentThread()) {
                    lock1.unlock();
                    System.out.println(Thread.currentThread().getName() + "释放了锁1");
                } else {
                    lock2.unlock();
                    System.out.println(Thread.currentThread().getName() + "释放了锁2");
                }
            }
        }
    }
    public static void main(String[] args) {
        IntLock intLock1 = new IntLock(1);
        IntLock intLock2 = new IntLock(2);
        new Thread(intLock1).start();
        new Thread(intLock2).start();
    }
}
```

newCondition()方法：

synchronized与wait()、notify()这两个方法一起使用可以实现等待/通知模式，Lock锁的newCondition()方法返回Condition对象，也可以实现等待/通知模式

使用notify()通知后，JVM会随机唤醒某个等待的线程，使用Condition类可以进行选择性地通知某和线程。Condition比较常用的两个方法：await()、singal()。注意，在调用这两个方法前，需要线程持有相关的Lock锁。调用await()后，线程会释放这个锁，调用signal()后，会从当前Condition对象的等待序列中唤醒一个线程。

公平锁与非公平锁：

大多数情况下，锁是非公平的，也就是说，当好几个线程在申请锁A时，可能某几个线程申请成功的概率大于其他线程。

公平锁：会按照时间先后顺序分配锁，保证先到先得，不会让线程饥饿。

synchronized这个内部锁是非公平的，ReentrantLock在定义是可以通过其构造方法让其变成公平锁，ReentrantLock(boolean fair)。

如果是非公平锁，系统会倾向于让一个已经获得了锁的线程继续获得锁，因为这样比较高效；如果是公平锁，系统会选择等待时间最长的那个线程获得锁。公平锁需要维护一个有序队列，所以性能不高。如果不是特别的需求，一般不使用公平锁。

```java
package lock.method;
import java.util.concurrent.locks.ReentrantLock;
/**
 * 公平锁和非公平锁
 */
public class Test01 {
//    private static ReentrantLock lock = new ReentrantLock();  //默认是非公平锁
    private static ReentrantLock lock = new ReentrantLock(true);  //定义成公平锁
    public static void main(String[] args) {
        for(int i = 0; i < 5; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    while(true) {
                        try {
                            lock.lock();
                            System.out.println(Thread.currentThread().getName() + "获得了锁");
                        } finally {
                            lock.unlock();
                        }
                    }
                }
            }, "Thread" + i).start();
        }
    }
}
```

ReentrantLock的几个常用的方法：

**1、** getHoldCount()：返回当前线程调用lock()方法的次数；

```java
package lock.method;
import java.util.concurrent.locks.ReentrantLock;
public class Test02 {
    private static ReentrantLock lock = new ReentrantLock();
    public static void m1() {
        try {
            lock.lock();
            System.out.println(Thread.currentThread().getName() + "持有了：" + lock.getHoldCount());
            //引文ReentrantLock是可重入锁，所以可以继续在m2()方法中继续获得锁
            m2();
        } finally {
            lock.unlock();
        }
    }
    public static void m2() {
        try {
            lock.lock();
            System.out.println(Thread.currentThread().getName() + "持有了：" + lock.getHoldCount());
        } finally {
            lock.unlock();
        }
    }
    public static void main(String[] args) {
        m1();
    }
}
```

**2、** getQueueLength()：返回正等待获得此锁的线程预估数；

```java
package lock.method;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
/**
 * getQueueLength()  返回获得锁的线程预估数
 */
public class Test03 {
    private static ReentrantLock lock = new ReentrantLock();
    private static class SubThread extends Thread {
        @Override
        public void run() {
            try {
                lock.lock();
                TimeUnit.SECONDS.sleep(1);
                System.out.println(Thread.currentThread().getName() + "：" + lock.getQueueLength());
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                lock.unlock();
            }
        }
    }
    public static void main(String[] args) {
        for(int i = 0; i < 10; i++) {
            new SubThread().start();
        }
    }
}
```

**3、** getWaitQueueLength(Conditioncondition)：返回在condition队列上等待的线程预估数；

**4、** hasQueuedThread(Threadthread)：查询某线程是否在等待获得该锁；

**5、** hasQueuedThreads()：查询是否有其他线程在等待获得该锁；

**6、** hasWaiters(Conditioncondition)：查询在该condition队列上是否有线程在等待；

**7、** isHeldByCurrentThread()：判断锁是否被当前线程锁持有；

**8、** isLocked()：判断锁是否被任何一个线程锁持有；
