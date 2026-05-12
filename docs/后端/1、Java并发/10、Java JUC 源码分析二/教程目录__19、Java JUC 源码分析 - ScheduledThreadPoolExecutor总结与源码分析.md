# 19、Java JUC 源码分析 - ScheduledThreadPoolExecutor总结与源码分析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/19.html
- 分类：Java并发
- 分组：教程目录
## 前言

ScheduledThreadPoolExecutor主要用于处理延时任务或者定时任务，在平时的工作场景中也有被广泛应用，而我们有了前文关于ThreadPoolExecutor源码的深入理解，这里理解ScheduledThreadPoolExecutor便会顺畅不少。

## 使用

ScheduledThreadPoolExecutor的使用还是比较简单，总体来说主要有三种方式提交任务：

- **schedule**：延时执行一个任务

```java
schedule(runnable, 3, TimeUnit.SECONDS);
```

表示延时3秒执行runnable任务， 同时schedule还支持提交一个Callable任务，通过返回的ScheduledFuture可以在后续的流程中获取任务的执行结果。

- **scheduleAtFixedRate**：相对于schedule方法，多了一个**period**参数，表示每隔多久执行一次任务，可以使用它实现周期调度任务的目的。

```java
scheduleAtFixedRate(runnable, 1, 2, TimeUnit.SECONDS);
```

表示延时1秒开始执行runnable，并且并且之后每隔2秒执行一次runnable。要注意，如果任务的执行时间超过了间隔时间（period），那么在任务执行完成后会立即执行下一次runnable，也就是说严格按照period间隔时间计算，只是到了period指定的间隔，由于任务还在执行，所以等待任务执行完成后会立即调度下一次执行。在一个任务执行完成后才会插入下一次需要执行的任务，所以不会存在任务堆积的情况。

- **scheduleWithFixedDelay**：用法和scheduleAtFixedRate类似，相对于schedule方法多了一个**delay**参数，也用于提交周期任务。和scheduleAtFixedRate的区别是，如果任务执行时间超过了delay参数，那么任务执行完后还是会再等待delay指定的时间才运行下一次任务，也就是说delay从任务结束的时间开始算。

```java
scheduleWithFixedDelay(runnable, 3, 2, TimeUnit.SECONDS);
```

> 注：同时也支持execute和submit方法提交任务，实现就是通过schedule提交一个延时为0的任务。

## 源码分析

从类继承关系图中可以看出，ScheduledThreadPoolExecutor继承了ThreadPoolExecutor，所以它具备ThreadPoolExecutor的能力，同时实现了ScheduledExecutorService接口，该接口定义了4个方法：

这几个接口使得ScheduledThreadPoolExecutor具备了延时执行和定时调度的能力。

首先来看构造方法，从源码看来，ScheduledThreadPoolExecutor提供了四个构造方法：

```java
	 public ScheduledThreadPoolExecutor(int corePoolSize) {
        super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
              new DelayedWorkQueue());
    }
    public ScheduledThreadPoolExecutor(int corePoolSize,
                                       ThreadFactory threadFactory) {
        super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
              new DelayedWorkQueue(), threadFactory);
    }
    public ScheduledThreadPoolExecutor(int corePoolSize,
                                       RejectedExecutionHandler handler) {
        super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
              new DelayedWorkQueue(), handler);
    }
    public ScheduledThreadPoolExecutor(int corePoolSize,
                                       ThreadFactory threadFactory,
                                       RejectedExecutionHandler handler) {
        super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
              new DelayedWorkQueue(), threadFactory, handler);
    }
```

构造器主要就是三个参数：

- **corePoolSize**：线程池大小
- **threadFactory**：线程工厂
- **handler**：拒绝策略

ScheduledThreadPoolExecutor是ThreadPoolExecutor的子类，但是可以从构造函数中看到，指定的maximumPoolSize都是Integer.MAX_VALUE，并且阻塞队列使用的是DelayedWorkQueue，keepAliveTime设置为0。从这些参数设置中我们就能发现，对于ScheduledThreadPoolExecutor来说，没有了核心线程池的概念，因为队列DelayedWorkQueue是一个无界队列，所以线程数不可能超过corePoolSize的大小。

## schedule实现

