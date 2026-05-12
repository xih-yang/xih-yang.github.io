# 03、Quartz 源码分析 - Trigger源码解析
- 来源：https://ddkk.com/zhuanlan/job/xxljob/2/11.html
- 分类：作业调度
- 分组：Quartz 源码解析
### Trigger源码分析

我们先直接来看一下Trigger接口的源码，对它功能有一个大致的了解：

```java
package org.quartz;
import java.io.Serializable;
import java.util.Comparator;
import java.util.Date;
/**
 * 任务触发器
 */
public interface Trigger extends Serializable, Cloneable, Comparable<Trigger> {
    long serialVersionUID = -3904243490805975570L;
    /**
     * 触发器状态
     */
    enum TriggerState {
      NONE, NORMAL, PAUSED, COMPLETE, ERROR, BLOCKED }
    /**
     * 先不理他
     */
    enum CompletedExecutionInstruction {
      NOOP, RE_EXECUTE_JOB, SET_TRIGGER_COMPLETE, DELETE_TRIGGER,
        SET_ALL_JOB_TRIGGERS_COMPLETE, SET_TRIGGER_ERROR, SET_ALL_JOB_TRIGGERS_ERROR }
    /**
     * 先不理他
     */
    int MISFIRE_INSTRUCTION_SMART_POLICY = 0;
    /**
     * 先不理他
     */
    int MISFIRE_INSTRUCTION_IGNORE_MISFIRE_POLICY = -1;
    /**
     * 默认策略
     */
    int DEFAULT_PRIORITY = 5;
    /**
     * 获取trigger Key
     */
    TriggerKey getKey();
    /**
     * 获取job Key
     */
    JobKey getJobKey();
    /**
     * 辅助性方法（可省略）
     */
    String getDescription();
    /**
     * 获取日历名字
     */
    String getCalendarName();
    /**
     * 获取任务数据内容
     */
    JobDataMap getJobDataMap();
    /**
     * 获取策略
     */
    int getPriority();
    /**
     * 是否可以再次运行job任务
     */
    boolean mayFireAgain();
    /**
     * 获取job任务运行时间
     */
    Date getStartTime();
    /**
     * 获取job任务结束时间
     */
    Date getEndTime();
    /**
     * 获取job下一次任务运行时间
     */
    Date getNextFireTime();
    /**
     * 获取job上一次任务运行时间
     */
    Date getPreviousFireTime();
    /**
     * 获取job某一个时间点之后的运行时间
     */
    Date getFireTimeAfter(Date afterTime);
    /**
     * 获取最后一次运行时间，如果永久运行返回为null
     */
    Date getFinalFireTime();
    /**
     * 获取错失发布的策略
     */
    int getMisfireInstruction();
    /**
     * 获取触发装置的构造器
     */
    TriggerBuilder<? extends Trigger> getTriggerBuilder();
    /**
     * 获取任务的构造器
     */
    ScheduleBuilder<? extends Trigger> getScheduleBuilder();
    boolean equals(Object other);
    int compareTo(Trigger other);
    /**
     * 获取最近运行时间的比较器，如果运行时间相同，则根据触发器的策略priority，越高越快，如果一样，则根据key排序
     */
    class TriggerTimeComparator implements Comparator<Trigger>, Serializable {
        private static final long serialVersionUID = -3904243490805975570L;
        // This static method exists for comparator in TC clustered quartz
        public static int compare(Date nextFireTime1, int priority1, TriggerKey key1, Date nextFireTime2, int priority2, TriggerKey key2) {
            if (nextFireTime1 != null || nextFireTime2 != null) {
                if (nextFireTime1 == null) {
                    return 1;
                }
                if (nextFireTime2 == null) {
                    return -1;
                }
                if(nextFireTime1.before(nextFireTime2)) {
                    return -1;
                }
                if(nextFireTime1.after(nextFireTime2)) {
                    return 1;
                }
            }
            int comp = priority2 - priority1;
            if (comp != 0) {
                return comp;
            }
            return key1.compareTo(key2);
        }
        @Override
        public int compare(Trigger t1, Trigger t2) {
            return compare(t1.getNextFireTime(), t1.getPriority(), t1.getKey(), t2.getNextFireTime(), t2.getPriority(), t2.getKey());
        }
    }
}
```

方法可能有点多，一时间有点难以接受，没关系，之前也说了只是需要有一个大概的印象，知道这个接口大致的作用。

### SimpleTrigger源码分析

这里我们目前就只分析SimpleTrigger源码，我相信可以窥斑见豹，举一反三。源码如下：

