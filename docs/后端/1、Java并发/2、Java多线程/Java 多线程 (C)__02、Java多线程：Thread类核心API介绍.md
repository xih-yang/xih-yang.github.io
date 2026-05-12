# 02、Java多线程：Thread类核心API介绍
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/12.html
- 分类：Java并发
- 分组：Java 多线程 (C)
## 设置线程优先级

Java提供了一个线程调度器来监控程序启动后进去就绪状态的所有线程。线程调度器通过线程的优先级来决定调度哪些线程执行。一般来说，Java的线程调度器采用时间片轮转算法使多个线程轮转获得CPU的时间片。

线程可以划分优先级，优先级高的线程得到的CPU资源比较多，也就是CPU优先执行优先级高的线程对象中的任务。优先级具有随机性，不一定优先级高的有限制性。

## 优先级说明

- 当线程的优先级没有指定时，所有线程都携带普通优先级。
- 优先级可以用从1到10的范围指定。10表示最高优先级，1表示最低优先级，5是普通优先级。
- 优先级最高的线程在执行时被给予优先。但是不能保证线程在启动时就进入运行状态。
- 与在线程池中等待运行机会的线程相比，当前正在运行的线程可能总是拥有更高的优先级。
- 由调度程序决定哪一个线程被执行。
- t.setPriority()用来设定线程的优先级。
- 在线程开始方法被调用之前，线程的优先级应该被设定。
- 可以使用常量，如MIN_PRIORITY,MAX_PRIORITY，NORM_PRIORITY来设定优先级。

## Thread类优先级源码

```java
// 优先级
private int  priority;
// 获取优先级
public final int getPriority() {
    return priority;
}
// 设置优先级，java中规定线程优先级是1~10 的整数，较大的优先级能提高该线程被 CPU 调度的机率
public final void setPriority(int newPriority) {
    ThreadGroup g;
    checkAccess();
    if (newPriority > MAX_PRIORITY || newPriority < MIN_PRIORITY) {
        throw new IllegalArgumentException();
    }
    if((g = getThreadGroup()) != null) {
        if (newPriority > g.getMaxPriority()) {
            newPriority = g.getMaxPriority();
        }
        setPriority0(priority = newPriority);
    }
}
/**
 * 线程可以具有的最低优先级
 */
public final static int MIN_PRIORITY = 1;
/**
 * 分配给线程的默认优先级。
 */
public final static int NORM_PRIORITY = 5;
/**
 * 线程可以具有的最大优先级。
 */
public final static int MAX_PRIORITY = 10;
```

## 设置优先级案例

```java
public class Test001 {
    public static void main(String[] args) {
        MyThread001 thread001 = new MyThread001();
        // 设置优先级最高
        thread001.setPriority(Thread.MAX_PRIORITY);
        thread001.start();
        // 设置优先级最低
        Thread.currentThread().setPriority(Thread.MIN_PRIORITY);
        // 打印优先级
        System.out.println("thread001优先级："+thread001.getPriority());
        System.out.println("Main 优先级："+Thread.currentThread().getPriority());
        System.out.println(Thread.currentThread().getName() + "线程正在运行任务");
    }
}
```

## 设置守护线程

在Java中有两类线程：用户线程 (User Thread)、守护线程 (Daemon Thread)。

**用户线程**：我们平常创建的普通线程。

**守护线程**：守护线程是一类比较特殊的线程，一般用于处理一些后台的工作，随着用户线程的销毁，守护线程也会随着销毁，比如JDK的垃圾回收线程。

## 使用场景

守护线程是指为其他线程服务的线程。在JVM中，所有非守护线程都执行完毕后，无论有没有守护线程，虚拟机都会自动退出。

Java垃圾回收线程就是一个典型的守护线程，因为我们的垃圾回收是一个一直需要运行的机制，但是当没有用户线程的时候，也就不需要垃圾回收线程了，守护线程刚好满足这样的需求。

**场景**：某个用户线程在执行时，需要一个定时无线循环线程，去检测心跳，一旦用户线程结束，这个检测线程也需要关闭。如果不设置守护线程，那个这个检测线程将无法停止，此时可以这只设置这个线程为守护线程，随着业务线程的完成而自动退出。

## 使用案例