```java
public ScheduledFuture<?> schedule(Runnable command,
                                       long delay,
                                       TimeUnit unit) {
        if (command == null || unit == null)
            throw new NullPointerException();
        //计算任务的触发时间，然后将任务command包装为一个ScheduledFutureTask，然后调用decorateTask方法进行进一步包装
        //decorateTask方法在这里没有做任何包装操作，如果需要可以继承然后自己实现
        RunnableScheduledFuture<?> t = decorateTask(command, new ScheduledFutureTask<Void>(command, null, triggerTime(delay, unit)));
		//提交任务
        delayedExecute(t);
        return t;
    }
```

调用方法很简单，首先会根据delay和unit计算任务的触发时间，计算逻辑就是当前时间加上延时时间，这个代码这里就不贴了。然后将触发时间和任务包装成一个**ScheduledFutureTask**，再然后会调用**decorateTask**进行进一步包装，包装成一个RunnableScheduledFuture，这个decorateTask方法在ScheduledThreadPoolExecutor中没有做什么其它操作，直接返回的是上一步创建的ScheduledFutureTask，子类可以重写该方法对任务进行进一步的包装。

> 注：ScheduledFutureTask是ScheduledThreadPoolExecutor的子类

从ScheduledFutureTask的继承关系中可以看出，它实现了Comparable接口，具备比较大小的功能；实现了Future接口，具备获取执行结果的功能；实现了Runnable，可以作为任务被运行。

但是Runnable是不具备返回值的，这里怎么返回的ScheduledFutureTask呢？可以来看看ScheduledFutureTask关于Runnable的构造函数：

```java
	ScheduledFutureTask(Runnable r, V result, long ns) {
			//result表示任务的返回值
            super(r, result);
            this.time = ns;
            this.period = 0;
            this.sequenceNumber = sequencer.getAndIncrement();
        }
```

该构造函数需要一个任务返回值，在前面schedule(runnable)的方法中传入的是null，表示一个空的返回，然后到父类FutureTask中看看：

```java
	public FutureTask(Runnable runnable, V result) {
		//将runnable包装横一个Callable
        this.callable = Executors.callable(runnable, result);
        this.state = NEW;       // ensure visibility of callable
    }
```

在父类FutureTask中，Runnable被转换成了Callable，这是通过Executors.callable实现的：

```java
	public static <T> Callable<T> callable(Runnable task, T result) {
        if (task == null)
            throw new NullPointerException();
        return new RunnableAdapter<T>(task, result);
    }
    //适配器
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

这里运用了**适配器模式**，将一个Runnable和指定的返回值适配成了一个Callable。所以说通过schedule方法提交一个Runnable任务，也会通过适配器模式将其包装成一个Callable，最终生成一个ScheduledFutureTask。相对来说，如果schedule方法提交的是一个Callable任务，就不用适配了，这个代码就不贴了。

现在对schedule方法做一个简单总结：提交的任务如果是一个**Runnable**，那么会通过适配器模式将其转换成一个返回值为null的**Callable**，如果任务本身就是一个Callable则不用包装，最终被包装成一个**ScheduledFutureTask**，这里还提供了一个**decorateTask**方法提供给用户实现，以支持对这个任务进行进一步包装，包装完成后通过**delayedExecute**方法提交任务，然后返回**ScheduledFuture**。

那么接下来我们进入delayedExecute方法看看任务是如何提交的：

```java
    private void delayedExecute(RunnableScheduledFuture<?> task) {
        if (isShutdown())
        	//如果线程池不是RUNNING状态，那么执行拒绝策略
            reject(task);
        else {
        	//将任务添加到队列中
            super.getQueue().add(task);
            //再次检查线程池状态和参数配置，可能需要取消该任务
            if (isShutdown() &&
                !canRunInCurrentRunState(task.isPeriodic()) &&
                remove(task))
                //退出任务(状态修改为CANCELLED)，不中断线程
                task.cancel(false);
            else
            	//确定有线程去执行任务，可能需要新建一个工作线程
                ensurePrestart();
        }
    }
