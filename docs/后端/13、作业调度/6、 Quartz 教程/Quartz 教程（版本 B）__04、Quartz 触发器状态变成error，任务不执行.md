# 04、Quartz 触发器状态变成error，任务不执行
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/10.html
- 分类：作业调度
- 分组：Quartz 教程（版本 B）
在Quartz执行任务的过程中总是伴随着trigger的状态的改变，当trigger的状态变为error时，这个trigger就永远不会再被触发了，不管是不是还没到endTime。

## 2.trigger状态变为error的情况

**2.1在triggeredTrigger时**

在Quartz执行逻辑（一）中说到Quartz在获取到next triggers之后尚未触发，在差不多到时间了之后才去triggered这些triggers，自然此时就需要去获取这些trigger对应的job的信息，调用的是JobStoreSupport中的retrieveJob方法，如下：

可以看到如果job类找不到会抛一个class not found的异常，向上查看调用，可以看到在triggedTrigger方法中有对其处理：

可以看到对retrieveJob方法做了异常的catch处理，catch到JobPersistenceException后会调用updateTriggerState方法把trigger的状态置为error。

**2.2初始化JobRunShell实例时**

从代码中可以很直观的看出来在创建JobRunShell实例的过程中抛出异常也会导致trigger的状态被置为error。

**2.3执行任务时**

在Quartz执行逻辑（一）中说到了最后创建的JobRunShell实例是交由线程池去执行的，如果执行失败则trigger的状态也会被置为error

从注释也不难看出这种情况出现的原因是什么。

**2.4任务执行结束之后**

从2.2创建JobRunShell实例出错调用的改变trigger状态的方法：triggeredJobComplete，不难看出任务执行结束后会根据job执行的结果code去更新trigger的state的时候有几率把状态更新为error。关于这部分的逻辑在Quartz执行逻辑（一）中有说明，下面看一下triggeredJobComplete方法中哪些情况会把trigger的state更新为error：

从代码中不难看出，当结果code为SET_TRIGGER_ERROR或SET_ALL_JOB_TRIGGERS_ERROR时，会把触发器的状态置为ERROR。那么这个intCode是怎么来的呢，在JobRunShell的run方法中可以看到：

是通过trigger的executionComplete方法得到的，该方法里的逻辑比较简单，都是if-else，有必要的可以自己看一下。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
