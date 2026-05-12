# 26、Spring源码分析 - 26-TaskExecutor与TaskScheduler
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/26.html
- 分类：J2EE框架
- 分组：教程目录
上一篇文章[《Spring异步实现原理》](https://blog.csdn.net/shenchaohao12321/article/details/85635987)中提到执行异步方法使用了AsyncTaskExecutor，这篇就讲解一下TaskExecutor的实现类原理。

## 1、TaskExecutor概述

Executors是JDK线程池概念的名字。“executor”命名是由于它并不能保证底层实现实际上是一个池。一个executor可能是单线程的,甚至是同步的。Spring的抽象隐藏了实现细节。Spring的TaskExecutor接口和java.util.concurrent.Executor接口是相同的。事实上,其主要原因是最初需要Java 5才能使用线程池。

```java
@FunctionalInterface
public interface TaskExecutor extends Executor {
   @Override
   void execute(Runnable task);
}
```

TaskExecutor最初给其他组件创建一个抽象的线程池。组件如ApplicationEventMulticaster、JMS的AbstractMessageListenerContainer、Quartz集成所有使用TaskExecutor抽象池线程。但是,如果您的bean需要线程池的行为,你也可以使用这种抽象为自己的需求。

## 2、TaskExecutor的类型

Spring包含许多TaskExecutor的实现。在大多数情况下你不应该需要实现自己的。Spring提供的类型如下:

### 2.1、SyncTaskExecutor

这个实现不会异步执行。相反，每次调用都在发起调用的线程中执行。它的主要用处是在不需要多线程的时候，比如简单的test case。

```java
public class SyncTaskExecutor implements TaskExecutor, Serializable {
   @Override
   public void execute(Runnable task) {
      Assert.notNull(task, "Runnable must not be null");
      task.run();
   }
}
```

### 2.2、SimpleAsyncTaskExecutor

这个实现不重用任何线程，或者说它每次调用都启动一个新线程。但是，它还是支持对并发总数设限，当超过线程并发总数限制时，阻塞新的调用，直到有位置被释放。

AsyncTaskExecutor扩展了TaskExecutor接口，提供了可用于异步执行任务的方法，并且提供了一个支持startTimeout参数的execute重载方法。

```java
public interface AsyncTaskExecutor extends TaskExecutor {
   /** Constant that indicates immediate execution. */
   long TIMEOUT_IMMEDIATE = 0;
   /** Constant that indicates no time limit. */
   long TIMEOUT_INDEFINITE = Long.MAX_VALUE;
   void execute(Runnable task, long startTimeout);
   Future<?> submit(Runnable task);
   <T> Future<T> submit(Callable<T> task);
}
```

AsyncListenableTaskExecutor又扩展了AsyncTaskExecutor，添加了可以返回ListenableFuture的方法，ListenableFuture是Future子接口，可用于在任务提交后添加回调。

```java
public interface AsyncListenableTaskExecutor extends AsyncTaskExecutor {
   ListenableFuture<?> submitListenable(Runnable task);
   <T> ListenableFuture<T> submitListenable(Callable<T> task);
}
public interface ListenableFuture<T> extends Future<T> {
   void addCallback(ListenableFutureCallback<? super T> callback);
   void addCallback(SuccessCallback<? super T> successCallback, FailureCallback failureCallback);
   default CompletableFuture<T> completable() {
      CompletableFuture<T> completable = new DelegatingCompletableFuture<>(this);
      addCallback(completable::complete, completable::completeExceptionally);
      return completable;
   }
}
```

```java
public class SimpleAsyncTaskExecutor extends CustomizableThreadCreator
      implements AsyncListenableTaskExecutor, Serializable {
   //无限并发
   public static final int UNBOUNDED_CONCURRENCY = ConcurrencyThrottleSupport.UNBOUNDED_CONCURRENCY;
   //无并发
   public static final int NO_CONCURRENCY = ConcurrencyThrottleSupport.NO_CONCURRENCY;
   /** Internal concurrency throttle used by this executor. */
   //用于限流
   private final ConcurrencyThrottleAdapter concurrencyThrottle = new ConcurrencyThrottleAdapter();
   @Nullable
   private ThreadFactory threadFactory;
   @Nullable
   private TaskDecorator taskDecorator;
   public SimpleAsyncTaskExecutor() {
      super();
   }
   //设置线程名前缀
   public SimpleAsyncTaskExecutor(String threadNamePrefix) {
      super(threadNamePrefix);
   }
   //指定要使用外部工厂用于创建新线程
   public SimpleAsyncTaskExecutor(ThreadFactory threadFactory) {
      this.threadFactory = threadFactory;
   }
   //指定要使用外部工厂用于创建新线程
   public void setThreadFactory(@Nullable ThreadFactory threadFactory) {
      this.threadFactory = threadFactory;
   }
   //返回创建执行任务的线程工厂
   @Nullable
   public final ThreadFactory getThreadFactory() {
      return this.threadFactory;
   }
   //主要用于设置一些任务的执行上下文调用,或提供一些监控/统计任务执行。
   public final void setTaskDecorator(TaskDecorator taskDecorator) {
      this.taskDecorator = taskDecorator;
   }
   //设置最大并发数。-1表示没有并发限制。原则上,这个限制可以在运行时改变,尽管它通常被设计成一个配置。
   //注意:不要切换-1和任何具体并发限制在运行时,这将导致不一致的并发数:-1有效的限制完全关闭的并发数。
   public void setConcurrencyLimit(int concurrencyLimit) {
      this.concurrencyThrottle.setConcurrencyLimit(concurrencyLimit);
   }
   //允许的最大并发数
   public final int getConcurrencyLimit() {
      return this.concurrencyThrottle.getConcurrencyLimit();
   }
   //是否开启了限流功能，concurrencyLimit>0返回true
   public final boolean isThrottleActive() {
      return this.concurrencyThrottle.isThrottleActive();
   }
```

在了解执行任务之前先了解一下限流器，因为任务开始和结束的时候会分别调用限流器的beforeAccess()和afterAccess()方法。

```java
//因为父类是abstract的
private static class ConcurrencyThrottleAdapter extends ConcurrencyThrottleSupport {
   @Override
   protected void beforeAccess() {
      super.beforeAccess();
   }
   @Override
   protected void afterAccess() {
      super.afterAccess();
   }
}
```

```java
//任务执行之前被调用
protected void beforeAccess() {
   //无并发的情况不需要限流
   if (this.concurrencyLimit == NO_CONCURRENCY) {
      throw new IllegalStateException(
            "Currently no invocations allowed - concurrency limit set to NO_CONCURRENCY");
   }
   //正数代表设置了并发度，需要限流
   if (this.concurrencyLimit > 0) {
      boolean debug = logger.isDebugEnabled();
      synchronized (this.monitor) {
         boolean interrupted = false;
         //如果当前并发度大于等于并发限制则阻塞等待，直到afterAccess()方法执行唤醒
         while (this.concurrencyCount >= this.concurrencyLimit) {
            if (interrupted) {
               throw new IllegalStateException("Thread was interrupted while waiting for invocation access, " +
                     "but concurrency limit still does not allow for entering");
            }
            if (debug) {
               logger.debug("Concurrency count " + this.concurrencyCount +
                     " has reached limit " + this.concurrencyLimit + " - blocking");
            }
            try {
               this.monitor.wait();
            }
            catch (InterruptedException ex) {
               // Re-interrupt current thread, to allow other threads to react.
               Thread.currentThread().interrupt();
               interrupted = true;
            }
         }
         if (debug) {
            logger.debug("Entering throttle at concurrency count " + this.concurrencyCount);
         }
         //执行一个任务将当前并发度加1
         this.concurrencyCount++;
      }
   }
}
//此方法在任务执行完成后被调用
protected void afterAccess() {
   if (this.concurrencyLimit >= 0) {
      synchronized (this.monitor) {
         //让出资源
         this.concurrencyCount--;
         if (logger.isDebugEnabled()) {
            logger.debug("Returning from throttle at concurrency count " + this.concurrencyCount);
         }
         //唤醒正在等待的线程
         this.monitor.notify();
      }
   }
}
```

知道了限流器的工作机制，下面来看看SimpleAsyncTaskExecutor对接口AsyncListenableTaskExecutor的具体实现。

```java
@Override
public void execute(Runnable task) {
   //Long.MAX_VALUE
   execute(task, TIMEOUT_INDEFINITE);
}
@Override
public void execute(Runnable task, long startTimeout) {
   Assert.notNull(task, "Runnable must not be null");
   Runnable taskToUse = (this.taskDecorator != null ? this.taskDecorator.decorate(task) : task);
   //对于SimpleAsyncTaskExecutor startTimeout>0都一样，会使用限流器
   if (isThrottleActive() && startTimeout > TIMEOUT_IMMEDIATE) {
      //并发度达到阈值则会处于阻塞等待
      this.concurrencyThrottle.beforeAccess();
      //ConcurrencyThrottlingRunnable会简单包装原Runnable，在原Runnable执行后调用限流器的afterAccess()方法
      doExecute(new ConcurrencyThrottlingRunnable(taskToUse));
   }
   else {
      doExecute(taskToUse);
   }
}
@Override
public Future<?> submit(Runnable task) {
   FutureTask<Object> future = new FutureTask<>(task, null);
   execute(future, TIMEOUT_INDEFINITE);
   return future;
}
@Override
public <T> Future<T> submit(Callable<T> task) {
   FutureTask<T> future = new FutureTask<>(task);
   execute(future, TIMEOUT_INDEFINITE);
   return future;
}
@Override
public ListenableFuture<?> submitListenable(Runnable task) {
   ListenableFutureTask<Object> future = new ListenableFutureTask<>(task, null);
   execute(future, TIMEOUT_INDEFINITE);
   return future;
}
@Override
public <T> ListenableFuture<T> submitListenable(Callable<T> task) {
   ListenableFutureTask<T> future = new ListenableFutureTask<>(task);
   execute(future, TIMEOUT_INDEFINITE);
   return future;
}
//为每个task分配单独的线程
protected void doExecute(Runnable task) {
   Thread thread = (this.threadFactory != null ? this.threadFactory.newThread(task) : createThread(task));
   thread.start();
}
```

### 2.3、ConcurrentTaskExecutor

这个实现是一个java.util.concurrent.Executor适配器实例。有一个替代(ThreadPoolTaskExecutor)暴露一个Executor作为它的配置参数。很少有需要直接使用ConcurrentTaskExecutor。然而,如果ThreadPoolTaskExecutor不够灵活对于您的需要ConcurrentTaskExecutor是一个选择。

ConcurrentTaskExecutor和`SimpleAsyncTaskExecutor一样实现了`AsyncListenableTaskExecutor接口，并多实现了一个接口是SchedulingTaskExecutor，这个接口只有一个方法，表示这个SchedulingTaskExecutor实例是否更适合短任务。

```java
public interface SchedulingTaskExecutor extends AsyncTaskExecutor {
   default boolean prefersShortLivedTasks() {
      return true;
   }
}
```

```java
public class ConcurrentTaskExecutor implements AsyncListenableTaskExecutor, SchedulingTaskExecutor {
   @Nullable
   private static Class<?> managedExecutorServiceClass;
   static {
      try {
         managedExecutorServiceClass = ClassUtils.forName(
               "javax.enterprise.concurrent.ManagedExecutorService",
               ConcurrentTaskScheduler.class.getClassLoader());
      }
      catch (ClassNotFoundException ex) {
         // JSR-236 API not available...
         managedExecutorServiceClass = null;
      }
   }
   private Executor concurrentExecutor;
   private TaskExecutorAdapter adaptedExecutor;
   //默认构造器，使用一个单线程处理排队的任务
   public ConcurrentTaskExecutor() {
      this.concurrentExecutor = Executors.newSingleThreadExecutor();
      //TaskExecutorAdapter是一个适配器模式实现了AsyncListenableTaskExecutor接口，
      //间接让concurrentExecutor有了AsyncListenableTaskExecutor的功能
      this.adaptedExecutor = new TaskExecutorAdapter(this.concurrentExecutor);
   }
   //使用外部传入的Executor,可以做丰富的配置
   public ConcurrentTaskExecutor(@Nullable Executor executor) {
      this.concurrentExecutor = (executor != null ? executor : Executors.newSingleThreadExecutor());
      this.adaptedExecutor = getAdaptedExecutor(this.concurrentExecutor);
   }
   public final void setConcurrentExecutor(@Nullable Executor executor) {
      this.concurrentExecutor = (executor != null ? executor : Executors.newSingleThreadExecutor());
      this.adaptedExecutor = getAdaptedExecutor(this.concurrentExecutor);
   }
   public final Executor getConcurrentExecutor() {
      return this.concurrentExecutor;
   }
   public final void setTaskDecorator(TaskDecorator taskDecorator) {
      this.adaptedExecutor.setTaskDecorator(taskDecorator);
   }
   @Override
   public void execute(Runnable task) {
      this.adaptedExecutor.execute(task);
   }
   @Override
   public void execute(Runnable task, long startTimeout) {
      this.adaptedExecutor.execute(task, startTimeout);
   }
   @Override
   public Future<?> submit(Runnable task) {
      return this.adaptedExecutor.submit(task);
   }
   @Override
   public <T> Future<T> submit(Callable<T> task) {
      return this.adaptedExecutor.submit(task);
   }
   @Override
   public ListenableFuture<?> submitListenable(Runnable task) {
      return this.adaptedExecutor.submitListenable(task);
   }
   @Override
   public <T> ListenableFuture<T> submitListenable(Callable<T> task) {
      return this.adaptedExecutor.submitListenable(task);
   }
   private static TaskExecutorAdapter getAdaptedExecutor(Executor concurrentExecutor) {
      if (managedExecutorServiceClass != null && managedExecutorServiceClass.isInstance(concurrentExecutor)) {
         return new ManagedTaskExecutorAdapter(concurrentExecutor);
      }
      return new TaskExecutorAdapter(concurrentExecutor);
   }
   /**
    * TaskExecutorAdapter subclass that wraps all provided Runnables and Callables
    * with a JSR-236 ManagedTask, exposing a long-running hint based on
    * {@link SchedulingAwareRunnable} and an identity name based on the task's
    * {@code toString()} representation.
    */
   private static class ManagedTaskExecutorAdapter extends TaskExecutorAdapter {
      public ManagedTaskExecutorAdapter(Executor concurrentExecutor) {
         super(concurrentExecutor);
      }
      @Override
      public void execute(Runnable task) {
         super.execute(ManagedTaskBuilder.buildManagedTask(task, task.toString()));
      }
      @Override
      public Future<?> submit(Runnable task) {
         return super.submit(ManagedTaskBuilder.buildManagedTask(task, task.toString()));
      }
      @Override
      public <T> Future<T> submit(Callable<T> task) {
         return super.submit(ManagedTaskBuilder.buildManagedTask(task, task.toString()));
      }
      @Override
      public ListenableFuture<?> submitListenable(Runnable task) {
         return super.submitListenable(ManagedTaskBuilder.buildManagedTask(task, task.toString()));
      }
      @Override
      public <T> ListenableFuture<T> submitListenable(Callable<T> task) {
         return super.submitListenable(ManagedTaskBuilder.buildManagedTask(task, task.toString()));
      }
   }
   /**
    * Delegate that wraps a given Runnable/Callable  with a JSR-236 ManagedTask,
    * exposing a long-running hint based on {@link SchedulingAwareRunnable}
    * and a given identity name.
    */
   protected static class ManagedTaskBuilder {
      public static Runnable buildManagedTask(Runnable task, String identityName) {
         Map<String, String> properties;
         if (task instanceof SchedulingAwareRunnable) {
            properties = new HashMap<>(4);
            properties.put(ManagedTask.LONGRUNNING_HINT,
                  Boolean.toString(((SchedulingAwareRunnable) task).isLongLived()));
         }
         else {
            properties = new HashMap<>(2);
         }
         properties.put(ManagedTask.IDENTITY_NAME, identityName);
         return ManagedExecutors.managedTask(task, properties, null);
      }
      public static <T> Callable<T> buildManagedTask(Callable<T> task, String identityName) {
         Map<String, String> properties = new HashMap<>(2);
         properties.put(ManagedTask.IDENTITY_NAME, identityName);
         return ManagedExecutors.managedTask(task, properties, null);
      }
   }
}
```

### 2.4、ThreadPoolTaskExecutor

这个实现是最常用的。它暴露一些bean属性用于配置java.util.concurrent.ThreadPoolExecutor并且包装成一个`TaskExecutor`。如果你需要适配不同类型的`java.util.concurrent.Executor`,我们建议您使用ConcurrentTaskExecutor代替。

ThreadPoolTaskExecutor提供了很多setter方法用于配置ThreadPoolExecutor，并且继承于ExecutorConfigurationSupport，可以作为一个可配置的bean，会在afterPropertiesSet()方法执行的时候完成ThreadPoolExecutor的初始化。

```java
@Override
public void afterPropertiesSet() {
   initialize();
}
public void initialize() {
   if (logger.isInfoEnabled()) {
      logger.info("Initializing ExecutorService" + (this.beanName != null ? " '" + this.beanName + "'" : ""));
   }
   if (!this.threadNamePrefixSet && this.beanName != null) {
      setThreadNamePrefix(this.beanName + "-");
   }
   //此方法是抽象的，由子类实现，看下面代码ThreadPoolTaskExecutor的实现
   this.executor = initializeExecutor(this.threadFactory, this.rejectedExecutionHandler);
}
```

```java
@Override
protected ExecutorService initializeExecutor(
      ThreadFactory threadFactory, RejectedExecutionHandler rejectedExecutionHandler) {
   //queueCapacity默认Integer.MAX_VALUE
   BlockingQueue<Runnable> queue = createQueue(this.queueCapacity);
   ThreadPoolExecutor executor;
   if (this.taskDecorator != null) {
      executor = new ThreadPoolExecutor(
            this.corePoolSize, this.maxPoolSize, this.keepAliveSeconds, TimeUnit.SECONDS,
            queue, threadFactory, rejectedExecutionHandler) {
         @Override
         public void execute(Runnable command) {
            Runnable decorated = taskDecorator.decorate(command);
            if (decorated != command) {
               decoratedTaskMap.put(decorated, command);
            }
            super.execute(decorated);
         }
      };
   }
   else {
      executor = new ThreadPoolExecutor(
            this.corePoolSize, this.maxPoolSize, this.keepAliveSeconds, TimeUnit.SECONDS,
            queue, threadFactory, rejectedExecutionHandler);
   }
   if (this.allowCoreThreadTimeOut) {
      executor.allowCoreThreadTimeOut(true);
   }
   //实现AsyncListenableTaskExecutor接口的方法实际委托的就是这个executor
   this.threadPoolExecutor = executor;
   return executor;
}
protected BlockingQueue<Runnable> createQueue(int queueCapacity) {
   if (queueCapacity > 0) {
      return new LinkedBlockingQueue<>(queueCapacity);
   }
   else {
      return new SynchronousQueue<>();
   }
}
```

### 2.4、WorkManagerTaskExecutor

`这个实现使用CommonJ WorkManager作为其底层实现的服务提供。`是在Spring context中配置CommonJ WorkManager应用的最重要的类，是一个方便的类基于`CommonJ-based线程池集成在WebLogic或WebSphere在Spring应用程序上下文。`

### 2.5、DefaultManagedTaskExecutor

这个实现使用JNDI获取一个ManagedExecutorService在JSR-236兼容的运行时环境中(如Java EE 7 +应用服务器),用于替代`WorkManagerTaskExecutor。`

## 3、TaskScheduler概述

除了TaskExecutor抽象,Spring 3.0引入了一个带有调度将来的某个时候任务运行的各种方法的接口TaskScheduler。

```java
public interface TaskScheduler {
   @Nullable
   ScheduledFuture<?> schedule(Runnable task, Trigger trigger);
   default ScheduledFuture<?> schedule(Runnable task, Instant startTime) {
      return schedule(task, Date.from(startTime));
   }
   ScheduledFuture<?> schedule(Runnable task, Date startTime);
   default ScheduledFuture<?> scheduleAtFixedRate(Runnable task, Instant startTime, Duration period) {
      return scheduleAtFixedRate(task, Date.from(startTime), period.toMillis());
   }
   ScheduledFuture<?> scheduleAtFixedRate(Runnable task, Date startTime, long period);
   default ScheduledFuture<?> scheduleAtFixedRate(Runnable task, Duration period) {
      return scheduleAtFixedRate(task, period.toMillis());
   }
   ScheduledFuture<?> scheduleAtFixedRate(Runnable task, long period);
   default ScheduledFuture<?> scheduleWithFixedDelay(Runnable task, Instant startTime, Duration delay) {
      return scheduleWithFixedDelay(task, Date.from(startTime), delay.toMillis());
   }
   ScheduledFuture<?> scheduleWithFixedDelay(Runnable task, Date startTime, long delay);
   default ScheduledFuture<?> scheduleWithFixedDelay(Runnable task, Duration delay) {
      return scheduleWithFixedDelay(task, delay.toMillis());
   }
   ScheduledFuture<?> scheduleWithFixedDelay(Runnable task, long delay);
}
```

最简单的方法是ScheduledFuture schedule(Runnable task, Date startTime)。会让任务在指定的时间运行一次。所有其他的方法能够调度任务重复运行。固定频率和固定延迟方法对于那些定期执行的任务是简单的,但方法接受一个Trigger将调度变得灵活得多。

## 4、Trigger接口

触发器的基本思想是方法的执行时间可能根据过去的执行结果或者是任意确定的条件。

```java
public interface Trigger {
   //返回下一次执行的时间
   @Nullable
   Date nextExecutionTime(TriggerContext triggerContext);
}
```

TriggerContext是最重要的部分。它封装了所有的相关数据,如果有必要在将来会对扩展开放。TriggerContext是一个接口(SimpleTriggerContext实现默认情况下使用)。

```java
public interface TriggerContext {
   //返回上一次计划执行的时间，null代表还没执行过
   @Nullable
   Date lastScheduledExecutionTime();
   //上一次真正执行的时间
   @Nullable
   Date lastActualExecutionTime();
   //上一次完成的时间
   @Nullable
   Date lastCompletionTime();
}
public class SimpleTriggerContext implements TriggerContext {
   @Nullable
   private volatile Date lastScheduledExecutionTime;
   @Nullable
   private volatile Date lastActualExecutionTime;
   @Nullable
   private volatile Date lastCompletionTime;
   public SimpleTriggerContext() {
   }
   public SimpleTriggerContext(Date lastScheduledExecutionTime, Date lastActualExecutionTime, Date lastCompletionTime) {
      this.lastScheduledExecutionTime = lastScheduledExecutionTime;
      this.lastActualExecutionTime = lastActualExecutionTime;
      this.lastCompletionTime = lastCompletionTime;
   }
   public void update(Date lastScheduledExecutionTime, Date lastActualExecutionTime, Date lastCompletionTime) {
      this.lastScheduledExecutionTime = lastScheduledExecutionTime;
      this.lastActualExecutionTime = lastActualExecutionTime;
      this.lastCompletionTime = lastCompletionTime;
   }
   @Override
   @Nullable
   public Date lastScheduledExecutionTime() {
      return this.lastScheduledExecutionTime;
   }
   @Override
   @Nullable
   public Date lastActualExecutionTime() {
      return this.lastActualExecutionTime;
   }
   @Override
   @Nullable
   public Date lastCompletionTime() {
      return this.lastCompletionTime;
   }
}
```

## 5、Trigger的实现

Spring提供了触发接口的两个实现。最有趣的一个是CronTrigger。它支持基于cron调度任务的表达式。另一个实现PeriodicTrigger接受一个固定的时期,一个可选的初始延迟值,和一个布尔值来指示是否应被视为一个固定利率或固定的延迟。因为TaskScheduler接口已经定义了方法调度任务在一个固定利率或与一个固定的延迟,这些方法应该尽可能直接使用。PeriodicTrigger价值体现是您可以使用这个依赖于Trigger抽象接口的组件。例如,它可以方便的让周期性触发,基于cron的触发器,甚至自定义触发器实现交替使用。这样的组件可以利用这样的依赖注入,这样您可以配置外部触发,因此,很容易地修改或扩展。

### 5.1、CronTrigger

CronTrigger实现nextExecutionTime()方法是委托给了一个CronSequenceGenerator对象，这个对象接收此触发器上次执行的时间，然后返回下一次任务计划执行的时间。

```java
public class CronTrigger implements Trigger {
   //解析cron表达式，根据上次执行的时间计算出下一次任务执行的时间
   private final CronSequenceGenerator sequenceGenerator;
   public CronTrigger(String expression) {
      this.sequenceGenerator = new CronSequenceGenerator(expression);
   }
   public CronTrigger(String expression, TimeZone timeZone) {
      this.sequenceGenerator = new CronSequenceGenerator(expression, timeZone);
   }
   public String getExpression() {
      return this.sequenceGenerator.getExpression();
   }
   @Override
   public Date nextExecutionTime(TriggerContext triggerContext) {
      Date date = triggerContext.lastCompletionTime();
      if (date != null) {
         Date scheduled = triggerContext.lastScheduledExecutionTime();
         if (scheduled != null && date.before(scheduled)) {
            // Previous task apparently executed too early...
            // Let's simply use the last calculated execution time then,
            // in order to prevent accidental re-fires in the same second.
            date = scheduled;
         }
      }
      else {
         date = new Date();
      }
      return this.sequenceGenerator.next(date);
   }
   @Override
   public boolean equals(Object other) {
      return (this == other || (other instanceof CronTrigger &&
            this.sequenceGenerator.equals(((CronTrigger) other).sequenceGenerator)));
   }
   @Override
   public int hashCode() {
      return this.sequenceGenerator.hashCode();
   }
   @Override
   public String toString() {
      return this.sequenceGenerator.toString();
   }
}
```

### 5.2、PeriodicTrigger

```java
public class PeriodicTrigger implements Trigger {
   private final long period;
   private final TimeUnit timeUnit;
   private volatile long initialDelay = 0;
   private volatile boolean fixedRate = false;
   public PeriodicTrigger(long period) {
      this(period, null);
   }
   public PeriodicTrigger(long period, @Nullable TimeUnit timeUnit) {
      Assert.isTrue(period >= 0, "period must not be negative");
      this.timeUnit = (timeUnit != null ? timeUnit : TimeUnit.MILLISECONDS);
      this.period = this.timeUnit.toMillis(period);
   }
   public long getPeriod() {
      return this.period;
   }
   public TimeUnit getTimeUnit() {
      return this.timeUnit;
   }
   public void setInitialDelay(long initialDelay) {
      this.initialDelay = this.timeUnit.toMillis(initialDelay);
   }
   public long getInitialDelay() {
      return this.initialDelay;
   }
   public void setFixedRate(boolean fixedRate) {
      this.fixedRate = fixedRate;
   }
   public boolean isFixedRate() {
      return this.fixedRate;
   }
   @Override
   public Date nextExecutionTime(TriggerContext triggerContext) {
      Date lastExecution = triggerContext.lastScheduledExecutionTime();
      Date lastCompletion = triggerContext.lastCompletionTime();
      if (lastExecution == null || lastCompletion == null) {
         return new Date(System.currentTimeMillis() + this.initialDelay);
      }
      if (this.fixedRate) {
         return new Date(lastExecution.getTime() + this.period);
      }
      return new Date(lastCompletion.getTime() + this.period);
   }
}
```

## 6、TaskScheduler的实现

### 6.1、ConcurrentTaskScheduler

和`ConcurrentTaskExecutor类似，并且也继承于ConcurrentTaskExecutor。构造器中会调用父类的构造器完成实现`TaskExecutor接口的一些初始化，参考`ConcurrentTaskExecutor。然后调用私有方法`initScheduledExecutor()返回一个ScheduledExecutorService对象`用于实现`TaskScheduler接口方法的执行者。

```java
public ConcurrentTaskScheduler() {
   super();
   this.scheduledExecutor = initScheduledExecutor(null);
}
public ConcurrentTaskScheduler(ScheduledExecutorService scheduledExecutor) {
   super(scheduledExecutor);
   this.scheduledExecutor = initScheduledExecutor(scheduledExecutor);
}
public ConcurrentTaskScheduler(Executor concurrentExecutor, ScheduledExecutorService scheduledExecutor) {
   super(concurrentExecutor);
   this.scheduledExecutor = initScheduledExecutor(scheduledExecutor);
}
private ScheduledExecutorService initScheduledExecutor(@Nullable ScheduledExecutorService scheduledExecutor) {
   if (scheduledExecutor != null) {
      this.scheduledExecutor = scheduledExecutor;
      this.enterpriseConcurrentScheduler = (managedScheduledExecutorServiceClass != null &&
            managedScheduledExecutorServiceClass.isInstance(scheduledExecutor));
   }
   else {
      this.scheduledExecutor = Executors.newSingleThreadScheduledExecutor();
      this.enterpriseConcurrentScheduler = false;
   }
   return this.scheduledExecutor;
}
```

下面是带有Trigger参数schedule()方法的实现。

```java
@Override
@Nullable
public ScheduledFuture<?> schedule(Runnable task, Trigger trigger) {
   try {
      if (this.enterpriseConcurrentScheduler) {
         return new EnterpriseConcurrentTriggerScheduler().schedule(decorateTask(task, true), trigger);
      }
      else {
         //默认打印日志
         ErrorHandler errorHandler =
               (this.errorHandler != null ? this.errorHandler : TaskUtils.getDefaultErrorHandler(true));
         return new ReschedulingRunnable(task, trigger, this.scheduledExecutor, errorHandler).schedule();
      }
   }
   catch (RejectedExecutionException ex) {
      throw new TaskRejectedException("Executor [" + this.scheduledExecutor + "] did not accept task: " + task, ex);
   }
}
```

schedule()方法创建了一个持有代表人物的Runnable对象和触发器Trigger的ReschedulingRunnable对象，然后调用它的schedule()方法完成任务的调度，可以看到对schedule()方法的实现就是调用了ConcurrentTaskScheduler构造器创建的ScheduledExecutorService对象。

```java
class ReschedulingRunnable extends DelegatingErrorHandlingRunnable implements ScheduledFuture<Object> {
   private final Trigger trigger;
   private final SimpleTriggerContext triggerContext = new SimpleTriggerContext();
   private final ScheduledExecutorService executor;
   @Nullable
   private ScheduledFuture<?> currentFuture;
   @Nullable
   private Date scheduledExecutionTime;
   private final Object triggerContextMonitor = new Object();
   public ReschedulingRunnable(
         Runnable delegate, Trigger trigger, ScheduledExecutorService executor, ErrorHandler errorHandler) {
      super(delegate, errorHandler);
      this.trigger = trigger;
      this.executor = executor;
   }
   @Nullable
   public ScheduledFuture<?> schedule() {
      synchronized (this.triggerContextMonitor) {
         this.scheduledExecutionTime = this.trigger.nextExecutionTime(this.triggerContext);
         if (this.scheduledExecutionTime == null) {
            return null;
         }
         long initialDelay = this.scheduledExecutionTime.getTime() - System.currentTimeMillis();
         this.currentFuture = this.executor.schedule(this, initialDelay, TimeUnit.MILLISECONDS);
         return this;
      }
   }
   private ScheduledFuture<?> obtainCurrentFuture() {
      Assert.state(this.currentFuture != null, "No scheduled future");
      return this.currentFuture;
   }
   @Override
   public void run() {
      Date actualExecutionTime = new Date();
      super.run();
      Date completionTime = new Date();
      synchronized (this.triggerContextMonitor) {
         Assert.state(this.scheduledExecutionTime != null, "No scheduled execution");
         this.triggerContext.update(this.scheduledExecutionTime, actualExecutionTime, completionTime);
         if (!obtainCurrentFuture().isCancelled()) {
            schedule();
         }
      }
   }
   @Override
   public boolean cancel(boolean mayInterruptIfRunning) {
      synchronized (this.triggerContextMonitor) {
         return obtainCurrentFuture().cancel(mayInterruptIfRunning);
      }
   }
   @Override
   public boolean isCancelled() {
      synchronized (this.triggerContextMonitor) {
         return obtainCurrentFuture().isCancelled();
      }
   }
   @Override
   public boolean isDone() {
      synchronized (this.triggerContextMonitor) {
         return obtainCurrentFuture().isDone();
      }
   }
   @Override
   public Object get() throws InterruptedException, ExecutionException {
      ScheduledFuture<?> curr;
      synchronized (this.triggerContextMonitor) {
         curr = obtainCurrentFuture();
      }
      return curr.get();
   }
   @Override
   public Object get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException {
      ScheduledFuture<?> curr;
      synchronized (this.triggerContextMonitor) {
         curr = obtainCurrentFuture();
      }
      return curr.get(timeout, unit);
   }
   @Override
   public long getDelay(TimeUnit unit) {
      ScheduledFuture<?> curr;
      synchronized (this.triggerContextMonitor) {
         curr = obtainCurrentFuture();
      }
      return curr.getDelay(unit);
   }
   @Override
   public int compareTo(Delayed other) {
      if (this == other) {
         return 0;
      }
      long diff = getDelay(TimeUnit.MILLISECONDS) - other.getDelay(TimeUnit.MILLISECONDS);
      return (diff == 0 ? 0 : ((diff < 0)? -1 : 1));
   }
}
```

在schedule()方法中会使用Trigger获取上一次执行的时间，然后和当前时间的差值作为延迟时间传入ScheduledExecutorService的schedule()方法中，此方法还需要一个Runnable，ReschedulingRunnable实现了Runnable接口，可以看到run()方法中每当任务的run()方法执行完成后会更新triggerContext的属性，已被为下次调用时计算延迟时间。然后判断如果没有取消任务会在一次调用schedule()方法满足任务的持续性。

### 6.2、ThreadPoolTaskScheduler

ThreadPoolTaskScheduler和ThreadPoolTaskExecutor类似，提供了对本bean的配置方法用来自定义一些参数配置ScheduledExecutorService。底层还是依赖ScheduledExecutorService对象实现TaskScheduler的接口方法。
