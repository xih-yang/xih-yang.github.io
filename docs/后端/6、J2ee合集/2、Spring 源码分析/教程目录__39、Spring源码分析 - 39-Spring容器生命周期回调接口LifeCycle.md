# 39、Spring源码分析 - 39-Spring容器生命周期回调接口LifeCycle
- 来源：https://ddkk.com/zhuanlan/j2ee/spring/7/39.html
- 分类：J2EE框架
- 分组：教程目录
## 1、LifeCycle接口概述

LifeCycle定义启动/停止生命周期控制方法的通用接口。这种情况的典型用例是控制异步处理。可以由两个组件（通常是Spring上下文中定义的Spring bean）和容器（通常是Spring ApplicationContext本身）实现。容器将开始/停止信号传播到每个容器内应用的所有组件。可用于通过JMX进行直接调用或管理操作，org.springframework.jmx.export.MBeanExporter通常使用org.springframework.jmx.export.assembler.InterfaceBasedMBeanInfoAssembler定义，从而限制活动控制组件对Lifecycle接口的可见性。

请注意，仅在顶级单例bean上支持当前的Lifecycle接口。在任何其他组件上，Lifecycle接口将保持未被检测到，因此将被忽略。另请注意，扩展的SmartLifecycle接口提供了与应用程序上下文的启动和关闭阶段的复杂集成。

## 2、SmartLifecycle接口

### 2.1、概述

SmartLifecycle是Lifecycle接口的扩展，用于那些需要在ApplicationContext按特定顺序刷新和/或关闭时启动的对象。 isAutoStartup()返回值指示是否应在上下文刷新时启动此对象。回调方法stop(Runnable)对于具有异步关闭过程的对象很有用。此接口的任何实现都必须在关闭完成时调用回调的run()方法，以避免整个ApplicationContext关闭中出现不必要的延迟。

此接口扩展了Phased，getPhase()方法的返回值指示应该启动和停止此Lifecycle组件的阶段。启动过程以最低相位值开始，以最高相位值结束（Integer.MIN_VALUE最低，Integer.MAX_VALUE最高）。关闭过程将应用相反的顺序。具有相同值的任何组件将在同一阶段中任意排序。

示例：如果组件B依赖于已经启动的组件A，则组件A的相位值应低于组件B.在关闭过程中，组件B将在组件A之前停止。

任何明确的“依赖”关系都优先于阶段顺序，因此依赖bean始终在其依赖之后启动，并始终在其依赖之前停止。

上下文中未实现SmartLifecycle的任何生命周期组件都将被视为具有0的阶段值。这样，SmartLifecycle实现可以在这些生命周期组件之前开始，如果它具有负相位值，或者可以在那些之后开始组件，如果它具有正相位值。

请注意，由于SmartLifecycle中的自动启动支持，SmartLifecycle bean实例通常会在应用程序上下文启动时初始化。因此，bean定义lazy-init标志对SmartLifecycle bean的实际影响非常有限。

### 2.2、类图

### 2.3、方法说明

方法
描述

start()
bean初始化完毕后，该方法会被执行，对于容器，这会将启动信号传播到所有适用的组件。

stop()
通常以同步方式停止此组件，以便在返回此方法时组件完全停止。 当需要异步停止行为时，请考虑实现SmartLifecycle及其stop(Runnable)变体。

isRunning()
检查此组件当前是否正在运行。对于容器，仅当应用的所有组件当前正在运行时，才会返回true。

getPhase()
返回此生命周期对象应运行的阶段。默认实现返回Integer.MAX_VALUE，以便在常规生命周期实现后执行停止回调。

isAutoStartup()
如果随ApplicationContext刷新时容器自动启动此Lifecycle组件时，则返回true。
 值false表示该组件旨在通过显式的start()调用启动，类似于普通的Lifecycle实现。
 默认实现返回true。

stop(Runnable)
spring容器发现当前对象实现了SmartLifecycle，就调用stop(Runnable)，如果只是实现了Lifecycle，就调用stop()

## 3、LifecycleProcessor

用于在ApplicationContext中处理Lifecycle bean的策略接口。LifecycleProcessor接口有两个方法，下图显示了其调用流程。

前者在ApplicationContext刷新时调用，后再在ApplicationContext关闭时调用。

## 4、源码分析

### 4.1、容器启动流程

在Spring容器启动的时候会调用ApplicationContext的refresh方法，此方法在最后一个步骤是调用finishRefresh方法。

这个方法中首先会实例化一个LifecycleProcessor：先从容器中找一个名为lifecycleProcessor的LifecycleProcessor否则使用DefaultLifecycleProcessor。下面是DefaultLifecycleProcessor的实现。

