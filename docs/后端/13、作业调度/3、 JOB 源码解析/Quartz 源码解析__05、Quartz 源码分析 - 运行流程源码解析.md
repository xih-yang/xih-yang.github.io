# 05、Quartz 源码分析 - 运行流程源码解析
- 来源：https://ddkk.com/zhuanlan/job/xxljob/2/13.html
- 分类：作业调度
- 分组：Quartz 源码解析
### 必要回顾

在之前我们已经分析完了Job、Trigger、Schedule的各自初始化过程，那么它是如何串联起来进行跑动的呢？首先还是要关注回我们的demo当中，是通过

```java
 scheduler.scheduleJob(jobDetail, trigger);
 // 启动
if (!scheduler.isShutdown()) {
    scheduler.start();
}
```

来进行启动运行的。

### scheduler.start()内部源码解析

首先我们需要顺利一下schedule，经过之前源码的解读，大家会有一定的了解，但是这边还是需要梳理一下，避免大家搞混。首先这里的scheduler的实现类是StdScheduler，实现了Scheduler，而在StdScheduler内部持有了一个QuartzScheduler，实际其实工作的就是QuartzScheduler这个类，这里我感觉有点像装饰器模式？（感觉跟几个模式都挺像的，不过无所谓不影响）

我们可以看到在StdScheduler调用start方法，实际就是

```java
private QuartzScheduler sched;
public void start() throws SchedulerException {
        sched.start();
    }
```

所以我们直接跳到QuartzScheduler方法的解析~~

### QuartzScheduler的start源码解析

```java
    /**
     * 调度器开始运行
     */
    public void start() throws SchedulerException {
        if (shuttingDown|| closed) {
            throw new SchedulerException(
                    "The Scheduler cannot be restarted after shutdown() has been called.");
        }
        // 通知调度器监控器启动中
        notifySchedulerListenersStarting();
        if (initialStart == null) {
      //初始化标识为null，进行初始化操作
            initialStart = new Date();
            this.resources.getJobStore().schedulerStarted();            
            startPlugins();
        } else {
            resources.getJobStore().schedulerResumed();
        }
        schedThread.togglePause(false);//设置 不暂停
        getLog().info(
                "Scheduler " + resources.getUniqueIdentifier() + " started.");
        //提醒调度器的监听启动
        notifySchedulerListenersStarted();
    }
```

第一部分相信大家也都明白，就是判断参数，如果成立就抛出异常。

直接到第二部分，也就是通知调度器监控器启动中：

```java
    /**
     * 通知调度器监控器启动中
     */
    public void notifySchedulerListenersStarting() {
        // build a list of all scheduler listeners that are to be notified...
        List<SchedulerListener> schedListeners = buildSchedulerListenerList();
        // notify all scheduler listeners
        for (SchedulerListener sl : schedListeners) {
            try {
                sl.schedulerStarting();
            } catch (Exception e) {
                getLog().error(
                        "Error while notifying SchedulerListener of startup.",
                        e);
            }
        }
    }
```

这里的关键步骤还是在于构建调度器监听器部分，之后就是每个都调用方法~

```java
    /**
     * 构建调度器监听器列表
     */
    private List<SchedulerListener> buildSchedulerListenerList() {
        List<SchedulerListener> allListeners = new LinkedList<SchedulerListener>();
        allListeners.addAll(getListenerManager().getSchedulerListeners());
        allListeners.addAll(getInternalSchedulerListeners());
        return allListeners;
    }
```

这里我们可以看到添加了两个部分的listener，第一部分是getListenerManager()，这里返回的是listenerManager，也是QuartzScheduler中的属性：

```java
    private ListenerManager listenerManager = new ListenerManagerImpl();
```

这里其实就是管控所有listener，也包括了job，trigger等等所有的。相当于一个监听器的总部。如果我们需要用到监听器这个功能，也可以通过在初始化时自定义监听器插入进去。

另一个是getInternalSchedulerListeners，添加内部的调度器监听器，我这边大致看了下，目前就找了到一个ErrorLog一个打印错误的，还有一个JobRunShell,但是并没有运行schedulerStarting 方法，因为

```java
public class JobRunShell extends SchedulerListenerSupport implements Runnable 
```

而在

```java
public abstract class SchedulerListenerSupport implements SchedulerListener {
...
  public void schedulerStarting() {
    }
...
}
```

这个抽象类并没有做任何操作，而JobRunShell也没有重写这个方法。所以基本现在等于没有做任何实际性操作，我们继续放下看start方法内部。

下面是

```java
        if (initialStart == null) {
      //初始化标识为null，进行初始化操作
            initialStart = new Date();
            this.resources.getJobStore().schedulerStarted();            
            startPlugins();
        } else {
            resources.getJobStore().schedulerResumed();
        }
```

我们刚开始启动肯定是null，所以走上面一个内容，还记得么？我们默认的JobStore实现类是RAMJobStore,在

```java
public class RAMJobStore implements JobStore {
...
    public void schedulerStarted() {
        // nothing to do
    }
...
}
```

也是没有做任何操作。后面的插件我们不做过多解析，因为我也没有放入任何实质性插件。里面的内容也无非是获取插件列表并启动。

最后是

```java
//提醒调度器的监听启动
        notifySchedulerListenersStarted();
```

其实这里的代码跟之前启动中是一模一样的，只不过SchedulerListeners调用的方式是schedulerStarted，所以也不做过多的展开。就这样整体的start过程就结束了~~~

### Scheduler源码回忆

[quartz定时任务（04）—— Scheduler源码解析](/zhuanlan/job/xxljob/2/4.html)

```java
qs = new QuartzScheduler(rsrcs, idleWaitTime, dbFailureRetry);
```

这行代码是否大家还记得。

我们深入进去给大家继续看下

