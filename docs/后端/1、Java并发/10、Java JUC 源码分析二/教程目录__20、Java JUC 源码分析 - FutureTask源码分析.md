# 20、Java JUC 源码分析 - FutureTask源码分析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/20.html
- 分类：Java并发
- 分组：教程目录
## 使用

```java
FutureTask<String> futureTask = new FutureTask(() -> "success");
new Thread(futureTask).start();
futureTask.get();
```

## 源码分析

FutureTask提供了两个构造方法，分别是传入一个Callable，和传入一个Runnable加返回值result。如果传入的是Runnable加返回值，那么会通过适配器**RunnableAdapter**将其包装成一个Callable。

```java
public FutureTask(Runnable runnable, V result) {
    this.callable = Executors.callable(runnable, result);
    this.state = NEW;       // ensure visibility of callable
}
```

通过调用Executors.callable方法包装Callable：

```java
public static <T> Callable<T> callable(Runnable task, T result) {
    if (task == null)
        throw new NullPointerException();
    return new RunnableAdapter<T>(task, result);
}
```

RunnableAdapter实现了Callable接口，其call方法的返回值就是result：

```java
static final class RunnableAdapter<T> implements Callable<T> {
    final Runnable task;
    final T result;
    RunnableAdapter(Runnable task, T result) {
        this.task = task;
        this.result = result;
    }
    public T call() {
        task.run();
        return result;
    }
}
```

在一个FutureTask创建成功后，其默认状态state为NEW。在FutureTask中为state定义了7个状态，并且state被volatile修饰以保证可见性，这7个状态分别是：

- NEW：新建状态（初始默认状态）
- COMPLETING：正在完成中，这个状态表示任务已经执行完成，但是还没有设置结果（正常结果或者异常）
- NORMAL：普通状态，状态变为COMPLETING并成功设置结果之后会变成这个状态
- EXCEPTIONAL：抛出了异常，任务执行抛出了异常则会变为这个状态，和NORMAL一样，在变为此状态之前也有个COMPLETING中间状态
- CANCELLED：被取消
- INTERRUPTING：正在被中断中，表示准备中断线程，但是还未中断
- INTERRUPTED：被中断

state可能的状态转换情况如下：

- NEW -> COMPLETING -> NORMAL ：新建->完成中（任务已经完成，但是结果还未保存）->普通状态（结果保存完成）
- NEW -> COMPLETING -> EXCEPTIONAL ：新建->完成中（任务抛出异常，但是异常还未保存）->异常状态（异常保存完成）
- NEW -> CANCELLED ：新建->取消
- NEW -> INTERRUPTING -> INTERRUPTED：新建->中断中（准备中断，但还未中断）->完成中断（调用了interrupt方法）

FutureTask实现了Runnable接口，所以可以直接通过其run方法在当前线程执行任务，其run方法就是调用callable的call方法，call方法执行完毕之后，任务状态变为COMPLETING，并且call方法有一个返回值，正常执行得到返回值之后将其保存到**outcome**属性中，然后任务状态从COMPLETING变为NORMAL；如果任务执行抛出了异常， 那么任务状态也先变为COMPLETING，然后将异常对象设置到outcome属性，接着任务状态从COMPLETING变为EXCEPTIONAL。FutureTask的run方法如下：

```java
public void run() {
    if (state != NEW ||
        !UNSAFE.compareAndSwapObject(this, runnerOffset,
                                     null, Thread.currentThread()))
        //检查任务状态和执行线程，如果状态不是NEW，或者通过CAS设置当前线程为任务执行线程失败，那么直接返回
        return;
    try {
        Callable<V> c = callable;
        if (c != null && state == NEW) {
            //在此判断任务状态
            V result;
            boolean ran;
            try {
                //执行任务
                result = c.call();
                //表示任务执行成功
                ran = true;
            } catch (Throwable ex) {
                //抛出了异常，任务状态：NEW->COMPLETING->EXCEPTIONAL
                result = null;
                ran = false;
                setException(ex);
            }
            if (ran)
                //任务执行成功，任务状态：NEW->COMPLETING->NORMAL
                set(result);
        }
    } finally {
        //将runner设置为null，保证其它线程能够再次执行此任务
        runner = null；
        int s = state;
        if (s >= INTERRUPTING)
            //线程被中断
            handlePossibleCancellationInterrupt(s);
    }
}
```

> 注：将FutureTask交给Thread去执行和将Runnable交给Thread去执行是一样的，Thread.start方法就是负责调用本地方法启动一个线程去异步执行提交的任务，差别就是FutureTask可以调用get方法获取任务执行的结果，而结果保存在outcome属性中。

