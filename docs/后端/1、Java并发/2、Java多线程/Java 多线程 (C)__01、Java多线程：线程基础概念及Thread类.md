# 01、Java多线程：线程基础概念及Thread类
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/11.html
- 分类：Java并发
- 分组：Java 多线程 (C)
## 进程与线程

### 进程

进程是指在内存中运行的应用程序实例，每个进程都有独立的内存空间；比如打开QQ，则表示开启了一个QQ进程。可通过任务管理器查看当前运行进程。

程序由指令和数据组成，但这些指令要运行，数据要读写，就必须将指令加载至 CPU，数据加载至内存。在指令运行过程中还需要用到磁盘、网络等设备。进程就是用来加载指令、管理内存、管理 IO 的程序。

当一个程序被运行，从磁盘加载这个程序的代码至内存，这时就开启了一个进程。

### 线程

操作系统能够进行运算调度的最小单位。线程是指进程中的一个执行任务(控制单元)，一个进程可以同时并发运行多个线程，它被包含在进程之中，是进程中的实际运作单位。，一个进程可以包含多个线程，任务管理器详细信息可查看。

一个进程之内可以分为一到多个线程。一个线程就是一个指令流，将指令流中的一条条指令以一定的顺序交给 CPU 执行。

### 进程与线程的区别

- 进程基本上相互独立的，而线程存在于进程内，是进程的一个子集
- 进程拥有共享的资源，如内存空间等，供其内部的线程共享
- 进程间通信较为复杂，同一台计算机的进程通信称为 IPC（Inter-process communication），不同计算机之间的进程通信，需要通过网络，并遵守共同的协议，例如 HTTP。线程通信相对简单，因为它们共享进程内的内存，比如多个线程可以访问同一个共享变量
- 线程更轻量，线程上下文切换成本一般上要比进程上下文切换低

## 并行与并发

**时间片**: CPU分配给各个程序的运行时间(很小的概念)；

**并行（concurrent）** ：指两个或多个事件在同一时刻点发生；单核单线程CPU运行时，实际线程高速切换，轮流执行；

**并发（parallel）** ：指两个或多个事件在同一时间段内发生；

**单核cpu**下，线程实际还是串行执行的。操作系统中有一个组件叫做任务调度器，将 cpu 的时间片（windows下时间片最小约为 15 毫秒）分给不同的程序使用，只是由于 cpu 在线程间（时间片很短）的切换非常快，人类感觉是同时运行的 。一般会将这种线程轮流使用 CPU 的做法称为并发。

**多核 cpu**下，每个核（core）都可以调度运行线程，这时候线程可以是并行的。

## 多进程与多线程

**多进程**：操作系统中同时运行的多个程序。

**多线程**：在同一个进程中同时运行的多个任务。

## 单线程与多线程

### 单线程

线程是系统对代码的执行进程，而单线程如果将系统当做一个员工，被安排执行某个任务的时候，他不会对任何其他的任务作出响应。只有当这个任务执行完毕，才可以重新给他分配任务。

### 多线程

多线程是指，将原本线性执行的任务分开成若干个子任务同步执行，这样做的优点是防止线程“堵塞”，增强用户体验和程序的效率。缺点是代码的复杂程度会大大提高，而且对于硬件的要求也相应地提高。

单核cpu 下，多线程不能实际提高程序运行效率，只是为了能够在不同的任务之间切换，不同线程轮流使用cpu ，不至于一个线程总占用 cpu，别的线程没法干活。

多核cpu 可以并行跑多个线程，但能否提高程序运行效率还是要分情况:

- 有些任务，经过精心设计，将任务拆分，并行执行，当然可以提高程序的运行效率。但不是所有计算任务都能拆分（【阿姆达尔定律】）
- 也不是所有任务都需要拆分，任务的目的如果不同，谈拆分和效率没啥意义