```

如果线程池不是RUNNING状态，那么会执行拒绝策略，否则会将任务直接放到阻塞队列中，这里使用的队列写死在ScheduledThreadPoolExecutor的构造函数中，是DelayedWorkQueue，这是一个延时队列 。任务放到队列中之后会再次检查线程池状态，如果线程池被SHUTDOWN了，那么就表示现在的情况是**先提交了任务，再关闭线程池**，针对这种情况，对于周期任务和普通延时任务有两个参数来控制行为，分别是：

- **continueExistingPeriodicTasksAfterShutdown**：针对周期任务，true表示不会取消任务，false表示会取消任务
- **executeExistingDelayedTasksAfterShutdown**：针对非周期任务，true表示不会取消任务，false表示会取消任务

这两个参数都有对应的set方法可以更改，而对于这个逻辑控制主要是**canRunInCurrentRunState(task.isPeriodic())**方法调用实现的：

```java
	boolean canRunInCurrentRunState(boolean periodic) {
		//periodic表示是否为周期任务
        return isRunningOrShutdown(periodic ?
                                   continueExistingPeriodicTasksAfterShutdown :
                                   executeExistingDelayedTasksAfterShutdown);
    }
    final boolean isRunningOrShutdown(boolean shutdownOK) {
        int rs = runStateOf(ctl.get());
        //如果状态RUNNING或者是SHUTDOWN并且传入的shutdownOK为true
        //那么这里返回true，那么canRunInCurrentRunState返回true，取反就是false，就不会移除并且停止任务
        return rs == RUNNING || (rs == SHUTDOWN && shutdownOK);
    }
```

当然，正常情况下的逻辑不会来到这个分支，而是直接进入ensurePrestart方法：

```java
	 void ensurePrestart() {
        int wc = workerCountOf(ctl.get());
        if (wc < corePoolSize)
        	//如果workerCount小于corePoolSize，那么判断创建一个工作线程
            addWorker(null, true);
        else if (wc == 0)
        	//到这里说明wc>=corePoolSize，而wc==0，但是corePoolSize不能为-1
        	//说明corePoolSize==0
            addWorker(null, false);
        //如果workerCount>=corePoolSize，并且corePoolSize不为0，那么什么也不做
    }
```

ensurePrestart方法主要做的事儿就是创建工作线程，ScheduledThreadPoolExecutor和ThreadPoolExecutor不一样，不会在提交任务的时候顺带就创建线程，而是这直接把任务添加到队列中。同时，如果corePoolSize配置的是0，就意味着ScheduledThreadPoolExecutor中的工作线程数量不会超过1个，也就是说corePoolSize设置为1和0效果是一样的，区别就是addWorker的方式不一样。

到这里，ScheduledThreadPoolExecutor中schedule方法的逻辑已经分析完了~ 剩余的就是ThreadPoolExecutor的逻辑：工作线程不断的从任务队列中获取任务来执行，包括runWorker、getTask等方法的调用逻辑都是一样的，具体可以参考[ThreadPoolExecutor总结与源码深度分析](https://huangzhilin.blog.csdn.net/article/details/116015302)。但是ScheduledThreadPoolExecutor最核心的内容我们还没有提到，那就是在构造函数中写死的阻塞队列：**DelayedWorkQueue**，先来看看它的继承关系：

## DelayedWorkQueue

DelayedWorkQueue实现的是一个优先队列，这里底层则是通过**二叉堆**实现的，二叉堆本质上是一个完全二叉树或近似完全二叉树，分为最大堆和最小堆两种方式，通常由**数组**作为基础数据结构进行实现。

- **最大堆**：父节点的总是大于或等于子节点的值，每一个子树都是一个最大堆
- **最小堆**：父节点的值总是小于或等于子节点的值，每一个子树都是一个最小堆

DelayedWorkQueue中存储的是RunnableScheduledFuture，实际上是**ScheduledFutureTask**类型，在创建ScheduledFutureTask的时候会设置任务触发的时间保存到**time**属性中，如果是周期任务，那么周期时间会存储在**period**属性中。

通过最小堆来实现DelayedWorkQueue，排序主要依赖time字段（time相同使用sequenceNumber），就能保证堆顶一直是最近需要执行的任务。线程池使用阻塞队列主要就是调用定义在阻塞队列**BlockingQueue**中的三个方法：

- add：将任务添加到队列中，实际调用offer方法
- take：从队列中获取并移除队头元素，如果队列为空，会阻塞直到队列加入新元素
- poll：和take一样，只是在阻塞的时候会有一个超时时间，如果达到超时时间还没有获取到元素，那么会返回，可能抛出InterruptedException
- peek：从队列获取队头元素，但是不移除

> 注：最小堆的插入只需要在数组末尾插入元素，然后比较其和父节点大小，如果小于父节点则交换，然后继续向上调整，直到调整到根节点（自底向上调整）；而堆顶元素移除操作（最小堆就是移除最小元素，最大堆就是移除最大元素）则是直接用数组最后一个元素代替被移除的元素，然后自顶向下调整，对于最小堆而言就是和两个子节点的最小值比较，如果比这个值大则交换，直到调整到尾节点。二叉堆相对来说比较简单，更多信息这里就不赘述了~

现在我们知道了DelayedWorkQueue是由最小堆实现的，那么又是如何实现任务延时执行的呢？在ScheduledThreadPoolExecutor中，一个工作线程被创建后会调用父类ThreadPoolExecutor的getTask方法获取任务，而getTask方法会根据是否需要超时获取任务来调用阻塞队列的take方法或poll方法，这里就来看看DelayedWorkQueue的take方法实现：

```java
        public RunnableScheduledFuture<?> take() throws InterruptedException {
            final ReentrantLock lock = this.lock;
            lock.lockInterruptibly();
            try {
            	//自旋
                for (;;) {
                	//获取队头元素
                    RunnableScheduledFuture<?> first = queue[0];
                    if (first == null)
                    	//如果为空表示队列为空，那么线程进入条件队列阻塞
                        available.await();
                    else {
                    	//队头元素不为空，获取其距可执行还剩余的时间
                        long delay = first.getDelay(NANOSECONDS);
                        if (delay <= 0)
                        	//如果delay<=0，说明任务可以执行了
                        	//完成任务获取，返回任务
                            return finishPoll(first);
                        //否则表示队头任务还没有到该执行的时候，而队头元素一定是最近需要执行的任务
                        //也就表明队列中没有一个任务需要现在执行
                        first = null; // don't retain ref while waiting
                        if (leader != null)
                        	//leader是一个线程，如果不为空，那么进入条件队列阻塞，一直等待
                            available.await();
                        else {
                        	//将当前线程设置为leader
                            Thread thisThread = Thread.currentThread();
                            leader = thisThread;
                            try {
                            	//然后进入条件队列阻塞，但是超时时间是队头任务还需剩余的触发时间
                            	//超时之后再次循环到上面去获取队头元素，判断是否需要触发，理论上这里超时了就代表队头元素
                            	//到了该执行的时间
                                available.awaitNanos(delay);
                            } finally {
                            	//这里leader线程可能发生了变更
                                if (leader == thisThread)
                                	//又将leader置空
                                    leader = null;
                            }
                        }
                    }
                }
            } finally {
                if (leader == null && queue[0] != null)
                    available.signal();
                lock.unlock();
            }
        }