run（）方法的大体逻辑相对来说比较简单，就是调用Callable的call方法获取返回值，然后将返回值设置到outcome中，此时任务的状态变化为：NEW->COMPLETING->NORMAL；如果call方法抛出了异常，那么将异常设置到outcome中，此时任务的状态变化为：NEW->COMPLETING->EXCEPTIONAL。

任务执行失败的处理逻辑在setException方法中：

```java
protected void setException(Throwable t) {
    //先将任务修改为COMPLETING状态
    if (UNSAFE.compareAndSwapInt(this, stateOffset, NEW, COMPLETING)) {
        //保存异常
        outcome = t;
        //将任务修改为EXCEPTIONAL状态
        UNSAFE.putOrderedInt(this, stateOffset, EXCEPTIONAL); // final state
        finishCompletion();
    }
}
```

任务执行成功设置返回值是通过调用set方法实现的：

```java
protected void set(V v) {
    //先将任务修改为COMPLETING状态
    if (UNSAFE.compareAndSwapInt(this, stateOffset, NEW, COMPLETING)) {
        //保存返回值
        outcome = v;
        //将任务修改为NORMAL状态
        UNSAFE.putOrderedInt(this, stateOffset, NORMAL); // final state
        finishCompletion();
    }
}
```

在setException和set方法中都体现了FutureTask任务的状态转化，不过我们注意到两个方法中都调用了一个finishCompletion方法，这个finishCompletion的逻辑如下：

```java
private void finishCompletion() {
    for (WaitNode q; (q = waiters) != null;) {
        if (UNSAFE.compareAndSwapObject(this, waitersOffset, q, null)) {
            for (;;) {
                //循环唤醒waiters队列中的所有阻塞线程
                Thread t = q.thread;
                if (t != null) {
                    q.thread = null;
                    //唤醒阻塞的线程
                    LockSupport.unpark(t);
                }
                //唤醒了一个节点之后将其从链表中移除
                WaitNode next = q.next;
                if (next == null)
                    break;
                q.next = null; // unlink to help gc
                q = next;
            }
            break;
        }
    }
    //空方法
    done();
    callable = null;        // to reduce footprint
}
```

从状态的转换流程中可以看出，不论任务是正常完成还是抛出了异常，在FutureTask中都认为是任务完成。在finishCompletion方法中的主要逻辑是唤醒所有阻塞的线程，这些阻塞的线程是怎么来的呢？其实就是调用FutureTask的get方法生成的。FutureTask支持异步获取任务执行的结果，主要提供了两个方法get()和get(long timeout,TimeUnit unit)，分别表示永久阻塞等待和超时阻塞等待，来看看get方法的实现：

```java
public V get() throws InterruptedException, ExecutionException {
    int s = state;
    if (s <= COMPLETING)
        //阻塞线程，传入false表示不用超时阻塞
        s = awaitDone(false, 0L);
    //任务已经完成了，处于COMPLETING之后的状态
    return report(s);
}
```

get(long timeout,TimeUnit unit)方法的实现：

```java
public V get(long timeout, TimeUnit unit)
    throws InterruptedException, ExecutionException, TimeoutException {
    if (unit == null)
        throw new NullPointerException();
    int s = state;
    if (s <= COMPLETING &&
        //传入true表示需要超时阻塞
        (s = awaitDone(true, unit.toNanos(timeout))) <= COMPLETING)
        throw new TimeoutException();
    return report(s);
}
```

如果任务处于COMPLETING之后的状态，表示任务已经完成了（不论是正常完成还是抛出异常），否则进入超时阻塞等待，如果超时唤醒后发现任务还未完成，那么抛出**TimeoutException**异常。

我们注意到，永久阻塞和超时阻塞都是通过**awaitDone**方法实现的，该方法有两个入参，分别是：

- timed：布尔型参数，表示是否需要超时阻塞
- nanos：超时阻塞的时间

那么我们进入awaitDone方法看看是如何实现的：