```java
    /**
     * 初始化QuartzScheduler类
     */
    public QuartzScheduler(QuartzSchedulerResources resources, long idleWaitTime, @Deprecated long dbRetryInterval)
        throws SchedulerException {
        this.resources = resources;
        if (resources.getJobStore() instanceof JobListener) {
            addInternalJobListener((JobListener)resources.getJobStore());
        }
        this.schedThread = new QuartzSchedulerThread(this, resources);
        ThreadExecutor schedThreadExecutor = resources.getThreadExecutor();
        schedThreadExecutor.execute(this.schedThread);
        if (idleWaitTime > 0) {
            this.schedThread.setIdleWaitTime(idleWaitTime);
        }
        jobMgr = new ExecutingJobsManager();
        addInternalJobListener(jobMgr);
        errLogger = new ErrorLogger();
        addInternalSchedulerListener(errLogger);
        signaler = new SchedulerSignalerImpl(this, this.schedThread);
        getLog().info("Quartz Scheduler v." + getVersion() + " created.");
    }
```

划重点：

```java
        //创建调度线程
        this.schedThread = new QuartzSchedulerThread(this, resources);
        ThreadExecutor schedThreadExecutor = resources.getThreadExecutor();
        schedThreadExecutor.execute(this.schedThread);
        if (idleWaitTime > 0) {
            this.schedThread.setIdleWaitTime(idleWaitTime);
        }
```

这段代码在干嘛呢？

就是创建了调度线程，并且执行

```java
public void execute(Thread thread) {
        thread.start();
    }
```

schedThreadExecutor.execute(this.schedThread);的调用其实就是去启动调度线程。那么接下来我们就要进行对QuartzSchedulerThread的run方法进行分析了。

### QuartzSchedulerThread的run方法源码分析

先看下整块代码：

```java
    @Override
    public void run() {
        boolean lastAcquireFailed = false;
        while (!halted.get()) {
            try {
                // check if we're supposed to pause...
                synchronized (sigLock) {
                    //这里的paused对应QuartzScheduler的start方法中启动
                    while (paused && !halted.get()) {
                        try {
                            // wait until togglePause(false) is called...
                            sigLock.wait(1000L);
                        } catch (InterruptedException ignore) {
                        }
                    }
                    if (halted.get()) {
                        break;
                    }
                }
                //获取可用线程数 qsRsrcs是QuartzSchedulerResources对象
                int availThreadCount = qsRsrcs.getThreadPool().blockForAvailableThreads();
                if(availThreadCount > 0) {
      // will always be true, due to semantics of blockForAvailableThreads...
                    List<OperableTrigger> triggers = null;
                    long now = System.currentTimeMillis();
                    //清除调度改变的信号
                    clearSignaledSchedulingChange();
                    try {
                        //到JobStore中获取下次被触发的触发器
                        triggers = qsRsrcs.getJobStore().acquireNextTriggers(
                                now + idleWaitTime, Math.min(availThreadCount, qsRsrcs.getMaxBatchSize()), qsRsrcs.getBatchTimeWindow());
                        lastAcquireFailed = false;
                        if (log.isDebugEnabled()) 
                            log.debug("batch acquisition of " + (triggers == null ? 0 : triggers.size()) + " triggers");
                    } catch (JobPersistenceException jpe) {
                        if(!lastAcquireFailed) {
                            qs.notifySchedulerListenersError(
                                "An error occurred while scanning for the next triggers to fire.",
                                jpe);
                        }
                        lastAcquireFailed = true;
                        continue;
                    } catch (RuntimeException e) {
                        if(!lastAcquireFailed) {
                            getLog().error("quartzSchedulerThreadLoop: RuntimeException "
                                    +e.getMessage(), e);
                        }
                        lastAcquireFailed = true;
                        continue;
                    }
                    if (triggers != null && !triggers.isEmpty()) {
                        now = System.currentTimeMillis();
                        //这里为什么triggers的第一个对象就是最早需要被执行的？
                        long triggerTime = triggers.get(0).getNextFireTime().getTime();
                        long timeUntilTrigger = triggerTime - now;
                        //如果第一条下次触发时间大于当前时间则进入等待
                        while(timeUntilTrigger > 2) {
                            synchronized (sigLock) {
                                if (halted.get()) {
                                    break;
                                }
                                if (!isCandidateNewTimeEarlierWithinReason(triggerTime, false)) {
                                    try {
                                        // we could have blocked a long while
                                        // on 'synchronize', so we must recompute
                                        now = System.currentTimeMillis();
                                        timeUntilTrigger = triggerTime - now;
                                        if(timeUntilTrigger >= 1)
                                            sigLock.wait(timeUntilTrigger);
                                    } catch (InterruptedException ignore) {
                                    }
                                }
                            }
                            //等待的过程中看看有没有收到调度信号
                            if(releaseIfScheduleChangedSignificantly(triggers, triggerTime)) {
                                break;
                            }
                            now = System.currentTimeMillis();
                            timeUntilTrigger = triggerTime - now;
                        }
                        // this happens if releaseIfScheduleChangedSignificantly decided to release triggers
                        if(triggers.isEmpty())
                            continue;
                        // set triggers to 'executing'
                        List<TriggerFiredResult> bndles = new ArrayList<TriggerFiredResult>();
                        boolean goAhead = true;
                        synchronized(sigLock) {
                            goAhead = !halted.get();
                        }
                        if(goAhead) {
                            try {
                                List<TriggerFiredResult> res = qsRsrcs.getJobStore().triggersFired(triggers);
                                if(res != null)
                                    bndles = res;
                            } catch (SchedulerException se) {
                                qs.notifySchedulerListenersError(
                                        "An error occurred while firing triggers '"
                                                + triggers + "'", se);
                                //QTZ-179 : a problem occurred interacting with the triggers from the db
                                //we release them and loop again
                                for (int i = 0; i < triggers.size(); i++) {
                                    qsRsrcs.getJobStore().releaseAcquiredTrigger(triggers.get(i));
                                }
                                continue;
                            }
                        }
                        for (int i = 0; i < bndles.size(); i++) {
                            TriggerFiredResult result =  bndles.get(i);
                            TriggerFiredBundle bndle =  result.getTriggerFiredBundle();
                            Exception exception = result.getException();
                            if (exception instanceof RuntimeException) {
                                getLog().error("RuntimeException while firing trigger " + triggers.get(i), exception);
                                qsRsrcs.getJobStore().releaseAcquiredTrigger(triggers.get(i));
                                continue;
                            }
                            // it's possible to get 'null' if the triggers was paused,
                            // blocked, or other similar occurrences that prevent it being
                            // fired at this time...  or if the scheduler was shutdown (halted)
                            if (bndle == null) {
                                qsRsrcs.getJobStore().releaseAcquiredTrigger(triggers.get(i));
                                continue;
                            }
                            // 下面是开始执行任务
                            JobRunShell shell = null;
                            try {
                                //构造执行对象，JobRunShell实现了Runnable
                                shell = qsRsrcs.getJobRunShellFactory().createJobRunShell(bndle);
                                //这个里面会用我们自定义的Job来new一个对象，并把相关执行Job是需要的数据传给JobExecutionContextImpl(这是我们自定义job的execute方法参数)
                                shell.initialize(qs);
                            } catch (SchedulerException se) {
                                qsRsrcs.getJobStore().triggeredJobComplete(triggers.get(i), bndle.getJobDetail(), CompletedExecutionInstruction.SET_ALL_JOB_TRIGGERS_ERROR);
                                continue;
                            }
                            // 这里是把任务放入到线程池中
                            if (qsRsrcs.getThreadPool().runInThread(shell) == false) {
                                // this case should never happen, as it is indicative of the
                                // scheduler being shutdown or a bug in the thread pool or
                                // a thread pool being used concurrently - which the docs
                                // say not to do...
                                getLog().error("ThreadPool.runInThread() return false!");
                                qsRsrcs.getJobStore().triggeredJobComplete(triggers.get(i), bndle.getJobDetail(), CompletedExecutionInstruction.SET_ALL_JOB_TRIGGERS_ERROR);
                            }
                        }
                        continue; // while (!halted)
                    }
                } else {
      // if(availThreadCount > 0)
                    // should never happen, if threadPool.blockForAvailableThreads() follows contract
                    continue; // while (!halted)
                }
                long now = System.currentTimeMillis();
                long waitTime = now + getRandomizedIdleWaitTime();
                long timeUntilContinue = waitTime - now;
                synchronized(sigLock) {
                    try {
                      if(!halted.get()) {
                        // QTZ-336 A job might have been completed in the mean time and we might have
                        // missed the scheduled changed signal by not waiting for the notify() yet
                        // Check that before waiting for too long in case this very job needs to be
                        // scheduled very soon
                        if (!isScheduleChanged()) {
                          sigLock.wait(timeUntilContinue);
                        }
                      }
                    } catch (InterruptedException ignore) {
                    }
                }
            } catch(RuntimeException re) {
                getLog().error("Runtime error occurred in main trigger firing loop.", re);
            }
        } // while (!halted)
        // drop references to scheduler stuff to aid garbage collection...
        qs = null;
        qsRsrcs = null;
    }
```