```java
/**
 * 简单触发器
 */
public interface SimpleTrigger extends Trigger {
    long serialVersionUID = -3735980074222850397L;
    int MISFIRE_INSTRUCTION_FIRE_NOW = 1;
    int MISFIRE_INSTRUCTION_RESCHEDULE_NOW_WITH_EXISTING_REPEAT_COUNT = 2;
    int MISFIRE_INSTRUCTION_RESCHEDULE_NOW_WITH_REMAINING_REPEAT_COUNT = 3;
    int MISFIRE_INSTRUCTION_RESCHEDULE_NEXT_WITH_REMAINING_COUNT = 4;
    int MISFIRE_INSTRUCTION_RESCHEDULE_NEXT_WITH_EXISTING_COUNT = 5;
    int REPEAT_INDEFINITELY = -1;
    /**
     * 获取触发器重复次数，到了之后自动删除触发器
     */
    int getRepeatCount();
    /**
     * 获取触发器每次过多少时间触发运行
     */
    long getRepeatInterval();
    /**
     * 获取触发器已经运行了几次
     */
    int getTimesTriggered();
    @Override
    TriggerBuilder<SimpleTrigger> getTriggerBuilder();
}
```

可以看到就增加了几个辅助的方法。对这几个接口有一定的了解之后，来看一下我们是如何使用的。

```java
      // 触发器
      SimpleTrigger trigger = TriggerBuilder.newTrigger()
          //触发器key唯一标识
          .withIdentity(jobName, TRIGGER_GROUP_NAME)
          //调度开始时间
          .startAt(DateBuilder.futureDate(1, IntervalUnit.SECOND))
          //调度规则
          .withSchedule(SimpleScheduleBuilder.simpleSchedule()
              .withIntervalInSeconds(interval)
              .repeatForever())
          .build(); 
```

下面我们来一个个分析。

### TriggerBuilder源码分析

```java
package org.quartz;
import java.util.Date;
import org.quartz.spi.MutableTrigger;
import org.quartz.utils.Key;
/**
 * 触发器构造器
 */
public class TriggerBuilder<T extends Trigger> {
    /**
     * 触发器唯一标识Key
     */
    private TriggerKey key;
    /**
     * 描述
     */
    private String description;
    /**
     * 开始时间
     */
    private Date startTime = new Date();
    /**
     * 结束时间
     */
    private Date endTime;
    /**
     * 策略
     */
    private int priority = Trigger.DEFAULT_PRIORITY;
    /**
     * 日历名称
     */
    private String calendarName;
    /**
     * Job唯一标识
     */
    private JobKey jobKey;
    /**
     * Job额外属性
     */
    private JobDataMap jobDataMap = new JobDataMap();
    /**
     * 调度器
     */
    private ScheduleBuilder<?> scheduleBuilder = null;
    private TriggerBuilder() {
    }
    public static TriggerBuilder<Trigger> newTrigger() {
        return new TriggerBuilder<Trigger>();
    }
    /**
     * 构建对应Trigger
     */
    @SuppressWarnings("unchecked")
    public T build() {
        if(scheduleBuilder == null)
            scheduleBuilder = SimpleScheduleBuilder.simpleSchedule();
        MutableTrigger trig = scheduleBuilder.build();
        trig.setCalendarName(calendarName);
        trig.setDescription(description);
        trig.setStartTime(startTime);
        trig.setEndTime(endTime);
        if(key == null)
            key = new TriggerKey(Key.createUniqueName(null), null);
        trig.setKey(key); 
        if(jobKey != null)
            trig.setJobKey(jobKey);
        trig.setPriority(priority);
        if(!jobDataMap.isEmpty())
            trig.setJobDataMap(jobDataMap);
        return (T) trig;
    }
    public TriggerBuilder<T> withIdentity(String name) {
        key = new TriggerKey(name, null);
        return this;
    }
  ...  
}
```

这个类也非常简单，就是一个普通的JavaBean类，包含各种属性和get、set方法。

那么我们开始来解析是如何应用。首先调用了newTrigger返回了一个新的实例，之后调用withIdentity创建了一个Trigger唯一标识Key，至于TriggerKey是怎样的，可以借鉴Job源码文章的JobKey，基本一致。

startAt其实就是一个set方法，把Date复制给startTime并且返回当前实例，典型的构造器设计模式。后面的SimpleScheduleBuilder.simpleSchedule()我们目前不做展开，看表面代码含义，我们就可以知道这是构造了一个调度器SimpleScheduleBuilder。左后调用了build方法，构造出了一个SimpleTrigger。