```

take()方法的逻辑很简单，就是从最小堆中获取堆顶元素，这个元素对应的任务一定是任务列表中需要最先执行的（因为最小堆根据任务触发时间排序），获取到之后判断当前是否到了该任务需要触发的时间，如果达到了则返回该任务，返回的时候也会移除该节点，然后最小堆自动调整，堆顶元素又成了剩余任务列表中需要最先执行的任务；而如果没有到达执行时间，则需要阻塞等待，在阻塞被唤醒后又会进入循环再次获取堆顶元素，判断触发时间。如果任务达到了触发时间，那么通过finishPoll方法返回任务。

在finishPoll方法中，就是将任务数量(size属性)减1，然后重新调整堆，使剩余任务中需要最先触发的任务排在堆顶位置：

```java
	private RunnableScheduledFuture<?> finishPoll(RunnableScheduledFuture<?> f) {
            int s = --size;
            RunnableScheduledFuture<?> x = queue[s];
            queue[s] = null;
            if (s != 0)
            	//调整堆
                siftDown(0, x);
            setIndex(f, -1);
            return f;
        }
```

任务返回后会调用其run方法运行任务，这个是ThreadPoolExecutor的逻辑，任务是ScheduledFutureTask类型：

其间接实现了Runnable接口，继承自FutureTask，在ScheduledFutureTask中找到run方法实现：

```java
	public void run() {
			//判断是否为周期任务
            boolean periodic = isPeriodic();
			//判断在当前线程池状态下是否能够执行该任务
            if (!canRunInCurrentRunState(periodic))
                cancel(false);
            else if (!periodic)
            	//不是周期任务，调用父类FutureTask的run方法
                ScheduledFutureTask.super.run();
            else if (ScheduledFutureTask.super.runAndReset()) {
            	//如果是周期任务，调用父类的runAndReset方法
            	//设置任务下次运行时间
                setNextRunTime();
                //outerTask任务重新入队，outerTask在提交周期任务的时候会设置
                reExecutePeriodic(outerTask);
            }
        }