我们可以整体的话 我们是通过一个while循环来保证定时任务不断去运行的。这里就引发了一个我的一个好奇？是不是定时任务的话，基本都是通过while这种形式来实现的呢？因为在我脑海的各种假设中，只有无线循环能够满足。

下面我们就开始进行逐段分析：

```java
                // check if we're supposed to pause...
                synchronized (sigLock) {
                    //这里的paused对应QuartzScheduler的start方法中启动
                    while (paused && !halted.get()) {
                        try {
                            // wait until togglePause(false) is called...
                            sigLock.wait(1000L);
                        } catch (InterruptedException ignore) {
                        }
                    }
                    if (halted.get()) {
                        break;
                    }
                }
```

这块代码可能乍一看很简单，也很容易懂，就是一个while循环，满足条件就等待。但是放在于整个框架中，就有一些微妙了，这种的paused变量会在QuartzScheduler的start方法中启动设置为false，在上一节中我其实也贴出来代码过：

```java
    /**
     * 调度器开始运行
     */
    public void start() throws SchedulerException {
        if (shuttingDown|| closed) {
            throw new SchedulerException(
                    "The Scheduler cannot be restarted after shutdown() has been called.");
        }
        // 通知调度器监控器启动中
        notifySchedulerListenersStarting();
        if (initialStart == null) {
      //初始化标识为null，进行初始化操作
            initialStart = new Date();
            this.resources.getJobStore().schedulerStarted();            
            startPlugins();
        } else {
            resources.getJobStore().schedulerResumed();
        }
        schedThread.togglePause(false);//设置 不暂停
        getLog().info(
                "Scheduler " + resources.getUniqueIdentifier() + " started.");
        //提醒调度器的监听启动
        notifySchedulerListenersStarted();
    }
```

中的schedThread.togglePause(false);,所以只有人为的去掉用schedule.start的方法之后，定时任务才会正在的开始进行跑动。至于其中的paused和halted变量，则是在QuartzSchedulerThread构造方法中初始化的：

```java
    QuartzSchedulerThread(QuartzScheduler qs, QuartzSchedulerResources qsRsrcs, boolean setDaemon, int threadPrio) {
        super(qs.getSchedulerThreadGroup(), qsRsrcs.getThreadName());
        this.qs = qs;
        this.qsRsrcs = qsRsrcs;
        this.setDaemon(setDaemon);
        if(qsRsrcs.isThreadsInheritInitializersClassLoadContext()) {
            log.info("QuartzSchedulerThread Inheriting ContextClassLoader of thread: " + Thread.currentThread().getName());
            this.setContextClassLoader(Thread.currentThread().getContextClassLoader());
        }
        this.setPriority(threadPrio);
        // start the underlying thread, but put this object into the 'paused'
        // state
        // so processing doesn't start yet...
        paused = true;
        halted = new AtomicBoolean(false);
    }
```

