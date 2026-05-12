# 21、Java并发编程 - Java锁详解与 jstack堆栈分析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/21.html
- 分类：Java并发
- 分组：教程目录
## 21、Java锁

### 21.1.公平锁非公平锁

> 是什么

公平锁：就是非常公平，先来后到

非公平锁：就是不公平，不按照先后顺序，可以插队！存在即道理，有的时候插队可以提高效率。

> 两者区别

公平锁：并发环境下，每个线程在获取锁的时候都要先看一下这个锁的等待队列！如果为空，那就可以占有锁！否则就要等待！

非公平锁：上来就直接尝试占有该锁！如果失败就会采用类似公平锁的方式！

synchronized ：默认就是非公平锁，不可更改。

ReentrantLock ：默认就是非公平锁，可以通过参数修改！

```java
public ReentrantLock() {
    sync = new NonfairSync(); // 默认是非公平锁，随机
}
public ReentrantLock(boolean fair) {
      // 公平锁
    sync = fair ? new FairSync() : new NonfairSync();
}
```

### 21.2. 可重入锁

**可重入锁：获取到外面的一把锁，里面的锁自动获取。**

如车钥匙，车的播放音乐、开车前进、倒车、充电等功能，甲将钥匙给了乙，乙有了这把钥匙就能打开车门，点火，开车、放音乐。车钥匙就是可重入锁。如下示例：

递归锁就是可重入锁！

**可重入锁最大的好处：就是避免死锁！**

synchronized实现可重入锁,示例代码如下：

```java
package com.interview.concurrent.lock.javalock;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：synchronized实现可重入锁
 * 可重入锁：获取到外面的一把锁，里面的锁自动获取
 * @date 2023/2/25 18:37
 */
public class RtLockSynchronized {
    public static void main(String[] args) {
        Car car = new Car();
        new Thread(() -> {
            car.carFire();
        },"carFire").start();
        new Thread(() -> {
            car.music();
        },"music").start();
        new Thread(() -> {
            car.runAdvance();
        },"runAdvance").start();
    }
}
class Car{
    // 外面的锁
    public synchronized void carFire(){
        System.out.println(Thread.currentThread().getName() + ":打火");
        /**
         *  @description:
         *  以下两个方法本来也是被锁的，但是由于获得了外面的锁，
         *  所以这个锁也获得了！
         *  @author DDKK.COM 弟弟快看，程序员编程资料站
         *  @date 2023/2/25 18:44
         */
        music();
        runAdvance();
    }
    public synchronized void music(){
        System.out.println(Thread.currentThread().getName() + ":播放音乐");
    }
    public synchronized void runAdvance(){
        System.out.println(Thread.currentThread().getName() + ":前进，走");
    }
}
```

运行效果如下：

ReentrantLock实现可重入锁,示例代码如下：

```java
package com.interview.concurrent.lock.javalock;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述：ReentrantLock实现可重入锁
 * 可重入锁：获取到外面的一把锁，里面的锁自动获取
 * @date 2023/2/25 18:37
 */
public class RtLockReentrantLock {
    public static void main(String[] args) {
        Car2 car = new Car2();
        new Thread(() -> {
            car.carFire();
        },"carFire").start();
        new Thread(() -> {
            car.music();
        },"music").start();
        new Thread(() -> {
            car.runAdvance();
        },"runAdvance").start();
    }
}
class Car2{
    Lock lock = new ReentrantLock();
    // 外面的锁
    public void carFire(){
        lock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + ":打火");
            /**
             *  @description:
             *  以下两个方法本来也是被锁的，但是由于获得了外面的锁，
             *  所以这个锁也获得了！
             *  @author DDKK.COM 弟弟快看，程序员编程资料站
             *  @date 2023/2/25 18:44
             */
            music();
            runAdvance();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
    public void music(){
        lock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + ":播放音乐");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
    public void runAdvance(){
        lock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + ":前进，走");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
}
```

### 21.3. 自旋锁

自旋锁spinlock

尝试获取锁的线程不会立即阻塞，采用循环的方式尝试获取锁！减少上下文的切换！缺点会消耗CPU

CAS的实现就是自旋锁，代码如下：

```java
 @HotSpotIntrinsicCandidate
    public final int getAndAddInt(Object o, long offset, int delta) {
        int v;
        do {
            v = getIntVolatile(o, offset);
        } while (!weakCompareAndSetInt(o, offset, v, v + delta));
        return v;
    }
```

我们手动编写一个锁来测试！

```java
package com.interview.concurrent.lock.javalock;
import java.util.concurrent.atomic.AtomicReference;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/25 20:21
 */
public class SpinLock {
    AtomicReference atomicReference = new AtomicReference();
    public void lock(){
        Thread thread = Thread.currentThread();
        /**
         *  @description: 利用原子引用的自旋锁实现
         *  期望的值是空，就不会加锁，会一直循环，直到给期望值赋值
         *  @author DDKK.COM 弟弟快看，程序员编程资料站
         *  @date 2023/2/25 20:36
         */
        while(atomicReference.compareAndSet(null,thread)){
        }
    }
    public void unlock(){
        Thread thread = Thread.currentThread();
        //给AtomicReference赋期望值，就自动解锁
        atomicReference.compareAndSet(thread,null);
    }
}
```

测试

```java
package com.interview.concurrent.lock.javalock;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述:测试利用原子引用（AtomicRefrence）的自旋锁原理编写的锁
 * @date 2023/2/25 20:38
 */
public class SpinLockDemo {
    public static void main(String[] args) {
        Ticket ticket = new Ticket();
        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                ticket.saleTicket();
            }
        },"A").start();
        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                ticket.saleTicket();
            }
        },"B").start();
    }
}
class Ticket{
    int num = 50 ;
    //创建锁
    SpinLock spinLock = new SpinLock();
    public void saleTicket(){
        spinLock.lock();
        try {
            while(num > 0){
                System.out.println(Thread.currentThread().getName() + "卖出第" + num-- + "张票，还剩" + num + "张票");
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            spinLock.unlock();
        }
    }
}
```

### 21.4. 死锁

可重入锁：可以避免死锁！

#### 21.4.1 什么是死锁！

产生死锁的原因：

> 1、系统资源不足
>
> 2、进程运行顺序不当！
>
> 3、资源分配不当！

#### 21.4.2. 死锁堆栈分析

```java
package com.interview.concurrent.lock.javalock;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/25 21:14
 */
public class DeadLock {
   public static void main(String[] args) {
        String lockA = "lockA";
        String lockB = "lockB";
        Resources resources1 = new Resources(lockA,lockB);
        Resources resources2 = new Resources(lockB,lockA);
        new Thread(() -> {
            resources1.run();
        },"lockA").start();
        new Thread(() -> {
            resources2.run();
        },"lockB").start();
    }
}
class Resources{
    private String lockA;
    private String lockB;
    public Resources(String lockA, String lockB) {
        this.lockA = lockA;
        this.lockB = lockB;
    }
    public void run() {
        synchronized(lockA){
            System.out.println(Thread.currentThread().getName() + ":lock=" + lockA + "=>get:" + lockB);
            try {
                TimeUnit.SECONDS.sleep(2);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            synchronized(lockB){
                System.out.println(Thread.currentThread().getName() + ":lock=" + lockB + "=>get:" + lockA);
            }
        }
    }
}
```

解决：

`jps -l`

查看死锁现象：`jstack 进程号`

**死锁：针对死锁，要使用jstack来分析堆栈。**