```java
@Override
public void onRefresh() {
   startBeans(true);
   this.running = true;
}
private void startBeans(boolean autoStartupOnly) {
   // 单例非懒加载bean
   Map<String, Lifecycle> lifecycleBeans = getLifecycleBeans();
   Map<Integer, LifecycleGroup> phases = new HashMap<>();
   lifecycleBeans.forEach((beanName, bean) -> {
      // 默认autoStartupOnly=true，因此只能筛选出是SmartLifecycle.isAutoStartup()=true的bean
      if (!autoStartupOnly || (bean instanceof SmartLifecycle && ((SmartLifecycle) bean).isAutoStartup())) {
         int phase = getPhase(bean);
         // 相同phases一组
         LifecycleGroup group = phases.get(phase);
         if (group == null) {
            group = new LifecycleGroup(phase, this.timeoutPerShutdownPhase, lifecycleBeans, autoStartupOnly);
            phases.put(phase, group);
         }
         // 向group的members添加beanName, bean
         group.add(beanName, bean);
      }
   });
   if (!phases.isEmpty()) {
      List<Integer> keys = new ArrayList<>(phases.keySet());
      // phases从小到大
      Collections.sort(keys);
      for (Integer key : keys) {
         // 同属一个组的Lifecycle一起启动
         phases.get(key).start();
      }
   }
}
```

上面代码是从容器中选出非懒加载单例的Lifecycle，DefaultLifecycleProcessor只筛选出SmartLifecycle.isAutoStartup()=true的bean，把相同phase的bean封装成一个组LifecycleGroup，这些组按照phase从小到大依次调用start方法。下面是其实现。

```java
public void start() {
   if (this.members.isEmpty()) {
      return;
   }
   if (logger.isDebugEnabled()) {
      logger.debug("Starting beans in phase " + this.phase);
   }
   Collections.sort(this.members);
   for (LifecycleGroupMember member : this.members) {
      doStart(this.lifecycleBeans, member.name, this.autoStartupOnly);
   }
}
private void doStart(Map<String, ? extends Lifecycle> lifecycleBeans, String beanName, boolean autoStartupOnly) {
   // 移除已经执行过start方法的bean，因为下面依赖原因，避免重复调用
   Lifecycle bean = lifecycleBeans.remove(beanName);
   if (bean != null && bean != this) {
      // 依赖的bean也是Lifecycle先执行它的start方法
      String[] dependenciesForBean = getBeanFactory().getDependenciesForBean(beanName);
      for (String dependency : dependenciesForBean) {
         doStart(lifecycleBeans, dependency, autoStartupOnly);
      }
      // 需要是非运行状态且是isAutoStartup
      if (!bean.isRunning() &&
            (!autoStartupOnly || !(bean instanceof SmartLifecycle) || ((SmartLifecycle) bean).isAutoStartup())) {
         if (logger.isTraceEnabled()) {
            logger.trace("Starting bean '" + beanName + "' of type [" + bean.getClass().getName() + "]");
         }
         try {
            bean.start();
         }
         catch (Throwable ex) {
            throw new ApplicationContextException("Failed to start bean '" + beanName + "'", ex);
         }
         if (logger.isDebugEnabled()) {
            logger.debug("Successfully started bean '" + beanName + "'");
         }
      }
   }
}
```

### 4.2、容器关闭流程

当Spring容器启动失败的时候会调用close()方法，当然主动调用也可以。

```java
@Override
public void close() {
   synchronized (this.startupShutdownMonitor) {
      doClose();
      // If we registered a JVM shutdown hook, we don't need it anymore now:
      // We've already explicitly closed the context.
      if (this.shutdownHook != null) {
         try {
            Runtime.getRuntime().removeShutdownHook(this.shutdownHook);
         }
         catch (IllegalStateException ex) {
            // ignore - VM is already shutting down
         }
      }
   }
}
```

close方法会调用doClose方法，这个方法中会调用lifecycleProcessor.onClose();

下面是DefaultLifecycleProcessor的实现代码：

```java
@Override
public void onClose() {
   stopBeans();
   this.running = false;
}
private void stopBeans() {
   Map<String, Lifecycle> lifecycleBeans = getLifecycleBeans();
   Map<Integer, LifecycleGroup> phases = new HashMap<>();
   lifecycleBeans.forEach((beanName, bean) -> {
      int shutdownPhase = getPhase(bean);
      LifecycleGroup group = phases.get(shutdownPhase);
      if (group == null) {
         group = new LifecycleGroup(shutdownPhase, this.timeoutPerShutdownPhase, lifecycleBeans, false);
         phases.put(shutdownPhase, group);
      }
      group.add(beanName, bean);
   });
   if (!phases.isEmpty()) {
      List<Integer> keys = new ArrayList<>(phases.keySet());
      keys.sort(Collections.reverseOrder());
      for (Integer key : keys) {
         phases.get(key).stop();
      }
   }
}
```
