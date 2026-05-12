# 18、Java JUC 源码分析 - ThreadPoolExecutor总结与源码深度分析
- 来源：https://ddkk.com/zhuanlan/java/concurrency/10/18.html
- 分类：Java并发
- 分组：教程目录
## 前言

JUC中包含了很多的工具类，不论是第三方工具包，还是自己开发的业务系统，使用最多的还是是线程池，比如普通的线程池ThreadPoolExecutor、带调度的线程池ScheduledThreadPoolExecutor等，本文就从源码层面探究一下ThreadPoolExecutor的实现原理~

另外，本文涉及的ReentrantLock和条件队列，请参考：[ReentrantLock源码深度分析](/zhuanlan/java/concurrency/10/11.html)和[CyclicBarrier源码深度分析](/zhuanlan/java/concurrency/10/16.html)

## ThreadPoolExecutor总结

## 构造参数

- int **corePoolSize**："核心"线程数，提交任务时如果当前工作线程数小于核心线程数，会直接创建新的线程执行任务
- int **maximumPoolSize**：线程池能容纳的最大线程数，提交任务时如果工作线程数达到了核心线程数并且队列已满，但是线程数小于max，则会创建新的线程执行任务。
- long **keepAliveTime**：非核心线程最长空闲时间，如果非核心线程超过空闲时间没有执行任务，则会结束。**allowCoreThreadTimeOut**参数可控制是否其对核心线程生效
- TimeUnit **unit**：keepAliveTime的单位，比如秒、毫秒等
- BlockingQueue **workQueue**：阻塞队列，添加任务时，如果已创建线程数达到了核心线程数，任务会被尝试放到该队列
- ThreadFactory **threadFactory**：线程工厂，线程池中的线程都通过该工厂创建
- RejectExecutionHandler **handler**：拒绝策略，线程池无法接收任务后，继续添加任务触发的行为

> 注：下图是一个简单总结，没有包含所有情况

> 注：所谓的核心线程，并没有什么标识字段去区分线程是否是核心，线程就是线程，在线程池中都是一样的，区别就是线程创建的时机。可以这样理解，线程池有个定义的初始线程数量（corePoolSize），这些线程并不是线程池初始化的时候就创建好的，而是基于饱汉模式，提交任务的时候才创建线程，当线程达到指定数量（corePoolSize）后，继续添加的任务需要有个队列(BlockingQueue)存储下来，一个线程完成一个任务后可以从这个队列中获取任务继续执行，而如果这个队列也存储满了呢？这里提供了一种伸缩机制，如果线程数量达到了corePoolSize上限，并且队列也满了，那么允许再创建一些线程，这些线程就像公司的临时工一样(之前的线程就是正式员工)，临时工可以在公司超负荷的时候过来帮帮忙，当然临时工的数量也要有个上限，那么正式员工+临时工的最大数量就是maximumPoolSize，既然是临时工，那么在公司没有那么忙的时候就可以解除雇佣了，所以通过keepAliveTime参数来进行控制，如果一个临时工的空闲时间达到了这个阈值，那么就认为不再需要它了，就将其解雇，如果后期公司又超负荷了，就继续招聘临时工。当然，如果公司领导为了节约成本，当公司没有那么忙的时候，连正式员工也想一起解雇，那么可以通过设置allowCoreThreadTimeOut参数为true达到目的。
>
> 再次强调，线程本身没有核心属性，这只是概念上的说法，具体到代码中都是根据线程数量和队列状态来确定的，很可能这个名词都是根据Doug Lean对变量的命名翻译得来~

## 线程池状态

在线程池中存在定义了5种状态：

```java
	// runState is stored in the high-order bits
	//运行状态，能够接收新的任务，并且线程池中的线程正在处理已添加的任务（默认状态）
    private static final int RUNNING    = -1 << COUNT_BITS;
    //关闭状态，不能接收新的任务，但是能处理已经添加的任务（shutdown()方法）
    private static final int SHUTDOWN   =  0 << COUNT_BITS;
    //停止状态，不能接收新的任务，也不会继续处理已经添加的任务，会中断（interrupt）正在执行的任务（shutdownNow()方法）
    //如果任务不能响应中断信号，线程不会退出
    private static final int STOP       =  1 << COUNT_BITS;
    //终止状态，所有任务已经被终止，workerCount为0，当线程池会变为TIDYING状态，然后会执行terminated方法（该方法可由子类重写）
    private static final int TIDYING    =  2 << COUNT_BITS;
    //变为TIDYING状态后会执行terminated()方法，该方法执行完成后状态正式变为TERMINATED
	//如果需要，该方法可以在子类进行重写，在ThreadPoolExecutor中是空方法
    private static final int TERMINATED =  3 << COUNT_BITS;
```