```java
private int awaitDone(boolean timed, long nanos)
    throws InterruptedException {
    //计算线程阻塞的终止时间：当前时间+最大阻塞时间
    final long deadline = timed ? System.nanoTime() + nanos : 0L;
    WaitNode q = null;
    boolean queued = false;
    for (;;) {
        if (Thread.interrupted()) {
            //如果线程被中断了，从阻塞队列中移除，抛出中断异常
            removeWaiter(q);
            throw new InterruptedException();
        }
        int s = state;
        if (s > COMPLETING) {
            //如果任务已经结束，那么返回当前任务状态，后续会根据任务状态解析结果
            if (q != null)
                q.thread = null;
            return s;
        }
        else if (s == COMPLETING) // cannot time out yet
            //如果任务正在完成中，那么只需要等待任务完成即可
            //这里使用yield释放cpu时间片，等待下一次cpu执行
            Thread.yield();
        else if (q == null)
            //如果q为null，那么新建一个WaitNode，q是awaitDone方法的局部变量，初始为null
            q = new WaitNode();
        else if (!queued)
            //如果q还没有入队，那么通过CAS将其入队（waiters相当于是单向链表的头结点）
            queued = UNSAFE.compareAndSwapObject(this, waitersOffset,
                                                 q.next = waiters, q);
        else if (timed) {
            //如果需要超时等待，根据阻塞截止时间和当前时间计算需要阻塞的时间
            //因为此方法的逻辑中，排队节点的创建、入队、和阻塞等都是是通过for循环一次一次的进行推进
            //所以在阻塞之前要重新计算一下剩余需要阻塞的时间
            nanos = deadline - System.nanoTime();
            if (nanos <= 0L) {
                //如果剩余阻塞时间小于等于0 ，说明阻塞时间已经过了，直接移除节点，然后返回任务状态
                removeWaiter(q);
                return state;
            }
            //超时阻塞
            LockSupport.parkNanos(this, nanos);
        }
        else
            //不带超时的阻塞
            LockSupport.park(this);
    }
}
```

一个线程要获取FutureTask任务的执行结果，如果任务还未完成，那么线程就需要被阻塞。首先线程会被封装成一个WaitNode对象，WaitNode是FutureTask的一个静态内部类，其结构很简单，就是包含一个线程对象（thread）和一个WaitNode对象（next）：

```java
static final class WaitNode {
    volatile Thread thread;
    volatile WaitNode next;
    WaitNode() {
  thread = Thread.currentThread(); }
}
```

FutureTask通过这个WaitNode构建了一个单向链表（**waiters**属性），所有通过获取FutureTask任务结果而阻塞的线程都排在这个单向链表中，每个WaitNode是通过CAS入队的，这个和AQS中的同步队列和条件队列基本是一样的逻辑。

awaitDone方法有个特点，WaitNode的创建、入队、阻塞，包括线程被唤醒之后各种处理的都是通过for循环自旋推进的。比如：

- 第一次循环判断局部变量q为null，那么创建一个WaitNode
- 第二次循环判断!queue为true，说明上一次创建的WaitNode还没有入队，那么WaitNode通过CAS入队，如果CAS失败，说明有多个线程在并发入队，留待下一次for循环再进行入队
- 第三次循环判断是否需要超时阻塞，如果有超时，会重新计算一次剩余阻塞时间， 通过parkNanos方法进行阻塞；如果超时时间已经过了，则直接返回任务状态。如果不使用超时，那么直接通过park方法阻塞线程

由于通过for循环推进也需要消耗时间，所以在awaitDone方法开始的时候会先保存线程阻塞的终止时间，等待线程真正开始parkNanos阻塞的时候，会再计算一下剩余需要阻塞的时间，如果阻塞时间已经过了，那么直接返回任务状态。

可以看到，awaitDone方法的返回值是任务的状态state，最终还会调用report方法根据任务的状态返回任务的最终结果。而awaitDone方法返回有几种情况：

- 线程被中断：线程醒来后会在下次循环中判断发现线程被中断，进而抛出InterruptedException
- 线程被unpark唤醒，然后发现任务已经完成：返回任务当时的状态（>COMPLETING）
- 线程超时唤醒：线程等待超时时间到了也没有等到任务完成，方法返回后会在外层get方法里判断如果任务状态小于等于COMPLETING，表示是超时唤醒，那么抛出TimeoutException

在分析了awaitDone方法之后，我们就能明白在run方法中任务完成之后，在set方法保存结果之后调用finishCompletion方法的作用了，就是循环唤醒waiters链表中的所有线程，线程被唤醒后发现任务状态大于COMPLETING，那么awaitDone方法得以返回。awaitDone方法返回的是任务的状态，还需要在report方法中决定get方法最终的返回值：

```java
private V report(int s) throws ExecutionException {
    Object x = outcome;
    if (s == NORMAL)
        //任务正常完成，返回结果，其它都是异常结束
        return (V)x;
    if (s >= CANCELLED)
        throw new CancellationException();
    throw new ExecutionException((Throwable)x);
}
```

