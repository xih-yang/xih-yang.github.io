# 08、Quartz 恢复任务，任务如何不会被misfire处理
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/14.html
- 分类：作业调度
- 分组：Quartz 教程（版本 B）
任务如果在暂停期间有本该触发的情况，但是由于被暂停了没有触发，那么在任务恢复的时候就会被检测到它misfire了。此时MisfireHandler线程就会根据添加任务时的misfire策略去处理它。但是如果想要忽略这种misfire的情况该怎么做呢，人为的暂停不算是misfire，遇到宕机，断电这种情况才算。

## 处理方法

在[Quartz 任务的暂停和恢复](/zhuanlan/job/quartz/b/3/)中说到了，在resumeTrigger方法中如果nextFireTime小于当前时间则会调用updateMisfiredTrigger方法。所以只需要在此之前去更新trigger的nextFireTime即可。也就是加上以下代码：

```java
OperableTrigger trigger = getDelegate().selectTrigger(conn, key);
if (trigger.getNextFireTime().getTime() < System.currentTimeMillis()) {
    trigger.setNextFireTime(trigger.getFireTimeAfter(null));
}
JobDetail job = retrieveJob(conn, status.getJobKey());
storeTrigger(conn, trigger, job, true, status.getStatus(), false, false);
```

这部分代码的操作是先更新了trigger的nextFireTime，然后拿到job的信息，接着调用storeTrigger方法去替换了原来的trigger，该方法的第四个参数是replaceExist，为true就会替换已经存在的，这样nextFireTime就被设置成了从当前时间算起的下一次触发的时间，就不会misfire了。向下继续执行代码只会把trigger的状态由PAUSED改为WAITING。

要注意的是该方案没有区分trigger的类型，而且是所有的调用都会按照这个逻辑忽略misfire，有其他需求的可以在这基础上另做修改以实现功能。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
