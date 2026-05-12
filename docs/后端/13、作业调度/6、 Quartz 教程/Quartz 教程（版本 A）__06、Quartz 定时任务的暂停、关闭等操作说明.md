# 06、Quartz 定时任务的暂停、关闭等操作说明
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/6.html
- 分类：作业调度
- 分组：Quartz 教程（版本 A）
## 定时任务的暂停、关闭等操作说明

基于quartz3.0版本总结一些quartz定时任务的暂停、恢复、删除等操作。

定时任务的删除等操作主要是基于JobKey或TriggerKey。

## 暂停Job:

```java
//通过JobName以及JobGroup获得JobKey
JobKey jobKey = JobKey.jobKey("aaaa" + 1, JOB_GROUP_NAME);
try {
    Scheduler scheduler = schedulerFactoryBean.getScheduler();
    scheduler .pauseJob(jobKey);
} catch (SchedulerException e) {
    e.printStackTrace();
}
```

注：此处暂停job会根据jobkey暂停job及对应的trigger

## 恢复Job:

```java
//通过JobName以及JobGroup获得JobKey
JobKey jobKey = JobKey.jobKey("aaaa" + 1, JOB_GROUP_NAME);
try {
    schedulerFactoryBean.getScheduler().resumeJob(jobKey);
} catch (SchedulerException e) {
    e.printStackTrace();
}
```

## 删除job

方法一：

```java
//通过JobName以及JobGroup获得JobKey
JobKey jobKey = JobKey.jobKey("aaaa" + 1, JOB_GROUP_NAME);
try {
    schedulerFactoryBean.getScheduler().deleteJob(jobKey);
} catch (SchedulerException e) {
    e.printStackTrace();
}
```

方法二：

```java
//通过triggerName获取TriggerKey
TriggerKey aaatrigger = TriggerKey.triggerKey("aaatrigger");
try {
    schedulerFactoryBean.getScheduler().unscheduleJob(aaatrigger);
} catch (SchedulerException e) {
    e.printStackTrace();
}
```

注：此处删除job会根据jobkey或TriggerKey删除job及对应的trigger

另外会存在一种情况，再暂停一段时间后，恢复定时会将暂停期间未执行的定时执行一遍，这个和创建定时的时候Trigger的CronTrigger.MISFIRE_INSTRUCTION_DO_NOTHING属性有关系，如果设置的是misfire的定时立刻执行的话就会在恢复定时的时候马上执行，如果是放弃执行的话就会在恢复定时的时候执行下一个时间的定时。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