IO操作不占用 cpu，只是我们一般拷贝文件使用的是【阻塞 IO】，这时相当于线程虽然不用 cpu，但需要一直等待 IO 结束，没能充分利用线程,需要进行【非阻塞 IO】和【异步 IO】优化。

## 同步与异步

同步和异步关注的是消息通信机制。多线程可以让方法执行变为异步的，比如在项目中，视频文件需要转换格式等操作比较费时，这时开一个新线程处理视频转换，避免阻塞主线程。tomcat 的异步 servlet 也是类似的目的，让用户线程处理耗时较长的操作，避免阻塞 tomcat 的工作线程。在前端程序中，AJAX请求就是异步的。

### 同步

以调用方角度来讲，如果需要等待结果返回，才能继续运行就是同步。

下面的案例中，视频转换完成，主线程才能返回。

```java
System.out.println("生在转换视频....");
TimeUnit.SECONDS.sleep(10);
System.out.println("主线程执行完成...");
```

### 异步

以调用方角度来讲，不需要等待结果返回，就能继续运行就是异步。

下面代码中，创建了一个新线程去执行转换视频的任务，而主线程则不用等待，继续执行其他业务逻辑。

```java
new Thread(new Runnable() {
    @SneakyThrows
    @Override
    public void run() {
        System.out.println("生在转换视频....");
        TimeUnit.SECONDS.sleep(10);
    }
}).start();
System.out.println("主线程执行完成...");
```

## Thread

java.lang.Thread类表示线程，所有的线程必须是Thread类的子类或者其子类的实例。

```java
public class Thread extends Object implements Runnable
```

## 构造函数

```java
// 直接创建线程对象 
public Thread() {
    init(null, null, "Thread-" + nextThreadNum(), 0);
}
// 传入一个Runnable接口实例，创建线程对象 
public Thread(Runnable target) {
    init(null, target, "Thread-" + nextThreadNum(), 0);
}
// 传入一个Runnable接口实例及线程名，创建线程对象 
public Thread(Runnable target, String name) {
    init(null, target, name, 0);
}
// 传入线程名，创建线程对象 
public Thread(String name) {
init(null, null, name, 0);
}
/**
 * 创建线程对象
 * @param group 线程组，默认情况下， 新的线程都会被加入到main线程所在的group中， main线程的group名字同线程名。 如同线程存在父子关系一样，ThreadGroup同样也存在父子关系。
 * @param name  新线程的名称
 * @throws SecurityException 如果当前线程无法在指定的线程组中创建线程抛出异常
*/
public Thread(ThreadGroup group, String name) {
    init(group, null, name, 0);
}
/**
 *
 * @param group  线程组
 * @param target 线程运行对象
 * @param name   新线程的名称
 * @throws SecurityException i如果当前线程无法在指定的线程组中创建线程抛出异常
 */
public Thread(ThreadGroup group, Runnable target, String name) {
    init(group, target, name, 0);
} 
/**
 *
 * @param group  线程组
 * @param target 线程运行对象
 * @param name   新线程的名称
 * @param stackSize 新线程的所需堆栈大小，或为零以表示该参数将被忽略
 */
public Thread(ThreadGroup group, Runnable target, String name,
              long stackSize) {
    init(group, target, name, stackSize);
} 
```

## 核心方法