```

从这个run方法中我们能够看出来，任务执行的时候会再次判断线程池状态，根据是否为周期任务和具体的参数来决定是否能够执行任务。如果任务不是周期任务，那么调用父类的run方法执行，否则调用父类的runAndReset方法。runAndReset和run方法的主要区别是runAndReset不会保存任务执行结果，并且会将任务状态重置为NEW（关于FutureTask在后面的文章中再细说~）。而如果是周期任务，在任务执行完成并且重置任务状态后，会计算任务的下次运行时间，然后将任务重新入队，等待下次执行（下文细说）。

但是take方法中出现的leader线程是什么意思呢？这里就涉及到一个Leader-Follower模式。

## Leader-Follower线程模型

在这个模型中，线程分为**Leader**和**Follwer**角色，还有一个**processing**状态。在线程池中只有一个Leader线程负责等待接收请求(事件)，其它的都是Follwer线程，Leader接收请求后会从Follower中选拔一个新的Leader线程等待下一个请求，而自己转入processing状态，处理完成后又成为Follower，这种模式在基于事件分发的线程池场景下减少了线程上下文切换。

> 注：ReentrantLock创建的Condition在await的时候会调用fullRelease方法释放互斥锁(state)，所以即使take方法通过lockInterruptibly施加了互斥锁，在线程await进入条件队列阻塞后，其它线程也能获取互斥锁，从而进入for循环

在DelayedWorkQueue的场景中，从队列中获取一个任务后，如果任务还没有到触发时间，那么该任务就不能被执行，这可以通过阻塞线程实现：只需要将获取到任务的线程阻塞距离任务运行的剩余时间，线程醒来后然后再在循环中重新从队列获取任务，再次判断触发时间即可。前面也提到了，DelayedWorkQueue底层是通过数组实现的一个最小二叉堆，那么队头的任务(queue[0])一定是需要最先执行的任务，假设线程1获取到互斥锁进入for循环，从队头获取任务，发现任务运行还需要t秒，那么进入条件队列进行超时(t秒)阻塞，同时释放state；接着线程2获取到互斥锁进入for循环，从队头获取任务，发现任务运行还需要tt秒，那么也需要进入条件队列进行阻塞，但是线程2的这个阻塞就不用使用超时(tt秒)阻塞了；如果还有线程3，也同理。

leader线程的引入就是为了在这种情况下减少不必要的超时阻塞，借鉴的就是Leader-Follower线程模型，对于队头任务，只有一个leader线程负责对其进行超时阻塞等待，其它线程都进行"永久"等待，leader线程从队列中取走任务之后(queue[0])则唤醒一个follower线程成为新的leader。

到现在我们已经了解到了队列DelayedWorkQueue中的任务是如何被消费的，那么回过头来看看delayedExecute方法中任务入队的逻辑，也就是DelayedWorkQueue的add方法：

```java
		public boolean add(Runnable e) {
            return offer(e);
        }
```

间接调用的offer方法：

```java
        public boolean offer(Runnable x) {
            if (x == null)
                throw new NullPointerException();
            RunnableScheduledFuture<?> e = (RunnableScheduledFuture<?>)x;
            final ReentrantLock lock = this.lock;
            lock.lock();
            try {
                int i = size;
                if (i >= queue.length)
                	//元素数量达到了队列长度（默认为16），则需要扩容
                    grow();
                //任务数量加1，任务出队的时候减一
                size = i + 1;
                if (i == 0) {
                	//直接设置队头元素
                    queue[0] = e;
                    setIndex(e, 0);
                } else {
                	//任务入队（最小二叉堆），并且自动调增堆，使触发时间最小的排在堆顶位置
                    siftUp(i, e);
                }
                if (queue[0] == e) {
                	//如果天添加的任务位于堆顶，那么说明队列之前为空，或者任务入队，堆调整
                	//后排在堆顶位置
                	//那么置空leader，唤醒一个线程，被唤醒的线程在下一次for循环中可以重新设置leader线程
                	//有可能发生leader线程的变更
                    leader = null;
                    available.signal();
                }
            } finally {
                lock.unlock();
            }
            return true;
        }
        /*队列扩容*/
        private void grow() {
            int oldCapacity = queue.length;
            //增加50%的容量
            int newCapacity = oldCapacity + (oldCapacity >> 1);
            if (newCapacity < 0)
            	//溢出，使用int最大值
                newCapacity = Integer.MAX_VALUE;
            //直接拷贝数组
            queue = Arrays.copyOf(queue, newCapacity);
        }