```java
public class DaemonThreadTest001 {
    public static void main(String[] args) {
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                while (true) {
                    System.out.println(Thread.currentThread().getName() + "正在检测心跳");
                    try {
                        Thread.sleep( 3_000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        },"检测心跳任务线程");
        // 设置为守护线程
        t.setDaemon(true);
        // 查看线程是否为守护线程
        System.out.println(t.getName()+"是否守护线程"+t.isDaemon());
        System.out.println(Thread.currentThread().getName()+"是否守护线程"+Thread.currentThread().isDaemon());
        t.start();
        try {
            Thread.sleep( 20_000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println(Thread.currentThread().getName() + "线程任务运行结束");
    }
}
```

## 注意事项

**1、** 设置守护线程的方法很简单，调用setDaemon方法即可，true代表守护线程，false代表正常线程；

**2、** 线程是否为守护线程和它的父线程有很大的关系，如果父线程是正常线程，则子线程也是正常线程，反之亦然，如果你想要修改它的特性则可以借助setDaemon方法isDaemon方法可以判断该线程是不是守护线程；

**3、** setDaemon(true)必须在t.start()之前设置，否则会抛出IllegalThreadStateException异常；

## 获取线程ID

public long getId()获取线程的唯一ID,线程的ID在整个JVM进程中都会是唯一的。并且是从0开始逐次递增。在一个JVM进程启动的时候，实际上是开辟了很多个线程，自增序列已经有了一定的消耗，因此我们自己创建的线程可能并不是第0号线程。

```java
  // 获取线程长整型的 id,id 唯一
  long id = t.getId();
```

## 获取当前线程

public static Thread currentThread()用于返回当前执行线程的引用。

```java
  // 获取当前正在执行的线程
  Thread thread = Thread.currentThread();
```

## 设置线程休眠

sleep方法方法会使当前线程进人指定毫秒数的休眠，暂停执行，虽然给定了一个休眠的时间，但是最终要以系统的定时器和调度器的精度为准，休眠有一个非常重要的特性，那就是其不会放弃监视器锁的所有权。

sleep是一个静态方法，其有两个重载方法，其中一个需要传入毫秒数，另外一个既需要毫秒数也需要纳秒数。

在JDK1.5以后，JDK引入了一个枚举TimeUnit，其对sleep方法提供了很好的封装，使用它可以省去时间单位的换算步骤。

```java
public static void sleep(long millis) throws InterruptedException
public static void sleep(long millis, int nanos) throws InterruptedException
```

**案例**：

```java
// 休眠3秒
Thread.sleep(3_000);
TimeUnit.SECONDS.sleep(3);
```

## 线程yield

yield方法属于一种启发式的方法，其会提醒调度器我愿意放弃当前的CPU资源，如果CPU的资源不紧张，则会忽略这种提醒。调用yield方法会使当前线程从RUNNING状态切换到RUNNABLE状态，一般这个方法不太常用。主要是为了测试和调试。

```java
public static native void yield();
```

## yield和sleep的区别

**1、** sleep会导致当前线程暂停指定的时间，没有CPU时间片的消耗；

**2、** yield只是对CPU调度器的一个提示，如果CPU调度器没有忽略这个提示，它会导致线程上下文的切换；

**3、** sleep会使线程短暂block，会在给定的时间内释放CPU资源；

**4、** yield会使RUNNING状态的Thread进入RUNNABLE状态（如果CPU调度器没有忽略这个提示的话)；

**5、** sleep几乎百分之百地完成了给定时间的休眠，而yield的提示并不能一定担保；

**6、** 一个线程sleep另一个线程调用interrupt会捕获到中断信号，而yield则不会；

## 设置线程上下文类加载器

```java
@CallerSensitive
public ClassLoader getContextClassLoader() {
    if (contextClassLoader == null)
        return null;
    SecurityManager sm = System.getSecurityManager();
    if (sm != null) {
        ClassLoader.checkClassLoaderPermission(contextClassLoader,
                                               Reflection.getCallerClass());
    }
    return contextClassLoader;
}
public void setContextClassLoader(ClassLoader cl) {
    SecurityManager sm = System.getSecurityManager();
    if (sm != null) {
        sm.checkPermission(new RuntimePermission("setContextClassLoader"));
    }
    contextClassLoader = cl;
}
```

public ClassLoader getContextClassLoader()获取线程上下文的类加载器，简单来说就是这个线程是由哪个类加器加载的，如果是在没有修改线程上下文类加载器的情况下，则保持与父线程同样的类加载器。