可以看到默认paused为true，halted为false。

第一部分源码是：

```java
                //获取可用线程数 qsRsrcs是QuartzSchedulerResources对象
                int availThreadCount = qsRsrcs.getThreadPool().blockForAvailableThreads();
                if(availThreadCount > 0) {
      // will always be true, due to semantics of blockForAvailableThreads...
                    List<OperableTrigger> triggers = null;
                    long now = System.currentTimeMillis();
                    //清除调度改变的信号
                    clearSignaledSchedulingChange();
                    try {
                        //到JobStore中获取下次被触发的触发器
                        triggers = qsRsrcs.getJobStore().acquireNextTriggers(
                                now + idleWaitTime, Math.min(availThreadCount, qsRsrcs.getMaxBatchSize()), qsRsrcs.getBatchTimeWindow());
                        lastAcquireFailed = false;
                        if (log.isDebugEnabled()) 
                            log.debug("batch acquisition of " + (triggers == null ? 0 : triggers.size()) + " triggers");
                    } catch (JobPersistenceException jpe) {
                        if(!lastAcquireFailed) {
                            qs.notifySchedulerListenersError(
                                "An error occurred while scanning for the next triggers to fire.",
                                jpe);
                        }
                        lastAcquireFailed = true;
                        continue;
                    } catch (RuntimeException e) {
                        if(!lastAcquireFailed) {
                            getLog().error("quartzSchedulerThreadLoop: RuntimeException "
                                    +e.getMessage(), e);
                        }
                        lastAcquireFailed = true;
                        continue;
                    }
                    ...
```

这里首先回去获取可用线程数，这里返回的值是肯定大于0的，为什么呢？我们直接进入源码：

```java
   /**
     * 获取可用线程个数
     */
    public int blockForAvailableThreads() {
        synchronized(nextRunnableLock) {
            while((availWorkers.size() < 1 || handoffPending) && !isShutdown) {
                try {
                    nextRunnableLock.wait(500);
                } catch (InterruptedException ignore) {
                }
            }
            return availWorkers.size();
        }
    }
```

我们可以看到，只要程序没有停止，如果没有可用线程，就会一直while循环卡顿，直到有可用线程。

接下来是clearSignaledSchedulingChange清除信号，源码是：

```java
    /**
     * 清除调度改变的信号
     */
    public void clearSignaledSchedulingChange() {
        synchronized(sigLock) {
            signaled = false;
            signaledNextFireTime = 0;
        }
    }
```

这里也没有多大可以说的，就是把变量设置到初始化状态。

最后也是最关键的部分获取Trigger触发器。由于我们放在QuartzSchedulerResources的JobStore的是RAMJobStore，那我们直接跳入进去：

```java
    /**
     * 通过调用调度器获取下一个触发触发器的句柄，并将其标记为'reserved'
     */
    public List<OperableTrigger> acquireNextTriggers(long noLaterThan, int maxCount, long timeWindow) {
        synchronized (lock) {
            List<OperableTrigger> result = new ArrayList<OperableTrigger>();
            Set<JobKey> acquiredJobKeysForNoConcurrentExec = new HashSet<JobKey>();
            Set<TriggerWrapper> excludedTriggers = new HashSet<TriggerWrapper>();
            long batchEnd = noLaterThan;
            // return empty list if store has no triggers.
            if (timeTriggers.size() == 0)
                return result;
            while (true) {
                TriggerWrapper tw;
                try {
                    tw = timeTriggers.first();
                    if (tw == null)
                        break;
                    timeTriggers.remove(tw);
                } catch (java.util.NoSuchElementException nsee) {
                    break;
                }
                if (tw.trigger.getNextFireTime() == null) {
                    continue;
                }
                if (applyMisfire(tw)) {
                    if (tw.trigger.getNextFireTime() != null) {
                        timeTriggers.add(tw);
                    }
                    continue;
                }
                if (tw.getTrigger().getNextFireTime().getTime() > batchEnd) {
                    timeTriggers.add(tw);
                    break;
                }
                // If trigger's job is set as @DisallowConcurrentExecution, and it has already been added to result, then
                // put it back into the timeTriggers set and continue to search for next trigger.
                JobKey jobKey = tw.trigger.getJobKey();
                JobDetail job = jobsByKey.get(tw.trigger.getJobKey()).jobDetail;
                if (job.isConcurrentExectionDisallowed()) {
                    if (acquiredJobKeysForNoConcurrentExec.contains(jobKey)) {
                        excludedTriggers.add(tw);
                        continue; // go to next trigger in store.
                    } else {
                        acquiredJobKeysForNoConcurrentExec.add(jobKey);
                    }
                }
                tw.state = TriggerWrapper.STATE_ACQUIRED;
                tw.trigger.setFireInstanceId(getFiredTriggerRecordId());
                OperableTrigger trig = (OperableTrigger) tw.trigger.clone();
                if (result.isEmpty()) {
                    batchEnd = Math.max(tw.trigger.getNextFireTime().getTime(), System.currentTimeMillis()) + timeWindow;
                }
                result.add(trig);
                if (result.size() == maxCount)
                    break;
            }
            // If we did excluded triggers to prevent ACQUIRE state due to DisallowConcurrentExecution, we need to add them back to store.
            if (excludedTriggers.size() > 0)
                timeTriggers.addAll(excludedTriggers);
            return result;
        }
    }
```

下面就逐行进行分析，首先是三个变量，现在肯定是不知道干什么的，所以我们继续往下看，之后我们关注到RAMJobStore的属性timeTriggers如果里面没有内容就直接返回了。那么timeTriggers是什么呢？

