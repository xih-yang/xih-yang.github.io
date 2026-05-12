# 05、Java多线程：Executors、ThreadFactory
- 来源：https://ddkk.com/zhuanlan/java/concurrency/2/5.html
- 分类：Java并发
- 分组：Java 多线程 (A)
## Executors

> public class Executors

**1、** 一个功能非常强大的辅助类；

**2、** 此包中所定义的Executor、ExecutorService、ScheduledExecutorService、ThreadFactory和Callable类的工厂和实用方法；

此类支持以下各种方法：

**1、** 创建并返回设置有常用配置字符串的ExecutorService的方法；

**2、** 创建并返回设置有常用配置字符串的ScheduledExecutorService的方法；

**3、** 创建并返回“包装的”ExecutorService方法，它通过使特定于实现的方法不可访问来禁用重新配置；

**4、** 创建并返回ThreadFactory的方法，它可将新创建的线程设置为已知的状态；

**5、** 创建并返回非闭包形式的Callable的方法，这样可将其用于需要Callable的执行方法中；

**关于Callable的支持**

```java
Callable callable(Runnable task, T result)
```

> 返回 Callable 对象，调用它时可运行给定的任务并返回给定的结果。callable(task)等价于callable(task, null)。

```java
    public static <T> Callable<T> callable(Runnable task, T result) {
        if (task == null)
            throw new NullPointerException();
        return new RunnableAdapter<T>(task, result);
    }
```

RunnableAdapter类

```java
    /**
     * A callable that runs given task and returns given result
     */
    static final class RunnableAdapter<T> implements Callable<T> {
        final Runnable task;
        final T result;
        RunnableAdapter(Runnable  task, T result) {
            this.task = task;
            this.result = result;
        }
        public T call() {
            task.run();
            return result;
        }
    }
```

Callable callable(final PrivilegedAction action)

> 返回 Callable 对象，调用它时可运行给定特权的操作并返回其结果。
>
> callable(PrivilegedExceptionAction action)和其类似，唯一的区别在于，前者可抛出异常。

```java
public static Callable<Object> callable(final PrivilegedAction<?> action) {
    if (action == null)
        throw new NullPointerException();
    return new Callable<Object>() {
    public Object call() { return action.run(); }};
}
```

**PrivilegedAction接口**

```java
public interface PrivilegedAction<T> {
    T run();
}
```

- Callable privilegedCallable(Callable callable)

> 返回 Callable 对象，调用它时可在当前的访问控制上下文中执行给定的 callable 对象。
>
> #####Callable privilegedCallableUsingCurrentClassLoader(Callable callable)
>
> 返回 Callable 对象，调用它时可在当前的访问控制上下文中，使用当前上下文类加载器作为上下文类加载器来执行给定的 callable 对象。

**关于ExecutorService的支持**

**1、** newCachedThreadPool（无界线程池，可以进行自动线程回收）；

**2、** newFixedThreadPool（固定大小线程池）；

