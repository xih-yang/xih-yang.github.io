# 01、Java多线程：进程和线程介绍
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/15.html
- 分类：Java并发
- 分组：Java 多线程 (B)
## 1.1 线程相关概念

进程：

进程（process）是计算机中的程序关于某数据集合一次运行活动，是操作系统进行资源分配和调度的基本单位。

可以把进程简单理解为操作系统中正在运行的一个程序。

线程：

线程（Thread）是进程的一个执行单元。

一个线程是进程中一个单一顺序的控制流，进程的一个执行分支。

进程是线程的容器，一个进程至少有一个线程。

在操作系统中，进程是分配资源的基本单位，如虚拟存储空间、文件描述符等。在进程中，每个线程都有各自的线程栈，自己的寄存器环境，自己的线程本地存储。

主线程和子线程：

JVM启动时会创建一个主线程，该主线程负责执行main方法。主线程就是执行main方法的线程。

JAVA中的线程不是孤立的，线程之间也会存在一些联系。如果A线程创建了B线程，那么A线程就是B线程的父线程，B线程就是A线程的子线程。

## 1.2 串行、并发和并行：

假设有3个任务：A准备5分钟，等待5分钟；B准备2分钟，等待8分钟；C准备10分钟。

串行：sequential，所有任务逐个完成

10+ 10 + 10 = 30分钟

并发：concurrent，在任务A等待的过程中，开始做任务B，任务B等待的过程中启动任务C

5+2 + 10 = 17分钟

并行：parallel，三个任务同时开始

10分钟

## 1.3 线程的创建和启动

在Java中，创建一个线程就是创建一个Thread类（或子类）的对象（或称实例）。

Thread类有两个常用的构造方法：

```java
Thread();
Thread(Runnable target);
```

创建线程的两种方法：

**1、** 继承Thread类，并重写run方法：

```java
package createThread.p1;
/**
 * 1、定义Thread类的子类
 */
public class MyThread extends Thread{
    //2、重写Thread类的run方法
    //run()方法体内的内容就是线程要执行的代码
    @Override
    public void run() {
        System.out.println("这是子线程执行的内容");
    }
    public static void main(String[] args) {
        //3、创建线程对象
        MyThread myThread = new MyThread();
        //4、启动线程
        myThread.start();
        /**
         * 调用线程的start()方法来启动线程，启动线程的实质是请求JVM运行相应的线程，这个线程具体什么时候运行，由线程调度器（scheduler）决定
         * 注意：
         *   调用start()方法不代表线程能立马运行
         *   线程启动后会运行run()方法
         *   如果启动了多个线程，start()调用的顺序不一定就是线程启动的顺序
         */
    }
}
```

**2、** 实现runnable接口来创建线程；

```java
package createThread.p2;
//1、继承Runnable接口
public class MyRunable implements Runnable{
    //2、实现run方法
    @Override
    public void run() {
        System.out.println("This is a thread");
    }
    public static void main(String[] args) {
        //3、将实现了Runnable接口的对象传入Thread的构造方法中
        Thread thread = new Thread(new MyRunable());
        //4、启动线程
        thread.start();
    }
}
```

## 1.4 线程的常用方法

**1、** currentThread()；

Java中的任何一段代码，都是运行在某个线程中的。使用如下方法可以获得运行当前代码的线程。

```java
Thread.currentThread()
```

**2、** setName()/getName()；

通过设置线程名称，有助于程序调试，提高程序的可读性，建议为每个线程设置一个名称。

```java
thread.setName(线程名称);  //设置线程名称
thread.getName();         //获得线程名称
```

**3、** isAlive；

判断线程是否处于活动状态（只要启动了，然后还没终止，那就是活着的线程）

```java
thread.isAlive();
```

**4、** sleep；

让当前线程休眠指定的毫秒数，当前线程指的是Thread.currentThread()返回的线程

```java
Thread.sleep(millis);  //让当前线程休眠指定的毫秒数
TimeUnit.SECONDS.sleep(seconds);  //显示地知道休眠的时间
```

**5、** getId；

thread.getId() 可以获得线程的唯一标识。

注意：如果某个编号运行结束，该编号可能被后续创建的线程使用。

重启了JVM后，同一个线程的编号可能不同了。

**6、** yield；

Thead.yield()：放弃当前的CPU资源，然后由CPU重新进行调度。

**7、** setPriority；

thread.setPriority(num) ：设置线程的优先级，num的取值范围是1～10。如果超出这个范围会抛出异常IllegalArgumentException。

在操作系统中，优先级较高的线程获得CPU的机会越多

线程优先级本质上只是给线程调度器一个提示信息，以便于调度器决定先调度哪些线程。注意不能保证让优先级高的线程先运行。

Java优先级设置不当或者滥用，可能会导致某些线程永远无法得到运行，即产生了线程饥饿。

线程的优先级并不是设置得越高越好，一般情况下使用普通的默认的优先级即可。

线程的优先级具有继承性，在A线程中创建了B线程，则B线程的优先级和A线程的优先级是一样的

**8、** interrupt；

调用某一线程的interrupt方法，仅仅是在当前线程打一个停止标志，并不是真正的停止线程。

**9、** setDaemon；

Java中的线程分为用户线程和守护线程

守护线程是为其他县城提供服务的县城，如垃圾回收器（GC）。

守护线程不能单独运行，当Java虚拟机中没有其他用户线程，只有守护线程时，守护线程会自动销毁。
