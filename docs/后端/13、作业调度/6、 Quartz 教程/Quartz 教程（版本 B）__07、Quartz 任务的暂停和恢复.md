# 07、Quartz 任务的暂停和恢复
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/13.html
- 分类：作业调度
- 分组：Quartz 教程（版本 B）
前面在Quartz执行逻辑（一）中说到trigger的状态是WAITING的，会在目标时间被触发，所以暂停与恢复任务自然是修改了trigger的状态。

## 暂停与恢复任务

## 暂停任务

暂停任务时通过调用Scheduler的pauseJob方法来实现这个操作。这个方法一直向下调用到了JobStoreSupport中的pauseJob方法。该方法中是对任务的trigger进行操作的，也证实了前面的猜想，只要修改trigger的状态就能实现任务的暂停与恢复。主要代码如下：

```java
List<OperableTrigger> triggers = getTriggersForJob(conn, jobKey);
for (OperableTrigger trigger: triggers) {
    pauseTrigger(conn, trigger.getKey());
}
```

首先获取到该job的trigger再去暂停trigger。获取trigger自然是去查询QRTZ_TRIGGERS表，主要看一下pauseTrigger方法做了什么操作。主要代码如下：

```java
String oldState = getDelegate().selectTriggerState(conn,
        triggerKey);
if (oldState.equals(STATE_WAITING)
        || oldState.equals(STATE_ACQUIRED)) {
    getDelegate().updateTriggerState(conn, triggerKey,
            STATE_PAUSED);
} else if (oldState.equals(STATE_BLOCKED)) {
    getDelegate().updateTriggerState(conn, triggerKey,
            STATE_PAUSED_BLOCKED);
}
```

和我们预想的一样，改变了触发器的状态。如果当前trigger的状态是WAITING或ACQUIRED，则更新为PAUSED。如果当前trigger的状态是BLOCKED则更新为PAUSED_BLOCKED。

## 恢复任务

既然暂停任务是通过修改trigger的状态实现的，那么恢复任务很自然的会想到也是如此实现的，下面看一下具体的实现。同样的调用入口还是在Scheduler中，调用其resumeJob方法实现，该方法向下调用到了JobStoreSupport中的resumeJob方法，该方法的主要代码如下：

```java
List<OperableTrigger> triggers = getTriggersForJob(conn, jobKey);
for (OperableTrigger trigger: triggers) {
    resumeTrigger(conn, trigger.getKey());
}
```

和暂停任务的操作如出一辙，还是先获取job的trigger，然后恢复trigger，具体看一下resumeTrigger方法：

```java
TriggerStatus status = getDelegate().selectTriggerStatus(conn,
                key);
if (status == null || status.getNextFireTime() == null) {
    return;
}
boolean blocked = false;
if(STATE_PAUSED_BLOCKED.equals(status.getStatus())) {
    blocked = true;
}
String newState = checkBlockedState(conn, status.getJobKey(), STATE_WAITING);
boolean misfired = false;
if (schedulerRunning && status.getNextFireTime().before(new Date())) {
    misfired = updateMisfiredTrigger(conn, key,
        newState, true);
}
if(!misfired) {
    if(blocked) {
        getDelegate().updateTriggerStateFromOtherState(conn,
                key, newState, STATE_PAUSED_BLOCKED);
    } else {
        getDelegate().updateTriggerStateFromOtherState(conn,
                key, newState, STATE_PAUSED);
    }
} 
```

可以看到大体上的思想还是更新trigger的状态，只是要考虑nextFireTime和misfire。如果没有nextFireTime了，则没有向下继续修改trigger状态的必要了，直接return。checkBlockedstate方法中判断当前任务是否有触发了，根据QRTZ_FIRED_TRIGGERS表中的情况和当前的状态决定新的状态应该是什么：

```java
List<FiredTriggerRecord> lst = getDelegate().selectFiredTriggerRecordsByJob(conn,
                jobKey.getName(), jobKey.getGroup());
if (lst.size() > 0) {
    FiredTriggerRecord rec = lst.get(0);
    if (rec.isJobDisallowsConcurrentExecution()) { // OLD_TODO: worry about failed/recovering/volatile job  states?
        return (STATE_PAUSED.equals(currentState)) ? STATE_PAUSED_BLOCKED : STATE_BLOCKED;
    }
}
return currentState;
```

如果该job被触发了，同时job不允许并发执行且当前状态又是PAUSED，则新的状态任然为BLOKED，否则直接返回当前状态。调用时传入的当前状态是WAITING，所以一般该方法的返回值还是WAITING，这才符合对恢复任务的状态的预期。回到resumeTrigger方法向下，如果没有misfire且没block，则把PAUSED更新为WAITING。如果没有misfire但是BLOCK了，则把PAUSED_BLOCK更新为checkBlockedState方法的返回值。有关QRTZ_FIRED_TRIGGERS表的作用可以参考：[Quartz QRTZ_FIRED_TRIGGERS表的作用](/zhuanlan/job/quartz/b/3/)

如果nextFireTime早于当前时间则说明misfire了则要调用updateMisfireTrigger方法，该方法中调用的是doUpdateOfMisfireTrigger方法，该方法内容在：[Quartz执行逻辑（六）misfire的处理](/zhuanlan/job/quartz/b/6/)中说过，故此不再赘述。

所以resumeTrigger方法在一般情况下做的操作时把trigger的状态从paused改为waiting。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