public void setContextClassLoader(ClassLoader cl)设置该线程的类加载器，这个方法可以打破JAVA类加载器的父委托机制，有时候该方法也被称为JAVA类加载器的后门。

## 线程中断

取消一个任务的执行，最好的，同时也是最合理的方法，就是通过中断。

```java
// 打断线程
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
// 判断当前线程是否被打断
public static boolean interrupted() {
    return currentThread().isInterrupted(true);
}
// 测试某些线程是否已被中断
public boolean isInterrupted() {
    return isInterrupted(false);
}
private native boolean isInterrupted(boolean ClearInterrupted);
```

## interrupt()

调用sleep或wait方法时，会使得当前线程进入阻塞状态，而调用当前线程的interrupt方法，就可以打断阻塞。打断一个线程并不等于该线程的生命周期结束，仅仅是打断了当前线程的阻塞状态。一旦线程在阻塞的情况下被打断，都会抛出一个称为InterruptedException的异常。

### 中断标识

在一个线程内部存在着名为interrupt flag的标识，如果一个线程被interrupt，那么它的flag将被设置，但是如果当前线程正在执行可中断方法被阻塞时，调用interrupt方法将其中断，反而会导致flag被清除。

### InterruptedException

wait方和sleep方法前线程被中断了会抛出InterruptedException，并且清除中断状态。但是并不会终止当前线程的执行，当前线程可以选择忽略这个异常。

无论是设置interrupt status 还是抛出InterruptedException，它们都是给当前线程的建议，当前线程可以选择采纳或者不采纳，它们并不会影响当前线程的执行。

至于在收到这些中断的建议后，当前线程要怎么处理，也完全取决于当前线程。

### 测试案例

```java
public class InterruptThreadTest001 {
    public static void main(String[] args) {
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                while (true) {
                    System.out.println(Thread.currentThread().getName() + "正在检测心跳");
                    System.out.println("中断状态" + Thread.interrupted());
                    try {
                        TimeUnit.SECONDS.sleep(3);
                    } catch (InterruptedException e) {
                        // 被中断时 退出循环
                        e.printStackTrace();
                        break;
                    }
                }
            }
        }, "检测心跳任务线程");
        // 获取当前线程
        t.start();
        try {
            Thread.sleep(20_000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        // 中断
        t.interrupt();
        System.out.println(Thread.currentThread().getName() + "线程任务运行结束");
    }
}
```

## 线程join

在线程中调用另一个线程的 join() 方法，会将当前线程挂起，而不是忙等待，直到目标线程结束。

```java
public final void join() throws InterruptedException
public final synchronized void join(long millis, int nanos)throws InterruptedException
public final synchronized void join(long millis)throws InterruptedException
```

## 测试案例

线程t2先启动，3秒后才启动t1，但是由于t2使用了t1.jion(),则会等待t1执行完毕后，t2才会执行后续代码。

```java
public class JoinThreadTest001 {
    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            System.out.println(Thread.currentThread().getName() + "正在检测心跳");
        }, "线程001");
        Thread t2 = new Thread(() -> {
            try {
                t1.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println(Thread.currentThread().getName() + "正在检测心跳");
        }, "线程002");
        t2.start();
        try {
            TimeUnit.SECONDS.sleep(3);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        t1.start();
    }
}
```

## 其他API

### start()

启动一个新线程，在新的线程运行 run 方法中的代码。

start 方法只是让线程进入就绪，里面代码不一定立刻运行（CPU 的时间片还没分给它）。每个线程对象的start方法只能调用一次，如果调用了多次会出现IllegalThreadStateException。

### run()

新线程启动后会调用的方法。

如果在构造 Thread 对象时传递了 Runnable 参数，则线程启动后会调用 Runnable 中的 run 方法，否则默认不执行任何操作。但可以创建 Thread 的子类对象，来覆盖默认行为。

### getName()

获取线程名。

### setName(String)

修改线程名

### getState()

获取线程状态

### isAlive()

线程是否存活（还没有运行完毕）

## 过时方法

这些方法已过时，容易破坏同步代码块，造成线程死锁，不推荐使用。

### stop()

停止线程运行

### suspend()

挂起（暂停）线程运行

### resume()

恢复线程运行
