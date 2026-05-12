# 20、JDK 源码：Thread
- 来源：https://ddkk.com/zhuanlan/java/jvm/12/20.html
- 分类：JDK 源码
- 分组：教程目录
## 一、概述

此线程指的是执行程序中的线程。 Java虚拟机允许应用程序同时执行多个执行线程。

每个线程都有优先权。 具有较高优先级的线程优先于优先级较低的线程执行。 每个线程可能也可能不会被标记为守护程序。 当在某个线程中运行的代码创建一个新的`Thread`对象时，新线程的优先级最初设置为等于创建线程的优先级，并且当且仅当创建线程是守护进程时才是守护线程。

当Java虚拟机启动时，通常有一个非守护进程线程（通常调用某些指定类的名为`main`的方法）。 Java虚拟机将继续执行线程，直到发生以下任一情况：

- 已经调用了Runtime类的exit方法，并且安全管理器已经允许进行退出操作。
- 所有不是守护进程线程的线程都已经死亡，无论是从调用返回到run方法还是抛出超出run方法的run 。

创建一个新的执行线程有两种方法。 一个是将一个类声明为`Thread`的子类。 这个子类应该重写`run`类的方法`Thread` 。 然后可以分配并启动子类的实例。 例如，计算大于规定值的素数的线程可以写成如下：

```java
 class PrimeThread extends Thread {
     long minPrime;
     PrimeThread(long minPrime) {
         this.minPrime = minPrime;
     }
     public void run() {
         // compute primes larger than minPrime
          . . .
     }
 }
```

然后，以下代码将创建一个线程并启动它运行：

```java
 PrimeThread p = new PrimeThread(143);
 p.start();
```

另一种方法来创建一个线程是声明实现类`Runnable`接口。 那个类然后实现了`run`方法。 然后可以分配类的实例，在创建`Thread`时作为参数传递，并启动。 这种其他风格的同一个例子如下所示：

```java
 class PrimeRun implements Runnable {
     long minPrime;
     PrimeRun(long minPrime) {
         this.minPrime = minPrime;
     }
     public void run() {
         // compute primes larger than minPrime
          . . .
     }
 }
```

然后，以下代码将创建一个线程并启动它运行：

```java
 PrimeRun p = new PrimeRun(143);
 new Thread(p).start();
```

每个线程都有一个用于识别目的的名称。 多个线程可能具有相同的名称。 如果在创建线程时未指定名称，则会为其生成一个新名称。

