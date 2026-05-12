# 27、Spring源码分析 - 27-基于注解@Scheduled定时任务实现
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/27.html
- 分类：J2EE框架
- 分组：教程目录
## 1、概述

@EnableScheduling启用Spring的定时任务功能，这允许检测容器中@Scheduled注释的bean。执行定时任务还需要一个调度器TaskScheduler，默认情况下，将在容器中搜索一个关联的scheduler定义：要么是一个唯一的TaskScheduler类型的bean，要么是一个bean name是taskScheduler的TaskScheduler。这两种查找的都是。ScheduledExecutorService。如果这两种查找方式都没有，则默认使用一个单线程的调度器。实现SchedulingConfigurer}允许细粒度通过ScheduledTaskRegistrar控制任务注册。

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SchedulingConfiguration.class)
@Documented
public @interface EnableScheduling {}
@Configuration
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class SchedulingConfiguration {
   //bean name=org.springframework.context.annotation.internalScheduledAnnotationProcessor
   @Bean(name = TaskManagementConfigUtils.SCHEDULED_ANNOTATION_PROCESSOR_BEAN_NAME)
   @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
   public ScheduledAnnotationBeanPostProcessor scheduledAnnotationProcessor() {
      return new ScheduledAnnotationBeanPostProcessor();
   }
}
```

## 2、寻找定时任务方法

ScheduledAnnotationBeanPostProcessor会查找任何带有@Scheduled的方法。

```java
@Override
public Object postProcessAfterInitialization(Object bean, String beanName) {
   if (bean instanceof AopInfrastructureBean || bean instanceof TaskScheduler ||
         bean instanceof ScheduledExecutorService) {
      // Ignore AOP infrastructure such as scoped proxies.
      return bean;
   }
   Class<?> targetClass = AopProxyUtils.ultimateTargetClass(bean);
   if (!this.nonAnnotatedClasses.contains(targetClass)) {
      //找出所有的@Scheduled方法
      Map<Method, Set<Scheduled>> annotatedMethods = MethodIntrospector.selectMethods(targetClass,
            (MethodIntrospector.MetadataLookup<Set<Scheduled>>) method -> {
               Set<Scheduled> scheduledMethods = AnnotatedElementUtils.getMergedRepeatableAnnotations(
                     method, Scheduled.class, Schedules.class);
               return (!scheduledMethods.isEmpty() ? scheduledMethods : null);
            });
      if (annotatedMethods.isEmpty()) {
         this.nonAnnotatedClasses.add(targetClass);
         if (logger.isTraceEnabled()) {
            logger.trace("No @Scheduled annotations found on bean class: " + targetClass);
         }
      }
      else {
         // Non-empty set of methods
         annotatedMethods.forEach((method, scheduledMethods) ->
               //将每个@Scheduled方法转换成一个Task对象注册到ScheduledTaskRegistrar中
               scheduledMethods.forEach(scheduled -> processScheduled(scheduled, method, bean)));
         if (logger.isTraceEnabled()) {
            logger.trace(annotatedMethods.size() + " @Scheduled methods processed on bean '" + beanName +
                  "': " + annotatedMethods);
         }
      }
   }
   return bean;
}
```

上面代码调用processScheduled()方法将@Schedule方法注册一个ScheduledTaskRegistrar对象中，在分析具体如何注册之前先看看ScheduledTaskRegistrar的机构。

```java
public class ScheduledTaskRegistrar implements ScheduledTaskHolder, InitializingBean, DisposableBean {
   //负责执行任务
   @Nullable
   private TaskScheduler taskScheduler;
   //没有设置taskScheduler默认使用Executors.newSingleThreadScheduledExecutor()
   @Nullable
   private ScheduledExecutorService localExecutor;
   //@Scheduled方法默认不会进入这个容器，但是可自己添加
   @Nullable
   private List<TriggerTask> triggerTasks;
   //检测到CronTask类型的任务
   @Nullable
   private List<CronTask> cronTasks;
   //检测到FixedRateTask类型的任务
   @Nullable
   private List<IntervalTask> fixedRateTasks;
   //检测到FixedDelayTask类型的任务
   @Nullable
   private List<IntervalTask> fixedDelayTasks;
   //还未触发的任务
   private final Map<Task, ScheduledTask> unresolvedTasks = new HashMap<>(16);
   //已触发过的任务
   private final Set<ScheduledTask> scheduledTasks = new LinkedHashSet<>(16);
}
```

以上就是不同类型任务会放入不同的容器中，等到任务触发的时候从容器中取出。

```java
protected void processScheduled(Scheduled scheduled, Method method, Object bean) {
   try {
      Runnable runnable = createRunnable(bean, method);
      boolean processedSchedule = false;
      String errorMessage =
            "Exactly one of the 'cron', 'fixedDelay(String)', or 'fixedRate(String)' attributes is required";
      Set<ScheduledTask> tasks = new LinkedHashSet<>(4);
      // Determine initial delay
      long initialDelay = scheduled.initialDelay();
      String initialDelayString = scheduled.initialDelayString();
      if (StringUtils.hasText(initialDelayString)) {
         Assert.isTrue(initialDelay < 0, "Specify 'initialDelay' or 'initialDelayString', not both");
         if (this.embeddedValueResolver != null) {
            initialDelayString = this.embeddedValueResolver.resolveStringValue(initialDelayString);
         }
         if (StringUtils.hasLength(initialDelayString)) {
            try {
               initialDelay = parseDelayAsLong(initialDelayString);
            }
            catch (RuntimeException ex) {
               throw new IllegalArgumentException(
                     "Invalid initialDelayString value \"" + initialDelayString + "\" - cannot parse into long");
            }
         }
      }
      // Check cron expression
      String cron = scheduled.cron();
      if (StringUtils.hasText(cron)) {
         String zone = scheduled.zone();
         if (this.embeddedValueResolver != null) {
            cron = this.embeddedValueResolver.resolveStringValue(cron);
            zone = this.embeddedValueResolver.resolveStringValue(zone);
         }
         if (StringUtils.hasLength(cron)) {
            Assert.isTrue(initialDelay == -1, "'initialDelay' not supported for cron triggers");
            processedSchedule = true;
            if (!Scheduled.CRON_DISABLED.equals(cron)) {
               TimeZone timeZone;
               if (StringUtils.hasText(zone)) {
                  timeZone = StringUtils.parseTimeZoneString(zone);
               }
               else {
                  timeZone = TimeZone.getDefault();
               }
               tasks.add(this.registrar.scheduleCronTask(new CronTask(runnable, new CronTrigger(cron, timeZone))));
            }
         }
      }
      // At this point we don't need to differentiate between initial delay set or not anymore
      if (initialDelay < 0) {
         initialDelay = 0;
      }
      // Check fixed delay
      long fixedDelay = scheduled.fixedDelay();
      if (fixedDelay >= 0) {
         Assert.isTrue(!processedSchedule, errorMessage);
         processedSchedule = true;
         tasks.add(this.registrar.scheduleFixedDelayTask(new FixedDelayTask(runnable, fixedDelay, initialDelay)));
      }
      String fixedDelayString = scheduled.fixedDelayString();
      if (StringUtils.hasText(fixedDelayString)) {
         if (this.embeddedValueResolver != null) {
            fixedDelayString = this.embeddedValueResolver.resolveStringValue(fixedDelayString);
         }
         if (StringUtils.hasLength(fixedDelayString)) {
            Assert.isTrue(!processedSchedule, errorMessage);
            processedSchedule = true;
            try {
               fixedDelay = parseDelayAsLong(fixedDelayString);
            }
            catch (RuntimeException ex) {
               throw new IllegalArgumentException(
                     "Invalid fixedDelayString value \"" + fixedDelayString + "\" - cannot parse into long");
            }
            tasks.add(this.registrar.scheduleFixedDelayTask(new FixedDelayTask(runnable, fixedDelay, initialDelay)));
         }
      }
      // Check fixed rate
      long fixedRate = scheduled.fixedRate();
      if (fixedRate >= 0) {
         Assert.isTrue(!processedSchedule, errorMessage);
         processedSchedule = true;
         tasks.add(this.registrar.scheduleFixedRateTask(new FixedRateTask(runnable, fixedRate, initialDelay)));
      }
      String fixedRateString = scheduled.fixedRateString();
      if (StringUtils.hasText(fixedRateString)) {
         if (this.embeddedValueResolver != null) {
            fixedRateString = this.embeddedValueResolver.resolveStringValue(fixedRateString);
         }
         if (StringUtils.hasLength(fixedRateString)) {
            Assert.isTrue(!processedSchedule, errorMessage);
            processedSchedule = true;
            try {
               fixedRate = parseDelayAsLong(fixedRateString);
            }
            catch (RuntimeException ex) {
               throw new IllegalArgumentException(
                     "Invalid fixedRateString value \"" + fixedRateString + "\" - cannot parse into long");
            }
            tasks.add(this.registrar.scheduleFixedRateTask(new FixedRateTask(runnable, fixedRate, initialDelay)));
         }
      }
      // Check whether we had any attribute set
      Assert.isTrue(processedSchedule, errorMessage);
      // Finally register the scheduled tasks
      synchronized (this.scheduledTasks) {
         Set<ScheduledTask> regTasks = this.scheduledTasks.computeIfAbsent(bean, key -> new LinkedHashSet<>(4));
         regTasks.addAll(tasks);
      }
   }
   catch (IllegalArgumentException ex) {
      throw new IllegalStateException(
            "Encountered invalid @Scheduled method '" + method.getName() + "': " + ex.getMessage());
   }
}
```

以上就是不同类型的任务注册，我们拿CronTask举例看其具体注册过程。

```java
@Nullable
public ScheduledTask scheduleCronTask(CronTask task) {
   ScheduledTask scheduledTask = this.unresolvedTasks.remove(task);
   boolean newTask = false;
   if (scheduledTask == null) {
      scheduledTask = new ScheduledTask(task);
      //代表之前未注册过
      newTask = true;
   }
   //如果taskScheduler!=null，直接执行,之前未注册过也不会加入容器中
   if (this.taskScheduler != null) {
      scheduledTask.future = this.taskScheduler.schedule(task.getRunnable(), task.getTrigger());
   }
   else {
      addCronTask(task);
      this.unresolvedTasks.put(task, scheduledTask);
   }
   return (newTask ? scheduledTask : null);
}
```

scheduleCronTask()这个方法有两层含义：注册或执行。在taskScheduler还没有准备好时负责注册任务，什么时候会注册好呢，后面会分析。之所以要兼顾注册和执行，是因为可能有些定时任务bean是在容器完全启动后加入容器中的。

## 3、触发定时任务

有三种方式可以触发任务，一个是上面讲到的在检测@Schedule方法的时候，一个是在afterSingletonsInstantiated()方法执行的时候，一个是在接收到ContextRefreshedEvent事件的时候。其实这三种触发任务的时机最后都是调用上面这个scheduleCronTask()方法，而这个方法真正执行任务又需要scheduler!=null。那么这个scheduler是何时被赋值的呢？

afterSingletonsInstantiated()和onApplicationEvent()方法执行的时候都会调用同一个方法finishRegistration()，这个方法会为registrar设置一个TaskScheduler的。

```java
@Override
public void afterSingletonsInstantiated() {
   // Remove resolved singleton classes from cache
   this.nonAnnotatedClasses.clear();
   if (this.applicationContext == null) {
      // Not running in an ApplicationContext -> register tasks early...
      finishRegistration();
   }
}
@Override
public void onApplicationEvent(ContextRefreshedEvent event) {
   if (event.getApplicationContext() == this.applicationContext) {
      // Running in an ApplicationContext -> register tasks this late...
      // giving other ContextRefreshedEvent listeners a chance to perform
      // their work at the same time (e.g. Spring Batch's job registration).
      finishRegistration();
   }
}
private void finishRegistration() {
   if (this.scheduler != null) {
      this.registrar.setScheduler(this.scheduler);
   }
   if (this.beanFactory instanceof ListableBeanFactory) {
      //这里提供了一个机会可以实现自定义SchedulingConfigurer来配置registrar
      //譬如注册新任务，设置一个TaskScheduler
      Map<String, SchedulingConfigurer> beans =
            ((ListableBeanFactory) this.beanFactory).getBeansOfType(SchedulingConfigurer.class);
      List<SchedulingConfigurer> configurers = new ArrayList<>(beans.values());
      AnnotationAwareOrderComparator.sort(configurers);
      for (SchedulingConfigurer configurer : configurers) {
         configurer.configureTasks(this.registrar);
      }
   }
   //如果已经有任务注册了但是还没有TaskScheduler，则会调用resolveSchedulerBean()方法寻找一个TaskScheduler
   if (this.registrar.hasTasks() && this.registrar.getScheduler() == null) {
      Assert.state(this.beanFactory != null, "BeanFactory must be set to find scheduler by type");
      try {
         // Search for TaskScheduler bean...
         this.registrar.setTaskScheduler(resolveSchedulerBean(this.beanFactory, TaskScheduler.class, false));
      }
      catch (NoUniqueBeanDefinitionException ex) {
         logger.trace("Could not find unique TaskScheduler bean", ex);
         try {
            this.registrar.setTaskScheduler(resolveSchedulerBean(this.beanFactory, TaskScheduler.class, true));
         }
         catch (NoSuchBeanDefinitionException ex2) {
            if (logger.isInfoEnabled()) {
               logger.info("More than one TaskScheduler bean exists within the context, and " +
                     "none is named 'taskScheduler'. Mark one of them as primary or name it 'taskScheduler' " +
                     "(possibly as an alias); or implement the SchedulingConfigurer interface and call " +
                     "ScheduledTaskRegistrar#setScheduler explicitly within the configureTasks() callback: " +
                     ex.getBeanNamesFound());
            }
         }
      }
      catch (NoSuchBeanDefinitionException ex) {
         logger.trace("Could not find default TaskScheduler bean", ex);
         // Search for ScheduledExecutorService bean next...
         try {
            this.registrar.setScheduler(resolveSchedulerBean(this.beanFactory, ScheduledExecutorService.class, false));
         }
         catch (NoUniqueBeanDefinitionException ex2) {
            logger.trace("Could not find unique ScheduledExecutorService bean", ex2);
            try {
               this.registrar.setScheduler(resolveSchedulerBean(this.beanFactory, ScheduledExecutorService.class, true));
            }
            catch (NoSuchBeanDefinitionException ex3) {
               if (logger.isInfoEnabled()) {
                  logger.info("More than one ScheduledExecutorService bean exists within the context, and " +
                        "none is named 'taskScheduler'. Mark one of them as primary or name it 'taskScheduler' " +
                        "(possibly as an alias); or implement the SchedulingConfigurer interface and call " +
                        "ScheduledTaskRegistrar#setScheduler explicitly within the configureTasks() callback: " +
                        ex2.getBeanNamesFound());
               }
            }
         }
         catch (NoSuchBeanDefinitionException ex2) {
            logger.trace("Could not find default ScheduledExecutorService bean", ex2);
            // Giving up -> falling back to default scheduler within the registrar...
            logger.info("No TaskScheduler/ScheduledExecutorService bean found for scheduled processing");
         }
      }
   }
   //触发所有未触发过的任务
   this.registrar.afterPropertiesSet();
}
```

看上面代码最后一行就是开头说三种触发任务的时机后两种，触发任务前还会检测是否已经有了scheduler，如果没有则调用resolveSchedulerBean()方法从容器返回一个，如果容器中TaskScheduler实例不止一个则尝试取bean name是taskScheduler。如果没有类型是TaskScheduler的，则尝试取类型是ScheduledExecutorService，不止一个的话依然取名字是taskScheduler的，返回的是ScheduledExecutorService实例，会在this.registrar.setScheduler()方法中使用ConcurrentTaskScheduler将其包装成TaskScheduler如下：

```java
public void setTaskScheduler(TaskScheduler taskScheduler) {
   Assert.notNull(taskScheduler, "TaskScheduler must not be null");
   this.taskScheduler = taskScheduler;
}
public void setScheduler(@Nullable Object scheduler) {
   if (scheduler == null) {
      this.taskScheduler = null;
   }
   else if (scheduler instanceof TaskScheduler) {
      this.taskScheduler = (TaskScheduler) scheduler;
   }
   else if (scheduler instanceof ScheduledExecutorService) {
      this.taskScheduler = new ConcurrentTaskScheduler(((ScheduledExecutorService) scheduler));
   }
   else {
      throw new IllegalArgumentException("Unsupported scheduler type: " + scheduler.getClass());
   }
}
```

```java
private <T> T resolveSchedulerBean(BeanFactory beanFactory, Class<T> schedulerType, boolean byName) {
   if (byName) {
      //taskScheduler
      T scheduler = beanFactory.getBean(DEFAULT_TASK_SCHEDULER_BEAN_NAME, schedulerType);
      if (this.beanName != null && this.beanFactory instanceof ConfigurableBeanFactory) {
         ((ConfigurableBeanFactory) this.beanFactory).registerDependentBean(
               DEFAULT_TASK_SCHEDULER_BEAN_NAME, this.beanName);
      }
      return scheduler;
   }
   else if (beanFactory instanceof AutowireCapableBeanFactory) {
      NamedBeanHolder<T> holder = ((AutowireCapableBeanFactory) beanFactory).resolveNamedBean(schedulerType);
      if (this.beanName != null && beanFactory instanceof ConfigurableBeanFactory) {
         ((ConfigurableBeanFactory) beanFactory).registerDependentBean(holder.getBeanName(), this.beanName);
      }
      return holder.getBeanInstance();
   }
   else {
      return beanFactory.getBean(schedulerType);
   }
}
```