```java
 protected TreeSet<TriggerWrapper> timeTriggers = new TreeSet<TriggerWrapper>(new TriggerWrapperComparator());
```

我们可以看到这里放入了一个TriggerWrapperComparator类，但是这个具体干嘛的？大家从名字可能看出来这是一个触发器的比较器，是timeTriggers放入进去排序的算法。

```java
class TriggerWrapperComparator implements Comparator<TriggerWrapper>, java.io.Serializable {
    private static final long serialVersionUID = 8809557142191514261L;
    TriggerTimeComparator ttc = new TriggerTimeComparator();
    public int compare(TriggerWrapper trig1, TriggerWrapper trig2) {
        return ttc.compare(trig1.trigger, trig2.trigger);
    }
    @Override
    public boolean equals(Object obj) {
        return (obj instanceof TriggerWrapperComparator);
    }
    @Override
    public int hashCode() {
        return super.hashCode();
    }
}
```

就是比较类，之中的TriggerTimeComparator就是根据Trigger下一次触发时间的比较类，这里也比较好理解，就是对于触发器根据最近触发时间来进行排序。那么我们继续进行下去，接下来是会取出距离现在最快触发的Trigger，这里就假设是tw变量（方便下面述说），然后从timeTriggers中移除出去，如果tw没有下次触发时间了，则直接跳过继续。下面是applyMisfire方法：

```java
    protected boolean applyMisfire(TriggerWrapper tw) {
        long misfireTime = System.currentTimeMillis();
        if (getMisfireThreshold() > 0) {
            misfireTime -= getMisfireThreshold();
        }
        Date tnft = tw.trigger.getNextFireTime();
        if (tnft == null || tnft.getTime() > misfireTime 
                || tw.trigger.getMisfireInstruction() == Trigger.MISFIRE_INSTRUCTION_IGNORE_MISFIRE_POLICY) {
            return false; 
        }
        Calendar cal = null;
        if (tw.trigger.getCalendarName() != null) {
            cal = retrieveCalendar(tw.trigger.getCalendarName());
        }
        signaler.notifyTriggerListenersMisfired((OperableTrigger)tw.trigger.clone());
        tw.trigger.updateAfterMisfire(cal);
        if (tw.trigger.getNextFireTime() == null) {
            tw.state = TriggerWrapper.STATE_COMPLETE;
            signaler.notifySchedulerListenersFinalized(tw.trigger);
            synchronized (lock) {
                timeTriggers.remove(tw);
            }
        } else if (tnft.equals(tw.trigger.getNextFireTime())) {
            return false;
        }
        return true;
    }
```

这段代码就是如果触发器失火的情况下的处理（失火是指触发器在改触发的时间点没有触发Job任务）。就是在失火状态下根据触发器的下次触发时间，分别通知触发器监听器不同信息。

之后便是在判断触发器的下次触发时间如果大于noLaterThan的时候，再把tw加到timeTriggers，这一段什么意思呢？

其实就是如果触发器的下次触发时间要大于系统现在的时间加上我们设置的参数，这说明了最近触发时间还有点远，让我们直接歇一下。那么其实大家想到没有，之前idleWaitTime的变量就是就是一个调优参数了，这个参数决定了Trigger的什么时候获取出来。

之后便通过trigger获取JobKey，然后在通过JobStore下的map根据JobKey获取唯一的JobDetail。那么之后的job.isConcurrentExectionDisallowed()是干啥的？

```java
    public boolean isConcurrentExectionDisallowed() {
        return ClassUtils.isAnnotationPresent(jobClass, DisallowConcurrentExecution.class);
    }
```

其实就是查看Job是否有DisallowConcurrentExecution这个注解，这个注解是干嘛的呢？就是防止比如我们Job运行时间是5秒，但是定时任务是每3秒调用一次，这就会导致Job并发去跑。但是如果有了这个注解，就会等之前的Job跑完之后才会去跑。怎么实现的？那么我们接下看，如果Job包含这个注解，那么就会调用acquiredJobKeysForNoConcurrentExec.contains(jobKey)，会查询Set中是否有这个JobKey，如果有的话就会在去除调用的Set中添加进去，并且直接跳过当前流程。后面的操作就相对比较简单了，判断下Trigger的总量，然后最后把本次跳过的Trigger在添加进去。