- **RUNNING**：能够接受新的任务，也会处理队列中的任务。线程池初始为此状态。
- **SHUTDOWN**：不能接受新的任务，会处理队列中的任务。调用shutdown方法，会变为此状态：RUNNING->SHUTDOWN。
- **STOP**：不能接受新的任务，也不会执行队列中的任务，会中断正在执行的任务，会将队列中未执行的任务返回。调用shutdownNow方法会变为此状态：RUNNING(SHUTDOWN)->STOP。
- **TIDYING**：线程池终止的前置状态，到此状态时，表示所有任务已经被终止，workerCount为0。线程shutdown和shutdownNow都可能触发变更为此状态，但是具有一定的条件：shutdown时（也就是SHUTDOWN状态），要求队列和当前执行任务都为空；shutdownNow（也就是STOP状态），要求当前执行任务为空。线程池变为TIDYING状态后会执行terminate()方法，该方法在ThreadPoolExecutor中是一个空方法，由子类根据需要重写。
- **TERMINATED**：线程池终止的最终状态，在terminate()方法执行完成(即使抛出异常)后设置。

从定义中可以看到，一个线程池初始为RUNNING状态，调用shutdown方法被调用后会进入SHUTDOWN状态，并且尝试中断空闲的线程，调用shutdownNow后会进入STOP状态，并且尝试中断所有线程。不论是shutdown还是shutdownNow，都不能保证线程池中的线程立即退出，因为不是所有的线程都能响应中断（interrupt）。不论是shutdown还是shutdownNow，都会执行tryTerminate()方法，该方法逻辑会根据线程池状态和工作线程数量判断是否能够终止线程池，TIDYING相当于是TERMINATED的一个前置状态，线程池在终止之前会先变为TIDYING状态，然后调用terminate()方法，最后变为TERMINATED状态。

## 数据存储

在线程池的源码中，使用一个AtomicInteger类型的**ctl**属性来同时表示工作线程数量（workerCount）和线程池状态：低29位保存workerCount，高3位(加低29位0)保存线程池状态。ctl相关的核心定义和操作函数定义如下：

```java
private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));
	//Integer.SIZE == 32
	//COUNT_BITS == 29
    private static final int COUNT_BITS = Integer.SIZE - 3;
    //1左移29位，再减1，就是29个1，这个也是线程池允许的最大工作线程数量
    private static final int CAPACITY   = (1 << COUNT_BITS) - 1;
    // runState is stored in the high-order bits
    private static final int RUNNING    = -1 << COUNT_BITS;//101 000...(29个0)
    private static final int SHUTDOWN   =  0 << COUNT_BITS;//000 000...(29个0)
    private static final int STOP       =  1 << COUNT_BITS;//001 000...(29个0)
    private static final int TIDYING    =  2 << COUNT_BITS;//010 000...(29个0)
    private static final int TERMINATED =  3 << COUNT_BITS;//011 000...(29个0)
    //低29位全部置0，获取线程池状态
    private static int runStateOf(int c)     {
      return c & ~CAPACITY; }
    //取低29位，获取workerCount
    private static int workerCountOf(int c)  {
      return c & CAPACITY; }
    //组合线程池状态和workerCount为一个完整的ctl
    //比如ctlOf(RUNNING,0)，表示RUNNING状态，workerCount为0
    private static int ctlOf(int rs, int wc) {
      return rs | wc; }
```

