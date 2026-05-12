# 05、Java多线程：线程同步(1)
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/19.html
- 分类：Java并发
- 分组：Java 多线程 (B)
## 5.1 线程同步机制

线程同步机制是一套用于协调线程之间的数据访问的机制。该机制可以保障线程安全。Java平台提供的线程同步机制包括：锁、volatile关键字、final关键字、static关键字、以及相应的API（如Object.wait()/Object.notify()）等。

## 5.2 锁概述

线程安全问题的产生前提是多个线程并发访问共享数据。所以我们将多个线程对共享数据的并发访问转换为串行访问，即一个共享数据一次只能被一个线程访问。锁就是复用这种思路来保障线程安全的。

锁可以理解为对共享数据进行保护的许可证。如果想要访问这些共享数据，就必须先持有该许可证。而许可证一次只能被一个线程持有，且访问完共享数据后，需要释放其持有的许可证。

线程持有锁后，直到释放锁为止执行的代码，我们称为临界区（Critical Section）。

JVM把锁分为内部锁和显示锁两种。内部锁通过synchronized关键字实现，显示锁通过java.concurrent.locks.Lock接口的实现类来实现。

锁的作用：

锁可以实现对共享数据的安全访问，保障线程的原子性、可见性和有序性。

锁通过互斥保障原子性。一个锁只能被一个线程持有，这就保证临界区的代码一次只能被一个线程执行，使得临界区代码所执行的操作自然而然地具有不可分割的特性，具备了原子性。

可见性的保障是通过写线程冲刷处理器的缓存和读线程刷新处理器缓存这两个动作实现的。在Java平台中，锁的获得隐含着刷新处理器缓存的动作，锁的释放隐含着冲刷处理器缓存的动作。

锁能够保障有序性。

**注意：使用锁保障线程的安全性，必须满足以下条件：**

这些线程在访问共享数据时，必须使用同一个把锁，当然读也是需要是同一把锁的。

锁相关的概念：

**1、** 可重入性（Reentrancy）：当一个线程持有该锁的时候，能够再次申请并获得该锁；

**2、** 锁的争用与调度：Java平台中内部锁属于非公平锁，而显示Lock接口锁支持公平锁非公平锁；

**3、** 锁的粒度：一个锁可以保护的共享数据的数量大小称为锁的粒度保护的共享数据量大，称该锁的粒度粗，否则称该锁的粒度细锁的粒度过大会造成申请锁时不必要的等待，锁的力度过细会增加锁调度的开销；

## 5.3 内部锁：synchronized关键字

Java中的每个对象都有一个与之关联的内部锁（Intrinsic lock），这种锁也称为监视器（Monitor），它是一种排它锁，可以保障原子性、可见性和有序性。

内部锁是通过synchronized关键字实现的。synchronized关键字可以修饰类、方法、代码块

**1、** 修饰一个类：其作用的范围是synchronized后面括号括起来的部分，**作用的对象是这个类的所有对象；**；

**2、** 修饰一个方法：被修饰的方法称为同步方法，其作用的范围是整个方法，**作用的对象是调用这个方法的对象；**；

**3、** 修饰一个静态方法：其作用的范围是整个方法，**作用的对象是这个类的所有对象；**；

**4、** 修饰一个代码块：被修饰的代码块称为同步语句块，其作用范围是大括号{}括起来的代码块，**作用的对象是调用这个代码块的对象；**；

synchronized同步代码块：

```java
package threadSafe.intrinsiclock;
public class Test01 {
    public static void main(String[] args) {
        //创建两个线程，分别调用mm()方法
        //先创建Test01对象，通过对象名调用mm()
        Test01 obj = new Test01();
        new Thread(new Runnable() {
            @Override
            public void run() {
                obj.mm();
            }
        }, "Thread1").start();
        new Thread(new Runnable() {
            @Override
            public void run() {
                obj.mm();
            }
        }, "Thread2").start();
    }
    //定义方法
    public void mm() {
        synchronized (this) {    //通常使用this当前对象作为锁对象
            for(int i = 1; i <= 100; i++) {
                System.out.println(Thread.currentThread().getName() + "-->" + i);
            }
        }
    }
}
```

通过synchronized关键字，在执行代码块的时候会获取该对象的锁，所以线程2必须要等线程1打印完后释放了锁才能获取到锁并执行代码块。所以可以看到，先是线程1的打印信息，再才是线程2的打印信息。

也可对指向常量的对象进行上锁：

```java
package threadSafe.intrinsiclock;
public class Test01 {
    public static final Object OBJ = new Object();
    public static void main(String[] args) {
        ...
    }
    //定义方法
    public void mm() {
        synchronized (OBJ){
            for(int i = 1; i <= 100; i++) {
                System.out.println(Thread.currentThread().getName() + "-->" + i);
            }
        }
    }
}
```

当锁住静态代码块或者静态方法时，锁的是类，可以简单理解为将字节码文件进行了上锁。有的时候也称这把锁为类锁。

同步代码块和同步方法如何选择：