```java
                    if (triggers != null && !triggers.isEmpty()) {
                        now = System.currentTimeMillis();
                        //这里为什么triggers的第一个对象就是最早需要被执行的？
                        long triggerTime = triggers.get(0).getNextFireTime().getTime();
                        long timeUntilTrigger = triggerTime - now;
                        //如果第一条下次触发时间大于当前时间则进入等待
                        while(timeUntilTrigger > 2) {
                            synchronized (sigLock) {
                                if (halted.get()) {
                                    break;
                                }
                                if (!isCandidateNewTimeEarlierWithinReason(triggerTime, false)) {
                                    try {
                                        // we could have blocked a long while
                                        // on 'synchronize', so we must recompute
                                        now = System.currentTimeMillis();
                                        timeUntilTrigger = triggerTime - now;
                                        if(timeUntilTrigger >= 1)
                                            sigLock.wait(timeUntilTrigger);
                                    } catch (InterruptedException ignore) {
                                    }
                                }
                            }
                            //等待的过程中看看有没有收到调度信号
                            if(releaseIfScheduleChangedSignificantly(triggers, triggerTime)) {
                                break;
                            }
                            now = System.currentTimeMillis();
                            timeUntilTrigger = triggerTime - now;
                        }
                        // this happens if releaseIfScheduleChangedSignificantly decided to release triggers
                        if(triggers.isEmpty())
                            continue;
                        // set triggers to 'executing'
                        List<TriggerFiredResult> bndles = new ArrayList<TriggerFiredResult>();
                        boolean goAhead = true;
                        synchronized(sigLock) {
                            goAhead = !halted.get();
                        }
                        if(goAhead) {
                            try {
                                List<TriggerFiredResult> res = qsRsrcs.getJobStore().triggersFired(triggers);
                                if(res != null)
                                    bndles = res;
                            } catch (SchedulerException se) {
                                qs.notifySchedulerListenersError(
                                        "An error occurred while firing triggers '"
                                                + triggers + "'", se);
                                //QTZ-179 : a problem occurred interacting with the triggers from the db
                                //we release them and loop again
                                for (int i = 0; i < triggers.size(); i++) {
                                    qsRsrcs.getJobStore().releaseAcquiredTrigger(triggers.get(i));
                                }
                                continue;
                            }
                        }
                        for (int i = 0; i < bndles.size(); i++) {
                            TriggerFiredResult result =  bndles.get(i);
                            TriggerFiredBundle bndle =  result.getTriggerFiredBundle();
                            Exception exception = result.getException();
                            if (exception instanceof RuntimeException) {
                                getLog().error("RuntimeException while firing trigger " + triggers.get(i), exception);
                                qsRsrcs.getJobStore().releaseAcquiredTrigger(triggers.get(i));
                                continue;
                            }
                            // it's possible to get 'null' if the triggers was paused,
                            // blocked, or other similar occurrences that prevent it being
                            // fired at this time...  or if the scheduler was shutdown (halted)
                            if (bndle == null) {
                                qsRsrcs.getJobStore().releaseAcquiredTrigger(triggers.get(i));
                                continue;
                            }
                            // 下面是开始执行任务
                            JobRunShell shell = null;
                            try {
                                //构造执行对象，JobRunShell实现了Runnable
                                shell = qsRsrcs.getJobRunShellFactory().createJobRunShell(bndle);
                                //这个里面会用我们自定义的Job来new一个对象，并把相关执行Job是需要的数据传给JobExecutionContextImpl(这是我们自定义job的execute方法参数)
                                shell.initialize(qs);
                            } catch (SchedulerException se) {
                                qsRsrcs.getJobStore().triggeredJobComplete(triggers.get(i), bndle.getJobDetail(), CompletedExecutionInstruction.SET_ALL_JOB_TRIGGERS_ERROR);
                                continue;
                            }
                            // 这里是把任务放入到线程池中
                            if (qsRsrcs.getThreadPool().runInThread(shell) == false) {
                                // this case should never happen, as it is indicative of the
                                // scheduler being shutdown or a bug in the thread pool or
                                // a thread pool being used concurrently - which the docs
                                // say not to do...
                                getLog().error("ThreadPool.runInThread() return false!");
                                qsRsrcs.getJobStore().triggeredJobComplete(triggers.get(i), bndle.getJobDetail(), CompletedExecutionInstruction.SET_ALL_JOB_TRIGGERS_ERROR);
                            }
                        }
                        continue; // while (!halted)
                    }
                } else {
      // if(availThreadCount > 0)
                    // should never happen, if threadPool.blockForAvailableThreads() follows contract
                    continue; // while (!halted)
                }
```

首先是判断trigger是否存在，不存在的话就continue，继续外层while循环，保证定时任务一直运行下去。

接下来分析triggers存在的情况下：

这里会获取trigger第一个触发器下次触发时间，这里值是指距离现在最近的触发时间，但是为什么trigger数组中第一个就是最快的呢？

这里不知大家还记得，它是存放在

```java
 protected TreeSet<TriggerWrapper> timeTriggers = new TreeSet<TriggerWrapper>(new TriggerWrapperComparator());
```

这个类的实现类就是根据Trigger的触发时间的远近来进行排序的，然后

```java
OperableTrigger trig = (OperableTrigger) tw.trigger.clone();
                if (result.isEmpty()) {
                    batchEnd = Math.max(tw.trigger.getNextFireTime().getTime(), System.currentTimeMillis()) + timeWindow;
                }
                result.add(trig);
```

通过克隆复制添加进去的，这个方法中返回的就是result。

接下来我们继续往下讲，我们会把根据距离触发时间的时间间隔，如果间隔大于2（这里为什么是2呢？我猜想主要是因为接下来的判断中有判断间隔大于1的，如果两个值相同就没有意思了，而且保证有足够的时间到下一步判断还能大于1）就继续往下走。

接下来的方法源码是：

```java
    /**
     * 是否有更早的触发器
     */
    private boolean isCandidateNewTimeEarlierWithinReason(long oldTime, boolean clearSignal) {
        synchronized(sigLock) {
            //看信号是否改变
            if (!isScheduleChanged())
                return false;
            boolean earlier = false;
            //如果信号发生改变了，则比较信号下次触发时间
            if(getSignaledNextFireTime() == 0)
                earlier = true;
            else if(getSignaledNextFireTime() < oldTime )
                earlier = true;
            //下次触发时间可能比较早，但是如果本来执行时间快到了这个信号也不算
            if(earlier) {
                // so the new time is considered earlier, but is it enough earlier?
                long diff = oldTime - System.currentTimeMillis();
                if(diff < (qsRsrcs.getJobStore().supportsPersistence() ? 70L : 7L))
                    earlier = false;
            }
            //把本次的信号清除掉
            if(clearSignal) {
                clearSignaledSchedulingChange();
            }
            return earlier;
        }
    }
```

这个方法就是判断执行器有没有更早的触发器，如果没有的话则等待触发器触发的时间间隔时间。（至于这里的信号量改变，具体是哪里触发的现在还不太懂）。

接下来是releaseIfScheduleChangedSignificantly方法：

```java
private boolean releaseIfScheduleChangedSignificantly(
        List<OperableTrigger> triggers, long triggerTime) {
    if (isCandidateNewTimeEarlierWithinReason(triggerTime, true)) {
        // above call does a clearSignaledSchedulingChange()
        for (OperableTrigger trigger : triggers) {
            qsRsrcs.getJobStore().releaseAcquiredTrigger(trigger);
        }
        triggers.clear();
        return true;
    }
    return false;
}
```

