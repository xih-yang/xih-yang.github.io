# 09、JVM 实战 - 虚拟机监控工具(可视化)
- 来源：https://ddkk.com/zhuanlan/java/jvm/6/9.html
- 分类：JVM 实战
- 分组：教程目录
## 1、Jconsole

从Java 5开始 引入了 JConsole。JConsole 是一个内置 Java 性能分析器，可以从命令行或在 GUI shell 中运行。您可以轻松地使用 JConsole（或者，它更高端的 “近亲” VisualVM ）来监控 Java 应用程序性能和跟踪 Java 中的代码。

### 1、启动

目录在jdk\ bin\jconsole.exe ，双击启动

配置jdk环境变量后，命令行Jconsole.exe运行

### 2、链接配置

本地程序（相对于开启JConsole的计算机），无需设置任何参数就可以被本地开启的JConsole连接（Java SE 6开始无需设置，之前还是需要设置运行时参数 -Dcom.sun.management.jmxremote ）

无认证连接 (下面的设置表示：连接的端口为8999、无需认证就可以被连接)

```java
-Dcom.sun.management.jmxremote.port=8999 \  
-Dcom.sun.management.jmxremote.authenticate=false \  
-Dcom.sun.management.jmxremote.ssl=false  
```

链接另一台计算机

```java
jconsole.exe 192.168.0.181:8999  
```

### 3、概述

包括：
内存:显示内存使用信息

线程:显示线程使用信息

类:显示类装载信息

*VM摘要:*显示java VM信息

MBeans: 显示 MBeans.

下面使用内存、线程进行案例分析

### 4、内存分析

```java
public class JconsoleHeapTest {
    public static final int _1MB = 1024 * 1024;
    public static void main(String[] args) {
        try {
            Thread.sleep(5000);
        }catch (Exception e){
        }
        System.out.println("method start ====>");
        fill(1000);
        System.out.println("<==== method end ");
    }
    private static void fill(Integer cnt){
        List<JconsoleHeapTest> jconsoleTests = new ArrayList<>();
        for(int i = 0; i<cnt; i++){
            try {
                Thread.sleep(100);
            }catch (Exception e){
            }
            jconsoleTests.add(new JconsoleHeapTest());
        }
    }
}
```

运行程序，建立链接

使用Prarllel GC 收集器，观测 堆内存和新生代Eden 内存使用持续增加

### 5、线程分析

```java
public class JconsoleThreadTest {
    public static final int _1MB = 1024 * 1024;
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        scanner.next();
        new Thread(() -> {
            System.out.println("start whileThread ===>");
            while (true){
            }
        }, "whileThread").start();
        scanner.next();
        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("start watiThread ===>");
                Object o = new Object();
                synchronized (o){
                    try {
                        o.wait();
                    }catch (Exception e){
                    }
                }
            }
        }, "watiThread").start();
    }
}
```

建立链接后，首先观察main线程，一直在运行状态

控制台输入next，后 执行whilleTread线程

控制台再次输入next，后 执行waitTread线程

### 6、线程死锁分析监控

```java
public class JconsoleSyncDeadLockTest {
    private static Object locka = new Object();
    private static Object lockb = new Object();
    public static void main(String[] args){
        new JconsoleSyncDeadLockTest().deadLock();
    }
    private void deadLock(){
        Thread thread1 = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (locka){
                    try{
                        System.out.println(Thread.currentThread().getName()+" get locka ing!");
                        Thread.sleep(500);
                        System.out.println(Thread.currentThread().getName()+" after sleep 500ms!");
                    }catch(Exception e){
                        e.printStackTrace();
                    }
                    System.out.println(Thread.currentThread().getName()+" need lockb!Just waiting!");
                    synchronized (lockb){
                        System.out.println(Thread.currentThread().getName()+" get lockb ing!");
                    }
                }
            }
        },"thread1");
        Thread thread2 = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (lockb){
                    try{
                        System.out.println(Thread.currentThread().getName()+" get lockb ing!");
                        Thread.sleep(500);
                        System.out.println(Thread.currentThread().getName()+" after sleep 500ms!");
                    }catch(Exception e){
                        e.printStackTrace();
                    }
                    System.out.println(Thread.currentThread().getName()+" need locka! Just waiting!");
                    synchronized (locka){
                        System.out.println(Thread.currentThread().getName()+" get locka ing!");
                    }
                }
            }
        },"thread2");
        thread1.start();
        thread2.start();
    }
}
```