```java
public void mm() throws InterruptedException {
    System.out.println("任务开始");
    TimeUnit.MILLISECONDS.sleep(500);   //任务准备工作
    synchronized (this) {
        for(int i = 0; i <= 10; i++) {
            System.out.println(Thread.currentThread().getName() + " :" + i);
        }
    }
}
```

像上面这样的方法，显然如果写成同步方法的话，那么准备任务的时候也获得了锁，这是不好的。所以像上面这样的方法，写成同步代码块比较好。

简而言之：**同步方法的粒度粗，并发效率低。同步代码块的粒度细，并发效率高**。

脏读：

```java
package threadSafe.intrinsiclock;
import java.util.concurrent.TimeUnit;
public class Test05 {
    public static void main(String[] args) {
        SharedValue sharedValue = new SharedValue();
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    sharedValue.setValue("chenxin", "456");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "Thread1").start();
        new Thread(new Runnable() {
            @Override
            public void run() {
                sharedValue.readValue();
            }
        }, "Thread2").start();
    }
    static class SharedValue {
        String username = "xiaoxin";
        String password = "123";
        public void setValue(String username, String password) throws InterruptedException {
            this.username = username;
            TimeUnit.SECONDS.sleep(1);
            this.password = password;
        }
        public void readValue() {
            System.out.println("username: " + username);
            System.out.println("password:" + password);
        }
    }
}
```

出现脏读的原因：**对共享数据的修改与对共享数据的读取不同步**。

线程出现异常会自动释放内部锁：

```java
package threadSafe.intrinsiclock;
public class Test04 {
    public static void main(String[] args) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                Test04.m1();
            }
        }, "Thread1").start();
        new Thread(new Runnable() {
            @Override
            public void run() {
                new Test04().m2();
            }
        }, "Thread2").start();
    }
    public synchronized static void m1() {
        for(int i = 0; i < 100; i++) {
            System.out.println(Thread.currentThread().getName() + ": " + i);
            if(i == 50) i = Integer.parseInt("abc"); //产生异常
        }
    }
    public void m2() {
        synchronized (Test04.class) {
            for(int i = 0; i < 100; i++) {
                System.out.println(Thread.currentThread().getName() + ": " + i);
            }
        }
    }
}
```

可以发现，Thread1打印到50的时候，Thread2开始打印。说明，异常会释放锁，所以Thread2才能获得锁去执行。

死锁：

```java
package threadSafe.intrinsiclock;
public class Test06 {
    public static void main(String[] args) {
        SubThread t1 = new SubThread();
        t1.setName("a");
        t1.start();
        SubThread t2 = new SubThread();
        t2.setName("b");
        t2.start();
    }
    static class SubThread extends Thread {
        private static final Object resource1 = new Object();
        private static final Object resource2 = new Object();
        @Override
        public void run() {
            if("a".equals(Thread.currentThread().getName())) {
                synchronized (resource1) {
                    System.out.println("a获得了resource1，现在申请resource2");
                    synchronized (resource2) {
                        System.out.println("a获得了resource2");
                    }
                }
            }
            if("b".equals(Thread.currentThread().getName())) {
                synchronized (resource2) {
                    System.out.println("b获得了resource2，现在申请resource1");
                    synchronized (resource1) {
                        System.out.println("b获得了resource1");
                    }
                }
            }
        }
    }
}
```

## 5.4 轻量级同步机制：volatile关键字

volatile的作用：

使变量在多个线程之间可见。当volatile关键字修饰的变量被改变时，会强制将其值刷新到主存中，并且，如果有其他处理器的缓存保存了该主存地址的值的话，会强制将其值刷新到别的处理器的缓存中。

volatile和synchronized的区别：

**1、** volatile是线程同步的轻量级实现，所以volatile的性能肯定比synchronized要好；

**2、** volatile只能修饰变量，而synchronized还可以修饰方法、代码块、类；

**3、** 多线程访问volatile变量不会发生阻塞，而synchronized可能会发生阻塞；

**4、** volatile能保证数据的可见性，但是不能保证原子性而synchronized两者都可以保障；

**5、** volatile解决的是变量在多个线程之间的可见性问题，而synchronized解决的是多个线程在访问资源时候的同步性问题；

volatile的非原子性：

```java
package threadSafe;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
public class Test01 {
    public static void main(String[] args) {
        //启动两个线程，不断调用getNum()方法
        MyInt myInt = new MyInt();
        for(int i = 1; i <= 2; i++) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    while(true) {
                        System.out.println(Thread.currentThread().getName() + "->" + myInt.getNum());
                        try {
                            TimeUnit.MILLISECONDS.sleep(100);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
                }
            }).start();
        }
    }
    static class MyInt{
        volatile int num;
        public int getNum() {
            return num++;
        }
    }
}
```

从结果可以发现，两个线程有的时候打印的是一样的值，说明即便是用volatile修饰了，num++还是不具有原子性。（可以使用原子类来保证原子性，例如AtomicInteger）