```

offer入队的逻辑比较清晰，先判断元素是否达到了队列的长度，如果达到了则需要扩容50%的容量，代码中是通过oldCapacity + (oldCapacity >> 1)实现的，表示的含义就是oldCapacity+oldCapacity/2==oldCapacity*1.5，也就是扩容50%。接着如果任务入队后排在堆顶位置，那么就可能有两种情况：

- 之前堆为空，新入队任务作为第一个任务排在堆顶位置
- 之前堆不为空，但是任务入队后，经过调整被移动到了堆顶位置，也就是新加入的任务需要最先触发

对于第二种情况，将leader置null，然后唤醒一个阻塞的线程，阻塞线程被唤醒后再重新设置一个leader线程。到这里我们对schedule方法做一个总结：

schedule方法返回的是一个**ScheduledFuture**，如果方法传入的是一个Callable，那么将其和触发时间封装成一个ScheduledFutureTask添加到队列中；如果传入的是一个Runnable，那么会先通过**适配器**将其封装成一个Callbale。在ScheduledFutureTask入队之前还提供了一个空方法decorateTask供子类去重写，以实现对ScheduledFutureTask进行进一步的装饰。ScheduledThreadPoolExecutor存储任务使用的队列是**DelayedWorkQueue**，其本质上是用数组实现的一个**最小二叉堆**，根据任务的触发时间和sequenceNumer进行排序，能保证堆顶一定是接下来需要最先执行的任务。任务入队的时候会判断线程池状态，如果不处于Running，说明线程池已经被shutdown了，那么会执行拒绝策略；而在添加任务之后需要再次判断线程池状态，如果此时线程池不处于Running状态，说明在添加任务之后线程池被shutdown了，那么根据任务是否为周期任务再根据相应的参数配置来决定是否需要取消已入队的任务。任务入队成功之后就需要创建工作线程了，如果当前workerCount小于corePoolSize，那么直接创建一个工作线程；否则如果corePoolSize为0，那么也会创建一个工作线程。工作线程不断的从队列中获取任务来执行，每次获取的任务都是队头任务，如果该任务还没有到触发时间，那么需要阻塞线程。这里参考了Leader-Follower线程模型，为了减少不必要的多余超时阻塞等待，只由一个leader线程超时阻塞，其它线程则"永久"阻塞等待被唤醒。任务出队之后会调整最小堆，保证堆顶元素是最先执行的任务，而任务完成之后如果是普通延时任务那么返回线程执行结果；如果是周期任务，那么不会保存线程执行结果，重置任务状态为NEW，计算任务的下次执行时间，然后将任务入队等待调度。

## scheduleAtFixedRate实现

scheduleAtFixedRate方法用于提交一个周期任务，同时也支持一个初始延时时间，添加任务和获取任务的基本逻辑和schedule方法一致，区别是就是scheduleAtFixedRate提交的任务属于周期任务，会将自身设置到**outerTask**属性，在任务执行完成之后会重置任务状态，然后重新设置任务下次执行时间，将任务重新入队等待被执行。首先还是来看看scheduleAtFixedRate方法：

```java
	public ScheduledFuture<?> scheduleAtFixedRate(Runnable command,
                                                  long initialDelay,
                                                  long period,
                                                  TimeUnit unit) {
        if (command == null || unit == null)
            throw new NullPointerException();
        if (period <= 0)
            throw new IllegalArgumentException();
        //包装command，进而包装ScheduledFutureTask和schedule方法一样
        //这里会设置period，表示任务是一个周期任务
        ScheduledFutureTask<Void> sft =
            new ScheduledFutureTask<Void>(command,
                                          null,
                                          triggerTime(initialDelay, unit),
                                          unit.toNanos(period));
        RunnableScheduledFuture<Void> t = decorateTask(command, sft);
       	//设置outerTask，用于后面任务重新入队
        sft.outerTask = t;
        //任务入队
        delayedExecute(t);
        return t;
    }
```

可以看到该方法和schedule方法的逻辑基本一样，就是这里设置了outerTask 。任务入队之后创建工作线程获取任务，如果任务没有到触发时间则基于Leader-Follower模型(变种)阻塞等待，之后获取到任务开始执行，这个流程在前面分析schedule方法的时候已经分析过了，我们这里直接来到任务(ScheduledFutureTask)的run方法：

```java
        public void run() {
            boolean periodic = isPeriodic();
            if (!canRunInCurrentRunState(periodic))
                cancel(false);
            else if (!periodic)
                ScheduledFutureTask.super.run();
            else if (ScheduledFutureTask.super.runAndReset()) {
                setNextRunTime();
                reExecutePeriodic(outerTask);
            }
        }