最后我们还需要看一下cancel方法的逻辑：

```java
public boolean cancel(boolean mayInterruptIfRunning) {
    //mayInterruptIfRunning表示是否中断任务线程
    //如果需要中断线程，那么需要把任务状态先调整为一个中间状态：INTERRUPTING
    //否则直接将状态调整为CANCELLED
    if (!(state == NEW &&
          UNSAFE.compareAndSwapInt(this, stateOffset, NEW,
              mayInterruptIfRunning ? INTERRUPTING : CANCELLED)))
        //cas失败了，说明同时有其它线程在操作
        return false;
    try {
     // in case call to interrupt throws exception
        if (mayInterruptIfRunning) {
            try {
                Thread t = runner;
                if (t != null)
                    t.interrupt();
            } finally {
  // final state
                UNSAFE.putOrderedInt(this, stateOffset, INTERRUPTED);
            }
        }
    } finally {
        //触发任务完成的逻辑，唤醒waiters链表中的所有阻塞线程
        finishCompletion();
    }
    return true;
}
```

之后NEW状态下的任务才能被cancel，该方法同时提供了一个布尔参数mayInterruptIfRunning，表示是否需要中断执行任务的线程，如果需要中断线程，那么任务状态会先调整为一个中间状态：INTERRUPTING，之后调用线程的interrupt方法后再将状态调整为INTERRUPTED，这个中间状态和COMPLETING类似；如果不需要中断线程，那么直接将任务修改为CANCELLED状态，如果CAS修改失败，那么直接返回，不再执行后面的逻辑，因为这代表有多个线程在并发cancel，只需要一个线程处理这个逻辑。

如果CAS修改状态成功，那么可以执行后面cancel

从cancel的逻辑中可以发现，通过FutureTask提供的cancel方法，如果传入的mayInterruptIfRunning为false，那么对于任务线程本身并不会做什么操作，而只是将状态修改为CANCELLED状态，然后调用finishCompletion方法唤醒阻塞线程；即使是入参为true，那么也是中断线程，如果任务没有响应中断，那么任务也不会退出，即使任务已经是CANCELED状态。

## 总结

FutureTask提供了两种构建方式，分别是传入Callable和传入Runnable，如果传入的是Runnable，也会通过适配器将其包装为一个Callable，FutureTask间接实现了Runnable接口，将其提交给Thread之后执行的就是其run方法，在FutureTask的run方法中调用的是Callable的call方法并且获取结果，对于同一个FutureTask，同时只能有一个线程执行该任务，这点体现在Thread类型的runner属性上，在run方法执行之前，会通过CAS将runner以null为期望值修改为当前线程，修改成功才会进入后续的逻辑。

FutureTask中对于任务规定了7种状态，任务初始默认为NEW状态，大体来说FutureTask中的任务可能会：正常执行结束、任务抛出异常结束、被取消、被中断，这些行为也反映在了定义的7种状态中。

任务在FutureTask中，正常完成或者抛出异常都算是任务完成，需要保存任务结果，如果任务正常完成，那么结果就是Callable的call方法的返回值；如果抛出异常，那么结果就是异常对象。当任务完成之后需要唤醒所有由于调用get方法获取结果而阻塞的线程，这些线程保存在一个通过WaitNode构建的单向链表中，唤醒的时候从链表头节点（waiters）开始依次unpark即可。

通过get方法获取任务执行结果而阻塞的线程，会在awaitDone方法中完成WaitNode的创建、入队和阻塞等操作，阻塞分为超时阻塞和永久阻塞，如果是超时阻塞，那么线程被唤醒的方式有中断线程、达到超时时间、unpark；如果是永久阻塞，那么线程被唤醒的方式有中断线程和unpark。当线程被唤醒后，会返回当前任务的状态，或者抛出中断异常，返回任务状态state之后，会通过report方法决定get方法最终返回结果，如果任务是正常结束的，那么返回结果值，否则会抛出相应的异常。

最后还需要注意，FutureTask的cancel方法并不能保证任务线程立即退出，不过无论如何都会唤醒阻塞线程。当然这点在线程池中也一样，即使调用了线程池的shutdownNow方法，也不能保证工作线程能够立即退出，这个要取决于任务如何响应中断请求，如果要强制结束一个线程，那么可以调用Thread类的stop方法，虽然该方法不建议调用，但是这个方法在处理一些顽固"僵死"线程时很有用。