···
这里面也调用了之前的isCandidateNewTimeEarlierWithinReason方法，为什么这里的Boolean参数就是true了呢？之前的是false。因为这里需要清空信号。

```java
            //把本次的信号清除掉
            if(clearSignal) {
                clearSignaledSchedulingChange();
            }
```

之后就是把trigger这个列表都清空掉。

之后我们就进入了：

```java
                        if(goAhead) {
                            try {
                                List<TriggerFiredResult> res = qsRsrcs.getJobStore().triggersFired(triggers);
                                if(res != null)
                                    bndles = res;
                            } catch (SchedulerException se) {
                                qs.notifySchedulerListenersError(
                                        "An error occurred while firing triggers '"
                                                + triggers + "'", se);
                                //QTZ-179 : a problem occurred interacting with the triggers from the db
                                //we release them and loop again
                                for (int i = 0; i < triggers.size(); i++) {
                                    qsRsrcs.getJobStore().releaseAcquiredTrigger(triggers.get(i));
                                }
                                continue;
                            }
                        }
```

就通知jobStore开始执行了，根据trigger获取其对应的JobDetail, 封装成TriggerFiredResult

```java
    /**
     * 通知jobStore开始执行了，根据trigger获取其对应的JobDetail, 封装成TriggerFiredResult
     */
    public List<TriggerFiredResult> triggersFired(List<OperableTrigger> firedTriggers) {
        synchronized (lock) {
            List<TriggerFiredResult> results = new ArrayList<TriggerFiredResult>();
            for (OperableTrigger trigger : firedTriggers) {
                TriggerWrapper tw = triggersByKey.get(trigger.getKey());
                // was the trigger deleted since being acquired?
                if (tw == null || tw.trigger == null) {
                    continue;
                }
                // was the trigger completed, paused, blocked, etc. since being acquired?
                if (tw.state != TriggerWrapper.STATE_ACQUIRED) {
                    continue;
                }
                Calendar cal = null;
                if (tw.trigger.getCalendarName() != null) {
                    cal = retrieveCalendar(tw.trigger.getCalendarName());
                    if(cal == null)
                        continue;
                }
                Date prevFireTime = trigger.getPreviousFireTime();
                // in case trigger was replaced between acquiring and firing
                timeTriggers.remove(tw);
                // call triggered on our copy, and the scheduler's copy
                tw.trigger.triggered(cal);
                trigger.triggered(cal);
                //tw.state = TriggerWrapper.STATE_EXECUTING;
                tw.state = TriggerWrapper.STATE_WAITING;
                TriggerFiredBundle bndle = new TriggerFiredBundle(retrieveJob(
                        tw.jobKey), trigger, cal,
                        false, new Date(), trigger.getPreviousFireTime(), prevFireTime,
                        trigger.getNextFireTime());
                JobDetail job = bndle.getJobDetail();
                if (job.isConcurrentExectionDisallowed()) {
                    ArrayList<TriggerWrapper> trigs = getTriggerWrappersForJob(job.getKey());
                    for (TriggerWrapper ttw : trigs) {
                        if (ttw.state == TriggerWrapper.STATE_WAITING) {
                            ttw.state = TriggerWrapper.STATE_BLOCKED;
                        }
                        if (ttw.state == TriggerWrapper.STATE_PAUSED) {
                            ttw.state = TriggerWrapper.STATE_PAUSED_BLOCKED;
                        }
                        timeTriggers.remove(ttw);
                    }
                    blockedJobs.add(job.getKey());
                } else if (tw.trigger.getNextFireTime() != null) {
                    synchronized (lock) {
                        timeTriggers.add(tw);
                    }
                }
                results.add(new TriggerFiredResult(bndle));
            }
            return results;
        }
    }
```

获取到相应启动的TriggerFiredResult任务后，便是循环执行：

```java
                        for (int i = 0; i < bndles.size(); i++) {
                            TriggerFiredResult result =  bndles.get(i);
                            TriggerFiredBundle bndle =  result.getTriggerFiredBundle();
                            Exception exception = result.getException();
                            if (exception instanceof RuntimeException) {
                                getLog().error("RuntimeException while firing trigger " + triggers.get(i), exception);
                                qsRsrcs.getJobStore().releaseAcquiredTrigger(triggers.get(i));
                                continue;
                            }
                            // it's possible to get 'null' if the triggers was paused,
                            // blocked, or other similar occurrences that prevent it being
                            // fired at this time...  or if the scheduler was shutdown (halted)
                            if (bndle == null) {
                                qsRsrcs.getJobStore().releaseAcquiredTrigger(triggers.get(i));
                                continue;
                            }
                            // 下面是开始执行任务
                            JobRunShell shell = null;
                            try {
                                //构造执行对象，JobRunShell实现了Runnable
                                shell = qsRsrcs.getJobRunShellFactory().createJobRunShell(bndle);
                                //这个里面会用我们自定义的Job来new一个对象，并把相关执行Job是需要的数据传给JobExecutionContextImpl(这是我们自定义job的execute方法参数)
                                shell.initialize(qs);
                            } catch (SchedulerException se) {
                                qsRsrcs.getJobStore().triggeredJobComplete(triggers.get(i), bndle.getJobDetail(), CompletedExecutionInstruction.SET_ALL_JOB_TRIGGERS_ERROR);
                                continue;
                            }
                            // 这里是把任务放入到线程池中
                            if (qsRsrcs.getThreadPool().runInThread(shell) == false) {
                                // this case should never happen, as it is indicative of the
                                // scheduler being shutdown or a bug in the thread pool or
                                // a thread pool being used concurrently - which the docs
                                // say not to do...
                                getLog().error("ThreadPool.runInThread() return false!");
                                qsRsrcs.getJobStore().triggeredJobComplete(triggers.get(i), bndle.getJobDetail(), CompletedExecutionInstruction.SET_ALL_JOB_TRIGGERS_ERROR);
                            }
                        }
```

