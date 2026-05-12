# 09、Quartz Simple类型触发器的misfire策略
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/15.html
- 分类：作业调度
- 分组：Quartz 教程（版本 B）
在[Quartz Misfire的处理](/zhuanlan/job/quartz/b/6/)中介绍了quartz关于misfire处理的逻辑。在该篇中我们提到了关于misfire的处理策略是可以设置的，本篇就来介绍一下如何设置misfire策略，和每种策略具体的处理方式。

## 2.misfire策略的设置及处理方式

misfire策略在创建触发器的时候可以自主设定，创建触发器使用的是TriggerBuilder类，在其中需要指定一个ScheduleBuilder实例，用于配置具体的触发器类型的配置，而在TriggerBuilder中配置的是触发器的通用配置。

SchedueBuilder的子类实现类有一下几种：CronScheduleBuilder，SimpleScheduleBuilder，CalendarIntervalScheduleBuilder，DailyTimeIntervalScheduleBuilder。本篇介绍其中的Simple类型。在SimpleScheduleBuilder中有一下字段：

misfireInstruction代表的是misfire策略对应的值，通过下面的一些方法设置。

## 2.1IgnoreMisfire

该方法设置的misfire策略是IgnoreMisfire，其处理方式为misfire了多少次就立即触发多少次，之后的触发按照设定的频率正常触发。

## FireNow

该方法设定的misfire策略是fireNow，其处理方式为无论misfire多少次，立即触发一次，并且后续的触发时间的计算都要以当前时间为基准计算，直至结束。例如每隔五分钟触发一次，整点开始的，那么每一次触发的时间应该是05分，10分这样5的倍数的。如果misfire的处理在某小时的12分，那么后续的触发时间就是17分，22分这样以此类推，直至任务结束。

## NextWithExistingCount

该方法设定的策略是NextWithExistingCount，其处理方式为misfire了多少次都不管，之后的触发按照正常的设定触发，直至结束，但是该方法保证整个任务的生命周期触发的次数是符合预期的。比如已经触发了5次，misfire了3次，总共计划要触发10次，那么该任务不受misfire影响，必须要再触发5次才会结束。

## NextWithRemainingCount

该方法设定的策略是NextWithRemainingCount，其处理方式类似于上面的NextWithExistingCount，同样不管misfire多少次，但是把misfire的次数也算到了总的计划触发次数中，之后只需要触发剩余的次数即可。例如一个任务计划触发10次，已经触发了5次，misfire了3次，则只需要再触发2次就可以结束了。

## NowWithExistingCount

该方法设置的策略是NowWithExisitingRepeatCount，其处理方式是无论misfire了多少次都立即触发一次，之后以当前时间为基准计算此后的触发时间，直至触发完计划要触发的次数。例如计划触发10次，每隔5分钟触发一次，9点开始。之后misfire了3次，已经触发了5次，在9.53检测到了misfire，则53分立即触发一次，下一次的触发时间为58分，还需触发5次结束。

## NowWithRemainingCount

该方法设定的misfire策略是NowWithRemainingRepeatCount，与上面的策略唯一不同的地方在于只需要再触发检测到misfire后剩余的触发次数，misfire的次数也算到计划触发次数之后，剩余次数等于计划触发次数减去已经触发次数和misfire次数。

## 总结

simple类型的触发器提供了多种misfire策略供选择，实际使用时只需要根据实际需求设置相应的策略即可。如果暂停后再恢复不希望被quartz理解为该任务misfire了，而是正常接着执行的不受设置的misfire策略影响可以看这篇[Quartz 暂停后恢复任务，任务如何不会被misfire处理](/zhuanlan/job/quartz/b/7/)

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