```java
/**
 * 返回对当前正在执行的线程对象的引用
 */
public static native Thread currentThread();
/**
 * 如果这个线程使用单独的Runnable运行对象构造，则调用该Runnable对象的run方法; 否则，此方法不执行任何操作并返回。
 * 线程执行逻辑
 */
@Override
public void run() {
    if (target != null) {
        target.run();
    }
}
/**
 * 启动线程， Java虚拟机调用此线程的run方法。 
 * 不能调用一个线程start()两次
 */
public synchronized void start() {
    if (threadStatus != 0)
        throw new IllegalThreadStateException();
    /* Notify the group that this thread is about to be started
     * so that it can be added to the group's list of threads
     * and the group's unstarted count can be decremented. */
    group.add(this);
    boolean started = false;
    try {
        start0();
        started = true;
    } finally {
        try {
            if (!started) {
                group.threadStartFailed(this);
            }
        } catch (Throwable ignore) {
            /* do nothing. If start0 threw a Throwable then
              it will be passed up the call stack */
        }
    }
}
/**
 * 使当前正在执行的线程以指定的毫秒数暂停（暂时停止执行），具体取决于系统定时器和调度程序的精度和准确性。
 * @param millis millis - 以毫秒为单位的睡眠时间长度 
 * @throws IllegalArgumentException millis为负数时抛出异常
 * @throws InterruptedException     如果有任何线程中断了当前线程。抛出此异常
 */
public static native void sleep(long millis) throws InterruptedException;
/**
 * 返回此线程的标识符。 线程ID是创建此线程时生成的正数long号。 线程ID是唯一的，并且在其生命周期内保持不变。 当线程被终止时，该线程ID可以被重用。 
 * @return 线程ID
 * @since 1.5
 */
public long getId() {
    return tid;
}
/**
 * 返回此线程的名称
 */
public final String getName() {
    return new String(name, true);
}
/**
 * 中断这个线程
 */
public void interrupt() {
    if (this != Thread.currentThread())
        checkAccess();
    synchronized (blockerLock) {
        Interruptible b = blocker;
        if (b != null) {
            interrupt0();           // Just to set the interrupt flag
            b.interrupt(this);
            return;
        }
    }
    interrupt0();
}
/**
 * 测试当前线程是否中断。
 */
public static boolean interrupted() {
    return currentThread().isInterrupted(true);
}
/**
 * 测试这个线程是否活着。 如果一个线程已经启动并且尚未死亡，那么线程是活着的。 
 */
public final native boolean isAlive();
/**
 *  更改此线程的优先级
 */
public final void setPriority(int newPriority) {
    ThreadGroup g;
    checkAccess();
    if (newPriority > MAX_PRIORITY || newPriority < MIN_PRIORITY) {
        throw new IllegalArgumentException();
    }
    if ((g = getThreadGroup()) != null) {
        if (newPriority > g.getMaxPriority()) {
            newPriority = g.getMaxPriority();
        }
        setPriority0(priority = newPriority);
    }
}
/**
 * 返回此线程的优先级
 */
public final int getPriority() {
    return priority;
}
/**
 * 放弃当前线程获取CPU的执行权,将让其它的线程去获取。
 */
public static native void yield();
```

## 创建线程的三种方式

## 方式1：继承 Thread 类

**1、** 创建线程类，继承Thread类，重写run()方法，；

```java
public class MyThread001 extends Thread {
    @Override
    public void run() {
        for (int i = 100; i > 0; i--) {
            System.out.println(Thread.currentThread().getName() + "线程正在运行任务");
        }
    }
}
```

**1、** 运行，当调用start()方法启动一个线程时，虚拟机会将该线程放入就绪队列中等待被调度，当一个线程被调度时会执行该线程的run()方法；

```java
public class Test001 {
    public static void main(String[] args) {
        MyThread001 thread001=new MyThread001();
        thread001.start();
        System.out.println(Thread.currentThread().getName() + "线程正在运行任务");
    }
}
```

## 方式2：实现 Runnable 接口

相比继承 Thread 类，Runnable避免了单继承的局限性；run方法只关于运行逻辑，解耦合；Thread 代表线程，Runnable 可运行的任务（线程要执行的代码）。

Runnable把线程和任务分开了，更容易与线程池等高级 API 配合，让任务类脱离了 Thread 继承体系，使用更加灵活。

**1、** 创建线程类，实现Runnable接口及run()方法；

