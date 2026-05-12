# 02、Quartz 触发器状态的变更
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/8.html
- 分类：作业调度
- 分组：Quartz 教程（版本 B）
## 获取trigger

执行时首先要获取到那些将要触发的触发器，会有一个调度线程去查找QRTZ_TRIGGERS表中状态为WAITING的trigger。获取到的trigger的状态会被置为acquired。

## 触发trigger

获取到的将要触发的trigger的nextFireTime和当前时间十分接近时，quartz此时会去把acquired改变为executing。如果不允许job并发执行的，此时还会把当前QRTZ_TRIGGERS表中状态为WAITING，ACQUIRED，PAUSED的改成BLOCKED。当前trigger如果没有下次触发时间，则直接把触发器状态置为COMPLETE。

## 释放trigger

相对于执行流程中的获取来说的释放。在Quartz执行逻辑（一）中说明了最后真正执行job的业务逻辑是在JobRunShell类中run方法中。该方法的最后会获得一个代表本次执行结果的code，然后调用JobStoreSupport中的方法去根据这个代表结果的code来去更新trigger的状态。这个code的类型是Trigger接口中的CompletedExecutionInstruction枚举类。调用的是JobStoreSupport中的triggerdJobComplete方法。下面截取部分该方法的代码：

可以看到该方法根据不同的code值去将trigger的状态值置为不同的值。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
