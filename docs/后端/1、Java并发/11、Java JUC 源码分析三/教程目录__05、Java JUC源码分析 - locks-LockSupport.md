# 05、Java JUC源码分析 - locks-LockSupport
- 来源：https://ddkk.com/zhuanlan/java/concurrency/11/5.html
- 分类：Java并发
- 分组：教程目录
LockSupport通过unsafe提供阻塞和唤醒线程的方法，AQS和其他的lock都会使用到这个基础类。

```java
private LockSupport() {} // Cannot be instantiated.
private static final Unsafe unsafe = Unsafe.getUnsafe();
private static final long parkBlockerOffset;
static {
    try {
        parkBlockerOffset = unsafe.objectFieldOffset
            (java.lang.Thread.class.getDeclaredField("parkBlocker"));
    } catch (Exception ex) { throw new Error(ex); }
}
```

每个线程都有一个volatile Object parkBlocker;字段，用于设置阻塞时，是被那个线程阻塞，可用于监控线程。LockSupport也提供设置和获取parkBlocker方法：

```java
private static void setBlocker(Thread t, Object arg) {
    // Even though volatile, hotspot doesn't need a write barrier here.
    unsafe.putObject(t, parkBlockerOffset, arg);
}
public static Object getBlocker(Thread t) {
    if (t == null)
        throw new NullPointerException();
    return unsafe.getObjectVolatile(t, parkBlockerOffset);
}
```

LockSupport通过底层unsafe提供park，unpark操作。简单点说：底层维护一个二义性的 _counter来保存一个许可，需要注意的是这个许可是一次性的，unpark操作设置该值为1，park操作检查该值是否为1，为1直接返回，不为1，则阻塞。

考虑下面几种情况是为什么：

**1、** unpark->park,unpark释放一个许可，park直接返回，不阻塞；

**2、** unpark->park->park，unpark释放一个许可，2次park阻塞；

**3、** park->unpark->unpark,park阻塞后多次unpark，unpark修改_counter为1，多次调用也无所谓，为什么单独提出这个，是因为在AQS共享模式下，获取锁后，需要通知所有等待锁的线程，会从阻塞队列中删除/唤醒头结点使用for循环，我感觉有可能多次unpark操作（个人想法，不一定完全正确，谁了解的可以解释下）；

如果使用wait/notify来实现同步，notify在wait之前执行，wait会一直阻塞，就会出问题了。

带blocker参数和不带blocker参数：

```java
public static void park(Object blocker) {
    Thread t = Thread.currentThread();
    setBlocker(t, blocker);
    unsafe.park(false, 0L);
    setBlocker(t, null);
}
public static void parkNanos(Object blocker, long nanos) {
    if (nanos > 0) {
        Thread t = Thread.currentThread();
        setBlocker(t, blocker);
        unsafe.park(false, nanos);
        setBlocker(t, null);
    }
}
public static void parkUntil(Object blocker, long deadline) {
    Thread t = Thread.currentThread();
    setBlocker(t, blocker);
    unsafe.park(true, deadline);
    setBlocker(t, null);
}
public static void park() {
    unsafe.park(false, 0L);
}
public static void parkNanos(long nanos) {
    if (nanos > 0)
        unsafe.park(false, nanos);
}
public static void parkUntil(long deadline) {
    unsafe.park(true, deadline);
}
```

LockSupport的javadoc说明在3中情况下回立即返回：

**1、** 有其他线程调用了本线程的unpark操作；

**2、** 其他线程中断了本线程；

**3、** Thecallspuriously(thatis,fornoreason)returns.；

除了上面3种情况，底层Unsafe的public native void park(boolean flag, long l);下面情况也会唤醒：

**1、** flag为true，传入的dealline到了；

**2、** flag为false，传入的park时间time到了；

unpark操作唤醒后，线程调度就由各个平台自己控制：

```java
<span style="font-size:18px;">public static void unpark(Thread thread) {
    if (thread != null)
        unsafe.unpark(thread);
}</span>
```