```

这个任务在上面也简单说说明过，由于是周期任务（判断任务是否为周期任务只需要判断period属性是否为0即可，注意**period可能小于0**，在下面分析scheduleWithFixedDelay方法的时候会说明），所以会走最后一个else if的逻辑，调用父类runAndReset执行任务并且重置任务状态，紧接着调用setNextRunTime方法设置任务下次运行时间：

```java
	private void setNextRunTime() {
            long p = period;
            if (p > 0)
            	//如果period大于0，那么设置下次触发时间
                time += p;
            else
            	//period小于0，通过scheduleWithFixedDelay方法添加任务会将period乘以-1传入
                time = triggerTime(-p);
        }
```

调用scheduleAtFixedRate方法时，将周期时间**initialDelay**设置到了time属性，在setNextRunTime设置任务下次执行时间时，直接将time累加period的时间，也就是严格按照任务触发时间+间隔时间来计算任务的下次触发时间。回到文章开头总结scheduleAtFixedRate时的描述，也就对应了如果任务执行时间超过了间隔时间，那么任务执行完成后再次计算下次任务的触发时间，就会发现triggerTime>time+period，所以在DelayedWorkQueue的take方法获取到任务后，判断triggerTime-now()小于0，那么任务会直接执行。

## scheduleWithFixedDelay实现

scheduleWithFixedDelay和上面介绍的scheduleAtFixedRate方法的逻辑也基本一致，主要区别有两点。第一，scheduleWithFixedDelay方法中构建ScheduleFutureTask传入的delay会使用对应的**负数**设置到ScheduledFutureTask的period属性：

```java
	public ScheduledFuture<?> scheduleWithFixedDelay(Runnable command,
                                                     long initialDelay,
                                                     long delay,
                                                     TimeUnit unit) {
        if (command == null || unit == null)
            throw new NullPointerException();
        if (delay <= 0)
            throw new IllegalArgumentException();
        ScheduledFutureTask<Void> sft =
            new ScheduledFutureTask<Void>(command,
                                          null,
                                          triggerTime(initialDelay, unit),
                                          //delay取负数
                                          unit.toNanos(-delay));
        RunnableScheduledFuture<Void> t = decorateTask(command, sft);
        sft.outerTask = t;
        delayedExecute(t);
        return t;
    }
```

第二，通过此方法创建的ScheduledFutureTask中的period为负数，这会在setNextRunTime方法中设置任务下次执行时间时判断使用：

```java
	private void setNextRunTime() {
            long p = period;
            if (p > 0)
            	//scheduleAtFixedRate方法
                time += p;
            else
           		//scheduleWithFixedDelay方法
                time = triggerTime(-p);
        }
```

可以看到，如果period>0，表示任务是通过scheduleAtFixedRate方法提交的，否则表示scheduleWithFixedDelay方法提交的。如果是scheduleAtFixedRate方法提交的任务，那么任务的下次执行时间就是initialDelay+period；而如果是scheduleWithFixedDelay方法提交的任务，那么通过调用**triggerTime**方法计算任务下次执行时间（period取负得到正数）：

```java
	long triggerTime(long delay) {
        return now() + ((delay < (Long.MAX_VALUE >> 1)) ? delay : overflowFree(delay));
    }
```

triggerTime方法只有一行代码，表示的意思就是当前时间加上周期时间delay(也就是period)。不过这里还有一个溢出检查机制，如果delay大于等于long的最大值（2^63 - 1）的一半，就需要处理溢出，overflowFree方法实现如下：

```java
	private long overflowFree(long delay) {
		//peek方法获取队头元素，但是不移除该元素
        Delayed head = (Delayed) super.getQueue().peek();
        if (head != null) {
        	//获取队头任务触发剩余时间
            long headDelay = head.getDelay(NANOSECONDS);
            if (headDelay < 0 && (delay - headDelay < 0))
            	//如果headDelay小于0 ，并且delay<headDelay，那么调整delay
                delay = Long.MAX_VALUE + headDelay;
        }
        return delay;
    }
