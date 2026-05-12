# 06、Quartz Misfire的处理
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/12.html
- 分类：作业调度
- 分组：Quartz 教程（版本 B）
Quartz框架在执行任务中可能会由于停电，宕机等原因，有一段没有去调度任务，但是有些任务可能刚好应该在这个时间内执行，此时就会出现在本该执行的时间没有执行的情况。这种情况就叫做misfire了。

## Quartz的misfire机制

为了解决这个问题，Quartz框架也是做出了应对，它提供了多种可选的misfire处理策略，在添加任务时就可以配置，之后在任务misfire时就会根据配置的策略去处理。

Quartz在JobStoreSupport类中声明了一个MisFireHandler线程，用于去扫描QRTZ_TRIGGERS表，检查有没有trigger misfire了。这个线程会在Scheduler start的时候初始化，之后就会一直工作。Run方法中的逻辑如下：

```java
public void run() {
    while (!shutdown) {
        long sTime = System.currentTimeMillis();
        RecoverMisfiredJobsResult recoverMisfiredJobsResult = manage();
        if (recoverMisfiredJobsResult.getProcessedMisfiredTriggerCount() > 0) {
            signalSchedulingChangeImmediately(recoverMisfiredJobsResult.getEarliestNewTime());
        }
        if (!shutdown) {
            long timeToSleep = 50l;  // At least a short pause to help balance threads
            if (!recoverMisfiredJobsResult.hasMoreMisfiredTriggers()) {
                timeToSleep = getMisfireThreshold() - (System.currentTimeMillis() - sTime);
                if (timeToSleep <= 0) {
                    timeToSleep = 50l;
                }
                if(numFails > 0) {
                    timeToSleep = Math.max(getDbRetryInterval(), timeToSleep);
                }
            }
            try {
                Thread.sleep(timeToSleep);
            } catch (Exception ignore) {
            }
        }//while !shutdown
    }
}
```

从代码可以看到，首先调用了manage方法，去执行了一次misfire的处理操作，拿到了一个RecoverMisfiredJobsResult的实例，如果有misfire的trigger被处理了，则要立即更新一次调度信号，之后线程至少会sleep50ms，以平衡线程的执行。所以主要需要看一下manage方法。其中调用了doRecoverMisfires，该方法中又调用了RecoverMisfireJobs方法。该方法实现了主要的业务逻辑，第一步：

```java
// If recovering, we want to handle all of the misfired
    // triggers right away.
    int maxMisfiresToHandleAtATime = 
        (recovering) ? -1 : getMaxMisfiresToHandleAtATime();
List<TriggerKey> misfiredTriggers = new LinkedList<TriggerKey>();
long earliestNewTime = Long.MAX_VALUE;
// We must still look for the MISFIRED state in case triggers were left 
// in this state when upgrading to this version that does not support it. 
boolean hasMoreMisfiredTriggers =
    getDelegate().hasMisfiredTriggersInState(
        conn, STATE_WAITING, getMisfireTime(), 
        maxMisfiresToHandleAtATime, misfiredTriggers);
```

去QRTZ_TRIGGERS表查最大maxMisfiresToHandleAtTime个misfire的triggers，执行的sql语句如下：

```java
String SELECT_HAS_MISFIRED_TRIGGERS_IN_STATE = "SELECT "
    + COL_TRIGGER_NAME + ", " + COL_TRIGGER_GROUP + " FROM "
    + TABLE_PREFIX_SUBST + TABLE_TRIGGERS + " WHERE "
    + COL_SCHEDULER_NAME + " = " + SCHED_NAME_SUBST + " AND NOT ("
    + COL_MISFIRE_INSTRUCTION + " = " + Trigger.MISFIRE_INSTRUCTION_IGNORE_MISFIRE_POLICY + ") AND " 
    + COL_NEXT_FIRE_TIME + " < ? " 
    + "AND " + COL_TRIGGER_STATE + " = ? "
    + "ORDER BY " + COL_NEXT_FIRE_TIME + " ASC, " + COL_PRIORITY + " DESC";
```

如果有misfire的triggers，则向下进行第二步，处理misfire：

```java
for (TriggerKey triggerKey: misfiredTriggers) {
    OperableTrigger trig = 
        retrieveTrigger(conn, triggerKey);
    if (trig == null) {
        continue;
    }
    doUpdateOfMisfiredTrigger(conn, trig, false, STATE_WAITING, recovering);
    if(trig.getNextFireTime() != null && trig.getNextFireTime().getTime() < earliestNewTime)
        earliestNewTime = trig.getNextFireTime().getTime();
}
return new RecoverMisfiredJobsResult(
hasMoreMisfiredTriggers, misfiredTriggers.size(), earliestNewTime);
```

retrieveTrigger方法是从QRTZ_TRIGGERS表中查询出trigger的数据，doUpdateOfMisfiredTrigger方法中调用了

> trig.updateAfterMisfire(cal);

该方法的逻辑就是根据misfire的策略去更新nextFireTime，然后会调用storeTrigger方法去更新QRTZ_TRIGGERS表中该trigger的数据。那Quartz好像到目前为止还是没有执行任务啊，misfire还是没有处理啊。别急，看一下updateAfterMisfire方法，以cron类型的trigger中的该方法为例：

```java
int instr = getMisfireInstruction();
if(instr == Trigger.MISFIRE_INSTRUCTION_IGNORE_MISFIRE_POLICY)
    return;
if (instr == MISFIRE_INSTRUCTION_SMART_POLICY) {
    instr = MISFIRE_INSTRUCTION_FIRE_ONCE_NOW;
}
if (instr == MISFIRE_INSTRUCTION_DO_NOTHING) {
    Date newFireTime = getFireTimeAfter(new Date());
    while (newFireTime != null && cal != null
            && !cal.isTimeIncluded(newFireTime.getTime())) {
        newFireTime = getFireTimeAfter(newFireTime);
    }
    setNextFireTime(newFireTime);
} else if (instr == MISFIRE_INSTRUCTION_FIRE_ONCE_NOW) {
    setNextFireTime(new Date());
}
```

可以看到，如果instr是立即触发一次，那么nextFireTime就会被设置成当前时间，接下来又调用了storeTrigger方法去把trigger的状态置为了WAITING。所以就会被QuartzShcedulerThread线程扫描到，立即执行一次。就实现了misfire的处理，其他的misfire的策略处理方式类似，都是通过更改下一次触发时间决定的。SimpleTriggerImpl中的updateAfterMisfire方法实现有所不同，出去更改nextFireTime还涉及到了次数的处理，有需要的可以自己看下。

有关QuartzSchedulerThread的执行逻辑的可以看链接：[Quartz执行逻辑（一）QuartzSchedulerThread介绍](https://blog.csdn.net/qq_41109806/article/details/115614063?spm=1001.2014.3001.5501).

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