```java
public class MyRunnable001 implements Runnable{
    @Override
    public void run() {
        for (int i = 100; i > 0; i--) {
            System.out.println(Thread.currentThread().getName() + "线程正在运行任务");
        }
    }
}
```

**1、** 创建Runnable实现类的实例，并把实例作为Thread类的Target创建对象，并调用对象start()方法来启动线程；

```java
public class Test002 {
    public static void main(String[] args) {
        MyRunnable001 myRunnable001 = new MyRunnable001();
        Thread t1 = new Thread(myRunnable001);
        t1.start();
        System.out.println(Thread.currentThread().getName() + "线程正在运行任务");
    }
}
```

## 方式3：实现 Callable 接口

**1、** 创建线程类，实现Callable接口，实现call方法，与Runnable相比，Callable可以有返回值，返回值通过FutureTask进行封装；

```java
public class MyCallable001 implements Callable<String> {
    @Override
    public String call() throws Exception {
        for (int i = 100; i > 0; i--) {
            System.out.println(Thread.currentThread().getName() + "线程正在运行任务");
        }
        return "MyCallable001";
    }
}
```

**2、** 运行；

```java
public class Test003 {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        MyCallable001 myCallable001 = new MyCallable001();
        FutureTask<String> futureTask001 = new FutureTask<>(myCallable001);
        Thread thread001 = new Thread(futureTask001);
        thread001.start();
        System.out.println(Thread.currentThread().getName() + "线程正在运行任务");
        System.out.println(futureTask001.get());
    }
}hwz-nyhux-oa 
```

## JVM与线程

JVM（Java virtual machine）java 虚拟机是java程序运行的基础。JVM大致可以分为类加载器、运行时数据区（内存空间）、执行引擎及本地库接口组成。

Java源代码文件(.java后缀)会被Java编译器编译为字节码文件(.class后缀)，然后由JVM中的**类加载器**加载各个类的字节码文件，加载完毕之后，交由**JVM执行引擎**执行。在整个程序执行过程中，JVM会用一段空间来存储程序执行期间需要用到的数据和相关信息，这段空间一般被称作为**Runtime Data Area(运行时数据区)**，也就是我们常说的JVM内存。

运行时数据区通常包括这几个部分：Java栈(VM Stack)、堆(Heap)、、方法区(Method Area)、本地方法栈(Native Method Stack)、程序计数器(Program Counter Register)。

## 线程在JVM中的如何执行

**1、** 类加载：将编译后的class文件加载到JVM方法区中，方法区存放了所加载的类的信息（名称、修饰符等）、类中的静态变量、类中的定义为final类型的常量、类中Field信息、类中的方法信息，当在程序中通过Class对象中的getName、isInterface等方法来获取信息时，这些数据都来源于方法区；

**2、** 开辟栈内存：运行Main方法后，JVM会启动Main线程，并分配一块栈内存线程会被分配给任务调度器去执行；

**3、** 启动程序计数器：启动程序计数器是一块较小的内存空间，它可以看做是当前线程所执行的字节码的行号指示器，线程私有（也叫线程隔离性），每个线程工作时都有属于自己的独立计数器多线程是通过线程轮流切换并分配处理器执行时间的方式来实现，处理器切换线程时并不会记录上一个线程执行到哪个位置，所以为了线程切换后依然能恢复到原位，每条线程都需要有各自独立的程序计数器；

**4、** 开辟栈帧内存：获得CPU执行权后，运行main方法，会在开辟main()栈帧内存在栈帧中包括局部变量表(LocalVariables)、操作数栈(OperandStack)、指向当前方法所属的类的运行时常量池(运行时常量池的概念在方法区部分会谈到)的引用(Referencetoruntimeconstantpool)、方法返回地址(ReturnAddress)和一些额外的附加信息当线程执行一个方法时，就会随之创建一个对应的栈帧，并将建立的栈帧压栈；

**5、** 出栈：当方法执行完毕之后，便会将栈帧出栈，释放内存；