```

从triggerTime方法可以看出，scheduleWithFixedDelay提交的任务执行完成后计算任务下次执行时间是从任务执行完的开始算的，所以即使任务执行时间超过了period，在任务执行完成之后也会等待period的时间再执行。

## DelayedWorkQueue中任务的排序

前面已经不止一次提到过，对于DelayedWorkQueue中的任务，是通过任务触发时间来排序的，而如果触发时间相同呢？其实还提供了一个sequenceNumber序号属性，该序号是通过ScheduledThreadPoolExecutor中的一个静态AtomicLong类型的**sequencer**属性，在ScheduledFutureTask创建的时候通过sequencer.getAndIncrement();为任务设置一个序号，也就是说先添加的任务其序号就越小，在触发时间相同的情况下的优先级就越高，这个逻辑体现在ScheduledFutureTask的compareTo方法中：

```java
	public int compareTo(Delayed other) {
            if (other == this) // compare zero if same object
                return 0;
            if (other instanceof ScheduledFutureTask) {
                ScheduledFutureTask<?> x = (ScheduledFutureTask<?>)other;
                long diff = time - x.time;
                if (diff < 0)
                    return -1;
                else if (diff > 0)
                    return 1;
                else if (sequenceNumber < x.sequenceNumber)
                    return -1;
                else
                    return 1;
            }
            long diff = getDelay(NANOSECONDS) - other.getDelay(NANOSECONDS);
            return (diff < 0) ? -1 : (diff > 0) ? 1 : 0;
        }
```

## Timer和ScheduledThreadPoolExecutor

除了ScheduledThreadPoolExecutor，JDK还为我们提供了一个**Timer**类来调度任务执行，它们任务调度的基本思想都差不多，任务也是放到堆中，不过Timer中工作线程的阻塞和唤醒是通过wait和notify方法实现的，当周期任务到达执行时间后，是先计算下轮任务触发时间，然后任务入队，接着再去执行本轮任务。虽然我们有Timer可以选择，但是通常情况下都不建议使用它，Timer的工作线程是在Timer创建的时候就跟着创建并且开始运行的，从始至终都只有一个工作线程。所以，如果一个任务执行时间过长势必会影响其它任务的执行，并且如果任务抛出了异常导致工作线程退出，那么这个Timer就算不能再使用了，而ScheduledThreadPoolExecutor则不会有这些问题。

除了支持多线程并发执行多个任务外，即使执行任务的线程退出了，那么在提交任务的时候还是能创建一个新的线程来执行任务，而在线程异常退出的时候也会有一个补偿机制继续创建工作线程，保证线程池能继续可用。

## 总结

有了ThreadPoolExecutor源码理解的基础，ShceduledThreadPoolExecutor就相对来说比较简单，只需要注意主要以下几点：

- ThreadPoolExecutor提交任务的时候会绑定一个工作线程，封装到Worker对象中（如果workerCount>corePoolSize并且队列未满，任务则会直接入队）；但是ShceduledThreadPoolExecutor提交任务的时候，任务是直接入队，然后再尝试创建工作线程去处理任务
- ThreadPoolExecutor的任务是Runnable，ShceduledThreadPoolExecutor的任务是ScheduledFutureTask（也实现了Runnable）
- ScheduledThreadPoolExecutor使用的阻塞队列是DelayedWorkQueue，这实际上是一个通过数组实现的最小二叉堆，通过任务的触发时间和sequenceNumber进行排序，最先执行的任务排在堆顶，触发时间相同的情况下，sequenceNumber越小表示任务越先入队，优先级就越高
- 从DelayedWorkQueue中获取任务的时候参考了Leader-Follower线程模型，由一个leader线程负责超时阻塞，减少了不必要的超时阻塞，线程的阻塞是通过条件队列实现的
- 如果任务是周期任务，那么在一个任务执行完成后会重置任务状态，然后计算并设置下次任务触发时间，重新入队
- schedule方法用于提交一个延时非周期任务，ScheduledThreadPoolExecutor也支持通过submit和execute提交非延时任务，这是通过调用schedule提交一个延时为0的任务实现的
- scheduleAtFixedRate方法提交的周期任务，如果任务执行时间超过了周期时间period，那么任务完成后会紧接着执行下一次任务。原因是通过这种方式提交的任务执行完成后计算下次触发时间的算法是简单的initialDelay+period，如果执行时间超过了period，那么说明initialDelay+period - now < 0，所以任务入队之后马上就能出队执行
- scheduleWithFixedDelay方法提交的周期任务，如果任务执行时间超过了周期时间period，那么在任务完成后也会等待period的时间才会执行。原因是通过这种方式提交的任务执行完成后计算下次触发时间的算法是当前时间now+period，所以任务入队之后还是要等待period的时间才能出队执行