**3、** newSingleThreadExecutor(单个后台线程）；

**4、** newScheduledThreadPool(可调度)；

其实不推荐该上述几种使用方式，当然也可根据自身业务场景决定，Executors 返回的线程池对象的弊端如下:

（1）FixedThreadPool 和 SingleThreadPool：允许的请求队列长度为 Integer.MAX_VALUE，可能会堆积大量的请求，从而导致 OOM。

（2）CachedThreadPool 和 ScheduledThreadPool:允许的创建线程数量为 Integer.MAX_VALUE，可能会创建大量的线程，从而导致 OOM。

ExecutorService newFixedThreadPool(int nThreads, ThreadFactory threadFactory)

> 创建一个可重用固定线程数的线程池，以共享的无界队列方式来运行这些线程，在需要时使用提供的 ThreadFactory 创建新线程。

```java
    public static ExecutorService newFixedThreadPool(int nThreads, ThreadFactory threadFactory) {
        return new ThreadPoolExecutor(nThreads, nThreads,
	          0L, TimeUnit.MILLISECONDS,
         new LinkedBlockingQueue<Runnable>(), threadFactory);
    }
```

newCachedThreadPool() 和 newSingleThreadExecutor() 实现和newFixedThreadPool类似，无非调用ThreadPoolExecutor不同的构造方法及参数值不同。

ExecutorService unconfigurableExecutorService(ExecutorService executor)

> 返回一个将所有已定义的 ExecutorService 方法委托给指定执行程序的对象，但是使用强制转换可能无法访问其他方法。这提供了一种可安全地“冻结”配置并且不允许调整给定具体实现的方法。

```java
public static ExecutorService unconfigurableExecutorService(ExecutorService executor) {
    if (executor == null)
        throw new NullPointerException();
    return new DelegatedExecutorService(executor);
}
```

**关于ScheduledExecutorService的支持**

ScheduledExecutorService newSingleThreadScheduledExecutor(ThreadFactory threadFactory)

> 创建一个单线程执行程序，它可安排在给定延迟后运行命令或者定期地执行。

```java
public static ScheduledExecutorService newScheduledThreadPool(
        int corePoolSize, ThreadFactory threadFactory) {
    return new ScheduledThreadPoolExecutor(corePoolSize, threadFactory);
}
```

ScheduledExecutorService newSingleThreadScheduledExecutor(ThreadFactory threadFactory)

> 创建一个单线程执行程序，它可安排在给定延迟后运行命令或者定期地执行。

```java
public static ScheduledExecutorService newSingleThreadScheduledExecutor(ThreadFactory threadFactory) {
    return new DelegatedScheduledExecutorService
        (new ScheduledThreadPoolExecutor(1, threadFactory));
}
```

**关于ThreadFactory的支持**

ThreadFactory defaultThreadFactory()

> 返回用于创建新线程的默认线程工厂。

```java
public static ThreadFactory defaultThreadFactory() {
    return new DefaultThreadFactory();
}
```

ThreadFactory privilegedThreadFactory()

> 返回用于创建新线程的线程工厂，这些新线程与当前线程具有相同的权限。

```java
public static ThreadFactory privilegedThreadFactory() {
    return new PrivilegedThreadFactory();
}
```

归纳

ExecutorService
ScheduledExecutorService
ThreadFactory
Callable

newFixedThreadPool
newScheduledThreadPool
DefaultThreadFactory
callable

newScheduledThreadPool
newSingleThreadScheduledExecutor
PrivilegedThreadFactory
privilegedCallable

newSingleThreadExecutor
unconfigurableScheduledExecutorService

privilegedCallableUsingCurrentClassLoader

newCachedThreadPool

## ThreadFactory

> public interface ThreadFactory

**1、** 根据需要创建新线程的对象使用线程工厂就无需再手工编写对newThread的调用了，从而允许应用程序使用特殊的线程子类、属性等等；

**2、** Executors对其提供支持：DefaultThreadFactory和PrivilegedThreadFactory；

```java
public interface ThreadFactory {
    /**
     * 构造一个新 Thread。
     */
    Thread newThread(Runnable r);
}
```

## Executors.DefaultThreadFactory

```java
static class DefaultThreadFactory implements ThreadFactory {
    static final AtomicInteger poolNumber = new AtomicInteger(1);
    final ThreadGroup group;
    final AtomicInteger threadNumber = new AtomicInteger(1);
    final String namePrefix;
    DefaultThreadFactory() {
        SecurityManager s = System.getSecurityManager();
        group = (s != null)? s.getThreadGroup() :
                             Thread.currentThread().getThreadGroup();
        namePrefix = "pool-" +
                      poolNumber.getAndIncrement() +
                     "-thread-";
    }
    public Thread newThread(Runnable r) {
        Thread t = new Thread(group, r,
                              namePrefix + threadNumber.getAndIncrement(),
                              0);
        if (t.isDaemon())
            t.setDaemon(false);
        if (t.getPriority() != Thread.NORM_PRIORITY)
            t.setPriority(Thread.NORM_PRIORITY);
        return t;
    }
}
```

从源码看出DefaultThreadFactory就是创建一个普通的线程，非守护线程，优先级为5。

新线程具有可通过 pool-N-thread-M 的 Thread.getName() 来访问的名称，其中 N 是此工厂的序列号， M 是此工厂所创建线程的序列号。

Executors.PrivilegedThreadFactory

```java
static class PrivilegedThreadFactory extends DefaultThreadFactory {
    private final ClassLoader ccl;
    private final AccessControlContext acc;
    PrivilegedThreadFactory() {
        super();
        this.ccl = Thread.currentThread().getContextClassLoader();
        this.acc = AccessController.getContext();
        acc.checkPermission(new RuntimePermission("setContextClassLoader"));
    }
    public Thread newThread(final Runnable r) {
        return super.newThread(new Runnable() {
            public void run() {
                AccessController.doPrivileged(new PrivilegedAction<Object>() {
                    public Object run() {
                        Thread.currentThread().setContextClassLoader(ccl);
                        r.run();
                        return null;
                    }
                }, acc);
            }
        });
    }
}
```

从源码看出，PrivilegedThreadFactory extends DefaultThreadFactory从而具有与 defaultThreadFactory() 相同设置的线程。但增加了两个特性：ClassLoader和AccessControlContext，从而使运行在此类线程中的任务具有与当前线程相同的访问控制和类加载器。