运行后，两个线程相互等待，发生死锁

Jconsole监控死锁线程

## 2、VisualVM

VisualVM 是一款免费的，集成了多个 JDK 命令行工具的可视化工具，它能为您提供强大的分析能力，对 Java 应用程序做性能分析和调优。这些功能包括生成和分析海量数据、跟踪内存泄漏、监控垃圾回收器、执行内存和 CPU 分析，同时它还支持在 MBeans 上进行浏览和操作。本文主要介绍如何使用 VisualVM 进行性能分析及调优。

参考： [http://www.cnblogs.com/wade-xu/p/4369094.html](http://www.cnblogs.com/wade-xu/p/4369094.html)

### 1、内存堆Heap

```java
public final static int OUTOFMEMORY = 200000000;
private String oom;
private int length;
StringBuffer tempOOM = new StringBuffer();
public JavaHeapTest(int leng) {
    this.length = leng;
    int i = 0;
    while (i < leng) {
        i++;
        try {
            tempOOM.append("a");
        } catch (OutOfMemoryError e) {
            e.printStackTrace();
            break;
        }
    }
    this.oom = tempOOM.toString();
}
public String getOom() {
    return oom;
}
public int getLength() {
    return length;
}
public static void main(String[] args) {
    JavaHeapTest javaHeapTest = new JavaHeapTest(OUTOFMEMORY);
    System.out.println(javaHeapTest.getOom().length());
}
```

查看VisualVM Monitor tab, 堆内存变大了

在程序运行结束之前， 点击Heap Dump 按钮， 等待一会儿，得到dump结果，可以看到一些Summary信息

点击Classes， 发现char[]所占用的内存是最大的

双击它，得到如下Instances结果

Instances是按Size由大到小排列的

第一个就是最大的， 展开Field区域的 values

StringBuffer类型的 全局变量 tempOOM 占用内存特别大， 注意局部变量是无法通过 堆dump来得到分析结果的。

另外，对于“堆 dump”来说，在远程监控jvm的时候，VisualVM是没有这个功能的，只有本地监控的时候才有。

### 2、线程分析

Java 语言能够很好的实现多线程应用程序。当我们对一个多线程应用程序进行调试或者开发后期做性能调优的时候，往往需要了解当前程序中所有线程的运行状态，是否有死锁、热锁等情况的发生，从而分析系统可能存在的问题。

在VisualVM 的监视标签内，我们可以查看当前应用程序中所有活动线程（Live threads）和守护线程（Daemon threads）的数量等实时信息。

```java
public static void main(String[] args) {
    MyThread mt1 = new MyThread("Thread a");
    MyThread mt2 = new MyThread("Thread b");
    mt1.setName("My-Thread-1 ");
    mt2.setName("My-Thread-2 ");
    mt1.start();
    mt2.start();
}
public MyThread(String name) {
}
public void run() {
    while (true) {
    }
}
```

Live threads 从11增加两个 变成13了

Daemon threads从8增加两个 变成10了

VisualVM 的线程标签提供了三种视图，默认会以时间线的方式展现， 如下图：

可以看到两个我们run的程序里启的线程：My-Thread-1 和 My-Thread-2

另外还有两种视图分别是表视图和详细信息视图， 这里看一下每个Thread的详细视图：

### 3、CPU 分析

```java
public static void main(String[] args) throws InterruptedException {
    cpuFix();
}
/**
 * cpu 运行固定百分比
 *
 * @throws InterruptedException
 */
public static void cpuFix() throws InterruptedException {
    // 80%的占有率
    int busyTime = 8;
    // 20%的占有率
    int idelTime = 2;
    // 开始时间
    long startTime = 0;
    while (true) {
        // 开始时间
        startTime = System.currentTimeMillis();
        /*
         * 运行时间
         */
        while (System.currentTimeMillis() - startTime < busyTime) {
            ;
        }
        // 休息时间
        Thread.sleep(idelTime);
    }
}
```

查看监视页面 Monitor tab

过高的CPU 使用率可能是由于我们的项目中存在低效的代码；

在我们对程序施压的时候，过低的 CPU 使用率也有可能是程序的问题。

点击取样器Sampler， 点击“CPU”按钮， 启动CPU性能分析会话，VisualVM 会检测应用程序所有的被调用的方法，

在CPU samples tab 下可以看到我们的方法cpufix() 的自用时间最长， 如下图：

切换到Thread CPU Time 页面下，我们的 main 函数这个进程 占用CPU时间最长， 如下图：
