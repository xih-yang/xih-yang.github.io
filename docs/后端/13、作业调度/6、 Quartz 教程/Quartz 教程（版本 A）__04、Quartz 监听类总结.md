# 04、Quartz 监听类总结
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/4.html
- 分类：作业调度
- 分组：Quartz 教程（版本 A）
## quartz监听类总结

本篇文章将对我们使用quartz框架的过程中，主要涉及到的类及类中的方法进行介绍

**SchedulerListener**监听在调度过程中各个环节发生的事

## SchedulerListener**中主要方法介绍

- jobScheduled()当JobDetail被调度器调用的时候触发这个方法
- jobUnscheduled()在JobDetail没有被调度器调用的时候触发这个方法
- triggerFinalized()当触发器完成时不会再次被触发是被调度器调用
- triggerPaused()当触发器暂停时被调度器调用
- triggersPaused()如果一个组内的触发器被暂停方法被调度器调用
- triggerResumed()当一个触发器取消暂停状态方法被调用
- triggersResumed()当一组触发器取消暂停状态方法被调用
- jobAdded()当添加一个JobDetail时方法被调用
- jobDeleted()当删除一个JobDetail时方法被调用
- jobPaused()当一个JobDetail被暂停时触发
- jobsPaused()当一组JobDetail被暂停时触发
- jobResumed()当一个JobDetail由暂停恢复时触发
- jobsResumed()当一组JobDetail由暂停恢复时触发
- schedulerError()在任务执行失败，或触发器创建的时候执行时间已经过了报错会被调用
- schedulerInStandbyMode()由调度器调用通知监听器调度器已经进入到备用模式
- schedulerStarted()由调度器调用通知监听器调度器已启动
- schedulerStarting()由调度器调用通知监听器调度器正在启动
- schedulerShutdown()由调度器调用通知监听器调度器已关闭
- schedulerShuttingdown()由调度器调用通知监听器调度器正在关闭
- schedulingDataCleared()由调度程序调用，通知侦听程序所有作业、触发器和日历已被删除。

**TriggerListener**接口是在触发器被触发时调用如果希望在触发器触发过程中得到通知或做相应操作的话可以实现这个接口进行操作；

## TriggerListener**中主要方法介绍

- triggerFired()方法 当触发器已经触发且关联的JobDetail即将执行的时候会触发这个方法，既定时任务执行之前会触发;
- vetoJobExecution()方法 这个方法是在triggerFired()方法之后执行，如果不想让这个job执行那么只需要这个接口返回true,这样job的execute方法将不会执行；
- triggerMisfired()方法 当触发器失败的时候会被调度器调用，这个方法不能执行太长时间，负责可能会影响其他触发器的执行；
- triggerComplete() 当触发器对应的job执行完毕时此方法被调用；

**JobListener**接口是在任务执行过程中如果希望得到通知或做相应操作的话可以实现这个接口进行操作；

## JobListener**中主要方法介绍

- jobToBeExecuted()当要开始执行JobDetail,并且TriggerListener没有否决时由调度器调用
- jobExecutionVetoed()当要开始执行JobDetail,并且TriggerListener否决了由调度器调用
- jobWasExecuted()当执行完毕JobDetail调用

> 注：三种监听器可以根据需求灵活使用
>
> 稍后将开始与项目实际结合进行发布文章

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