除非另有说明，否则将`null`参数传递给`null`中的构造函数或方法将导致抛出[NullPointerException](http://www.matools.com/file/manual/jdk_api_1.8_google/java/lang/NullPointerException.html) 。

## 二、属性、内部类和接口

静态枚举类：线程状态

```java
public enum State {
    NEW,
    RUNNABLE,
    BLOCKED,
    WAITING,
    TIMED_WAITING,
    TERMINATED;
}
```

[Thread.UncaughtExceptionHandler](http://www.matools.com/file/manual/jdk_api_1.8_google/java/lang/Thread.UncaughtExceptionHandler.html)：当Thread由于未捕获的异常而突然终止时，处理程序的接口被调用。

```java
@FunctionalInterface
public interface UncaughtExceptionHandler {
    /**
     * Method invoked when the given thread terminates due to the
     * given uncaught exception.
     * <p>Any exception thrown by this method will be ignored by the
     * Java Virtual Machine.
     * @param t the thread
     * @param e the exception
     */
    void uncaughtException(Thread t, Throwable e);
}
```

线程的最大、最小、默认优先级。默认为5。

```java
/**
 * The minimum priority that a thread can have.
 */
public final static int MIN_PRIORITY = 1;
/**
 * The default priority that is assigned to a thread.
 */
public final static int NORM_PRIORITY = 5;
/**
 * The maximum priority that a thread can have.
 */
public final static int MAX_PRIORITY = 10;
```

## 三、常用方法

修饰符和返回值
方法名称及描述

static int
activeCount()

返回当前线程的[thread group](http://www.matools.com/file/manual/jdk_api_1.8_google/java/lang/ThreadGroup.html)及其子组中活动线程数的估计。

void
checkAccess()

确定当前正在运行的线程是否有权限修改此线程。

protected Object
clone()

将CloneNotSupportedException作为线程抛出无法有意义地克隆。

static Thread
currentThread()

返回对当前正在执行的线程对象的引用。

static void
dumpStack()

将当前线程的堆栈跟踪打印到标准错误流。

static int
enumerate(Thread[] tarray)

将当前线程的线程组及其子组中的每个活动线程复制到指定的数组中。

static Map
getAllStackTraces()

返回所有活动线程的堆栈跟踪图。

ClassLoader
getContextClassLoader()

返回此Thread的上下文ClassLoader。

static Thread.UncaughtExceptionHandler
getDefaultUncaughtExceptionHandler()

返回当线程由于未捕获异常突然终止而调用的默认处理程序。

long
getId()

返回此线程的标识符。

String
getName()

返回此线程的名称。

int
getPriority()

返回此线程的优先级。

StackTraceElement[]
getStackTrace()

返回表示此线程的堆栈转储的堆栈跟踪元素数组。

Thread.State
getState()

返回此线程的状态。

ThreadGroup
getThreadGroup()

返回此线程所属的线程组。

Thread.UncaughtExceptionHandler
getUncaughtExceptionHandler()

返回由于未捕获的异常，此线程突然终止时调用的处理程序。

static boolean
holdsLock(Object obj)

返回 true当且仅当当前线程在指定的对象上保持监视器锁。

void
interrupt()

中断这个线程。

static boolean
interrupted()

测试当前线程是否中断。

boolean
isAlive()

测试这个线程是否活着。

boolean
isDaemon()

测试这个线程是否是守护线程。

boolean
isInterrupted()

测试这个线程是否被中断。

void
join()

等待这个线程死亡。

void
join(long millis)

等待这个线程死亡最多 `millis`毫秒。

void
join(long millis, int nanos)

等待最多 `millis`毫秒加上 `nanos`纳秒这个线程死亡。

void
run()

如果这个线程使用单独的`Runnable`运行对象构造，则调用该`Runnable`对象的`run`方法; 否则，此方法不执行任何操作并返回。

void
setContextClassLoader(ClassLoader cl)

设置此线程的上下文ClassLoader。

void
setDaemon(boolean on)

将此线程标记为 [daemon](http://www.matools.com/file/manual/jdk_api_1.8_google/java/lang/Thread.html#isDaemon--)线程或用户线程。

static void
setDefaultUncaughtExceptionHandler(Thread.UncaughtExceptionHandler eh)

设置当线程由于未捕获的异常突然终止而调用的默认处理程序，并且没有为该线程定义其他处理程序。

void
setName(String name)

将此线程的名称更改为等于参数 `name` 。

void
setPriority(int newPriority)

更改此线程的优先级。

void
setUncaughtExceptionHandler(Thread.UncaughtExceptionHandler eh)

设置当该线程由于未捕获的异常而突然终止时调用的处理程序。

static void
sleep(long millis)

使当前正在执行的线程以指定的毫秒数暂停（暂时停止执行），具体取决于系统定时器和调度程序的精度和准确性。

static void
sleep(long millis, int nanos)

导致正在执行的线程以指定的毫秒数加上指定的纳秒数来暂停（临时停止执行），这取决于系统定时器和调度器的精度和准确性。

void
start()

导致此线程开始执行; Java虚拟机调用此线程的`run`方法。

String
toString()

返回此线程的字符串表示，包括线程的名称，优先级和线程组。

static void
yield()

对调度程序的一个暗示，即当前线程愿意产生当前使用的处理器。

主要方法的源码：

```java
public synchronized void start() {
    /**
     * This method is not invoked for the main method thread or "system"
     * group threads created/set up by the VM. Any new functionality added
     * to this method in the future may have to also be added to the VM.
     *
     * A zero status value corresponds to state "NEW".
     */
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
public void run() {
    if (target != null) {
        target.run();
    }
}
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
public final synchronized void setName(String name) {
    checkAccess();
    if (name == null) {
        throw new NullPointerException("name cannot be null");
    }
    this.name = name;
    if (threadStatus != 0) {
        setNativeName(name);
    }
}
public final synchronized void join(long millis)
throws InterruptedException {
    long base = System.currentTimeMillis();
    long now = 0;
    if (millis < 0) {
        throw new IllegalArgumentException("timeout value is negative");
    }
    if (millis == 0) {
        while (isAlive()) {
            wait(0);
        }
    } else {
        while (isAlive()) {
            long delay = millis - now;
            if (delay <= 0) {
                break;
            }
            wait(delay);
            now = System.currentTimeMillis() - base;
        }
    }
}
public final synchronized void join(long millis, int nanos)
throws InterruptedException {
    if (millis < 0) {
        throw new IllegalArgumentException("timeout value is negative");
    }
    if (nanos < 0 || nanos > 999999) {
        throw new IllegalArgumentException(
                            "nanosecond timeout value out of range");
    }
    if (nanos >= 500000 || (nanos != 0 && millis == 0)) {
        millis++;
    }
    join(millis);
}
public final void setDaemon(boolean on) {
    checkAccess();
    if (isAlive()) {
        throw new IllegalThreadStateException();
    }
    daemon = on;
}
public final void checkAccess() {
    SecurityManager security = System.getSecurityManager();
    if (security != null) {
        security.checkAccess(this);
    }
}
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
