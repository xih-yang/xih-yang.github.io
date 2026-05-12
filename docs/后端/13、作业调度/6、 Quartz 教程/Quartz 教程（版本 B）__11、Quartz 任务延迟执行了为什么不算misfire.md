# 11、Quartz 任务延迟执行了为什么不算misfire
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/17.html
- 分类：作业调度
- 分组：Quartz 教程（版本 B）
在使用quartz时有时候会发现任务并不是准时执行的，而是有一些延迟，但是为什么不算是misfire呢

## misfire阈值

在[Quartz Misfire的处理](/zhuanlan/job/quartz/b/6/)中说了Misfire的处理是由JobStoreSupport中的一个线程MisfireHandler来处理的，此外在JobStoreSupport中还有一个字段misfireThreshold，它表示misfire的阈值，任务的执行的延迟时间不大于这个值都不算misfire。

## 1misfireThreshold

该字段在getMisfireTime方法中被使用：

可以看到在计算misfireTime的时候使用当前时间减去misfireThreshold的值，也就是延迟在这个阈值范围内的都不算misfire。那么这个getMisFireTime方法在哪被使用呢？怎么发挥作用的呢？

## 作为nextFireTime的下界生效

在acquireNextTrigger方法中有调用：

可以看到在执行数据库查询操作的时候第三个参数传递的是getMisfireTime的返回值，这个参数代表的是noEarilerThan，映射到sql语句中就是nextFireTime要大于等于它的，小于等于前面的noLaterThan+timeWindow。结合前面说的执行时间延迟misfireThreshold范围内的都不算misfire，所以getMisfireTime的返回值应该作为下界，上届是noLaterThan+timeWindow。noLaterThan默认是当前时间加30s，timeWindow的值是三个值中最小的一个。具体逻辑在QuartzSchedulerThread中，可以参考[Quartz 执行流程简介](/zhuanlan/job/quartz/b/1/)。

## 作为nextFireTime的上界生效

那么上界是如何保证的呢，getMisfireTime方法在另外一个方法recoverMisfiredJobs中也有调用：

这个getMisfireTime方法返回值参数映射到要执行的sql语句中就是nextFireTime小于getMisfireTime方法的返回值。这也不难理解，如果nextTime小于了这个当前时间减去misfireThreshold的值，说明以当前为基准，misfireThreshold这么长时间之前该任务就该触发了，如果现在让它触发，那么该任务的触发延迟时间就大于了misfireThreshold的值了，是不合理的。至此misfireThreshold对于上下界的生效过程就说完了。关于misfire的处理可以参考[Quartz Misfire的处理](/zhuanlan/job/quartz/b/6/)

## 总结

misfireThreshold值的生效有两个方面，一个是在获取下次要触发的触发器的时候，这时作为nextFireTime的下界生效。另一方面在判断任务是否misfire，此时作为nextFireTime的上界生效。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
