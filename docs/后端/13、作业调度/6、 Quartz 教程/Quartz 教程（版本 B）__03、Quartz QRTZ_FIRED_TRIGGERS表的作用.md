# 03、Quartz QRTZ_FIRED_TRIGGERS表的作用
- 来源：https://ddkk.com/zhuanlan/job/quartz/1/9.html
- 分类：作业调度
- 分组：Quartz 教程（版本 B）
在Quartz执行逻辑（一）中介绍到的操作基本都是对QRTZ_TRIGGERS表进行的，该表存的是job对应的触发器的记录。本篇介绍一下QRTZ_FIRED_TRIGGERS表在Quartz执行中的作用。

## 向QRTZ_FIRED_TRIGGERS表的时机

在Quartz执行逻辑（一）中说到了，Quartz框架有一个单独的线程去扫描QRTZ_TRIGGERS表，去获取那些将要到nextFireTime的triggers的记录。在获取到之后，要把这些记录中的部分信息插入到QRTZ_FIRED_TRIGGERS表中。如下acquiredNextTiggers方法所示：

可以看到在把trigger加入到结果list之前还调用了insertFiredTrigger方法，该方法就是向QRTZ_FIRED_TRIGGERS表里插入数据。执行的sql语句如下：

从中不难看出该条记录是往QRTZ_FIRED_TRIGGERS表中插入的，且该表有哪些列也比较清楚。

## 删除QRTZ_FIRED_TRIGGERS表中记录的时机

在Quartz执行逻辑（一）中提到了job最后是以JobRunShell实例的形式去执行业务的，执行的是该类中的run方法，在执行完之后会去调用JobStoreSupport中的方法根据不同的结果code去更新trigger的信息。调用的是triggeredJobComplete方法，该方法的最后进行了删除在获取next trigger阶段加入QRTZ_FIRED_TRIGGERS表中记录的操作。如下所示：

执行的sql语句如下：

由sql语句很明显能看出是删除了QRTZ_TRIGGERS表中特定entry_id值的记录。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有