由于使用29位来保存工作线程数量，那么线程池中允许的最大工作线程数就是(1 这里简单提一点，addWorker方法的核心逻辑是创建一个线程来执行任务，它有两个入参，一个是command表示提交的任务，一个布尔类型的core表示创建线程判断是以corePoolSize作为标准，还是以maximumPoolSize作为标准，下面会贴出相应的源码。

从这个逻辑中我们看到了线程池的大体处理逻辑：提交任务时如果工作线程数小于核心线程数，那么直接创建新的线程处理任务，如果已经达到核心线程数，那么将任务放到阻塞队列中，如果队列已满，入队失败，那么判断工作线程是否达到maximumPoolSize，如果没达到那么创建新的线程执行任务，否则调用拒绝策略拒绝任务。

> 注：可以看到，拒绝策略的调用不一定是线程数和队列满了，也可能是线程池已经不是RUNNING状态

在上面的execute方法中，我们直接就看到了线程池工作的大体逻辑，其中有一个核心的addWorker()方法，该方法的主要作用是在线程池中创建一个新的工作线程来执行任务，注意如果线程创建成功，那么会首先执行此次提交的任务，当次任务完成后才会去从队列中拿。addWorker方法逻辑如下：

```java
    private boolean addWorker(Runnable firstTask, boolean core) {
        retry:
        for (;;) {
            int c = ctl.get();
            int rs = runStateOf(c);
            //SHUTDOWN以后的状态都不允许提交新的任务，但是SHUTDOWN状态允许执行队列中的任务
            //如果当前提交的任务(firstTask)为空，并且队列不为空，并且是SHUTDOWN状态，那么可以在后面逻辑中尝
            //试创建一个线程去帮忙执行队列中的任务
            //这正是签名定义中对SHUTDOWN状态的描述
            if (rs >= SHUTDOWN &&
                ! (rs == SHUTDOWN &&
                   firstTask == null &&
                   ! workQueue.isEmpty()))
                //返回false,调用拒绝策略
                return false;
			//这里自旋，在的多线程并发竞争的情况下，要保证每个线程要么新增工作线程成功，要么失败返回false
            for (;;) {
           		//获取到工作线程数量
                int wc = workerCountOf(c);
                //要创建线程，首先要保证工作线程数量不能超过CAPACITY（也就是29个1）
                if (wc >= CAPACITY ||
                    wc >= (core ? corePoolSize : maximumPoolSize))
                    //根据core入参来决定使用corePoolSize还是maximumPoolSize作为创建线程的依据
                    return false;
				//通过CAS递增一个workerCount，如果操作成功，那么跳出多层循环
                if (compareAndIncrementWorkerCount(c))
                    break retry;
                //说明CAS递增workerCount失败了，那么重新获取ctl然后重试
                c = ctl.get();  // Re-read ctl
                if (runStateOf(c) != rs)
                	//线程池状态发生了变更，那么回到顶层自旋重试
                    continue retry;
                //如果线程池状态没有发生变更，那么不用回到顶层for循环去判断线程池状态
            }
        }
		//到这里说明可以创建一个新的工作线程
        boolean workerStarted = false;
        boolean workerAdded = false;
        Worker w = null;
        try {
        	//创建一个Worker，它封装了Thread，并且传入了firstTask
        	//只是创建，不一定会开启线程，下面会再次检查
            w = new Worker(firstTask);
            final Thread t = w.thread;
            if (t != null) {
                final ReentrantLock mainLock = this.mainLock;
                //同步锁
                mainLock.lock();
                try {
                    //获取当前线程池状态
                    int rs = runStateOf(ctl.get());
                    //再次检查是否应该开启线程
                    //如果线程池状态小于SHUTDOWN（也就是RUNNING）或者等于SHUTDOWN但是此次提交的任务为空
                    //那么都会真正开启一个任务
                    if (rs < SHUTDOWN ||
                        (rs == SHUTDOWN && firstTask == null)) {
                        //新建多线程来自于threadFactory，这里要检查线程的状态
                        //如果已经开启，那么抛出异常
                        if (t.isAlive()) 
                            throw new IllegalThreadStateException();
                      	//到这里才表示工作线程创建成功
                      	//添加到工作线程集合中(HashSet结构)
                        workers.add(w);
                        int s = workers.size();
                        if (s > largestPoolSize)
                        	//这里记录工作线程的历史最大数量
                            largestPoolSize = s;
                        //标识工作线程添加成功
                        workerAdded = true;
                    }
                } finally {
                    mainLock.unlock();
                }
                if (workerAdded) {
                	//如果工作线程添加成功，那么在这里开启线程
                    t.start();
                    //标识线程已经启动
                    workerStarted = true;
                }
            }
        } finally {
            if (! workerStarted)
            	//如果线程没有启动，表示工作线程其实添加失败了，需要在addWorkerFailed方法里回滚
                addWorkerFailed(w);
        }
        //返回线程是否成功启动
        return workerStarted;
    }
```

addWorder方法的逻辑大致可以分为两大部分：

- 第一是确定此次提交任务能否在线程池中创建一个新的工作线程。通过两个for循环实现 ，第一层for循环主要是判断线程池的状态，第二层for循环主要是根据当前工作线程数量和限制数量(corePoolSize或maximumPoolSize)判断能否新增工作线程（CAS递增workerCount，失败的话一直重试）
- 第二是创建工作线程。首先会通过threadFactory创建一个线程，该线程包装在一个Worker对象中，并且该Worker默认绑定的是当前提交的任务，即使首先创建了Worker，在加锁之后还会再次检查线程池状态，可能检查的结果不允许开启新的工作线程，那么会在addWorkerFailed方法中进行回滚

现在我们从上述addWorker方法的代码逻辑中可以得出几个关键点：

- 向线程池中添加工作线程的核心逻辑使用了ReentrantLock做同步控制
- 线程池中的工作线程都是在提交任务的时候才触发创建的，并且默认绑定当前提交的任务
- 如果线程池处于SHUTDOWN状态，但是阻塞队列中还有任务待执行，那么还可以通过提交一个**null任务**尝试去新建一个工作线程帮忙处理，当然能否创建还是要根据当前线程池状态和参数设置来判断
- 工作线程包装在**Worker**对象中，并且默认传入了当前提交的任务**firstTask**，Worker存储在一个HashSet集合中。所以如果核心线程和阻塞队列满了，这时候提交任务触发创建的工作线程不是直接从阻塞队列中获取任务，而是先执行此次提交的任务，此次任务执行完才回去从队列中取任务
- 由于线程是由线程工厂ThreadFactory创建的，这个工厂可以由开发人员自己指定，所以需要判断创建的线程是否已经启动了，如果已经启动，则会抛出**IllegalThreadStateException**异常
- 即使已经创建好了线程（Worker），也要**再次检查**线程池当前状态，如果不符合开启线程的条件（参考前面线程池各个状态的定义），那么不会真正开启线程，表示工作线程创建失败了，需要在addWorkerFailed方法中进行回滚，比如对workerCount做减1（因为前面已经对workerCount加了1）

在addWorker中的逻辑我们已经知道工作线程被包装在Worker对象中，那么我们来看看Worker的构造函数：

```java
Worker(Runnable firstTask) {
	setState(-1); //默认设置state为-1，因为如果Worker刚创建，还没有执行任务，那么不能被中断
	this.firstTask = firstTask;
	this.thread = getThreadFactory().newThread(this);
}
```

这里注意到，创建线程传入的Runnable是**this**，这个this就是Worker对象本身，Worker实现了Runnable接口：

```java
private final class Worker extends AbstractQueuedSynchronizer implements Runnable {
	public void run() {
		runWorker(this);
	}
}
```

可以看到Worker本身也是继承了AQS的，它重写了tryAcquire方法：

```java
		protected boolean tryAcquire(int unused) {
            if (compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }
        protected boolean tryRelease(int unused) {
            setExclusiveOwnerThread(null);
            setState(0);
            return true;
        }
		//调用的父类AQS的acquire，如果竞争失败，会陷入阻塞
        public void lock()        {
      acquire(1); }
        //直接调用本类重写的tryAcquire，竞争失败直接返回false
        public boolean tryLock()  {
      return tryAcquire(1); }
        //调用父类AQS的release解锁
        public void unlock()      {
      release(1); }
```

逻辑很简单，它不允许线程重入，并且提供了不会阻塞线程的tryLock方法（该方法在后续中断空闲线程的时候有用），所以这里没有使用ReentrantLock和Synchronized这些工具。Worker在初始化的时候会将state设置为-1，此时如果调用tryLock方法会返回false，因为其CAS的期望值是0，以此达到**Worker刚刚创建还没有执行任务的时候不能被中断**的目的。

> Worker对应的线程在执行任务的时候会通过自身调用lock方法获取独占锁，在任务完成之后会释放独占锁，所以获取到了独占锁就表示线程获取到了需要执行的任务，在后续中断空闲线程的时候就不能中断这些非空闲的线程，调用tryLock方法返回false就可表示worker线程正在执行任务。但是由于Worker创建的时候初始化state为-1，那么tryLock返回false还可能表示Worker刚刚创建，后面会在runWorker方法中主动调用unlock方法将其设置为0，表示可以被中断。

Worker是ThreadPoolExecutor的内部类，在其实现的run方法中调用的**runWorker**方法定义在ThreadPoolExecutor中，所以这里创建的线程会通过Worker的run方法调用外部类ThreadPoolExecutor的runWorker方法，并且将worker实例传入，那么我们就来看看runWorker方法：

```java
final void runWorker(Worker w) {
        Thread wt = Thread.currentThread();
        Runnable task = w.firstTask;
        w.firstTask = null;
        //由于Worker在初始化的时候将state设置为-1，表示不允许中断
        //这里调用unlock方法将其设置为0（看看上面Worker重写的tryRelease方法），表示可以被中断
        w.unlock();
        boolean completedAbruptly = true;
        try {
        	//task默认是创建Worker时传入的任务，如果该任务为空，那么调用getTask()方法从队列中获取任务
            while (task != null || (task = getTask()) != null) {
            	//通过Worker的lock方法加锁，一旦线程获取了这个独占锁，那么表示线程正在工作中
            	//任务完成会在finally代码块中unlock释放锁
                w.lock();
                // 1.线程池可能正在终止过程中(stater>=STOP)，如果正在终止那么需要保证当前线程是中断状态
                // 2.如果线程池没有终止，那么要保证线程不是中断状态。但是这种情况下需要重新判断线程池状态，并且清除线程中断标记，因为在if					                  	
                // 语句期间，可能线程池调用了shutdownNow方法，该方法不会调用worker.lock方法，所以这是可能发生的
                if ((runStateAtLeast(ctl.get(), STOP) ||
                     (Thread.interrupted() &&
                      runStateAtLeast(ctl.get(), STOP))) &&
                    !wt.isInterrupted())
                    //只是中断线程，不是退出线程，如何响应中断要看任务自身如何处理
                    wt.interrupt();
                try {
                	//空方法，交给子类实现
                    beforeExecute(wt, task);
                    Throwable thrown = null;
                    try {
                    	//真正执行任务
                        task.run();
                    } catch (RuntimeException x) {
                        thrown = x; throw x;
                    } catch (Error x) {
                        thrown = x; throw x;
                    } catch (Throwable x) {
                        thrown = x; throw new Error(x);
                    } finally {
                  		//空方法，交给子类实现
                        afterExecute(task, thrown);
                    }
                } finally {
                    task = null;
                    //任务完成数量加1，解锁
                    w.completedTasks++;
                    w.unlock();
                }
                //当前任务执行完成后继续到while条件中从阻塞队列获取任务
            }
            //设置不属于异常退出
            completedAbruptly = false;
        } finally {
        	//线程退出后最终执行processWorkerExit方法
        	//completedAbruptly表示是否线程是异常退出
            processWorkerExit(w, completedAbruptly);
        }
    }
```

runWorker方法的开始会先主动调用worker.unlock方法，主要是将state从-1修改为0，表示对应的线程可以被中断（对应的就是tryLock可以返回true了），这也已经在前面提到过了，在这之后工作线程才算真正开始运行。

通过while循环不断从阻塞队列中获取任务来执行（第一次执行的任务是当时提交的任务），如果阻塞队列为空，那么从队列中获取任务会阻塞，线程的最大空闲时间则可以通过在从阻塞队列获取任务时添加超时时间实现，以此来实现线程的复用。

在获取到任务之后，会调用Worker的lock()方法，获取独占锁，表示线程已经开始准备执行任务了。但是在执行任务之前要判断线程池当前的状态，如果线程池状态大于等于STOP，那么表示线程池正在被终止，那么需要保证线程是中断状态，否则检查是否在if的第一个条件判断执行期间又调用了shutdownNow方法（shutdown方法会调用worker.lock，这里不会进来）中断了线程，那么检测到线程被中断后，再次判断线程池状态是否大于等于STOP，如果满足条件，也要中断当前线程。

检查通过之后就需要真正执行任务了，任务的执行就是直接调用Runnable.run方法，ThreadPoolExecutor在任务执行前后都预留了函数，可以由子类复写，分别是beforeExecute和afterExecute，它们在ThreadPoolExecutor中都是空方法。当任务执行完成后会调用Worker的unlock() 方法释放锁，该方法的调用在finally代码块中，保证任务执行抛出异常也会被调用，同时任务完成数量completedTasks字段加1。

如果while条件中的getTask方法返回的任务为空，那么会退出循环，表示这个线程已经完结，最终执行processWorkerExit方法。

> 这里要注意的是，所谓的中断正在执行的任务，是中断正在执行任务的线程，而中断也只是在线程上打了一个中断标记，至于如何响应中断，要看任务本身如何处理，特别是没有sleep、park、wait等方法的时候

从runWorker方法中我们又可以总结一些关键信息：

- Worker是否空闲，是通过其tryLock方法的返回值决定的。
- Worker创建时默认state为-1，这时tryLock方法肯定会返回false，表示Worker刚创建不允许被中断，因为即使Worker被创建了，在接下来的检查中也可能无法满足运行条件（参考前面的addWorker方法），如果能够运行，那么在接下来线程启动后调用的runWorker方法中调用worker.unlock方法将state设置为0，表示对应的线程可以被中断了，到这里也就意味着刚创建的工作线程真正开始工作。
- Worker内线程的行为需要做并发控制，比如在线程池运行过程中，支持动态设置corePoolSize大小，由于Worker对应的线程可能正在运行，那么就需要做并发控制，但是并发控制没有使用ReentrantLock和synchronized，而是继承了AQS，自己实现了加解锁的逻辑，在其实现中**不支持重入**。如果新设置的corePoolSize小于当前工作线程数，那么会尝试中断空闲的线程。同时在shutdown方法或tryTerminate方法中都会调用interruptIdleWorkers方法尝试中断空闲线程。
- 一旦Worker的独占锁被占用，就说明线程获取到了任务，正在准备执行或者正在执行中，当此次任务完成时会释放独占锁。
- STOP状态会中断正在执行的任务，这是通过interrupt实现的，所以只是给执行任务的线程打上中断标记，不关心任务如何响应中断。

那么我们接下来的重点就是**getTask**()方法：

```java
private Runnable getTask() {
		//标识是否已经超时，作为跳出自旋循环的一个条件
        boolean timedOut = false; 
        //注意这里也是自旋循环
        for (;;) {
            int c = ctl.get();
            //获取线程池当前状态
            int rs = runStateOf(c);
			//如果状态大于等于SHUTDOWN才进行后续的判断
			//如果线程池是STOP状态，或者阻塞队列为空，那么直接返回一个null任务
			//这就对应了STOP状态的线程池，不允许执行队列中的任务
            if (rs >= SHUTDOWN && (rs >= STOP || workQueue.isEmpty())) {
                decrementWorkerCount();
                return null;
            }
			//获取当前工作线程数量
            int wc = workerCountOf(c);
            //这里控制从阻塞队列中获取任务是否需要超时时间
            //默认超时时间最对非核心线程有效，如果allowCoreThreadTimeOut为true，则对所有线程有效
            boolean timed = allowCoreThreadTimeOut || wc > corePoolSize;
			//当前工作线程数量超过了线程池最大允许数量(线程池运行过程中可能被调用setMaximumPoolSize方法更新了允许最大线程数量)
			//或者已经超时
			//并且workerCount>1或者阻塞队列为空
			//也就是即使在运行过程中调小了maximumPoolSize(不允许设置为小于等于0的值)或者超时已经发生，那么也要在不需要该线程的时候才会退出
			//如果wc==1，就表示当前线程是线程池中的唯一有效线程，这个时候如果队列不为空，那么此线程还是需要从队列中获取任务来执行
			//由于当前线程还在执行，所以wc不会为0
            if ((wc > maximumPoolSize || (timed && timedOut))
                && (wc > 1 || workQueue.isEmpty())) {
                if (compareAndDecrementWorkerCount(c))
                	//工作线程数减一，然后返回null
                    return null;
                //如果CAS失败了，那么说明其它线程也在对workerCount做更新，需要再次自旋重试
                continue;
            }
            try {
            	//从阻塞队列中获取任务，根据timed决定是否需要增加超时时间
                Runnable r = timed ?
                    workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) :
                    workQueue.take();
                if (r != null)
                    return r;
                //如果没有获取到任务，表示超时了，将timedOut设置为true
                timedOut = true;
            } catch (InterruptedException retry) {
            	//如果获取任务时线程被中断了，会继续重试
                timedOut = false;
            }
        }
    }
```

该方法的逻辑还是比较清晰，主要就是从阻塞队列中获取任务，根据参数设置来判断是否需要增加超时等待，默认keepAliveTime只对非核心线程生效（workerCount大于corePoolSize），如果allowCoreThreadTimeOut参数为true，则会对所有线程生效，该参数可以通过调用方法**allowCoreThreadTimeOut**设置。通常情况下，如果线程获取任务超时了，会在下一次循环中返回null退出，外层的runWorker方法获取到的任务为null之后也会跳出while循环，最终结束线程运行。但是如果当前有效线程已经只有最后1个，并且阻塞队列不为空，那么为了保证队列中的任务会得到执行，该线程还是会尝试从阻塞队列中获取任务。

> 到这里我们已经发现了，由于线程池支持在运行过程中动态更新一些核心参数，比如corePoolSize、maximumPoolSize等等，所以在逻辑代码中都对这些情况做了处理，比如新的corePoolSize小于现在已经创建的工作线程数，那么尝试中断空闲的线程

当getTask方法返回了null，外层的runWorker方法中的while循环也会退出，最终来到processWorkerExit方法：

```java
	private void processWorkerExit(Worker w, boolean completedAbruptly) {
		//completedAbruptly表示是否异常退出
        if (completedAbruptly) 
        	//如果是异常退出，那么说明没有减workerCount，这里做补偿措施
            decrementWorkerCount();
        final ReentrantLock mainLock = this.mainLock;
        mainLock.lock();
        try {
            completedTaskCount += w.completedTasks;
            //将Worker从HashSet中移除
            workers.remove(w);
        } finally {
            mainLock.unlock();
        }
		//尝试终止线程，该方法会根据线程池当前状态进行判断
        tryTerminate();
        int c = ctl.get();
        if (runStateLessThan(c, STOP)) {
            if (!completedAbruptly) {
            	//如果不是异常结束的
                int min = allowCoreThreadTimeOut ? 0 : corePoolSize;
                if (min == 0 && ! workQueue.isEmpty())
                    min = 1;
                if (workerCountOf(c) >= min)
                    return; // replacement not needed
            }
            //如果worker是异常结束的，并且线程池状态为RUNNING或SHUTDOWN，那么会尝试重新添加一个工作线程
            //传入的任务为null，数量检查标准是maximumPoolSize（core is false）
            addWorker(null, false);
        }
    }
```

这里需要注意几点，线程退出后会将对应的worker从HashSet中移除，如果是异常退出，并且线程池是RUNNING或SHUTDOWN状态，会调用addWorker(null,false)尝试再新增一个工作线程(worker)；另外，如果线程不是异常退出，那么也可能会去尝试添加一个工作线程，这个条件成立的前提是线程池当前工作线程数小于线程池允许的最小线程数，而线程池允许的最小线程数是根据allowCoreThreadTimeOut参数决定的，如果不允许核心线程超时，那么就为核心线程数，如果允许核心线程超时，那么就为0，而如果为0，且阻塞队列不为空，会强制将其设置为1。

简单说来就是工作线程退出的时候需要检查，如果不允许核心线程超时，那么在这里保证线程池中维持corePoolSize数量的工作线程；如果允许核心线程超时，那么判断队列是否为空，如果不为空，那么要保证至少有一个工作线程存活。

## 其它核心方法实现

前文从主线分析了下线程池的运作原理，这里单独对一些核心方法进行说明

- **interruptIdleWorkers(boolean onlyOne)：** 中断空闲（可能正在等待任务）的工作线程，通过入参onlyOne控制是否最多中断一个线程。这里的核心点是，一个线程在执行任务的时候会通过worker.lock上锁，如果被锁住就表示正在执行任务，不属于空闲线程，那么tryLock方法会返回false（tryLock方法不会阻塞），并且ThreadPoolExecutor实现的独占锁是**不可重入**的。

```java
	private void interruptIdleWorkers(boolean onlyOne) {
		//onlyOne表示是否只中断一个线程
        final ReentrantLock mainLock = this.mainLock;
        mainLock.lock();
        try {
            for (Worker w : workers) {
                Thread t = w.thread;
                if (!t.isInterrupted() && w.tryLock()) {
                	//需要调用worker的tryLock方法获取锁，才能执行interrupt方法，tryLock方法不会阻塞
                	//因为worker对应的线程如果正在执行任务的过程中，会调用worker.lock()加锁，那么就不算处于空闲状态
                    try {
                    	//中断线程
                        t.interrupt();
                    } catch (SecurityException ignore) {
                    } finally {
                        w.unlock();
                    }
                }
                if (onlyOne)
                    break;
            }
        } finally {
            mainLock.unlock();
        }
    }
```

- **tryTerminate：** 尝试终止线程池，首先会判断线程池是否满足终止条件，如果允许终止，那么会将线程池状态修改为TIDYING，然后执行terminated方法，最后将状态设置为TERMINATED。

```java
final void tryTerminate() {
        for (;;) {
            int c = ctl.get();
            //首先判断线程池是否满足终止条件
            if (isRunning(c) ||
                runStateAtLeast(c, TIDYING) ||
                (runStateOf(c) == SHUTDOWN && ! workQueue.isEmpty()))
                //如果线程池处于RUNNING、大于等于TIDYING(已经终止)、处于SHUTDOWN但是队列不为空，那么不允许终止
                return;
            if (workerCountOf(c) != 0) {
                //如果工作线程数不为0，那么只中断1个空闲线程
                interruptIdleWorkers(ONLY_ONE);
                return;
            }
            final ReentrantLock mainLock = this.mainLock;
            mainLock.lock();
            try {
                if (ctl.compareAndSet(c, ctlOf(TIDYING, 0))) {
                	//更新线程池状态为TIDYING
                    try {
                    	//执行terminated方法，该方法在ThreadPoolExecutor中是空方法，由子类重写
                        terminated();
                    } finally {
                    	//执行完terminated方法后，将状态变更为TERMINATED
                        ctl.set(ctlOf(TERMINATED, 0));
                        //唤醒阻塞在条件队列上的线程
                        //同样会先把线程"转移"到CLH队列，然后传递唤醒
                        termination.signalAll();
                    }
                    return;
                }
            } finally {
                mainLock.unlock();
            }
            // else retry on failed CAS
        }
    }
```

- **awaitTermination：** ：等待线程池终止，该方法会通过进入条件队列阻塞（依赖Condition，关于条件队列，在分析CyclicBarrier源码的时候详细解析过了，这里不再赘述~），等待tryTerminate方法调用termination.signalAll()唤醒。

```java
	public boolean awaitTermination(long timeout, TimeUnit unit)
        throws InterruptedException {
        long nanos = unit.toNanos(timeout);
        final ReentrantLock mainLock = this.mainLock;
        mainLock.lock();
        try {
            for (;;) {
                if (runStateAtLeast(ctl.get(), TERMINATED))
                	//如果线程池已经终止，直接返回true
                    return true;
                if (nanos <= 0)
                    return false;
                //进入条件队列阻塞等待线程池终止后唤醒
                nanos = termination.awaitNanos(nanos);
            }
        } finally {
            mainLock.unlock();
        }
    }
```

- **shutdown()：** shutdown线程池，状态变更为SHUTDOWN状态，不允许继续添加任务，仍然会执行队列中的任务，尝试中断空闲的线程，并且调用钩子方法onShutdown，该方法由子类重写，比如ScheduledThreadPoolExecutor重写了该方法。

```java
	public void shutdown() {
        final ReentrantLock mainLock = this.mainLock;
        mainLock.lock();
        try {
        	//安全校验
            checkShutdownAccess();
            //设置线程池状态为SHUTDOWN
            advanceRunState(SHUTDOWN);
            //中断空闲的线程
            interruptIdleWorkers();
            //钩子方法，交由子类实现，比如ScheduledThreadPoolExecutor
            onShutdown();
        } finally {
            mainLock.unlock();
        }
        tryTerminate();
    }
```

- **shutdownNow：**：相对于shutdown方法，shutdownNow会将线程池状态修改为STOP状态，不允许继续提交任务，也不会执行队列中的任务，会把队列中未执行的任务返回，同时尝试中断所有线程，这里没有钩子方法onShutdown的调用。

```java
    public List<Runnable> shutdownNow() {
        List<Runnable> tasks;
        final ReentrantLock mainLock = this.mainLock;
        mainLock.lock();
        try {
            checkShutdownAccess();
            advanceRunState(STOP);
            //尝试中断所有工作线程，不论是否处于空闲状态
            interruptWorkers();
            //返回队列中的任务
            tasks = drainQueue();
        } finally {
            mainLock.unlock();
        }
        tryTerminate();
        return tasks;
    }
```

- **allowCoreThreadTimeOut：** 设置allowCoreThreadTimeOut参数，该参数控制keepAliveTime是否对核心线程生效，如果设置为true，所有工作线程在从阻塞队列获取任务的时候都会添加超时时间，并且在工作线程退出的时候会根据此参数判断需要保证的线程池工作线程数量；如果设置为false，只有当工作线程数大于corePoolSize时才会添加超时时间。

```java
	public void allowCoreThreadTimeOut(boolean value) {
        if (value && keepAliveTime <= 0)
            throw new IllegalArgumentException("Core threads must have nonzero keep alive times");
        if (value != allowCoreThreadTimeOut) {
            allowCoreThreadTimeOut = value;
            if (value)
            	//如果allowCoreThreadTimeOut从false修改为了true，那么表示之前核心线程没有使用超时获取任务
            	//这里尝试中断所有空闲线程
                interruptIdleWorkers();
        }
    }
```

## 总结

一个ThreadPoolExecutor有一个ReentrantLock类型的**mainLock**，对于线程池的核心操作如果需要并发控制，都是基于它实现的。线程池中的任务都是提交任务的时候才触发创建的，并且线程在创建的时候会绑定当时提交的任务，线程池提交任务的时候如果当前工作线程数量workerCount小于corePoolSize，那么会直接创建一个工作线程执行任务，如果workerCount达到了corePoolSize，那么会将任务添加到阻塞队列中，如果阻塞队列满了，那么判断workerCount是否达到了maximumPoolSize，如果未达到则创建一个工作线程执行任务，否则调用指定的拒绝策略。工作线程被包装在Worker对象中，其创建后不一定会马上执行，其默认state为-1，表示不可被中断(tryLock会返回false)，创建之后会继续检查线程池状态，如果不能继续添加工作线程，那么这个worker就需要撤销，同时，向线程池中新增一个工作线程需要做同步处理，方式是自旋+CAS增加workerCount（ctl中的低29位）。

工作线程开始工作后首先执行的都是当前提交的任务，其通过一个while循环，不断从阻塞队列中获取任务(getTask)来执行，如果阻塞队列为空，那么获取任务会被阻塞。若当前线程能够应用keepAliveTime，那么会使用带超时的获取任务接口，一旦getTask返回null，那么就表示这个工作线程退出了，会进入处理退出的逻辑里。

在线程退出的时候还会再次检查线程池状态，看是否需要再次往线程池中添加工作线程，以对应相应的状态。

在我们研究过ThreadPoolExecutor源码之后，现在看看以下问题该如何回答：

**1、** 如果线程池处于SHUTDOWN状态，调用execute方法会发生什么？；

**2、** 自定义的threadFactory中创建的线程能复用吗？如果threadFactory的newThread方法返回一个已经启动的线程，会发生什么？；

**3、** SHUTDOWN状态不允许添加任务，但是允许执行队列中的任务是如何实现的？；

**4、** STOP状态不允许添加任务，也不执行队列中的任务，会尝试中断正在执行的任务，是如何实现的？；

**5、** 线程池中的线程是如何复用的？；

**6、** 线程的最大空闲时间退出是如何实现的？；

**7、** 如果线程池中的某个线程正在执行一个任务，此时调用shutdownNow方法，该线程会立即终止吗？为什么？；

**8、** 线程池运行过程中更新了keepAliveTime会对已经创建的线程生效吗？；

**9、** 如果工作线程异常退出，会发生什么？；

**10、** 既然核心线程没有属性来标识，那么是如何实现在allowCoreThreadTimeOut为false的前提下，核心线程不受keepAliveTime参数影响的？；

**11、** 如果keepAliveTime设置为0意味着什么？；

**12、** 如果向线程池提交了一个死循环任务，且没有任何sleep、wait等方法的调用，该如何完全终止线程池？比如：；

```java
while(true){
     }
```
