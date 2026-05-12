# 02、Java多线程：Thread、Runnable、ThreadLocal
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/2.html
- 分类：Java并发
- 分组：Java 多线程 (A)
## Thread

> public class Thread implements Runnable

**1、** 线程是程序中的执行线程Java虚拟机允许应用程序并发地运行多个执行线程；

**2、** 每个线程都有一个优先级，高优先级线程的执行优先于低优先级线程；

**3、** 创建新执行线程有两种方法一种方法是将类声明为Thread的子类该子类应重写Thread类的run方法newThread().start()另一种方法是声明实现Runnable接口的类该类然后实现run方法newThread(Runnable实现类实例).start()；

推荐使用声明实现 Runnable 接口的类。符合面向接口编程思想。

**常用构造方法**

Thread()
分配新的 Thread 对象。

Thread(Runnable target)
分配新的 Thread 对象。

Thread(Runnable target, String name)
分配新的 Thread 对象。

Thread(String name)
分配新的 Thread 对象。

**常用方法**

> Thread currentThread()：返回对当前正在执行的线程对象的引用。

```java
public static native Thread currentThread()//native方法
```

> void sleep(long millis) ：在指定的毫秒数内让当前正在执行的线程休眠（暂停执行），此操作受到系统计时器和调度程序精度和准确性的影响。不释放锁。

```java
public static native void sleep(long millis) throws InterruptedException;//native方法
```

> void yield()：暂停当前正在执行的线程对象，并执行其他线程，且只能让同优先级的线程有执行的机会。不释放锁。

```java
public static native void yield();
```

> void join(long millis) ：等待该线程终止的时间最长为 millis 毫秒。join(0)等价于join()。

```java
public final synchronized void join(long millis) 
    throws InterruptedException {
	long base = System.currentTimeMillis();
	long now = 0;
	if (millis < 0) {
            throw new IllegalArgumentException("timeout value is negative");
	}
	if (millis == 0) {
	    while (isAlive()) {
		wait(0);//Object.wait方法，native方法
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
```

> void start()： 使该线程开始执行；Java 虚拟机调用该线程的 run 方法。

```java
public synchronized void start() {
    if (threadStatus != 0 || this != me)
        throw new IllegalThreadStateException();
    group.add(this);
    start0();
    if (stopBeforeStart) {
        stop0(throwableFromStop);
    }
}
```

> void interrupt()：中断线程。

```java
public void interrupt() {
	if (this != Thread.currentThread())
	    checkAccess();
	synchronized (blockerLock) {
	    Interruptible b = blocker;
	    if (b != null) {
		interrupt0();		// Just to set the interrupt flag
		b.interrupt();
		return;
	    }
	}
	interrupt0();
}
```

destroy() 、resume()、suspend() 、stop() 已过时且不安全，故不作介绍。

## Runnable

> public interface Runnable

**1、** 接口实现类类必须定义一个称为run的无参数方法；

**2、** 设计该接口的目的是为希望在活动时执行代码的对象提供一个公共协议；

**3、** Runnable为非Thread子类的类提供了一种激活方式通过实例化某个Thread实例并将自身作为运行目标，就可以运行实现Runnable的类而无需创建Thread的子类大多数情况下，如果只想重写run()方法，而不重写其他Thread方法，那么应使用Runnable接口这很重要，因为除非程序员打算修改或增强类的基本行为，否则不应为该类创建子类；

```java
public interface Runnable {
    /**
     *  使用实现接口 Runnable 的对象创建一个线程时，启动该线程将导致在独立执行的线程中调用对象的 run 方法。
     *
     * @see     java.lang.Thread#run()
     */
    public abstract void run();
}
```

## ThreadLocal

> public class ThreadLocal

**1、** 该类提供了线程局部(thread-local)变量这些变量不同于它们的普通对应物，因为访问某个变量（通过其get或set方法）的每个线程都有自己的局部变量，它独立于变量的初始化副本；

**2、** ThreadLocal实例通常是类中的privatestatic字段，它们希望将状态与某一个线程（例如，用户ID或事务ID）相关联；

**成员变量**

```java
/**
 * 本地线程哈希码
 */
private final int threadLocalHashCode = nextHashCode();
/**
 * 下一个本地线程的哈希码
 */
private static AtomicInteger nextHashCode = 
new AtomicInteger();
/**
 * 哈希码增量
 */
private static final int HASH_INCREMENT = 0x61c88647;
/**
 * 返回下一个哈希码：nextHashCode + HASH_INCREMENT
 */
private static int nextHashCode() {
    return nextHashCode.getAndAdd(HASH_INCREMENT); 
}
```

**构造方法**

```java
/**
 * 创建一个线程本地变量。
 */
public ThreadLocal() {
}
```

**方法**

T get()
返回此线程局部变量的当前线程副本中的值。

void set(T value)
将此线程局部变量的当前线程副本中的值设置为指定值。大部分子类不需要重写此方法，它们只依靠 initialValue() 方法来设置线程局部变量的值。

void remove()
移除此线程局部变量当前线程的值。如果此线程局部变量随后被当前线程 读取，且这期间当前线程没有 设置其值，则将调用其 initialValue() 方法重新初始化其值。这将导致在当前线程多次调用 initialValue 方法。

T initialValue()
返回此线程局部变量的当前线程的“初始值”。

ThreadLocal由其内部类ThreadLocalMap实现的。每个ThreadLocal维护一个ThreadLocalMap实例，key为ThreadLocal实例本身，value是真正需要存储的Object。

先设值

```java
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
}
void createMap(Thread t, T firstValue) {
    t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

再取值

```java
public T get() {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);//获取当前线程ThreadLocalMap
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);//找到对应map
        if (e != null)
            return (T)e.value;//返回对应值
    }
    return setInitialValue();//没有值，进行初始化
}
ThreadLocalMap getMap(Thread t) {
    return t.threadLocals;
}
```