我们会把任务封装成JobRunShell线程任务，然后放到线程池中跑动。

qsRsrcs.getThreadPool().runInThread(shell) 的源码是：

```java
    public boolean runInThread(Runnable runnable) {
        if (runnable == null) {
            return false;
        }
        synchronized (nextRunnableLock) {
            handoffPending = true;
            // Wait until a worker thread is available
            while ((availWorkers.size() < 1) && !isShutdown) {
                try {
                    nextRunnableLock.wait(500);
                } catch (InterruptedException ignore) {
                }
            }
            if (!isShutdown) {
                WorkerThread wt = (WorkerThread)availWorkers.removeFirst();
                busyWorkers.add(wt);
                wt.run(runnable);
            } else {
                // If the thread pool is going down, execute the Runnable
                // within a new additional worker thread (no thread from the pool).
                WorkerThread wt = new WorkerThread(this, threadGroup,
                        "WorkerThread-LastJob", prio, isMakeThreadsDaemons(), runnable);
                busyWorkers.add(wt);
                workers.add(wt);
                wt.start();
            }
            nextRunnableLock.notifyAll();
            handoffPending = false;
        }
        return true;
    }
```

这里显示查询有没有空闲的线程，如果没有就等待。有的话，生成一个WorkerThread线程，去跑动

wt.run(runnable);这里的runnable就是JobRunShell。

那么至于JobRunShell里的run方法时怎样的呢？

```java
    public void run() {
        qs.addInternalSchedulerListener(this);
        try {
            OperableTrigger trigger = (OperableTrigger) jec.getTrigger();
            JobDetail jobDetail = jec.getJobDetail();
            do {
                JobExecutionException jobExEx = null;
                Job job = jec.getJobInstance();
                try {
                    begin();
                } catch (SchedulerException se) {
                    qs.notifySchedulerListenersError("Error executing Job ("
                            + jec.getJobDetail().getKey()
                            + ": couldn't begin execution.", se);
                    break;
                }
                // notify job & trigger listeners...
                try {
                    if (!notifyListenersBeginning(jec)) {
                        break;
                    }
                } catch(VetoedException ve) {
                    try {
                        CompletedExecutionInstruction instCode = trigger.executionComplete(jec, null);
                        qs.notifyJobStoreJobVetoed(trigger, jobDetail, instCode);
                        // QTZ-205
                        // Even if trigger got vetoed, we still needs to check to see if it's the trigger's finalized run or not.
                        if (jec.getTrigger().getNextFireTime() == null) {
                            qs.notifySchedulerListenersFinalized(jec.getTrigger());
                        }
                        complete(true);
                    } catch (SchedulerException se) {
                        qs.notifySchedulerListenersError("Error during veto of Job ("
                                + jec.getJobDetail().getKey()
                                + ": couldn't finalize execution.", se);
                    }
                    break;
                }
                long startTime = System.currentTimeMillis();
                long endTime = startTime;
                // execute the job
                try {
                    log.debug("Calling execute on job " + jobDetail.getKey());
                    job.execute(jec);
                    endTime = System.currentTimeMillis();
                } catch (JobExecutionException jee) {
                    endTime = System.currentTimeMillis();
                    jobExEx = jee;
                    getLog().info("Job " + jobDetail.getKey() +
                            " threw a JobExecutionException: ", jobExEx);
                } catch (Throwable e) {
                    endTime = System.currentTimeMillis();
                    getLog().error("Job " + jobDetail.getKey() +
                            " threw an unhandled Exception: ", e);
                    SchedulerException se = new SchedulerException(
                            "Job threw an unhandled exception.", e);
                    qs.notifySchedulerListenersError("Job ("
                            + jec.getJobDetail().getKey()
                            + " threw an exception.", se);
                    jobExEx = new JobExecutionException(se, false);
                }
                jec.setJobRunTime(endTime - startTime);
                // notify all job listeners
                if (!notifyJobListenersComplete(jec, jobExEx)) {
                    break;
                }
                CompletedExecutionInstruction instCode = CompletedExecutionInstruction.NOOP;
                // update the trigger
                try {
                    instCode = trigger.executionComplete(jec, jobExEx);
                } catch (Exception e) {
                    // If this happens, there's a bug in the trigger...
                    SchedulerException se = new SchedulerException(
                            "Trigger threw an unhandled exception.", e);
                    qs.notifySchedulerListenersError(
                            "Please report this error to the Quartz developers.",
                            se);
                }
                // notify all trigger listeners
                if (!notifyTriggerListenersComplete(jec, instCode)) {
                    break;
                }
                // update job/trigger or re-execute job
                if (instCode == CompletedExecutionInstruction.RE_EXECUTE_JOB) {
                    jec.incrementRefireCount();
                    try {
                        complete(false);
                    } catch (SchedulerException se) {
                        qs.notifySchedulerListenersError("Error executing Job ("
                                + jec.getJobDetail().getKey()
                                + ": couldn't finalize execution.", se);
                    }
                    continue;
                }
                try {
                    complete(true);
                } catch (SchedulerException se) {
                    qs.notifySchedulerListenersError("Error executing Job ("
                            + jec.getJobDetail().getKey()
                            + ": couldn't finalize execution.", se);
                    continue;
                }
                qs.notifyJobStoreJobComplete(trigger, jobDetail, instCode);
                break;
            } while (true);
        } finally {
            qs.removeInternalSchedulerListener(this);
        }
    }
```

我们这边就抓住关键点，就是Job job = jec.getJobInstance();

还有job.execute(jec);去执行任务，这样子整个调度执行任务就串联起来啦。
